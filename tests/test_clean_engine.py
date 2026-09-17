"""Pruebas unitarias y de integración para el motor limpio independiente (CleanEngine)."""
from pathlib import Path
import copy
import tempfile
import unittest

from clean_engine import CleanEngine, CleanCollection, render_mustache_template, render_cloze_text, extract_cloze_numbers


class CleanEngineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='lumcards-clean-test-')
        self.root = Path(self.temp.name)
        self.engine = CleanEngine(self.root / 'app')

    def tearDown(self):
        self.engine.close()
        self.temp.cleanup()

    def test_mustache_renderer(self):
        fields = {'Front': 'París', 'Back': 'Francia', 'Extra': 'Europa'}
        # Básico
        q = render_mustache_template('¿Capital: {{Front}}?', fields)
        self.assertEqual(q, '¿Capital: París?')
        a = render_mustache_template('{{FrontSide}}<hr>{{Back}} ({{Extra}})', fields, is_answer=True, front_side_rendered=q)
        self.assertIn('¿Capital: París?<hr>Francia (Europa)', a)

        # Condicionales positivos e invertidos
        cond_tmpl = '{{#Extra}}Continente: {{Extra}}{{/Extra}}{{^Extra}}Sin continente{{/Extra}}'
        self.assertIn('Continente: Europa', render_mustache_template(cond_tmpl, fields))
        self.assertIn('Sin continente', render_mustache_template(cond_tmpl, {'Front': 'A', 'Back': 'B', 'Extra': ''}))

        # Sonido
        sound_tmpl = 'Sonido: [sound:campana.mp3]'
        rendered_sound = render_mustache_template(sound_tmpl, fields)
        self.assertIn('<audio controls', rendered_sound)
        self.assertIn('/media/campana.mp3', rendered_sound)

    def test_cloze_renderer(self):
        text = 'La capital de {{c1::Francia::país}} es {{c2::París}}.'
        self.assertEqual(extract_cloze_numbers(text), [1, 2])

        # Tarjeta 1 (ord 0)
        c1_q = render_cloze_text(text, 0, is_answer=False)
        self.assertIn('<span class="cloze">[país]</span>', c1_q)
        self.assertIn('París', c1_q)
        c1_a = render_cloze_text(text, 0, is_answer=True)
        self.assertIn('<span class="cloze">Francia</span>', c1_a)

        # Tarjeta 2 (ord 1)
        c2_q = render_cloze_text(text, 1, is_answer=False)
        self.assertIn('<span class="cloze">[...]</span>', c2_q)
        self.assertIn('Francia', c2_q)

    def test_seed_state_and_deck_crud(self):
        state = self.engine.state()
        self.assertGreaterEqual(state['counts']['totalCards'], 10)
        self.assertEqual(state['engine']['name'], 'Lumcards Clean Engine')

        deck = self.engine.add_deck('Matemáticas')
        self.assertEqual(deck['name'], 'Matemáticas')

        renamed = self.engine.rename_deck(deck['id'], 'Álgebra')
        self.assertEqual(renamed['name'], 'Álgebra')

        card = self.engine.add_card(deck['id'], 'x + 1 = 2', 'x = 1', 'ecuaciones')
        self.assertEqual(card['rawFront'], 'x + 1 = 2')
        self.assertEqual(card['rawBack'], 'x = 1')
        self.assertIn('ecuaciones', card['tags'])

        # Estrella
        toggle = self.engine.toggle_star(card['id'])
        self.assertTrue(toggle['starred'])

        # Repaso espaciado
        study_res = self.engine.study(deck['id'])
        self.assertEqual(len(study_res['cards']), 1)
        self.assertEqual(study_res['cards'][0]['id'], card['id'])

        rev_res = self.engine.review(card['id'], 3)
        self.assertTrue(rev_res['saved'])
        updated_card = self.engine._get_card(card['id'])
        self.assertEqual(updated_card.reps, 1)
        self.assertGreaterEqual(updated_card.ivl, 1)

    def test_folder_hierarchy_rename_and_totals_are_persistent(self):
        folder = self.engine.create_folder('Inglés')
        empty_folder = next(d for d in self.engine.state(include_cards=False)['decks'] if d['id'] == folder['id'])
        self.assertTrue(empty_folder['isFolder'])
        self.assertEqual(empty_folder['total'], 0)

        deck = self.engine.add_deck('Verbos')
        self.engine.move_deck(deck['id'], folder['id'])
        card = self.engine.add_card(deck['id'], 'go', 'ir')
        renamed_deck = self.engine.rename_deck(deck['id'], 'Verbos frecuentes')
        self.assertEqual(renamed_deck['name'], 'Inglés::Verbos frecuentes')

        renamed_folder = self.engine.rename_deck(folder['id'], 'Idiomas')
        self.assertTrue(renamed_folder['isFolder'])
        state = self.engine.state(include_cards=False)
        folder_state = next(d for d in state['decks'] if d['id'] == folder['id'])
        deck_state = next(d for d in state['decks'] if d['id'] == deck['id'])
        self.assertEqual(folder_state['name'], 'Idiomas')
        self.assertEqual(folder_state['total'], 1)
        self.assertEqual(folder_state['new'], 1)
        self.assertEqual(deck_state['name'], 'Idiomas::Verbos frecuentes')
        self.assertEqual(deck_state['parentName'], 'Idiomas')
        self.assertEqual(self.engine.card_detail(card['id'])['deckId'], deck['id'])

        with self.assertRaisesRegex(ValueError, 'Ya existe'):
            self.engine.add_deck('Idiomas')
        with self.assertRaisesRegex(ValueError, 'carpeta'):
            self.engine.move_deck(folder['id'], folder['id'])

        self.engine.close()
        self.engine = CleanEngine(self.root / 'app')
        persisted = next(d for d in self.engine.state(include_cards=False)['decks'] if d['id'] == folder['id'])
        self.assertTrue(persisted['isFolder'])
        self.assertEqual(persisted['total'], 1)

    def test_modern_separator_migration_merges_duplicates_without_losing_cards(self):
        folder = self.engine.create_folder('Curso')
        duplicate_empty = self.engine.add_deck('Curso::Libro')
        card = self.engine.add_card(duplicate_empty['id'], 'Pregunta', 'Respuesta')
        raw_id = max(self.engine.col._decks) + 1
        raw_deck = copy.deepcopy(self.engine.col._decks[duplicate_empty['id']])
        raw_deck.update({'id': raw_id, 'name': 'Curso\x1fLibro'})
        self.engine.col._decks[raw_id] = raw_deck
        self.engine.col.conn.execute('update cards set did = ? where id = ?', (raw_id, card['id']))
        self.engine.col.conn.commit()
        self.engine.col._save_decks()
        before = self.engine.col.card_count()

        self.engine.close()
        self.engine = CleanEngine(self.root / 'app')
        state = self.engine.state(include_cards=False)
        self.assertEqual(self.engine.col.card_count(), before)
        self.assertFalse(any('\x1f' in d['name'] for d in state['decks']))
        books = [d for d in state['decks'] if d['name'] == 'Curso::Libro']
        self.assertEqual(len(books), 1)
        self.assertEqual(books[0]['total'], 1)
        self.assertEqual(next(d for d in state['decks'] if d['id'] == folder['id'])['total'], 1)
        self.assertTrue(any(b['filename'].startswith('antes-de-normalizar-carpetas-') for b in self.engine.list_backups()))

    def test_detailed_stats_returns_the_complete_frontend_contract(self):
        stats = self.engine.get_detailed_stats()
        self.assertEqual(len(stats['forecast']['days30']), 31)
        self.assertEqual(len(stats['forecast']['days90']), 91)
        self.assertEqual(len(stats['forecast']['days365']), 366)
        self.assertEqual(len(stats['history']['days30']), 31)
        self.assertEqual(len(stats['calendar']['days']), 365)
        self.assertEqual(len(stats['hourly']['days365']), 24)
        self.assertEqual(set(stats['buttonPresses']['days30']), {'learning', 'young', 'mature'})
        self.assertEqual(stats['cardBreakdown']['total'], self.engine.col.card_count())
        self.assertIn('retentionTable', stats)
        self.assertIn('addedCards', stats)

    def test_reversed_and_cloze_note_creation(self):
        deck = self.engine.add_deck('Idiomas')
        # Inversa (crea 2 tarjetas)
        rev_note = self.engine.create_note(deck['id'], 'reversed', ['Apple', 'Manzana'], 'vocabulario')
        self.assertEqual(rev_note['createdCards'], 2)
        c1 = self.engine.card_detail(rev_note['cardIds'][0])
        c2 = self.engine.card_detail(rev_note['cardIds'][1])
        self.assertIn('Apple', c1['front'])
        self.assertIn('Manzana', c2['front'])

        # Cloze (crea tantas tarjetas como números cloze)
        cloze_note = self.engine.create_note(deck['id'], 'cloze', ['{{c1::Uno}} y {{c2::Dos}}', 'Extra info'], 'conteo')
        self.assertEqual(cloze_note['createdCards'], 2)
        cl1 = self.engine.card_detail(cloze_note['cardIds'][0])
        cl2 = self.engine.card_detail(cloze_note['cardIds'][1])
        self.assertIn('<span class="cloze">[...]</span>', cl1['front'])
        self.assertIn('Extra info', cl1['back'])

    def test_export_and_import_collection(self):
        exp = self.engine.export_collection()
        self.assertTrue(Path(exp['path']).is_file())
        self.assertGreater(exp['bytes'], 1000)

        # Importar en nueva instancia
        other_temp = tempfile.TemporaryDirectory(prefix='lumcards-other-')
        other_engine = CleanEngine(Path(other_temp.name) / 'app')
        try:
            res = other_engine.import_file(exp['path'])
            self.assertTrue(res['saved'])
            self.assertGreaterEqual(other_engine.col.card_count(), 10)
        finally:
            other_engine.close()
            other_temp.cleanup()

    def test_import_real_anki_package(self):
        fixture_path = Path(__file__).resolve().parent / 'fixtures' / 'native-io-modern.apkg'
        if fixture_path.is_file():
            before_count = self.engine.col.card_count()
            res = self.engine.import_file(fixture_path)
            self.assertTrue(res['saved'])
            self.assertGreater(res['added'], 0)
            self.assertGreater(self.engine.col.card_count(), before_count)


    def test_delete_deck_isolated_and_keep_children(self):
        # 1. Crear carpeta con submazos y tarjetas
        folder = self.engine.create_folder('Ciencias')
        deck_fisica = self.engine.add_deck('Ciencias::Física')
        deck_quimica = self.engine.add_deck('Ciencias::Química')

        self.engine.add_card(deck_fisica['id'], '¿Fuerza?', 'Masa por aceleración')
        self.engine.add_card(deck_fisica['id'], '¿Energía?', 'Capacidad de realizar trabajo')
        self.engine.add_card(deck_quimica['id'], '¿Agua?', 'H2O')
        self.engine.add_card(deck_quimica['id'], '¿Sal?', 'NaCl')

        # Verificar conteos iniciales
        state = self.engine.state()
        deck_map = {d['id']: d for d in state['decks']}
        self.assertEqual(deck_map[deck_fisica['id']]['total'], 2)
        self.assertEqual(deck_map[deck_quimica['id']]['total'], 2)

        # 2. Eliminar carpeta conservando submazos (keep_children=True)
        res_keep = self.engine.delete_deck(folder['id'], keep_children=True)
        self.assertEqual(res_keep['deletedDecks'], 1)
        self.assertEqual(res_keep['keptDecks'], 2)
        self.assertGreaterEqual(len(self.engine.list_backups()), 1)

        # La carpeta 'Ciencias' ya no debe existir
        state2 = self.engine.state()
        names2 = [d['name'] for d in state2['decks']]
        self.assertNotIn('Ciencias', names2)
        self.assertIn('Física', names2)
        self.assertIn('Química', names2)

        # Las tarjetas deben seguir vivas en los submazos desanidados
        deck_map2 = {d['name']: d for d in state2['decks']}
        self.assertEqual(deck_map2['Física']['total'], 2)
        self.assertEqual(deck_map2['Química']['total'], 2)

        # 3. Eliminar recursivamente mazo con tarjetas (keep_children=False)
        fisica_id = deck_map2['Física']['id']
        res_delete_all = self.engine.delete_deck(fisica_id, keep_children=False)
        self.assertEqual(res_delete_all['deletedDecks'], 1)
        self.assertEqual(res_delete_all['deletedCards'], 2)

        state3 = self.engine.state()
        names3 = [d['name'] for d in state3['decks']]
        self.assertNotIn('Física', names3)
        self.assertIn('Química', names3)


if __name__ == '__main__':
    unittest.main()
