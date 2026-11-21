// Run with: node games/pencil-sudoku/verify.cjs
'use strict';
const assert = require('node:assert/strict');
const { puzzles, newGame, edit, inspect, undo } = require('./sudoku.js');

// Independent of the game's unit tables and completion check. Stop after two solutions.
function solve(givens) {
  const n = Math.sqrt(givens.length), side = Math.sqrt(n), full = (1 << n) - 1;
  const rows = Array(n).fill(0), cols = rows.slice(), boxes = rows.slice();
  const cells = givens.slice(), solutions = [];
  const boxAt = (r, c) => Math.floor(r / side) * side + Math.floor(c / side);
  function flip(i, bit) {
    const r = Math.floor(i / n), c = i % n;
    rows[r] ^= bit; cols[c] ^= bit; boxes[boxAt(r, c)] ^= bit;
  }
  function options(i) {
    const r = Math.floor(i / n), c = i % n;
    return full & ~(rows[r] | cols[c] | boxes[boxAt(r, c)]);
  }
  for (const [i, v] of cells.entries()) {
    assert(Number.isInteger(v) && v >= 0 && v <= n);
    if (!v) continue;
    const bit = 1 << (v - 1);
    if (!(options(i) & bit)) return [];
    flip(i, bit);
  }
  function visit() {
    let best = -1, smallest = n + 1, mask = 0;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]) continue;
      const allowed = options(i);
      if (!allowed) return;
      let count = 0;
      for (let k = allowed; k; k &= k - 1) count++;
      if (count < smallest) { best = i; smallest = count; mask = allowed; }
    }
    if (best < 0) { solutions.push(cells.slice()); return; }
    for (let k = mask; k && solutions.length < 2; k &= k - 1) {
      const bit = k & -k;
      cells[best] = Math.log2(bit) + 1;
      flip(best, bit);
      visit();
      flip(best, bit);
      cells[best] = 0;
    }
  }
  visit();
  return solutions;
}

function verify() {
  assert.equal(solve(Array(16).fill(0)).length, 2);
  assert.equal(solve([1, 1, ...Array(14).fill(0)]).length, 0);
  assert.equal(new Set(puzzles.map(p => p.id)).size, puzzles.length);
  for (const puzzle of puzzles) {
    const solutions = solve(puzzle.givens);
    assert.equal(solutions.length, 1, puzzle.id);
    const game = newGame(puzzle), answer = solutions[0], blanks = [];
    for (const [i, given] of puzzle.givens.entries()) {
      if (!given) { blanks.push(i); continue; }
      for (const operation of [[0,false],[given % puzzle.size + 1,false],[given,true]]) {
        assert.equal(edit(game,i,...operation),false);
      }
      assert.equal(game.values[i],given);
    }
    for (const i of blanks) edit(game, i, answer[i], true);
    assert.equal(inspect(game).empty, blanks.length);
    assert.equal(inspect(game).solved, false);
    const last = blanks.pop();
    for (const i of blanks) edit(game, i, answer[i]);
    const oldNote = game.notes[last];
    edit(game, last, 0);
    assert.equal(game.notes[last], 0);
    assert.equal(undo(game), last);
    assert.equal(game.notes[last], oldNote);
    edit(game, last, answer[last] % puzzle.size + 1);
    const invalid = inspect(game);
    assert.equal(invalid.empty, 0);
    assert(invalid.conflicts.has(last));
    assert.equal(invalid.solved, false);
    assert.equal(undo(game),last);
    edit(game, last, answer[last]);
    assert.deepEqual(game.values, answer);
    assert.equal(inspect(game).solved,true);
    console.log(puzzle.id + ': unique solution; givens, notes, erase, undo, conflicts and completion passed');
  }
  const game = newGame(puzzles[0]), index = game.values.indexOf(0);
  const peer = [...game.peers[index]].find(j => !game.values[j]);
  edit(game, peer, 2, true);
  edit(game, peer, 4, true);
  edit(game, index, 2);
  assert.equal(game.notes[peer], 1 << 4);
  undo(game);
  assert.equal(game.notes[peer], (1 << 2) | (1 << 4));
  edit(game, peer, 2, true);
  assert.equal(game.notes[peer],1 << 4);
  console.log('Peer-note cleanup, toggle and compound undo passed.');
}
if (require.main === module) verify();
module.exports = { solve };
