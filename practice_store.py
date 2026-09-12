"""Original local practice history; independent of any flashcard engine."""
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import uuid


class PracticeStore:
    def __init__(self, directory):
        self.path = Path(directory) / 'practice.sqlite3'

    def _connect(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute('''CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY, mode TEXT NOT NULL, deck_name TEXT NOT NULL,
            correct INTEGER NOT NULL, total INTEGER NOT NULL, mistakes INTEGER NOT NULL,
            elapsed_ms INTEGER NOT NULL, completed_at TEXT NOT NULL)''')
        return db

    def save(self, body):
        try:
            session_id = str(uuid.UUID(body.get('id', '')))
        except (ValueError, TypeError, AttributeError):
            raise ValueError('La partida no tiene un identificador válido.') from None
        mode = body.get('mode')
        if mode not in ('choice', 'write', 'match', 'learn', 'test', 'flash'):
            raise ValueError('Modo de práctica no válido.')
        name = body.get('deckName', '')
        if not isinstance(name, str) or len(name) > 240:
            raise ValueError('Nombre de mazo no válido.')
        values = {}
        for field, low, high in (('total', 1, 200), ('correct', 0, 200),
                                 ('mistakes', 0, 10000), ('elapsedMs', 0, 86400000)):
            value = body.get(field)
            if type(value) is not int or not low <= value <= high:
                raise ValueError('Resultado de práctica no válido: ' + field)
            values[field] = value
        if values['correct'] > values['total']:
            raise ValueError('Los aciertos superan el número de preguntas.')
        with closing(self._connect()) as db, db:
            db.execute('INSERT OR IGNORE INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                       (session_id, mode, name, values['correct'], values['total'],
                        values['mistakes'], values['elapsedMs'], datetime.now(timezone.utc).isoformat()))
        return {'saved': True, 'id': session_id}

    def history(self):
        if not self.path.exists():
            return []
        with closing(self._connect()) as db:
            return [dict(row) for row in db.execute(
                'SELECT * FROM sessions ORDER BY completed_at DESC LIMIT 30')]
