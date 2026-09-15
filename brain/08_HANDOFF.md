---
tags: [lumcards, relevo]
updated: 2026-09-15
---

# Relevo actual

## Control

- Agente: Codex.
- Actualizado: 2026-09-15T01:12:46-05:00.
- Estado: hecha.
- Tarea: [[tasks/2026-09-15-0047-codex-regresiones-motor-carpetas-progreso]].
- Entorno: `D:\CODEX`, rama `main`, commit base `f5a8627`; cambios locales sin commit, incluidos cambios previos conservados.

## Hecho

- Corregido `Mi progreso`: `get_detailed_stats()` vuelve a entregar el contrato completo consumido por el frontend (hoy, pronóstico, calendario, historial, estados, intervalos, facilidad, retención, horarios, botones y tarjetas añadidas).
- Restaurada la organización en carpetas: carpetas vacías persistentes, creación visible, movimiento de mazos, totales agregados y renombrado de carpetas/mazos con validación de duplicados y ciclos.
- Normalizados los separadores de jerarquía modernos `U+001F` a `::`. La biblioteca local se migró con copia `.colpkg` previa: 3.971 tarjetas conservadas, 17 registros visibles consolidados en 9, una carpeta con siete mazos y 3.871 tarjetas, sin separadores dañados ni nombres duplicados.
- `dist/index.html` y `dist/sw.js` renuevan la versión de caché. Servidor y ventana nativa reiniciados para cargar el frontend nuevo.

## Archivos principales

- Código: `clean_engine.py`, `server.py`, `dist/app.js`, `dist/index.html`, `dist/sw.js`.
- Pruebas: `tests/test_clean_engine.py`, `tests/test_server.py`, `tests/test_frontend.cjs`.
- Memoria: ficha de tarea, `brain/01_CURRENT.md`, `brain/02_NEXT.md`, `brain/03_DECISIONS.md`, `brain/04_LOG.md`, este relevo.

## Validación

- Python: 87/87 pruebas correctas en la suite completa de diez módulos.
- Node/JS: cinco suites completas correctas.
- Sintaxis: `py_compile` y `node --check` correctos.
- Diff: `git diff --check` sin errores; solo avisos LF/CRLF.
- Funcional: API real y navegador supervisado muestran biblioteca consolidada, crear/renombrar carpetas, mover/renombrar mazos y todas las secciones de `Mi progreso`; consola sin errores.
- Memoria: `tools/check-brain.ps1` en estado `OK` tras comprobar 18 notas, 51 enlaces, 4 fichas y 3 entradas de agente.
- Estado de entrega: implementado, probado y aplicado localmente. No empaquetado, instalado en otro equipo ni publicado.

## Pendiente

- No queda trabajo técnico autorizado de esta tarea.
- Continúan como backlog separado la revisión jurídica externa y las pruebas de empaquetado/instalación/plataformas.

## Primer paso

- Esperar una nueva instrucción del usuario.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor Lumcards escuchando en el puerto 8765, una ventana nativa y una pestaña supervisada marcada como entregable.
- Cambio concurrente/ajeno preservado: `tools/launcher.cs` apareció modificado a las 01:10; Codex no lo editó y no verificó una recompilación del launcher.
- No hacer commit Git automático; el usuario gestiona el control de versiones.
