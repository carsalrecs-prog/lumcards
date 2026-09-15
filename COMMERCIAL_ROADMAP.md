# Compatibilidad, marca y futura venta

Revisión técnica y orientación inicial: 11 de septiembre de 2026. Richard todavía no ha elegido entre código abierto y privado. Este documento no concede licencias ni certifica que el producto esté listo para venderse; antes del lanzamiento, un abogado de propiedad intelectual debe revisar el producto concreto y los países de venta.

## Decisión de negocio

| Ruta | Ventaja | Obligación o coste | Estado actual |
| --- | --- | --- | --- |
| Comercial con código abierto compatible con AGPL | Aprovecha el motor de Anki y su compatibilidad ya comprobada. Se puede cobrar por distribución, soporte o servicios. | Cumplir la licencia de la obra cubierta: avisos, código fuente correspondiente y derechos de modificación y redistribución. Revisar también la cláusula de interacción por red de AGPL. | Es la base técnica actual; falta preparar el cumplimiento de una distribución pública. |
| Comercial con implementación privada | Permite reservar el código propio, sujeto a las licencias de cada dependencia. | Sustituir el motor de Anki con implementación independiente y bibliotecas adecuadas, o conseguir una licencia alternativa suficiente. Mayor trabajo de compatibilidad y migración. | No existe todavía un motor independiente. |

La venta no está prohibida por ser software libre. Cobrar no permite quitar a los destinatarios los derechos que les concede la licencia. Tampoco implica que debas ofrecer gratuitamente el instalador al mundo: la distribución a tus clientes y sus derechos posteriores son cuestiones distintas. [FAQ de GNU sobre venta y redistribución](https://www.gnu.org/licenses/gpl-faq.en.html#DoesTheGPLAllowMoney).

AGPL contempla ofrecer el código correspondiente de una versión modificada a los usuarios que interactúan remotamente con ella. El alcance exacto sobre una aplicación combinada requiere revisar cómo se integra y distribuye. No asumimos que poner una API HTTP entre componentes elimina obligaciones. [Texto de AGPL, especialmente secciones 5, 6 y 13](https://www.gnu.org/licenses/agpl-3.0.html).

## Qué contiene este proyecto

El paquete `anki==26.8.1` declara `AGPL-3.0-or-later` en sus metadatos locales. `engine.py` importa `Collection`, `RustBackend`, tarjetas y configuración: utiliza el motor para almacenamiento, plantillas, programación, importación y exportación. `server.py` también tiene accesos directos a la colección. Por tanto, no se trata únicamente de abrir un formato de archivo. [Licencia del código oficial de Anki](https://github.com/ankitects/anki/blob/main/LICENSE).

Los módulos nuevos `text_import.py`, `practice_store.py` y `dist/study-games.js` son implementaciones originales sin dependencia de Anki. Se integran en este prototipo mediante adaptadores. Esa separación facilita una futura migración, pero no convierte por sí sola al conjunto actual en un producto de código privado.

La ventana usa Microsoft WebView2; su SDK incluye licencia en `tools/vendor/webview2/LICENSE.txt`. KaTeX incorpora licencia MIT en su carpeta. El motor incluye además dependencias nativas y Python: antes de distribuir hacen falta inventario completo, avisos, textos de licencia y fuentes correspondientes donde se requieran. El README no sustituye esos elementos.

## Nombre y contenidos

**No utilizar «Anki 2.0» como marca del lanzamiento comercial sin autorización suficiente.** La web oficial identifica Anki como marca registrada de Ankitects Pty Ltd. La decisión prudente es elegir nombre y logotipo propios y describir la compatibilidad de forma precisa, sin sugerir afiliación. No se ha hecho una búsqueda de disponibilidad de una nueva marca. [Web oficial de Anki](https://apps.ankiweb.net/).

El cambio de marca debe incluir ventana, instalador, accesos directos, web y documentación. Los nombres internos de carpetas y claves deben migrarse conservando perfiles, mazos e historial. Por ahora se conserva el nombre del prototipo local para no imponer una marca aún no elegida.

Los archivos que importe el usuario pueden contener textos, imágenes o audios de terceros. Poder leer un paquete no concede permiso para vender o redistribuir su contenido. Los instaladores nuevos excluyen `data`: no deben incluir tu colección ni mazos de otros autores por defecto.

## Aprendizaje mediante juegos

Podemos desarrollar mecánicas generales de emparejar, responder, escribir y practicar errores con código, textos y diseño propios. Como referencia de EE. UU., las ideas, métodos y sistemas se distinguen de su expresión protegida; eso no resuelve automáticamente cuestiones de patentes, marcas o competencia en todos los países. [U.S. Copyright Office, Circular 33](https://www.copyright.gov/circs/circ33.pdf).

No se integra código, interfaz, logotipo ni banco de contenidos de Quizlet. Tampoco hay scraping, inicio de sesión en Quizlet ni descarga de conjuntos ajenos. Sus términos y los derechos de los autores deben respetarse. [Condiciones de Quizlet](https://quizlet.com/tos).

La ayuda oficial permite al creador exportar términos y definiciones de sus propios conjuntos como texto. Esa salida puede importarse como TSV/TXT. No supone compatibilidad con imágenes, modos de juego ni con todo el contenido de la plataforma. [Exportación oficial de conjuntos](https://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets).

## Funcionalidad implementada en esta entrega

- Ventana propia de Windows con WebView2, sin Chrome externo al iniciar.
- Importador original de CSV, TSV, TXT tabulado y JSON, con vista previa antes de guardar.
- Modos originales de elección múltiple, escritura y parejas, a partir de tarjetas de texto.
- Historial de partidas independiente de los eventos de repaso. Jugar no cambia los intervalos de estudio.
- Compatibilidad Anki conservada mediante el motor actual; no se afirma independencia de AGPL.

Las partidas se guardan en `data/practice.sqlite3`. Los paquetes `.colpkg` siguen conteniendo la colección Anki y sus medios; **no incluyen este historial de juegos**. Para conservar ambos, respalda la carpeta `data` con la aplicación cerrada. La sincronización P2P actual tampoco transfiere todavía el historial de juegos.

## Orden recomendado antes de vender

1. Elegir licencia comercial y marca tras la revisión jurídica. En Perú, revisar disponibilidad/registro con Indecopi; añadir revisión de los demás mercados previstos. [Servicios de Indecopi](https://www.gob.pe/indecopi).
2. Si se elige código privado: contratos neutrales de biblioteca, renderizado, planificador, medios e importación; motor y esquema propios; lector Anki independiente por niveles comprobados. Mantener una copia intacta de la colección original durante la migración.
3. Si se elige AGPL: preparar licencias, avisos, código correspondiente reproducible y mecanismos de entrega; revisar dependencias y la modalidad por red.
4. Empaquetar desde un entorno limpio, sin datos privados ni rutas Python del equipo de desarrollo; comprobar instalación en otro Windows.
5. Probar compatibilidad real con paquetes antiguos/modernos, cloze, medios, programación y errores de importación antes de publicitar cada capacidad.

No se ha publicado ni enviado el proyecto a terceros con esta entrega.
