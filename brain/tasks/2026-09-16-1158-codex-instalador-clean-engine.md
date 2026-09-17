---
tags: [lumcards, tarea, escritorio, instalador, motor]
---

# Tarea: reparar instalación que omite el motor limpio

## Control

- ID: 2026-09-16-1158-codex-instalador-clean-engine.
- Estado: hecha.
- Responsable y sesión: Codex, diagnóstico y corrección local.
- Actualizado: 2026-09-16T12:06:00-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `9943bf9`; preservar la implementación UX sin confirmar y el cambio ajeno de `.obsidian/graph.json`.

## Objetivo y aceptación

- Corregir el fallo de inicio de la instalación Windows causado porque el paquete incluye `engine.py` pero omite su dependencia local `clean_engine.py`.
- Los instaladores PowerShell y gráfico deben copiar el motor limpio y rechazar un paquete de origen que no lo contenga.
- Una prueba automatizada debe cubrir el contenido mínimo del paquete.
- Reparar la instalación local existente sin reemplazar ni leer la biblioteca del usuario, y validar el servidor instalado con un directorio de datos temporal y un puerto alternativo.

## Archivos y alcance

- Previstos: `installer.ps1`, `tools/installer_gui.cs`, una prueba de contrato del instalador, binario del instalador si se recompila, esta ficha y notas de relevo.
- Reparación fuera del repositorio: copiar `clean_engine.py` y los componentes actualizados del instalador a la carpeta de programa instalada; no modificar su carpeta `data/`.
- Ajenos que se preservan: cambios UX existentes, `.obsidian/graph.json` y servidor de desarrollo activo en 8765.

## Checkpoint

- 11:58 - Diagnóstico confirmado en el registro de la instalación: `engine.py` falla al importar `clean_engine`. El archivo falta en la carpeta instalada y también en las listas de carga de `installer.ps1` y `tools/installer_gui.cs`. El servidor de desarrollo existente en 8765 responde saludable y no será detenido. Siguiente: corregir ambos contratos de empaquetado y añadir prueba.
- 12:00 - `clean_engine.py` añadido a las listas de copia y archivos obligatorios de ambos instaladores. Creada `tests/test_installer_payload.py` con dos pruebas de contrato; ambas pasan y el código C# del instalador compila.
- 12:02 - Instalador gráfico reconstruido. La instalación local fue reparada copiando solo el módulo faltante y los componentes actualizados del instalador; no se modificó su biblioteca. Importación de `engine` y `/api/health` del servidor instalado verificadas con datos temporales y puerto alternativo.
- 12:06 - Suite completa ampliada a 89 pruebas Python, todas en verde. `git diff --check` correcto. El servidor previo en 8765 se conservó sin intervención.

## Validación

- `\.venv\Scripts\python.exe -m unittest tests.test_installer_payload -v`: 2/2 correctas.
- Compilación aislada de `tools/installer_gui.cs` con `csc.exe`: correcta.
- `tools/build-desktop.ps1`: correcto; `Instalador Lumcards.exe` reconstruido localmente.
- Instalación local: `import engine` correcto y `/api/health` devuelve `ok` usando directorio de datos temporal y puerto alternativo.
- `\.venv\Scripts\python.exe -m unittest discover -s tests -v`: 89/89 correctas.
- `git diff --check`: correcto, solo avisos de conversión LF/CRLF.
- Límite: no se volvió a abrir visualmente la ventana instalada; su servidor y dependencia de arranque sí se validaron de extremo a extremo sin usar la biblioteca real.

## Pendiente y primer paso

- Ningún pendiente funcional de esta corrección. El usuario puede pulsar `Volver a intentar` o reabrir Lumcards.
- Los cambios del repositorio siguen sin commit, `push` ni publicación.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor de desarrollo previo en 8765 y ventana instalada de Lumcards; el servidor temporal de validación fue cerrado.

## Cierre

- Corregido, instalado y probado localmente. No committeado ni publicado. Continuidad en [[08_HANDOFF]].
