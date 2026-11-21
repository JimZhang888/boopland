/* Grid topology and fence rules, shared by the game and its puzzle checks. */
'use strict';
const PencilFences = (() => {
  const EMPTY = 0, FENCE = 1, CROSS = 2;

  function build(rows) {
    const height = rows.length, width = rows[0].length;
    const edges = [], cells = [], vertices = Array.from({ length: (width + 1) * (height + 1) }, () => []);
    const stride = width + 1;
    function edge(horizontal, row, col) {
      const from = row * stride + col, to = from + (horizontal ? 1 : stride);
      const id = edges.length;
      edges.push({ horizontal, row, col, from, to });
      vertices[from].push(id);
      vertices[to].push(id);
    }
    for (let r = 0; r <= height; r++) {
      for (let c = 0; c < width; c++) edge(true, r, c);
    }
    const verticalStart = edges.length;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c <= width; c++) edge(false, r, c);
    }
    rows.forEach((line, row) => Array.from(line).forEach((char, col) => {
      const top = row * width + col, left = verticalStart + row * stride + col;
      cells.push({ row, col, clue: char === '.' ? null : Number(char), edges: [top, left + 1, top + width, left] });
    }));
    return { width, height, edges, vertices, cells };
  }

  function inspect(board, marks) {
    const badCells = new Set(), badVertices = new Set(), badEdges = new Set(), issues = new Set();
    let matched = 0, clues = 0;
    board.cells.forEach((cell, id) => {
      if (cell.clue === null) return;
      clues++;
      const fences = cell.edges.filter(i => marks[i] === FENCE).length;
      const available = cell.edges.filter(i => marks[i] === EMPTY).length;
      if (fences === cell.clue) matched++;
      if (fences > cell.clue || fences + available < cell.clue) {
        badCells.add(id);
        issues.add(fences > cell.clue ? 'tooMany' : 'tooFew');
      }
    });
    const active = board.vertices.map(list => list.filter(i => marks[i] === FENCE));
    active.forEach((links, v) => {
      if (links.length > 2 || (links.length === 1 && !board.vertices[v].some(i => marks[i] === EMPTY))) {
        badVertices.add(v);
        issues.add(links.length > 2 ? 'branch' : 'deadEnd');
      }
    });
    const unseen = new Set();
    marks.forEach((mark, id) => { if (mark === FENCE) unseen.add(id); });
    const fenceCount = unseen.size, groups = [];
    while (unseen.size) {
      const first = unseen.values().next().value, stack = [first], members = [];
      unseen.delete(first);
      let closed = true;
      while (stack.length) {
        const id = stack.pop();
        members.push(id);
        const { from, to } = board.edges[id];
        for (const v of [from, to]) {
          if (active[v].length !== 2) closed = false;
          for (const next of active[v]) if (unseen.delete(next)) stack.push(next);
        }
      }
      groups.push({ members, closed });
    }
    const solved = fenceCount > 0 && matched === clues && groups.length === 1 && groups[0].closed;
    if (!solved) {
      for (const group of groups) {
        if (!group.closed) continue;
        issues.add(groups.length > 1 ? 'separate' : 'early');
        group.members.forEach(i => badEdges.add(i));
      }
    }
    return { solved, matched, clues, badCells, badVertices, badEdges, issues, fenceCount };
  }

  return { build, inspect, EMPTY, FENCE, CROSS };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PencilFences;

