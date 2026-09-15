---
tags: [lumcards, agentes, capacidades, antigravity, codex]
updated: 2026-09-15
---

# Capacidades de los agentes

Esta nota permite que Codex planifique trabajo compatible con las herramientas reales de Antigravity y que ambos sepan cuándo pedir a Richard una capacidad nueva. Es un inventario, no una autorización: una skill describe cómo actuar y un MCP ofrece herramientas, pero ninguna de las dos cosas permite por sí sola borrar datos, desplegar, comprar, publicar, iniciar sesión o modificar servicios externos.

## Lectura rápida

- Fuente Antigravity: capturas y listado aportados por Richard el 2026-09-15.
- Evidencia: 83 skills declaradas y nueve servidores MCP visibles como activados en Customizations.
- Límite: no se verificaron credenciales, permisos, cuotas ni una llamada real a cada herramienta. Algunos controles aparecen atenuados aunque el servidor figure activo.
- Fuente Codex: capacidades visibles en la sesión del 2026-09-15; pueden cambiar entre sesiones o al instalar plugins.
- Regla: comprobar la capacidad en la sesión que vaya a usarla. Si falta, documentar necesidad, beneficio, datos expuestos, permisos y alternativa antes de pedir instalación a Richard.

## Antigravity: capacidades especialmente útiles para Lumcards

| Área | Capacidad disponible | Uso probable |
| --- | --- | --- |
| Desarrollo Android | `android-cli` | Compilar, ejecutar e inspeccionar el proyecto Android y dispositivos/emuladores. |
| Orquestación de Antigravity | `antigravity-guide`, `agy-customizations`, `google-antigravity-sdk` | Configurar reglas, skills, hooks, MCP y agentes; no hace falta para cada cambio de código. |
| Seguridad operativa | `accidental-data-loss-prevention`, `credentials` | Frenar operaciones irreversibles y manejar credenciales sin registrarlas en el cerebro. |
| Python | `managing-python-dependencies`, `uv` | Mantener dependencias dentro del entorno del proyecto. |
| Reparación y reutilización | `skill-repair`, `workflow-skill-creator` | Reparar una skill fallida o convertir un flujo ya probado en una skill reutilizable. |
| Publicación actual | MCP de Firebase y Vercel | Inspeccionar o desplegar solo en una tarea expresamente autorizada y con proyecto verificado. |
| Contenido médico | PubMed, Europe PMC, ClinicalTrials.gov, openFDA, ChEMBL, PubChem y demás fuentes biomédicas | Investigar y citar contenido educativo. No sustituyen revisión médica, licencias del contenido ni evaluación de privacidad. |
| Material de estudio | MCP de NotebookLM | Consultar fuentes y generar borradores de flashcards, quizzes, informes o mapas; revisar exactitud y derechos antes de incorporarlos. |

Las herramientas de BigQuery, Cloud SQL, Dataproc, GCS y pipelines no forman parte de la arquitectura local actual de Lumcards. Solo deben entrar en un plan si se decide una función concreta que requiera GCP; no son una razón por sí mismas para migrar la aplicación.

## Antigravity: servidores MCP observados

Todos aparecían con indicador verde y con el interruptor activado en las capturas. “Observado” no significa autenticado ni probado.

### `data-agent-kit` — 4 herramientas

- Contexto del editor y conexión GCP activa; listado y lectura de plantillas/recursos.
- Herramientas visibles: `get_active_editor_context`, `get_active_gcp_connection`, `list_resource_templates`, `read_resource`.

### `datacloud_cloud-sql_remote` — 15 herramientas

- Inspección y administración de instancias Cloud SQL, usuarios, SQL, copias, restauración, importación, clonación y precomprobación de PostgreSQL.
- Incluye operaciones mutables y potencialmente destructivas. Priorizar `execute_sql_readonly`; creación, actualización, restauración e importación requieren una tarea y destino explícitos.

### `datacloud_dataproc_remote` — 16 herramientas

- Listar, consultar, crear o eliminar clústeres, trabajos, lotes y sesiones; consultar operaciones y analizar servicios batch.
- No es necesaria para el Lumcards local actual.

### `datacloud_knowledge_catalog_remote` — 3 herramientas

- `search_entries`, `lookup_context`, `lookup_entry` para catálogo y contexto de activos de datos.

### `firebase-mcp-server` — 18 herramientas habilitadas según la interfaz

- Inicio/cierre de sesión, proyectos, apps, SDK, entorno, inicialización, reglas, recursos y despliegues.
- También muestra acceso a documentación de desarrollo. `developerknowledge_answer_query` aparecía atenuada en la captura; verificar disponibilidad al usarla.
- No crear proyectos/apps, cambiar reglas ni desplegar sin confirmar primero proyecto, cuenta, entorno y alcance.

### `notebooklm-mcp-server` — 26 herramientas habilitadas según la interfaz

- Gestión de notebooks y fuentes, consultas, investigación y generación de audio, video, infografías, diapositivas, informes, flashcards, quizzes, tablas y mapas mentales.
- `notebook_delete`, varias acciones de Drive y algunas acciones de Studio aparecían atenuadas; verificar en la sesión.
- No cargar datos personales, tarjetas privadas ni material sin derecho de uso.

### `notebooks` — 11 herramientas

- Crear notebooks; insertar, reemplazar, eliminar, leer, listar y buscar celdas; obtener rangos y salidas.

### `vercel` — 37 herramientas

