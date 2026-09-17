"""Practice/import HTTP checks using a disposable collection and an unused port."""

from contextlib import closing
from html.parser import HTMLParser
import json
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
import uuid


ROOT = Path(__file__).resolve().parents[1]


class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.names = []

    def handle_starttag(self, tag, attrs):
        self.names.append(tag)


class PracticeHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="anki2-practice-http-test-")
        cls.data_dir = Path(cls.temp.name) / "data"
        cls.log_path = Path(cls.temp.name) / "server-stderr.log"
        cls.proc = None
        cls.stderr = None
        try:
            cls.start_server()
        except Exception:
            cls.stop_server()
            cls.temp.cleanup()
            raise

    @classmethod
    def start_server(cls):
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        cls.url = f"http://127.0.0.1:{cls.port}"
        cls.stderr = cls.log_path.open("ab")
        cls.proc = subprocess.Popen(
            [sys.executable, str(ROOT / "server.py"), "--host", "127.0.0.1",
             "--port", str(cls.port), "--data-dir", str(cls.data_dir)],
            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=cls.stderr,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            try:
                if cls.request("/api/health")["ok"]:
                    return
            except (urllib.error.URLError, ConnectionResetError, TimeoutError):
                if cls.proc.poll() is not None:
                    raise RuntimeError(cls.log_path.read_text(encoding="utf-8", errors="replace"))
                time.sleep(.2)
        raise RuntimeError("No arrancó el servidor temporal de prácticas.")

    @classmethod
    def stop_server(cls):
        try:
            if cls.proc is not None and cls.proc.poll() is None:
                try:
                    cls.request("/api/shutdown", {})
                    cls.proc.wait(timeout=12)
                except (urllib.error.URLError, TimeoutError, subprocess.TimeoutExpired):
                    cls.proc.terminate()
                    cls.proc.wait(timeout=5)
        finally:
            if cls.stderr is not None:
                cls.stderr.close()
                cls.stderr = None

    @classmethod
    def tearDownClass(cls):
        try:
            cls.stop_server()
        finally:
            cls.temp.cleanup()

    @classmethod
    def request(cls, route, body=None, *, payload=None, headers=None, trusted=True,
                raw=False, include_headers=False):
        request_headers = {}
        if body is not None:
            payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
            request_headers["Content-Type"] = "application/json"
        elif payload is not None:
            request_headers["Content-Type"] = "application/octet-stream"
        if payload is not None and trusted:
            request_headers["X-Anki-Request"] = "1"
        request_headers.update(headers or {})
        req = urllib.request.Request(cls.url + route, data=payload, headers=request_headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            parsed = data if raw else json.loads(data)
            return (parsed, response.headers) if include_headers else parsed

    @classmethod
    def schedule_snapshot(cls):
        # This path can only refer to the test's own temporary collection.
        collection = (cls.data_dir / "collection.anki2").resolve()
        if not collection.is_relative_to(Path(cls.temp.name).resolve()):
            raise AssertionError("La colección de pruebas salió de su carpeta temporal.")
        # Anki holds an exclusive lock while open. A graceful restart of only
        # this disposable server provides a consistent snapshot without bypassing
        # the lock or adding a debug endpoint to the production application.
        cls.stop_server()
        try:
            with closing(sqlite3.connect(collection.as_uri() + "?mode=ro", uri=True)) as db:
                return {
                    "cards": db.execute(
                        "SELECT id, type, queue, due, ivl, factor, reps, lapses, left, odue, odid "
                        "FROM cards ORDER BY id"
                    ).fetchall(),
                    "revlog": db.execute("SELECT * FROM revlog ORDER BY id").fetchall(),
                }
        finally:
            cls.start_server()

    def assert_http_error(self, status, route, body=None, **kwargs):
        with self.assertRaises(urllib.error.HTTPError) as failure:
            self.request(route, body, **kwargs)
        with failure.exception as response:
            self.assertEqual(response.code, status)
            result = json.loads(response.read())
            self.assertIsInstance(result.get("error"), str)
            self.assertTrue(result["error"])

    def test_01_csv_preview_never_mutates_collection(self):
        before = self.request("/api/state")["stats"]
        schedule = self.schedule_snapshot()
        preview, headers = self.request(
            "/api/import/text/preview?name=ejemplo.csv",
            payload=('\ufeffPregunta;Respuesta;Etiquetas\n'
                     '"¿Qué, tal?";"Bien\nGracias";saludos\n'
                     'Sin respuesta;;\n').encode("utf-8"), include_headers=True,
        )
        self.assertEqual(preview["cards"], [
            {"front": "¿Qué, tal?", "back": "Bien\nGracias", "tags": ["saludos"]}
        ])
        self.assertEqual((preview["format"], preview["skipped"]), ("csv", 1))
        self.assertEqual(headers.get_content_type(), "application/json")
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(self.request("/api/state")["stats"]["totalCards"], before["totalCards"])
        self.assertEqual(self.request("/api/state")["stats"]["reviewedToday"], before["reviewedToday"])
        self.assertEqual(self.schedule_snapshot(), schedule)

    def test_02_preview_supports_json_and_explicit_header_choice(self):
        preview = self.request("/api/import/text/preview?name=cards.tsv&header=0",
                               payload=b"front\tback\nhello\thola")
        self.assertEqual(preview["cards"][0]["front"], "front")
        payload = {"cards": [{"front": "日本語 😀", "back": "Español", "tags": ["idiomas"]}]}
        preview = self.request("/api/import/text/preview?name=cards.json",
                               payload=json.dumps(payload, ensure_ascii=False).encode("utf-8"))
        self.assertEqual(preview["cards"], payload["cards"])

    def test_03_commit_escapes_html_tokens_and_deduplicates(self):
        deck = self.request("/api/decks", {"name": "Importación HTTP literal"})
        front = '<img src=x onerror="alert(1)"> [sound:attack.mp3] {{c1::visible}}'
        back = '<script>alert(2)</script>\n<iframe src="https://example.com"></iframe>'
        cards = [{"front": front, "back": back, "tags": ["literal"]},
                 {"front": "Capital de Perú", "back": "Lima", "tags": []}]
        before = self.request("/api/state")["stats"]["totalCards"]
        result = self.request("/api/import/text/commit", {"deckId": deck["id"], "cards": cards})
        self.assertTrue(result["saved"])
        self.assertEqual((result["added"], result["skipped"]), (2, 0))
        self.assertEqual(self.request("/api/state")["stats"]["totalCards"], before + 2)
        page = self.request("/api/cards?deckId=" + str(deck["id"]))
        self.assertEqual(page["total"], 2)
        self.assertTrue(all("front" not in card and "back" not in card for card in page["cards"]))
        literal = next(card for card in page["cards"] if card["tags"] == ["literal"])
        detail = self.request("/api/cards/" + str(literal["id"]))
        self.assertIn("&lt;img", detail["rawFront"])
        self.assertIn("&#91;sound:", detail["rawFront"])
        self.assertIn("&#123;&#123;c1::", detail["rawFront"])
        self.assertEqual(detail["frontText"], front)
        self.assertEqual(detail["questionAudios"], [])
        self.assertEqual(detail["answerAudios"], [])
        for field in ("rawFront", "rawBack", "front", "back"):
            with self.subTest(field=field):
                parser = Tags()
                parser.feed(detail[field])
                self.assertFalse(set(parser.names) & {"script", "img", "iframe", "audio", "video", "object", "embed"})
        schedule = self.schedule_snapshot()
        repeated = self.request("/api/import/text/commit", {"deckId": deck["id"], "cards": cards})
        self.assertEqual((repeated["added"], repeated["skipped"]), (0, 2))
        self.assertEqual(self.schedule_snapshot(), schedule)

    def test_04_invalid_imports_never_partially_commit(self):
        deck = self.request("/api/decks", {"name": "Validación HTTP"})
        schedule = self.schedule_snapshot()
        self.assert_http_error(400, "/api/import/text/preview?name=cards.csv", payload=b"\xff\xfe")
        self.assert_http_error(400, "/api/import/text/preview?name=cards.exe", payload=b"a,b")
        self.assert_http_error(400, "/api/import/text/commit", {
            "deckId": deck["id"], "cards": [{"front": "valid", "back": "card", "tags": []},
                                              {"front": "invalid", "back": "", "tags": []}]
        })
        self.assertEqual(self.request("/api/cards?deckId=" + str(deck["id"]))["total"], 0)
        self.assertEqual(self.schedule_snapshot(), schedule)

    def test_05_practice_is_persistent_idempotent_and_separate_from_reviews(self):
        deck = self.request("/api/decks", {"name": "Prácticas HTTP"})
        card = self.request("/api/cards", {"deckId": deck["id"], "front": "Uno", "back": "One"})
        self.request("/api/study", {"deckId": deck["id"]})
        self.request("/api/review", {"id": card["id"], "rating": 3})
        before = self.request("/api/state")["stats"]["reviewedToday"]
        schedule = self.schedule_snapshot()
        detail = self.request("/api/cards/" + str(card["id"]))
        ids = []
        for mode in ("choice", "write", "match"):
            session = {"id": str(uuid.uuid4()), "mode": mode, "deckName": deck["name"],
                       "correct": 3, "total": 4, "mistakes": 2, "elapsedMs": 12345}
            ids.append(session["id"])
            self.assertTrue(self.request("/api/practice/result", session)["saved"])
            self.assertTrue(self.request("/api/practice/result", dict(session, correct=4))["saved"])
        history = self.request("/api/practice/history")
        for session_id in ids:
            saved = [row for row in history if row["id"] == session_id]
            self.assertEqual(len(saved), 1)
            self.assertEqual((saved[0]["correct"], saved[0]["elapsed_ms"]), (3, 12345))
        self.assertEqual(self.schedule_snapshot(), schedule)
        self.assertEqual(self.request("/api/state")["stats"]["reviewedToday"], before)
        after_detail = self.request("/api/cards/" + str(card["id"]))
        self.assertEqual((after_detail["interval"], after_detail["reviews"]),
                         (detail["interval"], detail["reviews"]))
        self.stop_server()
        self.start_server()
        self.assertEqual(self.request("/api/practice/history"), history)
        self.assertEqual(self.schedule_snapshot(), schedule)
        self.assertEqual(self.request("/api/state")["stats"]["reviewedToday"], before)

    def test_06_rejects_malformed_results_and_foreign_mutations(self):
        session = {"id": str(uuid.uuid4()), "mode": "choice", "deckName": "Prueba",
                   "correct": 1, "total": 2, "mistakes": 0, "elapsedMs": 2500}
        before = self.request("/api/practice/history")
        for change in ({"id": "bad"}, {"mode": "unknown"}, {"correct": 3}, {"total": 0},
                       {"elapsedMs": -1}, {"correct": True}, {"deckName": "x" * 241}):
            with self.subTest(change=change):
                self.assert_http_error(400, "/api/practice/result", dict(session, **change))
        # Local clients may omit Origin; the app's mutation marker is mandatory.
        self.assert_http_error(403, "/api/practice/result", session, trusted=False)
        self.assert_http_error(403, "/api/practice/result", session, headers={"Origin": "https://example.com"})
        self.assert_http_error(403, "/api/import/text/preview?name=cards.csv", payload=b"a,b", trusted=False)
        self.assert_http_error(403, "/api/import/text/commit", {"deckId": "all", "cards": []},
                               headers={"Origin": "https://example.com"})
        self.assert_http_error(403, "/api/practice/history", headers={"Sec-Fetch-Site": "cross-site"})
        self.assertEqual(self.request("/api/practice/history"), before)

    def test_07_practice_assets_are_served_locally(self):
        page = self.request("/practice.html", raw=True).decode("utf-8")
        self.assertIn('lang="es"', page)
        self.assertIn('src="/study-games.js?v=20260917-web-study-blocks"', page)
        self.assertIn('src="/practice.js?v=20260917-web-study-blocks"', page)
        for route in ("/practice.css?v=20260917-web-study-blocks", "/practice.js?v=20260917-web-study-blocks", "/study-games.js?v=20260917-web-study-blocks"):
            with self.subTest(route=route):
                content, headers = self.request(route, raw=True, include_headers=True)
                self.assertGreater(len(content), 50)
                self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
                self.assertIn("script-src 'self'", headers["Content-Security-Policy"])


if __name__ == "__main__":
    unittest.main()
