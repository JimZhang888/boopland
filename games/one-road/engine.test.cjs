const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');

test('all twelve reference routes are valid, obstacle-free and earn three stars', () => {
  assert.equal(E.levels.length, 12);
  for (const level of E.levels) {
    assert.equal(new Set(level.solution.map(E.key)).size, level.solution.length, `Repeated node in ${level.id}`);
    assert.equal(new Set(level.houses.map(E.key)).size, level.houses.length);
    assert(!level.houses.some(p => E.same(p,level.start)||E.same(p,level.finish)));
    const state = E.create(level);
    for (const point of level.solution.slice(1)) assert(E.move(state,point).changed, `Invalid route in level ${level.id} at ${point}`);
    assert(state.won); assert.equal(E.connected(state),level.houses.length); assert.equal(E.stars(state),3);
    assert.equal(E.move(state,[0,0]).reason,'done');
  }
});
test('obstacles, diagonal moves, out-of-bounds and early finish leave the road unchanged', () => {
  const level = {size:4,start:[0,0],finish:[1,0],houses:[[3,3]],obstacles:[{position:[0,1],type:'rock'}],target:8};
  const state=E.create(level);
  for (const [p,reason] of [[[0,1],'obstacle'],[[1,0],'missing'],[[1,1],'adjacent'],[[-1,0],'outside']]) {
    assert.equal(E.move(state,p).reason,reason); assert.deepEqual(state.path,[[0,0]]);
  }
});
test('crossing an earlier point is blocked, retracing erases only the last segment', () => {
  const state=E.create({size:4,start:[0,0],finish:[3,3],houses:[[3,2]],obstacles:[],target:10});
  [[1,0],[1,1],[0,1]].forEach(p=>E.move(state,p));
  assert.equal(E.move(state,[0,0]).reason,'crossing'); assert.equal(state.path.length,4);
  assert.equal(E.move(state,[1,1]).reason,'undo'); assert.equal(state.path.length,3);
  assert(E.undo(state)); assert.deepEqual(state.path,[[0,0],[1,0]]);
});
test('undo updates connected homes and can reopen a won level', () => {
  const state=E.create(E.levels[0]);
  for(const p of state.level.solution.slice(1,4)) E.move(state,p);
  assert.equal(E.connected(state),1); E.undo(state); assert.equal(E.connected(state),0);
  for(const p of state.level.solution.slice(3)) E.move(state,p);
  assert(state.won); E.undo(state); assert(!state.won); assert.equal(E.stars(state),0);
  E.move(state,state.level.finish); assert(state.won);
});
test('star thresholds reward target-length paths without rejecting longer solutions', () => {
  const state=E.create(E.levels[0]); state.won=true;
  for (const [extra,stars] of [[0,3],[1,2],[4,2],[5,1]]) {
    state.path=Array(state.level.target+extra+1).fill([0,0]); assert.equal(E.stars(state),stars);
  }
});
