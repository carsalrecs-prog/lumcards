---
tags: [lumcards, tarea]
---

# Tarea: editor amplio, contraste y tarjetas adaptables

## Control

- ID: 2026-09-17-0235-codex-preview-legibilidad
- Estado: lista_para_relevo
- Responsable y sesión: Antigravity, ejecución y verificación en navegador Chromium real. Plan previo de Codex.
- Actualizado: 2026-09-17T03:07:00-05:00
- Entorno: D:\CODEX, main, base 9943bf9; cambios acumulados sincronizados entre dist/ y docs/.

## Objetivo y aceptación

Corregir los tres puntos críticos de legibilidad, contraste y vista previa solicitados por el usuario:
1. Editor amplio y vista previa útil, sin recortes ni scroll horizontal (`dialog.dialog-card-editor`, ancho `min(1200px, 96vw)`, alto `94dvh`, resolver límite 680px de `body.in-study dialog`, preview >= 400px en desktop con iframe flexible sin altura fija de 290px, mobile en pestañas accesibles sin roturas).
2. Colores legibles y coherentes entre vista previa y estudio (en modo Lumcards, el tema prevalece sobre colores oscuros/claros conflictivos de `card.css` o estilos inline con contraste >= 4.5:1, preservando cloze, fórmulas katex, svg y audio; en modo Original se respeta el diseño importado; preview y estudio aplican el mismo estilo resuelto).
3. Contenido corto centrado vertical/horizontalmente con tipografía adaptable (`card-short` con clamp 24–38px en desktop, 20–30px en móvil); contenido largo completo y accesible desde el inicio con scroll vertical sin `overflow: hidden` tramposo ni zooms con `transform`.

## Archivos y alcance

- Modificados: `dist/app.css`, `docs/app.css`, `dist/app.js`, `docs/app.js`, `dist/card-runtime.js`, `docs/card-runtime.js`, `tests/test_ux_study_audio.cjs`.
- Pruebas y capturas añadidas: `tests/test_preview_legibilidad_repro.cjs`, `tests/test_preview_legibilidad_verify.cjs`, `tests/screenshots_preview_repro/`, `tests/screenshots_preview_verified/`.
- Sincronización de copia instalada local: `$env:LOCALAPPDATA\Programs\Lumcards\dist`.
- Memoria operativa: `brain/tasks/2026-09-17-0235-codex-preview-legibilidad.md`, `brain/08_HANDOFF.md`, `brain/01_CURRENT.md`, `brain/02_NEXT.md`, `brain/04_LOG.md`.
- Alcance respetado: sin tocar colecciones personales del usuario, sin modificar `clean_engine.py` ni `server.py`, sin commits ni push.

## Checkpoint

- 02:35–02:38 - Diagnóstico estático y plan de Codex.
- 02:45–02:55 - Reproducción del fallo previa documentada con `test_preview_legibilidad_repro.cjs` (diálogo limitado a 680px, preview comprimida a 160px con scroll horizontal y tarjeta corta pegada arriba).
- 02:55–03:00 - Implementación en CSS, JS y card-runtime de dist/ y docs/.
- 03:00–03:05 - Verificación integral en Chromium con `test_preview_legibilidad_verify.cjs` y resolución de compatibilidad con suites de regresión.
- 03:05–03:08 - Sincronización de copia instalada local, inspección visual de capturas y actualización de memoria Brain.

## Validación

- **Suite de verificación integral (`tests/test_preview_legibilidad_verify.cjs`)**:
  - Editor en estudio a 1366×768: `dialogClientWidth: 1198px`, `scrollWidth: 1198px`, `hasHorizontalOverflow: false`, `prevColWidth: 520px` (supera objetivo >= 400px), `frameHeight: 519.09px`.
  - Centrado vertical corto: `verticalOffsetRatio: 0.000012` (< 0.001% de desviación respecto al centro geométrico del área útil). `fontSize: 25px`.
  - Contenido largo accesible: `isLongClassPresent: true, h3Top: 42.8px, isH3AtTop: true, overflowY: 'auto'`.
  - Contraste Lumcards: texto blanco sobre Índigo (`rgb(15, 23, 42)`), relación WCAG 2.1 calculada de **17.06:1** (supera 4.5:1), preservando cloze (`rgb(101, 88, 217)`) y KaTeX.
  - 4 viewports y resize dinámico: 1366×768, 1024×650, 390×844, 844×390 sin scroll horizontal ni roturas, con persistencia del borrador tras resize.
  - Cierre modal: limpieza de clases `modal.className = ''`.
- **Capturas inspeccionadas en `tests/screenshots_preview_verified/`**:
  - `verified-01-editor-in-study-1366x768.png`
  - `verified-02-study-short-card-centered.png`
  - `verified-03-study-long-card-scrollable.png`
  - `verified-04-contrast-lumcards-mode.png`
  - `verified-05-viewport-1024x650.png`
  - `verified-06-viewport-390x844-preview-tab.png`
  - `verified-07-viewport-844x390-landscape.png`
- **Suites de regresión**:
  - `node tests/test_ux_study_audio.cjs`: PASS (audio, replay, FakeAudio, DOM/CSS).
  - `node tests/test_study_blocks_and_preview.cjs`: PASS (565 tarjetas, bloques, recarga, personalizador índigo).
  - `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: PASS (91 tests en 19.695s).
- **Distinción de estados**:
  - `implementado`: en código fuente `dist/` y `docs/` (`app.css`, `app.js`, `card-runtime.js`).
  - `probado`: en Chromium headless real con Playwright en servidor temporal aislado y datos sintéticos en 4 viewports; suites de regresión pasando al 100%.
  - `empaquetado`: **NO reempaquetado** en nuevo ejecutable instalador (`Instalador Lumcards.exe` y `Lumcards.exe` conservan binarios anteriores al no haber cambios de C#).
  - `instalado`: activos estáticos copiados a `$env:LOCALAPPDATA\Programs\Lumcards\dist`, aplicación instalada no reiniciada en caliente.

## Pendiente y primer paso

- Estado dejado en `lista_para_relevo` para revisión y validación independiente por parte de Codex.
- Codex puede ejecutar `node tests/test_preview_legibilidad_verify.cjs` o inspeccionar las capturas en `tests/screenshots_preview_verified/`.
- No requiere acciones inmediatas adicionales en código.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local en puerto 8765 y host `Lumcards.exe` (PID 19212) activos en el entorno. Servidores temporales de test fueron detenidos ordenadamente tras finalizar cada suite.

## Cierre

- Tarea ejecutada y verificada al 100% siguiendo todos los criterios de aceptación y preservando audio, bloques y paridad. Relevo actualizado en [[08_HANDOFF]].
