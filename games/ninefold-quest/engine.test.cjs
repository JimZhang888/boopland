const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('./engine.js');
const find = (s, type) => s.tiles.findIndex(t => t.type === type && !t.done);
const resolve = (s, type, action) => { assert.equal(E.select(s, find(s, type)), true); if (action) assert.equal(E.act(s, action), true); };
test('100 seeded maps have one of each encounter, two enemies, and deterministic layouts', () => {
  for (let seed = 0; seed < 100; seed++) {
    const s = E.create(seed); assert.deepEqual(s, E.create(seed));
    assert.equal(s.tiles.length, 9); assert.equal(s.tiles[4].type, 'camp');
    assert.equal(s.tiles[1].type, 'boss');
    assert.equal(s.tiles.filter(t => t.type === 'enemy').length, 2);
    for (const type of ['spring','trap','event','merchant','chest']) assert.equal(s.tiles.filter(t => t.type === type).length, 1);
  }
});
test('guardian requires four resolved encounters; camp and reveals do not count', () => {
  const s = E.create(10); assert.equal(E.select(s, 1), false);
  s.hp = 20; resolve(s, 'camp', 'rest'); assert.equal(E.resolved(s), 0);
  resolve(s, 'chest'); resolve(s, 'spring', 'bottle'); resolve(s, 'trap', 'careful');
  assert.equal(E.select(s, 1), false); resolve(s, 'event', 'leave');
  assert.equal(E.resolved(s), 4); assert.equal(E.select(s, 1), true);
});
test('combat matches preview, one-hit victories take no damage, no duplicate rewards', () => {
  const s = E.create(15), i = find(s, 'enemy'); E.select(s, i);
  const expected = E.combat(s, s.tiles[i]);
  assert.equal(E.act(s, 'fight'), true); assert.equal(s.hp, 30 - expected.damage);
  const gold = s.gold; assert.equal(E.act(s, 'fight'), false); assert.equal(E.select(s, i), false); assert.equal(s.gold, gold);
  s.attack = 100; resolve(s, 'enemy'); const hp = s.hp; E.act(s, 'fight'); assert.equal(s.hp, hp);
});
test('power is limited to once per floor; potions cap healing and never resurrect', () => {
  const s = E.create(3); resolve(s, 'enemy', 'power'); assert.equal(s.focus, 0);
  resolve(s, 'enemy'); assert.equal(E.can(s, 'power'), false); assert.equal(E.act(s, 'power'), false);
  s.hp = 29; assert.equal(E.potion(s), true); assert.equal(s.hp, 30); assert.equal(s.potions, 0);
  assert.equal(E.potion(s), false); s.status = 'lost'; s.potions = 1; s.hp = 0; assert.equal(E.potion(s), false);
});
test('shops enforce prices and offer only one purchase', () => {
  const s = E.create(0); resolve(s, 'merchant'); assert.equal(E.act(s, 'buyBlade'), false);
  s.gold = 10; assert.equal(E.act(s, 'buyBlade'), true); assert.equal(s.attack, 5); assert.equal(s.gold, 0);
  assert.equal(E.act(s, 'buyPotion'), false);
});
test('lethal fights stop progression and do not award gold', () => {
  const s = E.create(0); s.hp = 1; resolve(s, 'enemy', 'fight');
  assert.equal(s.hp, 0); assert.equal(s.status, 'lost'); assert.equal(s.gold, 0); assert.equal(E.select(s, 0), false);
});
test('upgrades, weather, victory and round-trip saves work through all five floors', () => {
  const s = E.create(8); s.attack = 100;
  for (let floor = 1; floor <= 5; floor++) {
    assert.equal(s.floor, floor); resolve(s, 'chest'); resolve(s, 'spring', 'bottle'); resolve(s, 'trap', 'careful'); resolve(s, 'event', 'leave');
    assert.deepEqual(E.restore(JSON.stringify(s)), s);
    resolve(s, 'boss', 'fight'); assert.equal(s.cleared, floor);
    if (floor < 5) { assert.equal(s.status, 'upgrade'); E.act(s, 'shield'); assert.equal(s.focus, 1); }
  }
  assert.equal(s.status, 'won'); assert.equal(s.floor, 5); assert.equal(E.select(s, 0), false);
  assert.equal(E.score(s), s.cleared*100+s.explored*10+s.gold+200+s.hp*5);
});
test('saved RNG state continues identically; corrupt saves recover cleanly', () => {
  const s = E.create(3); const restored = E.restore(JSON.stringify(s));
  const i = find(s, 'event'); s.tiles[i].variant = 2; restored.tiles[i].variant = 2;
  E.select(s, i); E.select(restored, i); E.act(s, 'accept'); E.act(restored, 'accept'); assert.deepEqual(restored, s);
  for (const raw of ['oops', 'null', '{}', JSON.stringify({...s, hp:-1}), JSON.stringify({...s, pending:9}), JSON.stringify({...s, tiles:[]})]) assert.equal(E.restore(raw), null);
});
test('spring trades 16 immediate health against a portable 12-health potion', () => {
  const s = E.create(1); s.hp = 5; resolve(s, 'spring', 'drink'); assert.equal(s.hp, 21);
  const other = E.create(1); other.hp = 5; resolve(other, 'spring', 'bottle'); assert.equal(other.hp, 5); E.potion(other); assert.equal(other.hp, 17);
});
test('a resource-conscious strategy can win 200 seeds with ordinary starting stats', () => {
  for (let seed = 0; seed < 200; seed++) {
    const s = E.create(seed);
    for (let floor = 1; floor <= 5; floor++) {
      resolve(s, 'chest'); resolve(s, 'trap', 'careful'); resolve(s, 'spring', 'bottle');
      const ev = s.tiles[find(s,'event')];
      resolve(s, 'event', ev.variant === 2 || (ev.variant === 1 && s.gold < 8) ? 'leave' : 'accept');
      resolve(s, 'merchant', s.gold >= 10 ? 'buyBlade' : 'leave');
      for (let k=0;k<2;k++) { if (s.hp <= s.maxHp-12) E.potion(s); resolve(s,'enemy','fight'); }
      if (s.hp < s.maxHp) resolve(s, 'camp', 'rest');
      while (s.potions && s.hp < s.maxHp-5) E.potion(s);
      resolve(s, 'boss', 'power');
      if (s.status === 'upgrade') E.act(s,'shield');
    }
    assert.equal(s.status,'won', 'seed '+seed);
  }
});
test('all eight dictionaries contain every key, parameter and used literal translation', () => {
  let dict; vm.runInNewContext(fs.readFileSync(__dirname+'/translations.js','utf8'),{BooplandI18n:{register:(_, d)=>dict=d}});
  assert.equal(Object.keys(dict).length, 8); const keys = Object.keys(dict.en).sort();
  for (const [lang, values] of Object.entries(dict)) {
    assert.deepEqual(Object.keys(values).sort(), keys);
    for (const key of keys) { assert.equal(typeof values[key], 'string', lang+'.'+key); assert.ok(values[key].length); assert.deepEqual((values[key].match(/\{\w+\}/g)||[]).sort(),(dict.en[key].match(/\{\w+\}/g)||[]).sort()); }
  }
  const js=fs.readFileSync(__dirname+'/game.js','utf8');
  for (const match of js.matchAll(/\bt(?:r)?\('([A-Za-z]+)'[,)]/g)) assert.ok(dict.en[match[1]],match[1]);
});
