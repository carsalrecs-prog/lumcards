---
tags: [lumcards, backlog]
updated: 2026-09-17
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

- [ ] Dirección visual preparada: [[tasks/2026-09-17-0715-codex-direccion-visual]]. Maqueta y movimiento propuestos, sin implementación; pendiente elección de ejecutor. Conservar auditorías de carpetas/importador antes de extender cambios.
- [x] Selector jerárquico de carpetas en Juegos y presentación adaptable: [[tasks/2026-09-17-0630-codex-juegos-carpetas]]. Etapa 1 implementada y verificada en suite Playwright en 4 viewports, backend y fallback offline por Antigravity; listo para revisión de Codex. Propuestas de nuevos juegos de Etapa 2 pendientes de decisión.
- [ ] Revisión independiente de importador/menús/borrado entregados por Antigravity sigue pendiente; el cierre reportado abajo no equivale a aprobación de Codex.
- [x] Formularios de mazo/carpeta, preview visual de importador y eliminación segura desde biblioteca: [[tasks/2026-09-17-0313-codex-importacion-menus]]. Implementado y verificado en Chromium real en 4 viewports por Antigravity (Hitos 1, 2, 3 y Pendientes D); listo para revisión de Codex.
- [x] Editor amplio, contraste Lumcards y composición adaptable: [[tasks/2026-09-17-0235-codex-preview-legibilidad]]. Pendientes de scroll real desbordado, tipografía manual y clozes anidados integrados y verificados en Hito 4.
- [x] Personalización real de tarjetas, bloques de estudio y vistas previas en tiempo real: [[tasks/2026-09-17-0145-antigravity-personalizacion-bloques-vistas]]. Verificado en Chromium en 4 viewports con mazo sintético de 565 tarjetas, 15 capturas e inspección visual.
- [x] Reparar bloqueo CSP de los parlantes y franjas del visor; integración Chromium real a cuatro tamaños y activos instalados verificados: [[tasks/2026-09-17-codex-csp-responsive]].
- [ ] Validar en dispositivo móvil físico/Android y WebView2 auditivamente; no se ha generado APK nuevo.

- [x] Corregir la repetición de parlantes incrustados y eliminar las franjas laterales del visor horizontal: [[tasks/2026-09-16-1300-antigravity-audio-parent-delegation]]. Delegación de audio al padre y layout `flex-start` implementados y probados mediante Node.js/Python tests (100% OK); la confirmación nativa de WebView2 queda pendiente por el usuario, pero el código de iframe es robusto y consistente.
- [x] Invalidar el frontend antiguo en el paquete Windows y hacer efectivas las correcciones UX: [[tasks/2026-09-16-1209-codex-cache-empaquetado-ux]]. Versión nueva, navegación anticaché, ejecutables y activos instalados verificados.
- [x] Corregir el paquete Windows que omitía `clean_engine.py`: [[tasks/2026-09-16-1158-codex-instalador-clean-engine]]. Ambos instaladores y la instalación local quedaron reparados; servidor instalado validado con datos temporales.
- [x] Cerrar la tarea de fondo, layout y audio: [[tasks/2026-09-15-1355-antigravity-ux-estudio-audio-juegos]]. Implementación y revisión independiente completadas; permanece sin commit ni despliegue, que requieren una tarea explícita posterior.
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
