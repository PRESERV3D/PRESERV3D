from fastapi.responses import JSONResponse
import fitz
import spacy
import re
import os
import subprocess
import base64
import json
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from dateutil.parser import parse as date_parse

app = FastAPI()
load_dotenv()


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9000",
        "https://localhost:9000",
        "https://preserv3d.vercel.app",
        "https://*.vercel.app",
        "https://*.onrender.com",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hugging Face API configuration
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_API_BASE = "https://api-inference.huggingface.co/models"

# API endpoints for heavy models
HF_SUMMARIZER = f"{HF_API_BASE}/facebook/bart-large-cnn"
HF_EMBEDDINGS = f"{HF_API_BASE}/sentence-transformers/all-MiniLM-L6-v2"
HF_KEYWORDS = f"{HF_API_BASE}/ml6team/keyphrase-extraction-kbir-inspec"

_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        print("Loading custom NER model...")
        _nlp = spacy.load("nlp_training/ner_model")
        print("Custom NER model loaded successfully")
    return _nlp

def call_hf_api(endpoint, payload, max_retries=3):
    if not HF_API_TOKEN:
        print("Warning: HF_API_TOKEN not set, skipping API call")
        return None
        
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    try:
        if isinstance(payload, str):
            payload = {"inputs": payload}
        elif isinstance(payload, dict):
            if "input" in payload and "inputs" not in payload:
                payload["inputs"] = payload.pop("input")

        preview_payload = None
        try:
            tmp = payload.get("inputs") if isinstance(payload, dict) else payload
            if isinstance(tmp, str):
                preview_payload = tmp[:200]
            else:
                preview_payload = str(tmp)[:200]
        except Exception:
            preview_payload = "<unprintable>"

    except Exception as e:
        print("Failed to normalize HF payload:", e)

    for attempt in range(max_retries):
        try:
            print(f"Calling HF model endpoint: {endpoint} (attempt {attempt + 1}) payload-preview: {preview_payload}")
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)

            if response.status_code == 503:
                if attempt < max_retries - 1:
                    print(f"Model loading, retrying in 5s... (attempt {attempt + 1})")
                    import time
                    time.sleep(5)
                    continue
                else:
                    print("Model failed to load after retries")
                    return None

            try:
                response.raise_for_status()
            except requests.exceptions.HTTPError as http_err:
                body = None
                try:
                    body = response.text
                except Exception:
                    body = '<unable to read response body>'
                print(f"HF API HTTP error ({response.status_code}): {http_err}. Response body: {body}")
                raise

            return response.json()

        except requests.exceptions.RequestException as e:
            # If last attempt, log and return None
            if attempt == max_retries - 1:
                print(f"HF API error after {max_retries} attempts: {e}")
                return None
            import time
            time.sleep(1 + attempt)
    return None

def call_hf_embeddings(model_name, text, max_retries=3):
    if not HF_API_TOKEN:
        print("Warning: HF_API_TOKEN not set, skipping embeddings API call")
        return None

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    endpoint = f"{HF_API_BASE}/{model_name}"
    
    # Try different payload formats based on the pipeline type
    payloads_to_try = [
        # Format 1: SentenceSimilarityPipeline format
        {
            "inputs": {
                "source_sentence": text,
                "sentences": [text]
            },
            "options": {"wait_for_model": True}
        },
        # Format 2: Standard feature-extraction format
        {
            "inputs": text,
            "options": {"wait_for_model": True}
        }
    ]

    for payload_idx, payload in enumerate(payloads_to_try):
        for attempt in range(max_retries):
            try:
                print(f"Calling HF embeddings (payload format {payload_idx + 1}, attempt {attempt + 1}) model={model_name}")
                response = requests.post(endpoint, headers=headers, json=payload, timeout=30)

                if response.status_code == 503:
                    if attempt < max_retries - 1:
                        import time
                        print("Embeddings model loading, retrying in 3s...")
                        time.sleep(3)
                        continue
                    else:
                        print("Embeddings model failed to load after retries")
                        break 

                if response.status_code == 400:
                    print(f"400 error with payload format {payload_idx + 1}, trying next format...")
                    break 

                try:
                    response.raise_for_status()
                except requests.exceptions.HTTPError as http_err:
                    body = None
                    try:
                        body = response.text
                    except Exception:
                        body = '<unable to read response body>'
                    print(f"HF Embeddings HTTP error ({response.status_code}): {http_err}. Response body: {body}")
                    break 

                data = None
                try:
                    data = response.json()
                except Exception as e:
                    print("Failed to parse HF embeddings response as JSON:", e)
                    return None

                # Handle different response formats
                if isinstance(data, list):
                    if len(data) > 0:
                        # If it's a list of lists (batch embeddings)
                        if isinstance(data[0], list):
                            return [float(x) for x in data[0]]
                        # If it's a flat list of numbers (single embedding or scores)
                        elif all(isinstance(x, (float, int)) for x in data):
                            return [float(x) for x in data]
                
                # Format 2: Dictionary with embedding/similarity keys
                if isinstance(data, dict):
                    for key in ("embeddings", "embedding", "vector", "features"):
                        if key in data:
                            emb = data[key]
                            if isinstance(emb, list):
                                if len(emb) > 0 and isinstance(emb[0], list):
                                    return [float(x) for x in emb[0]]
                                return [float(x) for x in emb]

                print(f"Unexpected response format with payload {payload_idx + 1}. Response preview:", str(data)[:300])
                break

            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    print(f"HF Embeddings API error after {max_retries} attempts with payload format {payload_idx + 1}: {e}")
                    break 
                import time
                time.sleep(1 + attempt)
    
    # If all formats failed, return None
    print("All payload formats failed for embeddings")
    return None


def get_embeddings(text):
    emb = call_hf_embeddings("sentence-transformers/all-MiniLM-L6-v2", text)
    if emb and isinstance(emb, list) and len(emb) > 0:
        try:
            return [float(x) for x in emb]
        except Exception:
            print("Failed to coerce embedding values to float")
    
    # Fallback to a model that's definitely deployed as feature-extraction
    print("Trying fallback embedding model...")
    emb = call_hf_embeddings("sentence-transformers/paraphrase-MiniLM-L6-v2", text)
    if emb and isinstance(emb, list) and len(emb) > 0:
        try:
            return [float(x) for x in emb]
        except Exception:
            print("Failed to coerce fallback embedding values to float")
    
    print("All embedding models failed, returning empty vector")
    return []

