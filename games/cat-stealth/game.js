(() => {
  'use strict';
  const E = CatStealth, $ = id => document.getElementById(id), t = (key, values) => BooplandI18n.t(`catStealth.${key}`, values);
  const canvas = $('board'), dialog = $('dialog'), storageKey = 'boopland-cat-stealth-v1';
  let save;
  try { save = E.cleanSave(JSON.parse(localStorage.getItem(storageKey))); } catch { save = E.cleanSave(null); }
  let s = E.create(save.unlocked), aim = false, routes = true, sound = false, audio = null, frame = 0, last = 0;
  let dialogKind = 'ready', helpFrom = 'ready', messageKey = 'ready', messageUntil = 0, canSave = true;
  const keys = new Set(), pointers = new Map(), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const time = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  const setText = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
  function draw() { CatStealthArt.paint(canvas, s, { routes, aim, reduced: reduced.matches, t }); }
  function resize() {
    const wrap = $('board-wrap'), scale = Math.max(.01, Math.min(wrap.clientWidth / E.WIDTH, wrap.clientHeight / E.HEIGHT));
    const width = Math.floor(E.WIDTH * scale), height = Math.floor(E.HEIGHT * scale), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); draw();
  }
  function beep(kind) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const tones = kind === 'fish' ? [660, 880] : kind === 'won' ? [523, 659, 784] : kind === 'caught' ? [220, 164] : kind === 'thrown' ? [310, 210] : [420];
      tones.forEach((hz, i) => {
        const osc = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + i * .09;
        osc.type = 'sine'; osc.frequency.value = hz; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.07, at + .008); gain.gain.exponentialRampToValueAtTime(.001, at + .13);
        osc.connect(gain); gain.connect(audio.destination); osc.start(at); osc.stop(at + .15);
      });
    } catch { sound = false; update(); }
  }
  function note(key, duration = 3) { messageKey = key; messageUntil = s.time + duration; }
  function clearInput() { keys.clear(); pointers.clear(); }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; clearInput(); }
  function update() {
    setText('chapter', t('chapter', { n: s.index + 1 })); setText('level-name', t(s.level.name));
    const count = s.fish.filter(f => f.taken).length, risk = Math.round(Math.max(...s.guards.map(g => g.suspicion)) * 100);
    setText('fish-count', `${count} / ${s.fish.length}`); setText('risk-value', `${risk}%`); setText('clock', time(s.time));
    $('risk').setAttribute('aria-valuenow', risk); $('risk-fill').style.width = `${risk}%`; $('risk-fill').style.background = risk > 45 ? 'var(--danger)' : 'var(--ochre)';
    const children = $('fish-track').children;
    if (children.length !== s.fish.length) { $('fish-track').replaceChildren(...s.fish.map(() => document.createElement('span'))); }
    [...$('fish-track').children].forEach((node, i) => node.classList.toggle('taken', i < count));
    const status = aim ? 'aiming' : risk > 25 && s.player.hidden < 0 ? 'spotted' : messageUntil > s.time ? messageKey : s.player.hidden >= 0 ? 'hidden' : count === s.fish.length ? 'return' : s.status === 'ready' ? 'ready' : 'safe';
    setText('status', t(status)); $('status-dot').classList.toggle('danger', risk > 25);
    setText('hide-label', t(s.player.hidden >= 0 ? 'emerge' : 'hide')); $('hide').classList.toggle('ready', E.nearbyBox(s) >= 0);
    $('hide').disabled = s.status !== 'playing';
    setText('noise-label', t(aim ? 'cancelAim' : 'noise')); setText('charges', s.cooldown > 0 ? Math.ceil(s.cooldown) + 's' : String(s.charges));
    $('noise').disabled = s.status !== 'playing' || s.charges === 0 || s.cooldown > 0; $('noise').setAttribute('aria-pressed', String(aim));
    $('pause').textContent = s.status === 'playing' ? 'Ⅱ' : '▷'; $('pause').setAttribute('aria-label', t(s.status === 'ready' ? 'start' : s.status === 'playing' ? 'pause' : 'resume'));
    $('sound').setAttribute('aria-label', t(sound ? 'soundOn' : 'soundOff')); $('sound').setAttribute('aria-pressed', String(sound)); $('sound').style.opacity = sound ? '1' : '.55';
    setText('best', save.times[s.index] ? `${'★'.repeat(save.stars[s.index])} ${time(save.times[s.index])}` : '—');
  }
  function chapters() {
    $('chapters').replaceChildren(...E.LEVELS.map((level, i) => {
      const button = document.createElement('button'), number = document.createElement('span'), stars = document.createElement('small');
      button.type = 'button'; button.disabled = i > save.unlocked; button.classList.toggle('current', i === s.index);
      button.setAttribute('aria-label', `${t('chapter', { n: i + 1 })}: ${t(level.name)}${i > save.unlocked ? ' · ' + t('locked') : ''}`);
      number.textContent = String(i + 1).padStart(2, '0'); stars.textContent = '★'.repeat(save.stars[i]) + '☆'.repeat(3 - save.stars[i]);
      button.append(number, stars); button.addEventListener('click', () => load(i)); return button;
    }));
  }
  function instructions() {
    const list = document.createElement('ol'); list.className = 'help-list';
    for (const key of ['helpMove', 'helpHide', 'helpNoise']) { const li = document.createElement('li'); li.textContent = t(key); list.append(li); }
    return list;
  }
  function renderDialog() {
    const kind = dialogKind, done = kind === 'won', failed = kind === 'caught';
    setText('dialog-kicker', t(kind === 'help' ? 'help' : 'chapter', { n: s.index + 1 }));
    setText('dialog-title', t(done ? 'won' : failed ? 'caught' : kind === 'paused' ? 'paused' : kind === 'help' ? 'help' : 'intro'));
    setText('dialog-note', t(done ? s.index === 2 ? 'completed' : 'wonNote' : failed ? 'caughtNote' : kind === 'paused' ? 'pauseNote' : 'objective'));
    setText('dialog-mark', done ? '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars) : failed ? '…' : kind === 'paused' ? '☾' : '✧');
    $('dialog-body').replaceChildren(); $('dialog-secondary').hidden = true;
    if (kind === 'ready' || kind === 'help') $('dialog-body').append(instructions());
    if (kind === 'paused') {
      const levels = $('chapters').cloneNode(true); levels.removeAttribute('id'); levels.classList.add('dialog-levels');
      [...levels.children].forEach((button, i) => button.addEventListener('click', () => load(i)));
      $('dialog-body').append(levels); $('dialog-secondary').hidden = false; setText('dialog-secondary', t('restart'));
    }
    if (done || failed) {
      const stats = document.createElement('div'); stats.className = 'result-stats';
      for (const [label, value] of [['time', time(s.time)], ['loot', `${s.fish.filter(f => f.taken).length} / ${s.fish.length}`], ['alerts', s.alerts]]) {
        const item = document.createElement('div'), strong = document.createElement('strong'); strong.textContent = value; item.append(strong, document.createTextNode(t(label))); stats.append(item);
      }
      $('dialog-body').append(stats);
      const stars = document.createElement('p'); stars.className = 'star-rules'; stars.textContent = t('stars', { seconds: s.level.par }); $('dialog-body').append(stars);
      if (done) {
        const saved = document.createElement('p'); saved.className = 'star-rules'; saved.textContent = t(canSave ? 'saved' : 'noSave'); $('dialog-body').append(saved);
        $('dialog-secondary').hidden = false; setText('dialog-secondary', t('restart'));
      }
    }
    const action = done ? s.index < 2 ? 'next' : 'restart' : failed ? 'restart' : kind === 'paused' ? 'resume' : kind === 'help' ? 'close' : 'start';
    setText('dialog-action', t(action));
  }
  function show(kind) {
    stop(); aim = false; dialogKind = kind; renderDialog(); update(); draw();
    if (!dialog.open) dialog.showModal();
    $('dialog-action').focus();
  }
  function dismiss() {
    if (dialog.open) dialog.close();
    update(); draw(); $('pause').focus();
  }
  function start() {
    if (dialog.open) dialog.close();
    s.status = 'playing'; note(s.fish.every(f => f.taken) ? 'return' : 'safe'); clearInput(); update();
    if (!frame) frame = requestAnimationFrame(loop);
  }
  function pause() {
    if (s.status !== 'playing') return;
    s.status = 'paused'; audio?.suspend().catch(() => {}); show('paused');
  }
  function load(index) { stop(); s = E.create(index); aim = false; note('ready'); chapters(); show('ready'); }
  function storeWin() {
    save.stars[s.index] = Math.max(save.stars[s.index], s.stars);
    save.times[s.index] = Math.min(save.times[s.index] || Infinity, s.time);
    save = E.cleanSave(save);
    try { localStorage.setItem(storageKey, JSON.stringify(save)); canSave = true; } catch { canSave = false; }
    chapters();
  }
  function events() {
    for (const key of s.events.splice(0)) {
      note(key); if (['fish', 'thrown', 'hidden', 'caught', 'won'].includes(key)) beep(key);
      if (key === 'fish' && s.fish.every(f => f.taken)) note('return', 6);
      if (key === 'won') { storeWin(); show('won'); }
      if (key === 'caught') show('caught');
    }
  }
  function loop(now) {
    frame = 0;
    if (s.status !== 'playing') return;
    const dt = last ? (now - last) / 1000 : 0; last = now;
    const pressed = new Set([...keys, ...pointers.values()]);
    E.step(s, dt, { x: Number(pressed.has('right')) - Number(pressed.has('left')), y: Number(pressed.has('down')) - Number(pressed.has('up')) });
    events(); update(); draw();
    if (s.status === 'playing') frame = requestAnimationFrame(loop);
  }
  function toggleAim() { if (s.status === 'playing' && s.charges > 0 && s.cooldown <= 0) { aim = !aim; update(); draw(); } }
  $('hide').addEventListener('click', () => { E.hide(s); aim = false; events(); update(); draw(); });
  $('noise').addEventListener('click', toggleAim);
  $('routes').addEventListener('click', () => { routes = !routes; $('routes').setAttribute('aria-pressed', String(routes)); draw(); });
  $('pause').addEventListener('click', () => { if (s.status === 'playing') pause(); else if (['ready', 'paused'].includes(s.status)) start(); else show(s.status); });
  $('restart').addEventListener('click', () => load(s.index));
  $('help').addEventListener('click', () => { helpFrom = s.status; if (s.status === 'playing') s.status = 'paused'; audio?.suspend().catch(() => {}); show('help'); });
  $('sound').addEventListener('click', () => { sound = !sound; if (sound) beep('fish'); else audio?.suspend().catch(() => {}); update(); });
  function closeDialog() {
    if (dialogKind === 'help' && helpFrom === 'playing') { show('paused'); return; }
    if (dialogKind === 'help' && ['caught', 'won'].includes(helpFrom)) { show(helpFrom); return; }
    dismiss();
  }
  $('close-dialog').addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  $('dialog-action').addEventListener('click', () => {
    if (dialogKind === 'help') closeDialog();
    else if (dialogKind === 'won' && s.index < E.LEVELS.length - 1) load(s.index + 1);
    else if (dialogKind === 'won' || dialogKind === 'caught') { load(s.index); start(); }
    else start();
  });
  $('dialog-secondary').addEventListener('click', () => { load(s.index); start(); });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || dialog.open) return;
    if (s.status === 'ready') start();
    if (s.status !== 'playing') return;
    event.preventDefault(); canvas.focus({ preventScroll: true });
    const r = canvas.getBoundingClientRect(), target = { x: (event.clientX - r.left) * E.WIDTH / r.width, y: (event.clientY - r.top) * E.HEIGHT / r.height };
    if (aim) { if (E.throwNoise(s, target)) aim = false; }
    else if (s.player.hidden >= 0) note('hidden');
    else E.moveTo(s, target);
    events(); update(); draw();
  });
  document.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || s.status !== 'playing') return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, button.dataset.dir); aim = false;
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, event => pointers.delete(event.pointerId));
  });
  const mapping = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || dialog.open) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (mapping[key] && s.status === 'playing') { event.preventDefault(); keys.add(mapping[key]); aim = false; }
    if (event.repeat) return;
    if ((key === 'p' || key === 'Escape') && s.status === 'playing') { event.preventDefault(); if (aim) { aim = false; update(); } else pause(); }
    if (key === 'e' && s.status === 'playing') { event.preventDefault(); E.hide(s); aim = false; events(); update(); }
    if (key === 'q') { event.preventDefault(); toggleAim(); }
  });
  document.addEventListener('keyup', event => { const key = event.key.length === 1 ? event.key.toLowerCase() : event.key; if (mapping[key]) keys.delete(mapping[key]); });
  window.addEventListener('blur', () => { clearInput(); pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pause(); audio?.suspend().catch(() => {}); } });
  window.addEventListener('pagehide', () => { if (s.status === 'playing') s.status = 'paused'; stop(); audio?.suspend().catch(() => {}); });
  window.addEventListener('pageshow', event => { if (event.persisted && s.status === 'paused') show('paused'); });
  window.addEventListener('boopland:languagechange', () => { update(); chapters(); if (dialog.open) renderDialog(); draw(); });
  new ResizeObserver(resize).observe($('board-wrap'));
  chapters(); update(); resize(); show('ready');
})();
