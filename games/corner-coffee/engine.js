(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CornerCoffee = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // All money is stored in tenths of a coin. Tuning lives here, separate from UI.
  const CONFIG = Object.freeze({ startingCash: 300, firstGuests: 6, maxGuests: 12, patience: 75000, minPatience: 55000, arrival: 14000, minArrival: 9500, extractionMs: 4000, wrongPenalty: 10000, delivery: 60, refill: 4 });
  const ITEMS = Object.freeze({ cup: 3, ice: 3, espresso: 20, water: 1, milk: 12, syrup: 8, lid: 2 });
  const RECIPES = Object.freeze([
    { id: 'americano', price: 120, parts: ['cup', 'espresso', 'water', 'lid'] },
    { id: 'latte', price: 160, parts: ['cup', 'ice', 'espresso', 'milk', 'lid'] },
    { id: 'caramel', price: 200, parts: ['cup', 'ice', 'espresso', 'milk', 'syrup', 'lid'] }
  ]);
  const UPGRADES = Object.freeze({ grinder: 500, fridge: 800, seats: 1000 });
  const copy = value => JSON.parse(JSON.stringify(value));
  const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
  const number = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
  const result = (event, ok = false, values = {}) => ({ event, ok, ...values });

  class Game {
    constructor(random = Math.random) {
      this.random = random;
      this.profile = { day: 1, cash: CONFIG.startingCash, totalServed: 0, upgrades: { grinder: false, fridge: false, seats: false } };
      this.state = 'ready'; this.paused = false; this.shift = null;
    }
    get active() { return this.state === 'playing' && !this.paused; }
    get selected() { return this.shift?.orders.find(order => order.id === this.shift.selected) || null; }
    get zone() { return this.profile.upgrades.grinder ? [34, 82] : [44, 72]; }
    get target() { return Math.min(CONFIG.maxGuests, CONFIG.firstGuests + (this.profile.day - 1) * 2); }
    get interval() { return Math.max(CONFIG.minArrival, CONFIG.arrival - (this.profile.day - 1) * 900); }
    get patience() { return Math.max(CONFIG.minPatience, CONFIG.patience - (this.profile.day - 1) * 3500) + (this.profile.upgrades.seats ? 25000 : 0); }
    start() {
      if (this.state === 'playing') return false;
      this.state = 'playing'; this.paused = false;
      this.shift = { target: this.target, arrived: 0, elapsed: 0, nextArrival: this.interval, orders: [], selected: null, cup: null, stock: Object.fromEntries(Object.keys(ITEMS).map(key => [key, this.target + 4])), revenue: 0, tips: 0, cost: 0, delivery: 0, served: 0, missed: 0, mistakes: 0, waste: 0, perfect: 0 };
      this.spawn(); return true;
    }
    spawn() {
      const s = this.shift;
      if (s.arrived >= s.target || s.orders.length >= 3) return;
      const id = ++s.arrived;
      const recipe = id <= 3 ? id - 1 : Math.min(2, Math.max(0, Math.floor(this.random() * 3)));
      s.orders.push({ id, recipe, patience: this.patience, total: this.patience });
      s.nextArrival = this.interval;
    }
    pause(value = true) { if (this.state === 'playing') this.paused = Boolean(value); }
    accept(id) {
      if (!this.active || !this.shift.orders.some(o => o.id === id) || this.shift.cup?.extracting) return result('inactive');
      this.shift.selected = id; return result('accepted', true);
    }
    consume(item) {
      const s = this.shift;
      if (!s.stock[item]) return false;
      s.stock[item]--; s.cost += item === 'milk' && this.profile.upgrades.fridge ? 8 : ITEMS[item];
      return true;
    }
    add(item) {
      if (!this.active || !Object.hasOwn(ITEMS, item)) return result('inactive');
      if (!this.selected) return result('chooseOrder');
      const s = this.shift, cup = s.cup;
      if (item === 'cup') {
        if (cup) return result('hasCup');
        if (!this.consume(item)) return result('emptyStock');
        s.cup = { parts: ['cup'], extraction: 0, extracting: false, quality: null, rejected: false };
        return result('added', true, { item });
      }
      if (!cup) return result('needCup');
      if (cup.extracting) return result('stopFirst');
      if (cup.parts.includes('lid')) return result('sealed');
      if (cup.parts.includes(item)) return result('alreadyAdded');
      if (!this.consume(item)) return result('emptyStock');
      cup.parts.push(item);
      if (item === 'espresso') { cup.extracting = true; return result('extracting', true); }
      return result(item === 'lid' ? 'lidded' : 'added', true, { item });
    }
    stopExtraction() {
      if (!this.active || !this.shift.cup?.extracting) return result('inactive');
      const cup = this.shift.cup, [low, high] = this.zone;
      cup.extracting = false;
      cup.quality = cup.extraction >= low && cup.extraction <= high ? 'good' : cup.extraction < low ? 'weak' : 'bitter';
      return result(cup.quality, true);
    }
    discard() {
      if (!this.active || !this.shift.cup) return result('inactive');
      this.shift.cup = null; this.shift.waste++; return result('discarded', true);
    }
    serve() {
      if (!this.active) return result('inactive');
      const s = this.shift, order = this.selected, cup = s.cup;
      if (!order) return result('chooseOrder');
      if (!cup?.parts.includes('lid')) return result('needLid');
      if (cup.rejected) return result('remake');
      const recipe = RECIPES[order.recipe];
      const matches = cup.parts.length === recipe.parts.length && recipe.parts.every(item => cup.parts.includes(item)) && cup.quality === 'good';
      if (!matches) {
        s.mistakes++; cup.rejected = true; order.patience = Math.max(0, order.patience - CONFIG.wrongPenalty);
        this.expire(); this.checkClose();
        return result('wrong');
      }
      const tip = order.patience / order.total >= .65 ? 20 : order.patience / order.total >= .3 ? 10 : 0;
      s.revenue += recipe.price; s.tips += tip; s.served++; if (tip === 20) s.perfect++;
      s.orders = s.orders.filter(o => o.id !== order.id); s.selected = null; s.cup = null;
      if (!s.orders.length) s.nextArrival = Math.min(s.nextArrival, 1300);
      this.checkClose();
      return result('served', true, { earned: recipe.price + tip, tip });
    }
    restock() {
      if (!this.active) return result('inactive');
      if (Object.values(this.shift.stock).every(n => n >= 4)) return result('stockEnough');
      for (const item of Object.keys(ITEMS)) this.shift.stock[item] += CONFIG.refill;
      this.shift.delivery += CONFIG.delivery; return result('restocked', true);
    }
    expire() {
      const s = this.shift, expired = s.orders.filter(o => o.patience <= 0);
      s.missed += expired.length; s.orders = s.orders.filter(o => o.patience > 0);
      if (!this.selected) s.selected = null;
      if (!s.orders.length) s.nextArrival = Math.min(s.nextArrival, 1300);
      return expired.length;
    }
    tick(ms) {
      if (!this.active || !number(ms, 0, 1000)) return [];
      const s = this.shift, events = []; s.elapsed += ms;
      for (const order of s.orders) order.patience = Math.max(0, order.patience - ms * (order.id === s.selected ? 1 : .65));
      if (s.cup?.extracting) {
        s.cup.extraction = Math.min(100, s.cup.extraction + ms / CONFIG.extractionMs * 100);
        if (s.cup.extraction >= 100) events.push(this.stopExtraction());
      }
      if (this.expire()) events.push(result('left'));
      s.nextArrival = Math.max(0, s.nextArrival - ms);
      if (s.nextArrival === 0 && s.orders.length < 3 && s.arrived < s.target) { this.spawn(); events.push(result('arrived', true)); }
      this.checkClose(); return events;
    }
    checkClose() {
      const s = this.shift;
      if (s.arrived === s.target && !s.orders.length) this.close();
    }
    close() {
      if (this.state !== 'playing') return false;
      const s = this.shift;
      s.missed += s.orders.length + s.target - s.arrived; s.orders = []; s.selected = null;
      if (s.cup) { s.waste++; s.cup = null; }
      this.profile.cash += s.revenue + s.tips - s.cost - s.delivery;
      this.profile.totalServed += s.served;
      this.state = 'closed'; this.paused = false; return true;
    }
    buy(key) {
      if (!['ready', 'closed'].includes(this.state) || !Object.hasOwn(UPGRADES, key) || this.profile.upgrades[key] || this.profile.cash < UPGRADES[key]) return false;
      this.profile.cash -= UPGRADES[key]; this.profile.upgrades[key] = true; return true;
    }
    nextDay() { if (this.state !== 'closed') return false; this.profile.day++; return this.start(); }
    snapshot() { return copy({ version: 1, profile: this.profile, state: this.state, shift: this.shift }); }
    static restore(raw, random = Math.random) {
      const game = new Game(random);
      try {
        const p = raw?.profile, s = raw?.shift;
        if (raw.version !== 1 || !p || !integer(p.day, 1, 100000) || !integer(p.cash, -100000000, 100000000) || !integer(p.totalServed, 0, 10000000) || !p.upgrades || !Object.keys(UPGRADES).every(k => typeof p.upgrades[k] === 'boolean') || !['ready', 'playing', 'closed'].includes(raw.state)) return game;
        if (raw.state !== 'ready') {
          if (!s || !integer(s.target, 6, 12) || !integer(s.arrived, 1, s.target) || !number(s.elapsed, 0, 86400000) || !number(s.nextArrival, 0, CONFIG.arrival)) return game;
          if (!['revenue', 'tips', 'cost', 'delivery', 'served', 'missed', 'mistakes', 'waste', 'perfect'].every(k => integer(s[k], 0, 10000000))) return game;
          if (!s.stock || !Object.keys(ITEMS).every(k => integer(s.stock[k], 0, 100000))) return game;
          if (!Array.isArray(s.orders) || s.orders.length > 3 || !s.orders.every(o => integer(o.id, 1, s.arrived) && integer(o.recipe, 0, 2) && number(o.total, CONFIG.minPatience, CONFIG.patience + 25000) && number(o.patience, 0, o.total)) || new Set(s.orders.map(o => o.id)).size !== s.orders.length) return game;
          if (s.selected !== null && !s.orders.some(o => o.id === s.selected)) return game;
          if (s.cup && (!Array.isArray(s.cup.parts) || s.cup.parts[0] !== 'cup' || s.cup.parts.length > 7 || new Set(s.cup.parts).size !== s.cup.parts.length || !s.cup.parts.every(k => Object.hasOwn(ITEMS, k)) || !number(s.cup.extraction, 0, 100) || typeof s.cup.extracting !== 'boolean' || typeof s.cup.rejected !== 'boolean' || ![null, 'good', 'weak', 'bitter'].includes(s.cup.quality))) return game;
          if (s.served + s.missed + s.orders.length !== (raw.state === 'closed' ? s.target : s.arrived)) return game;
          if (raw.state === 'closed' && (s.orders.length || s.cup)) return game;
        }
        game.profile = copy(p); game.state = raw.state; game.shift = raw.state === 'ready' ? null : copy(s); game.paused = game.state === 'playing';
      } catch { return new Game(random); }
      return game;
    }
  }
  return { Game, CONFIG, ITEMS, RECIPES, UPGRADES };
});
