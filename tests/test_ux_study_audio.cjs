/**
 * test_ux_study_audio.cjs
 * Regression tests for the 2026-09-15-ux task:
 *  1. AudioController replay cycle: two consecutive playList calls must stop+restart cleanly.
 *  2. AudioPlayer (practice.js) replay: clicking same button twice restarts from currentTime=0.
 *  3. Study layout: HTML includes .anki-study-stage wrapper integrating card + bottom-bar.
 *  4. Audio pills in study: icon-only (no visible text like "Audio", "Escuchar").
 *  5. Audio pills in practice.js: icon-only with aria-label.
 *  6. Juegos dark theme: practice.html includes dark mode sync script.
 */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');

// ── Helpers ─────────────────────────────────────────────────────
const noop = () => {};
const log = [];

class FakeAudio {
  static instances = [];
  constructor(src) {
    this.src = src || '';
    this.currentTime = 0;
    this.paused = true;
    this.isConnected = true;
    this.style = {};
    this.attributes = new Map();
    this.onended = null;
    this.onerror = null;
    FakeAudio.instances.push(this);
    log.push({ action: 'new', src });
  }
  play() {
    log.push({ action: 'play', src: this.src });
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    log.push({ action: 'pause', src: this.src });
    this.paused = true;
  }
  load() {
    log.push({ action: 'load', src: this.src });
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'src') this.src = '';
  }
}

// ── Test 1: AudioController replay cycle (app.js) ──────────────
{
  log.length = 0;
  let timerFn = null;
  const element = { addEventListener: noop, classList: { toggle: noop }, innerHTML: '', remove: noop };
  const ctx = vm.createContext({
    document: {
      querySelector: () => element,
      getElementById: () => null,
      addEventListener: noop,
      documentElement: element,
      createElement: tag => tag === 'audio' ? new FakeAudio() : element,
      body: { appendChild: audio => { audio.isConnected = true; } },
    },
    window: { addEventListener: noop },
    localStorage: { getItem: () => null },
    Audio: FakeAudio,
    setTimeout: (fn, ms) => { timerFn = fn; return 99; },
    clearTimeout: (id) => { timerFn = null; },
    URLSearchParams, URL, Intl, console,
    requestAnimationFrame: noop,
  });

  const source = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8').replace(/^boot\(\);$/m, '');
  vm.runInContext(source, ctx);

  // First playList
  vm.runInContext("AudioController.playList(['file_a.mp3'])", ctx);
  const firstAudio = vm.runInContext('AudioController.currentAudio', ctx);
  assert.ok(firstAudio, 'First playList should create an audio instance');
  assert.equal(firstAudio.src, '/media/file_a.mp3');

  // Second playList on same source (replay) should reuse, stop and restart
  log.length = 0;
  vm.runInContext("AudioController.playList(['file_a.mp3'])", ctx);
  const secondAudio = vm.runInContext('AudioController.currentAudio', ctx);
  assert.equal(secondAudio, firstAudio, 'Study audio should reuse one persistent media element');
  // The first audio should have been paused and reset
  const pauseEvents = log.filter(e => e.action === 'pause');
  assert.ok(pauseEvents.length >= 2, 'Persistent audio should be paused while preparing the replay');
  const playEvents = log.filter(e => e.action === 'play');
  assert.ok(playEvents.length >= 1, 'New audio should be played');
  // timerId should be cleaned
  const timerId = vm.runInContext('AudioController.timerId', ctx);
  assert.equal(timerId, null, 'Timer should be cleared on stop()');

  console.log('✓ AudioController replay cycle: stop+restart on consecutive playList calls');
}

