const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
let messages;
vm.runInNewContext(read('translations.js'), { BooplandI18n: { register(scope, catalog) { assert.equal(scope, 'gin'); messages = catalog; } } });

test('eight languages cover every message and preserve interpolation parameters', () => {
  assert.deepEqual(Object.keys(messages).sort(), ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR'].sort());
  const keys = Object.keys(messages.en).sort();
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [language, values] of Object.entries(messages)) {
    assert.deepEqual(Object.keys(values).sort(), keys, language);
    for (const key of keys) {
      assert.equal(typeof values[key], 'string');
      assert.ok(values[key].trim().length, language + ': ' + key);
      assert.deepEqual(placeholders(values[key]), placeholders(messages.en[key]), language + ': ' + key);
    }
  }
  for (const match of read('index.html').matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g)) {
    if (match[1].startsWith('common.')) continue;
    for (const values of Object.values(messages)) assert.ok(values[match[1]], match[1]);
  }
  for (const match of read('game.js').matchAll(/(?<![\w.])t\('([^']+)'\s*[,)]/g)) assert.ok(messages.en[match[1]], match[1]);
});

test('the lobby registers one local entry, a cover and all seven translated cards', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(item => item.path === './games/gin-rummy/index.html');
  assert.equal(entries.length, 1);
  const game = entries[0];
  assert.equal(game.category, '棋牌');
  assert.ok(fs.existsSync(path.join(root, game.path)));
  assert.ok(fs.existsSync(path.join(root, game.cover)));
  for (const language of ['en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR']) {
    assert.ok(game.locales[language].title);
    assert.ok(game.locales[language].description);
  }
});

test('all entry resources exist and are relative; shared scripts load in order', () => {
  const html = read('index.html');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    assert.ok(target.startsWith('./') || target.startsWith('../'), target);
    assert.ok(fs.existsSync(path.resolve(__dirname, target.split('?')[0])), target);
  }
  assert.ok(html.indexOf('../../i18n.js') < html.indexOf('./translations.js'));
  assert.ok(html.indexOf('./engine.js') < html.indexOf('./game.js'));
  assert.equal((html.match(/analytics\.js/g) || []).length, 1);
  assert.match(html, /href="\.\.\/\.\.\/games.html"/);
  assert.doesNotMatch(read('game.js'), /\bfetch\s*\(/);
});
