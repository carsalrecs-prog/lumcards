---
tags: [lumcards, protocolo]
updated: 2026-09-13
---

# Protocolo de trabajo compartido

Las reglas operativas viven en [[AGENTS]]. Esta nota explica cómo aplicarlas. No concede permisos nuevos. Obsidian muestra los mismos Markdown que leen los agentes desde disco; no hace falta tenerlo abierto.

## Inicio o recuperación

1. Leer [[00_HOME]] y [[08_HANDOFF]]. Abrir la ficha enlazada que corresponda a la petición del usuario.
2. Comprobar ruta, rama, `git status --short` y los archivos relevantes. Un commit identifica una base; no prueba que los cambios locales estén guardados en Git.
3. Si la ficha dice `en_curso`, confirmar si el responsable sigue activo. Un timestamp antiguo no demuestra que haya terminado. Una petición explícita de retomar permite continuar, comprobando primero posibles procesos activos.
4. Crear una ficha con fecha, hora, agente y tema a partir de [[templates/Tarea]]. Al retomar una ficha ajena, conservar su historia y añadir nuevo responsable y checkpoint; no eliminar evidencias anteriores.
5. Registrar archivos previstos y una acción concreta siguiente antes de editar. No leer todas las fichas ni todo el registro.

## Checkpoint durante el trabajo

Guardar después de un hito y aproximadamente cada 10 minutos en trabajos largos: qué cambió, archivos, prueba realizada, problema actual y próximo comando o acción. Actualizar primero la ficha; luego enlazarla desde el relevo si cambió el trabajo activo.

Antes de una operación larga registrar comando, directorio y posible resultado pendiente. Al volver, comprobar su salida antes de relanzarla. Un ID de proceso/sesión es una pista que debe verificarse; puede no existir en otra herramienta.

## Poco contexto, cuota o interrupción

Con un aviso de límite, o cerca del 20% disponible si la herramienta lo muestra, priorizar guardar. No esperar al último mensaje. No existe aquí un detector universal de tokens ni se garantiza un cierre si el proceso termina abruptamente.

Dejar `lista_para_relevo` con:

- Hecho y evidencia; cambios sin validar claramente separados.
- Archivos modificados y cambios preexistentes que hay que preservar.
- Último error resumido y enfoques descartados con su motivo.
- Primer paso ejecutable, directorio y resultado esperado.
- Procesos activos, bloqueos y decisiones que requieren al usuario.

Si el usuario pide detener inmediatamente, respetarlo; guardar un resumen solo si su petición permite esa acción. El sucesor recupera el último checkpoint y revisa el diff, sin suponer que representa todos los cambios posteriores.

## Cierre

1. Completar la ficha con resultado y pruebas reales. `hecha` exige criterios de aceptación comprobados; una prueba pendiente mantiene la tarea incompleta.
2. Actualizar [[01_CURRENT]], [[02_NEXT]], [[03_DECISIONS]] y [[04_LOG]] solo cuando corresponda.
3. Actualizar [[08_HANDOFF]] con un resumen corto y enlace a la ficha. Antes de reemplazar un relevo, comprobar que sus pendientes siguen representados en su ficha o en el backlog.
4. Ejecutar `tools/check-brain.ps1`. Añadir a la respuesta final el resultado, límite relevante y enlace al relevo.

## Concurrencia y conservación

Una ficha por tarea evita mezclar trabajo. Los agentes no deben editar los mismos archivos simultáneamente sin coordinación explícita. Si trabajan en copias distintas del repositorio, necesitan intercambiar los Markdown y cambios de código antes del relevo; Obsidian local no los sincroniza por sí solo.

Mantener el relevo por debajo de 5.000 caracteres. Conservar en [[04_LOG]] como máximo unas 20 entradas recientes; mover las anteriores a `brain/archive/` por mes conservando enlaces. Las fichas terminadas permanecen consultables sin cargarse al inicio. Los archivos versionados en Git aportan historial solo después de confirmar sus cambios; no hacer commits, publicaciones o limpiezas ajenas a la petición por seguir este protocolo.
