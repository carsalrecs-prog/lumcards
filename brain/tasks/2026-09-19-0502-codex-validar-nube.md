---
tags: [lumcards, tarea]
---

# Tarea: Preparar validacion remota de Firebase y Drive

## Control

- ID: 2026-09-19-0502-codex-validar-nube
- Estado: lista_para_relevo
- Responsable y sesión: Codex, continuacion de pendientes.
- Actualizado: 2026-09-19T05:16:00-05:00
- Entorno: D:\CODEX main base 66227af; cambios previos preservados.

## Objetivo y aceptación

- Continuar pendientes de nube con datos sinteticos: comprobar configuracion real, reproducir defectos y corregirlos sin leer biblioteca ni publicar sin permiso. Aceptacion integral pendiente de OAuth y cuentas de prueba.

## Archivos y alcance

- sync-manager.js, index.html y sw.js en dist/docs; firestore.rules; tests/test_sync_initialization.cjs, test_studio_remaining_design.cjs y test_studio_math_cache.cjs. Notas compartidas. Preservados cambios anteriores de Claude y escritorio.

## Checkpoint

- Checkpoints detallados al final; correccion local de inicializacion y borrador de reglas guardados.

## Validación

- En D:/CODEX: node tests/test_sync_initialization.cjs, test_sync_manager.cjs, test_studio_math_cache.cjs, test_ux_study_audio.cjs y test_studio_access_design.cjs: exit 0. Access: 169 checks. Sync manager usa mocks; no demuestra transferencia remota. Paridad SHA256 dist/docs de los tres activos modificados PASS.

## Pendiente y primer paso

- Resolver autorizacion de publicar solo firestore.rules, solicitada al usuario tras probar borrador. Luego configurar OAuth Drive valido y validar con cuentas de prueba; no usar biblioteca personal.

## Bloqueos y procesos

- Reglas sin publicar hasta permiso expreso. Drive usa clientId placeholder y tokens simulados; pendiente OAuth real. Google Auth habilitado, correo/contrasena no figura habilitado. No cuentas de prueba identificadas. Sin procesos propios de pruebas activos; consola conservada con borrador sin publicar.

## Cierre

- Implementado/probado localmente; sin empaquetar, instalar, publicar ni push. [[08_HANDOFF]], [[01_CURRENT]], [[02_NEXT]] y [[04_LOG]] actualizados. No cierre integral de nube.

## Alcance concreto
- Usuario pide pendientes remotos. Entorno/cuentas de prueba consultados, sin solicitar contrasenas. No despliegue ni lectura de biblioteca personal.
- Lectura dirigida de proveedor, reglas y pruebas identifica: OAuth placeholder/condicion invertida, create de reglas permite campos de aprobacion, inicializacion Firebase llama recursivamente getConfig/init antes de tener app.
- Previstos: prueba aislada de inicializacion y correccion minima en sync-manager.js/espejo, version cache y notas; documentar los demas bloqueos sin tocar produccion.
- Primer paso: reproducir inicializacion con SDK sintetico y asegurar una sola llamada.

## Checkpoint 05:04
- test_sync_initialization.cjs reprodujo 4796 inicializaciones en vez de una. getConfig ahora lee configuracion sin llamar init; prueba PASS para configuracion por defecto y guardada y reentrada.
- test_sync_manager.cjs PASS: es simulacion local, sus mensajes no demuestran Firebase/Drive reales. Cache PWA PASS; cache r5 y query sync-manager versionada. Sin cambiar protocolo de transferencia ni datos.
- Reglas: allow create del propietario no limita campos de aprobacion; allow update no exige aprobacion para datos. No se debe afirmar control de acceso remoto seguro por estas reglas. No desplegadas ni modificadas aqui; falta emulacion/configuracion acordada.
- Drive: clientId de ejemplo y condicion OAuth rechaza identificadores apps.googleusercontent.com. Conexion por correo crea token simulado, no prueba OAuth ni subida real. Correccion remota pendiente de entorno/OAuth valido.
- Consulta al usuario pendiente sobre proyecto/cuentas de prueba/Auth/reglas. Sin credenciales solicitadas ni biblioteca personal leida. CLI Firebase disponible; Java observado es java8path, emuladores no ejecutados ni instalados.

## Verificacion remota 05:08
- Usuario confirma configuracion. CLI autentica y ve proyecto lumcards/base default. Consola real muestra Google habilitado; correo/contrasena no figura habilitado. Sin leer documentos de biblioteca.
- Reglas activas visibles coinciden con archivo local anterior. Simulador real autorizo create del propietario con accessApproved=true (UID/email sinteticos), reproduciendo autoaprobacion. No se escribieron documentos ni crearon cuentas.
- Preparada correccion local de firestore.rules: propietario crea solo aprobacion/admin false o ausente, sin campos de auditoria; administrador requiere email_verified. No despliegue. Probar borrador en simulador y conservar alcance original de acceso a datos; no redisenar esquema/protocolo.

## Checkpoint 05:16 — simulador real
- Reglas publicadas anteriores: create propietario con autoaprobacion permitido, defecto reproducido. Borrador corregido: autoaprobacion rechazada; registro pendiente permitido; lectura administrativa con correo sin verificar rechazada; con correo verificado permitida. Cuatro resultados esperados confirmados en consola Chromium. Sin documentos escritos ni cuentas creadas.
- Limite: propietario todavia puede leer/actualizar sus datos sin aprobacion; estas reglas no implementan control completo de acceso pago. No se cambia esquema/protocolo en esta correccion.
- Borrador de consola preparado; publicacion solicitada expresamente, pendiente respuesta. No confundir confirmacion previa de configuracion con permiso de desplegar.

## Publicacion autorizada — 2026-09-19
- Usuario autorizo expresamente publicar unicamente firestore.rules. Ejecutado firebase deploy --only firestore:rules --project lumcards --non-interactive: exit 0; compilacion correcta y reglas liberadas a cloud.firestore. Solo reglas publicadas, no hosting/aplicacion/instalador.
- Sustituye el bloqueo de autorizacion anterior; consola de simulacion cerrada. Pendientes reales: OAuth Drive, cuentas de prueba y control completo de acceso pago.
- git diff --check PASS; check-brain PASS (60 notas, 216 enlaces, 42 fichas). No procesos propios activos.
