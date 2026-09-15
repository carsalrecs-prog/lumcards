---
tags: [lumcards, guia]
updated: 2026-09-13
---

# Cómo usar este cerebro

## Para Richard

Abre el vault `D:\CODEX` en Obsidian y empieza en [[00_HOME]]. [[08_HANDOFF]] responde qué acaba de pasar y por dónde continuar. [[02_NEXT]] contiene prioridades del aplicativo. Añade ideas nuevas en [[inbox/README]]; una idea no es una decisión aprobada.

Al cambiar de herramienta, abre el mismo proyecto y usa este mensaje:

> Trabaja en D:\CODEX. Lee AGENTS.md, brain/00_HOME.md y brain/08_HANDOFF.md. Retoma la tarea pendiente enlazada si sigue vigente y autorizada. Verifica los cambios actuales y guarda checkpoints. Antes de terminar deja qué hiciste, qué probaste, qué falta y el primer paso para el siguiente agente.

Si solo quieres evaluar o planificar, dilo: el relevo no autoriza por sí mismo nuevas acciones.

## Entrada según herramienta

| Herramienta | Archivo de entrada | Comprobación inicial |
| --- | --- | --- |
| Codex en este proyecto | `AGENTS.md` | Pedir que identifique la tarea y siguiente paso del relevo. |
| Claude Code con acceso al repositorio | `CLAUDE.md`, que importa `AGENTS.md` | Verificar en `/memory` que carga el archivo del proyecto. |
| Antigravity | `.agents/rules/brain.md` | En Customizations → Rules comprobar que aparece y está en Always On. |
| Claude en una web sin acceso a archivos | Mensaje anterior + las notas necesarias | Necesita acceso concedido al repositorio o recibir las notas; no puede guardar por sí solo en D:\CODEX. |

Archivos preparados para las tres herramientas; solo el uso desde Codex se ha comprobado en esta tarea. No se instalaron plugins ni conectores. No necesitas compartir credenciales.

La ubicación de reglas y la importación se verificaron en la documentación oficial el 2026-09-13: [Antigravity Rules](https://antigravity.google/docs/rules-workflows) y [Claude Code Memory](https://code.claude.com/docs/en/memory). Antigravity también documenta compatibilidad con `.agent/rules`; evitar mantener copias paralelas del mismo protocolo. Si una versión no detecta la regla, usar su interfaz de reglas y apuntar a `AGENTS.md`.

## Qué se conserva

- Estado global: [[01_CURRENT]].
- Prioridades y criterios: [[02_NEXT]].
- Decisiones duraderas: [[03_DECISIONS]].
- Resultado reciente: [[04_LOG]].
- Continuidad inmediata: [[08_HANDOFF]].
- Trabajo detallado: una ficha por tarea en `brain/tasks/`, con [[templates/Tarea]].

Si quedan pocos tokens, el agente guarda primero el checkpoint. Si el corte fue inesperado, el sucesor usa el último punto guardado y revisa los archivos. Esto reduce releer historial, pero las reglas no garantizan que toda herramienta las siga ni que detecte a tiempo todos los cortes.
