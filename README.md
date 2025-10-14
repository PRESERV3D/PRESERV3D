# PRESERV3D (preserv3d)

Information System for PUP Library Archives

## Install the dependencies

```bash
npm install
```

### Install Quasar CLI globally and local dependencies

```bash
npm install -g @quasar/cli

npm install @quasar/cli
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Start to run NLP (for summary and metadata generation)

```bash
cd services

# Create a virtual environment for Python dependencies
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\activate

# Install the required Python packages
pip install -r requirements.txt

# Start the NLP service with hot reloading
uvicorn nlp_service:app --reload --host 0.0.0.0 --port 8000
```

### Build the app for production

```bash
quasar build
```

## NLP service / Hugging Face notes

The project includes a small FastAPI-based NLP service in `services/nlp_service.py` used for:

- PDF text extraction and OCR fallback
- NER-based metadata extraction (uses a local spaCy model in `services/nlp_training/ner_model`)
- Keyword extraction and summarization through Hugging Face inference APIs

Important deployment notes:

- Environment variable: `HF_API_TOKEN` (Hugging Face API token) is required for the NLP service to call Hugging Face inference endpoints. Add this to your Render/Vercel/host environment settings.
- To avoid mismatches with different HF pipeline types (for example the SentenceSimilarity pipeline which expects `sentences`/`references`), the service uses the dedicated embeddings endpoint at:

  https://api-inference.huggingface.co/embeddings

  The code sends payloads like `{ "model": "sentence-transformers/all-MiniLM-L6-v2", "input": "..." }` and includes normalization for common response shapes.

- Start the NLP service (repeat of steps above):

```powershell
cd services
.\venv\Scripts\activate
uvicorn nlp_service:app --reload --host 0.0.0.0 --port 8000
```
