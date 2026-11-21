const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame, cards } = require('./engine.js');

function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function flip(game, times) {
  for (let i = 0; i < times; i++) game.flip();
}

test('the ten playable cards come from the same fifteen-card supply each round', () => {
  assert.deepEqual(Object.values(cards).map(card => card.copies), [4, 3, 2, 2, 2, 2]);
  const game = createGame(seeded(30));
  for (let round = 1; round <= 5; round++) {
    const start = game.view();
    assert.equal(start.round, round);
    assert.deepEqual(start.drawn, []);
    assert.equal(start.left, 10);
    assert.equal(Object.values(start.remaining).reduce((sum, n) => sum + n, 0), 10);
    for (const kind of Object.keys(cards)) assert.ok(start.remaining[kind] <= cards[kind].copies);
    game.flip();
    const after = game.view();
    assert.equal(after.left, 9);
    assert.equal(after.remaining[after.drawn[0]], start.remaining[after.drawn[0]] - 1);
    game.bank();
    game.next();
  }
});

test('rockfall, quicksand and snake can coexist with the full pot intact', () => {
  const game = createGame(seeded(1));
  flip(game, 6);
  const state = game.view();
  assert.deepEqual(state.drawn, ['rock', 'coin', 'sand', 'gem', 'coin', 'snake']);
  assert.equal(state.outcome, null);
  assert.equal(state.pot, 11);
});

for (const [seed, trap, lost] of [[1, 'snake', 11], [2, 'rock', 4], [3, 'sand', 10]]) {
  test('a second ' + trap + ' forfeits only the current pot', () => {
    const game = createGame(seeded(seed));
    while (!game.view().outcome) game.flip();
    const state = game.view();
    assert.equal(state.drawn.at(-1), trap);
    assert.equal(state.drawn.filter(kind => kind === trap).length, 2);
    assert.deepEqual(state.outcome, { reason: 'bust', earned: 0, lost });
    assert.equal(state.pot, 0);
    game.flip();
    game.bank();
    assert.deepEqual(game.view(), state);
  });
}

test('a safe last card banks automatically while a repeated last trap still busts', () => {
  const game = createGame(seeded(30));
  flip(game, 9);
  assert.equal(game.view().left, 1);
  assert.equal(game.view().pot, 26);
  game.flip();
  assert.equal(game.view().left, 0);
  assert.equal(game.view().pot, 0);
  assert.equal(game.view().total, 28);
  assert.deepEqual(game.view().outcome, { reason: 'empty', earned: 28, lost: 0 });
  const unsafe = createGame(seeded(5));
  flip(unsafe, 10);
  assert.equal(unsafe.view().left, 0);
  assert.deepEqual(unsafe.view().outcome, { reason: 'bust', earned: 0, lost: 25 });
});

test('five settled rounds preserve prior deposits and produce exactly one final total', () => {
  const game = createGame(seeded(30));
  const plan = [
    { draws: 10, reason: 'empty', earned: 28, lost: 0 },
    { draws: 3, reason: 'bank', earned: 4, lost: 0 },
    { draws: 9, reason: 'bust', earned: 0, lost: 21 },
    { draws: 0, reason: 'bank', earned: 0, lost: 0 },
    { draws: 4, reason: 'bank', earned: 6, lost: 0 }
  ];
  let total = 0;
  for (const [i, { draws, reason, earned, lost }] of plan.entries()) {
    flip(game, draws);
    if (reason === 'bank') game.bank();
    const state = game.view();
    total += earned;
    assert.deepEqual(state.outcome, { reason, earned, lost });
    assert.equal(state.total, total);
    assert.equal(state.complete, i === 4);
    game.next();
  }
  const final = game.view();
  assert.equal(final.total, 38);
  assert.equal(final.round, 5);
  assert.deepEqual(final.rounds.map(result => result.earned), [28, 4, 0, 0, 6]);
  game.bank();
  game.flip();
  game.next();
  assert.deepEqual(game.view(), final);
});
