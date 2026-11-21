/* Layout is expressed in paper coordinates. On tall screens we transpose the
   sheet, keeping roofs, the cat and all fold labels upright. */
function createFoldCatMap(onFold) {
  'use strict';
  const byId = id => document.getElementById(id);
  const svg = byId('map'), tiles = byId('squares'), seams = byId('seams'), actor = byId('actor');
  const cell = 74, margin = 28;
  const colors = ['#97583e', '#497377', '#756284'];
  const transpose = { N: 'W', E: 'S', S: 'E', W: 'N' };
  let page, number, turned, snapshot, tileNodes = [], animation = 0;

  function element(tag, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  const rect = (x, y, width, height, fill) => element('rect', { x, y, width, height, fill });
  const line = (d, stroke, width, attrs = {}) => element('path', {
    d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs
  });
  const stamp = (id, x, y, scale) => element('use', {
    href: '#' + id, transform: 'translate(' + x + ' ' + y + ') scale(' + scale + ')'
  });
  function coords(x, y) { return turned ? [y, x] : [x, y]; }
  function vertical(fold) { return turned ? fold.axis === 'y' : fold.axis === 'x'; }
  function move(node, x, y, sx = 1, sy = 1) {
    node.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + sx + ',' + sy + ')';
  }

  function roofs(tile, ports) {
    const arms = [...ports].map(port => turned ? transpose[port] : port);
    for (const dir of arms) {
      // The little plaster facades sit below the tile roofs in the drawing.
      const horizontal = dir === 'E' || dir === 'W';
      const x = horizontal ? (dir === 'E' ? 36 : 0) : 41;
      const y = horizontal ? 43 : (dir === 'S' ? 36 : 0);
      const wall = element('g');
      wall.append(rect(x + 1, y + 2, horizontal ? 37 : 15, horizontal ? 17 : 37, '#c5c1a6'),
        rect(x, y, horizontal ? 38 : 15, horizontal ? 17 : 38, '#e9d7b6'));
      if (horizontal) {
        wall.append(line('M' + x + ' 59h37', '#b6a386', .85));
        for (const wx of [x + 7, x + 22]) {
          wall.append(rect(wx, 50, 6, 6, '#8b7961'), rect(wx + .9, 51, 4.1, 3.8, '#d2c597'),
            line('M' + (wx + 3) + ' 50v5', '#93836a', .7));
        }
      } else {
        wall.append(line('M55 ' + y + 'v37', '#b6a386', .85));
        for (const wy of [y + 9, y + 24]) {
          wall.append(rect(49, wy, 3.8, 6.5, '#9e8d72'), rect(50, wy + 1, 1.8, 3.8, '#d6c79e'));
        }
      }
      tile.append(wall);
    }
    // Draw every roof plane before its ridge, so a corner reads as one path.
    for (const dir of arms) {
      const turn = { E: 0, S: 90, W: 180, N: 270 }[dir];
      const g = element('g', { transform: 'translate(37 37) rotate(' + turn + ')' });
      const light = dir === 'E' || dir === 'S';
      g.append(element('path', { d:'M0 -11H37V11H0Z', fill:'#6e7975' }),
        element('path', { d:'M0 -10H37V0H0Z', fill:light ? '#b1c0b7' : '#8ba39c' }),
        element('path', { d:'M0 0H37V10H0Z', fill:light ? '#8ba39c' : '#b1c0b7' }));
      for (const x of [6, 14, 22, 30]) {
        g.append(line('M' + x + ' -8l-2 7m2 3 2 7', '#586f68', .85, { opacity: .62 }));
      }
      tile.append(g);
    }
    for (const dir of arms) {
      const tip = { N:'37 0', E:'74 37', S:'37 74', W:'0 37' }[dir];
      tile.append(line('M37 37L' + tip, '#646657', 4.2),
        line('M37 36.6L' + tip, '#d6b68a', 2.4));
    }
  }

  function makeTile(x, y) {
    const key = String(x) + y, group = element('g', { class: 'tile' });
    const ports = page.paths.get(key);
    const water = !ports && page.folds.some(f => FoldCatPuzzle.onStrip(f, key));
    const seed = (x * 31 + y * 17 + number * 7) % 19;
    group.append(rect(0, 0, 74.15, 74.15, water ? '#c7dcd6' : '#f4ecd6'));
    if (water) {
      group.append(stamp('water', 37, 25 + seed, .85), stamp('water', 14, 63, .45));
      if ((number === 0 && x === 2 && y === 0) || (number > 0 && seed === 7)) {
        group.append(stamp('paperboat', 38, 29, .78));
      }
      if (seed % 3 === 0) group.append(stamp('plant', 64, 61, .53));
    } else if (ports) {
      group.append(stamp(seed % 2 ? 'plant' : 'pebbles', 12, 62, .52));
      roofs(group, ports);
      if (key === page.goal) {
        group.append(element('ellipse', { cx: 37, cy: 30, rx: 26, ry: 25, fill: '#f5d99a', opacity: .78 }),
          stamp('cottage', 37, 22, .88));
      }
    } else {
      const decor = [
        [['tree',24,35,.83],['tree',46,45,.63]],
        [['garden',39,45,.94],['plant',20,28,.62]],
        [['tree',40,37,.84],['plant',14,58,.49]],
        [['plant',25,39,.78],['pebbles',49,52,.75]],
        [['willow',34,36,.91],['pots',55,56,.58]]
      ][seed % 5];
      if (number === 0 && x === 3 && y === 0) group.append(stamp('willow',38,36,.99));
      else if (number === 0 && x === 0 && y === 1) group.append(stamp('pots',39,40,1.03));
      else for (const args of decor) group.append(stamp(...args));
    }
    group.append(rect(0, 0, 74, 74, 'url(#grain)'));
    const [u, v] = coords(x, y);
    return { group, u, v };
  }

  function build() {
    const bounds = svg.getBoundingClientRect();
    turned = page.width > page.height && bounds.height > bounds.width * 1.12;
    const [w, h] = coords(page.width, page.height);
    svg.setAttribute('viewBox', '0 0 ' + (w * cell + margin * 2) + ' ' + (h * cell + margin * 2));
    tileNodes = [];
    for (let y = 0; y < page.height; y++) {
      for (let x = 0; x < page.width; x++) tileNodes.push(makeTile(x, y));
    }
    tiles.replaceChildren(...tileNodes.map(t => t.group));
    svg.classList.add('placing');
    render(snapshot, true);
    svg.getBoundingClientRect();
    svg.classList.remove('placing');
  }

  function drawCrease(fold, id, amount, x, y, width, height, label, enabled, hinted) {
    const vert = vertical(fold), color = colors[id], length = vert ? height : width;
    const root = element('g', { transform: 'translate(' + x + ' ' + y + ')', class: 'crease', 'data-crease': id });
    const flat = amount < .995, stripWidth = cell * (1 - amount);
    const along = n => vert ? 'M' + n + ' 0v' + length : 'M0 ' + n + 'h' + length;
    if (flat) {
      root.append(vert ? rect(0,0,stripWidth,length,'url(#creaseShadow)') : rect(0,0,length,stripWidth,'url(#creaseShadowY)'));
      if (amount > 0) {
        const shade = vert ? rect(0,0,stripWidth / 2,length,color) : rect(0,0,length,stripWidth / 2,color);
        shade.setAttribute('opacity', .26 * Math.sin(amount * Math.PI));
        root.append(shade);
      }
    } else {
      root.append(line(along(1.5), '#62583e', 5, { opacity: .19 }), line(along(-1.2), '#fff6ce', 1.6));
    }
    for (const edge of flat ? [0, stripWidth] : [0]) {
      root.append(line(along(edge), color, hinted ? 2.4 : 1.3, { 'stroke-dasharray': flat ? '5 4' : '2 4', opacity: .85 }));
    }
    const offset = stripWidth / 2, dx = vert ? offset : -12, dy = vert ? -12 : offset;
    const badge = element('g', { transform: 'translate(' + dx + ' ' + dy + ')' });
    badge.append(element('circle', { r: 10, fill: flat ? '#fbf5e5' : color, stroke: color, 'stroke-width': 1.35 }));
    const text = element('text', { class: 'crease-letter', y: 3.7, fill: flat ? color : '#fff7e4' });
    text.textContent = String.fromCharCode(65 + id);
    badge.append(text);
    root.append(badge);
    if (enabled) {
      const size = flat ? cell : 20, from = flat ? 0 : -10;
      const hit = vert ? rect(from,0,size,length,'transparent') : rect(0,from,length,size,'transparent');
      const pad = element('circle', { cx: dx, cy: dy, r: 15, fill: 'transparent' });
      root.append(hit, pad);
      root.classList.add('available');
      root.addEventListener('click', () => onFold(id));
    }
    const title = element('title');
    title.textContent = label;
    root.prepend(title);
    return root;
  }

  function drawFrame(state, amounts) {
    const { pos, heading, phase, hint, controls } = state;
    svg.dataset.phase = phase;
    const [fullW, fullH] = coords(page.width, page.height);
    const cols = Array(fullW).fill(0), rows = Array(fullH).fill(0);
    page.folds.forEach((f, i) => {
      (vertical(f) ? cols : rows)[f.at] = amounts[i];
    });
    const sum = a => a.reduce((total, n) => total + n, 0);
    const left = margin + sum(cols) * cell / 2, top = margin + sum(rows) * cell / 2;
    const width = (fullW - sum(cols)) * cell, height = (fullH - sum(rows)) * cell;
    const posX = u => left + cell * (u - sum(cols.slice(0, u)));
    const posY = v => top + cell * (v - sum(rows.slice(0, v)));
    byId('sheet').replaceChildren(rect(left + 2, top + 4, width + 1, height + 1, '#a8ad93'),
      rect(left - 1, top - 1, width + 2, height + 2, '#918e75'));
    for (const { group, u, v } of tileNodes) {
      move(group, posX(u), posY(v), 1 - cols[u], 1 - rows[v]);
    }
    seams.replaceChildren(...page.folds.map((f, i) => drawCrease(f, i, amounts[i],
      vertical(f) ? posX(f.at) : left, vertical(f) ? top : posY(f.at), width, height,
      controls[i].label, controls[i].enabled, hint === i)));
    const [u, v] = coords(Number(pos[0]), Number(pos[1]));
    move(actor, posX(u) + cell / 2, posY(v) + cell / 2 - 9);
    const facing = turned ? transpose[heading] : heading;
    if (facing === 'E' || facing === 'W' || !heading) {
      byId('cat-facing').setAttribute('transform', facing === 'W' ? 'scale(-1 1)' : 'scale(1)');
    }
  }
  function render(state, snap = false) {
    const previous = snapshot;
    snapshot = state;
    const amounts = mask => page.folds.map((_, i) => Number(Boolean(mask & (1 << i))));
    if (!snap && state.phase === 'folding' && previous.mask === state.mask && animation) return;
    cancelAnimationFrame(animation);
    animation = 0;
    const target = amounts(state.mask);
    if (snap || state.phase !== 'folding' || previous.mask === state.mask || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(state, target);
      return;
    }
    const from = amounts(previous.mask), start = performance.now();
    function frame(now) {
      const t = Math.min(1, Math.max(0, (now - start) / 340));
      const mix = t * t * (3 - 2 * t);
      drawFrame(snapshot, target.map((end, i) => from[i] + (end - from[i]) * mix));
      animation = t < 1 ? requestAnimationFrame(frame) : 0;
    }
    frame(start);
  }
  new ResizeObserver(() => {
    const bounds = svg.getBoundingClientRect();
    if (page && (page.width > page.height && bounds.height > bounds.width * 1.12) !== turned) build();
  }).observe(svg);
  return {
    start(nextPage, n, state) { page = nextPage; number = n; snapshot = state; build(); },
    render
  };
}
