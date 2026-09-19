---
tags: [lumcards, registro]
updated: 2026-09-19
---

## 2026-09-19 — Antigravity: subida a GitHub de integración Drive OAuth y sincronización Firebase

- Código local con cliente Google Drive OAuth real, sincronización Firestore adaptada a reglas nuevas y suite de accesos integrado. 169 checks Chromium PASS, sintaxis Python PASS, pruebas de sync y contratos PASS. Subido a GitHub `origin/main` commit `586fbb7`. [[tasks/2026-09-19-1310-antigravity-fix-sync-drive-produccion]].

## 2026-09-19 — Codex: OAuth y transferencia Drive real

- Drive API habilitada; cliente OAuth existente integrado sin secretos, orígenes/permisos guardados. Subida, listado, descarga e importación reales PASS con copia sintética de 4 KB; Richard la movió a la papelera y la carpeta quedó vacía. Cinco suites/contratos focales, 17 pruebas Python, PWA r7, 169 checks y paridad dist/docs PASS. Código local sin publicar. [[tasks/2026-09-19-1207-codex-completar-drive-real]]

## 2026-09-19 — Codex: Drive sin exito ficticio

- dist/docs sync-manager y formulario migrados a GIS sin correo/token simulado ni archivos inventados; tokens en memoria, permisos y caducidad comprobados. app/sync/cache r6. Contratos Drive, SyncManager, inicializacion y PWA PASS; falta configuracion y transferencia remota. [[tasks/2026-09-19-1156-codex-drive-oauth]]

## 2026-09-19 — Codex: validacion de nube

- Firebase init recursivo corregido, prueba nueva PASS y cache r5 espejada. Cinco suites PASS; reglas corregidas localmente y cuatro casos esperados del simulador real PASS, sin datos personales ni escrituras. Reglas publicadas con permiso expreso y CLI exit 0; aplicacion sin publicar. Drive OAuth y acceso pago integral pendientes. [[tasks/2026-09-19-0502-codex-validar-nube]].


## 2026-09-18 — Codex: reparacion funcional web

- Cuatro fallos corregidos: cuota sin exito falso, JSON ilegible preservado, fechas locales y timestamps string. Error/reintento de estadisticas sin bucle. 9 escenarios Chromium y persistencia offline sintetica PASS; app.js/cache r4 y espejos. [[tasks/2026-09-18-2133-codex-reparar-persistencia-web]]. Sin motor, datos personales ni publicacion.

## 2026-09-18 — Codex: formulas locales Studio

- KaTeX existente reutilizado en HTML y cache math-r3, sin instalar dependencias ni relajar CSP. 24 checks Chromium + cache offline + tres suites PASS. Cuatro defectos funcionales web confirmados, no reparados en este alcance. [[tasks/2026-09-18-2113-antigravity-cierre-matematicas-studio]]. Sin publicar/instalar.

## 2026-09-18 — Codex: Studio restante y revisión de acceso

- Mi espacio, formularios/importadores, confirmaciones accesibles y estados veraces; administración nueva y nombres largos corregidos. dist/docs coherentes, caché r2 y arranque externo servido por desktop. Sin cambios propios de motor, sincronización ni datos.
- 11 suites frontend y 93 pruebas Python PASS; administración 169 checks Chromium. Recorrido final y detalle en [[tasks/2026-09-18-2050-antigravity-redisenar-resto-aplicacion]]. Nube real, KaTeX externo bajo CSP y persistencia web offline pendientes. Sin instalación/publicación.

## 2026-09-18 21:30 — Claude: control de acceso manual (admin + aprobación por Yape)

- Visión de negocio de Richard registrada en [[03_DECISIONS]] → "Modelo de negocio: acceso pago manual + tienda de mazos": cobro manual por Yape, correo admin `carsal.recs@gmail.com`, tienda de mazos por carrera (futuro), IA + suscripción mensual (futuro, sin diseño técnico).
- Implementado (detalle y pruebas en [[tasks/2026-09-18-2130-claude-control-acceso-manual]]): `ADMIN_EMAILS` en `dist/sync-manager.js`, registro de acceso por usuario en Firestore (`users/{uid}.accessApproved`), panel de administración en `dist/app.js` (nav "Administración", listar/aprobar/revocar usuarios), tarjeta de estado de acceso en Preferencias/Sincronización, `firestore.rules` nuevo en la raíz del repo (no desplegado — lo debe hacer el usuario en la consola de Firebase).
- Probado en navegador con usuarios simulados por consola (invitado, admin, usuario normal) — comportamiento correcto en los tres casos. No probado con login real porque no se sabe si los proveedores de Auth están habilitados ni si las reglas de Firestore ya están desplegadas (pasos que le corresponden a Richard, ver ficha).
- Diseño defensivo: si Firestore no está disponible o las reglas no están desplegadas, el sistema cae a un estado "pendiente" por defecto (nunca aprueba a nadie por accidente).

