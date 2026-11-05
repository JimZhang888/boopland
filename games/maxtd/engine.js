(function (root) {
  'use strict';
  const COLS = 20, ROWS = 13;
  const ENTRY = { x: 0, y: 6 }, EXIT = { x: 19, y: 6 };
  const RULES = Object.freeze({ damageBonusCap: 2, attackSpeedBonusCap: 2, slowCap: 0.7, enemyHpGrowth: 1.1, smallEnemySpeed: 2.64, bigEnemySpeed: 1.6 });
  const TYPES = {
    wall: { name: '沙袋墙', role: '基础工事', cost: 8, color: '#b49b75', description: '占据一格，改变敌人路线。可全额回收，随时重塑你的迷宫。' },
    rifle: { name: '突击手', role: '点对点射击', cost: 55, color: '#728668', damage: 11, range: 2.8, interval: 0.62, description: '稳定、快速的单体火力。让敌人在射程里多绕几步，收益就多一点。' },
    sniper: { name: '狙击手', role: '直线穿透', cost: 100, color: '#668a98', damage: 34, range: 5.2, interval: 1.95, description: '一发子弹贯穿整条直线。部署在长廊尽头，一次命中多个目标。' },
    rocket: { name: '火箭兵', role: '圆形范围伤害', cost: 125, color: '#b87854', damage: 29, range: 3.9, interval: 2.3, radius: 1.35, description: '肩扛火箭弹，轰击一片区域。与减速搭配，对密集敌群尤其有效。' },
    disruptor: { name: '信息兵', role: '范围干扰减速', cost: 90, color: '#8d7b9d', damage: 5, range: 3.4, interval: 1.8, radius: 1.65, slow: 0.25, description: '发射干扰弹，造成少量范围伤害，并使敌人减速 25%，持续 2.6 秒。' },
    damage: { name: '军工研究所', role: '全局伤害 +15%', cost: 150, color: '#b77c56', support: 'damage', effect: 0.15, description: '所有攻击单位的伤害提高 15%。每次升级额外增加 15%，多个研究所累加，全局伤害增益上限为 200%。' },
    speed: { name: '科技研究所', role: '全局攻速 +20%', cost: 160, color: '#768d74', support: 'speed', effect: 0.2, description: '所有攻击单位的攻速提高 20%。多个研究所累加，全局攻速增益上限为 200%。' },
    slow: { name: '科学中心', role: '全局减速效果 +20%', cost: 140, color: '#827b9f', support: 'slow', effect: 0.2, description: '干扰弹的减速强度提高 20%。多个科学中心累加，敌人最终减速比例上限为 70%。' }
  };
  const key = (x, y) => y * COLS + x;
  const valid = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < COLS && y < ROWS;
  const neighbors = (x, y) => [[x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y]].filter(([a, b]) => valid(a, b));
  const reserved = (x, y) => (x === ENTRY.x && y === ENTRY.y) || (x === EXIT.x && y === EXIT.y);

  class Game {
    constructor({ starter = true } = {}) {
      this.money = 320; this.lives = 20; this.wave = 0; this.cleared = 0; this.kills = 0;
      this.status = 'prep'; this.time = 0; this.buildings = []; this.enemies = []; this.shots = []; this.effects = []; this.events = [];
      this.queue = []; this.spawnTimer = 0; this.spawned = 0; this.totalInWave = 0; this.nextId = 1; this.revision = 0;
      if (starter) {
        for (const [type, x, y] of [['rifle', 5, 5], ['sniper', 12, 7], ['wall', 6, 3], ['wall', 6, 4], ['wall', 6, 5], ['wall', 12, 8]]) {
          this.buildings.push(this.makeBuilding(type, x, y));
        }
      }
      this.recalculate();
    }
    makeBuilding(type, x, y) { return { id: this.nextId++, type, x, y, level: 1, spent: TYPES[type].cost, cooldown: 0.15, angle: 0, flash: 0 }; }
    buildingAt(x, y) { return this.buildings.find(b => b.x === x && b.y === y); }
    distanceField(blocks = this.buildings) {
      const occupied = new Set(blocks.map(b => key(b.x, b.y)));
      const d = Array(COLS * ROWS).fill(Infinity), queue = [[EXIT.x, EXIT.y]];
      d[key(EXIT.x, EXIT.y)] = 0;
      for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        for (const [nx, ny] of neighbors(x, y)) {
          const k = key(nx, ny);
          if (!occupied.has(k) && d[k] === Infinity) { d[k] = d[key(x, y)] + 1; queue.push([nx, ny]); }
        }
      }
      return d;
    }
    recalculate() { this.field = this.distanceField(); this.buffs = this.getBuffs(); this.revision++; }
    getBuffs() {
      const result = { damage: 0, speed: 0, slow: 0 };
      for (const b of this.buildings) { const t = TYPES[b.type]; if (t.support) result[t.support] += t.effect * b.level; }
      result.damage = Math.min(RULES.damageBonusCap, result.damage);
      result.speed = Math.min(RULES.attackSpeedBonusCap, result.speed);
      return result;
    }
    stats(b) {
      const t = TYPES[b.type], lv = b.level - 1;
      return { damage: (t.damage || 0) * 1.65 ** lv * (1 + this.buffs.damage), range: (t.range || 0) + lv * 0.22,
        interval: (t.interval || 1) / ((1 + 0.12 * lv) * (1 + this.buffs.speed)), radius: t.radius || 0,
        slow: Math.min(RULES.slowCap, (t.slow || 0) * (1 + this.buffs.slow)), effect: (t.effect || 0) * b.level };
    }
    placement(type, x, y) {
      if (this.status === 'over') return { ok: false, code: 'ended', reason: '本次守卫已结束，开始新的挑战吧。' };
      if (!TYPES[type] || !valid(x, y)) return { ok: false, code: 'invalidCell', reason: '请在方格内选择部署位置。' };
      if (reserved(x, y)) return { ok: false, code: 'reserved', reason: '入口和指挥部需要保持畅通。' };
      if (this.buildingAt(x, y)) return { ok: false, code: 'occupied', reason: '这里已有单位，点击可查看或升级。' };
      if (this.enemies.some(e => (Math.floor(e.x) === x && Math.floor(e.y) === y) || (e.toX === x && e.toY === y))) return { ok: false, code: 'enemyPassing', reason: '敌人正在通过这里，请稍后部署。' };
      if (this.money < TYPES[type].cost) return { ok: false, code: 'funds', params: { needed: TYPES[type].cost - this.money }, reason: `经费不足，还需要 ${TYPES[type].cost - this.money}。` };
      const field = this.distanceField([...this.buildings, { x, y }]);
      if (!Number.isFinite(field[key(ENTRY.x, ENTRY.y)])) return { ok: false, code: 'blockedPath', reason: '不能完全封路！请留出一条通往指挥部的路线。' };
      if (this.enemies.some(e => !Number.isFinite(field[key(e.toX ?? Math.floor(e.x), e.toY ?? Math.floor(e.y))]))) return { ok: false, code: 'trappedEnemy', reason: '这会困住场上的敌人，请留出出口。' };
      return { ok: true, field };
    }
    place(type, x, y) {
      const p = this.placement(type, x, y); if (!p.ok) return p;
      const building = this.makeBuilding(type, x, y); this.buildings.push(building); this.money -= TYPES[type].cost;
      this.recalculate(); this.events.push({ type: 'build' }); return { ok: true, building };
    }
    upgradeCost(b) { return Math.round(TYPES[b.type].cost * (0.75 + b.level * 0.35)); }
    upgrade(id) {
      const b = this.buildings.find(b => b.id === id);
      if (!b || b.type === 'wall' || b.level >= 3 || this.status === 'over') return { ok: false, code: 'noUpgrade', reason: '该单位无法继续升级。' };
      const cost = this.upgradeCost(b); if (this.money < cost) return { ok: false, code: 'funds', params: { needed: cost - this.money }, reason: `经费不足，还需要 ${cost - this.money}。` };
      this.money -= cost; b.spent += cost; b.level++; this.recalculate(); this.events.push({ type: 'upgrade' }); return { ok: true };
    }
    sellValue(b) { return b.type === 'wall' ? b.spent : Math.floor(b.spent * 0.75); }
    sell(id) {
      const b = this.buildings.find(b => b.id === id);
      if (!b || this.status === 'over') return { ok: false, code: 'noSell', reason: '无法回收该单位。' };
      const refund = this.sellValue(b); this.money += refund; this.buildings = this.buildings.filter(item => item.id !== id);
      this.recalculate(); this.events.push({ type: 'sell' }); return { ok: true, refund };
    }
    path(x = ENTRY.x, y = ENTRY.y, field = this.field) {
      if (!valid(x, y) || !Number.isFinite(field[key(x, y)])) return [];
      const result = [{ x, y }];
      for (let i = 0; i < COLS * ROWS && (x !== EXIT.x || y !== EXIT.y); i++) {
        const n = this.nextCell(x, y, field); if (!n) break;
        [x, y] = n; result.push({ x, y });
      }
      return result;
    }
    nextCell(x, y, field = this.field) {
      return neighbors(x, y).filter(([nx, ny]) => field[key(nx, ny)] < field[key(x, y)]).sort((a, b) => field[key(...a)] - field[key(...b)])[0];
    }
    waveInfo(wave = this.wave + 1) {
      const count = Math.min(76, 8 + wave * 2);
      const big = wave < 3 ? 0 : Math.min(Math.floor(count * 0.46), 1 + Math.floor((wave - 3) / 2));
      const multiplier = RULES.enemyHpGrowth ** (wave - 1);
      return { wave, count, big, small: count - big, multiplier, smallHp: 42 * multiplier, bigHp: 210 * multiplier, reward: 24 + wave * 3 };
    }
    startWave() {
      if (this.status !== 'prep') return false;
      this.wave++; const info = this.waveInfo(this.wave);
      this.queue = [];
      for (let i = 0; i < info.count; i++) this.queue.push(i >= info.count - info.big ? 'big' : 'small');
      this.totalInWave = info.count; this.spawned = 0; this.spawnTimer = 0.35; this.status = 'wave';
      this.events.push({ type: 'wave', wave: this.wave }); return true;
    }
    spawn(type) {
      const big = type === 'big', info = this.waveInfo(this.wave), hp = big ? info.bigHp : info.smallHp;
      const enemy = { id: this.nextId++, type, x: ENTRY.x + 0.5, y: ENTRY.y + 0.5, toX: ENTRY.x, toY: ENTRY.y, hp, maxHp: hp,
        speed: big ? RULES.bigEnemySpeed : RULES.smallEnemySpeed, slow: 0, slowTime: 0, hit: 0, phase: this.nextId * 2.7, reward: big ? 23 : 8 };
      this.enemies.push(enemy); this.spawned++; return enemy;
    }
    hurt(e, damage) {
      if (e.hp <= 0) return;
      e.hp -= damage; e.hit = 0.16;
      if (e.hp <= 0) {
        this.money += e.reward; this.kills++;
        this.effects.push({ type: 'pop', x: e.x, y: e.y, life: 0.45, maxLife: 0.45, big: e.type === 'big', reward: e.reward });
        this.events.push({ type: 'kill', big: e.type === 'big' });
      }
    }
    splash(x, y, stats, isSlow) {
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) <= stats.radius + (e.type === 'big' ? 0.23 : 0.14)) {
          this.hurt(e, stats.damage);
          if (isSlow) { e.slow = Math.max(e.slow, stats.slow); e.slowTime = 2.6; }
        }
      }
      this.effects.push({ type: isSlow ? 'pulse' : 'blast', x, y, radius: stats.radius, life: 0.5, maxLife: 0.5 });
      this.events.push({ type: isSlow ? 'pulse' : 'blast' });
    }
    attack(b, target, stats) {
      const x = b.x + 0.5, y = b.y + 0.5, angle = Math.atan2(target.y - y, target.x - x);
      b.angle = angle; b.flash = 0.12;
      if (b.type === 'rifle') {
        this.hurt(target, stats.damage);
        this.effects.push({ type: 'bullet', x, y, tx: target.x, ty: target.y, life: 0.12, maxLife: 0.12 });
      } else if (b.type === 'sniper') {
        const dx = Math.cos(angle), dy = Math.sin(angle);
        for (const e of this.enemies) {
          const ex = e.x - x, ey = e.y - y, along = ex * dx + ey * dy, across = Math.abs(ex * dy - ey * dx);
          if (e.hp > 0 && along > 0 && along <= stats.range + 0.3 && across <= (e.type === 'big' ? 0.36 : 0.24)) this.hurt(e, stats.damage);
        }
        this.effects.push({ type: 'beam', x, y, tx: x + dx * stats.range, ty: y + dy * stats.range, life: 0.22, maxLife: 0.22 });
      } else {
        this.shots.push({ x, y, tx: target.x, ty: target.y, time: 0, duration: 0.34, stats, isSlow: b.type === 'disruptor' });
      }
      this.events.push({ type: 'shot', weapon: b.type });
    }
    update(dt) {
      if (this.status !== 'wave') return;
      dt = Math.max(0, Math.min(dt, 0.05)); this.time += dt;
      this.effects = this.effects.filter(f => (f.life -= dt) > 0);
      this.spawnTimer -= dt;
      if (this.queue.length && this.spawnTimer <= 0) { this.spawn(this.queue.shift()); this.spawnTimer = Math.max(0.25, 0.72 - this.wave * 0.006); }
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        e.hit = Math.max(0, e.hit - dt); e.slowTime = Math.max(0, e.slowTime - dt); if (!e.slowTime) e.slow = 0;
        let distance = e.speed * (1 - e.slow) * dt;
        for (let n = 0; n < 6 && distance > 0; n++) {
          const tx = e.toX + 0.5, ty = e.toY + 0.5, len = Math.hypot(tx - e.x, ty - e.y);
          if (len <= distance + 0.000001) {
            e.x = tx; e.y = ty; distance -= len;
            if (e.toX === EXIT.x && e.toY === EXIT.y) { e.escaped = true; this.lives = Math.max(0, this.lives - (e.type === 'big' ? 3 : 1)); this.events.push({ type: 'leak' }); break; }
            const next = this.nextCell(e.toX, e.toY); if (!next) break; [e.toX, e.toY] = next;
          } else { e.x += (tx - e.x) / len * distance; e.y += (ty - e.y) / len * distance; distance = 0; }
        }
      }
      this.enemies = this.enemies.filter(e => e.hp > 0 && !e.escaped);
      if (this.lives <= 0) { this.status = 'over'; this.events.push({ type: 'over' }); return; }
      for (const b of this.buildings) {
        b.flash = Math.max(0, b.flash - dt); b.cooldown = Math.max(0, b.cooldown - dt);
        if (!TYPES[b.type].damage || b.cooldown > 0) continue;
        const stats = this.stats(b);
        const candidates = this.enemies.filter(e => e.hp > 0 && Math.hypot(e.x - b.x - 0.5, e.y - b.y - 0.5) <= stats.range);
        candidates.sort((a, c) => (this.field[key(a.toX, a.toY)] + Math.hypot(a.toX + 0.5 - a.x, a.toY + 0.5 - a.y)) - (this.field[key(c.toX, c.toY)] + Math.hypot(c.toX + 0.5 - c.x, c.toY + 0.5 - c.y)));
        if (candidates.length) { this.attack(b, candidates[0], stats); b.cooldown = stats.interval; }
      }
      for (const shot of this.shots) { shot.time += dt; if (shot.time >= shot.duration) this.splash(shot.tx, shot.ty, shot.stats, shot.isSlow); }
      this.shots = this.shots.filter(s => s.time < s.duration);
      this.enemies = this.enemies.filter(e => e.hp > 0);
      if (!this.queue.length && !this.enemies.length && !this.shots.length) {
        this.cleared = this.wave; const bonus = this.waveInfo(this.wave).reward; this.money += bonus; this.status = 'prep';
        this.effects = []; this.events.push({ type: 'clear', wave: this.wave, bonus });
        this.startWave();
      }
    }
    drainEvents() { const events = this.events; this.events = []; return events; }
  }
  const api = { Game, TYPES, RULES, COLS, ROWS, ENTRY, EXIT, key };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PaperTD = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
