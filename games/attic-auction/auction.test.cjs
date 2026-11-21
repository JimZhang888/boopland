'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'auction.js'), 'utf8');
const A = vm.runInNewContext(source + '\nAuction');

function finishComputerTurns(s) {
  while (A.computer(s)) { /* Stop at the hammer or at the player's turn. */ }
}

test('all three pass: no sale, no charge; a lone bidder pays exactly the opening bid', () => {
  const s = A.fresh();
  s.index = 2; // Both collectors value this paper lot below its opening bid.
  A.start(s);
  A.act(s, 0, 'pass');
  finishComputerTurns(s);
  assert.equal(s.sales[0].buyer, null);
  assert.equal(s.sales[0].price, 0);
  assert.deepEqual(s.funds, A.fresh().funds);

  const b = A.fresh();
  b.index = 2;
  A.start(b);
  A.act(b, 0, 'raise');
  finishComputerTurns(b);
  assert.equal(b.sales[0].buyer, 0);
  assert.equal(b.sales[0].price, 24);
  assert.equal(b.funds[0], 96);
});

test('withdrawal leaves both computers bidding and only the final buyer pays', () => {
  const s = A.fresh();
  A.start(s);
  A.act(s, 0, 'raise');
  finishComputerTurns(s);
  assert.equal(s.turn, 0);
  assert.equal(s.price, 28);
  A.act(s, 0, 'pass');
  assert.equal(s.phase, 'bid');
  assert.equal(A.act(s, 0, 'raise'), false);
  finishComputerTurns(s);
  assert.equal(s.sales[0].price, 32);
  assert.equal(s.sales[0].buyer, 1);
  assert.equal(s.funds.join(','), '120,54,94');
  assert.equal(A.computer(s), false);
  assert.equal(s.sales.length, 1);
});

test('an exact budget can win, one chip short cannot bid and keeps the turn', () => {
  for (const budget of [19, 20]) {
    const s = A.fresh();
    s.funds = [budget, 0, 0];
    A.start(s);
    assert.equal(A.act(s, 0, 'raise'), budget === 20);
    if (budget === 19) {
      assert.equal(s.events.length, 0);
      assert.equal(s.leader, null);
      assert.equal(s.turn, 0);
      A.act(s, 0, 'pass');
    }
    finishComputerTurns(s);
    assert.equal(s.funds[0], budget === 19 ? 19 : 0);
    assert.equal(s.sales[0].buyer, budget === 19 ? null : 0);
  }
});

test('each computer accepts its exact next price and passes one chip short', () => {
  for (const actor of [1, 2]) {
    for (const budget of [23, 24]) {
      const s = A.fresh();
      s.funds[1] = 0; s.funds[2] = 0; s.funds[actor] = budget;
      A.start(s);
      A.act(s, 0, 'raise');
      finishComputerTurns(s);
      if (s.phase === 'bid') A.act(s, 0, 'pass');
      finishComputerTurns(s);
      assert.equal(s.sales[0].buyer, budget === 24 ? actor : 0);
      assert.equal(s.funds[actor], budget === 24 ? 0 : 23);
    }
  }
});

test('six lots reconcile to cash and appraised value under 256 replayable bidding strategies', () => {
  const values = [52,32,44,40,52,60];
  for (let seed = 0; seed < 256; seed++) {
    let random = seed;
    const s = A.fresh();
    for (let round = 0; round < 6; round++) {
      const item = A.lots[round];
      assert.equal(item.changes.length, 3);
      assert.equal(A.valueOf(item), values[round]);
      A.start(s);
      let turns = 0;
      while (s.phase === 'bid') {
        assert.ok(++turns < 100);
        if (s.turn === 0) {
          random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
          const raise = random / 0x100000000 > .19 && s.funds[0] >= A.nextPrice(s);
          assert.equal(A.act(s, 0, raise ? 'raise' : 'pass'), true);
        } else A.computer(s);
      }
      assert.equal(s.sales.length, round + 1);
      for (const [actor, balance] of s.funds.entries()) {
        const spend = s.sales.filter(r => r.buyer === actor).reduce((n, r) => n + r.price, 0);
        assert.equal(balance, A.initialFunds[actor] - spend);
        assert.ok(balance >= 0);
      }
      A.next(s);
    }
    assert.equal(s.phase, 'summary');
    const ledger = A.ledger(s);
    assert.equal(ledger.profit, s.funds[0] + ledger.value - A.initialFunds[0]);
  }
});

