(() => {
  'use strict';
  const E = window.YarnUntangle, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('yarn.' + key, values);
  const board = $('board'), dialog = $('dialog'), palette = ['#c89595', '#99ad84', '#8faab8', '#c5ad76'];
  const STORAGE = 'boopland-yarn-untangle-v1', NS = 'http://www.w3.org/2000/svg';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let levelIndex = 0, level, nodes = [], history = [], moves = 0, won = false, drag = null, hint = null;
  let completed = {}, result, initialCrossings = 1, animation = null, frame = 0, renderPending = false, mode = 'help';
  let edgeElements = [], nodeElements = [], saved = null;
  function svg(tag, attributes = {}) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }
  function readProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE));
      if (!data || typeof data !== 'object') return;
      if (data.completed && typeof data.completed === 'object') {
        for (let id = 1; id <= E.levels.length; id++) {
          const value = data.completed[id];
          if (Number.isSafeInteger(value) && value >= 0) completed[id] = value;
        }
      }
      if (Number.isInteger(data.level) && data.level >= 0 && data.level < E.levels.length) {
        levelIndex = data.level;
        if (E.validNodes(E.levels[levelIndex], data.nodes) && Number.isSafeInteger(data.moves) && data.moves >= 0) saved = data;
      }
    } catch { /* A private session still has fully playable levels. */ }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ level: levelIndex, nodes, moves, completed }));
    } catch { /* Storage is optional. */ }
  }
  function nodeLabel(id) {
    const color = level.strands.findIndex(strand => strand.includes(id));
    return t('node', { color: t('color' + color), number: level.strands[color].indexOf(id) + 1 });
  }
  function buildBoard() {
    $('yarn-layer').replaceChildren(); $('node-layer').replaceChildren(); $('petal-layer').replaceChildren();
    edgeElements = level.edges.map(edge => {
      const group = svg('g');
      const paths = ['yarn-outline', 'yarn-body', 'yarn-stitch', 'yarn-fiber'].map(className => {
        const path = svg('path', { class: className });
        if (className === 'yarn-body') path.setAttribute('stroke', palette[edge.color]);
        group.append(path); return path;
      });
      $('yarn-layer').append(group);
      return paths;
    });
    nodeElements = nodes.map((_, id) => {
      const color = level.strands.findIndex(strand => strand.includes(id));
      const group = svg('g', { class: 'yarn-node', 'data-node': id, tabindex: 0, role: 'button', 'aria-label': nodeLabel(id) });
      const hit = svg('circle', { class: 'node-hit' });
      const halo = svg('circle', { class: 'node-halo' });
      const face = svg('circle', { class: 'node-face', fill: palette[color] });
      const stitches = svg('path', { class: 'node-thread' });
      group.append(hit, halo, face, stitches);
      $('node-layer').append(group);
      return { group, hit, halo, face, stitches, color };
    });
  }
  function loadLevel(index, resume = null) {
    cancelDrag(); stopAnimation();
    levelIndex = index; level = E.levels[index];
    nodes = E.clone(resume ? resume.nodes : level.initial);
    moves = resume ? resume.moves : 0; history = []; hint = null;
    result = E.analyze(level, nodes); won = result.solved;
    initialCrossings = E.analyze(level, level.initial).crossings.length;
    if (won) completed[level.id] = Math.min(completed[level.id] ?? Infinity, moves);
    buildBoard(); refresh(); render(); save();
  }
  function refresh(announce = true) {
    $('level-title').textContent = t('level', { number: level.id, name: t('level' + level.id) });
    $('page-number').textContent = String(level.id).padStart(2, '0') + ' / 12';
    $('cross-count').textContent = result.crossings.length;
    $('move-count').textContent = moves;
    $('thread-meter').style.width = Math.max(0, Math.min(100, (1 - result.crossings.length / initialCrossings) * 100)) + '%';
    $('collection-count').textContent = t('collection', { count: Object.keys(completed).length });
    $('undo').disabled = !history.length || !!animation || !!drag;
    $('hint').disabled = won || !!drag;
    $('hint').setAttribute('aria-pressed', String(!!hint));
    $('next').hidden = !won;
    $('next').firstElementChild.textContent = t(levelIndex === E.levels.length - 1 ? 'album' : 'next');
    $('notebook').classList.toggle('is-won', won);
    $('status-note').classList.toggle('success', won);
    $('status-icon').textContent = won ? '✳' : hint ? '✧' : '↗';
    $('complete-stamp').hidden = !won || !!animation;
    nodeElements.forEach(({ group }, id) => {
      group.setAttribute('aria-label', nodeLabel(id));
      group.setAttribute('aria-disabled', String(won));
      group.setAttribute('tabindex', won ? '-1' : '0');
    });
    if (announce) {
      const key = won ? Object.keys(completed).length === 12 ? 'allDone' : 'success' : hint ? 'hintStatus' : result.crowded.length ? 'crowded' : moves === 0 ? 'ready' : 'playing';
      $('status').textContent = t(key, { moves, count: result.crossings.length });
    }
  }
  function scale() { return Math.abs(board.getScreenCTM()?.a || .5); }
  function render() {
    renderPending = false;
    const k = scale(), radius = Math.max(14, 10.5 / k), hitRadius = Math.max(27, 22 / k);
    const positions = animation ? animation.positions : won ? E.spread(nodes) : nodes;
    board.style.setProperty('--yarn-width', Math.max(10, 4.5 / k));
    edgeElements.forEach((paths, i) => {
      const edge = level.edges[i], a = positions[edge.a], b = positions[edge.b];
      const d = `M${a.x},${a.y} L${b.x},${b.y}`;
      paths.forEach(path => path.setAttribute('d', d));
    });
    const crowded = new Set(result.crowded.flat());
    nodeElements.forEach(({ group, hit, halo, face, stitches, color }, id) => {
      const p = positions[id]; group.setAttribute('transform', `translate(${p.x} ${p.y})`);
      const nearest = Math.min(...positions.filter((_, other) => other !== id).map(q => E.distance(p, q)));
      // Keep neighboring knots visually separate on a small screen. The generous
      // pointer target stays unchanged, and nearest-node picking resolves overlaps.
      const knotRadius = Math.min(radius, Math.max(8, nearest * .38));
      hit.setAttribute('r', hitRadius); face.setAttribute('r', knotRadius); halo.setAttribute('r', knotRadius + 9 / k);
      group.classList.toggle('selected', drag?.id === id || hint?.id === id);
      group.classList.toggle('crowded', crowded.has(id) && !won);
      group.style.opacity = won ? '.8' : '1';
      // One to four little stitches identify yarns without relying on color alone.
      let d = '';
      for (let i = 0; i <= color; i++) {
        const x = (i - color / 2) * knotRadius * .39;
        d += `M${x - knotRadius * .18},${-knotRadius * .48}Q${x + knotRadius * .28},0 ${x - knotRadius * .03},${knotRadius * .48}`;
      }
      stitches.setAttribute('d', d);
    });
    const crossLayer = $('cross-layer'); crossLayer.replaceChildren();
    if (!won) {
      const seen = [];
      result.crossings.forEach(p => {
        if (seen.some(q => E.distance(p, q) < 10 / k)) return;
        seen.push(p);
        const r = Math.max(12, 5.5 / k);
        const group = svg('g', { transform: `translate(${p.x} ${p.y})` });
        group.append(svg('circle', { class: 'cross-mark', r }));
        group.append(svg('path', { class: 'cross-x', d: `M${-r * .35},${-r * .35}L${r * .35},${r * .35}M${r * .35},${-r * .35}L${-r * .35},${r * .35}` }));
        crossLayer.append(group);
      });
    }
    $('hint-layer').replaceChildren();
    if (hint && !won) {
      const p = positions[hint.id], q = hint.point;
      $('hint-layer').append(svg('path', { class: 'hint-line', d: `M${p.x},${p.y}L${q.x},${q.y}` }));
      $('hint-layer').append(svg('circle', { class: 'hint-target', cx: q.x, cy: q.y, r: radius + 6 / k }));
      $('hint-layer').append(svg('path', { class: 'hint-line', d: `M${q.x - radius / 2},${q.y}h${radius}M${q.x},${q.y - radius / 2}v${radius}` }));
    }
  }
  function requestRender() {
    if (!renderPending) { renderPending = true; requestAnimationFrame(render); }
  }
  function stopAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; animation = null;
    $('petal-layer').replaceChildren();
  }
  function celebrate() {
    const from = E.clone(nodes), to = E.spread(nodes);
    if (reducedMotion.matches || document.hidden) { refresh(); render(); return; }
    animation = { positions: from };
    const petals = Array.from({ length: 16 }, (_, i) => {
      const el = svg('path', { class: 'petal', stroke: palette[i % 4], d: 'M-6 0Q0-9 6 0Q0 9-6 0' });
      $('petal-layer').append(el); return el;
    });
    refresh();
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / 1300), ease = 1 - (1 - p) ** 3;
      animation.positions = from.map((a, i) => ({ x: a.x + (to[i].x - a.x) * ease, y: a.y + (to[i].y - a.y) * ease }));
      petals.forEach((petal, i) => {
        const angle = i * Math.PI * 2 / petals.length + .2;
        const radius = 270 + ease * 175;
        petal.setAttribute('transform', `translate(${500 + Math.cos(angle) * radius},${500 + Math.sin(angle) * radius}) rotate(${i * 36 + ease * 50})`);
        petal.style.opacity = Math.sin(p * Math.PI) * .7;
      });
      render();
      if (p < 1) frame = requestAnimationFrame(tick);
      else { stopAnimation(); refresh(); render(); }
    }
    frame = requestAnimationFrame(tick);
  }
  function snapshot() { return { nodes: E.clone(nodes), moves }; }
  function finishMove(before) {
    if (!nodes.some((p, id) => E.distance(p, before.nodes[id]) > .2)) { refresh(); render(); return; }
    history.push(before); if (history.length > 150) history.shift();
    moves++; hint = null; result = E.analyze(level, nodes);
    won = result.solved;
    if (won) completed[level.id] = Math.min(completed[level.id] ?? Infinity, moves);
    save(); refresh();
    if (won) celebrate(); else render();
  }
  function pointFromEvent(event) {
    const matrix = board.getScreenCTM(); if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  }
  function releaseDrag() {
    const active = drag; drag = null; board.classList.remove('dragging');
    if (active && board.hasPointerCapture(active.pointerId)) board.releasePointerCapture(active.pointerId);
    return active;
  }
  function cancelDrag() {
    const active = releaseDrag();
    if (!active) return;
    nodes = active.before.nodes; moves = active.before.moves;
    result = E.analyze(level, nodes); refresh(); render();
  }
  board.addEventListener('pointerdown', event => {
    if (won || drag || dialog.open || event.button !== 0 || event.isPrimary === false) return;
    const p = pointFromEvent(event); if (!p) return;
    let id = -1, nearest = Math.max(27, 22 / scale());
    nodes.forEach((node, index) => { const d = E.distance(node, p); if (d < nearest) { nearest = d; id = index; } });
    if (id < 0) return;
    event.preventDefault(); hint = null;
    drag = { id, pointerId: event.pointerId, before: snapshot(), offset: { x: nodes[id].x - p.x, y: nodes[id].y - p.y } };
    board.setPointerCapture(event.pointerId); board.classList.add('dragging');
    nodeElements[id].group.focus({ preventScroll: true });
    refresh(false); render();
  });
  board.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault(); const p = pointFromEvent(event); if (!p) return;
    nodes[drag.id] = E.clamp({ x: p.x + drag.offset.x, y: p.y + drag.offset.y });
    result = E.analyze(level, nodes); refresh(false); requestRender();
  });
  board.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    // Include the final coordinate even when the browser coalesced the last move.
    const p = pointFromEvent(event);
    if (p) nodes[drag.id] = E.clamp({ x: p.x + drag.offset.x, y: p.y + drag.offset.y });
    const active = releaseDrag(); finishMove(active.before);
  });
  board.addEventListener('pointercancel', event => { if (drag?.pointerId === event.pointerId) cancelDrag(); });
  board.addEventListener('lostpointercapture', () => { if (drag) cancelDrag(); });
  board.addEventListener('keydown', event => {
    if (event.key === 'Escape') { cancelDrag(); return; }
    if (won || drag || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const group = event.target.closest('[data-node]'); if (!group) return;
    event.preventDefault();
    const id = Number(group.dataset.node), before = snapshot(), step = event.shiftKey ? 45 : 12;
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const [dx, dy] = directions[event.key];
    nodes[id] = E.clamp({ x: nodes[id].x + dx * step, y: nodes[id].y + dy * step });
    finishMove(before);
  });
  $('undo').addEventListener('click', () => {
    if (!history.length || animation) return;
    cancelDrag(); const before = history.pop(); nodes = before.nodes; moves = before.moves; won = false; hint = null;
    result = E.analyze(level, nodes); refresh(); render(); save();
  });
  $('reset').addEventListener('click', () => loadLevel(levelIndex));
  $('hint').addEventListener('click', () => {
    if (won || drag) return;
    hint = hint ? null : E.hint(level, nodes); refresh(); render();
  });
  $('next').addEventListener('click', () => {
    if (!won) return;
    if (levelIndex < E.levels.length - 1) { loadLevel(levelIndex + 1); $('hint').focus(); }
    else openDialog('levels');
  });
  function fillDialog() {
    $('dialog-title').textContent = t(mode === 'help' ? 'help' : 'levels');
    const content = $('dialog-content'); content.replaceChildren();
    if (mode === 'help') {
      const list = document.createElement('ol'); list.className = 'rules';
      for (let i = 1; i <= 4; i++) { const item = document.createElement('li'); item.textContent = t('help' + i); list.append(item); }
      content.append(list);
    } else {
      const note = document.createElement('p'); note.className = 'atlas-note'; note.textContent = t('atlasNote');
      const grid = document.createElement('div'); grid.className = 'level-grid';
      E.levels.forEach((item, index) => {
        const button = document.createElement('button'), number = document.createElement('b'), status = document.createElement('small');
        const state = t(Object.hasOwn(completed, item.id) ? 'completed' : 'unplayed');
        button.type = 'button'; button.className = 'level-tile' + (index === levelIndex ? ' current' : '');
        button.setAttribute('aria-label', t('levelChoice', { number: item.id, name: t('level' + item.id), state }));
        if (index === levelIndex) button.setAttribute('aria-current', 'true');
        number.textContent = String(item.id).padStart(2, '0'); status.textContent = state;
        button.append(number, status); button.addEventListener('click', () => {
          dialog.close();
          if (index !== levelIndex) loadLevel(index);
        }); grid.append(button);
      });
      content.append(note, grid);
    }
  }
  function openDialog(nextMode) {
    cancelDrag(); mode = nextMode; fillDialog();
    dialog.showModal();
  }
  $('help').addEventListener('click', () => openDialog('help'));
  $('levels').addEventListener('click', () => openDialog('levels'));
  $('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  window.addEventListener('boopland:languagechange', () => { refresh(); if (dialog.open) fillDialog(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelDrag(); if (animation) { stopAnimation(); refresh(); render(); } save(); }
  });
  window.addEventListener('blur', cancelDrag);
  window.addEventListener('pagehide', () => { cancelDrag(); stopAnimation(); save(); });
  new ResizeObserver(() => { if (drag) cancelDrag(); requestRender(); }).observe($('board-space'));
  readProgress(); loadLevel(levelIndex, saved);
})();
