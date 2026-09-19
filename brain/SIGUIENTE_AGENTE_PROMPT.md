---
tags: [lumcards, handoff, prompt, siguiente-agente]
---

> [!warning] Parcialmente superado (2026-09-18 21:00, Claude)
> Este documento asume que hace falta construir Vercel Functions + Firebase Realtime DB desde cero. Al ejecutarlo se encontró que `dist/sync-manager.js` y el modo `isWebMode` de `dist/app.js` YA implementan auth Firebase, sincronización (vía **Firestore**, no Realtime DB) y estadísticas sin Python. Ver [[03_DECISIONS]] → "Actualización 2026-09-18 21:00" y [[tasks/2026-09-18-1600-codex-web-backend-solution]] antes de retomar las Fases 1-2 de abajo. La Fase 3 (botones UI de reset) sí se hizo y está descrita en la ficha.

# PROMPT para Siguiente Agente - Web Backend sin Python

## Contexto Rápido

**Usuario autorizó**: Hacer que vercel.app funcione sin Python + sincronización multi-dispositivo (laptop, celular, tablet)

**Estado**: Plan documentado y autorizado. Implementación lista para comenzar.

**Ficha a seguir**: [[tasks/2026-09-18-1600-codex-web-backend-solution]]

---

## ¿QUÉ ESTÁ HECHO?

✅ Rediseño visual Studio (Fases A-D completas)
✅ Funciones de reset en `clean_engine.py` (reset_deck, reset_all)
✅ Endpoints en `server.py` (/api/decks/reset, /api/reset-all)
✅ Lenguaje claro en estadísticas ("En estudio avanzado" vs "Jóvenes")
✅ Decisión arquitectónica documentada en `03_DECISIONS.md`
✅ Plan detallado en `tasks/2026-09-18-1600-codex-web-backend-solution.md`

---

## ¿QUÉ FALTA?

### FASE 1: Vercel Functions (Node.js backend)
```
Crear: api/stats/detailed.js
       api/decks/reset.js
       api/reset-all.js
       api/study/queue.js
       api/review.js
       api/sync/pull.js
       api/sync/push.js
```

**CRÍTICO**: Algoritmo SRS en JavaScript DEBE SER 100% IDÉNTICO a Python
- Cálculos: ease_factor = (ease_factor + (8 - 8*quality/max_quality)) / 10
- Interval: próximo intervalo basado en ease
- Due date: cálculo local con offset

Referencia: `clean_engine.py` líneas ~1400-1500 (función review/schedule)

### FASE 2: Firebase Realtime DB
```
Crear estructura:
/users/{uid}/
├─ decks/{deckId}/
│  ├─ name, color, config
│  └─ cards/{cardId}/
│     ├─ front, back, state
│     └─ progress (reps, interval, ease, due)
├─ revlogs/{timestamp}/
├─ progress/ (estadísticas totales)
└─ settings/
```

Usuario proporciona credenciales Firebase (apiKey, projectId, databaseURL)

### FASE 3: Agregar Botones UI
Modificar `dist/app.js`:
- Botón "🔄 Reiniciar este mazo" con modal de confirmación
- Botón "⚠️ Reiniciar TODA la colección" con confirmación doble

Modal debe:
- Advertir del riesgo
- Crear backup automático
- Pedir confirmación
- Retornar foco al botón tras cerrar

### FASE 4: Service Worker + Offline
Crear/actualizar `dist/sw.js`:
- Cache de estadísticas
- Offline mode con sincronización al conectar
- Mostrar estado: "Sincronizando..." → "✓ Todo sincronizado"

### FASE 5: Pruebas Multi-Dispositivo
- Laptop + celular simultáneamente
- Offline → online reconciliación
- Estadísticas idénticas web vs. desktop
- Reset no pierde datos

---

## ARCHIVOS CLAVE

**Ya modificados**:
- `clean_engine.py` (líneas ~1831-2032): lenguaje + funciones reset
- `server.py` (líneas ~334-338): endpoints POST /api/decks/reset, /api/reset-all
- `03_DECISIONS.md`: decisión arquitectónica
- `tasks/2026-09-18-1600-codex-web-backend-solution.md`: plan completo

