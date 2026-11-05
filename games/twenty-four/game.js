(() => {
  'use strict';
  const engine = window.TwentyFour;
  const i18n = window.BooplandI18n;
  const t = (key, values) => i18n.t(`twentyFour.${key}`, values);
  const byId = id => document.getElementById(id);
  const cardContainer = byId('cards');
  const dialog = byId('dialog');
  let numbers = [];
  let cards = [];
  let history = [];
  let selected = [];
  let solved = 0;
  let credited = false;
  let statusKey = 'ready';
  let statusValues = {};
  let dialogKind = '';
  let hint = null;

  function setStatus(key, values = {}) {
    statusKey = key;
    statusValues = values;
  }

  function renderCards() {
    // Reuse buttons while selecting so keyboard focus stays on the chosen card.
    const current = new Map([...cardContainer.children].map(button => [Number(button.dataset.card), button]));
    for (const button of current.values()) if (!cards.some(card => card.id === Number(button.dataset.card))) button.remove();
    cards.forEach((card, index) => {
      let button = current.get(card.id);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'number-card';
        button.dataset.card = card.id;
        const order = document.createElement('span');
        order.className = 'card-order';
        order.setAttribute('aria-hidden', 'true');
        const value = document.createElement('span');
        value.className = 'card-value';
        value.setAttribute('aria-hidden', 'true');
        button.append(order, value);
        button.addEventListener('click', () => selectCard(card.id));
        cardContainer.append(button);
      }
      const order = selected.indexOf(card.id);
      const value = engine.format(card.value);
      button.setAttribute('aria-pressed', String(order !== -1));
      button.setAttribute('aria-label', t(order === -1 ? 'card' : 'selectedCard', { index: index + 1, value, order: order + 1 }));
      button.disabled = cards.length === 1;
      button.children[0].textContent = order === -1 ? '·' : String(order + 1).padStart(2, '0');
      button.children[1].textContent = value;
      button.children[1].classList.toggle('long', value.length > 3);
    });
  }

  function render() {
    renderCards();
    const chosen = selected.map(id => cards.find(card => card.id === id));
    byId('selection').textContent = chosen.length === 2
      ? t('selected', { first: engine.operand(chosen[0].value), second: engine.operand(chosen[1].value) })
      : chosen.length === 1 ? t('pickSecond', { value: engine.format(chosen[0].value) }) : t('pickTwo');
    if (cards.length === 1) byId('selection').textContent = `${engine.format(cards[0].value)} ${engine.isTwentyFour(cards[0].value) ? '= 24 ✓' : '≠ 24'}`;
    byId('swap').disabled = chosen.length !== 2;
    document.querySelectorAll('[data-operator]').forEach(button => { button.disabled = chosen.length !== 2; });
    byId('undo').disabled = history.length === 0;
    byId('reset').disabled = history.length === 0 && selected.length === 0;
    byId('original').textContent = t('original', { numbers: numbers.join(' · ') });
    byId('solved').textContent = t('solved', { count: solved });
    byId('history').replaceChildren(...Array.from({ length: 3 }, (_, index) => {
      const item = document.createElement('li');
      item.textContent = history[index]?.step.text || '· · ·';
      if (!history[index]) { item.className = 'empty'; item.setAttribute('aria-hidden', 'true'); }
      return item;
    }));
    byId('status').textContent = t(statusKey, statusValues);
    byId('status').className = `status ${statusKey === 'win' ? 'success' : ['zero', 'missed', 'noPath'].includes(statusKey) ? 'notice' : ''}`;
    if (dialog.open) renderDialog();
  }

  function selectCard(id) {
    if (cards.length === 1) return;
    if (selected.includes(id)) selected = selected.filter(value => value !== id);
    else selected = selected.length === 2 ? [id] : [...selected, id];
    setStatus(selected.length === 2 ? 'chooseOperator' : history.length ? 'continue' : 'ready');
    render();
  }

  function operate(operator) {
    if (selected.length !== 2) return;
    const next = engine.combine(cards, selected[0], selected[1], operator);
    if (!next) { setStatus('zero'); render(); return; }
    history.push({ cards, step: next.step });
    cards = next.cards;
    selected = [];
    if (cards.length === 1) {
      if (engine.isTwentyFour(cards[0].value)) {
        if (!credited) { solved++; credited = true; }
        setStatus('win');
      } else setStatus('missed', { value: engine.format(cards[0].value) });
    } else setStatus('continue');
    render();
    if (cards.length === 1) byId(statusKey === 'win' ? 'next' : 'undo').focus({ preventScroll: true });
    else cardContainer.querySelector(`[data-card="${next.result.id}"]`).focus({ preventScroll: true });
  }

  function restart() {
    cards = engine.makeCards(numbers);
    history = [];
    selected = [];
    setStatus('ready');
    render();
  }

  function newPuzzle() {
    numbers = engine.newPuzzle(numbers);
    credited = false;
    restart();
  }

  function renderDialog() {
    const content = byId('dialog-content');
    content.replaceChildren();
    const paragraph = (key, values, className) => {
      const node = document.createElement('p');
      node.textContent = t(key, values);
      if (className) node.className = className;
      content.append(node);
    };
    byId('dialog-title').textContent = t(dialogKind === 'rules' ? 'rules' : dialogKind === 'answer' ? 'answer' : 'hintTitle');
    if (dialogKind === 'rules') ['rule1', 'rule2', 'rule3'].forEach(key => paragraph(key));
    if (dialogKind === 'answer') {
      paragraph('answerIntro');
      const list = document.createElement('ol');
      list.className = 'solution';
      engine.solve(engine.makeCards(numbers)).forEach(step => {
        const item = document.createElement('li');
        item.textContent = step.text;
        list.append(item);
      });
      content.append(list);
      paragraph('answerNote', {}, 'solution-note');
    }
    if (dialogKind === 'hint') {
      if (hint === null) paragraph('noPath');
      else if (!hint.length) paragraph('solvedHint');
      else paragraph('hintStep', { step: hint[0].text });
    }
  }

  function showDialog(kind) {
    dialogKind = kind;
    if (kind === 'hint') hint = engine.solve(cards);
    renderDialog();
    dialog.showModal();
  }

  document.querySelectorAll('[data-operator]').forEach(button => button.addEventListener('click', () => operate(button.dataset.operator)));
  byId('swap').addEventListener('click', () => { selected.reverse(); render(); });
  byId('undo').addEventListener('click', () => {
    if (!history.length) return;
    cards = history.pop().cards;
    selected = [];
    setStatus(history.length ? 'continue' : 'ready');
    render();
    cardContainer.querySelector('button').focus({ preventScroll: true });
  });
  byId('reset').addEventListener('click', restart);
  byId('next').addEventListener('click', newPuzzle);
  byId('help').addEventListener('click', () => showDialog('rules'));
  byId('hint').addEventListener('click', () => showDialog('hint'));
  byId('answer').addEventListener('click', () => showDialog('answer'));
  byId('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
  window.addEventListener('boopland:languagechange', render);
  document.addEventListener('keydown', event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('select, input, textarea, [contenteditable]')) return;
    const operator = ({ '+': '+', '-': '-', '−': '-', '*': '*', 'x': '*', 'X': '*', '/': '/', '÷': '/' })[event.key];
    if (operator && selected.length === 2) { event.preventDefault(); operate(operator); }
  });
  newPuzzle();
})();
