// Chromium acceptance for remaining Studio surfaces. All library data is synthetic.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'screenshots_studio_math','cache');
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
 const http=require('node:http');cacheServer=http.createServer(async(req,res)=>{try{const url=new URL(req.url,base);if(url.pathname.startsWith('/api/')){const r=await fetch(base+req.url);res.writeHead(r.status,{'Content-Type':'application/json'});res.end(await r.text());return;}const file=path.join(root,'dist',url.pathname==='/'?'index.html':url.pathname);const ext=path.extname(file);res.writeHead(200,{'Content-Type':({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[ext]||'application/octet-stream'});res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>cacheServer.listen(0,'127.0.0.1',r));const cacheBase=`http://127.0.0.1:${cacheServer.address().port}`;
 const cacheContext=await browser.newContext({serviceWorkers:'allow'});const cachePage=await cacheContext.newPage();await cachePage.goto(cacheBase);await cachePage.waitForSelector('.deck-card');
 await cachePage.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.active,{},{timeout:15000});await cachePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const cached=await cachePage.evaluate(async()=>{const keys=await caches.keys();const c=await caches.open('lumcards-cache-20260919-drive-oauth-r7');const urls=['/sync-manager.js?v=20260919-drive-oauth-r6','/client-startup.js?v=20260919-drive-oauth-r7','/vendor/katex/katex.min.js','/vendor/katex/contrib/auto-render.min.js','/vendor/katex/fonts/KaTeX_Main-Regular.woff2','/app.js?v=20260919-drive-oauth-r6','/app.css?v=20260918-studio-workspace-r2','/student.css?v=20260918-studio-workspace-r2','/practice.css?v=20260918-studio-workspace-r2'];return {keys,assets:await Promise.all(urls.map(async url=>({url,present:!!await c.match(url)})))}});
 assert(cached.keys.includes('lumcards-cache-20260919-drive-oauth-r7'));assert(cached.assets.every(a=>a.present));await cachePage.evaluate(()=>localStorage.setItem('lumcards_web_data',JSON.stringify({decks:[],cards:[],settings:{dailyGoal:20},stats:{},_revlogs:[]})));await cacheContext.setOffline(true);await cachePage.reload();await cachePage.waitForSelector('[data-connection-status]');assert.match(await cachePage.locator('[data-connection-status]').innerText(),/Sin conexión/);await cachePage.screenshot({path:path.join(out,'cached-offline.png')});assert(await cachePage.evaluate(()=>typeof window.katex?.renderToString==='function'&&typeof window.renderMathInElement==='function'));await cachePage.evaluate(async()=>{await api('decks',{name:'Offline synthetic saved'});});await cachePage.reload();await cachePage.waitForSelector('.deck-card');assert.match(await cachePage.locator('.deck-card').first().innerText(),/Offline synthetic saved/);await cacheContext.close();
 fs.writeFileSync(path.join(out,'cache-report.json'),JSON.stringify(cached,null,2));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS: PWA offline local math scripts, fonts and cached Studio assets');
 }finally{await browser?.close();cacheServer?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
