const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');

// Reproducible player inputs; each timestamp is simulation time in seconds.
const solutions = [
  [[0,0]], [[0,0],[.58,1]], [[0,1],[.58,0]], [[.75,0]],
  [[0,0],[.52,1]], [[0,2],[0,1],[.52,0]], [[0,0],[2.5,'pop']],
  [[0,0],[1.65,'pop']], [[0,0],[.58,1]], [[0,0],[.5,1],[3.7,'pop']],
  [[.74,0]], [[0,2],[0,0],[.62,1]]
];
function play(index, actions, dt = E.STEP) {
  const state = E.create(index); let at = 0;
  for (let frame = 0; frame < 20 / dt && state.status === 'playing'; frame++) {
    while (at < actions.length && actions[at][0] <= state.time + 1e-7) {
      const [,action] = actions[at++]; action === 'pop' ? E.pop(state) : E.cut(state, action);
    }
    E.advance(state, dt);
  }
  return state;
}
test('all twelve levels have a three-star player solution', () => {
  solutions.forEach((solution,index) => { const s = play(index,solution); assert.equal(s.status,'won','level '+(index+1)); assert.equal(E.score(s),3,'level '+(index+1)); });
});
test('numbered cuts, swipe cuts and taps are single-use and respect pause', () => {
  const s = E.create(); s.paused = true;
  assert.equal(E.swipe(s,{x:240,y:120},{x:360,y:120}),0); assert.equal(E.cut(s,0),false);
  s.paused = false; assert.equal(E.swipe(s,{x:240,y:120},{x:360,y:120}),1); assert.equal(E.cut(s,0),false); assert.equal(s.cuts,1);
  const tap=E.create(1);assert.equal(E.swipe(tap,{x:155,y:65},{x:155,y:65}),1);assert.equal(tap.ropes[1].cut,false);
  assert.equal(E.swipe(E.create(),{x:300,y:220},{x:300,y:250}),0,'collinear but disjoint swipe');
  assert.equal(E.cut(s,99),false);
});
test('swiping through both ropes cuts both, while missing them does nothing', () => {
  const s=E.create(1); assert.equal(E.swipe(s,{x:20,y:80},{x:80,y:80}),0);
  assert.equal(E.swipe(s,{x:80,y:150},{x:500,y:150}),2);
});
test('a paused simulation stays still and frame rates share a fixed time step', () => {
  const s=E.create(3);s.paused=true;const before=JSON.stringify(s);E.advance(s,.1);assert.equal(JSON.stringify(s),before);
  const a=E.create(3),b=E.create(3);for(let i=0;i<240;i++)E.advance(a,1/120);for(let i=0;i<60;i++)E.advance(b,1/30);
  assert.ok(Math.abs(a.candy.x-b.candy.x)<1e-8);assert.ok(Math.abs(a.candy.y-b.candy.y)<1e-8);
  E.advance(a,NaN);assert.ok(Number.isFinite(a.candy.x));
});
test('retained ropes constrain distance and cutting preserves swing momentum', () => {
  const s=E.create(1);E.cut(s,0);for(let i=0;i<65;i++) {E.advance(s,E.STEP); const r=s.ropes[1]; assert.ok(Math.hypot(s.candy.x-r.x,s.candy.y-r.y)<=r.length+.1);}
  const vx=s.candy.vx;assert.ok(vx>80);E.cut(s,1);E.advance(s,E.STEP);assert.ok(Math.abs(s.candy.vx-vx)<1);
});
test('bubbles rise, must pop before feeding, and popping reverses their flight', () => {
  const s=E.create(6);E.cut(s,0);for(let i=0;i<200;i++)E.advance(s,E.STEP);assert.ok(s.candy.y<280);assert.equal(s.status,'playing');
  s.paused=true;assert.equal(E.pop(s),false);s.paused=false;assert.equal(E.pop(s),true);assert.equal(E.pop(s),false);
  for(let i=0;i<50&&s.status==='playing';i++)E.advance(s,E.STEP);assert.equal(s.status,'won');
});
test('spikes and escaping candy fail; settled results reject further actions', () => {
  const s=play(4,[[0,0],[0,1]]);assert.equal(s.status,'lost');assert.equal(E.cut(s,0),false);assert.equal(E.pop(s),false);
  const floating=play(6,[[0,0]]);assert.equal(floating.status,'lost');
  const won=play(0,solutions[0]),before=JSON.stringify(won);E.advance(won,.1);assert.equal(JSON.stringify(won),before);
});
test('zero-star wins unlock the next level; malformed saves cannot unlock arbitrary pages', () => {
  assert.equal(E.cleanSave({best:[0],current:1}).unlocked,1);
  const bad=E.cleanSave({best:[NaN,3,9,-4],current:100,sound:'yes'});assert.equal(bad.current,0);assert.equal(bad.unlocked,0);assert.equal(bad.sound,false);
  assert.equal(E.cleanSave({best:Array(12).fill(3),current:11}).unlocked,11);
});
test('all eight dictionaries have matching keys and interpolation values', () => {
  let messages;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register(scope,words){assert.equal(scope,'ropeGarden');messages=words;}}});
  assert.equal(Object.keys(messages).length,8);const keys=Object.keys(messages.en).sort();
  for(const words of Object.values(messages)){assert.deepEqual(Object.keys(words).sort(),keys);for(const key of keys){assert.equal(typeof words[key],'string');assert.ok(words[key].length);assert.deepEqual((words[key].match(/\{\w+\}/g)||[]).sort(),(messages.en[key].match(/\{\w+\}/g)||[]).sort());}}
});
test('lobby entry is unique and every local page resource exists', () => {
  const root=path.resolve(__dirname,'../..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(g=>g.path==='./games/cut-the-rope/index.html');assert.equal(entries.length,1);assert.equal(Object.keys(entries[0].locales).length,7);
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const [,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(url.startsWith('./')||url.startsWith('../'))assert.ok(fs.existsSync(path.resolve(__dirname,url)),url);}
});
module.exports={solutions,play};
