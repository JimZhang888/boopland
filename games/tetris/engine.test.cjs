// Run with: node --test games/tetris/engine.test.cjs (no dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8'), sandbox);
const { TetrisGame, TETRIS_SHAPES } = sandbox.window;
const fresh = () => { const game = new TetrisGame(() => .5); game.start(); return game; };
const piece = (type, x, y) => ({ type, x, y, matrix: TETRIS_SHAPES[type].map(row => [...row]) });

test('every bag contains the seven different pieces', () => {
  const game = fresh();
  const types = [game.active.type];
  for (let i = 0; i < 27; i++) { game.spawn(); types.push(game.active.type); }
  for (let i = 0; i < 28; i += 7) assert.equal(new Set(types.slice(i, i + 7)).size, 7);
});
test('walls, floor, stack collision, and hard-drop landing agree', () => {
  const game = fresh();
  game.active = piece('O', 0, 0);
  assert.equal(game.move(-1), false);
  game.board[18][0] = 'I';
  assert.equal(game.ghost().y, 16);
  game.hardDrop();
  assert.equal(game.board[16][0], 'O');
  assert.equal(game.board[17][1], 'O');
  assert.equal(game.score, 32);
});
test('clears one through four rows and applies the score table', () => {
  for (let count = 1; count <= 4; count++) {
    const game = fresh();
    for (let y = 20 - count; y < 20; y++) game.board[y] = Array.from({ length: 10 }, (_, x) => x === 4 ? null : 'J');
    game.active = { type: 'I', x: 4, y: 16, matrix: [[1], [1], [1], [1]] };
    game.lock();
    assert.equal(game.lines, count);
    assert.equal(game.score, [0, 100, 300, 500, 800][count]);
    assert.equal(game.board.length, 20);
    assert.equal(game.board.flat().filter(Boolean).length, 4 - count);
  }
});
test('level advances every ten lines and speeds up gravity', () => {
  const game = fresh();
  const initialSpeed = game.interval;
  game.lines = 9;
  game.board[19] = Array.from({ length: 10 }, (_, x) => x >= 3 && x <= 6 ? null : 'S');
  game.active = piece('I', 3, 18);
  game.lock();
  assert.equal(game.score, 100);
  assert.equal(game.level, 2);
  assert.ok(game.interval < initialSpeed);
});
test('rotation succeeds at a wall and on the floor without overlap', () => {
  const game = fresh();
  game.active = piece('T', 0, 17);
  game.rotate();
  game.move(-1);
  assert.equal(game.active.x, -1);
  assert.equal(game.rotate(), true);
  assert.equal(game.collides(game.active), false);
  game.active = piece('I', 3, 18);
  assert.equal(game.rotate(), true);
  assert.equal(game.collides(game.active), false);
});
test('blocked rotation leaves the original piece unchanged', () => {
  const game = fresh();
  game.active = piece('T', 3, 8);
  game.board = Array.from({ length: 20 }, () => Array(10).fill('J'));
  for (const { x, y } of game.cells()) game.board[y][x] = null;
  const before = JSON.stringify(game.active);
  assert.equal(game.rotate(), false);
  assert.equal(JSON.stringify(game.active), before);
});
test('lock delay permits adjustment and eventually locks', () => {
  const game = fresh();
  game.active = piece('O', 4, 18);
  game.tick(400);
  assert.equal(game.board.flat().filter(Boolean).length, 0);
  game.move(1);
  game.tick(400);
  assert.equal(game.board.flat().filter(Boolean).length, 0);
  game.tick(120);
  assert.equal(game.board.flat().filter(Boolean).length, 4);
});
test('lock resets are capped and cannot stall forever', () => {
  const game = fresh();
  game.active = piece('O', 4, 18);
  for (let i = 0; i < 16; i++) { game.tick(100); game.move(i % 2 ? -1 : 1); }
  assert.equal(game.lockResets, 15);
  game.tick(410);
  assert.equal(game.board.flat().filter(Boolean).length, 4);
});
test('paused game rejects movement, drops, rotation, and elapsed time', () => {
  const game = fresh();
  game.pause();
  const before = JSON.stringify(game);
  game.move(1); game.rotate(); game.softDrop(); game.hardDrop(); game.tick(10000);
  assert.equal(JSON.stringify(game), before);
  game.resume(); game.softDrop();
  assert.equal(game.score, 1);
});
test('blocked spawn and lock above the ceiling end the game; restart resets it', () => {
  const game = fresh();
  game.board[0].fill('J'); game.spawn();
  assert.equal(game.status, 'over');
  game.start();
  game.active = piece('O', 4, -1); game.lock();
  assert.equal(game.status, 'over');
  game.start();
  assert.equal(game.status, 'playing');
  assert.equal(game.score, 0);
  assert.equal(game.lines, 0);
  assert.equal(game.board.flat().filter(Boolean).length, 0);
});
test('all eight dictionaries cover static and dynamic UI keys', () => {
  let messages;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, value) => { messages = value; } } });
  const baseline = Object.keys(messages['zh-CN']).sort();
  assert.equal(Object.keys(messages).length, 8);
  for (const dictionary of Object.values(messages)) {
    assert.deepEqual(Object.keys(dictionary).sort(), baseline);
    for (const value of Object.values(dictionary)) assert.ok(value.length > 0);
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-label|-title)?="([^"]+)"/g)) {
    if (!match[1].includes('.')) assert.ok(baseline.includes(match[1]), match[1]);
  }
});
