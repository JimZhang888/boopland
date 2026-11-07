(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaperBridge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 960, HEIGHT = 560, GRID = 40, DECK = 320, DT = 1 / 120;
  const MATERIALS = Object.freeze({
    road: { cost: 60, max: 90, stiffness: 22000, strength: 6000, weight: 0.8 },
    wood: { cost: 36, max: 130, stiffness: 35000, strength: 7200, weight: 0.45 },
    rope: { cost: 20, max: 360, stiffness: 24000, strength: 5000, weight: 0.15 }
  });
  const LEVELS = [
    { left: 320, right: 640, budget: 1600, limits: { road: 4, wood: 12, rope: 0 }, mass: 3, speed: 52, anchors: [], style: 'truss', height: -80 },
    { left: 280, right: 680, budget: 2050, limits: { road: 5, wood: 15, rope: 0 }, mass: 3.3, speed: 55, anchors: [], style: 'truss', height: -80 },
    { left: 280, right: 680, budget: 1350, limits: { road: 5, wood: 4, rope: 6 }, mass: 3, speed: 55, anchors: [[280, 160], [680, 160]], style: 'cable' },
    { left: 240, right: 720, budget: 2450, limits: { road: 6, wood: 18, rope: 2 }, mass: 3.6, speed: 58, anchors: [[440, 400], [520, 400]], style: 'truss', height: 80 },
    { left: 280, right: 680, budget: 2450, limits: { road: 5, wood: 15, rope: 4 }, mass: 6, speed: 48, anchors: [[480, 120]], style: 'hybrid', height: 80 },
    { left: 240, right: 720, budget: 1750, limits: { road: 6, wood: 4, rope: 8 }, mass: 4.2, speed: 56, anchors: [[240, 160], [720, 160]], style: 'cable' }
  ];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const snap = p => ({ x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID });
  const anchors = level => [{ x: level.left, y: DECK }, { x: level.right, y: DECK }, ...level.anchors.map(([x, y]) => ({ x, y }))];
  const cost = edge => Math.ceil(distance(edge.a, edge.b) / GRID * MATERIALS[edge.type].cost);
  function usage(edges) {
    const counts = { road: 0, wood: 0, rope: 0 };
    let spent = 0;
    edges.forEach(edge => { counts[edge.type]++; spent += cost(edge); });
    return { spent, counts };
  }
  function validate(level, edges, edge) {
    const material = Object.hasOwn(MATERIALS, edge.type) ? MATERIALS[edge.type] : null;
    if (!material || ![edge.a.x, edge.a.y, edge.b.x, edge.b.y].every(Number.isFinite)) return 'invalid';
    const length = distance(edge.a, edge.b);
    if (length < GRID - 1) return 'short';
    if (length > material.max + 0.01) return 'long';
    for (const p of [edge.a, edge.b]) {
      if (p.x < level.left || p.x > level.right || p.y < 80 || p.y > 440 || p.x % GRID || p.y % GRID) return 'bounds';
      if ((p.x === level.left || p.x === level.right) && p.y > DECK && !anchors(level).some(a => same(a, p))) return 'bounds';
    }
    if (edge.type === 'road' && Math.abs(edge.a.y - edge.b.y) > Math.abs(edge.a.x - edge.b.x) * 0.55) return 'slope';
    if (edges.some(e => (same(e.a, edge.a) && same(e.b, edge.b)) || (same(e.a, edge.b) && same(e.b, edge.a)))) return 'duplicate';
    // Collinear overlap would create invisible double-strength members.
    if (edges.some(e => {
      const dx = edge.b.x - edge.a.x, dy = edge.b.y - edge.a.y;
      const cross = p => (p.x - edge.a.x) * dy - (p.y - edge.a.y) * dx;
      if (Math.abs(cross(e.a)) > 0.1 || Math.abs(cross(e.b)) > 0.1) return false;
      const project = p => ((p.x - edge.a.x) * dx + (p.y - edge.a.y) * dy) / (length * length);
      const lo = Math.min(project(e.a), project(e.b)), hi = Math.max(project(e.a), project(e.b));
      return Math.min(1, hi) - Math.max(0, lo) > 0.01;
    })) return 'overlap';
    const used = usage(edges);
    if (used.counts[edge.type] >= level.limits[edge.type]) return 'stock';
    if (used.spent + cost(edge) > level.budget) return 'budget';
    return null;
  }
  function example(level) {
    const edges = [], add = (type, x1, y1, x2, y2) => edges.push({ type, a: { x: x1, y: y1 }, b: { x: x2, y: y2 } });
    const n = (level.right - level.left) / 80;
    for (let i = 0; i < n; i++) add('road', level.left + i * 80, DECK, level.left + (i + 1) * 80, DECK);
    if (level.style !== 'cable') {
      for (let i = 0; i < n; i++) {
        const x = level.left + i * 80, y = DECK + level.height;
        add('wood', x, DECK, x + 40, y);
        add('wood', x + 40, y, x + 80, DECK);
        if (i < n - 1) add('wood', x + 40, y, x + 120, y);
      }
    }
    if (level.style === 'cable') {
      for (let i = 1; i < n; i++) {
        const x = level.left + i * 80;
        const tower = level.anchors[x <= (level.left + level.right) / 2 ? 0 : 1];
        add('rope', tower[0], tower[1], x, DECK);
        if (x === (level.left + level.right) / 2) add('rope', level.anchors[1][0], level.anchors[1][1], x, DECK);
      }
    }
    if (level.style === 'hybrid') for (let i = 1; i < n; i++) add('rope', 480, 120, level.left + i * 80, DECK);
    return edges;
  }
  function connected(level, edges) {
    const start = `${level.left},${DECK}`, goal = `${level.right},${DECK}`, graph = new Map();
    for (const e of edges.filter(e => e.type === 'road')) {
      const a = `${e.a.x},${e.a.y}`, b = `${e.b.x},${e.b.y}`;
      if (!graph.has(a)) graph.set(a, []);
      if (!graph.has(b)) graph.set(b, []);
      graph.get(a).push(b); graph.get(b).push(a);
    }
    const seen = new Set([start]), queue = [start];
    while (queue.length) for (const next of graph.get(queue.shift()) || []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    return seen.has(goal);
  }
  function createSimulation(level, design) {
    const nodes = [], lookup = new Map();
    const fixed = anchors(level);
    function node(p) {
      const key = `${p.x},${p.y}`;
      if (!lookup.has(key)) {
        lookup.set(key, nodes.length);
        nodes.push({ x: p.x, y: p.y, ox: p.x, oy: p.y, px: p.x, py: p.y, vx: 0, vy: 0, fixed: fixed.some(a => same(a, p)), mass: 0.35, load: 0 });
      }
      return lookup.get(key);
    }
    const edges = design.map(e => {
      const a = node(e.a), b = node(e.b), material = MATERIALS[e.type];
      const length = distance(e.a, e.b), mass = material.weight * length / GRID / 2;
      nodes[a].mass += mass; nodes[b].mass += mass;
      return { a, b, type: e.type, length, lambda: 0, stress: 0, peak: 0, damage: 0, broken: false };
    });
    return { level, nodes, edges, time: 0, accumulator: 0, status: 'running', reason: null, broken: 0, maxStress: 0, paused: false,
      car: { x: level.left - 90, y: DECK - 13, vy: 0, angle: 0, air: 0, progress: 0, contacts: [] }, particles: [] };
  }
  function surface(sim, x, nearY) {
    const { level, nodes } = sim;
    if (x <= level.left || x >= level.right) return { y: DECK, edge: null, t: 0 };
    let result = null;
    sim.edges.forEach(edge => {
      if (edge.type !== 'road' || edge.broken) return;
      const a = nodes[edge.a], b = nodes[edge.b], dx = b.x - a.x;
      if (Math.abs(dx) < 3) return;
      const t = (x - a.x) / dx;
      if (t < -0.015 || t > 1.015) return;
      const y = a.y + (b.y - a.y) * t;
      if (Math.abs(y - nearY) < 38 && (!result || Math.abs(y - nearY) < Math.abs(result.y - nearY))) result = { y, edge, t: Math.max(0, Math.min(1, t)) };
    });
    return result;
  }
  function step(sim) {
    const { nodes, edges, car, level } = sim;
    const dt = DT, gravity = 260;
    sim.time += dt;
    nodes.forEach(n => { n.load = 0; });
    for (const hit of car.contacts) {
      if (hit?.edge && !hit.edge.broken) {
        nodes[hit.edge.a].load += level.mass * 0.5 * (1 - hit.t);
        nodes[hit.edge.b].load += level.mass * 0.5 * hit.t;
      }
    }
    nodes.forEach(n => {
      n.px = n.x; n.py = n.y;
      if (n.fixed) return;
      n.vx *= 0.992; n.vy *= 0.992;
      n.vy += gravity * (1 + n.load / n.mass) * dt;
      n.x += n.vx * dt; n.y += n.vy * dt;
    });
    edges.forEach(e => { e.lambda = 0; });
    // XPBD: rods resist both compression and tension; a slack rope exerts no push.
    for (let iteration = 0; iteration < 16; iteration++) {
      for (const e of edges) {
        if (e.broken) continue;
        const a = nodes[e.a], b = nodes[e.b], dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 0.001;
        const c = len - e.length;
        if (e.type === 'rope' && c <= 0 && e.lambda === 0) continue;
        const wa = a.fixed ? 0 : 1 / a.mass, wb = b.fixed ? 0 : 1 / b.mass;
        if (wa + wb === 0) continue;
        const alpha = 1 / (MATERIALS[e.type].stiffness * dt * dt);
        let dl = (-c - alpha * e.lambda) / (wa + wb + alpha);
        if (e.type === 'rope' && e.lambda + dl > 0) dl = -e.lambda;
        e.lambda += dl;
        a.x -= wa * dl * dx / len; a.y -= wa * dl * dy / len;
        b.x += wb * dl * dx / len; b.y += wb * dl * dy / len;
      }
    }
    nodes.forEach(n => {
      if (n.fixed) { n.x = n.ox; n.y = n.oy; return; }
      n.vx = (n.x - n.px) / dt; n.vy = (n.y - n.py) / dt;
    });
    for (const e of edges) {
      if (e.broken) continue;
      const force = Math.abs(e.lambda) / (dt * dt);
      const ratio = force / MATERIALS[e.type].strength;
      e.stress += (ratio - e.stress) * 0.08;
      e.peak = Math.max(e.peak, e.stress);
      sim.maxStress = Math.max(sim.maxStress, e.stress);
      e.damage = ratio > 1 ? e.damage + dt * (ratio - 0.85) : Math.max(0, e.damage - dt * 0.5);
      if (e.damage > 0.13 || distance(nodes[e.a], nodes[e.b]) > e.length * 1.22) { e.broken = true; sim.broken++; }
    }
    if (sim.time > 0.65) car.x += level.speed * dt * (car.air > 0.2 ? 0.6 : 1);
    const left = surface(sim, car.x - 20, car.y + 13), right = surface(sim, car.x + 20, car.y + 13);
    car.contacts = [left, right];
    if (left && right && Math.abs(left.y - right.y) < 32) {
      car.y = (left.y + right.y) / 2 - 13;
      car.angle += (Math.atan2(right.y - left.y, 40) - car.angle) * 0.2;
      car.vy = 0; car.air = 0;
    } else {
      car.vy += gravity * dt; car.y += car.vy * dt; car.air += dt;
      car.angle += dt * 0.7;
    }
    car.progress = Math.max(0, Math.min(1, (car.x - level.left) / (level.right - level.left)));
    if (car.y > 485 || car.air > 0.7 || sim.time > 24) {
      sim.status = 'lost'; sim.reason = sim.broken ? 'broken' : 'fall';
    } else if (car.x > level.right + 65 && car.air < 0.05) sim.status = 'won';
  }
  function advance(sim, seconds) {
    if (sim.paused || sim.status !== 'running') return sim;
    sim.accumulator += Math.max(0, Math.min(seconds, 0.1));
    while (sim.accumulator >= DT && sim.status === 'running') { step(sim); sim.accumulator -= DT; }
    return sim;
  }
  function stars(level, edges, sim) {
    if (sim.status !== 'won') return 0;
    return 1 + (sim.broken === 0 ? 1 : 0) + (usage(edges).spent <= level.budget * 0.85 ? 1 : 0);
  }
  function sanitizeDesign(level, value) {
    if (!Array.isArray(value) || value.length > 90) return [];
    const result = [];
    for (const e of value) {
      if (!e || !e.a || !e.b || validate(level, result, e)) return [];
      result.push({ type: e.type, a: { x: e.a.x, y: e.a.y }, b: { x: e.b.x, y: e.b.y } });
    }
    return result;
  }
  return { WIDTH, HEIGHT, GRID, DECK, DT, MATERIALS, LEVELS, snap, anchors, cost, usage, validate, example, connected, createSimulation, advance, stars, sanitizeDesign, distance };
});
