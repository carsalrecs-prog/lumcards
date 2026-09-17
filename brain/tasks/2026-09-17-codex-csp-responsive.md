---
tags: [lumcards, tarea]
---
# Tarea: reparar runtime bloqueado y visor adaptable

## Control
- Estado: hecha.
- Responsable: Codex.
- Actualizado: 2026-09-17, America/Lima.
- Entorno: D:\CODEX, main; cambios previos de Antigravity preservados.

## Objetivo y aceptación
- Audio real repetible y superficie continua en PC, laptop y móvil.

## Archivos y alcance
- dist/app.js, nuevo runtime externo, docs equivalentes, server.py (ruta estática), pruebas y memoria. Sin cambios en biblioteca ni motor.

## Checkpoint
- Detectado: CSP HTTP script-src self prohíbe el script inline de srcdoc. La política meta no puede relajar la política heredada. Las pruebas VM no comprueban esta integración.

## Validación
- Chromium real con servidor temporal y CSP real: audio WAV decodificado y repetido; interfaz completa render(), anverso y reverso largo; 1366x768, 1024x650, 390x844 y 844x390 pasan. Captura móvil inspeccionada: superficie continua y control visible. Prueba guardada en tests/test_browser_study.cjs.
- 19 pruebas Python de servidor/práctica/instalador y suite UX Node correctas. Los intentos sin navegador instalado se resolvieron usando Chrome existente. El selector de Mostrar respuesta se adaptó al móvil, donde el atajo está oculto.

## Pendiente y primer paso
- Instalación sincronizada (cinco activos y server.py), hashes coinciden; Lumcards y servidor reiniciados ordenadamente. Runtime HTTP 200 y HTML 20260917-csp confirmados.
- Primer paso opcional de validación final: escuchar en hardware real. Chromium decodifica y reproduce; WebView2 nativo y APK no se automatizaron.

## Bloqueos y procesos
- Servidor previo en 8765. Ningún bloqueo conocido.

## Cierre
- Implementado, probado en Chromium e instalado localmente; sin commit ni publicación. [[08_HANDOFF]].
