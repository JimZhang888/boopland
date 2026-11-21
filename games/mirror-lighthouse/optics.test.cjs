// Run with: node --test games/mirror-lighthouse/optics.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'optics.js'), 'utf8');
const { maps, trace, hint } = vm.runInNewContext(source + '\nMirrorOptics');

function distance(a, b) {
  let diff = a ^ b;
  let flips = 0;
  while (diff) {
    diff &= diff - 1;
    flips++;
  }
  return flips;
}

// Each entry is a hand-traced solution, independent of the hint solver.
// Coordinates name the pieces to turn once from the printed starting layout.
const solutions = [
  ['D5'],
  ['B3', 'E3', 'E5'],
  ['C2', 'C5', 'E5', 'E3'],
  ['C4', 'F4'],
  ['D4', 'D2', 'F2', 'B4', 'B1'],
  ['B2', 'B1', 'D1', 'B6']
];

for (const [i, map] of maps.entries()) {
  test('Chart ' + (i + 1) + ' lights its targets together and offers a valid next turn from every layout', () => {
    const start = map.start;
    const stateBeforePlay = trace(map, start);
    assert.equal(stateBeforePlay.lit.size, 0);
    let solved = start;
    for (const pos of solutions[i]) {
      const x = pos.charCodeAt(0) - 65;
      const y = Number(pos.slice(1)) - 1;
      const mirror = map.cells[y * map.width + x];
      assert.notEqual(mirror.index, undefined);
      solved ^= 1 << mirror.index;
    }
    const finished = trace(map, solved);
    assert.equal(finished.complete, true);
    for (const target of map.targets) assert(finished.lit.has(target.id));

    const states = 1 << map.optics.length;
    const winners = [];
    const isolatedTargets = new Set();
    for (let mask = 0; mask < states; mask++) {
      const ray = trace(map, mask);
      assert(ray.states <= 4 * map.width * map.height);
      assert.equal(ray.complete, map.targets.every(target => ray.lit.has(target.id)));
      if (ray.complete) winners.push(mask);
      if (ray.lit.size === 1) isolatedTargets.add([...ray.lit][0]);
    }
    assert.equal(isolatedTargets.size, map.targets.length);
    const remaining = mask => Math.min(...winners.map(win => distance(win, mask)));
    for (let mask = 0; mask < states; mask++) {
      const next = hint(map, mask);
      if (winners.includes(mask)) assert.equal(next, null);
      else {
        assert(next && map.optics[next.index] === next);
        assert.equal(remaining(mask ^ (1 << next.index)), remaining(mask) - 1);
      }
    }
    assert.equal(map.start, start);
    assert.deepEqual(trace(map, start), stateBeforePlay);
  });
}

test('The atoll starts with a closed route and draws its returning beam', () => {
  const map = maps[5];
  const ray = trace(map, map.start);
  assert(ray.repeats > 0);
  assert(ray.segments.some(([fromX, fromY, toX, toY]) =>
    fromX === 1 && fromY === 2 && toX === 1 && toY === 3));
  assert.equal(ray.complete, false);
});
