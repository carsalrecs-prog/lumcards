---
tags: [lumcards, tarea]
---

# Tarea: Coherencia de estadísticas y resolución de problemas en Modo Web

## Control

- ID: 2026-09-17-1756-antigravity-coherencia-estadisticas-web
- Estado: hecha
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-17T22:48:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit `d4333ed`

## Objetivo y aceptación

- Resolver la incoherencia en las estadísticas del Modo Web (GitHub Pages / Vercel / PWA / offline):
  1. Conteo y desglose de tarjetas (`cardBreakdown` y gráfico de donut): todas las tarjetas de la colección o mazo deben clasificarse exhaustivamente (nuevas, aprendiendo, reaprendiendo, jóvenes, maduras, suspendidas, enterradas). Las tarjetas con estado `due` (pendientes de repaso) se clasifican en jóvenes o maduras según su intervalo, sumando exactamente el 100% del total (`totalCards === sum(categories)`).
  2. Distribución de intervalos y facilidad (`intervals` y `ease`): incluir todas las tarjetas graduadas/repasadas para que las gráficas y promedios muestren la realidad del mazo en vez de "Aún no hay tarjetas graduadas" o "SIN DATOS".
  3. Pronóstico (`forecast`): excluir tarjetas nuevas (`new`) del pronóstico de repasos futuros programados para no distorsionar la carga del día 0.
  4. Tabla de retención (`retentionTable`): calcular las tasas reales para jóvenes, maduras y total en cada rango temporal (hoy, ayer, semana, mes, año) en lugar de valores fijos `'N/A'`.
  5. Puntos débiles y sanguijuelas (`cards/weak`): proveer `questionSnippet` y `recommendation` (además de `snippet` y `tip`) para eliminar `undefined` en la interfaz.
  6. Métricas de hoy (`today`): coherencia entre `cardsStudied`, `reviewCount`, `learnCount`, tiempo y retención.
  7. Paridad de raíz en `stats/detailed`: añadir `deckId`, `deckName`, `totalCards`, `reviewedToday` y `retentionRate`.
  8. En `practice.js`, asegurar que `/api/practice/result`, `/api/practice/history`, `/api/decks` e importación funcionen de forma autónoma en Modo Web sin arrojar errores 404.
  9. Persistencia de configuración de mazos en Modo Web (`decks/config` GET y POST).
  10. Mantener paridad exacta de 0 diff entre `dist/` y `docs/`.

## Archivos y alcance

- `dist/app.js` y `docs/app.js`
- `dist/practice.js` y `docs/practice.js`
- `tests/test_web_stats.cjs`

## Checkpoint

- 2026-09-17T17:56:00-05:00: Diagnóstico de las incoherencias y fallos en Modo Web. Creación de la ficha de tarea.
- 2026-09-17T22:35:00-05:00: Implementación completa de la clasificación exhaustiva de tarjetas, inclusión de tarjetas pendientes `due` en intervalos/facilidad, exclusión de nuevas en pronóstico futuro, cálculo de tasas de retención por período, normalización de puntos débiles y endpoints offline en `practice.js`.
- 2026-09-17T22:47:00-05:00: Validación integral de pruebas automatizadas: unitarias, Chromium real E2E, y suite completa de Python (92/92 pruebas OK).

## Validación

- `node tests/test_web_stats.cjs`: PASS (verificación matemática de suma de desglose, tarjetas repasadas en intervalos, tabla de retención dinámica, puntos débiles y endpoints offline de práctica).
- `node tests/test_study_blocks_and_preview.cjs`: PASS (suite completa en Chromium real en 4 viewports con mazo sintético de 565 tarjetas).
- `node tests/test_frontend.cjs`: PASS.
- `node tests/test_ux_study_audio.cjs`: PASS.
- `node tests/test_sync_manager.cjs`: PASS.
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: PASS (92/92 pruebas OK en 21.36s).
- Paridad estricta (`git diff --no-index`): 0 diferencias entre `dist/app.js` y `docs/app.js`, y 0 diferencias entre `dist/practice.js` y `docs/practice.js`.

## Pendiente y primer paso

- Ninguno. Tarea completada y verificada.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local en puerto 8765.

## Cierre

- Tarea concluida con éxito. Modo Web posee coherencia matemática, visual y funcional completa en estadísticas y modos offline.
