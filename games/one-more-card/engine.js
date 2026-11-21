(() => {
  'use strict';

  const cards = Object.freeze({
    coin: { copies: 4, points: 2 },
    vase: { copies: 3, points: 4 },
    gem: { copies: 2, points: 7 },
    snake: { copies: 2, points: 0 },
    rock: { copies: 2, points: 0 },
    sand: { copies: 2, points: 0 }
  });
  const kinds = Object.keys(cards);
  const roundLimit = 5;
  const dealSize = 10;

  function deal(random) {
    const pile = kinds.flatMap(kind => Array(cards[kind].copies).fill(kind));
    for (let end = pile.length - 1; end > 0; end--) {
      const pick = Math.floor(random() * (end + 1));
      [pile[end], pile[pick]] = [pile[pick], pile[end]];
    }
    return pile.slice(0, dealSize);
  }

  function createGame(random = Math.random) {
    let pile, drawn, pot, outcome;
    const rounds = [];

    function startRound() {
      pile = deal(random);
      drawn = [];
      pot = 0;
      outcome = null;
    }

    function finish(reason) {
      const earned = reason === 'bust' ? 0 : pot;
      outcome = { reason, earned, lost: pot - earned };
      rounds.push(outcome);
      pot = 0;
    }

    function flip() {
      if (outcome) return;
      const kind = pile.shift();
      const repeated = !cards[kind].points && drawn.includes(kind);
      drawn.push(kind);
      pot += cards[kind].points;
      if (repeated) finish('bust');
      else if (!pile.length) finish('empty');
    }

    function bank() {
      if (!outcome) finish('bank');
    }

    function next() {
      if (outcome && rounds.length < roundLimit) startRound();
    }

    function view() {
      const remaining = Object.fromEntries(kinds.map(kind => [kind, 0]));
      for (const kind of pile) remaining[kind]++;
      return {
        round: rounds.length + (outcome ? 0 : 1),
        total: rounds.reduce((sum, row) => sum + row.earned, 0),
        pot, left: pile.length, remaining, drawn: drawn.slice(),
        rounds: rounds.map(row => ({ ...row })),
        outcome: outcome && { ...outcome },
        complete: rounds.length === roundLimit
      };
    }

    startRound();
    return { flip, bank, next, view };
  }

  const api = { cards, createGame };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.OneMoreCard = api;
})();
