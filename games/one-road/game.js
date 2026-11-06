(() => {
  'use strict';
  const E = OneRoad, I = BooplandI18n, $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`oneRoad.${key}`, values);
  const board = $('board'), dialog = $('dialog');
  const saveKey = 'boopland-one-road-v1';
  let progress = Array(E.levels.length).fill(0), selected = 0, canSave = true;
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
    if (saved && Array.isArray(saved.stars)) progress = progress.map((_, i) => Number.isInteger(saved.stars[i]) && saved.stars[i] >= 0 && saved.stars[i] <= 3 ? saved.stars[i] : 0);
    if (Number.isInteger(saved?.level) && saved.level >= 0 && saved.level < E.levels.length) selected = saved.level;
  } catch { canSave = false; }
  let state = E.create(E.levels[selected]);
  let showHint = false, message = 'ready', badCell = null, gesture = null, modal = null;
  const svg = (tag, attributes = {}, text) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const spacing = () => 456 / (state.level.size - 1);
  const pos = p => [72 + p[0] * spacing(), 72 + p[1] * spacing()];
  const points = route => route.map(p => pos(p).join(',')).join(' ');
  function persist() {
    try { localStorage.setItem(saveKey, JSON.stringify({ level: selected, stars: progress })); canSave = true; }
    catch { canSave = false; }
  }
  const art = {
    tree: '<ellipse cx="1" cy="24" rx="24" ry="6" fill="#dce3cd" opacity=".65"/><path d="M-3 26 0-9 3 26" fill="#b7a28a" stroke="#7c826c"/><path d="M0-36C-9-29-11-23-20-13l9-1-16 20 13-1-16 17c14 7 40 7 58-1L14 4l12 1-16-19 9 1Z" fill="#ceddc0" stroke="#7d906d" stroke-width="1.5" stroke-linejoin="round"/><path d="m0-28-4 11m5 3-11 14M1 4l-14 13m17-4 10 6" fill="none" stroke="#a4b492" stroke-width="1.2"/><path d="m-18 8-8 11m46-6 5 6" fill="none" stroke="#889b77" opacity=".5"/>',
    rock: '<ellipse cy="20" rx="29" ry="7" fill="#e4e4d7"/><path d="m-28 13 9-28 20-7 21 12 8 27-15 6-31-2Z" fill="#deded2" stroke="#93988a" stroke-width="1.5" stroke-linejoin="round"/><path d="m-19-15 17 9 24-4M-2-6l-8 27m8-27 17 29" fill="none" stroke="#b2b5a7"/><path d="m-22 10 5-13m-7 19 9-2m31-2 7 3" fill="none" stroke="#a6aa9b" stroke-width="1.2"/>',
    water: '<path d="M-31-8C-22-23-7-18 3-22S36-11 32 4s-14 24-32 20S-41 12-31-8Z" fill="#dce8e5" stroke="#94b0a8" stroke-width="1.4"/><path d="M-22 0q7 4 14 0m4 9q10 4 20-1M-6-9q8 3 17 0" fill="none" stroke="#a4beb6" stroke-linecap="round"/><path d="m-25 19-2-10m5 12 2-8m43-27 2-10m2 12 4-6" fill="none" stroke="#9aa987" stroke-width="1.3"/>',
    start: '<ellipse cy="10" rx="27" ry="10" fill="#dce5d2" opacity=".6"/><circle r="19" fill="#e5ecd9" stroke="#6f875e" stroke-width="1.8"/><circle r="11" fill="#829b6c" stroke="#5b7352" stroke-width="1.4"/><path d="m-5 0 4 4 7-8" fill="none" stroke="#fbfcf0" stroke-width="2" stroke-linecap="round"/>',
    finish: '<ellipse cy="24" rx="21" ry="6" fill="#dce5d2"/><path d="M-7 24V-30" fill="none" stroke="#6c7a5e" stroke-width="2.2" stroke-linecap="round"/><path d="M-6-29q14-8 28 0l-4 18q-11-8-24 0Z" fill="#d7c78e" stroke="#8b8c67" stroke-width="1.6" stroke-linejoin="round"/><path d="m-1-24 5 2 4-3 5 3m-14 6 5 2 4-3 5 3" fill="none" stroke="#a7a171" stroke-width="1.2"/>'
  };
  function house(index, linked) {
    const roof = ['#c7a18e','#bdc7a5','#cfbb8d','#aebfc0'][index % 4];
    return `<ellipse cy="25" rx="29" ry="6" fill="#e4e4d0" opacity=".7"/><path d="m-22-6 1 30 43-1V-7" fill="#f3ead6" stroke="#858571" stroke-width="1.5"/><path d="M10-24v-11h7v16" fill="#d6c6ac" stroke="#8a8873" stroke-width="1.4"/><path d="m-29-5 28-25 30 25-6 5L-1-20-24 0Z" fill="${roof}" stroke="#858571" stroke-width="1.6" stroke-linejoin="round"/><path d="m-25-8 24-20 25 21" fill="none" stroke="#fff8e8" stroke-opacity=".6"/><path d="M-5 24V5H6v19" fill="${linked ? '#98ac7f' : '#c5c6ad'}" stroke="#8c927a" stroke-width="1.1"/><path d="M-17 3h8v9h-8Zm29 0h7v9h-7Z" fill="${linked ? '#e2ca83' : '#e8e9dd'}" stroke="#959984" stroke-width="1.1"/><path d="M-19 20h10m6 7h12" stroke="#b7b59c" fill="none"/>${linked ? '<circle cx="24" cy="-23" r="9" fill="#6f885b" stroke="#fffef7" stroke-width="2"/><path d="m20-23 3 3 5-6" fill="none" stroke="#fffef7" stroke-width="1.5" stroke-linecap="round"/>' : ''}`;
  }
  function renderBoard() {
    const level = state.level;
    const fragment = document.createDocumentFragment();
    const lattice = svg('g', { fill: 'none', stroke: '#d7ddc9', 'stroke-width': 1, 'stroke-dasharray': '2 7', opacity: .65 });
    for (let i = 0; i < level.size; i++) {
      const v = pos([i, i])[0];
      lattice.append(svg('path', { d: `M72 ${v}H528M${v} 72V528` }));
    }
    fragment.append(lattice);
    // Small pencil grass strokes keep the map tactile without obscuring nodes.
    const grass = svg('g', { stroke: '#b7c5a2', 'stroke-width': 1.2, fill: 'none', 'stroke-linecap': 'round', opacity: .7, 'aria-hidden': true });
    for (const [x,y] of [[34,163],[559,248],[196,562],[405,31],[34,426],[556,472]]) grass.append(svg('path', { d: `M${x} ${y}l-3-8m4 7 3-11m-1 12 5-4` }));
    fragment.append(grass);
    if (showHint) fragment.append(svg('polyline', { points: points(level.solution), class: 'hint-route', 'aria-hidden': true }));
    if (state.path.length > 1) {
      for (const cls of ['road-edge', 'road-fill', 'road-stitch']) fragment.append(svg('polyline', { points: points(state.path), class: cls, 'aria-hidden': true }));
    }
    const iconScale = level.size < 6 ? 1.06 : level.size === 6 ? .98 : .87;
    for (let row = 0; row < level.size; row++) for (let col = 0; col < level.size; col++) {
      const p = [col, row], [x, y] = pos(p), houseIndex = level.houses.findIndex(h => E.same(h, p));
      const obstacle = level.obstacles.find(o => E.same(o.position, p));
      const visited = state.path.some(v => E.same(v, p));
      const type = E.same(level.start, p) ? 'start' : E.same(level.finish, p) ? 'finish' : houseIndex >= 0 ? 'house' : obstacle?.type || (visited ? 'route' : 'empty');
      const cell = svg('g', { transform: `translate(${x},${y})`, class: 'cell', 'data-cell': E.key(p), 'aria-label': t('cell', { row:row + 1, col:col + 1, type:t(type) }), role:'img' });
      if (E.same(badCell, p)) cell.append(svg('rect', { x:-spacing()*.4, y:-spacing()*.4, width:spacing()*.8, height:spacing()*.8, rx:12, class:'bad-cell' }));
      if (houseIndex >= 0 || art[type]) {
        const artwork = svg('g', { transform:`scale(${iconScale})`, 'aria-hidden':true });
        artwork.innerHTML = houseIndex >= 0 ? house(houseIndex, visited) : art[type];
        cell.append(artwork);
      } else cell.append(svg('circle', { r:visited ? 2.5 : 3.2, fill:visited ? '#eef0d9' : '#bdc8ab' }));
      if (E.same(state.path.at(-1), p) && !state.won) cell.append(svg('circle', { r:level.size < 6 ? 35 : 30, class:'current-ring', 'aria-hidden':true }));
      cell.append(svg('rect', { x:-spacing()/2, y:-spacing()/2, width:spacing(), height:spacing(), class:'node-target', 'aria-hidden':true }));
      fragment.append(cell);
    }
    board.replaceChildren(fragment);
  }
  function render() {
    const level = state.level, count = E.connected(state), steps = state.path.length - 1;
    $('level-title').textContent = t('levelTitle', { index:String(level.id).padStart(2,'0'), name:t(level.id <= 4 ? 'meadow' : level.id <= 8 ? 'creek' : 'hill') });
    $('map-number').textContent = `${String(level.id).padStart(2,'0')} / 12`;
    $('houses-count').replaceChildren(document.createTextNode(String(count) + ' '));
    const total = document.createElement('small'); total.textContent = `/ ${level.houses.length}`; $('houses-count').append(total);
    $('steps-count').textContent = steps;
    $('target').textContent = t('target', { count:level.target });
    $('house-checks').replaceChildren(...level.houses.map(h => { const el = document.createElement('i'); el.className = state.path.some(p => E.same(p,h)) ? 'checked' : ''; return el; }));
    $('status').textContent = t(state.won ? 'win' : message, { count:steps, stars:E.stars(state) });
    const error = ['obstacle','crossing','missing','adjacent','outside'].includes(message) && !state.won;
    $('status-box').className = `status-box${state.won ? ' won' : error ? ' error' : ''}`;
    $('status-symbol').textContent = state.won ? '✿' : error ? '!' : '✎';
    $('undo').disabled = state.path.length < 2;
    $('reset').disabled = state.path.length < 2 && !showHint && message === 'ready';
    $('hint').setAttribute('aria-pressed', String(showHint));
    $('hint').lastElementChild.textContent = t(showHint ? 'hideHint' : 'hint');
    $('next').hidden = !state.won;
    document.querySelector('.notebook').classList.toggle('is-won', state.won);
    $('next').firstElementChild.textContent = t(selected === E.levels.length - 1 ? 'allDone' : 'next');
    $('progress').textContent = t('progress', {count:progress.filter(Boolean).length,total:E.levels.length});
    $('total-stars').textContent = `☆ ${progress.reduce((a,b)=>a+b,0)} / 36`;
    renderBoard();
  }
  function chooseLevel(index) {
    selected = index; state = E.create(E.levels[index]);
    showHint = false; message = 'ready'; badCell = null; gesture = null;
    persist(); render();
  }
  function applyMove(p) {
    const result = E.move(state, p);
    if (result.reason === 'same' || result.reason === 'done') return result;
    badCell = result.changed ? null : p;
    if (result.changed) {
      message = state.path.length > 1 ? 'drawing' : 'ready';
      if (state.won) { progress[selected] = Math.max(progress[selected], E.stars(state)); persist(); gesture = null; }
    } else message = result.reason;
    render(); return result;
  }
  function undo() {
    if (E.undo(state)) { message = state.path.length > 1 ? 'drawing' : 'ready'; badCell = null; gesture = null; render(); }
  }
  function hint() { showHint = !showHint; message = showHint ? 'hintShown' : state.path.length > 1 ? 'drawing' : 'ready'; badCell = null; render(); }
  function pointFromEvent(event) {
    const matrix = board.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }
  function cellFromPoint(p) {
    if (!p) return null;
    const x = (p.x - 72) / spacing(), y = (p.y - 72) / spacing();
    const cell = [Math.round(x), Math.round(y)];
    if (cell.some(v => v < 0 || v >= state.level.size)) return null;
    return cell;
  }
  board.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || state.won) return;
    const point = pointFromEvent(event), cell = cellFromPoint(point);
    if (!cell) return;
    event.preventDefault(); board.focus({preventScroll:true});
    const result = applyMove(cell);
    if ((result.changed || result.reason === 'same') && !state.won) {
      gesture = { id:event.pointerId, last:point, blocked:false };
      board.setPointerCapture(event.pointerId);
    }
  });
  board.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId || gesture.blocked || state.won) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const previous = gesture.last, distance = Math.hypot(point.x-previous.x,point.y-previous.y);
    // Sample the whole pointer segment, so a fast swipe cannot jump an obstacle.
    const samples = Math.min(300, Math.max(1, Math.ceil(distance / (spacing() / 5))));
    for (let i=1; i<=samples && gesture && !gesture.blocked; i++) {
      const cell = cellFromPoint({x:previous.x+(point.x-previous.x)*i/samples,y:previous.y+(point.y-previous.y)*i/samples});
      if (!cell) { gesture.blocked = true; break; }
      const result = applyMove(cell);
      if (!result.changed && result.reason !== 'same' && result.reason !== 'done' && gesture) gesture.blocked = true;
    }
    if (gesture) gesture.last = point;
  });
  function endGesture() { gesture = null; }
  board.addEventListener('pointerup',endGesture);
  board.addEventListener('pointercancel',endGesture);
  board.addEventListener('lostpointercapture',endGesture);
  window.addEventListener('blur',endGesture);
  document.addEventListener('visibilitychange',endGesture);
  board.addEventListener('keydown', event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const directions = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
    if (directions[event.key]) {
      event.preventDefault(); const d=directions[event.key], last=state.path.at(-1); applyMove([last[0]+d[0],last[1]+d[1]]);
    } else if (event.key === 'Backspace' || event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
    else if (event.key.toLowerCase() === 'r') { event.preventDefault(); chooseLevel(selected); }
    else if (event.key.toLowerCase() === 'h') { event.preventDefault(); hint(); }
  });
  function fillDialog() {
    $('dialog-title').textContent = t(modal === 'help' ? 'help' : 'levels');
    const content = $('dialog-content'); content.replaceChildren();
    if (modal === 'help') {
      const list = document.createElement('ol'); list.className='rules';
      for (let i=1;i<=5;i++) { const li=document.createElement('li'); li.textContent=t(`rule${i}`); list.append(li); }
      content.append(list);
    } else {
      const note=document.createElement('p'); note.className='atlas-note'; note.textContent=t(canSave ? 'atlasNote' : 'storage'); content.append(note);
      const grid=document.createElement('div'); grid.className='level-grid';
      E.levels.forEach((level,i)=>{
        const button=document.createElement('button'); button.type='button'; button.className=`level-tile${i===selected?' current':''}`;
        button.setAttribute('aria-label',t('levelLabel',{index:i+1,stars:progress[i]}));
        if (i===selected) button.setAttribute('aria-current','true');
        const number=document.createElement('b'); number.textContent=String(i+1).padStart(2,'0');
        const stars=document.createElement('small'); stars.textContent='★'.repeat(progress[i])+'☆'.repeat(3-progress[i]);
        button.append(number,stars); button.addEventListener('click',()=>{ chooseLevel(i); dialog.close(); board.focus({preventScroll:true}); }); grid.append(button);
      }); content.append(grid);
    }
  }
  function openDialog(type) { gesture=null; modal=type; fillDialog(); dialog.showModal(); }
  $('help').addEventListener('click',()=>openDialog('help'));
  $('levels').addEventListener('click',()=>openDialog('levels'));
  $('close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{ if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
  dialog.addEventListener('close',()=>{modal=null;});
  $('undo').addEventListener('click',undo);
  $('reset').addEventListener('click',()=>chooseLevel(selected));
  $('hint').addEventListener('click',hint);
  $('next').addEventListener('click',()=>{ if(selected<E.levels.length-1) chooseLevel(selected+1); else openDialog('levels'); });
  window.addEventListener('boopland:languagechange',()=>{render(); if(dialog.open) fillDialog();});
  render();
})();
