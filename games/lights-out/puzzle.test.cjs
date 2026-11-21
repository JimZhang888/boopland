// From this directory: node --test puzzle.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const { press, count, solve, generate } = require('./puzzle.js');

function replay(board, size, moves) {
  return moves.reduce((current, index) => press(current, size, index), board);
}

test('each press changes exactly the cells within one orthogonal step', () => {
  for (const size of [3, 4, 5]) {
    for (let i = 0; i < size * size; i++) {
      const changed = press(0, size, i);
      for (let j = 0; j < size * size; j++) {
        const dx = Math.abs((i % size) - (j % size));
        const dy = Math.abs(Math.floor(i / size) - Math.floor(j / size));
        assert.equal(Boolean(changed & (1 << j)), dx + dy <= 1);
      }
      assert.equal(press(changed, size, i), 0);
    }
    assert.equal(count(press(0, size, 0)), 3);
    assert.equal(count(press(0, size, 1)), 4);
    assert.equal(count(press(0, size, size + 1)), 5);
  }
});

test('all reachable 3×3 and 4×4 states agree with independent breadth-first distances', () => {
  for (const size of [3, 4]) {
    const states = [0];
    const distance = new Map([[0, 0]]);
    for (let i = 0; i < states.length; i++) {
      const board = states[i];
      const solution = solve(board, size);
      assert.equal(solution.length, distance.get(board));
      assert.equal(replay(board, size, solution), 0);
      for (let cell = 0; cell < size * size; cell++) {
        const next = press(board, size, cell);
        if (distance.has(next)) continue;
        distance.set(next, distance.get(board) + 1);
        states.push(next);
      }
    }
    assert.equal(states.length, size === 3 ? 512 : 4096);
  }
});

test('generated signs are distinct from the last sign and solvable after arbitrary moves', () => {
  let seed = 74;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (const size of [3, 4, 5]) {
    let previous = 0;
    for (let i = 0; i < 300; i++) {
      // Also exercise the bounded fallback with repeated identical random values.
      const board = generate(size, previous, i < 296 ? random : () => 0);
      assert.notEqual(board, 0);
      assert.notEqual(board, previous);
      const solution = solve(board, size);
      assert.ok(solution.length >= ({ 3: 3, 4: 4, 5: 7 })[size]);
      assert.equal(replay(board, size, solution), 0);
      let current = press(board, size, Math.floor(random() * size * size));
      const remaining = solve(current, size).length;
      for (let step = 0; step < remaining; step++) {
        const [next] = solve(current, size);
        current = press(current, size, next);
      }
      assert.equal(current, 0);
      previous = board;
    }
  }
});
