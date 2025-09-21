import json
import random
import spacy
import shutil
import os
from spacy.training.example import Example
from spacy.scorer import Scorer
from spacy.util import minibatch, compounding
import warnings
from collections import Counter

# Configuration
MODEL_OUTPUT_DIR = "ner_model"   
JSONL_PATH = "training_data.jsonl"  
N_ITER = 20
DROP_OUT = 0.4
BATCH_SIZE = compounding(4.0, 32.0, 1.001)  # Dynamic batch sizing
LEARNING_RATE = 0.001

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)

def load_clean_data():
    data = []
    skipped = 0
    
    with open(JSONL_PATH, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
                
            try:
                item = json.loads(line)
                text = item["text"]
                
                # Validate text
                if not text or len(text.strip()) < 3:
                    skipped += 1
                    continue
                
                # Convert to spaCy format with validation
                entities = []
                for ent in item["entities"]:
                    start, end, label = ent["start_offset"], ent["end_offset"], ent["label"]
                    
                    # Validate entity boundaries
                    if start >= end or start < 0 or end > len(text):
                        print(f"Warning: Invalid entity boundaries in line {line_num}: ({start}, {end}) for text length {len(text)}")
                        continue
                    
                    # Validate entity text
                    entity_text = text[start:end]
                    if not entity_text.strip():
                        print(f"Warning: Empty entity in line {line_num}")
                        continue
                    
                    entities.append((start, end, label))
                
                if entities:  # Only add examples with valid entities
                    data.append((text, {"entities": entities}))
                else:
                    skipped += 1
                    
            except json.JSONDecodeError as e:
                print(f"Skipping line {line_num} due to JSON error: {e}")
                skipped += 1
            except KeyError as e:
                print(f"Skipping line {line_num} due to missing key: {e}")
                skipped += 1
    
    print(f"Loaded {len(data)} valid examples, skipped {skipped}")
    return data

def analyze_data(train_data):
    print("\n" + "="*50)
    print("TRAINING DATA ANALYSIS")
    print("="*50)
    
    # Count entities by label
    label_counts = Counter()
    text_lengths = []
    entity_lengths = []
    
    for text, annotations in train_data:
        text_lengths.append(len(text))
        for start, end, label in annotations["entities"]:
            label_counts[label] += 1
            entity_lengths.append(end - start)
    
    print(f"Total examples: {len(train_data)}")
    print(f"Average text length: {sum(text_lengths) / len(text_lengths):.1f} chars")
    print(f"Average entity length: {sum(entity_lengths) / len(entity_lengths):.1f} chars")
    
    print("\nEntity distribution:")
    for label, count in label_counts.most_common():
        print(f"  {label}: {count} examples")
    
    # Check for class imbalance
    total_entities = sum(label_counts.values())
    min_class_ratio = min(label_counts.values()) / total_entities
    if min_class_ratio < 0.05:  # Less than 5%
        print(f"\n⚠️  Warning: Class imbalance detected. Smallest class has {min_class_ratio:.1%} of data")
        print("Consider adding more examples for underrepresented classes")

def split_data(data, train_ratio=0.8):
    random.shuffle(data)
    split_idx = int(len(data) * train_ratio)
    return data[:split_idx], data[split_idx:]

def evaluate_model(nlp, eval_data):
    examples = []
    for text, annotations in eval_data:
        doc = nlp.make_doc(text)
        example = Example.from_dict(doc, annotations)
        examples.append(example)
    
    scores = nlp.evaluate(examples)
    return scores

def print_evaluation(scores, dataset_name="Validation"):
    print(f"\n{dataset_name} Scores:")
    print(f"  Token accuracy: {scores['token_acc']:.4f}")
    print(f"  Precision: {scores['ents_p']:.4f}")
    print(f"  Recall: {scores['ents_r']:.4f}")
    print(f"  F1-score: {scores['ents_f']:.4f}")
    
    if 'ents_per_type' in scores:
        print(f"\nPer-entity scores:")
        for entity_type, type_scores in scores['ents_per_type'].items():
            print(f"  {entity_type}:")
            print(f"    Precision: {type_scores['p']:.4f}")
            print(f"    Recall: {type_scores['r']:.4f}")
            print(f"    F1: {type_scores['f']:.4f}")

def create_model():
    nlp = spacy.blank("en")    
    ner = nlp.add_pipe("ner")

    return nlp, ner

def main():
    print("Starting NER model training...")
    
    # Delete existing model directory
    if os.path.exists(MODEL_OUTPUT_DIR):
        shutil.rmtree(MODEL_OUTPUT_DIR)
        print(f"Removed existing model directory: {MODEL_OUTPUT_DIR}")
    
    # Load and analyze data
    all_data = load_clean_data()
    if len(all_data) == 0:
        print("No valid training data found!")
        return
    
    analyze_data(all_data)
    
    # Split data
    train_data, eval_data = split_data(all_data)
    print(f"\nSplit: {len(train_data)} training, {len(eval_data)} validation examples")
    
    # Create model
    nlp, ner = create_model()
    
    # Add labels from training data
    labels_added = set()
    for _, annotations in train_data:
        for start, end, label in annotations["entities"]:
            if label not in labels_added:
                ner.add_label(label)
                labels_added.add(label)
    
    print(f"\nAdded labels: {sorted(labels_added)}")
    
    # Initialize model with training data
    print("Initializing model...")
    examples = []
    for text, annotations in train_data[:100]:  # Use first 100 examples for init
        doc = nlp.make_doc(text)
        examples.append(Example.from_dict(doc, annotations))
    nlp.initialize(lambda: examples)
    
    # Training loop with improved techniques
    print(f"\nTraining for {N_ITER} iterations...")
    print("="*50)
    
    best_f1 = 0.0
    patience = 5
    patience_counter = 0
    
    for iteration in range(N_ITER):
        losses = {}
        random.shuffle(train_data)
        
        # Create batches
        batches = minibatch(train_data, size=BATCH_SIZE)
        
        for batch in batches:
            examples = []
            for text, annotations in batch:
                doc = nlp.make_doc(text)
                example = Example.from_dict(doc, annotations)
                examples.append(example)
            
            # Update model
            nlp.update(examples, drop=DROP_OUT, losses=losses, sgd=None)
        
        # Evaluate every 5 iterations
        if (iteration + 1) % 5 == 0 and eval_data:
            scores = evaluate_model(nlp, eval_data)
            f1_score = scores['ents_f']
            
            print(f"Iteration {iteration + 1:2d}: Loss = {losses.get('ner', 0):.4f}, F1 = {f1_score:.4f}")
            
            # Early stopping logic
            if f1_score > best_f1:
                best_f1 = f1_score
                patience_counter = 0
                # Save best model
                nlp.to_disk(MODEL_OUTPUT_DIR)
            else:
                patience_counter += 1
                
            if patience_counter >= patience:
                print(f"Early stopping at iteration {iteration + 1} (no improvement for {patience} evaluations)")
                break
        else:
            print(f"Iteration {iteration + 1:2d}: Loss = {losses.get('ner', 0):.4f}")
    
    # Final evaluation
    if eval_data:
        print("\n" + "="*50)
        print("FINAL EVALUATION")
        print("="*50)
        
        # Load best model
        nlp = spacy.load(MODEL_OUTPUT_DIR)
        scores = evaluate_model(nlp, eval_data)
        print_evaluation(scores, "Validation")
        
        # Also evaluate on training data to check for overfitting
        train_scores = evaluate_model(nlp, train_data[:100])  # Sample of training data
        print_evaluation(train_scores, "Training (sample)")
        
        # Check for overfitting
        train_f1 = train_scores['ents_f']
        val_f1 = scores['ents_f']
        if train_f1 - val_f1 > 0.1:
            print(f"\n⚠️  Possible overfitting detected (train F1: {train_f1:.4f}, val F1: {val_f1:.4f})")
    
    # Test on diverse examples
    print("\n" + "="*50)
    print("TESTING ON DIVERSE EXAMPLES")
    print("="*50)
    
    test_sentences = [
        # Academic/Educational
        "The University of the Philippines was established in 1908 by Dr. Murray Bartlett in Manila.",
        "Professor Maria Santos published her research in 2023 at Harvard University.",
        
        # Reports/Documents
        "Annual Report 2024: Financial Performance of ABC Corporation in New York",
        "The quarterly newsletter from MIT was written by John Smith in Boston.",
        
        # Mixed entities
        "Dr. Elena Rodriguez from Stanford University presented findings in San Francisco on March 15, 2024.",
        "PUP Main Campus located in Manila has been serving students since 1904.",
        
        # Edge cases
        "Conference proceedings edited by multiple authors in 2023.",
        "The document titled 'Strategic Plan 2025' was approved by the Board.",
    ]
    
    final_nlp = spacy.load(MODEL_OUTPUT_DIR)
    
    for text in test_sentences:
        doc = final_nlp(text)
        print(f"\nText: {text}")
        if doc.ents:
            for ent in doc.ents:
                print(f"  ✓ '{ent.text}' → {ent.label_} (confidence: {max(ent._.scores) if hasattr(ent._, 'scores') else 'N/A'})")
        else:
            print("  ✗ No entities detected")
    
    print(f"\n✅ Training complete! Best model saved to: {MODEL_OUTPUT_DIR}")
    print(f"Best validation F1 score: {best_f1:.4f}")

if __name__ == "__main__":
    # Set random seed for reproducibility
    random.seed(42)
    main()