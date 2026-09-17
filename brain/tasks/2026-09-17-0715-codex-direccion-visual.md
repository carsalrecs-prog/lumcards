---
tags: [lumcards, tarea, diseno]
---

# Tarea: dirección visual de Lumcards

## Control

- ID: 2026-09-17-0715-codex-direccion-visual
- Estado: lista_para_relevo
- Responsable y sesión: Codex, diseño con imagegen y terminal; consulta UX paralela sin archivos.
- Actualizado: 2026-09-17T07:15:00-05:00
- Entorno: D:\CODEX, main/base 9943bf9 según relevo; git status revisado, cambios ajenos preservados.

## Objetivo y aceptación

Crear dirección estética y proponer animaciones para estudiantes/compradores. Entrega conceptual, no cambio instalado. Se consultó si ejecuta Codex o Antigravity; sin respuesta aún. Mantener reparto previo hasta elección, sin alterar aplicación.

### Dirección: energía al elegir, calma al estudiar

- Marfil #F7F6F2, blanco, texto tinta #202331 e índigo #6554E8; acentos menta/ámbar discretos. Tema oscuro azul noche con contraste medido. Tokens compartidos de colores, espacios, radios y tipografía.
- Títulos editoriales expresivos, cuerpo e interfaz sans legible. Serif opcional solo en grandes títulos; no imponer fuentes decorativas a tarjetas. Mantener logo real: variación de la maqueta NO autoriza rediseño de marca.
- Selección compacta de contenido/sesión conservando explorador de carpetas. Tres modos principales con ilustraciones coherentes, utilidad breve y CTA. Otros modos existentes deben seguir accesibles; no borrarlos por no aparecer en maqueta.
- Sustituir mezcla de emojis por iconos del sistema existente e ilustraciones de tarjetas con material/luz consistentes. Importar texto y resultados como utilidades secundarias. Continuar solo si existe sesión real; no inventar métricas, rachas ni testimonios.
- Estudio sereno: nada moviéndose mientras se lee. Presentación comercial/demo separada sería otra tarea; no implementar landing, pagos ni seguimiento. Atractivo no equivale a ingresos demostrados.

### Movimiento, propuesto y no implementado

- Hover/foco: borde y sombra suave, elevación 2px solo hover, 160ms.
- Abrir carpeta: transición corta de contenido, foco estable, 180-220ms.
- Selección: contorno, icono y texto confirmado, 160ms.
- Voltear: giro corto o fundido, 180-220ms, sin bloquear teclado/audio.
- Responder: confirmación y progreso real, 160-220ms; error sin sacudida punitiva.
- Terminar: celebración pequeña una vez, 500-700ms, y resumen útil.
- Sin partículas continuas, destellos, scroll secuestrado ni autoplay. Cancelar timers al salir; interacción no espera fin del efecto. Respetar prefers-reduced-motion con cambios inmediatos/fundido mínimo.
- Fuente primaria consultada: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html . No implica certificación global WCAG. Controles táctiles cómodos, foco visible, contraste efectivo y zoom probado.

### Hitos posteriores

1. Confirmar ejecutor y auditar entregas pendientes. Comprobar agentes activos antes de tocar practice.js/css.
2. Tokens/componentes de Jugar y aprender en dist/practice.css y practice.js:renderHome. Conservar handlers, selector, audio, importación y fallback offline; no reescribir motor.
3. Responsive real: sidebar plegable, selector apilado y modos compactos en móvil. Laptop baja: reducir ilustración/espaciado, no letra/controles. No convertir bitmap en interfaz ni prometer cero scroll para contenido largo.
4. Movimiento progresivo, sin instalar plugins ni librería 3D por defecto. HTML/CSS/JS y recursos actuales bastan para primera etapa.
5. Pruebas sintéticas: 1366x768,1024x650,390x844,844x390; claro/oscuro, teclado, zoom200%, movimiento reducido, texto largo, estados vacío/carga/error, offline. Capturas inspeccionadas y regresiones de audio, carpetas, importación y bloques.
6. Dist/docs/caché e instalación con evidencia separada. Extensión a Biblioteca/Progreso después; juegos nuevos y monetización siguen como decisiones de alcance aparte.

## Archivos y alcance

- Solo esta ficha, brain/08_HANDOFF.md, brain/02_NEXT.md, brain/04_LOG.md y design/lumcards-juegos-concepto-v1.png, referencia conceptual no funcional.
- Imagen generada con imagegen integrado, sin nueva API/clave. Prompt: UI Lumcards desktop 16:10 en español, marfil/índigo, navegación lateral, contenido/sesión compactos, tres modos actuales con ilustraciones mate de tarjetas y acceso importar/resultados; jerarquía editorial, sin estadísticas falsas. No usar logotipo generado como reemplazo automático.

## Checkpoint

- Falló arranque sandbox/Node; lectura recuperada con ejecución revisada/escalada. Leídos relevo actual, ficha carpetas, git status y protocolo antes de editar. Patcher inicial falló sin guardar; se intenta motor apply_patch directamente.
- Maqueta creada e inspeccionada: texto principal legible, selección prominente y modos claros. Consulta UX secundaria respalda separar atracción comercial de estudio sereno.

## Validación

- Inspección visual de maqueta realizada; no prueba responsive, animaciones ni funcionamiento. No suites funcionales/build/instalación ni auditoría de entregas anteriores en este turno.
- Referencia copiada a design/lumcards-juegos-concepto-v1.png y confirmada por SHA256. tools/check-brain.ps1: OK (33 notas, 117 enlaces, 18 fichas).

## Pendiente y primer paso

- Recoger elección de ejecutor; traducir propuesta a tokens y portada real tras verificar concurrencia. No sustituir archivos completos por maqueta.
- Auditorías pendientes conservadas: [[tasks/2026-09-17-0630-codex-juegos-carpetas]] y [[tasks/2026-09-17-0313-codex-importacion-menus]].

## Bloqueos y procesos

- Proceso sandbox ordinario falla, lectura revisada recuperada. No servidores iniciados/detenidos; actividad ajena no confirmada. Sin commit ni publicación.

## Cierre

- Concepto listo, aplicación sin rediseño implementado. [[08_HANDOFF]].
