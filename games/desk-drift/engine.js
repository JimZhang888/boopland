(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DeskDrift = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const TAU = Math.PI * 2, WIDTH = 960, HEIGHT = 700, ROAD = 100, RADIUS = 12;
  const TRACK_ID = 'desk-loop-1';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const anchors = [[300, 568], [605, 576], [790, 496], [810, 301], [678, 146], [505, 211], [338, 153], [164, 227], [145, 425]];
  const points = [];
  for (let i = 0; i < anchors.length; i++) {
    const p0 = anchors[(i + anchors.length - 1) % anchors.length], p1 = anchors[i], p2 = anchors[(i + 1) % anchors.length], p3 = anchors[(i + 2) % anchors.length];
    for (let j = 0; j < 48; j++) {
      const t = j / 48, t2 = t * t, t3 = t2 * t;
      const coord = k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      points.push({ x: coord(0), y: coord(1), s: 0 });
    }
  }
  let length = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    a.s = length; a.dx = b.x - a.x; a.dy = b.y - a.y; a.len = Math.hypot(a.dx, a.dy);
    length += a.len;
  }
  function at(distance) {
    const s = ((distance % length) + length) % length;
    let lo = 0, hi = points.length - 1;
    while (lo < hi) { const m = Math.ceil((lo + hi) / 2); if (points[m].s <= s) lo = m; else hi = m - 1; }
    const p = points[lo], f = (s - p.s) / p.len;
    return { x: p.x + p.dx * f, y: p.y + p.dy * f, angle: Math.atan2(p.dy, p.dx), s };
  }
  function nearest(x, y) {
    let best = null, min = Infinity;
    for (const p of points) {
      const t = clamp(((x - p.x) * p.dx + (y - p.y) * p.dy) / (p.len * p.len), 0, 1);
      const px = p.x + p.dx * t, py = p.y + p.dy * t, d2 = (x - px) ** 2 + (y - py) ** 2;
      if (d2 < min) { min = d2; best = { x: px, y: py, s: p.s + p.len * t, distance: Math.sqrt(d2), angle: Math.atan2(p.dy, p.dx) }; }
    }
    return best;
  }
  const obstacles = [
    { kind: 'eraser', x: 218, y: 359, w: 72, h: 115, angle: -.16 },
    { kind: 'cup', x: 709, y: 340, r: 43 },
    { kind: 'ruler', x: 450, y: 488, w: 252, h: 31, angle: -.1 }
  ];
  function contact(car, object) {
    if (object.r) {
      const dx = car.x - object.x, dy = car.y - object.y, d = Math.hypot(dx, dy);
      return d < object.r + RADIUS ? { nx: d ? dx / d : 1, ny: d ? dy / d : 0, depth: object.r + RADIUS - d } : null;
    }
    const c = Math.cos(object.angle), s = Math.sin(object.angle), dx = car.x - object.x, dy = car.y - object.y;
    const x = dx * c + dy * s, y = -dx * s + dy * c;
    let nx = x - clamp(x, -object.w / 2, object.w / 2), ny = y - clamp(y, -object.h / 2, object.h / 2), d = Math.hypot(nx, ny), depth;
    if (d >= RADIUS) return null;
    if (d === 0) {
      const ex = object.w / 2 - Math.abs(x), ey = object.h / 2 - Math.abs(y);
      nx = ex < ey ? (Math.sign(x) || 1) : 0; ny = ex < ey ? 0 : (Math.sign(y) || 1); depth = RADIUS + Math.min(ex, ey);
    } else { nx /= d; ny /= d; depth = RADIUS - d; }
    return { nx: nx * c - ny * s, ny: nx * s + ny * c, depth };
  }
  function makeRun() {
    const p = at(0), speed = 74;
    return { car: { x: p.x, y: p.y, angle: p.angle, vx: Math.cos(p.angle) * speed, vy: Math.sin(p.angle) * speed, steer: 0 }, time: 0, progress: 0, lastS: 0, nextGate: 1, splits: [], hits: 0, drift: 0, cooldown: 0, finished: false, expired: false, samples: [[0, p.x, p.y, p.angle, 0]], sampleClock: 0, impact: null };
  }
  function step(run, input, dt) {
    if (run.finished || run.expired || dt <= 0) return;
    dt = Math.min(dt, 1 / 30);
    const car = run.car, before = run.progress, previousTime = run.time;
    run.time += dt; run.cooldown = Math.max(0, run.cooldown - dt); run.impact = null;
    const steer = clamp(input.steer || 0, -1, 1), drifting = !!input.drift;
    car.steer += (steer - car.steer) * (1 - Math.exp(-dt * 14));
    const speed = Math.hypot(car.vx, car.vy);
    car.angle += car.steer * (drifting ? 2.6 : 1.7) * clamp(speed / 78, .28, 1.1) * dt;
    car.angle = Math.atan2(Math.sin(car.angle), Math.cos(car.angle));
    const fx = Math.cos(car.angle), fy = Math.sin(car.angle);
    let forward = car.vx * fx + car.vy * fy, lateral = -car.vx * fy + car.vy * fx;
    forward += ((drifting ? 76 : 98) - forward) * (drifting ? 2 : 1.5) * dt;
    lateral *= Math.exp(-(drifting ? 2.5 : 9) * dt);
    car.vx = fx * forward - fy * lateral; car.vy = fy * forward + fx * lateral;
    car.x += car.vx * dt; car.y += car.vy * dt;
    if (drifting && Math.abs(car.steer) > .18 && speed > 60) run.drift += dt;
    function bounce(hit) {
      car.x += hit.nx * (hit.depth + .15); car.y += hit.ny * (hit.depth + .15);
      const into = car.vx * hit.nx + car.vy * hit.ny;
      if (into < 0) { car.vx -= 1.35 * into * hit.nx; car.vy -= 1.35 * into * hit.ny; }
      if (!run.cooldown) {
        car.vx *= .62; car.vy *= .62; run.hits++; run.cooldown = .65;
        run.impact = { x: car.x - hit.nx * RADIUS, y: car.y - hit.ny * RADIUS, power: clamp(Math.abs(into) / 100, .25, 1) };
      }
    }
    for (const obstacle of obstacles) { const hit = contact(car, obstacle); if (hit) bounce(hit); }
    let near = nearest(car.x, car.y);
    if (near.distance > ROAD / 2 - RADIUS) {
      bounce({ nx: (near.x - car.x) / near.distance, ny: (near.y - car.y) / near.distance, depth: near.distance - (ROAD / 2 - RADIUS) });
      near = nearest(car.x, car.y);
    }
    let change = near.s - run.lastS;
    if (change < -length / 2) change += length;
    if (change > length / 2) change -= length;
    // Net, ordered progress: reversing at the line or cutting across the desk cannot finish a lap.
    if (Math.abs(change) < 20) run.progress += change;
    run.lastS = near.s;
    const gate = run.nextGate * length / 3;
    if (run.progress >= gate && before < gate) {
      const fraction = clamp((gate - before) / (run.progress - before), 0, 1);
      run.splits.push(previousTime + dt * fraction); run.nextGate++;
      if (run.nextGate === 4) { run.finished = true; run.time = run.splits[2]; run.progress = length; }
    }
    run.sampleClock += dt;
    if (run.sampleClock >= 1 / 30 || run.finished) {
      run.samples.push([run.time, car.x, car.y, car.angle, run.progress]); run.sampleClock %= 1 / 30;
    }
    if (run.time >= 180 && !run.finished) run.expired = true;
  }
  function ghostAt(record, time) {
    if (!record || time > record.time) return null;
    const samples = record.samples;
    let lo = 0, hi = samples.length - 1;
    while (lo + 1 < hi) { const m = (lo + hi) >> 1; if (samples[m][0] <= time) lo = m; else hi = m; }
    const a = samples[lo], b = samples[hi], f = clamp((time - a[0]) / (b[0] - a[0] || 1), 0, 1);
    return { x: a[1] + (b[1] - a[1]) * f, y: a[2] + (b[2] - a[2]) * f, angle: a[3] + angleDiff(b[3], a[3]) * f };
  }
  function timeAtProgress(record, progress) {
    if (!record || progress < 0) return null;
    for (let i = 1; i < record.samples.length; i++) {
      const a = record.samples[i - 1], b = record.samples[i];
      if (a[4] <= progress && b[4] >= progress && b[4] > a[4]) return a[0] + (b[0] - a[0]) * (progress - a[4]) / (b[4] - a[4]);
    }
    return progress >= length ? record.time : 0;
  }
  function recordOf(run) {
    return { version: 1, track: TRACK_ID, time: run.time, splits: run.splits.slice(), hits: run.hits, drift: run.drift, samples: run.samples.map(sample => sample.slice()) };
  }
  function validRecord(r) {
    if (!r || r.version !== 1 || r.track !== TRACK_ID || !Number.isFinite(r.time) || r.time < 10 || r.time > 180 || !Number.isInteger(r.hits) || r.hits < 0 || !Number.isFinite(r.drift) || r.drift < 0 || r.drift > r.time + .1) return false;
    if (!Array.isArray(r.splits) || r.splits.length !== 3 || r.splits.some((s, i) => !Number.isFinite(s) || s <= (i ? r.splits[i - 1] : 0)) || Math.abs(r.splits[2] - r.time) > .01) return false;
    if (!Array.isArray(r.samples) || r.samples.length < 3 || r.samples.length > 6000) return false;
    return r.samples.every((s, i) => Array.isArray(s) && s.length === 5 && s.every(Number.isFinite) && s[0] >= 0 && s[0] <= r.time + .001 && (i === 0 || s[0] > r.samples[i - 1][0]) && s[1] >= 0 && s[1] <= WIDTH && s[2] >= 0 && s[2] <= HEIGHT && Math.abs(s[3]) <= TAU && Math.abs(s[4]) <= length * 10) && r.samples[0][0] === 0 && Math.abs(r.samples.at(-1)[0] - r.time) < .01 && Math.abs(r.samples.at(-1)[4] - length) < .01;
  }
  return { WIDTH, HEIGHT, ROAD, RADIUS, TRACK_ID, points, length, obstacles, at, nearest, contact, makeRun, step, recordOf, validRecord, ghostAt, timeAtProgress, angleDiff, clamp };
});
