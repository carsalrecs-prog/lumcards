---
tags: [lumcards, tarea, correccion, web-mode]
---

# Tarea: Soporte de bloques de estudio y contador de tarjetas en Modo Web

## Control

- ID: 2026-09-17-1550-antigravity-soporte-estudio-modo-web
- Estado: hecha
- Responsable y sesión: Antigravity (sesión f9e636cf-84bd-45d5-bb8e-6784d811fbbb).
- Actualizado: 2026-09-17T16:20:00-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `acfe525`.

## Objetivo y aceptación

- Petición del usuario: "cree 2 tarjetas pero cuando pongo estudiar no me deja porfavor ayudame" con capturas mostrando mazo "dolor" con 2 tarjetas nuevas marcadas como "Al día" en la biblioteca, y modal "Organizar bloque de estudio" mostrando "Total de tarjetas en el mazo: 0 tarjetas", "Disponibles para repasar hoy: 0 tarjetas", y botón "Iniciar bloque" deshabilitado. Aclaración del usuario: "Porfavor recuerda qe el error esta no en la app sino es problema en la web, porfavor revisa eso con githuub".
- Diagnóstico: En Modo Web (PWA en GitHub Pages / Vercel / cliente web sin backend local), `webApi` en `app.js` no implementaba los endpoints `study/block-info`, `study/block-start` ni `study/block-clear`, devolviendo `{ success: true }` sin campos de tarjetas (`totalDeckCards` ni `availableToday`), causando que el modal calculara 0 tarjetas y deshabilitara "Iniciar bloque". Además, al consultar el estado en `webApi('state')` o al crear tarjetas, `deck.due` se mantenía en 0 en lugar de calcularse dinámicamente según las tarjetas pendientes o nuevas, lo que provocaba la etiqueta engañosa "Al día".
- Aceptación:
  1. `webApi` implementa `study/block-info` calculando `totalDeckCards` y `availableToday` (new + learn + due) a partir de `store.cards` para el mazo seleccionado (incluyendo submazos).
  2. `webApi` implementa `study/block-start` y `study/block-clear` con persistencia en `store._study_blocks`.
  3. `webApi('study')` sirve las tarjetas del bloque activo y reporta `blockStatus` con `active: true`, `current`, `total`, `pending`, `reviewedCount` y `progressPct`.
  4. `webApi('review')` actualiza el bloque activo y sus contadores (`reviewedCardIds`, `againCardIds`) y recalcula `blockStatus`.
  5. `webApi('state')` recalcula dinámicamente `deck.total`, `deck.new`, `deck.due`, `deck.learned` y `deck.childIds` para cada mazo a partir de `store.cards`, y persiste cualquier cambio en `localStorage`.
  6. Sincronización completa y estricta entre `dist/` y `docs/` con invalidación de caché a `20260917-web-study-blocks` en `sw.js`, `index.html` y `practice.html`.
  7. Suite de pruebas ejecutada y pasando (Node, Python y VM web).

## Archivos y alcance

- `dist/app.js`, `docs/app.js`
- `dist/index.html`, `docs/index.html`
- `dist/practice.html`, `docs/practice.html`
- `dist/sw.js`, `docs/sw.js`
- `tests/test_server.py`, `tests/test_practice_http.py`, `tests/test_ux_study_audio.cjs`
- `tests/test_web_study_blocks.cjs`
- Memoria: esta ficha, `brain/08_HANDOFF.md`, `brain/01_CURRENT.md`, `brain/04_LOG.md`.

## Checkpoint

- 15:55: Diagnóstico completado a partir de las capturas e inspección del código. Ficha de tarea creada.
- 16:10: Implementados endpoints `study/block-info`, `study/block-start`, `study/block-clear`, `study` y `review` con soporte completo de bloques y contadores dinámicos de mazos en `dist/app.js` y `docs/app.js`.
- 16:15: Caché renovada a `20260917-web-study-blocks` en `index.html`, `practice.html`, `sw.js` (en `dist/` y `docs/`) y actualizada en `test_server.py`, `test_practice_http.py` y `test_ux_study_audio.cjs`.
- 16:18: Nueva suite `tests/test_web_study_blocks.cjs` verificando todo el ciclo en modo web (creación de mazo "dolor", 2 tarjetas, recuento de `due=2`, `block-info` disponible=2, inicio de bloque, estudio y repaso con `blockStatus`, y `block-clear`).
- 16:20: Verificación con 92/92 tests de Python pasando, 100% pruebas de Node pasando, y paridad total confirmada entre `dist/` y `docs/`.

## Validación

- `node tests/test_web_study_blocks.cjs`: OK (ciclo completo de bloques y recuentos en modo web).
- `node tests/test_frontend.cjs`: OK.
- `node tests/test_ux_study_audio.cjs`: OK.
- `node tests/test_study_blocks_and_preview.cjs`: OK (Chromium real con bloques y vistas previas).
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: 92/92 pruebas OK (23.6s).
- `git diff --no-index dist/app.js docs/app.js` (y resto de activos web): 100% idénticos.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/check-brain.ps1`: por ejecutar tras actualizar notas.

## Pendiente y primer paso

- Subir cambios a GitHub `origin/main` con `git commit` y `git push`.
- Explicar al usuario la solución y recordar refresco forzado (Ctrl + F5).

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local en puerto 8765.

## Cierre

- Implementado y probado. Listo para subida a GitHub.
