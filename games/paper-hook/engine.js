(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaperHook = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const HEIGHT = 620, STEP = 1 / 120, REACH = 380, RADIUS = 15;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  // Each page has its own rhythm. Coordinates are independent of screen size.
  const routes = [
    [155, 175, 145, 170], [175, 115, 200, 140, 180],
    [150, 190, 125, 180, 145], [180, 120, 175, 110, 185, 150],
    [150, 180, 125, 170, 140], [175, 115, 180, 130, 190, 150],
    [145, 185, 125, 165, 115, 175], [170, 110, 185, 130, 180, 120, 160],
    [155, 190, 125, 175, 110, 165], [175, 120, 185, 140, 190, 115, 165],
    [150, 105, 185, 130, 180, 120, 170], [175, 120, 190, 130, 175, 110, 185, 145]
  ];
  const LEVELS = routes.map((heights, index) => {
    const gap = index < 4 ? 300 : index < 8 ? 315 : 325;
    const anchors = heights.map((y, i) => ({ id: i, x: 280 + i * gap, y }));
    const finish = anchors.at(-1).x + 295;
    const pads = [{ x: 10, y: 485, w: 175, bounce: false }, { x: finish - 55, y: 485, w: 235, bounce: false }];
    // Catch platforms make the early lessons forgiving without removing the swing.
    for (let i = 1; i < anchors.length; i += 2) pads.push({ x: anchors[i].x - 160, y: 535, w: 130, bounce: true });
    const hazards = [];
    if (index >= 4) {
      for (let i = 2; i < anchors.length - 1; i += 2) {
        hazards.push({ x: anchors[i].x + 135, y: index >= 8 ? 460 : 500, r: 29, travel: index >= 8 ? 28 : 0, phase: i });
      }
    }
    const picks = [0, Math.floor(anchors.length / 2), anchors.length - 1];
    const stars = picks.map((n, i) => ({ id: i, x: anchors[n].x + 40, y: anchors[n].y + 300 }));
    return { id: index, anchors, pads, hazards, stars, finish, width: finish + 220, chapter: Math.floor(index / 4) };
  });

  function create(level = 0) {
    const index = clamp(Math.floor(Number(level) || 0), 0, LEVELS.length - 1);
    return {
      level: index, status: 'ready', x: 100, y: 430, vx: 205, vy: -150,
      time: 0, rope: null, holding: false, released: -1, collected: [], events: [],
      trail: [], progress: 0, hooks: 0, bounces: 0, death: '', rotation: 0
    };
  }
  function start(s) { if (s.status === 'ready') s.status = 'playing'; }
  function candidate(s) {
    let best = null, score = Infinity;
    for (const a of LEVELS[s.level].anchors) {
      const dx = a.x - s.x, dy = a.y - s.y, d = Math.hypot(dx, dy);
      if (a.id === s.released || dx < -105 || dy > 55 || d > REACH || d < 45) continue;
      const rank = d + (dx < 20 ? 160 : 0);
      if (rank < score) { best = a; score = rank; }
    }
    return best;
  }
  function attach(s) {
    if (s.status !== 'playing' || s.rope) return;
    const a = candidate(s);
    if (!a) return;
    s.rope = { id: a.id, x: a.x, y: a.y, length: Math.hypot(s.x - a.x, s.y - a.y) };
    s.hooks++;
    s.events.push({ type: 'hook', x: a.x, y: a.y });
  }
  function hold(s, value) {
    if (s.status !== 'playing') return;
    s.holding = !!value;
    if (value) attach(s);
    else if (s.rope) {
      s.released = s.rope.id;
      s.rope = null;
      s.events.push({ type: 'release', x: s.x, y: s.y });
    }
  }
  function stopInput(s) { s.holding = false; }
  function pause(s) { if (s.status === 'playing') { stopInput(s); s.status = 'paused'; } }
  function resume(s) { if (s.status === 'paused') s.status = 'playing'; }
  function hazardPosition(h, time) { return { x: h.x, y: h.y + Math.sin(time * 1.6 + h.phase) * h.travel }; }
  function fail(s, reason) {
    s.status = 'lost'; s.death = reason; s.holding = false; s.rope = null;
    s.events.push({ type: 'lost', x: s.x, y: s.y });
  }
  function step(s, dt = STEP) {
    if (s.status !== 'playing') return;
    const level = LEVELS[s.level];
    dt = clamp(dt, 0, 1 / 30);
    s.time += dt;
    if (s.holding && !s.rope) attach(s);
    const prevY = s.y;
    s.vy += 830 * dt;
    if (s.rope) {
      const dx = s.x - s.rope.x, dy = s.y - s.rope.y;
      const len = Math.hypot(dx, dy) || 1;
      // A gentle clockwise push keeps a one-button pendulum lively.
      s.vx += dy / len * 115 * dt;
      s.vy -= dx / len * 115 * dt;
    } else s.vx += 42 * dt;
    s.vx = clamp(s.vx, -850, 950); s.vy = clamp(s.vy, -1000, 1150);
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.rope) {
      const dx = s.x - s.rope.x, dy = s.y - s.rope.y, d = Math.hypot(dx, dy) || 1;
      if (d > s.rope.length) {
        const nx = dx / d, ny = dy / d;
        s.x = s.rope.x + nx * s.rope.length;
        s.y = s.rope.y + ny * s.rope.length;
        const outward = s.vx * nx + s.vy * ny;
        if (outward > 0) { s.vx -= outward * nx; s.vy -= outward * ny; }
      }
    }
    for (const pad of level.pads) {
      if (s.vy >= 0 && prevY + RADIUS <= pad.y + 3 && s.y + RADIUS >= pad.y && s.x > pad.x - RADIUS / 2 && s.x < pad.x + pad.w + RADIUS / 2) {
        s.y = pad.y - RADIUS;
        if (pad.bounce) {
          s.vy = -680; s.vx = Math.max(295, s.vx);
          if (s.rope) s.released = s.rope.id;
          s.rope = null; s.bounces++;
          s.events.push({ type: 'bounce', x: s.x, y: pad.y });
        } else { s.vy = -190; s.vx = Math.max(240, s.vx); }
      }
    }
    for (const star of level.stars) {
      if (!s.collected.includes(star.id) && Math.hypot(star.x - s.x, star.y - s.y) < 42) {
        s.collected.push(star.id); s.events.push({ type: 'star', x: star.x, y: star.y });
      }
    }
    for (const h of level.hazards) {
      const pos = hazardPosition(h, s.time);
      if (Math.hypot(pos.x - s.x, pos.y - s.y) < h.r + RADIUS - 4) { fail(s, 'hazard'); return; }
    }
    s.progress = clamp((s.x - 100) / (level.finish - 100), 0, 1);
    if (s.x >= level.finish && s.y > -100 && s.y < 505) {
      s.status = 'won'; s.holding = false; s.rope = null; s.progress = 1;
      s.events.push({ type: 'won', x: s.x, y: s.y });
    } else if (s.y > HEIGHT + 70 || s.y < -800 || s.x < -150 || s.x > level.width + 50) fail(s, 'fall');
  }
  function readProgress(raw) {
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }
    const unlocked = Number.isInteger(data?.unlocked) ? clamp(data.unlocked, 1, LEVELS.length) : 1;
    return {
      unlocked,
      stars: LEVELS.map((_, i) => Number.isInteger(data?.stars?.[i]) ? clamp(data.stars[i], 0, 3) : 0),
      times: LEVELS.map((_, i) => Number.isFinite(data?.times?.[i]) && data.times[i] > 0 ? data.times[i] : null)
    };
  }
  function record(progress, s) {
    if (s.status !== 'won') return;
    progress.unlocked = Math.max(progress.unlocked, Math.min(LEVELS.length, s.level + 2));
    progress.stars[s.level] = Math.max(progress.stars[s.level], s.collected.length);
    progress.times[s.level] = Math.min(progress.times[s.level] || Infinity, s.time);
  }
  return { HEIGHT, STEP, REACH, RADIUS, LEVELS, create, start, candidate, hold, stopInput, pause, resume, step, hazardPosition, readProgress, record };
});
