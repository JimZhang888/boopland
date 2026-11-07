const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const grid = lines => lines.trim().split('\n').map(row => row.trim()).join('').split('').map(x => x === '.' ? null : x);

// Independent oracle: enumerate all possible straight/L/Z/U-shaped routes.
// Unlike the engine's directional search, this checks whole line segments.
function oracle(board, rows, cols, a, b) {
  if (a === b || board[a] == null || board[a] !== board[b]) return false;
  const p = [Math.floor(a / cols), a % cols], q = [Math.floor(b / cols), b % cols];
  function free(r, c) {
    return r < 0 || c < 0 || r >= rows || c >= cols || r * cols + c === a || r * cols + c === b || board[r * cols + c] == null;
  }
  function straight(u, v) {
    if (u[0] !== v[0] && u[1] !== v[1]) return false;
    const dr = Math.sign(v[0] - u[0]), dc = Math.sign(v[1] - u[1]);
    let [r, c] = u;
    while (true) { if (!free(r, c)) return false; if (r === v[0] && c === v[1]) return true; r += dr; c += dc; }
  }
  const works = points => points.slice(1).every((point, i) => straight(points[i], point));
  if (works([p, q]) || works([p, [p[0], q[1]], q]) || works([p, [q[0], p[1]], q])) return true;
  for (let r = -1; r <= rows; r++) if (works([p, [r, p[1]], [r, q[1]], q])) return true;
  for (let c = -1; c <= cols; c++) if (works([p, [p[0], c], [q[0], c], q])) return true;
  return false;
}

function validatePath(board, rows, cols, a, b, route) {
  assert.ok(route && route.length >= 2 && route.length <= 4, 'at most two turns');
  assert.deepEqual(route[0], [Math.floor(a / cols), a % cols]);
  assert.deepEqual(route.at(-1), [Math.floor(b / cols), b % cols]);
  for (let i = 1; i < route.length; i++) {
    const [r1, c1] = route[i - 1], [r2, c2] = route[i];
    assert.ok((r1 === r2) !== (c1 === c2), 'nonzero orthogonal segment');
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    for (let r = r1, c = c1; ; r += dr, c += dc) {
      assert.ok(r >= -1 && r <= rows && c >= -1 && c <= cols, 'inside virtual border');
      if (r >= 0 && r < rows && c >= 0 && c < cols && r * cols + c !== a && r * cols + c !== b) assert.equal(board[r * cols + c], null, 'no tile crossed');
      if (r === r2 && c === c2) break;
    }
  }
}

test('straight, one-corner and two-corner paths, including the outside border', () => {
  const straight = grid('AA..\n....\n....\n....');
  assert.equal(E.route(straight, 4, 4, 0, 1).length, 2);
  const elbow = grid('A...\n..A.\n....\n....');
  assert.equal(E.route(elbow, 4, 4, 0, 6).length, 3);
  const outside = grid('AXXA\nXXXX\nXXXX\nXXXX');
  const route = E.route(outside, 4, 4, 0, 3);
  assert.equal(route.length, 4); assert.ok(route.some(([r]) => r === -1));
  validatePath(outside, 4, 4, 0, 3, route);
  const zigzag = grid('XXXXXX\nXA.XXX\nXX..AX\nXXXXXX');
  assert.equal(E.route(zigzag, 4, 6, 7, 16).length, 4);
});

test('mismatches, self-selection, empty cells and paths needing three turns are rejected', () => {
  const board = grid('XXXXXX\nXA..XX\nXXX..X\nXXXXAX\nXXXXXX');
  assert.equal(E.route(board, 5, 6, 7, 22), null);
  assert.equal(E.route(board, 5, 6, 7, 0), null);
  assert.equal(E.route(board, 5, 6, 7, 7), null);
  assert.equal(E.route(board, 5, 6, 8, 9), null);
  assert.equal(E.route(board, 5, 6, -1, 22), null);
});

test('directional search agrees with independent route enumeration on random obstacles', () => {
  const random = rng(731); let checks = 0;
  for (let sample = 0; sample < 220; sample++) {
    const rows = 3 + sample % 4, cols = 3 + sample % 5;
    const board = Array.from({ length: rows * cols }, () => random() < .48 ? null : Math.floor(random() * 3));
    for (let a = 0; a < board.length; a++) for (let b = a + 1; b < board.length; b++) {
      const found = E.route(board, rows, cols, a, b), expected = oracle(board, rows, cols, a, b);
      assert.equal(Boolean(found), expected, `sample ${sample}, ${a} -> ${b}`);
      if (found) validatePath(board, rows, cols, a, b, found);
      checks++;
    }
  }
  assert.ok(checks > 50000);
});

