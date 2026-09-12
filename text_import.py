"""Importación de tarjetas de texto, sin motores ni formatos privados externos.

La salida es texto sin interpretar: el consumidor debe escaparlo si lo muestra
en HTML. Este módulo no accede a archivos, red, bases de datos ni contenido remoto.
"""

import csv
import io
import json
import re
import unicodedata
from pathlib import PurePath


MAX_BYTES = 2 * 1024 * 1024
MAX_ROWS = 5000
MAX_FIELD_CHARS = 10000
MAX_TAGS = 50
MAX_TAG_CHARS = 100
MAX_WARNINGS = 20

_HEADERS = {
    "front": "front", "pregunta": "front", "term": "front",
    "termino": "front", "anverso": "front",
    "back": "back", "respuesta": "back", "definition": "back",
    "definicion": "back", "reverso": "back",
    "tags": "tags", "etiquetas": "tags",
}
_SEPARATORS = {
    ",": ",", ";": ";", "\t": "\t", "-": "-",
    "comma": ",", "semicolon": ";", "tab": "\t", "dash": "-",
}


def _header(value):
    normalized = unicodedata.normalize("NFKD", value.strip().casefold())
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    return _HEADERS.get(normalized)


def _field(value, name):
    if not isinstance(value, str):
        raise ValueError(f"{name} debe contener texto")
    if len(value) > MAX_FIELD_CHARS:
        raise ValueError(f"{name} supera los {MAX_FIELD_CHARS} caracteres")
    if any((ord(char) < 32 and char not in "\t\r\n") or ord(char) == 127
           or 0xD800 <= ord(char) <= 0xDFFF for char in value):
        raise ValueError(f"{name} contiene caracteres de control o Unicode inválidos")
    value = value.strip()
    if not value:
        raise ValueError(f"{name} está vacío")
    return value


def _tags(value):
    if value is None or value == "":
        return []
    if isinstance(value, str):
        if len(value) > MAX_FIELD_CHARS:
            raise ValueError(f"las etiquetas superan los {MAX_FIELD_CHARS} caracteres")
        parts = re.split(r"[,;\s]+", value.strip())
    elif isinstance(value, list):
        parts = value
        if sum(len(part) for part in parts if isinstance(part, str)) > MAX_FIELD_CHARS:
            raise ValueError(f"las etiquetas superan los {MAX_FIELD_CHARS} caracteres")
    else:
        raise ValueError("las etiquetas deben ser texto o una lista de textos")
    result = []
    seen = set()
    for part in parts:
        if isinstance(part, str) and not part.strip():
            continue
        tag = _field(part, "cada etiqueta")
        if any(ord(char) < 32 for char in tag):
            raise ValueError("cada etiqueta debe estar en una sola línea, sin caracteres de control")
        if len(tag) > MAX_TAG_CHARS:
            raise ValueError(f"cada etiqueta admite hasta {MAX_TAG_CHARS} caracteres")
        if tag not in seen:
            seen.add(tag)
            result.append(tag)
            if len(result) > MAX_TAGS:
                raise ValueError(f"cada tarjeta admite hasta {MAX_TAGS} etiquetas")
    return result


def _delimiter(text, suffix, separator):
    if separator != "auto":
        if not isinstance(separator, str) or separator not in _SEPARATORS:
            raise ValueError("Separador no válido. Usa auto, coma, punto y coma o tabulador.")
        return _SEPARATORS[separator]
    # Encabezados completos y tabuladores en TSV/TXT desambiguan definiciones
    # que contienen comas. Sniffer resuelve el resto de los casos habituales.
    first_rows = {}
    for candidate in ("\t", ";", ","):
        try:
            first_rows[candidate] = next(
                (row for row in csv.reader(io.StringIO(text, newline=""), delimiter=candidate,
                                            strict=True) if row), [])
        except csv.Error:
            continue
        aliases = [_header(value) for value in first_rows[candidate]]
        if "front" in aliases and "back" in aliases:
            return candidate
    if suffix in ("tsv", "txt") and len(first_rows.get("\t", [])) >= 2:
        return "\t"
    try:
        return csv.Sniffer().sniff(text[:65536], delimiters=",;\t").delimiter
    except csv.Error:
        default = "\t" if suffix in ("tsv", "txt") else ","
        # Recupera también un CSV con filas incompletas sin convertir todas las
        # filas en una sola columna por un fallo de autodetección.
        populated = [candidate for candidate, row in first_rows.items() if len(row) >= 2]
        return default if default in populated or not populated else populated[0]


