(() => {
  'use strict';

  const { cards, createGame } = window.OneMoreCard;
  const byId = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('one-more-card.' + key, values);
  const primary = byId('primary');
  const card = byId('card');
  const guide = byId('guide');
  const rows = new Map();
  let game = createGame();

  for (const [kind, { points }] of Object.entries(cards)) {
    const row = document.createElement('li');
    const art = document.createElement('img');
    art.src = 'art/' + kind + '.svg';
    art.alt = '';
    const label = document.createElement('span');
    label.className = 'kind';
    const name = document.createElement('span');
    name.dataset.i18n = 'one-more-card.' + kind;
    label.append(name);
    if (points) {
      const value = document.createElement('small');
      value.textContent = '+' + points;
      label.append(value);
    }
    const quantity = document.createElement('b');
    quantity.className = 'quantity';
    const flag = document.createElement('span');
    flag.className = 'sr-only';
    flag.dataset.i18n = 'one-more-card.seen';
    row.append(art, label, quantity, flag);
    byId('counts').append(row);
    rows.set(kind, { row, quantity, flag });
  }
  BooplandI18n.apply(byId('counts'));

  function renderInventory(state) {
    let danger = 0;
    rows.forEach(({ row, quantity, flag }, kind) => {
      const count = state.remaining[kind];
      const seen = !cards[kind].points && state.drawn.includes(kind);
      if (seen) danger += count;
      quantity.textContent = count;
      flag.hidden = !seen;
      row.classList.toggle('seen', seen);
      row.classList.toggle('spent', !count);
    });
    byId('left').textContent = state.left;
    byId('risk').textContent = state.outcome ? '—' : new Intl.NumberFormat(BooplandI18n.language, {
      style: 'percent', maximumFractionDigits: 0
    }).format(danger / state.left);
  }

  function renderSummary(state) {
    byId('summary').hidden = !state.complete;
    if (!state.complete) return;
    byId('final-score').textContent = state.total;
    const numerals = ['I', 'II', 'III', 'IV', 'V'];
    byId('log').replaceChildren(...state.rounds.map(({ reason, earned }, index) => {
      const item = document.createElement('li');
      const label = document.createElement('small');
      const value = document.createElement('b');
      item.setAttribute('aria-label', t('log', { n: index + 1, v: earned }));
      item.classList.toggle('lost', reason === 'bust');
      label.textContent = numerals[index];
      value.textContent = '+' + earned;
      item.append(label, value);
      return item;
    }));
  }

  function feedback(state, last) {
    const result = state.outcome;
    if (result?.reason === 'bust') return t('busted', { name: t(last), n: result.lost });
    if (result?.reason === 'empty') return t('emptied', { n: result.earned });
    if (result) return t('banked', { n: result.earned });
    if (!last) return t('ready');
    return cards[last].points ? t('found', { name: t(last), n: cards[last].points }) : t('caution', { name: t(last) });
  }

  function render() {
    const state = game.view();
    const last = state.drawn.at(-1);
    const reason = state.outcome?.reason;
    byId('map').dataset.event = reason || (last && !cards[last].points ? 'trap' : 'draw');
    byId('round').textContent = t('round', { n: state.round });
    byId('steps').replaceChildren(...Array.from({ length: 5 }, (_, i) => {
      const step = document.createElement('i');
      step.classList.toggle('active', i < state.round);
      return step;
    }));
    byId('pot').textContent = state.pot;
    byId('saved').textContent = state.total;
    renderInventory(state);
    byId('stack').hidden = state.complete;
    byId('face').hidden = !last;
    card.querySelector('.back-art').hidden = !!last;
    card.disabled = !!reason;
    if (last) {
      byId('card-value').textContent = cards[last].points ? '+' + cards[last].points : reason === 'bust' ? '!!' : '!';
      byId('card-art').src = 'art/' + last + '.svg';
      byId('card-name').textContent = t(last);
    }
    byId('stamp').hidden = !reason;
    if (reason) byId('stamp').textContent = t(reason === 'bust' ? 'lostMark' : 'safeMark');
    byId('notice').textContent = feedback(state, last);
    byId('bank').hidden = !!reason;
    const action = state.complete ? 'replay' : reason ? 'next' : 'flip';
    primary.querySelector('span').textContent = t(action);
    primary.querySelector('use').setAttribute('href', { replay: '#repeat', next: '#forward', flip: '#draw' }[action]);
    renderSummary(state);
  }

  function animate(node, effect) {
    node.classList.remove('flipping', 'banking', 'busting');
    // Restart the short cue even when two successive cards have the same value.
    void node.offsetWidth;
    node.classList.add(effect);
  }

  function act(action) {
    game[action]();
    render();
    const state = game.view();
    if (action === 'flip' && !state.complete) animate(card, 'flipping');
    if (state.outcome) {
      const bust = state.outcome.reason === 'bust';
      animate(byId('notice'), bust ? 'busting' : 'banking');
      animate(bust ? byId('map') : byId('saved'), bust ? 'busting' : 'banking');
      primary.focus({ preventScroll: true });
    }
  }

  primary.addEventListener('click', () => {
    const state = game.view();
    if (state.complete) {
      game = createGame();
      render();
    } else if (state.outcome) {
      game.next();
      render();
    } else act('flip');
  });
  card.addEventListener('click', () => act('flip'));
  byId('bank').addEventListener('click', () => act('bank'));
  byId('help').addEventListener('click', () => guide.showModal());
  window.addEventListener('boopland:languagechange', render);
  render();
})();
