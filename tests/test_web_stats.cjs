const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.join(__dirname, '..');
const noop = () => {};
const element = { append: noop, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, setAttribute: noop, getAttribute: () => null, appendChild: noop, replaceChildren: noop, remove: noop, classList: { toggle: noop, contains: () => false, add: noop, remove: noop }, innerHTML: '', style: {} };

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

  // Verify mathematical coherence: breakdown categories must sum EXACTLY to totalCards
  const b = detailedAll.cardBreakdown;
  const breakdownSum = b.new.count + b.learning.count + b.relearning.count + b.young.count + b.mature.count + b.suspended.count + b.buried.count;
  assert.equal(breakdownSum, b.total, `Breakdown sum (${breakdownSum}) must match total cards (${b.total})`);

  // Verify intervals and ease are populated from review cards (starter cards include review cards)
  assert.ok(detailedAll.intervals.totalReviewCards > 0, 'Review cards should be counted in intervals');
  assert.ok(detailedAll.ease.totalCardsWithEase > 0, 'Cards with ease should be counted in ease');
  assert.ok(detailedAll.intervals.avgInterval > 0, 'Avg interval should be > 0');
  assert.ok(detailedAll.ease.avgEase >= 200, 'Avg ease should be >= 200%');

  // Verify forecast excludes new unstudied cards
  assert.ok(detailedAll.forecast.days30.length === 31, 'Forecast 30 days should have 31 entries');
  assert.ok(Array.isArray(detailedAll.calendar.days), 'Calendar days should be an array');
  assert.ok(detailedAll.calendar.days.length >= 365, 'Calendar should have full year of days');
  assert.ok(detailedAll.addedCards.all.series.length > 0, 'Added cards series should have data');

  // Verify retention table has 5 periods with computed values
  assert.equal(detailedAll.retentionTable.length, 5, 'Retention table should have 5 period rows');
  assert.ok(detailedAll.retentionTable.every(r => typeof r.label === 'string' && r.young !== undefined && r.mature !== undefined), 'Retention table rows must have young and mature definitions');

  // Verify root properties for parity with clean_engine
  assert.equal(detailedAll.totalCards, detailedAll.cardBreakdown.total, 'Root totalCards should match breakdown total');
  assert.ok('reviewedToday' in detailedAll, 'Root should have reviewedToday');
  assert.ok('retentionRate' in detailedAll, 'Root should have retentionRate');

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
  assert.equal(detailedAfterRev.today.cardsStudied, detailedAfterRev.today.reviewCount + detailedAfterRev.today.learnCount, 'Cards studied today must equal reviewCount + learnCount');

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
  assert.ok(leech.questionSnippet && !leech.questionSnippet.includes('undefined'), 'questionSnippet must be valid');
  assert.ok(leech.recommendation && !leech.recommendation.includes('undefined'), 'recommendation must be valid');

  // Test deck config persistence
  await vm.runInContext(`webApi('decks/config', { deckId: ${JSON.stringify(parentDeck.id)}, newPerDay: 25, revPerDay: 150 })`, context);
  const fetchedConfig = await vm.runInContext(`webApi('decks/config?deckId=${encodeURIComponent(parentDeck.id)}')`, context);
  assert.equal(fetchedConfig.newPerDay, 25, 'Deck config newPerDay should be saved');
  assert.equal(fetchedConfig.revPerDay, 150, 'Deck config revPerDay should be saved');

  // ── Practice.js autonomous offline API tests ──
  const practiceContext = vm.createContext({
    document: {
      querySelector: () => element,
      querySelectorAll: () => [],
      getElementById: () => null,
      createElement: () => element,
      createTextNode: () => element,
      addEventListener: noop,
      documentElement: element,
      body: element
    },
    window: { addEventListener: noop, location: { hostname: 'carsalrecs-prog.github.io', hash: '' } },
    location: { hostname: 'carsalrecs-prog.github.io', hash: '' },
    history: { replaceState: noop, pushState: noop },
    localStorage: mockLocalStorage,
    setTimeout: noop,
    clearTimeout: noop,
    fetch: () => Promise.reject(new TypeError('Failed to fetch (offline)')),
    URLSearchParams,
    URL,
    Intl,
    console,
    TextDecoder
  });

  const practiceSource = fs.readFileSync(path.join(root, 'dist/practice.js'), 'utf8').replace(/^boot\(\);$/m, '');
  vm.runInContext(practiceSource, practiceContext);

  // Test practice/result and practice/history in practiceContext
  const saveRes = await vm.runInContext("window.api('/api/practice/result', { id: 'game-1', mode: 'quiz', deckName: 'Farmacología', correct: 8, total: 10, mistakes: 2, elapsedMs: 45000 })", practiceContext);
  assert.equal(saveRes.success, true, 'Practice result save succeeded offline');

  const histRes = await vm.runInContext("window.api('/api/practice/history')", practiceContext);
  assert.ok(Array.isArray(histRes), 'Practice history should be an array');
  assert.ok(histRes.some(h => h.id === 'game-1' && h.correct === 8), 'Practice history contains saved game');

  console.log('All Web Mode stats, coherence, weak cards, and practice offline tests passed successfully!');
})();
