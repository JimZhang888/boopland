(() => {
  'use strict';
  const P = window.PencilPuzzles, E = window.PencilEngine, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('nonogram.' + key, values);
  const storageKey = 'boopland-pencil-nonogram-v1';
  const finite = (value, max) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
  const fresh = puzzle => ({ board: Array(puzzle.size ** 2).fill(0), seconds: 0, hints: 0 });
  let canSave = true;
  function readSave() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* A fresh sheet also works without storage. */ }
    if (typeof raw !== 'object' || raw.version !== 1) raw = {};
    const result = { version: 1, current: P.some(p => p.id === raw.current) ? raw.current : P[0].id, pages: {}, album: {} };
    for (const puzzle of P) {
      const page = raw.pages?.[puzzle.id];
      if (page && Array.isArray(page.board) && page.board.length === puzzle.size ** 2 && page.board.every(v => [0, 1, -1].includes(v))) {
        result.pages[puzzle.id] = { board: page.board.slice(), seconds: finite(page.seconds, 360000), hints: finite(page.hints, 100000) };
      } else result.pages[puzzle.id] = fresh(puzzle);
      const record = raw.album?.[puzzle.id];
      if (record && typeof record === 'object') result.album[puzzle.id] = { seconds: finite(record.seconds, 360000), hints: finite(record.hints, 100000) };
      if (E.solved(result.pages[puzzle.id].board, puzzle) && !result.album[puzzle.id]) {
        const page = result.pages[puzzle.id];
        result.album[puzzle.id] = { seconds: page.seconds, hints: page.hints };
      }
    }
    return result;
  }
  const saved = readSave(), histories = Object.fromEntries(P.map(p => [p.id, []]));
  let index = Math.max(0, P.findIndex(p => p.id === saved.current)), puzzle, page, clueSet, cells = [], rowClues = [], colClues = [];
  let mode = 1, focusIndex = 0, stroke = null, finished = false, mistakes = new Set(), hintIndex = -1;
  let statusKey = 'untouched', statusValues = {}, activeMs = 0, lastTick = performance.now(), hovering = -1;
  let resultTimer = null;
  const board = $('board'), dialogs = [...document.querySelectorAll('dialog')];
  const countCollected = () => Object.keys(saved.album).length;
  const formatTime = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); canSave = true; }
    catch { canSave = false; }
  }
  function setStatus(key, values = {}) {
    statusKey = key; statusValues = values;
    $('status').textContent = t(canSave ? key : 'noSave', values);
  }
  function art(p, mystery = false) {
    if (mystery) return '<svg class="mystery-art" viewBox="0 0 100 100" aria-hidden="true"><path d="M23 19 79 20 77 82 21 80Zm6 13h12m-12 7h8m29 29h8M29 62v9h10"/><path d="M41 41c0-14 24-12 21 1-1 5-12 5-11 14m0 8v1"/><path d="m34 15 35 1-1 10-35-1Z" fill="#dbddc9" stroke="none"/></svg>';
    const n = p.size;
    const shapes = p.solution.flatMap((v, i) => v ? [`<rect x="${i % n * 10 + .6}" y="${Math.floor(i / n) * 10 + .6}" width="8.8" height="8.8" rx=".7"/>`] : []).join('');
    return `<svg class="pixel-art" viewBox="0 0 ${n * 10} ${n * 10}" aria-hidden="true"><g fill="${p.color}">${shapes}</g><g stroke="#fffef7" stroke-width=".35" opacity=".35">${p.solution.flatMap((v, i) => v ? [`<path d="m${i % n * 10 + 2} ${Math.floor(i / n) * 10 + 7} 5-5m-4 6 5-5"/>`] : []).join('')}</g></svg>`;
  }
  function renderCollection() {
    const count = countCollected();
    $('album-count').textContent = `${count}/12`;
    $('album').setAttribute('aria-label', `${t('album')}: ${t('albumTotal', { n: count })}`);
    const last = P.find(p => p.id === Object.keys(saved.album).at(-1));
    $('collection-preview').innerHTML = art(last || P[0], !last);
    $('collection-caption').textContent = last ? t(last.name) : t('collectionEmpty');
  }
  function renderCells() {
    const n = puzzle.size;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i], value = page.board[i];
      cell.classList.toggle('is-filled', value === 1);
      cell.classList.toggle('is-crossed', value === -1);
      cell.classList.toggle('is-error', mistakes.has(i));
      cell.classList.toggle('is-hint', hintIndex === i);
      cell.setAttribute('aria-label', t('cellLabel', { r: Math.floor(i / n) + 1, c: i % n + 1, state: t(value === 1 ? 'filled' : value === -1 ? 'crossed' : 'empty') }));
      cell.setAttribute('aria-selected', String(value === 1));
      cell.setAttribute('aria-disabled', String(finished));
      cell.tabIndex = i === focusIndex ? 0 : -1;
    }
    rowClues.forEach((node, r) => {
      node.classList.toggle('is-complete', E.equal(E.runs(page.board.slice(r * n, (r + 1) * n)), clueSet.rows[r]));
      node.setAttribute('aria-label', t('rowLabel', { n: r + 1, clues: clueSet.rows[r].join(', ') }));
    });
    colClues.forEach((node, c) => {
      node.classList.toggle('is-complete', E.equal(E.runs(Array.from({ length: n }, (_, r) => page.board[r * n + c])), clueSet.cols[c]));
      node.setAttribute('aria-label', t('colLabel', { n: c + 1, clues: clueSet.cols[c].join(', ') }));
    });
    board.classList.toggle('is-solved', finished);
    const filled = page.board.filter(v => v === 1).length, total = puzzle.solution.reduce((a, b) => a + b, 0);
    $('progress').textContent = `${filled} / ${total}`;
    $('progress-fill').style.width = Math.min(100, filled / total * 100) + '%';
    $('undo').disabled = finished || !histories[puzzle.id].length;
    $('check').disabled = finished;
    $('hint').disabled = finished;
    document.querySelectorAll('[data-mode]').forEach(node => { node.disabled = finished; });
  }
  function renderText() {
    $('page-number').textContent = String(index + 1).padStart(2, '0');
    $('puzzle-title').textContent = finished ? t(puzzle.name) : t('puzzleTitle');
    $('puzzle-size').textContent = `${puzzle.size} × ${puzzle.size}`;
    $('chapter-name').textContent = t('chapter' + puzzle.chapter);
    $('page-label').textContent = t('pageLabel', { n: index + 1 });
    $('time').textContent = formatTime(page.seconds);
    setStatus(statusKey, statusValues);
    renderCollection(); renderCells();
  }
  function buildBoard() {
    const n = puzzle.size;
    clueSet = E.clues(puzzle);
    $('board-frame').style.setProperty('--n', n);
    board.style.setProperty('--art-color', puzzle.color);
    board.setAttribute('aria-rowcount', n); board.setAttribute('aria-colcount', n);
    board.replaceChildren(); $('row-clues').replaceChildren(); $('column-clues').replaceChildren();
    rowClues = []; colClues = []; cells = [];
    for (let i = 0; i < n; i++) {
      for (const [kind, host, nodes, numbers] of [['row', $('row-clues'), rowClues, clueSet.rows[i]], ['col', $('column-clues'), colClues, clueSet.cols[i]]]) {
        const node = document.createElement('div');
        node.className = `clue ${kind}-clue`; node.id = `${kind}-clue-${i}`; node.setAttribute('role', 'note');
        for (const number of numbers) { const span = document.createElement('span'); span.textContent = number; node.append(span); }
        nodes.push(node); host.append(node);
      }
      const row = document.createElement('div'); row.className = 'board-row'; row.setAttribute('role', 'row');
      for (let c = 0; c < n; c++) {
        const cell = document.createElement('button'), cellIndex = i * n + c;
        cell.type = 'button'; cell.className = 'cell'; cell.dataset.index = cellIndex; cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-rowindex', i + 1); cell.setAttribute('aria-colindex', c + 1);
        cell.setAttribute('aria-describedby', `row-clue-${i} col-clue-${c}`);
        cell.classList.toggle('group-right', (c + 1) % 5 === 0 || c === n - 1);
        cell.classList.toggle('group-bottom', (i + 1) % 5 === 0 || i === n - 1);
        cells.push(cell); row.append(cell);
      }
      board.append(row);
    }
  }
  function resizeBoard() {
    if (!puzzle) return;
    const host = $('board-space'), style = getComputedStyle(host);
    const width = host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = host.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const n = puzzle.size, maxRow = Math.max(...clueSet.rows.map(row => row.join(' ').length)), maxCol = Math.max(...clueSet.cols.map(col => col.length));
    let size = Math.min(n === 5 ? 61 : 44, width / n, height / n), font = 15, cw = 40, ch = 40;
    for (let pass = 0; pass < 5; pass++) {
      font = Math.max(10, Math.min(17, size * .42));
      cw = Math.ceil(maxRow * font * .57 + 12); ch = Math.ceil(maxCol * (font * 1.2 + 2) + 8);
      size = Math.max(12, Math.floor(Math.min(n === 5 ? 61 : 44, (width - cw - 3) / n, (height - ch - 3) / n)));
    }
    const frame = $('board-frame');
    frame.style.setProperty('--cell', size + 'px'); frame.style.setProperty('--clue-font', font + 'px');
    frame.style.setProperty('--clue-w', cw + 'px'); frame.style.setProperty('--clue-h', ch + 'px');
  }
  function loadPuzzle(next) {
    finishStroke(); clearTimeout(resultTimer); resultTimer = null;
    index = next; puzzle = P[index]; page = saved.pages[puzzle.id]; saved.current = puzzle.id;
    focusIndex = 0; hovering = -1; activeMs = 0; lastTick = performance.now(); mistakes.clear(); hintIndex = -1;
    finished = E.solved(page.board, puzzle);
    statusKey = finished ? 'complete' : page.board.some(v => v !== 0) ? 'inProgress' : 'untouched'; statusValues = {};
    buildBoard(); persist(); renderText(); resizeBoard();
  }
  function markHistory(before) {
    const list = histories[puzzle.id]; list.push(before);
    if (list.length > 200) list.shift();
  }
  function nextUnfinished() {
    for (let step = 1; step <= P.length; step++) {
      const next = (index + step) % P.length;
      if (!saved.album[P[next].id]) return next;
    }
    return -1;
  }
  function fillResult() {
    $('result-art').innerHTML = art(puzzle);
    $('result-title').textContent = t(puzzle.name);
    $('result-copy').textContent = countCollected() === 12 ? t('allDone') : t('resultCopy', { name: t(puzzle.name) });
    $('result-stats').textContent = t('resultStats', { time: formatTime(page.seconds), hints: page.hints });
    $('next-page').textContent = t(nextUnfinished() < 0 ? 'allCollected' : 'next');
  }
  function complete() {
    if (finished || !E.solved(page.board, puzzle)) return false;
    finished = true; mistakes.clear(); hintIndex = -1;
    const old = saved.album[puzzle.id];
    if (!old || page.hints < old.hints || page.hints === old.hints && page.seconds < old.seconds) saved.album[puzzle.id] = { seconds: page.seconds, hints: page.hints };
    persist(); setStatus('complete'); renderText(); fillResult();
    resultTimer = setTimeout(() => { resultTimer = null; if (finished && !dialogs.some(d => d.open)) openDialog('result-dialog'); }, 480);
    return true;
  }
  function afterEdit() {
    if (!complete()) { persist(); renderCells(); }
  }
  function setMode(next) {
    mode = next;
    document.querySelectorAll('[data-mode]').forEach(node => node.setAttribute('aria-pressed', String(Number(node.dataset.mode) === mode)));
  }
  function focusCell(next, focus = true) {
    focusIndex = Math.max(0, Math.min(cells.length - 1, next));
    cells.forEach((cell, i) => { cell.tabIndex = i === focusIndex ? 0 : -1; });
    if (focus) cells[focusIndex].focus({ preventScroll: true });
  }
  function highlightCell(i) {
    if (hovering === i) return;
    hovering = i;
    cells.forEach((cell, j) => cell.classList.toggle('is-hover', j === i));
    rowClues.forEach((node, r) => node.classList.toggle('is-active', i >= 0 && r === Math.floor(i / puzzle.size)));
    colClues.forEach((node, c) => node.classList.toggle('is-active', i >= 0 && c === i % puzzle.size));
  }
  function editCell(i, value, toggle = true) {
    if (finished) return;
    const before = page.board.slice(), target = toggle && page.board[i] === value ? 0 : value;
    if (page.board[i] === target) return;
    page.board[i] = target; markHistory(before); mistakes.clear(); hintIndex = -1;
    setStatus('inProgress'); afterEdit();
  }
  function indexAt(x, y) {
    const first = cells[0].getBoundingClientRect(), cellSize = first.width, n = puzzle.size;
    const col = Math.floor((x - first.left) / cellSize), row = Math.floor((y - first.top) / cellSize);
    return col < 0 || col >= n || row < 0 || row >= n ? -1 : row * n + col;
  }
  function paintTo(next) {
    if (!stroke || next < 0) return;
    const n = puzzle.size, previous = stroke.last;
    const r0 = Math.floor(previous / n), c0 = previous % n, r1 = Math.floor(next / n), c1 = next % n;
    // Interpolate skipped pointer samples, so quick swipes do not leave holes.
    const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0), 1);
    for (let step = 0; step <= steps; step++) {
      const row = Math.round(r0 + (r1 - r0) * step / steps), col = Math.round(c0 + (c1 - c0) * step / steps);
      page.board[row * n + col] = stroke.value;
    }
    stroke.last = next; highlightCell(next); renderCells();
  }
  function finishStroke(event) {
    if (!stroke || event && event.pointerId !== stroke.pointerId) return;
    const previous = stroke; stroke = null;
    if (board.hasPointerCapture?.(previous.pointerId)) board.releasePointerCapture(previous.pointerId);
    if (!E.equal(previous.before, page.board)) { markHistory(previous.before); afterEdit(); }
    highlightCell(-1);
  }
  board.addEventListener('pointerdown', event => {
    if (finished || stroke || ![0, 2].includes(event.button) || event.isPrimary === false) return;
    const i = indexAt(event.clientX, event.clientY); if (i < 0) return;
    event.preventDefault(); focusCell(i, event.pointerType !== 'touch');
    const tool = event.button === 2 ? -1 : mode, value = page.board[i] === tool ? 0 : tool;
    stroke = { pointerId: event.pointerId, before: page.board.slice(), value, last: i };
    mistakes.clear(); hintIndex = -1; setStatus('inProgress');
    board.setPointerCapture(event.pointerId); paintTo(i);
  });
  board.addEventListener('pointermove', event => {
    if (finished) return;
    const i = indexAt(event.clientX, event.clientY);
    if (stroke && stroke.pointerId === event.pointerId) { event.preventDefault(); paintTo(i); }
    else if (!stroke) highlightCell(i);
  });
  board.addEventListener('pointerleave', () => { if (!stroke) highlightCell(-1); });
  board.addEventListener('pointerup', finishStroke);
  board.addEventListener('pointercancel', finishStroke);
  board.addEventListener('lostpointercapture', finishStroke);
  board.addEventListener('contextmenu', event => event.preventDefault());
  board.addEventListener('click', event => {
    // Keyboard and assistive-technology activation has no preceding pointer stroke.
    if (event.detail === 0 && event.target.closest('.cell')) editCell(Number(event.target.closest('.cell').dataset.index), mode);
  });
  board.addEventListener('focusin', event => { const cell = event.target.closest('.cell'); if (cell) { focusCell(Number(cell.dataset.index), false); highlightCell(focusIndex); } });
  board.addEventListener('keydown', event => {
    const n = puzzle.size, row = Math.floor(focusIndex / n), col = focusIndex % n;
    const movement = { ArrowLeft: row * n + Math.max(0, col - 1), ArrowRight: row * n + Math.min(n - 1, col + 1), ArrowUp: Math.max(0, row - 1) * n + col, ArrowDown: Math.min(n - 1, row + 1) * n + col, Home: row * n, End: row * n + n - 1 };
    if (event.key in movement) { event.preventDefault(); focusCell(movement[event.key]); }
    else if (event.key === ' ' || event.key.toLowerCase() === 'x' || ['Backspace', 'Delete'].includes(event.key)) {
      event.preventDefault(); if (event.repeat) return;
      editCell(focusIndex, event.key === ' ' ? 1 : event.key.toLowerCase() === 'x' ? -1 : 0);
    }
  });
  function undo() {
    if (finished || !histories[puzzle.id].length) return;
    finishStroke(); page.board = histories[puzzle.id].pop(); mistakes.clear(); hintIndex = -1;
    setStatus('inProgress'); persist(); renderCells();
  }
  $('undo').addEventListener('click', undo);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey && !dialogs.some(d => d.open)) { event.preventDefault(); undo(); }
  });
  document.querySelectorAll('[data-mode]').forEach(node => node.addEventListener('click', () => setMode(Number(node.dataset.mode))));
  $('check').addEventListener('click', () => {
    mistakes = new Set(E.mistakes(page.board, puzzle)); hintIndex = -1;
    setStatus(mistakes.size ? 'errors' : 'correct', { n: mistakes.size }); renderCells();
  });
  $('hint').addEventListener('click', () => {
    if (finished) return;
    const suggestion = E.hint(page.board, puzzle); if (!suggestion) return;
    markHistory(page.board.slice()); page.board[suggestion.index] = suggestion.value; page.hints++;
    hintIndex = suggestion.index; mistakes.clear(); focusCell(suggestion.index, false);
    setStatus(suggestion.correction ? 'hintCorrect' : suggestion.value === 1 ? 'hintFill' : 'hintCross');
    afterEdit();
  });
  function openDialog(id) {
    finishStroke(); clearTimeout(resultTimer); resultTimer = null;
    dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
    lastTick = performance.now(); $(id).showModal();
  }
  dialogs.forEach(dialog => {
    dialog.querySelectorAll('[data-close]').forEach(node => node.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => { lastTick = performance.now(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  function renderPages() {
    const host = $('pages-list'); host.replaceChildren();
    for (let chapter = 0; chapter < 3; chapter++) {
      const heading = document.createElement('h3'); heading.className = 'chapter-heading'; heading.textContent = t('chapter' + chapter);
      const small = document.createElement('small'), size = [5, 8, 10][chapter]; small.textContent = `${size} × ${size}`; heading.append(small);
      const group = document.createElement('div'); group.className = 'pages-grid';
      P.forEach((p, i) => {
        if (p.chapter !== chapter) return;
        const button = document.createElement('button'), collected = !!saved.album[p.id], started = saved.pages[p.id].board.some(v => v !== 0);
        button.className = 'page-card'; button.setAttribute('aria-current', String(i === index));
        button.innerHTML = `<span class="page-index">${String(i + 1).padStart(2, '0')}</span>${collected ? '<span class="page-check" aria-hidden="true">✓</span>' : ''}<small></small>`;
        button.querySelector('small').textContent = t(collected ? p.name : started ? 'pageProgress' : 'pageEmpty');
        button.setAttribute('aria-label', `${t('pageLabel', { n: i + 1 })} · ${size} × ${size} · ${t(collected ? p.name : started ? 'pageProgress' : 'pageEmpty')}`);
        button.addEventListener('click', () => { $('pages-dialog').close(); loadPuzzle(i); }); group.append(button);
      });
      host.append(heading, group);
    }
  }
  function renderAlbum() {
    $('album-total').textContent = t('albumTotal', { n: countCollected() });
    const host = $('album-grid'); host.replaceChildren();
    P.forEach((p, i) => {
      const record = saved.album[p.id], node = document.createElement('button'); node.className = 'album-card' + (record ? ' is-collected' : '');
      node.innerHTML = `<span class="page-index">${String(i + 1).padStart(2, '0')}</span>${art(p, !record)}<b></b><small></small>`;
      node.querySelector('b').textContent = t(record ? p.name : 'pageEmpty');
      node.querySelector('small').textContent = record ? t('pageDone') : `${p.size} × ${p.size}`;
      node.setAttribute('aria-label', `${t('pageLabel', { n: i + 1 })} · ${t(record ? p.name : 'pageEmpty')}`);
      node.addEventListener('click', () => { $('album-dialog').close(); loadPuzzle(i); }); host.append(node);
    });
  }
  const showAlbum = () => { renderAlbum(); openDialog('album-dialog'); };
  $('album').addEventListener('click', showAlbum); $('collection-note').addEventListener('click', showAlbum); $('result-album').addEventListener('click', showAlbum);
  $('levels').addEventListener('click', () => { renderPages(); openDialog('pages-dialog'); });
  $('help').addEventListener('click', () => openDialog('help-dialog'));
  $('restart').addEventListener('click', () => openDialog('restart-dialog'));
  $('confirm-restart').addEventListener('click', () => {
    $('restart-dialog').close(); saved.pages[puzzle.id] = fresh(puzzle); histories[puzzle.id] = []; loadPuzzle(index);
  });
  $('next-page').addEventListener('click', () => {
    const next = nextUnfinished(); $('result-dialog').close();
    if (next < 0) showAlbum(); else loadPuzzle(next);
  });
  function tick() {
    const now = performance.now(), delta = now - lastTick; lastTick = now;
    if (!page || finished || document.hidden || !document.hasFocus() || dialogs.some(d => d.open) || delta > 2000) return;
    activeMs += delta;
    if (activeMs >= 1000) {
      page.seconds = Math.min(360000, page.seconds + Math.floor(activeMs / 1000)); activeMs %= 1000;
      $('time').textContent = formatTime(page.seconds);
      if (page.seconds % 5 === 0) persist();
    }
  }
  setInterval(tick, 500);
  document.addEventListener('visibilitychange', () => { finishStroke(); lastTick = performance.now(); persist(); });
  window.addEventListener('blur', () => { finishStroke(); lastTick = performance.now(); persist(); });
  window.addEventListener('focus', () => { lastTick = performance.now(); });
  window.addEventListener('pagehide', () => { finishStroke(); persist(); });
  window.addEventListener('boopland:languagechange', () => {
    renderText();
    if ($('pages-dialog').open) renderPages(); if ($('album-dialog').open) renderAlbum(); if ($('result-dialog').open) fillResult();
    resizeBoard();
  });
  new ResizeObserver(resizeBoard).observe($('board-space'));
  loadPuzzle(index);
})();
