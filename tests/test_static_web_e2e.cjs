// Real browser, static files only: no Python and no production/user storage.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..', 'dist');
const type = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const now = Date.parse('2026-09-18T04:30:00Z'); // 23:30 previous local day in Lima.
const empty = () => ({ decks: [], cards: [], settings: {dailyGoal:20}, stats: {reviewedToday:0,streak:0,totalCards:0,dueToday:0}, _revlogs:[], _practice_history:[] });
const fixture = (stringTime=false) => ({ ...empty(), decks:[{id:11,name:'Synthetic static deck'}], cards:[{id:now-1000,deckId:11,modelName:'Básica',front:'Synthetic question',back:'Synthetic answer',rawFront:'Synthetic question',rawBack:'Synthetic answer',reps:1,interval:3,ease:2500,state:'review',due:'3d',tags:[],editable:true}], _revlogs:[{id:stringTime?String(now):now,cid:now-1000,rating:3,interval:3,ease:2500,time:8000}] });

(async()=>{
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/')) {res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"Static host: no backend"}');return;}
    const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname==='/practice'?'/practice.html':url.pathname);
    const file=path.resolve(root,'.'+relative);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':type[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
    fs.createReadStream(file).pipe(res);
  });
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  let browser; const failures=[];
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    async function scenario(name,store,test,expectUnavailable=false){
      const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block',timezoneId:'America/Lima'});
      await context.route('**/*',r=>r.request().url().startsWith(base+'/')||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
      const page=await context.newPage(); page.setDefaultTimeout(6000);
      await page.clock.setFixedTime(now);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.goto(base+'/');
        await page.evaluate(s=>localStorage.setItem('lumcards_web_data',typeof s==='string'?s:JSON.stringify(s)),store);
        await page.reload();
        await page.locator(expectUnavailable?'[data-view="stats"],.error-panel':'[data-view="stats"]').first().waitFor();
        assert.equal(await page.evaluate(()=>isWebMode),true,'Must use actual static fallback');
        await test(page);
        assert.deepEqual(errors,[],name+': JS errors');
        console.log('PASS '+name);
      }catch(error){failures.push(name+': '+error.message);console.error('FAIL '+name+': '+error.message);console.error('Toast: '+await page.locator('#toast').textContent().catch(()=>''));}
      finally{await context.close();}
    }
    async function openStats(page){
      await page.locator('[data-view="stats"]').click();
      await page.locator('.stats-container').waitFor();
      assert(!/NaN|undefined/.test(await page.locator('.stats-container').innerText()),'Stats must not render invalid values');
      return page.evaluate(()=>({total:detailedStats.cardBreakdown.total,today:detailedStats.today.cardsStudied,retention:detailedStats.today.retentionToday}));
    }
    await scenario('empty -> create deck/card -> review -> stats -> reload',empty(),async page=>{
      assert.equal((await openStats(page)).total,0);
      await page.locator('[data-view="decks"]').click();
      await page.locator('[data-action="new-deck"]').first().click();
      await page.locator('#deck-name-input').fill('Static regression');
      await page.locator('#deck-form button[data-mutate]').click();
      await page.locator('#card-form textarea[name="front"]').fill('Synthetic front');
      await page.locator('#card-form textarea[name="back"]').fill('Synthetic back');
      await page.locator('#card-form button[data-mutate]').click();
      await page.waitForFunction(()=>!modal.open&&!busy);
      const id=await page.evaluate(()=>data.decks.find(d=>d.name==='Static regression').id);
      assert.equal((await openStats(page)).total,1);
      await page.evaluate(id=>promptStudyBlock(id),id);
      // Current modal attaches handlers on its existing 40ms render timer.
      await page.waitForTimeout(100);
      await page.locator('#btn-start-block-submit').click();
      await page.locator('[data-action="reveal"]').click();
      await page.locator('[data-action="rate"][data-rating="3"]').click();
      await page.waitForFunction(()=>!busy);
      // Return through existing API/UI navigation; no fake backend response.
      await page.evaluate(async()=>{await refresh(false);view='decks';render();});
      const stats=await openStats(page);assert.equal(stats.total,1);assert.equal(stats.today,1);
      await page.reload();await page.locator('[data-view="stats"]').waitFor();
      const persisted=await openStats(page);assert.equal(persisted.total,1);assert.equal(persisted.today,1);
    });
    await scenario('numeric review timestamp',fixture(),async page=>{
      assert.equal((await openStats(page)).today,1);
      const calendarToday=await page.evaluate(()=>{const d=new Date();const key=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');return detailedStats.calendar.days.find(x=>x.date===key)?.count;});
      assert.equal(calendarToday,1,'Calendar and today summary must use the same local day');
    });
    await scenario('legacy numeric-string review timestamp',fixture(true),async page=>{assert.equal((await openStats(page)).today,1);});
    await scenario('storage failure must not report saved',empty(),async page=>{
      await page.evaluate(()=>{const original=Storage.prototype.setItem;window.restoreStorage=()=>{Storage.prototype.setItem=original;};window.cloudWrites=0;window.LumcardsSync.firebase.isConnected=()=>true;window.LumcardsSync.firebase.syncFullWorkspace=async()=>{cloudWrites++;};Storage.prototype.setItem=function(k,v){if(k==='lumcards_web_data')throw new DOMException('Synthetic quota failure','QuotaExceededError');return original.call(this,k,v);};});
      await page.locator('[data-action="new-deck"]').first().click();
      await page.locator('#deck-name-input').fill('Must not fake success');
      await page.locator('#deck-form button[data-mutate]').click();
      await page.waitForFunction(()=>!busy);
      assert(await page.locator('#deck-form').isVisible(),'Creation form must stay open on failed persistence');
      assert((await page.locator('#deck-form .form-error').innerText()).trim().length>0,'Explain storage failure');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumcards_web_data')).decks.length),0);
      await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>cloudWrites),0,'Failed local save must never upload');await page.evaluate(()=>restoreStorage());assert.equal(await page.locator('#deck-name-input').inputValue(),'Must not fake success');await page.locator('#deck-form button[data-mutate]').click();await page.waitForFunction(()=>!busy);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumcards_web_data')).decks.length),1);
    });
    await scenario('unreadable storage must never be replaced with demo data','{"decks":[',async page=>{
      assert.equal(await page.evaluate(()=>localStorage.getItem('lumcards_web_data')==='{"decks":['),true,'Preserve the original payload for recovery');
      assert(await page.locator('.error-panel').isVisible(),'Explain unreadable data instead of silently resetting');
    },true);

    const mixed=fixture(true);mixed._revlogs.push({id:'not-a-date',cid:now-1000},{id:1e99,cid:now-1000},{id:now+86400000,cid:now-1000},null);
    await scenario('invalid and future history is preserved but not counted',mixed,async page=>{
      assert.equal((await openStats(page)).today,1);
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumcards_web_data'))._revlogs),mixed._revlogs);
      assert.equal(await page.evaluate(()=>detailedStats.history.days30.reduce((sum,d)=>sum+d.reviews,0)),1);
    });
    const noHistory=empty();noHistory.stats.reviewedToday=20;
    await scenario('missing history never invents retention or study time',noHistory,async page=>{
      assert.equal((await openStats(page)).today,0);assert.equal(await page.evaluate(()=>detailedStats.today.retentionToday),null);assert.equal(await page.evaluate(()=>detailedStats.today.timeSeconds),0);
    });
    await scenario('invalid stored shape stays intact','null',async page=>{
      assert.equal(await page.evaluate(()=>localStorage.getItem('lumcards_web_data')),'null');assert(await page.locator('.error-panel').isVisible());
    },true);
    await scenario('statistics failure has one request and manual recovery',fixture(),async page=>{
      await page.evaluate(()=>{window.originalStatsApi=api;window.statsCalls=0;api=async(...args)=>{if(args[0].startsWith('stats/detailed')){statsCalls++;return null;}return originalStatsApi(...args);};});
      await page.locator('[data-view="stats"]').click();await page.locator('[data-action="retry-stats"]').waitFor();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>statsCalls),1);
      const dir=path.join(__dirname,'screenshots_web_recovery');fs.mkdirSync(dir,{recursive:true});
      for(const [w,h] of [[390,844],[844,390],[1024,650],[1366,768],[320,844],[683,384]])for(const dark of [false,true]){
        await page.setViewportSize({width:w,height:h});await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(dir,`${w}-${dark?'dark':'light'}.png`)});
      }
      await page.evaluate(()=>{api=originalStatsApi;});await page.locator('[data-action="retry-stats"]').focus();await page.keyboard.press('Enter');await page.locator('.stats-container').waitFor();assert.equal(await page.evaluate(()=>detailedStats.today.cardsStudied),1);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
    });
    assert.deepEqual(failures,[],'Static browser regressions failed');
  }finally{
    if(browser)await browser.close();
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
