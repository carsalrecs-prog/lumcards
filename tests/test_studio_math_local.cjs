// Chromium acceptance for remaining Studio surfaces. All library data is synthetic.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'screenshots_studio_math');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const sizes=[[390,844],[844,390],[1024,650],[1366,768],[320,844],[683,384]];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lumcards-studio-remaining-'));
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const base=`http://127.0.0.1:${port}`,report=[];
 const server=spawn(path.join(root,'.venv/Scripts/python.exe'),[path.join(root,'server.py'),'--port',String(port),'--data-dir',tmp],{windowsHide:true,stdio:'ignore'});
 let browser,cacheServer;try{
 let up=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){up=true;break}}catch{}await wait(150)}assert(up,'Isolated server must start');
 const post=async(route,obj)=>(await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Anki-Request':'1'},body:JSON.stringify(obj)})).json();
 const deck=await post('decks',{name:'NombreSintéticoExtenso'.repeat(4)});
 const card=await post('cards',{deckId:deck.id,front:'Una pregunta breve',back:'Una respuesta breve'});
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});

 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/^https:\/\//,r=>r.abort());const page=await context.newPage();await page.goto(base);await page.waitForSelector('.deck-card');
 for(const [width,height] of sizes){for(const theme of ['light','dark']){for(const motion of ['reduce','no-preference']){
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:motion});await page.evaluate(t=>{document.documentElement.classList.toggle('dark',t==='dark');cardForm()},theme);
 await page.locator('#card-field-0').fill('Formula: \\[ \\frac{x^2}{2} + \\sqrt{y} = z \\]');if(width<=820)await page.locator('#card-tab-preview').click();
 const math=page.frameLocator('#card-editor-preview-frame').locator('.katex');await math.waitFor();assert.equal(await math.count(),1);assert(await math.locator('.mfrac').count()>0,'Actual fraction must render, not a fake class');
 const metrics=await page.locator('#card-editor-preview-frame').evaluate(async f=>{await f.contentDocument.fonts.ready;const d=f.contentDocument;return {math:d.querySelector('.katex').getBoundingClientRect().height,fonts:d.fonts.check('16px KaTeX_Main'),overflow:d.documentElement.scrollWidth>d.documentElement.clientWidth+1}});assert(metrics.math>20);assert(metrics.fonts);assert(!metrics.overflow);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(motion==='reduce')await page.screenshot({path:path.join(out,`${width}-${theme}.png`)});report.push({width,height,theme,motion,...metrics});await page.keyboard.press('Escape');
 }}}
 await context.setOffline(true);await page.evaluate(()=>cardForm());await page.locator('#card-field-0').fill('\\( x^2 \\)');await page.locator('#card-tab-preview').click();await page.frameLocator('#card-editor-preview-frame').locator('.katex').waitFor();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`PASS ${report.length} real formula checks, local fonts and offline preview`);
 }finally{await browser?.close();cacheServer?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
