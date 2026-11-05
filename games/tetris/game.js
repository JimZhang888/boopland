(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t(`tetris.${key}`, values);
  const game = new TetrisGame();
  const board = $('board');
  const ctx = board.getContext('2d');
  const next = $('next');
  const nctx = next.getContext('2d');
  const palette = { I: '#83adb1', O: '#d4b56c', T: '#ad9aba', S: '#9eae7c', Z: '#ca8e83', J: '#8d9fb8', L: '#c7a079' };
  const bestKey = 'boopland-tetris-best';
  let best = 0;
  try { best = Math.max(0, Number(localStorage.getItem(bestKey)) || 0); if (!Number.isFinite(best)) best = 0; } catch { /* Private/file mode can still play. */ }
  let frameId = 0, lastTime = 0, cell = 24, previewWidth = 120, previewHeight = 66;
  let heldAction = null, repeatAt = 0, heldPointer = null;
  let clearUntil = 0, clearLines = 0, seenClear = 0, lastHud = '';
  const buttons = [...document.querySelectorAll('[data-action]')];
  const dialogs = [$('help-dialog'), $('restart-dialog')];
  const dialogOpen = () => dialogs.some(dialog => dialog.open);

  function fitCanvas(canvas, context, width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function resize() {
    const slot = document.querySelector('.board-slot').getBoundingClientRect();
    cell = Math.max(4, Math.min((slot.width - 16) / 10, (slot.height - 16) / 20, 36));
    $('board-frame').style.width = `${cell * 10}px`;
    $('board-frame').style.height = `${cell * 20}px`;
    fitCanvas(board, ctx, cell * 10, cell * 20);
    const size = next.getBoundingClientRect();
    previewWidth = size.width; previewHeight = size.height;
    fitCanvas(next, nctx, previewWidth, previewHeight);
    render();
  }
  function block(context, x, y, size, type, ghost = false) {
    const gap = Math.max(1, size * .06);
    context.fillStyle = palette[type];
    if (ghost) {
      context.globalAlpha = .15;
      context.fillRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
      context.globalAlpha = .85;
      context.strokeStyle = '#738568'; context.lineWidth = 1;
      context.setLineDash([3, 3]);
      context.strokeRect(x + gap + .5, y + gap + .5, size - gap * 2 - 1, size - gap * 2 - 1);
      context.setLineDash([]); context.globalAlpha = 1;
    } else {
      context.fillRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
      context.fillStyle = '#ffffff45';
      context.fillRect(x + gap + 1, y + gap + 1, size - gap * 2 - 2, Math.max(1, size * .09));
      context.strokeStyle = '#3f503326'; context.lineWidth = 1;
      context.strokeRect(x + gap + .5, y + gap + .5, size - gap * 2 - 1, size - gap * 2 - 1);
    }
  }
  function drawPiece(piece, ghost = false) {
    if (!piece) return;
    for (const { x, y } of game.cells(piece)) if (y >= 0) block(ctx, x * cell, y * cell, cell, piece.type, ghost);
  }
  function draw() {
    ctx.clearRect(0, 0, cell * 10, cell * 20);
    ctx.fillStyle = '#fbfaf3'; ctx.fillRect(0, 0, cell * 10, cell * 20);
    ctx.strokeStyle = '#85917415'; ctx.lineWidth = .7;
    ctx.beginPath();
    for (let x = 1; x < 10; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, cell * 20); }
    for (let y = 1; y < 20; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(cell * 10, y * cell); }
    ctx.stroke();
    game.board.forEach((row, y) => row.forEach((type, x) => { if (type) block(ctx, x * cell, y * cell, cell, type); }));
    if (game.status !== 'over') drawPiece(game.ghost(), true);
    drawPiece(game.active);
    nctx.clearRect(0, 0, previewWidth, previewHeight);
    const type = game.queue[0];
    const matrix = TETRIS_SHAPES[type];
    const cells = matrix.flatMap((row, y) => row.flatMap((v, x) => v ? [{ x, y }] : []));
    const minX = Math.min(...cells.map(c => c.x)), maxX = Math.max(...cells.map(c => c.x));
    const minY = Math.min(...cells.map(c => c.y)), maxY = Math.max(...cells.map(c => c.y));
    const size = Math.min(23, (previewWidth - 8) / 4, (previewHeight - 8) / 2);
    const ox = (previewWidth - (maxX - minX + 1) * size) / 2, oy = (previewHeight - (maxY - minY + 1) * size) / 2;
    cells.forEach(c => block(nctx, ox + (c.x - minX) * size, oy + (c.y - minY) * size, size, type));
  }
  function updateHud(force = false) {
    if (game.score > best) {
      best = game.score;
      try { localStorage.setItem(bestKey, String(best)); } catch { /* Saving is optional. */ }
    }
    const clearMessage = performance.now() < clearUntil;
    const signature = [game.score, best, game.lines, game.level, game.status, game.queue[0], clearMessage, BooplandI18n.language].join('|');
    if (!force && signature === lastHud) return;
    lastHud = signature;
    $('score').textContent = game.score.toLocaleString(BooplandI18n.language);
    $('best').textContent = best.toLocaleString(BooplandI18n.language);
    $('lines').textContent = game.lines;
    $('level').textContent = game.level;
    next.setAttribute('aria-label', t('nextPiece', { piece: game.queue[0] }));
    next.textContent = t('nextPiece', { piece: game.queue[0] });
    const paused = game.status === 'paused';
    $('pause').disabled = !['playing', 'paused'].includes(game.status);
    $('pause-label').textContent = t(paused ? 'resume' : 'pause');
    $('pause-icon').textContent = paused ? '▷' : 'Ⅱ';
    $('overlay').hidden = game.status === 'playing';
    const states = { ready: ['ready', 'readyCopy', 'start'], paused: ['paused', 'pausedCopy', 'resume'], over: ['over', 'overCopy', 'again'] };
    if (states[game.status]) {
      const [title, copy, button] = states[game.status];
      $('overlay-title').textContent = t(title);
      $('overlay-copy').textContent = t(copy, { score: game.score.toLocaleString(BooplandI18n.language), lines: game.lines });
      $('start').textContent = t(button);
    }
    $('status').textContent = game.status === 'playing' && clearMessage ? t('cleared', { count: clearLines }) : t({ ready: 'readyStatus', playing: 'playing', paused: 'pausedStatus', over: 'overStatus' }[game.status]);
    buttons.forEach(button => { button.disabled = game.status !== 'playing'; });
  }
  function render(force = false) {
    if (seenClear !== game.clearCount) { seenClear = game.clearCount; clearLines = game.lastClear; clearUntil = performance.now() + 1800; }
    updateHud(force); draw();
  }
  function releaseInput() {
    heldAction = null; heldPointer = null;
    buttons.forEach(button => button.classList.remove('is-held'));
  }
  function stopLoop() { cancelAnimationFrame(frameId); frameId = 0; lastTime = 0; releaseInput(); }
  function loop(time) {
    frameId = 0;
    if (game.status !== 'playing') return;
    const dt = lastTime ? Math.min(time - lastTime, 64) : 0;
    lastTime = time;
    if (heldAction && time >= repeatAt) { perform(heldAction); repeatAt = time + (heldAction === 'down' ? 45 : 85); }
    game.tick(dt); render();
    if (game.status === 'playing') frameId = requestAnimationFrame(loop);
    else { releaseInput(); lastTime = 0; }
  }
  function startLoop() { if (!frameId && game.status === 'playing') { lastTime = 0; frameId = requestAnimationFrame(loop); } }
  function newGame() { stopLoop(); game.start(); clearUntil = seenClear = 0; render(); board.focus({ preventScroll: true }); startLoop(); }
  function pause() { game.pause(); stopLoop(); render(); }
  function resume() { if (dialogOpen()) return; game.resume(); render(); board.focus({ preventScroll: true }); startLoop(); }
  function togglePause() { if (game.status === 'playing') pause(); else if (game.status === 'paused') resume(); }
  function perform(action) {
    if (game.status !== 'playing' || dialogOpen()) return;
    if (action === 'left') game.move(-1);
    if (action === 'right') game.move(1);
    if (action === 'rotate') game.rotate();
    if (action === 'rotateBack') game.rotate(-1);
    if (action === 'down') game.softDrop();
    if (action === 'drop') game.hardDrop();
    render();
  }
  $('start').addEventListener('click', () => game.status === 'paused' ? resume() : newGame());
  $('pause').addEventListener('click', togglePause);
  $('help').addEventListener('click', () => {
    if (game.status === 'playing') pause();
    $('help-dialog').showModal();
    $('help-title').focus({ preventScroll: true });
    $('help-dialog').scrollTop = 0;
  });
  $('restart').addEventListener('click', () => {
    if (game.status === 'ready' || game.status === 'over') { newGame(); return; }
    pause(); $('restart-dialog').showModal();
  });
  $('cancel-restart').addEventListener('click', () => $('restart-dialog').close());
  $('confirm-restart').addEventListener('click', () => { $('restart-dialog').close(); newGame(); });
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'rotate', KeyW: 'rotate', KeyX: 'rotate', KeyZ: 'rotateBack', ArrowDown: 'down', KeyS: 'down', Space: 'drop' };
  document.addEventListener('keydown', event => {
    if (dialogOpen() || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('select, input, textarea, [contenteditable="true"]')) return;
    if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault(); if (!event.repeat) togglePause(); return;
    }
    // Let focused buttons and links retain their native Space/Enter activation.
    if (event.target.closest('button, a') && ['Space', 'Enter'].includes(event.code)) return;
    const action = keyActions[event.code];
    if (!action || game.status !== 'playing') return;
    event.preventDefault();
    if (event.repeat) return;
    perform(action);
    if (['left', 'right', 'down'].includes(action)) { heldAction = action; repeatAt = performance.now() + 180; }
  });
  document.addEventListener('keyup', event => { if (keyActions[event.code] === heldAction) releaseInput(); });
  for (const button of buttons) {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || button.disabled) return;
      event.preventDefault();
      releaseInput();
      heldPointer = event.pointerId;
      button.setPointerCapture(event.pointerId);
      button.classList.add('is-held');
      board.focus({ preventScroll: true });
      perform(button.dataset.action);
      if (['left', 'right', 'down'].includes(button.dataset.action)) { heldAction = button.dataset.action; repeatAt = performance.now() + 180; }
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => { if (event.pointerId === heldPointer) releaseInput(); });
    button.addEventListener('click', event => { if (event.detail === 0) perform(button.dataset.action); });
  }
  window.addEventListener('blur', () => { if (game.status === 'playing') pause(); else releaseInput(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.status === 'playing') pause(); });
  window.addEventListener('pagehide', () => { if (game.status === 'playing') pause(); else stopLoop(); });
  window.addEventListener('boopland:languagechange', () => { render(true); requestAnimationFrame(resize); });
  window.addEventListener('resize', resize, { passive: true });
  new ResizeObserver(resize).observe(document.querySelector('.board-slot'));
  resize();
})();
