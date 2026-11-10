const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const advance = (s, seconds, input = {}) => { for (let i = 0; i < Math.ceil(seconds * 30); i++) E.step(s, 1 / 30, input); };
const playing = index => { const s = E.create(index); s.status = 'playing'; return s; };

test('all three maps connect every fish, box, exit and patrol point', () => {
  for (let i = 0; i < E.LEVELS.length; i++) {
    const s = E.create(i);
    for (const p of [...s.fish, ...s.boxes, ...s.guards.flatMap(g => g.route), s.exit]) {
      assert.equal(E.solid(s, p.x, p.y, 12), false);
      assert.ok(E.path(s, s.player, p)?.length);
    }
  }
});

test('click movement follows every floor destination without clipping or getting stuck', () => {
  for (let level = 0; level < 3; level++) {
    const s = playing(level); s.guards = []; s.fish = [{ x: -100, y: -100, taken: false }];
    for (let y = 1; y < E.ROWS - 1; y++) for (let x = 1; x < E.COLS - 1; x++) {
      if (E.wall(s, x, y)) continue;
      const target = E.point(x, y); target.x += 8; target.y -= 7;
      assert.equal(E.moveTo(s, target), true);
      for (let n = 0; n < 900 && s.path.length; n++) { E.step(s, 1 / 30); assert.equal(E.solid(s, s.player.x, s.player.y, 11.9), false); }
      assert.ok(E.distance(s.player, target) < 2, `level ${level}, tile ${x},${y}`);
    }
  }
});

test('movement respects walls and diagonal speed is normalized', () => {
  const s = playing(0); s.guards = []; s.player = { ...s.player, ...E.point(3, 4) };
  advance(s, 2, { x: 1 }); assert.ok(s.player.x <= 4 * 48 - s.player.radius);
  const a = playing(0), b = playing(0); a.guards = []; b.guards = [];
  const start = { ...a.player }; E.step(a, .05, { x: 1 }); E.step(b, .05, { x: 1, y: -1 });
  assert.ok(Math.abs(E.distance(a.player, start) - E.distance(b.player, start)) < .001);
});

test('vision has a cone and range, and cannot pass through shelves', () => {
  const s = playing(0), g = s.guards[0]; Object.assign(g, E.point(3, 4), { angle: 0 });
  Object.assign(s.player, E.point(6, 4)); assert.equal(E.sees(s, g), false);
  Object.assign(g, E.point(7, 5), { angle: 0 }); Object.assign(s.player, E.point(9, 5)); assert.equal(E.sees(s, g), true);
  g.angle = Math.PI; assert.equal(E.sees(s, g), false);
  g.angle = 0; s.player.x += 300; assert.equal(E.sees(s, g), false);
});

test('paper distracts nearby guards, respects cover and range, and is limited', () => {
  const s = playing(0), g = s.guards[0]; Object.assign(s.player, E.point(7, 5));
  const target = E.point(8, 6);
  assert.equal(E.throwNoise(s, E.point(14, 1)), false);
  assert.equal(E.throwNoise(s, E.point(10, 7)), false);
  assert.equal(E.throwNoise(s, target), true); assert.equal(g.mode, 'investigate'); assert.equal(s.charges, 3);
  assert.equal(E.throwNoise(s, target), false);
  s.player.hidden = 0;
  advance(s, 3); assert.ok(E.distance(g, target) < 3);
  advance(s, 5); assert.equal(g.mode, 'patrol');
  for (let i = 0; i < 3; i++) { s.cooldown = 0; assert.equal(E.throwNoise(s, target), true); }
  s.cooldown = 0; assert.equal(E.throwNoise(s, target), false); assert.equal(s.charges, 0);
});

test('hiding requires a nearby box, blocks vision and movement, and lets suspicion fall', () => {
  const s = playing(0); assert.equal(E.hide(s), false);
  Object.assign(s.player, s.boxes[0]); const g = s.guards[0]; Object.assign(g, { x: s.player.x + 30, y: s.player.y, angle: Math.PI, suspicion: .8 });
  assert.equal(E.hide(s), true); assert.equal(E.sees(s, g), false);
  const before = { ...s.player }; advance(s, 2, { x: 1, y: 1 });
  assert.equal(s.player.x, before.x); assert.equal(s.player.y, before.y); assert.equal(g.suspicion, 0); assert.equal(s.status, 'playing');
  assert.equal(E.hide(s), true); assert.equal(s.player.hidden, -1);
});

