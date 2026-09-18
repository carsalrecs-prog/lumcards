---
tags: [lumcards, tarea, diseno, plan]
---

# Plan: coherencia visual del resto de Lumcards

## Control
- ID: 2026-09-17-2305-codex-plan-diseno-resto
- Estado: lista_para_relevo
- Responsable y sesión: Codex prepara dirección; ejecutor futuro por elegir.
- Actualizado: 2026-09-17T23:05:00-05:00
- Entorno: D:\CODEX, main/base cfd9fb6; revisar git status al retomar.

## Objetivo y aceptación
- Usuario pide dejar indicaciones para rediseñar lo demás tras cerrar Jugar y aprender. Este plan está preparado; su implementación NO empieza en este turno.
- Extender la identidad visual de Juegos al resto sin cambiar motor, datos, algoritmos, estadísticas, sincronización ni cobros. No presentar esta mejora visual como aprobación comercial/legal.
- Referencia funcional: dist/practice.html y capa Studio al final de dist/practice.css. Capturas reales en tests/screenshots_practice_studio/. La imagen design/lumcards-juegos-concepto-v1.png es solo concepto, no código.

## Dirección visual común
- Mantener logo Lumcards y voz calmada. Fondo claro marfil #f7f6f2, superficies blancas, texto #242438 y acento índigo #6554df; oscuro #141721 / #1c2130 con texto #eeedf8. No duplicar paletas independientes por pantalla.
- Títulos editoriales Georgia/serif solo en portada y encabezados. Controles, datos y textos de estudio con tipografía de interfaz legible. No imponer tipografía decorativa a tarjetas importadas.
- Espaciado coherente 8/12/16/24/32 px, tarjetas 16-18 px de radio, botones 10-12 px. Contraste comprobado mínimo4.5:1 para texto normal y foco visible; no depender solo de color para estado.
- Una acción primaria por sección. Texto real, estados vacíos útiles y métricas auténticas; nada de compradores, rachas, premios o progreso inventados.
- Animaciones de150-220 ms en hover/foco/transiciones útiles, desplazamientos máximos2-3 px. Sin movimientos continuos durante lectura. Respetar reduced-motion; celebraciones breves al finalizar, sin sonidos automáticos nuevos.
- No instalar diseñador/MCP/librería de animación para esta fase: HTML/CSS/JS nativos y sistema actual bastan. Cualquier dependencia nueva requiere justificar coste/licencia/beneficio y consultarlo.

## Orden de ejecución por entregas pequeñas
1. **Biblioteca y navegación.** Unificar sidebar/topbar/títulos/buscador y jerarquía de carpetas/mazos. Tarjetas con título completo o expansión accesible, conteos reales, progreso discreto y menú de acciones visible. Mantener estudiar, renombrar, mover y eliminar con sus confirmaciones/backup. Vacío, carga, error y nombres largos incluidos.
2. **Tarjetas, favoritos y formularios.** Lista/grid coherentes, filtros legibles y estado repasada/pendiente inequívoco. Crear mazo/carpeta y editor amplios: campos y botones completos, preview lateral útil en escritorio y pestañas/apilado en móvil. Borrador persiste al alternar; preview no guarda, no reproduce audio automáticamente ni cambia repaso.
3. **Estudio y personalizador.** Cabecera/pie compactos, foco en contenido y acciones siempre alcanzables. Contenido corto centrado; largo desplazable desde inicio sin recortes. Preview y estudio comparten renderer. Respetar modo Original y compatibilidad cloze/medios/KaTeX; no esconder overflow ni reducir texto para fingir que cabe. Audio repetible e icono con nombre accesible; no modificar cola/bloques/SRS.
4. **Mi progreso y resultados.** Jerarquía clara: resumen, tendencia y detalle. Colores semánticos consistentes, etiquetas/unidades/leyendas explícitas, alternativa textual a gráficos, filtros persistentes y estados sin datos. Cambiar presentación únicamente: conservar los cálculos web recientes de Antigravity.
5. **Mi espacio y ajustes.** Agrupar cuenta, sincronización, preferencias, importación/exportación y datos. Distinguir conectado/sincronizado/error sin promesas falsas. Acciones destructivas separadas con consecuencias claras. Avisos y modales con el mismo lenguaje visual.

