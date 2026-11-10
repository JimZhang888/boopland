const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
test('plant, one watering, no early harvest and exactly one payout', () => {
  const s = E.create();
  assert.equal(E.act(s,'plant',0,'wheat'),'planted');
  assert.equal(E.act(s,'plant',0,'wheat'),'invalid');
  assert.equal(E.act(s,'harvest',0),'invalid');
  assert.equal(E.act(s,'water',0),'watered');
  assert.equal(s.plots[0].left,9.6);
  assert.equal(E.act(s,'water',0),'invalid');
  E.tick(s,10); assert.equal(E.act(s,'harvest',0),'harvested');
  assert.equal(s.inventory.wheat,5); assert.equal(E.act(s,'harvest',0),'invalid');
});
test('free wheat prevents a zero-money dead end', () => {
  const s = E.create(); s.coins = 0; s.inventory.wheat = 0;
  assert.equal(E.act(s,'plant',0,'wheat'),'planted'); E.tick(s,16); E.act(s,'harvest',0);
  for(let i=0;i<3;i++) assert.equal(E.act(s,'sell','wheat'),'sold');
  assert.equal(s.coins,12); assert.equal(E.act(s,'sell','wheat'),'invalid');
});
test('land costs increase and failed actions do not mutate state', () => {
  const s=E.create(); assert.equal(E.landCost(s),25);
  E.act(s,'land',3); assert.equal(E.landCost(s),40); assert.equal(s.coins,75);
  E.act(s,'land',4); assert.equal(s.coins,35);
  const before=JSON.stringify(s); assert.equal(E.act(s,'land',5),'money'); assert.equal(JSON.stringify(s),before);
  assert.equal(E.act(s,'plant',5,'wheat'),'invalid'); assert.equal(E.act(s,'plant',0,'berry'),'locked');
});
test('animal production requires feed, finishes once, and waits indefinitely', () => {
  const s=E.create(); E.act(s,'buy','chicken'); E.act(s,'produce','chicken');
  assert.equal(s.inventory.wheat,1); assert.equal(E.act(s,'produce','chicken'),'invalid');
  assert.equal(E.act(s,'collect','chicken'),'invalid'); E.tick(s,100000);
  assert.equal(E.act(s,'collect','chicken'),'collected'); assert.equal(s.inventory.egg,2);
  assert.equal(E.act(s,'collect','chicken'),'invalid'); assert.equal(s.animals.chicken.owned,true);
});
test('all eight orders are achievable from the real starting economy', () => {
  const s=E.create(); let actions=0;
  function harvest(id) {
    if (s.coins < E.CROPS[id].cost) earn(E.CROPS[id].cost);
    assert.equal(E.act(s,'plant',0,id),'planted'); E.act(s,'water',0); E.tick(s,60); E.act(s,'harvest',0); actions++;
  }
  function earn(amount) {
    while(s.coins<amount) { harvest('wheat'); for(let i=0;i<3;i++) E.act(s,'sell','wheat'); }
  }
  function get(id,n) {
    while(s.inventory[id]<n) {
      if(E.CROPS[id]) { harvest(id); continue; }
      const [unit,d]=Object.entries({...E.ANIMALS,...E.MACHINES}).find(([,d])=>d.output===id);
      assert.ok(E.level(s)>=d.level,`${id} is unlocked before its first order`);
      const u=s.animals[unit] || s.machines[unit];
      if(!u.owned) { earn(d.cost); assert.equal(E.act(s,'buy',unit),'bought'); }
      for(const [ingredient,q] of Object.entries(d.input)) get(ingredient,q);
      assert.equal(E.act(s,'produce',unit),'started'); E.tick(s,60); assert.equal(E.act(s,'collect',unit),'collected'); actions++;
    }
  }
  for(let i=0;i<10;i++) {
    for(const [id,n] of Object.entries(E.order(s).needs)) get(id,n);
    assert.equal(E.act(s,'deliver'),i===7?'prosperous':'delivered');
    assert.ok(s.coins>=0); assert.ok(E.restore(s));
  }
  assert.equal(s.delivered,10); assert.equal(E.level(s),5); assert.ok(actions<200);
});
test('invalid production, delivery and purchase preserve resources', () => {
  const s=E.create(), before=JSON.stringify(s);
  assert.equal(E.act(s,'deliver'),'ingredients'); assert.equal(E.act(s,'buy','cow'),'locked');
  assert.equal(E.act(s,'produce','mill'),'invalid'); assert.equal(JSON.stringify(s),before);
  s.delivered=6; s.coins=1000;
  for(const id of Object.keys(E.MACHINES)) { E.act(s,'buy',id); assert.equal(E.act(s,'buy',id),'invalid'); }
  assert.equal(E.act(s,'produce','oven'),'ingredients');
});
test('save roundtrip, invalid saves, no offline catch-up, no aliasing', () => {
  const s=E.create(); E.act(s,'plant',0,'wheat'); E.tick(s,5);
  const restored=E.restore(JSON.stringify(s)); assert.deepEqual(restored,s); restored.coins=0; assert.equal(s.coins,100);
  assert.equal(E.restore('{'),null); assert.equal(E.restore(null),null);
  for(const mutate of [s=>s.coins=-1,s=>s.plots[0].crop='bogus',s=>s.plots[0].left=Infinity,s=>s.animals.cow.owned=true,s=>s.plots[0].open=false,s=>s.inventory.egg=-1,s=>s.version=9]) {
    const bad=JSON.parse(JSON.stringify(s)); mutate(bad); assert.equal(E.restore(bad),null);
  }
  const old=JSON.stringify(s); E.tick(s,NaN); E.tick(s,-1); assert.equal(JSON.stringify(s),old);
});
test('eight complete translations, matching placeholders and all referenced UI keys', () => {
  let dictionary; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{ BooplandI18n:{register(scope,data){assert.equal(scope,'farm');dictionary=data;}} });
  assert.equal(Object.keys(dictionary).length,8);
  for(const [locale,d] of Object.entries(dictionary)) {
    assert.deepEqual(Object.keys(d),Object.keys(dictionary.en));
    for(const [key,value] of Object.entries(d)) {
      assert.ok(value.trim(),`${locale}.${key}`);
      assert.deepEqual((value.match(/\{\w+\}/g)||[]).sort(),(dictionary.en[key].match(/\{\w+\}/g)||[]).sort(),`${locale}.${key}`);
    }
  }
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const m of html.matchAll(/data-i18n(?:-label|-content)?="([^"]+)"/g)) if(!m[1].includes('.')) assert.ok(dictionary.en[m[1]],m[1]);
});
test('lobby registration, local assets, no build or remote dependencies', () => {
  const root=path.resolve(__dirname,'../..'), context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),context);
  const records=context.window.GAME_LIST.filter(g=>g.path==='./games/paper-farm/index.html'); assert.equal(records.length,1); assert.equal(Object.keys(records[0].locales).length,7);
  assert.ok(fs.existsSync(path.join(root,records[0].cover)));
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) { assert.ok(m[1].startsWith('.')); assert.ok(fs.existsSync(path.resolve(__dirname,m[1])),m[1]); }
  assert.ok(!html.includes('type="module"'));
});
