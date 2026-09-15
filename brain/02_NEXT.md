---
tags: [lumcards, backlog]
updated: 2026-09-15
---

# Próximas tareas

## Operación entre agentes

- [x] Inventariar las capacidades observadas de Codex y Antigravity y definir cómo solicitar nuevas skills, plugins o MCP: [[10_AGENT_CAPABILITIES]].
- [x] En la sesión de Antigravity del 2026-09-15, verificada carga de reglas del proyecto, lectura de relevo, ejecución de pruebas y sincronización a GitHub/Vercel.

## P0 — antes de vender o publicar como producto independiente

- [x] Elegir ruta y ejecutar: sustitución completa del motor oficial por motor clean-room propio (`clean_engine.py`) libre de AGPL.
- [ ] Obtener revisión jurídica de licencias, marca, términos y mercados de venta.
- [ ] Eliminar expresiones como “100% legal” hasta contar con esa revisión.
- [ ] Crear inventario de dependencias, textos de licencia y código fuente correspondiente cuando aplique.
- [ ] Revisar disponibilidad y registro de la marca Lumcards.

## P1 — estabilización técnica

- [x] Decidir si `frontKey` y `backKey` son API pública: corregida filtración interna en `dist/study-games.js` manteniendo `id`, `front`, `back`.
- [x] Restaurar carpetas, renombrado y estadísticas detalladas después del cambio de motor; migración local respaldada y suite completa en verde el 2026-09-15.
- [x] Revisar el estado Git, clasificar archivos no rastreados y crear un punto de restauración confirmado: commit `8e0cec5` subido a GitHub y desplegado en Vercel.
- [ ] Reinstalar dependencias con `npm install` cuando se necesite construir web/Android.
- [ ] Ejecutar Python, Node, escritorio y Android desde un entorno limpio.
- [x] Comparar `dist/` con `docs/` y sincronizar activos para paridad completa.
- [ ] Probar instalador en otro Windows sin rutas heredadas de este equipo.

## P2 — evolución del producto

- [ ] Si se elige motor propio: definir `LibraryRepository`, `Scheduler`, `CardRenderer`, `MediaStore` e `ImportAdapter`.
- [ ] Versionar un formato propio y una migración no destructiva desde colecciones existentes.
- [ ] Integrar el historial de juegos en copias y sincronización, con política explícita.
- [ ] Definir qué juegos afectan al plan de memoria; por defecto deben seguir separados.

## Criterio de terminado

Una tarea solo se marca completa cuando el cambio está implementado, probado con datos temporales y documentado. Empaquetar, instalar y publicar requieren evidencias separadas.
