(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CatMerge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WIDTH = 440, HEIGHT = 580, LEFT = 22, RIGHT = 418, FLOOR = 548;
  const DANGER = 112, SPAWN_Y = 57, STEP = 1 / 120, GRAVITY = 1050;
  const RADII = Object.freeze([18, 24, 31, 39, 48, 59, 71, 85, 101, 119]);
  const DROP_DELAY = .46, DANGER_TIME = 2;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function createGame(random = Math.random) {
    return { random, mode: 'ready', cats: [], events: [], time: 0, accumulator: 0,
      score: 0, drops: 0, merges: 0, combo: 0, bestCombo: 0, highest: 0, royals: 0,
      current: 0, next: 0, cooldown: 0, danger: 0, lastMerge: -10, nextId: 1 };
  }

  function start(game) {
    Object.assign(game, createGame(game.random));
    game.mode = 'playing';
  }

  function makeCat(game, level, x, y, extra = {}) {
    const radius = RADII[level];
    if (!radius) throw new RangeError('Unknown cat level');
    return { id: game.nextId++, level, r: radius, x: clamp(x, LEFT + radius, RIGHT - radius),
      y, vx: 0, vy: 0, angle: 0, age: 0, mergeWait: .12, ...extra };
  }

  function randomLevel(game) {
    // Only the four smallest cats can be dropped. Bigger cats must be earned.
    const n = clamp(Number(game.random()) || 0, 0, .999999);
    return n < .4 ? 0 : n < .72 ? 1 : n < .92 ? 2 : 3;
  }

  function aimX(game, x) {
    const r = RADII[game.current];
    return clamp(Number.isFinite(x) ? x : WIDTH / 2, LEFT + r + 1, RIGHT - r - 1);
  }

  function drop(game, x) {
    if (game.mode !== 'playing' || game.cooldown > 0) return null;
    const target = aimX(game, x), radius = RADII[game.current];
    // Do not insert a cat inside an existing one at the mouth of the box.
    if (game.cats.some(cat => Math.hypot(cat.x - target, cat.y - SPAWN_Y) < cat.r + radius - 2)) {
      game.events.push({ type: 'blocked' });
      return null;
    }
    const cat = makeCat(game, game.current, target, SPAWN_Y, { vy: 45 });
    game.cats.push(cat);
    game.drops++;
    game.highest = Math.max(game.highest, game.current);
    game.current = game.next;
    game.next = randomLevel(game);
    game.cooldown = DROP_DELAY;
    game.events.push({ type: 'drop', x: target, level: cat.level });
    return cat;
  }

  function constrain(cat) {
    if (cat.x < LEFT + cat.r) { cat.x = LEFT + cat.r; if (cat.vx < 0) cat.vx *= -.23; }
    if (cat.x > RIGHT - cat.r) { cat.x = RIGHT - cat.r; if (cat.vx > 0) cat.vx *= -.23; }
    if (cat.y > FLOOR - cat.r) {
      cat.y = FLOOR - cat.r;
      if (cat.vy > 0) cat.vy = cat.vy > 65 ? -cat.vy * .18 : 0;
      cat.vx *= .965;
    }
  }

  function collide(a, b) {
    let dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy), overlap = a.r + b.r - distance;
    if (overlap <= 0) return;
    // A deterministic normal also handles exactly coincident centers.
    if (distance < .0001) { dx = 0; dy = -1; }
    else { dx /= distance; dy /= distance; }
    const invA = 1 / (a.r * a.r), invB = 1 / (b.r * b.r), mass = invA + invB;
    const correction = Math.max(0, overlap - .03) * .85 / mass;
    a.x -= dx * correction * invA; a.y -= dy * correction * invA;
    b.x += dx * correction * invB; b.y += dy * correction * invB;
    const velocity = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy;
    if (velocity >= 0) return;
    const impulse = -(1 + (velocity < -90 ? .13 : 0)) * velocity / mass;
    a.vx -= impulse * dx * invA; a.vy -= impulse * dy * invA;
    b.vx += impulse * dx * invB; b.vy += impulse * dy * invB;
    const tangent = (b.vx - a.vx) * -dy + (b.vy - a.vy) * dx;
    const friction = clamp(-tangent / mass, -impulse * .16, impulse * .16);
    a.vx -= friction * -dy * invA; a.vy -= friction * dx * invA;
    b.vx += friction * -dy * invB; b.vy += friction * dx * invB;
  }

  function merge(game, a, b) {
    const royal = a.level === RADII.length - 1;
    const level = royal ? a.level : a.level + 1;
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    game.combo = game.time - game.lastMerge <= 1.65 ? game.combo + 1 : 1;
    game.lastMerge = game.time;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    game.merges++;
    game.highest = Math.max(game.highest, level);
    const points = (royal ? 4096 : 10 * 2 ** level) * Math.min(game.combo, 5);
    game.score += points;
    if (royal) game.royals++;
    else game.cats.push(makeCat(game, level, x, Math.min(y, FLOOR - RADII[level]), {
      vx: (a.vx + b.vx) * .35, vy: Math.min(0, (a.vy + b.vy) * .25) - 32,
      angle: (a.angle + b.angle) * .5
    }));
    game.events.push({ type: 'merge', x, y, level, points, combo: game.combo, royal });
  }

  function tick(game) {
    game.time += STEP;
    game.cooldown = Math.max(0, game.cooldown - STEP);
    for (const cat of game.cats) {
      cat.age += STEP;
      cat.mergeWait = Math.max(0, cat.mergeWait - STEP);
      cat.vy = Math.min(950, cat.vy + GRAVITY * STEP);
      cat.vx *= .999;
      cat.x += cat.vx * STEP; cat.y += cat.vy * STEP;
      cat.angle = clamp(cat.angle + cat.vx * STEP / cat.r * .18, -.45, .45);
      constrain(cat);
    }

    const removed = new Set(), pairs = [];
    for (let i = 0; i < game.cats.length; i++) {
      const a = game.cats[i];
      if (removed.has(a.id) || a.mergeWait > 0) continue;
      for (let j = i + 1; j < game.cats.length; j++) {
        const b = game.cats[j];
        if (removed.has(b.id) || b.mergeWait > 0 || a.level !== b.level) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) <= a.r + b.r + .4) {
          removed.add(a.id); removed.add(b.id); pairs.push([a, b]); break;
        }
      }
    }
    if (pairs.length) {
      game.cats = game.cats.filter(cat => !removed.has(cat.id));
      for (const [a, b] of pairs) merge(game, a, b);
    }
    // Small fixed time steps and iterative impulses keep a crowded box stable.
    for (let iteration = 0; iteration < 7; iteration++) {
      for (let i = 0; i < game.cats.length; i++) {
        const a = game.cats[i];
        for (let j = i + 1; j < game.cats.length; j++) {
          const b = game.cats[j];
          if (Math.abs(a.x - b.x) < a.r + b.r && Math.abs(a.y - b.y) < a.r + b.r) collide(a, b);
        }
      }
      for (const cat of game.cats) constrain(cat);
    }

    // New drops may pass the line. Only cats that remain above it cause a loss.
    const crowded = game.cats.some(cat => cat.age > 1.25 && cat.y - cat.r < DANGER);
    game.danger = crowded ? Math.min(DANGER_TIME, game.danger + STEP) : 0;
    if (game.danger >= DANGER_TIME) {
      game.mode = 'over';
      game.events.push({ type: 'over' });
    }
  }

  function advance(game, seconds) {
    if (game.mode !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
    game.accumulator += Math.min(seconds, .1);
    while (game.accumulator + 1e-9 >= STEP && game.mode === 'playing') {
      game.accumulator -= STEP;
      tick(game);
    }
  }

  function pause(game) { if (game.mode === 'playing') { game.mode = 'paused'; return true; } return false; }
  function resume(game) { if (game.mode === 'paused') { game.mode = 'playing'; game.accumulator = 0; return true; } return false; }
  function drainEvents(game) { return game.events.splice(0); }

  return { WIDTH, HEIGHT, LEFT, RIGHT, FLOOR, DANGER, SPAWN_Y, RADII, DROP_DELAY,
    DANGER_TIME, createGame, start, drop, aimX, makeCat, advance, pause, resume, drainEvents };
});
