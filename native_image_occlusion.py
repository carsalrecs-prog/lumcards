"""Conservative static renderer for Anki's built-in image occlusion format.

This module generates SVG itself; it never executes note/template JavaScript or
copies SVG/HTML supplied by a note. Unsupported input returns an opaque warning
with no image, so a partially parsed mask cannot reveal an answer by accident.

Geometry/ordinal semantics checked against Anki 26.8.1's native backend and the
official format documented in SOURCES.md. This is a deliberately limited subset:
axis-aligned rectangles/ellipses and unrotated polygons, optionally grouped by
cloze ordinal, with either native hide-one or hide-all mode. Text annotations,
custom colors, transforms, malformed/nonfinite geometry, and unknown properties
are rejected for the whole card. Header/Back Extra are rendered as plain text.
"""
from __future__ import annotations

from dataclasses import dataclass
from html import escape
from html.parser import HTMLParser
import math
import re
from typing import Callable, Mapping, Sequence, Any
from urllib.parse import unquote, urlsplit


@dataclass(frozen=True)
class MediaAsset:
    src: str
    width: int
    height: int


@dataclass(frozen=True)
class NativeIOResult:
    recognized: bool
    supported: bool
    front: str
    back: str
    reason: str | None = None


class UnsupportedIO(ValueError):
    pass


_CLOZE = re.compile(r"\{\{c([0-9]+)::image-occlusion:([^{}]+)\}\}")
_GAP = re.compile(r"(?:\s|<br\s*/?>)*", re.IGNORECASE)
_NUM = re.compile(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?")
_RASTER_EXT = {"png", "jpg", "jpeg", "gif", "webp", "bmp", "avif"}
_MAX_FIELD = 100_000
_MAX_SHAPES = 500


class _ImageField(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.sources: list[str] = []
        self.invalid = False

    def handle_starttag(self, tag, attrs):
        # Native Anki writes just <img src="filename">. Reject styling, wrappers
        # and extra attributes rather than guessing cropping/transforms.
        if tag != "img" or len(attrs) != 1 or attrs[0][0] != "src" or not attrs[0][1]:
            self.invalid = True
        else:
            self.sources.append(attrs[0][1])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        self.invalid = True

    def handle_data(self, data):
        self.invalid |= bool(data.strip())

    def handle_comment(self, data):
        self.invalid = True

    def handle_decl(self, decl):
        self.invalid = True

    def handle_pi(self, data):
        self.invalid = True


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.blocked = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "iframe", "object", "svg", "math"}:
            self.blocked += 1
        elif tag in {"br", "div", "p", "li"} and not self.blocked:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "iframe", "object", "svg", "math"}:
            self.blocked = max(0, self.blocked - 1)
        elif tag in {"div", "p", "li"} and not self.blocked:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.blocked:
            self.parts.append(data)


def _plain_html(value: str) -> str:
    parser = _Text()
    parser.feed(value[:_MAX_FIELD])
    parser.close()
    return escape("".join(parser.parts).strip()).replace("\n", "<br>")


def _number(value: str, *, minimum=-2.0, maximum=3.0) -> float:
    if not _NUM.fullmatch(value) or len(value) > 32:
        raise UnsupportedIO("La geometría contiene un número no compatible.")
    result = float(value)
    if not math.isfinite(result) or not minimum <= result <= maximum:
        raise UnsupportedIO("La geometría está fuera de los límites compatibles.")
    return result


