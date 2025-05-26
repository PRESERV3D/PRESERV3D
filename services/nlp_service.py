from typing import Counter
from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF
import re
from transformers import pipeline
from keybert import KeyBERT
from dateutil.parser import parse as date_parse

app = FastAPI()
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
kw_model = KeyBERT('all-MiniLM-L6-v2')

@app.get("/")
async def root():
    return {"message": "Hello, PRESERV3D!"}

@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    text = extract_text(pdf_bytes)

    summary = summarizer(text[:2000])[0]['summary_text']
    keywords = kw_model.extract_keywords(text, top_n=10)
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

import re
from dateutil.parser import parse as date_parse

def extract_metadata(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Extract ISBN
    isbn_match = re.search(r'ISBN[:\s]*([\d\-X]+)', text, re.I)
    isbn = isbn_match.group(1) if isbn_match else "Unknown"
    
    # Extract conference name - look for lines with 'conference' and clean them up
    conference = "Unknown"
    for line in lines:
        if 'conference' in line.lower():
            # Clean up the conference name
            conference = re.sub(r'^\d+\w*\s*', '', line)  # Remove leading numbers/ordinals
            conference = re.sub(r'\s*\(\w+\)\s*$', '', conference)  # Remove trailing acronyms in parentheses
            break
    
    # Extract date with improved patterns
    date = "Unknown"
    date_patterns = [
        r'\d{1,2}\s*[-–]\s*\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}',
        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}[-–]\d{1,2},?\s+\d{4}',
        r'\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}',
        r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b',
        r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
        r'\b\d{4}\b'
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.I)
        if match:
            try:
                date = date_parse(match.group(0), fuzzy=True).date().isoformat()
                break
            except Exception:
                date = match.group(0)
                break
    
    # More precise author pattern for academic names
    author_pattern = re.compile(
        r'^[A-ZÀ-Ÿ][a-zà-ÿ\'-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ\'-]+)*$'
    )
    
    # Stronger affiliation/exclusion patterns for academic papers
    exclusion_patterns = re.compile(
        r'(?:'
        r'instituto|universit|college|school|department|faculty|centro|laboratory|lab\b'
        r'|istar|iscte|iul|portugal|lisboa|madrid|spain|brasil|italy|france|germany'
        r'|email|@|\.com|\.org|\.edu|\.pt|\.es|\.it|\.fr|\.de|\.uk'
        r'|abstract|introduction|keywords|conclusion|references|acknowledgment'
        r'|isbn|issn|doi|conference|proceedings|journal'
        r'|phone|tel|fax|address|street|avenue|road'
        r'|\d{4}|\d+[-/]\d+|vol\.|no\.|pp\.'  # years, dates, volume numbers
        r'|corresponding|affiliation|received|accepted|published'
        r')', 
        re.IGNORECASE
    )
    
    # Find title - look for text after ISBN and before first author
    title_lines = []
    isbn_found = False
    title_complete = False
    
    for i, line in enumerate(lines):
        # Skip until we find ISBN
        if not isbn_found:
            if re.search(r'ISBN', line, re.I):
                isbn_found = True
            continue
        
        # Skip empty lines and obvious metadata
        if not line or re.search(r'^\d{2}\s*[–-]\s*\d{2}|^\d{4}|conference|proceedings', line, re.I):
            continue
            
        # Check if this looks like an author name
        if author_pattern.match(line) and not exclusion_patterns.search(line):
            # Verify it's really an author by checking next few lines for affiliation
            has_affiliation = False
            for j in range(1, 4):  # Check next 3 lines
                if i + j < len(lines):
                    next_line = lines[i + j]
                    if exclusion_patterns.search(next_line) and not re.search(r'abstract', next_line, re.I):
                        has_affiliation = True
                        break
            
            if has_affiliation:
                title_complete = True
                break
        
        # If we haven't found title completion yet, add this line
        if not title_complete and not exclusion_patterns.search(line):
            title_lines.append(line)
    
    # Clean up title
    title = ' '.join(title_lines).strip()
    title = re.sub(r'\s+', ' ', title)
    
    # Extract authors - look for names followed by affiliations
    authors = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Skip until after title area
        if not isbn_found or any(t_line in line for t_line in title_lines):
            i += 1
            continue
            
        # Check if line matches author pattern
        if author_pattern.match(line) and not exclusion_patterns.search(line):
            # Verify this is an author by checking for affiliation pattern in next lines
            is_author = False
            affiliation_found = False
            
            # Look ahead for affiliation indicators
            for j in range(1, 5):  # Check next 4 lines
                if i + j >= len(lines):
                    break
                    
                next_line = lines[i + j].strip()
                if not next_line:
                    continue
                    
                # Strong indicators of affiliation
                if re.search(r'institute|university|college|department|istar|iscte', next_line, re.I):
                    affiliation_found = True
                    break
                    
                # Email pattern
                if '@' in next_line and '.' in next_line:
                    affiliation_found = True
                    break
                    
                # If we hit another potential author name, stop looking
                if author_pattern.match(next_line) and not exclusion_patterns.search(next_line):
                    break
            
            # Additional validation: reasonable name length and structure
            name_parts = line.split()
            if (affiliation_found and 
                len(name_parts) >= 2 and 
                len(line) < 50 and  # Not too long
                not any(char.isdigit() for char in line) and  # No numbers
                not line.isupper()):  # Not all caps
                
                authors.append(line)
                is_author = True
            
            # If we found an author, skip ahead past their affiliation block
            if is_author:
                j = 1
                while i + j < len(lines) and j < 10:  # Look ahead max 10 lines
                    next_line = lines[i + j].strip()
                    if (author_pattern.match(next_line) and 
                        not exclusion_patterns.search(next_line) and
                        len(next_line.split()) >= 2):
                        # Found next author, don't skip this line
                        break
                    j += 1
                i += j - 1  # Skip the affiliation block
        
        i += 1
    
    # Clean up authors
    cleaned_authors = []
    for author in authors:
        author = re.sub(r'\s+', ' ', author.strip())
        author = re.sub(r'[.,;]+$', '', author)  # Remove trailing punctuation
        if author and author not in cleaned_authors:  # Avoid duplicates
            cleaned_authors.append(author)
    
    author_str = ', '.join(cleaned_authors) if cleaned_authors else "Unknown"
    
    return {
        "title": title or "Unknown",
        "author": author_str,
        "date": date,
        "conference": conference,
        "isbn": isbn
    }

def classify_text(text):
    return ["Archives", "University Library"]
