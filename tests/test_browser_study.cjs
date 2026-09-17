const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Richard/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumcards-browser-'));
  const root = path.resolve(__dirname, '..');
  const port = 18769;
  const server = spawn(path.join(root,'.venv/Scripts/python.exe'), [path.join(root,'server.py'),'--port',String(port),'--data-dir',temp], {windowsHide:true,stdio:'ignore'});
  let browser;
  try {
    const base = 'http://127.0.0.1:'+port;
    for(let n=0;n<80;n++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    const mediaDir=path.join(temp,'collection.media');
    fs.mkdirSync(mediaDir,{recursive:true});
    const samples=44100*3, wav=Buffer.alloc(44+samples*2);
    wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
    for(let i=0;i<samples;i++)wav.writeInt16LE(Math.round(Math.sin(i*440*2*Math.PI/44100)*3000),44+i*2);
    fs.writeFileSync(path.join(mediaDir,'test.wav'),wav);
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page=await browser.newPage();
    await page.goto(base);
    await page.waitForFunction(()=>typeof mountCard==='function');
    for(const [width,height] of [[1366,768],[1024,650],[390,844],[844,390]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>{
        view='study';revealed=false;reviewSession={cards:[{id:1,front:'<h2>Test</h2><audio src="/media/test.wav"></audio>',back:'<p>Long answer</p>'.repeat(70)+'<audio src="/media/test.wav"></audio>',css:'.card{background:black;color:white;text-align:center;max-width:1040px}',questionAudios:['test.wav'],answerAudios:['test.wav']}],counts:{},intervals:[]};
        render();
      });
      const frame=page.frameLocator('#study-frame');
      await frame.locator('.anki-audio-pill').click();
      await page.waitForFunction(()=>{const a=document.querySelector('#anki-study-audio');return a&&!a.paused&&a.currentTime>0.1;});
      const before=await page.locator('#anki-study-audio').evaluate(a=>a.currentTime);
      await frame.locator('.anki-audio-pill').click();
      await page.waitForTimeout(70);
      const after=await page.locator('#anki-study-audio').evaluate(a=>({time:a.currentTime,paused:a.paused,error:a.error?.code}));
      assert(!after.paused&&!after.error,'Replay must be playing');
      assert(after.time<before+0.15,'Replay must restart');
      const layout=await frame.locator('main.card').evaluate(card=>({w:card.getBoundingClientRect().width,h:card.getBoundingClientRect().height,vw:innerWidth,vh:innerHeight,top:card.getBoundingClientRect().top}));
      assert(Math.abs(layout.w-layout.vw)<2,JSON.stringify(layout));
      assert(layout.h>=layout.vh-1&&layout.top===0,JSON.stringify(layout));
      await page.screenshot({path:path.join(temp,'study-'+width+'x'+height+'.png')});
      await page.locator('[data-action="reveal"]').click();
      const longButton=frame.locator('.anki-audio-pill');
      await longButton.click();
      await page.waitForFunction(()=>{const a=document.querySelector('#anki-study-audio');return a&&!a.paused&&a.currentTime>0.1;});
      const overflow=await frame.locator('body').evaluate(body=>({scroll:body.ownerDocument.scrollingElement.scrollHeight,height:innerHeight}));
      assert(overflow.scroll>overflow.height,'Long answers remain scrollable');
      const footer=await page.locator('.anki-bottom-bar').boundingBox();
      assert(footer&&footer.y>=0&&footer.y+footer.height<=height+1,'Ratings must remain inside viewport');
      console.log(width+'x'+height+': actual audio decoded, replay and full card viewport OK');
    }
  } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
