const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, COLS } = require('./engine.js');
function random(seed = 1234) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function fresh() { const g = new Game(random()); g.start(); return g; }
function advance(g, time) { for (let t = 0; t < time - 1e-8; t += .01) g.update(Math.min(.01, time - t)); }
function put(g, row, x = 5) { g.player = { x, row, visualRow: row, hop: null, facing: 'up' }; }
function clear(g, row) { const lane = g.lane(row); lane.type = 'grass'; lane.blocks = []; lane.objects = []; return lane; }

test('starts safely; one hop scores once and backtracking cannot farm points', () => {
  const g = fresh(); assert.equal(g.score, 0); assert.equal(g.lane(0).type, 'grass');
  assert.equal(g.move(0, 1), true); advance(g, .18); assert.equal(g.score, 1);
  g.move(0, -1); advance(g, .18); g.move(0, 1); advance(g, .18); assert.equal(g.score, 1);
});
test('only cardinal movement; movement cannot overlap a hop or leave the board', () => {
  const g = fresh(); put(g, 0, 0);
  assert.equal(g.move(-1, 0), false); assert.equal(g.move(0, -1), false); assert.equal(g.move(1, 1), false);
  assert.equal(g.move(1, 0), true); assert.equal(g.move(0, 1), false);
  advance(g, .2); assert.equal(g.player.x, 1);
});
test('trees and rocks block movement without consuming a step', () => {
  const g = fresh(); g.lane(1).blocks = [{ x: 5, kind: 'tree' }];
  assert.equal(g.move(0, 1), false); assert.equal(g.player.hop, null); assert.equal(g.score, 0);
  assert.equal(g.move(1, 0), true);
});
test('road collision includes the edges of both car and chicken', () => {
  const g = fresh(); put(g, 3); const lane = g.lane(3);
  lane.objects = [{ x: 6, width: 1.8 }]; lane.speed = 0; g.update(.01);
  assert.equal(g.status, 'dead'); assert.equal(g.reason, 'car');
});
test('fast traffic cannot tunnel through the player on a long frame', () => {
  const g = fresh(); put(g, 3); const lane = g.lane(3);
  lane.objects = [{ x: 0, width: 1.3 }]; lane.speed = 55; g.update(.2);
  assert.equal(g.reason, 'car');
});
test('crossing between lanes does not grant invulnerability', () => {
  const g = fresh(); put(g, 2); const lane = g.lane(3); lane.objects = [{ x: 5, width: 2 }]; lane.speed = 0;
  g.move(0, 1); advance(g, .17); assert.equal(g.reason, 'car'); assert.equal(g.score, 0);
});
test('river landing requires a log underneath the landing position', () => {
  const g = fresh(); put(g, 5); g.lane(6).objects = []; g.move(0, 1); advance(g, .18);
  assert.equal(g.reason, 'water');
});
test('a supported chicken drifts at exactly the log speed', () => {
  const g = fresh(); put(g, 6); const lane = g.lane(6);
  lane.objects = [{ x: 5, width: 3 }]; lane.speed = .8; advance(g, .5);
  assert.equal(g.status, 'playing'); assert.ok(Math.abs(g.player.x - 5.4) < 1e-6);
  assert.ok(Math.abs(g.player.x - lane.objects[0].x) < 1e-6);
});
test('jumping off a moving log onto a safe bank is possible', () => {
  const g = fresh(); put(g, 7, 5.2); g.lane(7).objects = [{ x: 5.2, width: 3 }]; g.lane(7).speed = .7; clear(g, 8);
  g.move(0, 1); advance(g, .2); assert.equal(g.status, 'playing'); assert.equal(g.player.row, 8); assert.equal(g.score, 8);
});
test('drifting beyond the playable edge ends the run', () => {
  const g = fresh(); put(g, 6, 10.4); g.lane(6).objects = [{ x: 10.4, width: 3 }]; g.lane(6).speed = 1;
  advance(g, .2); assert.equal(g.reason, 'drift');
});
test('wrapped vehicles do not falsely collide across the entire screen', () => {
  const g = fresh(); put(g, 3); g.lane(3).objects = [{ x: 15.99, width: 2 }]; g.lane(3).speed = 2;
  advance(g, .1); assert.equal(g.status, 'playing');
});
test('rail warning is visible for two seconds before the train begins', () => {
  const g = fresh(), lane = g.lane(9); lane.timer = .01;
  advance(g, .02); assert.equal(lane.phase, 'warning'); assert.equal(lane.train, null);
  advance(g, 1.99); assert.equal(lane.phase, 'warning');
  advance(g, .14); assert.equal(lane.phase, 'passing'); assert.ok(lane.train);
});
test('train collision works for travel in either direction', () => {
  for (const dir of [-1, 1]) {
    const g = fresh(), lane = g.lane(9); put(g, 9); lane.phase = 'passing'; lane.dir = dir; lane.train = { x: dir > 0 ? 0 : 10, width: 8 };
    advance(g, .2); assert.equal(g.reason, 'train');
  }
});
test('pause freezes hazards, hop progress, score, and idle deadline', () => {
  const g = fresh(); g.move(0, 1); g.update(.05); g.pause(); const snapshot = JSON.stringify({ p: g.player, lanes: [...g.lanes], time: g.time, idle: g.idle });
  g.update(.25); assert.equal(JSON.stringify({ p: g.player, lanes: [...g.lanes], time: g.time, idle: g.idle }), snapshot);
  g.start(); advance(g, .2); assert.equal(g.score, 1);
});
test('idle deadline requires forward progress, not sideways score farming', () => {
  const g = fresh(); advance(g, 12); assert.equal(g.status, 'playing');
  g.move(1, 0); advance(g, .2); assert.ok(g.idle > 12); advance(g, 6); assert.equal(g.reason, 'idle');
});
test('a new furthest row resets the idle clock', () => {
  const g = fresh(); advance(g, 15); g.move(0, 1); advance(g, .17); assert.ok(g.idle < .03);
});
test('procedural worlds are bounded in density and always have safe intervals', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const g = new Game(random(seed)); g.ensure(600); let hazardCount = 0;
    for (const lane of g.lanes.values()) {
      hazardCount = lane.type === 'grass' ? 0 : hazardCount + 1; assert.ok(hazardCount <= 3);
      if (lane.type === 'grass') assert.ok(!lane.blocks.some(b => b.x >= 4 && b.x <= 6));
      if (lane.type === 'river') assert.ok(lane.objects.every(o => o.width > 3));
      assert.ok(lane.blocks.every(b => b.x >= 0 && b.x < COLS));
    }
  }
});
test('endless runs discard old rows and keep a complete look-ahead', () => {
  const g = fresh();
  for (let row = 1; row <= 400; row++) {
    clear(g, row); g.move(0, 1); advance(g, .17);
    assert.equal(g.status, 'playing');
  }
  assert.equal(g.score, 400); assert.ok(g.lanes.size < 55); assert.ok(g.lane(435)); assert.equal(g.lane(0), undefined);
});
test('reset removes death, score, stale input state, and time', () => {
  const g = fresh(); g.fail('car'); g.reset();
  assert.equal(g.status, 'ready'); assert.equal(g.score, 0); assert.equal(g.reason, ''); assert.equal(g.time, 0); assert.equal(g.player.hop, null);
});
test('invalid time input is ignored', () => {
  const g = fresh(); for (const dt of [NaN, Infinity, -1, 0]) g.update(dt); assert.equal(g.time, 0);
});
