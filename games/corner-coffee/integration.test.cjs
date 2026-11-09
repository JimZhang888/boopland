const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const root = path.resolve(__dirname, '../..');
let translations;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register(scope, value) { assert.equal(scope, 'coffee'); translations = value; } } });
test('all eight dictionaries cover the UI, engine feedback and matching placeholders', () => {
  assert.equal(Object.keys(translations).length, 8);
  const keys = Object.keys(translations.en).sort();
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const [lang, dict] of Object.entries(translations)) {
    assert.deepEqual(Object.keys(dict).sort(), keys, lang);
    for (const key of keys) { assert.ok(dict[key].trim(), lang + '.' + key); assert.deepEqual(placeholders(dict[key]), placeholders(translations.en[key]), lang + '.' + key); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), script = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'), engine = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
  const references = [...[...html.matchAll(/data-i18n(?:-label)?="coffee\.([^"]+)"/g)].map(m => m[1]), ...[...script.matchAll(/\bt\('([a-zA-Z_]+)'/g)].map(m => m[1]), ...[...engine.matchAll(/result\('([a-zA-Z]+)'/g)].map(m => 'msg_' + m[1]).filter(k => k !== 'msg_inactive' && k !== 'msg_arrived'), ...Object.keys(E.ITEMS), ...Object.keys(E.UPGRADES).flatMap(k => [k, k + 'Description'])];
  for (const key of references.filter(key => !key.endsWith('_'))) assert.ok(translations.en[key], key);
  for (const key of ['quality_good', 'quality_weak', 'quality_bitter', 'msg_good', 'msg_weak', 'msg_bitter', ...Object.keys(E.ITEMS).filter(k => k !== 'espresso').map(k => 'action_' + k)]) assert.ok(translations.en[key], key);
});
test('all page resources are relative, exist, and language and analytics follow project conventions', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, resource] of html.matchAll(/(?:src|href)="([^"]+)"/g)) { assert.ok(!/^https?:|^\//.test(resource)); assert.ok(fs.existsSync(path.resolve(__dirname, resource)), resource); }
  assert.equal((html.match(/\.\.\/\.\.\/analytics.js/g) || []).length, 1); assert.ok(html.indexOf('../../i18n.js') < html.indexOf('translations.js')); assert.ok(html.includes('href="../../games.html"'));
});
test('lobby registers exactly one localized game with a local cover and preserves all existing entries', () => {
  const context = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const list = context.window.GAME_LIST, matches = list.filter(x => x.path === './games/corner-coffee/index.html');
  assert.equal(matches.length, 1); const entry = matches[0]; assert.equal(entry.title, translations['zh-CN'].name); assert.equal(entry.category, '休闲');
  for (const lang of Object.keys(translations).filter(k => k !== 'zh-CN')) { assert.equal(entry.locales[lang].title, translations[lang].name); assert.ok(entry.locales[lang].description.length > 10); }
  assert.ok(fs.existsSync(path.join(root, entry.cover))); assert.ok(list.some(x => x.path === './games/midnight-pancake/index.html')); assert.equal(new Set(list.map(x => x.path)).size, list.length);
});
