from pathlib import Path
import tempfile
import unittest

from engine import Engine


class ImageOcclusionIntegrationTests(unittest.TestCase):
    def test_imported_native_masks_override_templates_and_guard_unsupported(self):
        with tempfile.TemporaryDirectory(prefix='anki2-io-integration-') as temporary:
            engine = Engine(temporary)
            try:
                result = engine.import_file(Path(__file__).parent / 'fixtures' / 'native-io-modern.apkg')
                self.assertEqual(result['added'], 7)
                io_names = {m['name'] for m in engine.col.models.all() if m.get('originalStockKind') == 6}
                cards = [c for c in engine.state()['cards'] if c['modelName'] in io_names]
                self.assertEqual(len(cards), 7)
                supported = [c for c in cards if not c['renderError']]
                self.assertEqual(len(supported), 6)
                for card in supported:
                    self.assertIn('<svg ', card['front'])
                    self.assertIn('fill="#ff8e8e"', card['front'])
                    self.assertNotIn('<script', card['front'])
                    self.assertNotIn('canvas', card['front'])
                    self.assertIn('fill="none"', card['back'])
                unsupported = next(c for c in cards if c['renderError'])
                self.assertNotIn('<image', unsupported['front'])
                self.assertNotIn('<img', unsupported['front'])
                # A user-modified IO stylesheet must never disable trusted masks.
                note = engine.col.get_card(supported[0]['id']).note()
                model = note.note_type()
                model['css'] += 'svg rect, svg ellipse, svg polygon { fill: transparent !important; }'
                engine.col.models.update_dict(model)
                guarded = engine.card_detail(supported[0]['id'])
                self.assertNotIn('transparent !important', guarded['css'])
            finally:
                engine.close()


if __name__ == '__main__':
    unittest.main()
