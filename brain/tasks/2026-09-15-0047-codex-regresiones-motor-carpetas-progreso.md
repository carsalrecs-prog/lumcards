---
tags: [lumcards, tarea, motor, interfaz]
---

# Tarea: Restaurar carpetas, renombrado y Mi progreso tras el cambio de motor

## Control

- ID: 2026-09-15-0047-codex-regresiones-motor-carpetas-progreso.
- Estado: hecha.
- Responsable y sesión: Codex, tarea local actual.
- Actualizado: 2026-09-15T01:12:46-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `f5a8627`; se preservan todos los cambios locales previos inventariados con `git status --short`, especialmente los ya probados del motor independiente.

## Objetivo y aceptación

- Revisar el contrato del motor independiente y corregir las regresiones observadas después de sustituir el motor oficial.
- `Mi progreso` debe abrir sin el error de propiedad `days30` y mostrar métricas válidas aunque no exista historial.
- La biblioteca debe permitir crear carpetas, agrupar mazos dentro de ellas y renombrar tanto carpetas como mazos desde una opción visible.
- Mantener compatibilidad con los mazos existentes y verificar motor, API y frontend con pruebas automatizadas y una comprobación funcional proporcional.

## Archivos y alcance

- Previsto: `clean_engine.py`, `engine.py`, `server.py`, archivos pertinentes de `dist/`, pruebas relacionadas y notas de `brain/`.
- Archivos ajenos: todo cambio local no relacionado se conserva; no se harán commits ni se leerá la biblioteca personal en `data/` salvo necesidad explícita y justificada.

## Checkpoint

- 00:47: Recuperados `AGENTS.md`, portada, relevo, ficha anterior, protocolo y arquitectura. Las capturas señalan un contrato de progreso incompleto y problemas de jerarquía/acciones de renombrado. Siguiente hito: localizar rutas, métodos y consumidores exactos antes de editar código.
- 00:52: Diagnóstico confirmado en código y metadatos de mazos, sin leer contenido de tarjetas: el motor limpio devolvía estadísticas resumidas incompatibles con el frontend; los mazos importados usaban `U+001F` como separador y convivían con duplicados `::`; el endpoint de renombrado carecía de interfaz. Se preservó el inventario previo.
- 00:59: Implementada una primera corrección: normalización y fusión respaldada de jerarquías, carpetas explícitas persistentes, totales agregados, validaciones de mover/renombrar, contrato estadístico completo, endpoints y formularios visibles, compatibilidad web y renovación de caché. Añadidas pruebas unitarias, HTTP y frontend. Compilación sintáctica previa a las pruebas: Python y Node sin errores; falta ejecutar las suites tras los últimos cambios.
- 01:02: Pruebas focalizadas Python: 18/18 correctas. La prueba frontend nueva falló solo por buscar HTML literal generado dinámicamente; se corrigió la aserción y `test_frontend.cjs` pasó. Biblioteca real verificada solo por metadatos: 3.971 tarjetas y 17 mazos visibles antes de migrar; servidor activo detectado. Antes de la operación larga se deja como siguiente comando `stop.ps1` seguido de `start.ps1 -NoBrowser`; el arranque debe crear un `.colpkg` previo a la normalización y conservar las 3.971 tarjetas.
- 01:05: Servidor reiniciado limpiamente; migración real aplicada con una copia `antes-de-normalizar-carpetas-*.colpkg`. Resultado: 3.971 tarjetas conservadas, 9 mazos visibles, 1 carpeta con 3.871 tarjetas, cero separadores dañados y cero nombres duplicados. API detallada devuelve 31/366/365/24 puntos en las series principales. Verificación funcional en el mismo servidor local: biblioteca muestra una carpeta con 7 libros y totales correctos; `Mi progreso` abre todas sus secciones sin error; formularios de crear/renombrar carpeta y las opciones de mover/renombrar mazo son visibles. Consola del navegador sin errores ni advertencias. La habilidad de control de Windows no pudo enlazar la ventana nativa porque esta sesión no expone aplicaciones, por lo que se usó el navegador supervisado contra el mismo servidor.
- 01:10: Suite completa repetida después de los ajustes finales: 87/87 Python y cinco suites Node/JS correctas. `git diff --check` sin errores (solo avisos de conversión LF/CRLF preexistentes). Se retiró del docstring una afirmación jurídica absoluta. Servidor y ventana nativa reiniciados; una instancia de cada uno activa. Tarea lista para cierre documental.
- 01:12: Estado final confirmado: servidor sano, 3.971 tarjetas, 9 mazos visibles, 1 carpeta, cero separadores dañados y cero duplicados. Apareció durante el reinicio un cambio local ajeno en `tools/launcher.cs` (marca/eventos/cabecera de cierre), no realizado ni sobrescrito por Codex; se conserva y no se incluye en la validación de compilación del launcher.

## Validación

- `python -m py_compile clean_engine.py engine.py server.py` y `node --check dist/app.js dist/sw.js`, `D:\CODEX`, 00:55: correctos antes de los últimos cambios de pruebas; se repetirá junto con las suites.
- `python -m unittest tests/test_clean_engine.py tests/test_server.py`, `D:\CODEX`, 01:00: 18/18 correctas.
- `node tests/test_frontend.cjs`, `D:\CODEX`, 01:01: correcto tras ajustar una aserción del propio test.
- Verificación real de API y UI, 01:03–01:05: correcta; aún falta la suite completa de regresión.
- Suite completa Python indicada en el relevo, `D:\CODEX`, 01:07: 87/87 correctas en 18,633 s.
- Cinco suites Node/JS indicadas en el relevo, `D:\CODEX`, 01:07: todas correctas.
- `python -m py_compile`, `node --check` y `git diff --check`, 01:06: sin errores; solo avisos de finales de línea LF/CRLF.
- API/UI final tras recarga, 01:08: estadísticas visibles, biblioteca consolidada y consola sin errores.
- `tools/check-brain.ps1`, 01:11: el primer intento detectó que el nuevo relevo usaba títulos de sección no canónicos; se corrigieron a `Hecho`, `Pendiente` y `Primer paso`. Segundo intento: `Status OK`, 18 notas, 51 enlaces, 4 fichas y 3 entradas de agente comprobadas.

## Pendiente y primer paso

- Tarea concluida. Esperar nueva instrucción; una recomendación separada sería empaquetar y probar instalador/Android, pero no está autorizada en esta tarea.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor Lumcards en el puerto 8765, una ventana nativa reiniciada y una pestaña supervisada marcada como entregable.

## Cierre

- Implementado, probado y aplicado a la biblioteca local con respaldo previo. No empaquetado, instalado en otro equipo ni publicado. Notas globales actualizadas; continuidad en [[08_HANDOFF]].
