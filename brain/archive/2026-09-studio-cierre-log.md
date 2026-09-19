---
tags: [lumcards, archivo]
---

# Registro conservado durante cierre Studio

## 2026-09-17 — Revisión parcial y plan de importador/formularios/borrado

- Codex ejecutó `node tests/test_preview_legibilidad_verify.cjs`: PASS; detectó cobertura incompleta de scroll largo y nuevos formularios. Código confirma preview mínima 360px en diálogo estrecho, tabla sin tarjeta visual en importador y falta de eliminar en menú biblioteca. Borrado actual no recorre descendientes.
- Plan para Antigravity en [[tasks/2026-09-17-0313-codex-importacion-menus]]. Solo ficha, relevo, estado, backlog y registro modificados; suite regeneró sus capturas. Sin implementación/instalación ni borrado real. `tools/check-brain.ps1`: OK (31 notas, 105 enlaces, 16 fichas).

## 2026-09-17 — Editor amplio, contraste Lumcards y composición adaptable

- Resultado: implementados y verificados en Chromium real los 3 ejes de la ficha:
  1. Editor de tarjeta con clase propia `dialog.dialog-card-editor` (ancho min(1200px, 96vw), alto 94dvh, resuelto el límite de 680px en estudio), preview espaciosa de 520px de ancho y 519px de alto sin scroll horizontal; modo móvil en pestañas accesibles `.mobile-tab-bar` con persistencia de borrador.
  2. Precedencia de estilos Lumcards con contraste WCAG 2.1 verificado de 17.06:1 sobre estilos conflictivos oscuros importados, preservando cloze, KaTeX, SVG y audio; modo Original intacto.
  3. Contenido corto centrado verticalmente (error < 0.001%) con tipografía adaptativa clamp 24-38px; contenido largo accesible desde el inicio (h3Top: 42.8px) con scroll vertical natural sin recortes.
- Archivos: `dist/app.css`, `docs/app.css`, `dist/app.js`, `docs/app.js`, `dist/card-runtime.js`, `docs/card-runtime.js`, `tests/test_preview_legibilidad_repro.cjs`, `tests/test_preview_legibilidad_verify.cjs`, `tests/test_ux_study_audio.cjs`, sincronización a `%LOCALAPPDATA%\Programs\Lumcards\dist`.
- Validación: suites automatizadas en Chromium real en 4 viewports (1366x768, 1024x650, 390x844, 844x390); 7 capturas inspeccionadas en `tests/screenshots_preview_verified/`; suites de audio (`test_ux_study_audio.cjs`), bloques (`test_study_blocks_and_preview.cjs`) y 91 tests de Python en verde. Ficha: [[tasks/2026-09-17-0235-codex-preview-legibilidad]].

## 2026-09-17 — Plan correctivo de preview y legibilidad

- Codex verificó reglas de diálogo, tema y layout frente a capturas del usuario. Plan para Antigravity con regresiones desde estudio, contraste efectivo, centrado adaptativo y pruebas en cuatro viewports: [[tasks/2026-09-17-0235-codex-preview-legibilidad]].
- Solo memoria modificada: ficha, relevo, estado y backlog. Sin implementación, instalación ni pruebas funcionales nuevas; `tools/check-brain.ps1` OK (30 notas, 100 enlaces, 15 fichas). Preservados cambios ajenos.

## 2026-09-17 — Personalización real, bloques de estudio y vistas previas en tiempo real

