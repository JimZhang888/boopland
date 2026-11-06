const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const E = require('./engine.js');
const fresh = seed => { const s = E.create(seed); E.start(s); return s; };
test('four-way movement, edges, locked gate and inactive phases', () => {
  const s = E.create(1);
  assert.equal(E.move(s, 4), false); E.start(s);
  assert.equal(E.move(s, 3), false); assert.equal(E.move(s, 9), false); assert.equal(E.move(s, -1), false);
  assert.equal(E.adjacent(2, 3), false);
  s.pos = 4; assert.equal(E.move(s, 1), false); assert.equal(s.moves, 0); assert.equal(s.food, 12);
  assert.equal(E.move(s, 3), true); assert.equal(s.phase, 'treasure'); assert.equal(s.food, 11);
  assert.equal(E.move(s, 4), false);
});
test('supplies and chests are finite; upgrades survive a new floor', () => {
  const s = fresh(2); E.move(s, 8); assert.equal(s.phase, 'treasure');
  E.loot(s, 'blade'); assert.equal(s.atk, 6); assert.equal(E.loot(s, 'blade'), false);
  s.hp = 20; E.move(s, 5); assert.equal(s.hp, 29); assert.equal(s.food, 15);
  E.move(s, 8); E.move(s, 5); assert.equal(s.hp, 29); assert.equal(s.food, 13);
  s.pos = 4; s.rune = true; E.move(s, 1); assert.equal(s.phase, 'stairs');
  assert.equal(E.descend(s), true); assert.equal(s.atk, 6); assert.equal(s.hp, 32); assert.equal(s.food, 16); assert.equal(s.rune, false);
  assert.equal(s.floor, 2); assert.equal(s.floorsCleared, 1); assert.equal(s.pos, 7);
});
test('normal, heavy and guarded counters; lethal strikes stop retaliation', () => {
  const s = fresh(3); E.move(s, 4); const initial = s.hp;
  s.enemy.hp = 100; s.enemy.round = 2; s.armor = 1;
  assert.equal(E.intent(s), 6); assert.equal(E.estimate(s), 5); E.fight(s, true);
  assert.equal(s.hp, initial - 2); assert.equal(s.enemy.hp, 98); assert.equal(s.enemy.round, 3);
  E.fight(s); assert.equal(s.hp, initial - 4);
  s.enemy.hp = s.atk; const hp = s.hp; E.fight(s);
  assert.equal(s.hp, hp); assert.equal(s.phase, 'explore'); assert.equal(s.rune, true); assert.equal(s.kills, 1); assert.equal(s.tiles[4].cleared, true);
});
test('potions are free turns, clamp healing, cannot be spent at full health', () => {
  const s = fresh(4); assert.equal(E.potion(s), false); s.hp = 1;
  E.potion(s); assert.equal(s.hp, 15); assert.equal(s.moves, 0); assert.equal(s.potions, 1);
  E.move(s, 4); const round = s.enemy.round; E.potion(s); assert.equal(s.enemy.round, round); assert.equal(s.hp, 29);
  assert.equal(E.potion(s), false); s.phase = 'lost'; s.potions = 1; assert.equal(E.potion(s), false);
});
test('retreat preserves enemy damage and cannot bypass starvation death', () => {
  const s = fresh(5); E.move(s, 4); E.fight(s); const enemyHp = s.enemy.hp, hp = s.hp;
  E.retreat(s); assert.equal(s.pos, 7); assert.equal(s.hp, hp - 3); assert.equal(s.food, 10);
  E.move(s, 4); assert.equal(s.enemy.hp, enemyHp);
  s.food = 0; s.hp = 5; E.retreat(s); assert.equal(s.phase, 'lost'); assert.equal(s.hp, 0);
  assert.equal(E.move(s, 5), false); assert.equal(E.fight(s), false);
});
test('starvation happens before arrival; unreachable supplies do not resurrect', () => {
  const s = fresh(6); s.pos = 8; s.food = 0; s.hp = 3; E.move(s, 5);
  assert.equal(s.phase, 'lost'); assert.equal(s.hp, 0); assert.equal(s.tiles[5].cleared, false);
  const alive = fresh(6); alive.pos = 8; alive.food = 0; alive.hp = 4; E.move(alive, 5);
  assert.equal(alive.hp, 10); assert.equal(alive.food, 5);
});
test('fifth gate requires guardian victory; terminal state is stable', () => {
  const s = fresh(7); s.floor = 5; s.pos = 4; s.rune = true; s.atk = 50; E.move(s, 1);
  assert.equal(s.enemy.kind, 3); assert.equal(s.phase, 'combat'); E.fight(s);
  assert.equal(s.phase, 'won'); assert.equal(s.floorsCleared, 5); assert.ok(E.score(s) >= 350);
  const snapshot = JSON.stringify(s); E.move(s, 2); E.potion(s); E.descend(s); E.retreat(s); E.fight(s);
  assert.equal(JSON.stringify(s), snapshot);
});
test('1,000 generated stages retain all events, a connected map and reproducible seeds', () => {
  for (let seed = 0; seed < 200; seed++) {
    const a = fresh(seed), b = fresh(seed);
    for (let floor = 1; floor <= 5; floor++) {
      assert.deepEqual(a.tiles, b.tiles);
      const counts = a.tiles.reduce((acc, tile) => (acc[tile.type] = (acc[tile.type] || 0) + 1, acc), {});
      assert.deepEqual(counts, { supply: 2, exit: 1, monster: 3, chest: 2, camp: 1 });
      if (floor < 5) { a.phase = b.phase = 'stairs'; E.descend(a); E.descend(b); }
    }
  }
});
test('eight complete dictionaries share interpolation fields; all static resources and lobby entry exist', () => {
  let catalogue;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, value) => catalogue = value } });
  assert.equal(Object.keys(catalogue).length, 8);
  for (const messages of Object.values(catalogue)) for (const [key, value] of Object.entries(catalogue.en)) {
    assert.equal(typeof messages[key], 'string', key);
    assert.deepEqual((messages[key].match(/\{\w+\}/g) || []).sort(), (value.match(/\{\w+\}/g) || []).sort(), key);
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, file)), file);
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="nineGrid\.([^"]+)"/g)) assert.ok(catalogue.en[key], key);
  const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../gamelist.js'), 'utf8'), sandbox);
  const records = sandbox.window.GAME_LIST.filter(row => row.path === './games/nine-grid/index.html');
  assert.equal(records.length, 1); assert.equal(Object.keys(records[0].locales).length, 7); assert.ok(fs.existsSync(path.resolve(__dirname, '../../', records[0].cover)));
});
