(function (root) {
  'use strict';
  const FPS = 60, LIMIT = 30 * FPS, W = 960, H = 540;
  const INPUT = { LEFT: 1, RIGHT: 2, JUMP: 4, ACT: 8, WAIT: 16 };
  const rect = (x, y, w, h) => ({ x, y, w, h });
  const ground = () => [rect(0, 430, W, 110)];
  const plate = (id, x, y = 430, boxOnly = false) => ({ id, x, y, w: 64, boxOnly });
  const gate = (x, y, h, requires) => ({ ...rect(x, y, 22, h), requires });
  const basin = () => [rect(0, 400, 330, 140), rect(330, 470, 270, 70), rect(600, 340, 360, 200)];
  const bridge = requires => ({ ...rect(338, 234, 242, 18), top: 234, catchY: 410, requires });
  const LEVELS = [
    { spawn: [90, 388], terrain: ground(), plates: [plate('A', 220)], gates: [gate(680, 90, 340, ['A'])], boxes: [], bridges: [], goal: rect(868, 364, 42, 66), ideal: 1 },
    { spawn: [90, 388], terrain: ground(), plates: [plate('A', 220), plate('B', 452)], gates: [gate(730, 90, 340, ['A', 'B'])], boxes: [], bridges: [], goal: rect(868, 364, 42, 66), ideal: 2 },
    { spawn: [90, 388], terrain: ground(), plates: [plate('A', 210), plate('B', 590, 430, true), plate('C', 460)], gates: [gate(320, 90, 340, ['A']), gate(760, 90, 340, ['A', 'B', 'C'])], boxes: [rect(398, 398, 32, 32)], bridges: [], goal: rect(868, 364, 42, 66), ideal: 2 },
    { spawn: [90, 358], terrain: basin(), plates: [plate('A', 427, 470)], gates: [], boxes: [], bridges: [bridge(['A'])], goal: rect(868, 274, 42, 66), ideal: 1 },
    { spawn: [90, 358], terrain: basin(), plates: [plate('A', 362, 470), plate('B', 492, 470)], gates: [], boxes: [], bridges: [bridge(['A', 'B'])], goal: rect(868, 274, 42, 66), ideal: 2 },
    { spawn: [90, 358], terrain: basin(), plates: [plate('A', 200, 400), plate('B', 427, 470), plate('C', 714, 340, true)], gates: [gate(306, 100, 300, ['A']), gate(820, 90, 250, ['C'])], boxes: [rect(140, 368, 32, 32)], bridges: [bridge(['B'])], goal: rect(885, 274, 42, 66), ideal: 2 }
  ];
  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function actor(spawn, id) { return { ...rect(...spawn, 28, 42), id, vx: 0, vy: 0, face: 1, grounded: true, coyote: 6, jumpBuffer: 0, prev: 0, carrying: null, alive: true, holding: false }; }
  class Game {
    constructor(index = 0) { this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index | 0)); this.level = LEVELS[this.levelIndex]; this.memories = []; this.reset(); }
    reset() {
      this.frame = 0; this.track = []; this.phase = 'ready';
      this.actors = [...this.memories.map((_, i) => actor(this.level.spawn, i)), actor(this.level.spawn, this.memories.length)];
      this.player = this.actors[this.actors.length - 1];
      this.boxes = this.level.boxes.map((b, id) => ({ ...b, id, vy: 0, owner: null }));
      this.plates = this.level.plates.map(p => ({ ...p, active: false }));
      this.gates = this.level.gates.map(g => ({ ...g, open: false }));
      this.bridges = this.level.bridges.map(b => ({ ...b, supported: false }));
    }
    rewind() {
      if (this.memories.length >= 2) return 'full';
      if (this.track.length < 12) return 'short';
      if (this.phase === 'won') return 'won';
      this.memories.push(this.track.slice()); this.reset(); return 'saved';
    }
    retry() { this.reset(); }
    undo() { if (!this.memories.length) return false; this.memories.pop(); this.reset(); return true; }
    clear() { this.memories = []; this.reset(); }
    active(ids) { return ids.every(id => this.plates.some(p => p.id === id && p.active)); }
    solids(boxes = false) {
      return [...this.level.terrain, ...this.gates.filter(g => !g.open), ...this.bridges, ...(boxes ? this.boxes.filter(b => b.owner === null) : [])];
    }
    mechanisms() {
      for (const p of this.plates) {
        const on = b => b.x + b.w > p.x + 4 && b.x < p.x + p.w - 4 && Math.abs(b.y + b.h - p.y) < 9;
        p.active = this.boxes.some(b => b.owner === null && on(b)) || (!p.boxOnly && this.actors.some(a => a.alive && a.grounded && on(a)));
      }
      // An already-open gate waits for occupants to clear it; a carried box
      // touching a locked gate must never bypass the switch requirement.
      for (const g of this.gates) g.open = this.active(g.requires) || (g.open && (this.actors.some(a => a.alive && overlap(a, g)) || this.boxes.some(b => overlap(b, g))));
      for (const a of this.actors) a.holding = false;
      for (const b of this.bridges) {
        b.supported = this.active(b.requires);
        if (b.supported) for (const a of this.actors) a.holding ||= a.alive && a.grounded && b.requires.some(id => {
          const p = this.plates.find(p => p.id === id);
          return Math.abs(a.y + a.h - p.y) < 9 && a.x + a.w > p.x && a.x < p.x + p.w;
        });
      }
    }
    interact(a) {
      if (a.carrying !== null) {
        const b = this.boxes[a.carrying];
        const spots = [a.x + a.w + 5, a.x - b.w - 5, a.x + (a.w - b.w) / 2];
        if (a.face < 0) [spots[0], spots[1]] = [spots[1], spots[0]];
        for (const x of spots) {
          const drop = { ...b, x, y: a.y + a.h - b.h };
          if (x < 0 || x + b.w > W || this.solids().some(s => overlap(drop, s)) || this.boxes.some(other => other !== b && other.owner === null && overlap(drop, other))) continue;
          Object.assign(b, drop, { owner: null, vy: 0 }); a.carrying = null; return;
        }
      } else {
        const b = this.boxes.find(b => b.owner === null && Math.abs(b.x + b.w / 2 - a.x - a.w / 2) < 60 && Math.abs(b.y + b.h / 2 - a.y - a.h / 2) < 56);
        if (b) { b.owner = a.id; a.carrying = b.id; }
      }
    }
    move(a, input) {
      if (!a.alive) return;
      if ((input & INPUT.ACT) && !(a.prev & INPUT.ACT)) this.interact(a);
      a.vx = ((input & INPUT.RIGHT ? 1 : 0) - (input & INPUT.LEFT ? 1 : 0)) * 180;
      if (a.vx) a.face = Math.sign(a.vx);
      if ((input & INPUT.JUMP) && !(a.prev & INPUT.JUMP)) a.jumpBuffer = 7;
      if (a.grounded) a.coyote = 6; else a.coyote = Math.max(0, a.coyote - 1);
      if (a.jumpBuffer > 0 && a.coyote > 0) { a.vy = -550; a.grounded = false; a.coyote = 0; a.jumpBuffer = 0; }
      a.jumpBuffer = Math.max(0, a.jumpBuffer - 1);
      a.x += a.vx / FPS;
      for (const s of this.solids()) if (overlap(a, s)) { if (a.vx > 0) a.x = s.x - a.w; else if (a.vx < 0) a.x = s.x + s.w; }
      a.x = Math.max(0, Math.min(W - a.w, a.x));
      const oldBottom = a.y + a.h;
      a.vy = Math.min(a.vy + 1500 / FPS, 800); a.y += a.vy / FPS; a.grounded = false;
      for (const s of this.solids(true)) if (overlap(a, s)) {
        // Boxes are one-way stepping stones; they never trap someone who picks one up.
        if (a.vy >= 0 && oldBottom <= s.y + 3) { a.y = s.y - a.h; a.vy = 0; a.grounded = true; }
        else if (a.vy < 0 && !this.boxes.includes(s)) { a.y = s.y + s.h; a.vy = 0; }
      }
      a.prev = input;
      if (a.carrying !== null) {
        const b = this.boxes[a.carrying]; b.x = a.x + (a.w - b.w) / 2; b.y = a.y - b.h - 3;
      }
      if (a.y > H + 80) { a.alive = false; if (a.carrying !== null) { this.boxes[a.carrying].owner = null; a.carrying = null; } }
    }
    step(input = 0) {
      if (!['ready', 'running'].includes(this.phase)) return;
      input = input & 31;
      if (this.phase === 'ready') { if (!input) return; this.phase = 'running'; }
      this.mechanisms();
      for (const b of this.bridges) {
        const oldY = b.y, target = b.supported ? b.catchY : b.top;
        b.y += Math.sign(target - b.y) * Math.min(Math.abs(target - b.y), 110 / FPS);
        for (const a of this.actors) if (a.alive && a.grounded && Math.abs(a.y + a.h - oldY) < 3 && a.x + a.w > b.x && a.x < b.x + b.w) a.y += b.y - oldY;
      }
      for (let i = 0; i < this.actors.length; i++) this.move(this.actors[i], i < this.memories.length ? this.memories[i][this.frame] || 0 : input);
      for (const b of this.boxes) if (b.owner === null) {
        const oldBottom = b.y + b.h; b.vy = Math.min(b.vy + 1500 / FPS, 800); b.y += b.vy / FPS;
        for (const s of this.solids()) if (overlap(b, s) && oldBottom <= s.y + 3) { b.y = s.y - b.h; b.vy = 0; }
      }
      this.track.push(input); this.frame++;
      this.mechanisms();
      if (!this.player.alive) this.phase = 'fell';
      else if (overlap(this.player, this.level.goal)) this.phase = 'won';
      else if (this.frame >= LIMIT) this.phase = 'timeout';
    }
  }
  const api = { Game, LEVELS, INPUT, FPS, LIMIT, W, H, overlap };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.YesterdayEngine = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
