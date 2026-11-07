const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Game, LEVELS } = require('./engine.js');
function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function neighborIndices(game, i) {
  return game.cells.map((_, j) => j).filter(j => j !== i && Math.abs(j % game.size - i % game.size) <= 1 && Math.abs(Math.floor(j / game.size) - Math.floor(i / game.size)) <= 1);
}

test('all first positions: correct mine counts, protected opening, independent adjacency counts', () => {
  let boards = 0;
  for (const [level, config] of Object.entries(LEVELS)) for (let first = 0; first < config.size ** 2; first++) for (let seed = 1; seed <= 5; seed++) {
    const game = new Game(level, seeded(seed));
    assert.equal(game.status, 'ready');
    assert.equal(game.cells.some(cell => cell.mine), false);
    assert.equal(game.reveal(first), true);
    assert.equal(game.cells.filter(cell => cell.mine).length, config.mines);
    for (const i of [first, ...neighborIndices(game, first)]) assert.equal(game.cells[i].mine, false);
    assert.equal(game.cells[first].adjacent, 0);
    game.cells.forEach((cell, i) => {
      assert.equal(cell.adjacent, neighborIndices(game, i).filter(j => game.cells[j].mine).length);
      if (cell.open) assert.equal(cell.mine, false);
      if (cell.open && cell.adjacent === 0) for (const j of neighborIndices(game, i)) assert.equal(game.cells[j].open, true);
    });
    assert.equal(game.opened, game.cells.filter(cell => cell.open && !cell.mine).length);
    boards++;
  }
  assert.equal(boards, 1540);
});

test('flagging before opening, cap, cancellation, and flood respect flags', () => {
  const game = new Game('easy', seeded(11));
  assert.equal(game.toggleFlag(1), true);
  assert.equal(game.reveal(1), false);
  assert.equal(game.status, 'ready');
  game.reveal(0);
  assert.equal(game.cells[1].mine, false);
  assert.equal(game.cells[1].open, false);
  assert.equal(game.toggleFlag(0), false);
  game.toggleFlag(1);
  game.reveal(1);
  assert.equal(game.cells[1].open, true);
  const other = new Game('hard');
  for (let i = 0; i < other.mines; i++) assert.equal(other.toggleFlag(i), true);
  assert.equal(other.toggleFlag(other.mines), false);
  assert.equal(other.flags, other.mines);
  other.toggleFlag(0);
  assert.equal(other.toggleFlag(other.mines), true);
});

test('correct chording opens safe neighbors; insufficient flags do nothing', () => {
  let exercised = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const game = new Game('normal', seeded(seed));
    game.reveal(44);
    const index = game.cells.findIndex((c, i) => c.open && c.adjacent > 0 && neighborIndices(game, i).some(j => !game.cells[j].open && !game.cells[j].mine));
    if (index < 0) continue;
    const before = game.opened;
    assert.equal(game.chord(index), false);
    for (const j of neighborIndices(game, index)) if (game.cells[j].mine) game.toggleFlag(j);
    assert.equal(game.chord(index), true);
    assert.ok(game.opened > before);
    assert.notEqual(game.status, 'lost');
    exercised++;
  }
  assert.ok(exercised > 20);
});

test('incorrect chording detonates a mine instead of granting a free reveal', () => {
  const game = new Game('normal', seeded(32));
  game.reveal(44);
  const index = game.cells.findIndex((c, i) => c.open && c.adjacent > 0 && neighborIndices(game, i).some(j => !game.cells[j].open && !game.cells[j].mine));
  assert.ok(index >= 0);
  const around = neighborIndices(game, index), mines = around.filter(j => game.cells[j].mine);
  const wrong = around.find(j => !game.cells[j].open && !game.cells[j].mine);
  game.toggleFlag(wrong);
  mines.slice(1).forEach(j => game.toggleFlag(j));
  assert.equal(game.chord(index), true);
  assert.equal(game.status, 'lost');
  assert.equal(game.exploded, mines[0]);
});

test('all safe cells win without manual flags, terminal actions are locked, reset is clean', () => {
  for (const level of Object.keys(LEVELS)) {
    const game = new Game(level, seeded(5));
    game.reveal(0);
    game.cells.forEach((cell, i) => { if (!cell.mine) game.reveal(i); });
    assert.equal(game.status, 'won');
    assert.equal(game.opened, game.totalSafe);
    assert.equal(game.flags, game.mines);
    assert.ok(game.cells.every(cell => cell.mine ? cell.flag && !cell.open : cell.open));
    const snapshot = JSON.stringify(game);
    game.reveal(0); game.toggleFlag(4); game.chord(2);
    assert.equal(JSON.stringify(game), snapshot);
    game.reset();
    assert.equal(game.level, level);
    assert.equal(game.status, 'ready');
    assert.equal(game.opened + game.flags, 0);
    assert.equal(game.exploded, -1);
    assert.ok(game.cells.every(cell => !cell.mine && !cell.flag && !cell.open));
  }
});

test('mine losses freeze state and cannot save a win by continuing', () => {
  const game = new Game('easy', seeded(3));
  game.reveal(0);
  const mine = game.cells.findIndex(cell => cell.mine);
  game.reveal(mine);
  assert.equal(game.status, 'lost');
  assert.equal(game.exploded, mine);
  const snapshot = JSON.stringify(game);
  game.cells.forEach((_, i) => { game.reveal(i); game.toggleFlag(i); game.chord(i); });
  assert.equal(JSON.stringify(game), snapshot);
});

test('invalid coordinates and difficulty cannot corrupt a board; seeded layouts reproduce', () => {
  const game = new Game('unknown');
  assert.equal(game.level, 'easy');
  for (const index of [-1, 64, null, '0', NaN, 1.5, Infinity]) {
    assert.equal(game.reveal(index), false);
    assert.equal(game.toggleFlag(index), false);
    assert.equal(game.chord(index), false);
  }
  const a = new Game('hard', seeded(7)), b = new Game('hard', seeded(7));
  a.reveal(55); b.reveal(55);
  assert.deepEqual(a.cells, b.cells);
  assert.equal(new Set(game.neighbors(0)).size, 3);
  assert.equal(new Set(game.neighbors(9)).size, 8);
});

test('all eight translations have matching keys, interpolation fields and page bindings', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register(scope, data) { assert.equal(scope, 'pencilMines'); dictionaries = data; } } });
  const languages = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR'];
  assert.deepEqual(Object.keys(dictionaries), languages);
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const language of languages) {
    assert.deepEqual(Object.keys(dictionaries[language]).sort(), Object.keys(dictionaries.en).sort());
    for (const [key, value] of Object.entries(dictionaries[language])) {
      assert.equal(typeof value, 'string', language + ': ' + key);
      assert.ok(value.trim());
      assert.deepEqual(placeholders(value), placeholders(dictionaries.en[key]), language + ': ' + key);
    }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label|-title|-content)?="pencilMines\.([^"]+)"/g)) assert.ok(dictionaries.en[key], key);
});

test('entry assets are local, lobby entry is unique, and all card translations exist', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, target] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    assert.ok(!target.startsWith('/') && !target.includes('://'), target);
    assert.ok(fs.existsSync(path.resolve(__dirname, target)), target);
  }
  assert.equal((html.match(/src="\.\.\/\.\.\/analytics\.js"/g) || []).length, 1);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(game => game.path === './games/pencil-mines/index.html');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].title, '铅笔扫雷');
  assert.ok(fs.existsSync(path.resolve(__dirname, '../..', entries[0].cover)));
  assert.equal(Object.keys(entries[0].locales).length, 7);
});
