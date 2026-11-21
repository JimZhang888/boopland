'use strict';
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const engine = runInNewContext(readFileSync(join(__dirname, 'fleet.js'), 'utf8') + '\nGridFleet');
const { lengths, footprint, placement, randomFleet, chooseShot, createMatch } = engine;

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const fleet = [{ bow:17, vertical:false }, { bow:21, vertical:true }, { bow:50, vertical:false }];
const patrolAtTop = [{ bow:0, vertical:false }, { bow:4, vertical:false }, { bow:7, vertical:true }];

test('every bow and direction fits exactly or is rejected; ships never wrap, overlap or leave the map', () => {
  for (let i = 0; i < lengths.length; i++) {
    for (let cell = 0; cell < 64; cell++) {
      for (const vertical of [false, true]) {
        const room = 8 - (vertical ? Math.floor(cell / 8) : cell % 8);
        const body = footprint(i, cell, vertical);
        assert.equal(body.length, room < lengths[i] ? 0 : lengths[i]);
        assert.ok(body.every(c => c >= 0 && c < 64));
      }
    }
    for (const cell of [-1, 64, 1.3]) assert.equal(footprint(i, cell, false).length, 0);
  }
  assert.equal(placement(fleet, 0, 17, false), 'ok');
  assert.equal(placement(fleet, 0, 18, false), 'overlap');
  assert.equal(placement(fleet, 0, 6, false), 'edge');
  assert.equal(placement(fleet, 1, 56, true), 'edge');
  assert.throws(() => createMatch(fleet, [fleet[0], fleet[0], fleet[2]]));
  for (let seed = 1; seed <= 1000; seed++) {
    const generated = randomFleet(seeded(seed));
    const occupied = generated.flatMap((s, i) => footprint(i, s.bow, s.vertical));
    assert.equal(new Set(occupied).size, 9);
    assert.ok(generated.every((s, i) => placement(generated, i, s.bow, s.vertical) === 'ok'));
  }
});

test('repeat and out-of-turn input do not spend a turn; the last hit ends the match before another reply', () => {
  const game = createMatch(fleet, patrolAtTop);
  assert.equal(game.reply(), null);
  assert.equal(game.fire(64), null);
  assert.equal(game.fire(0).kind, 'hit');
  assert.equal(game.fire(1), null);
  game.reply(() => 0);
  assert.equal(game.fire(0), null);
  assert.equal(game.turn, 0);
  assert.equal(game.history(0).length, 1);
  for (const cell of [1,2,3,4,5,6,7]) {
    game.fire(cell);
    game.reply(() => 0);
  }
  const last = game.fire(15);
  assert.equal(last.kind, 'sunk');
  assert.deepEqual([...last.sunkCells], [7,15]);
  assert.equal(game.winner, 0);
  assert.equal(game.reply(), null);
  assert.equal(game.fire(20), null);
  assert.equal(game.history(1).length, 8);
});

test('search follows orthogonal hits, extends a line and retires only confirmed sunken cells', () => {
  const hit = cell => ({cell, kind:'hit'});
  const miss = cell => ({cell, kind:'miss'});
  for (let n=0; n<100; n++) {
    const random = seeded(n*1597);
    assert.ok([1,8].includes(chooseShot([hit(0)], random)));
    assert.ok([8,17].includes(chooseShot([hit(9),miss(1),miss(10)], random)));
    assert.ok([9,12].includes(chooseShot([hit(10),hit(11)], random)));
    assert.ok([2,9].includes(chooseShot([hit(1),hit(8),{cell:0,kind:'sunk',sunkCells:[0,8]}], random)));
  }
});

test('identical reports give the same next shot even with different hidden fleets', () => {
  const a = createMatch(fleet, patrolAtTop);
  const b = createMatch([{bow:26,vertical:false},{bow:40,vertical:false},fleet[2]], patrolAtTop);
  for (const cell of [62,63,61,60]) {
    a.fire(cell);
    b.fire(cell);
    assert.deepEqual(a.reply(() => 0), b.reply(() => 0));
  }
});

test('computer wins immediately on its final hit, never shoots twice at a cell and never sees an unreported ship', () => {
  const game = createMatch(fleet, patrolAtTop);
  const random = seeded(461);
  const enemyWater = Array.from({length:64}, (_,i)=>i).filter(c => !patrolAtTop.some((s,i)=>footprint(i,s.bow,s.vertical).includes(c)));
  while (game.winner === null) {
    assert.ok(enemyWater.length > 0);
    game.fire(enemyWater.pop());
    const log = game.history(1);
    const response = game.reply(random);
    assert.ok(!log.some(r => r.cell === response.cell));
    assert.equal(Object.keys(response).sort().join(','), response.kind === 'sunk' ? 'cell,kind,sunkCells' : 'cell,kind');
  }
  assert.equal(game.winner, 1);
  assert.equal(game.history(1).at(-1).kind, 'sunk');
  assert.equal(game.fire(0), null);
  assert.equal(game.reply(), null);
});
