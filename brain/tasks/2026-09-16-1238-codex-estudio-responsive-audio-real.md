---
tags: [lumcards, tarea, escritorio, estudio, audio, responsive]
---

# Tarea: adaptar todo el visor y reparar el audio real

## Control

- ID: 2026-09-16-1238-codex-estudio-responsive-audio-real.
- Estado: en_curso.
- Responsable y sesión: Codex, diagnóstico e implementación directa.
- Actualizado: 2026-09-16T12:38:02-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `9943bf9`; preservar los cambios UX/instalador/caché acumulados y el cambio ajeno `.obsidian/graph.json`.

## Objetivo y aceptación

- La superficie visual de la tarjeta debe cubrir ancho y alto disponibles en cualquier orientación, sin franjas claras laterales, superiores o inferiores, y conservar scroll para tarjetas largas.
- Los parlantes incrustados y el control global deben reproducir realmente el archivo y reiniciarlo en pulsaciones consecutivas dentro de WebView2.
- No aceptar una simulación como única evidencia: verificar rutas/HTTP, eventos de reproducción y el artefacto instalado, sin alterar la biblioteca.

## Archivos y alcance

- Previstos: `dist/app.js`, `docs/app.js`, pruebas UX/audio, versión de caché en HTML/SW, instalación local y memoria.
- No modificar motor, planificador, datos, nube ni contenido de tarjetas. Preservar procesos existentes salvo reinicio controlado de la ventana.

## Checkpoint

- 12:38 - La captura confirma que el ancho está resuelto pero `<main class="card">` no cubre la altura del iframe: el porcentaje mínimo no se resuelve contra un alto definido y deja visible el fondo del tema arriba/abajo. El audio continúa fallando en WebView2, por lo que se reabre el diagnóstico y se verificará el flujo real en vez de confiar solo en `FakeAudio`.

## Validación

- No ejecutada todavía.

## Pendiente y primer paso

- Inspeccionar el origen de los audios renderizados y la política de reproducción; construir una comprobación temporal que confirme carga/play en navegador real y corregir el alto con unidades del viewport seguras.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor previo en 8765 y Lumcards raíz abierto.

## Cierre

- En curso. Continuidad en [[08_HANDOFF]].
