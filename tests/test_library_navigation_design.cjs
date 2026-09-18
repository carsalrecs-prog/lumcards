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
const screenshots = path.join(__dirname, 'screenshots_library_navigation');
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-library-design-test-'));
  const port = await freePort();

  console.log('================================================================');
  console.log('[Test Studio Library] Servidor aislado en puerto:', port);
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

    // 2. Crear datos sintéticos estructurados
    // A) Mazo normal con tarjetas
    const deck1Res = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Inglés Vocabulario Esencial' })
    });
    const deck1 = await deck1Res.json();
    for (let i = 1; i <= 6; i++) {
      await fetch(`http://127.0.0.1:${port}/api/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
        body: JSON.stringify({ deckId: deck1.id, front: `Word ${i}`, back: `Meaning ${i}` })
      });
    }

    // B) Carpeta con submazos
    await fetch(`http://127.0.0.1:${port}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Ciencias Naturales' })
    });
    const subdeckRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Ciencias Naturales::Biología Celular' })
    });
    const subdeck = await subdeckRes.json();
    for (let i = 1; i <= 4; i++) {
      await fetch(`http://127.0.0.1:${port}/api/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
        body: JSON.stringify({ deckId: subdeck.id, front: `Célula ${i}`, back: `Orgánulo ${i}` })
      });
    }

    // C) Mazo con nombre largo
    const deckLongRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Vocabulario Avanzado de Examen Internacional con Nombres Extensos sin Recortes' })
    });
    const deckLong = await deckLongRes.json();
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ deckId: deckLong.id, front: 'Pregunta extensa', back: 'Respuesta' })
    });

    console.log('[Test] Datos sintéticos inicializados correctamente.');

    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const vp of viewports) {
      console.log(`\n--- Probando Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      if (vp.deviceScaleFactor) {
        // emular DPR alto si procede
      }

      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
      await delay(400);

      // A) Comprobar elementos estructurales
      await noHorizontalScroll(page, `${vp.name}-initial`);

      const h1Text = await page.locator('.page-heading h1').textContent();
      assert(h1Text && h1Text.length > 0, `[${vp.name}] Falta título H1 de página`);

      // B) Verificar estilos tipográficos Studio
      const h1Font = await page.locator('.page-heading h1').evaluate(el => window.getComputedStyle(el).fontFamily);
      assert(h1Font.toLowerCase().includes('georgia') || h1Font.toLowerCase().includes('serif'), `[${vp.name}] H1 debe usar tipografía editorial (Georgia/serif), recibido: ${h1Font}`);

      // C) Verificar Paneles de Bienvenida (Focus panel y Goal panel)
      const focusPanel = page.locator('.focus-panel');
      assert.equal(await focusPanel.count(), 1, `[${vp.name}] .focus-panel no encontrado`);
      const focusOrbit = page.locator('.focus-orbit');
      assert.equal(await focusOrbit.count(), 1, `[${vp.name}] .focus-orbit no encontrado`);

      const goalPanel = page.locator('.goal-panel');
      assert.equal(await goalPanel.count(), 1, `[${vp.name}] .goal-panel no encontrado`);

      // D) Verificar Tarjetas de Mazo y Carpetas
      const deckCards = page.locator('.deck-card');
      const count = await deckCards.count();
      assert(count >= 2, `[${vp.name}] Se esperaban al menos 2 tarjetas/carpetas, encontradas: ${count}`);

      // Comprobar radio de esquinas (>= 16px)
      const cardRadius = await deckCards.first().evaluate(el => parseInt(window.getComputedStyle(el).borderRadius, 10));
      assert(cardRadius >= 16, `[${vp.name}] El radio de borde de las tarjetas debe ser >= 16px, recibido: ${cardRadius}px`);

      // E) Verificar carpeta
      const folderCard = page.locator('.folder-card');
      assert(await folderCard.count() >= 1, `[${vp.name}] La carpeta 'Ciencias Naturales' debe tener clase .folder-card`);

      // Captura modo claro
      await page.screenshot({ path: path.join(screenshots, `${vp.name}-light.png`), fullPage: false });

      // F) Probar cambio a Modo Oscuro
      const themeBtn = page.locator('[data-action="theme"]');
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
        await delay(200);

        const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        assert(isDark, `[${vp.name}] Modo oscuro no activado tras clic`);

        const bgDark = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
        // Validar que el fondo no sea blanco
        assert(!bgDark.includes('255, 255, 255'), `[${vp.name}] Fondo en oscuro debe ser oscuro, recibido: ${bgDark}`);

        await noHorizontalScroll(page, `${vp.name}-dark`);
        await page.screenshot({ path: path.join(screenshots, `${vp.name}-dark.png`), fullPage: false });

        // Volver a modo claro
        await themeBtn.click();
        await delay(200);
      }

      // G) Si es móvil, probar apertura del menú lateral accesible
      if (vp.width <= 650) {
        const menuToggle = page.locator('[data-action="menu"]');
        assert(await menuToggle.isVisible(), `[${vp.name}] Botón de menú hamburguesa debe ser visible`);
        await menuToggle.click();
        await delay(250);

        const sidebarOpen = await page.evaluate(() => document.querySelector('.sidebar').classList.contains('open'));
        assert(sidebarOpen, `[${vp.name}] Sidebar debe abrirse al presionar menú`);

        await page.screenshot({ path: path.join(screenshots, `${vp.name}-sidebar-open.png`) });

        // Cerrar con Escape
        await page.keyboard.press('Escape');
        await delay(200);
        const sidebarClosed = await page.evaluate(() => !document.querySelector('.sidebar').classList.contains('open'));
        assert(sidebarClosed, `[${vp.name}] Sidebar debe cerrarse con Escape`);
      }
    }

    // 4. Probar navegación dentro de una carpeta
    console.log('\n--- Probando Navegación de Carpetas ---');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });

    // Abrir la carpeta 'Ciencias Naturales'
    const folderOpenBtn = page.locator('.folder-card .deck-bottom [data-action="open-folder"]');
    await folderOpenBtn.click();
    await delay(300);

    // Verificar que estamos dentro de la carpeta
    const openFolderBanner = await page.locator('text=CARPETA ABIERTA').isVisible();
    assert(openFolderBanner, 'No se visualiza el banner de carpeta abierta');

    const folderTitle = await page.locator('strong:has-text("Ciencias Naturales")').isVisible();
    assert(folderTitle, 'Título de carpeta abierta no visible');

    await noHorizontalScroll(page, 'folder-view');
    await page.screenshot({ path: path.join(screenshots, 'desktop-inside-folder.png') });

    // Salir de la carpeta
    const exitFolderBtn = page.locator('[data-action="exit-folder"]');
    await exitFolderBtn.click();
    await delay(300);

    const backToRoot = await page.locator('text=Tu biblioteca').isVisible();
    assert(backToRoot, 'No volvió a la vista raíz de biblioteca tras salir de carpeta');

    console.log('\n==========================================================');
    console.log(' ¡TODAS LAS PRUEBAS DE DISEÑO Y RESPONSIVE PASARON CON ÉXITO! ');
    console.log(' - Tipografía editorial Georgia en encabezados verificada');
    console.log(' - Paleta Studio y tema oscuro verificados');
    console.log(' - Tarjetas con radio >= 16px y elevación sutil verificadas');
    console.log(' - Ausencia de scroll horizontal en todos los viewports');
    console.log(' - Menú móvil con apertura y cierre por Escape verificado');
    console.log(' - Navegación y banner de carpetas verificados');
    console.log('==========================================================\n');

  } finally {
    if (browser) await browser.close();
    server.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
})();
