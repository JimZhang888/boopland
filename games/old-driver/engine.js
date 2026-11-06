/* Shared, deterministic parking simulation. Plain script also runs from file://. */
(function (root) {
  'use strict';
  const W = 800, H = 560, LENGTH = 58, WIDTH = 30;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const obstacle = (x, y, length, width, angle = 0, kind = 'car', color = '#c2cbd1') => ({ x, y, length, width, angle, kind, color });
  const cone = (x, y) => obstacle(x, y, 20, 20, 0, 'cone');
  const planter = (x, y, length, width) => obstacle(x, y, length, width, 0, 'planter');
  const bay = (x, y, angle, reverse = false, length = 100, width = 62) => ({ x, y, angle, reverse, length, width });
  const levels = [
    { id: 'first', par: 24, limit: 120, start: { x: 145, y: 304, angle: 0 }, target: bay(644, 304, 0),
      obstacles: [cone(330, 244), cone(330, 364), cone(490, 244), cone(490, 364), planter(400, 100, 390, 48), planter(400, 468, 390, 48)],
      guide: [[205, 304], [545, 304]], spots: [bay(645, 204, 0), bay(645, 404, 0)] },
    { id: 'turn', par: 36, limit: 150, start: { x: 135, y: 418, angle: 0 }, target: bay(641, 157, -Math.PI / 2),
      obstacles: [planter(340, 199, 300, 160), obstacle(532, 157, 58, 30, -Math.PI / 2), obstacle(739, 157, 58, 30, -Math.PI / 2), cone(540, 336), cone(730, 338)],
      guide: [[205, 418], [635, 418], [641, 267]], spots: [bay(532, 157, -Math.PI / 2), bay(739, 157, -Math.PI / 2)] },
    { id: 'reverse', par: 27, limit: 120, start: { x: 400, y: 401, angle: Math.PI / 2 }, target: bay(400, 151, Math.PI / 2, true),
      obstacles: [obstacle(297, 151, 58, 30, Math.PI / 2, 'car', '#c5bcc6'), obstacle(503, 151, 58, 30, Math.PI / 2), cone(348, 246), cone(452, 246), planter(135, 290, 66, 240), planter(665, 290, 66, 240)],
      guide: [[400, 340], [400, 239]], spots: [bay(297, 151, Math.PI / 2), bay(503, 151, Math.PI / 2)] },
    { id: 'slalom', par: 55, limit: 180, start: { x: 115, y: 411, angle: -Math.PI / 2 }, target: bay(666, 151, -Math.PI / 2),
      obstacles: [planter(275, 355, 68, 260), planter(485, 170, 68, 250), obstacle(566, 151, 58, 30, -Math.PI / 2), cone(760, 271)],
      guide: [[115, 320], [137, 143], [358, 143], [374, 409], [665, 409], [666, 259]], spots: [bay(566, 151, -Math.PI / 2)] },
    { id: 'parallel', par: 55, limit: 180, start: { x: 590, y: 291, angle: 0 }, target: bay(380, 154, 0, true, 122, 62),
      obstacles: [obstacle(258, 154, 70, 32, 0, 'car', '#c5bcc6'), obstacle(508, 154, 70, 32), planter(380, 93, 362, 30), planter(380, 450, 360, 50), cone(145, 154), cone(652, 154)],
      guide: [[545, 291], [458, 250], [380, 154]], spots: [bay(258, 154, 0, false, 102), bay(508, 154, 0, false, 102)] },
    { id: 'angle', par: 45, limit: 150, start: { x: 137, y: 411, angle: 0 }, target: bay(605, 178, -Math.PI / 4),
      obstacles: [obstacle(495, 168, 58, 30, -Math.PI / 4, 'car', '#c5bcc6'), obstacle(712, 205, 58, 30, -Math.PI / 4), planter(231, 157, 200, 100), cone(450, 330)],
      guide: [[205, 411], [470, 411], [556, 239]], spots: [bay(495, 168, -Math.PI / 4), bay(712, 205, -Math.PI / 4)] },
    { id: 'garage', par: 55, limit: 180, start: { x: 188, y: 422, angle: 0 }, target: bay(600, 146, Math.PI / 2, true, 98, 54),
      obstacles: [planter(351, 204, 256, 120), obstacle(531, 146, 72, 34, Math.PI / 2), obstacle(669, 146, 72, 34, Math.PI / 2, 'car', '#c5bcc6'), cone(530, 255), cone(670, 255)],
      guide: [[260, 422], [700, 422]], spots: [bay(531, 146, Math.PI / 2), bay(669, 146, Math.PI / 2)] },
    { id: 'master', par: 70, limit: 210, start: { x: 125, y: 435, angle: -Math.PI / 2 }, target: bay(655, 145, Math.PI / 2, true, 94, 54),
      obstacles: [planter(260, 358, 64, 268), planter(463, 165, 66, 235), obstacle(581, 145, 64, 32, Math.PI / 2), obstacle(729, 145, 64, 32, Math.PI / 2, 'car', '#c5bcc6'), cone(568, 252), cone(745, 252)],
      guide: [[125, 300], [137, 133], [355, 133], [370, 414], [660, 414]], spots: [bay(581, 145, Math.PI / 2), bay(729, 145, Math.PI / 2)] }
  ];
  function corners(rect) {
    const c = Math.cos(rect.angle), s = Math.sin(rect.angle);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({
      x: rect.x + a * rect.length / 2 * c - b * rect.width / 2 * s,
      y: rect.y + a * rect.length / 2 * s + b * rect.width / 2 * c
    }));
  }
  function overlaps(a, b) {
    const ca = corners(a), cb = corners(b);
    for (const rect of [a, b]) {
      for (const angle of [rect.angle, rect.angle + Math.PI / 2]) {
        const axis = { x: Math.cos(angle), y: Math.sin(angle) };
        const pa = ca.map(p => p.x * axis.x + p.y * axis.y);
        const pb = cb.map(p => p.x * axis.x + p.y * axis.y);
        if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
      }
    }
    return true;
  }
  function carRect(car) { return { ...car, length: LENGTH, width: WIDTH }; }
  function collision(car, level) {
    const rect = carRect(car);
    if (corners(rect).some(p => p.x < 25 || p.x > W - 25 || p.y < 25 || p.y > H - 25)) return true;
    return level.obstacles.some(other => overlaps(rect, other));
  }
  function parking(car, target) {
    const c = Math.cos(target.angle), s = Math.sin(target.angle);
    const inside = corners(carRect(car)).every(p => {
      const dx = p.x - target.x, dy = p.y - target.y;
      return Math.abs(dx * c + dy * s) < target.length / 2 - 2 && Math.abs(-dx * s + dy * c) < target.width / 2 - 2;
    });
    const angle = Math.abs(angleDiff(car.angle, target.angle));
    return { inside, aligned: angle < Math.PI / 18, stopped: Math.abs(car.speed) < 3,
      direction: !target.reverse || car.lastDirection === -1,
      accuracy: Math.round(clamp(100 - Math.hypot(car.x - target.x, car.y - target.y) * 1.2 - angle * 90, 0, 100)) };
  }
  class Game {
    constructor(index = 0) { this.reset(index); }
    reset(index = this.index || 0) {
      this.index = clamp(index, 0, levels.length - 1); this.level = levels[this.index];
      this.car = { ...this.level.start, speed: 0, steer: 0, lastDirection: 1 };
      this.elapsed = 0; this.hits = 0; this.hold = 0; this.flash = 0; this.contact = null;
      this.status = 'ready'; this.started = false; this.result = null;
    }
    start() { if (this.status === 'ready' || this.status === 'paused') this.status = 'playing'; }
    pause() { if (this.status === 'playing') this.status = 'paused'; }
    step(dt, input = {}) {
      if (this.status !== 'playing') return;
      // Small substeps prevent tunnelling at low frame rates.
      let remaining = clamp(dt, 0, 0.1);
      while (remaining > 0 && this.status === 'playing') {
        const step = Math.min(remaining, 1 / 120); this.integrate(step, input); remaining -= step;
      }
    }
    integrate(dt, input) {
      const car = this.car, previous = { x: car.x, y: car.y, angle: car.angle };
      const throttle = clamp(input.throttle || 0, -1, 1), steering = clamp(input.steering || 0, -1, 1);
      if (throttle) this.started = true;
      if (this.started) this.elapsed += dt;
      this.flash = Math.max(0, this.flash - dt);
      car.steer += (steering * 0.59 - car.steer) * Math.min(1, dt * 9);
      if (input.brake || (throttle && Math.sign(car.speed) !== Math.sign(throttle) && Math.abs(car.speed) > 2)) {
        car.speed = Math.sign(car.speed) * Math.max(0, Math.abs(car.speed) - 205 * dt);
      } else if (throttle) car.speed += throttle * 84 * dt;
      else car.speed = Math.sign(car.speed) * Math.max(0, Math.abs(car.speed) - (19 + Math.abs(car.speed) * 0.8) * dt);
      car.speed = clamp(car.speed, -65, 115);
      if (Math.abs(car.speed) > 2) car.lastDirection = Math.sign(car.speed);
      const turn = car.speed / 40 * Math.tan(car.steer) * dt;
      car.x += Math.cos(car.angle + turn / 2) * car.speed * dt;
      car.y += Math.sin(car.angle + turn / 2) * car.speed * dt;
      car.angle = angleDiff(car.angle + turn, 0);
      if (collision(car, this.level)) {
        Object.assign(car, previous); car.speed = 0; this.hold = 0;
        if (!this.contact) { this.hits++; this.flash = 0.65; this.contact = { x: car.x, y: car.y }; }
        if (this.hits >= 5) this.status = 'failed';
      } else if (this.contact && Math.hypot(car.x - this.contact.x, car.y - this.contact.y) > 7) this.contact = null;
      const check = parking(car, this.level.target);
      if (check.inside && check.aligned && check.stopped && check.direction) this.hold += dt;
      else this.hold = 0;
      if (this.hold >= 1.2) {
        const stars = this.hits === 0 && this.elapsed <= this.level.par && check.accuracy >= 70 ? 3 : this.hits <= 2 ? 2 : 1;
        this.result = { stars, accuracy: check.accuracy, time: this.elapsed, hits: this.hits,
          score: Math.max(100, Math.round(1000 + check.accuracy * 5 - this.elapsed * 4 - this.hits * 180)) };
        this.status = 'won'; car.speed = 0;
      } else if (this.elapsed >= this.level.limit) this.status = 'failed';
    }
  }
  const api = { W, H, LENGTH, WIDTH, levels, Game, corners, overlaps, collision, parking, angleDiff };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ParkingEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
