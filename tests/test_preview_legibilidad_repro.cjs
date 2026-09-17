const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-repro-test-'));
  const screenshotsDir = path.join(__dirname, 'screenshots_preview_repro');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const root = path.resolve(__dirname, '..');
  const port = 18779;
  console.log('[Repro Test] Iniciando servidor temporal en puerto', port);
  const server = spawn(path.join(root, '.venv/Scripts/python.exe'), [
    path.join(root, 'server.py'),
    '--port', String(port),
    '--data-dir', temp
  ], { windowsHide: true, stdio: 'pipe' });

  server.stderr.on('data', d => {
    const msg = d.toString();
    if (msg.includes('Traceback') || msg.includes('Error:')) {
      console.error('[Server Error]', msg);
    }
  });

  let browser;
  try {
    // Esperar a que el servidor responda
    const startTime = Date.now();
    let up = false;
    while (Date.now() - startTime < 15000) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.ok) { up = true; break; }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }
    assert(up, 'El servidor de pruebas no inició a tiempo');

    // Crear mazo sintético con tarjeta corta y tarjeta con estilos importados conflictivos
    const deckRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Mazo Diagnóstico' })
    });
    const deckData = await deckRes.json();
    const deckId = deckData.id;

    // Tarjeta 1: Corta
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: '¿Qué es el ADN?',
        back: 'Ácido desoxirribonucleico, portador de la información genética.',
        kind: 'basic'
      })
    });

    // Tarjeta 2: Estilos conflictivos importados (color de texto oscuro fijo que falla en temas oscuros)
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: '<div style="color:#0a0a0a;background:#111111;">Texto con color casi negro sobre fondo negro</div>',
        back: 'Respuesta con estilo conflictivo.',
        kind: 'basic'
      })
    });

    console.log('[Repro Test] Mazo sintético preparado. Abriendo navegador Chromium...');
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForSelector('.deck-card');

    // Iniciar estudio del mazo
    await page.locator(`.deck-card button[data-action="study"][data-id="${deckId}"]`).click();
    await page.waitForTimeout(300);

    // Si aparece selector de bloques, seleccionar 10 tarjetas
    if (await page.locator('#study-block-form').isVisible()) {
      await page.locator('#btn-start-block-submit').click();
      await page.waitForTimeout(300);
    }

    // Verificar que estamos en sesión de estudio (body.in-study)
    const inStudy = await page.evaluate(() => document.body.classList.contains('in-study'));
    console.log('[Repro Test] ¿En sesión de estudio (body.in-study)?:', inStudy);
    assert(inStudy, 'Debe tener la clase body.in-study activa');

    // ─────────────────────────────────────────────────────────────
    // DEFECTO 1: ABRIR EDICIÓN DESDE ESTUDIO Y MEDIR DIÁLOGO
    // ─────────────────────────────────────────────────────────────
    console.log('[Repro Test] Abriendo editor de tarjeta DESDE la sesión de estudio...');
    await page.locator('button[data-action="edit-card"]').click();
    await page.waitForSelector('#card-form');
    await page.waitForTimeout(200);

    const dialogDims = await page.evaluate(() => {
      const dlg = document.querySelector('#modal');
      const formCol = document.querySelector('#card-form-col');
      const prevCol = document.querySelector('#card-preview-col');
      const frame = document.querySelector('#card-editor-preview-frame');
      const dlgStyle = window.getComputedStyle(dlg);
      const prevStyle = prevCol ? window.getComputedStyle(prevCol) : null;
      return {
        dialogClientWidth: dlg.clientWidth,
        dialogOffsetWidth: dlg.offsetWidth,
        dialogScrollWidth: dlg.scrollWidth,
        dialogMaxW: dlgStyle.maxWidth,
        dialogWidth: dlgStyle.width,
        formColWidth: formCol ? formCol.getBoundingClientRect().width : 0,
        prevColWidth: prevCol ? prevCol.getBoundingClientRect().width : 0,
        frameHeight: frame ? frame.getBoundingClientRect().height : 0,
        hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth
      };
    });

    console.log('[Repro Test Medidas Actuales]:', JSON.stringify(dialogDims, null, 2));
    await page.screenshot({ path: path.join(screenshotsDir, 'repro-editor-in-study-1366x768.png') });

    // ─────────────────────────────────────────────────────────────
    // DEFECTO 2: CENTRADO VERTICAL EN ESTUDIO PARA CONTENIDO CORTO
    // ─────────────────────────────────────────────────────────────
    // Cerrar modal y comprobar posición del contenido en el visor de estudio
    await page.locator('[data-action="close-modal"]').first().click();
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);
    await page.waitForTimeout(200);

    const studyFrame = page.frameLocator('#study-frame');
    const verticalPos = await studyFrame.locator('body').evaluate(body => {
      const card = body.querySelector('.card');
      const bodyRect = body.getBoundingClientRect();
      const cardRect = card ? card.getBoundingClientRect() : bodyRect;
      return {
        bodyHeight: bodyRect.height,
        cardTop: cardRect.top,
        cardHeight: cardRect.height,
        justifyContent: window.getComputedStyle(body).justifyContent,
        cardDisplay: card ? window.getComputedStyle(card).display : null,
        isPinnedToTop: cardRect.top < 30
      };
    });

    console.log('[Repro Test Posición Vertical]:', JSON.stringify(verticalPos, null, 2));
    await page.screenshot({ path: path.join(screenshotsDir, 'repro-study-short-card-1366x768.png') });

  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(err => {
  console.error('[Repro Test Failure]', err);
  process.exit(1);
});
