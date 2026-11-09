const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
function tiles(types) { const c = Array(30).fill(0); return types.map(t => { assert.ok(c[t] < 4); return t * 4 + c[t]++; }); }
const seqTypes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,18,19,20,21,22,23];
function conserved(s) {
  const all = [...s.deck,...s.indicators,...s.players.flatMap(p => [...p.hand,...p.melds.flatMap(m => m.tiles)]),...s.discards.filter(d => !d.claimed).map(d => d.uid)];
  assert.equal(all.length,120); assert.equal(new Set(all).size,120); assert.ok(all.every(u => u>=0 && u<120));
  if (s.phase !== 'over') s.players.forEach((p,i) => {
    const expected = (s.phase === 'initial' ? i === s.dealer : s.phase === 'discard' || (s.phase === 'reaction' && s.reaction.origin === 'rob') ? i === (s.reaction?.from ?? s.current) : false) ? 23 : 22;
    assert.equal(p.hand.length + E.groups(p)*3,expected,'effective hand size: '+JSON.stringify({phase:s.phase,i,current:s.current}));
  });
}
test('deals 120 unique cards, 23/22/22 and two indicators',() => { const s=E.create(123); conserved(s); assert.equal(s.deck.length,51); assert.deepEqual(s.players.map(p=>p.hand.length),[23,22,22]); });
test('seven groups are required, honors cannot form sequences',() => {
  assert.ok(E.partitions(tiles([...seqTypes,27,27])).length);
  assert.equal(E.partitions(tiles([0,1,2,3,4,5,6,7,8,9,10,11,27,27])).length,0);
  assert.equal(E.partitions(tiles([...seqTypes.slice(0,18),27,28,29,26,26])).length,0);
});
test('recognizes Qing, Piao, mixed hands and live waits',() => {
  const q={hand:tiles([...seqTypes,27,27]),melds:[]}; assert.equal(E.winningScore(q,[100,104],{card:27}).kind,'qing');
  const p={hand:tiles([0,3,6,9,12,15,27].flatMap(t=>[t,t,t]).concat(29,29)),melds:[]};
  assert.equal(E.winningScore(p,[100,104],{card:29}).kind,'piao');
  assert.equal(E.distance(q.hand),-1); assert.ok(E.waits(q.hand.slice(0,-1)).includes(27)); assert.equal(E.distance(q.hand.slice(0,-1)),0);
  const mixed={hand:tiles([...seqTypes.slice(0,18),27,27,27,29,29]),melds:[]}; assert.equal(E.winningScore(mixed,[100,104]).kind,'ta');
});
test('source examples for exact, related and old generals',() => {
  const normal=[3*4,10*4];
  assert.equal(E.baseValue(0,'peng',normal),2); assert.equal(E.baseValue(17,'peng',normal),4);
  assert.equal(E.baseValue(3,'peng',normal),8); assert.equal(E.baseValue(3,'triplet',normal),24);
  assert.equal(E.baseValue(12,'triplet',normal),8);
  assert.equal(E.baseValue(3,'dragon',[12,13]),64);
  assert.equal(E.baseValue(27,'dragon',[108,109]),128);
  assert.equal(E.baseValue(28,'triplet',[108,109]),32);
});
test('invalid action cannot mutate the state',() => {
  const s=E.create(12),before=JSON.stringify(s); assert.equal(E.act(s,{kind:'discard',uid:999}),false); assert.equal(JSON.stringify(s),before);
});
test('two-card starting declaration draws two and consumes no group',() => {
  let s;
  for(let seed=1;seed<10000;seed++){const x=E.create(seed); if(E.type(x.indicators[0])===E.type(x.indicators[1]) && E.actions(x).some(a=>a.kind==='dragon'&&E.counts(x.players[0].hand)[a.card]===2)){s=x;break;}}
  assert.ok(s); const action=E.actions(s).find(a=>a.kind==='dragon'&&E.counts(s.players[0].hand)[a.card]===2),before=s.players[0].hand.length;
  E.act(s,action); assert.equal(s.players[0].hand.length,before); assert.equal(s.players[0].melds[0].groups,0); conserved(s);
});
test('AI view excludes opponents hands and future deck order',() => {
  const s=E.create(51),a=E.view(s,0); s.players[1].hand.reverse(); s.deck.reverse(); const b=E.view(s,0);
  assert.deepEqual(a,b); assert.equal('players' in a,false); assert.equal('deck' in a,false); assert.deepEqual(E.decide(a),E.decide(b));
});
function rig(requests, current, openMeld) {
  const s=E.create(42); const pool=Array.from({length:120},(_,i)=>i);
  const take=t=>{const at=pool.findIndex(u=>E.type(u)===t);assert.ok(at>=0);return pool.splice(at,1)[0];};
  s.players.forEach((p,i)=>{p.hand=requests[i].map(take);p.melds=[];p.initial=[];});
  if(openMeld){s.players[current].melds.push({kind:'peng',card:openMeld,tiles:[take(openMeld),take(openMeld),take(openMeld)],groups:1,from:1});}
  s.players.forEach((p,i)=>{const n=(i===current?23:22)-E.groups(p)*3;while(p.hand.length<n)p.hand.push(pool.pop());});
  s.indicators=[pool.pop(),pool.pop()];s.deck=pool;s.phase='discard';s.current=current;s.dealer=current;s.discards=[];s.lastDraw=null;
  conserved(s);return s;
}
test('a farther Hu has priority over a nearer Peng',()=>{
  const s=rig([[29,29],[...seqTypes,29],[29]],2);
  const uid=s.players[2].hand.find(u=>E.type(u)===29); E.act(s,{kind:'discard',uid});
  assert.equal(s.phase,'reaction');assert.equal(s.current,1);assert.deepEqual(E.actions(s),[{kind:'hu'},{kind:'pass'}]);
  E.act(s,{kind:'hu'});assert.equal(s.result.winner,1);conserved(s);
});
test('robbing an added Kong moves exactly one tile and keeps the original Peng',()=>{
  const s=rig([[1],[...seqTypes.filter(t=>t!==1),29,29],[]],0,1);
  // All four 2-Myriad cards belong to player zero; opponent one waits on a sequence gap.
  E.act(s,{kind:'jiagang',card:1});assert.equal(s.phase,'reaction');assert.equal(s.current,1);
  E.act(s,{kind:'hu'});assert.equal(s.result.winner,1);assert.equal(s.result.info.rob,true);assert.equal(s.players[0].melds[0].tiles.length,3);conserved(s);
});
test('200 seeded games preserve all cards, finish, and settle to zero',() => {
  let won=0,drawn=0; const used=new Set();
  for(let seed=1;seed<=200;seed++){
    const s=E.create(seed,seed%3); let steps=0; conserved(s);
    while(s.phase!=='over' && steps++<700){const a=E.decide(E.view(s,s.current));used.add(a.kind);assert.ok(E.act(s,a));conserved(s);}
    assert.equal(s.phase,'over','seed '+seed); assert.equal(s.result.deltas.reduce((a,b)=>a+b,0),0);
    if(s.result.winner===null) drawn++; else {won++;assert.ok(E.partitions(s.players[s.result.winner].hand,E.groups(s.players[s.result.winner])).length);}
  }
  console.log({won,drawn,actions:[...used]}); assert.ok(won>0&&drawn>0); assert.ok(used.has('peng')&&used.has('minggang')&&used.has('angang')&&used.has('jiagang'));
});
