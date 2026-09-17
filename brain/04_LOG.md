---
tags: [lumcards, registro]
updated: 2026-09-17
---

# Registro de trabajo

## 2026-09-17 — Estadísticas y puntos débiles dinámicos en Modo Web

- Antigravity corrigió el apartado de "Estadísticas" (Mi progreso) en la versión web (GitHub Pages / Vercel / PWA): `webApi` devolvía datos en blanco / ceros estáticos en `stats/detailed`, ignoraba el filtro por mazo `deckId`, y la ruta `cards/` interceptaba `cards/weak` impidiendo mostrar sanguijuelas y dificultades.
- Implementado en `webApi` (`dist/app.js` y `docs/app.js`): recálculo dinámico de `today`, `forecast`, `cardBreakdown`, `calendar`, `history`, `intervals`, `ease`, `retention`, `hourly`, `buttonPresses`, `addedCards` con soporte para selección de mazo y submazos. Endpoint `cards/weak` funcional para detección de sanguijuelas (lapses >= 3) y factores críticos. `webApi('review')` registra historial en `store._revlogs`. Caché actualizada a `20260917-web-stats` en `dist/` y `docs/`.
- Validación: nueva suite unitaria `tests/test_web_stats.cjs` OK, `test_web_study_blocks.cjs` OK, `test_frontend.cjs` OK, `test_ux_study_audio.cjs` OK, 92/92 tests Python OK, paridad de activos `dist/` y `docs/` estricta, `tools/check-brain.ps1` OK. Ficha: [[tasks/2026-09-17-1632-antigravity-estadisticas-modo-web]].

## 2026-09-17 — Bloques de estudio y recuento dinámico en Modo Web

- Antigravity corrigió el error reportado por el usuario en la versión web (GitHub Pages / Vercel): al crear tarjetas en un mazo, el modal de estudio reportaba 0 tarjetas disponibles y el botón "Iniciar bloque" quedaba deshabilitado, además de marcar el mazo como "Al día".
- Implementado en `webApi` (`dist/app.js` y `docs/app.js`): `study/block-info`, `study/block-start`, `study/block-clear`, soporte de cola y `blockStatus` en `study` y `review`, y recálculo de contadores (`due`, `new`, `total`, `learned`) en `state`. Caché actualizada a `20260917-web-study-blocks` en `dist/` y `docs/`.
- Validación: suite específica `tests/test_web_study_blocks.cjs` OK, 92/92 tests Python OK, paridad de activos web 100%, `tools/check-brain.ps1` OK. Ficha: [[tasks/2026-09-17-1550-antigravity-soporte-estudio-modo-web]].

## 2026-09-17 — Subida consolidada a GitHub (commit acfe525)

- Antigravity consolidó todos los cambios acumulados, validó la totalidad de las suites y realizó el push a `origin/main` (`https://github.com/carsalrecs-prog/lumcards.git`).
- Correcciones antes del commit: ajuste de versión de caché en `tests/test_server.py` (92/92 tests Python OK), corrección de colisión de arte decorativo en móvil estrecho en `practice.css` (dist y docs), e inclusión de `tests/screenshots_*/` en `.gitignore`.
- Validación: 92/92 pruebas Python OK, 11 suites Node/Chromium E2E OK, `git push` OK con salida 0 (`9943bf9..acfe525`), `tools/check-brain.ps1` OK. Ficha: [[tasks/2026-09-17-1425-antigravity-subir-cambios-github]].

## 2026-09-17 — Dirección visual y animaciones propuestas

- Codex creó e inspeccionó maqueta de Jugar y aprender (design/lumcards-juegos-concepto-v1.png), con brief y movimiento en [[tasks/2026-09-17-0715-codex-direccion-visual]]. No es interfaz funcional ni cambio instalado.
- Memoria y referencia visual únicamente; revisiones previas pendientes conservadas. Copia confirmada por SHA256; tools/check-brain.ps1 OK (33 notas, 117 enlaces, 18 fichas). Sin suites funcionales ni datos modificados.

