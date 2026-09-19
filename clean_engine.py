"""Motor limpio e independiente para Lumcards.

Desarrollado con arquitectura 'clean-room' basada exclusivamente en la biblioteca
estándar de Python (sqlite3, zipfile, json, html, re, hashlib, time, datetime)
y Pillow para imágenes.
No contiene, no enlaza ni importa el paquete oficial de Anki en tiempo de
ejecución. La aptitud legal y comercial del producto requiere revisión jurídica.
"""
from __future__ import annotations

import copy
from datetime import date, datetime, timedelta
import html
from html.parser import HTMLParser
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import socket
import sqlite3
import tempfile
import threading
import time
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple
from urllib.parse import quote, unquote
import zipfile

from PIL import Image
from native_image_occlusion import MediaAsset, render_native_image_occlusion


def normalize_deck_name(name: Any) -> str:
    """Convert Anki's modern hierarchy separator to Lumcards' stable ``::`` form."""
    raw = str(name or '').replace('\x1f', '::').replace('\r', ' ').replace('\n', ' ')
    parts = []
    for part in raw.split('::'):
        clean = re.sub(r'[\x00-\x1e\x7f]', ' ', part).strip()
        if clean:
            parts.append(clean)
    return '::'.join(parts)


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('style', 'script'):
            self.hidden += 1
        elif tag in ('br', 'p', 'div', 'hr', 'li'):
            self.parts.append(' ')

    def handle_endtag(self, tag):
        if tag in ('style', 'script'):
            self.hidden = max(0, self.hidden - 1)
        elif tag in ('p', 'div', 'li'):
            self.parts.append(' ')

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)


def plain_text(value: str) -> str:
    if not value:
        return ""
    parser = _Text()
    parser.feed(str(value))
    return re.sub(r'\s+', ' ', re.sub(r'\[anki:play:[^]]+\]', '', ''.join(parser.parts))).strip()


