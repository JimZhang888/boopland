const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Game, TYPES, COLS, ROWS, ENTRY, EXIT, key } = require('../engine.js');

const emptyGame = () => { const g = new Game({ starter: false }); g.money = 100000; return g; };
const tick = (g, seconds, untilCleared = Infinity) => { for (let i = 0; i < seconds * 60 && g.status === 'wave' && g.cleared < untilCleared; i++) g.update(1 / 60); };
const enemyAt = (g, x, y, type = 'small') => { const e = g.spawn(type); Object.assign(e, { x, y, toX: Math.floor(x), toY: Math.floor(y), hp: 1000, maxHp: 1000 }); return e; };

test('starter field includes only reachable ground units and a valid entrance-to-home path', () => {
  const g = new Game();
  assert.equal(g.buildings.length, 6); assert.equal(g.money, 320); assert.equal(g.lives, 20);
  const path = g.path(); assert.deepEqual(path[0], ENTRY); assert.deepEqual(path.at(-1), EXIT);
  assert.equal(path.length, 20); assert.equal(g.enemies.length, 0);
});

test('walls reroute enemies but completing a solid column is rejected atomically', () => {
  const g = emptyGame();
  for (let y = 0; y < ROWS - 1; y++) assert.equal(g.place('wall', 10, y).ok, true);
  assert.ok(g.path().length > COLS); assert.ok(g.path().some(p => p.y === 12));
  const before = g.money, count = g.buildings.length;
  const result = g.place('wall', 10, ROWS - 1);
  assert.equal(result.ok, false); assert.match(result.reason, /封路/);
  assert.equal(g.money, before); assert.equal(g.buildings.length, count);
});

test('entrance, exit, invalid cells and occupied cells reject construction', () => {
  const g = emptyGame();
  for (const [x, y] of [[0, 6], [19, 6], [-1, 0], [20, 0], [1.2, 2]]) assert.equal(g.place('wall', x, y).ok, false);
  assert.equal(g.place('rifle', 3, 4).ok, true); assert.equal(g.place('wall', 3, 4).ok, false);
});

test('building cannot overlap an enemy or the cell it is moving toward', () => {
  const g = emptyGame(); g.wave = 1;
  const e = enemyAt(g, 5.8, 6.5); e.toX = 6; e.toY = 6;
  assert.equal(g.place('wall', 5, 6).ok, false); assert.equal(g.place('wall', 6, 6).ok, false);
  assert.equal(g.place('wall', 5, 5).ok, true);
});

test('placement also protects stranded enemies away from the entrance route', () => {
  const g = emptyGame(); g.wave = 1;
  enemyAt(g, 10.5, 2.5);
  for (const [x, y] of [[9, 2], [11, 2], [10, 1]]) assert.equal(g.place('wall', x, y).ok, true);
  const result = g.place('wall', 10, 3);
  assert.equal(result.ok, false); assert.match(result.reason, /困住/);
  assert.ok(Number.isFinite(g.field[key(ENTRY.x, ENTRY.y)]));
});

test('wall recovery refunds 100%; other units refund 75% of all investments', () => {
  const g = emptyGame(), start = g.money;
  const wall = g.place('wall', 2, 2).building; assert.equal(g.sell(wall.id).refund, 8); assert.equal(g.money, start);
  const b = g.place('rifle', 2, 2).building, upgrade = g.upgradeCost(b);
  assert.equal(g.upgrade(b.id).ok, true); assert.equal(b.level, 2);
  assert.equal(g.sell(b.id).refund, Math.floor((TYPES.rifle.cost + upgrade) * .75));
});

test('unaffordable actions and maximum upgrades leave money and buildings unchanged', () => {
  const g = new Game({ starter: false }); g.money = 0;
  assert.equal(g.place('rifle', 2, 2).ok, false); assert.equal(g.buildings.length, 0);
  g.money = 10000; const b = g.place('rifle', 2, 2).building;
  assert.equal(g.upgrade(b.id).ok, true); assert.equal(g.upgrade(b.id).ok, true);
  const money = g.money; assert.equal(g.upgrade(b.id).ok, false); assert.equal(g.money, money);
});

