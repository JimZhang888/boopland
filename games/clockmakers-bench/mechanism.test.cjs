// Run with node --test games/clockmakers-bench/mechanism.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {window: {}};
vm.runInNewContext(readFileSync(path.join(__dirname, 'mechanism.js'), 'utf8'), context);
const {orders, initial, inspect} = context.window.ClockBench;

function* assemblies(nodes, index = 0, fitted = []) {
  if (index === nodes.length) {
    yield fitted;
    return;
  }
  const shaft = nodes[index];
  const choices = shaft.fixed ? [shaft.initial] : [[], ...shaft.choices];
  for (const gear of choices) yield* assemblies(nodes, index + 1, [...fitted, gear]);
}

test('every repair order has a working train from its own parts drawer', () => {
  for (const [i, order] of orders.entries()) {
    let solutions = 0;
    for (const train of assemblies(order.nodes)) {
      const {result, measured} = inspect(order, train);
      if (result === 'ok') {
        solutions++;
        assert.equal(measured.n, order.handTurns);
        assert.equal(measured.d, 1);
      }
    }
    assert.ok(solutions, 'order ' + (i + 1));
  }
});

test('the pin spacing distinguishes a gap, a mesh and an oversized wheel', () => {
  const order = orders[0];
  assert.equal(inspect(order, initial(order)).result, 'gap');
  assert.equal(inspect(order, [[16], [32]]).result, 'ok');
  assert.equal(inspect(order, [[16], [36]]).result, 'jam');
});

test('the two routes at the station have equal speed and opposite direction', () => {
  const order = orders[2];
  const top = inspect(order, [[18], [24], [], [], [24]]);
  const bottom = inspect(order, [[18], [], [12], [18], [24]]);
  assert.equal(top.result, 'direction');
  assert.equal(top.measured.n, 3);
  assert.equal(bottom.result, 'ok');
  assert.equal(bottom.measured.n, -3);
});

test('matching distance on different layers cannot transmit power', () => {
  const order = orders[3];
  const wrongLayer = inspect(order, [[16], [24], [0,32]]);
  assert.equal(wrongLayer.result, 'gap');
  assert.ok(wrongLayer.rates[1]);
  assert.equal(wrongLayer.rates[2], null);
  const paired = inspect(order, [[16], [24,12], [0,32]]);
  assert.equal(paired.result, 'ok');
  assert.equal(paired.rates[1].n / paired.rates[1].d, -2 / 3);
  assert.equal(paired.rates[2].n / paired.rates[2].d, 1 / 4);
});

test('a fully connected chronometer at ten elevenths is still a failed repair', () => {
  const order = orders[4], close = inspect(order, initial(order));
  assert.equal(close.result, 'ratio');
  assert.equal(close.measured.n, 10);
  assert.equal(close.measured.d, 11);
  assert.equal(inspect(order, [[16], [24,16], [0,32]]).result, 'ok');
});

test('the theatre train uses two shared shafts and returns to the lower layer', () => {
  const repaired = inspect(orders[5], [[12], [20,16], [12,24], [24]]);
  assert.equal(repaired.result, 'ok');
  assert.equal(repaired.rates[3].n / repaired.rates[3].d, -1 / 5);
});
