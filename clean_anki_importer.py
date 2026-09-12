"""Lector limpio e independiente de paquetes Anki (.apkg, .colpkg, .anki2).

Este módulo es una implementación propia ('clean-room') desarrollada exclusivamente
con bibliotecas estándar de Python (sqlite3, zipfile, json).
NO importa, no incluye ni enlaza el código fuente oficial de Anki (GPL / AGPL-3.0),
lo que garantiza plena independencia de licencias para uso y comercialización privada.
"""
from __future__ import annotations

import html
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import tempfile
from typing import Any, Dict, List, Optional, Tuple


def strip_html(text: str) -> str:
    """Elimina etiquetas HTML y decodifica entidades para obtener texto plano limpio."""
    if not text or not isinstance(text, str):
        return ""
    # Reemplazar <br>, <div>, <p> por saltos de línea
    formatted = re.sub(r'(?i)<br\s*/?>', '\n', text)
    formatted = re.sub(r'(?i)</?(?:p|div|li|tr|h[1-6])\b[^>]*>', '\n', formatted)
    # Remover sonidos de Anki: [sound:archivo.mp3]
    formatted = re.sub(r'\[sound:[^\]]*\]', '', formatted)
    # Remover cualquier otra etiqueta HTML
    formatted = re.sub(r'<[^>]+>', '', formatted)
    # Decodificar entidades (&nbsp;, &amp;, &lt;, etc.)
    unescaped = html.unescape(formatted)
    # Normalizar espacios en blanco
    lines = [line.strip() for line in unescaped.split('\n')]
    return '\n'.join(line for line in lines if line).strip()


def parse_clean_apkg(
    package_path: str | Path,
    target_media_dir: Optional[str | Path] = None
) -> Dict[str, Any]:
    """Lee un archivo .apkg, .colpkg o .anki2 extrayendo mazos, tarjetas y archivos multimedia.
    
    Retorna un diccionario estructurado:
    {
        "filename": str,
        "decks": [
            {
                "id": int,
                "name": str,
                "cards": [
                    {
                        "id": int,
                        "front": str,
                        "back": str,
                        "raw_front": str,
                        "raw_back": str,
                        "tags": List[str]
                    }
                ]
            }
        ],
        "total_cards": int,
        "media_count": int,
        "warnings": List[str]
    }
    """
    path = Path(package_path)
    if not path.is_file():
        raise FileNotFoundError(f"El archivo no existe: {path}")

    warnings: List[str] = []
    temp_dir = tempfile.mkdtemp(prefix="codex-clean-import-")
    try:
        db_path: Optional[Path] = None
        media_mapping: Dict[str, str] = {}
        extracted_media_count = 0

        # Si es un archivo .anki2 directo (SQLite directo)
        if path.suffix.lower() in ('.anki2', '.anki21'):
            db_path = path
        else:
            # Es un archivo ZIP (.apkg o .colpkg)
            import zipfile
            with zipfile.ZipFile(path, 'r') as zf:
                zf.extractall(temp_dir)

            # Buscar base de datos de colección
            for candidate in ('collection.anki21b', 'collection.anki21', 'collection.anki2'):
                cand_path = Path(temp_dir) / candidate
                if cand_path.is_file():
                    db_path = cand_path
                    break

            if not db_path:
                raise ValueError("No se encontró el archivo de base de datos 'collection.anki2' en el paquete.")

            # Extraer mapeo multimedia si existe
            media_json = Path(temp_dir) / 'media'
            if media_json.is_file():
                try:
                    with media_json.open('r', encoding='utf-8') as mf:
                        media_mapping = json.load(mf)
                except Exception as exc:
                    warnings.append(f"No se pudo leer el índice multimedia: {exc}")

            # Copiar medios si se especificó directorio destino
            if target_media_dir and media_mapping:
                dest = Path(target_media_dir)
                dest.mkdir(parents=True, exist_ok=True)
                for stored_name, original_name in media_mapping.items():
                    src_file = Path(temp_dir) / stored_name
                    if src_file.is_file():
                        try:
                            # Sanitizar nombre
                            safe_name = Path(original_name).name
                            shutil.copy2(src_file, dest / safe_name)
                            extracted_media_count += 1
                        except Exception as exc:
                            warnings.append(f"Error copiando {original_name}: {exc}")

        # Conectar a SQLite de solo lectura
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # 1. Obtener información de mazos y modelos desde 'col'
        cur.execute("SELECT decks, models FROM col LIMIT 1")
        col_row = cur.fetchone()
        decks_data: Dict[str, Any] = {}
        if col_row and col_row['decks']:
            try:
                decks_data = json.loads(col_row['decks'])
            except Exception:
                decks_data = {}

        # Mapeo de deck_id -> nombre
        deck_names: Dict[int, str] = {}
        for did_str, dinfo in decks_data.items():
            try:
                did = int(did_str)
                name = dinfo.get('name', f'Mazo {did}')
                deck_names[did] = name
            except (ValueError, TypeError):
                continue

        # 2. Obtener notas
        cur.execute("SELECT id, mid, flds, tags FROM notes")
        notes_map: Dict[int, Dict[str, Any]] = {}
        for row in cur.fetchall():
            raw_fields = row['flds'].split('\x1f') if row['flds'] else []
            tags_str = row['tags'] or ''
            tags = [t.strip() for t in tags_str.split() if t.strip()]
            notes_map[row['id']] = {
                'fields': raw_fields,
                'tags': tags,
                'mid': row['mid']
            }

        # 3. Obtener tarjetas y agrupar por mazo
        cur.execute("SELECT id, nid, did, ord FROM cards ORDER BY id ASC")
        cards_by_deck: Dict[int, List[Dict[str, Any]]] = {}
        total_cards = 0

        for row in cur.fetchall():
            cid = row['id']
            nid = row['nid']
            did = row['did']
            ord_idx = row['ord']

            note = notes_map.get(nid)
            if not note or not note['fields']:
                continue

            fields = note['fields']
            raw_front = fields[0] if len(fields) > 0 else ""
            raw_back = fields[1] if len(fields) > 1 else (fields[0] if len(fields) == 1 else "")

            clean_front = strip_html(raw_front)
            clean_back = strip_html(raw_back)

            if not clean_front and not clean_back:
                continue

            card_obj = {
                'id': cid,
                'nid': nid,
                'ord': ord_idx,
                'front': clean_front,
                'back': clean_back,
                'raw_front': raw_front,
                'raw_back': raw_back,
                'tags': note['tags']
            }

            if did not in cards_by_deck:
                cards_by_deck[did] = []
            cards_by_deck[did].append(card_obj)
            total_cards += 1

        conn.close()

        # Construir lista de mazos resultante
        result_decks: List[Dict[str, Any]] = []
        for did, cards in cards_by_deck.items():
            dname = deck_names.get(did, f"Mazo importado ({path.stem})")
            # Limpiar nombre por defecto si es 1
            if did == 1 and dname.lower() in ('default', 'predeterminado'):
                dname = path.stem or "Mazo importado"
            result_decks.append({
                'id': did,
                'name': dname,
                'cards': cards
            })

        if not result_decks and total_cards == 0:
            warnings.append("No se encontraron tarjetas válidas con anverso y reverso en el archivo.")

        return {
            'filename': path.name,
            'decks': result_decks,
            'total_cards': total_cards,
            'media_count': extracted_media_count,
            'warnings': warnings
        }

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
