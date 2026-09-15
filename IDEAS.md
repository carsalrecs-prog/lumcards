# Estado de Implementación de Ideas en Anki 2.0

Todas las funciones clave han sido construidas sobre el motor nativo de Anki (`anki.collection`) y empaquetadas con diseño de alta fidelidad, soberanía total de datos y aplicaciones de escritorio nativas para Windows.

---

### Resumen de Funciones Implementadas

1. **Editor visual de plantillas:**
   - [x] **Completado.** Modal interactivo con edición visual de campos Anverso, Reverso y CSS, botones de inserción rápida de campos `{{Campo}}` y previsualización en tiempo real vía iframe.

2. **Dibujar máscaras de imagen (Oclusión de imagen):**
   - [x] **Completado.** Dibujo interactivo con el ratón de rectángulos sobre imágenes subidas, compatible nativamente con el tipo de nota oficial de Anki *Image Occlusion*.

3. **Modo examen:**
   - [x] **Completado.** Práctica focalizada (Tarjetas más difíciles, pendientes o aleatorias) configurable por mazo o biblioteca completa. No altera el algoritmo de repetición espaciada por defecto. Muestra calificaciones porcentuales y resumen de aciertos/fallos.

4. **Convertir apuntes en tarjetas:**
   - [x] **Completado.** Conversor inteligente que procesa formatos `Pregunta : Respuesta`, `¿Pregunta? Respuesta`, clozes `{{c1::...}}` o tabulaciones, permitiendo revisar y editar cada tarjeta antes de crearla en lote.

5. **Plan de estudio flexible:**
   - [x] **Completado.** Configuración por mazo de límites de tarjetas nuevas y repasos diarios, persistido directamente en la configuración oficial de la colección de Anki.

6. **Seguimiento de puntos débiles y sanguijuelas (Leeches):**
   - [x] **Completado.** Diagnóstico automático en la vista de Estadísticas de tarjetas con caídas frecuentes de factor, lapsos repetidos o enunciados largos, con recomendaciones prácticas y botón para reiniciar progreso.

7. **Copias de seguridad y exportación completa:**
   - [x] **Completado.** Creación de backups automáticos y bajo demanda, exportación e importación de paquetes `.colpkg` y `.apkg` con soporte completo de multimedia.

8. **Instalador de Windows y App de escritorio (Idea 8):**
   - [x] **Completado.** 
     - `Anki 2.0.exe`: Binario ejecutable WinExe nativo (C# / .NET) con icono incrustado de alta resolución. Se ejecuta de forma 100% silenciosa en segundo plano (sin consolas CMD emergentes), abre el navegador y coloca un icono interactivo en la bandeja del sistema (System Tray).
     - `Cerrar Anki 2.0.exe`: Ejecutable nativo para apagar el servidor y liberar recursos ordenadamente.
     - `Instalador Anki 2.0.exe`: Instalador gráfico WinForms con barra de progreso, creación de accesos directos en Escritorio y Menú Inicio, registro de desinstalador y preservación estricta de la carpeta de datos del usuario (`data/`).

9. **Sincronización independiente por medios propios (Idea 9):**
   - [x] **Completado.** Soberanía total sin dependencia de AnkiWeb:
     - **Acceso móvil en tiempo real vía Wi-Fi local:** Detección automática de la IP del equipo (`http://192.168.0.x:8765/`) y generación en tiempo real de un código QR vectorial SVG puro (sin librerías externas) para escanear con el teléfono o tablet.
     - **Sincronización P2P directa entre computadoras:** Comunicación punto a punto entre dos equipos con Anki 2.0 en la misma red local mediante endpoints `/api/sync/peer` y `/api/sync/export`, fusionando notas y progresos automáticamente.
     - **Paquetes portátiles de sincronización (USB / Drive):** Exportación e importación de archivos `.colpkg` cifrados transferibles sin pérdida de multimedia ni historial de repasos.
