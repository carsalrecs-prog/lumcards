---
tags: [lumcards, tarea, web, drive, backups]
---

# Tarea: Reparar listado de copias Drive y descargas web de copias

## Control

- ID: 2026-09-19-1332-antigravity-copias-drive-descargas
- Estado: hecha
- Responsable y sesión: Antigravity
- Actualizado: 2026-09-19T13:42:00-05:00
- Entorno: D:\CODEX, main, base d462d57.

## Objetivo y aceptación

1. Corregir "Ver mis copias" en Google Drive para que liste correctamente las copias subidas (soporte multipart/related v3 y consulta que busca tanto en la subcarpeta como en la raíz de copias Lumcards).
2. Reparar vista de "Copias de seguridad" (`backups`) en modo web: normalizar campos de copias (`name`, `date`, `size`), reemplazar enlaces estáticos caídos `/api/export` y `/api/backups/...` con exportación/descarga de blobs en el navegador, y permitir importación de archivos `.json` en modo web.

## Archivos y alcance

- `docs/sync-manager.js`, `dist/sync-manager.js`
- `docs/app.js`, `dist/app.js`
- Pruebas sintéticas asociadas.

## Checkpoint

- 13:35: causas raíces identificadas.
- 13:40: implementación completa de multipart/related, búsqueda en raíz/carpeta de Drive, exportación e importación JSON en modo web.
- 13:42: validación de contratos, paridad 100% y sintaxis PASS.

## Validación

- `python tests/test_scripts_syntax.py`: PASS (2.021s)
- `node tests/test_sync_manager.cjs`: PASS (todos los contratos PASS)
- `node tests/test_drive_oauth.cjs`: PASS (auth, upload, list, download PASS)
- `node tests/test_sync_initialization.cjs`: PASS
- Paridad `dist/` vs `docs/`: 100% idéntica (app.js y sync-manager.js)

## Pendiente y primer paso

- Subir a GitHub `origin/main` para despliegue en Vercel.

## Bloqueos y procesos

- Ninguno.

## Cierre

- Tarea finalizada con éxito. Se corrigió el listado de Drive y las descargas en web. Enlace a [[08_HANDOFF]].

