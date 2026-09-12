"""Native Anki integration tests for generic note editing and paginated browsing."""
import copy
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from engine import Engine
from anki.collection import Collection, ExportAnkiPackageOptions
from anki.cards import Card


class EnhancementTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='anki2-enhanced-')
        self.root = Path(self.tmp.name)
        self.e = Engine(self.root / 'app')

    def tearDown(self):
        self.e.close()
        self.tmp.cleanup()

    def import_note(self, kind):
        col = Collection(str(self.root / (kind + '.anki2')))
        try:
            if kind == 'cloze':
                model = next(m for m in col.models.all() if m['type'] == 1)
                fields = ['{{c1::Uno}} y {{c2::Dos}}', 'Extra original']
            else:
                model = next(m for m in col.models.all() if m['type'] == 0 and len(m['tmpls']) == 2 and len(m['flds']) == 2)
                fields = ['Front original', 'Back original']
            note = col.new_note(model)
            note.fields = fields
            note.tags = ['original']
            did = col.decks.id('Importado ' + kind)
            col.add_note(note, did)
            col.decks.select(did)
            first = col.sched.getCard()
            col.sched.answerCard(first, 4)
            package = self.root / (kind + '.apkg')
            col.export_anki_package(out_path=str(package), options=ExportAnkiPackageOptions(with_scheduling=True, with_media=True, with_deck_configs=True, legacy=False), limit=None)
        finally:
            col.close()
        self.e.import_file(package)
        cards = self.e.browse_cards(query='tag:original')['cards']
        self.assertEqual(len(cards), 2)
        return cards

    def test_imported_reverse_edit_updates_both_siblings_without_altering_type_or_schedule(self):
        cards = self.import_note('reversed')
        first = self.e.col.get_card(cards[0]['id'])
        note = first.note()
        guid = note.guid
        model = copy.deepcopy(note.note_type())
        schedules = {c['id']: (self.e.col.get_card(c['id']).ivl, self.e.col.get_card(c['id']).reps, self.e.col.get_card(c['id']).due) for c in cards}
        result = self.e.edit_note_fields(first.id, ['Pregunta nueva', 'Respuesta nueva'], ['original', 'editada'])
        self.assertEqual(result['createdCards'], 0)
        self.assertEqual(set(result['cardIds']), set(schedules))
        self.assertEqual(self.e.col.get_note(note.id).guid, guid)
        self.assertEqual(self.e.col.get_note(note.id).note_type(), model)
        fronts = []
        for cid in result['cardIds']:
            updated = self.e.col.get_card(cid)
            self.assertEqual((updated.ivl, updated.reps, updated.due), schedules[cid])
            detail = self.e.card_detail(cid)
            self.assertEqual([f['value'] for f in detail['fields']], ['Pregunta nueva', 'Respuesta nueva'])
            self.assertEqual(set(detail['tags']), {'original', 'editada'})
            fronts.append(detail['frontText'])
        self.assertEqual(set(fronts), {'Pregunta nueva', 'Respuesta nueva'})

    def test_imported_cloze_edit_generates_new_sibling_and_preserves_existing_history(self):
        cards = self.import_note('cloze')
        first = self.e.col.get_card(cards[0]['id'])
        model_before = copy.deepcopy(first.note().note_type())
        before = {c['id']: (self.e.col.get_card(c['id']).ivl, self.e.col.get_card(c['id']).reps) for c in cards}
        result = self.e.edit_note_fields(first.id, ['{{c1::Un}} y {{c2::Deux}} y {{c3::Trois}}', 'Extra actualizado'], ['original'])
        self.assertEqual(result['createdCards'], 1)
        self.assertEqual(len(result['cardIds']), 3)
        self.assertEqual(result['emptyCardIds'], [])
        self.assertEqual(self.e.col.get_note(result['noteId']).note_type(), model_before)
        for cid, stats in before.items():
            current = self.e.col.get_card(cid)
            self.assertEqual((current.ivl, current.reps), stats)
        details = [self.e.card_detail(cid) for cid in result['cardIds']]
        self.assertTrue(all('Extra actualizado' in detail['backText'] for detail in details))
        self.assertTrue(all(detail['editable'] for detail in details))

    def test_cloze_renumber_keeps_old_cards_and_reports_empty_sibling(self):
        d = self.e.add_deck('Huecos')
        n = self.e.create_note(d['id'], 'cloze', ['{{c1::Uno}} y {{c2::Dos}}', ''])
        result = self.e.edit_note_fields(n['card']['id'], ['{{c1::Uno}} y {{c3::Tres}}', ''])
        self.assertEqual(len(result['cardIds']), 3)
        self.assertEqual(len(result['emptyCardIds']), 1)
        self.assertEqual(self.e.col.get_card(result['emptyCardIds'][0]).ord, 1)
        self.assertTrue(result['warnings'])

    def test_generic_three_field_note_keeps_original_field_names_and_template(self):
        model = self.e.col.models.new('Plantilla con tres campos')
        for name in ('Enunciado', 'Solución', 'Fuente'):
            self.e.col.models.add_field(model, self.e.col.models.new_field(name))
        template = self.e.col.models.new_template('Tarjeta con fuente')
        template['qfmt'] = '{{Enunciado}}'
        template['afmt'] = '{{Solución}}<small>{{Fuente}}</small>'
        self.e.col.models.add_template(model, template)
        self.e.col.models.add(model)
        note = self.e.col.new_note(model)
        note.fields = ['Q', 'A', 'Libro']
        self.e.col.add_note(note, self.e.col.decks.id('Tres campos'))
        result = self.e.edit_note_fields(note.cards()[0].id, ['Q nueva', 'A nueva', 'Fuente nueva'])
        self.assertEqual([f['name'] for f in result['card']['fields']], ['Enunciado', 'Solución', 'Fuente'])
        self.assertIn('Fuente nueva', result['card']['backText'])
        self.assertEqual(self.e.col.get_note(note.id).mid, model['id'])

    def test_invalid_field_shape_does_not_modify_note(self):
        card = self.e.browse_cards()['cards'][0]
        before = self.e.card_detail(card['id'])['fields']
        for invalid in (['only one'], ['one', None], {'field': 'value'}, ['', '']):
            with self.assertRaises(ValueError):
                self.e.edit_note_fields(card['id'], invalid)
            self.assertEqual(self.e.card_detail(card['id'])['fields'], before)

    def test_create_basic_reversed_and_native_cloze(self):
        d = self.e.add_deck('Crear')
        for kind, fields, count in [('basic', ['Question', 'Answer'], 1), ('reversed', ['Forward', 'Reverse'], 2), ('cloze', ['{{c1::Lima}} es la capital de {{c2::Perú}}', ''], 2)]:
            created = self.e.create_note(d['id'], kind, fields, 'nuevo')
            self.assertEqual(created['createdCards'], count)
            self.assertEqual(len(created['cardIds']), count)
        before = self.e.col.card_count()
        with self.assertRaises(ValueError):
            self.e.create_note(d['id'], 'cloze', ['Faltan los huecos', ''])
        self.assertEqual(self.e.col.card_count(), before)

    def test_browse_and_light_state_never_render_and_return_bounded_pages(self):
        with patch.object(Card, 'render_output', side_effect=AssertionError('Rendering is forbidden')):
            first = self.e.browse_cards(limit=5)
            second = self.e.browse_cards(offset=5, limit=5)
            state = self.e.state(include_cards=False)
        self.assertEqual(first['total'], 13)
        self.assertEqual(len(first['cards']), 5)
        self.assertTrue(first['hasMore'])
        self.assertFalse(set(c['id'] for c in first['cards']) & set(c['id'] for c in second['cards']))
        self.assertNotIn('front', first['cards'][0])
        self.assertNotIn('fields', first['cards'][0])
        self.assertEqual(state['cards'], [])
        self.assertFalse(state['cardsIncluded'])
        self.assertEqual(state['counts']['totalCards'], 13)

    def test_search_native_syntax_child_decks_stars_and_query_validation(self):
        parent = self.e.add_deck('Parent')
        child = self.e.add_deck('Parent::Child')
        one = self.e.create_note(parent['id'], 'basic', ['Apple tree', 'Manzano'], 'fruit')
        two = self.e.create_note(child['id'], 'basic', ['Orange tree', 'Naranjo'], 'fruit')
        self.e.toggle_star(two['card']['id'])
        self.assertEqual(self.e.browse_cards(query='tag:fruit', deck_id=parent['id'])['total'], 2)
        self.assertEqual(self.e.browse_cards(query='Apple OR Orange', deck_id=child['id'])['total'], 1)
        self.assertEqual(self.e.browse_cards(query='tag:fruit is:new', starred=True)['cards'][0]['id'], two['card']['id'])
        self.assertEqual(self.e.state(False)['counts']['starredCards'], 1)
        self.assertEqual(self.e.browse_cards(offset=999)['cards'], [])
        with self.assertRaises(ValueError):
            self.e.browse_cards(query='prop:ivl>banana')

    def test_delete_imported_reverse_removes_whole_note_and_all_star_metadata(self):
        cards = self.import_note('reversed')
        for card in cards:
            self.e.toggle_star(card['id'])
        self.assertEqual(self.e.card_detail(cards[0]['id'])['siblingCount'], 2)
        deleted = self.e.delete_card(cards[0]['id'])
        self.assertEqual(deleted['deleted'], 2)
        self.assertEqual(self.e.browse_cards(query='tag:original')['total'], 0)
        self.assertEqual(self.e.state(False)['counts']['starredCards'], 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
