const test = require('node:test');
const assert = require('node:assert/strict');
const { MeadowGame, UPGRADES } = require('./engine.js');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function seeded(seed = 1) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function fresh() { const game = new MeadowGame(seeded()); game.start(); game.spawnClock = 999; return game; }
function advance(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds * 60); i++) game.step(1 / 60, input); }
function enemy(game, dx = 0, type = 'slime') { const e = game.spawn(type); e.x = game.player.x + dx; e.y = game.player.y; e.speed = 0; return e; }

test('movement normalizes diagonals, preserves bounds, and clamps long frames', () => {
  const a = fresh(), b = fresh(); advance(a, 1, { x: 1 }); advance(b, 1, { x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(b.player.x - 1200, b.player.y - 1000) - (a.player.x - 1200)) < .001);
  a.player.x = 2344; a.step(1, { x: 1 }); assert.equal(a.player.x, 2345); assert.ok(a.time < 1.1);
});

test('pause and upgrade freeze all simulation; restart clears a previous run', () => {
  const g = fresh(); advance(g, 1); g.pause(); const snapshot = JSON.stringify(g); advance(g, 2, { x: 1 }); assert.equal(JSON.stringify(g), snapshot);
  g.resume(); g.gainXP(8); const frozen = JSON.stringify(g); advance(g, 2); assert.equal(JSON.stringify(g), frozen);
  g.start(); assert.equal(g.time, 0); assert.equal(g.mode, 'running'); assert.equal(g.level, 1); assert.equal(g.player.hp, 100); assert.deepEqual(g.enemies, []);
});

test('dash grants contact protection, cannot be spammed, and recharges', () => {
  const g = fresh(); enemy(g); assert.equal(g.dash(), true); assert.equal(g.dash(), false); g.step(1 / 60);
  assert.equal(g.player.hp, 100); assert.ok(g.player.x > 1200); g.enemies = []; advance(g, 4); assert.equal(g.dash(), true);
  g.pause(); assert.equal(g.dash(), false);
});

test('contact damage has grace time and lethal contact ends the run once', () => {
  const g = fresh(); g.shotClock = 999; g.player.leaves = 0; enemy(g); g.step(1 / 60); assert.equal(g.player.hp, 90); advance(g, .4); assert.equal(g.player.hp, 90);
  g.player.hp = 1; g.player.invincible = 0; g.step(1 / 60); assert.equal(g.mode, 'lost'); assert.equal(g.player.hp, 0);
  advance(g, 2); assert.equal(g.drainEvents().filter(e => e.type === 'lost').length, 1);
});

test('automatic seeds defeat a target and preserve its experience drop', () => {
  const g = fresh(); g.player.leaves = 0; g.player.magnet = 0; enemy(g, 110); advance(g, .5);
  assert.equal(g.kills, 1); assert.equal(g.enemies.length, 0); assert.equal(g.drops.filter(d => d.type === 'xp').reduce((n,d) => n + d.value, 0), 1);
});

test('orbiting leaves deal repeated contact damage and pulses damage an area', () => {
  const g = fresh(); g.shotClock = 999; const e = enemy(g, 58); e.hp = 12; g.step(1 / 60); assert.equal(g.kills, 1);
  g.player.pulse = 1; g.player.leaves = 0; g.pulseClock = 0; enemy(g, 100); enemy(g, -100); g.step(1 / 60);
  assert.equal(g.kills, 3); assert.ok(g.events.some(e => e.type === 'pulse'));
});

test('experience overflow queues levels, offers are unique, invalid choices are ignored', () => {
  const g = fresh(); g.gainXP(40); assert.equal(g.level, 2); assert.equal(g.mode, 'upgrade'); assert.equal(new Set(g.choices).size, 3);
  assert.equal(g.choose('invalid'), false); g.choose(g.choices[0]); assert.equal(g.level, 3); assert.equal(g.mode, 'upgrade');
  g.choose(g.choices[0]); assert.equal(g.level, 4); g.choose(g.choices[0]); assert.equal(g.mode, 'running'); assert.equal(g.xp, 1);
});

test('every upgrade affects gameplay and healing respects max health', () => {
  const g = fresh(); g.player.hp = 10;
  for (const id of UPGRADES) { g.mode = 'upgrade'; g.choices = [id]; assert.equal(g.choose(id), true); assert.equal(g.upgrades[id], 1); }
  assert.equal(g.player.leaves, 2); assert.equal(g.player.seeds, 2); assert.equal(g.player.pulse, 1); assert.equal(g.player.maxHp, 120); assert.equal(g.player.hp, 55);
  g.drop(g.player.x, g.player.y, 999, 'heal'); g.step(1 / 60); assert.equal(g.player.hp, 120);
});

test('sixth wave spawns one boss; three minutes wins and freezes the result', () => {
  const g = fresh(); g.time = 149.99; g.step(.02); assert.equal(g.wave, 6); assert.equal(g.enemies.filter(e => e.type === 'boss').length, 1);
  advance(g, .5); assert.equal(g.enemies.filter(e => e.type === 'boss').length, 1);
  g.time = 179.99; g.step(.02); assert.equal(g.mode, 'won'); assert.equal(g.time, 180); advance(g, 1); assert.equal(g.events.filter(e => e.type === 'won').length, 1);
});

test('large battles bound gem allocation without losing experience value', () => {
  const g = fresh(); for (let i = 0; i < 2000; i++) g.drop(0, 0, 2, 'xp');
  assert.equal(g.drops.length, 350); assert.equal(g.drops.reduce((sum,d) => sum + d.value, 0), 4000);
});

test('full three-minute seeded simulations keep state finite and bounded', () => {
  for (let seed = 1; seed <= 4; seed++) {
    const g = new MeadowGame(seeded(seed)); g.start(); g.player.maxHp = 100000; g.player.hp = 100000;
    for (let i = 0; i < 10810 && g.mode !== 'won'; i++) {
      if (g.mode === 'upgrade') g.choose(g.choices[0]);
      const a = i / 300; g.step(1 / 60, { x: Math.cos(a), y: Math.sin(a), dash: i % 300 === 0 }); g.drainEvents();
      assert.ok(Number.isFinite(g.player.x) && Number.isFinite(g.player.y)); assert.ok(g.enemies.length <= 172); assert.ok(g.drops.length <= 400);
    }
    assert.equal(g.mode, 'won'); assert.equal(g.bossSpawned, true); assert.ok(g.kills > 20);
  }
});

test('eight complete dictionaries, valid relative resources, and one lobby entry', () => {
  let dictionary;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register(scope, messages) { dictionary = messages; } } });
  assert.equal(Object.keys(dictionary).length, 8);
  for (const values of Object.values(dictionary)) { assert.equal(Object.keys(values).length, 60); assert.ok(Object.values(values).every(v => typeof v === 'string' && v.length > 0)); }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, match[1])), match[1]);
  const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../gamelist.js'), 'utf8'), sandbox);
  const entry = sandbox.window.GAME_LIST.filter(g => g.path === './games/mini-mow/index.html'); assert.equal(entry.length, 1); assert.equal(Object.keys(entry[0].locales).length, 7);
});
