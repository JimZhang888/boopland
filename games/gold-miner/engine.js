(function (root) {
  'use strict';

  const WIDTH = 900, HEIGHT = 680;
  const PIVOT = Object.freeze({ x: 450, y: 126 });
  const REST = 38, LIMIT = 1.24;
  const ORES = Object.freeze({
    small: { radius: 19, value: 100, speed: 215 },
    medium: { radius: 29, value: 250, speed: 145 },
    large: { radius: 43, value: 500, speed: 84 },
    diamond: { radius: 16, value: 600, speed: 245 },
    rock: { radius: 32, value: 20, speed: 58 },
    bag: { radius: 23, value: 0, speed: 175 }
  });
  const LEVELS = Object.freeze([
    { target: 650, seconds: 60, rocks: 3, diamonds: 1 },
    { target: 1050, seconds: 60, rocks: 4, diamonds: 1 },
    { target: 1450, seconds: 65, rocks: 5, diamonds: 2 },
    { target: 1800, seconds: 65, rocks: 5, diamonds: 2 },
    { target: 2200, seconds: 70, rocks: 6, diamonds: 3 },
    { target: 2650, seconds: 75, rocks: 6, diamonds: 3 }
  ]);
  function random(seed) {
    let value = seed >>> 0;
    return () => { value += 0x6D2B79F5; let n = value; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  function makeItems(level, seed) {
    const rng = random(seed + level * 7919), config = LEVELS[level];
    const kinds = ['medium', 'small', 'large', 'medium', 'large', 'small', 'medium', 'large', 'small', 'bag', ...Array(config.diamonds).fill('diamond'), ...Array(config.rocks).fill('rock')];
    const items = [];
    for (const [id, kind] of kinds.entries()) {
      const spec = ORES[kind];
      let position;
      for (let attempt = 0; attempt < 1000; attempt++) {
        const x = 52 + spec.radius + rng() * (WIDTH - 104 - spec.radius * 2);
        const y = 224 + spec.radius + rng() * (HEIGHT - 250 - spec.radius * 2);
        const angle = Math.atan2(x - PIVOT.x, y - PIVOT.y);
        if (Math.abs(angle) > LIMIT - .06) continue;
        if (items.every(item => Math.hypot(item.x - x, item.y - y) > item.radius + spec.radius + 17)) { position = { x, y }; break; }
      }
      // The roomy field normally places every object; the deterministic grid
      // is a fallback that also guarantees non-overlapping, reachable objects.
      if (!position) {
        for (let y = 235 + spec.radius; y < HEIGHT - spec.radius - 18 && !position; y += 12) {
          for (let x = 40 + spec.radius; x < WIDTH - spec.radius - 40; x += 12) {
            if (Math.abs(Math.atan2(x - PIVOT.x, y - PIVOT.y)) <= LIMIT - .06 && items.every(item => Math.hypot(item.x - x, item.y - y) > item.radius + spec.radius + 10)) { position = { x, y }; break; }
          }
        }
      }
      if (position) items.push({ id, kind, ...spec, ...position, value: kind === 'bag' ? [100, 200, 350][Math.floor(rng() * 3)] : spec.value, rotation: (rng() - .5) * .6, taken: false });
    }
    return items;
  }
  // First contact along the moving hook segment prevents tunnelling, and
  // chooses the closest object instead of depending on the array order.
  function contact(ax, ay, bx, by, item) {
    const dx = bx - ax, dy = by - ay, fx = ax - item.x, fy = ay - item.y;
    const radius = item.radius + 8, a = dx * dx + dy * dy, c = fx * fx + fy * fy - radius * radius;
    if (c <= 0) return 0;
    if (!a) return null;
    const b = 2 * (fx * dx + fy * dy), disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const fraction = (-b - Math.sqrt(disc)) / (2 * a);
    return fraction >= 0 && fraction <= 1 ? fraction : null;
  }
  class Game {
    constructor(seed = Date.now()) { this.reset(seed); }
    reset(seed = Date.now()) {
      this.seed = seed >>> 0; this.level = 0; this.wallet = 0; this.total = 0;
      this.bombs = 2; this.power = 0; this.extraTime = false;
      this.prepare(); this.phase = 'ready';
    }
    prepare() {
      this.items = makeItems(this.level, this.seed);
      this.score = 0; this.remaining = LEVELS[this.level].seconds + (this.extraTime ? 10 : 0);
      this.extraTime = false; this.paused = false; this.phase = 'playing';
      this.hook = { mode: 'swing', angle: -.5, direction: 1, length: REST, cargo: null };
      this.events = []; this.reason = '';
      this.checkpoint = { wallet: this.wallet, total: this.total, bombs: this.bombs, power: this.power, seconds: this.remaining };
    }
    get target() { return LEVELS[this.level].target; }
    get tip() { return { x: PIVOT.x + Math.sin(this.hook.angle) * this.hook.length, y: PIVOT.y + Math.cos(this.hook.angle) * this.hook.length }; }
    get canBomb() { return this.phase === 'playing' && !this.paused && this.hook.mode === 'retract' && !!this.hook.cargo && this.bombs > 0; }
    start() { if (this.phase !== 'ready') return false; this.phase = 'playing'; return true; }
    fire() {
      if (this.phase !== 'playing' || this.paused || this.hook.mode !== 'swing') return false;
      this.hook.mode = 'extend'; this.events.push({ type: 'fire' }); return true;
    }
    bomb() {
      if (!this.canBomb) return false;
      this.bombs--; this.events.push({ type: 'blast', ...this.tip }); this.hook.cargo = null;
      // Blasting an indispensable last treasure must still end the round.
      this.checkExhausted(); return true;
    }
    price(kind) { return kind === 'bomb' ? 80 : kind === 'power' ? 220 + this.power * 180 : kind === 'time' ? 140 : Infinity; }
    canBuy(kind) {
      return this.phase === 'shop' && ['bomb', 'power', 'time'].includes(kind) && this.wallet >= this.price(kind) && (kind !== 'power' || this.power < 3) && (kind !== 'time' || !this.extraTime) && (kind !== 'bomb' || this.bombs < 9);
    }
    buy(kind) {
      if (!this.canBuy(kind)) return false;
      this.wallet -= this.price(kind);
      if (kind === 'bomb') this.bombs++;
      if (kind === 'power') this.power++;
      if (kind === 'time') this.extraTime = true;
      return true;
    }
    next() { if (this.phase !== 'shop' || this.level >= LEVELS.length - 1) return false; this.level++; this.prepare(); return true; }
    retry() {
      if (this.phase !== 'lost') return false;
      const checkpoint = { ...this.checkpoint };
      Object.assign(this, { wallet: checkpoint.wallet, total: checkpoint.total, bombs: checkpoint.bombs, power: checkpoint.power });
      this.prepare(); this.remaining = checkpoint.seconds; this.checkpoint = checkpoint; return true;
    }
    finish(success, reason = 'time') {
      if (this.phase !== 'playing') return;
      this.phase = success ? (this.level === LEVELS.length - 1 ? 'won' : 'shop') : 'lost';
      this.reason = reason; this.events.push({ type: success ? 'win' : 'lose' });
    }
    checkExhausted() {
      if (this.phase === 'playing' && !this.hook.cargo && this.items.every(item => item.taken)) this.finish(this.score >= this.target, 'empty');
    }
    update(seconds) {
      if (this.phase !== 'playing' || this.paused || !Number.isFinite(seconds) || seconds <= 0) return;
      // Ignore suspended-tab time and process movement in small exact steps.
      let left = Math.min(seconds, .1);
      while (left > 1e-8 && this.phase === 'playing') { const step = Math.min(left, 1 / 120, this.remaining); this.step(step); left -= step; }
    }
    step(dt) {
      const hook = this.hook;
      if (hook.mode === 'swing') {
        hook.angle += hook.direction * (.82 + this.level * .035) * dt;
        if (hook.angle > LIMIT) { hook.angle = 2 * LIMIT - hook.angle; hook.direction = -1; }
        if (hook.angle < -LIMIT) { hook.angle = -2 * LIMIT - hook.angle; hook.direction = 1; }
      } else if (hook.mode === 'extend') {
        const before = this.tip;
        hook.length += 500 * dt;
        const after = this.tip;
        let first = null, distance = Infinity;
        for (const item of this.items) {
          if (item.taken) continue;
          const hit = contact(before.x, before.y, after.x, after.y, item);
          if (hit !== null && hit < distance) { first = item; distance = hit; }
        }
        if (first) {
          hook.length -= 500 * dt * (1 - distance); first.taken = true;
          hook.cargo = first; hook.mode = 'retract'; this.events.push({ type: 'grab', kind: first.kind });
        } else if (after.x < 14 || after.x > WIDTH - 14 || after.y > HEIGHT - 14) hook.mode = 'retract';
      } else {
        hook.length = Math.max(REST, hook.length - (hook.cargo ? hook.cargo.speed * (1 + this.power * .3) : 540) * dt);
        if (hook.length <= REST) {
          if (hook.cargo) {
            const value = hook.cargo.value;
            this.score += value; this.total += value; this.wallet += value;
            this.events.push({ type: 'collect', value, kind: hook.cargo.kind });
          }
          hook.cargo = null; hook.mode = 'swing';
          if (this.score >= this.target) this.finish(true);
          else this.checkExhausted();
        }
      }
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining <= 1e-8) { this.remaining = 0; this.finish(this.score >= this.target); }
    }
    drainEvents() { return this.events.splice(0); }
  }
  const api = { Game, WIDTH, HEIGHT, PIVOT, REST, LIMIT, ORES, LEVELS, makeItems, contact };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GoldMiner = api;
})(typeof window !== 'undefined' ? window : globalThis);
