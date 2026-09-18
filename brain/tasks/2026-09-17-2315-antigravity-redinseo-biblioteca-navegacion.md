---
tags: [lumcards, tarea, diseno]
---

# Tarea: Rediseño Etapa 1 - Biblioteca y navegación consistente con Studio

## Control

- ID: 2026-09-17-2315-antigravity-redinseo-biblioteca-navegacion
- Estado: hecha
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-17T23:31:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit base `cfd9fb6` con cambios no committeados preservados.

## Objetivo y aceptación

- Implementar la Etapa 1 del plan de coherencia visual ([[tasks/2026-09-17-2305-codex-plan-diseno-resto]]):
  1. Unificar la identidad visual de la biblioteca y navegación con la estética Studio de Jugar y aprender: paleta marfil `#f7f6f2` (claro) / `#131722` (oscuro), texto `#1d2129` / `#e8ecf5`, acento índigo `#6554df` / `#6366f1`, líneas suaves `#e5e8ee` / `#30394b`, y superficies `#ffffff` / `#1c2230`.
  2. Tipografía: títulos principales y hero en Georgia/serif editorial; datos, controles y navegación con tipografía sans-serif limpia y accesible.
  3. Sidebar y Topbar: diseño consistente con la barra lateral y herramientas de Studio (brand refinado, items de navegación con espaciado 8/12/16px, buscador accesible con foco visible y atajo Ctrl+K, perfil y estado de guardado claros).
  4. Tarjetas de mazo y carpetas: radio de 18px (`var(--card-radius)`), elevación sutil, jerarquía visual clara, títulos con expansión accesible sin recortes antiestéticos, insignias de carpetas y mazos elegantes, conteos de tarjetas pendientes/nuevas y barra de progreso discreta.
  5. Mantener intactas todas las funcionalidades existentes: Estudiar, Renombrar, Mover, Eliminar con backup, Crear mazo, Crear carpeta, Importar, atajos de teclado, estados vacío/error y responsive en 5 viewports (1366x768, 1024x650, 390x844, 844x390, 683x384 zoom 200%).
  6. Sin tocar `clean_engine.py`, motor, SQLite ni modificar cálculos estadísticos recientes.
  7. Paridad estricta entre `dist/` y `docs/`.

## Archivos y alcance

- `dist/app.css` y `docs/app.css` (capa Studio Navigation & Library)
- `dist/student.css` y `docs/student.css` (variables unificadas, radio 18px en `.deck-card`, panels focus y goal con degradado Studio)
- `tests/test_library_navigation_design.cjs` (nueva suite Chromium integral en 5 viewports)

## Checkpoint

- 2026-09-17T23:15:00-05:00: Lectura de `2026-09-17-2305-codex-plan-diseno-resto.md`. Registro de ficha de tarea e inicio de investigación de código de biblioteca y maquetación.
- 2026-09-17T23:18:00-05:00: Elaboración del plan de implementación formal en `implementation_plan.md`. Autorización recibida del usuario ("hazlo").
- 2026-09-17T23:21:00-05:00: Adición de la capa Studio a `dist/app.css` y `docs/app.css`. Detección de colisión de especificidad con `dist/student.css` (radio 14px y fondo plano lila).
- 2026-09-17T23:26:00-05:00: Refactorización quirúrgica de `dist/student.css` y `docs/student.css` para alinear tokens `:root`, radio de tarjetas (18px), degradado índigo de `focus-panel` y órbita circular perfecta en móviles.
- 2026-09-17T23:28:00-05:00: Creación y ejecución exitosa de `tests/test_library_navigation_design.cjs` con capturas de pantalla de todos los viewports en modo claro y oscuro.
- 2026-09-17T23:30:00-05:00: Ejecución completa de suites de regresión frontend y backend. Validación de paridad 0-diff entre `dist/` y `docs/`.

## Validación

- `node tests/test_library_navigation_design.cjs`: PASS en 5 viewports (`desktop`, `laptop`, `mobile`, `landscape`, `desktop_zoom_200`) sin desbordamiento horizontal (`scrollWidth === clientWidth`), cambio a tema oscuro verificado, drawer lateral accesible en móvil, y navegación dentro y fuera de carpetas validada. 12 capturas generadas en `tests/screenshots_library_navigation/`.
- `node tests/test_frontend.cjs`: PASS (plantillas, escapes, paginación, fórmulas KaTeX).
- `node tests/test_web_stats.cjs`: PASS (coherencia de rachas, estadísticas y modo sin conexión).
- `node tests/test_practice_studio.cjs`: PASS en todos los viewports (5 resoluciones probadas).
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: PASS (92 pruebas en 18.1s, OK).
- Paridad `dist/` vs `docs/`: 0 diff verificado con `git diff --no-index` en `app.css`, `student.css`, `app.js`.

## Pendiente y primer paso

- Tarea completada. Para la siguiente sesión o fase, queda disponible la **Etapa 2: Estudio y visor de tarjetas consistente con Studio** (unificar tipografía serif en títulos del visor, badges sutiles, cronómetro y atajos sin alterar la integración de audio ni el motor de intervalos).

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: ninguno.

## Cierre

- Tarea concluida con éxito.
