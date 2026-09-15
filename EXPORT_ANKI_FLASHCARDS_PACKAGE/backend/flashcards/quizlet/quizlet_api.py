import os
import requests
from typing import List, Dict, Any, Optional

# Constants – replace with your actual Quizlet app credentials
CLIENT_ID = os.getenv('QUIZLET_CLIENT_ID')
CLIENT_SECRET = os.getenv('QUIZLET_CLIENT_SECRET')
REDIRECT_URI = os.getenv('QUIZLET_REDIRECT_URI')

# Scopes required for reading decks and creating games
SCOPES = ['read']

def get_authorization_url(state: str = 'quizlet_state') -> str:
    """Generate the OAuth2 authorization URL for Quizlet.
    The user should be redirected to this URL to grant access.
    """
    base = 'https://quizlet.com/authorize'
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'scope': ' '.join(SCOPES),
        'redirect_uri': REDIRECT_URI,
        'state': state,
    }
    from urllib.parse import urlencode
    return f"{base}?{urlencode(params)}"

def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange the authorization code for an access token.
    Returns the JSON response containing access_token, refresh_token, expires_in, etc.
    """
    token_url = 'https://api.quizlet.com/oauth/token'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()

def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """Refresh an expired access token using the refresh token."""
    token_url = 'https://api.quizlet.com/oauth/token'
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()

def get_user_sets(access_token: str, username: str) -> List[Dict[str, Any]]:
    """Retrieve the list of flashcard sets belonging to a user.
    Returns a list of set metadata dictionaries.
    """
    url = f'https://api.quizlet.com/2.0/users/{username}/sets'
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def get_set_terms(access_token: str, set_id: str) -> List[Dict[str, Any]]:
    """Fetch the terms (cards) of a specific set.
    Returns a list where each item contains 'term' and 'definition'.
    """
    url = f'https://api.quizlet.com/2.0/sets/{set_id}/terms'
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def convert_quizlet_set_to_flashcards(set_data: Dict[str, Any], terms: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Transform Quizlet set JSON into our FlashcardSet dict format.
    This can be fed directly into FlashcardSet(**...).
    """
    cards = []
    for term in terms:
        cards.append({
            'front': term.get('term', ''),
            'back': term.get('definition', ''),
            'tags': term.get('image_url') and ['image'] or [],
            'extra': {'image_url': term.get('image_url')}
        })
    return {
        'name': set_data.get('title', 'Quizlet Set'),
        'source': 'quizlet',
        'cards': cards,
    }

# Helper for premium game modes – placeholders for now
def start_game_mode(access_token: str, mode: str, set_id: str) -> Dict[str, Any]:
    """Start a Quizlet game mode (e.g., 'learn', 'match', 'gravity').
    This is a stub; actual implementation depends on Quizlet's Game API (if available).
    """
    # Quizlet does not expose a public game API; this function would orchestrate
    # client‑side behavior using the fetched terms.
    terms = get_set_terms(access_token, set_id)
    return {
        'mode': mode,
        'terms': terms,
    }
