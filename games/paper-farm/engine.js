(function (root) {
  'use strict';
  const CROPS = {
    wheat: { cost: 0, seconds: 16, yield: 3, level: 1, price: 4 },
    carrot: { cost: 6, seconds: 24, yield: 3, level: 2, price: 8 },
    berry: { cost: 12, seconds: 32, yield: 3, level: 3, price: 14 }
  };
  const ANIMALS = {
    chicken: { cost: 60, level: 1, input: { wheat: 1 }, output: 'egg', count: 2, seconds: 20 },
    cow: { cost: 150, level: 3, input: { wheat: 2 }, output: 'milk', count: 2, seconds: 28 }
  };
  const MACHINES = {
    mill: { cost: 75, level: 2, input: { wheat: 2 }, output: 'flour', count: 1, seconds: 12 },
    oven: { cost: 120, level: 3, input: { flour: 1, egg: 1 }, output: 'bread', count: 1, seconds: 20 },
    kettle: { cost: 160, level: 4, input: { berry: 2 }, output: 'jam', count: 1, seconds: 22 }
  };
  const PRICES = { wheat: 4, carrot: 8, berry: 14, egg: 12, milk: 20, flour: 20, bread: 48, jam: 48 };
  const ORDERS = [
    { needs: { wheat: 3 }, coins: 35 },
    { needs: { wheat: 3, egg: 2 }, coins: 65 },
    { needs: { carrot: 3, flour: 1 }, coins: 80 },
    { needs: { flour: 2, egg: 2 }, coins: 95 },
    { needs: { berry: 3, milk: 2 }, coins: 125 },
    { needs: { bread: 2, carrot: 3 }, coins: 160 },
    { needs: { jam: 2, milk: 2 }, coins: 180 },
    { needs: { bread: 2, jam: 2, milk: 2 }, coins: 260 }
  ];
  const create = () => ({ version: 1, coins: 100, delivered: 0, harvested: 0, made: 0, watered: 0,
    inventory: Object.fromEntries(Object.keys(PRICES).map(k => [k, k === 'wheat' ? 2 : 0])),
    plots: Array.from({ length: 9 }, (_, i) => ({ open: i < 3, crop: null, left: 0, watered: false })),
    animals: Object.fromEntries(Object.keys(ANIMALS).map(k => [k, { owned: false, active: false, left: 0 }])),
    machines: Object.fromEntries(Object.keys(MACHINES).map(k => [k, { owned: false, active: false, left: 0 }])) });
  const level = s => Math.min(5, 1 + Math.floor(s.delivered / 2));
  const order = s => ORDERS[s.delivered % ORDERS.length];
  const canPay = (s, input) => Object.entries(input).every(([k, n]) => s.inventory[k] >= n);
  const pay = (s, input) => Object.entries(input).forEach(([k, n]) => { s.inventory[k] -= n; });
  const landCost = s => 25 + (s.plots.filter(p => p.open).length - 3) * 15;
  function act(s, action, id, crop) {
    const plot = s.plots[id];
    if (action === 'land') {
      if (!plot || plot.open) return 'invalid';
      const cost = landCost(s);
      if (s.coins < cost) return 'money';
      s.coins -= cost; plot.open = true; return 'tilled';
    }
    if (action === 'plant') {
      const def = CROPS[crop];
      if (!plot?.open || plot.crop || !def) return 'invalid';
      if (level(s) < def.level) return 'locked';
      if (s.coins < def.cost) return 'money';
      s.coins -= def.cost; Object.assign(plot, { crop, left: def.seconds, watered: false }); return 'planted';
    }
    if (action === 'water') {
      if (!plot?.crop || plot.left <= 0 || plot.watered) return 'invalid';
      plot.left *= .6; plot.watered = true; s.watered++; return 'watered';
    }
    if (action === 'harvest') {
      if (!plot?.crop || plot.left > 0) return 'invalid';
      s.inventory[plot.crop] += CROPS[plot.crop].yield; s.harvested++;
      Object.assign(plot, { crop: null, left: 0, watered: false }); return 'harvested';
    }
    if (action === 'sell') {
      if (!(id in PRICES) || s.inventory[id] < 1) return 'invalid';
      s.inventory[id]--; s.coins += PRICES[id]; return 'sold';
    }
    if (action === 'deliver') {
      const next = order(s);
      if (!canPay(s, next.needs)) return 'ingredients';
      pay(s, next.needs); s.coins += next.coins; s.delivered++; return s.delivered === 8 ? 'prosperous' : 'delivered';
    }
    const def = ANIMALS[id] || MACHINES[id];
    const unit = ANIMALS[id] ? s.animals[id] : s.machines[id];
    if (!def || !unit) return 'invalid';
    if (action === 'buy') {
      if (unit.owned) return 'invalid';
      if (level(s) < def.level) return 'locked';
      if (s.coins < def.cost) return 'money';
      s.coins -= def.cost; unit.owned = true; return 'bought';
    }
    if (!unit.owned) return 'invalid';
    if (action === 'produce') {
      if (unit.active) return 'invalid';
      if (!canPay(s, def.input)) return 'ingredients';
      pay(s, def.input); unit.active = true; unit.left = def.seconds; return 'started';
    }
    if (action === 'collect') {
      if (!unit.active || unit.left > 0) return 'invalid';
      s.inventory[def.output] += def.count; unit.active = false; unit.left = 0; s.made++; return 'collected';
    }
    return 'invalid';
  }
  function tick(s, seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    for (const p of s.plots) if (p.crop) p.left = Math.max(0, p.left - seconds);
    for (const u of [...Object.values(s.animals), ...Object.values(s.machines)]) if (u.active) u.left = Math.max(0, u.left - seconds);
  }
  function restore(raw) {
    try {
      const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const integer = x => Number.isSafeInteger(x) && x >= 0 && x <= 1e9;
      if (!s || s.version !== 1 || !['coins', 'delivered', 'harvested', 'made', 'watered'].every(k => integer(s[k]))) return null;
      if (!s.inventory || !Object.keys(PRICES).every(k => integer(s.inventory[k]))) return null;
      if (!Array.isArray(s.plots) || s.plots.length !== 9) return null;
      if (!s.plots.every((p, i) => p && typeof p.open === 'boolean' && (i > 2 || p.open) && typeof p.watered === 'boolean' && Number.isFinite(p.left) && p.left >= 0 && (p.crop === null ? p.left === 0 && !p.watered : p.open && CROPS[p.crop] && level(s) >= CROPS[p.crop].level && p.left <= CROPS[p.crop].seconds))) return null;
      for (const [key, defs] of [['animals', ANIMALS], ['machines', MACHINES]]) {
        if (!s[key] || !Object.entries(defs).every(([k, d]) => {
          const u = s[key][k];
          return u && typeof u.owned === 'boolean' && typeof u.active === 'boolean' && Number.isFinite(u.left) && u.left >= 0 && u.left <= d.seconds && (!u.owned ? !u.active && u.left === 0 : level(s) >= d.level) && (u.active || u.left === 0);
        })) return null;
      }
      // Copy only known fields: malformed or extra data never enters the UI.
      const clean = create();
      for (const k of ['coins', 'delivered', 'harvested', 'made', 'watered']) clean[k] = s[k];
      for (const k of Object.keys(PRICES)) clean.inventory[k] = s.inventory[k];
      clean.plots = s.plots.map(p => ({ open: p.open, crop: p.crop, left: p.left, watered: p.watered }));
      for (const k of ['animals', 'machines']) for (const id of Object.keys(clean[k])) {
        const u = s[k][id]; clean[k][id] = { owned: u.owned, active: u.active, left: u.left };
      }
      return clean;
    } catch { return null; }
  }
  const api = { CROPS, ANIMALS, MACHINES, PRICES, ORDERS, create, level, order, canPay, landCost, act, tick, restore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PaperFarm = api;
})(typeof window !== 'undefined' ? window : globalThis);
