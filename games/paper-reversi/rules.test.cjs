const test = require('node:test');
const assert = require('node:assert/strict');
const { BLACK, WHITE, captures, opening, resolveTurn, play, count, chooseMove } = require('./rules');

const boardFrom = rows => Int8Array.from(rows.join(''), token => ({ B: BLACK, W: WHITE, '.': 0 })[token]);

test('standard opening, illegal click and edge boundaries', () => {
  const state = opening();
  assert.deepEqual(state.moves.map(m => m.square), [19, 26, 37, 44]);
  assert.equal(play(state, 0), state);
  assert.equal(play(state, 27), state);
  const edge = new Int8Array(64);
  edge[8] = WHITE;
  edge[9] = BLACK;
  assert.deepEqual(captures(edge, BLACK, 7), []);
  assert.deepEqual(count(play(state, 19).board), { black: 4, white: 1 });
  assert.deepEqual(count(state.board), { black: 2, white: 2 });
});

test('one move flips all eight rays, including two discs on each ray', () => {
  const board = new Int8Array(64);
  for (const step of [-9, -8, -7, -1, 1, 7, 8, 9]) {
    board[27 + step] = board[27 + 2 * step] = WHITE;
    board[27 + 3 * step] = BLACK;
  }
  const state = resolveTurn(board, BLACK);
  assert.equal(captures(board, BLACK, 27).length, 16);
  const next = play(state, 27);
  assert.deepEqual(count(next.board), { black: 25, white: 0 });
  assert.equal(next.turn, 0);
});

test('when black must pass, white keeps the turn with exactly two options', () => {
  const board = boardFrom(['WWWWWWWW','WBBBBBBB','WWBBWWBB','WWBWBWB.','WWWBBWBB','WWBWBWBW','WBBBWBBB','W.BBBBB.']);
  const next = play(resolveTurn(board, WHITE), 31);
  assert.equal(next.passed, BLACK);
  assert.equal(next.turn, WHITE);
  assert.deepEqual(next.moves.map(m => m.square), [57, 63]);
});

test('when white must pass, black can immediately place the final disc', () => {
  const board = boardFrom(['BBWWWWW.','WWWWWWWW','WBWWWBWW','WBWBBWBW','WWBBBBBB','WWBWBWBW','WWWBBBWW','.WWWBWWW']);
  const next = play(resolveTurn(board, BLACK), 7);
  assert.equal(next.passed, WHITE);
  assert.equal(next.turn, BLACK);
  assert.deepEqual(next.moves.map(m => m.square), [56]);
  assert.equal(play(next, 56).turn, 0);
});

test('two blocked sides end the game with one empty square and both colours present', () => {
  const board = boardFrom(['.BBBBBBB','WBBWWWWW','WBBBWBBB','WBWWBWBB','WBWWWWBB','WBWWWWBB','WWWWWW.B','WBBBBBBB']);
  const next = play(resolveTurn(board, BLACK), 54);
  assert.equal(next.board[0], 0);
  assert.equal(next.turn, 0);
  assert.equal(chooseMove(next, 'advanced'), null);
  assert.deepEqual(count(next.board), { black: 37, white: 26 });
});

test('beginner samples legal moves; advanced claims the available corner', () => {
  const openingState = opening();
  for (const [i, move] of openingState.moves.entries()) {
    assert.equal(chooseMove(openingState, 'easy', () => (i + 0.5) / 4), move.square);
  }
  const board = boardFrom(['WBB.WWW.','.BB.WBB.','WBBWB...','B.WBWWW.','.WBWWW..','WBWWWWW.','B.WW..W.','..WWW.WB']);
  const state = resolveTurn(board, WHITE);
  assert.ok(state.moves.length > 1);
  assert.ok([0, 7, 56, 63].includes(chooseMove(state, 'advanced', () => 0)));
});

test('advanced avoids H7 beside the unclaimed H8 corner despite the same capture', () => {
  const board = boardFrom(['........','......B.','.B.B.BB.','..BWBW..','...BWWW.','.....WB.','........','........']);
  const state = resolveTurn(board, WHITE);
  const chosen = chooseMove(state, 'advanced', () => 0);
  assert.equal(board[63], 0);
  assert.equal(captures(board, WHITE, 55).length, 1);
  assert.equal(captures(board, WHITE, chosen).length, 1);
  assert.ok(![54, 55, 62].includes(chosen));
});

test('advanced limits the reply when D2 and F4 both flip one disc', () => {
  const board = boardFrom(['........','........','..WB....','...WB...','...BB...','....B...','........','........']);
  const state = resolveTurn(board, WHITE);
  assert.equal(captures(board, WHITE, 11).length, 1);
  assert.equal(captures(board, WHITE, 29).length, 1);
  assert.equal(play(state, 11).moves.length, 4);
  assert.equal(play(state, 29).moves.length, 6);
  assert.equal(chooseMove(state, 'advanced', () => 0), 11);
});

test('twenty seeded complete games advance one empty square per move and terminate', () => {
  let seed = 41;
  const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let game = 0; game < 20; game++) {
    let state = opening(), occupied = 4;
    while (state.turn) {
      const square = chooseMove(state, state.turn === WHITE ? 'advanced' : 'easy', random);
      assert.ok(state.moves.some(move => move.square === square));
      state = play(state, square);
      const { black, white } = count(state.board);
      assert.equal(black + white, ++occupied);
      assert.ok(occupied <= 64);
    }
    assert.equal(resolveTurn(state.board, BLACK).turn, 0);
    assert.equal(resolveTurn(state.board, WHITE).turn, 0);
  }
});
