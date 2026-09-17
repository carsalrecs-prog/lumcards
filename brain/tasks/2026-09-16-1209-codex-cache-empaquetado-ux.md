---
tags: [lumcards, tarea, escritorio, pwa, cache, empaquetado]
---

# Tarea: hacer efectivas las correcciones UX en el paquete instalado

## Control

- ID: 2026-09-16-1209-codex-cache-empaquetado-ux.
- Estado: hecha.
- Responsable y sesión: Codex, diagnóstico y corrección del empaquetado.
- Actualizado: 2026-09-16T12:16:23-05:00.
- Entorno: `D:\CODEX`, rama `main`, commit base `9943bf9`; preservar cambios UX, reparación del instalador y `.obsidian/graph.json`.

## Objetivo y aceptación

- Conseguir que la instalación Windows muestre realmente las correcciones de Estudio, Juegos y audio ya presentes en `dist/`.
- Renovar de forma coherente la versión de activos y caché en `dist/`, `docs/`, HTML, service worker y pruebas.
- Evitar que una navegación con servidor disponible quede fijada indefinidamente a HTML antiguo del service worker.
- Actualizar la instalación local sin tocar su biblioteca y verificar que entrega los activos nuevos.

## Archivos y alcance

- Previstos: `dist/index.html`, `dist/practice.html`, `dist/sw.js`, sus espejos `docs/`, `tools/launcher.cs`, pruebas HTTP/JS relacionadas, instalación local y memoria.
- No modificar motor, datos, biblioteca, nube ni lógica UX ya aprobada.
- Preservar servidor de desarrollo activo en 8765 y cambios ajenos.

## Checkpoint

- 12:09 - Comparados por SHA256 los ocho activos UX: la instalación contiene exactamente los archivos corregidos. Causa confirmada: las correcciones posteriores reutilizaron `CACHE_NAME` y URLs `20260915-ux`; el service worker usa respuesta cacheada y puede seguir mostrando la primera variante defectuosa. Siguiente: versión nueva y navegación network-first con fallback offline.
- 12:13 - Versión renovada a `20260916-ux2`; registro del service worker fuerza comprobación sin caché y las navegaciones usan red primero con fallback offline. El lanzador añade un identificador único a cada navegación para atravesar incluso una portada atrapada por el service worker anterior. Siguiente: compilar, actualizar instalación y validar.
- 12:15 - El ejecutable raíz antiguo estaba abierto y bloqueaba su reemplazo. Se cerró de forma normal, se copiaron el host y DLL compilados al paquete raíz, y se actualizaron host, instalador y activos en la instalación local sin tocar su biblioteca. La aplicación se reabrió con el ejecutable nuevo.
- 12:16 - Autoprueba nativa con perfil, servidor y datos temporales confirmó `desktopLaunch` en la URL. Los ocho activos instalados coinciden por SHA256 con `dist/`; ejecutables raíz, build e instalado también coinciden. Suite completa verde.

## Validación

- Seis suites Node/JS: correctas; `node --check` correcto para `dist/app.js`, `dist/practice.js` y `dist/sw.js`.
- Suite Python completa: 90/90 correctas, incluidas tres pruebas de contrato de instalación/escritorio.
- Autoprueba WinForms/WebView2 con perfil y datos temporales: correcta; confirmó el parámetro único `desktopLaunch`.
- Paridad: ocho activos de la instalación local idénticos a `dist/` por SHA256; ejecutables de build, raíz e instalación idénticos.
- `dist/` y `docs/` sincronizados; no quedan referencias a `20260915-ux`; `git diff --check` correcto.
- Límite: el conector de control visual no expuso ventanas nativas en esta sesión, por lo que no se obtuvo captura independiente de la ventana reabierta. El host nativo sí pasó su autoprueba y quedó abierto para comprobación del usuario.

## Pendiente y primer paso

- Ningún pendiente técnico de esta corrección. Confirmación visual final disponible en la ventana reabierta.
- Los cambios acumulados siguen sin commit, `push` ni publicación.

## Bloqueos y procesos

- Bloqueos: ninguno.
- Procesos activos: servidor de desarrollo previo en 8765 y Lumcards reabierto con el ejecutable raíz actualizado. Servidores y perfiles temporales cerrados.

## Cierre

- Caché, paquete raíz e instalación local actualizados y validados. No committeado ni publicado. Continuidad en [[08_HANDOFF]].
