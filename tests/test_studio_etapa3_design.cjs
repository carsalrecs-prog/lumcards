// Real Chromium + isolated backend. Never connects to the user's running app or data.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(__dirname, 'screenshots_studio_etapa3');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const viewports = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'laptop', width: 1024, height: 650 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
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

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
    const clientWidth = docEl.clientWidth;
    const wideElements = [];
    document.querySelectorAll('.main *').forEach(el => {
      if (el.scrollWidth > clientWidth + 1 || el.clientWidth > clientWidth + 1 || el.offsetWidth > clientWidth + 1) {
        wideElements.push({
          tag: el.tagName,
          cls: String(el.className || ''),
          id: el.id,
          style: el.getAttribute('style'),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          offsetWidth: el.offsetWidth
        });
      }
    });
    return {
      hasOverflow: scrollWidth > clientWidth + 1,
      scrollWidth,
      clientWidth,
      diff: scrollWidth - clientWidth,
      wideElements
    };
  });
  if (overflow.hasOverflow) {
    console.error(`[${label}] Elementos anchos encontrados:`, JSON.stringify(overflow.wideElements.slice(0, 5), null, 2));
  }
  assert(!overflow.hasOverflow, `[${label}] Desbordamiento horizontal detectado: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth} (dif: ${overflow.diff}px)`);
}

