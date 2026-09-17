const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

// Utilidad para calcular contraste WCAG 2.1
function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [255, 255, 255];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function relativeLuminance(r, g, b) {
  const sRGB = [r / 255, g / 255, b / 255].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-verify-test-'));
  const screenshotsDir = path.join(__dirname, 'screenshots_preview_verified');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const root = path.resolve(__dirname, '..');
  const port = 18780;
  console.log('================================================================');
  console.log('[Verify Test] Iniciando servidor temporal en puerto', port);
  console.log('================================================================');
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

    // 2. Crear mazo sintético con casos de prueba clave
    const deckRes = await fetch(`http://127.0.0.1:${port}/api/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({ name: 'Mazo Verificación' })
    });
    const deckData = await deckRes.json();
    const deckId = deckData.id;

    // Tarjeta 1: Corta sintética (pregunta y respuesta directas)
    const cardShortRes = await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: '¿Cuál es la función principal de la clorofila?',
        back: 'Absorber energía lumínica durante la fotosíntesis.',
        kind: 'basic'
      })
    });
    const cardShortData = await cardShortRes.json();

    // Tarjeta 2: Larga sintética (múltiples párrafos)
    const longFront = `<h3>Mecanismo de Replicación del ADN</h3>
<p>La replicación del ADN es el proceso semiconservativo mediante el cual una molécula de ADN bicatenario se duplica para producir dos moléculas de ADN idénticas. Este proceso es fundamental para la división celular y la transmisión de la herencia genética.</p>
<p>La helicasa desenrolla la doble hélice rompiendo los puentes de hidrógeno entre las bases nitrogenadas. Las proteínas de unión a cadena simple (SSB) estabilizan las hebras separadas impidiendo su renaturalización.</p>
<p>La ADN polimerasa III sintetiza la nueva cadena conductora de forma continua en dirección 5' a 3', mientras que la cadena rezagada se sintetiza de forma discontinua mediante fragmentos de Okazaki que posteriormente son unidos por la ADN ligasa.</p>
<p>La topoisomerasa alivia la tensión torsional generada por el superenrollamiento del ADN por delante de la horquilla de replicación.</p>`;
    const cardLongRes = await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: longFront,
        back: '<p>Respuesta detallada sobre polimerasas, ligasas y cebadores de ARN.</p>',
        kind: 'basic'
      })
    });

    // Tarjeta 3: Tarjeta con estilos importados conflictivos (colores oscuros inline sobre tema oscuro)
    const conflictFront = `<div style="color:#111827;background:#ffffff;padding:8px">
<p style="color:#1f2937">Texto importado con color oscuro forzado</p>
<span class="cloze">[Texto oculto cloze]</span>
<div class="katex-display"><span class="katex">E = mc^2</span></div>
</div>`;
    const cardConflictRes = await fetch(`http://127.0.0.1:${port}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Anki-Request': '1' },
      body: JSON.stringify({
        deckId,
        front: conflictFront,
        back: '<p style="color:#000000">Respuesta importada con color negro</p>',
        kind: 'basic'
      })
    });

    console.log('[Verify Test] Datos sintéticos inicializados. Lanzando Chromium...');
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // ─────────────────────────────────────────────────────────────
    // PRUEBA 1: APERTURA DESDE SESIÓN DE ESTUDIO A 1366x768 (DESKTOP)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 1: Editor desde Estudio (1366x768) ---');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForSelector('.deck-card');

    // Iniciar estudio
    await page.locator(`.deck-card button[data-action="study"][data-id="${deckId}"]`).click();
    await page.waitForTimeout(300);
    if (await page.locator('#study-block-form').isVisible()) {
      await page.locator('#btn-start-block-submit').click();
      await page.waitForTimeout(300);
    }

    const inStudy = await page.evaluate(() => document.body.classList.contains('in-study'));
    assert(inStudy, 'Debe estar en sesión de estudio (body.in-study)');

    // Abrir editor desde estudio
    await page.locator('button[data-action="edit-card"]').click();
    await page.waitForSelector('#card-form');
    await page.waitForTimeout(300);

    const desktopStudyEditorDims = await page.evaluate(() => {
      const dlg = document.querySelector('#modal');
      const prevCol = document.querySelector('#card-preview-col');
      const formCol = document.querySelector('#card-form-col');
      const frame = document.querySelector('#card-editor-preview-frame');
      const dlgStyle = window.getComputedStyle(dlg);
      return {
        dialogHasClass: dlg.classList.contains('dialog-card-editor'),
        dialogClientWidth: dlg.clientWidth,
        dialogScrollWidth: dlg.scrollWidth,
        dialogMaxW: dlgStyle.maxWidth,
        prevColWidth: prevCol ? prevCol.getBoundingClientRect().width : 0,
        formColWidth: formCol ? formCol.getBoundingClientRect().width : 0,
        frameHeight: frame ? frame.getBoundingClientRect().height : 0,
        hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth
      };
    });

    console.log('Medidas Editor en Estudio (1366x768):', desktopStudyEditorDims);
    assert.equal(desktopStudyEditorDims.dialogHasClass, true, 'El diálogo debe tener clase dialog-card-editor');
    assert.equal(desktopStudyEditorDims.hasHorizontalOverflow, false, 'No debe haber scroll horizontal en el diálogo');
    assert(desktopStudyEditorDims.dialogClientWidth >= 1100, `El ancho del diálogo debe ser amplio (>= 1100px), obtenido: ${desktopStudyEditorDims.dialogClientWidth}px`);
    assert(desktopStudyEditorDims.prevColWidth >= 400, `La columna de preview debe ser >= 400px, obtenido: ${desktopStudyEditorDims.prevColWidth}px`);
    assert(desktopStudyEditorDims.frameHeight >= 340, `El iframe de preview debe ser flexible (>= 340px), obtenido: ${desktopStudyEditorDims.frameHeight}px`);

    await page.screenshot({ path: path.join(screenshotsDir, 'verified-01-editor-in-study-1366x768.png') });

    // ─────────────────────────────────────────────────────────────
    // PRUEBA 2: CENTRADO VERTICAL Y TIPOGRAFÍA DE TARJETA CORTA
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 2: Centrado Vertical y Tipografía Adaptable ---');
    // Cerrar editor y verificar en visor de estudio
    await page.locator('[data-action="close-modal"]').first().click();
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);
    await page.waitForTimeout(200);

    const studyFrame = page.frameLocator('#study-frame');
    const shortCardStudyMetrics = await studyFrame.locator('body').evaluate(body => {
      const card = body.querySelector('.card');
      const wrapper = body.querySelector('.card-content-wrapper');
      const bodyRect = body.getBoundingClientRect();
      const cardRect = card ? card.getBoundingClientRect() : bodyRect;
      const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : cardRect;
      
      const bodyCenterY = bodyRect.top + (bodyRect.height / 2);
      const contentCenterY = wrapperRect.top + (wrapperRect.height / 2);
      const verticalOffsetRatio = Math.abs(contentCenterY - bodyCenterY) / bodyRect.height;
      const cardStyle = card ? window.getComputedStyle(card) : null;

      return {
        isShortClassPresent: (card && card.classList.contains('card-short')) || (wrapper && wrapper.classList.contains('card-short')),
        fontSize: cardStyle ? cardStyle.fontSize : null,
        verticalOffsetRatio, // Debe ser cercano a 0 (menor a 0.15 indica centrado vertical efectivo)
        wrapperTop: wrapperRect.top,
        bodyHeight: bodyRect.height
      };
    });

    console.log('Métricas Tarjeta Corta en Estudio:', shortCardStudyMetrics);
    assert.equal(shortCardStudyMetrics.isShortClassPresent, true, 'Debe tener la clase card-short');
    assert(shortCardStudyMetrics.verticalOffsetRatio < 0.15, `El contenido corto debe estar centrado verticalmente (offset ratio < 0.15), obtenido: ${shortCardStudyMetrics.verticalOffsetRatio}`);
    
    // Verificar que el tamaño de fuente está dentro del rango adaptable esperado (24px a 38px en desktop)
    const numericFontSize = parseFloat(shortCardStudyMetrics.fontSize);
    assert(numericFontSize >= 22 && numericFontSize <= 40, `Fuente adaptable debe estar en rango, obtenido: ${numericFontSize}px`);

    await page.screenshot({ path: path.join(screenshotsDir, 'verified-02-study-short-card-centered.png') });

    // ─────────────────────────────────────────────────────────────
    // PRUEBA 3: CONTENIDO LARGO ACCESIBLE CON SCROLL VERTICAL NATURAL
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 3: Contenido Largo y Desplazamiento Vertical ---');
    // Voltear tarjeta o avanzar a la siguiente tarjeta larga
    await page.locator('[data-action="reveal"]').click();
    await page.waitForTimeout(200);
    // Calificar para pasar a la siguiente tarjeta (rate-col-3 es 'Bien')
    await page.locator('.anki-rate-button.rate-col-3').click();
    await page.waitForTimeout(300);

    const longCardStudyMetrics = await studyFrame.locator('body').evaluate(body => {
      const card = body.querySelector('.card');
      const wrapper = body.querySelector('.card-content-wrapper');
      const h3 = body.querySelector('h3');
      const h3Rect = h3 ? h3.getBoundingClientRect() : null;
      return {
        isLongClassPresent: (card && card.classList.contains('card-long')) || (wrapper && wrapper.classList.contains('card-long')),
        h3Top: h3Rect ? h3Rect.top : 0,
        isH3AtTop: h3Rect ? (h3Rect.top >= 0 && h3Rect.top <= 80) : false,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
        hasVerticalScroll: body.scrollHeight > body.clientHeight,
        overflowY: window.getComputedStyle(body).overflowY
      };
    });

    console.log('Métricas Tarjeta Larga en Estudio:', longCardStudyMetrics);
    assert.equal(longCardStudyMetrics.isLongClassPresent, true, 'Tarjeta larga debe tener clase card-long');
    assert.equal(longCardStudyMetrics.isH3AtTop, true, 'El encabezado inicial debe comenzar en la parte superior accesible');
    assert.equal(longCardStudyMetrics.overflowY, 'auto', 'El body debe tener overflow-y auto para scroll vertical accesible');

    await page.screenshot({ path: path.join(screenshotsDir, 'verified-03-study-long-card-scrollable.png') });

    // ─────────────────────────────────────────────────────────────
    // PRUEBA 4: PRECEDENCIA DE ESTILOS Y CONTRASTE EN MODO LUMCARDS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 4: Precedencia y Contraste de Color (Modo Lumcards) ---');
    // Avanzar a la tarjeta conflictiva
    await page.locator('[data-action="reveal"]').click();
    await page.waitForTimeout(200);
    await page.locator('.anki-rate-button.rate-col-3').click();
    await page.waitForTimeout(300);

    // Seleccionar tema oscuro (ej. Índigo o Dark) en el personalizador
    await page.evaluate(() => {
      localStorage.setItem('lumcards-card-style', JSON.stringify({
        theme: 'indigo',
        font: 'sans',
        align: 'center',
        templateMode: 'lumcards'
      }));
      // Disparar recarga de tarjeta
      const frame = document.querySelector('#study-frame');
      if (frame && window.mountCard && window.currentCard) {
        window.mountCard(frame, window.currentCard(), false);
      }
    });
    await page.waitForTimeout(300);

    const contrastMetrics = await studyFrame.locator('body').evaluate(body => {
      const card = body.querySelector('.card');
      const paragraph = body.querySelector('p');
      const cloze = body.querySelector('.cloze');
      const katex = body.querySelector('.katex');

      const cardStyle = window.getComputedStyle(card);
      const pStyle = paragraph ? window.getComputedStyle(paragraph) : null;
      const clozeStyle = cloze ? window.getComputedStyle(cloze) : null;

      return {
        cardBg: cardStyle.backgroundColor,
        cardColor: cardStyle.color,
        pColor: pStyle ? pStyle.color : null,
        pBg: pStyle ? pStyle.backgroundColor : null,
        clozeColor: clozeStyle ? clozeStyle.color : null,
        katexExists: !!katex
      };
    });

    console.log('Métricas de Color y Contraste:', contrastMetrics);
    const bgRgb = parseRgb(contrastMetrics.cardBg);
    const textRgb = parseRgb(contrastMetrics.pColor);
    const ratio = contrastRatio(textRgb, bgRgb);
    console.log(`Contraste calculado texto vs fondo: ${ratio.toFixed(2)}:1 (Objetivo >= 4.5:1)`);
    assert(ratio >= 4.5, `El contraste debe ser >= 4.5:1, obtenido: ${ratio.toFixed(2)}:1`);
    assert.notEqual(contrastMetrics.pColor, 'rgb(31, 41, 55)', 'El texto no debe retener el color oscuro conflictivo #1f2937 en modo Lumcards oscuro');
    assert.equal(contrastMetrics.katexExists, true, 'El elemento katex debe preservarse');

    await page.screenshot({ path: path.join(screenshotsDir, 'verified-04-contrast-lumcards-mode.png') });

    // ─────────────────────────────────────────────────────────────
    // PRUEBA 5: VERIFICACIÓN DE LOS CUATRO VIEWPORTS Y RESIZE DINÁMICO
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 5: Cuatro Viewports y Resize Dinámico ---');
    // Abrir editor
    await page.locator('button[data-action="edit-card"]').click();
    await page.waitForSelector('#card-form');
    await page.waitForTimeout(200);

    // Escribir texto de prueba en el campo para verificar persistencia tras resize
    await page.locator('#card-field-0').fill('Texto de prueba antes de cambio de viewport');

    // A) 1024x650 (Laptop compacta)
    await page.setViewportSize({ width: 1024, height: 650 });
    await page.waitForTimeout(300);
    const laptopDims = await page.evaluate(() => {
      const dlg = document.querySelector('#modal');
      return {
        clientWidth: dlg.clientWidth,
        scrollWidth: dlg.scrollWidth,
        hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth
      };
    });
    console.log('Viewport 1024x650:', laptopDims);
    assert.equal(laptopDims.hasHorizontalOverflow, false, 'No debe haber scroll horizontal en 1024x650');
    await page.screenshot({ path: path.join(screenshotsDir, 'verified-05-viewport-1024x650.png') });

    // B) 390x844 (Móvil vertical)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobilePortraitDims = await page.evaluate(() => {
      const dlg = document.querySelector('#modal');
      const tabs = document.querySelector('.mobile-tab-bar');
      const formCol = document.querySelector('#card-form-col');
      const prevCol = document.querySelector('#card-preview-col');
      return {
        clientWidth: dlg.clientWidth,
        scrollWidth: dlg.scrollWidth,
        hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth,
        tabsVisible: tabs && window.getComputedStyle(tabs).display !== 'none',
        formVisible: formCol && window.getComputedStyle(formCol).display !== 'none',
        prevHiddenInitially: prevCol && window.getComputedStyle(prevCol).display === 'none'
      };
    });
    console.log('Viewport 390x844 (Móvil Vertical):', mobilePortraitDims);
    assert.equal(mobilePortraitDims.hasHorizontalOverflow, false, 'No debe haber scroll horizontal en 390x844');
    assert.equal(mobilePortraitDims.tabsVisible, true, 'Pestañas móviles deben estar visibles en móvil');

    // Alternar a la pestaña de vista previa en móvil
    await page.locator('#card-tab-preview').click();
    await page.waitForTimeout(200);
    const previewTabActive = await page.evaluate(() => {
      const prevCol = document.querySelector('#card-preview-col');
      const formCol = document.querySelector('#card-form-col');
      return window.getComputedStyle(prevCol).display !== 'none' && window.getComputedStyle(formCol).display === 'none';
    });
    assert.equal(previewTabActive, true, 'La pestaña de vista previa debe mostrarse al pulsar');
    await page.screenshot({ path: path.join(screenshotsDir, 'verified-06-viewport-390x844-preview-tab.png') });

    // C) 844x390 (Móvil apaisado)
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    const landscapeDims = await page.evaluate(() => {
      const dlg = document.querySelector('#modal');
      return {
        clientWidth: dlg.clientWidth,
        scrollWidth: dlg.scrollWidth,
        clientHeight: dlg.clientHeight,
        hasHorizontalOverflow: dlg.scrollWidth > dlg.clientWidth
      };
    });
    console.log('Viewport 844x390 (Móvil Apaisado):', landscapeDims);
    assert.equal(landscapeDims.hasHorizontalOverflow, false, 'No debe haber scroll horizontal en 844x390');
    await page.screenshot({ path: path.join(screenshotsDir, 'verified-07-viewport-844x390-landscape.png') });

    // D) Retorno a Desktop (1366x768) sin recarga para verificar persistencia del borrador
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(300);
    const draftContent = await page.locator('#card-field-0').inputValue();
    assert.equal(draftContent, 'Texto de prueba antes de cambio de viewport', 'El borrador del formulario debe persistir tras resize');

    // ─────────────────────────────────────────────────────────────
    // PRUEBA 6: CIERRE DEL MODAL Y LIMPIEZA DE CLASES RESIDUALES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PRUEBA 6: Cierre de Modal y Limpieza ---');
    await page.locator('[data-action="close-modal"]').first().click();
    await page.waitForFunction(() => !document.querySelector('#modal')?.open);
    await page.waitForTimeout(200);

    const modalCleanliness = await page.evaluate(() => {
      const dlg = document.querySelector('#modal');
      return {
        className: dlg.className,
        isOpen: dlg.open
      };
    });
    console.log('Estado de Modal tras cierre:', modalCleanliness);
    assert.equal(modalCleanliness.className, '', 'El diálogo modal debe limpiar sus clases al cerrarse');

    console.log('\n================================================================');
    console.log('[Verify Test] ¡TODAS LAS ASSECIONES PASARON SATISFACTORIAMENTE!');
    console.log('================================================================\n');

  } finally {
    if (browser) await browser.close();
    server.kill();
    try { fs.rmSync(temp, { recursive: true, force: true }); } catch (_) {}
  }
})().catch(err => {
  console.error('\n[Verify Test Error]:', err);
  process.exit(1);
});
