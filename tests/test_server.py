"""HTTP integration checks against a disposable collection, never personal data."""
import json
import io
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='anki2-http-test-')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cls.port = sock.getsockname()[1]
        cls.url = f'http://127.0.0.1:{cls.port}'
        cls.proc = subprocess.Popen([sys.executable, str(ROOT / 'server.py'), '--port', str(cls.port), '--data-dir', cls.temp.name], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        for _ in range(60):
            try:
                cls.request('/api/health')
                return
            except (urllib.error.URLError, ConnectionResetError):
                if cls.proc.poll() is not None:
                    raise RuntimeError(cls.proc.stderr.read().decode())
                time.sleep(.25)
        raise RuntimeError('Test server did not start')

    @classmethod
    def request(cls, route, body=None, headers=None, raw=False):
        request_headers = {}
        payload = None
        if body is not None:
            request_headers = {'Content-Type': 'application/json', 'X-Anki-Request': '1'}
            payload = json.dumps(body).encode()
        request_headers.update(headers or {})
        req = urllib.request.Request(cls.url + route, data=payload, headers=request_headers)
        with urllib.request.urlopen(req, timeout=30) as result:
            data = result.read()
            return data if raw else json.loads(data)

    @classmethod
    def tearDownClass(cls):
        try:
            cls.request('/api/shutdown', {})
            cls.proc.wait(timeout=10)
        finally:
            if cls.proc.poll() is None:
                cls.proc.terminate()
                cls.proc.wait(timeout=5)
            cls.proc.stderr.close()
            cls.temp.cleanup()

    def test_01_static_and_initial_state(self):
        page = self.request('/', raw=True).decode()
        self.assertIn('lang="es"', page)
        self.assertIn('/app.js', page)
        state = self.request('/api/state')
        self.assertEqual(state['stats']['totalCards'], 13)
        self.assertEqual(state['stats']['reviewedToday'], 0)
        self.assertEqual(sum(d['due'] for d in state['decks']), 13)
        self.assertTrue(all(d['childIds'] for d in state['decks']))

    def test_02_create_edit_review_export_and_delete(self):
        deck = self.request('/api/decks', {'name': 'Prueba HTTP'})
        card = self.request('/api/cards', {'deckId': deck['id'], 'front': 'Pregunta HTTP', 'back': 'Respuesta', 'tags': 'prueba'})
        edited = self.request('/api/cards/edit', {'id': card['id'], 'front': 'Pregunta editada', 'back': 'Respuesta editada', 'tags': 'prueba'})
        self.assertEqual(edited['rawBack'], 'Respuesta editada')
        self.assertTrue(self.request('/api/star', {'id': card['id']})['starred'])
        queue = self.request('/api/study', {'deckId': deck['id']})
        self.assertEqual(queue['cards'][0]['id'], card['id'])
        self.assertEqual(len(queue['intervals']), 4)
        self.assertTrue(self.request('/api/review', {'id': card['id'], 'rating': 3})['saved'])
        self.assertEqual(self.request('/api/state')['stats']['reviewedToday'], 1)
        archive = self.request('/api/export?deckId=' + str(deck['id']), raw=True)
        self.assertTrue(archive.startswith(b'PK'))
        self.request('/api/settings', {'dailyGoal': 35})
        self.assertEqual(self.request('/api/state')['settings']['dailyGoal'], 35)
        self.request('/api/delete', {'type': 'deck', 'id': deck['id']})
        state = self.request('/api/state')
        self.assertNotIn(deck['id'], [d['id'] for d in state['decks']])

    def test_03_backup_and_corrupt_import_preserves_library(self):
        self.request('/api/backup', {})
        backups = self.request('/api/backups')
        self.assertTrue(backups)
        self.assertEqual(set(backups[0]), {'name', 'size', 'date'})
        export = self.request('/api/export', raw=True)
        self.assertTrue(export.startswith(b'PK'))
        before = self.request('/api/state')['stats']['totalCards']
        req = urllib.request.Request(self.url + '/api/import?name=roto.apkg', data=b'not a zip', headers={'X-Anki-Request': '1', 'Content-Type': 'application/octet-stream'})
        with self.assertRaises(urllib.error.HTTPError) as err:
            urllib.request.urlopen(req)
        self.assertEqual(err.exception.code, 400)
        self.assertEqual(self.request('/api/state')['stats']['totalCards'], before)

    def test_04_reject_foreign_mutations_and_path_escape(self):
        for route, body, headers in [('/api/decks', {'name': 'forbidden'}, {'Origin': 'https://example.com'}), ('/api/export', None, {'Sec-Fetch-Site': 'cross-site'}), ('/api/state', None, {'Host': 'evil.example'}), ('/media/..%2Fcollection.anki2', None, {})]:
            with self.assertRaises(urllib.error.HTTPError) as err:
                self.request(route, body, headers)
            self.assertIn(err.exception.code, (400, 403))
        with self.assertRaises(urllib.error.HTTPError):
            self.request('/api/settings', {'dailyGoal': 0})

    def test_05_skip_and_note_deletion(self):
        deck = self.request('/api/decks', {'name': 'Omitir temporalmente'})
        card = self.request('/api/cards', {'deckId': deck['id'], 'front': 'A', 'back': 'B'})
        self.request('/api/study', {'deckId': deck['id']})
        self.assertTrue(self.request('/api/skip', {'id': card['id']})['saved'])
        self.assertTrue(self.request('/api/study', {'deckId': deck['id']})['finished'])
        self.assertEqual(self.request('/api/delete', {'type': 'card', 'id': card['id']})['deleted'], 1)

    def test_06_browse_create_cloze_edit_fields_and_media(self):
        deck = self.request('/api/decks', {'name': 'Notas avanzadas'})
        result = self.request('/api/cards', {'deckId': deck['id'], 'kind': 'cloze', 'front': 'Capital: {{c1::Lima}}', 'back': '', 'tags': 'geografia'})
        card = result['card']
        detail = self.request('/api/cards/' + str(card['id']))
        self.assertEqual(detail['fields'][0]['name'], 'Texto')
        edited = self.request('/api/cards/edit', {'id': card['id'], 'fields': ['Capital: {{c1::Lima}}, país: {{c2::Perú}}', 'Pista'], 'tags': 'geografia'})
        self.assertEqual(edited['createdCards'], 1)
        page = self.request('/api/cards?query=tag%3Ageografia&limit=1')
        self.assertEqual(page['total'], 2)
        self.assertTrue(page['hasMore'])
        self.assertNotIn('front', page['cards'][0])
        self.assertEqual(self.request('/api/state')['cards'], [])
        image = io.BytesIO()
        Image.new('RGB', (3, 3), 'blue').save(image, format='PNG')
        req = urllib.request.Request(self.url + '/api/media?name=prueba.png', data=image.getvalue(), headers={'X-Anki-Request': '1', 'Content-Type': 'application/octet-stream'})
        with urllib.request.urlopen(req) as response:
            attachment = json.loads(response.read())
        self.assertEqual(attachment['kind'], 'image')
        self.assertEqual(self.request('/media/' + attachment['name'], raw=True), image.getvalue())
        self.assertIn(b'katex', self.request('/vendor/katex/katex.min.css', raw=True))
        self.request('/api/delete', {'type': 'deck', 'id': deck['id']})

    def test_07_second_server_cannot_open_the_same_collection(self):
        duplicate = subprocess.run([sys.executable, str(ROOT / 'server.py'), '--port', str(self.port), '--data-dir', self.temp.name], capture_output=True, timeout=10, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        self.assertNotEqual(duplicate.returncode, 0)
        self.assertTrue(self.request('/api/health')['ok'])
        self.assertGreaterEqual(self.request('/api/state')['stats']['totalCards'], 13)


if __name__ == '__main__':
    unittest.main()