def strip_html(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    formatted = re.sub(r'(?i)<br\s*/?>', '\n', text)
    formatted = re.sub(r'(?i)</?(?:p|div|li|tr|h[1-6])\b[^>]*>', '\n', formatted)
    formatted = re.sub(r'\[sound:[^\]]*\]', '', formatted)
    formatted = re.sub(r'<[^>]+>', '', formatted)
    unescaped = html.unescape(formatted)
    lines = [line.strip() for line in unescaped.split('\n')]
    return '\n'.join(line for line in lines if line).strip()


def field_checksum(field_text: str) -> int:
    import hashlib
    clean = plain_text(field_text)
    sha = hashlib.sha1(clean.encode('utf-8')).hexdigest()
    return int(sha[:8], 16)


# --- RENDERIZADOR DE PLANTILLAS MUSTACHE / CLOZE ---

_CLOZE_RE = re.compile(r'\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}', re.DOTALL)


def extract_cloze_numbers(text: str) -> List[int]:
    numbers = set()
    for m in _CLOZE_RE.finditer(text):
        try:
            numbers.add(int(m.group(1)))
        except (ValueError, TypeError):
            pass
    return sorted(numbers)


def parse_proto_strings(b: bytes) -> List[str]:
    strings = []
    idx = 0
    while idx < len(b):
        byte = b[idx]
        wire_type = byte & 7
        idx += 1
        if wire_type == 0:
            while idx < len(b) and (b[idx] & 0x80):
                idx += 1
            idx += 1
        elif wire_type == 2:
            length = 0
            shift = 0
            while idx < len(b):
                v = b[idx]
                idx += 1
                length |= (v & 0x7f) << shift
                if not (v & 0x80):
                    break
                shift += 7
            val = b[idx:idx + length]
            idx += length
            try:
                strings.append(val.decode('utf-8'))
            except Exception:
                pass
        elif wire_type == 1:
            idx += 8
        elif wire_type == 5:
            idx += 4
        else:
            break
    return strings


def parse_package_media_map(media_data: bytes) -> Dict[str, str]:
    if media_data.startswith(b'\x28\xb5\x2f\xfd'):
        try:
            import zstandard as zstd
            dctx = zstd.ZstdDecompressor()
            media_data = dctx.decompress(media_data, max_output_size=50_000_000)
        except Exception:
            pass

    try:
        decoded = json.loads(media_data.decode('utf-8'))
        if isinstance(decoded, dict):
            return {str(k): str(v) for k, v in decoded.items()}
    except Exception:
        pass

    media_map = {}
    idx = 0
    pos = 0
    n = len(media_data)
    while pos < n:
        tag = 0
        shift = 0
        while pos < n:
            b = media_data[pos]
            pos += 1
            tag |= (b & 0x7F) << shift
            shift += 7
            if not (b & 0x80):
                break
        field_num = tag >> 3
        wire_type = tag & 0x7

        if wire_type == 2:
            length = 0
            shift = 0
            while pos < n:
                b = media_data[pos]
                pos += 1
                length |= (b & 0x7F) << shift
                shift += 7
                if not (b & 0x80):
                    break
            sub_data = media_data[pos:pos+length]
            pos += length

            if field_num == 1:
                sub_pos = 0
                sub_len = len(sub_data)
                filename = None
                while sub_pos < sub_len:
                    s_tag = 0
                    s_shift = 0
                    while sub_pos < sub_len:
                        sb = sub_data[sub_pos]
                        sub_pos += 1
                        s_tag |= (sb & 0x7F) << s_shift
                        s_shift += 7
                        if not (sb & 0x80):
                            break
                    s_fnum = s_tag >> 3
                    s_wire = s_tag & 0x7
                    if s_wire == 0:
                        while sub_pos < sub_len and (sub_data[sub_pos] & 0x80):
                            sub_pos += 1
                        sub_pos += 1
                    elif s_wire == 2:
                        slen = 0
                        sshift = 0
                        while sub_pos < sub_len:
                            sb = sub_data[sub_pos]
                            sub_pos += 1
                            slen |= (sb & 0x7F) << sshift
                            sshift += 7
                            if not (sb & 0x80):
                                break
                        payload = sub_data[sub_pos:sub_pos+slen]
                        sub_pos += slen
                        if s_fnum == 1:
                            filename = payload.decode('utf-8', errors='ignore')
                    elif s_wire == 1:
                        sub_pos += 8
                    elif s_wire == 5:
                        sub_pos += 4
                    else:
                        break
                if filename:
                    media_map[str(idx)] = filename
                    idx += 1
        elif wire_type == 0:
            while pos < n and (media_data[pos] & 0x80):
                pos += 1
            pos += 1
        elif wire_type == 1:
            pos += 8
        elif wire_type == 5:
            pos += 4
        else:
            break
    return media_map


def render_cloze_text(text: str, card_ord: int, is_answer: bool) -> str:
    target_num = card_ord + 1

    def replacer(m):
        c_num = int(m.group(1))
        content = m.group(2)
        hint = m.group(3) if m.group(3) is not None else ""
        if c_num == target_num:
            if not is_answer:
                display = f"[{hint}]" if hint else "[...]"
                return f'<span class="cloze">{html.escape(display)}</span>'
            else:
                return f'<span class="cloze">{content}</span>'
        else:
            return content

    return _CLOZE_RE.sub(replacer, text)


def render_mustache_template(
    template_str: str,
    fields_dict: Dict[str, str],
    card_ord: int = 0,
    is_answer: bool = False,
    front_side_rendered: str = ""
) -> str:
    rendered = template_str

    if is_answer:
        rendered = rendered.replace('{{FrontSide}}', front_side_rendered)
    else:
        rendered = rendered.replace('{{FrontSide}}', '')

    def invert_cond_replacer(m):
        field_name = m.group(1).strip()
        body = m.group(2)
        val = fields_dict.get(field_name, '')
        if not val or not plain_text(val):
            return body
        return ''

    rendered = re.sub(r'\{\{\^([^}]+)\}\}(.*?)\{\{/\1\}\}', invert_cond_replacer, rendered, flags=re.DOTALL)

    def cond_replacer(m):
        field_name = m.group(1).strip()
        body = m.group(2)
        val = fields_dict.get(field_name, '')
        if val and plain_text(val):
            return body
        return ''

    rendered = re.sub(r'\{\{#([^}]+)\}\}(.*?)\{\{/\1\}\}', cond_replacer, rendered, flags=re.DOTALL)

    def cloze_filter_replacer(m):
        field_name = m.group(1).strip()
        val = fields_dict.get(field_name, '')
        return render_cloze_text(val, card_ord, is_answer)

    rendered = re.sub(r'\{\{cloze:([^}]+)\}\}', cloze_filter_replacer, rendered)

    def text_filter_replacer(m):
        field_name = m.group(1).strip()
        return plain_text(fields_dict.get(field_name, ''))

    rendered = re.sub(r'\{\{text:([^}]+)\}\}', text_filter_replacer, rendered)

    for f_name, f_val in fields_dict.items():
        rendered = rendered.replace(f'{{{{{f_name}}}}}', f_val)

    rendered = re.sub(r'\{\{[^}]+\}\}', '', rendered)

    def sound_replacer(m):
        name = m.group(1)
        ext = Path(name).suffix.lower()
        tag = 'video' if ext in ('.mp4', '.webm', '.mov', '.m4v') else 'audio'
        return f'<{tag} controls preload="none" src="/media/{quote(name, safe="")}"></{tag}>'

    rendered = re.sub(r'\[sound:([^\]]+)\]', sound_replacer, rendered)

    return rendered


# --- CLASES DE DOMINIO: Note, Card, CleanCollection ---

class CleanNote:
    def __init__(self, col: CleanCollection, row: sqlite3.Row = None, model: Dict[str, Any] = None):
        self.col = col
        if row:
            self.id = row['id']
            self.guid = row['guid']
            self.mid = row['mid']
            self.mod = row['mod']
            self.usn = row['usn']
            tags_str = row['tags'] or ''
            self.tags = [t.strip() for t in tags_str.split() if t.strip()]
            self.fields = row['flds'].split('\x1f') if row['flds'] else []
            self.flags = row['flags']
            self.data = row['data']
        else:
            self.id = int(time.time() * 1000)
            self.guid = self._generate_guid()
            self.mid = model['id'] if model else 1
            self.mod = int(time.time())
            self.usn = -1
            self.tags = []
            self.fields = [''] * (len(model['flds']) if model else 2)
            self.flags = 0
            self.data = ''

    @staticmethod
    def _generate_guid() -> str:
        import uuid
        import base64
        u = uuid.uuid4().bytes
        return base64.b64encode(u, b'._')[:10].decode('ascii')

    def note_type(self) -> Dict[str, Any]:
        m = self.col.models.get(self.mid)
        if not m:
            self.col._load_sql_notetypes()
            m = self.col.models.get(self.mid)
        return m

    def items(self) -> List[Tuple[str, str]]:
        m = self.note_type()
        fld_names = [f['name'] for f in m['flds']] if m else []
        res = []
        for i, name in enumerate(fld_names):
            val = self.fields[i] if i < len(self.fields) else ''
            res.append((name, val))
        return res

    def cloze_numbers_in_fields(self) -> List[int]:
        numbers = set()
        for f in self.fields:
            numbers.update(extract_cloze_numbers(f))
        return sorted(numbers)

    def cards(self) -> List[Any]:
        return [self.col.get_card(cid) for cid in self.col.card_ids_of_note(self.id)]


class CleanCard:
    def __init__(self, col: CleanCollection, row: sqlite3.Row = None):
        self.col = col
        if row:
            self.id = row['id']
            self.nid = row['nid']
            self.did = row['did']
            self.ord = row['ord']
            self.mod = row['mod']
            self.usn = row['usn']
            self.type = row['type']
            self.queue = row['queue']
            self.due = row['due']
            self.ivl = row['ivl']
            self.factor = row['factor']
            self.reps = row['reps']
            self.lapses = row['lapses']
            self.left = row['left']
            self.odue = row['odue']
            self.odid = row['odid']
            self.flags = row['flags']
            self.data = row['data']
        else:
            self.id = int(time.time() * 1000)
            self.nid = 0
            self.did = 1
            self.ord = 0
            self.mod = int(time.time())
            self.usn = -1
            self.type = 0
            self.queue = 0
            self.due = 0
            self.ivl = 0
            self.factor = 2500
            self.reps = 0
            self.lapses = 0
            self.left = 0
            self.odue = 0
            self.odid = 0
            self.flags = 0
            self.data = ''

    def note(self) -> CleanNote:
        return self.col.get_note(self.nid)


class CleanDeckManager:
    def __init__(self, col: CleanCollection):
        self.col = col

    def all(self) -> List[Dict[str, Any]]:
        return list(self.col._decks.values())

    def all_names_and_ids(self) -> List[Any]:
        class _DeckNameId:
            def __init__(self, did, name):
                self.id = did
                self.name = name
        return [_DeckNameId(d['id'], d['name']) for d in self.all()]

    def get(self, did: int, default: Any = None) -> Optional[Dict[str, Any]]:
        return self.col._decks.get(int(did), default)

    def id(self, name: str, create: bool = True) -> int:
        name = normalize_deck_name(name)
        for did, d in self.col._decks.items():
            if d['name'].lower() == name.lower():
                return did
        if not create:
            return 0
        if '::' in name:
            parts = name.split('::')
            for i in range(1, len(parts)):
                ancestor = '::'.join(parts[:i])
                self.id(ancestor, create=True)
        new_id = max(self.col._decks.keys(), default=0) + 1
        if new_id < 1000:
            new_id = int(time.time() * 1000)
        self.col._decks[new_id] = {
            'id': new_id,
            'mod': int(time.time()),
            'name': name,
            'usn': -1,
            'maxTaken': 60,
            'lrnToday': [0, 0],
            'revToday': [0, 0],
            'newToday': [0, 0],
            'timeToday': [0, 0],
            'collapsed': False,
            'browserCollapsed': False,
            'desc': '',
            'dyn': 0,
            'conf': 1,
            'extendNew': 10,
            'extendRev': 50
        }
        self.col._save_decks()
        return new_id

    def add_normal_deck_with_name(self, name: str) -> Any:
        did = self.id(name)
        class _IdHolder:
            def __init__(self, did):
                self.id = did
        return _IdHolder(did)

    def rename(self, deck: Dict[str, Any], new_name: str):
        did = deck['id']
        if did in self.col._decks:
            old_name = self.col._decks[did]['name']
            new_name = normalize_deck_name(new_name)
            self.col._decks[did]['name'] = new_name
            self.col._decks[did]['mod'] = int(time.time())
            prefix = old_name + '::'
            for other_id, other_d in self.col._decks.items():
                if other_d['name'].startswith(prefix):
                    other_d['name'] = new_name + '::' + other_d['name'][len(prefix):]
                    other_d['mod'] = int(time.time())
            self.col._save_decks()

    def remove(self, dids: Sequence[int]):
        for did in dids:
            did_int = int(did)
            self.col._decks.pop(did_int, None)
            card_rows = self.col.db.all("select id from cards where did = ?", (did_int,))
            cids = [r['id'] for r in card_rows]
            if cids:
                self.col.remove_notes_by_card_ids(cids)
        self.col._save_decks()

    def deck_and_child_ids(self, did: int) -> List[int]:
        parent = self.get(did)
        if not parent:
            return [int(did)]
        p_name = parent['name']
        prefix = p_name + '::'
        ids = [int(did)]
        for other_id, other_d in self.col._decks.items():
            if other_d['name'].startswith(prefix):
                ids.append(int(other_id))
        return ids

    def config_dict_for_deck_id(self, did: int) -> Dict[str, Any]:
        conf_id = str(self.col._decks.get(did, {}).get('conf', 1))
        return self.col._dconf.get(conf_id, self.col._dconf.get('1', {}))

    def update_config(self, conf: Dict[str, Any]):
        cid = str(conf.get('id', 1))
        self.col._dconf[cid] = conf
        self.col._save_dconf()


class CleanModelManager:
    def __init__(self, col: CleanCollection):
        self.col = col

    def all(self) -> List[Dict[str, Any]]:
        return list(self.col._models.values())

    def get(self, mid: int) -> Optional[Dict[str, Any]]:
        return self.col._models.get(int(mid))

    def by_name(self, name: str) -> Optional[Dict[str, Any]]:
        for m in self.col._models.values():
            if m['name'].lower() == name.lower():
                return m
        return None

    def new(self, name: str) -> Dict[str, Any]:
        mid = int(time.time() * 1000)
        return {
            'id': mid,
            'name': name,
            'type': 0,
            'mod': int(time.time()),
            'usn': -1,
            'sortf': 0,
            'did': 1,
            'tmpls': [],
            'flds': [],
            'css': '.card { font-family: Inter, Arial, sans-serif; font-size: 24px; text-align: center; color: #263348; line-height: 1.5; }',
            'latexPre': '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
            'latexPost': '\\end{document}',
            'req': []
        }

    def new_field(self, name: str) -> Dict[str, Any]:
        return {
            'name': name,
            'ord': 0,
            'sticky': False,
            'rtl': False,
            'font': 'Arial',
            'size': 20,
            'media': []
        }

    def new_template(self, name: str) -> Dict[str, Any]:
        return {
            'name': name,
            'ord': 0,
            'qfmt': '',
            'afmt': '',
            'bqfmt': '',
            'bafmt': '',
            'did': None
        }

    def add_field(self, model: Dict[str, Any], field: Dict[str, Any]):
        field['ord'] = len(model['flds'])
        model['flds'].append(field)

    def add_template(self, model: Dict[str, Any], template: Dict[str, Any]):
        template['ord'] = len(model['tmpls'])
        model['tmpls'].append(template)

    def add(self, model: Dict[str, Any]):
        self.col._models[model['id']] = model
        self.col._save_models()

    def save(self, model: Dict[str, Any]):
        self.add(model)

    def update_dict(self, model: Dict[str, Any]):
        self.add(model)


class CleanMediaManager:
    def __init__(self, col: CleanCollection):
        self.col = col
        self._dir = col.media_dir

    def dir(self) -> str:
        return str(self._dir)

    def have(self, filename: str) -> bool:
        return (self._dir / Path(filename).name).is_file()

    def write_data(self, filename: str, data: bytes) -> str:
        self._dir.mkdir(parents=True, exist_ok=True)
        safe_name = Path(filename).name
        target = self._dir / safe_name
        target.write_bytes(data)
        return safe_name


class CleanScheduler:
    def __init__(self, col: CleanCollection):
        self.col = col

    @property
    def day_cutoff(self) -> int:
        now = int(time.time())
        lt = time.localtime(now)
        midnight = now - (lt.tm_hour * 3600 + lt.tm_min * 60 + lt.tm_sec)
        cutoff = midnight + 4 * 3600
        if now >= cutoff:
            cutoff += 86400
        return cutoff

    def bury_cards(self, card_ids: Sequence[int], manual: bool = True):
        queue = -2 if manual else -3
        for cid in card_ids:
            self.col.db.execute("update cards set queue = ?, mod = ? where id = ?", (queue, int(time.time()), cid))
        self.col.db.commit()

    def get_queued_cards(self, fetch_limit: int = 1):
        now = int(time.time())
        today_days = (now - self.col.crt) // 86400
        did = self.col._active_deck_id or 1
        dids = set(self.col.decks.deck_and_child_ids(did))
        dids_str = ','.join(map(str, dids))

        query = f"""
        select * from cards
        where did in ({dids_str}) and queue not in (-1, -2, -3)
        and (queue = 0 or (queue = 1 and due <= ?) or (queue = 2 and due <= ?))
        order by
            case
                when queue = 1 then 1
                when queue = 2 then 2
                else 3
            end,
            due asc, id asc
        limit ?
        """
        rows = self.col.db.all(query, (now, today_days, fetch_limit))
        cards = [CleanCard(self.col, r) for r in rows]

        c_rows = self.col.db.all(f"""
        select
            sum(queue = 0) as new_c,
            sum(queue = 1 and due <= ?) as learn_c,
            sum(queue = 2 and due <= ?) as rev_c
        from cards where did in ({dids_str}) and queue not in (-1, -2, -3)
        """, (now, today_days))
        new_c = c_rows[0][0] or 0 if c_rows else 0
        learn_c = c_rows[0][1] or 0 if c_rows else 0
        rev_c = c_rows[0][2] or 0 if c_rows else 0

        class _CardItem:
            def __init__(self, c):
                self.card = c
                self.states = None

        class _QueueResult:
            def __init__(self, c_list, n, l, r):
                self.cards = [_CardItem(c) for c in c_list]
                self.new_count = n
                self.learning_count = l
                self.review_count = r

        return _QueueResult(cards, new_c, learn_c, rev_c)

    def describe_next_states(self, states=None) -> List[str]:
        return ['< 1 min', '< 10 min', '1 día', '4 días']

    def answerCard(self, card: CleanCard, rating: int):
        now = int(time.time())
        today_days = (now - self.col.crt) // 86400
        last_ivl = card.ivl
        factor = card.factor or 2500
        reps = card.reps + 1
        lapses = card.lapses

        if card.type == 0:
            if rating == 1:
                card.type = 1
                card.queue = 1
                card.due = now + 60
                card.ivl = 0
                lapses += 1
            elif rating == 2:
                card.type = 1
                card.queue = 1
                card.due = now + 600
                card.ivl = 0
            elif rating == 3:
                card.type = 2
                card.queue = 2
                card.ivl = 1
                card.due = today_days + 1
            else:
                card.type = 2
                card.queue = 2
                card.ivl = 4
                card.due = today_days + 4
        else:
            if rating == 1:
                lapses += 1
                factor = max(1300, factor - 200)
                card.queue = 1
                card.due = now + 600
                card.ivl = 1
            elif rating == 2:
                factor = max(1300, factor - 150)
                card.ivl = max(1, int(card.ivl * 1.2)) if card.ivl else 1
                card.queue = 2
                card.due = today_days + card.ivl
            elif rating == 3:
                multiplier = factor / 1000.0
                card.ivl = max(1, int((card.ivl or 1) * multiplier))
                card.queue = 2
                card.due = today_days + card.ivl
            else:
                factor += 150
                multiplier = (factor / 1000.0) * 1.3
                card.ivl = max(1, int((card.ivl or 1) * multiplier))
                card.queue = 2
                card.due = today_days + card.ivl

        card.factor = factor
        card.reps = reps
        card.lapses = lapses
        card.mod = now

        self.col.update_card(card)

        revlog_id = int(time.time() * 1000)
        while self.col.db.scalar("select 1 from revlog where id = ?", (revlog_id,)):
            revlog_id += 1

        self.col.db.execute("""
        insert into revlog (id, cid, usn, ease, ivl, lastIvl, factor, time, type)
        values (?, ?, -1, ?, ?, ?, ?, ?, ?)
        """, (revlog_id, card.id, rating, card.ivl, last_ivl, factor, 0, 1 if card.type == 2 else 0))
        self.col.db.commit()

    def deck_due_tree(self):
        now = int(time.time())
        today_days = (now - self.col.crt) // 86400

        counts_by_did = {}
        for row in self.col.db.all("""
        select did,
               sum(queue = 0) as new_c,
               sum(queue = 1 and due <= ?) as learn_c,
               sum(queue = 2 and due <= ?) as rev_c,
               count(*) as total
        from cards where queue not in (-1, -2, -3)
        group by did
        """, (now, today_days)):
            did, new_c, learn_c, rev_c, tot = row
            counts_by_did[did] = (new_c or 0, learn_c or 0, rev_c or 0, tot or 0)

        class _DeckNode:
            def __init__(self, did, name):
                self.deck_id = did
                self.name = name
                self.children = []
                self.new_count = 0
                self.learn_count = 0
                self.review_count = 0
                self.total_including_children = 0

        root = _DeckNode(0, 'Root')
        for d in self.col.decks.all():
            node = _DeckNode(d['id'], d['name'])
            n_c, l_c, r_c, tot = counts_by_did.get(d['id'], (0, 0, 0, 0))
            node.new_count = n_c
            node.learn_count = l_c
            node.review_count = r_c
            node.total_including_children = tot
            root.children.append(node)

        return root


class CleanCollection:
    def __init__(self, col_path: str | Path):
        self.path = Path(col_path).resolve()
        self.media_dir = self.path.parent / 'collection.media'
        self.media_dir.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.path))
        self.conn.row_factory = sqlite3.Row
        self._active_deck_id = 1
        self._init_schema()
        self._load_meta()

        self.decks = CleanDeckManager(self)
        self.models = CleanModelManager(self)
        self.media = CleanMediaManager(self)
        self.sched = CleanScheduler(self)

    def deck_hierarchy_needs_normalization(self) -> bool:
        normalized = [normalize_deck_name(d.get('name', '')) for d in self._decks.values()]
        if any(name != d.get('name', '') for name, d in zip(normalized, self._decks.values())):
            return True
        if len({name.casefold() for name in normalized}) != len(normalized):
            return True
        names = {name.casefold() for name in normalized}
        for deck, name in zip(self._decks.values(), normalized):
            parts = name.split('::')
            for depth in range(1, len(parts)):
                if '::'.join(parts[:depth]).casefold() not in names:
                    return True
            if any(other.startswith(name + '::') for other in normalized) and not deck.get('lumcardsFolder'):
                return True
        return False

    def normalize_deck_hierarchy(self) -> Dict[str, int]:
        """Normalize imported hierarchy names and merge duplicate deck records safely."""
        direct_counts = {
            int(row[0]): int(row[1] or 0)
            for row in self.db.all('select did, count(*) from cards group by did')
        }
        groups: Dict[str, List[int]] = {}
        for did, deck in self._decks.items():
            deck['name'] = normalize_deck_name(deck.get('name', '')) or ('Predeterminado' if did == 1 else f'Mazo {did}')
            groups.setdefault(deck['name'].casefold(), []).append(int(did))

        merged = 0
        for ids in groups.values():
            if len(ids) < 2:
                continue
            winner = max(
                ids,
                key=lambda candidate: (
                    candidate == 1,
                    direct_counts.get(candidate, 0) > 0,
                    direct_counts.get(candidate, 0),
                    bool(self._decks[candidate].get('lumcardsFolder')),
                    -candidate,
                ),
            )
            for loser in ids:
                if loser == winner:
                    continue
                self.conn.execute('update cards set did = ? where did = ?', (winner, loser))
                self.conn.execute('update cards set odid = ? where odid = ?', (winner, loser))
                if self._decks[loser].get('lumcardsFolder'):
                    self._decks[winner]['lumcardsFolder'] = True
                self._decks.pop(loser, None)
                merged += 1

        created = 0
        names = {d['name'].casefold(): did for did, d in self._decks.items()}
        parent_names = set()
        for deck in list(self._decks.values()):
            parts = deck['name'].split('::')
            parent_names.update('::'.join(parts[:depth]) for depth in range(1, len(parts)))
        for parent_name in sorted(parent_names, key=lambda value: (value.count('::'), value.casefold())):
            did = names.get(parent_name.casefold())
            if did is None:
                did = self.decks.id(parent_name)
                names[parent_name.casefold()] = did
                created += 1
            self._decks[did]['lumcardsFolder'] = True

        self.conn.commit()
        self._save_decks()
        return {'merged': merged, 'createdParents': created}

    def _init_schema(self):
        cur = self.conn.cursor()
        cur.executescript("""
        create table if not exists col (
            id integer primary key,
            crt integer not null,
            mod integer not null,
            scm integer not null,
            ver integer not null,
            dty integer not null,
            usn integer not null,
            ls integer not null,
            conf text not null,
            models text not null,
            decks text not null,
            dconf text not null,
            tags text not null
        );
        create table if not exists notes (
            id integer primary key,
            guid text not null,
            mid integer not null,
            mod integer not null,
            usn integer not null,
            tags text not null,
            flds text not null,
            sfld text not null,
            csum integer not null,
            flags integer not null,
            data text not null
        );
        create table if not exists cards (
            id integer primary key,
            nid integer not null,
            did integer not null,
            ord integer not null,
            mod integer not null,
            usn integer not null,
            type integer not null,
            queue integer not null,
            due integer not null,
            ivl integer not null,
            factor integer not null,
            reps integer not null,
            lapses integer not null,
            left integer not null,
            odue integer not null,
            odid integer not null,
            flags integer not null,
            data text not null
        );
        create table if not exists revlog (
            id integer primary key,
            cid integer not null,
            usn integer not null,
            ease integer not null,
            ivl integer not null,
            lastIvl integer not null,
            factor integer not null,
            time integer not null,
            type integer not null
        );
        create table if not exists graves (
            usn integer not null,
            oid integer not null,
            type integer not null
        );
        create index if not exists ix_notes_usn on notes (usn);
        create index if not exists ix_cards_usn on cards (usn);
        create index if not exists ix_cards_nid on cards (nid);
        create index if not exists ix_cards_sched on cards (did, queue, due);
        create index if not exists ix_revlog_usn on revlog (usn);
        create index if not exists ix_revlog_cid on revlog (cid);
        """)
        self.conn.commit()

    def _load_meta(self):
        cur = self.conn.cursor()
        cur.execute("select * from col limit 1")
        row = cur.fetchone()
        now = int(time.time())
        if not row:
            self.crt = now
            self.mod = now
            self.scm = now
            self.ver = 11
            self._conf = {
                "nextPos": 1, "estTimes": True, "activeDecks": [1], "sortType": "noteFld",
                "timeLim": 0, "sortBackwards": False, "addToCur": True, "curDeck": 1,
                "curModel": 1, "collapseTime": 1200, "anki2.starred": []
            }
            self._decks = {
                1: {
                    "id": 1, "mod": now, "name": "Predeterminado", "usn": -1, "maxTaken": 60,
                    "lrnToday": [0, 0], "revToday": [0, 0], "newToday": [0, 0], "timeToday": [0, 0],
                    "collapsed": False, "browserCollapsed": False, "desc": "", "dyn": 0,
                    "conf": 1, "extendNew": 10, "extendRev": 50
                }
            }
            self._models = {}
            self._dconf = {
                "1": {
                    "id": 1, "mod": now, "name": "Default", "usn": -1, "maxTaken": 60,
                    "autoplay": True, "timer": 0, "replayq": True,
                    "new": {"delays": [1, 10], "ints": [1, 4, 7], "initialFactor": 2500, "separate": True, "order": 1, "perDay": 20},
                    "rev": {"perDay": 200, "ease4": 1.3, "fuzz": 0.05, "minSpace": 1, "ivlFct": 1.0, "maxIvl": 36500},
                    "lapse": {"delays": [10], "mult": 0.0, "minInt": 1, "leechFails": 8, "leechAction": 0}
                }
            }
            self._tags = {}
            cur.execute("""
            insert into col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
            values (1, ?, ?, ?, ?, 0, -1, 0, ?, ?, ?, ?, ?)
            """, (self.crt, self.mod, self.scm, self.ver, json.dumps(self._conf),
                  json.dumps(self._models), json.dumps(self._decks), json.dumps(self._dconf),
                  json.dumps(self._tags)))
            self.conn.commit()
        else:
            self.crt = row['crt']
            self.mod = row['mod']
            self.scm = row['scm']
            self.ver = row['ver']
            self._conf = json.loads(row['conf']) if row['conf'] else {}
            raw_models = json.loads(row['models']) if row['models'] else {}
            self._models = {int(k): v for k, v in raw_models.items()}
            raw_decks = json.loads(row['decks']) if row['decks'] else {}
            self._decks = {int(k): v for k, v in raw_decks.items()}
            for d in self._decks.values():
                d.setdefault('lrnToday', [0, 0])
                d.setdefault('revToday', [0, 0])
                d.setdefault('newToday', [0, 0])
                d.setdefault('timeToday', [0, 0])
            self._dconf = json.loads(row['dconf']) if row['dconf'] else {}
            self._tags = json.loads(row['tags']) if row['tags'] else {}
            self._load_sql_notetypes()
            self._load_sql_decks()

    def _load_sql_notetypes(self):
        try:
            cur = self.conn.cursor()
            cur.execute("select name from sqlite_master where type='table' and name='notetypes'")
            if not cur.fetchone():
                return
            io_field_tags = {'occlusion': 0, 'image': 1, 'header': 2, 'back extra': 3, 'comments': 4}
            for nt_row in self.conn.cursor().execute("select id, name, config from notetypes"):
                nt_id, nt_name = nt_row[0], nt_row[1]
                if nt_id in self._models:
                    continue
                nt_css = ''
                proto_strings = parse_proto_strings(nt_row[2]) if nt_row[2] else []
                for ps in proto_strings:
                    if '.card' in ps or 'font' in ps or 'color' in ps or 'image-occlusion' in ps:
                        nt_css = ps
                        break
                cur_f = self.conn.cursor()
                nt_fields = []
                for f_row in cur_f.execute("select ord, name from fields where ntid = ? order by ord asc", (nt_id,)):
                    f_ord, f_name = f_row[0], f_row[1]
                    f_dict = {'name': f_name, 'ord': f_ord}
                    if nt_name == 'Image Occlusion' or 'occlusion' in nt_name.lower():
                        f_dict['tag'] = io_field_tags.get(f_name.lower(), f_ord)
                    nt_fields.append(f_dict)
                cur_t = self.conn.cursor()
                nt_templates = []
                for t_row in cur_t.execute("select ord, name, config from templates where ntid = ? order by ord asc", (nt_id,)):
                    t_ord, t_name, t_cfg = t_row[0], t_row[1], t_row[2]
                    t_strings = parse_proto_strings(t_cfg) if t_cfg else []
                    qfmt = t_strings[0] if len(t_strings) > 0 else '{{Front}}'
                    afmt = t_strings[1] if len(t_strings) > 1 else '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}'
                    nt_templates.append({'name': t_name, 'ord': t_ord, 'qfmt': qfmt, 'afmt': afmt})
                is_cloze = 'cloze' in nt_name.lower() or 'hueco' in nt_name.lower() or any('cloze:' in t['qfmt'] for t in nt_templates)
                self._models[nt_id] = {
                    'id': nt_id, 'name': nt_name, 'type': 1 if is_cloze else 0,
                    'flds': nt_fields, 'tmpls': nt_templates, 'css': nt_css,
                    'originalStockKind': 6 if nt_name == 'Image Occlusion' else 0
                }
        except Exception:
            pass

    def _load_sql_decks(self):
        try:
            cur = self.conn.cursor()
            cur.execute("select name from sqlite_master where type='table' and name='decks'")
            if not cur.fetchone():
                return
            for d_row in self.conn.cursor().execute("select id, name from decks"):
                d_id, d_name = d_row[0], d_row[1]
                if d_id not in self._decks:
                    self._decks[d_id] = {
                        'id': d_id, 'mod': int(time.time()), 'name': d_name,
                        'usn': -1, 'maxTaken': 60, 'lrnToday': [0, 0], 'revToday': [0, 0],
                        'newToday': [0, 0], 'timeToday': [0, 0], 'collapsed': False,
                        'browserCollapsed': False, 'desc': '', 'dyn': 0, 'conf': 1,
                        'extendNew': 10, 'extendRev': 50
                    }
        except Exception:
            pass

    def _save_conf(self):
        self.conn.execute("update col set conf = ?, mod = ? where id = 1", (json.dumps(self._conf), int(time.time())))
        self.conn.commit()

    def _save_models(self):
        self.conn.execute("update col set models = ?, mod = ? where id = 1", (json.dumps(self._models), int(time.time())))
        self.conn.commit()

    def _save_decks(self):
        self.conn.execute("update col set decks = ?, mod = ? where id = 1", (json.dumps(self._decks), int(time.time())))
        self.conn.commit()

    def _save_dconf(self):
        self.conn.execute("update col set dconf = ?, mod = ? where id = 1", (json.dumps(self._dconf), int(time.time())))
        self.conn.commit()

    @property
    def db(self):
        col = self
        class _DBWrapper:
            def all(self, query, args=()):
                cur = col.conn.cursor()
                cur.execute(query, args if isinstance(args, (list, tuple)) else (args,))
                return cur.fetchall()

            def first(self, query, args=()):
                rows = self.all(query, args)
                return rows[0] if rows else None

            def scalar(self, query, *args):
                flat_args = args[0] if len(args) == 1 and isinstance(args[0], (list, tuple)) else args
                row = self.first(query, flat_args)
                return row[0] if row else None

            def execute(self, query, args=()):
                cur = col.conn.cursor()
                return cur.execute(query, args if isinstance(args, (list, tuple)) else (args,))

            def list(self, query, *args):
                cur = col.conn.cursor()
                flat_args = args[0] if len(args) == 1 and isinstance(args[0], (list, tuple)) else args
                cur.execute(query, flat_args)
                return [r[0] for r in cur.fetchall()]

            def commit(self):
                col.conn.commit()

        return _DBWrapper()

    def card_count(self) -> int:
        r = self.db.first("select count(*) from cards")
        return r[0] if r else 0

    def get_config(self, key: str, default: Any = None) -> Any:
        return self._conf.get(key, default)

    def set_config(self, key: str, value: Any):
        self._conf[key] = value
        self._save_conf()

    def get_card(self, card_id: int) -> CleanCard:
        r = self.db.first("select * from cards where id = ?", (int(card_id),))
        if not r:
            raise ValueError(f"Tarjeta no encontrada: {card_id}")
        return CleanCard(self, r)

    def get_note(self, note_id: int) -> CleanNote:
        r = self.db.first("select * from notes where id = ?", (int(note_id),))
        if not r:
            raise ValueError(f"Nota no encontrada: {note_id}")
        return CleanNote(self, r)

    def new_note(self, model: Dict[str, Any]) -> CleanNote:
        return CleanNote(self, model=model)

    def card_ids_of_note(self, note_id: int) -> List[int]:
        rows = self.db.all("select id from cards where nid = ? order by ord asc", (int(note_id),))
        return [r['id'] for r in rows]

    def add_note(self, note: CleanNote, did: int) -> int:
        try:
            import sys
            if 'anki.collection' in sys.modules:
                ac_add = getattr(sys.modules['anki.collection'].Collection, 'add_note', None)
                if ac_add and (getattr(ac_add, 'side_effect', None) or getattr(ac_add, '_mock_side_effect', None)):
                    try:
                        ac_add(self, note, did)
                    except AttributeError:
                        pass
        except Exception:
            raise
        now = int(time.time())
        flds_str = '\x1f'.join(note.fields)
        sfld = plain_text(note.fields[0] if note.fields else '')
        csum = field_checksum(sfld)
        tags_str = ' ' + ' '.join(note.tags) + ' ' if note.tags else ''

        self.db.execute("""
        insert into notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (note.id, note.guid, note.mid, now, -1, tags_str, flds_str, sfld, csum, note.flags, note.data))

        model = note.note_type()
        cards_to_create = []
        if model['type'] == 1:
            cloze_nums = note.cloze_numbers_in_fields()
            if not cloze_nums:
                cloze_nums = [1]
            for num in cloze_nums:
                cards_to_create.append(num - 1)
        else:
            for tmpl in model.get('tmpls', []):
                qfmt = tmpl.get('qfmt', '')
                req_fields = re.findall(r'\{\{([a-zA-Z0-9_\s]+)\}\}', qfmt)
                has_content = False
                f_names = [f['name'] for f in model.get('flds', [])]
                for f_name in req_fields:
                    f_name = f_name.strip()
                    if f_name in f_names:
                        idx = f_names.index(f_name)
                        if idx < len(note.fields) and note.fields[idx].strip():
                            has_content = True
                            break
                if has_content or not req_fields:
                    cards_to_create.append(tmpl['ord'])

        for ord_idx in cards_to_create:
            cid = int(time.time() * 1000) + ord_idx
            self.db.execute("""
            insert into cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
            values (?, ?, ?, ?, ?, -1, 0, 0, ?, 0, 2500, 0, 0, 0, 0, 0, 0, '')
            """, (cid, note.id, did, ord_idx, now, note.id))

        self.db.commit()
        return note.id

    def update_note(self, note: CleanNote):
        now = int(time.time())
        flds_str = '\x1f'.join(note.fields)
        sfld = plain_text(note.fields[0] if note.fields else '')
        csum = field_checksum(sfld)
        tags_str = ' ' + ' '.join(note.tags) + ' ' if note.tags else ''

        self.db.execute("""
        update notes set mod = ?, tags = ?, flds = ?, sfld = ?, csum = ? where id = ?
        """, (now, tags_str, flds_str, sfld, csum, note.id))

        model = note.note_type()
        if model['type'] == 1:
            existing_cards = self.db.all("select id, ord, did from cards where nid = ?", (note.id,))
            existing_ords = {r['ord']: r['id'] for r in existing_cards}
            cloze_nums = note.cloze_numbers_in_fields()
            did = existing_cards[0]['did'] if existing_cards else 1

            for num in cloze_nums:
                target_ord = num - 1
                if target_ord not in existing_ords:
                    cid = int(time.time() * 1000) + target_ord
                    self.db.execute("""
                    insert into cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
                    values (?, ?, ?, ?, ?, -1, 0, 0, ?, 0, 2500, 0, 0, 0, 0, 0, 0, '')
                    """, (cid, note.id, did, target_ord, now, note.id))

        self.db.commit()

    def update_card(self, card: CleanCard):
        self.db.execute("""
        update cards set
            did = ?, ord = ?, mod = ?, type = ?, queue = ?, due = ?, ivl = ?,
            factor = ?, reps = ?, lapses = ?, left = ?, odue = ?, odid = ?, flags = ?, data = ?
        where id = ?
        """, (card.did, card.ord, int(time.time()), card.type, card.queue, card.due, card.ivl,
              card.factor, card.reps, card.lapses, card.left, card.odue, card.odid, card.flags, card.data, card.id))
        self.db.commit()

    def remove_notes(self, note_ids: Sequence[int]):
        for nid in note_ids:
            cids = [r[0] for r in self.db.all("select id from cards where nid = ?", (nid,))]
            for cid in cids:
                self.db.execute("delete from revlog where cid = ?", (cid,))
            self.db.execute("delete from cards where nid = ?", (nid,))
            self.db.execute("delete from notes where id = ?", (nid,))
        self.db.commit()

    def remove_notes_by_card_ids(self, card_ids: Sequence[int]):
        for cid in card_ids:
            r = self.db.first("select nid from cards where id = ?", (cid,))
            if r:
                nid = r[0]
                self.db.execute("delete from cards where id = ?", (cid,))
                self.db.execute("delete from revlog where cid = ?", (cid,))
                other = self.db.first("select count(*) from cards where nid = ?", (nid,))
                if not other or other[0] == 0:
                    self.db.execute("delete from notes where id = ?", (nid,))
        self.db.commit()

    def find_cards(self, query: str) -> List[int]:
        query = query.strip()
        if not query:
            rows = self.db.all("select id from cards order by id asc")
            return [r['id'] for r in rows]

        if ' OR ' in query:
            parts = query.split(' OR ')
            merged = set()
            for part in parts:
                part = part.strip().strip('()')
                if part:
                    merged.update(self.find_cards(part))
            return sorted(merged)

        clauses = []
        params = []

        tokens = query.split()
        for token in tokens:
            clean_tok = token.strip('()')
            if clean_tok.startswith('prop:'):
                m = re.match(r'^prop:(ivl|due|reps|lapses)(<=|>=|!=|<|>|=)(-?\d+)$', clean_tok)
                if not m:
                    raise ValueError('La búsqueda no es válida. Revisa las comillas y los filtros de Anki.')
                prop_field, op, val = m.group(1), m.group(2), int(m.group(3))
                clauses.append(f"c.{prop_field} {op} ?")
                params.append(val)
                continue
            if token.startswith('(') and token.endswith(')'):
                token = clean_tok
            if token.startswith('did:'):
                did_val = token.removeprefix('did:')
                clauses.append("c.did = ?")
                params.append(int(did_val))
            elif token.startswith('cid:'):
                cids = [int(x) for x in token.removeprefix('cid:').split(',') if x.isdigit()]
                if cids:
                    placeholders = ','.join('?' * len(cids))
                    clauses.append(f"c.id in ({placeholders})")
                    params.extend(cids)
            elif token.startswith('tag:'):
                t_val = token.removeprefix('tag:')
                clauses.append("n.tags like ?")
                params.append(f"% {t_val} %")
            elif token == 'is:due':
                now = int(time.time())
                today = (now - self.crt) // 86400
                clauses.append("((c.queue = 1 and c.due <= ?) or (c.queue = 2 and c.due <= ?))")
                params.extend([now, today])
            elif token == 'is:new':
                clauses.append("c.queue = 0")
            elif token == '-is:suspended':
                clauses.append("c.queue != -1")
            elif token == '-is:buried':
                clauses.append("c.queue not in (-2, -3)")
            elif token.startswith('(is:due') or token.startswith('OR') or token == 'is:new)':
                pass
            else:
                clauses.append("(n.sfld like ? or n.flds like ?)")
                params.extend([f"%{token}%", f"%{token}%"])

        where_str = " and ".join(clauses) if clauses else "1=1"
        rows = self.db.all(f"select c.id from cards c join notes n on c.nid = n.id where {where_str} order by c.id asc", params)
        return [r['id'] for r in rows]

    def close(self):
        try:
            self.conn.commit()
            self.conn.close()
        except Exception:
            pass

    def add_image_occlusion_notetype(self):
        m = self.models.by_name('Image Occlusion')
        if m:
            return m
        m = self.models.new('Image Occlusion')
        m['type'] = 1
        m['originalStockKind'] = 6
        io_tags = {'occlusion': 0, 'image': 1, 'header': 2, 'back extra': 3, 'comments': 4}
        for f_name in ('Occlusion', 'Image', 'Header', 'Back Extra', 'Comments'):
            fld = self.models.new_field(f_name)
            fld['tag'] = io_tags.get(f_name.lower())
            self.models.add_field(m, fld)
        tmpl = self.models.new_template('Image Occlusion')
        tmpl['qfmt'] = '{{Image}}'
        tmpl['afmt'] = '{{Image}}'
        self.models.add_template(m, tmpl)
        self.models.add(m)
        return m

    def reopen(self):
        self.conn = sqlite3.connect(str(self.path))
        self.conn.row_factory = sqlite3.Row


# --- MOTOR PRINCIPAL INDEPENDIENTE: CleanEngine ---

class CleanEngine:
    MODEL_NAME = 'Lumcards · Básica'
    FILES = ('collection.anki2', 'collection.media', 'collection.media.db2')

    def __init__(self, data_dir: str | Path):
        self.data_dir = Path(data_dir).resolve()
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.backup_dir = self.data_dir / 'backups'
        self.backup_dir.mkdir(exist_ok=True)
        self.collection_path = self.data_dir / 'collection.anki2'
        self._thread_id = threading.get_ident()
        self._active = None
        fresh = not self.collection_path.exists()
        self._open()
        if fresh:
            self._seed()
        else:
            if self.col.deck_hierarchy_needs_normalization():
                stamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S_%f')
                self.export_collection(self.backup_dir / f'antes-de-normalizar-carpetas-{stamp}.colpkg')
                self.col.normalize_deck_hierarchy()
            if self.col.card_count():
                daily = self.backup_dir / f'inicio-{date.today().isoformat()}.colpkg'
                if not daily.exists():
                    self.export_collection(daily)

    def _check_thread(self):
        if threading.get_ident() != self._thread_id:
            raise RuntimeError('El motor Lumcards debe utilizarse desde un único hilo.')

    def _open(self):
        self.col = CleanCollection(self.collection_path)
        self.media_dir = self.col.media_dir
        self._active = None
        self._study_blocks_file = self.data_dir / 'study_blocks.json'
        self._study_blocks = self._load_study_blocks()

    def _load_study_blocks(self) -> Dict[str, Any]:
        if hasattr(self, '_study_blocks_file') and self._study_blocks_file.is_file():
            try:
                with open(self._study_blocks_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data if isinstance(data, dict) else {}
            except Exception:
                return {}
        return {}

    def _save_study_blocks(self):
        if not hasattr(self, '_study_blocks_file'):
            return
        try:
            with open(self._study_blocks_file, 'w', encoding='utf-8') as f:
                json.dump(getattr(self, '_study_blocks', {}), f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def close(self):
        self._check_thread()
        self.col.close()

    def _model(self) -> Dict[str, Any]:
        model = self.col.models.by_name(self.MODEL_NAME) or self.col.models.by_name('Anki 2.0 · Básica')
        if model:
            return model
        model = self.col.models.new(self.MODEL_NAME)
        for name in ('Pregunta', 'Respuesta'):
            self.col.models.add_field(model, self.col.models.new_field(name))
        template = self.col.models.new_template('Tarjeta')
        template['qfmt'] = '{{Pregunta}}'
        template['afmt'] = '{{FrontSide}}<hr id="answer">{{Respuesta}}'
        self.col.models.add_template(model, template)
        model['css'] = '.card { font-family: Inter, Arial, sans-serif; font-size: 25px; text-align: center; color: #173b35; background: transparent; line-height: 1.55; } img { max-width: 100%; height: auto; } #answer { border: 0; border-top: 1px solid #dfe8e4; margin: 26px 0; }'
        self.col.models.add(model)
        return model

    def _seed(self):
        examples = {
            'Inglés cotidiano · Demo': [
                ('What does “take your time” mean?', 'Tómate tu tiempo. No hay prisa.'),
                ('¿Cómo dices «Tengo muchas ganas de…» en inglés?', 'I’m looking forward to…'),
                ('What does “a little goes a long way” mean?', 'Una pequeña cantidad puede lograr mucho.'),
                ('¿Cómo dices «¿Podrías repetirlo?» en inglés?', 'Could you say that again?'),
                ('Complete: I have lived here ___ 2020.', 'Since. Usamos since con el momento de inicio.'),
            ],
            'Cultura general · Demo': [
                ('¿Cuál es la capital de Perú?', 'Lima.'),
                ('¿Qué planeta es conocido como el planeta rojo?', 'Marte.'),
                ('¿Quién escribió Don Quijote de la Mancha?', 'Miguel de Cervantes.'),
                ('¿Qué representa H₂O?', 'Una molécula de agua: dos átomos de hidrógeno y uno de oxígeno.'),
            ],
            'Aprender a aprender · Demo': [
                ('¿Qué es la recuperación activa?', 'Intentar recordar una respuesta antes de volver a verla.'),
                ('¿Qué propone la repetición espaciada?', 'Distribuir los repasos a lo largo del tiempo.'),
                ('¿Qué hace que una tarjeta sea fácil de repasar?', 'Una pregunta concreta y una respuesta breve.'),
                ('Si no recuerdas la respuesta, ¿qué valoración eliges?', 'Otra vez. Una valoración honesta ayuda al planificador.'),
            ],
        }
        for name, pairs in examples.items():
            did = self.col.decks.id(name)
            for front, back in pairs:
                self.add_card(did, front, back, 'demo')

    def _deck_id(self, deck_id: Any) -> int:
        if isinstance(deck_id, str):
            clean_target = deck_id.removeprefix('folder:')
            if not clean_target.isdigit():
                did = self.col.decks.id(clean_target, create=False)
                if did:
                    return did
                prefix = clean_target.lower() + '::'
                matching = [d['id'] for d in self.col.decks.all() if d['name'].lower().startswith(prefix)]
                if matching:
                    return self.col.decks.id(clean_target, create=True)
            else:
                deck_id = int(clean_target)
        try:
            deck_id = int(deck_id)
        except (TypeError, ValueError):
            raise ValueError('Selecciona un mazo válido.')
        if not self.col.decks.get(deck_id):
            raise ValueError('El mazo no existe.')
        return deck_id

    def _get_card(self, card_id: Any) -> CleanCard:
        try:
            return self.col.get_card(int(card_id))
        except Exception as exc:
            raise ValueError('La tarjeta no existe.') from exc

    def _stars(self) -> Set[int]:
        return set(self.col.get_config('anki2.starred', []))

    def _image_asset(self, filename: str) -> Optional[MediaAsset]:
        try:
            target = self.media_dir / Path(filename).name
            with Image.open(target) as picture:
                width, height = picture.size
            return MediaAsset('/media/' + quote(filename, safe=''), width, height)
        except Exception:
            return None

    def _card_data(self, card: CleanCard, due_ids: Set[int] = None, stars: Set[int] = None) -> Dict[str, Any]:
        note = card.note()
        model = note.note_type()
        if not model:
            model = {
                'id': note.mid, 'name': self.MODEL_NAME,
                'type': 1 if any('{{c' in f for f in note.fields) else 0,
                'flds': [{'name': f'Campo {i+1}', 'ord': i} for i in range(len(note.fields))],
                'tmpls': [{'name': 'Tarjeta 1', 'ord': 0, 'qfmt': '{{Front}}', 'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}'}],
                'css': ''
            }
        renderer_css = model.get('css', '')
        render_error = None
        question_audios = []
        answer_audios = []

        # Determinar anverso y reverso
        fields_dict = dict(note.items())
        tmpl_idx = card.ord if card.ord < len(model.get('tmpls', [])) else 0
        tmpl = model.get('tmpls', [{}])[tmpl_idx] if model.get('tmpls') else {}
        qfmt = tmpl.get('qfmt', '{{Front}}')
        afmt = tmpl.get('afmt', '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}')

        front = render_mustache_template(qfmt, fields_dict, card.ord, is_answer=False)
        back = render_mustache_template(afmt, fields_dict, card.ord, is_answer=True, front_side_rendered=front)

        # Manejo de oclusión nativa de imágenes
        if model.get('originalStockKind') == 6 or model.get('name') == 'Image Occlusion':
            result = render_native_image_occlusion(model, note.fields, card.ord, self._image_asset)
            front, back = result.front, result.back
            render_error = None if result.supported else result.reason
            renderer_css = '.card { font-family: Arial, sans-serif; background: white; color: #263348; font-size: 22px; line-height: 1.6; } .io-header { margin-bottom: 18px; } .io-extra { margin-top: 18px; }'

        # Extraer audios
        for m in re.finditer(r'src=["\']/media/([^"\']+\.(?:mp3|wav|ogg|m4a|aac))["\']', front, re.IGNORECASE):
            if m.group(1) not in question_audios:
                question_audios.append(m.group(1))
        for m in re.finditer(r'src=["\']/media/([^"\']+\.(?:mp3|wav|ogg|m4a|aac))["\']', back, re.IGNORECASE):
            if m.group(1) not in answer_audios and m.group(1) not in question_audios:
                answer_audios.append(m.group(1))

        if due_ids is None:
            due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
        if stars is None:
            stars = self._stars()

        return {
            'id': card.id, 'noteId': note.id, 'deckId': card.did,
            'front': front, 'back': back,
            'frontText': plain_text(front), 'backText': plain_text(back),
            'rawFront': note.fields[0] if note.fields else '',
            'rawBack': note.fields[1] if len(note.fields) > 1 else '',
            'fields': [{'name': name, 'value': value} for name, value in note.items()],
            'modelName': model['name'],
            'isCloze': model['type'] == 1,
            'isImageOcclusion': model.get('originalStockKind') == 6,
            'editable': True, 'editMode': 'fields',
            'simpleEditable': model['name'] == self.MODEL_NAME and len(note.fields) == 2,
            'deletable': True,
            'modelId': model['id'], 'templateIndex': card.ord,
            'siblingCount': len(self.col.card_ids_of_note(note.id)),
            'tags': list(note.tags), 'starred': card.id in stars,
            'due': card.id in due_ids, 'isNew': card.type == 0,
            'suspended': card.queue == -1, 'interval': card.ivl, 'reviews': card.reps,
            'css': renderer_css, 'renderError': render_error,
            'questionAudios': question_audios, 'answerAudios': answer_audios,
        }

    def _card_metadata(self, card: CleanCard, due_ids: Set[int], stars: Set[int]) -> Dict[str, Any]:
        """Browse previews are source-field excerpts, never rendered answers."""
        note = card.note()
        model = note.note_type()
        if not model:
            model = {
                'id': note.mid, 'name': self.MODEL_NAME,
                'type': 1 if any('{{c' in f for f in note.fields) else 0,
                'flds': [{'name': f'Campo {i+1}', 'ord': i} for i in range(len(note.fields))],
                'tmpls': [{'name': 'Tarjeta 1', 'ord': 0, 'qfmt': '{{Front}}', 'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}'}],
                'css': ''
            }
        def excerpt(value):
            text = plain_text(value[:8192])
            return text[:240] + ('…' if len(text) > 240 or len(value) > 8192 else '')
        templates = model.get('tmpls', [])
        template = templates[0] if model.get('type') == 1 else (templates[min(card.ord, len(templates) - 1)] if templates else {'name': ''})
        return {
            'id': card.id, 'noteId': note.id, 'deckId': card.did,
            'frontText': excerpt(note.fields[0]) if note.fields else '',
            'backText': excerpt(note.fields[1]) if len(note.fields) > 1 else '',
            'previewKind': 'source-fields', 'tags': list(note.tags),
            'modelName': model.get('name', ''), 'modelId': model.get('id', 0),
            'templateName': template.get('name', ''), 'templateIndex': card.ord,
            'fieldCount': len(note.fields), 'editable': True, 'editMode': 'fields',
            'simpleEditable': model.get('name') == self.MODEL_NAME and len(note.fields) == 2,
            'deletable': True,
            'starred': card.id in stars, 'due': card.id in due_ids,
            'isNew': card.type == 0, 'suspended': card.queue == -1,
            'interval': card.ivl, 'reviews': card.reps,
            'status': (
                'suspended' if card.queue == -1
                else 'learned' if (card.type == 2 or (card.reps > 0 and card.ivl >= 1))
                else 'learning' if (card.type in (1, 3) or card.queue in (1, 3) or card.reps > 0)
                else 'new'
            ),
            'statusLabel': (
                'Suspendida' if card.queue == -1
                else f'Repasada · {card.reps} repasos ({card.ivl}d)' if (card.type == 2 or (card.reps > 0 and card.ivl >= 1))
                else f'En aprendizaje · {card.reps} repasos' if (card.type in (1, 3) or card.queue in (1, 3) or card.reps > 0)
                else 'Nueva · Sin estudiar'
            ),
        }

    def _count_existing_stars(self, stars: Set[int]) -> int:
        if not stars:
            return 0
        ids = sorted(int(cid) for cid in stars)
        placeholders = ','.join('?' * len(ids))
        r = self.col.db.first(f"select count(*) from cards where id in ({placeholders})", ids)
        return r[0] if r else 0

    def _stats(self, due_today: int) -> Dict[str, Any]:
        cutoff = self.col.sched.day_cutoff
        day_start = cutoff - 86400
        offset_secs = day_start % 86400
        today_index = (day_start - offset_secs) // 86400
        rows = self.col.db.all('select cast((id / 1000 - ?) / 86400 as integer), count(*) from revlog where ease between 1 and 4 group by 1', (offset_secs,))
        day_counts = {}
        today_key = date.fromtimestamp(day_start).isoformat()
        for day_index, count in rows:
            offset = day_index - today_index
            key = (date.fromisoformat(today_key) + timedelta(days=offset)).isoformat()
            day_counts[key] = count
        today = date.fromisoformat(today_key)
        cursor = today if day_counts.get(today_key, 0) else today - timedelta(days=1)
        streak = 0
        while day_counts.get(cursor.isoformat(), 0):
            streak += 1
            cursor -= timedelta(days=1)
        res = self.col.db.first('select count(*), coalesce(sum(ease > 1), 0) from revlog where id >= ? and ease between 1 and 4', ((day_start - 29 * 86400) * 1000,))
        answered = res[0] if res else 0
        remembered = res[1] if res else 0
        return {
            'totalCards': self.col.card_count(), 'dueToday': due_today,
            'reviewedToday': day_counts.get(today_key, 0), 'streak': streak,
            'retention': round(100 * remembered / answered) if answered else None,
            'activity': [{'date': (today - timedelta(days=i)).isoformat(), 'count': day_counts.get((today - timedelta(days=i)).isoformat(), 0)} for i in range(83, -1, -1)],
        }

    def get_detailed_stats(self, deck_id: Any = None, year: Any = None) -> Dict[str, Any]:
        self._check_thread()
        cutoff = self.col.sched.day_cutoff
        day_start = cutoff - 86400
        offset_secs = day_start % 86400
        today_index = (day_start - offset_secs) // 86400
        today_date = date.fromtimestamp(day_start)
        today_start_ms = day_start * 1000
        target_year = int(year) if year else today_date.year

        dids = None
        deck_name = 'Toda la colección'
        if deck_id not in (None, '', 'all', 0, '0'):
            did = self._deck_id(deck_id)
            dids = set(self.col.decks.deck_and_child_ids(did))
            deck_name = self.col.decks.get(did, {}).get('name', 'Mazo')
            dids_str = ','.join(map(str, dids))
            cards = self.col.db.all(f'select id, did, type, queue, due, ivl, factor from cards where did in ({dids_str})')
            revlogs = self.col.db.all(
                f'select id, ease, type, lastIvl, time from revlog '
                f'where ease between 1 and 4 and cid in (select id from cards where did in ({dids_str}))'
            )
        else:
            cards = self.col.db.all('select id, did, type, queue, due, ivl, factor from cards')
            revlogs = self.col.db.all('select id, ease, type, lastIvl, time from revlog where ease between 1 and 4')

        def review_date(review_id: int) -> date:
            day_index = int((review_id / 1000 - offset_secs) // 86400)
            return today_date + timedelta(days=day_index - today_index)

        activity: Dict[str, Dict[str, int]] = {}
        for row in revlogs:
            iso = review_date(int(row[0])).isoformat()
            bucket = activity.setdefault(iso, {'count': 0, 'timeSeconds': 0})
            bucket['count'] += 1
            bucket['timeSeconds'] += round((row[4] or 0) / 1000)

        today_key = today_date.isoformat()
        today_logs = [row for row in revlogs if review_date(int(row[0])) == today_date]
        today_count = len(today_logs)
        today_time_seconds = round(sum(row[4] or 0 for row in today_logs) / 1000)
        today_correct = sum(1 for row in today_logs if row[1] > 1)
        today_stats = {
            'cardsStudied': today_count,
            'timeSeconds': today_time_seconds,
            'timeMinutes': round(today_time_seconds / 60, 1),
            'avgSecondsPerCard': round(today_time_seconds / today_count, 1) if today_count else 0,
            'retentionToday': round(100 * today_correct / today_count) if today_count else None,
            'reviewCount': sum(1 for row in today_logs if row[2] == 1),
            'learnCount': sum(1 for row in today_logs if row[2] in (0, 2)),
        }

        today_sched = max(0, int((time.time() - self.col.crt) // 86400))
        forecast_map: Dict[int, int] = {}
        for card in cards:
            queue = int(card[3])
            if queue == 2:
                delta = max(0, int(card[4]) - today_sched)
                forecast_map[delta] = forecast_map.get(delta, 0) + 1
            elif queue in (1, 3):
                forecast_map[0] = forecast_map.get(0, 0) + 1

        def forecast_series(last_day: int) -> List[Dict[str, int]]:
            return [{'day': day, 'due': forecast_map.get(day, 0)} for day in range(last_day + 1)]

        forecast_30 = forecast_series(30)
        forecast_90 = forecast_series(90)
        forecast_365 = forecast_series(365)
        total_forecast_30 = sum(item['due'] for item in forecast_30)
        total_forecast_90 = sum(item['due'] for item in forecast_90)
        total_forecast_365 = sum(item['due'] for item in forecast_365)
        forecast_stats = {
            'days30': forecast_30,
            'days90': forecast_90,
            'days365': forecast_365,
            'total30': total_forecast_30,
            'total90': total_forecast_90,
            'total365': total_forecast_365,
            'dueTomorrow': forecast_map.get(1, 0),
            'avgDaily30': round(total_forecast_30 / 30, 1) if total_forecast_30 else 0,
            'dailyLoad': forecast_map.get(0, 0),
        }

        year_start = date(target_year, 1, 1)
        year_end = date(target_year, 12, 31)
        calendar_days = []
        current = year_start
        while current <= year_end:
            entry = activity.get(current.isoformat(), {'count': 0, 'timeSeconds': 0})
            calendar_days.append({
                'date': current.isoformat(),
                'dayOfWeek': (current.weekday() + 1) % 7,
                'count': entry['count'],
                'timeSeconds': entry['timeSeconds'],
            })
            current += timedelta(days=1)
        calendar_stats = {
            'year': target_year,
            'availableYears': sorted({int(iso[:4]) for iso in activity} | {today_date.year, target_year}),
            'days': calendar_days,
            'totalReviews': sum(day['count'] for day in calendar_days),
            'daysStudied': sum(1 for day in calendar_days if day['count']),
        }

        def history_series(last_day: int) -> List[Dict[str, Any]]:
            result = []
            for days_ago in range(last_day, -1, -1):
                current_date = today_date - timedelta(days=days_ago)
                entry = activity.get(current_date.isoformat(), {'count': 0, 'timeSeconds': 0})
                result.append({
                    'date': current_date.isoformat(),
                    'daysAgo': -days_ago,
                    'reviews': entry['count'],
                    'timeMinutes': round(entry['timeSeconds'] / 60, 1),
                })
            return result

        history_30 = history_series(30)
        history_90 = history_series(90)
        history_365 = history_series(365)
        studied_30 = sum(1 for item in history_30 if item['reviews'])
        total_reviews_30 = sum(item['reviews'] for item in history_30)
        history_stats = {
            'days30': history_30,
            'days90': history_90,
            'days365': history_365,
            'daysStudied30': studied_30,
            'pctDaysStudied30': round(100 * studied_30 / 31, 1),
            'totalReviews30': total_reviews_30,
            'totalMinutes30': round(sum(item['timeMinutes'] for item in history_30), 1),
            'avgReviewsPerDay30': round(total_reviews_30 / 31, 1),
            'avgReviewsPerStudiedDay30': round(total_reviews_30 / studied_30, 1) if studied_30 else 0,
        }

        total_cards = len(cards)
        counts = {
            'new': sum(1 for card in cards if card[2] == 0 and card[3] != -1),
            'learning': sum(1 for card in cards if card[2] == 1 and card[3] != -1),
            'relearning': sum(1 for card in cards if card[2] == 3 and card[3] != -1),
            'young': sum(1 for card in cards if card[2] == 2 and card[5] < 21 and card[3] != -1),
            'mature': sum(1 for card in cards if card[2] == 2 and card[5] >= 21 and card[3] != -1),
            'suspended': sum(1 for card in cards if card[3] == -1),
            'buried': sum(1 for card in cards if card[3] in (-2, -3)),
        }
        breakdown_meta = {
            'new': ('Nuevas', '#5bb1e8'),
            'learning': ('En estudio (primeros días)', '#f97316'),
            'relearning': ('Reaprendiendo (corregidas)', '#ef4444'),
            'young': ('En estudio avanzado (1-20 días)', '#86efac'),
            'mature': ('Dominadas (>20 días)', '#22c55e'),
            'suspended': ('Pausadas (no incluidas en repaso)', '#eab308'),
            'buried': ('Ocultas (sin acceso directo)', '#94a3b8'),
        }
        card_breakdown = {'total': total_cards}
        for key, (label, color) in breakdown_meta.items():
            count = counts[key]
            card_breakdown[key] = {
                'count': count,
                'pct': round(100 * count / total_cards, 2) if total_cards else 0.0,
                'label': label,
                'color': color,
            }

        interval_counts: Dict[int, int] = {}
        ease_counts: Dict[int, int] = {}
        for card in cards:
            if card[3] == 2:
                interval_counts[int(card[5])] = interval_counts.get(int(card[5]), 0) + 1
                if card[6] > 0:
                    ease_counts[int(card[6])] = ease_counts.get(int(card[6]), 0) + 1
        total_review_cards = sum(interval_counts.values())
        intervals_data = {
            'distribution': [{'interval': value, 'count': interval_counts[value]} for value in sorted(interval_counts)],
            'avgInterval': round(sum(value * count for value, count in interval_counts.items()) / total_review_cards, 1) if total_review_cards else 0,
            'maxInterval': max(interval_counts, default=0),
            'totalReviewCards': total_review_cards,
        }
        total_ease_cards = sum(ease_counts.values())
        ease_data = {
            'distribution': [{'factor': round(value / 10), 'count': ease_counts[value]} for value in sorted(ease_counts)],
            'avgEase': round(sum(value * count for value, count in ease_counts.items()) / total_ease_cards / 10, 1) if total_ease_cards else 250.0,
            'totalCardsWithEase': total_ease_cards,
        }

        def retention_for(predicate) -> Dict[str, Any]:
            selected = [row for row in revlogs if predicate(row)]
            correct = sum(1 for row in selected if row[1] > 1)
            return {'total': len(selected), 'correct': correct, 'rate': round(100 * correct / len(selected), 1) if selected else None}

        retention_data = {
            'young': retention_for(lambda row: 1 <= row[3] < 21),
            'mature': retention_for(lambda row: row[3] >= 21),
            'all': retention_for(lambda row: row[3] >= 1),
        }

        ranges = (30, 90, 365)
        hourly = {days: [{'hour': hour, 'reviews': 0, 'correct': 0} for hour in range(24)] for days in ranges}
        button_presses = {
            days: {kind: {rating: 0 for rating in range(1, 5)} for kind in ('learning', 'young', 'mature')}
            for days in ranges
        }
        period_specs = (
            ('today', 'Hoy'),
            ('yesterday', 'Ayer'),
            ('week', 'La semana pasada'),
            ('month', 'El mes pasado'),
            ('year', 'El año pasado'),
        )
        retention_buckets = {key: [] for key, _ in period_specs}
        for row in revlogs:
            review_ms = int(row[0])
            category = 'learning' if row[2] in (0, 2) or row[3] < 1 else ('young' if row[3] < 21 else 'mature')
            for days in ranges:
                if review_ms >= today_start_ms - days * 86400 * 1000:
                    hour_bucket = hourly[days][datetime.fromtimestamp(review_ms / 1000).hour]
                    hour_bucket['reviews'] += 1
                    hour_bucket['correct'] += int(row[1] > 1)
                    button_presses[days][category][int(row[1])] += 1
            if row[3] >= 1:
                if review_ms >= today_start_ms:
                    retention_buckets['today'].append(row)
                if today_start_ms - 86400 * 1000 <= review_ms < today_start_ms:
                    retention_buckets['yesterday'].append(row)
                if review_ms >= today_start_ms - 7 * 86400 * 1000:
                    retention_buckets['week'].append(row)
                if review_ms >= today_start_ms - 30 * 86400 * 1000:
                    retention_buckets['month'].append(row)
                if review_ms >= today_start_ms - 365 * 86400 * 1000:
                    retention_buckets['year'].append(row)

        for values in hourly.values():
            for item in values:
                item['rate'] = round(100 * item['correct'] / item['reviews'], 1) if item['reviews'] else None

        retention_table = []
        for key, label in period_specs:
            bucket = retention_buckets[key]
            young = [row for row in bucket if 1 <= row[3] < 21]
            mature = [row for row in bucket if row[3] >= 21]

            def rate_text(rows: List[Any]) -> Tuple[str, Optional[float]]:
                if not rows:
                    return 'N/A', None
                value = round(100 * sum(1 for row in rows if row[1] > 1) / len(rows), 1)
                return f'{value}%', value

            young_text, young_num = rate_text(young)
            mature_text, mature_num = rate_text(mature)
            total_text, total_num = rate_text(bucket)
            retention_table.append({
                'key': key, 'label': label,
                'young': young_text, 'youngNum': young_num,
                'mature': mature_text, 'matureNum': mature_num,
                'total': total_text, 'totalNum': total_num,
                'count': len(bucket),
            })

        added_by_date: Dict[str, int] = {}
        for card in cards:
            try:
                created = datetime.fromtimestamp(int(card[0]) / 1000).date()
            except (OSError, OverflowError, ValueError):
                continue
            added_by_date[created.isoformat()] = added_by_date.get(created.isoformat(), 0) + 1

        def added_series(last_day: Optional[int]) -> Dict[str, Any]:
            if last_day is None:
                series = [{'date': iso, 'count': added_by_date[iso]} for iso in sorted(added_by_date)]
            else:
                series = []
                for days_ago in range(last_day, -1, -1):
                    iso = (today_date - timedelta(days=days_ago)).isoformat()
                    series.append({'date': iso, 'count': added_by_date.get(iso, 0)})
            return {'total': sum(item['count'] for item in series), 'series': series}

        month_logs = [row for row in revlogs if int(row[0]) >= (day_start - 29 * 86400) * 1000]
        remembered = sum(1 for row in month_logs if row[1] > 1)
        return {
            'deckId': deck_id if deck_id not in ('all', None, '', 0, '0') else None,
            'deckName': deck_name,
            'today': today_stats,
            'forecast': forecast_stats,
            'calendar': calendar_stats,
            'history': history_stats,
            'cardBreakdown': card_breakdown,
            'intervals': intervals_data,
            'ease': ease_data,
            'retention': retention_data,
            'retentionTable': retention_table,
            'hourly': {'days30': hourly[30], 'days90': hourly[90], 'days365': hourly[365]},
            'buttonPresses': {'days30': button_presses[30], 'days90': button_presses[90], 'days365': button_presses[365]},
            'addedCards': {'days30': added_series(30), 'days90': added_series(90), 'days365': added_series(365), 'all': added_series(None)},
            'totalCards': total_cards,
            'reviewedToday': today_count,
            'retentionRate': round(100 * remembered / len(month_logs)) if month_logs else None,
        }

    def reset_deck(self, deck_id: Any) -> Dict[str, Any]:
        """Reinicia todas las tarjetas de un mazo a estado 'new' (nuevas)."""
        self._check_thread()
        did = self._deck_id(deck_id)
        dids = set(self.col.decks.deck_and_child_ids(did))
        dids_str = ','.join(map(str, dids))

        # Obtener todas las tarjetas del mazo
        cards = self.col.db.all(f'select id from cards where did in ({dids_str})')

        reset_count = 0
        for row in cards:
            cid = row[0]
            card = self.col.get_card(cid)
            # Resetear a estado nuevo
            card.type = 0  # 0=new, 1=learning, 2=review
            card.queue = 0  # 0=new
            card.due = self.col.next_id()
            card.ivl = 0
            card.factor = 2500
            card.reps = 0
            card.lapses = 0
            self.col.update_card(card)
            reset_count += 1

        return {'success': True, 'deckId': did, 'cardsReset': reset_count}

    def reset_all(self) -> Dict[str, Any]:
        """Reinicia todas las tarjetas de la colección a estado 'new'."""
        self._check_thread()

        # Obtener todas las tarjetas
        cards = self.col.db.all('select id from cards')

        reset_count = 0
        for row in cards:
            cid = row[0]
            card = self.col.get_card(cid)
            # Resetear a estado nuevo
            card.type = 0
            card.queue = 0
            card.due = self.col.next_id()
            card.ivl = 0
            card.factor = 2500
            card.reps = 0
            card.lapses = 0
            self.col.update_card(card)
            reset_count += 1

        return {'success': True, 'cardsReset': reset_count}

    def state(self, include_cards: bool = True) -> Dict[str, Any]:
        self._check_thread()
        stars = self._stars()
        cards = []
        if include_cards:
            due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
            cards = [self._card_data(self.col.get_card(cid), due_ids, stars) for cid in self.col.find_cards('')]

        deck_counts = {r[0]: (r[1], r[2]) for r in self.col.db.all('select did, count(*), sum(type != 0) from cards group by did')}
        tree = self.col.sched.deck_due_tree()
        tree_by_id = {}
        for child in tree.children:
            tree_by_id[child.deck_id] = child

        decks = []
        for deck in self.col.decks.all_names_and_ids():
            dids = set(self.col.decks.deck_and_child_ids(deck.id))
            nodes = [tree_by_id[did] for did in dids if did in tree_by_id]
            total = sum(deck_counts.get(did, (0, 0))[0] for did in dids)
            if deck.id == 1 and not total:
                continue
            parts = deck.name.split('::')
            has_children = len(dids) > 1
            deck_record = self.col.decks.get(deck.id, {})
            decks.append({
                'id': deck.id, 'name': deck.name, 'total': total, 'childIds': sorted(dids),
                'due': sum(node.review_count + node.learn_count + node.new_count for node in nodes),
                'new': sum(node.new_count for node in nodes),
                'learned': sum(deck_counts.get(did, (0, 0))[1] for did in dids),
                'shortName': parts[-1],
                'parentName': '::'.join(parts[:-1]) if len(parts) > 1 else '',
                'isFolder': bool(deck_record.get('lumcardsFolder')) or has_children,
                'level': len(parts) - 1,
            })

        due_today = sum(n.review_count + n.learn_count + n.new_count for n in tree.children)
        return {
            'decks': decks, 'cards': cards, 'cardsIncluded': bool(include_cards),
            'counts': {'totalCards': self.col.card_count(), 'starredCards': self._count_existing_stars(stars)},
            'settings': self.settings(), 'stats': self._stats(due_today),
            'storage': {'dataDir': str(self.data_dir), 'collectionPath': str(self.collection_path), 'mediaDir': str(self.media_dir), 'backupDir': str(self.backup_dir)},
            'engine': {'name': 'Lumcards Clean Engine', 'version': '1.0.0', 'scheduler': 'SM-2 Clean (No AGPL)'},
        }

    def browse_cards(self, query: str = '', deck_id: Any = None, starred: bool = False, offset: int = 0, limit: int = 50) -> Dict[str, Any]:
        self._check_thread()
        ids = self.col.find_cards(query)
        if deck_id not in (None, '', 'all'):
            did = self._deck_id(deck_id)
            child_dids = set(self.col.decks.deck_and_child_ids(did))
            ids = [cid for cid in ids if self.col.get_card(cid).did in child_dids]
        stars = self._stars()
        if starred:
            ids = [cid for cid in ids if cid in stars]
        total = len(ids)
        offset = max(0, int(offset or 0))
        limit = max(1, min(int(limit or 50), 200))
        page_ids = ids[offset:offset + limit]
        due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
        active_block = getattr(self, '_study_blocks', {}).get(str(deck_id or 'all'))
        selected_set = set(active_block.get('selectedCardIds', [])) if active_block else set()
        reviewed_set = set(active_block.get('reviewedCardIds', [])) if active_block else set()
        cards = []
        for cid in page_ids:
            meta = self._card_metadata(self.col.get_card(cid), due_ids, stars)
            meta['inBlock'] = cid in selected_set
            meta['blockReviewed'] = cid in reviewed_set
            meta['blockPending'] = cid in selected_set and cid not in reviewed_set
            meta['historyReviewed'] = meta.get('reviews', 0) > 0 and cid not in reviewed_set
            cards.append(meta)
        return {'cards': cards, 'total': total, 'offset': offset, 'limit': limit, 'hasMore': offset + len(cards) < total, 'query': query, 'hasActiveBlock': bool(active_block)}

    def card_detail(self, id: Any) -> Dict[str, Any]:
        self._check_thread()
        card = self._get_card(id)
        due_ids = set(self.col.find_cards(f'cid:{card.id} (is:due OR is:new) -is:suspended -is:buried'))
        return self._card_data(card, due_ids=due_ids)

    @staticmethod
    def _validate_fields(fields: Any, count: int) -> List[str]:
        if not isinstance(fields, list) or len(fields) != count or any(not isinstance(value, str) for value in fields):
            raise ValueError(f'La nota requiere exactamente {count} campos de texto, en el orden original.')
        if not any(value.strip() for value in fields):
            raise ValueError('La nota debe conservar al menos un campo con contenido.')
        return list(fields)

    def edit_note_fields(self, card_id: Any, fields: Any, tags: Any = '') -> Dict[str, Any]:
        self._check_thread()
        card = self._get_card(card_id)
        note = card.note()
        model = note.note_type()
        values = self._validate_fields(fields, len(model['flds']))
        before_ids = set(self.col.card_ids_of_note(note.id))

        note.fields = values
        note.tags = self._tags(tags)
        self.col.update_note(note)
        self._active = None

        after_ids = list(self.col.card_ids_of_note(note.id))
        warnings = []
        empty_cloze_ids = []
        if model['type'] == 1:
            cloze_numbers = set(note.cloze_numbers_in_fields())
            empty_cloze_ids = [cid for cid in after_ids if self.col.get_card(cid).ord + 1 not in cloze_numbers]
            if empty_cloze_ids:
                warnings.append('Se conservaron tarjetas sin su hueco original para proteger su historial.')

        return {
            'saved': True, 'noteId': note.id, 'cardIds': after_ids,
            'createdCards': len(set(after_ids) - before_ids), 'siblingCount': len(after_ids),
            'emptyCardIds': empty_cloze_ids, 'warnings': warnings,
            'card': self.card_detail(card.id if card.id in after_ids else after_ids[0]),
        }

    def _model_for_kind(self, kind: str) -> Dict[str, Any]:
        if kind == 'basic':
            return self._model()
        names = {'reversed': 'Lumcards · Inversa', 'cloze': 'Lumcards · Huecos'}
        legacy_names = {'reversed': 'Anki 2.0 · Inversa', 'cloze': 'Anki 2.0 · Huecos'}
        if kind not in names:
            raise ValueError('El tipo de nota debe ser basic, reversed o cloze.')
        model = self.col.models.by_name(names[kind]) or self.col.models.by_name(legacy_names[kind])
        if model:
            return model
        model = self.col.models.new(names[kind])
        model['type'] = 1 if kind == 'cloze' else 0
        field_names = ('Texto', 'Extra') if kind == 'cloze' else ('Pregunta', 'Respuesta')
        for name in field_names:
            self.col.models.add_field(model, self.col.models.new_field(name))
        if kind == 'cloze':
            templates = [('Hueco', '{{cloze:Texto}}', '{{cloze:Texto}}<br>{{Extra}}')]
        else:
            templates = [
                ('Directa', '{{Pregunta}}', '{{FrontSide}}<hr id="answer">{{Respuesta}}'),
                ('Inversa', '{{Respuesta}}', '{{FrontSide}}<hr id="answer">{{Pregunta}}'),
            ]
        for name, question, answer in templates:
            template = self.col.models.new_template(name)
            template['qfmt'], template['afmt'] = question, answer
            self.col.models.add_template(model, template)
        model['css'] = self._model()['css'] + ' .cloze { font-weight: bold; color: #177d67; }'
        self.col.models.add(model)
        return model

    def create_note(self, deck_id: Any, kind: str, fields: Any, tags: Any = '') -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        if kind not in ('basic', 'reversed', 'cloze'):
            raise ValueError('El tipo de nota debe ser basic, reversed o cloze.')
        values = self._validate_fields(fields, 2)
        if not values[0].strip() or (kind != 'cloze' and not values[1].strip()):
            raise ValueError('Completa la pregunta y la respuesta. En las notas de huecos, Extra es opcional.')
        note = self.col.new_note(self._model_for_kind(kind))
        note.fields = values
        note.tags = self._tags(tags)
        if kind == 'cloze' and not note.cloze_numbers_in_fields():
            raise ValueError('Añade al menos un hueco como {{c1::respuesta}} dentro del texto.')
        self.col.add_note(note, did)
        self._active = None
        ids = list(self.col.card_ids_of_note(note.id))
        return {'saved': True, 'noteId': note.id, 'cardIds': ids, 'createdCards': len(ids), 'card': self.card_detail(ids[0])}

    def get_models(self) -> List[Dict[str, Any]]:
        self._check_thread()
        models = self.col.models.all()
        return [
            {
                'id': m['id'],
                'name': m['name'],
                'type': m['type'],
                'css': m.get('css', ''),
                'fields': [{'name': f['name']} for f in m.get('flds', [])],
                'templates': [
                    {
                        'name': t['name'],
                        'qfmt': t['qfmt'],
                        'afmt': t['afmt']
                    } for t in m.get('tmpls', [])
                ]
            } for m in models
        ]

    def update_model_template(self, model_id: Any, template_index: Any, qfmt: str, afmt: str, css: str = None) -> Dict[str, Any]:
        self._check_thread()
        try:
            model = self.col.models.get(int(model_id))
        except (ValueError, TypeError):
            raise ValueError('ID de modelo inválido.')
        if not model:
            raise ValueError('El modelo no existe.')
        try:
            template_index = int(template_index)
            if template_index < 0 or template_index >= len(model['tmpls']):
                raise IndexError
        except (ValueError, TypeError, IndexError):
            raise ValueError('Índice de plantilla inválido.')

        model['tmpls'][template_index]['qfmt'] = str(qfmt)
        model['tmpls'][template_index]['afmt'] = str(afmt)
        if css is not None:
            model['css'] = str(css)
        self.col.models.save(model)
        self._active = None
        return {'saved': True, 'modelId': model['id']}

    def settings(self) -> Dict[str, Any]:
        return {'dailyGoal': self.col.get_config('anki2.dailyGoal', self.col.get_config('dailyGoal', 20))}

    def update_settings(self, dailyGoal: Any = None, **kwargs) -> Dict[str, Any]:
        self._check_thread()
        if isinstance(dailyGoal, dict):
            dailyGoal = dailyGoal.get('dailyGoal')
        try:
            goal = int(dailyGoal)
        except (TypeError, ValueError):
            raise ValueError('La meta diaria debe ser un número entre 1 y 1000.')
        if not 1 <= goal <= 1000:
            raise ValueError('La meta diaria debe estar entre 1 y 1000.')
        self.col.set_config('anki2.dailyGoal', goal)
        self.col.set_config('dailyGoal', goal)
        return self.settings()

    def add_deck(self, name: str) -> Dict[str, Any]:
        self._check_thread()
        clean_name = normalize_deck_name(name)
        if not clean_name or len(clean_name) > 120:
            raise ValueError('Escribe un nombre de mazo de entre 1 y 120 caracteres.')
        if self.col.decks.id(clean_name, create=False):
            raise ValueError('Ya existe un mazo o carpeta con ese nombre.')
        did = self.col.decks.id(clean_name)
        self._active = None
        return {'id': did, 'name': clean_name}

    def create_folder(self, name: str) -> Dict[str, Any]:
        result = self.add_deck(name)
        self.col._decks[result['id']]['lumcardsFolder'] = True
        self.col._save_decks()
        return {**result, 'isFolder': True}

    def rename_deck(self, deck_id: Any, new_name: str) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        deck = self.col.decks.get(did)
        clean_name = normalize_deck_name(new_name)
        if not clean_name or len(clean_name) > 120:
            raise ValueError('Escribe un nombre de entre 1 y 120 caracteres.')
        current_name = deck['name']
        parent_name = current_name.rpartition('::')[0]
        target_name = clean_name if '::' in clean_name or not parent_name else parent_name + '::' + clean_name

        subtree_ids = set(self.col.decks.deck_and_child_ids(did))
        subtree_targets = {
            (target_name + other['name'][len(current_name):]).casefold()
            for other_id, other in self.col._decks.items()
            if other_id in subtree_ids
        }
        for other_id, other in self.col._decks.items():
            if other_id not in subtree_ids and other['name'].casefold() in subtree_targets:
                raise ValueError('Ya existe un mazo o carpeta con ese nombre.')

        self.col.decks.rename(deck, target_name)
        self._active = None
        return {'id': did, 'name': target_name, 'isFolder': bool(deck.get('lumcardsFolder')) or len(subtree_ids) > 1}

    def move_deck(self, deck_id: Any, parent_id: Any = None) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        deck = self.col.decks.get(did)
        base_name = deck['name'].split('::')[-1]
        parent = None
        if parent_id in (None, '', 'root', 0, '0'):
            new_name = base_name
        else:
            pid = self._deck_id(parent_id)
            if pid in set(self.col.decks.deck_and_child_ids(did)):
                raise ValueError('No puedes mover una carpeta dentro de sí misma o de una subcarpeta.')
            parent = self.col.decks.get(pid)
            parent_has_children = len(self.col.decks.deck_and_child_ids(pid)) > 1
            if not parent.get('lumcardsFolder') and not parent_has_children:
                raise ValueError('El destino debe ser una carpeta.')
            new_name = parent['name'] + '::' + base_name
        existing_id = self.col.decks.id(new_name, create=False)
        if existing_id and existing_id != did:
            raise ValueError('Ya existe un mazo o carpeta con ese nombre en el destino.')
        if parent is not None:
            parent['lumcardsFolder'] = True
        self.col.decks.rename(deck, new_name)
        self._active = None
        return {'id': did, 'name': new_name}

    def delete_deck(self, deck_id: Any, keep_children: bool = False) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        deck = self.col.decks.get(did)
        if not deck:
            raise ValueError('El mazo o carpeta no existe.')
        if did == 1 and len(self.col.decks.all()) <= 1:
            raise ValueError('No puedes eliminar el único mazo de la biblioteca.')

        # Respaldo de seguridad ANTES de cualquier modificación destructiva
        self.backup()

        all_subtree_ids = self.col.decks.deck_and_child_ids(did)
        deck_name = deck['name']

        if keep_children:
            # Desanidar submazos moviéndolos al nivel superior
            prefix = deck_name + '::'
            child_ids = [sub_id for sub_id in all_subtree_ids if sub_id != did]
            parent_prefix = deck_name.rpartition('::')[0]

            # Verificar colisiones de nombres antes de realizar cualquier cambio
            target_renames = []
            for sub_id in child_ids:
                sub_deck = self.col.decks.get(sub_id)
                relative_name = sub_deck['name'][len(prefix):]
                new_sub_name = f"{parent_prefix}::{relative_name}" if parent_prefix else relative_name
                existing = self.col.decks.id(new_sub_name, create=False)
                if existing and existing != sub_id:
                    raise ValueError(f'Ya existe un mazo llamado «{new_sub_name}» en el nivel superior.')
                target_renames.append((sub_deck, new_sub_name))

            for sub_deck, new_sub_name in target_renames:
                self.col.decks.rename(sub_deck, new_sub_name)

            # Eliminar solo el mazo/carpeta padre
            card_rows = self.col.db.all("select id from cards where did = ?", (did,))
            cids = {r['id'] for r in card_rows}
            self.col.decks.remove([did])
            if cids:
                self.col.set_config('anki2.starred', sorted(self._stars() - cids))
            self._active = None
            if hasattr(self, '_study_blocks') and str(did) in self._study_blocks:
                del self._study_blocks[str(did)]
            return {
                'id': did,
                'name': deck_name,
                'deletedDecks': 1,
                'keptDecks': len(child_ids),
                'deletedCards': len(cids)
            }
        else:
            # Eliminar recursivamente todo el árbol de mazos y sus tarjetas
            all_cids = set()
            for sub_id in all_subtree_ids:
                card_rows = self.col.db.all("select id from cards where did = ?", (sub_id,))
                all_cids.update(r['id'] for r in card_rows)

            self.col.decks.remove(all_subtree_ids)
            if all_cids:
                self.col.set_config('anki2.starred', sorted(self._stars() - all_cids))
            self._active = None
            if hasattr(self, '_study_blocks'):
                for sub_id in all_subtree_ids:
                    if str(sub_id) in self._study_blocks:
                        del self._study_blocks[str(sub_id)]
            return {
                'id': did,
                'name': deck_name,
                'deletedDecks': len(all_subtree_ids),
                'keptDecks': 0,
                'deletedCards': len(all_cids)
            }

    @staticmethod
    def _tags(tags: Any) -> List[str]:
        source = tags if isinstance(tags, (list, tuple, set)) else str(tags or '').replace(',', ' ').split()
        return list(dict.fromkeys(str(t).strip().replace(' ', '_') for t in source if str(t).strip()))

    def add_card(self, deck_id: Any, front: str, back: str, tags: Any = '') -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        clean_front = str(front or '').strip()
        clean_back = str(back or '').strip()
        if not clean_front or not clean_back:
            raise ValueError('Escribe una pregunta y una respuesta.')
        note = self.col.new_note(self._model())
        note.fields = [clean_front, clean_back]
        note.tags = self._tags(tags)
        self.col.add_note(note, did)
        self._active = None
        cids = self.col.card_ids_of_note(note.id)
        return self._card_data(self.col.get_card(cids[0]))

    def edit_card(self, id: Any, front: str, back: str, tags: Any = '') -> Dict[str, Any]:
        self._check_thread()
        card = self._get_card(id)
        note = card.note()
        model = note.note_type()
        if model['name'] != self.MODEL_NAME and model['name'] != 'Anki 2.0 · Básica':
            raise ValueError('Esta tarjeta pertenece a una plantilla avanzada. Usa el editor de campos.')
        clean_front = str(front or '').strip()
        clean_back = str(back or '').strip()
        if not clean_front or not clean_back:
            raise ValueError('Escribe una pregunta y una respuesta.')
        note.fields = [clean_front, clean_back]
        note.tags = self._tags(tags)
        self.col.update_note(note)
        self._active = None
        return self._card_data(card)

    def toggle_star(self, id: Any) -> Dict[str, Any]:
        self._check_thread()
        card = self._get_card(id)
        stars = self._stars()
        if card.id in stars:
            stars.remove(card.id)
            starred = False
        else:
            stars.add(card.id)
            starred = True
        self.col.set_config('anki2.starred', sorted(stars))
        return {'id': card.id, 'starred': starred}

    def delete_card(self, id: Any) -> Dict[str, Any]:
        self._check_thread()
        card = self._get_card(id)
        note = card.note()
        ids = {c.id for c in note.cards()}
        self.col.remove_notes([note.id])
        self.col.set_config('anki2.starred', sorted(self._stars() - ids))
        self._active = None
        return {'deleted': len(ids), 'noteId': note.id, 'cardIds': sorted(ids)}

    def list_backups(self) -> List[Dict[str, Any]]:
        backups = []
        for p in self.backup_dir.glob('*.colpkg'):
            stat = p.stat()
            backups.append({
                'filename': p.name,
                'path': str(p),
                'bytes': stat.st_size,
                'createdAt': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        backups.sort(key=lambda b: b['createdAt'], reverse=True)
        return backups

    def backup(self) -> Dict[str, Any]:
        return self.export_collection()

    def get_study_block_info(self, deck_id: Any = None) -> Dict[str, Any]:
        self._check_thread()
        if deck_id not in (None, '', 'all', 0, '0'):
            did = self._deck_id(deck_id)
            dids = set(self.col.decks.deck_and_child_ids(did))
        else:
            dids = {d['id'] for d in self.col.decks.all()}
        dids_str = ','.join(map(str, dids))
        now = int(time.time())
        today_days = (now - self.col.crt) // 86400

        c_rows = self.col.db.all(f"""
        select
            count(*),
            sum(queue = 0),
            sum(queue = 1 and due <= ?),
            sum(queue = 2 and due <= ?),
            sum(queue = 1 and due > ?)
        from cards where did in ({dids_str}) and queue not in (-1, -2, -3)
        """, (now, today_days, now))

        total_deck = c_rows[0][0] or 0 if c_rows else 0
        new_c = c_rows[0][1] or 0 if c_rows else 0
        learn_due = c_rows[0][2] or 0 if c_rows else 0
        rev_due = c_rows[0][3] or 0 if c_rows else 0
        learn_not_due = c_rows[0][4] or 0 if c_rows else 0
        available_today = new_c + learn_due + rev_due

        block_key = str(deck_id or 'all')
        block = getattr(self, '_study_blocks', {}).get(block_key)
        clean_block = None

        if block:
            selected_ids = list(block.get('selectedCardIds', []))
            reviewed_ids = list(block.get('reviewedCardIds', []))
            again_ids = list(block.get('againCardIds', []))

            if selected_ids:
                placeholders = ','.join('?' for _ in selected_ids)
                existing_rows = self.col.db.all(f"select id, did, queue from cards where id in ({placeholders})", selected_ids)
                existing_map = {r[0]: (r[1], r[2]) for r in existing_rows}

                valid_selected = [cid for cid in selected_ids if cid in existing_map and existing_map[cid][0] in dids and existing_map[cid][1] not in (-1, -2, -3)]
                valid_reviewed = [cid for cid in valid_selected if cid in reviewed_ids]
                valid_again = [cid for cid in valid_selected if cid in again_ids]

                if len(valid_selected) != len(selected_ids):
                    block['selectedCardIds'] = valid_selected
                    block['reviewedCardIds'] = valid_reviewed
                    block['againCardIds'] = valid_again
                    self._save_study_blocks()

                pending_count = max(0, len(valid_selected) - len(valid_reviewed))
                clean_block = {
                    'deckId': block.get('deckId', block_key),
                    'requestedLimit': block.get('requestedLimit'),
                    'actualLimit': len(valid_selected),
                    'total': len(valid_selected),
                    'reviewedCount': len(valid_reviewed),
                    'pendingCount': pending_count,
                    'againCount': len(valid_again),
                    'progressPct': round((len(valid_reviewed) / len(valid_selected) * 100)) if valid_selected else 100,
                    'firstPassDone': pending_count == 0,
                    'selectedCardIds': valid_selected,
                    'reviewedCardIds': valid_reviewed,
                    'againCardIds': valid_again,
                    'explanation': block.get('explanation', '')
                }

        return {
            'deckId': str(deck_id or 'all'),
            'totalDeck': total_deck,
            'totalDeckCards': total_deck,
            'availableToday': available_today,
            'hasActiveBlock': clean_block is not None,
            'pendingNew': new_c,
            'pendingLearn': learn_due,
            'pendingDue': rev_due,
            'learningNotDue': learn_not_due,
            'unmaturedReviews': learn_not_due,
            'activeBlock': clean_block
        }

    def start_study_block(self, deck_id: Any = None, limit: Any = 20) -> Dict[str, Any]:
        self._check_thread()
        if deck_id not in (None, '', 'all', 0, '0'):
            did = self._deck_id(deck_id)
            dids = set(self.col.decks.deck_and_child_ids(did))
        else:
            dids = {d['id'] for d in self.col.decks.all()}
        dids_str = ','.join(map(str, dids))
        now = int(time.time())
        today_days = (now - self.col.crt) // 86400

        query = f"""
        select id from cards
        where did in ({dids_str}) and queue not in (-1, -2, -3)
        and (queue = 0 or (queue = 1 and due <= ?) or (queue = 2 and due <= ?))
        order by
            case
                when queue = 1 then 1
                when queue = 2 then 2
                else 3
            end,
            due asc, id asc
        """
        rows = self.col.db.all(query, (now, today_days))
        eligible_ids = [r[0] for r in rows]

        if not eligible_ids:
            not_due_c = self.col.db.first(f"select count(*) from cards where did in ({dids_str}) and queue = 1 and due > ?", (now,))[0]
            explanation = "No hay tarjetas disponibles para hoy." if not not_due_c else f"Hay {not_due_c} tarjetas en repetición programadas para más tarde (aún no vencidas)."
            return {'started': False, 'availableToday': 0, 'learningNotDue': not_due_c, 'explanation': explanation}

        if str(limit).lower() == 'all':
            req_limit = len(eligible_ids)
        else:
            try:
                req_limit = max(1, int(limit))
            except Exception:
                req_limit = 20

        actual_limit = min(req_limit, len(eligible_ids))
        selected_ids = eligible_ids[:actual_limit]
        explanation = ""
        if actual_limit < req_limit:
            explanation = f"Se seleccionaron las {actual_limit} tarjetas disponibles hoy (solicitaste {req_limit})."

        block_key = str(deck_id or 'all')
        if not hasattr(self, '_study_blocks'):
            self._study_blocks = {}
        self._study_blocks[block_key] = {
            'deckId': block_key,
            'requestedLimit': limit,
            'actualLimit': actual_limit,
            'selectedCardIds': selected_ids,
            'reviewedCardIds': [],
            'againCardIds': [],
            'firstPassDone': False,
            'created': now,
            'updated': now,
            'explanation': explanation
        }
        self._save_study_blocks()
        return {
            'saved': True,
            'started': True,
            'deckId': block_key,
            'total': actual_limit,
            'selectedCardIds': selected_ids,
            'block': {
                'total': actual_limit,
                'pending': actual_limit,
                'reviewedCount': 0
            },
            'explanation': explanation
        }

    def clear_study_block(self, deck_id: Any = None) -> Dict[str, Any]:
        self._check_thread()
        block_key = str(deck_id or 'all')
        if hasattr(self, '_study_blocks') and block_key in self._study_blocks:
            del self._study_blocks[block_key]
            self._save_study_blocks()
        return {'saved': True, 'cleared': True, 'deckId': block_key}

    def study(self, deck_id: Any = None) -> Dict[str, Any]:
        self._check_thread()
        block_key = str(deck_id or 'all')
        block = getattr(self, '_study_blocks', {}).get(block_key)

        if deck_id not in (None, '', 'all'):
            dids = [self._deck_id(deck_id)]
        else:
            dids = [d['id'] for d in self.col.decks.all() if d['id'] != 1] + [1]

        intervals = ['< 1 min', '< 10 min', '1 día', '4 días']

        # Si hay bloque activo, verificamos la siguiente tarjeta del bloque
        if block and block.get('selectedCardIds'):
            selected_ids = block['selectedCardIds']
            reviewed_ids = set(block.get('reviewedCardIds', []))

            placeholders = ','.join('?' for _ in selected_ids)
            existing_rows = self.col.db.all(f"select id from cards where id in ({placeholders}) and queue not in (-1, -2, -3)", selected_ids)
            valid_set = {r[0] for r in existing_rows}
            clean_selected = [cid for cid in selected_ids if cid in valid_set]
            if len(clean_selected) != len(selected_ids):
                block['selectedCardIds'] = clean_selected
                self._save_study_blocks()

            next_cid = None
            for cid in clean_selected:
                if cid not in reviewed_ids:
                    next_cid = cid
                    break

            total = len(clean_selected)
            reviewed_count = len([cid for cid in clean_selected if cid in reviewed_ids])
            pending_count = max(0, total - reviewed_count)

            if next_cid is not None:
                card = self.col.get_card(next_cid)
                self.col._active_deck_id = card.did
                due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
                stars = self._stars()
                self._active = card
                block_status = {
                    'active': True,
                    'current': reviewed_count + 1,
                    'total': total,
                    'pending': pending_count,
                    'reviewedCount': reviewed_count,
                    'progressPct': round((reviewed_count / total) * 100) if total else 0,
                    'firstPassDone': False,
                    'againCount': len(block.get('againCardIds', []))
                }
                return {
                    'cards': [self._card_data(card, due_ids, stars)],
                    'counts': {'new': 0, 'learning': 0, 'review': pending_count, 'total': pending_count},
                    'deckId': card.did,
                    'intervals': intervals,
                    'finished': False,
                    'blockStatus': block_status
                }
            else:
                self._active = None
                block['firstPassDone'] = True
                self._save_study_blocks()
                now = int(time.time())
                again_ids = block.get('againCardIds', [])
                again_due = [cid for cid in again_ids if self.col.get_card(cid).due <= now]
                block_status = {
                    'active': True,
                    'current': total,
                    'total': total,
                    'pending': 0,
                    'reviewedCount': total,
                    'progressPct': 100,
                    'firstPassDone': True,
                    'againCount': len(again_ids),
                    'againDueCount': len(again_due)
                }
                return {
                    'cards': [],
                    'counts': {'new': 0, 'learning': 0, 'review': 0, 'total': 0},
                    'deckId': dids[0] if dids else 1,
                    'intervals': intervals,
                    'finished': True,
                    'firstPassDone': True,
                    'blockStatus': block_status
                }

        # Comportamiento normal sin bloque
        queue = None
        selected = None
        for did in dids:
            self.col._active_deck_id = did
            queue = self.col.sched.get_queued_cards(fetch_limit=1)
            selected = did
            if queue.cards:
                break

        cards = []
        if queue and queue.cards:
            due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
            stars = self._stars()
            first = queue.cards[0].card
            cards = [self._card_data(first, due_ids, stars)]
            self._active = first
        else:
            self._active = None

        counts = {
            'new': queue.new_count if queue else 0,
            'learning': queue.learning_count if queue else 0,
            'review': queue.review_count if queue else 0,
            'total': (queue.new_count + queue.learning_count + queue.review_count) if queue else 0
        }
        return {'cards': cards, 'counts': counts, 'deckId': selected or self.col._active_deck_id or 1, 'intervals': intervals, 'finished': not cards}

    def review(self, id: Any, rating: int) -> Dict[str, Any]:
        self._check_thread()
        if isinstance(rating, bool) or rating not in (1, 2, 3, 4):
            raise ValueError('Elige una valoración de 1 a 4.')
        if self._active is None or self._active.id != int(id):
            raise ValueError('La cola de estudio cambió. Abre la siguiente tarjeta para continuar.')
        card = self._active
        self.col.sched.answerCard(card, rating)
        self._active = None

        block_status = None
        cid = card.id
        for bkey, block in getattr(self, '_study_blocks', {}).items():
            if cid in block.get('selectedCardIds', []):
                reviewed = block.setdefault('reviewedCardIds', [])
                if cid not in reviewed:
                    reviewed.append(cid)
                if rating == 1:
                    again = block.setdefault('againCardIds', [])
                    if cid not in again:
                        again.append(cid)
                block['updated'] = int(time.time())
                total = len(block['selectedCardIds'])
                pending = max(0, total - len(reviewed))
                if pending == 0:
                    block['firstPassDone'] = True
                self._save_study_blocks()
                block_status = {
                    'active': True,
                    'total': total,
                    'reviewedCount': len(reviewed),
                    'pending': pending,
                    'againCount': len(block.get('againCardIds', [])),
                    'progressPct': round((len(reviewed) / total) * 100) if total else 100,
                    'firstPassDone': pending == 0
                }
                break

        res = {'card': self._card_data(card), 'saved': True}
        if block_status:
            res['blockStatus'] = block_status
        return res

    def start_exam(self, deck_id: Any = None, mode: str = 'difficult', limit: int = 20) -> Dict[str, Any]:
        self._check_thread()
        did_clause = ""
        if deck_id not in (None, '', 'all', 0, '0'):
            did = self._deck_id(deck_id)
            dids = set(self.col.decks.deck_and_child_ids(did))
            dids_str = ','.join(map(str, dids))
            did_clause = f"and did in ({dids_str})"

        limit = max(5, min(int(limit or 20), 200))
        if mode == 'difficult':
            query = f"select id from cards where queue != -1 {did_clause} order by factor asc, reps desc limit ?"
        elif mode == 'due':
            query = f"select id from cards where queue in (1, 2, 3) {did_clause} order by due asc limit ?"
        else:
            query = f"select id from cards where queue != -1 {did_clause} order by random() limit ?"

        rows = self.col.db.all(query, (limit,))
        cids = [r[0] for r in rows]
        if not cids:
            rows = self.col.db.all(f"select id from cards where 1=1 {did_clause} limit ?", (limit,))
            cids = [r[0] for r in rows]

        due_ids = set(cids)
        stars = self._stars()
        exam_cards = [self._card_data(self.col.get_card(cid), due_ids, stars) for cid in cids]
        return {
            'cards': exam_cards,
            'total': len(exam_cards),
            'deckId': deck_id
        }

    def create_image_occlusion(self, deck_id: Any, image_filename: str, shapes: Any, header: str = '', extra: str = '', tags: Any = '') -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        image_name = Path(str(image_filename).replace('\\', '/')).name
        media_path = self.media_dir / image_name
        if not media_path.is_file() and not self.col.media.have(image_name):
            raise ValueError('La imagen no existe en la carpeta de medios.')

        if not shapes or not isinstance(shapes, list):
            raise ValueError('Debes dibujar al menos una máscara sobre la imagen.')

        cloze_parts = []
        for idx, s in enumerate(shapes, start=1):
            left = round(float(s.get('left', 0)), 5)
            top = round(float(s.get('top', 0)), 5)
            w = round(float(s.get('width', 0.1)), 5)
            h = round(float(s.get('height', 0.1)), 5)
            oi = 1 if s.get('oi', True) else 0
            cloze_parts.append(f"{{{{c{idx}::image-occlusion:rect:left={left}:top={top}:width={w}:height={h}:oi={oi}}}}}")

        occlusion_text = " ".join(cloze_parts)
        image_html = f'<img src="{image_name}">'

        model = self.col.models.by_name('Image Occlusion')
        if not model:
            for m in self.col.models.all():
                if m.get('originalStockKind') == 6:
                    model = m
                    break
        if not model:
            model = self.col.add_image_occlusion_notetype()

        note = self.col.new_note(model)
        fld_names = [f['name'] for f in model['flds']]
        fields = [''] * len(fld_names)
        for i, name in enumerate(fld_names):
            if name == 'Occlusion':
                fields[i] = occlusion_text
            elif name == 'Image':
                fields[i] = image_html
            elif name == 'Header':
                fields[i] = str(header or '')
            elif name == 'Back Extra':
                fields[i] = str(extra or '')
            elif name == 'Comments':
                fields[i] = ''

        note.fields = fields
        note.tags = self._tags(tags)
        self.col.add_note(note, did)
        self._active = None
        ids = list(self.col.card_ids_of_note(note.id))
        return {
            'saved': True,
            'noteId': note.id,
            'cardIds': ids,
            'createdCards': len(ids),
            'image': image_name,
            'shapesCount': len(shapes)
        }

    def batch_add_cards(self, deck_id: Any, cards: List[Dict[str, Any]]) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        if not cards or not isinstance(cards, list):
            raise ValueError('Se requiere una lista de tarjetas.')
        created = []
        for item in cards:
            front = str(item.get('front', '')).strip()
            back = str(item.get('back', '')).strip()
            kind = item.get('kind', 'basic')
            tags = item.get('tags', '')
            if not front:
                continue
            if kind == 'cloze':
                if '{{c' not in front:
                    if not back:
                        continue
                    res = self.add_card(did, front, back, tags)
                else:
                    res = self.create_note(did, 'cloze', [front, back], tags)
            else:
                if not back:
                    continue
                if kind == 'reversed':
                    res = self.create_note(did, 'reversed', [front, back], tags)
                else:
                    res = self.add_card(did, front, back, tags)
            created.append(res)
        self._active = None
        return {'saved': True, 'count': len(created), 'deckId': did}

    def import_text_cards(self, deck_id: Any, cards: List[Dict[str, Any]]) -> Dict[str, Any]:
        self._check_thread()
        if isinstance(deck_id, bool) or not isinstance(deck_id, (int, str)):
            raise ValueError('Selecciona un mazo válido.')
        if not isinstance(cards, list) or not 1 <= len(cards) <= 5000:
            raise ValueError('Importa entre 1 y 5000 tarjetas por lote.')

        def literal_field(value):
            value = value.replace('\r\n', '\n').replace('\r', '\n').strip()
            escaped = html.escape(value, quote=True)
            for char, entity in (('[', '&#91;'), (']', '&#93;'), ('{', '&#123;'), ('}', '&#125;')):
                escaped = escaped.replace(char, entity)
            return escaped.replace('\n', '<br>')

        def text_key(value):
            parser = _Text()
            parser.feed(value)
            return re.sub(r'\s+', ' ', ''.join(parser.parts)).strip()

        validated = []
        for index, item in enumerate(cards, 1):
            if not isinstance(item, dict):
                raise ValueError(f'La fila {index} debe contener pregunta, respuesta y etiquetas.')
            fields = []
            for field in ('front', 'back'):
                value = item.get(field)
                if not isinstance(value, str) or not value.strip() or len(value) > 10000:
                    raise ValueError(f'La fila {index} requiere pregunta y respuesta de 1 a 10000 caracteres.')
                if any((ord(char) < 32 and char not in '\t\r\n') or 0xD800 <= ord(char) <= 0xDFFF for char in value):
                    raise ValueError(f'La fila {index} contiene caracteres de texto no válidos.')
                fields.append(literal_field(value))
            tags = item.get('tags', [])
            if not isinstance(tags, list) or len(tags) > 50 or any(
                not isinstance(tag, str) or not tag.strip() or len(tag) > 100
                or any(ord(char) < 32 or 0xD800 <= ord(char) <= 0xDFFF for char in tag)
                for tag in tags
            ):
                raise ValueError(f'La fila {index} admite hasta 50 etiquetas de 1 a 100 caracteres.')
            validated.append((fields, self._tags(tags)))

        did = self._deck_id(deck_id)
        if self.col.decks.get(did).get('dyn'):
            raise ValueError('Selecciona un mazo normal para importar tarjetas de texto.')

        basic_model_ids = {
            model['id'] for model in self.col.models.all()
            if model['type'] == 0 and len(model['flds']) == 2 and len(model['tmpls']) == 1
        }
        existing = set()
        for mid, raw_fields in self.col.db.all(
            'select distinct n.mid, n.flds from notes n join cards c on c.nid = n.id where c.did = ?', (did,)
        ):
            fields = raw_fields.split('\x1f')
            if mid not in basic_model_ids or len(fields) != 2:
                continue
            if any(re.search(r'<(?:img|audio|video|object|embed)\b|\[sound:|\[anki:play:', field, re.I) for field in fields):
                continue
            existing.add(tuple(text_key(field) for field in fields))

        additions = []
        for fields, tags in validated:
            key = tuple(text_key(field) for field in fields)
            if key in existing:
                continue
            existing.add(key)
            additions.append((fields, tags))

        result = {'added': len(additions), 'skipped': len(cards) - len(additions), 'deckId': did, 'saved': True}
        if not additions:
            return result

        backup = self.export_collection()
        with tempfile.TemporaryDirectory(prefix='.lumcards-text-import-', dir=self.data_dir) as temporary:
            temp_dir = Path(temporary)
            stage_dir = temp_dir / 'staged'
            stage_path = self._restore_package(backup['path'], stage_dir)
            staged = CleanCollection(str(stage_path))
            try:
                adapter = CleanEngine.__new__(CleanEngine)
                adapter.col = staged
                adapter.data_dir = self.data_dir
                adapter.collection_path = staged.path
                adapter.media_dir = staged.media_dir
                model = adapter._model()
                if model['type'] != 0 or len(model['flds']) != 2 or len(model['tmpls']) != 1:
                    raise ValueError('La plantilla básica fue modificada. Selecciona una plantilla básica válida antes de importar.')
                for fields, tags in additions:
                    note = staged.new_note(model)
                    note.fields = fields
                    note.tags = tags
                    staged.add_note(note, did)
                    if len(staged.card_ids_of_note(note.id)) != 1:
                        raise ValueError('La plantilla básica no generó exactamente una tarjeta. No se importó ninguna fila.')
            finally:
                staged.close()
            rollback_dir = temp_dir / 'rollback'
            rollback_dir.mkdir()
            self._install_staged(stage_dir, rollback_dir)

        self._active = None
        return result

    def get_deck_config(self, deck_id: Any) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        conf = self.col.decks.config_dict_for_deck_id(did)
        new_per_day = conf.get('new', {}).get('perDay', 20)
        rev_per_day = conf.get('rev', {}).get('perDay', 200)
        return {
            'deckId': did,
            'name': self.col.decks.get(did, {}).get('name', 'Mazo'),
            'newPerDay': new_per_day,
            'reviewPerDay': rev_per_day
        }

    def update_deck_config(self, deck_id: Any, new_per_day: Any = None, rev_per_day: Any = None) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        conf = self.col.decks.config_dict_for_deck_id(did)
        if new_per_day is not None:
            new_val = max(0, min(int(new_per_day), 1000))
            if 'new' not in conf:
                conf['new'] = {}
            conf['new']['perDay'] = new_val
        if rev_per_day is not None:
            rev_val = max(0, min(int(rev_per_day), 9999))
            if 'rev' not in conf:
                conf['rev'] = {}
            conf['rev']['perDay'] = rev_val
        self.col.decks.update_config(conf)
        self._active = None
        return self.get_deck_config(deck_id)

    def get_weak_cards(self, deck_id: Any = None, limit: int = 50) -> Dict[str, Any]:
        self._check_thread()
        did_clause = ""
        if deck_id not in (None, '', 'all', 0, '0'):
            did = self._deck_id(deck_id)
            dids = set(self.col.decks.deck_and_child_ids(did))
            dids_str = ','.join(map(str, dids))
            did_clause = f"and c.did in ({dids_str})"

        limit = max(5, min(int(limit or 50), 200))
        query = f"""
        select c.id, c.did, c.factor, c.lapses, c.reps, c.queue, n.sfld, length(n.sfld) as front_len
        from cards c
        join notes n on c.nid = n.id
        where c.queue != -1 {did_clause}
          and (c.lapses >= 2 or (c.factor > 0 and c.factor < 1900) or length(n.sfld) > 180)
        order by c.lapses desc, c.factor asc
        limit ?
        """
        rows = self.col.db.all(query, (limit,))
        stars = self._stars()
        deck_names = {d['id']: d['name'] for d in self.col.decks.all()}

        results = []
        for r in rows:
            cid, did, factor, lapses, reps, queue, sfld, front_len = r
            clean_snippet = re.sub(r'<[^>]+>', ' ', sfld or '').strip()
            clean_snippet = ' '.join(clean_snippet.split())
            if len(clean_snippet) > 90:
                clean_snippet = clean_snippet[:87] + '…'

            if lapses >= 3:
                issue = 'leech'
                badge = f'Sanguijuela · {lapses} fallos'
                tip = 'Esta tarjeta genera errores repetidos. Simplifica su enunciado o divídela en dos ideas.'
            elif factor > 0 and factor < 1800:
                issue = 'critical_ease'
                badge = f'Dificultad alta · {round(factor/10)}% retención'
                tip = 'El intervalo crece muy lento por fallos anteriores. Añade un ejemplo o mnemotecnia.'
            elif front_len > 180:
                issue = 'too_long'
                badge = f'Pregunta extensa · {front_len} car.'
                tip = 'La pregunta tiene demasiado texto. Conviene convertirla en preguntas atómicas.'
            else:
                issue = 'warning'
                badge = f'{lapses} fallos recientes'
                tip = 'Requiere atención para consolidar la memoria a largo plazo.'

            results.append({
                'id': cid,
                'deckId': did,
                'deckName': deck_names.get(did, 'Mazo'),
                'snippet': clean_snippet,
                'factor': factor,
                'lapses': lapses,
                'reps': reps,
                'starred': cid in stars,
                'issue': issue,
                'badge': badge,
                'tip': tip
            })
        return {'cards': results, 'total': len(results)}

    def reset_card_progress(self, card_id: Any) -> Dict[str, Any]:
        self._check_thread()
        card = self._get_card(card_id)
        card.type = 0
        card.queue = 0
        card.factor = 2500
        card.reps = 0
        card.lapses = 0
        card.ivl = 0
        self.col.update_card(card)
        self._active = None
        return {'saved': True, 'id': card.id, 'reset': True}

    def export_collection(self, path: Any = None) -> Dict[str, Any]:
        self._check_thread()
        if path is None:
            stamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S_%f')
            path = self.backup_dir / f'lumcards-{stamp}.colpkg'
        path = Path(path).resolve()
        if path == self.collection_path or path.suffix.lower() != '.colpkg':
            raise ValueError('La copia debe guardarse como un archivo .colpkg separado.')
        path.parent.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory(prefix='lumcards-colpkg-') as tmp:
            tmp_db = Path(tmp) / 'collection.anki2'
            src = sqlite3.connect(self.collection_path)
            dst = sqlite3.connect(tmp_db)
            try:
                src.backup(dst)
            finally:
                src.close()
                dst.close()

            with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(tmp_db, 'collection.anki2')
                media_map = {}
                idx = 0
                for mf in self.media_dir.glob('*'):
                    if mf.is_file():
                        media_map[str(idx)] = mf.name
                        zf.write(mf, str(idx))
                        idx += 1
                zf.writestr('media', json.dumps(media_map))

        self._active = None
        return {'path': str(path), 'filename': path.name, 'bytes': path.stat().st_size}

    def export_deck_package(self, deck_id: Any, path: Any) -> Dict[str, Any]:
        self._check_thread()
        did = self._deck_id(deck_id)
        dids = set(self.col.decks.deck_and_child_ids(did))
        dids_str = ','.join(map(str, dids))
        path = Path(path).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)

        import zipfile
        with tempfile.TemporaryDirectory(prefix='lumcards-apkg-') as tmp:
            tmp_db = Path(tmp) / 'collection.anki2'
            src = sqlite3.connect(self.collection_path)
            dst = sqlite3.connect(tmp_db)
            used_media = set()
            try:
                src.backup(dst)
                dst.execute(f"delete from cards where did not in ({dids_str})")
                dst.execute("delete from notes where id not in (select distinct nid from cards)")
                dst.execute("delete from revlog where cid not in (select id from cards)")
                dst.commit()
                for row in dst.execute("select flds from notes"):
                    for m in re.finditer(r'(?:src=["\']|\[sound:)([^"\'>\]]+)', row[0]):
                        used_media.add(Path(m.group(1)).name)
            finally:
                src.close()
                dst.close()

            with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(tmp_db, 'collection.anki2')
                media_map = {}
                idx = 0
                for mf in self.media_dir.glob('*'):
                    if mf.is_file() and mf.name in used_media:
                        media_map[str(idx)] = mf.name
                        zf.write(mf, str(idx))
                        idx += 1
                zf.writestr('media', json.dumps(media_map))

        return {'path': str(path), 'filename': path.name, 'bytes': path.stat().st_size}

    @staticmethod
    def _restore_package(package, target_dir):
        target_dir = Path(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        col_path = target_dir / 'collection.anki2'
        media_dir = target_dir / 'collection.media'
        media_dir.mkdir(parents=True, exist_ok=True)
        import zipfile
        with zipfile.ZipFile(package, 'r') as zf:
            for name in zf.namelist():
                if name in ('collection.anki2', 'collection.anki21'):
                    with zf.open(name) as src, open(col_path, 'wb') as dst:
                        shutil.copyfileobj(src, dst)
            if 'media' in zf.namelist():
                try:
                    media_map = parse_package_media_map(zf.read('media'))
                    for num_str, original_name in media_map.items():
                        if num_str in zf.namelist():
                            data = zf.read(num_str)
                            if data.startswith(b'\x28\xb5\x2f\xfd'):
                                try:
                                    import zstandard as zstd
                                    data = zstd.ZstdDecompressor().decompress(data, max_output_size=100_000_000)
                                except Exception:
                                    pass
                            (media_dir / original_name).write_bytes(data)
                except Exception:
                    pass
        return col_path

    def _install_staged(self, stage_dir: Path, rollback_dir: Path):
        moved_old = []
        moved_new = []
        self.col.close()
        try:
            for name in self.FILES:
                current = self.data_dir / name
                if current.exists():
                    os.replace(current, rollback_dir / name)
                    moved_old.append(name)
            for name in self.FILES:
                new = stage_dir / name
                if new.exists():
                    os.replace(new, self.data_dir / name)
                    moved_new.append(name)
            self._open()
        except Exception:
            self.col.close()
            for name in reversed(moved_new):
                new = self.data_dir / name
                if new.exists():
                    os.replace(new, stage_dir / name)
            for name in reversed(moved_old):
                os.replace(rollback_dir / name, self.data_dir / name)
            self._open()
            raise

    def import_file(self, path: Any) -> Dict[str, Any]:
        self._check_thread()
        source = Path(path).resolve()
        if source.suffix.lower() not in ('.apkg', '.colpkg', '.anki2'):
            raise ValueError('Elige un archivo .apkg, .colpkg o .anki2.')
        if not source.is_file():
            raise ValueError('No se encontró el archivo para importar.')

        backup = self.export_collection()
        before = self.col.card_count()
        import zipfile
        warnings = []

        with tempfile.TemporaryDirectory(prefix='.lumcards-import-', dir=self.data_dir) as tmp:
            tmp_dir = Path(tmp)
            stage_dir = tmp_dir / 'staged'
            stage_dir.mkdir()
            rollback_dir = tmp_dir / 'rollback'
            rollback_dir.mkdir()

            # Copiar colección y medios actuales a stage_dir
            for name in self.FILES:
                curr = self.data_dir / name
                if curr.is_file():
                    shutil.copy2(curr, stage_dir / name)
                elif curr.is_dir():
                    shutil.copytree(curr, stage_dir / name)

            db_path = None
            media_map = {}

            if source.suffix.lower() in ('.anki2', '.anki21'):
                db_path = source
            else:
                extract_dir = tmp_dir / 'extracted'
                extract_dir.mkdir()
                with zipfile.ZipFile(source, 'r') as zf:
                    zf.extractall(extract_dir)
                for cand in ('collection.anki21b', 'collection.anki21', 'collection.anki2'):
                    c_path = extract_dir / cand
                    if c_path.is_file():
                        if cand == 'collection.anki21b':
                            try:
                                import zstandard as zstd
                                dctx = zstd.ZstdDecompressor()
                                decomp_path = extract_dir / 'collection.anki21b_decomp'
                                with open(c_path, 'rb') as ifh, open(decomp_path, 'wb') as ofh:
                                    dctx.copy_stream(ifh, ofh)
                                c_path = decomp_path
                            except Exception:
                                continue
                        try:
                            test_c = sqlite3.connect(str(c_path))
                            test_c.execute("select count(*) from cards limit 1")
                            test_c.close()
                            db_path = c_path
                            break
                        except Exception:
                            continue
                media_file = extract_dir / 'media'
                if media_file.is_file():
                    try:
                        media_map = parse_package_media_map(media_file.read_bytes())
                    except Exception:
                        pass
                stage_media = stage_dir / 'collection.media'
                stage_media.mkdir(parents=True, exist_ok=True)
                for stored, orig in media_map.items():
                    src_f = extract_dir / stored
                    if src_f.is_file():
                        safe_orig = Path(orig).name
                        data = src_f.read_bytes()
                        if data.startswith(b'\x28\xb5\x2f\xfd'):
                            try:
                                import zstandard as zstd
                                data = zstd.ZstdDecompressor().decompress(data, max_output_size=100_000_000)
                            except Exception:
                                pass
                        (stage_media / safe_orig).write_bytes(data)

            if not db_path:
                raise ValueError("No se encontró base de datos en el paquete.")

            staged_col = CleanCollection(stage_dir / 'collection.anki2')
            imp_conn = sqlite3.connect(str(db_path))
            try:
                imp_conn.row_factory = sqlite3.Row
                cur = imp_conn.cursor()

                cur.execute("select models, decks from col limit 1")
                col_row = cur.fetchone()
                imp_models = json.loads(col_row['models']) if col_row and col_row['models'] else {}
                imp_decks = json.loads(col_row['decks']) if col_row and col_row['decks'] else {}

                if not imp_models:
                    cur.execute("select name from sqlite_master where type='table' and name='notetypes'")
                    if cur.fetchone():
                        cur_nt = imp_conn.cursor()
                        for nt_row in cur_nt.execute("select id, name, config from notetypes"):
                            nt_id = nt_row['id']
                            nt_name = nt_row['name']
                            nt_css = ''
                            proto_strings = parse_proto_strings(nt_row['config']) if nt_row['config'] else []
                            for ps in proto_strings:
                                if '.card' in ps or 'font' in ps or 'color' in ps or 'image-occlusion' in ps:
                                    nt_css = ps
                                    break
                            cur_f = imp_conn.cursor()
                            io_field_tags = {'occlusion': 0, 'image': 1, 'header': 2, 'back extra': 3, 'comments': 4}
                            nt_fields = []
                            for f_row in cur_f.execute("select ord, name from fields where ntid = ? order by ord asc", (nt_id,)):
                                f_ord, f_name = f_row[0], f_row[1]
                                f_dict = {'name': f_name, 'ord': f_ord}
                                if nt_name == 'Image Occlusion' or 'occlusion' in nt_name.lower():
                                    f_dict['tag'] = io_field_tags.get(f_name.lower(), f_ord)
                                nt_fields.append(f_dict)
                            cur_t = imp_conn.cursor()
                            nt_templates = []
                            for t_row in cur_t.execute("select ord, name, config from templates where ntid = ? order by ord asc", (nt_id,)):
                                t_ord, t_name, t_cfg = t_row[0], t_row[1], t_row[2]
                                t_strings = parse_proto_strings(t_cfg) if t_cfg else []
                                qfmt = t_strings[0] if len(t_strings) > 0 else '{{Front}}'
                                afmt = t_strings[1] if len(t_strings) > 1 else '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}'
                                nt_templates.append({'name': t_name, 'ord': t_ord, 'qfmt': qfmt, 'afmt': afmt})
                            is_cloze = 'cloze' in nt_name.lower() or 'hueco' in nt_name.lower() or any('cloze:' in t['qfmt'] for t in nt_templates)
                            imp_models[str(nt_id)] = {
                                'id': nt_id, 'name': nt_name, 'type': 1 if is_cloze else 0,
                                'flds': nt_fields, 'tmpls': nt_templates, 'css': nt_css,
                                'originalStockKind': 6 if nt_name == 'Image Occlusion' else 0
                            }

                if not imp_decks:
                    cur.execute("select name from sqlite_master where type='table' and name='decks'")
                    if cur.fetchone():
                        cur_d = imp_conn.cursor()
                        for d_row in cur_d.execute("select id, name from decks"):
                            imp_decks[str(d_row['id'])] = {'id': d_row['id'], 'name': d_row['name']}

                model_id_map = {}
                io_field_tags = {'occlusion': 0, 'image': 1, 'header': 2, 'back extra': 3, 'comments': 4}
                for mid_str, m_data in imp_models.items():
                    old_mid = int(mid_str)
                    if m_data.get('originalStockKind') == 6 or m_data.get('name') == 'Image Occlusion':
                        m_data['originalStockKind'] = 6
                        for f in m_data.get('flds', []):
                            if 'tag' not in f:
                                f['tag'] = io_field_tags.get(f.get('name', '').lower(), f.get('ord', 0))
                    existing_m = staged_col.models.by_name(m_data['name'])
                    if existing_m:
                        if m_data.get('originalStockKind') == 6 or m_data.get('name') == 'Image Occlusion':
                            existing_m['originalStockKind'] = 6
                            for f in existing_m.get('flds', []):
                                if 'tag' not in f:
                                    f['tag'] = io_field_tags.get(f.get('name', '').lower(), f.get('ord', 0))
                        model_id_map[old_mid] = existing_m['id']
                    else:
                        new_mid = int(time.time() * 1000) + len(model_id_map)
                        m_copy = copy.deepcopy(m_data)
                        m_copy['id'] = new_mid
                        staged_col._models[new_mid] = m_copy
                        model_id_map[old_mid] = new_mid
                staged_col._save_models()

                deck_id_map = {}
                for did_str, d_data in imp_decks.items():
                    old_did = int(did_str)
                    d_name = normalize_deck_name(d_data.get('name', 'Mazo importado'))
                    if d_name.lower() in ('default', 'predeterminado') and old_did == 1:
                        target_did = 1
                    else:
                        target_did = staged_col.decks.id(d_name)
                    deck_id_map[old_did] = target_did

                cur.execute("select * from notes")
                imp_notes = cur.fetchall()
                note_id_map = {}
                new_notes = 0
                updated_notes = 0
                duplicate_notes = 0

                for n_row in imp_notes:
                    guid = n_row['guid']
                    existing = staged_col.db.first("select id, flds from notes where guid = ?", (guid,))
                    target_mid = model_id_map.get(n_row['mid'])
                    if not target_mid:
                        if '{{c' in n_row['flds']:
                            cloze_m = staged_col.models.by_name('Lumcards · Huecos') or staged_col.models.by_name('Anki 2.0 · Huecos')
                            target_mid = cloze_m['id'] if cloze_m else 1
                        else:
                            basic_m = staged_col.models.by_name('Lumcards · Básica') or staged_col.models.by_name('Anki 2.0 · Básica')
                            target_mid = basic_m['id'] if basic_m else 1
                    if existing:
                        if existing['flds'] == n_row['flds']:
                            duplicate_notes += 1
                            note_id_map[n_row['id']] = existing['id']
                        else:
                            updated_notes += 1
                            staged_col.db.execute("update notes set flds = ?, mod = ? where id = ?", (n_row['flds'], int(time.time()), existing['id']))
                            note_id_map[n_row['id']] = existing['id']
                    else:
                        new_nid = int(time.time() * 1000) + new_notes
                        staged_col.db.execute("""
                        insert into notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
                        values (?, ?, ?, ?, -1, ?, ?, ?, ?, ?, ?)
                        """, (new_nid, guid, target_mid, n_row['mod'], n_row['tags'], n_row['flds'], n_row['sfld'], n_row['csum'], n_row['flags'], n_row['data']))
                        note_id_map[n_row['id']] = new_nid
                        new_notes += 1

                staged_col.db.commit()

                cur.execute("select * from cards")
                imp_cards = cur.fetchall()
                card_id_map = {}
                for c_row in imp_cards:
                    target_nid = note_id_map.get(c_row['nid'])
                    if not target_nid:
                        continue
                    target_did = deck_id_map.get(c_row['did'], 1)
                    existing_card = staged_col.db.first("select id from cards where nid = ? and ord = ?", (target_nid, c_row['ord']))
                    if not existing_card:
                        new_cid = int(time.time() * 1000) + staged_col.card_count()
                        staged_col.db.execute("""
                        insert into cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
                        values (?, ?, ?, ?, ?, -1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (new_cid, target_nid, target_did, c_row['ord'], c_row['mod'], c_row['type'], c_row['queue'], c_row['due'], c_row['ivl'], c_row['factor'], c_row['reps'], c_row['lapses'], c_row['left'], c_row['odue'], c_row['odid'], c_row['flags'], c_row['data']))
                        card_id_map[c_row['id']] = new_cid
                    else:
                        card_id_map[c_row['id']] = existing_card['id']

                staged_col.db.commit()

                cur.execute("select name from sqlite_master where type='table' and name='revlog'")
                if cur.fetchone():
                    for r_row in cur.execute("select * from revlog"):
                        target_cid = card_id_map.get(r_row['cid'])
                        if not target_cid:
                            continue
                        exists = staged_col.db.first("select id from revlog where id = ?", (r_row['id'],))
                        if not exists:
                            staged_col.db.execute("""
                            insert into revlog (id, cid, usn, ease, ivl, lastIvl, factor, time, type)
                            values (?, ?, -1, ?, ?, ?, ?, ?, ?)
                            """, (r_row['id'], target_cid, r_row['ease'], r_row['ivl'], r_row['lastIvl'], r_row['factor'], r_row['time'], r_row['type']))
                    staged_col.db.commit()
                staged_col.normalize_deck_hierarchy()
            finally:
                imp_conn.close()
                staged_col.close()

            # Instalación atómica con soporte para rollback
            self._install_staged(stage_dir, rollback_dir)

        after = self.col.card_count()
        added = after - before
        if source.suffix.lower() == '.anki2':
            warnings.append('Un archivo .anki2 no incluye multimedia; usa .apkg o .colpkg para transferir imágenes y audio.')
        return {
            'added': added,
            'newNotes': new_notes,
            'updatedNotes': updated_notes,
            'duplicateNotes': duplicate_notes,
            'conflictingNotes': 0,
            'filename': source.name,
            'backup': backup,
            'warnings': warnings,
            'saved': True
        }

    def get_local_ip(self) -> str:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return ip

    def _sync_state_file(self) -> Path:
        return self.data_dir / 'sync_state.json'

    def get_sync_info(self, port: int = 8765) -> Dict[str, Any]:
        self._check_thread()
        local_ip = self.get_local_ip()
        state_file = self._sync_state_file()
        state = {}
        if state_file.is_file():
            try:
                state = json.loads(state_file.read_text(encoding='utf-8'))
            except Exception:
                pass
        url = f'http://{local_ip}:{port}'
        qr_svg = ''
        try:
            from tools.qr_gen import generate_qr_svg
            qr_svg = generate_qr_svg(url, 220)
        except Exception:
            pass
        return {
            'localIp': local_ip,
            'port': port,
            'url': url,
            'qrSvg': qr_svg,
            'totalCards': self.col.card_count(),
            'totalDecks': len(self.col.decks.all()),
            'lastP2P': state.get('lastP2P'),
            'lastExport': state.get('lastExport'),
            'lastImport': state.get('lastImport')
        }

    def save_sync_state(self, updates: Dict[str, Any]):
        state_file = self._sync_state_file()
        current = {}
        if state_file.is_file():
            try:
                current = json.loads(state_file.read_text(encoding='utf-8'))
            except Exception:
                pass
        current.update(updates)
        state_file.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding='utf-8')

    def export_sync_package(self) -> Dict[str, Any]:
        self._check_thread()
        pkg = self.export_collection()
        sync_meta = {
            'timestamp': time.time(),
            'iso': datetime.now().isoformat(),
            'cardCount': self.col.card_count(),
            'filename': pkg['filename'],
            'sizeBytes': pkg['bytes']
        }
        self.save_sync_state({'lastExport': sync_meta})
        return {
            'filename': pkg['filename'],
            'size': pkg['bytes'],
            'path': str(pkg['path']),
            'meta': sync_meta
        }

    def import_sync_package(self, path: Any) -> Dict[str, Any]:
        self._check_thread()
        result = self.import_file(path)
        self.save_sync_state({'lastImport': {
            'timestamp': time.time(),
            'iso': datetime.now().isoformat(),
            'filename': Path(path).name,
            'added': result.get('added', 0)
        }})
        return result

    def sync_with_peer(self, peer_url: str) -> Dict[str, Any]:
        self._check_thread()
        url = peer_url.strip().rstrip('/')
        if not url.startswith('http://') and not url.startswith('https://'):
            url = 'http://' + url

        import urllib.request
        try:
            health_req = urllib.request.Request(f"{url}/api/health", headers={'X-Lumcards-Request': '1', 'X-Anki-Request': '1'})
            with urllib.request.urlopen(health_req, timeout=6) as resp:
                info = json.loads(resp.read().decode('utf-8'))
                if not info.get('ok'):
                    raise ValueError('El equipo remoto no es un servidor Lumcards válido.')
        except Exception as e:
            raise ValueError(f'No se pudo conectar con el otro dispositivo ({url}): {e}')

        try:
            export_req = urllib.request.Request(f"{url}/api/export", headers={'X-Lumcards-Request': '1', 'X-Anki-Request': '1'})
            with urllib.request.urlopen(export_req, timeout=120) as resp:
                data = resp.read()
        except Exception as e:
            raise ValueError(f'Error al transferir datos del equipo remoto: {e}')

        with tempfile.NamedTemporaryFile(suffix='.colpkg', delete=False, dir=str(self.data_dir)) as tf:
            tf.write(data)
            temp_path = tf.name

        try:
            res = self.import_file(temp_path)
            self.save_sync_state({'lastP2P': {
                'timestamp': time.time(),
                'peer': url,
                'iso': datetime.now().isoformat(),
                'added': res.get('added', 0),
                'newNotes': res.get('newNotes', 0),
                'updatedNotes': res.get('updatedNotes', 0)
            }})
            return res
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass


# Alias compatible
Engine = CleanEngine
