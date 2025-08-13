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

            # If OCR fallback required, just return that response immediately
            if isinstance(result, dict) and result.get("status") == "ocr_required":
                result["filename"] = filename or file.filename
                return result

            text = result
        else:
            return {"error": "No file or raw text provided"}

        # Only proceed if we have some text extracted
        if text and len(text.strip()) >= 100:
            cleaned_text = clean_text_for_nlp(text)

            try:
                summary = summarizer(cleaned_text[:4000])[0]['summary_text']
            except Exception as e:
                print("Summarizer error:", e)
                summary = "Summary not available"

            try:
                keywords = kw_model.extract_keywords(cleaned_text, top_n=10)
            except Exception as e:
                print("Keyword extraction error:", e)
                keywords = []

            metadata = extract_metadata(cleaned_text, filename)

            return {
                "file_name": filename or file.filename,
                "title": metadata.get("title"),
                "author": metadata.get("author"),
                "date": metadata.get("date"),
                "document_type": metadata.get("document_type"),
                "organization": metadata.get("organization"),
                "summary": summary,
                "keywords": [kw for kw, _ in keywords]
            }
        else:
            # No searchable text found 
            return {"error": "No searchable text extracted to process"}

    except Exception as e:
        print("NLP error:", str(e))
        return {"error": str(e)}
    
