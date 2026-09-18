---
tags: [lumcards, tarea, despliegue]
---

# Tarea: Subir cambios a la web (GitHub y Vercel)

## Control

- ID: 2026-09-18-0105-antigravity-subir-cambios-web-vercel-github
- Estado: hecha
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-18T01:10:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit `2ca8ba3`, remoto `https://github.com/carsalrecs-prog/lumcards.git`.

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

- 2026-09-18T01:01:00-05:00: Staging completo de 39 archivos y commit `2ca8ba3` creado ("feat: rediseño integral Studio (biblioteca, estudio, modales, explorador y estadísticas), mejoras de arranque y paridad web").
- 2026-09-18T01:01:27-05:00: `git push origin main` completado con éxito a `https://github.com/carsalrecs-prog/lumcards.git` (`cfd9fb6..2ca8ba3`).
- 2026-09-18T01:02:00-05:00: Verificación en vivo en `https://lumcards.vercel.app`:
  - `student.css`: contiene reglas Studio como `dialog.dialog-deck-modal` y badges de bloque.
  - `app.css`: contiene fuentes editoriales `Georgia, serif` y variables Studio.
  - `/practice`: 200 OK con título `Jugar y aprender · Lumcards Studio`.

## Validación

- Git Push: `cfd9fb6..2ca8ba3  main -> main` (código 0).
- Vercel Live: `https://lumcards.vercel.app/` (HTTP/2 200 OK).
- Vercel Practice: `https://lumcards.vercel.app/practice` (HTTP/2 200 OK).
- Estricta paridad `dist/` vs `docs/` en todos los assets web.
- Suites de pruebas: 92 tests Python PASS, 4 suites Node/Chromium E2E PASS.

## Pendiente y primer paso

- Ninguno para esta tarea. Cambios desplegados y activos en la web.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local Lumcards en puerto 8765.

## Cierre

- Tarea concluida con éxito, reflejada en GitHub y publicada en Vercel en producción.
