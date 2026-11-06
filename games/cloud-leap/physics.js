(function (root) {
  'use strict';
  const MAX_CHARGE_MS = 1200;
  // These radii also draw the flower's scoring ring on the island surface.
  const PERFECT_RX = 25, PERFECT_RY = 10;
  const EDGE_EPSILON = 1e-9;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const chargePower = ms => clamp(ms / MAX_CHARGE_MS, 0, 1);
  const jumpDistance = power => 32 + clamp(power, 0, 1) * 420;
  function landingPoint(start, target, power) {
    const dx = target.x - start.x, dy = target.y - start.y;
    const len = Math.hypot(dx, dy) || 1, distance = jumpDistance(power);
    return { x: start.x + dx / len * distance, y: start.y + dy / len * distance };
  }
  function classifyLanding(point, platform) {
    const dx = point.x - platform.x, dy = point.y - platform.y;
    const surface = Math.hypot(dx / platform.rx, dy / platform.ry);
    if (surface > 1 + EDGE_EPSILON) return 'miss';
    return Math.hypot(dx / PERFECT_RX, dy / PERFECT_RY) <= 1 + EDGE_EPSILON ? 'perfect' : 'safe';
  }
  const idealPower = (start, target) => clamp((Math.hypot(target.x - start.x, target.y - start.y) - 32) / 420, 0, 1);
  function landingPowerRange(start, target) {
    const dx = target.x - start.x, dy = target.y - start.y;
    const distance = Math.hypot(dx, dy);
    if (!distance) return { min: 0, max: 0 };
    // The jump aims through the centre; intersect that line with the visible ellipse.
    const radius = distance / Math.hypot(dx / target.rx, dy / target.ry);
    return { min: clamp((distance - radius - 32) / 420, 0, 1), max: clamp((distance + radius - 32) / 420, 0, 1) };
  }
  const api = Object.freeze({ MAX_CHARGE_MS, PERFECT_RX, PERFECT_RY, clamp, chargePower, jumpDistance, landingPoint, classifyLanding, idealPower, landingPowerRange });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CloudLeapPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
