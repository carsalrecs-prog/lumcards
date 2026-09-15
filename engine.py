"""Adaptador de almacenamiento local de Lumcards.

Basado en el motor independiente clean-room (clean_engine.py), sin dependencias
del paquete oficial de Anki ni de librerías bajo licencias copyleft (AGPL).
"""
from __future__ import annotations

from clean_engine import (
    CleanEngine as Engine,
    CleanCollection,
    CleanCard,
    CleanNote,
    plain_text,
    strip_html,
    render_mustache_template,
    render_cloze_text,
    extract_cloze_numbers,
)

Collection = CleanCollection

__all__ = [
    'Engine',
    'Collection',
    'CleanCollection',
    'CleanCard',
    'CleanNote',
    'plain_text',
    'strip_html',
    'render_mustache_template',
    'render_cloze_text',
    'extract_cloze_numbers',
]
