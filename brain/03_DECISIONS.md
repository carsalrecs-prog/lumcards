---
tags: [lumcards, decisiones]
updated: 2026-09-15
---

# Decisiones

## Confirmadas

### 2026-09-15 — Inventario de capacidades sin permisos implícitos

- Las capacidades observadas de Codex y Antigravity se registran en [[10_AGENT_CAPABILITIES]] para planificar relevos compatibles con cada herramienta.
- Una skill o un servidor MCP instalado no demuestra autenticación ni concede permiso para desplegar, comprar, borrar, publicar o modificar servicios externos.
- Si falta una capacidad, el agente documenta la necesidad, permisos, datos, coste, alternativa y prueba mínima; Richard decide la instalación o conexión de cuenta.
- El inventario es una fotografía fechada y debe verificarse en la sesión ejecutora porque plugins, estados y permisos pueden cambiar.

### 2026-09-15 — Jerarquía canónica de carpetas y mazos

- El motor normaliza tanto `U+001F` de paquetes modernos como `::` al formato persistente `::` usado por Lumcards.
- Una carpeta conserva la marca `lumcardsFolder` aunque esté vacía; los padres inferidos al importar también reciben esa marca.
- Al abrir una colección antigua, los nombres equivalentes se fusionan de forma idempotente, se reasignan las tarjetas sin cambiar sus IDs y se crea una copia `.colpkg` antes de modificar la jerarquía.
- Renombrar una carpeta cambia en cascada sus descendientes; renombrar un mazo conserva su carpeta; los nombres duplicados y los ciclos de movimiento se rechazan.

### 2026-09-14 — Motor independiente limpio (Clean-Room) sin AGPL

- Decisión del usuario: sustituir por completo el paquete oficial `anki==26.8.1` (licencia AGPLv3) para permitir la comercialización cerrada/privada de Lumcards.
- Implementación: `clean_engine.py` como motor autónomo en Python puro + SQLite nativo (`sqlite3`), renderizador estático de plantillas Mustache, soporte para campos nativos de Cloze y Oclusión de Imágenes (`native_image_occlusion.py`), descompresión `zstandard` (licencia permisiva BSD) y parser de mapas multimedia y esquemas Anki 2.1b / SQLite.
- Eliminación de dependencias copyleft: `engine.py` delega directamente a `clean_engine.py`. Se retira `anki==26.8.1` de `requirements-lock.txt` y no se importa en tiempo de ejecución.
- Compatibilidad probada por la suite actual con `.apkg`, `.colpkg`, `.anki2`, historial `revlog`, cálculo de rachas/retención y APIs de `server.py`; no equivale a garantía universal ni a aprobación jurídica.

### 2026-09-13 — Obsidian como memoria del proyecto

- `D:\CODEX` funciona como vault y `brain/00_HOME.md` es la entrada.
- Codex, Antigravity y Claude leen indice, relevo y ficha relevante; otras notas solo bajo demanda.
- La carpeta `brain/` no almacena tarjetas, credenciales ni transcripciones. El vault abarca el repositorio; no confundirlo con la memoria documental.

### 2026-09-13 — Relevo compartido y checkpoints

- Pedido del usuario: continuidad entre las tres herramientas, incluyendo limites de tokens.
- Un protocolo en `AGENTS.md`, entradas breves por herramienta y fichas por tarea; evita estados contradictorios en memorias privadas.
- Guardar por hitos y aproximadamente cada 10 minutos; antes de limites visibles o cambios de agente. El cierre incluye hechos, pruebas, pendientes y siguiente accion.
- Limite: no garantiza guardado tras una terminacion abrupta ni sincronizacion entre equipos. Recuperar desde la ultima ficha y verificar archivos. Detalle en [[07_PROTOCOL]].

### 2026-09-11 — Juegos separados del planificador

- Los resultados de práctica se guardan aparte de los repasos.
- Jugar no cambia intervalos ni registros de repetición por defecto.

### 2026-09-11 — Importación de texto con vista previa

- CSV, TSV, TXT y JSON se analizan como texto literal.
- La confirmación de importación crea respaldo, valida el lote y omite duplicados.

### 2026-09-11 — Aplicación Windows con ventana propia

- El inicio normal usa WinForms y WebView2, sin abrir una pestaña normal de Chrome.
- El servidor sigue siendo local y la ventana se puede ocultar en la bandeja.

## Pendientes de decisión

### Licencia comercial (Resuelta)

- Opción elegida: Opción B (motor propio sin AGPL).
- Implementado y verificado en `clean_engine.py`. Queda pendiente la revisión jurídica externa de términos y marca.

### 2026-09-18 — Web sin Python + Sincronización Firebase (CRÍTICA)

**Decisión autorizada**: Eliminar dependencia de Python en versión web. Usar Firebase Realtime DB + Vercel Functions para paridad desktop/web con sincronización multi-dispositivo.