## Archivos y alcance
- Inspección dirigida en dist/app.js (render/eventos de la sección), dist/app.css, dist/student.css, dist/index.html; equivalentes docs/. No leer toda app.js para reconstruir historia.
- Reutilizar tokens y componentes compartidos. Evitar otra capa de overrides globales con !important; identificar qué regla causa el defecto y aislar estilos por componente.
- Solo tocar practice.* para extraer componentes comunes si se acuerda y los tests de Juegos siguen verdes. No cambiar clean_engine.py/server.py ni archivos de usuario por motivos estéticos.
- Caché coherente HTML/CSS/SW, espejo docs y copia instalada son verificaciones distintas. No hacer push/deploy/APK/instalador sin autorización específica.

## Criterios de aceptación por cada entrega
- Capturas e inspección humana en 390x844, 844x390, 1024x650 y1366x768; comprobar además320 px de ancho y reflow equivalente a zoom200%. Ambos temas y reduced-motion.
- Sin scroll horizontal de página, controles recortados, ilustraciones superpuestas ni texto ilegible. Scroll vertical permitido para contenido realmente largo; evitar scrolls anidados innecesarios.
- Teclado: orden lógico, foco visible, Escape/cierre y retorno de foco. Controles táctiles principales44 px; nombre accesible en iconos. Verificar contraste computado, no solo impresión visual.
- Fixtures sintéticos: vacío, mucho contenido, nombres largos, tarjeta corta/larga, imagen/audio y error/offline. Nunca usar ni copiar biblioteca personal para QA.
- Ejecutar suites relevantes: test_frontend.cjs, test_practice_studio.cjs, test_practice_folder_selection.cjs, test_import_menus_verify.cjs, test_preview_legibilidad_verify.cjs, test_study_blocks_and_preview.cjs y test_ux_study_audio.cjs según componentes afectados. Si tocas markup de estadísticas/fallback: test_web_stats.cjs y test_web_study_blocks.cjs.
- Conservar flujo completo, datos/progreso y paridad dist/docs. Registrar comando, resultado, límites y capturas. Separar implementado/probado/instalado/publicado.

## Prompt para el ejecutor futuro
> Lee AGENTS.md, brain/00_HOME.md, brain/08_HANDOFF.md y esta ficha. Confirma qué etapa ha autorizado Richard; no ejecutes las cinco juntas. Revisa git status y solo el código de esa sección. Crea tu ficha con herramienta, objetivo, archivos y criterios antes de editar. Usa Jugar y aprender como referencia funcional y conserva cambios ajenos. Implementa la etapa elegida sin tocar motor/datos ni rehacer estadísticas. Verifica ambos temas, responsive, teclado, reduced-motion y pruebas con datos sintéticos; inspecciona capturas. Guarda checkpoints y entrega evidencia, pendientes y siguiente paso exacto en Obsidian. Ejecuta tools/check-brain.ps1. No declares publicada o instalada una entrega si solo cambiaste dist/docs.

## Checkpoint
- 23:05: preparado plan por cinco etapas con referencia al diseño funcional, restricciones, archivos y aceptación; sin implementar el resto.

## Validación
- Revisión documental del plan; ninguna prueba de implementación del resto porque no comenzó. Validación de memoria mediante tools/check-brain.ps1 al cerrar.

## Pendiente y primer paso
- Pedir autorización para **etapa1: Biblioteca y navegación**; luego inspeccionar sus componentes y registrar ficha de ejecución.

## Bloqueos y procesos
- Decisión de etapa/ejecutor. No hay procesos iniciados ni impedimento técnico conocido.

## Cierre
- Indicaciones preparadas para futuro relevo; resto no implementado. [[tasks/2026-09-17-2300-codex-cierre-diseno]] y [[08_HANDOFF]].
