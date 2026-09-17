---
tags: [lumcards, tarea]
---

# Tarea: diagnosticar colisión de IDs al iniciar biblioteca sintética

## Control
- ID: 2026-09-17-1340-codex-engine-seed-diagnosis
- Estado: lista_para_relevo
- Responsable y sesión: Codex, subagente engine_seed_diagnosis; ejecutor principal integra el relevo común.
- Actualizado: 2026-09-17T13:46:00-05:00
- Entorno: D:\CODEX, main/base 9943bf9; cambios de motor preexistentes preservados.

## Objetivo y aceptación
- Diagnóstico de errores UNIQUE notes.id en regresiones del rediseño; confirmar causa, reproducción aislada y origen previo. No modificar el motor.

## Archivos y alcance
- Solo esta ficha. Lectura acotada de clean_engine.py, diff y pruebas del motor. Toda ejecución con biblioteca temporal sintética, sin leer data/ del usuario.

## Checkpoint
- 13:40: CleanNote asigna ID por milisegundo y add_note lo inserta sin comprobar unicidad; las tarjetas también usan milisegundo más ordinal. Ambos patrones existen en HEAD, fuera del diff actual.
- 13:44: reproducción determinista en módulo de trabajo y módulo cargado desde HEAD 9943bf9: reloj congelado produce UNIQUE notes.id durante seed; variando solo IDs de notas produce UNIQUE cards.id. No se ha modificado código de aplicación.
- 13:45: tras el fallo de seed, cerrar/reabrir la biblioteca temporal conserva solo 1 nota y 1 tarjeta; fresh depende de existencia del archivo y no reintenta completar las demos. No hay evidencia de pérdida de biblioteca preexistente; sí creación parcial e interrupciones de altas rápidas.

## Validación
- Python de .venv, script de diagnóstico por stdin, mock de time.time con valor fijo: working y HEAD fallan de forma idéntica con UNIQUE notes.id. Cada biblioteca es temporal sintética y se limpia al finalizar.
- Segunda prueba, seed omitido solo en el fixture y dos notas con IDs explícitamente distintos: working y HEAD fallan de forma idéntica con UNIQUE cards.id.
- Tercera prueba: reapertura de seed parcial confirma 1 nota/1 tarjeta. Ningún archivo de data/ real fue leído.
- Los números totales 82/97 de suites históricas no se han atribuido: errores en setUpClass pueden reducir el número de casos ejecutados, pero no se verificó aquí ese desglose.
- tools/check-brain.ps1: OK (36 notas, 123 enlaces, 21 fichas), ejecutado al cerrar diagnóstico; el principal integra resultado global.

## Pendiente y primer paso
- Prioridad alta independiente del rediseño: asignar IDs libres en CleanCollection.add_note antes del INSERT notes y de cada INSERT cards; aplicar la misma garantía al INSERT cards de update_note para cloze.
- Primer cambio exacto propuesto: helper interno restringido a tablas notes/cards para elegir max(candidato, MAX(id)+1) o incrementar candidato mientras exista, llamado en el punto de inserción. Ajustar note.id al valor insertado para preservar enlaces. El motor actual impone un solo hilo; no prometer soporte multiwriter sin transacciones/estrategia adicional.
- No basta corregir CleanNote.__init__: dos notas pueden construirse antes de guardar. No usar sleep, INSERT OR REPLACE ni ignorar excepciones: podrían esconder pérdida o truncamiento.
- Regresiones requeridas: seed completo con reloj fijo; altas masivas en el mismo ms; reloj que retrocede; notas creadas antes de insertar; plantillas con varias tarjetas; ampliación de cloze; IDs existentes conservados, relaciones notes/cards y conteos tras reapertura. Luego repetir toda la suite y E2E bloqueados.
- Considerar transacción para alta nota+tarjetas/seed en tarea del motor: close() hace commit y podría persistir una nota huérfana si falla una inserción posterior. No ampliar esta tarea sin autorización.

## Bloqueos y procesos
- Ninguno. No servidores ni procesos persistentes iniciados.

## Cierre
- Diagnóstico terminado, corrección no implementada ni instalada. El principal pidió explícitamente no modificar backend dentro del rediseño; integra este bloqueo conocido en [[08_HANDOFF]] y prioridades. Archivo modificado: solo esta ficha.
