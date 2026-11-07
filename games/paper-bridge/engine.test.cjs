'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const edge = (type, ax, ay, bx, by) => ({ type, a: { x: ax, y: ay }, b: { x: bx, y: by } });
function run(level, design, frame = 1 / 60) {
  const sim = E.createSimulation(level, design);
  for (let n = 0; n < 4000 && sim.status === 'running'; n++) E.advance(sim, frame);
  return sim;
}
for (const [i, level] of E.LEVELS.entries()) {
  test(`crossing ${i + 1}: legal, affordable reference bridge carries the actual vehicle`, () => {
    const design = E.example(level), accepted = [];
    for (const member of design) {
      assert.equal(E.validate(level, accepted, member), null);
      accepted.push(member);
    }
    assert.equal(E.connected(level, design), true);
    const sim = run(level, design);
    assert.equal(sim.status, 'won'); assert.equal(sim.broken, 0);
    assert.ok(sim.car.x > level.right + 60);
    assert.ok(sim.maxStress > 0.1 && sim.maxStress < 1);
    for (const n of sim.nodes) {
      assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
      if (n.fixed) { assert.equal(n.x, n.ox); assert.equal(n.y, n.oy); }
    }
  });
}
test('a connected but unbraced deck collapses; connectivity alone cannot win', () => {
  const level = E.LEVELS[0], design = E.example(level).filter(e => e.type === 'road');
  assert.equal(E.connected(level, design), true);
  const sim = run(level, design);
  assert.equal(sim.status, 'lost'); assert.ok(sim.broken > 0); assert.equal(E.stars(level, design, sim), 0);
});
test('every crossing has an achievable three-star design, including the heavy delivery', () => {
  for (const [i, level] of E.LEVELS.entries()) {
    const design = E.example(level);
    // The heavy crossing's generous guide includes a redundant safety cable.
    // Omitting that cable demonstrates the optional economy challenge.
    if (i === 4) design.pop();
    const sim = run(level, design);
    assert.equal(E.stars(level, design, sim), 3, `crossing ${i + 1}`);
  }
});
test('missing road pieces prevent a continuous crossing even with a complete timber frame', () => {
  const level = E.LEVELS[0], design = E.example(level).filter((_, i) => i !== 2);
  assert.equal(E.connected(level, design), false);
  assert.equal(run(level, design).status, 'lost');
});
test('a vehicle load changes member stress and does not mutate the editor design', () => {
  const level = E.LEVELS[0], design = E.example(level), original = JSON.stringify(design);
  const empty = run({ ...level, mass: 0 }, design), loaded = run(level, design);
  assert.ok(loaded.maxStress > empty.maxStress * 1.1);
  assert.equal(JSON.stringify(design), original);
});
test('ropes are unilateral constraints: a slack rope cannot push its endpoints apart', () => {
  const sim = E.createSimulation(E.LEVELS[2], [edge('rope', 280, 160, 360, 320)]);
  sim.nodes[1].x = 300; sim.nodes[1].y = 200;
  E.advance(sim, E.DT);
  assert.equal(sim.edges[0].lambda, 0);
  assert.equal(sim.edges[0].stress, 0);
  assert.equal(sim.nodes[1].x, 300);
  assert.ok(sim.nodes[1].y > 200);
});
test('timber pushes back under compression, unlike a rope', () => {
  const sim = E.createSimulation(E.LEVELS[0], [edge('wood', 320, 320, 360, 240)]);
  sim.nodes[1].x = 325; sim.nodes[1].y = 300;
  E.advance(sim, E.DT);
  assert.ok(sim.edges[0].lambda > 0);
  assert.ok(E.distance(sim.nodes[0], sim.nodes[1]) > Math.hypot(5, 20));
});
test('excessive weight breaks a bridge that can carry the normal car', () => {
  const level = { ...E.LEVELS[0], mass: 45 };
  const sim = run(level, E.example(level));
  assert.equal(sim.status, 'lost'); assert.ok(sim.broken > 0);
});
test('fixed-step outcomes are consistent at 30, 60 and 144 FPS', () => {
  const level = E.LEVELS[1], design = E.example(level);
  const results = [30, 60, 144].map(fps => run(level, design, 1 / fps));
  assert.ok(results.every(s => s.status === 'won' && s.broken === 0));
  assert.ok(Math.max(...results.map(s => s.time)) - Math.min(...results.map(s => s.time)) < E.DT * 1.1);
});
test('pause and completed simulations do not advance', () => {
  const level = E.LEVELS[0], sim = E.createSimulation(level, E.example(level));
  sim.paused = true; E.advance(sim, 1); assert.equal(sim.time, 0);
  sim.paused = false; E.advance(sim, 1 / 60); assert.ok(sim.time > 0);
  sim.status = 'lost'; const before = JSON.stringify(sim); E.advance(sim, 1 / 60); assert.equal(JSON.stringify(sim), before);
});
test('a long inactive frame is capped rather than skipping the crossing', () => {
  const sim = E.createSimulation(E.LEVELS[0], E.example(E.LEVELS[0]));
  E.advance(sim, 3600); assert.ok(sim.time <= 0.11); assert.equal(sim.status, 'running');
});
test('material limits, maximum lengths, slope, bounds and budget are enforced', () => {
  const l = E.LEVELS[0], deck = edge('road', 320, 320, 400, 320);
  assert.equal(E.validate(l, [], edge('road', 320, 320, 480, 320)), 'long');
  assert.equal(E.validate(l, [], edge('road', 320, 320, 360, 280)), 'slope');
  assert.equal(E.validate(l, [], edge('wood', 280, 320, 320, 320)), 'bounds');
  assert.equal(E.validate(l, [], edge('wood', 320, 320, 321, 240)), 'bounds');
  assert.equal(E.validate(l, [], edge('rope', 320, 320, 360, 240)), 'stock');
  assert.equal(E.validate({ ...l, budget: 119 }, [], deck), 'budget');
  const full = E.example(l).filter(e => e.type === 'road');
  assert.equal(E.validate(l, full, edge('road', 320, 280, 400, 280)), 'stock');
});
test('duplicates and partial overlap are rejected; endpoint joins are allowed', () => {
  const l = E.LEVELS[0], first = edge('road', 320, 320, 400, 320);
  assert.equal(E.validate(l, [first], edge('wood', 400, 320, 320, 320)), 'duplicate');
  assert.equal(E.validate(l, [first], edge('road', 360, 320, 440, 320)), 'overlap');
  assert.equal(E.validate(l, [first], edge('road', 400, 320, 480, 320)), null);
});
test('costs track lengths and removal refunds the full member cost', () => {
  const design = E.example(E.LEVELS[0]), all = E.usage(design), removed = design.pop(), after = E.usage(design);
  assert.equal(all.spent - after.spent, E.cost(removed));
  assert.equal(all.counts[removed.type] - after.counts[removed.type], 1);
  assert.equal(E.cost(edge('road', 320, 320, 400, 320)), 120);
});
test('save validation rejects malformed, over-budget, duplicate and non-finite designs', () => {
  const l = E.LEVELS[0], valid = E.example(l);
  assert.deepEqual(E.sanitizeDesign(l, valid), valid);
  for (const invalid of [null, {}, [null], [{ a: {}, b: {}, type: 'metal' }], [edge('constructor', 320, 320, 400, 320)], [edge('__proto__', 320, 320, 400, 320)], [edge('road', Infinity, 320, 400, 320)], [...valid, valid[0]], Array(100).fill(valid[0])]) assert.deepEqual(E.sanitizeDesign(l, invalid), []);
});
test('star rating independently rewards arrival, intact members and budget savings', () => {
  const l = E.LEVELS[0], design = E.example(l);
  assert.equal(E.stars(l, design, { status: 'won', broken: 0 }), 3);
  assert.equal(E.stars(l, design, { status: 'won', broken: 1 }), 2);
  assert.equal(E.stars({ ...l, budget: 1400 }, design, { status: 'won', broken: 0 }), 2);
});
test('all UI messages have eight complete nonempty translations and matching interpolation tokens', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, value) => { dictionaries = value; } } });
  assert.equal(Object.keys(dictionaries).length, 8);
  const reference = dictionaries['zh-CN'];
  for (const [language, dict] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dict), Object.keys(reference));
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(typeof value === 'string' && value.length > 0, `${language}.${key}`);
      assert.deepEqual((value.match(/\{\w+\}/g) || []).sort(), (reference[key].match(/\{\w+\}/g) || []).sort(), `${language}.${key}`);
    }
  }
});
test('lobby entry is unique, localized and points at existing static resources', () => {
  const root = path.resolve(__dirname, '../..'), context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(e => e.path === './games/paper-bridge/index.html');
  assert.equal(entries.length, 1); assert.equal(Object.keys(entries[0].locales).length, 7);
  assert.ok(fs.existsSync(path.join(root, entries[0].cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, match[1])), match[1]);
  assert.match(html, /href="\.\.\/\.\.\/games\.html"/);
  assert.equal((html.match(/src="\.\.\/\.\.\/analytics\.js"/g) || []).length, 1);
  assert.ok(!/type="module"|https?:\/\//.test(html));
});
