(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('slacker.' + key, values);
  const game = new OfficeSlacker.Game();
  const shell = document.querySelector('.game-shell');
  const stage = $('stage'), action = $('action'), overlay = $('overlay'), dialog = $('help-dialog');
  const saveKey = 'boopland-office-slacker-v1';
  let best = 0, storageOK = true, newBest = false;
  let frame = 0, lastTime = 0, pointer = null, spaceDown = false;
  let reactionKey = '', reactionUntil = 0, lastVariant = -1;
  let sound = false, audio = null;
  try { best = OfficeSlacker.cleanBest(JSON.parse(localStorage.getItem(saveKey))); }
  catch { storageOK = false; }
  function text(id, value) { const node = $(id); if (node.textContent !== String(value)) node.textContent = value; }
  function beep(type) {
    if (!sound || document.hidden || game.paused || dialog.open) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const notes = { start:[440,660], approach:[260,330], turn:[330,260,330], watch:[220], fake:[440,520], caught:[180,130], dodge:[660], finished:[440,550,660], fired:[240,180,120], toggle:[520] }[type];
      if (!notes) return;
      notes.forEach((frequency, i) => {
        const osc = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + i * .1;
        osc.type = 'sine'; osc.frequency.value = frequency; gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(.065, at + .012); gain.gain.exponentialRampToValueAtTime(.001, at + .13);
        osc.connect(gain); gain.connect(audio.destination); osc.start(at); osc.stop(at + .15);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch { sound = false; }
  }
  function stopSound() { if (audio?.state === 'running') audio.suspend().catch(() => {}); }
  function release() {
    game.hold(false); spaceDown = false;
    if (pointer !== null) {
      const old = pointer; pointer = null;
      if (action.hasPointerCapture?.(old)) action.releasePointerCapture(old);
    }
  }
  function react(key, duration = 1600) { reactionKey = key; reactionUntil = game.elapsed + duration; }
  function saveResult() {
    newBest = Math.floor(game.score) > best;
    if (newBest) {
      best = Math.floor(game.score);
      try { localStorage.setItem(saveKey, JSON.stringify(best)); }
      catch { storageOK = false; }
    }
  }
  function start() {
    release(); game.start(); newBest = false; reactionKey = ''; lastVariant = -1;
    beep('start'); render(); run();
  }
  function pause(value) {
    if (game.state !== 'playing') return;
    release(); game.pause(value); stopSound(); render();
    if (value) stopLoop(); else run();
  }
  function render() {
    const playing = game.state === 'playing', ended = ['finished', 'fired'].includes(game.state);
    const variant = Math.floor(game.slackTime / 3000) % 3;
    const activity = game.caughtFor > 0 ? 'caught' : game.slacking ? 'slack' : 'work';
    shell.dataset.state = game.state; shell.dataset.paused = String(game.paused || dialog.open || document.hidden);
    stage.dataset.phase = game.phase; stage.dataset.activity = activity; stage.dataset.variant = variant;
    text('score', Math.floor(game.score)); text('goal-score', Math.floor(game.score));
    text('combo', '×' + game.multiplier); text('best', best);
    const seconds = Math.ceil(game.remaining / 1000);
    text('timer', String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'));
    document.querySelector('.timer-stat').classList.toggle('urgent', seconds <= 10);
    $('strikes').setAttribute('aria-label', t('strikeLabel', { count: game.strikes }));
    [...$('strikes').children].forEach((node, index) => node.classList.toggle('used', index < game.strikes));
    const risk = Math.round(game.suspicion);
    $('risk').setAttribute('aria-valuenow', risk); $('risk-fill').style.width = risk + '%';
    $('risk-fill').style.background = risk > 65 ? 'var(--red)' : risk > 25 ? 'var(--amber)' : '#b9c7a4';
    text('risk-value', risk + '%'); $('goal-fill').style.width = Math.min(100, game.score / OfficeSlacker.TARGET * 100) + '%';
    $('clock-hand').setAttribute('d', `M0 0v17M0 0l${Math.sin(game.elapsed / OfficeSlacker.SHIFT * Math.PI * 2) * 23} ${-Math.cos(game.elapsed / OfficeSlacker.SHIFT * Math.PI * 2) * 23}`);
    const statusKey = game.caughtFor > 0 ? 'caughtStatus' : game.state === 'ready' ? 'readyStatus' : game.phase + 'Status';
    text('status', t(statusKey));
    text('caption', t(game.state === 'ready' ? 'readyCaption' : activity === 'caught' ? 'caughtCaption' : activity === 'slack' ? 'slack' + variant : 'workCaption'));
    const showReaction = !!reactionKey && game.elapsed < reactionUntil && !ended;
    $('reaction').hidden = !showReaction;
    $('reaction').classList.toggle('show', showReaction);
    if (reactionKey) text('reaction', t(reactionKey));
    text('storage-note', t(storageOK ? 'saved' : 'memoryOnly'));
    action.classList.toggle('is-held', game.slacking);
    if (playing) action.setAttribute('aria-pressed', String(game.slacking)); else action.removeAttribute('aria-pressed');
    action.disabled = game.paused || (playing && game.caughtFor > 0);
    text('action-label', t(ended ? 'again' : game.paused ? 'pausedButton' : game.caughtFor > 0 ? 'caughtButton' : playing ? game.slacking ? 'slacking' : 'hold' : 'start'));
    text('action-hint', t(game.slacking ? 'releaseHint' : playing ? 'holdHint' : 'roundLength'));
    $('pause').disabled = !playing;
    $('pause').setAttribute('aria-label', t(game.paused ? 'resume' : 'pause'));
    $('pause').querySelector('path').setAttribute('d', game.paused ? 'm8 5 11 7-11 7Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    overlay.hidden = !ended && !game.paused;
    $('result-stats').hidden = !ended;
    if (ended || game.paused) {
      const good = game.state === 'finished' && game.score >= OfficeSlacker.TARGET;
      text('overlay-kicker', t(game.paused ? 'pauseKicker' : newBest ? 'newBest' : 'endKicker'));
      text('overlay-title', t(game.paused ? 'pausedTitle' : game.state === 'fired' ? 'loseTitle' : good ? 'winTitle' : 'doneTitle'));
      text('overlay-note', t(game.paused ? 'pausedNote' : game.state === 'fired' ? 'loseNote' : good ? 'winNote' : 'doneNote'));
      text('overlay-action', t(game.paused ? 'resume' : 'again'));
      text('result-stamp', game.paused ? 'Ⅱ' : game.state === 'fired' ? '!' : '✓');
      text('result-score', Math.floor(game.score)); text('result-dodges', game.dodges);
    }
  }
  function tick(now) {
    frame = 0;
    if (document.hidden || game.paused || dialog.open || game.state !== 'playing') return;
    const events = game.tick(lastTime ? now - lastTime : 0); lastTime = now;
    for (const event of events) {
      beep(event);
      if (event === 'caught') { release(); react('caughtCaption', 1400); }
      if (event === 'fake') react('fakeCaption', 1700);
      if (event === 'turn') react('turnCaption', 1500);
      if (event === 'dodge' && game.caughtFor <= 0) react('dodgeCaption', 1100);
      if (event === 'finished' || event === 'fired') { release(); saveResult(); }
    }
    const variant = Math.floor(game.slackTime / 3000) % 3;
    if (game.slacking && variant !== lastVariant && !events.includes('caught')) {
      if (game.elapsed >= reactionUntil) react('slack' + variant, 1700);
      lastVariant = variant;
    }
    render();
    if (game.state === 'playing') frame = requestAnimationFrame(tick);
  }
  function stopLoop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function run() { if (!frame && !document.hidden && !game.paused && !dialog.open && game.state === 'playing') { lastTime = 0; frame = requestAnimationFrame(tick); } }
  action.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer !== null || game.state !== 'playing' || game.paused || game.caughtFor > 0) return;
    pointer = event.pointerId; action.setPointerCapture(pointer); game.hold(true); render();
  });
  action.addEventListener('pointerup', event => { if (event.pointerId === pointer) { release(); render(); } });
  action.addEventListener('pointercancel', () => { release(); render(); });
  action.addEventListener('lostpointercapture', () => { if (pointer !== null) { release(); render(); } });
  action.addEventListener('contextmenu', event => event.preventDefault());
  action.addEventListener('click', () => { if (game.state !== 'playing') start(); });
  $('pause').addEventListener('click', () => pause(!game.paused));
  $('overlay-action').addEventListener('click', () => { if (game.paused) pause(false); else start(); action.focus({ preventScroll: true }); });
  $('sound').addEventListener('click', () => { sound = !sound; if (sound) beep('toggle'); else stopSound(); render(); });
  $('help').addEventListener('click', () => { if (game.state === 'playing') pause(true); release(); dialog.showModal(); stopSound(); render(); });
  function closeHelp() { dialog.close(); }
  $('close-help').addEventListener('click', closeHelp); $('help-done').addEventListener('click', closeHelp);
  dialog.addEventListener('close', () => { render(); run(); });
  document.addEventListener('keydown', event => {
    if (dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'Space') {
      if (event.target.closest('button, a, input, select, textarea') && event.target !== action) return;
      event.preventDefault(); if (event.repeat || spaceDown) return; spaceDown = true;
      if (game.state !== 'playing') start(); else if (!game.paused) { game.hold(true); render(); }
    }
    if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat && game.state === 'playing') { event.preventDefault(); pause(!game.paused); }
  });
  document.addEventListener('keyup', event => { if (event.code === 'Space') { spaceDown = false; game.hold(pointer !== null); render(); } });
  window.addEventListener('blur', () => { release(); if (game.state === 'playing') pause(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { release(); pause(true); stopLoop(); stopSound(); } render(); });
  window.addEventListener('pagehide', () => { release(); pause(true); stopLoop(); stopSound(); });
  window.addEventListener('pageshow', () => { render(); run(); });
  window.addEventListener('boopland:languagechange', () => { document.title = t('pageTitle'); render(); });
  document.title = t('pageTitle'); render();
})();
