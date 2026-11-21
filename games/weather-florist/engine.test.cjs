'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('./engine.js');

test('a fixed trading week balances each cash drawer and each flower bin', () => {
  // Independently reconciled columns: cart, paid ticket numbers (one-based),
  // purchases, takings, closing cash, fresh stock, and discarded iris.
  const days = [
    [[4,3,0,0,0], [1,2], 18,30, 48, [0,1,0,0,0], 0],
    [[0,0,0,3,2], [1],   13,18, 53, [0,1,0,0,1], 1],
    [[1,1,3,0,0], [1,2], 17,40, 76, [0,1,0,0,0], 0],
    [[4,1,0,0,0], [1,2], 10,30, 96, [0,0,0,0,0], 0],
    [[1,0,2,0,1], [1],   13,19,102, [0,0,1,0,0], 0],
    [[0,2,3,0,0], [1,2], 22,42,122, [0,0,0,0,0], 0],
    [[0,0,0,5,2], [1,2], 19,36,139, [0,0,0,0,0], 1]
  ];
  const s = F.start();
  days.forEach(([cart, tickets, spent, sales, cash, carry, discard], i) => {
    const opening = s.cash;
    assert.equal(F.open(s,cart),null);
    assert.equal(s.cash,opening - spent);
    for (const id of tickets) assert.equal(F.serve(s,(i+1)+'-'+id),null);
    assert.equal(F.close(s),true);
    assert.equal(s.cash,cash);
    const log = s.ledger[i];
    assert.deepEqual([log.opening,log.spent,log.sales,log.closing], [opening,spent,sales,cash]);
    assert.deepEqual(log.carry,carry);
    assert.deepEqual(F.countStock(s),carry);
    assert.deepEqual(log.wilt,[0,0,0,discard,0]);
    assert.equal(log.lostCost,discard*3);
    assert.equal(F.next(s),true);
  });
  const total = key => F.sum(s.ledger.map(l=>l[key]));
  assert.deepEqual([total('spent'),total('sales'),total('served'),total('requested'),total('lostCost')],[112,215,12,21,6]);
  assert.equal(s.phase,'week');
  assert.equal(s.cash-F.capital,103);
});

test('insufficient cash, fourth kind and invalid quantities leave everything untouched',()=>{
  const s = F.start(), before = structuredClone(s);
  for (const [cart, err] of [[[13,0,0,0,0],'noCash'],[[1,1,1,1,0],'maxKinds'],[[0,-1,0,0,0],'invalid'],[[0.5,0,0,0,0],'invalid']]) {
    assert.equal(F.open(s,cart),err);
    assert.deepEqual(s,before);
  }
  assert.equal(F.open(s,[12,0,0,0,0]),null);
  assert.equal(s.cash,0);
  assert.equal(F.open(s,F.empty()),'invalid');
});

test('short bouquets consume nothing and receipts can be cashed only once',()=>{
  const s = F.start();
  F.open(s,[2,1,0,0,0]);
  assert.equal(F.serve(s,'1-2'),null); // Choose a walk-in ahead of a preorder.
  const settled = structuredClone(s);
  assert.equal(F.serve(s,'1-2'),'invalid');
  assert.equal(F.serve(s,'1-1'),'shortStock');
  assert.deepEqual(s,settled);
  F.close(s);
  assert.equal(F.close(s),false);
  F.next(s);
  F.open(s,F.empty());
  assert.equal(F.serve(s,'1-1'),'invalid');
});

test('old stems expire at the paid price; new stems of the same kind survive',()=>{
  const s = F.start();
  F.open(s,[1,0,0,1,0]);
  F.close(s);
  assert.deepEqual(s.ledger[0].wilt,[0,0,0,1,0]);
  assert.equal(s.ledger[0].lostCost,4);
  F.next(s); F.open(s,[1,0,0,0,0]); F.close(s);
  assert.deepEqual(s.ledger[1].wilt,[1,0,0,0,0]);
  assert.equal(s.ledger[1].lostCost,3);
  assert.deepEqual(F.countStock(s),[1,0,0,0,0]);
  assert.equal(s.cash,25);
});

test('zero purchases and no sales are legal through all seven days',()=>{
  const s = F.start();
  for (const d of F.week) {
    assert.equal(F.open(s,F.empty()),null);
    const walkIns = s.orders.filter(o=>o.source==='walk').length;
    assert.ok(walkIns >= d.range[0] && walkIns <= d.range[1]);
    assert.equal(s.orders.filter(o=>o.source==='booked').length,d.booked[1]);
    F.close(s); F.next(s);
  }
  assert.equal(s.phase,'week');
  assert.equal(s.cash,F.capital);
  assert.equal(s.ledger.length,7);
  assert.equal(F.next(s),false);
});