## 2026-09-17 — Selección jerárquica de carpetas en Jugar y aprender y presentación adaptable

- Antigravity ejecutó y validó la Etapa 1 de [[tasks/2026-09-17-0630-codex-juegos-carpetas]]:
  1. Explorador modal accesible (`dialog.deck-explorer-modal`) en `dist/practice.js` y `dist/practice.css` (espejos en `docs/`): navegación (`Abrir ➔`) separada de la selección de carpeta (`Elegir toda esta carpeta`), aviso explícito `Incluye sus submazos`, migas de pan interactivas y banner hero con recuento agregado.
  2. Raíz limpia mostrando solo carpetas principales, opción `Todos mis mazos` y mazos sueltos, sin mezclar descendientes.
  3. Búsqueda global instantánea con rutas jerárquicas completas y desambiguación de homónimos.
  4. Resumen visible en 3 pasos (`«1. Contenido a practicar»`, `«2. Tamaño de sesión»`, `«3. Modo de juego»`) y tarjeta interactiva (`.play-selector-card`).
  5. Selector de destino de importación `#import-deck` preservado intacto.
  6. Backend (`clean_engine.py`): creación automática de ancestros en `CleanDeckManager.id` al registrar submazos anidados (`::`) y resolución de carpetas virtuales/nombres en `_deck_id`. Fallback local/offline actualizado con resolución y deduplicación exacta con `Set` de tarjetas descendientes.
  7. Adaptabilidad responsive en 4 viewports (1366x768, 1024x650, 390x844, 844x390), apilamiento vertical en móviles estrechos y animación funcional respetando `prefers-reduced-motion`. Caché renovada a `20260917-practice-folders` y sincronizada con `%LOCALAPPDATA%\Programs\Lumcards\dist\`.
  8. Propuestas de nuevos juegos de Etapa 2 (Torre del conocimiento, Expedición, etc.) conservadas intactas y NO implementadas sin autorización explícita.
- Archivos: `dist/practice.js`, `dist/practice.css`, `dist/practice.html`, `dist/sw.js`, espejos `docs/`, `clean_engine.py`, `tests/test_clean_engine.py`, `tests/test_practice_http.py`, `tests/test_practice_folder_selection.cjs`.
- Validación: `node tests/test_practice_folder_selection.cjs` PASS (100% OK en los 4 viewports, 18 capturas en `tests/screenshots_practice_folders/`), `test_clean_engine.py` PASS (10/10 OK), `test_practice_http.py` PASS (7/7 OK), `test_import_menus_verify.cjs` PASS, `test_preview_legibilidad_verify.cjs` PASS, `test_ux_study_audio.cjs` PASS.
- Ficha: [[tasks/2026-09-17-0630-codex-juegos-carpetas]]. Lista para revisión de Codex.

## 2026-09-17 — Plan de selector de carpetas y evolución de Juegos

- Codex inspeccionó selector plano compartido con importación y fallback local por ID. Plan de navegación/selección separadas, búsqueda, conteos sin duplicados, diseño adaptable y movimiento reducido: [[tasks/2026-09-17-0630-codex-juegos-carpetas]]. Juegos nuevos solo propuestos; no se requiere instalar herramientas para etapa 1.
- Solo memoria modificada (ficha/relevo/backlog/registro). Sin pruebas funcionales ni implementación nueva. Revisión independiente anterior conservada como pendiente; `tools/check-brain.ps1`: OK (32 notas, 110 enlaces, 17 fichas).

## 2026-09-17 — Maquetación de formularios, preview en importador y eliminación segura

- Antigravity implementó y verificó en Chromium real los 4 requerimientos de [[tasks/2026-09-17-0313-codex-importacion-menus]]:
  1. Formularios de Crear mazo, Crear carpeta y Renombrar con clase propia `dialog.dialog-deck-modal` y `.deck-modal-grid` adaptable (hasta 1100px), sin elementos cortados ni scroll horizontal en los 4 viewports (1366x768, 1024x650, 390x844, 844x390); preview de biblioteca inerte sin listeners en ID ficticio.
  2. Preview visual de tarjetas en Importar texto de Juegos con layout dividido `.import-split-layout`, manteniendo tabla de revisión y añadiendo tarjeta interactiva (contador `Tarjeta i de N`, anterior/siguiente, voltear), reactividad con debounce (240ms) al teclear y redacción neutral sin promesas "100% legal".
  3. Eliminar mazo/carpeta desde el menú de la biblioteca sin entrar primero: modal de confirmación con explicación de tarjetas y submazos afectados; opción segura por defecto ("Conservar submazos") y destructiva ("Eliminar todo"); endpoint seguro en `clean_engine.py` y `server.py` con `backup()` previo obligatorio y desanidación limpia sin colisiones.
  4. Pendientes D resueltos: scroll real desbordado (`scrollHeight: 1961 > clientHeight: 631`, `scrolledTop: 1330`), tamaño manual de tipografía respetado en tarjetas cortas, herencia en hijos de `.cloze` (`.cloze *`) y script `card-runtime.js` aislado para previews.
- Archivos: `clean_engine.py`, `server.py`, `dist/app.css`, `dist/app.js`, `dist/practice.css`, `dist/practice.js`, `dist/sw.js`, `dist/index.html`, `dist/practice.html`, espejos `docs/`, `tests/test_import_menus_verify.cjs`, `tests/test_clean_engine.py`, `tests/test_server.py`, `tests/test_practice_http.py`, `tests/test_ux_study_audio.cjs`, sincronización a `%LOCALAPPDATA%\Programs\Lumcards`.
- Validación: `node tests/test_import_menus_verify.cjs` PASS (4/4 pruebas), `.venv/Scripts/python.exe -m unittest discover` PASS (92/92 tests OK), `test_preview_legibilidad_verify.cjs` PASS, `test_ux_study_audio.cjs` PASS, `test_study_blocks_and_preview.cjs` PASS. Hashes SHA-256 idénticos verificados con la instalación local.

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

## 2026-09-15 — Segunda revisión UX: correcciones principales validadas, queda una carrera de audio

- Resultado: controles de Estudio, alturas, cuadrícula móvil, fondos claro/oscuro, icono de Juegos y filtro de `postMessage` pasan la revisión independiente. La tarea vuelve a Antigravity por un único P2: el callback tardío del audio anterior elimina la clase `playing` del nuevo.
- Evidencia: UI aislada a 1366×768, 1024×768 y 390×844; botón de Juegos 40×40 con SVG 18×18; audio sintético embebido/global/tecla `R`; prueba VM adicional que falla al disparar realmente `firstAudio.onended()`.
- Automatización: seis suites Node/JS y 87 `unittest` pasan; sintaxis JS, `git diff --check` y ocho pares SHA256 `dist`/`docs` correctos. La prueba nueva da falso positivo para el callback tardío.
- Ficha: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-15 — Correcciones UX de Estudio, Juegos y audio completadas

- Resultado: Antigravity aplicó las correcciones solicitadas por Codex. Se corrigió la especificidad del fondo oscuro de `html`, se desocultaron los controles de Estudio (eliminado `:first-child`) y se añadió una prueba conductual de `AudioPlayer` con un objeto `FakeAudio`.
- Archivos: `dist/practice.css`, `dist/student.css`, `docs/practice.css`, `docs/student.css`, `tests/test_ux_study_audio.cjs`.
- Validación: 6 suites Node/JS + 87 Python: todo verde. `git diff --check` OK. SHA256 dist/docs idénticos. `tools/check-brain.ps1` en `OK`. Tarea `lista_para_relevo` a la espera de la revisión de Codex.
- Ficha: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-15 — Revisión UX de Estudio, Juegos y audio no aprobada

- Resultado: Codex devolvió la implementación a Antigravity. La regla heredada de la barra inferior oculta el único contenedor y deja sin `Mostrar respuesta` ni calificaciones; una regla duplicada comprime el SVG de audio de Juegos; `html` conserva fondo claro en tema oscuro; el receptor de `postMessage` no filtra origen/ventana.
- Archivos revisados: diff completo de `dist/`, `docs/`, pruebas y memoria; solo se actualizó `brain/` durante la revisión.
- Validación: seis suites Node/JS y 87 `unittest` pasan, sintaxis JS correcta, `git diff --check` sin errores y ocho pares `dist/`/`docs/` idénticos. UI sintética fallida en 1366×768, 1024×768 y 390×844; la prueba de audio de Juegos no es conductual.
- Ficha y correcciones priorizadas: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-15 — Implementación UX de Estudio, Juegos y audio completada

- Resultado: Antigravity implementó los tres defectos UX. Juegos: dark theme sync + 100dvh. Estudio: topbar 50px, bottom-bar 74px, `.anki-study-stage` flex, iframe adaptativo con `clamp()`. Audio: `AudioController` con limpieza de timers y comparación de instancia; `AudioPlayer` con `prevAudio.pause()+currentTime=0`; botones solo icono SVG con `aria-label`. Caché renovada a `20260915-ux`.
- Archivos: `dist/app.js`, `dist/app.css`, `dist/student.css`, `dist/practice.js`, `dist/practice.css`, `dist/practice.html`, `dist/index.html`, `dist/sw.js`; espejos en `docs/`; `tests/test_ux_study_audio.cjs` (nuevo), `tests/test_server.py`, `tests/test_practice_http.py`.
- Validación: 6 suites Node/JS + 87 Python: todo verde. `git diff --check` OK. SHA256 dist/docs idénticos. Validación visual y audio funcional pendientes para Codex.
- Ficha: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-15 — Plan UX de Estudio, Juegos y audio preparado para Antigravity

- Resultado: Codex localizó los estilos y controladores implicados, definió criterios medibles para aprovechar el viewport, integrar los controles con la tarjeta, eliminar el fondo blanco y repetir audio mediante iconos accesibles.
- Archivos previstos: `dist/app.js`, `dist/app.css`, `dist/student.css`, `dist/practice.js`, `dist/practice.css`, HTML/SW versionados, espejos de `docs/` y pruebas frontend.
- Validación: inspección estática y contraste con capturas; `tools/check-brain.ps1` en `OK` (22 notas, 68 enlaces, 7 fichas, 3 entradas). Código, audio y UI todavía no modificados ni probados; la ficha queda `lista_para_relevo` para Antigravity.
- Ficha: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]].

## 2026-09-15 — Avances consolidados subidos a GitHub y desplegados en Vercel

- Resultado: suite completa validada (87 pruebas Python y 5 suites Node/JS), activos sincronizados de `dist/` a `docs/`, exclusión de DLLs temporales de raíz en `.gitignore`, commit `8e0cec5` subido con éxito a `origin/main` en GitHub y despliegue en producción verificado en `https://lumcards.vercel.app` (código HTTP 200, scripts y estilos actualizados).
- Archivos: `.gitignore`, `dist/`, `docs/`, `clean_engine.py`, `brain/` y archivos del repositorio.
- Validación: suites automatizadas 100% OK, `git push origin main` con salida 0, comprobación HTTP directa de Vercel y `tools/check-brain.ps1` en `OK`. Ficha: [[tasks/2026-09-15-1307-antigravity-subir-github-desplegar-vercel]].

