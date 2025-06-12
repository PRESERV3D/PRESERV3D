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

### Start the backend server (for display and upload)

```bash
cd model-uploader
node server.js
```

### Start to rnu NLP (for summary and metadata generation)

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
