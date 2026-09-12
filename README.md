# Lumcards — Tu espacio personal de aprendizaje y memorización

**Lumcards** es una aplicación moderna e independiente de estudio, tarjetas de memoria y juegos de repaso interactivo para Windows. Ofrece interoperabilidad técnica con paquetes `.apkg`/`.colpkg` y exportaciones de texto/Quizlet, incorporando una experiencia de usuario de nueva generación con aceleración por hardware (Microsoft WebView2), modos de juego estilo Quizlet y almacenamiento local privado.

---

## Instalación y accesos directos en Windows

1. Haz doble clic en **Instalador Lumcards.exe** dentro de la carpeta de la aplicación (o ejecuta **Instalar Lumcards.cmd**).
2. El asistente creará los accesos directos en tu **Escritorio** y en el **Menú Inicio** con el icono oficial de Lumcards.
3. Puedes iniciar la app directamente desde el icono de **Lumcards** en tu escritorio o buscando "Lumcards" en Windows.

## Iniciar y cerrar la aplicación

1. Haz doble clic en el acceso directo de **Lumcards**, en **Lumcards.exe** o en **INICIAR LUMCARDS.cmd**.
2. Se abrirá la ventana dedicada de **Lumcards**, fluida y sin distracciones del navegador. Si ya estaba abierta, el acceso directo recupera esa misma ventana.
3. Para cerrar la aplicación y el servicio de fondo, usa **Cerrar Lumcards.exe** o el acceso directo **Cerrar Lumcards** en el Menú Inicio.
4. Para desinstalarla y limpiar accesos directos preservando tu biblioteca de tarjetas, ejecuta **Desinstalar Lumcards.cmd**.

---

## Suite Completa de Modos de Aprendizaje y Juego

Lumcards supera las limitaciones tradicionales combinando algoritmos de repetición espaciada con las mecánicas de juego más efectivas:

1. **Aprender (Learn):**
   - Preguntas generadas dinámicamente con distractores inteligentes basados en tus propias tarjetas.
   - Refuerzo adaptativo: las tarjetas difíciles se repiten hasta dominarlas.
2. **Parejas (Match):**
   - Cuadrícula de emparejamiento contrarreloj con cronómetro en milisegundos y registro de récords locales.
   - Animaciones fluidas con sacudida en error y desvanecimiento al acertar.
3. **Prueba (Test):**
   - Exámenes integrales balanceados: Opción Múltiple (40%), Verdadero/Falso (30%) y Respuesta Escrita (30%).
   - Calificación final con desglose detallado de respuestas correctas e incorrectas.
4. **Fichas 3D (Flashcards):**
   - Fichas interactivas con giro 3D realista, soporte para atajos de teclado (Espacio para girar, Flechas para navegar) y marcas de tarjetas difíciles.
5. **Escribir (Write):**
   - Modo de escritura con evaluación difusa (algoritmo Levenshtein tolerante a pequeñas erratas) y botón de anulación manual.
6. **Elección Múltiple (Choice):**
   - Práctica rápida de selección múltiple con feedback visual instantáneo.

---

## Compatibilidad e Importación Universal

- **Lector Limpio de Mazos:** Lector independiente (`clean_anki_importer.py`) implementado con SQLite y compresión estándar de Python, sin copyleft ni dependencias AGPLv3.
- **Importador de Quizlet y Texto:** Soporta archivos TSV, CSV, texto separado por guiones o tabulaciones, e importaciones directas de Quizlet.
- **Tarjetas Multimedia:** Soporta imágenes, audio, fórmulas matemáticas KaTeX y oclusión de imágenes.

---

## Aviso Legal y Propiedad Intelectual

*Lumcards* es un software independiente desarrollado de forma original.
- "Anki" es una marca comercial de Ankitects Pty Ltd.
- "Quizlet" es una marca comercial de Quizlet Inc.
Cualquier referencia a dichas marcas en esta documentación o en la aplicación se realiza con fines estrictamente informativos y descriptivos de interoperabilidad técnica (Uso Justo Nominativo / Nominative Fair Use), sin sugerir afiliación, patrocinio ni respaldo por parte de sus respectivos titulares.

## Dónde se guarda todo

| Archivo o carpeta | Contenido |
| --- | --- |
| `data/collection.anki2` | Tarjetas, notas, mazos, historial, favoritos y meta diaria |
| `data/collection.media/` | Imágenes, sonidos y otros archivos de las tarjetas |
| `data/backups/` | Copias completas `.colpkg` con multimedia |
| `data/practice.sqlite3` | Historial local de juegos; no se incluye en `.colpkg` ni en la sincronización actual |
| `data/server.log` y `data/server-error.log` | Registro de inicio y errores |
| `%LOCALAPPDATA%/Anki2/WebView2/` | Perfil del visor integrado y preferencias de la interfaz |
| `%LOCALAPPDATA%/Anki2/window.json` y `desktop.log` | Posición de la ventana y registro del iniciador |

Conserva la carpeta **data**. Para una copia portátil, usa **Exportar colección** y guárdala también fuera de este disco. No abras simultáneamente `data/collection.anki2` con otra aplicación. Exporta un `.colpkg` si quieres usar tu contenido en Anki.

Al importar una copia `.colpkg`, las notas y la programación se **combinan** con la biblioteca actual; no se realiza una restauración destructiva exacta. Se conservan la meta y los favoritos actuales. El archivo exportado contiene esa configuración para conservarla como parte de la colección original.

## Compatibilidad y límites de esta primera versión

