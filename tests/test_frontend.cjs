const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const noop = () => {};
const element = {addEventListener:noop,classList:{toggle:noop},innerHTML:''};
const context = vm.createContext({
  document:{querySelector:()=>element,addEventListener:noop,documentElement:element},
  window:{addEventListener:noop},localStorage:{getItem:()=>null},
  setTimeout:noop,clearTimeout:noop,URLSearchParams,URL,Intl,console,
});
const source = fs.readFileSync(path.join(root,'dist/app.js'),'utf8').replace(/^boot\(\);$/m,'');
vm.runInContext(source,context);
context.fixture={decks:[{id:10,name:'Idiomas <ejemplo>',total:5,due:5,new:5,learned:0,childIds:[10]}],cards:[],settings:{dailyGoal:20},stats:{totalCards:5,dueToday:5,reviewedToday:0,streak:0,retention:null},storage:{dataDir:'D:\\CODEX\\data'}};
vm.runInContext('data=fixture;',context);
assert.equal(vm.runInContext('getDue(data.decks[0])',context),5);
const dashboard=vm.runInContext('dashboard()',context);
assert.match(dashboard,/5 para estudiar/);
assert.match(dashboard,/Idiomas &lt;ejemplo&gt;/);
assert.match(dashboard,/Crear carpeta/);
assert.ok(!dashboard.includes('Idiomas <ejemplo>'));
assert.match(source,/api\('folders',\{name:values\.name\}\)/);
assert.match(source,/id="rename-deck-form"/);
assert.match(source,/button\('Renombrar [^']*','rename-deck'/);
assert.match(vm.runInContext('settingsView()',context),/D:\\CODEX\\data/);
vm.runInContext(`view='cards'; selectedDeck=10; browsePage={total:100,offset:0,hasMore:true};data.cards=[{id:20,deckId:10,frontText:'<script>contenido</script>',backText:'respuesta',tags:['tag'],editable:true,templateName:'Inversa'}]`,context);
const page=vm.runInContext('cardsView()',context);
assert.match(page,/1–1 de 100/);
assert.match(page,/&lt;script&gt;contenido&lt;\/script&gt;/);
assert.match(page,/data-action="page-next"/);
assert.match(page,/Inversa/);
const katex=require(path.join(root,'dist/vendor/katex/katex.min.js'));
const options={trust:false,throwOnError:false,maxExpand:1000};
assert.match(katex.renderToString('x^2 + \\frac{1}{2}',options),/katex/);
assert.ok(!katex.renderToString('\\href{javascript:alert(1)}{unsafe}',options).includes('href="javascript:'));
console.log('Frontend templates, escaping, pagination, counters and formula rendering: OK');