def extract_keywords_hf(text, top_n=10):
    # Try HF API first
    result = call_hf_api(HF_KEYWORDS, {"inputs": text[:1000]})
    
    if result and isinstance(result, list):
        keywords = []
        for item in result:
            if isinstance(item, dict) and 'word' in item:
                keywords.append(item['word'])
            elif isinstance(item, str):
                keywords.append(item)
        
        if keywords:
            return keywords[:top_n]
    
    # Fallback: Use your custom NER to extract keywords
    print("Using NER-based keyword extraction fallback")
    doc = get_nlp()(text[:2000])
    
    # Extract important entities as keywords
    keywords = []
    seen = set()
    for ent in doc.ents:
        clean_text = ent.text.strip().replace('\n', ' ')
        if clean_text and clean_text.lower() not in seen and len(clean_text) > 2:
            keywords.append(clean_text)
            seen.add(clean_text.lower())
            if len(keywords) >= top_n:
                break
    
    # If still not enough, extract capitalized phrases
    if len(keywords) < top_n:
        cap_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text[:2000])
        for phrase in cap_phrases:
            if phrase.lower() not in seen and len(phrase) > 3:
                keywords.append(phrase)
                seen.add(phrase.lower())
                if len(keywords) >= top_n:
                    break
    
    return keywords[:top_n]

def summarize_text_hf(text, max_length=200, min_length=50):
    result = call_hf_api(HF_SUMMARIZER, {
        "inputs": text[:4000],
        "parameters": {
            "max_length": max_length,
            "min_length": min_length,
            "do_sample": False
        }
    })
    
    if result and isinstance(result, list) and len(result) > 0:
        return result[0].get('summary_text', '')
    
    # Fallback: Create simple extractive summary
    print("Using extractive summary fallback")
    sentences = re.split(r'[.!?]\s+', text[:2000])
    # Take first 3-5 sentences as summary
    summary_sentences = sentences[:min(5, len(sentences))]
    return ' '.join(summary_sentences) + '.'

@app.head("/health")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "nlp_service",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.head("/")
@app.get("/")
async def root():
    return {
        "message": "PRESERV3D NLP Service",
        "status": "running",
        "endpoints": ["/health", "/process-text", "/generate-summary", "/extract-text"]
    }

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

            if isinstance(result, dict) and result.get("status") == "ocr_required":
                result["filename"] = filename or file.filename
                return result

            if isinstance(result, dict) and result.get("status") == "success":
                text = result.get("text", "")
            elif isinstance(result, str):
                text = result
            else:
                return {"error": "Failed to extract text from PDF"}
        else:
            return {"error": "No file or raw text provided"}

        if text and len(text.strip()) >= 100:
            cleaned_text = clean_text(text)

            # NER-driven metadata extraction using YOUR custom model
            metadata = extract_metadata_ner(cleaned_text, filename or (file.filename if file else None))

            # Keyword Extraction via HF API (with NER fallback)
            try:
                keywords = extract_keywords_hf(cleaned_text, top_n=10)
            except Exception as e:
                print("Keyword extraction error:", e)
                keywords = []

            # Summarization via HF API (with extractive fallback)
            try:
                summary = summarize_text_hf(cleaned_text[:4000])
                if not summary:
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
                "place": metadata.get("place"),
                "summary": summary,
                "keywords": keywords,
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

    for page_num, page in enumerate(doc):
        text = page.get_text().strip()
        
        if text:
            print(f"Analyzing page {page.number + 1}...")
            
            if total_chars + len(text) <= char_limit:
                pages_with_text.append((page.number + 1, text))
                accumulated_text += text + "\n"
                total_chars += len(text)
                print(f"Added page {page.number + 1} - Total characters: {total_chars}")
            else:
                remaining_chars = char_limit - total_chars
                if remaining_chars > 0:
                    partial_text = text[:remaining_chars]
                    pages_with_text.append((page.number + 1, partial_text))
                    accumulated_text += partial_text
                    total_chars = char_limit
                    print(f"Added partial page {page.number + 1} - Reached limit: {total_chars} characters")
                break
        else:
            if total_chars == 0:
                pages_for_ocr.append(page)
        
        if total_chars >= char_limit:
            break

    if len(pages_with_text) == 0 and pages_for_ocr:
        print("No searchable text found, converting pages to images for OCR...")
        ocr_pages = []
        max_ocr_pages = min(5, len(pages_for_ocr))
        
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

    print(f"Extraction complete. Total characters: {len(accumulated_text.strip())}")
    
    return {
        "status": "success",
        "text": accumulated_text.strip(),
        "pages_processed": len(pages_with_text),
        "total_characters": len(accumulated_text.strip()),
        "filename": filename
    }

def extract_metadata_ner(text, filename=None):
    print("Extracting metadata using custom NER model...")
    
    # Process text with YOUR custom NER model
    doc = get_nlp()(text)
    
    # Extract entities by type
    entities = {
        "TITLE": [],
        "AUTHOR": [],
        "DATE": [],
        "ORG": [],
        "PLACE": []
    }
    
    for ent in doc.ents:
        if ent.label_ in entities:
            clean_text = ent.text.strip().replace('\n', ' ')
            if clean_text and len(clean_text) > 1:
                entities[ent.label_].append(clean_text)
    
    print(f"NER extracted entities: {entities}")
    
    title = extract_title_ner(entities["TITLE"], text, filename)
    author = extract_author_ner(entities["AUTHOR"], text)
    date = extract_date_ner(entities["DATE"], text)
    organization = extract_organization_ner(entities["ORG"], text)
    place = extract_place_ner(entities["PLACE"])
    categories = detect_categories_ner(text, filename, entities)
    
    return {
        "file_name": filename or "Unknown",
        "title": title,
        "author": author,
        "date": date,
        "categories": categories,
        "organization": organization,
        "place": place,
    }