def clean_text_for_nlp(text):
    cleaned = re.sub(r'[\x00-\x1F\x7F-\x9F]', ' ', text)
    cleaned = re.sub(r'[^A-Za-z0-9\s.,;:!?()\[\]{}\-_"\'@#$%^&*+=<>/\\|`~°€£¥§\n]+', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned

def extract_text(pdf_bytes, filename=None):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_with_text = []
    pages_for_ocr = []

    print("Checking first 8 pages for searchable text...")

    # Check all first 8 pages for text
    for page in doc[:8]:
        text = page.get_text().strip()
        if text:
            pages_with_text.append((page.number + 1, text))
        else:
            pages_for_ocr.append(page)

    # If no text on any of the pages, return OCR images for those pages
    if len(pages_with_text) == 0 and pages_for_ocr:
        print("No searchable text found, converting pages to images for OCR...")
        ocr_pages = []
        for page in pages_for_ocr:
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            encoded = base64.b64encode(img_bytes).decode("utf-8")
            ocr_pages.append({
                "page_number": page.number + 1,
                "image_base64": encoded
            })
        return {
            "status": "ocr_required",
            "pages": ocr_pages,
            "filename": filename
        }

    # Otherwise, return combined searchable text from all pages that have it
    full_text = "\n".join(text for _, text in pages_with_text)
    print("Extracted combined text:", full_text[:1000])
    return full_text.strip()

def detect_document_type(text, filename=None):
    """Detect the type of document based on content and filename patterns"""
    
    text_lower = text.lower()
    filename_lower = (filename or "").lower()
    
    # Document type patterns
    type_patterns = {
        "annual_report": [
            r"annual\s+report",
            r"yearly\s+report", 
            r"financial\s+year",
            r"fiscal\s+year",
            r"board\s+of\s+directors",
            r"financial\s+statement",
            r"president'?s\s+message",
            r"chairman'?s\s+letter"
        ],
        "memorabilia": [
            r"class\s+of\s+\d{4}",
            r"graduating\s+class",
            r"yearbook",
            r"alumni",
            r"graduation\s+ceremony",
            r"commencement",
            r"reunion",
            r"class\s+notes",
            r"memory\s+book"
        ],
        "newsletter": [
            r"newsletter",
            r"bulletin",
            r"news\s+update",
            r"quarterly\s+update",
            r"monthly\s+report",
            r"campus\s+news"
        ],
        "academic_catalog": [
            r"course\s+catalog",
            r"academic\s+catalog",
            r"curriculum",
            r"degree\s+requirements",
            r"course\s+offerings",
            r"academic\s+calendar"
        ],
        "brochure": [
            r"brochure",
            r"prospectus",
            r"information\s+packet",
            r"program\s+overview",
            r"welcome\s+packet"
        ],
        "minutes": [
            r"meeting\s+minutes",
            r"board\s+minutes",
            r"committee\s+meeting",
            r"senate\s+minutes",
            r"council\s+meeting"
        ],
        "research_report": [
            r"research\s+report",
            r"technical\s+report",
            r"white\s+paper",
            r"policy\s+brief",
            r"study\s+findings"
        ]
    }
    
    # Check filename first
    for doc_type, patterns in type_patterns.items():
        for pattern in patterns:
            if re.search(pattern, filename_lower):
                return doc_type.replace("_", " ").title()
    
    # Check content
    for doc_type, patterns in type_patterns.items():
        score = 0
        for pattern in patterns:
            if re.search(pattern, text_lower):
                score += 1
        
        # If multiple patterns match, it's likely this document type
        if score >= 2:
            return doc_type.replace("_", " ").title()
        elif score == 1 and len(patterns) <= 3:  # For types with fewer patterns
            return doc_type.replace("_", " ").title()
    
    return "Document"

def extract_organization_info(text):
    """Extract organization/institution information"""
    
    # Common organizational patterns
    org_patterns = [
        r"([A-Z][a-zA-Z\s]+(?:University|College|Institute|School|Academy))",
        r"([A-Z][a-zA-Z\s]+(?:Corporation|Company|Inc\.|LLC|Foundation))",
        r"([A-Z][a-zA-Z\s]+(?:Department|Division|Office|Bureau))",
        r"(?:University\s+of\s+|College\s+of\s+)([A-Z][a-zA-Z\s]+)",
        r"([A-Z][A-Z\s]+)(?:\s+University|\s+College|\s+Institute)",  # All caps names
    ]
    
    organizations = set()
    
    for pattern in org_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            org = match.group(1).strip()
            # Clean up the match
            org = re.sub(r'\s+', ' ', org)  # Multiple spaces to single
            if len(org) > 3 and len(org.split()) <= 6:  # Reasonable length
                organizations.add(org)
    
    # Also look for common university abbreviations
    abbrev_pattern = r'\b([A-Z]{2,6})(?:\s+University|\s+College)?\b'
    abbrev_matches = re.finditer(abbrev_pattern, text)
    for match in abbrev_matches:
        abbrev = match.group(1)
        if len(abbrev) >= 2 and abbrev not in ['PDF', 'USA', 'LLC', 'INC']:
            organizations.add(abbrev)
    
    return list(organizations)[:3]  # Return top 3

def extract_institutional_metadata(text, filename=None):
    """Enhanced metadata extraction for institutional documents"""
    
    doc = nlp(text)
    entities = {"PERSON": [], "DATE": [], "ORG": []}

    # Extract named entities
    for ent in doc.ents:
        if ent.label_ in entities:
            entities[ent.label_].append(ent.text.strip())
    
    # Detect document type
    document_type = detect_document_type(text, filename)
    
    # Extract organization info
    organizations = extract_organization_info(text)
    if entities["ORG"]:
        organizations.extend(entities["ORG"][:2])
    
    # Remove duplicates and clean
    organizations = list(dict.fromkeys(organizations))[:3]
    
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    
    # Enhanced patterns for institutional documents
    skip_patterns = re.compile(
        r'(conference|isbn|proceedings|journal|issue|vol\.|pp\.|location|'
        r'city|country|date|span|–|-|,|page\s+\d+|copyright|©|®|™)', re.I
    )
    
    exclusion_patterns = re.compile(
        r'(compiled|email|@|abstract|table\s+of\s+contents|index|'
        r'www\.|http|\.com|\.org|\.edu)', re.I
    )
    
    # More flexible name pattern for institutional contexts
    name_pattern = re.compile(r'^(?:Dr\.?\s+|Prof\.?\s+|Mr\.?\s+|Ms\.?\s+|Mrs\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z]\.?\s+)?(?:\s+[A-Z][a-z]+)+(?:\s*,?\s*(?:Ph\.?D\.?|M\.?D\.?|Jr\.?|Sr\.?))?$')
    
    # Prepare filename words for hinting title start
    filename_words = []
    base = ""
    if filename:
        base = os.path.splitext(os.path.basename(filename))[0]
        filename_words = re.split(r'[_\-\s]+', base.lower())
    
    # Title extraction with better handling for institutional docs
    title_lines = []
    found_title_start = False
    
    # Look for titles in first 20 lines
    search_lines = lines[:20]
    
    for i, line in enumerate(search_lines):
        if not found_title_start:
            # Skip very short lines at the start
            if len(line) <= 3:
                continue
                
            if skip_patterns.search(line):
                continue
            
            # Don't start with names (unless it's a clear title format)
            if name_pattern.match(line) and not any(word in line.lower() for word in ['report', 'annual', 'newsletter']):
                continue
                
            if exclusion_patterns.search(line):
                continue
            
            line_lower = line.lower()
            
            # Better title detection for institutional documents
            title_indicators = [
                len(line) > 110,  # Longer lines more likely to be titles
                any(w in line_lower for w in filename_words),
                any(word in line_lower for word in ['annual', 'report', 'newsletter', 'bulletin', 'catalog', 'memorabilia']),
                line.isupper() and len(line) > 8,  # All caps titles
                re.search(r'\b(class\s+of\s+\d{4}|fiscal\s+year|academic\s+year)', line_lower)
            ]
            
            if any(title_indicators):
                found_title_start = True
                title_lines.append(line)
        else:
            # Continue adding lines to title
            if name_pattern.match(line):
                break
            if exclusion_patterns.search(line):
                break
            if len(line) <= 3:
                break
            if skip_patterns.search(line):
                break
            
            # Stop if we hit what looks like body text
            if len(line) > 100 and not line.isupper():
                break
                
            title_lines.append(line)
            
            # Don't let title get too long
            if len(title_lines) >= 10:
                break
    
    title = ' '.join(title_lines).strip()
    
    # Clean up title
    title = re.sub(r'\s+', ' ', title)  # Multiple spaces to single
    
    # Fallback to filename if title empty or too short
    if not title or len(title) < 10:
        if base:
            title = base.replace('_', ' ').replace('-', ' ').title()
        else:
            title = f"{document_type} Document"
    
    if not title:
        title = "Unknown Document"
    
    # Enhanced author/contributor extraction for institutional docs
    contributors = []
    
    # Add people from NER
    for person in entities["PERSON"][:10]:
        clean_person = person.replace('\n', ' ').strip()
        if clean_person and len(clean_person) > 2:
            contributors.append(clean_person)
    
    # Look for specific contributor patterns
    contributor_patterns = [
        r'(?:President|Chancellor|Director|Dean|Chair(?:man|woman|person)?|Principal):\s*([A-Z][a-zA-Z\s\.]+)',
        r'(?:Prepared\s+by|Compiled\s+by|Edited\s+by):\s*([A-Z][a-zA-Z\s\.]+)',
        r'(?:Message\s+from|Letter\s+from)\s+([A-Z][a-zA-Z\s\.]+)',
    ]
    
    for pattern in contributor_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            contributor = match.group(1).strip()
            if contributor and len(contributor.split()) <= 4:
                contributors.append(contributor)
    
    # Clean and deduplicate contributors
    contributors = list(dict.fromkeys(contributors))[:10]
    contributor_str = ', '.join(contributors) if contributors else "Unknown"
    
    # Enhanced date extraction
    date = "Unknown"
    
    # Look for specific date patterns common in institutional docs
    date_patterns = [
        r'(?:Academic\s+Year|Fiscal\s+Year|Class\s+of)\s+(\d{4}(?:-\d{2,4})?)',
        r'(?:Annual\s+Report|Year\s+Ending?)\s+(\d{4})',
        r'(\d{4})\s+(?:Annual\s+Report|Yearbook)',
        r'(?:Spring|Fall|Summer|Winter)\s+(\d{4})',
        r'(\d{1,2}/\d{1,2}/\d{4})',
        r'(\d{4}-\d{2}-\d{2})',
        r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})',
    ]
    
    for pattern in date_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                date_str = match.group(1)
                if len(date_str) == 4:  # Just year
                    date = f"{date_str}-01-01"
                else:
                    parsed_date = date_parse(date_str, fuzzy=True)
                    date = parsed_date.date().isoformat()
                break
            except:
                continue
    
    # Fallback to NER dates
    if date == "Unknown":
        for d in entities["DATE"]:
            try:
                parsed_date = date_parse(d, fuzzy=True)
                date = parsed_date.date().isoformat()
                break
            except:
                continue
    
    return {
        "file_name": filename or "Unknown",
        "title": title,
        "author": contributor_str,
        "date": date,
        "document_type": document_type,
        "organization": ', '.join(organizations) if organizations else "Unknown",
    }

def extract_metadata(text, filename=None):
    return extract_institutional_metadata(text, filename)

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
