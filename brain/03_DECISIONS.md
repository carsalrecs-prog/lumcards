---
tags: [lumcards, decisiones]
updated: 2026-09-15
---

# Decisiones

## Confirmadas

### 2026-09-15 — Inventario de capacidades sin permisos implícitos

- Las capacidades observadas de Codex y Antigravity se registran en [[10_AGENT_CAPABILITIES]] para planificar relevos compatibles con cada herramienta.
- Una skill o un servidor MCP instalado no demuestra autenticación ni concede permiso para desplegar, comprar, borrar, publicar o modificar servicios externos.
- Si falta una capacidad, el agente documenta la necesidad, permisos, datos, coste, alternativa y prueba mínima; Richard decide la instalación o conexión de cuenta.
- El inventario es una fotografía fechada y debe verificarse en la sesión ejecutora porque plugins, estados y permisos pueden cambiar.

### 2026-09-15 — Jerarquía canónica de carpetas y mazos

- El motor normaliza tanto `U+001F` de paquetes modernos como `::` al formato persistente `::` usado por Lumcards.
- Una carpeta conserva la marca `lumcardsFolder` aunque esté vacía; los padres inferidos al importar también reciben esa marca.
- Al abrir una colección antigua, los nombres equivalentes se fusionan de forma idempotente, se reasignan las tarjetas sin cambiar sus IDs y se crea una copia `.colpkg` antes de modificar la jerarquía.
- Renombrar una carpeta cambia en cascada sus descendientes; renombrar un mazo conserva su carpeta; los nombres duplicados y los ciclos de movimiento se rechazan.

### 2026-09-14 — Motor independiente limpio (Clean-Room) sin AGPL

- Decisión del usuario: sustituir por completo el paquete oficial `anki==26.8.1` (licencia AGPLv3) para permitir la comercialización cerrada/privada de Lumcards.
- Implementación: `clean_engine.py` como motor autónomo en Python puro + SQLite nativo (`sqlite3`), renderizador estático de plantillas Mustache, soporte para campos nativos de Cloze y Oclusión de Imágenes (`native_image_occlusion.py`), descompresión `zstandard` (licencia permisiva BSD) y parser de mapas multimedia y esquemas Anki 2.1b / SQLite.
- Eliminación de dependencias copyleft: `engine.py` delega directamente a `clean_engine.py`. Se retira `anki==26.8.1` de `requirements-lock.txt` y no se importa en tiempo de ejecución.
- Compatibilidad probada por la suite actual con `.apkg`, `.colpkg`, `.anki2`, historial `revlog`, cálculo de rachas/retención y APIs de `server.py`; no equivale a garantía universal ni a aprobación jurídica.

### 2026-09-13 — Obsidian como memoria del proyecto

- `D:\CODEX` funciona como vault y `brain/00_HOME.md` es la entrada.
- Codex, Antigravity y Claude leen indice, relevo y ficha relevante; otras notas solo bajo demanda.
- La carpeta `brain/` no almacena tarjetas, credenciales ni transcripciones. El vault abarca el repositorio; no confundirlo con la memoria documental.

### 2026-09-13 — Relevo compartido y checkpoints

- Pedido del usuario: continuidad entre las tres herramientas, incluyendo limites de tokens.
- Un protocolo en `AGENTS.md`, entradas breves por herramienta y fichas por tarea; evita estados contradictorios en memorias privadas.
- Guardar por hitos y aproximadamente cada 10 minutos; antes de limites visibles o cambios de agente. El cierre incluye hechos, pruebas, pendientes y siguiente accion.
- Limite: no garantiza guardado tras una terminacion abrupta ni sincronizacion entre equipos. Recuperar desde la ultima ficha y verificar archivos. Detalle en [[07_PROTOCOL]].

### 2026-09-11 — Juegos separados del planificador

- Los resultados de práctica se guardan aparte de los repasos.
- Jugar no cambia intervalos ni registros de repetición por defecto.

### 2026-09-11 — Importación de texto con vista previa

- CSV, TSV, TXT y JSON se analizan como texto literal.
- La confirmación de importación crea respaldo, valida el lote y omite duplicados.

### 2026-09-11 — Aplicación Windows con ventana propia

- El inicio normal usa WinForms y WebView2, sin abrir una pestaña normal de Chrome.
- El servidor sigue siendo local y la ventana se puede ocultar en la bandeja.

## Pendientes de decisión

### Licencia comercial (Resuelta)

- Opción elegida: Opción B (motor propio sin AGPL).
- Implementado y verificado en `clean_engine.py`. Queda pendiente la revisión jurídica externa de términos y marca.

### Fuente de publicación

- Definir si `dist/` genera `docs/` o si una de las dos carpetas se elimina del flujo.
