from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any

@dataclass
class Flashcard:
    """Represent a single flashcard."""
    front: str
    back: str
    tags: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class FlashcardSet:
    """A collection of flashcards, optionally with metadata."""
    name: str
    cards: List[Flashcard]
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "cards": [c.to_dict() if hasattr(c, "to_dict") else asdict(c) for c in self.cards]
        }