def _parse_shapes(value: str):
    if len(value) > _MAX_FIELD:
        raise UnsupportedIO("La nota contiene demasiadas máscaras.")
    shapes = []
    position = 0
    for match in _CLOZE.finditer(value):
        if not _GAP.fullmatch(value[position:match.start()]):
            raise UnsupportedIO("La nota incluye contenido de oclusión no compatible.")
        position = match.end()
        raw_ordinal = match.group(1)
        if len(raw_ordinal) > 5:
            raise UnsupportedIO("El número de máscara no es compatible.")
        ordinal = int(raw_ordinal)
        pieces = match.group(2).split(":")
        kind = pieces.pop(0)
        required = {"rect": {"left", "top", "width", "height"},
                    "ellipse": {"left", "top", "rx", "ry"},
                    "polygon": {"left", "top", "points"}}.get(kind)
        if required is None:
            raise UnsupportedIO("Esta nota usa texto o una forma de máscara aún no compatible.")
        props = {}
        for piece in pieces:
            if "=" not in piece:
                raise UnsupportedIO("Una máscara no tiene el formato nativo esperado.")
            key, val = piece.split("=", 1)
            if key in props or key not in required | {"oi", "angle"}:
                raise UnsupportedIO("La nota usa una propiedad de máscara aún no compatible.")
            props[key] = val
        if not required <= props.keys():
            raise UnsupportedIO("Faltan coordenadas de una máscara.")
        if props.get("oi", "0") not in {"0", "1"}:
            raise UnsupportedIO("El modo de oclusión no es compatible.")
        if "angle" in props and _number(props["angle"], minimum=-10_000, maximum=10_000) != 0:
            raise UnsupportedIO("Las máscaras giradas todavía no son compatibles.")
        geom = {key: _number(props[key]) for key in required if key != "points"}
        for dimension in {"width", "height", "rx", "ry"} & required:
            if geom[dimension] <= 0:
                raise UnsupportedIO("Una máscara tiene tamaño vacío o negativo.")
        if kind == "polygon":
            raw_points = props["points"].split()
            if not 3 <= len(raw_points) <= 200:
                raise UnsupportedIO("El polígono no tiene un número de puntos compatible.")
            points = []
            for point in raw_points:
                xy = point.split(",")
                if len(xy) != 2:
                    raise UnsupportedIO("Las coordenadas del polígono no son compatibles.")
                points.append((_number(xy[0]), _number(xy[1])))
            # A collinear or degenerate polygon has no area and cannot mask text.
            area = sum(a[0] * b[1] - b[0] * a[1]
                       for a, b in zip(points, points[1:] + points[:1]))
            if abs(area) < 1e-10:
                raise UnsupportedIO("El polígono tiene un área vacía.")
            geom["points"] = points
        shapes.append((ordinal, kind, geom, props.get("oi") == "1"))
        if len(shapes) > _MAX_SHAPES:
            raise UnsupportedIO("La nota contiene demasiadas máscaras.")
    if not shapes or not _GAP.fullmatch(value[position:]):
        raise UnsupportedIO("No se encontró un conjunto completo de máscaras nativas compatibles.")
    return shapes


def _media(value: str, resolve_media: Callable[[str], MediaAsset | None]) -> MediaAsset:
    parser = _ImageField()
    parser.feed(value)
    parser.close()
    if parser.invalid or len(parser.sources) != 1:
        raise UnsupportedIO("Se necesita una única imagen nativa sin transformaciones.")
    filename = unquote(parser.sources[0])
    if (not filename or filename in {".", ".."} or any(c in filename for c in '/\\:\x00')
            or any(ord(c) < 32 for c in filename)
            or filename.rsplit(".", 1)[-1].lower() not in _RASTER_EXT):
        raise UnsupportedIO("La imagen debe ser un archivo local de mapa de bits compatible.")
    asset = resolve_media(filename)
    if asset is None:
        raise UnsupportedIO("No se encontró la imagen de esta tarjeta.")
    parsed = urlsplit(asset.src)
    decoded = unquote(parsed.path)
    if (parsed.scheme or parsed.netloc or parsed.query or parsed.fragment
            or not parsed.path.startswith("/media/")
            or not decoded.startswith("/media/")
            or "/" in decoded[len("/media/"):]
            or any(c in decoded for c in '\\:\x00')
            or any(ord(c) < 32 for c in decoded)
            or decoded[len("/media/"):] in {"", ".", ".."}):
        raise UnsupportedIO("La imagen no tiene una ruta local de medios válida.")
    if (type(asset.width) is not int or type(asset.height) is not int
            or not 1 <= asset.width <= 20_000 or not 1 <= asset.height <= 20_000
            or asset.width * asset.height > 80_000_000):
        raise UnsupportedIO("Las dimensiones de la imagen no son compatibles.")
    return asset


def _fmt(value: float) -> str:
    return format(value, ".6f").rstrip("0").rstrip(".") or "0"


def _shape_svg(shape, asset: MediaAsset, fill: str, stroke: str) -> str:
    ordinal, kind, g, _ = shape
    x, y = g["left"] * asset.width, g["top"] * asset.height
    attrs = (f'fill="{fill}" stroke="{stroke}" stroke-width="1.5" '
             'vector-effect="non-scaling-stroke"')
    if kind == "rect":
        geometry = (f'x="{_fmt(x)}" y="{_fmt(y)}" '
                    f'width="{_fmt(g["width"] * asset.width)}" '
                    f'height="{_fmt(g["height"] * asset.height)}"')
    elif kind == "ellipse":
        rx, ry = g["rx"] * asset.width, g["ry"] * asset.height
        geometry = (f'cx="{_fmt(x + rx)}" cy="{_fmt(y + ry)}" '
                    f'rx="{_fmt(rx)}" ry="{_fmt(ry)}"')
    else:
        # Anki translates each polygon's point bounding box to its left/top;
        # the points are not relative offsets and cannot simply add left/top.
        min_x = min(p[0] for p in g["points"])
        min_y = min(p[1] for p in g["points"])
        points = " ".join(f'{_fmt(x + (px - min_x) * asset.width)},'
                          f'{_fmt(y + (py - min_y) * asset.height)}'
                          for px, py in g["points"])
        geometry = f'points="{points}"'
    return f'<{kind} {geometry} {attrs}></{kind}>'


