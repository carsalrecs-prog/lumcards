import sqlite3
import json
import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from typing import List

from ..types import Flashcard, FlashcardSet

def _extract_notes(db_path: str) -> List[dict]:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, flds FROM notes")
    notes = []
    for row in cur.fetchall():
        notes.append({"id": row[0], "fields": row[1].split('\x1f')})
    conn.close()
    return notes

def _extract_cards(db_path: str) -> List[dict]:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT nid, ord FROM cards")
    cards = []
    for row in cur.fetchall():
        cards.append({"nid": row[0], "ord": row[1]})
    conn.close()
    return cards

def import_anki(apkg_path: str) -> FlashcardSet:
    if not os.path.isfile(apkg_path):
        raise FileNotFoundError(f"Anki package not found: {apkg_path}")
    temp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(apkg_path, 'r') as z:
            z.extractall(temp_dir)
        collection_path = os.path.join(temp_dir, 'collection.anki2')
        if not os.path.isfile(collection_path):
            raise FileNotFoundError('collection.anki2 not found inside the .apkg archive')
        notes = _extract_notes(collection_path)
        cards = _extract_cards(collection_path)
        note_map = {n['id']: n['fields'] for n in notes}
        flashcards: List[Flashcard] = []
        for card in cards:
            nid = card['nid']
            fields = note_map.get(nid)
            if not fields or len(fields) < 2:
                continue
            front, back = fields[0], fields[1]
            flashcards.append(Flashcard(front=front, back=back))
        set_name = Path(apkg_path).stem
        return FlashcardSet(name=set_name, cards=flashcards)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

parse_apkg = import_anki

def export_to_json(flashcard_set: FlashcardSet, output_path: str) -> None:
    data = {
        "name": flashcard_set.name,
        "cards": [{"front": c.front, "back": c.back, "tags": c.tags or []} for c in flashcard_set.cards]
    }
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
