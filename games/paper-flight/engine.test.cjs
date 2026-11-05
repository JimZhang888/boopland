const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Flight } = require('./engine.js');

const game = () => { const flight = new Flight(480, 600, () => .5); flight.reset(); return flight; };
const advance = (flight, seconds, input = {}) => { for (let i = 0; i < seconds * 60; i++) { flight.update(1 / 60, input); flight.events = []; } };
const enemyAt = (x, y, hp = 1) => ({ x, baseX: x, y, r: 17, hp, maxHp: hp, value: 10, speed: 0, type: 'dart', age: 0, phase: 0, shot: 10 });

test('automatic fire destroys an enemy once and awards its score', () => {
  const flight = game(); flight.enemies.push(enemyAt(240, 390));
  advance(flight, .5);
  assert.equal(flight.kills, 1); assert.equal(flight.score, 10); assert.equal(flight.enemies.length, 0);
});
test('pause freezes movement, enemies, firing, and consumables', () => {
  const flight = game(); advance(flight, 1); flight.mode = 'paused';
  const before = JSON.stringify(flight);
  flight.update(.1, { x: 1 }); assert.equal(flight.erase(), false);
  assert.equal(JSON.stringify(flight), before);
});
test('diagonal movement is normalized and pointer movement is bounded', () => {
  const straight = game(), diagonal = game();
  straight.update(.1, { x: 1 }); diagonal.update(.1, { x: 1, y: -1 });
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - 240, diagonal.player.y - 525) - (straight.player.x - 240)) < .001);
  advance(straight, 3, { target: { x: -900, y: 900 } });
  assert.equal(straight.player.x, 24); assert.equal(straight.player.y, 572);
});
test('invulnerability prevents overlapping hits from costing multiple lives', () => {
  const flight = game(); flight.player.invincible = 0;
  flight.hit(); flight.hit(); flight.hit();
  assert.equal(flight.player.lives, 2); assert.equal(flight.mode, 'playing');
});
test('shield absorbs a hit, then zero lives ends the game', () => {
  const flight = game(); flight.player.invincible = 0; flight.player.shield = 10;
  flight.hit(); assert.equal(flight.player.lives, 3); assert.equal(flight.player.shield, 0);
  for (let i = 0; i < 3; i++) { flight.player.invincible = 0; flight.hit(); }
  assert.equal(flight.mode, 'over'); assert.equal(flight.player.lives, 0);
  const elapsed = flight.time; flight.update(.1); assert.equal(flight.time, elapsed);
});
test('eraser removes visible enemies and bullets, with two charges per flight', () => {
  const flight = game(); flight.enemies.push(enemyAt(50, 90), enemyAt(200, 90), enemyAt(350, -80));
  flight.hostile.push({ x: 0, y: 0 });
  assert.equal(flight.erase(), true); assert.equal(flight.score, 20); assert.equal(flight.hostile.length, 0); assert.equal(flight.enemies.length, 1);
  assert.equal(flight.erase(), true); assert.equal(flight.erase(), false); assert.equal(flight.erasers, 0);
  flight.reset(); assert.equal(flight.erasers, 2); assert.equal(flight.player.lives, 3); assert.equal(flight.score, 0);
});
test('pickups grant triple fire, shield and capped repairs', () => {
  const flight = game();
  for (const type of ['power', 'shield', 'heart']) { flight.pickups.push({ x: 240, y: 525, r: 17, type, age: 0 }); flight.update(1 / 120); }
  assert.ok(flight.player.power > 9); assert.ok(flight.player.shield > 11); assert.equal(flight.player.lives, 3); assert.equal(flight.score, 30);
  flight.player.lives = 1; flight.pickups.push({ x: 240, y: 525, r: 17, type: 'heart', age: 0 }); flight.update(1 / 120);
  assert.equal(flight.player.lives, 2);
  flight.bullets = []; flight.fireClock = 0; flight.update(1 / 120); assert.equal(flight.bullets.length, 3);
});
test('six kills drop a collectible and a dead enemy cannot score again', () => {
  const flight = game();
  for (let i = 0; i < 6; i++) { const enemy = enemyAt(50, 100); flight.destroy(enemy); flight.destroy(enemy); }
  assert.equal(flight.score, 60); assert.equal(flight.kills, 6); assert.equal(flight.pickups.length, 1); assert.equal(flight.pickups[0].type, 'power');
});
test('a repair in the same step as a fatal hit cannot revive a finished flight', () => {
  const flight = game(); flight.player.lives = 1; flight.player.invincible = 0;
  flight.hostile.push({ x: 240, y: 525, vx: 0, vy: 0, r: 5 });
  flight.pickups.push({ x: 240, y: 525, r: 17, type: 'heart', age: 0 });
  flight.update(1 / 120); assert.equal(flight.mode, 'over'); assert.equal(flight.player.lives, 0);
});
test('difficulty advances on active time and introduces heavier aircraft', () => {
  const flight = game(); flight.player.invincible = 999; advance(flight, 37);
  assert.equal(flight.wave, 3); flight.spawnCount = 7; flight.spawn();
  assert.equal(flight.enemies.at(-1).type, 'heavy');
});
test('resize preserves progress and scales all active positions', () => {
  const flight = game(); flight.score = 120; flight.enemies.push(enemyAt(80, 100)); flight.hostile.push({ x: 100, y: 200 });
  flight.resize(960, 1200);
  assert.equal(flight.score, 120); assert.equal(flight.player.x, 480); assert.equal(flight.player.y, 1050);
  assert.equal(flight.enemies[0].baseX, 160); assert.equal(flight.hostile[0].y, 400);
});
test('hostile projectiles hit the player and offscreen entities are discarded', () => {
  const flight = game(); flight.player.invincible = 0;
  flight.hostile.push({ x: 240, y: 505, vx: 0, vy: 500, r: 5 }, { x: -100, y: 100, vx: 0, vy: 0, r: 5 });
  flight.update(.1); assert.equal(flight.player.lives, 2); assert.equal(flight.hostile.length, 0);
});
test('all eight translations have every key and preserve placeholders', () => {
  let messages;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { window: { BooplandI18n: { register: (scope, value) => { assert.equal(scope, 'paperFlight'); messages = value; } } } });
  const languages = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR'];
  assert.deepEqual(Object.keys(messages).sort(), languages.sort());
  const keys = Object.keys(messages['zh-CN']).sort();
  for (const language of languages) {
    assert.deepEqual(Object.keys(messages[language]).sort(), keys);
    for (const key of keys) { assert.ok(messages[language][key].trim()); assert.deepEqual((messages[language][key].match(/\{\w+\}/g) || []).sort(), (messages['zh-CN'][key].match(/\{\w+\}/g) || []).sort()); }
  }
});
