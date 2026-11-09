const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function cards(text) {
  const seen = {};
  return text.split(' ').map(token => {
    const r = ({ J:11,Q:12,K:13,A:14,'2':15,SJ:16,BJ:17 })[token] || Number(token);
    const index = seen[r] || 0; seen[r] = index + 1;
    assert.ok(index < (r >= 16 ? 1 : 4));
    return r >= 16 ? r + 36 : (r - 3) * 4 + index;
  });
}
const signature = hand => E.groups(hand).map(([r, ids]) => `${r}:${ids.length}`).join(',');
function conserved(s) {
  const all = [...s.hands.flat(), ...s.played, ...(s.landlord == null ? s.bottom : [])];
  assert.equal(all.length,54); assert.equal(new Set(all).size,54);
}
test('54 unique cards, seeded deals, all first seats and 17/17/17 + 3', () => {
  for (let seed = 0; seed < 100; seed++) {
    const s = E.newGame(seed); conserved(s);
    assert.deepEqual(s.hands.map(h => h.length),[17,17,17]);
    assert.deepEqual(s,E.newGame(seed)); assert.equal(s.turn,seed % 3);
  }
  assert.throws(() => E.newGame(-1)); assert.throws(() => E.newGame(1,3));
});
test('all fourteen supported combination types', () => {
  for (const [text,type] of [
    ['3','single'],['2 2','pair'],['A A A','triple'],['3 3 3 BJ','tripleSingle'],['3 3 3 4 4','triplePair'],
    ['10 J Q K A','straight'],['3 3 4 4 5 5','pairRun'],['3 3 3 4 4 4','airplane'],
    ['3 3 3 4 4 4 5 5','airplaneSingle'],['3 3 3 4 4 4 5 5 6 6','airplanePair'],
    ['3 3 3 3 4 4','fourSingle'],['3 3 3 3 4 4 5 5','fourPair'],['2 2 2 2','bomb'],['SJ BJ','rocket']
  ]) assert.equal(E.classify(cards(text))?.type,type,text);
});
test('invalid runs, attachments, duplicate identities and malformed cards rejected', () => {
  for (const text of ['3 4','3 4 5 6','J Q K A 2','3 3 4 4','K K A A 2 2','A A A 2 2 2','3 3 3 4 4 4 4 5','3 3 3 4 4 4 5 5 5 6 6 6 7 7 7 8','3 3 3 3 4 4 4 4']) assert.equal(E.classify(cards(text)),null,text);
  for (const hand of [[],[0,0],[-1],[54],[1.5],['0'],null]) assert.equal(E.classify(hand),null);
});
test('comparisons enforce size, body rank and bomb/rocket precedence', () => {
  const beats = (a,b) => E.beats(E.classify(cards(a)),E.classify(cards(b)));
  assert.ok(beats('4 4 4 3','3 3 3 BJ'));
  assert.ok(!beats('4 4','3'));
  assert.ok(!beats('4 5 6 7 8 9','3 4 5 6 7'));
  assert.ok(beats('3 3 3 3','2'));
  assert.ok(!beats('2','3 3 3 3'));
  assert.ok(beats('4 4 4 4','3 3 3 3'));
  assert.ok(beats('SJ BJ','2 2 2 2'));
  assert.ok(!beats('2 2 2 2','SJ BJ'));
  assert.ok(!beats('SJ BJ','SJ BJ'));
});
test('bidding validates turn and increasing bids, 3 ends early, all-pass redeal', () => {
  const s = E.newGame(123,0), original = JSON.stringify(s);
  assert.equal(E.bid(s,1,1),false); assert.equal(E.bid(s,0,4),false); assert.equal(JSON.stringify(s),original);
  assert.ok(E.bid(s,0,1)); assert.equal(E.bid(s,1,1),false);
  assert.ok(E.bid(s,1,0)); assert.ok(E.bid(s,2,2));
  assert.equal(s.landlord,2); assert.equal(s.turn,2); assert.equal(s.hands[2].length,20); conserved(s);
  const early = E.newGame(3,0); assert.ok(E.bid(early,0,3)); assert.equal(early.phase,'playing'); assert.equal(early.bidCount,1);
  const pass = E.newGame(4,0); [0,1,2].forEach(p => assert.ok(E.bid(pass,p,0))); assert.equal(pass.phase,'redeal');
});
test('illegal plays are transactional and two passes return leadership', () => {
  const s = E.newGame(9,0); E.bid(s,0,3);
  const original = JSON.stringify(s);
  assert.equal(E.play(s,0,[]),false); assert.equal(E.play(s,1,[s.hands[1][0]]),false);
  assert.equal(E.play(s,0,[s.hands[1][0]]),false); assert.equal(JSON.stringify(s),original);
  assert.ok(E.play(s,0,[s.hands[0].at(-1)]));
  assert.ok(E.play(s,1,[])); assert.ok(E.play(s,2,[]));
  assert.equal(s.turn,0); assert.equal(s.trick,null); assert.equal(s.passes,0); conserved(s);
});
test('spring, counter-spring, bombs, ordinary team victory and zero-sum scoring', () => {
  const finish = (landlordHand, farmerHand, counts, player, bid=1) => {
    const s=E.newGame(1,0); E.bid(s,0,bid); if (s.phase==='bidding') {E.bid(s,1,0);E.bid(s,2,0);}
    s.hands=[cards(landlordHand),cards(farmerHand),cards('Q')]; s.playCounts=counts; s.turn=player;
    assert.ok(E.play(s,player,s.hands[player].slice())); assert.equal(s.phase,'finished'); assert.equal(s.scores.reduce((a,b)=>a+b),0); return s;
  };
  let s=finish('3','4',[0,0,0],0); assert.ok(s.spring); assert.deepEqual(s.scores,[4,-2,-2]);
  s=finish('3','4',[1,0,0],1); assert.ok(s.spring); assert.deepEqual(s.scores,[-4,2,2]);
  s=finish('3','4',[2,1,0],1,2); assert.equal(s.spring,false); assert.deepEqual(s.scores,[-4,2,2]);
  s=finish('3 3 3 3','4',[0,0,0],0,3); assert.equal(s.bombs,1); assert.deepEqual(s.scores,[24,-12,-12]);
  s=finish('SJ BJ','4',[0,1,0],0); assert.equal(s.bombs,1); assert.equal(s.spring,false); assert.deepEqual(s.scores,[4,-2,-2]);
});
test('move generator agrees with exhaustive subsets including airplane and four-card wings', () => {
  for (const text of ['3 3 3 4 4 4 5 5 6 6 SJ BJ','3 3 3 3 4 4 5 5 6 7 8 9','3 4 5 6 7 8 9 10 J Q K A']) {
    const hand=cards(text), expected=new Set();
    for (let mask=1;mask<2**hand.length;mask++) { const subset=hand.filter((_,i)=>mask & (1<<i)); if(E.classify(subset)) expected.add(signature(subset)); }
    assert.deepEqual(new Set(E.moves(hand).map(m=>signature(m.cards))),expected);
    const prev=E.classify(cards('3 3'));
    for(const m of E.moves(hand,prev)) assert.ok(E.beats(m,prev));
  }
});
test('AI lets its farmer partner lead, but goes out when possible', () => {
  const s=E.newGame(1,0); E.bid(s,0,3); s.turn=1;
  s.trick={...E.classify(cards('3')),player:2,cards:cards('3')}; s.hands[1]=cards('4 5');
  assert.deepEqual(E.chooseMove(s),[]);
  s.hands[1]=cards('4'); assert.deepEqual(E.chooseMove(s),cards('4'));
});
test('120 complete seeded AI rounds stay legal, conserve cards and replay exactly', () => {
  for (let seed=1;seed<=120;seed++) {
    const s=E.newGame(seed*7919); let steps=0;
    while(s.phase==='bidding') { assert.ok(E.bid(s,s.turn,E.suggestBid(s.hands[s.turn],s.highBid))); conserved(s); }
    while(s.phase==='playing' && steps++<300) { const move=E.chooseMove(s); assert.ok(E.play(s,s.turn,move),`seed ${seed}`); conserved(s); }
    assert.ok(['finished','redeal'].includes(s.phase),`stalled ${seed}`);
    if(s.scores) assert.equal(s.scores.reduce((a,b)=>a+b),0);
    assert.deepEqual(E.restore({version:1,seed:s.seed,first:s.first,history:s.history}),s);
  }
});
test('invalid saves cannot inject ownership, turns, duplicate cards or missing seeds', () => {
  const s=E.newGame(42,0); E.bid(s,0,3); E.play(s,0,[s.hands[0][0]]);
  const saved={version:1,seed:42,first:0,history:s.history}; assert.deepEqual(E.restore(saved),s);
  assert.equal(E.restore({...saved,history:[...s.history,{kind:'play',player:0,cards:[0]}]}),null);
  assert.equal(E.restore({...saved,history:[{kind:'bid',player:0,value:4}]}),null);
  assert.equal(E.restore({...saved,seed:undefined}),null);
  assert.equal(E.restore({...saved,first:4}),null);
  assert.equal(E.restore({...saved,history:Array(501).fill({})}),null);
});
test('eight complete dictionaries, matching variables, bindings and lobby registration', () => {
  let messages; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(scope,value)=>{assert.equal(scope,'ddz');messages=value;}}});
  assert.equal(Object.keys(messages).length,8);
  const keys=Object.keys(messages.en).sort();
  const vars=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const [lang,dict] of Object.entries(messages)) { assert.deepEqual(Object.keys(dict).sort(),keys,lang); for(const key of keys) assert.deepEqual(vars(dict[key]),vars(messages.en[key]),`${lang}.${key}`); }
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const [,key] of html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g)) if(!key.startsWith('common.')) assert.ok(keys.includes(key),key);
  for(const [,file] of html.matchAll(/(?:src|href)="([^"]+)"/g)) if(!file.startsWith('#')) assert.ok(fs.existsSync(path.resolve(__dirname,file)),file);
  const context={window:{}}; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(g=>g.path==='./games/doudizhu/index.html'); assert.equal(entries.length,1); assert.equal(entries[0].category,'棋牌'); assert.equal(Object.keys(entries[0].locales).length,7);
});