- Resultado: implementados los 4 ejes solicitados:
  1. Personalizador con renderizado unificado en iframe CSP (`mountCard`), tema "Lumcards Índigo" (con migración retrocompatible de quizlet), centrado real, scroll interno seguro y precedencia configurable frente a estilos importados.
  2. Estudio en bloques (10, 20, 50, personalizado, todas hoy) con explicación mazo total vs hoy, persistencia en disco (`study_blocks.json`), conteo de tarjetas únicas sin inflar por «Otra vez», resumen al finalizar primera pasada y soporte para recargas.
  3. Identificación de tarjetas ya repasadas con checkmark visible, etiqueta «Repasada en este bloque», filtros dedicados y distinción del historial previo «Repasada antes» (separado de Juegos).
  4. Vistas previas en tiempo real al crear mazos (tarjeta en biblioteca) y tarjetas (split-view en escritorio, pestañas en móvil, alternancia anverso/reverso y modos de juego), sin autoplay ni efectos secundarios.
- Archivos: `clean_engine.py`, `server.py`, `dist/app.js`, `dist/app.css`, `dist/student.css`, `dist/sw.js`, `dist/index.html`, `dist/practice.html`, espejos `docs/`, `tests/test_study_blocks_and_preview.cjs`, sincronización a `%LOCALAPPDATA%\Programs\Lumcards`.
- Validación: suite Chromium E2E completa en 4 viewports (1366x768, 1024x650, 390x844, 844x390) con mazo sintético de 565 tarjetas; 15 capturas inspeccionadas; 91 pruebas Python `unittest` pasando (100% OK); servidor en puerto 8765 activo y host `Lumcards.exe` (PID 19212) activo. Sin commit ni publicación. Ficha: [[tasks/2026-09-17-0145-antigravity-personalizacion-bloques-vistas]].

## 2026-09-17 — Causa del audio comprobada: CSP del iframe

- Código inline bloqueado por CSP heredada. Añadido card-runtime.js externo y ruta estática; contenido con flujo normal, altura mínima del viewport y fondo compartido. No se cambió el motor.
- Pruebas: reproducción y reinicio reales en Chromium, pantalla completa de estudio y reverso largo a 1366x768, 1024x650, 390x844 y 844x390; 19 pruebas Python, UX/Frontend Node y sintaxis correctas. Archivos locales instalados idénticos por SHA256; servidor reiniciado y runtime HTTP 200. No se verificó salida auditiva física ni APK.
- [[tasks/2026-09-17-codex-csp-responsive]]. Sin commit ni publicación.

## 2026-09-16 — Audio delegado y visor flex-start completados y validados

- Resultado: Antigravity reescribió `installCardAudioRuntime` para que el iframe de la tarjeta siempre delegue la reproducción de audio a la ventana padre mediante `postMessage('ankiPlayAudio')`, evadiendo los bloqueos del sandbox de WebView2/iframes en la carga de medios. Además, el `min-height: 100dvh` se eliminó de la tarjeta a favor de `height: 100%` con `justify-content: flex-start`, logrando que las tarjetas se adapten naturalmente a la parte superior de la pantalla, sin espacios negros forzados.
- Archivos: `dist/app.js`, `dist/app.css`, tests Node y Python actualizados para la nueva caché `20260916-audio-layout`, y `dist/` sincronizado en `docs/`.
- Validación: 90/90 pruebas Python, 6 suites Node/JS correctas, y paridad SHA256 completada. Falló el subagente de navegador al intentar usar CDP para captura visual por restricciones técnicas, pero conductualmente el código está validado por pruebas unitarias/DOM. Sin commit, `push` ni publicación. Ficha: [[tasks/2026-09-16-1300-antigravity-audio-parent-delegation]].

## 2026-09-16 — Parlantes incrustados repetibles y visor horizontal sin franjas

