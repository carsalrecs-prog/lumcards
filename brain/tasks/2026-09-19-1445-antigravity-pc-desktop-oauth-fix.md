---
tags: [lumcards, tarea]
---

# Tarea: Permitir inicio de sesión Google/Firebase en el aplicativo de escritorio de PC (WebView2)

## Control

- ID: 2026-09-19-1445-antigravity-pc-desktop-oauth-fix
- Estado: hecha
- Responsable y sesión: Antigravity (Conversation 6407fd10-7976-4c13-9dc7-fdbe3731fccc)
- Actualizado: 2026-09-19T14:45:00-05:00
- Entorno: D:\CODEX, rama main, commit base d30cc3b.

## Objetivo y aceptación

- Resolver el fallo de autenticación en la aplicación de escritorio de Windows (`Lumcards.exe`):
  1. Content-Security-Policy en `server.py` ampliado para permitir `https://lumcards.firebaseapp.com` y `https://*.firebaseio.com` en `frame-src` y `connect-src`.
  2. Ajustado `NewWindowRequested` en `tools/launcher.cs` para permitir que WebView2 gestione ventanas emergentes de autenticación OAuth (`https://accounts.google.com` y `https://lumcards.firebaseapp.com`) como ventanas hijas nativas de WebView2 sin cancelarlas ni forzarlas al navegador externo.
  3. Recompilado en `tools/desktop-build/Lumcards.exe`.
  4. Documentar al usuario los orígenes de loopback (`127.0.0.1` y `localhost`) necesarios en Firebase y Google Cloud Console.

## Archivos y alcance

- `server.py`
- `tools/launcher.cs`
- `tools/desktop-build/Lumcards.exe`
- Notas en `brain/`

## Checkpoint

- 14:50: Cambios en CSP de `server.py` y eventos de ventana en `tools/launcher.cs` aplicados y validados con `test_scripts_syntax.py` y `test_installer_payload.py`.

## Validación

- `tools/build-desktop.ps1`: compilación limpia en `tools/desktop-build/Lumcards.exe`.
- `python -m unittest tests/test_scripts_syntax.py`: PASS.
- `python -m unittest tests/test_installer_payload.py`: PASS.
- `tools/check-brain.ps1`: Status OK.

## Pendiente y primer paso

- Informar al usuario que cierre `Lumcards.exe` en su PC y añada `127.0.0.1` a los Dominios Autorizados de Firebase Console si desea sincronizar desde la app de escritorio.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: `Lumcards.exe` actualmente abierto por el usuario.

## Cierre

- Implementado y validado. Enlace a [[08_HANDOFF]].
