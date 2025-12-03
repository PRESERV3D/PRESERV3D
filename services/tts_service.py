import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.cloud import texttospeech
from google.oauth2 import service_account
import io
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
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

# --- Google Cloud TTS Configuration ---
CREDENTIALS_PATH = "secrets/google-credentials.json"

def get_google_credentials():
    """Authenticates with Google Cloud using service account credentials."""
    if not os.path.exists(CREDENTIALS_PATH):
        raise FileNotFoundError(
            "Google Cloud credentials file not found. "
            f"Please place your service account JSON key at: {CREDENTIALS_PATH}"
        )
    try:
        return service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
    except Exception as e:
        raise ConnectionError(f"Failed to load Google Cloud credentials: {e}")

try:
    credentials = get_google_credentials()
    tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
    print("Google Cloud TTS client initialized successfully.")
except (FileNotFoundError, ConnectionError) as e:
    tts_client = None
    print(f"Warning: {e}")
    print("TTS functionality will be disabled until credentials are provided.")

class TTSRequest(BaseModel):
    text: str
    language_code: str = 'en-US'
    voice_name: str = 'en-US-Neural2-A'
    use_ssml: bool = False  # Flag to indicate if text contains SSML markup

@app.post("/generate-tts")
async def generate_tts(request: TTSRequest):
    """
    Generates speech from text using Google Cloud TTS.
    Supports both plain text and SSML markup.
    """
    if tts_client is None:
        raise HTTPException(
            status_code=503,
            detail="TTS service is not available. Check server logs for configuration issues."
        )

    try:
        # Choose input type based on use_ssml flag
        if request.use_ssml:
            synthesis_input = texttospeech.SynthesisInput(ssml=request.text)
        else:
            synthesis_input = texttospeech.SynthesisInput(text=request.text)

        # Voice selection
        voice = texttospeech.VoiceSelectionParams(
            language_code=request.language_code, name=request.voice_name
        )

        # Audio configuration
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Perform the text-to-speech request
        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # Stream the audio back to the client
        return StreamingResponse(io.BytesIO(response.audio_content), media_type="audio/mpeg")

    except Exception as e:
        print(f"Error during TTS generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {e}")

@app.get("/health")
def health_check():
    """Health check endpoint to verify service status."""
    if tts_client:
        return {"status": "ok", "tts_service": "available"}
    return {"status": "error", "tts_service": "unavailable", "reason": "Client not initialized."}

if __name__ == "__main__":
    import uvicorn
    # Recommended to run with: uvicorn tts_service:app --reload --port 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)
