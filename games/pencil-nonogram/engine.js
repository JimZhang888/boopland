(function (root) {
  'use strict';
  function runs(line) {
    const result = [];
    let length = 0;
    for (const value of [...line, 0]) {
      if (value === 1) length++;
      else if (length) { result.push(length); length = 0; }
    }
    return result.length ? result : [0];
  }
  const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  function clues(puzzle) {
    const n = puzzle.size;
    return {
      rows: Array.from({ length: n }, (_, r) => runs(puzzle.solution.slice(r * n, (r + 1) * n))),
      cols: Array.from({ length: n }, (_, c) => runs(Array.from({ length: n }, (_, r) => puzzle.solution[r * n + c])))
    };
  }
  function options(size, numbers) {
    const found = [];
    for (let mask = 0; mask < 2 ** size; mask++) {
      const line = Array.from({ length: size }, (_, i) => (mask >> i) & 1);
      if (equal(runs(line), numbers)) found.push(line);
    }
    return found;
  }
  function solved(board, puzzle) {
    return board.length === puzzle.solution.length && board.every((v, i) => Number(v === 1) === puzzle.solution[i]);
  }
  function mistakes(board, puzzle) {
    return board.flatMap((value, i) => value !== 0 && (value === 1 ? 1 : 0) !== puzzle.solution[i] ? [i] : []);
  }
  function hint(board, puzzle) {
    const wrong = mistakes(board, puzzle);
    if (wrong.length) return { index: wrong[0], value: puzzle.solution[wrong[0]] ? 1 : -1, correction: true };
    const n = puzzle.size, lines = clues(puzzle);
    let blank = null;
    for (const axis of ['rows', 'cols']) {
      for (let line = 0; line < n; line++) {
        const indices = Array.from({ length: n }, (_, i) => axis === 'rows' ? line * n + i : i * n + line);
        const candidates = options(n, lines[axis][line]).filter(candidate => indices.every((index, i) => board[index] === 0 || Number(board[index] === 1) === candidate[i]));
        if (!candidates.length) continue;
        for (let i = 0; i < n; i++) {
          if (board[indices[i]] !== 0 || !candidates.every(candidate => candidate[i] === candidates[0][i])) continue;
          const suggestion = { index: indices[i], value: candidates[0][i] ? 1 : -1, correction: false };
          if (suggestion.value === 1) return suggestion;
          if (!blank) blank = suggestion;
        }
      }
    }
    if (blank) return blank;
    const index = board.findIndex((value, i) => value === 0 && puzzle.solution[i] === 1);
    return index < 0 ? null : { index, value: 1, correction: false };
  }
  root.PencilEngine = Object.freeze({ runs, equal, clues, options, solved, mistakes, hint });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PencilEngine;
})(typeof window === 'undefined' ? globalThis : window);
