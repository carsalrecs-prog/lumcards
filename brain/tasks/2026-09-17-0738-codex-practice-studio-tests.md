---
tags: [lumcards, tarea]
---

# Tarea: validación aislada del rediseño de juegos

## Control
- ID: 2026-09-17-0738-codex-practice-studio-tests
- Estado: en_curso
- Responsable y sesión: Codex, subagente studio_final_validation retoma pruebas de practice_design_tests por delegación del coordinador; coordinador integra notas globales.
- Actualizado: 2026-09-17T13:38:00-05:00
- Entorno: D:\CODEX, main/base 9943bf9 según relevo; git status revisado. Cambios ajenos preservados.

## Objetivo y aceptación
- Crear E2E del nuevo Jugar y aprender en Chromium real, cuatro tamaños y viewport efectivo de zoom 200%, ambos temas, navegación por teclado, movimiento reducido y regresión de sesiones/audio.
- Servidor temporal y datos exclusivamente sintéticos; no leer ni escribir biblioteca de usuario.

## Archivos y alcance
- Solo tests/test_practice_studio.cjs, tests/screenshots_practice_studio/ y esta ficha.
- Aplicación y memoria común propiedad del coordinador; no editar esos archivos.

## Checkpoint
- 07:38: protocolo, relevo, ficha principal y pruebas relacionadas leídas; API/acciones existentes verificadas. Preparación de prueba, UI del coordinador aún en curso.
- 07:42: test guardado; backend aislado con puerto libre, datos sintéticos y limpieza limitada al directorio temporal creado. Prevé 24 capturas, temas, cuatro tamaños, seis modos, teclado/foco, importador/historial, movimiento reducido y replay de WAV decodificado por audio nativo.
- 13:38: relevo explícito al subagente studio_final_validation. UI consolidada por coordinador en practice.css; se añade comprobación de carga efectiva de HTML/CSS/JS locales críticos, sin HTTP 400+ ni requests fallidas. Siguiente comando: node tests/test_practice_studio.cjs; resultado todavía pendiente.
- 13:41: primer E2E final FAIL en desktop por 4 transiciones activas bajo reduced-motion. Coordinador corrigió especificidad del selector; pendiente nueva ejecución. Dos reintentos antes de esa corrección abortaron al iniciar colección sintética por UNIQUE notes.id en _seed; diagnóstico y corrección mínima del motor a cargo del coordinador. No se aplica workaround ni se toca biblioteca real. Captura desktop oscura de esta ejecución inspeccionada: contenido/jerarquía/ilustraciones legibles y sin recorte. Móvil de 07:47 solo referencia histórica, todavía no evidencia final.

## Validación
- node --check tests/test_practice_studio.cjs: PASS (07:42).
- node tests/test_practice_studio.cjs (13:38): FAIL por movimiento reducido; dos reintentos posteriores FAIL antes de UI por colisión notes.id al crear demos. Sin conclusión final hasta repetir contra correcciones del coordinador.

## Pendiente y primer paso
- Ejecutar node tests/test_practice_studio.cjs cuando coordinador confirme corregido el bloqueo de IDs; reinspeccionar móvil y desktop oscuro recién generados.

## Bloqueos y procesos
- Exec sandbox falla; ejecución revisada restaurada. Cada servidor de prueba terminó con su finally; sin procesos propios activos. IDs de nuevas notas bloquean reintento útil hasta corrección del coordinador.

## Cierre
- En curso; coordinador actualizará [[08_HANDOFF]] y [[tasks/2026-09-17-0720-codex-redisenar-juegos]].