## 2026-09-15 — Capacidades de Codex y Antigravity inventariadas

- Resultado: registradas 83 skills declaradas y nueve servidores MCP visibles de Antigravity, además de las capacidades actuales de Codex, su aplicación probable a Lumcards y el protocolo para pedir herramientas nuevas.
- Límites: inventario basado en capturas/listado aportados; no se probaron credenciales ni llamadas reales. Ninguna capacidad se trató como autorización para operar servicios externos.
- Archivos: `brain/10_AGENT_CAPABILITIES.md`, portada, estado, backlog, decisiones, relevo y ficha.
- Validación: 83/83 nombres presentes, `git diff --check -- brain` sin errores y `tools/check-brain.ps1` en `OK` (21 notas, 59 enlaces, 6 fichas, 3 entradas de agente). Ficha: [[tasks/2026-09-15-1306-codex-capacidades-agentes]].

## 2026-09-15 — Carpetas, renombrado y Mi progreso restaurados

- Resultado: normalización y migración respaldada de jerarquías, fusión de duplicados sin pérdida de tarjetas, carpetas vacías persistentes, totales agregados, creación/movimiento/renombrado visibles y contrato completo de estadísticas detalladas.
- Archivos: `clean_engine.py`, `server.py`, `dist/app.js`, `dist/index.html`, `dist/sw.js`, pruebas y `brain/`.
- Validación: 87 pruebas Python y cinco suites Node/JS correctas; API y UI reales verificadas con 3.971 tarjetas conservadas, una carpeta con siete mazos, `Mi progreso` operativo y consola sin errores. No se empaquetó ni publicó una nueva versión.
- Ficha y continuidad: [[tasks/2026-09-15-0047-codex-regresiones-motor-carpetas-progreso]], [[08_HANDOFF]].

