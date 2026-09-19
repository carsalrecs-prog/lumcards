---
tags: [lumcards, estado]
updated: 2026-09-19
---

# Estado actual

## Nube — 2026-09-19

- Drive real configurado: API habilitada, cliente OAuth público integrado, orígenes y permisos mínimos guardados. Autorización, subida, listado, descarga e importación remotas PASS con copia sintética de 4 KB, luego retirada por Richard; carpeta verificada vacía. Código/cache r7 local sin publicar. [[tasks/2026-09-19-1207-codex-completar-drive-real]]

- Inicializacion recursiva Firebase corregida y probada; Google Auth y Firestore confirmados sin consultar biblioteca. Reglas contra autoaprobacion publicadas con autorizacion expresa. Aplicacion sin publicar; control de acceso pago integral sigue pendiente. [[tasks/2026-09-19-0502-codex-validar-nube]].


## Studio restante — 2026-09-18

- Mi espacio, cuenta, transferencias, preferencias, copias, importadores y editor adaptados a Studio; administración/reset recientes revisados con datos sintéticos. Cambios espejados dist/docs; app.js y cache 20260918-studio-workspace-r4; otros activos r2 y KaTeX local conservados.
- Estados de transferencia veraces, confirmaciones con consecuencias, foco recuperado, preview sin guardar ni audio. Biblioteca/Estudio/Juegos conservados; correcciones acotadas de reflow en estadísticas.
- Evidencia y límites: [[tasks/2026-09-18-2050-antigravity-redisenar-resto-aplicacion]]. No se declara cierre integral: KaTeX local corregido y probado (24 checks y cache offline); Firebase externo sigue bloqueado por CSP; los cuatro fallos web conocidos estan corregidos y probados con datos sinteticos; nube real sigue sin validar. No empaquetado, instalado ni publicado en esta tarea.

## Reparacion funcional web — 2026-09-18

- Guardado fallido conserva borrador, informa error y no agenda subida; JSON ilegible/formato invalido preservado sin sustitucion por demo. Fechas locales y timestamps numericos heredados coherentes; registros invalidos conservados sin bloquear calculos. Estadisticas con error y reintento manual sin bucle.
- 9 escenarios Chromium y creacion/recarga offline PASS. Ficha [[tasks/2026-09-18-2133-codex-reparar-persistencia-web]]. Sin cambios de motor/SRS ni despliegue.

## Memoria compartida

- Codex, Claude Code y Antigravity tienen entradas de proyecto dirigidas a `AGENTS.md` y al mismo cerebro `brain/`.
- Protocolo de checkpoints y relevo: [[07_PROTOCOL]], [[08_HANDOFF]]; uso y limites: [[09_GUIDE]].
- Inventario observado de skills y MCP, sus límites y protocolo para pedir capacidades nuevas: [[10_AGENT_CAPABILITIES]].
- 2026-09-13: estructura y deteccion de relevos invalidos verificadas. Carga efectiva en sesiones de Claude Code/Antigravity aun no verificada; no hay detector universal de tokens.

## Producto

- Marca de trabajo: **Lumcards**.
- Escritorio Windows: `Lumcards.exe`, host WinForms con WebView2 y servidor Python local.
- Web/PWA: frontend estático en `dist/`, configuración de Vercel y Firebase.
- Android: proyecto Capacitor en `android/`; existe `Lumcards-Offline.apk` en la raíz.
- Biblioteca local: colección y medios bajo `data/`. Están dentro de la carpeta raíz del vault, pero se excluyen de la memoria documental y de la lectura inicial de agentes.

## Funciones presentes

