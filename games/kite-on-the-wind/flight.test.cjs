// Run with: node flight.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const flight = vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'flight.js'), 'utf8') + '; KiteFlight');

function pilot(s) {
  const gap = flight.courses[s.section].height - s.altitude;
  const correction = Math.max(-.24, Math.min(.26, gap * .036 - s.speed * .023));
  const desired = .5 + correction - (Math.abs(flight.wind(s.section, s.legTime)) - .43) * .22;
  if (s.tension < desired - .02) return 1;
  if (s.tension > desired + .02) return -1;
  return 0;
}

function simulate(s, control, stop = s => Boolean(s.outcome)) {
  for (let step = 0; step < 60 * 60; step++) {
    flight.advance(s, control(s));
    if (stop(s)) return;
    assert.equal(s.outcome, null, 'flight ended before the expected checkpoint');
  }
  assert.fail('expected checkpoint was not reached within one simulated minute');
}

for (const section of [null, 0, 1, 2]) {
  const first = flight.launch(section);
  simulate(first, pilot);
  assert.equal(first.outcome, 'finish');
  assert.equal(first.passed, section === null ? 3 : 1);
  const repeat = flight.launch(section);
  simulate(repeat, pilot);
  assert.deepEqual(first, repeat);
}

for (const [action, ending] of [[1, 'snap'], [-1, 'ground']]) {
  const lost = flight.launch();
  simulate(lost, () => action);
  assert.equal(lost.outcome, ending);
  const frozen = JSON.stringify(lost);
  flight.advance(lost, -action);
  assert.equal(JSON.stringify(lost), frozen, 'settled flights must stay settled');

  const rescued = flight.launch();
  simulate(rescued, () => action, s => action === 1 ? s.strain >= 1.2 : s.tension < .16);
  assert.equal(rescued.outcome, null);
  simulate(rescued, pilot);
  assert.equal(rescued.outcome, 'finish');
  assert.equal(rescued.passed, 3);
  console.log(ending, lost.elapsed.toFixed(2) + ' s', 'recovery passed');
}

const missed = flight.launch();
simulate(missed, () => 0, s => s.notice === 'missed');
assert.deepEqual([missed.passed, missed.section, missed.legTime], [0, 0, 0]);
simulate(missed, pilot);
assert.equal(missed.outcome, 'finish');
assert(flight.wind(2, 0) > 0 && flight.wind(2, 5) < 0);
assert(flight.wind(1, 3) - flight.wind(1, 0) > .5);
console.log('Full route, all practices, repeatability, recoveries and missed gate passed.');
