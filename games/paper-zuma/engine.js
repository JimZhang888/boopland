(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaperZuma = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 820, HEIGHT = 720, RADIUS = 18, SPACING = 36, STEP = 1 / 120;
  const LEVELS = Object.freeze([
    { count: 42, speed: 22, colors: 4 }, { count: 50, speed: 25, colors: 4 },
    { count: 58, speed: 28, colors: 4 }, { count: 64, speed: 29, colors: 5 },
    { count: 72, speed: 32, colors: 5 }, { count: 80, speed: 35, colors: 5 }
  ].map(Object.freeze));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const CONTROL_POINTS = [
    [64, 650], [72, 470], [68, 245], [100, 120], [230, 82], [500, 90],
    [695, 105], [752, 225], [750, 450], [700, 580], [530, 621], [310, 600],
    [200, 536], [178, 405], [216, 292], [330, 245], [500, 252],
    [600, 317], [612, 412], [560, 482]
  ];
  function transform(x, y, level) {
    return { x: level % 3 === 1 ? WIDTH - x : x, y: level % 3 === 2 ? HEIGHT - y : y };
  }
  function makePath(level) {
    const points = CONTROL_POINTS.map(([x, y]) => transform(x, y, level));
    const samples = [{ ...points[0], s: 0 }];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)], p1 = points[i];
      const p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
      for (let j = 1; j <= 48; j++) {
        const t = j / 48, t2 = t * t, t3 = t2 * t;
        const interpolate = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        const p = { x: interpolate('x'), y: interpolate('y') }, last = samples[samples.length - 1];
        p.s = last.s + Math.hypot(p.x - last.x, p.y - last.y);
        samples.push(p);
      }
    }
    const length = samples[samples.length - 1].s;
    function at(distance) {
      const s = clamp(distance, 0, length);
      let lo = 0, hi = samples.length - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].s < s) lo = mid; else hi = mid;
      }
      const a = samples[lo], b = samples[hi], span = b.s - a.s;
      const t = span ? (s - a.s) / span : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
        tx: (b.x - a.x) / span, ty: (b.y - a.y) / span };
    }
    return { samples, length, at };
  }
  // Earliest intersection along a swept shot, so fast projectiles cannot tunnel.
  function segmentCircle(x, y, dx, dy, cx, cy, radius) {
    const ox = x - cx, oy = y - cy, c = ox * ox + oy * oy - radius * radius;
    if (c <= 0) return 0;
    const a = dx * dx + dy * dy;
    if (!a) return null;
    const b = 2 * (ox * dx + oy * dy), discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    return t >= 0 && t <= 1 ? t : null;
  }
  class Game {
    constructor(random = Math.random) {
      this.random = random;
      this.nextId = 1;
      this.prepare(0, 0);
    }
    prepare(level = 0, score = 0) {
      this.level = clamp(Math.floor(level), 0, LEVELS.length - 1);
      this.config = LEVELS[this.level];
      this.path = makePath(this.level);
      this.origin = transform(410, 405, this.level);
      this.phase = 'ready';
      this.score = this.entryScore = score;
      this.elapsed = this.accumulator = this.cooldown = this.slowTime = 0;
      this.charge = 0;
      this.cleared = this.shotsFired = this.maxCombo = 0;
      this.chain = [];
      this.shots = [];
      this.events = [];
      let previous = -1, color = 0, group = 0;
      for (let i = 0; i < this.config.count; i++) {
        if (!group) {
          const choices = Array.from({ length: this.config.colors }, (_, c) => c).filter(c => c !== previous);
          color = choices[Math.floor(this.random() * choices.length) % choices.length];
          previous = color;
          group = this.random() < 0.7 ? 2 : 3;
        }
        this.chain.push({ id: this.nextId++, color, s: 690 - i * SPACING });
        group--;
      }
      this.current = this.pickColor();
      this.next = this.pickColor();
    }
    start() { if (this.phase === 'ready') this.phase = 'playing'; }
    pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.accumulator = 0; } }
    resume() { if (this.phase === 'paused') { this.phase = 'playing'; this.accumulator = 0; } }
    retry() { this.prepare(this.level, this.entryScore); this.start(); }
    advance() {
      if (this.phase !== 'cleared' || this.level >= LEVELS.length - 1) return false;
      this.prepare(this.level + 1, this.score);
      this.start();
      return true;
    }
    availableColors() {
      const visible = this.chain.filter(ball => ball.s >= 0);
      return [...new Set((visible.length ? visible : this.chain).map(ball => ball.color))];
    }
    pickColor() {
      const colors = this.availableColors();
      return colors.length ? colors[Math.floor(this.random() * colors.length) % colors.length] : 0;
    }
    refreshAmmo() {
      const colors = this.availableColors();
      if (!colors.length) return;
      if (!colors.includes(this.current)) this.current = this.pickColor();
      if (!colors.includes(this.next)) this.next = this.pickColor();
    }
    swap() {
      if (this.phase !== 'playing') return false;
      [this.current, this.next] = [this.next, this.current];
      this.events.push({ type: 'swap' });
      return true;
    }
    slow() {
      if (this.phase !== 'playing' || this.charge < 12 || this.slowTime > 0) return false;
      this.charge = 0;
      this.slowTime = 7;
      this.events.push({ type: 'slow' });
      return true;
    }
    fire(angle) {
      if (this.phase !== 'playing' || this.cooldown > 0 || !Number.isFinite(angle)) return false;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      this.shots.push({ x: this.origin.x + dx * 48, y: this.origin.y + dy * 48,
        vx: dx * 1000, vy: dy * 1000, color: this.current });
      this.current = this.next;
      this.next = this.pickColor();
      this.cooldown = 0.23;
      this.shotsFired++;
      this.events.push({ type: 'shot' });
      return true;
    }
    // Also used by the aiming guide; returns the first ball on the ray.
    trace(x, y, dx, dy) {
      let hit = null;
      for (let i = 0; i < this.chain.length; i++) {
        const ball = this.chain[i];
        if (ball.s < 0 || ball.s > this.path.length) continue;
        const point = this.path.at(ball.s);
        const t = segmentCircle(x, y, dx, dy, point.x, point.y, RADIUS * 2 - 1);
        if (t !== null && (!hit || t < hit.t)) hit = { index: i, t, point };
      }
      return hit;
    }
    insert(hitIndex, color, x, y) {
      const target = this.chain[hitIndex];
      if (!target) return;
      const point = this.path.at(target.s);
      const before = (x - point.x) * point.tx + (y - point.y) * point.ty >= 0;
      const index = hitIndex + (before ? 0 : 1);
      const front = this.chain[index - 1], rear = this.chain[index];
      const s = rear ? rear.s + SPACING : front.s - SPACING;
      if (front) {
        const push = Math.max(0, s + SPACING - front.s);
        for (let i = 0; i < index; i++) this.chain[i].s += push;
      }
      this.chain.splice(index, 0, { id: this.nextId++, s, color, fromX: x, fromY: y, settle: 0.12 });
      this.events.push({ type: 'insert', x, y, color });
      this.match(index, 1);
      this.refreshAmmo();
    }
    match(index, combo) {
      const ball = this.chain[index];
      if (!ball || ball.s < 0) return false;
      let first = index, last = index;
      while (first > 0 && this.chain[first - 1].color === ball.color &&
        this.chain[first - 1].s - this.chain[first].s <= SPACING + 0.5) first--;
      while (last + 1 < this.chain.length && this.chain[last + 1].s >= 0 &&
        this.chain[last + 1].color === ball.color &&
        this.chain[last].s - this.chain[last + 1].s <= SPACING + 0.5) last++;
      if (last - first + 1 < 3) return false;
      const removed = this.chain.splice(first, last - first + 1);
      const points = removed.length * 10 * combo;
      this.score += points;
      this.cleared += removed.length;
      this.charge = Math.min(12, this.charge + removed.length);
      this.maxCombo = Math.max(this.maxCombo, combo);
      this.events.push({ type: 'match', combo, points,
        balls: removed.map(item => ({ ...this.path.at(item.s), color: item.color })) });
      // Only a boundary created by an elimination can initiate a chain reaction.
      if (first > 0 && first < this.chain.length) this.chain[first].joinCombo = combo + 1;
      this.refreshAmmo();
      if (!this.chain.length) {
        const bonus = 100 * (this.level + 1);
        this.score += bonus;
        this.phase = this.level === LEVELS.length - 1 ? 'won' : 'cleared';
        this.shots = [];
        this.events.push({ type: 'clear', bonus });
      }
      return true;
    }
    step(dt) {
      this.elapsed += dt;
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.slowTime = Math.max(0, this.slowTime - dt);
      const entering = this.chain.length && this.chain[0].s < SPACING;
      const speed = entering ? 190 : this.config.speed * (this.slowTime > 0 ? 0.3 : 1);
      for (const ball of this.chain) {
        ball.s += speed * dt;
        ball.settle = Math.max(0, (ball.settle || 0) - dt);
      }
      for (let i = 1; i < this.chain.length; i++) {
        const front = this.chain[i - 1], rear = this.chain[i];
        const gap = front.s - rear.s - SPACING;
        if (gap > 0.01) {
          const pull = Math.min(gap, dt * (front.color === rear.color ? 320 : 150));
          for (let j = 0; j < i; j++) this.chain[j].s -= pull;
        }
        if (rear.joinCombo && this.chain[i - 1].s - rear.s <= SPACING + 0.01) {
          const combo = rear.joinCombo;
          delete rear.joinCombo;
          if (front.color === rear.color && this.match(i, combo)) break;
        }
      }
      if (this.phase !== 'playing') return;
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const shot = this.shots[i], dx = shot.vx * dt, dy = shot.vy * dt;
        const hit = this.trace(shot.x, shot.y, dx, dy);
        if (hit) {
          this.shots.splice(i, 1);
          this.insert(hit.index, shot.color, shot.x + dx * hit.t, shot.y + dy * hit.t);
          if (this.phase !== 'playing') break;
        } else {
          shot.x += dx; shot.y += dy;
          if (shot.x < -40 || shot.x > WIDTH + 40 || shot.y < -40 || shot.y > HEIGHT + 40) {
            this.shots.splice(i, 1);
          }
        }
      }
      if (this.phase === 'playing' && this.chain[0]?.s >= this.path.length) {
        this.phase = 'lost';
        this.shots = [];
        this.events.push({ type: 'lost' });
      }
    }
    update(dt) {
      if (this.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
      this.accumulator += Math.min(dt, 0.1);
      while (this.accumulator >= STEP && this.phase === 'playing') {
        this.step(STEP);
        this.accumulator -= STEP;
      }
    }
    drainEvents() { return this.events.splice(0); }
  }
  return { Game, WIDTH, HEIGHT, RADIUS, SPACING, STEP, LEVELS, makePath, segmentCircle };
});
