(() => {
  'use strict';

  const { levels, items, newGame, weight, dock, sail, undo, shortest } = FerryPuzzles;
  const t = (key, values) => BooplandI18n.t('last-ferry.' + key, values);
  const byId = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, '0');
  const svgNS = 'http://www.w3.org/2000/svg';
  const dialog = byId('dialog');
  const vessel = byId('vessel');
  const recordKey = 'boopland-last-ferry-best-v1';
  let records = {};
  try {
    const saved = JSON.parse(localStorage.getItem(recordKey));
    if (saved && typeof saved === 'object') records = saved;
  } catch { /* Records are optional for local-file play. */ }

  let index = 0;
  let state = newGame();
  let error = null;
  let moving = 0;
  let timer = 0;
  let panel = '';
  const level = () => levels[index];
  const complete = () => state.east === level().all;
  const best = i => Number.isInteger(records[i]) && records[i] > 0 ? records[i] : 0;
  const text = (id, value) => { byId(id).textContent = value; };
  const joinNames = ids => ids.map(id => t(id)).join(' · ');

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function icon(id, className = 'icon') {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svgNS, 'use');
    use.setAttribute('href', '#glyph-' + id);
    svg.append(use);
    return svg;
  }

  function renderBanks() {
    const focused = document.activeElement?.dataset.bit;
    const lists = [byId('west-list'), byId('east-list')];
    lists.forEach((list, i) => {
      list.replaceChildren();
      list.closest('.bank').classList.toggle('current', !moving && Number(!state.eastbound) === i);
    });
    level().pieces.forEach((id, i) => {
      const bit = 1 << i;
      const onEast = Boolean(state.east & bit);
      const pilot = Boolean(level().pilots & bit);
      const ticket = element('button', 'ticket');
      ticket.type = 'button';
      ticket.dataset.bit = bit;
      ticket.disabled = Boolean(moving) || complete() || !(dock(level(), state) & bit);
      ticket.setAttribute('aria-pressed', Boolean(state.selected & bit));
      ticket.setAttribute('aria-label', t('ticket', { who: t(id), w: items[id].weight, bank: t(onEast ? 'east' : 'west') }) + (pilot ? ' · ' + t('pilotTag') : ''));
      ticket.append(icon(id, 'portrait'), element('span', 'person-name', t(id)),
        element('span', 'person-weight', items[id].weight + ' kg'), icon('check', 'tick'));
      if (pilot) ticket.append(icon('oar', 'row-icon'));
      lists[Number(onEast)].append(ticket);
    });
    for (const list of lists) {
      if (!list.childElementCount) list.append(element('div', 'empty', t('vacant')));
    }
    if (focused) document.querySelector('.ticket[data-bit="' + focused + '"]:not(:disabled)')?.focus({ preventScroll: true });
  }

  function status() {
    if (error) {
      if (error.error === 'alone') {
        return t('alone', { a: t(error.pair[0]), b: t(error.pair[1]), bank: t(error.bank) });
      }
      return t(error.error, error);
    }
    if (moving) return t('rowing');
    if (complete()) return t('arrived');
    if (state.selected) return t('selected', { n: level().pieces.filter((id, i) => state.selected & (1 << i)).length });
    return t(state.eastbound ? 'selectWest' : 'selectEast');
  }

  function drawBoat() {
    vessel.classList.toggle('east', !state.eastbound);
    byId('orientation').classList.toggle('facing-west', moving ? state.eastbound : !state.eastbound);
    byId('west-sign').classList.toggle('active', !moving && state.eastbound);
    byId('east-sign').classList.toggle('active', !moving && !state.eastbound);
    const manifest = moving || state.selected;
    const passengers = level().pieces.filter((id, i) => manifest & (1 << i));
    const group = byId('aboard');
    group.replaceChildren();
    // The open bow is to the left of the canopy in the boat drawing.
    passengers.forEach((id, i) => {
      const use = document.createElementNS(svgNS, 'use');
      use.setAttribute('href', '#glyph-' + id);
      use.setAttribute('x', -85 + i * Math.min(10, 40 / passengers.length));
      use.setAttribute('y', -49 + i % 2 * 2);
      use.setAttribute('width', 33);
      use.setAttribute('height', 29);
      group.append(use);
    });
  }

  function render() {
    text('chart-number', pad(index + 1));
    text('stage-label', t('stage', { n: index + 1 }));
    text('place', t('l' + (index + 1)));
    text('trips', pad(state.history.length));
    text('capacity', level().capacity + ' kg');
    text('max-load', level().capacity);
    text('pilots', level().pilots === level().people ? t('anyone') : joinNames(level().rowers));
    const pairs = byId('pairs');
    pairs.replaceChildren();
    if (!level().pairs.length) pairs.textContent = t('none');
    for (const pair of level().pairs) pairs.append(element('span', '', pair.map(id => t(id)).join(' + ')));
    renderBanks();
    drawBoat();
    const mass = weight(level(), moving || state.selected);
    text('load', mass);
    document.querySelector('.dispatch').classList.toggle('overload', mass > level().capacity);
    document.querySelector('.gauge i').style.width = Math.min(100, 100 * mass / level().capacity) + '%';
    document.querySelector('.feedback').classList.toggle('error', Boolean(error));
    text('message', status());
    text('sail-text', t(complete() && !moving ? 'view' : state.eastbound ? 'out' : 'back'));
    byId('sail').disabled = Boolean(moving);
    byId('sail').classList.toggle('returning', !state.eastbound && !complete());
    byId('undo').disabled = state.history.length === 0;
  }

  function stopMotion() {
    clearTimeout(timer);
    timer = 0;
    moving = 0;
  }

  function remember() {
    const score = state.history.length;
    if (!best(index) || score < best(index)) records[index] = score;
    try { localStorage.setItem(recordKey, JSON.stringify(records)); } catch {}
  }

  function embark() {
    if (moving) return;
    if (complete()) { openPanel('routes'); return; }
    const group = state.selected;
    const result = sail(level(), state);
    if (result.error) {
      error = result;
      render();
      return;
    }
    error = null;
    moving = group;
    render();
    timer = window.setTimeout(() => {
      stopMotion();
      render();
      if (complete()) {
        remember();
        openPanel('win');
      }
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 555);
  }

  function takeBack() {
    if (!undo(state)) return;
    stopMotion();
    error = null;
    render();
  }

  function changeLevel(i) {
    stopMotion();
    index = i;
    state = newGame();
    error = null;
    if (dialog.open) dialog.close();
    render();
  }

  function action(body, label, handler, primary = false) {
    const button = element('button', 'dialog-action ' + (primary ? 'primary' : 'secondary'), t(label));
    button.addEventListener('click', handler);
    body.append(button);
  }

  function panelContent() {
    const body = byId('dialog-body');
    body.replaceChildren();
    if (panel === 'help') {
      text('dialog-title', t('help'));
      for (const key of ['helpGoal', 'helpBoat', 'helpPair']) body.append(element('p', '', t(key)));
      action(body, 'restart', () => changeLevel(index));
    } else if (panel === 'routes') {
      text('dialog-title', t('mapIntro'));
      const list = element('div', 'route-list');
      levels.forEach((_, i) => {
        const row = element('button');
        row.dataset.level = i;
        row.append(element('b', '', pad(i + 1)), document.createTextNode(t('l' + (i + 1))));
        if (i === index) row.setAttribute('aria-current', 'step');
        if (best(i)) {
          row.append(icon('check'));
          row.setAttribute('aria-label', t('l' + (i + 1)) + ' · ' + t('stamp'));
        }
        row.addEventListener('click', () => {
          if (i === index) dialog.close(); else changeLevel(i);
        });
        list.append(row);
      });
      body.append(list);
    } else if (panel === 'win') {
      text('dialog-title', t(levels.every((_, i) => best(i)) ? 'finish' : 'done'));
      body.append(element('p', '', t('arrived')));
      const result = element('dl', 'result');
      for (const [label, n] of [['yourTrips', state.history.length], ['bestRoute', shortest(level()).length]]) {
        const col = element('div');
        col.append(element('dt', '', t(label)), element('dd', '', t('unit', { n })));
        result.append(col);
      }
      body.append(result);
      if (index < levels.length - 1) action(body, 'next', () => changeLevel(index + 1), true);
      else action(body, 'view', () => openPanel('routes'), true);
      action(body, 'practice', () => changeLevel(index));
    }
  }

  function openPanel(name) {
    panel = name;
    panelContent();
    if (!dialog.open) dialog.showModal();
  }

  document.querySelector('.banks').addEventListener('click', event => {
    const ticket = event.target.closest('.ticket');
    if (!ticket || ticket.disabled || moving || complete()) return;
    state.selected ^= Number(ticket.dataset.bit);
    error = null;
    render();
  });
  byId('sail').addEventListener('click', embark);
  byId('undo').addEventListener('click', takeBack);
  byId('atlas').addEventListener('click', () => openPanel('routes'));
  byId('help').addEventListener('click', () => openPanel('help'));
  byId('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (!dialog.open) panel = ''; });
  window.addEventListener('boopland:languagechange', () => {
    render();
    if (dialog.open) panelContent();
  });

  // Keep the ferry and both jetties visible when a wide phone leaves little room for sky.
  const map = document.querySelector('.map');
  function frameMap() {
    const { width, height } = map.getBoundingClientRect();
    if (!width || !height) return;
    const viewHeight = Math.max(100, Math.min(490, 840 * height / width));
    const top = Math.min(490 - viewHeight, Math.max(0, 383 - viewHeight * .73));
    map.setAttribute('viewBox', '0 ' + top.toFixed(1) + ' 840 ' + viewHeight.toFixed(1));
  }
  new ResizeObserver(frameMap).observe(map);
  render();
})();
