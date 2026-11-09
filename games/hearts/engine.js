/* Hearts rules. Plain script in the browser, CommonJS for the rule tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HeartsEngine = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const SUITS = ['C', 'D', 'S', 'H'];
  const suit = card => card[0];
  const rank = card => Number(card.slice(1));
  const points = card => suit(card) === 'H' ? 1 : card === 'S12' ? 13 : 0;
  const sort = hand => hand.sort((a, b) => SUITS.indexOf(suit(a)) - SUITS.indexOf(suit(b)) || rank(a) - rank(b));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };

  function random(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let n = value;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }

  function deal(state) {
    const deck = SUITS.flatMap(s => Array.from({ length: 13 }, (_, i) => s + (i + 2)));
    const rng = random((state.seed + Math.imul(state.round, 0x9E3779B9)) >>> 0);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.hands = Array.from({ length: 4 }, (_, p) => sort(deck.slice(p * 13, p * 13 + 13)));
    state.passOffset = [1, 3, 2, 0][(state.round - 1) % 4];
    state.phase = state.passOffset ? 'pass' : 'play';
    state.turn = state.hands.findIndex(hand => hand.includes('C2'));
    state.trick = [];
    state.completed = [];
    state.roundPoints = [0, 0, 0, 0];
    state.broken = false;
    state.received = [];
    state.result = null;
  }

  function create(seed) {
    assert(Number.isInteger(seed) && seed >= 0 && seed <= 0xFFFFFFFF, 'Invalid seed');
    const state = { seed, round: 1, totals: [0, 0, 0, 0], history: [], winners: [] };
    deal(state);
    return state;
  }

  // Passing and computer play inspect only this player's cards and public plays.
  function choosePass(hand) {
    const count = s => hand.filter(c => suit(c) === s).length;
    const risk = card => {
      const s = suit(card), r = rank(card);
      if (s === 'S' && r >= 12) return 70 + r;
      if (s === 'H') return r + 22;
      return r * 2 + (count(s) <= 3 ? 16 : 0);
    };
    return hand.slice().sort((a, b) => risk(b) - risk(a) || rank(b) - rank(a)).slice(0, 3);
  }

  function pass(state, selections) {
    assert(state.phase === 'pass' && Array.isArray(selections) && selections.length === 4, 'Not passing');
    selections.forEach((cards, p) => {
      assert(Array.isArray(cards) && cards.length === 3 && new Set(cards).size === 3 && cards.every(c => state.hands[p].includes(c)), 'Select three cards from each hand');
    });
    const hands = state.hands.map((hand, p) => hand.filter(card => !selections[p].includes(card)));
    selections.forEach((cards, p) => hands[(p + state.passOffset) % 4].push(...cards));
    state.hands = hands.map(sort);
    state.received = selections[(4 - state.passOffset) % 4].slice();
    state.turn = state.hands.findIndex(hand => hand.includes('C2'));
    state.phase = 'play';
  }

  function legalCards(state, player = state.turn) {
    if (state.phase !== 'play' || player !== state.turn) return [];
    const hand = state.hands[player];
    if (state.completed.length === 0 && state.trick.length === 0) return hand.filter(c => c === 'C2');
    if (state.trick.length) {
      const followers = hand.filter(c => suit(c) === suit(state.trick[0].card));
      if (followers.length) return followers;
      if (!state.completed.length) {
        const safe = hand.filter(c => points(c) === 0);
        return safe.length ? safe : hand.slice();
      }
      return hand.slice();
    }
    if (!state.broken) {
      const others = hand.filter(c => suit(c) !== 'H');
      if (others.length) return others;
    }
    return hand.slice();
  }

  function trickWinner(trick) {
    assert(trick.length > 0, 'Empty trick');
    return trick.reduce((best, play) => suit(play.card) === suit(best.card) && rank(play.card) > rank(best.card) ? play : best).player;
  }

  function play(state, player, card) {
    assert(legalCards(state, player).includes(card), 'Illegal card');
    state.hands[player].splice(state.hands[player].indexOf(card), 1);
    state.trick.push({ player, card });
    if (suit(card) === 'H') state.broken = true;
    if (player === 0) state.received = [];
    if (state.trick.length === 4) state.phase = 'collect';
    else state.turn = (player + 1) % 4;
  }

  function scoreRound(raw) {
    assert(raw.length === 4 && raw.every(n => Number.isInteger(n) && n >= 0) && raw.reduce((a, b) => a + b, 0) === 26, 'Invalid round score');
    const moon = raw.indexOf(26);
    return { moon, delta: moon < 0 ? raw.slice() : raw.map((_, i) => i === moon ? 0 : 26) };
  }

  function collect(state) {
    assert(state.phase === 'collect' && state.trick.length === 4, 'Trick is incomplete');
    const winner = trickWinner(state.trick);
    const penalty = state.trick.reduce((n, play) => n + points(play.card), 0);
    state.roundPoints[winner] += penalty;
    state.completed.push({ plays: state.trick, winner, points: penalty });
    state.trick = [];
    state.turn = winner;
    state.phase = 'play';
    if (state.completed.length === 13) {
      const result = scoreRound(state.roundPoints);
      state.totals = state.totals.map((total, p) => total + result.delta[p]);
      state.result = { ...result, raw: state.roundPoints.slice(), totals: state.totals.slice(), round: state.round };
      state.history.push(state.result);
      state.phase = state.totals.some(total => total >= 100) ? 'matchEnd' : 'roundEnd';
      if (state.phase === 'matchEnd') {
        const lowest = Math.min(...state.totals);
        state.winners = [0, 1, 2, 3].filter(p => state.totals[p] === lowest);
      }
    }
  }

  function nextRound(state) {
    assert(state.phase === 'roundEnd', 'Round has not ended');
    state.round++;
    deal(state);
  }

  function choosePlay(state, player = state.turn) {
    const options = legalCards(state, player);
    if (!options.length) return null;
    const hand = state.hands[player];
    const high = cards => cards.slice().sort((a, b) => rank(b) - rank(a))[0];
    const low = cards => cards.slice().sort((a, b) => rank(a) - rank(b))[0];
    if (!state.trick.length) {
      // Low spades can draw out the queen. Never read the other hands.
      const queenSeen = state.completed.some(t => t.plays.some(p => p.card === 'S12'));
      const spades = options.filter(c => suit(c) === 'S' && rank(c) < 12);
      if (!queenSeen && !hand.includes('S12') && spades.length) return low(spades);
      return low(options);
    }
    const led = suit(state.trick[0].card);
    if (suit(options[0]) !== led) {
      return options.slice().sort((a, b) => points(b) - points(a) || rank(b) - rank(a))[0];
    }
    const highest = Math.max(...state.trick.filter(p => suit(p.card) === led).map(p => rank(p.card)));
    const below = options.filter(c => rank(c) < highest);
    if (below.length) return below.includes('S12') ? 'S12' : high(below);
    const safe = options.filter(c => points(c) === 0);
    const penalty = state.trick.reduce((n, p) => n + points(p.card), 0);
    if ((state.trick.length === 3 && penalty === 0 || state.completed.length === 0) && safe.length) return high(safe);
    return low(options);
  }

  function apply(state, action) {
    assert(action && typeof action === 'object', 'Invalid action');
    if (action.type === 'pass') {
      pass(state, state.hands.map((hand, p) => p === 0 ? action.cards : choosePass(hand)));
    } else if (action.type === 'play') play(state, action.player, action.card);
    else if (action.type === 'collect') collect(state);
    else if (action.type === 'next') nextRound(state);
    else throw new Error('Unknown action');
    return state;
  }

  function restore(save) {
    assert(save && save.version === 1 && Array.isArray(save.actions) && save.actions.length <= 20000, 'Invalid save');
    const state = create(save.seed);
    for (const action of save.actions) apply(state, action);
    return state;
  }

  return Object.freeze({ SUITS, suit, rank, points, sort, create, pass, legalCards, play, collect, trickWinner, scoreRound, nextRound, choosePass, choosePlay, apply, restore });
});
