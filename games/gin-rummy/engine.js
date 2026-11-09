/* Gin Rummy, North American 25/25 scoring. No DOM or hidden-hand AI access. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GinRummy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const rank = c => c % 13 + 1;
  const suit = c => Math.floor(c / 13);
  const value = c => Math.min(rank(c), 10);
  const points = cards => cards.reduce((sum, c) => sum + value(c), 0);
  const bySuit = (a, b) => suit(a) - suit(b) || rank(a) - rank(b);
  const byRank = (a, b) => rank(a) - rank(b) || suit(a) - suit(b);
  const need = (condition, message) => { if (!condition) throw new Error(message); };

  function meldCandidates(hand) {
    const melds = [];
    const add = cards => melds.push({ cards, mask: cards.reduce((m, c) => m | (1 << hand.indexOf(c)), 0) });
    for (let r = 1; r <= 13; r++) {
      const group = hand.filter(c => rank(c) === r);
      if (group.length >= 3) {
        if (group.length === 4) for (let i = 0; i < 4; i++) add(group.filter((_, j) => j !== i));
        add(group);
      }
    }
    for (let s = 0; s < 4; s++) {
      const group = hand.filter(c => suit(c) === s).sort(byRank);
      for (let start = 0; start < group.length; start++) {
        for (let end = start + 1; end < group.length; end++) {
          if (rank(group[end]) !== rank(group[end - 1]) + 1) break;
          if (end - start >= 2) add(group.slice(start, end + 1));
        }
      }
    }
    return melds;
  }

  // Enumerate disjoint layouts; this also permits a defender to break a meld
  // when laying those cards off yields a better final deadwood count.
  function layouts(hand, visit) {
    const candidates = meldCandidates(hand);
    function search(start, mask, groups) {
      visit({ melds: groups, deadwood: hand.filter((_, i) => !(mask & (1 << i))) });
      for (let i = start; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (!(mask & candidate.mask)) search(i + 1, mask | candidate.mask, [...groups, candidate.cards]);
      }
    }
    search(0, 0, []);
  }

  function analyze(hand) {
    let best;
    layouts(hand, layout => {
      const score = points(layout.deadwood);
      if (!best || score < best.points || (score === best.points && layout.melds.length < best.melds.length)) {
        best = { ...layout, points: score };
      }
    });
    return best;
  }

  function canLayoff(card, meld) {
    if (meld.every(c => rank(c) === rank(meld[0]))) return meld.length < 4 && rank(card) === rank(meld[0]);
    if (suit(card) !== suit(meld[0])) return false;
    const ranks = meld.map(rank);
    return rank(card) === Math.min(...ranks) - 1 || rank(card) === Math.max(...ranks) + 1;
  }

  function layoff(deadwood, melds) {
    let best = { deadwood, layoffs: [], points: points(deadwood) };
    const seen = new Set();
    function search(left, groups, placed) {
      const key = left.slice().sort((a, b) => a - b).join(',') + '|' + groups.map(g => g.slice().sort((a, b) => a - b).join(',')).join(';');
      if (seen.has(key)) return;
      seen.add(key);
      const score = points(left);
      if (score < best.points) best = { deadwood: left, layoffs: placed, points: score };
      left.forEach((c, i) => groups.forEach((group, target) => {
        if (canLayoff(c, group)) search(left.filter((_, j) => i !== j), groups.map((g, j) => j === target ? [...g, c] : g), [...placed, { card: c, target }]);
      }));
    }
    search(deadwood, melds, []);
    return best;
  }

  function defend(hand, melds, allowLayoff = true) {
    if (!allowLayoff) return { ...analyze(hand), layoffs: [] };
    let best;
    layouts(hand, layout => {
      const result = layoff(layout.deadwood, melds);
      if (!best || result.points < best.points || (result.points === best.points && result.layoffs.length < best.layoffs.length)) best = { melds: layout.melds, ...result };
    });
    return best;
  }

  function settle(knockerHand, defenderHand) {
    const knocker = analyze(knockerHand);
    need(knocker.points <= 10, 'Too much deadwood to knock');
    const defender = defend(defenderHand, knocker.melds, knocker.points !== 0);
    const gin = knocker.points === 0;
    const undercut = !gin && defender.points <= knocker.points;
    return {
      kind: gin ? 'gin' : undercut ? 'undercut' : 'knock', knocker, defender,
      winner: undercut ? 1 : 0,
      bonus: gin || undercut ? 25 : 0,
      points: gin ? 25 + defender.points : undercut ? 25 + knocker.points - defender.points : defender.points - knocker.points
    };
  }

  function shuffle(rng) {
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = 51; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function deal(state, rng = Math.random) {
    const deck = shuffle(rng);
    state.hands = [[], []];
    for (let i = 0; i < 20; i++) state.hands[i % 2].push(deck.pop());
    state.discards = [deck.pop()];
    state.stock = deck;
    state.current = 1 - state.dealer;
    state.phase = 'opening';
    state.passes = 0;
    state.forceStock = false;
    state.forbidden = null;
    state.drawn = null;
    state.turns = 0;
    state.result = null;
    state.known = [[], []];
    state.event = { type: 'deal' };
    return state;
  }

  function createGame(rng = Math.random, dealer = Math.floor(rng() * 2)) {
    return deal({ dealer, round: 1, scores: [0, 0], history: [], target: 100 }, rng);
  }

  function pass(state) {
    need(state.phase === 'opening', 'Only the opening card may be passed');
    state.event = { type: 'pass', player: state.current };
    state.current = 1 - state.current;
    state.passes++;
    if (state.passes === 2) { state.phase = 'draw'; state.forceStock = true; }
  }

  function draw(state, source) {
    need(source === 'stock' || source === 'discard', 'Unknown draw source');
    need(state.phase === 'draw' || state.phase === 'opening', 'Not the draw phase');
    need(state.phase !== 'opening' || source === 'discard', 'Offer the opening upcard first');
    need(!state.forceStock || source === 'stock', 'Both players passed: draw from stock');
    need(source !== 'stock' || state.stock.length > 2, 'Stock is exhausted');
    need(source !== 'discard' || state.discards.length > 0, 'No discard available');
    const card = (source === 'stock' ? state.stock : state.discards).pop();
    state.hands[state.current].push(card);
    if (source === 'discard') state.known[state.current].push(card);
    state.forbidden = source === 'discard' ? card : null;
    state.drawn = card;
    state.forceStock = false;
    state.phase = 'discard';
    state.event = { type: source === 'stock' ? 'stock' : 'pickup', player: state.current, card: source === 'discard' ? card : null };
    return card;
  }

  function endRound(state, result) {
    state.result = result;
    if (result.winner !== null) state.scores[result.winner] += result.points;
    state.history.push({ round: state.round, kind: result.kind, winner: result.winner, points: result.points, scores: [...state.scores] });
    state.phase = Math.max(...state.scores) >= state.target ? 'matchOver' : 'roundOver';
    state.event = { type: 'end' };
  }

  function discard(state, card, knock = false) {
    need(state.phase === 'discard', 'Draw before discarding');
    need(card !== state.forbidden, 'Cannot immediately return a picked-up discard');
    const hand = state.hands[state.current];
    need(hand.includes(card), 'Card is not in hand');
    const remaining = hand.filter(c => c !== card);
    need(!knock || analyze(remaining).points <= 10, 'Too much deadwood to knock');
    const player = state.current;
    state.hands[player] = remaining;
    state.known[player] = state.known[player].filter(c => c !== card);
    state.discards.push(card);
    state.forbidden = null;
    state.drawn = null;
    state.turns++;
    state.event = { type: 'discard', player, card };
    if (knock) {
      const result = settle(remaining, state.hands[1 - player]);
      result.winner = result.winner === 0 ? player : 1 - player;
      result.knockerIndex = player;
      endRound(state, result);
    } else if (state.stock.length <= 2) {
      endRound(state, { kind: 'draw', winner: null, points: 0, bonus: 0 });
    } else {
      state.current = 1 - player;
      state.phase = 'draw';
    }
  }

  function nextRound(state, rng = Math.random) {
    need(state.phase === 'roundOver', 'Round is not ready to advance');
    if (state.result.kind !== 'draw') state.dealer = 1 - state.dealer;
    state.round++;
    return deal(state, rng);
  }

  function potential(cards, unavailable) {
    let total = 0;
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      if (rank(a) === rank(b)) {
        const outs = [0, 1, 2, 3].map(s => s * 13 + rank(a) - 1).filter(c => c !== a && c !== b && !unavailable.includes(c));
        total += outs.length * 2;
      } else if (suit(a) === suit(b)) {
        const distance = Math.abs(rank(a) - rank(b));
        if (distance === 1) total += 3;
        if (distance === 2 && !unavailable.includes((a + b) / 2)) total += 1.5;
      }
    }
    return total;
  }

  // Only own cards and publicly seen cards are accepted by this strategy.
  function bestDiscard(hand, forbidden = null, publicInfo = {}) {
    const unavailable = publicInfo.discards || [];
    const opponentKnown = publicInfo.opponentKnown || [];
    let best;
    for (const card of hand) {
      if (card === forbidden) continue;
      const analysis = analyze(hand.filter(c => c !== card));
      const risk = opponentKnown.reduce((n, c) => n + (rank(c) === rank(card) || (suit(c) === suit(card) && Math.abs(rank(c) - rank(card)) <= 2) ? 3 : 0), 0);
      const cost = analysis.points * 5 - potential(analysis.deadwood, unavailable) + risk;
      if (!best || cost < best.cost || (cost === best.cost && value(card) > value(best.card))) best = { card, analysis, cost };
    }
    return best;
  }

  function wantsUpcard(hand, upcard, info = {}) {
    if (upcard === undefined) return false;
    const before = analyze(hand);
    const after = bestDiscard([...hand, upcard], upcard, info);
    return after.analysis.points < before.points || (after.analysis.points === before.points && potential(after.analysis.deadwood, info.discards || []) > potential(before.deadwood, info.discards || []));
  }

  function chooseAction(state) {
    const hand = state.hands[state.current];
    const info = { discards: state.discards, opponentKnown: state.known[1 - state.current] };
    if (state.phase === 'opening') return wantsUpcard(hand, state.discards.at(-1), info) ? { type: 'draw', source: 'discard' } : { type: 'pass' };
    if (state.phase === 'draw') return { type: 'draw', source: !state.forceStock && wantsUpcard(hand, state.discards.at(-1), info) ? 'discard' : 'stock' };
    if (state.phase === 'discard') {
      const choice = bestDiscard(hand, state.forbidden, info);
      // Always take a legal knock. No inspection of the opponent's private hand.
      return { type: 'discard', card: choice.card, knock: choice.analysis.points <= 10 };
    }
    return null;
  }

  function act(state, action) {
    if (action.type === 'pass') pass(state);
    else if (action.type === 'draw') draw(state, action.source);
    else if (action.type === 'discard') discard(state, action.card, action.knock);
    else throw new Error('Unknown action');
  }

  return Object.freeze({ rank, suit, value, points, bySuit, byRank, meldCandidates, analyze, canLayoff, layoff, defend, settle, createGame, pass, draw, discard, nextRound, bestDiscard, wantsUpcard, chooseAction, act });
});
