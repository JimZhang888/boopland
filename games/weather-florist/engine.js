/* One deterministic trading week. Each lot keeps its original cost and expiry. */
(function (root) {
  'use strict';
  const flowers = ['tulip', 'daisy', 'rose', 'iris', 'carnation'];
  const life = [2, 3, 2, 1, 3];
  const bouquets = {
    morning: { stems: [2, 1, 0, 0, 0], price: 15 },
    letter:  { stems: [0, 1, 2, 0, 0], price: 21 },
    dusk:    { stems: [0, 0, 0, 2, 1], price: 18 },
    ribbon:  { stems: [1, 0, 1, 0, 1], price: 19 }
  };
  // Forecast range and actual footfall are separate. Weather and the two
  // festival market days are reflected in these fixed prices and requests.
  const week = [
    { sky:'sun',    festival:false, prices:[3,2,5,4,3], booked:['morning',1], walk:'morning', range:[1,2], arrivals:1 },
    { sky:'rain',   festival:false, prices:[4,2,5,3,2], booked:['dusk',1],    walk:'letter',  range:[0,1], arrivals:0 },
    { sky:'cloud',  festival:false, prices:[3,2,4,4,2], booked:['letter',1],  walk:'ribbon',  range:[1,2], arrivals:2 },
    { sky:'rain',   festival:false, prices:[2,2,4,3,3], booked:['morning',2], walk:'dusk',    range:[0,1], arrivals:1 },
    { sky:'sun',    festival:false, prices:[3,1,4,4,2], booked:['ribbon',1],  walk:'letter',  range:[1,3], arrivals:2 },
    { sky:'sun',    festival:true,  prices:[4,2,6,4,3], booked:['letter',2],  walk:'ribbon',  range:[2,4], arrivals:3 },
    { sky:'cloud',  festival:true,  prices:[4,2,5,3,2], booked:['dusk',2],    walk:'morning', range:[2,3], arrivals:2 }
  ];
  const capital = 36;
  const empty = () => flowers.map(() => 0);
  const sum = values => values.reduce((total, n) => total + n, 0);
  function start() {
    return { day:0, phase:'buy', cash:capital, stock:[], orders:[], ledger:[],
      opening:capital, spent:0, sales:0 };
  }
  function countStock(state) {
    const counts = empty();
    for (const lot of state.stock) counts[lot.kind] += lot.qty;
    return counts;
  }
  function quote(state, cart) {
    if (state.phase !== 'buy' || !Array.isArray(cart) || cart.length !== flowers.length ||
        !Array.from(cart).every(n => Number.isSafeInteger(n) && n >= 0)) return {error:'invalid'};
    if (cart.filter(Boolean).length > 3) return {error:'maxKinds'};
    const cost = sum(cart.map((n, i) => n * week[state.day].prices[i]));
    return cost > state.cash ? {error:'noCash', cost} : {cost};
  }
  function open(state, cart) {
    const bill = quote(state, cart);
    if (bill.error) return bill.error;
    const d = week[state.day];
    cart.forEach((qty, kind) => {
      if (qty) state.stock.push({kind, qty, cost:d.prices[kind], expires:state.day + life[kind] - 1});
    });
    state.cash -= bill.cost;
    state.spent = bill.cost;
    state.phase = 'sell';
    state.orders = [];
    for (const [source, recipe, count] of [['booked', ...d.booked], ['walk', d.walk, d.arrivals]]) {
      for (let i = 0; i < count; i++) {
        state.orders.push({id:(state.day + 1) + '-' + (state.orders.length + 1), source, recipe, paid:false});
      }
    }
    return null;
  }
  function canMake(state, recipe) {
    const have = countStock(state);
    return bouquets[recipe].stems.every((n, i) => have[i] >= n);
  }
  function serve(state, id) {
    const order = state.orders.find(o => o.id === id);
    if (state.phase !== 'sell' || !order || order.paid) return 'invalid';
    if (!canMake(state, order.recipe)) return 'shortStock';
    const bouquet = bouquets[order.recipe];
    // Lots are appended in day order; for each kind this is earliest expiry first.
    const needed = bouquet.stems.slice();
    for (const lot of state.stock) {
      const taken = Math.min(lot.qty, needed[lot.kind]);
      lot.qty -= taken;
      needed[lot.kind] -= taken;
    }
    state.stock = state.stock.filter(lot => lot.qty);
    order.paid = true;
    state.sales += bouquet.price;
    state.cash += bouquet.price;
    return null;
  }
  function close(state) {
    if (state.phase !== 'sell') return false;
    const wilt = empty();
    let lostCost = 0;
    state.stock = state.stock.filter(lot => {
      if (lot.expires > state.day) return true;
      wilt[lot.kind] += lot.qty;
      lostCost += lot.qty * lot.cost;
      return false;
    });
    state.ledger.push({opening:state.opening, spent:state.spent, sales:state.sales, closing:state.cash,
      served:state.orders.filter(o => o.paid).length, requested:state.orders.length,
      wilt, lostCost, carry:countStock(state)});
    state.phase = 'close';
    return true;
  }
  function next(state) {
    if (state.phase !== 'close') return false;
    if (state.day === week.length - 1) state.phase = 'week';
    else {
      state.day++;
      state.phase = 'buy';
      state.opening = state.cash;
      state.spent = state.sales = 0;
      state.orders = [];
    }
    return true;
  }
  const api = {flowers, life, bouquets, week, capital, empty, sum, start, countStock, quote, open, canMake, serve, close, next};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Florist = api;
})(globalThis);