- Mazos, tarjetas, edición, búsqueda, estadísticas, repaso espaciado, audio, fórmulas y oclusión de imágenes.
- Estudio en bloques de tamaño configurable (10, 20, 50, personalizado o todas las disponibles hoy), persistencia en disco (`study_blocks.json`), conteo de tarjetas únicas sin inflar con «Otra vez» y pantalla de resumen al completar la primera pasada sin auto-avance descontrolado.
- Identificación de tarjetas repasadas en el bloque con distintivo «Repasada en este bloque», filtros dedicados en la lista de tarjetas y distinción del historial previo «Repasada antes» (separado de Juegos).
- Personalizador de tarjetas funcional con tema «Lumcards Índigo», alineación centrada real, scroll interno seguro y precedencia configurable frente a estilos importados.
- Vistas previas en tiempo real al crear mazos (tarjeta viva de biblioteca inerte) y tarjetas (split-view en escritorio, pestañas en móvil, alternancia anverso/reverso y modos de juego).
- Formularios de biblioteca (Crear mazo, Crear carpeta y Renombrar) con maquetación completa y adaptable (`dialog-deck-modal`), sin elementos cortados ni scroll horizontal en ningún viewport.
- Eliminación de mazos y carpetas desde el menú de opciones de la biblioteca sin entrar primero: confirmación obligatoria, opción segura por defecto para conservar submazos (`keepChildren: true`), borrado recursivo opcional y copia de seguridad previa obligatoria (`backup()`) verificada en el backend.
- Carpetas persistentes para agrupar mazos; creación, movimiento, renombrado y borrado seguro de carpetas y mazos desde la biblioteca.
- Importación de `.apkg`, `.colpkg`, `.anki2`, CSV, TSV, TXT y JSON. En Juegos, previsualización interactiva y reactiva de tarjetas y tabla antes de guardar.
- Juegos de elección, escritura, parejas y otras actividades en `dist/practice.js` y `dist/study-games.js`. Selector jerárquico de carpetas con navegación (`Abrir ➔`) separada de selección total (`Elegir toda esta carpeta`), migas de pan interactivas, búsqueda global con desambiguación de homónimos, resumen en 3 pasos ordenados, animaciones discretas respetando `prefers-reduced-motion` y deduplicación exacta de tarjetas descendientes tanto en backend como en fallback offline.
- Historial de práctica separado en `data/practice.sqlite3`.
- Sincronización local/P2P y código de sincronización web mediante Firebase.

## Dependencias decisivas

- `engine.py` es un adaptador directo al motor limpio independiente `clean_engine.py`. No importa `anki` en tiempo de ejecución.
- `clean_engine.py` implementa en Python puro + SQLite (`sqlite3`) la colección, notas, tarjetas, búsqueda, historial `revlog`, cálculo de rachas, planificador de repaso espaciado, importación/exportación de `.apkg` / `.colpkg` / `.anki2`, soporte para esquemas legacy y modernos (Anki 2.1b), jerarquías de mazos (con auto-creación de ancestros en `CleanDeckManager.id`), resolución de nombres de carpetas en `_deck_id` y renderizado estático de plantillas Mustache.
- `requirements-lock.txt` ya NO contiene `anki==26.8.1`. Se incorporó `zstandard==0.25.0` (licencia permisiva BSD) para la descompresión de paquetes y medios de Anki moderno.
- WebView2 y KaTeX conservan sus propios avisos de licencia permisivos.

