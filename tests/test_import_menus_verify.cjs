const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

(async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-import-menus-test-'));
  const screenshotsDir = path.join(__dirname, 'screenshots_import_menus');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const root = path.resolve(__dirname, '..');
  const port = 18785;
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
    // 1. Esperar arranque de servidor
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

    // 2. Crear datos sintéticos iniciales
    // A) Mazo Suelto para prueba de borrado
    const deckRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Mazo para Borrar' })
    });
    const deckData = await deckRes.json();
    const deckId = deckData.id;

    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ deckId, front: 'Pregunta suelta 1', back: 'Respuesta suelta 1' })
    });

    // B) Carpeta con submazos para prueba de borrado preservando hijos
    const folderRes = await fetch(`http://127.0.0.1:${port}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Carpeta Idiomas' })
    });
    const folderData = await folderRes.json();
    const folderId = folderData.id;

    const sub1Res = await (await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Carpeta Idiomas::Libro Ingles' })
    })).json();
    const sub1Id = sub1Res.id;

    await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Carpeta Idiomas::Libro Frances' })
    });

    // C) Tarjeta extra-larga que sobrepase el viewport para pendiente D (en sub1Id, que se preserva tras borrar la carpeta)
    const extraLongText = Array.from({ length: 18 }, (_, idx) => 
      `<p>Párrafo de contenido extenso número ${idx + 1}: Este es un párrafo largo diseñado específicamente para garantizar que la altura total de la tarjeta exceda ampliamente la altura de la ventana gráfica en cualquier resolución estándar de prueba.</p>`
    ).join('\n');

    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId: sub1Id,
        front: `<h3>Documento Extenso de Verificación</h3>\n${extraLongText}`,
        back: 'Respuesta breve del documento extenso'
      })
    });

    // Tarjeta corta para probar tamaño manual de fuente
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId: sub1Id,
        front: 'Pregunta suelta 1 corta',
        back: 'Respuesta suelta 1 corta'
      })
    });

    // D) Tarjeta con cloze anidado
    await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId: sub1Id,
        front: '<p>La fotosíntesis ocurre en los <span class="cloze"><strong>cloroplastos</strong></span> de las células vegetales.</p>',
        back: 'Detalle de los cloroplastos'
      })
    });

    console.log('[Test E2E] Datos sintéticos listos. Lanzando Chromium...');
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // ─────────────────────────────────────────────────────────────
    // HITO 1 / REQ A: FORMULARIOS DE CREAR MAZO, CARPETA Y RENOMBRAR
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 1: Formularios en 4 Viewports (Crear mazo, carpeta, renombrar) ---');
    const viewports = [
      { name: '1366x768', width: 1366, height: 768 },
      { name: '1024x650', width: 1024, height: 650 },
      { name: '390x844', width: 390, height: 844 },
      { name: '844x390', width: 844, height: 390 }
    ];

    for (const vp of viewports) {
      console.log(`\nVerificando viewport: ${vp.name}`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.waitForSelector('.deck-card');

      // 1. Probar Crear mazo
      await page.locator('button[data-action="new-deck"]').click();
      await page.waitForSelector('#deck-form');
      await page.waitForTimeout(200);

      const newDeckDims = await page.evaluate(() => {
        const dlg = document.querySelector('#modal');
        const form = document.querySelector('#deck-form');
        const preview = document.querySelector('#deck-live-preview');
        const cancelBtn = dlg.querySelector('button[data-action="close-modal"]');
        const submitBtn = dlg.querySelector('#deck-form button.btn-primary');
        const input = document.querySelector('#deck-name-input');
        return {
          dialogHasClass: dlg.classList.contains('dialog-deck-modal'),
          dialogClientW: dlg.clientWidth,
          dialogScrollW: dlg.scrollWidth,
          hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth,
          formVisible: form ? form.offsetWidth > 0 : false,
          cancelVisible: cancelBtn ? cancelBtn.offsetWidth > 0 : false,
          submitVisible: submitBtn ? submitBtn.offsetWidth > 0 : false,
          previewInert: preview ? preview.classList.contains('deck-preview-inert') : false,
          previewHasNoActivePreviewId: !dlg.querySelector('button[data-id="preview"]:not([disabled])')
        };
      });

      console.log(`[Crear mazo - ${vp.name}]`, newDeckDims);
      assert.equal(newDeckDims.dialogHasClass, true, 'Debe tener clase dialog-deck-modal');
      assert.equal(newDeckDims.hasHorizontalOverflow, false, 'No debe tener overflow horizontal');
      assert.equal(newDeckDims.formVisible, true, 'Formulario debe ser visible');
      assert.equal(newDeckDims.cancelVisible, true, 'Botón Cancelar debe ser visible');
      assert.equal(newDeckDims.submitVisible, true, 'Botón Crear mazo debe ser visible');
      assert.equal(newDeckDims.previewInert, true, 'Vista previa debe ser inerte');
      assert.equal(newDeckDims.previewHasNoActivePreviewId, true, 'No debe haber botones activos con data-id=preview');

      // Escribir en el input para verificar reactividad de la preview
      await page.locator('#deck-name-input').fill('Biología Celular');
      await page.waitForTimeout(100);
      const previewTitle = await page.locator('#deck-live-preview .deck-title').textContent();
      assert(previewTitle.includes('Biología Celular'), `La preview debe reflejar el nombre escrito: ${previewTitle}`);

      await page.screenshot({ path: path.join(screenshotsDir, `01-new-deck-${vp.name}.png`) });

      // Cerrar modal
      await page.locator('#modal .dialog-head button[data-action="close-modal"]').click();
      await page.waitForTimeout(200);

      // 2. Probar Crear carpeta
      await page.locator('button[data-action="new-folder"]').click();
      await page.waitForSelector('#folder-form');
      await page.waitForTimeout(200);

      const folderDims = await page.evaluate(() => {
        const dlg = document.querySelector('#modal');
        const form = document.querySelector('#folder-form');
        const cancelBtn = dlg.querySelector('button[data-action="close-modal"]');
        const submitBtn = dlg.querySelector('#folder-form button.btn-primary');
        return {
          dialogHasClass: dlg.classList.contains('dialog-deck-modal'),
          dialogClientW: dlg.clientWidth,
          dialogScrollW: dlg.scrollWidth,
          hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth,
          cancelVisible: cancelBtn ? cancelBtn.offsetWidth > 0 : false,
          submitVisible: submitBtn ? submitBtn.offsetWidth > 0 : false
        };
      });

      console.log(`[Crear carpeta - ${vp.name}]`, folderDims);
      assert.equal(folderDims.dialogHasClass, true);
      assert.equal(folderDims.hasHorizontalOverflow, false);
      assert.equal(folderDims.cancelVisible, true);
      assert.equal(folderDims.submitVisible, true);

      await page.locator('#modal .dialog-head button[data-action="close-modal"]').click();
      await page.waitForTimeout(200);
    }

    // ─────────────────────────────────────────────────────────────
    // HITO 2 / REQ C: ELIMINAR DESDE BIBLIOTECA CON CONFIRMACIÓN Y BACKUP
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 2: Eliminar mazo y carpeta desde menú de biblioteca ---');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForSelector('.deck-card');

    // A) Eliminar mazo suelto
    const mazoCard = page.locator('.deck-card', { hasText: 'Mazo para Borrar' });
    assert(await mazoCard.isVisible(), 'El mazo para borrar debe ser visible');

    // Abrir menú de opciones
    await mazoCard.locator('summary.icon-button').click();
    await page.waitForTimeout(200);

    const deleteBtn = mazoCard.locator('button[data-action="delete-deck-prompt"]');
    assert(await deleteBtn.isVisible(), 'El botón Eliminar mazo debe estar presente en el menú');

    await deleteBtn.click();
    await page.waitForSelector('.delete-deck-prompt-modal');
    await page.waitForTimeout(200);

    // Verificar contenido de confirmación
    const modalText = await page.locator('.delete-deck-prompt-modal').textContent();
    assert(modalText.includes('Mazo para Borrar'), 'Debe mencionar el nombre del mazo');
    assert(modalText.includes('tarjetas que se eliminarán') || modalText.includes('tarjetas'), 'Debe indicar tarjetas');
    assert(modalText.includes('copia de seguridad'), 'Debe indicar copia de seguridad previa');

    await page.screenshot({ path: path.join(screenshotsDir, '02-delete-deck-confirm-modal.png') });

    // Confirmar eliminación
    await page.locator('#btn-submit-delete-deck').click();
    await page.waitForTimeout(600);

    // Verificar que el mazo ya no existe en la biblioteca
    const mazoCardAfter = page.locator('.deck-card', { hasText: 'Mazo para Borrar' });
    assert.equal(await mazoCardAfter.count(), 0, 'El mazo debe haber sido eliminado');

    // B) Eliminar carpeta con opción CONSERVAR SUBMAZOS (keepChildren: true)
    console.log('\nEliminando carpeta con keepChildren=true...');
    const carpetaCard = page.locator('.deck-card', { hasText: 'Carpeta Idiomas' });
    assert(await carpetaCard.isVisible(), 'La tarjeta de Carpeta Idiomas debe estar visible');

    await carpetaCard.locator('summary.icon-button').click();
    await page.waitForTimeout(200);

    const deleteFolderBtn = carpetaCard.locator('button[data-action="delete-deck-prompt"]');
    assert(await deleteFolderBtn.isVisible(), 'El botón Eliminar carpeta debe estar en el menú');
    await deleteFolderBtn.click();

    await page.waitForSelector('.delete-deck-prompt-modal');
    await page.waitForTimeout(200);

    const folderModalText = await page.locator('.delete-deck-prompt-modal').textContent();
    assert(folderModalText.includes('Carpeta Idiomas'), 'Debe nombrar la carpeta');
    assert(folderModalText.includes('2'), 'Debe listar 2 submazos');

    // Verificar que la opción "Conservar libros y submazos" está seleccionada por defecto
    const isKeepChecked = await page.locator('input[name="folder-delete-scope"][value="keep"]').isChecked();
    assert.equal(isKeepChecked, true, 'La opción de conservar submazos debe estar seleccionada por defecto');

    await page.screenshot({ path: path.join(screenshotsDir, '03-delete-folder-keep-children-modal.png') });

    // Confirmar borrado seguro
    await page.locator('#btn-submit-delete-deck').click();
    await page.waitForTimeout(600);

    // Comprobar que la carpeta ya no existe, pero los submazos ahora están desanidados en la biblioteca
    const carpetaCardAfter = page.locator('.deck-card.folder-card', { hasText: 'Carpeta Idiomas' });
    assert.equal(await carpetaCardAfter.count(), 0, 'La carpeta contenedora debe haber desaparecido');

    const sub1 = page.locator('.deck-card', { hasText: 'Libro Ingles' });
    const sub2 = page.locator('.deck-card', { hasText: 'Libro Frances' });
    assert(await sub1.count() > 0, 'Submazo Libro Ingles debe conservarse en la biblioteca');
    assert(await sub2.count() > 0, 'Submazo Libro Frances debe conservarse en la biblioteca');

    // Verificar que se generó backup antes de los borrados
    const backupsRes = await fetch(`http://127.0.0.1:${port}/api/backups`);
    const backups = await backupsRes.json();
    console.log(`Copias de seguridad encontradas tras borrados: ${backups.length}`);
    assert(backups.length >= 2, 'Debe haber creado copias de seguridad automáticas antes de los borrados');

    // ─────────────────────────────────────────────────────────────
    // HITO 3 / REQ B: PREVIEW VISUAL REACTIVA EN IMPORTADOR DE JUEGOS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 3: Preview visual interactiva y reactiva en Importador de Juegos ---');
    await page.goto(`http://127.0.0.1:${port}/practice.html`);
    await page.waitForSelector('.play-tabs');

    // Cambiar a la pestaña de Importar
    await page.locator('button[data-tab="import"]').click();
    await page.waitForSelector('.play-import');
    await page.waitForTimeout(200);

    // 1. Verificar textos neutrales (sin promesas legales absolutas)
    const importIntroText = await page.locator('.play-import p').first().textContent();
    console.log('Texto introductorio del importador:', importIntroText);
    assert(!importIntroText.includes('100% legal e independiente'), 'No debe contener la afirmación de 100% legal e independiente');

    // 2. Estado vacío inicial
    assert(await page.locator('.import-empty-guide').isVisible(), 'Debe mostrar guía orientativa vacía');
    const saveBtnInitial = page.locator('#save-import-btn');
    assert.equal(await saveBtnInitial.isDisabled(), true, 'Botón Guardar debe estar deshabilitado al inicio');

    // 3. Escribir texto sintético y comprobar reactividad automática (debounce)
    const testImportText = `Mitocondria\tCentral energética celular
Ribosoma\tFábrica de proteínas
Cloroplasto\tLugar donde ocurre la fotosíntesis
Núcleo\tContiene el material genético`;

    await page.locator('#import-paste').fill(testImportText);
    // Esperar debounce de 240ms + petición
    await page.waitForTimeout(500);

    // 4. Verificar tabla de revisión de datos y tarjeta interactiva
    assert(await page.locator('.import-split-layout').isVisible(), 'Debe mostrar el layout dividido');
    const tableRowsCount = await page.locator('.import-preview-table-col tbody tr').count();
    console.log(`Filas detectadas en tabla: ${tableRowsCount}`);
    assert.equal(tableRowsCount, 4, 'Deben detectarse 4 filas en la tabla');

    const cardCounterText = await page.locator('.import-card-counter').textContent();
    console.log('Contador de tarjeta interactiva:', cardCounterText);
    assert(cardCounterText.includes('Tarjeta 1 de 4'), 'Debe iniciar en Tarjeta 1 de 4');

    const cardInitialText = await page.locator('.import-card-text').textContent();
    assert.equal(cardInitialText.trim(), 'Mitocondria', 'El anverso debe ser Mitocondria');

    // 5. Probar voltear anverso/reverso
    await page.locator('.import-card-body').click();
    await page.waitForTimeout(100);
    const cardFlippedText = await page.locator('.import-card-text').textContent();
    assert.equal(cardFlippedText.trim(), 'Central energética celular', 'El reverso debe mostrar Central energética');

    // Voltear de nuevo
    await page.locator('.import-card-body').click();
    await page.waitForTimeout(100);
    assert.equal((await page.locator('.import-card-text').textContent()).trim(), 'Mitocondria');

    // 6. Probar navegación Siguiente / Anterior
    await page.locator('button[data-action="import-next-card"]').click();
    await page.waitForTimeout(100);
    assert((await page.locator('.import-card-counter').textContent()).includes('Tarjeta 2 de 4'));
    assert.equal((await page.locator('.import-card-text').textContent()).trim(), 'Ribosoma');

    await page.locator('button[data-action="import-prev-card"]').click();
    await page.waitForTimeout(100);
    assert((await page.locator('.import-card-counter').textContent()).includes('Tarjeta 1 de 4'));

    await page.screenshot({ path: path.join(screenshotsDir, '04-import-preview-reactive-desktop.png') });

    // 7. Probar en viewport móvil (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const mobileTabsVisible = await page.locator('.import-mobile-tabs').isVisible();
    assert.equal(mobileTabsVisible, true, 'Pestañas móviles deben estar visibles en viewport móvil');

    // Cambiar a tarjeta interactiva en móvil
    await page.locator('button[data-action="import-tab-card"]').click();
    await page.waitForTimeout(100);
    assert(await page.locator('.import-preview-card-col').isVisible(), 'Columna de tarjeta debe ser visible');

    await page.screenshot({ path: path.join(screenshotsDir, '05-import-preview-reactive-mobile.png') });

    // Restaurar viewport desktop y guardar importación
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(200);

    // Seleccionar nuevo mazo
    await page.locator('#import-deck').selectOption('new');
    await page.waitForTimeout(100);
    await page.locator('#import-new-deck').fill('Mazo Importado E2E');

    // Guardar
    assert.equal(await page.locator('#save-import-btn').isDisabled(), false, 'Botón Guardar debe estar habilitado');
    await page.locator('#save-import-btn').click();
    await page.waitForTimeout(600);

    // Verificar que se creó el nuevo mazo en la biblioteca
    const checkDeckRes = await fetch(`http://127.0.0.1:${port}/api/state`);
    const checkState = await checkDeckRes.json();
    const importedDeck = checkState.decks.find(d => d.name === 'Mazo Importado E2E');
    assert(importedDeck, 'El mazo importado debe existir en el estado');
    assert.equal(importedDeck.total, 4, 'El mazo importado debe contener 4 tarjetas');

    // ─────────────────────────────────────────────────────────────
    // HITO 4 / REQ D: PENDIENTES DE REVISIÓN PREVIA
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 4: Pendientes de revisión anterior ---');
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForSelector('.deck-card');

    // Iniciar estudio del mazo que contiene la tarjeta extra-larga (sub1Id)
    await page.locator(`.deck-card button[data-action="study"][data-id="${sub1Id}"]`).click();
    await page.waitForTimeout(300);
    if (await page.locator('#study-block-form').isVisible()) {
      await page.locator('#btn-start-block-submit').click();
      await page.waitForTimeout(300);
    }

    // A) Verificar scroll real desbordado en tarjeta larga
    // Vamos a la tarjeta larga
    const studyFrame = page.frameLocator('#study-frame');

    // Recargar con la tarjeta extra-larga creada antes en sub1Id
    await page.evaluate(async (dId) => {
      const state = await (await fetch('/api/state')).json();
      const longCard = state.cards.find(c => c.deckId === dId && c.front.includes('Documento Extenso'));
      if (longCard && window.mountCard) {
        window.mountCard(document.querySelector('#study-frame'), longCard, false);
      }
    }, sub1Id);
    await page.waitForTimeout(400);

    const scrollMetrics = await studyFrame.locator('body').evaluate(body => {
      const doc = body.ownerDocument;
      const win = doc.defaultView;
      const scrollEl = doc.scrollingElement || doc.documentElement;
      
      const initialScrollTop = scrollEl.scrollTop || win.scrollY;
      win.scrollTo(0, scrollEl.scrollHeight);
      const scrolledTop = scrollEl.scrollTop || win.scrollY;
      win.scrollTo(0, 0);

      return {
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        hasRealScrollOverflow: scrollEl.scrollHeight > scrollEl.clientHeight,
        initialScrollTop,
        scrolledTop,
        canScrollToBottom: scrolledTop > initialScrollTop
      };
    });

    console.log('Métricas de Scroll Real Desbordado:', scrollMetrics);
    assert.equal(scrollMetrics.hasRealScrollOverflow, true, `La tarjeta extra-larga debe desbordar realmente (scrollHeight=${scrollMetrics.scrollHeight} > clientHeight=${scrollMetrics.clientHeight})`);
    assert.equal(scrollMetrics.canScrollToBottom, true, 'Debe ser posible scrollear hasta el final');

    // B) Verificar respeto de tamaño manual elegido en tarjetas cortas
    await page.evaluate(() => {
      localStorage.setItem('lumcards-card-style', JSON.stringify({
        theme: 'clean',
        font: 'sans',
        size: '18px',
        align: 'center',
        templateMode: 'lumcards'
      }));
    });

    // Cargar tarjeta corta
    await page.evaluate((dId) => {
      const shortCard = {
        id: 'test_short_card',
        deckId: dId,
        front: 'Pregunta suelta 1 corta',
        back: 'Respuesta suelta 1 corta'
      };
      if (window.mountCard) {
        window.mountCard(document.querySelector('#study-frame'), shortCard, false);
      }
    }, sub1Id);
    await page.waitForTimeout(400);

    const shortCardFontMetrics = await studyFrame.locator('.card-content-wrapper').evaluate(el => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        isShortClass: el.classList.contains('card-short')
      };
    });

    console.log('Métricas de tamaño de fuente manual en tarjeta corta:', shortCardFontMetrics);
    const parsedFontSize = parseFloat(shortCardFontMetrics.fontSize);
    assert(parsedFontSize <= 20, `El tamaño no debe forzar 38px cuando el usuario eligió 18px (obtenido: ${shortCardFontMetrics.fontSize})`);

    // C) Verificar cloze con descendientes anidados (bold / strong)
    await page.evaluate((dId) => {
      const clozeCard = {
        id: 'test_cloze_card',
        deckId: dId,
        front: '<p>La fotosíntesis ocurre en los <span class="cloze"><strong>cloroplastos</strong></span> de las células vegetales.</p>',
        back: 'Detalle de los cloroplastos'
      };
      if (window.mountCard) {
        window.mountCard(document.querySelector('#study-frame'), clozeCard, false);
      }
    }, sub1Id);
    await page.waitForTimeout(400);

    const clozeChildColor = await studyFrame.locator('.cloze strong').evaluate(el => {
      const cs = window.getComputedStyle(el);
      const parentCs = window.getComputedStyle(el.parentElement);
      return {
        childColor: cs.color,
        parentColor: parentCs.color
      };
    });

    console.log('Métricas de color cloze con hijos anidados:', clozeChildColor);
    assert.equal(clozeChildColor.childColor, clozeChildColor.parentColor, 'El descendiente del cloze debe heredar el color del cloze y no el color base de la tarjeta');

    // D) Verificar aislamiento de la vista previa en el editor de tarjetas
    console.log('\nVerificando aislamiento de preview en el editor...');
    await page.locator('button[data-action="edit-card"]').click();
    await page.waitForSelector('#card-form');
    await page.waitForTimeout(300);

    const previewFrameHasNoRuntime = await page.evaluate(() => {
      const frame = document.querySelector('#card-editor-preview-frame');
      const srcdoc = frame ? frame.srcdoc : '';
      return !srcdoc.includes('card-runtime.js');
    });

    assert.equal(previewFrameHasNoRuntime, true, 'El iframe de preview no debe cargar card-runtime.js para evitar interferir con la sesión de estudio');

    console.log('\n================================================================');
    console.log('✅ TODAS LAS PRUEBAS E2E Y VERIFICACIONES PASARON EXITOSAMENTE.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ ERROR EN PRUEBAS E2E:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
})();
