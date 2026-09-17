---
tags: [lumcards, tarea]
---

# Tarea: selección jerárquica y diseño de Jugar y aprender

## Control

- ID: 2026-09-17-0630-codex-juegos-carpetas
- Estado: lista_para_relevo
- Responsable y sesión: Codex, planificación con terminal; ejecución propuesta para Antigravity.
- Actualizado: 2026-09-17T07:15:00-05:00
- Entorno: D:\CODEX, main, base indicada en relevo 9943bf9; cambios ajenos preservados; ejecutado por Antigravity.

## Objetivo y aceptación

Usuario pide elegir mazos navegando carpetas, mejor presentación de Juegos e ideas de nuevos juegos/animaciones. Esta ficha separa mejora solicitada del selector de propuestas de juegos aún por elegir. No implementar todos los juegos por inferencia.

### Etapa 1 — selector y presentación, plan para ejecución

- Sustituir selector plano de Practicar por botón compacto con selección actual que abra explorador accesible: raíz muestra solo carpetas y mazos sueltos, no todos los descendientes mezclados. Un clic/toque en carpeta abre sus hijos inmediatos; ruta navegable y Volver; subcarpetas anidadas soportadas.
- Propuesta de interacción: acción explícita 'Elegir toda esta carpeta', separada de abrir, con texto 'Incluye sus submazos'. No depender del doble clic/doble toque: opcional solo como atajo, nunca única vía ni interferencia con navegar. Elegir mazo no comienza juego; confirmar selección y volver a pantalla de modos.
- Conservar 'Todos mis mazos' como opción explícita. Una selección por sesión (mazo, carpeta o todos); no añadir multiselección en este hito. Resumen visible de ruta, tarjetas disponibles y tamaño de sesión; distinguir total de elegibles según reglas de cada juego. No sumar conteos agregados de padres e hijos duplicando tarjetas.
- Búsqueda global con resultados mostrando ruta completa, nombres homónimos diferenciados y sin duplicación. Vacíos y carpeta sin tarjetas explicados; deshabilitar iniciar si no hay contenido compatible, sin crear datos ficticios.
- IDs estables y parentesco del modelo como fuente; si se necesita derivar jerarquía de nombres legacy, usar delimitador exacto y resolver padres ausentes sin modificar nombres ni datos. No agrupar por coincidencia parcial.
- Elegir carpeta incluye todas sus tarjetas descendientes y las propias, una vez por ID. Verificar camino servidor y fallback local/offline: actualmente practice.js contiene filtrado exacto por deckId en fallback; no asumir que cubre descendientes. Mantener mismo conjunto de tarjetas en modos actuales, límites de sesión y recuentos.
- No reemplazar ciegamente deckSelect compartido: también sirve al mazo DESTINO de importación, que no representa una selección recursiva. Mantener destino/importación intactos.
- Aspecto: jerarquía simple '1. Contenido / 2. Tamaño / 3. Juego', selección resumida compacta, tarjetas de modos con iconos coherentes del proyecto, descripción de una línea, dificultad/tiempo solo si son reales y un CTA claro. No mostrar títulos, estadísticas o medallas inventados.
- Explorador con altura acotada y lista interna desplazable para biblioteca grande; en móvil panel/página de ancho útil sin overflow horizontal. Teclado, foco visible, Escape, devolución del foco y botones táctiles cómodos; usar patrones accesibles sencillos en vez de un árbol ARIA incompleto.
- Animaciones breves y funcionales (orientativamente 120–200ms) al abrir carpeta, seleccionar y responder; sin animaciones permanentes detrás de la pregunta, parpadeos ni confeti por cada acción. Respetar prefers-reduced-motion; sonido opcional y nunca autoplay. Interacciones siguen funcionando con animación desactivada.

### Etapa 2 — ideas, NO implementar sin elegir alcance

- Torre del conocimiento: una respuesta resuelta permite colocar una pieza y construir una torre; error muestra explicación y vuelve a practicar más tarde. Turnos sin caída forzada mientras se lee; identidad visual propia. Propuesta inicial preferida por simplicidad y compatibilidad con preguntas largas.
- Expedición: avanzar por un recorrido corto con preguntas y cierre de sesión; sin pérdida de progreso por fallar ni presión de tiempo obligatoria.
- Parejas por rondas: mejorar juego existente con rondas pequeñas, transiciones claras y resumen de errores antes de introducir otro motor.
- Una mecánica de piezas inspirada en la idea del usuario se puede diseñar, pero no usar Tetris como nombre del producto ni copiar recursos externos. No afirmar aprobación legal; cualquier juego/material de terceros requiere revisión de derechos aparte.
- Separar resultado lúdico del historial de repaso espaciado; no modificar programación de tarjetas por puntos/velocidad sin decisión posterior. Contenido de cualquier materia, sin convertir la plataforma en exclusiva de medicina.

