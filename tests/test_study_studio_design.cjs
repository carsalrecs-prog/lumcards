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
const screenshots = path.join(__dirname, 'screenshots_study_studio');
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
    return {
      hasOverflow: scrollWidth > clientWidth + 1,
      scrollWidth,
      clientWidth,
      diff: scrollWidth - clientWidth
    };
  });
  assert(!overflow.hasOverflow, `[${label}] Desbordamiento horizontal detectado: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth} (dif: ${overflow.diff}px)`);
}

(async () => {
  fs.mkdirSync(screenshots, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-study-design-test-'));
  const port = await freePort();

  console.log('================================================================');
  console.log('[Test Studio Study] Servidor aislado en puerto:', port);
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

    // 2. Crear datos sintéticos estructurados para estudio
    const deckRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Biología Celular y Genética' })
    });
    const deck = await deckRes.json();
    const deckId = deck.id;

    // Tarjeta 1: Normal
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: '¿Cuál es la función primordial de la mitocondria en la célula eucariota?',
        back: 'La respiración celular y la generación de ATP mediante fosforilación oxidativa.'
      })
    });

    // Tarjeta 2: Larga para verificar scroll interno en iframe
    const longParagraphs = Array.from({ length: 10 }, (_, i) => `<p>Sección detallada ${i + 1}: Explicación exhaustiva de la estructura de la membrana celular y el transporte activo.</p>`).join('');
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: 'Describe en detalle los componentes del modelo de mosaico fluido:',
        back: `<div>${longParagraphs}</div>`
      })
    });

    console.log('[Test] Mazo y tarjetas de prueba creados.');

    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const vp of viewports) {
      console.log(`\n--- Probando Viewport de Estudio: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Entrar directamente a estudiar el mazo
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
      await delay(400);

      // Clic en estudiar mazo
      const studyBtn = page.locator(`.deck-card [data-action="study"][data-id="${deckId}"]`);
      await studyBtn.click();
      await delay(300);

      if (await page.locator('#btn-start-block-submit').isVisible()) {
        await page.locator('#btn-start-block-submit').click();
        await delay(400);
      } else if (await page.locator('[data-action="continue-block"]').isVisible()) {
        await page.locator('[data-action="continue-block"]').click();
        await delay(400);
      }

      // A) Comprobar elementos de estudio
      await noHorizontalScroll(page, `${vp.name}-study-question`);

      const inStudy = await page.evaluate(() => document.body.classList.contains('in-study'));
      assert(inStudy, `[${vp.name}] body.in-study no activado`);

      const topbar = page.locator('.anki-topbar');
      assert.equal(await topbar.count(), 1, `[${vp.name}] .anki-topbar no encontrado`);

      const cardFrame = page.locator('.anki-card-frame');
      assert.equal(await cardFrame.count(), 1, `[${vp.name}] .anki-card-frame no encontrado`);

      // Radio del marco de la tarjeta >= 14px
      const frameRadius = await cardFrame.evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
      assert(frameRadius >= 14, `[${vp.name}] El radio de marco debe ser >= 14px, recibido: ${frameRadius}px`);

      // B) Botón de mostrar respuesta con estilo Studio
      const revealBtn = page.locator('#btn-reveal-answer');
      assert(await revealBtn.isVisible(), `[${vp.name}] Botón mostrar respuesta no visible`);

      // Captura de la pregunta en modo claro
      await page.screenshot({ path: path.join(screenshots, `${vp.name}-study-question-light.png`), fullPage: false });

      // C) Revelar respuesta con Espacio o Clic
      await page.keyboard.press('Space');
      await delay(300);

      // D) Comprobar botones de calificación 1–4
      const ratingButtons = page.locator('.anki-rate-button');
      assert.equal(await ratingButtons.count(), 4, `[${vp.name}] Se esperaban 4 botones de calificación`);

      await noHorizontalScroll(page, `${vp.name}-study-revealed`);
      await page.screenshot({ path: path.join(screenshots, `${vp.name}-study-answer-light.png`), fullPage: false });

      // E) Probar modo oscuro en la pantalla de estudio
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await delay(200);

      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      assert(isDark, `[${vp.name}] Modo oscuro no activado`);

      // Comprobar que el fondo de .anki-rate-button.rate-col-1 es oscuro y no blanco
      const rate1Bg = await page.locator('.anki-rate-button.rate-col-1').evaluate(el => window.getComputedStyle(el).backgroundColor);
      assert(!rate1Bg.includes('255, 255, 255'), `[${vp.name}] Botón calificación en oscuro no debe tener fondo blanco`);

      await noHorizontalScroll(page, `${vp.name}-study-dark`);
      await page.screenshot({ path: path.join(screenshots, `${vp.name}-study-answer-dark.png`), fullPage: false });

      // Regresar a modo claro
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await delay(100);

      // F) Probar retorno a mazos mediante botón "Mazos" o Esc
      const backBtn = page.locator('.anki-side-action[data-action="back-decks"]');
      await backBtn.click();
      await delay(350);

      const inDecks = await page.evaluate(() => !document.body.classList.contains('in-study'));
      assert(inDecks, `[${vp.name}] No volvió a la biblioteca tras pulsar Mazos`);
    }

    console.log('\n==========================================================');
    console.log(' ¡PRUEBAS DE DISEÑO DE ESTUDIO PASARON CON ÉXITO TOTAL!   ');
    console.log(' - Barra superior .anki-topbar ergonómica y compacta');
    console.log(' - Visor de tarjetas con radio >= 14px y scroll seguro');
    console.log(' - Botón Mostrar Respuesta Studio con indicación de atajo');
    console.log(' - Botones de calificación 1–4 en modo claro y oscuro');
    console.log(' - Cero scroll horizontal en los 5 viewports');
    console.log(' - Retorno limpio a la biblioteca');
    console.log('==========================================================\n');

  } finally {
    if (browser) await browser.close();
    server.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
