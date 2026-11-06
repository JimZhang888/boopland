(function (root) {
  'use strict';
  const same = (a, b) => Boolean(a && b && a[0] === b[0] && a[1] === b[1]);
  const key = p => p.join(',');
  function expand(turns) {
    const path = [turns[0].slice()];
    for (const target of turns.slice(1)) {
      const p = path.at(-1).slice();
      if (p[0] !== target[0] && p[1] !== target[1]) throw Error('Diagonal route');
      while (!same(p, target)) {
        p[0] += Math.sign(target[0] - p[0]);
        p[1] += Math.sign(target[1] - p[1]);
        path.push(p.slice());
      }
    }
    return path;
  }
  // Hand-composed reference routes. Obstacles never occupy the reference route.
  const designs = [
    [5, [[0,4],[0,1],[2,1],[2,3],[4,3],[4,0]], [3,5,7,9], [[1,3],[2,0],[3,1]]],
    [5, [[0,0],[3,0],[3,2],[1,2],[1,4],[4,4],[4,1]], [2,6,10,13], [[1,1],[2,3],[0,3],[4,0]]],
    [5, [[0,4],[2,4],[2,2],[0,2],[0,0],[4,0],[4,4],[3,4],[3,2]], [4,7,11,15], [[1,3],[1,1],[2,1],[3,1]]],
    [6, [[0,5],[0,0],[3,0],[3,2],[1,2],[1,4],[4,4],[4,1],[5,1],[5,5]], [3,8,12,16,20], [[2,1],[2,3],[3,3],[3,5],[5,0]]],
    [6, [[0,0],[5,0],[5,5],[2,5],[2,2],[4,2],[4,4],[3,4]], [3,8,12,16,20], [[0,2],[1,2],[1,3],[3,1],[3,3],[1,5]]],
    [6, [[0,5],[2,5],[2,3],[0,3],[0,0],[3,0],[3,2],[5,2],[5,5],[3,5],[3,4]], [3,7,11,15,19], [[1,4],[1,1],[2,1],[4,1],[4,4],[5,0]]],
    [6, [[0,0],[0,5],[5,5],[5,0],[2,0],[2,3],[4,3],[4,1],[3,1],[3,2]], [3,8,13,18,23], [[1,1],[1,3],[2,4],[3,4],[4,4]]],
    [6, [[0,2],[0,0],[5,0],[5,3],[3,3],[3,1],[1,1],[1,5],[5,5],[5,4]], [4,9,13,17,22], [[0,4],[2,2],[2,3],[3,4],[4,2]]],
    [7, [[0,6],[0,0],[3,0],[3,2],[1,2],[1,4],[4,4],[4,1],[6,1],[6,6],[2,6]], [4,10,15,20,25,29], [[1,1],[2,1],[2,3],[3,3],[3,5],[5,2],[5,4],[1,6]]],
    [7, [[0,0],[6,0],[6,6],[0,6],[0,2],[4,2],[4,4],[2,4],[2,3]], [4,10,15,21,26,29], [[1,1],[3,1],[5,1],[5,3],[5,5],[1,5],[3,5],[1,3]]],
    [7, [[0,6],[2,6],[2,4],[0,4],[0,0],[4,0],[4,2],[2,2],[2,3],[6,3],[6,6],[4,6],[4,4],[3,4],[3,5]], [3,8,13,17,22,27], [[1,5],[1,1],[2,1],[3,1],[5,0],[5,2],[5,5],[3,6]]],
    [7, [[0,0],[0,6],[6,6],[6,0],[2,0],[2,4],[4,4],[4,2],[3,2],[3,3]], [3,9,15,21,25,29], [[1,1],[1,3],[1,5],[3,5],[5,5],[5,3],[5,1],[3,1]]]
  ];
  const levels = designs.map(([size, turns, homes, obstacles], index) => {
    const solution = expand(turns);
    return {
      id: index + 1, size, solution, start: solution[0], finish: solution.at(-1),
      houses: homes.map(i => solution[i]), target: solution.length - 1,
      obstacles: obstacles.map((position, i) => ({ position, type: ['tree', 'rock', 'water'][(i + Math.floor(index / 4)) % 3] }))
    };
  });
  const create = level => ({ level, path: [level.start.slice()], won: false });
  const connected = state => state.level.houses.filter(h => state.path.some(p => same(h, p))).length;
  function move(state, point) {
    if (state.won) return { changed: false, reason: 'done' };
    const last = state.path.at(-1);
    if (same(last, point)) return { changed: false, reason: 'same' };
    if (!point || !point.every(Number.isInteger) || point.some(v => v < 0 || v >= state.level.size)) return { changed: false, reason: 'outside' };
    if (Math.abs(last[0] - point[0]) + Math.abs(last[1] - point[1]) !== 1) return { changed: false, reason: 'adjacent' };
    if (same(point, state.path.at(-2))) {
      state.path.pop();
      return { changed: true, reason: 'undo' };
    }
    if (state.level.obstacles.some(o => same(o.position, point))) return { changed: false, reason: 'obstacle' };
    if (state.path.some(p => same(p, point))) return { changed: false, reason: 'crossing' };
    if (same(point, state.level.finish) && connected(state) !== state.level.houses.length) return { changed: false, reason: 'missing' };
    state.path.push(point.slice());
    state.won = same(point, state.level.finish);
    return { changed: true, reason: state.won ? 'win' : 'move' };
  }
  function undo(state) {
    if (state.path.length < 2) return false;
    state.path.pop(); state.won = false; return true;
  }
  function stars(state) {
    if (!state.won) return 0;
    const extra = state.path.length - 1 - state.level.target;
    return extra <= 0 ? 3 : extra <= 4 ? 2 : 1;
  }
  const api = { levels, create, move, undo, connected, stars, same, key, expand };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OneRoad = api;
})(typeof window === 'undefined' ? globalThis : window);
