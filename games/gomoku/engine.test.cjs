const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('./engine.js');
const at = (r, c) => r * 15 + c;
const position = (black = [], white = []) => {
  const board = new Int8Array(225);
  black.forEach(([r, c]) => { board[at(r, c)] = 1; });
  white.forEach(([r, c]) => { board[at(r, c)] = 2; });
  return board;
};

test('legal alternating play, occupied positions, invalid input and game-over lock', () => {
  const g = E.createGame();
  for (const value of [-1, 225, 1.5, NaN]) assert.equal(E.play(g, value), false);
  for (let c = 0; c < 5; c++) {
    assert.equal(E.play(g, at(7, c)), true);
    assert.equal(E.play(g, at(7, c)), false);
    if (c < 4) E.play(g, at(8, c));
  }
  assert.equal(g.winner, 1);
  assert.equal(g.line.length, 5);
  assert.equal(E.play(g, 0), false);
});

test('five and overline win in all four directions; rows never wrap', () => {
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const board = new Int8Array(225);
    for (let n = 0; n < 6; n++) board[at(2 + dr * n, 7 + dc * n)] = 2;
    assert.equal(E.winningLine(board, at(2, 7)).length, 6);
  }
  const board = new Int8Array(225);
  [12, 13, 14, 15, 16].forEach(i => { board[i] = 1; });
  assert.equal(E.winningLine(board, 14).length, 0);
});

test('full board without a five is a draw', async () => {
  const g = E.createGame(), slots = [[], [], []];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) slots[(r + Math.floor(c / 2)) % 2 + 1].push(at(r, c));
  while (g.moves.length < 225) assert.equal(E.play(g, slots[g.turn].shift()), true);
  assert.equal(g.over, true);
  assert.equal(g.winner, 0);
  assert.equal(await E.chooseMove(g.board, 2, 'hard'), null);
});

test('undo restores a human turn during thinking, after reply, after win and as white', () => {
  const g = E.createGame();
  E.play(g, 112); E.undoTurn(g, 1);
  assert.equal(g.moves.length, 0);
  E.play(g, 112); E.play(g, 113); E.undoTurn(g, 1);
  assert.equal(g.moves.length, 0);
  E.play(g, 112); E.play(g, 113); E.play(g, 114); E.undoTurn(g, 2);
  assert.deepEqual(g.moves, [{ index: 112, player: 1 }]);
  assert.equal(g.turn, 2);
  assert.equal(E.undoTurn(g, 2), false);
  const win = E.createGame();
  for (let c = 0; c < 5; c++) { E.play(win, at(7, c)); if (c < 4) E.play(win, at(8, c)); }
  E.undoTurn(win, 1);
  assert.equal(win.over, false); assert.equal(win.winner, 0); assert.equal(win.turn, 1); assert.equal(win.moves.length, 8);
});

test('every level takes a winning move before defending', async () => {
  for (const level of ['easy', 'normal', 'hard']) {
    const board = position([[3, 2], [3, 3], [3, 4], [3, 5]], [[7, 2], [7, 3], [7, 4], [7, 5]]);
    const move = await E.chooseMove(board, 2, level);
    board[move] = 2;
    assert.ok(E.winningLine(board, move).length >= 5);
  }
});

test('normal and hard block single-ended and broken fours at board edges', async () => {
  for (const level of ['normal', 'hard']) {
    for (const stones of [[[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [0, 3], [0, 4]], [[1, 14], [2, 13], [3, 12], [4, 11]]]) {
      const board = position(stones, [[6, 10]]);
      const move = await E.chooseMove(board, 2, level);
      board[move] = 1;
      assert.ok(E.winningLine(board, move).length >= 5, `${level} must block a winning square`);
    }
  }
});

test('hard creates a forcing fork without mutating the caller board', async () => {
  const board = position([[1, 1], [1, 3], [3, 1], [3, 3]], [[7, 5], [7, 6], [7, 8], [5, 7], [6, 7], [8, 7]]);
  const copy = Array.from(board);
  assert.equal(await E.chooseMove(board, 2, 'hard', { budgetMs: 1500 }), at(7, 7));
  assert.deepEqual(Array.from(board), copy);
});

test('easy offers varied legal moves; all levels can open', async () => {
  const board = position([[7, 7]]), picks = new Set();
  for (const n of [.01, .2, .4, .7, .99]) {
    const move = await E.chooseMove(board, 2, 'easy', { random: () => n });
    assert.equal(board[move], 0); picks.add(move);
  }
  assert.ok(picks.size > 2);
  for (const level of ['easy', 'normal', 'hard']) assert.equal(await E.chooseMove(new Int8Array(225), 1, level), 112);
});

test('hard search yields for UI, supports cancellation and respects a short budget', async () => {
  const board = position([[7, 7], [8, 8], [6, 9]], [[8, 7], [7, 8], [9, 8]]);
  const abort = new AbortController();
  setTimeout(() => abort.abort(), 5);
  assert.equal(await E.chooseMove(board, 1, 'hard', { signal: abort.signal, budgetMs: 1500 }), null);
  const start = performance.now();
  const move = await E.chooseMove(board, 1, 'hard', { budgetMs: 30 });
  assert.equal(board[move], 0);
  assert.ok(performance.now() - start < 300);
});

test('eight complete dictionaries and the lobby entry cover every bound UI key', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(`${__dirname}/translations.js`, 'utf8'), { BooplandI18n: { register: (_, value) => { dictionaries = value; } } });
  assert.equal(Object.keys(dictionaries).length, 8);
  const keys = Object.keys(dictionaries.en).sort();
  for (const dict of Object.values(dictionaries)) {
    assert.deepEqual(Object.keys(dict).sort(), keys);
    for (const key of keys) {
      assert.ok(dict[key].length);
      assert.deepEqual([...dict[key].matchAll(/\{\w+\}/g)].map(x => x[0]).sort(), [...dictionaries.en[key].matchAll(/\{\w+\}/g)].map(x => x[0]).sort());
    }
  }
  const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) if (!key.startsWith('common.')) assert.ok(keys.includes(key), key);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../../gamelist.js`, 'utf8'), context);
  const games = context.window.GAME_LIST.filter(game => game.path === './games/gomoku/index.html');
  assert.equal(games.length, 1); assert.equal(Object.keys(games[0].locales).length, 7);
  for (const [, path] of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(`${__dirname}/${path}`), path);
});
