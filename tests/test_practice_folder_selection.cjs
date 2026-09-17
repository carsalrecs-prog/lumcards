const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

(async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-practice-folders-test-'));
  const screenshotsDir = path.join(__dirname, 'screenshots_practice_folders');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const root = path.resolve(__dirname, '..');
  const port = 18792;
  console.log('================================================================');
  console.log('[Test E2E] Iniciando servidor temporal en puerto', port);
  console.log('Data-dir temporal:', tempDir);
  console.log('================================================================');

  const server = spawn(path.join(root, '.venv/Scripts/python.exe'), [
    path.join(root, 'server.py'),
    '--port', String(port),
    '--data-dir', tempDir
  ], { windowsHide: true, stdio: 'pipe' });

  server.stderr.on('data', d => {
    const msg = d.toString();
    if (msg.includes('Traceback') || msg.includes('Error:')) {
      console.error('[Server Error]', msg);
    }
  });

  let browser;
  try {
    // 1. Esperar arranque del servidor
    const startTime = Date.now();
    let up = false;
    while (Date.now() - startTime < 15000) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.ok) { up = true; break; }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 200));
    }
    // 2. Limpiar tarjetas demo iniciales para aislar la prueba
    console.log('[Setup] Limpiando tarjetas demo iniciales...');
    const initCardsRes = await fetch(`http://127.0.0.1:${port}/api/cards?limit=200`);
    const initCardsJson = await initCardsRes.json();
    for (const c of (initCardsJson.cards || [])) {
      await fetch(`http://127.0.0.1:${port}/api/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
        body: JSON.stringify({ type: 'card', id: c.id })
      });
    }

    // Crear datos sintéticos de 3 niveles:
    // Idiomas -> Idiomas::Ingles -> Idiomas::Ingles::Vocabulario (15)
    //                           -> Idiomas::Ingles::Gramatica (10)
    //         -> Idiomas::Frances (8)
    // Examenes::Ingles::Vocabulario (5) [Homónimo para probar desambiguación]
    // Mazo Suelto (4)
    // Total de tarjetas: 15 + 10 + 8 + 5 + 4 = 42 tarjetas.

    async function createDeck(name) {
      const res = await fetch(`http://127.0.0.1:${port}/api/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
        body: JSON.stringify({ name })
      });
      return await res.json();
    }

    async function addCards(deckId, count, prefix) {
      for (let i = 1; i <= count; i++) {
        await fetch(`http://127.0.0.1:${port}/api/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
          body: JSON.stringify({
            deckId,
            front: `${prefix} Pregunta ${i}`,
            back: `${prefix} Respuesta ${i}`
          })
        });
      }
    }

    console.log('[Setup] Creando jerarquía de mazos y tarjetas...');
    const dVocabIngles = await createDeck('Idiomas::Ingles::Vocabulario');
    await addCards(dVocabIngles.id, 15, 'Vocab Inglés');

    const dGramIngles = await createDeck('Idiomas::Ingles::Gramatica');
    await addCards(dGramIngles.id, 10, 'Gram Inglés');

    const dFrances = await createDeck('Idiomas::Frances');
    await addCards(dFrances.id, 8, 'Francés');

    const dVocabExamenes = await createDeck('Examenes::Ingles::Vocabulario');
    await addCards(dVocabExamenes.id, 5, 'Examen Vocab');

    const dSuelto = await createDeck('Mazo Suelto');
    await addCards(dSuelto.id, 4, 'Suelto');

    console.log('[Setup] Verificando estado devuelto por el servidor...');
    const stateRes = await fetch(`http://127.0.0.1:${port}/api/state`);
    const stateJson = await stateRes.json();
    console.log(`[Setup] Decks creados: ${stateJson.decks.length}, Total tarjetas: ${stateJson.counts.totalCards}`);
    assert.equal(stateJson.counts.totalCards, 42, 'Debe haber exactamente 42 tarjetas');

    // 3. Iniciar Chromium
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    });

    const viewports = [
      { name: 'desktop_1366', width: 1366, height: 768 },
      { name: 'tablet_1024', width: 1024, height: 650 },
      { name: 'mobile_portrait_390', width: 390, height: 844 },
      { name: 'mobile_landscape_844', width: 844, height: 390 }
    ];

    // Iterar por viewports para validar visualmente y capturar
    for (const vp of viewports) {
      console.log(`\n--- Probando Viewport ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });
      const page = await context.newPage();

      await page.goto(`http://127.0.0.1:${port}/practice.html`);
      await page.waitForSelector('.play-selector-card');

      // A) Verificar pantalla principal
      const selName = await page.$eval('.play-selector-name, .play-selector-title', el => el.textContent.trim());
      const selCount = await page.$eval('.play-selector-meta', el => el.textContent.trim());
      console.log(`[${vp.name}] Selección inicial: "${selName}", Meta: "${selCount}"`);
      assert.equal(selName, 'Todos mis mazos');
      assert.match(selCount, /42\s*tarjetas/);

      // Studio separates the two configuration labels from the mode section heading.
      const stepLabels = await page.$$eval('.play-step-label', els => els.map(e => e.textContent.trim()));
      console.log(`[${vp.name}] Pasos encontrados:`, stepLabels);
      assert.equal(stepLabels.length, 2);
      assert.match(stepLabels[0], /QUÉ VAS A PRACTICAR/i);
      assert.match(stepLabels[1], /TU RITMO/i);
      assert.equal(await page.locator('.studio-mode-section[aria-label="Modos de práctica"]').count(), 1);
      assert.equal(await page.locator('.studio-mode-section [data-action="start"]').count(), 6);

      // B) Abrir Explorador de Mazos
      await page.click('.play-selector-card');
      await page.waitForSelector('#deck-explorer-dialog[open]');
      console.log(`[${vp.name}] Explorador modal abierto`);

      // Verificar vista Raíz:
      // Debe contener "Todos mis mazos"
      // Y solo los elementos raíz: "Idiomas", "Examenes", "Mazo Suelto"
      // NO debe tener "Vocabulario" o "Gramatica" en la raíz
      const rootRowNames = await page.$$eval('#deck-explorer-dialog .explorer-row-name', els => els.map(e => e.textContent.trim()));
      console.log(`[${vp.name}] Filas en Raíz:`, rootRowNames);
      assert.ok(rootRowNames.includes('Todos mis mazos'));
      assert.ok(rootRowNames.includes('Idiomas'));
      assert.ok(rootRowNames.includes('Examenes'));
      assert.ok(rootRowNames.includes('Mazo Suelto'));
      assert.ok(!rootRowNames.includes('Vocabulario'), 'Vocabulario no debe aparecer mezclado en la raíz');

      // Captura de vista raíz
      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}_01_root.png`) });

      // C) Navegar dentro de la carpeta "Idiomas"
      const idiomasLead = await page.locator('#deck-explorer-dialog .explorer-row-lead', { hasText: 'Idiomas' });
      await idiomasLead.click();
      await page.waitForTimeout(200);

      // Verificar migas de pan y hero banner
      const breadcrumbsText = await page.$eval('.explorer-breadcrumbs', el => el.textContent.trim());
      console.log(`[${vp.name}] Migas de pan en Idiomas:`, breadcrumbsText);
      assert.match(breadcrumbsText, /Idiomas/);

      const heroText = await page.$eval('.explorer-folder-hero', el => el.textContent.trim());
      console.log(`[${vp.name}] Banner hero de carpeta:`, heroText);
      assert.match(heroText, /Incluye sus submazos\s*\(33\s*tarjetas/);

      const subRowNames = await page.$$eval('#deck-explorer-dialog .explorer-row-name', els => els.map(e => e.textContent.trim()));
      console.log(`[${vp.name}] Contenido de Idiomas:`, subRowNames);
      assert.ok(subRowNames.includes('Ingles'));
      assert.ok(subRowNames.includes('Frances'));
      assert.ok(!subRowNames.includes('Mazo Suelto'));

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}_02_folder_idiomas.png`) });

      // D) Navegar dentro de "Ingles"
      const inglesLead = await page.locator('#deck-explorer-dialog .explorer-row-lead', { hasText: 'Ingles' });
      await inglesLead.click();
      await page.waitForTimeout(200);

      const inglesSubRows = await page.$$eval('#deck-explorer-dialog .explorer-row-name', els => els.map(e => e.textContent.trim()));
      console.log(`[${vp.name}] Contenido de Idiomas::Ingles:`, inglesSubRows);
      assert.ok(inglesSubRows.includes('Vocabulario'));
      assert.ok(inglesSubRows.includes('Gramatica'));

      // E) Probar "Elegir toda esta carpeta" en Idiomas::Ingles
      console.log(`[${vp.name}] Pulsando 'Elegir toda esta carpeta'...`);
      await page.click('.explorer-hero-btn');
      await page.waitForTimeout(250);

      // Verificar que el modal se cerró y NO se inició el juego (seguimos en Home)
      const isModalOpen = await page.evaluate(() => Boolean(document.querySelector('#deck-explorer-dialog[open]')));
      assert.equal(isModalOpen, false, 'El modal debe cerrarse tras seleccionar');

      const isGameSession = await page.evaluate(() => Boolean(document.querySelector('.play-session')));
      assert.equal(isGameSession, false, 'Elegir carpeta no debe iniciar el juego automáticamente');

      // Verificar tarjeta resumen en Home
      const updatedTitle = await page.$eval('.play-selector-title', el => el.textContent.trim());
      const updatedPath = await page.$eval('.play-selector-path', el => el.textContent.trim());
      const updatedMeta = await page.$eval('.play-selector-meta', el => el.textContent.trim());
      console.log(`[${vp.name}] Resumen tras elegir carpeta: Title="${updatedTitle}", Path="${updatedPath}", Meta="${updatedMeta}"`);
      assert.equal(updatedTitle, 'Ingles');
      assert.match(updatedPath, /Idiomas\s*➔\s*Ingles/);
      assert.match(updatedMeta, /25\s*tarjetas/);
      assert.match(updatedMeta, /Incluye submazos/);

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}_03_selected_folder_home.png`) });

      // F) Probar búsqueda global y desambiguación de homónimos
      await page.click('.play-selector-card');
      await page.waitForSelector('#deck-explorer-dialog[open]');
      await page.fill('#explorer-search-input', 'Vocabulario');
      await page.waitForTimeout(250);

      const searchResultPaths = await page.$$eval('#deck-explorer-dialog .explorer-row-path', els => els.map(e => e.textContent.trim()));
      console.log(`[${vp.name}] Resultados búsqueda 'Vocabulario':`, searchResultPaths);
      assert.equal(searchResultPaths.length, 2, 'Debe encontrar los 2 mazos homónimos de Vocabulario');
      assert.ok(searchResultPaths.some(p => p.includes('Idiomas') && p.includes('Ingles') && p.includes('Vocabulario')));
      assert.ok(searchResultPaths.some(p => p.includes('Examenes') && p.includes('Ingles') && p.includes('Vocabulario')));

      await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}_04_search_homonyms.png`) });

      // Cerrar explorador con botón ✕ o Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      await context.close();
    }

    // 4. Verificación funcional de inicio de sesión con carpeta seleccionada
    console.log('\n--- Probando inicio de sesión con carpeta que contiene descendientes ---');
    const playContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const playPage = await playContext.newPage();
    playPage.on('console', msg => console.log('[Browser Console]', msg.type(), msg.text()));
    playPage.on('pageerror', err => console.log('[Browser PageError]', err));
    await playPage.goto(`http://127.0.0.1:${port}/practice.html`);
    await playPage.waitForSelector('.play-selector-card');

    // Seleccionar la carpeta "Idiomas"
    await playPage.click('.play-selector-card');
    await playPage.waitForSelector('#deck-explorer-dialog[open]');
    // Navegar en Idiomas y elegirla
    const lead = await playPage.locator('#deck-explorer-dialog .explorer-row-lead', { hasText: 'Idiomas' });
    await lead.click();
    await playPage.waitForSelector('.explorer-hero-btn');
    await playPage.click('.explorer-hero-btn');

    // Configurar 50 tarjetas por sesión para recibir el pool completo
    await playPage.selectOption('#practice-size', '50');

    // Iniciar modo Tarjetas (flashcard)
    console.log('[Play] Iniciando modo Tarjetas con carpeta Idiomas...');
    const startFlashBtn = playPage.locator('.play-mode', { hasText: 'Tarjetas' }).locator('button[data-action="start"]');
    await startFlashBtn.click();

    await playPage.waitForSelector('.flashcard-scene, .play-session');
    console.log('[Play] Sesión de juego iniciada con éxito');

    // Verificar tarjetas recibidas en state.session
    const sessionInfo = await playPage.evaluate(() => {
      const s = window.state?.session;
      if (!s) return null;
      return {
        deckName: s.deckName,
        total: s.total,
        poolLength: s.pool?.length,
        uniqueIds: new Set(s.pool.map(c => c.id)).size
      };
    });

    console.log('[Play] Info de sesión activa:', sessionInfo);
    assert.ok(sessionInfo, 'Debe haber una sesión activa');
    assert.equal(sessionInfo.poolLength, 33, 'Idiomas debe contener exactamente 33 tarjetas (15+10+8)');
    assert.equal(sessionInfo.uniqueIds, 33, 'No debe haber ninguna tarjeta duplicada');

    await playPage.screenshot({ path: path.join(screenshotsDir, 'session_flashcard_folder.png') });

    // Cancelar sesión
    await playPage.click('button[data-action="cancel"]');
    await playPage.waitForSelector('.play-selector-card');

    // 5. Verificar preservación del selector de destino en la pestaña de Importar
    console.log('\n--- Probando preservación del selector en pestaña Importar ---');
    await playPage.click('[data-tab="import"]');
    await playPage.waitForSelector('#import-deck');

    const importDeckOptions = await playPage.$$eval('#import-deck option', els => els.map(e => ({ value: e.value, text: e.textContent.trim() })));
    console.log(`[Import] Opciones en #import-deck (${importDeckOptions.length}):`, importDeckOptions.slice(0, 4));
    assert.ok(importDeckOptions.length > 0, '#import-deck debe tener opciones disponibles');
    assert.ok(importDeckOptions.some(o => o.value === 'new'), 'Debe conservar opción de Crear nuevo mazo');

    await playPage.screenshot({ path: path.join(screenshotsDir, 'import_deck_selector_intact.png') });

    // 6. Probar funcionamiento offline / fallback
    console.log('\n--- Probando fallback offline para selección de carpeta con descendientes ---');
    const offlineResult = await playPage.evaluate(async () => {
      // Simular base local en localStorage
      const mockWebData = {
        decks: [
          { id: 10, name: 'Carpeta A', isFolder: true, childIds: [10, 11, 12], total: 20 },
          { id: 11, name: 'Carpeta A::Sub 1', isFolder: false, total: 12 },
          { id: 12, name: 'Carpeta A::Sub 2', isFolder: false, total: 8 }
        ],
        cards: [
          { id: 101, deckId: 11, front: 'A1', back: 'B1' },
          { id: 102, deckId: 11, front: 'A2', back: 'B2' },
          { id: 103, deckId: 12, front: 'A3', back: 'B3' },
          { id: 104, deckId: 99, front: 'Otro', back: 'Otro' }
        ]
      };
      localStorage.setItem('lumcards_web_data', JSON.stringify(mockWebData));

      // Llamar a api('/api/exam/start') forzando fallo de red para disparar el catch offline
      try {
        const res = await window.api('http://127.0.0.1:9999/api/exam/start', { deckId: 10 });
        return { ok: true, cards: res.cards };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });

    console.log('[Offline Fallback] Resultado:', offlineResult);
    assert.ok(offlineResult.ok, 'El fallback offline debe responder exitosamente');
    assert.equal(offlineResult.cards.length, 3, 'Debe incluir tarjetas de Sub 1 y Sub 2');
    const cardIds = offlineResult.cards.map(c => c.id);
    assert.deepEqual(cardIds.sort(), [101, 102, 103], 'Debe filtrar únicamente descendientes sin duplicar');

    console.log('\n================================================================');
    console.log('✅ TODAS LAS PRUEBAS DE SELECCIÓN JERÁRQUICA PASARON CON ÉXITO');
    console.log('================================================================\n');

  } finally {
    if (browser) await browser.close();
    server.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
})();
