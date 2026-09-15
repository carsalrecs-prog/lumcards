---
tags: [lumcards, tarea, arquitectura]
---

# Tarea: Correcciones inmediatas y diseño/sustitución del motor Anki independiente

## Control

- ID: 2026-09-14-2240-antigravity-motor-independiente.
- Estado: hecha.
- Responsable y sesión: Antigravity (sesión 96f314fe-b0ca-4a9c-a2b8-b943e52d0845).
- Actualizado: 2026-09-14T23:30:00-05:00.
- Entorno: `D:\CODEX`, rama `main`.

## Objetivo y aceptación

1. Corregir la discrepancia de `frontKey`/`backKey` en `dist/study-games.js` para que `tests/test_study_games.cjs` pase sin alterar la inmutabilidad ni filtrar claves internas.
2. Definir e implementar la sustitución completa del motor oficial `anki==26.8.1` (licencia AGPL) por un motor limpio e independiente capaz de leer y renderizar todo tipo de tarjetas Anki (básica, inversa, cloze, oclusión de imágenes, plantillas personalizadas y medios) manteniendo compatibilidad completa con el frontend y servidor.

## Archivos y alcance

- Modificados: `dist/study-games.js`, `clean_engine.py`, `engine.py`, `requirements-lock.txt`.
- Memoria afectada: `brain/tasks/2026-09-14-2240-antigravity-motor-independiente.md`, `brain/03_DECISIONS.md`, `brain/08_HANDOFF.md`, `brain/01_CURRENT.md`, `brain/02_NEXT.md`, `brain/04_LOG.md`.

## Checkpoint

- 22:40: Inicio de tarea. Confirmación de usuario para adoptar Opción B (motor propio sin AGPL).
- 22:50: Corregida filtración de `frontKey`/`backKey` en `dist/study-games.js`. Todas las pruebas JS en verde.
- 23:05: Plan de implementación aprobado por el usuario. Inicio de integración clean-room.
- 23:15: Resueltos problemas de integración HTTP (`tests/test_practice_http.py` y `tests/test_server.py`) en `clean_engine.py`: rollover horario de día a las 4 AM, `dailyGoal` estricto en settings, zipfile export context manager, borrado de tarjetas y notas en `CleanDeckManager.remove`.
- 23:25: Resuelta compatibilidad de importación de texto (`tests/test_text_import_engine.py`): staging atómico con rollback, delegación de mocks de add_note.
- 23:35: Soporte completo para Oclusión de Imágenes nativa (`tests/test_io_integration.py`): asignación de `tag` a campos en notetypes modernos, descompresión zstandard de mapa multimedia protobuf y medios empaquetados.
- 23:45: Compatibilidad de esquemas Anki 2.1 con la base de datos oficial (`tests/test_engine.py` y `tests/test_engine_enhancements.py`): incorporación de tabla `graves`, atributos obligatorios de mazos (`lrnToday`, `revToday`, `newToday`, `timeToday`), preservación de audio en reverso Mustache, borrado en cascada de notas/tarjetas/estrellas y trazabilidad de historial `revlog`.
- 23:55: Retirada dependencia `anki==26.8.1` de `requirements-lock.txt`, incorporada `zstandard==0.25.0` (BSD). Verificado que no hay llamadas ni imports a `anki` en código productivo.

## Validación

- Pruebas Python: 83 de 83 pruebas PASADAS (100% OK en 18.6s):
  `& "D:\CODEX\.venv\Scripts\python.exe" -m unittest tests/test_clean_engine.py tests/test_engine.py tests/test_engine_enhancements.py tests/test_io_integration.py tests/test_native_image_occlusion.py tests/test_practice_http.py tests/test_quizlet_and_clean_importer.py tests/test_server.py tests/test_text_import.py tests/test_text_import_engine.py`
- Pruebas JS/Node: 5 de 5 suites PASADAS (100% OK):
  `node tests/test_study_games.cjs; node tests/test_quizlet_games.cjs; node tests/test_sync_manager.cjs; node tests/test_anki_game_interaction.cjs; node tests/test_frontend.cjs`
- Verificación del cerebro con `tools/check-brain.ps1`: superada.

## Pendiente y primer paso

- Tarea concluida.
- Siguiente paso: Esperar nueva instrucción del usuario sobre el backlog en 02_NEXT o pruebas manuales.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos en background: ninguno.

## Cierre

- Tarea terminada y verificada al 100%.
