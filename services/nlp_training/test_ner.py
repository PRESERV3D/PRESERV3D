import spacy
from spacy import displacy

# Load your trained model
model_path = "ner_model"
nlp = spacy.load(model_path)

print("=== MODEL DIAGNOSTICS ===")
print(f"Pipeline components: {nlp.pipe_names}")

# Check what entity labels the model knows
if "ner" in nlp.pipe_names:
    ner = nlp.get_pipe("ner")
    print(f"Known entity labels: {list(ner.labels)}")
    print(f"Number of labels: {len(ner.labels)}")
else:
    print("ERROR: No NER component found!")
    exit()

print("\n=== TESTING WITH DIFFERENT TEXTS ===")

# --- Test Cases ---
test_cases = [
    {
        "name": "Your original test",
        "text": (
            "The 2025 Annual Report was prepared by Jane Doe at University of Example. "
            "It covers the fiscal year from January 1, 2025 to December 31, 2025."
        )
    },
    {
        "name": "PUP style",
        "text": (
            "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES 2025 Annual Report was prepared by "
            "Dr. Emanuel C. De Guzman. The report covers January 2025 to December 2025."
        )
    },
    {
        "name": "Government report",
        "text": (
            "Republic of the Philippines Office of the President. "
            "President Gloria Macapagal Arroyo visited Manila in 1998."
        )
    },
    {
        "name": "Academic document style",
        "text": (
            "The research was conducted by Pedro Melo at Instituto Universitario de Lisboa "
            "in Madrid, Spain during 2022."
        )
    },
    {
        "name": "Simple academic",
        "text": "Dr. Samuel Salvador from Polytechnic University published research in 2003."
    },

    # === New author-format test cases ===
    {
        "name": "Single author with initials",
        "text": "Diaz, J.M. presented a study on computer science in 2023."
    },
    {
        "name": "Author with spaced initials",
        "text": "Garcia, M. A. conducted the experiment at Harvard University."
    },
    {
        "name": "Two authors separated by and",
        "text": "Diaz, J.M. and Santos, L.R. collaborated on the 2024 Annual PUP Report."
    },
    {
        "name": "Multiple authors with commas",
        "text": "Lopez, A., Cruz, B.C., and Tan, D. wrote the Polytechnic University Review 2022."
    },
    {
        "name": "Lastname Firstname reversed",
        "text": "John P. Smith, together with Diaz, J.M., worked on the AI conference paper."
    },
    {
        "name": "Complex academic citation",
        "text": (
            "In their seminal paper, Santos, L.R., dela Cruz, P.M., and Velasco, R. M. "
            "analyzed the economic impact of renewable energy in 2021."
        )
    },
    {
        "name": "With noisy  text",
        "text": (
            ". \\ -T.- -m is ** m I * i v/parQ I I I I I < j SCHOLARSHIP & FIN. ASST. OFFICE VOL."
            "N0.59 if: I I Years FOREWORD As PUP marks its centennial anniversary the whole"
            "community proudly joins in commemorating the event. "
        )
    },
]

# --- Helper to analyze text ---
def analyze_text(text, name):
    print(f"\n--- {name} ---")
    print(f"Text: {text}\n")

    doc = nlp(text)

    if doc.ents:
        print("✅ Entities found:")
        for ent in doc.ents:
            # Confidence scores aren’t standard in spaCy, but show placeholder if extension exists
            confidence = getattr(ent._, 'score', 'N/A') if hasattr(ent._, 'score') else 'N/A'
            print(f"  • '{ent.text}' → {ent.label_} (confidence: {confidence})")
    else:
        print("❌ No entities detected")

    print("Token analysis:")
    for token in doc:
        if token.ent_iob_ != 'O':
            print(f"  Token: '{token.text}' → {token.ent_iob_}-{token.ent_type_}")

# Run all tests
for case in test_cases:
    analyze_text(case["text"], case["name"])
