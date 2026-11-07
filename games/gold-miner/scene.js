/* All artwork is drawn locally: soft paper shapes and steady pencil lines. */
(() => {
  'use strict';
  const { WIDTH, HEIGHT, PIVOT } = GoldMiner;
  const ink = '#7e7d65';
  class Scene {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.background = document.createElement('canvas'); this.effects = [];
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.width = 0; this.height = 0; this.scale = 1; this.dpr = 1;
    }
    resize() {
      const box = this.canvas.getBoundingClientRect();
      this.width = box.width; this.height = box.height;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.round(box.width * this.dpr));
      this.canvas.height = Math.max(1, Math.round(box.height * this.dpr));
      this.background.width = this.canvas.width; this.background.height = this.canvas.height;
      this.scale = Math.min(box.width / WIDTH, box.height / HEIGHT);
      this.x = (box.width - WIDTH * this.scale) / 2;
      this.y = (box.height - HEIGHT * this.scale) / 2;
      this.paintBackground();
    }
    path(ctx, points, fill, stroke = ink, width = 1.5, close = true) {
      ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      if (close) ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    }
    line(ctx, path, color = ink, width = 1.5) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(new Path2D(path));
    }
    ellipse(ctx, x, y, rx, ry, fill, stroke = null) {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    world(ctx) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.translate(this.x, this.y); ctx.scale(this.scale, this.scale);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    paintBackground() {
      const c = this.background.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#efe8d8'; c.fillRect(0, 0, this.background.width, this.background.height);
      this.world(c);
      c.fillStyle = '#f8f7ed'; c.fillRect(-2000, -2000, 5000, 2178);
      c.fillStyle = '#e7eadb'; c.fill(new Path2D('M-2000 165 L-120 143 Q-15 114 95 145 Q193 74 305 143 Q411 102 510 150 Q620 66 731 136 Q829 90 950 146 L2000 130 L2000 192 L-2000 192 Z'));
      c.fillStyle = '#dce2cb'; c.fill(new Path2D('M-2000 175 L-80 175 Q80 140 222 170 Q372 143 495 177 Q682 146 900 169 L2000 160 L2000 190 L-2000 190 Z'));
      this.line(c, 'M-120 180 Q113 174 229 185 Q332 193 450 183 Q651 174 790 185 Q911 181 1020 179', '#949a77', 2);
      this.line(c, 'M-120 185 Q115 179 226 190 Q334 198 449 188 Q650 181 791 190 Q910 186 1020 184', '#b1b397', .8);
      c.fillStyle = '#e8dfcb'; c.fill(new Path2D('M-2000 380 Q-80 330 120 368 T500 372 T930 381 L2000 360 L2000 456 Q950 467 700 431 T250 442 T-2000 470 Z'));
      c.fillStyle = '#e2d8c1'; c.fill(new Path2D('M-2000 590 Q-80 552 180 580 T570 576 T930 589 L2000 570 L2000 2000 L-2000 2000 Z'));
      this.line(c, 'M-60 383 Q65 355 166 378 M259 383 Q336 365 413 382 M558 389 Q682 358 812 382 M80 580 Q205 600 329 583 M492 588 Q653 567 788 591', '#c6bba0', 1);
      // Tiny flecks and short, repeatable pencil hatches never flicker.
      for (let i = 0; i < 190; i++) {
        const x = (i * 137.507 + 71) % WIDTH, y = 204 + (i * 87.31) % (HEIGHT - 213);
        c.fillStyle = i % 3 ? '#b8ad8b45' : '#c3b99c66'; c.fillRect(x, y, i % 4 ? 1.5 : 3, 1.3);
        if (i % 12 === 0) this.line(c, `M${x} ${y}l7 -4m-1 8 7 -4`, '#c2b69a70', .8);
      }
      this.ellipse(c, 748, 75, 26, 25, '#e9ddb1');
      this.line(c, 'M748 39v-7m35 43h7m-77 0h-7m17-25-5-5m55 5 5-5', '#c6b785', 1.3);
      this.line(c, 'M87 88q10-7 19 0m0 0q8-7 16-2M171 65q8-6 14 0m0 0q6-6 13-2', '#a3aa92', 1.3);
      for (const [x, y, s] of [[114, 181, 1], [792, 180, .85], [216, 184, .55], [677, 181, .55]]) {
        c.save(); c.translate(x, y); c.scale(s, s);
        this.line(c, 'M0 0q3-20 0-34m1 14q-14-4-16-16m16 23q13-4 16-15', '#8c9c74', 1.4);
        this.ellipse(c, -10, -31, 8, 4, '#b0bd96'); this.ellipse(c, 11, -25, 8, 4, '#a4b68c'); c.restore();
      }
      // A little cart waiting beside the miner.
      this.ellipse(c, 596, 178, 12, 12, '#d5d4bf', '#7f866f');
      this.ellipse(c, 648, 178, 12, 12, '#d5d4bf', '#7f866f');
      this.path(c, [[575, 139], [665, 137], [655, 169], [586, 171]], '#c6cfaf', '#879176', 1.8);
      this.line(c, 'M581 148l78-1m-69 10 64-1M595 170v-27m42 26 2-28', '#9ba486', 1);
      this.path(c, [[591, 138], [598, 124], [614, 122], [621, 137]], '#d9c388', '#ab9564');
      this.path(c, [[621, 136], [630, 120], [646, 125], [653, 136]], '#e1cc91', '#ab9564');
      this.line(c, 'M661 146l18-4 4-13', '#838c73', 2);
      this.path(c, [[380, 181], [405, 113], [488, 111], [516, 181]], null, '#8b805f', 5);
      this.line(c, 'M397 179l93-2M408 117l73 57M485 116l-74 62', '#a99b75', 2.4);
      this.path(c, [[400, 104], [491, 104], [493, 117], [398, 118]], '#c5b38b', '#8b805f', 1.5);
      // The miner, with a soft hat, pencil beard, and tiny boots.
      this.ellipse(c, 340, 177, 42, 5, '#b6b79c44');
      this.path(c, [[326, 133], [346, 132], [351, 167], [341, 169], [334, 145], [329, 169], [317, 168]], '#899f94', '#6f837b', 1.5);
      this.line(c, 'M317 169l-8 5 19 1m13-6 14 6-14 1', '#6f7868', 4);
      this.path(c, [[320, 99], [344, 98], [358, 120], [348, 138], [321, 137], [311, 116]], '#aebc98', '#7c8c70', 1.5);
      this.line(c, 'M320 105l6 28m18-29-3 29M326 118h16', '#75876c', 1.5);
      this.ellipse(c, 336, 86, 18, 21, '#e1c6a6', '#a39272');
      this.path(c, [[320, 92], [333, 101], [353, 91], [349, 109], [338, 115], [324, 106]], '#e9e6d4', '#a09c82', 1);
      this.ellipse(c, 345, 87, 1.6, 2, '#66715f');
      this.line(c, 'M348 90l8 2-7 3', '#aa9675', 1.2);
      c.fillStyle = '#c6ad73'; c.fill(new Path2D('M314 76Q312 53 335 52Q356 54 355 77Z'));
      this.line(c, 'M314 76Q312 53 335 52Q356 54 355 77', '#978357', 1.5);
      this.path(c, [[308, 76], [362, 74], [365, 81], [310, 83]], '#d6bf86', '#978357');
      this.ellipse(c, 350, 67, 7, 7, '#f7edc8', '#a99567');
      this.line(c, 'M324 58l-2 14', '#e4cf9d', 2);
    }
    ore(c, item, x = item.x, y = item.y) {
      c.save(); c.translate(x, y); c.rotate(item.rotation); const r = item.radius;
      const shape = [[-.92, -.23], [-.56, -.8], [.05, -.94], [.72, -.64], [1, .15], [.48, .84], [-.48, .85], [-1, .3]].map(([a, b]) => [a * r, b * r]);
      this.ellipse(c, 2, r * .83, r * .88, r * .17, '#9d927122');
      if (item.kind === 'diamond') {
        this.path(c, [[-r, -r * .25], [-r * .5, -r * .85], [r * .5, -r * .85], [r, -r * .25], [0, r]], '#bcd5cb', '#6b928b', 1.8);
        this.path(c, [[0, r], [r * .4, -r * .25], [r, -r * .25]], '#9bbfb4', null);
        this.line(c, `M${-r} ${-r * .25}H${r}M${-r * .5} ${-r * .85}L0 ${r} ${r * .5} ${-r * .85}`, '#7da79b', 1);
        this.line(c, `M${-r - 6} ${-r - 4}v9m-4-4h8`, '#91a99b', 1.5);
      } else if (item.kind === 'bag') {
        c.fillStyle = '#d7c2a2'; const bag = new Path2D(`M-9 -12Q${-r - 5} 3 ${-r + 4} 14Q0 29 ${r - 3} 14Q${r + 4} 1 9 -12L13 -23 -12 -22Z`); c.fill(bag); c.strokeStyle = '#a18a66'; c.lineWidth = 1.5; c.stroke(bag);
        this.line(c, 'M-10-12l21 1m-22 1 18 2', '#8e795a', 2);
        c.fillStyle = '#967d56'; c.font = '24px Georgia'; c.textAlign = 'center'; c.fillText('?', 1, 14);
      } else {
        const rock = item.kind === 'rock';
        this.path(c, shape, rock ? '#bfc3b6' : '#e0c784', rock ? '#858b7b' : '#a0874f', 1.7);
        this.path(c, [[r * -.48, r * .85], [r * -.1, r * .25], [r, r * .15], [r * .48, r * .84]], rock ? '#a8b09e' : '#c9ad69', null);
        this.line(c, `M${r * -.72} ${r * -.18}L${r * -.4} ${r * -.58} ${r * .06} ${r * -.68}M${r * -.44} ${r * .14}L${r * -.17} ${r * .3} ${r * .3} ${r * -.08}`, rock ? '#d6d8cc' : '#f4e3b0', 2);
        if (rock) this.line(c, `M${r * -.1} ${r * -.7}l${r * .2} ${r * .5} ${r * .4} ${r * .2}`, '#8e9685', 1);
      }
      c.restore();
      c.fillStyle = item.kind === 'rock' ? '#89907d' : item.kind === 'diamond' ? '#648a80' : '#967c47';
      c.textAlign = 'center'; c.font = '17px Georgia, serif';
      c.fillText(item.kind === 'bag' ? '?' : item.value, x, y + r + 23);
    }
    effect(event) { if (['collect', 'blast'].includes(event.type)) this.effects.push({ ...event, age: 0 }); }
    clearEffects() { this.effects = []; }
    draw(game, dt = 0) {
      const c = this.ctx; if (!c || !this.width || !this.height) return;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.canvas.width, this.canvas.height); c.drawImage(this.background, 0, 0);
      this.world(c);
      for (const item of game.items) if (!item.taken) this.ore(c, item);
      const hook = game.hook, tip = game.tip;
      this.line(c, `M${PIVOT.x} ${PIVOT.y}L${tip.x} ${tip.y}`, '#736e52', 2);
      this.line(c, `M${PIVOT.x + 3} ${PIVOT.y}L${tip.x + 2} ${tip.y}`, '#b3a789', .8);
      // The wheel and miner's hand turn only while the rope moves.
      const wheelAngle = hook.mode === 'swing' ? 0 : hook.length / 23;
      this.ellipse(c, PIVOT.x, PIVOT.y, 18, 18, '#d9c9a3', '#87795a');
      c.save(); c.translate(PIVOT.x, PIVOT.y); c.rotate(wheelAngle);
      this.line(c, 'M-13 0h26M0-13v26', '#9b8a66', 2); this.ellipse(c, 0, 0, 4, 4, '#8b7f5f'); c.restore();
      this.line(c, `M348 113Q364 136 386 ${122 + Math.sin(wheelAngle) * 4}`, '#7d8b6a', 9);
      this.ellipse(c, 388, 122 + Math.sin(wheelAngle) * 4, 5, 5, '#ddc5a3', '#a79370');
      c.save(); c.translate(tip.x, tip.y); c.rotate(-hook.angle);
      const tight = hook.cargo ? 8 : 18;
      this.line(c, `M0-9v9M0 0L${-tight} 12 ${-tight + 3} 24 -4 17M0 0L${tight} 12 ${tight - 3} 24 4 17`, '#687b70', 4);
      this.ellipse(c, 0, 0, 4, 4, '#a4afa0', '#677568'); c.restore();
      if (hook.cargo) this.ore(c, hook.cargo, tip.x, tip.y + hook.cargo.radius * .55 + 13);
      if (game.phase === 'playing' && !game.paused && hook.mode === 'swing') {
        c.save(); c.setLineDash([4, 9]); this.line(c, `M${tip.x + Math.sin(hook.angle) * 30} ${tip.y + Math.cos(hook.angle) * 30}l${Math.sin(hook.angle) * 65} ${Math.cos(hook.angle) * 65}`, '#929f7c88', 1.5); c.restore();
      }
      this.effects = this.effects.filter(effect => effect.age < 1.2);
      for (const effect of this.effects) {
        effect.age += dt; c.save(); c.globalAlpha = Math.max(0, 1 - effect.age / 1.2);
        if (effect.type === 'collect') {
          c.fillStyle = '#8f7439'; c.font = '26px Georgia, serif'; c.textAlign = 'center';
          c.fillText(`+${effect.value}`, 515, 87 - (this.reduced.matches ? 0 : effect.age * 30));
        } else {
          const size = this.reduced.matches ? 18 : 12 + effect.age * 42;
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; this.line(c, `M${effect.x + Math.cos(a) * size} ${effect.y + Math.sin(a) * size}l${Math.cos(a) * 8} ${Math.sin(a) * 8}`, '#a88759', 2); }
        }
        c.restore();
      }
    }
  }
  window.MinerScene = Scene;
})();
