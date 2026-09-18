---
tags: [lumcards, tarea, escritorio]
---

# Tarea: Diagnóstico y robustez del arranque de escritorio y servidor local

## Control

- ID: 2026-09-18-0050-antigravity-diagnostico-arranque-escritorio
- Estado: hecha
- Responsable y sesión: Antigravity (conversación 3b86c16f-6c8d-460a-8ae5-229dc2a66f94)
- Actualizado: 2026-09-18T00:52:00-05:00
- Entorno: `D:\CODEX`, rama `main`, commit base `cfd9fb6` con etapas 1, 2 y 3 completadas y preservadas.

## Objetivo y aceptación

- Diagnosticar el error reportado por el usuario en captura de `Lumcards.exe`: *"No se pudo iniciar la biblioteca. Revisa data\server-error.log en la carpeta de la aplicación."* con botón *"Volver a intentar"*.
- Identificar la causa raíz en `data/server-error.log`, `server.py`, `start.ps1` y `launcher.cs`.
- Indicar al usuario cómo desbloquear la pantalla actual y aplicar mejoras de robustez para evitar conflictos de puerto y falsos errores de arranque.

## Archivos y alcance

- `data/server-error.log` y `data/server.log` (inspeccionados)
- `start.ps1` (verificación de salud redundante antes de declarar fallo de proceso si el puerto ya estaba tomado por una instancia sana)
- `server.py` (optimización de `valid_host` para localhost sin roundtrip innecesario de red por UDP a 8.8.8.8)
- `tools/launcher.cs` (verificación de salud antes de lanzar excepción si el proceso auxiliar reporta salida; timeout de sonda elevado a 2500ms)

## Checkpoint

- 2026-09-18T00:45:00-05:00: Causa raíz identificada: `data\server-error.log` registró `OSError: [WinError 10048] Solo se permite un uso de cada dirección de socket` porque una segunda invocación de `server.py` intentó enlazar el puerto 8765 mientras la primera instancia (PID 23168) ya estaba activa y escuchando. `start.ps1` consideró que el proceso había muerto (`$ankiProcess.HasExited`) y arrojó excepción a `Lumcards.exe`, bloqueando la ventana en la pantalla de reintento.
- 2026-09-18T00:50:00-05:00: Mitigaciones aplicadas:
  1. `server.py`: `valid_host()` acepta de inmediato `127.0.0.1`, `localhost` y `0.0.0.0` sin invocar `get_local_ip()` (que abría un socket UDP a `8.8.8.8:80`).
  2. `start.ps1`: ante `$ankiProcess.HasExited`, realiza una comprobación final de salud contra `/api/health`. Si ya existe una instancia viva respondiendo en el puerto, sale con `exit 0` en lugar de lanzar excepción.
  3. `tools/launcher.cs`: antes de lanzar `InvalidOperationException`, verifica `IsHealthyAsync()`. Si la biblioteca ya está sana, continúa la inicialización en lugar de mostrar la pantalla de error.
  4. `tools/build-desktop.ps1 -StageOnly`: compilación de escritorio exitosa sin errores.
  5. 92 pruebas unitarias de backend ejecutadas y en verde (17.8s).

## Validación

- `curl.exe http://127.0.0.1:8765/api/health`: 200 OK (`app: lumcards`, `ok: true`).
- `curl.exe http://127.0.0.1:8765/api/state`: 200 OK (3.972 tarjetas, racha 4 días, estadísticas completas).
- `data/collection.anki2`: intacto, sin corrupción ni pérdida de datos.
- `tools/build-desktop.ps1 -StageOnly`: PASS (binarios compilados en `tools/desktop-build`).
- `.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: PASS (92 pruebas en 17.8s).

## Pendiente y primer paso

- Informar al usuario:
  1. Hacer clic en "Volver a intentar" en la ventana de Lumcards (o cerrarla y abrirla normalmente); la biblioteca se abrirá de inmediato.
  2. Explicar la causa raíz y las salvaguardas implementadas.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: `python.exe` PID 23168 (servidor local en puerto 8765), `Lumcards.exe` PID 13612 (ventana nativa en pantalla).

## Cierre

- Diagnóstico y mejoras de robustez completadas. Tarea marcada como `hecha`.
