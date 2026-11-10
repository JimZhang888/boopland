'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const root = path.resolve(__dirname, '../..');
let checks = 0;
function test(label, fn) { fn(); checks++; console.log('PASS', label); }
function run(state, seconds) { for (let n = 0; n < seconds * 60; n++) E.step(state, 1 / 60); }
function install(state, level) {
  state.level = level; state.board = E.baseBoard(); state.slots.fill(null); state.spawn = [0, 0];
  for (const p of E.blueprint(level)) assert.equal(E.place(state, p.x, p.y, p.type, p.dir, p.color), true);
}
test('All eight orders are reachable, sequential and finish at exactly 96 deliveries', () => {
  const state = E.create();
  for (let level = 0; level < E.ORDERS.length; level++) {
    install(state, level); run(state, 90);
    assert.equal(state.completed, true, `order ${level + 1}`);
    assert.equal(state.delivered, E.ORDERS[level].count);
    assert.equal(state.rejected, 0);
    const total = state.total; run(state, 5); assert.equal(state.total, total);
    assert.equal(E.nextOrder(state), level < 7);
  }
  assert.equal(state.total, 96);
});
test('Cutter, dye and rotation preserve the exact recipe', () => {
  let item = { shape: 'circle', color: 'plain', mask: 15 };
  item = E.transform(item, { type: 'cutter' }); assert.equal(item.mask, 3);
  item = E.transform(item, { type: 'cutter' }); assert.equal(item.mask, 1);
  item = E.transform(item, { type: 'rotator' }); assert.equal(item.mask, 2);
  item = E.transform(item, { type: 'rotator' }); assert.equal(item.mask, 4);
  item = E.transform(item, { type: 'painter', color: 'blue' }); assert.equal(item.color, 'blue');
  assert.equal(item.shape, 'circle');
  for (let n = 0; n < 4; n++) item = E.transform(item, { type: 'rotator' });
  assert.equal(item.mask, 4);
});
test('Wrong colors, shapes and orientations never increase order progress', () => {
  for (const wrong of [{ shape: 'circle', color: 'red', mask: 15 }, { shape: 'square', color: 'plain', mask: 15 }, { shape: 'circle', color: 'plain', mask: 3 }]) {
    const state = E.create(); state.board[E.at(9, 3)] = { type: 'belt', dir: 0 };
    state.slots[E.at(9, 3)] = { item: wrong, from: 2, progress: 1 }; E.step(state, .1);
    assert.equal(state.delivered, 0); assert.equal(state.rejected, 1);
  }
});
test('Dead ends retain items and resume after reconnecting', () => {
  const state = E.create(); run(state, 15); assert.equal(state.delivered, 0);
  assert.equal(state.slots.filter(Boolean).length, 5);
  for (const p of E.blueprint(0)) E.place(state, p.x, p.y, p.type, p.dir, p.color);
  run(state, 40); assert.equal(state.completed, true);
});
test('Opposing outputs block rather than overwrite items', () => {
  const state = E.create(); state.board = E.baseBoard();
  E.place(state, 1, 1, 'belt', 2); run(state, 10);
  assert.ok(state.slots[E.at(0, 1)]); assert.equal(state.slots[E.at(1, 1)], null);
});
test('Merging lines never overwrite or duplicate a piece', () => {
  const state = E.create(); state.board = E.baseBoard();
  for (const [x, y, d] of [[4, 3, 0], [5, 2, 1], [5, 3, 0]]) E.place(state, x, y, 'belt', d);
  for (const [x, y] of [[4, 3], [5, 2]]) state.slots[E.at(x, y)] = { item: { shape: 'circle', color: 'plain', mask: 15 }, progress: 1, from: 2 };
  E.step(state, .1);
  assert.equal(state.slots.filter(Boolean).length, 2);
  assert.ok(state.slots[E.at(5, 3)]);
  assert.equal(state.slots[E.at(5, 3)].progress, 0);
});
test('Fixed tiles, bounds and locked machines cannot be overwritten', () => {
  const s = E.create();
  assert.equal(E.place(s, 0, 1, 'erase', 0), false);
  assert.equal(E.place(s, 10, 3, 'belt', 0), false);
  assert.equal(E.place(s, -1, 1, 'belt', 0), false);
  assert.equal(E.place(s, 2, 2, 'rotator', 0), false);
  assert.equal(E.place(s, 2, 2, 'painter', 0), false);
  assert.equal(E.nextOrder(s), false);
});
test('Saved progress resumes, invalid saves safely fall back', () => {
  const state = E.create(); install(state, 6); run(state, 15);
  const restored = E.restore(E.serialize(state));
  assert.ok(restored); assert.deepEqual(restored.board, state.board);
  assert.equal(restored.delivered, state.delivered); assert.equal(restored.slots.filter(Boolean).length, 0);
  run(restored, 90); assert.equal(restored.completed, true);
  assert.equal(E.restore('nope'), null);
  const invalid = JSON.parse(E.serialize(state)); invalid.board[1] = { type: 'invalid', dir: 0 }; assert.equal(E.restore(JSON.stringify(invalid)), null);
  invalid.board[1] = null; invalid.level = 50; assert.equal(E.restore(JSON.stringify(invalid)), null);
});
test('Every static and dynamic translation exists in all eight languages', () => {
  let messages;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, m) => { messages = m; } } });
  assert.equal(Object.keys(messages).length, 8);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const required = [...html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g)].map(m => m[1]).filter(k => !k.startsWith('common.'));
  for (const [language, dictionary] of Object.entries(messages)) {
    assert.deepEqual(Object.keys(dictionary), Object.keys(messages.en));
    for (const key of required) assert.equal(typeof dictionary[key], 'string', language + '.' + key);
    for (const [key, value] of Object.entries(dictionary)) {
      assert.ok(value.length, language + '.' + key);
      assert.deepEqual([...value.matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), [...messages.en[key].matchAll(/\{\w+\}/g)].map(m => m[0]).sort());
    }
  }
});
test('Lobby entry is unique, localized and all local resources exist', () => {
  const context = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(g => g.path === './games/tiny-factory/index.html');
  assert.equal(entries.length, 1); assert.equal(Object.keys(entries[0].locales).length, 7);
  assert.ok(fs.existsSync(path.resolve(root, entries[0].cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, resource] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, resource)), resource);
  assert.ok(!html.includes('type="module"')); assert.ok(!html.includes('https://'));
});
console.log(`Verified ${checks} factory checks.`);