## Archivos y alcance

- Antigravity ejecutó: `dist/practice.js`, `dist/practice.css`, `dist/practice.html`, `dist/sw.js`, espejos `docs/`, `clean_engine.py`, `tests/test_clean_engine.py`, `tests/test_practice_http.py`, `tests/test_practice_folder_selection.cjs`. Sincronizado a `%LOCALAPPDATA%\Programs\Lumcards\dist\`.
- Conservado: importador (#import-deck intacto), audio, datos y juegos de Etapa 2 no implementados.

## Checkpoint

- 06:30–06:34: leídos AGENTS, HOME, relevo y ficha previa; git status revisado. Plan de Codex guardado.
- 06:45–07:15 (Antigravity):
  1. Explorador jerárquico modal en `practice.js` y `practice.css`: navegación (`Abrir ➔`) separada de selección (`Elegir toda esta carpeta`), migas de pan interactivas, hero banner con botón de selección completa, búsqueda global con rutas completas y diferenciación de homónimos.
  2. Resumen de selección en home con pasos `«1. Contenido a practicar»`, `«2. Tamaño de sesión»`, `«3. Modo de juego»`.
  3. Preservado selector de destino de importación `#import-deck`.
  4. Soporte recursivo de descendientes sin duplicar tarjetas tanto en `clean_engine.py` (creación automática de ancestros y resolución en `_deck_id`) como en fallback offline con `Set`.
  5. Responsive en 4 viewports con media query móvil (`max-width: 560px`) y soporte para `prefers-reduced-motion`.
  6. Actualizada versión de caché a `20260917-practice-folders` y sincronizado a la instalación local.
  7. Etapa 2 (juegos nuevos) intacta y no implementada.

## Validación

- Suite Chromium Playwright dedicada: `node tests/test_practice_folder_selection.cjs` PASS (100% OK).
  - Verificado en 4 resoluciones: escritorio (1366x768), laptop/tablet (1024x650), móvil vertical (390x844) y móvil horizontal (844x390).
  - Navegación multinivel (`Idiomas` -> `Ingles` -> `Vocabulario`, `Gramatica`), migas de pan y selección completa.
  - Inicio de juego en carpeta con descendientes: 33 tarjetas elegibles únicas, 0 duplicados.
  - Búsqueda global con homónimos: `Vocabulario` muestra `Idiomas ➔ Ingles ➔ Vocabulario` y `Examenes ➔ Ingles ➔ Vocabulario` sin colisión.
  - Selector de importación `#import-deck` verificado intacto con sus 13 opciones intactas.
  - Fallback offline verificado: resolución y deduplicación de IDs descendientes sin servidor.
  - 18 capturas visuales generadas en `tests/screenshots_practice_folders/`.
- Regresiones ejecutadas:
  - `python -m unittest tests/test_clean_engine.py`: PASS (10/10 tests OK).
  - `python -m unittest tests/test_practice_http.py`: PASS (7/7 tests OK).
  - `node tests/test_import_menus_verify.cjs`: PASS (4/4 tests OK).
  - `node tests/test_preview_legibilidad_verify.cjs`: PASS.
  - `node tests/test_ux_study_audio.cjs`: PASS.
- Dist/docs sincronizados y paridad con `%LOCALAPPDATA%\Programs\Lumcards\dist\` completada.
- Sin cambios en biblioteca del usuario (`data/` intacto) y sin commit/push/publicación.

## Pendiente y primer paso

- Codex: revisión independiente de la selección jerárquica de carpetas y capturas asociadas.
- Pendiente de decisión del usuario: alcance y prioridad de las propuestas lúdicas de Etapa 2 (Torre del conocimiento, etc.).

## Bloqueos y procesos

- Ninguno. Servidores temporales cerrados limpiamente. Procesos previos no verificados.

## Cierre

- Etapa 1 completada y validada en 4 viewports con Chromium. Ficha entregada en `lista_para_relevo` para Codex. [[08_HANDOFF]].
