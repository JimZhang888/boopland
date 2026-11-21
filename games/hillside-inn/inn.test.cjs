'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const inn = require('./inn.js');

function opening() {
  const s = inn.create();
  for (const [id, room] of [['sora',203], ['iris',201], ['reed',101], ['robin',102]]) {
    assert.ok(inn.place(s, id, inn.rooms.indexOf(room)));
  }
  return s;
}

test('day one satisfies every guest and pays exactly once per night', () => {
  const s = opening();
  assert.ok(inn.settle(s));
  assert.equal(s.book[0].fee, 170);
  assert.equal(s.book[0].praise, 4);
  assert.equal(s.book[0].declined.length, 0);
  assert.equal(inn.settle(s), false);
  assert.equal(inn.remove(s, 'iris'), false);
  assert.equal(inn.place(s, 'reed', 0), false);
  assert.equal(s.book.length, 1);
});

test('both sides of a pair require the same floor and one door of separation', () => {
  const s = opening();
  for (const [other, reason] of [[4, 'nextDoor'], [5, 'gap'], [0, 'otherFloor']]) {
    inn.place(s, 'robin', other);
    for (const id of ['reed', 'robin']) {
      const [detail] = inn.assessment(s, inn.locate(s, id));
      assert.equal(detail.reason, reason);
      assert.equal(detail.ok, reason === 'nextDoor');
    }
  }
  inn.remove(s, 'robin');
  assert.equal(inn.assessment(s, 3)[0].reason, 'absent');
  assert.equal(inn.adjacent(2, 3), false);
});

test('new guests swap or return to the wait list without duplicating a booking', () => {
  const s = opening();
  inn.place(s, 'sora', 0);
  assert.equal(inn.locate(s, 'iris'), 2);
  inn.remove(s, 'reed');
  inn.place(s, 'reed', 2);
  assert.equal(inn.locate(s, 'iris'), -1);
  assert.equal(s.beds.filter(b => b?.id === 'reed').length, 1);
  const previous = JSON.stringify(s);
  assert.equal(inn.place(s, 'tao', 2), false);
  assert.equal(inn.place(s, 'iris', -1), false);
  assert.equal(JSON.stringify(s), previous);
});

test('two-night stays lock their original rooms, charge each night, then release', () => {
  const s = opening();
  inn.settle(s); inn.advance(s);
  assert.deepEqual(s.beds.map(b => b?.id ?? null), ['iris', null, 'sora', null, null, null]);
  assert.equal(inn.remaining(s, s.beds[0]), 1);
  assert.equal(inn.place(s, 'tao', 2), false);
  assert.equal(inn.place(s, 'sora', 1), false);
  assert.equal(inn.remove(s, 'iris'), false);
  for (const [id, i] of [['tao',5], ['yuki',1], ['noa',3], ['mio',4]]) inn.place(s, id, i);
  inn.settle(s);
  const second = s.book[1];
  assert.deepEqual(second.declined, [{ id:'lina', reason:'full' }]);
  assert.equal(second.entries.length,6);
  assert.equal(second.fee,280);
  assert.equal(second.praise,5);
  assert.equal(second.entries.find(e => e.id === 'yuki').details[0].reason, 'noEast');
  inn.advance(s);
  assert.deepEqual(s.beds.map(b => b?.id ?? null), [null,null,null,'noa','mio','tao']);
  for (const [id, i] of [['zhi',2], ['jo',0], ['kit',1]]) inn.place(s,id,i);
  inn.settle(s); inn.advance(s);
  assert.equal(s.phase,'done');
  assert.equal(s.book.length,3);
  assert.deepEqual(s.book.map(n => [n.fee,n.praise]), [[170,4],[280,5],[320,6]]);
  assert.equal(inn.advance(s),false);
  assert.equal(inn.settle(s),false);
});

test('zero bookings still settle; advance keeps an empty inn empty', () => {
  const s = inn.create();
  for (let d = 0; d < 3; d++) {
    inn.settle(s);
    assert.equal(s.book[d].fee,0);
    assert.equal(s.book[d].praise,0);
    assert.ok(s.book[d].declined.every(e => e.reason === 'unplaced'));
    inn.advance(s);
  }
  assert.equal(s.phase, 'done');
});

test('later mornings have conflicting requests even if all rooms are vacant', () => {
  for (const day of [1,2]) {
    const s = inn.create();
    s.day = day;
    let layouts = 0;
    let perfect = 0;
    function enumerate(at) {
      if (at === inn.arrivals[day].length) {
        layouts++;
        if (s.beds.every((stay,i) => !stay || inn.assessment(s,i).every(d => d.ok))) perfect++;
        return;
      }
      const { id } = inn.arrivals[day][at];
      for (let i=0; i<6; i++) {
        if (s.beds[i]) continue;
        inn.place(s,id,i);
        enumerate(at+1);
        inn.remove(s,id);
      }
    }
    enumerate(0);
    assert.equal(layouts,720);
    assert.equal(perfect,0);
  }
});
