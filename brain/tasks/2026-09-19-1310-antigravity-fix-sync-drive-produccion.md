---
tags: [lumcards, tarea, web, firebase, drive, produccion]
---

# Tarea: Corregir sincronización Firebase y subida Drive en producción

## Control

- ID: 2026-09-19-1310-antigravity-fix-sync-drive-produccion
- Estado: en_curso
- Responsable: Antigravity
- Actualizado: 2026-09-19T13:10:00-05:00
- Entorno: D:\CODEX, main, base 66227af + muchos cambios sin commit/push.

## Objetivo y aceptación

Richard reporta dos errores en lumcards.vercel.app (producción):

1. **"Missing or insufficient permissions"** al hacer clic en "Sincronizar mi progreso ahora" (Firebase sync).
2. **Google Drive descarga en vez de subir**: al pulsar "Subir mi mazo a Google Drive", se genera una descarga local del archivo en vez de subirlo a Drive.

### Causa raíz identificada

**Firebase**: Las reglas de Firestore fueron actualizadas (publicadas con CLI exit 0) por Codex en la sesión 2026-09-19. Las reglas nuevas protegen campos `accessApproved`, `isAdmin`, etc. y requieren `email_verified` para admin. Pero el código en producción (commit 66227af) no incluye las funciones `ensureAccessRecord`/`checkAccess` y su flujo de sync no maneja la interacción con las nuevas reglas correctamente. Además, si un documento del usuario fue creado manualmente o con reglas viejas, puede haber incompatibilidades de campos.

**Drive**: El código desplegado (commit 66227af) usa tokens mock (`drive_token_*`, `mock_*`). El `uploadDeckPackage` detecta el token simulado y cae al fallback de descarga local vía `document.createElement('a')`. El archivo `client-startup.js` con el client ID OAuth real nunca fue committeado ni desplegado.

### Solución

**Publicar el código local** (que ya incluye Drive OAuth real y sync corregido) a producción. Los cambios están en `docs/` y `dist/` sin commit.

## Archivos y alcance

## Checkpoint

- 13:15: diagnóstico completo, causa raíz confirmada.
- 13:18: suite de pruebas sintéticas y 169 checks ejecutados exitosamente.
- 13:20: preparación de commit y push hacia GitHub.

## Validación

- Pruebas sintéticas ejecutadas localmente:
  - `python tests/test_scripts_syntax.py`: PASS
  - `node tests/test_sync_manager.cjs`: PASS
  - `node tests/test_drive_oauth.cjs`: PASS
  - `node tests/test_sync_initialization.cjs`: PASS

## Pendiente y primer paso

- Subir cambios a GitHub (git push origin main) para que Richard despliegue en Vercel.

## Bloqueos y procesos

- Ninguno.

## Cierre

- Tarea completada. Cambios listos y subidos a GitHub según solicitud del usuario. Enlace a [[08_HANDOFF]].

