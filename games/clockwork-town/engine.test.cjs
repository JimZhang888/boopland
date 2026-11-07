const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const translations = require('./translations.js');
const act = (s,type,extra={}) => E.apply(s,{type,...extra});
const click = (s,id) => act(s,'interact',{id});
const select = (s,id) => act(s,'select',{id});
function openGate(s) {
  click(s,'cord');click(s,'magnet');select(s,'cord');select(s,'magnet');
  click(s,'drain');select(s,'gear');click(s,'gate');
  for(const [index,count] of [2,4,1].entries())for(let n=0;n<count;n++)act(s,'dial',{index});
}
function powerOn(s) {
  act(s,'go',{room:'workshop'});act(s,'posture');click(s,'oil');select(s,'oil');click(s,'generator');
  // An independent hand-traced route: (0,0)→(0,1)↓(1,1)←(1,0)↓(2,0)→(2,1)→(2,2).
  const solution = [10,12,null,6,9,null,3,10,10];
  solution.forEach((mask,index)=>{if(mask!==null)for(let n=0;s.pipes[index]!==mask&&n<4;n++)act(s,'pipe',{index});});
}
function finish(s) {
  click(s,'drawer');act(s,'go',{room:'tower'});select(s,'lens');click(s,'beacon');
  for(let index=0;index<3;index++)act(s,'mirror',{index});
}
test('complete adventure: combine, retrieve, unlock, stretch, oil, route steam and reflect light',()=>{
  const s=E.fresh();
  assert.equal(E.progress(s),0);
  openGate(s); assert.ok(s.flags.gate);assert.equal(E.progress(s),1);assert.deepEqual(s.items,[]);
  powerOn(s);assert.ok(s.flags.power);assert.equal(E.progress(s),2);
  finish(s);assert.ok(s.flags.won);assert.equal(E.progress(s),3);assert.deepEqual(s.items,[]);
  assert.equal(E.stage(s),'done');
  act(s,'go',{room:'yard'});assert.ok(s.flags.won);assert.equal(s.room,'yard');
});
test('wrong items, inaccessible rooms and remote actions cannot skip dependencies or consume items',()=>{
  const s=E.fresh();
  act(s,'go',{room:'tower'});act(s,'go',{room:'workshop'});click(s,'oil');act(s,'pipe',{index:0});act(s,'mirror',{index:0});
  assert.equal(s.room,'yard');assert.deepEqual(s.items,[]);assert.equal(s.history.length,0);
  click(s,'magnet');select(s,'magnet');assert.equal(click(s,'drain').message,'magnetTooShort');assert.equal(click(s,'gate').message,'wrongItem');
  assert.deepEqual(s.items,['magnet']);assert.equal(s.selected,'magnet');
  click(s,'magnet');assert.deepEqual(s.items,['magnet']);
  act(s,'dial',{index:1});assert.deepEqual(s.dials,[0,0,0]);
});
test('height matters; earlier scenes remain reachable; missing lens has a recoverable route',()=>{
  const s=E.fresh();openGate(s);act(s,'go',{room:'workshop'});
  assert.equal(click(s,'oil').message,'tooHigh');assert.deepEqual(s.items,[]);
  assert.equal(click(s,'drawer').message,'drawerLocked');
  powerOn(s);act(s,'go',{room:'tower'});assert.equal(click(s,'beacon').message,'missingLens');
  act(s,'go',{room:'workshop'});finish(s);assert.ok(s.flags.won);
});
test('drain inspection explains each missing tool and never consumes unfinished items',()=>{
  const s=E.fresh();
  assert.equal(click(s,'drain').modal,'drain');
  assert.equal(click(s,'drain').message,'deepDrain');
  click(s,'cord');select(s,'cord');assert.equal(click(s,'drain').message,'cordNeedsMagnet');
  assert.deepEqual(s.items,['cord']);
  click(s,'magnet');assert.equal(click(s,'drain').message,'tieLine');
  assert.deepEqual(s.items,['cord','magnet']);assert.equal(s.flags.gear,undefined);
});
test('a deselected or restored magnetic line still exposes a clear gear pickup action',()=>{
  let s=E.fresh();click(s,'cord');click(s,'magnet');select(s,'cord');select(s,'magnet');
  assert.equal(s.selected,'hook');
  select(s,'hook');assert.equal(s.selected,null);
  let inspection=click(s,'drain');assert.equal(inspection.modal,'drain');assert.equal(inspection.message,'lineReady');
  assert.deepEqual(s.items,['hook']);assert.equal(s.flags.gear,undefined);
  select(s,'hook');s=E.restore(E.serialize(s));
  assert.equal(s.selected,null);assert.equal(click(s,'drain').message,'lineReady');
  select(s,'hook');const pickup=click(s,'drain');
  assert.equal(pickup.modal,'gearFound');assert.deepEqual(s.items,['gear']);assert.ok(s.flags.gear);
  click(s,'drain');assert.deepEqual(s.items,['gear']);
});

test('gate inspection distinguishes a missing gear from one already in the pocket',()=>{
  const s=E.fresh();
  const missing=click(s,'gate');
  assert.equal(missing.modal,'gate');assert.equal(missing.message,'missingGear');
  assert.equal(s.flags.fitted,undefined);assert.equal(s.flags.gate,undefined);
  click(s,'cord');click(s,'magnet');select(s,'cord');
  const wrong=click(s,'gate');
  assert.equal(wrong.modal,'gate');assert.equal(wrong.message,'wrongItem');
  assert.deepEqual(s.items,['cord','magnet']);assert.equal(s.selected,'cord');
  select(s,'magnet');click(s,'drain');
  const ready=click(s,'gate');
  assert.equal(ready.modal,'gate');assert.equal(ready.message,'gearReady');
  assert.deepEqual(s.items,['gear']);assert.equal(s.selected,null);
  assert.equal(s.flags.fitted,undefined);assert.equal(s.flags.gate,undefined);
});

