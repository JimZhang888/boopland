const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const root = path.resolve(__dirname, '../..');
let translations;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), {
  BooplandI18n: { register(scope, value) { assert.equal(scope, 'pancake'); translations = value; } }
});

test('every translated message exists in all eight languages with the same placeholders', () => {
  assert.deepEqual(Object.keys(translations).sort(), ['de','en','es','fr','ja','ko','pt-BR','zh-CN']);
  const keys = Object.keys(translations.en).sort();
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [language, dictionary] of Object.entries(translations)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys, language);
    for (const key of keys) {
      assert.equal(typeof dictionary[key], 'string', language + '.' + key);
      assert.ok(dictionary[key].trim(), language + '.' + key);
      assert.deepEqual(placeholders(dictionary[key]), placeholders(translations.en[key]), language + '.' + key);
    }
  }
});
test('UI translation references resolve, including the cooking states', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  const keys = new Set([
    ...[...html.matchAll(/data-i18n(?:-[\w-]+)?="pancake\.([^"]+)"/g)].map(match => match[1]),
    ...[...script.matchAll(/\bt\('([\w]+)'/g)].map(match => match[1]).filter(key => !['guest', 'phase'].includes(key)),
    'frontCooking', 'backCooking', 'frontReady', 'backReady', 'empty', 'wrapped', 'burnt', 'danger',
    ...E.INGREDIENTS
  ]);
  for (const key of keys) assert.equal(typeof translations.en[key], 'string', key);
});
test('entry point and relative resources are valid for file URLs and subdirectory hosting', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const resource = match[1]; assert.ok(!/^https?:|^\//.test(resource), resource);
    assert.ok(fs.existsSync(path.resolve(__dirname, resource)), resource);
  }
  assert.equal((html.match(/\.\.\/\.\.\/analytics\.js/g) || []).length, 1);
  assert.ok(html.indexOf('../../i18n.js') < html.indexOf('translations.js'));
  assert.ok(html.includes('href="../../games.html"'));
});
test('the lobby has one complete localized entry with an existing cover', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(item => item.path === './games/midnight-pancake/index.html');
  assert.equal(entries.length, 1); const entry = entries[0];
  assert.equal(entry.title, translations['zh-CN'].name); assert.equal(entry.category, '休闲');
  assert.ok(fs.existsSync(path.join(root, entry.cover)));
  for (const lang of Object.keys(translations).filter(lang => lang !== 'zh-CN')) {
    assert.equal(entry.locales[lang].title, translations[lang].name);
    assert.ok(entry.locales[lang].description.length > 10);
  }
});
test('a full shift can be completed with two pans, growing recipes, and long combos', () => {
  let seed = 13;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const game = new E.Game(random), targets = [null, null]; game.start();
  const phases = new Set();
  while (game.state === 'playing') {
    phases.add(game.phase);
    for (let index = 0; index < 2; index++) {
      game.select(index); const pan = game.pan;
      if (pan.stage === 'empty') {
        targets[index] = null;
        const order = game.orders.find(order => order && order.id !== targets[1 - index]?.id);
        if (order) { targets[index] = { id: order.id, mask: order.mask }; game.action(); }
      } else if (pan.stage === 'front' && pan.heat >= E.FRONT_READY) game.action();
      else if (pan.stage === 'back') {
        const missing = E.INGREDIENTS.findIndex((_, i) => (targets[index].mask & (1 << i)) && !(pan.ingredients & (1 << i)));
        if (missing >= 0) game.ingredient(missing);
        else if (pan.heat >= E.BACK_READY) game.action();
      } else if (pan.stage === 'wrapped') {
        const slot = game.orders.findIndex(order => order && order.id === targets[index].id && order.mask === pan.ingredients);
        assert.ok(slot >= 0, 'a prepared order must still have a customer');
        assert.equal(game.serve(slot).ok, true); targets[index] = null;
      }
    }
    game.tick(200);
  }
  assert.equal(game.state, 'finished'); assert.equal(phases.size, 3);
  assert.ok(game.served >= 20, 'skillful play should serve at least twenty customers');
  assert.ok(game.bestCombo >= 10); assert.equal(game.waste, 0); assert.equal(game.missed, 0);
  assert.equal(game.coins, Math.floor(game.coins)); assert.ok(game.coins > 300);
});
