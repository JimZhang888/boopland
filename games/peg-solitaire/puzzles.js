/* The printed coordinates are also the notation for the verified routes. */
const PegPuzzles = (() => {
  'use strict';
  const coordinate = (row, col) => String.fromCharCode(65 + col) + (row + 1);
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const diamond = [0, 1, 3, 5, 3, 1, 0];
  const garden = [0, 3, 5, 5, 5, 3, 0];
  const cross = [3, 3, 7, 7, 7, 3, 3];

  function puzzle(widths, seeds, notation) {
    const cells = [];
    const byName = new Map();
    widths.forEach((width, row) => {
      for (let i = 0; i < width; i++) {
        const col = (7 - width) / 2 + i;
        const name = coordinate(row, col);
        const cell = { row, col, name, bit: 1n << BigInt(cells.length) };
        cells.push(cell);
        byName.set(name, cell);
      }
    });
    const jumps = [];
    for (const from of cells) {
      for (const [dr, dc] of directions) {
        const over = byName.get(coordinate(from.row + dr, from.col + dc));
        const to = byName.get(coordinate(from.row + dr * 2, from.col + dc * 2));
        if (!over || !to) continue;
        const pair = from.bit | over.bit;
        jumps.push({ from, over, to, pair, mask: pair | to.bit });
      }
    }
    const initial = seeds === 'classic'
      ? cells.reduce((bits, p) => p.name === 'D4' ? bits : bits | p.bit, 0n)
      : seeds.split(' ').reduce((bits, id) => bits | byName.get(id).bit, 0n);
    const route = notation.split(' ').map(id => jumps.find(m => m.from.name + m.to.name === id));
    const known = new Map();
    // Reflect and rotate the route. A position reached from another opening
    // can still share a proven finish with the printed solution.
    for (let symmetry = 0; symmetry < 8; symmetry++) {
      const transform = cell => {
        let r = cell.row, c = symmetry >= 4 ? 6 - cell.col : cell.col;
        for (let turn = 0; turn < symmetry % 4; turn++) [r, c] = [c, 6 - r];
        return byName.get(coordinate(r, c));
      };
      let state = cells.reduce((bits, p) => initial & p.bit ? bits | transform(p).bit : bits, 0n);
      for (const step of route) {
        const from = transform(step.from), to = transform(step.to);
        const move = jumps.find(m => m.from === from && m.to === to);
        if (!legal(state, move)) throw Error('Invalid route at ' + from.name);
        if (!known.has(state)) known.set(state, move);
        state ^= move.mask;
      }
      if ((state & (state - 1n)) !== 0n || !state) throw Error('Unfinished route');
    }
    return { cells, byName, jumps, initial, route, known, widths };
  }

  function legal(state, move) {
    return Boolean(move && (state & move.mask) === move.pair);
  }

  function jump(board, state, from, to) {
    const move = board.jumps.find(m => m.from.name === from && m.to.name === to);
    return legal(state, move) ? state ^ move.mask : state;
  }

  function remaining(state) {
    let count = 0;
    for (; state; state &= state - 1n) count++;
    return count;
  }

  // Yield regularly so even an unfamiliar classic position stays interactive.
  // Only proven winning continuations enter the shared hint cache.
  function* search(board, start, budget = 42000) {
    const visited = new Set();
    function* visit(state) {
      if ((state & (state - 1n)) === 0n || board.known.has(state)) return true;
      if (visited.size >= budget || visited.has(state)) return false;
      visited.add(state);
      if (visited.size % 128 === 0) yield;
      for (const move of board.jumps) {
        if (!legal(state, move)) continue;
        if (yield* visit(state ^ move.mask)) {
          board.known.set(state, move);
          return true;
        }
        if (visited.size >= budget) break;
      }
      return false;
    }
    yield* visit(start);
    return board.known.get(start) || null;
  }

  const boards = [
    puzzle(diamond, 'D2 B4 C4 D5', 'B4D4 D5D3 D2D4'),
    puzzle(garden, 'D2 B3 D3 C4 D4 E5', 'C4E4 E5E3 E3C3 B3D3 D2D4'),
    puzzle(cross, 'D2 C3 B4 F4 G4 B5 E5 E6', 'G4E4 B5B3 B3D3 D2D4 D4F4 E6E4 F4D4'),
    puzzle(cross, 'C2 D2 B4 C4 E4 C5 D5 E5 C6 D6', 'C2E2 B4D4 C6C4 D4B4 E5E3 E2E4 D6D4 E4C4 B4D4'),
    puzzle(cross, 'classic', 'D2D4 B3D3 C1C3 E1C1 D3B3 A3C3 E3E1 G3E3 C4C2 C1C3 A4C4 C4C2 E4C4 G4E4 E4E2 E1E3 C5C3 C2C4 A5C5 D5B5 E6E4 G5E5 C7C5 C4C6 E7C7 C7C5 B5D5 D5F5 E3E5 F5D5 D6D4')
  ];
  return { boards, legal, jump, remaining, search, coordinate };
})();
