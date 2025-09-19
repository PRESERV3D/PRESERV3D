from fastapi.responses import JSONResponse
import fitz
import spacy
import re
import os
import base64
import json
import subprocess
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from transformers import pipeline
from keybert import KeyBERT
from dateutil.parser import parse as date_parse
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
from deepdiff import DeepDiff

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9000", "https://preserv3d.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
kw_model = KeyBERT('all-MiniLM-L6-v2')
nlp = spacy.load("nlp_training/ner_model")

@app.post("/process-text")
async def process_pdf(
    file: UploadFile = File(None),
    filename: str = Form(None),
    raw_text: str = Form(None)
):
    keywords, summary = [], None

    try:
        print("Received file:", filename)

        if raw_text:
            text = raw_text
        elif file:
            print("File:", file) 
            pdf_bytes = await file.read()
            result = extract_text(pdf_bytes, file.filename)

            # If OCR fallback required, return OCR response immediately
            if isinstance(result, dict) and result.get("status") == "ocr_required":
                result["filename"] = filename or file.filename
                return result

            # Handle the case where extract_text returns a dict with success status
            if isinstance(result, dict) and result.get("status") == "success":
                text = result.get("text", "")
            elif isinstance(result, str):
                # Legacy case where extract_text returns string directly
                text = result
            else:
                return {"error": "Failed to extract text from PDF"}
        else:
            return {"error": "No file or raw text provided"}

        # Only proceed if we have some text extracted
        if text and len(text.strip()) >= 100:
            cleaned_text = clean_text(text)

            metadata = extract_metadata(cleaned_text, filename or (file.filename if file else None))

            # Keyword Extraction
            try:
                kw_result = kw_model.extract_keywords(cleaned_text, top_n=10)
                if kw_result:
                    keywords = [kw for kw, _ in kw_result]
                else:
                    keywords = []
            except Exception as e:
                print("Keyword extraction error:", e)
                keywords = []

            # Summarization
            try:
                result = summarizer(
                    cleaned_text[:4000],
                    max_length=200,
                    min_length=50,
                    do_sample=False
                )
                if result and isinstance(result, list) and len(result) > 0:
                    summary = result[0].get('summary_text', '')
                else:
                    print("Summarizer returned no output")
            except Exception as e:
                print("Summarizer error:", e)

            return {
                "file_name": filename or (file.filename if file else None),
                "title": metadata.get("title"),
                "author": metadata.get("author"),
                "date": metadata.get("date"),
                "categories": metadata.get("categories"),
                "organization": metadata.get("organization"),
                "summary": summary,
                "keywords": keywords,  # Fixed: was [kw for kw, _ in keywords] but keywords is already a list
                "extracted_text": cleaned_text,
            }
        else:
            return {"error": "No searchable text extracted to process"}

    except Exception as e:
        print("NLP error:", str(e))
        return {"error": str(e)}

def clean_text(text):
    cleaned = re.sub(r'[\x00-\x1F\x7F-\x9F]', ' ', text)
    cleaned = re.sub(r'[^A-Za-z0-9\s.,;:!?()\[\]{}\-_"\'@#$%^&*+=<>/\\|`~°€£¥§\n]+', ' ', cleaned)
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)      
    cleaned = re.sub(r'\n{2,}', '\n', cleaned)     
    cleaned = cleaned.strip()

    return cleaned

def extract_text(pdf_bytes, filename=None, char_limit=5000):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_with_text = []
    pages_for_ocr = []
    accumulated_text = ""
    total_chars = 0

    print(f"Extracting text from PDF until {char_limit} characters are reached...")

    # Process pages one by one until we reach the character limit
    for page_num, page in enumerate(doc):
        text = page.get_text().strip()
        
        if text:
            print(f"Analyzing page {page.number + 1}...")
            
            # Check if adding this page would exceed the limit
            if total_chars + len(text) <= char_limit:
                # Add the entire page
                pages_with_text.append((page.number + 1, text))
                accumulated_text += text + "\n"
                total_chars += len(text)
                print(f"Added page {page.number + 1} - Total characters: {total_chars}")
            else:
                # Add partial text from this page to reach exactly the limit
                remaining_chars = char_limit - total_chars
                if remaining_chars > 0:
                    partial_text = text[:remaining_chars]
                    pages_with_text.append((page.number + 1, partial_text))
                    accumulated_text += partial_text
                    total_chars = char_limit
                    print(f"Added partial page {page.number + 1} - Reached limit: {total_chars} characters")
                break
        else:
            # Page has no text, might need OCR
            if total_chars == 0:  # Only collect OCR pages if we haven't found any text yet
                pages_for_ocr.append(page)
        
        # Stop if we've reached the character limit
        if total_chars >= char_limit:
            break

    # If no text found in any processed pages, return OCR images
    if len(pages_with_text) == 0 and pages_for_ocr:
        print("No searchable text found, converting pages to images for OCR...")
        ocr_pages = []
        # Limit OCR pages to avoid processing too many images
        max_ocr_pages = min(5, len(pages_for_ocr))  # Limit to first 5 pages for OCR
        
        for page in pages_for_ocr[:max_ocr_pages]:
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

    # Return the accumulated text
    print(f"Extraction complete. Total characters: {len(accumulated_text.strip())}")
    
    return {
        "status": "success",
        "text": accumulated_text.strip(),
        "pages_processed": len(pages_with_text),
        "total_characters": len(accumulated_text.strip()),
        "filename": filename
    }

