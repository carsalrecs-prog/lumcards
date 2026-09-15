# 📦 ANKI 2.0 / QUIZLET ADVANCED FLASHCARDS MODULE
Paquete completo extraído y listo para incorporar directamente en el proyecto **ANKI 2.0**.

---

## 📁 Estructura del Paquete

```
_EXPORT_ANKI_FLASHCARDS_PACKAGE/
│
├── flashcards.css                     # Estilos 3D flip, efectos de racha, animaciones Match y contadores
│
├── src_flashcards/                    # Frontend React + Lucide Icons + Framer Motion
│   ├── FlashcardsApp.jsx              # Vista principal, navegación interna entre modos y sets
│   │
│   ├── components/
│   │   ├── SetList.jsx                # Lista de mazos/sets con búsqueda, estadísticas y botón de nuevo set
│   │   ├── SetDetail.jsx              # Vista detallada de un set (selector de modos de estudio, lista de tarjetas)
│   │   ├── CardEditor.jsx             # Editor modal/inline de tarjetas (frente, reverso, pistas, tags)
│   │   ├── ImportModal.jsx            # Importador multi-formato (CSV, TSV, TXT, APKG / Anki, pegar texto)
│   │   └── StudyComplete.jsx          # Pantalla de resultados / victoria con estadísticas y repetición de falladas
│   │
│   ├── hooks/
│   │   ├── useFlashcardSets.js        # Hook de persistencia CRUD (Firebase / LocalStorage / API)
│   │   └── useStudySession.js         # Hook para tracking de sesión, racha, tiempo y aciertos
│   │
│   └── modes/                         # 🎮 MODOS DE ESTUDIO ESTILO QUIZLET & ANKI
│       ├── FlashcardMode.jsx          # Modo clásico de tarjetas con volteo 3D y atajos de teclado (Espacio, Flechas)
│       ├── LearnMode.jsx              # Modo Aprender (repetición espaciada, opciones múltiples o autoevaluación)
│       ├── MatchMode.jsx              # Juego de Emparejar contrarreloj (arrastrar/tocar pares con temporizador)
│       ├── TestMode.jsx               # Examen completo con preguntas escritas, opción múltiple y V/F
│       └── WriteMode.jsx              # Modo Escribir para memorización activa y corrección ortográfica
│
└── backend/                           # Backend Python (FastAPI / Parsers)
    ├── main.py                        # Servidor FastAPI con endpoints de importación/exportación
    └── flashcards/
        ├── types.py                   # Modelos Pydantic (Card, Deck, StudySession)
        ├── anki/
        │   └── anki_parser.py         # Parser legal y seguro de archivos .apkg (SQLite + zipfile sin código Anki GPL)
        └── quizlet/
            └── quizlet_api.py         # Adaptador / parser de sets de Quizlet
```

---

## 🚀 Pasos de Instalación en ANKI 2.0

### 1. Dependencias Frontend
Si en tu proyecto ANKI 2.0 usas React / Vite / Next.js:
```bash
npm install framer-motion lucide-react canvas-confetti
```

### 2. Copiar archivos Frontend
Copia la carpeta `src_flashcards` a tu proyecto ANKI 2.0 (por ejemplo en `src/flashcards/`).
Importa `flashcards.css` en tu archivo global CSS o en tu `App.jsx`:
```javascript
import './flashcards/flashcards.css';
```

### 3. Usar el componente principal
En la ruta o vista donde quieras el módulo de flashcards:
```javascript
import FlashcardsApp from './flashcards/FlashcardsApp';

function App() {
  return (
    <div>
      <FlashcardsApp showToast={(msg, type) => console.log(msg)} />
    </div>
  );
}
```

### 4. Backend (Opcional si usas importador .apkg local o en servidor)
Dependencias de Python:
```bash
pip install fastapi uvicorn pydantic
```
Para ejecutar el backend:
```bash
uvicorn backend.main:app --reload --port 8000
```

---

## ⚖️ Aspectos Legales & Compatibilidad con Anki
- El parser de archivos `.apkg` incluido en `backend/flashcards/anki/anki_parser.py` implementa lectura directa del contenedor ZIP y la base de datos SQLite estándar, **sin importar ni redistribuir el código propietario de Anki (GPL3)**.
- Esto permite compatibilidad 100% con archivos de exportación de usuarios sin incurrir en violaciones de copyright ni forzar a que tu software sea código abierto.
