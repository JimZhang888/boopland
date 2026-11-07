(() => {
  'use strict';
  const E = window.CatSokoban, maps = window.CatSokobanLevels;
  const levels = maps.map(map => E.parse(map.rows));
  const i18n = window.BooplandI18n, t = (key, values) => i18n.t('catSokoban.' + key, values);
  const $ = id => document.getElementById(id);
  const board = $('board'), dialog = $('dialog'), content = $('dialog-content');
  const storageKey = 'boopland-cat-sokoban-v1', svgNS = 'http://www.w3.org/2000/svg';
  let current = 0, records = {}, state, cat, crates = [], statusKey = 'ready';
  let dialogMode = '', winTimer = 0, newBest = false, pointer = null, lastKeyMove = 0;

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || saved.version !== 1) return '';
      current = Number.isInteger(saved.level) && saved.level >= 0 && saved.level < levels.length ? saved.level : 0;
      maps.forEach(map => {
        const record = saved.records?.[map.id];
        if (record && Number.isInteger(record.moves) && record.moves > 0 && record.moves <= 20000 &&
          Number.isInteger(record.pushes) && record.pushes > 0 && record.pushes <= record.moves) records[map.id] = { moves: record.moves, pushes: record.pushes };
      });
      return saved.replay;
    } catch { return ''; }
  }

  function saveProgress() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, level: current, records, replay: E.serialize(state) }));
    } catch { /* A blocked or full storage area never prevents playing. */ }
  }

  function svg(tag, attributes = {}, children = []) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    children.forEach(child => element.append(child));
    return element;
  }

  function use(name, size = 64) { return svg('use', { href: '#' + name, width: size, height: size }); }
  function position(element, cell) {
    const x = cell % state.level.width, y = Math.floor(cell / state.level.width);
    element.style.transform = `translate(${x * 64}px, ${y * 64}px)`;
    element.dataset.cell = String(cell);
  }

  function buildBoard() {
    const level = state.level;
    board.setAttribute('viewBox', `-3 -3 ${level.width * 64 + 6} ${level.height * 64 + 6}`);
    board.innerHTML = window.CatSokobanArt;
    const terrain = svg('g', { 'aria-hidden': 'true' });
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) {
      const cell = y * level.width + x;
      if (level.floors.has(cell)) {
        terrain.append(svg('rect', { x: x * 64, y: y * 64, width: 64, height: 64, fill: 'url(#floor)' }));
        if (level.goals.has(cell)) terrain.append(svg('use', { href: '#goal-art', x: x * 64, y: y * 64, width: 64, height: 64 }));
      } else terrain.append(svg('use', { href: '#wall-art', x: x * 64, y: y * 64, width: 64, height: 64 }));
    }
    board.append(terrain);
    crates = state.boxes.map(cell => {
      const mark = svg('g', { class: 'check' }, [
        svg('circle', { cx: 50, cy: 49, r: 8, fill: '#5b7352', stroke: '#fffdf5', 'stroke-width': 1.5 }),
        svg('path', { d: 'M46 49l3 3 5-6', stroke: '#fffdf5', fill: 'none', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      ]);
      const crate = svg('g', { class: 'actor crate', 'aria-hidden': 'true' }, [use('crate-art'), mark]);
      position(crate, cell); board.append(crate); return crate;
    });
    cat = svg('g', { class: 'actor cat', 'data-facing': 'down', 'aria-hidden': 'true' }, [svg('g', { class: 'cat-face' }, [use('cat-art')])]);
    position(cat, state.player); board.append(cat);
    update();
  }

  function update() {
    const placed = E.placed(state), best = records[maps[current].id];
    $('chapter').textContent = t('chapter', { level: String(current + 1).padStart(2, '0'), total: levels.length });
    $('level-name').textContent = t('level' + (current + 1));
    $('moves').textContent = state.moves;
    $('pushes').textContent = state.pushes;
    $('placed').textContent = `${placed} / ${state.boxes.length}`;
    $('best').textContent = best ? t('bestValue', best) : '—';
    $('progress').textContent = t('progress', { count: Object.keys(records).length, total: levels.length });
    $('undo').disabled = state.history.length === 0;
    $('restart').disabled = state.moves === 0;
    $('next').hidden = !state.won;
    $('next').querySelector('span').textContent = t(current === levels.length - 1 ? 'chooseLevel' : 'next');
    document.querySelectorAll('[data-direction]').forEach(button => { button.disabled = state.won; });
    $('status').textContent = t(state.won ? 'solved' : statusKey);
    $('status').parentElement.classList.toggle('warning', !state.won && statusKey === 'stuck');
    board.setAttribute('aria-label', t('boardLabel', { level: current + 1, row: Math.floor(state.player / state.level.width) + 1, col: state.player % state.level.width + 1, placed, total: state.boxes.length }));
    board.dataset.won = String(state.won);
    position(cat, state.player);
    state.boxes.forEach((cell, index) => {
      position(crates[index], cell);
      crates[index].classList.toggle('is-placed', state.level.goals.has(cell));
    });
  }

  function loadLevel(index) {
    clearTimeout(winTimer); pointer = null; newBest = false;
    current = index; state = E.create(levels[current]); statusKey = 'ready';
    buildBoard(); saveProgress();
  }

  function rememberWin() {
    const previous = records[maps[current].id];
    newBest = !previous || state.moves < previous.moves || (state.moves === previous.moves && state.pushes < previous.pushes);
    if (newBest) records[maps[current].id] = { moves: state.moves, pushes: state.pushes };
  }

  function move(direction) {
    if (dialog.open || document.hidden || state.won) return;
    cat.dataset.facing = direction;
    const result = E.move(state, direction);
    if (!result.moved) {
      statusKey = E.deadlocked(state) ? 'stuck' : 'blocked';
      cat.classList.remove('bump');
      // Restart the short blocked-move feedback without animating the whole board.
      void cat.getBoundingClientRect(); cat.classList.add('bump');
      update(); return;
    }
    statusKey = E.deadlocked(state) ? 'stuck' : 'ready';
    if (state.won) {
      rememberWin();
      const completedState = state;
      clearTimeout(winTimer);
      winTimer = setTimeout(() => { if (state === completedState && state.won && !dialog.open && !document.hidden) openDialog('win'); }, 230);
    }
    update(); saveProgress();
  }

  function undo() {
    clearTimeout(winTimer);
    if (!E.undo(state)) return;
    statusKey = E.deadlocked(state) ? 'stuck' : 'undone'; newBest = false;
    update(); saveProgress();
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function action(textKey, name, primary = false) {
    const button = node('button', primary ? 'primary' : '', t(textKey));
    button.type = 'button'; button.dataset.action = name; return button;
  }

  function renderDialog() {
    const oldFocus = document.activeElement?.dataset;
    const focusedAction = oldFocus?.action, focusedLevel = oldFocus?.level;
    content.replaceChildren();
    if (dialogMode === 'help') {
      $('dialog-title').textContent = t('help');
      content.append(node('p', 'dialog-copy', t('helpGoal')));
      const list = node('ol', 'help-list');
      ['helpMove', 'helpPush', 'helpUndo'].forEach(key => list.append(node('li', '', t(key))));
      content.append(list, node('p', 'dialog-copy', t('helpSave')));
      const actions = node('div', 'dialog-actions'); actions.append(action('gotIt', 'close', true)); content.append(actions);
    } else if (dialogMode === 'levels') {
      $('dialog-title').textContent = t('chooseLevel');
      content.append(node('p', 'dialog-copy', t('pickCopy')));
      const grid = node('div', 'level-grid');
      maps.forEach((map, index) => {
        const best = records[map.id], button = node('button', 'level-choice' + (best ? ' completed' : ''));
        button.type = 'button'; button.dataset.level = index;
        button.setAttribute('aria-current', String(index === current));
        button.setAttribute('aria-label', t('levelLabel', { level: index + 1, name: t('level' + (index + 1)), detail: best ? t('completed') + ', ' + t('bestValue', best) : t('fresh') }));
        button.append(node('strong', '', String(index + 1).padStart(2, '0')), node('small', '', best ? '✓ ' + t('bestValue', best) : '· · ·'));
        grid.append(button);
      });
      content.append(grid, node('p', 'dialog-copy', t('progress', { count: Object.keys(records).length, total: levels.length })));
    } else if (dialogMode === 'win') {
      const allDone = Object.keys(records).length === levels.length;
      $('dialog-title').textContent = t(allDone ? 'allTitle' : 'winTitle');
      const art = svg('svg', { viewBox: '0 0 64 64', class: 'win-art', 'aria-hidden': 'true' }, [use('cat-art')]);
      content.append(art, node('p', 'dialog-copy win-copy', t(allDone ? 'allCopy' : 'winCopy')));
      const stats = node('div', 'win-stats');
      ['moves', 'pushes'].forEach(key => { const item = node('span'); item.append(node('strong', '', state[key]), document.createTextNode(t(key))); stats.append(item); });
      content.append(stats);
      if (newBest) content.append(node('p', 'win-best', t('newBest')));
      const actions = node('div', 'dialog-actions');
      actions.append(action('again', 'restart'), action(current < levels.length - 1 ? 'next' : 'chooseLevel', 'next', true));
      content.append(actions);
    }
    if (focusedAction) content.querySelector(`[data-action="${focusedAction}"]`)?.focus();
    else if (focusedLevel !== undefined) content.querySelector(`[data-level="${focusedLevel}"]`)?.focus();
  }

  function openDialog(mode) {
    clearTimeout(winTimer); pointer = null; dialogMode = mode;
    renderDialog(); if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { dialog.close(); dialogMode = ''; }
  function next() {
    if (!state.won) return;
    if (current === levels.length - 1) openDialog('levels');
    else { closeDialog(); loadLevel(current + 1); board.focus({ preventScroll: true }); }
  }

  $('help').addEventListener('click', () => openDialog('help'));
  $('levels').addEventListener('click', () => openDialog('levels'));
  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', () => loadLevel(current));
  $('next').addEventListener('click', next);
  $('close-dialog').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => { dialogMode = ''; });
  content.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.level !== undefined) { closeDialog(); loadLevel(Number(button.dataset.level)); board.focus({ preventScroll: true }); }
    else if (button.dataset.action === 'close') closeDialog();
    else if (button.dataset.action === 'restart') { closeDialog(); loadLevel(current); board.focus({ preventScroll: true }); }
    else if (button.dataset.action === 'next') next();
  });
  document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => move(button.dataset.direction)));
  const keyDirections = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || dialog.open || document.hidden || event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (keyDirections[key]) {
      event.preventDefault();
      const now = performance.now();
      if (event.repeat && now - lastKeyMove < 110) return;
      lastKeyMove = now; move(keyDirections[key]);
    } else if (key === 'z') { event.preventDefault(); undo(); }
    else if (key === 'r' && !event.repeat) { event.preventDefault(); loadLevel(current); }
    else if (key === '?' && !event.repeat) { event.preventDefault(); openDialog('help'); }
  });

  board.addEventListener('pointerdown', event => {
    if (event.button !== 0 || dialog.open || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    board.setPointerCapture(event.pointerId);
    board.focus({ preventScroll: true });
  });
  board.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer = null;
    if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    else {
      const matrix = board.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const x = Math.floor(point.x / 64), y = Math.floor(point.y / 64);
      if (x < 0 || y < 0 || x >= state.level.width || y >= state.level.height) return;
      const cell = y * state.level.width + x;
      const direction = Object.keys(E.DIRECTIONS).find(name => E.neighbor(state.level, state.player, name) === cell);
      if (direction) move(direction);
    }
  });
  board.addEventListener('pointercancel', () => { pointer = null; });
  board.addEventListener('lostpointercapture', () => { pointer = null; });
  document.addEventListener('visibilitychange', () => { pointer = null; clearTimeout(winTimer); });
  window.addEventListener('blur', () => { pointer = null; });
  window.addEventListener('boopland:languagechange', () => { update(); if (dialog.open) renderDialog(); });

  const savedReplay = readProgress();
  state = E.replay(levels[current], savedReplay);
  statusKey = E.deadlocked(state) ? 'stuck' : 'ready';
  if (state.won) rememberWin();
  buildBoard();
})();
