(() => {
  'use strict';
  const E = HexMeadow, A = HexArt, I = BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t(`hex.${key}`, values);
  const SAVE = 'boopland-hex-meadow-v1', BEST = 'boopland-hex-meadow-best';
  let state, rotation = 0, selected = null, hovered = null, sound = false, audio = null, best = 0, saveOK = true;
  let statusKey = 'select', statusValues = {}, dialogKind = null, lastFocus = null, endTimer = 0, scoreTimer = 0;
  let cam = { x: 0, y: 0, zoom: 1 }, width = 1, height = 1, fitted = false;
  const board = $('board'), stage = $('stage'), pointers = new Map();
  let gesture = null, pinching = false;
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE) || 'null');
    state = saved && E.restore(saved.game);
    if (state && Number.isInteger(saved.rotation) && saved.rotation >= 0 && saved.rotation < 6) rotation = saved.rotation;
    best = Math.max(0, Number(localStorage.getItem(BEST)) || 0);
  } catch { saveOK = false; }
  if (!state) state = E.create();
  $('board-defs').innerHTML = A.defs;
  const questIcons = {
    f:'<path d="M15 31V9M5 24l6-10H8l7-11 7 11h-3l6 10ZM9 30h12"/>',
    v:'<path d="m3 16 12-10 12 10M6 14v15h18V14M12 29V19h6v10M20 8V4h3v7"/>',
    w:'<path d="M7 3c21 6-16 10 5 16s13 9 5 13M15 2c21 6-16 10 5 16s13 9 5 13M2 13h4m-1 13h4"/>'
  };
  function setStatus(key, values = {}) { statusKey = key; statusValues = values; $('status').textContent = t(key, values); }
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ game: E.serialize(state), rotation }));
      best = Math.max(best, state.score); localStorage.setItem(BEST, String(best)); saveOK = true;
    } catch { saveOK = false; }
    $('save-status').textContent = t(saveOK ? 'saved' : 'unsaved');
  }
  function updateCamera() { $('world').setAttribute('transform', `translate(${width / 2 + cam.x} ${height / 2 + cam.y}) scale(${cam.zoom})`); }
  function fit() {
    const points = [...Object.values(state.board), ...E.frontier(state)].map(c => A.position(c.q, c.r));
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = Math.min(...xs) - 65, maxX = Math.max(...xs) + 65, minY = Math.min(...ys) - 70, maxY = Math.max(...ys) + 62;
    cam.zoom = Math.max(.08, Math.min(1.8, (width - 28) / (maxX - minX), (height - 18) / (maxY - minY)));
    cam.x = -(minX + maxX) / 2 * cam.zoom; cam.y = -(minY + maxY) / 2 * cam.zoom;
    updateCamera();
  }
  function resize() {
    const rect = stage.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    board.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if (!fitted || !pointers.size) { fit(); fitted = true; } else updateCamera();
  }
  function zoom(factor, x = width / 2, y = height / 2) {
    const old = cam.zoom; cam.zoom = Math.max(.08, Math.min(3, old * factor));
    const ratio = cam.zoom / old;
    cam.x = x - width / 2 - (x - width / 2 - cam.x) * ratio;
    cam.y = y - height / 2 - (y - height / 2 - cam.y) * ratio;
    updateCamera();
  }
  function renderBoard(newKey) {
    $('slots').innerHTML = state.ended ? '' : E.frontier(state).map(cell => {
      const [x, y] = A.position(cell.q, cell.r), id = E.key(cell.q, cell.r);
      return `<g transform="translate(${x} ${y})" data-cell="${id}"><title>${t('slot', cell)}</title><polygon class="slot" points="${A.hex}"/><path class="slot-plus" d="M-4 0h8M0-4v8"/></g>`;
    }).join('');
    $('tiles').innerHTML = Object.values(state.board).sort((a, b) => A.position(a.q, a.r)[1] - A.position(b.q, b.r)[1]).map(cell => {
      const [x, y] = A.position(cell.q, cell.r);
      return `<g transform="translate(${x} ${y})"${E.key(cell.q, cell.r) === newKey ? ' class="new-tile"' : ''}>${A.art(cell)}</g>`;
    }).join('');
    renderGhost();
  }
  function renderGhost() {
    const cell = selected || hovered;
    if (!cell || state.ended) { $('ghost').innerHTML = ''; $('place').disabled = true; return; }
    const result = E.evaluate(state, cell.q, cell.r, rotation), [x, y] = A.position(cell.q, cell.r);
    const lines = (result.matched || []).map(i => `<path d="M${A.vertices[i].join(' ')} ${A.vertices[(i + 1) % 6].join(' ')}" stroke="#4f7853" stroke-width="4"/>`).join('');
    $('ghost').innerHTML = `<g transform="translate(${x} ${y})" opacity=".85">${A.art(E.current(state, rotation))}<polygon class="ghost-outline ${result.valid ? 'ghost-valid' : 'ghost-invalid'}" points="${A.hex}"/>${lines}${result.valid ? '' : '<path d="M-8-8 8 8M8-8-8 8" stroke="#9c5948" stroke-width="3"/>'}</g>`;
    $('place').disabled = !selected || !result.valid;
    if (selected) setStatus(result.valid ? result.perfect ? 'perfectPreview' : 'preview' : result.reason, { n: result.matched?.length || 0, points: result.points });
  }
  function renderUI() {
    $('score').textContent = state.score.toLocaleString(I.language);
    $('remaining').textContent = state.mode === 'free' ? '∞' : state.remaining;
    $('mode-badge').textContent = t(state.mode); $('completed').textContent = t('done', { n: state.completed });
    $('map-number').textContent = t('mapCount', { n: Object.keys(state.board).length });
    const sizes = E.regions(state), names = { f: 'forestGoal', v: 'villageGoal', w: 'riverGoal' };
    $('quests').innerHTML = Object.keys(names).map(type => `<div class="quest" data-type="${type}"><div class="quest-icon" aria-hidden="true"><svg viewBox="0 0 30 36">${questIcons[type]}</svg></div><div><div class="quest-line"><span>${t(names[type])}</span><strong>${sizes[type]} / ${state.goals[type]}</strong></div><div class="progress" role="progressbar" aria-label="${t(names[type])}" aria-valuemin="0" aria-valuemax="${state.goals[type]}" aria-valuenow="${sizes[type]}"><i style="width:${Math.min(100, sizes[type] / state.goals[type] * 100)}%"></i></div></div></div>`).join('');
    $('tile-preview').innerHTML = A.preview(E.current(state, rotation));
    $('tile-name').textContent = t(E.current(state).type); $('rotation-label').textContent = t('rotation', { n: rotation + 1 });
    $('next-previews').innerHTML = state.queue.slice(1).map(item => A.preview(E.tile(item.index, 0, item.variant))).join('');
    $('swap-label').textContent = t('swap', { n: state.swaps });
    $('swap').disabled = state.swaps <= 0 || state.ended; $('undo').disabled = !state.actions.length;
    $('swap').setAttribute('aria-label', t('swap', { n: state.swaps })); $('swap').title = t('swap', { n: state.swaps });
    $('rotate-left').disabled = $('rotate-right').disabled = state.ended;
    $('sound').setAttribute('aria-label', t(sound ? 'soundOn' : 'soundOff')); $('sound').title = t(sound ? 'soundOn' : 'soundOff');
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>${sound ? '<path d="M15 8q5 4 0 8m3-11q8 7 0 14"/>' : '<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;
    $('save-status').textContent = t(saveOK ? 'saved' : 'unsaved');
    $('status').textContent = t(statusKey, statusValues);
  }
  function chime(celebrate = false) {
    if (!sound || document.hidden) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const notes = celebrate ? [523.25, 659.25, 783.99] : [392, 523.25];
      notes.forEach((hz, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * .085;
        oscillator.type = 'sine'; oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.035, start + .02); gain.gain.exponentialRampToValueAtTime(.0001, start + .5);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + .55);
      });
    } catch { sound = false; renderUI(); }
  }
  function choose(cell) { if (state.ended) return; selected = cell; hovered = null; renderGhost(); }
  function rotate(by) { if (state.ended) return; rotation = (rotation + by + 6) % 6; renderUI(); renderGhost(); save(); }
  function place() {
    if (!selected || state.ended) return;
    const cell = selected, result = E.apply(state, { kind: 'place', ...cell, rotation });
    if (!result.ok) { setStatus(result.reason || 'select'); return; }
    selected = hovered = null; rotation = 0;
    renderBoard(E.key(cell.q, cell.r)); renderUI(); save();
    setStatus(result.finished.length ? 'questDone' : 'placed', { n: result.finished.length * 5, points: result.gained });
    $('floating-score').textContent = `+${result.gained}`; $('floating-score').classList.remove('show');
    void $('floating-score').offsetWidth; $('floating-score').classList.add('show');
    clearTimeout(scoreTimer); scoreTimer = setTimeout(() => $('floating-score').classList.remove('show'), 1400);
    chime(result.finished.length > 0);
    if (state.ended) { setStatus(state.remaining <= 0 ? 'endStatus' : 'limitStatus'); clearTimeout(endTimer); endTimer = setTimeout(() => { if (state.ended) openDialog('end'); }, 550); }
  }
  function undo() {
    if (!state.actions.length) return;
    clearTimeout(endTimer); state = E.undo(state); rotation = 0; selected = hovered = null;
    renderBoard(); renderUI(); save(); setStatus('undone');
  }
  function newGame(mode) {
    clearTimeout(endTimer); state = E.create(Date.now() >>> 0, mode); selected = hovered = null; rotation = 0;
    closeDialog(); renderBoard(); renderUI(); fit(); save(); setStatus('select');
  }
  function addButton(parent, label, handler, primary = false) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    if (primary) button.className = 'primary'; button.addEventListener('click', handler); parent.append(button);
  }
  function renderDialog() {
    const content = $('dialog-content'); content.replaceChildren();
    $('dialog-title').textContent = t(dialogKind === 'help' ? 'helpTitle' : dialogKind === 'end' ? 'endTitle' : 'newTitle');
    const paragraph = (text, cls) => { const p = document.createElement('p'); p.textContent = text; if (cls) p.className = cls; content.append(p); };
    if (dialogKind === 'help') {
      const list = document.createElement('ol');
      ['help1','help2','help3','help4'].forEach(key => { const li = document.createElement('li'); li.textContent = t(key); list.append(li); });
      content.append(list); paragraph(t('inspired'), 'help-key');
    } else {
      if (dialogKind === 'end') {
        paragraph(String(state.score), 'result-score'); paragraph(t('endText', { n: state.placed, goals: state.completed })); paragraph(t('best', { n: best }), 'help-key');
      } else paragraph(t('newText'));
      const actions = document.createElement('div'); actions.className = 'dialog-actions'; content.append(actions);
      if (dialogKind === 'end') {
        addButton(actions, t('again'), () => openDialog('new'), true);
        addButton(actions, t('undo'), () => { closeDialog(); undo(); });
        addButton(actions, t('viewMap'), closeDialog);
      } else {
        addButton(actions, t('startClassic'), () => newGame('classic'), true);
        addButton(actions, t('startFree'), () => newGame('free'));
      }
    }
  }
  function openDialog(kind) {
    dialogKind = kind; if (!$('dialog').open) lastFocus = document.activeElement;
    renderDialog(); if (!$('dialog').open) $('dialog').showModal();
  }
  function closeDialog() { $('dialog').close(); }
  $('dialog').addEventListener('close', () => { dialogKind = null; lastFocus?.focus?.(); });
  $('close-dialog').addEventListener('click', closeDialog);
  $('help').addEventListener('click', () => openDialog('help'));
  $('restart').addEventListener('click', () => openDialog('new'));
  $('rotate-left').addEventListener('click', () => rotate(-1)); $('rotate-right').addEventListener('click', () => rotate(1));
  $('place').addEventListener('click', place); $('undo').addEventListener('click', undo);
  $('swap').addEventListener('click', () => {
    if (!E.apply(state, { kind: 'swap' }).ok) return;
    rotation = 0; renderUI(); renderGhost(); save(); if (!selected) setStatus('swapped');
    if (state.ended) { renderBoard(); setStatus('limitStatus'); openDialog('end'); }
  });
  $('fit').addEventListener('click', fit); $('zoom-in').addEventListener('click', () => zoom(1.2)); $('zoom-out').addEventListener('click', () => zoom(1 / 1.2));
  $('sound').addEventListener('click', () => { sound = !sound; if (!sound && audio) audio.suspend().catch(() => {}); renderUI(); chime(); });
  function pointerCell(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell]');
    if (!element || !board.contains(element)) return null;
    const [q, r] = element.dataset.cell.split(',').map(Number); return { q, r };
  }
  const pointerDistance = () => { const values = [...pointers.values()]; return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y); };
  board.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    board.focus({ preventScroll: true }); board.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) gesture = { x: event.clientX, y: event.clientY, cx: cam.x, cy: cam.y, moved: false };
    else { pinching = true; gesture = { distance: pointerDistance(), moved: true }; }
  });
  board.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) {
      if (event.pointerType !== 'mouse' || selected) return;
      const cell = pointerCell(event);
      if (JSON.stringify(cell) !== JSON.stringify(hovered)) { hovered = cell; renderGhost(); }
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const distance = pointerDistance(), values = [...pointers.values()], rect = board.getBoundingClientRect();
      if (gesture.distance > 0) zoom(distance / gesture.distance, (values[0].x + values[1].x) / 2 - rect.left, (values[0].y + values[1].y) / 2 - rect.top);
      gesture.distance = distance; return;
    }
    if (pinching) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 6) gesture.moved = true;
    if (gesture.moved) { cam.x = gesture.cx + dx; cam.y = gesture.cy + dy; board.classList.add('dragging'); updateCamera(); }
  });
  function releasePointer(event, cancelled = false) {
    if (!pointers.has(event.pointerId)) return;
    if (!cancelled && !pinching && !gesture?.moved) { const cell = pointerCell(event); if (cell) choose(cell); }
    pointers.delete(event.pointerId);
    if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
    if (!pointers.size) { gesture = null; pinching = false; board.classList.remove('dragging'); }
  }
  board.addEventListener('pointerup', event => releasePointer(event)); board.addEventListener('pointercancel', event => releasePointer(event, true));
  board.addEventListener('lostpointercapture', event => releasePointer(event, true));
  board.addEventListener('pointerleave', () => { if (!pointers.size) { hovered = null; renderGhost(); } });
  board.addEventListener('wheel', event => { event.preventDefault(); const rect = board.getBoundingClientRect(); zoom(Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top); }, { passive: false });
  document.addEventListener('keydown', event => {
    if ($('dialog').open || event.ctrlKey || event.altKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (['q','e','r'].includes(key)) { event.preventDefault(); rotate(key === 'q' ? -1 : 1); }
    else if (key === 'escape') { selected = hovered = null; renderGhost(); setStatus('select'); }
    else if (event.target === board && key === 'enter') { event.preventDefault(); place(); }
    else if (event.target === board && key.startsWith('arrow') && !state.ended) {
      event.preventDefault(); const cells = E.frontier(state); if (!cells.length) return;
      if (!selected) choose(cells[0]);
      else {
        const dir = { arrowleft: [-1,0], arrowright: [1,0], arrowup: [0,-1], arrowdown: [0,1] }[key];
        const p = A.position(selected.q, selected.r);
        const candidates = cells.map(c => { const xy = A.position(c.q, c.r), dx = xy[0] - p[0], dy = xy[1] - p[1], along = dx * dir[0] + dy * dir[1]; return { c, along, weight: Math.hypot(dx,dy) + Math.abs(dx * dir[1] - dy * dir[0]) * 1.5 }; }).filter(c => c.along > 1).sort((a,b) => a.weight - b.weight);
        if (candidates.length) choose(candidates[0].c);
      }
      if (selected) {
        const [x,y] = A.position(selected.q,selected.r), sx = width/2 + cam.x + x * cam.zoom, sy = height/2 + cam.y + y * cam.zoom;
        if (sx < 65 || sx > width-65 || sy < 60 || sy > height-60) { cam.x = -x * cam.zoom; cam.y = -y * cam.zoom; updateCamera(); }
      }
    }
  });
  window.addEventListener('boopland:languagechange', () => { renderUI(); renderBoard(); if (dialogKind) renderDialog(); });
  document.addEventListener('visibilitychange', () => { document.documentElement.classList.toggle('background-paused', document.hidden); if (document.hidden) { if (audio) audio.suspend().catch(() => {}); pointers.clear(); gesture = null; pinching = false; board.classList.remove('dragging'); save(); } });
  window.addEventListener('pagehide', save);
  new ResizeObserver(resize).observe(stage);
  renderUI(); renderBoard(); resize(); save();
  if (state.ended) setStatus(state.remaining <= 0 ? 'endStatus' : 'limitStatus');
})();
