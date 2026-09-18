---
tags: [lumcards, tarea, diseno]
---

# Tarea: Rediseño Etapa 3 - Explorador de tarjetas, modales y estadísticas consistente con Studio

## Control

- ID: 2026-09-18-0020-antigravity-explorador-modales-estadisticas-studio
- Estado: hecha
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-18T00:33:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit base `cfd9fb6` con etapas 1, 2 y 3 completadas y preservadas.

## Objetivo y aceptación

- Implementar la fase de **Explorador de tarjetas, modales de acción y estadísticas** unificando su identidad con Studio ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]):
  1. **Explorador y lista de tarjetas (`cardsView` / `favorites`)**:
     - Tarjetas en grid o lista con bordes suaves de 18px (`var(--card-radius)`), elevación sutil, tipografía clara.
     - Badges de estado de tarjeta ('Repasada en este bloque', 'Repasada antes', 'Nueva', 'Pendiente') con paleta semántica suave Studio en modo claro y oscuro.
     - Barra de filtros de progreso y selector de orden con botones tipo píldora ergonómicos.
  2. **Modales del sistema (`dialog`, `#modal`, `#study-block-form`, `#dialog-deck-modal`, editor)**:
     - Ventana modal con radio de 20px, sombra profunda difusa (`0 24px 60px rgba(19, 23, 34, 0.22)`), telón con desenfoque (`backdrop-filter: blur(4px)`).
     - Botones de acción principales con gradiente índigo Studio (`linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)`).
     - Entradas de texto, selects y textareas con bordes suaves `#e5e8ee` (claro) / `#30394b` (oscuro) y foco índigo accesible.
     - Selector de cantidad de tarjetas para bloque de estudio (10, 20, 50, todas) con estilo segmented pill.
  3. **Mi progreso (`statistics()` / `.stats-container`)**:
     - Paneles de estadísticas con radio de 18px (`var(--card-radius)`), paleta marfil `#f7f6f2` / `#131722`, superficies `#ffffff` / `#1c2230`.
     - Encabezados editoriales Georgia/serif y cajas de métricas con radio de 14px.
     - Preservar al 100% los cálculos matemáticos, endpoints web (`cardBreakdown`, `retentionTable`, `forecast`, `weakCards`) y fallback offline sin servidor.
  4. Cero scroll horizontal en los 5 viewports (desktop, laptop, mobile, landscape, desktop_zoom_200).
  5. Paridad estricta 0-diff entre `dist/` y `docs/`.
  6. Todas las suites de regresión relevantes en verde.

## Archivos y alcance

- `dist/student.css` y `docs/student.css` (estilos Studio para modales, explorador y estadísticas)
- `tests/test_studio_etapa3_design.cjs` (suite E2E en Chromium aislado en 5 viewports)

## Checkpoint

- 2026-09-18T00:20:00-05:00: Ficha iniciada tras aprobación del usuario ("sí hazlo").
- 2026-09-18T00:27:00-05:00: Implementación completada en `dist/student.css` y espejada a `docs/student.css`. Suite E2E `tests/test_studio_etapa3_design.cjs` superada al 100% en los 5 viewports.
- 2026-09-18T00:32:00-05:00: Regresiones completas ejecutadas (estudio, biblioteca, audio, practice studio, frontend, web stats, 92 tests de backend). Paridad 0-diff confirmada.

## Validación

- `node tests/test_studio_etapa3_design.cjs`: **PASS** (5 viewports: desktop, laptop, mobile, landscape, desktop_zoom_200; modales con radio >= 18px y cierre con Escape, explorador de tarjetas con radio >= 14px y tags semánticos, estadísticas con radio >= 16px y métricas, 0 scroll horizontal, claro y oscuro).
- `node tests/test_study_studio_design.cjs`: **PASS** (Etapa 2 estudio intacta en 5 viewports).
- `node tests/test_library_navigation_design.cjs`: **PASS** (Etapa 1 biblioteca intacta en 5 viewports).
- `node tests/test_ux_study_audio.cjs`: **PASS** (Audio replay y delegación intactos).
- `node tests/test_practice_studio.cjs`: **PASS** (Studio / Jugar intacto en 5 viewports).
- `node tests/test_frontend.cjs`: **PASS** (Plantillas, escapes, paginación, KaTeX).
- `node tests/test_web_stats.cjs`: **PASS** (Estadísticas web y modo offline).
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: **PASS** (92 tests en 17.8s).
- Paridad `git diff --no-index dist/student.css docs/student.css`: **0 DIFF**.
- Paridad `git diff --no-index dist/app.css docs/app.css`: **0 DIFF**.

## Pendiente y primer paso

- Ninguno para la Etapa 3. Para las etapas restantes del plan ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]): consultar autorización del usuario.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: ninguno.

## Cierre

- Tarea completada y verificada integralmente con evidencias visuales y suites automatizadas. Estado: `hecha`.
