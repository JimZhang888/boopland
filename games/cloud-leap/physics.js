(function (root) {
  'use strict';
  const MAX_CHARGE_MS = 1200;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const chargePower = ms => clamp(ms / MAX_CHARGE_MS, 0, 1);
  const jumpDistance = power => 32 + clamp(power, 0, 1) * 420;
  function landingPoint(start, target, power) {
    const dx = target.x - start.x, dy = target.y - start.y;
    const len = Math.hypot(dx, dy) || 1, distance = jumpDistance(power);
    return { x: start.x + dx / len * distance, y: start.y + dy / len * distance };
  }
  function classifyLanding(point, platform) {
    const normalized = Math.hypot((point.x - platform.x) / platform.rx, (point.y - platform.y) / platform.ry);
    return normalized <= .25 ? 'perfect' : normalized <= .94 ? 'safe' : 'miss';
  }
  const idealPower = (start, target) => clamp((Math.hypot(target.x - start.x, target.y - start.y) - 32) / 420, 0, 1);
  const api = Object.freeze({ MAX_CHARGE_MS, clamp, chargePower, jumpDistance, landingPoint, classifyLanding, idealPower });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CloudLeapPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
