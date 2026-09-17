---
tags: [lumcards, tarea]
---

# Tarea: Delegación de audio al padre y layout flex-start

## Control

- ID: 2026-09-16-1300-antigravity-audio-parent-delegation
- Estado: hecha
- Responsable y sesión: Antigravity
- Actualizado: 2026-09-16T13:16:00-05:00
- Entorno: `D:\CODEX`, rama `main`.

## Objetivo y aceptación

- Petición del usuario: "Qiuero que al poner los parlantes apretarlos se reproduzca el sonido, tambien qe el flshcard o cualquier cosa se adecue a la pantalla para que no haya espacios feos".
- Aceptación: El reproductor de audio embebido debe comunicarse con el padre para eludir las restricciones del sandbox y reproducir siempre. El contenedor debe ocupar la altura disponible pero alinear el contenido al tope (sin estirarse ni dejar huecos negros feos en pantallas largas).

## Archivos y alcance

- Archivos modificados: `dist/app.js`, `dist/app.css`, `tests/test_ux_study_audio.cjs`, `tests/test_server.py`, `tests/test_practice_http.py`, y sincronización de `docs/`.
- Archivos ajenos: El resto de la UI, motor local en Python. 

## Checkpoint

- Implementación del nuevo layout con `height: 100%`, `min-height: 0` y `justify-content: flex-start` en vez de `min-height: 100dvh` forzado.
- Cambio de `installCardAudioRuntime` para enviar un `postMessage({ ankiPlayAudio: src })` en vez de embeber la etiqueta de audio para el modo incrustado.
- Pruebas modificadas y ejecutadas con éxito en ambos entornos (Node.js y Python).

## Validación

- Suite Python completa: 90/90 correctas.
- Suite Node/JS completa: 6 suites correctas, sin regresiones DOM ni estructurales detectadas.
- Paridad SHA256 completada de `dist/` a `docs/`.

## Pendiente y primer paso

- Pendiente: Confirmación visual/auditiva del usuario (WebView2 browser validation automatizada falló por restricciones CDP, se verificó todo en tests).
- Primer paso para el usuario: Abrir Lumcards y verificar las tarjetas y audio incrustado.

## Bloqueos y procesos

- Decisiones del usuario: Mantener el aislamiento del iframe pero delegar la lógica de `<audio>` al padre para evitar bloqueos del sandbox (WebView2 / Cross-origin restrictions).
- No hay procesos activos.

## Cierre

- Tarea completamente implementada en código, pruebas adaptadas y pasando, y archivos sincronizados.
- Enlace al relevo: [[08_HANDOFF]].
