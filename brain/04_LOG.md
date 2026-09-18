---
tags: [lumcards, registro]
updated: 2026-09-18
---

# Registro de trabajo

## 2026-09-18 — Diagnóstico y robustez del arranque de escritorio y servidor local

- Antigravity diagnosticó el error reportado en `Lumcards.exe` (*"No se pudo iniciar la biblioteca. Revisa data\server-error.log"*):
  1. Causa raíz: En `data\server-error.log` figuraba `OSError: [WinError 10048] Solo se permite un uso de cada dirección de socket` debido a una segunda invocación de `server.py` compitiendo por el puerto 8765 mientras la primera instancia (PID 23168) ya estaba activa. Al salir el proceso duplicado, `start.ps1` consideró prematuramente que el arranque había fallado y arrojó excepción a `Lumcards.exe`.
  2. Mitigaciones:
     - `server.py`: `valid_host()` valida de inmediato `127.0.0.1`, `localhost` y `0.0.0.0` sin abrir sockets UDP a `8.8.8.8:80` en cada petición local.
     - `start.ps1`: ante la salida de `$ankiProcess`, ejecuta una verificación de salud redundante (`/api/health`); si el servidor ya está respondiendo, sale con código 0.
     - `tools/launcher.cs`: antes de lanzar excepción si el proceso auxiliar reporta salida, consulta `IsHealthyAsync()`; timeout de sonda elevado a 2500ms.
     - `tools/build-desktop.ps1 -StageOnly` ejecutado con éxito.
  3. Estado: Servidor PID 23168 activo y sano; 3.972 tarjetas intactas. Basta hacer clic en "Volver a intentar" en la ventana de Lumcards.
- Archivos: `server.py`, `start.ps1`, `tools/launcher.cs`, `tools/build-desktop.ps1`.
- Validación: `curl.exe http://127.0.0.1:8765/api/health` 200 OK, `curl.exe http://127.0.0.1:8765/api/state` 200 OK, 92 pruebas unitarias de backend PASS (17.8s). Ficha: [[tasks/2026-09-18-0050-antigravity-diagnostico-arranque-escritorio]].

## 2026-09-18 — Rediseño Etapa 3: Modales, explorador de tarjetas y estadísticas consistente con Studio

- Antigravity implementó la Etapa 3 del plan de coherencia visual ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]):
  1. Modales del sistema (`dialog`, `#modal`, `#study-block-form`, `#dialog-deck-modal`, editor) con radio de 20px, sombra difusa profunda `0 24px 60px rgba(19, 23, 34, 0.22)`, desenfoque `backdrop-filter: blur(4px)`, botones principales con gradiente índigo Studio (`linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)`), selector segmented pill de tarjetas para bloque (`.block-size-preset`) y campos con radio de 11px y foco índigo accesible.
  2. Explorador y lista de tarjetas (`cardsView` / `favorites`): filas `.note-row` con radio de 18px (`var(--card-radius)`), elevación sutil al hover, `min-width: 0; max-width: 100%` con truncamiento de títulos largos evitando desbordamientos en móvil, y badges semánticos suaves ('Repasada en este bloque', 'Repasada antes', 'Nueva', 'Pendiente') en claro y noche translúcida en oscuro.
  3. Pantalla Mi progreso (`statistics()` / `.stats-container`): tarjetas `.stats-card` y paneles con radio de 18px, encabezados editoriales Georgia/serif, cajas de métricas `.stats-metric-box` con radio de 14px, selector de periodo en píldoras ergonómicas, y preservación al 100% de la lógica matemática, endpoints web (`cardBreakdown`, `retentionTable`, `forecast`, `weakCards`) y fallback offline sin servidor.
  4. Preservación estricta de `clean_engine.py`, base de datos SQLite y paridad 0-diff en `dist/` vs `docs/`.
- Archivos: `dist/student.css`, espejo `docs/student.css`, nueva suite E2E `tests/test_studio_etapa3_design.cjs`.
- Validación: `node tests/test_studio_etapa3_design.cjs` PASS en 5 viewports (15 capturas en `tests/screenshots_studio_etapa3/`, 0 scroll horizontal), `node tests/test_study_studio_design.cjs` PASS, `node tests/test_library_navigation_design.cjs` PASS, `node tests/test_ux_study_audio.cjs` PASS, `node tests/test_practice_studio.cjs` PASS, `node tests/test_frontend.cjs` PASS, `node tests/test_web_stats.cjs` PASS, 92 tests unitarios Python PASS, 0 diff entre `dist/` y `docs/`. Ficha: [[tasks/2026-09-18-0020-antigravity-explorador-modales-estadisticas-studio]].

## 2026-09-18 — Rediseño Etapa 2: Estudio y visor de tarjetas consistente con Studio

- Antigravity implementó la Etapa 2 del plan de coherencia visual ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]):
  1. Pantalla de estudio (`studyView`) unificada con la estética Studio (marfil `#f7f6f2` / noche azulada `#131722`).
  2. Barra superior `.anki-topbar` compacta y ergonómica (50-52px), botón de retorno `← Mazos`, indicador de progreso tipo píldora con micro-barra y conteos destacados, accesos rápidos (audio R, editar E, favorita S, pantalla completa F).
  3. Marco y visor de tarjetas `.anki-card-frame` con esquinas redondeadas de 18px (14px en móvil), sombra suave y scroll interno seguro sin desbordamiento del viewport.
  4. Botón "Mostrar respuesta" `.anki-btn-show` Studio con degradado índigo suave y distintivo `<kbd>Espacio</kbd>`.
  5. Botones de calificación 1–4 `.anki-rate-button` con paleta semántica armoniosa (rojo suave, ámbar cálido, verde esmeralda suave, índigo pastel) en claro y translúcidos noche en oscuro, con atajos `<kbd>1..4</kbd>` e intervalos de tiempo asociados; en móvil distribuidos en grid 2x2 táctil accesible.
  6. Preservación estricta de la delegación de audio (`AudioController`), atajos de teclado, temporizadores y algoritmos SRS de `clean_engine.py`.