- Documentación, proyectos Git, despliegues, protección, logs, errores, analítica, equipos, dominios y comentarios de toolbar.
- Incluye compras de planes, créditos, complementos y dominios. Nunca usar herramientas `buy_*`, comprar dominios ni cambiar producción salvo petición explícita de Richard con el objeto y coste confirmados.

### `visualization` — 1 herramienta

- `render_chart` para gráficos.

## Antigravity: inventario de skills declarado

### Antigravity, desarrollo y operación

`accidental-data-loss-prevention`, `agy-customizations`, `android-cli`, `antigravity-guide`, `building-data-apps`, `credentials`, `google-antigravity-sdk`, `managing-python-dependencies`, `notebook-guidance`, `skill-repair`, `uv`, `workflow-skill-creator`.

### Gemini

`gemini-api-dev`, `gemini-interactions-api`, `gemini-live-api-dev`, `gemini-omni-flash-api`.

### Google Cloud, datos y ML

`bigquery-ai-ml`, `bigquery-bigframes`, `bigquery-data-transfer-service`, `bigquery-graph`, `bigquery-sql`, `bigtable-basics`, `data-autocleaning`, `dataform-bigquery`, `dbt-bigquery`, `discovering-gcp-data-assets`, `enforcing-resource-attribution`, `federate-lakehouse-catalog`, `gcp-composer-troubleshooting`, `gcp-data-pipelines`, `gcp-dataflow`, `gcp-managed-airflow-dag-authoring`, `gcp-managed-airflow-migrations`, `gcp-managed-airflow-recommendations`, `gcp-pipeline-orchestration`, `gcp-pipeline-resource-provisioning`, `gcp-spark`, `gcs-security-assessment`, `google-cloud-auth-verification`, `google-cloud-storage-basics`, `google-cloud-storage-bucket-architect`, `google-cloud-storage-fuse`, `ml-best-practices`, `schema-mapping`.

### Ciencia, medicina y literatura

`alphafold-database-fetch-and-analyze`, `alphagenome-atlas-website-links`, `alphagenome-single-variant-analysis`, `alphagenome-variant-impact-score`, `chembl-database`, `clinical-trials-database`, `clinvar-database`, `dbsnp-database`, `embl-ebi-ols`, `encode-ccres-database`, `ensembl-database`, `foldseek-structural-search`, `gnomad-database`, `gtex-database`, `human-protein-atlas-database`, `interpro-database`, `jaspar-database`, `literature-search-arxiv`, `literature-search-biorxiv`, `literature-search-europepmc`, `literature-search-openalex`, `ncbi-sequence-fetch`, `openfda-database`, `opentargets-database`, `pdb-database`, `protein-sequence-msa`, `protein-sequence-similarity-search`, `pubchem-database`, `pubmed-database`, `pymol`, `quickgo-database`, `reactome-database`, `string-database`, `ucsc-conservation-and-tfbs`, `unibind-database`, `uniprot-database`.

### Otros y soporte interno

- `predictingthepast`: análisis de textos antiguos; sin aplicación prevista a Lumcards.
- `science-skills-common` y `scienceskillscommon`: paquetes compartidos del plugin de ciencia, declarados explícitamente como no invocables de forma independiente.

## Codex: capacidades visibles en esta sesión

- Desarrollo local: lectura, búsqueda, edición por parches, terminal PowerShell, Git, pruebas y procesos del workspace.
- Investigación: navegación web con citas; para productos OpenAI se restringe a documentación oficial.
- Interfaz y medios: inspección de imágenes, generación/edición de imágenes y control supervisado de navegador/Windows cuando corresponde.
- Coordinación: tareas de Codex, relevos, automatizaciones y colaboración interna cuando el usuario lo autoriza.
- Skills disponibles: `openai-docs`, `computer-use`, `imagegen`, `visualize`, creación/instalación/gestión de skills y plugins, documentos, PDF, presentaciones, hojas de cálculo, control de Excel, plantillas, Canva y Sites.
- No visibles como conexión directa en esta sesión: Firebase, Vercel, GCP, NotebookLM ni bases biomédicas. Codex puede planificar su uso por Antigravity o pedir una capacidad nueva si la tarea realmente la necesita.

## Cuándo pedir algo nuevo a Richard

El agente que detecte la carencia debe dejar en la ficha de tarea:

1. Capacidad exacta que falta y tarea que desbloquea.
2. Por qué las herramientas locales o ya instaladas no bastan.
3. Proveedor y skill/plugin/MCP sugerido, sin instalar sustitutos arbitrarios.
4. Datos a los que accederá, permisos mínimos y si habrá costes.
5. Alternativa sin conexión y consecuencia de no instalarla.
6. Prueba mínima posterior para confirmar que funciona.

Richard decide la instalación y cualquier conexión de cuenta. Instalar no autoriza a ejecutar operaciones mutables. Las credenciales nunca se copian a `brain/`.

## Recomendaciones actuales

- No falta ninguna capacidad para seguir planificando, programando y probando Lumcards localmente.
- Para una auditoría previa a comercialización, sería útil considerar **Codex Security** en Codex; es opcional y no debe instalarse hasta acordar el alcance de la auditoría.
- GitHub solo aportaría valor si Richard quiere PR, issues o revisión remota; el Git local ya basta para el flujo actual.
- Figma solo es necesario si la fuente real del diseño pasa a estar en Figma.
- Las bases biomédicas de Antigravity son una ventaja futura para contenido educativo con fuentes, no una prioridad para estabilizar el producto.
