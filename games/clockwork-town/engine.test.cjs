const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const translations = require('./translations.js');
const act = (s,type,extra={}) => {
  const result=E.apply(s,{type,...extra});
  if(result.message)assert.ok(translations.en[result.message],`missing message: ${result.message}`);
  return result;
};
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
test('the original three chapters still complete and now unlock the greenhouse',()=>{
  const s=E.fresh();
  assert.equal(E.progress(s),0);
  openGate(s); assert.ok(s.flags.gate);assert.equal(E.progress(s),1);assert.deepEqual(s.items,[]);
  powerOn(s);assert.ok(s.flags.power);assert.equal(E.progress(s),2);
  finish(s);assert.ok(s.flags.won);assert.equal(E.progress(s),3);assert.deepEqual(s.items,[]);
  assert.equal(E.stage(s),'garden');assert.equal(s.flags.finished,undefined);assert.ok(E.canVisit(s,'greenhouse'));
  act(s,'go',{room:'yard'});assert.ok(s.flags.won);assert.equal(s.room,'yard');
});

function preparePump(s) {
  act(s,'go',{room:'greenhouse'});click(s,'arm');click(s,'grip');select(s,'arm');select(s,'grip');click(s,'pump');
}
function waterGarden(s) {
  preparePump(s);for(let n=0;n<3;n++)act(s,'transfer',{index:2});act(s,'transfer',{index:0});click(s,'planter');
}
function lowerBridge(s) {
  act(s,'go',{room:'bridge'});select(s,'bridgeKey');click(s,'cabinet');
  for(const index of [0,3,1,3,2,3])act(s,'weight',{index});
  click(s,'bridgeLever');click(s,'toolbox');
}
function sendMail(s) {
  act(s,'go',{room:'station'});click(s,'timetable');select(s,'mainspring');click(s,'clockDrive');
  for(const index of [0,2,1,0,3])act(s,'stamp',{index});click(s,'mailcar');
}
function oldEnding() {const s=E.fresh();openGate(s);powerOn(s);finish(s);return s;}

test('six-chapter journey assembles a crank, waters plants, balances a bridge and sends mail',()=>{
  const s=oldEnding();
  waterGarden(s);assert.equal(E.progress(s),4);assert.deepEqual(s.items,['bridgeKey']);
  lowerBridge(s);assert.equal(E.progress(s),5);assert.deepEqual(s.items,['mainspring']);
  sendMail(s);assert.equal(E.progress(s),6);assert.ok(s.flags.finished);assert.equal(E.stage(s),'done');assert.deepEqual(s.items,[]);
  for(const room of E.rooms){act(s,'go',{room});assert.equal(s.room,room);assert.equal(E.progress(s),6);}
});

test('old version-one completion saves continue without resetting the tower or inventory',()=>{
  const old=oldEnding(),save=JSON.parse(E.serialize(old));
  assert.equal(save.version,1);assert.ok(save.actions.every(a=>!['transfer','weight','stamp'].includes(a.type)));
  let s=E.restore(JSON.stringify(save));assert.ok(s.flags.won);assert.equal(s.room,'tower');assert.equal(E.progress(s),3);
  waterGarden(s);s=E.restore(E.serialize(s));lowerBridge(s);s=E.restore(E.serialize(s));sendMail(s);
  s=E.restore(E.serialize(s));assert.ok(s.flags.finished);assert.equal(E.progress(s),6);
});

test('new chapter locks and remote puzzle actions cannot bypass prerequisites',()=>{
  const s=E.fresh();
  for(const room of ['greenhouse','bridge','station']){act(s,'go',{room});assert.equal(s.room,'yard');}
  for(const type of ['transfer','weight','stamp'])act(s,type,{index:0});
  for(const id of ['water','balance','signal'])act(s,'resetPuzzle',{id});
  for(const id of ['arm','planter','bridgeLever','toolbox','mailcar'])click(s,id);
  assert.equal(s.history.length,0);assert.equal(E.progress(s),0);
  const lit=oldEnding();act(lit,'go',{room:'greenhouse'});
  assert.equal(click(lit,'planter').message,'planterDry');act(lit,'transfer',{index:2});assert.deepEqual(lit.water,[0,3,6]);
  act(lit,'go',{room:'station'});assert.equal(lit.room,'greenhouse');
});

test('all reachable water configurations conserve water and retain a route to the target',()=>{
  const base=oldEnding();preparePump(base);
  const queue=[base],seen=new Set([base.water.join(',')]),reverse=new Map();
  for(let q=0;q<queue.length;q++){
    const s=queue[q];if(s.flags.watered)continue;
    for(let index=0;index<3;index++){
      const next=structuredClone(s);act(next,'transfer',{index});
      assert.equal(next.water.reduce((a,b)=>a+b,0),9);assert.ok(next.water.every(v=>Number.isInteger(v)&&v>=0&&v<=6));
      const key=next.water.join(','),from=s.water.join(',');
      if(!reverse.has(key))reverse.set(key,new Set());reverse.get(key).add(from);
      if(!seen.has(key)){seen.add(key);queue.push(next);}
    }
  }
  const reachable=new Set(['2,4,3']),back=['2,4,3'];
  for(let q=0;q<back.length;q++)for(const key of reverse.get(back[q])||[])if(!reachable.has(key)){reachable.add(key);back.push(key);}
  assert.ok(seen.size>20);assert.deepEqual(reachable,seen);
});

