(() => {
  'use strict';
  const E = window.ParkingEngine, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t(`driver.${key}`, values);
  const canvas = $('game'), ctx = canvas.getContext('2d'), game = new E.Game();
  const keys = new Set(), pointers = new Map();
  const buttons = [...document.querySelectorAll('[data-control]')];
  const storageKey = 'boopland-old-driver-v1';
  let records = {}, sound = false, audioContext = null, dialog = '', beforeDialog = 'ready';
  let previousFocus = null, lastTime = 0, frameId = 0, uiTime = 0, toastTime = 0;
  let previousHits = 0, lastStatus = 'ready', lastTip = '', trails = [], lastTrail = null;
  let viewScale = 1, toastKey = '', statusKey = 'ready';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') {
      for (const level of E.levels) {
        const record = saved[level.id];
        if (record && Number.isFinite(record.score) && Number.isInteger(record.stars) && record.stars >= 1 && record.stars <= 3) {
          records[level.id] = { score: Math.max(0, Math.min(1500, record.score)), stars: record.stars };
        }
      }
    }
  } catch { /* Practice still works if local storage is unavailable. */ }
  const levelName = level => t(level.id === 'reverse' ? 'reverseName' : level.id);
  function unlocked() {
    let count = 1;
    while (count < E.levels.length && records[E.levels[count - 1].id]) count++;
    return count;
  }
  function saveResult() {
    const old = records[game.level.id];
    records[game.level.id] = { score: Math.max(old?.score || 0, game.result.score), stars: Math.max(old?.stars || 0, game.result.stars) };
    try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Session progress is retained. */ }
  }
  function clearInput() { keys.clear(); pointers.clear(); buttons.forEach(button => button.classList.remove('pressed')); }
  function input() {
    const values = new Set(pointers.values());
    const active = (name, codes) => values.has(name) || codes.some(key => keys.has(key));
    return {
      steering: Number(active('right', ['ArrowRight', 'KeyD'])) - Number(active('left', ['ArrowLeft', 'KeyA'])),
      throttle: Number(active('forward', ['ArrowUp', 'KeyW'])) - Number(active('reverse', ['ArrowDown', 'KeyS'])),
      brake: active('brake', ['Space'])
    };
  }
  function tone(frequency, duration, type = 'sine', delay = 0) {
    if (!sound || !audioContext || document.hidden) return;
    try {
      const at = audioContext.currentTime + delay, oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(0.065, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(at); oscillator.stop(at + duration);
    } catch { /* Audio is optional. */ }
  }
  $('sound').addEventListener('click', () => {
    sound = !sound;
    if (sound) {
      try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume().catch(() => {}); }
      catch { sound = false; }
      tone(520, 0.12);
    } else if (audioContext) audioContext.suspend().catch(() => {});
    updateSound();
  });
  function updateSound() {
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound').querySelector('.sound-slash').hidden = sound;
  }
  function startLevel(index) {
    if (index >= unlocked()) return;
    clearInput(); game.reset(index); game.start(); dialog = ''; $('overlay').hidden = true;
    trails = []; lastTrail = null; previousHits = 0; lastStatus = 'playing'; lastTip = ''; toastTime = 0;
    $('toast').hidden = true; updateLabels(); updateUI(); canvas.focus({ preventScroll: true });
    if (sound && audioContext) audioContext.resume().catch(() => {});
  }
  function makeLevelButtons(container) {
    container.replaceChildren();
    E.levels.forEach((level, index) => {
      const button = document.createElement('button'), stars = records[level.id]?.stars || 0, isLocked = index >= unlocked();
      button.className = `level-button${index === game.index ? ' current' : ''}${isLocked ? ' locked' : ''}`;
      button.disabled = isLocked;
      button.setAttribute('aria-label', isLocked ? `${index + 1}. ${levelName(level)} — ${t('locked')}` : t('levelLabel', { number: index + 1, name: levelName(level), stars }));
      button.title = isLocked ? t('locked') : levelName(level);
      if (index === game.index) button.setAttribute('aria-current', 'step');
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
      const rating = document.createElement('small'); rating.textContent = isLocked ? '−' : '★'.repeat(stars) + '·'.repeat(3 - stars);
      button.append(number, rating); button.addEventListener('click', () => startLevel(index)); container.append(button);
    });
  }
  function updateLabels() {
    $('level-number').textContent = String(game.index + 1).padStart(2, '0');
    $('level-name').textContent = levelName(game.level);
    $('sheet-number').textContent = `PRACTICE / ${String(game.index + 1).padStart(2, '0')}`;
    $('mission-note').textContent = t(`${game.level.id}Hint`);
    $('par-note').textContent = t('par', { seconds: game.level.par });
    const stars = Object.values(records).reduce((sum, record) => sum + record.stars, 0);
    $('total-stars').textContent = `${stars} / 24 ★`;
    $('total-stars').setAttribute('aria-label', t('total', { stars }));
    makeLevelButtons($('level-list')); updateSound(); lastTip = ''; updateUI();
    if (dialog) renderDialog();
  }
  function showDialog(kind) {
    if (!dialog) { beforeDialog = game.status; previousFocus = document.activeElement; }
    game.pause(); clearInput(); dialog = kind; $('overlay').hidden = false;
    renderDialog(); updateUI(); $('primary-action').focus({ preventScroll: true });
    if (audioContext && kind !== 'won') audioContext.suspend().catch(() => {});
  }
  function closeDialog() {
    if (dialog === 'won' || dialog === 'failed') { startLevel(game.index); return; }
    if (game.status === 'won' || game.status === 'failed') { showDialog(game.status); return; }
    dialog = ''; $('overlay').hidden = true;
    if (beforeDialog === 'playing' || beforeDialog === 'ready') game.start();
    if (sound && audioContext) audioContext.resume().catch(() => {});
    (previousFocus?.isConnected ? previousFocus : canvas).focus({ preventScroll: true });
    lastTime = performance.now(); updateUI();
  }
  function addHelp(content, full) {
    const lines = document.createElement('div'); lines.className = 'help-lines';
    for (const n of full ? [1, 2, 3, 4, 5] : [1, 2, 3]) { const p = document.createElement('p'); p.textContent = t(`controls${n}`); lines.append(p); }
    content.append(lines);
  }
  function renderDialog() {
    const primary = $('primary-action'), secondary = $('secondary-action'), content = $('overlay-content'), art = $('overlay-art');
    content.replaceChildren(); secondary.hidden = true; art.className = 'overlay-art'; art.textContent = 'P';
    $('overlay-kicker').textContent = t('introKicker');
    $('close-overlay').hidden = dialog === 'won' || dialog === 'failed';
    if (dialog === 'intro' || dialog === 'help') {
      $('overlay-title').textContent = t(dialog === 'intro' ? 'name' : 'help');
      $('overlay-description').textContent = t(dialog === 'intro' ? 'intro' : `${game.level.id}Hint`);
      addHelp(content, dialog === 'help'); primary.textContent = t(dialog === 'intro' ? 'start' : 'resume'); primary.onclick = closeDialog;
    } else if (dialog === 'paused') {
      art.textContent = 'Ⅱ'; $('overlay-title').textContent = t('pausedTitle'); $('overlay-description').textContent = t('pausedText');
      primary.textContent = t('resume'); primary.onclick = closeDialog;
      secondary.hidden = false; secondary.textContent = t('again'); secondary.onclick = () => startLevel(game.index);
    } else if (dialog === 'courses') {
      art.textContent = '08'; $('overlay-title').textContent = t('selectTitle'); $('overlay-description').textContent = t('selectText');
      const grid = document.createElement('div'); grid.className = 'course-grid'; makeLevelButtons(grid); content.append(grid);
      primary.textContent = t('resume'); primary.onclick = closeDialog;
    } else if (dialog === 'won') {
      const last = game.index === E.levels.length - 1;
      art.className = 'overlay-art stars'; art.textContent = '★'.repeat(game.result.stars) + '☆'.repeat(3 - game.result.stars);
      $('overlay-kicker').textContent = `${String(game.index + 1).padStart(2, '0')} / 08 · ${levelName(game.level)}`;
      $('overlay-title').textContent = t(last ? 'masterTitle' : 'winTitle'); $('overlay-description').textContent = t(last ? 'masterText' : 'winText');
      const result = document.createElement('div'); result.className = 'result-grid';
      for (const [key, value] of [['time', `${game.result.time.toFixed(1)}s`], ['accuracy', `${game.result.accuracy}%`], ['score', game.result.score]]) {
        const item = document.createElement('div'), strong = document.createElement('strong'), label = document.createElement('span');
        strong.textContent = value; label.textContent = t(key); item.append(strong, label); result.append(item);
      }
      content.append(result);
      const best = document.createElement('p'); best.className = 'intro-keys'; best.textContent = t('best', { score: records[game.level.id].score }); content.append(best);
      primary.textContent = t(last ? 'allCourses' : 'next'); primary.onclick = last ? () => { beforeDialog = 'ready'; showDialog('courses'); } : () => startLevel(game.index + 1);
      secondary.hidden = false; secondary.textContent = t('again'); secondary.onclick = () => startLevel(game.index);
    } else if (dialog === 'failed') {
      art.textContent = '↺'; $('overlay-title').textContent = t('failedTitle');
      $('overlay-description').textContent = t(game.hits >= 5 ? 'failedHits' : 'failedTime');
      primary.textContent = t('again'); primary.onclick = () => startLevel(game.index);
      secondary.hidden = false; secondary.textContent = t('allCourses'); secondary.onclick = () => { beforeDialog = 'ready'; showDialog('courses'); };
    }
  }
  function pause() {
    if (dialog === 'paused') closeDialog();
    else if (!dialog && game.status === 'playing') showDialog('paused');
  }
  $('pause').onclick = pause; $('restart').onclick = () => startLevel(game.index);
  $('help').onclick = () => showDialog('help'); $('courses').onclick = () => showDialog('courses'); $('close-overlay').onclick = closeDialog;
  for (const button of buttons) {
    button.addEventListener('pointerdown', event => {
      if (game.status !== 'playing' || dialog) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, button.dataset.control); button.classList.add('pressed');
    });
    const release = event => { pointers.delete(event.pointerId); button.classList.toggle('pressed', [...pointers.values()].includes(button.dataset.control)); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', event => event.preventDefault());
  }
  const drivingKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'];
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (dialog && event.code === 'Tab') {
      const focusable = [...$('overlay').querySelectorAll('button:not([disabled])')].filter(el => !el.hidden && el.offsetParent !== null);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    if (event.code === 'Escape') { event.preventDefault(); if (dialog && dialog !== 'won' && dialog !== 'failed') closeDialog(); else pause(); return; }
    if (event.code === 'KeyP' && !event.repeat) { event.preventDefault(); pause(); return; }
    if (event.code === 'KeyR' && !event.repeat && !dialog) { event.preventDefault(); startLevel(game.index); return; }
    if (drivingKeys.includes(event.code) && !dialog && game.status === 'playing') { event.preventDefault(); keys.add(event.code); }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => { clearInput(); if (!dialog && game.status === 'playing') showDialog('paused'); });
  document.addEventListener('visibilitychange', () => {
    clearInput();
    if (document.hidden) { if (!dialog && game.status === 'playing') showDialog('paused'); cancelAnimationFrame(frameId); frameId = 0; audioContext?.suspend().catch(() => {}); }
    else { lastTime = performance.now(); if (!frameId) frameId = requestAnimationFrame(frame); }
  });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frameId); frameId = 0; clearInput(); audioContext?.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { lastTime = performance.now(); if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame); });
  window.addEventListener('boopland:languagechange', updateLabels);
  function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
  function updateUI() {
    $('timer').textContent = formatTime(game.elapsed);
    $('timer').title = t('timeLeft', { seconds: Math.max(0, Math.ceil(game.level.limit - game.elapsed)) });
    if ($('hits').textContent !== `${game.hits} / 5`) {
      $('hits').replaceChildren(document.createTextNode(`${game.hits} `)); const limit = document.createElement('em'); limit.textContent = '/ 5'; $('hits').append(limit);
    }
    $('speed').textContent = Math.round(Math.abs(game.car.speed) * 0.23);
    $('gear').textContent = Math.abs(game.car.speed) < 1 ? 'N' : game.car.speed < 0 ? 'R' : 'D';
    $('wheel').style.transform = `rotate(${game.car.steer * 180}deg)`;
    $('hold-progress').style.width = `${Math.min(100, game.hold / 1.2 * 100)}%`;
    $('status-dot').classList.toggle('parking', game.hold > 0);
    $('pause').disabled = !!dialog && dialog !== 'paused'; $('pause').textContent = game.status === 'paused' ? '▷' : 'Ⅱ';
    $('pause').setAttribute('aria-label', t(game.status === 'paused' ? 'resume' : 'pause'));
    const check = E.parking(game.car, game.level.target);
    statusKey = game.status === 'paused' ? 'paused' : game.hold > 0 ? 'holding' : check.inside && !check.aligned ? 'align' : check.inside && !check.direction ? 'needReverse' : check.inside ? 'stop' : !game.started ? 'ready' : game.car.speed < -2 ? 'reversing' : 'driving';
    const tip = t(statusKey); if (tip !== lastTip) { $('driving-tip').textContent = tip; lastTip = tip; }
    buttons.forEach(button => { button.disabled = game.status !== 'playing' || !!dialog; });
    if (!$('toast').hidden && toastKey) $('toast').textContent = t(toastKey);
  }
  function resize() {
    const bounds = $('stage').getBoundingClientRect();
    viewScale = Math.max(0.01, Math.min((bounds.width - 8) / E.W, (bounds.height - 22) / E.H));
    const width = Math.max(1, E.W * viewScale), height = Math.max(1, E.H * viewScale), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); draw();
  }
  new ResizeObserver(resize).observe($('stage'));
  function path(points, color, width = 1.4, close = false) {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    points.forEach((p, index) => index ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (close) ctx.closePath(); ctx.stroke();
  }
  function roundRect(x, y, w, h, radius, fill, stroke, lineWidth = 1.3) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }
  function sketchBox(x, y, w, h, fill, stroke) {
    roundRect(x, y, w, h, 7, fill, stroke);
    path([[x + 3, y + h - 2], [x + 1, y + 9], [x + 7, y + 2], [x + w - 6, y + 1]], `${stroke}55`, 0.65);
    path([[x + w - 2, y + 7], [x + w - 1, y + h - 8], [x + w - 7, y + h - 1], [x + 8, y + h + 1]], `${stroke}44`, 0.7);
  }
  function arrow(x, y, angle, length = 28, color = '#879378') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    path([[-length / 2, 0], [length / 2, 0], [length / 2 - 8, -6]], color, 2);
    path([[length / 2, 0], [length / 2 - 8, 6]], color, 2); ctx.restore();
  }
  function drawBay(bay, active = false) {
    ctx.save(); ctx.translate(bay.x, bay.y); ctx.rotate(bay.angle);
    const l = bay.length, w = bay.width;
    roundRect(-l / 2, -w / 2, l, w, 4, active ? '#d4dfc4' : '#eeeade', active ? '#7c9469' : '#d0cdbf', active ? 2 : 1.5);
    if (active) {
      ctx.setLineDash([5, 4]); roundRect(-E.LENGTH / 2, -E.WIDTH / 2, E.LENGTH, E.WIDTH, 6, null, '#90a27d', 1); ctx.setLineDash([]);
      ctx.fillStyle = '#869b6f'; ctx.font = 'bold 25px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', -10, 0);
      arrow(22, 0, 0, 22, '#758b60');
      path([[-l / 2 - 3, -w / 2 + 8], [-l / 2 - 3, -w / 2 - 3], [-l / 2 + 9, -w / 2 - 3]], '#839471');
      path([[l / 2 + 3, w / 2 - 8], [l / 2 + 3, w / 2 + 3], [l / 2 - 9, w / 2 + 3]], '#839471');
    }
    ctx.restore();
  }
  function drawCar(car, player = false) {
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
    const l = car.length || E.LENGTH, w = car.width || E.WIDTH, x = -l / 2, y = -w / 2;
    const fill = player ? '#b8c99e' : car.color || '#c0cad0';
    roundRect(x + 3, y + 4, l, w, 7, '#48523f18');
    for (const side of [-1, 1]) for (const axle of [-1, 1]) {
      ctx.save(); ctx.translate(axle * l * 0.3, side * (w / 2 + 1)); if (player && axle === 1) ctx.rotate(game.car.steer);
      roundRect(-6, -2.3, 12, 4.6, 1.5, '#59614f'); ctx.restore();
    }
    sketchBox(x, y, l, w, fill, '#5e6856');
    roundRect(-12, -w / 2 + 4, 24, w - 8, 5, player ? '#dce5cf' : '#e0e4df', '#7c8772', 0.9);
    path([[9, -w / 2 + 5], [13, -w / 2 + 6], [15, w / 2 - 6], [10, w / 2 - 5]], '#647869', 1.1, true);
    path([[-12, -w / 2 + 6], [-17, -w / 2 + 7], [-17, w / 2 - 7], [-12, w / 2 - 6]], '#88978b', 1, true);
    path([[18, -w / 2 + 4], [l / 2 - 5, -w / 2 + 5], [l / 2 - 3, w / 2 - 5], [18, w / 2 - 4]], '#7d8e6e66', 0.8);
    for (const side of [-1, 1]) {
      roundRect(l / 2 - 4, side < 0 ? y + 4 : w / 2 - 9, 3, 5, 1, '#fcf4cb', '#b2ae87', 0.6);
      roundRect(x + 1, side < 0 ? y + 4 : w / 2 - 9, 3, 5, 1, player && input().brake ? '#b57465' : '#b89883');
      path([[-5, side * (w / 2 - 2)], [1, side * (w / 2 - 2)]], '#647457', 0.8);
      if (player) roundRect(9, side < 0 ? y - 4 : w / 2, 5, 4, 1.2, fill, '#6b765d', 0.8);
    }
    if (player) {
      ctx.fillStyle = '#6b7e58'; ctx.font = '8px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('01', -2, 1);
      if (game.flash > 0) { ctx.strokeStyle = '#ac7d65'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeRect(x - 8, y - 8, l + 16, w + 16); ctx.setLineDash([]); }
    }
    ctx.restore();
  }
  function drawObstacle(item) {
    if (item.kind === 'car') return drawCar(item);
    if (item.kind === 'cone') {
      ctx.save(); ctx.translate(item.x, item.y);
      sketchBox(-9, -9, 18, 18, '#d9c6a7', '#a59273');
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fillStyle = '#c29d74'; ctx.fill(); ctx.strokeStyle = '#978265'; ctx.stroke();
      path([[-3, 0], [3, 0]], '#f8f1d8', 3); ctx.restore(); return;
    }
    const x = item.x - item.length / 2, y = item.y - item.width / 2;
    sketchBox(x, y, item.length, item.width, '#d2dac1', '#9aa989');
    roundRect(x + 5, y + 5, item.length - 10, item.width - 10, 4, '#dce2cd', '#bbc6a8', 0.8);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 8, y + 8, item.length - 16, item.width - 16); ctx.clip();
    for (let row = 0; row < item.width / 22; row++) for (let col = 0; col < item.length / 22; col++) {
      const px = x + 16 + col * 23 + Math.sin(row * 4 + col) * 4, py = y + 15 + row * 22 + Math.cos(col * 3) * 3;
      path([[px - 4, py + 3], [px, py - 4], [px + 3, py + 2]], '#a5b19188', 0.9);
      path([[px, py + 3], [px + 5, py - 2]], '#8e9d7c66', 0.8);
      if ((row + col) % 4 === 0) { ctx.fillStyle = '#b7b18a'; ctx.beginPath(); ctx.arc(px + 3, py - 4, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(canvas.width / E.W, 0, 0, canvas.height / E.H, 0, 0); ctx.clearRect(0, 0, E.W, E.H);
    roundRect(8, 8, E.W - 16, E.H - 16, 13, '#e4e1d5', '#c7c8b6');
    roundRect(27, 27, E.W - 54, E.H - 54, 10, '#efede3', '#d0cfc0');
    for (let i = 0; i < 290; i++) {
      const x = 35 + ((i * 117.7) % 730), y = 35 + ((i * 71.3) % 490);
      path([[x, y], [x + 1.5 + (i % 3), y - 0.5]], '#a4a38d18', 0.7);
    }
    for (let x = 44; x < 760; x += 26) { path([[x, 10], [x - 4, 23]], '#b6bca75c', 1); path([[x, 537], [x + 3, 549]], '#b6bca75c', 1); }
    for (let y = 40; y < 520; y += 26) { path([[10, y], [23, y + 3]], '#b6bca75c', 1); path([[777, y], [790, y - 2]], '#b6bca75c', 1); }
    game.level.spots.forEach(spot => drawBay(spot)); drawBay(game.level.target, true);
    if (game.level.guide) {
      ctx.setLineDash([4, 8]); path(game.level.guide, '#9da88c55', 1.3); ctx.setLineDash([]);
      const guide = game.level.guide, a = guide[guide.length - 2], b = guide[guide.length - 1];
      arrow(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), 18, '#9da88c88');
    }
    for (const trace of trails) {
      for (const side of [-1, 1]) {
        const dx = Math.sin(trace.angle) * 13 * side, dy = -Math.cos(trace.angle) * 13 * side;
        path([[trace.x + dx, trace.y + dy], [trace.x + dx - Math.cos(trace.angle) * 4, trace.y + dy - Math.sin(trace.angle) * 4]], '#92977d25', 1.5);
      }
    }
    game.level.obstacles.forEach(drawObstacle);
    if (!game.started) {
      ctx.save(); ctx.fillStyle = '#8a927a'; ctx.font = '12px Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText('01', game.car.x, game.car.y - 50); path([[game.car.x, game.car.y - 44], [game.car.x, game.car.y - 35]], '#8a927a', 1); ctx.restore();
    }
    drawCar(game.car, true);
    if (game.hold > 0) {
      ctx.save(); ctx.strokeStyle = '#668255'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(game.car.x, game.car.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, game.hold / 1.2)); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = '#8b917a'; ctx.font = '10px Consolas, monospace'; ctx.textAlign = 'left'; ctx.fillText(`0${game.index + 1} / 08`, 44, 515);
    ctx.textAlign = 'right'; ctx.fillText('P', 756, 515);
  }
  function frame(now) {
    frameId = 0;
    const dt = Math.min((now - (lastTime || now)) / 1000, 0.05); lastTime = now;
    if (!dialog) game.step(dt, input());
    if (game.hits > previousHits) {
      previousHits = game.hits; toastKey = 'collision'; $('toast').textContent = t(toastKey); $('toast').hidden = false; toastTime = 1.8; tone(110, 0.16, 'triangle');
    }
    if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) $('toast').hidden = true; }
    if (game.status !== lastStatus) {
      lastStatus = game.status;
      if (game.status === 'won') { saveResult(); updateLabels(); tone(523, 0.18); tone(659, 0.18, 'sine', 0.13); tone(784, 0.3, 'sine', 0.26); showDialog('won'); }
      else if (game.status === 'failed') { tone(150, 0.25, 'triangle'); showDialog('failed'); }
    }
    if (Math.abs(game.car.speed) > 5 && (!lastTrail || Math.hypot(game.car.x - lastTrail.x, game.car.y - lastTrail.y) > 6)) {
      lastTrail = { x: game.car.x, y: game.car.y, angle: game.car.angle }; trails.push(lastTrail); if (trails.length > 240) trails.shift();
    }
    uiTime += dt; if (uiTime > 0.09) { updateUI(); uiTime = 0; }
    draw(); if (!document.hidden) frameId = requestAnimationFrame(frame);
  }
  updateLabels(); resize(); showDialog('intro'); frameId = requestAnimationFrame(frame);
})();
