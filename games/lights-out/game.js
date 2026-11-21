(() => {
  'use strict';
  const { press, count, solve, generate } = LightsOutPuzzle;
  const t = (key, values) => BooplandI18n.t('lightsOut.' + key, values);
  const byId = id => document.getElementById(id);
  const board = byId('board');
  const hint = byId('hint');
  const undo = byId('undo');
  const dialog = byId('help-dialog');
  const modes = [...document.querySelectorAll('[data-size]')];
  const cells = [];
  const history = [];
  let size = 3;
  let original = 0;
  let lamps = 0;
  let marked = -1;
  let cursor = 0;
  let notice = '';

  function start(nextSize) {
    original = generate(nextSize, nextSize === size ? original : 0);
    size = nextSize;
    if (cells.length !== size * size) {
      cells.length = 0;
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < size * size; i++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lamp';
        button.dataset.index = i;
        button.innerHTML = '<svg viewBox="0 0 60 60" aria-hidden="true"><use/></svg>';
        cells.push(button);
        fragment.append(button);
      }
      board.replaceChildren(fragment);
      board.style.setProperty('--size', size);
    }
    for (const button of modes) button.setAttribute('aria-pressed', Number(button.dataset.size) === size);
    restore('started');
  }

  function restore(reason) {
    lamps = original;
    history.length = 0;
    marked = -1;
    cursor = 0;
    notice = reason;
    render();
  }

  function coordinates(index) {
    return { row: Math.floor(index / size) + 1, col: index % size + 1 };
  }

  function render() {
    const won = lamps === 0;
    const lit = count(lamps);
    const moves = history.length;
    cells.forEach((button, index) => {
      const on = Boolean(lamps & (1 << index));
      button.classList.toggle('lit', on);
      button.classList.toggle('hinted', index === marked);
      button.querySelector('use').setAttribute('href', on ? '#star-lamp' : '#moon-lamp');
      button.setAttribute('aria-pressed', on);
      const name = t('cell', { ...coordinates(index), state: t(on ? 'on' : 'off') });
      button.setAttribute('aria-label', index === marked ? name + ' · ' + t('marked') : name);
      button.disabled = won;
      button.tabIndex = index === cursor && !won ? 0 : -1;
    });
    byId('lit').textContent = lit;
    byId('moves').textContent = moves;
    byId('total').textContent = size * size;
    undo.disabled = moves === 0;
    hint.disabled = won;
    byId('win').hidden = !won;
    byId('win-detail').textContent = won ? t('winDetail', { moves }) : '';
    const summary = t('progress', { lit, moves });
    const message = won ? t('win') + ' ' + t('winDetail', { moves }) :
      marked !== -1 ? t('hintAt', coordinates(marked)) :
      notice ? t(notice, { size }) + ' ' + summary : summary;
    byId('announcement').textContent = message;
  }

  function move(index) {
    if (lamps === 0) return;
    history.push(index);
    lamps = press(lamps, size, index);
    cursor = index;
    marked = -1;
    notice = '';
    render();
    if (lamps === 0) byId('next').focus({ preventScroll: true });
  }

  board.addEventListener('click', event => {
    const button = event.target.closest('.lamp');
    if (button) move(Number(button.dataset.index));
  });
  board.addEventListener('keydown', event => {
    const cell = event.target.closest('.lamp');
    if (!cell) return;
    const i = Number(cell.dataset.index);
    const { row, col } = coordinates(i);
    const targets = {
      ArrowLeft: col > 1 ? i - 1 : i, ArrowRight: col < size ? i + 1 : i,
      ArrowUp: row > 1 ? i - size : i, ArrowDown: row < size ? i + size : i
    };
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      cells[cursor].tabIndex = -1;
      cursor = targets[event.key];
      cells[cursor].tabIndex = 0;
      cells[cursor].focus({ preventScroll: true });
    } else if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
    }
  });
  hint.addEventListener('click', () => {
    if (lamps === 0) return;
    marked = solve(lamps, size)[0];
    cursor = marked;
    render();
    cells[marked].focus({ preventScroll: true });
  });
  undo.addEventListener('click', () => {
    if (!history.length) return;
    cursor = history.pop();
    lamps = press(lamps, size, cursor);
    marked = -1;
    notice = 'undone';
    render();
    if (undo.disabled) cells[cursor].focus({ preventScroll: true });
  });
  byId('reset').addEventListener('click', () => restore('restarted'));
  byId('new').addEventListener('click', () => start(size));
  byId('next').addEventListener('click', () => {
    start(size);
    cells[0].focus({ preventScroll: true });
  });
  modes.forEach(button => button.addEventListener('click', () => {
    const choice = Number(button.dataset.size);
    if (choice !== size) start(choice);
  }));
  document.querySelector('.help-open').addEventListener('click', () => dialog.showModal());
  byId('close-help').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const { left, top, right, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.close();
  });
  window.addEventListener('boopland:languagechange', render);
  start(size);
})();
