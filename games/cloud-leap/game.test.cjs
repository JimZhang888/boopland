const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chargePower, jumpDistance, landingPoint, classifyLanding, idealPower, landingPowerRange } = require('./physics.js');
test('charge is capped and supports quick taps', () => {
  assert.equal(chargePower(-50), 0); assert.equal(chargePower(600), .5);
  assert.equal(chargePower(1200), 1); assert.equal(chargePower(60000), 1);
  assert.equal(jumpDistance(0), 32); assert.equal(jumpDistance(1), 452);
});
test('ideal charge reaches both directions across the island distance range', () => {
  for (const direction of [-1, 1]) for (let distance = 172; distance <= 280; distance += 9) {
    const start = { x: 184, y: -850 }, target = { x: start.x + direction * distance, y: start.y - 110, rx: 64, ry: 29 };
    assert.equal(classifyLanding(landingPoint(start, target, idealPower(start, target)), target), 'perfect');
  }
});
test('elliptical landing rejects overshoots, undershoots and points outside the rim', () => {
  const start = { x: 0, y: 0 }, target = { x: 210, y: -100, rx: 65, ry: 30 };
  assert.equal(classifyLanding(landingPoint(start, target, 0), target), 'miss');
  assert.equal(classifyLanding(landingPoint(start, target, 1), target), 'miss');
  assert.equal(classifyLanding({ x: 240, y: -100 }, target), 'safe');
  assert.equal(classifyLanding({ x: 210, y: -70 }, target), 'safe');
  assert.equal(classifyLanding({ x: 210, y: -69.99 }, target), 'miss');
});
test('the complete visible island rim is landable, just outside it is not', () => {
  for (const [rx, ry] of [[62, 28], [70, 30], [83, 35]]) {
    const island = {x: -205, y: -1080, rx, ry};
    for (let angle = 0; angle < 2 * Math.PI; angle += .05) {
      const point = radius => ({x: island.x + Math.cos(angle) * rx * radius, y: island.y + Math.sin(angle) * ry * radius});
      assert.equal(classifyLanding(point(.97), island), 'safe');
      assert.equal(classifyLanding(point(1), island), 'safe');
      assert.equal(classifyLanding(point(1.001), island), 'miss');
    }
  }
});
test('perfect scoring matches the visible 25 by 10 flower ring', () => {
  const island = {x: 0, y: 0, rx: 62, ry: 28};
  for (let angle = 0; angle < 2 * Math.PI; angle += .05) {
    const point = radius => ({x: Math.cos(angle) * 25 * radius, y: Math.sin(angle) * 10 * radius});
    assert.equal(classifyLanding(point(1), island), 'perfect');
    assert.equal(classifyLanding(point(1.001), island), 'safe');
  }
});
test('charge interval matches both landing edges from off-centre starts in either direction', () => {
  for (const direction of [-1, 1]) for (const offset of [-40, 0, 40]) for (const distance of [172, 209, 280]) {
    const start = {x: offset, y: 10}, target = {x: direction * distance, y: -110, rx: 62, ry: 28};
    const range = landingPowerRange(start, target);
    for (const power of [range.min, (range.min + range.max) / 2, range.max]) {
      assert.notEqual(classifyLanding(landingPoint(start, target, power), target), 'miss');
    }
    for (const power of [range.min - .0001, range.max + .0001]) {
      assert.equal(classifyLanding(landingPoint(start, target, power), target), 'miss');
    }
  }
});
test('all eight languages contain every UI message and matching placeholders', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { window: { BooplandI18n: { register(scope, values) { assert.equal(scope, 'cloudLeap'); dictionaries = values; } } } });
  assert.equal(Object.keys(dictionaries).length, 8);
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary), Object.keys(dictionaries.en), language);
    for (const [key, value] of Object.entries(dictionary)) { assert.ok(value.trim(), `${language}.${key}`); assert.deepEqual(placeholders(value), placeholders(dictionaries.en[key])); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  const bound = [...html.matchAll(/data-i18n(?:-label|-title)?="cloudLeap\.([^"]+)"/g)].map(m => m[1]);
  const dynamic = [...script.matchAll(/\bt\('([^']+)'(?=[,)])/g)].map(m => m[1]);
  for (const key of [...bound, ...dynamic]) assert.ok(dictionaries.en[key], key);
});
test('lobby entry is unique, localized and points to local non-module resources', () => {
  const root = path.resolve(__dirname, '../..'), scope = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), scope);
  const matches = scope.window.GAME_LIST.filter(item => item.path === './games/cloud-leap/index.html');
  assert.equal(matches.length, 1); assert.equal(Object.keys(matches[0].locales).length, 7);
  assert.ok(fs.existsSync(path.resolve(root, matches[0].cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('href="../../games.html"'));
  assert.ok(!/type="module"|https?:\/\//.test(html));
  for (const [, resource] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, resource)), resource);
  assert.ok(!/@import|https?:\/\//.test(fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8')));
});
