(() => {
  'use strict';
  const E = window.NineGrid, art = window.NineGridArt, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('nineGrid.' + key, values);
  const monsterNames = ['slime', 'wolf', 'spirit', 'guardian'];
  let state = E.create(), lastMessage = '', best = 0, recorded = false;
  try { best = Math.max(0, Number(localStorage.getItem('boopland-nine-grid-best')) || 0); } catch { /* Play without persistence. */ }
  function message(item) {
    if (!item) return '';
    const values = { ...item.values };
    if ('kind' in values) values.monster = t(monsterNames[values.kind]);
    if ('choice' in values) values.item = t(values.choice);
    return t(item.key, values);
  }
  function action(label, command, className = 'primary', title = '') {
    const button = document.createElement('button'); button.className = className; button.textContent = label;
    if (title) button.title = title;
    button.addEventListener('click', () => execute(command)); $('actions').append(button);
  }
  function execute(command) {
    let changed = false;
    if (command === 'start') changed = E.start(state);
    if (command === 'attack') changed = E.fight(state);
    if (command === 'guard') changed = E.fight(state, true);
    if (command === 'retreat') changed = E.retreat(state);
    if (command === 'descend') changed = E.descend(state);
    if (command === 'stay') changed = E.stay(state);
    if (command === 'potion') changed = E.potion(state);
    if (['blade', 'shield', 'flask'].includes(command)) changed = E.loot(state, command);
    if (command === 'restart') { state = E.create(); recorded = false; lastMessage = ''; E.start(state); changed = true; }
    if (changed) render();
  }
  function move(index) { const old = state.message; const moved = E.move(state, index); if (moved || state.message !== old) render(); }
  function renderBoard() {
    // Keep buttons stable so keyboard focus survives each turn.
    if (!$('board').children.length) for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button'); cell.type = 'button'; cell.dataset.index = String(i); cell.addEventListener('click', () => move(i)); $('board').append(cell);
    }
    state.tiles.forEach((tile, i) => {
      const current = i === state.pos, reachable = E.adjacent(i, state.pos) && state.phase === 'explore';
      const fighting = current && state.phase === 'combat';
      const locked = tile.type === 'exit' && !state.rune;
      const name = tile.enemy && !tile.cleared ? monsterNames[tile.enemy.kind] : tile.type;
      let drawing = tile.cleared ? 'path' : name;
      let label = t(tile.cleared ? 'cleared' : name), detail = tile.type === 'chest' ? t('chooseOne') : tile.type === 'supply' ? '+9 ♥ · +5 ◇' : '';
      if (tile.enemy && !tile.cleared) detail = `${tile.enemy.hp} ♥ · ${tile.enemy.atk} ⚔`;
      if (tile.type === 'exit' && !tile.enemy) { drawing = 'exit'; detail = t(locked ? 'needRune' : state.floor === E.FLOORS ? 'finalGate' : 'nextFloor'); }
      if (tile.cleared) detail = t('empty');
      if (current && !fighting) { drawing = 'hero'; label = t('you'); detail = t('here'); }
      const cell = $('board').children[i];
      cell.className = ['cell', tile.type, tile.cleared ? 'cleared' : '', current ? 'current' : '', reachable ? 'reachable' : '', locked ? 'locked' : ''].filter(Boolean).join(' ');
      cell.disabled = !reachable;
      cell.setAttribute('aria-label', t('cellLabel', { row: Math.floor(i / 3) + 1, col: i % 3 + 1, name: label, detail }));
      if (current) cell.setAttribute('aria-current', 'location'); else cell.removeAttribute('aria-current');
      cell.innerHTML = `<span class="cell-coordinate" aria-hidden="true">${String.fromCharCode(65 + i % 3)}${Math.floor(i / 3) + 1}</span><span class="cell-marker" aria-hidden="true">${current ? fighting ? '⚔' : '●' : locked ? '⌑' : reachable ? '↗' : tile.cleared ? '✓' : ''}</span><span class="cell-art">${art(drawing)}</span><span class="cell-label"></span><span class="cell-detail"></span>`;
      cell.querySelector('.cell-label').textContent = label; cell.querySelector('.cell-detail').textContent = detail;
    });
  }
  function renderEvent() {
    const phase = state.phase, event = $('event'); event.className = 'event ' + phase; $('actions').replaceChildren(); $('enemy-stats').hidden = true;
    let title = 'exploreTitle', copy = message(state.message), icon = 'leaf', kicker = 'yourTurn';
    if (phase === 'ready') { title = 'readyTitle'; copy = t('readyCopy'); icon = 'camp'; kicker = 'departure'; action(t('start') + '  ↗', 'start'); }
    if (phase === 'explore') {
      if (state.message?.key === 'supplyMessage') { title = 'supplyTitle'; icon = 'supply'; }
      if (state.message?.key === 'defeated') { title = 'defeatTitle'; icon = 'rune'; }
      if (state.message?.key === 'lootMessage') { title = 'lootTitle'; icon = 'chest'; }
      if (state.message?.key === 'locked') { title = 'lockedTitle'; icon = 'exit'; }
      if (!state.food) copy += ' ' + t('starving');
    }
    if (phase === 'combat') {
      title = monsterNames[state.enemy.kind]; icon = title; kicker = 'combat';
      $('enemy-stats').hidden = false;
      const health = document.createElement('span'); health.textContent = t('enemyHp', { hp: state.enemy.hp, max: state.enemy.maxHp });
      const intent = document.createElement('span'); intent.textContent = t(state.enemy.round % 3 === 2 ? 'heavyIntent' : 'intent', { hit: E.estimate(state) });
      $('enemy-stats').replaceChildren(health, intent);
      action(t('attackAction', { hit: state.atk }), 'attack');
      action(t('guardAction'), 'guard', 'secondary', t('guardTip', { hit: Math.max(1, Math.floor(state.atk / 2)), damage: E.estimate(state, true) }));
      action(t('retreat'), 'retreat', 'retreat', t('retreatTip', { hit: Math.max(1, state.enemy.atk - state.armor) }));
    }
    if (phase === 'treasure') {
      title = 'treasureTitle'; icon = 'chest'; kicker = 'found'; copy = t('chestMessage');
      for (const choice of ['blade', 'shield', 'flask']) { action(t(choice), choice, 'choice'); const hint = document.createElement('small'); hint.textContent = t(choice + 'Effect'); $('actions').lastChild.append(hint); }
    }
    if (phase === 'stairs') { title = 'stairsTitle'; icon = 'exit'; kicker = 'clearedFloor'; copy = t('stairsMessage'); action(t('continue'), 'descend'); action(t('stay'), 'stay', 'secondary'); }
    if (phase === 'won' || phase === 'lost') {
      title = phase === 'won' ? 'wonTitle' : 'lostTitle'; icon = phase === 'won' ? 'rune' : 'camp'; kicker = 'journeyEnd';
      copy = t(phase === 'won' ? 'wonCopy' : 'lostCopy', { score: E.score(state), floor: state.floor, moves: state.moves, gold: state.gold });
      action(t('again') + '  ↗', 'restart');
    }
    $('event-title').textContent = t(title); $('event-copy').textContent = copy; $('event-icon').innerHTML = art(icon); $('event-kicker').textContent = t(kicker);
  }
  function render() {
    const oldAction = document.activeElement?.parentElement === $('actions') ? [...$('actions').children].indexOf(document.activeElement) : -1;
    if (['won', 'lost'].includes(state.phase) && !recorded) {
      recorded = true; best = Math.max(best, E.score(state));
      try { localStorage.setItem('boopland-nine-grid-best', String(best)); } catch { /* Optional record. */ }
    }
    document.title = t('pageTitle');
    $('hp').textContent = `${state.hp}/${state.maxHp}`; $('food').textContent = `${state.food}/${state.maxFood}`;
    $('hp-bar').style.width = `${state.hp / state.maxHp * 100}%`; $('food-bar').style.width = `${state.food / state.maxFood * 100}%`;
    $('hp').parentElement.classList.toggle('low', state.hp <= 10); $('food').parentElement.classList.toggle('low', state.food <= 3);
    [['attack-stat', 'sword', state.atk, 'attack'], ['armor-stat', 'shield', state.armor, 'armor'], ['gold-stat', 'coin', state.gold, 'gold']].forEach(([id, icon, value, key]) => {
      $(id).innerHTML = art(icon, 'mini-icon') + `<span>${value}</span>`; $(id).title = t(key); $(id).setAttribute('aria-label', `${t(key)} ${value}`);
    });
    $('potion').innerHTML = art('potion', 'mini-icon') + `<span>${t('drink')} · ${state.potions}</span>`;
    $('potion').disabled = !['explore', 'combat', 'treasure', 'stairs'].includes(state.phase) || !state.potions || state.hp === state.maxHp;
    $('potion').title = t('potionTip'); $('potion').setAttribute('aria-label', t('potionLabel', { count: state.potions }));
    $('floor-name').textContent = t('floorLabel', { floor: state.floor, name: t('floor' + state.floor) });
    $('floor-short').textContent = `${state.floor}/5`;
    $('floor-dots').innerHTML = Array.from({ length: E.FLOORS }, (_, i) => `<span class="floor-dot ${i < state.floor ? 'active' : ''}"></span>`).join('');
    $('turns').textContent = t('steps', { count: state.moves }); $('best').textContent = best || '—';
    $('map-hint').textContent = t(state.phase === 'ready' ? 'readyHint' : state.phase === 'explore' ? state.rune ? 'runeHint' : 'moveHint' : ['won', 'lost'].includes(state.phase) ? 'endHint' : 'eventHint');
    $('log').replaceChildren(...state.log.slice(0, 3).map(item => { const li = document.createElement('li'); li.textContent = message(item); li.title = li.textContent; return li; }));
    renderBoard(); renderEvent();
    if (oldAction >= 0) { const next = $('actions').children[Math.min(oldAction, $('actions').children.length - 1)]; if (next) next.focus({ preventScroll: true }); else $('board').querySelector('button:not(:disabled)')?.focus({ preventScroll: true }); }
    const announcement = message(state.message);
    if (announcement !== lastMessage) { $('announcement').textContent = announcement; lastMessage = announcement; }
    requestAnimationFrame(sizeBoard);
  }
  function sizeBoard() {
    const area = $('map-area'), style = getComputedStyle(area);
    const size = Math.floor(Math.min(area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), area.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom), 550));
    $('board').style.setProperty('--board-size', Math.max(120, size) + 'px');
  }
  $('portrait').innerHTML = art('hero');
  $('potion').addEventListener('click', () => execute('potion'));
  $('help').addEventListener('click', () => $('help-dialog').showModal());
  $('restart').addEventListener('click', () => { if (['ready', 'won', 'lost'].includes(state.phase)) execute('restart'); else $('restart-dialog').showModal(); });
  $('cancel-restart').addEventListener('click', () => $('restart-dialog').close());
  $('confirm-restart').addEventListener('click', () => { $('restart-dialog').close(); execute('restart'); });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || document.querySelector('dialog[open]')) return;
    const key = event.key.toLowerCase();
    const directions = { arrowup: -3, w: -3, arrowdown: 3, s: 3, arrowleft: -1, a: -1, arrowright: 1, d: 1 };
    if (Object.hasOwn(directions, key)) { event.preventDefault(); move(state.pos + directions[key]); }
    if (key === 'h') { event.preventDefault(); execute('potion'); }
    if (state.phase === 'combat' && ['1', '2', '3'].includes(key)) { event.preventDefault(); execute({ 1: 'attack', 2: 'guard', 3: 'retreat' }[key]); }
  });
  window.addEventListener('boopland:languagechange', render);
  new ResizeObserver(sizeBoard).observe($('map-area'));
  render();
})();
