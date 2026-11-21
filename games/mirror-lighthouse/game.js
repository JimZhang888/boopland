(() => {
  'use strict';
  const { maps, trace, hint } = MirrorOptics;
  const ns = 'http://www.w3.org/2000/svg';
  const byId = id => document.getElementById(id);
  const tr = (key, values) => BooplandI18n.t('mirror-lighthouse.' + key, values);
  const number = i => String(i + 1).padStart(2, '0');
  const letter = x => String.fromCharCode(65 + x);
  const coord = cell => letter(cell.x) + (cell.y + 1);
  const point = v => 90 + 96 * v;
  const completed = new Set();
  const chartButtons = [];
  const art = { lamp: 'lamp-art', mirror: 'mirror-art', tower: 'tower-art', reef: 'reef-art', split: 'split-art' };
  let current = 0;
  let mask;
  let result;
  let suggestion = null;
  let mirrorButtons = [];

  function svg(tag, attributes = {}) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function symbol(id, attributes) {
    return svg('use', { href: '#' + id, ...attributes });
  }

  function smallArt(kind) {
    const node = svg('svg', { viewBox: '-34 -44 68 72', 'aria-hidden': 'true' });
    node.append(symbol(art[kind]));
    return node;
  }

  function drawMargins() {
    const layer = byId('coordinates');
    for (let i = 0; i < 6; i++) {
      const col = svg('text', { x: point(i), y: 26 });
      const row = svg('text', { x: 26, y: point(i) });
      col.textContent = letter(i);
      row.textContent = i + 1;
      layer.append(col, row);
    }
    let ticks = '';
    for (let i = 0; i <= 48; i++) {
      const p = 42 + i * 12;
      const len = i % 8 === 0 ? 10 : i % 4 === 0 ? 7 : 3;
      ticks += 'M' + p + ' 618v' + len + 'M618 ' + p + 'h' + len;
    }
    layer.append(svg('path', { d: ticks, fill: 'none', stroke: '#829487', 'stroke-width': 1 }));
  }

  // Shallow-water soundings and a tiny schooner are printed on the paper beneath the pieces.
  function drawWater(map) {
    const layer = byId('sea-details');
    layer.replaceChildren();
    const contour = svg('g', {
      fill: 'none', stroke: '#8aa79a', 'stroke-width': 1.4, opacity: .46,
      transform: 'rotate(' + (current % 4 * 90) + ' 330 330)'
    });
    contour.innerHTML = '<path fill="#cbdaca" stroke="none" d="M43 43h194q-8 17-35 17-25-3-46 15-14 12-44 6-22-7-36 9-10 12-33 10Z"/><path d="M43 108q19 3 36-14 12-10 34-6 31 4 49-11 17-12 39-11 30 0 43-23M43 117q24 0 42-17 10-8 28-4 32 5 54-12 16-11 37-10 30 0 49-31M43 131q28-4 46-20t29-6q32 4 55-14 14-10 35-9 34-1 56-39M617 507q-25 1-42 26-10 17-37 18-33 2-46 32-4 14-28 34m153-99q-18 1-34 22-12 17-38 19-28 1-41 28-5 14-24 30m137-87q-17 6-27 19-12 14-35 16-30 2-42 29-5 12-18 23"/><path d="M43 52q21 2 45-6m-43 16 21-4m21 11 17-6m-26 6 5-2" stroke="#839784"/>';
    layer.append(contour);
    const empty = map.cells.filter(cell => cell.kind === '.');
    const sea = empty[(current * 3 + 5) % empty.length];
    const boat = svg('g', { transform: 'translate(' + point(sea.x) + ' ' + point(sea.y) + ') rotate(-9)', opacity: .55, stroke: '#718a7c', 'stroke-width': 1.4, 'stroke-linejoin': 'round' });
    boat.innerHTML = '<path d="m-14 4 29-1-7 6-15 1Z" fill="#c5b7a2"/><path d="M0 2v-22L11 0Zm-3-16L-12 1h9Z" fill="#eee9d0"/><path d="M-20 13q9 2 17 0m10-1 11-2m-25 6 10-1" fill="none"/>';
    layer.append(boat);
  }

  function kindOf(cell) {
    if (cell.index !== undefined) return cell.split ? 'split' : 'mirror';
    if (cell.kind === 'T') return 'tower';
    if (cell.kind === '#') return 'reef';
    return 'lamp';
  }

  function drawIslands() {
    const map = maps[current];
    const shores = byId('shores');
    const controls = byId('mirror-controls');
    shores.replaceChildren();
    controls.replaceChildren();
    mirrorButtons = [];
    for (const cell of map.cells) {
      if (cell.kind === '.' || cell.kind === '#') continue;
      shores.append(symbol('isle', {
        transform: 'translate(' + point(cell.x) + ' ' + (point(cell.y) + 5) + ') scale(' + (cell.id % 2 ? 1 : -1) + ' 1)'
      }));
    }
    for (const cell of map.optics) {
      const button = document.createElement('button');
      button.className = 'turn';
      button.style.left = (cell.x * 100 / map.width) + '%';
      button.style.top = (cell.y * 100 / map.height) + '%';
      button.style.width = (100 / map.width) + '%';
      button.style.height = (100 / map.height) + '%';
      button.dataset.pos = coord(cell);
      button.addEventListener('click', event => {
        if (result.complete) return;
        const keyboard = event.detail === 0;
        mask ^= 1 << cell.index;
        suggestion = null;
        updateRoute();
        if (result.complete && keyboard) byId('action').focus();
      });
      controls.append(button);
      mirrorButtons.push(button);
    }
  }

  function drawRoute() {
    const d = result.segments.map(([x, y, endX, endY]) =>
      'M' + point(x) + ' ' + point(y) + 'L' + point(endX) + ' ' + point(endY)
    ).join(' ');
    const rays = byId('rays');
    rays.replaceChildren();
    for (const [stroke, width] of [['#f3e4b9', 10], ['#a87c37', 4.4], ['#f3d98d', 2]]) {
      rays.append(svg('path', { d, stroke, 'stroke-width': width }));
    }
    const objects = byId('objects');
    objects.replaceChildren();
    for (const cell of maps[current].cells) {
      if (cell.kind === '.') continue;
      const group = svg('g', { transform: 'translate(' + point(cell.x) + ' ' + point(cell.y) + ')' });
      const kind = kindOf(cell);
      if (kind === 'tower' && result.lit.has(cell.id)) {
        group.style.setProperty('--window', '#f6d080');
        group.append(symbol('flare'));
      }
      let transform = '';
      if (cell.index !== undefined && (mask & (1 << cell.index))) transform = 'scale(-1 1)';
      if (kind === 'lamp') transform = 'rotate(' + (cell.direction - 1) * 90 + ')';
      group.append(symbol(art[kind], transform ? { transform } : {}));
      objects.append(group);
    }
  }

  function renderText() {
    const map = maps[current];
    byId('index').textContent = tr('index', { n: number(current) });
    byId('chart-title').textContent = tr('name' + (current + 1));
    byId('brief').textContent = tr('brief' + (current + 1));
    byId('status').textContent = tr(result.complete ? (completed.size === maps.length ? 'all' : 'ready') : 'lit');
    byId('count').textContent = result.lit.size + ' / ' + map.targets.length;
    byId('action-label').textContent = tr(result.complete ? (current === maps.length - 1 && completed.size === maps.length ? 'again' : 'next') : 'hint');
    byId('action-icon').setAttribute('href', result.complete ? '#i-next' : '#i-hint');
    byId('hint-text').hidden = !suggestion;
    byId('hint-text').textContent = suggestion ? tr('point', { pos: coord(suggestion) }) : '';
    chartButtons.forEach((button, i) => {
      const label = tr('choose', { n: number(i), name: tr('name' + (i + 1)) }) + (completed.has(i) ? ' · ' + tr('cleared') : '');
      button.setAttribute('aria-label', label);
      button.title = label;
      button.classList.toggle('done', completed.has(i));
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    map.optics.forEach(cell => {
      const button = mirrorButtons[cell.index];
      button.disabled = result.complete;
      const label = tr('piece', { pos: coord(cell), kind: tr(kindOf(cell)), angle: tr(mask & (1 << cell.index) ? 'fall' : 'rise') });
      button.title = label;
      button.setAttribute('aria-label', label);
      button.classList.toggle('hinted', suggestion === cell);
    });
  }

  function legend() {
    const map = maps[current];
    const list = byId('legend');
    list.replaceChildren();
    const kinds = ['lamp', 'mirror', 'tower'];
    if (map.cells.some(cell => cell.kind === '#')) kinds.push('reef');
    if (map.optics.some(cell => cell.split)) kinds.push('split');
    for (const kind of kinds) {
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.append(smallArt(kind), tr(kind));
      list.append(item);
    }
    const guide = byId('guide-list');
    guide.replaceChildren();
    for (const kind of ['lamp', 'mirror', 'reef', 'split', 'tower']) {
      const term = document.createElement('dt');
      term.append(smallArt(kind), tr(kind));
      const detail = document.createElement('dd');
      detail.textContent = tr(kind + 'Rule');
      guide.append(term, detail);
    }
  }

  function updateRoute() {
    result = trace(maps[current], mask);
    if (result.complete) completed.add(current);
    drawRoute();
    renderText();
  }

  function openChart(i) {
    current = i;
    mask = maps[i].start;
    suggestion = null;
    drawWater(maps[i]);
    drawIslands();
    legend();
    updateRoute();
  }

  maps.forEach((_, i) => {
    const button = document.createElement('button');
    button.className = 'chart-choice';
    const label = document.createElement('span');
    label.textContent = number(i);
    button.append(label);
    button.addEventListener('click', () => { if (current !== i) openChart(i); });
    byId('charts').append(button);
    chartButtons.push(button);
  });
  byId('restart').addEventListener('click', () => openChart(current));
  byId('action').addEventListener('click', () => {
    if (result.complete) {
      const firstOpen = maps.findIndex((_, i) => !completed.has(i));
      openChart(current < maps.length - 1 ? current + 1 : Math.max(0, firstOpen));
    } else {
      suggestion = hint(maps[current], mask);
      renderText();
    }
  });
  byId('help').addEventListener('click', () => byId('guide').showModal());
  byId('close').addEventListener('click', () => byId('guide').close());
  byId('guide').addEventListener('click', event => {
    if (event.target !== byId('guide')) return;
    const box = byId('guide').getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) byId('guide').close();
  });
  window.addEventListener('boopland:languagechange', () => { legend(); renderText(); });
  drawMargins();
  openChart(0);
})();