## 2026-09-18 21:00 — Claude: botones de reset en UI web/desktop + hallazgo arquitectónico

- Hallazgo clave: la web YA NO depende de que se construyan Funciones Vercel/Firebase RTDB desde cero. `dist/sync-manager.js` ya implementa autenticación Firebase (email, Google, invitado) y sincronización completa vía **Firestore** (`syncFullWorkspace`/`pullFullWorkspace`), y `dist/app.js` ya tiene un modo web 100% funcional sin Python (`webApi()`, estado `isWebMode`) que calcula estadísticas en el cliente. El plan previo en `tasks/2026-09-18-1600-codex-web-backend-solution.md` y `brain/SIGUIENTE_AGENTE_PROMPT.md` (Fases 1-2: Vercel Functions Node.js + Firebase Realtime DB) asumía que nada de esto existía; quedan **superados/no necesarios** salvo que se decida lo contrario.
- Faltaba lo único pendiente verificado: botones de reset de progreso (mazo individual y colección completa) con modal de confirmación, ausentes tanto en la UI como en las rutas de `webApi()` (`decks/reset`, `reset-all`, y el ya usado pero no implementado `cards/reset`).
- Implementado en `dist/app.js` (sincronizado a `docs/app.js`):
  - Rutas `cards/reset`, `decks/reset` (incluye submazos), `reset-all` en `webApi()`, espejando la lógica de `clean_engine.py::reset_deck/reset_all` (estado nuevo, ivl 0, factor/ease 2500, reps 0, lapses 0).
  - Botón "Reiniciar progreso del mazo" en el menú de opciones de cada mazo y en la barra de acciones del mazo abierto.
  - Botón "Reiniciar toda la colección" en Preferencias > Zona de riesgo, con checkbox de doble confirmación obligatorio.
  - Ambos flujos llaman `api('backup')` antes de resetear (igual que el desktop, que llama `engine.backup()`).
  - Nuevo icono `undo` en el mapa de iconos SVG.
- Credenciales de Firebase actualizadas en `dist/sync-manager.js` (appId y measurementId reales del proyecto "lumcards" proporcionados por el usuario; databaseURL de RTDB agregado aunque el flujo activo usa Firestore, no RTDB).
- Pruebas reales: `node --check dist/app.js` y `dist/sync-manager.js` PASS. Servidor estático `python -m http.server 9100 --directory dist` (nueva config `web-static` en `.claude/launch.json`) + navegador embebido: reset de un mazo confirmado (2 nuevas/4 repasadas → 6 nuevas/0 repasadas, el otro mazo intacto) y reset total confirmado (ambos mazos a 0 repasadas). No se probó con datos reales del usuario en `data/` (fuera de alcance, se usaron datos semilla del navegador).
- Pendiente real: `check-brain.ps1` no ejecutado todavía en esta sesión; suite Python/Powershell no ejecutada (cambios son solo JS de la carpeta web). Offline queue (`STORAGE_KEYS.OFFLINE_QUEUE`) sigue sin implementarse — es aspiracional en el código, no se usa en ningún flujo.

## 2026-09-18 15:45 — Codex: correcciones funcionales de estadísticas (lenguaje y reset)

- Identificados términos confusos en clean_engine.py (línea 1831-1837): "Jóvenes", "Maduras", "Enterradas", "Suspendidas"
- Reemplazados con descripciones claras: "En estudio avanzado (1-20 días)", "Dominadas (>20 días)", "Pausadas (no incluidas en repaso)", "Ocultas (sin acceso directo)"
- Implementada funcionalidad de reset:
  - reset_deck(deck_id): reinicia todas las tarjetas de un mazo a estado 'new'
  - reset_all(): reinicia todas las tarjetas de la colección
  - Endpoints HTTP: POST /api/decks/reset y POST /api/reset-all
