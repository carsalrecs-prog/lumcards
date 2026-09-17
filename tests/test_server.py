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
        self.assertIn('/app.js?v=20260917-web-stats', page)
        state = self.request('/api/state')
        self.assertEqual(state['stats']['totalCards'], 13)
        self.assertEqual(state['stats']['reviewedToday'], 0)
        self.assertEqual(sum(d['due'] for d in state['decks']), 13)
        self.assertTrue(all(d['childIds'] for d in state['decks']))

    def test_student_stylesheet_is_served_for_both_screens(self):
        for route in ('/', '/practice.html'):
            self.assertIn('/student.css?v=20260917-web-stats', self.request(route, raw=True).decode())
        with urllib.request.urlopen(self.url + '/student.css?v=20260917-web-stats') as response:
            self.assertIn('text/css', response.headers['Content-Type'])
            self.assertIn(b'.study-tools-grid', response.read())

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

    def test_02b_folder_move_rename_and_detailed_stats_contract(self):
        folder = self.request('/api/folders', {'name': 'Idiomas HTTP'})
        initial_folder = next(d for d in self.request('/api/state')['decks'] if d['id'] == folder['id'])
        self.assertTrue(initial_folder['isFolder'])

        deck = self.request('/api/decks', {'name': 'Verbos HTTP'})
        self.request('/api/decks/move', {'deckId': deck['id'], 'parentId': folder['id']})
        self.request('/api/cards', {'deckId': deck['id'], 'front': 'go', 'back': 'ir'})
        self.request('/api/decks/rename', {'id': deck['id'], 'name': 'Verbos frecuentes'})
        self.request('/api/decks/rename', {'id': folder['id'], 'name': 'Idiomas'})

        state = self.request('/api/state')
        folder_state = next(d for d in state['decks'] if d['id'] == folder['id'])
        deck_state = next(d for d in state['decks'] if d['id'] == deck['id'])
        self.assertEqual(folder_state['total'], 1)
        self.assertEqual(deck_state['name'], 'Idiomas::Verbos frecuentes')
        self.assertEqual(deck_state['parentName'], 'Idiomas')

        stats = self.request('/api/stats/detailed?deckId=' + str(folder['id']))
        self.assertEqual(stats['cardBreakdown']['total'], 1)
        self.assertEqual(len(stats['forecast']['days30']), 31)
        self.assertEqual(len(stats['history']['days365']), 366)
        self.assertEqual(len(stats['hourly']['days90']), 24)

        self.request('/api/delete', {'type': 'deck', 'id': deck['id']})
        self.request('/api/delete', {'type': 'deck', 'id': folder['id']})

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
    def test_08_study_blocks_flow(self):
        deck = self.request('/api/decks', {'name': 'Mazo Bloques'})
        c_ids = []
        for i in range(5):
            c = self.request('/api/cards', {'deckId': deck['id'], 'front': f'Q{i+1}', 'back': f'A{i+1}'})
            c_ids.append(c['id'])

        info = self.request('/api/study/block-info?deckId=' + str(deck['id']))
        self.assertFalse(info['hasActiveBlock'])
        self.assertEqual(info['totalDeckCards'], 5)
        self.assertEqual(info['availableToday'], 5)

        start_res = self.request('/api/study/block-start', {'deckId': deck['id'], 'limit': 3})
        self.assertTrue(start_res['saved'])
        self.assertEqual(start_res['block']['total'], 3)
        self.assertEqual(start_res['block']['pending'], 3)

        info2 = self.request('/api/study/block-info?deckId=' + str(deck['id']))
        self.assertTrue(info2['hasActiveBlock'])
        self.assertEqual(info2['activeBlock']['total'], 3)

        # Primer repaso con 'Otra vez' (rating 1)
        s1 = self.request('/api/study', {'deckId': deck['id']})
        self.assertEqual(len(s1['cards']), 1)
        card1_id = s1['cards'][0]['id']
        rev1 = self.request('/api/review', {'id': card1_id, 'rating': 1, 'elapsedMs': 1500})
        self.assertEqual(rev1['blockStatus']['reviewedCount'], 1)
        self.assertEqual(rev1['blockStatus']['againCount'], 1)

        # Segundo repaso con 'Bien' (rating 3)
        s2 = self.request('/api/study', {'deckId': deck['id']})
        card2_id = s2['cards'][0]['id']
        self.assertNotEqual(card1_id, card2_id)
        rev2 = self.request('/api/review', {'id': card2_id, 'rating': 3, 'elapsedMs': 1200})
        self.assertEqual(rev2['blockStatus']['reviewedCount'], 2)
        self.assertEqual(rev2['blockStatus']['againCount'], 1)

        # Tercer repaso con 'Bien' (rating 3)
        s3 = self.request('/api/study', {'deckId': deck['id']})
        card3_id = s3['cards'][0]['id']
        rev3 = self.request('/api/review', {'id': card3_id, 'rating': 3, 'elapsedMs': 1100})
        self.assertEqual(rev3['blockStatus']['reviewedCount'], 3)

        # Fin de primera pasada del bloque
        s_end = self.request('/api/study', {'deckId': deck['id']})
        self.assertTrue(s_end['finished'])
        self.assertTrue(s_end['blockStatus']['firstPassDone'])
        self.assertEqual(s_end['blockStatus']['total'], 3)
        self.assertEqual(s_end['blockStatus']['reviewedCount'], 3)
        self.assertEqual(s_end['blockStatus']['againCount'], 1)

        # Descartar bloque
        clear_res = self.request('/api/study/block-clear', {'deckId': deck['id']})
        self.assertTrue(clear_res['saved'])
        info3 = self.request('/api/study/block-info?deckId=' + str(deck['id']))
        self.assertFalse(info3['hasActiveBlock'])

        self.request('/api/delete', {'type': 'deck', 'id': deck['id']})


if __name__ == '__main__':
    unittest.main()