def cosine_similarity(a, b):
    if not a or not b:
        return 0
    import math
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = math.sqrt(sum(x * x for x in a))
    magnitude_b = math.sqrt(sum(y * y for y in b))
    if magnitude_a == 0 or magnitude_b == 0:
        return 0
    return dot_product / (magnitude_a * magnitude_b)

def check_summary_relevance(title, summary, keywords=None, categories=None, author=None, date=None, extracted_text=None):
    if not summary or not summary.strip() or summary.strip().lower() in ["n/a", "none", "no summary available.", "summary not available."]:
        return {
            "field": "summary",
            "issue": "Missing or invalid summary",
            "suggestion": "Generate a concise summary based on the document content.",
            "severity": "high"
        }
    
    # Check minimum length
    if len(summary.split()) < 15:
        return {
            "field": "summary",
            "issue": "Summary too short (less than 15 words)",
            "suggestion": "Expand the summary to provide more context and detail.",
            "severity": "medium"
        }
    
    # Check maximum length
    if len(summary.split()) > 250:
        return {
            "field": "summary",
            "issue": "Summary too long (over 250 words)",
            "suggestion": "Condense the summary to focus on key points only.",
            "severity": "low"
        }
    
    # Build comprehensive context for comparison
    context_parts = []
    if title and title not in ["Unknown", "Unknown Document", ""]:
        context_parts.append(title)
    if keywords:
        context_parts.append(" ".join([k for k in keywords if k]))
    if categories:
        cat_text = " ".join(categories) if isinstance(categories, list) else categories
        context_parts.append(cat_text)
    if author and author not in ["Unknown", ""]:
        context_parts.append(f"Author: {author}")
    if date and date not in ["Unknown", ""]:
        context_parts.append(f"Date: {date}")
    
    context_text = " ".join(context_parts)
    
    # If we have extracted text, add a sample for better context
    if extracted_text:
        text_sample = extracted_text[:1000]
        context_text = f"{context_text} {text_sample}"
    
    if not context_text.strip():
        print("Warning: No context available for relevance check")
        return {}
    
    # Semantic similarity check using embeddings
    try:
        context_emb = get_embeddings(context_text) or []
        summary_emb = get_embeddings(summary) or []

        if context_emb and summary_emb:
            similarity = cosine_similarity(context_emb, summary_emb)
            print(f"Summary similarity score: {similarity:.3f}")
            
            # Adjusted thresholds with severity levels
            if similarity < 0.45:
                return {
                    "field": "summary",
                    "issue": f"Summary has low semantic alignment with document context (score: {similarity:.2f})",
                    "suggestion": "Rewrite the summary to better reflect the main topics, themes, and key points of the document. Ensure it captures the document's essence.",
                    "severity": "high"
                }
            elif similarity < 0.55:
                return {
                    "field": "summary",
                    "issue": f"Summary alignment could be improved (score: {similarity:.2f})",
                    "suggestion": "Consider revising the summary to more closely match the document's key themes and topics.",
                    "severity": "medium"
                }
        else:
            print("Skipping embedding-based similarity check - embeddings unavailable")
    except Exception as e:
        print(f"Embedding similarity check failed: {e}")
    
    # Keyword overlap check
    if keywords and len(keywords) >= 3:
        summary_lower = summary.lower()
        keyword_matches = sum(1 for kw in keywords if kw and kw.lower() in summary_lower)
        keyword_coverage = keyword_matches / len(keywords)
        
        print(f"Keyword coverage: {keyword_matches}/{len(keywords)} ({keyword_coverage:.1%})")
        
        if keyword_matches == 0:
            return {
                "field": "summary",
                "issue": "Summary doesn't mention any of the document's key topics/keywords",
                "suggestion": f"Revise the summary to include references to main topics: {', '.join(keywords[:5])}",
                "severity": "high"
            }
        elif keyword_coverage < 0.3:
            return {
                "field": "summary",
                "issue": f"Summary mentions only {keyword_matches} of {len(keywords)} key topics",
                "suggestion": f"Try to incorporate more key topics: {', '.join([k for k in keywords if k.lower() not in summary_lower][:3])}",
                "severity": "medium"
            }
    
    # Title relevance check
    if title and title not in ["Unknown", "Unknown Document", ""]:
        title_words = set(word.lower() for word in re.findall(r'\b\w+\b', title) if len(word) > 3)
        summary_words = set(word.lower() for word in re.findall(r'\b\w+\b', summary))
        
        # Filter out common stop words
        stop_words = {'this', 'that', 'with', 'from', 'have', 'been', 'were', 'about', 'their', 'there', 'these', 'those'}
        title_words = title_words - stop_words
        
        if title_words:
            title_overlap = len(title_words & summary_words) / len(title_words)
            print(f"Title word overlap: {title_overlap:.1%}")
            
            if title_overlap < 0.2 and len(title_words) >= 3:
                return {
                    "field": "summary",
                    "issue": "Summary doesn't reflect the document's title well",
                    "suggestion": f"Ensure the summary addresses the main theme from the title: '{title}'",
                    "severity": "medium"
                }
    
    # Check for generic/template-like summaries
    generic_phrases = [
        "this document discusses",
        "this paper presents",
        "this report contains",
        "the document provides information",
        "the following document",
        "this is a document about"
    ]
    
    summary_lower = summary.lower()
    generic_count = sum(1 for phrase in generic_phrases if phrase in summary_lower)
    
    if generic_count >= 2 or (generic_count >= 1 and len(summary.split()) < 30):
        return {
            "field": "summary",
            "issue": "Summary appears too generic or template-like",
            "suggestion": "Rewrite the summary with specific details about the actual content, findings, or purpose of this particular document.",
            "severity": "medium"
        }
    
    # Author and date integration check
    mentions_author = author and author != "Unknown" and author.split()[0] in summary
    mentions_date = date and date != "Unknown" and any(d in summary for d in [str(date), date.split('-')[0]])
    
    if author and author != "Unknown" and not mentions_author and len(summary.split()) > 50:
        print(f"Note: Summary doesn't mention author '{author}' - this may be intentional")
    
    print("Summary passes all relevance checks")
    return {}

