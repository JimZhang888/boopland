'use strict';

const Auction = (() => {
  const step = 4;
  const initialFunds = [120, 86, 94];
  // Each archive starts with a standard example. The second sale shares this lot's maker clue.
  const lots = [
    { id: 'camera', type: 'optics', base: 40, opening: 20, changes: [16, 4, -8], tint: '#d6decd' },
    { id: 'teapot', type: 'ceramics', base: 36, opening: 16, changes: [12, -4, -12], tint: '#d9dfcf' },
    { id: 'map', type: 'paper', base: 32, opening: 24, changes: [12, -4, 4], tint: '#e4dbc5' },
    { id: 'binoculars', type: 'optics', base: 48, opening: 16, changes: [12, -8, -12], tint: '#dddcc7' },
    { id: 'bowl', type: 'ceramics', base: 40, opening: 20, changes: [16, 4, -8], tint: '#cfddd5' },
    { id: 'book', type: 'paper', base: 44, opening: 24, changes: [20, -8, 4], tint: '#ded6c6' }
  ];
  const premiums = [
    { optics: 12, ceramics: -12, paper: -12 },
    { optics: -8, ceramics: 16, paper: -16 }
  ];
  const valueOf = lot => lot.changes.reduce((sum, amount) => sum + amount, lot.base);
  const fresh = () => ({
    phase: 'inspect', index: 0, funds: initialFunds.slice(), sales: [],
    active: [true, true, true], leader: null, price: 0, turn: 0, events: []
  });
  const nextPrice = s => s.leader === null ? lots[s.index].opening : s.price + step;
  function start(s) {
    if (s.phase !== 'inspect') return;
    Object.assign(s, { phase: 'bid', active: [true, true, true], leader: null, price: 0, turn: 0, events: [] });
  }
  function settle(s) {
    if (s.phase !== 'bid') return;
    if (s.leader !== null) s.funds[s.leader] -= s.price;
    s.sales.push({ index: s.index, buyer: s.leader, price: s.price, value: valueOf(lots[s.index]), events: s.events.slice() });
    s.phase = 'reveal';
    s.turn = null;
  }
  function act(s, actor, action) {
    if (s.phase !== 'bid' || s.turn !== actor || !s.active[actor] || s.leader === actor) return false;
    if (action === 'raise') {
      const price = nextPrice(s);
      if (price > s.funds[actor]) return false;
      s.leader = actor;
      s.price = price;
      s.events.push({ actor, price });
    } else if (action === 'pass') {
      s.active[actor] = false;
      s.events.push({ actor, price: null });
    } else return false;
    for (let offset = 1; offset <= 3; offset++) {
      const candidate = (actor + offset) % 3;
      if (s.active[candidate] && s.leader !== candidate) {
        s.turn = candidate;
        return true;
      }
    }
    settle(s);
    return true;
  }
  function computer(s) {
    if (s.phase !== 'bid' || s.turn === 0) return false;
    const actor = s.turn;
    const lot = lots[s.index];
    const limit = Math.min(s.funds[actor], lot.base + premiums[actor - 1][lot.type]);
    return act(s, actor, nextPrice(s) <= limit ? 'raise' : 'pass');
  }
  function next(s) {
    if (s.phase !== 'reveal') return;
    if (s.index + 1 === lots.length) s.phase = 'summary';
    else {
      s.index++;
      s.phase = 'inspect';
      s.events = [];
    }
  }
  function ledger(s) {
    const bought = s.sales.filter(sale => sale.buyer === 0);
    const spent = bought.reduce((sum, sale) => sum + sale.price, 0);
    const value = bought.reduce((sum, sale) => sum + sale.value, 0);
    return { count: bought.length, value, spent, profit: value - spent };
  }
  return { lots, initialFunds, step, valueOf, fresh, start, nextPrice, act, computer, next, ledger };
})();
