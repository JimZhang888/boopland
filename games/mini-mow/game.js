(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('mow.' + key, values);
  const game = new MeadowGame(), canvas = $('game'), ctx = canvas.getContext('2d');
  const stage = $('stage'), overlay = $('overlay'), panel = $('panel');
  const TAU = Math.PI * 2, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = { power: '✧', haste: '»', leaf: '❧', seed: '⁙', pulse: '✺', magnet: '∩', boots: '↝', heart: '♡' };
  const keys = new Set();
  let width = 0, height = 0, scale = 1, last = 0, animation = 0, uiKey = '', helpOpen = false, helpWasRunning = false;
  let effects = [], toastUntil = 0, pointer = null, stick = { x: 0, y: 0 }, soundEnabled = false, audio = null, best = { time: 0, kills: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem('boopland-mini-mow-best'));
    if (saved && Number.isFinite(saved.time) && Number.isFinite(saved.kills)) best = { time: Math.min(180, Math.max(0, saved.time)), kills: Math.max(0, saved.kills) };
    soundEnabled = localStorage.getItem('boopland-mini-mow-sound') === '1';
  } catch { /* The game also works with storage disabled. */ }
  const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  function node(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }
  function button(text, action, className = 'primary') { const e = node('button', text, className); e.addEventListener('click', action); return e; }
  function resetInput() { keys.clear(); pointer = null; stick = { x: 0, y: 0 }; $('joystick').hidden = true; }
  function activateAudio() {
    if (!soundEnabled) return;
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume().catch(() => {}); } catch { /* Optional sound. */ }
  }
  function tone(frequency, duration = .09, volume = .035) {
    if (!soundEnabled || !audio || audio.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * .65), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function refreshSound() { $('sound').setAttribute('aria-pressed', String(soundEnabled)); $('sound').setAttribute('aria-label', t(soundEnabled ? 'soundOn' : 'soundOff')); }
  function start() { helpOpen = false; resetInput(); effects = []; game.start(); $('toast').hidden = true; activateAudio(); uiKey = ''; sync(); canvas.focus({ preventScroll: true }); }
  function togglePause() {
    if (helpOpen) { closeHelp(); return; }
    if (game.mode === 'running') game.pause(); else if (game.mode === 'paused') { game.resume(); activateAudio(); }
    resetInput(); sync();
  }
  function openHelp() { if (helpOpen) return; helpWasRunning = game.mode === 'running'; game.pause(); helpOpen = true; resetInput(); sync(); }
  function closeHelp() { helpOpen = false; if (helpWasRunning) game.resume(); sync(); }
  function saveBest() {
    best.time = Math.max(best.time, Math.floor(game.time)); best.kills = Math.max(best.kills, game.kills);
    try { localStorage.setItem('boopland-mini-mow-best', JSON.stringify(best)); } catch { /* Optional persistence. */ }
  }
  function renderPanel() {
    panel.replaceChildren(); panel.className = 'paper-card';
    const mode = helpOpen ? 'help' : game.mode;
    const title = node('h2'); title.id = 'panel-title';
    if (mode === 'ready') {
      const art = node('img', undefined, 'intro-art'); art.src = './cover.svg'; art.alt = ''; panel.append(art);
      panel.append(node('p', t('eyebrow'), 'eyebrow')); title.textContent = t('title'); panel.append(title, node('p', t('intro'), 'panel-copy'));
      panel.append(button(t('start') + '  →', start), node('p', t('startNote'), 'small-note'));
      panel.append(node('p', t('best', { time: formatTime(best.time), kills: best.kills }), 'best-line'));
    } else if (mode === 'help') {
      title.textContent = t('helpTitle'); panel.append(title, node('p', t('helpCopy'), 'help-lines'), button(t('close'), closeHelp));
    } else if (mode === 'paused') {
      title.textContent = t('paused'); panel.append(title, node('p', t('pauseCopy'), 'panel-copy'), button(t('resume') + '  →', togglePause), node('br'), button(t('restart'), start, 'secondary'));
    } else if (mode === 'upgrade') {
      panel.classList.add('wide'); title.textContent = t('upgradeTitle');
      panel.append(node('p', t('level', { n: game.level }), 'eyebrow'), title, node('p', t('upgradeCopy'), 'panel-copy'));
      const grid = node('div', undefined, 'upgrade-grid');
      for (const id of game.choices) {
        const choice = button('', () => { resetInput(); activateAudio(); game.choose(id); tone(620, .15); sync(); if (game.mode === 'running') canvas.focus({ preventScroll: true }); }, 'upgrade');
        const icon = node('span', icons[id], 'upgrade-icon'); icon.setAttribute('aria-hidden', 'true');
        choice.append(icon, node('strong', t(id)), node('small', t(id + 'Desc'))); grid.append(choice);
      }
      panel.append(grid);
    } else if (mode === 'won' || mode === 'lost') {
      panel.append(node('div', mode === 'won' ? '❧' : '❦', 'result-mark')); title.textContent = t(mode + 'Title');
      panel.append(title, node('p', t(mode + 'Copy'), 'panel-copy'));
      const stats = node('div', undefined, 'result-stats');
      for (const [label, value] of [['time', formatTime(game.time)], ['kills', game.kills], ['levelLabel', game.level]]) {
        const item = node('div'); item.append(node('strong', value), node('span', t(label))); stats.append(item);
      }
      panel.append(stats, button(t('again') + '  ↗', start), node('p', t('best', { time: formatTime(best.time), kills: best.kills }), 'best-line'));
    }
    if (mode !== 'running') panel.querySelector('button')?.focus({ preventScroll: true });
  }
  function sync(force = false) {
    const p = game.player;
    $('hp-fill').style.width = (p.hp / p.maxHp * 100) + '%'; $('hp-value').textContent = Math.ceil(p.hp);
    $('timer').textContent = formatTime(game.time); $('kills').textContent = game.kills;
    $('level').textContent = t('level', { n: game.level }); $('wave').textContent = t('wave', { n: game.wave });
    $('xp-fill').style.width = Math.min(100, game.xp / game.nextXP * 100) + '%';
    $('dash').disabled = game.mode !== 'running' || p.dashCooldown > 0 || helpOpen;
    $('dash-label').textContent = p.dashCooldown > 0 ? Math.ceil(p.dashCooldown) + 's' : t('dash');
    $('dash').setAttribute('aria-label', t(p.dashCooldown > 0 ? 'dashWait' : 'dashReady', { s: Math.ceil(p.dashCooldown) }));
    $('pause').disabled = !['running', 'paused'].includes(game.mode) || helpOpen;
    $('pause').setAttribute('aria-label', t(game.mode === 'paused' ? 'resume' : 'pause'));
    const key = (helpOpen ? 'help' : game.mode) + ':' + game.level;
    if (force || key !== uiKey) {
      $('pause').innerHTML = game.mode === 'paused' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 11 8-11 8Z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
      const before = uiKey; uiKey = key; overlay.hidden = !helpOpen && game.mode === 'running';
      if (!overlay.hidden) { resetInput(); renderPanel(); }
      else if (before) canvas.focus({ preventScroll: true });
    }
  }
  function toast(key, values, duration = 3) { $('toast').textContent = t(key, values); $('toast').hidden = false; toastUntil = game.time + duration; }
  function events() {
    let popped = false;
    for (const event of game.drainEvents()) {
      if (event.type === 'pop') {
        popped = true;
        for (let i = 0; i < (reduced ? 3 : 7); i++) {
          const a = Math.random() * TAU, speed = 20 + Math.random() * 65;
          if (effects.length < 220) effects.push({ kind: 'petal', x: event.x, y: event.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .5, max: .5, color: event.typeName === 'runner' ? '#b28d76' : '#8c9f73' });
        }
      }
      if (event.type === 'pulse') { effects.push({ kind: 'ring', ...event, life: .5, max: .5 }); tone(190, .19); }
      if (event.type === 'dash') { effects.push({ kind: 'dash', ...event, life: .35, max: .35 }); tone(360, .12); }
      if (event.type === 'hurt') { effects.push({ kind: 'hurt', ...event, life: .3, max: .3 }); tone(95, .16, .065); }
      if (event.type === 'wave') toast('waveToast', { n: event.wave });
      if (event.type === 'boss') toast('bossToast', {}, 5);
      if (event.type === 'bossDown') toast('bossDown');
      if (event.type === 'heal') { effects.push({ kind: 'heal', ...event, life: .8, max: .8 }); tone(720, .12); }
      if (event.type === 'level') tone(800, .2);
      if (event.type === 'won' || event.type === 'lost') { $('toast').hidden = true; saveBest(); tone(event.type === 'won' ? 650 : 160, .4); }
    }
    if (popped) tone(260, .055, .018);
  }

  // Canvas artwork is drawn in world units, with stable irregular contours and fine pencil strokes.
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  function ellipse(x, y, rx, ry, fill, stroke, rotation = 0) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function path(points, color, lineWidth = 1) {
    ctx.beginPath(); ctx.moveTo(...points[0]); for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke(); ctx.lineWidth = 1;
  }
  function leaf(x, y, a, size = 14, color = '#8da475') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-size, 0); ctx.quadraticCurveTo(-2, -size * .82, size, 0); ctx.quadraticCurveTo(2, size * .7, -size, 0); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#5e7551'; ctx.stroke(); path([[-size + 3, 0], [size - 2, 0]], '#5e7551'); ctx.restore();
  }
  function flower(x, y, r, variant) {
    path([[x, y + 13], [x + 2, y + 5], [x, y]], '#98a482');
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ellipse(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8, r * .65, r * .45, variant ? '#e6d7ba' : '#f7f5e4', '#a9ad8f', a); }
    ellipse(x, y, r * .34, r * .34, '#c5ac73');
  }
  function scenery() {
    ctx.fillStyle = '#e8eddb'; ctx.fillRect(0, 0, width, height);
    const p = game.player, halfW = width / scale / 2, halfH = height / scale / 2;
    ctx.save(); ctx.translate(width / 2 - p.x * scale, height / 2 - p.y * scale); ctx.scale(scale, scale);
    const left = p.x - halfW, top = p.y - halfH;
    // Broad, quiet patches of colored pencil.
    for (let gx = Math.floor(left / 280) - 1; gx < (p.x + halfW) / 280 + 1; gx++) for (let gy = Math.floor(top / 240) - 1; gy < (p.y + halfH) / 240 + 1; gy++) {
      ellipse(gx * 280 + hash(gx, gy) * 100, gy * 240 + hash(gy, gx) * 100, 125, 78, hash(gx + 9, gy) > .5 ? '#e1e8d3' : '#edf0df', null, .2);
    }
    for (let gx = Math.floor(left / 62) - 1; gx < (p.x + halfW) / 62 + 1; gx++) for (let gy = Math.floor(top / 62) - 1; gy < (p.y + halfH) / 62 + 1; gy++) {
      const h = hash(gx, gy), x = gx * 62 + h * 42, y = gy * 62 + hash(gy + 2, gx) * 48;
      if (h < .11) flower(x, y, 4 + h * 15, h > .06);
      else if (h < .18) { ellipse(x, y, 6, 3, '#d6dbcc', '#aab29c', -.2); path([[x - 3, y], [x, y - 1], [x + 3, y]], '#bcc2ae'); }
      else { path([[x - 4, y + 4], [x - 7, y - 3], [x - 1, y + 1], [x, y - 8], [x + 3, y + 2], [x + 7, y - 3]], '#b4c39f', .8); if (h > .7) path([[x + 14, y + 15], [x + 15, y + 12]], '#c5cfb4'); }
    }
    ctx.strokeStyle = '#a5b58c'; ctx.lineWidth = 2; ctx.setLineDash([6, 9]); ctx.strokeRect(42, 42, 2316, 1916); ctx.setLineDash([]); ctx.lineWidth = 1;
  }
  function drawEnemy(e, time) {
    const bob = reduced ? 0 : Math.sin(time * 6 + e.phase) * 1.7, r = e.r;
    ctx.save(); ctx.translate(e.x, e.y + bob);
    ellipse(0, r * .68 - bob, r * .87, r * .24, '#65774c19');
    const fill = e.flash > 0 ? '#fffbed' : e.type === 'runner' ? '#d2b5a1' : e.type === 'brute' ? '#adba9b' : e.type === 'boss' ? '#b2a2b6' : '#bfcca3';
    ctx.beginPath(); ctx.moveTo(-r, r * .36); ctx.bezierCurveTo(-r * 1.12, -r * .25, -r * .5, -r * 1.1, r * .05, -r * .89); ctx.bezierCurveTo(r * .8, -r * 1.02, r * 1.1, -r * .1, r, r * .42); ctx.quadraticCurveTo(r * .2, r * .9, -r, r * .36); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#657453'; ctx.lineWidth = 1.2; ctx.stroke();
    if (e.type === 'boss') {
      path([[-25, -28], [-26, -45], [-10, -35], [0, -50], [11, -35], [26, -44], [24, -25]], '#7f6885', 2);
      for (const side of [-1, 1]) path([[side * r * .9, -10], [side * (r + 10), -4], [side * r, 4]], '#7f6885');
    } else if (e.type === 'runner') {
      path([[-r * .6, -r * .5], [-r * .9, -r * 1.6], [-r * .1, -r * .8]], '#8f7b62');
      path([[r * .1, -r * .8], [r * .7, -r * 1.5], [r * .6, -r * .5]], '#8f7b62');
    } else { leaf(-2, -r * .9, -.7, r * .35, '#9cac7b'); }
    ellipse(-r * .32, 0, 1.5, 2, '#4d5943'); ellipse(r * .32, 0, 1.5, 2, '#4d5943');
    path([[-2, r * .24], [0, r * .3], [3, r * .22]], '#6f795c');
    path([[-r * .75, r * .12], [-r * .65, -r * .1]], '#8d9c7370');
    if (e.type === 'boss' || (e.type === 'brute' && e.hp < e.maxHp)) {
      ctx.fillStyle = '#d5ccca'; ctx.fillRect(-r, -r - 24, r * 2, 4); ctx.fillStyle = '#917b91'; ctx.fillRect(-r, -r - 24, r * 2 * e.hp / e.maxHp, 4);
    }
    ctx.restore();
  }
  function drawPlayer(p) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.invincible > 0 && Math.floor(p.invincible * 18) % 2) ctx.globalAlpha = .55;
    ellipse(0, 14, 17, 5, '#596c4520');
    const walk = Math.sin(p.walk) * 2;
    path([[-6, 9], [-7, 17 + walk], [-11, 18 + walk]], '#59674b', 3);
    path([[6, 9], [7, 17 - walk], [11, 18 - walk]], '#59674b', 3);
    ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-15 - p.dx * 2, 10); ctx.quadraticCurveTo(0, 18, 14, 10); ctx.lineTo(8, -6); ctx.closePath(); ctx.fillStyle = '#8fa377'; ctx.fill(); ctx.strokeStyle = '#5b7152'; ctx.stroke();
    path([[-7, 0], [-8, 9], [2, 12]], '#bdcaa8');
    ellipse(0, -10, 11, 12, '#ebd9b8', '#7a8063');
    ellipse(p.dx * 2 - 4, -8, 1, 1.5, '#485b45'); ellipse(p.dx * 2 + 4, -8, 1, 1.5, '#485b45');
    path([[p.dx * 2 - 1, -3], [p.dx * 2 + 2, -3]], '#a68d70');
    ellipse(0, -19, 18, 5, '#d4c58e', '#807e5c', -.07);
    ctx.beginPath(); ctx.moveTo(-11, -20); ctx.quadraticCurveTo(-13, -37, 4, -33); ctx.quadraticCurveTo(12, -30, 11, -20); ctx.fillStyle = '#dfd3a4'; ctx.fill(); ctx.strokeStyle = '#807e5c'; ctx.stroke();
    path([[-10, -23], [1, -22], [10, -24]], '#92a079', 3); leaf(10, -29, -.7, 8);
    path([[11, 1], [18, 5], [24, -6]], '#7f8465', 2); ellipse(24, -7, 3, 5, '#cbbb87', '#7f8465', .3);
    ctx.restore();
  }
  function render() {
    ctx.setTransform(Math.min(devicePixelRatio || 1, 2), 0, 0, Math.min(devicePixelRatio || 1, 2), 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; scenery();
    const p = game.player, time = game.mode === 'ready' ? 0 : game.time;
    for (const d of game.drops) {
      if (Math.abs(d.x - p.x) > width / scale / 2 + 20 || Math.abs(d.y - p.y) > height / scale / 2 + 20) continue;
      if (d.type === 'heal') { ellipse(d.x, d.y, 6, 6, '#c78d7c', '#8f6657'); leaf(d.x + 3, d.y - 7, -.4, 4); }
      else { ctx.beginPath(); ctx.moveTo(d.x, d.y - 5); ctx.lineTo(d.x + 4, d.y); ctx.lineTo(d.x, d.y + 6); ctx.lineTo(d.x - 4, d.y); ctx.closePath(); ctx.fillStyle = d.value > 3 ? '#7d9e89' : '#a1ba83'; ctx.fill(); ctx.strokeStyle = '#6c8861'; ctx.stroke(); }
    }
    if (game.mode === 'ready') {
      for (const [x, y, type, r] of [[-280,-90,'slime',16],[285,100,'slime',14],[-195,150,'runner',12],[220,-160,'brute',22],[-350,-210,'slime',13],[340,-45,'runner',12]]) drawEnemy({ x:p.x+x, y:p.y+y, type, r, phase:x, hp:1,maxHp:1,flash:0 }, 0);
    }
    for (const e of game.enemies) {
      if (Math.abs(e.x - p.x) > width / scale / 2 + 70 || Math.abs(e.y - p.y) > height / scale / 2 + 70) continue;
      drawEnemy(e, time);
    }
    for (const shot of game.shots) {
      path([[shot.x - shot.vx * .025, shot.y - shot.vy * .025], [shot.x, shot.y]], '#c3b481', 2);
      ellipse(shot.x, shot.y, 5, 2.8, '#e3cc88', '#8d875b', Math.atan2(shot.vy, shot.vx));
    }
    ctx.strokeStyle = '#85986a35'; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.arc(p.x, p.y, 58, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    drawPlayer(p);
    for (let i = 0; i < p.leaves; i++) { const a = time * 2.8 * p.haste + i * TAU / p.leaves; leaf(p.x + Math.cos(a) * 58, p.y + Math.sin(a) * 58, a + Math.PI / 2, 15, '#9cb77e'); }
    for (const effect of effects) {
      ctx.save(); ctx.globalAlpha = effect.life / effect.max;
      if (effect.kind === 'petal') leaf(effect.x, effect.y, effect.life * 3, 3, effect.color);
      if (effect.kind === 'ring') { ctx.strokeStyle = '#9ba970'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1 - effect.life / effect.max), 0, TAU); ctx.stroke(); }
      if (effect.kind === 'hurt') { ctx.strokeStyle = '#bc7c6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(effect.x, effect.y, 25 + (1 - effect.life / effect.max) * 20, 0, TAU); ctx.stroke(); }
      if (effect.kind === 'dash') { for (let i = -1; i <= 1; i++) path([[effect.x - 18, effect.y + i * 9], [effect.x + 16, effect.y + i * 9]], '#b6c49a', 2); }
      if (effect.kind === 'heal') { path([[effect.x - 5, effect.y - 30], [effect.x + 5, effect.y - 30]], '#708d68', 3); path([[effect.x, effect.y - 35], [effect.x, effect.y - 25]], '#708d68', 3); }
      ctx.restore();
    }
    ctx.restore();
  }
  function resize() { const box = stage.getBoundingClientRect(); width = box.width - 2; height = box.height - 2; const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); scale = Math.max(.58, Math.min(width / 870, height / 570, 1.35)); render(); }
  function frame(now) {
    animation = 0;
    const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
    if (game.mode === 'running') {
      const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      const y = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
      game.step(dt, { x: x || stick.x, y: y || stick.y }); events();
      for (const e of effects) { e.life -= dt; if (e.kind === 'petal') { e.x += e.vx * dt; e.y += e.vy * dt; } }
      effects = effects.filter(e => e.life > 0);
      if (game.time > toastUntil) $('toast').hidden = true;
    }
    sync(); render(); animation = requestAnimationFrame(frame);
  }
  const controlCodes = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) { e.preventDefault(); togglePause(); } return; }
    if (e.target.closest('button,a') && (e.code === 'Space' || e.code === 'Enter')) return;
    if (game.mode !== 'running' || helpOpen || !controlCodes.includes(e.code)) return;
    e.preventDefault(); activateAudio(); if (e.code === 'Space') { if (!e.repeat) game.dash(); } else keys.add(e.code);
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  function updateStick(e) {
    if (!pointer || e.pointerId !== pointer.id) return;
    const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y, length = Math.hypot(dx, dy), distance = Math.min(34, length);
    stick = length < 4 ? { x: 0, y: 0 } : { x: dx / length * distance / 34, y: dy / length * distance / 34 };
    $('joystick').firstElementChild.style.transform = `translate(${stick.x * 28}px,${stick.y * 28}px)`;
  }
  canvas.addEventListener('pointerdown', e => {
    if (game.mode !== 'running' || pointer || e.button !== 0) return;
    e.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; const rect = stage.getBoundingClientRect();
    $('joystick').style.left = (e.clientX - rect.left - 45) + 'px'; $('joystick').style.top = (e.clientY - rect.top - 45) + 'px'; $('joystick').hidden = false;
    $('joystick').firstElementChild.style.transform = ''; activateAudio();
  });
  canvas.addEventListener('pointermove', updateStick);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, e => { if (pointer?.id === e.pointerId) resetInput(); });
  $('dash').addEventListener('click', () => { activateAudio(); game.dash(); canvas.focus({ preventScroll: true }); });
  $('pause').addEventListener('click', togglePause); $('help').addEventListener('click', openHelp);
  $('sound').addEventListener('click', () => { soundEnabled = !soundEnabled; try { localStorage.setItem('boopland-mini-mow-sound', soundEnabled ? '1' : '0'); } catch {} activateAudio(); refreshSound(); tone(500); });
  function suspend() { game.pause(); resetInput(); sync(); if (audio?.state === 'running') audio.suspend().catch(() => {}); }
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { suspend(); cancelAnimationFrame(animation); animation = 0; }
    else { last = 0; if (!animation) animation = requestAnimationFrame(frame); }
  });
  window.addEventListener('pagehide', () => { suspend(); cancelAnimationFrame(animation); animation = 0; });
  window.addEventListener('pageshow', () => { last = 0; if (!animation && !document.hidden) animation = requestAnimationFrame(frame); });
  window.addEventListener('boopland:languagechange', () => { refreshSound(); $('toast').hidden = true; sync(true); });
  new ResizeObserver(resize).observe(stage);
  refreshSound(); sync(true); resize(); if (!document.hidden) animation = requestAnimationFrame(frame);
})();
