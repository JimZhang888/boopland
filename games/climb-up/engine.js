/* Three-player climbing cards. Plain script for file://; CommonJS for rule checks. */
(function (root) {
  'use strict';
  const sort = cards => [...cards].sort((a, b) => a.rank - b.rank || a.suit - b.suit);
  function deck() {
    const cards = [];
    for (let rank = 3; rank <= 15; rank++) for (let suit = 0; suit < 4; suit++) cards.push({ id: `${rank}-${suit}`, rank, suit });
    return [...cards, { id: '16-4', rank: 16, suit: 4 }, { id: '17-4', rank: 17, suit: 4 }];
  }
  function groups(cards) {
    const result = new Map();
    for (const card of sort(cards)) {
      if (!result.has(card.rank)) result.set(card.rank, []);
      result.get(card.rank).push(card);
    }
    return result;
  }
  function classify(cards) {
    if (!cards.length || new Set(cards.map(c => c.id)).size !== cards.length) return null;
    const entries = [...groups(cards)], n = cards.length;
    const result = (type, rank) => ({ type, rank, size: n });
    if (n === 2 && entries.length === 2 && entries[0][0] === 16 && entries[1][0] === 17) return result('rocket', 17);
    if (entries.length === 1) return n <= 4 ? result(['', 'single', 'pair', 'triple', 'bomb'][n], entries[0][0]) : null;
    const triple = entries.find(([, group]) => group.length === 3);
    if (triple && entries.length === 2 && (n === 4 || n === 5)) return result(n === 4 ? 'tripleSingle' : 'triplePair', triple[0]);
    const consecutive = entries.at(-1)[0] <= 14 && entries.every(([rank], i) => rank === entries[0][0] + i);
    if (!consecutive) return null;
    if (n >= 5 && entries.every(([, g]) => g.length === 1)) return result('straight', entries.at(-1)[0]);
    if (entries.length >= 3 && entries.every(([, g]) => g.length === 2)) return result('pairRun', entries.at(-1)[0]);
    if (entries.length >= 2 && entries.every(([, g]) => g.length === 3)) return result('plane', entries.at(-1)[0]);
    return null;
  }
  function beats(play, target) {
    if (!play) return false;
    if (!target) return true;
    if (target.type === 'rocket') return false;
    if (play.type === 'rocket') return true;
    if (play.type === 'bomb' && target.type !== 'bomb') return true;
    return play.type === target.type && play.size === target.size && play.rank > target.rank;
  }
  function moves(hand, target = null, mustOpen = false) {
    const g = [...groups(hand)], result = [], seen = new Set();
    function add(cards) {
      const shape = classify(cards);
      if (!beats(shape, target) || (mustOpen && !cards.some(c => c.id === '3-0'))) return;
      const id = sort(cards).map(c => c.id).join(',');
      if (!seen.has(id)) { seen.add(id); result.push({ cards: sort(cards), ...shape }); }
    }
    for (const [, cards] of g) {
      for (let n = 1; n <= cards.length; n++) add(cards.slice(0, n));
      if (cards.length >= 3) for (const [rank, side] of g) if (rank !== cards[0].rank) {
        add([...cards.slice(0, 3), side[0]]);
        if (side.length >= 2) add([...cards.slice(0, 3), ...side.slice(0, 2)]);
      }
    }
    const jokers = hand.filter(c => c.rank >= 16);
    if (jokers.length === 2) add(jokers);
    for (const width of [1, 2, 3]) for (let start = 3; start <= 14; start++) {
      const run = [];
      for (let rank = start; rank <= 14; rank++) {
        const group = g.find(([r]) => r === rank)?.[1];
        if (!group || group.length < width) break;
        run.push(...group.slice(0, width));
        if (run.length / width >= (width === 1 ? 5 : width === 2 ? 3 : 2)) add([...run]);
      }
    }
    return result;
  }
  function create(random = Math.random) {
    const cards = deck();
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    const hands = [0, 1, 2].map(i => sort(cards.slice(i * 18, i * 18 + 18)));
    return { hands, turn: hands.findIndex(h => h.some(c => c.id === '3-0')), target: null, owner: null, passed: [], finished: [], played: [], opening: true, over: false, lastAction: null, tricks: 1 };
  }
  function next(state, player) {
    for (let i = 1; i <= 3; i++) { const seat = (player + i) % 3; if (state.hands[seat].length) return seat; }
    return player;
  }
  function legal(state, ids) {
    if (state.over) return 'over';
    if (!ids.length) return state.target ? null : 'mustLead';
    if (new Set(ids).size !== ids.length) return 'invalid';
    const cards = ids.map(id => state.hands[state.turn].find(c => c.id === id));
    if (cards.some(c => !c)) return 'invalid';
    const shape = classify(cards);
    if (!shape) return 'invalid';
    if (state.opening && !ids.includes('3-0')) return 'opening';
    if (!beats(shape, state.target)) return 'tooSmall';
    return null;
  }
  function act(state, ids) {
    const error = legal(state, ids);
    if (error) return { ok: false, error };
    const player = state.turn;
    if (!ids.length) {
      state.passed.push(player);
      state.lastAction = { player, pass: true, cards: [] };
      const responders = state.hands.reduce((n, hand, i) => n + (hand.length > 0 && i !== state.owner ? 1 : 0), 0);
      if (state.passed.length >= responders) {
        state.turn = state.hands[state.owner].length ? state.owner : next(state, state.owner);
        state.target = null; state.owner = null; state.passed = []; state.tricks++;
      } else state.turn = next(state, player);
    } else {
      const cards = state.hands[player].filter(c => ids.includes(c.id));
      state.hands[player] = state.hands[player].filter(c => !ids.includes(c.id));
      state.played.push(...cards);
      state.target = { ...classify(cards), cards };
      state.owner = player; state.passed = []; state.opening = false;
      state.lastAction = { player, pass: false, cards, type: state.target.type };
      if (!state.hands[player].length) state.finished.push(player);
      if (state.finished.length === 2) {
        state.finished.push(next(state, player)); state.over = true;
      } else state.turn = next(state, player);
    }
    return { ok: true };
  }
  function suggestions(state) {
    if (state.over) return [];
    const hand = state.hands[state.turn], g = groups(hand);
    const options = moves(hand, state.target, state.opening);
    // Only our hand and public hand sizes inform this heuristic.
    const urgent = state.hands.some((h, i) => i !== state.turn && h.length > 0 && h.length <= 2);
    function cost(move) {
      if (move.cards.length === hand.length) return -10000;
      let score = move.rank * .45 - move.size * (state.target ? 1 : 4);
      if (move.type === 'bomb' || move.type === 'rocket') score += 30;
      for (const [rank, cards] of groups(move.cards)) {
        const count = g.get(rank).length;
        if (count === 4 && cards.length < 4) score += 22;
        else if (count > cards.length) score += 2.5 * (count - cards.length);
      }
      if (urgent && state.target?.type === 'single') score -= move.rank * 1.1;
      return score;
    }
    return options.sort((a, b) => cost(a) - cost(b) || a.rank - b.rank);
  }
  const api = Object.freeze({ deck, sort, classify, beats, moves, create, legal, act, suggestions });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ClimbUp = api;
})(typeof window === 'undefined' ? globalThis : window);
