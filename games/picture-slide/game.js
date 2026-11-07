(() => {
  'use strict';
  const E = window.PictureSlide, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('pictureSlide.' + key, values);
  const board = $('board'), dialog = $('dialog'), storageKey = 'boopland-picture-slide-v1';
  const pictures = { cottage: './assets/cottage.svg', coast: './assets/coast.svg', garden: './assets/garden.svg' };
  let records = {}, showNumbers = true, size = 3;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') {
      showNumbers = saved.numbers !== false;
      if (E.SIZES.includes(saved.size)) size = saved.size;
      E.SIZES.forEach(n => {
        const record = saved.records?.[n];
        if (record && Number.isInteger(record.moves) && record.moves > 0 && Number.isFinite(record.time) && record.time >= 0) {
          records[n] = { moves: record.moves, time: record.time };
        }
      });
    }
  } catch { /* The game also works with unavailable or malformed browser storage. */ }

  let state = E.create(size), imageId = 'cottage', imageUrl = pictures.cottage;
  let elapsed = 0, runningSince = null, started = false, statusKey = 'ready';
  let dialogKind = '', pendingAction = null, tileNodes = [], blankNode;
  let winTimer = null, pointer = null, suppressClickUntil = 0, uploadVersion = 0, newBest = false;

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ records, size: state.size, numbers: showNumbers })); }
    catch { /* Playing never depends on storage. */ }
  }
  function timeValue() { return elapsed + (runningSince === null ? 0 : performance.now() - runningSince); }
  function stopClock() {
    if (runningSince !== null) { elapsed += performance.now() - runningSince; runningSince = null; }
    renderTime();
  }
  function startClock() {
    if (started && !state.won && !dialog.open && !document.hidden && runningSince === null) runningSince = performance.now();
  }
  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function renderTime() { $('time').textContent = formatTime(timeValue()); }
  let timer = null;
  function beginTimer() { if (timer === null) timer = setInterval(renderTime, 250); }

  function position(node, index) {
    node.style.setProperty('--col', index % state.size);
    node.style.setProperty('--row', Math.floor(index / state.size));
  }
  function buildBoard() {
    board.replaceChildren(); tileNodes = [];
    board.style.setProperty('--size', state.size);
    board.dataset.size = state.size;
    for (let value = 1; value < state.size * state.size; value++) {
      const tile = document.createElement('button');
      tile.type = 'button'; tile.className = 'tile'; tile.dataset.value = value;
      tile.style.setProperty('--image-x', (value - 1) % state.size / (state.size - 1) * 100 + '%');
      tile.style.setProperty('--image-y', Math.floor((value - 1) / state.size) / (state.size - 1) * 100 + '%');
      const number = document.createElement('span'); number.className = 'tile-number'; number.textContent = value; number.setAttribute('aria-hidden', 'true');
      tile.append(number); board.append(tile); tileNodes.push(tile);
    }
    blankNode = document.createElement('div'); blankNode.className = 'blank';
    blankNode.setAttribute('aria-hidden', 'true');
    blankNode.innerHTML = '<svg viewBox="0 0 32 32"><path d="M8 4H4v5m20-5h4v5M4 23v5h5m19-5v5h-5M13 16h6m-3-3v6"/></svg>';
    board.append(blankNode); render(); fitBoard();
  }
  function renderImage() {
    board.style.setProperty('--picture', 'url("' + imageUrl + '")');
    $('reference-image').src = imageUrl;
    $('reference-image').alt = t(imageId);
    $('image-name').textContent = t(imageId);
    document.querySelectorAll('[data-image]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.image === imageId)));
  }
  function render() {
    let placed = 0;
    const movable = E.neighbors(state.blank, state.size);
    state.tiles.forEach((value, index) => {
      if (!value) return;
      const tile = tileNodes[value - 1], canMove = !state.won && movable.includes(index);
      position(tile, index); tile.dataset.index = index;
      tile.classList.toggle('movable', canMove);
      tile.setAttribute('aria-disabled', String(!canMove));
      tile.tabIndex = canMove ? 0 : -1;
      tile.setAttribute('aria-label', t('tileLabel', { value, row: Math.floor(index / state.size) + 1, col: index % state.size + 1 }) + ' ' + t(canMove ? 'movable' : 'notMovable'));
      if (value === index + 1) placed++;
    });
    position(blankNode, state.blank);
    board.dataset.won = String(state.won);
    board.classList.toggle('hide-numbers', !showNumbers);
    board.setAttribute('aria-label', t('boardLabel', { size: state.size, row: Math.floor(state.blank / state.size) + 1, col: state.blank % state.size + 1 }));
    $('moves').textContent = state.moves;
    $('placed').textContent = placed + ' / ' + (state.tiles.length - 1);
    $('status').textContent = t(state.won ? 'solved' : statusKey);
    $('undo').disabled = state.won || state.history.length === 0;
    $('restart').disabled = !started;
    $('pause').disabled = state.won;
    $('numbers').checked = showNumbers;
    $('size').value = state.size;
    const record = records[state.size];
    $('best').textContent = record ? t('bestValue', { moves: record.moves, time: formatTime(record.time) }) : t('noRecord');
    renderTime();
  }
  function rememberWin() {
    const previous = records[state.size];
    newBest = !previous || state.moves < previous.moves || (state.moves === previous.moves && elapsed < previous.time);
    if (newBest) records[state.size] = { moves: state.moves, time: Math.round(elapsed) };
    save();
  }
  function slide(index) {
    if (dialog.open || document.hidden || state.won) return false;
    if (!E.move(state, index)) { statusKey = 'blocked'; render(); return false; }
    started = true; statusKey = 'playing'; startClock();
    if (state.won) {
      stopClock(); rememberWin(); clearTimeout(winTimer);
      winTimer = setTimeout(() => { if (state.won && !dialog.open) openDialog('win'); }, 420);
    }
    render(); return true;
  }
  function undo() {
    if (dialog.open || document.hidden || !E.undo(state)) return;
    statusKey = 'undone'; render();
  }
  function resetClock() { runningSince = null; elapsed = 0; started = false; newBest = false; statusKey = 'ready'; clearTimeout(winTimer); pointer = null; }
  function newGame(nextSize = state.size) { resetClock(); state = E.create(nextSize); buildBoard(); save(); }
  function restart() { resetClock(); E.restart(state); render(); }
  function confirmAction(action) {
    if (started && !state.won) { pendingAction = action; openDialog('confirm'); }
    else action();
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function dialogButton(key, action, primary = false) {
    const button = element('button', primary ? 'primary' : '', t(key));
    button.type = 'button'; button.dataset.action = action; return button;
  }
  function renderDialog() {
    const content = $('dialog-content'); content.replaceChildren();
    const titleKeys = { help: 'help', pause: 'paused', reference: imageId, confirm: 'confirmTitle', win: 'winTitle', uploadError: 'uploadErrorTitle' };
    if (dialogKind === 'win') { const mark = element('div', 'win-mark', '✳'); mark.setAttribute('aria-hidden', 'true'); content.append(mark); }
    const heading = element('h2', '', t(titleKeys[dialogKind])); heading.id = 'dialog-title'; content.append(heading);
    const actions = element('div', 'dialog-actions');
    if (dialogKind === 'help') {
      const list = element('ol', 'rules');
      ['helpGoal', 'helpMove', 'helpNumbers', 'helpUndo', 'helpImage'].forEach(key => list.append(element('li', '', t(key))));
      content.append(list); actions.append(dialogButton('gotIt', 'close', true));
    } else if (dialogKind === 'reference') {
      const img = element('img', 'dialog-picture'); img.src = imageUrl; img.alt = t(imageId); content.append(img);
      actions.append(dialogButton('continue', 'close', true));
    } else if (dialogKind === 'pause') {
      content.append(element('p', '', t('pauseCopy'))); actions.append(dialogButton('continue', 'close', true));
    } else if (dialogKind === 'confirm') {
      content.append(element('p', '', t('confirmCopy')));
      actions.append(dialogButton('cancel', 'close'), dialogButton('confirm', 'confirm', true));
    } else if (dialogKind === 'win') {
      content.append(element('p', '', t(newBest ? 'newBest' : 'winCopy')));
      const stats = element('div', 'win-stats');
      [['moves', state.moves], ['time', formatTime(elapsed)]].forEach(([key, value]) => {
        const stat = element('div'); stat.append(element('span', '', t(key)), element('strong', '', value)); stats.append(stat);
      });
      content.append(stats); actions.append(dialogButton('admire', 'close'), dialogButton('again', 'again', true));
    } else if (dialogKind === 'uploadError') {
      content.append(element('p', '', t('uploadErrorCopy'))); actions.append(dialogButton('gotIt', 'close', true));
    }
    content.append(actions);
  }
  function openDialog(kind) {
    stopClock(); pointer = null; dialogKind = kind; renderDialog();
    document.body.classList.toggle('is-paused', kind === 'pause');
    if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => {
    dialogKind = ''; pendingAction = null; document.body.classList.remove('is-paused'); startClock(); render();
  });
  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'confirm') { const run = pendingAction; pendingAction = null; closeDialog(); if (run) run(); }
    else if (action === 'again') { closeDialog(); newGame(); }
    else closeDialog();
  });

  board.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); return; }
    const tile = event.target.closest('.tile');
    if (tile) slide(state.tiles.indexOf(Number(tile.dataset.value)));
  });
  board.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || dialog.open || state.won) return;
    const tile = event.target.closest('.tile');
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, value: tile ? Number(tile.dataset.value) : 0 };
    // Capture on the tile to preserve the normal click target for taps.
    event.target.setPointerCapture?.(event.pointerId);
  });
  board.addEventListener('pointerup', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const gesture = pointer; pointer = null;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    suppressClickUntil = performance.now() + 350;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const index = E.directionalIndex(state, direction);
    if (!gesture.value || state.tiles[index] === gesture.value) slide(index);
    else { statusKey = 'blocked'; render(); }
  });
  board.addEventListener('pointercancel', () => { pointer = null; });
  board.addEventListener('lostpointercapture', () => { pointer = null; });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
    if (dialog.open) return;
    const key = event.key.toLowerCase();
    const direction = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }[key];
    if (direction) { event.preventDefault(); slide(E.directionalIndex(state, direction)); }
    else if (key === 'z') { event.preventDefault(); undo(); }
    else if (key === 'r' && started) { event.preventDefault(); confirmAction(restart); }
    else if ((key === 'p' || key === 'escape') && !state.won) { event.preventDefault(); openDialog('pause'); }
  });
  $('undo').addEventListener('click', undo);
  $('restart').addEventListener('click', () => confirmAction(restart));
  $('shuffle').addEventListener('click', () => confirmAction(() => newGame()));
  $('size').addEventListener('change', event => { const nextSize = Number(event.target.value); $('size').value = state.size; confirmAction(() => newGame(nextSize)); });
  $('numbers').addEventListener('change', event => { showNumbers = event.target.checked; render(); save(); });
  $('help').addEventListener('click', () => openDialog('help'));
  $('pause').addEventListener('click', () => openDialog('pause'));
  $('reference').addEventListener('click', () => openDialog('reference'));
  $('close-dialog').addEventListener('click', closeDialog);
  document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
    uploadVersion++; $('upload').disabled = false;
    imageId = button.dataset.image; imageUrl = pictures[imageId]; renderImage();
    statusKey = 'imageChanged'; render();
  }));
  $('upload').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', () => {
    const file = $('file-input').files[0]; $('file-input').value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(file.type) || file.size > 10 * 1024 * 1024 || !file.size) { openDialog('uploadError'); return; }
    const version = ++uploadVersion, source = URL.createObjectURL(file), image = new Image();
    $('upload').disabled = true;
    let settled = false;
    const timeout = setTimeout(() => finish(false), 15000);
    function finish(success) {
      if (settled) return; settled = true; clearTimeout(timeout); URL.revokeObjectURL(source);
      if (version !== uploadVersion) return;
      $('upload').disabled = false;
      if (!success) { openDialog('uploadError'); return; }
      statusKey = 'imageChanged'; renderImage(); render();
    }
    image.onerror = () => finish(false);
    image.onload = () => {
      if (version !== uploadVersion) { finish(false); return; }
      try {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        if (!side || image.naturalWidth * image.naturalHeight > 50000000) { finish(false); return; }
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = Math.min(1200, side);
        const context = canvas.getContext('2d');
        context.fillStyle = '#fffef7'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
        imageUrl = canvas.toDataURL('image/jpeg', .92); imageId = 'custom'; finish(true);
      } catch { finish(false); }
    };
    image.src = source;
  });

  function fitBoard() {
    const area = $('board-area');
    const padding = getComputedStyle(area);
    const available = Math.max(80, Math.min(
      area.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight),
      area.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom), 520));
    area.style.setProperty('--board-size', available + 'px');
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitBoard).observe($('board-area'));
  window.addEventListener('resize', fitBoard);
  function suspend() {
    stopClock(); pointer = null;
    if (started && !state.won && !dialog.open) openDialog('pause');
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { suspend(); clearInterval(timer); timer = null; }
    else { beginTimer(); renderTime(); }
  });
  window.addEventListener('blur', suspend);
  window.addEventListener('pagehide', () => { stopClock(); clearInterval(timer); timer = null; });
  window.addEventListener('pageshow', () => { if (!document.hidden) beginTimer(); });
  window.addEventListener('boopland:languagechange', () => { renderImage(); render(); if (dialog.open) renderDialog(); });
  renderImage(); buildBoard(); if (!document.hidden) beginTimer();
})();
