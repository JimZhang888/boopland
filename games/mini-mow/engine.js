(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const UPGRADES = ['power', 'haste', 'leaf', 'seed', 'pulse', 'magnet', 'boots', 'heart'];

  class MeadowGame {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.mode = 'ready'; this.time = 0; this.wave = 1; this.kills = 0;
      this.level = 1; this.xp = 0; this.nextXP = 8; this.spawnClock = 0.8;
      this.shotClock = 0; this.pulseClock = 3; this.bossSpawned = false;
      this.enemies = []; this.shots = []; this.drops = []; this.events = [];
      this.choices = []; this.serial = 0;
      this.player = { x: 1200, y: 1000, r: 13, hp: 100, maxHp: 100, speed: 152,
        power: 1, haste: 1, leaves: 1, seeds: 1, pulse: 0, magnet: 76,
        invincible: 0, dash: 0, dashCooldown: 0, dx: 1, dy: 0, walk: 0 };
      this.upgrades = Object.fromEntries(UPGRADES.map(id => [id, 0]));
    }
    start() { this.reset(); this.mode = 'running'; }
    pause() { if (this.mode === 'running') this.mode = 'paused'; }
    resume() { if (this.mode === 'paused') this.mode = 'running'; }
    emit(type, detail = {}) { this.events.push({ type, ...detail }); }
    drainEvents() { return this.events.splice(0); }
    dash() {
      const p = this.player;
      if (this.mode !== 'running' || p.dashCooldown > 0) return false;
      p.dash = .23; p.dashCooldown = 4; p.invincible = Math.max(p.invincible, .35);
      this.emit('dash', { x: p.x, y: p.y }); return true;
    }
    spawn(type) {
      const a = this.random() * TAU, p = this.player;
      const stats = type === 'boss' ? [38, 340, 28, 24, 28] : type === 'brute' ? [20, 45, 31, 15, 4] : type === 'runner' ? [10, 13, 70, 9, 2] : [13, 17, 40, 10, 1];
      const distance = 470 + this.random() * 120;
      const e = { id: ++this.serial, type, x: p.x + Math.cos(a) * distance, y: p.y + Math.sin(a) * distance,
        r: stats[0], hp: stats[1] * (1 + (this.wave - 1) * .16), speed: stats[2] * (1 + (this.wave - 1) * .045), damage: stats[3], xp: stats[4],
        flash: 0, leafCooldown: 0, phase: this.random() * TAU };
      e.maxHp = e.hp; this.enemies.push(e); return e;
    }
    hit(e, damage, dx = 0, dy = 0) {
      if (e.hp <= 0) return;
      e.hp -= damage; e.flash = .1;
      e.x += dx * (e.type === 'boss' ? 1 : 5); e.y += dy * (e.type === 'boss' ? 1 : 5);
      if (e.hp > 0) return;
      this.kills++;
      this.emit('pop', { x: e.x, y: e.y, typeName: e.type });
      this.drop(e.x, e.y, e.xp, 'xp');
      if (e.type === 'boss' || this.random() < .035) this.drop(e.x + 12, e.y, e.type === 'boss' ? 45 : 15, 'heal');
      if (e.type === 'boss') this.emit('bossDown');
    }
    drop(x, y, value, type) {
      // Merge excess experience into existing gems, retaining its value without unbounded allocation.
      if (type === 'xp' && this.drops.length >= 350) {
        const existing = this.drops.find(d => d.type === 'xp');
        if (existing) { existing.value += value; return; }
      }
      if (this.drops.length < 400) this.drops.push({ x, y, value, type, attracted: false });
    }
    gainXP(value) { this.xp += value; if (this.mode === 'running' && this.xp >= this.nextXP) this.levelUp(); }
    levelUp() {
      this.xp -= this.nextXP; this.level++; this.nextXP = 8 + (this.level - 1) * 5;
      this.mode = 'upgrade'; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5);
      const available = UPGRADES.filter(id => this.upgrades[id] < ({ leaf: 5, seed: 4, pulse: 4, haste: 6, boots: 4, magnet: 4 }[id] || 12));
      for (let i = available.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [available[i], available[j]] = [available[j], available[i]]; }
      this.choices = available.slice(0, 3);
      if (!this.choices.length) this.choices = ['heart'];
      this.emit('level', { level: this.level });
    }
    choose(id) {
      if (this.mode !== 'upgrade' || !this.choices.includes(id)) return false;
      const p = this.player; this.upgrades[id]++;
      if (id === 'power') p.power += .25;
      if (id === 'haste') p.haste += .18;
      if (id === 'leaf') p.leaves++;
      if (id === 'seed') p.seeds++;
      if (id === 'pulse') p.pulse++;
      if (id === 'magnet') p.magnet += 38;
      if (id === 'boots') p.speed += 17;
      if (id === 'heart') { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 45); }
      p.invincible = Math.max(p.invincible, .8); this.choices = []; this.mode = 'running';
      if (this.xp >= this.nextXP) this.levelUp();
      return true;
    }
    finish(mode) { this.mode = mode; this.emit(mode); }
    step(dt, input = {}) {
      if (this.mode !== 'running') return;
      dt = clamp(dt, 0, .05); const p = this.player;
      this.time += dt;
      if (this.time >= 180) { this.time = 180; this.finish('won'); return; }
      const wave = Math.min(6, Math.floor(this.time / 30) + 1);
      if (wave !== this.wave) { this.wave = wave; this.emit('wave', { wave }); }
      p.invincible = Math.max(0, p.invincible - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt);
      let x = input.x || 0, y = input.y || 0, length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; length = 1; }
      if (length > .05) { const n = Math.hypot(x, y); p.dx = x / n; p.dy = y / n; }
      if (input.dash) this.dash();
      if (p.dash > 0) { x = p.dx * 3.4; y = p.dy * 3.4; p.dash -= dt; }
      p.x = clamp(p.x + x * p.speed * dt, 55, 2345); p.y = clamp(p.y + y * p.speed * dt, 55, 1945);
      p.walk += Math.hypot(x, y) * dt * 12;
      this.spawnClock -= dt;
      if (this.spawnClock <= 0) {
        this.spawnClock = Math.max(.17, .8 - this.time * .0035);
        if (this.enemies.length < 170) {
          const count = this.wave >= 4 ? 3 : this.wave >= 2 ? 2 : 1;
          for (let i = 0; i < count; i++) {
            const roll = this.random();
            this.spawn(this.wave >= 3 && roll < .2 ? 'brute' : this.wave >= 2 && roll < .45 ? 'runner' : 'slime');
          }
        }
      }
      if (this.time >= 150 && !this.bossSpawned) { this.bossSpawned = true; this.spawn('boss'); this.emit('boss'); }

      const leaves = [];
      for (let i = 0; i < p.leaves; i++) {
        const a = this.time * 2.8 * p.haste + i * TAU / p.leaves;
        leaves.push({ x: p.x + Math.cos(a) * 58, y: p.y + Math.sin(a) * 58 });
      }
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        const speed = e.speed * (e.type === 'boss' && Math.sin(this.time * 1.5) > .85 ? 2.8 : 1);
        e.x += dx / d * speed * dt; e.y += dy / d * speed * dt;
        e.flash = Math.max(0, e.flash - dt); e.leafCooldown = Math.max(0, e.leafCooldown - dt);
        // Bring distant enemies back around the player when exploring the large meadow.
        if (d > 1000) { e.x = p.x - dx / d * 580; e.y = p.y - dy / d * 580; }
        if (e.leafCooldown <= 0 && leaves.some(l => Math.hypot(l.x - e.x, l.y - e.y) < e.r + 13)) {
          this.hit(e, 15 * p.power, -dx / d, -dy / d); e.leafCooldown = .34;
        }
        if (e.hp > 0 && Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r && p.invincible <= 0) {
          p.hp = Math.max(0, p.hp - e.damage); p.invincible = .85;
          this.emit('hurt', { x: p.x, y: p.y });
          if (p.hp <= 0) { this.finish('lost'); return; }
        }
      }
      this.shotClock -= dt;
      if (this.shotClock <= 0) {
        let target, distance = 440;
        for (const e of this.enemies) { const d = Math.hypot(p.x - e.x, p.y - e.y); if (e.hp > 0 && d < distance) { target = e; distance = d; } }
        if (target) {
          this.shotClock = .66 / p.haste;
          const a = Math.atan2(target.y - p.y, target.x - p.x);
          for (let i = 0; i < p.seeds; i++) {
            const angle = a + (i - (p.seeds - 1) / 2) * .15;
            this.shots.push({ x: p.x, y: p.y - 4, vx: Math.cos(angle) * 385, vy: Math.sin(angle) * 385, life: 1.3, damage: 20 * p.power });
          }
          this.emit('shoot');
        }
      }
      this.pulseClock -= dt;
      if (p.pulse && this.pulseClock <= 0) {
        this.pulseClock = 4.5 / p.haste;
        const radius = 100 + p.pulse * 18;
        this.emit('pulse', { x: p.x, y: p.y, radius });
        for (const e of this.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < radius + e.r) this.hit(e, (20 + 14 * p.pulse) * p.power);
      }
      for (const s of this.shots) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        for (const e of this.enemies) {
          if (e.hp > 0 && s.life > 0 && Math.hypot(e.x - s.x, e.y - s.y) < e.r + 5) {
            this.hit(e, s.damage, s.vx / 385, s.vy / 385); s.life = 0; break;
          }
        }
      }
      this.shots = this.shots.filter(s => s.life > 0);
      this.enemies = this.enemies.filter(e => e.hp > 0);
      let collectedXP = 0;
      for (const d of this.drops) {
        const dx = p.x - d.x, dy = p.y - d.y, distance = Math.hypot(dx, dy);
        if (distance < p.magnet) d.attracted = true;
        if (d.attracted) { const move = Math.min(distance, (260 + (p.magnet - Math.min(distance, p.magnet)) * 3) * dt); d.x += dx / (distance || 1) * move; d.y += dy / (distance || 1) * move; }
        if (Math.hypot(p.x - d.x, p.y - d.y) < 17) {
          if (d.type === 'heal') { p.hp = Math.min(p.maxHp, p.hp + d.value); this.emit('heal', { x: p.x, y: p.y }); }
          else collectedXP += d.value;
          d.value = 0;
        }
      }
      this.drops = this.drops.filter(d => d.value > 0);
      if (collectedXP) { this.emit('collect'); this.gainXP(collectedXP); }
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { MeadowGame, UPGRADES };
  else root.MeadowGame = MeadowGame;
})(typeof window !== 'undefined' ? window : globalThis);
