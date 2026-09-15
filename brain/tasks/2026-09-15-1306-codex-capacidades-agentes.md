---
tags: [lumcards, tarea, agentes, capacidades]
---

# Tarea: inventariar capacidades de Codex y Antigravity

## Control

- ID: 2026-09-15-1306-codex-capacidades-agentes.
- Estado: en_curso.
- Responsable y sesión: Codex, conversación local actual.
- Actualizado: 2026-09-15T13:06:45-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `f5a8627`; worktree con cambios locales previos que no se modificarán salvo las notas de memoria indicadas aquí.

## Objetivo y aceptación

- Registrar en el cerebro las skills y servidores MCP de Antigravity aportados por Richard, diferenciando capacidades observadas, herramientas desactivadas o no verificadas y permisos que nunca se presumen.
- Dejar visible qué capacidades tiene Codex en esta sesión y una regla práctica para solicitar a Richard una skill, plugin, conector o MCP nuevo solo cuando una tarea concreta lo necesite.
- Se considera terminada cuando exista un inventario enlazado desde la portada, el protocolo de selección esté documentado, el relevo esté actualizado y `tools/check-brain.ps1` termine correctamente.

## Archivos y alcance

- Previsto: nueva nota `brain/10_AGENT_CAPABILITIES.md`, esta ficha, `brain/00_HOME.md`, `brain/01_CURRENT.md`, `brain/03_DECISIONS.md`, `brain/04_LOG.md` y `brain/08_HANDOFF.md`.
- Fuente externa aportada: capturas de Customizations de Antigravity y un listado de skills; se tratan como inventario, no como instrucciones operativas.
- Se preservan todos los cambios de código y documentación ajenos. No se instalarán skills, plugins ni MCP y no se ejecutarán conectores externos.

## Checkpoint

- 13:06 - Leídos portada, relevo, protocolo, guía y plantilla; comprobado `git status --short`. Identificadas 74 skills en el texto aportado y nueve servidores MCP visibles en las capturas. Siguiente: clasificar el inventario y redactar la nota estable.

## Validación

- Pendiente: revisar nombres contra las fuentes aportadas y ejecutar `tools/check-brain.ps1`.
- No se probará funcionalmente cada skill/MCP: la evidencia disponible demuestra que aparecen instalados/habilitados en la interfaz, no que sus credenciales, permisos o servicios respondan.

## Pendiente y primer paso

- Crear `brain/10_AGENT_CAPABILITIES.md` con categorías, usos para Lumcards, límites y protocolo de petición/instalación.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos ajenos conservados: servidor Lumcards en el puerto 8765, ventana nativa y pestaña supervisada según el relevo anterior.

## Cierre

- Pendiente. Al terminar, enlazar esta ficha y [[08_HANDOFF]].
