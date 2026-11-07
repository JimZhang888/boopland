(() => {
  'use strict';
  const E = PaperHook, I = BooplandI18n, $ = id => document.getElementById(id);
  const t = (key, values) => I.t('paperHook.' + key, values);
  const storageKey = 'boopland-paper-hook-v1';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Play normally when storage is unavailable. */ } };
  let progress = E.readProgress(read(storageKey));
  let state = E.create(Math.min(progress.unlocked - 1, E.LEVELS.length - 1));
  const scene = new PaperHookScene($('game'), $('stage'));
  let lastFrame = 0, accumulator = 0, frameId = 0, visualTime = 0, resultShown = false;
  let soundEnabled = read(storageKey + '-sound') === '1', audio = null;
  let dialogKind = '', dialogWasPlaying = false, dialogReturn = null, primaryAction, secondaryAction;
  const held = new Set();
  let toastKey = '', toastUntil = 0;

  function tone(kind) {
    if (!soundEnabled || document.hidden) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const notes = { hook: [330], release: [440], star: [659, 880], bounce: [260, 520], won: [523, 659, 784, 1047], lost: [220, 165] }[kind] || [440];
      notes.forEach((freq, i) => {
        const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime + i * .09;
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.045, now + .01); gain.gain.exponentialRampToValueAtTime(.001, now + .17);
        osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now + .2);
      });
    } catch { soundEnabled = false; refreshSound(); }
  }
  function refreshSound() {
    $('sound').setAttribute('aria-pressed', String(soundEnabled));
    $('sound').setAttribute('aria-label', t(soundEnabled ? 'soundOn' : 'soundOff'));
    $('sound').title = t(soundEnabled ? 'soundOn' : 'soundOff');
    $('sound-mark').setAttribute('d', soundEnabled ? 'M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm16 9 6 6m0-6-6 6');
  }
  function clearInput() { held.clear(); E.stopInput(state); updateControls(); }
  function updateControls() {
    const down = held.size > 0;
    $('hook').classList.toggle('is-held', down);
    $('hook').setAttribute('aria-pressed', String(down));
    const label = state.status === 'paused' ? 'resume' : state.status === 'lost' ? 'retry' : state.status === 'won' ? (state.level === 11 ? 'replay' : 'next') : down ? (state.rope ? 'release' : 'waiting') : 'hold';
    if ($('hook-label').textContent !== t(label)) $('hook-label').textContent = t(label);
    $('pause').disabled = !['playing', 'paused'].includes(state.status);
    $('pause').setAttribute('aria-label', t(state.status === 'paused' ? 'resume' : 'pause'));
    $('pause').title = t(state.status === 'paused' ? 'resume' : 'pause');
  }
  function hud() {
    const n = Math.round(state.progress * 100), stars = '★ '.repeat(state.collected.length) + '☆ '.repeat(3 - state.collected.length);
    $('progress-fill').style.width = n + '%'; $('progress-text').textContent = n + '%';
    $('progress').setAttribute('aria-valuenow', String(n));
    if ($('stars').textContent !== stars.trim()) $('stars').textContent = stars.trim();
    $('stars').setAttribute('aria-label', t('totalStars', { count: state.collected.length }).replace('36', '3'));
    updateControls();
  }
  function headers() {
    const level = E.LEVELS[state.level];
    $('level-number').textContent = String(state.level + 1).padStart(2, '0');
    $('chapter-name').textContent = t('chapter' + level.chapter);
    $('level-name').textContent = t('level' + state.level);
    $('levels').setAttribute('aria-label', t('levels'));
    $('scene-caption').textContent = t('scene' + level.chapter);
    $('tip').textContent = t('tip' + level.chapter);
    $('page-stamp').textContent = String(state.level + 1).padStart(2, '0') + ' / 12';
    hud(); refreshSound();
  }
  function showOverlay() {
    const status = state.status;
    if (status === 'playing') { $('overlay').hidden = true; return; }
    $('overlay').hidden = false;
    $('overlay').className = 'overlay ' + (status === 'paused' ? 'paused' : status === 'ready' ? '' : 'result');
    $('note-eyebrow').textContent = t('chapter' + E.LEVELS[state.level].chapter);
    $('result-stars').hidden = status !== 'won'; $('result-details').hidden = status !== 'won';
    $('secondary-action').hidden = !['won', 'lost'].includes(status);
    if (status === 'ready') {
      $('note-title').textContent = t('ready'); $('note-description').textContent = t('intro');
      $('primary-action').textContent = t('start'); $('note-foot').textContent = t('readyFoot'); primaryAction = begin;
    } else if (status === 'paused') {
      $('note-title').textContent = t('paused'); $('note-description').textContent = t('pausedText');
      $('primary-action').textContent = t('resume'); $('note-foot').textContent = t('shortcuts'); primaryAction = resume;
    } else if (status === 'lost') {
      $('note-title').textContent = t('lost'); $('note-description').textContent = t(state.death === 'hazard' ? 'hazardText' : 'fallText');
      $('primary-action').textContent = t('retry'); $('secondary-action').textContent = t('select');
      $('note-foot').textContent = t('readyFoot'); primaryAction = () => load(state.level, true); secondaryAction = () => openDialog('levels');
    } else if (status === 'won') {
      const final = state.level === E.LEVELS.length - 1;
      $('note-title').textContent = t(final ? 'allWon' : 'won'); $('note-description').textContent = t(final ? 'allWonText' : 'wonText');
      $('result-stars').textContent = '★'.repeat(state.collected.length) + '☆'.repeat(3 - state.collected.length);
      $('result-details').textContent = t('result', { time: state.time.toFixed(1), hooks: state.hooks, stars: state.collected.length });
      $('primary-action').textContent = t(final ? 'select' : 'next'); $('secondary-action').textContent = t('replay');
      $('note-foot').textContent = t('best', { time: progress.times[state.level]?.toFixed(1) || state.time.toFixed(1) });
      primaryAction = final ? () => openDialog('levels') : () => load(state.level + 1, true); secondaryAction = () => load(state.level, true);
    }
  }
  function load(index, auto = false) {
    held.clear(); state = E.create(Math.min(index, progress.unlocked - 1)); scene.reset();
    resultShown = false; accumulator = 0; lastFrame = 0; toastKey = ''; $('scene-status').textContent = '';
    if (auto) E.start(state);
    headers(); showOverlay();
    if (auto) $('game').focus({ preventScroll: true });
  }
  function begin() { E.start(state); accumulator = 0; lastFrame = 0; showOverlay(); updateControls(); $('game').focus({ preventScroll: true }); }
  function pause() {
    if (state.status !== 'playing') return;
    clearInput(); E.pause(state); showOverlay(); updateControls(); $('primary-action').focus({ preventScroll: true });
  }
  function resume() {
    E.resume(state); accumulator = 0; lastFrame = 0; showOverlay(); updateControls(); $('game').focus({ preventScroll: true });
  }
  function press(source) {
    if ($('dialog').open) return;
    if (state.status === 'won') { load(state.level === 11 ? 0 : state.level + 1, true); }
    else if (state.status === 'lost') load(state.level, true);
    else if (state.status === 'ready') begin();
    else if (state.status === 'paused') resume();
    held.add(source); E.hold(state, true); updateControls();
  }
  function release(source) {
    if (!held.delete(source)) return;
    if (!held.size) E.hold(state, false);
    updateControls();
  }
  for (const element of [$('game'), $('hook')]) {
    element.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault(); element.focus({ preventScroll: true });
      element.setPointerCapture(event.pointerId); press('pointer-' + event.pointerId);
    });
    element.addEventListener('pointerup', event => release('pointer-' + event.pointerId));
    element.addEventListener('pointercancel', event => { release('pointer-' + event.pointerId); pause(); });
    element.addEventListener('lostpointercapture', event => release('pointer-' + event.pointerId));
    element.addEventListener('contextmenu', event => event.preventDefault());
  }
  // Native keyboard/assistive-technology activation still works on the hold button.
  $('hook').addEventListener('click', event => { if (event.detail === 0) { if (held.has('toggle')) release('toggle'); else press('toggle'); } });
  window.addEventListener('pointerup', event => release('pointer-' + event.pointerId));
  window.addEventListener('keydown', event => {
    if ($('dialog').open || event.ctrlKey || event.metaKey || event.altKey) return;
    const interactive = event.target.closest?.('button,a,input,select,textarea');
    const editing = event.target.closest?.('input,select,textarea,[contenteditable="true"]');
    if (event.code === 'Space' && (!interactive || event.target === $('hook') || event.target === $('game'))) {
      event.preventDefault(); if (!event.repeat) press('space');
    } else if (!editing && (event.code === 'KeyP' || event.code === 'Escape')) {
      event.preventDefault(); if (!event.repeat) state.status === 'paused' ? resume() : pause();
    } else if (!editing && event.code === 'KeyR' && !event.repeat) { event.preventDefault(); load(state.level, true); }
  });
  window.addEventListener('keyup', event => { if (event.code === 'Space') { release('space'); if (event.target === $('hook')) event.preventDefault(); } });
  $('primary-action').addEventListener('click', () => primaryAction?.());
  $('secondary-action').addEventListener('click', () => secondaryAction?.());
  $('pause').addEventListener('click', () => state.status === 'paused' ? resume() : pause());
  $('restart').addEventListener('click', () => load(state.level, true));
  $('sound').addEventListener('click', () => { soundEnabled = !soundEnabled; write(storageKey + '-sound', soundEnabled ? '1' : '0'); refreshSound(); if (soundEnabled) tone('hook'); });

  function renderLevels() {
    $('total-stars').textContent = t('totalStars', { count: progress.stars.reduce((a, b) => a + b, 0) });
    $('level-grid').replaceChildren();
    E.LEVELS.forEach((level, index) => {
      const button = document.createElement('button'), number = document.createElement('b'), stars = document.createElement('small');
      button.className = 'level-tile' + (state.level === index ? ' current' : '');
      button.disabled = index >= progress.unlocked;
      number.textContent = String(index + 1).padStart(2, '0');
      stars.textContent = button.disabled ? '—' : '★'.repeat(progress.stars[index]) + '☆'.repeat(3 - progress.stars[index]);
      button.setAttribute('aria-label', button.disabled ? `${index + 1} · ${t('locked')}` : t('levelLabel', { level: index + 1, name: t('level' + index), stars: progress.stars[index] }));
      if (index === state.level) button.setAttribute('aria-current', 'true');
      button.append(number, stars);
      button.addEventListener('click', () => { dialogWasPlaying = false; $('dialog').close(); load(index, false); });
      $('level-grid').append(button);
    });
  }
  function openDialog(kind) {
    dialogReturn = document.activeElement; dialogWasPlaying = state.status === 'playing';
    if (dialogWasPlaying) { clearInput(); E.pause(state); }
    dialogKind = kind; $('dialog-title').textContent = t(kind === 'help' ? 'help' : 'levels');
    $('help-content').hidden = kind !== 'help'; $('level-content').hidden = kind !== 'levels';
    if (kind === 'levels') renderLevels();
    $('dialog').showModal(); $('close-dialog').focus(); updateControls();
  }
  $('help').addEventListener('click', () => openDialog('help'));
  $('levels').addEventListener('click', () => openDialog('levels'));
  $('close-dialog').addEventListener('click', () => $('dialog').close());
  $('dialog').addEventListener('close', () => {
    if (dialogWasPlaying && !document.hidden) resume();
    else { showOverlay(); dialogReturn?.focus({ preventScroll: true }); }
    dialogWasPlaying = false; dialogKind = '';
  });
  window.addEventListener('blur', () => { clearInput(); if (!$('dialog').open) pause(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!$('dialog').open) pause(); else dialogWasPlaying = false;
      clearInput(); cancelAnimationFrame(frameId); frameId = 0; audio?.suspend().catch(() => {});
    } else { lastFrame = 0; accumulator = 0; if (!frameId) frameId = requestAnimationFrame(frame); }
  });
  window.addEventListener('pagehide', () => { clearInput(); cancelAnimationFrame(frameId); frameId = 0; audio?.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { if (!frameId && !document.hidden) { lastFrame = 0; frameId = requestAnimationFrame(frame); } });
  window.addEventListener('boopland:languagechange', () => {
    headers(); showOverlay();
    if (dialogKind) { $('dialog-title').textContent = t(dialogKind === 'help' ? 'help' : 'levels'); if (dialogKind === 'levels') renderLevels(); }
    if (toastKey) $('scene-status').textContent = t(toastKey);
  });
  new ResizeObserver(() => scene.resize()).observe($('stage'));
  function frame(now) {
    frameId = 0;
    if (document.hidden) return;
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0; lastFrame = now;
    if (state.status === 'playing') {
      accumulator += dt;
      while (accumulator >= E.STEP && state.status === 'playing') { E.step(state); accumulator -= E.STEP; }
    } else accumulator = 0;
    for (const event of state.events.splice(0)) {
      tone(event.type); scene.burst(event);
      toastKey = { hook: 'hooked', release: 'flying', bounce: 'bounce', star: 'star', won: 'complete', lost: '' }[event.type] || '';
      toastUntil = now + 1800; $('scene-status').textContent = toastKey ? t(toastKey) : '';
    }
    if (toastKey && now > toastUntil) { toastKey = ''; $('scene-status').textContent = ''; }
    if (['won', 'lost'].includes(state.status) && !resultShown) {
      resultShown = true; clearInput();
      if (state.status === 'won') { E.record(progress, state); write(storageKey, JSON.stringify(progress)); }
      showOverlay(); $('primary-action').focus({ preventScroll: true });
    }
    if (state.status !== 'paused') visualTime += dt;
    scene.draw(state, visualTime, state.status === 'paused' ? 0 : dt, t); hud();
    frameId = requestAnimationFrame(frame);
  }
  headers(); showOverlay(); frameId = requestAnimationFrame(frame);
})();
