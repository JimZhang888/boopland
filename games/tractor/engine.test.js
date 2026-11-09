const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const ctx = { level: 7, trump: 's' };
const card = (s, r, copy = 0) => ({ id: `${copy}-${s}-${r}`, s, r });
const pair = (s, r) => [card(s, r), card(s, r, 1)];
const play = (player, cards) => ({ player, cards });

test('two decks contain 108 distinct cards and 200 points; deal leaves eight', () => {
  const d = E.deck(); assert.equal(d.length, 108); assert.equal(new Set(d.map(c => c.id)).size, 108); assert.equal(E.points(d), 200);
  const s = E.create(1); assert.deepEqual(s.hands.map(h => h.length), [25, 25, 25, 25]); assert.equal(s.bottom.length, 8); assert(E.validSave(s));
});
test('trump hierarchy, skipped levels, equal vice levels and no-trump tractors', () => {
  const cards = [card('s', 14), card('h', 7), card('s', 7), card('j', 15), card('j', 16)];
  assert(cards.every(c => E.suit(c, ctx) === 't'));
  assert.deepEqual(cards.map(c => E.rank(c, ctx)), [11, 13, 14, 15, 16]);
  assert.equal(E.pattern([...pair('h', 6), ...pair('h', 8)], ctx).type, 'tractor');
  assert.equal(E.pattern([...pair('h', 6), ...pair('h', 9)], ctx), null);
  assert.equal(E.pattern([...pair('h', 7), ...pair('d', 7)], ctx), null);
  assert.equal(E.pattern([...pair('s', 14), ...pair('h', 7), ...pair('s', 7)], ctx).type, 'tractor');
  assert.equal(E.pattern([...pair('h', 7), ...pair('j', 15)], { level: 7, trump: null }).type, 'tractor');
});
test('following enforces card ownership, count, suit, pairs and partial tractors', () => {
  const lead = [...pair('h', 8), ...pair('h', 9), ...pair('h', 10)];
  const hand = [...pair('h', 2), ...pair('h', 3), ...pair('h', 5), ...pair('h', 11), card('s', 9), card('h', 14)];
  assert.equal(E.validate(hand, hand.slice(0, 6), lead, ctx), null);
  assert.equal(E.validate(hand, [...pair('h', 2), ...pair('h', 5), ...pair('h', 11)], lead, ctx), 'followShape');
  assert.equal(E.validate(hand, [...hand.slice(0, 5), card('s', 9)], lead, ctx), 'followSuit');
  assert.equal(E.validate(hand, hand.slice(0, 4), lead, ctx), 'followCount');
  assert.equal(E.validate(hand, [hand[0], hand[0]], pair('h', 8), ctx), 'invalidCards');
  assert.equal(E.validate([card('h', 2), card('s', 9)], [card('h', 2), card('s', 9)], pair('h', 8), ctx), null);
});
test('a matching trump structure can ruff, mixed cards cannot, ties keep first', () => {
  assert.equal(E.winner([play(0, pair('h', 14)), play(1, [card('s', 3), card('s', 4)]), play(2, pair('h', 5)), play(3, pair('s', 2))], ctx), 3);
  assert.equal(E.winner([play(0, pair('h', 7)), play(1, pair('d', 7)), play(2, pair('s', 14)), play(3, pair('j', 15))], ctx), 3);
  assert.equal(E.winner([play(0, pair('h', 7)), play(1, pair('d', 7))], ctx), 0);
  const lead = [...pair('h', 5), ...pair('h', 6)];
  assert.equal(E.winner([play(0, lead), play(1, [...pair('s', 8), ...pair('s', 10)]), play(2, [...pair('s', 2), ...pair('s', 3)])], ctx), 2);
});
test('auction validates held cards and strength, first winner deals, fallback is deterministic', () => {
  const s = E.create(10);
  assert.equal(E.bid(s, 1, null), 'notTurn');
  assert.equal(E.bid(s, 0, { suit: null, strength: 100 }), 'invalidBid');
  for (let i = 0; i < 4; i++) assert.equal(E.bid(s, i, null), null);
  assert.equal(s.phase, 'bury'); assert.equal(s.dealer, 0); assert.equal(s.hands[0].length, 33); assert(E.SUITS.includes(s.trump));
  assert.equal(E.bury(s, 0, s.hands[0].slice(0, 7).map(c => c.id)), 'buryEight');
  assert.equal(E.bury(s, 0, E.aiBury(E.view(s, 0))), null); assert(E.validSave(s));
  const a = E.create(11); let finalBidder = null;
  while (a.phase === 'bid') { const p = a.turn, options = E.bids(E.view(a, p)); const b = options.at(-1) || null; if (b) finalBidder = p; assert.equal(E.bid(a, p, b), null); }
  if (finalBidder !== null) assert.equal(a.dealer, finalBidder);
});
test('score boundaries, next dealer, ace completion and bottom multipliers', () => {
  for (const [score, held, gain] of [[0, true, 3], [5, true, 2], [35, true, 2], [40, true, 1], [75, true, 1], [80, false, 0], [115, false, 0], [120, false, 1], [160, false, 2], [200, false, 3]]) {
    const o = E.outcome(score, 0, [2, 2]); assert.equal(o.held, held); assert.equal(o.gain, gain); assert.equal(o.dealer, held ? 2 : 1);
  }
  assert.equal(E.outcome(40, 0, [14, 2]).champion, 0);
  assert.equal(E.outcome(40, 0, [13, 2]).champion, null);
  for (const [cards, multiplier] of [[ [card('s', 3)], 2 ], [pair('s', 3), 4], [[...pair('s', 3), ...pair('s', 4)], 8], [[...pair('s', 3), ...pair('s', 4), ...pair('s', 5)], 16]]) {
    const state = { ...E.create(1), phase: 'collect', level: 7, trump: 's', dealer: 0, hands: [[], [], [], []], bottom: [card('h', 10)], captured: [], trick: [play(1, cards)], score: 0 };
    E.collect(state); assert.equal(state.result.bottomMultiplier, multiplier); assert.equal(state.result.bonus, 10 * multiplier);
  }
});
test('computer view hides other hands and kitty; rejected actions leave state intact', () => {
  const s = E.create(77), v = E.view(s, 0); assert(!('hands' in v)); assert(!('bottom' in v)); assert(!('seed' in v));
  v.hand[0].r = 100; assert.notEqual(s.hands[0][0].r, 100);
  const before = JSON.stringify(s); E.play(s, 0, ['bad']); E.bury(s, 0, []); E.bid(s, 1, null); assert.equal(JSON.stringify(s), before);
  assert.equal(E.validSave({ ...s, hands: [[], [], [], []] }), false);
});
test('200 seeded full rounds preserve all cards, follow legally, score correctly and resume', () => {
  let tractorCount = 0, totalTricks = 0;
  for (let seed = 0; seed < 200; seed++) {
    let s = E.create(seed); let moves = 0;
    while (s.phase !== 'result') {
      assert(++moves < 200); assert(E.validSave(s), `invalid state ${seed} ${s.phase}`);
      if (moves % 11 === 0) s = JSON.parse(JSON.stringify(s));
      const p = s.turn, v = E.view(s, p);
      if (s.phase === 'bid') assert.equal(E.bid(s, p, E.aiBid(v)), null);
      else if (s.phase === 'bury') assert.equal(E.bury(s, p, E.aiBury(v)), null);
      else if (s.phase === 'collect') { totalTricks++; assert.equal(E.collect(s), null); }
      else {
        const ids = E.aiPlay(v), cards = ids.map(id => v.hand.find(c => c.id === id));
        assert.equal(E.validate(v.hand, cards, v.trick[0]?.cards, v), null);
        if (!v.trick.length && E.pattern(cards, v)?.type === 'tractor') tractorCount++;
        assert.equal(E.play(s, p, ids), null);
      }
    }
    assert(E.validSave(s)); assert.equal(s.captured.length, 100); assert.equal(E.points(s.captured) + E.points(s.bottom), 200);
    assert.equal(s.score, s.result.base + s.result.bonus); assert.equal(s.hands.flat().length, 0);
    if (s.champion === null) { const next = E.deal(s); assert.equal(next.round, 2); assert.equal(next.level, s.levels[s.dealer % 2]); assert(E.validSave(next)); }
  }
  assert(tractorCount > 30, `Expected real tractor plays, got ${tractorCount}`);
  console.log(`Simulated ${totalTricks} tricks and ${tractorCount} tractor leads.`);
});
