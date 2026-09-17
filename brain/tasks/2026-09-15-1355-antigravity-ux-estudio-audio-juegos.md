---
tags: [lumcards, tarea, frontend, estudio, juegos, audio]
---

# Tarea: corregir altura de estudio, fondo de Juegos y repetición de audio

## Control

- ID: 2026-09-15-1355-antigravity-ux-estudio-audio-juegos.
- Estado: hecha.
- Responsable y sesión: Codex (revisión final independiente completada sobre la implementación de Antigravity).
- Actualizado: 2026-09-16T12:05:00-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `9943bf9`; worktree con cambios de documentación previos preservados.

## Objetivo y aceptación

- Petición autorizada: eliminar la franja blanca inferior de Juegos; compactar la sesión de estudio para aprovechar la altura disponible sin desplazamientos innecesarios; reparar la repetición de audio y reemplazar controles con texto como “Audio” o “Escuchar” por un botón accesible de icono de altavoz.
- Juegos, en temas claro y oscuro: `html`, `body` y el contenedor de la aplicación cubren como mínimo todo el alto dinámico del viewport; no aparece fondo blanco ajeno al tema debajo de la sesión, incluso si su contenido es más corto que la ventana.
- Estudio en escritorio, especialmente a 1366×768 y 1024×768: cabecera, tarjeta y controles caben en el viewport sin scroll del documento. La cabecera debe ser compacta (objetivo aproximado: 48–52 px) y el área de respuesta/calificación no debe superar lo necesario (objetivo aproximado: 72–80 px con cuatro calificaciones).
- El visor y `Mostrar respuesta`/calificaciones deben percibirse como una sola superficie de estudio, con el control inferior unido visualmente a la tarjeta y sin una banda separada que desperdicie todo el ancho. Las cuatro calificaciones permanecen visibles. En móvil se admite la cuadrícula 2×2 y el `safe-area-inset-bottom`.
- La tarjeta de referencia con imagen, texto y varios audios debe caber a 1366×768 sin scroll interior. Contenido genuinamente más largo puede desplazarse dentro del visor, nunca mover la cabecera ni los botones de calificación fuera de la ventana.
- Cada control de audio visible en Estudio y Juegos muestra solo un icono de altavoz, sin las palabras “Audio”, “Escuchar” ni “Escuchar pronunciación”; conserva `aria-label` y `title` descriptivos, foco visible y un área táctil suficiente.
- Un clic reproduce el audio de la cara actual; otro clic sobre el mismo control lo reinicia desde el principio y vuelve a sonar. Esto debe funcionar varias veces seguidas, tanto con el icono embebido en la tarjeta como con el icono global y la tecla `R`; en Juegos también debe reiniciarse al volver a pulsarlo.
- Conservar reproducción automática al mostrar cada cara, secuencias con varios audios, edición/favorito/pantalla completa, mostrar respuesta, calificaciones 1–4 y atajos existentes.

## Archivos y alcance

- Archivos probables: `dist/app.js`, `dist/app.css`, `dist/student.css`, `dist/practice.js`, `dist/practice.css`, `dist/index.html`, `dist/practice.html`, `dist/sw.js`, pruebas frontend relacionadas y los equivalentes modificados bajo `docs/`.
- `dist/` es la salida usada por `vercel.json` y `firebase.json`; mantener `docs/` como espejo exacto de cada activo frontend tocado. Renovar las versiones de los enlaces y `CACHE_NAME` para evitar que el service worker conserve el defecto.
- Modificar el mínimo necesario. No cambiar motor, planificador, API, contenido de tarjetas ni configuración de nube. No desplegar, publicar, comprar, hacer commit o `push`: primero dejar `lista_para_relevo` para revisión de Codex.
- Preservar cualquier cambio concurrente. No leer `data/`; para audio usar fixtures temporales o la UI sin copiar contenido personal al cerebro ni a las pruebas.

## Diagnóstico técnico de partida