- 2026-09-18 00:35: Rediseño Etapa 3 (Explorador de tarjetas, modales y estadísticas consistente con Studio) completado y verificado por Antigravity ([[tasks/2026-09-18-0020-antigravity-explorador-modales-estadisticas-studio]]). Modales (`dialog`, `#modal`, `#study-block-form`, `#dialog-deck-modal`, editor) con esquinas redondeadas de 20px, sombra profunda difusa, backdrop-filter de 4px, botones de acción con gradiente índigo Studio y segmented pills para bloques. Explorador y lista de tarjetas (`cardsView` / `favorites`) con filas y tarjetas de radio 18px (`var(--card-radius)`), elevación sutil, truncamiento seguro en títulos largos en móvil para evitar desbordamientos, y badges semánticos suaves ('Repasada en este bloque', 'Repasada antes', 'Nueva', 'Pendiente') en claro y oscuro. Pantalla Mi progreso (`statistics()` / `.stats-container`) con paneles y tarjetas de 18px, encabezados Georgia/serif, cajas de métricas de 14px, selector de periodo en píldoras, y preservación al 100% de los cálculos matemáticos, endpoints web y fallback offline. Suite Chromium `tests/test_studio_etapa3_design.cjs` PASS en 5 viewports (desktop, laptop, mobile, landscape, desktop_zoom_200) sin scroll horizontal y con 15 capturas. Paridad 0-diff en `student.css` y `app.css` entre `dist/` y `docs/`. Regresiones `test_study_studio_design.cjs`, `test_library_navigation_design.cjs`, `test_ux_study_audio.cjs`, `test_practice_studio.cjs`, `test_frontend.cjs`, `test_web_stats.cjs` y 92 tests unitarios Python pasando al 100%.

- 2026-09-18 00:05: Rediseño Etapa 2 (Estudio y visor de tarjetas consistente con Studio) completado y verificado por Antigravity ([[tasks/2026-09-17-2337-antigravity-estudio-visor-tarjetas-studio]]). Pantalla de estudio (`studyView`) armonizada con la paleta Studio (`#f7f6f2` / `#131722`), barra superior ergonómica `.anki-topbar` (50-52px) con indicador tipo píldora de progreso y acciones rápidas, visor de tarjetas `.anki-card-frame` con radio de 18px (14px en móvil) y scroll interno seguro para tarjetas largas, botón "Mostrar respuesta" `.anki-btn-show` Studio con gradiente índigo y atajo visual `<kbd>Espacio</kbd>`, y botones de calificación 1–4 `.anki-rate-button` con paletas semánticas suaves en claro y translúcidas nocturnas en oscuro con soporte táctil 2x2 en móvil. Suite Chromium `tests/test_study_studio_design.cjs` PASS en 5 viewports (desktop, laptop, mobile, landscape, desktop_zoom_200) sin scroll horizontal y con 15 capturas. Paridad 0-diff entre `dist/` y `docs/` en `student.css`. Regresiones `test_ux_study_audio.cjs`, `test_library_navigation_design.cjs`, `test_practice_studio.cjs`, `test_frontend.cjs`, `test_web_stats.cjs` y 92 tests unitarios Python pasando al 100%.

- 2026-09-17 23:30: Rediseño Etapa 1 (Biblioteca y navegación consistente con Studio) completado y verificado por Antigravity ([[tasks/2026-09-17-2315-antigravity-redinseo-biblioteca-navegacion]]). Tipografía editorial Georgia/serif, paleta marfil/índigo Studio (`#f7f6f2` / `#131722`), tarjetas y paneles con radio 18px y elevación sutil, órbita circular y drawer móvil accesible. Suite Chromium integral `tests/test_library_navigation_design.cjs` PASS en 5 viewports (desktop, laptop, mobile, landscape, desktop_zoom_200) sin desbordamiento horizontal y con 12 capturas. Paridad 0-diff entre `dist/` y `docs/` en `app.css`, `student.css`, `app.js`. Suites de regresión `test_frontend.cjs`, `test_web_stats.cjs`, `test_practice_studio.cjs` y 92 tests unitarios Python pasando al 100%.

- 2026-09-17 23:09: cierre independiente del diseño de Jugar y aprender por Codex: grid móvil sin ilustraciones recortadas/superpuestas y CTA oscuro blanco legible; E2E cinco condiciones PASS con30 capturas, temas, seis modos, teclado, audio real y reduced-motion. Cuatro activos frontend instalados con SHA256 idéntico a dist/docs; no motor/datos ni nuevo instalador/Android/deploy. [[tasks/2026-09-17-2300-codex-cierre-diseno]]. El resto de pantallas solo tiene plan: [[tasks/2026-09-17-2305-codex-plan-diseno-resto]].

