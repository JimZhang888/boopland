(() => {
  'use strict';
  const E = PaperHook;
  const ink = '#626e58', sage = '#dce5d8', rose = '#b67564';
  class Scene {
    constructor(canvas, stage) {
      this.canvas = canvas; this.stage = stage; this.ctx = canvas.getContext('2d');
      this.camera = 0; this.particles = []; this.trail = [];
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.resize();
    }
    resize() {
      const box = this.stage.getBoundingClientRect();
      this.w = Math.max(1, box.width); this.h = Math.max(1, box.height);
      this.view = Math.max(520, Math.min(1600, this.w / this.h * E.HEIGHT));
      this.scale = Math.min(this.w / this.view, this.h / E.HEIGHT);
      this.ox = (this.w - this.view * this.scale) / 2; this.oy = (this.h - E.HEIGHT * this.scale) / 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr; this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
    }
    reset() { this.camera = 0; this.trail = []; this.particles = []; }
    line(points, color = ink, width = 1.5, dash = []) {
      const c = this.ctx; c.beginPath(); c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash);
      points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.setLineDash([]);
    }
    circle(x, y, r, fill, stroke = ink, width = 1.5) {
      const c = this.ctx; c.beginPath(); c.ellipse(x, y, r, r * .97, -.12, 0, Math.PI * 2);
      if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    }
    star(x, y, r, fill, stroke = '#ac914f') {
      const c = this.ctx; c.beginPath();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, len = i % 2 ? r * .46 : r; const px = x + Math.cos(a) * len, py = y + Math.sin(a) * len; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = stroke; c.lineWidth = 1.3; c.stroke();
    }
    leaf(x, y, size) {
      const c = this.ctx; this.line([[x, y], [x + 2, y - size]], '#99a58a', 1);
      for (let i = 1; i < 5; i++) {
        const yy = y - i * size / 5, side = i % 2 ? 1 : -1;
        c.beginPath(); c.moveTo(x + 1, yy); c.quadraticCurveTo(x + side * 17, yy - 3, x + side * 14, yy - 14); c.quadraticCurveTo(x + 2, yy - 13, x + 1, yy); c.fillStyle = '#d5ddc7'; c.fill(); c.strokeStyle = '#a5b197'; c.lineWidth = .8; c.stroke();
      }
    }
    cloud(x, y, size) {
      const c = this.ctx; c.save(); c.translate(x, y); c.scale(size, size); c.beginPath(); c.moveTo(-46, 12); c.bezierCurveTo(-65, -4, -48, -23, -30, -18); c.bezierCurveTo(-29, -53, 15, -52, 22, -24); c.bezierCurveTo(52, -30, 70, 9, 42, 13); c.closePath(); c.fillStyle = '#f1f0e5'; c.fill(); c.strokeStyle = '#d7dbcd'; c.lineWidth = 1; c.stroke(); this.line([[-38, 20], [25, 21]], '#e1e4d7', .8); c.restore();
    }
    background(time, level) {
      const c = this.ctx, camera = this.camera;
      c.fillStyle = '#fffef7'; c.fillRect(0, 0, this.view, E.HEIGHT);
      for (let y = 45; y < E.HEIGHT; y += 42) this.line([[0, y], [this.view, y + .5]], '#e8ecdf', .6);
      for (let i = -1; i < this.view / 350 + 2; i++) {
        const x = i * 350 - (camera * .16 % 350);
        this.cloud(x + 170, 100 + Math.sin(i * 4) * 45, .65 + (i % 2) * .14);
      }
      const base = Math.floor(camera * .25 / 420);
      for (let i = base - 1; i < base + this.view / 420 + 2; i++) {
        const x = i * 420 - camera * .25, top = 430 - Math.sin(i * 8) * 52;
        c.beginPath(); c.moveTo(x - 130, 620); c.lineTo(x + 105, top); c.lineTo(x + 190, top + 30); c.lineTo(x + 370, 620); c.closePath(); c.fillStyle = level.chapter === 2 ? '#e7ece5' : '#e9eddf'; c.fill();
        this.line([[x - 130, 620], [x + 105, top], [x + 190, top + 30], [x + 370, 620]], '#d6decc', 1.2);
        this.line([[x + 105, top], [x + 128, top + 85], [x + 160, 610]], '#d9e0d1', 1);
        for (let n = 0; n < 8; n++) this.line([[x + 170 + n * 10, top + 100 + n * 10], [x + 185 + n * 10, top + 112 + n * 10]], '#d4ddc9', .7);
      }
      // Two little paper birds follow the distant breeze.
      const bx = this.view - 150 - camera * .04 % 100, by = 155 + (this.reduced ? 0 : Math.sin(time * .7) * 6);
      this.line([[bx - 13, by], [bx, by + 5], [bx + 14, by - 2]], '#aeb8a0', 1.4);
      this.line([[bx + 25, by - 22], [bx + 34, by - 18], [bx + 44, by - 23]], '#bac2ae', 1);
      for (let x = 15 - camera * .4 % 110; x < this.view; x += 110) {
        this.line([[x, 608], [x + 30, 607]], '#cbd5bf', 1.1);
        this.line([[x + 42, 618], [x + 66, 617]], '#dde3d4', .8);
      }
    }
    platform(pad) {
      const c = this.ctx, { x, y, w, bounce } = pad;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w - 2, y - 1); c.lineTo(x + w + 3, y + 18); c.lineTo(x - 2, y + 20); c.closePath(); c.fillStyle = bounce ? '#e4c4a2' : '#d8e1cc'; c.fill(); c.strokeStyle = bounce ? '#b7916b' : '#a8b499'; c.lineWidth = 1.5; c.stroke();
      this.line([[x + 3, y + 4], [x + w - 5, y + 3]], bounce ? '#b39071' : '#92a080', 1);
      if (bounce) {
        for (let xx = x + 12; xx < x + w - 8; xx += 18) this.line([[xx, y + 15], [xx + 5, y + 8]], '#c19c76', .8);
        this.line([[x + w / 2 - 13, y - 13], [x + w / 2, y - 23], [x + w / 2 + 13, y - 13]], '#b08a61', 1.6);
        this.line([[x + 13, y + 23], [x + 19, y + 31], [x + 11, y + 36], [x + 19, y + 42], [x + 13, y + 48]], '#b1ad94', 1.1);
        this.line([[x + w - 18, y + 23], [x + w - 12, y + 31], [x + w - 20, y + 36], [x + w - 12, y + 42], [x + w - 18, y + 48]], '#b1ad94', 1.1);
      } else {
        c.beginPath(); c.moveTo(x, y + 21); c.lineTo(x + w, y + 19); c.lineTo(x + w - 11, 620); c.lineTo(x + 13, 620); c.closePath(); c.fillStyle = '#eef0e4'; c.fill();
        this.line([[x + 11, y + 26], [x + 20, 610]], '#dae1cd', .8); this.leaf(x + 30, y, 58);
        for (let i = 0; i < 7; i++) this.line([[x + w - 60 + i * 6, y + 31], [x + w - 48 + i * 6, y + 41]], '#ced7bd', .8);
      }
    }
    flag(x, y, text, finish) {
      const c = this.ctx; this.line([[x, y], [x + 1, y - 120]], '#839474', 2);
      c.beginPath(); c.moveTo(x + 1, y - 119); c.lineTo(x + 72, y - 111); c.lineTo(x + 58, y - 87); c.lineTo(x + 1, y - 94); c.closePath(); c.fillStyle = finish ? '#bdcfae' : '#e7d9ae'; c.fill(); c.strokeStyle = '#98a78b'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#637655'; c.font = '10px "Segoe UI", "Microsoft YaHei", sans-serif'; c.textAlign = 'center'; c.fillText(text, x + 32, y - 100, 61); this.circle(x + 1, y - 122, 3, '#a7b99a');
    }
    wheel(h, time) {
      const c = this.ctx, pos = E.hazardPosition(h, time); c.save(); c.translate(pos.x, pos.y); c.rotate(this.reduced ? 0 : time * .8);
      c.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? h.r - 7 : h.r + 3; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ead0c2'; c.fill(); c.strokeStyle = '#b98470'; c.lineWidth = 1.5; c.stroke();
      this.circle(0, 0, h.r - 12, '#f4e3d5', '#be8e77', 1); this.line([[-6, -6], [6, 6]], '#b58069', 2); this.line([[6, -6], [-6, 6]], '#b58069', 2); c.restore();
    }
    stick(s, time) {
      const c = this.ctx, speed = Math.hypot(s.vx, s.vy), flying = s.status === 'playing' && !s.rope;
      const angle = s.rope ? Math.atan2(s.x - s.rope.x, s.rope.y - s.y) + Math.PI : flying ? Math.atan2(s.vy, s.vx) * .38 : -.12;
      c.save(); c.translate(s.x, s.y); c.rotate(angle);
      this.circle(0, -19, 10, '#fffdf2', '#4e5f45', 2.5);
      this.line([[0, -8], [1, 12]], '#4e5f45', 3);
      if (s.rope) { this.line([[0, -3], [-11, -16], [-4, -34]], '#4e5f45', 2.8); this.line([[1, -2], [10, -17], [1, -34]], '#4e5f45', 2.8); }
      else { this.line([[0, -3], [-13, 1], [-23, -7]], '#4e5f45', 2.8); this.line([[1, -3], [14, -10], [23, -19]], '#4e5f45', 2.8); }
      const kick = flying ? Math.sin(time * 12) * 5 : 0;
      this.line([[1, 12], [-10, 22], [-17 - kick, 30]], '#4e5f45', 3); this.line([[1, 12], [13, 20], [17 + kick, 31]], '#4e5f45', 3);
      c.beginPath(); c.moveTo(-3, -9); c.lineTo(-18, -7); c.quadraticCurveTo(-24, -6 - speed / 100, -30, -13); c.lineTo(-24, -5); c.quadraticCurveTo(-16, 0, 1, -6); c.closePath(); c.fillStyle = rose; c.fill(); this.line([[-5, -8], [5, -8]], '#ae735f', 3.5);
      c.restore();
    }
    burst(event) {
      if (this.reduced) return;
      const count = event.type === 'won' ? 55 : event.type === 'star' ? 12 : 7;
      const colors = event.type === 'star' ? ['#c7a45e', '#e0c886'] : ['#b3c79e', '#d5b88c', '#cb9d86', '#9eb5b0'];
      for (let i = 0; i < count; i++) {
        const a = i * 2.399, speed = 45 + Math.random() * 145;
        this.particles.push({ x: event.x, y: event.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 60, life: 1, color: colors[i % colors.length], size: event.type === 'won' ? 5 : 3 });
      }
    }
    draw(s, time, dt, t) {
      const c = this.ctx, level = E.LEVELS[s.level];
      const target = Math.max(0, Math.min(level.width - this.view, s.x - this.view * .29));
      this.camera += (target - this.camera) * (this.reduced ? 1 : 1 - Math.exp(-dt * 7));
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.w, this.h);
      c.translate(this.ox, this.oy); c.scale(this.scale, this.scale); c.lineCap = 'round'; c.lineJoin = 'round';
      this.background(time, level); c.save(); c.translate(-this.camera, 0);
      for (const p of level.pads) if (p.x + p.w > this.camera - 70 && p.x < this.camera + this.view + 70) this.platform(p);
      this.flag(60, 485, t('startFlag'), false); this.flag(level.finish + 35, 485, t('finish'), true);
      if (level.finish < this.camera + this.view + 30) {
        this.line([[level.finish, 340], [level.finish, 483]], '#b3c39e', 1.5, [4, 6]);
        for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { c.fillStyle = '#a7b995'; c.fillRect(level.finish - 12 + j * 12, 350 + i * 12, 12, 12); }
      }
      const selected = !s.rope && (s.status === 'playing' || s.status === 'ready') ? E.candidate(s) : null;
      if (selected) this.line([[s.x, s.y - 23], [selected.x, selected.y]], '#9fb28c99', 1.5, [3, 9]);
      for (const a of level.anchors) {
        if (a.x < this.camera - 40 || a.x > this.camera + this.view + 40) continue;
        const active = s.rope?.id === a.id, targetRing = selected?.id === a.id;
        this.line([[a.x - 2, 12], [a.x, a.y - 18]], '#dddccd', .9, [2, 5]);
        if (targetRing || active) this.circle(a.x, a.y, 29 + (this.reduced ? 0 : Math.sin(time * 3) * 2), '#e7eedc', '#c2d0b4', 1);
        this.circle(a.x, a.y, 17, active ? '#bfceab' : '#e7ebd9', targetRing || active ? '#688158' : '#9faa8d', 2);
        this.circle(a.x, a.y, 9, '#fffef7', '#adb99c', 1.1);
        c.beginPath(); c.ellipse(a.x - .8, a.y + 1.5, 19, 17, -.2, .3, Math.PI * 1.4); c.strokeStyle = '#b8c2a3'; c.lineWidth = .6; c.stroke();
        if (targetRing) this.line([[a.x - 5, a.y - 42], [a.x, a.y - 36], [a.x + 5, a.y - 42]], '#8da276', 1.5);
      }
      for (const star of level.stars) if (!s.collected.includes(star.id)) {
        const yy = star.y + (this.reduced ? 0 : Math.sin(time * 2 + star.id) * 3);
        this.circle(star.x, yy, 23, '#f4edcf55', null); this.star(star.x, yy, 14, '#ebd59a');
      }
      for (const h of level.hazards) this.wheel(h, s.time);
      if (s.status === 'playing' && !this.reduced && dt > 0) { this.trail.push({ x: s.x, y: s.y }); if (this.trail.length > 23) this.trail.shift(); }
      this.trail.forEach((p, i) => { if (i % 3 === 0) this.circle(p.x, p.y, 1.5 + i / 25, '#a9b799' + Math.round(i / 23 * 65).toString(16).padStart(2, '0'), null); });
      if (s.rope) { this.line([[s.rope.x, s.rope.y], [s.x, s.y - 4]], '#6f805d', 2.1); this.line([[s.rope.x + 2, s.rope.y], [s.x + 1, s.y - 4]], '#a9b99566', .7); }
      this.stick(s, time);
      for (const p of this.particles) {
        p.life -= dt * 1.2; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt;
        c.globalAlpha = Math.max(0, p.life); c.fillStyle = p.color; c.fillRect(p.x, p.y, p.size, p.size * .6);
      }
      this.particles = this.particles.filter(p => p.life > 0); c.globalAlpha = 1; c.restore();
    }
  }
  window.PaperHookScene = Scene;
})();
