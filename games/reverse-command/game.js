(() => {
  'use strict';
  const E = window.ReverseCommand;
  const i18n = window.BooplandI18n;
  const t = (key, values) => i18n.t(`reverse.${key}`, values);
  const $ = id => document.getElementById(id);
  const storageKey = 'boopland-reverse-command';
  const palette = { red: '#c58076', blue: '#7897b4', yellow: '#d4b86e', green: '#7a9d82' };
  const turns = { right: 0, down: 90, left: 180, up: 270 };
  const arrow = id => `<svg viewBox="0 0 140 100" aria-hidden="true"><g transform="rotate(${turns[id] || 0} 70 50)"><path d="m17 40 73-1-2-23 38 33-36 35 1-23-75 2Z" fill="#dce5d8"/><path class="pencil-echo" d="m22 43 72-1-2-18 27 26-26 26 2-18-75 1Z"/><path d="m29 45 10-2m-9 10 18-2" opacity=".4"/></g></svg>`;
  const introArt = '<svg class="intro-art" viewBox="0 0 140 100" aria-hidden="true"><path class="fill" d="m15 30 28-22v14l76 2v23l-77-3v15Z"/><path d="m15 30 28-22v14l76 2v23l-77-3v15Z"/><path d="m125 76-28-23v15l-77-1 1 21 76 2v14Z" fill="#e9dfcc"/><path class="echo" d="m22 30 17-16v12l75 1v15l-77-3v12Zm98 47L101 61v11l-76-1v13l77 2v10Z"/></svg>';
  let mode = 'direction';
  let game = E.newGame(mode);
  let phase = 'ready';
  let resumePhase = 'playing';
  let countdown = 3000;
  let shownCount = 0;
  let transition = 0;
  let lastTick = 0;
  let animation = 0;
  let sound = false;
  let records = {};
  let audioContext;
  let resultReason = '';
  let newBest = false;
  let feedback = null;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object') {
      sound = saved.sound === true;
      for (const key of ['direction', 'color', 'mixed']) {
        records[key] = Number.isFinite(saved.records?.[key]) ? Math.max(0, saved.records[key]) : 0;
      }
    }
  } catch { /* Scores are optional when storage is unavailable. */ }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ records, sound })); } catch { /* Play remains available. */ }
  }

  function tone(correct = true) {
    if (!sound) return;
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.frequency.setValueAtTime(correct ? 620 : 190, now);
      oscillator.frequency.exponentialRampToValueAtTime(correct ? 850 : 100, now + .12);
      gain.gain.setValueAtTime(.045, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .17);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(now + .18);
    } catch { /* Unsupported audio must not interrupt a round. */ }
  }

  function renderTools() {
    const pauseLabel = t(phase === 'paused' ? 'resume' : 'pause');
    $('pause').disabled = ['ready', 'result'].includes(phase);
    $('pause').setAttribute('aria-label', pauseLabel);
    $('pause').title = pauseLabel;
    $('pause-icon').setAttribute('d', phase === 'paused' ? 'm8 5 12 7-12 7Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound').title = t(sound ? 'soundOff' : 'soundOn');
    $('sound-wave').setAttribute('d', sound ? 'M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm16 9 5 6m0-6-5 6');
  }

  function renderStats() {
    $('score').textContent = game.score;
    $('time').textContent = Math.ceil(game.remaining / 1000);
    $('time').classList.toggle('low', game.remaining <= 10000);
    $('combo').textContent = `×${game.streak}`;
    $('lives').textContent = [0, 1, 2].map(n => n < game.lives ? '♥' : '♡').join(' ');
    $('lives').setAttribute('aria-label', t('livesLabel', { count: game.lives }));
    $('round').textContent = phase === 'ready' ? '' : t('round', { count: game.attempts + 1 });
    $('level').textContent = phase === 'ready' ? '' : t('level', { level: game.level });
  }

  function renderFeedback() {
    $('feedback').textContent = feedback ? t(feedback.key, { points: feedback.points, value: t(feedback.expected) }) : '';
    $('feedback').className = `feedback ${feedback ? feedback.key === 'positive' ? 'success' : 'error' : ''}`;
  }

  function renderAnswers() {
    const type = game.current?.type || (mode === 'color' ? 'color' : 'direction');
    const items = type === 'direction' ? E.DIRECTIONS : E.COLORS;
    $('answers').innerHTML = items.map(item => `<button class="answer" data-answer="${item.id}" aria-label="${t('choose', { value: t(item.id) })}" ${phase !== 'playing' || transition ? 'disabled' : ''}>${item.color ? `<span class="swatch" style="background:${palette[item.id]}" aria-hidden="true"></span>` : arrow(item.id)}<span class="answer-text"><span class="answer-name">${t(item.id)}</span><kbd>${item.key}</kbd></span></button>`).join('');
    $('keyboard-hint').textContent = t(type === 'direction' ? 'keyboardDirections' : 'keyboardColors');
  }

  function renderPrompt() {
    $('prompt').hidden = !game.current;
    if (!game.current) return;
    const q = game.current;
    $('command').textContent = t(q.id);
    $('prompt-art').innerHTML = q.type === 'direction' ? arrow(q.id) : `<svg viewBox="0 0 140 100" aria-hidden="true"><path d="M37 12 108 16 104 88 31 83Z" fill="${palette[q.id]}" stroke-width="1.3"/><path d="m41 17 62 3-4 63-63-5Z" stroke-width=".6" opacity=".45"/><path d="m41 67 15-3m-13 10 20-5" opacity=".45"/></svg>`;
  }

  function renderOverlay() {
    $('overlay').hidden = phase === 'playing';
    $('question-clock').hidden = phase !== 'playing';
    $('overlay').dataset.phase = phase;
    let html = '';
    if (phase === 'ready') {
      html = `${introArt}<h2 id="overlay-title">${t('name')}</h2><p class="overlay-description">${t('intro')}</p><div class="mode-selector" role="group" aria-label="${t('changeMode')}">${['direction', 'color', 'mixed'].map(key => `<button class="mode" data-mode="${key}" aria-pressed="${key === mode}">${t(key)}</button>`).join('')}</div><button class="primary" data-action="start">${t('start')}</button><p class="best-line">${t('best', { score: records[mode] || 0 })}</p>`;
    } else if (phase === 'countdown') {
      shownCount = Math.max(1, Math.ceil(countdown / 1000));
      html = `<h2 id="overlay-title">${t('countdownTitle')}</h2><div class="countdown">${shownCount}</div><p class="overlay-description">${t(mode)}</p>`;
    } else if (phase === 'paused') {
      html = `<div class="pause-mark" aria-hidden="true">Ⅱ</div><h2 id="overlay-title">${t('pausedTitle')}</h2><p class="overlay-description">${t('pausedCopy')}</p><div class="overlay-actions"><button class="primary" data-action="resume">${t('resume')}</button><button class="secondary" data-action="home">${t('changeMode')}</button></div>`;
    } else if (phase === 'result') {
      const accuracy = game.attempts ? Math.round(game.correct / game.attempts * 100) : 0;
      html = `${newBest ? `<span class="new-best">${t('newBest')}</span>` : ''}<h2 id="overlay-title" class="result-title">${t('resultTitle')}</h2><div class="result-score">${game.score}</div><p class="overlay-description">${t(resultReason === 'time' ? 'timeOver' : 'livesOver')}</p><div class="result-stats"><span><b>${game.correct}</b>${t('correct')}</span><span><b>${accuracy}%</b>${t('accuracy')}</span><span><b>${game.maxStreak}</b>${t('maxCombo')}</span></div><div class="overlay-actions"><button class="primary" data-action="start">${t('again')}</button><button class="secondary" data-action="home">${t('changeMode')}</button></div>`;
    }
    if (phase !== 'playing') $('overlay-card').innerHTML = html;
  }

  function render() {
    renderStats(); renderTools(); renderPrompt(); renderAnswers(); renderFeedback(); renderOverlay();
  }

  function stopLoop() { cancelAnimationFrame(animation); animation = 0; }
  function startLoop() { stopLoop(); lastTick = performance.now(); animation = requestAnimationFrame(frame); }
  function ready() {
    stopLoop(); phase = 'ready'; game = E.newGame(mode); transition = 0; feedback = null; render();
  }
  function start() {
    game = E.newGame(mode); phase = 'countdown'; countdown = 3000; transition = 0; feedback = null;
    render(); tone(); startLoop();
  }
  function beginQuestion() {
    transition = 0; feedback = null; E.nextQuestion(game);
    renderStats(); renderPrompt(); renderAnswers(); renderFeedback();
    $('question-bar').style.transform = 'scaleX(1)';
  }
  function finish(reason) {
    stopLoop(); phase = 'result'; resultReason = reason;
    newBest = game.score > (records[mode] || 0);
    if (newBest) { records[mode] = game.score; save(); }
    render();
  }
  function submit(id) {
    if (phase !== 'playing' || transition) return;
    const result = E.answer(game, id);
    if (!result) return;
    feedback = { key: result.correct ? 'positive' : id === null ? 'timeout' : 'wrong', expected: result.expected, points: result.points };
    tone(result.correct);
    if (result.ended) { finish('lives'); return; }
    transition = result.correct ? 230 : 850;
    renderStats(); renderFeedback(); renderAnswers();
  }
  function pause() {
    if (!['playing', 'countdown'].includes(phase)) return;
    resumePhase = phase; phase = 'paused'; stopLoop();
    if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    render();
  }
  function resume() {
    if (phase !== 'paused') return;
    phase = resumePhase; render(); startLoop();
  }
  function frame(now) {
    const dt = Math.max(0, now - lastTick); lastTick = now;
    if (phase === 'countdown') {
      countdown -= dt;
      if (countdown <= 0) { phase = 'playing'; beginQuestion(); renderTools(); renderOverlay(); }
      else if (Math.ceil(countdown / 1000) !== shownCount) renderOverlay();
    } else if (phase === 'playing') {
      const expired = E.advanceClock(game, dt, !transition);
      $('time').textContent = Math.ceil(game.remaining / 1000);
      $('time').classList.toggle('low', game.remaining <= 10000);
      if (expired === 'time') finish('time');
      else if (transition) { transition = Math.max(0, transition - dt); if (!transition) beginQuestion(); }
      else {
        const ratio = game.questionRemaining / game.questionLimit;
        $('question-bar').style.transform = `scaleX(${ratio})`;
        $('question-bar').style.background = ratio < .25 ? '#bd8172' : '#9aac88';
        if (expired === 'question') submit(null);
      }
    }
    if (['playing', 'countdown'].includes(phase)) animation = requestAnimationFrame(frame);
  }

  $('overlay').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode && phase === 'ready') { mode = button.dataset.mode; ready(); }
    if (button.dataset.action === 'start') start();
    if (button.dataset.action === 'resume') resume();
    if (button.dataset.action === 'home') ready();
  });
  $('answers').addEventListener('click', event => {
    const button = event.target.closest('[data-answer]');
    if (button) submit(button.dataset.answer);
  });
  $('pause').addEventListener('click', () => phase === 'paused' ? resume() : pause());
  $('sound').addEventListener('click', () => { sound = !sound; save(); renderTools(); tone(); });
  $('help').addEventListener('click', () => { pause(); $('help-dialog').showModal(); });
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  $('got-it').addEventListener('click', () => $('help-dialog').close());
  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || $('help-dialog').open) return;
    const key = event.key.toLowerCase();
    if (key === 'escape' || key === 'p') { if (phase === 'paused') resume(); else pause(); return; }
    if (phase !== 'playing') return;
    const directions = { arrowup: 'up', w: 'up', arrowleft: 'left', a: 'left', arrowdown: 'down', s: 'down', arrowright: 'right', d: 'right' };
    const colors = { 1: 'red', 2: 'blue', 3: 'yellow', 4: 'green' };
    const id = (game.current.type === 'direction' ? directions : colors)[key];
    if (id) { event.preventDefault(); submit(id); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  window.addEventListener('boopland:languagechange', render);
  ready();
})();
