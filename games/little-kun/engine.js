/* Deterministic rules; classic script for file:// and CommonJS for tests. */
(() => {
  'use strict';
  const STAGES = Object.freeze([
    { key: 'stage0', xp: 0, radius: 18, color: '#c7b570' },
    { key: 'stage1', xp: 16, radius: 27, color: '#8cae92' },
    { key: 'stage2', xp: 48, radius: 39, color: '#89adb2' },
    { key: 'stage3', xp: 102, radius: 56, color: '#8a9caf' },
    { key: 'stage4', xp: 190, radius: 78, color: '#7b9d9c' },
    { key: 'stage5', xp: 320, radius: 110, color: '#6d9498' }
  ]);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  class LittleKun {
    constructor(random = Math.random) { this.random = random; this.view = { w: 1100, h: 700 }; this.reset(); }
    reset() {
      this.status = 'ready'; this.time = 0; this.stage = 0; this.xp = 0; this.score = 0; this.eaten = 0;
      this.health = 4; this.energy = 100; this.invulnerable = 0; this.dash = 0; this.cooldown = 0;
      this.combo = 0; this.comboTime = 0; this.pearlTime = 15; this.surge = 0; this.won = false;
      this.player = { x: 2400, y: 1800, vx: 0, vy: 0, radius: 18, angle: 0 };
      this.fish = []; this.pearls = []; this.events = []; this.nextId = 0;
      this.populate(true);
    }
    start() { this.reset(); this.status = 'playing'; }
    pause() { if (this.status === 'playing') this.status = 'paused'; }
    resume() { if (this.status === 'paused' || this.status === 'won') this.status = 'playing'; }
    setView(w, h) { this.view = { w: Math.max(320, w), h: Math.max(320, h) }; }
    relation(fish) {
      if (this.won || fish.radius <= this.player.radius * .91) return 'food';
      return fish.radius >= this.player.radius * 1.12 ? 'danger' : 'peer';
    }
    progress() {
      if (this.won) return 1;
      return (this.xp - STAGES[this.stage].xp) / (STAGES[this.stage + 1].xp - STAGES[this.stage].xp);
    }
    spawn(initial = false, forcedFood = false) {
      const p = this.player, rand = this.random;
      const food = forcedFood || rand() < .78 || this.won;
      // Keep existing fish sizes on evolution, so yesterday's threat becomes food.
      const radius = food ? p.radius * (.34 + rand() * .48) : p.radius * (1.24 + rand() * .36);
      let x, y;
      if (initial) {
        const angle = rand() * Math.PI * 2, distance = (food ? 110 : 350) + rand() * Math.min(this.view.w, this.view.h) * .48;
        x = p.x + Math.cos(angle) * distance; y = p.y + Math.sin(angle) * distance;
      } else {
        // New creatures arrive at the edge of the camera, never on the player.
        const side = Math.floor(rand() * 4), wx = this.view.w * .55, hy = this.view.h * .55;
        x = p.x + (side < 2 ? (side ? wx : -wx) : (rand() * 2 - 1) * wx);
        y = p.y + (side >= 2 ? (side === 2 ? -hy : hy) : (rand() * 2 - 1) * hy);
      }
      const angle = Math.atan2(p.y - y, p.x - x) + (rand() - .5) * 2;
      return { id: this.nextId++, x, y, radius, angle, phase: rand() * 6.28, speed: 38 + rand() * 30 + this.stage * 5,
        chase: 0, rest: rand() * 2, variant: Math.floor(rand() * 3), color: Math.floor(rand() * 4) };
    }
    populate(initial = false) {
      const target = clamp(Math.round(this.view.w * this.view.h / 27000), 27, 44);
      while (this.fish.length < target) this.fish.push(this.spawn(initial, this.fish.length < 9));
    }
    ability() {
      if (this.status !== 'playing' || this.cooldown > 0 || this.energy < (this.won ? 50 : 30)) return false;
      this.energy -= this.won ? 50 : 30;
      this.cooldown = this.won ? 1.5 : .7;
      if (this.won) { this.surge = 1; this.events.push({ type: 'surge', x: this.player.x, y: this.player.y }); }
      else { this.dash = .3; this.events.push({ type: 'dash' }); }
      return true;
    }
    eat(fish) {
      const value = Math.max(1, Math.round(fish.radius / 5));
      this.combo = this.comboTime > 0 ? this.combo + 1 : 1; this.comboTime = 3.8;
      const multiplier = Math.min(3, 1 + Math.floor((this.combo - 1) / 4) * .5);
      const points = Math.round(value * 10 * multiplier);
      this.xp += value; this.score += points; this.eaten++;
      this.events.push({ type: 'eat', x: fish.x, y: fish.y, points });
      while (this.stage < 5 && this.xp >= STAGES[this.stage + 1].xp) {
        this.stage++; this.health = Math.min(4, this.health + 1); this.energy = 100; this.invulnerable = 2.5;
        this.events.push({ type: 'evolve', stage: this.stage, x: this.player.x, y: this.player.y });
        if (this.stage === 5) { this.won = true; this.status = 'won'; this.events.push({ type: 'won' }); }
      }
    }
    tick(dt, input = {}) {
      if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
      // Bound tab stalls and subdivide movement to prevent tunnelling on a dash.
      let remaining = Math.min(dt, .05);
      while (remaining > .000001 && this.status === 'playing') {
        const step = Math.min(remaining, 1 / 120); this.update(step, input); remaining -= step;
      }
    }
    update(dt, input) {
      const p = this.player;
      this.time += dt; this.dash = Math.max(0, this.dash - dt); this.cooldown = Math.max(0, this.cooldown - dt);
      this.invulnerable = Math.max(0, this.invulnerable - dt); this.surge = Math.max(0, this.surge - dt);
      this.comboTime = Math.max(0, this.comboTime - dt); this.energy = Math.min(100, this.energy + dt * 24);
      if (!this.comboTime) this.combo = 0;
      const desiredRadius = STAGES[this.stage].radius * (1 + (this.won ? 0 : this.progress() * .16));
      p.radius += (desiredRadius - p.radius) * (1 - Math.exp(-dt * 3));
      let ix = Number.isFinite(input.x) ? input.x : 0, iy = Number.isFinite(input.y) ? input.y : 0;
      const length = Math.hypot(ix, iy); if (length > 1) { ix /= length; iy /= length; }
      const moving = Math.hypot(ix, iy) > .02;
      if (this.dash > 0 && !moving) { ix = Math.cos(p.angle); iy = Math.sin(p.angle); }
      const speed = (210 + this.stage * 8) * (this.dash > 0 ? 2.6 : 1);
      const ease = 1 - Math.exp(-dt * (moving || this.dash ? 12 : 18));
      p.vx += (ix * speed - p.vx) * ease; p.vy += (iy * speed - p.vy) * ease;
      if (Math.hypot(p.vx, p.vy) > 5) {
        const target = Math.atan2(p.vy, p.vx), delta = Math.atan2(Math.sin(target - p.angle), Math.cos(target - p.angle));
        p.angle += delta * (1 - Math.exp(-dt * 13));
      }
      // An endless ocean avoids trapping the player against an unseen edge.
      p.x += p.vx * dt; p.y += p.vy * dt;
      for (let i = this.fish.length - 1; i >= 0; i--) {
        const f = this.fish[i], dx = p.x - f.x, dy = p.y - f.y, dist = Math.hypot(dx, dy), relation = this.relation(f);
        f.rest -= dt; f.chase = Math.max(0, f.chase - dt);
        if (relation === 'danger' && this.time > 7 && dist < 270 + p.radius && f.rest <= 0) { f.chase = 1.1; f.rest = 4.2; }
        let target = f.angle + Math.sin(this.time * .7 + f.phase) * dt * .75, speed = f.speed;
        if (f.chase > 0 && relation === 'danger') { target = Math.atan2(dy, dx); speed = 148 + this.stage * 8; }
        else if (relation === 'food' && dist < p.radius * 2 + 55) { target = Math.atan2(-dy, -dx); speed *= 1.25; }
        if (this.surge > 0 && dist < 410) { f.x += dx * dt * 4.8; f.y += dy * dt * 4.8; }
        const turn = Math.atan2(Math.sin(target - f.angle), Math.cos(target - f.angle));
        f.angle += turn * Math.min(1, dt * 2.4); f.x += Math.cos(f.angle) * speed * dt; f.y += Math.sin(f.angle) * speed * dt;
        // Slightly generous food collision, forgiving predator body collision.
        const touch = Math.hypot(p.x - f.x, p.y - f.y);
        if (relation === 'food' && touch < p.radius + f.radius * .55) { this.fish.splice(i, 1); this.eat(f); if (this.status === 'won') break; continue; }
        if (relation === 'danger' && !this.won && this.invulnerable <= 0 && this.dash <= 0 && touch < p.radius * .58 + f.radius * .68) {
          this.health--; this.invulnerable = 2.4; this.combo = 0; this.comboTime = 0;
          const away = Math.atan2(dy, dx); p.vx = Math.cos(away) * 360; p.vy = Math.sin(away) * 360;
          f.angle = away + Math.PI; f.chase = 0; f.rest = 4;
          this.events.push({ type: 'hit', x: p.x, y: p.y });
          if (this.health <= 0) { this.status = 'over'; this.events.push({ type: 'over' }); break; }
        }
        if (Math.abs(f.x - p.x) > this.view.w * .85 + 200 || Math.abs(f.y - p.y) > this.view.h * .85 + 200) this.fish.splice(i, 1);
      }
      this.pearlTime -= dt;
      if (this.pearlTime <= 0 && !this.won) {
        const angle = this.random() * Math.PI * 2;
        this.pearls.push({ x: p.x + Math.cos(angle) * 200, y: p.y + Math.sin(angle) * 200, life: 22 });
        this.pearlTime = this.health < 3 ? 12 : 22;
      }
      for (let i = this.pearls.length - 1; i >= 0; i--) {
        const pearl = this.pearls[i]; pearl.life -= dt;
        if (Math.hypot(pearl.x - p.x, pearl.y - p.y) < p.radius + 15) {
          this.health = Math.min(4, this.health + 1); this.energy = Math.min(100, this.energy + 35);
          this.events.push({ type: 'pearl', x: pearl.x, y: pearl.y }); this.pearls.splice(i, 1);
        } else if (pearl.life <= 0) this.pearls.splice(i, 1);
      }
      this.populate();
    }
    drainEvents() { return this.events.splice(0); }
  }
  LittleKun.STAGES = STAGES;
  if (typeof module !== 'undefined' && module.exports) module.exports = LittleKun;
  else window.LittleKun = LittleKun;
})();
