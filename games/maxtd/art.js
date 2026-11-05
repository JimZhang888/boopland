(function () {
  'use strict';
  const ink = '#343b32', skin = '#e5c4a0';
  const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const shadow = '<ellipse cx="50" cy="79" rx="29" ry="4" fill="#484b36" stroke="none" opacity=".12"/>';
  const scratch = '<path d="m22 83 10-1m32 1 12-2" opacity=".25" stroke-width="1"/>';
  const boots = '<path d="m37 67-2 11 12 1 1-12m8 0 1 12 12-1-5-12" fill="#465044"/><path d="m36 74 10 1m12 0 8-1" opacity=".5"/>';
  const head = '<path d="M35 28q-6-5-7 3 0 6 7 6m31-9q6-4 6 3-1 6-7 6" fill="' + skin + '"/><path d="M34 22q16-13 32 0l-2 18q-2 9-13 11-13-2-16-11Z" fill="' + skin + '"/><path d="m42 33 2 1m14-1 2-1m-13 10 7 1"/><path d="m51 34-2 5 4 1" stroke-width="1.1" opacity=".5"/>';
  const bodies = {
    rifle: `${boots}<path d="m34 46-11 12 9 10 8-8-4 12 30-1-2-17-9-9" fill="#7d8d6c"/><path d="m38 49 21 16m-15-13-2 16m13-15 4 14" stroke="#505d48"/><path d="m27 57 15 4m21-9 6 8-10 4" stroke="${skin}" stroke-width="8"/>${head}<path d="M30 27q0-22 22-20 20 1 20 21l-16-2-24 5Z" fill="#738364"/><path d="m32 23 36-2M46 9l-3 9m15-7 3 9" opacity=".55"/><path d="m28 25 44-1-1 5-42 3Z" fill="#4f624c"/><path d="m38 54 34-8 2 7-31 8-8 8-4-6Z" fill="#46524b"/><path d="m70 48 16-3 1 4-16 3m-20 4 5 11 6-2-4-10" fill="#46524b"/><path d="m41 57 12-2" stroke="#b7b5a0"/>`,
    sniper: `${boots}<path d="m34 47-14 14 12 9 10-6-5 8 32-1-5-24" fill="#789294"/><path d="m34 49 10 5m13-5 9 4m-26 7 7 8m7-8 9 6" stroke="#556f72"/>${head}<path d="M30 26 33 13q17-9 30 0l7 16-12-4-12 5-8-3-8 4Z" fill="#6d8986"/><path d="m35 16 7 2m9-6-4 8m11-5 5 7" opacity=".6"/><path d="m35 30 30-2-2 10-26 1Z" fill="#4c5e58"/><path d="m40 33 9-1" stroke="#d5d8b5"/><path d="m29 62 24-7m8-4 9 6" stroke="${skin}" stroke-width="7"/><path d="m22 62 44-10 4 7-31 8-9 4Z" fill="#4e5954"/><path d="m64 54 28-5 1 3-27 6m-14 4 6 11 5-2-4-11" fill="#4e5954"/><path d="m50 50 11-2 1 5-11 2Z" fill="#35423e"/><path d="m75 55 6 17m-6-17-2 17" stroke-width="1.4"/>`,
    rocket: `${boots}<path d="m34 46-9 10 11 14 30 1 2-23" fill="#ad8261"/><path d="m38 47 1 22m19-23 2 23" stroke="#d9b087" stroke-width="4"/>${head}<path d="M31 27q-2-18 17-19 16-2 21 18l-16-4-12 7Z" fill="#625745"/><path d="m32 22 35-1 2 6-36 4Z" fill="#ba774e"/><path d="m44 29 5 1m8-1 6-2"/><path d="m26 53 11 8 7-16m17 13 6-15" stroke="${skin}" stroke-width="8"/><path d="m24 43 50-12 5 15-48 14Z" fill="#61725c"/><path d="m20 42 8-2 6 19-8 3Zm51-12 10-3 6 18-10 3Z" fill="#485844"/><ellipse cx="84" cy="36" rx="5" ry="9" transform="rotate(-18 84 36)" fill="#2f3c32"/><path d="m40 45 17-4" stroke="#c6cbb0" stroke-width="3"/><path d="m48 54 3 9 7-2-2-9" fill="#414c3d"/>`,
    disruptor: `<path d="M35 23q-11-1-13 12l-5 23 13-7 6-22" fill="#514637"/>${boots}<path d="m35 46-11 12 9 10 7-5-2 9 28-1-1-19-10-6" fill="#9989a6"/><path d="m40 49 8 17 12-17m-21 15 23 1" stroke="#c7b8cb"/>${head}<path d="M31 26q-2-22 21-20 20 3 17 22l-10-5-8-8-10 11Z" fill="#514e3c"/><path d="m33 17 30-5-1-5-20-2-11 10Z" fill="#939778"/><path d="M29 28q0-23 24-22 22 2 19 25m-43-4 3 12 6-2-2-13m32 0-3 13 7 2 3-14" fill="#768572"/><path d="m71 37-5 8-11-1" stroke="#3f4f45"/><path d="m42 32 3 1m12-1 3-1"/><path d="m29 57 16 8m18-13-5 10" stroke="${skin}" stroke-width="7"/><path d="m38 55 25-5 5 17-25 5Z" fill="#617869"/><path d="m42 58 16-3 3 9-16 4Z" fill="#c7d5b4"/><path d="m45 62 3-2 4 3 5-4m6-8 4-9" stroke="#627659" stroke-width="1.5"/><path d="m70 18 7-4m-2 10 7-1" stroke="#9989a6"/>`,
    wall: '<path d="m13 65 4-17 22-3 12 5 13-5 20 3 4 18-5 12H19Z" fill="#b6a587"/><path d="m15 64 24 1 11-4 13 3 23-1m-47 2 1 12m23-13 1 12M17 49l24 2 10-2 16 3 18-2m-45 1 1 13m25-12-3 11"/><path d="m21 54 13-1m-9 16 9 1m36-16 9 1m-9 14 9 1" stroke="#ddd0b0"/><path d="m18 34 18-5 19 3 23-3 6 8-1 12-23 2-17-2-24 1-5-7Z" fill="#c8b593"/><path d="m35 31 5 10-1 9m21-18-2 17m-37-9 11-2m34 0 10-2"/>',
    damage: '<path d="m16 75 3-39 51-2 9 40Z" fill="#c6a182"/><path d="m12 40 7-14 50-1 14 13Z" fill="#9b7359"/><path d="m29 25-1-14 10-1 2 15m24 0 1-9 8 1-1 15" fill="#b6a38b"/><path d="m25 76 2-23 15-1 1 24" fill="#666e5a"/><path d="m51 48 17-1 1 15-17 1Z" fill="#e7d4a1"/><path d="m59 49 1 12m-8-6 16-1" stroke="#887854"/><path d="m19 69 5 1m23-2 29-1m-32-23 5-1m-27-9 40-1" opacity=".5"/><path d="m32 9-3-7m40 11 4-8" stroke="#9c9e8f"/><path d="m74 77 12-1-2-14-10 1Z" fill="#8b926c"/><path d="m33 57 1 7m-3-4 6-1" stroke="#d1bc87"/>',
    speed: '<path d="m19 75 1-35 58-1 4 42Z" fill="#a1ad90"/><path d="m15 39 17-18 36-1 16 18Z" fill="#6d8169"/><path d="m34 23 9 13m3-14 8 14m3-14 9 13" stroke="#93aa8e"/><path d="m29 75 1-23 14-1 2 25" fill="#5c7264"/><path d="m53 49 20-1 1 15-21 1Z" fill="#d8d8b4"/><path d="m62 49 1 14m-9-7 19-1" stroke="#6e8270"/><path d="m72 28 1-21m-8 3 16-1m-12 8 9-1"/><path d="m23 68 4 1m23 0 27-1" opacity=".4"/><path d="m51 22 8-10-1 8 8-1-9 12 2-9Z" fill="#ddbd73" stroke-width="1.3"/>',
    slow: '<path d="m18 76 2-24 57-1 5 25Z" fill="#afacbb"/><path d="M23 49q-3-28 24-29 26-1 27 30Z" fill="#9793a9"/><path d="M46 22q-11 15-8 28m12-28q12 11 13 28M27 36l41-1" stroke="#c4bece"/><path d="m16 50 62-1 3 6-65 2Z" fill="#c9c2ca"/><path d="m38 76 1-17 18-1 1 19" fill="#6a7180"/><path d="m47 63 1 10m-5-5 10-1" stroke="#d7d1b8"/><path d="m63 26 9-13 12-3 3 10-13 6-9 8Z" fill="#c3b8bc"/><path d="m81 11 5 9m-68 44 11-1 1 7-11 1m47-8 7-1 1 8-7 1"/><path d="m34 13 2-4m-7 8-4-1m26-4 2-4" stroke="#a59cb0"/>'
  };
  function portrait(type) { return wrap(shadow + (bodies[type] || bodies.rifle) + scratch); }
  const images = {};
  for (const type of Object.keys(bodies)) { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portrait(type)); images[type] = img; }

  const iconPaths = {
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 8.5h-4a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4h-4M12 6v12"/>',
    heart: '<path d="M12 20 4 12C-2 5 8 0 12 7 16 0 26 5 20 12Z"/>',
    flag: '<path d="M5 22V3m0 1 13-1-2 5 3 5-14 1"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
    pause: '<path d="M8 4v16M16 4v16" stroke-width="4"/>',
    sound: '<path d="m3 9 5-1 5-5v18l-5-5-5-1ZM17 7q6 5 0 10m3-14q9 9 0 18"/>',
    muted: '<path d="m3 9 5-1 5-5v18l-5-5-5-1ZM17 9l5 6m0-6-5 6"/>',
    book: '<path d="M12 5Q8 2 2 4v15q6-2 10 1 4-3 10-1V4q-6-2-10 1v15M5 8l4 1M5 12l4 1m6-4 4-1m-4 5 4-1"/>',
    trophy: '<path d="M7 3h10v7q0 6-5 6t-5-6ZM7 5H3v4q0 4 5 4m9-8h4v4q0 4-5 4m-4 3v5m-5 1h10"/>',
    path: '<path d="M3 19h6V5h7v14h5m-3-3 3 3-3 3"/>',
    arrow: '<path d="M3 12h17m-6-6 6 6-6 6"/>',
    close: '<path d="m5 5 14 14M5 19 19 5"/>',
    upgrade: '<path d="m5 14 7-8 7 8m-14 6 7-8 7 8"/>',
    sell: '<path d="m3 7 5-4h13v12l-6 6-12-12ZM16 7h1"/>',
    restart: '<path d="M4 9a9 9 0 1 1 0 8M4 3v6h6"/>',
    target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
    check: '<path d="m5 12 4 5L20 6"/>',
    spark: '<path d="m14 2-9 12h7l-2 8 10-13h-8Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    shield: '<path d="m12 2 9 4-1 9-8 7-8-7-1-9Z"/><path d="m8 11 3 3 5-6"/>'
  };
  function icon(name, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.target}</svg>`; }

  function tower(ctx, b, cell, preview = false) {
    const x = (b.x + 0.5) * cell, y = (b.y + 0.5) * cell;
    ctx.save(); ctx.translate(x, y);
    if (preview) ctx.globalAlpha = 0.65;
    if (b.type !== 'wall') {
      ctx.fillStyle = '#eeebdb'; ctx.strokeStyle = '#8a917a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-cell * .42, -cell * .34); ctx.lineTo(cell * .39, -cell * .38); ctx.lineTo(cell * .4, cell * .39); ctx.lineTo(-cell * .38, cell * .4); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const img = images[b.type], size = b.type === 'wall' ? cell * 1.03 : cell * 1.32;
    if (img && img.complete) ctx.drawImage(img, -size / 2, -size * .58, size, size * .9);
    if (b.level > 1) {
      ctx.fillStyle = '#dfb36b'; ctx.strokeStyle = ink; ctx.lineWidth = .8;
      for (let i = 0; i < b.level - 1; i++) { ctx.beginPath(); ctx.arc(-3 + i * 6, cell * .32, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    if (b.flash > 0) {
      const a = b.angle; ctx.translate(Math.cos(a) * cell * .35, Math.sin(a) * cell * .35); ctx.rotate(a);
      ctx.fillStyle = '#efc96d'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(12, -2); ctx.lineTo(7, 1); ctx.lineTo(13, 5); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function enemy(ctx, e, cell, time) {
    const big = e.type === 'big', r = cell * (big ? .33 : .22), bob = Math.sin(time * 15 + e.phase) * 1.3;
    const angle = Math.atan2(e.toY + .5 - e.y, e.toX + .5 - e.x);
    ctx.save(); ctx.translate(e.x * cell, e.y * cell);
    ctx.fillStyle = '#423b3020'; ctx.beginPath(); ctx.ellipse(0, r * .7, r * 1.2, r * .47, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(angle); ctx.strokeStyle = '#49483c'; ctx.lineWidth = big ? 2.2 : 1.8;
    for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * .5, side * r * .6); ctx.lineTo(i * r * .7 + bob * side, side * r * 1.3); ctx.lineTo(i * r * .7 - r * .3 + bob * side, side * r * 1.35); ctx.stroke(); }
    ctx.fillStyle = e.hit > 0 ? '#f4e3ce' : big ? '#b49768' : '#b98772';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * .84, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = big ? '#7d8164' : '#9c6e5c';
    ctx.beginPath(); ctx.moveTo(-r * .4, -r * .7); ctx.lineTo(r * .2, -r * .62); ctx.lineTo(r * .4, r * .55); ctx.lineTo(-r * .45, r * .64); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ede7c8';
    for (const y of [-.37, .37]) { ctx.beginPath(); ctx.arc(r * .7, y * r, big ? 3 : 2.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3c3d31'; ctx.beginPath(); ctx.arc(r * .8, y * r, 1.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ede7c8'; }
    if (big) { ctx.strokeStyle = '#d8c39c'; ctx.beginPath(); ctx.moveTo(-r * .2, -r * .4); ctx.lineTo(r * .08, r * .35); ctx.stroke(); }
    ctx.restore();
    if (e.slowTime > 0) { ctx.strokeStyle = '#9984b0'; ctx.lineWidth = 1.7; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(0, 0, r + 5, r + 2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (e.hp < e.maxHp && e.hp > 0) {
      const w = big ? 31 : 24, y = -r - 11, percent = Math.ceil(100 * e.hp / e.maxHp);
      ctx.fillStyle = '#e8deca'; ctx.strokeStyle = '#66684f'; ctx.lineWidth = .8; ctx.fillRect(-w / 2, y, w, 4); ctx.strokeRect(-w / 2, y, w, 4);
      ctx.fillStyle = percent > 50 ? '#7f946f' : percent > 25 ? '#bd945a' : '#bd735b'; ctx.fillRect(-w / 2 + .5, y + .5, (w - 1) * e.hp / e.maxHp, 3);
      ctx.font = 'bold 8px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#4b4b3d'; ctx.fillText(percent + '%', 0, y - 3);
    }
    ctx.restore();
  }
  window.PaperArt = { portrait, icon, tower, enemy, images };
})();
