(() => {
  'use strict';
  const pitches = ['C', 'D', 'E', 'G', 'A'];
  const frequencies = [523.251, 587.330, 659.255, 783.991, 880.000];
  // Each column is a set of pitches. Zero is a full beat of silence.
  const note = (...names) => names.reduce((bits, name) => bits | (1 << pitches.indexOf(name)), 0);
  const C = note('C'), D = note('D'), E = note('E'), G = note('G'), A = note('A');
  const tunes = [
    { key: 'song1', icon: 'bird', bpm: 96, score: [C, E, G, E, D, 0, D, C], gaps: [7] },
    { key: 'song2', icon: 'rain', bpm: 108, score: [A, G, 0, E, G, E, D, 0], gaps: [1, 6] },
    { key: 'song3', icon: 'boat', bpm: 88, score: [D, E, G, 0, A, G, E, D], gaps: [2, 4, 7] },
    { key: 'song4', icon: 'stars', bpm: 84, score: [E, A, G, E, note('C', 'G'), 0, D, C], gaps: [1, 4, 6, 7] },
    { key: 'free', icon: 'pen', bpm: 96 }
  ];
  const FREE = tunes.length - 1;
  const beats = Array.from({ length: 8 }, (_, i) => i);
  const rows = [4, 3, 2, 1, 0];
  function freshRoll(index) {
    const tune = tunes[index];
    return beats.map(b => !tune.score || tune.gaps.includes(b) ? 0 : tune.score[b]);
  }
  function sameScore(a, b) { return a.every((value, i) => value === b[i]); }
  const storageKey = 'boopland-music-box-roll-v1';
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* File storage can be unavailable. */ }
  const rolls = tunes.map((_, i) => {
    const data = saved?.rolls?.[i];
    return Array.isArray(data) && data.length === 8 && data.every(n => Number.isInteger(n) && n >= 0 && n < 32)
      ? data.slice() : freshRoll(i);
  });
  const finished = tunes.slice(0, FREE).map((_, i) => saved?.finished?.[i] === true);
  let selected = Number.isInteger(saved?.selected) && tunes[saved.selected] ? saved.selected : 0;
  let muted = saved?.muted === true;
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ rolls, finished, selected, muted })); } catch { /* Still playable in memory. */ }
  }

  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('music-box-roll.' + key, values);
  const svgNS = 'http://www.w3.org/2000/svg';
  function changeIcon(element, icon) { element.querySelector('use').setAttribute('href', '#i-' + icon); }
  function icon(name, cssClass) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', cssClass);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svgNS, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.append(use);
    return svg;
  }
  const dom = (tag, className, value = '') => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = value;
    return node;
  };
  const songButtons = tunes.map((tune, i) => {
    const b = dom('button', 'song' + (i === FREE ? ' free' : ''));
    b.append(dom('span', 'number', i === FREE ? '' : String(i + 1).padStart(2, '0')), icon(tune.icon, 'song-icon'), dom('span', 'name'));
    b.addEventListener('click', () => choose(i));
    $('songs').append(b);
    return b;
  });
  const cells = [], refCells = [], beatLabels = [];
  $('matrix').append(dom('span', 'axis', '♩'));
  for (const b of beats) {
    const label = dom('span', 'beat' + (b === 4 ? ' bar' : ''), String(b + 1));
    $('matrix').append(label);
    beatLabels.push(label);
    cells.push([]);
    refCells.push([]);
  }
  let keyboardCell = [0, 0];
  for (const p of rows) {
    $('matrix').append(dom('span', 'pitch', pitches[p]));
    $('refScore').append(dom('span', 'ref-label', pitches[p]));
    for (const b of beats) {
      const ref = dom('span', 'ref-cell' + (b === 4 ? ' bar' : ''));
      const cell = dom('button', 'cell' + (b === 4 ? ' bar' : ''));
      cell.tabIndex = b === 0 && p === 0 ? 0 : -1;
      cell.addEventListener('focus', () => {
        cells[keyboardCell[0]][keyboardCell[1]].tabIndex = -1;
        keyboardCell = [b, p];
        cell.tabIndex = 0;
      });
      cell.addEventListener('keydown', e => {
        const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if (!direction) return;
        e.preventDefault();
        const next = cells[b + direction[0]]?.[p + direction[1]];
        if (next) next.focus();
      });
      cell.addEventListener('click', () => punch(b, p));
      $('matrix').append(cell);
      $('refScore').append(ref);
      cells[b][p] = cell;
      refCells[b][p] = ref;
    }
  }

  // In short landscape the score sits beside the strip, so give it its own beat numbers.
  $('refScore').append(dom('span', 'ref-beat'));
  for (const b of beats) $('refScore').append(dom('span', 'ref-beat', String(b + 1)));

  let context, voiceWave, soundUnavailable = false;
  const voices = new Set();
  function enableAudio() {
    if (muted) return;
    try {
      if (!context) {
        const Engine = window.AudioContext || window.webkitAudioContext;
        context = new Engine();
        // A bright plucked comb: a strong fundamental and a few quiet high partials.
        const harmonics = new Float32Array([0, 1, .31, .23, .04, .12, 0, .065, 0, .025]);
        voiceWave = context.createPeriodicWave(new Float32Array(harmonics.length), harmonics);
      }
      if (context.state !== 'running') context.resume().catch(() => { soundUnavailable = true; showStatus(); });
      soundUnavailable = false;
    } catch { soundUnavailable = true; }
  }
  function silence() {
    for (const { oscillator, gain } of voices) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* Already ended. */ }
      oscillator.disconnect();
      gain.disconnect();
    }
    voices.clear();
  }
  function chime(mask, duration) {
    silence();
    if (!mask || !context || muted || soundUnavailable || document.hidden) return;
    const now = context.currentTime;
    const sounding = rows.filter(p => mask & (1 << p));
    for (const p of sounding) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.setPeriodicWave(voiceWave);
      oscillator.frequency.value = frequencies[p];
      const peak = .24 / Math.sqrt(sounding.length);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + .006);
      gain.gain.exponentialRampToValueAtTime(peak * .32, now + .09);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      const voice = { oscillator, gain };
      voices.add(voice);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices.delete(voice); };
      oscillator.start(now);
      oscillator.stop(now + duration + .01);
    }
  }

  let source = null, beat = -1, timer = 0, generation = 0;
  let manualCursor = 0, drag = null, ignoreClick = false;
  let mismatch = -1, accepted = false, dialogMode = '';
  function stop() {
    generation++;
    clearTimeout(timer);
    source = null;
    beat = -1;
    silence();
    renderPlayback();
  }
  function soundBeat(i) {
    beat = i;
    const tune = tunes[selected];
    const mask = source === 'reference' ? tune.score[i] : rolls[selected][i];
    chime(mask, Math.min(.88, 60 / tune.bpm * .96));
    renderPlayback();
  }
  function togglePlay(kind) {
    const wasPlaying = source === kind;
    stop();
    if (wasPlaying || document.hidden) return;
    enableAudio();
    source = kind;
    manualCursor = 0;
    const id = generation;
    const interval = 60000 / tunes[selected].bpm;
    function step(i) {
      if (id !== generation) return;
      if (i === 8 || document.hidden) { stop(); return; }
      soundBeat(i);
      timer = setTimeout(() => step(i + 1), interval);
    }
    step(0);
  }
  function choose(i) {
    abandonGesture();
    stop();
    selected = i;
    manualCursor = 0;
    mismatch = -1;
    accepted = i !== FREE && finished[i] && sameScore(rolls[i], tunes[i].score);
    save();
    render();
  }
  function punch(b, p) {
    abandonGesture();
    stop();
    const bit = 1 << p;
    rolls[selected][b] ^= bit;
    accepted = false;
    mismatch = -1;
    manualCursor = 0;
    if (rolls[selected][b] & bit) { enableAudio(); chime(bit, .43); }
    save();
    render();
  }
  function check() {
    abandonGesture();
    stop();
    if (selected === FREE) { openDialog('reset'); return; }
    if (accepted) { choose(selected + 1); return; }
    mismatch = rolls[selected].findIndex((mask, i) => mask !== tunes[selected].score[i]);
    if (mismatch === -1) {
      finished[selected] = true;
      accepted = true;
      save();
    }
    render();
  }
  function buttonContent(button, glyph, label) {
    changeIcon(button, glyph);
    button.querySelector('span').textContent = t(label);
  }
  function showStatus() {
    const el = $('status');
    const emptyDraft = selected === FREE && rolls[FREE].every(mask => mask === 0);
    let key = emptyDraft ? 'freeEdit' : 'edit', values = {}, tone = '';
    if (source) {
      key = source === 'manual' ? 'manual' : 'playing';
      values = { source: t(source === 'reference' ? 'reference' : 'roll'), n: beat + 1 };
    } else if (mismatch !== -1) { key = 'mismatch'; values = { n: mismatch + 1 }; tone = 'error'; }
    else if (accepted) { key = finished.every(Boolean) ? 'all' : 'success'; tone = 'ok'; }
    let status = t(key, values);
    if (soundUnavailable && !muted && source) status += ' ' + t('audioFallback');
    if (el.textContent !== status) el.textContent = status;
    el.dataset.tone = tone;
  }
  function renderPlayback() {
    $('instrument').classList.toggle('rolling', source === 'roll' || source === 'reference');
    $('instrument').style.setProperty('--revolution', (240 / tunes[selected].bpm) + 's');
    for (const b of beats) {
      const here = b === beat;
      beatLabels[b].classList.toggle('current', here);
      for (const p of rows) {
        cells[b][p].classList.toggle('current', here && source !== 'reference');
        refCells[b][p].classList.toggle('current', here && source === 'reference');
      }
    }
    buttonContent($('play'), source === 'roll' ? 'stop' : 'play', source === 'roll' ? 'stop' : 'play');
    buttonContent($('listen'), source === 'reference' ? 'stop' : 'play', source === 'reference' ? 'stop' : 'listen');
    $('instrument').setAttribute('aria-pressed', String(source === 'roll' || source === 'manual'));
    showStatus();
  }
  function render() {
    const tune = tunes[selected], free = selected === FREE;
    const count = finished.filter(Boolean).length;
    $('progress').textContent = count + ' / 4';
    $('order').textContent = free ? t('blank') : t('order', { n: String(selected + 1).padStart(2, '0') });
    $('songTitle').textContent = t(tune.key);
    $('brief').textContent = t(free ? 'freeBrief' : 'brief' + (selected + 1));
    $('bpm').textContent = tune.bpm;
    changeIcon(document.querySelector('.track-illustration'), tune.icon);
    $('reference').hidden = free;
    for (const [i, button] of songButtons.entries()) {
      const name = t(tunes[i].key);
      button.setAttribute('aria-current', String(selected === i));
      button.classList.toggle('done', !!finished[i]);
      button.querySelector('.name').textContent = name;
      button.setAttribute('aria-label', name + (finished[i] ? ' · ' + t('done') : ''));
      button.title = name;
    }
    const scoreText = [];
    for (const b of beats) {
      const sounding = [];
      for (const p of rows) {
        const set = !free && !!(tune.score[b] & (1 << p));
        refCells[b][p].classList.toggle('note', set);
        if (set) sounding.push(pitches[p]);
        cells[b][p].setAttribute('aria-pressed', String(!!(rolls[selected][b] & (1 << p))));
        cells[b][p].setAttribute('aria-label', t('cell', { n: b + 1, pitch: pitches[p] }));
      }
      scoreText.push(t('cell', { n: b + 1, pitch: sounding.join(' + ') || t('rest') }));
      beatLabels[b].classList.toggle('mismatch', mismatch === b);
    }
    $('refScore').setAttribute('aria-label', scoreText.join(' · '));
    const muteKey = muted ? 'unmute' : 'mute';
    $('sound').dataset.i18nLabel = $('sound').dataset.i18nTitle = 'music-box-roll.' + muteKey;
    $('sound').setAttribute('aria-label', t(muteKey));
    $('sound').title = t(muteKey);
    $('sound').setAttribute('aria-pressed', String(muted));
    changeIcon($('sound'), muted ? 'mute' : 'sound');
    buttonContent($('submit'), free ? 'reset' : accepted ? 'next' : 'check',
      free ? 'clear' : accepted ? (selected === FREE - 1 ? 'free' : 'next') : 'check');
    $('reset').hidden = free;
    $('submit').disabled = free && rolls[FREE].every(mask => mask === 0);
    renderPlayback();
    if ($('dialog').open) renderDialog();
  }

  // The axle is at (271,146) in the illustration's 400 by 250 viewBox.
  function axle() {
    const r = $('instrument').querySelector('img').getBoundingClientRect();
    const scale = Math.min(r.width / 400, r.height / 250);
    return { x: r.left + r.width / 2 + 71 * scale, y: r.top + r.height / 2 + 21 * scale };
  }
  function abandonGesture() {
    if (!drag) return;
    const id = drag.id;
    drag = null;
    ignoreClick = true;
    if ($('instrument').hasPointerCapture(id)) $('instrument').releasePointerCapture(id);
  }
  $('instrument').addEventListener('pointerdown', e => {
    if (drag || !e.isPrimary || e.button !== 0) return;
    ignoreClick = false;
    const center = axle();
    const angle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, center, angle, turn: 0, travel: 0, moved: false };
    $('instrument').setPointerCapture(e.pointerId);
    enableAudio();
  });
  $('instrument').addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.center.x, dy = e.clientY - drag.center.y;
    if (Math.hypot(dx, dy) < 3) return;
    const angle = Math.atan2(dy, dx);
    const delta = Math.atan2(Math.sin(angle - drag.angle), Math.cos(angle - drag.angle));
    drag.angle = angle;
    drag.travel += delta;
    drag.turn += delta;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) {
      drag.moved = true;
      stop();
    }
    if (!drag.moved) return;
    $('instrument').style.setProperty('--turn', drag.turn + 'rad');
    while (Math.abs(drag.travel) + .00001 >= Math.PI / 2) {
      drag.travel -= Math.sign(drag.travel) * Math.PI / 2;
      source = 'manual';
      soundBeat(manualCursor);
      manualCursor = (manualCursor + 1) % 8;
    }
  });
  $('instrument').addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    ignoreClick = drag.moved;
    drag = null;
    if (source === 'manual') timer = setTimeout(stop, 60 / tunes[selected].bpm * 1000);
  });
  function cancelGesture() {
    if (drag) { abandonGesture(); stop(); }
  }
  $('instrument').addEventListener('pointercancel', cancelGesture);
  $('instrument').addEventListener('lostpointercapture', cancelGesture);
  $('instrument').addEventListener('click', e => {
    if (!ignoreClick || e.detail === 0) togglePlay('roll');
    ignoreClick = false;
  });
  $('play').addEventListener('click', () => { abandonGesture(); togglePlay('roll'); });
  $('listen').addEventListener('click', () => { abandonGesture(); togglePlay('reference'); });
  $('sound').addEventListener('click', () => {
    muted = !muted;
    if (muted) silence(); else enableAudio();
    save();
    render();
  });
  $('submit').addEventListener('click', check);
  function renderDialog() {
    const help = dialogMode === 'help';
    const action = selected === FREE ? 'clear' : 'reset';
    $('dialogTitle').textContent = t(help ? 'help' : action);
    $('dialogContent').replaceChildren(...(help ? ['how1', 'how2', 'how3'] : [selected === FREE ? 'clearAsk' : 'restartAsk']).map(k => dom('p', '', t(k))));
    $('cancel').hidden = help;
    $('cancel').textContent = t('cancel');
    $('accept').textContent = t(help ? 'close' : action);
  }
  function openDialog(mode) {
    abandonGesture();
    stop();
    dialogMode = mode;
    renderDialog();
    $('dialog').returnValue = '';
    $('dialog').showModal();
  }
  $('dialog').addEventListener('close', () => {
    if (dialogMode === 'reset' && $('dialog').returnValue === 'accept') {
      rolls[selected] = freshRoll(selected);
      choose(selected);
    }
    dialogMode = '';
  });
  $('help').addEventListener('click', () => openDialog('help'));
  $('reset').addEventListener('click', () => openDialog('reset'));
  $('close').addEventListener('click', () => $('dialog').close('cancel'));
  function leave() { abandonGesture(); stop(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  window.addEventListener('pagehide', leave);
  window.addEventListener('blur', leave);
  window.addEventListener('boopland:languagechange', render);
  choose(selected);
})();