**A crear**:
- `vercel.json`: configuración Vercel
- `api/stats/detailed.js`: estadísticas en Node.js
- `api/decks/reset.js`: reset endpoint
- `api/reset-all.js`: reset total endpoint
- `api/study/queue.js`: próximas tarjetas
- `api/review.js`: registra repaso
- `api/sync/pull.js`: lee cambios Firebase
- `api/sync/push.js`: escribe cambios Firebase

**A modificar**:
- `dist/app.js`: agregar Firebase SDK + botones reset + modales
- `dist/sw.js`: offline sync
- `.env.example`: variables Firebase (apiKey, projectId, databaseURL)

**NO MODIFICAR**:
- `clean_engine.py` (solo lectura para referencia SRS)
- `server.py` (ya tiene endpoints)
- Rediseño visual (completado)

---

## CRITERIOS DE ACEPTACIÓN

- ✅ Web muestra estadísticas iguales a desktop
- ✅ Botones reset funcionan (mazo individual + total)
- ✅ Modales de confirmación protegen contra clicks accidentales
- ✅ Sincronización multi-dispositivo <2 segundos
- ✅ Offline mode guarda localmente
- ✅ Reconexión sincroniza automático sin pérdida
- ✅ Algoritmo SRS JavaScript = Python 100%
- ✅ Pruebas: vercel.app funciona sin Python local
- ✅ check-brain.ps1 PASS

---

## RIESGOS DOCUMENTADOS

⚠️ **Conflictos simultáneos**: mismo mazo editado en laptop Y celular al mismo tiempo
- Mitiga: last-write-wins timestamp, field-level merge

⚠️ **Cuota Firebase**: plan Spark = 100 conexiones, 1GB almacenamiento
- Mitiga: cache en IndexedDB, upgrade si crece

⚠️ **Algoritmo SRS web ≠ Python**: retención, forecast deben ser EXACTOS
- Mitiga: copiar clean_engine.py SRS línea por línea, pruebas de validación

⚠️ **Revlogs offline colisionan**: creados sin conexión vs. cloud
- Mitiga: timestamp local + reconciliación determinista

---

## PRIMER PASO CONCRETO

1. Leer completamente `tasks/2026-09-18-1600-codex-web-backend-solution.md`
2. Leer `03_DECISIONS.md` (arquitectura)
3. Revisar `clean_engine.py` líneas ~1400-1500 (algoritmo SRS)
4. Crear `vercel.json` básico
5. Crear `api/stats/detailed.js` (replicar `get_detailed_stats`)
6. Verificar con tests

---

## HERRAMIENTAS RECOMENDADAS

- **Firebase Console**: console.firebase.google.com
- **Vercel CLI**: `npm i -g vercel` (para pruebas locales)
- **Node.js**: v18+ (Vercel usa Node.js runtime)
- **Postman o curl**: pruebas de funciones Vercel

---

## BLOQUEOS A RESOLVER

❌ **Firebase credenciales**: usuario debe proporcionar o crear proyecto
❌ **Vercel deployment**: requiere que repo esté en GitHub
❌ **Node.js en local**: necesario para pruebas antes de deploy

---

## NOTAS PARA CONTINUIDAD

- Usuario confía en que sincronización será estable
- Multi-dispositivo es CRÍTICO (laptop, celular, tablet)
- Sin pérdida de datos es obligatorio
- Estadísticas deben ser exactas (consultadas en Mi progreso)

---

## MENSAJE DEL USUARIO

> "Quiero que funcione bien. Estadísticas, sincronización estable entre dispositivos. Has documentado todo en el cerebro para que otros agentes lo vean."

**Traducido**: Calidad y estabilidad sobre velocidad. Documentar cada paso.

---

## SIGUIENTE CHECKPOINT

Cuando termines cada fase, actualiza `tasks/2026-09-18-1600-codex-web-backend-solution.md`:
- ✅ Marca hito como completo
- 📝 Registra errores encontrados y cómo se resolvieron
- 🧪 Incluye resultados de pruebas
- 📌 Indica siguiente paso

---

## CONTACTO CON USUARIO

- No publiques ni hagas push sin autorización explícita
- Confirma decisiones de arquitectura antes de implementar
- Avisa si encuentras cambios que no estén documentados
- Sincroniza con `03_DECISIONS.md` si descubres riesgos nuevos

---

**Buena suerte. El plan está sólido. Ahora es cuestión de ejecución cuidadosa.**

