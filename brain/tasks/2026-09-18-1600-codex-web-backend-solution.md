---
tags: [lumcards, tarea, web, backend, arquitectura]
---

# Tarea: Solucionar web sin Python + Agregar botones UI

## Control

- ID: 2026-09-18-1600-codex-web-backend-solution
- Estado: lista_para_relevo
- Responsable: Codex (inicio) → Claude (checkpoint 2026-09-18T21:00)
- Actualizado: 2026-09-18T21:00:00-05:00
- Entorno: D:\CODEX main 66227af + cambios sin commitear

## Checkpoint 2026-09-18T21:00 (Claude)

**Hallazgo que cambia el alcance**: `dist/sync-manager.js` (655 líneas) y el modo web de `dist/app.js` (`isWebMode`, `webApi()`) YA implementan "web sin Python": auth Firebase (email/Google/invitado), sincronización de mazos/tarjetas/stats a **Firestore** (no Realtime DB como asumía este plan), y cálculo de estadísticas 100% en cliente. Las Fases 1 y 2 de este plan (crear Vercel Functions + estructura Realtime DB) probablemente ya NO son necesarias — antes de construirlas, confirmar con el usuario. Detalle en [[../03_DECISIONS|03_DECISIONS]] entrada "Actualización 2026-09-18 21:00".

**Hecho en este checkpoint** (único punto real que faltaba y sí estaba en el plan — Fase 3, botones UI):
- `webApi()` en `dist/app.js`: nuevas rutas `cards/reset`, `decks/reset`, `reset-all` (antes `cards/reset` se llamaba desde la UI pero no existía la ruta — el botón de reset por tarjeta estaba roto en modo web).
- Botones "Reiniciar progreso del mazo" (menú de opciones + barra de acciones del mazo abierto) y "Reiniciar toda la colección" (Preferencias, con checkbox de doble confirmación) con modales, llamando `api('backup')` antes de resetear.
- Sincronizado a `docs/app.js` y `docs/sync-manager.js` (no se tocó `android/`, ya estaba desalineado de antes y no es parte del alcance de esta sesión).
- Credenciales Firebase reales del proyecto "lumcards" (dadas por el usuario) puestas en `dist/sync-manager.js::FirebaseProvider.getConfig()`.
- Nueva config `web-static` en `.claude/launch.json` (`python -m http.server 9100 --directory dist`) para poder probar el modo web puro sin el servidor Python.

**Probado**: `node --check` en ambos JS. Flujo completo en navegador embebido contra `web-static` con datos semilla del navegador (no datos reales del usuario): reset de un mazo y reset total, ambos verificados por el cambio visible en contadores de "nuevas/repasadas". No se probó con la biblioteca real del usuario en `data/` ni el flujo de sincronización Firestore real (requeriría una cuenta y conexión real a Firebase, fuera de lo verificable en este entorno).

**No hecho / fuera de este checkpoint**:
- Vercel Functions (`api/*.js`), `vercel.json`: no creados. Ver hallazgo arriba antes de crearlos.
- Cola offline (`STORAGE_KEYS.OFFLINE_QUEUE` en sync-manager.js): la clave existe pero ningún flujo la usa; sigue siendo aspiracional.
- Service Worker (`dist/sw.js`): no revisado ni modificado en este checkpoint.
- `check-brain.ps1` no ejecutado todavía.
- Nada de esto se ha commiteado.

## Objetivo y aceptación

**Objetivo**: Web funciona sin Python con la MISMA funcionalidad que desktop + sincronización multi-dispositivo estable

**Problema actual**: Vercel solo ejecuta JavaScript/HTML/CSS. Python NO corre en la web.
- Desktop (Lumcards.exe) → Python ✅
- Web (vercel.app) → Solo JS ❌ (no puede llamar a `/api/*`)

**Solución elegida**: Vercel Functions (Node.js backend gratuito en Vercel) + Firebase Realtime DB

