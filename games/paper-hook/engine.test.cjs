const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');

// Real input policies: press at the start, release at these horizontal offsets,
// then press again. No teleporting, forced scores, or bypassed collisions.
const routes = [
  [132,183,106,169], [132,183,106,169,160], [132,183,106,169,160],
  [86,117,120,83,170,161], [182,181,88,187,166], [76,115,114,173,120,155],
  [82,157,124,131,122,137], [131,182,161,176,99,146,129],
  [108,131,182,161,176,99], [79,102,101,188,103,154,185],
  [79,102,101,188,103,154,185], [188,171,146,181,164,139,158,177]
];
function fly(index, route) {
  const s = E.create(index); E.start(s);
  for (let frame = 0; frame < 4200 && s.status === 'playing'; frame++) {
    if (s.rope && s.x > s.rope.x + route[s.rope.id] && s.vy < 0) E.hold(s, false);
    else if (!s.rope) E.hold(s, true);
    E.step(s);
    assert.ok(Number.isFinite(s.x + s.y + s.vx + s.vy));
    if (s.rope) assert.ok(Math.hypot(s.x - s.rope.x, s.y - s.rope.y) <= s.rope.length + 1e-7);
  }
  return s;
}
routes.forEach((route, index) => test(`level ${index + 1} can finish with all three stars`, () => {
  const s = fly(index, route);
  assert.equal(s.status, 'won'); assert.equal(s.collected.length, 3);
  assert.equal(s.progress, 1); assert.equal(s.events.filter(e => e.type === 'won').length, 1);
}));

test('attaching does not teleport; releasing preserves velocity and blocks the old ring', () => {
  const s = E.create(); E.start(s);
  const position = [s.x, s.y]; E.hold(s, true);
  assert.deepEqual([s.x, s.y], position); assert.ok(s.rope);
  for (let i = 0; i < 110; i++) E.step(s);
  const velocity = [s.vx, s.vy], old = s.rope.id;
  E.hold(s, false); assert.equal(s.rope, null); assert.deepEqual([s.vx, s.vy], velocity);
  E.hold(s, true); assert.notEqual(s.rope?.id, old);
});

test('a held input catches a ring when it enters reach', () => {
  const s = E.create(); E.start(s); s.x = -90; s.y = 450; s.vx = 300; s.vy = -150;
  E.hold(s, true); assert.equal(s.rope, null);
  for (let i = 0; i < 90 && !s.rope; i++) E.step(s);
  assert.ok(s.rope);
});

test('pause freezes the simulation and resume does not add elapsed time', () => {
  const s = E.create(); E.start(s); E.hold(s, true); E.step(s); E.pause(s);
  const frozen = JSON.stringify(s);
  for (let i = 0; i < 300; i++) E.step(s);
  assert.equal(JSON.stringify(s), frozen);
  E.resume(s); E.step(s); assert.equal(s.status, 'playing'); assert.ok(s.time < .02);
});

test('bounce pads release the rope and launch the player upward', () => {
  const s = E.create(); E.start(s);
  const p = E.LEVELS[0].pads.find(p => p.bounce);
  Object.assign(s, { x: p.x + 30, y: p.y - E.RADIUS - 1, vx: 100, vy: 300 });
  E.step(s);
  assert.equal(s.bounces, 1); assert.equal(s.vy, -680); assert.ok(s.vx >= 295); assert.equal(s.rope, null);
});

test('stationary and moving wheels cause a hazard loss', () => {
  for (const index of [4, 8]) {
    const s = E.create(index); E.start(s); s.time = 3;
    const p = E.hazardPosition(E.LEVELS[index].hazards[0], s.time);
    Object.assign(s, { x: p.x, y: p.y, vx: 0, vy: 0 }); E.step(s);
    assert.equal(s.status, 'lost'); assert.equal(s.death, 'hazard');
  }
});

test('falling loses and terminal states cannot keep updating or reattach', () => {
  const s = E.create(); E.start(s);
  for (let i = 0; i < 1000 && s.status === 'playing'; i++) E.step(s);
  assert.equal(s.status, 'lost'); assert.equal(s.death, 'fall');
  const frozen = JSON.stringify(s); E.hold(s, true); E.step(s); assert.equal(JSON.stringify(s), frozen);
});

test('stars can only be collected once', () => {
  const s = E.create(); E.start(s); const star = E.LEVELS[0].stars[0];
  for (let i = 0; i < 4; i++) { s.x = star.x; s.y = star.y; E.step(s); }
  assert.equal(s.collected.length, 1); assert.equal(s.events.filter(e => e.type === 'star').length, 1);
});

test('damaged storage falls back safely; records keep best stars and best time', () => {
  for (const raw of [null, '', 'bad json', 'null', '42', '[]']) {
    const p = E.readProgress(raw); assert.equal(p.unlocked, 1); assert.equal(p.stars.length, 12);
  }
  const capped = E.readProgress('{"unlocked":99,"stars":[9,-2,"3"],"times":[-2,"bad",7]}');
  assert.equal(capped.unlocked, 12); assert.deepEqual(capped.stars.slice(0, 3), [3, 0, 0]); assert.deepEqual(capped.times.slice(0, 3), [null, null, 7]);
  const p = E.readProgress(null), won = fly(0, routes[0]); E.record(p, won);
  assert.equal(p.unlocked, 2); assert.equal(p.stars[0], 3);
  const time = p.times[0]; E.record(p, { ...won, time: time + 5, collected: [] });
  assert.equal(p.stars[0], 3); assert.equal(p.times[0], time);
  assert.deepEqual(E.readProgress(JSON.stringify(p)), p);
});

test('eight languages have complete UI keys and matching placeholders', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, m) => { dictionaries = m; } } });
  assert.deepEqual(Object.keys(dictionaries).sort(), ['zh-CN','en','ja','ko','fr','de','es','pt-BR'].sort());
  const keys = Object.keys(dictionaries.en).sort();
  for (const [lang, messages] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(messages).sort(), keys, lang);
    for (const key of keys) {
      assert.ok(messages[key].trim(), `${lang}.${key}`);
      assert.deepEqual((messages[key].match(/\{\w+\}/g) || []).sort(), (dictionaries.en[key].match(/\{\w+\}/g) || []).sort());
    }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-[a-z]+)?="paperHook\.([^"]+)"/g)) assert.ok(keys.includes(key), key);
});

test('lobby entry is unique and all local game resources exist', () => {
  const root = path.resolve(__dirname, '../..'), context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(game => game.path === './games/paper-hook/index.html');
  assert.equal(entries.length, 1); assert.equal(entries[0].category, '动作'); assert.equal(Object.keys(entries[0].locales).length, 7);
  assert.ok(fs.existsSync(path.resolve(root, entries[0].cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, url)), url);
  assert.equal((html.match(/analytics\.js/g) || []).length, 1);
});
