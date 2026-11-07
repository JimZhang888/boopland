(function () {
  'use strict';
  const E = window.RopeGarden, i18n = window.BooplandI18n, $ = id => document.getElementById(id);
  const t = (key, values) => i18n.t('ropeGarden.' + key, values), storageKey = 'boopland-cut-the-rope-v1';
  let record, storageOK = true;
  try { record = E.cleanSave(JSON.parse(localStorage.getItem(storageKey) || 'null')); } catch { record = E.cleanSave(null); storageOK = false; }
  let state = E.create(record.current), started = false, manuallyPaused = false, pointer = null;
  let frame = 0, lastTime = 0, clock = 0, audioContext = null, dialogKind = '', activeSounds = [];
  const scene = new window.RopeGardenScene($('game')), dialog = $('dialog');
  // These labels depend on saved/runtime state, so keep DOMContentLoaded's
  // static translation pass from replacing them with their initial wording.
  $('save-note').removeAttribute('data-i18n');
  $('sound').removeAttribute('data-i18n-label');
  const starText = n => '★'.repeat(Math.max(0, n)) + '☆'.repeat(3 - Math.max(0, n));
  const totalStars = () => record.best.reduce((sum, stars) => sum + Math.max(0, stars), 0);
  function save() {
    record.current = state.index;
    try { localStorage.setItem(storageKey, JSON.stringify(record)); storageOK = true; } catch { storageOK = false; }
    $('save-note').textContent = t(storageOK ? 'saved' : 'unsaved');
  }
  function unlockSound() {
    if (!record.sound) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch { /* Audio is optional; all feedback is also visual. */ }
  }
  function quiet() {
    activeSounds.forEach(oscillator => { try { oscillator.stop(); } catch { /* Already stopped. */ } }); activeSounds = [];
  }
  function sound(type) {
    if (!record.sound || !audioContext || document.hidden || audioContext.state !== 'running') return;
    const notes = type === 'won' ? [523, 659, 784] : type === 'star' ? [660 + E.score(state) * 110] : type === 'lost' ? [180, 130] : type === 'pop' ? [820, 500] : [340];
    notes.forEach((frequency, index) => {
      const osc = audioContext.createOscillator(), gain = audioContext.createGain(), at = audioContext.currentTime + index * .085;
      osc.type = type === 'cut' ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.065, at + .012); gain.gain.exponentialRampToValueAtTime(.001, at + .18);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(at); osc.stop(at + .2); activeSounds.push(osc);
      osc.onended = () => { activeSounds = activeSounds.filter(item => item !== osc); osc.disconnect(); gain.disconnect(); };
    });
  }
  function levelName(index) { return t('level' + index); }
  function hint() {
    if (state.candy.bubble && state.ropes.every(r => r.cut)) return t('bubbleHint');
    if (!state.candy.bubble && state.ropes.every(r => r.cut)) return t('cutDone');
    return t('hint_' + state.level.hint);
  }
  function sync() {
    state.paused = manuallyPaused || dialog.open;
    document.title = t('pageTitle');
    $('level-name').textContent = levelName(state.index);
    $('page-number').textContent = String(state.index + 1).padStart(2, '0');
    $('page-total').textContent = String(state.index + 1).padStart(2, '0') + ' / 12';
    $('hint').textContent = hint();
    const stars = E.score(state);
    $('star-counter').setAttribute('aria-label', t('starsLabel', { n: stars }));
    [...$('star-counter').children].forEach((node, i) => { node.textContent = i < stars ? '★' : '☆'; node.classList.toggle('collected', i < stars); });
    $('best-stars').textContent = record.best[state.index] < 0 ? '—' : starText(record.best[state.index]);
    $('total-stars').textContent = totalStars() + ' / 36';
    $('sound').setAttribute('aria-label', t(record.sound ? 'soundOff' : 'soundOn')); $('sound').setAttribute('aria-pressed', String(record.sound)); $('mute').hidden = record.sound;
    $('save-note').textContent = t(storageOK ? 'saved' : 'unsaved');
    const playKey = !started ? 'start' : manuallyPaused ? 'resume' : 'pause';
    $('play-label').textContent = t(playKey); $('play-icon').textContent = !started || manuallyPaused ? '▷' : 'Ⅱ';
    $('play').disabled = state.status !== 'playing';
    $('pop-bubble').hidden = !state.level.bubble;
    $('pop-bubble').disabled = !state.candy.bubble || state.status !== 'playing' || manuallyPaused;
    for (const button of $('rope-buttons').children) { const id = Number(button.dataset.rope); button.disabled = state.ropes[id].cut || state.status !== 'playing' || manuallyPaused; button.setAttribute('aria-label', t('cutRope', { n: id + 1 })); }
    const result = state.status !== 'playing' || manuallyPaused;
    $('overlay').hidden = !result;
    if (result) {
      const win = state.status === 'won', loss = state.status === 'lost', complete = win && state.index === E.LEVELS.length - 1;
      $('result-title').textContent = t(complete ? 'complete' : win ? 'won' : loss ? 'lost' : 'paused');
      $('result-kicker').textContent = t(complete ? 'kickerComplete' : win ? 'kickerWin' : loss ? 'kickerLose' : 'kickerPause');
      $('result-message').textContent = t(complete ? 'completeNote' : win ? 'winNote' : loss ? 'loseNote' : 'pauseNote', { n: complete ? totalStars() : stars });
      $('result-stars').hidden = !win; $('result-stars').textContent = starText(stars);
      $('result-mark').textContent = win ? '✿' : loss ? '↻' : '☕';
      $('result-main').textContent = t(complete ? 'levels' : win ? 'next' : loss ? 'retry' : 'resume');
      $('result-retry').hidden = loss;
    }
    if (dialog.open) {
      $('dialog-title').textContent = t(dialogKind === 'help' ? 'help' : 'levels');
      if (dialogKind === 'levels') renderLevels();
    }
  }
  function consumeEvents() {
    if (!state.events.length) return;
    let ended = false;
    for (const event of state.events.splice(0)) {
      scene.burst(event); sound(event.type);
      if (event.type === 'won') {
        record.best[state.index] = Math.max(record.best[state.index], E.score(state));
        record = E.cleanSave(record); save(); ended = true;
      }
      if (event.type === 'lost') ended = true;
    }
    sync();
    if (ended) { releasePointer(); $('result-main').focus({ preventScroll: true }); }
  }
  function load(index) {
    if (index > record.unlocked || index < 0 || index >= E.LEVELS.length) return;
    releasePointer(); quiet(); state = E.create(index); scene.reset(); started = false; manuallyPaused = false; clock = 0; lastTime = 0;
    $('rope-buttons').replaceChildren(...state.ropes.map(rope => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = String(rope.id + 1); button.dataset.rope = String(rope.id);
      button.addEventListener('click', () => { if (beginInput()) { E.cut(state, rope.id); consumeEvents(); } }); return button;
    }));
    save(); sync(); scene.draw(state, 0, started, clock);
  }
  function beginInput() {
    if (state.status !== 'playing' || manuallyPaused || dialog.open) return false;
    unlockSound();
    if (!started) { started = true; lastTime = 0; }
    return true;
  }
  function togglePlay() {
    if (state.status !== 'playing' || dialog.open) return;
    unlockSound();
    if (!started) started = true;
    else manuallyPaused = !manuallyPaused;
    if (manuallyPaused) { releasePointer(); quiet(); }
    lastTime = 0; sync();
    if (manuallyPaused) $('result-main').focus({ preventScroll: true });
    else $('game').focus({ preventScroll: true });
  }
  function pauseForAway() {
    releasePointer(); quiet();
    if (started && state.status === 'playing') { manuallyPaused = true; sync(); }
    lastTime = 0;
  }
  function renderLevels() {
    const previous = document.activeElement?.dataset.level;
    $('level-grid').replaceChildren(...E.LEVELS.map((_, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'level-card'; button.dataset.level = String(index);
      button.classList.toggle('current', state.index === index); button.disabled = index > record.unlocked;
      if (state.index === index) button.setAttribute('aria-current', 'step');
      button.setAttribute('aria-label', t('levelLabel', { n: index + 1, name: levelName(index), stars: Math.max(0, record.best[index]) }) + (button.disabled ? ', ' + t('locked') : ''));
      const number = document.createElement('b'), name = document.createElement('span'), stars = document.createElement('small');
      number.textContent = String(index + 1).padStart(2, '0'); name.textContent = levelName(index); stars.textContent = button.disabled ? t('locked') : record.best[index] < 0 ? '○ ○ ○' : starText(record.best[index]);
      button.append(number, name, stars); button.addEventListener('click', () => { dialog.close(); load(index); $('play').focus({ preventScroll: true }); }); return button;
    }));
    if (previous !== undefined) $('level-grid').querySelector('[data-level="' + previous + '"]')?.focus({ preventScroll: true });
  }
  function openDialog(kind) {
    releasePointer(); quiet(); dialogKind = kind;
    $('help-content').hidden = kind !== 'help'; $('levels-content').hidden = kind !== 'levels';
    dialog.showModal(); sync(); $('close-dialog').focus({ preventScroll: true });
  }
  function releasePointer() {
    if (pointer && $('game').hasPointerCapture(pointer.id)) $('game').releasePointerCapture(pointer.id);
    pointer = null;
  }
  function popBubble() { if (beginInput()) { E.pop(state); consumeEvents(); sync(); } }
  $('game').addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !beginInput()) return;
    event.preventDefault(); const point = scene.point(event.clientX, event.clientY);
    if (state.candy.bubble && Math.hypot(point.x - state.candy.x, point.y - state.candy.y) <= 40) { E.pop(state); consumeEvents(); return; }
    pointer = { id: event.pointerId, point, start: point, moved: false };
    $('game').setPointerCapture(event.pointerId); scene.trail.push({ ...point, life: .22 }); sync();
  });
  $('game').addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId || state.paused || state.status !== 'playing') return;
    const point = scene.point(event.clientX, event.clientY);
    if (Math.hypot(point.x - pointer.start.x, point.y - pointer.start.y) > 4) pointer.moved = true;
    E.swipe(state, pointer.point, point, Math.min(15, 7 / scene.scale));
    pointer.point = point; scene.trail.push({ ...point, life: .22 }); consumeEvents();
  });
  $('game').addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const point = scene.point(event.clientX, event.clientY);
    if (!pointer.moved) E.swipe(state, point, point, Math.min(20, 10 / scene.scale));
    else E.swipe(state, pointer.point, point, Math.min(15, 7 / scene.scale));
    releasePointer(); consumeEvents();
  });
  $('game').addEventListener('pointercancel', releasePointer);
  $('game').addEventListener('lostpointercapture', () => { pointer = null; });
  $('play').addEventListener('click', togglePlay);
  $('restart').addEventListener('click', () => { unlockSound(); load(state.index); $('play').focus({ preventScroll: true }); });
  $('pop-bubble').addEventListener('click', popBubble);
  $('result-retry').addEventListener('click', () => { load(state.index); $('play').focus({ preventScroll: true }); });
  $('result-main').addEventListener('click', () => {
    if (state.status === 'won') { if (state.index === E.LEVELS.length - 1) openDialog('levels'); else { load(state.index + 1); $('play').focus({ preventScroll: true }); } }
    else if (state.status === 'lost') { load(state.index); $('play').focus({ preventScroll: true }); }
    else togglePlay();
  });
  $('sound').addEventListener('click', () => { record.sound = !record.sound; if (record.sound) { unlockSound(); sound('star'); } else quiet(); save(); sync(); });
  $('help').addEventListener('click', () => openDialog('help'));
  $('levels').addEventListener('click', () => openDialog('levels'));
  $('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { lastTime = 0; sync(); });
  document.addEventListener('keydown', event => {
    if (dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === ' ' && event.target.closest('button,a')) return;
    if (['1', '2', '3', 'b', 'r', 'p', ' ', 'escape'].includes(key)) event.preventDefault();
    if (/^[1-3]$/.test(key) && beginInput()) { E.cut(state, Number(key) - 1); consumeEvents(); sync(); }
    if (key === 'b') popBubble();
    if (key === 'r') { load(state.index); $('play').focus({ preventScroll: true }); }
    if (key === ' ' || key === 'p') togglePlay();
    if (key === 'escape' && started && !manuallyPaused && state.status === 'playing') togglePlay();
  });
  function resize() { const rect = $('stage').getBoundingClientRect(); scene.resize(rect.width, rect.height); scene.draw(state, 0, started, clock); }
  new ResizeObserver(resize).observe($('stage'));
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('boopland:languagechange', () => { sync(); resize(); });
  function animate(now) {
    frame = 0; if (document.hidden) return;
    const dt = lastTime ? Math.min(.05, (now - lastTime) / 1000) : 0; lastTime = now;
    if (started && !state.paused && !dialog.open) { E.advance(state, dt); consumeEvents(); }
    if (!state.paused) clock += dt;
    scene.draw(state, state.paused ? 0 : dt, started, clock);
    frame = requestAnimationFrame(animate);
  }
  function schedule() { if (!frame && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(animate); } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseForAway(); cancelAnimationFrame(frame); frame = 0; } else schedule(); });
  window.addEventListener('blur', pauseForAway);
  window.addEventListener('pagehide', () => { pauseForAway(); save(); cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow', schedule);
  load(record.current); resize(); schedule();
})();
