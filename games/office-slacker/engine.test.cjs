const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Game, SHIFT, TARGET, cleanBest } = require('./engine.js');
const step = (g, ms, policy) => { for (let left = ms; left > 0; left -= 20) { if (policy) policy(g); g.tick(Math.min(left, 20)); } };
function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

test('start, hold, release, score multiplier and fresh rounds', () => {
  const g = new Game(); g.hold(true); step(g, 1000); assert.equal(g.score, 0);
  g.start(); g.hold(true); step(g, 1000); assert.ok(Math.abs(g.score - 20) < .01);
  step(g, 500); assert.equal(g.multiplier, 1.5);
  const score = g.score; g.hold(false); step(g, 300); assert.equal(g.score, score); assert.equal(g.multiplier, 1);
  g.start(); assert.equal(g.elapsed, 0); assert.equal(g.score, 0); assert.equal(g.strikes, 0); assert.equal(g.held, false);
});
test('only watching raises suspicion; releasing can avert a catch', () => {
  const g = new Game(); g.start();
  for (const phase of ['safe', 'approach', 'fake', 'leave', 'turn']) {
    g.phase = phase; g.phaseTime = 0; g.duration = 5000; g.hold(true); step(g, 500); assert.equal(g.suspicion, 0, phase);
  }
  g.phase = 'watch'; g.phaseTime = 0; step(g, 900); assert.ok(g.suspicion > 80);
  g.hold(false); step(g, 1800); assert.equal(g.strikes, 0); assert.ok(g.suspicion < .01);
});
test('being caught deducts points once and requires a fresh press after the lecture', () => {
  const g = new Game(); g.start(); g.score = 250; g.phase = 'watch'; g.duration = 10000;
  g.hold(true); step(g, 1120); assert.equal(g.strikes, 1); assert.equal(g.held, false); assert.equal(g.multiplier, 1);
  assert.ok(g.score >= 170 && g.score < 175); assert.equal(g.suspicion, 0);
  g.hold(true); assert.equal(g.held, false); step(g, 1600); assert.equal(g.strikes, 1); assert.equal(g.slacking, false);
  g.hold(true); assert.equal(g.slacking, true);
});
test('the third catch ends the round, freezes score, and never produces a negative score', () => {
  const g = new Game(); g.start();
  for (let i = 0; i < 3; i++) {
    g.phase = 'watch'; g.phaseTime = 0; g.duration = 10000; g.hold(true); step(g, 1120); step(g, 1400);
  }
  assert.equal(g.strikes, 3); assert.equal(g.state, 'fired'); assert.equal(g.held, false); assert.ok(g.score >= 0);
  const elapsed = g.elapsed; step(g, 10000); assert.equal(g.elapsed, elapsed);
});
test('pause clears held input and preserves countdown, boss timing, score and suspicion', () => {
  const g = new Game(); g.start(); g.hold(true); step(g, 700); g.pause();
  const snapshot = JSON.stringify(g); step(g, 9000); assert.equal(JSON.stringify(g), snapshot);
  g.hold(true); assert.equal(g.held, false); g.pause(false); assert.equal(g.held, false); step(g, 20); assert.equal(g.elapsed, 720);
});
test('a stalled frame cannot skip the visible warning or consume a whole reaction window', () => {
  const g = new Game(() => .9); g.start(); step(g, 4480); g.tick(60000);
  assert.equal(g.phase, 'approach'); assert.equal(g.phaseTime, 0); assert.equal(g.elapsed, 4560);
  g.tick(60000); assert.equal(g.phase, 'approach'); assert.equal(g.phaseTime, 80);
  for (const dt of [NaN, Infinity, -1, 0]) g.tick(dt); assert.equal(g.phaseTime, 80);
});
test('each three-visit bag includes a real check, coffee fake and double-back, all telegraphed', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const g = new Game(seeded(seed)); g.start(); const kinds = [];
    for (let i = 0; i < 3; i++) {
      g.nextVisit(); const phases = g.route.map(p => p[0]);
      assert.equal(phases[0], 'approach'); assert.equal(phases.at(-1), 'safe');
      for (let j = 0; j < phases.length; j++) if (phases[j] === 'watch') assert.ok(['approach', 'turn'].includes(phases[j - 1]));
      kinds.push(phases.includes('fake') ? 'coffee' : phases.includes('turn') ? 'double' : 'inspect');
    }
    assert.deepEqual(kinds.sort(), ['coffee', 'double', 'inspect']);
  }
});
test('careful play can beat the goal across 100 varied shifts; idle play cannot win', () => {
  const scores = [];
  for (let seed = 1; seed <= 100; seed++) {
    const g = new Game(seeded(seed)); g.start();
    step(g, SHIFT, state => state.hold(['safe', 'fake', 'leave'].includes(state.phase)));
    assert.equal(g.state, 'finished'); assert.equal(g.strikes, 0); assert.ok(g.score >= TARGET, `seed ${seed}: ${g.score}`);
    assert.ok(g.dodges >= 4); scores.push(g.score);
  }
  const idle = new Game(); idle.start(); step(idle, SHIFT); assert.equal(idle.state, 'finished'); assert.equal(idle.score, 0);
});
test('persistent record sanitization rejects damaged and unbounded values', () => {
  for (const value of [null, '100', {}, [], NaN, Infinity, -1]) assert.equal(cleanBest(value), 0);
  assert.equal(cleanBest(123.9), 123); assert.equal(cleanBest(1e20), 999999);
});
test('all eight translations have the same keys and placeholder contracts', () => {
  let catalog;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (scope, value) => { assert.equal(scope, 'slacker'); catalog = value; } } });
  assert.equal(Object.keys(catalog).length, 8);
  const keys = Object.keys(catalog.en).sort();
  for (const [language, messages] of Object.entries(catalog)) {
    assert.deepEqual(Object.keys(messages).sort(), keys, language);
    for (const key of keys) { assert.ok(messages[key].length, `${language}.${key}`); assert.deepEqual(messages[key].match(/\{\w+\}/g), catalog.en[key].match(/\{\w+\}/g), `${language}.${key}`); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-label|-content)?="([^"]+)"/g)) {
    if (match[1].startsWith('common.')) continue;
    assert.ok(catalog.en[match[1]], `Missing HTML key ${match[1]}`);
  }
  const registry = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../gamelist.js'), 'utf8'), registry);
  const cards = registry.window.GAME_LIST.filter(g => g.path.includes('office-slacker'));
  assert.equal(cards.length, 1); assert.equal(Object.keys(cards[0].locales).length, 7);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, match[1])), `Missing asset: ${match[1]}`);
});
