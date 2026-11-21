'use strict';

const FerryPuzzles = (() => {
  const items = {
    fisher: { weight: 55 }, post: { weight: 50 }, artist: { weight: 65 },
    trader: { weight: 75 }, smith: { weight: 60 }, lutist: { weight: 45 },
    tea: { weight: 40, cargo: true }, lantern: { weight: 35, cargo: true }
  };

  function crossing(capacity, pieces, rowers, pairs) {
    const bit = id => 1 << pieces.indexOf(id);
    return {
      capacity, pieces, rowers, pairs,
      all: (1 << pieces.length) - 1,
      pilots: rowers.reduce((mask, id) => mask | bit(id), 0),
      people: pieces.reduce((mask, id) => items[id].cargo ? mask : mask | bit(id), 0),
      forbidden: pairs.map(([a, b]) => bit(a) | bit(b))
    };
  }

  const levels = [
    crossing(130, ['fisher', 'artist', 'trader'], ['fisher', 'artist', 'trader'], []),
    crossing(105, ['fisher', 'post', 'tea', 'lantern'], ['fisher'], []),
    crossing(130, ['fisher', 'post', 'artist', 'trader'], ['fisher', 'post'], [['fisher', 'artist']]),
    crossing(125, ['lutist', 'post', 'artist', 'trader'], ['post'], [['lutist', 'post'], ['lutist', 'artist']]),
    crossing(110, ['fisher', 'post', 'smith', 'lutist', 'lantern'], ['fisher', 'post'], [['fisher', 'smith'], ['post', 'lutist']]),
    crossing(140, ['fisher', 'post', 'artist', 'trader', 'tea', 'lantern'], ['trader'], [['fisher', 'post'], ['fisher', 'artist']])
  ];

  function weight(level, manifest) {
    return level.pieces.reduce((sum, id, i) =>
      sum + ((manifest & (1 << i)) ? items[id].weight : 0), 0);
  }

  function dock(level, state) {
    return state.eastbound ? level.all ^ state.east : state.east;
  }

  function inspect(level, state, manifest) {
    if (!manifest) return { error: 'empty' };
    if ((manifest & dock(level, state)) !== manifest) return { error: 'wrongShore' };
    const mass = weight(level, manifest);
    if (mass > level.capacity) return { error: 'over', excess: mass - level.capacity };
    if (!(manifest & level.pilots)) return { error: 'noPilot' };

    // At departure only the source bank changes. At landing only the destination changes.
    const east = state.east ^ manifest;
    for (const [bits, bank] of [[level.all ^ east, 'west'], [east, 'east']]) {
      const index = level.forbidden.indexOf(bits & level.people);
      if (index >= 0) return { error: 'alone', pair: level.pairs[index], bank };
    }
    return { east, eastbound: !state.eastbound };
  }

  function newGame() {
    return { east: 0, eastbound: true, selected: 0, history: [] };
  }

  function sail(level, state) {
    const next = inspect(level, state, state.selected);
    if (next.error) return next;
    state.history.push({ east: state.east, eastbound: state.eastbound, selected: state.selected });
    Object.assign(state, next, { selected: 0 });
    return next;
  }

  function undo(state) {
    const prior = state.history.pop();
    if (prior) Object.assign(state, prior);
    return Boolean(prior);
  }

  // Breadth-first search counts each crossing, including the return trip, as one move.
  function shortest(level) {
    const queue = [{ east: 0, eastbound: true, path: [] }];
    const seen = new Set([1]);
    for (let i = 0; i < queue.length; i++) {
      const state = queue[i];
      if (state.east === level.all) return state.path;
      const bank = dock(level, state);
      for (let group = bank; group; group = (group - 1) & bank) {
        const next = inspect(level, state, group);
        if (next.error) continue;
        const key = next.east * 2 + Number(next.eastbound);
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ ...next, path: [...state.path, group] });
      }
    }
    return null;
  }

  return { items, levels, weight, dock, inspect, newGame, sail, undo, shortest };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = FerryPuzzles;
