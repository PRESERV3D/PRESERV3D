import json
import random
import spacy
import shutil
import os
from spacy.training.example import Example

MODEL_OUTPUT_DIR = "ner_model"   
JSONL_PATH = "training_data.jsonl"  
N_ITER = 20  
DROP_OUT = 0.5  # Higher dropout to prevent overfitting

# Delete any existing model directory
if os.path.exists(MODEL_OUTPUT_DIR):
    shutil.rmtree(MODEL_OUTPUT_DIR)
    print(f"Removed existing model directory: {MODEL_OUTPUT_DIR}")

def load_clean_data():
    data = []
    with open("training_data.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:   # Skip empty lines
                continue
            try:
                item = json.loads(line)
                text = item["text"]
                # Convert to spaCy format
                entities = [
                    (ent["start_offset"], ent["end_offset"], ent["label"])
                    for ent in item["entities"]
                ]
                data.append((text, {"entities": entities}))
            except json.JSONDecodeError as e:
                print(f"Skipping bad line: {e}")
    return data

# Create completely fresh model
print("Creating fresh spaCy model...")
nlp = spacy.blank("en")

# Add NER component
ner = nlp.add_pipe("ner")

# Load training data
train_data = load_clean_data()
print(f"Loaded {len(train_data)} clean examples")

# Add labels from training data
labels_added = set()
for _, annotations in train_data:
    for start, end, label in annotations["entities"]:
        if label not in labels_added:
            ner.add_label(label)
            labels_added.add(label)

print(f"Added labels: {sorted(labels_added)}")

# Initialize model
nlp.initialize()
print("Model initialized")

# Print training data for verification
print("\nTraining data verification:")
for i, (text, annotations) in enumerate(train_data, 1):
    print(f"{i}. Text: {text}")
    for start, end, label in annotations["entities"]:
        entity_text = text[start:end]
        print(f"   Entity: '{entity_text}' [{start}:{end}] → {label}")
    print()

# Simple training loop - no batching
print(f"Training for {N_ITER} iterations...")
for iteration in range(N_ITER):
    losses = {}
    random.shuffle(train_data)
    
    for text, annotations in train_data:
        doc = nlp.make_doc(text)
        example = Example.from_dict(doc, annotations)
        nlp.update([example], drop=DROP_OUT, losses=losses)
    
    print(f"Iteration {iteration + 1}: Loss = {losses.get('ner', 0):.4f}")

# Save model
nlp.to_disk(MODEL_OUTPUT_DIR)
print(f"Fresh model saved to {MODEL_OUTPUT_DIR}")

# Immediate testing
print("\n" + "="*50)
print("IMMEDIATE TESTING ON TRAINING DATA")
print("="*50)

for text, _ in train_data:
    doc = nlp(text)
    print(f"\nText: {text}")
    if doc.ents:
        for ent in doc.ents:
            print(f"  ✓ '{ent.text}' → {ent.label_}")
    else:
        print("  ✗ No entities detected")

# Test on new, simple sentences
print("\n" + "="*50)
print("TESTING ON NEW SENTENCES")
print("="*50)

test_sentences = [
    "PUP was established in 1904.",
    "Dr. Garcia works in Manila.",
    "The 2024 Report was published.",
    "University of the Philippines is in Quezon City."
]

for text in test_sentences:
    doc = nlp(text)
    print(f"\nText: {text}")
    if doc.ents:
        for ent in doc.ents:
            print(f"  ✓ '{ent.text}' → {ent.label_}")
    else:
        print("  ✗ No entities detected")

print(f"\n✅ Training complete! Use model: {MODEL_OUTPUT_DIR}")