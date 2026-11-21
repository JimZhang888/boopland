(() => {
  'use strict';
  const rink = { left: 27, right: 833, top: 26, bottom: 378, startX: 112, centerY: 202, targetX: 657, radius: 18 };
  const friction = 400;
  const radians = Math.PI / 180;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distanceForPower = power => 0.085 * power * power + 0.3 * power;
  function launchPoint(stones) {
    // A soft shot or a rebound can leave a cap on the launch mark.
    const spacing = 2 * rink.radius + 4;
    const spots = [0, -1, 1, -2, 2, -3, 3, -4, 4].map(offset => rink.centerY + offset * spacing);
    for (const x of [rink.startX, rink.startX - 4 * rink.radius]) {
      const y = spots.find(y => stones.every(stone => stone.removed ||
        Math.hypot(stone.x - x, stone.y - y) >= 2 * rink.radius));
      if (y !== undefined) return { x, y };
    }
  }

  function createStone(team, angle, power, origin) {
    const speed = Math.sqrt(2 * friction * distanceForPower(power));
    return { team, x: origin.x, y: origin.y, vx: Math.cos(angle * radians) * speed,
      vy: Math.sin(angle * radians) * speed, spin: 0, removed: false };
  }

  function collide(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const separation = Math.hypot(dx, dy);
    const overlap = 2 * rink.radius - separation;
    if (overlap <= 0) return;
    const nx = separation ? dx / separation : 1, ny = separation ? dy / separation : 0;
    a.x -= nx * overlap / 2;
    a.y -= ny * overlap / 2;
    b.x += nx * overlap / 2;
    b.y += ny * overlap / 2;
    const approaching = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (approaching <= 0) return;
    const impulse = approaching * 0.90;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
  }

  function step(stones, dt) {
    for (const stone of stones) {
      if (stone.removed) continue;
      const speed = Math.hypot(stone.vx, stone.vy);
      if (speed) {
        const nextSpeed = Math.max(0, speed - friction * dt);
        const distance = (speed + nextSpeed) * 0.5 * Math.min(dt, speed / friction);
        stone.x += stone.vx / speed * distance;
        stone.y += stone.vy / speed * distance;
        stone.spin += distance * (stone.team === 0 ? 0.4 : -0.4);
        stone.vx *= nextSpeed / speed;
        stone.vy *= nextSpeed / speed;
      }
      if (outside(stone)) stone.removed = true;
    }
    for (let i = 0; i < stones.length; i++) {
      if (stones[i].removed) continue;
      for (let j = i + 1; j < stones.length; j++) if (!stones[j].removed) collide(stones[i], stones[j]);
    }
    for (const stone of stones) if (outside(stone)) stone.removed = true;
    return stones.some(stone => !stone.removed && (stone.vx || stone.vy));
  }

  function outside(stone) {
    return stone.x < rink.left || stone.x > rink.right || stone.y < rink.top || stone.y > rink.bottom;
  }

  function measure(stones) {
    const distance = stone => Math.hypot(stone.x - rink.targetX, stone.y - rink.centerY);
    const inPlay = stones.filter(stone => !stone.removed);
    const nearest = Math.min(...inPlay.map(distance));
    const leaders = inPlay.filter(stone => distance(stone) <= nearest + 0.001);
    const winner = leaders.length && leaders.every(stone => stone.team === leaders[0].team)
      ? leaders[0].team : null;
    return { leaders, winner };
  }

  window.DeskCurling = { rink, clamp, launchPoint, createStone, step, measure };
})();
