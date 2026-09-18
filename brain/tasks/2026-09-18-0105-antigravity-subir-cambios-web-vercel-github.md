---
tags: [lumcards, tarea, despliegue]
---

# Tarea: Subir cambios a la web (GitHub y Vercel)

## Control

- ID: 2026-09-18-0105-antigravity-subir-cambios-web-vercel-github
- Estado: en_curso
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-18T01:05:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit base `cfd9fb6`, remoto `https://github.com/carsalrecs-prog/lumcards.git`.

## Objetivo y aceptación

- Petición del usuario: "¿puedes subir los cambios a la web?".
- Subir a GitHub (`origin/main`) todos los cambios consolidados:
  1. Rediseño integral Studio (Etapa 1: Biblioteca y navegación, Etapa 2: Estudio y visor de tarjetas, Etapa 3: Modales, explorador y estadísticas).
  2. Ajustes de Jugar y aprender de Codex.
  3. Mejoras de coherencia de estadísticas web y modo offline.
  4. Robustez de arranque del servidor local y launcher.
  5. Nuevas suites de pruebas E2E en Chromium.
- Verificar que `dist/` y `docs/` mantengan estricta paridad.
- Verificar que el despliegue en Vercel (`https://lumcards.vercel.app`) se actualice con los nuevos estilos y assets.

## Archivos y alcance

- `dist/*` y `docs/*` (activos web)
- `server.py`, `start.ps1`, `tools/launcher.cs` (backend y escritorio)
- `tests/*` (nuevas suites y suites actualizadas)
- `brain/*` (memoria compartida del vault)

## Checkpoint

- 2026-09-18T01:05:00-05:00: Preparación de commit y verificación de árbol de trabajo.

## Validación

- No ejecutada aún.

## Pendiente y primer paso

- Ejecutar `git add`, `git commit` y `git push origin main`.
- Verificar la URL de Vercel (`https://lumcards.vercel.app`) y GitHub.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local Lumcards en puerto 8765.

## Cierre

- En curso.
