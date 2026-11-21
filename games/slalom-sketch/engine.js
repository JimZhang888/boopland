(() => {
  'use strict';
  const STEP = 1 / 120;
  const PENALTY = 3;
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
  function course(id, speed, finish, gateData, driftData) {
    return {
      id, speed, finish,
      gates: gateData.map(([y, x, width]) => ({ y, x, width })),
      drifts: driftData.map(([y, x, radius]) => ({ y, x, radius }))
    };
  }
  const courses = [
    course('meadow', 63, 870,
      [[115,-48,96],[244,64,91],[381,-62,89],[511,55,87],[648,-57,84],[778,29,83]],
      [[184,-99,16],[323,88,20],[456,3,14],[590,96,19],[711,-88,17]]),
    course('pines', 68, 1015,
      [[115,43,76],[222,-49,73],[332,57,70],[440,-43,70],[546,56,68],[648,-48,69],[755,48,67],[865,-52,66],[957,10,66]],
      [[164,89,17],[279,-94,18],[389,4,14],[494,-91,17],[598,101,17],[700,-12,14],[809,91,18],[920,-93,16]]),
    course('pass', 71, 1150,
      [[110,-46,88],[237,62,81],[361,3,79],[483,-61,76],[609,60,72],[727,-45,68],[834,50,62],[931,-25,57],[1020,43,50],[1103,-12,46]],
      [[185,-100,20],[306,78,21],[421,19,15],[549,-94,21],[671,89,18],[778,-91,20],[878,7,14],[975,-60,15],[1060,62,12]])
  ];
  function edges(c, y) {
    const taper = c.id === 'pass' ? clamp((y - 580) / 530, 0, 1) : 0;
    const centre = 9 * Math.sin(y / 138) + 4 * Math.sin(y / 63 + 0.45);
    const half = 151 - taper * 74 + 5 * Math.sin(y / 91 + 0.8);
    return [centre - half, centre + half];
  }
  function createRun(c) {
    return {
      course:c, x:0, y:0, angle:0, elapsed:0, next:0, passed:0, penalty:0,
      results:[], hit:new Set(), slow:0, finished:false, trail:[{x:0,y:0,angle:0}],
      feedback:null, serial:0
    };
  }
  function notice(s, kind) {
    s.feedback = { kind, until:s.elapsed + 1.05, id:++s.serial };
  }
  // Gates are horizontal segments. Only a downhill crossing consumes the next gate.
  function checkGates(s, from, to) {
    if (to.y <= from.y) return;
    while (s.next < s.course.gates.length) {
      const g = s.course.gates[s.next];
      if (from.y >= g.y || to.y < g.y) break;
      const fraction = (g.y - from.y) / (to.y - from.y);
      const x = from.x + (to.x - from.x) * fraction;
      const inside = Math.abs(x - g.x) <= g.width / 2;
      s.results.push(inside);
      s.next++;
      if (inside) s.passed++;
      else s.penalty += PENALTY;
      notice(s, inside ? 'clean' : 'miss');
    }
  }
  function step(s, steering, dt = STEP) {
    if (s.finished) return;
    const c = s.course;
    const from = { x:s.x, y:s.y };
    const target = clamp(steering, -1, 1) * 0.99;
    s.angle += (target - s.angle) * (1 - Math.exp(-dt * 4.9));
    const speed = c.speed * (1 - 0.51 * clamp(s.slow / 0.81, 0, 1));
    const used = Math.min(dt, (c.finish - s.y) / (speed * Math.cos(s.angle)));
    s.y = Math.min(c.finish, s.y + speed * Math.cos(s.angle) * used);
    const [left,right] = edges(c, s.y);
    s.x = clamp(s.x + Math.sin(s.angle) * speed * used, left + 5, right - 5);
    s.elapsed += used;
    s.slow = Math.max(0, s.slow - used);
    checkGates(s, from, s);
    for (let i = 0; i < c.drifts.length; i++) {
      const drift = c.drifts[i];
      if (s.hit.has(i) || Math.abs(s.y - drift.y) > drift.radius * 0.65 + 2) continue;
      const dx = (s.x - drift.x) / (drift.radius + 2);
      const dy = (s.y - drift.y) / (drift.radius * 0.65 + 2);
      if (dx * dx + dy * dy <= 1) {
        s.hit.add(i);
        s.slow = 1.25;
        notice(s, 'bump');
      }
    }
    if (s.y - s.trail[s.trail.length-1].y >= 2.7) s.trail.push({ x:s.x, y:s.y, angle:s.angle });
    if (s.y >= c.finish - 1e-8) s.finished = true;
  }
  const api = { STEP, PENALTY, courses, edges, createRun, checkGates, step };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.Slalom = api;
})();