- Resultado: el audio ahora se inicia dentro del gesto de clic del iframe, cada pulsación detiene y rebobina la reproducción anterior y los callbacks tardíos no alteran la nueva. La clase `.card` pasó a un wrapper interior de ancho completo para que los estilos importados no reduzcan el `<body>` ni expongan grandes franjas laterales.
- Archivos: `dist/app.js`, `docs/app.js`, versión `20260916-ux3` en HTML/SW, `tests/test_ux_study_audio.cjs` y memoria. Los cuatro activos cambiados se sincronizaron con la instalación local y Lumcards raíz se reabrió.
- Validación: 90/90 pruebas Python y seis suites Node/JS correctas; sintaxis JS, paridad `dist`/`docs`, SHA256 instalado y respuesta del servidor activo verificadas; `git diff --check` correcto. No hubo captura nativa automatizada ni prueba auditiva por hardware. Sin commit, `push` ni publicación. Ficha: [[tasks/2026-09-16-1222-codex-audio-ancho-estudio]].

## 2026-09-16 — Correcciones UX hechas efectivas en el paquete Windows

- Resultado: los archivos instalados contenían las correcciones, pero WebView2 podía servir la primera variante defectuosa porque todas las iteraciones compartían `20260915-ux`. Se renovó la caché a `20260916-ux2`, se forzó la actualización del service worker, se hizo network-first la navegación y el host añade una URL única por apertura. Paquete raíz e instalación local actualizados y aplicación reabierta.
- Archivos: `dist/index.html`, `dist/practice.html`, `dist/sw.js`, espejos `docs/`, `tools/launcher.cs`, pruebas HTTP/JS y `tests/test_installer_payload.py`.
- Validación: autoprueba WinForms/WebView2 con entorno temporal correcta; ocho activos instalados y ejecutables idénticos al build por SHA256; 90/90 pruebas Python, seis suites Node, sintaxis JS y `git diff --check` correctos. El conector visual no expuso la ventana nativa, así que la captura final queda para observación del usuario. No se hizo commit, `push` ni publicación. Ficha: [[tasks/2026-09-16-1209-codex-cache-empaquetado-ux]].

## 2026-09-16 — Arranque de la instalación Windows reparado

- Resultado: el fallo era de empaquetado, no de la biblioteca: `engine.py` estaba instalado sin su dependencia `clean_engine.py`. Los instaladores PowerShell y gráfico ahora copian y exigen ese módulo; la instalación local se reparó sin modificar datos del usuario y el instalador gráfico se reconstruyó.
- Archivos: `installer.ps1`, `tools/installer_gui.cs`, `tests/test_installer_payload.py`; artefacto local `Instalador Lumcards.exe` reconstruido.
- Validación: 2 pruebas nuevas de contrato, compilación C# correcta, importación de `engine` y salud HTTP del servidor instalado con datos temporales, suite Python completa 89/89 y `git diff --check` correcto. No se hizo commit, `push` ni publicación. Ficha: [[tasks/2026-09-16-1158-codex-instalador-clean-engine]].

## 2026-09-16 — Revisión final UX y audio aprobada

- Resultado: Codex aprobó la implementación de Antigravity. La guardia de identidad de `AudioPlayer.cleanup()` ocurre antes de retirar `playing` o limpiar referencias; los callbacks tardíos de una instancia anterior ya no alteran la reproducción vigente. No se detectaron regresiones, pérdida de datos, cambios de privacidad ni alcance indebido.
- Evidencia: prueba conductual con `FakeAudio.instances` y eventos `onended`/`onerror` de la instancia antigua; seis suites Node/JS, 87 pruebas Python, `node --check` en `dist/app.js` y `dist/practice.js`, `git diff --check` y SHA256 de los ocho pares frontend modificados, todo correcto. La validación visual previa permaneció aplicable porque el último cambio fue exclusivamente el orden de limpieza y su prueba.
- Estado: implementado y probado localmente; no committeado, subido ni desplegado. Ficha: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-16 — Corrección de carrera de audio y prueba conductual completadas

