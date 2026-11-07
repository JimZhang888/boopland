(function () {
  'use strict';
  const E = window.RopeGarden;
  const ink = '#69725c', sage = '#b7c6a2', gold = '#d6b76a', rose = '#d5a58f';
  class Scene {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.particles = []; this.trail = [];
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    }
    resize(width, height) {
      this.scale = Math.max(.01, Math.min(width / E.WIDTH, height / E.HEIGHT));
      const w = E.WIDTH * this.scale, h = E.HEIGHT * this.scale, dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(this.canvas.width / E.WIDTH, 0, 0, this.canvas.height / E.HEIGHT, 0, 0);
    }
    point(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (clientX - r.left) * E.WIDTH / r.width, y: (clientY - r.top) * E.HEIGHT / r.height };
    }
    reset() { this.particles = []; this.trail = []; }
    burst(event) {
      if (this.reduced.matches) return;
      const amount = event.type === 'won' ? 28 : event.type === 'cut' ? 6 : 12;
      for (let i = 0; i < amount; i++) {
        const angle = i * Math.PI * 2 / amount;
        this.particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * (30 + Math.random() * 70), vy: Math.sin(angle) * 80 - 30, life: 1, color: event.type === 'star' ? gold : event.type === 'lost' ? rose : ['#b5c2a1', '#d3b06c', '#c7a78f'][i % 3], size: event.type === 'won' ? 5 : 3 });
      }
    }
    path(points, color = ink, width = 1.5, fill) {
      const c = this.ctx; c.beginPath(); points(c); c.lineWidth = width; c.strokeStyle = color;
      if (fill) { c.fillStyle = fill; c.fill(); } if (color) c.stroke();
    }
    ellipse(x, y, rx, ry, fill, stroke = ink, angle = 0) {
      this.path(c => c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2), stroke, 1.4, fill);
    }
    star(x, y, radius, fill, angle = 0) {
      this.path(c => { for (let i = 0; i < 10; i++) { const a = angle - Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * .46 : radius; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }, '#ac9156', 1.4, fill);
    }
    plant(x, y, size, flip = 1) {
      const c = this.ctx; c.save(); c.translate(x, y); c.scale(flip * size, size);
      this.path(p => { p.moveTo(0, 0); p.quadraticCurveTo(-6, -23, 2, -43); }, '#9eae8b', 1.2);
      this.path(p => { p.moveTo(-1, -13); p.quadraticCurveTo(-27, -16, -24, -31); p.quadraticCurveTo(-6, -30, -1, -13); }, '#a6b392', 1, '#e2e8d7');
      this.path(p => { p.moveTo(-1, -28); p.quadraticCurveTo(20, -30, 19, -43); p.quadraticCurveTo(2, -44, -1, -28); }, '#a6b392', 1, '#e2e8d7');
      c.restore();
    }
    background(state, clock) {
      const c = this.ctx;
      this.path(p => { p.moveTo(24, 527); p.bezierCurveTo(170, 514, 365, 537, 575, 522); }, '#cbd2bc', 1.2);
      this.path(p => { p.moveTo(30, 533); p.bezierCurveTo(170, 524, 360, 545, 566, 531); }, '#e0e4d4', 1);
      this.plant(61, 519, 1.2); this.plant(544, 520, .9, -1); this.plant(94, 526, .52, -1);
      // Little pencil daisies at the edge of the page.
      for (const [x, y, r] of [[510, 505, 5], [524, 515, 4], [35, 516, 4]]) {
        this.path(p => { p.moveTo(x, y + 19); p.quadraticCurveTo(x - 3, y + 9, x, y); }, '#a5b092', 1);
        for (let j = 0; j < 5; j++) { const a = j * Math.PI * 2 / 5; this.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * .65, r * .42, '#fcf9ed', '#bdc4ac', a); }
        this.ellipse(x, y, 2.6, 2.6, '#cfb879', '#b7a36a');
      }
      c.save(); c.globalAlpha = .6;
      this.path(p => { p.moveTo(40, 90); p.bezierCurveTo(34, 79, 50, 72, 56, 78); p.bezierCurveTo(57, 61, 83, 60, 87, 78); p.bezierCurveTo(101, 74, 111, 92, 100, 94); p.quadraticCurveTo(71, 99, 40, 94); }, '#c2cab5', 1, '#f2f3e8');
      this.path(p => { p.moveTo(497, 127); p.bezierCurveTo(483, 121, 496, 105, 507, 113); p.bezierCurveTo(511, 93, 536, 97, 537, 113); p.bezierCurveTo(554, 110, 560, 128, 549, 130); p.quadraticCurveTo(521, 135, 497, 127); }, '#c2cab5', 1, '#f2f3e8');
      c.restore();
      if (state.level.wind) {
        const shift = this.reduced.matches ? 0 : (clock * 14) % 22;
        c.save(); c.setLineDash([12, 7]); c.lineDashOffset = -shift;
        for (let i = 0; i < 3; i++) this.path(p => { p.moveTo(42, 192 + i * 21); p.quadraticCurveTo(80, 184 + i * 21, 114 + i * 9, 192 + i * 21); }, '#a8b6af', 1.5);
        c.restore(); this.path(p => { p.moveTo(121, 227); p.lineTo(132, 234); p.lineTo(120, 239); }, '#a8b6af', 1.5);
      }
    }
    rabbit(state, clock) {
      const c = this.ctx, [x, y] = state.level.goal;
      const won = state.status === 'won';
      const near = Math.hypot(state.candy.x - x, state.candy.y - y) < 150;
      const bob = this.reduced.matches || state.paused ? 0 : Math.sin(clock * 2.1) * 1.2;
      c.save(); c.translate(x, y);
      this.ellipse(0, 48, 56, 7, '#dce2ce88', null);
      if (y < 430) {
        this.path(p => { p.moveTo(-54, 46); p.quadraticCurveTo(0, 41, 54, 46); p.lineTo(53, 56); p.quadraticCurveTo(0, 59, -53, 55); p.closePath(); }, '#9eab88', 1.6, '#e3e8d5');
        this.path(p => { p.moveTo(-43, 51); p.lineTo(45, 51); }, '#c0caaa', 1);
      }
      c.translate(0, bob);
      this.ellipse(-22, -45, 12, 34, '#c8d5b3', ink, -.25);
      this.ellipse(21, -46, 12, 33, '#c8d5b3', ink, .24);
      this.path(p => { p.moveTo(-22, -28); p.quadraticCurveTo(-34, -63, -28, -68); p.moveTo(21, -29); p.quadraticCurveTo(33, -62, 27, -68); }, '#9caa88', 1.3);
      this.path(p => { p.moveTo(-44, 14); p.bezierCurveTo(-57, -15, -31, -43, 0, -40); p.bezierCurveTo(34, -44, 58, -11, 44, 20); p.bezierCurveTo(38, 49, -36, 49, -44, 14); }, '#6d7b5d', 1.9, sage);
      this.path(p => { p.moveTo(-40, 15); p.bezierCurveTo(-49, -11, -29, -38, -5, -37); }, '#91a17d', .8);
      this.ellipse(0, 24, 26, 18, '#dbe3c9', null);
      this.ellipse(-26, 40, 15, 7, '#b7c6a2'); this.ellipse(26, 40, 15, 7, '#b7c6a2');
      this.ellipse(-29, -2, 9, 4, '#d8b3a0aa', null); this.ellipse(29, -2, 9, 4, '#d8b3a0aa', null);
      if (won) {
        this.path(p => { p.moveTo(-23, -12); p.quadraticCurveTo(-17, -20, -11, -12); p.moveTo(11, -12); p.quadraticCurveTo(17, -20, 23, -12); }, '#414b3c', 2.4);
        this.path(p => { p.moveTo(-10, 2); p.quadraticCurveTo(0, 15, 10, 2); }, '#414b3c', 2.3);
      } else {
        const blink = !this.reduced.matches && clock % 5.7 > 5.5;
        if (blink) this.path(p => { p.moveTo(-23, -13); p.lineTo(-13, -13); p.moveTo(13, -13); p.lineTo(23, -13); }, '#414b3c', 2);
        else { this.ellipse(-18, -14, 4, 5.5, '#424c3e', null); this.ellipse(18, -14, 4, 5.5, '#424c3e', null); this.ellipse(-17, -16, 1.1, 1.5, '#fffef7', null); this.ellipse(19, -16, 1.1, 1.5, '#fffef7', null); }
        this.ellipse(0, 3, near ? 16 : 10, near ? 15 : 10, '#61654e', '#596347');
        this.ellipse(0, near ? 12 : 9, near ? 9 : 6, 3, '#d4ac99', null);
      }
      this.path(p => { p.moveTo(-41, 18); p.quadraticCurveTo(-29, 24, -25, 15); p.moveTo(41, 18); p.quadraticCurveTo(29, 24, 25, 15); }, '#7e8e6b', 1.2);
      if (won) { this.star(-58, -42, 8, '#e9d697', -.3); this.star(59, -31, 6, '#e9d697', .3); }
      c.restore();
    }
    ropes(state) {
      const c = this.ctx;
      for (const r of state.ropes) {
        if (!r.cut && state.status !== 'won') {
          const end = state.candy, d = Math.hypot(r.x - end.x, r.y - end.y), slack = Math.max(0, r.length - d);
          const middle = { x: (r.x + end.x) / 2, y: (r.y + end.y) / 2 + Math.min(28, slack * .6) };
          this.path(p => { p.moveTo(r.x, r.y); p.quadraticCurveTo(middle.x, middle.y, end.x, end.y); }, '#94836a', 4.5);
          c.save(); c.setLineDash([3, 6]); this.path(p => { p.moveTo(r.x, r.y); p.quadraticCurveTo(middle.x, middle.y, end.x, end.y); }, '#ddd1ad', 2.1); c.restore();
        }
        c.save(); if (r.cut) c.globalAlpha = .42;
        this.ellipse(r.x, r.y, 17, 16, '#eee7d2', '#92977d');
        this.ellipse(r.x + .7, r.y - .5, 12.5, 12, '#f7f3e6', '#c2b998');
        c.font = '16px Georgia, serif'; c.fillStyle = '#656c56'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(r.id + 1), r.x, r.y + 1);
        if (r.cut) this.path(p => { p.moveTo(r.x - 10, r.y + 10); p.lineTo(r.x + 11, r.y - 10); }, '#8a927c', 1);
        c.restore();
      }
    }
    candy(state) {
      if (state.status === 'won') return;
      const c = this.ctx, b = state.candy; c.save(); c.translate(b.x, b.y);
      if (state.status === 'lost') c.globalAlpha = .45;
      if (b.bubble) {
        this.ellipse(0, 0, 35, 35, '#dce9e544', '#9db7b2');
        this.path(p => { p.arc(0, 0, 30, -2.75, -1.6); }, '#fefdf7', 4);
        this.path(p => { p.arc(0, 0, 31, .5, 1.8); }, '#cec0c77f', 2.5);
        this.ellipse(12, -22, 3, 2, '#fffef7', null, .4);
      }
      c.rotate(b.vx * .002 + b.vy * .0004);
      this.path(p => { p.moveTo(-14, -7); p.lineTo(-29, -14); p.lineTo(-26, 1); p.lineTo(-29, 13); p.lineTo(-14, 7); p.moveTo(14, -7); p.lineTo(29, -13); p.lineTo(26, 1); p.lineTo(29, 14); p.lineTo(14, 7); }, '#a0816c', 1.5, '#dbb69e');
      this.ellipse(0, 0, 19, 18, '#e3bba5', '#957c69');
      c.save(); c.beginPath(); c.ellipse(0, 0, 17.8, 16.8, 0, 0, Math.PI * 2); c.clip();
      this.path(p => { p.moveTo(-10, -22); p.bezierCurveTo(5, -6, -17, 6, -6, 24); p.moveTo(5, -24); p.bezierCurveTo(21, -7, -2, 7, 10, 24); }, '#f6dfc3', 6);
      c.restore(); this.path(p => { p.moveTo(-11, -10); p.quadraticCurveTo(-2, -16, 5, -12); }, '#fff4da', 1.5);
      this.path(p => { p.moveTo(-24, -7); p.lineTo(-19, -3); p.moveTo(23, 7); p.lineTo(19, 3); }, '#b98e77', 1);
      c.restore();
    }
    hazard(h) {
      const c = this.ctx;
      this.path(p => { p.moveTo(h.x, h.y + 5); p.lineTo(h.x + h.w, h.y + 5); p.lineTo(h.x + h.w - 2, h.y + h.h); p.lineTo(h.x + 1, h.y + h.h - 1); p.closePath(); }, '#a48e7a', 1.5, '#e4d9c3');
      for (let x = h.x + 5; x < h.x + h.w - 5; x += 19) this.path(p => { p.moveTo(x, h.y + 6); p.lineTo(x + 6, h.y - 9); p.lineTo(x + 13, h.y + 6); p.closePath(); }, '#a48375', 1.2, '#d4b5a0');
      this.path(p => { p.moveTo(h.x + 6, h.y + h.h - 6); p.lineTo(h.x + h.w - 8, h.y + h.h - 7); }, '#c7b9a1', 1);
      if (h.amplitude) { c.font = '17px Georgia,serif'; c.textAlign = 'center'; c.fillStyle = '#8a7966'; c.fillText('↔', h.x + h.w / 2, h.y + h.h - 6); }
    }
    draw(state, dt, started, clock) {
      const c = this.ctx;
      c.clearRect(0, 0, E.WIDTH, E.HEIGHT); c.lineCap = 'round'; c.lineJoin = 'round';
      this.background(state, clock);
      state.stars.forEach((s, i) => {
        if (s.collected) return;
        const bob = this.reduced.matches || state.paused ? 0 : Math.sin(clock * 2 + i * 1.2) * 2;
        this.ellipse(s.x, s.y + bob, 24, 24, '#eadd9f18', null);
        this.star(s.x, s.y + bob, 14, '#ebd693', -.09 + i * .08);
        this.path(p => { p.moveTo(s.x - 5, s.y - 4 + bob); p.lineTo(s.x - 2, s.y - 6 + bob); }, '#fff6cf', 1.4);
      });
      this.rabbit(state, clock);
      (state.level.hazards || []).forEach(h => this.hazard(E.obstacleAt(h, state.time)));
      this.ropes(state); this.candy(state);
      if (!started && state.index === 0) {
        c.save(); c.setLineDash([5, 5]); this.path(p => { p.moveTo(247, 119); p.quadraticCurveTo(303, 110, 354, 121); }, '#98a789', 1.5); c.restore();
        c.fillStyle = '#819172'; c.font = '25px Georgia,serif'; c.fillText('✂', 228, 124);
        this.path(p => { p.moveTo(346, 115); p.lineTo(354, 121); p.lineTo(345, 125); }, '#98a789', 1.5);
      }
      this.particles = this.particles.filter(p => p.life > 0);
      for (const p of this.particles) { p.life -= dt * 1.8; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += dt * 90; c.save(); c.globalAlpha = Math.max(0, p.life); this.ellipse(p.x, p.y, p.size, p.size * .6, p.color, null, p.life * 2); c.restore(); }
      this.trail = this.trail.filter(p => (p.life -= dt) > 0);
      if (this.trail.length > 1) { c.save(); c.globalAlpha = .65; this.path(p => { this.trail.forEach((point, i) => i ? p.lineTo(point.x, point.y) : p.moveTo(point.x, point.y)); }, '#86a0a0', 3); c.restore(); }
    }
  }
  window.RopeGardenScene = Scene;
})();
