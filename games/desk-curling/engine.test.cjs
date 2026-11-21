const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const page = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8'), page);
const { rink, createStone, launchPoint, step, measure } = page.window.DeskCurling;

function play(stones, team, power, angle = 0) {
  const stone = createStone(team, angle, power, launchPoint(stones));
  stones.push(stone);
  for (let tick = 0; tick < 600; tick++) {
    if (!step(stones, 1 / 120)) return stone;
  }
  assert.fail('Caps did not come to rest');
}

test('the closest surviving cap counts anywhere on the desk', () => {
  const stones = [];
  const short = play(stones, 0, 20, 35);
  assert.ok(!short.removed && short.x < rink.startX + 60);
  const farther = play(stones, 1, 45, -35);
  assert.ok(!farther.removed && farther.x < rink.targetX - 200);
  assert.equal(measure(stones).winner, 1);
});

test('a strong hit displaces either team and can decide the end', () => {
  for (const shooter of [0, 1]) {
    const stones = [];
    const guard = play(stones, 0, 78);
    assert.ok(Math.abs(guard.x - rink.targetX) < 5);
    const last = play(stones, shooter, 100);
    assert.ok(guard.removed && !last.removed);
    assert.equal(measure(stones).winner, shooter);
    assert.equal(measure(stones).leaders[0], last);
  }
});

test('an empty desk or equal opposing distances award no point', () => {
  const stones = [];
  assert.ok(play(stones, 0, 100, 35).removed);
  assert.equal(measure(stones).winner, null);
  for (const [team, dx] of [[0, -40], [1, 40]]) {
    stones.push({team, x:rink.targetX + dx, y:rink.centerY});
  }
  assert.equal(measure(stones).winner, null);
  assert.equal(measure(stones).leaders.length, 2);
});

test('a blocked launch mark offers a clear start at the same edge', () => {
  const first = launchPoint([]);
  const blocker = {team:1, ...first};
  const next = launchPoint([blocker]);
  assert.equal(next.x, first.x);
  assert.ok(Math.abs(next.y - first.y) >= 2 * rink.radius);
});