test('every generated board has a complete valid solution at all three sizes', () => {
  for (const [rows, cols] of [[6, 6], [8, 6], [8, 8]]) for (let seed = 1; seed <= 55; seed++) {
    const { board, solution } = E.create(rows, cols, ['fox', 'cat', 'frog', 'panda', 'owl', 'chick', 'bear', 'rabbit'], rng(seed));
    assert.equal(solution.length, rows * cols / 2);
    for (const { a, b } of solution) {
      assert.equal(board[a], board[b]); assert.notEqual(board[a], null);
      validatePath(board, rows, cols, a, b, E.route(board, rows, cols, a, b));
      board[a] = null; board[b] = null;
    }
    assert.ok(board.every(value => value == null)); assert.equal(E.findPair(board, rows, cols), null);
  }
});

test('shuffling preserves empty spaces and icon counts and restores a full solution', () => {
  for (let seed = 0; seed < 65; seed++) {
    const random = rng(seed), { board, solution } = E.create(8, 8, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], random);
    for (const { a, b } of solution.slice(0, seed % 31)) { board[a] = null; board[b] = null; }
    const original = board.slice(), mixed = E.arrange(board, 8, 8, random);
    assert.deepEqual(board, original, 'input is not mutated');
    assert.deepEqual(mixed.board.filter(x => x != null).sort(), original.filter(x => x != null).sort());
    assert.deepEqual(mixed.board.map(x => x == null), original.map(x => x == null));
    for (const { a, b } of mixed.solution) {
      validatePath(mixed.board, 8, 8, a, b, E.route(mixed.board, 8, 8, a, b)); mixed.board[a] = null; mixed.board[b] = null;
    }
  }
});

test('deadlocked boards become solvable and unusual random streams terminate', () => {
  const board = grid('AB\nBA');
  assert.equal(E.findPair(board, 2, 2), null);
  const fixed = E.arrange(board, 2, 2, () => 0);
  assert.ok(E.findPair(fixed.board, 2, 2));
  assert.equal(E.create(6, 6, ['a', 'b'], () => 0).solution.length, 18);
  assert.equal(E.create(8, 8, ['a', 'b'], () => .99999).solution.length, 32);
  assert.throws(() => E.arrange(['a', 'b', 'b', null], 2, 2), /pairs/);
  assert.throws(() => E.create(3, 3, ['a']), /even board/);
});

test('eight complete translations, extensible themes, static resources and one lobby entry', () => {
  let catalogue;
  const context = { BooplandI18n: { register(scope, words) { assert.equal(scope, 'animalLink'); catalogue = words; } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(catalogue).sort(), ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR'].sort());
  const keys = Object.keys(catalogue.en).sort();
  for (const words of Object.values(catalogue)) {
    assert.deepEqual(Object.keys(words).sort(), keys);
    for (const key of keys) { assert.ok(words[key].trim()); assert.deepEqual(words[key].match(/\{\w+\}/g)?.sort(), catalogue.en[key].match(/\{\w+\}/g)?.sort()); }
  }
  for (const filename of ['art.js', 'themes.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, filename), 'utf8'), context);
  assert.equal(context.LinkThemes.length, 2);
  for (const theme of context.LinkThemes) {
    assert.ok(catalogue.en[theme.label]); assert.equal(new Set(theme.icons.map(icon => icon.id)).size, theme.icons.length);
    assert.ok(theme.icons.length >= 8);
    for (const icon of theme.icons) { assert.ok(catalogue.en[icon.label]); assert.ok(icon.svg.startsWith('<svg')); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label|-content)?="([^"]+)"/g)) if (!key.startsWith('common.')) assert.ok(catalogue.en[key], key);
  for (const [, resource] of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, resource)), resource);
  assert.equal((html.match(/analytics\.js/g) || []).length, 1);
  const lobby = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../gamelist.js'), 'utf8'), lobby);
  const entries = lobby.window.GAME_LIST.filter(item => item.path === './games/animal-link/index.html');
  assert.equal(entries.length, 1); assert.equal(entries[0].category, '益智'); assert.equal(Object.keys(entries[0].locales).length, 7);
  assert.ok(fs.existsSync(path.resolve(__dirname, '../..', entries[0].cover)));
});
