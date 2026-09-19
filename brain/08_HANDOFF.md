---
tags: [lumcards, relevo]
updated: 2026-09-19
---

# Relevo actual

## Control
- Estado: lista_para_relevo.
- Agente: Antigravity; actualizado 2026-09-19T14:30:00-05:00.
- Entorno: D:\CODEX, main; resuelto auth/internal-error con Google Identity Services directo.
- Ficha vigente: [[tasks/2026-09-19-1430-antigravity-firebase-auth-gis-fallback]]. Tarea anterior: [[tasks/2026-09-19-1332-antigravity-copias-drive-descargas]]. Tarea previa: [[tasks/2026-09-19-1310-antigravity-fix-sync-drive-produccion]].
- Ficha anterior: [[tasks/2026-09-18-2113-antigravity-cierre-matematicas-studio]] (hecha: formulas locales).
- Ficha previa: [[tasks/2026-09-18-2050-antigravity-redisenar-resto-aplicacion]]. Historial visual: [[tasks/2026-09-18-1426-antigravity-redisenar-resto-aplicacion]].

## Hecho
- Drive real completo: API habilitada; cliente OAuth público integrado sin secretos; orígenes y permisos mínimos guardados. Autorización, subida, listado, descarga e importación reales PASS con copia sintética de 4 KB; retirada por Richard y carpeta verificada vacía. Código/cache r7 local sin publicar.
- Reparacion funcional web separada autorizada al continuar: los 4 fallos conocidos ahora pasan. Error local no anuncia guardado ni programa subida; formato ilegible preservado; fechas locales y timestamps string normalizados solo al calcular. Error/reintento de estadisticas sin bucle y con foco recuperado.
- KaTeX local del repositorio reemplaza CDN en ambos HTML; cache r4 incluye fuentes/scripts. 24 checks Chromium reales, preview offline y prueba cache PWA PASS, capturas inspeccionadas. Sin dependencias nuevas ni cambios CSP.
- Studio aplicado a Mi espacio/cuenta/copias/ajustes, importadores/editor y estados/confirmaciones. Preview sin guardar/audio; nombres largos y retorno de foco corregidos. Biblioteca/Estudio/Juegos conservados, reflow puntual en estadísticas.
- Administración/reset añadidos por Claude revisados; revocación y aprobación con confirmación y error recuperable. Usuario confirmó que Claude se quedó sin tokens; cambios preservados.
- dist/docs espejados, version actual app/sync/cache r6. Startup externo compatible con CSP y cache PWA verificada con servidor aislado.
- No cierre integral: quedan las limitaciones funcionales/de validación de abajo. No empaquetado, instalado, publicado ni push.

## Validación
- Sesion Drive: contratos Drive/Sync/Firebase PASS, 17 pruebas Python OK, PWA cache r7 y access 169 checks PASS. Paridad dist/docs 6/6 y diff check PASS. Transferencia remota real comprobada con datos sintéticos.
- Historico conservado en fichas: 9 escenarios de persistencia + PWA offline, remaining 567 checks, 11 suites frontend y 93 pruebas Python PASS. No repetidos todos en esta sesion.
- Check-brain PASS: 61 notas, 224 enlaces y 43 fichas.

## Pendiente
- Cola de sincronizacion offline no implementada; persistencia local probada no equivale a sincronizacion remota. Los 4 defectos de la ficha 2316 quedan corregidos localmente, no publicados.
- Claude implementó acceso manual: [[tasks/2026-09-18-2130-claude-control-acceso-manual]]. Reglas corregidas publicadas. Falta probar registro → aprobación → acceso con cuentas de prueba y completar control de acceso pago a datos. Drive ya fue probado; transferencia Firebase integral no.
- Reset y hallazgo de backend web Firestore: [[tasks/2026-09-18-1600-codex-web-backend-solution]], [[tasks/2026-09-18-1524-codex-estadisticas-lenguaje-reset]]. Revisar [[03_DECISIONS]] antes de retomar propuesta Vercel/Realtime DB.
- Visión comercial, catálogo sin inventario y licencias pendientes permanecen en [[02_NEXT]] y [[03_DECISIONS]]. No iniciar tienda ni publicar por esta tarea.
- Reparación reciente de escritorio preservada: [[tasks/2026-09-18-1346-antigravity-reparar-arranque-escritorio]].

## Primer paso
- Probar registro → aprobación → acceso con cuentas de prueba y diseñar control de acceso pago a datos. No desplegar hosting ni iniciar tienda por inferencia; los cambios locales acumulados siguen sin commit/publicación.

## Bloqueos y procesos
- Sin conflicto activo confirmado. Validación integral limitada por Firebase externo y servicios/datos web reales no verificados.
- Procesos propios de pruebas finalizados; procesos ajenos no intervenidos. Consola cerrada; solo reglas publicadas, no hosting.
