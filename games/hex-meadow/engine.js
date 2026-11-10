/* Hex Meadow — deterministic, DOM-free rules; plain scripts also work over file://. */
(function (root) {
  'use strict';
  const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
  const TEMPLATES = [
    ['forest', 'ffmmmf'], ['forest', 'ffffmm'], ['forest', 'ffffff'],
    ['village', 'vvmmmm'], ['village', 'vvvmmv'], ['village', 'vmvmvm'],
    ['river', 'wmmwmm'], ['river', 'wwmmmm'], ['river', 'wmwmmm'],
    ['meadow', 'mmmmmm'], ['meadow', 'mmmmmm'], ['forest', 'fmmmmf']
  ];
  const key = (q, r) => `${q},${r}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  function random(state) {
    let x = state.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    state.rng = x >>> 0;
    return state.rng / 4294967296;
  }
  function tile(index, rotation = 0, variant = 0) {
    const [type, pattern] = TEMPLATES[index];
    return { index, rotation, variant, type, edges: Array.from({ length: 6 }, (_, i) => pattern[(i - rotation + 6) % 6]) };
  }
  function draw(state) {
    // A shuffled bag keeps all three landscapes available without long dry spells.
    if (!state.bag.length) {
      state.bag = TEMPLATES.map((_, i) => i);
      for (let i = state.bag.length - 1; i > 0; i--) {
        const j = Math.floor(random(state) * (i + 1));
        [state.bag[i], state.bag[j]] = [state.bag[j], state.bag[i]];
      }
    }
    return { index: state.bag.pop(), variant: Math.floor(random(state) * 100000) };
  }
  function create(seed = Date.now() >>> 0, mode = 'classic') {
    seed = (seed >>> 0) || 1;
    const state = { version: 1, seed, rng: seed, mode, board: {}, queue: [], bag: [], remaining: 36, score: 0, placed: 0, completed: 0, swaps: 3, goals: { f: 4, v: 3, w: 3 }, actions: [], ended: false };
    const starters = [
      [0, 0, 'meadow', 'mmmmmm'], [-1, 0, 'forest', 'mffffm'],
      [-1, 1, 'forest', 'mffffm'], [0, -1, 'village', 'vmmmvv'],
      [1, -1, 'village', 'vvmvvm'], [1, 0, 'river', 'wwmmmm'], [0, 1, 'meadow', 'mmmmmm']
    ];
    starters.forEach(([q, r, type, edges], i) => { state.board[key(q, r)] = { q, r, type, edges: [...edges], variant: 37 + i * 29 }; });
    state.queue = [{ index: 1, variant: 30 }, { index: 4, variant: 81 }, { index: 7, variant: 47 }];
    return state;
  }
  function current(state, rotation = 0) { const next = state.queue[0]; return tile(next.index, rotation, next.variant); }
  function frontier(state) {
    const cells = new Map();
    Object.values(state.board).forEach(cell => DIRS.forEach(([dq, dr]) => {
      const q = cell.q + dq, r = cell.r + dr, id = key(q, r);
      if (!state.board[id]) cells.set(id, { q, r });
    }));
    return [...cells.values()].sort((a, b) => a.r - b.r || a.q - b.q);
  }
  function evaluate(state, q, r, rotation = 0) {
    if (state.ended) return { valid: false, reason: 'ended' };
    if (!Number.isInteger(q) || !Number.isInteger(r) || Math.abs(q) > 1000 || Math.abs(r) > 1000 || !Number.isInteger(rotation) || rotation < 0 || rotation > 5) return { valid: false, reason: 'position' };
    if (state.board[key(q, r)]) return { valid: false, reason: 'occupied' };
    const next = current(state, rotation), matched = [], mismatched = [];
    let neighbors = 0, riverBlocked = false;
    DIRS.forEach(([dq, dr], i) => {
      const other = state.board[key(q + dq, r + dr)];
      if (!other) return;
      neighbors++;
      const a = next.edges[i], b = other.edges[(i + 3) % 6];
      if (a === b) matched.push(i); else mismatched.push(i);
      if ((a === 'w') !== (b === 'w')) riverBlocked = true;
    });
    const valid = neighbors > 0 && !riverBlocked;
    const perfect = neighbors >= 3 && matched.length === neighbors;
    return { valid, reason: !neighbors ? 'adjacent' : riverBlocked ? 'riverBlocked' : '', matched, mismatched, neighbors, perfect, points: 10 + matched.length * 10 + (perfect ? 30 : 0) };
  }
  function regions(state) {
    const largest = { f: 0, v: 0, w: 0 };
    for (const type of Object.keys(largest)) {
      const visited = new Set();
      for (const cell of Object.values(state.board)) {
        const start = key(cell.q, cell.r);
        if (visited.has(start) || !cell.edges.includes(type)) continue;
        const stack = [cell]; visited.add(start); let size = 0;
        while (stack.length) {
          const next = stack.pop(); size++;
          DIRS.forEach(([dq, dr], i) => {
            const id = key(next.q + dq, next.r + dr), neighbor = state.board[id];
            if (next.edges[i] === type && neighbor?.edges[(i + 3) % 6] === type && !visited.has(id)) { visited.add(id); stack.push(neighbor); }
          });
        }
        largest[type] = Math.max(largest[type], size);
      }
    }
    return largest;
  }
  function apply(state, action) {
    if (!action || state.ended || state.actions.length >= 2000) return { ok: false };
    if (action.kind === 'swap') {
      if (state.swaps <= 0) return { ok: false };
      state.swaps--; state.queue.shift(); state.queue.push(draw(state));
      state.actions.push({ kind: 'swap' });
      state.ended = state.actions.length >= 2000;
      return { ok: true, swapped: true };
    }
    if (action.kind !== 'place') return { ok: false };
    const { q, r, rotation } = action, result = evaluate(state, q, r, rotation);
    if (!result.valid) return { ok: false, ...result };
    state.board[key(q, r)] = { ...current(state, rotation), q, r };
    state.score += result.points; state.placed++;
    if (state.mode === 'classic') state.remaining--;
    const sizes = regions(state), finished = [];
    for (const type of Object.keys(state.goals)) {
      // Every crossed threshold receives its reward, including a merged large region.
      while (sizes[type] >= state.goals[type]) {
        finished.push(type); state.goals[type] += 3; state.completed++; state.score += 100;
        if (state.mode === 'classic') state.remaining += 5;
      }
    }
    if (result.perfect && state.mode === 'classic') state.remaining += 1;
    state.queue.shift(); state.queue.push(draw(state));
    state.actions.push({ kind: 'place', q, r, rotation });
    state.ended = state.remaining <= 0 || state.actions.length >= 2000;
    return { ok: true, ...result, finished, gained: result.points + finished.length * 100 };
  }
  function serialize(state) { return { version: 1, seed: state.seed, mode: state.mode, actions: clone(state.actions) }; }
  function restore(data) {
    if (!data || data.version !== 1 || !Number.isInteger(data.seed) || data.seed < 1 || data.seed > 4294967295 || !['classic', 'free'].includes(data.mode) || !Array.isArray(data.actions) || data.actions.length > 2000) return null;
    const state = create(data.seed, data.mode);
    for (const action of data.actions) if (!apply(state, action).ok) return null;
    return state;
  }
  function undo(state) { const data = serialize(state); if (!data.actions.length) return state; data.actions.pop(); return restore(data); }
  const api = { DIRS, TEMPLATES, key, tile, create, current, frontier, evaluate, regions, apply, serialize, restore, undo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HexMeadow = api;
})(typeof window !== 'undefined' ? window : globalThis);