test('new puzzles reject invalid inputs and preserve unfinished progress across reloads',()=>{
  let s=oldEnding();preparePump(s);
  for(const index of [-1,3,1.5,NaN,'2'])act(s,'transfer',{index});assert.deepEqual(s.water,[0,3,6]);
  act(s,'transfer',{index:2});s=E.restore(E.serialize(s));assert.deepEqual(s.water,[1,3,5]);
  act(s,'resetPuzzle',{id:'water'});assert.deepEqual(s.water,[0,3,6]);
  for(let n=0;n<3;n++)act(s,'transfer',{index:2});act(s,'transfer',{index:0});click(s,'planter');
  act(s,'go',{room:'bridge'});select(s,'bridgeKey');click(s,'cabinet');
  for(const index of [-1,4,1.5,NaN,'0'])act(s,'weight',{index});assert.equal(s.weightChoice,null);
  act(s,'weight',{index:0});s=E.restore(E.serialize(s));assert.equal(s.weightChoice,0);
  act(s,'weight',{index:3});assert.deepEqual(s.weights,[1,3,2,4]);
  act(s,'resetPuzzle',{id:'balance'});assert.deepEqual(s.weights,[4,3,2,1]);assert.equal(s.weightChoice,null);
  for(const index of [0,3,1,3,2,3])act(s,'weight',{index});click(s,'bridgeLever');click(s,'toolbox');
  act(s,'go',{room:'station'});select(s,'mainspring');click(s,'clockDrive');act(s,'stamp',{index:0});act(s,'stamp',{index:2});
  s=E.restore(E.serialize(s));assert.deepEqual(s.signals,[0,2]);
  for(const index of [-1,4,1.5,NaN,'0'])act(s,'stamp',{index});assert.deepEqual(s.signals,[0,2]);
  for(const index of [1,0,3])act(s,'stamp',{index});click(s,'mailcar');assert.ok(s.flags.finished);
});

test('wrong signal patterns can be retried and the mailcar requires an explicit departure',()=>{
  const s=oldEnding();waterGarden(s);lowerBridge(s);act(s,'go',{room:'station'});
  assert.equal(click(s,'mailcar').message,'trainWaits');assert.equal(click(s,'signal').modal,'clockDrive');
  select(s,'mainspring');click(s,'clockDrive');
  let wrong;for(let n=0;n<5;n++)wrong=act(s,'stamp',{index:1});
  assert.equal(wrong.message,'signalWrong');assert.deepEqual(s.signals,[]);assert.equal(s.flags.routeReady,undefined);
  for(const index of [0,2,1,0,3])act(s,'stamp',{index});assert.ok(s.flags.routeReady);assert.equal(s.flags.finished,undefined);
  click(s,'mailcar');assert.ok(s.flags.finished);assert.equal(E.progress(s),6);
});

test('return trips recover missed chapter rewards and wrong items are not consumed',()=>{
  const s=oldEnding();preparePump(s);for(let n=0;n<3;n++)act(s,'transfer',{index:2});act(s,'transfer',{index:0});
  act(s,'go',{room:'bridge'});assert.equal(click(s,'cabinet').modal,'cabinet');assert.equal(click(s,'toolbox').message,'toolboxFar');
  act(s,'go',{room:'greenhouse'});click(s,'planter');act(s,'go',{room:'bridge'});select(s,'bridgeKey');click(s,'bridgeLever');assert.deepEqual(s.items,['bridgeKey']);
  click(s,'cabinet');for(const index of [0,3,1,3,2,3])act(s,'weight',{index});click(s,'bridgeLever');
  act(s,'go',{room:'station'});assert.equal(click(s,'clockDrive').message,'springMissing');
  act(s,'go',{room:'bridge'});click(s,'toolbox');click(s,'toolbox');assert.deepEqual(s.items,['mainspring']);sendMail(s);assert.ok(s.flags.finished);
});

test('each chapter has art, translated hotspots and two translated hint levels',()=>{
  const A=require('./art.js'),s=oldEnding();
  for(const room of E.rooms){
    assert.ok(A.spots[room].length>=3);assert.ok(A.scene({...s,room}).includes('scene-robot'));
    for(const [id] of A.spots[room])for(const locale of Object.keys(translations))assert.ok(translations[locale][id],`${locale}.${id}`);
  }
  for(const stage of ['garden','water','key','balance','lower','spring','signal','depart','done'])
    for(const level of [1,2])for(const locale of Object.keys(translations))assert.ok(translations[locale]['h_'+stage+level],`${locale}.h_${stage}${level}`);
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
