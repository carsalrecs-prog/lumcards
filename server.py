"""Private, single-threaded local HTTP application for Anki 2.0."""
from __future__ import annotations

import argparse
import json
import io
import mimetypes
import os
from pathlib import Path
import shutil
import socket
import sys
import tempfile
import traceback
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, unquote, urlsplit

from engine import Engine
from practice_store import PracticeStore
from text_import import parse_cards
from PIL import Image

ROOT = Path(__file__).resolve().parent
MAX_UPLOAD = 500 * 1024 * 1024


class AppServer(HTTPServer):
    allow_reuse_address = os.name != 'nt'

    def server_bind(self):
        if os.name == 'nt':
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class Handler(BaseHTTPRequestHandler):
    server_version = 'Lumcards/1.0'
    protocol_version = 'HTTP/1.0'

    def log_message(self, fmt, *args):
        print('[%s] %s' % (self.log_date_time_string(), fmt % args), flush=True)

    @property
    def engine(self):
        return self.server.engine

    def valid_host(self):
        host_header = self.headers.get('Host', '').split(':')[0]
        if host_header in {'127.0.0.1', 'localhost', '0.0.0.0'}:
            return True
        local_ip = self.engine.get_local_ip()
        return host_header == local_ip

    def headers_for(self, content_type, length, attachment=None, media=False):
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(length))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin' if media else 'same-origin')
        if media:
            self.send_header('Access-Control-Allow-Origin', '*')
        else:
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googleusercontent.com; media-src 'self' data:; font-src 'self' data:; frame-src 'self' https://accounts.google.com; connect-src 'self' https://www.googleapis.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
        if attachment:
            self.send_header('Content-Disposition', f'attachment; filename="{attachment}"')
        self.end_headers()

    def json(self, result, status=200):
        payload = json.dumps(result, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.headers_for('application/json; charset=utf-8', len(payload))
        self.wfile.write(payload)

    def file(self, path, content_type=None, attachment=None):
        path = Path(path)
        if not path.is_file():
            self.json({'error': 'No se encontró el archivo.'}, 404)
            return
        mime = content_type or mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        self.send_response(200)
        # Sandboxed card frames have opaque origins but can read only media.
        public_asset = path.parent == self.engine.media_dir or path.is_relative_to(ROOT / 'dist' / 'vendor')
        self.headers_for(mime, path.stat().st_size, attachment, media=public_asset)
        with path.open('rb') as stream:
            shutil.copyfileobj(stream, self.wfile)

    def do_GET(self):
        if not self.valid_host():
            self.json({'error': 'Esta app solo acepta conexiones locales.'}, 403)
            return
        parsed = urlsplit(self.path)
        route = unquote(parsed.path)
        query = parse_qs(parsed.query)
        if route.startswith('/api/') and self.headers.get('Sec-Fetch-Site') == 'cross-site':
            self.json({'error': 'Abre esta operación desde Lumcards.'}, 403)
            return
        try:
            if route == '/api/health':
                self.json({'app': 'lumcards', 'legacy_app': 'anki2', 'ok': True, 'version': 1})
            elif route == '/api/state':
                self.json(self.engine.state(include_cards=False))
            elif route == '/api/practice/history':
                self.json(self.server.practice.history())
            elif route == '/api/stats/detailed':
                deck_id = query.get('deckId', [None])[0]
                year = query.get('year', [None])[0]
                self.json(self.engine.get_detailed_stats(deck_id=deck_id, year=year))
            elif route == '/api/study/block-info':
                deck_id = query.get('deckId', [None])[0]
                self.json(self.engine.get_study_block_info(deck_id))
            elif route == '/api/cards':
                self.json(self.engine.browse_cards(query=query.get('query', [''])[0], deck_id=query.get('deckId', [None])[0], starred=query.get('starred', ['0'])[0] == '1', offset=int(query.get('offset', ['0'])[0]), limit=int(query.get('limit', ['50'])[0])))
            elif route == '/api/cards/weak':
                deck_id = query.get('deckId', [None])[0]
                limit = int(query.get('limit', ['50'])[0])
                self.json(self.engine.get_weak_cards(deck_id=deck_id, limit=limit))
            elif route == '/api/decks/config':
                deck_id = query.get('deckId', [None])[0]
                self.json(self.engine.get_deck_config(deck_id))
            elif route.startswith('/api/cards/'):
                self.json(self.engine.card_detail(route.removeprefix('/api/cards/')))
            elif route == '/api/sync/info':
                self.json(self.engine.get_sync_info(self.server.server_port))
            elif route == '/api/sync/export':
                result = self.engine.export_sync_package()
                self.file(result['path'], 'application/octet-stream', result['filename'])
                return
            elif route == '/api/models':
                self.json(self.engine.get_models())
            elif route == '/api/backups':
                self.json([{'name': b['filename'], 'size': b['bytes'], 'date': datetime.fromisoformat(b['createdAt']).strftime('%d/%m/%Y %H:%M')} for b in self.engine.list_backups()])
            elif route.startswith('/api/backups/'):
                name = route.removeprefix('/api/backups/')
                if Path(name).name != name or '/' in name or '\\' in name or not name.endswith('.colpkg'):
                    raise ValueError('Nombre de copia no válido.')
                self.file(self.engine.backup_dir / name, 'application/octet-stream', name)
            elif route == '/api/export':
                with tempfile.TemporaryDirectory(prefix='lumcards-export-') as tmp:
                    deck_id = query.get('deckId', [None])[0]
                    if deck_id:
                        did = self.engine._deck_id(deck_id)
                        path = Path(tmp) / 'mazo-lumcards.apkg'
                        self.engine.export_deck_package(did, path)
                    else:
                        path = Path(tmp) / 'coleccion-lumcards.colpkg'
                        self.engine.export_collection(path)
                    self.file(path, 'application/octet-stream', path.name)
            elif route.startswith('/media/'):
                name = route.removeprefix('/media/')
                if not name or Path(name).name != name or '/' in name or '\\' in name or ':' in name:
                    raise ValueError('Archivo multimedia no válido.')
                self.file(self.engine.media_dir / name)
            elif route.startswith('/vendor/katex/'):
                vendor = (ROOT / 'dist' / 'vendor' / 'katex').resolve()
                path = (ROOT / 'dist' / route.lstrip('/')).resolve()
                if not path.is_relative_to(vendor):
                    raise ValueError('Archivo de aplicación no válido.')
                self.file(path)
            elif route in ('/', '/index.html', '/app.js', '/client-startup.js', '/card-runtime.js', '/app.css', '/student.css', '/icon.svg',
                           '/practice.html', '/practice.css', '/practice.js', '/study-games.js', '/sync-manager.js'):
                self.file(ROOT / 'dist' / ('index.html' if route == '/' else route[1:]))
            else:
                self.json({'error': 'La página no existe.'}, 404)
        except (ValueError, KeyError, TypeError) as exc:
            self.json({'error': str(exc)}, 400)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        except Exception:
            traceback.print_exc()
            self.json({'error': 'No se pudo abrir el contenido. Consulta el registro de la app.'}, 500)

    def do_POST(self):
        port = self.server.server_port
        origin = self.headers.get('Origin')
        is_valid_req = (self.headers.get('X-Lumcards-Request') == '1' or self.headers.get('X-Anki-Request') == '1')
        if not self.valid_host() or not is_valid_req or (origin and origin not in {f'http://127.0.0.1:{port}', f'http://localhost:{port}'}):
            self.json({'error': 'La solicitud no proviene de la app local.'}, 403)
            return
        parsed = urlsplit(self.path)
        route = parsed.path
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0:
                raise ValueError('Tamaño de solicitud no válido.')
            if route == '/api/import/text/preview':
                if not 0 < length <= 2 * 1024 * 1024:
                    raise ValueError('El archivo de texto debe tener entre 1 byte y 2 MB.')
                query = parse_qs(parsed.query)
                payload = self.rfile.read(length)
                if len(payload) != length:
                    raise ValueError('La carga del archivo se interrumpió.')
                self.json(parse_cards(payload, query.get('name', [''])[0],
                                      separator=query.get('separator', ['auto'])[0],
                                      has_header=query.get('header', ['1'])[0] != '0'))
                return
            if route == '/api/media':
                if not 0 < length <= 30 * 1024 * 1024:
                    raise ValueError('El archivo multimedia debe tener entre 1 byte y 30 MB.')
                name = parse_qs(parsed.query).get('name', [''])[0]
                name = Path(name.replace('\\', '/')).name.replace('[', '_').replace(']', '_')
                ext = Path(name).suffix.lower()
                if ext not in ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.wav', '.ogg', '.m4a'):
                    raise ValueError('Usa una imagen PNG, JPG, WEBP o GIF, o audio MP3, WAV, OGG o M4A.')
                content = self.rfile.read(length)
                if len(content) != length:
                    raise ValueError('El archivo no se cargó completo.')
                image_file = ext in ('.png', '.jpg', '.jpeg', '.webp', '.gif')
                if image_file:
                    try:
                        with Image.open(io.BytesIO(content)) as picture:
                            picture.verify()
                    except Exception as exc:
                        raise ValueError('La imagen no es válida o es demasiado grande.') from exc
                saved_name = self.engine.col.media.write_data(name, content)
                self.json({'name': saved_name, 'kind': 'image' if image_file else 'audio'})
                return
            if route == '/api/import':
                if length > MAX_UPLOAD:
                    self.json({'error': 'El archivo supera el límite de 500 MB.'}, 413)
                    return
                if not length:
                    raise ValueError('El archivo está vacío.')
                name = parse_qs(parsed.query).get('name', [''])[0]
                suffix = Path(name).suffix.lower()
                if suffix not in ('.apkg', '.colpkg', '.anki2'):
                    raise ValueError('Elige un archivo .apkg, .colpkg o .anki2.')
                with tempfile.TemporaryDirectory(prefix='anki2-upload-') as tmp:
                    path = Path(tmp) / ('import' + suffix)
                    remaining = length
                    with path.open('wb') as out:
                        while remaining:
                            chunk = self.rfile.read(min(1024 * 1024, remaining))
                            if not chunk:
                                raise ValueError('La carga se interrumpió. Vuelve a intentar la importación.')
                            out.write(chunk)
                            remaining -= len(chunk)
                    try:
                        result = self.engine.import_file(path)
                    except Exception as exc:
                        traceback.print_exc()
                        raise ValueError('No se pudo importar este archivo de Anki. Tu colección anterior se conserva. Comprueba el archivo o expórtalo de nuevo desde Anki.') from exc
                    result['message'] = f"Importación lista: {result['added']} tarjetas nuevas, {result['updatedNotes']} notas actualizadas."
                    if result['warnings']:
                        result['message'] += ' ' + ' '.join(result['warnings'])
                    self.json(result)
                return
            if length > 5 * 1024 * 1024:
                self.json({'error': 'La solicitud es demasiado grande.'}, 413)
                return
            if self.headers.get_content_type() != 'application/json':
                raise ValueError('Se esperaba una solicitud JSON.')
            body = json.loads(self.rfile.read(length) or b'{}')
            if not isinstance(body, dict):
                raise ValueError('Solicitud no válida.')
            if route == '/api/practice/result':
                result = self.server.practice.save(body)
            elif route == '/api/import/text/commit':
                result = self.engine.import_text_cards(body.get('deckId'), body.get('cards'))
            elif route == '/api/decks':
                result = self.engine.add_deck(body.get('name', ''))
            elif route == '/api/folders':
                result = self.engine.create_folder(body.get('name', ''))
            elif route == '/api/decks/rename':
                result = self.engine.rename_deck(body.get('id'), body.get('name', ''))
            elif route == '/api/decks/move':
                result = self.engine.move_deck(body.get('deckId'), body.get('parentId'))
            elif route == '/api/cards':
                if body.get('kind') in ('reversed', 'cloze'):
                    result = self.engine.create_note(body.get('deckId'), body['kind'], [body.get('front', ''), body.get('back', '')], body.get('tags', ''))
                else:
                    result = self.engine.add_card(body.get('deckId'), body.get('front', ''), body.get('back', ''), body.get('tags', ''))
            elif route == '/api/cards/edit':
                if 'fields' in body:
                    result = self.engine.edit_note_fields(body.get('id'), body['fields'], body.get('tags', ''))
                else:
                    result = self.engine.edit_card(body.get('id'), body.get('front', ''), body.get('back', ''), body.get('tags', ''))
            elif route == '/api/models/edit':
                result = self.engine.update_model_template(body.get('id'), body.get('templateIndex'), body.get('qfmt'), body.get('afmt'), body.get('css'))
            elif route == '/api/star':
                result = self.engine.toggle_star(body.get('id'))
            elif route == '/api/study':
                result = self.engine.study(body.get('deckId'))
            elif route == '/api/study/block-start':
                result = self.engine.start_study_block(body.get('deckId'), body.get('limit', 20))
            elif route == '/api/study/block-clear':
                result = self.engine.clear_study_block(body.get('deckId'))
            elif route == '/api/exam/start':
                result = self.engine.start_exam(body.get('deckId'), body.get('mode', 'difficult'), body.get('limit', 20))
            elif route == '/api/cards/image-occlusion':
                result = self.engine.create_image_occlusion(
                    body.get('deckId'),
                    body.get('imageFilename') or body.get('image'),
                    body.get('shapes', []),
                    body.get('header', ''),
                    body.get('extra', ''),
                    body.get('tags', '')
                )
            elif route == '/api/cards/batch':
                result = self.engine.batch_add_cards(body.get('deckId'), body.get('cards', []))
            elif route == '/api/decks/config':
                result = self.engine.update_deck_config(body.get('deckId'), body.get('newPerDay'), body.get('reviewPerDay'))
            elif route == '/api/cards/reset':
                result = self.engine.reset_card_progress(body.get('id'))
            elif route == '/api/review':
                result = self.engine.review(body.get('id'), body.get('rating'))
            elif route == '/api/skip':
                card = self.engine._get_card(body.get('id'))
                self.engine.col.sched.bury_cards([card.id], manual=True)
                self.engine._active = None
                result = {'saved': True}
            elif route == '/api/sync/peer':
                result = self.engine.sync_with_peer(body.get('peerUrl', ''))
            elif route == '/api/sync/export':
                result = self.engine.export_sync_package()
            elif route == '/api/settings':
                result = self.engine.update_settings(body.get('dailyGoal'))
            elif route == '/api/backup':
                result = self.engine.backup()
            elif route == '/api/shutdown':
                self.server.stop_requested = True
                result = {'saved': True, 'closing': True}
            elif route == '/api/delete':
                kind = body.get('type')
                if kind not in ('deck', 'card'):
                    raise ValueError('Selecciona qué deseas eliminar.')
                if kind == 'card':
                    self.engine.backup()
                    result = self.engine.delete_card(body.get('id'))
                else:
                    keep_children = bool(body.get('keepChildren', False))
                    result = self.engine.delete_deck(body.get('id'), keep_children=keep_children)
            elif route == '/api/decks/reset':
                self.engine.backup()
                result = self.engine.reset_deck(body.get('deckId'))
            elif route == '/api/reset-all':
                self.engine.backup()
                result = self.engine.reset_all()
            else:
                self.json({'error': 'La operación no existe.'}, 404)
                return
            self.json(result)
        except (ValueError, KeyError, TypeError) as exc:
            self.json({'error': str(exc)}, 400)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        except Exception:
            traceback.print_exc()
            self.json({'error': 'No se pudo guardar el cambio. Inténtalo de nuevo; revisa el registro si continúa.'}, 500)


def main():
    parser = argparse.ArgumentParser(description='Lumcards — app personal local')
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--data-dir', default=str(ROOT / 'data'))
    args = parser.parse_args()
    # Bind before opening the collection; a second launch cannot touch its DB.
    server = AppServer((args.host, args.port), Handler)
    engine = Engine(args.data_dir)
    server.engine = engine
    server.practice = PracticeStore(engine.data_dir)
    server.timeout = 1
    server.stop_requested = False
    local_ip = engine.get_local_ip()
    print(f'Lumcards listo en http://127.0.0.1:{args.port} (Red local: http://{local_ip}:{args.port})', flush=True)
    print(f'Datos guardados en {engine.data_dir}', flush=True)
    try:
        while not server.stop_requested:
            server.handle_request()
    except KeyboardInterrupt:
        pass
    finally:
        engine.close()
        server.server_close()


if __name__ == '__main__':
    main()
