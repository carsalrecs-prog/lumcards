---
tags: [lumcards, tarea]
---

# Tarea: Reparar persistencia y estadisticas web

## Control

- ID: 2026-09-18-2133-codex-reparar-persistencia-web
- Estado: hecha
- Responsable y sesión: Codex, continuacion autorizada por usuario.
- Actualizado: 2026-09-18T21:33:00-05:00
- Entorno: D:\CODEX main base 66227af; preservar cambios previos de todos los agentes.

## Objetivo y aceptación

- Continuar pendientes funcionales web, separados del rediseno: cuatro regresiones reproducidas deben pasar en Chromium estatico sin backend, preservando datos originales.

## Archivos y alcance

- dist/docs app.js, index.html, sw.js; pruebas static/webstats/cache y HTTP; cerebro. Preservar motor, escritorio, Firebase y aportes ajenos.

## Checkpoint

- Ver checkpoints y resultados al final.

## Validación

- D:\CODEX, 2026-09-18; evidencia detallada al final.

## Pendiente y primer paso

- Cerrar regresiones y memoria; posteriormente validar nube real en entorno autorizado.

## Bloqueos y procesos

- Sin conflicto activo. Nube real no probada; procesos de pruebas efimeros.

## Cierre

- Cuatro fallos funcionales corregidos localmente; sin publicar/instalar. [[08_HANDOFF]].

## Alcance concreto
- Reparacion funcional separada del rediseno autorizada al continuar pendientes. Cuatro casos E2E rojos conocidos; sin leer biblioteca ni cambiar motor/SRS/Firebase.
- Archivos previstos: app.js y espejo, HTML/SW para cache, tests static/webstats, notas.
- Primer paso: errores de lectura/guardado propagados, fechas locales validas y estado explicito de fallo de estadisticas.
- Validacion inicial: 1 flujo PASS y 4 FAIL reproducidos en turno anterior.

## Checkpoint funcional
- Primeros 5 casos Chromium PASS, incluidos los cuatro fallos previos. Ampliada suite a 9 escenarios: historial invalido/futuro conservado, ausencia de historial sin metricas inventadas, formato null preservado, error de estadisticas sin bucle y reintento manual.
- Guardado fallido conserva borrador y no agenda subida; recuperacion al desbloquear almacenamiento probada.
- PWA offline: crear mazo sintetico y recargar conservandolo PASS. Cache r4, KaTeX local retenido.
- Capturas de error en 6 tamanos y 2 temas; inspeccionadas 320 oscuro y 1366 claro, sin recorte.
- Paridad app/index/SW 3/3 y diff-check PASS. Regresiones completas en curso. Sin motor/SRS ni protocolo Firebase modificados.

- Regresion masiva: 9 suites verdes y 2 fallos de lectura anticipada (borrado tras 600 ms, calificacion tras 200 ms). Borrado original repetido PASS. Se conservan las aserciones y se espera el resultado visible con timeout 10 s; repetir ambas. Python completo 93/93 PASS.

## Evidencia final
- test_static_web_e2e.cjs: 9/9 escenarios PASS, sin errores JS. Incluye flujo crear/estudiar/estadisticas/recarga; dia local y fecha heredada; cuota con borrador recuperable, cero subidas y guardado tras desbloqueo; JSON ilegible y null conservados; historial invalido/futuro conservado; ausencia de historial sin tiempos/retencion inventados; respuesta invalida sin bucle y reintento con teclado/foco.
- test_studio_math_cache.cjs: PASS; cache r4 y recursos KaTeX offline. Ampliado a mazo sintetico creado sin red y conservado tras recarga (persistencia local real, no Firebase).
- Suite Python completa: 93 tests OK (36.872 s). Backend/motor sin cambios propios; actualizado solo query esperado por test_server.py.
- Dos suites tenian esperas fijas insuficientes: ambas pasaron sin cambios al repetir, luego se reemplazaron las esperas por condiciones comprobables (borrado completado, contador repasado, importacion de cuatro tarjetas). No se eliminaron aserciones ni ampliaron permisos.
- Capturas error/reintento: tests/screenshots_web_recovery, 12 vistas (6 tamanos x 2 temas, movimiento reducido). Inspeccionadas 320 oscuro y 1366 claro. Estudios y previews cubiertos por suites existentes.
- Archivos finales propios: dist/docs app.js, index.html, sw.js; tests/test_static_web_e2e.cjs, test_studio_math_cache.cjs, test_studio_remaining_design.cjs (expectativa cache), test_server.py (version), test_import_menus_verify.cjs y test_study_blocks_and_preview.cjs (esperas deterministas); tests/web_storage_regressions.json; notas compartidas/ficha/archivo del log.
- Paridad dist/docs app/index/SW verificada SHA256; diff-check PASS. Sin cambios del motor, algoritmos SRS, Firebase, SQLite ni biblioteca personal. No dependencias nuevas.
- No probado: cuentas remotas reales, login/proveedores/reglas de Firebase, Drive ni cola de sincronizacion offline. No se afirma sincronizacion remota por haber probado almacenamiento local. No empaquetado, instalado, publicado ni push.

- Regresion final: 11/11 suites exit 0 en tests/web_storage_regressions.json (incluye initialExitCode de dos fallos temporales). frontend, library_navigation_design, study_studio_design, studio_etapa3_design, practice_studio, practice_folder_selection, import_menus_verify, preview_legibilidad_verify, study_blocks_and_preview, ux_study_audio, web_stats.
- Procesos propios finalizados. Sin bloqueos locales para este hito. Siguiente: validacion remota con cuentas de prueba y configuracion autorizada; no desplegar automaticamente.

- tools/check-brain.ps1 PASS: 59 notas, 208 enlaces y 41 fichas; git status/diff finales revisados, cambios ajenos preservados.
