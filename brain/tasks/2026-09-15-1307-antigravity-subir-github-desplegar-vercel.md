---
tags: [lumcards, tarea, despliegue]
---

# Tarea: Subir cambios a GitHub y reflejar en Vercel

## Control

- ID: 2026-09-15-1307-antigravity-subir-github-desplegar-vercel.
- Estado: en_curso.
- Responsable y sesión: Antigravity (sesión 14a4c3aa-41b2-4dd5-a483-1a16d302fc8a).
- Actualizado: 2026-09-15T13:07:00-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `f5a8627`.

## Objetivo y aceptación

- Petición del usuario: "porfavor lo que tenemos ya hecho subelo a github y que ya se refleje en vercel".
- Subir a GitHub (`origin/main`) todos los avances consolidados del proyecto (motor independiente `clean_engine.py`, compatibilidad Anki sin AGPL, diseño de estudio y juegos, carpetas, progreso, scripts e instaladores de escritorio, PWA y sincronización con `docs/`).
- Vincular y reflejar el despliegue en Vercel para que esté en producción y se actualice automáticamente en cada push.

## Archivos y alcance

- Código fuente, pruebas, documentación, memoria del vault, scripts de inicio/instalación y archivos web en `dist/` y `docs/`.
- Ignorar binarios temporales sueltos en raíz (`/*.dll`), preservando los SDKs bajo `tools/vendor/` y `tools/desktop-build/`.
- Memoria afectada: esta ficha de tarea, `brain/08_HANDOFF.md`, `brain/01_CURRENT.md`, `brain/02_NEXT.md`, `brain/04_LOG.md`.

## Checkpoint

- 13:07: Ejecución completa de suites de prueba (Python 87/87 en verde, suites Node/JS 100% en verde).
- 13:07: Sincronización completa de `dist/` hacia `docs/` para garantizar consistencia entre publicación estática y PWA.
- 13:07: `.gitignore` actualizado para ignorar DLLs efímeras de compilación en raíz.

## Validación

- Pruebas unitarias Python: 87/87 pasadas.
- Pruebas JS/Node: 5 suites pasadas.
- `git status` auditado.

## Pendiente y primer paso

- Crear commit con los cambios consolidados y hacer `git push origin main`.
- Conectar o verificar el proyecto en Vercel mediante MCP o Git Integration para reflejar la última versión.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local en puerto 8765.

## Cierre

- Pendiente de commit, push y verificación en Vercel.
