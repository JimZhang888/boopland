(function (root) {
  'use strict';
  const SIZE = 1000, MARGIN = 65, GAP = 36, EPS = 0.00001;
  const clone = nodes => nodes.map(p => ({ x: p.x, y: p.y }));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const onSegment = (a, b, p) => Math.abs(cross(a, b, p)) < EPS && p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
  function contact(a, b, c, d) {
    const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
    if (abC * abD < 0 && cdA * cdB < 0) {
      const t = cdA / (cdA - cdB);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    for (const [p, u, v] of [[c, a, b], [d, a, b], [a, c, d], [b, c, d]]) {
      if (onSegment(u, v, p)) return { x: p.x, y: p.y };
    }
    return null;
  }
  function analyze(level, nodes) {
    const crossings = [], crowded = [];
    const edges = level.edges;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i], b = edges[j], shared = [a.a, a.b].find(id => id === b.a || id === b.b);
        if (shared !== undefined) {
          const p = nodes[shared], q = nodes[a.a === shared ? a.b : a.a], r = nodes[b.a === shared ? b.b : b.a];
          // Adjacent yarn segments may meet, but folding them over one another is still a knot.
          if (Math.abs(cross(p, q, r)) < EPS && (q.x - p.x) * (r.x - p.x) + (q.y - p.y) * (r.y - p.y) > EPS) {
            crossings.push({ x: (p.x + (distance(p, q) < distance(p, r) ? q.x : r.x)) / 2, y: (p.y + (distance(p, q) < distance(p, r) ? q.y : r.y)) / 2, edges: [i, j] });
          }
          continue;
        }
        const point = contact(nodes[a.a], nodes[a.b], nodes[b.a], nodes[b.b]);
        if (point) crossings.push({ ...point, edges: [i, j] });
      }
    }
    // Stacking nodes or shrinking a segment must never produce a false completion.
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      if (distance(nodes[i], nodes[j]) < GAP) crowded.push([i, j]);
    }
    return { crossings, crowded, solved: crossings.length === 0 && crowded.length === 0 };
  }
  function random(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const designs = [[2,2], [3,3], [3,3], [3,3,3], [4,4], [3,4,3], [4,4,4], [3,3,3,3], [4,4,4], [4,3,4,3], [4,4,4,4], [5,4,4,5]];
  const levels = designs.map((lengths, index) => {
    const solution = [], strands = [], edges = [];
    lengths.forEach((count, color) => {
      const strand = [];
      for (let i = 0; i < count; i++) {
        strand.push(solution.length);
        solution.push({ x: 140 + i * 720 / (count - 1), y: 220 + color * 560 / (lengths.length - 1) + (i % 2 ? 24 : -24) });
      }
      strands.push(strand);
      for (let i = 1; i < strand.length; i++) edges.push({ a: strand[i - 1], b: strand[i], color });
    });
    const level = { id: index + 1, strands, edges, solution };
    const rng = random(5849 + index * 217);
    const min = index === 0 ? 1 : Math.min(3 + index, 13), max = min + 5;
    let best = null, bestDifference = Infinity;
    for (let attempt = 0; attempt < 400; attempt++) {
      const nodes = clone(solution);
      for (let i = nodes.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [nodes[i], nodes[j]] = [nodes[j], nodes[i]]; }
      // A fixed, gentle jitter avoids collinear grids in the starting tangle.
      nodes.forEach(p => { p.x += (rng() - .5) * 42; p.y += (rng() - .5) * 42; });
      const result = analyze(level, nodes), n = result.crossings.length;
      const difference = n < min ? min - n : n > max ? n - max : 0;
      if (n > 0 && !result.crowded.length && difference < bestDifference) { best = nodes; bestDifference = difference; }
      if (bestDifference === 0) break;
    }
    level.initial = best;
    return level;
  });
  function hint(level, nodes) {
    let best = null, score = Infinity;
    const offsets = [[0,0], [0,-54], [0,54], [-54,0], [54,0], [-54,-54], [54,-54], [-54,54], [54,54]];
    for (let id = 0; id < nodes.length; id++) {
      const home = level.solution[id];
      // Disjoint home boxes preserve each strand's order while leaving room
      // around an occupied target. A hint should never ask the player to stack dots.
      if (Math.abs(nodes[id].x - home.x) <= 60 && Math.abs(nodes[id].y - home.y) <= 60) continue;
      for (const [dx, dy] of offsets) {
        const point = { x: home.x + dx, y: home.y + dy };
        if (nodes.some((p, i) => i !== id && distance(p, point) < GAP + 12)) continue;
        const next = clone(nodes); next[id] = point;
        const result = analyze(level, next);
        const cost = result.crossings.length + result.crowded.length * 3 + Math.hypot(dx, dy) / 1000;
        if (cost < score) { score = cost; best = { id, point }; }
      }
    }
    return best;
  }
  function spread(nodes) {
    const xs = nodes.map(p => p.x), ys = nodes.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const scale = Math.min(1.16, 820 / Math.max(1, maxX - minX), 820 / Math.max(1, maxY - minY));
    return nodes.map(p => ({ x: 500 + (p.x - cx) * scale, y: 500 + (p.y - cy) * scale }));
  }
  const clamp = p => ({ x: Math.max(MARGIN, Math.min(SIZE - MARGIN, p.x)), y: Math.max(MARGIN, Math.min(SIZE - MARGIN, p.y)) });
  const validNodes = (level, nodes) => Array.isArray(nodes) && nodes.length === level.initial.length && nodes.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= MARGIN && p.x <= SIZE - MARGIN && p.y >= MARGIN && p.y <= SIZE - MARGIN);
  const api = { levels, analyze, contact, clone, distance, hint, spread, clamp, validNodes, SIZE, GAP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.YarnUntangle = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis);
