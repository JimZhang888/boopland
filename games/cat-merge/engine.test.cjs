const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');

function seeded(seed = 1) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function fresh(seed = 1) { const g = E.createGame(seeded(seed)); E.start(g); return g; }
function advance(g, seconds) { for (let i = 0; i < Math.round(seconds * 120); i++) E.advance(g, 1 / 120); }
function add(g, level, x, y, extra = {}) { const c = E.makeCat(g, level, x, y, { age: 2, mergeWait: 0, ...extra }); g.cats.push(c); return c; }

test('first two drops match, drop cooldown and wall bounds hold', () => {
  const g = fresh();
  const a = E.drop(g, -1000); assert.equal(a.level, 0); assert.equal(a.x, E.LEFT + a.r + 1);
  assert.equal(E.drop(g, 220), null); assert.equal(g.drops, 1);
  advance(g, .5);
  const b = E.drop(g, 10000); assert.equal(b.level, 0); assert.equal(b.x, E.RIGHT - b.r - 1);
  advance(g, 2); assert.equal(g.danger, 0); assert.equal(g.mode, 'playing');
  for (const cat of g.cats) assert.ok(cat.y + cat.r <= E.FLOOR + .01);
});

test('one collision consumes two cats and awards one larger cat exactly once', () => {
  const g = fresh(); add(g, 0, 200, 520); add(g, 0, 234, 520);
  advance(g, .25);
  assert.equal(g.cats.length, 1); assert.equal(g.cats[0].level, 1);
  assert.equal(g.score, 20); assert.equal(g.merges, 1);
  assert.equal(E.drainEvents(g).filter(e => e.type === 'merge').length, 1);
  advance(g, 3); assert.equal(g.score, 20);
});

test('three simultaneous matching contacts cannot reuse the same cat', () => {
  const g = fresh(); [200, 220, 240].forEach(x => add(g, 0, x, 515));
  E.advance(g, 1 / 120);
  assert.equal(g.cats.length, 2); assert.equal(g.merges, 1);
  assert.deepEqual(g.cats.map(c => c.level).sort(), [0, 1]);
  assert.equal(new Set(g.cats.map(c => c.id)).size, 2);
});

test('different levels collide and settle without fusing or crossing walls', () => {
  const g = fresh(); add(g, 1, 100, 524); add(g, 3, 110, 490);
  advance(g, 3);
  assert.equal(g.cats.length, 2); assert.equal(g.score, 0);
  const [a, b] = g.cats;
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r - .6);
  for (const cat of g.cats) assert.ok(cat.x >= E.LEFT + cat.r - .01 && cat.x <= E.RIGHT - cat.r + .01);
});

test('a grown cat can trigger another merge with a chain score', () => {
  const g = fresh(); add(g, 0, 200, 530); add(g, 0, 234, 530); add(g, 1, 260, 524);
  advance(g, 1);
  assert.equal(g.cats.length, 1); assert.equal(g.cats[0].level, 2);
  assert.equal(g.merges, 2); assert.equal(g.bestCombo, 2); assert.equal(g.score, 100);
});

test('chain multiplier caps at five and expires between separated merges', () => {
  const g = fresh();
  for (let i = 0; i < 7; i++) {
    g.cats = []; add(g, 0, 200, 530); add(g, 0, 234, 530); advance(g, .15);
  }
  assert.equal(g.combo, 7); assert.equal(g.score, 20 * (1 + 2 + 3 + 4 + 5 + 5 + 5));
  g.cats = []; advance(g, 2); add(g, 0, 200, 530); add(g, 0, 234, 530); advance(g, .15);
  assert.equal(g.combo, 1); assert.equal(g.bestCombo, 7);
});

test('two final-level cats clear the box and award a repeatable royal bonus', () => {
  const g = fresh(); add(g, 9, 180, 420); add(g, 9, 260, 420);
  advance(g, .2);
  assert.equal(g.cats.length, 0); assert.equal(g.royals, 1); assert.equal(g.score, 4096);
  assert.equal(g.highest, 9); assert.equal(g.mode, 'playing');
  assert.equal(E.drainEvents(g).find(e => e.type === 'merge').royal, true);
});

test('new cats passing the danger line do not cause a loss', () => {
  const g = fresh(); E.drop(g, 220); advance(g, .7);
  assert.equal(g.danger, 0); assert.equal(g.mode, 'playing');
  advance(g, 5); assert.equal(g.mode, 'playing');
});

