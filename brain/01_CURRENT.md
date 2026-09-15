---
tags: [lumcards, estado]
updated: 2026-09-15
---

# Estado actual

## Memoria compartida

- Codex, Claude Code y Antigravity tienen entradas de proyecto dirigidas a `AGENTS.md` y al mismo cerebro `brain/`.
- Protocolo de checkpoints y relevo: [[07_PROTOCOL]], [[08_HANDOFF]]; uso y limites: [[09_GUIDE]].
- Inventario observado de skills y MCP, sus límites y protocolo para pedir capacidades nuevas: [[10_AGENT_CAPABILITIES]].
- 2026-09-13: estructura y deteccion de relevos invalidos verificadas. Carga efectiva en sesiones de Claude Code/Antigravity aun no verificada; no hay detector universal de tokens.

## Producto

- Marca de trabajo: **Lumcards**.
- Escritorio Windows: `Lumcards.exe`, host WinForms con WebView2 y servidor Python local.
- Web/PWA: frontend estático en `dist/`, configuración de Vercel y Firebase.
- Android: proyecto Capacitor en `android/`; existe `Lumcards-Offline.apk` en la raíz.
- Biblioteca local: colección y medios bajo `data/`. Están dentro de la carpeta raíz del vault, pero se excluyen de la memoria documental y de la lectura inicial de agentes.

## Funciones presentes

- Mazos, tarjetas, edición, búsqueda, estadísticas, repaso espaciado, audio, fórmulas y oclusión de imágenes.
- Carpetas persistentes para agrupar mazos; creación, movimiento y renombrado de carpetas y mazos desde la biblioteca.
- Importación de `.apkg`, `.colpkg`, `.anki2`, CSV, TSV, TXT y JSON.
- Juegos de elección, escritura, parejas y otras actividades en `dist/practice.js` y `dist/study-games.js`.
- Historial de práctica separado en `data/practice.sqlite3`.
- Sincronización local/P2P y código de sincronización web mediante Firebase.

## Dependencias decisivas

- `engine.py` es un adaptador directo al motor limpio independiente `clean_engine.py`. No importa `anki` en tiempo de ejecución.
- `clean_engine.py` implementa en Python puro + SQLite (`sqlite3`) la colección, notas, tarjetas, búsqueda, historial `revlog`, cálculo de rachas, planificador de repaso espaciado, importación/exportación de `.apkg` / `.colpkg` / `.anki2`, soporte para esquemas legacy y modernos (Anki 2.1b), jerarquías de mazos y renderizado estático de plantillas Mustache.
- `requirements-lock.txt` ya NO contiene `anki==26.8.1`. Se incorporó `zstandard==0.25.0` (licencia permisiva BSD) para la descompresión de paquetes y medios de Anki moderno.
- WebView2 y KaTeX conservan sus propios avisos de licencia permisivos.

## Validación conocida

- 2026-09-15: Suite completa de Python ampliada a 87 pruebas, cinco suites Node/JS y comprobación funcional de escritorio/web en verde. La biblioteca local se migró con copia previa: 3.971 tarjetas conservadas, jerarquía consolidada sin separadores dañados ni nombres duplicados; `Mi progreso` y las acciones de carpeta/renombrado se verificaron en el servidor real. Detalle en [[tasks/2026-09-15-0047-codex-regresiones-motor-carpetas-progreso]].
- 2026-09-14: Suite completa de Python (83 pruebas) pasando al 100% en verde (`tests/test_clean_engine.py`, `tests/test_engine.py`, `tests/test_engine_enhancements.py`, `tests/test_io_integration.py`, `tests/test_native_image_occlusion.py`, `tests/test_practice_http.py`, `tests/test_quizlet_and_clean_importer.py`, `tests/test_server.py`, `tests/test_text_import.py`, `tests/test_text_import_engine.py`).
- 2026-09-14: Suite completa de pruebas JS/Node pasando al 100% en verde (`test_study_games.cjs`, `test_quizlet_games.cjs`, `test_sync_manager.cjs`, `test_anki_game_interaction.cjs`, `test_frontend.cjs`).
- Corregida la filtración de `frontKey`/`backKey` en `dist/study-games.js`.
- No se ejecutó una compilación Android ni un despliegue después de eliminar `node_modules`; primero hay que ejecutar `npm install`.

## Estado del repositorio

- Rama `main` conectada y sincronizada con `origin/main` (`https://github.com/carsalrecs-prog/lumcards.git`).
- Avances consolidados confirmados y subidos a GitHub; despliegue automático activo en Vercel (`https://lumcards.vercel.app`).
- `docs/` sincronizado con `dist/` para paridad completa con la PWA.

## Observaciones críticas

- `README.md` reconoce el uso del motor AGPL, pero también contiene frases que presentan Lumcards como totalmente independiente.
- `COMMERCIAL_SPECIFICATION.md` contiene conclusiones legales absolutas que no han sido validadas por asesoría jurídica.
- Ningún documento del repositorio prueba que el producto esté listo para una venta con código privado.