- La sesión base define en `dist/app.css` una cabecera de 44 px y un pie de 64 px, pero `dist/student.css` los amplía a 64 px y mínimo 94 px, agrega 24 px alrededor del visor y fuerza ambos extremos como paneles separados. Esto coincide con el espacio excesivo de las capturas.
- `studyView()` en `dist/app.js` genera cabecera, `anki-card-container` y `anki-bottom-bar` como tres hermanos. Antigravity debe unir visualmente visor y controles con el cambio estructural mínimo (por ejemplo, un contenedor de escenario), manteniendo una sola zona flexible `minmax(0,1fr)` para la tarjeta.
- `mountCard()` usa dentro del iframe padding `24px 32px`, `line-height:1.55`, imágenes de hasta `44vh` y márgenes amplios. Hacer estos valores adaptativos al alto disponible para que la tarjeta de referencia quepa, sin mutilar plantillas ni fijar una altura única para todo contenido.
- `safeCardHTML()` genera botones con un `<span>Audio</span>`; `practice.js` genera “Escuchar” y “Escuchar pronunciación”. Los tres deben convertirse a icono únicamente, con nombre accesible.
- El audio de Estudio pasa del iframe al padre mediante `postMessage`; `playSingle()` y `playList()` crean objetos `Audio`. Juegos usa otro `AudioPlayer`, cuyo rechazo de `play()` actualmente se descarta con `.catch(() => {})`. Antes de cambiar la ruta, reproducir el fallo y anotar si se debe a URL, estado del reproductor, promesa rechazada o pérdida de activación de usuario en WebView2. No aflojar CSP ni el sandbox para resolverlo.
- Si se conserva `postMessage`, restringir el mensaje a la ventana/origen esperado en vez de ampliar confianza. Si WebView2 pierde la activación del usuario al cruzar al padre, elegir una reproducción directa dentro del iframe o una alternativa equivalente que se haya probado realmente.

## Checkpoint

- 13:55 - Leídos `AGENTS.md`, portada, relevo, capacidades y la ficha técnica relacionada; confirmado commit `9943bf9` y worktree limpio. Las capturas muestran las tres regresiones. Siguiente: localizar estilos, estructura del visor y controladores de audio exactos.
- 13:59 - Diagnóstico localizado en `app.css`, `student.css`, `app.js`, `practice.css` y `practice.js`. Definidos criterios medibles, límites, pruebas y estrategia de diagnóstico de audio. No se modificó código de la aplicación; tarea preparada para Antigravity.
- 14:01 - Relevo y notas globales actualizados; `git diff --check -- brain` sin errores y `tools/check-brain.ps1` en `OK` (22 notas, 68 enlaces, 7 fichas, 3 entradas de agente).
- 14:08 - Antigravity inicia ejecución técnica con Google Antigravity IDE. Objetivo: corregir franja blanca en Juegos, compactar layout de Estudio (1366x768 / 1024x768 sin scroll, integración visual de tarjeta y controles), reparar repetición de audio (múltiples clics seguidos, tecla R) y sustituir texto "Audio"/"Escuchar" por solo icono accesible de altavoz. Archivos previstos: `dist/app.js`, `dist/app.css`, `dist/student.css`, `dist/practice.js`, `dist/practice.css`, `dist/index.html`, `dist/practice.html`, `dist/sw.js`, espejos `docs/`, `tests/test_frontend.cjs` y pruebas adicionales. Primer paso: inspeccionar audio en `dist/app.js` y `dist/practice.js`, y estilos en `dist/student.css` y `dist/practice.css`.
- 14:27 - Diagnóstico reproducido y verificado en código:
  1. Juegos: `practice.html` no sincroniza la clase `.dark` desde `localStorage`, y ni `html` ni `body` en `practice.css` tienen `min-height: 100dvh` ni layout flex; cuando el contenido es corto, el fondo del viewport debajo de `.play-main` muestra el lienzo blanco por defecto del navegador.
  2. Estudio: `.anki-topbar` (64px) y `.anki-bottom-bar` (94px) en `student.css`, más padding de 24px en `.anki-card-container` y valores fijos en el iframe (`padding: 24px 32px`, `max-height: 44vh` en imágenes), desbordan la pantalla en 1366×768 / 1024×768 y separan los controles del visor. Se diseñará un escenario `.anki-study-stage` integrado que une visor y barra compacta (48-52px cabecera, 72-76px barra inferior) y adapta el CSS interno del iframe.
  3. Audio: etiquetas de texto visibles encontradas en `safeCardHTML` (`<span>Audio</span>`), `practice.js` (`🔊 Escuchar`, `🔊 Escuchar pronunciación`) y barra inferior (`Audio (R)`). En `AudioPlayer` (`practice.js`), repetición inmediata falla al no reiniciar `currentTime=0` y no coordinar estados. En `AudioController` (`app.js`), no se limpian temporizadores pendientes de secuencias ni se reinicia limpiamente la instancia previa. Se implementará botón de icono accesible y ciclo de repetición robusto con limpieza completa.