def extract_title_ner(title_entities, text, filename):
    # YOUR ORIGINAL CODE HERE
    if title_entities:
        for title_candidate in title_entities:
            if validate_title(title_candidate):
                return clean_title(title_candidate)
    
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    skip_patterns = re.compile(
        r'(conference|isbn|proceedings|journal|issue|vol\.|pp\.|location|'
        r'city|country|date|span|—|-|,|page\s+\d+|copyright|©|®|™)', re.I
    )
    exclusion_patterns = re.compile(
        r'(compiled|email|@|abstract|table\s+of\s+contents|index|'
        r'www\.|http|\.com|\.org|\.edu)', re.I
    )
    name_pattern = re.compile(r'^(?:Dr\.?\s+|Prof\.?\s+|Mr\.?\s+|Ms\.?\s+|Mrs\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z]\.?\s+)?(?:\s+[A-Z][a-z]+)+(?:\s*,?\s*(?:Ph\.?D\.?|M\.?D\.?|Jr\.?|Sr\.?))?$')
    
    filename_words = []
    base = ""
    if filename:
        base = os.path.splitext(os.path.basename(filename))[0]
        filename_words = re.split(r'[_\-\s]+', base.lower())
    
    title_lines = []
    found_title_start = False
    search_lines = lines[:20]
    
    for i, line in enumerate(search_lines):
        if not found_title_start:
            if len(line) <= 3:
                continue
            if skip_patterns.search(line):
                continue
            if name_pattern.match(line) and not any(word in line.lower() for word in ['report', 'annual', 'newsletter']):
                continue
            if exclusion_patterns.search(line):
                continue
            
            line_lower = line.lower()
            title_indicators = [
                len(line) > 10,
                any(w in line_lower for w in filename_words),
                any(word in line_lower for word in ['annual', 'report', 'newsletter', 'bulletin', 'catalog', 'memorabilia']),
                line.isupper() and len(line) > 8,
                re.search(r'\b(class\s+of\s+\d{4}|fiscal\s+year|academic\s+year)', line_lower)
            ]
            
            if any(title_indicators):
                found_title_start = True
                title_lines.append(line)
        else:
            if name_pattern.match(line):
                break
            if exclusion_patterns.search(line):
                break
            if len(line) <= 3:
                break
            if skip_patterns.search(line):
                break
            if len(line) > 100 and not line.isupper():
                break
            title_lines.append(line)
            if len(title_lines) >= 10:
                break
    
    title = ' '.join(title_lines).strip()
    if title:
        title = clean_title(title)
    
    if not title or len(title) < 10:
        if base:
            title = base.replace('_', ' ').replace('-', ' ').title()
        else:
            title = "Document"
    
    return title or "Unknown Document"

def extract_author_ner(author_entities, text):
    # YOUR ORIGINAL CODE
    authors = []
    for author in author_entities:
        if validate_author(author):
            authors.append(clean_author(author))
    
    if not authors:
        contributor_patterns = [
            r'(?:President|Chancellor|Director|Dean|Chair(?:man|woman|person)?|Principal):\s*([A-Z][a-zA-Z\s\.]+)',
            r'(?:Prepared\s+by|Compiled\s+by|Edited\s+by|Written\s+by):\s*([A-Z][a-zA-Z\s\.]+)',
            r'(?:Message\s+from|Letter\s+from)\s+([A-Z][a-zA-Z\s\.]+)',
            r'(?:Author|By):\s*([A-Z][a-zA-Z\s\.]+)',
        ]
        
        for pattern in contributor_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                author = match.group(1).strip()
                if validate_author(author):
                    authors.append(clean_author(author))
    
    unique_authors = list(dict.fromkeys(authors))[:5]
    return ', '.join(unique_authors) if unique_authors else "Unknown"

def extract_date_ner(date_entities, text):
    # YOUR ORIGINAL CODE
    for date_candidate in date_entities:
        parsed_date = parse_and_validate_date(date_candidate)
        if parsed_date:
            return parsed_date
    
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
            date_str = match.group(1)
            parsed_date = parse_and_validate_date(date_str)
            if parsed_date:
                return parsed_date
    
    return "Unknown"

def extract_organization_ner(org_entities, text):
    # YOUR ORIGINAL CODE  
    organizations = []
    for org in org_entities:
        if validate_organization(org):
            organizations.append(clean_organization(org))
    
    if not organizations:
        org_patterns = [
            r"([A-Z][a-zA-Z\s]+(?:University|College|Institute|School|Academy))",
            r"([A-Z][a-zA-Z\s]+(?:Corporation|Company|Inc\.|LLC|Foundation))",
            r"([A-Z][a-zA-Z\s]+(?:Department|Division|Office|Bureau))",
            r"(?:University\s+of\s+|College\s+of\s+)([A-Z][a-zA-Z\s]+)",
            r"([A-Z][A-Z\s]+)(?:\s+University|\s+College|\s+Institute)",
        ]
        
        for pattern in org_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                org = match.group(1).strip()
                if validate_organization(org):
                    organizations.append(clean_organization(org))
    
    unique_orgs = list(dict.fromkeys(organizations))[:3]
    return ', '.join(unique_orgs) if unique_orgs else "Unknown"

def extract_place_ner(place_entities):
    # YOUR ORIGINAL CODE
    places = []
    for place in place_entities:
        if validate_place(place):
            places.append(clean_place(place))
    
    unique_places = list(dict.fromkeys(places))[:3]
    return ', '.join(unique_places) if unique_places else "Unknown"