## 2026-09-14 — Motor limpio independiente sin AGPL y corrección de juegos

- Resultado: Implementado y completado el motor limpio independiente `clean_engine.py` (Python puro + SQLite) con eliminación total de `anki==26.8.1`. Soporte universal para tarjetas básicas, inversas, cloze, oclusión de imagen nativa, medios comprimidos con zstandard, historial `revlog` y cálculo de estadísticas. Corregida filtración de `frontKey`/`backKey` en `dist/study-games.js`.
- Archivos: `clean_engine.py`, `engine.py`, `dist/study-games.js`, `requirements-lock.txt`, `brain/`.
- Validación: 83 pruebas de Python pasando 100% en verde; 5 suites de Node/JS pasando 100% en verde.
- Ficha y continuidad: [[tasks/2026-09-14-2240-antigravity-motor-independiente]], [[08_HANDOFF]].

## 2026-09-13 — Memoria para Codex, Antigravity y Claude

- Resultado: protocolo unico, reglas de entrada, checkpoints, relevo, guia y plantillas por tarea.
- Archivos: `AGENTS.md`, `CLAUDE.md`, `.agents/rules/brain.md`, `brain/`, `tools/check-brain.ps1`.
- Validacion: verificador OK; prueba negativa detecta cuatro clases de errores. Carga en otras herramientas aun no comprobada.
- Ficha y continuidad: [[tasks/2026-09-13-2254-codex-cerebro]], [[08_HANDOFF]].

## 2026-09-13 — Cerebro de Obsidian

- Resultado: creado vault documental, índice mínimo e instrucciones persistentes para Codex.
- Archivos: `AGENTS.md`, `.obsidian/`, `brain/`.
- Validación: enlaces locales y estructura comprobados; Obsidian detectado en este equipo.

## 2026-09-13 — Limpieza del proyecto

- Resultado: eliminados `node_modules`, cachés Firebase/Android/Python, compilaciones Android y registros temporales.
- Conservado: colección, historial de práctica, copias, APK, ZIP, `.venv`, instaladores y código exportado.
- Validación: 20 pruebas del importador pasan; el motor y servidor importan correctamente.

## 2026-09-11 — Escritorio, juegos e importación

- Resultado: ventana Windows con WebView2; elección, escritura y parejas; vista previa e importación de texto; historial de partidas.
- Validación histórica: prueba nativa de escritorio, pruebas HTTP temporales y rondas de interfaz completadas.
- Nota: el repositorio recibió cambios posteriores; volver a ejecutar la suite completa antes de publicar.
