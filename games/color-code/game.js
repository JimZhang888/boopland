(() => {
  'use strict';
  const t = (key, values) => BooplandI18n.t('color-code.' + key, values);
  const $ = id => document.getElementById(id);
  const marks = [
    ['circle', '<circle cx="12" cy="12" r="6"/>'],
    ['triangle', '<path d="M12 4 20 18H4Z"/>'],
    ['leaf', '<path d="M5 18Q3 5 19 4q1 15-14 14Zm1-1 9-9"/>'],
    ['wave', '<path d="M2 10q4-7 10 0t10 0M2 16q4-7 10 0t10 0"/>'],
    ['star', '<path d="m12 3 2.7 5.8 6.4 1-4.6 4.5 1 6.4-5.5-3-5.5 3 1-6.4L3 9.8l6.4-1Z"/>'],
    ['bars', '<path d="M5 17 12 6m0 12 7-11" stroke-width="3.5"/>']
  ];
  const ATTEMPTS = 8;
  let answer, history, draft, selected, phase, note;
  const rows = [];

  function score(code, guess) {
    const unused = Array(6).fill(0);
    let exact = 0, near = 0;
    for (let i = 0; i < code.length; i++) {
      if (guess[i] === code[i]) exact++;
      else unused[code[i]]++;
    }
    for (let i = 0; i < code.length; i++) {
      const color = guess[i];
      if (color !== code[i] && unused[color] > 0) {
        unused[color]--;
        near++;
      }
    }
    return {exact, near};
  }

  function token(color) {
    const span = document.createElement('span');
    span.className = 'token c' + color;
    span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + marks[color][1] + '</svg>';
    return span;
  }

  function reset() {
    answer = Array.from({length: 4}, () => Math.floor(Math.random() * 6));
    history = [];
    draft = Array(4).fill(null);
    selected = 0;
    phase = 'playing';
    note = 'hint';
    render();
  }

  function stamp(color) {
    if (phase !== 'playing') return;
    draft[selected] = color;
    for (let offset = 1; offset < 4; offset++) {
      const next = (selected + offset) % 4;
      if (draft[next] === null) { selected = next; break; }
    }
    if (note === 'incomplete') note = history.length ? 'last' : 'hint';
    render();
  }

  function submit() {
    if (phase !== 'playing') { reset(); return; }
    if (draft.includes(null)) { note = 'incomplete'; selected = draft.indexOf(null); render(); return; }
    const result = score(answer, draft);
    history.push({guess: draft.slice(), ...result});
    if (result.exact === 4) phase = 'win';
    else if (history.length === ATTEMPTS) phase = 'lose';
    note = phase === 'playing' ? 'last' : phase;
    draft = Array(4).fill(null);
    selected = 0;
    render();
  }

  for (let index = 0; index < ATTEMPTS; index++) {
    const row = document.createElement('div');
    row.className = 'row';
    const number = document.createElement('span');
    number.className = 'num';
    number.textContent = String(index + 1).padStart(2,'0');
    row.append(number);
    const slots = Array.from({length:4}, (_, i) => {
      const button = document.createElement('button');
      button.className = 'slot';
      button.addEventListener('click', () => { selected = i; render(); });
      row.append(button);
      return button;
    });
    const feedback = document.createElement('span');
    feedback.className = 'feedback';
    row.append(feedback);
    $('rows').append(row);
    rows.push({row, slots, feedback});
  }
  const palette = marks.map((mark, i) => {
    const button = document.createElement('button');
    button.className = 'stamp';
    button.append(token(i));
    const number = document.createElement('small');
    number.textContent = i + 1;
    number.setAttribute('aria-hidden', 'true');
    button.append(number);
    button.addEventListener('click', () => stamp(i));
    $('palette').append(button);
    return button;
  });

  function render() {
    const playing = phase === 'playing';
    rows.forEach(({row, slots, feedback}, index) => {
      const entry = history[index];
      const active = playing && index === history.length;
      row.classList.toggle('current', active);
      slots.forEach((button, slot) => {
        const color = (entry ? entry.guess[slot] : active ? draft[slot] : null);
        const empty = color === null;
        if (button.dataset.color !== String(color)) {
          const ink = empty ? document.createElement('span') : token(color);
          if (empty) ink.className = 'hole';
          button.replaceChildren(ink);
          button.dataset.color = color;
        }
        button.disabled = !active;
        button.classList.toggle('selected', active && slot === selected);
        button.setAttribute('aria-label', t('place', {n:slot + 1}) + ' · ' + t(empty ? 'empty' : marks[color][0]));
      });
      feedback.textContent = entry ? '●' + entry.exact + '  ◇' + entry.near : '';
      if (entry) feedback.setAttribute('aria-label', t('exact') + ' ' + entry.exact + ', ' + t('near') + ' ' + entry.near);
      else feedback.removeAttribute('aria-label');
    });
    $('secret').replaceChildren(...answer.map(color => {
      if (!playing) {
        const ink = token(color);
        ink.setAttribute('role','img');
        ink.setAttribute('aria-label',t(marks[color][0]));
        return ink;
      }
      const lock = document.createElement('span');
      lock.className = 'lock';
      lock.textContent = '?';
      return lock;
    }));
    palette.forEach((button,i) => {
      button.disabled = !playing;
      button.setAttribute('aria-label', t(marks[i][0]));
      button.title = t(marks[i][0]) + ' (' + (i + 1) + ')';
    });
    const recent = history[history.length - 1];
    $('round').textContent = Math.min(history.length + (playing ? 1 : 0), ATTEMPTS) + ' / ' + ATTEMPTS;
    $('status').textContent = t(note, {n:history.length,a:recent?.exact,b:recent?.near});
    $('submit').textContent = t(playing ? 'submit' : 'again');
  }

  $('submit').addEventListener('click', submit);
  $('help').addEventListener('click', () => $('dialog').showModal());
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || $('dialog').open || phase !== 'playing') return;
    if (/^[1-6]$/.test(event.key)) {
      stamp(Number(event.key) - 1);
      rows[history.length].slots[selected].focus({preventScroll:true});
    }
    else if (['ArrowLeft','ArrowRight'].includes(event.key)) {
      selected = (selected + (event.key === 'ArrowLeft' ? 3 : 1)) % 4;
      render();
      rows[history.length].slots[selected].focus({preventScroll:true});
    } else if (event.key === 'Backspace') {
      if (draft[selected] === null && selected > 0) selected--;
      draft[selected] = null;
      render();
    } else if (event.key === 'Enter' && !event.repeat) {
      if (event.target.closest('a, #help, #submit')) return;
      submit();
    } else return;
    event.preventDefault();
  });
  window.addEventListener('boopland:languagechange', render);
  reset();
})();