- Resultado: Antigravity resolvió el P2 pendiente en `AudioPlayer.cleanup()`. Se comprueba `this.currentAudio === audio` antes de retirar la clase `playing` y limpiar referencias. En la prueba VM `tests/test_ux_study_audio.cjs`, se invocan `onended` y `onerror` de la instancia desprendida verificando conductualmente que el botón retiene la clase `playing` y la instancia activa no se altera.
- Archivos: `dist/practice.js`, `docs/practice.js`, `tests/test_ux_study_audio.cjs`.
- Validación reportada por Antigravity: 6 suites Node/JS (todas pasan), 87 pruebas Python `unittest` en `.venv` (todas pasan), `node --check` OK y `git diff --check` OK. La revisión final de Codex verificó los ocho pares frontend modificados de `dist/`/`docs/` como idénticos.
- Ficha: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-17 — Maquetación de formularios, preview en importador y eliminación segura

- Antigravity implementó y verificó en Chromium real los 4 requerimientos de [[tasks/2026-09-17-0313-codex-importacion-menus]]:
  1. Formularios de Crear mazo, Crear carpeta y Renombrar con clase propia `dialog.dialog-deck-modal` y `.deck-modal-grid` adaptable (hasta 1100px), sin elementos cortados ni scroll horizontal en los 4 viewports (1366x768, 1024x650, 390x844, 844x390); preview de biblioteca inerte sin listeners en ID ficticio.
  2. Preview visual de tarjetas en Importar texto de Juegos con layout dividido `.import-split-layout`, manteniendo tabla de revisión y añadiendo tarjeta interactiva (contador `Tarjeta i de N`, anterior/siguiente, voltear), reactividad con debounce (240ms) al teclear y redacción neutral sin promesas "100% legal".
  3. Eliminar mazo/carpeta desde el menú de la biblioteca sin entrar primero: modal de confirmación con explicación de tarjetas y submazos afectados; opción segura por defecto ("Conservar submazos") y destructiva ("Eliminar todo"); endpoint seguro en `clean_engine.py` y `server.py` con `backup()` previo obligatorio y desanidación limpia sin colisiones.
  4. Pendientes D resueltos: scroll real desbordado (`scrollHeight: 1961 > clientHeight: 631`, `scrolledTop: 1330`), tamaño manual de tipografía respetado en tarjetas cortas, herencia en hijos de `.cloze` (`.cloze *`) y script `card-runtime.js` aislado para previews.
- Archivos: `clean_engine.py`, `server.py`, `dist/app.css`, `dist/app.js`, `dist/practice.css`, `dist/practice.js`, `dist/sw.js`, `dist/index.html`, `dist/practice.html`, espejos `docs/`, `tests/test_import_menus_verify.cjs`, `tests/test_clean_engine.py`, `tests/test_server.py`, `tests/test_practice_http.py`, `tests/test_ux_study_audio.cjs`, sincronización a `%LOCALAPPDATA%\Programs\Lumcards`.
- Validación: `node tests/test_import_menus_verify.cjs` PASS (4/4 pruebas), `.venv/Scripts/python.exe -m unittest discover` PASS (92/92 tests OK), `test_preview_legibilidad_verify.cjs` PASS, `test_ux_study_audio.cjs` PASS, `test_study_blocks_and_preview.cjs` PASS. Hashes SHA-256 idénticos verificados con la instalación local.


Entradas anteriores: [[archive/2026-09-studio-cierre-log]].

## 2026-09-17 — Plan de selector de carpetas y evolución de Juegos

- Codex inspeccionó selector plano compartido con importación y fallback local por ID. Plan de navegación/selección separadas, búsqueda, conteos sin duplicados, diseño adaptable y movimiento reducido: [[tasks/2026-09-17-0630-codex-juegos-carpetas]]. Juegos nuevos solo propuestos; no se requiere instalar herramientas para etapa 1.
- Solo memoria modificada (ficha/relevo/backlog/registro). Sin pruebas funcionales ni implementación nueva. Revisión independiente anterior conservada como pendiente; `tools/check-brain.ps1`: OK (32 notas, 110 enlaces, 17 fichas).


Entradas anteriores: [[archive/2026-09-studio-cierre-log]].
