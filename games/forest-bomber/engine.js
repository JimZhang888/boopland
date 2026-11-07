(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ForestBomber = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 13, HEIGHT = 11, FUSE = 2.4, FLAME = 0.62, ROUNDS = 5;
  const FLOOR = 0, WALL = 1, CRATE = 2;
  const DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  const key = (x, y) => y * WIDTH + x;
  const inside = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
  function random(seed) {
    let value = seed >>> 0;
    return function () { value += 0x6D2B79F5; let n = value; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  function actor(id, x, y, stage) {
    return { id, x, y, fromX: x, fromY: y, moveLeft: 0, moveDuration: 0.18, facing: 2,
      alive: true, hp: id === 0 ? 3 : 1, capacity: 1, range: 2, speed: id === 0 ? 5.5 : 3.5 + stage * 0.23,
      shield: false, invincibleUntil: 0, thinkAt: 0, plantAt: id === 0 ? 0 : 2.8 + id * 0.55, steps: 0 };
  }
  function create(options = {}) {
    const stage = Math.max(1, Math.min(ROUNDS, options.stage || 1));
    const seed = options.seed === undefined ? (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0 : options.seed >>> 0;
    const rng = random(seed + stage * 104729);
    const state = { width: WIDTH, height: HEIGHT, seed, rng, stage, mode: 'ready', time: 0, remaining: 150,
      score: options.score || 0, boxes: 0, maxChain: 0, bombs: [], flames: [], items: [], hidden: {}, events: [], nextId: 1,
      actors: [actor(0, 1, 1, stage), actor(1, WIDTH - 2, 1, stage), actor(2, 1, HEIGHT - 2, stage), actor(3, WIDTH - 2, HEIGHT - 2, stage)] };
    state.tiles = Array.from({ length: HEIGHT }, (_, y) => Array.from({ length: WIDTH }, (_, x) => {
      if (!x || !y || x === WIDTH - 1 || y === HEIGHT - 1 || (!(x % 2) && !(y % 2))) return WALL;
      return rng() < 0.62 + stage * 0.025 ? CRATE : FLOOR;
    }));
    // Each corner has two paths and a bend outside a starting bomb's cross.
    for (const a of state.actors) {
      const dx = a.x === 1 ? 1 : -1, dy = a.y === 1 ? 1 : -1;
      for (const [ox, oy] of [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [2, 1], [1, 2]]) state.tiles[a.y + oy * dy][a.x + ox * dx] = FLOOR;
    }
    const types = ['capacity', 'range', 'speed', 'shield'];
    for (let y = 1; y < HEIGHT - 1; y++) for (let x = 1; x < WIDTH - 1; x++) {
      if (state.tiles[y][x] === CRATE && rng() < 0.42) state.hidden[key(x, y)] = types[Math.floor(rng() * types.length)];
    }
    // A first reachable supply makes the upgrade loop discoverable in every forest.
    state.tiles[1][4] = CRATE; state.hidden[key(4, 1)] = 'capacity';
    state.tiles[4][1] = CRATE; state.hidden[key(1, 4)] = 'range';
    if (options.player) {
      const p = state.actors[0], old = options.player;
      p.hp = Math.min(3, old.hp + 1); p.capacity = old.capacity; p.range = old.range; p.speed = old.speed; p.shield = old.shield;
    }
    return state;
  }
  function start(state) { if (state.mode === 'ready' || state.mode === 'paused') state.mode = 'running'; }
  function pause(state) { if (state.mode === 'running') state.mode = 'paused'; }
  function next(state) {
    if (state.mode !== 'won' || state.stage >= ROUNDS) return null;
    return create({ seed: state.seed, stage: state.stage + 1, score: state.score, player: state.actors[0] });
  }
  function emit(state, type, data = {}) { state.events.push({ type, time: state.time, ...data }); }
  function drainEvents(state) { return state.events.splice(0); }
  function bombAt(state, x, y) { return state.bombs.find(b => b.x === x && b.y === y); }
  function walkable(state, x, y) { return inside(x, y) && state.tiles[y][x] === FLOOR && !bombAt(state, x, y); }
  function blastCells(state, bomb, tiles = state.tiles) {
    const cells = [{ x: bomb.x, y: bomb.y }];
    for (const dir of DIRS) for (let distance = 1; distance <= bomb.range; distance++) {
      const x = bomb.x + dir.x * distance, y = bomb.y + dir.y * distance;
      if (!inside(x, y) || tiles[y][x] === WALL) break;
      cells.push({ x, y });
      if (tiles[y][x] === CRATE || state.bombs.some(b => b.id !== bomb.id && b.x === x && b.y === y)) break;
    }
    return cells;
  }
  function placeBomb(state, a = state.actors[0]) {
    if (state.mode !== 'running' || !a.alive || a.moveLeft > 0 || bombAt(state, a.x, a.y) || state.bombs.filter(b => b.ownerId === a.id).length >= a.capacity) return false;
    const bomb = { id: state.nextId++, x: a.x, y: a.y, ownerId: a.id, range: a.range, explodeAt: state.time + FUSE };
    state.bombs.push(bomb); emit(state, 'plant', { x: a.x, y: a.y, ownerId: a.id });
    return true;
  }
  function move(state, a, direction) {
    if (state.mode !== 'running' || !a.alive || a.moveLeft > 0 || !DIRS[direction]) return false;
    a.facing = direction;
    const dir = DIRS[direction], x = a.x + dir.x, y = a.y + dir.y;
    if (!walkable(state, x, y)) return false;
    a.fromX = a.x; a.fromY = a.y; a.x = x; a.y = y;
    a.moveDuration = 1 / a.speed; a.moveLeft = a.moveDuration; a.steps++;
    return true;
  }
  function position(a) {
    const t = a.moveDuration ? Math.max(0, 1 - a.moveLeft / a.moveDuration) : 1;
    return { x: a.fromX + (a.x - a.fromX) * t, y: a.fromY + (a.y - a.fromY) * t };
  }
  function detonate(state, due) {
    const tiles = state.tiles.map(row => row.slice());
    const queue = [...due], exploded = new Set(), crates = new Map(), hits = new Map(), links = [];
    while (queue.length) {
      const bomb = queue.shift();
      if (exploded.has(bomb.id)) continue;
      exploded.add(bomb.id);
      for (const cell of blastCells(state, bomb, tiles)) {
        const k = key(cell.x, cell.y);
        hits.set(k, { ...cell, until: state.time + FLAME, ownerId: bomb.ownerId });
        if (tiles[cell.y][cell.x] === CRATE) crates.set(k, { ...cell, ownerId: bomb.ownerId });
        for (const other of state.bombs) if (other.id !== bomb.id && other.x === cell.x && other.y === cell.y) {
          links.push([bomb.id, other.id]);
          if (!exploded.has(other.id)) queue.push(other);
        }
      }
      emit(state, 'explode', { x: bomb.x, y: bomb.y, range: bomb.range });
    }
    const owners = new Map(state.bombs.map(b => [b.id, b.ownerId]));
    state.bombs = state.bombs.filter(b => !exploded.has(b.id));
    state.items = state.items.filter(item => item.readyAt > state.time || !hits.has(key(item.x, item.y)));
    for (const [k, cell] of crates) {
      state.tiles[cell.y][cell.x] = FLOOR; state.boxes++;
      if (cell.ownerId === 0) state.score += 15;
      if (state.hidden[k]) state.items.push({ x: cell.x, y: cell.y, type: state.hidden[k], readyAt: state.time + FLAME + 0.05 });
      delete state.hidden[k]; emit(state, 'crate', cell);
    }
    for (const [k, cell] of hits) {
      const old = state.flames.find(f => key(f.x, f.y) === k);
      if (old) { old.until = cell.until; old.ownerId = cell.ownerId; } else state.flames.push(cell);
    }
    // Separate simultaneous, unrelated explosions from actual connected chains.
    const parent = new Map([...exploded].map(id => [id, id]));
    const find = id => { while (parent.get(id) !== id) id = parent.get(id); return id; };
    for (const [a, b] of links) if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b));
    const groups = new Map();
    for (const id of exploded) { const root = find(id); if (!groups.has(root)) groups.set(root, []); groups.get(root).push(id); }
    for (const group of groups.values()) {
      state.maxChain = Math.max(state.maxChain, group.length);
      if (group.length > 1 && group.some(id => owners.get(id) === 0)) {
        state.score += (group.length - 1) * 50; emit(state, 'chain', { count: group.length });
      }
    }
  }
  // Resolve earliest ignition through the complete bomb graph, including chains.
  function hazards(state, extra) {
    const bombs = extra ? [...state.bombs, extra] : state.bombs;
    const prediction = { ...state, bombs };
    const times = bombs.map(b => b.explodeAt);
    const cells = bombs.map(b => blastCells(prediction, b));
    for (let pass = 0; pass < bombs.length; pass++) {
      let changed = false;
      bombs.forEach((b, i) => cells[i].forEach(cell => bombs.forEach((other, j) => {
        if (other.x === cell.x && other.y === cell.y && times[j] > times[i]) { times[j] = times[i]; changed = true; }
      })));
      if (!changed) break;
    }
    const danger = new Map();
    function add(x, y, from, until) { const k = key(x, y); if (!danger.has(k)) danger.set(k, []); danger.get(k).push([from, until]); }
    state.flames.forEach(f => add(f.x, f.y, state.time, f.until));
    cells.forEach((list, i) => list.forEach(c => add(c.x, c.y, times[i], times[i] + FLAME)));
    return danger;
  }
  function unsafe(danger, x, y, from, until) { return (danger.get(key(x, y)) || []).some(([a, b]) => a <= until && b >= from); }
  function escapePath(state, a, danger, extra) {
    const duration = 1 / a.speed, queue = [{ x: a.x, y: a.y, time: state.time, path: [] }], visited = new Set([key(a.x, a.y)]);
    while (queue.length) {
      const node = queue.shift();
      if (node.path.length && !unsafe(danger, node.x, node.y, node.time - 0.06, state.time + FUSE + FLAME + 0.15)) return node.path;
      if (node.path.length >= 14) continue;
      for (let dir = 0; dir < 4; dir++) {
        const x = node.x + DIRS[dir].x, y = node.y + DIRS[dir].y, k = key(x, y), arrival = node.time + duration;
        if (visited.has(k) || !walkable(state, x, y) || (extra && extra.x === x && extra.y === y)) continue;
        if (unsafe(danger, node.x, node.y, node.time, arrival) || unsafe(danger, x, y, node.time, arrival + 0.12)) continue;
        visited.add(k); queue.push({ x, y, time: arrival, path: [...node.path, dir] });
      }
    }
    return null;
  }
  function think(state, a) {
    if (a.moveLeft > 0 || state.time < a.thinkAt) return;
    a.thinkAt = state.time + 0.055;
    const danger = hazards(state);
    if (unsafe(danger, a.x, a.y, state.time, state.time + FUSE + FLAME)) {
      const route = escapePath(state, a, danger);
      if (route) move(state, a, route[0]);
      return;
    }
    const fake = { id: -1, x: a.x, y: a.y, ownerId: a.id, range: a.range, explodeAt: state.time + FUSE };
    const targets = blastCells(state, fake);
    const useful = targets.some(c => state.tiles[c.y][c.x] === CRATE || state.actors.some(other => other.alive && other.id !== a.id && other.x === c.x && other.y === c.y));
    if (useful && state.time >= a.plantAt && state.bombs.filter(b => b.ownerId === a.id).length < a.capacity) {
      const escape = escapePath(state, a, hazards(state, fake), fake);
      if (escape && placeBomb(state, a)) { a.plantAt = state.time + 2.4 + state.rng() * 1.5; move(state, a, escape[0]); return; }
    }
    // Walk a safe breadth-first route toward supplies, an opponent, or a crate edge.
    const queue = [{ x: a.x, y: a.y, path: [] }], visited = new Set([key(a.x, a.y)]);
    let best = null, bestValue = -Infinity;
    while (queue.length) {
      const node = queue.shift();
      if (node.path.length) {
        const pickup = state.items.some(i => i.readyAt <= state.time && i.x === node.x && i.y === node.y);
        const crate = DIRS.some(d => state.tiles[node.y + d.y]?.[node.x + d.x] === CRATE);
        const player = state.actors[0];
        const proximity = Math.abs(player.x - node.x) + Math.abs(player.y - node.y);
        const value = (pickup ? 16 : 0) + (crate ? 6 : 0) - node.path.length * 0.65 - proximity * 0.18 + state.rng() * 1.6;
        if (value > bestValue) { bestValue = value; best = node.path; }
      }
      if (node.path.length >= 8) continue;
      for (let dir = 0; dir < 4; dir++) {
        const x = node.x + DIRS[dir].x, y = node.y + DIRS[dir].y, k = key(x, y);
        if (visited.has(k) || !walkable(state, x, y) || unsafe(danger, x, y, state.time, state.time + 1.1 + node.path.length / a.speed)) continue;
        visited.add(k); queue.push({ x, y, path: [...node.path, dir] });
      }
    }
    if (best) move(state, a, best[0]);
  }
  function collect(state, a) {
    if (a.moveLeft > 0) return;
    const index = state.items.findIndex(i => i.readyAt <= state.time && i.x === a.x && i.y === a.y);
    if (index < 0) return;
    const item = state.items.splice(index, 1)[0];
    if (item.type === 'capacity') a.capacity = Math.min(5, a.capacity + 1);
    if (item.type === 'range') a.range = Math.min(6, a.range + 1);
    if (item.type === 'speed') a.speed = Math.min(8, a.speed + 0.65);
    if (item.type === 'shield') a.shield = true;
    if (a.id === 0) { state.score += 40; emit(state, 'pickup', { item: item.type, x: a.x, y: a.y }); }
  }
  function damage(state, a) {
    if (state.time < a.invincibleUntil) return;
    const p = position(a), x = Math.round(p.x), y = Math.round(p.y);
    if (!state.flames.some(f => f.x === x && f.y === y)) return;
    a.invincibleUntil = state.time + 1.65;
    if (a.shield) { a.shield = false; emit(state, 'shield', { x, y, ownerId: a.id }); return; }
    a.hp--; emit(state, 'hit', { x, y, ownerId: a.id });
    if (a.hp <= 0) { a.alive = false; a.moveLeft = 0; if (a.id !== 0) state.score += 250; emit(state, 'out', { x, y, ownerId: a.id }); }
  }
  function step(state, dt, input = {}) {
    if (state.mode !== 'running' || !Number.isFinite(dt) || dt <= 0) return;
    let left = Math.min(dt, 0.25);
    while (left > 0.00001 && state.mode === 'running') {
      const delta = Math.min(0.025, left); left -= delta; state.time += delta; state.remaining = Math.max(0, state.remaining - delta);
      state.flames = state.flames.filter(f => f.until > state.time);
      const due = state.bombs.filter(b => b.explodeAt <= state.time || state.flames.some(f => f.x === b.x && f.y === b.y));
      if (due.length) detonate(state, due);
      for (const a of state.actors) {
        if (!a.alive) continue;
        a.moveLeft = Math.max(0, a.moveLeft - delta);
        damage(state, a);
        if (!a.alive) continue;
        collect(state, a);
        if (a.id === 0) {
          if (input.bomb && !input.bombConsumed && placeBomb(state, a)) input.bombConsumed = true;
          if (Number.isInteger(input.direction)) move(state, a, input.direction);
        } else if (!input.noAI) think(state, a);
      }
      if (!state.actors[0].alive || state.remaining <= 0) {
        state.mode = 'lost'; emit(state, 'lost', { reason: state.remaining <= 0 ? 'timeout' : 'hearts' });
      } else if (state.actors.slice(1).every(a => !a.alive)) {
        state.score += 500 + Math.ceil(state.remaining) * 5;
        state.mode = state.stage === ROUNDS ? 'complete' : 'won'; emit(state, 'won', { final: state.mode === 'complete' });
      }
    }
  }
  return { WIDTH, HEIGHT, FLOOR, WALL, CRATE, FUSE, FLAME, ROUNDS, DIRS, create, start, pause, next, step, move, placeBomb, position, blastCells, hazards, escapePath, walkable, drainEvents, key };
});
