const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');

const fixture = (hand, trick = [], completed = 1) => ({
  phase: 'play', turn: 0, hands: [hand, [], [], []], trick,
  completed: Array.from({ length: completed }, () => ({ plays: [] })), broken: false, received: []
});
const play = (player, card) => ({ player, card });
function checkDeck(state) {
  const all = [...state.hands.flat(), ...state.trick.map(p => p.card), ...state.completed.flatMap(t => t.plays.map(p => p.card))];
  assert.equal(all.length, 52);
  assert.equal(new Set(all).size, 52);
  assert.equal(state.roundPoints.reduce((a, b) => a + b, 0), state.completed.reduce((n, t) => n + t.points, 0));
}
function advance(state, actions) {
  let action;
  if (state.phase === 'pass') action = { type: 'pass', cards: E.choosePass(state.hands[0]) };
  else if (state.phase === 'play') action = { type: 'play', player: state.turn, card: E.choosePlay(state) };
  else if (state.phase === 'collect') action = { type: 'collect' };
  else if (state.phase === 'roundEnd') action = { type: 'next' };
  else throw new Error('Already finished');
  E.apply(state, action); actions?.push(action);
}

test('deal contains 52 unique cards, 13 per player, and is reproducible', () => {
  for (let seed = 0; seed < 100; seed++) {
    const state = E.create(seed);
    checkDeck(state);
    assert.deepEqual(state.hands.map(h => h.length), [13, 13, 13, 13]);
    assert.deepEqual(state, E.create(seed));
  }
  assert.notDeepEqual(E.create(1).hands, E.create(2).hands);
});

test('all four pass directions and simultaneous exchange preserve ownership', () => {
  const state = E.create(81);
  for (const offset of [1, 3, 2, 0]) {
    assert.equal(state.passOffset, offset);
    if (offset) {
      const original = structuredClone(state.hands);
      const chosen = original.map(h => h.slice(0, 3));
      E.pass(state, chosen);
      chosen.forEach((cards, p) => cards.forEach(c => {
        assert.ok(state.hands[(p + offset) % 4].includes(c));
        assert.ok(!state.hands[p].includes(c));
      }));
      assert.deepEqual(state.hands.map(h => h.length), [13, 13, 13, 13]);
      assert.deepEqual(E.legalCards(state), ['C2']);
    } else assert.equal(state.phase, 'play');
    checkDeck(state);
    while (state.phase === 'play' || state.phase === 'collect') advance(state);
    E.nextRound(state);
  }
  assert.equal(state.passOffset, 1);
});

test('invalid passing is atomic; duplicate cards and non-owned cards are rejected', () => {
  const state = E.create(2), before = structuredClone(state);
  const chosen = state.hands.map(E.choosePass);
  chosen[0] = [chosen[0][0], chosen[0][0], chosen[0][0]];
  assert.throws(() => E.pass(state, chosen));
  assert.deepEqual(state, before);
  chosen[0] = state.hands[1].slice(0, 3);
  assert.throws(() => E.pass(state, chosen));
  assert.deepEqual(state, before);
});

test('opening club two and following suit are compulsory', () => {
  assert.deepEqual(E.legalCards(fixture(['C2', 'C14', 'H3'], [], 0)), ['C2']);
  const state = fixture(['C4', 'C14', 'S12', 'H2'], [play(3, 'C3')]);
  assert.deepEqual(E.legalCards(state), ['C4', 'C14']);
  const before = structuredClone(state);
  assert.throws(() => E.play(state, 0, 'S12'));
  assert.throws(() => E.play(state, 1, 'C4'));
  assert.deepEqual(state, before);
});

test('first trick excludes penalty discards except a hand with only penalty cards', () => {
  assert.deepEqual(E.legalCards(fixture(['D14', 'S12', 'H2'], [play(1, 'C2')], 0)), ['D14']);
  assert.deepEqual(E.legalCards(fixture(['S12', 'H2'], [play(1, 'C2')], 0)), ['S12', 'H2']);
  assert.deepEqual(E.legalCards(fixture(['C3', 'H2'], [play(1, 'C2')], 0)), ['C3']);
});

test('hearts cannot lead before breaking, except an all-heart hand; queen does not break hearts', () => {
  const state = fixture(['S12', 'H2']);
  assert.deepEqual(E.legalCards(state), ['S12']);
  E.play(state, 0, 'S12');
  assert.equal(state.broken, false);
  assert.deepEqual(E.legalCards(fixture(['H3', 'H14'])), ['H3', 'H14']);
  const discarded = fixture(['H2', 'D2'], [play(1, 'C3')]);
  E.play(discarded, 0, 'H2');
  assert.equal(discarded.broken, true);
  const broken = fixture(['H2', 'D2']); broken.broken = true;
  assert.deepEqual(E.legalCards(broken), ['H2', 'D2']);
});

