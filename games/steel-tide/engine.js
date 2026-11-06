/* Steel Tide — standalone, deterministic simulation. No DOM or network required. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SteelTide = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TILE = 24, CELL = 48, SIZE = 624, HALF = 17;
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const MAPS = [
    ['.............', '.B.B.B.B.B.B.', '.B.B.B.B.B.B.', '.B.B.S.S.B.B.', '.B.B.....B.B.', '.....B.B.....', '.BB..B.B..BB.', '...WW...WW...', '.B.B.....B.B.', '.B.B.S.S.B.B.', '.B.........B.', '.....BBB.....', '.....BHB.....'],
    ['.............', '.SS.B...B.SS.', '....B.B.B....', '.BB...B...BB.', '....W...W....', '.B..W.B.W..B.', '.B....B....B.', '...BB...BB...', '.SS...S...SS.', '....B...B....', '.B..B...B..B.', '.....BBB.....', '.....BHB.....'],
    ['.............', '.B.F.B.B.F.B.', '.B.F.....F.B.', '...F.S.S.F...', '.WW..B.B..WW.', '.....B.B.....', '.B.B.FFF.B.B.', '.B...FFF...B.', '...S.....S...', '.B...B.B...B.', '.B.........B.', '.....BBB.....', '.....BHB.....'],
    ['.............', '.B.B.W.W.B.B.', '.B...W.W...B.', '...S.....S...', '.B.B.B.B.B.B.', '.....B.B.....', '.S.W.....W.S.', '...W.B.B.W...', '.B...B.B...B.', '...S.....S...', '.B.........B.', '.....BBB.....', '.....BHB.....'],
    ['.............', '.S.B.B.B.B.S.', '...B.....B...', '.B...S.S...B.', '.B.W.....W.B.', '...W.B.B.W...', '.S...B.B...S.', '...B.FFF.B...', '.B...FFF...B.', '.B.S.....S.B.', '.............', '.....BBB.....', '.....BHB.....']
  ];
  const TYPES = [
    { speed: 62, hp: 1, points: 100 },
    { speed: 100, hp: 1, points: 200 },
    { speed: 54, hp: 3, points: 300 }
  ];
  const POWERS = ['star', 'shield', 'freeze', 'fortify', 'bomb', 'life'];
  const overlap = (a, b, half = HALF * 2) => Math.abs(a.x - b.x) < half && Math.abs(a.y - b.y) < half;

  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.status = 'ready'; this.stage = 1; this.score = 0; this.lives = 3;
      this.level = 0; this.kills = 0; this.totalKills = 0; this.time = 0;
      this.events = []; this.nextId = 0; this.loadStage(); this.status = 'ready';
    }
    loadStage() {
      this.grid = Array.from({ length: 26 }, () => Array(26).fill(0));
      this.forest = []; this.base = { x: 312, y: 600, alive: true };
      const map = MAPS[(this.stage - 1) % MAPS.length];
      map.forEach((row, y) => [...row].forEach((tile, x) => {
        const value = { B: 1, S: 2, W: 3 }[tile] || 0;
        for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) this.grid[y * 2 + sy][x * 2 + sx] = value;
        if (tile === 'F') this.forest.push({ x: x * CELL, y: y * CELL });
      }));
      this.enemies = []; this.bullets = []; this.particles = []; this.pickups = [];
      this.spawned = 0; this.kills = 0; this.target = 20; this.spawnTimer = 1.6;
      this.freeze = 0; this.fortify = 0; this.respawnTimer = 0; this.clearTimer = 0;
      this.player = this.makeTank(216, 600, 0, true); this.player.shield = 3;
      this.status = 'playing';
    }
    start() { this.reset(); this.status = 'playing'; this.emit('start'); }
    nextStage() { if (this.status !== 'clear') return; this.stage++; this.loadStage(); this.emit('start'); }
    pause() { if (this.status === 'playing') this.status = 'paused'; }
    resume() { if (this.status === 'paused') this.status = 'playing'; }
    emit(type, extra = {}) { this.events.push({ type, ...extra }); }
    drainEvents() { const events = this.events; this.events = []; return events; }
    makeTank(x, y, dir, player, kind = 0) {
      return { id: this.nextId++, x, y, dir, player, kind, hp: player ? 1 : TYPES[kind].hp,
        shield: 0, cooldown: 0, think: .3, moving: false, tread: 0, flash: 0, born: player ? 0 : .7, carrier: false };
    }
    blocked(x, y, tank) {
      if (x - HALF < 0 || y - HALF < 0 || x + HALF > SIZE || y + HALF > SIZE) return true;
      for (let gy = Math.floor((y - HALF + .01) / TILE); gy <= Math.floor((y + HALF - .01) / TILE); gy++) {
        for (let gx = Math.floor((x - HALF + .01) / TILE); gx <= Math.floor((x + HALF - .01) / TILE); gx++) {
          if (this.grid[gy]?.[gx]) return true;
        }
      }
      if (this.base.alive && overlap({ x, y }, this.base, 35)) return true;
      for (const other of [...this.enemies, this.player]) {
        if (other && other !== tank && overlap({ x, y }, other)) return true;
      }
      return false;
    }
    move(tank, dir, distance) {
      const previous = tank.dir; tank.dir = dir;
      const [dx, dy] = DIRS[dir];
      // A small lane assist makes ninety-degree turns forgiving, without crossing walls.
      const axis = dx ? 'y' : 'x';
      const center = Math.round((tank[axis] - CELL / 2) / CELL) * CELL + CELL / 2;
      if (previous % 2 !== dir % 2 && Math.abs(tank[axis] - center) <= 8) {
        const point = { x: tank.x, y: tank.y, [axis]: center };
        if (!this.blocked(point.x, point.y, tank)) tank[axis] = center;
      }
      const x = tank.x + dx * distance, y = tank.y + dy * distance;
      if (this.blocked(x, y, tank)) { tank.moving = false; return false; }
      tank.x = x; tank.y = y; tank.moving = true; tank.tread += distance; return true;
    }
    fire(tank) {
      if (!tank || tank.born > 0 || tank.cooldown > 0) return false;
      const max = tank.player && this.level >= 2 ? 2 : 1;
      if (this.bullets.filter(b => b.owner === tank.id).length >= max) return false;
      const [dx, dy] = DIRS[tank.dir];
      this.bullets.push({ x: tank.x + dx * 20, y: tank.y + dy * 20, dir: tank.dir,
        player: tank.player, owner: tank.id, speed: tank.player ? (this.level ? 430 : 340) : 225 + Math.min(70, this.stage * 6),
        power: tank.player && this.level >= 3 ? 2 : 1, dead: false });
      tank.cooldown = tank.player ? .23 : 1.2 + this.random() * .8;
      if (tank.player) this.emit('fire');
      return true;
    }
    spawnEnemy() {
      if (this.spawned >= this.target || this.enemies.length >= Math.min(6, 3 + Math.ceil(this.stage / 2))) return false;
      const portals = [24, 312, 600], first = Math.floor(this.random() * 3);
      for (let n = 0; n < 3; n++) {
        const x = portals[(first + n) % 3];
        if (this.blocked(x, 24, null)) continue;
        const index = this.spawned;
        const kind = index % 5 === 4 ? 2 : index % 3 === 2 ? 1 : 0;
        const tank = this.makeTank(x, 24, 2, false, kind);
        tank.carrier = index % 4 === 3; tank.cooldown = 1.2;
        this.enemies.push(tank); this.spawned++; return true;
      }
      return false;
    }
    steer(tank) {
      // Favor the base, with occasional pursuit and alternate routes at junctions.
      const target = this.player && this.random() < .3 ? this.player : this.base;
      const candidates = [0, 1, 2, 3].map(dir => {
        const [dx, dy] = DIRS[dir];
        const open = !this.blocked(tank.x + dx * 7, tank.y + dy * 7, tank);
        const toward = (target.x - tank.x) * dx + (target.y - tank.y) * dy;
        return { dir, score: (open ? 4 : 0) + (toward > 5 ? 1.8 : 0) + this.random() * 3 + (dir === tank.dir ? .5 : 0) };
      }).sort((a, b) => b.score - a.score);
      tank.dir = candidates[0].dir;
      tank.think = .45 + this.random() * .7;
    }
    burst(x, y, color = 'brick', count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = this.random() * Math.PI * 2, speed = 30 + this.random() * 95;
        this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: .3 + this.random() * .4, max: .7, color, size: 2 + this.random() * 4 });
      }
    }
    destroyEnemy(tank, reward = true) {
      if (!this.enemies.includes(tank)) return;
      this.enemies.splice(this.enemies.indexOf(tank), 1); this.kills++; this.totalKills++;
      if (reward) this.score += TYPES[tank.kind].points;
      this.burst(tank.x, tank.y, 'enemy', 18); this.emit('blast');
      if (tank.carrier && reward) this.dropPower(tank.x, tank.y);
    }
    dropPower(x, y) {
      const type = POWERS[Math.floor(this.random() * POWERS.length)];
      this.pickups.push({ x: Math.max(26, Math.min(598, x)), y: Math.max(26, Math.min(598, y)), type, life: 14 });
      this.emit('drop');
    }
    power(type) {
      this.score += 500;
      if (type === 'star') this.level = Math.min(3, this.level + 1);
      if (type === 'shield' && this.player) this.player.shield = 12;
      if (type === 'freeze') this.freeze = 9;
      if (type === 'life') this.lives = Math.min(9, this.lives + 1);
      if (type === 'bomb') {
        for (const tank of [...this.enemies]) this.destroyEnemy(tank, false);
        this.bullets = this.bullets.filter(b => b.player);
      }
      if (type === 'fortify') { this.fortify = 16; this.baseWalls(2); }
      this.emit('power', { power: type });
    }
    baseWalls(value) {
      for (let y = 22; y < 26; y++) for (let x = 10; x < 16; x++) {
        if (y < 24 || x < 12 || x >= 14) this.grid[y][x] = value;
      }
    }
    hitPlayer() {
      if (!this.player || this.player.shield > 0) return;
      this.burst(this.player.x, this.player.y, 'player', 22);
      this.player = null; this.lives--; this.level = 0; this.emit('hit');
      if (this.lives <= 0) this.end('lives');
      else this.respawnTimer = 1.1;
    }
    end(reason) {
      if (this.status !== 'playing') return;
      this.status = 'over'; this.reason = reason; this.emit('over', { reason });
    }
    stepBullet(b, dt) {
      const [dx, dy] = DIRS[b.dir];
      const steps = Math.ceil(b.speed * dt / 5), delta = b.speed * dt / steps;
      for (let step = 0; step < steps && !b.dead; step++) {
        b.x += dx * delta; b.y += dy * delta;
        if (b.x < 0 || b.y < 0 || b.x >= SIZE || b.y >= SIZE) { b.dead = true; break; }
        // Enemy fire can destroy home. Friendly fire leaves home safe.
        if (!b.player && this.base.alive && overlap(b, this.base, 21)) {
          this.base.alive = false; this.burst(312, 600, 'enemy', 30); b.dead = true; this.end('base'); break;
        }
        const gx = Math.floor(b.x / TILE), gy = Math.floor(b.y / TILE), tile = this.grid[gy][gx];
        if (tile === 1 || tile === 2) {
          const radius = tile === 1 || b.power === 2 ? 1 : 0;
          for (let offset = -radius; offset <= radius; offset++) {
            const cx = gx + (dy ? offset : 0), cy = gy + (dx ? offset : 0);
            const transverse = dy ? cx * TILE + TILE / 2 - b.x : cy * TILE + TILE / 2 - b.y;
            if (Math.abs(transverse) > 21) continue;
            const material = this.grid[cy]?.[cx];
            if (material === 1 || (material === 2 && b.power === 2)) this.grid[cy][cx] = 0;
          }
          this.burst(b.x, b.y, tile === 2 ? 'steel' : 'brick', 5); b.dead = true; break;
        }
        for (const other of this.bullets) {
          if (other !== b && !other.dead && other.player !== b.player && overlap(b, other, 8)) {
            other.dead = true; b.dead = true; this.burst(b.x, b.y, 'steel', 4); break;
          }
        }
        if (b.dead) break;
        const targets = b.player ? this.enemies : this.player ? [this.player] : [];
        for (const tank of targets) {
          if (tank.born > 0 || !overlap(b, tank, HALF + 3)) continue;
          b.dead = true;
          if (tank.player) this.hitPlayer();
          else if (tank.shield <= 0) {
            tank.hp--; tank.flash = .12;
            if (tank.hp <= 0) this.destroyEnemy(tank); else { this.burst(b.x, b.y, 'steel', 4); this.emit('armor'); }
          }
          break;
        }
      }
    }
    update(dt, input = {}) {
      if (this.status !== 'playing') return;
      dt = Math.max(0, Math.min(dt, .05)); this.time += dt;
      this.freeze = Math.max(0, this.freeze - dt);
      if (this.fortify > 0) { this.fortify -= dt; if (this.fortify <= 0) this.baseWalls(1); }
      if (!this.player && this.lives > 0) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          const x = [216, 408, 120, 504, 24, 600].find(x => !this.blocked(x, 600, null));
          if (x !== undefined) { this.player = this.makeTank(x, 600, 0, true); this.player.shield = 3; }
        }
      }
      if (this.player) {
        const p = this.player;
        p.shield = Math.max(0, p.shield - dt); p.cooldown = Math.max(0, p.cooldown - dt); p.moving = false;
        if (Number.isInteger(input.dir) && input.dir >= 0 && input.dir < 4) this.move(p, input.dir, 132 * dt);
        if (input.fire) this.fire(p);
      }
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawnEnemy()) this.spawnTimer = Math.max(1.6, 3.3 - this.stage * .15);
      for (const tank of this.enemies) {
        tank.moving = false; tank.flash = Math.max(0, tank.flash - dt);
        tank.born = Math.max(0, tank.born - dt);
        if (tank.born > 0 || this.freeze > 0) continue;
        tank.cooldown = Math.max(0, tank.cooldown - dt); tank.think -= dt;
        if (tank.think <= 0) this.steer(tank);
        const speed = TYPES[tank.kind].speed * (1 + Math.min(.45, (this.stage - 1) * .06));
        if (!this.move(tank, tank.dir, speed * dt)) { tank.think = 0; this.fire(tank); }
        if (tank.cooldown <= 0) this.fire(tank);
      }
      for (const b of this.bullets) { if (!b.dead) this.stepBullet(b, dt); if (this.status !== 'playing') break; }
      this.bullets = this.bullets.filter(b => !b.dead);
      for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; }
      this.particles = this.particles.filter(p => p.life > 0);
      for (const pickup of this.pickups) {
        pickup.life -= dt;
        if (this.status === 'playing' && this.player && overlap(pickup, this.player, 32)) { this.power(pickup.type); pickup.life = 0; }
      }
      this.pickups = this.pickups.filter(p => p.life > 0);
      if (this.status === 'playing' && this.spawned >= this.target && !this.enemies.length) {
        this.clearTimer += dt;
        if (this.clearTimer > .7) { this.status = 'clear'; this.score += 1000; this.emit('clear'); }
      }
    }
  }
  return { Game, TILE, CELL, SIZE, HALF, DIRS, MAPS, TYPES, POWERS };
});
