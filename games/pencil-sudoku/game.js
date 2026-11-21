(() => {
  'use strict';
  const { puzzles, newGame, edit, undo, inspect } = window.PencilSudoku;
  const i18n = window.BooplandI18n;
  const t = (key, values) => i18n.t('pencil-sudoku.' + key, values);
  const byId = id => document.getElementById(id);
  const board = byId('board'), pad = byId('pad'), dialog = byId('dialog');
  const prefix = 'boopland.pencil-sudoku.v1.';
  const memory = new Map();
  function load(key) {
    try {
      const raw = localStorage.getItem(prefix + key);
      if (raw !== null) return JSON.parse(raw);
    } catch { /* A private session can still use the current puzzle book. */ }
    return memory.get(key);
  }
  function save(key, value) {
    memory.set(key, value);
    try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* Session-only fallback. */ }
  }

  const bestOf = puzzle => {
    const value = load('best.' + puzzle.id);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const unlocked = () => puzzles.some(p => p.group === 'intro' && bestOf(p) !== null);
  const format = ms => {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  function element(tag, className, message) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (message !== undefined) node.textContent = message;
    return node;
  }
  function icon(name) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'), use = document.createElementNS(ns, 'use');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', '#i-' + name);
    svg.append(use);
    return svg;
  }

  let game, state, selected, noteMode, started, elapsed, since = null, ticker = null;
  let dialogType = '', newBest = false, firstUnlock = false;
  const elapsedNow = () => elapsed + (since === null ? 0 : performance.now() - since);
  function stopClock() {
    elapsed = elapsedNow();
    since = null;
    clearInterval(ticker);
    ticker = null;
  }
  function resumeClock() {
    if (started && !state.solved && !dialogType && !document.hidden && since === null) {
      since = performance.now();
      ticker = window.setInterval(displayTime, 250);
    }
  }
  function touchClock() { started = true; resumeClock(); }
  function displayTime() {
    const value = format(elapsedNow());
    if (byId('clock').textContent !== value) byId('clock').textContent = value;
  }
  function keep() {
    save('draft.' + game.puzzle.id, {
      values: game.values, notes: game.notes, history: game.history, selected, noteMode,
      started, completed: state.solved, elapsed: Math.round(elapsedNow())
    });
  }
  function validPair(i, v, mask) {
    const { givens, size } = game.puzzle;
    return Number.isInteger(i) && i >= 0 && i < givens.length && Number.isInteger(v) && v >= 0 && v <= size
      && (!givens[i] || v === givens[i]) && Number.isInteger(mask) && mask >= 0
      && mask < (1 << (size + 1)) && !(mask & 1) && !(v && mask);
  }
  function restore(draft) {
    if (!draft || !Array.isArray(draft.values) || !Array.isArray(draft.notes) ||
        draft.values.length !== game.values.length || draft.notes.length !== game.notes.length ||
        !draft.values.every((v, i) => validPair(i, v, draft.notes[i]))) return;
    game.values = draft.values.slice();
    game.notes = draft.notes.slice();
    if (Array.isArray(draft.history) && draft.history.every(change => Array.isArray(change) && change.length &&
      change.every(item => Array.isArray(item) && item.length === 3 && validPair(...item) && !game.puzzle.givens[item[0]]))) {
      game.history = draft.history.slice();
    }
    if (Number.isInteger(draft.selected) && draft.selected >= 0 && draft.selected < game.values.length) selected = draft.selected;
    started = draft.started === true;
    noteMode = draft.noteMode === true;
    elapsed = Number.isFinite(draft.elapsed) && draft.elapsed >= 0 ? draft.elapsed : 0;
  }

  function openPuzzle(puzzle, replay = false) {
    if (puzzle.group !== 'intro' && !unlocked()) return;
    if (game) { stopClock(); keep(); }
    if (dialog.open) dialog.close();
    dialogType = '';
    game = newGame(puzzle);
    selected = game.values.indexOf(0);
    noteMode = started = newBest = firstUnlock = false;
    elapsed = 0;
    if (!replay) restore(load('draft.' + puzzle.id));
    state = inspect(game);
    save('current', puzzle.id);
    makeBoard();
    render();
    keep();
    resumeClock();
  }

  function makeBoard() {
    const n = game.puzzle.size, box = Math.sqrt(n);
    board.replaceChildren();
    pad.replaceChildren();
    board.style.setProperty('--n', n);
    board.style.setProperty('--box', box);
    pad.classList.toggle('nine', n === 9);
    for (let i = 0; i < n * n; i++) {
      const cell = element('button', 'cell');
      const row = Math.floor(i / n), col = i % n;
      cell.dataset.index = i;
      if (col === n - 1) cell.classList.add('end-col');
      else if ((col + 1) % box === 0) cell.classList.add('box-right');
      if (row === n - 1) cell.classList.add('end-row');
      else if ((row + 1) % box === 0) cell.classList.add('box-bottom');
      if (game.puzzle.givens[i]) cell.classList.add('given');
      board.append(cell);
    }
    for (let v = 1; v <= n; v++) {
      const key = element('button', 'key', String(v));
      key.dataset.value = v;
      pad.append(key);
    }
  }

  function render() {
    const { puzzle, values, notes } = game, n = puzzle.size;
    byId('page-number').textContent = t('page', { n: String(puzzle.number).padStart(2, '0') });
    byId('level').textContent = t(puzzle.group);
    byId('dimension').textContent = n + ' × ' + n;
    board.setAttribute('aria-label', t('board', { n }));
    const best = bestOf(puzzle);
    byId('best').textContent = best === null ? '—' : format(best);
    displayTime();
    const free = puzzle.givens.filter(v => !v).length;
    byId('fill').style.width = (100 * (free - state.empty) / free) + '%';
    byId('progress-label').textContent = t('left', { n: state.empty });
    for (let i = 0; i < values.length; i++) {
      const cell = board.children[i], v = values[i], mask = notes[i];
      const chosen = i === selected, bad = state.conflicts.has(i);
      cell.classList.toggle('selected', chosen);
      cell.classList.toggle('peer', game.peers[selected].has(i));
      cell.classList.toggle('same', !!v && values[selected] === v);
      cell.classList.toggle('bad', bad);
      cell.tabIndex = chosen ? 0 : -1;
      cell.setAttribute('aria-pressed', String(chosen));
      let description = v ? String(v) : t('empty');
      if (puzzle.givens[i]) description += ', ' + t('given');
      if (bad) description += ', ' + t('duplicate');
      if (mask) {
        const digits = Array.from({ length:n }, (_, k) => k + 1).filter(k => mask & (1 << k));
        description = t('notes') + ' ' + digits.join(', ');
      }
      cell.setAttribute('aria-label', t('square', {r: Math.floor(i / n) + 1, c: i % n + 1, v: description}));
      const signature = v + '/' + mask;
      if (cell.dataset.ink === signature) continue;
      cell.dataset.ink = signature;
      cell.textContent = v ? String(v) : '';
      if (mask) {
        const marks = element('span', 'marks');
        marks.setAttribute('aria-hidden','true');
        for (let k = 1; k <= n; k++) if (mask & (1 << k)) {
          const mark = element('span', '', String(k)), side = Math.sqrt(n);
          mark.style.gridRow = Math.floor((k - 1) / side) + 1;
          mark.style.gridColumn = (k - 1) % side + 1;
          marks.append(mark);
        }
        cell.append(marks);
      }
    }
    byId('pad-title').textContent = t(noteMode ? 'noteDigits' : 'digits');
    byId('notes').setAttribute('aria-pressed', String(noteMode));
    byId('notes').disabled = state.solved;
    byId('undo').disabled = !game.history.length || state.solved;
    byId('erase').disabled = state.solved || !!puzzle.givens[selected] || !(values[selected] || notes[selected]);
    for (const key of pad.children) {
      const v = Number(key.dataset.value);
      key.disabled = state.solved || !!puzzle.givens[selected] || (noteMode && !!values[selected]);
      key.classList.toggle('marked', noteMode ? !!(notes[selected] & (1 << v)) : values[selected] === v);
    }
    let message = 'rules';
    if (state.solved) message = 'solved';
    else if (state.conflicts.size) message = 'conflict';
    else if (puzzle.givens[selected]) message = 'fixed';
    else if (noteMode) message = values[selected] ? 'noteEmpty' : 'noteTip';
    const status = byId('status'), next = t(message, { n });
    if (status.textContent !== next) status.textContent = next;
    status.classList.toggle('alert', message === 'conflict');
    if (dialogType) renderDialog();
  }

  function selectCell(i, focus = false) {
    if (i < 0 || i >= game.values.length) return;
    selected = i;
    if (!state.solved) touchClock();
    render();
    if (focus) board.children[i].focus({ preventScroll:true });
  }
  function enter(digit) {
    if (state.solved || !edit(game, selected, digit, noteMode)) return;
    touchClock();
    state = inspect(game);
    if (state.solved) {
      stopClock();
      firstUnlock = game.puzzle.group === 'intro' && !unlocked();
      const previous = bestOf(game.puzzle);
      newBest = previous === null || Math.round(elapsed) < previous;
      if (newBest) save('best.' + game.puzzle.id, Math.round(elapsed));
    }
    keep();
    render();
    if (state.solved) showDialog('win');
  }
  function revert() {
    if (state.solved) return;
    const i = undo(game);
    if (i === null) return;
    selected = i;
    touchClock();
    state = inspect(game);
    keep();
    render();
  }
  function toggleNotes() {
    if (state.solved) return;
    noteMode = !noteMode;
    touchClock();
    render();
    keep();
  }

  function showDialog(type) {
    stopClock();
    keep();
    dialogType = type;
    renderDialog();
    if (!dialog.open) dialog.showModal();
  }
  function nextPuzzle() {
    const p = game.puzzle, group = puzzles.filter(q => q.group === p.group);
    if (p.group === 'intro') return puzzles.find(q => q.group === 'easy' && bestOf(q) === null) || puzzles[3];
    const index = puzzles.indexOf(p);
    return puzzles[index + 1] || group[0];
  }
  function choosePuzzle(p) {
    const draft = load('draft.' + p.id);
    const replay = bestOf(p) !== null && draft?.completed === true;
    openPuzzle(p, replay);
    board.children[selected].focus({ preventScroll:true });
  }
  function renderDialog() {
    const body = byId('dialog-body');
    body.replaceChildren();
    byId('dialog-title').textContent = t({help:'help', book:'album', win:'solved'}[dialogType]);
    const paragraph = (key, values) => body.append(element('p', '', t(key, values)));
    if (dialogType === 'help') {
      paragraph('rules', { n:game.puzzle.size });
      paragraph('touchHelp');
      paragraph('keyboard');
      paragraph('unlockHint');
    } else if (dialogType === 'book') {
      const isOpen = unlocked();
      for (const group of ['intro','easy','medium','hard']) {
        const row = element('section','book-row'), title = element('h3','',t(group));
        const locked = group !== 'intro' && !isOpen;
        if (locked) title.append(icon('lock'));
        title.append(element('span', 'book-size', group === 'intro' ? '4 × 4' : '9 × 9'));
        const choices = element('div', 'book-grid');
        for (const p of puzzles.filter(p => p.group === group)) {
          const button = element('button', '', String(p.number).padStart(2,'0'));
          button.disabled = locked;
          button.dataset.puzzle = p.id;
          const best = bestOf(p);
          let label = t(group) + ', ' + t('page', {n:p.number});
          if (best !== null) { button.append(icon('check')); label += ', ' + t('best') + ' ' + format(best); }
          button.setAttribute('aria-label', label);
          if (p.id === game.puzzle.id) { button.classList.add('current'); button.setAttribute('aria-current','true'); }
          choices.append(button);
        }
        row.append(title, choices);
        body.append(row);
      }
      paragraph(isOpen ? 'replayHint' : 'unlockHint');
    } else if (dialogType === 'win') {
      const stats = element('div', 'result-stats');
      for (const [key, ms] of [['time',elapsed],['best',bestOf(game.puzzle)]]) {
        const label = element('div','',t(key));
        label.append(element('b','',format(ms)));
        stats.append(label);
      }
      body.append(stats);
      if (newBest) body.append(element('p','record',t('record')));
      if (firstUnlock) paragraph('unlocked');
      const next = element('button','paper-button',t(game.puzzle.group === 'intro' ? 'toNine' : 'next'));
      next.dataset.puzzle = nextPuzzle().id;
      body.append(next);
    }
  }

  board.addEventListener('click', event => {
    const cell = event.target.closest('.cell');
    if (cell) selectCell(Number(cell.dataset.index));
  });
  pad.addEventListener('click', event => {
    const key = event.target.closest('.key');
    if (key) enter(Number(key.dataset.value));
  });
  byId('album-button').onclick = () => showDialog('book');
  byId('help-button').onclick = () => showDialog('help');
  byId('notes').onclick = toggleNotes;
  byId('erase').onclick = () => enter(0);
  byId('undo').onclick = revert;
  byId('close').onclick = () => dialog.close();
  byId('dialog-body').addEventListener('click', event => {
    const button = event.target.closest('button[data-puzzle]');
    if (button && !button.disabled) choosePuzzle(puzzles.find(p => p.id === button.dataset.puzzle));
  });
  dialog.addEventListener('close', () => { if (!dialog.open) { dialogType = ''; resumeClock(); } });
  document.addEventListener('keydown', event => {
    if (dialog.open || event.altKey) return;
    const key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey) {
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); revert(); }
      return;
    }
    const n = game.puzzle.size;
    if (/^[1-9]$/.test(key) && Number(key) <= n) { event.preventDefault(); if (!event.repeat) enter(Number(key)); }
    else if (key === 'backspace' || key === 'delete') { event.preventDefault(); enter(0); }
    else if (key === 'n') { event.preventDefault(); if (!event.repeat) toggleNotes(); }
    else if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
      event.preventDefault();
      let target = selected;
      if (key === 'arrowleft' && selected % n > 0) target--;
      if (key === 'arrowright' && selected % n < n - 1) target++;
      if (key === 'arrowup' && selected >= n) target -= n;
      if (key === 'arrowdown' && selected < n * (n - 1)) target += n;
      selectCell(target, true);
    }
  });
  const saved = puzzles.find(p => p.id === load('current'));
  openPuzzle(saved && (saved.group === 'intro' || unlocked()) ? saved : puzzles[0]);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopClock(); keep(); } else resumeClock();
  });
  window.addEventListener('pagehide', () => { stopClock(); keep(); });
  window.addEventListener('pageshow', resumeClock);
  window.addEventListener('boopland:languagechange', render);
})();