def detect_categories_ner(text, filename, entities):
    # YOUR ORIGINAL CODE - KEEP EXACTLY AS IS
    text_lower = text.lower()
    filename_lower = (filename or "").lower()
    
    type_patterns = {
        "annual_report": [
            r"annual\s+report", r"yearly\s+report", r"financial\s+year",
            r"fiscal\s+year", r"board\s+of\s+directors", r"financial\s+statement",
            r"president'?s\s+message", r"chairman'?s\s+letter"
        ],
        "memorabilia": [
            r"class\s+of\s+\d{4}", r"graduating\s+class", r"yearbook",
            r"alumni", r"graduation\s+ceremony", r"commencement",
            r"reunion", r"class\s+notes", r"memory\s+book"
        ],
        "newsletter": [
            r"newsletter", r"bulletin", r"news\s+update",
            r"quarterly\s+update", r"monthly\s+report", r"campus\s+news"
        ],
        "academic_catalog": [
            r"course\s+catalog", r"academic\s+catalog", r"curriculum",
            r"degree\s+requirements", r"course\s+offerings", r"academic\s+calendar"
        ],
        "brochure": [
            r"brochure", r"prospectus", r"information\s+packet",
            r"program\s+overview", r"welcome\s+packet"
        ],
        "minutes": [
            r"meeting\s+minutes", r"board\s+minutes", r"committee\s+meeting",
            r"senate\s+minutes", r"council\s+meeting"
        ],
        "research_report": [
            r"research\s+report", r"technical\s+report", r"white\s+paper",
            r"policy\s+brief", r"study\s+findings"
        ]
    }
    
    entity_context = []
    for entity_type, entity_list in entities.items():
        entity_context.extend([e.lower() for e in entity_list])
    entity_text = ' '.join(entity_context)
    
    combined_text = f"{filename_lower} {entity_text}"
    for doc_type, patterns in type_patterns.items():
        for pattern in patterns:
            if re.search(pattern, combined_text):
                return doc_type.replace("_", " ").title()
    
    for doc_type, patterns in type_patterns.items():
        score = 0
        for pattern in patterns:
            if re.search(pattern, text_lower):
                score += 1
        
        if score >= 2:
            return doc_type.replace("_", " ").title()
        elif score == 1 and len(patterns) <= 3:
            return doc_type.replace("_", " ").title()
    
    return "Archives"

# Validation helpers - YOUR ORIGINAL CODE
def validate_title(title):
    if not title or len(title.strip()) < 5:
        return False
    bad_patterns = [
        r'^page\s+\d+', r'^\d+$', r'^copyright',
        r'^table\s+of\s+contents', r'^index$', r'^\w+@\w+\.',
    ]
    title_lower = title.lower()
    for pattern in bad_patterns:
        if re.match(pattern, title_lower):
            return False
    return True

def validate_author(author):
    if not author or len(author.strip()) < 2:
        return False
    if not re.search(r'[A-Za-z]', author):
        return False
    bad_patterns = [
        r'^\d+$', r'^page\s+\d+', r'@',
        r'^copyright', r'^table', r'^index',
    ]
    author_lower = author.lower()
    for pattern in bad_patterns:
        if re.search(pattern, author_lower):
            return False
    return len(author.split()) <= 6

def validate_organization(org):
    if not org or len(org.strip()) < 3:
        return False
    org_clean = re.sub(r'\s+', ' ', org.strip())
    if len(org_clean.split()) > 8:
        return False
    return True

def validate_place(place):
    if not place or len(place.strip()) < 2:
        return False
    place_clean = place.strip()
    if re.search(r'^\d+$|^page|^copyright|^table', place_clean.lower()):
        return False
    return len(place_clean.split()) <= 5

def parse_and_validate_date(date_str):
    if not date_str:
        return None
    
    date_str = date_str.strip()
    
    try:
        if len(date_str) == 4 and date_str.isdigit():
            year = int(date_str)
            if 1800 <= year <= 2025:
                return str(year)
        
        range_patterns = [
            r'(\w+)\s*[-—–]\s*(\w+\s+\d{4})',
            r'(\w+\s+\d{4})\s*[-—–]\s*(\w+\s+\d{4})',
            r'(\d{4})\s*[-—–]\s*(\d{4})',
            r'(\d{1,2}/\d{4})\s*[-—–]\s*(\d{1,2}/\d{4})',
        ]
        
        for pattern in range_patterns:
            match = re.search(pattern, date_str)
            if match:
                start_date, end_date = match.groups()
                if pattern == range_patterns[0]:
                    year_match = re.search(r'\d{4}', end_date)
                    if year_match:
                        year = year_match.group()
                        start_date = f"{start_date} {year}"
                try:
                    start_parsed = date_parse(start_date, fuzzy=True)
                    end_parsed = date_parse(end_date, fuzzy=True)
                    latest_date = max(start_parsed, end_parsed)
                    if 1800 <= latest_date.year <= 2025:
                        return format_date_flexibly(latest_date, end_date)
                except:
                    try:
                        end_parsed = date_parse(end_date, fuzzy=True)
                        if 1800 <= end_parsed.year <= 2025:
                            return format_date_flexibly(end_parsed, end_date)
                    except:
                        continue
        
        academic_year_match = re.search(r'(\d{4})-(\d{2,4})', date_str)
        if academic_year_match:
            start_year, end_year_part = academic_year_match.groups()
            start_year = int(start_year)
            if len(end_year_part) == 2:
                end_year = int(str(start_year)[:2] + end_year_part)
            else:
                end_year = int(end_year_part)
            
            if 1800 <= end_year <= 2025:
                return str(end_year)
        
        parsed = date_parse(date_str, fuzzy=True)
        if 1800 <= parsed.year <= 2025:
            return format_date_flexibly(parsed, date_str)
            
    except Exception as e:
        year_match = re.search(r'\b(19|20)\d{2}\b', date_str)
        if year_match:
            year = int(year_match.group())
            if 1800 <= year <= 2025:
                return str(year)
    
    return None

def format_date_flexibly(parsed_date, original_str):
    original_lower = original_str.lower()
    
    has_day = any(pattern in original_lower for pattern in [
        r'\d{1,2}(?:st|nd|rd|th)?[,\s]',
        r'\b\d{1,2}[,\s]',
    ]) or re.search(r'\b\d{1,2}[,\s]', original_str)
    
    has_month = any(month in original_lower for month in [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ]) or re.search(r'\b\d{1,2}/\d{4}\b', original_str)
    
    if has_day and has_month:
        return parsed_date.strftime('%Y-%m-%d')
    elif has_month:
        return parsed_date.strftime('%m-%Y')
    else:
        return str(parsed_date.year)