**Requisitos de Estabilidad (crítico)**:
1. Sincronización confiable: cambios en un dispositivo → visible en todos en <2 segundos
2. Sin pérdida de datos: offline mode con sincronización al reconectar
3. Estadísticas consistentes: mismos cálculos en web y desktop
4. Reset confiable: no puede fallar a mitad del proceso
5. Caché coherente: versión en memoria = versión en BD

**Implementación**:
- Firebase Realtime DB (plan Spark gratuito): almacena mazos, tarjetas, revlogs, progreso
- Vercel Functions (Node.js): replican lógica de `clean_engine.py` para estadísticas, reset, gestión de mazos
- Service Worker: offline + caché inteligente + sincronización al conectar
- Sincronización bidireccional: desktop Python ↔ Firebase API ← web JavaScript

**Riesgos Identificados para Próximos Agentes**:
- ⚠️ **Conflictos simultáneos**: mismo mazo editado en laptop Y celular al mismo tiempo
  - Mitiga: last-write-wins timestamp, field-level merge, nonce deduplicación
- ⚠️ **Cuota Firebase**: plan Spark = 100 conexiones, 1GB almacenamiento
  - Mitiga: monitorear, upgrade si crece; cache en IndexedDB local
- ⚠️ **Algoritmo SRS web**: retención, forecast, ease_factor deben ser EXACTOS vs. Python
  - Mitiga: copiar clean_engine.py SRS línea por línea a Node.js, pruebas de validación
- ⚠️ **Revlogs offline**: creados sin conexión pueden colisionar con cloud
  - Mitiga: timestamp local + reconciliación determinista en servidor

**No confundir**:
- Desktop Python sigue existiendo (no es migración)
- SQLite local sigue existiendo (alternativa para web)
- Sincronización es opcional (usuario elige)

**Responsable**: Codex (sesión 2026-09-18-1600 +)
**Ficha de trabajo**: [[tasks/2026-09-18-1600-codex-web-backend-solution]]

**Actualización 2026-09-18 21:00 (Claude)**: al ejecutar este plan se encontró que `dist/sync-manager.js` y el modo `isWebMode`/`webApi()` de `dist/app.js` YA implementan la web sin Python (estadísticas calculadas en cliente, sincronización con **Firestore** en vez de Realtime DB, auth Firebase completa). No está claro si esto se construyó en una sesión no documentada aquí o si el plan de Fases 1-2 (Vercel Functions + Firebase Realtime DB) nunca llegó a ejecutarse porque ya no hacía falta. **No se han creado Vercel Functions ni se ha usado Realtime DB.** Antes de retomar esas fases, un agente debe confirmar con el usuario si el enfoque actual (cliente + Firestore) es suficiente o si de verdad se requiere backend serverless adicional; construir ambos sería redundante.

### 2026-09-18 — Modelo de negocio: acceso pago manual + tienda de mazos por carrera (VISIÓN)

**Contexto del usuario (Richard)**: el plan comercial es vender acceso a Lumcards + una biblioteca de mazos curados (empezando por Salud: ENAM, MINSA), antes de poder publicar en Play Store / App Store (falta capital). Mientras tanto:

1. **Cobro manual por Yape**: el usuario paga por Yape, Richard confirma el pago a mano y activa el acceso desde un panel de administración. No hay pasarela de pago automática todavía.
2. **Correo administrador**: `carsal.recs@gmail.com` es el correo de Richard como administrador — acceso total, sin necesidad de aprobación, y con permiso para aprobar/revocar el acceso de otros usuarios.
3. **Control de acceso por correo**: cada usuario que inicia sesión con Firebase queda en estado `pendiente` hasta que Richard lo aprueba manualmente. Sin aprobación, no accede a mazos premium (el uso local/gratuito de la app no depende de esto).
4. **Tienda de mazos por carrera (futuro, aún sin inventario real)**: sección tipo catálogo donde se agrupan paquetes de mazos por carrera/especialidad (ej. "Salud → ENAM/MINSA", luego Ingeniería, etc.). Depende de que Richard tenga mazos reales que vender o comprados a terceros — **ojo con la licencia de redistribución si los mazos vienen de otra persona**, ver nota en la ficha del handoff.
5. **Visión a futuro — IA + suscripción mensual**:
   - Convertir fotos de apuntes de clase en preguntas/tarjetas automáticamente.
   - Convertir PPT o PDF (cortos) de profesores en mazos.
   - Modelo de suscripción mensual: o bien paga la IA, o bien paga acceso ilimitado a todos los mazos de la tienda (o ambos, a decidir).
   - Nada de esto está implementado; es dirección de producto, no un compromiso técnico todavía.

**Implementado en esta sesión (Claude, 2026-09-18)**: ver checkpoint en [[tasks/2026-09-18-1600-codex-web-backend-solution]] — admin email configurado, registro de usuario en Firestore con estado de aprobación, panel de administración básico para aprobar/revocar acceso.

**No confundir**: esto NO es una revisión legal de modelo de venta ni de impuestos/facturación en Perú; eso sigue pendiente (ver [[06_LEGAL]]).

### Fuente de publicación

- Definir si `dist/` genera `docs/` o si una de las dos carpetas se elimina del flujo.
