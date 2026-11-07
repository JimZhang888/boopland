const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function solvable(tiles, size) {
  let inversions = 0;
  const values = tiles.filter(Boolean);
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) inversions++;
  const rowFromBottom = size - Math.floor(tiles.indexOf(0) / size);
  return size % 2 ? inversions % 2 === 0 : (inversions + rowFromBottom) % 2 === 1;
}
function fixture(size, tiles) {
  return { size, tiles: tiles.slice(), blank: tiles.indexOf(0), initial: tiles.slice(), history: [], moves: 0, won: false };
}

test('900 seeded shuffles preserve the puzzle parity and every tile, without solved starts', () => {
  for (const size of E.SIZES) for (let seed = 1; seed <= 300; seed++) {
    const state = E.create(size, seeded(seed));
    assert.deepEqual(state.tiles.slice().sort((a, b) => a - b), Array.from({ length: size * size }, (_, i) => i));
    assert.ok(solvable(state.tiles, size));
    assert.ok(!E.isSolved(state.tiles));
    assert.equal(state.tiles[state.blank], 0);
    assert.ok(E.distance(state.tiles, size) >= { 3: 8, 4: 22, 5: 42 }[size]);
  }
});
test('shuffle always terminates and remains solvable with constant or edge-case random sources', () => {
  for (const size of E.SIZES) for (const value of [0, .5, .9999, 1, NaN]) {
    const state = E.create(size, () => value);
    assert.ok(solvable(state.tiles, size)); assert.ok(!state.won); assert.ok(!E.isSolved(state.tiles));
  }
});
test('only orthogonal neighbors move, with no wrapping at row edges', () => {
  for (const size of E.SIZES) for (let blank = 0; blank < size * size; blank++) {
    const tiles = E.solved(size); [tiles[blank], tiles[tiles.length - 1]] = [0, tiles[blank]];
    for (let candidate = -1; candidate <= size * size; candidate++) {
      const state = fixture(size, tiles);
      const valid = candidate >= 0 && candidate < size * size &&
        Math.abs(Math.floor(candidate / size) - Math.floor(blank / size)) + Math.abs(candidate % size - blank % size) === 1;
      assert.equal(E.move(state, candidate), valid);
      if (!valid) { assert.deepEqual(state.tiles, tiles); assert.equal(state.moves, 0); }
      else { assert.equal(state.blank, candidate); assert.equal(state.moves, 1); }
    }
  }
});
test('undo restores the previous board but counts the return slide as another move', () => {
  const state = E.create(4, seeded(9)), original = state.tiles.slice();
  E.move(state, E.neighbors(state.blank, 4)[0]);
  assert.ok(E.undo(state)); assert.deepEqual(state.tiles, original); assert.equal(state.moves, 2);
  assert.equal(state.history.length, 0); assert.equal(E.undo(state), false); assert.equal(state.moves, 2);
});
test('arrows move tiles in the indicated direction and never wrap', () => {
  const state = fixture(3, [1, 2, 3, 4, 0, 5, 6, 7, 8]);
  assert.equal(E.directionalIndex(state, 'up'), 7); assert.equal(E.directionalIndex(state, 'down'), 1);
  assert.equal(E.directionalIndex(state, 'left'), 5); assert.equal(E.directionalIndex(state, 'right'), 3);
  const corner = fixture(3, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(E.directionalIndex(corner, 'down'), -1); assert.equal(E.directionalIndex(corner, 'right'), -1);
});
test('restart restores exactly the original shuffle with fresh counters', () => {
  const state = E.create(5, seeded(12)), original = state.initial.slice();
  for (let i = 0; i < 12; i++) E.move(state, E.neighbors(state.blank, 5)[i % E.neighbors(state.blank, 5).length]);
  E.restart(state); assert.deepEqual(state.tiles, original); assert.equal(state.moves, 0);
  assert.equal(state.history.length, 0); assert.equal(state.won, false);
  state.tiles[0] = -99; assert.deepEqual(state.initial, original);
});
test('a solved board locks input and restart makes the same round playable again', () => {
  for (const size of E.SIZES) {
    const tiles = E.solved(size), last = tiles.length - 1;
    [tiles[last], tiles[last - 1]] = [tiles[last - 1], 0];
    const state = fixture(size, tiles);
    assert.ok(E.move(state, last)); assert.ok(state.won); assert.deepEqual(state.tiles, E.solved(size));
    assert.equal(E.move(state, last - 1), false); assert.equal(E.undo(state), false);
    E.restart(state); assert.equal(state.won, false); assert.equal(state.moves, 0);
    assert.ok(E.move(state, last)); assert.ok(state.won);
  }
});
test('invalid sizes and invalid move indices cannot corrupt state', () => {
  for (const size of [0, 2, 6, '3', NaN]) assert.throws(() => E.create(size), RangeError);
  const state = E.create(), original = JSON.stringify(state);
  for (const index of [undefined, null, NaN, 2.5, '1', Infinity]) assert.equal(E.move(state, index), false);
  assert.equal(JSON.stringify(state), original);
});
