const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const c = (rank, suit = 0) => suit * 13 + rank - 1;
const cards = (ranks, suit = 0) => ranks.map(r => c(r, suit));
function rng(seed) { return () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296); }
function invariant(s) {
  const all = [...s.hands.flat(), ...s.stock, ...s.discards];
  assert.equal(all.length, 52);
  assert.equal(new Set(all).size, 52);
  assert.ok(all.every(card => Number.isInteger(card) && card >= 0 && card < 52));
  assert.equal(s.hands[s.current].length, s.phase === 'discard' ? 11 : 10);
  assert.equal(s.hands[1 - s.current].length, 10);
}

test('52 unique cards; alternating deal; opening offers and forced stock draw', () => {
  const s = E.createGame(rng(12), 1);
  invariant(s);
  assert.equal(s.current, 0);
  assert.equal(s.stock.length, 31);
  const before = JSON.stringify(s);
  assert.throws(() => E.draw(s, 'stock'));
  assert.equal(JSON.stringify(s), before);
  E.pass(s);
  assert.equal(s.current, 1);
  E.pass(s);
  assert.equal(s.current, 0);
  assert.equal(s.forceStock, true);
  assert.throws(() => E.draw(s, 'discard'));
  E.draw(s, 'stock');
  invariant(s);
  assert.equal(s.phase, 'discard');
});

test('a picked-up discard cannot be returned immediately; invalid actions are atomic', () => {
  const s = E.createGame(rng(7), 1);
  const card = s.discards.at(-1);
  E.draw(s, 'discard');
  const before = JSON.stringify(s);
  assert.throws(() => E.discard(s, card));
  assert.throws(() => E.draw(s, 'stock'));
  assert.throws(() => E.pass(s));
  assert.throws(() => E.discard(s, 99));
  assert.equal(JSON.stringify(s), before);
  E.discard(s, s.hands[0].find(item => item !== card));
  invariant(s);
  assert.equal(s.phase, 'draw');
  assert.equal(s.current, 1);
});

test('aces are low, faces count ten, and runs cannot wrap', () => {
  assert.equal(E.analyze(cards([1, 2, 3])).points, 0);
  assert.equal(E.analyze(cards([12, 13, 1])).points, 21);
  assert.equal(E.analyze([c(8, 0), c(9, 1), c(10, 2)]).points, 27);
  assert.equal(E.points([c(1), c(10), c(11), c(12), c(13)]), 41);
});

test('optimal partition handles overlapping runs/sets and four-of-a-kind subsets', () => {
  const hand = [...cards([4, 5, 6]), c(5, 1), c(5, 2), c(5, 3), ...cards([9, 10, 11], 2), c(1, 3)];
  const result = E.analyze(hand);
  assert.equal(result.points, 1);
  assert.equal(result.melds.length, 3);
  assert.equal(new Set(result.melds.flat()).size, 9);
  assert.deepEqual(result.deadwood, [c(1, 3)]);
});

test('long runs can split around another meld; unmatched cards are never counted twice', () => {
  const hand = [...cards([1, 2, 3, 4, 5, 6, 7]), c(4, 1), c(4, 2), c(9, 3)];
  const result = E.analyze(hand);
  assert.equal(result.points, 9);
  assert.equal(result.melds.length, 3);
  assert.equal(E.points(result.deadwood) + E.points(result.melds.flat()), E.points(hand));
});

test('layoffs extend a run repeatedly in either direction and fill sets', () => {
  const melds = [cards([5, 6, 7]), [c(9, 0), c(9, 1), c(9, 2)]];
  const result = E.layoff([c(2), c(3), c(4), c(8), c(9, 3), c(12, 2)], melds);
  assert.equal(result.points, 10);
  assert.equal(result.layoffs.length, 5);
  assert.equal(E.canLayoff(c(1), cards([11, 12, 13])), false);
  assert.equal(E.canLayoff(c(4, 1), cards([5, 6, 7])), false);
});

test('defender reconsiders meld choices to minimize deadwood after layoffs', () => {
  const hand = [c(4), c(4, 1), c(4, 2), ...cards([3, 5], 1), ...cards([3, 5], 2)];
  const result = E.defend(hand, [cards([1, 2, 3]), cards([6, 7, 8], 1), cards([6, 7, 8], 2)]);
  assert.equal(result.points, 0);
});

const knockHand = [...cards([2, 3, 4]), ...cards([7, 8, 9], 1), c(12, 0), c(12, 2), c(12, 3), c(5, 2)];
const defenderHand = [...cards([10, 11, 12], 1), ...cards([6, 7, 8], 2), ...cards([2, 3, 4], 3), c(5, 3)];