- Validación: Python syntax PASS, módulos importan sin errores
- Pendiente: agregar botones UI en app.js (archivo minificado, requiere edición cuidadosa)
- APIs funcionales y lista para pruebas

## 2026-09-18 15:10 — Codex: cierre de rediseño Studio Fase D y correcciones de paridad

- Completada auditoría final visual de 8 vistas: Biblioteca, Tarjetas, Estudio, Progreso, Sincronización, Copias, Preferencias, Editor.
- Verificado en desktop (800×600) y móvil (375×812): sin scroll horizontal, reflow coherente, colores/tipografía Studio, contraste ≥4.5:1.
- Correcciones: test_ux_study_audio.cjs (versión 20260918-studio-workspace), dist/practice.html y docs/practice.html (paridad de scripts).
- Todas las suites de regresión PASS (9/9): test_ux_study_audio, preview_legibilidad_verify, import_menus_verify, studio_etapa3_design, library_navigation_design, study_studio_design, practice_studio, study_blocks_and_preview, web_stats.
- test_studio_remaining_design.cjs (6 tamaños×2 temas×2 presets, 200+ capturas): PASS (exit 0).
- Archivos modificados: 22 (dist/docs paridad, .claude/launch.json). Cambios sin publicación/instalación.
- Estado: lista_para_relevo. Relevo en [[08_HANDOFF]].

## 2026-09-18 — Reparación definitiva de arranque de escritorio y blindaje contra regresiones

- Antigravity resolvió el error de pantalla "No se pudo iniciar la biblioteca":
  1. Causa raíz: En el commit anterior `2ca8ba3`, se omitió un bloque `} catch { }` en el bucle de sondeo de `start.ps1`, lo que impedía a PowerShell parsear el script (`MissingCatchOrFinally`) y abortaba el arranque de Python antes de iniciar.
  2. Corrección de `start.ps1` y adición de fallback directo a Python en `tools/launcher.cs` (si PowerShell falla o está restringido, `Lumcards.exe` arranca directamente `.venv\Scripts\python.exe server.py`).
  3. Creación de suite `tests/test_scripts_syntax.py` para parsear automáticamente todos los `.ps1` del repositorio vía el AST oficial de PowerShell.
  4. Incorporación de verificación obligatoria de scripts `.ps1` en `tools/check-brain.ps1`.
  5. Actualización y pase exitoso de `tests/test_desktop.ps1` en WebView2.
  6. Recompilado y desplegado de `Lumcards.exe`.
- Archivos: `start.ps1`, `tools/launcher.cs`, `tools/check-brain.ps1`, `tests/test_scripts_syntax.py`, `tests/test_desktop.ps1`, `Lumcards.exe`.
- Validación: 93 pruebas unitarias Python PASS (24.9s), `test_desktop.ps1` PASS (`ready: true`, exit code 0), `check-brain.ps1` Status: OK. Ficha: [[tasks/2026-09-18-1346-antigravity-reparar-arranque-escritorio]].

## 2026-09-18 — Publicación y despliegue web en producción (GitHub y Vercel)

- Antigravity subió a GitHub y reflejó en Vercel el trabajo consolidado (commit `2ca8ba3`):
  1. Rediseño integral Studio (Biblioteca y navegación, Estudio y visor de tarjetas con botones 1–4, Modales de 20px, Explorador de tarjetas y Estadísticas editoriales Georgia).
  2. Ajustes de Jugar y aprender de Codex (arte adaptable, seis modos de práctica).
  3. Coherencia matemática de estadísticas web y modo offline.
  4. Robustez de arranque del servidor local y launcher (`start.ps1`, `server.py`, `launcher.cs`).
  5. 4 nuevas suites de pruebas E2E en Chromium (`test_library_navigation_design.cjs`, `test_study_studio_design.cjs`, `test_studio_etapa3_design.cjs`, `test_static_web_e2e.cjs`).
  6. Despliegue en vivo confirmado en `https://lumcards.vercel.app` (HTTP/2 200) y `https://lumcards.vercel.app/practice` (HTTP/2 200). Ficha: [[tasks/2026-09-18-0105-antigravity-subir-cambios-web-vercel-github]].

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


Entradas anteriores: [[archive/2026-09-studio-cierre-log]].
