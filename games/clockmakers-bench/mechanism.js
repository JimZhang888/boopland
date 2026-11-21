/* One unit is one tooth module. Pitch radius is half the tooth count. */
(() => {
  'use strict';
  const fixed = (id, x, y, teeth, plane = 0) => ({
    id, x, y, fixed: true, initial: plane ? [0, teeth] : [teeth]
  });
  const socket = (id, x, y, choices, initial = []) => ({id, x, y, choices, initial});
  const ticket = (nodes, inputTurns, handTurns) => ({nodes, inputTurns, handTurns});

  // Intersection of the two pitch-distance circles, used for the two routes in order III.
  function elbow(a, b, fromA, fromB, side) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    const along = (fromA ** 2 - fromB ** 2 + d ** 2) / (2 * d);
    const across = side * Math.sqrt(fromA ** 2 - along ** 2);
    return [(a.x * d + along * dx - across * dy) / d,
            (a.y * d + along * dy + across * dx) / d];
  }
  const left = fixed('D', -17, 0, 18), right = fixed('H', 17, 0, 24);
  const lower = {x: -8, y: 12};
  const singles = [[12], [18], [24]];
  const pairs = [[20, 16], [12, 24], [20, 12]];
  const orders = [
    ticket([fixed('D', -12, 0, 16), socket('H', 12, 0, [[24], [32], [36]], [24])], 2, -1),
    ticket([fixed('D', -19, 0, 16), socket('A', -1, 0, [[16], [20], [24]]),
      fixed('H', 19.8, -15.6, 32)], 2, 1),
    ticket([left, socket('A', ...elbow(left, right, 21, 24, -1), singles),
      socket('B', lower.x, lower.y, singles), socket('C', ...elbow(lower, right, 15, 21, 1), singles), right], 4, -3),
    ticket([fixed('D', -19, 6, 16), socket('A', 1, 6, [[24], [24, 12], [12, 24]]),
      fixed('H', 18.6, -7.2, 32, 1)], 4, 1),
    ticket([fixed('D', -20, 7, 16), socket('A', 0, 7, [[24, 15], [24, 16]], [24, 15]),
      socket('H', 19.2, -7.4, [[0, 32], [0, 33]], [0, 33])], 3, 1),
    ticket([fixed('D', -23, 7, 12), socket('A', -13.4, -5.8, pairs),
      socket('B', 6.6, -5.8, pairs), socket('H', 21, 5, [[20], [24], [28]], [20])], 5, -1)
  ];

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function fraction(n, d = 1) {
    const g = gcd(Math.abs(n), d);
    return {n: n / g, d: d / g};
  }
  const multiply = (f, n, d = 1) => fraction(f.n * n, f.d * d);
  const equal = (a, b) => a.n === b.n && a.d === b.d;
  const initial = order => order.nodes.map(node => node.initial.slice());

  function inspect(order, fitted) {
    const {nodes, inputTurns, handTurns} = order;
    const edges = nodes.map(() => []);
    let clash = null;
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[b].x - nodes[a].x, dy = nodes[b].y - nodes[a].y;
        const distance = Math.hypot(dx, dy);
        for (let plane = 0; plane < 2; plane++) {
          const za = fitted[a][plane], zb = fitted[b][plane];
          if (!za || !zb) continue;
          // Tolerance only absorbs floating-point coordinate error, never a tooth.
          const gap = distance - (za + zb) / 2;
          if (gap < -1e-6) clash ??= [a, b];
          if (Math.abs(gap) > 1e-6) continue;
          const angle = Math.atan2(dy, dx);
          edges[a].push({to: b, za, zb, angle});
          edges[b].push({to: a, za: zb, zb: za, angle: angle + Math.PI});
        }
      }
    }
    // Each node is one rigid shaft. Only external meshes reverse rotation.
    const rates = nodes.map(() => null), phase = nodes.map(() => 0);
    const queue = [0];
    rates[0] = fraction(1);
    for (let k = 0; k < queue.length; k++) {
      const from = queue[k];
      for (const {to, za, zb, angle} of edges[from]) {
        const rate = multiply(rates[from], -za, zb);
        if (rates[to]) {
          if (!equal(rates[to], rate)) clash ??= [from, to];
          continue;
        }
        rates[to] = rate;
        phase[to] = angle + Math.PI - Math.PI / zb + (angle - phase[from]) * za / zb;
        queue.push(to);
      }
    }
    const hand = rates[nodes.length - 1];
    const measured = hand && multiply(hand, inputTurns);
    let result = 'ok';
    if (clash) result = 'jam';
    else if (!measured) result = 'gap';
    else if (Math.sign(measured.n) !== Math.sign(handTurns)) result = 'direction';
    else if (!equal(measured, fraction(handTurns))) result = 'ratio';
    return {result, rates, phase, measured, clash};
  }
  window.ClockBench = {orders, initial, inspect};
})();