test('global buffs stack and attack speed caps at +200%, giving three times the fire rate', () => {
  const g = emptyGame(), rifle = g.place('rifle', 3, 3).building;
  const initial = g.stats(rifle);
  const dmg = g.place('damage', 5, 1).building; g.upgrade(dmg.id);
  const speedBuildings = [];
  for (let x = 0; x < 12; x++) speedBuildings.push(g.place('speed', x, 0).building);
  assert.ok(speedBuildings.every(Boolean));
  assert.ok(Math.abs(g.buffs.damage - .3) < 1e-12); assert.equal(g.buffs.speed, 2);
  const modified = g.stats(rifle); assert.ok(Math.abs(modified.damage - initial.damage * 1.3) < 1e-10);
  assert.equal(modified.interval, initial.interval / 3);
  for (const b of speedBuildings.slice(0, 3)) g.sell(b.id);
  assert.ok(Math.abs(g.buffs.speed - 1.8) < 1e-12);
  assert.ok(Math.abs(g.stats(rifle).interval - initial.interval / 2.8) < 1e-12);
  g.sell(dmg.id); assert.equal(g.stats(rifle).damage, initial.damage);
});

test('damage from multiple upgraded institutes caps at +200% and recalculates after selling', () => {
  const g = emptyGame(), institutes = [];
  for (let x = 0; x < 5; x++) {
    const b = g.place('damage', x, 0).building;
    g.upgrade(b.id); g.upgrade(b.id); institutes.push(b);
  }
  assert.equal(g.buffs.damage, 2);
  for (const type of ['rifle', 'sniper', 'rocket', 'disruptor']) {
    assert.equal(g.stats({ type, level: 1 }).damage, TYPES[type].damage * 3);
  }
  g.sell(institutes[0].id);
  assert.ok(Math.abs(g.buffs.damage - 1.8) < 1e-12);
  assert.ok(Math.abs(g.stats({ type: 'rifle', level: 1 }).damage - TYPES.rifle.damage * 2.8) < 1e-12);
});

test('slow strength is multiplied globally and bounded at 70%, leaving 30% movement speed', () => {
  const g = emptyGame(), b = g.place('disruptor', 2, 3).building;
  assert.equal(g.stats(b).slow, .25);
  g.place('slow', 0, 0); assert.ok(Math.abs(g.stats(b).slow - .3) < 1e-12);
  for (let x = 1; x < 16; x++) g.place('slow', x, 0);
  assert.equal(g.stats(b).slow, .7);
  g.wave = 1; g.status = 'wave'; g.queue = ['small']; g.spawnTimer = 100;
  const enemies = [enemyAt(g, 5.5, 6.5), enemyAt(g, 5.5, 6.5, 'big')];
  g.splash(5.5, 6.5, g.stats(b), true);
  tick(g, .5);
  for (const enemy of enemies) {
    assert.equal(enemy.slow, .7);
    assert.ok(Math.abs(enemy.x - 5.5 - enemy.speed * .3 * .5) < 1e-10);
  }
});

test('both enemy types travel at twice their previous base speed on early and later waves', () => {
  for (const wave of [1, 3, 25]) {
    const g = emptyGame(); g.wave = wave; g.status = 'wave'; g.queue = ['small']; g.spawnTimer = 100;
    const small = g.spawn('small'), big = g.spawn('big');
    tick(g, 1);
    assert.ok(Math.abs(small.x - (ENTRY.x + .5) - 1.32 * 2) < 1e-10);
    assert.ok(Math.abs(big.x - (ENTRY.x + .5) - .8 * 2) < 1e-10);
    assert.equal(small.y, ENTRY.y + .5); assert.equal(big.y, ENTRY.y + .5);
  }
});