- 2026-09-17: Suite completa de Python (92 pruebas) pasando al 100% en verde (`test_clean_engine.py`, `test_practice_http.py`, `test_server.py`, etc.) y 11 suites Node/Chromium E2E en verde. Rediseño de estudio de práctica con 6 modos, selector jerárquico de carpetas, bloques de estudio y modales responsivos consolidados en commit `acfe525`.
- 2026-09-17: Selección jerárquica de carpetas en Jugar y aprender (`dist/practice.js`, `dist/practice.css`) verificada al 100% en suite Playwright Chromium (`tests/test_practice_folder_selection.cjs`) con mazo sintético jerárquico en 4 viewports (1366x768, 1024x650, 390x844, 844x390). 18 capturas visuales en `tests/screenshots_practice_folders/`. Inicio con carpeta que contiene submazos sin tarjetas duplicadas (33 únicas), desambiguación de homónimos en rutas distintas, selector de importación `#import-deck` intacto y fallback offline sin servidor verificado. 10/10 tests en `test_clean_engine.py` y 7/7 en `test_practice_http.py` pasando. Detalle en [[tasks/2026-09-17-0630-codex-juegos-carpetas]].
- 2026-09-17: Suite completa en Chromium (`tests/test_study_blocks_and_preview.cjs`) con mazo sintético de 565 tarjetas y datos temporales pasando al 100% en los 4 viewports (1366x768, 1024x650, 390x844, 844x390). 15 capturas inspeccionadas. 91 pruebas unitarias Python en verde. Personalizador con tema Índigo y centrado, persistencia de bloques en disco (`study_blocks.json`), conteo sin duplicar por «Otra vez», resumen al finalizar primera pasada y vistas previas reactivas split-view / móvil. Detalle en [[tasks/2026-09-17-0145-antigravity-personalizacion-bloques-vistas]].
- 2026-09-15: Suite completa de Python ampliada a 87 pruebas, cinco suites Node/JS y comprobación funcional de escritorio/web en verde. La biblioteca local se migró con copia previa: 3.971 tarjetas conservadas, jerarquía consolidada sin separadores dañados ni nombres duplicados; `Mi progreso` y las acciones de carpeta/renombrado se verificaron en el servidor real. Detalle en [[tasks/2026-09-15-0047-codex-regresiones-motor-carpetas-progreso]].
- 2026-09-14: Suite completa de Python (83 pruebas) pasando al 100% en verde (`tests/test_clean_engine.py`, `tests/test_engine.py`, `tests/test_engine_enhancements.py`, `tests/test_io_integration.py`, `tests/test_native_image_occlusion.py`, `tests/test_practice_http.py`, `tests/test_quizlet_and_clean_importer.py`, `tests/test_server.py`, `tests/test_text_import.py`, `tests/test_text_import_engine.py`).
- 2026-09-14: Suite completa de pruebas JS/Node pasando al 100% en verde (`test_study_games.cjs`, `test_quizlet_games.cjs`, `test_sync_manager.cjs`, `test_anki_game_interaction.cjs`, `test_frontend.cjs`).
- Corregida la filtración de `frontKey`/`backKey` en `dist/study-games.js`.
- No se ejecutó una compilación Android ni un despliegue después de eliminar `node_modules`; primero hay que ejecutar `npm install`.

## Estado del repositorio

- Rama `main` conectada y sincronizada con `origin/main` (`https://github.com/carsalrecs-prog/lumcards.git`), commit `acfe525`.
- Avances consolidados confirmados y subidos a GitHub; despliegue automático activo en Vercel (`https://lumcards.vercel.app`).
- `docs/` sincronizado con `dist/` para paridad completa con la PWA.

## Observaciones críticas

