"""Pruebas unitarias para el lector limpio de Anki, importador Quizlet y practice_store."""
import io
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
import uuid
import zipfile

# Asegurar que el directorio raíz de CODEX esté en sys.path
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from clean_anki_importer import strip_html, parse_clean_apkg
from text_import import parse_cards
from practice_store import PracticeStore


class TestCleanAnkiImporter(unittest.TestCase):
    def test_strip_html(self):
        html_input = "<b>Fotosíntesis</b><br><div>Proceso en plantas &amp; algas</div> [sound:audio.mp3]"
        clean = strip_html(html_input)
        self.assertIn("Fotosíntesis", clean)
        self.assertIn("Proceso en plantas & algas", clean)
        self.assertNotIn("<b>", clean)
        self.assertNotIn("[sound:", clean)

    def test_parse_clean_apkg_synthetic(self):
        """Crea un paquete .apkg sintético con SQLite y verifica su lectura sin usar la librería anki."""
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            apkg_file = tmp_path / "test_deck.apkg"
            db_file = tmp_path / "collection.anki2"

            # Crear BD SQLite simulada idéntica al estándar de Anki
            conn = sqlite3.connect(str(db_file))
            cur = conn.cursor()
            cur.execute("CREATE TABLE col (id integer primary key, decks text, models text)")
            cur.execute("CREATE TABLE notes (id integer primary key, mid integer, flds text, tags text)")
            cur.execute("CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer)")

            # Insertar mazo
            decks = {"1001": {"id": 1001, "name": "Biología Médica"}}
            cur.execute("INSERT INTO col VALUES (1, ?, ?)", (json.dumps(decks), "{}"))

            # Insertar 2 notas con separador \x1f
            cur.execute("INSERT INTO notes VALUES (1, 1, 'Mitocondria\x1fCentral de ATP de la célula', 'biologia celula')")
            cur.execute("INSERT INTO notes VALUES (2, 1, 'Ribosoma\x1fSíntesis de proteínas', 'biologia')")

            # Insertar tarjetas asociadas
            cur.execute("INSERT INTO cards VALUES (101, 1, 1001, 0)")
            cur.execute("INSERT INTO cards VALUES (102, 2, 1001, 0)")
            conn.commit()
            conn.close()

            # Empaquetar como ZIP .apkg
            with zipfile.ZipFile(apkg_file, "w") as zf:
                zf.write(db_file, arcname="collection.anki2")
                zf.writestr("media", json.dumps({"0": "sample.jpg"}))
                zf.writestr("0", b"fake-jpg-content")

            # Ejecutar el parser limpio
            result = parse_clean_apkg(apkg_file)
            self.assertEqual(result["total_cards"], 2)
            self.assertEqual(len(result["decks"]), 1)
            self.assertEqual(result["decks"][0]["name"], "Biología Médica")
            cards = result["decks"][0]["cards"]
            self.assertEqual(cards[0]["front"], "Mitocondria")
            self.assertEqual(cards[0]["back"], "Central de ATP de la célula")
            self.assertEqual(cards[1]["front"], "Ribosoma")
            self.assertEqual(cards[1]["back"], "Síntesis de proteínas")


class TestQuizletAndTextImport(unittest.TestCase):
    def test_quizlet_tab_export(self):
        """Quizlet suele exportar: Término\\tDefinición por línea."""
        quizlet_data = (
            "Glucólisis\tDegradación anaeróbica de la glucosa\n"
            "Ciclo de Krebs\tRuta metabólica en la matriz mitocondrial\n"
            "Fosforilación oxidativa\tProducción de ATP acoplada al transporte de electrones\n"
        ).encode("utf-8")

        res = parse_cards(quizlet_data, "quizlet_export.txt", separator="auto", has_header=False)
        self.assertEqual(len(res["cards"]), 3)
        self.assertEqual(res["cards"][0]["front"], "Glucólisis")
        self.assertEqual(res["cards"][0]["back"], "Degradación anaeróbica de la glucosa")

    def test_quizlet_dash_export(self):
        """Exportación de Quizlet con guión como separador."""
        dash_data = (
            "ADN - Ácido desoxirribonucleico\n"
            "ARN - Ácido ribonucleico\n"
        ).encode("utf-8")

        res = parse_cards(dash_data, "deck.quizlet", separator="dash", has_header=False)
        self.assertEqual(len(res["cards"]), 2)
        self.assertEqual(res["cards"][0]["front"], "ADN")
        self.assertEqual(res["cards"][0]["back"], "Ácido desoxirribonucleico")


class TestPracticeStoreModes(unittest.TestCase):
    def test_all_game_modes_stored(self):
        """Verifica que los nuevos modos (learn, test, flash, match, write, choice) se guarden correctamente."""
        with tempfile.TemporaryDirectory() as tmp:
            store = PracticeStore(tmp)
            modes = ['learn', 'test', 'flash', 'match', 'write', 'choice']

            for mode in modes:
                session_id = str(uuid.uuid4())
                res = store.save({
                    'id': session_id,
                    'mode': mode,
                    'deckName': 'Mazo de Prueba',
                    'correct': 9,
                    'total': 10,
                    'mistakes': 1,
                    'elapsedMs': 25400
                })
                self.assertTrue(res['saved'])

            history = store.history()
            self.assertEqual(len(history), 6)
            saved_modes = {h['mode'] for h in history}
            self.assertEqual(saved_modes, set(modes))


if __name__ == '__main__':
    unittest.main()
