'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { newBoard, legal, draw, chooseEdge, outcome } = require('./rules.js');
const locale = require('./lobby-entry.json');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('both board sizes contain every unit edge exactly once', () => {
  for (const size of [3, 5]) {
    const b = newBoard(size);
    assert.equal(b.edges.length, 2 * size * (size + 1));
    assert.equal(b.boxes.length, size ** 2);
    assert.equal(new Set(b.edges.map(e => [e.x, e.y, e.vertical].join())).size, b.edges.length);
    const neighbors = b.boxes.map(() => 0);
    for (const e of b.edges) {
      assert.ok(legal(b, e.id));
      assert.ok(e.cells.length === 1 || e.cells.length === 2);
      e.cells.forEach(i => neighbors[i]++);
    }
    assert.ok(neighbors.every(n => n === 4));
  }
});

test('duplicate edges and invalid inputs cannot change a turn, score or board', () => {
  const b = newBoard(3);
  draw(b, 0);
  assert.equal(b.turn, 1);
  const snapshot = structuredClone(b);
  for (const id of [0, -1, 24, null, '1', NaN, 1.5]) {
    assert.equal(legal(b, id), false);
    assert.equal(draw(b, id), null);
    assert.deepEqual(b, snapshot);
  }
});

test('a shared fourth side scores two, keeps the pencil and cannot be scored twice', () => {
  const b = newBoard(3);
  [0, 1, 3, 4, 12, 14].forEach(id => draw(b, id));
  assert.deepEqual(b.score, [0, 0]);
  assert.equal(b.turn, 0);
  for (const advanced of [true, false]) assert.equal(chooseEdge(b, advanced), 13);
  const last = draw(b, 13);
  assert.deepEqual(last.closed, [0, 1]);
  assert.equal(last.done, false);
  assert.deepEqual(b.score, [2, 0]);
  assert.equal(b.turn, 0);
  assert.deepEqual(b.boxes.slice(0, 2).map(box => box.owner), [0, 0]);
  assert.equal(draw(b, 13), null);
  assert.equal(draw(b, 2).player, 0);
  assert.equal(b.turn, 1);
});

test('both levels take single boxes; the advanced level always avoids a third side if safe', () => {
  const b = newBoard(3);
  [0, 3].forEach(id => draw(b, id));
  for (let i = 0; i < 100; i++) {
    const e = b.edges[chooseEdge(b, true, () => i / 100)];
    assert.ok(legal(b, e.id));
    assert.ok(e.cells.every(c => b.boxes[c].sides < 2));
  }
  draw(b, 12);
  for (const advanced of [true, false]) assert.equal(chooseEdge(b, advanced), 13);
  assert.deepEqual(draw(b, 13).closed, [0]);
  assert.equal(b.turn, 1);
});

test('final legal edge, and only that edge, ends a complete 2–2 draw', () => {
  const b = newBoard(2);
  const moves = [7, 10, 3, 0, 11, 2, 8, 1, 5, 4, 6, 9];
  for (const id of moves) {
    assert.equal(outcome(b), null);
    assert.equal(draw(b, id).done, id === moves.at(-1));
  }
  assert.deepEqual(b.score, [2, 2]);
  assert.equal(outcome(b), 'tie');
  assert.equal(chooseEdge(b, true), null);
  assert.equal(draw(b, 9), null);
});

test('200 seeded full matches conserve scores and select only legal edges', () => {
  let seed = 29;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const results = new Set();
  for (let i = 0; i < 200; i++) {
    const b = newBoard(i % 2 ? 3 : 5);
    for (let n = 1; n <= b.edges.length; n++) {
      const id = chooseEdge(b, b.turn === 1 && b.size === 5, random);
      assert.ok(legal(b, id));
      const player = b.turn, oldScore = b.score[player];
      const last = draw(b, id);
      assert.equal(last.done, n === b.edges.length);
      assert.equal(b.score[player] - oldScore, last.closed.length);
      assert.equal(b.score[0] + b.score[1], b.boxes.filter(box => box.owner !== null).length);
      assert.equal(b.turn, last.closed.length ? player : 1 - player);
    }
    assert.equal(b.score[0] + b.score[1], b.size ** 2);
    const result = outcome(b);
    assert.equal(result, b.score[0] > b.score[1] ? 'win' : 'loss');
    results.add(result);
  }
  assert.equal(results.size, 2);
});

test('all eight dictionaries have the same keys and placeholders as the base, and match the lobby titles', () => {
  let words;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'words.js'), 'utf8'), { BooplandI18n: { register: (_, value) => { words = value; } } });
  const tokens = value => Array.from(value.matchAll(/\{(\w+)\}/g), m => m[1]).sort();
  assert.deepEqual(Object.keys(words).sort(), ['zh-CN', 'en', 'es', 'de', 'fr', 'ko', 'ja', 'pt-BR'].sort());
  for (const [lang, entries] of Object.entries(words)) {
    assert.equal(entries.title, locale.locales[lang].title);
    assert.deepEqual(Object.keys(entries).sort(), Object.keys(words.en).sort());
    for (const [key, value] of Object.entries(entries)) {
      assert.ok(value.trim());
      assert.deepEqual(tokens(value), tokens(words.en[key]));
    }
  }
});
