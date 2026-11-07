/* All artwork is drawn locally: paper washes, pencil lines, and little cut-out travellers. */
(() => {
  'use strict';
  const ink = '#59624e';
  const paints = ['#aabcb0', '#d1a28a', '#d6c084', '#a3b9c0'];
  const noise = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  class Scene {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.width = 0; this.height = 0;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const paper = document.createElement('canvas'); paper.width = paper.height = 160;
      const pen = paper.getContext('2d');
      for (let i = 0; i < 1300; i++) {
        pen.fillStyle = i % 2 ? '#3745250b' : '#ffffff30';
        pen.fillRect(noise(i + 1) * 160, noise(i + 2000) * 160, 0.5 + noise(i + 4000), 0.7);
      }
      this.paper = this.ctx.createPattern(paper, 'repeat');
      this.resize();
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width; this.height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.round(this.width * ratio));
      this.canvas.height = Math.max(1, Math.round(this.height * ratio));
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.unit = Math.min(this.width / 13, this.height / 8.6);
      this.rowH = this.unit * 0.82;
      this.bottom = this.height * 0.78;
    }
    point(x, row) { return [this.width / 2 + (x - 5) * this.unit, this.bottom - (row - this.camera) * this.rowH - (x - 5) * this.unit * 0.105]; }
    path(points, fill, stroke = ink, width = 1) {
      const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    }
    line(points, color = ink, width = 1) {
      const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.strokeStyle = color; c.lineWidth = width; c.stroke();
    }
    ellipse(x, y, rx, ry, color, outline) {
      const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill();
      if (outline) { c.strokeStyle = outline; c.lineWidth = 0.025; c.stroke(); }
    }
    ground(row, lane, time) {
      const c = this.ctx, s = this.unit, type = lane?.type || 'grass', seed = lane?.seed || row * 17;
      let fill = type === 'road' ? '#c7ccbd' : type === 'river' ? '#b4d1c7' : type === 'rail' ? '#ded8c5' : row % 2 ? '#dce5cb' : '#d5e0c3';
      this.path([this.point(-12, row + 0.5), this.point(23, row + 0.5), this.point(23, row - 0.5), this.point(-12, row - 0.5)], fill, null);
      if (type === 'grass') {
        for (let i = -6; i < 17; i++) {
          const [x, y] = this.point(i + noise(seed + i * 7) * 0.7, row + noise(seed + i * 3) * 0.6 - 0.3);
          const f = noise(seed + i * 19);
          if (f < 0.6) {
            this.line([[x - s * .07, y], [x - s * .1, y - s * .08]], '#a5b791', .7);
            this.line([[x, y], [x + s * .035, y - s * .11]], '#a5b791', .7);
          } else if (f > .86) {
            c.fillStyle = '#f3f1d5'; c.beginPath(); c.arc(x, y, s * .04, 0, 7); c.fill();
            c.fillStyle = '#c4ad6c'; c.beginPath(); c.arc(x, y, s * .017, 0, 7); c.fill();
          }
        }
        this.line([this.point(-7, row + .48), this.point(18, row + .48)], '#bac9a44a', .8);
      }
      if (type === 'road') {
        this.line([this.point(-8, row + .48), this.point(18, row + .48)], '#a7b09a', 1);
        this.line([this.point(-8, row - .47), this.point(18, row - .47)], '#e7e8d9', 1.5);
        for (let x = -7; x < 18; x += 1.5) this.line([this.point(x, row - .02), this.point(x + .65, row - .02)], '#eeeedc', Math.max(1.5, s * .035));
        for (let i = 0; i < 8; i++) {
          const x = -1 + noise(seed + i) * 13, r = row + noise(seed + i * 5) * .8 - .4;
          this.line([this.point(x, r), this.point(x + .12, r)], '#9aa68a55', .8);
        }
      }
      if (type === 'river') {
        this.line([this.point(-9, row + .48), this.point(19, row + .48)], '#92b3a4', 1);
        for (let i = -5; i < 17; i++) {
          const x = i + noise(seed + i) + (this.reduced ? 0 : Math.sin(time * .7 + i) * .1), r = row + noise(seed + i * 3) * .65 - .35;
          this.line([this.point(x, r), this.point(x + .15, r + .015), this.point(x + .4, r)], '#e6eee29e', Math.max(1, s * .022));
        }
      }
      if (type === 'rail') {
        for (let x = -9; x < 19; x += .43) {
          this.line([this.point(x, row - .29), this.point(x + .035, row + .29)], '#b4a58a', s * .095);
          this.line([this.point(x - .015, row - .27), this.point(x + .02, row + .27)], '#938b75', .7);
        }
        for (const offset of [-.21, .21]) {
          this.line([this.point(-9, row + offset), this.point(19, row + offset)], '#777f70', s * .055);
          this.line([this.point(-9, row + offset + .022), this.point(19, row + offset + .022)], '#f2eddf', 1);
        }
      }
      if (row >= 0 && row % 5 === 0) {
        const [x, y] = this.point(-.85, row);
        c.font = `${Math.max(8, s * .16)}px Georgia`; c.textAlign = 'center'; c.fillStyle = '#65785580'; c.fillText(String(row).padStart(2, '0'), x, y);
      }
      if (row === 0) {
        for (let x = 3; x <= 7; x++) {
          const [px, py] = this.point(x, -.48);
          this.line([[px - s * .1, py], [px + s * .1, py]], '#95a57f', 1.5);
        }
      }
    }
    tree(x, row, seed) {
      const c = this.ctx, s = this.unit, [px, py] = this.point(x, row);
      c.save(); c.translate(px, py); c.scale(s, s);
      this.ellipse(.12, .08, .4, .12, '#596c4020');
      this.path([[-.08, .03], [.08, .04], [.07, -.55], [-.04, -.59]], '#b4a183', '#7a7c62', .018);
      const paint = noise(seed) > .5 ? '#a6bb91' : '#bbca9c';
      this.path([[-.42, -.42], [-.33, -.7], [-.39, -.85], [-.22, -1.06], [.03, -1.12], [.32, -.95], [.33, -.75], [.43, -.53], [.24, -.34], [-.08, -.3]], paint, '#829371', .022);
      this.line([[-.34, -.48], [-.28, -.68], [-.31, -.83], [-.15, -1.01]], '#edf0cf88', .025);
      for (let i = 0; i < 5; i++) {
        const xx = -.25 + i * .1, yy = -.54 - noise(seed + i) * .27;
        this.line([[xx, yy], [xx + .1, yy - .07]], '#71865c50', .015);
      }
      this.line([[.02, -.38], [.02, -.63], [-.13, -.75]], '#84916b', .017);
      c.restore();
    }
    rock(x, row) {
      const c = this.ctx, s = this.unit, [px, py] = this.point(x, row);
      c.save(); c.translate(px, py); c.scale(s, s);
      this.ellipse(.1, .07, .35, .1, '#596c401a');
      this.path([[-.31, .02], [-.34, -.23], [-.13, -.43], [.18, -.39], [.35, -.13], [.27, .07], [-.08, .1]], '#c6c9b5', '#8b947c', .025);
      this.line([[-.29, -.21], [-.11, -.33], [.12, -.3], [.2, -.17]], '#e8e7d6', .03);
      this.line([[.18, -.39], [.06, -.14], [.27, .07]], '#a2ac94', .018); c.restore();
    }
    log(o, row) {
      const c = this.ctx, [x, y] = this.point(o.x, row), s = this.unit, w = o.width / 2;
      c.save(); c.translate(x, y); c.transform(s, -s * .105, 0, s, 0, 0);
      this.ellipse(.08, .13, w + .08, .24, '#5e908027');
      this.path([[-w, -.18], [-w + .12, -.27], [w - .07, -.24], [w, -.12], [w, .16], [w - .1, .24], [-w + .08, .23], [-w, .14]], '#c2a97b', '#8b8265', .025);
      this.path([[-w, .05], [w, .05], [w, .18], [w - .1, .24], [-w + .08, .23]], '#af966d', null);
      for (let i = 0; i < 4; i++) this.line([[-w + .19, -.17 + i * .09], [-.2, -.15 + i * .09], [w - .14, -.18 + i * .1]], '#847c5966', .017);
      this.ellipse(-w + .08, -.015, .085, .2, '#d8c291', '#9b8c67');
      this.ellipse(-w + .08, -.015, .035, .105, '#c6ad7c', '#aa956c');
      this.ellipse(w * .4, -.1, .13, .045, '#c4aa7a', '#a38d63');
      c.restore();
    }
    car(o, row, dir) {
      const c = this.ctx, [x, y] = this.point(o.x, row), s = this.unit, w = o.width / 2;
      c.save(); c.translate(x, y); c.transform(s, -s * .105, 0, s, 0, 0); c.scale(dir, 1);
      this.ellipse(.07, .17, w + .07, .26, '#52604825');
      this.ellipse(-w + .24, .1, .14, .17, '#636a5b'); this.ellipse(w - .23, .1, .14, .17, '#636a5b');
      this.ellipse(-w + .24, .11, .055, .08, '#bfc2b1'); this.ellipse(w - .23, .11, .055, .08, '#bfc2b1');
      this.path([[-w, -.28], [-w + .06, -.42], [w - .14, -.42], [w, -.28], [w, .02], [w - .07, .09], [-w + .04, .09]], paints[o.color], '#77806b', .022);
      this.path([[-w, -.03], [w, -.03], [w, .03], [w - .07, .09], [-w + .04, .09]], '#71826926', null);
      if (o.width > 1.8) {
        this.path([[-w + .04, -.4], [-w + .04, -.75], [w - .55, -.75], [w - .46, -.42]], '#e3ddc7', '#8c927b', .023);
        for (let i = -w + .22; i < w - .55; i += .16) this.line([[i, -.68], [i, -.45]], '#a9ad9566', .015);
        this.path([[w - .45, -.43], [w - .5, -.68], [w - .24, -.65], [w - .06, -.43]], '#d7e3dd', '#7c8e83', .019);
      } else {
        this.path([[-w + .2, -.41], [-w + .35, -.66], [w - .36, -.64], [w - .13, -.41]], '#d9e4dc', '#768b7b', .022);
        this.line([[-.02, -.63], [.04, -.42]], '#839180', .023);
        this.line([[-w + .34, -.69], [w - .36, -.67]], paints[o.color], .07);
      }
      this.line([[w - .06, -.27], [w - .06, -.15]], '#fff7cd', .06);
      this.line([[-w + .035, -.23], [-w + .035, -.14]], '#b67e68', .045);
      this.line([[-.04, -.22], [.08, -.22]], '#7a856e', .025);
      this.line([[-w + .12, -.36], [-w + .27, -.37]], '#fffbed99', .02); c.restore();
    }
    signal(lane, x) {
      const c = this.ctx, s = this.unit, [px, py] = this.point(x, lane.row);
      c.save(); c.translate(px, py); c.scale(s, s);
      const active = lane.phase !== 'wait';
      this.line([[0, .1], [0, -.94]], '#7a8169', .055);
      this.line([[-.2, -.94], [.2, -.68]], '#f8f3dc', .1); this.line([[-.2, -.68], [.2, -.94]], '#f8f3dc', .1);
      this.line([[-.2, -.94], [.2, -.68]], '#9a8d6d', .018); this.line([[-.2, -.68], [.2, -.94]], '#9a8d6d', .018);
      this.path([[-.24, -.57], [.24, -.57], [.24, -.32], [-.24, -.32]], '#797f69', null);
      for (let i = 0; i < 2; i++) {
        const flash = active && (this.reduced || Math.floor(this.time * 4) % 2 === i);
        this.ellipse(i ? .12 : -.12, -.445, .075, .075, flash ? '#d4785b' : '#a6a68b');
      }
      if (active) { c.font = 'bold .23px sans-serif'; c.fillStyle = '#875e44'; c.textAlign = 'center'; c.fillText('!', 0, -1.13); }
      c.restore();
    }
    train(lane) {
      for (let i = 0; i < 4; i++) {
        const x = lane.train.x + (3 - i * 2) * lane.dir;
        const [px, py] = this.point(x, lane.row), c = this.ctx, s = this.unit;
        c.save(); c.translate(px, py); c.transform(s, -s * .105, 0, s, 0, 0); c.scale(lane.dir, 1);
        this.ellipse(.1, .13, 1, .22, '#58644728');
        for (const wheel of [-.64, .62]) this.ellipse(wheel, .1, .16, .16, '#666f60');
        this.path([[-.97, -.58], [-.86, -.81], [.76, -.81], [.97, -.54], [.97, .02], [-.97, .02]], i ? '#aab9aa' : '#b3bd9e', '#69765f', .025);
        this.line([[-.94, -.14], [.96, -.14]], '#e9deaf', .09);
        for (let j = 0; j < 3; j++) this.path([[-.7 + j * .5, -.62], [-.35 + j * .5, -.62], [-.35 + j * .5, -.32], [-.7 + j * .5, -.32]], '#dce4d9', '#819383', .018);
        if (!i) { this.line([[.95, -.45], [.95, -.3]], '#f3edc0', .08); this.path([[.2, -.82], [.48, -.82], [.48, -.94], [.2, -.94]], '#8c9980', '#69765f', .02); }
        this.line([[-.77, -.76], [.68, -.76]], '#eff0d7', .022); c.restore();
      }
    }
    chicken(game) {
      const p = game.player, c = this.ctx, s = this.unit, [px, py] = this.point(p.x, p.visualRow);
      const jumping = p.hop ? Math.sin(p.hop.elapsed / ChickenCrossing.HOP * Math.PI) : 0;
      c.save(); c.translate(px, py); c.scale(s, s);
      this.ellipse(.04, .1, .3 - jumping * .06, .11 - jumping * .025, '#53663c35');
      if (game.status === 'dead' && (game.reason === 'water' || game.reason === 'drift')) {
        c.strokeStyle = '#f3f1d2'; c.lineWidth = .035;
        c.beginPath(); c.ellipse(0, 0, .46, .19, 0, 0, 7); c.stroke();
        c.translate(0, .23); c.globalAlpha = .72;
      }
      c.translate(0, -jumping * .3); c.scale(p.facing === 'left' ? -1 : 1, 1);
      if (game.status === 'dead' && ['car', 'train'].includes(game.reason)) { c.rotate(-.5); c.scale(1.1, .7); }
      this.line([[-.12, -.02], [-.14, .15], [-.23, .15]], '#ae8850', .035);
      this.line([[.09, -.02], [.14, .13], [.23, .13]], '#ae8850', .035);
      this.path([[-.24, -.21], [-.45, -.43], [-.44, -.13], [-.22, -.04]], '#eee0a9', ink, .022);
      c.beginPath(); c.moveTo(-.29, -.23); c.bezierCurveTo(-.39, -.65, .16, -.75, .28, -.39); c.bezierCurveTo(.42, .03, -.22, .18, -.29, -.23); c.fillStyle = '#f2dda1'; c.fill(); c.strokeStyle = ink; c.lineWidth = .025; c.stroke();
      this.ellipse(.12, -.62, .25, .25, '#f7e7b4', ink);
      this.path([[.03, -.85], [-.02, -1], [.07, -1.02], [.13, -.89], [.18, -1.01], [.27, -.98], [.25, -.82]], '#c78e70', ink, .019);
      this.path([[.34, -.66], [.51, -.58], [.34, -.53]], '#d2a35c', '#9d885b', .019);
      this.ellipse(.24, -.67, .031, .037, '#414c3c');
      this.ellipse(.23, -.52, .06, .032, '#dfb890');
      c.beginPath(); c.moveTo(-.23, -.3); c.bezierCurveTo(-.02, -.51, .16, -.24, -.02, -.12); c.bezierCurveTo(-.1, -.08, -.21, -.1, -.25, -.16); c.strokeStyle = '#a99c66'; c.lineWidth = .022; c.stroke();
      this.line([[-.15, -.22], [-.07, -.28]], '#c2ae70', .018); this.line([[-.13, -.16], [-.05, -.22]], '#c2ae70', .018);
      c.restore();
    }
    draw(game) {
      if (!this.width || !this.height) return;
      const c = this.ctx; this.camera = game.camera; this.time = game.time;
      c.clearRect(0, 0, this.width, this.height); c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = '#dbe4cc'; c.fillRect(0, 0, this.width, this.height);
      const top = Math.ceil(this.camera + this.bottom / this.rowH + 3), bottom = Math.floor(this.camera - (this.height - this.bottom) / this.rowH - 3);
      for (let row = top; row >= bottom; row--) this.ground(row, game.lane(row), game.time);
      for (let row = top; row >= bottom; row--) {
        const lane = game.lane(row);
        if (lane?.type === 'river') for (const o of lane.objects) this.log(o, row);
      }
      const entities = [];
      for (let row = top; row >= bottom; row--) {
        const lane = game.lane(row);
        if (lane?.type === 'road') for (const o of lane.objects) entities.push({ depth: row + (o.x - 5) * .128, draw: () => this.car(o, row, lane.dir) });
        if (lane?.type === 'rail') {
          for (const x of [-.9, 10.9]) entities.push({ depth: row + (x - 5) * .128, draw: () => this.signal(lane, x) });
          if (lane.train) entities.push({ depth: row + (lane.train.x - 5) * .128, draw: () => this.train(lane) });
        }
        if (lane?.blocks) for (const b of lane.blocks) entities.push({ depth: row + (b.x - 5) * .128, draw: () => b.kind === 'tree' ? this.tree(b.x, row, lane.seed + b.x) : this.rock(b.x, row) });
        if ((!lane || lane.type === 'grass') && row % 2 === 0) {
          for (const x of [-2.1, 12.2]) entities.push({ depth: row + (x - 5) * .128, draw: () => this.tree(x, row, row * 3 + x) });
        }
      }
      entities.push({ depth: game.player.visualRow + (game.player.x - 5) * .128, draw: () => this.chicken(game) });
      entities.sort((a, b) => b.depth - a.depth).forEach(o => o.draw());
      c.fillStyle = this.paper; c.fillRect(0, 0, this.width, this.height);
      // A faint pencil frame marks the traversable eleven-column strip.
      for (const x of [-.5, 10.5]) {
        c.setLineDash([2, 7]); this.line([this.point(x, bottom), this.point(x, top)], '#71836228', .7); c.setLineDash([]);
      }
    }
  }
  window.ChickenScene = Scene;
})();
