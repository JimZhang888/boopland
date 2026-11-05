/* The game model uses logical coordinates; rendering and browser input stay in game.js. */
(() => {
  'use strict';
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const overlaps = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
  class Flight {
    constructor(width = 480, height = 600, random = Math.random) {
      this.width = width; this.height = height; this.random = random;
      this.reset(); this.mode = 'ready';
    }
    reset() {
      this.mode = 'playing'; this.score = 0; this.kills = 0; this.time = 0; this.wave = 1; this.erasers = 2;
      this.player = { x: this.width / 2, y: this.height - 75, r: 11, lives: 3, invincible: 1.8, power: 0, shield: 0 };
      this.enemies = []; this.bullets = []; this.hostile = []; this.pickups = []; this.events = [];
      this.spawnClock = .7; this.fireClock = .12; this.spawnCount = 0;
    }
    resize(width, height) {
      const sx = width / this.width, sy = height / this.height;
      for (const item of [this.player, ...this.enemies, ...this.bullets, ...this.hostile, ...this.pickups]) {
        item.x *= sx; item.y *= sy;
        if (item.baseX !== undefined) item.baseX *= sx;
      }
      this.width = width; this.height = height;
      this.player.x = clamp(this.player.x, 24, width - 24); this.player.y = clamp(this.player.y, 32, height - 28);
    }
    moveTo(x, y, dt) {
      const p = this.player, dx = x - p.x, dy = y - p.y, distance = Math.hypot(dx, dy);
      const step = Math.min(distance, 580 * dt);
      if (distance) { p.x += dx / distance * step; p.y += dy / distance * step; }
    }
    spawn() {
      this.spawnCount++;
      const type = this.wave >= 3 && this.spawnCount % 8 === 0 ? 'heavy' : this.wave >= 2 && this.spawnCount % 3 === 0 ? 'wing' : 'dart';
      const data = type === 'heavy' ? [31, 10, 90, 37] : type === 'wing' ? [23, 3, 30, 58] : [17, 1, 10, 83];
      const x = 40 + this.random() * (this.width - 80);
      this.enemies.push({ x, baseX: x, y: -45, r: data[0], hp: data[1], maxHp: data[1], value: data[2], speed: data[3] + Math.min(this.wave, 14) * 6, type, age: 0, phase: this.random() * Math.PI * 2, shot: 1.1 + this.random() * .9 });
    }
    destroy(enemy, drops = true) {
      if (enemy.dead) return;
      enemy.dead = true; this.score += enemy.value; this.kills++;
      this.events.push({ type: 'destroy', x: enemy.x, y: enemy.y, heavy: enemy.type === 'heavy', value: enemy.value });
      if (drops && this.kills % 6 === 0) {
        const types = ['power', 'shield', 'heart'];
        this.pickups.push({ x: enemy.x, y: enemy.y, r: 17, type: types[(this.kills / 6 - 1) % 3], age: 0 });
      }
    }
    hit() {
      const p = this.player;
      if (p.invincible > 0 || this.mode !== 'playing') return;
      if (p.shield > 0) { p.shield = 0; p.invincible = 1; this.events.push({ type: 'shield', x: p.x, y: p.y }); return; }
      p.lives--; p.invincible = 2; this.events.push({ type: 'hit', x: p.x, y: p.y });
      if (p.lives <= 0) { this.mode = 'over'; this.events.push({ type: 'over' }); }
    }
    erase() {
      if (this.mode !== 'playing' || this.erasers <= 0) return false;
      this.erasers--; this.hostile = [];
      for (const enemy of this.enemies) if (enemy.y > -enemy.r) this.destroy(enemy, false);
      this.enemies = this.enemies.filter(enemy => !enemy.dead);
      this.player.invincible = Math.max(this.player.invincible, 1.2);
      this.events.push({ type: 'erase' }); return true;
    }
    update(dt, input = {}) {
      if (this.mode !== 'playing') return;
      // Bound simulation steps so fast projectiles cannot skip small hitboxes.
      let remaining = Math.min(Math.max(dt, 0), .1);
      while (remaining > 0 && this.mode === 'playing') {
        const step = Math.min(remaining, 1 / 120); this.step(step, input); remaining -= step;
      }
    }
    step(dt, input) {
      this.time += dt;
      const wave = 1 + Math.floor(this.time / 18);
      if (wave !== this.wave) { this.wave = wave; this.events.push({ type: 'wave', wave }); }
      const p = this.player;
      p.invincible = Math.max(0, p.invincible - dt); p.power = Math.max(0, p.power - dt); p.shield = Math.max(0, p.shield - dt);
      if (input.target) this.moveTo(input.target.x, input.target.y, dt);
      else { const length = Math.hypot(input.x || 0, input.y || 0) || 1; p.x += (input.x || 0) / length * 320 * dt; p.y += (input.y || 0) / length * 320 * dt; }
      p.x = clamp(p.x, 24, this.width - 24); p.y = clamp(p.y, 32, this.height - 28);
      this.fireClock -= dt;
      if (this.fireClock <= 0) {
        this.fireClock += p.power > 0 ? .14 : .19;
        const offsets = p.power > 0 ? [-.16, 0, .16] : [0];
        for (const angle of offsets) this.bullets.push({ x: p.x, y: p.y - 25, vx: Math.sin(angle) * 470, vy: -Math.cos(angle) * 470, r: 4 });
        this.events.push({ type: 'shot' });
      }
      this.spawnClock -= dt;
      if (this.spawnClock <= 0) { this.spawn(); this.spawnClock += Math.max(.3, 1.02 - this.wave * .055) * (.8 + this.random() * .4); }
      for (const bullet of [...this.bullets, ...this.hostile]) { bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; }
      for (const enemy of this.enemies) {
        enemy.age += dt; enemy.y += enemy.speed * dt;
        enemy.x = clamp(enemy.baseX + Math.sin(enemy.age * 1.7 + enemy.phase) * (enemy.type === 'dart' ? 21 : 45), enemy.r, this.width - enemy.r);
        if (enemy.type !== 'dart' && enemy.y > 20 && enemy.y < this.height * .7) {
          enemy.shot -= dt;
          if (enemy.shot <= 0) {
            enemy.shot += enemy.type === 'heavy' ? 1.5 : 2.2;
            const aim = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            for (const offset of enemy.type === 'heavy' ? [-.28, 0, .28] : [0]) {
              const speed = 135 + Math.min(this.wave, 15) * 5;
              this.hostile.push({ x: enemy.x, y: enemy.y + 18, vx: Math.cos(aim + offset) * speed, vy: Math.sin(aim + offset) * speed, r: 5 });
            }
          }
        }
        for (const bullet of this.bullets) {
          if (!bullet.dead && !enemy.dead && overlaps(bullet, enemy)) {
            bullet.dead = true; enemy.hp--; enemy.flash = .08;
            if (enemy.hp <= 0) this.destroy(enemy);
          }
        }
        enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
        if (!enemy.dead && overlaps(p, enemy)) { enemy.dead = true; this.hit(); }
      }
      for (const bullet of this.hostile) if (!bullet.dead && overlaps(p, bullet)) { bullet.dead = true; this.hit(); }
      for (const item of this.pickups) {
        item.age += dt; item.y += 68 * dt;
        if (this.mode === 'playing' && overlaps({ ...p, r: 22 }, item)) {
          item.dead = true;
          if (item.type === 'power') p.power = 10;
          if (item.type === 'shield') p.shield = 12;
          if (item.type === 'heart') { if (p.lives < 3) p.lives++; else this.score += 30; }
          this.events.push({ type: 'collect', item: item.type, x: item.x, y: item.y });
        }
      }
      const visible = item => !item.dead && item.y > -90 && item.y < this.height + 70 && item.x > -70 && item.x < this.width + 70;
      this.enemies = this.enemies.filter(visible); this.bullets = this.bullets.filter(visible);
      this.hostile = this.hostile.filter(visible); this.pickups = this.pickups.filter(visible);
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { Flight };
  else window.PaperFlightCore = Object.freeze({ Flight });
})();
