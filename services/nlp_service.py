import fitz  # PyMuPDF
import spacy
import re
import os
import requests
import base64
import io
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from transformers import pipeline
from keybert import KeyBERT
from dateutil.parser import parse as date_parse

app = FastAPI()
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
kw_model = KeyBERT('all-MiniLM-L6-v2')
nlp = spacy.load("en_core_web_sm")

@app.post("/process-text")
async def process_pdf(file: UploadFile = File(...), filename: str = Form(None)):
    print("Processing file:", file.filename)
    pdf_bytes = await file.read()
    text = extract_text(pdf_bytes)

    summary = summarizer(text[:3000])[0]['summary_text']
    keywords = kw_model.extract_keywords(text, top_n=5)
    metadata = extract_metadata(text, filename)
    categories = classify_text(text)

    return {
        "file_name": filename or file.filename,
        "title": metadata.get("title"),
        "author": metadata.get("author"),
        "date": metadata.get("date"),
        "summary": summary,
        "keywords": [kw for kw, _ in keywords],
        "categories": categories
    }

def extract_text(pdf_bytes):
    print("Extracting text from PDF...")
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""

    for page in doc[:2]:  # Limit to first 2 pages for performance
        text = page.get_text()
        if text.strip():  # If text exists, use it
            print(f"Extracted text from page {page.number + 1}")
            full_text += text
        else:
            # Render page to image
            print(f"Rendering page {page.number + 1} to image...")
            pix = page.get_pixmap(dpi=300)
            img = Image.open(io.BytesIO(pix.tobytes("png")))

            buffered = BytesIO()
            img.save(buffered, format="PNG", optimize=True, quality=85)
            img_bytes = buffered.getvalue()

            json_data={
                "image": base64.b64encode(img_bytes).decode("utf-8")
            }

            # Send image to Node server for OCR
            response = requests.post("http://localhost:3000/ocr", json=json_data)
            if response.ok:
                full_text += response.json().get("text", "")
            else:
                print("OCR server error:", response.text)

    return full_text

def extract_metadata(text, filename=None):
    doc = nlp(text)
    entities = {"PERSON": [], "DATE": []} 

    for ent in doc.ents:
        if ent.label_ in entities:
            entities[ent.label_].append(ent.text.strip())

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    skip_patterns = re.compile(r'(conference|isbn|proceedings|journal|issue|vol\.|pp\.|location|city|country|date|span|–|-|,)', re.I)
    exclusion_patterns = re.compile(r'(compiled|university|institute|department|email|@|abstract|©)', re.I)
    author_pattern = re.compile(r'^[A-Z][a-z]+(\s[A-Z][a-z]+)*$')

    # Prepare filename words for hinting title start
    filename_words = []
    base = ""
    if filename:
        base = os.path.splitext(os.path.basename(filename))[0]
        filename_words = re.split(r'[_\-\s]+', base.lower())

    title_lines = []
    found_title_start = False

    for line in lines:
        if not found_title_start:
            if skip_patterns.search(line):
                continue

            if author_pattern.match(line) or exclusion_patterns.search(line):
                continue

            line_lower = line.lower()
            # Start title if line is long or contains any filename word as hint
            if len(line) > 10 or any(w in line_lower for w in filename_words):
                found_title_start = True
                title_lines.append(line)
        else:
            if author_pattern.match(line) or exclusion_patterns.search(line):
                break
            if len(line) <= 3:
                break
            title_lines.append(line)

    title = ' '.join(title_lines).strip()

    # Fallback to filename if title empty
    if not title and base:
        title = base.replace('_', ' ').replace('-', ' ').title()

    if not title:
        title = "Unknown"

    # Clean up author names
    authors = [a.replace('\n', ' ').strip() for a in entities["PERSON"]]
    authors = list(dict.fromkeys(entities["PERSON"]))
    author_str = ', '.join(authors[:5]) if authors else "Unknown"

    date = "Unknown"
    for d in entities["DATE"]:
        try:
            date = date_parse(d, fuzzy=True).date().isoformat()
            break
        except:
            continue

    return {
        "file_name": filename or "Unknown",
        "title": title,
        "author": author_str,
        "date": date,
    }

def classify_text(text):
    return ["Archives", "University Library"]