- Archivos: `dist/student.css`, espejo `docs/student.css`, suite E2E `tests/test_study_studio_design.cjs`.
- Validación: `node tests/test_study_studio_design.cjs` PASS en 5 viewports (15 capturas en `tests/screenshots_study_studio/`, 0 scroll horizontal), `node tests/test_ux_study_audio.cjs` PASS, `node tests/test_library_navigation_design.cjs` PASS, `node tests/test_practice_studio.cjs` PASS, `node tests/test_frontend.cjs` PASS, `node tests/test_web_stats.cjs` PASS, 92 tests unitarios Python PASS, 0 diff entre `dist/` y `docs/`. Ficha: [[tasks/2026-09-17-2337-antigravity-estudio-visor-tarjetas-studio]].

## 2026-09-17 — Rediseño Etapa 1: Biblioteca y navegación consistente con Studio

- Antigravity implementó la Etapa 1 del plan de coherencia visual ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]):
  1. Identidad unificada con Studio: paleta marfil `#f7f6f2` (claro) / `#131722` (oscuro), acento índigo `#6554df` / `#6366f1`, líneas suaves `#e5e8ee` / `#30394b`, superficies `#ffffff` / `#1c2230`.
  2. Tipografía editorial Georgia/serif para títulos principales (`h1`, `h2`) y sans-serif limpia para controles y metadatos.
  3. Sidebar y topbar con brand mark degradado, navegación ergonómica (radio 10-12px), buscador con `Ctrl K` accesible.
  4. Paneles de bienvenida Studio: `focus-panel` con degradado índigo suave, órbita circular perfecta con tarjetas de hoy y botón CTA de alto contraste; `goal-panel` con radio de 18px, insignia de racha y barra de progreso.
  5. Tarjetas de mazo y carpetas con radio de 18px (`var(--card-radius)`), elevación sutil, badges distintivos de carpetas y navegación interna.
- Archivos: `dist/app.css`, `dist/student.css`, espejos `docs/app.css`, `docs/student.css`, nueva suite `tests/test_library_navigation_design.cjs`.
- Validación: `tests/test_library_navigation_design.cjs` PASS en 5 viewports (12 capturas, sin scroll horizontal), `test_frontend.cjs` PASS, `test_web_stats.cjs` PASS, `test_practice_studio.cjs` PASS (5 viewports), 92 tests unitarios Python PASS, 0 diff entre `dist/` y `docs/`. Ficha: [[tasks/2026-09-17-2315-antigravity-redinseo-biblioteca-navegacion]].

## 2026-09-17 — Cierre de diseño e indicaciones del resto

- Codex revalidó la entrega de Juegos y terminó grid móvil sin recortes/superposición y contraste del CTA oscuro. E2E5 condiciones PASS,30 capturas; audio/reduced-motion/seis modos y regresión UX PASS. Evidencia y límites: [[tasks/2026-09-17-2300-codex-cierre-diseno]].
- Activos practice.html/css/js y sw.js actualizados en instalación local con copia recuperable y paridad SHA256; motor/biblioteca sin cambios, no instalador nuevo ni publicación. Caché específica web-stats-studio-final.
- Plan del resto con etapas, componentes, aceptación y prompt del ejecutor: [[tasks/2026-09-17-2305-codex-plan-diseno-resto]]. Solo plan, no ejecución. Historial anterior conservado en [[archive/2026-09|archivo septiembre2026]].

## 2026-09-17 — Coherencia de estadísticas y robustez offline en Modo Web

- Antigravity resolvió las incoherencias matemáticas y funcionales de las estadísticas en la versión web (GitHub Pages / Vercel / PWA):
  1. Clasificación exhaustiva del 100% de tarjetas en `cardBreakdown` (distribuyendo tarjetas con estado `due` en jóvenes o maduras según intervalo), logrando que la suma de categorías coincida exactamente con `totalCards`.
  2. Inclusión de tarjetas pendientes `due` en las distribuciones de intervalos (`intervals`) y facilidad (`ease`), evitando que mazos con tarjetas repasadas muestren "Aún no hay tarjetas graduadas" o "SIN DATOS".
  3. Exclusión de tarjetas nuevas del pronóstico de repasos futuros (`forecast`).
  4. Cálculo de porcentajes de retención reales por período en `retentionTable`.
  5. Suministro de `questionSnippet` y `recommendation` en `cards/weak` eliminando `undefined` en la UI.
  6. Normalización de endpoints offline en `practice.js` (`/api/practice/result`, `/api/practice/history`, `/api/decks`, `/api/import/text/`) evitando errores 404 en hosting estático.
- Validación: `tests/test_web_stats.cjs` PASS, `test_study_blocks_and_preview.cjs` PASS (Chromium 4 viewports), 92/92 pruebas Python PASS, 0 diff entre `dist/` y `docs/`, `tools/check-brain.ps1` OK. Ficha: [[tasks/2026-09-17-1756-antigravity-coherencia-estadisticas-web]].

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