def detect_categories(text, filename=None):
    
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

def extract_metadata(text, filename=None):    
    doc = nlp(text)
    entities = {"PERSON": [], "DATE": [], "ORG": []}

    # Extract named entities
    for ent in doc.ents:
        if ent.label_ in entities:
            entities[ent.label_].append(ent.text.strip())
    
    # Detect document type
    categories = detect_categories(text, filename)
    
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
            title = f"{categories} Document"
    
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
        "categories": categories,
        "organization": ', '.join(organizations) if organizations else "Unknown",
    }

def generate_summary(text, title=None, author=None, date=None, keywords=None, categories=None, max_attempts=3):
    print("Generating summary...")
    cleaned_text = clean_text(text)
    input_text = cleaned_text[:2000]

    # Build subtle context instruction
    context_parts = []
    if title and title not in ["Unknown", ""]:
        context_parts.append(f"Title: {title}")
    if author and author not in ["Unknown", ""]:
        context_parts.append(f"Author: {author}")
    if date and date not in ["Unknown", ""]:
        context_parts.append(f"Date: {date}")
    if categories:
        context_parts.append(f"Related topics: {', '.join(categories)}")
    if keywords:
        context_parts.append(f"Important topics: {', '.join(keywords[:8])}")

    instruction = "Summarize the following document, reflecting the main ideas and key topics. Include author and date if relevant. Avoid explicitly mentioning metadata fields as much as possible but include one or more keywords."
    if context_parts:
        instruction += " Context: " + ". ".join(context_parts)

    model_input = f"{instruction}\n\n{input_text}"

    try:
        base_summary = summarizer(model_input[:4000])[0]['summary_text']
    except Exception as e:
        print("Summarizer error:", e)
        base_summary = "Summary not available."

    # Check relevance
    relevance_issue = check_summary_relevance(title, base_summary, keywords, categories, author, date)
    if relevance_issue:
        # Retry once with stronger guidance
        retry_instruction = instruction + " Rewrite the summary to better reflect main topics and keywords."
        retry_input = f"{retry_instruction}\n\n{input_text}"
        try:
            base_summary = summarizer(retry_input[:4000])[0]['summary_text']
        except Exception as e:
            print("Retry summarizer error:", e)
            base_summary = base_summary  # fallback to original

    return base_summary.strip()

