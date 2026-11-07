(() => {
  'use strict';
  const $ = id => document.getElementById(id), t = (key, values) => BooplandI18n.t(`crossing.${key}`, values);
  const game = new ChickenCrossing.Game(), canvas = $('game'), scene = new ChickenScene(canvas);
  const storageKey = 'boopland-chicken-crossing-best-v1', soundKey = 'boopland-chicken-crossing-sound';
  let best = 0, startingBest = 0, sound = false, audio = null;
  try { const saved = Number(localStorage.getItem(storageKey)); if (Number.isSafeInteger(saved) && saved >= 0) best = Math.min(saved, 1e9); sound = localStorage.getItem(soundKey) === 'on'; } catch { /* Play also works with blocked storage. */ }
  let dialog = 'intro', returnDialog = 'intro', notice = null, noticeUntil = 0, frameId = 0, lastTime = 0, lastHud = '';
  let queued = null, held = null, repeatAt = 0, pointer = null, previousFocus = null;
  const moves = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };
  const keyDirections = { ArrowUp: 'up', KeyW: 'up', Space: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  const directionButtons = [...document.querySelectorAll('[data-move]')];

  function wakeAudio() {
    if (!sound || document.hidden) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); } catch { sound = false; updateSound(); }
  }
  function tone(freq, seconds, volume = .025, offset = 0) {
    if (!sound || !audio || document.hidden || audio.state !== 'running') return;
    try {
      const at = audio.currentTime + offset, oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(freq, at); oscillator.frequency.exponentialRampToValueAtTime(freq * .72, at + seconds);
      gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .008); gain.gain.exponentialRampToValueAtTime(.0001, at + seconds);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + seconds + .01);
    } catch { /* Optional sound must not interrupt play. */ }
  }
  function updateSound() {
    $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound').title = t(sound ? 'soundOff' : 'soundOn');
    $('sound-mark').setAttribute('d', sound ? 'M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm17 9 5 6m0-6-5 6');
  }
  function clearInput() { held = null; queued = null; pointer = null; directionButtons.forEach(b => b.classList.remove('pressed')); }
  function start() {
    clearInput(); game.reset(); game.start(); startingBest = best; dialog = ''; notice = null; lastHud = '';
    $('overlay').hidden = true; $('notice').hidden = true; lastTime = performance.now();
    wakeAudio(); updateHud(); canvas.focus({ preventScroll: true });
  }
  function showDialog(kind) {
    if (!dialog) previousFocus = document.activeElement;
    game.pause(); clearInput(); dialog = kind; $('overlay').hidden = false;
    renderDialog(); updateHud(); $('primary').focus({ preventScroll: true });
    if (audio && kind !== 'dead') audio.suspend().catch(() => {});
  }
  function resume() {
    dialog = ''; $('overlay').hidden = true; game.start(); clearInput(); lastTime = performance.now();
    wakeAudio(); updateHud(); (previousFocus?.isConnected && previousFocus !== $('primary') ? previousFocus : canvas).focus({ preventScroll: true });
  }
  function dismissHelp() {
    if (returnDialog) showDialog(returnDialog); else resume();
  }
  function renderDialog() {
    const isIntro = dialog === 'intro', isDead = dialog === 'dead', isHelp = dialog === 'help';
    $('intro-art').hidden = !isIntro;
    $('dialog-eyebrow').textContent = t(isDead && game.score > startingBest ? 'newBest' : 'eyebrow');
    $('dialog-title').textContent = t(isIntro ? 'name' : isHelp ? 'help' : isDead ? 'deathTitle' : 'pauseTitle');
    $('dialog-description').textContent = t(isIntro || isHelp ? 'intro' : isDead ? game.reason === 'idle' ? 'idleReason' : game.reason : 'pauseText');
    $('result').hidden = !isDead; $('result-score').textContent = game.score; $('result-best').textContent = t('record', { score: best });
    $('help-content').hidden = !isHelp; $('intro-controls').hidden = !isIntro;
    $('primary').textContent = t(isIntro ? 'start' : isDead ? 'again' : 'resume');
    $('primary').onclick = isHelp ? dismissHelp : isDead || isIntro ? start : resume;
    $('secondary').hidden = dialog !== 'paused'; $('secondary').onclick = start;
  }
  function updateHud(force = false) {
    const rowType = game.lane(game.player.row)?.type || 'grass';
    const fingerprint = `${game.status}:${game.score}:${best}:${rowType}:${BooplandI18n.language}:${dialog}`;
    if (!force && fingerprint === lastHud) return;
    lastHud = fingerprint;
    $('score').textContent = game.score; $('best').textContent = best;
    $('next-stop').textContent = (Math.floor(game.score / 25) + 1) * 25;
    $('milestone-fill').style.width = `${game.score % 25 / 25 * 100}%`;
    const status = game.status === 'playing' ? `${rowType}Tip` : game.status === 'ready' ? 'readyStatus' : game.status === 'dead' ? 'deadStatus' : 'pausedStatus';
    $('status-text').textContent = t(status);
    $('pause').disabled = game.status !== 'playing'; directionButtons.forEach(b => b.disabled = game.status !== 'playing' || Boolean(dialog));
    $('pause').title = t('pause'); $('help').title = t('help');
  }
  function notify(key, seconds = 2, values = {}) { notice = { key, values }; noticeUntil = game.time + seconds; renderNotice(); }
  function renderNotice() {
    $('notice').hidden = !notice;
    if (!notice) return;
    $('notice').textContent = t(notice.key, notice.values); $('notice').classList.toggle('warning', notice.key === 'warning');
  }
  function requestMove(direction) {
    if (game.status !== 'playing' || dialog) return;
    if (game.player.hop) queued = direction;
    else game.move(...moves[direction]);
  }
  function beginHold(direction, source) {
    if (dialog || game.status !== 'playing') return;
    wakeAudio(); requestMove(direction); held = { direction, source }; repeatAt = game.time + .27;
    directionButtons.forEach(b => b.classList.toggle('pressed', b.dataset.move === direction));
  }
  function endHold(source) { if (held?.source === source) { held = null; directionButtons.forEach(b => b.classList.remove('pressed')); } }
  function pause() { if (game.status === 'playing') showDialog('paused'); }
  $('pause').addEventListener('click', pause);
  $('help').addEventListener('click', () => { if (dialog === 'help') return; returnDialog = dialog; showDialog('help'); });
  $('sound').addEventListener('click', () => {
    sound = !sound; if (sound) { wakeAudio(); tone(700, .09); } else if (audio) audio.suspend().catch(() => {});
    try { localStorage.setItem(soundKey, sound ? 'on' : 'off'); } catch { /* Session preference is enough. */ }
    updateSound();
  });
  for (const button of directionButtons) {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || button.disabled) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); beginHold(button.dataset.move, `pointer-${event.pointerId}`);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => endHold(`pointer-${e.pointerId}`));
    button.addEventListener('click', event => { if (event.detail === 0) { wakeAudio(); requestMove(button.dataset.move); } });
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || game.status !== 'playing' || dialog || pointer) return;
    event.preventDefault(); wakeAudio(); canvas.setPointerCapture(event.pointerId); pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y; pointer = null;
    const direction = Math.hypot(dx, dy) < 18 ? 'up' : Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
    requestMove(direction); canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  canvas.addEventListener('lostpointercapture', () => { pointer = null; });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (event.code === 'Escape' || event.code === 'KeyP') {
      event.preventDefault(); if (event.repeat) return;
      if (dialog === 'help') dismissHelp(); else if (dialog === 'paused') resume(); else pause(); return;
    }
    if ((event.code === 'Space' || event.code === 'Enter') && event.target.closest('button, a')) return;
    if (dialog) {
      if (!event.repeat && (event.code === 'Space' || event.code === 'Enter')) { event.preventDefault(); $('primary').click(); }
      return;
    }
    if (keyDirections[event.code]) { event.preventDefault(); if (!event.repeat) beginHold(keyDirections[event.code], event.code); }
  });
  document.addEventListener('keyup', event => endHold(event.code));
  window.addEventListener('blur', () => { clearInput(); pause(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); clearInput(); cancelAnimationFrame(frameId); frameId = 0; if (audio) audio.suspend().catch(() => {}); }
    else if (!frameId) { lastTime = performance.now(); frameId = requestAnimationFrame(frame); }
  });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frameId); frameId = 0; clearInput(); pause(); if (audio) audio.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { if (!document.hidden && !frameId) { lastTime = performance.now(); frameId = requestAnimationFrame(frame); } });
  window.addEventListener('boopland:languagechange', () => {
    updateSound(); updateHud(true); if (dialog) renderDialog(); renderNotice();
    $('idle-text').textContent = t('hurry', { seconds: Math.max(0, Math.ceil(18 - game.idle)) });
  });
  function handleEvents() {
    for (const event of game.drainEvents()) {
      if (event.type === 'hop') tone(520 + game.score % 4 * 40, .065, .015);
      if (event.type === 'score' && game.score > best) {
        best = game.score;
        try { localStorage.setItem(storageKey, String(best)); } catch { /* Keep the record in memory. */ }
      }
      if (event.type === 'blocked') notify('blocked', 1.4);
      if (event.type === 'milestone') { notify('milestone', 2.2, { score: event.score }); tone(650, .12); tone(850, .16, .025, .12); }
      if (event.type === 'dead') { tone(190, .22, .04); tone(130, .25, .025, .14); showDialog('dead'); }
      if (event.type === 'warning' && event.row >= game.player.row - 1 && event.row <= game.player.row + 5) { notify('warning', 2.1); tone(760, .12); tone(760, .12, .025, .25); }
    }
  }
  function frame(now) {
    frameId = 0; const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0; lastTime = now;
    if (game.status === 'playing') {
      if (!game.player.hop && queued) { const direction = queued; queued = null; game.move(...moves[direction]); }
      if (held && game.time >= repeatAt) { requestMove(held.direction); repeatAt = game.time + .19; }
      game.update(dt); handleEvents(); updateHud();
      if (notice && game.time >= noticeUntil) { notice = null; renderNotice(); }
    }
    $('idle').hidden = game.status !== 'playing' || game.idle < 12;
    if (!$('idle').hidden) { $('idle-text').textContent = t('hurry', { seconds: Math.max(0, Math.ceil(18 - game.idle)) }); $('idle-fill').style.width = `${Math.max(0, (18 - game.idle) / 6 * 100)}%`; }
    scene.draw(game);
    if (!document.hidden) frameId = requestAnimationFrame(frame);
  }
  const observer = new ResizeObserver(() => { scene.resize(); scene.draw(game); }); observer.observe($('stage'));
  updateSound(); renderDialog(); updateHud(); scene.draw(game); frameId = requestAnimationFrame(frame);
})();
