"""Anki 2.0's local storage adapter, backed by the official Anki library.

All methods must be called on the thread which constructed Engine. Package imports
are merged in a disposable collection and installed only after a successful import.
"""
from __future__ import annotations

import html
import importlib.metadata
import os
from pathlib import Path
import re
import shutil
import sqlite3
import tempfile
import threading
from contextlib import closing
from datetime import date, datetime, timedelta
from html.parser import HTMLParser
from urllib.parse import quote

from anki._backend import RustBackend
from anki.collection import Collection, ExportAnkiPackageOptions, ImportAnkiPackageOptions, ImportAnkiPackageRequest
from anki.cards import Card
from anki.config import Config
from anki.media import media_paths_from_col_path
from anki.sound import SoundOrVideoTag
from PIL import Image
from native_image_occlusion import MediaAsset, render_native_image_occlusion


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


def plain_text(value):
    parser = _Text()
    parser.feed(value)
    return re.sub(r'\s+', ' ', re.sub(r'\[anki:play:[^]]+\]', '', ''.join(parser.parts))).strip()


class Engine:
    MODEL_NAME = 'Lumcards · Básica'
    FILES = ('collection.anki2', 'collection.media', 'collection.media.db2')

    def __init__(self, data_dir):
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
        elif self.col.card_count():
            daily = self.backup_dir / f'inicio-{date.today().isoformat()}.colpkg'
            if not daily.exists():
                self.export_collection(daily)

    def _check_thread(self):
        if threading.get_ident() != self._thread_id:
            raise RuntimeError('El motor Anki debe utilizarse desde un único hilo.')

    def _open(self):
        self.col = Collection(str(self.collection_path))
        self.media_dir = Path(self.col.media.dir())
        if self.col.sched_ver() != 2:
            self.col.upgrade_to_v2_scheduler()
        if not self.col.v3_scheduler():
            self.col.set_v3_scheduler(True)
        # Existing LaTeX media still renders; never launch local TeX subprocesses.
        self.col.set_config_bool(Config.Bool.RENDER_LATEX, False)
        self._active = None

    def close(self):
        self._check_thread()
        self.col.close()

    def _model(self):
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

    def _deck_id(self, deck_id):
        try:
            deck_id = int(deck_id)
        except (TypeError, ValueError):
            raise ValueError('Selecciona un mazo válido.')
        if not self.col.decks.get(deck_id, default=False):
            raise ValueError('El mazo no existe.')
        return deck_id

    def _get_card(self, card_id):
        try:
            return self.col.get_card(int(card_id))
        except Exception as exc:
            raise ValueError('La tarjeta no existe.') from exc

    def _stars(self):
        return set(self.col.get_config('anki2.starred', []))

    def _av_html(self, rendered, question_tags, answer_tags=()):
        def replace(match):
            tags = question_tags if match.group(1) == 'q' else answer_tags
            idx = int(match.group(2))
            if idx >= len(tags) or not isinstance(tags[idx], SoundOrVideoTag):
                return '<span class="anki-audio-unavailable">[Voz del sistema no disponible]</span>'
            name = tags[idx].filename
            if Path(name).name != name or '/' in name or '\\' in name:
                return '[Audio no disponible]'
            kind = 'video' if Path(name).suffix.lower() in ('.mp4', '.webm', '.mov', '.m4v') else 'audio'
            return f'<{kind} controls preload="none" src="/media/{quote(name, safe="")}"></{kind}>'
        return re.sub(r'\[anki:play:([qa]):(\d+)\]', replace, rendered)

    def _card_data(self, card, due_ids=None, stars=None):
        note = card.note()
        model = note.note_type()
        renderer_css = model['css']
        try:
            rendered = card.render_output()
            front = self._av_html(rendered.question_and_style(), rendered.question_av_tags)
            back = self._av_html(rendered.answer_and_style(), rendered.question_av_tags, rendered.answer_av_tags)
            render_error = None
            if 'image-occlusion-canvas' in front or 'anki.imageOcclusion' in front:
                render_error = 'Esta tarjeta de oclusión de imagen necesita Anki de escritorio para ocultar correctamente las zonas de la imagen.'
                front = '<p>' + render_error + '</p>'
                back = front
            question_audios = []
            answer_audios = []
            for t in getattr(rendered, 'question_av_tags', []):
                if isinstance(t, SoundOrVideoTag) and t.filename:
                    question_audios.append(quote(t.filename, safe=''))
            for t in getattr(rendered, 'answer_av_tags', []):
                if isinstance(t, SoundOrVideoTag) and t.filename:
                    answer_audios.append(quote(t.filename, safe=''))
            if not question_audios:
                for m in re.finditer(r'src=["\']/media/([^"\']+\.(?:mp3|wav|ogg|m4a|aac))["\']', front, re.IGNORECASE):
                    if m.group(1) not in question_audios:
                        question_audios.append(m.group(1))
            if not answer_audios:
                for m in re.finditer(r'src=["\']/media/([^"\']+\.(?:mp3|wav|ogg|m4a|aac))["\']', back, re.IGNORECASE):
                    if m.group(1) not in answer_audios and m.group(1) not in question_audios:
                        answer_audios.append(m.group(1))
        except Exception:
            front = html.escape(note.fields[0] if note.fields else '')
            back = '<p>Esta plantilla necesita funciones de Anki de escritorio.</p>'
            render_error = 'Plantilla no compatible con el visor local.'
            question_audios = []
            answer_audios = []
        if model.get('originalStockKind') == 6:
            result = render_native_image_occlusion(model, note.fields, card.ord, self._image_asset)
            # Always override native IO, including unsupported input. Never expose
            # the unmasked fallback or imported CSS capable of hiding the masks.
            front, back = result.front, result.back
            render_error = None if result.supported else result.reason
            renderer_css = '.card { font-family: Arial, sans-serif; background: white; color: #263348; font-size: 22px; line-height: 1.6; } .io-header { margin-bottom: 18px; } .io-extra { margin-top: 18px; }'
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

    def _image_asset(self, filename):
        path = self.media_dir / filename
        if not path.is_file() or path.resolve().parent != self.media_dir.resolve():
            return None
        try:
            with Image.open(path) as picture:
                width, height = picture.size
                if not 1 <= width <= 20000 or not 1 <= height <= 20000 or width * height > 80_000_000:
                    return None
                picture.verify()
            with Image.open(path) as picture:
                if picture.getexif().get(274, 1) != 1:
                    return None
            return MediaAsset('/media/' + quote(filename, safe=''), width, height)
        except Exception:
            return None

    def _stats(self, due_today):
        cutoff = self.col.sched.day_cutoff
        day_start = cutoff - 86400
        # Count actual answers, excluding manual rescheduling entries (ease 0).
        offset_secs = day_start % 86400
        today_index = (day_start - offset_secs) // 86400
        rows = self.col.db.all('select cast((id / 1000 - ?) / 86400 as integer), count(*) from revlog where ease between 1 and 4 group by 1', offset_secs)
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
        answered, remembered = self.col.db.first('select count(*), coalesce(sum(ease > 1), 0) from revlog where id >= ? and ease between 1 and 4', (day_start - 29 * 86400) * 1000)
        return {
            'totalCards': self.col.card_count(), 'dueToday': due_today,
            'reviewedToday': day_counts.get(today_key, 0), 'streak': streak,
            'retention': round(100 * remembered / answered) if answered else None,
            'activity': [{'date': (today - timedelta(days=i)).isoformat(), 'count': day_counts.get((today - timedelta(days=i)).isoformat(), 0)} for i in range(83, -1, -1)],
        }

    def get_detailed_stats(self, deck_id=None, year=None):
        self._check_thread()
        cutoff = self.col.sched.day_cutoff
        day_start = cutoff - 86400
        offset_secs = day_start % 86400
        today_index = (day_start - offset_secs) // 86400
        today_date = date.fromtimestamp(day_start)
        target_year = int(year) if year else today_date.year

        dids = None
        did_clause = ""
        cid_clause = ""
        deck_name = "Toda la colección"
        if deck_id not in (None, '', 'all', 0, '0'):
            did = self._deck_id(deck_id)
            dids = set(self.col.decks.deck_and_child_ids(did))
            deck_name = self.col.decks.name(did)
            dids_str = ','.join(map(str, dids))
            did_clause = f"and did in ({dids_str})"
            cid_clause = f"and cid in (select id from cards where did in ({dids_str}))"

        # 1. Hoy
        today_start_ms = day_start * 1000
        today_row = self.col.db.first(
            f"select count(*), coalesce(sum(time), 0), coalesce(sum(case when ease > 1 then 1 else 0 end), 0), "
            f"coalesce(sum(case when type = 1 then 1 else 0 end), 0), "
            f"coalesce(sum(case when type in (0, 2) then 1 else 0 end), 0) "
            f"from revlog where id >= ? and ease between 1 and 4 {cid_clause}",
            today_start_ms
        )
        today_count = today_row[0] or 0
        today_time_ms = today_row[1] or 0
        today_time_secs = round(today_time_ms / 1000)
        today_learned = today_row[2] or 0
        today_reviews = today_row[3] or 0
        today_learn_relearn = today_row[4] or 0
        today_stats = {
            'cardsStudied': today_count,
            'timeSeconds': today_time_secs,
            'timeMinutes': round(today_time_secs / 60, 1),
            'avgSecondsPerCard': round(today_time_secs / today_count, 1) if today_count else 0,
            'retentionToday': round(100 * today_learned / today_count) if today_count else None,
            'reviewCount': today_reviews,
            'learnCount': today_learn_relearn,
        }

        # 2. Pronóstico
        today_sched = self.col.sched.today
        forecast_rows = self.col.db.all(
            f"select due - ?, count(*) from cards where queue = 2 {did_clause} group by 1",
            today_sched
        )
        day_learn_count = self.col.db.scalar(f"select count(*) from cards where queue = 3 {did_clause}") or 0

        forecast_map = {}
        for delta, count in forecast_rows:
            day_num = max(0, int(delta))
            forecast_map[day_num] = forecast_map.get(day_num, 0) + count
        if day_learn_count:
            forecast_map[0] = forecast_map.get(0, 0) + day_learn_count

        forecast_30 = [{'day': d, 'due': forecast_map.get(d, 0)} for d in range(31)]
        forecast_90 = [{'day': d, 'due': forecast_map.get(d, 0)} for d in range(91)]
        forecast_365 = [{'day': d, 'due': forecast_map.get(d, 0)} for d in range(366)]
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

        # 3. Calendario anual
        year_start = date(target_year, 1, 1)
        year_end = date(target_year, 12, 31)
        rev_rows = self.col.db.all(
            f"select cast((id / 1000 - ?) / 86400 as integer), count(*), coalesce(sum(time), 0) "
            f"from revlog where ease between 1 and 4 {cid_clause} group by 1",
            offset_secs
        )
        activity_by_date = {}
        for day_index, count, time_ms in rev_rows:
            offset = day_index - today_index
            iso = (today_date + timedelta(days=offset)).isoformat()
            activity_by_date[iso] = {'count': count, 'timeSeconds': round(time_ms / 1000)}

        calendar_days = []
        cur_day = year_start
        total_year_reviews = 0
        total_year_days_studied = 0
        while cur_day <= year_end:
            iso = cur_day.isoformat()
            act = activity_by_date.get(iso, {'count': 0, 'timeSeconds': 0})
            if act['count'] > 0:
                total_year_reviews += act['count']
                total_year_days_studied += 1
            calendar_days.append({
                'date': iso,
                'dayOfWeek': (cur_day.weekday() + 1) % 7,  # 0=Sunday, 1=Monday... 6=Saturday (matches D, L, M, X, J, V, S)
                'count': act['count'],
                'timeSeconds': act['timeSeconds'],
            })
            cur_day += timedelta(days=1)

        calendar_stats = {
            'year': target_year,
            'availableYears': sorted(list({int(iso[:4]) for iso in activity_by_date.keys()} | {today_date.year, target_year})),
            'days': calendar_days,
            'totalReviews': total_year_reviews,
            'daysStudied': total_year_days_studied,
        }

        # 4. Historial de repasos pasados
        history_30 = []
        for i in range(30, -1, -1):
            cur = today_date - timedelta(days=i)
            act = activity_by_date.get(cur.isoformat(), {'count': 0, 'timeSeconds': 0})
            history_30.append({'date': cur.isoformat(), 'daysAgo': -i, 'reviews': act['count'], 'timeMinutes': round(act['timeSeconds'] / 60, 1)})
        history_90 = []
        for i in range(90, -1, -1):
            cur = today_date - timedelta(days=i)
            act = activity_by_date.get(cur.isoformat(), {'count': 0, 'timeSeconds': 0})
            history_90.append({'date': cur.isoformat(), 'daysAgo': -i, 'reviews': act['count'], 'timeMinutes': round(act['timeSeconds'] / 60, 1)})
        history_365 = []
        for i in range(365, -1, -1):
            cur = today_date - timedelta(days=i)
            act = activity_by_date.get(cur.isoformat(), {'count': 0, 'timeSeconds': 0})
            history_365.append({'date': cur.isoformat(), 'daysAgo': -i, 'reviews': act['count'], 'timeMinutes': round(act['timeSeconds'] / 60, 1)})

        studied_30 = sum(1 for h in history_30 if h['reviews'] > 0)
        total_reviews_30 = sum(h['reviews'] for h in history_30)
        total_minutes_30 = sum(h['timeMinutes'] for h in history_30)

        history_stats = {
            'days30': history_30,
            'days90': history_90,
            'days365': history_365,
            'daysStudied30': studied_30,
            'pctDaysStudied30': round(100 * studied_30 / 31, 1),
            'totalReviews30': total_reviews_30,
            'totalMinutes30': round(total_minutes_30, 1),
            'avgReviewsPerDay30': round(total_reviews_30 / 31, 1),
            'avgReviewsPerStudiedDay30': round(total_reviews_30 / studied_30, 1) if studied_30 else 0,
        }

        # 5. Conteo de Tarjetas
        card_row = self.col.db.first(
            f"select count(*), "
            f"sum(case when type = 0 and queue != -1 then 1 else 0 end), "
            f"sum(case when type = 1 and queue != -1 then 1 else 0 end), "
            f"sum(case when type = 3 and queue != -1 then 1 else 0 end), "
            f"sum(case when type = 2 and ivl < 21 and queue != -1 then 1 else 0 end), "
            f"sum(case when type = 2 and ivl >= 21 and queue != -1 then 1 else 0 end), "
            f"sum(case when queue = -1 then 1 else 0 end), "
            f"sum(case when queue in (-2, -3) then 1 else 0 end) "
            f"from cards where 1=1 {did_clause}"
        )
        total_cards = card_row[0] or 0
        new_cnt = card_row[1] or 0
        learn_cnt = card_row[2] or 0
        relearn_cnt = card_row[3] or 0
        young_cnt = card_row[4] or 0
        mature_cnt = card_row[5] or 0
        suspended_cnt = card_row[6] or 0
        buried_cnt = card_row[7] or 0

        def pct(val):
            return round(100 * val / total_cards, 2) if total_cards else 0.0

        card_breakdown = {
            'total': total_cards,
            'new': {'count': new_cnt, 'pct': pct(new_cnt), 'label': 'Nuevas', 'color': '#5bb1e8'},
            'learning': {'count': learn_cnt, 'pct': pct(learn_cnt), 'label': 'Aprendiendo', 'color': '#f97316'},
            'relearning': {'count': relearn_cnt, 'pct': pct(relearn_cnt), 'label': 'Reaprendiendo', 'color': '#ef4444'},
            'young': {'count': young_cnt, 'pct': pct(young_cnt), 'label': 'Jóvenes', 'color': '#86efac'},
            'mature': {'count': mature_cnt, 'pct': pct(mature_cnt), 'label': 'Maduras', 'color': '#22c55e'},
            'suspended': {'count': suspended_cnt, 'pct': pct(suspended_cnt), 'label': 'Suspendidas', 'color': '#eab308'},
            'buried': {'count': buried_cnt, 'pct': pct(buried_cnt), 'label': 'Enterradas', 'color': '#94a3b8'},
        }

        # 6. Intervalos de Repaso
        interval_rows = self.col.db.all(
            f"select ivl, count(*) from cards where queue = 2 {did_clause} group by ivl order by ivl"
        )
        avg_ivl = self.col.db.scalar(f"select avg(ivl) from cards where queue = 2 {did_clause}") or 0
        max_ivl = self.col.db.scalar(f"select max(ivl) from cards where queue = 2 {did_clause}") or 0
        intervals_data = {
            'distribution': [{'interval': ivl, 'count': cnt} for ivl, cnt in interval_rows],
            'avgInterval': round(avg_ivl, 1),
            'maxInterval': int(max_ivl),
            'totalReviewCards': sum(cnt for _, cnt in interval_rows),
        }

        # 7. Facilidad de la Tarjeta
        factor_rows = self.col.db.all(
            f"select factor, count(*) from cards where queue = 2 {did_clause} and factor > 0 group by factor order by factor"
        )
        avg_factor = self.col.db.scalar(f"select avg(factor) from cards where queue = 2 {did_clause} and factor > 0") or 0
        ease_data = {
            'distribution': [{'factor': round(f / 10), 'count': cnt} for f, cnt in factor_rows],
            'avgEase': round(avg_factor / 10, 1) if avg_factor else 250.0,
            'totalCardsWithEase': sum(cnt for _, cnt in factor_rows),
        }

        # 8. Retención Actual y Tabla de Retención
        young_ret = self.col.db.first(
            f"select count(*), coalesce(sum(case when ease > 1 then 1 else 0 end), 0) "
            f"from revlog where ease between 1 and 4 and lastIvl < 21 and lastIvl >= 1 {cid_clause}"
        )
        mature_ret = self.col.db.first(
            f"select count(*), coalesce(sum(case when ease > 1 then 1 else 0 end), 0) "
            f"from revlog where ease between 1 and 4 and lastIvl >= 21 {cid_clause}"
        )
        all_ret = self.col.db.first(
            f"select count(*), coalesce(sum(case when ease > 1 then 1 else 0 end), 0) "
            f"from revlog where ease between 1 and 4 and lastIvl >= 1 {cid_clause}"
        )

        def calc_ret(row):
            tot = row[0] or 0
            correct = row[1] or 0
            return {'total': tot, 'correct': correct, 'rate': round(100 * correct / tot, 1) if tot else None}

        retention_data = {
            'young': calc_ret(young_ret),
            'mature': calc_ret(mature_ret),
            'all': calc_ret(all_ret),
        }

        # 9. Procesamiento de Revlog del último año para Distribución Horaria, Botones y Tabla de Retención
        year_cutoff_ms = today_start_ms - 365 * 86400 * 1000
        revlog_rows = self.col.db.all(
            f"select id, ease, type, lastIvl from revlog "
            f"where ease between 1 and 4 and id >= ? {cid_clause} order by id",
            year_cutoff_ms
        )

        # 9.1 Tabla de Retención por Períodos
        cutoff_today = today_start_ms
        cutoff_yesterday = today_start_ms - 86400 * 1000
        cutoff_week = today_start_ms - 7 * 86400 * 1000
        cutoff_month = today_start_ms - 30 * 86400 * 1000
        cutoff_year = year_cutoff_ms

        ret_buckets = {
            'today': {'young_tot': 0, 'young_cor': 0, 'mat_tot': 0, 'mat_cor': 0, 'all_tot': 0, 'all_cor': 0, 'label': 'Hoy'},
            'yesterday': {'young_tot': 0, 'young_cor': 0, 'mat_tot': 0, 'mat_cor': 0, 'all_tot': 0, 'all_cor': 0, 'label': 'Ayer'},
            'week': {'young_tot': 0, 'young_cor': 0, 'mat_tot': 0, 'mat_cor': 0, 'all_tot': 0, 'all_cor': 0, 'label': 'La semana pasada'},
            'month': {'young_tot': 0, 'young_cor': 0, 'mat_tot': 0, 'mat_cor': 0, 'all_tot': 0, 'all_cor': 0, 'label': 'El mes pasado'},
            'year': {'young_tot': 0, 'young_cor': 0, 'mat_tot': 0, 'mat_cor': 0, 'all_tot': 0, 'all_cor': 0, 'label': 'El año pasado'},
        }

        # 9.2 Distribución Horaria (0..23) para 30, 90, 365 días
        hourly_30 = [{'hour': h, 'reviews': 0, 'correct': 0} for h in range(24)]
        hourly_90 = [{'hour': h, 'reviews': 0, 'correct': 0} for h in range(24)]
        hourly_365 = [{'hour': h, 'reviews': 0, 'correct': 0} for h in range(24)]

        # 9.3 Botones de Respuesta para 30, 90, 365 días
        def empty_buttons():
            return {
                'learning': {1: 0, 2: 0, 3: 0, 4: 0},
                'young': {1: 0, 2: 0, 3: 0, 4: 0},
                'mature': {1: 0, 2: 0, 3: 0, 4: 0}
            }
        buttons_30 = empty_buttons()
        buttons_90 = empty_buttons()
        buttons_365 = empty_buttons()

        for rid, ease, rtype, lastIvl in revlog_rows:
            dt = datetime.fromtimestamp(rid / 1000.0)
            h = dt.hour
            is_correct = 1 if ease > 1 else 0

            # Categoría para botones y retención
            is_learning = (rtype in (0, 2)) or (lastIvl < 1)
            is_young = not is_learning and (lastIvl < 21)
            is_mature = not is_learning and (lastIvl >= 21)

            # Botones
            cat = 'learning' if is_learning else ('young' if is_young else 'mature')
            if rid >= cutoff_month:
                buttons_30[cat][ease] += 1
                hourly_30[h]['reviews'] += 1
                if is_correct:
                    hourly_30[h]['correct'] += 1
            if rid >= (today_start_ms - 90 * 86400 * 1000):
                buttons_90[cat][ease] += 1
                hourly_90[h]['reviews'] += 1
                if is_correct:
                    hourly_90[h]['correct'] += 1
            buttons_365[cat][ease] += 1
            hourly_365[h]['reviews'] += 1
            if is_correct:
                hourly_365[h]['correct'] += 1

            # Tabla de retención (solo tarjetas con intervalo >= 1 día)
            if lastIvl >= 1:
                periods = []
                if rid >= cutoff_today:
                    periods.append('today')
                elif rid >= cutoff_yesterday and rid < cutoff_today:
                    periods.append('yesterday')
                if rid >= cutoff_week:
                    periods.append('week')
                if rid >= cutoff_month:
                    periods.append('month')
                periods.append('year')

                for p in periods:
                    b = ret_buckets[p]
                    b['all_tot'] += 1
                    if is_correct:
                        b['all_cor'] += 1
                    if is_young:
                        b['young_tot'] += 1
                        if is_correct:
                            b['young_cor'] += 1
                    elif is_mature:
                        b['mat_tot'] += 1
                        if is_correct:
                            b['mat_cor'] += 1

        def fmt_rate(cor, tot):
            return f"{round(100.0 * cor / tot, 1)}%" if tot > 0 else "N/A"

        retention_table = []
        for key in ('today', 'yesterday', 'week', 'month', 'year'):
            b = ret_buckets[key]
            retention_table.append({
                'key': key,
                'label': b['label'],
                'young': fmt_rate(b['young_cor'], b['young_tot']),
                'youngNum': round(100.0 * b['young_cor'] / b['young_tot'], 1) if b['young_tot'] else None,
                'mature': fmt_rate(b['mat_cor'], b['mat_tot']),
                'matureNum': round(100.0 * b['mat_cor'] / b['mat_tot'], 1) if b['mat_tot'] else None,
                'total': fmt_rate(b['all_cor'], b['all_tot']),
                'totalNum': round(100.0 * b['all_cor'] / b['all_tot'], 1) if b['all_tot'] else None,
                'count': b['all_tot']
            })

        for hl in (hourly_30, hourly_90, hourly_365):
            for it in hl:
                it['rate'] = round(100.0 * it['correct'] / it['reviews'], 1) if it['reviews'] > 0 else None

        hourly_data = {
            'days30': hourly_30,
            'days90': hourly_90,
            'days365': hourly_365,
        }

        button_data = {
            'days30': buttons_30,
            'days90': buttons_90,
            'days365': buttons_365,
        }

        # 10. Tarjetas Añadidas
        card_created_rows = self.col.db.all(
            f"select cast((id / 1000 - ?) / 86400 as integer), count(*) from cards "
            f"where 1=1 {did_clause} group by 1 order by 1",
            offset_secs
        )
        added_by_date = {}
        for day_index, count in card_created_rows:
            offset = day_index - today_index
            iso = (today_date + timedelta(days=offset)).isoformat()
            added_by_date[iso] = count

        def build_added_series(days):
            series = []
            if days is not None:
                for i in range(days, -1, -1):
                    iso = (today_date - timedelta(days=i)).isoformat()
                    cnt = added_by_date.get(iso, 0)
                    series.append({'date': iso, 'count': cnt})
            else:
                for iso in sorted(added_by_date.keys()):
                    series.append({'date': iso, 'count': added_by_date[iso]})
            tot = sum(item['count'] for item in series)
            return {'total': tot, 'series': series}

        added_data = {
            'days30': build_added_series(30),
            'days90': build_added_series(90),
            'days365': build_added_series(365),
            'all': build_added_series(None),
        }

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
            'hourly': hourly_data,
            'buttonPresses': button_data,
            'addedCards': added_data,
        }

    def state(self, include_cards=True):
        self._check_thread()
        stars = self._stars()
        cards = []
        if include_cards:
            due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
            cards = [self._card_data(self.col.get_card(cid), due_ids, stars) for cid in self.col.find_cards('')]
        deck_counts = {did: (total, learned) for did, total, learned in self.col.db.all('select did, count(*), sum(type != 0) from cards group by did')}
        tree = self.col.sched.deck_due_tree()
        tree_by_id = {}
        def walk(node):
            tree_by_id[node.deck_id] = node
            for child in node.children:
                walk(child)
        walk(tree)
        decks = []
        for deck in self.col.decks.all_names_and_ids():
            node = tree_by_id.get(deck.id)
            total = node.total_including_children if node else deck_counts.get(deck.id, (0, 0))[0]
            if deck.id == 1 and not total:
                continue
            dids = set(self.col.decks.deck_and_child_ids(deck.id))
            parts = deck.name.split('::')
            has_children = len(dids) > 1
            decks.append({
                'id': deck.id, 'name': deck.name, 'total': total, 'childIds': sorted(dids),
                'due': node.review_count + node.learn_count + node.new_count if node else 0,
                'new': node.new_count if node else 0,
                'learned': sum(deck_counts.get(did, (0, 0))[1] for did in dids),
                'shortName': parts[-1],
                'parentName': '::'.join(parts[:-1]) if len(parts) > 1 else '',
                'isFolder': has_children,
                'level': len(parts) - 1,
            })
        due_today = sum(n.review_count + n.learn_count + n.new_count for n in tree.children)
        return {
            'decks': decks, 'cards': cards, 'cardsIncluded': bool(include_cards),
            'counts': {'totalCards': self.col.card_count(), 'starredCards': self._count_existing_stars(stars)},
            'settings': self.settings(), 'stats': self._stats(due_today),
            'storage': {'dataDir': str(self.data_dir), 'collectionPath': str(self.collection_path), 'mediaDir': str(self.media_dir), 'backupDir': str(self.backup_dir)},
            'engine': {'name': 'Anki', 'version': importlib.metadata.version('anki'), 'scheduler': 'Anki v3'},
        }

    def _count_existing_stars(self, stars):
        if not stars:
            return 0
        # Chunk IDs to keep query size bounded when many cards are starred.
        ids = sorted(int(cid) for cid in stars)
        return sum(len(self.col.find_cards('cid:' + ','.join(map(str, ids[start:start + 500])))) for start in range(0, len(ids), 500))

    def _card_metadata(self, card, due_ids, stars):
        """Browse previews are source-field excerpts, never rendered answers."""
        note = card.note()
        model = note.note_type()
        def excerpt(value):
            # Bound work even when an imported note contains a very large field.
            text = plain_text(value[:8192])
            return text[:240] + ('…' if len(text) > 240 or len(value) > 8192 else '')
        templates = model['tmpls']
        template = templates[0] if model['type'] == 1 else templates[min(card.ord, len(templates) - 1)]
        return {
            'id': card.id, 'noteId': note.id, 'deckId': card.did,
            'frontText': excerpt(note.fields[0]) if note.fields else '',
            'backText': excerpt(note.fields[1]) if len(note.fields) > 1 else '',
            'previewKind': 'source-fields', 'tags': list(note.tags),
            'modelName': model['name'], 'modelId': model['id'],
            'templateName': template['name'], 'templateIndex': card.ord,
            'fieldCount': len(note.fields), 'editable': True, 'editMode': 'fields',
            'simpleEditable': model['name'] == self.MODEL_NAME and len(note.fields) == 2,
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

    def browse_cards(self, query='', deck_id=None, starred=False, offset=0, limit=50):
        self._check_thread()
        try:
            offset, limit = int(offset), int(limit)
        except (TypeError, ValueError):
            raise ValueError('La página solicitada no es válida.')
        if offset < 0 or not 1 <= limit <= 100:
            raise ValueError('Usa un desplazamiento desde 0 y entre 1 y 100 tarjetas por página.')
        query = str(query or '').strip()
        if len(query) > 4000:
            raise ValueError('La búsqueda es demasiado larga.')
        # The query deliberately supports Anki's native search syntax, including
        # tag:, is:, prop:, wildcards, phrases, and logical operators.
        clauses = ['(' + query + ')'] if query else []
        if deck_id not in (None, '', 'all'):
            did = self._deck_id(deck_id)
            children = self.col.decks.deck_and_child_ids(did)
            clauses.append('(' + ' OR '.join('did:' + str(child) for child in children) + ')')
        search = ' '.join(clauses)
        try:
            ids = list(self.col.find_cards(search))
        except Exception as exc:
            raise ValueError('La búsqueda no es válida. Revisa las comillas y los filtros de Anki.') from exc
        stars = self._stars()
        if starred:
            ids = [cid for cid in ids if cid in stars]
        # find_cards returns IDs only. Only this page loads notes and metadata;
        # no template rendering or card HTML is generated for browse results.
        ids.sort(reverse=True)
        total = len(ids)
        page_ids = ids[offset:offset + limit]
        page_filter = 'cid:' + ','.join(map(str, page_ids)) if page_ids else ''
        due_ids = set(self.col.find_cards(page_filter + ' (is:due OR is:new) -is:suspended -is:buried')) if page_ids else set()
        cards = [self._card_metadata(self.col.get_card(cid), due_ids, stars) for cid in page_ids]
        return {'cards': cards, 'total': total, 'offset': offset, 'limit': limit, 'hasMore': offset + len(cards) < total, 'query': query}

    def card_detail(self, id):
        self._check_thread()
        card = self._get_card(id)
        due_ids = set(self.col.find_cards(f'cid:{card.id} (is:due OR is:new) -is:suspended -is:buried'))
        return self._card_data(card, due_ids=due_ids)

    @staticmethod
    def _validate_fields(fields, count):
        if not isinstance(fields, list) or len(fields) != count or any(not isinstance(value, str) for value in fields):
            raise ValueError(f'La nota requiere exactamente {count} campos de texto, en el orden original.')
        if not any(value.strip() for value in fields):
            raise ValueError('La nota debe conservar al menos un campo con contenido.')
        return list(fields)

    def edit_note_fields(self, card_id, fields, tags=''):
        self._check_thread()
        card = self._get_card(card_id)
        note = card.note()
        model = note.note_type()
        values = self._validate_fields(fields, len(model['flds']))
        before_ids = set(self.col.card_ids_of_note(note.id))
        # Keep GUID, note type, original field order, card templates and scheduler
        # data. Native update_note also creates newly-required sibling cards.
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
                warnings.append('Se conservaron tarjetas sin su hueco original para proteger su historial. Puedes restaurar esos huecos o gestionar las tarjetas vacías en Anki de escritorio.')
        return {
            'saved': True, 'noteId': note.id, 'cardIds': after_ids,
            'createdCards': len(set(after_ids) - before_ids), 'siblingCount': len(after_ids),
            'emptyCardIds': empty_cloze_ids, 'warnings': warnings,
            'card': self.card_detail(card.id if card.id in after_ids else after_ids[0]),
        }

    def _model_for_kind(self, kind):
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

    def create_note(self, deck_id, kind, fields, tags=''):
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

    def get_models(self):
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

    def update_model_template(self, model_id, template_index, qfmt, afmt, css=None):
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
        return {'saved': True}

    def settings(self):
        return {'dailyGoal': self.col.get_config('anki2.dailyGoal', 20)}

    def update_settings(self, dailyGoal=None, **kwargs):
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
        return self.settings()

    def add_deck(self, name):
        self._check_thread()
        name = str(name).strip()
        if not name or len(name) > 120:
            raise ValueError('Escribe un nombre de mazo de entre 1 y 120 caracteres.')
        did = self.col.decks.id(name)
        self._active = None
        return {'id': did, 'name': self.col.decks.name(did)}

    def create_folder(self, name):
        return self.add_deck(name)

    def rename_deck(self, deck_id, new_name):
        self._check_thread()
        did = self._deck_id(deck_id)
        new_name = str(new_name).strip()
        if not new_name or len(new_name) > 120:
            raise ValueError('Escribe un nombre de entre 1 y 120 caracteres.')
        deck = self.col.decks.get(did)
        self.col.decks.rename(deck, new_name)
        self._active = None
        return {'id': did, 'name': self.col.decks.name(did)}

    def move_deck(self, deck_id, parent_id=None):
        self._check_thread()
        did = self._deck_id(deck_id)
        if parent_id in (None, '', 0, '0', 'root'):
            self.col.decks.reparent([did], 0)
        else:
            pid = self._deck_id(parent_id)
            if did == pid:
                raise ValueError('No puedes mover una carpeta dentro de sí misma.')
            self.col.decks.reparent([did], pid)
        self._active = None
        return {'id': did, 'name': self.col.decks.name(did)}

    @staticmethod
    def _tags(tags):
        source = tags if isinstance(tags, (list, tuple)) else str(tags or '').replace(',', ' ').split()
        return list(dict.fromkeys(str(t).strip().replace(' ', '_') for t in source if str(t).strip()))

    def add_card(self, deck_id, front, back, tags=''):
        self._check_thread()
        did = self._deck_id(deck_id)
        if not str(front).strip() or not str(back).strip():
            raise ValueError('Completa la pregunta y la respuesta.')
        note = self.col.new_note(self._model())
        note.fields = [str(front), str(back)]
        note.tags = self._tags(tags)
        self.col.add_note(note, did)
        self._active = None
        return self._card_data(note.cards()[0])

    def edit_card(self, id, front, back, tags=''):
        self._check_thread()
        card = self._get_card(id)
        note = card.note()
        if note.note_type()['name'] != self.MODEL_NAME or len(note.fields) != 2:
            raise ValueError('Edita esta plantilla importada en Anki de escritorio. El visor conserva sus campos originales.')
        if not str(front).strip() or not str(back).strip():
            raise ValueError('Completa la pregunta y la respuesta.')
        note.fields = [str(front), str(back)]
        note.tags = self._tags(tags)
        self.col.update_note(note)
        self._active = None
        return self._card_data(self._get_card(id))

    def toggle_star(self, id):
        self._check_thread()
        card = self._get_card(id)
        stars = self._stars()
        if card.id in stars:
            stars.remove(card.id)
        else:
            stars.add(card.id)
        self.col.set_config('anki2.starred', sorted(stars))
        return {'id': card.id, 'starred': card.id in stars}

    def delete_card(self, id):
        self._check_thread()
        card = self._get_card(id)
        note = card.note()
        ids = {c.id for c in note.cards()}
        self.col.remove_notes([note.id])
        self.col.set_config('anki2.starred', sorted(self._stars() - ids))
        self._active = None
        return {'deleted': len(ids), 'noteId': note.id, 'cardIds': sorted(ids)}

    def list_backups(self):
        self._check_thread()
        files = sorted(self.backup_dir.glob('*.colpkg'), key=lambda p: p.stat().st_mtime, reverse=True)
        return [{'filename': p.name, 'path': str(p), 'bytes': p.stat().st_size, 'createdAt': datetime.fromtimestamp(p.stat().st_mtime).isoformat()} for p in files]

    def backup(self):
        return self.export_collection()

    def study(self, deck_id=None):
        self._check_thread()
        if deck_id not in (None, '', 'all'):
            dids = [self._deck_id(deck_id)]
        else:
            dids = [d.deck_id for d in self.col.sched.deck_due_tree().children]
        queue = None
        selected = None
        for did in dids:
            self.col.decks.select(did)
            queue = self.col.sched.get_queued_cards(fetch_limit=1)
            selected = did
            if queue.cards:
                break
        counts = {'new': 0, 'learning': 0, 'review': 0, 'total': 0}
        cards = []
        intervals = []
        if queue:
            counts = {'new': queue.new_count, 'learning': queue.learning_count, 'review': queue.review_count, 'total': queue.new_count + queue.learning_count + queue.review_count}
            due_ids = set(self.col.find_cards('(is:due OR is:new) -is:suspended -is:buried'))
            stars = self._stars()
            cards = [self._card_data(Card(self.col, backend_card=item.card), due_ids, stars) for item in queue.cards]
            if queue.cards:
                first = queue.cards[0]
                intervals = [label.replace('\u2068', '').replace('\u2069', '') for label in self.col.sched.describe_next_states(first.states)]
                if self._active is None or self._active.id != first.card.id:
                    self._active = Card(self.col, backend_card=first.card)
                    self._active.start_timer()
            else:
                self._active = None
        return {'cards': cards, 'counts': counts, 'deckId': selected, 'intervals': intervals, 'finished': not cards}

    def review(self, id, rating):
        self._check_thread()
        if isinstance(rating, bool) or rating not in (1, 2, 3, 4):
            raise ValueError('Elige una valoración de 1 a 4.')
        if self._active is None or self._active.id != int(id):
            raise ValueError('La cola de estudio cambió. Abre la siguiente tarjeta para continuar.')
        card = self._active
        self.col.sched.answerCard(card, rating)
        self._active = None
        return {'card': self._card_data(card), 'saved': True}

    def start_exam(self, deck_id=None, mode='difficult', limit=20):
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
            cids = [row[0] for row in self.col.db.all(query, limit)]
        elif mode == 'due':
            query = f"select id from cards where queue in (1, 2, 3) {did_clause} order by due asc limit ?"
            cids = [row[0] for row in self.col.db.all(query, limit)]
        else:
            query = f"select id from cards where queue != -1 {did_clause} order by random() limit ?"
            cids = [row[0] for row in self.col.db.all(query, limit)]
            
        if not cids:
            cids = [row[0] for row in self.col.db.all(f"select id from cards where 1=1 {did_clause} limit ?", limit)]

        due_ids = set(cids)
        stars = self._stars()
        exam_cards = [self._card_data(self.col.get_card(cid), due_ids, stars) for cid in cids]
        return {
            'cards': exam_cards,
            'total': len(exam_cards),
            'deckId': deck_id,
            'mode': mode,
            'limit': limit
        }

    def create_image_occlusion(self, deck_id, image_filename, shapes, header='', extra='', tags=''):
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
            raise ValueError('El tipo de nota Image Occlusion no está disponible.')

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

    def batch_add_cards(self, deck_id, cards):
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

    def import_text_cards(self, deck_id, cards):
        """Import literal text into a staged collection; leave existing notes intact.

        This boundary deliberately accepts no HTML or note-type instructions.
        Validation and duplicate detection finish before the first backup/write.
        """
        self._check_thread()
        if isinstance(deck_id, bool) or not isinstance(deck_id, (int, str)):
            raise ValueError('Selecciona un mazo válido.')
        if not isinstance(cards, list) or not 1 <= len(cards) <= 5000:
            raise ValueError('Importa entre 1 y 5000 tarjetas por lote.')

        def literal_field(value):
            # HTML escaping alone does not neutralize Anki's sound/cloze tokens.
            value = value.replace('\r\n', '\n').replace('\r', '\n').strip()
            escaped = html.escape(value, quote=True)
            for char, entity in (('[', '&#91;'), (']', '&#93;'), ('{', '&#123;'), ('}', '&#125;')):
                escaped = escaped.replace(char, entity)
            return escaped.replace('\n', '<br>')

        def text_key(value):
            parser = _Text()
            parser.feed(value)
            parser.close()
            # Keep case and accents: only layout whitespace is insignificant.
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
        if self.col.decks.get(did)['dyn']:
            raise ValueError('Selecciona un mazo normal para importar tarjetas de texto.')
        basic_model_ids = {
            model['id'] for model in self.col.models.all()
            if model['type'] == 0 and len(model['flds']) == 2 and len(model['tmpls']) == 1
        }
        existing = set()
        for mid, raw_fields in self.col.db.all(
            'select distinct n.mid, n.flds from notes n join cards c on c.nid = n.id where c.did = ?', did
        ):
            fields = raw_fields.split('\x1f')
            if mid not in basic_model_ids or len(fields) != 2:
                continue
            # A media-bearing note is different from literal text describing it.
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
        with tempfile.TemporaryDirectory(prefix='.anki2-text-import-', dir=self.data_dir) as temporary:
            temp_dir = Path(temporary)
            stage_dir = temp_dir / 'staged'
            stage_path = self._restore_package(backup['path'], stage_dir)
            staged = Collection(str(stage_path))
            try:
                # Reuse the app's basic model through an isolated adapter, never
                # redirect self.col while callers still own the live collection.
                adapter = Engine.__new__(Engine)
                adapter.col = staged
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
        return result

    def get_deck_config(self, deck_id):
        self._check_thread()
        did = self._deck_id(deck_id)
        deck = self.col.decks.get(did)
        conf = self.col.decks.config_dict_for_deck_id(did)
        new_per_day = conf.get('new', {}).get('perDay', 20)
        rev_per_day = conf.get('rev', {}).get('perDay', 200)
        return {
            'deckId': did,
            'deckName': deck['name'],
            'newPerDay': new_per_day,
            'reviewPerDay': rev_per_day
        }

    def update_deck_config(self, deck_id, new_per_day=None, rev_per_day=None):
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

    def get_weak_cards(self, deck_id=None, limit=50):
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
        rows = self.col.db.all(query, limit)
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

    def reset_card_progress(self, card_id):
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

    def export_collection(self, path=None):
        self._check_thread()
        if path is None:
            stamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S_%f')
            path = self.backup_dir / f'anki2-{stamp}.colpkg'
        path = Path(path).resolve()
        if path == self.collection_path or path.suffix.lower() != '.colpkg':
            raise ValueError('La copia debe guardarse como un archivo .colpkg separado.')
        path.parent.mkdir(parents=True, exist_ok=True)
        try:
            self.col.export_collection_package(str(path), include_media=True, legacy=False)
        finally:
            if self.col.db is None:
                self.col.reopen()
            self._active = None
        return {'path': str(path), 'filename': path.name, 'bytes': path.stat().st_size}

    @staticmethod
    def _restore_package(package, target_dir):
        target_dir = Path(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        col_path = target_dir / 'collection.anki2'
        media, media_db = media_paths_from_col_path(str(col_path))
        backend = RustBackend()
        backend.import_collection_package(col_path=str(col_path), backup_path=str(package), media_folder=media, media_db=media_db)
        return col_path

    def _as_deck_package(self, source, temp_dir):
        if source.suffix.lower() == '.apkg':
            return source
        converted_dir = Path(temp_dir) / 'source'
        converted_dir.mkdir()
        if source.suffix.lower() == '.colpkg':
            converted_path = self._restore_package(source, converted_dir)
        else:
            converted_path = converted_dir / 'collection.anki2'
            # SQLite backup reads an uploaded DB without upgrading/mutating it.
            with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)) as original:
                with closing(sqlite3.connect(converted_path)) as target:
                    original.backup(target)
            sibling_media = source.with_suffix('.media')
            if sibling_media.is_dir():
                shutil.copytree(sibling_media, converted_dir / 'collection.media')
        converted = Collection(str(converted_path))
        package = Path(temp_dir) / 'converted.apkg'
        try:
            converted.export_anki_package(out_path=str(package), options=ExportAnkiPackageOptions(with_scheduling=True, with_deck_configs=True, with_media=True, legacy=False), limit=None)
        finally:
            converted.close()
        return package

    def _install_staged(self, stage_dir, rollback_dir):
        """Rollback a failed filesystem swap, without deleting the prior library."""
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

    def import_file(self, path):
        self._check_thread()
        source = Path(path).resolve()
        if source.suffix.lower() not in ('.apkg', '.colpkg', '.anki2'):
            raise ValueError('Elige un archivo .apkg, .colpkg o .anki2.')
        if not source.is_file():
            raise ValueError('No se encontró el archivo para importar.')
        backup = self.export_collection()
        before = self.col.card_count()
        with tempfile.TemporaryDirectory(prefix='.anki2-import-', dir=self.data_dir) as temporary:
            temp_dir = Path(temporary)
            stage_dir = temp_dir / 'staged'
            stage_path = self._restore_package(backup['path'], stage_dir)
            package = self._as_deck_package(source, temp_dir)
            staged = Collection(str(stage_path))
            try:
                result = staged.import_anki_package(ImportAnkiPackageRequest(package_path=str(package), options=ImportAnkiPackageOptions(merge_notetypes=True, with_scheduling=True, with_deck_configs=True)))
                after = staged.card_count()
                log = result.log
                summary = {'added': after - before, 'newNotes': len(log.new), 'updatedNotes': len(log.updated), 'duplicateNotes': len(log.duplicate), 'conflictingNotes': len(log.conflicting)}
            finally:
                staged.close()
            rollback_dir = temp_dir / 'rollback'
            rollback_dir.mkdir()
            self._install_staged(stage_dir, rollback_dir)
        warnings = []
        if source.suffix.lower() == '.anki2':
            warnings.append('Un archivo .anki2 no incluye multimedia; usa .apkg o .colpkg para transferir imágenes y audio.')
        if summary['conflictingNotes']:
            warnings.append('Algunas notas presentan conflictos de plantilla y no se importaron.')
        return {**summary, 'filename': source.name, 'backup': backup, 'warnings': warnings, 'saved': True}

    def get_local_ip(self):
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return ip

    def _sync_state_file(self):
        return self.data_dir / 'sync_state.json'

    def get_sync_info(self, port=8765):
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

    def save_sync_state(self, updates):
        state_file = self._sync_state_file()
        current = {}
        if state_file.is_file():
            try:
                current = json.loads(state_file.read_text(encoding='utf-8'))
            except Exception:
                pass
        current.update(updates)
        state_file.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding='utf-8')

    def export_sync_package(self):
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

    def import_sync_package(self, path):
        self._check_thread()
        result = self.import_file(path)
        self.save_sync_state({'lastImport': {
            'timestamp': time.time(),
            'iso': datetime.now().isoformat(),
            'filename': Path(path).name,
            'added': result.get('added', 0)
        }})
        return result

    def sync_with_peer(self, peer_url):
        self._check_thread()
        url = peer_url.strip().rstrip('/')
        if not url.startswith('http://') and not url.startswith('https://'):
            url = 'http://' + url

        import urllib.request
        try:
            health_req = urllib.request.Request(f"{url}/api/health", headers={'X-Anki-Request': '1'})
            with urllib.request.urlopen(health_req, timeout=6) as resp:
                info = json.loads(resp.read().decode('utf-8'))
                if not info.get('ok'):
                    raise ValueError('El equipo remoto no es un servidor Lumcards válido.')
        except Exception as e:
            raise ValueError(f'No se pudo conectar con el otro dispositivo ({url}): {e}')

        try:
            export_req = urllib.request.Request(f"{url}/api/export", headers={'X-Anki-Request': '1'})
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
