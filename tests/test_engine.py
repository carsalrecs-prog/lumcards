"""Integration checks using real official Anki packages, never fixture ZIP parsers."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from engine import Engine
from anki.collection import Collection, ExportAnkiPackageOptions


class EngineIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='anki2-test-')
        self.root = Path(self.temp.name)
        self.engine = Engine(self.root / 'app')

    def tearDown(self):
        self.engine.close()
        self.temp.cleanup()

    def source(self):
        col = Collection(str(self.root / 'source.anki2'))
        did = col.decks.id('Importación real')
        model = next(m for m in col.models.all() if m['type'] == 0 and len(m['flds']) == 2 and len(m['tmpls']) == 1)
        n = col.new_note(model)
        n.fields = ['Pregunta importada<img src="pixel.svg">[sound:audio.mp3]', 'Respuesta importada']
        n.tags = ['imported']
        col.add_note(n, did)
        Path(col.media.dir(), 'pixel.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>')
        Path(col.media.dir(), 'audio.mp3').write_bytes(b'test-audio')
        return col

    def test_create_edit_star_review_restart(self):
        e = self.engine
        initial = e.state()
        self.assertEqual(initial['stats']['totalCards'], 13)
        self.assertEqual(initial['stats']['reviewedToday'], 0)
        self.assertIsNone(initial['stats']['retention'])
        self.assertTrue(all(day['count'] == 0 for day in initial['stats']['activity']))
        deck = e.add_deck('Personal')
        added = e.add_card(deck['id'], '2 + 2', '4', 'math, demo')
        self.assertEqual(set(added['tags']), {'math', 'demo'})
        changed = e.edit_card(added['id'], '3 + 3', '6', ['math'])
        self.assertEqual(changed['rawBack'], '6')
        self.assertTrue(e.toggle_star(added['id'])['starred'])
        e.update_settings(30)
        queue = e.study(deck['id'])
        self.assertEqual(queue['cards'][0]['id'], added['id'])
        self.assertEqual(len(queue['intervals']), 4)
        e.review(added['id'], 4)
        self.assertEqual(e.state()['stats']['reviewedToday'], 1)
        scheduled_interval = e._get_card(added['id']).ivl
        self.assertGreaterEqual(scheduled_interval, 1)
        self.assertTrue(e.study(deck['id'])['finished'])
        e.close()
        self.engine = Engine(self.root / 'app')
        reloaded = self.engine.state()
        self.assertEqual(reloaded['settings']['dailyGoal'], 30)
        self.assertEqual(reloaded['stats']['reviewedToday'], 1)
        card = next(c for c in reloaded['cards'] if c['id'] == added['id'])
        self.assertTrue(card['starred'])
        self.assertEqual(card['interval'], scheduled_interval)
        self.assertGreater(len(self.engine.list_backups()), 0)
        self.assertEqual(self.engine.delete_card(added['id'])['deleted'], 1)

    def test_legacy_modern_colpkg_and_anki2_import(self):
        source = self.source()
        try:
            for legacy in (True, False):
                target = self.root / ('legacy.apkg' if legacy else 'modern.apkg')
                source.export_anki_package(out_path=str(target), options=ExportAnkiPackageOptions(with_scheduling=True, with_deck_configs=True, with_media=True, legacy=legacy), limit=None)
            source.export_collection_package(str(self.root / 'source.colpkg'), include_media=True, legacy=False)
            source.reopen()
        finally:
            source.close()
        results = []
        for filename in ('modern.apkg', 'legacy.apkg', 'source.colpkg', 'source.anki2'):
            result = self.engine.import_file(self.root / filename)
            results.append(result)
            self.assertEqual(self.engine.state()['stats']['totalCards'], 14)
        self.assertEqual(results[0]['added'], 1)
        self.assertTrue(all(r['added'] == 0 for r in results[1:]))
        self.assertTrue((self.engine.media_dir / 'pixel.svg').exists())
        self.assertTrue((self.engine.media_dir / 'audio.mp3').exists())
        card = next(c for c in self.engine.state()['cards'] if 'Pregunta importada' in c['frontText'])
        self.assertIn('<audio controls', card['front'])
        self.assertIn('/media/audio.mp3', card['front'])
        self.assertIn('/media/audio.mp3', card['back'])
        self.assertTrue(card['editable'])
        self.assertFalse(card['simpleEditable'])
        with self.assertRaises(ValueError):
            self.engine.edit_card(card['id'], 'bad', 'bad')

    def test_invalid_import_preserves_library_and_media(self):
        (self.engine.media_dir / 'mine.txt').write_text('keep this media')
        before = self.engine.state()
        broken = self.root / 'broken.apkg'
        broken.write_bytes(b'not a package')
        with self.assertRaises(Exception):
            self.engine.import_file(broken)
        after = self.engine.state()
        self.assertEqual(before['cards'], after['cards'])
        self.assertEqual((self.engine.media_dir / 'mine.txt').read_text(), 'keep this media')
        self.assertEqual(before['stats'], after['stats'])
        self.assertEqual(len(self.engine.list_backups()), 1)

    def test_backup_roundtrip_retains_source_collection_configuration(self):
        e = self.engine
        e.update_settings(42)
        first = e.state()['cards'][0]
        e.toggle_star(first['id'])
        exported = e.backup()
        path = e._restore_package(exported['path'], self.root / 'restore')
        restored = Collection(str(path))
        try:
            self.assertEqual(restored.card_count(), 13)
            self.assertEqual(restored.get_config('anki2.dailyGoal'), 42)
            self.assertIn(first['id'], restored.get_config('anki2.starred'))
        finally:
            restored.close()

    def test_ratings_must_answer_active_queue(self):
        first = self.engine.state()['cards'][0]
        with self.assertRaises(ValueError):
            self.engine.review(first['id'], 4)
        queue = self.engine.study()
        with self.assertRaises(ValueError):
            self.engine.review(queue['cards'][0]['id'], 5)
        self.assertEqual(self.engine.state()['stats']['reviewedToday'], 0)

    def test_cloze_rendering_and_imported_review_history(self):
        source = Collection(str(self.root / 'cloze.anki2'))
        did = source.decks.id('Cloze importado')
        model = next(m for m in source.models.all() if m['type'] == 1)
        note = source.new_note(model)
        note.fields = ['La capital de Perú es {{c1::Lima}}.', 'Costa central del país.']
        source.add_note(note, did)
        source.decks.select(did)
        card = source.sched.getCard()
        source.sched.answerCard(card, 4)
        interval = card.ivl
        package = self.root / 'cloze.apkg'
        source.export_anki_package(out_path=str(package), options=ExportAnkiPackageOptions(with_scheduling=True, with_media=True, legacy=False), limit=None)
        source.close()
        self.engine.import_file(package)
        imported = next(c for c in self.engine.state()['cards'] if '{{c1::Lima}}' in c['rawFront'])
        self.assertNotIn('Lima', imported['frontText'])
        self.assertIn('Lima', imported['backText'])
        self.assertEqual(imported['interval'], interval)
        self.assertEqual(imported['reviews'], 1)
        self.assertFalse(imported['isNew'])
        self.assertTrue(imported['editable'])
        self.assertFalse(imported['simpleEditable'])
        self.assertEqual(self.engine.state()['stats']['reviewedToday'], 1)

    def test_filesystem_swap_failure_rolls_back_collection(self):
        e = self.engine
        (e.media_dir / 'mine.txt').write_text('irreplaceable')
        before = e.state()
        original_open = e._open
        attempts = 0
        def fail_once():
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise OSError('simulated failure opening newly imported database')
            return original_open()
        source = self.source()
        package = self.root / 'new.apkg'
        source.export_anki_package(out_path=str(package), options=ExportAnkiPackageOptions(with_scheduling=True, with_media=True, legacy=False), limit=None)
        source.close()
        with patch.object(e, '_open', side_effect=fail_once):
            with self.assertRaisesRegex(OSError, 'simulated'):
                e.import_file(package)
        self.assertEqual(before['cards'], e.state()['cards'])
        self.assertEqual((e.media_dir / 'mine.txt').read_text(), 'irreplaceable')
        self.assertFalse((e.media_dir / 'pixel.svg').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
