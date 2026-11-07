(() => {
  'use strict';
  const E = window.WaterSortEngine, levels = window.WaterSortLevels, I = window.BooplandI18n;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`waterSort.${key}`, values);
  const storageKey = 'boopland-water-sort-v1';
  const colors = ['#c98e87', '#84a7bb', '#8fa98a', '#d7b56d', '#a996b5', '#c39470', '#76aaa4'];
  const symbols = ['●', '▲', '✳', '◆', '★', '■', '✚'];
  let level = 0, unlocked = 1, best = [], history = [], board, selected = -1;
  let busy = false, thinking = false, hintTarget = -1, showMarks = true, dialogMode = '';
  let statusKey = 'ready', statusValues = {}, isError = false, hintToken = 0, columns = 5;
  let plannedSolution = [], animations = [];

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.version === 1) {
      best = levels.map((_, i) => Number.isInteger(saved.best?.[i]) && saved.best[i] > 0 && saved.best[i] <= 3000 ? saved.best[i] : null);
      unlocked = Math.min(levels.length, Math.max(1, best.reduce((n, value, i) => value ? Math.max(n, i + 2) : n, 1)));
      level = Number.isInteger(saved.level) && saved.level >= 0 && saved.level < unlocked ? saved.level : 0;
      const restored = E.replay(levels[level].board, saved.history);
      if (restored) { board = restored; history = saved.history; }
      showMarks = saved.marks !== false;
    }
  } catch { /* Private browsing and invalid saved data never prevent play. */ }
  board ||= E.clone(levels[level].board);

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, level, best, history, marks: showMarks })); }
    catch { /* The current game remains playable without storage. */ }
  }

  function setStatus(key, values = {}, error = false) {
    statusKey = key; statusValues = values; isError = error;
    $('status').textContent = t(key, values);
    $('status').parentElement.dataset.error = String(error);
  }

  function bottleArt(index, bottle, suffix = '') {
    const id = `water-${suffix}${index}`;
    const body = 'M31 15Q30 12 34 12H66Q70 12 69 15V38Q69 42 76 48Q85 54 85 64V177Q85 193 70 194H30Q15 193 15 177V64Q15 54 24 48Q31 42 31 38Z';
    const water = bottle.map((color, i) => {
      const y = 190 - (i + 1) * 33;
      return `<g><path d="M14 ${y + 1}Q32 ${y - 2} 50 ${y + 1}T86 ${y + 1}V${y + 35}H14Z" fill="${colors[color]}" opacity=".9"/><path d="M16 ${y + 1}Q33 ${y - 2} 50 ${y + 1}T84 ${y + 1}" stroke="${colors[color]}" stroke-width="1.2"/><text class="bottle-mark" x="50" y="${y + 22}">${symbols[color]}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 100 210" aria-hidden="true"><defs><clipPath id="${id}"><path d="${body}"/></clipPath><pattern id="${id}-grain" width="17" height="19" patternUnits="userSpaceOnUse"><path d="m2 4 2-.7m8 7 1.5-.3m-7 5 2-.4" stroke="#fffef7" stroke-width="1" opacity=".25"/><circle cx="14" cy="3" r=".6" fill="#526346" opacity=".1"/></pattern></defs><ellipse cx="50" cy="201" rx="33" ry="3" fill="#68755a" stroke="none" opacity=".09"/><path d="${body}" fill="#e7eee1" fill-opacity=".15" stroke="none"/><g clip-path="url(#${id})" stroke="none">${water}<path d="M14 54h72v141H14Z" fill="url(#${id}-grain)"/></g><path d="${body}" stroke="#65715c" stroke-width="1.55"/><path d="M34 17v23q0 4-9 12-6 5-6 14v109q0 13 12 15m40-1q10-2 10-13V66" stroke="#9aa58e" stroke-width=".65" opacity=".65"/><path d="M30 14q20 4 40 0M31 19q19 3 38 0" stroke="#65715c" stroke-width="1.05"/><path d="M23 66v91" stroke="#fffef7" opacity=".52" stroke-width="3"/><path d="M9 157h4m-4-33h4m-4-33h4m-4-33h4" stroke="#a5af98" stroke-width=".8"/></svg>`;
  }

  function bottleLabel(bottle, index) {
    if (!bottle.length) return t('emptyBottle', { n: index + 1 });
    if (E.complete(bottle)) return t('completeBottle', { n: index + 1, color: t(`color${bottle[0]}`) });
    return t('bottleLabel', { n: index + 1, colors: bottle.slice().reverse().map(color => t(`color${color}`)).join(', ') });
  }

  function render() {
    const focused = document.activeElement?.dataset?.bottle;
    $('board').replaceChildren(...board.map((bottle, index) => {
      const button = document.createElement('button');
      button.className = 'bottle';
      button.dataset.bottle = String(index);
      button.setAttribute('aria-label', bottleLabel(bottle, index));
      button.setAttribute('aria-pressed', String(selected === index));
      button.classList.toggle('selected', selected === index);
      button.classList.toggle('complete', E.complete(bottle));
      button.classList.toggle('target', selected >= 0 && !E.inspect(board, selected, index).reason);
      button.classList.toggle('hint-target', index === hintTarget);
      button.disabled = busy;
      button.innerHTML = bottleArt(index, bottle) + `<span class="bottle-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}${E.complete(bottle) ? ' ✓' : ''}</span>`;
      return button;
    }));
    document.body.classList.toggle('marks-off', !showMarks);
    $('marks').setAttribute('aria-pressed', String(showMarks));
    $('moves').textContent = String(history.length);
    $('sorted').textContent = String(board.filter(E.complete).length);
    $('color-count').textContent = ` / ${levels[level].colors}`;
    $('best').textContent = best[level] || '—';
    $('level-label').textContent = t('level', { n: String(level + 1).padStart(2, '0') });
    $('level-count').textContent = `${String(level + 1).padStart(2, '0')} / ${levels.length}`;
    $('color-dots').replaceChildren(...colors.slice(0, levels[level].colors).map((color, index) => {
      const dot = document.createElement('span');
      const done = board.some(bottle => E.complete(bottle) && bottle[0] === index);
      dot.className = `color-dot${done ? ' done' : ''}`; dot.style.background = color; dot.textContent = done ? '✓' : '';
      return dot;
    }));
    $('undo').disabled = busy || !history.length;
    $('hint').disabled = busy || thinking || E.won(board);
    $('restart').disabled = busy;
    $('levels').disabled = busy;
    for (const id of ['undo', 'hint', 'restart']) { $(id).setAttribute('aria-label', t(id)); $(id).title = t(id); }
    document.title = `${t('name')} · Boopland`;
    setStatus(statusKey, statusValues, isError);
    fitBoard();
    if (focused !== undefined && !busy && !document.activeElement?.closest('dialog')) $('board').querySelector(`[data-bottle="${focused}"]`)?.focus({ preventScroll: true });
  }

  function fitBoard() {
    const slot = $('board-slot');
    const short = innerHeight <= 480 && innerWidth >= 480;
    const padding = short ? 12 : innerWidth <= 700 ? 20 : 30;
    const width = slot.clientWidth - padding, height = slot.clientHeight - (short ? 5 : innerWidth <= 700 ? 14 : 30);
    const gap = innerWidth <= 700 || short ? 7 : 20, rowGap = innerWidth <= 700 || short ? 9 : 22, label = short || innerWidth <= 370 ? 18 : 22;
    let choice = { size: 0, cols: board.length };
    for (let count = 2; count <= board.length; count++) {
      const rows = Math.ceil(board.length / count);
      const size = Math.min((width - (count - 1) * gap) / count, (height - (rows - 1) * rowGap - rows * label) / (2.1 * rows), 110);
      if (size > choice.size) choice = { size, cols: count };
    }
    columns = choice.cols;
    $('board').style.setProperty('--columns', String(columns));
    $('board').style.setProperty('--bottle-width', `${Math.max(44, Math.floor(choice.size))}px`);
    $('board').style.setProperty('--column-gap', `${gap}px`);
    $('board').style.setProperty('--row-gap', `${rowGap}px`);
  }

  function cancelHint() { hintToken++; thinking = false; hintTarget = -1; }
  function loadLevel(index) {
    if (busy || index < 0 || index >= unlocked) return;
    cancelHint(); level = index; history = []; board = E.clone(levels[level].board); selected = -1; plannedSolution = [];
    setStatus('ready'); closeDialog(); save(); render();
  }

  function undo() {
    if (busy || !history.length) return;
    cancelHint(); history.pop(); board = E.replay(levels[level].board, history); selected = -1; plannedSolution = [];
    setStatus('undone'); save(); render();
  }

  async function animatePour(move, next) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden || !Element.prototype.animate) return;
    const source = $('board').querySelector(`[data-bottle="${move.from}"] svg`);
    const target = $('board').querySelector(`[data-bottle="${move.to}"] svg`);
    const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
    const direction = a.x > b.x ? -1 : 1;
    const x = b.left + b.width / 2 - (a.left + a.width / 2) - direction * a.width * .17;
    const y = b.top - a.top - a.height * .2;
    const ghost = document.createElement('div'); ghost.className = 'pour-bottle';
    Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    ghost.innerHTML = bottleArt(move.from, board[move.from], 'pour-');
    $('effects').append(ghost); source.style.visibility = 'hidden';
    const pose = `translate(${x}px, ${y}px) rotate(${direction * 64}deg)`;
    const run = async (frames, duration) => {
      const animation = ghost.animate(frames, { duration, fill: 'forwards', easing: 'ease-in-out' });
      animations.push(animation);
      try { await animation.finished; } catch { /* Resizing can finish an animation immediately. */ }
    };
    try {
      await run([{ transform: 'none' }, { transform: pose }], 190);
      const stream = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      stream.classList.add('pour-stream'); stream.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      const tipX = b.left + b.width / 2, tipY = b.top + b.height * .08;
      stream.innerHTML = `<path d="M${tipX} ${tipY - 14}Q${tipX + direction * 5} ${tipY} ${tipX} ${tipY + b.height * .3}" stroke="${colors[move.color]}" stroke-width="${Math.max(3, a.width * .06)}" opacity=".85"/>`;
      $('effects').prepend(stream);
      await run([{ transform: pose }, { transform: pose }], 200);
      stream.remove(); ghost.innerHTML = bottleArt(move.from, next[move.from], 'pour-');
      target.outerHTML = bottleArt(move.to, next[move.to]);
      await run([{ transform: pose }, { transform: 'none' }], 190);
    } finally {
      source.style.visibility = ''; $('effects').replaceChildren();
      animations.forEach(animation => animation.cancel()); animations = [];
    }
  }

  async function selectBottle(index) {
    if (busy || $('dialog').open || E.won(board)) return;
    cancelHint();
    if (selected === index) { selected = -1; setStatus('ready'); render(); return; }
    if (selected < 0) {
      if (!board[index].length) { setStatus('empty', {}, true); render(); return; }
      selected = index; setStatus('selected', { n: index + 1 }); render(); return;
    }
    const result = E.pour(board, selected, index);
    if (!result) { setStatus(E.inspect(board, selected, index).reason, {}, true); render(); return; }
    const source = selected;
    busy = true; selected = -1; render();
    try { await animatePour(result.move, result.board); }
    catch { /* A visual effect must never block a valid move. */ }
    board = result.board; history.push([source, index]); busy = false;
    if (plannedSolution[0]?.[0] === source && plannedSolution[0]?.[1] === index) plannedSolution.shift();
    else plannedSolution = [];
    if (E.won(board)) {
      best[level] = Math.min(best[level] || Infinity, history.length); unlocked = Math.min(levels.length, Math.max(unlocked, level + 2));
      setStatus('winTitle'); save(); render(); showDialog('win');
    } else {
      setStatus(E.moves(board).length ? 'moved' : 'stuck', { from: source + 1, to: index + 1 }); save(); render();
      $('board').querySelector(`[data-bottle="${index}"]`)?.focus({ preventScroll: true });
    }
  }

  function requestHint() {
    if (busy || thinking || E.won(board)) return;
    cancelHint(); selected = -1;
    const token = hintToken;
    const show = move => {
      thinking = false; selected = move[0]; hintTarget = move[1];
      setStatus('hintMessage', { from: move[0] + 1, to: move[1] + 1 }); render();
    };
    if (!history.length) plannedSolution = levels[level].solution.map(move => move.slice());
    if (plannedSolution.length) { show(plannedSolution[0]); return; }
    thinking = true; setStatus('finding'); render();
    const solver = E.createSolver(board);
    const search = () => {
      if (token !== hintToken) return;
      const result = solver.step(180);
      if (result.status === 'searching') { setTimeout(search, 0); return; }
      thinking = false;
      if (result.status === 'solved' && result.solution.length) { plannedSolution = result.solution; show(plannedSolution[0]); }
      else { setStatus('noHint', {}, true); render(); }
    };
    setTimeout(search, 0);
  }

  function closeDialog() { if ($('dialog').open) $('dialog').close(); dialogMode = ''; }
  function showDialog(mode) {
    dialogMode = mode;
    const copy = $('dialog-copy'), actions = $('dialog-actions'), grid = $('level-grid');
    copy.replaceChildren(); actions.replaceChildren(); grid.replaceChildren(); grid.hidden = mode !== 'levels';
    $('dialog-art').textContent = mode === 'win' ? '✳ ✧ ✳' : mode === 'help' ? '◌' : '';
    const paragraph = (key, values) => { const p = document.createElement('p'); p.textContent = t(key, values); copy.append(p); };
    const action = (key, callback, primary = false) => {
      const button = document.createElement('button'); button.textContent = t(key); button.className = primary ? 'primary' : ''; button.addEventListener('click', callback); actions.append(button);
    };
    if (mode === 'help') {
      $('dialog-title').textContent = t('help');
      const list = document.createElement('ol');
      for (const key of ['rule1', 'rule2', 'rule3']) { const item = document.createElement('li'); item.textContent = t(key); list.append(item); }
      copy.append(list); paragraph('keys'); action('cancel', closeDialog, true);
    } else if (mode === 'restart') {
      $('dialog-title').textContent = t('restartTitle'); paragraph('restartCopy');
      action('cancel', closeDialog); action('restart', () => loadLevel(level), true);
    } else if (mode === 'win') {
      $('dialog-title').textContent = t('winTitle'); paragraph('winCopy', { moves: history.length, colors: levels[level].colors });
      if (level === levels.length - 1) paragraph('allDone');
      action('keep', closeDialog);
      action(level < levels.length - 1 ? 'next' : 'levels', () => level < levels.length - 1 ? loadLevel(level + 1) : showDialog('levels'), true);
    } else if (mode === 'levels') {
      $('dialog-title').textContent = t('levels'); paragraph('levelsCopy');
      levels.forEach((_, index) => {
        const button = document.createElement('button'); button.className = `level-choice${best[index] ? ' solved' : ''}${index === level ? ' current' : ''}`;
        button.disabled = index >= unlocked;
        button.textContent = String(index + 1).padStart(2, '0');
        const mark = document.createElement('small'); mark.textContent = best[index] ? '✓' : index >= unlocked ? '·' : '—'; mark.setAttribute('aria-hidden', 'true'); button.append(mark);
        button.setAttribute('aria-label', t(index >= unlocked ? 'levelLocked' : best[index] ? 'levelSolved' : 'level', { n: index + 1, moves: best[index] }));
        if (index === level) button.setAttribute('aria-current', 'true');
        button.addEventListener('click', () => { if (index === level) closeDialog(); else loadLevel(index); }); grid.append(button);
      });
    }
    if (!$('dialog').open) $('dialog').showModal();
    if (mode === 'win') actions.querySelector('.primary')?.focus();
  }

  $('board').addEventListener('click', event => { const button = event.target.closest('[data-bottle]'); if (button) selectBottle(Number(button.dataset.bottle)); });
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', requestHint);
  $('restart').addEventListener('click', () => history.length ? showDialog('restart') : loadLevel(level));
  $('levels').addEventListener('click', () => showDialog('levels'));
  $('help').addEventListener('click', () => { if (!busy) showDialog('help'); });
  $('marks').addEventListener('click', () => { showMarks = !showMarks; document.body.classList.toggle('marks-off', !showMarks); $('marks').setAttribute('aria-pressed', String(showMarks)); save(); });
  $('close-dialog').addEventListener('click', closeDialog);
  $('dialog').addEventListener('close', () => { dialogMode = ''; });
  document.addEventListener('keydown', event => {
    if ($('dialog').open || busy || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') { cancelHint(); selected = -1; setStatus(E.won(board) ? 'winTitle' : 'ready'); render(); }
    if (event.key.toLowerCase() === 'u') { event.preventDefault(); undo(); }
    const index = Number(document.activeElement?.dataset?.bottle);
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
    if (Number.isInteger(index) && offsets[event.key] !== undefined) {
      event.preventDefault(); const next = (index + offsets[event.key] + board.length) % board.length;
      $('board').querySelector(`[data-bottle="${next}"]`)?.focus();
    }
  });
  window.addEventListener('boopland:languagechange', () => { render(); if ($('dialog').open) showDialog(dialogMode); });
  window.addEventListener('resize', () => { animations.forEach(animation => { try { animation.finish(); } catch {} }); fitBoard(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      animations.forEach(animation => { try { animation.finish(); } catch {} });
      if (thinking) { cancelHint(); setStatus('ready'); render(); }
    }
  });
  if (window.ResizeObserver) new ResizeObserver(fitBoard).observe($('board-slot'));
  if (E.won(board)) setStatus('winTitle');
  render();
  if (E.won(board)) showDialog('win');
})();
