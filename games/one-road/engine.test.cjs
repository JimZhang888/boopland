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
  for (const [extra,stars] of [[0,3],[1,2],[2,2],[3,1]]) {
    state.path=Array(state.level.target+extra+1).fill([0,0]); assert.equal(E.stars(state),stars);
  }
});

test('all twelve maps award every rating on real routes and their targets are optimal', () => {
  for (const level of E.levels) {
    const index = ([x,y]) => y * level.size + x;
    const blocked = new Set(level.obstacles.map(o => index(o.position)));
    const homes = new Set(level.houses.map(index));
    const finish = index(level.finish), start = index(level.start);
    const adjacent = Array.from({length:level.size ** 2}, (_, cell) => {
      const x = cell % level.size, y = Math.floor(cell / level.size);
      return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]
        .filter(point => point.every(v => v >= 0 && v < level.size))
        .map(index).filter(neighbor => !blocked.has(neighbor));
    });
    const used = new Set([start]), path = [start], routes = new Map();
    function visit(cell, houses) {
      if (cell === finish) {
        if (houses === homes.size && !routes.has(path.length - 1)) routes.set(path.length - 1, [...path]);
        return;
      }
      for (const next of adjacent[cell]) {
        if (used.has(next)) continue;
        used.add(next); path.push(next);
        visit(next, houses + Number(homes.has(next)));
        path.pop(); used.delete(next);
      }
    }
    visit(start, 0);
    assert.equal(Math.min(...routes.keys()), level.target, 'target on map ' + level.id);
    const ratings = new Set();
    for (const route of routes.values()) {
      const state = E.create(level);
      for (const cell of route.slice(1)) E.move(state, [cell % level.size, Math.floor(cell / level.size)]);
      assert.ok(state.won);
      ratings.add(E.stars(state));
    }
    assert.deepEqual(ratings, new Set([1,2,3]), 'ratings on map ' + level.id);
  }
});
