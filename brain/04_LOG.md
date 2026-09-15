---
tags: [lumcards, registro]
updated: 2026-09-15
---

# Registro de trabajo

## 2026-09-15 — Avances consolidados subidos a GitHub y desplegados en Vercel

- Resultado: suite completa validada (87 pruebas Python y 5 suites Node/JS), activos sincronizados de `dist/` a `docs/`, exclusión de DLLs temporales de raíz en `.gitignore`, commit `8e0cec5` subido con éxito a `origin/main` en GitHub y despliegue en producción verificado en `https://lumcards.vercel.app` (código HTTP 200, scripts y estilos actualizados).
- Archivos: `.gitignore`, `dist/`, `docs/`, `clean_engine.py`, `brain/` y archivos del repositorio.
- Validación: suites automatizadas 100% OK, `git push origin main` con salida 0, comprobación HTTP directa de Vercel y `tools/check-brain.ps1` en `OK`. Ficha: [[tasks/2026-09-15-1307-antigravity-subir-github-desplegar-vercel]].

## 2026-09-15 — Capacidades de Codex y Antigravity inventariadas

- Resultado: registradas 83 skills declaradas y nueve servidores MCP visibles de Antigravity, además de las capacidades actuales de Codex, su aplicación probable a Lumcards y el protocolo para pedir herramientas nuevas.
- Límites: inventario basado en capturas/listado aportados; no se probaron credenciales ni llamadas reales. Ninguna capacidad se trató como autorización para operar servicios externos.
- Archivos: `brain/10_AGENT_CAPABILITIES.md`, portada, estado, backlog, decisiones, relevo y ficha.
- Validación: 83/83 nombres presentes, `git diff --check -- brain` sin errores y `tools/check-brain.ps1` en `OK` (21 notas, 59 enlaces, 6 fichas, 3 entradas de agente). Ficha: [[tasks/2026-09-15-1306-codex-capacidades-agentes]].

## 2026-09-15 — Carpetas, renombrado y Mi progreso restaurados

- Resultado: normalización y migración respaldada de jerarquías, fusión de duplicados sin pérdida de tarjetas, carpetas vacías persistentes, totales agregados, creación/movimiento/renombrado visibles y contrato completo de estadísticas detalladas.
- Archivos: `clean_engine.py`, `server.py`, `dist/app.js`, `dist/index.html`, `dist/sw.js`, pruebas y `brain/`.
- Validación: 87 pruebas Python y cinco suites Node/JS correctas; API y UI reales verificadas con 3.971 tarjetas conservadas, una carpeta con siete mazos, `Mi progreso` operativo y consola sin errores. No se empaquetó ni publicó una nueva versión.
- Ficha y continuidad: [[tasks/2026-09-15-0047-codex-regresiones-motor-carpetas-progreso]], [[08_HANDOFF]].

## 2026-09-14 — Motor limpio independiente sin AGPL y corrección de juegos

- Resultado: Implementado y completado el motor limpio independiente `clean_engine.py` (Python puro + SQLite) con eliminación total de `anki==26.8.1`. Soporte universal para tarjetas básicas, inversas, cloze, oclusión de imagen nativa, medios comprimidos con zstandard, historial `revlog` y cálculo de estadísticas. Corregida filtración de `frontKey`/`backKey` en `dist/study-games.js`.
- Archivos: `clean_engine.py`, `engine.py`, `dist/study-games.js`, `requirements-lock.txt`, `brain/`.
- Validación: 83 pruebas de Python pasando 100% en verde; 5 suites de Node/JS pasando 100% en verde.
- Ficha y continuidad: [[tasks/2026-09-14-2240-antigravity-motor-independiente]], [[08_HANDOFF]].

## 2026-09-13 — Memoria para Codex, Antigravity y Claude

- Resultado: protocolo unico, reglas de entrada, checkpoints, relevo, guia y plantillas por tarea.
- Archivos: `AGENTS.md`, `CLAUDE.md`, `.agents/rules/brain.md`, `brain/`, `tools/check-brain.ps1`.
- Validacion: verificador OK; prueba negativa detecta cuatro clases de errores. Carga en otras herramientas aun no comprobada.
- Ficha y continuidad: [[tasks/2026-09-13-2254-codex-cerebro]], [[08_HANDOFF]].

## 2026-09-13 — Cerebro de Obsidian

- Resultado: creado vault documental, índice mínimo e instrucciones persistentes para Codex.
- Archivos: `AGENTS.md`, `.obsidian/`, `brain/`.
- Validación: enlaces locales y estructura comprobados; Obsidian detectado en este equipo.

## 2026-09-13 — Limpieza del proyecto

- Resultado: eliminados `node_modules`, cachés Firebase/Android/Python, compilaciones Android y registros temporales.
- Conservado: colección, historial de práctica, copias, APK, ZIP, `.venv`, instaladores y código exportado.
- Validación: 20 pruebas del importador pasan; el motor y servidor importan correctamente.

## 2026-09-11 — Escritorio, juegos e importación

- Resultado: ventana Windows con WebView2; elección, escritura y parejas; vista previa e importación de texto; historial de partidas.
- Validación histórica: prueba nativa de escritorio, pruebas HTTP temporales y rondas de interfaz completadas.
- Nota: el repositorio recibió cambios posteriores; volver a ejecutar la suite completa antes de publicar.