- 2026-09-17 22:48: coherencia matemática y funcional de estadísticas y modo offline web (GitHub Pages / Vercel / PWA): `webApi` implementa clasificación exhaustiva del 100% de tarjetas en `cardBreakdown` (sumatoria de categorías idéntica a `totalCards`, clasificando tarjetas `due` en jóvenes o maduras), inclusión de tarjetas pendientes `due` en histogramas de intervalos y facilidad (`intervals`, `ease`), exclusión de tarjetas no estudiadas en el pronóstico de repasos futuros (`forecast`), cálculo dinámico de porcentajes de retención reales por período en `retentionTable`, normalización de propiedades `questionSnippet` y `recommendation` en `cards/weak`, y controladores offline en `practice.js` para registrar partidas e historial sin errores 404. Paridad 0 diff entre `dist/` y `docs/`. Detalle en [[tasks/2026-09-17-1756-antigravity-coherencia-estadisticas-web]].
- 2026-09-17 16:45: cálculo dinámico completo de estadísticas y puntos débiles en Modo Web (GitHub Pages / Vercel / PWA): `webApi` implementa `stats/detailed` con soporte de filtro de mazo y submazos jerárquicos (`deckId`), cálculo en tiempo real de `cardBreakdown` (nuevas, aprendiendo, jóvenes, maduras, suspendidas, enterradas), pronóstico `forecast` (30, 90, 365 días), historial `history`, calendario `calendar` (por año), distribución de intervalos y facilidad (`intervals`, `ease`), `retention`, `hourly` y `buttonPresses`. Reubicada la ruta `cards/weak` para detectar sanguijuelas y tarjetas críticas. `webApi('review')` registra el historial en `store._revlogs`. Caché actualizada a `20260917-web-stats`. Detalle en [[tasks/2026-09-17-1632-antigravity-estadisticas-modo-web]].
- 2026-09-17 16:25: soporte de bloques de estudio y conteos dinámicos en Modo Web (GitHub Pages / Vercel / PWA): `webApi` implementa `study/block-info`, `study/block-start`, `study/block-clear`, selección de tarjetas y `blockStatus` con persistencia en `localStorage`. `webApi('state')` recalcula `deck.total`, `deck.due`, `deck.new` y `deck.learned` en tiempo real, corrigiendo el bloqueo donde mazos con tarjetas nuevas mostraban 0 tarjetas disponibles y botón "Iniciar bloque" deshabilitado. Versión de caché renovada a `20260917-web-study-blocks`. Detalle en [[tasks/2026-09-17-1550-antigravity-soporte-estudio-modo-web]].
- 2026-09-17 03:20: Codex repitió suite de preview PASS, sin aprobar cierre global. Nuevas capturas muestran formularios de mazo comprimidos; importador solo tiene tabla y biblioteca carece de acción eliminar. Plan [[tasks/2026-09-17-0313-codex-importacion-menus]]. Precaución: remove([did]) actual no recorre submazos; pruebas de borrado/backup requeridas. No cambios de aplicación en esta revisión.
- 2026-09-17 03:08: implementadas y verificadas las correcciones de [[tasks/2026-09-17-0235-codex-preview-legibilidad]]:
  1. Editor de tarjetas amplio (`dialog.dialog-card-editor`) con ancho `min(1200px, 96vw)`, resuelto el límite de 680px en estudio, preview de 520px de ancho y 519px de alto sin scroll horizontal; modo móvil en pestañas accesibles `.mobile-tab-bar` con persistencia de borrador.
  2. Precedencia de estilos Lumcards (`lumcardsEnforcementCss`) garantizando contraste WCAG 2.1 >= 4.5:1 (verificado 17.06:1) sobre estilos conflictivos importados, preservando cloze, KaTeX, SVG y audio. Modo Original intacto.
  3. Contenido corto centrado verticalmente (`verticalOffsetRatio: 0.000012`) con tipografía adaptable clamp 24-38px; contenido largo accesible desde el inicio (`h3Top: 42.8px`) con scroll vertical natural `overflow-y: auto`.
  4. Suites automatizadas en verde: `tests/test_preview_legibilidad_verify.cjs` (Chromium real, 4 viewports), `tests/test_ux_study_audio.cjs`, `tests/test_study_blocks_and_preview.cjs` y 91 tests de backend Python. Capturas verificadas en `tests/screenshots_preview_verified/`.
  5. Activos sincronizados en `dist/`, `docs/` y `%LOCALAPPDATA%\Programs\Lumcards\dist`.

