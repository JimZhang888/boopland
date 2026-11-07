(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('pencilMines.' + key, values);
  const game = new PencilMines.Game();
  const board = $('board');
  const dialogs = [...document.querySelectorAll('dialog')];
  const icon = name => '<svg class="icon" aria-hidden="true"><use href="#icon-' + name + '"/></svg>';
  let mode = 'reveal', paused = false, elapsed = 0, clockStart = null, clockInterval = null;
  let cellButtons = [], focusIndex = 0, pendingLevel = 'easy', newBest = false;
  let touch = null, holdTimer = null, suppressedClick = null;
  let hint = null;

  function readBest() {
    try {
      const raw = localStorage.getItem('boopland-pencil-mines-best-v1-' + game.level);
      const value = Number(raw);
      return raw !== null && Number.isFinite(value) && value >= 0 ? value : null;
    } catch { return null; }
  }
  function timeNow() { return elapsed + (clockStart === null ? 0 : performance.now() - clockStart); }
  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function updateTime() { $('time').textContent = formatTime(timeNow()); }
  function syncClock() {
    const active = game.status === 'playing' && !paused && !document.hidden && !dialogs.some(dialog => dialog.open);
    if (active && clockStart === null) {
      clockStart = performance.now();
      clockInterval = setInterval(updateTime, 250);
    } else if (!active && clockStart !== null) {
      elapsed += performance.now() - clockStart;
      clockStart = null;
      clearInterval(clockInterval);
      clockInterval = null;
    }
    updateTime();
  }
  function interactive() { return !game.finished && !paused && !dialogs.some(dialog => dialog.open) && !document.hidden; }
  function announce(message) { $('announcement').textContent = message; }
  function cellLabel(index) {
    const cell = game.cells[index];
    let state = cell.flag ? 'marked' : 'closed';
    if (game.status === 'lost' && cell.flag && !cell.mine) state = 'wrong';
    else if (game.status === 'lost' && cell.mine) state = 'mine';
    else if (cell.open) state = cell.mine ? 'mine' : cell.adjacent ? 'number' : 'empty';
    return t('position', { row: Math.floor(index / game.size) + 1, col: index % game.size + 1, state: t(state, { count: cell.adjacent }) });
  }
  function buildBoard() {
    board.replaceChildren();
    board.style.setProperty('--size', game.size);
    cellButtons = game.cells.map((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.index = index;
      button.tabIndex = index === focusIndex ? 0 : -1;
      board.append(button);
      return button;
    });
  }
  function renderResult() {
    if (!game.finished) return;
    const won = game.status === 'won';
    $('result-art').innerHTML = icon(won ? 'sprout' : 'mine');
    $('result-kicker').textContent = t(won ? 'winKicker' : 'loseKicker');
    $('result-title').textContent = t(won ? 'wonTitle' : 'lostTitle');
    $('result-copy').textContent = t(won ? 'wonCopy' : 'lostCopy', { count: game.opened, time: formatTime(elapsed) });
    $('result-record').hidden = !newBest;
  }
  function render() {
    board.classList.toggle('is-ended', game.finished);
    board.classList.toggle('is-won', game.status === 'won');
    game.cells.forEach((cell, index) => {
      const button = cellButtons[index];
      const mineVisible = game.status === 'lost' && cell.mine;
      const wrongFlag = game.status === 'lost' && cell.flag && !cell.mine;
      button.className = 'cell' + (cell.open ? ' is-open' : '') + (cell.flag ? ' is-flagged' : '') + (mineVisible ? ' is-mine' : '') + (wrongFlag ? ' is-wrong' : '') + (index === game.exploded ? ' is-exploded' : '');
      button.dataset.number = cell.open && !cell.mine ? cell.adjacent : '';
      const content = mineVisible ? icon('mine') : cell.flag ? icon('flag') : cell.open && cell.adjacent ? String(cell.adjacent) : '';
      // Keep focus and untouched cells stable; no replacement of the grid on moves.
      if (button.innerHTML !== content) button.innerHTML = content;
      button.setAttribute('aria-label', cellLabel(index));
      button.setAttribute('aria-disabled', String(game.finished || paused || (cell.open && !cell.adjacent)));
      button.tabIndex = !paused && index === focusIndex ? 0 : -1;
    });
    $('flags').textContent = String(game.mines - game.flags).padStart(2, '0');
    const best = readBest();
    $('best').textContent = best === null ? '—' : formatTime(best);
    $('progress').textContent = game.opened + ' / ' + game.totalSafe;
    $('progress').setAttribute('aria-label', t('opened', { opened: game.opened, total: game.totalSafe }));
    $('progress-fill').style.width = (game.opened / game.totalSafe * 100) + '%';
    const status = hint || (paused ? 'paused' : game.finished ? game.status : mode === 'flag' ? 'flagging' : game.status === 'ready' ? 'ready' : 'playing');
    $('status').textContent = t(status);
    $('pause').disabled = game.status !== 'playing';
    $('pause').setAttribute('aria-pressed', String(paused));
    $('pause').title = t('pause');
    $('pause-icon').innerHTML = paused ? '<path d="m12 7 12 9-12 9Z"/>' : '<path d="M11 8v16M21 8v16"/>';
    $('pause-cover').hidden = !paused;
    board.inert = paused;
    $('reveal-mode').setAttribute('aria-pressed', String(mode === 'reveal'));
    $('flag-mode').setAttribute('aria-pressed', String(mode === 'flag'));
    document.querySelectorAll('[data-level]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === game.level)));
    renderResult();
  }
  function resizeBoard() {
    const space = $('board-space'), style = getComputedStyle(space);
    const width = space.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = space.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const size = Math.floor(Math.max(80, Math.min(width, height, 510)));
    $('board-wrap').style.setProperty('--board-size', size + 'px');
    board.style.setProperty('--number-size', Math.max(11, Math.min(30, (size / game.size - 4) * .61)) + 'px');
  }
  function setFocus(index, moveFocus = false) {
    if (!game.valid(index)) return;
    cellButtons[focusIndex].tabIndex = -1;
    focusIndex = index;
    cellButtons[index].tabIndex = paused ? -1 : 0;
    if (moveFocus) cellButtons[index].focus({ preventScroll: true });
  }
  function finish() {
    syncClock();
    if (game.status === 'won') {
      const best = readBest();
      newBest = best === null || elapsed < best;
      if (newBest) {
        try { localStorage.setItem('boopland-pencil-mines-best-v1-' + game.level, String(Math.round(elapsed))); }
        catch { /* Storage is optional; the finished game remains playable. */ }
      }
    }
    render();
    announce(t(game.status));
    openDialog($('result-dialog'));
  }
  function act(index, action = mode) {
    if (!interactive() || !game.valid(index)) return;
    hint = null;
    let changed;
    if (action === 'flag') {
      const limited = !game.cells[index].open && !game.cells[index].flag && game.flags === game.mines;
      changed = game.toggleFlag(index);
      if (limited) hint = 'allFlags';
    } else if (game.cells[index].open) {
      changed = game.chord(index);
      if (!changed && game.cells[index].adjacent) hint = 'chordHint';
    } else changed = game.reveal(index);
    syncClock();
    if (game.finished) { finish(); return; }
    render();
    if (changed) announce(action === 'flag' ? cellLabel(index) : t('opened', { opened: game.opened, total: game.totalSafe }));
  }
  function clearHold() { clearTimeout(holdTimer); holdTimer = null; touch = null; }
  function cancelInput() { clearHold(); suppressedClick = null; }
  function reset(level = game.level) {
    cancelInput();
    dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
    paused = false;
    // Stop the previous timer before clearing the elapsed value.
    game.reset(level);
    syncClock();
    elapsed = 0;
    hint = null;
    newBest = false;
    focusIndex = 0;
    mode = 'reveal';
    buildBoard();
    render();
    updateTime();
    resizeBoard();
  }
  function openDialog(dialog) {
    cancelInput();
    if (!dialog.open) dialog.showModal();
    syncClock();
  }
  function requestReset(level = game.level) {
    pendingLevel = level;
    if (game.status === 'playing') openDialog($('restart-dialog'));
    else reset(level);
  }
  function setPaused(value, focus = true) {
    if (game.status !== 'playing') return;
    cancelInput();
    hint = null;
    paused = value;
    syncClock();
    render();
    if (focus) {
      if (paused) $('resume').focus();
      else setFocus(focusIndex, true);
    }
  }
  function setMode(next) { mode = next; hint = null; render(); }

  board.addEventListener('focusin', event => {
    const cell = event.target.closest('.cell');
    if (cell) setFocus(Number(cell.dataset.index));
  });
  board.addEventListener('click', event => {
    const button = event.target.closest('.cell');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (event.detail !== 0 && suppressedClick && performance.now() < suppressedClick.until && suppressedClick.index === index) {
      suppressedClick = null;
      return;
    }
    setFocus(index);
    act(index);
  });
  board.addEventListener('contextmenu', event => {
    event.preventDefault();
    const button = event.target.closest('.cell');
    if (!button) return;
    const index = Number(button.dataset.index);
    // Touch long presses can also generate a contextmenu; do not toggle twice.
    if (touch || (suppressedClick && suppressedClick.index === index && performance.now() < suppressedClick.until)) return;
    setFocus(index);
    act(index, 'flag');
  });
  board.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.button !== 0 || !event.isPrimary || !interactive()) return;
    const button = event.target.closest('.cell');
    if (!button) return;
    clearHold();
    const index = Number(button.dataset.index);
    touch = { id: event.pointerId, index, x: event.clientX, y: event.clientY };
    holdTimer = setTimeout(() => {
      if (!touch) return;
      suppressedClick = { index, until: performance.now() + 1200 };
      setFocus(index);
      act(index, 'flag');
      holdTimer = null;
    }, 420);
  });
  window.addEventListener('pointermove', event => {
    if (!touch || event.pointerId !== touch.id) return;
    if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 12) {
      suppressedClick = { index: touch.index, until: performance.now() + 1200 };
      clearHold();
    }
  }, { passive: true });
  window.addEventListener('pointerup', event => {
    if (!touch || event.pointerId !== touch.id) return;
    if (holdTimer === null && suppressedClick) suppressedClick.until = performance.now() + 1200;
    clearHold();
  });
  window.addEventListener('pointercancel', event => { if (touch && event.pointerId === touch.id) cancelInput(); });
  board.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || paused) return;
    const row = Math.floor(focusIndex / game.size), col = focusIndex % game.size;
    const destinations = { ArrowUp: Math.max(0, row - 1) * game.size + col, ArrowDown: Math.min(game.size - 1, row + 1) * game.size + col, ArrowLeft: row * game.size + Math.max(0, col - 1), ArrowRight: row * game.size + Math.min(game.size - 1, col + 1), Home: row * game.size, End: (row + 1) * game.size - 1 };
    if (Object.hasOwn(destinations, event.key)) { event.preventDefault(); setFocus(destinations[event.key], true); }
    if (['f', 'F', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) act(focusIndex, event.key.toLowerCase() === 'f' ? 'flag' : mode);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || dialogs.some(dialog => dialog.open)) return;
    if (event.key.toLowerCase() === 'p' || (event.key === 'Escape' && game.status === 'playing')) {
      event.preventDefault();
      setPaused(!paused);
    }
  });
  $('reveal-mode').addEventListener('click', () => setMode('reveal'));
  $('flag-mode').addEventListener('click', () => setMode('flag'));
  $('pause').addEventListener('click', () => setPaused(!paused));
  $('resume').addEventListener('click', () => setPaused(false));
  $('help').addEventListener('click', () => openDialog($('help-dialog')));
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  $('help-done').addEventListener('click', () => $('help-dialog').close());
  $('restart').addEventListener('click', () => requestReset());
  $('cancel-restart').addEventListener('click', () => $('restart-dialog').close());
  $('confirm-restart').addEventListener('click', () => reset(pendingLevel));
  $('play-again').addEventListener('click', () => reset());
  $('inspect').addEventListener('click', () => $('result-dialog').close());
  $('close-result').addEventListener('click', () => $('result-dialog').close());
  document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.level !== game.level) requestReset(button.dataset.level);
  }));
  dialogs.forEach(dialog => dialog.addEventListener('close', () => { syncClock(); render(); }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelInput(); setPaused(true, false); }
    syncClock();
  });
  window.addEventListener('pagehide', () => { setPaused(true, false); cancelInput(); });
  window.addEventListener('boopland:languagechange', () => { render(); requestAnimationFrame(resizeBoard); });
  window.addEventListener('storage', event => { if (event.key?.startsWith('boopland-pencil-mines-best-v1-')) render(); });
  new ResizeObserver(resizeBoard).observe($('board-space'));
  window.addEventListener('resize', resizeBoard);
  reset();
})();
