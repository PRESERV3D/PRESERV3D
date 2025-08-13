import fitz
import spacy
import re
import os
import base64
import json
import subprocess
from fastapi import FastAPI, UploadFile, File, Form
from transformers import pipeline
from keybert import KeyBERT
from dateutil.parser import parse as date_parse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
kw_model = KeyBERT('all-MiniLM-L6-v2')
nlp = spacy.load("en_core_web_sm")

@app.post("/process-text")
async def process_pdf(file: UploadFile = File(None), filename: str = Form(None), raw_text: str = Form(None)):
    try:
        print("Received file:", filename)

        if raw_text:
            text = raw_text
        elif file:
            print("File:", file) 
            pdf_bytes = await file.read()
            result = extract_text(pdf_bytes, file.filename)

            # OCR fallback
            if isinstance(result, dict) and result.get("status") == "ocr_required":
                result["filename"] = filename or file.filename
                return result

            text = result
            print("Extracted text:", text[:1000])  # Print first 1000 chars for debugging
        else:
            return {"error": "No file or raw text provided"}

        summary = summarizer(text[:3000])[0]['summary_text']
        keywords = kw_model.extract_keywords(text, top_n=5)
        metadata = extract_metadata(text, filename)

        print("Summary:", summary)
        print("Keywords:", keywords)

        return {
            "file_name": filename or file.filename,
            "title": metadata.get("title"),
            "author": metadata.get("author"),
            "date": metadata.get("date"),
            "summary": summary,
            "keywords": [kw for kw, _ in keywords]
        }
    except Exception as e:
        print("NLP error:", str(e))

def extract_text(pdf_bytes, filename=None):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""
    print("Extracting text from PDF...")

    for page in doc[:10]:  # Limit to first 10 pages for performance
        text = page.get_text()
        if text.strip():  # If text exists, use it
            print(f"Extracted text from page {page.number + 1}")
            full_text += text
            print("Extracted text: ", full_text[:1000])  # Print first 1000 chars for debugging
        else:
            # Render page to image
            print("Converting to image...")
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")

            encoded = base64.b64encode(img_bytes).decode("utf-8")

            return {
                "status": "ocr_required",
                "image_base64": encoded,
                "filename": filename
            }

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

@app.get("/related-links")
async def related_links(title: str, author: str = "", categories: str = ""):
    try:
        result = subprocess.run(
            ["node", "web_scraper.js", title, author, categories],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        return {"error": e.stderr or "Puppeteer script failed"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON from Puppeteer"}

