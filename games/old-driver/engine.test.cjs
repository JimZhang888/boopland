/* Run: node games/old-driver/engine.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('./engine.js');
let count = 0;
function test(name, action) { action(); count++; console.log(`PASS ${name}`); }
function run(game, seconds, input = {}, dt = 1 / 60) {
  for (let time = 0; time < seconds - 1e-9; time += dt) game.step(Math.min(dt, seconds - time), input);
}
test('all eight starts and goal poses are collision-free', () => {
  assert.equal(E.levels.length, 8);
  E.levels.forEach((level, index) => {
    assert.equal(E.collision({ ...level.start }, level), false, `start ${index}`);
    assert.equal(E.collision({ ...level.target }, level), false, `goal ${index}`);
  });
});
test('a real straight drive, brake and hold earns three stars', () => {
  const game = new E.Game(); game.start();
  run(game, 4.75, { throttle: 1 }); run(game, 2, { brake: true });
  assert.equal(game.status, 'won'); assert.equal(game.hits, 0); assert.equal(game.result.stars, 3);
});
test('reverse lesson can be completed using reverse and brake', () => {
  const game = new E.Game(2); game.start();
  run(game, 4.08, { throttle: -1 }); run(game, 2, { brake: true });
  assert.equal(game.status, 'won'); assert.equal(game.result.stars, 3); assert.equal(game.car.lastDirection, -1);
});
test('every goal accepts correct parking, but not forward entry on reverse lessons', () => {
  E.levels.forEach((level, index) => {
    const game = new E.Game(index); game.start(); Object.assign(game.car, level.target, { speed: 0, lastDirection: -1 });
    run(game, 1); assert.equal(game.status, 'playing'); run(game, 0.3); assert.equal(game.status, 'won');
    if (level.target.reverse) {
      game.reset(index); game.start(); Object.assign(game.car, level.target, { speed: 0, lastDirection: 1 });
      run(game, 2); assert.equal(game.status, 'playing'); assert.equal(game.hold, 0);
    }
  });
});
test('goal rejects partial overlap, wrong direction and a moving car', () => {
  const game = new E.Game(), target = game.level.target;
  Object.assign(game.car, target, { speed: 0 }); assert.equal(E.parking(game.car, target).inside, true);
  game.car.y += 25; assert.equal(E.parking(game.car, target).inside, false);
  Object.assign(game.car, target, { angle: target.angle + Math.PI }); assert.equal(E.parking(game.car, target).aligned, false);
  Object.assign(game.car, target, { speed: 12 }); assert.equal(E.parking(game.car, target).stopped, false);
});
test('steering does not rotate a parked car; reverse steering changes yaw sign', () => {
  const game = new E.Game(); game.start(); run(game, 1, { steering: 1 }); assert.equal(game.car.angle, 0);
  run(game, 0.5, { steering: 1, throttle: 1 }); assert(game.car.angle > 0);
  game.reset(); game.start(); run(game, 0.5, { steering: 1, throttle: -1 }); assert(game.car.angle < 0);
});
test('collision stops penetration, does not repeat while stuck, and allows reversing out', () => {
  const game = new E.Game(); game.start(); game.car.x = 735; game.car.y = 300;
  run(game, 2, { throttle: 1 }); assert.equal(game.hits, 1); assert.equal(E.collision(game.car, game.level), false);
  run(game, 3, { throttle: 1 }); assert.equal(game.hits, 1);
  run(game, 0.7, { throttle: -1 }); assert(game.car.x < 735); assert.equal(game.contact, null);
  run(game, 2, { throttle: 1 }); assert.equal(game.hits, 2);
});
test('five distinct collisions end a run', () => {
  const game = new E.Game(); game.start(); game.car.x = 735; game.car.y = 300;
  for (let i = 0; i < 5; i++) { run(game, 2, { throttle: 1 }); if (i < 4) run(game, 0.7, { throttle: -1 }); }
  assert.equal(game.hits, 5); assert.equal(game.status, 'failed');
});
test('pause freezes pose and time; timeout ends the run', () => {
  const game = new E.Game(); game.start(); run(game, 0.3, { throttle: 1 }); game.pause();
  const frozen = JSON.stringify(game); run(game, 10, { throttle: 1 }); assert.equal(JSON.stringify(game), frozen);
  game.start(); game.elapsed = game.level.limit - 0.1; run(game, 0.2); assert.equal(game.status, 'failed');
});
test('simulation is consistent across 30, 60 and 120 fps', () => {
  const states = [30, 60, 120].map(fps => { const game = new E.Game(); game.start(); run(game, 1, { throttle: 1, steering: 0.2 }, 1 / fps); return game.car; });
  states.slice(1).forEach(car => { assert(Math.abs(car.x - states[0].x) < 0.1); assert(Math.abs(car.y - states[0].y) < 0.1); });
});
test('eight languages cover every static and dynamic key', () => {
  let messages;
  vm.runInNewContext(fs.readFileSync(`${__dirname}/translations.js`, 'utf8'), { BooplandI18n: { register: (scope, entries) => { assert.equal(scope, 'driver'); messages = entries; } } });
  assert.equal(Object.keys(messages).length, 8);
  const keys = Object.keys(messages['zh-CN']).sort();
  Object.entries(messages).forEach(([language, dictionary]) => {
    assert.deepEqual(Object.keys(dictionary).sort(), keys, language);
    for (const key of keys) assert.equal(typeof dictionary[key], 'string');
  });
  const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="driver\.([^"]+)"/g)) assert(keys.includes(key), key);
  E.levels.forEach(level => assert(keys.includes(`${level.id}Hint`)));
});
console.log(`${count} checks passed.`);