// ── Test 2: AudioPlayer (practice.js) replay cycle ──────────────
{
  log.length = 0;
  FakeAudio.instances = [];
  const practiceSource = fs.readFileSync(path.join(root, 'dist/practice.js'), 'utf8');
  
  // Extract AudioPlayer from the IIFE
  const audioPlayerMatch = practiceSource.match(/const AudioPlayer = (\{[\s\S]*?\n  \});/);
  assert.ok(audioPlayerMatch, 'Could not extract AudioPlayer');
  
  const classes = new Set();
  const mockBtn = {
    classList: {
      add: (c) => { classes.add(c); log.push({ action: 'add_class', c }); },
      remove: (c) => { classes.delete(c); log.push({ action: 'remove_class', c }); },
      contains: (c) => classes.has(c),
    }
  };
  
  const ctx = vm.createContext({
    Audio: FakeAudio,
    mockBtn: mockBtn,
    console: { warn: (msg) => log.push({ action: 'warn', msg }) },
  });
  
  vm.runInContext(`const AudioPlayer = ${audioPlayerMatch[1]};`, ctx);
  
  // First activation
  vm.runInContext(`AudioPlayer.play('test.mp3', mockBtn)`, ctx);
  const firstAudio = FakeAudio.instances[0];
  assert.ok(firstAudio, 'First audio instance should be created');
  assert.equal(classes.has('playing'), true, 'Button should have playing class after first play');
  assert.equal(vm.runInContext('AudioPlayer.currentAudio', ctx), firstAudio, 'currentAudio should be first audio');

  // Second activation on the same source/button
  vm.runInContext(`AudioPlayer.play('test.mp3', mockBtn)`, ctx);
  const secondAudio = FakeAudio.instances[1];
  assert.ok(secondAudio, 'Second audio instance should be created');
  assert.equal(classes.has('playing'), true, 'Button should retain playing class after replay');
  assert.equal(vm.runInContext('AudioPlayer.currentAudio', ctx), secondAudio, 'currentAudio should be updated to second audio');
  
  const playEvents = log.filter(e => e.action === 'play');
  assert.equal(playEvents.length, 2, 'Two activations should generate two calls to play()');
  
  const pauseEvents = log.filter(e => e.action === 'pause');
  assert.equal(pauseEvents.length, 1, 'Previous instance should receive pause()');
  
  // Check currentTime = 0 logic is preserved
  assert.match(practiceSource, /prevAudio\.currentTime\s*=\s*0/);
  
  // Late onended/onerror of detached first instance must not affect active second instance
  if (firstAudio.onended) firstAudio.onended();
  if (firstAudio.onerror) firstAudio.onerror();
  assert.equal(classes.has('playing'), true, 'Late callback from detached first audio must not remove playing class from button');
  assert.equal(vm.runInContext('AudioPlayer.currentAudio', ctx), secondAudio, 'currentAudio must remain the active second instance');

  // Active audio completion cleans up state
  if (secondAudio.onended) secondAudio.onended();
  assert.equal(classes.has('playing'), false, 'Button should remove playing class when active audio completes');
  assert.equal(vm.runInContext('AudioPlayer.currentAudio', ctx), null, 'currentAudio should be null after active audio ends');
  
  console.log('✓ AudioPlayer replay: behavioral test with FakeAudio verified');
}

