const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
function fresh() { const game = new E.Game(() => .5); game.start(); game.accept(1); return game; }
function advance(game, ms) { while (ms > 0) { const step = Math.min(100, ms); game.tick(step); ms -= step; } }
function make(game, index = game.selected.recipe, quality = 60) {
  for (const item of E.RECIPES[index].parts) {
    assert.equal(game.add(item).ok, true, item);
    if (item === 'espresso') { advance(game, E.CONFIG.extractionMs * quality / 100); assert.equal(game.stopExtraction().ok, true); }
  }
}
test('all three drinks pay their exact prices, tips and consumed costs', () => {
  const g = fresh();
  for (let i = 0; i < 3; i++) {
    if (i) { advance(g, 1400); g.accept(i + 1); }
    assert.equal(g.selected.recipe, i); make(g); const result = g.serve();
    assert.equal(result.earned, E.RECIPES[i].price + 20); assert.equal(g.shift.cup, null);
  }
  assert.equal(g.shift.revenue, 480); assert.equal(g.shift.tips, 60);
  assert.equal(g.shift.cost, 26 + 40 + 48); assert.equal(g.shift.served, 3);
});
test('cannot add before taking an order/cup, duplicate parts or ingredients after sealing', () => {
  const g = new E.Game(); g.start(); assert.equal(g.add('cup').event, 'chooseOrder'); g.accept(1);
  assert.equal(g.add('milk').event, 'needCup'); g.add('cup'); const cost = g.shift.cost;
  assert.equal(g.add('cup').ok, false); assert.equal(g.shift.cost, cost);
  g.add('milk'); assert.equal(g.add('milk').event, 'alreadyAdded'); g.add('lid'); assert.equal(g.add('water').event, 'sealed');
  assert.equal(g.add('unknown').ok, false);
});
test('wrong recipe returns once, charges patience, and waste stays in the ledger', () => {
  const g = fresh(); make(g, 1); const cost = g.shift.cost, patience = g.selected.patience;
  assert.equal(g.serve().event, 'wrong'); assert.equal(g.selected.patience, patience - 10000); assert.equal(g.shift.revenue, 0);
  assert.equal(g.serve().event, 'remake'); assert.equal(g.shift.mistakes, 1);
  g.discard(); assert.equal(g.shift.cost, cost); assert.equal(g.shift.waste, 1); make(g); assert.equal(g.serve().ok, true);
});
test('extraction has early, good and late results; overrunning stops automatically', () => {
  for (const [quality, expected] of [[20, 'weak'], [60, 'good'], [90, 'bitter']]) {
    const g = fresh(); make(g, 0, quality); assert.equal(g.shift.cup.quality, expected); assert.equal(g.serve().ok, expected === 'good');
  }
  const g = fresh(); g.add('cup'); g.add('espresso'); assert.equal(g.add('milk').event, 'stopFirst'); advance(g, 4500);
  assert.equal(g.shift.cup.extraction, 100); assert.equal(g.shift.cup.extracting, false); assert.equal(g.shift.cup.quality, 'bitter');
});
test('pause freezes guests, arrivals and extraction, including restored saves', () => {
  const g = fresh(); g.add('cup'); g.add('espresso'); advance(g, 1200); g.pause(); const before = g.snapshot(); advance(g, 30000);
  assert.deepEqual(g.snapshot(), before); const restored = E.Game.restore(before); assert.equal(restored.paused, true); advance(restored, 30000); assert.deepEqual(restored.snapshot(), before);
  restored.pause(false); advance(restored, 1200); assert.equal(restored.stopExtraction().event, 'good');
});
test('queue never exceeds three, guests expire and unserved shifts finish', () => {
  const g = fresh(); advance(g, 43000); assert.equal(g.shift.orders.length, 3);
  for (let i = 0; i < 1000 && g.active; i++) { g.tick(1000); assert.ok(g.shift.orders.length <= 3); }
  assert.equal(g.state, 'closed'); assert.equal(g.shift.missed, 6); assert.equal(g.profile.cash, 300);
});
test('wrong order just before timeout clears the selected customer and closes exactly once', () => {
  const g = fresh(); make(g, 1); g.shift.arrived = 6; g.shift.missed = 5; g.selected.patience = 1;
  g.serve(); assert.equal(g.state, 'closed'); assert.equal(g.shift.missed, 6); const cash = g.profile.cash;
  assert.equal(g.close(), false); g.tick(1000); assert.equal(g.profile.cash, cash); assert.equal(g.shift.waste, 1);
});
test('stock runs out, paid refill works and negative funds do not softlock the next day', () => {
  const g = fresh(); for (let i = 0; i < 10; i++) { g.add('cup'); g.discard(); }
  assert.equal(g.add('cup').event, 'emptyStock'); assert.equal(g.restock().ok, true); assert.equal(g.shift.delivery, 60);
  assert.equal(g.shift.stock.cup, 4); assert.equal(g.restock().event, 'stockEnough');
  g.profile.cash = 0; g.close(); assert.equal(g.profile.cash, -90); assert.equal(g.nextDay(), true); assert.equal(g.profile.day, 2);
});
test('a full day settles once, upgrades have effects, and next day grows', () => {
  const g = fresh();
  while (g.state === 'playing') {
    if (!g.shift.orders.length) { advance(g, 1400); continue; }
    g.accept(g.shift.orders[0].id); make(g); assert.equal(g.serve().ok, true);
  }
  assert.equal(g.shift.served, 6); assert.equal(g.shift.missed, 0);
  assert.equal(g.profile.cash, 300 + g.shift.revenue + g.shift.tips - g.shift.cost); assert.equal(g.profile.totalServed, 6);
  const snapshot = g.snapshot(), restored = E.Game.restore(snapshot); assert.equal(restored.state, 'closed'); assert.equal(restored.close(), false);
  assert.equal(restored.buy('grinder'), true); assert.deepEqual(restored.zone, [34, 82]); assert.equal(restored.buy('grinder'), false);
  assert.equal(restored.buy('unknown'), false); restored.profile.cash = 3000;
  assert.equal(restored.buy('seats'), true); assert.equal(restored.buy('fridge'), true); restored.nextDay(); assert.equal(restored.shift.target, 8); assert.equal(restored.patience, 96500);
  restored.accept(1); restored.add('cup'); restored.add('milk'); assert.equal(restored.shift.cost, 11); assert.equal(restored.buy('grinder'), false);
});
test('early closing charges all used ingredients and counts remaining guests', () => {
  const g = fresh(); g.add('cup'); g.add('milk'); g.pause(); g.close();
  assert.equal(g.shift.missed, 6); assert.equal(g.shift.waste, 1); assert.equal(g.profile.cash, 285);
  assert.equal(E.Game.restore(g.snapshot()).state, 'closed');
});
test('invalid or stale saves recover safely without trusting malformed values', () => {
  for (const raw of [null, {}, { version: 99 }, { version: 1, profile: { day: 'oops' } }]) assert.equal(E.Game.restore(raw).state, 'ready');
  const valid = fresh().snapshot();
  for (const mutate of [s => s.shift.orders[0].patience = -1, s => s.shift.orders.push(s.shift.orders[0]), s => s.shift.stock.cup = 'infinite', s => s.profile.cash = Infinity, s => s.shift.cup = { parts: ['cup', 'script'] }, s => s.shift.selected = 999]) {
    const raw = structuredClone(valid); mutate(raw); assert.equal(E.Game.restore(raw).state, 'ready');
  }
  const restored = E.Game.restore(valid); restored.profile.cash++; assert.equal(valid.profile.cash, 300);
});
