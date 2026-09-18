---
tags: [lumcards, tarea, diseno]
---

# Tarea: Rediseño Etapa 2 - Estudio y visor de tarjetas consistente con Studio

## Control

- ID: 2026-09-17-2337-antigravity-estudio-visor-tarjetas-studio
- Estado: hecha
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-18T00:03:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit base `cfd9fb6` con etapas 1 y 2 completadas.

## Objetivo y aceptación

- Implementar la fase de **Estudio y visor de tarjetas** del plan de diseño ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]):
  1. Armonizar la pantalla de estudio (`studyView`) con la estética Studio (marfil `#f7f6f2` en claro / `#131722` en oscuro, acento índigo `#6554df` / `#6366f1`, superficies `#ffffff` / `#1c2230`, bordes sutiles `#e5e8ee` / `#30394b`).
  2. Barra superior de estudio (`.anki-topbar`): compacta (50-52px), tipografía editorial y limpia, botón "Mazos" ergonómico, estado de bloque o conteo de tarjetas (nuevas/aprendizaje/repaso) refinado con micro-barra de progreso, acciones rápidas (repetir audio R, editar E, favorita S, pantalla completa F).
  3. Escenario de tarjeta (`.anki-study-stage` y `.anki-card-frame`): radio de 18px (14px en móvil) con sombra ligera, sin desbordamientos en escritorio ni móvil, scroll vertical interno fluido para tarjetas extensas.
  4. Barra inferior de respuestas (`.anki-bottom-bar`): botón "Mostrar respuesta" amplio y distinguido con degradado índigo e indicación accesible de atajo `<kbd>Espacio</kbd>`, botones de calificación 1–4 ("Otra vez", "Difícil", "Bien", "Fácil") armonizados con colores semánticos suaves (rojo tenue, ámbar cálido, verde esmeralda suave, índigo pastel), intervalos claros y atajos `1..4`.
  5. Cero alteraciones a la lógica de audio (`AudioController.playList`, repetición con R o botón), temporizadores, algoritmos SRS ni `clean_engine.py`.
  6. Paridad estricta 0-diff entre `dist/` y `docs/`.
  7. Validación responsive en 5 viewports (desktop, laptop, mobile, landscape, desktop_zoom_200) y ejecución de suites de regresión relevantes.

## Archivos y alcance

- `dist/student.css` y `docs/student.css` (estilos de estudio, barra superior, visor de tarjetas, botón de revelado y botones de calificación)
- `tests/test_study_studio_design.cjs` (suite E2E en Chromium aislado con 5 viewports, pruebas de revelación con espacio, calificación 1-4, tema oscuro y retorno a mazos)

## Checkpoint

- 2026-09-17T23:37:00-05:00: Ficha iniciada tras aprobación del usuario ("si").
- 2026-09-18T00:00:00-05:00: Implementación CSS completada en `dist/student.css` y espejada a `docs/student.css`. Suite E2E creada y ejecutada con éxito total en los 5 viewports.
- 2026-09-18T00:03:00-05:00: Regresiones completas ejecutadas (audio, biblioteca, practice studio, frontend, web stats, 92 tests de backend). Paridad 0-diff confirmada.

## Validación

- `node tests/test_study_studio_design.cjs`: **PASS** (5 viewports: desktop, laptop, mobile, landscape, desktop_zoom_200; 0 scroll horizontal, radio >= 14px, Space para mostrar respuesta, 4 botones de calificación con fondos semánticos en claro y oscuro, retorno a biblioteca OK).
- `node tests/test_ux_study_audio.cjs`: **PASS** (AudioController replay cycle OK, delegación de audio en iframe OK, contrato CSS sin selectores directos frágiles OK).
- `node tests/test_library_navigation_design.cjs`: **PASS** (5 viewports de biblioteca y navegación OK).
- `node tests/test_practice_studio.cjs`: **PASS** (5 viewports y 6 modos de práctica Studio OK).
- `node tests/test_frontend.cjs`: **PASS** (plantillas, escapes, paginación, KaTeX).
- `node tests/test_web_stats.cjs`: **PASS** (estadísticas web y modo offline).
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: **PASS** (92 tests en 18.2s).
- Paridad `git diff --no-index dist/student.css docs/student.css`: **0 DIFF**.
- Paridad `git diff --no-index dist/app.css docs/app.css`: **0 DIFF**.

## Pendiente y primer paso

- Ninguno para la Etapa 2. Para la Etapa 3 (Modales de estudio y configuración, explorador de tarjetas y estadísticas): consultar autorización del usuario.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: ninguno.

## Cierre

- Tarea completada y verificada integralmente con evidencias visuales y suites automatizadas. Estado: `hecha`.