// ── Test 3: embedded study-frame audio delegates to parent ──
{
  log.length = 0;
  FakeAudio.instances = [];
  const appSource = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
  const runtimeMatch = fs.readFileSync(path.join(root, 'dist/card-runtime.js'), 'utf8').match(/function installCardAudioRuntime\(parentOrigin\) \{[\s\S]*?\n\}/);
  assert.ok(runtimeMatch, 'Could not extract installCardAudioRuntime');

  const handlers = {};
  const posted = [];
  const classes = new Set();
  const button = {
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
    },
    getAttribute: name => name === 'data-src' ? '/media/test.mp3' : null,
    querySelector: selector => null,
  };
  const styleValues = {};
  const style = { setProperty: (name, value) => { styleValues[name] = value; } };
  const card = { style };
  const body = { style, querySelector: selector => selector === ':scope > .card' ? card : null };
  const ctx = vm.createContext({
    Audio: FakeAudio,
    document: {
      addEventListener: (type, handler, capture) => { handlers[type] = { handler, capture }; },
      body,
      documentElement: { style },
    },
    window: {
      parent: { postMessage: (message, origin) => posted.push({ message, origin }) },
      addEventListener: (type, handler) => { handlers[`window_${type}`] = handler; },
      CSS: { supports: () => true },
    },
  });

  vm.runInContext(`${runtimeMatch[0]}; installCardAudioRuntime('http://127.0.0.1:8765');`, ctx);
  assert.equal(handlers.click.capture, true, 'Embedded audio handler must run in capture phase');
  const clickEvent = () => ({
    target: { closest: selector => selector.includes('anki-audio-pill') ? button : null },
    preventDefault: () => {},
    stopImmediatePropagation: () => {},
  });

  handlers.click.handler(clickEvent());
  assert.equal(classes.has('playing'), true, 'Embedded button should show playing state');
  assert.equal(posted.some(p => p.message.ankiPlayAudio === '/media/test.mp3'), true, 'Click should delegate playback to parent');

  handlers.click.handler(clickEvent());
  assert.equal(classes.has('playing'), true, 'Replay should preserve playing state on the active button');
  assert.equal(posted.filter(entry => entry.message.ankiPlayAudio).length, 2, 'Each click should post message to play audio');

  handlers.window_message({
    origin: 'http://127.0.0.1:8765',
    source: vm.runInContext('window.parent', ctx),
    data: { ankiAudioEnded: true }
  });
  assert.equal(classes.has('playing'), false, 'Receiving ankiAudioEnded should clear playing state');

  handlers.DOMContentLoaded.handler();
  assert.equal(styleValues['min-height'], '100dvh', 'Card must cover the iframe viewport');
  assert.equal(styleValues['justify-content'], 'flex-start', 'Card viewport should align to top');

  console.log('✓ Embedded study audio: audio delegates to parent and layout aligns to top');
}

