(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CatStealth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TILE = 48, COLS = 16, ROWS = 12, WIDTH = COLS * TILE, HEIGHT = ROWS * TILE;
  const point = (x, y) => ({ x: (x + .5) * TILE, y: (y + .5) * TILE });
  const LEVELS = [
    { name: 'level1', par: 100, start: [2, 9], blocks: [[4, 3, 2, 3], [9, 2, 3, 2], [9, 7, 3, 2], [4, 9, 2, 1]], boxes: [[3, 7], [7, 2], [13, 6]], fish: [[3, 2], [13, 2], [12, 9]], guards: [{ route: [[7, 5], [13, 5], [13, 9], [7, 9]], speed: 57, range: 165 }] },
    { name: 'level2', par: 135, start: [1, 10], blocks: [[3, 2, 2, 3], [7, 3, 2, 2], [11, 2, 2, 3], [4, 7, 3, 2], [10, 7, 3, 2]], boxes: [[2, 6], [6, 2], [9, 6], [13, 9]], fish: [[2, 2], [9, 2], [13, 5], [8, 9]], guards: [{ route: [[6, 1], [9, 1], [9, 5], [6, 5]], speed: 57, range: 168 }, { route: [[8, 6], [13, 6], [13, 10], [8, 10]], speed: 62, range: 175 }] },
    { name: 'level3', par: 170, start: [1, 10], blocks: [[3, 2, 3, 2], [9, 2, 3, 2], [5, 6, 2, 3], [10, 6, 3, 2], [2, 7, 1, 2]], boxes: [[2, 4], [7, 3], [13, 4], [8, 8], [3, 10]], fish: [[2, 2], [7, 1], [13, 2], [13, 9], [4, 6]], guards: [{ route: [[6, 4], [13, 4], [13, 1], [6, 1]], speed: 59, range: 174 }, { route: [[8, 5], [13, 5], [13, 10], [8, 10]], speed: 63, range: 178 }, { route: [[1, 5], [4, 5], [4, 10], [1, 10]], speed: 49, range: 145 }] }
  ];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  function wall(s, col, row) {
    return col < 1 || row < 1 || col >= COLS - 1 || row >= ROWS - 1 || s.level.blocks.some(([x, y, w, h]) => col >= x && col < x + w && row >= y && row < y + h);
  }
  function solid(s, x, y, r = 0) {
    for (const dx of [-r, r]) for (const dy of [-r, r]) if (wall(s, Math.floor((x + dx) / TILE), Math.floor((y + dy) / TILE))) return true;
    return false;
  }
  function lineClear(s, a, b) {
    const length = distance(a, b), steps = Math.ceil(length / 6);
    for (let i = 1; i <= steps; i++) if (solid(s, a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps)) return false;
    return true;
  }
  function path(s, from, to) {
    const a = [Math.floor(from.x / TILE), Math.floor(from.y / TILE)], b = [Math.floor(to.x / TILE), Math.floor(to.y / TILE)];
    if (wall(s, ...a) || wall(s, ...b)) return null;
    const key = (x, y) => y * COLS + x, origin = key(...a), end = key(...b);
    const queue = [a], visited = new Map([[origin, null]]);
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (key(x, y) === end) break;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (!wall(s, nx, ny) && !visited.has(k)) { visited.set(k, key(x, y)); queue.push([nx, ny]); }
      }
    }
    if (!visited.has(end)) return null;
    const result = [];
    for (let k = end; k !== origin; k = visited.get(k)) result.unshift(point(k % COLS, Math.floor(k / COLS)));
    // Start at the current tile's center before turning around shelf corners.
    if (result.length && distance(from, point(...a)) > 1) result.unshift(point(...a));
    result.push(solid(s, to.x, to.y, 12) ? point(...b) : { x: to.x, y: to.y });
    return result;
  }
  function create(index = 0) {
    index = Math.max(0, Math.min(LEVELS.length - 1, Math.trunc(Number(index)) || 0));
    const level = LEVELS[index];
    return { index, level, status: 'ready', time: 0, player: { ...point(...level.start), angle: -Math.PI / 2, hidden: -1, radius: 12 }, exit: point(...level.start),
      boxes: level.boxes.map(p => point(...p)), fish: level.fish.map(p => ({ ...point(...p), taken: false })),
      guards: level.guards.map(g => ({ ...g, ...point(...g.route[0]), route: g.route.map(p => point(...p)), waypoint: 1, angle: 0, suspicion: 0, mode: 'patrol', path: [], search: 0, wait: .6, repath: 0, alerted: false })),
      target: null, path: [], cooldown: 0, charges: 4, noises: [], events: [], alerts: 0, throws: 0, stars: 0 };
  }
  function emit(s, type) { s.events.push(type); }
  function moveTo(s, target) {
    if (s.status !== 'playing' || s.player.hidden >= 0) return false;
    if (!solid(s, target.x, target.y) && solid(s, target.x, target.y, s.player.radius)) target = point(Math.floor(target.x / TILE), Math.floor(target.y / TILE));
    const route = path(s, s.player, target);
    if (!route) { emit(s, 'blocked'); return false; }
    s.path = route; s.target = { ...target }; return true;
  }
  function nearbyBox(s) { return s.boxes.findIndex(b => distance(b, s.player) < 49 && lineClear(s, s.player, b)); }
  function hide(s) {
    if (s.status !== 'playing') return false;
    if (s.player.hidden >= 0) { s.player.hidden = -1; emit(s, 'unhidden'); return true; }
    const box = nearbyBox(s);
    if (box < 0) { emit(s, 'nearBox'); return false; }
    s.player.hidden = box; s.player.x = s.boxes[box].x; s.player.y = s.boxes[box].y;
    s.path = []; s.target = null; emit(s, 'hidden'); return true;
  }
  function throwNoise(s, target) {
    if (s.status !== 'playing' || s.cooldown > 0 || s.charges <= 0) return false;
    if (distance(s.player, target) > 240 || solid(s, target.x, target.y, 5) || !lineClear(s, s.player, target)) { emit(s, 'badThrow'); return false; }
    s.charges--; s.throws++; s.cooldown = 2.5;
    s.noises.push({ ...target, age: 0 });
    for (const g of s.guards) if (distance(g, target) < 290 && g.suspicion < .65) {
      g.mode = 'investigate'; g.path = path(s, g, target) || []; g.search = 3.5; g.wait = 0;
    }
    emit(s, 'thrown'); return true;
  }
  function sees(s, g) {
    if (s.player.hidden >= 0 || !lineClear(s, g, s.player)) return false;
    const d = distance(g, s.player);
    return d < 25 || (d < g.range && Math.abs(angleDiff(Math.atan2(s.player.y - g.y, s.player.x - g.x), g.angle)) < .57);
  }
  function translate(s, actor, dx, dy, r) {
    if (!solid(s, actor.x + dx, actor.y, r)) actor.x += dx;
    if (!solid(s, actor.x, actor.y + dy, r)) actor.y += dy;
  }
  function follow(s, actor, route, speed, dt, r) {
    if (!route.length) return false;
    const dest = route[0], d = distance(actor, dest);
    if (d < 2) { actor.x = dest.x; actor.y = dest.y; route.shift(); return route.length > 0; }
    const angle = Math.atan2(dest.y - actor.y, dest.x - actor.x);
    actor.angle += Math.max(-dt * 5, Math.min(dt * 5, angleDiff(angle, actor.angle)));
    const step = Math.min(d, speed * dt);
    translate(s, actor, Math.cos(angle) * step, Math.sin(angle) * step, r);
    return true;
  }
  function step(s, delta, input = {}) {
    if (s.status !== 'playing') return;
    const dt = Math.max(0, Math.min(.05, Number(delta) || 0));
    s.time += dt; s.cooldown = Math.max(0, s.cooldown - dt);
    s.noises.forEach(n => n.age += dt); s.noises = s.noises.filter(n => n.age < 2.5);
    const p = s.player;
    if (p.hidden < 0) {
      const dx = Number(input.x) || 0, dy = Number(input.y) || 0, length = Math.hypot(dx, dy);
      if (length) {
        s.path = []; s.target = null; p.angle = Math.atan2(dy, dx);
        translate(s, p, dx / length * 126 * dt, dy / length * 126 * dt, p.radius);
      } else { follow(s, p, s.path, 126, dt, p.radius); if (!s.path.length) s.target = null; }
      for (const fish of s.fish) if (!fish.taken && distance(p, fish) < 25) { fish.taken = true; emit(s, 'fish'); }
    }
    for (const g of s.guards) {
      const visible = sees(s, g);
      g.suspicion = Math.max(0, Math.min(1, g.suspicion + dt * (visible ? .8 : -.6)));
      if (g.suspicion >= .5 && !g.alerted) { g.alerted = true; s.alerts++; emit(s, 'spotted'); }
      if (g.suspicion < .08) g.alerted = false;
      if (g.suspicion >= 1) { s.status = 'caught'; s.path = []; emit(s, 'caught'); return; }
      if (visible && g.suspicion > .35) {
        g.mode = 'chase'; g.search = 2.7; g.wait = 0; g.repath -= dt;
        if (g.repath <= 0) { g.path = path(s, g, p) || []; g.repath = .35; }
      }
      if (g.wait > 0) { g.wait -= dt; continue; }
      if (g.mode === 'patrol' && !g.path.length) {
        g.path = path(s, g, g.route[g.waypoint]) || [];
        g.waypoint = (g.waypoint + 1) % g.route.length;
      }
      const moved = follow(s, g, g.path, g.speed * (g.mode === 'chase' ? 1.22 : 1), dt, 10);
      if (!moved) {
        if (g.mode === 'patrol') g.wait = .65;
        else { g.search -= dt; g.angle += dt * 1.25; if (g.search <= 0) { g.mode = 'patrol'; g.path = []; } }
      }
    }
    if (s.fish.every(f => f.taken) && p.hidden < 0 && distance(p, s.exit) < 29) {
      s.status = 'won'; s.stars = 1 + Number(s.alerts === 0) + Number(s.time <= s.level.par); emit(s, 'won');
    }
  }
  function cleanSave(raw) {
    const stars = LEVELS.map((_, i) => Math.max(0, Math.min(3, Math.trunc(Number(raw?.stars?.[i])) || 0)));
    const times = LEVELS.map((_, i) => Number.isFinite(raw?.times?.[i]) && raw.times[i] > 0 ? raw.times[i] : null);
    let unlocked = 0;
    while (unlocked < LEVELS.length - 1 && stars[unlocked] > 0) unlocked++;
    return { stars, times, unlocked };
  }
  return { TILE, COLS, ROWS, WIDTH, HEIGHT, LEVELS, point, distance, wall, solid, lineClear, path, create, moveTo, nearbyBox, hide, throwNoise, sees, step, cleanSave };
});
