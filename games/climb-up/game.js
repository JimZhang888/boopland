(() => {
  'use strict';
  const E = window.ClimbUp, I = window.BooplandI18n, $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`climbUp.${key}`, values);
  const suits = ['♣', '♦', '♠', '♥'], suitKeys = ['clubs', 'diamonds', 'spades', 'hearts'];
  const names = ['you', 'friend1', 'friend2'];
  const avatar = [
    '<path d="M17 29V7M17 22l-6-6m6 1 6-7M17 12l-5-4M15 18h4m-4 8h4"/><path d="M11 16Q2 15 4 8q8 0 7 8Zm12-6q-1-7 6-7 1 7-6 7Z"/>',
    '<path d="M16 4Q4 11 4 22q1 9 13 8 12 0 12-9Q28 10 16 4Z"/><path d="M5 24q12-5 23 0M13 7l-2 8m8-8 3 9"/><path d="M11 20h1m8 0h1m-6 3q2 2 4 0"/>'
  ];
  let state, selected = new Set(), timer = null, hintIndex = 0, dialogKind = '', statusOverride = null;
  let record = { wins: 0, games: 0 };
  try {
    const stored = JSON.parse(localStorage.getItem('boopland-climb-up-record'));
    if (stored && Number.isSafeInteger(stored.games) && stored.games >= 0 && Number.isSafeInteger(stored.wins) && stored.wins >= 0 && stored.wins <= stored.games) record = stored;
  } catch { /* The game is fully playable without storage. */ }
  const rank = c => c.rank <= 10 ? String(c.rank) : ({11:'J',12:'Q',13:'K',14:'A',15:'2',16:'JOKER',17:'JOKER'})[c.rank];
  const label = c => c.rank >= 16 ? t(c.rank === 16 ? 'smallJoker' : 'bigJoker') : t('card', { rank: rank(c), suit: t(suitKeys[c.suit]) });
  const isTurn = () => !state.over && state.turn === 0 && !dialogKind && !document.hidden;
  function cardElement(card, interactive) {
    const el = document.createElement(interactive ? 'button' : 'span');
    el.className = `card${card.suit === 1 || card.suit === 3 || card.rank === 17 ? ' red' : ''}${card.rank >= 16 ? ' joker' : ''}`;
    el.dataset.card = card.id;
    if (interactive) { el.type = 'button'; el.setAttribute('aria-pressed', 'false'); }
    const value = document.createElement('span'); value.className = 'card-rank'; value.textContent = rank(card);
    const suit = document.createElement('span'); suit.className = 'card-suit'; suit.textContent = card.rank >= 16 ? (card.rank === 16 ? '☆' : '★') : suits[card.suit];
    const corner = document.createElement('span'); corner.className = 'card-corner'; corner.textContent = card.rank >= 16 ? '' : rank(card) + suits[card.suit];
    for (const child of [value, suit, corner]) child.setAttribute('aria-hidden', 'true');
    el.append(value, suit, corner); el.setAttribute('aria-label', label(card));
    if (!interactive) el.setAttribute('role', 'img');
    return el;
  }
  function renderHand() {
    const old = new Map([...$('hand').children].map(node => [node.dataset.card, node]));
    for (const [id, node] of old) if (!state.hands[0].some(c => c.id === id)) node.remove();
    for (const card of state.hands[0]) {
      let node = old.get(card.id);
      if (!node) { node = cardElement(card, true); $('hand').append(node); }
      node.disabled = state.over || state.turn !== 0;
      node.setAttribute('aria-pressed', String(selected.has(card.id)));
      node.setAttribute('aria-label', label(card));
    }
  }
  function fitTableCards() {
    const count = $('table-cards').children.length;
    if (!count) return;
    const width = $('table-cards').clientWidth, cardWidth = $('table-cards').firstElementChild.offsetWidth;
    const overlap = count > 1 ? Math.min(0, (width - 8 - cardWidth * count) / (count - 1)) : 0;
    $('table-cards').style.setProperty('--overlap', `${overlap}px`);
  }
  function render() {
    $('record').textContent = t('record', record);
    for (let i = 1; i <= 2; i++) {
      const seat = $(`seat-${i}`), place = state.finished.indexOf(i);
      seat.classList.toggle('active', !state.over && state.turn === i);
      seat.classList.toggle('finished', place !== -1);
      if (!seat.children.length) seat.innerHTML = `<span class="avatar" aria-hidden="true"><svg viewBox="0 0 34 34">${avatar[i - 1]}</svg></span><strong class="seat-name"></strong><span class="seat-count"></span>`;
      seat.children[1].textContent = t(names[i]);
      seat.children[2].textContent = place !== -1 ? t('place', {rank: place + 1}) : t('cardsLeft', {count: state.hands[i].length});
    }
    renderHand();
    $('your-label').textContent = state.finished.includes(0) ? `${t('you')} · ${t('place', {rank:state.finished.indexOf(0)+1})}` : t('yourCards', {count:state.hands[0].length});
    const shape = E.classify(state.hands[0].filter(c => selected.has(c.id)));
    $('selection-label').textContent = selected.size ? (shape ? `${t(shape.type)} · ${selected.size}` : t('selected', {count:selected.size})) : t('pick');
    $('clear').disabled = !selected.size;
    const target = state.target;
    $('table-caption').textContent = target ? t('playedBy', {name:t(names[state.owner]),type:t(target.type)}) : t('leadName', {name:t(names[state.turn])});
    const cardIds = target?.cards.map(c => c.id).join(',') || '';
    if ($('table-cards').dataset.cards !== cardIds) {
      $('table-cards').replaceChildren(...(target?.cards || []).map(c => cardElement(c, false)));
      $('table-cards').dataset.cards = cardIds;
    } else if (target) [...$('table-cards').children].forEach((el, i) => el.setAttribute('aria-label', label(target.cards[i])));
    $('table-note').textContent = state.opening ? t('firstLead') : state.lastAction?.pass && target ? t('passed', {name:t(names[state.lastAction.player])}) : !target ? (state.turn === 0 ? t('fresh') : t('waiting', {name:t(names[state.turn])})) : '';
    let status = state.over ? t('over') : !state.hands[0].length ? t('watch') : state.turn === 0 ? t(state.opening ? 'firstLead' : target ? 'yourTurn' : 'freeLead') : t('waiting', {name:t(names[state.turn])});
    if (statusOverride) status = t(statusOverride.key, statusOverride.values);
    $('status').textContent = status;
    $('status').parentElement.classList.toggle('error', Boolean(statusOverride?.error));
    $('play').disabled = !isTurn() || !selected.size;
    $('pass').disabled = !isTurn() || !target;
    $('hint').disabled = !isTurn();
    $('pause').disabled = state.over;
    fitTableCards();
  }
  function schedule() {
    clearTimeout(timer); timer = null;
    if (state.over || dialogKind || document.hidden || state.turn === 0) return;
    timer = setTimeout(() => {
      timer = null;
      if (state.over || dialogKind || document.hidden || state.turn === 0) return;
      const move = E.suggestions(state)[0];
      perform(move ? move.cards.map(c => c.id) : []);
    }, 1050);
  }
  function perform(ids) {
    const result = E.act(state, ids);
    if (!result.ok) { statusOverride = {key:result.error,error:true}; render(); return; }
    selected.clear(); hintIndex = 0; statusOverride = null;
    if (state.over) {
      record.games++; if (state.finished[0] === 0) record.wins++;
      try { localStorage.setItem('boopland-climb-up-record', JSON.stringify(record)); } catch { /* optional */ }
    }
    render();
    if (state.over) openDialog('results'); else schedule();
  }
  function play() {
    if (!isTurn()) return;
    if (!selected.size) { statusOverride = {key:'empty',error:true}; render(); return; }
    perform([...selected]);
  }
  function hint() {
    if (!isTurn()) return;
    const options = E.suggestions(state);
    if (!options.length) { selected.clear(); statusOverride = {key:'noMove'}; }
    else { selected = new Set(options[hintIndex++ % options.length].cards.map(c => c.id)); statusOverride = {key:'hinted'}; }
    render();
  }
  function clearSelection() { selected.clear(); hintIndex = 0; statusOverride = null; render(); }
  function newGame() {
    clearTimeout(timer); dialogKind = ''; if ($('dialog').open) $('dialog').close();
    selected.clear(); hintIndex = 0; statusOverride = null; state = E.create();
    $('hand').replaceChildren(); render(); schedule();
  }
  function paragraph(key) { const p = document.createElement('p'); p.textContent = t(key); return p; }
  function action(key, handler) { const b = document.createElement('button'); b.textContent = t(key); b.addEventListener('click', handler); return b; }
  function renderDialog() {
    const content = $('dialog-content'), actions = $('dialog-actions'); content.replaceChildren(); actions.replaceChildren();
    if (dialogKind === 'help') {
      $('dialog-title').textContent = t('rulesTitle');
      content.append(paragraph('rules1'));
      const order = document.createElement('div'); order.className = 'rule-order'; order.textContent = `3 < 4 < … < 10 < J < Q < K < A < 2 < ☆ < ★`; order.setAttribute('aria-label', t('rankOrder')); content.append(order);
      const list = document.createElement('ul');
      for (const key of ['rules2','rules3','rules4']) { const li = document.createElement('li'); li.textContent = t(key); list.append(li); }
      content.append(list, paragraph('controls')); actions.append(action('resume', closeDialog));
    } else if (dialogKind === 'restart') {
      $('dialog-title').textContent = t('restartTitle'); content.append(paragraph('restartCopy'));
      actions.append(action('cancel', closeDialog), action('newDeal', newGame));
    } else if (dialogKind === 'results') {
      $('dialog-title').textContent = t(state.finished[0] === 0 ? 'win' : 'finish');
      content.append(paragraph('results'));
      state.finished.forEach((player, i) => {
        const row = document.createElement('div'); row.className = `result-row${i === 0 ? ' winner' : ''}`;
        const name = document.createElement('span'); name.textContent = `${t('place', {rank:i+1})} · ${t(names[player])}`;
        const rest = document.createElement('span'); rest.textContent = t('resultLeft', {count:state.hands[player].length}); row.append(name,rest); content.append(row);
      });
      actions.append(action('again', newGame));
    } else {
      $('dialog-title').textContent = t('paused'); content.append(paragraph('pausedCopy')); actions.append(action('resume',closeDialog));
    }
    I.apply($('dialog'));
  }
  function openDialog(kind) {
    clearTimeout(timer); timer = null; dialogKind = kind; renderDialog();
    if (!$('dialog').open) $('dialog').showModal(); render();
  }
  function closeDialog() { dialogKind = ''; $('dialog').close(); render(); schedule(); }
  $('hand').addEventListener('click', event => {
    const button = event.target.closest('[data-card]'); if (!button || !isTurn()) return;
    if (selected.has(button.dataset.card)) selected.delete(button.dataset.card); else selected.add(button.dataset.card);
    statusOverride = null; hintIndex = 0; render();
  });
  $('play').addEventListener('click', play);
  $('pass').addEventListener('click', () => { if (isTurn() && state.target) perform([]); });
  $('hint').addEventListener('click', hint); $('clear').addEventListener('click', clearSelection);
  $('pause').addEventListener('click', () => openDialog('pause'));
  $('help').addEventListener('click', () => openDialog('help'));
  $('restart').addEventListener('click', () => state.over ? newGame() : openDialog('restart'));
  $('close-dialog').addEventListener('click', closeDialog);
  $('dialog').addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  document.addEventListener('keydown', event => {
    if (dialogKind || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    // Native keyboard activation remains intact on focused buttons and links.
    if (event.target.closest('button,a') && (event.key === 'Enter' || event.key === ' ')) return;
    if (event.key === 'Enter') { event.preventDefault(); play(); }
    else if (event.key === ' ' && isTurn() && state.target) { event.preventDefault(); perform([]); }
    else if (event.key.toLowerCase() === 'h') hint();
    else if (event.key === 'Escape') clearSelection();
  });
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer); timer = null;
    if (!document.hidden && !state.over && !dialogKind) openDialog('pause');
  });
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', event => { if (event.persisted && !state.over && !dialogKind) openDialog('pause'); });
  window.addEventListener('boopland:languagechange', () => { render(); if (dialogKind) renderDialog(); });
  new ResizeObserver(fitTableCards).observe($('table-cards'));
  newGame();
})();
