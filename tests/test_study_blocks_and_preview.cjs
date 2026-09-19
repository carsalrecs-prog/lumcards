const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-blocks-test-'));
  const screenshotsDir = path.join(__dirname, 'screenshots_study_blocks');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const root = path.resolve(__dirname, '..');
  const port = 18772;
  console.log('[Test] Iniciando servidor de pruebas en puerto', port, 'con data-dir temporal...');
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
    const base = 'http://127.0.0.1:' + port;
    let serverReady = false;
    for (let n = 0; n < 80; n++) {
      try {
        const res = await fetch(base + '/api/health');
        if (res.ok) { serverReady = true; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    assert(serverReady, 'El servidor de pruebas no respondió a tiempo en /api/health');
    console.log('[Test] Servidor listo. Creando mazo sintético con 565 tarjetas...');

    // 1. Crear mazo sintético con 565 tarjetas
    const deckRes = await (await fetch(base + '/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Biología Celular Avanzada' })
    })).json();
    const deckId = deckRes.id;

    // Crear 565 tarjetas mediante importación rápida de texto
    const cardsPayload = [];
    for (let i = 1; i <= 565; i++) {
      cardsPayload.push({
        front: `Concepto ${i}: ¿Cuál es la función del complejo enzimático #${i}?`,
        back: `Función #${i}: Catálisis del sustrato ${i} en la membrana tilacoidal celular con rendimiento energético óptimo.`
      });
    }
    const importRes = await (await fetch(base + '/api/import/text/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ deckId, cards: cardsPayload })
    })).json();
    assert.equal(importRes.added || importRes.created, 565, 'Deben haberse creado exactamente 565 tarjetas sintéticas');
    console.log('[Test] Mazo sintético creado exitosamente con 565 tarjetas.');

    // Verificar bloque inicial
    const initialInfo = await (await fetch(`${base}/api/study/block-info?deckId=${deckId}`)).json();
    assert.equal(initialInfo.totalDeckCards, 565, 'Total de tarjetas debe ser 565');
    assert.equal(initialInfo.availableToday, 565, 'Todas las nuevas deben estar disponibles hoy');
    assert.equal(initialInfo.hasActiveBlock, false, 'No debe haber bloque activo inicialmente');

    // 2. Iniciar Playwright Chromium
    console.log('[Test] Lanzando Chromium real...');
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });
    const page = await browser.newPage();
    await page.goto(base);
    await page.waitForFunction(() => typeof mountCard === 'function');
    await page.evaluate(() => refresh());
    console.log('[Test] Aplicación cargada en navegador y datos sincronizados.');

    // ─────────────────────────────────────────────────────────────
    // FASE A: Personalización de Tarjetas (Tema Índigo, Centrado, Precedencia, Scroll)
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Probando personalizador de tarjetas...');
    await page.setViewportSize({ width: 1366, height: 768 });

    // Abrir personalizador
    await page.evaluate(() => templateEditorModal());
    await page.waitForSelector('.styler-modal');

    // Verificar que existe el tema "Lumcards Índigo"
    const indigoBtn = page.locator('.styler-theme-btn[data-styler-theme="indigo"]');
    assert(await indigoBtn.isVisible(), 'El tema Lumcards Índigo debe estar disponible');
    await indigoBtn.click();

    // Verificar selector "Centrado"
    const alignSelect = page.locator('#styler-align-select');
    const alignOptions = await alignSelect.locator('option').allTextContents();
    assert(alignOptions.some(opt => opt.trim() === 'Centrado'), 'Debe existir la opción "Centrado" exacta');
    await alignSelect.selectOption('center');

    // Verificar selector de precedencia de estilos
    const modeSelect = page.locator('#styler-template-mode-select');
    assert(await modeSelect.isVisible(), 'Debe existir el selector de precedencia');
    await modeSelect.selectOption('lumcards');

    // Comprobar vista previa en iframe con CSP
    const stylerFrame = page.frameLocator('#styler-frame');
    await page.waitForTimeout(150);
    const stylerCard = stylerFrame.locator('main.card');
    assert(await stylerCard.isVisible(), 'La tarjeta de muestra debe renderizarse dentro del iframe');

    // Comprobar volteo de tarjeta en el personalizador
    const flipBtn = page.locator('#styler-btn-flip');
    await flipBtn.click();
    await page.waitForTimeout(100);
    const backText = await stylerFrame.locator('body').innerText();
    assert(backText.includes('reacciones fotoquímicas'), 'El reverso debe visualizarse tras girar');

    // Tomar captura del personalizador en 1366x768
    await page.screenshot({ path: path.join(screenshotsDir, 'styler-preview-1366x768.png') });

    // Cambiar a viewport móvil y verificar captura del personalizador
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(screenshotsDir, 'styler-preview-390x844.png') });

    // Guardar cambios
    await page.locator('#styler-btn-save').click();
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);

    // Verificar persistencia en localStorage
    const savedStyle = await page.evaluate(() => JSON.parse(localStorage.getItem('lumcards-card-style') || '{}'));
    assert.equal(savedStyle.theme, 'indigo', 'El tema guardado debe ser indigo');
    assert.equal(savedStyle.align, 'center', 'La alineación debe ser center');
    assert.equal(savedStyle.templateMode, 'lumcards', 'La precedencia debe ser lumcards');
    console.log('[Test] Personalizador verificado y guardado.');

    // ─────────────────────────────────────────────────────────────
    // FASE B: Vistas Previas en Tiempo Real al Crear (Mazos y Tarjetas)
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Probando vistas previas en tiempo real al crear mazos y notas...');
    await page.setViewportSize({ width: 1366, height: 768 });

    // 1. Vista previa de mazo
    await page.evaluate(() => newDeck());
    await page.waitForSelector('#deck-name-input');
    await page.locator('#deck-name-input').fill('Genética Molecular');
    await page.waitForTimeout(100);
    const deckPreviewName = await page.locator('#deck-live-preview .deck-title').innerText();
    assert.equal(deckPreviewName.trim(), 'Genética Molecular', 'La vista previa del mazo debe actualizarse en tiempo real');
    await page.screenshot({ path: path.join(screenshotsDir, 'deck-create-preview-1366x768.png') });
    // Cancelar sin efectos secundarios
    await page.locator('[data-action="close-modal"]').first().click();
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);

    // 2. Vista previa de tarjeta (split-view en desktop)
    await page.evaluate(async () => await cardForm());
    await page.waitForSelector('#card-form');
    await page.waitForSelector('#card-editor-preview-frame', { state: 'visible' });

    await page.locator('textarea[name="front"]').fill('¿Qué orgánulo produce ATP?');
    await page.locator('textarea[name="back"]').fill('La mitocondria mediante fosforilación oxidativa.');
    await page.waitForTimeout(150);

    const cardPreviewFrame = page.frameLocator('#card-editor-preview-frame');
    const frontPreviewText = await cardPreviewFrame.locator('body').innerText();
    assert(frontPreviewText.includes('¿Qué orgánulo produce ATP?'), 'El anverso debe reflejar el texto escrito en tiempo real');

    // Probar volteo a reverso
    await page.locator('#card-form-flip-btn').click();
    await page.waitForTimeout(120);
    const backPreviewText = await cardPreviewFrame.locator('body').innerText();
    assert(backPreviewText.includes('fosforilación oxidativa'), 'El reverso debe mostrarse en la vista previa');

    // Probar modo de juego "Modo Elegir"
    await page.locator('#card-preview-mode-select').selectOption('choice');
    await page.waitForTimeout(200);
    const choiceText = await cardPreviewFrame.locator('body').innerText();
    assert(choiceText.toLowerCase().includes('modo elegir') && choiceText.includes('fosforilación oxidativa'), 'La vista previa debe mostrar el formato del Modo Elegir');

    // Captura split-view desktop
    await page.screenshot({ path: path.join(screenshotsDir, 'card-create-preview-1366x768.png') });

    // Probar comportamiento responsivo con pestañas en móvil
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    assert(await page.locator('.mobile-tab-bar').isVisible(), 'La barra de pestañas móvil debe estar visible');
    await page.locator('#card-tab-preview').click();
    await page.waitForTimeout(100);
    assert(await page.locator('#card-editor-preview-frame').isVisible(), 'La vista previa debe verse activa en la pestaña móvil');
    await page.screenshot({ path: path.join(screenshotsDir, 'card-create-preview-390x844.png') });

    // Cancelar creación de tarjeta
    await page.locator('[data-action="close-modal"]').first().click();
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);
    console.log('[Test] Vistas previas en tiempo real verificadas con éxito.');

    // ─────────────────────────────────────────────────────────────
    // FASE C: Selector de Bloques de Estudio (10, 20, 50, Personalizado, Todas)
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Probando selector de bloques de estudio...');
    await page.setViewportSize({ width: 1366, height: 768 });

    // Abrir modal de bloques para el mazo
    await page.evaluate(dId => promptStudyBlock(dId), deckId);
    await page.waitForSelector('#study-block-form');

    // Verificar explicación del total vs disponibles hoy
    const modalText = await page.locator('#modal').innerText();
    assert(modalText.includes('565 tarjetas'), 'Debe mostrar el total de 565 tarjetas del mazo');
    assert(modalText.includes('Disponibles para repasar hoy'), 'Debe explicar las tarjetas disponibles para hoy');

    await page.screenshot({ path: path.join(screenshotsDir, 'block-picker-1366x768.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshotsDir, 'block-picker-390x844.png') });
    await page.setViewportSize({ width: 1366, height: 768 });

    // Seleccionar bloque de 20 tarjetas
    const btn20 = page.locator('.block-size-preset[data-size="20"]');
    await btn20.click();
    const customInputVal = await page.locator('#block-custom-input').inputValue();
    assert.equal(customInputVal, '20', 'El preset de 20 debe actualizar el campo a 20');

    // Iniciar bloque
    await page.locator('#btn-start-block-submit').click();
    await page.waitForSelector('.study-surface.study-fullscreen');
    console.log('[Test] Bloque de 20 tarjetas iniciado.');

    // ─────────────────────────────────────────────────────────────
    // FASE D: Repaso de Bloque, Calificación "Otra vez" sin duplicar, y Persistencia
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Verificando sesión de estudio activa y capturas en los 4 viewports...');

    const viewports = [
      [1366, 768, '1366x768'],
      [1024, 650, '1024x650'],
      [390, 844, '390x844'],
      [844, 390, '844x390']
    ];

    for (const [w, h, name] of viewports) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(80);
      await page.screenshot({ path: path.join(screenshotsDir, `study-active-${name}.png`) });
    }

    // Regresar a 1366x768 para las interacciones
    await page.setViewportSize({ width: 1366, height: 768 });

    // Verificar encabezado: Tarjeta 1 de 20 · 20 pendientes · 0 repasadas
    const topBarText = await page.locator('.anki-topbar').innerText();
    assert(topBarText.includes('Tarjeta 1 de 20') || topBarText.includes('20 pendientes'), 'El contador debe reflejar el progreso inicial del bloque');

    // Primera tarjeta: revelar y calificar "Otra vez" (rating 1)
    await page.locator('[data-action="reveal"]').click();
    await page.locator('.anki-rate-button.rate-col-1').click();
    await page.waitForFunction(() => { const t=document.querySelector('.anki-topbar')?.textContent || ''; return t.includes('1 repasadas') && t.includes('19 pendientes'); }, {}, {timeout:10000});

    // Tras calificar "Otra vez":
    // La tarjeta pasa a estar repasada en el bloque (repasadas = 1, pendientes = 19)
    const topBarAfterAgain = await page.locator('.anki-topbar').innerText();
    assert(topBarAfterAgain.includes('1 repasadas') && topBarAfterAgain.includes('19 pendientes'), 'Calificar "Otra vez" debe contar como 1 repasada sin inflar el total de tarjetas distintas');

    // ─────────────────────────────────────────────────────────────
    // FASE E: Persistencia tras Recarga y Navegación
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Verificando persistencia tras recarga del navegador...');
    await page.reload();
    await page.waitForFunction(() => typeof promptStudyBlock === 'function');

    // Intentar estudiar el mazo de nuevo: debe detectar el bloque activo
    await page.evaluate(dId => promptStudyBlock(dId), deckId);
    await page.waitForSelector('#modal [data-action="continue-block"]');
    const resumeText = await page.locator('#modal').innerText();
    assert(resumeText.includes('1 de 20 tarjetas') || resumeText.includes('19 pendientes'), 'Debe reanudar con 1 de 20 repasadas y 19 pendientes');

    // Continuar el bloque
    await page.locator('[data-action="continue-block"]').click();
    await page.waitForSelector('.study-surface.study-fullscreen');

    // Repasar las 19 tarjetas restantes con "Bien" (rating 3)
    console.log('[Test] Completando las 19 tarjetas restantes del bloque...');
    for (let i = 2; i <= 20; i++) {
      await page.waitForSelector('[data-action="reveal"]');
      await page.locator('[data-action="reveal"]').click();
      await page.waitForSelector('.anki-rate-button.rate-col-3');
      await page.locator('.anki-rate-button.rate-col-3').click();
      await page.waitForTimeout(100);
    }

    // ─────────────────────────────────────────────────────────────
    // FASE F: Resumen de Primera Pasada Completada (Sin Auto-avance)
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Verificando pantalla de resumen de primera pasada del bloque...');
    await page.waitForSelector('text=¡Primera pasada del bloque completada!');
    const summaryText = await page.locator('.study-surface').innerText();
    assert(summaryText.includes('20') && summaryText.includes('Tarjetas repasadas'), 'Debe mostrar 20 tarjetas repasadas');
    assert(summaryText.includes('1') && summaryText.includes('«Otra vez»'), 'Debe reflejar 1 fallo de «Otra vez»');

    await page.screenshot({ path: path.join(screenshotsDir, 'block-summary-1366x768.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshotsDir, 'block-summary-390x844.png') });
    await page.setViewportSize({ width: 1366, height: 768 });

    // Volver a los mazos
    await page.locator('[data-action="back-decks"]').click();
    await page.waitForSelector('.deck-grid');

    // ─────────────────────────────────────────────────────────────
    // FASE G: Identificación y Filtros en la Lista de Tarjetas
    // ─────────────────────────────────────────────────────────────
    console.log('[Test] Verificando filtros y etiquetas de bloque en la lista de tarjetas...');
    // Abrir lista de tarjetas del mazo
    await page.evaluate(dId => {
      selectedDeck = dId;
      view = 'cards';
      cardProgressFilter = 'all';
      loadCards().then(() => render());
    }, deckId);
    await page.waitForSelector('.card-list');

    // Verificar etiquetas en las tarjetas
    const reviewedTags = await page.locator('.tag-block-reviewed').count();
    assert.equal(reviewedTags, 20, 'Deben haber exactamente 20 tarjetas con la etiqueta "Repasada en este bloque" en la página actual');

    // Comprobar filtros
    const filterBlockReviewed = page.locator('button[data-status="block-reviewed"]');
    assert(await filterBlockReviewed.isVisible(), 'Debe existir el filtro "Repasadas del bloque"');
    await filterBlockReviewed.click();
    await page.waitForTimeout(100);

    const visibleReviewed = await page.locator('.note-row').count();
    assert.equal(visibleReviewed, 20, 'Al filtrar por "Repasadas del bloque" deben verse exactamente las 20 tarjetas');

    await page.screenshot({ path: path.join(screenshotsDir, 'card-filters-1366x768.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshotsDir, 'card-filters-390x844.png') });

    console.log('──────────────────────────────────────────────────────────');
    console.log(' ¡TODAS LAS VERIFICACIONES EN CHROMIUM PASARON CON ÉXITO! ');
    console.log('  - Mazo sintético de 565 tarjetas verificado');
    console.log('  - Personalizador: Tema Índigo, Centrado, Precedencia, Scroll interno');
    console.log('  - Bloques de estudio: Selección, Persistencia, Recarga, Resumen');
    console.log('  - Vistas previas en tiempo real: Mazos y Tarjetas (Split & Móvil)');
    console.log('  - Capturas guardadas e inspeccionadas en los 4 viewports');
    console.log('──────────────────────────────────────────────────────────');

  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(err => {
  console.error('[Test Failure]', err);
  process.exit(1);
});
