const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const lines = { edges: [{ a: 0, b: 1 }, { a: 2, b: 3 }] };
const p = (x, y) => ({ x, y });

test('proper crossings, touching endpoints and collinear overlaps stay tangled', () => {
  for (const nodes of [
    [p(100,100),p(900,900),p(100,900),p(900,100)],
    [p(100,100),p(500,500),p(500,500),p(800,100)],
    [p(100,100),p(900,100),p(300,100),p(700,100)],
    [p(100,100),p(900,100),p(500,100),p(500,900)]
  ]) {
    const result = E.analyze(lines, nodes);
    assert.equal(result.crossings.length, 1);
    assert.equal(result.solved, false);
  }
  assert.equal(E.analyze(lines, [p(100,100),p(900,100),p(100,900),p(900,900)]).solved, true);
});
test('adjacent yarn may bend or straighten, but cannot fold back over itself', () => {
  const chain = { edges: [{ a: 0, b: 1 }, { a: 1, b: 2 }] };
  assert.equal(E.analyze(chain, [p(100,100),p(500,100),p(900,100)]).solved, true);
  assert.equal(E.analyze(chain, [p(100,100),p(500,100),p(300,100)]).solved, false);
  assert.equal(E.analyze(chain, [p(100,100),p(500,100),p(500,800)]).solved, true);
});
test('collapsed and crowded nodes never count as solved', () => {
  assert.equal(E.analyze(lines, [p(100,100),p(110,100),p(100,900),p(900,900)]).solved, false);
  assert.equal(E.analyze(lines, Array.from({ length: 4 }, () => p(500,500))).solved, false);
});
test('all twelve levels start tangled and have a valid, separated solution', () => {
  assert.equal(E.levels.length, 12);
  for (const level of E.levels) {
    assert.equal(E.validNodes(level, level.initial), true, `initial ${level.id}`);
    assert.equal(E.analyze(level, level.initial).solved, false);
    assert.equal(E.analyze(level, level.initial).crowded.length, 0);
    assert.equal(E.analyze(level, level.solution).solved, true, `solution ${level.id}`);
    assert.equal(new Set(level.strands.flat()).size, level.initial.length);
  }
});
test('success spread preserves nonintersecting geometry throughout its animation', () => {
  for (const level of E.levels) {
    const to = E.spread(level.solution);
    assert.equal(E.validNodes(level, to), true);
    for (let frame = 0; frame <= 20; frame++) {
      const progress = frame / 20;
      const nodes = level.solution.map((p, i) => ({ x: p.x + (to[i].x - p.x) * progress, y: p.y + (to[i].y - p.y) * progress }));
      assert.equal(E.analyze(level, nodes).solved, true);
    }
  }
});
test('hints reach a real solution in at most one move per node', () => {
  for (const level of E.levels) {
    const nodes = E.clone(level.initial);
    for (let step = 0; step < nodes.length && !E.analyze(level, nodes).solved; step++) {
      const hint = E.hint(level, nodes); assert.ok(hint);
      assert.ok(nodes.every((node, id) => id === hint.id || E.distance(node, hint.point) >= E.GAP + 12));
      nodes[hint.id] = hint.point;
    }
    assert.equal(E.analyze(level, nodes).solved, true, `hint path ${level.id}`);
  }
});
test('storage validation rejects malformed, out-of-bounds and non-finite positions', () => {
  const level = E.levels[0];
  for (const value of [null, [], {}, [1,2,3,4], level.initial.map(() => ({x:Infinity,y:500})), level.initial.map(() => ({x:500,y:-1}))]) assert.equal(E.validNodes(level,value), false);
  assert.deepEqual(E.clamp(p(-100, 5000)), p(65,935));
});
test('hints also recover from 480 arbitrary player arrangements without stacking nodes', () => {
  let seed = 8231;
  const random = () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const level of E.levels) for (let trial = 0; trial < 40; trial++) {
    const nodes = level.initial.map(() => p(65 + random() * 870, 65 + random() * 870));
    for (let step = 0; step < nodes.length && !E.analyze(level, nodes).solved; step++) {
      const hint = E.hint(level, nodes);
      assert.ok(hint, `level ${level.id}, trial ${trial}`);
      assert.ok(nodes.every((node, id) => id === hint.id || E.distance(node, hint.point) >= E.GAP + 12));
      nodes[hint.id] = hint.point;
    }
    assert.equal(E.analyze(level, nodes).solved, true);
  }
});
test('eight dictionaries cover static and dynamic copy with matching placeholders', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'), { window: { BooplandI18n: { register: (_, data) => dictionaries = data } } });
  const keys = Object.keys(dictionaries.en).sort();
  assert.equal(Object.keys(dictionaries).length, 8);
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys, language);
    for (const key of keys) {
      assert.equal(typeof dictionary[key], 'string'); assert.ok(dictionary[key].length);
      assert.deepEqual((dictionary[key].match(/\{\w+\}/g) || []).sort(), (dictionaries.en[key].match(/\{\w+\}/g) || []).sort(), `${language}:${key}`);
    }
  }
  const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for (const [,key] of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) if (!key.includes('.')) assert.ok(keys.includes(key), key);
});
test('lobby has exactly one entry with valid assets and all seven other locales', () => {
  const root = path.resolve(__dirname,'../..'), context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'), context);
  const entries = context.window.GAME_LIST.filter(item => item.path === './games/yarn-untangle/index.html');
  assert.equal(entries.length, 1);
  for (const field of ['path','cover']) assert.ok(fs.existsSync(path.resolve(root,entries[0][field])));
  assert.equal(Object.keys(entries[0].locales).length, 7);
});