def parse_cards(payload: bytes, filename: str, *, separator="auto", has_header=True):
    """Devuelve {cards, skipped, warnings, format} para CSV, TSV, TXT o JSON.

    CSV/TSV/TXT sin encabezado reconocido requieren exactamente dos columnas.
    Los encabezados pueden invertirlas y añadir una columna tags/etiquetas.
    Con has_header=False incluso una primera fila 'front,back' es una tarjeta.
    JSON admite una lista de objetos front/back/tags o un objeto {cards: lista}.
    Las etiquetas de texto se separan por espacios, comas o punto y coma; las
    listas de etiquetas conservan los espacios internos de cada elemento. Cada
    tarjeta admite hasta 50 etiquetas distintas de un máximo de 100 caracteres.
    Filas inválidas se omiten con aviso; errores estructurales y archivos sin
    tarjetas válidas producen ValueError. No se realizan importaciones parciales
    si se supera el límite de tamaño o número total de registros.
    """
    if not isinstance(payload, bytes):
        raise ValueError("El archivo debe recibirse como bytes.")
    if len(payload) > MAX_BYTES:
        raise ValueError("El archivo supera el límite de 2 MiB.")
    if not isinstance(filename, str):
        raise ValueError("El nombre del archivo no es válido.")
    suffix = PurePath(filename).suffix.lower().lstrip(".")
    if not suffix or suffix == "quizlet":
        suffix = "txt"
    if suffix not in ("csv", "tsv", "txt", "json"):
        raise ValueError("Formato no compatible. Usa CSV, TSV, TXT, JSON o exportaciones de Quizlet.")
    if not isinstance(has_header, bool):
        raise ValueError("La opción de encabezado debe ser verdadero o falso.")
    try:
        text = payload.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("El archivo no es UTF-8 válido. Guárdalo con codificación UTF-8.") from exc
    if not text.strip():
        raise ValueError("El archivo está vacío.")

    cards = []
    skipped = 0
    warnings = []

    def accept(front, back, tags, position):
        nonlocal skipped
        try:
            cards.append({"front": _field(front, "el anverso"),
                          "back": _field(back, "el reverso"), "tags": _tags(tags)})
        except ValueError as exc:
            reject(position, str(exc))

    def reject(position, reason):
        nonlocal skipped
        skipped += 1
        if len(warnings) < MAX_WARNINGS:
            warnings.append(f"Fila {position}: {reason}.")

    if suffix == "json":
        try:
            raw = json.loads(text)
        except (json.JSONDecodeError, RecursionError) as exc:
            raise ValueError("El archivo JSON está mal formado.") from exc
        rows = raw.get("cards") if isinstance(raw, dict) else raw
        if not isinstance(rows, list):
            raise ValueError("El JSON debe ser una lista de tarjetas o un objeto con una lista 'cards'.")
        if len(rows) > MAX_ROWS:
            raise ValueError(f"El archivo supera el límite de {MAX_ROWS} filas.")
        for position, row in enumerate(rows, 1):
            if not isinstance(row, dict):
                reject(position, "la tarjeta debe ser un objeto con front y back")
                continue
            accept(row.get("front"), row.get("back"), row.get("tags"), position)
    else:
        reader = csv.reader(io.StringIO(text, newline=""),
                            delimiter=_delimiter(text, suffix, separator), strict=True)
        columns = None
        first = True
        row_count = 0
        try:
            for row in reader:
                if first and row:
                    first = False
                    aliases = [_header(value) for value in row]
                    if has_header and "front" in aliases and "back" in aliases:
                        if (any(alias is None for alias in aliases)
                                or len(set(aliases)) != len(aliases)):
                            raise ValueError("Encabezado ambiguo: usa una columna de anverso, una de reverso "
                                             "y, opcionalmente, tags o etiquetas.")
                        columns = aliases
                        continue
                row_count += 1
                if row_count > MAX_ROWS:
                    raise ValueError(f"El archivo supera el límite de {MAX_ROWS} filas.")
                expected = len(columns) if columns else 2
                if len(row) != expected:
                    reject(reader.line_num, f"se esperaban {expected} columnas y se encontraron {len(row)}")
                    continue
                values = dict(zip(columns or ("front", "back"), row))
                accept(values["front"], values["back"], values.get("tags"), reader.line_num)
        except csv.Error as exc:
            raise ValueError("El archivo de texto está mal formado: revisa las comillas y los separadores.") from exc

    if not cards:
        detail = f" {warnings[0]}" if warnings else ""
        raise ValueError("No se encontraron tarjetas válidas con anverso y reverso." + detail)
    if skipped > MAX_WARNINGS:
        warnings.append(f"Hay {skipped - MAX_WARNINGS} filas omitidas adicionales.")
    return {"cards": cards, "skipped": skipped, "warnings": warnings, "format": suffix}
