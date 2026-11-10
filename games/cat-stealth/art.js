(() => {
  'use strict';
  const E = CatStealth, ink = '#66705c';
  function paint(canvas, s, options) {
    const c = canvas.getContext('2d'), scale = canvas.width / E.WIDTH;
    c.setTransform(scale, 0, 0, scale, 0, 0); c.clearRect(0, 0, E.WIDTH, E.HEIGHT);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 1.3; c.strokeStyle = ink;
    const line = (pts, color = ink, width = 1.3, close = false, fill) => {
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); if (close) c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = color; c.lineWidth = width; c.stroke();
    };
    const ellipse = (x, y, rx, ry, fill, stroke = ink) => {
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.2; c.stroke(); }
    };
    const text = (value, x, y, size = 12, color = ink) => { c.font = `${size}px "Segoe UI","Microsoft YaHei",sans-serif`; c.textAlign = 'center'; c.fillStyle = color; c.fillText(value, x, y); };
    const paw = (x, y, size, color) => { c.save(); c.translate(x, y); c.scale(size, size); ellipse(0, 3, 6, 5, color, null); for (const [a, b] of [[-6, -3], [-2, -7], [3, -7], [7, -2]]) ellipse(a, b, 2.5, 3, color, null); c.restore(); };
    c.fillStyle = '#f3f0e3'; c.fillRect(0, 0, E.WIDTH, E.HEIGHT);
    for (let y = 1; y < E.ROWS - 1; y++) for (let x = 1; x < E.COLS - 1; x++) {
      c.fillStyle = (x + y) % 2 ? '#f2f0e5' : '#f7f5eb'; c.fillRect(x * 48, y * 48, 48, 48);
      line([[x * 48 + 1, y * 48 + 48], [x * 48 + 47, y * 48 + 48]], '#e4e3d5', .65);
      line([[x * 48, y * 48 + 1], [x * 48, y * 48 + 47]], '#e4e3d5', .65);
      if ((x * 13 + y * 7) % 5 === 0) line([[x * 48 + 8, y * 48 + 33], [x * 48 + 15, y * 48 + 32]], '#e5e3d4', .8);
    }
    // A double pencil outline and little crosshatches keep the room a drawn map.
    line([[46, 49], [718, 47], [721, 528], [49, 530], [46, 49]], '#9aa18a', 2);
    line([[42, 44], [725, 42], [726, 535], [44, 536], [42, 44]], '#c6cbb8', .9);
    for (let x = 55; x < 715; x += 21) { line([[x, 31], [x + 9, 41]], '#c7cdb9', .8); line([[x, 538], [x + 8, 548]], '#c7cdb9', .8); }
    for (let y = 60; y < 520; y += 22) { line([[31, y], [41, y + 8]], '#c7cdb9', .8); line([[727, y], [736, y + 8]], '#c7cdb9', .8); }
    // The exit mat is the same location as the starting point.
    c.save(); c.translate(s.exit.x, s.exit.y);
    line([[-25, -24], [25, -25], [26, 25], [-26, 24]], '#8e9e79', 1.3, true, '#dce6cd');
    paw(0, -1, 1.35, '#91a17b'); text(options.t('exit'), 0, 39, 10, '#7c8d6a'); c.restore();
    if (s.fish.every(f => f.taken)) {
      c.setLineDash([5, 5]); c.strokeStyle = '#7f9a6b'; c.lineWidth = 2; c.beginPath(); c.arc(s.exit.x, s.exit.y, 34, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    }
    if (options.routes) for (const g of s.guards) {
      const route = [];
      for (let i = 0; i < g.route.length; i++) route.push(g.route[i], ...(E.path(s, g.route[i], g.route[(i + 1) % g.route.length]) || []));
      c.setLineDash([4, 7]); line(route.map(p => [p.x, p.y]), '#afb99e', 1.4); c.setLineDash([]);
      for (const p of g.route) ellipse(p.x, p.y, 3, 3, '#e9ecdF', '#a9b598');
    }
    // Cast each cone ray against the shelf geometry. Drawing and detection share occlusion.
    for (const g of s.guards) {
      c.beginPath(); c.moveTo(g.x, g.y);
      for (let i = 0; i <= 36; i++) {
        const a = g.angle - .57 + 1.14 * i / 36; let r = 0;
        while (r < g.range && !E.solid(s, g.x + Math.cos(a) * r, g.y + Math.sin(a) * r)) r += 4;
        c.lineTo(g.x + Math.cos(a) * Math.min(r, g.range), g.y + Math.sin(a) * Math.min(r, g.range));
      }
      c.closePath(); c.fillStyle = g.suspicion > .3 ? '#c9826042' : '#d6bf733b'; c.fill(); c.strokeStyle = g.suspicion > .3 ? '#bd866175' : '#c6b37170'; c.lineWidth = .8; c.stroke();
    }
    // Shelves have inset timber panels, pencil grain and jars of fish.
    for (let i = 0; i < s.level.blocks.length; i++) {
      const [col, row, w, h] = s.level.blocks[i], x = col * 48, y = row * 48;
      c.fillStyle = '#a6aa8c20'; c.fillRect(x + 4, y + 7, w * 48, h * 48);
      line([[x + 2, y + 2], [x + w * 48 - 2, y + 1], [x + w * 48 - 1, y + h * 48 - 2], [x + 1, y + h * 48 - 1]], '#9ba388', 1.8, true, i % 2 ? '#d5ddc6' : '#dfe2ce');
      line([[x + 7, y + 8], [x + w * 48 - 8, y + 7], [x + w * 48 - 8, y + h * 48 - 9], [x + 8, y + h * 48 - 8]], '#b4bca2', .9, true);
      for (let row = 0; row < h; row++) {
        line([[x + 3, y + row * 48 + 42], [x + w * 48 - 3, y + row * 48 + 41]], '#a5af94', 1.2);
        for (let col = 0; col < w; col++) {
          const jx = x + col * 48 + 24, jy = y + row * 48 + 25;
          if ((col + row + i) % 3 === 0) {
            ellipse(jx, jy + 1, 13, 13, '#eee6cc', '#b5aa88'); ellipse(jx, jy + 1, 8, 8, '#e7d9b5', '#cabd9d');
            line([[jx - 3, jy - 4], [jx + 5, jy + 3]], '#ad9f79', 1);
          } else {
            line([[jx - 10, jy - 11], [jx + 10, jy - 11], [jx + 11, jy + 12], [jx - 11, jy + 12]], '#a6af9a', 1, true, '#eef0df');
            line([[jx - 11, jy - 10], [jx + 11, jy - 10]], '#a0ad93', 4);
            ellipse(jx + 1, jy + 2, 6, 3, '#c5b889', null); line([[jx - 4, jy + 2], [jx - 8, jy - 1], [jx - 8, jy + 5]], '#b9ac7e', .8, true, '#c5b889');
          }
        }
      }
      for (let j = 0; j < 4; j++) line([[x + 4 + j * 7, y + h * 48 - 6], [x + 8 + j * 7, y + h * 48 - 2]], '#aab298', .7);
    }
    // Cardboard folds and flaps; the cat's ears peek out while hidden.
    s.boxes.forEach((b, i) => {
      c.save(); c.translate(b.x, b.y);
      ellipse(2, 17, 24, 7, '#8e8a6120', null);
      line([[-19, -13], [17, -15], [21, 19], [-18, 21]], '#ad9873', 1.4, true, '#d9c59e');
      line([[-19, -13], [-6, -23], [6, -11], [17, -15], [29, -6], [11, 1], [-7, -1], [-28, -5]], '#a18d6b', 1.2, true, '#e6d5ae');
      line([[-7, -1], [11, 1], [17, -15], [6, -11]], '#a18d6b', 1, true, '#8f8267');
      line([[-4, 3], [-3, 19], [4, 19], [3, 3]], '#c2ad82', .7, true, '#e8dabb');
      line([[-14, 9], [-9, 9], [-10, 15], [-15, 15]], '#b09a74', .7, true);
      if (s.player.hidden === i) {
        line([[-8, -6], [-9, -18], [-2, -12], [7, -14], [11, -21], [13, -7]], ink, 1.3, true, '#cfa778');
        text('· ·', 2, -3, 15, '#4d5846');
      } else if (s.status === 'playing' && E.nearbyBox(s) === i) { text('E', 0, -30, 13, '#658052'); }
      c.restore();
    });
    for (const f of s.fish) if (!f.taken) {
      const bob = options.reduced ? 0 : Math.sin(s.time * 2.6 + f.x) * 2;
      c.save(); c.translate(f.x, f.y + bob); c.rotate(-.17);
      ellipse(1, 11, 18, 4, '#b0a17418', null);
      line([[-8, 0], [-20, -9], [-18, 10]], '#a68d58', 1.2, true, '#d8bc7d');
      c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(3, -18, 20, 0); c.quadraticCurveTo(3, 18, -9, 0); c.fillStyle = '#e0c486'; c.fill(); c.strokeStyle = '#a68d58'; c.stroke();
      ellipse(12, -2, 1.5, 1.5, '#646445', null); line([[0, -7], [-2, 0], [0, 7]], '#b39d65', 1);
      line([[21, -16], [21, -10]], '#b9a66e', 1); line([[18, -13], [24, -13]], '#b9a66e', 1); c.restore();
    }
    if (s.target && s.player.hidden < 0) {
      c.setLineDash([3, 5]); line([[s.player.x, s.player.y], ...s.path.map(p => [p.x, p.y])], '#91a981', 1.1); c.setLineDash([]);
      ellipse(s.target.x, s.target.y, 6, 6, '#9bac8325', '#9aaa84');
    }
    for (const n of s.noises) {
      c.globalAlpha = Math.max(0, 1 - n.age / 2.5); c.strokeStyle = '#a38d60'; c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(n.x, n.y, 12 + ((n.age * 34 + i * 18) % 65), 0, Math.PI * 2); c.stroke(); }
      c.globalAlpha = 1; ellipse(n.x, n.y, 5, 5, '#fffdf0', '#a8ab92');
    }
    for (const g of s.guards) {
      c.save(); c.translate(g.x, g.y); ellipse(0, 16, 21, 7, '#707b5e20', null); c.rotate(g.angle + Math.PI / 2);
      ellipse(-9, 12, 6, 9, '#68765d'); ellipse(9, 12, 6, 9, '#68765d');
      ellipse(0, 5, 17, 18, '#9eaf90'); line([[-11, 5], [11, 5]], '#7c8d70', 1); line([[0, 0], [0, 16]], '#7c8d70', .8);
      ellipse(-15, -12, 6, 11, '#b6a080'); ellipse(15, -12, 6, 11, '#b6a080'); ellipse(0, -11, 15, 14, '#dbc4a3');
      ellipse(-5, -16, 1.5, 1.7, '#526048', null); ellipse(5, -16, 1.5, 1.7, '#526048', null); ellipse(0, -22, 3, 2, '#657259', null);
      ellipse(0, -3, 16, 7, '#8d9e7e'); line([[-11, -8], [0, -11], [11, -8], [12, -1], [-12, -1]], '#748868', 1, true, '#a1b292');
      ellipse(0, -5, 2.5, 2.5, '#d4c790', null); c.restore();
      if (g.suspicion > .04 || g.mode !== 'patrol') {
        const alert = g.suspicion > .35;
        ellipse(g.x + 22, g.y - 27, 11, 11, alert ? '#f0d5bc' : '#faf4df', alert ? '#b38863' : '#c6b68c');
        text(alert ? '!' : '?', g.x + 22, g.y - 23, 15, alert ? '#a76e53' : '#998857');
      }
    }
    if (s.player.hidden < 0) {
      const p = s.player;
      c.save(); c.translate(p.x, p.y); ellipse(0, 15, 20, 6, '#99835420', null);
      // Keep the face upright, with a little lean toward the direction of travel.
      const flip = Math.cos(p.angle) < -.2 ? -1 : 1; c.scale(flip, 1);
      c.beginPath(); c.moveTo(12, 9); c.bezierCurveTo(32, 17, 33, -5, 23, -5); c.strokeStyle = '#b68b5e'; c.lineWidth = 6; c.stroke();
      c.lineWidth = 1.2; ellipse(0, 6, 13, 16, '#d2ad7b'); ellipse(-8, 17, 5, 4, '#e4c795'); ellipse(8, 17, 5, 4, '#e4c795');
      line([[-15, -8], [-15, -24], [-5, -17], [7, -17], [16, -25], [17, -6], [10, 3], [-8, 3]], '#927d59', 1.5, true, '#ddbb85');
      line([[-11, -18], [-11, -12], [-6, -14]], '#bd9781', 1, true, '#d3a38c');
      line([[12, -18], [8, -13], [13, -12]], '#bd9781', 1, true, '#d3a38c');
      ellipse(-6, -7, 2, 2.5, '#555e47', null); ellipse(8, -7, 2, 2.5, '#555e47', null);
      line([[0, -4], [3, -4], [1.5, -2]], '#a47766', 1, true, '#ba8d77');
      line([[1, -1], [-2, 1], [-5, 0]], '#8e7756', 1); line([[2, -1], [5, 1], [8, 0]], '#8e7756', 1);
      for (const side of [-1, 1]) { line([[side * 11, -3], [side * 22, -5]], '#9c8a63', .8); line([[side * 11, 0], [side * 21, 2]], '#9c8a63', .8); }
      line([[-3, -16], [-1, -12]], '#b8905a', 2); line([[3, -17], [3, -13]], '#b8905a', 2);
      line([[-9, 6], [9, 7], [6, 13]], '#7c9275', 2, false); c.restore();
    }
    if (options.aim) {
      c.save(); c.setLineDash([7, 6]); c.strokeStyle = '#a78d59'; c.lineWidth = 1.5; c.beginPath(); c.arc(s.player.x, s.player.y, 240, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    // A few fixed grain flecks; no flicker between frames.
    c.fillStyle = '#807b6410';
    for (let i = 0; i < 460; i++) c.fillRect((i * 157 + 31) % E.WIDTH, (i * 79 + 17) % E.HEIGHT, 1, 1);
  }
  window.CatStealthArt = { paint };
})();
