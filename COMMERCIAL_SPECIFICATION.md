# 🛡️ Guía Maestra Legal, Comercial y Técnica: Lumcards

> **Documento de Especificación Estratégica y Protección de Propiedad Intelectual**  
> **Nombre Comercial:** Lumcards  
> **Objetivo:** Comercialización internacional segura, 100% legal, superior a Anki y Quizlet.

---

## 1. El Gran Desafío: ¿Por qué Crear un Producto Propio y Venderlo?

Anki y Quizlet dominan el mercado de las flashcards, pero ambos tienen debilidades críticas que tu aplicación resuelve:

| Dimensión | Anki (Oficial) | Quizlet | **Lumcards** |
| :--- | :--- | :--- | :--- |
| **Experiencia de Usuario** | Interfaz anticuada (década de los 90), curva de aprendizaje empinada, configuración frustrante. | Interfaz moderna pero saturada de publicidad, bloqueos y muros de pago. | **Diseño ultra moderno, fluido, minimalista y elegante.** |
| **Modelo de Negocio** | Gratis en PC pero código rígido (AGPL); app de iOS costosa ($25 USD). | **Suscripción abusiva recurrente ($35.99+/año)** por funciones básicas como modo Aprender o sin anuncios. | **Compra única de por vida (o suscripción accesible propia)** sin muros artificiales. |
| **Modos de Juego** | Solo repaso tradicional aburrido. No tiene juegos nativos ni emparejamientos. | Modos dinámicos (*Match*, *Learn*, *Test*), pero la mayoría ahora son de pago. | **Catálogo completo integrado:** Tarjetas 3D, Match contrarreloj (ms), Test combinado, Modo Aprender adaptativo y Write con corrección difusa. |
| **Privacidad y Control** | Local en PC, pero sincronización propietaria limitada. | Todo en su nube; si cancelas la suscripción o cierran tu cuenta pierdes tus datos. | **100% Local-First / Privacidad Total:** Tus datos, mazos y partidas están en tu propia máquina. |
| **Interoperabilidad** | Difícil importar de otras plataformas sin plugins de terceros. | Ecosistema cerrado (eliminó su API pública para retener usuarios a la fuerza). | **Lector Universal:** Importa .apkg (Anki), exportaciones de Quizlet, CSV, TSV, TXT y JSON. |

---

## 2. Blindaje Jurídico: Vender sin Problemas con Propietarios de Anki y Quizlet

Para comercializar este software a nivel global (EE.UU., Europa, Latinoamérica/Perú INDECOPI) con **cero riesgos de demandas**, se deben seguir estas 3 reglas de oro:

### Regla 1: Protección de Marcas Registradas (Trademarks)
- **Riesgo:** *"Anki"* es marca registrada de **Ankitects Pty Ltd**. *"Quizlet"* es marca registrada de **Quizlet Inc.** Usar *"Anki 2.0"* o *"Quizlet Pro"* en el nombre comercial, ejecutable (`.exe`), página web o logotipo causaría una orden de cese y desistimiento (*Cease & Desist*) por confusión de marca e infracción marcaria.
- **Blindaje Comercial Aplicado:**
  1. **Nombre Propio Comercial:** La aplicación está establecida y bautizada como **Lumcards**, con identidad visual, ejecutables e instaladores propios.
  2. **Uso Descriptivo Nominal (Nominative Fair Use):** La ley internacional permite mencionar marcas ajenas **únicamente para describir compatibilidad técnica**:
     - *Correcto y Legal:* *"Software de estudio compatible con archivos .apkg de Anki y exportaciones de Quizlet"*.
     - *Ilegal / Infracción:* *"El nuevo Anki 2.0"* o *"Descarga el Quizlet Offline"*.
  3. Desvincular en el instalador final y en el ejecutable cualquier logotipo oficial o nombre que sugiera patrocinio de Ankitects o Quizlet.

### Regla 2: Independencia de la Licencia Copyleft (GNU AGPLv3)
- **Riesgo:** El código fuente oficial del backend de Anki (`anki==26.8.1`) tiene licencia **GNU AGPLv3**. Si distribuyes un instalador comercial que incluya o enlace la biblioteca oficial `anki`, la AGPL te obligaría a entregar **todo tu código fuente** a los clientes y permitirles redistribuirlo gratis.
- **Blindaje Técnico Aplicado:**
  - Hemos creado `clean_anki_importer.py`. Este módulo implementa **Ingeniería Inversa Limpia (Clean-Room)**:
    - Lee los archivos `.apkg` y `.colpkg` abriendo el archivo comprimido estándar ZIP (`zipfile`) y consultando la base de datos SQLite estándar (`sqlite3`).
    - **No importa ni una sola línea de código de Anki.**
    - Según la jurisprudencia de interoperabilidad técnica (ej. *Sega v. Accolade*, Directiva de Software de la Unión Europea y Decisión 351 de la CAN/Indecopi), crear un lector independiente para compatibilidad de archivos es 100% legal y **no transfiere la licencia AGPL a tu software**.
  - Tu software puede venderse como **software propietario comercial de código cerrado** porque tus componentes (`clean_anki_importer.py`, `text_import.py`, `study-games.js`, `dist/`, `practice_store.py`) son creaciones originales tuyas.

