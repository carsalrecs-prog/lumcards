import re
import tempfile
import unittest
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET

from native_image_occlusion import MediaAsset, render_native_image_occlusion


MODEL = {"originalStockKind": 6, "flds": [{"ord": i, "tag": i} for i in range(5)]}
RECT = "{{c1::image-occlusion:rect:left=.1:top=.2:width=.3:height=.4:oi=1}}<br>"
ELLIPSE = "{{c2::image-occlusion:ellipse:left=.5:top=.2:rx=.1:ry=.15:oi=1}}<br>"
POLYGON = "{{c3::image-occlusion:polygon:left=.1:top=.5:points=.4,.1 .6,.1 .5,.3:oi=1}}<br>"
PERMANENT = "{{c0::image-occlusion:rect:left=.8:top=.8:width=.1:height=.1}}<br>"


def render(payload=RECT, *, ordinal=0, image='<img src="image%20one.png">', resolver=None,
           header="Header", extra="Private extra", model=MODEL):
    return render_native_image_occlusion(model, [payload, image, header, extra, "Hidden comments"],
                                         ordinal, resolver or (lambda _: MediaAsset('/media/image%20one.png', 1000, 500)))


def svg_tree(html):
    return ET.fromstring(re.search(r"<svg\b.*?</svg>", html, re.S).group(0))


def shape_tags(html):
    return [{"tag": node.tag.rsplit("}", 1)[-1], **node.attrib}
            for node in svg_tree(html) if node.tag.rsplit("}", 1)[-1] != "image"]


class StaticIOTests(unittest.TestCase):
    def test_rectangle_with_nonsquare_image_and_answer_reveal(self):
        result = render()
        self.assertTrue(result.supported)
        front = shape_tags(result.front)[0]
        self.assertEqual((front['x'], front['y'], front['width'], front['height']), ('100','100','300','200'))
        self.assertEqual(front['fill'], '#ff8e8e')
        self.assertEqual(shape_tags(result.back)[0]['fill'], 'none')
        self.assertNotIn('Private extra', result.front)
        self.assertIn('Private extra', result.back)
        self.assertNotIn('Hidden comments', result.back)
        self.assertNotIn('<img', result.front)

    def test_ellipse_center_is_offset_by_radii(self):
        shape = next(x for x in shape_tags(render(RECT + ELLIPSE, ordinal=1).front) if x['tag']=='ellipse')
        self.assertEqual((shape['cx'],shape['cy'],shape['rx'],shape['ry']),('600','175','100','75'))

    def test_polygon_uses_point_minimum_translation(self):
        shape = shape_tags(render(POLYGON, ordinal=2).front)[0]
        self.assertEqual(shape['points'], '100,250 300,250 200,350')

    def test_groups_and_permanent_masks_and_native_painter_order(self):
        grouped = RECT.replace('c1::', 'c3::') + ELLIPSE.replace('c2::', 'c3::')
        result = render(grouped + POLYGON.replace('c3::','c2::') + PERMANENT, ordinal=2)
        self.assertEqual([s['fill'] for s in shape_tags(result.front)], ['#ff8e8e','#ff8e8e','#ff8e8e','#ffeba2'])
        self.assertEqual([s['fill'] for s in shape_tags(result.back)], ['#ff8e8e','#ffeba2','none','none'])

    def test_hide_one_does_not_paint_other_ordinals(self):
        result = render((RECT + ELLIPSE).replace(':oi=1',''))
        self.assertEqual(len(shape_tags(result.front)),1)
        self.assertEqual(len(shape_tags(result.back)),1)

    def test_translated_reordered_fields_use_tags(self):
        model = {'originalStockKind':6,'flds':[{'ord':3,'tag':0,'name':'Mascaras'},
                    {'ord':2,'tag':1,'name':'Foto'}, {'ord':0,'tag':2,'name':'Titulo'},
                    {'ord':1,'tag':3,'name':'Respuesta'}]}
        result = render_native_image_occlusion(model, ['titulo','extra','<img src="ok.png">',RECT],0,
                                              lambda _: MediaAsset('/media/ok.png',100,200))
        self.assertTrue(result.supported)
        self.assertIn('titulo',result.front)
        self.assertIn('extra',result.back)

    def test_sanitizes_header_and_extra_to_plain_text(self):
        result = render(header='<b>Safe</b><script>alert(1)</script><img src="secret" onerror="boom">',
                        extra='<svg><text>Hidden</text></svg>&lt;script&gt;')
        self.assertIn('Safe',result.front)
        self.assertNotIn('alert',result.front)
        self.assertNotIn('onerror',result.front)
        self.assertNotIn('secret',result.front)
        self.assertIn('&lt;script&gt;',result.back)
        self.assertNotIn('Hidden',result.back)

    def assertClosed(self, result):
        self.assertTrue(result.recognized)
        self.assertFalse(result.supported)
        for side in [result.front,result.back]:
            self.assertNotIn('<svg',side)
            self.assertNotIn('<img',side)
            self.assertNotIn('/media/',side)
            self.assertNotIn('Private extra',side)

    def test_unknown_invalid_and_partial_payloads_fail_entire_card(self):
        bad = [RECT+'{{c0::image-occlusion:text:left=.1:top=.1:text=answer}}',
               RECT.replace('rect:','bezier:'), RECT.replace('width=.3','width=NaN'),
               RECT.replace('width=.3','width=0'), RECT.replace('width=.3','width=Infinity'),
               RECT.replace('width=.3','width=1e999'), RECT.replace('top=.2','top=.2:top=.3'),
               RECT.replace('top=.2','top=.2:angle=2500'),
               RECT.replace('top=.2','top=.2:fill=#fff'),
               RECT+'<script>boom</script>', RECT+'{{broken}}', RECT.replace('}}','}'),
               RECT.replace('oi=1','oi=hello'), RECT.replace('c1::','c999999999::'),
               POLYGON.replace('.4,.1 .6,.1 .5,.3','.1,.1 .2,.2 .3,.3')]
        for payload in bad:
            with self.subTest(payload=payload):
                self.assertClosed(render(payload))

    def test_missing_selected_ordinal_fails_closed(self):
        self.assertClosed(render(RECT,ordinal=1))

    def test_image_paths_and_image_markup_fail_closed(self):
        for path in ['../foo.png','%2e%2e%2ffoo.png','https://x/image.png','C:\\image.png',
                     'data:image/png;base64,aaaa','foo.svg','foo%00.png']:
            with self.subTest(path=path):
                self.assertClosed(render(image=f'<img src="{path}">'))
        self.assertClosed(render(image='<img src="ok.png" onerror="boom">'))
        self.assertClosed(render(image='<img src="a.png"><img src="b.png">'))
        self.assertClosed(render(resolver=lambda _: None))
        for src in ['https://x/ok.png','//x/ok.png','/media/../ok.png','/media/%2e%2e%2fok.png',
                    '/media/x/ok.png','/media/ok.png?x=1','/media/ok.png#frag','/media/ok.png%0a']:
            with self.subTest(src=src):
                self.assertClosed(render(resolver=lambda _: MediaAsset(src,100,100)))

    def test_no_native_kind_does_not_claim_recognition(self):
        result = render(model={'originalStockKind':5})
        self.assertFalse(result.recognized)
        self.assertFalse(result.supported)
        self.assertEqual(result.front,'')


