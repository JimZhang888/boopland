const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const LittleKun = require('./engine.js');
const translations = require('./translations.js');
function rng(seed = 7) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function quiet() { const g = new LittleKun(rng()); g.start(); g.fish = []; g.populate = () => {}; return g; }
function advance(g, seconds, input = {}) { for (let n = 0; n < Math.round(seconds * 60); n++) g.tick(1 / 60, input); }
function creature(g, radius, offset = 0) { return { id: 999, x: g.player.x + offset, y: g.player.y, radius, angle: 0, phase: 0, speed: 0, chase: 0, rest: 10, color: 0, variant: 0 }; }

test('movement accelerates promptly, brakes promptly and normalizes diagonals', () => {
  const a = quiet(), b = quiet(); advance(a, .3, { x: 1 }); advance(b, .3, { x: 1, y: 1 });
  assert.ok(a.player.vx > 198); assert.ok(Math.abs(Math.hypot(b.player.vx, b.player.vy) - a.player.vx) < .01);
  advance(a, .25); assert.ok(Math.abs(a.player.vx) < 3);
  const c = quiet(), d = quiet(); for (let i = 0; i < 120; i++) c.tick(1 / 120, { x: 1 }); for (let i = 0; i < 30; i++) d.tick(1 / 30, { x: 1 });
  assert.ok(Math.abs(c.player.x - d.player.x) < .01);
});
test('dash spends energy once, protects from contact and recovers', () => {
  const g = quiet(); assert.ok(g.ability()); assert.equal(g.energy, 70); assert.equal(g.ability(), false);
  g.fish = [creature(g, 30)]; g.tick(1 / 60, { x: 1 }); assert.equal(g.health, 4);
  g.fish = []; advance(g, .2, { x: 1 }); assert.ok(g.player.vx > 480);
  advance(g, 2); assert.equal(g.energy, 100); assert.ok(g.ability());
});
test('only smaller fish can be eaten; similar sized fish are harmless', () => {
  const g = quiet(); const small = creature(g, 11), peer = creature(g, 19), large = creature(g, 25);
  assert.equal(g.relation(small), 'food'); assert.equal(g.relation(peer), 'peer'); assert.equal(g.relation(large), 'danger');
  g.fish = [small, peer]; g.tick(1 / 60); assert.equal(g.eaten, 1); assert.equal(g.health, 4); assert.equal(g.fish.length, 1);
});
test('damage has grace time, preserves growth and leads to a restartable loss', () => {
  const g = quiet(); g.xp = 9; g.fish = [creature(g, 35)]; g.tick(1 / 60); assert.equal(g.health, 3); assert.equal(g.xp, 9);
  for (let i = 0; i < 90; i++) { g.fish = [creature(g, 35)]; g.tick(1 / 60); } assert.equal(g.health, 3);
  for (let i = 0; i < 3; i++) { g.invulnerable = 0; g.fish = [creature(g, 35)]; g.tick(1 / 60); }
  assert.equal(g.status, 'over'); assert.equal(g.health, 0); const x = g.player.x; advance(g, 2, { x: 1 }); assert.equal(g.player.x, x);
  g.start(); assert.equal(g.health, 4); assert.equal(g.score, 0); assert.equal(g.stage, 0); assert.equal(g.won, false);
});
test('all six forms are reachable, heal, and unlock an invulnerable Kun with suction', () => {
  const g = quiet(); g.health = 2;
  for (let stage = 1; stage < 6; stage++) {
    while (g.xp < LittleKun.STAGES[stage].xp) g.eat(creature(g, 10));
    assert.equal(g.stage, stage); assert.ok(g.health >= 3); assert.equal(g.energy, 100);
  }
  assert.equal(g.status, 'won'); assert.ok(g.drainEvents().some(e => e.type === 'won'));
  g.resume(); advance(g, 2); assert.ok(g.player.radius > 109);
  g.fish = [creature(g, 200, 250)]; assert.equal(g.relation(g.fish[0]), 'food'); assert.ok(g.ability()); assert.equal(g.energy, 50);
  advance(g, 1); assert.equal(g.fish.length, 0); assert.equal(g.health, 4); assert.equal(g.status, 'playing');
});
test('pearls restore one heart and pause freezes all timers and positions', () => {
  const g = quiet(); g.health = 2; g.energy = 20; g.pearls = [{ x: g.player.x, y: g.player.y, life: 10 }]; g.tick(1 / 60);
  assert.equal(g.health, 3); assert.ok(g.energy >= 55); assert.equal(g.pearls.length, 0);
  g.pause(); const before = JSON.stringify(g); g.tick(10, { x: 1 }); assert.equal(JSON.stringify(g), before); g.resume(); advance(g, .1, { x: 1 }); assert.ok(g.player.vx > 0);
});
test('streak multiplier is capped and missed timing resets the streak', () => {
  const g = quiet(); for (let i = 0; i < 35; i++) g.eat(creature(g, 5));
  const before = g.score; g.eat(creature(g, 5)); assert.equal(g.score - before, 30);
  advance(g, 4); const after = g.score; g.eat(creature(g, 5)); assert.equal(g.score - after, 10); assert.equal(g.combo, 1);
});
test('spawn is safe, food stays available, stalls are bounded and the ocean has no hard edge', () => {
  const g = new LittleKun(rng()); g.start(); assert.ok(g.fish.filter(f => g.relation(f) === 'food').length >= 9);
  for (const f of g.fish.filter(f => g.relation(f) === 'danger')) assert.ok(Math.hypot(f.x - g.player.x, f.y - g.player.y) >= 350);
  for (let i = 0; i < 100; i++) { const f = g.spawn(); assert.ok(Math.hypot(f.x - g.player.x, f.y - g.player.y) >= 350); }
  const q = quiet(); q.tick(50, { x: 1 }); assert.ok(q.time <= .051); q.player.x = 4719; advance(q, 2, { x: 1 }); assert.ok(q.player.x > 5000);
});
test('eight complete translations share placeholders and cover every UI key', () => {
  const reference = Object.keys(translations.en).sort();
  assert.equal(Object.keys(translations).length, 8);
  for (const locale of Object.values(translations)) { assert.deepEqual(Object.keys(locale).sort(), reference);
    for (const key of reference) { assert.ok(locale[key]); assert.deepEqual((locale[key].match(/\{\w+\}/g) || []).sort(), (translations.en[key].match(/\{\w+\}/g) || []).sort()); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) if (!key.includes('.')) assert.ok(translations.en[key], key);
});
test('lobby contains one valid entry, seven localized cards and existing local assets', () => {
  const root = path.resolve(__dirname, '../..'), scope = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), scope);
  const entries = scope.window.GAME_LIST.filter(g => g.path === './games/little-kun/index.html'); assert.equal(entries.length, 1); const entry = entries[0];
  assert.equal(Object.keys(entry.locales).length, 7); assert.ok(fs.existsSync(path.join(root, entry.cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) { assert.ok(!url.startsWith('/')); assert.ok(fs.existsSync(path.resolve(__dirname, url)), url); }
});
