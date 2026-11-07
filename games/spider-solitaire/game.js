(() => {
  'use strict';
  const E = window.SpiderEngine, I = window.BooplandI18n;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`spider.${key}`, values);
  const storageKey = 'boopland-spider-solitaire-v1';
  const ranks = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let restored;
  try { restored = E.restore(JSON.parse(localStorage.getItem(storageKey))); } catch { /* Storage is optional. */ }
  let state = restored?.state || E.newGame(1, freshSeed());
  let history = restored?.history || [], actions = restored?.actions || [], elapsed = restored?.elapsed || 0;
  let started = elapsed > 0 || actions.length > 0, lastTick = performance.now(), saveTick = 0;
  let selected = null, hintTarget = -1, hintIndex = 0, drag = null, suppressClickUntil = 0;
  let statusKey = restored ? 'resumed' : 'ready', statusValues = {}, statusError = false;
  let dialogMode = '', dialogColumn = -1, pendingDifficulty = state.difficulty, returnFocus = null;

  function freshSeed() {
    try { return crypto.getRandomValues(new Uint32Array(1))[0]; } catch { return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0; }
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, seed: state.seed, difficulty: state.difficulty, actions, elapsed })); }
    catch { /* A full or unavailable storage must not stop the current game. */ }
  }

  function formatTime(value) {
    const seconds = Math.floor(value / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function accountTime() {
    const now = performance.now();
    if (started && !document.hidden && !$('dialog').open && !E.won(state)) elapsed += Math.max(0, now - lastTick);
    lastTick = now;
    $('time').textContent = formatTime(elapsed);
  }

  function message(key, values = {}, error = false) {
    statusKey = key; statusValues = values; statusError = error;
    $('status').textContent = t(key, values);
    $('status').parentElement.classList.toggle('error', error);
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function cardLabel(card, column, index) {
    return t('card', { column: column + 1, rank: ranks[card.rank], suit: t(`suit${card.suit}`), n: state.columns[column].length - index });
  }

  function cardElement(card, column, index) {
    const element = makeElement(card.faceUp ? 'button' : 'div', `card${card.faceUp ? card.suit % 2 ? ' red' : '' : ' back'}`);
    element.dataset.index = index;
    element.dataset.card = card.id;
    if (!card.faceUp) { element.setAttribute('aria-hidden', 'true'); return element; }
    element.type = 'button';
    element.setAttribute('aria-label', cardLabel(card, column, index));
    element.setAttribute('aria-pressed', 'false');
    const corner = makeElement('span', 'corner', ranks[card.rank]);
    corner.append(makeElement('small', '', E.SUITS[card.suit]));
    corner.setAttribute('aria-hidden', 'true');
    const bottom = corner.cloneNode(true); bottom.classList.add('bottom');
    const pip = makeElement('span', 'pip', E.SUITS[card.suit]); pip.setAttribute('aria-hidden', 'true');
    element.append(corner, pip, bottom);
    return element;
  }

  function render() {
    const focus = document.activeElement?.closest('[data-card], .column-heading');
    const focusCard = focus?.dataset.card, focusColumn = focus?.closest('.column')?.dataset.column;
    const scrolls = [...$('tableau').querySelectorAll('.pile')].map(pile => pile.scrollTop);
    $('tableau').replaceChildren(...state.columns.map((cards, index) => {
      const column = makeElement('div', 'column'); column.dataset.column = index;
      const heading = makeElement('button', 'column-heading', String(index + 1).padStart(2, '0'));
      heading.setAttribute('aria-label', t('inspect', { n: index + 1 }));
      heading.title = t('inspect', { n: index + 1 });
      const pile = makeElement('div', 'pile');
      pile.setAttribute('role', 'group'); pile.setAttribute('aria-label', t('column', { n: index + 1 }));
      const content = makeElement('div', 'pile-content');
      const empty = makeElement('div', 'empty-slot', '·'); empty.setAttribute('aria-hidden', 'true');
      content.append(empty, ...cards.map((card, i) => cardElement(card, index, i)));
      if (!cards.length) {
        heading.setAttribute('aria-label', t('emptyColumn', { n: index + 1 }));
        pile.tabIndex = 0; pile.setAttribute('role', 'button'); pile.setAttribute('aria-label', t('emptyColumn', { n: index + 1 }));
      }
      pile.append(content); column.append(heading, pile);
      return column;
    }));
    $('foundations').replaceChildren(...Array.from({ length: 8 }, (_, i) => {
      const suit = state.completed[i];
      return makeElement('span', `foundation${suit === undefined ? '' : ` done${suit % 2 ? ' red' : ''}`}`, suit === undefined ? '·' : E.SUITS[suit]);
    }));
    $('score').textContent = E.score(state);
    $('moves').textContent = state.moves;
    $('collected').textContent = `${state.completed.length} / 8`;
    $('difficulty-label').textContent = t(`mode${state.difficulty}`);
    $('stock-count').textContent = t(state.stock.length ? 'stock' : 'emptyStock', { n: state.stock.length / 10 });
    $('deal').disabled = !state.stock.length || E.won(state);
    $('deal').setAttribute('aria-label', `${t('deal')}, ${t(state.stock.length ? 'stock' : 'emptyStock', { n: state.stock.length / 10 })}`);
    $('stock-art').style.opacity = state.stock.length ? '1' : '.3';
    $('undo').disabled = !history.length;
    $('hint').disabled = E.won(state);
    for (const id of ['undo', 'hint', 'new-game']) {
      const label = t(id === 'new-game' ? 'newGame' : id);
      $(id).setAttribute('aria-label', label); $(id).title = label;
    }
    message(statusKey, statusValues, statusError);
    fitCards(); decorateSelection();
    $('tableau').querySelectorAll('.pile').forEach((pile, index) => { pile.scrollTop = scrolls[index] || 0; });
    if (focusCard !== undefined) $('tableau').querySelector(`[data-card="${focusCard}"]`)?.focus({ preventScroll: true });
    else if (focusColumn !== undefined) $('tableau').querySelector(`[data-column="${focusColumn}"] .column-heading`)?.focus({ preventScroll: true });
  }

  function fitCards() {
    $('tableau').querySelectorAll('.column').forEach((column, col) => {
      const pile = column.querySelector('.pile'), cards = state.columns[col];
      const width = pile.clientWidth;
      const cardHeight = Math.max(42, Math.min(145, width * 1.43));
      column.style.setProperty('--card-height', `${cardHeight}px`);
      const overlapCards = cards.slice(0, -1);
      const hidden = overlapCards.filter(card => !card.faceUp).length;
      const visible = overlapCards.length - hidden;
      const available = Math.max(0, pile.clientHeight - cardHeight - 3);
      const hiddenStep = Math.max(3, Math.min(8, available / Math.max(1, hidden + visible * 3)));
      const minimumStep = innerHeight <= 500 ? 18 : width > 85 ? 24 : 21;
      const visibleStep = Math.max(minimumStep, Math.min(width > 85 ? 31 : 25, (available - hidden * hiddenStep) / Math.max(1, visible)));
      let top = 0;
      pile.querySelectorAll('.card').forEach((element, index) => {
        element.style.setProperty('--top', `${top}px`);
        if (index < cards.length - 1) top += cards[index].faceUp ? visibleStep : hiddenStep;
      });
      pile.querySelector('.pile-content').style.height = `${Math.max(pile.clientHeight, top + cardHeight + 3)}px`;
    });
  }

  function decorateSelection() {
    $('tableau').querySelectorAll('.column').forEach((column, col) => {
      column.classList.toggle('target', !!selected && E.canMove(state, selected.from, selected.start, col));
      column.classList.toggle('hint-target', hintTarget === col);
      column.querySelectorAll('.card').forEach(card => {
        const active = !!selected && selected.from === col && Number(card.dataset.index) >= selected.start;
        card.classList.toggle('selected', active);
        card.classList.toggle('hint-card', active && hintTarget >= 0 && Number(card.dataset.index) === selected.start);
        if (card.tagName === 'BUTTON') card.setAttribute('aria-pressed', String(active));
      });
    });
  }

  function clearSelection() { selected = null; hintTarget = -1; decorateSelection(); }

  function perform(action) {
    accountTime();
    const next = E.apply(state, action);
    if (!next) return false;
    const before = state;
    history.push(state); actions.push(action); state = next; started = true;
    selected = null; hintTarget = -1; hintIndex = 0;
    if (state.completed.length > before.completed.length) message('collectedMessage', { n: state.completed.length });
    else if (action.type === 'move') message('moved', { from: action.from + 1, to: action.to + 1 });
    else message('dealt');
    save(); render();
    const columns = action.type === 'move' ? [action.from, action.to] : Array.from({ length: 10 }, (_, i) => i);
    columns.forEach(index => { const pile = $('tableau').children[index].querySelector('.pile'); pile.scrollTop = pile.scrollHeight; });
    if (E.won(state)) openDialog('win');
    return true;
  }

  function choose(column, index) {
    if ($('dialog').open || E.won(state)) return;
    started = true;
    if (selected && selected.from !== column) {
      if (perform({ type: 'move', ...selected, to: column })) return;
      message('invalidMove', {}, true);
      return;
    }
    if (index < 0 || !state.columns[column][index]?.faceUp) return;
    if (!E.isRun(state.columns[column], index)) { message('invalidRun', {}, true); return; }
    if (selected?.from === column && selected.start === index) { clearSelection(); message('ready'); return; }
    selected = { from: column, start: index }; hintTarget = -1;
    message('selected', { n: state.columns[column].length - index }); decorateSelection();
  }

  function dealCards() {
    if ($('dialog').open) return;
    if (!state.stock.length) return;
    if (!E.canDeal(state)) { message('emptyDeal', {}, true); return; }
    perform({ type: 'deal' });
  }

  function undo() {
    if (!history.length || $('dialog').open) return;
    cancelDrag(); accountTime(); state = history.pop(); actions.pop(); selected = null; hintTarget = -1; hintIndex = 0;
    message('undone'); save(); render();
  }

  function hint() {
    if ($('dialog').open || E.won(state)) return;
    const options = E.hints(state);
    if (!options.length) { clearSelection(); message(E.canDeal(state) ? 'hintDeal' : 'noMoves'); return; }
    const option = options[hintIndex++ % options.length];
    selected = { from: option.from, start: option.start }; hintTarget = option.to;
    message('hintMessage', { from: option.from + 1, to: option.to + 1 }); decorateSelection();
    $('tableau').children[option.from].querySelector(`[data-index="${option.start}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const target = $('tableau').children[option.to].querySelector('.pile'); target.scrollTop = target.scrollHeight;
  }

  function startGame(difficulty, seed) {
    cancelDrag(); state = E.newGame(difficulty, seed); history = []; actions = []; elapsed = 0; started = false;
    selected = null; hintTarget = -1; hintIndex = 0; closeDialog(); lastTick = performance.now();
    message('ready'); save(); render(); $('time').textContent = formatTime(0);
    $('tableau').querySelectorAll('.pile').forEach(pile => { pile.scrollTop = 0; });
  }

  function dialogButton(key, handler, primary = false) {
    const button = makeElement('button', primary ? 'primary' : '', t(key));
    button.addEventListener('click', handler); $('dialog-actions').append(button);
  }

  function renderDialog() {
    $('dialog-copy').replaceChildren(); $('dialog-options').replaceChildren(); $('dialog-actions').replaceChildren();
    const paragraph = (key, values) => $('dialog-copy').append(makeElement('p', '', t(key, values)));
    $('dialog-art').textContent = dialogMode === 'win' ? '♠ ♡ ♣ ♢' : dialogMode === 'pause' ? '☾' : '♠';
    const title = { help: 'help', new: 'newTitle', pause: 'pauseTitle', win: 'winTitle', inspect: 'inspect' }[dialogMode];
    $('dialog-title').textContent = t(title, { n: dialogColumn + 1 });
    if (dialogMode === 'help') {
      const list = makeElement('ol');
      for (let i = 1; i <= 5; i++) list.append(makeElement('li', '', t(`rule${i}`)));
      $('dialog-copy').append(list); paragraph('keyboard'); dialogButton('resume', closeDialog, true);
    } else if (dialogMode === 'new') {
      paragraph('newCopy');
      const options = makeElement('div', 'difficulty-options'); options.setAttribute('role', 'radiogroup'); options.setAttribute('aria-label', t('newGame'));
      [1, 2, 4].forEach(difficulty => {
        const button = makeElement('button', 'difficulty-option'); button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', String(pendingDifficulty === difficulty));
        const suits = makeElement('span', '', E.SUITS.slice(0, difficulty).join('')); suits.setAttribute('aria-hidden', 'true');
        const label = makeElement('span'); label.append(makeElement('strong', '', t(`mode${difficulty}`)), makeElement('small', '', t(`diff${difficulty}`)));
        button.append(suits, label);
        button.addEventListener('click', () => { pendingDifficulty = difficulty; renderDialog(); $('dialog-options').querySelector('[aria-checked="true"]').focus(); });
        options.append(button);
      });
      $('dialog-options').append(options);
      dialogButton('resume', closeDialog);
      dialogButton('restart', () => startGame(state.difficulty, state.seed));
      dialogButton('start', () => startGame(pendingDifficulty, freshSeed()), true);
    } else if (dialogMode === 'pause') {
      paragraph('pauseCopy'); dialogButton('resume', closeDialog, true);
    } else if (dialogMode === 'win') {
      paragraph('winCopy', { moves: state.moves, time: formatTime(elapsed), score: E.score(state) });
      dialogButton('close', closeDialog);
      dialogButton('newGame', () => { dialogMode = 'new'; pendingDifficulty = state.difficulty; renderDialog(); }, true);
    } else if (dialogMode === 'inspect') {
      paragraph('inspectCopy');
      const cards = state.columns[dialogColumn], hidden = cards.filter(card => !card.faceUp).length;
      if (hidden) paragraph('hiddenCards', { n: hidden });
      if (!cards.length) paragraph('emptyColumn', { n: dialogColumn + 1 });
      const list = makeElement('div', 'inspect-list');
      cards.forEach((card, index) => {
        if (!card.faceUp) return;
        const button = makeElement('button', `inspect-card${card.suit % 2 ? ' red' : ''}`, `${ranks[card.rank]} ${E.SUITS[card.suit]}`);
        button.setAttribute('aria-label', cardLabel(card, dialogColumn, index));
        button.disabled = !E.isRun(cards, index) || E.won(state);
        button.addEventListener('click', () => { const column = dialogColumn; closeDialog(); clearSelection(); choose(column, index); });
        list.append(button);
      });
      $('dialog-options').append(list); dialogButton('close', closeDialog);
    }
  }

  function openDialog(mode, column = -1) {
    cancelDrag(); accountTime(); returnFocus = document.activeElement; dialogMode = mode; dialogColumn = column;
    pendingDifficulty = state.difficulty; renderDialog(); $('dialog').showModal(); save();
  }

  function closeDialog() {
    $('dialog').close(); dialogMode = ''; lastTick = performance.now();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }

  function cancelDrag() {
    const previous = drag;
    drag = null;
    if (previous && $('tableau').hasPointerCapture(previous.id)) $('tableau').releasePointerCapture(previous.id);
    $('drag-layer').replaceChildren();
    $('tableau').querySelectorAll('.drag-source, .drop-target').forEach(element => element.classList.remove('drag-source', 'drop-target'));
  }

  $('tableau').addEventListener('click', event => {
    if (event.detail && performance.now() < suppressClickUntil) return;
    const column = event.target.closest('.column'); if (!column) return;
    const from = Number(column.dataset.column);
    if (event.target.closest('.column-heading') && !selected) { openDialog('inspect', from); return; }
    const card = event.target.closest('.card');
    choose(from, card ? Number(card.dataset.index) : -1);
  });

  $('tableau').addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || $('dialog').open || E.won(state)) return;
    const card = event.target.closest('button.card'); if (!card) return;
    const from = Number(card.closest('.column').dataset.column), start = Number(card.dataset.index);
    if (!E.isRun(state.columns[from], start)) return;
    const rect = card.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: event.clientX - rect.left, dy: event.clientY - rect.top, from, start, width: rect.width, height: rect.height, active: false };
  });

  $('tableau').addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.active && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    if (!drag.active) {
      drag.active = true; started = true; selected = { from: drag.from, start: drag.start }; hintTarget = -1;
      $('tableau').setPointerCapture(drag.id); decorateSelection();
      const stack = makeElement('div', 'drag-stack'); stack.style.width = `${drag.width}px`; stack.style.setProperty('--card-height', `${drag.height}px`);
      state.columns[drag.from].slice(drag.start).forEach((card, i) => {
        const ghost = cardElement(card, drag.from, drag.start + i); ghost.tabIndex = -1; ghost.style.setProperty('--top', `${i * 21}px`); stack.append(ghost);
        $('tableau').querySelector(`[data-card="${card.id}"]`).classList.add('drag-source');
      });
      $('drag-layer').append(stack);
    }
    event.preventDefault();
    $('drag-layer').firstChild.style.transform = `translate(${event.clientX - drag.dx}px, ${event.clientY - drag.dy}px)`;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.column');
    $('tableau').querySelectorAll('.column').forEach(column => column.classList.toggle('drop-target', column === target && E.canMove(state, drag.from, drag.start, Number(column.dataset.column))));
  });

  $('tableau').addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const finished = drag;
    if (!finished.active) { drag = null; return; }
    suppressClickUntil = performance.now() + 500;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.column');
    cancelDrag();
    if (!target || !perform({ type: 'move', from: finished.from, start: finished.start, to: Number(target.dataset.column) })) { message('invalidMove', {}, true); decorateSelection(); }
  });
  $('tableau').addEventListener('pointercancel', cancelDrag);
  $('tableau').addEventListener('lostpointercapture', () => { if (drag?.active) cancelDrag(); });
  window.addEventListener('pointerup', () => { if (drag && !drag.active) drag = null; });
  window.addEventListener('blur', cancelDrag);

  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('deal').addEventListener('click', dealCards);
  $('new-game').addEventListener('click', () => openDialog('new'));
  $('difficulty').addEventListener('click', () => openDialog('new'));
  $('help').addEventListener('click', () => openDialog('help'));
  $('pause').addEventListener('click', () => openDialog('pause'));
  $('close-dialog').addEventListener('click', closeDialog);
  $('dialog').addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });

  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input, select, textarea')) return;
    if ($('dialog').open) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') { cancelDrag(); clearSelection(); message('ready'); event.preventDefault(); return; }
    const commands = { u: undo, h: hint, d: dealCards, p: () => openDialog('pause') };
    if (commands[key]) { event.preventDefault(); cancelDrag(); commands[key](); return; }
    const column = event.target.closest('.column'); if (!column) return;
    if (event.target.classList.contains('pile') && (key === 'enter' || key === ' ')) { event.preventDefault(); choose(Number(column.dataset.column), -1); return; }
    if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) return;
    event.preventDefault();
    const from = Number(column.dataset.column), cards = [...column.querySelectorAll('button.card')];
    const current = cards.indexOf(event.target.closest('button.card'));
    if (key === 'arrowup' || key === 'arrowdown') {
      const next = Math.max(0, Math.min(cards.length - 1, current + (key === 'arrowup' ? -1 : 1)));
      (cards[next] || column.querySelector('.column-heading')).focus();
    } else {
      const next = (from + (key === 'arrowleft' ? 9 : 1)) % 10;
      const target = $('tableau').children[next];
      (target.querySelector('button.card:last-child') || target.querySelector('.column-heading')).focus();
    }
  });

  window.addEventListener('boopland:languagechange', () => { cancelDrag(); render(); if ($('dialog').open) renderDialog(); });
  const observer = new ResizeObserver(() => { cancelDrag(); fitCards(); });
  observer.observe($('tableau'));
  document.addEventListener('visibilitychange', () => { cancelDrag(); lastTick = performance.now(); save(); });
  window.addEventListener('pagehide', () => { accountTime(); save(); });
  window.addEventListener('pageshow', () => { lastTick = performance.now(); });
  window.addEventListener('resize', cancelDrag);
  setInterval(() => { accountTime(); if (++saveTick % 15 === 0 && started) save(); }, 1000);
  render(); $('time').textContent = formatTime(elapsed);
})();
