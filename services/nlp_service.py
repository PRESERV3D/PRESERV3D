from fastapi.responses import JSONResponse
import fitz
import spacy
import re
import os
import math
import subprocess
import base64
import json
import requests
import sys
import psutil
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from dateutil.parser import parse as date_parse
import nltk

# Configure NLTK data path to use virtual environment
nltk_data_path = os.path.join(os.path.dirname(__file__), 'nltk_data')
os.makedirs(nltk_data_path, exist_ok=True)
nltk.data.path.insert(0, nltk_data_path)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt_tab')
    print("NLTK punkt_tab tokenizer already downloaded")
except LookupError:
    print("Downloading NLTK punkt_tab tokenizer...")
    nltk.download('punkt_tab', download_dir=nltk_data_path, quiet=False)
    print("NLTK punkt_tab downloaded successfully")

app = FastAPI()
load_dotenv()

# Configuration for summarization mode
# SUMMARY_MODE: 'extractive' (fast, low memory) or 'abstractive' (BART, high quality)
SUMMARY_MODE = os.getenv("SUMMARY_MODE", "abstractive").lower()
print(f"Summary mode: {SUMMARY_MODE}")


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9000",
        "https://preserv3d.vercel.app",
        "https://*.vercel.app",
        "https://*.onrender.com",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load sentence-transformers for local embeddings
_sentence_transformer = None
try:
    from sentence_transformers import SentenceTransformer
    print("Attempting to load local sentence-transformers model...")
    _sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
    print("Local embedding model loaded successfully")
except Exception as e:
    print(f"Warning: Could not load sentence-transformers locally: {e}")
    print("Will use TF-IDF based similarity as fallback")

_nlp = None
_summarizer = None
_textrank_summarizer = None

def get_nlp():
    global _nlp
    if _nlp is None:
        print("Loading custom NER model...")
        _nlp = spacy.load("nlp_training/ner_model")
        print("Custom NER model loaded successfully")
    return _nlp

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        from transformers import pipeline
        print("Loading DistilBART summarizer (one-time load)...")
        _summarizer = pipeline(
            "summarization",
            model="sshleifer/distilbart-cnn-12-6",
            device=-1,
            framework="pt"
        )
        print("Summarizer loaded and cached")
    return _summarizer

def get_textrank_summarizer():
    global _textrank_summarizer
    if _textrank_summarizer is None:
        from sumy.summarizers.text_rank import TextRankSummarizer
        print("Initializing TextRank summarizer...")
        _textrank_summarizer = TextRankSummarizer()
        print("TextRank summarizer ready")
    return _textrank_summarizer

def clear_memory():
    import gc
    gc.collect()
    if hasattr(psutil.Process(), 'memory_info'):
        process = psutil.Process()
        mem_mb = process.memory_info().rss / 1024 / 1024
        print(f"Memory after cleanup: {mem_mb:.2f} MB")

def get_local_embeddings(text):
    if _sentence_transformer is not None:
        try:
            # Truncate text to avoid memory issues
            text_sample = text[:512]
            embedding = _sentence_transformer.encode(text_sample, convert_to_tensor=False)
            return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
        except Exception as e:
            print(f"Local embedding error: {e}")
            return None
    return None

def get_tfidf_similarity(text1, text2):
    from collections import Counter
    import re
    
    # Tokenize and normalize
    def tokenize(text):
        words = re.findall(r'\b\w+\b', text.lower())
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 
                      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
                      'that', 'these', 'those', 'it', 'its', 'they', 'their', 'them'}
        return [w for w in words if w not in stop_words and len(w) > 2]
    
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    
    if not tokens1 or not tokens2:
        return 0.0
    
    # Calculate term frequencies
    freq1 = Counter(tokens1)
    freq2 = Counter(tokens2)
    
    # Get all unique terms
    all_terms = set(freq1.keys()) | set(freq2.keys())
    
    # Calculate dot product and magnitudes
    dot_product = sum(freq1.get(term, 0) * freq2.get(term, 0) for term in all_terms)
    magnitude1 = math.sqrt(sum(count ** 2 for count in freq1.values()))
    magnitude2 = math.sqrt(sum(count ** 2 for count in freq2.values()))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)