test('equal deadwood is an undercut with a 25 point bonus', () => {
  const result = E.settle(knockHand, defenderHand);
  assert.equal(result.knocker.points, 5);
  // The defender can meld its four-card spade run, leaving no deadwood.
  assert.equal(result.defender.points, 0);
  assert.equal(result.kind, 'undercut');
  assert.equal(result.points, 30);
  const equal = E.settle(knockHand, [...cards([10, 11, 12], 1), ...cards([6, 7, 8], 2), ...cards([9, 10, 11], 3), c(5, 3)]);
  assert.equal(equal.defender.points, 5);
  assert.equal(equal.kind, 'undercut');
  assert.equal(equal.points, 25);
});

test('normal knock scores the difference after layoffs, including a last-stock knock', () => {
  const defender = [...cards([10, 11, 12], 1), ...cards([6, 7, 8], 2), ...cards([2, 3, 4], 3), c(13, 3)];
  const result = E.settle(knockHand, defender);
  assert.equal(result.kind, 'knock');
  assert.equal(result.points, 5);
  const s = E.createGame(rng(1), 1);
  s.hands = [[...knockHand, c(1)], defender];
  s.stock = [c(10), c(11)];
  s.phase = 'discard';
  E.discard(s, c(1), true);
  assert.equal(s.result.kind, 'knock');
  assert.equal(s.scores[0], 5);
});

test('gin prohibits layoffs and awards 25 plus opponent deadwood', () => {
  const ginHand = [...cards([2, 3, 4, 5]), ...cards([7, 8, 9], 1), c(12, 0), c(12, 2), c(12, 3)];
  const defender = [...cards([10, 11, 12], 1), ...cards([6, 7, 8], 2), ...cards([9, 10, 11], 3), c(1)];
  const result = E.settle(ginHand, defender);
  assert.equal(result.kind, 'gin');
  assert.equal(result.points, 26);
  assert.equal(result.defender.layoffs.length, 0);
  assert.equal(result.defender.points, 1);
});

test('stock exhaustion waits until discard, scores nothing, and retains the dealer', () => {
  const s = E.createGame(rng(9), 1);
  E.pass(s); E.pass(s);
  s.stock = s.stock.slice(0, 3);
  E.draw(s, 'stock');
  assert.equal(s.phase, 'discard');
  E.discard(s, s.hands[0][0]);
  assert.equal(s.result.kind, 'draw');
  assert.deepEqual(s.scores, [0, 0]);
  E.nextRound(s, rng(10));
  assert.equal(s.dealer, 1);
  assert.equal(s.round, 2);
  invariant(s);
});

test('100 points ends a match; ordinary scored rounds alternate dealers', () => {
  const s = E.createGame(rng(1), 1);
  s.hands = [[...knockHand, c(1)], defenderHand];
  s.phase = 'discard';
  s.scores[1] = 80;
  E.discard(s, c(1), true);
  assert.equal(s.phase, 'matchOver');
  assert.equal(s.scores[1], 110);
  assert.throws(() => E.nextRound(s));
  const s2 = E.createGame(rng(1), 1);
  s2.hands = [[...knockHand, c(1)], defenderHand];
  s2.phase = 'discard';
  E.discard(s2, c(1), true);
  E.nextRound(s2, rng(2));
  assert.equal(s2.dealer, 0);
  assert.equal(s2.current, 1);
});

test('AI decisions are independent of hidden opponent cards and stock order', () => {
  const s = E.createGame(rng(22), 1);
  for (const phase of ['opening', 'draw', 'discard']) {
    const a = structuredClone(s);
    if (phase === 'draw') { E.pass(a); E.pass(a); }
    if (phase === 'discard') E.draw(a, 'discard');
    const b = structuredClone(a);
    b.hands[1] = b.hands[1].map((_, i) => 51 - i);
    b.stock.reverse();
    assert.deepEqual(E.chooseAction(a), E.chooseAction(b));
  }
});

test('100 seeded full matches preserve all cards, legal phases and score accounting', () => {
  let rounds = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const random = rng(seed);
    const s = E.createGame(random);
    let steps = 0;
    while (s.phase !== 'matchOver') {
      invariant(s);
      assert.ok(++steps < 6000, 'match must finish: seed ' + seed);
      if (s.phase === 'roundOver') { rounds++; E.nextRound(s, random); }
      else E.act(s, E.chooseAction(s));
    }
    invariant(s);
    assert.ok(Math.max(...s.scores) >= 100);
    const sums = [0, 0];
    s.history.forEach(row => { if (row.winner !== null) sums[row.winner] += row.points; });
    assert.deepEqual(s.scores, sums);
  }
  assert.ok(rounds > 100);
});
