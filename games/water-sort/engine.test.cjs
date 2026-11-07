const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const levels = require('./levels.js');
const counts = board => board.flat().sort((a, b) => a - b);

test('a pour transfers the entire top run, stops at capacity and does not mutate input', () => {
  const input = [[0, 1, 1, 1], [2, 1, 1], []];
  const before = E.clone(input);
  const result = E.pour(input, 0, 1);
  assert.deepEqual(result.board, [[0, 1, 1], [2, 1, 1, 1], []]);
  assert.equal(result.move.amount, 1);
  assert.deepEqual(input, before);
  assert.deepEqual(E.pour([[2, 1, 1], []], 0, 1).board, [[2], [1, 1]]);
});

test('different colors, full targets, empty sources and invalid positions cannot pour', () => {
  const board = [[0, 1], [0], [1, 1, 1, 1], []];
  for (const [a, b] of [[0, 1], [0, 2], [3, 0], [0, 0], [-1, 1], [0, 9], [0.5, 3]]) assert.equal(E.pour(board, a, b), null);
  assert.equal(E.inspect(board, 0, 1).reason, 'different');
  assert.equal(E.inspect(board, 0, 2).reason, 'full');
});

test('victory requires full, monochrome bottles; split colors do not count', () => {
  assert.equal(E.won([[0, 0], [0, 0], []]), false);
  assert.equal(E.won([[0, 1, 0, 1], []]), false);
  assert.equal(E.won([[], []]), false);
  assert.equal(E.won([[0, 0, 0, 0], [1, 1, 1, 1], []]), true);
});

test('all 24 initial puzzles preserve four units of each color and have executable solutions', () => {
  assert.equal(levels.length, 24);
  for (const [index, level] of levels.entries()) {
    const expected = Array.from({ length: level.colors * 4 }, (_, i) => Math.floor(i / 4));
    assert.equal(level.board.length, level.colors + 2);
    assert.deepEqual(counts(level.board), expected);
    assert.equal(E.won(level.board), false);
    let board = E.clone(level.board);
    for (const [from, to] of level.solution) {
      const result = E.pour(board, from, to);
      assert.ok(result, `level ${index + 1}: valid solution move`);
      board = result.board;
      assert.deepEqual(counts(board), expected);
      assert.ok(board.every(bottle => bottle.length <= 4));
    }
    assert.equal(E.won(board), true, `level ${index + 1}`);
  }
});

test('incremental hint search returns executable solutions for every level and intermediate positions', () => {
  for (const level of levels) {
    for (const prefix of [0, Math.floor(level.solution.length / 2)]) {
      const initial = E.replay(level.board, level.solution.slice(0, prefix));
      const solver = E.createSolver(initial);
      let result;
      do { result = solver.step(7); } while (result.status === 'searching');
      assert.equal(result.status, 'solved');
      assert.equal(E.won(E.replay(initial, result.solution)), true);
    }
  }
});

test('search distinguishes a dead end from its node limit and handles already solved input', () => {
  assert.equal(E.createSolver([[0, 1, 0, 1], [1, 0, 1, 0]]).step().status, 'unsolvable');
  assert.equal(E.createSolver(levels[23].board, 1).step().status, 'limit');
  assert.deepEqual(E.createSolver([[0, 0, 0, 0], []]).step().solution, []);
});

test('replay reconstructs saved games and undo without trusting malformed histories', () => {
  const level = levels[0], moves = level.solution;
  assert.deepEqual(E.replay(level.board, moves.slice(0, 2)), E.pour(E.pour(level.board, ...moves[0]).board, ...moves[1]).board);
  for (const history of [null, {}, [[-1, 0]], [['0', 3]], [[0, 0]], [[0, 1]], [[0, 3, 1]], Array(3001).fill([0, 3]), [...moves, [0, 1]]]) assert.equal(E.replay(level.board, history), null);
});

test('eight languages cover the same keys and placeholders, including HTML bindings', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register(scope, values) { assert.equal(scope, 'waterSort'); dictionaries = values; } } });
  assert.equal(Object.keys(dictionaries).length, 8);
  const keys = Object.keys(dictionaries.en).sort();
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const dictionary of Object.values(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    for (const key of keys) { assert.ok(dictionary[key]?.length, key); assert.deepEqual(placeholders(dictionary[key]), placeholders(dictionaries.en[key]), key); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g)) if (key !== 'common.back') assert.ok(keys.includes(key), key);
});

test('static entry resources, lobby registration and seven card translations are present', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, relative] of html.matchAll(/(?:src|href)="(\.[^"]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, relative)), relative);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(game => game.path === './games/water-sort/index.html');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].category, '益智');
  assert.equal(Object.keys(entries[0].locales).length, 7);
  assert.ok(fs.existsSync(path.resolve(__dirname, '../..', entries[0].cover)));
});
