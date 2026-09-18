// Real Chromium + isolated backend. Never connects to the user's running app.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(__dirname, 'screenshots_practice_studio');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const viewports = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'laptop', width: 1024, height: 650 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
  // Reflow equivalent to 1366x768 at 200%: half CSS viewport, double DPR.
  // This validates layout, not Chrome's saved per-origin zoom preference.
  { name: 'desktop_zoom_200', width: 683, height: 384, deviceScaleFactor: 2 }
];

async function freePort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

function syntheticWav() {
  const samples = 44100 * 3;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(88200, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i * 440 * 2 * Math.PI / 44100) * 3000), 44 + i * 2);
  return wav;
}

async function noOverflow(page, stage) {
  const result = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const bad = Array.from(document.querySelectorAll('.studio-sidebar, .studio-primary-modes, .studio-secondary-modes, .play-selector-card, #practice-size, .play-mode, .play-import, .play-history, dialog[open]'))
      .filter(el => el.getClientRects().length)
      .map(el => ({ name: el.id || el.className, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }))
      .filter(r => r.left < -1 || r.right > viewport + 1);
    return { width: viewport, scroll: document.documentElement.scrollWidth, bad };
  });
  assert(result.scroll <= result.width + 1, stage + ': horizontal page overflow ' + JSON.stringify(result));
  assert.equal(result.bad.length, 0, stage + ': component outside viewport ' + JSON.stringify(result.bad));
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(screenshots, name + '.png'), fullPage: true, animations: 'disabled' });
}

async function noTextIllustrationOverlap(page, stage) {
  const overlaps = await page.evaluate(() => {
    const collisions = [];
    for (const card of document.querySelectorAll('.studio-primary-modes .play-mode')) {
      const bounds = card.getBoundingClientRect();
      for (const paper of card.querySelectorAll('.studio-paper')) {
        const art = paper.getBoundingClientRect();
        if (art.left < bounds.left + 4 || art.right > bounds.right - 4) {
          collisions.push('Clipped illustration: ' + card.querySelector('h2')?.textContent);
        }
      }
      const paragraph = card.querySelector('p');
      if (!paragraph) continue;
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      for (const line of range.getClientRects()) {
        for (const paper of card.querySelectorAll('.studio-paper')) {
          const art = paper.getBoundingClientRect();
          if (Math.min(line.right, art.right) - Math.max(line.left, art.left) > 1 &&
              Math.min(line.bottom, art.bottom) - Math.max(line.top, art.top) > 1) {
            collisions.push(card.querySelector('h2')?.textContent);
          }
        }
      }
    }
    return [...new Set(collisions)];
  });
  assert.deepEqual(overlaps, [], stage + ': decorative art overlaps description text');
}