- 15:22 - Antigravity completa implementación. Juegos: dark theme sync, 100dvh. Estudio: topbar 50px, bottom-bar 74px, card padding 8px 10px, `.anki-study-stage` flex. Audio: `AudioController` con `timerId` cleanup y comparación de instancia; `AudioPlayer` con `prevAudio.pause()+currentTime=0`; botones solo icono SVG con `aria-label`. Caché: `20260915-ux`. Espejo `docs/` verificado SHA256. 6 suites Node (93 aserciones) + 87 Python: todo verde. Prueba visual y funcional audio pendiente para Codex.
- 15:30 - Codex inicia revisión independiente. Leídos `AGENTS.md`, portada, relevo, ficha, estado de Git y diff/archivos tocados. Hallazgos provisionales que deben contrastarse en ejecución: `practice.css` conserva dos bloques `.game-audio-pill` y el bloque posterior vuelve a imponer `padding:7px 16px`; la prueba nueva ejecuta el reinicio de `AudioController`, pero para `AudioPlayer` de Juegos solo verifica expresiones regulares, pese al criterio explícito de usar `Audio` falso. Siguiente: servidor con datos temporales, validación visual por viewport y suites completas.
- 15:39 - Codex termina la revisión y devuelve la tarea. Fallo crítico reproducido: `.anki-study-center` es el único hijo de `.anki-bottom-bar`, pero la regla existente para ocultar el primer y último hijo lo deja en `display:none`; `Mostrar respuesta` y las calificaciones quedan en 0×0 a 1366×768, 1024×768 y 390×844. En Juegos, la segunda definición de `.game-audio-pill` deja el SVG en 6×18 px dentro de un botón de 40×40. El tema oscuro cubre el `body`, pero el fondo calculado de `html` sigue claro por la mayor especificidad de `:root`. El receptor de `postMessage` continúa sin comprobar origen ni `source`. Suites: seis Node y 87 `unittest` en verde; el éxito no cubre los fallos visuales anteriores.

- 15:52 - Antigravity retoma correcciones tras el rechazo de Codex:
  1. **CSS Específico (`practice.css`)**: se modificó la especificidad del fondo a `:root, html` para vencer a `:root` solo.
  2. **Test conductual (`tests/test_ux_study_audio.cjs`)**: se reemplazó la prueba por una conductual inyectando `FakeAudio` en VM.
  3. **CSS Oculto (`student.css`)**: se eliminó `.anki-bottom-bar>div:first-child...` para desocultar los controles (tanto `!important` como su variante).
  4. **Pruebas**: Se corrieron los Node tests (OK), las pruebas Python unitarias (87, OK), y `check-brain.ps1` (OK).
- 15:53 - Codex inicia segunda revisión independiente. Confirmados en diff: controles ya no ocultos; CSS duplicado de audio eliminado; receptor de `message` filtra `origin` y `source`; emisor ya no cae a `'*'`. Hallazgo provisional: la prueba de `AudioPlayer` ejecuta dos llamadas a `play()`, pero no conserva ni dispara la primera instancia; la afirmación sobre `onended` tardío sigue siendo una expresión regular. Además, `cleanup()` elimina la clase del botón antes de comprobar si el audio es la instancia actual. Siguiente: validación visual/funcional aislada y suites completas.
- 15:58 - Segunda revisión completada. Las cuatro correcciones visuales y de seguridad principales pasan: controles visibles y sin scroll de documento a 1366×768/1024×768; cuadrícula móvil visible a 390×844; fondos `html`/`body` correctos en claro y oscuro; botón de Juegos 40×40 con SVG 18×18; mensajes restringidos a origen local y al iframe actual. Audio sintético embebido, global y repetición inmediata no generaron errores. Queda un defecto reproducible: tras iniciar dos audios con el mismo botón, invocar el `onended` tardío del primero conserva la segunda instancia pero elimina la clase `playing` del botón. La nueva prueba no lo detecta porque obtiene `currentAudio` después de ambas reproducciones y solo usa regex para esa condición. Suites generales verdes, pero la prueba independiente específica falla.
- 2026-09-16 11:30 - Antigravity resuelve el P2 único pendiente de carrera de audio y su prueba conductual:
  1. En `dist/practice.js` y `docs/practice.js`, `AudioPlayer.cleanup()` ahora retorna inmediatamente si `this.currentAudio !== audio`. La clase `playing` solo se retira del botón activo (`this.currentBtn`) y las referencias solo se limpian cuando la instancia que termina es la actual. Callbacks desprendidos de reproducciones previas ya no interfieren con la reproducción activa.
  2. En `tests/test_ux_study_audio.cjs`, se agregó registro de instancias en `FakeAudio.instances`. Se probó conductualmente que al disparar `firstAudio.onended()` y `firstAudio.onerror()` tras la segunda reproducción, el botón retiene la clase `playing` y `currentAudio` se mantiene apuntando a la segunda instancia activa. La aserción por expresión regular fue eliminada y reemplazada por aserciones conductuales completas.
  3. Validación: 6 suites Node/JS (todas pasan), 87 pruebas Python unittest en `.venv` (todas pasan), `node --check` OK, `git diff --check` OK, y paridad SHA256 verificada al 100% entre `dist/` y `docs/`.
