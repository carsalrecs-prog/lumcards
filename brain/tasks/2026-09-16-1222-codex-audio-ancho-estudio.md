---
tags: [lumcards, tarea, escritorio, estudio, audio, responsive]
---

# Tarea: repetir audio incrustado y aprovechar el ancho horizontal

## Control

- ID: 2026-09-16-1222-codex-audio-ancho-estudio.
- Estado: hecha.
- Responsable y sesión: Codex, diagnóstico e implementación.
- Actualizado: 2026-09-16T12:31:27-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `9943bf9`; worktree conserva las correcciones UX, instalador y caché anteriores, además del cambio ajeno `.obsidian/graph.json`.

## Objetivo y aceptación

- Al pulsar cualquier altavoz incrustado en una tarjeta, el audio debe empezar desde cero y volver a reproducirse en pulsaciones consecutivas.
- La reproducción anterior debe detenerse sin que callbacks tardíos alteren el estado visual de la nueva.
- El visor horizontal debe usar prácticamente todo el ancho disponible, sin las franjas laterales amplias causadas por limitar el propio `<body>` del iframe a 1040 px.
- Conservar reproducción automática, altavoz global, tecla `R`, seguridad del canal padre/iframe, scroll interno para contenido largo y controles de calificación.

## Archivos y alcance

- Previstos: `dist/app.js`, `docs/app.js`, prueba frontend/UX, versión de caché/HTML/SW si corresponde, artefactos de escritorio instalados y memoria.
- No modificar motor, biblioteca real, datos, nube ni planificador.
- Preservar todos los cambios acumulados y el servidor previo en 8765.

## Checkpoint

- 12:22 - Captura y código contrastados. El ancho se pierde porque `body class="card"` recibe a la vez el `max-width:1040px` del contenedor y estilos de la plantilla; el fondo de `html` queda visible a ambos lados. El clic de audio sí alcanza el botón, pero depende enteramente de un mensaje que el receptor descarta si WebView2 reporta origen `null`. Siguiente: runtime de audio directo y probado dentro del iframe, wrapper `.card` de ancho completo y respaldo de mensaje limitado al iframe actual.
- 12:26 - Implementado un runtime de audio dentro del iframe: cada pulsación crea una reproducción desde cero, detiene y rebobina la anterior y protege el estado visual frente a callbacks tardíos. El mensaje de respaldo solo se acepta desde el `contentWindow` del iframe actual y admite origen opaco únicamente cuando el iframe usa `srcdoc`.
- 12:27 - Separado el `<body>` de la clase `.card`; el contenido usa un `<main class="card">` forzado a ancho completo después de los estilos importados de la tarjeta. La prueba conductual y el contrato DOM/CSS pasan. Caché renovada a `20260916-ux3`.
- 12:31 - Suite completa y sincronización terminadas. Los cuatro activos cambiados se copiaron a la instalación local, sus SHA256 coinciden con `dist/`, la aplicación raíz se reinició y el servidor activo entrega `ux3` y el runtime nuevo.

## Validación

- 90/90 pruebas Python correctas con `.venv`.
- Seis suites Node/JS correctas, incluida una prueba `FakeAudio` que pulsa dos veces, comprueba pausa y reinicio a cero, y dispara el callback tardío de la instancia anterior.
- `node --check` correcto en `dist/app.js`, `docs/app.js` y `dist/sw.js`.
- `dist/` y `docs/` idénticos por SHA256 para `app.js`, `index.html`, `practice.html` y `sw.js`; sin referencias restantes a `20260916-ux2`.
- El servidor activo en 8765 entrega HTML `20260916-ux3` y `app.js` con el runtime y la estructura nueva. Los cuatro activos instalados coinciden por SHA256 con `dist/`.
- `git diff --check` correcto. El conector visual no expuso ventanas nativas, por lo que no se obtuvo una captura automatizada ni se confirmó el sonido por hardware; la conducta quedó cubierta con prueba automatizada y la observación final corresponde al usuario.

## Pendiente y primer paso

- Pendiente funcional conocido: ninguno.
- Primer paso: el usuario comprueba en la tarjeta original que los tres parlantes repiten y que la superficie negra llena el visor horizontal. Si algo persiste, registrar captura y señalar cuál parlante se pulsó.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor previo en 8765 y Lumcards raíz reabierto con los activos `ux3`.

## Cierre

- Implementado, probado e instalado localmente. No se hizo commit, `push` ni despliegue. Continuidad en [[08_HANDOFF]].
