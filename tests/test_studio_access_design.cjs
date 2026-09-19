// Chromium acceptance for remaining Studio surfaces. All library data is synthetic.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'screenshots_studio_access',process.env.AUDIT_ONLY?'before':'after');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const sizes=[[390,844],[844,390],[1024,650],[1366,768],[320,844],[683,384]];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lumcards-studio-remaining-'));
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const base=`http://127.0.0.1:${port}`,report=[];
 const server=spawn(path.join(root,'.venv/Scripts/python.exe'),[path.join(root,'server.py'),'--port',String(port),'--data-dir',tmp],{windowsHide:true,stdio:'ignore'});
 let browser;try{
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
 });report.push({label,...metric});if(!process.env.AUDIT_ONLY)assert(metric.scrollWidth<=metric.width+1,`${label}: page overflow ${JSON.stringify(metric)}`);if(metric.modal&&!process.env.AUDIT_ONLY)assert(metric.modal.scroll<=metric.modal.client+1,`${label}: modal overflow ${JSON.stringify(metric)}`);
 if(screenshot)await page.screenshot({path:path.join(out,label+'.png'),fullPage:!metric.modal});}
 async function close(){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#modal').open);await wait(40)}

 // Drive authorization errors must stay in the dialog; success requires GIS.
 await page.evaluate(()=>{window.LumcardsSync.drive.clientId='';delete window.LUMCARDS_DRIVE_CLIENT_ID;});
 await page.evaluate(()=>driveConnectModal());
 await page.locator('#drive-auth-form [data-mutate]').click();
 await page.waitForFunction(()=>document.querySelector('#drive-auth-form .form-error')?.textContent.includes('configurado'));
 assert(await page.locator('#modal').evaluate(e=>e.open));
 assert.equal(await page.evaluate(()=>window.LumcardsSync.drive.isConnected()),false);
 await page.evaluate(()=>{
   window.LumcardsSync.drive.clientId='123-synthetic.apps.googleusercontent.com';
   window.google={accounts:{oauth2:{initTokenClient:config=>({requestAccessToken:()=>config.error_callback({type:'popup_closed'})})}}};
 });
 await page.locator('#drive-auth-form [data-mutate]').click();
 await page.waitForFunction(()=>document.querySelector('#drive-auth-form .form-error')?.textContent.includes('autorización'));
 assert(await page.locator('#modal').evaluate(e=>e.open));
 await close();

 await page.evaluate(()=>{window.LumcardsSync.firebase.getUser=()=>({uid:'synthetic-admin',name:'Administración sintética',email:'admin@example.invalid'});window.LumcardsSync.firebase.isAdmin=()=>true;window.LumcardsSync.firebase.checkAccess=async()=>({isAdmin:true,approved:true});window.LumcardsSync.firebase.listAllUsers=async()=>[];});
 for(const [width,height] of sizes){await page.setViewportSize({width,height});for(const dark of [false,true])for(const motion of ['reduce','no-preference']){
 const tag=`${width}x${height}-${dark?'dark':'light'}-${motion}`;await page.emulateMedia({reducedMotion:motion});await page.evaluate(d=>{theme=d?'dark':'light';document.documentElement.classList.toggle('dark',d)},dark);
 await page.evaluate(()=>{view='admin';adminUsers=[{uid:'s1',name:'NombreExtenso'.repeat(10),email:'estudiante.sintetico@example.invalid',accessApproved:true},{uid:'s2',name:'Estudiante de prueba',email:'prueba@example.invalid',accessApproved:false}];adminUsersError='';render()});await check(tag+'-admin');
 if(!process.env.AUDIT_ONLY){
 const trigger=page.locator('[data-action="admin-set-access"][data-uid="s1"]');await trigger.focus();await page.keyboard.press('Enter');await check(tag+'-revoke-confirm');await close();assert(await trigger.evaluate(e=>e===document.activeElement));
 }

 await page.evaluate(()=>{adminUsers=[];render()});await check(tag+'-empty');
 await page.evaluate(()=>{adminUsersError='No se pudo conectar. Prueba de error sintética.';render()});await check(tag+'-error');
 await page.evaluate(()=>{view='sync';accessInfo={approved:false,pending:true,note:'Nota sintética'};render()});await check(tag+'-pending');
 await page.evaluate(id=>resetDeckPrompt(id),deck.id);await check(tag+'-reset-deck');await close();
 await page.evaluate(()=>resetAllPrompt());assert(await page.locator('#btn-submit-reset-all').isDisabled());await page.locator('#reset-all-confirm-check').check();assert(!await page.locator('#btn-submit-reset-all').isDisabled());await check(tag+'-reset-all');await close();
 }
 }
 if(!process.env.AUDIT_ONLY){
 await page.evaluate(()=>{view='admin';adminUsers=[{uid:'s1',name:'Cuenta sintética',email:'test@example.invalid',accessApproved:false}];adminUsersError='';window.accessWrites=[];window.LumcardsSync.firebase.setUserAccess=async(...args)=>{window.accessWrites.push(args);return {success:false}};render()});
 await page.locator('[data-action="admin-set-access"]').click();await page.locator('#admin-access-note').fill('Nota sintética');await close();assert.equal(await page.evaluate(()=>accessWrites.length),0,'Cancel must not apply access');
 await page.locator('[data-action="admin-set-access"]').click();await page.locator('#admin-access-confirm').click();await page.waitForFunction(()=>document.querySelector('#admin-access-error')?.textContent.includes('No se confirmó'));assert(await page.locator('#modal').evaluate(e=>e.open));await check('approval-not-saved');
 await page.evaluate(()=>{window.LumcardsSync.firebase.setUserAccess=async(...args)=>{accessWrites.push(args);return {success:true}}});await page.locator('#admin-access-confirm').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);assert.match(await page.locator('#toast').innerText(),/Acceso aprobado/);
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`${process.env.AUDIT_ONLY?'AUDIT':'PASS'}: ${report.length} rendered checks; synthetic administration, access and reset confirmations.`);
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
