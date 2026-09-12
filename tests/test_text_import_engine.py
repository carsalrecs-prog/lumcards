"""Atomic text-import checks using temporary libraries, never personal data."""
import hashlib
import html
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from anki.collection import Collection
from engine import Engine


class TextImportEngineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='anki2-text-import-test-')
        self.root = Path(self.temp.name)
        self.engine = Engine(self.root / 'library')
        self.deck_id = self.engine.add_deck('Texto importado')['id']

    def tearDown(self):
        self.engine.close()
        self.temp.cleanup()

    def library_snapshot(self):
        return {
            table: self.engine.col.db.all(f'select * from {table} order by id')
            for table in ('notes', 'cards', 'revlog')
        }

    def file_snapshot(self):
        return {
            str(path.relative_to(self.engine.data_dir)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in self.engine.data_dir.rglob('*') if path.is_file()
        }

    def target_cards(self):
        return [self.engine.card_detail(cid) for cid in self.engine.col.db.list(
            'select id from cards where did = ? order by id', self.deck_id
        )]

    def test_import_persists_with_tags_and_backup(self):
        before = self.engine.col.card_count()
        self.engine.update_settings(37)
        (self.engine.media_dir / 'keep.txt').write_text('existing media', encoding='utf-8')
        result = self.engine.import_text_cards(str(self.deck_id), [
            {'front': 'Capital del Perú', 'back': 'Lima', 'tags': ['geografía', 'dos palabras']},
            {'front': 'Pregunta\nsegunda línea', 'back': 'Respuesta', 'tags': []},
        ])
        self.assertEqual(result, {'added': 2, 'skipped': 0, 'deckId': self.deck_id, 'saved': True})
        self.assertEqual(self.engine.col.card_count(), before + 2)
        self.assertEqual(len(self.engine.list_backups()), 1)
        self.assertEqual(set(self.target_cards()[0]['tags']), {'geografía', 'dos_palabras'})
        self.engine.close()
        self.engine = Engine(self.root / 'library')
        self.assertEqual(len(self.target_cards()), 2)
        self.assertEqual(self.engine.settings()['dailyGoal'], 37)
        self.assertEqual((self.engine.media_dir / 'keep.txt').read_text(), 'existing media')

    def test_html_sound_and_cloze_are_literal_text(self):
        front = '<script>alert(1)</script> <b>texto</b> & [sound:voz.mp3] {{c1::Lima}}'
        back = '<img src="secret.png"> {{FrontSide}} [sound:otro.mp3]\n& fin'
        self.engine.import_text_cards(self.deck_id, [{'front': front, 'back': back, 'tags': []}])
        card = self.target_cards()[0]
        self.assertEqual(html.unescape(card['rawFront'].replace('<br>', '\n')), front)
        self.assertEqual(html.unescape(card['rawBack'].replace('<br>', '\n')), back)
        self.assertNotIn('<script>', card['front'])
        self.assertNotIn('<b>texto</b>', card['front'])
        self.assertNotIn('<img ', card['back'])
        self.assertNotIn('<audio ', card['front'] + card['back'])
        self.assertIn('[sound:voz.mp3]', card['frontText'])
        self.assertIn('{{c1::Lima}}', card['frontText'])
        self.assertFalse(card['isCloze'])
        self.assertEqual(card['questionAudios'], [])
        self.assertEqual(card['answerAudios'], [])
        self.assertEqual(len(self.target_cards()), 1)
        self.assertEqual(self.engine.import_text_cards(self.deck_id, [{'front': front, 'back': back}])['skipped'], 1)

    def test_deduplicates_batch_and_target_without_mutating_notes(self):
        existing = self.engine.add_card(self.deck_id, '<b>Lima</b>', 'Perú', ['original'])
        other = self.engine.add_deck('Otro mazo')['id']
        child = self.engine.add_deck('Texto importado::Hijo')['id']
        self.engine.add_card(other, 'Solo otro', 'Respuesta')
        self.engine.add_card(child, 'Solo hijo', 'Respuesta')
        before_existing = self.engine.card_detail(existing['id'])
        rows = [
            {'front': 'Lima', 'back': 'Perú', 'tags': ['nuevo']},
            {'front': 'Lima', 'back': 'Perú'},
            {'front': 'Lima', 'back': 'Peru'},
            {'front': 'lima', 'back': 'Perú'},
            {'front': 'Solo otro', 'back': 'Respuesta'},
            {'front': 'Solo hijo', 'back': 'Respuesta'},
        ]
        self.assertEqual(self.engine.import_text_cards(self.deck_id, rows)['added'], 4)
        self.assertEqual(self.engine.card_detail(existing['id']), before_existing)
        before_reimport = self.file_snapshot()
        result = self.engine.import_text_cards(self.deck_id, rows)
        self.assertEqual(result['added'], 0)
        self.assertEqual(result['skipped'], len(rows))
        self.assertEqual(self.file_snapshot(), before_reimport)

    def test_does_not_treat_media_or_other_note_types_as_plain_duplicates(self):
        self.engine.add_card(self.deck_id, 'Audio [sound:voz.mp3]', 'Respuesta')
        self.engine.create_note(self.deck_id, 'reversed', ['Inversa', 'Respuesta'])
        result = self.engine.import_text_cards(self.deck_id, [
            {'front': 'Audio [sound:voz.mp3]', 'back': 'Respuesta'},
            {'front': 'Inversa', 'back': 'Respuesta'},
        ])
        self.assertEqual(result['added'], 2)

    def test_accepts_maximum_batch_and_field_lengths(self):
        rows = [{'front': 'Repetida', 'back': 'Respuesta'}] * 4999
        rows.append({'front': 'x' * 10000, 'back': 'y' * 10000})
        result = self.engine.import_text_cards(self.deck_id, rows)
        self.assertEqual(result['added'], 2)
        self.assertEqual(result['skipped'], 4998)
        self.assertEqual(len(self.target_cards()[1]['rawFront']), 10000)

    def test_invalid_batch_makes_no_file_changes(self):
        valid = {'front': 'Primera válida', 'back': 'Respuesta', 'tags': []}
        invalid_batches = [
            None, {}, [], [valid] * 5001, [valid, None],
            [valid, {'front': 12, 'back': 'Texto'}],
            [valid, {'front': 'Texto', 'back': ''}],
            [valid, {'front': 'x' * 10001, 'back': 'Texto'}],
            [valid, {'front': 'Texto', 'back': 'y' * 10001}],
            [valid, {'front': 'Texto', 'back': '\x00'}],
            [valid, {'front': 'Texto', 'back': '\x1f'}],
            [valid, {'front': '\ud800', 'back': 'Texto'}],
            [valid, {'front': 'Texto', 'back': 'Texto', 'tags': 'a,b'}],
            [valid, {'front': 'Texto', 'back': 'Texto', 'tags': [1]}],
            [valid, {'front': 'Texto', 'back': 'Texto', 'tags': ['a'] * 51}],
            [valid, {'front': 'Texto', 'back': 'Texto', 'tags': ['a' * 101]}],
        ]
        before = self.file_snapshot()
        with patch.object(self.engine, 'export_collection', wraps=self.engine.export_collection) as backup:
            for rows in invalid_batches:
                with self.subTest(rows_type=type(rows).__name__, count=len(rows) if isinstance(rows, list) else None):
                    with self.assertRaises(ValueError):
                        self.engine.import_text_cards(self.deck_id, rows)
                    self.assertEqual(self.file_snapshot(), before)
            for bad_deck in (True, 1.1, 'no existe', -123):
                with self.assertRaises(ValueError):
                    self.engine.import_text_cards(bad_deck, [valid])
                self.assertEqual(self.file_snapshot(), before)
            backup.assert_not_called()

    def test_mid_batch_failure_keeps_collection_and_media(self):
        before = self.library_snapshot()
        (self.engine.media_dir / 'keep.txt').write_text('keep')
        original_add = Collection.add_note
        writes = []

        def fail_second(collection, note, deck_id):
            writes.append(note.fields[0])
            if len(writes) == 2:
                raise RuntimeError('simulated mid-batch failure')
            return original_add(collection, note, deck_id)

        with patch.object(Collection, 'add_note', autospec=True, side_effect=fail_second):
            with self.assertRaisesRegex(RuntimeError, 'mid-batch'):
                self.engine.import_text_cards(self.deck_id, [
                    {'front': 'Primera', 'back': 'Uno'},
                    {'front': 'Segunda', 'back': 'Dos'},
                ])
        self.assertEqual(len(writes), 2)
        self.assertEqual(self.library_snapshot(), before)
        self.assertEqual((self.engine.media_dir / 'keep.txt').read_text(), 'keep')
        self.assertEqual(len(self.engine.list_backups()), 1)
        self.assertFalse(list(self.engine.data_dir.glob('.anki2-text-import-*')))
        self.engine.close()
        self.engine = Engine(self.root / 'library')
        self.assertEqual(self.library_snapshot(), before)

    def test_failed_swap_restores_original_collection(self):
        before = self.library_snapshot()
        original_open = self.engine._open
        calls = []

        def fail_first_open():
            calls.append(True)
            if len(calls) == 1:
                raise OSError('simulated swap reopen failure')
            return original_open()

        with patch.object(self.engine, '_open', side_effect=fail_first_open):
            with self.assertRaisesRegex(OSError, 'swap reopen'):
                self.engine.import_text_cards(self.deck_id, [{'front': 'Nueva', 'back': 'Respuesta'}])
        self.assertEqual(self.library_snapshot(), before)
        self.assertEqual(len(calls), 2)


if __name__ == '__main__':
    unittest.main()
