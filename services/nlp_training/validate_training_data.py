import json
from collections import defaultdict

def detect_overlaps(entities):
    """
    Detect overlapping entities and return conflict information
    """
    overlaps = []
    entities_sorted = sorted(entities, key=lambda x: x["start_offset"])
    
    for i in range(len(entities_sorted)):
        for j in range(i + 1, len(entities_sorted)):
            ent1 = entities_sorted[i]
            ent2 = entities_sorted[j]
            
            # Check if entities overlap
            if (ent1["start_offset"] < ent2["end_offset"] and 
                ent2["start_offset"] < ent1["end_offset"]):
                overlaps.append((ent1, ent2))
    
    return overlaps

def resolve_overlaps(text, entities):
    """
    Resolve overlapping entities by applying priority rules and adjusting boundaries
    """
    # Priority order for entity types (higher priority keeps its boundaries)
    priority_order = {
        'AUTHOR': 5,
        'TITLE': 4,
        'ORG': 3,
        'PLACE': 2,
        'DATE': 1
    }
    
    # Sort entities by start position
    entities_sorted = sorted(entities, key=lambda x: x["start_offset"])
    resolved_entities = []
    
    i = 0
    while i < len(entities_sorted):
        current_entity = entities_sorted[i]
        
        # Check for conflicts with this entity
        conflicts = []
        j = i + 1
        while (j < len(entities_sorted) and 
               entities_sorted[j]["start_offset"] < current_entity["end_offset"]):
            conflicts.append(j)
            j += 1
        
        if not conflicts:
            # No conflicts, add as-is
            resolved_entities.append(current_entity)
            i += 1
        else:
            # Resolve conflicts
            conflicting_entities = [current_entity] + [entities_sorted[k] for k in conflicts]
            resolved = resolve_entity_group(text, conflicting_entities, priority_order)
            resolved_entities.extend(resolved)
            i = max(conflicts) + 1
    
    return resolved_entities

def resolve_entity_group(text, conflicting_entities, priority_order):
    """
    Resolve a group of conflicting entities
    """
    # Sort by priority (highest first)
    sorted_entities = sorted(conflicting_entities, 
                           key=lambda x: priority_order.get(x["label"], 0), 
                           reverse=True)
    
    resolved = []
    used_positions = set()
    
    for entity in sorted_entities:
        start = entity["start_offset"]
        end = entity["end_offset"]
        
        # Check if this entity conflicts with already resolved ones
        if any(pos in used_positions for pos in range(start, end)):
            # Try to adjust boundaries
            adjusted = adjust_entity_boundaries(text, entity, used_positions)
            if adjusted and adjusted["start_offset"] < adjusted["end_offset"]:
                resolved.append(adjusted)
                used_positions.update(range(adjusted["start_offset"], adjusted["end_offset"]))
        else:
            resolved.append(entity)
            used_positions.update(range(start, end))
    
    return resolved

def adjust_entity_boundaries(text, entity, used_positions):
    """
    Try to adjust entity boundaries to avoid conflicts
    """
    start = entity["start_offset"]
    end = entity["end_offset"]
    label = entity["label"]
    
    # Try shrinking from the start
    new_start = start
    while new_start < end and new_start in used_positions:
        new_start += 1
    
    # Try shrinking from the end
    new_end = end
    while new_end > new_start and (new_end - 1) in used_positions:
        new_end -= 1
    
    # Make sure we have a reasonable entity
    if new_end - new_start < 2:  # Too short
        return None
    
    # Adjust to word boundaries
    entity_text = text[new_start:new_end].strip()
    if not entity_text:
        return None
    
    # Find the adjusted entity in the text
    adjusted_start = text.find(entity_text, new_start - 2, new_end + 2)
    if adjusted_start != -1:
        return {
            "start_offset": adjusted_start,
            "end_offset": adjusted_start + len(entity_text),
            "label": label
        }
    
    return None

