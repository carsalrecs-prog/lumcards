---
tags: [lumcards, tarea, funcional, estadisticas]
---

# Tarea: Corregir estadísticas, lenguaje y agregar reset

## Control

- ID: 2026-09-18-1524-codex-estadisticas-lenguaje-reset
- Estado: en_curso
- Responsable y sesión: Codex, nueva sesión iniciada por usuario
- Actualizado: 2026-09-18T15:24:00-05:00
- Entorno: D:\CODEX, main, base 66227af (posterior a rediseño visual completado)

## Objetivo y aceptación

**Corregir cuatro defectos funcionales de estadísticas:**

1. **Estadísticas correlacionables**: My progress debe reflejar con precisión lo que realmente se estudió, sin discrepancias con el motor SRS.
2. **Lenguaje claro**: Reemplazar términos confusos ("jóvenes", "maduras", "enterradas", "suspendidas") con etiquetas comprensibles ("Nuevas", "En estudio", "Dominadas", "Pausadas").
3. **Paridad web/desktop**: Las estadísticas en vercel.app deben mostrar lo mismo que el aplicativo de escritorio sin fallos de sincronización.
4. **Reset/reinicio de progreso**: Agregar botones para reiniciar tarjetas por mazo individual o reiniciar todo el trabajo desde cero.

**Criterios de aceptación:**
- Estadísticas en Mi progreso = cálculos exactos del motor sin manipulación
- Términos en UI y web claros y consistentes
- Web y desktop muestran números idénticos
- Botones de reset con confirmación modal, sin datos accidentales
- Todas las suites de prueba siguen verdes
- Sin publicación/deploy sin autorización expresa

## Archivos y alcance

**Previstos para modificar:**
- clean_engine.py: auditar cálculos de estadísticas (reviews, intervals, ease)
- app.js: presentación de términos, agrupación de estados, botones reset
- practice.js: botones reset en interfaz web
- practice.html: interfaz de confirmación reset
- app.css, practice.css, student.css: estilos botones reset y confirmación

**Archivos ajenos a preservar:**
- Rediseño Studio completado (Fase A-D)
- Cambios de arranque de escritorio (Antigravity)
- Datos de usuario en data/
- Motor SRS (solo auditar, no reescribir)

## Checkpoint

- 15:24: usuario autoriza correcciones funcionales de estadísticas. Rediseño visual anterior completado y verificado.
- 15:45: Auditoría de clean_engine.py completada. Encontrados términos en línea 1831-1837 (breakdown_meta).
  - Identificado: 'young': ('Jóvenes'), 'mature': ('Maduras'), 'suspended': ('Suspendidas'), 'buried': ('Enterradas')
  - Reemplazado con descripciones claras: 'En estudio avanzado (1-20 días)', 'Dominadas (>20 días)', 'Pausadas (no incluidas en repaso)', 'Ocultas (sin acceso directo)'
  - Agregadas funciones reset_deck() y reset_all() en clean_engine.py (líneas ~1983-2032)
  - Agregados endpoints /api/decks/reset y /api/reset-all en server.py (líneas ~334-338)
  - Validación: clean_engine.py y server.py compilan sin errores

## Validación

- Python syntax: PASS (py_compile clean_engine.py server.py)
- Endpoints disponibles: /api/decks/reset y /api/reset-all con POST JSON
- Funciones: reset_deck(deck_id) y reset_all() en Engine class
- Lenguaje: descripción clara en todos los estados de tarjeta

## Pendiente y primer paso

- Agregar botones UI en app.js para reset (mazo individual + total con confirmación modal)
- Nota: app.js está minificado; requiere búsqueda/reemplazo cuidadoso o regeneración
- Pruebas de API (curl/Chromium) para endpoints reset
- Pruebas de web parity: verificar que web reciba estadísticas con lenguaje actualizado

## Bloqueos y procesos

- Ninguno identificado aún.

## Cierre

- No terminado. Implementación, pruebas y validación pendientes.
