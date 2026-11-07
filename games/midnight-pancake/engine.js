(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MidnightPancake = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SHIFT = 120000;
  const FRONT_READY = 2400, FRONT_PERFECT = 4800, FRONT_BURN = 8000;
  const BACK_READY = 1600, BACK_PERFECT = 8000, BACK_BURN = 16000;
  const COMBO_WINDOW = 14000;
  const INGREDIENTS = ['egg', 'crisp', 'lettuce', 'sausage', 'scallion'];
  const emptyPan = () => ({ stage: 'empty', heat: 0, ingredients: 0, perfect: false });
  const countBits = value => INGREDIENTS.reduce((sum, _, index) => sum + ((value >> index) & 1), 0);
  const cleanBest = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000 ? value : 0;

  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.state = 'ready'; this.paused = false; this.elapsed = 0;
      this.pans = [emptyPan(), emptyPan()]; this.orders = [null, null, null];
      this.nextAt = [0, 5000, 10500]; this.nextId = 1;
      this.selected = 0; this.coins = 0; this.served = 0; this.perfects = 0;
      this.waste = 0; this.missed = 0; this.combo = 0; this.bestCombo = 0; this.lastServe = -Infinity;
    }
    get remaining() { return Math.max(0, SHIFT - this.elapsed); }
    get phase() { return Math.min(2, Math.floor(this.elapsed / 40000)); }
    get active() { return this.state === 'playing' && !this.paused; }
    get pan() { return this.pans[this.selected]; }
    start() { this.reset(); this.state = 'playing'; this.spawn(0); }
    pause(value) { if (this.state === 'playing') this.paused = Boolean(value); }
    select(index) {
      if (!Number.isInteger(index) || index < 0 || index > 1 || !this.active) return false;
      this.selected = index; return true;
    }
    spawn(slot) {
      const id = this.nextId++;
      let mask = 1;
      if (id === 1) mask = 3;
      else if (id === 2) mask = 5;
      else {
        const choices = [1, 2, 3, 4];
        const extras = 1 + (this.phase > 0 ? 1 : 0) + (this.phase === 2 && this.random() > 0.5 ? 1 : 0);
        for (let i = 0; i < extras; i++) {
          const pick = Math.min(choices.length - 1, Math.floor(this.random() * choices.length));
          mask |= 1 << choices.splice(pick, 1)[0];
        }
      }
      const patience = 44000 - this.phase * 5000;
      this.orders[slot] = { id, mask, patience, total: patience, face: (id - 1) % 6 };
    }
    action() {
      if (!this.active) return { ok: false, event: 'inactive' };
      const pan = this.pan;
      if (pan.stage === 'empty') {
        pan.stage = 'front'; pan.heat = 0;
        return { ok: true, event: 'pour' };
      }
      if (pan.stage === 'front') {
        if (pan.heat < FRONT_READY) return { ok: false, event: 'tooEarly' };
        pan.perfect = pan.heat <= FRONT_PERFECT; pan.stage = 'back'; pan.heat = 0;
        return { ok: true, event: pan.perfect ? 'perfectFlip' : 'flip' };
      }
      if (pan.stage === 'back') {
        if (pan.heat < BACK_READY) return { ok: false, event: 'tooEarly' };
        if (!(pan.ingredients & 1)) return { ok: false, event: 'needEgg' };
        pan.perfect = pan.perfect && pan.heat <= BACK_PERFECT;
        pan.stage = 'wrapped'; pan.heat = 0;
        return { ok: true, event: 'wrap' };
      }
      if (pan.stage === 'burnt') return this.discard();
      return { ok: false, event: 'chooseGuest' };
    }
    ingredient(index) {
      if (!this.active || this.pan.stage !== 'back' || !Number.isInteger(index) || index < 0 || index >= INGREDIENTS.length) return { ok: false, event: 'flipFirst' };
      this.pan.ingredients ^= 1 << index;
      return { ok: true, event: 'ingredient' };
    }
    discard() {
      if (!this.active || this.pan.stage === 'empty') return { ok: false, event: 'inactive' };
      if (this.pan.stage !== 'burnt') this.waste++;
      this.combo = 0; this.pans[this.selected] = emptyPan();
      return { ok: true, event: 'discard' };
    }
    serve(slot) {
      if (!this.active || !Number.isInteger(slot) || slot < 0 || slot > 2 || !this.orders[slot]) return { ok: false, event: 'inactive' };
      if (this.pan.stage !== 'wrapped') return { ok: false, event: 'wrapFirst' };
      const order = this.orders[slot];
      if (order.mask !== this.pan.ingredients) {
        this.combo = 0;
        // A wrong handoff keeps both the order and the pancake recoverable.
        order.patience = Math.max(0, order.patience - 2500);
        return { ok: false, event: 'wrongOrder' };
      }
      const perfect = this.pan.perfect;
      this.combo = this.elapsed - this.lastServe <= COMBO_WINDOW ? this.combo + 1 : 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo); this.lastServe = this.elapsed;
      const tip = Math.ceil(order.patience / order.total * 3) + (perfect ? 2 : 0) + Math.min(8, this.combo - 1);
      const earned = 8 + countBits(order.mask) * 2 + tip;
      this.coins += earned; this.served++; if (perfect) this.perfects++;
      this.orders[slot] = null; this.nextAt[slot] = this.elapsed + 3400 - this.phase * 1000;
      this.pans[this.selected] = emptyPan();
      return { ok: true, event: 'serve', earned, tip, perfect, combo: this.combo, slot };
    }
    tick(dt) {
      if (!this.active || !Number.isFinite(dt) || dt <= 0) return [];
      const step = Math.min(dt, this.remaining), events = [], previousPhase = this.phase;
      this.elapsed += step;
      for (let i = 0; i < this.pans.length; i++) {
        const pan = this.pans[i];
        if (!['front', 'back'].includes(pan.stage)) continue;
        const ready = pan.stage === 'front' ? FRONT_READY : BACK_READY;
        const burn = pan.stage === 'front' ? FRONT_BURN : BACK_BURN;
        const before = pan.heat; pan.heat += step;
        if (pan.heat >= burn) {
          pan.stage = 'burnt'; this.waste++; this.combo = 0;
          events.push({ event: 'burn', pan: i });
        } else if (before < ready && pan.heat >= ready) events.push({ event: 'ready', pan: i });
      }
      for (let i = 0; i < this.orders.length; i++) {
        const order = this.orders[i];
        if (order) {
          order.patience -= step;
          if (order.patience <= 0) {
            this.orders[i] = null; this.nextAt[i] = this.elapsed + 2200;
            this.missed++; this.combo = 0; events.push({ event: 'leave', slot: i });
          }
        }
      }
      if (this.combo && this.elapsed - this.lastServe > COMBO_WINDOW) this.combo = 0;
      if (this.remaining <= 0) {
        this.state = 'finished'; this.paused = false; events.push({ event: 'finish' });
      } else {
        if (this.phase !== previousPhase) events.push({ event: 'rush' });
        for (let i = 0; i < this.orders.length; i++) {
          if (!this.orders[i] && this.elapsed >= this.nextAt[i]) {
            this.spawn(i); events.push({ event: 'arrive', slot: i });
          }
        }
      }
      return events;
    }
  }
  return { Game, SHIFT, FRONT_READY, FRONT_PERFECT, FRONT_BURN, BACK_READY, BACK_PERFECT, BACK_BURN, COMBO_WINDOW, INGREDIENTS, countBits, cleanBest };
});
