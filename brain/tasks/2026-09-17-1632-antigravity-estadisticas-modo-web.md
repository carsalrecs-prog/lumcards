---
tags: [lumcards, tarea, correccion, web-mode, estadisticas]
---

# Tarea: Reparación y cálculo real de estadísticas en Modo Web

## Control

- ID: 2026-09-17-1632-antigravity-estadisticas-modo-web
- Estado: hecha
- Responsable y sesión: Antigravity (sesión f9e636cf-84bd-45d5-bb8e-6784d811fbbb).
- Actualizado: 2026-09-17T16:40:00-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `b4383ce`.

## Objetivo y aceptación

- Petición del usuario: "no funciona el apartado de estadisticas en la web puedes ayudarme?"
- Diagnóstico:
  1. En Modo Web (`webApi`), el endpoint `stats/detailed` devolvía un objeto con valores vacíos/en cero completamente estáticos (`emptyPart`, `forecast` en 0, `history` en 0, `cardBreakdown` con 0 en todas las categorías salvo el total, `addedCards` con series vacía mostrando "SIN DATOS", `intervals` y `ease` vacíos).
  2. El parámetro `deckId` y el filtro por mazo en el selector de ámbito (`#stats-deck-select`) eran completamente ignorados por `webApi`, impidiendo consultar las métricas de un mazo específico (ej. mazo "dolor").
  3. El endpoint `cards/weak` no estaba implementado en `webApi`, retornando `{ success: true }` sin `cards`, y además la ruta `route.startsWith('cards/')` interceptaba `cards/weak` devolviendo una tarjeta no encontrada con id `'weak'`.
  4. En `webApi('review')`, no se registraba el historial de repasos (`store._revlogs`), imposibilitando que las sesiones de estudio en la web reflejaran actividad en el calendario, horas o retención.
- Criterios de aceptación:
  1. `webApi('stats/detailed')` filtra por `deckId` (incluyendo submazos `name::*`) o toma toda la colección.
  2. Calcula dinámicamente `cardBreakdown` clasificado según el estado real de cada tarjeta (`new`, `learning`, `young`, `mature`, `suspended`, `buried`) con porcentajes exactos.
  3. Calcula el pronóstico real (`forecast`) en 30, 90 y 365 días según los intervalos y estados de las tarjetas.
  4. Calcula `addedCards` agrupando por fecha de creación a partir de los IDs de las tarjetas.
  5. Calcula distribución de intervalos (`intervals`) y factores de facilidad (`ease`).
  6. Registra cada repaso en `store._revlogs` al ejecutar `webApi('review')`, computando `today`, `history`, `calendar` (respetando el año solicitado), `hourly`, `buttonPresses` y `retention`.
  7. Implementa `webApi('cards/weak')` posicionado antes de `cards/` para detectar leeches (lapsos >= 3), facilidad crítica (< 180%) y preguntas extensas (> 180 caracteres).
  8. Sincronización estricta entre `dist/` y `docs/` e incremento de versión de caché a `20260917-web-stats`.
  9. Verificación con pruebas automatizadas (Python y suite Node de navegador).

## Archivos y alcance

- `dist/app.js`, `docs/app.js`
- `dist/index.html`, `docs/index.html`
- `dist/practice.html`, `docs/practice.html`
- `dist/sw.js`, `docs/sw.js`
- `tests/test_server.py`, `tests/test_practice_http.py`, `tests/test_ux_study_audio.cjs`
- `tests/test_web_stats.cjs`
- Memoria: `brain/tasks/2026-09-17-1632-antigravity-estadisticas-modo-web.md`, `brain/08_HANDOFF.md`, `brain/01_CURRENT.md`, `brain/04_LOG.md`.

## Checkpoint

- 16:32: Diagnóstico completado mediante inspección del código y prueba con navegador Chromium real. Ficha de tarea creada.
- 16:35: Implementado el cálculo dinámico completo de estadísticas en `webApi` (`today`, `forecast`, `cardBreakdown`, `calendar`, `history`, `intervals`, `ease`, `retention`, `hourly`, `buttonPresses`, `addedCards`) con soporte para filtro de mazo y submazos.
- 16:37: Implementado registro de historial `_revlogs` en `webApi('review')` y reubicada la ruta `cards/weak` antes de `cards/` para evitar colisión de rutas.
- 16:38: Paridad 100% verificada entre `dist/` y `docs/`. Versión de caché elevada a `20260917-web-stats`.
- 16:39: Creada y ejecutada la prueba unitaria `tests/test_web_stats.cjs` con éxito total.
- 16:40: Ejecutadas y aprobadas las suites de pruebas `test_web_study_blocks.cjs`, `test_frontend.cjs`, `test_ux_study_audio.cjs` y 92 tests en `tests/test_*.py`.

## Validación

- `node tests/test_web_stats.cjs`: OK (filtro por mazo/submazo, desglose de tarjetas, pronóstico, historial, calendario, puntos débiles / leeches).
- `node tests/test_web_study_blocks.cjs`: OK.
- `node tests/test_frontend.cjs`: OK.
- `node tests/test_ux_study_audio.cjs`: OK.
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: 92 tests pasados en 18.38s (OK).

## Pendiente y primer paso

- Ninguno para esta tarea. Siguiente acción: actualizar notas compartidas de brain y realizar commit y push a GitHub.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local Lumcards en puerto 8765.

## Cierre

- Tarea completada y verificada. Implementación y tests en verde. Sincronización `dist/` y `docs/` estricta.
