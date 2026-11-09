(() => {
  'use strict';
  const E = window.HeartsEngine;
  const I = window.BooplandI18n;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t('hearts.' + key, values);
  const names = player => t(player === 0 ? 'you' : 'player' + player);
  const symbols = { C: '♣', D: '♦', S: '♠', H: '♥' };
  const rankText = card => ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[E.rank(card)] || String(E.rank(card)));
  const cardName = card => t('cardLabel', { suit: t(E.suit(card)), rank: rankText(card) });
  const saveKey = 'boopland-hearts-v1';
  let state, actions = [], selected = [], timer = null, dialogKind = null, notice = null, storageFailed = false;
  const avatars = [
    '',
    '<path d="M21 36V17m0 10C8 29 5 20 7 17c8-2 13 2 14 10Zm0-5c-1-10 5-16 14-15 3 9-3 16-14 15Z"/><path d="m13 22 8 6m0-6 8-8M10 37q11-5 22 0"/>',
    '<path d="M8 24c-5-9 5-17 12-11 0-11 17-12 19 0 8 2 8 14-2 15H13q-7 0-5-4Z"/><path d="m14 32-2 4m10-4-2 5m10-5-2 4"/>',
    '<path d="M22 36V19m0 10L8 23l6-4-2-10 8 5 4-10 5 11 10-4-4 10 5 5-18 6Z"/><path d="m22 28-5-9m6 7 8-8M13 38h20"/>'
  ];
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function seed() {
    try { return crypto.getRandomValues(new Uint32Array(1))[0]; }
    catch { return Math.floor(Math.random() * 4294967296); }
  }
  function persist() {
    try { localStorage.setItem(saveKey, JSON.stringify({ version: 1, seed: state.seed, actions, selected })); }
    catch { storageFailed = true; }
  }
  function load() {
    try {
      const raw = localStorage.getItem(saveKey);
      if (raw && raw.length <= 1800000) {
        const saved = JSON.parse(raw);
        state = E.restore(saved);
        actions = saved.actions;
        selected = Array.isArray(saved.selected) ? [...new Set(saved.selected)].filter(c => state.phase === 'pass' ? state.hands[0].includes(c) : E.legalCards(state, 0).includes(c)).slice(0, state.phase === 'pass' ? 3 : 1) : [];
        notice = { key: 'saved' };
        return;
      }
    } catch { /* Invalid or unavailable saves never prevent a fresh game. */ }
    state = E.create(seed());
    persist();
  }
  function cardElement(card, interactive = false) {
    const el = node(interactive ? 'button' : 'div', 'card' + (['H', 'D'].includes(E.suit(card)) ? ' red' : '') + (E.points(card) ? ' penalty' : ''));
    const corner = node('span', 'corner');
    corner.append(node('span', '', rankText(card)), node('span', '', symbols[E.suit(card)]));
    el.append(corner, node('span', 'pip', symbols[E.suit(card)]), node('span', 'bottom-corner', rankText(card) + symbols[E.suit(card)]));
    if (interactive) {
      el.type = 'button';
      el.dataset.card = card;
      el.setAttribute('aria-pressed', String(selected.includes(card)));
      const received = state.received.includes(card);
      el.setAttribute('aria-label', cardName(card) + (received ? ', ' + t('newCard') : ''));
      el.title = cardName(card);
      el.classList.toggle('selected', selected.includes(card));
      el.classList.toggle('received', received);
      el.disabled = state.phase !== 'pass' && !E.legalCards(state, 0).includes(card);
      el.addEventListener('click', () => select(card));
    } else {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', cardName(card));
    }
    [...el.children].forEach(child => child.setAttribute('aria-hidden', 'true'));
    return el;
  }
  function select(card) {
    if (dialogKind) return;
    if (state.phase === 'pass') {
      if (selected.includes(card)) selected = selected.filter(c => c !== card);
      else if (selected.length < 3) selected.push(card);
      else { notice = { key: 'passLimit' }; render(); return; }
      notice = null;
    } else if (E.legalCards(state, 0).includes(card)) {
      selected = selected[0] === card ? [] : [card];
      notice = selected.length ? { key: 'selectedPlay', card } : null;
    } else return;
    persist();
    render();
  }
  const passTarget = () => t({ 1: 'passLeft', 3: 'passRight', 2: 'passAcross', 0: 'passNone' }[state.passOffset]);
  function statusText() {
    if (notice) return t(notice.key, notice.card ? { card: cardName(notice.card) } : {});
    if (state.phase === 'pass') return t('selectPass', { target: passTarget(), n: selected.length });
    if (state.phase === 'collect') return t('wonTrick', { player: names(E.trickWinner(state.trick)), points: state.trick.reduce((sum, p) => sum + E.points(p.card), 0) });
    if (state.phase === 'roundEnd' || state.phase === 'matchEnd') return t('scoreNote');
    if (state.turn !== 0) return t('thinking', { player: names(state.turn) });
    if (selected.length) return t('selectedPlay', { card: cardName(selected[0]) });
    if (!state.trick.length) return !state.completed.length ? t('firstLead') : t(state.broken || state.hands[0].every(c => E.suit(c) === 'H') ? 'openLead' : 'lead');
    const led = E.suit(state.trick[0].card);
    if (state.hands[0].some(c => E.suit(c) === led)) return t('follow', { suit: t(led) });
    return t(!state.completed.length ? 'firstSafe' : 'yourTurn');
  }
  function renderSeats() {
    for (let p = 0; p < 4; p++) {
      const seat = $('seat-' + p);
      seat.replaceChildren();
      seat.classList.toggle('active', state.phase === 'play' && state.turn === p || state.phase === 'pass' && p === 0);
      if (p) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 46 44');
        svg.setAttribute('class', 'avatar');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = avatars[p];
        seat.append(svg);
      }
      seat.append(node(p ? 'span' : 'strong', 'seat-name', names(p)));
      const score = node('span', 'seat-score');
      score.append(document.createTextNode(t('total')), node('b', '', state.totals[p]));
      // End-of-round totals already include this hand; show zero pending points.
      const pending = ['roundEnd', 'matchEnd'].includes(state.phase) ? 0 : state.roundPoints[p];
      score.append(node('em', '', '+' + pending));
      score.setAttribute('aria-label', t('total') + ' ' + state.totals[p] + ', ' + t('roundScore') + ' ' + state.roundPoints[p]);
      seat.append(score);
      if (p) seat.append(node('span', 'card-count', t('cards', { n: state.hands[p].length })));
    }
  }
  function render() {
    const focused = document.activeElement?.dataset?.card;
    $('round-label').textContent = t('round', { n: state.round });
    $('trick-label').textContent = t('trick', { n: Math.min(13, state.completed.length + 1) });
    $('hearts-state').textContent = t(state.broken ? 'heartsOpen' : 'heartsLocked');
    renderSeats();
    $('hand').replaceChildren(...state.hands[0].map(card => cardElement(card, true)));
    $('hand-note').textContent = state.phase === 'pass' ? t('selectPass', { target: passTarget(), n: selected.length }) : t(state.received.length ? 'received' : 'handNote');
    const trick = $('trick-cards');
    trick.replaceChildren();
    for (const play of state.trick) {
      const played = node('div', 'played played-' + play.player + (state.phase === 'collect' && E.trickWinner(state.trick) === play.player ? ' winner' : ''));
      played.append(cardElement(play.card), node('span', 'played-label', names(play.player)));
      trick.append(played);
    }
    $('table-note').hidden = !!state.trick.length;
    $('note-title').textContent = t(state.phase === 'pass' ? 'passTitle' : 'readyTitle');
    $('note-copy').textContent = t(state.phase === 'pass' ? 'passCopy' : 'readyCopy', { target: passTarget() });
    $('status').textContent = statusText();
    $('footer-note').textContent = t(storageFailed ? 'noStorage' : 'footer');
    $('hint').disabled = !(state.phase === 'pass' || state.phase === 'play' && state.turn === 0);
    $('last-trick').disabled = !state.completed.length;
    const primary = $('primary');
    primary.disabled = false;
    if (state.phase === 'pass') {
      primary.textContent = t('confirmPass', { n: selected.length });
      primary.disabled = selected.length !== 3;
    } else if (state.phase === 'roundEnd') primary.textContent = t('nextRound');
    else if (state.phase === 'matchEnd') primary.textContent = t('results');
    else {
      primary.textContent = t(state.phase === 'play' && state.turn === 0 ? 'play' : 'waiting');
      primary.disabled = !(state.phase === 'play' && state.turn === 0 && selected.length === 1);
    }
    if (focused) [...$('hand').children].find(el => el.dataset.card === focused && !el.disabled)?.focus({ preventScroll: true });
  }
  function commit(action) {
    E.apply(state, action);
    actions.push(action);
    selected = [];
    notice = null;
    persist();
    render();
    if (['roundEnd', 'matchEnd'].includes(state.phase)) showDialog('result');
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (document.hidden || dialogKind) return;
    if (state.phase === 'collect') timer = setTimeout(() => commit({ type: 'collect' }), 1450);
    else if (state.phase === 'play' && state.turn !== 0) timer = setTimeout(() => {
      commit({ type: 'play', player: state.turn, card: E.choosePlay(state) });
    }, 650);
  }
  function primary() {
    if (dialogKind) return;
    if (state.phase === 'pass' && selected.length === 3) commit({ type: 'pass', cards: selected.slice() });
    else if (state.phase === 'play' && state.turn === 0 && selected.length === 1) commit({ type: 'play', player: 0, card: selected[0] });
    else if (state.phase === 'roundEnd') commit({ type: 'next' });
    else if (state.phase === 'matchEnd') showDialog('result');
  }
  function hint() {
    if (dialogKind) return;
    if (state.phase === 'pass') {
      selected = E.choosePass(state.hands[0]);
      notice = { key: 'hintPass' };
    } else if (state.phase === 'play' && state.turn === 0) {
      selected = [E.choosePlay(state, 0)];
      notice = { key: 'hintPlay', card: selected[0] };
    } else return;
    persist();
    render();
  }
  function scoreTable(history = false) {
    const table = node('table', 'score-table');
    const head = node('thead'), row = node('tr');
    row.append(node('th', '', history ? t('roundScore') : ''));
    for (let p = 0; p < 4; p++) {
      const th = node('th', p === 0 ? 'me' : '', names(p));
      th.scope = 'col'; row.append(th);
    }
    head.append(row); table.append(head);
    const body = node('tbody');
    const rounds = history ? state.history : state.result ? [state.result] : [];
    for (const round of rounds) {
      const tr = node('tr');
      tr.append(node('th', '', String(round.round)));
      round.delta.forEach((points, p) => tr.append(node('td', p === 0 ? 'me' : '', '+' + points)));
      body.append(tr);
    }
    table.append(body);
    const foot = node('tfoot'), total = node('tr');
    total.append(node('th', '', t('total')));
    state.totals.forEach((score, p) => total.append(node('td', p === 0 ? 'me' : '', String(score))));
    foot.append(total); table.append(foot);
    return table;
  }
  function dialogButton(key, callback, primary = false) {
    const button = node('button', primary ? 'primary-button' : '', t(key));
    button.addEventListener('click', callback);
    $('dialog-actions').append(button);
  }
  function closeDialog() { $('dialog').close(); }
  function renderDialog() {
    const content = $('dialog-content');
    content.replaceChildren();
    $('dialog-actions').replaceChildren();
    let title = '';
    if (dialogKind === 'help') {
      title = t('help');
      const list = node('ol');
      for (let i = 1; i <= 6; i++) list.append(node('li', '', t('rule' + i)));
      content.append(list);
      dialogButton('resume', closeDialog, true);
    } else if (dialogKind === 'pause') {
      title = t('paused');
      content.append(node('div', 'result-art', '♧'), node('p', 'result-copy', t('pauseCopy')));
      dialogButton('resume', closeDialog, true);
    } else if (dialogKind === 'new') {
      title = t('newTitle');
      content.append(node('p', '', t('newCopy')));
      dialogButton('cancel', closeDialog);
      dialogButton('start', () => { closeDialog(); startNew(); }, true);
    } else if (dialogKind === 'scores') {
      title = t('scores');
      content.append(node('p', 'score-small', t('scoreNote')), scoreTable(true));
      if (!state.history.length) content.append(node('p', '', t('emptyScores')));
      dialogButton('resume', closeDialog, true);
    } else if (dialogKind === 'last') {
      title = t('lastTrick');
      const last = state.completed.at(-1);
      if (!last) content.append(node('p', '', t('noLast')));
      else {
        content.append(node('p', '', t('lastResult', { player: names(last.winner), points: last.points })));
        const cards = node('div', 'last-cards');
        last.plays.forEach(play => {
          const wrap = node('div', 'last-card');
          wrap.append(node('span', '', names(play.player)), cardElement(play.card)); cards.append(wrap);
        });
        content.append(cards);
      }
      dialogButton('resume', closeDialog, true);
    } else if (dialogKind === 'result') {
      const end = state.phase === 'matchEnd';
      title = end ? t('matchEnd') : t('roundEnd', { n: state.round });
      let copy = t('normalEnd');
      if (end) copy = state.winners.length > 1 ? t('tie', { players: state.winners.map(names).join(' · ') }) : state.winners[0] === 0 ? t('win') : t('winner', { player: names(state.winners[0]) });
      content.append(node('div', 'result-art', state.result.moon >= 0 ? '☾' : '♡'), node('p', 'result-copy', copy));
      if (state.result.moon >= 0) content.append(node('p', '', t('moon', { player: names(state.result.moon) })));
      content.append(scoreTable(), node('p', 'score-small', t('scoreNote')));
      dialogButton(end ? 'start' : 'nextRound', () => {
        closeDialog();
        if (end) startNew(); else commit({ type: 'next' });
      }, true);
    }
    $('dialog-title').textContent = title;
  }
  function showDialog(kind) {
    dialogKind = kind;
    clearTimeout(timer);
    renderDialog();
    if (!$('dialog').open) $('dialog').showModal();
    $('close-dialog').focus({ preventScroll: true });
  }
  function startNew() {
    clearTimeout(timer);
    state = E.create(seed()); actions = []; selected = []; notice = null;
    persist(); render(); schedule();
  }
  $('primary').addEventListener('click', primary);
  $('hint').addEventListener('click', hint);
  $('help').addEventListener('click', () => showDialog('help'));
  $('pause').addEventListener('click', () => showDialog('pause'));
  $('scores').addEventListener('click', () => showDialog('scores'));
  $('last-trick').addEventListener('click', () => showDialog('last'));
  $('new-game').addEventListener('click', () => showDialog('new'));
  $('close-dialog').addEventListener('click', closeDialog);
  $('dialog').addEventListener('close', () => { dialogKind = null; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pagehide', () => { clearTimeout(timer); persist(); });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('boopland:languagechange', () => {
    render();
    if (dialogKind) renderDialog();
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (dialogKind) return;
    if (event.key.toLowerCase() === 'h') { event.preventDefault(); hint(); }
    if (event.key.toLowerCase() === 'p') { event.preventDefault(); showDialog('pause'); }
    if (event.key === 'Escape') { selected = []; notice = null; persist(); render(); }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const cards = [...$('hand').querySelectorAll('button:not(:disabled)')];
      if (!cards.length) return;
      event.preventDefault();
      const index = cards.indexOf(document.activeElement);
      const change = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      const next = index < 0 ? 0 : (index + change + cards.length * 2) % cards.length;
      cards[next].focus({ preventScroll: true });
    }
  });
  load(); render();
  if (['roundEnd', 'matchEnd'].includes(state.phase)) showDialog('result');
  schedule();
})();