def analyze_overlaps(filename):
    """
    Analyze overlap patterns in the dataset
    """
    print("=== OVERLAP ANALYSIS ===")
    
    with open(filename, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    total_overlaps = 0
    overlap_patterns = defaultdict(int)
    problematic_lines = []
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
            
        try:
            example = json.loads(line)
            text = example["text"]
            entities = example["entities"]
            
            overlaps = detect_overlaps(entities)
            if overlaps:
                total_overlaps += len(overlaps)
                problematic_lines.append(i)
                
                print(f"\nLine {i}: {len(overlaps)} overlap(s)")
                print(f"Text: {text}")
                for ent1, ent2 in overlaps:
                    pattern = f"{ent1['label']}-{ent2['label']}"
                    overlap_patterns[pattern] += 1
                    
                    text1 = text[ent1["start_offset"]:ent1["end_offset"]]
                    text2 = text[ent2["start_offset"]:ent2["end_offset"]]
                    
                    print(f"  Overlap: {ent1['label']} '{text1}' [{ent1['start_offset']}:{ent1['end_offset']}]")
                    print(f"           {ent2['label']} '{text2}' [{ent2['start_offset']}:{ent2['end_offset']}]")
                    
        except Exception as e:
            print(f"Line {i}: Error - {e}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Lines with overlaps: {len(problematic_lines)}")
    print(f"Total overlaps: {total_overlaps}")
    print(f"Overlap patterns:")
    for pattern, count in sorted(overlap_patterns.items(), key=lambda x: x[1], reverse=True):
        print(f"  {pattern}: {count}")
    
    return problematic_lines

def fix_overlapping_entities(input_filename, output_filename):
    """
    Fix overlapping entities in the training data
    """
    print(f"\n=== FIXING OVERLAPS ===")
    
    with open(input_filename, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    fixed_examples = []
    stats = {
        "total_examples": 0,
        "examples_with_overlaps": 0,
        "overlaps_resolved": 0,
        "entities_removed": 0,
        "entities_adjusted": 0
    }
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
            
        try:
            example = json.loads(line)
            text = example["text"]
            entities = example["entities"]
            
            stats["total_examples"] += 1
            
            # Check for overlaps
            overlaps = detect_overlaps(entities)
            if overlaps:
                stats["examples_with_overlaps"] += 1
                stats["overlaps_resolved"] += len(overlaps)
                
                print(f"Line {i}: Resolving {len(overlaps)} overlaps")
                
                original_count = len(entities)
                resolved_entities = resolve_overlaps(text, entities)
                
                stats["entities_removed"] += original_count - len(resolved_entities)
                
                # Show what was changed
                for ent in resolved_entities:
                    original_ent = None
                    for orig in entities:
                        if (orig["label"] == ent["label"] and 
                            abs(orig["start_offset"] - ent["start_offset"]) < 5):
                            original_ent = orig
                            break
                    
                    if (original_ent and 
                        (original_ent["start_offset"] != ent["start_offset"] or 
                         original_ent["end_offset"] != ent["end_offset"])):
                        stats["entities_adjusted"] += 1
                        
                        old_text = text[original_ent["start_offset"]:original_ent["end_offset"]]
                        new_text = text[ent["start_offset"]:ent["end_offset"]]
                        print(f"  Adjusted {ent['label']}: '{old_text}' → '{new_text}'")
                
                entities = resolved_entities
            
            # Add the fixed example
            fixed_example = {
                "text": text,
                "entities": entities
            }
            fixed_examples.append(fixed_example)
            
        except Exception as e:
            print(f"Line {i}: Error processing - {e}")
    
    # Write fixed data
    with open(output_filename, "w", encoding="utf-8") as f:
        for example in fixed_examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")
    
    print(f"\n=== FIXING RESULTS ===")
    print(f"Total examples: {stats['total_examples']}")
    print(f"Examples with overlaps: {stats['examples_with_overlaps']}")
    print(f"Overlaps resolved: {stats['overlaps_resolved']}")
    print(f"Entities adjusted: {stats['entities_adjusted']}")
    print(f"Entities removed: {stats['entities_removed']}")
    print(f"Fixed examples saved: {len(fixed_examples)}")
    
    return len(fixed_examples) > 0

def validate_no_overlaps(filename):
    """
    Validate that the fixed file has no overlaps
    """
    print(f"\n=== VALIDATING NO OVERLAPS ===")
    
    with open(filename, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    overlap_count = 0
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
            
        try:
            example = json.loads(line)
            entities = example["entities"]
            
            overlaps = detect_overlaps(entities)
            if overlaps:
                overlap_count += len(overlaps)
                print(f"Line {i}: Still has {len(overlaps)} overlaps!")
                
        except Exception as e:
            print(f"Line {i}: Error - {e}")
    
    if overlap_count == 0:
        print("✅ No overlaps found! The data is ready for training.")
    else:
        print(f"⚠️  Still found {overlap_count} overlaps that need manual review.")
    
    return overlap_count == 0

if __name__ == "__main__":
    input_file = "training_data.jsonl"
    output_file = "training_data_clean.jsonl"
    
    # Step 1: Analyze the overlap patterns
    problematic_lines = analyze_overlaps(input_file)
    
    # Step 2: Fix the overlaps
    if fix_overlapping_entities(input_file, output_file):
        print(f"\n✅ Clean data saved to: {output_file}")
        
        # Step 3: Validate the results
        validate_no_overlaps(output_file)
        
        print(f"\nUse '{output_file}' for your NER training - it should work without errors!")
    else:
        print("❌ Could not fix the overlapping entities")