class NativeBackendTests(unittest.TestCase):
    """Compare supported fixtures against actual installed Anki card DOM.

    No template JS is executed. This validates native cloze class/mode/ordinal
    production separately from our parser and generator.
    """
    @classmethod
    def setUpClass(cls):
        try:
            from anki.collection import Collection
        except ImportError:
            raise unittest.SkipTest('Anki Python backend unavailable')
        cls.tmp = tempfile.TemporaryDirectory(prefix='anki-static-io-fixtures-')
        cls.col = Collection(str(Path(cls.tmp.name)/'fixture.anki2'))
        cls.col.add_image_occlusion_notetype()
        cls.model = next(m for m in cls.col.models.all() if m.get('originalStockKind') == 6)

    @classmethod
    def tearDownClass(cls):
        cls.col.close()
        cls.tmp.cleanup()

    def test_backend_native_fixture_semantics(self):
        class Clozes(HTMLParser):
            def __init__(self):
                super().__init__()
                self.shapes=[]
            def handle_starttag(self,tag,attrs):
                props=dict(attrs)
                if tag=='div' and 'data-shape' in props:
                    self.shapes.append(props)

        for all_mode in [True,False]:
            note=self.col.new_note(self.model)
            payload=RECT+ELLIPSE+POLYGON+PERMANENT
            if not all_mode:
                payload=payload.replace(':oi=1','')
            note.fields=[payload,'<img src="test.png">','Head','Back','Comments']
            self.col.add_note(note,1)
            self.assertEqual(len(note.cards()),3)
            for card in note.cards():
                result=render_native_image_occlusion(self.model,note.fields,card.ord,
                                                    lambda _:MediaAsset('/media/test.png',1000,500))
                self.assertTrue(result.supported)
                for backend_html, static_html in [(card.question(),result.front),(card.answer(),result.back)]:
                    parsed=Clozes()
                    parsed.feed(backend_html)
                    expected=[]
                    for cls, fill in [('cloze','#ff8e8e'),('cloze-inactive','#ffeba2'),('cloze-highlight','none')]:
                        expected.extend((s['data-shape'],fill) for s in parsed.shapes
                                        if s['class']==cls and (cls!='cloze-inactive' or s.get('data-occludeinactive')=='1'))
                    actual=[(s['tag'],s['fill']) for s in shape_tags(static_html)]
                    self.assertEqual(actual,expected)


if __name__=='__main__':
    unittest.main(verbosity=2)