def get_embeddings(text):
    # Try local sentence-transformers first
    emb = get_local_embeddings(text)
    if emb and isinstance(emb, list) and len(emb) > 0:
        return emb
    
    # If local embeddings fail, we'll use TF-IDF similarity directly in the calling function
    print("Local embeddings unavailable, will use TF-IDF similarity")
    return []

def extract_keywords_hf(text, top_n=10):
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

def summarize_text_extractive(text, max_sentences=5):
    try:
        from sumy.parsers.plaintext import PlaintextParser
        from sumy.nlp.tokenizers import Tokenizer
        import gc
        
        # Get process for monitoring
        process = psutil.Process()
        
        # Record initial state
        start_time = time.time()
        mem_before = process.memory_info().rss / 1024 / 1024  # MB
        cpu_before = process.cpu_percent(interval=0.1)
        
        print("Using fast extractive summarization (TextRank)...")
        print(f"Initial RAM: {mem_before:.2f} MB, CPU: {cpu_before:.1f}%")
        
        # Prepare text - use more content for extractive
        input_text = text[:4000].strip()
        
        if len(input_text.split()) < 30:
            print("Text too short for summarization")
            raise Exception("Text too short")
        
        # Parse and summarize
        parser = PlaintextParser.from_string(input_text, Tokenizer("english"))
        summarizer = get_textrank_summarizer()
        summary_sentences = summarizer(parser.document, max_sentences)
        summary = " ".join(str(s) for s in summary_sentences)
        
        # Cleanup
        del parser
        gc.collect()
        
        # Record final state
        end_time = time.time()
        mem_after = process.memory_info().rss / 1024 / 1024  # MB
        cpu_after = process.cpu_percent(interval=0.1)
        
        # Calculate metrics
        duration = end_time - start_time
        mem_used = mem_after - mem_before
        mem_peak = mem_after if mem_after > mem_before else mem_before
        cpu_avg = (cpu_before + cpu_after) / 2
        
        print(f"Extractive summary generated: {len(summary)} chars")
        print(f"Resource usage - Duration: {duration:.2f}s, RAM: {mem_after:.2f} MB (Δ{mem_used:+.2f} MB, Peak: {mem_peak:.2f} MB), CPU: {cpu_avg:.1f}%")
        
        return summary
        
    except Exception as e:
        print(f"Extractive summarization failed: {e}, using simple fallback")
        # Simple sentence extraction fallback
        sentences = re.split(r'[.!?]\s+', text[:2000])
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        summary_sentences = sentences[:min(5, len(sentences))]
        return ' '.join(summary_sentences) + '.'

