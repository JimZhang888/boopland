const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Game, LEVELS, ORES, WIDTH, HEIGHT, PIVOT, LIMIT, REST, makeItems, contact } = require('./engine.js');
const advance = (game, seconds) => { for (let remaining = seconds; remaining > 1e-8; remaining -= 1 / 60) game.update(Math.min(remaining, 1 / 60)); };
function isolated(kind, y = 340) {
  const game = new Game(42); game.start();
  game.items = [{ id: 0, kind, ...ORES[kind], x: PIVOT.x, y, rotation: 0, taken: false }, { id: 1, kind: 'small', ...ORES.small, x: 120, y: 500, rotation: 0, taken: false }];
  game.hook.angle = 0;
  return game;
}
test('a new run waits for start; fire is debounced and the swing stays in range', () => {
  const game = new Game(21); advance(game, 1); assert.equal(game.remaining, 60); assert.equal(game.fire(), false);
  game.start(); advance(game, 10); assert.ok(Math.abs(game.hook.angle) <= LIMIT);
  assert.equal(game.fire(), true); assert.equal(game.fire(), false); assert.equal(game.start(), false);
});
test('generated mines are deterministic, in bounds, reachable and non-overlapping with sufficient gold', () => {
  for (let level = 0; level < LEVELS.length; level++) {
    for (let seed = 0; seed < 100; seed++) {
      const items = makeItems(level, seed);
      assert.equal(items.length, 10 + LEVELS[level].diamonds + LEVELS[level].rocks);
      assert.deepEqual(items, makeItems(level, seed));
      assert.ok(items.reduce((sum, item) => sum + item.value, 0) > LEVELS[level].target);
      for (const [index, item] of items.entries()) {
        assert.ok(item.x - item.radius > 0 && item.x + item.radius < WIDTH && item.y + item.radius < HEIGHT);
        assert.ok(Math.abs(Math.atan2(item.x - PIVOT.x, item.y - PIVOT.y)) < LIMIT);
        for (const other of items.slice(index + 1)) assert.ok(Math.hypot(item.x - other.x, item.y - other.y) > item.radius + other.radius);
      }
    }
  }
});
test('swept collision detects grazing and fast crossings, and the nearer ore wins', () => {
  assert.notEqual(contact(0, 0, 100, 0, { x: 50, y: 5, radius: 2 }), null);
  assert.equal(contact(0, 0, 100, 0, { x: 50, y: 50, radius: 2 }), null);
  const game = isolated('small');
  game.items.unshift({ id: 2, kind: 'diamond', ...ORES.diamond, x: 450, y: 440, taken: false, rotation: 0 });
  game.fire(); advance(game, .5); assert.equal(game.hook.cargo.kind, 'small');
});
test('gold is awarded once, only after the loaded hook returns', () => {
  const game = isolated('medium'); game.fire(); advance(game, .45);
  assert.equal(game.score, 0); assert.equal(game.hook.mode, 'retract');
  advance(game, 3); assert.equal(game.score, 250); assert.equal(game.wallet, 250); assert.equal(game.total, 250);
  advance(game, 3); assert.equal(game.score, 250); assert.equal(game.drainEvents().filter(event => event.type === 'collect').length, 1);
});
test('heavy cargo returns slower; permanent power upgrades increase its speed', () => {
  const small = isolated('small'), rock = isolated('rock'), upgraded = isolated('rock'); upgraded.power = 3;
  for (const game of [small, rock, upgraded]) { game.fire(); advance(game, .5); }
  advance(small, 1.2); advance(rock, 1.2); advance(upgraded, 1.2);
  assert.equal(small.score, 100); assert.equal(rock.score, 0); assert.ok(upgraded.hook.length < rock.hook.length);
});
test('dynamite needs cargo, spends exactly one charge, and forfeits its value', () => {
  const game = isolated('rock'); assert.equal(game.bomb(), false); game.fire(); advance(game, .5);
  assert.equal(game.bomb(), true); assert.equal(game.bombs, 1); assert.equal(game.bomb(), false);
  advance(game, 2); assert.equal(game.score, 0); assert.equal(game.hook.cargo, null);
  assert.equal(game.hook.mode, 'swing'); assert.equal(game.hook.length, REST);
});
test('pause freezes clock, hook, and actions; invalid and suspended frame deltas are safe', () => {
  const game = isolated('large'); game.fire(); advance(game, .5); game.paused = true;
  const remaining = game.remaining, length = game.hook.length; advance(game, 10);
  assert.equal(game.remaining, remaining); assert.equal(game.hook.length, length); assert.equal(game.bomb(), false); assert.equal(game.fire(), false);
  game.paused = false; for (const dt of [NaN, Infinity, -5]) game.update(dt); assert.equal(game.remaining, remaining);
  game.update(1000); assert.ok(game.remaining >= remaining - .101);
});
test('timeouts do not pay for cargo still underground', () => {
  const game = isolated('large'); game.remaining = .7; game.fire(); advance(game, 1);
  assert.equal(game.phase, 'lost'); assert.equal(game.score, 0); assert.equal(game.total, 0); assert.equal(game.remaining, 0);
});
test('goal completion opens the shop, purchases affect purse only, and limits are enforced', () => {
  const game = isolated('diamond'); game.score = 100; game.total = 100; game.wallet = 100;
  game.fire(); advance(game, 4); assert.equal(game.phase, 'shop'); assert.equal(game.score, 700);
  assert.equal(game.buy('unknown'), false); assert.equal(game.buy('power'), true); assert.equal(game.wallet, 480); assert.equal(game.total, 700);
  assert.equal(game.buy('time'), true); assert.equal(game.buy('time'), false);
  assert.equal(game.buy('bomb'), true); assert.equal(game.bombs, 3);
  assert.equal(game.buy('power'), false); game.wallet = 10000;
  game.buy('power'); game.buy('power'); assert.equal(game.buy('power'), false);
  for (let i = 0; i < 10; i++) game.buy('bomb'); assert.equal(game.bombs, 9);
  game.next(); assert.equal(game.level, 1); assert.equal(game.remaining, 70); assert.equal(game.extraTime, false); assert.equal(game.power, 3);
  assert.equal(game.buy('bomb'), false); assert.equal(game.next(), false);
});
test('retry restores the starting snapshot including purchased time, without duplicating earnings', () => {
  const game = new Game(19); game.wallet = 200; game.total = 650; game.level = 1; game.bombs = 3; game.power = 2; game.extraTime = true; game.prepare();
  const initial = JSON.stringify(game.items); game.wallet += 250; game.total += 250; game.bombs--; game.score = 250; game.remaining = .01; advance(game, 1);
  assert.equal(game.phase, 'lost'); assert.equal(game.retry(), true);
  assert.equal(game.wallet, 200); assert.equal(game.total, 650); assert.equal(game.bombs, 3); assert.equal(game.power, 2); assert.equal(game.remaining, 70); assert.equal(game.score, 0); assert.equal(JSON.stringify(game.items), initial);
  assert.equal(game.retry(), false);
});
test('collecting or blasting the last object ends an exhausted mine immediately', () => {
  for (const blast of [false, true]) {
    const game = isolated('rock'); game.items.pop(); game.fire(); advance(game, .5);
    if (blast) game.bomb(); else advance(game, 5);
    assert.equal(game.phase, 'lost'); assert.equal(game.reason, 'empty');
  }
});
test('the sixth target ends the run; restart clears all transient state', () => {
  const game = isolated('diamond'); game.level = 5; game.score = LEVELS[5].target - 600;
  game.fire(); advance(game, 4); assert.equal(game.phase, 'won'); assert.equal(game.next(), false);
  game.reset(99); assert.equal(game.phase, 'ready'); assert.equal(game.level, 0); assert.equal(game.total, 0); assert.equal(game.power, 0); assert.equal(game.bombs, 2); assert.equal(game.paused, false);
});
test('a full six-mine journey is playable through real swing, collision, timer and shop transitions', () => {
  const game = new Game(1); game.start(); let steps = 0, completed = 0;
  while (game.phase !== 'won' && game.phase !== 'lost' && steps++ < 36000) {
    if (game.phase === 'shop') {
      completed++; while (game.canBuy('power')) game.buy('power');
      if (game.canBuy('time')) game.buy('time'); game.next();
    }
    if (game.hook.mode === 'swing') {
      const dx = Math.sin(game.hook.angle), dy = Math.cos(game.hook.angle);
      let nearest = null, first = Infinity;
      for (const item of game.items) {
        if (item.taken) continue;
        const hit = contact(PIVOT.x, PIVOT.y, PIVOT.x + dx * 1000, PIVOT.y + dy * 1000, item);
        if (hit !== null && hit < first) { first = hit; nearest = item; }
      }
      if (nearest && nearest.value >= 100 && Math.abs(Math.atan2(nearest.x - PIVOT.x, nearest.y - PIVOT.y) - game.hook.angle) < .035) game.fire();
    }
    if (game.canBomb && game.hook.cargo.kind === 'rock') game.bomb();
    game.update(1 / 60); game.drainEvents();
  }
  assert.equal(game.phase, 'won'); assert.equal(completed, 5); assert.ok(game.total >= LEVELS.reduce((sum, level) => sum + level.target, 0));
});
test('all eight dictionaries have every key, matching placeholders and no HTML', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { BooplandI18n: { register: (_, messages) => { dictionaries = messages; } } });
  assert.equal(Object.keys(dictionaries).length, 8); const keys = Object.keys(dictionaries.en).sort();
  for (const [language, messages] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(messages).sort(), keys, language);
    for (const key of keys) {
      assert.ok(messages[key].trim() && !/<[a-z]/i.test(messages[key]), `${language}.${key}`);
      assert.deepEqual([...messages[key].matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), [...dictionaries.en[key].matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), `${language}.${key}`);
    }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-label)?="miner\.([^"]+)"/g)) assert.ok(dictionaries.en[match[1]], match[1]);
});
test('lobby registers one translated entry, and every local HTML resource exists', () => {
  const root = path.resolve(__dirname, '../..'), context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), context);
  const entries = context.window.GAME_LIST.filter(entry => entry.path.includes('/gold-miner/'));
  assert.equal(entries.length, 1); assert.equal(Object.keys(entries[0].locales).length, 7);
  for (const reference of [entries[0].path, entries[0].cover]) assert.ok(fs.existsSync(path.resolve(root, reference)));
  for (const match of fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, match[1])), match[1]);
});
