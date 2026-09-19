---
tags: [lumcards, tarea, web, firebase, monetizacion]
---

# Tarea: Control de acceso manual (admin + aprobación por Yape)

## Control

- ID: 2026-09-18-2130-claude-control-acceso-manual
- Estado: lista_para_relevo
- Responsable: Claude
- Actualizado: 2026-09-18T21:30:00-05:00
- Entorno: D:\CODEX main 66227af + cambios sin commitear (continúa la sesión de [[2026-09-18-1600-codex-web-backend-solution]])

## Objetivo y aceptación

Richard (usuario, correo admin `carsal.recs@gmail.com`) quiere vender acceso a Lumcards cobrando manualmente por Yape: él confirma el pago y activa el acceso a mano desde un panel, sin pasarela de pago automática todavía. Visión completa (tienda de mazos por carrera, IA futura, suscripción) en [[../03_DECISIONS|03_DECISIONS]] → "Modelo de negocio: acceso pago manual + tienda de mazos".

**Aceptación de esta tarea concreta**:
- `carsal.recs@gmail.com` tiene acceso total automático (sin aprobación) y puede aprobar/revocar el acceso de otras cuentas.
- Cualquier otra cuenta que inicia sesión con Firebase (correo/contraseña o Google) queda `pendiente` hasta que el admin la aprueba.
- El admin tiene un panel dentro de la app para ver usuarios y aprobar/revocar.
- El modo local/invitado (sin cuenta Firebase) sigue funcionando sin restricción — el control de acceso es solo para lo que se sincroniza con la cuenta en la nube.

## Archivos y alcance

**Modificados**:
- `dist/sync-manager.js` (y `docs/sync-manager.js`): `ADMIN_EMAILS`, `isAdminEmail()`, `isAdmin()`, `ensureAccessRecord()`, `checkAccess()`, `listAllUsers()`, `setUserAccess()`.
- `dist/app.js` (y `docs/app.js`): `accessInfo` global + `loadAccessInfo()`, tarjeta de estado de acceso en `syncView()` (`accessStatusCard()`), nueva vista `adminView()` + `loadAdminUsers()`, nav "Administración" visible solo para el admin, handlers `refresh-admin-users` y `admin-set-access`.

**Creado**:
- `firestore.rules` (raíz del repo): reglas de Firestore para `/users/{uid}` — dueño lee/edita su propio documento salvo los campos de acceso (`accessApproved`, `isAdmin`, `accessNote`, `accessUpdatedAt`, `accessUpdatedBy`), que solo el admin puede tocar; solo el admin puede listar todos los usuarios.

**No modificado**: `clean_engine.py`, `server.py`, `android/` (desalineado de antes, fuera de alcance).

## Checkpoint

- 2026-09-18T21:30 (Claude): implementación completa y probada en navegador (ver Validación). Sin commitear.

## Validación

- `node --check` en `dist/app.js` y `dist/sync-manager.js`: PASS.
- Prueba en navegador embebido contra `web-static` (`python -m http.server 9100 --directory dist`), inyectando usuarios de prueba por consola (no hay proveedores de Auth reales configurados aún que probar de punta a punta):
  - Invitado (`continueAsGuest`) → `checkAccess()` devuelve `{approved:true, localOnly:true}`, sin panel de administración ni tarjeta de acceso. Correcto.
  - Usuario simulado con `email: 'carsal.recs@gmail.com'` → `isAdmin()` true, nav "Administración" visible, `adminView()` renderiza y al listar usuarios devuelve el error esperado `Missing or insufficient permissions` de Firestore real (confirma que la app SÍ se conecta al proyecto Firebase real "lumcards" con las credenciales correctas; falla solo porque `firestore.rules` no está desplegado todavía).
  - Usuario simulado normal (`estudiante@example.com`) → `checkAccess()` devuelve `{approved:false, pending:true}` y la vista de sincronización muestra la tarjeta "Acceso pendiente de aprobación" con el texto de Yape.
- **No verificado**: login real con Firebase Auth (Google o correo/contraseña) contra el proyecto real, porque no se sabe si esos proveedores están habilitados en la consola de Firebase ni si `firestore.rules` ya está desplegado. Sin desplegar las reglas, cualquier lectura/escritura real de `users/{uid}` fallará con "permission denied" (aunque el `try/catch` ya diseñado evita que la app se rompa: cae a un fallback en `localStorage` que trata a todo usuario no-admin como pendiente, así que el sistema es seguro por defecto — nunca aprueba a nadie por accidente).

## Pendiente y primer paso

**Antes de que el control de acceso funcione con cuentas reales**, Richard debe (ninguno de estos pasos lo puede hacer el agente, son configuración de cuenta/consola):
1. Desplegar `firestore.rules` en la consola de Firebase (Firestore Database → Reglas → pegar el contenido del archivo → Publicar). Instrucciones dentro del propio archivo.
2. Confirmar en Firebase Console → Authentication → Sign-in method que **Correo/Contraseña** y/o **Google** estén habilitados (si no lo están, el login cae a una sesión local simulada que NO se sincroniza ni queda sujeta a aprobación — no es un fallo de seguridad porque no toca la nube, pero tampoco sirve para vender acceso real).
3. Iniciar sesión una vez con `carsal.recs@gmail.com` para que su documento de admin se cree en Firestore.

**Primer paso siguiente agente**: si Richard confirma que ya hizo 1-3, probar el flujo real (registrar un usuario de prueba, verlo "pendiente" en el panel de administración, aprobarlo, confirmar que el estado cambia a "Acceso premium activo").

## Bloqueos y procesos

- Bloqueo real: reglas de Firestore no desplegadas (fuera del alcance del agente — cambia configuración de seguridad de una cuenta externa del usuario).
- No verificado si los proveedores de Auth (Google / correo-contraseña) están habilitados en la consola.
- Nada de esto se ha commiteado.

## Cierre

- Pendiente de decisión del usuario: siguiente paso es la tienda de mazos por carrera (aún sin inventario real) o cerrar y probar primero el flujo de aprobación con una cuenta real.
- Relacionado: [[../08_HANDOFF|08_HANDOFF]], [[../03_DECISIONS|03_DECISIONS]].
