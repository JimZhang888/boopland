(() => {
  'use strict';
  const E = AnimalLinkEngine, I = BooplandI18n, themes = LinkThemes;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`animalLink.${key}`, values);
  const modes = { easy: { rows: 6, cols: 6, types: 6 }, normal: { rows: 8, cols: 6, types: 8 }, hard: { rows: 8, cols: 8, types: 8 } };
  const read = (key, fallback) => { try { return localStorage.getItem(`boopland-animal-link-${key}`) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(`boopland-animal-link-${key}`, String(value)); } catch { /* Storage is optional. */ } };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const formatTime = ms => { const seconds = Math.floor(ms / 1000); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
  let mode = Object.hasOwn(modes, read('mode', 'easy')) ? read('mode', 'easy') : 'easy';
  let theme = themes.find(item => item.id === read('theme', 'animals')) || themes[0];
  let board = [], rows = 6, cols = 6, page = 1, matched = 0, assists = 0;
  let selected = null, focused = 0, elapsed = 0, lastTick = performance.now(), started = false, ended = false, busy = false;
  let generation = 0, hintTimer, effectTimer, timer, audio, dialogMode = '', pending = null, returnFocus = null;
  let statusKey = 'ready', sound = read('sound', 'false') === 'true', isNewBest = false;
  let transposed = false, currentPath = null, pathIsHint = false;
  const viewCell = index => transposed ? [index % cols, Math.floor(index / cols)] : [Math.floor(index / cols), index % cols];
  const viewSize = () => transposed ? [cols, rows] : [rows, cols];
  const icons = () => new Map(theme.icons.map(icon => [icon.id, icon]));
  const bestKey = () => `best-${mode}-${theme.id}`;
  const getBest = () => { const value = Number(read(bestKey(), '0')); return Number.isFinite(value) && value > 0 ? value : 0; };

  function tick() {
    const now = performance.now();
    if (started && !ended && !dialogMode && !document.hidden) elapsed += now - lastTick;
    lastTick = now;
    $('time').textContent = formatTime(elapsed);
  }
  function startClock() { tick(); started = true; }
  function setStatus(key) { statusKey = key; $('status').textContent = t(key); }
  function clearLine() {
    currentPath = null;
    $('connections').querySelectorAll('polyline').forEach(line => line.removeAttribute('points'));
    $('connections').classList.remove('is-hint');
  }
  function clearHint() {
    clearTimeout(hintTimer);
    $('board').querySelectorAll('.hinted').forEach(node => node.classList.remove('hinted'));
    clearLine();
  }
  function line(path, hint = false) {
    currentPath = path; pathIsHint = hint;
    // Compress the virtual outside ring into the paper margin, so the outside
    // route is visible without wasting a whole row of touch targets on it.
    const coord = (value, size) => value < 0 ? -.24 : value >= size ? size + .24 : value + .5;
    const [viewRows, viewCols] = viewSize();
    const points = path.map(([r, c]) => transposed ? [c, r] : [r, c]).map(([r, c]) => `${coord(c, viewCols)},${coord(r, viewRows)}`).join(' ');
    $('connections').querySelectorAll('polyline').forEach(node => node.setAttribute('points', points));
    $('connections').classList.toggle('is-hint', hint);
  }
  function updateStats() {
    const total = rows * cols / 2;
    $('matched').textContent = matched; $('total').textContent = `/ ${total}`;
    $('round').textContent = t('round', { round: String(page).padStart(2, '0') });
    const best = getBest(); $('best').textContent = best ? formatTime(best) : '—';
    $('progress').setAttribute('aria-valuemax', total); $('progress').setAttribute('aria-valuenow', matched);
    $('progress-fill').style.width = `${matched / total * 100}%`;
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('data-i18n-label', sound ? 'soundOff' : 'soundOn');
    $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('board').setAttribute('aria-busy', String(busy));
    ['hint', 'shuffle', 'pause'].forEach(id => { $(id).disabled = busy || ended; });
    ['restart', 'help', 'difficulty', 'theme'].forEach(id => { $(id).disabled = busy; });
  }
  function render(rebuild = false) {
    const palette = icons();
    if (rebuild) {
      const fragment = document.createDocumentFragment();
      board.forEach((_, index) => {
        const node = document.createElement('button'); node.type = 'button'; node.className = 'tile';
        node.dataset.index = index; node.style.setProperty('--tilt', `${(index % 5 - 2) * .8}deg`);
        const face = document.createElement('span'); face.className = 'tile-face'; node.append(face); fragment.append(node);
      });
      $('board').replaceChildren(fragment);
    }
    if (board[focused] == null) focused = board.findIndex(Boolean);
    [...$('board').children].forEach((node, index) => {
      const type = board[index], icon = palette.get(type), empty = type == null;
      const [row, col] = viewCell(index);
      node.style.gridRow = row + 1; node.style.gridColumn = col + 1;
      if (node.dataset.icon !== (type || '')) {
        node.dataset.icon = type || ''; node.firstChild.innerHTML = icon?.svg || '';
        node.style.setProperty('--wash', icon?.wash || '#f5f3eb');
      }
      node.disabled = empty; node.tabIndex = !empty && index === focused ? 0 : -1;
      node.classList.toggle('empty', empty); node.classList.toggle('selected', index === selected);
      node.setAttribute('aria-pressed', String(index === selected));
      if (empty) { node.setAttribute('aria-hidden', 'true'); node.removeAttribute('aria-label'); }
      else { node.removeAttribute('aria-hidden'); node.setAttribute('aria-label', t('tile', { row: row + 1, col: col + 1, icon: t(icon.label) })); }
    });
  }
  function focusCell(index) {
    if (board[index] == null) return;
    focused = index;
    [...$('board').children].forEach((node, i) => { node.tabIndex = i === index ? 0 : -1; });
    $('board').children[index]?.focus({ preventScroll: true });
  }
  function tone(kind = 'pair') {
    if (!sound || document.hidden || dialogMode === 'pause') return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const frequencies = kind === 'win' ? [523, 659, 784, 1047] : kind === 'wrong' ? [247, 220] : [659, 880];
      const start = audio.currentTime;
      frequencies.forEach((f, i) => {
        const osc = audio.createOscillator(), gain = audio.createGain(), at = start + i * .07;
        osc.type = 'sine'; osc.frequency.value = f;
        gain.gain.setValueAtTime(.001, at); gain.gain.linearRampToValueAtTime(.045, at + .015); gain.gain.exponentialRampToValueAtTime(.001, at + .18);
        osc.connect(gain); gain.connect(audio.destination); osc.start(at); osc.stop(at + .2);
      });
    } catch { /* The puzzle also works with no audio support. */ }
  }
  function choose(index) {
    if (busy || ended || dialogMode || board[index] == null) return;
    startClock(); clearHint(); focused = index;
    if (selected === index) { selected = null; render(); setStatus('ready'); return; }
    if (selected == null) { selected = index; render(); setStatus('selected'); return; }
    const a = selected, b = index, same = board[a] === board[b], path = same ? E.route(board, rows, cols, a, b) : null;
    if (!path) {
      selected = b; render(); setStatus(same ? 'blocked' : 'mismatch'); tone('wrong');
      const node = $('board').children[a]; node.classList.add('wrong');
      setTimeout(() => node.classList.remove('wrong'), 280); return;
    }
    selected = null; busy = true; render(); updateStats(); line(path); tone();
    [a, b].forEach(i => $('board').children[i].classList.add('clearing'));
    const current = generation, restoreFocus = $('board').contains(document.activeElement);
    effectTimer = setTimeout(() => {
      if (current !== generation) return;
      tick(); board[a] = null; board[b] = null; matched++; busy = false;
      [a, b].forEach(i => $('board').children[i].classList.remove('clearing'));
      clearLine(); render();
      if (matched === rows * cols / 2) {
        ended = true; isNewBest = !getBest() || elapsed < getBest();
        if (isNewBest) save(bestKey(), Math.max(1, Math.round(elapsed)));
        setStatus('finished'); tone('win'); updateStats(); showDialog('win');
      } else {
        if (!E.findPair(board, rows, cols)) shuffle(true); else setStatus('cleared');
        updateStats();
        if (restoreFocus && !dialogMode) focusCell(focused);
      }
    }, reduced.matches ? 30 : 310);
  }
  function shuffle(automatic = false) {
    if (!automatic && (busy || ended || dialogMode)) return;
    if (!automatic) { startClock(); assists++; }
    clearHint(); selected = null;
    board = E.arrange(board, rows, cols).board;
    render(); setStatus(automatic ? 'autoShuffle' : 'shuffled'); updateStats();
  }
  function newRound(nextPage = 1, nextMode = mode, nextTheme = theme.id) {
    generation++; clearTimeout(effectTimer); clearHint();
    mode = nextMode; theme = themes.find(item => item.id === nextTheme) || themes[0];
    ({ rows, cols } = modes[mode]); page = nextPage; matched = 0; assists = 0; selected = null; focused = 0;
    elapsed = 0; lastTick = performance.now(); started = false; ended = false; busy = false; isNewBest = false; statusKey = 'ready';
    const palette = theme.icons.slice(0, modes[mode].types).map(icon => icon.id);
    board = E.create(rows, cols, palette).board;
    $('difficulty').value = mode; $('theme').value = theme.id;
    save('mode', mode); save('theme', theme.id);
    render(true); localize(); resize();
  }
  function refreshDialog() {
    const key = dialogMode;
    $('dialog-art').innerHTML = theme.icons.slice(0, key === 'win' ? 3 : 1).map(icon => icon.svg).join('');
    $('rules').hidden = key !== 'help';
    $('dialog-secondary').hidden = !['restart', 'change'].includes(key);
    $('dialog-secondary').textContent = t('cancel');
    if (key === 'help') {
      $('dialog-title').textContent = t('helpTitle'); $('dialog-description').textContent = t('helpDesc'); $('dialog-primary').textContent = t('gotIt');
    } else if (key === 'pause') {
      $('dialog-title').textContent = t('pauseTitle'); $('dialog-description').textContent = t('pauseDesc'); $('dialog-primary').textContent = t('resume');
    } else if (key === 'win') {
      $('dialog-title').textContent = t('winTitle');
      $('dialog-description').textContent = t('winDesc', { round: page, pairs: matched, time: formatTime(elapsed), assists }) + (isNewBest ? `\n${t('newBest')}` : '');
      $('dialog-primary').textContent = t('next');
    } else {
      $('dialog-title').textContent = t(key === 'change' ? 'changeTitle' : 'restartTitle');
      $('dialog-description').textContent = key === 'change' ? t('changeDesc', { difficulty: t(pending.mode), theme: t(themes.find(item => item.id === pending.theme).label) }) : t('restartDesc');
      $('dialog-primary').textContent = t('start');
    }
  }
  function showDialog(key) {
    tick(); returnFocus = document.activeElement; dialogMode = key;
    refreshDialog(); if (!$('dialog').open) $('dialog').showModal();
    $(key === 'help' ? 'dialog-close' : 'dialog-primary').focus({ preventScroll: true });
    if (key === 'pause') audio?.suspend().catch(() => {});
  }
  function closeDialog(restore = true) {
    tick(); $('dialog').close(); dialogMode = ''; pending = null; lastTick = performance.now();
    if (restore && returnFocus?.isConnected && !returnFocus.disabled) returnFocus.focus({ preventScroll: true });
    else if (restore) $('restart').focus({ preventScroll: true });
  }
  function settingsChanged() {
    const next = { mode: $('difficulty').value, theme: $('theme').value };
    $('difficulty').value = mode; $('theme').value = theme.id;
    if (next.mode === mode && next.theme === theme.id) return;
    if (!started || ended) { newRound(1, next.mode, next.theme); return; }
    pending = next; showDialog('change');
  }
  function localize() {
    document.title = t('pageTitle');
    $('theme').replaceChildren(...themes.map(item => { const option = document.createElement('option'); option.value = item.id; option.textContent = t(item.label); return option; }));
    $('theme').value = theme.id; $('difficulty').value = mode;
    $('friend-list').replaceChildren(...theme.icons.slice(0, 4).map((icon, i) => {
      const node = document.createElement('div'); node.className = 'friend'; node.style.setProperty('--tilt', `${i % 2 ? 4 : -4}deg`);
      node.innerHTML = icon.svg; const label = document.createElement('span'); label.textContent = t(icon.label); node.append(label); return node;
    }));
    $('sample').innerHTML = theme.icons[0].svg + theme.icons[0].svg;
    render(); updateStats(); tick(); setStatus(statusKey); if (dialogMode) refreshDialog();
  }
  function resize() {
    // Transpose rectangular boards in short landscape windows, preserving all
    // pairs, holes and routes instead of starting a new puzzle on rotation.
    const nextTranspose = rows > cols && matchMedia('(max-height:500px)').matches;
    if (nextTranspose !== transposed) { transposed = nextTranspose; render(); }
    const [viewRows, viewCols] = viewSize();
    $('board-frame').style.setProperty('--cols', viewCols); $('board-frame').style.setProperty('--rows', viewRows);
    $('connections').setAttribute('viewBox', `-.5 -.5 ${viewCols + 1} ${viewRows + 1}`);
    if (currentPath) line(currentPath, pathIsHint);
    const slot = $('board-slot'), box = slot.getBoundingClientRect(), css = getComputedStyle(slot);
    const width = box.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) - 2;
    const height = box.height - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 2;
    const cell = Math.max(1, Math.min(width / (viewCols + 1), height / (viewRows + 1)));
    $('board-frame').style.setProperty('--board-width', `${cell * (viewCols + 1) + 2}px`);
    $('board-frame').style.setProperty('--board-height', `${cell * (viewRows + 1) + 2}px`);
    $('board-frame').style.setProperty('--gutter', `${cell / 2}px`);
  }

  $('board').addEventListener('click', event => { const tile = event.target.closest('.tile'); if (tile) choose(Number(tile.dataset.index)); });
  $('board').addEventListener('keydown', event => {
    if (busy || ended || dialogMode) return;
    const node = event.target.closest('.tile'); if (!node) return;
    const index = Number(node.dataset.index), directions = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    if (directions[event.key]) {
      event.preventDefault(); const [dr, dc] = directions[event.key], [row, col] = viewCell(index), [viewRows, viewCols] = viewSize();
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < viewRows && c >= 0 && c < viewCols) {
        const next = transposed ? c * cols + r : r * cols + c;
        if (board[next] != null) { focusCell(next); break; } r += dr; c += dc;
      }
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); focusCell(event.key === 'Home' ? board.findIndex(Boolean) : board.findLastIndex(Boolean));
    } else if (event.key === 'Escape') { event.preventDefault(); clearHint(); selected = null; render(); setStatus('ready'); }
  });
  $('hint').addEventListener('click', () => {
    if (busy || ended || dialogMode) return;
    startClock(); clearHint(); selected = null; assists++;
    let pair = E.findPair(board, rows, cols);
    if (!pair) { shuffle(true); pair = E.findPair(board, rows, cols); }
    if (!pair) return;
    render(); [pair.a, pair.b].forEach(index => $('board').children[index].classList.add('hinted'));
    line(pair.path, true); setStatus('hintStatus'); hintTimer = setTimeout(clearHint, 4200);
  });
  $('shuffle').addEventListener('click', () => shuffle());
  $('restart').addEventListener('click', () => showDialog('restart'));
  $('pause').addEventListener('click', () => showDialog('pause'));
  $('help').addEventListener('click', () => showDialog('help'));
  $('sound').addEventListener('click', () => { sound = !sound; save('sound', sound); updateStats(); if (sound) tone(); else audio?.suspend().catch(() => {}); });
  $('difficulty').addEventListener('change', settingsChanged); $('theme').addEventListener('change', settingsChanged);
  $('dialog-close').addEventListener('click', () => closeDialog());
  $('dialog-secondary').addEventListener('click', () => closeDialog());
  $('dialog').addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  $('dialog-primary').addEventListener('click', () => {
    const key = dialogMode, next = pending;
    if (key === 'help' || key === 'pause') { closeDialog(); return; }
    closeDialog(false);
    if (key === 'change') newRound(1, next.mode, next.theme);
    else newRound(key === 'win' ? page + 1 : page);
    focusCell(0);
  });
  function visibilityChanged() {
    clearInterval(timer); tick();
    if (document.hidden) { if (started && !ended && !dialogMode) showDialog('pause'); audio?.suspend().catch(() => {}); }
    else { lastTick = performance.now(); timer = setInterval(tick, 200); }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  window.addEventListener('pagehide', () => { clearInterval(timer); if (started && !ended && !dialogMode) showDialog('pause'); audio?.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { clearInterval(timer); lastTick = performance.now(); if (!document.hidden) timer = setInterval(tick, 200); });
  window.addEventListener('boopland:languagechange', localize);
  new ResizeObserver(resize).observe($('board-slot'));
  newRound(); setStatus('ready'); timer = setInterval(tick, 200);
})();
