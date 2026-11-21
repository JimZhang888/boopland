const { test } = require('node:test');
const assert = require('node:assert/strict');
const Act = require('./engine.js');

function waitFor(act, condition) {
  for (let frame = 0; frame < 600 && !act.ended; frame++) {
    if (condition()) return;
    act.advance(1/120);
  }
  assert.fail('Expected event did not arrive.');
}
function firstFour(act) {
  for (let i = 0; i < 4; i++) {
    waitFor(act, () => Act.inZone(act.balls[0]));
    assert.equal(act.catch(i%2), 0);
  }
}

test('the first ball crosses left; early, wrong-side and repeated presses do not score', () => {
  const act = new Act();
  assert.equal(act.catch(0), null);
  waitFor(act, () => Act.inZone(act.balls[0]));
  assert.equal(act.catch(1), null);
  assert.equal(act.catch(0), 0);
  assert.equal(act.catch(0), null);
  assert.equal(act.score, 1);
});
test('both hands can catch the first pair on the same tick in either order', () => {
  for (const order of [[0,1],[1,0]]) {
    const act = new Act();
    firstFour(act);
    assert.equal(act.score, 10);
    waitFor(act, () => act.balls.every(Act.inZone));
    assert.equal(Act.position(act.balls[0]).x, 0);
    assert.equal(Act.position(act.balls[1]).x, 1);
    for (const side of order) assert.notEqual(act.catch(side), null);
    assert.equal(act.streak,6);
    assert.equal(act.score,21);
  }
});
test('the third prop joins at catch twelve; continuous play reaches full speed', () => {
  const act=new Act();
  while (act.catches<72) {
    waitFor(act,()=>act.balls.some(Act.inZone));
    for (const side of [0,1]) {
      act.catch(side);
      if (act.catches<4) assert.equal(act.balls.length,1);
      else if (act.catches<12) assert.equal(act.balls.length,2);
      else assert.equal(act.balls.length,3);
    }
  }
  assert.equal(act.drops,0);
  assert.equal(act.tempo,1.02);
  assert.deepEqual(act.balls.map(b=>b.id),[0,1,2]);
});
test('a missed ball clears the streak, retains score/identity and is served again', () => {
  const act=new Act();
  firstFour(act);
  waitFor(act,()=>act.balls.every(Act.inZone));
  act.catch(0);
  waitFor(act,()=>act.drops===1);
  const missed = act.balls[1];
  assert.equal(missed.phase,'dropped');
  assert.equal(act.streak,0);
  assert.equal(act.score,15);
  waitFor(act,()=>missed.phase==='flight');
  assert.equal(missed.id,1);
  assert.equal(act.balls.length,2);
  waitFor(act,()=>Act.inZone(act.balls[0]));
  act.catch(1);
  assert.equal(act.score,16);
});
test('three drops end the act exactly once, and a new act restores the initial speed', () => {
  const act=new Act();
  firstFour(act);
  while(!act.ended) act.advance(1/60);
  const snapshot=JSON.stringify(act);
  act.advance(.5);
  assert.equal(act.catch(0),null);
  assert.equal(JSON.stringify(act),snapshot);
  assert.equal(act.drops,3);
  const next=new Act();
  assert.equal(next.balls.length,1);
  assert.equal(next.tempo,1.55);
  assert.equal(next.balls[0].duration,next.tempo);
  assert.equal(next.score+next.streak+next.drops,0);
});
