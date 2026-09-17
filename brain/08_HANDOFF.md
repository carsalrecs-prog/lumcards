---
tags: [lumcards, relevo]
updated: 2026-09-17
---

# Relevo actual

## Control
- Agente: Antigravity.
- Actualizado: 2026-09-17T16:45:00-05:00.
- Estado: lista_para_relevo.
- Tarea: [[tasks/2026-09-17-1632-antigravity-estadisticas-modo-web]].
- Entorno: `D:\CODEX`, rama `main`, commit base `b4383ce`.

## Hecho
- Petición del usuario solucionada: "no funciona el apartado de estadisticas en la web puedes ayudarme?".
- Diagnóstico resuelto:
  1. En Modo Web (`webApi`), `stats/detailed` devolvía un objeto stub estático con valores en cero/vacíos (`cardBreakdown` con 0 salvo total, `forecast` en 0, `addedCards` vacío mostrando "SIN DATOS", `intervals` y `ease` vacíos).
  2. El parámetro `deckId` y el filtro de ámbito por mazo/submazo eran ignorados por `webApi`.
  3. La ruta `route.startsWith('cards/')` interceptaba `cards/weak` devolviendo una tarjeta ficticia no encontrada con id `'weak'`.
  4. En `webApi('review')`, no se guardaba historial en `_revlogs`.
- Cambios implementados en `dist/app.js` y `docs/app.js`:
  1. `webApi('stats/detailed')`: cálculo dinámico y completo de `today`, `forecast` (30, 90, 365 días), `cardBreakdown` clasificado por estado real (`new`, `learning`, `young`, `mature`, `suspended`, `buried`), `calendar` (generación completa de días del año consultado), `history`, `intervals`, `ease`, `retention`, `retentionTable`, `hourly`, `buttonPresses` y `addedCards`.
  2. Soporte de filtro por mazo y submazos jerárquicos (`targetDeck.name` y `${targetDeck.name}::*`).
  3. Reubicación y activación de la ruta `cards/weak` antes de `cards/` para detectar correctamente tarjetas sanguijuelas (lapses >= 3), facilidad crítica (< 180%) y preguntas largas.
  4. Registro de repasos en `store._revlogs` al ejecutar `webApi('review')` (con límite de 5000 entradas) y soporte para `id`/`cardId` y `elapsedMs`/`time`.
  5. Generación de IDs únicos con bucle `while (store.decks.some(...))` y `while (store.cards.some(...))` evitando colisiones en creaciones síncronas.
  6. Renovada la versión de caché a `20260917-web-stats` en `dist/` y `docs/` (`index.html`, `practice.html`, `sw.js`).
  7. Actualizados `tests/test_server.py`, `tests/test_practice_http.py`, `tests/test_ux_study_audio.cjs` y creada la suite `tests/test_web_stats.cjs`.

## Validación
- `node tests/test_web_stats.cjs`: OK (prueba completa en VM de `stats/detailed` general y por mazo, `cards/weak`, `_revlogs` tras repaso).
- `node tests/test_web_study_blocks.cjs`: OK.
- `node tests/test_frontend.cjs`: OK.
- `node tests/test_ux_study_audio.cjs`: OK.
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: 92/92 pruebas OK en 18.4s.
- Paridad estricta comprobada (`git diff --no-index`) entre los pares de `dist/` y `docs/`.

## Pendiente
- Ninguno para esta tarea.

## Primer paso
- Subir cambios a GitHub `origin/main` y comunicar al usuario.

## Bloqueos y procesos
- Bloqueos: ninguno.
- Procesos activos: servidor local Lumcards en puerto 8765.