- 2026-09-16 12:05 - Codex completa la tercera revisión independiente. Contrastó la guardia de identidad antes de cualquier limpieza y ejecutó la prueba conductual que dispara `onended` y `onerror` tardíos de la primera instancia; la segunda mantiene `playing` y `currentAudio`, y su propio `onended` limpia correctamente. También repitió las seis suites Node/JS, los 87 `unittest`, la sintaxis de `dist/app.js` y `dist/practice.js`, `git diff --check` y SHA256 de los ocho pares frontend modificados. Todo pasó. No encontró regresiones, pérdida de datos, cambios de privacidad ni modificaciones fuera del alcance de la aplicación; `.obsidian/graph.json` sigue siendo un cambio ajeno preservado.

## Validación

- Corrección P2 de audio: validada conductualmente en `tests/test_ux_study_audio.cjs` con `FakeAudio.instances`. Callbacks tardíos desprendidos de `firstAudio` (`onended`/`onerror`) no alteran el botón ni la instancia activa. Al terminar `secondAudio.onended()`, se retira la clase `playing` y se limpia el estado.
- UI de Estudio: 1366×768 — cabecera 53 px, barra 74 px, botón visible 240×40 y cuatro calificaciones 151×40; 1024×768 — sin scroll de documento y controles visibles; 390×844 — sin scroll de documento y cuatro calificaciones visibles en 2×2.
- Juegos: `html` y `body` calculan el mismo fondo correcto en claro y oscuro; botón de audio 40×40, SVG 18×18, padding 0 y sin texto visible.
- Audio: icono embebido, icono global, tecla `R` y doble activación ejecutados sin errores de consola. Carrera de callbacks resuelta y probada conductualmente.
- Seguridad: el emisor usa el origen exacto sin `'*'`; el receptor exige `e.origin === location.origin` y `e.source === #study-frame.contentWindow` antes de procesar.
- Automatización: seis suites Node/JS y 87 pruebas Python `unittest` en verde; `node --check` correcto en `dist/` y `docs/`.
- Integridad: `git diff --check` sin errores; los ocho pares frontend modificados de `dist/`/`docs/` son idénticos por SHA256; sin cambios de backend, nube, motor ni biblioteca real. El cambio concurrente de `.obsidian/graph.json` se conservó intacto.
- Revisión final independiente de Codex: seis suites Node/JS, 87 pruebas Python y sintaxis JS en verde; la carrera de audio quedó cubierta con eventos reales sobre ambas instancias falsas. La validación visual previa no necesitó repetirse porque la corrección final solo cambió el orden de la guardia de limpieza y la prueba.

## Pendiente y primer paso

- Pendiente: la implementación permanece sin commit, `push` ni despliegue; esas acciones no fueron autorizadas en esta tarea.
- Primer paso: esperar el siguiente objetivo del usuario. Si solicita publicar, crear primero un commit de restauración y validar el despliegue como una tarea separada.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: el servidor sintético de revisión en 8766 y la pestaña asociada se cerraron. Continúa un servidor local preexistente del usuario en 8765, que no fue intervenido.

## Cierre

- Tarea `hecha`: implementación y revisión independiente completadas. No se hizo commit, `push` ni despliegue. Continuidad en [[08_HANDOFF]].
