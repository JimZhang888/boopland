const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./scorebook.js');
const { Book, lines, points } = globalThis.FiveDiceScorebook;

test('number lines count repeats and chance sums every face', () => {
  assert.deepEqual(points([4, 6, 4, 4, 5]), {
    fours: 12, fives: 5, sixes: 6, short: 0, long: 0, house: 0, five: 0, chance: 23
  });
});
test('straights are consecutive distinct faces, in any order', () => {
  for (const dice of [[4, 2, 3, 4, 1], [5, 2, 3, 3, 4], [6, 3, 4, 4, 5]]) {
    assert.equal(points(dice).short, 30);
    assert.equal(points(dice).long, 0);
  }
  for (const dice of [[5, 1, 4, 2, 3], [4, 6, 2, 3, 5]]) {
    assert.equal(points(dice).short, 30);
    assert.equal(points(dice).long, 40);
  }
  assert.equal(points([1, 2, 4, 5, 6]).short, 0);
});
test('a full house requires exactly a triple and a pair', () => {
  assert.equal(points([3, 2, 3, 2, 3]).house, 25);
  for (const dice of [[2, 3, 2, 2, 2], [1, 1, 1, 2, 3], [6, 6, 6, 6, 6]]) {
    assert.equal(points(dice).house, 0);
  }
  assert.equal(points([5, 5, 5, 5, 5]).five, 50);
  assert.equal(points([5, 5, 5, 5, 4]).five, 0);
});
test('all 7,776 ordered rolls give the expected combination counts', () => {
  const counts = { short: 0, long: 0, house: 0, five: 0 };
  for (let hand = 0; hand < 6 ** 5; hand++) {
    const dice = Array.from({ length: 5 }, (_, i) => 1 + Math.floor(hand / 6 ** i) % 6);
    const scores = points(dice);
    for (const kind of Object.keys(counts)) if (scores[kind]) counts[kind]++;
  }
  assert.deepEqual(counts, { short: 1200, long: 240, house: 300, five: 6 });
});
test('only free dice consume new draws and only two rerolls are allowed', () => {
  const sequence = [1, 2, 3, 4, 5, 6, 6, 6, 1, 1, 1];
  let draws = 0;
  const book = new Book(() => sequence[draws++]);
  assert.equal(book.toggle(1), false);
  assert.equal(book.write('chance'), false);
  book.roll();
  book.toggle(1);
  book.toggle(3);
  book.roll();
  assert.deepEqual(book.dice, [6, 2, 6, 4, 6]);
  book.roll();
  assert.deepEqual(book.dice, [1, 2, 1, 4, 1]);
  assert.equal(book.roll(), false);
  assert.equal(draws, 11);
});
test('all held can be released without wasting a reroll', () => {
  const book = new Book(() => 5);
  book.roll();
  for (let i = 0; i < 5; i++) book.toggle(i);
  assert.equal(book.roll(), false);
  assert.equal(book.rolls, 1);
  assert.ok(book.toggle(3));
  assert.ok(book.roll());
  assert.equal(book.rolls, 2);
});
test('eight locked entries including a voluntary zero give the final total', () => {
  const book = new Book(() => 6);
  lines.forEach((line, i) => {
    assert.equal(book.rolls, 0);
    assert.ok(book.held.every(held => !held));
    book.roll();
    if (i > 0) assert.equal(book.write(lines[i - 1]), false);
    book.toggle(2);
    assert.ok(book.write(line, line === 'five'));
    assert.equal(book.entries.size, i + 1);
    assert.equal(book.done, i === lines.length - 1);
  });
  assert.equal(book.entries.get('five'), 0);
  assert.equal(book.total, 60);
  assert.equal(book.roll(), false);
  assert.equal(book.write('chance'), false);
});