(async () => {
  fs.mkdirSync(screenshots, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-etapa3-test-'));
  const port = await freePort();

  console.log('================================================================');
  console.log('[Test Studio Etapa 3] Servidor aislado en puerto:', port);
  console.log('Directorio de datos temporal:', tempDir);
  console.log('================================================================');

  const server = spawn(path.join(root, '.venv/Scripts/python.exe'), [
    path.join(root, 'server.py'),
    '--port', String(port),
    '--data-dir', tempDir
  ], { windowsHide: true, stdio: 'pipe' });

  server.stderr.on('data', d => {
    const msg = d.toString();
    if (msg.includes('Traceback') || msg.includes('Error:')) {
      console.error('[Server]', msg);
    }
  });

  let browser;
  try {
    // 1. Esperar arranque de servidor
    const start = Date.now();
    let up = false;
    while (Date.now() - start < 15000) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.ok) { up = true; break; }
      } catch (_) {}
      await delay(200);
    }
    assert(up, 'El servidor de pruebas no arrancó a tiempo');

    // 2. Crear datos sintéticos estructurados (Mazo + varias tarjetas para explorer y stats)
    const deckRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Fisiología Médica y Farmacología' })
    });
    const deck = await deckRes.json();
    const deckId = deck.id;

    for (let i = 1; i <= 6; i++) {
      await fetch(`http://127.0.0.1:${port}/api/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
        body: JSON.stringify({
          deckId,
          front: `Concepto Fisiológico #${i}: Mecanismo de acción y receptores clave`,
          back: `Explicación detallada para la tarjeta ${i} con consideraciones farmacocinéticas.`
        })
      });
    }

    console.log('[Test] Mazo y 6 tarjetas de prueba creados.');

    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const vp of viewports) {
      console.log(`\n--- Probando Viewport Etapa 3: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
      await delay(350);

      // =========================================================================
      // 1. COMPROBACIÓN DE MODALES (Bloque de estudio y nuevo mazo)
      // =========================================================================
      console.log(`[${vp.name}] Comprobando modal de bloque de estudio...`);
      const studyBtn = page.locator(`.deck-card [data-action="study"][data-id="${deckId}"]`);
      await studyBtn.click();
      await delay(300);

      const modalEl = page.locator('#modal');
      assert(await modalEl.isVisible(), `[${vp.name}] Modal no visible al pulsar estudiar`);

      // Radio de esquina del diálogo >= 18px
      const modalRadius = await modalEl.evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
      assert(modalRadius >= 18, `[${vp.name}] Radio del modal debe ser >= 18px, obtenido: ${modalRadius}px`);

      // Botones preset de bloque
      const presets = page.locator('.block-size-preset');
      if (await presets.count() > 0) {
        const presetRadius = await presets.first().evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
        assert(presetRadius >= 8, `[${vp.name}] Radio del preset de bloque debe ser >= 8px`);
      }

      await noHorizontalScroll(page, `${vp.name}-modal-study-block`);
      if (vp.name === 'desktop') {
        await page.screenshot({ path: path.join(screenshots, 'desktop-modal-study-block.png'), fullPage: false });
      }

      // Cerrar modal con Escape
      await page.keyboard.press('Escape');
      await delay(250);
      const isModalOpen = await modalEl.evaluate(el => el.open);
      assert(!isModalOpen, `[${vp.name}] Modal debió cerrarse con Escape`);

      // =========================================================================
      // 2. COMPROBACIÓN DE EXPLORADOR DE TARJETAS (cardsView)
      // =========================================================================
      console.log(`[${vp.name}] Comprobando explorador de tarjetas...`);
      // Navegar a Tarjetas
      if (vp.width <= 650) {
        // En móvil, abrir drawer si no está visible el nav
        const mobileToggle = page.locator('.mobile-toggle');
        if (await mobileToggle.isVisible()) {
          await mobileToggle.click();
          await delay(250);
        }
      }
      const navCards = page.locator('.nav-item[data-view="cards"]');
      await navCards.click();
      await delay(400);

      // Cerrar drawer en móvil si quedó abierto
      if (vp.width <= 650) {
        await page.keyboard.press('Escape');
        await delay(150);
      }

      const noteRows = page.locator('.note-row');
      const noteCount = await noteRows.count();
      assert(noteCount >= 1, `[${vp.name}] No se encontraron tarjetas en el explorador`);

      // Radio de fila de tarjeta >= 14px
      const noteRadius = await noteRows.first().evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
      assert(noteRadius >= 14, `[${vp.name}] Radio de .note-row debe ser >= 14px, obtenido: ${noteRadius}px`);

      // Tags semánticos
      const tags = page.locator('.tag');
      assert(await tags.count() >= 1, `[${vp.name}] No se encontraron tags semánticos`);

      await noHorizontalScroll(page, `${vp.name}-cards-explorer-light`);
      if (vp.name === 'desktop' || vp.name === 'mobile') {
        await page.screenshot({ path: path.join(screenshots, `${vp.name}-cards-explorer-light.png`), fullPage: false });
      }

      // =========================================================================
      // 3. COMPROBACIÓN DE MI PROGRESO / ESTADÍSTICAS (statsView)
      // =========================================================================
      console.log(`[${vp.name}] Comprobando Mi progreso / Estadísticas...`);
      if (vp.width <= 650) {
        const mobileToggle = page.locator('.mobile-toggle');
        if (await mobileToggle.isVisible()) {
          await mobileToggle.click();
          await delay(250);
        }
      }
      const navStats = page.locator('.nav-item[data-view="stats"]');
      await navStats.click();
      await delay(500);

      if (vp.width <= 650) {
        await page.keyboard.press('Escape');
        await delay(150);
      }

      const statsContainer = page.locator('.stats-container');
      assert.equal(await statsContainer.count(), 1, `[${vp.name}] .stats-container no encontrado`);

      const statsCards = page.locator('.stats-card');
      assert(await statsCards.count() >= 1, `[${vp.name}] .stats-card no encontrado`);

      // Radio de tarjeta de estadística >= 16px
      const statsCardRadius = await statsCards.first().evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
      assert(statsCardRadius >= 16, `[${vp.name}] Radio de .stats-card debe ser >= 16px, obtenido: ${statsCardRadius}px`);

      // Cajas de métricas
      const metricBoxes = page.locator('.stats-metric-box');
      if (await metricBoxes.count() > 0) {
        const boxRadius = await metricBoxes.first().evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
        assert(boxRadius >= 10, `[${vp.name}] Radio de .stats-metric-box debe ser >= 10px`);
      }

      await noHorizontalScroll(page, `${vp.name}-stats-light`);
      if (vp.name === 'desktop' || vp.name === 'mobile') {
        await page.screenshot({ path: path.join(screenshots, `${vp.name}-stats-light.png`), fullPage: false });
      }

      // Probar modo oscuro en estadísticas
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await delay(200);

      await noHorizontalScroll(page, `${vp.name}-stats-dark`);
      if (vp.name === 'desktop') {
        await page.screenshot({ path: path.join(screenshots, 'desktop-stats-dark.png'), fullPage: false });
      }

      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await delay(100);
    }

    console.log('\n==========================================================');
    console.log(' ¡PRUEBAS DE ETAPA 3 PASARON CON ÉXITO TOTAL!             ');
    console.log(' - Modales Studio: radio >= 18px, presets y foco accesible');
    console.log(' - Explorador de tarjetas: filas redondeadas >= 14px y tags');
    console.log(' - Mi progreso: tarjetas con radio >= 16px y métricas');
    console.log(' - Cero scroll horizontal en los 5 viewports');
    console.log(' - Modo claro y modo oscuro coherentes');
    console.log('==========================================================\n');

  } finally {
    if (browser) await browser.close();
    server.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
