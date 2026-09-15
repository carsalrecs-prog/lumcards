---
tags: [lumcards, relevo]
updated: 2026-09-15
---

# Relevo actual

## Control

- Agente: Antigravity.
- Actualizado: 2026-09-15T13:17:00-05:00.
- Estado: hecha.
- Tarea: [[tasks/2026-09-15-1307-antigravity-subir-github-desplegar-vercel]].
- Entorno: `D:\CODEX`, rama `main`, commit `8e0cec5` subido a `origin/main` (`https://github.com/carsalrecs-prog/lumcards.git`). Despliegue en producción verificado en `https://lumcards.vercel.app`.

## Hecho

- Verificadas las suites de pruebas completas: 87/87 pruebas unitarias de Python y 5 suites Node/JS en verde al 100%.
- Sincronizados todos los activos web de `dist/` a `docs/` para consistencia absoluta de distribución.
- Añadida regla a `.gitignore` (`/*.dll`) para excluir copias efímeras de compilación en raíz, manteniendo las dependencias en `tools/vendor/` y `tools/desktop-build/`.
- Realizado commit y `git push origin main` a GitHub con todos los avances consolidados (motor limpio `clean_engine.py` sin AGPL, carpetas persistentes, estadísticas detalladas, suite de juegos, diseño de estudiante y PWA).
- Verificado el despliegue automático en Vercel: `https://lumcards.vercel.app` y `https://lumcards.vercel.app/practice` están actualizados y sirviendo las versiones más recientes (`app.js?v=20260915`, `student.css?v=20260914`).

## Archivos principales

- Código y web: `clean_engine.py`, `dist/`, `docs/`, `.gitignore`.
- Memoria: ficha de tarea [[tasks/2026-09-15-1307-antigravity-subir-github-desplegar-vercel]], `brain/01_CURRENT.md`, `brain/02_NEXT.md`, `brain/04_LOG.md`, este relevo.

## Validación

- Python: 87/87 pruebas pasadas en 20.1s.
- Node/JS: 5/5 suites pasadas.
- Git: `git push origin main` completado con éxito (`f5a8627..8e0cec5`).
- Vercel: petición HTTP en vivo confirmando respuesta HTTP 200 y scripts versionados `v=20260915`.
- Memoria: `tools/check-brain.ps1` verificado en estado `OK`.
- Estado de entrega: implementado, probado, confirmado en Git, subido a GitHub y publicado en Vercel.

## Pendiente

- La tarea solicitada por el usuario está 100% completada y verificada.
- Tareas futuras según backlog: pruebas de instalador/empaquetado y revisión jurídica externa.

## Primer paso

- Esperar nuevas instrucciones del usuario.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor local Lumcards en puerto 8765.
