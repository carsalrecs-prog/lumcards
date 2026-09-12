const assert = require('node:assert/strict');
const games = require('../dist/study-games.js');

console.log('--- Iniciando pruebas de modos de juego Quizlet ---');

// 1. Probar Fuzzy Matching Levenshtein
const exact = games.fuzzyGrade('Fotosíntesis', 'fotosintesis');
assert.equal(exact.isCorrect, true, 'Debe tolerar mayúsculas y acentos');

const typo = games.fuzzyGrade('Mitocondria', 'Mitocondrias');
assert.equal(typo.isCorrect, true, 'Debe tolerar pequeños errores de plural o letra');

const wrong = games.fuzzyGrade('Mitocondria', 'Cloroplasto');
assert.equal(wrong.isCorrect, false, 'No debe aceptar respuestas totalmente distintas');

// 2. Probar Match Grid (Tablero de Fichas)
const cards = [
  { id: 1, front: 'Gato', back: 'Cat' },
  { id: 2, front: 'Perro', back: 'Dog' },
  { id: 3, front: 'Pájaro', back: 'Bird' },
  { id: 4, front: 'Caballo', back: 'Horse' }
];

const grid = games.createMatchGrid(cards, { limit: 4 });
assert.equal(grid.tiles.length, 8, '4 pares deben generar 8 fichas mezcladas');
assert.equal(grid.totalPairs, 4);

const frontTiles = grid.tiles.filter(t => t.type === 'front');
const backTiles = grid.tiles.filter(t => t.type === 'back');
assert.equal(frontTiles.length, 4);
assert.equal(backTiles.length, 4);

// 3. Probar Test Session (Examen Combinado)
const testSession = games.createTestSession(cards, { limit: 4 });
assert.equal(testSession.questions.length, 4);
const types = new Set(testSession.questions.map(q => q.type));
assert.ok(types.size >= 2, 'El examen debe combinar al menos 2 tipos de preguntas');

// 4. Probar Learn Session (Modo Aprender)
const learnSession = games.createLearnSession(cards, { limit: 4 });
assert.equal(learnSession.cards.length, 4);
const q = learnSession.generateQuestion(cards[0]);
assert.equal(q.id, cards[0].id);
assert.equal(q.options.length, 4);
assert.ok(q.options.some(opt => opt.correct && opt.label === 'Cat'));

console.log('✓ Todas las pruebas de juego estilo Quizlet pasaron exitosamente.');