test('a saved unselected gear can be fitted and the gate opened without repeating collection',()=>{
  let s=E.fresh();click(s,'cord');click(s,'magnet');select(s,'cord');select(s,'magnet');click(s,'drain');
  select(s,'gear');s=E.restore(E.serialize(s));
  assert.equal(s.selected,null);assert.equal(click(s,'gate').message,'gearReady');
  select(s,'gear');const fitted=click(s,'gate');
  assert.equal(fitted.modal,'lock');assert.ok(s.flags.fitted);assert.deepEqual(s.items,[]);
  s=E.restore(E.serialize(s));assert.equal(click(s,'gate').modal,'lock');
  assert.equal(act(s,'go',{room:'workshop'}).message,'lockedGate');
  for(const [index,count] of [2,4,1].entries())for(let n=0;n<count;n++)act(s,'dial',{index});
  assert.ok(s.flags.gate);click(s,'gate');assert.equal(s.room,'workshop');
});
test('pipe connections reject leaks and disconnected outputs; unused isolated pipes are allowed',()=>{
  const solved=[10,12,6,6,9,5,3,10,10];
  assert.ok(E.connected(solved));
  assert.ok(E.connected([10,12,3,6,9,10,3,10,10]));
  for(const index of [0,1,3,4,6,7,8]){
    const broken=solved.slice();broken[index]=E.rotate(broken[index]);assert.equal(E.connected(broken),false);
  }
  assert.equal(E.connected([10,10,10,10,10,10,10,10,10]),false);
  for(let mask=0;mask<16;mask++)assert.equal(E.rotate(E.rotate(E.rotate(E.rotate(mask)))),mask);
});
test('all eight mirror configurations produce the intended single optical solution',()=>{
  let solutions=0;
  for(let bits=0;bits<8;bits++){
    const mirrors=[bits&1,(bits>>1)&1,(bits>>2)&1], trace=E.lightPath(mirrors);
    if(trace.solved){solutions++;assert.deepEqual(mirrors,[0,0,1]);assert.deepEqual(trace.points.at(-1),[360,282]);}
    else assert.notDeepEqual(trace.points.at(-1),[360,282]);
  }
  assert.equal(solutions,1);
});
test('replay saves survive checkpoints and selected-item reloads without unintended combinations',()=>{
  let s=E.fresh();click(s,'cord');click(s,'magnet');select(s,'cord');
  s=E.restore(E.serialize(s));assert.equal(s.selected,null);
  select(s,'magnet');s=E.restore(E.serialize(s));
  assert.deepEqual(s.items,['cord','magnet']);assert.equal(s.flags.hook,undefined);
  select(s,'magnet');select(s,'cord');click(s,'drain');select(s,'gear');click(s,'gate');
  for(const [index,count] of [2,4,1].entries())for(let n=0;n<count;n++)act(s,'dial',{index});
  s=E.restore(E.serialize(s));powerOn(s);s=E.restore(E.serialize(s));finish(s);
  const restored=E.restore(E.serialize(s));assert.ok(restored.flags.won);assert.deepEqual(restored.items,[]);
  for(const invalid of ['garbage','null','{"version":7,"actions":[]}','{"version":1,"actions":[null,{},"x",{"type":"go","room":"tower"}]}'])assert.equal(E.progress(E.restore(invalid)),0);
});
test('hints follow durable progress, advance only to tier two and do not solve puzzles',()=>{
  const s=E.fresh();assert.equal(E.stage(s),'find');act(s,'hint');act(s,'hint');act(s,'hint');
  assert.equal(s.hints.find,2);assert.equal(E.progress(s),0);
  click(s,'cord');click(s,'magnet');assert.equal(E.stage(s),'combine');
  select(s,'cord');select(s,'magnet');assert.equal(E.stage(s),'fish');click(s,'drain');assert.equal(E.stage(s),'fit');
});
test('all eight languages are complete, placeholders agree, and game resources and lobby entry exist',()=>{
  const keys=Object.keys(translations.en), locales=['zh-CN','en','ja','ko','fr','de','es','pt-BR'];
  assert.equal(Object.keys(translations).length,8);
  for(const locale of locales){
    assert.deepEqual(Object.keys(translations[locale]),keys);
    for(const key of keys){
      assert.ok(typeof translations[locale][key]==='string'&&translations[locale][key].trim(),`${locale}.${key}`);
      assert.deepEqual((translations[locale][key].match(/\{\w+\}/g)||[]).sort(),(translations.en[key].match(/\{\w+\}/g)||[]).sort(),`${locale}.${key}`);
    }
  }
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const [,ref] of html.matchAll(/(?:src|href)="(\.\.?\/[^"?]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,ref)),ref);
  for(const [,key] of html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g))if(!key.startsWith('common.'))assert.ok(keys.includes(key),key);
  const code=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  for(const [,key] of code.matchAll(/\bt\('([^']+)'(?:\)|,)/g))assert.ok(keys.includes(key),key);
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(item=>item.path==='./games/clockwork-town/index.html');
  assert.equal(entries.length,1);assert.equal(entries[0].category,'解谜');
  assert.ok(fs.existsSync(path.resolve(__dirname,'../../',entries[0].cover)));
  assert.equal(Object.keys(entries[0].locales).length,7);
});