@app.post("/generate-summary/{doc_id}")
def generate_summary_endpoint(doc_id: str):
    # Fetch metadata
    doc = supabase.table("documents_metadata").select("*").eq("id", doc_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    metadata = doc.data.get("metadata") or {}
    extracted_text = metadata.get("extracted_text")
    file_url = doc.data.get("file_url")

    # Re-extract text if missing
    if not extracted_text or extracted_text.strip() == "":
        print("No extracted text found, downloading and extracting from file_url...")
        try:
            file_bytes = download_file(file_url)
            extracted_result = extract_text(file_bytes, filename=file_url.split("/")[-1])            
            cleaned_text = clean_text(extracted_result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to download or extract file: {e}")

        if isinstance(extracted_result, dict) and extracted_result.get("status") == "ocr_required":
            return {
                "id": doc_id,
                "summary": None,
                "ocr_required": True,
                "pages": extracted_result["pages"],
                "filename": extracted_result["filename"]
            }

        supabase.table("documents_metadata").update({
            "metadata": {**metadata, "extracted_text": cleaned_text}
        }).eq("id", doc_id).execute()

        extracted_text = cleaned_text

    # Generate summary
    summary = generate_summary(
        text=extracted_text,
        title=metadata.get("title"),
        author=metadata.get("author"),
        date=metadata.get("date"),
        keywords=metadata.get("keywords", []),
        categories=metadata.get("categories", [])
    )

    # Return summary without saving
    return {"id": doc_id, "summary": summary}

def download_file(file_url: str) -> bytes:
    if "supabase.co" in file_url:
        # Direct HTTP download from Supabase public bucket
        res = requests.get(file_url)
        if res.status_code != 200:
            raise Exception(f"Failed to download from Supabase: {res.status_code}")
        return res.content

    elif "r2.dev" in file_url:
        # Direct HTTP download from R2 public bucket
        res = requests.get(file_url)
        if res.status_code != 200:
            raise Exception(f"Failed to download from R2: {res.status_code}")
        return res.content

    else:
        raise ValueError(f"Unknown file storage provider for {file_url}")

def detect_inconsistencies(metadata, source_type="document"):
    issues = []

    # Title
    if not metadata.get("title") or metadata["title"] in ["Unknown", ""]:
        issues.append({
            "field": "title",
            "issue": "Missing or unknown title",
            "suggestion": "Add a clear, descriptive title summarizing the item."
        })

    # Author
    if not metadata.get("author") or metadata["author"] in ["Unknown", ""]:
        issues.append({
            "field": "author",
            "issue": "Missing or unknown author",
            "suggestion": "Specify the full author or responsible organization."
        })

    # Date
    date_val = metadata.get("date")
    if not date_val or date_val in ["Unknown", ""]:
        issues.append({
            "field": "date",
            "issue": "Missing or unknown date",
            "suggestion": "Add the creation or publication date."
        })
    elif source_type == "document":  # only documents get validity checks
        try:
            parsed = date_parse(date_val)
            if parsed.year > 2025:
                issues.append({
                    "field": "date",
                    "issue": f"Future date detected: {date_val}",
                    "suggestion": "Correct the date to the actual publication date."
                })
        except:
            issues.append({
                "field": "date",
                "issue": f"Invalid date format: {date_val}",
                "suggestion": "Use the standard format YYYY-MM-DD."
            })

    # Categories
    if not metadata.get("categories"):
        issues.append({
            "field": "categories",
            "issue": "No categories provided",
            "suggestion": "Assign at least one relevant category."
        })

    # Summary relevance → only for documents
    if source_type == "document":
        summary_issue = check_summary_relevance(
            metadata.get("title", ""),
            metadata.get("summary", "")
        )
        if summary_issue:
            issues.append(summary_issue)

    return issues

# Initialize model and Supabase
load_dotenv()
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)
model = SentenceTransformer('all-MiniLM-L6-v2')

def save_inconsistencies(
    record_id,
    metadata,
    supabase,
    source_type,
    **extra_fields  # catch optional stuff like file_name, file_url, etc.
):
    # Detect issues
    issues_raw = detect_inconsistencies(metadata, source_type=source_type)
    merged_issues = [
        {
            "field": issue.get("field"),
            "issue": issue.get("issue"),
            "suggestion": issue.get("suggestion")
        }
        for issue in issues_raw
    ]

    # Check if inconsistencies already exist for this record
    existing = supabase.table("inconsistencies") \
        .select("*") \
        .eq("record_id", record_id) \
        .eq("source_type", source_type) \
        .execute()

    if merged_issues:
        row_data = {
            "record_id": record_id,
            "source_type": source_type,
            "title": metadata.get("title"),
            "issues": merged_issues,
            "last_scanned_at": datetime.utcnow().isoformat(),
            **extra_fields  # adds file_name, file_url, etc.
        }

        if existing.data:
            existing_row = existing.data[0]
            if existing_row["issues"] != merged_issues:
                # Re-open if new issues appear or existing ones changed
                supabase.table("inconsistencies").update({
                    "issues": merged_issues,
                    "status": "Open",
                    "updated_at": datetime.utcnow().isoformat(),
                    "resolved_at": None,  # clear resolved_at if re-opened
                }).eq("record_id", record_id) \
                  .eq("source_type", source_type) \
                  .execute()
            else:
                # Just refresh scan timestamp
                supabase.table("inconsistencies").update({
                    "last_scanned_at": datetime.utcnow().isoformat()
                }).eq("record_id", record_id) \
                  .eq("source_type", source_type) \
                  .execute()
        else:
            # Insert new row
            supabase.table("inconsistencies").insert({
                **row_data,
                "status": "Open",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
    else:
        # No issues → resolve if not already
        if existing.data and existing.data[0]["status"] != "Resolved":
            supabase.table("inconsistencies").update({
                "status": "Resolved",
                "resolved_at": datetime.utcnow().isoformat()
            }).eq("record_id", record_id) \
              .eq("source_type", source_type) \
              .execute()

def check_summary_relevance(title, summary, keywords=None, categories=None, author=None, date=None):
    metadata = {
        "title": title,
        "summary": summary,
        "keywords": keywords or [],
        "categories": categories or [],
        "author": author or "",
        "date": date or ""
    }

    if not summary.strip():
        return {
            "field": "summary",
            "issue": "Missing summary",
            "suggestion": "Generate a concise summary based on the document content."
        }

    # Build context text from metadata
    context_parts = [title]
    if keywords:
        context_parts.append(" ".join(keywords))
    if categories:
        context_parts.append(" ".join(categories))
    if author:
        context_parts.append(f"Author: {author}")
    if date:
        context_parts.append(f"Date: {date}")
    context_text = " ".join(context_parts)

    try:
        embeddings = model.encode([context_text, summary], convert_to_tensor=True)
        similarity = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
    except Exception as e:
        print("Embedding similarity check failed:", e)
        similarity = 1.0  # skip similarity check if embedding fails

    # Check similarity
    if similarity < 0.55:
        return {
            "field": "summary",
            "issue": "Summary may not align well with document content or metadata context",
            "suggestion": "Rewrite the summary to better reflect the main topics and key points of the document."
        }

    # Check keywords presence or any similar words 
    if keywords:
        keyword_embeddings = model.encode(keywords, convert_to_tensor=True)
        summary_embedding = model.encode(summary, convert_to_tensor=True)
        keyword_sims = util.pytorch_cos_sim(summary_embedding, keyword_embeddings)[0]
        if all(score < 0.5 for score in keyword_sims):
            return {
                "field": "summary",
                "issue": "Summary may not reflect main topics from keywords",
                "suggestion": "Regenerate the summary ensuring it covers the main topics implied by the keywords"
            }

    return {}

@app.post("/rescan-metadata")
async def rescan_metadata():
    try:
        # Scan both tables
        sources = [
            {"table": "documents_metadata", "type": "document"},
            {"table": "artifacts_metadata", "type": "artifact"}
        ]

        for source in sources:
            rows = supabase.table(source["table"]).select("*").execute()
            if not rows.data:
                continue

            for row in rows.data:
                metadata_json = row.get("metadata") or {}

                # Reuse the save function
                save_inconsistencies(
                    record_id=row["id"],
                    metadata={
                        "title": metadata_json.get("title"),
                        "author": metadata_json.get("author"),
                        "date": metadata_json.get("date"),
                        "summary": metadata_json.get("summary"),
                        "keywords": metadata_json.get("keywords", []),
                        "categories": metadata_json.get("categories", [])
                    },
                    supabase=supabase,
                    source_type=source["type"],  # tells if document or artifact
                    file_name=row.get("file_name"),
                    file_url=row.get("file_url"),
                )

        return {"success": True, "error": None}

    except Exception as e:
        return {"success": False, "error": str(e)}

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

@app.post("/extract-text")
async def extract_text_from_pdf(
    file: UploadFile = File(None),   
    file_url: str = Form(None),      
    file_name: str = Form(None)      
):
    try:
        if file:
            # Existing upload flow
            pdf_bytes = await file.read()
            filename = file.filename
        elif file_url:
            # Download PDF from URL using your existing function
            pdf_bytes = download_file(file_url)
            filename = file_name or file_url.split("/")[-1]
        else:
            return {"status": "error", "error": "No file or file URL provided"}

        # Run existing extraction
        result = extract_text(pdf_bytes, filename)

        if result.get("status") == "ocr_required":
            return {
                "status": "ocr_required",
                "pages": result.get("pages", []),
                "filename": result.get("filename")
            }

        text = result.get("text", "")
        cleaned_text = clean_text(text)

        return {
            "status": "success",
            "extracted_text": cleaned_text,
            "pages_processed": result.get("pages_processed"),
            "total_characters": result.get("total_characters"),
            "filename": result.get("filename")
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