def summarize_text_abstractive(text, max_length=160, min_length=50):
    try:
        import gc
        import torch
        
        # Get process for monitoring
        process = psutil.Process()
        
        # Record initial state
        start_time = time.time()
        mem_before = process.memory_info().rss / 1024 / 1024  # MB
        cpu_before = process.cpu_percent(interval=0.1)
        
        print("Using abstractive summarization (DistilBART)...")
        print(f"Initial RAM: {mem_before:.2f} MB, CPU: {cpu_before:.1f}%")
        
        # Check if we're approaching memory limit
        if mem_before > 1800:
            print(f"⚠️ High memory usage detected ({mem_before:.2f} MB), forcing cleanup...")
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            mem_before = process.memory_info().rss / 1024 / 1024
            print(f"After cleanup: {mem_before:.2f} MB")
        
        # Use cached summarizer (avoids reloading model each time)
        summarizer = get_summarizer()
        
        # Prepare text
        input_text = text[:4000].strip()
        
        if len(input_text.split()) < 50:
            print("Text too short for abstractive summarization")
            raise Exception("Text too short")
        
        # Generate summary with memory-efficient settings
        result = summarizer(
            input_text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False,
            truncation=True,
            clean_up_tokenization_spaces=True,
            batch_size=1
        )
        
        summary = result[0]['summary_text'].strip()
        
        # Force cleanup after generation
        del result
        gc.collect()
        
        # Record final state
        end_time = time.time()
        mem_after = process.memory_info().rss / 1024 / 1024  # MB
        cpu_after = process.cpu_percent(interval=0.1)
        
        # Calculate metrics
        duration = end_time - start_time
        mem_used = mem_after - mem_before
        mem_peak = mem_after if mem_after > mem_before else mem_before
        cpu_avg = (cpu_before + cpu_after) / 2
        
        print(f"Abstractive summary generated: {len(summary)} chars")
        print(f"Resource usage - Duration: {duration:.2f}s, RAM: {mem_after:.2f} MB (Δ{mem_used:+.2f} MB, Peak: {mem_peak:.2f} MB), CPU: {cpu_avg:.1f}%")
        
        # Warn if approaching limit
        if mem_after > 1700:
            print(f"⚠️ Warning: Memory usage high ({mem_after:.2f} MB / 2048 MB limit)")
        
        return summary
        
    except Exception as e:
        print(f"Abstractive summarization failed: {e}")
        raise

@app.head("/health")
@app.get("/health")
async def health_check():
    process = psutil.Process()
    mem_mb = process.memory_info().rss / 1024 / 1024
    cpu_percent = process.cpu_percent(interval=0.1)
    
    return {
        "status": "healthy",
        "service": "nlp_service",
        "timestamp": datetime.utcnow().isoformat(),
        "memory_mb": round(mem_mb, 2),
        "memory_percent": round((mem_mb / 2048) * 100, 1),  # Assuming 2GB limit
        "cpu_percent": round(cpu_percent, 1),
        "summary_mode": SUMMARY_MODE,
        "models_loaded": {
            "ner": _nlp is not None,
            "summarizer_bart": _summarizer is not None,
            "summarizer_textrank": _textrank_summarizer is not None
        }
    }

