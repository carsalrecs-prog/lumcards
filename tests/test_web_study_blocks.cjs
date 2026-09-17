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

  // Create a new deck "dolor"
  const newDeck = await vm.runInContext("webApi('decks', { name: 'dolor' })", context);
  assert.ok(newDeck && newDeck.id, 'Deck "dolor" created');
  const deckId = newDeck.id;

  // Create 2 cards in deck "dolor"
  const c1 = await vm.runInContext(`webApi('cards', { deckId: ${JSON.stringify(deckId)}, front: '¿Qué es dolor?', back: 'Una experiencia sensorial y emocional desagradable', tags: 'medicina' })`, context);
  const c2 = await vm.runInContext(`webApi('cards', { deckId: ${JSON.stringify(deckId)}, front: 'Tipos de dolor', back: 'Agudo y crónico', tags: 'medicina' })`, context);
  assert.ok(c1 && c1.id, 'Card 1 created');
  assert.ok(c2 && c2.id, 'Card 2 created');

  // Check state: deck "dolor" must have total=2, due=2, new=2
  const state1 = await vm.runInContext("webApi('state')", context);
  const deckDolor = state1.decks.find(d => String(d.id) === String(deckId));
  assert.ok(deckDolor, 'Found deck dolor in state');
  assert.equal(deckDolor.total, 2, 'Total cards in deck dolor should be 2');
  assert.equal(deckDolor.due, 2, 'Due cards in deck dolor should be 2');
  assert.equal(deckDolor.new, 2, 'New cards in deck dolor should be 2');

  // Check study/block-info for deck "dolor"
  const blockInfo = await vm.runInContext(`webApi('study/block-info?deckId=${encodeURIComponent(deckId)}')`, context);
  assert.equal(blockInfo.totalDeckCards, 2, 'blockInfo.totalDeckCards should be 2');
  assert.equal(blockInfo.availableToday, 2, 'blockInfo.availableToday should be 2');
  assert.equal(blockInfo.hasActiveBlock, false, 'No active block initially');

  // Start study block of 20 cards
  const startRes = await vm.runInContext(`webApi('study/block-start', { deckId: ${JSON.stringify(deckId)}, limit: 20 })`, context);
  assert.equal(startRes.success, true, 'Block start should succeed');
  assert.equal(startRes.total, 2, 'Block should contain 2 cards');

  // Verify study/block-info now shows active block
  const blockInfoActive = await vm.runInContext(`webApi('study/block-info?deckId=${encodeURIComponent(deckId)}')`, context);
  assert.equal(blockInfoActive.hasActiveBlock, true, 'Should have active block now');
  assert.equal(blockInfoActive.activeBlock.total, 2, 'Active block total should be 2');

  // Fetch cards to study
  const studySession = await vm.runInContext(`webApi('study', { deckId: ${JSON.stringify(deckId)} })`, context);
  assert.equal(studySession.cards.length, 2, 'Study session should return the 2 block cards');
  assert.ok(studySession.blockStatus, 'Study session should include blockStatus');
  assert.equal(studySession.blockStatus.active, true, 'blockStatus should be active');
  assert.equal(studySession.blockStatus.total, 2, 'blockStatus total should be 2');
  assert.equal(studySession.blockStatus.reviewedCount, 0, 'blockStatus reviewedCount should be 0');

  // Review first card
  const revRes = await vm.runInContext(`webApi('review', { id: ${JSON.stringify(studySession.cards[0].id)}, rating: 3 })`, context);
  assert.equal(revRes.success, true, 'Review should succeed');
  assert.ok(revRes.blockStatus, 'Review should return updated blockStatus');
  assert.equal(revRes.blockStatus.reviewedCount, 1, 'blockStatus reviewedCount should be 1');
  assert.equal(revRes.blockStatus.pending, 1, 'blockStatus pending should be 1');

  // Clear study block
  const clearRes = await vm.runInContext(`webApi('study/block-clear', { deckId: ${JSON.stringify(deckId)} })`, context);
  assert.equal(clearRes.success, true, 'Block clear should succeed');

  const blockInfoCleared = await vm.runInContext(`webApi('study/block-info?deckId=${encodeURIComponent(deckId)}')`, context);
  assert.equal(blockInfoCleared.hasActiveBlock, false, 'No active block after clear');

  console.log('✓ Web mode study blocks and deck counters verified successfully!');
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
