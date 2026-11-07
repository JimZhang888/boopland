/* Water is stored bottom to top. Plain scripts keep file:// play supported. */
(function (root) {
  'use strict';
  const CAPACITY = 4;
  const clone = board => board.map(bottle => bottle.slice());
  const uniform = bottle => bottle.length > 0 && bottle.every(color => color === bottle[0]);
  const complete = bottle => bottle.length === CAPACITY && uniform(bottle);
  const won = board => board.length > 0 && board.some(bottle => bottle.length) && board.every(bottle => !bottle.length || complete(bottle));

  function inspect(board, from, to) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || !board[from] || !board[to] || from === to) return { reason: 'same' };
    const source = board[from], target = board[to];
    if (!source.length) return { reason: 'empty' };
    if (target.length >= CAPACITY) return { reason: 'full' };
    const color = source[source.length - 1];
    if (target.length && target[target.length - 1] !== color) return { reason: 'different' };
    let count = 1;
    while (count < source.length && source[source.length - 1 - count] === color) count++;
    return { from, to, color, amount: Math.min(count, CAPACITY - target.length) };
  }

  function pour(board, from, to) {
    const move = inspect(board, from, to);
    if (move.reason) return null;
    const next = clone(board);
    next[to].push(...next[from].splice(-move.amount));
    return { board: next, move };
  }

  function moves(board, usefulOnly = false) {
    const result = [];
    for (let from = 0; from < board.length; from++) {
      const source = board[from];
      if (!source.length || (usefulOnly && complete(source))) continue;
      let usedEmpty = false;
      for (let to = 0; to < board.length; to++) {
        const target = board[to];
        if (usefulOnly && !target.length && (uniform(source) || usedEmpty)) continue;
        const move = inspect(board, from, to);
        if (move.reason) continue;
        if (!target.length) usedEmpty = true;
        const score = (target.length ? 10 : 0) + (target.length + move.amount === CAPACITY ? 6 : 0) + (source.length === move.amount ? 4 : 0) + move.amount;
        result.push({ ...move, score });
      }
    }
    return result.sort((a, b) => b.score - a.score);
  }

  // Bottle positions are interchangeable: canonicalization removes symmetric searches.
  const key = board => board.map(bottle => bottle.join(',')).sort().join('|');
  function createSolver(initial, limit = 90000) {
    const start = clone(initial);
    let status = won(start) ? 'solved' : 'searching', solution = [], nodes = 0;
    const visited = new Set([key(start)]);
    const stack = [{ board: start, options: moves(start, true), next: 0, move: null }];
    return {
      step(budget = 500) {
        let used = 0;
        while (status === 'searching' && used < budget) {
          const frame = stack[stack.length - 1];
          if (!frame) { status = 'unsolvable'; break; }
          if (frame.next >= frame.options.length) { stack.pop(); continue; }
          const move = frame.options[frame.next++];
          const next = pour(frame.board, move.from, move.to).board;
          const signature = key(next);
          if (visited.has(signature)) continue;
          visited.add(signature);
          nodes++; used++;
          if (won(next)) {
            solution = [...stack.slice(1).map(item => item.move), [move.from, move.to]];
            status = 'solved';
          } else if (nodes >= limit) {
            status = 'limit';
          } else {
            stack.push({ board: next, options: moves(next, true), next: 0, move: [move.from, move.to] });
          }
        }
        return { status, solution, nodes };
      }
    };
  }

  function replay(initial, history) {
    if (!Array.isArray(history) || history.length > 3000) return null;
    let board = clone(initial);
    for (const move of history) {
      if (!Array.isArray(move) || move.length !== 2 || won(board)) return null;
      const result = pour(board, move[0], move[1]);
      if (!result) return null;
      board = result.board;
    }
    return board;
  }

  const api = Object.freeze({ CAPACITY, clone, uniform, complete, won, inspect, pour, moves, createSolver, replay });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WaterSortEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