def _svg(shapes, active: int, asset: MediaAsset, answer: bool) -> str:
    # Native painter order: active/permanent, inactive, then answer highlight.
    current = [s for s in shapes if s[0] == 0 or (s[0] == active and not answer)]
    others = [s for s in shapes if s[0] not in {0, active} and s[3]]
    highlights = [s for s in shapes if s[0] == active] if answer else []
    parts = [_shape_svg(s, asset, "#ff8e8e", "#212121") for s in current]
    parts += [_shape_svg(s, asset, "#ffeba2", "#212121") for s in others]
    parts += [_shape_svg(s, asset, "none", "#e65369") for s in highlights]
    # The image and masks share ONE SVG. Do not detach the image or remove shape
    # tags in a downstream sanitizer. No separate unmasked <img> is emitted.
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 {asset.width} {asset.height}" '
            'role="img" aria-label="Tarjeta de oclusión de imagen" '
            'style="display:block;width:100%;height:auto;max-width:100%;margin:0 auto">'
            f'<image href="{escape(asset.src, quote=True)}" x="0" y="0" '
            f'width="{asset.width}" height="{asset.height}"></image>'
            + "".join(parts) + '</svg>')


def render_native_image_occlusion(
    note_type: Mapping[str, Any],
    fields: Sequence[str],
    card_ordinal: int,
    resolve_media: Callable[[str], MediaAsset | None],
) -> NativeIOResult:
    """Render an Anki native IO card, or return a fail-closed placeholder.

    card_ordinal is Anki's ZERO-based Card.ord (cloze c1 == ordinal 0).
    resolve_media receives a decoded, validated media filename; it must return a
    verified local raster URL (/media/basename) and actual image pixel dimensions.
    It should return None for missing/invalid media. No network should be used.

    Caller must detect supported=False and must NOT fall back to the ordinary
    rendered Anki question: removing its JS exposes the image without masks.
    recognized=False means this is not a native IO model and another renderer may
    be used. Customized IO templates are intentionally not evaluated; static
    rendering follows native default shape appearance and plain-text extra fields.
    """
    if note_type.get("originalStockKind") != 6:
        return NativeIOResult(False, False, "", "")
    try:
        if type(card_ordinal) is not int or not 0 <= card_ordinal < 99_999:
            raise UnsupportedIO("El número de tarjeta no es compatible.")
        indexed = {}
        for field in note_type.get("flds", []):
            tag = field.get("tag")
            if tag in {0, 1, 2, 3}:
                index = field.get("ord")
                if tag in indexed or type(index) is not int or not 0 <= index < len(fields):
                    raise UnsupportedIO("La estructura de campos de la nota no es compatible.")
                indexed[tag] = fields[index]
        if not {0, 1, 2, 3} <= indexed.keys():
            raise UnsupportedIO("Faltan los campos nativos de oclusión de imagen.")
        shapes = _parse_shapes(indexed[0])
        active = card_ordinal + 1
        if not any(s[0] == active for s in shapes):
            raise UnsupportedIO("No existe una máscara para esta tarjeta.")
        asset = _media(indexed[1], resolve_media)
        header = _plain_html(indexed[2])
        extra = _plain_html(indexed[3])
        lead = f'<div class="io-header">{header}</div>' if header else ""
        front = lead + _svg(shapes, active, asset, False)
        back = lead + _svg(shapes, active, asset, True)
        if extra:
            back += f'<div class="io-extra">{extra}</div>'
        return NativeIOResult(True, True, front, back)
    except (UnsupportedIO, TypeError, ValueError, IndexError, KeyError) as exc:
        reason = str(exc) if isinstance(exc, UnsupportedIO) else "La nota contiene datos no compatibles."
        placeholder = ('<div class="io-unsupported" role="status"><strong>'
                       'Esta oclusión necesita Anki</strong><p>' + escape(reason)
                       + ' La imagen permanece oculta para proteger la respuesta.</p></div>')
        return NativeIOResult(True, False, placeholder, placeholder, reason)
