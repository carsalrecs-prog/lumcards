---
tags: [lumcards, tarea]
---
# Tarea: Cierre de formulas Studio locales
## Control
- Estado: hecha
- Responsable y sesión: Codex, misma tarea.
- Actualizado: 2026-09-18T21:13:00-05:00
- Entorno: D:\CODEX main base 66227af; cambios previos preservados, Claude pausado segun usuario.
## Objetivo y aceptación
- Continuar rediseño: formulas reales en editor bajo CSP y offline, sin instalar dependencias. Diagnosticar persistencia aparte sin modificar motor ni almacenamiento por estetica.
## Archivos y alcance
- dist/docs index.html, practice.html, sw.js; tests/test_studio_math_local.cjs y expectativa cache del test remaining; cerebro. KaTeX local ya incluido y licencia MIT presente.
## Checkpoint
- Leidos HOME/HANDOFF/protocolo/ficha previa/status/diffs. CDN bloqueado documentado; vendor local 0.18.7 completo, incluidas fuentes y auto-render. Reutilizar.
## Validación
- Pendiente nueva prueba Chromium; auditoria anterior 567+169 preservada.
## Pendiente y primer paso
- Apuntar HTML a vendor existente y comprobar formula real en iframe a seis tamaños.
## Bloqueos y procesos
- Nube real no disponible para validar. Ningun conflicto nuevo identificado.
## Cierre
- Hito local completado; limites funcionales separados abajo. [[08_HANDOFF]].

## Resultado y evidencia
- HTML index/practice en dist/docs usa KaTeX 0.18.7 ya incluido; sin nuevas dependencias, descarga ni cambios CSP. SW math-r3 precachea JS, CSS, auto-render y fuentes woff2. Queries de otros activos r2 conservadas porque su contenido no cambio.
- tests/test_studio_math_local.cjs: PASS 24 checks (seis tamanos, dos temas y dos preferencias de movimiento), fraccion real, fuentes cargadas, sin overflow, preview offline. Capturas sinteticas tests/screenshots_studio_math: inspeccionadas 390 oscuro y 1366 claro.
- tests/test_studio_math_cache.cjs: PASS registro automatico y scripts/fuentes cacheados en PWA offline. No demuestra persistencia de biblioteca.
- test_ux_study_audio.cjs, test_preview_legibilidad_verify.cjs, test_frontend.cjs: PASS. Python no repetido: no cambios nuevos de backend/contratos.
- test_static_web_e2e.cjs: 1 flujo PASS, 4 FAIL conocidos reproducidos (dia local, timestamp string, fallo de guardado anuncia exito, JSON ilegible reemplazado por demo). No modificados por restriccion expresa de separar almacenamiento/estadisticas del rediseno.
- Paridad SHA256 3/3 activos cambiados, git diff --check PASS. Cambio en test_studio_remaining_design.cjs solo expectativa del nombre cache; suite completa anterior 567 checks no repetida, reemplazada para este cambio por prueba focalizada real.
- Archivos de este turno: dist/docs index.html, practice.html, sw.js; tests/test_studio_math_local.cjs, test_studio_math_cache.cjs, test_studio_remaining_design.cjs; esta ficha, CURRENT/NEXT/LOG/HANDOFF.
- Bloqueos del hito matematico: ninguno. Nube real y cuatro defectos web quedan fuera de este hito; siguiente paso concreto en [[tasks/2026-09-17-2316-codex-reparar-web-estadisticas]]. No cambia el motor ni datos.
- Implementado y probado localmente. No empaquetado, instalado, publicado ni push. Procesos propios terminados. Check-brain PASS: 58 notas, 203 enlaces, 40 fichas.