@app.head("/")
@app.get("/")
async def root():
    return {
        "message": "PRESERV3D NLP Service",
        "status": "running",
        "summary_mode": SUMMARY_MODE,
        "endpoints": ["/health", "/process-text", "/enhance-summary", "/extract-text", "/check-relevance", "/related-links", "/rescan-metadata" ]
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

            # NER-driven metadata extraction using custom model
            metadata = extract_metadata_ner(cleaned_text, filename or (file.filename if file else None))

            # Keyword Extraction via HF API (with NER fallback)
            try:
                keywords = extract_keywords_hf(cleaned_text, top_n=10)
            except Exception as e:
                print("Keyword extraction error:", e)
                keywords = []

            # Summarization - use configured mode (extractive by default)
            try:
                if SUMMARY_MODE == "abstractive":
                    # High-quality but resource-intensive
                    print("Using abstractive mode (DistilBART)")
                    initial_summary = summarize_text_abstractive(cleaned_text[:4000])
                else:
                    # Fast and memory-efficient (default)
                    print("Using extractive mode (TextRank)")
                    initial_summary = summarize_text_extractive(cleaned_text[:4000])
                
                if not initial_summary:
                    print("Summarizer returned no output")
                    summary = None
                else:
                    # Check relevance
                    relevance_issue = check_summary_relevance(
                        title=metadata.get("title"),
                        summary=initial_summary,
                        keywords=keywords,
                        categories=metadata.get("categories"),
                        author=metadata.get("author"),
                        date=metadata.get("date"),
                        extracted_text=cleaned_text[:1000]
                    )
                    
                    if relevance_issue:
                        print(f"Relevance issue detected: {relevance_issue.get('issue')}")
                        print("Attempting to improve summary with keyword-based extractive method...")
                        
                        # Use keyword-based extractive method as improvement
                        improved_summary = generate_summary(
                            text=cleaned_text,
                            title=metadata.get("title"),
                            author=metadata.get("author"),
                            date=metadata.get("date"),
                            keywords=keywords,
                            categories=metadata.get("categories")
                        )
                        
                        # Re-check improved summary
                        improved_issue = check_summary_relevance(
                            title=metadata.get("title"),
                            summary=improved_summary,
                            keywords=keywords,
                            categories=metadata.get("categories"),
                            author=metadata.get("author"),
                            date=metadata.get("date"),
                            extracted_text=cleaned_text[:1000]
                        )
                        
                        # Use whichever is better
                        if not improved_issue:
                            print("Keyword-based extractive summary passed relevance check")
                            summary = improved_summary
                        else:
                            print("Using original summary despite issues")
                            summary = initial_summary
                    else:
                        print("Summary passed relevance check")
                        summary = initial_summary
                        
            except Exception as e:
                print("Summarizer error:", e)
                summary = None

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
    
    # Semantic similarity check using embeddings or TF-IDF
    try:
        print(f"\nDocument Title: {title}")

        context_emb = get_embeddings(context_text) or []
        summary_emb = get_embeddings(summary) or []

        high_similarity = False

        if context_emb and summary_emb:
            similarity = cosine_similarity(context_emb, summary_emb)
            print(f"Summary similarity score (embeddings): {similarity:.3f}")
            
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
                # High semantic similarity (>= 0.55) -> mark and only log keyword coverage as a note
                high_similarity = True
                print(f"High semantic similarity ({similarity:.3f}) - skipping strict keyword check")
                if keywords and len(keywords) >= 3:
                    summary_lower = summary.lower()
                    keyword_matches = sum(1 for kw in keywords if kw and kw.lower() in summary_lower)
                    keyword_coverage = keyword_matches / len(keywords)
                    print(f"Note: Keyword coverage: {keyword_matches}/{len(keywords)} ({keyword_coverage:.1%})")
        else:
            # Use TF-IDF similarity as fallback
            print("Using TF-IDF similarity check as fallback")
            similarity = get_tfidf_similarity(context_text, summary)
            print(f"Summary similarity score (TF-IDF): {similarity:.3f}")
            
            # Slightly adjusted thresholds for TF-IDF (more lenient)
            if similarity < 0.15:
                return {
                    "field": "summary",
                    "issue": f"Summary has low word overlap with document context (score: {similarity:.2f})",
                    "suggestion": "Rewrite the summary to better reflect the main topics, themes, and key points of the document.",
                    "severity": "high"
                }
            elif similarity < 0.25:
                return {
                    "field": "summary",
                    "issue": f"Summary word overlap could be improved (score: {similarity:.2f})",
                    "suggestion": "Consider revising the summary to include more key terms from the document.",
                    "severity": "medium"
                }
            else:
                # Good TF-IDF similarity (>= 0.25) -> mark and only log keyword coverage as a note
                high_similarity = True
                print(f"Good TF-IDF similarity ({similarity:.3f}) - skipping strict keyword check")
                if keywords and len(keywords) >= 3:
                    summary_lower = summary.lower()
                    keyword_matches = sum(1 for kw in keywords if kw and kw.lower() in summary_lower)
                    keyword_coverage = keyword_matches / len(keywords)
                    print(f"Note: Keyword coverage: {keyword_matches}/{len(keywords)} ({keyword_coverage:.1%})")
    except Exception as e:
        print(f"Similarity check failed: {e}")
    
    # Keyword overlap check - only runs if similarity was LOW
    if not high_similarity and keywords and len(keywords) >= 3:
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

def generate_summary(text, title=None, author=None, date=None, keywords=None, categories=None, max_attempts=2):
    import gc
    
    # Get process for monitoring
    process = psutil.Process()
    
    # Record initial state
    start_time = time.time()
    mem_before = process.memory_info().rss / 1024 / 1024  # MB
    cpu_before = process.cpu_percent(interval=0.1)
    
    print("Generating extractive summary...")
    print(f"Initial RAM: {mem_before:.2f} MB, CPU: {cpu_before:.1f}%")
    
    # Check memory threshold
    if mem_before > 1800:
        print(f"⚠️ High memory usage, forcing cleanup before extractive summary...")
        gc.collect()
        mem_before = process.memory_info().rss / 1024 / 1024
        print(f"After cleanup: {mem_before:.2f} MB")
    
    cleaned_text = clean_text(text)
    # Reduce to 2500 chars to lower memory usage
    input_text = cleaned_text[:2500]
    
    if len(input_text.strip()) < 100:
        return "Insufficient content for summary generation."
    
    # Split into proper sentences with better handling
    sentences = re.split(r'[.!?]+', input_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    # Filter out metadata/header sentences
    filtered_sentences = []
    for sent in sentences:
        sent_lower = sent.lower()
        # Skip metadata, citations, URLs, journal info
        if any(marker in sent_lower for marker in [
            'issn', 'volume-', 'issue-', 'pp.', 'doi:', 'http://', 'https://',
            'email:', '@', 'department of', 'school of', 'university',
            'journal', 'copyright', 'reserved', 'published'
        ]):
            continue
        
        # Skip very short or very long sentences
        word_count = len(sent.split())
        if word_count < 8 or word_count > 45:
            continue
        
        # Skip sentences that are mostly uppercase (headers)
        if sum(1 for c in sent if c.isupper()) > len(sent) * 0.5:
            continue
            
        filtered_sentences.append(sent)
    
    if not filtered_sentences:
        # Fallback to original sentences if filtering removed everything
        filtered_sentences = [s for s in sentences if len(s.split()) >= 8][:10]
    
    # Score sentences by relevance and content quality
    scored = []
    title_words = set(re.findall(r'\b\w{4,}\b', title.lower())) if title and title != "Unknown" else set()
    
    for idx, sent in enumerate(filtered_sentences[:15]):
        score = 0
        sent_lower = sent.lower()
        
        # Position score (earlier sentences slightly preferred)
        score += (15 - idx) * 0.3
        
        # Keyword matches (high priority)
        if keywords:
            keyword_matches = sum(1 for kw in keywords if kw and kw.lower() in sent_lower)
            score += keyword_matches * 4
        
        # Title word matches
        title_matches = sum(1 for word in title_words if word in sent_lower)
        score += title_matches * 2
        
        # Contextual quality indicators (prefer informative content)
        quality_words = [
            'study', 'research', 'analysis', 'result', 'finding', 'conclusion',
            'investigate', 'examine', 'demonstrate', 'indicate', 'suggest',
            'purpose', 'objective', 'method', 'approach', 'impact', 'effect'
        ]
        quality_matches = sum(1 for word in quality_words if word in sent_lower)
        score += quality_matches * 1.5
        
        # Proper capitalization (quality indicator)
        if sent and sent[0].isupper():
            score += 0.5
        
        scored.append((score, sent, idx))
    
    # Select top 3-4 sentences with good scores
    scored.sort(key=lambda x: x[0], reverse=True)
    top_scored = scored[:4]
    
    # Preserve original document order for readability
    top_scored.sort(key=lambda x: x[2])
    
    # Format summary with proper structure
    summary_parts = []
    for score, sent, idx in top_scored:
        # Clean and capitalize
        cleaned = sent.strip()
        if cleaned and cleaned[0].islower():
            cleaned = cleaned[0].upper() + cleaned[1:]
        summary_parts.append(cleaned)
    
    # Join with proper punctuation
    summary = '. '.join(summary_parts)
    if summary and not summary.endswith('.'):
        summary += '.'
    
    # Clean up spacing
    summary = re.sub(r'\s+', ' ', summary).strip()
    
    # Cleanup
    del filtered_sentences, scored, top_scored
    gc.collect()
    
    # Record final state
    end_time = time.time()
    mem_after = process.memory_info().rss / 1024 / 1024  # MB
    cpu_after = process.cpu_percent(interval=0.1)
    
    # Calculate metrics
    duration = end_time - start_time
    mem_used = mem_after - mem_before
    mem_peak = mem_after if mem_after > mem_before else mem_before
    cpu_avg = (cpu_before + cpu_after) / 2
    
    print(f"Extractive summary complete")
    print(f"Resource usage - Duration: {duration:.2f}s, RAM: {mem_after:.2f} MB (Δ{mem_used:+.2f} MB, Peak: {mem_peak:.2f} MB), CPU: {cpu_avg:.1f}%")
    
    # Warn if approaching limit
    if mem_after > 1700:
        print(f"⚠️ Warning: Memory usage high ({mem_after:.2f} MB / 2048 MB limit)")
    
    return summary

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

@app.post("/enhance-summary")
async def enhance_summary(request: Request):
    try:
        data = await request.json()
        
        text = data.get("text", "")
        title = data.get("title", "")
        keywords = data.get("keywords", [])
        categories = data.get("categories", "")
        author = data.get("author", "")
        date = data.get("date", "")
        
        if not text or len(text.strip()) < 100:
            return {
                "success": False,
                "error": "Text too short for enhancement (minimum 100 characters)"
            }
        
        # Clean text
        cleaned_text = clean_text(text)
        
        # Generate abstractive summary
        try:
            enhanced_summary = summarize_text_abstractive(cleaned_text[:4000], max_length=160, min_length=50)
        except Exception as e:
            return {
                "success": False,
                "error": f"Enhancement failed: {str(e)}"
            }
        
        if not enhanced_summary:
            return {
                "success": False,
                "error": "Enhancement produced no output"
            }
        
        # Check relevance of enhanced summary
        relevance_issue = check_summary_relevance(
            title=title,
            summary=enhanced_summary,
            keywords=keywords,
            categories=categories,
            author=author,
            date=date,
            extracted_text=cleaned_text[:1000]
        )
        
        return {
            "success": True,
            "summary": enhanced_summary,
            "relevance_check": {
                "passed": not bool(relevance_issue),
                "issue": relevance_issue if relevance_issue else None
            }
        }
        
    except Exception as e:
        print(f"Enhancement error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/check-relevance")
async def check_relevance_endpoint(request: Request):
    try:
        data = await request.json()
        
        title = data.get("title", "")
        summary = data.get("summary", "")
        keywords = data.get("keywords", [])
        categories = data.get("categories", "")
        author = data.get("author", "")
        date = data.get("date", "")
        extracted_text = data.get("extracted_text", "")
        
        # Check relevance using existing function
        relevance_issue = check_summary_relevance(
            title=title,
            summary=summary,
            keywords=keywords or [],
            categories=categories,
            author=author,
            date=date,
            extracted_text=extracted_text
        )
        
        if relevance_issue:
            return {
                "passed": False,
                "field": relevance_issue.get("field", "summary"),
                "issue": relevance_issue.get("issue", "Relevance check failed"),
                "suggestion": relevance_issue.get("suggestion", "Please revise the summary"),
                "severity": relevance_issue.get("severity", "medium")
            }
        else:
            return {
                "passed": True,
                "message": "Summary passed all relevance checks"
            }
            
    except Exception as e:
        print(f"Relevance check error: {e}")
        return {
            "passed": False,
            "field": "summary",
            "issue": f"Error checking relevance: {str(e)}",
            "suggestion": "Please try again or contact support",
            "severity": "high"
        }

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
            metadata.get("date"),
            metadata.get("extracted_text", "")[:1000] if metadata.get("extracted_text") else ""
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
                        "categories": metadata_json.get("categories", []),
                        "extracted_text": metadata_json.get("extracted_text", "")
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
    import time
    start_time = time.time()
    
    try:
        print(f"\n{'='*60}")
        print(f"[NLP Service] Related Links Request Started")
        print(f"{'='*60}")
        print(f"Title: {title}")
        print(f"Author: {author or '(none)'}")
        print(f"Categories: {categories or '(none)'}")
        print(f"Date: {date or '(none)'}")
        print(f"{'='*60}\n")
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.join(script_dir, "web_scraper.js")
        
        # Verify script exists
        if not os.path.exists(script_path):
            print(f"[ERROR] web_scraper.js not found at {script_path}")
            return {
                "links": [], 
                "error": f"web_scraper.js not found at {script_path}"
            }
        
        print(f"[OK] Found web_scraper.js at: {script_path}")
        
        # Prepare command
        cmd = ["node", "--expose-gc", script_path, title, author or "", categories or "", date or ""]
        print(f"[CMD] Executing: {' '.join(cmd)}")
        
        # Set up environment
        env = os.environ.copy()
        env["NODE_ENV"] = "production"
        env["NODE_PATH"] = os.path.join(script_dir, 'node_modules')
        
        print(f"[INFO] Starting subprocess with 180s timeout...")
        subprocess_start = time.time()
        
        # Run scraper with 3-minute timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=180,
            cwd=script_dir,
            env=env
        )
        
        subprocess_duration = time.time() - subprocess_start
        print(f"[INFO] Subprocess completed in {subprocess_duration:.2f}s")
        subprocess_duration = time.time() - subprocess_start
        print(f"[INFO] Subprocess completed in {subprocess_duration:.2f}s")
        
        # Handle errors
        if result.returncode != 0:
            print(f"[ERROR] Subprocess failed with return code {result.returncode}")
            print(f"[STDERR] {result.stderr[:1000] if result.stderr else '(empty)'}")
            error_msg = result.stderr or "Unknown error"
            try:
                error_data = json.loads(result.stderr)
                return {
                    "links": [], 
                    "error": error_data.get("error", error_msg)
                }
            except json.JSONDecodeError:
                return {
                    "links": [], 
                    "error": error_msg[:500]
                }
        
        print(f"[OK] Subprocess succeeded")
        
        # Parse and return results
        if not result.stdout or result.stdout.strip() == "":
            print(f"[ERROR] No output from scraper")
            print(f"[STDERR] {result.stderr[:1000] if result.stderr else '(empty)'}")
            return {
                "links": [], 
                "error": "No output from scraper"
            }
        
        print(f"[INFO] Parsing JSON output...")
        print(f"[STDOUT LENGTH] {len(result.stdout)} characters")
        
        try:
            data = json.loads(result.stdout)
            links_count = len(data.get('links', []))
            print(f"[SUCCESS] Parsed {links_count} links")
            
            total_duration = time.time() - start_time
            print(f"\n{'='*60}")
            print(f"[NLP Service] Related Links Request Complete")
            print(f"Total Duration: {total_duration:.2f}s")
            print(f"Links Returned: {links_count}")
            print(f"{'='*60}\n")
            
            return data
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON from scraper: {str(e)}")
            print(f"[STDOUT] {result.stdout[:500]}")
            return {
                "links": [], 
                "error": f"Invalid JSON from scraper: {str(e)}"
            }
            
    except subprocess.TimeoutExpired:
        print(f"[ERROR] Subprocess timeout after 180 seconds")
        print(f"[INFO] Total request time: {time.time() - start_time:.2f}s")
        return {
            "links": [], 
            "error": "Search timeout after 180 seconds. The search service may be slow or unavailable.",
            "suggestion": "DuckDuckGo may be blocking automated requests. Try again in a few minutes."
        }
    except FileNotFoundError as e:
        print(f"[ERROR] Node.js not found: {str(e)}")
        return {
            "links": [], 
            "error": f"Node.js not found: {str(e)}"
        }
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        print(f"[TRACEBACK] {traceback.format_exc()}")
        return {
            "links": [], 
            "error": f"Unexpected error: {str(e)}"
        }
    
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