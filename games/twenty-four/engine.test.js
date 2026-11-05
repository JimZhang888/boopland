// Optional developer checks: node --test games/twenty-four/engine.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('./engine.js');

function replay(numbers, steps) {
  let cards = engine.makeCards(numbers);
  const leaves = new Map(cards.map(card => [card.id, [card.id]]));
  for (const step of steps) {
    assert.notEqual(step.firstId, step.secondId);
    assert.ok(cards.some(card => card.id === step.firstId));
    assert.ok(cards.some(card => card.id === step.secondId));
    const next = engine.combine(cards, step.firstId, step.secondId, step.operator);
    assert.ok(next);
    const used = [...leaves.get(step.firstId), ...leaves.get(step.secondId)];
    assert.equal(new Set(used).size, used.length, 'A card must not be reused');
    leaves.set(next.result.id, used);
    cards = next.cards;
  }
  assert.equal(cards.length, 1);
  assert.equal(cards[0].value.n, 24 * cards[0].value.d);
  assert.deepEqual(leaves.get(cards[0].id).sort(), [1, 2, 3, 4]);
}

// Independent subset-DP oracle, using floating point instead of pair reduction.
function referenceSolvable(numbers) {
  const values = Array.from({ length: 16 }, () => new Set());
  numbers.forEach((n, i) => values[1 << i].add(n));
  for (let mask = 1; mask < 16; mask++) {
    for (let left = (mask - 1) & mask; left; left = (left - 1) & mask) {
      const right = mask ^ left;
      if (!right || left > right) continue;
      for (const a of values[left]) for (const b of values[right]) {
        for (const result of [a + b, a - b, b - a, a * b, ...(b ? [a / b] : []), ...(a ? [b / a] : [])]) values[mask].add(result);
      }
    }
  }
  return [...values[15]].some(value => Math.abs(value - 24) < 1e-9);
}

test('fractional solutions are exact, including repeated numbers', () => {
  for (const numbers of [[3, 3, 8, 8], [1, 3, 4, 6], [5, 5, 5, 1], [13, 13, 1, 1]]) {
    const steps = engine.solve(engine.makeCards(numbers));
    assert.equal(steps?.length, 3);
    replay(numbers, steps);
  }
});

test('zero, subtraction order, and negative fractions are handled', () => {
  const cards = engine.makeCards([1, 1, 2, 3]);
  assert.equal(engine.combine(cards, 1, 1, '+'), null);
  assert.equal(engine.combine(cards, 1, 99, '+'), null);
  const zero = engine.combine(cards, 1, 2, '-');
  assert.equal(engine.combine(zero.cards, 3, zero.result.id, '/'), null);
  assert.deepEqual(engine.calculate(engine.fraction(1), engine.fraction(-3), '/'), { n: -1, d: 3 });
  assert.equal(engine.format(engine.combine(cards, 1, 4, '-').result.value), '-2');
  assert.equal(engine.format(engine.combine(cards, 4, 1, '-').result.value), '2');
  assert.equal(engine.solve(engine.makeCards([1, 1, 1, 1])), null);
});

test('all 1,820 unique hands agree with an independent solver; every solution uses each card once', () => {
  let count = 0;
  for (let a = 1; a <= 13; a++) for (let b = a; b <= 13; b++)
    for (let c = b; c <= 13; c++) for (let d = c; d <= 13; d++) {
      const numbers = [a, b, c, d];
      const solution = engine.solve(engine.makeCards(numbers));
      assert.equal(solution !== null, referenceSolvable(numbers), numbers.join(','));
      if (solution) replay(numbers, solution);
      count++;
    }
  assert.equal(count, 1820);
});

test('new puzzles have a solution, change the hand, and have a bounded fallback', () => {
  let seed = 42;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  let previous = [];
  for (let index = 0; index < 200; index++) {
    const numbers = engine.newPuzzle(previous, random);
    assert.ok(numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 13));
    assert.notDeepEqual([...numbers].sort(), [...previous].sort());
    replay(numbers, engine.solve(engine.makeCards(numbers)));
    previous = numbers;
  }
  assert.deepEqual(engine.newPuzzle([], () => 0), [2, 3, 4, 6]);
  assert.deepEqual(engine.newPuzzle([2, 3, 4, 6], () => 0), [3, 3, 8, 8]);
});

test('all eight translations cover the same keys and interpolation values', () => {
  let catalogue;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), {
    BooplandI18n: { register(scope, messages) { assert.equal(scope, 'twentyFour'); catalogue = messages; } }
  });
  const base = catalogue['zh-CN'];
  assert.equal(Object.keys(catalogue).length, 8);
  const variables = value => (value.match(/\{\w+\}/g) || []).sort();
  for (const [language, messages] of Object.entries(catalogue)) {
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(base).sort(), language);
    for (const key of Object.keys(base)) {
      assert.ok(messages[key].trim(), `${language}.${key}`);
      assert.deepEqual(variables(messages[key]), variables(base[key]), `${language}.${key}`);
    }
  }
});
