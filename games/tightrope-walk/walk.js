/* Angles are degrees. Each fixed step advances only the current crossing. */
const RopeWalk = (() => {
  'use strict';
  const routes = [
    { length: 24, speed: 1.7, strength: 32, interval: 6.8, duration: 2.45, winds: [1, -1, 1] },
    { length: 38, speed: 1.8, strength: 38, interval: 6.1, duration: 2.55, winds: [-1, 1, 1, -1] },
    { length: 56, speed: 1.9, strength: 43, interval: 5.6, duration: 2.65, winds: [1, -1, -1, 1, -1] }
  ];
  const limit = 46;
  const warning = 27;
  const safeLength = 4;
  const dt = 1 / 120;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function start(stage) {
    return { stage, route: routes[stage], angle: 0, velocity: 0, weight: 0, distance: 0,
      time: 0, windTime: 0, loss: 0, status: 'walking' };
  }
  function weather(s) {
    if (s.distance < safeLength) return { phase: 'safe', direction: 0, force: 0 };
    const r = s.route;
    const cycle = Math.floor(s.windTime / r.interval);
    const clock = s.windTime - cycle * r.interval;
    const direction = r.winds[cycle % r.winds.length];
    const lead = 2;
    if (clock < lead) return { phase: 'forecast', direction, force: 0 };
    if (clock < lead + r.duration) {
      const pulse = Math.sin(Math.PI * (clock - lead) / r.duration);
      return { phase: 'gust', direction, force: direction * r.strength * (.4 + .6 * pulse) };
    }
    return { phase: 'calm', direction: 0, force: 0 };
  }
  function step(s, input) {
    if (s.status !== 'walking') return;
    const safe = s.distance < safeLength;
    const wind = weather(s);
    s.weight += (clamp(input, -1, 1) - s.weight) * (1 - Math.exp(-7 * dt));
    const wobble = Math.sin(s.time * 2.45 + s.stage) * 2.8 + Math.sin(s.time * 4.8) * 1.5;
    // The sheltered span centres the walker. Outside it, a deep lean gathers momentum.
    const restoring = safe ? -4.1 * s.angle : -.43 * s.angle
      + Math.sign(s.angle) * Math.max(0, Math.abs(s.angle) - 16) * 1.43;
    s.velocity += (s.weight * (safe ? 31 : 66) + wind.force + wobble + restoring
      - s.velocity * (safe ? 3.4 : 1.48)) * dt;
    s.angle += s.velocity * dt;
    const tilt = Math.abs(s.angle) / limit;
    const speed = s.route.speed * (1 - .60 * Math.min(1, tilt) - .09 * Math.abs(s.weight));
    s.time += dt;
    s.loss += Math.min(1, tilt) * dt;
    if (!safe) s.windTime += dt;
    s.distance = Math.min(s.route.length, s.distance + speed * dt);
    if (tilt >= 1) s.status = 'fell';
    else if (s.distance >= s.route.length) s.status = 'crossed';
  }
  function reward(s) {
    const stability = Math.round(100 * (1 - s.loss / Math.max(dt, s.time)));
    const ideal = s.route.length / s.route.speed;
    const pace = clamp(1 - (s.time / ideal - 1) * 2.4, 0, 1);
    return { stability, time: s.time, points: Math.round(7 * stability + 300 * pace) };
  }
  return { routes, start, step, weather, reward, limit, warning, dt };
})();
