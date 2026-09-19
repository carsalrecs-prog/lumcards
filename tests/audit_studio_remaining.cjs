// Synthetic Chromium audit; no personal data or live services.
const {chromium}=require('C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),os=require('os'),net=require('net');
const {spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'screenshots_studio_remaining',process.env.AUDIT_STAGE || 'before');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 fs.mkdirSync(out,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lumcards-studio-audit-'));
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn(path.join(root,'.venv/Scripts/python.exe'),[path.join(root,'server.py'),'--port',String(port),'--data-dir',tmp],{windowsHide:true,stdio:'ignore'});
 let browser;const report=[];try{
 const base=`http://127.0.0.1:${port}`;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await wait(150)}
 const post=async(route,obj)=>(await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Anki-Request':'1'},body:JSON.stringify(obj)})).json();
 const deck=await post('decks',{name:'Mazo sintético para auditar nombres largos y contenido de estudio'});
 const card=await post('cards',{deckId:deck.id,front:'¿Qué queremos recordar?',back:'Una explicación breve y legible.'});
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\/(accounts\.google|www\.gstatic|firestore\.googleapis)/,r=>r.abort());
 const page=await context.newPage();await page.goto(base);await page.waitForSelector('.deck-card');
 async function shot(name){await wait(180);const metric=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,modal:document.querySelector('dialog[open]')?.scrollWidth}));report.push({name,...metric});await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});}
 for(const width of [1366,390,320]) {await page.setViewportSize({width,height:width===1366?768:844});for(const dark of [false,true]){
 await page.evaluate(d=>{theme=d?'dark':'light';document.documentElement.classList.toggle('dark',d);render()},dark);
 for(const v of ['decks','cards','favorites','stats','sync','backups','settings']){await page.evaluate(v=>navigate(v),v);await shot(`${width}-${dark?'dark':'light'}-${v}`)}
 await page.evaluate(()=>importModal());await shot(`${width}-${dark?'dark':'light'}-import`);await page.keyboard.press('Escape');
 await page.evaluate(()=>cardForm());await wait(250);await shot(`${width}-${dark?'dark':'light'}-editor`);await page.keyboard.press('Escape');
 await page.evaluate(()=>newDeck());await shot(`${width}-${dark?'dark':'light'}-new-deck`);await page.keyboard.press('Escape');
 await page.evaluate(()=>newFolderModal());await shot(`${width}-${dark?'dark':'light'}-new-folder`);await page.keyboard.press('Escape');
 await page.evaluate(()=>templateEditorModal());await shot(`${width}-${dark?'dark':'light'}-customizer`);await page.keyboard.press('Escape');
 }}
 await page.setViewportSize({width:1366,height:768});
 await page.evaluate(id=>startStudy(id),deck.id);await shot('1366-study');
 await page.evaluate(()=>navigate('decks'));
 for(const [name,expr] of [['login','firebaseLoginModal()'],['drive','driveConnectModal()'],['notes','convertNotesModal()'],['occlusion','imageOcclusionModal()'],['help','help()']]){await page.evaluate(expr);await shot('1366-'+name);await page.keyboard.press('Escape');}
 for(const width of [1366,390,320]){await page.setViewportSize({width,height:844});await page.goto(base+'/practice.html#import');await page.waitForSelector('#import-paste');await page.locator('#import-paste').fill('Concepto\tUna explicación suficientemente larga para observar la vista previa.');await page.locator('#preview-import-btn').click();await wait(500);await shot(width+'-text-import');await page.locator('[data-tab="play"]').click().catch(()=>{});await shot(width+'-practice');}
 fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});

