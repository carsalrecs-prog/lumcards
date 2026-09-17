---
tags: [lumcards, tarea]
---

# Tarea: personalización real, estudio en bloques y vistas previas en tiempo real

## Control

- ID: 2026-09-17-0145-antigravity-personalizacion-bloques-vistas
- Estado: hecha
- Responsable y sesión: Antigravity (13398467-f379-43aa-a975-83f24b788a5b)
- Actualizado: 2026-09-17T02:25:00-05:00
- Entorno: D:\CODEX, main; preservando cambios acumulados sin commit.

## Objetivo y aceptación

- Personalización de diseño de tarjetas con renderizado unificado (`mountCard` / iframe CSP), tema "Lumcards Índigo", anverso/reverso, scroll interno seguro y precedencia configurable con plantillas importadas.
- Estudio en bloques de 10, 20, 50, personalizado o todas las disponibles hoy; explicación del calendario vs. total del mazo; persistencia servidor/cliente en `study_blocks.json`; conteo estricto de tarjetas distintas repasadas sin inflar con "Otra vez"; resumen al finalizar primera pasada sin auto-avance; gestión de recargas y tarjetas modificadas/eliminadas.
- Identificación de tarjetas ya repasadas en el mazo con check accesible "Repasada en este bloque", filtros y estado histórico "Repasada antes". Separación total con Juegos.
- Vistas previas en tiempo real al crear: mazos (tarjeta de biblioteca y datos reales) y tarjetas (anverso/reverso y modos de juego), split-view en escritorio y pestañas en móvil, sin autoplay de audio ni efectos secundarios al cancelar.
- Pruebas reales en navegador Chromium en 1366x768, 1024x650, 390x844 y 844x390 con capturas inspeccionadas y suite automatizada.

## Archivos y alcance

- Modificados: `clean_engine.py`, `server.py`, `dist/app.js`, `dist/app.css`, `dist/student.css`, `dist/sw.js`, `dist/index.html`, `dist/practice.html`, espejos en `docs/`, `tests/test_study_blocks_and_preview.cjs`, sincronización a `%LOCALAPPDATA%\Programs\Lumcards`.
- Preservados: `card-runtime.js`, CSP estricta de servidor/iframe, reproductor de audio, datos personales y compatibilidad con colecciones Anki.

## Checkpoint

- 2026-09-17T01:45:00-05:00: Plan aprobado por el usuario en `implementation_plan.md`. Tarea inicializada en `brain/tasks/`.
- 2026-09-17T02:05:00-05:00: Motor `clean_engine.py` y rutas `/api/study/block-*` implementadas y verificadas con 91 pruebas unitarias Python.
- 2026-09-17T02:12:00-05:00: Frontend `dist/app.js` y `dist/app.css` integrados. Resuelta duplicidad de `cardForm` y ajuste de sensibilidad de mayúsculas en preview de modo de juego.
- 2026-09-17T02:14:00-05:00: Suite Chromium en 4 viewports completada al 100% sin errores. 15 capturas generadas e inspeccionadas.
- 2026-09-17T02:20:00-05:00: Sincronización completa con `docs/` e instalación local. Servidor local reiniciado en 8765 y verificado con `api/health` y `api/study/block-info`.

## Validación

- **Prueba E2E real en Chromium (`tests/test_study_blocks_and_preview.cjs`)**:
  - Servidor temporal y colección sintética de 565 tarjetas (sin tocar la biblioteca del usuario).
  - Personalizador: selección de "Lumcards Índigo" y alineación "Centrado" con renderizado en iframe en tiempo real. Precedencia de plantilla y scroll interno verificados.
  - Vistas previas en tiempo real: creación de mazo con tarjeta viva idéntica a la biblioteca; creación de tarjetas con split-view en escritorio, pestañas en móvil, alternancia anverso/reverso y modos de juego (Elegir y Escribir). Cancelación sin efectos secundarios.
  - Bloques de estudio: selector con opciones de 10, 20, 50, personalizado y todas hoy; texto aclaratorio entre total del mazo (565) y tarjetas para hoy.
  - Flujo de repaso: botón "Otra vez" calificado sin inflar el número de tarjetas distintas del bloque; persistencia verificada tras recarga del navegador (`page.reload()`).
  - Resumen de bloque: pantalla al completar la primera pasada sin auto-avance descontrolado, con métricas de repasadas y programadas para después.
  - Filtros y etiquetas: lista de tarjetas con etiquetas "Repasada en este bloque" e historial "Repasada antes" independiente de juegos. Filtros de bloque funcionando.
  - 15 capturas generadas e inspeccionadas visualmente en `tests/screenshots_study_blocks/` en los 4 viewports (1366x768, 1024x650, 390x844, 844x390).
- **Pruebas Python (`tests/test_*.py`)**: 91/91 pruebas pasando exitosamente en 19.31s.
- **Instalación y entorno**: Archivos sincronizados en `%LOCALAPPDATA%\Programs\Lumcards`. Servidor activo en puerto 8765 respondiendo `app: lumcards` y `/api/study/block-info`. Host de escritorio `Lumcards.exe` activo.

## Pendiente y primer paso

- Ninguno para esta tarea. Todos los requerimientos fueron implementados y comprobados con evidencia real en Chromium.
- Próximo paso recomendado: pruebas auditivas o empaquetado si el usuario lo solicita.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: `Lumcards.exe` (PID 19212) y servidor Python local en puerto 8765.

## Cierre

- Implementado, probado en Chromium real con mazo sintético, sincronizado en `docs/` e instalación local; sin commit ni publicación. [[08_HANDOFF]].