**Aceptación**:
- ✅ Web muestra estadísticas idénticas a desktop
- ✅ Botones reset funcionan (mazo + total)
- ✅ Sincronización multi-dispositivo <2 segundos
- ✅ Offline mode con reconciliación automática
- ✅ Datos consistentes (sin pérdida)
- ✅ Algoritmo SRS 100% exacto en web y desktop

## Archivos y alcance

**Modificar**:
- dist/app.js: agregar botones reset + modales
- dist/practice.html: agregar reset en Jugar y aprender
- Crear: vercel.json (configuración)
- Crear: api/ (funciones Vercel)

**Crear nuevos**:
- api/decks/reset.js (función serverless)
- api/reset-all.js (función serverless)
- api/stats/detailed.js (función serverless)
- .env.local (credenciales Firebase)

**No modificar**:
- clean_engine.py (desktop solo)
- server.py (desktop solo)
- Rediseño visual

## Arquitectura propuesta

```
┌─ Desktop (Lumcards.exe)
│  ├─ Python backend (/api/*)
│  └─ SQLite local
│
└─ Web (vercel.app)
   ├─ Vercel Functions (Node.js)
   ├─ Firebase Realtime DB (datos compartidos)
   └─ Service Worker (offline, caché)
```

## Checkpoint

- 16:00: Usuario autoriza agregar botones + solucionar web
- Análisis: app.js minificado es difícil, pero se puede editar
- Firebase es gratuito para versión web (plan Spark)
- No requiere cambios en Python desktop

## Plan Detallado (AUTORIZADO)

### Fase 1: Firebase + Vercel Setup (Horas 1-2)
1. Crear proyecto Firebase (usuario autoriza)
2. Habilitar Realtime DB (plan Spark gratuito)
3. Crear estructura datos (mazos, tarjetas, revlogs, progreso)
4. Crear `vercel.json` para funciones

### Fase 2: Vercel Functions Node.js (Horas 2-4)
Replicar `clean_engine.py` en JavaScript:
- `api/stats/detailed.js` → Estadísticas (retención, forecast, calendario)
- `api/decks/reset.js` → POST: reinicia mazo
- `api/reset-all.js` → POST: reinicia todo
- `api/study/queue.js` → Próximas tarjetas
- `api/review.js` → Registra respuesta
- **CRÍTICO**: Algoritmo SRS (ease_factor, interval) debe ser 100% exacto vs. Python

### Fase 3: Agregar Botones UI + Sincronización (Horas 4-6)
1. Botones reset con modales de confirmación en app.js
2. Firebase SDK para lectura en tiempo real
3. Service Worker para offline + caché
4. Sincronización multi-dispositivo (<2 segundos)

### Fase 4: Pruebas Exhaustivas (Horas 6-8)
- Laptop + celular simultáneamente
- Offline → online reconciliación
- Estadísticas idénticas web vs. desktop
- Reset no pierde datos

## Validación

- Python syntax: PASS
- Firebase estructura: PENDING
- Vercel Functions: PENDING
- Multi-device sync: PENDING
- Offline mode: PENDING

## Pendiente y primer paso

**AUTORIZACIÓN RECIBIDA** ✅ Usuario autoriza:
- Firebase Realtime DB
- Vercel Functions
- Sincronización multi-dispositivo
- Botones UI con confirmación

**Iniciando ahora:**
1. Crear vercel.json y carpeta api/
2. Crear funciones Vercel básicas
3. Configurar Firebase
4. Pruebas locales antes de deploy

## Bloqueos y procesos

- Ninguno técnico
- Requiere credenciales Firebase (usuario proporciona o crea)
- SRS: validar línea por línea vs. Python

## Cierre

- **INICIADO** por usuario 2026-09-18 16:00
- Responsable: Codex (sesión en curso)
- Estimado: 8 horas de desarrollo
- **CRÍTICO**: estabilidad y sincronización sin pérdida de datos
- Próxima entrada: checkpoint con primeras funciones Vercel