- Se han probado paquetes antiguos y modernos con archivos reales generados por Anki, incluyendo multimedia, cloze, historial y oclusión de imágenes. Las plantillas con funciones especiales pueden necesitar ajustes.
- Un `.anki2` suelto no contiene imágenes ni audio. Exporta `.apkg` o `.colpkg` desde Anki para transferirlos juntos.
- Las **plantillas importadas se conservan** y sus campos se pueden editar aquí. Todavía no hay un editor visual de plantillas ni un editor gráfico para dibujar nuevas máscaras de oclusión.
- No se ejecuta el JavaScript de las tarjetas. Complementos, TTS del sistema y plantillas interactivas especiales pueden necesitar Anki de escritorio.
- La **oclusión de imágenes nativa** tiene un visor propio para rectángulos, elipses y polígonos sin giro. Notas con rotaciones, anotaciones de texto, colores especiales, medios inválidos o geometría no admitida permanecen ocultas y se pueden omitir por hoy. Se usan colores de máscara fijos y el encabezado y contenido adicional se muestran como texto; no se aplica el CSS importado que podría ocultar máscaras.
- Las fórmulas entre `\( … \)`, `\[ … \]` o `$$ … $$` se renderizan con KaTeX. No se ejecutan configuraciones JavaScript de MathJax; algunas macros avanzadas no son compatibles. Se conservan imágenes LaTeX ya incluidas, sin generar nuevas imágenes mediante programas externos.
- No incluye sincronización con AnkiWeb, cuenta en la nube ni app móvil instalable. Puedes trasladar la colección mediante archivos.
- Límite de importación: 500 MB por archivo. Archivos del editor: 30 MB. El panel principal carga conteos; el explorador carga páginas de 50 tarjetas y solo renderiza la tarjeta que abres. La búsqueda admite filtros como `tag:geografia`, `is:new` y `is:due`.
- La meta diaria es motivacional; los límites y tiempos de estudio los decide el planificador de Anki y la configuración de cada mazo. «Repasadas hoy» cuenta respuestas, no necesariamente tarjetas distintas. El día de estudio sigue el cambio de día de Anki.
- Las copias incluyen multimedia y no se borran automáticamente. Vigila el espacio disponible y conserva una copia externa antes de retirar copias antiguas.

## Atajos

| Atajo | Acción |
| --- | --- |
| `Ctrl + K` | Buscar en la biblioteca |
| `Espacio` | Mostrar la respuesta |
| `1`, `2`, `3`, `4` | Calificar la tarjeta revelada |
| `Esc` | Cerrar un cuadro de diálogo |

## Desarrollo y pruebas

Estructura: `server.py` sirve la interfaz y la API local; `engine.py` adapta el motor oficial; `dist/` contiene el HTML, CSS y JavaScript editables. No se necesita compilación de frontend ni servicios externos.

La ventana de Windows está en `tools/launcher.cs`. `start.ps1` abre el ejecutable; con `-NoBrowser` inicia únicamente el servidor. El SDK de WebView2 está fijado en `tools/vendor/webview2/version.json`, junto con su licencia. Para compilar el visor, el instalador gráfico y el cierre:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-desktop.ps1 -StageOnly
powershell -NoProfile -ExecutionPolicy Bypass -File tests/test_desktop.ps1
```

La prueba inicia una colección temporal en otro puerto y verifica que la interfaz cargue dentro de una ventana WinForms/WebView2 real. No abre la colección personal. Para copiar la compilación a la raíz de la aplicación, cierra el visor y ejecuta `tools/build-desktop.ps1` sin `-StageOnly`. `installer.iss` es una receta adicional para Inno Setup; este script no la compila.

```powershell
.\.venv\Scripts\python.exe server.py
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
node --check dist/app.js
node tests/test_frontend.cjs
```

Las pruebas usan colecciones temporales, nunca la biblioteca personal. Cubren importaciones modernas y antiguas, duplicados, multimedia, cloze, progreso, persistencia, fallos de importación, recuperación, exportaciones, edición de notas, paginación, máscaras y rutas HTTP. Las pruebas de frontend verifican plantillas, escape de texto, conteos, paginación y renderizado de fórmulas; no sustituyen una prueba visual en navegador.

La interfaz registra opcionalmente `anki2_list_decks` y `anki2_create_card` en navegadores con `document.modelContext`. La app no depende de esa función. No se ha verificado en un navegador con WebMCP habilitado.

## Fuentes y licencia

Para una futura venta, consulta **[COMMERCIAL_ROADMAP.md](COMMERCIAL_ROADMAP.md)**. La decisión entre código abierto y privado sigue pendiente: el prototipo conserva el motor AGPL de Anki y todavía no está preparado como distribución comercial de código privado. El nombre actual también debe revisarse antes del lanzamiento.

El motor oficial de Anki se instala como dependencia; su licencia es **AGPL-3.0-or-later**. Consulta los archivos de licencia de la distribución antes de redistribuir el conjunto. Este proyecto no es una versión oficial de Anki ni está afiliado con Ankitects.

- [Código y documentación de Anki](https://github.com/ankitects/anki)
- [Paquete Python oficial de Anki](https://pypi.org/project/anki/)
- [Paquetes de mazos en el manual de Anki](https://docs.ankiweb.net/importing/packaged-decks.html)
- [KaTeX: visor de fórmulas, licencia MIT](https://katex.org/docs/api)

La dependencia KaTeX 0.18.7 se distribuye en `dist/vendor/katex/` con su licencia. Las fuentes del visor de oclusión están en **IMAGE_OCCLUSION_SOURCES.md**. Pillow se utiliza para validar imágenes locales.

Las ideas para la siguiente versión están en **IDEAS.md**.
