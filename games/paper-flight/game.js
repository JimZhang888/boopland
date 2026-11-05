(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const i18n = window.BooplandI18n, t = (key, values) => i18n.t('paperFlight.' + key, values);
  const canvas = $('game'), context = canvas.getContext('2d');
  if (!context) { $('overlay-description').textContent = t('unavailable'); $('start').disabled = true; return; }
  const flight = new window.PaperFlightCore.Flight();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* The game also works without storage. */ } }
  };
  const savedBest = Number(storage.get('boopland-paper-flight-best'));
  let best = Number.isFinite(savedBest) && savedBest >= 0 ? Math.floor(savedBest) : 0;
  let recordAtStart = best, scale = 1, pixelRatio = 1, frameId = 0, lastTime = 0;
  let particles = [], labels = [], toast = null, eraseGlow = 0, shake = 0, previousHUD = '';
  let target = null, pointerId = null, audio = null, soundEnabled = false, lastShotSound = 0;
  const keys = new Set();
  const graphite = '#626359', sage = '#607654', red = '#a97767';

  // Slightly offset strokes and clipped hatching keep the artwork pencil-like at any size.
  function line(points, color = graphite, width = 1.2, close = false, fill = null) {
    context.strokeStyle = color; context.lineWidth = width; context.lineJoin = 'round'; context.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      context.beginPath();
      points.forEach(([x, y], index) => {
        const jitter = pass ? Math.sin(index * 5.3 + x * .13) * .8 : 0;
        if (index) context.lineTo(x + jitter, y + (pass ? .7 : 0)); else context.moveTo(x, y + (pass ? .7 : 0));
      });
      if (close) context.closePath();
      if (!pass && fill) { context.fillStyle = fill; context.fill(); }
      context.save(); context.globalAlpha *= pass ? .24 : .85; context.stroke(); context.restore();
    }
  }
  function hatch(points, color) {
    context.save(); context.beginPath(); points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y)); context.closePath(); context.clip();
    context.strokeStyle = color; context.globalAlpha *= .28; context.lineWidth = .7;
    for (let x = -90; x < 90; x += 4.5) { context.beginPath(); context.moveTo(x, -55); context.lineTo(x + 70, 55); context.stroke(); }
    context.restore();
  }
  function plane(x, y, size, enemy = false, type = 'dart', tilt = 0, flash = false) {
    context.save(); context.translate(x, y); context.rotate((enemy ? Math.PI : 0) + tilt); context.scale(size / 26, size / 26);
    const color = enemy ? graphite : sage;
    const points = type === 'heavy' ? [[0, -34], [-36, 20], [-15, 15], [0, 26], [15, 15], [36, 20]] : type === 'wing' ? [[0, -31], [-35, 15], [-12, 10], [0, 25], [12, 10], [35, 15]] : [[0, -32], [-25, 24], [0, 13], [25, 24]];
    line(points, color, 1.25, true, flash ? '#d0c4ae' : enemy ? '#eeece1' : '#e2e7d7');
    hatch([[0, -30], [0, 13], [type === 'dart' ? 25 : 35, type === 'dart' ? 24 : 15]], color);
    line([[0, -31], [0, 13], [-7, 21], [0, -31]], color, .8);
    if (type === 'heavy') { line([[-19, 4], [19, 4]], color, 1); line([[-23, 10], [23, 10]], color, .7); }
    if (!enemy) { context.globalAlpha *= .32; line([[-7, 32], [-9, 42], [-7, 52]], sage, .9); line([[7, 32], [9, 47]], sage, .9); }
    context.restore();
  }
  function cloud(x, y, size) {
    context.save(); context.translate(x, y); context.scale(size, size); context.strokeStyle = '#b8bcad'; context.lineWidth = .9;
    context.beginPath(); context.moveTo(-38, 10); context.bezierCurveTo(-60, 7, -50, -15, -29, -9); context.bezierCurveTo(-26, -38, 10, -38, 15, -12); context.bezierCurveTo(41, -22, 58, 14, 32, 14); context.bezierCurveTo(10, 16, -17, 12, -38, 10); context.stroke();
    context.globalAlpha *= .35; line([[-33, 18], [-8, 19], [16, 18]], '#b8bcad', .8); context.restore();
  }
  function background() {
    const w = flight.width, h = flight.height;
    context.fillStyle = '#fbf9f1'; context.fillRect(0, 0, w, h);
    context.lineWidth = .65; context.strokeStyle = '#d9e0dc';
    const offset = reducedMotion.matches ? 0 : (flight.time * 13) % 30;
    context.beginPath(); for (let y = offset; y < h; y += 30) { context.moveTo(0, y); context.lineTo(w, y); } context.stroke();
    context.strokeStyle = '#dbbcb16b'; context.beginPath(); context.moveTo(38, 0); context.lineTo(38, h); context.stroke();
    context.globalAlpha = .4;
    for (let i = 0; i < 4; i++) {
      const y = (i * h / 3 + (reducedMotion.matches ? 0 : flight.time * (9 + i))) % (h + 130) - 55;
      cloud(w * (i % 2 ? .81 : .19), y, .65 + i * .12);
    }
    context.globalAlpha = 1;
    // Static graphite flecks: no random flicker between frames.
    context.fillStyle = '#6b68550a';
    for (let i = 0; i < 420; i++) { const x = (i * 97.13) % w, y = (i * 137.71) % h; context.fillRect(x, y, 1, .8); }
  }
  function render() {
    context.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale, 0, 0);
    background(); context.save();
    if (shake && !reducedMotion.matches) context.translate(Math.sin(flight.time * 73) * shake * 4, Math.cos(flight.time * 61) * shake * 3);
    for (const bullet of flight.bullets) line([[bullet.x, bullet.y + 8], [bullet.x + .6, bullet.y - 6]], sage, 2);
    for (const bullet of flight.hostile) {
      context.strokeStyle = red; context.lineWidth = 1.4; context.beginPath(); context.ellipse(bullet.x, bullet.y, 4, 6, -.25, 0, Math.PI * 2); context.stroke();
    }
    for (const enemy of flight.enemies) {
      plane(enemy.x, enemy.y, enemy.r, true, enemy.type, Math.sin(enemy.age * 1.7 + enemy.phase) * .12, enemy.flash > 0);
      if (enemy.hp < enemy.maxHp && enemy.maxHp > 1) { line([[enemy.x - 17, enemy.y - enemy.r - 14], [enemy.x + 17, enemy.y - enemy.r - 14]], '#ceccbd', 2); line([[enemy.x - 17, enemy.y - enemy.r - 14], [enemy.x - 17 + 34 * enemy.hp / enemy.maxHp, enemy.y - enemy.r - 14]], graphite, 2); }
    }
    for (const item of flight.pickups) {
      context.save(); context.translate(item.x, item.y); context.rotate(Math.sin(item.age * 3) * .1);
      line([[-15, -15], [14, -16], [16, 15], [-14, 16]], sage, 1, true, '#ecf0e1');
      context.fillStyle = sage; context.font = '23px Georgia, serif'; context.textAlign = 'center'; context.fillText({ power: '↑', shield: '◇', heart: '+' }[item.type], 0, 8); context.restore();
    }
    const p = flight.player;
    if (p.lives > 0) {
      context.save();
      if (p.invincible > 0 && flight.mode === 'playing') context.globalAlpha = .55 + Math.sin(flight.time * 23) * .25;
      plane(p.x, p.y, 25, false, 'dart', target ? Math.max(-.16, Math.min(.16, (target.x - p.x) * .004)) : 0);
      context.restore();
      if (p.shield > 0) { context.strokeStyle = '#94a881'; context.lineWidth = 1.3; context.setLineDash([6, 4]); context.beginPath(); context.arc(p.x, p.y, 40, 0, Math.PI * 2); context.stroke(); context.setLineDash([]); }
    }
    for (const particle of particles) {
      context.save(); context.translate(particle.x, particle.y); context.rotate(particle.angle); context.globalAlpha = Math.min(1, particle.life * 2);
      line([[-particle.size, 0], [particle.size, 1]], particle.color, .9); context.restore();
    }
    context.font = 'italic 16px Georgia, serif'; context.textAlign = 'center';
    for (const label of labels) { context.globalAlpha = Math.min(1, label.life * 2); context.fillStyle = sage; context.fillText('+' + label.value, label.x, label.y); }
    context.restore(); context.globalAlpha = 1;
    if (eraseGlow > 0) { context.fillStyle = `rgba(229,235,215,${eraseGlow * .6})`; context.fillRect(0, 0, flight.width, flight.height); }
  }
  function burst(x, y, color, heavy = false) {
    const count = reducedMotion.matches ? 5 : heavy ? 26 : 13;
    for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2, speed = 30 + Math.random() * 110; particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, size: 1.5 + Math.random() * 4, color, life: .4 + Math.random() * .45 }); }
  }
  function enableAudio() {
    if (!soundEnabled) return;
    try { const Audio = window.AudioContext || window.webkitAudioContext; if (!audio && Audio) audio = new Audio(); if (audio?.state === 'suspended') audio.resume().catch(() => {}); } catch { /* Audio is optional. */ }
  }
  function tone(frequency, duration, volume, type = 'sine', end = frequency) {
    if (!soundEnabled || !audio || audio.state !== 'running' || document.hidden) return;
    const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function showToast(key, values = {}) { toast = { key, values, until: flight.time + 2 }; updateToast(); }
  function updateToast() { $('toast').hidden = !toast || flight.mode !== 'playing'; if (toast) $('toast').textContent = t(toast.key, toast.values); }
  function saveBest() { best = Math.max(best, flight.score); storage.set('boopland-paper-flight-best', best); }
  function clearInput() {
    keys.clear(); target = null;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
  }
  function updateHUD(force = false) {
    const p = flight.player;
    const snapshot = [flight.score, best, flight.wave, p.lives, flight.erasers, flight.mode, Math.ceil(p.power), Math.ceil(p.shield), soundEnabled, i18n.language].join('|');
    if (!force && snapshot === previousHUD) return; previousHUD = snapshot;
    $('score').textContent = String(flight.score).padStart(5, '0'); $('best').textContent = String(Math.max(best, flight.score)).padStart(5, '0');
    $('wave').textContent = t('wave', { value: flight.wave }); $('lives').textContent = '♡ '.repeat(p.lives).trim() + (p.lives < 3 ? ' ·'.repeat(3 - p.lives) : '');
    $('lives').setAttribute('aria-label', t('lives', { value: p.lives }));
    $('erasers').textContent = flight.erasers; $('erase').disabled = flight.mode !== 'playing' || !flight.erasers;
    $('erase').setAttribute('aria-label', t('eraseLabel', { value: flight.erasers }));
    $('pause').disabled = !['playing', 'paused'].includes(flight.mode);
    const pauseLabel = t(flight.mode === 'paused' ? 'resume' : 'pause'); $('pause').setAttribute('aria-label', pauseLabel); $('pause').title = pauseLabel;
    $('pause').querySelector('path').setAttribute('d', flight.mode === 'paused' ? 'm7 4 13 8-13 8Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-label', t(soundEnabled ? 'soundOff' : 'soundOn')); $('sound').title = t(soundEnabled ? 'soundOff' : 'soundOn'); $('sound').setAttribute('aria-pressed', String(soundEnabled));
    $('sound').querySelector('path').setAttribute('d', soundEnabled ? 'M4 9h4l5-4v14l-5-4H4ZM17 8q5 4 0 8m3-11q7 7 0 14' : 'M4 9h4l5-4v14l-5-4H4ZM17 9l5 6m0-6-5 6');
    $('power').hidden = flight.mode !== 'playing' || !(p.power || p.shield);
    $('power').textContent = [p.power > 0 ? t('power', { value: Math.ceil(p.power) }) : '', p.shield > 0 ? t('shield', { value: Math.ceil(p.shield) }) : ''].filter(Boolean).join(' · ');
  }
  function updateOverlay() {
    const mode = flight.mode, over = mode === 'over', paused = mode === 'paused';
    $('overlay').hidden = mode === 'playing'; $('overlay').dataset.mode = mode;
    $('overlay-title').textContent = t(over ? 'over' : paused ? 'paused' : 'name');
    $('overlay-description').textContent = t(over ? 'overDesc' : paused ? 'pausedDesc' : 'intro');
    $('overlay-kicker').textContent = t(over && flight.score > recordAtStart ? 'newBest' : 'kicker');
    $('start').textContent = t(paused ? 'resume' : over ? 'restart' : 'start');
    $('restart').hidden = !paused; $('instructions').hidden = paused || over; $('results').hidden = !over;
    if (over) $('results').textContent = t('result', { score: flight.score, kills: flight.kills, seconds: Math.floor(flight.time), wave: flight.wave });
    updateToast(); updateHUD(true);
  }
  function handleEvents() {
    for (const event of flight.events.splice(0)) {
      if (event.type === 'shot' && flight.time - lastShotSound > .17) { tone(720, .045, .018, 'triangle', 420); lastShotSound = flight.time; }
      if (event.type === 'destroy') { burst(event.x, event.y, graphite, event.heavy); labels.push({ x: event.x, y: event.y, value: event.value, life: .8 }); tone(160, .1, .04, 'triangle', 65); }
      if (event.type === 'hit') { burst(event.x, event.y, red, true); shake = .6; tone(180, .2, .06, 'triangle', 50); }
      if (event.type === 'shield') burst(event.x, event.y, sage, true);
      if (event.type === 'wave') showToast('wave', { value: event.wave });
      if (event.type === 'collect') { showToast({ power: 'gotPower', shield: 'gotShield', heart: 'gotHeart' }[event.item]); burst(event.x, event.y, sage); tone(620, .22, .06, 'sine', 1100); }
      if (event.type === 'erase') { eraseGlow = .8; showToast('erased'); tone(350, .3, .06, 'sine', 90); }
      if (event.type === 'over') { saveBest(); clearInput(); updateOverlay(); $('start').focus({ preventScroll: true }); }
    }
  }
  function tick(now) {
    frameId = 0;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .04) : 0; lastTime = now;
    const input = { x: Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA')), y: Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW')), target };
    flight.update(dt, input); handleEvents();
    for (const particle of particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 60 * dt; particle.life -= dt; particle.angle += dt * 2; }
    particles = particles.filter(particle => particle.life > 0);
    for (const label of labels) { label.y -= dt * 25; label.life -= dt; } labels = labels.filter(label => label.life > 0);
    if (toast && flight.time > toast.until) { toast = null; updateToast(); }
    eraseGlow = Math.max(0, eraseGlow - dt * 2); shake = Math.max(0, shake - dt * 2);
    updateHUD(); render();
    if (flight.mode === 'playing' && !document.hidden) frameId = requestAnimationFrame(tick);
  }
  function animate() { cancelAnimationFrame(frameId); lastTime = 0; frameId = requestAnimationFrame(tick); }
  function start() {
    enableAudio(); clearInput();
    if (flight.mode === 'paused') flight.mode = 'playing';
    else { saveBest(); recordAtStart = best; flight.reset(); particles = []; labels = []; toast = null; eraseGlow = 0; shake = 0; lastShotSound = 0; }
    updateOverlay(); canvas.focus({ preventScroll: true }); animate();
  }
  function pause() {
    if (flight.mode !== 'playing') return;
    flight.mode = 'paused'; clearInput(); cancelAnimationFrame(frameId); frameId = 0; lastTime = 0;
    updateOverlay(); render();
  }
  function useEraser() { enableAudio(); if (flight.erase()) { handleEvents(); updateHUD(); render(); } }
  function resize() {
    const bounds = $('stage').getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    const logicalHeight = bounds.width > bounds.height * 1.7 ? 420 : 600;
    scale = Math.min(bounds.width / 480, bounds.height / logicalHeight, 1.5);
    canvas.width = Math.round(bounds.width * pixelRatio); canvas.height = Math.round(bounds.height * pixelRatio);
    flight.resize(bounds.width / scale, bounds.height / scale); target = null; render();
  }
  function pointerPosition(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width * flight.width, y: (event.clientY - bounds.top) / bounds.height * flight.height - (event.pointerType === 'touch' ? 40 : 0) };
  }
  canvas.addEventListener('pointerdown', event => {
    if (flight.mode !== 'playing' || pointerId !== null || event.button !== 0) return;
    event.preventDefault(); enableAudio(); canvas.focus({ preventScroll: true }); pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId); target = pointerPosition(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (flight.mode !== 'playing' || (event.pointerType !== 'mouse' && event.pointerId !== pointerId)) return;
    target = pointerPosition(event);
  });
  const releasePointer = event => { if (event.pointerId === pointerId) { if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId); pointerId = null; target = null; } };
  canvas.addEventListener('pointerup', releasePointer); canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('lostpointercapture', () => { pointerId = null; target = null; });
  canvas.addEventListener('pointerleave', () => { if (pointerId === null) target = null; });
  const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
  document.addEventListener('keydown', event => {
    if (event.target.closest('select, input, textarea') || event.ctrlKey || event.altKey || event.metaKey) return;
    if (movementKeys.includes(event.code) && flight.mode === 'playing') { event.preventDefault(); keys.add(event.code); target = null; }
    if (event.repeat) return;
    if (event.code === 'KeyP' || event.code === 'Escape') { if (flight.mode === 'playing') { event.preventDefault(); pause(); $('start').focus({ preventScroll: true }); } else if (flight.mode === 'paused') { event.preventDefault(); start(); } }
    if (event.code === 'Space' && flight.mode === 'playing' && !event.target.closest('button, a')) { event.preventDefault(); useEraser(); }
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  $('start').addEventListener('click', start);
  $('restart').addEventListener('click', () => { flight.mode = 'ready'; start(); });
  $('pause').addEventListener('click', () => flight.mode === 'paused' ? start() : pause());
  $('erase').addEventListener('click', useEraser);
  $('sound').addEventListener('click', () => { soundEnabled = !soundEnabled; enableAudio(); if (!soundEnabled && audio) audio.suspend().catch(() => {}); tone(680, .08, .04); updateHUD(true); });
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); if (audio) audio.suspend().catch(() => {}); } });
  window.addEventListener('pagehide', () => { pause(); saveBest(); cancelAnimationFrame(frameId); if (audio) audio.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { resize(); updateOverlay(); });
  window.addEventListener('boopland:languagechange', () => { updateOverlay(); render(); });
  window.addEventListener('storage', event => { if (event.key === 'boopland-paper-flight-best') { const value = Number(event.newValue); if (Number.isFinite(value) && value > best) { best = Math.floor(value); updateHUD(true); } } });
  new ResizeObserver(resize).observe($('stage'));
  resize(); updateOverlay();
})();
