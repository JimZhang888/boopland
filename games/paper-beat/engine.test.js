'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TRACKS, Round, chart } = require('./engine.js');

test('all charts introduce holds and alternation gradually, with no overlapping same-lane notes', () => {
  for (const track of TRACKS) {
    const { notes, duration, beat } = chart(track);
    assert.ok(notes.length > 50);
    assert.ok(notes.every(n => n.end < duration));
    assert.ok(notes.filter(n => n.time < 24 * beat).every(n => !n.hold));
    assert.ok(notes.some(n => n.hold && n.time >= 24 * beat));
    assert.deepEqual(notes.filter(n => n.time >= 48 * beat && n.time < 55 * beat).map(n => n.lane), [0, 1, 0, 1, 0, 1, 0]);
    for (const lane of [0, 1]) {
      const laneNotes = notes.filter(n => n.lane === lane);
      for (let i = 1; i < laneNotes.length; i++) assert.ok(laneNotes[i].time > laneNotes[i - 1].end + 0.16);
    }
  }
});
test('an entire perfect playthrough finishes every note including holds, and earns full combo', () => {
  for (const track of TRACKS) {
    const round = new Round(track);
    for (const note of round.notes) {
      round.press(note.lane, note.time);
      round.release(note.lane, note.hold ? note.end : note.time + 0.02);
    }
    round.update(round.duration);
    assert.equal(round.perfect, round.notes.length);
    assert.equal(round.misses, 0);
    assert.equal(round.accuracy, 100);
    assert.equal(round.fullCombo, true);
    assert.equal(round.maxCombo, round.notes.length);
    assert.ok(round.score > round.notes.length * 100);
  }
});
test('good timing scores less, wrong lanes and repeated key holds cannot farm notes', () => {
  const round = new Round(TRACKS[0]);
  round.press(1, 0); round.release(1, 0.01);
  assert.equal(round.strays, 1);
  assert.equal(round.notes[0].state, 'pending');
  round.press(0, 0.11);
  assert.equal(round.good, 1);
  assert.equal(round.score, 65);
  round.press(0, round.notes[1].time);
  round.update(round.notes[1].time + 0.2);
  assert.equal(round.notes[1].state, 'miss');
  assert.equal(round.score, 65);
  assert.equal(round.fullCombo, false);
});
test('early release breaks a hold, misses only once, and resets combo', () => {
  const round = new Round(TRACKS[0]);
  const hold = round.notes.find(n => n.hold);
  round.press(hold.lane, hold.time);
  assert.equal(hold.state, 'holding');
  const misses = round.misses;
  round.release(hold.lane, hold.time + 0.2);
  assert.equal(hold.state, 'miss');
  assert.equal(round.misses, misses + 1);
  assert.equal(round.combo, 0);
  round.update(hold.end);
  assert.equal(round.misses, misses + 1);
});
test('pausing a hold gives a re-grip window, re-grip scores once, failure to re-grip misses', () => {
  for (const regrip of [true, false]) {
    const round = new Round(TRACKS[0]), hold = round.notes.find(n => n.hold);
    round.press(hold.lane, hold.time); round.update(hold.time + 0.2); round.prepareResume();
    round.update(hold.time + 0.4);
    assert.equal(hold.state, 'holding');
    if (regrip) round.press(hold.lane, hold.time + 0.5);
    round.update(hold.end);
    assert.equal(hold.state, regrip ? 'hit' : 'miss');
    assert.equal(round.perfect, regrip ? 1 : 0);
  }
});
test('silence reaches a complete result with zero score and all notes missed', () => {
  const round = new Round(TRACKS[0]);
  round.update(round.duration);
  assert.equal(round.misses, round.notes.length);
  assert.equal(round.accuracy, 0);
  assert.equal(round.fullCombo, false);
  assert.equal(round.score, 0);
});
