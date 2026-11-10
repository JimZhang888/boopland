(function (root) {
  'use strict';
  const W = 11, H = 7;
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const ORDERS = [
    { shape: 'circle', color: 'plain', mask: 15, count: 8 },
    { shape: 'circle', color: 'red', mask: 15, count: 10 },
    { shape: 'circle', color: 'red', mask: 3, count: 10 },
    { shape: 'square', color: 'blue', mask: 15, count: 12 },
    { shape: 'square', color: 'yellow', mask: 3, count: 12 },
    { shape: 'circle', color: 'green', mask: 1, count: 14 },
    { shape: 'square', color: 'blue', mask: 2, count: 14 },
    { shape: 'circle', color: 'red', mask: 4, count: 16 }
  ];
  const TYPES = ['belt', 'cutter', 'painter', 'rotator'];
  const COLORS = ['plain', 'red', 'blue', 'yellow', 'green'];
  const at = (x, y) => y * W + x;
  const clone = value => JSON.parse(JSON.stringify(value));
  const fixed = i => i === at(0, 1) || i === at(0, 5) || i === at(10, 3);
  const unlocked = (type, level) => type === 'belt' || type === 'painter' && level >= 1 || type === 'cutter' && level >= 2 || type === 'rotator' && level >= 6;
  function baseBoard() {
    const board = Array(W * H).fill(null);
    board[at(0, 1)] = { type: 'source', shape: 'circle', dir: 0 };
    board[at(0, 5)] = { type: 'source', shape: 'square', dir: 0 };
    board[at(10, 3)] = { type: 'hub', dir: 0 };
    return board;
  }
  function create() {
    const state = { board: baseBoard(), slots: Array(W * H).fill(null), level: 0, delivered: 0, rejected: 0, total: 0, completed: false, clock: 0, spawn: [0, 0] };
    for (let x = 1; x <= 3; x++) state.board[at(x, 1)] = { type: 'belt', dir: 0 };
    return state;
  }
  function transform(item, tile) {
    const result = { ...item };
    if (tile.type === 'painter') result.color = tile.color;
    if (tile.type === 'cutter') {
      const bits = [1, 2, 4, 8].filter(bit => result.mask & bit);
      if (bits.length > 1) result.mask = bits.slice(0, bits.length / 2).reduce((a, b) => a | b, 0);
    }
    if (tile.type === 'rotator') result.mask = ((result.mask << 1) & 15) | (result.mask >> 3);
    return result;
  }
  function place(state, x, y, type, dir, color = 'red') {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= W || y < 0 || y >= H || fixed(at(x, y))) return false;
    if (type !== 'erase' && (!TYPES.includes(type) || !unlocked(type, state.level) || !Number.isInteger(dir) || dir < 0 || dir > 3)) return false;
    if (type === 'painter' && !COLORS.slice(1).includes(color)) return false;
    const i = at(x, y), tile = type === 'erase' ? null : { type, dir, ...(type === 'painter' ? { color } : {}) };
    if (JSON.stringify(state.board[i]) === JSON.stringify(tile)) return false;
    state.board[i] = tile; state.slots[i] = null;
    return true;
  }
  function step(state, dt) {
    if (state.completed || !Number.isFinite(dt) || dt <= 0) return [];
    dt = Math.min(dt, .12); state.clock += dt;
    const events = [], occupied = state.slots.map(Boolean), moved = new Set();
    state.slots.forEach((slot, i) => {
      if (!slot || moved.has(i)) return;
      const tile = state.board[i];
      slot.progress = Math.min(1, slot.progress + dt / (tile.type === 'belt' || tile.type === 'source' ? .48 : .95));
      if (slot.progress < 1) return;
      const [dx, dy] = DIRS[tile.dir], x = i % W + dx, y = Math.floor(i / W) + dy;
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const j = at(x, y), next = state.board[j];
      if (!next || next.type === 'source' || moved.has(j)) return;
      if (next.type === 'hub') {
        const order = ORDERS[state.level];
        const good = ['shape', 'color', 'mask'].every(key => slot.item[key] === order[key]);
        state.slots[i] = null;
        if (good && !state.completed) {
          state.delivered++; state.total++;
          events.push({ type: 'delivery', index: j });
          if (state.delivered >= order.count) { state.completed = true; events.push({ type: 'complete' }); }
        } else if (!good) { state.rejected++; events.push({ type: 'reject', index: j }); }
        return;
      }
      if (occupied[j] || next.dir === (tile.dir + 2) % 4) return;
      state.slots[j] = { item: transform(slot.item, next), progress: 0, from: (tile.dir + 2) % 4 };
      state.slots[i] = null; moved.add(j);
    });
    [at(0, 1), at(0, 5)].forEach((i, n) => {
      state.spawn[n] += dt;
      if (state.spawn[n] >= 1.25 && !state.slots[i] && !state.completed) {
        state.spawn[n] = 0;
        state.slots[i] = { item: { shape: state.board[i].shape, color: 'plain', mask: 15 }, progress: 0, from: 2 };
      }
    });
    return events;
  }
  function nextOrder(state) {
    if (!state.completed || state.level >= ORDERS.length - 1) return false;
    state.level++; state.delivered = 0; state.rejected = 0; state.completed = false;
    state.slots.fill(null); state.spawn = [0, 0]; return true;
  }
  function serialize(state) {
    return JSON.stringify({ version: 1, board: state.board, level: state.level, delivered: state.delivered, rejected: state.rejected, total: state.total });
  }
  function restore(raw) {
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Number.isInteger(data.level) || data.level < 0 || data.level >= ORDERS.length || !Array.isArray(data.board) || data.board.length !== W * H) return null;
      const state = create(); state.board = baseBoard(); state.level = data.level;
      for (let i = 0; i < data.board.length; i++) {
        if (fixed(i) || data.board[i] === null) continue;
        const tile = data.board[i];
        if (!tile || !place(state, i % W, Math.floor(i / W), tile.type, tile.dir, tile.color)) return null;
      }
      for (const key of ['delivered', 'rejected', 'total']) {
        if (!Number.isSafeInteger(data[key]) || data[key] < 0) return null;
        state[key] = data[key];
      }
      if (state.delivered > ORDERS[state.level].count) return null;
      state.completed = state.delivered === ORDERS[state.level].count;
      return state;
    } catch { return null; }
  }
  // One continuous sample route; a hint only, never installed automatically.
  function blueprint(level) {
    const order = ORDERS[level], row = order.shape === 'circle' ? 1 : 5, route = [];
    for (let x = 1; x <= 9; x++) route.push({ x, y: row, type: 'belt', dir: x === 9 ? (row < 3 ? 1 : 3) : 0 });
    route.push({ x: 9, y: row < 3 ? 2 : 4, type: 'belt', dir: row < 3 ? 1 : 3 });
    route.push({ x: 9, y: 3, type: 'belt', dir: 0 });
    let position = 2;
    if (order.color !== 'plain') Object.assign(route[position++], { type: 'painter', color: order.color });
    if (order.mask !== 15) Object.assign(route[position++], { type: 'cutter' });
    if ([1, 2, 4, 8].includes(order.mask)) Object.assign(route[position++], { type: 'cutter' });
    if (order.mask === 2 || order.mask === 4) Object.assign(route[position++], { type: 'rotator' });
    if (order.mask === 4) Object.assign(route[position++], { type: 'rotator' });
    return route;
  }
  const api = { W, H, DIRS, ORDERS, TYPES, COLORS, at, fixed, clone, create, baseBoard, place, step, transform, nextOrder, serialize, restore, unlocked, blueprint };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TinyFactory = api;
})(typeof window !== 'undefined' ? window : globalThis);