test('every wave has exactly 10% more HP for both enemy types', () => {
  const g = emptyGame();
  for (const w of [2, 3, 10, 50, 100]) {
    const prev = g.waveInfo(w - 1), next = g.waveInfo(w);
    assert.ok(Math.abs(next.smallHp / prev.smallHp - 1.1) < 1e-12);
    assert.ok(Math.abs(next.bigHp / prev.bigHp - 1.1) < 1e-12);
  }
  g.wave = 10; const small = g.spawn('small'), big = g.spawn('big');
  assert.equal(small.maxHp, g.waveInfo(10).smallHp); assert.equal(big.maxHp, g.waveInfo(10).bigHp);
  assert.equal(g.waveInfo(1).big, 0); assert.equal(g.waveInfo(3).big, 1);
});

test('rifle damages one enemy, sniper penetrates aligned enemies but not off-axis enemies', () => {
  const g = emptyGame(); g.wave = 1;
  const rifle = g.place('rifle', 1, 1).building;
  const a = enemyAt(g, 3.5, 1.5), b = enemyAt(g, 4.5, 1.5), c = enemyAt(g, 4.5, 3.5);
  g.attack(rifle, a, g.stats(rifle)); assert.equal(a.hp, 989); assert.equal(b.hp, 1000);
  const sniper = g.place('sniper', 1, 2).building;
  a.y = b.y = 2.5; const hp = a.hp;
  g.attack(sniper, a, g.stats(sniper)); assert.equal(a.hp, hp - 34); assert.equal(b.hp, 966); assert.equal(c.hp, 1000);
});

test('rocket deals circular splash; disruptor slows all enemies within its blast', () => {
  const g = emptyGame(); g.wave = 1;
  const rocket = g.place('rocket', 1, 1).building, slow = g.place('disruptor', 1, 2).building;
  const a = enemyAt(g, 5.5, 5.5), b = enemyAt(g, 6.2, 5.8), c = enemyAt(g, 8.5, 5.5);
  g.splash(a.x, a.y, g.stats(rocket), false); assert.equal(a.hp, 971); assert.equal(b.hp, 971); assert.equal(c.hp, 1000);
  g.splash(a.x, a.y, g.stats(slow), true); assert.equal(a.slow, .25); assert.equal(b.slow, .25); assert.equal(c.slow, 0); assert.equal(a.slowTime, 2.6);
});

test('kill reward is granted once despite simultaneous overkill', () => {
  const g = emptyGame(); g.wave = 1; const e = g.spawn('small'), money = g.money;
  g.hurt(e, 10000); g.hurt(e, 10000); assert.equal(g.kills, 1); assert.equal(g.money, money + 8);
});

test('first wave starts manually, then waves advance automatically and award each clear once', () => {
  const g = new Game(), money = g.money;
  for (let i = 0; i < 120; i++) g.update(1 / 60);
  assert.equal(g.status, 'prep'); assert.equal(g.wave, 0);
  assert.equal(g.startWave(), true); assert.equal(g.startWave(), false);
  g.drainEvents(); tick(g, 180, 1);
  assert.equal(g.status, 'wave'); assert.equal(g.cleared, 1); assert.equal(g.wave, 2);
  assert.equal(g.money, money + g.kills * 8 + g.waveInfo(1).reward);
  assert.equal(g.enemies.length, 0); assert.equal(g.queue.length, g.waveInfo(2).count); assert.ok(g.kills > 0);
  const events = g.drainEvents();
  assert.deepEqual(events.filter(e => e.type === 'clear'), [{ type: 'clear', wave: 1, bonus: g.waveInfo(1).reward }]);
  assert.deepEqual(events.filter(e => e.type === 'wave'), [{ type: 'wave', wave: 2 }]);
  assert.equal(g.startWave(), false);
  const afterClear = g.money; g.update(1 / 60); assert.equal(g.money, afterClear);
  tick(g, 180, 2); assert.equal(g.wave, 3); assert.equal(g.cleared, 2); assert.equal(g.status, 'wave');
});

