/* Pure link-puzzle rules. Coordinates use the board's zero-based row and column. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AnimalLinkEngine = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  function shuffled(items, random = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(random() * (i + 1)));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function route(board, rows, cols, a, b, sameType = true) {
    if (a === b || a < 0 || b < 0 || a >= board.length || b >= board.length ||
        board[a] == null || board[b] == null || (sameType && board[a] !== board[b])) return null;
    const start = [Math.floor(a / cols), a % cols];
    const end = [Math.floor(b / cols), b % cols];
    const width = cols + 2;
    const key = (r, c, d) => ((r + 1) * width + c + 1) * 4 + d;
    const visited = new Uint8Array((rows + 2) * width * 4).fill(3);
    const queue = [];
    // A one-cell empty border permits the classic path around the board.
    const empty = (r, c) => r >= -1 && r <= rows && c >= -1 && c <= cols &&
      (r === end[0] && c === end[1] || r < 0 || r >= rows || c < 0 || c >= cols || board[r * cols + c] == null);
    for (let d = 0; d < 4; d++) queue.push({ r: start[0], c: start[1], d, turns: 0, points: [start] });
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      for (let d = 0; d < 4; d++) {
        const turns = current.turns + (current.d === d ? 0 : 1);
        if (turns > 2) continue;
        const r = current.r + directions[d][0], c = current.c + directions[d][1];
        if (!empty(r, c) || visited[key(r, c, d)] <= turns) continue;
        const points = current.points.concat([[r, c]]);
        if (r === end[0] && c === end[1]) {
          // Keep just the two endpoints and the corners for SVG rendering.
          return points.filter((p, i) => i === 0 || i === points.length - 1 ||
            (p[0] - points[i - 1][0]) !== (points[i + 1][0] - p[0]) ||
            (p[1] - points[i - 1][1]) !== (points[i + 1][1] - p[1]));
        }
        visited[key(r, c, d)] = turns;
        queue.push({ r, c, d, turns, points });
      }
    }
    return null;
  }

  function findPair(board, rows, cols) {
    for (let a = 0; a < board.length; a++) {
      if (board[a] == null) continue;
      for (let b = a + 1; b < board.length; b++) {
        if (board[b] !== board[a]) continue;
        const path = route(board, rows, cols, a, b);
        if (path) return { a, b, path };
      }
    }
    return null;
  }

  // Construct a complete removal order before assigning icons. This guarantees
  // solvability, including after shuffling boards with irregular empty spaces.
  function arrange(board, rows, cols, random = Math.random) {
    if (board.length !== rows * cols) throw new Error('Board dimensions do not match.');
    const counts = new Map();
    board.forEach(type => { if (type != null) counts.set(type, (counts.get(type) || 0) + 1); });
    const types = [];
    for (const [type, count] of counts) {
      if (count % 2) throw new Error('Every icon must occur in pairs.');
      for (let i = 0; i < count / 2; i++) types.push(type);
    }
    const pairTypes = shuffled(types, random), mask = board.map(type => type == null ? null : true);
    const result = board.map(() => null), solution = [];
    let occupied = mask.flatMap((value, index) => value == null ? [] : [index]);
    while (occupied.length) {
      let a, b, path;
      for (let attempt = 0; attempt < 48; attempt++) {
        a = occupied[Math.min(occupied.length - 1, Math.floor(random() * occupied.length))];
        b = occupied[Math.min(occupied.length - 1, Math.floor(random() * occupied.length))];
        path = route(mask, rows, cols, a, b, false);
        if (path) break;
      }
      if (!path) {
        // Two leftmost occupied cells in the top occupied row can always link.
        // If that row has one cell, the first cell of the next row can link
        // via the empty row above it. The general scan also covers that case.
        const fallback = findPair(mask, rows, cols);
        if (!fallback) throw new Error('Unable to arrange paired positions.');
        ({ a, b, path } = fallback);
      }
      const type = pairTypes[solution.length];
      result[a] = type; result[b] = type;
      solution.push({ a, b });
      mask[a] = null; mask[b] = null;
      occupied = occupied.filter(index => index !== a && index !== b);
    }
    return { board: result, solution };
  }

  function create(rows, cols, types, random = Math.random) {
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 2 || cols < 2 ||
        rows * cols % 2 || !Array.isArray(types) || !types.length || types.some(type => type == null)) {
      throw new Error('An even board and at least one icon are required.');
    }
    const palette = shuffled([...new Set(types)], random), board = [];
    for (let i = 0; i < rows * cols / 2; i++) board.push(palette[i % palette.length], palette[i % palette.length]);
    return arrange(board, rows, cols, random);
  }

  return Object.freeze({ route, findPair, arrange, create });
});
