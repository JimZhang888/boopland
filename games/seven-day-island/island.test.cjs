const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('./island.js');

function play(route) {
  const state = game.newVoyage(game.TUTORIAL);
  for (const row of route) {
    row.forEach((job, i) => assert.ok(game.assign(state, i, job)));
    const dusk = game.forecast(state);
    assert.ok(game.endDay(state));
    assert.deepEqual(state.stock, dusk);
  }
  return state;
}

test('the route printed in the journal wins at the seventh sunset', () => {
  const state = play(game.tutorialRoute);
  assert.equal(state.result, 'escaped');
  assert.equal(state.survived, 7);
  assert.deepEqual(state.stock, {water:6, food:4, wood:2, raft:24});
});

test('each die has one job, reassignment only changes the plan', () => {
  const state = game.newVoyage();
  const original = {...state.stock};
  game.assign(state, 0, 'wood');
  const first = game.forecast(state);
  game.assign(state, 0, 'wood');
  assert.deepEqual(game.forecast(state), first);
  game.assign(state, 0, 'water');
  assert.equal(game.forecast(state).wood, original.wood);
  assert.deepEqual(state.stock, original);
  assert.equal(game.assign(state, 3, 'wood'), false);
  assert.equal(game.endDay(state), false);
  game.assign(state, 1, 'wood');
  game.assign(state, 2, 'build');
  assert.ok(game.endDay(state));
  assert.equal(game.endDay(state), false);
  assert.equal(state.day, 2);
});

test('gathering happens before construction; building is limited by timber', () => {
  const moreWood = play([['build', 'wood', 'wood']]);
  assert.equal(moreWood.stock.raft, 4);
  const noWood = play([['build', 'build', 'build']]);
  assert.equal(noWood.stock.raft, 2);
  assert.equal(noWood.stock.wood, 0);
});

test('running out of water overrides a completed raft on the same day', () => {
  const state = play([...game.tutorialRoute.slice(0, 5), ['build', 'food', 'wood'], ['food', 'build', 'food']]);
  assert.equal(state.day, 7);
  assert.equal(state.stock.raft, 24);
  assert.equal(state.stock.water, 0);
  assert.equal(state.result, 'depleted');
  assert.equal(state.survived, 6);
  assert.equal(game.assign(state, 0, 'water'), false);
  assert.equal(game.endDay(state), false);
});

test('food depletion also ends the voyage and only completed days count', () => {
  const state = play(Array(3).fill(['water', 'wood', 'build']));
  assert.ok(state.stock.water > 0);
  assert.equal(state.stock.food, 0);
  assert.equal(state.result, 'depleted');
  assert.equal(state.survived, 2);
});

test('after seven surviving days an unfinished raft misses the tide', () => {
  const state = play(Array(7).fill(['water', 'food', 'wood']));
  assert.equal(state.result, 'stranded');
  assert.equal(state.survived, 7);
  assert.equal(state.day, 7);
});

test('replaying a seed restores the dice, weather, stores and day', () => {
  assert.deepEqual(game.newVoyage(3811), game.newVoyage(3811));
  assert.notDeepEqual(game.newVoyage(3811).chart, game.newVoyage(3812).chart);
  const chart = game.newVoyage(3811).chart;
  assert.equal(chart.length, 7);
  for (const day of chart) {
    assert.equal(day.dice.length, 3);
    assert.ok(day.dice.every(n => Number.isInteger(n) && n >= 1 && n <= 6));
    assert.ok(game.costs[day.weather]);
  }
});
