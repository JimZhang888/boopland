(() => {
  'use strict';
  const E = AnimalMatch, A = AnimalArt, I = BooplandI18n;
  const $ = id => document.getElementById(id);
  const animalKeys = ['fox', 'cat', 'rabbit', 'frog', 'chick', 'bear'];
  const t = (key, values) => I.t(`animalMatch.${key}`, values);
  const format = value => value.toLocaleString(I.language);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* Play without persistence. */ } };
  let board = [], score = 0, remaining = 26, shuffles = 2, level = 1;
  let selected = null, focused = 0, busy = false, ended = false, serial = 0, round = 0;
  let best = Math.max(0, Number(read('boopland-animal-match-best', 0)) || 0);
  let sound = read('boopland-animal-match-sound', 'false') === 'true';
  let audio = null, pointer = null, suppressClick = 0, dialogMode = '', returnFocus = null;
  let statusKey = 'ready', statusValues = {}, hintTimer = null;
  const nodes = new Map();
  const makeTile = (type = Math.floor(Math.random() * E.TYPES)) => ({ id: ++serial, type });
  const delay = ms => new Promise(resolve => setTimeout(resolve, reduced.matches ? Math.min(ms, 20) : ms));

  function setStatus(key, values = {}) {
    statusKey = key; statusValues = values;
    $('status').textContent = t(key, values);
  }
  function clearHints() {
    clearTimeout(hintTimer);
    nodes.forEach(node => node.classList.remove('hinted'));
  }
  function setBusy(value) {
    busy = value;
    $('board').setAttribute('aria-busy', String(value));
    $('hint').disabled = value || ended;
    $('shuffle').disabled = value || ended || shuffles <= 0;
  }
  function updateStats() {
    const goal = E.target(level), earned = E.stars(score, goal);
    $('score').textContent = format(score); $('best').textContent = format(best);
    $('moves').textContent = remaining; $('target').textContent = format(goal);
    $('level').textContent = t('level', { level: String(level).padStart(2, '0') });
    $('shuffle-count').textContent = shuffles;
    $('progress-fill').style.width = `${Math.min(100, score / goal * 100)}%`;
    $('progress').setAttribute('aria-valuemax', goal);
    $('progress').setAttribute('aria-valuenow', Math.min(goal, score));
    [...$('stars').children].forEach((star, i) => star.classList.toggle('earned', i < earned));
    const next = earned === 0 ? goal : earned === 1 ? Math.ceil(goal * 1.4) : Math.ceil(goal * 1.8);
    $('goal-note').textContent = earned === 3 ? t('allStars') : t(earned ? 'nextStar' : 'targetLeft', { points: format(next - score) });
    document.querySelector('.moves-card').classList.toggle('low', remaining <= 5);
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound').setAttribute('data-i18n-label', sound ? 'soundOff' : 'soundOn');
  }
  function place(node, index, row) {
    node.style.transform = `translate(${index % 8 * 100}%, ${(row ?? Math.floor(index / 8)) * 100}%)`;
  }
  function render(entering = []) {
    const newRows = new Map(entering.map(item => [item.tile.id, item.fromRow]));
    const liveIds = new Set(board.filter(Boolean).map(tile => tile.id));
    for (const [id, node] of nodes) if (!liveIds.has(id)) { node.remove(); nodes.delete(id); }
    board.forEach((tile, index) => {
      if (!tile) return;
      let node = nodes.get(tile.id);
      if (!node) {
        node = document.createElement('button'); node.type = 'button'; node.className = 'tile';
        node.innerHTML = `<span class="animal">${A.svg(tile.type)}</span>`;
        node.style.setProperty('--wash', A.washes[tile.type]);
        node.style.setProperty('--tilt', `${(tile.id % 5 - 2) * 1.2}deg`);
        node.dataset.id = tile.id; nodes.set(tile.id, node); $('board').append(node);
        if (newRows.has(tile.id)) { node.style.transition = 'none'; place(node, index, newRows.get(tile.id)); }
      }
      node.dataset.index = index;
      node.setAttribute('aria-label', t('tile', { row: Math.floor(index / 8) + 1, col: index % 8 + 1, animal: t(animalKeys[tile.type]) }));
      node.setAttribute('aria-pressed', String(selected === index));
      node.tabIndex = index === focused ? 0 : -1;
      node.classList.toggle('selected', selected === index);
      if (!newRows.has(tile.id)) place(node, index);
    });
    if (entering.length) {
      void $('board').offsetWidth;
      entering.forEach(({ tile, index }) => { const node = nodes.get(tile.id); node.style.transition = ''; place(node, index); });
    }
  }
  function focusCell(index) {
    focused = Math.max(0, Math.min(63, index));
    nodes.forEach(node => { node.tabIndex = Number(node.dataset.index) === focused ? 0 : -1; });
    nodes.get(board[focused]?.id)?.focus({ preventScroll: true });
  }
  function tone(chain = 1, invalid = false) {
    if (!sound || document.hidden) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const start = audio.currentTime;
      const frequencies = invalid ? [220, 196] : [523.25, 659.25, 783.99].map(f => f * Math.pow(1.12, Math.min(chain - 1, 5)));
      frequencies.forEach((f, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = f;
        gain.gain.setValueAtTime(0, start + i * .045);
        gain.gain.linearRampToValueAtTime(.055, start + i * .045 + .015);
        gain.gain.exponentialRampToValueAtTime(.001, start + i * .045 + .19);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(start + i * .045); oscillator.stop(start + i * .045 + .21);
      });
    } catch { /* Audio is optional. */ }
  }
  function celebrate(indices, points, chain) {
    if (reduced.matches) return;
    const fragment = document.createDocumentFragment();
    indices.slice(0, 20).forEach(index => {
      for (let n = 0; n < 4; n++) {
        const particle = document.createElement('i'); particle.className = 'particle';
        const angle = n * Math.PI / 2 + Math.random();
        particle.style.cssText = `--x:${(index % 8 + .5) * 12.5}%;--y:${(Math.floor(index / 8) + .5) * 12.5}%;--dx:${Math.cos(angle) * 30}px;--dy:${Math.sin(angle) * 30}px;--color:${A.colors[board[index].type]}`;
        fragment.append(particle); setTimeout(() => particle.remove(), 650);
      }
    });
    const label = document.createElement('div'); label.className = 'floating-score';
    label.textContent = chain > 1 ? `${t('chain', { chain })}  +${format(points)}` : `+${format(points)}`;
    fragment.append(label); $('effects').append(fragment); setTimeout(() => label.remove(), 900);
  }
  async function attemptSwap(a, b) {
    if (busy || ended || $('dialog').open || !E.adjacent(a, b)) return;
    clearHints(); selected = null; setBusy(true);
    const currentRound = round, previous = board.slice(), valid = E.validSwap(board, a, b);
    board = E.swapped(board, a, b); render();
    await delay(230); if (currentRound !== round) return;
    if (!valid) {
      board = previous; render();
      [a, b].forEach(i => nodes.get(board[i].id).classList.add('invalid'));
      tone(1, true); setStatus('invalid');
      await delay(260); if (currentRound !== round) return;
      nodes.forEach(node => node.classList.remove('invalid')); setBusy(false); return;
    }
    remaining--; updateStats();
    let chain = 0, total = 0, count = 0, found;
    while ((found = E.matches(board)).length) {
      chain++; count += found.length;
      const points = E.points(found.length, chain); total += points;
      found.forEach(index => nodes.get(board[index].id).classList.add('removing'));
      celebrate(found, points, chain); tone(chain);
      score += points;
      if (score > best) { best = score; save('boopland-animal-match-best', best); }
      updateStats();
      await delay(290); if (currentRound !== round) return;
      found.forEach(index => { board[index] = null; });
      const dropped = E.collapse(board, () => makeTile());
      board = dropped.board; render(dropped.entering);
      await delay(270); if (currentRound !== round) return;
    }
    setStatus(chain > 1 ? 'combo' : 'cleared', { count, chain, points: format(total) });
    if (remaining === 0) {
      ended = true; setBusy(false); updateStats();
      if (!$('dialog').open) showDialog('result');
      return;
    }
    if (!E.moves(board).length) await mix(true, currentRound);
    if (currentRound !== round) return;
    setBusy(false);
    // Keep keyboard navigation usable if the previously focused animal disappeared.
    if (document.activeElement === document.body) focusCell(focused);
  }
  function choose(index) {
    if (busy || ended || $('dialog').open || !board[index]) return;
    clearHints(); focused = index;
    if (selected === index) { selected = null; render(); setStatus('ready'); return; }
    if (selected !== null && E.adjacent(selected, index)) { attemptSwap(selected, index); return; }
    selected = index; render(); setStatus('selected');
  }
  async function mix(automatic = false, currentRound = round) {
    if (!automatic && (busy || ended || shuffles <= 0 || $('dialog').open)) return;
    clearHints(); selected = null; setBusy(true);
    if (!automatic) shuffles--;
    board = E.shuffle(board) || E.create().map(type => makeTile(type));
    render(); updateStats(); setStatus(automatic ? 'autoShuffle' : 'shuffled');
    await delay(320); if (currentRound !== round) return;
    setBusy(false);
  }
  function newRound(nextLevel = level) {
    round++; clearHints(); level = nextLevel; score = 0; remaining = 26; shuffles = 2;
    selected = null; focused = 0; ended = false; pointer = null;
    board = E.create().map(type => makeTile(type));
    $('effects').replaceChildren(); render(); updateStats(); setStatus('ready'); setBusy(false);
  }
  function renderDialog() {
    const mode = dialogMode;
    $('dialog-art').innerHTML = mode === 'result' ? A.svg(0) + A.svg(2) + A.svg(4) : A.svg(mode === 'help' ? 3 : 5);
    $('dialog-eyebrow').textContent = t('resultEyebrow');
    $('rules').hidden = mode !== 'help'; $('result-stars').hidden = mode !== 'result';
    $('dialog-secondary').hidden = mode === 'help';
    if (mode === 'help') {
      $('dialog-title').textContent = t('helpTitle'); $('dialog-description').textContent = t('helpDesc');
      $('dialog-primary').textContent = t('gotIt');
    } else if (mode === 'restart') {
      $('dialog-title').textContent = t('restartTitle'); $('dialog-description').textContent = t('restartDesc');
      $('dialog-primary').textContent = t('restartConfirm'); $('dialog-secondary').textContent = t('continue');
    } else {
      const stars = E.stars(score, E.target(level));
      $('dialog-title').textContent = t(stars ? 'winTitle' : 'loseTitle');
      $('dialog-description').textContent = t(stars ? 'winDesc' : 'loseDesc', { level, score: format(score), target: format(E.target(level)) });
      $('result-stars').innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="${i < stars ? '' : 'empty'}">✦</span>`).join('');
      $('dialog-primary').textContent = t(stars ? 'next' : 'again');
      $('dialog-secondary').hidden = !stars; $('dialog-secondary').textContent = t('again');
    }
  }
  function showDialog(mode) {
    returnFocus = document.activeElement;
    dialogMode = mode; renderDialog(); $('dialog').showModal(); $('dialog-primary').focus();
  }
  function closeDialog() {
    const previous = dialogMode; $('dialog').close();
    if (ended && previous !== 'result') { showDialog('result'); return; }
    returnFocus?.focus?.({ preventScroll: true });
    if (ended) setStatus('finished');
  }
  function localize() {
    document.title = t('pageTitle');
    $('friend-list').innerHTML = animalKeys.map((key, i) => `<div class="friend" style="--tilt:${i % 2 ? 4 : -4}deg">${A.svg(i)}<span>${t(key)}</span></div>`).join('');
    $('sample-animals').innerHTML = A.svg(0) + A.svg(0) + A.svg(0);
    updateStats(); render(); setStatus(statusKey, statusValues); if ($('dialog').open) renderDialog();
  }
  function resize() {
    const rect = $('board-slot').getBoundingClientRect(), style = getComputedStyle($('board-slot'));
    const width = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    $('board-frame').style.setProperty('--board-size', `${Math.max(1, Math.floor(Math.min(width, height)))}px`);
  }

  $('board').addEventListener('click', event => {
    if (performance.now() < suppressClick) return;
    const node = event.target.closest('.tile'); if (node) choose(Number(node.dataset.index));
  });
  $('board').addEventListener('pointerdown', event => {
    if (busy || ended || !event.isPrimary || event.button !== 0) return;
    const node = event.target.closest('.tile'); if (!node) return;
    pointer = { id: event.pointerId, index: Number(node.dataset.index), x: event.clientX, y: event.clientY };
    // Capture to the pressed button so taps still synthesize a button click.
    node.setPointerCapture?.(event.pointerId);
  });
  $('board').addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const { x, y, index } = pointer; pointer = null;
    const dx = event.clientX - x, dy = event.clientY - y;
    const threshold = Math.max(10, $('board').clientWidth / 8 * .27);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
    suppressClick = performance.now() + 350;
    const next = index + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy) * 8);
    if (E.adjacent(index, next)) attemptSwap(index, next);
  });
  $('board').addEventListener('pointercancel', () => { pointer = null; });
  $('board').addEventListener('keydown', event => {
    const node = event.target.closest('.tile'); if (!node || busy || ended) return;
    const index = Number(node.dataset.index), row = Math.floor(index / 8), col = index % 8;
    const destinations = { ArrowLeft: row * 8 + Math.max(0, col - 1), ArrowRight: row * 8 + Math.min(7, col + 1), ArrowUp: Math.max(0, row - 1) * 8 + col, ArrowDown: Math.min(7, row + 1) * 8 + col };
    if (event.key in destinations) { event.preventDefault(); focusCell(destinations[event.key]); }
    if (event.key === 'Escape') { selected = null; clearHints(); render(); setStatus('ready'); }
  });
  $('hint').addEventListener('click', () => {
    if (busy || ended) return;
    clearHints(); selected = null; render();
    const options = E.moves(board); if (!options.length) { mix(true); return; }
    const pair = options[Math.floor(Math.random() * options.length)];
    pair.forEach(index => nodes.get(board[index].id).classList.add('hinted'));
    setStatus('hintStatus'); hintTimer = setTimeout(clearHints, 4500);
  });
  $('shuffle').addEventListener('click', () => mix());
  $('restart').addEventListener('click', () => showDialog('restart'));
  $('help').addEventListener('click', () => showDialog('help'));
  $('sound').addEventListener('click', () => { sound = !sound; save('boopland-animal-match-sound', sound); updateStats(); if (sound) tone(); else audio?.suspend().catch(() => {}); });
  $('dialog-close').addEventListener('click', closeDialog);
  $('dialog').addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  $('dialog-primary').addEventListener('click', () => {
    if (dialogMode === 'help') { closeDialog(); return; }
    const nextLevel = dialogMode === 'result' && E.stars(score, E.target(level)) ? level + 1 : level;
    $('dialog').close(); newRound(nextLevel); $('hint').focus({ preventScroll: true });
  });
  $('dialog-secondary').addEventListener('click', () => {
    if (dialogMode === 'restart') { closeDialog(); return; }
    $('dialog').close(); newRound(level);
  });
  document.addEventListener('visibilitychange', () => { pointer = null; if (document.hidden) audio?.suspend().catch(() => {}); });
  window.addEventListener('pagehide', () => { pointer = null; audio?.suspend().catch(() => {}); });
  window.addEventListener('boopland:languagechange', localize);
  new ResizeObserver(resize).observe($('board-slot'));
  newRound(); localize(); resize();
})();
