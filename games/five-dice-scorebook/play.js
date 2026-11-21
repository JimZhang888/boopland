(() => {
  'use strict';
  const { Book, lines, points } = FiveDiceScorebook;
  const t = (key, values) => BooplandI18n.t('fiveDice.' + key, values);
  const get = id => document.getElementById(id);
  const recordKey = 'boopland-five-dice-scorebook-best';
  const faceLines = { fours: 4, fives: 5, sixes: 6 };
  const idleDice = [4, 2, 6, 3, 5];
  const pips = [[], [[50,47]], [[30,27],[70,66]], [[30,27],[50,47],[70,66]],
    [[30,27],[70,27],[30,66],[70,66]], [[30,27],[70,27],[50,47],[30,66],[70,66]],
    [[30,27],[70,27],[30,47],[70,47],[30,66],[70,66]]];
  const shapeMarks = {
    short: '<path d="M2 18h4v-4h5v-4h5V6h5M2 21h19"/>',
    long: '<path d="M1 19h4v-4h4v-4h4V7h4V3h5M2 22h20"/>',
    house: '<path d="m2 11 10-8 10 8M5 9v11l14-.3V9M10 20v-7h4v7"/>',
    five: '<path d="m12 2 3 6.2 7 1.1-5.1 5 .9 7-5.9-3.2-6.3 3.1 1.3-7-5-5 7-1.1z"/>',
    chance: '<path d="M10.5 13C1 9 6 2 10 5c1-5 8-4 6.1 2.6 6.5-3.3 9.3 3.7 3.1 6.4 4.9 4.1-.6 9.7-5.3 4.1-3.8 5.3-9.3 1.2-6.5-2.8M13 12c-1.2 4.2-4 7.4-9 10"/>'
  };
  let book = new Book();
  let lastEntry = null;
  let dialogMode = null;
  let newRecord = false;
  let best = readBest();

  function readBest() {
    try {
      const value = localStorage.getItem(recordKey);
      return value !== null && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
    } catch { return null; }
  }
  function storeTotal() {
    const stored = readBest();
    if (stored !== null) best = Math.max(best ?? 0, stored);
    newRecord = best === null || book.total > best;
    if (!newRecord) return;
    best = book.total;
    try { localStorage.setItem(recordKey, String(best)); } catch { /* The current tab retains its best. */ }
  }
  const scoreRule = line => faceLines[line] ? t('faceRule', { face: faceLines[line] }) : t(line + 'Rule');
  const svg = (body, cls, viewBox) => '<svg class="' + cls + '" viewBox="' + viewBox + '" focusable="false" aria-hidden="true">' + body + '</svg>';
  function dieArt(n) {
    const top = '<path d="M15 9Q7 9 6.4 19l.8 56q1 10 11.4 11l59.6-1.4q11-.4 13-10.7l1-54Q92 9 81 8.8z" fill="#fbf6e5" stroke="#4d594c" stroke-width="2.2"/>';
    const edge = '<path d="m6.5 33 .4 44Q7 89 17.8 92l57.3.4q12 0 16.4-11.6l1-56L86 70l-7 9-61.5 2z" fill="#c5bea5" stroke="#525d4f" stroke-width="2.2"/>';
    const graphite = '<path d="M12 22q-.2-6 5.4-7.9M24 13.8l44.5-.7M15.8 78.7q3.3 3.1 9.4 2.4m24 6.2 20.4-.7M82 86l3-3m-10.5 5.6 2.4-2" fill="none" stroke="#a5a28b" stroke-width="1.25" stroke-linecap="round"/>';
    const color = n === 1 || n === 4 ? '#a66952' : '#465848';
    const spots = pips[n].map(([x,y], i) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (n === 1 ? 9 : 6.4) + '" ry="' + (n === 1 ? 9.4 : 6.8) + '" transform="rotate(' + (i % 2 ? 8 : -7) + ' ' + x + ' ' + y + ')"/>').join('');
    return svg(edge + top + graphite + '<g fill="' + color + '">' + spots + '</g>', 'die-face', '0 0 100 100');
  }
  function lineIcon(line) {
    if (!faceLines[line]) return svg(shapeMarks[line], 'icon line-illustration', '0 0 24 24');
    const dots = pips[faceLines[line]].map(([x,y]) => '<circle cx="' + x + '" cy="' + y + '" r="7.2"/>').join('');
    return svg('<path d="m3 3 17-.6q1.7 0 1.5 1.8l-.3 15.7q0 1.4-1.6 1.4l-16 .2q-1.4 0-1.4-1.5l-.4-15.4Q1.7 3 3 3z"/><g fill="currentColor" stroke="none" transform="scale(.24)">' + dots + '</g>', 'icon line-illustration', '0 0 24 24');
  }
  function makeControls() {
    for (let i = 0; i < 5; i++) {
      const die = document.createElement('button');
      die.className = 'die';
      die.type = 'button';
      die.innerHTML = '<span class="die-picture"></span><span class="keep-label" hidden></span>';
      die.addEventListener('click', () => { if (book.toggle(i)) render(); });
      get('dice').append(die);
    }
    for (const line of lines) {
      const row = document.createElement('button');
      row.type = 'button';
      row.dataset.line = line;
      row.className = 'line';
      row.innerHTML = lineIcon(line) + '<span class="line-copy"><span class="line-name"></span><span class="line-rule"></span></span><span class="value"><svg class="icon" hidden aria-hidden="true"><use href="#i-check"/></svg><span></span></span>';
      row.addEventListener('click', () => {
        if (!book.rolls || book.entries.has(line)) return;
        showDialog(line);
      });
      get('lines').append(row);
    }
  }
  function renderDice() {
    const dice = book.rolls ? book.dice : idleDice;
    Array.from(get('dice').children).forEach((die, i) => {
      if (die.dataset.face !== String(dice[i])) {
        die.dataset.face = dice[i];
        die.querySelector('.die-picture').innerHTML = dieArt(dice[i]);
      }
      die.disabled = !book.rolls || book.rolls >= 3 || book.done;
      die.setAttribute('aria-pressed', String(book.held[i]));
      die.setAttribute('aria-label', t('die', { i: i + 1, n: dice[i] }));
      const label = die.querySelector('.keep-label');
      label.hidden = !book.held[i];
      label.textContent = '✓ ' + t('keep');
    });
  }
  function renderLines() {
    const preview = book.rolls ? points(book.dice) : null;
    for (const row of get('lines').children) {
      const line = row.dataset.line;
      const locked = book.entries.has(line);
      const n = locked ? book.entries.get(line) : preview?.[line];
      row.disabled = locked || !preview;
      row.classList.toggle('locked', locked);
      row.classList.toggle('available', !row.disabled);
      row.classList.toggle('zero', !row.disabled && n === 0);
      row.querySelector('.line-name').textContent = t(line);
      row.querySelector('.line-rule').textContent = scoreRule(line);
      const status = locked ? t('locked',{n}) : preview ? t('preview',{n}) : t('pending');
      row.setAttribute('aria-label', [t(line),scoreRule(line),status].join(' · '));
      row.querySelector('.value .icon').toggleAttribute('hidden', !locked);
      row.querySelector('.value span').textContent = n ?? '–';
    }
  }
  function renderDialog() {
    if (!dialogMode) return;
    const help = dialogMode === 'help';
    get('help-body').hidden = !help;
    get('score-body').hidden = help;
    get('dialog-title').textContent = t(help ? 'helpTitle' : dialogMode);
    if (help) return;
    const n = points(book.dice)[dialogMode];
    get('rule').textContent = scoreRule(dialogMode);
    get('score-body').querySelector('.modal-dice').innerHTML = book.dice.map(dieArt).join('');
    get('write').textContent = t('write', {n});
    get('zero').hidden = n === 0;
  }
  function showDialog(mode) {
    dialogMode = mode;
    renderDialog();
    get('dialog').showModal();
    (mode === 'help' ? get('got-it') : get('write')).focus();
  }
  function render() {
    get('round').textContent = String(Math.min(lines.length, book.entries.size + 1)).padStart(2, '0');
    get('total').textContent = book.total;
    get('best').textContent = best ?? '—';
    Array.from(get('ticks').children).forEach((tick, i) => tick.classList.toggle('used', i < book.rolls));
    get('ticks').setAttribute('aria-label', t('rolls') + ' ' + book.rolls + ' / 3');
    get('dice').hidden = book.done;
    get('result').hidden = !book.done;
    get('hint').hidden = book.done;
    document.querySelector('.roll-meter').hidden = book.done;
    let hint;
    if (book.rolls === 3) hint = t('chooseHint');
    else if (book.held.every(Boolean)) hint = t('allHint');
    else if (book.rolls) hint = t('turnHint');
    else if (lastEntry) hint = t('nextHint', { name: t(lastEntry), n: book.entries.get(lastEntry) });
    else hint = t('startHint');
    get('hint').textContent = hint;
    const action = book.done ? 'again' : !book.rolls ? 'roll' : book.rolls < 3 ? 'reroll' : 'spent';
    get('roll').querySelector('span').textContent = t(action);
    get('roll').disabled = !book.done && !book.canRoll;
    if (book.done) {
      get('result-heading').textContent = t(newRecord ? 'record' : 'finished');
      get('final-score').textContent = book.total;
    }
    renderDice();
    renderLines();
    renderDialog();
  }
  function write(zero) {
    if (!dialogMode || dialogMode === 'help' || !book.write(dialogMode, zero)) return;
    lastEntry = dialogMode;
    dialogMode = null;
    get('dialog').close();
    if (book.done) storeTotal();
    render();
    get('roll').focus({ preventScroll: true });
  }
  get('roll').addEventListener('click', () => {
    if (book.done) {
      book = new Book();
      lastEntry = null;
      newRecord = false;
      render();
      return;
    }
    if (!book.roll()) return;
    render();
    for (const [i, die] of Array.from(get('dice').children).entries()) {
      die.classList.remove('was-rolled');
      if (!book.held[i]) {
        void die.offsetWidth;
        die.classList.add('was-rolled');
      }
    }
    if (book.rolls === 3) get('lines').querySelector('button:enabled')?.focus({ preventScroll: true });
  });
  get('help').addEventListener('click', () => showDialog('help'));
  get('dismiss').addEventListener('click', () => get('dialog').close());
  get('got-it').addEventListener('click', () => get('dialog').close());
  get('dialog').addEventListener('close', () => { if (!get('dialog').open) dialogMode = null; });
  get('write').addEventListener('click', () => write(false));
  get('zero').addEventListener('click', () => write(true));
  window.addEventListener('boopland:languagechange', render);
  window.addEventListener('storage', event => {
    if (event.key !== recordKey && event.key !== null) return;
    best = readBest();
    render();
  });
  makeControls();
  render();
})();