test('automatic waves stop on defeat and never count the failed wave', () => {
  const g = new Game({ starter: false }); g.startWave(); tick(g, 180);
  assert.equal(g.status, 'over'); assert.equal(g.wave, 2); assert.equal(g.cleared, 1); assert.equal(g.lives, 0);
  const events = g.drainEvents();
  assert.deepEqual(events.filter(e => e.type === 'wave').map(e => e.wave), [1, 2]);
  assert.equal(events.filter(e => e.type === 'over').length, 1);
  for (let i = 0; i < 600; i++) g.update(1 / 60);
  assert.equal(g.wave, 2); assert.deepEqual(g.drainEvents(), []);
});

test('leaks cost one or three lives, game over freezes actions and does not count the lost wave', () => {
  const g = new Game({ starter: false }); g.wave = 4; g.cleared = 3; g.status = 'wave'; g.queue = ['small']; g.spawnTimer = 100;
  const big = enemyAt(g, 19.5, 6.5, 'big'); g.lives = 3;
  g.update(1 / 60); assert.equal(big.escaped, true); assert.equal(g.lives, 0); assert.equal(g.status, 'over'); assert.equal(g.cleared, 3);
  const time = g.time; g.update(1); assert.equal(g.time, time); assert.equal(g.startWave(), false); assert.equal(g.place('wall', 2, 2).ok, false);
  const smallGame = emptyGame(); smallGame.wave = 1; smallGame.status = 'wave'; smallGame.queue = ['small']; smallGame.spawnTimer = 100;
  enemyAt(smallGame, 19.5, 6.5); smallGame.update(1 / 60); assert.equal(smallGame.lives, 19);
});

test('a constructed maze remains navigable throughout a full wave', () => {
  const g = emptyGame();
  for (let y = 0; y < 11; y++) g.place('wall', 6, y);
  for (let y = 2; y < ROWS; y++) g.place('wall', 13, y);
  const distance = g.path().length; assert.ok(distance > 35);
  g.startWave(); tick(g, 180, 1);
  assert.equal(g.status, 'wave'); assert.equal(g.wave, 2); assert.equal(g.enemies.length, 0); assert.equal(g.lives, 10); assert.equal(g.cleared, 1);
});

test('construction during combat redirects moving enemies without crossing buildings or stalling', () => {
  const g = emptyGame(); g.startWave(); tick(g, 3);
  for (let y = 0; y < 11; y++) assert.equal(g.place('wall', 10, y).ok, true);
  for (let frame = 0; frame < 120 * 60 && g.status === 'wave' && g.cleared < 1; frame++) {
    g.update(1 / 60);
    for (const e of g.enemies) assert.equal(g.buildingAt(Math.floor(e.x), Math.floor(e.y)), undefined);
  }
  assert.equal(g.status, 'wave'); assert.equal(g.wave, 2); assert.equal(g.enemies.length, 0); assert.equal(g.lives, 10);
});

test('delayed projectiles resolve once and expired disruption restores normal movement', () => {
  const g = emptyGame(); g.wave = 1; g.status = 'wave'; g.queue = ['small']; g.spawnTimer = 100;
  const b = g.place('rocket', 1, 1).building, e = enemyAt(g, 5.5, 5.5);
  e.slow = .5; e.slowTime = .1;
  g.attack(b, e, g.stats(b)); assert.equal(e.hp, 1000); assert.equal(g.shots.length, 1);
  tick(g, .5); assert.equal(g.shots.length, 0); assert.equal(e.hp, 971); assert.equal(e.slow, 0); assert.equal(e.slowTime, 0);
  tick(g, .3); assert.equal(e.hp, 971);
});
