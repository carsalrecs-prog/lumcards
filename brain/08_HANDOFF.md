---
tags: [lumcards, relevo]
updated: 2026-09-17
---

# Relevo actual

## Control
- Agente: Antigravity.
- Actualizado: 2026-09-17T16:25:00-05:00.
- Estado: lista_para_relevo.
- Tarea: [[tasks/2026-09-17-1550-antigravity-soporte-estudio-modo-web]].
- Entorno: `D:\CODEX`, rama `main`.

## Hecho
- Petición del usuario solucionada: se corrigió el problema en la versión web (GitHub Pages / Vercel) donde al tener 2 tarjetas nuevas en un mazo ("dolor"), el modal de estudio mostraba "Total: 0", "Disponibles para repasar hoy: 0" y el botón "Iniciar bloque" quedaba inhabilitado.
- Cambios realizados en Modo Web (`webApi` en `dist/app.js` y `docs/app.js`):
  1. `webApi('study/block-info')`: implementado para calcular dinámicamente `totalDeckCards`, `availableToday` (tarjetas nuevas + aprendizaje + vencidas), pendientes por estado y estado del bloque activo en `store._study_blocks`.
  2. `webApi('study/block-start')` y `webApi('study/block-clear')`: implementados con selección ordenada de tarjetas y persistencia en `store._study_blocks`.
  3. `webApi('study')`: actualizado para servir las tarjetas del bloque activo y retornar el objeto `blockStatus` (`active`, `current`, `total`, `pending`, `reviewedCount`, `progressPct`).
  4. `webApi('review')`: actualizado para registrar las revisiones dentro del bloque activo y devolver el `blockStatus` actualizado.
  5. `webApi('state')`: recalcula dinámicamente `deck.total`, `deck.new`, `deck.due`, `deck.learned` y `deck.childIds` para cada mazo a partir de `store.cards`, reparando estados antiguos en `localStorage`.
  6. Renovada la versión de caché a `20260917-web-study-blocks` en `dist/index.html`, `docs/index.html`, `dist/practice.html`, `docs/practice.html`, `dist/sw.js` y `docs/sw.js`.
  7. Actualizados los tests de regresión `test_server.py`, `test_practice_http.py`, `test_ux_study_audio.cjs` y creada la suite dedicada `tests/test_web_study_blocks.cjs`.

## Validación
- `node tests/test_web_study_blocks.cjs`: OK (prueba completa en VM del ciclo web con creación de mazo, tarjetas, bloque de estudio, revisión y limpieza).
- `node tests/test_frontend.cjs` y `node tests/test_ux_study_audio.cjs`: OK.
- `node tests/test_study_blocks_and_preview.cjs`: OK (Chromium real con bloques y vistas previas).
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: 92/92 pruebas OK en 23.6s.
- Paridad estricta comprobada (`git diff --no-index`) entre los pares de `dist/` y `docs/`.

## Pendiente
- Ninguno para esta tarea.

## Primer paso
- Subir a GitHub `origin/main` y comunicar al usuario.

## Bloqueos y procesos
- Bloqueos: ninguno.
- Procesos activos: servidor local Lumcards en puerto 8765.
