import json
import unittest

from text_import import MAX_BYTES, MAX_FIELD_CHARS, MAX_ROWS, MAX_TAGS, MAX_TAG_CHARS, parse_cards


def parse(text, filename="cards.csv", **options):
    return parse_cards(text.encode("utf-8"), filename, **options)


class TextImportTests(unittest.TestCase):
    def test_csv_bom_quotes_multiline_and_unicode(self):
        result = parse('\ufeffPregunta,Respuesta\r\n"¿Qué, tal?","Línea uno\nLínea dos: acción 😀"\r\n')
        self.assertEqual(result["cards"], [{"front": "¿Qué, tal?", "back": "Línea uno\nLínea dos: acción 😀", "tags": []}])
        self.assertEqual((result["format"], result["skipped"]), ("csv", 0))

    def test_spanish_reordered_header_and_tags(self):
        result = parse('Definición;Etiquetas;Término\nRespuesta;"bio, célula;bio";Pregunta\n')
        self.assertEqual(result["cards"][0], {"front": "Pregunta", "back": "Respuesta", "tags": ["bio", "célula"]})

    def test_header_aliases(self):
        for front, back in (("front", "back"), ("pregunta", "respuesta"), ("term", "definition"),
                            ("término", "definición"), ("anverso", "reverso")):
            with self.subTest(front=front):
                self.assertEqual(len(parse(f"{front},{back}\nuno,dos")["cards"]), 1)

    def test_no_header_keeps_first_row_and_false_is_explicit(self):
        self.assertEqual(parse("uno,dos\ntres,cuatro")["cards"][0]["front"], "uno")
        self.assertEqual(parse("front,back\nuno,dos", has_header=False)["cards"][0]["front"], "front")

    def test_tsv_and_quizlet_style_text_preserve_commas(self):
        for extension in ("txt", "TSV"):
            with self.subTest(extension=extension):
                result = parse("cat\tgato, felino\ndog\tperro, canino", "cards." + extension)
                self.assertEqual(result["cards"][0]["back"], "gato, felino")

    def test_explicit_delimiters(self):
        for separator, text in ((";", "one;two"), ("comma", "one,two"), ("tab", "one\ttwo")):
            with self.subTest(separator=separator):
                self.assertEqual(parse(text, separator=separator)["cards"][0]["back"], "two")

    def test_sniffer_fallback_for_invalid_rows(self):
        result = parse("first;second\nmissing\nthird;fourth\nfifth;sixth;ambiguous")
        self.assertEqual((len(result["cards"]), result["skipped"]), (2, 2))

    def test_json_list_and_wrapped_cards(self):
        cards = [{"front": "日本語 😀", "back": "Español", "tags": ["dos palabras", "área", "área"]}]
        for raw in (cards, {"cards": cards}):
            with self.subTest(wrapped=isinstance(raw, dict)):
                result = parse(json.dumps(raw, ensure_ascii=False), "cards.json")
                self.assertEqual(result["cards"][0]["tags"], ["dos palabras", "área"])
                self.assertEqual(result["cards"][0]["front"], "日本語 😀")

    def test_json_tags_text_and_missing_tags(self):
        result = parse(json.dumps([{"front": "a", "back": "b", "tags": "one two,three;one"},
                                   {"front": "c", "back": "d"}]), "cards.json")
        self.assertEqual(result["cards"][0]["tags"], ["one", "two", "three"])
        self.assertEqual(result["cards"][1]["tags"], [])

    def test_invalid_json_rows_are_counted_without_coercing_values(self):
        result = parse(json.dumps([{"front": "a", "back": "b"}, {"front": 12, "back": "d"},
                                   None, {"front": "x", "back": ""},
                                   {"front": "x", "back": "y", "tags": [1]}]), "cards.json")
        self.assertEqual((len(result["cards"]), result["skipped"]), (1, 4))
        self.assertEqual(len(result["warnings"]), 4)

    def test_html_is_returned_as_literal_text(self):
        text = '<img src=x onerror=alert(1)>\t<script>alert(2)</script>'
        card = parse(text, "cards.txt")["cards"][0]
        self.assertEqual(card["front"], '<img src=x onerror=alert(1)>')
        self.assertEqual(card["back"], '<script>alert(2)</script>')

    def test_extra_columns_require_recognized_tags_header(self):
        result = parse("good,answer\nbad,answer,unknown")
        self.assertEqual(result["skipped"], 1)
        for text in ("front,back,unknown\na,b,c", "front,back,front\na,b,c"):
            with self.subTest(text=text), self.assertRaisesRegex(ValueError, "Encabezado ambiguo"):
                parse(text)

    def test_invalid_utf8_empty_unknown_format_and_bad_options(self):
        for payload, name, options in ((b"\xff\xfe", "cards.csv", {}), (b" ", "cards.txt", {}),
                                       (b"a,b", "cards.exe", {}), (b"a,b", "cards.csv", {"separator": "|"}),
                                       (b"a,b", "cards.csv", {"has_header": "false"})):
            with self.subTest(payload=payload, name=name, options=options), self.assertRaises(ValueError):
                parse_cards(payload, name, **options)

    def test_malformed_csv_json_and_empty_cards(self):
        for text, name in (('"unclosed,answer', "cards.csv"), ('[}', "cards.json"),
                           ('{"cards": {}}', "cards.json"), ('[]', "cards.json"),
                           ('front,back\n,', "cards.csv")):
            with self.subTest(text=text), self.assertRaises(ValueError):
                parse(text, name)

    def test_control_characters_and_surrogates_are_invalid(self):
        result = parse(json.dumps([{"front": "a", "back": "b"}, {"front": "bad\u0000", "back": "b"},
                                   {"front": "\ud800", "back": "b"}]), "cards.json")
        self.assertEqual(result["skipped"], 2)

    def test_size_row_and_field_limits(self):
        with self.assertRaisesRegex(ValueError, "2 MiB"):
            parse_cards(b"a" * (MAX_BYTES + 1), "cards.txt")
        with self.assertRaisesRegex(ValueError, "5000"):
            parse("a,b\n" * (MAX_ROWS + 1), has_header=False)
        with self.assertRaisesRegex(ValueError, "5000"):
            parse(json.dumps([{}] * (MAX_ROWS + 1)), "cards.json")
        self.assertEqual(len(parse("a,b\n" * MAX_ROWS, has_header=False)["cards"]), MAX_ROWS)
        result = parse("good,answer\n" + "a" * (MAX_FIELD_CHARS + 1) + ",answer")
        self.assertEqual(result["skipped"], 1)
        self.assertEqual(len(parse("a" * MAX_FIELD_CHARS + ",answer")["cards"][0]["front"]), MAX_FIELD_CHARS)

    def test_warning_output_is_bounded(self):
        result = parse("good,answer\n" + "missing\n" * 40)
        self.assertEqual(result["skipped"], 40)
        self.assertEqual(len(result["warnings"]), 21)

    def test_tag_limits_match_commit_requirements(self):
        valid = {"front": "valid", "back": "card", "tags": ["a" * MAX_TAG_CHARS]}
        for invalid_tags in (["a" * (MAX_TAG_CHARS + 1)], "a" * (MAX_TAG_CHARS + 1),
                             [f"tag{i}" for i in range(MAX_TAGS + 1)],
                             " ".join(f"tag{i}" for i in range(MAX_TAGS + 1)),
                             ["two\nlines"], ["two\tparts"]):
            with self.subTest(tags_type=type(invalid_tags).__name__):
                result = parse(json.dumps([valid, {"front": "invalid", "back": "card",
                                                   "tags": invalid_tags}]), "cards.json")
                self.assertEqual(result["cards"], [valid])
                self.assertEqual(result["skipped"], 1)
                self.assertIn("etiqueta", result["warnings"][0])
        valid["tags"] = [f"tag{i}" for i in range(MAX_TAGS)]
        self.assertEqual(parse(json.dumps([valid]), "cards.json")["cards"], [valid])

    def test_duplicate_tags_are_removed_before_count_limit(self):
        result = parse(json.dumps([{"front": "a", "back": "b", "tags": ["same"] * 60}]), "cards.json")
        self.assertEqual(result["cards"][0]["tags"], ["same"])

    def test_csv_preview_omits_tags_that_commit_would_reject(self):
        result = parse("front,back,tags\ngood,answer,valid\nbad,answer," + "x" * (MAX_TAG_CHARS + 1))
        self.assertEqual(len(result["cards"]), 1)
        self.assertEqual(result["skipped"], 1)


if __name__ == "__main__":
    unittest.main()
