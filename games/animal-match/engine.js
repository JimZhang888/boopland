/* Pure match-three rules, shared by the browser and deterministic Node checks. */
(function (root) {
  'use strict';
  const SIZE = 8, TYPES = 6;
  const kind = tile => tile == null ? -1 : typeof tile === 'number' ? tile : tile.type;
  function matches(board) {
    const found = new Set();
    for (let axis = 0; axis < 2; axis++) {
      for (let line = 0; line < SIZE; line++) {
        let start = 0;
        while (start < SIZE) {
          const index = axis ? start * SIZE + line : line * SIZE + start;
          const type = kind(board[index]);
          let end = start + 1;
          while (end < SIZE && kind(board[axis ? end * SIZE + line : line * SIZE + end]) === type) end++;
          if (type >= 0 && end - start >= 3) {
            for (let pos = start; pos < end; pos++) found.add(axis ? pos * SIZE + line : line * SIZE + pos);
          }
          start = end;
        }
      }
    }
    return [...found];
  }
  function adjacent(a, b) {
    return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < SIZE * SIZE && b < SIZE * SIZE &&
      Math.abs(a % SIZE - b % SIZE) + Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) === 1;
  }
  function swapped(board, a, b) {
    const result = board.slice();
    [result[a], result[b]] = [result[b], result[a]];
    return result;
  }
  function validSwap(board, a, b) {
    if (!adjacent(a, b) || kind(board[a]) < 0 || kind(board[a]) === kind(board[b])) return false;
    const found = matches(swapped(board, a, b));
    return found.includes(a) || found.includes(b);
  }
  function moves(board) {
    const options = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      for (const j of [i + 1, i + SIZE]) if (validSwap(board, i, j)) options.push([i, j]);
    }
    return options;
  }
  function create(random = Math.random) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const board = [];
      for (let i = 0; i < SIZE * SIZE; i++) {
        const forbidden = new Set();
        if (i % SIZE >= 2 && board[i - 1] === board[i - 2]) forbidden.add(board[i - 1]);
        if (i >= SIZE * 2 && board[i - SIZE] === board[i - SIZE * 2]) forbidden.add(board[i - SIZE]);
        const choices = Array.from({ length: TYPES }, (_, t) => t).filter(t => !forbidden.has(t));
        board.push(choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]);
      }
      if (moves(board).length) return board;
    }
    // Bounded fallback also works with a constant RNG; includes an explicit legal swap.
    const board = Array.from({ length: 64 }, (_, i) => (i % SIZE + Math.floor(i / SIZE) * 2) % TYPES);
    board[0] = 0; board[1] = 1; board[2] = 0; board[9] = 0;
    return board;
  }
  function shuffle(board, random = Math.random) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const next = board.slice();
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.min(i, Math.floor(random() * (i + 1)));
        [next[i], next[j]] = [next[j], next[i]];
      }
      if (!matches(next).length && moves(next).length) return next;
    }
    return null; // The view can replace an impossible multiset with a fresh board.
  }
  function collapse(board, makeTile) {
    const next = Array(SIZE * SIZE).fill(null);
    const entering = [];
    for (let col = 0; col < SIZE; col++) {
      const survivors = [];
      for (let row = 0; row < SIZE; row++) if (board[row * SIZE + col] != null) survivors.push(board[row * SIZE + col]);
      const missing = SIZE - survivors.length;
      for (let row = 0; row < SIZE; row++) {
        const index = row * SIZE + col;
        next[index] = row < missing ? makeTile() : survivors[row - missing];
        if (row < missing) entering.push({ tile: next[index], index, fromRow: row - missing });
      }
    }
    return { board: next, entering };
  }
  const points = (count, chain) => count * 60 * Math.min(Math.max(chain, 1), 5);
  const target = level => 3600 + (Math.max(1, level) - 1) * 600;
  const stars = (score, goal) => score >= goal * 1.8 ? 3 : score >= goal * 1.4 ? 2 : score >= goal ? 1 : 0;
  const api = Object.freeze({ SIZE, TYPES, matches, adjacent, swapped, validSwap, moves, create, shuffle, collapse, points, target, stars });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AnimalMatch = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
