(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RopeGarden = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 600, HEIGHT = 560, STEP = 1 / 120, RADIUS = 17;
  const LEVELS = [
    { candy: [300, 175], anchors: [[300, 60]], goal: [300, 470], stars: [[300, 260], [300, 345], [300, 420]], hint: 'cut' },
    { candy: [280, 210], anchors: [[155, 65], [405, 65]], goal: [465, 470], stars: [[325, 235], [390, 290], [445, 390]], hint: 'right' },
    { candy: [320, 210], anchors: [[195, 65], [445, 65]], goal: [135, 470], stars: [[275, 235], [210, 290], [155, 390]], hint: 'left' },
    { candy: [150, 160], anchors: [[300, 65]], goal: [435, 470], stars: [[215, 220], [315, 270], [395, 370]], hint: 'swing' },
    { candy: [300, 190], anchors: [[165, 55], [435, 55]], goal: [465, 470], stars: [[355, 220], [420, 290], [460, 390]], hazards: [{ x: 265, y: 310, w: 90, h: 26 }], hint: 'spikes' },
    { candy: [300, 190], anchors: [[160, 60], [440, 60], [300, 40]], goal: [135, 470], stars: [[255, 220], [185, 285], [140, 390]], hazards: [{ x: 270, y: 315, w: 95, h: 26 }], hint: 'three' },
    { candy: [300, 400], anchors: [[300, 495]], goal: [300, 260], stars: [[300, 350], [300, 225], [300, 130]], bubble: true, hint: 'bubble' },
    { candy: [245, 390], anchors: [[245, 495]], goal: [420, 350], stars: [[260, 305], [300, 210], [360, 220]], bubble: true, wind: 75, hint: 'breeze' },
    { candy: [300, 180], anchors: [[170, 55], [430, 55]], goal: [465, 455], stars: [[355, 215], [425, 300], [465, 390]], hazards: [{ x: 230, y: 310, w: 110, h: 24, amplitude: 65, period: 3.4 }], hint: 'moving' },
    { candy: [300, 410], anchors: [[200, 495], [400, 495]], goal: [445, 330], stars: [[350, 365], [420, 280], [450, 175]], bubble: true, hint: 'float' },
    { candy: [450, 155], anchors: [[300, 60]], goal: [150, 465], stars: [[385, 220], [275, 280], [185, 375]], hazards: [{ x: 325, y: 340, w: 115, h: 24 }], hint: 'timing' },
    { candy: [270, 195], anchors: [[140, 60], [400, 60], [270, 35]], goal: [470, 465], stars: [[335, 225], [405, 290], [460, 395]], hazards: [{ x: 230, y: 325, w: 100, h: 24, amplitude: 50, period: 4 }], hint: 'final' }
  ];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
    const t = d ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / d, 0, 1) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  function segmentsNear(a, b, c, d, radius) {
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const u = cross(a, b, c), v = cross(a, b, d), w = cross(c, d, a), z = cross(c, d, b);
    const overlaps = Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) && Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y));
    if (overlaps && u * v <= 0 && w * z <= 0) return true;
    return Math.min(distanceToSegment(a, c, d), distanceToSegment(b, c, d), distanceToSegment(c, a, b), distanceToSegment(d, a, b)) <= radius;
  }
  function obstacleAt(obstacle, time) {
    return { ...obstacle, x: obstacle.x + (obstacle.amplitude ? Math.sin(time * Math.PI * 2 / obstacle.period) * obstacle.amplitude : 0) };
  }
  function create(index = 0) {
    index = clamp(Number.isInteger(index) ? index : 0, 0, LEVELS.length - 1);
    const level = LEVELS[index];
    const candy = { x: level.candy[0], y: level.candy[1], vx: 0, vy: 0, bubble: !!level.bubble };
    return { index, level, candy, ropes: level.anchors.map(([x, y], id) => ({ id, x, y, length: Math.hypot(x - candy.x, y - candy.y), cut: false })), stars: level.stars.map(([x, y]) => ({ x, y, collected: false })), time: 0, accumulator: 0, status: 'playing', paused: false, cuts: 0, events: [] };
  }
  function cut(state, id) {
    const rope = state.ropes[id];
    if (state.status !== 'playing' || state.paused || !rope || rope.cut) return false;
    rope.cut = true; state.cuts++;
    state.events.push({ type: 'cut', x: (rope.x + state.candy.x) / 2, y: (rope.y + state.candy.y) / 2, id });
    return true;
  }
  function swipe(state, from, to, tolerance = 9) {
    if (state.status !== 'playing' || state.paused) return 0;
    let count = 0;
    for (const rope of state.ropes) {
      if (rope.cut) continue;
      const points = ropePoints(rope, state.candy);
      if (points.slice(1).some((p, i) => segmentsNear(from, to, points[i], p, tolerance))) count += cut(state, rope.id) ? 1 : 0;
    }
    return count;
  }
  function ropePoints(rope, candy) {
    const slack = Math.max(0, rope.length - Math.hypot(rope.x - candy.x, rope.y - candy.y));
    const mx = (rope.x + candy.x) / 2, my = (rope.y + candy.y) / 2 + Math.min(28, slack * .6);
    return Array.from({ length: 9 }, (_, i) => { const t = i / 8, u = 1 - t; return { x: u * u * rope.x + 2 * t * u * mx + t * t * candy.x, y: u * u * rope.y + 2 * t * u * my + t * t * candy.y }; });
  }
  function pop(state) {
    if (state.status !== 'playing' || state.paused || !state.candy.bubble) return false;
    state.candy.bubble = false;
    state.events.push({ type: 'pop', x: state.candy.x, y: state.candy.y });
    return true;
  }
  function finish(state, status) {
    state.status = status;
    state.events.push({ type: status, x: state.candy.x, y: state.candy.y });
  }
  function tick(state) {
    const c = state.candy, before = { x: c.x, y: c.y };
    state.time += STEP;
    c.vx = (c.vx + (state.level.wind || 0) * STEP) * (c.bubble ? .996 : .9996);
    c.vy = c.bubble ? Math.max(-115, c.vy - 320 * STEP) : c.vy + 620 * STEP;
    c.x += c.vx * STEP; c.y += c.vy * STEP;
    // A rope pulls but cannot push. Project position, then remove outward velocity.
    for (let iteration = 0; iteration < 8; iteration++) {
      for (const rope of state.ropes) {
        if (rope.cut) continue;
        const dx = c.x - rope.x, dy = c.y - rope.y, distance = Math.hypot(dx, dy);
        if (distance > rope.length) { c.x = rope.x + dx / distance * rope.length; c.y = rope.y + dy / distance * rope.length; }
      }
    }
    for (let iteration = 0; iteration < 6; iteration++) {
      for (const rope of state.ropes) {
        if (rope.cut) continue;
        const dx = c.x - rope.x, dy = c.y - rope.y, distance = Math.hypot(dx, dy);
        if (distance >= rope.length - .05 && distance > 0) {
          const outward = (c.vx * dx + c.vy * dy) / distance;
          if (outward > 0) { c.vx -= outward * dx / distance; c.vy -= outward * dy / distance; }
        }
      }
    }
    for (const obstacle of state.level.hazards || []) {
      const h = obstacleAt(obstacle, state.time);
      const near = { x: clamp(c.x, h.x, h.x + h.w), y: clamp(c.y, h.y - 9, h.y + h.h) };
      if (Math.hypot(c.x - near.x, c.y - near.y) < RADIUS + 1) { finish(state, 'lost'); return; }
    }
    for (const star of state.stars) {
      if (!star.collected && distanceToSegment(star, before, c) < RADIUS + 13) { star.collected = true; state.events.push({ type: 'star', x: star.x, y: star.y }); }
    }
    const [gx, gy] = state.level.goal;
    if (!c.bubble && distanceToSegment({ x: gx, y: gy }, before, c) < RADIUS + 28) { finish(state, 'won'); return; }
    if (c.x < -60 || c.x > WIDTH + 60 || c.y > HEIGHT + 60 || c.y < -70) finish(state, 'lost');
  }
  function advance(state, seconds) {
    if (state.status !== 'playing' || state.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    state.accumulator += Math.min(seconds, .1);
    while (state.accumulator + 1e-10 >= STEP && state.status === 'playing') { state.accumulator -= STEP; tick(state); }
  }
  function score(state) { return state.stars.filter(star => star.collected).length; }
  function cleanSave(raw) {
    const record = raw && typeof raw === 'object' ? raw : {};
    const best = LEVELS.map((_, i) => Number.isInteger(record.best?.[i]) && record.best[i] >= 0 && record.best[i] <= 3 ? record.best[i] : -1);
    // Only a contiguous set of completed levels can unlock later pages.
    let unlocked = 0;
    while (unlocked < LEVELS.length - 1 && best[unlocked] >= 0) unlocked++;
    return { best, current: clamp(Number.isInteger(record.current) ? record.current : 0, 0, unlocked), unlocked, sound: record.sound === true };
  }
  return { WIDTH, HEIGHT, STEP, RADIUS, LEVELS, create, cut, swipe, pop, advance, score, cleanSave, obstacleAt, distanceToSegment };
});
