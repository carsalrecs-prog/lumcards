---
tags: [lumcards, tarea]
---

# Tarea: implementar diseño de Jugar y aprender

## Control
- ID: 2026-09-17-0720-codex-redisenar-juegos
- Estado: en_curso
- Responsable y sesión: Codex, implementación autorizada por el usuario; subagente de pruebas en archivos independientes.
- Actualizado: 2026-09-17T07:20:00-05:00
- Entorno: D:\CODEX, main/base 9943bf9; git status revisado y cambios previos preservados.

## Objetivo y aceptación
- Aplicar [[tasks/2026-09-17-0715-codex-direccion-visual]] a Jugar y aprender: composición cuidada, controles claros, ilustraciones nativas ligeras, movimiento moderado y responsive real, sin cambiar lógica del motor.
- Conservar modos existentes, jerarquía de carpetas, importador, audio, resultados, offline y progreso. Probar tamaños desktop/móvil, teclado, temas y movimiento reducido. Nada de biblioteca real en pruebas.

## Archivos y alcance
- Previstos: dist/practice.html, practice.js, practice.css y nuevo stylesheet scoped si conviene; espejos docs, index/sw versión caché; tests de diseño y notas globales. Posible sincronización instalada de activos propios, nunca datos.
- Subagente: solo pruebas nuevas y su ficha; Codex integra memoria común. No modificar código backend, logo, cobros, juegos nuevos ni publicar.

## Checkpoint
- 07:20: reglas, relevo, ficha diseño y git status leídos. Antigravity dejó entrega para revisión; user elige Codex ejecutor. Sandbox normal falla, ejecución revisada disponible. Antes de cada edición verificar estado de archivos que coincidan con cambios ajenos.
- 07:47: estructura real implementada en practice.html/js y nuevo practice-studio.css; ruta CSS registrada en server.py sin cambios de motor. Tema claro/oscuro, selección compacta nativa, 3 modos primarios + 3 secundarios y decoraciones CSS. Sesión oculta sidebar. Confeti acotado/cancelable y reduced-motion; no autoplay nuevo.
- Suite nueva del subagente reporta PASS en cuatro viewports con audio WAV real; pendiente inspección visual y regresiones previas. No instalado todavía. Inicio se demoró por revisión de permisos sin cuota, recuperada tras petición de continuar.

## Validación
- 13:41 reanudación: estilos consolidados al final de practice.css; retirados duplicados propios practice-studio.css de dist/docs y revertida ruta extra de server.py. No requiere reiniciar backend activo. Espejos docs actualizados; caché 20260917-practice-folders-studio.
- node --check dist/practice.js, test_ux_study_audio.cjs y test_practice_folder_selection.cjs PASS en primer hito. test_import_menus_verify.cjs PASS tras consolidación (formularios, eliminación sintética con backup, preview y scroll).
- Revalidación nueva en curso: detectó transition de studio-mode no suprimida por reduced-motion; selector específico corregido, pendiente repetir.
- Suite Python: 82 ejecutadas, 26 errores por UNIQUE notes.id durante seed y 1 fallo por literal de versión de assets desactualizado. Literal actualizado; diagnóstico independiente del motor en curso. test_study_blocks_and_preview.cjs no pudo arrancar por mismo UNIQUE. No afirmar suite global verde.

## Pendiente y primer paso
- Repetir E2E visual/reduced-motion; resolver o documentar colisión de IDs que bloquea pruebas; luego verificar activos instalados y cerrar memoria.

## Bloqueos y procesos
- Ninguno para implementar con ejecución revisada. No servidor de usuario iniciado/detenido; otros procesos no verificados.

## Cierre
- En curso. [[08_HANDOFF]].