test('only the led suit can win; collecting scores all penalties and gives winner the lead', () => {
  const state = E.create(6);
  Object.assign(state, { phase: 'collect', trick: [play(2, 'D3'), play(3, 'S14'), play(0, 'D5'), play(1, 'H14')] });
  assert.equal(E.trickWinner(state.trick), 0);
  E.collect(state);
  assert.equal(state.turn, 0);
  assert.equal(state.roundPoints[0], 1);
  assert.equal(state.completed.length, 1);
  assert.equal(state.trick.length, 0);
  assert.throws(() => E.collect(state));
});

test('shooting the moon assigns 26 to each opponent; ordinary rounds sum to 26', () => {
  for (let p = 0; p < 4; p++) {
    const raw = [0, 0, 0, 0]; raw[p] = 26;
    assert.deepEqual(E.scoreRound(raw), { moon: p, delta: raw.map((_, i) => i === p ? 0 : 26) });
  }
  assert.deepEqual(E.scoreRound([4, 2, 7, 13]), { moon: -1, delta: [4, 2, 7, 13] });
  assert.throws(() => E.scoreRound([0, 0, 0, 0]));
});

test('moon scoring is applied before testing the 100-point threshold', () => {
  const state = E.create(7);
  Object.assign(state, { phase: 'collect', totals: [20, 20, 80, 60], roundPoints: [0, 0, 25, 0],
    completed: Array.from({ length: 12 }, () => ({ plays: [], points: 0 })),
    trick: [play(0, 'C2'), play(1, 'H2'), play(2, 'C14'), play(3, 'C5')] });
  E.collect(state);
  assert.equal(state.phase, 'roundEnd');
  // Player 2 has all 26: other players get 26, player 2 stays at 80.
  assert.deepEqual(state.totals, [46, 46, 80, 86]);
});

test('normal threshold finish and shared winners', () => {
  const state = E.create(7);
  Object.assign(state, { phase: 'collect', totals: [20, 20, 80, 60], roundPoints: [0, 0, 24, 1],
    completed: Array.from({ length: 12 }, () => ({ plays: [], points: 0 })),
    trick: [play(0, 'C2'), play(1, 'H2'), play(2, 'C14'), play(3, 'C5')] });
  E.collect(state);
  assert.equal(state.phase, 'matchEnd');
  assert.deepEqual(state.winners, [0, 1]);
  assert.deepEqual(state.totals, [20, 20, 105, 61]);
  assert.throws(() => E.nextRound(state));
  assert.throws(() => E.collect(state));
});

test('computer choices use only the player hand and public information', () => {
  const state = E.create(2);
  E.apply(state, { type: 'pass', cards: E.choosePass(state.hands[0]) });
  const own = state.turn;
  state.hands = new Proxy(state.hands, { get(target, key) {
    if (/^[0-3]$/.test(String(key)) && Number(key) !== own) throw new Error('Read an opponent hand');
    return target[key];
  } });
  assert.ok(E.legalCards(state).includes(E.choosePlay(state)));
});

test('60 complete games conserve all cards, choose legal moves, and reproduce saves', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const state = E.create(seed), actions = [];
    let steps = 0;
    while (state.phase !== 'matchEnd') {
      advance(state, actions); checkDeck(state);
      assert.ok(++steps < 5000, 'game must finish');
      if (steps % 79 === 0) assert.deepEqual(E.restore({ version: 1, seed, actions }), state);
    }
    assert.ok(state.totals.some(n => n >= 100));
    assert.ok(state.winners.every(p => state.totals[p] === Math.min(...state.totals)));
    assert.deepEqual(E.restore({ version: 1, seed, actions }), state);
    state.history.forEach(round => assert.equal(round.delta.reduce((a, b) => a + b, 0), round.moon < 0 ? 26 : 78));
  }
});

test('corrupted or illegal save events are rejected', () => {
  assert.throws(() => E.restore({ version: 2, seed: 1, actions: [] }));
  assert.throws(() => E.restore({ version: 1, seed: -1, actions: [] }));
  assert.throws(() => E.restore({ version: 1, seed: 1, actions: [{ type: 'collect' }] }));
  assert.throws(() => E.restore({ version: 1, seed: 1, actions: [{ type: 'play', player: 0, card: 'H20' }] }));
});
