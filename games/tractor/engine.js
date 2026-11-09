(function (root) {
  'use strict';
  const SUITS = ['s', 'h', 'c', 'd'];
  const face = c => c.s + c.r;
  const points = cards => cards.reduce((n, c) => n + (c.r === 5 ? 5 : c.r === 10 || c.r === 13 ? 10 : 0), 0);
  function deck() {
    const cards = [];
    for (let copy = 0; copy < 2; copy++) {
      for (const s of SUITS) for (let r = 2; r <= 14; r++) cards.push({ id: `${copy}-${s}-${r}`, s, r });
      for (const r of [15, 16]) cards.push({ id: `${copy}-j-${r}`, s: 'j', r });
    }
    return cards;
  }
  function seeded(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const suit = (c, ctx) => c.s === 'j' || c.r === ctx.level || c.s === ctx.trump ? 't' : c.s;
  function rank(c, ctx) {
    if (c.s === 'j') return c.r === 16 ? 16 : 15;
    if (c.r === ctx.level) return ctx.trump && c.s === ctx.trump ? 14 : 13;
    return c.r - 2 - (c.r > ctx.level ? 1 : 0);
  }
  function sort(cards, ctx) {
    return [...cards].sort((a, b) => ['t', ...SUITS].indexOf(suit(a, ctx)) - ['t', ...SUITS].indexOf(suit(b, ctx)) || rank(b, ctx) - rank(a, ctx) || SUITS.indexOf(a.s) - SUITS.indexOf(b.s) || a.id.localeCompare(b.id));
  }
  function pairs(cards, ctx) {
    const map = new Map();
    cards.forEach(c => { if (!map.has(face(c))) map.set(face(c), []); map.get(face(c)).push(c); });
    return [...map.values()].filter(g => g.length === 2).sort((a, b) => rank(a[0], ctx) - rank(b[0], ctx));
  }
  // Effective ranks skip the level card. Equal off-suit level pairs never connect.
  function connected(a, b, ctx) {
    const ra = rank(a, ctx), rb = rank(b, ctx);
    // Ordinary trump A -> off-suit level; in no-trump the level -> small joker.
    return rb === ra + 1 || (suit(a, ctx) === 't' && ra === 11 && rb === 13) || (!ctx.trump && ra === 13 && rb === 15);
  }
  function pattern(cards, ctx) {
    if (!cards.length || cards.some(c => suit(c, ctx) !== suit(cards[0], ctx))) return null;
    if (cards.length === 1) return { type: 'single', n: 1, suit: suit(cards[0], ctx), high: rank(cards[0], ctx) };
    const ps = pairs(cards, ctx);
    if (ps.length * 2 !== cards.length) return null;
    if (ps.length > 1 && !ps.slice(1).every((g, i) => connected(ps[i][0], g[0], ctx))) return null;
    return { type: ps.length === 1 ? 'pair' : 'tractor', n: cards.length, suit: suit(cards[0], ctx), high: rank(ps.at(-1)[0], ctx) };
  }
  const compare = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
  function profile(groups, ctx) {
    const remaining = [...groups], lengths = [];
    while (remaining.length) {
      let best = [];
      for (let start = 0; start < remaining.length; start++) {
        const run = [start];
        for (let i = start + 1; i < remaining.length; i++) if (connected(remaining[run.at(-1)][0], remaining[i][0], ctx)) run.push(i);
        if (run.length > best.length) best = run;
      }
      lengths.push(best.length);
      best.reverse().forEach(i => remaining.splice(i, 1));
    }
    return lengths.sort((a, b) => b - a);
  }
  function combinations(items, n) {
    const result = [];
    function visit(start, selected) {
      if (selected.length === n) { result.push(selected); return; }
      for (let i = start; i <= items.length - (n - selected.length); i++) visit(i + 1, [...selected, items[i]]);
    }
    visit(0, []); return result;
  }
  function bestPairSets(cards, n, ctx) {
    const ps = pairs(cards, ctx), count = Math.min(Math.floor(n / 2), ps.length);
    let best = [], result = [];
    for (const set of combinations(ps, count)) {
      const p = profile(set, ctx), cmp = compare(p, best);
      if (cmp > 0) { best = p; result = [set]; } else if (cmp === 0) result.push(set);
    }
    return { profile: best, sets: result };
  }
  function validate(hand, cards, lead, ctx) {
    if (!cards.length) return 'selectCards';
    if (new Set(cards.map(c => c.id)).size !== cards.length || cards.some(c => !hand.some(h => h.id === c.id && face(h) === face(c)))) return 'invalidCards';
    if (!lead?.length) return pattern(cards, ctx) ? null : 'leadShape';
    if (cards.length !== lead.length) return 'followCount';
    const lp = pattern(lead, ctx), available = hand.filter(c => suit(c, ctx) === lp.suit), following = cards.filter(c => suit(c, ctx) === lp.suit);
    if (following.length !== Math.min(lead.length, available.length)) return 'followSuit';
    if (available.length < lead.length || lp.type === 'single') return null;
    const required = bestPairSets(available, lead.length, ctx).profile;
    if (compare(profile(pairs(following, ctx), ctx), required) < 0) return 'followShape';
    return null;
  }
  function winner(trick, ctx) {
    const lead = pattern(trick[0].cards, ctx);
    let best = 0, bestP = lead;
    for (let i = 1; i < trick.length; i++) {
      const p = pattern(trick[i].cards, ctx);
      if (!p || p.n !== lead.n || p.type !== lead.type || (p.suit !== lead.suit && p.suit !== 't')) continue;
      if ((p.suit === 't' && bestP.suit !== 't') || (p.suit === bestP.suit && p.high > bestP.high)) { best = i; bestP = p; }
    }
    return trick[best].player;
  }
  function create(seed = Math.floor(Math.random() * 4294967296)) {
    return deal({ version: 1, seed, round: 0, dealer: 0, levels: [2, 2], champion: null });
  }
  function deal(previous) {
    if (previous.round && previous.phase !== 'result') throw new Error('Round is still active');
    if (previous.champion !== null) throw new Error('Match is complete');
    const state = { version: 1, seed: (previous.seed + 1) >>> 0, round: previous.round + 1, dealer: previous.dealer, levels: [...previous.levels], champion: null };
    state.level = state.levels[state.dealer % 2];
    const cards = deck(), random = seeded(state.seed);
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    Object.assign(state, { hands: [[], [], [], []], bottom: cards.slice(100), captured: [], trick: [], lastTrick: null, trickNumber: 0, score: 0, trump: null, bid: null, passes: 0, phase: 'bid', turn: state.dealer, result: null, auction: [], revealed: null });
    cards.slice(0, 100).forEach((c, i) => state.hands[i % 4].push(c));
    return state;
  }
  function view(state, player) {
    return { player, hand: state.hands[player].map(c => ({ ...c })), counts: state.hands.map(h => h.length), phase: state.phase, turn: state.turn, dealer: state.dealer, trump: state.trump, level: state.level, bid: state.bid ? { ...state.bid } : null, trick: structuredClone(state.trick), seen: state.captured.map(c => ({ ...c })), score: state.score };
  }
  function bids(v) {
    const result = [], current = v.bid?.strength || 0;
    for (const s of SUITS) {
      const n = v.hand.filter(c => c.s === s && c.r === v.level).length;
      for (const strength of [1, 2]) if (n >= strength && strength > current && (!v.bid || v.bid.player !== v.player || v.bid.suit === s)) result.push({ suit: s, strength });
    }
    for (const r of [15, 16]) if (v.hand.filter(c => c.r === r).length === 2 && r - 12 > current && v.bid?.player !== v.player) result.push({ suit: null, strength: r - 12 });
    return result;
  }
  function bid(state, player, choice) {
    if (state.phase !== 'bid' || state.turn !== player) return 'notTurn';
    if (choice && !bids(view(state, player)).some(b => b.suit === choice.suit && b.strength === choice.strength)) return 'invalidBid';
    state.auction.push({ player, ...(choice || { pass: true }) });
    if (choice) { state.bid = { ...choice, player }; state.passes = 0; }
    else state.passes++;
    if (state.passes >= (state.bid ? 3 : 4)) {
      if (state.round === 1 && state.bid) state.dealer = state.bid.player;
      if (state.bid) state.trump = state.bid.suit;
      else { state.revealed = state.bottom.find(c => c.s !== 'j'); state.trump = state.revealed.s; }
      state.hands[state.dealer].push(...state.bottom); state.bottom = [];
      state.phase = 'bury'; state.turn = state.dealer;
    } else state.turn = (player + 1) % 4;
    return null;
  }
  function bury(state, player, ids) {
    if (state.phase !== 'bury' || player !== state.dealer) return 'notTurn';
    if (ids.length !== 8 || new Set(ids).size !== 8 || ids.some(id => !state.hands[player].some(c => c.id === id))) return 'buryEight';
    state.bottom = state.hands[player].filter(c => ids.includes(c.id));
    state.hands[player] = state.hands[player].filter(c => !ids.includes(c.id));
    state.phase = 'play'; return null;
  }
  function play(state, player, ids) {
    if (state.phase !== 'play' || state.turn !== player) return 'notTurn';
    const hand = state.hands[player], cards = ids.map(id => hand.find(c => c.id === id));
    if (cards.some(c => !c)) return 'invalidCards';
    const error = validate(hand, cards, state.trick[0]?.cards, state);
    if (error) return error;
    state.hands[player] = hand.filter(c => !ids.includes(c.id));
    state.trick.push({ player, cards });
    state.turn = (player + 1) % 4;
    if (state.trick.length === 4) { state.phase = 'collect'; state.turn = winner(state.trick, state); }
    return null;
  }
  function outcome(score, dealer, levels) {
    const held = score < 80, team = held ? dealer % 2 : 1 - dealer % 2;
    const gain = held ? (score === 0 ? 3 : score < 40 ? 2 : 1) : Math.floor((score - 80) / 40);
    const nextLevels = [...levels]; nextLevels[team] = Math.min(15, nextLevels[team] + gain);
    return { held, team, gain, levels: nextLevels, dealer: (dealer + (held ? 2 : 1)) % 4, champion: nextLevels[team] > 14 ? team : null };
  }
  function collect(state) {
    if (state.phase !== 'collect') return 'notTurn';
    const cards = state.trick.flatMap(p => p.cards), won = winner(state.trick, state), value = points(cards);
    if (won % 2 !== state.dealer % 2) state.score += value;
    state.lastTrick = { plays: state.trick, winner: won, points: value };
    state.captured.push(...cards); state.trick = []; state.trickNumber++; state.turn = won;
    if (state.hands[0].length) { state.phase = 'play'; return null; }
    const winCards = state.lastTrick.plays.find(p => p.player === won).cards;
    const bottomMultiplier = won % 2 !== state.dealer % 2 ? (winCards.length === 1 ? 2 : 2 ** (winCards.length / 2 + 1)) : 0;
    const bonus = points(state.bottom) * bottomMultiplier, base = state.score;
    state.score += bonus;
    const next = outcome(state.score, state.dealer, state.levels);
    state.result = { base, bonus, bottomMultiplier, bottomPoints: points(state.bottom), score: state.score, previousDealer: state.dealer, ...next };
    state.levels = next.levels; state.dealer = next.dealer; state.champion = next.champion; state.phase = 'result';
    return null;
  }
  function lowCost(c, v) { return rank(c, v) + points([c]) * 1.8 + (suit(c, v) === 't' ? 35 : 0); }
  function aiBury(v) {
    const ps = new Set(pairs(v.hand, v).flat().map(c => c.id));
    const counts = Object.fromEntries(SUITS.map(s => [s, v.hand.filter(c => suit(c, v) === s).length]));
    return [...v.hand].sort((a, b) => (lowCost(a, v) + (ps.has(a.id) ? 18 : 0) + (counts[suit(a, v)] || 0)) - (lowCost(b, v) + (ps.has(b.id) ? 18 : 0) + (counts[suit(b, v)] || 0))).slice(0, 8).map(c => c.id);
  }
  function aiBid(v) {
    if (v.bid && v.bid.player % 2 === v.player % 2) return null;
    return bids(v).sort((a, b) => {
      const score = x => v.hand.filter(c => c.s === x.suit).length + x.strength * 2;
      return score(b) - score(a);
    })[0] || null;
  }
  function leadOptions(cards, ctx) {
    const options = cards.map(c => [c]);
    for (const s of ['t', ...SUITS]) {
      const ps = pairs(cards.filter(c => suit(c, ctx) === s), ctx); options.push(...ps);
      const walk = (run, start) => {
        if (run.length >= 2) options.push(run.flat());
        for (let i = start; i < ps.length; i++) if (!run.length || connected(run.at(-1)[0], ps[i][0], ctx)) walk([...run, ps[i]], i + 1);
      };
      walk([], 0);
    }
    return options;
  }
  function followOptions(v) {
    const lead = v.trick[0].cards, lp = pattern(lead, v), same = v.hand.filter(c => suit(c, v) === lp.suit), options = [];
    const addFill = (fixed, pool, n) => {
      for (const order of [1, -1]) {
        const remaining = pool.filter(c => !fixed.some(f => f.id === c.id)).sort((a, b) => order * (lowCost(a, v) - lowCost(b, v)));
        options.push([...fixed, ...remaining.slice(0, n - fixed.length)]);
      }
    };
    if (same.length < lead.length) {
      addFill(same, v.hand, lead.length);
      if (!same.length) options.push(...leadOptions(v.hand.filter(c => suit(c, v) === 't'), v).filter(c => c.length === lead.length));
    } else if (lp.type === 'single') options.push(...same.map(c => [c]));
    else for (const set of bestPairSets(same, lead.length, v).sets) addFill(set.flat(), same, lead.length);
    return options.filter(c => !validate(v.hand, c, lead, v));
  }
  function aiPlay(v) {
    const options = v.trick.length ? followOptions(v) : leadOptions(v.hand, v);
    if (!options.length) throw new Error('No legal play');
    const currentWinner = v.trick.length ? winner(v.trick, v) : null;
    const teammateWinning = currentWinner !== null && currentWinner % 2 === v.player % 2;
    const tablePoints = points(v.trick.flatMap(p => p.cards));
    function score(cards) {
      const cost = cards.reduce((n, c) => n + lowCost(c, v), 0), p = pattern(cards, v);
      if (!v.trick.length) {
        const strength = p.high, trump = p.suit === 't';
        return cards.length * 15 + strength * 2 - points(cards) * (strength < 9 ? 2 : 0) - (trump ? 12 : 0);
      }
      const wins = winner([...v.trick, { player: v.player, cards }], v) === v.player;
      if (teammateWinning) return points(cards) * 3 - cost * 0.4 - (wins ? 10 : 0);
      return (wins ? 45 + tablePoints * 4 : 0) - cost * 0.65 - (wins ? 0 : points(cards) * 3);
    }
    options.sort((a, b) => score(b) - score(a));
    return options[0].map(c => c.id);
  }
  function validSave(s) {
    try {
      if (s.version !== 1 || !['bid', 'bury', 'play', 'collect', 'result'].includes(s.phase) || !Number.isInteger(s.round) || s.round < 1 || !Number.isInteger(s.seed)) return false;
      if (s.hands.length !== 4 || s.levels.length !== 2 || s.levels.some(n => !Number.isInteger(n) || n < 2 || n > 15) || ![0, 1, 2, 3].includes(s.turn) || ![0, 1, 2, 3].includes(s.dealer) || !Number.isInteger(s.level) || s.level < 2 || s.level > 14 || ![null, ...SUITS].includes(s.trump)) return false;
      const all = [...s.hands.flat(), ...s.bottom, ...s.captured, ...s.trick.flatMap(p => p.cards)], expected = new Map(deck().map(c => [c.id, face(c)]));
      if (all.length !== 108 || new Set(all.map(c => c.id)).size !== 108 || all.some(c => expected.get(c.id) !== face(c))) return false;
      if (s.phase === 'bid' && (s.bottom.length !== 8 || s.hands.some(h => h.length !== 25))) return false;
      if (s.phase === 'bury' && (s.bottom.length || s.hands.some((h, i) => h.length !== (i === s.dealer ? 33 : 25)))) return false;
      if (['play', 'collect', 'result'].includes(s.phase) && s.bottom.length !== 8) return false;
      if (s.phase === 'collect' && s.trick.length !== 4) return false;
      if (s.phase === 'result' && (!s.result || s.hands.some(h => h.length))) return false;
      return Number.isFinite(s.score) && s.score >= 0;
    } catch { return false; }
  }
  const api = { SUITS, face, points, deck, seeded, suit, rank, sort, pairs, pattern, validate, winner, create, deal, view, bids, bid, bury, play, collect, outcome, aiBury, aiBid, aiPlay, validSave };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Tractor = Object.freeze(api);
})(typeof window === 'undefined' ? globalThis : window);
