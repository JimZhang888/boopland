const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const root = path.resolve(__dirname,'../..');
const catalogues = {};
const sandbox = {window:null,BooplandI18n:{register:(scope,messages)=>{catalogues[scope]=messages;}}};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const name of ['translations.js','cases.js','case-translations.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),sandbox);
const {definitions,fields,stories} = sandbox.DetectiveCases;
const permutations = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
for (const d of definitions) {
  const fresh = E.fresh();
  assert.equal(E.solve(fresh,d),'incomplete');
  assert.equal(E.challenge(fresh,d),'incomplete');
  assert.equal(E.collect(fresh,-1),false);
  for (let i=0;i<6;i++) E.collect(fresh,i);
  E.collect(fresh,2);
  assert.equal(fresh.found.length,6);
  // Exhaust all 18 testimony/evidence combinations: only authored contradictions work.
  for(let w=0;w<3;w++) for(let e=0;e<6;e++) {
    const s = E.restore(fresh,d); s.witness=w; s.evidence=e;
    assert.equal(E.challenge(s,d),d.pairs.some(p=>p.w===w&&p.e===e)?'linkFound':'wrongPair');
  }
  for (const p of d.pairs) { fresh.witness=p.w;fresh.evidence=p.e;assert.equal(E.challenge(fresh,d),'linkFound'); }
  assert.equal(E.ready(fresh),true);
  fresh.witness=d.pairs[0].w;fresh.evidence=d.pairs[0].e;
  assert.equal(E.challenge(fresh,d),'alreadyLinked');
  // Every actor/order hypothesis has exactly one valid conclusion.
  let solutions=0;
  for(let actor=0;actor<3;actor++) for(const order of permutations) {
    const s=E.restore(fresh,d);s.actor=actor;s.order=order.slice();
    const result=E.solve(s,d);
    if(result==='solved') {solutions++;assert.equal(E.restore(JSON.parse(JSON.stringify(s)),d).solved,true);}
    else assert.equal(s.solved,false);
  }
  assert.equal(solutions,1);
  const s=E.restore(fresh,d);s.actor=d.actor;
  assert.equal(E.move(s,0,-1),false);assert.equal(E.move(s,2,1),false);
  E.move(s,0,1);E.move(s,1,1);
  assert.deepEqual(s.order,[0,1,2]);assert.equal(E.solve(s,d),'solved');
  const corrupt=E.restore({found:[0,0,-1,'1',7],links:[0,1,99],order:[0,0,2],actor:8,witness:-1,evidence:5,tab:'bad',solved:true},d);
  assert.deepEqual(corrupt.found,[0]);assert.equal(corrupt.links.length,1);assert.equal(corrupt.solved,false);
  assert.deepEqual(corrupt.order,[2,0,1]);assert.equal(corrupt.tab,'witnesses');
}
const languages=['zh-CN','en','ja','ko','fr','de','es','pt-BR'];
for(const lang of languages) {
  for(const scope of Object.keys(catalogues)) {
    assert.deepEqual(Object.keys(catalogues[scope][lang]).sort(),Object.keys(catalogues[scope].en).sort());
    for(const [key,value] of Object.entries(catalogues[scope][lang])) {
      assert.ok(typeof value==='string'&&value.trim(),`${lang}/${key}`);
      assert.deepEqual((value.match(/\{\w+\}/g)||[]).sort(),(catalogues[scope].en[key].match(/\{\w+\}/g)||[]).sort(),`${lang}/${key} placeholders`);
    }
  }
  assert.equal(stories[lang].length,3);
  stories[lang].forEach(c=>assert.equal(c.length,fields.length));
}
for(const file of fs.readdirSync(__dirname).filter(x=>/\.(html|js|css)$/.test(x)&&x!=='verify.cjs')) {
  const text=fs.readFileSync(path.join(__dirname,file),'utf8');
  if(file.endsWith('.js')) new vm.Script(text,{filename:file});
  if(file.endsWith('.html')) for(const match of text.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)) {
    if(!/^[a-z]+:/.test(match[1])) assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
  }
}
const listContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),listContext);
const entries=listContext.window.GAME_LIST.filter(g=>g.path==='./games/one-page-detective/index.html');
assert.equal(entries.length,1);assert.equal(entries[0].category,'解谜');
for(const lang of languages.filter(x=>x!=='zh-CN')) assert.ok(entries[0].locales[lang].title);
assert.ok(fs.existsSync(path.resolve(root,entries[0].cover)));
console.log('PASS: 3 cases, 54 evidence pairs, 54 reconstruction hypotheses, storage validation, 8 complete translations, local resources and lobby entry.');
