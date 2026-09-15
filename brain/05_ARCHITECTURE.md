---
tags: [lumcards, arquitectura]
updated: 2026-09-13
---

# Arquitectura

| Área | Fuente principal | Responsabilidad |
| --- | --- | --- |
| API local | `server.py` | HTTP local, seguridad de solicitudes y archivos estáticos |
| Motor actual | `engine.py` | Colección, renderizado, planificador e interoperabilidad Anki |
| Lector parcial independiente | `clean_anki_importer.py` | Lectura limpia de algunos paquetes; no sustituye el motor |
| Importación de texto | `text_import.py` | CSV, TSV, TXT y JSON sin dependencia de Anki |
| Práctica | `practice_store.py` | Historial SQLite separado |
| Interfaz | `dist/` | Aplicación web/PWA servida localmente o publicada |
| Publicación duplicada | `docs/` | Copia estática que puede divergir de `dist/` |
| Escritorio | `tools/launcher.cs` | Ventana WebView2, inicio y bandeja de Windows |
| Instalación | `installer.ps1`, `installer.iss`, `tools/installer_gui.cs` | Copia de aplicación y accesos directos |
| Android | `android/`, `capacitor.config.json` | Contenedor Capacitor y recursos móviles |
| Nube | `firebase.json`, `firestore.rules`, `dist/sync-manager.js` | Hosting y sincronización Firebase |

## Flujo de escritorio

`Lumcards.exe` → `start.ps1 -NoBrowser` → `server.py` → `engine.py` → `data/collection.anki2`

La interfaz consume JSON por HTTP local. Esta separación facilita cambiar el motor, pero la distribución actual sigue incluyendo y enlazando el paquete AGPL.

## Datos que no se leen por defecto

- `data/collection.anki2`
- `data/collection.media/`
- `data/backups/`
- perfiles locales de WebView2

