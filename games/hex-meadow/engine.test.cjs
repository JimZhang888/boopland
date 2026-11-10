const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');

function moves(state) {
  return E.frontier(state).flatMap(cell => Array.from({length:6}, (_, rotation) => ({kind:'place', ...cell, rotation}))).filter(a => E.evaluate(state,a.q,a.r,a.rotation).valid);
}
test('rotation preserves every terrain edge and completes a six-step cycle', () => {
  E.TEMPLATES.forEach((_, i) => {
    const original = E.tile(i);
    for (let rotation=0;rotation<6;rotation++) {
      const rotated = E.tile(i,rotation);
      original.edges.forEach((edge,j) => assert.equal(rotated.edges[(j+rotation)%6],edge));
    }
  });
});
test('starting landscape has matching river boundaries and expected connected regions', () => {
  const state = E.create(14);
  assert.deepEqual(E.regions(state), {f:2,v:2,w:1});
  assert.equal(Object.keys(state.board).length,7);
  assert.equal(E.evaluate(state,0,0,0).reason,'occupied');
  assert.equal(E.evaluate(state,100,100,0).reason,'adjacent');
  assert.equal(E.evaluate(state,NaN,0,0).valid,false);
  Object.values(state.board).forEach(c => E.DIRS.forEach(([q,r],i) => {
    const n=state.board[E.key(c.q+q,c.r+r)];
    if(n) assert.equal(c.edges[i]==='w',n.edges[(i+3)%6]==='w');
  }));
});
test('river outlets reject land in both directions and accept aligned water', () => {
  const state=E.create(20); state.board={'0,0':{q:0,r:0,...E.tile(6)}}; state.queue[0]={index:9,variant:0};
  assert.equal(E.evaluate(state,1,0,0).reason,'riverBlocked');
  state.queue[0]={index:6,variant:0};
  assert.equal(E.evaluate(state,1,0,0).valid,true);
  assert.equal(E.evaluate(state,1,0,1).reason,'riverBlocked');
  state.board['0,0']= {q:0,r:0,...E.tile(9)};
  assert.equal(E.evaluate(state,1,0,0).reason,'riverBlocked');
});
test('touching terrain only counts when the shared edges connect', () => {
  const state=E.create(12); state.board={
    '0,0':{q:0,r:0,...E.tile(0,0)},
    '1,0':{q:1,r:0,...E.tile(0,0)}
  };
  assert.equal(E.regions(state).f,1);
  state.board['1,0']= {q:1,r:0,...E.tile(0,3)};
  assert.equal(E.regions(state).f,2);
});
test('a perfect placement rewards only when at least three neighboring edges match', () => {
  const state=E.create(12); state.queue[0]={index:9,variant:0};state.board={};
  E.DIRS.slice(0,3).forEach(([q,r])=>state.board[E.key(q,r)]={q,r,...E.tile(9)});
  const preview=E.evaluate(state,0,0,0);
  assert.equal(preview.perfect,true);assert.equal(preview.points,70);
  const result=E.apply(state,{kind:'place',q:0,r:0,rotation:0});
  assert.equal(result.gained,70);assert.equal(state.remaining,36);
});
test('joining a region completes its goal once and grants tiles and points', () => {
  const state=E.create(12);state.queue[0]={index:2,variant:0};state.goals.f=3;
  const move=moves(state).find(a=>{
    const trial=structuredClone(state);E.apply(trial,a);return trial.completed>0;
  });
  assert.ok(move);const result=E.apply(state,move);
  assert.deepEqual(result.finished,['f']);assert.equal(state.goals.f,6);
  assert.equal(state.completed,1);assert.equal(state.remaining,40+(result.perfect?1:0));
  assert.equal(result.gained,result.points+100);
});
test('save replay and undo exactly restore the queue, bag, rewards and score', () => {
  let state=E.create(9876);
  for(let i=0;i<18;i++) {
    const options=moves(state);assert.ok(options.length);
    E.apply(state,options[(i*7)%options.length]);
  }
  assert.deepEqual(E.restore(E.serialize(state)),state);
  const previous=structuredClone(state);
  E.apply(state,{kind:'swap'});state=E.undo(state);assert.deepEqual(state,previous);
  E.apply(state,moves(state)[0]);state=E.undo(state);assert.deepEqual(state,previous);
});
test('swap has a fixed budget and invalid moves never mutate state', () => {
  const state=E.create(15);for(let i=0;i<3;i++) assert.equal(E.apply(state,{kind:'swap'}).ok,true);
  const before=structuredClone(state);assert.equal(E.apply(state,{kind:'swap'}).ok,false);
  assert.equal(E.apply(state,{kind:'place',q:0,r:0,rotation:0}).ok,false);
  assert.equal(E.apply(state,{kind:'place',q:10,r:10,rotation:8}).ok,false);
  assert.deepEqual(state,before);
});
test('classic run ends on its last tile; free mode keeps its supply', () => {
  const classic=E.create(19);classic.remaining=1;classic.goals={f:999,v:999,w:999};
  const move=moves(classic).find(a=>!E.evaluate(classic,a.q,a.r,a.rotation).perfect);
  E.apply(classic,move);assert.equal(classic.ended,true);assert.equal(classic.remaining,0);
  assert.equal(E.apply(classic,{kind:'swap'}).ok,false);
  const free=E.create(19,'free');
  for(let i=0;i<40;i++) E.apply(free,moves(free)[i%3]);
  assert.equal(free.remaining,36);assert.equal(free.ended,false);assert.equal(free.placed,40);
});
test('corrupt and impossible save data are rejected', () => {
  for(const data of [null,{}, {version:1,seed:1,mode:'free',actions:[null]}, {version:1,seed:1,mode:'classic',actions:[{kind:'place',q:0,r:0,rotation:0}]}, {version:1,seed:0,mode:'free',actions:[]}, {version:1,seed:1,mode:'invalid',actions:[]}]) assert.equal(E.restore(data),null);
});
test('seeded play offers legal placements and preserves all river joins', () => {
  for(let seed=1;seed<=8;seed++) {
    const state=E.create(seed);
    for(let i=0;i<55&&!state.ended;i++) {
      const options=moves(state);assert.ok(options.length,`seed ${seed}, turn ${i}`);
      E.apply(state,options[(seed*31+i*17)%options.length]);
    }
    Object.values(state.board).forEach(c=>E.DIRS.forEach(([q,r],i)=>{
      const n=state.board[E.key(c.q+q,c.r+r)];if(n)assert.equal(c.edges[i]==='w',n.edges[(i+3)%6]==='w');
    }));
  }
});
test('eight complete dictionaries, placeholders, local assets and unique lobby registration', () => {
  let dictionary;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(scope,data)=>{assert.equal(scope,'hex');dictionary=data;}}});
  assert.equal(Object.keys(dictionary).length,8);
  const keys=Object.keys(dictionary.en).sort();
  Object.entries(dictionary).forEach(([locale,dict])=>{
    assert.deepEqual(Object.keys(dict).sort(),keys,locale);
    keys.forEach(key=>assert.deepEqual((dict[key].match(/\{\w+\}/g)||[]).sort(),(dictionary.en[key].match(/\{\w+\}/g)||[]).sort(),`${locale}.${key}`));
  });
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)="(\.[^"]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
  for(const match of html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g))if(!match[1].startsWith('common.'))assert.ok(dictionary.en[match[1]],match[1]);
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(game=>game.path.includes('/hex-meadow/'));
  assert.equal(entries.length,1);assert.equal(Object.keys(entries[0].locales).length,7);
  assert.ok(fs.existsSync(path.resolve(__dirname,'../..',entries[0].cover)));
});
