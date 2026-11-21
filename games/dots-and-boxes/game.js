(function () {
  'use strict';
  const { newBoard, legal, draw, chooseEdge, outcome } = window.DotsAndBoxes;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t(`dots-and-boxes.${key}`, values);
  const svg = $('board');
  const dialog = $('dialog');
  const unlockKey = 'boopland-dots-and-boxes-large-v1';
  const ink = ['#536e56', '#986650'];
  const paper = ['#dce7d4', '#eddbcc'];
  let board = newBoard(3);
  let unlocked = false;
  try { unlocked = localStorage.getItem(unlockKey) === '1'; } catch { /* Keep playing in memory. */ }
  let pendingTimer = null;
  let selectedDot = null;
  let focusedEdge = 0;
  let invalidPick = false;
  let dialogMode = 'rules';
  let nextSize = 3;
  let keyboardBoard = false;
  let edgeViews, dotViews, boxViews;

  function make(parent, tag, attrs) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    parent.append(element);
    return element;
  }

  function buildBoard() {
    selectedDot = null;
    invalidPick = false;
    focusedEdge = 0;
    svg.replaceChildren();
    const span = board.size * 100 + 36;
    svg.setAttribute('viewBox', `-18 -18 ${span} ${span}`);
    const defs = make(svg, 'defs', {});
    for (let side = 0; side < 2; side++) {
      const pattern = make(defs, 'pattern', { id: `grain-${side}`, width: 9, height: 9, patternUnits: 'userSpaceOnUse' });
      make(pattern, 'path', { d: side ? 'M-2 2 7 11 M7 2l4 4' : 'M-2 7 7-2 M6 9l4-4', fill: 'none', stroke: ink[side], 'stroke-width': .8, opacity: .34 });
    }
    const cells = make(svg, 'g', { 'aria-hidden': 'true' });
    boxViews = board.boxes.map((_, i) => {
      const x = (i % board.size) * 100;
      const y = Math.floor(i / board.size) * 100;
      const group = make(cells, 'g', { transform: `translate(${x} ${y})`, visibility: 'hidden' });
      const wash = make(group, 'path', { d: 'M0 1 100 0 99.6 100 0 99.6Z' });
      const hatch = make(group, 'rect', { x: 4, y: 4, width: 92, height: 92 });
      const mark = make(group, 'path', { class: 'mark' });
      return { group, wash, hatch, mark };
    });
    const strokes = make(svg, 'g', { 'aria-hidden': 'true' });
    const inputs = make(svg, 'g', {});
    edgeViews = board.edges.map(edge => {
      const length = 100;
      const group = make(strokes, 'g', { transform: edgeTransform(edge) });
      const guide = make(group, 'path', { class: 'guide', d: 'M4 0H96' });
      const offset = ((edge.id * 7) % 9 - 4) * .31;
      const line = `M0 0 Q24 ${offset} 50 ${-offset} T${length} 0`;
      const drawn = make(group, 'path', { class: 'drawn', d: line, visibility: 'hidden' });
      const echo = make(group, 'path', { class: 'echo', d: `M2 2.7 Q35 ${offset + 3.4} 66 2.6 T98 2.1`, visibility: 'hidden' });
      const hitGroup = make(inputs, 'g', { transform: edgeTransform(edge) });
      const hit = make(hitGroup, 'path', {
        class: 'edge-hit', d: 'M0 0 48-40 52-40 100 0 52 40 48 40Z',
        role: 'button', tabindex: -1, 'data-edge': edge.id
      });
      make(hitGroup, 'path', { class: 'ghost', d: 'M7 0Q52-.8 93 0' });
      return { guide, drawn, echo, hit };
    });
    const dots = make(svg, 'g', { 'aria-hidden': 'true' });
    dotViews = [];
    for (let y = 0; y <= board.size; y++) {
      for (let x = 0; x <= board.size; x++) {
        const id = y * (board.size + 1) + x;
        const center = { cx: x * 100, cy: y * 100 };
        const hit = make(dots, 'circle', { ...center, r: 15, class: 'node-hit', 'data-dot': id });
        const ring = make(dots, 'circle', { ...center, r: 10, class: 'node-ring' });
        make(dots, 'circle', { ...center, r: 5.8, class: 'graph-dot' });
        dotViews.push({ hit, ring });
      }
    }
  }

  function edgeTransform(edge) {
    return `translate(${edge.x * 100} ${edge.y * 100})${edge.vertical ? ' rotate(90)' : ''}`;
  }

  function hasHumanTurn() {
    return !outcome(board) && board.turn === 0;
  }

  function setTurnCopy(result, hint) {
    $('turn-title').textContent = t(result || (board.turn === 0 ? 'yourTurn' : 'cpuTurn'));
    let message;
    if (result) message = t('final', { you: board.score[0], cpu: board.score[1] });
    else if (invalidPick) message = t('invalid');
    else if (selectedDot !== null) message = t('neighbor');
    else if (board.last?.closed.length) message = t(board.last.closed.length === 2 ? 'double' : 'again');
    else if (board.turn === 1) message = t('wait');
    else if (!board.moves) message = t('first');
    else if (hint) message = t('capture');
    else message = t(board.size === 3 ? 'basic' : 'safe');
    $('turn-tip').textContent = message;
    $('turn-box').dataset.side = result ? (result === 'loss' ? 'cpu' : 'you') : (board.turn ? 'cpu' : 'you');
  }

  function render() {
    const human = hasHumanTurn();
    const result = outcome(board);
    const hint = human && board.size === 3 ? board.edges.find(e => legal(board, e.id) && e.cells.some(i => board.boxes[i].sides === 3)) : null;
    if (!legal(board, focusedEdge)) focusedEdge = board.edges.find(e => legal(board, e.id))?.id ?? -1;
    for (const edge of board.edges) {
      const { guide, drawn, echo, hit } = edgeViews[edge.id];
      const taken = edge.owner !== null;
      guide.style.visibility = taken ? 'hidden' : 'visible';
      guide.classList.toggle('hint', edge === hint);
      for (const path of [drawn, echo]) {
        path.style.visibility = taken ? 'visible' : 'hidden';
        if (taken) path.setAttribute('stroke', ink[edge.owner]);
      }
      hit.parentNode.style.display = human && !taken ? '' : 'none';
      hit.setAttribute('tabindex', human && edge.id === focusedEdge ? '0' : '-1');
      hit.setAttribute('aria-label', t(edge.vertical ? 'vEdge' : 'hEdge', { row: edge.y + 1, col: edge.x + 1 }));
    }
    board.boxes.forEach((box, i) => {
      if (box.owner === null) return;
      const { group, wash, hatch, mark } = boxViews[i];
      wash.setAttribute('fill', paper[box.owner]);
      hatch.setAttribute('fill', `url(#grain-${box.owner})`);
      mark.setAttribute('d', box.owner ? 'M40 40 60 60 M60 39 40 61' : 'M62 50c0 15-24 16-24 1s23-17 24-1Z');
      mark.setAttribute('stroke', ink[box.owner]);
      if (group.getAttribute('visibility') === 'hidden') mark.classList.add('just-closed');
      group.setAttribute('visibility', 'visible');
    });
    dotViews.forEach(({ hit, ring }, id) => {
      hit.style.display = human ? '' : 'none';
      ring.classList.toggle('selected', selectedDot === id);
    });
    $('sheet-name').textContent = t(board.size === 3 ? 'practice' : 'advanced');
    $('dimensions').textContent = `${board.size} × ${board.size}`;
    $('you-score').textContent = board.score[0];
    $('cpu-score').textContent = board.score[1];
    $('move-count').textContent = t('lines', { used: board.moves, total: board.edges.length });
    $('ink-fill').style.width = `${100 * board.moves / board.edges.length}%`;
    $('small').setAttribute('aria-pressed', board.size === 3);
    $('large').setAttribute('aria-pressed', board.size === 5);
    $('large').disabled = !unlocked;
    $('large').querySelector('svg').toggleAttribute('hidden', unlocked);
    $('unlock-note').textContent = t(!unlocked ? 'unlock' : board.size === 3 ? 'unlocked' : 'smart');
    setTurnCopy(result, hint);
    if (dialog.open) renderDialog();
  }

  function haltComputer() {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  function queueComputer() {
    haltComputer();
    if (board.turn !== 1 || outcome(board) || dialog.open || document.hidden) return;
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      move(chooseEdge(board, board.size === 5));
    }, board.last?.closed.length ? 850 : 620);
  }

  function move(id) {
    const played = draw(board, id);
    if (!played) return;
    selectedDot = null;
    invalidPick = false;
    if (played.done && board.size === 3 && !unlocked) {
      unlocked = true;
      try { localStorage.setItem(unlockKey, '1'); } catch { /* Session unlock still applies. */ }
    }
    render();
    if (keyboardBoard && !dialog.open) {
      if (played.done) {
        keyboardBoard = false;
        (board.size === 3 ? $('large') : $('reset')).focus({ preventScroll: true });
      } else if (hasHumanTurn()) edgeViews[focusedEdge].hit.focus({ preventScroll: true });
    }
    queueComputer();
  }

  function pickDot(id) {
    if (selectedDot === null || selectedDot === id) {
      selectedDot = selectedDot === id ? null : id;
      invalidPick = false;
    } else {
      const stride = board.size + 1;
      const ax = selectedDot % stride, ay = Math.floor(selectedDot / stride);
      const bx = id % stride, by = Math.floor(id / stride);
      if (Math.abs(ax - bx) + Math.abs(ay - by) === 1) {
        const edge = board.edges.find(e => e.x === Math.min(ax, bx) && e.y === Math.min(ay, by) && e.vertical === (ax === bx));
        if (edge && legal(board, edge.id)) return move(edge.id);
      }
      invalidPick = true;
      selectedDot = id;
    }
    render();
  }

  svg.addEventListener('click', event => {
    if (!hasHumanTurn() || dialog.open) return;
    const { edge, dot } = event.target.dataset;
    if (edge !== undefined) move(Number(edge));
    else if (dot !== undefined) pickDot(Number(dot));
  });
  document.addEventListener('pointerdown', () => { keyboardBoard = false; });
  document.addEventListener('focusin', event => {
    if (!svg.contains(event.target) && event.target !== document.body) keyboardBoard = false;
  });
  function center(edge) {
    return [edge.x + (edge.vertical ? 0 : .5), edge.y + (edge.vertical ? .5 : 0)];
  }
  svg.addEventListener('keydown', event => {
    if (!hasHumanTurn() || event.target.dataset.edge === undefined) return;
    keyboardBoard = true;
    const from = Number(event.target.dataset.edge);
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) move(from);
      return;
    }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!dir) return;
    event.preventDefault();
    const [x, y] = center(board.edges[from]);
    let best = Infinity, pick = from;
    for (const edge of board.edges) {
      if (!legal(board, edge.id)) continue;
      const [nx, ny] = center(edge);
      const ahead = (nx - x) * dir[0] + (ny - y) * dir[1];
      const side = Math.abs((nx - x) * dir[1] - (ny - y) * dir[0]);
      const distance = ahead + 1.5 * side;
      if (ahead > 0 && distance < best) { best = distance; pick = edge.id; }
    }
    edgeViews[from].hit.setAttribute('tabindex', '-1');
    focusedEdge = pick;
    edgeViews[pick].hit.setAttribute('tabindex', '0');
    edgeViews[pick].hit.focus();
  });

  function start(size) {
    haltComputer();
    board = newBoard(size);
    keyboardBoard = false;
    buildBoard();
    render();
  }
  function renderDialog() {
    const rules = dialogMode === 'rules';
    $('dialog-heading').textContent = t(rules ? 'rules' : nextSize === board.size ? 'restart' : 'change');
    $('rule-content').hidden = !rules;
    $('confirm-copy').hidden = rules;
    $('cancel').hidden = rules;
    $('accept').textContent = t(rules ? 'okay' : 'confirm');
  }
  function showDialog(mode) {
    haltComputer();
    dialogMode = mode;
    renderDialog();
    dialog.showModal();
    (mode === 'rules' ? $('accept') : $('cancel')).focus();
  }
  function requestBoard(size) {
    if (size === 5 && !unlocked) return;
    if (!board.moves || outcome(board)) return start(size);
    nextSize = size;
    showDialog('reset');
  }
  $('small').addEventListener('click', () => { if (board.size !== 3) requestBoard(3); });
  $('large').addEventListener('click', () => { if (board.size !== 5) requestBoard(5); });
  $('reset').addEventListener('click', () => requestBoard(board.size));
  $('help').addEventListener('click', () => showDialog('rules'));
  $('close').addEventListener('click', () => dialog.close());
  $('cancel').addEventListener('click', () => dialog.close());
  $('accept').addEventListener('click', () => {
    dialog.close();
    if (dialogMode === 'reset') start(nextSize);
  });
  dialog.addEventListener('close', queueComputer);
  document.addEventListener('visibilitychange', queueComputer);
  window.addEventListener('pagehide', haltComputer);
  window.addEventListener('pageshow', queueComputer);
  window.addEventListener('boopland:languagechange', render);
  buildBoard();
  render();
})();
