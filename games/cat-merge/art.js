(function (root) {
  'use strict';
  const colors = ['#ece3cf', '#e8c49f', '#bdcbd0', '#c9b8a6', '#c3cfb2', '#b1c6cf', '#e8d7b6', '#cbbfd0', '#d4b895', '#e9dfbb'];
  const ink = '#626452';

  function path(ctx, points, close = false) {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
    if (close) ctx.closePath();
    ctx.stroke();
  }

  function cat(ctx, x, y, r, level, angle = 0, opacity = 1, pop = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(r * pop, r * pop);
    ctx.globalAlpha *= opacity; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = colors[level]; ctx.strokeStyle = ink; ctx.lineWidth = .033;
    ctx.beginPath();
    ctx.moveTo(-.82, -.36);
    ctx.quadraticCurveTo(-.88, -.65, -.65, -.93);
    ctx.quadraticCurveTo(-.41, -.87, -.28, -.72);
    ctx.quadraticCurveTo(0, -.82, .28, -.72);
    ctx.quadraticCurveTo(.51, -.95, .69, -.93);
    ctx.quadraticCurveTo(.86, -.68, .81, -.36);
    ctx.bezierCurveTo(1.17, .09, .91, .91, .17, .98);
    ctx.bezierCurveTo(-.65, 1.08, -1.18, .37, -.82, -.36);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // A second, incomplete outline and fixed hatch marks give the drawing a pencil edge.
    ctx.globalAlpha *= .3; ctx.lineWidth = .014;
    ctx.beginPath(); ctx.moveTo(-.88, .1); ctx.bezierCurveTo(-.91, .61, -.44, 1.01, .03, .95); ctx.stroke();
    ctx.globalAlpha /= .3;
    ctx.fillStyle = '#ceaaa080';
    for (const sign of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sign * .49, -.61); ctx.lineTo(sign * .65, -.82); ctx.lineTo(sign * .71, -.5); ctx.closePath(); ctx.fill();
    }
    // Each growth stage has a distinct coat, as well as a visible level number.
    if ([1, 3, 8].includes(level)) {
      ctx.strokeStyle = level === 3 ? '#937f69' : '#b38f69'; ctx.lineWidth = .07;
      path(ctx, [[-.18,-.62],[-.13,-.39]]); path(ctx, [[0,-.68],[.01,-.43]]); path(ctx, [[.19,-.62],[.15,-.39]]);
      for (const s of [-1,1]) { path(ctx, [[s*.81,.05],[s*.64,.11]]); path(ctx, [[s*.82,.22],[s*.65,.24]]); }
    }
    if ([2, 5, 6, 7].includes(level)) {
      ctx.fillStyle = level === 6 ? '#c79e7d' : '#8c9fa55c';
      ctx.beginPath(); ctx.ellipse(-.42, -.3, .29, .3, -.4, 0, Math.PI * 2); ctx.fill();
      if (level === 6) { ctx.fillStyle = '#929584'; ctx.beginPath(); ctx.ellipse(.54,.25,.25,.32,.45,0,Math.PI*2); ctx.fill(); }
    }
    if ([0, 3, 4, 8, 9].includes(level)) {
      ctx.fillStyle = '#fffdf35c'; ctx.beginPath(); ctx.ellipse(0,.52,.47,.31,0,0,Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = '#515449'; ctx.lineWidth = .045;
    if (level === 4 || level === 7 || level === 9) {
      for (const s of [-1,1]) { ctx.beginPath(); ctx.arc(s*.29,-.02,.105,Math.PI*1.13,Math.PI*1.87); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#515449';
      for (const s of [-1,1]) { ctx.beginPath(); ctx.ellipse(s*.29,-.04,.042,.073,0,0,Math.PI*2); ctx.fill(); }
    }
    ctx.fillStyle = '#aa8477'; ctx.beginPath(); ctx.moveTo(-.06,.12); ctx.lineTo(.06,.12); ctx.lineTo(0,.18); ctx.closePath(); ctx.fill();
    ctx.lineWidth = .025;
    ctx.beginPath(); ctx.moveTo(0,.18); ctx.quadraticCurveTo(-.01,.31,-.14,.25); ctx.moveTo(0,.18); ctx.quadraticCurveTo(.02,.31,.14,.25); ctx.stroke();
    ctx.fillStyle = '#d3a39b55';
    for (const s of [-1,1]) {
      ctx.beginPath(); ctx.ellipse(s*.46,.17,.12,.067,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#7c7c695c'; ctx.lineWidth = .018;
      path(ctx, [[s*.61,.12],[s*.88,.08]]); path(ctx, [[s*.62,.22],[s*.85,.28]]);
    }
    ctx.fillStyle = '#5b604f'; ctx.font = '500 .20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(level + 1).padStart(2, '0'), 0, .63);
    if (level === 9) {
      ctx.fillStyle = '#c5ab6d'; ctx.strokeStyle = '#8b7d58'; ctx.lineWidth = .025;
      ctx.beginPath(); ctx.moveTo(-.28,-.72); ctx.lineTo(-.35,-1.01); ctx.lineTo(-.11,-.9); ctx.lineTo(0,-1.13); ctx.lineTo(.13,-.9); ctx.lineTo(.35,-1.01); ctx.lineTo(.28,-.72); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  root.CatMergeArt = { cat, colors };
})(typeof globalThis !== 'undefined' ? globalThis : this);
