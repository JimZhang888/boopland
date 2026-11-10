(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const noise = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  class KunScene {
    constructor(canvas, game) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.game = game;
      this.width = 1; this.height = 1; this.scale = 1; this.camera = { x: game.player.x, y: game.player.y };
      this.particles = []; this.rings = []; this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    }
    resize() {
      const box = this.canvas.getBoundingClientRect(); this.width = box.width; this.height = box.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
      this.dpr = dpr; this.makePaper(); this.updateCamera(1, true);
    }
    makePaper() {
      const paper = document.createElement('canvas'); paper.width = 160; paper.height = 160;
      const c = paper.getContext('2d');
      for (let i = 0; i < 900; i++) { c.fillStyle = i % 3 ? '#566a5410' : '#fffdf541'; c.fillRect(noise(i) * 160, noise(i + 950) * 160, .7, .7); }
      this.paper = this.ctx.createPattern(paper, 'repeat');
    }
    updateCamera(dt, snap = false) {
      const p = this.game.player, shortSide = Math.min(this.width, this.height);
      const baseView = shortSide < 400 ? 430 : this.width < 700 ? 550 : 700;
      const desiredScale = shortSide / (baseView + this.game.stage * 72);
      this.scale += (desiredScale - this.scale) * (snap ? 1 : 1 - Math.exp(-dt * 2));
      const viewW = this.width / this.scale, viewH = this.height / this.scale;
      this.game.setView(viewW, viewH);
      const ease = snap ? 1 : 1 - Math.exp(-dt * 7);
      this.camera.x += (p.x + p.vx * .13 - this.camera.x) * ease;
      this.camera.y += (p.y + p.vy * .13 - this.camera.y) * ease;
    }
    worldAt(x, y) { return { x: (x - this.width / 2) / this.scale + this.camera.x, y: (y - this.height / 2) / this.scale + this.camera.y }; }
    screenAt(x, y) { return { x: (x - this.camera.x) * this.scale + this.width / 2, y: (y - this.camera.y) * this.scale + this.height / 2 }; }
    effect(event, label) {
      if (event.x === undefined) return;
      const color = event.type === 'hit' ? '#ad7b69' : event.type === 'evolve' || event.type === 'surge' ? '#b8a46c' : '#779784';
      const count = this.reduced.matches ? 3 : event.type === 'evolve' ? 25 : 7;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * TAU, speed = 18 + Math.random() * 65;
        this.particles.push({ x: event.x, y: event.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .8, total: .8, radius: 2 + Math.random() * 3, color });
      }
      if (label) this.particles.push({ x: event.x, y: event.y - 20, vx: 0, vy: -32, life: 1.1, total: 1.1, label, color });
      if (['evolve', 'surge', 'pearl'].includes(event.type)) this.rings.push({ x: event.x, y: event.y, life: 1.2, type: event.type });
      if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
    }
    fish(c, x, y, r, angle, color, shape = 0, phase = 0, player = false, relation = '') {
      c.save(); c.translate(x, y);
      // The fish may face left, but its eye and fins never turn upside down.
      const flip = Math.cos(angle) < 0; c.rotate(flip ? angle - Math.PI : angle); c.scale(flip ? -1 : 1, 1);
      const tail = Math.sin(phase) * .13, whale = shape >= 4;
      c.lineWidth = Math.max(.9, r * .018); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = player ? '#45686a' : '#667d77';
      const fill = color; c.fillStyle = fill;
      // Uneven graphite contours and a second fine stroke give each fin a drawn edge.
      c.beginPath(); c.moveTo(-r * .65, 0); c.quadraticCurveTo(-r * 1.08, -r * (.22 + tail), -r * 1.38, -r * .49);
      c.quadraticCurveTo(-r * 1.25, 0, -r * 1.4, r * .45); c.lineTo(-r * .65, r * .14); c.closePath(); c.fill(); c.stroke();
      if (shape >= 2) {
        c.beginPath(); c.moveTo(-r * .2, -r * .32); c.quadraticCurveTo(-r * .25, -r * .95, r * .2, -r * .75); c.lineTo(r * .4, -r * .32); c.closePath(); c.fill(); c.stroke();
      }
      c.beginPath(); c.moveTo(r * 1.02, 0);
      c.bezierCurveTo(r * 1.02, -r * .57, -r * .1, -r * (whale ? .69 : .66), -r * .85, -r * .06);
      c.bezierCurveTo(-r * .65, r * .57, r * .8, r * .67, r * 1.02, 0); c.closePath(); c.fill(); c.stroke();
      c.save(); c.clip(); c.fillStyle = '#f3f1df80';
      c.beginPath(); c.ellipse(r * .1, r * .32, r * .94, r * .18, -.04, 0, TAU); c.fill();
      c.strokeStyle = '#4a696528'; c.lineWidth = Math.max(.55, r * .008);
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo((- .48 + i * .15) * r, -r * .18); c.lineTo((-.65 + i * .15) * r, r * .16); c.stroke(); }
      c.restore();
      c.fillStyle = fill; c.strokeStyle = player ? '#45686a' : '#667d77';
      c.beginPath(); c.moveTo(r * .1, r * .15); c.quadraticCurveTo(-r * .1, r * (whale ? 1.03 : .58), -r * .48, r * (whale ? .82 : .38)); c.lineTo(-r * .2, r * .02); c.fill(); c.stroke();
      if (shape === 2 || shape === 5) {
        c.beginPath(); c.moveTo(r * .1, -r * .1); c.bezierCurveTo(-r * .6, -r * 1.1, -r * 1.05, -r * .95, -r * .8, -r * .3); c.lineTo(-r * .25, r * .07); c.fill(); c.stroke();
        if (shape === 5) {
          c.strokeStyle = '#ae9e6a'; c.lineWidth = Math.max(1, r * .02);
          c.beginPath(); c.moveTo(r * .48, -r * .42); c.quadraticCurveTo(r * .3, -r * .94, r * .73, -r * 1.03); c.moveTo(r * .48, -r * .64); c.lineTo(r * .32, -r * .77); c.stroke();
          c.strokeStyle = '#e3dab5'; c.lineWidth = Math.max(1, r * .014);
          for (let i = 0; i < 4; i++) { c.beginPath(); c.arc((- .3 + i * .22) * r, -r * .08, r * .08, 0, Math.PI); c.stroke(); }
          c.strokeStyle = '#557b7d'; c.beginPath(); c.moveTo(r * .86, r * .12); c.bezierCurveTo(r * 1.35, r * .2, r * 1.12, r * .55, r * 1.5, r * .35); c.stroke();
        }
      }
      c.fillStyle = '#f8f5e8'; c.beginPath(); c.arc(r * .66, -r * .12, Math.max(2.1, r * .085), 0, TAU); c.fill();
      c.fillStyle = '#354e50'; c.beginPath(); c.arc(r * .69, -r * .12, Math.max(1.3, r * .045), 0, TAU); c.fill();
      c.strokeStyle = '#4d6966'; c.lineWidth = Math.max(.8, r * .012);
      c.beginPath(); c.moveTo(r * .85, r * .12); c.quadraticCurveTo(r * .95, r * .18, r * 1.01, r * .07); c.stroke();
      c.beginPath(); c.moveTo(r * .42, -r * .19); c.quadraticCurveTo(r * .3, r * .02, r * .43, r * .16); c.stroke();
      c.restore();
      if (relation === 'danger') {
        c.save(); c.translate(x, y - r * .8); c.fillStyle = '#f8f3e4'; c.strokeStyle = '#a16f5e'; c.lineWidth = 1 / this.scale;
        const s = 7 / this.scale; c.beginPath(); c.moveTo(0, -s); c.lineTo(s, s * .7); c.lineTo(-s, s * .7); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#996551'; c.font = `bold ${9 / this.scale}px sans-serif`; c.textAlign = 'center'; c.fillText('!', 0, s * .4); c.restore();
      }
    }
    draw(dt = 0) {
      const c = this.ctx, g = this.game, w = this.width, h = this.height;
      this.updateCamera(dt); c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
      const wash = c.createLinearGradient(0, 0, w * .3, h); wash.addColorStop(0, '#ecf0e5'); wash.addColorStop(.65, '#dfebe2'); wash.addColorStop(1, g.won ? '#c9ded8' : '#d2e2d9'); c.fillStyle = wash; c.fillRect(0, 0, w, h);
      // Wide, very pale watercolour shafts; no high contrast or flashing.
      c.fillStyle = '#fffcef20';
      for (let i = 0; i < 4; i++) { const x = w * (.05 + i * .3); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 55, 0); c.lineTo(x + 160, h); c.lineTo(x + 40, h); c.closePath(); c.fill(); }
      c.save(); c.translate(w / 2, h / 2); c.scale(this.scale, this.scale); c.translate(-this.camera.x, -this.camera.y);
      const left = this.camera.x - w / this.scale / 2, top = this.camera.y - h / this.scale / 2;
      // Anchored plants and ripples make camera motion readable without a grid.
      for (let gx = Math.floor(left / 240); gx <= Math.ceil((left + w / this.scale) / 240); gx++) {
        for (let gy = Math.floor(top / 220); gy <= Math.ceil((top + h / this.scale) / 220); gy++) {
          const seed = gx * 71 + gy * 371, x = gx * 240 + noise(seed) * 150, y = gy * 220 + noise(seed + 1) * 150;
          c.strokeStyle = '#9bb8aa45'; c.lineWidth = 1 / this.scale;
          c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 12, y - 7, x + 26, y + 5, x + 40, y - 2); c.stroke();
          if (noise(seed + 2) > .72) this.plant(x + 80, y + 65, seed);
          c.strokeStyle = '#729c8b30';
          for (let b = 0; b < 2; b++) { c.beginPath(); c.arc(x + b * 21, y - 65 + Math.sin(g.time * .4 + seed + b) * 5, 2.5 + b, 0, TAU); c.stroke(); }
        }
      }
      for (const pearl of g.pearls) {
        c.save(); c.translate(pearl.x, pearl.y); c.strokeStyle = '#a89b67'; c.fillStyle = '#fff9dc'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(0, 0, 12 + Math.sin(g.time * 2) * 1.5, 0, TAU); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.moveTo(0, -5); c.lineTo(0, 5); c.stroke(); c.restore();
      }
      const colors = ['#b8c8a4', '#a4beb7', '#c3c99a', '#b1c3bd'];
      for (const f of g.fish) {
        const rel = g.relation(f); this.fish(c, f.x, f.y, f.radius, f.angle, rel === 'danger' ? '#b7a9a2' : colors[f.color], f.radius > 70 ? 4 : f.variant, g.time * 7 + f.phase, false, rel);
      }
      const p = g.player;
      if (g.dash > 0 || g.won) {
        c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.strokeStyle = '#8bafaa80'; c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-p.radius * (1.5 + i * .1), (i - 1) * p.radius * .4); c.quadraticCurveTo(-p.radius * 2.5, (i - 1) * p.radius * .5, -p.radius * (3.3 + Math.sin(g.time * 3 + i) * .3), (i - 1) * p.radius * .2); c.stroke(); } c.restore();
      }
      if (g.invulnerable > 0) { c.strokeStyle = '#f4edd9'; c.lineWidth = 2 / this.scale; c.beginPath(); c.ellipse(p.x, p.y, p.radius * 1.5, p.radius * 1.25, 0, 0, TAU); c.stroke(); }
      this.fish(c, p.x, p.y, p.radius, p.angle, window.LittleKun.STAGES[g.stage].color, g.stage, g.time * (g.dash ? 22 : 9), true);
      if (g.time < 6 && g.status === 'playing') {
        c.fillStyle = '#546e60'; c.beginPath(); c.moveTo(p.x - 5 / this.scale, p.y - p.radius - 16 / this.scale); c.lineTo(p.x + 5 / this.scale, p.y - p.radius - 16 / this.scale); c.lineTo(p.x, p.y - p.radius - 10 / this.scale); c.fill();
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const ring = this.rings[i]; ring.life -= dt;
        c.strokeStyle = `rgba(139,160,139,${Math.max(0, ring.life * .5)})`; c.lineWidth = 2 / this.scale;
        c.beginPath(); c.arc(ring.x, ring.y, ring.type === 'surge' ? 410 * Math.max(0, ring.life) / 1.2 : (1.2 - ring.life) * 180 + 25, 0, TAU); c.stroke();
        if (ring.life <= 0) this.rings.splice(i, 1);
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const a = this.particles[i]; a.life -= dt; a.x += a.vx * dt; a.y += a.vy * dt;
        c.save(); c.globalAlpha = Math.max(0, a.life / a.total); c.fillStyle = a.color;
        if (a.label) { c.font = `${13 / this.scale}px Georgia`; c.textAlign = 'center'; c.fillText(a.label, a.x, a.y); }
        else { c.beginPath(); c.arc(a.x, a.y, a.radius, 0, TAU); c.fill(); } c.restore();
        if (a.life <= 0) this.particles.splice(i, 1);
      }
      c.restore(); c.fillStyle = this.paper; c.fillRect(0, 0, w, h);
    }
    plant(x, y, seed) {
      const c = this.ctx; c.save(); c.translate(x, y); c.globalAlpha = .37; c.strokeStyle = '#89a492'; c.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) {
        const bend = Math.sin(seed + i) * 14, height = 20 + noise(seed + i) * 45;
        c.beginPath(); c.moveTo(i * 5, 0); c.quadraticCurveTo(i * 6 + bend, -height / 2, i * 5 + bend, -height); c.stroke();
        c.fillStyle = i % 2 ? '#a3bba0' : '#b2c7ac'; c.beginPath(); c.ellipse(i * 5 + bend * .5 - 4, -height * .4, 4, 10, -.8, 0, TAU); c.fill();
      }
      c.strokeStyle = '#a4b19d'; c.beginPath(); c.ellipse(8, 2, 23, 5, 0, 0, TAU); c.stroke(); c.restore();
    }
  }
  window.KunScene = KunScene;
})();