def clean_title(title):
    title = re.sub(r'\s+', ' ', title.strip())
    title = re.sub(r'^\W+|\W+$', '', title.strip())
    return title

def clean_author(author):
    author = re.sub(r'\s+', ' ', author.strip())
    author = re.sub(r'[^\w\s\.,\'-]', '', author)
    return author

def clean_organization(org):
    org = re.sub(r'\s+', ' ', org.strip())
    return org

def clean_place(place):
    place = re.sub(r'\s+', ' ', place.strip())
    return place

def generate_summary(text, title=None, author=None, date=None, keywords=None, categories=None, max_attempts=3):
    print("Generating summary with relevance optimization...")
    cleaned_text = clean_text(text)
    
    # Use more text for better context (increased from 2000 to 3000)
    input_text = cleaned_text[:3000]
    
    if len(input_text.strip()) < 100:
        return "Insufficient content for summary generation."
    
    # Build rich context
    context_parts = []
    if title and title not in ["Unknown", "Unknown Document", ""]:
        context_parts.append(f"Document Title: {title}")
    if author and author not in ["Unknown", ""]:
        context_parts.append(f"Author/Creator: {author}")
    if date and date not in ["Unknown", ""]:
        context_parts.append(f"Date: {date}")
    if categories:
        cat_str = ', '.join(categories) if isinstance(categories, list) else categories
        context_parts.append(f"Category: {cat_str}")
    if keywords and len(keywords) > 0:
        # Prioritize top keywords
        top_keywords = [k for k in keywords[:8] if k]
        if top_keywords:
            context_parts.append(f"Key Topics: {', '.join(top_keywords)}")
    
    context_str = "\n".join(context_parts)
    
    # Initial generation with rich context
    instruction = f"""Write a comprehensive summary of the following document. The summary should:
1. Capture the main purpose, themes, and key findings
2. Be specific to this document (avoid generic phrases)
3. Incorporate relevant details about the content
4. Be 3-5 sentences long (50-150 words)
5. Naturally reference key topics when relevant

{context_str}

Document Content:
{input_text}

Summary:"""
    
    best_summary = None
    best_score = -1
    
    for attempt in range(max_attempts):
        try:
            print(f"Summary generation attempt {attempt + 1}/{max_attempts}")
            
            # Generate summary
            if attempt == 0:
                # First attempt: standard generation
                current_summary = summarize_text_hf(instruction[:4000], max_length=150, min_length=50)
            elif attempt == 1:
                # Second attempt: emphasize keywords
                keyword_emphasis = f"Ensure the summary explicitly mentions these key topics: {', '.join(keywords[:5])}" if keywords else ""
                refined_instruction = f"{instruction}\n\nIMPORTANT: {keyword_emphasis}. Focus on specific content rather than generic descriptions."
                current_summary = summarize_text_hf(refined_instruction[:4000], max_length=150, min_length=50)
            else:
                # Final attempt: use extractive fallback with context
                print("Using context-aware extractive summary")
                sentences = re.split(r'[.!?]+', input_text)
                sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
                
                # Score sentences based on keyword presence and position
                scored_sentences = []
                for idx, sent in enumerate(sentences[:15]):  # Focus on first 15 sentences
                    score = 0
                    sent_lower = sent.lower()
                    
                    # Bonus for early sentences
                    score += (15 - idx) * 0.5
                    
                    # Bonus for keyword matches
                    if keywords:
                        score += sum(3 for kw in keywords if kw and kw.lower() in sent_lower)
                    
                    # Bonus for title word matches
                    if title and title != "Unknown":
                        title_words = set(re.findall(r'\b\w{4,}\b', title.lower()))
                        score += sum(2 for word in title_words if word in sent_lower)
                    
                    scored_sentences.append((score, sent))
                
                # Select top sentences
                scored_sentences.sort(reverse=True)
                top_sentences = [sent for score, sent in scored_sentences[:4]]
                
                # Add context prefix if we have metadata
                prefix = ""
                if context_parts:
                    if author and author != "Unknown" and date and date != "Unknown":
                        prefix = f"From {author} ({date}): "
                    elif author and author != "Unknown":
                        prefix = f"From {author}: "
                    elif date and date != "Unknown":
                        prefix = f"Dated {date}: "
                
                current_summary = prefix + " ".join(top_sentences)
            
            if not current_summary or current_summary.strip() in ["", "Summary not available."]:
                print(f"Attempt {attempt + 1} produced no summary")
                continue
            
            # Check relevance
            relevance_check = check_summary_relevance(
                title=title,
                summary=current_summary,
                keywords=keywords,
                categories=categories,
                author=author,
                date=date,
                extracted_text=input_text
            )
            
            # Calculate a score (lower is better, 0 is perfect)
            if not relevance_check:
                current_score = 0  # Perfect score
                print(f"Attempt {attempt + 1} passed all relevance checks!")
                return current_summary.strip()
            else:
                severity_scores = {"low": 1, "medium": 2, "high": 3}
                current_score = severity_scores.get(relevance_check.get("severity", "medium"), 2)
                print(f"Attempt {attempt + 1} issue ({relevance_check.get('severity', 'medium')}): {relevance_check.get('issue', 'Unknown')}")
            
            # Track best summary
            if best_summary is None or current_score < best_score:
                best_summary = current_summary
                best_score = current_score
            
            # If severity is low, accept it
            if current_score <= 1:
                print("Summary has low severity issues, accepting it")
                return current_summary.strip()
        
        except Exception as e:
            print(f"Summary generation attempt {attempt + 1} error: {e}")
            continue
    
    # Return best summary found
    if best_summary:
        print(f"Returning best summary with score {best_score}")
        return best_summary.strip()
    
    # Ultimate fallback
    print("All attempts failed, using basic extractive summary")
    sentences = re.split(r'[.!?]+', input_text[:1500])
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    return " ".join(sentences[:3]) + "."