async function visibleClick(page, selector) {
  const locator = page.locator(selector).filter({ visible: true }).first();
  await locator.click();
}

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-studio-e2e-'));
  fs.mkdirSync(screenshots, { recursive: true });
  const port = await freePort();
  const base = 'http://127.0.0.1:' + port;
  let logs = '';
  let browser, server;
  try {
    // Isolate UI coverage from the pre-existing timestamp-ID collision in demo
    // seeding. This creates a real, empty database using the production schema,
    // not a mock. Fresh-library/demo startup is deliberately NOT covered here.
    const initialized = spawnSync(path.join(root, '.venv/Scripts/python.exe'), ['-c',
      'import sys; from clean_engine import CleanCollection; col = CleanCollection(sys.argv[1]); col.close()',
      path.join(temp, 'collection.anki2')
    ], { cwd: root, windowsHide: true, encoding: 'utf8' });
    assert.equal(initialized.status, 0, 'Empty fixture initialization failed: ' + initialized.stderr);
    server = spawn(path.join(root, '.venv/Scripts/python.exe'), [path.join(root, 'server.py'), '--port', String(port), '--data-dir', temp], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
    server.stderr.on('data', chunk => { logs = (logs + chunk).slice(-12000); });
    let healthy = false;
    for (let n = 0; n < 120; n++) {
      if (server.exitCode !== null) throw new Error('Test backend exited: ' + logs);
      try { if ((await fetch(base + '/api/health')).ok) { healthy = true; break; } } catch {}
      await delay(150);
    }
    assert(healthy, 'Isolated backend failed to start: ' + logs);
    async function api(route, data) {
      const response = await fetch(base + route, data === undefined ? {} : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
        body: JSON.stringify(data)
      });
      assert(response.ok, route + ' returned ' + response.status);
      return response.json();
    }
    // Only synthetic media and cards in the unique temporary data directory.
    const media = path.join(temp, 'collection.media');
    fs.mkdirSync(media, { recursive: true });
    fs.writeFileSync(path.join(media, 'studio-tone.wav'), syntheticWav());
    const bio = await api('/api/decks', { name: 'Studio::Biologia' });
    const history = await api('/api/decks', { name: 'Studio::Historia' });
    for (const [deck, count, prefix] of [[bio, 8, 'Biologia'], [history, 4, 'Historia']]) {
      for (let n = 1; n <= count; n++) await api('/api/cards', {
        deckId: deck.id,
        front: prefix + ' pregunta sintetica ' + n + ' [sound:studio-tone.wav]',
        back: prefix + ' respuesta sintetica ' + n
      });
    }
    await api('/api/decks', { name: 'Nombre deliberadamente extenso para comprobar ajuste y ausencia de desbordamientos en el explorador' });
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor || 1,
        serviceWorkers: 'block'
      });
      // External CDNs are not required by these fixtures; keep tests private/offline.
      await context.route('**/*', route => {
        const url = route.request().url();
        return url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:') ? route.continue() : route.abort();
      });
      await context.addInitScript(() => {
        localStorage.setItem('anki2-theme', 'light');
        localStorage.setItem('lumcards-sound', 'false');
        const NativeAudio = window.Audio;
        window.__studioAudios = [];
        window.Audio = function Audio(src) {
          const audio = new NativeAudio(src);
          window.__studioAudios.push(audio);
          return audio;
        };
        window.Audio.prototype = NativeAudio.prototype;
      });
      const page = await context.newPage();
      const pageErrors = [];
      const criticalAssets = new Set(['/practice.html', '/app.css', '/practice.css', '/student.css', '/study-games.js', '/practice.js']);
      const loadedAssets = new Set();
      const assetErrors = [];
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin !== base || !criticalAssets.has(url.pathname)) return;
        if (response.status() >= 400) assetErrors.push(url.pathname + ': HTTP ' + response.status());
        else if (response.ok()) loadedAssets.add(url.pathname);
      });
      page.on('requestfailed', request => {
        const url = new URL(request.url());
        if (url.origin === base && criticalAssets.has(url.pathname)) assetErrors.push(url.pathname + ': ' + request.failure()?.errorText);
      });
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(base + '/practice.html');
      await page.waitForFunction(() => window.state?.ready && document.body.classList.contains('practice-studio'));
      await page.locator('.play-selector-card').waitFor();
      assert.equal(await page.locator('#play-content h1').innerText(), 'Aprender también puede ser un juego.');
      assert.equal(await page.locator('.studio-primary-modes [data-action="start"]').count(), 3);
      assert.equal(await page.locator('.studio-secondary-modes [data-action="start"]').count(), 3);
      assert.deepEqual((await page.locator('[data-action="start"]').evaluateAll(els => els.map(el => el.dataset.mode))).sort(), ['choice', 'flash', 'learn', 'match', 'test', 'write']);
      await noOverflow(page, viewport.name + ' home light');
      await shot(page, viewport.name + '_01_home_light');
      await noTextIllustrationOverlap(page, viewport.name + ' home light');
      await visibleClick(page, '[data-action="toggle-theme"]');
      await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
      assert.equal(await page.evaluate(() => localStorage.getItem('anki2-theme')), 'dark');
      await noOverflow(page, viewport.name + ' home dark');
      await shot(page, viewport.name + '_02_home_dark');
      await visibleClick(page, '[data-action="toggle-theme"]');
      await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));

      if (viewport.name === 'desktop') {
        // Model a parent with its own three cards plus a two-card child, under
        // an absent/virtual intermediate folder. Root totals must neither lose
        // parent-owned cards nor double count children. Restore before sessions.
        await page.evaluate(() => {
          window.__originalStudioDecks = state.decks;
          state.decks = [
            { id: 990001, name: 'Contenedor::Padre', total: 5 },
            { id: 990002, name: 'Contenedor::Padre::Hijo', total: 2 },
            { id: 990003, name: 'Independiente', total: 4 }
          ];
        });
        await visibleClick(page, '[data-tab="import"]');
        await visibleClick(page, '[data-tab="play"]');
        assert.match(await page.locator('.play-selector-meta').innerText(), /9\s*tarjetas/);
        await page.locator('.play-selector-card').click();
        const allRow = page.locator('.explorer-row').filter({ has: page.locator('.explorer-row-name', { hasText: /^Todos mis mazos$/ }) });
        assert.equal(await allRow.locator('.explorer-tag-count').innerText(), '9 tarjetas');
        const virtualFolder = page.locator('.explorer-row-lead').filter({ has: page.locator('.explorer-row-name', { hasText: /^Contenedor$/ }) });
        await virtualFolder.click();
        assert.match(await page.locator('.explorer-folder-hero-info').innerText(), /5 tarjetas en total/);
        await page.keyboard.press('Escape');
        await page.evaluate(() => { state.decks = window.__originalStudioDecks; delete window.__originalStudioDecks; });
        await visibleClick(page, '[data-tab="import"]');
        await visibleClick(page, '[data-tab="play"]');
        assert.match(await page.locator('.play-selector-meta').innerText(), /12\s*tarjetas/);
      }

      // Keyboard-only open, search autofocus, Escape and return focus.
      await page.locator('.play-selector-card').focus();
      await page.keyboard.press('Enter');
      await page.locator('#deck-explorer-dialog[open]').waitFor();
      await page.waitForFunction(() => document.activeElement?.id === 'explorer-search-input');
      await noOverflow(page, viewport.name + ' explorer');
      await shot(page, viewport.name + '_03_explorer');
      await page.keyboard.press('Escape');
      await page.locator('#deck-explorer-dialog').waitFor({ state: 'detached' });
      assert(await page.locator('.play-selector-card').evaluate(el => el === document.activeElement || el.contains(document.activeElement)), 'Escape should restore selector focus');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.id === 'explorer-search-input');
      const folder = page.locator('.explorer-row-lead').filter({ has: page.locator('.explorer-row-name', { hasText: /^Studio$/ }) });
      await folder.focus();
      await page.keyboard.press('Enter');
      await page.locator('.explorer-hero-btn').waitFor();
      await page.locator('.explorer-hero-btn').focus();
      await page.keyboard.press('Enter');
      await page.locator('#deck-explorer-dialog').waitFor({ state: 'detached' });
      assert.equal((await page.locator('.play-selector-title').innerText()).trim(), 'Studio');
      assert.match(await page.locator('.play-selector-meta').innerText(), /12\s*tarjetas/);
      await page.selectOption('#practice-size', '5');
      const selectedDeck = await page.evaluate(() => state.deckId);

      // Navigation does not discard selected content or a not-yet-imported draft.
      await visibleClick(page, '[data-tab="import"]');
      await page.locator('#import-paste').fill('Pregunta\tRespuesta\nBorrador de prueba\tRespuesta de prueba');
      await page.locator('#import-deck').waitFor();
      assert(await page.locator('#import-deck option[value="new"]').count(), 'Importer retains new-deck option');
      await noOverflow(page, viewport.name + ' import');
      await shot(page, viewport.name + '_04_import');
      await visibleClick(page, '[data-tab="history"]');
      await page.waitForFunction(() => state.tab === 'history' && !state.historyLoading);
      await noOverflow(page, viewport.name + ' history');
      await shot(page, viewport.name + '_05_history');
      await visibleClick(page, '[data-tab="import"]');
      assert.match(await page.locator('#import-paste').inputValue(), /Borrador de prueba/);
      await visibleClick(page, '[data-tab="play"]');
      assert.equal(await page.locator('#practice-size').inputValue(), '5');
      assert.equal(await page.evaluate(() => state.deckId), selectedDeck);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.studio-primary-modes .play-mode').first().hover();
      await page.waitForTimeout(50);
      const homeMotion = await page.evaluate(() => document.getAnimations().filter(animation => {
        const timing = animation.effect.getComputedTiming();
        return animation.playState === 'running' && (timing.duration > 1 || timing.iterations === Infinity);
      }).map(animation => ({ name: animation.animationName || animation.transitionProperty, target: animation.effect.target?.className, duration: animation.effect.getComputedTiming().duration, iterations: animation.effect.getComputedTiming().iterations })));
      assert.deepEqual(homeMotion, [], 'Reduced motion must disable home/hover animation too: ' + JSON.stringify(homeMotion));
      await page.locator('[data-action="start"][data-mode="flash"]').click();
      await page.waitForFunction(() => state.session?.mode === 'flash');
      assert(await page.locator('body').evaluate(el => el.classList.contains('studio-session')), 'Study shell should enter focused mode');
      assert.equal(await page.evaluate(() => state.session.total), 5);
      assert.equal(await page.evaluate(() => new Set(state.session.pool.map(card => card.id)).size), 12);
      await noOverflow(page, viewport.name + ' flash session');
      const longAnimations = await page.evaluate(() => document.getAnimations().filter(animation => {
        const timing = animation.effect.getComputedTiming();
        return animation.playState === 'running' && (timing.duration > 1 || timing.iterations === Infinity);
      }).map(animation => ({ name: animation.animationName, duration: animation.effect.getComputedTiming().duration })));
      assert.deepEqual(longAnimations, [], 'Reduced motion must disable sustained animation');

      // Native media object instrumentation, not a playback mock: decoded time advances.
      const audio = page.locator('.flashcard-face.front [data-action="play-audio"]');
      await audio.click();
      await page.waitForFunction(() => { const audio = window.__studioAudios.at(-1); return audio && !audio.paused && audio.currentTime > 0.35; });
      const beforeReplay = await page.evaluate(() => window.__studioAudios.length);
      await audio.click();
      await page.waitForFunction(count => window.__studioAudios.length > count && window.__studioAudios.at(-1).currentTime > 0.1, beforeReplay);
      assert(await page.evaluate(() => { const previous = window.__studioAudios.at(-2), current = window.__studioAudios.at(-1); return previous.paused && previous.currentTime === 0 && !current.paused && !current.error; }), 'Replay must stop old audio and start newly decoded audio');
      await shot(page, viewport.name + '_06_flash');
      await page.locator('[data-action="cancel"]').click();
      await page.locator('.play-selector-card').waitFor();
      assert.equal(await page.evaluate(() => state.deckId), selectedDeck);
      assert.equal(await page.locator('#practice-size').inputValue(), '5');
      assert.equal(await page.locator('body').evaluate(el => el.classList.contains('studio-session')), false);

      // All existing modes still launch and return through the redesigned shell.
      for (const mode of ['learn', 'match', 'write', 'test', 'choice']) {
        await page.locator('[data-action="start"][data-mode="' + mode + '"]').click();
        await page.waitForFunction(expected => state.session?.mode === expected, mode);
        await noOverflow(page, viewport.name + ' session ' + mode);
        await page.locator('[data-action="cancel"]').click();
        await page.locator('.play-selector-card').waitFor();
      }
      assert.deepEqual(pageErrors, [], viewport.name + ': unexpected browser errors');
      assert.deepEqual(assetErrors, [], viewport.name + ': critical local asset failure');
      assert.deepEqual([...loadedAssets].sort(), [...criticalAssets].sort(), viewport.name + ': critical assets must really load');
      await context.close();
      console.log('PASS ' + viewport.name + ': themes, layout, keyboard, import/history, 6 modes, audio replay, reduced motion');
    }
    console.log('PASS: four viewports + effective 200% zoom, 30 screenshots; synthetic isolated backend only. Demo seeding intentionally excluded due to known timestamp-ID collision.');
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await Promise.race([exited, delay(5000)]);
    }
    // Bound cleanup to this exact mkdtemp result, never to repository/user data.
    const safeRoot = path.resolve(os.tmpdir());
    const safeTarget = path.resolve(temp);
    assert(path.dirname(safeTarget).toLowerCase() === safeRoot.toLowerCase() && path.basename(safeTarget).startsWith('lumcards-studio-e2e-'), 'Unsafe test cleanup path');
    if (!server || server.exitCode !== null) fs.rmSync(safeTarget, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
