---
tags: [lumcards, tarea]
---

# Tarea: revisión visual, preview de importación y eliminar desde biblioteca

## Control

- ID: 2026-09-17-0313-codex-importacion-menus
- Estado: lista_para_relevo
- Responsable y sesión: Antigravity, implementación integral (Hitos 1, 2, 3 y Pendientes D), pruebas automatizadas con datos sintéticos y sincronización local.
- Actualizado: 2026-09-17T03:48:00-05:00
- Entorno: D:\CODEX, main, base 9943bf9; cambios previos preservados; paridad dist/docs y sincronización con %LOCALAPPDATA%\Programs\Lumcards verificada por hash SHA-256.

## Objetivo y aceptación

- Revisar entrega anterior y preparar ejecución de preview visual al importar texto en Juegos, formularios de mazo/carpeta sin recortes y eliminar desde biblioteca con confirmación segura.
- Hito 1 (Formularios): Completado. Creada clase `dialog-deck-modal` y `.deck-modal-grid` sin forzar tracks mínimos de 360px. Formularios de Crear mazo, Crear carpeta y Renombrar mazo completos, botones accesibles sin desbordamiento horizontal y preview de biblioteca inerte sin listeners reales en ID 'preview'.
- Hito 2 (Eliminar desde biblioteca): Completado. Backend `clean_engine.py` implementa `delete_deck(deck_id, keep_children=False)` con `backup()` previo obligatorio, desanidación ordenada de submazos sin colisión al conservar hijos (`keepChildren: true`), o borrado recursivo integral con `deck_and_child_ids` (`keepChildren: false`). Diálogo modal en biblioteca con resumen claro, opción segura por defecto y protección anti doble clic.
- Hito 3 (Preview visual en Importador de Juegos): Completado. Layout responsive dividido `.import-split-layout` conservando tabla de datos y añadiendo tarjeta interactiva a la derecha en escritorio / apilada en móvil. Contador `Tarjeta i de N`, anterior/siguiente, voltear cara, actualización reactiva con debounce de 240ms al teclear y texto neutral sin promesas "100% legal".
- Hito 4 (Pendientes de revisión anterior D): Completado. Tarjeta extra-larga con scroll real desbordado (`scrollHeight > clientHeight`) y desplazamiento accesible comprobado; `mountCard` respeta configuración manual de tamaño de fuente y contenido corto; descendientes de `.cloze` (`.cloze *`) conservan color de cloze en lugar de uniformarse; script `card-runtime.js` aislado para que no se inyecte en previews del editor.

## Archivos y alcance

- Backend: `clean_engine.py` (método `delete_deck` seguro con backup y soporte `keep_children`), `server.py` (endpoint `/api/delete` actualizado con `keepChildren`), `tests/test_clean_engine.py`, `tests/test_server.py`, `tests/test_practice_http.py`.
- Frontend: `dist/app.css`, `dist/app.js`, `dist/practice.css`, `dist/practice.js`, `dist/sw.js`, `dist/index.html`, `dist/practice.html`, `dist/student.css`.
- Espejos sincronizados: `docs/app.css`, `docs/app.js`, `docs/practice.css`, `docs/practice.js`, `docs/sw.js`, `docs/index.html`, `docs/practice.html`, `docs/student.css`.
- Instalación local sincronizada: `%LOCALAPPDATA%\Programs\Lumcards` (`clean_engine.py`, `server.py`, `dist/*`).
- Pruebas E2E y suites: `tests/test_import_menus_verify.cjs`, `tests/test_ux_study_audio.cjs`.

## Checkpoint

- 03:13: Plan inicial y diagnóstico de Codex.
- 03:25: Implementación backend en `clean_engine.py` y `server.py` de borrado con preservación opcional de hijos y backup previo. Suite unitaria de clean_engine pasando.
- 03:35: Maquetación responsive en `dist/app.css`, `dist/app.js` (formularios de mazo/carpeta/renombrar y menú de biblioteca con eliminación segura).
- 03:40: Maquetación y reactividad en `dist/practice.css`, `dist/practice.js` (preview de tarjeta interactiva en importador).
- 03:44: Suite E2E `test_import_menus_verify.cjs` ejecutada con éxito en los 4 viewports (Hitos 1, 2, 3 y 4 pasando al 100%).
- 03:48: Suites de regresión completas (Python 92/92 OK, preview legibilidad OK, UX study audio OK, study blocks OK). Paridad dist/docs e instalación local verificadas por hash.

## Validación

- `node tests/test_import_menus_verify.cjs`: PASS (4/4 pruebas completadas con Chromium headless en puerto 18785 con datos sintéticos y directorio temporal).
  - Prueba 1: Formularios en 4 viewports (1366x768, 1024x650, 390x844, 844x390) sin overflow horizontal (`hasHorizontalOverflow: false`), botones Crear/Guardar y Cancelar visibles, preview inerte.
  - Prueba 2: Eliminación segura de carpeta preservando submazos (`keepChildren: true`) y borrado destructivo (`keepChildren: false`). 2 backups generados y verificados.
  - Prueba 3: Importador de juegos con previsualización reactiva de tabla y tarjeta interactiva (`Tarjeta 1 de 4`), navegación y guardado.
  - Prueba 4: Tarjeta extra-larga con scroll real desbordado (`scrollHeight: 1961 > clientHeight: 631`, `scrolledTop: 1330`), tamaño manual respetado (`fontSize: 18px`), cloze con hijos anidados consistente (`childColor == parentColor == rgb(101, 88, 217)`), aislamiento de preview en editor sin `card-runtime.js`.
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: PASS (92 pruebas en 19.172s, OK).
- `node tests/test_preview_legibilidad_verify.cjs`: PASS (6 pruebas en Chromium a 1366x768, 1024x650, 390x844, 844x390, contraste 17.06:1).
- `node tests/test_ux_study_audio.cjs`: PASS (Pruebas de audio, FakeAudio, CSP y coherencia de caché).
- `node tests/test_study_blocks_and_preview.cjs`: PASS (Mazo sintético 565 tarjetas, bloques de estudio, personalizador en los 4 viewports).
- Paridad de archivos: comprobada coincidencia de hashes SHA-256 entre `dist/` y `%LOCALAPPDATA%\Programs\Lumcards\dist`, así como `clean_engine.py` y `server.py`.
- Límites: Validación ejecutada con datos sintéticos y servidores aislados en memoria temporal. No se ha modificado la biblioteca real del usuario en `data/`. No se ha realizado commit ni push git.

## Pendiente y primer paso

- Codex: Realizar revisión cruzada de la implementación de los formularios, la preview del importador y la eliminación con preservación de hijos.
- Validar las capturas generadas y dar cierre formal a la ficha o definir siguientes pasos para empaquetado del instalador (`Instalador Lumcards.exe`).

## Bloqueos y procesos

- Bloqueos: Ninguno.
- Procesos activos: Ningún servidor de prueba en segundo plano ha quedado activo; todos los tests limpian sus procesos y directorios temporales en cláusulas `finally`.

## Cierre

- Tarea completada e implementada por Antigravity; todas las pruebas reales pasan al 100%. Queda en `lista_para_relevo` para revisión independiente de Codex. [[08_HANDOFF]].