@app.post("/generate-summary/{doc_id}")
def generate_summary_endpoint(doc_id: str):
    doc = supabase.table("documents_metadata").select("*").eq("id", doc_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    metadata = doc.data.get("metadata") or {}
    extracted_text = metadata.get("extracted_text")
    file_url = doc.data.get("file_url")

    if not extracted_text or extracted_text.strip() == "":
        print("No extracted text found, downloading and extracting from file_url...")
        try:
            file_bytes = download_file(file_url)
            extracted_result = extract_text(file_bytes, filename=file_url.split("/")[-1])            
            cleaned_text = clean_text(extracted_result.get("text", ""))
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

    summary = generate_summary(
        text=extracted_text,
        title=metadata.get("title"),
        author=metadata.get("author"),
        date=metadata.get("date"),
        keywords=metadata.get("keywords", []),
        categories=metadata.get("categories", [])
    )

    return {"id": doc_id, "summary": summary}

def download_file(file_url: str) -> bytes:
    if "supabase.co" in file_url:
        res = requests.get(file_url)
        if res.status_code != 200:
            raise Exception(f"Failed to download from Supabase: {res.status_code}")
        return res.content
    elif "r2.dev" in file_url:
        res = requests.get(file_url)
        if res.status_code != 200:
            raise Exception(f"Failed to download from R2: {res.status_code}")
        return res.content
    else:
        raise ValueError(f"Unknown file storage provider for {file_url}")

def detect_inconsistencies(metadata, source_type="document"):
    issues = []

    if not metadata.get("title") or metadata["title"] in ["Unknown", ""]:
        issues.append({
            "field": "title",
            "issue": "Missing or unknown title",
            "suggestion": "Add a clear, descriptive title summarizing the item."
        })

    if not metadata.get("author") or metadata["author"] in ["Unknown", ""]:
        issues.append({
            "field": "author",
            "issue": "Missing or unknown author",
            "suggestion": "Specify the full author or responsible organization."
        })

    date_val = metadata.get("date")
    if not date_val or date_val in ["Unknown", ""]:
        issues.append({
            "field": "date",
            "issue": "Missing or unknown date",
            "suggestion": "Add the creation or publication date."
        })
    elif source_type == "document":
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

    if not metadata.get("categories"):
        issues.append({
            "field": "categories",
            "issue": "No categories provided",
            "suggestion": "Assign at least one relevant category."
        })

    if source_type == "document":
        summary_issue = check_summary_relevance(
            metadata.get("title", ""),
            metadata.get("summary", ""),
            metadata.get("keywords"),
            metadata.get("categories"),
            metadata.get("author"),
            metadata.get("date")
        )
        if summary_issue:
            issues.append(summary_issue)

    return issues
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def save_inconsistencies(
    record_id,
    metadata,
    supabase,
    source_type,
    **extra_fields
):
    issues_raw = detect_inconsistencies(metadata, source_type=source_type)
    merged_issues = [
        {
            "field": issue.get("field"),
            "issue": issue.get("issue"),
            "suggestion": issue.get("suggestion")
        }
        for issue in issues_raw
    ]

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
            **extra_fields
        }

        if existing.data:
            existing_row = existing.data[0]
            if existing_row["issues"] != merged_issues:
                supabase.table("inconsistencies").update({
                    "issues": merged_issues,
                    "status": "Open",
                    "updated_at": datetime.utcnow().isoformat(),
                    "resolved_at": None,
                }).eq("record_id", record_id) \
                  .eq("source_type", source_type) \
                  .execute()
            else:
                supabase.table("inconsistencies").update({
                    "last_scanned_at": datetime.utcnow().isoformat()
                }).eq("record_id", record_id) \
                  .eq("source_type", source_type) \
                  .execute()
        else:
            supabase.table("inconsistencies").insert({
                **row_data,
                "status": "Open",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
    else:
        if existing.data and existing.data[0]["status"] != "Resolved":
            supabase.table("inconsistencies").update({
                "status": "Resolved",
                "resolved_at": datetime.utcnow().isoformat()
            }).eq("record_id", record_id) \
              .eq("source_type", source_type) \
              .execute()


def cleanup_inconsistencies():
    deleted = []
    try:
        all_rows = supabase.table("inconsistencies").select("*").execute()
        if not all_rows.data:
            return {"deleted": deleted}

        for row in all_rows.data:
            rec_id = row.get("record_id")
            src = row.get("source_type")
            if not rec_id or not src:
                # If malformed, remove it
                try:
                    supabase.table("inconsistencies").delete().eq("id", row.get("id")).execute()
                    deleted.append(row.get("id"))
                except Exception:
                    continue
                continue

            # Check live table existence
            live_table = "documents_metadata" if src == "document" else "artifacts_metadata"
            resp = supabase.table(live_table).select("id").eq("id", rec_id).execute()
            exists_in_live = bool(resp.data)

            if not exists_in_live:
                # Check deleted tables as indicator the item was intentionally removed
                deleted_table = "deleted_documents" if src == "document" else "deleted_artifacts"
                resp_del = supabase.table(deleted_table).select("id").eq("id", rec_id).execute()
                exists_in_deleted = bool(resp_del.data)

                # If not in live table, consider it deleted (or orphaned) and remove inconsistency
                try:
                    supabase.table("inconsistencies").delete().eq("id", row.get("id")).execute()
                    deleted.append(row.get("id"))
                except Exception:
                    # ignore individual delete failures
                    continue

        return {"deleted": deleted}

    except Exception as e:
        print("cleanup_inconsistencies error:", e)
        return {"deleted": deleted, "error": str(e)}

@app.post("/rescan-metadata")
async def rescan_metadata():
    try:
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
                    source_type=source["type"],
                    file_name=row.get("file_name"),
                    file_url=row.get("file_url"),
                )

        # After rescanning live items, clean up inconsistencies that reference
        # items which were deleted or moved out of the live metadata tables.
        cleanup_result = cleanup_inconsistencies()

        return {"success": True, "error": None, "cleanup": cleanup_result}

    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/related-links")
async def related_links(
    title: str,
    author: str = "",
    categories: str = "",
    date: str = ""
):
    try:
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web_scraper.js")

        # Verify both script and node_modules exist
        if not os.path.exists(script_path):
            return {
                "links": [], 
                "error": f"web_scraper.js not found at {script_path}"
            }
        
        node_modules_path = os.path.join(script_dir, 'node_modules')
        if not os.path.exists(node_modules_path):
            return {
                "links": [],
                "error": f"node_modules not found. This usually means the build didn't complete properly. Please redeploy the service."
            }
        
        # Debug logging
        print(f"Script directory: {script_dir}")
        print(f"Script path: {script_path}")
        print(f"Script exists: {os.path.exists(script_path)}")
        print(f"node_modules exists: {os.path.exists(os.path.join(script_dir, 'node_modules'))}")
        
        # Check if script exists
        if not os.path.exists(script_path):
            available_files = os.listdir(script_dir) if os.path.exists(script_dir) else []
            return {
                "links": [], 
                "error": f"Script not found at {script_path}. Available files: {available_files[:10]}"
            }
        
        # Check if node_modules exists
        node_modules_path = os.path.join(script_dir, 'node_modules')
        if not os.path.exists(node_modules_path):
            return {
                "links": [],
                "error": f"node_modules not found at {node_modules_path}. Dependencies may not be installed."
            }
        
        # Check Node.js availability
        try:
            node_version = subprocess.run(
                ["node", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            print(f"Node.js version: {node_version.stdout.strip()}")
        except Exception as e:
            return {
                "links": [],
                "error": f"Node.js not available: {str(e)}"
            }
        
        # Prepare the command
        cmd = ["node", script_path, title, author or "", categories or "", date or ""]
        print(f"Running command: {' '.join(cmd)}")
        
        # Run the Node.js scraper
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=60,
            cwd=script_dir,
            env={**os.environ, "NODE_ENV": "production"}
        )
        
        # Log the results
        print(f"Return code: {result.returncode}")
        print(f"Stdout length: {len(result.stdout)}")
        print(f"Stderr length: {len(result.stderr)}")
        
        # Check for errors
        if result.returncode != 0:
            error_msg = result.stderr or "Unknown error"
            print(f"Scraper error (exit code {result.returncode}):")
            print(f"STDERR: {error_msg[:1000]}")  # First 1000 chars
            
            # Try to parse stderr as JSON
            try:
                error_data = json.loads(result.stderr)
                return {
                    "links": [], 
                    "error": error_data.get("error", error_msg),
                    "stack": error_data.get("stack", "")[:500]  # Truncate stack trace
                }
            except json.JSONDecodeError:
                return {
                    "links": [], 
                    "error": error_msg[:500]  # Truncate error message
                }
        
        # Check if stdout is empty
        if not result.stdout or result.stdout.strip() == "":
            print("Scraper returned empty output")
            if result.stderr:
                print(f"STDERR: {result.stderr[:1000]}")
            return {
                "links": [], 
                "error": "No output from scraper",
                "stderr": result.stderr[:500] if result.stderr else None
            }
        
        # Parse stdout as JSON
        try:
            print(f"Parsing output (first 200 chars): {result.stdout[:200]}")
            data = json.loads(result.stdout)
            
            # Handle warning from scraper
            if "warning" in data:
                print(f"Scraper warning: {data['warning']}")
            
            return data
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Raw stdout (first 500 chars): {result.stdout[:500]}")
            print(f"Raw stderr: {result.stderr[:500]}")
            
            return {
                "links": [], 
                "error": f"Invalid JSON from scraper: {str(e)}",
                "raw_output": result.stdout[:200]
            }
            
    except subprocess.TimeoutExpired:
        print("Scraper timeout after 60 seconds")
        return {
            "links": [], 
            "error": "Scraper timeout after 60 seconds"
        }
        
    except FileNotFoundError as e:
        print(f"File not found error: {e}")
        return {
            "links": [], 
            "error": f"Command not found: {str(e)}. Is Node.js installed?"
        }
        
    except Exception as e:
        print(f"Unexpected error in related_links: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "links": [], 
            "error": f"Unexpected error: {str(e)}",
            "type": type(e).__name__
        }


# Also add a debug endpoint to check the environment
@app.get("/debug/environment")
async def debug_environment():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    info = {
        "script_dir": script_dir,
        "files_in_dir": os.listdir(script_dir)[:20] if os.path.exists(script_dir) else [],
        "node_modules_exists": os.path.exists(os.path.join(script_dir, 'node_modules')),
        "web_scraper_exists": os.path.exists(os.path.join(script_dir, 'web_scraper.js')),
        "package_json_exists": os.path.exists(os.path.join(script_dir, 'package.json')),
    }
    
    # Check Node.js
    try:
        node_check = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        info["node_version"] = node_check.stdout.strip()
        info["node_available"] = node_check.returncode == 0
    except Exception as e:
        info["node_available"] = False
        info["node_error"] = str(e)
    
    # Check npm
    try:
        npm_check = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        info["npm_version"] = npm_check.stdout.strip()
        info["npm_available"] = npm_check.returncode == 0
    except Exception as e:
        info["npm_available"] = False
        info["npm_error"] = str(e)
    
    # Check for specific packages
    node_modules_path = os.path.join(script_dir, 'node_modules')
    if os.path.exists(node_modules_path):
        packages = ["cheerio", "puppeteer", "franc", "franc-min", "puppeteer-extra"]
        info["installed_packages"] = {
            pkg: os.path.exists(os.path.join(node_modules_path, pkg))
            for pkg in packages
        }
    
    return info
 
@app.post("/extract-text")
async def extract_text_from_pdf(
    file: UploadFile = File(None),   
    file_url: str = Form(None),      
    file_name: str = Form(None)      
):
    try:
        if file:
            pdf_bytes = await file.read()
            filename = file.filename
        elif file_url:
            pdf_bytes = download_file(file_url)
            filename = file_name or file_url.split("/")[-1]
        else:
            return {"status": "error", "error": "No file or file URL provided"}

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