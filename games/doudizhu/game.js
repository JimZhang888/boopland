(() => {
  'use strict';
  const E = window.Doudizhu, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t(`ddz.${key}`, values);
  const storageKey = 'boopland-doudizhu-v1';
  const suits = ['♠', '♥', '♣', '♦'], suitKeys = ['spades', 'hearts', 'clubs', 'diamonds'];
  let state = null, total = 0, credited = false, selected = new Set(), timer = null, dialogKind = null;
  let notice = null, hintIndex = 0, hintKey = '', hintMoves = [];
  const playerName = index => t(index === 0 ? 'you' : `player${index}`);
  const rankText = id => ({ 11:'J',12:'Q',13:'K',14:'A',15:'2',16:'JOKER',17:'JOKER' })[E.rank(id)] || String(E.rank(id));
  const cardLabel = id => id >= 52 ? t(id === 52 ? 'smallJoker' : 'bigJoker') : t('cardLabel', { rank:rankText(id), suit:t(suitKeys[id % 4]) });
  const myTurn = () => state?.phase === 'playing' && state.turn === 0;
  const multiplier = () => state ? 2 ** (state.bombs + Number(state.spring)) : 1;
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ total, credited, game:state ? { version:1, seed:state.seed, first:state.first, history:state.history } : null })); } catch { /* A blocked store does not prevent play. */ }
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey));
      if (!raw) return;
      state = E.restore(raw.game);
      total = Number.isSafeInteger(raw.total) && Math.abs(raw.total) < 1e12 ? raw.total : 0;
      credited = raw.credited === true;
    } catch { state = null; }
  }
  function card(id, interactive = false) {
    const el = document.createElement(interactive ? 'button' : 'span');
    el.className = `card${id >= 52 ? ' joker' : ''}${id === 53 || (id < 52 && [1,3].includes(id % 4)) ? ' red' : ''}`;
    el.setAttribute('aria-label', cardLabel(id));
    for (const [className, text] of [['card-rank',rankText(id)],['card-suit',suits[id % 4]],['card-center',id >= 52 ? '♧' : suits[id % 4]],['card-corner',id >= 52 ? '✧' : rankText(id)]]) {
      const span = document.createElement('span'); span.className = className; span.textContent = text; span.setAttribute('aria-hidden','true'); el.append(span);
    }
    if (interactive) {
      el.type = 'button'; el.dataset.card = id;
      el.disabled = !myTurn();
      el.classList.toggle('selected', selected.has(id));
      el.setAttribute('aria-pressed', String(selected.has(id)));
      el.addEventListener('click', () => { if (!myTurn()) return; selected.has(id) ? selected.delete(id) : selected.add(id); notice = null; renderSelection(); });
    } else el.setAttribute('role','img');
    return el;
  }
  function renderHand() {
    const activeId = document.activeElement?.dataset.card;
    const hand = $('hand'); hand.replaceChildren();
    if (!state) { const p = document.createElement('div'); p.className = 'hand-empty'; p.textContent = t('emptyHand'); hand.append(p); return; }
    const cards = state.hands[0];
    const twoRows = window.innerWidth < 650 && window.innerHeight > 550 && cards.length > 10;
    const split = twoRows ? Math.ceil(cards.length / 2) : cards.length;
    for (let start = 0; start < cards.length; start += split) {
      const row = document.createElement('div'); row.className = 'hand-row';
      cards.slice(start, start + split).forEach(id => row.append(card(id, true)));
      hand.append(row);
    }
    fitCards();
    if (activeId != null) hand.querySelector(`[data-card="${activeId}"]`)?.focus({ preventScroll:true });
  }
  function fitCards() {
    for (const row of document.querySelectorAll('.hand-row, .trick-cards')) {
      const cards = row.querySelectorAll('.card');
      if (!cards.length) continue;
      const width = cards[0].getBoundingClientRect().width;
      const available = row.clientWidth || row.parentElement.clientWidth;
      const step = cards.length > 1 ? Math.min(width * .66, Math.max(6, (available - width - 4) / (cards.length - 1))) : width;
      row.style.setProperty('--overlap', `${step - width}px`);
    }
  }
  function statusText() {
    if (notice) return t(notice);
    if (!state) return t('ready');
    if (state.phase === 'redeal') return t('redeal');
    if (state.phase === 'finished') return t(state.scores[0] > 0 ? 'won' : 'lost');
    if (state.phase === 'bidding') return state.turn === 0 ? t('bidTurn') : t('bidThinking', {name:playerName(state.turn)});
    return state.turn === 0 ? t(state.trick ? 'playTurn' : 'leadTurn') : t('thinking', {name:playerName(state.turn)});
  }
  function renderSelection() {
    const shape = E.classify([...selected]);
    $('selection-label').textContent = selected.size ? t(shape ? 'selected' : 'invalidSelection', {n:selected.size, type:shape ? t(shape.type) : ''}) : '';
    $('hand').querySelectorAll('[data-card]').forEach(el => {
      const on = selected.has(Number(el.dataset.card)); el.classList.toggle('selected',on); el.setAttribute('aria-pressed',String(on));
    });
    $('play').disabled = !myTurn() || !E.beats(shape, state?.trick);
    $('clear').disabled = !selected.size;
    $('status').textContent = statusText(); $('status').classList.toggle('error', Boolean(notice));
  }
  function render() {
    $('base').textContent = state?.highBid || '—'; $('multiplier').textContent = `×${multiplier()}`; $('total').textContent = total;
    for (let i = 0; i < 3; i++) {
      const role = state?.landlord == null ? 'waiting' : state.landlord === i ? 'landlord' : 'farmer';
      $(`role-${i}`).textContent = t(role); $(`role-${i}`).className = `role ${role}`;
      $(`count-${i}`).textContent = t('cards', {n:state ? state.hands[i].length : '—'});
      if (i) {
        $(`player-${i}`).classList.toggle('active', Boolean(state && ['playing','bidding'].includes(state.phase) && state.turn === i));
        const last = state?.last[i];
        $(`action-${i}`).textContent = !last ? '' : last.bid != null ? (last.bid ? t('bidAction',{n:last.bid}) : t('noBid')) : last.pass ? t('pass') : t(last.type);
      }
    }
    $('bottom-cards').replaceChildren();
    for (let i = 0; i < 3; i++) {
      if (state?.landlord != null) $('bottom-cards').append(card(state.bottom[i]));
      else { const back = document.createElement('span'); back.className = 'card back-card'; back.setAttribute('role','img'); back.setAttribute('aria-label',t('backCard')); $('bottom-cards').append(back); }
    }
    $('center-note').hidden = Boolean(state?.trick);
    $('trick-label').hidden = !state?.trick;
    $('trick-cards').hidden = !state?.trick;
    $('trick-label').textContent = state?.trick ? t('lastPlay', {name:playerName(state.trick.player),type:t(state.trick.type)}) : '';
    $('trick-cards').replaceChildren(...(state?.trick?.cards || []).map(id => card(id)));
    $('start').hidden = Boolean(state); $('bid-actions').hidden = state?.phase !== 'bidding'; $('play-actions').hidden = state?.phase !== 'playing'; $('next').hidden = !['finished','redeal'].includes(state?.phase);
    document.querySelectorAll('[data-bid]').forEach(el => { const value = Number(el.dataset.bid); el.disabled = state?.phase !== 'bidding' || state.turn !== 0 || (value > 0 && value <= state.highBid); });
    $('pass').disabled = !myTurn() || !state.trick;
    $('hint').disabled = !myTurn();
    renderHand(); renderSelection(); schedule();
  }
  function schedule() {
    clearTimeout(timer); timer = null;
    if (!state || state.turn === 0 || !['playing','bidding'].includes(state.phase) || document.hidden || $('dialog').open) return;
    timer = setTimeout(() => {
      timer = null;
      if (document.hidden || $('dialog').open) return;
      if (state.phase === 'bidding') E.bid(state, state.turn, E.suggestBid(state.hands[state.turn], state.highBid));
      else E.play(state, state.turn, E.chooseMove(state));
      advance();
    }, 1050);
  }
  function advance() {
    notice = null; hintKey = ''; hintIndex = 0;
    if (state.phase === 'finished' && !credited) { total += state.scores[0]; credited = true; }
    save(); render();
    if (state.phase === 'finished') openDialog('result');
  }
  function newRound() {
    clearTimeout(timer);
    const first = state ? (state.first + 1) % 3 : 0;
    let seed = Date.now() >>> 0;
    if (globalThis.crypto?.getRandomValues) seed = crypto.getRandomValues(new Uint32Array(1))[0];
    state = E.newGame(seed, first); credited = false; selected.clear(); notice = null; hintKey = ''; hintIndex = 0;
    if ($('dialog').open) $('dialog').close();
    dialogKind = null; save(); render();
  }
  function showNotice(key) { notice = key; renderSelection(); }
  function humanPlay() {
    if (!myTurn()) return;
    if (!selected.size) return showNotice('selectFirst');
    const cards = [...selected], shape = E.classify(cards);
    if (!shape) return showNotice('invalid');
    if (!E.beats(shape, state.trick)) return showNotice('tooSmall');
    if (E.play(state, 0, cards)) { selected.clear(); advance(); }
  }
  function hint() {
    if (!myTurn()) return;
    const key = `${state.seed}:${state.history.length}`;
    if (hintKey !== key) { hintKey = key; hintMoves = E.orderedMoves(state.hands[0], state.trick); hintIndex = 0; }
    if (!hintMoves.length) { selected.clear(); return showNotice('noResponse'); }
    selected = new Set(hintMoves[hintIndex++ % hintMoves.length].cards); notice = null; renderSelection();
  }
  function paragraph(text, tag = 'p') { const el = document.createElement(tag); el.textContent = text; return el; }
  function dialogButton(key, callback, primary = false) { const el = document.createElement('button'); el.textContent = t(key); if (primary) el.className = 'primary'; el.addEventListener('click',callback); $('dialog-actions').append(el); }
  function fillDialog() {
    const copy = $('dialog-copy'); copy.replaceChildren(); $('dialog-actions').replaceChildren();
    if (dialogKind === 'help') {
      $('dialog-title').textContent = t('help');
      for (const section of ['Goal','Bid','Types','Details','Score','Controls']) copy.append(paragraph(t(`help${section}`),'h3'),paragraph(t(`help${section}Text`)));
      dialogButton('close', () => $('dialog').close(), true);
    } else if (dialogKind === 'restart') {
      $('dialog-title').textContent = t('restartTitle'); copy.append(paragraph(t('restartCopy')));
      dialogButton('cancel', () => $('dialog').close()); dialogButton('confirm',newRound,true);
    } else if (dialogKind === 'result' && state?.phase === 'finished') {
      $('dialog-title').textContent = t(state.scores[0] > 0 ? 'won' : 'lost');
      const number = paragraph(`${state.scores[0] > 0 ? '+' : ''}${state.scores[0]}`,'strong'); number.className = 'result-number'; copy.append(number);
      copy.append(paragraph(t(state.winner === state.landlord ? 'landlordWon' : 'farmersWon')));
      if (state.spring) copy.append(paragraph(t(state.winner === state.landlord ? 'spring' : 'antiSpring')));
      copy.append(paragraph(t('settlement',{base:state.highBid,multi:multiplier()})));
      for (let i = 0; i < 3; i++) { const row = paragraph('','div'); row.className = 'result-row'; row.append(paragraph(`${playerName(i)} · ${t(i === state.landlord ? 'landlord' : 'farmer')}`,'span'),paragraph(`${state.scores[i] > 0 ? '+' : ''}${state.scores[i]}`,'b')); copy.append(row); }
      for (let i = 1; i < 3; i++) if (state.hands[i].length) copy.append(paragraph(t('remaining',{name:playerName(i)}),'h3'), paragraph(state.hands[i].map(cardLabel).join(' · ')));
      dialogButton('review',() => $('dialog').close()); dialogButton('next',newRound,true);
    }
  }
  function openDialog(kind) { dialogKind = kind; clearTimeout(timer); fillDialog(); if (!$('dialog').open) $('dialog').showModal(); }
  $('start').addEventListener('click',newRound); $('next').addEventListener('click',newRound);
  $('restart').addEventListener('click',() => { if (state && ['playing','bidding'].includes(state.phase)) openDialog('restart'); else newRound(); });
  $('help').addEventListener('click',() => openDialog('help'));
  $('close-dialog').addEventListener('click',() => $('dialog').close());
  $('dialog').addEventListener('close',() => { dialogKind = null; schedule(); });
  document.querySelectorAll('[data-bid]').forEach(el => el.addEventListener('click',() => { if (state && E.bid(state,0,Number(el.dataset.bid))) advance(); }));
  $('play').addEventListener('click',humanPlay); $('hint').addEventListener('click',hint);
  $('clear').addEventListener('click',() => { selected.clear(); notice = null; renderSelection(); });
  $('pass').addEventListener('click',() => { if (myTurn() && E.play(state,0,[])) { selected.clear(); advance(); } });
  document.addEventListener('keydown',event => {
    if ($('dialog').open || event.altKey || event.ctrlKey || event.metaKey) return;
    const cardId = event.target.dataset?.card;
    if (cardId != null && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
      const buttons = [...$('hand').querySelectorAll('button')], index = buttons.indexOf(event.target);
      const rowSize = $('hand').firstElementChild?.children.length || 1;
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -rowSize : rowSize);
      buttons[Math.max(0,Math.min(buttons.length - 1,target))]?.focus({preventScroll:true}); event.preventDefault(); return;
    }
    if (event.key.toLowerCase() === 'h') { event.preventDefault(); hint(); }
    if (event.key === 'Escape') { selected.clear(); notice = null; renderSelection(); }
    if (event.key === 'Enter' && !event.target.closest('button,a')) { event.preventDefault(); humanPlay(); }
  });
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('pagehide',() => { clearTimeout(timer); save(); });
  window.addEventListener('pageshow',schedule);
  window.addEventListener('resize',() => { renderHand(); fitCards(); });
  window.addEventListener('boopland:languagechange',() => { render(); if ($('dialog').open) fillDialog(); });
  load();
  if (state?.phase === 'finished' && !credited) { total += state.scores[0]; credited = true; save(); }
  render();
})();