- 2026-09-17: el cierre anterior de audio quedó refutado por el usuario. Causa comprobada en integración: CSP HTTP bloqueaba todo el script inline de srcdoc; los tests VM no lo detectaban. Runtime externo permitido, flujo de contenido normal y fondo continuo; prueba real Chromium de reproducción/reinicio y anverso/reverso largo a cuatro tamaños. Instalación y servidor activos actualizados a 20260917-csp. Validación en hardware móvil/Android y salida auditiva física no realizadas. [[tasks/2026-09-17-codex-csp-responsive]]. Las entradas anteriores son evidencia histórica, no prueba del funcionamiento final.

- Arquitectura de Audio y Layout corregida el 2026-09-16: El reproductor de audio dentro de los iframes (`installCardAudioRuntime`) ahora delega incondicionalmente la reproducción al padre usando `postMessage('ankiPlayAudio')` en vez de instanciar un elemento `<audio>` interno, resolviendo bloqueos del sandbox de WebView2. El layout del iframe de estudio ya no fuerza `min-height: 100dvh` sobre el padre, sino que usa `height: 100%`, `min-height: 0` y `justify-content: flex-start` para alineación natural al inicio, evitando "espacios feos" negros en pantallas largas. Versión de caché `20260916-audio-layout` propagada a `index.html` y `practice.html`. 90 pruebas de Python y 6 suites de Node pasando 100% en verde tras reflejar la nueva arquitectura y reglas de CSS. Detalle en [[tasks/2026-09-16-1300-antigravity-audio-parent-delegation]].
- Empaquetado UX corregido el 2026-09-16: aunque los activos instalados ya contenían el código nuevo, reutilizaban la versión de caché `20260915-ux`, por lo que WebView2 podía seguir mostrando la variante antigua. Se renovó a `20260916-ux2`, el HTML fuerza la actualización del service worker, las navegaciones usan red primero y el host de escritorio añade un identificador único por apertura. Paquete raíz e instalación local actualizados; autoprueba nativa, 90 pruebas Python y seis suites Node en verde. Detalle en [[tasks/2026-09-16-1209-codex-cache-empaquetado-ux]].
- Instalador Windows reparado el 2026-09-16: `installer.ps1` y el instalador gráfico ahora copian y exigen `clean_engine.py`. La instalación local fue reparada sin modificar su biblioteca y el servidor instalado respondió saludable con datos temporales. El instalador se reconstruyó localmente y la suite Python pasó 89/89. Detalle en [[tasks/2026-09-16-1158-codex-instalador-clean-engine]].
- Tarea UX [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]] completada y aprobada por Codex el 2026-09-16: Estudio compacto sin scroll innecesario, fondo de Juegos coherente, botones de audio accesibles solo con icono y repetición robusta. La carrera de callbacks tardíos quedó cubierta conductualmente. Se repitieron 6 suites Node/JS, 87 pruebas Python, sintaxis JS, `git diff --check` y paridad SHA256 de los 8 pares frontend modificados. Está implementado y probado localmente, pero aún no committeado, subido ni desplegado.
- `README.md` reconoce el uso del motor AGPL, pero también contiene frases que presentan Lumcards como totalmente independiente.
- `COMMERCIAL_SPECIFICATION.md` contiene conclusiones legales absolutas que no han sido validadas por asesoría jurídica.
- Ningún documento del repositorio prueba que el producto esté listo para una venta con código privado.
