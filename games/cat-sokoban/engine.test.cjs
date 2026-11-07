const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const maps = require('./levels.js');

// Push-state BFS with its own transitions. It returns a legal walking route, not
// a fixture copied from the engine. Reachable-player regions collapse duplicates.
function solve(rows, limit = 200000) {
  const width = Math.max(...rows.map(row => row.length));
  const floor = new Set(), goals = new Set(), initialBoxes = [];
  let initialPlayer;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const cell = y * width + x;
    if (ch === '#') return;
    floor.add(cell);
    if ('.*+'.includes(ch)) goals.add(cell);
    if ('$*'.includes(ch)) initialBoxes.push(cell);
    if ('@+'.includes(ch)) initialPlayer = cell;
  }));
  const offsets = [{ d: -width, s: 'U' }, { d: 1, s: 'R' }, { d: width, s: 'D' }, { d: -1, s: 'L' }];
  const safe = new Set(goals), reverse = [...goals];
  for (let i = 0; i < reverse.length; i++) for (const { d } of offsets) {
    const next = reverse[i] + d;
    if (floor.has(next) && floor.has(next + d) && !safe.has(next)) { safe.add(next); reverse.push(next); }
  }
  function walk(player, boxes) {
    const paths = new Map([[player, '']]), queue = [player];
    for (let i = 0; i < queue.length; i++) for (const { d, s } of offsets) {
      const next = queue[i] + d;
      if (floor.has(next) && !boxes.includes(next) && !paths.has(next)) { paths.set(next, paths.get(queue[i]) + s); queue.push(next); }
    }
    return paths;
  }
  const queue = [{ boxes: initialBoxes, player: initialPlayer, route: '', pushes: 0 }], seen = new Set();
  for (let i = 0; i < queue.length && i < limit; i++) {
    const node = queue[i];
    if (node.boxes.every(box => goals.has(box))) return { route: node.route, pushes: node.pushes, states: i + 1 };
    const paths = walk(node.player, node.boxes);
    const key = [...node.boxes].sort((a, b) => a - b).join(',') + '|' + Math.min(...paths.keys());
    if (seen.has(key)) continue;
    seen.add(key);
    for (const box of node.boxes) for (const { d, s } of offsets) {
      const next = box + d;
      if (!paths.has(box - d) || !safe.has(next) || node.boxes.includes(next)) continue;
      queue.push({ boxes: node.boxes.map(cell => cell === box ? next : cell), player: box, route: node.route + paths.get(box - d) + s, pushes: node.pushes + 1 });
    }
  }
  return null;
}

if (require.main === module) {
test('walls and multiple crates block movement without consuming moves', () => {
  const state = E.create(E.parse(['########', '#@ $$..#', '########']));
  assert.equal(E.move(state, 'up').moved, false);
  assert.equal(E.move(state, 'left').moved, false);
  assert.equal(state.moves, 0);
  assert.equal(E.move(state, 'right').moved, true);
  assert.equal(E.move(state, 'right').moved, false);
  assert.equal(state.moves, 1);
  assert.equal(state.pushes, 0);
});

test('a push completes the room, freezes movement, and can be undone exactly', () => {
  const state = E.create(E.parse(['#####', '#@$.#', '#####']));
  const original = { player: state.player, boxes: [...state.boxes] };
  assert.equal(E.move(state, 'right').won, true);
  assert.equal(E.placed(state), 1);
  assert.equal(E.move(state, 'left').moved, false);
  assert.equal(state.moves, 1);
  assert.equal(state.pushes, 1);
  assert.equal(E.undo(state), true);
  assert.deepEqual({ player: state.player, boxes: state.boxes }, original);
  assert.equal(state.won, false);
  assert.equal(state.moves, 0);
  assert.equal(state.pushes, 0);
  assert.equal(E.undo(state), false);
});

test('empty walking, pushing and undo preserve crate identity and counters', () => {
  const level = E.parse(maps[2].rows), state = E.create(level);
  for (const direction of ['left', 'left', 'up', 'right', 'right', 'right', 'down']) E.move(state, direction);
  const text = E.serialize(state), restored = E.replay(level, text);
  assert.deepEqual(restored, state);
  while (state.history.length) E.undo(state);
  assert.deepEqual(state, E.create(level));
});

test('invalid or corrupt saved routes safely restart the room', () => {
  const level = E.parse(maps[0].rows), fresh = E.create(level);
  for (const route of [null, {}, 'xyz', 'U'.repeat(20001), 'LLLL', 'RRR']) assert.deepEqual(E.replay(level, route), fresh);
  assert.equal(E.replay(level, 'RR').won, true);
});

test('a crate against an unreachable edge is a deadlock, restored by undo', () => {
  const state = E.create(E.parse(['#######', '#     #', '# $@ .#', '#     #', '#######']));
  assert.equal(E.deadlocked(state), false);
  E.move(state, 'left');
  assert.equal(E.deadlocked(state), true);
  E.undo(state);
  assert.equal(E.deadlocked(state), false);
});

test('a blocked 2 × 2 crate group is detected even on otherwise safe floor', () => {
  const state = E.create(E.parse(['########', '# .... #', '# $$   #', '# $$ @ #', '#      #', '#      #', '########']));
  assert.equal(E.deadlocked(state), true);
});

test('board boundaries never wrap a row or allow out-of-range moves', () => {
  const level = E.parse(['@ $', ' . ', '###']);
  assert.equal(E.neighbor(level, 2, 'right'), -1);
  assert.equal(E.neighbor(level, 0, 'left'), -1);
  assert.equal(E.neighbor(level, 0, 'up'), -1);
});

test('invalid map data is rejected', () => {
  assert.throws(() => E.parse(['###', '#@#', '###']));
  assert.throws(() => E.parse(['######', '#@@$.#', '######']));
  assert.throws(() => E.parse(['#####', '#@x.#', '# $ #', '#####']));
});

for (const [index, map] of maps.entries()) test(`level ${index + 1}: ${map.id} is solvable and undoable`, () => {
  const solution = solve(map.rows);
  assert.ok(solution, 'Every shipped level must have a proven solution.');
  const level = E.parse(map.rows), state = E.create(level);
  const directions = { U: 'up', R: 'right', D: 'down', L: 'left' };
  for (const letter of solution.route) {
    assert.equal(E.move(state, directions[letter]).moved, true);
    assert.equal(E.deadlocked(state), false, 'A solvable route must not trigger a false deadlock.');
  }
  assert.equal(state.won, true);
  assert.equal(E.placed(state), level.goals.size);
  assert.equal(state.pushes, solution.pushes);
  assert.deepEqual(E.replay(level, solution.route), state);
  while (state.history.length) E.undo(state);
  assert.deepEqual(state, E.create(level));
  console.log(`  # ${map.id}: ${solution.route.length} steps, ${solution.pushes} pushes, ${solution.states} solver states`);
});

}
module.exports = { solve };