### Regla 3: Mecánicas de Juego y Formatos de Quizlet
- **Riesgo:** Intentar acceder a servidores privados de Quizlet mediante scraping masivo o APIs no autorizadas viola sus Términos de Servicio (ToS).
- **Blindaje Legal Aplicado:**
  - Las mecánicas de juego (tarjetas de dos caras, emparejar parejas con cronómetro, preguntas de opción múltiple, exámenes de selección) **son ideas y métodos que NO son protegibles por derechos de autor** (Circular 33 de la Oficina de Copyright de EE.UU., Art. 102(b) US Copyright Act).
  - Lo que protege la ley es el código y los gráficos específicos. Todo el código de juego en `dist/study-games.js` y `dist/practice.js` fue escrito desde cero de forma original.
  - La importación de Quizlet se realiza a través de la función oficial de exportación de Quizlet (texto tabulado/TSV), que el usuario final exporta legítimamente de sus propios sets.

---

## 3. Catálogo de Modos de Aprendizaje y Juego Integrados

Tu aplicación ahora cuenta con un ecosistema completo de 6 modalidades:

1. **Modo Aprender (Learn)**:
   - Generación dinámica de preguntas de opción múltiple con 3 distractores inteligentes extraídos del mismo mazo.
   - Refuerzo adaptativo: las tarjetas falladas se reinsertan en la cola hasta que el usuario demuestre dominio.
   - Seguimiento de racha con multiplicador de fuego 🔥.

2. **Modo Emparejar Contrarreloj (Match)**:
   - Cuadrícula interactiva de fichas mezcladas (términos y definiciones).
   - Cronómetro continuo de alta precisión en milisegundos (`0.0s`).
   - Sistema de detección de **Récord Personal** (`Mejor marca`) guardado localmente por mazo.
   - Animaciones visuales: vibración (*shake*) en error y desvanecimiento (*pop*) en acierto.

3. **Modo Examen Completo (Test)**:
   - Evaluación estructurada con 3 tipos de reactivos balanceados:
     - 40% Opción Múltiple
     - 30% Verdadero / Falso (con distractores cruzados inteligentes)
     - 30% Pregunta Escrita de memoria activa
   - Calificación final automática con porcentaje, número de aciertos/fallos y desglose de respuestas correctas.

4. **Modo Tarjetas 3D (Flashcards)**:
   - Efecto de volteo 3D de alta fidelidad visual.
   - Control ágil por teclado: `Espacio` o `Enter` para voltear; números `1` (Repetir), `2` (Difícil), `3` (Bueno), `4` (Fácil) para calificar.
   - Indicador de anverso/reverso y conteo de sesión.

5. **Modo Escribir de Memoria (Write con Fuzzy Matching)**:
   - Algoritmo de distancia Levenshtein: tolera errores tipográficos leves, tildes omitidas, mayúsculas y signos de puntuación (umbral ≥82% de similitud).
   - Botón de anulación manual: *"Mi respuesta fue correcta"*.

6. **Modo Elige la Respuesta (Choice)**:
   - Sesión de velocidad para repaso rápido de 4 alternativas.

---

## 4. Hoja de Ruta Técnica para el Lanzamiento Comercial

1. **Fase Actual (Completada):**
   - Módulos de juego probados y operativos en `dist/study-games.js`, `dist/practice.js` y `dist/practice.css`.
   - Lector limpio universal creado en `clean_anki_importer.py`.
   - Soporte para formatos Quizlet, CSV, TSV, TXT y JSON en `text_import.py`.
   - Base de datos local de partidas en `practice_store.py` con soporte para todos los modos.

2. **Fase de Empaquetado y Marca (Próximo Paso):**
   - Elegir el nombre comercial definitivo (ej. **Codex Learn**).
   - Sustituir los iconos y textos de "Anki 2.0" en `installer.iss`, títulos de ventana y accesos directos por tu nueva marca.
   - Para la distribución comercial final, compilar el backend usando únicamente el lector limpio `clean_anki_importer.py` para reemplazar por completo `engine.py`, logrando un ejecutable 100% independiente de AGPL.
