(() => {
  'use strict';
  const { size, lengths, footprint, placement, randomFleet, createMatch } = GridFleet;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('gridFleet.' + key, values);
  const letters = 'ABCDEFGH';
  const coord = cell => letters[cell % size] + (1 + Math.floor(cell / size));
  const shipName = index => t('ship' + index);
  const cells = [];
  const cards = [];
  const dialog = $('dialog');
  let ships, selected, match, showing, notice, preview, focusCell, timer, dialogMode;

  function hull(index) {
    const width = lengths[index] * 40;
    const mid = width * .48;
    const aft = width - 22;
    const ink = ['#3e5b5e', '#405c64', '#54665b'][index];
    const paint = ['#9db7b0', '#a8bbbf', '#b5bea0'][index];
    const portholes = Array.from({length:lengths[index] + 1}, (_, i) =>
      '<path d="M' + (21+i*15) + ' 12.2v1m0 14v1" />').join('');
    return `<g stroke="${ink}" stroke-linejoin="round" stroke-linecap="round">
      <path d="M4 20Q17 7.5 39 7.8L${width-12} 9.3Q${width-4} 9.7 ${width-5} 18L${width-6} 29.5Q${width-33} 33 36 31.7Q18 31.5 4 20Z" fill="${paint}" stroke-width="1.5"/>
      <path d="M8 20Q24 11.5 37 11l${width-53} 1.3m1 15.4Q39 32 21 25" fill="none" stroke-width=".85"/>
      <path d="M${mid-13} 14l17-1 8 3v10l-24 1-2-4z" fill="#dbe1cd" stroke-width="1.2"/>
      <rect x="${mid-4}" y="13" width="6" height="13" rx="1.3" fill="${ink}"/>
      <rect x="${aft-6}" y="16" width="10" height="8.5" rx="3" fill="#d5dcca"/>
      <path d="M${aft+2} 20h10M${mid-11} 17h4m-4 4h4" fill="none"/>
      <circle cx="24" cy="20" r="4" fill="#dce1cf"/><path d="M24 20H13" stroke-width="1.6"/>
      ${index === 0 ? '<path d="M96 14h15v12H96z" fill="#bdcdc1"/><path d="M101 16v8m4-8v8"/>' : ''}
      <g stroke-width="1.5">${portholes}</g>
    </g>`;
  }

  function shipArt(ship, index, highlight) {
    const x = (ship.bow % size) * 40 + 20;
    const y = Math.floor(ship.bow / size) * 40 + 20;
    const outline = highlight ? `<rect x="1" y="2.5" width="${lengths[index]*40-2}" height="35" rx="9" fill="#f4ddae" fill-opacity=".24" stroke="#9c7154" stroke-width="1.6" stroke-dasharray="5 3"/>` : '';
    return `<g transform="translate(${x} ${y}) rotate(${ship.vertical ? 90 : 0}) translate(-20 -20)">${outline}${hull(index)}</g>`;
  }

  for (let i = 0; i < size; i++) {
    const col = document.createElement('span');
    const row = document.createElement('span');
    col.textContent = letters[i];
    row.textContent = i + 1;
    document.querySelector('.columns').append(col);
    document.querySelector('.rows').append(row);
  }
  for (let cell = 0; cell < size * size; cell++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cell = cell;
    cells.push(button);
    $('cells').append(button);
  }
  lengths.forEach((length, i) => {
    const button = document.createElement('button');
    button.className = 'ship-card';
    button.innerHTML = `<svg viewBox="0 0 ${length*40} 40" aria-hidden="true">${hull(i)}</svg><strong></strong><span class="pips" aria-hidden="true">${'<i></i>'.repeat(length)}</span>`;
    button.onclick = () => { selected = i; notice = null; preview = null; render(); };
    cards.push(button);
    $('roster').append(button);
  });

  function marker(cell, kind) {
    const colors = { miss:'#527e83', hit:'#a04f37', sunk:'#344d52' };
    const x = cell % size * 40;
    const y = Math.floor(cell / size) * 40;
    const backing = kind === 'hit' ? '<circle cx="20" cy="20" r="9.8" fill="#f8e5cc" opacity=".95"/>' : '';
    return `<g transform="translate(${x} ${y})" color="${colors[kind]}">${backing}<use href="#${kind}-icon" x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }

  function marksFrom(history) {
    const marks = new Map();
    for (const report of history) {
      for (const cell of report.sunkCells || [report.cell]) marks.set(cell, report.kind);
    }
    return marks;
  }

  function drawChart() {
    const home = showing === 'home';
    const history = match ? match.history(home ? 1 : 0) : [];
    const marks = marksFrom(history);
    const pieces = home ? ships : history.filter(r => r.kind === 'sunk').map(r => ({
      bow:r.sunkCells[0], vertical:r.sunkCells[1] - r.sunkCells[0] === size, index:lengths.indexOf(r.sunkCells.length)
    }));
    const occupied = new Map();
    let art = '';
    pieces.forEach((ship, i) => {
      const index = ship.index ?? i;
      const body = footprint(index, ship.bow, ship.vertical);
      body.forEach(cell => occupied.set(cell, { index, bow:cell === ship.bow }));
      art += shipArt(ship, index, !match && selected === i);
    });
    if (!match && preview !== null) {
      const vertical = ships[selected].vertical;
      const valid = placement(ships, selected, preview, vertical) === 'ok';
      for (let i=0; i<lengths[selected]; i++) {
        const x = preview % size + (vertical ? 0 : i);
        const y = Math.floor(preview / size) + (vertical ? i : 0);
        if (x >= size || y >= size) break;
        art += `<rect x="${x*40+1.5}" y="${y*40+1.5}" width="37" height="37" rx="2" fill="${valid ? '#60816e' : '#b66b54'}" fill-opacity=".12" stroke="${valid ? '#5b786a' : '#a0513a'}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      }
    }
    marks.forEach((kind, cell) => { art += marker(cell, kind); });
    if (history.length) {
      const last = history[history.length - 1].cell;
      art += `<path transform="translate(${last%size*40} ${Math.floor(last/size)*40})" d="M3 12V3h9m16 34h9v-9" fill="none" stroke="#76543b" stroke-width="2"/>`;
    }
    $('plot').innerHTML = art;
    const readOnly = !!match && (home || match.turn === 1 || match.winner !== null);
    $('cells').classList.toggle('readonly', readOnly);
    $('cells').setAttribute('aria-label', t(showing));
    cells.forEach((button, cell) => {
      const ship = occupied.get(cell);
      const parts = [coord(cell)];
      if (ship) parts.push(shipName(ship.index));
      if (!match && ship?.bow) parts.push(t('bow'));
      if (marks.has(cell)) parts.push(t(marks.get(cell)));
      else if (!ship) parts.push(t(home && !match ? 'water' : 'unknown'));
      button.setAttribute('aria-label',parts.join(' · '));
      button.setAttribute('aria-disabled', String(readOnly));
      button.tabIndex = cell === focusCell ? 0 : -1;
    });
  }

  function showChart(which) {
    showing = which;
    preview = null;
    notice = null;
    render();
  }

  function reset() {
    clearTimeout(timer);
    timer = null;
    ships = [{ bow:17, vertical:false }, { bow:21, vertical:true }, { bow:50, vertical:false }];
    selected = 0;
    match = null;
    showing = 'home';
    notice = null;
    preview = null;
    focusCell = 0;
    render();
  }

  function place(bow, vertical) {
    const result = placement(ships, selected, bow, vertical);
    if (result === 'ok') ships[selected] = { bow, vertical };
    notice = { key:result === 'ok' ? 'placed' : result };
    preview = null;
    render();
  }

  function start() {
    match = createMatch(ships, randomFleet());
    showChart('away');
  }

  function scheduleReply() {
    if (!match || match.winner !== null || match.turn !== 1 || document.hidden || dialog.open || timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      match.reply();
      notice = null;
      if (match.winner === 1) showing = 'home';
      render();
    }, 430);
  }

  function pickCell(cell) {
    focusCell = cell;
    if (!match) return place(cell, ships[selected].vertical);
    if (match.winner !== null || match.turn !== 0 || showing !== 'away') return;
    const report = match.fire(cell);
    notice = report ? null : { key:'repeat' };
    render();
    scheduleReply();
  }

  function reportText(report) {
    return report ? coord(report.cell) + ' · ' + t(report.kind) : '—';
  }

  function render() {
    $('home').textContent = t('home');
    $('away').textContent = t('away');
    $('away').hidden = !match;
    $('home').disabled = !match;
    $('home').setAttribute('aria-pressed', String(showing === 'home'));
    $('away').setAttribute('aria-pressed', String(showing === 'away'));
    $('deploy').hidden = !!match;
    $('combat').hidden = !match;
    let phase, hint;
    if (!match) {
      phase = t('deploy');
      const ship = ships[selected];
      const body = footprint(selected, ship.bow, ship.vertical);
      hint = t(notice?.key || 'place', { ship:shipName(selected), from:coord(ship.bow), to:coord(body[body.length-1]) });
      cards.forEach((card, i) => {
        card.querySelector('strong').textContent = shipName(i);
        card.setAttribute('aria-label', t('shipSize', {ship:shipName(i), n:lengths[i]}));
        card.setAttribute('aria-pressed', String(selected === i));
      });
    } else {
      const mine = match.history(0);
      const theirs = match.history(1);
      const finished = match.winner !== null;
      const round = mine.length + (match.turn === 0 && !finished ? 1 : 0);
      phase = t(finished ? (match.winner === 0 ? 'win' : 'loss') : 'round', { n:round });
      hint = t(finished ? (match.winner === 0 ? 'winHint' : 'lossHint') :
        notice?.key || (match.turn === 1 ? 'wait' : showing === 'home' ? 'inspect' : 'aim'));
      $('outgoing').textContent = reportText(mine.at(-1));
      $('incoming').textContent = reportText(theirs.at(-1));
      const afloat = log => lengths.length - log.filter(report => report.kind === 'sunk').length;
      $('afloat').textContent = t('balance', {home:afloat(theirs), away:afloat(mine)});
      $('again').classList.toggle('primary', finished);
    }
    $('phase').textContent = phase;
    $('hint').textContent = hint;
    $('hint').classList.toggle('error', ['edge','overlap','repeat'].includes(notice?.key));
    drawChart();
    if (dialog.open) localizeDialog();
  }

  function localizeDialog() {
    const restarting = dialogMode === 'restart';
    $('dialog-title').textContent = t(restarting ? 'restartQ' : 'help');
    $('dialog-copy').textContent = t(restarting ? 'restartText' : 'guide');
    $('close').textContent = t(restarting ? 'cancel' : 'close');
    $('confirm').hidden = !restarting;
    $('confirm').textContent = t('again');
  }

  function openDialog(mode) {
    dialogMode = mode;
    clearTimeout(timer);
    timer = null;
    localizeDialog();
    dialog.setAttribute('aria-labelledby','dialog-title');
    dialog.showModal();
  }
  $('help').onclick = () => openDialog('help');
  $('again').onclick = () => match.winner === null ? openDialog('restart') : reset();
  $('confirm').onclick = () => { dialog.close(); reset(); };
  dialog.addEventListener('close', scheduleReply);
  $('start').onclick = start;
  $('home').onclick = () => showChart('home');
  $('away').onclick = () => showChart('away');
  $('rotate').onclick = () => place(ships[selected].bow, !ships[selected].vertical);
  $('random').onclick = () => { ships = randomFleet(); notice = {key:'shuffled'}; preview = null; render(); };
  $('cells').addEventListener('click', event => {
    const button = event.target.closest('[data-cell]');
    if (button) pickCell(Number(button.dataset.cell));
  });
  $('cells').addEventListener('pointerover', event => {
    const button = event.target.closest('[data-cell]');
    if (!match && event.pointerType === 'mouse' && button) {
      preview = Number(button.dataset.cell);
      drawChart();
    }
  });
  $('cells').addEventListener('pointerleave', () => {
    if (preview !== null) { preview = null; drawChart(); }
  });
  $('cells').addEventListener('keydown', event => {
    const cell = Number(event.target.dataset.cell);
    if (!Number.isInteger(cell)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) pickCell(cell);
      return;
    }
    const moves = { ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    const clamp = v => Math.min(size - 1, Math.max(0, v));
    focusCell = clamp(Math.floor(cell / size) + delta[1]) * size + clamp(cell % size + delta[0]);
    preview = match ? null : focusCell;
    drawChart();
    cells[focusCell].focus();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); timer = null; } else scheduleReply();
  });
  window.addEventListener('pagehide', () => { clearTimeout(timer); timer = null; });
  window.addEventListener('pageshow', scheduleReply);
  window.addEventListener('boopland:languagechange', render);
  reset();
})();
