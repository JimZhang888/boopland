(() => {
  'use strict';
  const $ = id => document.getElementById(id), i18n = BooplandI18n;
  const t = (key, values) => i18n.t(`miner.${key}`, values);
  const game = new GoldMiner.Game(), scene = new MinerScene($('canvas'));
  const number = value => value.toLocaleString(i18n.language);
  let best = 0, sound = false, audio = null, raf = 0, lastTime = 0, lastHud = 0;
  let overlayKey = '', statusKey = '', recent = null, recentUntil = 0, helpWasPaused = false;
  try { const record = Number(localStorage.getItem('boopland-gold-miner-best')); best = Number.isSafeInteger(record) && record >= 0 && record <= 100000000 ? record : 0; sound = localStorage.getItem('boopland-gold-miner-sound') === 'on'; } catch { /* Storage is optional, including for local files. */ }
  function saveBest() {
    if (game.total <= best) return;
    best = game.total;
    try { localStorage.setItem('boopland-gold-miner-best', String(best)); } catch { /* Continue in memory. */ }
  }
  function soundReady() {
    if (!sound) return;
    try { if (!audio) { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) audio = new Audio(); } if (audio?.state === 'suspended') audio.resume().catch(() => {}); } catch { /* Sound support is optional. */ }
  }
  function tone(kind) {
    if (!sound || !audio || audio.state !== 'running') return;
    const notes = { fire: [210], grab: [330], collect: [520, 660], blast: [95, 65], win: [440, 550, 660], lose: [240, 180] }[kind];
    if (!notes) return;
    try {
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + index * .085;
        oscillator.type = kind === 'blast' ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.045, at + .015); gain.gain.exponentialRampToValueAtTime(.001, at + .14);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + .16);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* A closed audio device must not affect play. */ }
  }
  const oreName = kind => t(['small', 'medium', 'large'].includes(kind) ? 'gold' : kind);
  function events() {
    for (const event of game.drainEvents()) {
      scene.effect(event); tone(event.type);
      if (event.type === 'collect' || event.type === 'blast') { recent = event; recentUntil = performance.now() + 1800; }
      if (event.type === 'collect') saveBest();
    }
  }
  function setText(id, value) { const node = $(id); if (node.textContent !== String(value)) node.textContent = value; }
  function updateStatus() {
    let key, values = {};
    if (game.paused) key = 'pausedNote';
    else if (game.phase !== 'playing') key = 'aim';
    else if (game.hook.cargo) { key = 'hauling'; values = { ore: oreName(game.hook.cargo.kind), value: number(game.hook.cargo.value) }; }
    else if (game.hook.mode === 'extend') key = 'extending';
    else if (recent && performance.now() < recentUntil) { key = recent.type === 'blast' ? 'blasted' : 'collected'; values = { ore: oreName(recent.kind), value: number(recent.value || 0) }; }
    else key = game.hook.mode === 'retract' ? 'returning' : 'aim';
    const text = t(key, values);
    if (text !== statusKey) { statusKey = text; $('status').textContent = text; }
  }
  function updateOverlay(force = false) {
    const phase = game.paused && game.phase === 'playing' ? 'paused' : game.phase;
    const key = [phase, game.level, game.wallet, game.bombs, game.power, game.extraTime, i18n.language].join(':');
    if (key === overlayKey && !force) return;
    const wasHidden = $('overlay').hidden; overlayKey = key;
    $('overlay').hidden = phase === 'playing';
    if (phase === 'playing') return;
    $('overlay').classList.toggle('is-shop', phase === 'shop');
    $('shop').hidden = phase !== 'shop'; $('restart').hidden = phase !== 'lost';
    $('result-values').hidden = phase !== 'won';
    let eyebrow, title, note, action;
    if (phase === 'ready') { eyebrow = t('readyEyebrow'); title = t('readyTitle'); note = t('readyNote', { target: number(game.target), seconds: Math.ceil(game.remaining) }); action = t('start'); }
    if (phase === 'paused') { eyebrow = t('pausedEyebrow'); title = t('pausedTitle'); note = t('pausedNote'); action = t('resume'); }
    if (phase === 'shop') {
      eyebrow = t('wonEyebrow', { level: game.level + 1 }); title = t('roundTitle'); note = t('roundNote', { score: number(game.score) }); action = t('next', { level: game.level + 2 });
      setText('wallet', t('wallet', { value: number(game.wallet) }));
      for (const kind of ['bomb', 'power', 'time']) {
        const capped = kind === 'power' && game.power >= 3 || kind === 'bomb' && game.bombs >= 9;
        const bought = kind === 'time' && game.extraTime;
        setText(`${kind}-price`, capped ? t('max') : bought ? t('bought') : number(game.price(kind)));
        $(`buy-${kind}`).disabled = !game.canBuy(kind);
        $(`buy-${kind}`).setAttribute('aria-label', capped ? `${t(`${kind}Name`)} · ${t('max')}` : bought ? `${t(`${kind}Name`)} · ${t('bought')}` : t('buy', { item: t(`${kind}Name`), price: number(game.price(kind)) }));
      }
    }
    if (phase === 'lost') { eyebrow = t('wonEyebrow', { level: game.level + 1 }); title = t('lostTitle'); note = t(game.reason === 'empty' ? 'lostEmpty' : 'lostTime', { score: number(game.score), target: number(game.target) }); action = t('retry'); }
    if (phase === 'won') {
      eyebrow = t('completeEyebrow'); title = t('completeTitle'); note = t('completeNote', { total: number(game.total) }); action = t('again');
      $('result-values').replaceChildren(...['total', 'best'].map(label => { const item = document.createElement('div'), small = document.createElement('small'); item.textContent = number(label === 'total' ? game.total : best); small.textContent = t(label); item.append(small); return item; }));
    }
    setText('overlay-eyebrow', eyebrow); setText('overlay-title', title); setText('overlay-note', note); setText('primary', action);
    setText('overlay-stamp', phase === 'won' ? '✳' : phase === 'paused' ? 'Ⅱ' : phase === 'lost' ? '↻' : '✧');
    // Put keyboard users on the next useful control when a round ends.
    if (wasHidden && !document.hidden && !$('help-dialog').open) $('primary').focus({ preventScroll: true });
  }
  function update(force = false) {
    setText('level', String(game.level + 1).padStart(2, '0')); setText('score', number(game.score)); setText('target', number(game.target));
    setText('time', Math.ceil(game.remaining)); setText('total', number(game.total)); setText('best', number(best));
    setText('bomb-count', game.bombs); setText('power-level', [0, 1, 2].map(n => n < game.power ? '●' : '○').join(' '));
    setText('mine-name', t(`level${game.level + 1}`));
    $('progress-fill').style.width = `${Math.min(100, game.score / game.target * 100)}%`;
    $('progress').setAttribute('aria-valuenow', Math.min(game.score, game.target)); $('progress').setAttribute('aria-valuemax', game.target);
    $('time').parentElement.parentElement.classList.toggle('urgent', game.remaining <= 10);
    $('fire').disabled = game.phase !== 'playing' || game.paused || game.hook.mode !== 'swing'; $('bomb').disabled = !game.canBomb;
    $('pause').disabled = game.phase !== 'playing'; $('pause').setAttribute('aria-pressed', String(game.paused)); $('pause').setAttribute('aria-label', t(game.paused ? 'resume' : 'pause'));
    $('pause-mark').setAttribute('d', game.paused ? 'm8 5 10 7-10 7Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound-mark').setAttribute('d', sound ? 'M16 8q4 4 0 8m3-11q7 7 0 14' : 'm16 9 5 6m0-6-5 6');
    updateStatus(); updateOverlay(force);
  }
  function stopLoop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
  function startLoop() { if (!raf && !document.hidden && game.phase === 'playing' && !game.paused) { lastTime = 0; raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0; const dt = lastTime ? Math.min(.1, (now - lastTime) / 1000) : 0; lastTime = now;
    game.update(dt); events(); scene.draw(game, dt);
    if (now - lastHud > 80 || game.phase !== 'playing') { update(); lastHud = now; }
    if (!document.hidden && game.phase === 'playing' && !game.paused) raf = requestAnimationFrame(frame);
  }
  function pause(value) {
    if (game.phase !== 'playing') return;
    game.paused = value; stopLoop();
    if (value) { if (audio?.state === 'running') audio.suspend().catch(() => {}); }
    else { soundReady(); startLoop(); }
    update(); scene.draw(game);
  }
  function fire() { if ($('help-dialog').open) return; soundReady(); if (game.fire()) { events(); update(); scene.draw(game); } }
  function blast() { if ($('help-dialog').open) return; soundReady(); if (game.bomb()) { events(); update(); scene.draw(game); } }
  function primary() {
    soundReady();
    if (game.paused && game.phase === 'playing') { pause(false); return; }
    if (game.phase === 'ready') game.start();
    else if (game.phase === 'shop') game.next();
    else if (game.phase === 'lost') game.retry();
    else if (game.phase === 'won') { game.reset(); game.start(); }
    scene.clearEffects(); recent = null; update(); scene.draw(game); startLoop();
    if (game.phase === 'playing') $('fire').focus({ preventScroll: true });
  }
  $('primary').addEventListener('click', primary);
  $('fire').addEventListener('click', fire); $('canvas').addEventListener('click', fire); $('bomb').addEventListener('click', blast);
  $('pause').addEventListener('click', () => pause(!game.paused));
  $('restart').addEventListener('click', () => { game.reset(); recent = null; scene.clearEffects(); update(); scene.draw(game); $('primary').focus({ preventScroll: true }); });
  for (const kind of ['bomb', 'power', 'time']) $(`buy-${kind}`).addEventListener('click', () => { soundReady(); if (game.buy(kind)) { tone('collect'); update(); if ($(`buy-${kind}`).disabled) $('primary').focus({ preventScroll: true }); } });
  $('sound').addEventListener('click', () => {
    sound = !sound; if (sound) { soundReady(); tone('grab'); } else if (audio) audio.suspend().catch(() => {});
    try { localStorage.setItem('boopland-gold-miner-sound', sound ? 'on' : 'off'); } catch { /* Optional setting. */ } update();
  });
  $('help').addEventListener('click', () => { helpWasPaused = game.paused; if (game.phase === 'playing') pause(true); $('help-dialog').showModal(); });
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  $('help-dialog').addEventListener('close', () => { if (game.phase === 'playing') pause(helpWasPaused || document.hidden); });
  document.addEventListener('keydown', event => {
    if ($('help-dialog').open || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.code === 'Space' && event.target.closest('button,a') && event.target !== $('fire')) return;
    if (['Space', 'ArrowDown', 'ArrowUp', 'KeyB', 'KeyP', 'Escape'].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'ArrowDown') { if (game.phase === 'ready') primary(); else if (game.phase === 'playing' && !game.paused) fire(); }
    if (event.code === 'ArrowUp' || event.code === 'KeyB') blast();
    if (event.code === 'KeyP' || event.code === 'Escape') pause(!game.paused);
  });
  function leave() { if ($('help-dialog').open) helpWasPaused = true; if (game.phase === 'playing') pause(true); stopLoop(); if (audio?.state === 'running') audio.suspend().catch(() => {}); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  window.addEventListener('blur', leave); window.addEventListener('pagehide', leave);
  window.addEventListener('pageshow', () => { scene.resize(); scene.draw(game); update(); });
  window.addEventListener('boopland:languagechange', () => { overlayKey = ''; update(true); });
  new ResizeObserver(() => { scene.resize(); scene.draw(game); }).observe($('mine'));
  scene.resize(); update(); scene.draw(game);
})();
