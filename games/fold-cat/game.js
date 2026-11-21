(() => {
  'use strict';
  const puzzle = FoldCatPuzzle, api = BooplandI18n;
  const $ = id => document.getElementById(id);
  const tr = (key, args) => api.t('foldCat.' + key, args);
  const letter = id => String.fromCharCode(65 + id);
  const pages = puzzle.pages, dialog = $('dialog');
  const map = createFoldCatMap(toggle);
  const progressKey = 'boopland-fold-cat-folds-v2';
  const walkingTime = 440, foldingTime = 370;
  let best = [];
  try {
    const records = JSON.parse(localStorage.getItem(progressKey));
    if (Array.isArray(records)) {
      best = records.slice(0, pages.length).map(n => Number.isSafeInteger(n) && n >= 0 ? n : null);
    } else {
      // Earlier pages counted paw taps along with folds. Keep their unlocks.
      const old = JSON.parse(localStorage.getItem('boopland-fold-cat-pages-v1'));
      if (Array.isArray(old)) best = old.slice(0, pages.length).map(n => Number.isInteger(n) && n > 0 ? 0 : null);
    }
  } catch { /* The full game also works with storage blocked. */ }

  function lastOpen() {
    let n = 0;
    while (n < pages.length - 1 && best[n] != null) n++;
    return n;
  }

  let index, page, pos, heading, mask, count, phase, hint = null;
  let modal = '', timer, buttons = [];
  function controls() {
    return page.folds.map((fold, i) => {
      const closed = Boolean(mask & (1 << i));
      const occupied = puzzle.onStrip(fold, pos);
      const verb = tr(closed ? 'unfold' : 'fold');
      return { closed, occupied, verb, label: verb + ' ' + letter(i), enabled: phase === 'idle' && !occupied };
    });
  }

  function paint(fresh = false) {
    const c = controls();
    const model = { pos, mask, heading, phase, hint, controls: c };
    if (fresh) map.start(page, index, model);
    else map.render(model);
    $('pages').textContent = tr('page', { n: index + 1, total: pages.length });
    $('name').textContent = tr('p' + (index + 1));
    buttons.forEach(({ button, label }, i) => {
      button.disabled = !c[i].enabled;
      button.setAttribute('aria-pressed', String(c[i].closed));
      button.setAttribute('aria-label', c[i].label);
      button.title = c[i].occupied ? tr('safe') : c[i].label;
      button.classList.toggle('hinted', i === hint);
      label.textContent = c[i].verb;
    });
    $('hint').disabled = phase !== 'idle';
    let message;
    if (phase === 'won') message = tr('won');
    else if (phase === 'walking') message = tr('walking');
    else if (phase === 'folding') message = tr('folding');
    else if (hint !== null) message = tr('clue', { verb: c[hint].verb, id: letter(hint) });
    else message = tr(index === 0 && count === 0 ? 'first' : 'stuck');
    if ($('message').textContent !== message) $('message').textContent = message;
  }

  // A fold and a roof crossing each finish before the next decision. Menus and
  // hidden tabs stop the clock, and restarting discards any pending crossing.
  function schedule() {
    clearTimeout(timer);
    if (modal || document.hidden || phase === 'idle' || phase === 'won') return;
    timer = setTimeout(advance, phase === 'folding' ? foldingTime : walkingTime);
  }

  function advance() {
    if (pos === page.goal) {
      phase = 'won';
      best[index] = Math.min(best[index] || Infinity, count);
      try { localStorage.setItem(progressKey, JSON.stringify(best)); } catch { /* In-memory progress is sufficient. */ }
      paint();
      openDialog('win');
      return;
    }
    const next = puzzle.nextStep(page, pos, heading, mask);
    if (next) {
      pos = next.pos;
      heading = next.heading;
      phase = 'walking';
    } else {
      phase = 'idle';
    }
    paint();
    schedule();
  }

  function toggle(id) {
    if (modal || phase !== 'idle' || !page.folds[id] || puzzle.onStrip(page.folds[id], pos)) return;
    mask ^= 1 << id;
    count++;
    hint = null;
    phase = 'folding';
    paint();
    schedule();
  }

  function start(n) {
    clearTimeout(timer);
    index = n;
    page = pages[n];
    pos = page.start;
    heading = null;
    mask = count = 0;
    hint = null;
    phase = puzzle.nextStep(page, pos, heading, mask) ? 'walking' : 'idle';
    buttons = page.folds.map((fold, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fold tone-' + i;
      const mark = document.createElement('span'), label = document.createElement('span');
      mark.className = 'mark';
      mark.textContent = letter(i);
      button.append(mark, label);
      button.onclick = () => toggle(i);
      return { button, label };
    });
    $('folds').replaceChildren(...buttons.map(item => item.button));
    paint(true);
    schedule();
  }

  function closeDialog() {
    modal = '';
    dialog.close();
    schedule();
  }
  function drawDialog() {
    const body = $('modalBody'), actions = $('modalActions');
    body.replaceChildren();
    actions.replaceChildren();
    dialog.dataset.kind = modal;
    function paragraph(text) {
      const p = document.createElement('p');
      p.textContent = text;
      body.append(p);
    }
    function action(key, fn) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = tr(key);
      b.onclick = fn;
      actions.append(b);
    }
    if (modal === 'help') {
      $('modalTitle').textContent = tr('help');
      paragraph(tr('guide'));
      paragraph(tr('keys'));
      action('close', closeDialog);
    } else if (modal === 'pages') {
      $('modalTitle').textContent = tr('pages');
      pages.forEach((_, n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'page-pick';
        b.textContent = String(n + 1) + (best[n] != null ? ' ✓' : '');
        b.title = tr('p' + (n + 1));
        b.setAttribute('aria-label', tr('page', { n: n+1, total: pages.length }) + ' · ' + b.title);
        b.disabled = n > lastOpen();
        if (n === index) b.setAttribute('aria-current', 'page');
        b.onclick = () => { closeDialog(); start(n); };
        body.append(b);
      });
      action('close', closeDialog);
    } else {
      const final = index === pages.length - 1;
      $('modalTitle').textContent = tr(final ? 'final' : 'won');
      paragraph(tr('count', { n: count }));
      action(final ? 'album' : 'next', () => {
        if (final) openDialog('pages');
        else { closeDialog(); start(index + 1); }
      });
      action('again', () => { closeDialog(); start(index); });
    }
  }
  function openDialog(kind) {
    clearTimeout(timer);
    modal = kind;
    drawDialog();
    if (!dialog.open) dialog.showModal();
    else dialog.querySelector('button:not(:disabled)')?.focus();
  }
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    if (modal !== 'win') closeDialog();
  });
  $('help').onclick = () => openDialog('help');
  $('pages').onclick = () => openDialog('pages');
  $('reset').onclick = () => start(index);
  $('hint').onclick = () => {
    if (phase !== 'idle') return;
    hint = puzzle.hint(page, pos, heading, mask);
    paint();
  };
  window.addEventListener('keydown', e => {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || !/^[123]$/.test(e.key)) return;
    toggle(Number(e.key) - 1);
  });
  window.addEventListener('boopland:languagechange', () => { paint(); if (modal) drawDialog(); });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', schedule);
  start(lastOpen());
})();
