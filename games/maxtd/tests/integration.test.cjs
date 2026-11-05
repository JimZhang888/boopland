const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const messages = require('../i18n.js');
const { TYPES, Game } = require('../engine.js');
const root = path.resolve(__dirname, '../../..');
const gameRoot = path.resolve(__dirname, '..');
const languages = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR'];

test('all eight catalogues cover every message, unit and interpolation parameter', () => {
  assert.deepEqual(Object.keys(messages), languages);
  const keys = Object.keys(messages.en).sort();
  const params = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const code of languages) {
    assert.deepEqual(Object.keys(messages[code]).sort(), keys, code);
    for (const key of keys) {
      assert.ok(messages[code][key].trim(), `${code}.${key}`);
      assert.deepEqual(params(messages[code][key]), params(messages.en[key]), `${code}.${key}`);
    }
    for (const type of Object.keys(TYPES)) for (const key of ['name', 'role', 'description']) {
      assert.ok(messages[code][`unit.${type}.${key}`], `${code}.${type}.${key}`);
    }
    const game = new Game(); game.money = 0;
    const failure = game.place('rifle', 2, 2);
    assert.equal(failure.code, 'funds');
    assert.ok(messages[code]['error.' + failure.code].includes('{needed}'));
  }
});

test('HTML bindings resolve and static resources work at the nested file path', () => {
  const html = fs.readFileSync(path.join(gameRoot, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label|-title)?="([^"]+)"/g)) {
    if (key.startsWith('common.')) continue;
    assert.ok(key.startsWith('maxtd.'), key);
    for (const code of languages) assert.ok(messages[code][key.slice(6)], `${code}.${key}`);
  }
  for (const [, resource] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(!/^(?:https?:|\/)/.test(resource), resource);
    assert.ok(fs.existsSync(path.resolve(gameRoot, resource)), resource);
  }
  assert.ok(html.indexOf('../../i18n.js') < html.indexOf('src="i18n.js"'));
  assert.ok(html.includes('data-language-select'));
});

test('lobby has one MaxTD entry with an existing cover and seven translated cards', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(game => game.path === './games/maxtd/index.html');
  assert.equal(entries.length, 1);
  assert.ok(fs.existsSync(path.resolve(root, entries[0].cover)));
  for (const code of languages.slice(1)) for (const key of ['title', 'description', 'category']) {
    assert.ok(entries[0].locales[code][key], `${code}.${key}`);
  }
});

test('shared language works without storage and preserves file-link parameters', () => {
  const listeners = {};
  const location = { href: 'file:///D:/boopland/boopland/games/maxtd/index.html?lang=pt-BR' };
  const context = {
    URL, location,
    document: {
      currentScript: { src: 'file:///D:/boopland/boopland/i18n.js' },
      documentElement: { dataset: {} },
      querySelectorAll: () => [], addEventListener() {}
    },
    localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } },
    history: { replaceState(_state, _title, href) { location.href = href; } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    window: { addEventListener(type, fn) { listeners[type] = fn; }, dispatchEvent() {} }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(gameRoot, 'i18n.js'), 'utf8'), context);
  const i18n = context.window.BooplandI18n;
  assert.equal(i18n.language, 'pt-BR');
  assert.equal(i18n.t('maxtd.error.funds', { needed: 55 }), 'Recursos insuficientes. Faltam 55.');
  const back = new URL(i18n.withLanguage('../../games.html?view=all#cards'));
  assert.equal(back.pathname, '/D:/boopland/boopland/games.html');
  assert.equal(back.searchParams.get('view'), 'all');
  assert.equal(back.searchParams.get('lang'), 'pt-BR');
  assert.equal(back.hash, '#cards');
  listeners.storage({ key: 'boopland-language', newValue: 'ja' });
  assert.equal(i18n.language, 'ja');
  assert.equal(i18n.setLanguage('invalid'), false);
  assert.equal(i18n.language, 'ja');
});
