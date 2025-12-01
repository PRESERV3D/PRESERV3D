"""
Preload transformer models during build time to avoid downloading on first use
"""
import os

print("Preloading models to cache...")

# Set cache directory
cache_dir = os.getenv("HF_HOME", "./models_cache")
os.makedirs(cache_dir, exist_ok=True)

try:
    # Preload sentence transformer model
    print("Downloading paraphrase-MiniLM-L3-v2...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('paraphrase-MiniLM-L3-v2', cache_folder=cache_dir)
    print("✓ Sentence transformer model cached")
    del model
except Exception as e:
    print(f"Failed to preload sentence transformer: {e}")

try:
    # Preload DistilBART model
    print("Downloading sshleifer/distilbart-cnn-12-6...")
    from transformers import pipeline
    summarizer = pipeline(
        "summarization",
        model="sshleifer/distilbart-cnn-12-6",
        device=-1,
        model_kwargs={"cache_dir": cache_dir}
    )
    print("✓ DistilBART model cached")
    del summarizer
except Exception as e:
    print(f"Failed to preload DistilBART: {e}")

print("Model preloading complete!")
