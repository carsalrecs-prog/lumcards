const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const scope = 'https://www.googleapis.com/auth/drive.file';
const source = fs.readFileSync(require('node:path').join(__dirname, '../dist/sync-manager.js'), 'utf8');
const startup = fs.readFileSync(require('node:path').join(__dirname, '../dist/client-startup.js'), 'utf8');
assert.match(startup, /702374747374-e4f826l9rpoa33ebmidnov2mb3ncq88h\.apps\.googleusercontent\.com/);
function fixture() {
  const saved = { lumcards_gdrive_token: 'drive_token_legacy', lumcards_gdrive_user: '{"email":"synthetic@example.test"}' };
  const calls = [];
  let config, next = {access_token:'synthetic-token', expires_in:3600, scope}, status = 200;
  const window = { LUMCARDS_DRIVE_CLIENT_ID:'123-synthetic.apps.googleusercontent.com', google:{accounts:{oauth2:{initTokenClient(c){config=c;return {requestAccessToken(){queueMicrotask(()=>next.popup ? c.error_callback(next) : c.callback(next));}};}}}}};
  const context = vm.createContext({window, module:{exports:{}}, Date, Blob, FormData, console,
    localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]},
    fetch:async(url,options)=>{calls.push({url,options});return {ok:status===200,status,json:async()=>url.includes('userinfo')?{email:'synthetic@example.test'}:url.includes('upload')?{id:'remote-copy',name:'test.colpkg'}:{files:[{id:'folder-or-file'}]},blob:async()=>new Blob(['remote synthetic'])};}
  });
  vm.runInContext(source, context);
  return {drive:context.module.exports.drive, saved, calls, window, config:()=>config, response:r=>next=r, status:s=>status=s};
}
(async()=>{
  const f=fixture(), d=f.drive;
  assert.equal(d.isConnected(),false); assert.equal(f.saved.lumcards_gdrive_token,undefined);
  delete f.window.LUMCARDS_DRIVE_CLIENT_ID;
  await assert.rejects(d.signIn('synthetic@example.test'),/configurad/);
  await assert.rejects(d.listFiles(),/Conecta/);
  await assert.rejects(d.downloadDeck('invented'),/Conecta/);
  await assert.rejects(d.uploadDeck(new Blob(['local'])),/Conecta/);
  assert.equal(f.calls.length,0);
  d.clientId='123-synthetic.apps.googleusercontent.com';
  const oauth=f.window.google; delete f.window.google;
  await assert.rejects(d.signIn(),/cargar Google/); f.window.google=oauth;
  for(const r of [{error:'access_denied'},{popup:true},{access_token:'synthetic',expires_in:3600,scope:''}]) {
    f.response(r); await assert.rejects(d.signIn()); assert.equal(d.isConnected(),false);
  }
  f.response({access_token:'synthetic-token',expires_in:3600,scope});
  f.status(403); await assert.rejects(d.signIn(),/verificar/); assert.equal(d.isConnected(),false);
  f.status(200); await d.signIn(); assert.equal(d.isConnected(),true);
  assert.equal(f.config().client_id,d.clientId); assert.equal(f.saved.lumcards_gdrive_token,undefined);
  assert.equal((await d.uploadDeck(new Blob(['local']),'test.colpkg')).id,'remote-copy');
  assert.equal((await d.listFiles())[0].id,'folder-or-file');
  assert.equal(await (await d.downloadDeck('remote-copy')).text(),'remote synthetic');
  assert(f.calls.every(c=>c.options.headers.Authorization==='Bearer synthetic-token'));
  f.status(403); await assert.rejects(d.uploadDeck(new Blob(['local'])),/acceder/);
  f.status(401); await assert.rejects(d.listFiles(),/caduc/); assert.equal(d.getUser(),null);
  f.status(200); await d.signIn(); d.expiresAt=Date.now()-1;
  await assert.rejects(d.downloadDeck('remote-copy'),/Conecta/); assert.equal(d.getUser(),null);
  const pending=d.signIn(); d.disconnect(); await assert.rejects(pending,/cancelada/);
  assert.equal(d.isConnected(),false);
  console.log('PASS Drive: legacy migration, missing configuration/SDK, denied consent, closed popup, missing scopes, profile failure, REST upload/list/download, HTTP failure, expiry, disconnect race. Synthetic only; no network.');
})().catch(e=>{console.error(e);process.exitCode=1;});
