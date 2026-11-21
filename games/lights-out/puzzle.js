/* A board fits in 25 bits. Bit zero is the lamp in the top left. */
const LightsOutPuzzle = (() => {
  'use strict';

  function press(board, size, index) {
    const bit = 1 << index;
    let mask = bit;
    if (index % size > 0) mask |= bit >> 1;
    if (index % size < size - 1) mask |= bit << 1;
    if (index >= size) mask |= bit >> size;
    if (index < size * (size - 1)) mask |= bit << size;
    return board ^ mask;
  }

  function count(bits) {
    let total = 0;
    while (bits) {
      bits &= bits - 1;
      total++;
    }
    return total;
  }

  // Once the first row of presses is chosen, every lit lamp in the
  // previous row forces a press directly below it. Try all first rows.
  function solve(board, size) {
    const width = (1 << size) - 1;
    let best = null;
    for (let first = 0; first <= width; first++) {
      let above = 0;
      let row = first;
      let moves = 0;
      for (let y = 0; y < size; y++) {
        moves |= row << (y * size);
        const lamps = (board >> (y * size)) & width;
        const below = (lamps ^ above ^ row ^ (row << 1) ^ (row >> 1)) & width;
        above = row;
        row = below;
      }
      if (row === 0 && (best === null || count(moves) < count(best))) best = moves;
    }
    if (best === null) return null;
    return Array.from({ length: size * size }, (_, i) => i).filter(i => best & (1 << i));
  }

  function fromPresses(size, moves) {
    return moves.reduce((board, index) => press(board, size, index), 0);
  }

  const minimumMoves = { 3: 3, 4: 4, 5: 7 };

  function generate(size, previous = 0, random = Math.random) {
    const cells = size * size;
    const minimum = minimumMoves[size];
    for (let attempt = 0; attempt < 48; attempt++) {
      const bag = Array.from({ length: cells }, (_, i) => i);
      const length = minimum + Math.floor(random() * (size - 1));
      for (let i = 0; i < length; i++) {
        const j = i + Math.floor(random() * (cells - i));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      const board = fromPresses(size, bag.slice(0, length));
      const lit = count(board);
      if (board !== previous && lit >= Math.ceil(cells / 3) && lit <= cells * .75 &&
          solve(board, size).length >= minimum) return board;
    }
    // Two known puzzles per size keep a new sign distinct even with a stuck RNG.
    const examples = {
      3: [[0, 4, 7], [1, 4, 8]],
      4: [[1, 6, 10, 12], [0, 5, 9, 14]],
      5: [[1, 4, 6, 10, 12, 18, 21], [0, 3, 8, 12, 14, 16, 23]]
    };
    return examples[size].map(moves => fromPresses(size, moves)).find(board => board !== previous);
  }

  return Object.freeze({ press, count, solve, fromPresses, generate });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = LightsOutPuzzle;
