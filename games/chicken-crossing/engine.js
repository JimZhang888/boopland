/* Pure simulation: plain browser script and CommonJS for deterministic checks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChickenCrossing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const COLS = 11, HOP = 0.16, EDGE = 5, SPAN = COLS + EDGE * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (n, m) => ((n % m) + m) % m;

  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.status = 'ready'; this.reason = ''; this.time = 0; this.score = 0;
      this.idle = 0; this.camera = 0; this.events = []; this.lanes = new Map();
      this.player = { x: 5, row: 0, visualRow: 0, hop: null, facing: 'up' };
      this.lastRow = -1;
      const opening = ['grass', 'grass', 'grass', 'road', 'road', 'grass', 'river', 'river', 'grass', 'rail', 'grass'];
      for (const type of opening) this.addLane(type);
      this.ensure(36);
    }
    start() { if (this.status === 'ready' || this.status === 'paused') this.status = 'playing'; }
    pause() { if (this.status === 'playing') this.status = 'paused'; }
    fail(reason) {
      if (this.status !== 'playing') return;
      this.status = 'dead'; this.reason = reason; this.events.push({ type: 'dead', reason });
    }
    addLane(type) {
      const row = ++this.lastRow, r = this.random, dir = r() > 0.5 ? 1 : -1;
      const difficulty = Math.min(row / 130, 1);
      const lane = { row, type, seed: r() * 1000, dir, objects: [], blocks: [], phase: 'wait' };
      if (type === 'road' || type === 'river') {
        lane.speed = dir * (type === 'road' ? 1 + r() * 0.65 + difficulty * 1.1 : 0.5 + r() * 0.3 + difficulty * 0.3);
        const count = type === 'road' ? 4 : 4, gap = SPAN / count, offset = r() * gap;
        for (let i = 0; i < count; i++) {
          lane.objects.push({ x: -EDGE + i * gap + offset, width: type === 'river' ? 3.15 + r() * 0.55 : 1.3 + r() * 0.8, color: Math.floor(r() * 4) });
        }
      }
      if (type === 'grass' && row > 1) {
        // A permanently open middle corridor prevents solid, unpassable grass bands.
        for (let col = 0; col < COLS; col++) {
          if (Math.abs(col - 5) > 1 && r() < 0.19) lane.blocks.push({ x: col, kind: r() < 0.7 ? 'tree' : 'rock' });
        }
      }
      if (type === 'rail') { lane.timer = 3.5 + r() * 4; lane.train = null; lane.cycle = 0; }
      this.lanes.set(row, lane);
      return lane;
    }
    ensure(row) {
      while (this.lastRow < row) {
        const r = this.random();
        const type = r < 0.49 ? 'road' : r < 0.81 ? 'river' : 'rail';
        const count = type === 'rail' ? 1 : 2 + Number(this.lastRow > 35 && this.random() > 0.55);
        for (let i = 0; i < count; i++) this.addLane(type);
        this.addLane('grass');
        if (this.random() > 0.7) this.addLane('grass');
      }
    }
    lane(row) { return this.lanes.get(row); }
    supported(lane, x) { return lane?.objects.find(o => Math.abs(x - o.x) <= o.width / 2 - 0.12); }
    move(dx, dy) {
      if (this.status !== 'playing' || this.player.hop || Math.abs(dx) + Math.abs(dy) !== 1) return false;
      const p = this.player, row = p.row + dy, x = dx ? p.x + dx : Math.round(p.x);
      if (row < Math.max(0, this.score - 5) || x < 0 || x > COLS - 1) return false;
      this.ensure(row + 30);
      const lane = this.lane(row);
      if (lane.blocks.some(b => Math.abs(b.x - x) < 0.7)) { this.events.push({ type: 'blocked' }); return false; }
      p.facing = dy > 0 ? 'up' : dy < 0 ? 'down' : dx > 0 ? 'right' : 'left';
      p.hop = { fromX: p.x, fromRow: p.row, toX: x, toRow: row, elapsed: 0 };
      this.events.push({ type: 'hop' });
      return true;
    }
    update(dt) {
      if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
      // Substeps keep fast trains and frame drops from tunnelling through the chicken.
      let remaining = Math.min(dt, 0.25);
      while (remaining > 0.000001 && this.status === 'playing') {
        const step = Math.min(remaining, 1 / 120);
        this.step(step); remaining -= step;
      }
    }
    step(dt) {
      this.time += dt; this.idle += dt;
      const p = this.player;
      const carriedBy = !p.hop && this.lane(p.row)?.type === 'river' ? this.supported(this.lane(p.row), p.x) : null;
      for (const lane of this.lanes.values()) {
        if (lane.type === 'road' || lane.type === 'river') {
          for (const o of lane.objects) o.x = mod(o.x + lane.speed * dt + EDGE, SPAN) - EDGE;
        } else if (lane.type === 'rail') {
          lane.timer -= dt;
          if (lane.phase === 'wait' && lane.timer <= 0) {
            lane.phase = 'warning'; lane.timer = 2.1; lane.cycle++;
            this.events.push({ type: 'warning', row: lane.row });
          } else if (lane.phase === 'warning' && lane.timer <= 0) {
            lane.phase = 'passing'; lane.train = { x: lane.dir > 0 ? -9 : COLS + 8, width: 8 };
          }
          if (lane.phase === 'passing') {
            lane.train.x += lane.dir * 15 * dt;
            if (lane.dir > 0 ? lane.train.x > COLS + 9 : lane.train.x < -10) {
              lane.phase = 'wait'; lane.train = null; lane.timer = 5.5 + this.random() * 3.5;
            }
          }
        }
      }
      if (carriedBy) p.x += this.lane(p.row).speed * dt;
      let landed = false;
      if (p.hop) {
        const h = p.hop; h.elapsed = Math.min(HOP, h.elapsed + dt);
        const t = h.elapsed / HOP;
        p.x = h.fromX + (h.toX - h.fromX) * t;
        p.visualRow = h.fromRow + (h.toRow - h.fromRow) * t;
        if (h.elapsed >= HOP - 1e-8) {
          p.x = h.toX; p.row = h.toRow; p.visualRow = p.row; p.hop = null; landed = true;
        }
      } else p.visualRow = p.row;
      const physicalRow = p.visualRow;
      for (let row = Math.floor(physicalRow); row <= Math.ceil(physicalRow); row++) {
        const lane = this.lane(row);
        if (!lane || Math.abs(row - physicalRow) > 0.58) continue;
        const obstacles = lane.type === 'road' ? lane.objects : lane.type === 'rail' && lane.train ? [lane.train] : [];
        if (obstacles.some(o => Math.abs(o.x - p.x) < o.width / 2 + 0.22)) { this.fail(lane.type === 'rail' ? 'train' : 'car'); return; }
      }
      if (!p.hop && this.lane(p.row)?.type === 'river' && !this.supported(this.lane(p.row), p.x)) { this.fail('water'); return; }
      if (p.x < -0.48 || p.x > COLS - 0.52) { this.fail('drift'); return; }
      if (landed && p.row > this.score) {
        const old = this.score; this.score = p.row; this.idle = 0;
        this.events.push({ type: 'score', score: this.score });
        if (Math.floor(old / 25) !== Math.floor(this.score / 25)) this.events.push({ type: 'milestone', score: this.score });
        this.ensure(this.score + 36);
        for (const key of this.lanes.keys()) if (key < this.score - 10) this.lanes.delete(key);
      }
      this.camera += (Math.max(0, this.score - 1) - this.camera) * Math.min(1, dt * 8);
      if (this.idle >= 18) this.fail('idle');
    }
    drainEvents() { const events = this.events; this.events = []; return events; }
  }
  return { Game, COLS, HOP, clamp };
});