// ── Test 4: DOM/CSS regressions ─────────────────────────────────
{
  const appCss = fs.readFileSync(path.join(root, 'dist/app.css'), 'utf8');
  const studentCss = fs.readFileSync(path.join(root, 'dist/student.css'), 'utf8');
  const practiceCss = fs.readFileSync(path.join(root, 'dist/practice.css'), 'utf8');
  
  assert.doesNotMatch(studentCss, /\.anki-bottom-bar>div:first-child/, 'First child hidden rule should not exist in student.css');
  assert.doesNotMatch(studentCss, /\.anki-bottom-bar>div:last-child/, 'Last child hidden rule should not exist in student.css');
  
  const duplicatePills = practiceCss.match(/\.game-audio-pill\s*\{/g);
  assert.equal(duplicatePills.length, 1, 'There should only be one .game-audio-pill definition without the padding 7px 16px');
  assert.doesNotMatch(practiceCss, /padding:\s*7px 16px/, 'Incompatible padding rule should not exist');
  
  const practiceHtml = fs.readFileSync(path.join(root, 'dist/practice.html'), 'utf8');
  assert.match(practiceHtml, /client-startup\.js/, 'practice.html must load theme startup');
  assert.match(fs.readFileSync(path.join(root, 'dist/client-startup.js'), 'utf8'), /anki2-theme.*dark/, 'Startup must restore the saved dark theme');
  
  const appSource = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
  assert.doesNotMatch(appSource, /<span>Audio<\/span>/, 'No visible Audio text should remain');
  assert.match(appSource, /anki-audio-pill.*aria-label/, 'Audio pills must have aria-label');
  assert.match(appSource, /body class="anki-card-body"><main class="card">/, 'The iframe body and card wrapper must be separate');
  assert.match(appSource, /body\.anki-card-body>\.card\{width:100%!important;max-width:none!important/, 'The card wrapper must use the available horizontal width');
  assert.match(appSource, /anki-audio-media/, 'Embedded speaker must contain a persistent media element');
  assert.match(appSource, /crossOrigin='anonymous'/, 'Embedded media must use the server CORS contract from the opaque iframe');
  assert.match(appSource, /card-runtime\.js/, 'The runtime must load externally under CSP');
  assert.match(appSource, /e\.origin==='null'&&frame\.hasAttribute\('srcdoc'\)/, 'Opaque srcdoc messages are allowed only from the current frame');

  const practiceJsSource = fs.readFileSync(path.join(root, 'dist/practice.js'), 'utf8');
  assert.doesNotMatch(practiceJsSource, /🔊\s*Escuchar/, 'No Escuchar text');

  console.log('✓ DOM/CSS structural contract and duplicated rules verified');
}

// ── Test 6: Juegos dark theme sync ──────────────────────────────
{
  const practiceHtml = fs.readFileSync(path.join(root, 'dist/practice.html'), 'utf8');
  assert.match(practiceHtml, /client-startup\.js/, 'Practice must load the local theme bootstrap');
  const startup = fs.readFileSync(path.join(root, 'dist/client-startup.js'), 'utf8');
  for (const savedTheme of ['dark','light']) {
    let applied;
    require('node:vm').runInNewContext(startup, {
      document: { documentElement: { classList: { toggle: (name, value) => { assert.equal(name, 'dark'); applied = value; } } } },
      localStorage: { getItem: key => { assert.equal(key, 'anki2-theme'); return savedTheme; } }, navigator: {}, window: {}
    });
    assert.equal(applied, savedTheme === 'dark', 'Bootstrap must apply the saved theme before rendering');
  }

  const practiceCss = fs.readFileSync(path.join(root, 'dist/practice.css'), 'utf8');
  assert.match(practiceCss, /min-height:\s*100dvh/, 'practice.css must set 100dvh on html/body');

  console.log('✓ Juegos dark theme: sync script and full viewport height present');
}

// ── Test 7: Cache version coherence ─────────────────────────────
{
  const sw = fs.readFileSync(path.join(root, 'dist/sw.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const practiceHtml = fs.readFileSync(path.join(root, 'dist/practice.html'), 'utf8');

  // SW cache name should be updated to studio-workspace
  assert.match(sw, /20260918-studio-workspace/, 'SW CACHE_NAME should include 20260918-studio-workspace');
  // index.html references should match
  assert.match(indexHtml, /app\.css\?v=20260918-studio-workspace/, 'index.html should reference app.css?v=20260918-studio-workspace');
  assert.match(indexHtml, /student\.css\?v=20260918-studio-workspace/, 'index.html should reference student.css?v=20260918-studio-workspace');
  assert.match(indexHtml, /app\.js\?v=20260918-studio-workspace/, 'index.html should reference app.js?v=20260918-studio-workspace');

  assert.match(practiceHtml, /app\.css\?v=20260918-studio-workspace/, 'practice.html should reference app.css?v=20260918-studio-workspace');
  assert.match(practiceHtml, /practice\.css\?v=20260918-studio-workspace/, 'practice.html should reference practice.css?v=20260918-studio-workspace');
  assert.match(practiceHtml, /practice\.js\?v=20260918-studio-workspace/, 'practice.html should reference practice.js?v=20260918-studio-workspace');

  const startup = fs.readFileSync(path.join(root, 'dist/client-startup.js'), 'utf8');
  assert.match(indexHtml, /src="\/client-startup\.js\?v=/, 'Index must load the CSP-compatible startup script');
  assert.match(practiceHtml, /src="\/client-startup\.js\?v=/, 'Practice must load the CSP-compatible startup script');
  assert.match(startup, /updateViaCache:\s*'none'/, 'index.html must bypass HTTP cache when updating the service worker');
  assert.match(startup, /registration\.update\(\)/, 'Startup must request a fresh service worker');
  assert.match(sw, /event\.request\.mode\s*===\s*'navigate'/, 'SW must use a dedicated network-first path for HTML navigations');

}

console.log('\n=== All UX study/audio regression tests passed ===');
