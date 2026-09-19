---
tags: [lumcards, tarea]
---

# Tarea: Resolver Firebase auth/internal-error mediante Google Identity Services y signInWithCredential

## Control

- ID: 2026-09-19-1430-antigravity-firebase-auth-gis-fallback
- Estado: hecha
- Responsable y sesión: Antigravity (Conversation 6407fd10-7976-4c13-9dc7-fdbe3731fccc)
- Actualizado: 2026-09-19T14:30:00-05:00
- Entorno: D:\CODEX, rama main, commit base b309af4, cambios listos para commit y push.

## Objetivo y aceptación

- Resolver el error `Firebase: Error (auth/internal-error)` en la app web alojada en Vercel (`lumcards.vercel.app`) durante el inicio de sesión con Google.
- Implementar Google Identity Services directo (`oauth.initTokenClient` con `requestAccessToken`) conectado a Firebase Auth mediante `firebase.auth.GoogleAuthProvider.credential(null, token)` y `auth.signInWithCredential(credential)`.
- Eliminar la dependencia de cookies de terceros y almacenamiento entre orígenes que bloquea el popup tradicional entre `lumcards.vercel.app` y `lumcards.firebaseapp.com`.
- Preservar `signInWithPopup` como fallback con mensaje claro si el navegador bloquea cookies.
- Incrementar versión de caché a `r8` en `sw.js` e `index.html`.

## Archivos y alcance

- Modificados con paridad estricta docs/dist:
  - `docs/sync-manager.js` y `dist/sync-manager.js`
  - `docs/index.html` y `dist/index.html`
  - `docs/sw.js` y `dist/sw.js`
  - `brain/tasks/2026-09-19-1430-antigravity-firebase-auth-gis-fallback.md`
  - `brain/08_HANDOFF.md`
  - `brain/04_LOG.md`

## Checkpoint

- 14:30: Diagnóstico confirmado: dominios y proveedor en consola Firebase están correctos, pero `auth/internal-error` es lanzado por bloqueo de almacenamiento entre orígenes de Chrome/Edge/Brave entre Vercel y Firebase. Implementado flujo directo con Google Identity Services y `signInWithCredential`. Pruebas npm y check-brain pasan con éxito.

## Validación

- `npm test`: PASS (Quizlet games + SyncManager tri-storage).
- `node tests/test_drive_oauth.cjs`: PASS (Contrato GIS y token client).
- `git diff --no-index docs/sync-manager.js dist/sync-manager.js`: 0 diferencias (paridad total).
- `git diff --no-index docs/index.html dist/index.html`: 0 diferencias.
- `git diff --no-index docs/sw.js dist/sw.js`: 0 diferencias.
- `tools/check-brain.ps1`: Status OK.

## Pendiente y primer paso

- Hacer commit y git push a `origin/main` para que Vercel reconstruya el sitio en producción.
- Indicar al usuario que refresque `https://lumcards.vercel.app` y pulse "Continuar con mi cuenta de Google".

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: ninguno.

## Cierre

- Implementado y validado en docs/dist. Enlace a [[08_HANDOFF]].
