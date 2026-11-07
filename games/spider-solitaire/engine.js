(function (root) {
  'use strict';

  const SUITS = ['♠', '♥', '♣', '♦'];
  const validDifficulty = value => [1, 2, 4].includes(value);
  const clone = state => ({ ...state, columns: state.columns.map(column => column.map(card => ({ ...card }))), stock: state.stock.map(card => ({ ...card })), completed: state.completed.slice() });

  function newGame(difficulty = 1, seed = Date.now() >>> 0) {
    if (!validDifficulty(difficulty) || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new TypeError('Invalid deal');
    let random = seed || 0x6d2b79f5;
    const next = () => {
      random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
      return (random >>> 0) / 4294967296;
    };
    const cards = Array.from({ length: 104 }, (_, id) => ({ id, rank: id % 13 + 1, suit: Math.floor(id / 13) % difficulty, faceUp: false }));
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const columns = Array.from({ length: 10 }, (_, index) => cards.splice(0, index < 4 ? 6 : 5));
    columns.forEach(column => { column[column.length - 1].faceUp = true; });
    return { difficulty, seed, columns, stock: cards, completed: [], moves: 0 };
  }

  function isRun(column, start) {
    if (!Array.isArray(column) || !Number.isInteger(start) || start < 0 || start >= column.length) return false;
    for (let i = start; i < column.length; i++) {
      if (!column[i].faceUp) return false;
      if (i > start && (column[i - 1].rank !== column[i].rank + 1 || column[i - 1].suit !== column[i].suit)) return false;
    }
    return true;
  }

  function canMove(state, from, start, to) {
    if (![from, start, to].every(Number.isInteger) || from === to || from < 0 || from > 9 || to < 0 || to > 9 || won(state)) return false;
    const source = state.columns[from], target = state.columns[to];
    return isRun(source, start) && (!target.length || (target.at(-1).faceUp && target.at(-1).rank === source[start].rank + 1));
  }

  function settle(state) {
    for (const column of state.columns) {
      if (column.length) column.at(-1).faceUp = true;
      while (column.length >= 13 && column.at(-13).rank === 13 && isRun(column, column.length - 13)) {
        state.completed.push(column.at(-1).suit);
        column.splice(-13);
        if (column.length) column.at(-1).faceUp = true;
      }
    }
    return state;
  }

  function move(state, from, start, to) {
    if (!canMove(state, from, start, to)) return null;
    const result = clone(state);
    result.columns[to].push(...result.columns[from].splice(start));
    result.moves++;
    return settle(result);
  }

  function canDeal(state) {
    return !won(state) && state.stock.length >= 10 && state.columns.every(column => column.length > 0);
  }

  function deal(state) {
    if (!canDeal(state)) return null;
    const result = clone(state);
    result.columns.forEach(column => { column.push({ ...result.stock.shift(), faceUp: true }); });
    result.moves++;
    return settle(result);
  }

  function won(state) { return state.completed.length === 8; }
  function score(state) { return 500 - state.moves + 100 * state.completed.length; }

  function hints(state) {
    const results = [];
    state.columns.forEach((column, from) => {
      for (let start = 0; start < column.length; start++) {
        if (!isRun(column, start)) continue;
        state.columns.forEach((target, to) => {
          if (!canMove(state, from, start, to) || (!start && !target.length)) return;
          const reveals = start > 0 && !column[start - 1].faceUp;
          const joins = target.length > 0 && target.at(-1).suit === column[start].suit;
          const splits = start > 0 && column[start - 1].faceUp && column[start - 1].suit === column[start].suit && column[start - 1].rank === column[start].rank + 1;
          const length = column.length - start;
          const complete = joins && target.length + length >= 13 && isRun(target, Math.max(0, target.length - (13 - length))) && target.at(-(13 - length))?.rank === 13;
          const priority = (complete ? 1000 : 0) + (reveals ? 90 : 0) + (joins ? 60 : 0) + (!start ? 25 : 0) + length - (splits ? 80 : 0);
          results.push({ type: 'move', from, start, to, priority });
        });
      }
    });
    return results.sort((a, b) => b.priority - a.priority);
  }

  function apply(state, action) {
    if (!action || typeof action !== 'object') return null;
    if (action.type === 'move') return move(state, action.from, action.start, action.to);
    if (action.type === 'deal') return deal(state);
    return null;
  }

  // Rebuild saves from legal actions, so malformed storage cannot create cards or wins.
  function restore(saved) {
    if (!saved || saved.version !== 1 || !validDifficulty(saved.difficulty) || !Number.isInteger(saved.seed) || saved.seed < 0 || saved.seed > 0xffffffff || !Array.isArray(saved.actions) || saved.actions.length > 10000) return null;
    let state = newGame(saved.difficulty, saved.seed);
    const history = [], actions = [];
    for (const action of saved.actions) {
      const next = apply(state, action);
      if (!next) return null;
      history.push(state);
      actions.push(action.type === 'deal' ? { type: 'deal' } : { type: 'move', from: action.from, start: action.start, to: action.to });
      state = next;
    }
    const elapsed = Number.isFinite(saved.elapsed) && saved.elapsed >= 0 && saved.elapsed < 31536000000 ? saved.elapsed : 0;
    return { state, history, actions, elapsed };
  }

  const api = Object.freeze({ SUITS, newGame, clone, isRun, canMove, move, canDeal, deal, won, score, hints, apply, restore });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpiderEngine = api;
})(typeof window === 'object' ? window : globalThis);
