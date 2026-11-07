(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PictureSlide = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const SIZES = [3, 4, 5];

  function solved(size) {
    if (!SIZES.includes(size)) throw new RangeError('Unsupported board size');
    return Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size));
  }

  function neighbors(index, size) {
    const row = Math.floor(index / size), col = index % size;
    return [row > 0 ? index - size : -1, col < size - 1 ? index + 1 : -1,
      row < size - 1 ? index + size : -1, col > 0 ? index - 1 : -1].filter(i => i >= 0);
  }

  function isSolved(tiles) {
    return tiles.every((tile, index) => tile === (index + 1) % tiles.length);
  }

  function distance(tiles, size) {
    return tiles.reduce((sum, tile, index) => tile === 0 ? sum : sum +
      Math.abs(Math.floor(index / size) - Math.floor((tile - 1) / size)) +
      Math.abs(index % size - (tile - 1) % size), 0);
  }

  function create(size = 3, random = Math.random) {
    const tiles = solved(size);
    let blank = tiles.length - 1, previous = -1;
    // Walk from the solution: every shuffle is reachable, on odd AND even grids.
    // A minimum Manhattan distance avoids accidentally generating a nearly solved game.
    const steps = { 3: 28, 4: 100, 5: 200 }[size], minimum = { 3: 8, 4: 22, 5: 42 }[size];
    for (let i = 0; i < steps || (i < steps * 5 && distance(tiles, size) < minimum); i++) {
      const options = neighbors(blank, size).filter(index => index !== previous);
      const sample = random();
      const index = options[Math.min(options.length - 1, Math.max(0, Math.floor((Number.isFinite(sample) ? sample : 0) * options.length)))];
      [tiles[blank], tiles[index]] = [tiles[index], tiles[blank]];
      previous = blank; blank = index;
    }
    if (isSolved(tiles)) {
      const index = neighbors(blank, size)[0];
      [tiles[blank], tiles[index]] = [tiles[index], tiles[blank]];
      blank = index;
    }
    return { size, tiles, blank, initial: tiles.slice(), history: [], moves: 0, won: false };
  }

  function move(state, index) {
    if (state.won || !Number.isInteger(index) || !neighbors(state.blank, state.size).includes(index)) return false;
    state.history.push(state.blank);
    [state.tiles[state.blank], state.tiles[index]] = [state.tiles[index], state.tiles[state.blank]];
    state.blank = index;
    state.moves++;
    state.won = isSolved(state.tiles);
    return true;
  }

  function undo(state) {
    if (!state.history.length || state.won) return false;
    const index = state.history.pop();
    [state.tiles[state.blank], state.tiles[index]] = [state.tiles[index], state.tiles[state.blank]];
    state.blank = index;
    // Count every slide, including undo, so records cannot be improved by rewinding.
    state.moves++;
    state.won = isSolved(state.tiles);
    return true;
  }

  function restart(state) {
    state.tiles = state.initial.slice();
    state.blank = state.tiles.indexOf(0);
    state.history = []; state.moves = 0; state.won = false;
  }

  function directionalIndex(state, direction) {
    // Arrows describe the numbered tile's travel direction, into the blank.
    const { blank, size } = state;
    const offset = { up: size, down: -size, left: 1, right: -1 }[direction];
    const index = blank + offset;
    return neighbors(blank, size).includes(index) ? index : -1;
  }

  return Object.freeze({ SIZES, solved, neighbors, isSolved, distance, create, move, undo, restart, directionalIndex });
});
