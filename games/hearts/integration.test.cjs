const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
let catalogue;
vm.runInNewContext(read('translations.js'), { BooplandI18n: { register(scope, messages) { assert.equal(scope, 'hearts'); catalogue = messages; } } });
const languages = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR'];

test('eight complete translation dictionaries have identical keys and placeholders', () => {
  assert.deepEqual(Object.keys(catalogue).sort(), languages.slice().sort());
  const keys = Object.keys(catalogue.en).sort();
  const slots = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const lang of languages) {
    assert.deepEqual(Object.keys(catalogue[lang]).sort(), keys);
    for (const key of keys) {
      assert.ok(catalogue[lang][key].trim(), lang + ':' + key);
      assert.deepEqual(slots(catalogue[lang][key]), slots(catalogue.en[key]), lang + ':' + key);
      assert.ok(!/\{\s|\s\}/.test(catalogue[lang][key]), 'invalid placeholder ' + lang + ':' + key);
    }
  }
});

test('HTML language bindings, scripts, styles and local assets resolve', () => {
  const html = read('index.html');
  for (const [, key] of html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g)) {
    assert.ok(key.startsWith('common.') || Object.hasOwn(catalogue.en, key), key);
  }
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(url.startsWith('./') || url.startsWith('../'));
    assert.ok(fs.existsSync(path.resolve(__dirname, url)), url);
  }
  for (const [, url] of read('style.css').matchAll(/url\('([^']+)'\)/g)) {
    assert.ok(fs.existsSync(path.resolve(__dirname, url)), url);
  }
  assert.equal((html.match(/src="\.\.\/\.\.\/analytics.js"/g) || []).length, 1);
});

test('lobby contains one Hearts record with all seven translated cards and valid cover', () => {
  const context = { window: {} };
  vm.runInNewContext(read('../../gamelist.js'), context);
  const records = context.window.GAME_LIST.filter(game => game.path === './games/hearts/index.html');
  assert.equal(records.length, 1);
  assert.equal(records[0].category, '棋牌');
  assert.ok(fs.existsSync(path.resolve(__dirname, '../..', records[0].cover)));
  for (const lang of languages.slice(1)) {
    assert.ok(records[0].locales[lang].title);
    assert.ok(records[0].locales[lang].description);
  }
});
