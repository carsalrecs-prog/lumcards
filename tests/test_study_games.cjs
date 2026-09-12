const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const games = require('../dist/study-games.js');

function seeded(seed = 1234) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const source = Object.freeze([
  Object.freeze({id: 1, front: '  Capital\n de Francia ', back: ' Pari\u0301s  '}),
  Object.freeze({id: 2, front: 'capital de francia', back: 'PARÍS'}),
  Object.freeze({id: 3, front: 'Banco', back: 'Asiento'}),
  Object.freeze({id: 4, front: ' banco ', back: 'Entidad financiera'}),
  Object.freeze({id: 5, front: 'Banco', back: 'Asiento'}),
  Object.freeze({id: 6, front: '\u2003', back: 'vacío'}),
  Object.freeze({id: 7, front: 'Cielo', back: ''}),
  Object.freeze({id: 8, front: 'Capital de Perú', back: 'Lima'}),
  null,
  Object.freeze({id: 9, front: {}, back: 'dato inválido'})
]);
const snapshot = JSON.stringify(source);
const prepared = games.prepareCards(source);
assert.deepEqual(prepared, {cards: [
  {id: 1, front: 'Capital de Francia', back: 'París'},
  {id: 8, front: 'Capital de Perú', back: 'Lima'}
], skipped: 8});
assert.equal(JSON.stringify(source), snapshot, 'La preparación no debe modificar las tarjetas.');
assert.equal(games.prepareCards([{id: 1, front: 'A', back: 'B'}, {id: '1', front: 'C', back: 'D'}]).skipped, 1, 'Los identificadores repetidos no deben crear parejas incorrectas.');
assert.equal(games.prepareCards([{front: 'A', back: 'B'}]).cards[0].id, 'study-card-0');
assert.throws(() => games.prepareCards(null), TypeError);

const cards = Object.freeze([
  {id: 11, front: 'Francia', back: 'París'},
  {id: 12, front: 'Perú', back: 'Lima'},
  {id: 13, front: 'España', back: 'Madrid'},
  {id: 14, front: 'Italia', back: 'Roma'},
  {id: 15, front: 'Alemania', back: 'Berlín'},
  {id: 16, front: 'Ciudad de la Torre Eiffel', back: ' PARÍS '}
].map(Object.freeze));
const cardSnapshot = JSON.stringify(cards);
const session = games.createChoiceSession(cards, {limit: 6, random: seeded()});
assert.equal(session.length, 6);
assert.deepEqual(session, games.createChoiceSession(cards, {limit: 6, random: seeded()}), 'Un generador inyectado permite reproducir la sesión.');
assert.notDeepEqual(session.map(question => question.id), cards.map(card => card.id), 'El orden de preguntas debe barajarse.');
assert.ok(new Set(session.map(question => question.options.findIndex(option => option.correct))).size > 1, 'La respuesta correcta no debe aparecer siempre en la misma posición.');
for (const question of session) {
  assert.equal(question.options.length, 4);
  assert.equal(new Set(question.options.map(option => games.normalizeAnswer(option.label))).size, 4, 'Los distractores deben ser distintos de la respuesta correcta y entre sí.');
  assert.equal(question.options.filter(option => option.correct).length, 1);
  assert.equal(question.options.find(option => option.correct).label, question.answer);
  assert.equal(question.answer, games.prepareCards(cards).cards.find(card => card.id === question.id).back);
}
assert.equal(games.createChoiceSession(cards, {limit: 2, random: seeded()}).length, 2);
assert.equal(games.createChoiceSession(cards.slice(0, 2), {random: seeded()})[0].options.length, 2);
assert.equal(games.createChoiceSession(cards.slice(0, 3), {random: seeded()})[0].options.length, 3);
assert.equal(games.createChoiceSession(cards.slice(0, 2), {limit: 99, random: seeded()}).length, 2);
assert.throws(() => games.createChoiceSession([]), RangeError);
assert.throws(() => games.createChoiceSession(cards.slice(0, 1)), RangeError);
assert.throws(() => games.createChoiceSession([cards[0], cards[5]]), RangeError, 'Dos pares con la misma respuesta no aportan distractores.');
assert.throws(() => games.createChoiceSession(cards, {limit: 0}), RangeError);
assert.throws(() => games.createChoiceSession(cards, {limit: 1.5}), RangeError);
assert.throws(() => games.createChoiceSession(cards, {random: 2}), TypeError);
assert.throws(() => games.createChoiceSession(cards, {random: () => 1}), RangeError);

const round = games.createMatchRound(cards, {limit: 6, random: seeded()});
assert.equal(round.left.length, 5, 'Solo debe aparecer una de las dos respuestas París en la ronda de parejas.');
assert.equal(round.right.length, round.left.length);
assert.equal(new Set(round.right.map(item => games.normalizeAnswer(item.text))).size, 5);
assert.deepEqual(round.left.map(item => item.id).sort(), round.right.map(item => item.id).sort());
assert.notDeepEqual(round.left.map(item => item.id), round.right.map(item => item.id), 'Ambos lados se barajan por separado.');
for (const item of round.left) {
  const expected = cards.find(card => card.id === item.id);
  assert.equal(item.text, expected.front);
  assert.equal(games.normalizeAnswer(round.right.find(other => other.id === item.id).text), games.normalizeAnswer(expected.back));
}
assert.equal(games.createMatchRound(cards, {limit: 2, random: seeded()}).left.length, 2);
assert.throws(() => games.createMatchRound([cards[0], cards[5]]), RangeError);
assert.throws(() => games.createMatchRound(cards, {limit: 1}), RangeError);
assert.equal(JSON.stringify(cards), cardSnapshot, 'Los juegos no deben modificar el contenido ni el orden de entrada.');

assert.equal(games.normalizeAnswer('  ÁRBOL\n\tVERDE\u2003 '), 'árbol verde');
assert.ok(games.gradeAnswer('París', '  PARI\u0301S\n'));
assert.ok(games.gradeAnswer('Nueva York', '\u00a0nueva\t\nyork '));
assert.ok(!games.gradeAnswer('sí', 'si'), 'Los acentos deben importar por defecto.');
assert.ok(games.gradeAnswer('sí', 'SI', {ignoreAccents: true}));
assert.ok(!games.gradeAnswer('2.5', '25'), 'No se debe eliminar puntuación que cambie una respuesta.');
assert.ok(!games.gradeAnswer('París', 'Lima'));
assert.ok(!games.gradeAnswer('', '  '), 'Una respuesta vacía no debe dar puntos.');
assert.ok(!games.gradeAnswer('correcto', null));
assert.equal(games.normalizeAnswer(null), '');

const browser = vm.createContext({window: {}});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist/study-games.js'), 'utf8'), browser);
assert.equal(typeof browser.window.StudyGames.createMatchRound, 'function', 'Debe funcionar también como script de navegador sin require ni DOM.');
assert.ok(browser.window.StudyGames.gradeAnswer('hola', 'HOLA'));
console.log('Juegos: preparación, preguntas, parejas, escritura, aleatoriedad e independencia del DOM: OK');
