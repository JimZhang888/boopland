(() => {
  'use strict';
  const E = window.GinRummy;
  const I = window.BooplandI18n;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t('gin.' + key, values);
  const symbols = ['♣', '♦', '♥', '♠'];
  const suitNames = ['clubs', 'diamonds', 'hearts', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let state = E.createGame();
  let selected = null;
  let sortMode = 0;
  let timer = null;
  let dialogMode = null;
  let notice = null;
  const ended = () => state.phase === 'roundOver' || state.phase === 'matchOver';
  const human = () => state.current === 0 && !ended();
  const who = index => t(index === 0 ? 'you' : 'opponent');
  const shortCard = card => ranks[E.rank(card) - 1] + symbols[E.suit(card)];
  const cardName = card => t('cardLabel', { rank: ranks[E.rank(card) - 1], suit: t(suitNames[E.suit(card)]) });
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  function face(card) {
    const el = node('span', 'card-face');
    for (const cls of ['corner', 'corner bottom-corner']) {
      const corner = node('span', cls, ranks[E.rank(card) - 1]);
      corner.append(node('small', '', symbols[E.suit(card)]));
      el.append(corner);
    }
    el.append(node('span', 'center-suit', symbols[E.suit(card)]));
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function orderedHand(hand) {
    if (sortMode === 1) return [...hand].sort(E.bySuit);
    if (sortMode === 2) return [...hand].sort(E.byRank);
    const result = E.analyze(hand);
    return [...result.melds.flatMap(group => [...group].sort(E.bySuit)), ...result.deadwood.sort(E.bySuit)];
  }

  function handAnalysis() {
    const preview = human() && state.phase === 'discard' && selected !== null && selected !== state.forbidden;
    return { preview, ...E.analyze(preview ? state.hands[0].filter(c => c !== selected) : state.hands[0]) };
  }

  function renderHand() {
    const focused = document.activeElement?.dataset.card;
    const analysis = handAnalysis();
    const container = $('hand');
    container.replaceChildren();
    const active = human() && state.phase === 'discard';
    for (const card of orderedHand(state.hands[0])) {
      const group = analysis.melds.findIndex(meld => meld.includes(card));
      const button = node('button', 'card' + ([1, 2].includes(E.suit(card)) ? ' red' : '') + (card === selected ? ' selected' : '') + (card === state.forbidden && human() ? ' locked' : '') + (card === state.drawn && human() ? ' drawn' : '') + (group >= 0 ? ' meld-' + group : ''));
      button.dataset.card = card;
      button.disabled = !active;
      button.setAttribute('aria-pressed', String(card === selected));
      button.setAttribute('aria-label', [cardName(card), group >= 0 ? t('meldLabel', { n: group + 1 }) : '', card === state.forbidden && human() ? t('lockedLabel') : ''].filter(Boolean).join(', '));
      button.append(face(card));
      if (group >= 0) {
        const mark = node('span', 'meld-mark', String(group + 1));
        mark.setAttribute('aria-hidden', 'true');
        button.append(mark);
      }
      button.addEventListener('click', () => {
        if (!active) return;
        if (card === state.forbidden) { notice = { key: 'locked' }; render(); return; }
        selected = selected === card ? null : card;
        notice = null;
        render();
      });
      container.append(button);
    }
    if (focused !== undefined) container.querySelector(`[data-card="${focused}"]`)?.focus({ preventScroll: true });
    $('deadwood').textContent = analysis.points;
    $('deadwood-label').textContent = t(analysis.preview ? 'afterDiscard' : 'deadwood');
    $('deadwood').parentElement.classList.toggle('ready', analysis.points <= 10);
  }

  function statusText() {
    if (notice) return t(notice.key, notice.values);
    if (ended()) return t('roundDone');
    if (!human()) return t('aiTurn');
    if (state.phase === 'opening') return t('opening');
    if (state.phase === 'draw') return t(state.forceStock ? 'forced' : 'drawPrompt');
    if (selected === null) return t('discardPrompt');
    const analysis = handAnalysis();
    return t(analysis.points === 0 ? 'canGin' : analysis.points <= 10 ? 'canKnock' : 'selected', { card: shortCard(selected), n: analysis.points });
  }

  function render() {
    $('your-score').textContent = state.scores[0];
    $('opponent-score').textContent = state.scores[1];
    $('round').textContent = t('round', { n: state.round });
    $('stock-count').textContent = t('stockCount', { n: state.stock.length });
    $('discard-note').textContent = t('topCard');
    $('turn-count').textContent = t('turnCount', { n: state.turns });
    $('opponent-state').textContent = state.current === 1 && !ended() ? t('thinking') : t('cards', { n: state.hands[1].length });
    const opponentHand = $('opponent-hand');
    opponentHand.replaceChildren();
    state.hands[1].forEach((_, index) => {
      const back = node('span', 'mini-back');
      back.style.setProperty('--tilt', ((index - (state.hands[1].length - 1) / 2) * 2) + 'deg');
      opponentHand.append(back);
    });
    const drawAllowed = human() && ['draw', 'opening'].includes(state.phase);
    $('stock').disabled = !drawAllowed || state.phase === 'opening';
    $('discard-pile').disabled = !drawAllowed || state.forceStock || !state.discards.length;
    const top = state.discards.at(-1);
    $('discard-pile').replaceChildren();
    $('discard-pile').classList.toggle('red', top !== undefined && [1, 2].includes(E.suit(top)));
    $('discard-pile').setAttribute('aria-label', top === undefined ? t('discardPile') : t('takeDiscard') + ': ' + cardName(top));
    if (top !== undefined) $('discard-pile').append(face(top));
    $('stock').setAttribute('aria-label', t('drawStock') + ', ' + t('stockCount', { n: state.stock.length }));
    renderHand();
    const primary = $('primary');
    primary.disabled = false;
    if (ended()) primary.textContent = t('viewResult');
    else if (!human()) { primary.textContent = t('wait'); primary.disabled = true; }
    else if (state.phase === 'opening') primary.textContent = t('pass');
    else if (state.phase === 'draw') primary.textContent = t('drawStock');
    else { primary.textContent = t('discard'); primary.disabled = selected === null || selected === state.forbidden; }
    const analysis = handAnalysis();
    $('knock').textContent = t(analysis.preview && analysis.points === 0 ? 'gin' : 'knock');
    $('knock').disabled = !analysis.preview || analysis.points > 10;
    $('hint').disabled = !human();
    $('status').textContent = statusText();
    const event = state.event;
    const eventKeys = { pass: 'eventPass', stock: 'eventStock', pickup: 'eventPickup', discard: 'eventDiscard' };
    $('last-event').textContent = eventKeys[event.type] ? t(eventKeys[event.type], { who: who(event.player), card: event.card === null ? '' : shortCard(event.card) }) : t(event.type === 'end' ? 'roundDone' : 'dealt');
  }

  function stopTimer() { if (timer !== null) clearTimeout(timer); timer = null; }

  function schedule() {
    stopTimer();
    if (document.hidden || $('dialog').open || state.current !== 1 || ended()) return;
    timer = setTimeout(() => {
      timer = null;
      if (document.hidden || $('dialog').open || state.current !== 1 || ended()) return;
      perform(E.chooseAction(state));
    }, state.phase === 'discard' ? 850 : 650);
  }

  function perform(action) {
    if (!action) return;
    E.act(state, action);
    selected = null;
    notice = null;
    render();
    if (ended()) openDialog('result');
    else schedule();
  }

  function smallGroup(cards, className) {
    const group = node('div', 'result-group ' + className);
    cards.forEach(card => {
      const el = node('span', 'small-card' + ([1, 2].includes(E.suit(card)) ? ' red' : ''), shortCard(card));
      el.setAttribute('aria-label', cardName(card));
      group.append(el);
    });
    return group;
  }

  function resultHand(index, analysis, knocker) {
    const section = node('section', 'result-hand');
    const title = node('h3', '', who(index) + (knocker ? ' · ' + t('knocker') : ''));
    title.append(node('span', 'quiet', t('deadwoodPoints', { n: analysis.points })));
    section.append(title);
    const cards = node('div', 'result-cards');
    analysis.melds.forEach(group => cards.append(smallGroup([...group].sort(E.bySuit), '')));
    if (analysis.layoffs?.length) cards.append(smallGroup(analysis.layoffs.map(item => item.card), 'laid'));
    if (analysis.deadwood.length) cards.append(smallGroup([...analysis.deadwood].sort(E.bySuit), 'unmatched'));
    section.append(cards);
    return section;
  }

  function addDialogAction(key, callback, primary = false) {
    const button = node('button', primary ? 'primary-button' : 'soft-button', t(key));
    button.addEventListener('click', callback);
    $('dialog-actions').append(button);
  }

  function closeDialog() { $('dialog').close(); }

  function freshGame() {
    stopTimer();
    state = E.createGame();
    selected = null;
    notice = null;
    closeDialog();
    render();
    schedule();
  }

  function populateDialog() {
    const content = $('dialog-content');
    content.replaceChildren();
    $('dialog-actions').replaceChildren();
    if (dialogMode === 'help') {
      $('dialog-title').textContent = t('rulesTitle');
      content.append(node('p', '', t('rulesIntro')));
      const list = node('ol');
      for (let n = 1; n <= 7; n++) list.append(node('li', '', t('rule' + n)));
      content.append(list);
      addDialogAction('continue', closeDialog, true);
    } else if (dialogMode === 'new') {
      $('dialog-title').textContent = t('newTitle');
      content.append(node('p', '', t('newCopy')));
      addDialogAction('cancel', closeDialog);
      addDialogAction('restart', freshGame, true);
    } else if (dialogMode === 'result') {
      const result = state.result;
      const resultKeys = { gin: 'resultGin', knock: 'resultKnock', undercut: 'resultUndercut', draw: 'resultDraw' };
      $('dialog-title').textContent = t(state.phase === 'matchOver' ? result.winner === 0 ? 'youWin' : 'aiWin' : resultKeys[result.kind]);
      if (result.kind === 'draw') content.append(node('p', '', t('drawCopy')));
      else {
        const score = node('div', 'result-score');
        score.append(node('strong', '', '+' + result.points));
        const detail = node('div');
        detail.append(node('p', '', t('winnerPoints', { who: who(result.winner), n: result.points })));
        detail.append(node('p', 'result-detail', t(result.kind + 'Math', { d: result.defender.points, k: result.knocker.points, n: result.points })));
        score.append(detail);
        content.append(score);
      }
      const totals = node('div', 'result-total');
      totals.append(node('span', '', who(0) + '  ' + state.scores[0]), node('span', '', who(1) + '  ' + state.scores[1]));
      content.append(totals);
      for (let index = 0; index < 2; index++) {
        const knocker = result.kind !== 'draw' && index === result.knockerIndex;
        const analysis = result.kind === 'draw' ? E.analyze(state.hands[index]) : knocker ? result.knocker : result.defender;
        content.append(resultHand(index, analysis, knocker));
      }
      if (result.kind !== 'draw') content.append(node('p', 'result-detail', result.defender.layoffs.length ? t('laidOff', { cards: result.defender.layoffs.map(item => shortCard(item.card)).join(' · ') }) : t('noLayoff')));
      const history = node('details');
      history.append(node('summary', '', t('roundHistory')));
      const table = node('table', 'history-table');
      const head = node('tr');
      ['historyRound', 'historyWinner', 'historyPoints'].forEach(key => head.append(node('th', '', t(key))));
      const thead = node('thead');
      thead.append(head);
      const tbody = node('tbody');
      state.history.forEach(item => {
        const row = node('tr');
        [item.round, item.winner === null ? t('noWinner') : who(item.winner), item.points].forEach(text => row.append(node('td', '', text)));
        tbody.append(row);
      });
      table.append(thead, tbody);
      history.append(table);
      content.append(history);
      addDialogAction(state.phase === 'matchOver' ? 'playAgain' : 'nextRound', () => {
        if (state.phase === 'matchOver') freshGame();
        else {
          E.nextRound(state);
          selected = null;
          notice = null;
          closeDialog();
          render();
          schedule();
        }
      }, true);
    }
    I.apply($('dialog'));
  }

  function openDialog(mode) {
    stopTimer();
    dialogMode = mode;
    populateDialog();
    if (!$('dialog').open) $('dialog').showModal();
    $('dialog').scrollTop = 0;
  }

  $('stock').addEventListener('click', () => { if (!$('stock').disabled) perform({ type: 'draw', source: 'stock' }); });
  $('discard-pile').addEventListener('click', () => { if (!$('discard-pile').disabled) perform({ type: 'draw', source: 'discard' }); });
  $('primary').addEventListener('click', () => {
    if (ended()) openDialog('result');
    else if (human() && state.phase === 'opening') perform({ type: 'pass' });
    else if (human() && state.phase === 'draw') perform({ type: 'draw', source: 'stock' });
    else if (human() && state.phase === 'discard' && selected !== null && selected !== state.forbidden) perform({ type: 'discard', card: selected });
  });
  $('knock').addEventListener('click', () => { if (!$('knock').disabled) perform({ type: 'discard', card: selected, knock: true }); });
  $('sort').addEventListener('click', () => {
    sortMode = (sortMode + 1) % 3;
    notice = { key: ['sortMelds', 'sortSuits', 'sortRanks'][sortMode] };
    render();
  });
  $('hint').addEventListener('click', () => {
    if (!human()) return;
    const action = E.chooseAction(state);
    if (action.type === 'discard') {
      selected = action.card;
      notice = { key: 'hintDiscard', values: { card: shortCard(selected), n: handAnalysis().points } };
    } else notice = { key: action.type === 'pass' ? 'hintPass' : action.source === 'discard' ? 'hintTake' : 'hintStock' };
    render();
  });
  $('help').addEventListener('click', () => openDialog('help'));
  $('new-game').addEventListener('click', () => openDialog('new'));
  $('close-dialog').addEventListener('click', closeDialog);
  $('dialog').addEventListener('close', () => { dialogMode = null; schedule(); });
  $('hand').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...$('hand').querySelectorAll('button:not(:disabled)')];
    if (!buttons.length) return;
    event.preventDefault();
    let index = buttons.indexOf(document.activeElement);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = buttons.length - 1;
    else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[index].focus();
  });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pagehide', stopTimer);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('boopland:languagechange', () => { render(); if ($('dialog').open) populateDialog(); });
  render();
  schedule();
})();
