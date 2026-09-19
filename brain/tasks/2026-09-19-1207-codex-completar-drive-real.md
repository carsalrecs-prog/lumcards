---
tags: [lumcards, tarea]
---

# Tarea: Completar Google Drive real

## Control

- ID: 2026-09-19-1207-codex-completar-drive-real
- Estado: hecha
- Responsable y sesión: Codex, continuación autorizada por Richard.
- Actualizado: 2026-09-19T12:42:00-05:00
- Entorno: D:\CODEX, main, base 66227af; cambios previos de varias sesiones preservados.

## Objetivo y aceptación

- Provisionar la configuración OAuth web de Google Drive para Lumcards, integrarla sin secretos, y validar autorización y transferencia con contenido sintético cuando la sesión Google disponible lo permita.

## Archivos y alcance

- Configuración web externa de Drive, carga de configuración pública en dist/docs, pruebas y notas del cerebro. No leer biblioteca del usuario ni publicar hosting sin necesidad explícita.

## Checkpoint

- Relevo revisado. El código GIS y sus contratos sintéticos ya pasan; falta cliente OAuth web, orígenes, API/consentimiento y prueba remota.
- 12:20: encontrado cliente web existente `702374747374-e4f826l9rpoa33ebmidnov2mb3ncq88h.apps.googleusercontent.com`; no se creó credencial ni secreto. Drive API estaba inactiva y quedó habilitada; consola muestra estado `Habilitada`.
- Cliente ID público integrado en `client-startup.js` (dist/docs), caché r7 y CSP local ampliada solo a endpoints Google requeridos. Orígenes de producción/local preparados en consola, todavía sin guardar.
- Permisos mínimos `drive.file`, `userinfo.email`, `userinfo.profile` y `openid` preparados en consola, todavía sin guardar. La política de Computer Use exige confirmación justo antes de guardar cambios de acceso OAuth.
- 12:30: Richard confirmó. Orígenes guardados y reabiertos: producción Vercel, Firebase Hosting, localhost:8765 y 127.0.0.1:8765 presentes. Permisos guardados; consola confirmó «Se guardaron los cambios de acceso a los datos». Drive API sigue habilitada.
- Instancia aislada iniciada en `http://localhost:5000` con datos temporales sintéticos. El botón Drive abre correctamente el selector de cuentas de Google para el cliente real y el origen configurado; no aparece error de origen ni de cliente.
- Richard completó el selector/consentimiento. Lumcards mostró la cuenta conectada y confirmó una subida real: `lumcards_backup_2026-09-19.colpkg`, 4 KB. El listado remoto la mostró; descarga e importación en la biblioteca temporal confirmó éxito. Carpeta y archivo visibles también en Drive web.

## Validación

- Contratos Drive/Sync/Firebase init PASS. Python server/practice: 17 tests OK. PWA cache r7 PASS. Paridad dist/docs 6/6 y diff check PASS.
- Suite de acceso repetida tras adaptar el escenario sin configuración: 169 checks PASS.
- Transferencia remota real PASS: autorización, creación/búsqueda de carpeta, subida, listado, descarga e importación con datos sintéticos. No se leyó la biblioteca personal. Richard movió el archivo de prueba a la papelera; carpeta remota verificada vacía.

## Pendiente y primer paso

- Ninguno dentro del alcance. La publicación del código local sigue siendo una tarea separada de estabilización; no se desplegó hosting, instalador ni Git.

## Bloqueos y procesos

- Procesos antiguos de Claude/Python/Chromium presentes; no se intervinieron. Servidor temporal propio del puerto 5000 detenido. Ningún proceso propio activo.

## Cierre

- OAuth Drive real configurado y probado de extremo a extremo con datos sintéticos; archivo remoto de prueba retirado. [[08_HANDOFF]], [[01_CURRENT]], [[02_NEXT]] y [[04_LOG]] actualizados. Código local sin publicar, empaquetar, instalar ni push.
- Verificación final: carpeta Drive vacía; check-brain PASS (62 notas, 230 enlaces, 44 fichas), paridad dist/docs 6/6 y git diff check PASS.
