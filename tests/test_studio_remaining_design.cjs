// Chromium acceptance for remaining Studio surfaces. All library data is synthetic.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'screenshots_studio_remaining','after');
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
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route(/https:\/\/(accounts\.google|www\.gstatic|firestore\.googleapis)/,r=>r.abort());
 const page=await context.newPage();page.setDefaultTimeout(9000);await page.goto(base);await page.waitForSelector('.deck-card');
 const writes=[];page.on('request',r=>{if(r.method()!=='GET'&&r.url().includes('/api/'))writes.push(r.url())});
 async function check(label,screenshot=true){await wait(65);const metric=await page.evaluate(()=>{
  const dialog=document.querySelector('dialog[open]');const overs=[...document.querySelectorAll('main *,dialog[open] *')].filter(el=>{const b=el.getBoundingClientRect();return b.width>0&&b.right>innerWidth+2&&getComputedStyle(el).position!=='fixed'}).slice(-15).map(el=>({tag:el.tagName,cls:el.className,id:el.id,width:el.getBoundingClientRect().width}));
  return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,modal:dialog?{client:dialog.clientWidth,scroll:dialog.scrollWidth}:null,overs};
 });report.push({label,...metric});assert(metric.scrollWidth<=metric.width+1,`${label}: page overflow ${JSON.stringify(metric)}`);if(metric.modal)assert(metric.modal.scroll<=metric.modal.client+1,`${label}: modal overflow ${JSON.stringify(metric)}`);
 if(screenshot)await page.screenshot({path:path.join(out,label+'.png'),fullPage:!metric.modal});}
 async function close(){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#modal').open);await wait(40)}
 for(const [width,height] of (process.env.QA_WIDTH?sizes.filter(s=>s[0]===Number(process.env.QA_WIDTH)):sizes)){await page.setViewportSize({width,height});for(const dark of [false,true])for(const motion of ['no-preference','reduce']){
 const tag=`${width}x${height}-${dark?'dark':'light'}-${motion}`;console.log(tag);await page.emulateMedia({reducedMotion:motion});await page.evaluate(d=>{theme=d?'dark':'light';document.documentElement.classList.toggle('dark',d);render()},dark);
 for(const v of ['decks','cards','favorites','stats','sync','backups','settings']){await page.evaluate(v=>navigate(v),v);await check(`${tag}-${v}`,motion==='reduce');}
 await page.evaluate(()=>navigate('sync'));
 // Primary contrast is computed from rendered colors, not assumed from tokens.
 const contrast=await page.locator('.workspace-card .btn-primary').first().evaluate(el=>{const s=getComputedStyle(el);const lum=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});assert(contrast>=4.5,`${tag}: primary contrast ${contrast}`);
 const small=await page.locator('.workspace-page button').evaluateAll(els=>els.filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<43.5||b.width<43.5)}).map(e=>e.textContent));assert.deepEqual(small,[],`${tag}: touch target`);
 const trigger=page.locator('[data-action="firebase-login-modal"]');await trigger.focus();await page.keyboard.press('Enter');await page.waitForSelector('#modal[open]');await check(`${tag}-login`,motion==='reduce');await page.keyboard.press('Tab');assert(await page.evaluate(()=>modal.contains(document.activeElement)),'Focus must stay in dialog');await close();assert(await trigger.evaluate(e=>e===document.activeElement),'Return focus on Escape');
 for(const [name,fn] of [['import','importModal'],['new-deck','newDeck'],['new-folder','newFolderModal'],['customizer','templateEditorModal'],['notes','convertNotesModal'],['occlusion','imageOcclusionModal'],['help','help']]){await page.evaluate(f=>window[f](),fn);await wait(100);await check(`${tag}-${name}`,motion==='reduce');await close();}
 // The queued close must not clear the next dialog's class.
 await page.evaluate(()=>{importModal();modal.close();cardForm()});await wait(180);assert(await page.locator('#modal').evaluate(e=>e.classList.contains('dialog-card-editor')),'Queued close must preserve new editor');
 const before=writes.length;await page.locator('#card-field-0').fill('Borrador sintético que no debe guardarse');await page.locator('#card-field-1').fill('Respuesta de prueba');await wait(260);
 if(width<=820){await page.locator('#card-tab-preview').click();assert.equal(await page.locator('#card-tab-preview').getAttribute('aria-pressed'),'true');await check(`${tag}-preview`,motion==='reduce');await page.locator('#card-tab-edit').click();assert.equal(await page.locator('#card-field-0').inputValue(),'Borrador sintético que no debe guardarse');}
 if(width>=1024){const b=await page.locator('#card-editor-preview-frame').boundingBox();assert(b.width>=350,'Desktop preview must be readable');}
 assert.equal(writes.length,before,'Preview must not write cards/progress');await check(`${tag}-editor`,motion==='reduce');await close();
 // Controlled service responses test presentation only, never real cloud accounts.
 await page.evaluate(()=>{window.LumcardsSync.firebase.getUser=()=>({name:'Cuenta sintética',email:'sintetica@example.invalid'});window.LumcardsSync.firebase.syncFullWorkspace=()=>new Promise(r=>window.finishSyntheticSync=r);view='sync';render()});
 await page.locator('[data-action="firebase-sync-now"]').click();await page.waitForSelector('[data-service="firebase"][data-state="syncing"]');await check(`${tag}-loading`,motion==='reduce');
 await page.evaluate(()=>finishSyntheticSync({success:true,localMock:true}));await page.waitForSelector('[data-service="firebase"][data-state="error"]');assert(!await page.locator('#toast').innerText().then(t=>t.includes('sincronizados')));await check(`${tag}-error`,motion==='reduce');
 await page.locator('[data-action="firebase-sync-now"]').click();await page.evaluate(()=>finishSyntheticSync({success:true,cloud:true}));await page.waitForSelector('[data-service="firebase"][data-state="synced"]');await check(`${tag}-synced`,motion==='reduce');
 await context.setOffline(true);await page.waitForSelector('[data-service="firebase"][data-state="offline"]');await check(`${tag}-offline`,motion==='reduce');await context.setOffline(false);
 await page.evaluate(()=>{window.LumcardsSync.firebase.getUser=()=>null;workspaceTransfers.firebase={state:'idle'};render()});
 await page.evaluate(()=>{view='cards';browsePage={cards:[],total:0,offset:0,limit:50,hasMore:false};data.cards=[];render()});await check(`${tag}-empty`,motion==='reduce');
 if(width<=650){await page.locator('[data-action="menu"]').click();await page.keyboard.press('Escape');assert(await page.locator('[data-action="menu"]').evaluate(e=>e===document.activeElement));}
 }}
 // Rich preview: no implicit audio and no backend writes.
 await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>cardForm());await wait(180);
 const beforeRich=writes.length;await page.evaluate(()=>{window.syntheticAudioPlays=0;HTMLMediaElement.prototype.play=function(){window.syntheticAudioPlays++;return Promise.resolve()};});
 for(const [name,text] of [['short','Contenido breve'],['long','<h3>Inicio accesible</h3>'+('<p>Contenido largo sintético para comprobar desplazamiento natural.</p>'.repeat(80))],['image','<img alt="Ilustración sintética" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22180%22 height=%22100%22%3E%3Crect width=%22180%22 height=%22100%22 fill=%22%236554df%22/%3E%3C/svg%3E">'],['audio','Texto con audio <audio src="/media/synthetic.wav"></audio>'],['math','Fórmula: \\[ x^2 + y^2 = z^2 \\]']]){await page.locator('#card-field-0').fill(text);await wait(280);await check('rich-'+name);if(name==='long'){const m=await page.locator('#card-editor-preview-frame').evaluate(f=>({scroll:f.contentDocument.scrollingElement.scrollTop,height:f.contentDocument.scrollingElement.scrollHeight,client:f.contentDocument.scrollingElement.clientHeight}));assert.equal(m.scroll,0);assert(m.height>m.client);}}
 await page.locator('#note-kind').selectOption('cloze');await page.locator('#card-field-0').fill('La {{c1::respuesta::pista}} se oculta.');await wait(280);await check('rich-cloze');const cloze=page.frameLocator('#card-editor-preview-frame').locator('.cloze');assert.equal(await cloze.innerText(),'[pista]');await page.locator('#card-form-flip-btn').click();await wait(260);assert.equal(await cloze.innerText(),'respuesta');assert.equal(await page.evaluate(()=>syntheticAudioPlays),0);assert.equal(writes.length,beforeRich);await close();
 // Text importer and existing game lobby: both themes and all required sizes.
 for(const [width,height] of sizes){await page.setViewportSize({width,height});for(const dark of [false,true]){
 await page.goto(base+'/practice.html#import');await page.waitForSelector('#import-paste');await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);await page.locator('#import-paste').fill('Pregunta\tRespuesta\nBreve\tExplicación breve\n'+('NombreLargo'.repeat(20))+'\tRespuesta extensa');await page.locator('#preview-import-btn').click();await page.waitForSelector('.import-card-body',{state:'attached'});await check(`${width}-${dark?'dark':'light'}-text-import`);if(width<=860){await page.locator('[data-action="import-tab-card"]').click();await check(`${width}-${dark?'dark':'light'}-text-preview`);}await page.locator('[data-tab="play"]').click();await check(`${width}-${dark?'dark':'light'}-games`);await page.locator('[data-tab="history"]').click();await check(`${width}-${dark?'dark':'light'}-game-history`);
 }}
 // Recovery and accessible focus with real HTTP failure, confined to the synthetic context.
 await page.goto(base);await page.waitForSelector('.deck-card');await page.evaluate(()=>navigate('settings'));
 await page.locator('#settings-form [data-action="theme"]').focus();await page.keyboard.press('Enter');assert(await page.locator('#settings-form [data-action="theme"]').evaluate(e=>e===document.activeElement));
 await page.route('**/api/settings',r=>r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'No se guardaron los ajustes. Inténtalo de nuevo.'})}));
 await page.locator('#settings-form button[data-mutate]').click();await page.waitForSelector('#toast.error');assert.match(await page.locator('#toast').innerText(),/No se guardaron/);await check('settings-save-error');await page.unroute('**/api/settings');
 // Cache integration: a fresh browser context, new service worker and offline page load.
 const http=require('node:http');cacheServer=http.createServer(async(req,res)=>{try{const url=new URL(req.url,base);if(url.pathname.startsWith('/api/')){const r=await fetch(base+req.url);res.writeHead(r.status,{'Content-Type':'application/json'});res.end(await r.text());return;}const file=path.join(root,'dist',url.pathname==='/'?'index.html':url.pathname);const ext=path.extname(file);res.writeHead(200,{'Content-Type':({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[ext]||'application/octet-stream'});res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>cacheServer.listen(0,'127.0.0.1',r));const cacheBase=`http://127.0.0.1:${cacheServer.address().port}`;
 const cacheContext=await browser.newContext({serviceWorkers:'allow'});const cachePage=await cacheContext.newPage();await cachePage.goto(cacheBase);await cachePage.waitForSelector('.deck-card');
 await cachePage.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.active,{},{timeout:15000});await cachePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const cached=await cachePage.evaluate(async()=>{const keys=await caches.keys();const c=await caches.open('lumcards-cache-20260919-drive-oauth-r7');const urls=['/app.js?v=20260919-drive-oauth-r6','/client-startup.js?v=20260919-drive-oauth-r7','/app.css?v=20260918-studio-workspace-r2','/student.css?v=20260918-studio-workspace-r2','/practice.css?v=20260918-studio-workspace-r2'];return {keys,assets:await Promise.all(urls.map(async url=>({url,present:!!await c.match(url)})))}});
 assert(cached.keys.includes('lumcards-cache-20260919-drive-oauth-r7'));assert(cached.assets.every(a=>a.present));await cacheContext.setOffline(true);await cachePage.reload();await cachePage.waitForSelector('[data-connection-status]');assert.match(await cachePage.locator('[data-connection-status]').innerText(),/Sin conexión/);await cachePage.screenshot({path:path.join(out,'cached-offline.png')});await cacheContext.close();
 fs.writeFileSync(path.join(out,'cache-report.json'),JSON.stringify(cached,null,2));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`PASS: ${report.length} rendered checks, 6 sizes, 2 themes, both motion settings; preview isolation, modal focus, sync states and import reflow.`);
 }finally{await browser?.close();cacheServer?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
