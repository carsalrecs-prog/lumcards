import os
import tempfile
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2AuthorizationCodeBearer
from dotenv import load_dotenv

# Load environment variables from .env (will be copied later)
load_dotenv()

# Import internal modules (will be copied later)
from .flashcards.anki.anki_parser import parse_apkg
from .flashcards.quizlet.quizlet_api import (
    get_authorization_url,
    exchange_code_for_token,
    get_user_sets,
    get_set_terms,
    convert_quizlet_set_to_flashcards,
)

app = FastAPI(title="Flashcards Service")

# --- Anki import -------------------------------------------------
@app.post("/api/anki/import")
async def import_anki(file: UploadFile = File(...)):
    safe_filename = Path(file.filename or "import.apkg").name
    tmp_path = Path(tempfile.gettempdir()) / f"upload_{safe_filename}"
    with open(tmp_path, "wb") as f:
        f.write(await file.read())
    try:
        flashcard_set = parse_apkg(str(tmp_path))
        return JSONResponse(content=flashcard_set.to_dict())
    finally:
        tmp_path.unlink(missing_ok=True)

# --- Quizlet OAuth ------------------------------------------------
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=get_authorization_url(),
    tokenUrl="https://api.quizlet.com/oauth/token",
)

@app.get("/api/quizlet/auth-url")
def quizlet_auth_url(state: str = "quizlet_state"):
    return {"url": get_authorization_url(state)}

@app.post("/api/quizlet/token")
def quizlet_token(code: str):
    token_data = exchange_code_for_token(code)
    return token_data

@app.get("/api/quizlet/sets")
def list_user_sets(access_token: str = Depends(oauth2_scheme)):
    username = "me"
    sets = get_user_sets(access_token, username)
    return sets

@app.get("/api/quizlet/sets/{set_id}")
def get_set(set_id: str, access_token: str = Depends(oauth2_scheme)):
    sets = get_user_sets(access_token, "me")
    set_info = next((s for s in sets if s["id"] == set_id), None)
    if not set_info:
        raise HTTPException(status_code=404, detail="Set not found")
    terms = get_set_terms(access_token, set_id)
    flashcard_set = convert_quizlet_set_to_flashcards(set_info, terms)
    return flashcard_set
