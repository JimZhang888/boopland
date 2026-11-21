'use strict';
/* Run with node --test shore.test.cjs. The shipped game uses plain browser scripts. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');
const game = runInNewContext(readFileSync(join(__dirname, 'shore.js'), 'utf8') + ';Tidepool');

function collect(trip, spot) {
  const [species] = game.flats[trip.zone].spots[spot];
  assert.equal(game.inspect(trip, spot), 'sign');
  assert.equal(game.gather(trip, game.species[species]), 'caught');
}
test('one harvest per hole and four finds per bucket', () => {
  const trip = game.newTrip();
  collect(trip, 0);
  assert.equal(game.inspect(trip, 0), 'empty');
  assert.equal(game.gather(trip, 'spade'), 'choose');
  for (let index = 1; index < 4; index++) collect(trip, index);
  game.inspect(trip, 4);
  assert.equal(game.gather(trip, 'tongs'), 'full');
  assert.equal(trip.bucket.length, 4);
  assert.equal(trip.holes[0].length, 4);
  assert.equal(trip.left, 10);
});
test('return at the exact tide deadline banks all finds just once', () => {
  const trip = game.newTrip();
  game.move(trip, 2);
  for (let index = 0; index < 4; index++) collect(trip, index);
  assert.equal(trip.left, game.flats[2].walk);
  const result = game.back(trip);
  assert.equal(result.type, 'landed');
  assert.equal(result.kept.length, 4);
  assert.equal(trip.left, 0);
  assert.equal(game.back(trip), result);
  assert.equal(game.gather(trip, 'net'), 'finished');
});
test('high tide on the beach and late departure both release the catch', () => {
  for (const lateDeparture of [false, true]) {
    const trip = game.newTrip();
    game.move(trip, 2);
    collect(trip, 0);
    game.inspect(trip, 1);
    const remaining = lateDeparture ? game.flats[2].walk - 1 : 0;
    while (trip.left > remaining) assert.equal(game.gather(trip, 'spade'), 'wrong');
    if (lateDeparture) game.back(trip);
    assert.equal(trip.result.type, 'rescued');
    assert.equal(trip.result.kept.length, 0);
    assert.deepEqual([...trip.result.lost], ['hermit']);
  }
});
test('a lesson neither runs down the clock nor banks its specimen', () => {
  const trip = game.newTrip(true);
  assert.equal(game.inspect(trip, 1), 'teachSpot');
  game.inspect(trip, 0);
  for (let tryNumber = 0; tryNumber < 30; tryNumber++) game.gather(trip, 'net');
  assert.equal(trip.left, game.limit);
  collect(trip, 0);
  assert.equal(trip.tutorialStep, 2);
  assert.equal(game.back(trip).type, 'practised');
  assert.equal(trip.result.kept.length, 0);
});
test('all six species can reach shore, with separate holes on each flat', () => {
  const seen = new Set();
  for (let zone = 0; zone < game.flats.length; zone++) {
    const trip = game.newTrip();
    game.move(trip, zone);
    for (let index = 0; index < 4; index++) collect(trip, index);
    game.back(trip).kept.forEach(id => seen.add(id));
  }
  assert.equal(seen.size, 6);
  const trip = game.newTrip();
  collect(trip, 0);
  game.move(trip, 1);
  collect(trip, 0);
  game.move(trip, 0);
  assert.equal(game.inspect(trip, 0), 'empty');
});
