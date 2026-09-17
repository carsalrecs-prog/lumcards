const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.join(__dirname, '..');
const noop = () => {};
const element = { addEventListener: noop, classList: { toggle: noop }, innerHTML: '' };

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const context = vm.createContext({
  document: { querySelector: () => element, addEventListener: noop, documentElement: element },
  window: { addEventListener: noop, location: { hostname: 'carsalrecs-prog.github.io' } },
  localStorage: mockLocalStorage,
  setTimeout: noop,
  clearTimeout: noop,
  URLSearchParams,
  URL,
  Intl,
  console,
});

const source = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8').replace(/^boot\(\);$/m, '');
vm.runInContext(source, context);

(async () => {
  // Ensure web mode is active
  vm.runInContext('isWebMode = true;', context);

  // Initialize web storage
  const state0 = await vm.runInContext("webApi('state')", context);
  assert.ok(state0.decks.length > 0, 'Should have initial decks in web mode');

  // Create a new parent deck "Farmacología" and subdeck "Farmacología::Antibióticos"
  const parentDeck = await vm.runInContext("webApi('decks', { name: 'Farmacología' })", context);
  const subDeck = await vm.runInContext("webApi('decks', { name: 'Farmacología::Antibióticos' })", context);
  assert.ok(parentDeck && parentDeck.id);
  assert.ok(subDeck && subDeck.id);

  // Create cards in parent and subdeck
  const c1 = await vm.runInContext(`webApi('cards', { deckId: ${JSON.stringify(parentDeck.id)}, front: '¿Qué es farmacocinética?', back: 'Lo que el cuerpo hace al fármaco', tags: 'farmaco' })`, context);
  const c2 = await vm.runInContext(`webApi('cards', { deckId: ${JSON.stringify(subDeck.id)}, front: '¿Mecanismo de penicilina?', back: 'Inhibe síntesis pared celular', tags: 'antibioticos' })`, context);
  assert.ok(c1 && c1.id);
  assert.ok(c2 && c2.id);

  // Test stats/detailed collection-wide
  const detailedAll = await vm.runInContext("webApi('stats/detailed')", context);
  assert.ok(detailedAll.cardBreakdown, 'Detailed stats should have cardBreakdown');
  assert.ok(detailedAll.cardBreakdown.total >= 2, 'Total cards should include created cards');
  assert.ok(detailedAll.cardBreakdown.new.count >= 2, 'New cards count should include created cards');
  assert.ok(detailedAll.forecast.days30.length === 31, 'Forecast 30 days should have 31 entries');
  assert.ok(Array.isArray(detailedAll.calendar.days), 'Calendar days should be an array');
  assert.ok(detailedAll.calendar.days.length >= 365, 'Calendar should have full year of days');
  assert.ok(detailedAll.addedCards.all.series.length > 0, 'Added cards series should have data');

  // Test stats/detailed filtered by subdeck
  const detailedSub = await vm.runInContext(`webApi('stats/detailed?deckId=${encodeURIComponent(subDeck.id)}')`, context);
  assert.equal(detailedSub.cardBreakdown.total, 1, 'Subdeck should have exactly 1 card');
  assert.equal(detailedSub.cardBreakdown.new.count, 1, 'Subdeck card should be new');

  // Test stats/detailed filtered by parent deck (should include subdeck cards via name::*)
  const detailedParent = await vm.runInContext(`webApi('stats/detailed?deckId=${encodeURIComponent(parentDeck.id)}')`, context);
  assert.equal(detailedParent.cardBreakdown.total, 2, 'Parent deck should include both parent and subdeck cards');

  // Test review logging in web mode
  const studySession = await vm.runInContext(`webApi('study', { deckId: ${JSON.stringify(subDeck.id)} })`, context);
  assert.ok(studySession && studySession.cards && studySession.cards.length > 0, 'Study returned cards');
  const cardToReview = studySession.cards[0];

  // Review the card with rating 3 (Good)
  const revRes1 = await vm.runInContext(`webApi('review', { id: ${JSON.stringify(cardToReview.id)}, rating: 3, time: 4200 })`, context);
  assert.equal(revRes1.success, true, 'Review succeeded');

  // Verify detailed stats reflect the review in today and buttonPresses
  const detailedAfterRev = await vm.runInContext("webApi('stats/detailed')", context);
  assert.ok(detailedAfterRev.today.cardsStudied >= 1, 'Cards studied today should be >= 1');
  assert.ok(detailedAfterRev.today.timeSeconds > 0, 'Time spent today should be > 0');

  // Test cards/weak endpoint
  const weakBefore = await vm.runInContext("webApi('cards/weak')", context);
  assert.ok(Array.isArray(weakBefore.cards), 'cards/weak should return an array');

  // Now simulate a card with lapses >= 3 to test leech detection
  await vm.runInContext(`
    const store = JSON.parse(localStorage.getItem('lumcards_web_data') || '{}');
    const target = store.cards.find(c => String(c.id) === ${JSON.stringify(String(c1.id))});
    if (target) {
      target.lapses = 4;
      target.ease = 1600;
      target.front = 'Pregunta difícil de prueba con sanguijuela';
      localStorage.setItem('lumcards_web_data', JSON.stringify(store));
    }
  `, context);

  const weakAfter = await vm.runInContext("webApi('cards/weak')", context);
  assert.ok(weakAfter.cards.length >= 1, 'cards/weak should identify the leech card');
  const leech = weakAfter.cards.find(c => String(c.id) === String(c1.id));
  assert.ok(leech, 'Identified card c1 as weak/leech');
  assert.equal(leech.lapses, 4);

  console.log('All Web Mode stats and weak cards tests passed successfully!');
})();
