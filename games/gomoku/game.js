(() => {
  'use strict';
  const E = window.Gomoku, i18n = window.BooplandI18n;
  const $ = id => document.getElementById(id);
  const t = (key, values) => i18n.t(`gomoku.${key}`, values);
  const boardElement = $('board'), dialog = $('dialog');
  const cells = [];
  let game = E.createGame();
  let config = { level: 'normal', human: 1 };
  let pending = { ...config };
  let thinking = false, controller = null, timer = null, revision = 0;
  let focusIndex = 112, dialogKind = '', notice = '';

  // Static pencil lines stay stable while the board resizes.
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 15; i++) {
    const p = 30 + i * 30;
    for (const vertical of [false, true]) {
      for (const echo of [false, true]) {
        const path = document.createElementNS(ns, 'path');
        const offset = echo ? .7 : 0;
        path.setAttribute('d', vertical
          ? `M${p + offset} 30 Q${p + (i % 3 - 1) * .6 + offset} 240 ${p + offset} 450`
          : `M30 ${p + offset} Q240 ${p + (i % 3 - 1) * .6 + offset} 450 ${p + offset}`);
        path.setAttribute('class', echo ? 'pencil-echo' : 'grid-line');
        $('grid-art').append(path);
      }
    }
  }
  for (const [r, c] of [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]]) {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', 30 + c * 30);
    circle.setAttribute('cy', 30 + r * 30);
    circle.setAttribute('r', '2.6');
    circle.setAttribute('class', 'star');
    $('grid-art').append(circle);
  }
  for (let index = 0; index < 225; index++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'intersection empty';
    button.dataset.index = index;
    const marker = document.createElement('span');
    marker.className = 'move-marker';
    marker.setAttribute('aria-hidden', 'true');
    button.append(marker);
    button.addEventListener('click', () => humanMove(index));
    button.addEventListener('focus', () => setFocus(index));
    boardElement.append(button);
    cells.push(button);
  }

  function resizeBoard() {
    const rect = $('board-stage').getBoundingClientRect();
    $('board-paper').style.setProperty('--board-size', `${Math.max(0, Math.floor(Math.min(rect.width, rect.height) - 5))}px`);
  }
  new ResizeObserver(resizeBoard).observe($('board-stage'));
  function setFocus(index, moveFocus = false) {
    focusIndex = index;
    cells.forEach((cell, i) => { cell.tabIndex = i === index ? 0 : -1; });
    if (moveFocus) cells[index].focus({ preventScroll: true });
  }
  function render() {
    const latest = game.moves.at(-1)?.index;
    const locked = thinking || game.over || game.turn !== config.human;
    boardElement.setAttribute('aria-disabled', String(locked));
    cells.forEach((cell, index) => {
      const value = game.board[index];
      cell.className = `intersection ${value === 1 ? 'black' : value === 2 ? 'white' : 'empty'}${latest === index ? ' latest' : ''}${game.line.includes(index) ? ' winning' : ''}`;
      cell.setAttribute('aria-label', t('cell', { row: Math.floor(index / 15) + 1, col: index % 15 + 1, value: t(value === 1 ? 'black' : value === 2 ? 'white' : 'empty') }) + (latest === index ? `, ${t('lastMove')}` : ''));
      cell.setAttribute('aria-disabled', String(locked || !!value));
    });
    setFocus(focusIndex);
    $('human-stone').className = `stone ${config.human === 1 ? 'black' : 'white'}`;
    $('ai-stone').className = `stone ${config.human === 1 ? 'white' : 'black'}`;
    $('ai-name').textContent = t('aiLevel', { level: t(config.level) });
    const statusKey = game.over ? game.winner ? game.winner === config.human ? 'youWin' : 'aiWin' : 'draw' : thinking ? 'thinking' : 'yourTurn';
    $('status').textContent = t(statusKey);
    $('status-dot').classList.toggle('thinking', thinking);
    $('status-note').textContent = t(game.over ? 'endNote' : thinking ? 'thinkingNote' : notice || (game.moves.length === 0 ? 'firstNote' : 'turnNote'));
    $('move-count').textContent = t('moves', { count: game.moves.length });
    $('undo').disabled = !game.moves.some(move => move.player === config.human);
    document.querySelectorAll('[data-level]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === pending.level)));
    document.querySelectorAll('[data-side]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.side) === pending.human)));
    $('level-note').textContent = t(`${pending.level}Note`);
    $('pending-note').textContent = pending.level !== config.level || pending.human !== config.human ? t('pending') : '';
    if (dialog.open) renderDialog();
  }
  function stopAI() {
    revision++;
    clearTimeout(timer);
    controller?.abort();
    controller = null;
    thinking = false;
  }
  function queueAI() {
    if (game.over || game.turn === config.human || document.hidden) return;
    thinking = true;
    const version = revision;
    const task = new AbortController();
    controller = task;
    render();
    timer = setTimeout(async () => {
      let index;
      try {
        index = await E.chooseMove(game.board, game.turn, config.level, { signal: task.signal });
      } catch {
        // A usable legal reply remains available even if a browser interrupts search.
        index = game.board.findIndex(value => !value);
      }
      if (task.signal.aborted || version !== revision) return;
      thinking = false;
      controller = null;
      if (index !== null && index >= 0) E.play(game, index);
      notice = '';
      render();
    }, config.level === 'easy' ? 300 : 200);
  }
  function humanMove(index) {
    if (thinking || game.over || game.turn !== config.human || dialog.open) return;
    if (!E.play(game, index)) return;
    setFocus(index);
    notice = '';
    render();
    queueAI();
  }
  function newGame() {
    stopAI();
    config = { ...pending };
    game = E.createGame();
    notice = '';
    focusIndex = 112;
    if (dialog.open) dialog.close();
    render();
    queueAI();
  }
  function changeSettings() {
    if (game.moves.length === 0 && !thinking) newGame();
    else render();
  }
  function renderDialog() {
    $('dialog-title').textContent = t(dialogKind === 'rules' ? 'rules' : 'restartTitle');
    $('confirm-actions').hidden = dialogKind !== 'restart';
    const keys = dialogKind === 'rules' ? ['rule1', 'rule2', 'rule3', 'rule4'] : ['restartNote'];
    $('dialog-content').replaceChildren(...keys.map(key => {
      const p = document.createElement('p'); p.textContent = t(key); return p;
    }));
  }
  function openDialog(kind) {
    dialogKind = kind;
    renderDialog();
    dialog.showModal();
    (kind === 'restart' ? $('cancel-restart') : $('close-dialog')).focus();
  }
  $('help').addEventListener('click', () => openDialog('rules'));
  $('close-dialog').addEventListener('click', () => dialog.close());
  $('cancel-restart').addEventListener('click', () => dialog.close());
  $('confirm-restart').addEventListener('click', newGame);
  $('new-game').addEventListener('click', () => game.moves.length && !game.over ? openDialog('restart') : newGame());
  $('undo').addEventListener('click', () => {
    stopAI();
    if (E.undoTurn(game, config.human)) { focusIndex = game.moves.at(-1)?.index ?? 112; notice = 'undone'; }
    render();
  });
  document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => {
    pending.level = button.dataset.level; changeSettings();
  }));
  document.querySelectorAll('[data-side]').forEach(button => button.addEventListener('click', () => {
    pending.human = Number(button.dataset.side); changeSettings();
  }));
  boardElement.addEventListener('keydown', event => {
    const row = Math.floor(focusIndex / 15), col = focusIndex % 15;
    const next = { ArrowUp: Math.max(0, row - 1) * 15 + col, ArrowDown: Math.min(14, row + 1) * 15 + col, ArrowLeft: row * 15 + Math.max(0, col - 1), ArrowRight: row * 15 + Math.min(14, col + 1), Home: row * 15, End: row * 15 + 14 }[event.key];
    if (next !== undefined) { event.preventDefault(); setFocus(next, true); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAI();
    else { render(); queueAI(); }
  });
  window.addEventListener('pagehide', stopAI);
  window.addEventListener('pageshow', event => { if (event.persisted) { render(); queueAI(); } });
  window.addEventListener('boopland:languagechange', render);
  render();
  resizeBoard();
})();
