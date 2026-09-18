---
tags: [lumcards, tarea, web]
---

# Tarea: reparar estadísticas y flujos del sitio estático

## Control
- ID: 2026-09-17-2316-codex-reparar-web-estadisticas
- Estado: lista_para_relevo
- Responsable y sesión: Codex; no subagentes nuevos.
- Actualizado: 2026-09-17T23:28:00-05:00
- Entorno: D:\CODEX, main/base cfd9fb6; cambios ajenos de Antigravity y cierre visual preservados.

## Objetivo y aceptación
- Usuario reporta fallos recurrentes de estadísticas y creación de mazos al publicar. URL confirmada: https://lumcards.vercel.app/.
- Reproducir en navegador real sin backend Python, reparar causas verificadas, probar estadísticas/mazos/repaso/persistencia/navegación y caché. No confundir pruebas con publicación; no push/deploy sin autorización.

## Archivos y alcance
- Inicialmente solo test nuevo tests/test_static_web_e2e.cjs y esta ficha; lectura de app.js/practice.js/HTML/SW y fichas previas. Posibles arreglos en dist y espejos docs una vez confirmada concurrencia.
- Antigravity está activo en biblioteca/navegación (app.js y CSS); usuario coordina pausa. No editar su archivo hasta confirmación o separación expresa. No datos reales, cuentas, backend ni sincronización en producción.

## Checkpoint
- 23:16: reglas/memoria/status leídos. Tests previos de estadísticas son VM con DOM simulado; otras E2E usan backend Python. Falta test real del sitio estático y deploy efectivo.
- 23:20: usuario confirma Vercel y que Antigravity sigue trabajando, coordinará pausa. Se avanza solo en pruebas independientes/read-only.

## Validación
- HTTP Vercel200 y Chrome limpio: estadísticas iniciales abren, sin error JS. Bundle publicado distinto al working (249043 caracteres); faltan campos/correcciones posteriores que sí están locales. No concluir que la sesión existente del usuario funciona ni borrar su caché/datos.
- Primera E2E puramente estática: fechas de repaso numéricas pasan; fechas heredadas como string disparan Invalid time value y bucle de render (fallo reproducido); persistencia fallida por cuota muestra éxito incorrecto. Recorrido estudio se reintenta ajustando selector de rating y espera del timer existente del modal (40ms).
- Test nuevo aislado tests/test_static_web_e2e.cjs; no toca producción, backend ni biblioteca real. Pendiente repetir y corregir código tras pausa confirmada.

## Pendiente y primer paso
- Confirmar pausa de Antigravity antes de editar app.js (usuario dijo que coordinaría; a23:25 ya aparecieron cambios nuevos en app.css/student.css y test_library_navigation_design.cjs). Releer status/diff y preservar su biblioteca/rediseño.
- Primer cambio exacto: en getWebData, distinguir ausencia de datos de JSON ilegible; si hay contenido ilegible conservarlo intacto y mostrar error recuperable, NO crear/sobrescribir con demos. En saveWebData, propagar error de cuota/permisos y no anunciar guardado ni sincronizar cuando falla persistencia.
- Luego normalizar/validar timestamps de _revlogs para agregación (número o string numérico válido), sin borrar registros originales; corregir claves de día a fecha local consistente en today/calendar/history y límites de rango. No inventar retención/tiempos ante historial desconocido.
- loadDetailedStats/statistics necesitan estado de error explícito y reintento manual: hoy el catch deja detailedStats=null y render vuelve a cargar en bucle. Probar payload inválido y recuperación sin loop ni UI congelada.
- Repetir node tests/test_static_web_e2e.cjs hasta PASS; añadir casos de días/fecha inválida/recuperación y contrastar VM actuales sin debilitarlos. Probar SW/caché real antes de entrega.
- Renovar versión app.js/practice.js y caché con dist/docs pareados; web publicada tiene otro bundle aunque usa mismo query de versión. Solicitar autorización de publicación aparte; no afirmar arreglado Vercel con cambios solo locales.

## Bloqueos y procesos
- Edición de app.js espera pausa confirmada de Antigravity. Diagnóstico y pruebas independientes agotados para los fallos detectados. Servidores efímeros y Chrome cerrados por finally; sin procesos propios vivos. No datos reales ni producción modificados.

## Cierre
- 1 flujo E2E PASS (crear mazo/tarjeta, estudiar, estadísticas y recarga).4 defectos reproducidos: fecha local vs UTC, timestamps string bloquean estadísticas, cuota fallida anuncia guardado, JSON ilegible sustituido por demos. Reloj de test fijado23:30 Lima para regresión determinista; servidor solo estático sin Python, storage sintético en contexto limpio.
- Implementación/publicación PENDIENTES por concurrencia, no tarea hecha. Archivos de este turno: test nuevo y notas; ningún código de aplicación editado. [[08_HANDOFF]]. Entrega previa refutada parcialmente: [[tasks/2026-09-17-1756-antigravity-coherencia-estadisticas-web]].
