---
tags: [lumcards, backlog]
updated: 2026-09-19
---

# Próximas tareas

## Continuacion inmediata — nube

- [x] Corregir inicializacion Firebase recursiva y probar reglas contra autoaprobacion en simulador real. [[tasks/2026-09-19-0502-codex-validar-nube]].
- [x] Publicar solo reglas corregidas tras autorizacion expresa: CLI exit 0 el 2026-09-19.
- [x] Eliminar simulacion de Drive y preparar GIS con errores/permisos/caducidad; contratos sinteticos y PWA PASS. [[tasks/2026-09-19-1156-codex-drive-oauth]]
- [x] Configurar Drive real: clientId público, orígenes, API, permisos y transferencia remota sintética completa. Archivo de prueba retirado. [[tasks/2026-09-19-1207-codex-completar-drive-real]]
- [ ] Desplegar y validar servicio web en Render.com (lumcards.onrender.com) con Python 3 y servidor server.py.
- [ ] Validar registro/aprobacion/transferencia con cuentas de prueba y resolver control de acceso pago a datos (todavia no impuesto por reglas).


## Operación entre agentes

- [x] Inventariar las capacidades observadas de Codex y Antigravity y definir cómo solicitar nuevas skills, plugins o MCP: [[10_AGENT_CAPABILITIES]].
- [x] En la sesión de Antigravity del 2026-09-15, verificada carga de reglas del proyecto, lectura de relevo, ejecución de pruebas y sincronización a GitHub/Vercel.

## P0 — modelo de negocio: acceso pago manual + tienda de mazos (visión completa en [[03_DECISIONS]])

- [x] Correo administrador (`carsal.recs@gmail.com`) con acceso total y permiso de aprobar usuarios.
- [x] Registro de usuario en Firestore con estado de aprobación (`pendiente` por defecto) al iniciar sesión.
- [x] Panel de administración básico: listar usuarios, aprobar/revocar acceso manualmente (flujo de pago por Yape confirmado a mano).
- [x] Reglas Firestore corregidas publicadas por Codex el 2026-09-19 con permiso expreso; control de acceso pago integral sigue pendiente.
- [ ] Tienda de mazos por carrera/especialidad (catálogo) — depende de que exista inventario real de mazos para vender.
- [ ] Verificar licencia de redistribución de cualquier mazo comprado a terceros antes de revenderlo.
- [ ] Pasarela de pago automática (Stripe/Culqi/MercadoPago) cuando haya capital — reemplaza el flujo manual de Yape.
- [ ] IA para convertir fotos de apuntes / PPT / PDF cortos en mazos de tarjetas (visión a futuro, sin diseño técnico todavía).
- [ ] Suscripción mensual (acceso a IA y/o a todos los mazos de la tienda) — modelo de precios a definir.

## P0 — antes de vender o publicar como producto independiente

- [x] Elegir ruta y ejecutar: sustitución completa del motor oficial por motor clean-room propio (`clean_engine.py`) libre de AGPL.
- [ ] Obtener revisión jurídica de licencias, marca, términos y mercados de venta.
- [ ] Eliminar expresiones como “100% legal” hasta contar con esa revisión.
- [ ] Crear inventario de dependencias, textos de licencia y código fuente correspondiente cuando aplique.
- [ ] Revisar disponibilidad y registro de la marca Lumcards.

## P1 — estabilización técnica

- [x] Cierre visual independiente e instalación de activos de Juegos: [[tasks/2026-09-17-2300-codex-cierre-diseno]].
- [x] Etapa 1 Biblioteca y navegación consistente con Studio: [[tasks/2026-09-17-2315-antigravity-redinseo-biblioteca-navegacion]]. Implementada y verificada en Chromium en 5 viewports.
- [x] Etapa 2 Estudio y visor de tarjetas consistente con Studio: [[tasks/2026-09-17-2337-antigravity-estudio-visor-tarjetas-studio]]. Implementada y verificada en Chromium en 5 viewports con paridad 0-diff y suites de audio/regresión pasando.
- [x] Etapa 3 Estadísticas web, modales y explorador de tarjetas consistente con Studio: [[tasks/2026-09-18-0020-antigravity-explorador-modales-estadisticas-studio]]. Implementada y verificada en Chromium en 5 viewports con paridad 0-diff y suites pasando al 100%.
- [x] Etapa 4 Mi espacio/ajustes e importadores/editor implementados y probados localmente: [[tasks/2026-09-18-2050-antigravity-redisenar-resto-aplicacion]].
- [x] KaTeX local real y offline validado: [[tasks/2026-09-18-2113-antigravity-cierre-matematicas-studio]].
- [x] Cuatro fallos funcionales web corregidos y probados localmente: [[tasks/2026-09-18-2133-codex-reparar-persistencia-web]].
- [ ] Validar Firebase real y transferencias Drive en entorno autorizado; cola de sincronizacion offline sigue fuera del alcance. No confundir persistencia local probada con sincronizacion remota.

- [x] Rediseño de Jugar y aprender implementado y validado: [[tasks/2026-09-17-0720-codex-redisenar-juegos]]. Nuevo estudio de práctica con 6 modos, arte decorativo adaptable, reductor de movimiento y tests E2E superados en todos los viewports.
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
- [x] Revisar el estado Git, clasificar archivos no rastreados y crear un punto de restauración confirmado: commit `acfe525` subido a GitHub y reflejado en el remoto.
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
