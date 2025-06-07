from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF
import spacy
import re
from transformers import pipeline
from keybert import KeyBERT
from dateutil.parser import parse as date_parse

app = FastAPI()
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
kw_model = KeyBERT('all-MiniLM-L6-v2')
nlp = spacy.load("en_core_web_sm")

@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    text = extract_text(pdf_bytes)

    summary = summarizer(text[:4000])[0]['summary_text']
    keywords = kw_model.extract_keywords(text, top_n=5)
    metadata = extract_metadata(text)
    categories = classify_text(text)

    return {
        "raw_data": text[:1000],
        "summary": summary,
        "keywords": [kw for kw, _ in keywords],
        "metadata": metadata,
        "categories": categories
    }

def extract_text(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_metadata(text):
    doc = nlp(text)
    entities = {"PERSON": [], "ORG": [], "DATE": [], "ISBN": []}

    for ent in doc.ents:
        if ent.label_ in entities:
            entities[ent.label_].append(ent.text)

    # Try parsing any valid date
    date = "Unknown"
    for d in entities["DATE"]:
        try:
            date = date_parse(d, fuzzy=True).date().isoformat()
            break
        except:
            continue

    # Extract first reasonable author names
    authors = list(dict.fromkeys(entities["PERSON"]))  # Remove duplicates, preserve order
    author_str = ', '.join(authors[:5]) if authors else "Unknown"

    # Conference: check ORG entities or fallback to keyword match
    conference = next((org for org in entities["ORG"] if "conference" in org.lower()), "Unknown")

    # Try to extract ISBN using regex as fallback (NER rarely detects ISBN)
    isbn_match = re.search(r'ISBN[:\s]*([\d\-Xx]+)', text, re.I)
    isbn = isbn_match.group(1) if isbn_match else "Unknown"

    # Title approximation: look at first large sentence not containing author/org info
    title = "Unknown"
    for sent in doc.sents:
        if (len(sent.text.split()) > 5 and
            not any(a in sent.text for a in authors[:3]) and
            not any(o in sent.text for o in entities["ORG"][:3])):
            title = sent.text.strip()
            break

    return {
        "title": title,
        "author": author_str,
        "date": date,
        "conference": conference,
        "isbn": isbn
    }

def classify_text(text):
    return ["Archives", "University Library"]
