'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const card = (rank, suit = 0, faceUp = true) => ({ id: rank + suit * 13, rank, suit, faceUp });
const fixture = () => ({ difficulty: 4, seed: 1, columns: Array.from({ length: 10 }, () => []), stock: [], completed: [], moves: 0 });
const run = (from = 13, to = 1, suit = 0) => Array.from({ length: from - to + 1 }, (_, i) => card(from - i, suit));

test('all difficulties deal exactly 104 unique cards, 54 on the table and 50 in stock', () => {
  for (const difficulty of [1, 2, 4]) {
    const state = E.newGame(difficulty, 42);
    assert.deepEqual(state.columns.map(c => c.length), [6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    const all = [...state.columns.flat(), ...state.stock];
    assert.equal(new Set(all.map(c => c.id)).size, 104);
    assert.equal(all.filter(c => c.faceUp).length, 10);
    assert.equal(new Set(all.map(c => c.suit)).size, difficulty);
    for (let suit = 0; suit < difficulty; suit++) for (let rank = 1; rank <= 13; rank++) assert.equal(all.filter(c => c.suit === suit && c.rank === rank).length, 8 / difficulty);
    assert.deepEqual(state, E.newGame(difficulty, 42));
    assert.notDeepEqual(state, E.newGame(difficulty, 43));
  }
});

test('only descending same-suit tails move; destinations may have a different suit', () => {
  const state = fixture();
  state.columns[0] = [card(10, 0, false), card(8), card(7)];
  state.columns[1] = [card(9, 1)];
  assert.equal(E.canMove(state, 0, 0, 1), false);
  assert.equal(E.canMove(state, 0, 1, 1), true);
  const next = E.move(state, 0, 1, 1);
  assert.equal(next.columns[0][0].faceUp, true);
  assert.equal(state.columns[0][0].faceUp, false);
  assert.equal(next.columns[1].length, 3);
  assert.equal(E.isRun(next.columns[1], 0), false);
  assert.equal(E.isRun(next.columns[1], 1), true);
  assert.equal(E.canMove(next, 1, 0, 2), false);
  assert.equal(E.canMove(next, 1, 1, 2), true);
  assert.equal(E.canMove(next, 1, 2, 1), false);
  assert.equal(E.canMove(next, -1, 0, 2), false);
  assert.equal(E.canMove(next, 1, 1.5, 2), false);
});

test('a completed K–A suit is collected atomically and uncovers the preceding card', () => {
  const state = fixture();
  state.columns[0] = [card(6, 3, false), ...run(13, 2, 1)];
  state.columns[1] = [card(1, 1)];
  const next = E.move(state, 1, 0, 0);
  assert.deepEqual(next.completed, [1]);
  assert.deepEqual(next.columns[0], [card(6, 3)]);
  assert.equal(next.moves, 1);
  assert.equal(E.score(next), 599);
  assert.equal(state.columns[0].length, 13);
});

test('mixed suits do not collect, and adjacent completed runs resolve in one action', () => {
  const mixed = fixture();
  mixed.columns[0] = run(13, 2); mixed.columns[1] = [card(1, 1)];
  assert.equal(E.move(mixed, 1, 0, 0).completed.length, 0);
  const cascade = fixture();
  cascade.columns[0] = [...run(13, 1, 1), ...run(13, 2)];
  cascade.columns[1] = [card(1)];
  assert.deepEqual(E.move(cascade, 1, 0, 0).completed, [0, 1]);
});

test('dealing requires ten occupied columns and deals one face-up card to each', () => {
  const state = E.newGame(2, 55), snapshot = JSON.stringify(state);
  const next = E.deal(state);
  assert.equal(next.stock.length, 40);
  assert.deepEqual(next.columns.map(c => c.length), [7, 7, 7, 7, 6, 6, 6, 6, 6, 6]);
  assert.ok(next.columns.every(c => c.at(-1).faceUp));
  assert.equal(JSON.stringify(state), snapshot);
  const empty = E.clone(state); empty.columns[2] = [];
  assert.equal(E.deal(empty), null);
  let exhausted = state;
  for (let i = 0; i < 5; i++) exhausted = E.deal(exhausted);
  assert.equal(exhausted.stock.length, 0);
  assert.equal(E.deal(exhausted), null);
});

test('the eighth collection wins and prevents further play', () => {
  const state = fixture(); state.completed = Array(7).fill(0);
  state.columns[0] = run(13, 2); state.columns[1] = [card(1)];
  const next = E.move(state, 1, 0, 0);
  assert.equal(E.won(next), true);
  assert.equal(E.canDeal(next), false);
  assert.equal(E.move(next, 0, 0, 1), null);
  assert.equal(E.score(next), 1299);
});

test('legal action replay restores moves and all undo snapshots; corrupt saves are rejected', () => {
  const initial = E.newGame(1, 99);
  const action = E.hints(initial)[0];
  const first = E.apply(initial, action);
  const state = E.deal(first);
  const saved = { version: 1, difficulty: 1, seed: 99, actions: [action, { type: 'deal' }], elapsed: 4500 };
  const restored = E.restore(saved);
  assert.deepEqual(restored.state, state);
  assert.deepEqual(restored.history, [initial, first]);
  assert.equal(restored.elapsed, 4500);
  assert.equal(E.restore({ ...saved, difficulty: 3 }), null);
  assert.equal(E.restore({ ...saved, actions: [{ type: 'move', from: 99, start: 0, to: 0 }] }), null);
  assert.equal(E.restore({ ...saved, actions: [{ type: 'cheat' }] }), null);
});

test('legal hints and deals conserve every card across many generated games', () => {
  for (const difficulty of [1, 2, 4]) for (let seed = 1; seed <= 20; seed++) {
    let state = E.newGame(difficulty, seed);
    for (let step = 0; step < 60; step++) {
      const possible = E.hints(state);
      let next = step % 7 === 0 && E.canDeal(state) ? E.deal(state) : possible.length ? E.apply(state, possible[step % possible.length]) : E.deal(state);
      if (!next) break;
      const remaining = [...next.columns.flat(), ...next.stock];
      assert.equal(remaining.length + next.completed.length * 13, 104);
      assert.equal(new Set(remaining.map(c => c.id)).size, remaining.length);
      assert.ok(next.columns.every(c => !c.length || c.at(-1).faceUp));
      assert.equal(next.moves, state.moves + 1);
      state = next;
    }
  }
});
