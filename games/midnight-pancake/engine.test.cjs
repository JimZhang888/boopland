const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
function game() { const g = new E.Game(() => .4); g.start(); return g; }
function cook(g, mask = 3) {
  assert.equal(g.action().event, 'pour'); g.tick(E.FRONT_READY);
  assert.equal(g.action().event, 'perfectFlip');
  for (let i = 0; i < 5; i++) if (mask & (1 << i)) g.ingredient(i);
  g.tick(E.BACK_READY); assert.equal(g.action().event, 'wrap');
}
test('a complete order earns coins and frees the pan', () => {
  const g = game(); cook(g); const served = g.serve(0);
  assert.equal(served.ok, true); assert.equal(served.perfect, true);
  assert.equal(g.served, 1); assert.equal(g.perfects, 1); assert.ok(g.coins > 12);
  assert.equal(g.orders[0], null); assert.equal(g.pan.stage, 'empty');
});
test('timing and stage gates cannot be skipped', () => {
  const g = game(); assert.equal(g.ingredient(0).ok, false); g.action();
  assert.equal(g.action().event, 'tooEarly'); assert.equal(g.serve(0).event, 'wrapFirst');
  g.tick(E.FRONT_READY); g.action(); assert.equal(g.action().event, 'tooEarly');
  g.tick(E.BACK_READY); assert.equal(g.action().event, 'needEgg');
  g.ingredient(0); g.ingredient(0); assert.equal(g.pan.ingredients, 0);
});
test('both pans cook independently and can be served in either order', () => {
  const g = game(); g.action(); g.tick(1000); g.select(1); g.action();
  g.tick(1400); assert.equal(g.action().event, 'tooEarly');
  g.select(0); g.action(); g.ingredient(0); g.ingredient(1);
  g.tick(1000); g.select(1); g.action(); g.ingredient(0); g.ingredient(2);
  g.tick(1600); g.action(); assert.equal(g.serve(1).ok, true);
  g.select(0); g.action(); assert.equal(g.serve(0).ok, true);
  assert.equal(g.bestCombo, 2); assert.equal(g.served, 2);
});
test('wrong recipient preserves the pancake and original order', () => {
  const g = game(); cook(g, 5); const id = g.orders[0].id;
  assert.equal(g.serve(0).event, 'wrongOrder'); assert.equal(g.orders[0].id, id);
  assert.equal(g.pan.stage, 'wrapped'); assert.equal(g.served, 0);
  g.tick(1000); assert.equal(g.serve(1).ok, true);
});
test('overcooking burns exactly once; discarding clears the pan', () => {
  const g = game(); g.action(); g.tick(E.FRONT_BURN);
  assert.equal(g.pan.stage, 'burnt'); assert.equal(g.waste, 1);
  g.tick(1000); assert.equal(g.waste, 1); g.action();
  assert.equal(g.pan.stage, 'empty'); assert.equal(g.waste, 1);
  g.action(); g.tick(E.FRONT_READY); g.action(); g.tick(E.BACK_BURN);
  assert.equal(g.pan.stage, 'burnt'); assert.equal(g.waste, 2);
});
test('a wrong handoff never extends a nearly expired customer wait', () => {
  const g = game(); cook(g, 5); g.orders[0].patience = 500;
  assert.equal(g.serve(0).event, 'wrongOrder'); assert.equal(g.orders[0].patience, 0);
  g.tick(1); assert.equal(g.orders[0], null); assert.equal(g.missed, 1);
  assert.equal(g.pan.stage, 'wrapped');
});
test('wrapped food stays safe, even while another pan cooks', () => {
  const g = game(); cook(g); g.tick(20000); assert.equal(g.pan.stage, 'wrapped');
  assert.equal(g.waste, 0); assert.equal(g.serve(0).ok, true);
});
test('pause freezes heat, patience, arrivals, and input', () => {
  const g = game(); g.action(); g.pause(true);
  const before = JSON.stringify(g); assert.deepEqual(g.tick(10000), []);
  assert.equal(g.action().ok, false); assert.equal(g.ingredient(1).ok, false);
  assert.equal(g.select(1), false); assert.equal(g.serve(0).ok, false);
  assert.equal(JSON.stringify(g), before); g.pause(false); g.tick(1000);
  assert.equal(g.pan.heat, 1000);
});
test('customer timeout and combo timeout work without double penalties', () => {
  const g = game(); cook(g); g.serve(0); g.tick(E.COMBO_WINDOW + 1);
  assert.equal(g.combo, 0); g.orders[1].patience = 10; const missed = g.missed;
  g.tick(11); assert.equal(g.missed, missed + 1); assert.equal(g.orders[1], null);
  g.tick(10); assert.equal(g.missed, missed + 1);
});
test('rush phases increase recipe variety and shorten waits', () => {
  const g = game(); g.tick(80000);
  assert.equal(g.phase, 2); g.spawn(0); assert.ok(E.countBits(g.orders[0].mask) >= 3);
  assert.equal(g.orders[0].total, 34000);
});
test('closing time is final and restarting fully resets a shift', () => {
  const g = game(); cook(g); g.serve(0);
  assert.ok(g.tick(E.SHIFT).some(e => e.event === 'finish'));
  assert.equal(g.remaining, 0); assert.equal(g.state, 'finished');
  const before = JSON.stringify(g); g.action(); g.tick(1000); assert.equal(JSON.stringify(g), before);
  g.start(); assert.equal(g.coins, 0); assert.equal(g.elapsed, 0); assert.equal(g.served, 0);
  assert.equal(g.nextId, 2); assert.equal(g.pan.stage, 'empty');
});
test('invalid time, selections, ingredients, and saved scores are rejected', () => {
  const g = game(); const before = JSON.stringify(g);
  for (const dt of [NaN, Infinity, -1, 0]) g.tick(dt);
  for (const index of [-1, 2, NaN, .5]) assert.equal(g.select(index), false);
  assert.equal(JSON.stringify(g), before);
  for (const value of [null, -1, Infinity, '20', {}, 1e10, 1.5]) assert.equal(E.cleanBest(value), 0);
  assert.equal(E.cleanBest(123), 123);
});
