'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const E = require('./engine.js');
const cards = (...ranks) => { const used = {}; return ranks.map(rank => ({id:`${rank}-${used[rank] || 0}`,rank,suit:used[rank] = (used[rank] || 0) + 1})); };
const type = (...ranks) => E.classify(cards(...ranks))?.type;
test('supported combinations, boundaries, and bomb hierarchy', () => {
  assert.equal(type(3),'single'); assert.equal(type(5,5),'pair'); assert.equal(type(7,7,7),'triple');
  assert.equal(type(4,4,4,8),'tripleSingle'); assert.equal(type(4,4,4,8,8),'triplePair');
  assert.equal(type(10,11,12,13,14),'straight'); assert.equal(type(3,3,4,4,5,5),'pairRun');
  assert.equal(type(3,3,3,4,4,4),'plane'); assert.equal(type(8,8,8,8),'bomb'); assert.equal(type(16,17),'rocket');
  for (const invalid of [[3,4,5,6],[11,12,13,14,15],[14,14,15,15,16,16],[3,3,4,4],[3,3,3,4,4,4,6,7],[3,3,3,3,5,6],[3,4,6,7,8]]) assert.equal(type(...invalid),undefined);
  assert.equal(E.classify([cards(3)[0],cards(3)[0]]),null);
  const shape = (...r) => E.classify(cards(...r));
  assert(E.beats(shape(4),shape(3))); assert(!E.beats(shape(4,4),shape(3)));
  assert(E.beats(shape(3,3,3,3),shape(17))); assert(!E.beats(shape(17),shape(3,3,3,3)));
  assert(E.beats(shape(16,17),shape(15,15,15,15))); assert(!E.beats(shape(15,15,15,15),shape(16,17)));
  assert(!E.beats(shape(4,5,6,7,8,9),shape(3,4,5,6,7)));
});
test('opening restrictions and rejected actions do not mutate the game', () => {
  const state = E.create(() => .4), snapshot = JSON.stringify(state);
  assert.equal(E.act(state,[]).error,'mustLead');
  assert.equal(E.act(state,['missing']).error,'invalid');
  assert.equal(E.act(state,['3-0','3-0']).error,'invalid');
  const other = state.hands[state.turn].find(c=>c.id!=='3-0');
  assert.equal(E.act(state,[other.id]).error,'opening');
  assert.equal(JSON.stringify(state),snapshot);
  assert(E.suggestions(state).every(m=>m.cards.some(c=>c.id==='3-0')));
});
function scenario(hands, turn = 0) { return {...E.create(),hands:hands.map(r=>cards(...r)),turn,opening:false}; }
test('passing resets the trick, including after its leader finishes', () => {
  const s = scenario([[14],[3,4],[5,6]]);
  E.act(s,[s.hands[0][0].id]); assert.deepEqual(s.finished,[0]);
  E.act(s,[]); assert.equal(s.turn,2); assert(s.target);
  E.act(s,[]); assert.equal(s.turn,1); assert.equal(s.target,null);
  assert.equal(E.act(s,[]).error,'mustLead');
  E.act(s,[s.hands[1][0].id]); E.act(s,[]); assert.equal(s.turn,1); assert.equal(s.target,null);
  E.act(s,[s.hands[1][0].id]); assert(s.over); assert.deepEqual(s.finished,[0,1,2]);
  const normal = scenario([[8,9],[3,4],[5,6]]);
  E.act(normal,[normal.hands[0][0].id]); E.act(normal,[]); E.act(normal,[]);
  assert.equal(normal.turn,0); assert.equal(normal.target,null);
});
test('a player can rejoin after passing if another player raises', () => {
  const s = scenario([[3,10],[4,11],[5,12]]);
  E.act(s,[s.hands[0][0].id]); E.act(s,[]); E.act(s,[s.hands[2][0].id]);
  E.act(s,[]); assert.equal(s.turn,1); assert.equal(E.legal(s,[s.hands[1][1].id]),null);
});
test('250 seeded complete games conserve cards and terminate with three unique places', () => {
  let seed=12345;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let game=0;game<250;game++) {
    const s=E.create(random); let turns=0;
    assert.deepEqual(s.hands.map(h=>h.length),[18,18,18]);
    while(!s.over && turns++<500) {
      const moves=E.suggestions(s);
      const move = game % 3 === 0 && s.target && random()<.2 ? null : moves[game % 3 === 1 ? Math.floor(random()*moves.length) : 0];
      const ids=move?.cards.map(c=>c.id)||[];
      assert.equal(E.legal(s,ids),null);
      assert(E.act(s,ids).ok);
      const all=[...s.hands.flat(),...s.played];
      assert.equal(all.length,54); assert.equal(new Set(all.map(c=>c.id)).size,54);
      if(!s.over) assert(s.hands[s.turn].length>0);
    }
    assert(s.over,`game ${game} stalled`); assert.equal(new Set(s.finished).size,3);
    assert.equal(s.hands[s.finished[0]].length,0); assert.equal(s.hands[s.finished[1]].length,0);
  }
});