test('sustained overflow ends once, and clearing the line resets its grace timer', () => {
  const g = fresh();
  add(g, 9, 220, 429); add(g, 8, 220, 209); add(g, 7, 220, 23);
  advance(g, 1); assert.ok(g.danger > .9); assert.equal(g.mode, 'playing');
  g.cats = []; advance(g, .1); assert.equal(g.danger, 0);
  add(g, 9, 220, 429); add(g, 8, 220, 209); add(g, 7, 220, 23);
  advance(g, 2.3); assert.equal(g.mode, 'over');
  assert.equal(E.drainEvents(g).filter(e => e.type === 'over').length, 1);
  const snapshot = JSON.stringify(g); advance(g, 10); assert.equal(JSON.stringify(g), snapshot);
  assert.equal(E.drop(g, 220), null);
});

test('pause freezes physics, drops, cooldown and warning; restart clears all run state', () => {
  const g = fresh(); E.drop(g, 180); advance(g, .2); E.pause(g);
  const snapshot = JSON.stringify(g); advance(g, 3); E.drop(g, 220); assert.equal(JSON.stringify(g), snapshot);
  E.resume(g); advance(g, .3); assert.ok(g.time > .4);
  E.start(g); assert.equal(g.cats.length, 0); assert.equal(g.score, 0); assert.equal(g.time, 0);
  assert.equal(g.danger, 0); assert.equal(g.drops, 0); assert.equal(g.current, 0); assert.equal(g.next, 0);
});

test('blocked spawn cannot create overlapping cats or consume the preview', () => {
  const g = fresh(); add(g, 4, 220, E.SPAWN_Y);
  assert.equal(E.drop(g, 220), null); assert.equal(g.drops, 0); assert.equal(g.cats.length, 1);
  assert.equal(g.current, 0); assert.equal(g.cooldown, 0);
  assert.ok(E.drainEvents(g).some(e => e.type === 'blocked'));
  assert.ok(E.drop(g, 65));
});

test('fixed simulation matches 30, 60 and 120 fps and ignores invalid deltas', () => {
  const states = [30, 60, 120].map(fps => {
    const g = fresh(); E.drop(g, 210);
    for (let i = 0; i < fps * 3; i++) E.advance(g, 1 / fps);
    return g;
  });
  for (const g of states) {
    assert.ok(Math.abs(g.time - 3) < 1e-6);
    assert.ok(Math.abs(g.cats[0].y - states[0].cats[0].y) < 1e-6);
  }
  const g = fresh(); E.advance(g, NaN); E.advance(g, -1); assert.equal(g.time, 0);
  E.advance(g, 999); assert.ok(g.time <= .101);
});

test('seeded full games remain finite with bounded crowds and reproducible results', () => {
  function run(seed) {
    const random = seeded(seed), g = fresh(seed);
    for (let frame = 0; frame < 15000 && g.mode === 'playing'; frame++) {
      if (frame % 43 === 0) E.drop(g, 40 + random() * 360);
      E.advance(g, 1 / 60); E.drainEvents(g);
      if (frame % 60 === 0) for (const cat of g.cats) {
        assert.ok([cat.x, cat.y, cat.vx, cat.vy, cat.angle].every(Number.isFinite));
        assert.ok(cat.x >= E.LEFT + cat.r - .01 && cat.x <= E.RIGHT - cat.r + .01);
        assert.ok(cat.y <= E.FLOOR - cat.r + .01); assert.ok(cat.y > -500);
      }
      assert.ok(g.cats.length < 110);
    }
    assert.equal(g.mode, 'over'); assert.ok(g.merges > 10);
    return [g.score, g.drops, g.highest, g.bestCombo];
  }
  for (const seed of [2, 7, 19]) assert.deepEqual(run(seed), run(seed));
});

test('all eight locales cover every UI key and preserve interpolation tokens', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register(scope, data) { assert.equal(scope, 'catMerge'); dictionaries = data; } } });
  assert.equal(Object.keys(dictionaries).length, 8);
  const keys = Object.keys(dictionaries.en).sort();
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys, language);
    for (const key of keys) {
      assert.ok(dictionary[key].trim().length > 0);
      assert.deepEqual((dictionary[key].match(/\{\w+\}/g) || []).sort(), (dictionaries.en[key].match(/\{\w+\}/g) || []).sort(), `${language}.${key}`);
    }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-label|-content)?="catMerge\.([^"]+)"/g)) assert.ok(dictionaries.en[match[1]], match[1]);
});
