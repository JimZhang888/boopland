(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SlingshotPost = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 1000, HEIGHT = 560, GROUND = 502, GRAVITY = 440, SPEED = 760, STEP = 1 / 120;
  const ORIGIN = Object.freeze({ x: 140, y: 398 });
  const LEVELS = [
    { wind: 0, target: { x: 835, y: 340 }, obstacles: [], pads: [], aim: [42, 78] },
    { wind: 0, target: { x: 855, y: 345 }, bounce: true, obstacles: [], pads: [{ x1: 390, y1: 460, x2: 650, y2: 460 }], aim: [16, 70] },
    { wind: 75, target: { x: 865, y: 300 }, obstacles: [{ x: 500, y: 365, w: 60, h: 137 }], pads: [], aim: [46, 72] },
    { wind: -65, target: { x: 840, y: 300 }, obstacles: [{ x: 510, y: 360, w: 70, h: 142 }], pads: [{ x1: 355, y1: 464, x2: 480, y2: 448 }], aim: [48, 88] },
    { wind: 0, target: { x: 870, y: 355 }, switch: { x: 440, y: 310, r: 23 }, gate: { x: 680, y: 135, w: 23, h: 367 }, obstacles: [], pads: [], aim: [30, 78] },
    { wind: 40, target: { x: 875, y: 330 }, shutter: { x: 600, y: 280, w: 25, h: 170, amplitude: 100, period: 3.6 }, obstacles: [], pads: [], aim: [45, 76] },
    { wind: 0, target: { x: 860, y: 310, amplitude: 65, period: 4.8 }, bounce: true, obstacles: [], pads: [{ x1: 380, y1: 462, x2: 665, y2: 462 }], aim: [17, 71] },
    { wind: -30, target: { x: 895, y: 300 }, switch: { x: 380, y: 315, r: 25 }, gate: { x: 785, y: 120, w: 23, h: 382 }, bounce: true, obstacles: [], pads: [{ x1: 480, y1: 465, x2: 720, y2: 465 }], aim: [25, 84] }
  ];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function targetAt(level, time) {
    const t = level.target;
    return { x: t.x, y: t.y + (t.amplitude ? Math.sin(time * Math.PI * 2 / t.period) * t.amplitude : 0), w: 76, h: 62 };
  }
  function shutterAt(level, time) {
    const s = level.shutter;
    return s ? { ...s, y: s.y + Math.sin(time * Math.PI * 2 / s.period) * s.amplitude } : null;
  }
  function circleRect(ball, rect) {
    const px = clamp(ball.x, rect.x, rect.x + rect.w), py = clamp(ball.y, rect.y, rect.y + rect.h);
    const dx = ball.x - px, dy = ball.y - py, distance = Math.hypot(dx, dy);
    if (distance >= ball.r) return null;
    if (distance > 0.00001) return { nx: dx / distance, ny: dy / distance, depth: ball.r - distance };
    const sides = [
      { nx: -1, ny: 0, depth: ball.x - rect.x + ball.r },
      { nx: 1, ny: 0, depth: rect.x + rect.w - ball.x + ball.r },
      { nx: 0, ny: -1, depth: ball.y - rect.y + ball.r },
      { nx: 0, ny: 1, depth: rect.y + rect.h - ball.y + ball.r }
    ];
    return sides.sort((a, b) => a.depth - b.depth)[0];
  }
  function reflect(ball, nx, ny, depth, restitution) {
    ball.x += nx * (depth + 0.15); ball.y += ny * (depth + 0.15);
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot >= 0) return false;
    ball.vx -= (1 + restitution) * dot * nx;
    ball.vy -= (1 + restitution) * dot * ny;
    return true;
  }
  function padCollision(ball, pad) {
    const dx = pad.x2 - pad.x1, dy = pad.y2 - pad.y1, length = Math.hypot(dx, dy);
    const nx = dy / length, ny = -dx / length;
    const along = ((ball.x - pad.x1) * dx + (ball.y - pad.y1) * dy) / (length * length);
    if (along < 0 || along > 1) return false;
    const distance = (ball.x - pad.x1) * nx + (ball.y - pad.y1) * ny;
    if (distance < -ball.r || distance > ball.r || ball.vx * nx + ball.vy * ny >= 0) return false;
    return reflect(ball, nx, ny, ball.r - distance, 1.14);
  }
  class Game {
    constructor(level = 0) { this.reset(level); }
    reset(index = this.index) {
      this.index = clamp(Math.floor(Number(index) || 0), 0, LEVELS.length - 1);
      this.level = LEVELS[this.index]; this.state = 'ready'; this.time = 0; this.shots = 0;
      this.ball = null; this.trail = []; this.events = []; this.bounces = 0;
      this.switched = false; this.paused = false; this.flightTime = 0; this.accumulator = 0;
      this.stars = 0; this.trailClock = 0;
    }
    eligible() { return (!this.level.switch || this.switched) && (!this.level.bounce || this.bounces > 0); }
    launch(angle, power) {
      if (this.paused || this.state !== 'ready' || !Number.isFinite(angle) || !Number.isFinite(power) || power < 8) return false;
      const rad = clamp(angle, 5, 80) * Math.PI / 180, speed = SPEED * clamp(power, 8, 100) / 100;
      this.ball = { x: ORIGIN.x, y: ORIGIN.y, vx: Math.cos(rad) * speed, vy: -Math.sin(rad) * speed, r: 12, rotation: 0 };
      this.shots++; this.bounces = 0; this.switched = false; this.flightTime = 0; this.trailClock = 0;
      this.trail = [{ x: ORIGIN.x, y: ORIGIN.y }]; this.state = 'flying'; this.events.push('launch'); return true;
    }
    miss() { this.ball = null; this.switched = false; this.bounces = 0; this.state = this.shots >= 3 ? 'lost' : 'ready'; this.events.push('miss'); }
    advance(delta) {
      if (this.paused || !Number.isFinite(delta) || delta <= 0 || this.state === 'won' || this.state === 'lost') return;
      // Fixed small steps keep rebound and thin-gate collisions consistent across displays.
      this.accumulator += Math.min(delta, 0.1);
      while (this.accumulator >= STEP) { this.accumulator -= STEP; this.step(STEP); }
    }
    step(dt) {
      if (this.state === 'won' || this.state === 'lost') return;
      this.time += dt;
      if (this.state !== 'flying') return;
      const b = this.ball, l = this.level;
      this.flightTime += dt;
      b.vx += l.wind * dt; b.vy += GRAVITY * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.rotation += b.vx * dt / 42;
      if (l.switch && !this.switched && Math.hypot(b.x - l.switch.x, b.y - l.switch.y) < b.r + l.switch.r) {
        this.switched = true; this.events.push('switch');
      }
      for (const pad of l.pads) if (padCollision(b, pad)) { this.bounces++; this.events.push('bounce'); }
      const barriers = [...l.obstacles];
      if (l.gate && !this.switched) barriers.push(l.gate);
      const shutter = shutterAt(l, this.time); if (shutter) barriers.push(shutter);
      for (const rect of barriers) {
        const hit = circleRect(b, rect);
        if (hit && reflect(b, hit.nx, hit.ny, hit.depth, 0.65)) this.events.push('bump');
      }
      const t = targetAt(l, this.time);
      if (Math.abs(b.x - t.x) < t.w / 2 - 5 && Math.abs(b.y - t.y) < t.h / 2 - 4) {
        if (this.eligible()) {
          this.state = 'won'; this.stars = 4 - this.shots; this.events.push('win');
          b.x = t.x; b.y = t.y; return;
        }
        if (b.vx > 0) { b.x = t.x - t.w / 2 - b.r; b.vx *= -0.6; this.events.push('locked'); }
      }
      this.trailClock += dt;
      if (this.trailClock >= 0.035) { this.trailClock = 0; this.trail.push({ x: b.x, y: b.y }); if (this.trail.length > 140) this.trail.shift(); }
      if (b.y + b.r >= GROUND || b.x < -70 || b.x > WIDTH + 70 || b.y < -320 || this.flightTime > 10) this.miss();
    }
    drainEvents() { return this.events.splice(0); }
  }
  function preview(level, angle, power, time = 0) {
    // Simulate the actual rules on a separate instance; aiming never mutates a live run.
    const ghost = new Game(level); ghost.time = time; ghost.launch(angle, power);
    const points = [];
    for (let i = 0; i < 210 && ghost.state === 'flying'; i++) {
      ghost.step(STEP);
      if (i % 9 === 0 && ghost.ball) points.push({ x: ghost.ball.x, y: ghost.ball.y });
    }
    return points;
  }
  function cleanSave(raw) {
    const best = LEVELS.map((_, i) => Number.isInteger(raw?.best?.[i]) ? clamp(raw.best[i], 0, 3) : 0);
    let unlocked = 1;
    for (let i = 0; i < LEVELS.length - 1 && best[i] > 0; i++) unlocked = i + 2;
    return { best, unlocked, current: clamp(Number.isInteger(raw?.current) ? raw.current : 0, 0, unlocked - 1) };
  }
  return Object.freeze({ WIDTH, HEIGHT, GROUND, GRAVITY, SPEED, STEP, ORIGIN, LEVELS, Game, preview, targetAt, shutterAt, cleanSave, circleRect });
});
