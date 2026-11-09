(function (root) {
  'use strict';
  const rank = id => id < 52 ? Math.floor(id / 4) + 3 : id - 36;
  const sort = cards => cards.slice().sort((a, b) => rank(b) - rank(a) || a - b);
  const validCards = cards => Array.isArray(cards) && cards.length > 0 && cards.length <= 20 && new Set(cards).size === cards.length && cards.every(id => Number.isInteger(id) && id >= 0 && id < 54);
  function groups(cards) {
    const map = new Map();
    for (const id of cards) { const r = rank(id); if (!map.has(r)) map.set(r, []); map.get(r).push(id); }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }
  const consecutive = ranks => ranks.at(-1) < 15 && ranks.every((r, i) => !i || r === ranks[i - 1] + 1);
  function classify(cards) {
    if (!validCards(cards)) return null;
    const g = groups(cards), n = cards.length, ranks = g.map(([r]) => r);
    const make = (type, main, chain = 1) => ({ type, main, chain, size: n });
    if (n === 1) return make('single', ranks[0]);
    if (n === 2 && ranks[0] === 16 && ranks[1] === 17) return make('rocket', 17);
    if (g.length === 1) return make(n === 2 ? 'pair' : n === 3 ? 'triple' : 'bomb', ranks[0]);
    const triple = g.find(([, ids]) => ids.length === 3);
    if (n === 4 && triple) return make('tripleSingle', triple[0]);
    if (n === 5 && triple && g.length === 2) return make('triplePair', triple[0]);
    if (n >= 5 && g.every(([, ids]) => ids.length === 1) && consecutive(ranks)) return make('straight', ranks.at(-1), n);
    if (n >= 6 && n % 2 === 0 && g.every(([, ids]) => ids.length === 2) && consecutive(ranks)) return make('pairRun', ranks.at(-1), n / 2);
    if (n >= 6 && n % 3 === 0 && g.every(([, ids]) => ids.length === 3) && consecutive(ranks)) return make('airplane', ranks.at(-1), n / 3);
    const four = g.find(([, ids]) => ids.length === 4);
    if (n === 6 && four) return make('fourSingle', four[0]);
    if (n === 8 && four && g.length === 3 && g.filter(([r]) => r !== four[0]).every(([, ids]) => ids.length === 2)) return make('fourPair', four[0]);
    // Wings cannot reuse a body rank; single wings may form pairs, but not triples.
    for (const [unit, type] of [[4, 'airplaneSingle'], [5, 'airplanePair']]) {
      const length = n / unit;
      if (!Number.isInteger(length) || length < 2) continue;
      for (let high = 14; high >= length + 2; high--) {
        const core = g.filter(([r, ids]) => r > high - length && r <= high && ids.length === 3);
        if (core.length !== length) continue;
        const wings = g.filter(([r]) => r <= high - length || r > high);
        if (unit === 4 && wings.every(([, ids]) => ids.length <= 2)) return make(type, high, length);
        if (unit === 5 && wings.length === length && wings.every(([, ids]) => ids.length === 2)) return make(type, high, length);
      }
    }
    return null;
  }
  function beats(play, previous) {
    if (!play) return false;
    if (!previous) return true;
    if (previous.type === 'rocket') return false;
    if (play.type === 'rocket') return true;
    if (play.type === 'bomb' && previous.type !== 'bomb') return true;
    return play.type === previous.type && play.size === previous.size && play.chain === previous.chain && play.main > previous.main;
  }
  function combinations(items, amount, visit, start = 0, chosen = []) {
    if (!amount) { visit(chosen); return; }
    for (let i = start; i <= items.length - amount; i++) combinations(items, amount - 1, visit, i + 1, [...chosen, items[i]]);
  }
  function moves(hand, previous = null) {
    const g = groups(hand), map = new Map(g), result = [], seen = new Set();
    const add = cards => {
      const shape = classify(cards);
      if (!beats(shape, previous)) return;
      const key = groups(cards).map(([r, ids]) => `${r}:${ids.length}`).join(',');
      if (seen.has(key)) return;
      seen.add(key); result.push({ cards: sort(cards), ...shape });
    };
    const wings = (core, count, paired) => {
      const excluded = new Set(core.map(rank));
      const rest = g.filter(([r]) => !excluded.has(r));
      if (paired) combinations(rest.filter(([, ids]) => ids.length >= 2), count, choice => add([...core, ...choice.flatMap(([, ids]) => ids.slice(0, 2))]));
      else {
        const choose = (index, left, picked) => {
          if (!left) { add([...core, ...picked]); return; }
          if (index === rest.length) return;
          const ids = rest[index][1];
          for (let take = 0; take <= Math.min(2, ids.length, left); take++) choose(index + 1, left - take, [...picked, ...ids.slice(0, take)]);
        };
        choose(0, count, []);
      }
    };
    for (const [r, ids] of g) {
      for (let amount = 1; amount <= ids.length; amount++) add(ids.slice(0, amount));
      if (ids.length >= 3) {
        for (const [other, more] of g) if (r !== other) {
          add([...ids.slice(0, 3), more[0]]);
          if (more.length >= 2) add([...ids.slice(0, 3), ...more.slice(0, 2)]);
        }
      }
      if (ids.length === 4) { wings(ids, 2, false); wings(ids, 2, true); }
    }
    if (map.has(16) && map.has(17)) add([52, 53]);
    for (const [copies, min] of [[1, 5], [2, 3], [3, 2]]) {
      for (let low = 3; low <= 14; low++) {
        const core = [];
        for (let high = low; high <= 14 && (map.get(high)?.length || 0) >= copies; high++) {
          core.push(...map.get(high).slice(0, copies));
          const length = high - low + 1;
          if (length < min) continue;
          add(core);
          if (copies === 3) { wings(core, length, false); wings(core, length, true); }
        }
      }
    }
    return result;
  }
  function newGame(seed = Date.now() >>> 0, first = seed % 3) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff || !Number.isInteger(first) || first < 0 || first > 2) throw new TypeError('Invalid deal');
    let random = seed || 0x6d2b79f5;
    const deck = Array.from({ length: 54 }, (_, id) => id);
    for (let i = 53; i > 0; i--) {
      random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
      const j = Math.floor((random >>> 0) / 4294967296 * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return { seed, first, phase: 'bidding', hands: [sort(deck.slice(0, 17)), sort(deck.slice(17, 34)), sort(deck.slice(34, 51))], bottom: deck.slice(51), played: [], turn: first, landlord: null, highBid: 0, bidder: null, bids: [null, null, null], bidCount: 0, trick: null, passes: 0, bombs: 0, playCounts: [0, 0, 0], last: [null, null, null], winner: null, spring: false, scores: null, history: [] };
  }
  function bid(state, player, value) {
    if (state.phase !== 'bidding' || player !== state.turn || !Number.isInteger(value) || value < 0 || value > 3 || (value && value <= state.highBid)) return false;
    state.bids[player] = value; state.bidCount++; state.last[player] = { bid: value };
    state.history.push({ kind: 'bid', player, value });
    if (value) { state.highBid = value; state.bidder = player; }
    if (value === 3 || state.bidCount === 3) {
      if (!state.highBid) { state.phase = 'redeal'; return true; }
      state.landlord = state.bidder;
      state.hands[state.landlord] = sort([...state.hands[state.landlord], ...state.bottom]);
      state.turn = state.landlord; state.phase = 'playing'; state.last = [null, null, null];
    } else state.turn = (player + 1) % 3;
    return true;
  }
  function play(state, player, cards) {
    if (state.phase !== 'playing' || player !== state.turn || !Array.isArray(cards)) return false;
    if (!cards.length) {
      if (!state.trick || state.trick.player === player) return false;
      state.last[player] = { pass: true }; state.passes++;
      state.history.push({ kind: 'play', player, cards: [] });
      state.turn = (player + 1) % 3;
      if (state.passes === 2) { state.turn = state.trick.player; state.trick = null; state.passes = 0; state.last = [null, null, null]; }
      return true;
    }
    const shape = classify(cards);
    if (!beats(shape, state.trick) || !cards.every(id => state.hands[player].includes(id))) return false;
    state.hands[player] = state.hands[player].filter(id => !cards.includes(id));
    state.played.push(...cards); state.playCounts[player]++;
    state.trick = { ...shape, cards: sort(cards), player }; state.last[player] = state.trick;
    state.passes = 0;
    if (shape.type === 'bomb' || shape.type === 'rocket') state.bombs++;
    state.history.push({ kind: 'play', player, cards: cards.slice() });
    if (!state.hands[player].length) {
      state.phase = 'finished'; state.winner = player;
      const landlordWon = player === state.landlord;
      state.spring = landlordWon ? state.playCounts.every((count, i) => i === state.landlord || count === 0) : state.playCounts[state.landlord] === 1;
      const unit = state.highBid * 2 ** (state.bombs + Number(state.spring));
      state.scores = state.hands.map((_, i) => (i === state.landlord ? 2 : -1) * (landlordWon ? 1 : -1) * unit);
    } else state.turn = (player + 1) % 3;
    return true;
  }
  function suggestBid(hand, highBid) {
    const strength = groups(hand).reduce((sum, [r, ids]) => sum + (ids.length === 4 ? 4 : ids.length === 3 ? 1 : 0) + (r === 17 ? 3.2 : r === 16 ? 2 : r === 15 ? ids.length * 1.4 : 0), 0);
    const target = strength >= 9 ? 3 : strength >= 6 ? 2 : strength >= 3.5 ? 1 : 0;
    return target > highBid ? target : 0;
  }
  function orderedMoves(hand, previous = null, urgent = false) {
    const original = new Map(groups(hand));
    const weight = move => {
      if (move.cards.length === hand.length) return -10000;
      let cost = -move.cards.length * 7 + move.main * .45;
      if (move.type === 'bomb' || move.type === 'rocket') cost += previous ? 45 : 65;
      for (const [r, ids] of groups(move.cards)) {
        const count = original.get(r).length;
        if (count === 4 && ids.length < 4) cost += 24;
        else if (count > ids.length) cost += (count - ids.length) * 3;
        if (r >= 15) cost += ids.length * 4;
      }
      if (urgent && move.type === 'single') cost -= move.main * 3;
      return cost;
    };
    return moves(hand, previous).sort((a, b) => weight(a) - weight(b) || a.main - b.main);
  }
  // The policy uses its own cards, public roles, played cards and hand counts only.
  function chooseMove(state, player = state.turn) {
    if (state.phase !== 'playing' || player !== state.turn) return null;
    const hand = state.hands[player];
    const opponents = state.hands.map((cards, i) => ({ i, count: cards.length })).filter(({ i }) => i !== player && (player === state.landlord || i === state.landlord));
    const urgent = opponents.some(({ count }) => count <= 2);
    const available = orderedMoves(hand, state.trick, urgent);
    if (!available.length) return [];
    if (available[0].cards.length === hand.length) return available[0].cards;
    if (state.trick && player !== state.landlord && state.trick.player !== state.landlord) return [];
    return available[0].cards;
  }
  function restore(saved) {
    if (!saved || saved.version !== 1 || !Number.isInteger(saved.seed) || !Number.isInteger(saved.first) || !Array.isArray(saved.history) || saved.history.length > 500) return null;
    try {
      const state = newGame(saved.seed, saved.first);
      for (const step of saved.history) {
        if (!step || !(step.kind === 'bid' ? bid(state, step.player, step.value) : step.kind === 'play' && play(state, step.player, step.cards))) return null;
      }
      return state;
    } catch { return null; }
  }
  const api = Object.freeze({ rank, sort, groups, classify, beats, moves, newGame, bid, play, suggestBid, orderedMoves, chooseMove, restore });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Doudizhu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