test('continuous exposure causes capture, while paused and finished states freeze', () => {
  const s = playing(0), g = s.guards[0]; Object.assign(s.player, { x: g.x + 50, y: g.y });
  advance(s, 1.8); assert.equal(s.status, 'caught'); assert.ok(s.alerts > 0);
  const snapshot = JSON.stringify(s); advance(s, 5, { x: 1 }); assert.equal(JSON.stringify(s), snapshot);
  const paused = playing(0); paused.status = 'paused'; const time = paused.time; advance(paused, 5); assert.equal(paused.time, time);
  paused.status = 'playing'; E.step(paused, 30); assert.equal(paused.time, .05);
});

test('patrols keep moving around their obstacle-safe loops', () => {
  for (let level = 0; level < 3; level++) {
    const s = playing(level); s.player.hidden = 0; const visited = s.guards.map(() => new Set());
    for (let n = 0; n < 2400; n++) {
      E.step(s, 1 / 30);
      s.guards.forEach((g, i) => { assert.equal(E.solid(s, g.x, g.y, 9.9), false); visited[i].add(`${Math.floor(g.x / 48)},${Math.floor(g.y / 48)}`); });
    }
    visited.forEach(cells => assert.ok(cells.size >= 10));
  }
});

test('all fish must be collected and brought to the exit; replay resets the level', () => {
  for (let index = 0; index < 3; index++) {
    const s = playing(index); s.guards = []; E.step(s, .01); assert.equal(s.status, 'playing');
    for (const target of [...s.fish, s.exit]) {
      E.moveTo(s, target); for (let n = 0; n < 1500 && s.path.length && s.status === 'playing'; n++) E.step(s, 1 / 30);
    }
    assert.equal(s.status, 'won'); assert.equal(s.stars, 3); assert.equal(E.create(index).fish.some(f => f.taken), false);
  }
});

test('save data is sanitized and only consecutive wins unlock missions', () => {
  assert.deepEqual(E.cleanSave(null), { stars: [0, 0, 0], times: [null, null, null], unlocked: 0 });
  assert.equal(E.cleanSave({ stars: [0, 3, 3] }).unlocked, 0);
  assert.deepEqual(E.cleanSave({ stars: [99, 2, -5], times: [12, Infinity, 'bad'] }), { stars: [3, 2, 0], times: [12, null, null], unlocked: 2 });
});

test('each mission can be completed with live patrols and normal movement', () => {
  for (let index = 0; index < 3; index++) {
    const s = playing(index);
    for (const target of [...s.fish, s.exit]) {
      assert.equal(E.moveTo(s, target), true);
      for (let n = 0; n < 1500 && s.path.length && s.status === 'playing'; n++) E.step(s, 1 / 30);
    }
    assert.equal(s.status, 'won', `Mission ${index + 1}`);
    assert.ok(s.stars >= 1);
  }
});

test('investigation near a shelf ends at a reachable position', () => {
  const s = playing(0); Object.assign(s.player, E.point(7, 5));
  assert.equal(E.throwNoise(s, { x: 9 * 48 - 6, y: 7.5 * 48 }), true);
  s.player.hidden = 0;
  advance(s, 12); assert.equal(s.guards[0].mode, 'patrol');
});

test('all eight languages cover every key, placeholder and UI binding', () => {
  let messages; vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, value) => messages = value } });
  assert.equal(Object.keys(messages).length, 8); const expected = Object.keys(messages.en).sort();
  for (const dictionary of Object.values(messages)) {
    assert.deepEqual(Object.keys(dictionary).sort(), expected);
    for (const key of expected) { assert.ok(dictionary[key]); assert.deepEqual((dictionary[key].match(/\{\w+\}/g) || []).sort(), (messages.en[key].match(/\{\w+\}/g) || []).sort()); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) if (!key.includes('.')) assert.ok(messages.en[key], key);
});

test('lobby registration, eight-language card copy and relative assets are valid', () => {
  const root = path.join(__dirname, '../..'), window = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), { window });
  const cards = window.GAME_LIST.filter(g => g.path === './games/cat-stealth/index.html'); assert.equal(cards.length, 1);
  assert.equal(Object.keys(cards[0].locales).length, 7); assert.ok(fs.existsSync(path.join(root, cards[0].cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, asset] of html.matchAll(/(?:src|href)="(\.\.?\/[^"?#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, asset)), asset);
});
