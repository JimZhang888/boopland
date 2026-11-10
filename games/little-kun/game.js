(() => {
  'use strict';
  const $ = id => document.getElementById(id), i18n = window.BooplandI18n;
  const t = (key, values) => i18n.t('littleKun.' + key, values);
  const game = new window.LittleKun(), scene = new window.KunScene($('sea'), game), keys = new Set();
  const storageKey = 'boopland-little-kun-v1';
  let best = 0, storedStage = 0, memoryOnly = false, sound = false, audioContext;
  let frame = 0, last = 0, uiTime = 0, toastUntil = 0, toastKey = '', toastValues = {};
  let mouse = null, stick = null, helpWasPlaying = false;
  try { const data = JSON.parse(localStorage.getItem(storageKey)); best = Number.isSafeInteger(data?.best) && data.best >= 0 ? data.best : 0; storedStage = Number.isInteger(data?.stage) && data.stage >= 0 && data.stage <= 5 ? data.stage : 0; } catch { /* Damaged saves do not prevent play. */ }
  try { localStorage.setItem(storageKey, JSON.stringify({ best, stage: storedStage })); } catch { memoryOnly = true; }
  for (let i = 0; i < 6; i++) { const li = document.createElement('li'); li.innerHTML = '<span class="step"></span><span class="stage-name"></span><small></small>'; $('evolution').append(li); }
  function save() {
    if (game.score <= best && game.stage <= storedStage) return;
    best = Math.max(best, game.score); storedStage = Math.max(storedStage, game.stage);
    try { localStorage.setItem(storageKey, JSON.stringify({ best, stage: storedStage })); } catch { memoryOnly = true; }
  }
  function unlockAudio() {
    if (!sound) return;
    try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume().catch(() => {}); } catch { /* Audio is optional. */ }
  }
  function tone(kind) {
    if (!sound || audioContext?.state !== 'running') return;
    const notes = kind === 'evolve' ? [392, 494, 587, 784] : kind === 'hit' ? [180, 120] : kind === 'dash' ? [300, 520] : kind === 'surge' ? [196, 294, 392] : [620, 830];
    const now = audioContext.currentTime;
    notes.forEach((f, i) => { const o = audioContext.createOscillator(), v = audioContext.createGain(), at = now + i * .07;
      o.type = 'sine'; o.frequency.setValueAtTime(f, at); v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(.035, at + .012); v.gain.exponentialRampToValueAtTime(.001, at + .16); o.connect(v).connect(audioContext.destination); o.start(at); o.stop(at + .17); o.onended = () => { o.disconnect(); v.disconnect(); };
    });
  }
  function toast(key, values = {}) { toastKey = key; toastValues = values; toastUntil = game.time + 3; $('toast').textContent = t(key, values); $('toast').hidden = false; }
  function clearInput() { keys.clear(); mouse = null; stick = null; $('joystick').hidden = true; }
  function updateUI() {
    document.title = t('pageTitle');
    const active = game.status === 'playing', form = window.LittleKun.STAGES[game.stage];
    document.body.classList.toggle('playing', active); $('overlay').hidden = active;
    $('score').textContent = game.score.toLocaleString(i18n.language); $('eaten').textContent = game.eaten; $('best').textContent = best.toLocaleString(i18n.language);
    $('form-name').textContent = t(form.key); $('form-number').textContent = `0${game.stage + 1} / 06`;
    $('next-form').textContent = game.won ? t('complete') : t('next', { name: t('stage' + (game.stage + 1)) });
    $('growth-text').textContent = game.won ? '∞' : `${game.xp - form.xp} / ${window.LittleKun.STAGES[game.stage + 1].xp - form.xp}`;
    $('growth-fill').style.width = `${game.progress() * 100}%`; $('growth').setAttribute('aria-valuenow', Math.round(game.progress() * 100));
    $('health').innerHTML = Array.from({ length: 4 }, (_, i) => `<span${i >= game.health ? ' class="empty"' : ''}>♡</span>`).join('');
    $('health').setAttribute('aria-label', t('health', { value: game.health }));
    $('sea-name').textContent = t('sea' + Math.min(2, Math.floor(game.stage / 2)));
    $('pause').disabled = !['playing', 'paused'].includes(game.status); $('pause').textContent = game.status === 'paused' ? '▷' : 'Ⅱ'; $('pause').setAttribute('aria-label', t(game.status === 'paused' ? 'resume' : 'pause'));
    $('ability').disabled = !active || game.energy < (game.won ? 50 : 30) || game.cooldown > 0;
    $('ability-name').textContent = t(game.won ? 'surge' : 'dash'); $('ability-hint').textContent = t(game.won ? 'surgeHint' : 'dashHint'); $('ability-symbol').textContent = game.won ? '◎' : '↝';
    $('energy-text').textContent = Math.floor(game.energy) + '%'; $('energy-fill').style.width = game.energy + '%'; $('energy').setAttribute('aria-valuenow', Math.floor(game.energy));
    $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound-mark').setAttribute('d', sound ? 'M17 8q5 4 0 8m3-11q7 7 0 14' : 'm17 9 5 6m0-6-5 6');
    $('saved').textContent = t(memoryOnly ? 'memoryOnly' : 'saved');
    $('combo').hidden = game.combo < 3 || !active; $('combo').textContent = t('combo', { count: game.combo });
    [...$('evolution').children].forEach((li, i) => { li.className = i === game.stage ? 'active' : i < game.stage ? 'done' : ''; li.querySelector('.step').textContent = i < game.stage ? '✓' : i === 5 ? '✧' : '0' + (i + 1); li.querySelector('.stage-name').textContent = t('stage' + i); li.querySelector('small').textContent = i === game.stage ? t('here') : i === 5 ? t('legendary') : ''; });
    $('control-hint').textContent = t(stick || matchMedia('(pointer: coarse)').matches ? 'touchControls' : 'controls');
    if (toastKey) $('toast').textContent = t(toastKey, toastValues); $('toast').hidden = !active || game.time > toastUntil || !toastKey;
    if (active) return;
    const states = { ready: ['readyTitle', 'intro', 'start'], paused: ['paused', 'pausedDesc', 'resume'], over: ['over', 'overDesc', 'again'], won: ['won', 'wonDesc', 'continue'] };
    const state = states[game.status];
    $('overlay-title').textContent = t(state[0]); $('overlay-description').textContent = t(state[1]); $('start').textContent = t(state[2]) + ' →';
    $('overlay-kicker').textContent = t(game.status === 'won' ? 'legendary' : 'kicker');
    $('start-hint').hidden = game.status !== 'ready'; $('restart').hidden = !['paused', 'won'].includes(game.status);
    $('result').hidden = !['won', 'over'].includes(game.status); $('result').textContent = t('result', { score: game.score, count: game.eaten, name: t(form.key) });
  }
  function input() {
    const x = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
    const y = Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
    if (x || y) return { x, y };
    if (stick) return { x: stick.dx / 38, y: stick.dy / 38 };
    if (mouse) { const point = scene.worldAt(mouse.x, mouse.y), dx = point.x - game.player.x, dy = point.y - game.player.y, distance = Math.hypot(dx, dy);
      if (distance < 9) return {};
      const amount = Math.min(1, (distance - 9) / 75); return { x: dx / distance * amount, y: dy / distance * amount };
    }
    return {};
  }
  function events() {
    let ate = false;
    for (const e of game.drainEvents()) {
      scene.effect(e, e.type === 'eat' ? '+' + e.points : e.type === 'pearl' ? '+ ♡' : '');
      if (e.type === 'eat') ate = true;
      else if (e.type === 'evolve') { toast('evolved', { name: t('stage' + e.stage) }); tone('evolve'); }
      else if (e.type === 'hit') { toast('hurt'); tone('hit'); }
      else if (e.type === 'pearl') { toast('healed'); tone('eat'); }
      else if (e.type === 'dash' || e.type === 'surge') tone(e.type);
      if (e.type === 'won' || e.type === 'over') { clearInput(); save(); updateUI(); $('start').focus({ preventScroll: true }); }
    }
    if (ate) { tone('eat'); save(); }
  }
  function loop(now) {
    frame = 0; const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    game.tick(dt, input()); events(); scene.draw(dt); uiTime += dt;
    if (uiTime > .08) { updateUI(); uiTime = 0; }
    if (game.status === 'playing' && !document.hidden) frame = requestAnimationFrame(loop);
    else { last = 0; updateUI(); }
  }
  function run() { if (!frame && game.status === 'playing' && !document.hidden) { last = 0; frame = requestAnimationFrame(loop); } }
  function begin() {
    unlockAudio(); clearInput();
    if (game.status === 'paused' || game.status === 'won') game.resume();
    else { game.start(); scene.particles = []; scene.rings = []; scene.updateCamera(1, true); toastKey = ''; }
    updateUI(); $('sea').focus({ preventScroll: true }); run();
  }
  function pause() {
    if (game.status !== 'playing') return;
    game.pause(); clearInput(); if (frame) cancelAnimationFrame(frame); frame = 0; last = 0;
    if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    updateUI(); scene.draw(0);
  }
  function ability() { unlockAudio(); if (game.ability()) { events(); updateUI(); } }
  $('start').addEventListener('click', begin);
  $('restart').addEventListener('click', () => { game.status = 'ready'; begin(); });
  $('pause').addEventListener('click', () => game.status === 'paused' ? begin() : pause());
  $('ability').addEventListener('click', ability);
  $('sound').addEventListener('click', () => { sound = !sound; if (sound) { unlockAudio(); tone('eat'); } else if (audioContext) audioContext.suspend().catch(() => {}); updateUI(); });
  function openHelp() { helpWasPlaying = game.status === 'playing'; pause(); $('help-dialog').showModal(); }
  function closeHelp() { $('help-dialog').close(); }
  $('help').addEventListener('click', openHelp); $('close-help').addEventListener('click', closeHelp); $('help-done').addEventListener('click', closeHelp);
  $('help-dialog').addEventListener('close', () => { if (helpWasPlaying && game.status === 'paused' && !document.hidden) begin(); helpWasPlaying = false; });
  window.addEventListener('keydown', e => {
    if ($('help-dialog').open || e.ctrlKey || e.altKey || e.metaKey) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) { if (game.status === 'playing') { e.preventDefault(); keys.add(e.code); mouse = null; } return; }
    if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) { e.preventDefault(); game.status === 'paused' ? begin() : pause(); }
    if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); if (game.status === 'playing') ability(); else begin(); }
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  const canvas = $('sea');
  function pointerPosition(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  canvas.addEventListener('pointerdown', e => {
    if (game.status !== 'playing') return;
    unlockAudio(); const pos = pointerPosition(e);
    if (e.pointerType === 'mouse') { mouse = pos; return; }
    if (stick) return;
    canvas.setPointerCapture(e.pointerId); stick = { id: e.pointerId, x: pos.x, y: pos.y, dx: 0, dy: 0 };
    $('joystick').hidden = false; $('joystick').style.left = pos.x - 45 + 'px'; $('joystick').style.top = pos.y - 45 + 'px'; $('joystick-knob').style.transform = 'translate(0,0)';
  });
  canvas.addEventListener('pointermove', e => {
    if (game.status !== 'playing') return;
    const pos = pointerPosition(e);
    if (e.pointerType === 'mouse') { mouse = pos; return; }
    if (!stick || stick.id !== e.pointerId) return;
    const dx = pos.x - stick.x, dy = pos.y - stick.y, length = Math.hypot(dx, dy), ratio = length > 38 ? 38 / length : 1;
    stick.dx = dx * ratio; stick.dy = dy * ratio; $('joystick-knob').style.transform = `translate(${stick.dx}px,${stick.dy}px)`;
  });
  function release(e) { if (stick?.id === e.pointerId) { stick = null; $('joystick').hidden = true; } }
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release); canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mouse = null; });
  window.addEventListener('blur', () => { helpWasPlaying = false; pause(); clearInput(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { helpWasPlaying = false; pause(); if (audioContext) audioContext.suspend().catch(() => {}); } });
  window.addEventListener('boopland:languagechange', () => { updateUI(); });
  // The shared language loader also applies static bindings on DOMContentLoaded.
  document.addEventListener('DOMContentLoaded', updateUI);
  new ResizeObserver(() => { scene.resize(); scene.draw(0); }).observe($('ocean'));
  scene.resize(); updateUI(); scene.draw(0);
})();
