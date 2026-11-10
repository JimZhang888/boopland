(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('beat.' + key, values);
  const { TRACKS, Round } = PaperBeat;
  const canvas = $('canvas'), ctx = canvas.getContext('2d');
  const pads = [$('pad-left'), $('pad-right')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'boopland-paper-beat-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* Storage is optional. */ }
  let best = Object.fromEntries(TRACKS.map(track => [track.id, Math.max(0, Number(saved?.best?.[track.id]) || 0)]));
  let sound = saved?.sound !== false;
  let selected = TRACKS.findIndex(track => track.id === saved?.track);
  if (selected < 0) selected = 0;
  let mode = 'ready', round = null, newBest = false;
  let clockStart = 0, resumeAt = 0, nextStep = 0, raf = 0;
  let width = 0, height = 0, feedback = null, milestone = null, lastPhase = -1, lastBeat = -1;
  let particles = [], rings = [], flashes = [0, 0], activeInputs = [new Set(), new Set()];
  const now = () => performance.now() / 1000;
  const elapsed = () => mode === 'playing' ? now() - clockStart : round?.time || 0;
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify({ best, sound, track: TRACKS[selected].id })); } catch { /* Keep playing without storage. */ } };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
  const setText = (id, value) => { const node = $(id), text = String(value); if (node.textContent !== text) node.textContent = text; };
  const button = (key, className, action) => { const node = el('button', className, t(key)); node.addEventListener('click', action); return node; };

  class AudioDesk {
    constructor() { this.context = null; this.voices = new Set(); }
    async ready() {
      try {
        if (!this.context) {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) return false;
          this.context = new Audio();
          this.master = this.context.createGain();
          this.master.gain.value = sound ? 0.5 : 0;
          this.master.connect(this.context.destination);
          this.noise = this.context.createBuffer(1, this.context.sampleRate * 0.15, this.context.sampleRate);
          const data = this.noise.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          this.context.addEventListener('statechange', () => { if (this.context.state !== 'running' && (mode === 'playing' || mode === 'countdown')) pause(); });
        }
        if (this.context.state !== 'running') await this.context.resume();
        return this.context.state === 'running';
      } catch { return false; }
    }
    mute() { if (this.master) this.master.gain.setTargetAtTime(sound ? 0.5 : 0, this.context.currentTime, 0.015); }
    stop() { for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } } this.voices.clear(); }
    voice(source, gain, time, duration) {
      source.connect(gain); gain.connect(this.master);
      this.voices.add(source);
      source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
      source.start(time); source.stop(time + duration);
    }
    tone(frequency, when, length = 0.2, volume = 0.2, type = 'sine', slide = 0) {
      if (!sound || !this.context || this.context.state !== 'running') return;
      const time = Math.max(this.context.currentTime, when);
      const source = this.context.createOscillator(), gain = this.context.createGain();
      source.type = type; source.frequency.setValueAtTime(frequency, time);
      if (slide) source.frequency.exponentialRampToValueAtTime(slide, time + length);
      gain.gain.setValueAtTime(0.0001, time); gain.gain.exponentialRampToValueAtTime(volume, time + 0.008); gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      this.voice(source, gain, time, length + 0.02);
    }
    clap(when, volume = 0.1) {
      if (!sound || !this.context || this.context.state !== 'running') return;
      const time = Math.max(this.context.currentTime, when), source = this.context.createBufferSource(), gain = this.context.createGain();
      source.buffer = this.noise;
      gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);
      this.voice(source, gain, time, 0.09);
    }
    hit(lane) {
      if (!this.context) return;
      if (lane === 0) this.tone(190, this.context.currentTime, 0.1, 0.28, 'sine', 70);
      else { this.clap(this.context.currentTime, 0.13); this.tone(860, this.context.currentTime, 0.07, 0.06, 'triangle'); }
    }
    beat(step, when, track) {
      if (!this.context) return;
      if (step < 0) { if (step % 2 === 0) this.tone(720, when, 0.06, 0.13, 'triangle'); return; }
      const b = step / 2, beat = 60 / track.bpm;
      const chords = [0, 5, 9, 7], chord = chords[Math.floor(b / 8) % 4];
      const frequency = semitones => track.root * 2 ** (semitones / 12);
      if (step % 2 === 0) {
        this.tone(b % 4 === 0 ? 160 : 600, when, b % 4 === 0 ? 0.17 : 0.045, b % 4 === 0 ? 0.2 : 0.045, 'sine', b % 4 === 0 ? 55 : 0);
        const melody = [0, 4, 7, 12, 7, 4, 9, 7, 4, 0, 7, 4, 12, 9, 7, 4];
        this.tone(frequency(melody[Math.floor(b) % melody.length] + (selected === 2 ? 0 : 12)), when, beat * 0.68, 0.07, 'triangle');
      } else if (b >= 48) this.tone(1300, when, 0.035, 0.018, 'triangle');
      if (step % 8 === 0) {
        this.tone(frequency(chord - 24), when, beat * 2.5, 0.16);
        [chord, chord + 7, chord + 12].forEach(n => this.tone(frequency(n), when, beat * 3.5, 0.032));
      }
      if (step % 4 === 2) this.clap(when, 0.035);
    }
  }
  const audio = new AudioDesk();

  function renderTracks() {
    $('tracks').replaceChildren(...TRACKS.map((track, index) => {
      const node = el('button', 'track'); node.disabled = !['ready', 'results'].includes(mode);
      node.setAttribute('aria-pressed', String(index === selected));
      const text = el('span'); text.append(el('strong', '', t(track.id)), el('small', '', `${t('mood' + index)} · ${track.bpm} BPM`));
      node.append(el('span', 'track-number', '0' + (index + 1)), text, el('span', '', index === selected ? '♪' : '·'));
      node.addEventListener('click', () => { selected = index; reset(); save(); });
      return node;
    }));
    $('track-title').textContent = t(TRACKS[selected].id);
    $('tempo').textContent = `${TRACKS[selected].bpm} BPM · ${Math.round(96 * 60 / TRACKS[selected].bpm)}″`;
    $('best-score').textContent = best[TRACKS[selected].id] ? best[TRACKS[selected].id].toLocaleString() : '—';
  }
  function updateHud() {
    setText('score', String(round?.score || 0).padStart(5, '0'));
    const combo = String(round?.combo || 0);
    if ($('combo').firstChild?.nodeValue !== combo) $('combo').replaceChildren(document.createTextNode(combo), el('span', '', '×'));
    setText('multiplier', '×' + Math.min(4, 1 + Math.floor((round?.combo || 0) / 10)));
    const seconds = Math.ceil(Math.max(0, (round?.duration || 96 * 60 / TRACKS[selected].bpm) - Math.max(0, round?.time || 0)));
    setText('remaining', `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    $('song-progress').style.width = (round ? Math.max(0, Math.min(100, round.time / round.duration * 100)) : 0) + '%';
    setText('phase', t('phase' + Math.max(0, lastPhase)));
  }
  function renderSound() {
    const label = t(sound ? 'soundOn' : 'soundOff');
    $('sound').setAttribute('aria-label', label); $('sound').title = label; $('sound').setAttribute('aria-pressed', String(sound));
    $('sound-path').setAttribute('d', sound ? 'M16 8q5 4 0 8m3-11q8 7 0 14' : 'm16 9 5 6m0-6-5 6');
  }
  function renderOverlay() {
    $('overlay').dataset.mode = mode;
    $('overlay').hidden = ['playing', 'countdown'].includes(mode);
    $('pause').disabled = !['playing', 'countdown'].includes(mode);
    const card = $('overlay-card'); card.replaceChildren();
    if ($('overlay').hidden) return;
    const heading = el('h2', '', t(mode === 'results' ? 'resultTitle' : mode === 'paused' ? 'paused' : 'introTitle')); heading.id = 'overlay-title';
    const actions = el('div', 'overlay-actions');
    if (mode === 'results') {
      const grade = round.fullCombo ? 'S' : round.accuracy >= 90 ? 'A' : round.accuracy >= 75 ? 'B' : round.accuracy >= 50 ? 'C' : 'D';
      card.append(el('div', 'result-grade', grade), heading);
      if (round.fullCombo || newBest) card.append(el('div', 'eyebrow', t(round.fullCombo ? 'fullCombo' : 'newBest')));
      const stats = el('div', 'result-grid');
      [['score', round.score.toLocaleString()], ['accuracy', round.accuracy + '%'], ['maxCombo', round.maxCombo + '×']].forEach(([key, value]) => {
        const cell = el('div'); cell.append(el('strong', '', value), el('span', '', t(key))); stats.append(cell);
      });
      card.append(stats, el('p', 'result-detail', t('resultDetails', { p: round.perfect, g: round.good, m: round.misses, s: round.strays })));
      actions.append(button('restart', 'primary', start), button('chooseAgain', 'secondary', reset));
    } else {
      const mark = el('div', 'intro-mark', mode === 'paused' ? '𝄽' : '♫'); mark.setAttribute('aria-hidden', 'true');
      card.append(mark, el('div', 'eyebrow', 'PAPER BEAT / ' + String(selected + 1).padStart(2, '0')), heading, el('p', '', t(mode === 'paused' ? 'pausedBody' : 'intro')));
      if (mode === 'paused') actions.append(button('resume', 'primary', resume), button('restart', 'secondary', start), button('chooseAgain', 'secondary', reset));
      else { const begin = button('begin', 'primary', start); begin.disabled = mode === 'starting'; actions.append(begin); }
    }
    card.append(actions);
    if (mode !== 'results') card.append(el('p', 'overlay-tip', t(mode === 'paused' ? 'resumeTip' : 'introTip')));
  }
  function clearInputs() { activeInputs.forEach(set => set.clear()); pads.forEach(p => p.classList.remove('pressed')); }
  function reset() {
    audio.stop(); mode = 'ready'; round = null; clearInputs(); feedback = null; milestone = null; lastPhase = -1; lastBeat = -1;
    particles = []; rings = []; flashes = [0, 0]; $('countdown').hidden = true;
    renderTracks(); renderOverlay(); updateHud(); renderFeedback(); draw();
  }
  async function start() {
    if (mode === 'starting') return;
    audio.stop(); mode = 'starting'; renderTracks(); renderOverlay();
    const available = await audio.ready();
    round = new Round(TRACKS[selected]); newBest = false; clearInputs(); particles = []; rings = []; flashes = [0, 0]; feedback = null; milestone = null; lastPhase = -1; lastBeat = -1;
    clockStart = now() + 4 * round.beat; nextStep = -8; mode = 'playing';
    if (!available && sound) milestone = { key: 'noAudio', until: now() + 6 };
    renderTracks(); renderOverlay(); updateHud(); wake();
    if (document.hidden || $('help-dialog').open) pause();
  }
  function pause() {
    if (!['playing', 'countdown'].includes(mode)) return;
    if (mode === 'playing') { round.update(elapsed()); processEvents(); }
    mode = 'paused'; audio.stop(); clearInputs(); round.prepareResume();
    $('countdown').hidden = true; renderOverlay(); updateHud(); draw();
  }
  async function resume() {
    if (mode !== 'paused') return;
    mode = 'starting'; renderOverlay();
    await audio.ready();
    clearInputs(); round.prepareResume(); resumeAt = now() + 3 * round.beat; mode = 'countdown';
    if (audio.context) for (let i = 0; i < 3; i++) audio.tone(720, audio.context.currentTime + i * round.beat, 0.06, 0.13, 'triangle');
    renderTracks(); renderOverlay(); wake();
    if (document.hidden || $('help-dialog').open) pause();
  }
  function end() {
    mode = 'results'; audio.stop(); clearInputs(); $('countdown').hidden = true;
    newBest = round.score > best[TRACKS[selected].id];
    if (newBest) best[TRACKS[selected].id] = round.score;
    save(); renderTracks(); renderOverlay(); updateHud();
  }
  function press(lane, source) {
    if (!['playing', 'countdown'].includes(mode)) return;
    const wasHeld = activeInputs[lane].size > 0; activeInputs[lane].add(source); pads[lane].classList.add('pressed');
    if (wasHeld) return;
    flashes[lane] = now(); audio.hit(lane);
    if (mode === 'playing') { round.press(lane, elapsed()); processEvents(); updateHud(); }
    else if (round.notes.some(n => n.lane === lane && n.state === 'holding')) round.held[lane] = true;
    wake();
  }
  function release(lane, source) {
    if (!activeInputs[lane].delete(source) || activeInputs[lane].size) return;
    pads[lane].classList.remove('pressed');
    if (mode === 'playing') { round.release(lane, elapsed()); processEvents(); updateHud(); }
    else if (mode === 'countdown') round.held[lane] = false;
  }
  function processEvents() {
    for (const event of round.drain()) {
      feedback = { key: event.type, until: now() + (event.type === 'hold' ? 0.9 : 0.62) };
      if (event.type === 'perfect' || event.type === 'good' || event.type === 'hold') {
        rings.push({ lane: event.lane, at: now() });
        if (!reduced.matches) for (let i = 0; i < 8; i++) particles.push({ lane: event.lane, at: now(), angle: Math.PI * 2 * i / 8, speed: 24 + Math.random() * 35 });
        if (event.combo > 0 && event.combo % 10 === 0) {
          milestone = { key: 'milestone', values: { n: event.combo }, until: now() + 2 };
          if (audio.context) [0, 4, 7].forEach((n, i) => audio.tone(523.25 * 2 ** (n / 12), audio.context.currentTime + i * 0.055, 0.25, 0.065, 'triangle'));
        }
      }
    }
  }
  function renderFeedback() {
    const time = now();
    setText('judgement', feedback && feedback.until > time ? t(feedback.key) : '');
    $('judgement').classList.toggle('show', !!feedback && feedback.until > time);
    $('judgement').dataset.kind = feedback?.key || '';
    const message = milestone && milestone.until > time ? t(milestone.key, milestone.values) : '';
    if ($('milestone').textContent !== message) $('milestone').textContent = message;
  }
  function schedule(time) {
    while (nextStep * round.beat / 2 < time + 0.12 && nextStep < 192) {
      const eventTime = nextStep * round.beat / 2;
      if (eventTime >= time - 0.06 && audio.context) audio.beat(nextStep, audio.context.currentTime + Math.max(0, eventTime - time), TRACKS[selected]);
      nextStep++;
    }
  }
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    if (document.hidden) return;
    if (mode === 'countdown') {
      const remaining = resumeAt - now(); $('countdown').hidden = false; $('countdown').textContent = Math.max(1, Math.ceil(remaining / round.beat));
      if (remaining <= 0) { clockStart = now() - round.time; nextStep = Math.ceil(round.time / (round.beat / 2)); mode = 'playing'; }
    }
    if (mode === 'playing') {
      const time = elapsed(); round.update(time); schedule(time); processEvents();
      $('countdown').hidden = time >= 0; if (time < 0) $('countdown').textContent = Math.ceil(-time / round.beat);
      const phase = Math.max(0, Math.min(3, Math.floor(time / (24 * round.beat))));
      if (phase !== lastPhase) { lastPhase = phase; if (time > 0) milestone = { key: 'phase' + phase, until: now() + 2.2 }; }
      const beatIndex = ((Math.floor(time / round.beat) % 4) + 4) % 4;
      if (beatIndex !== lastBeat) { lastBeat = beatIndex; document.querySelectorAll('.beat-dots i').forEach((dot, i) => dot.classList.toggle('active', i === beatIndex)); }
      updateHud();
      if (time >= round.duration) end();
    }
    renderFeedback(); draw();
    if (['playing', 'countdown'].includes(mode) || particles.length || rings.length || feedback?.until > now()) wake();
  }
  function resize() {
    const rect = $('stage').getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function line(x1, y1, x2, y2, color, lineWidth = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function ellipse(x, y, rx, ry, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.14, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 1, y - 0.5, rx + 1.4, ry + 0.4, -0.1, 0, Math.PI * 2); ctx.strokeStyle = stroke + '55'; ctx.lineWidth = 0.6; ctx.stroke();
  }
  function draw() {
    if (!width || !height) return;
    const time = now(), hitY = height * 0.78, xs = [width * 0.29, width * 0.71], radius = Math.max(10, Math.min(18, width * 0.037, height * 0.09));
    const lookahead = 2.3, speed = Math.max(35, (hitY - 25) / lookahead);
    ctx.clearRect(0, 0, width, height); ctx.lineCap = 'round';
    ctx.fillStyle = '#dce5d81a'; ctx.fillRect(width * 0.1, 0, width * 0.38, height);
    ctx.fillStyle = '#dde7e922'; ctx.fillRect(width * 0.52, 0, width * 0.38, height);
    ctx.setLineDash([4, 7]); line(width / 2, 0, width / 2, height, '#ccd2c1'); ctx.setLineDash([]);
    line(width * 0.1, hitY + 1, width * 0.9, hitY - 1, '#7f8c74', 1.7);
    line(width * 0.1 + 3, hitY + 4, width * 0.9 - 2, hitY + 2, '#a0ab9255');
    for (let lane = 0; lane < 2; lane++) {
      const flash = Math.max(0, 1 - (time - flashes[lane]) / 0.18);
      ellipse(xs[lane], hitY, radius + 6, radius + 5, activeInputs[lane].size ? (lane ? '#bfd4d9' : '#c5d8b9') : '#fffef7', lane ? '#8aa1a8' : '#92a180');
      if (flash > 0) { ctx.globalAlpha = flash * 0.3; ellipse(xs[lane], hitY, radius + 12, radius + 11, lane ? '#8aa1a8' : '#92a180', lane ? '#8aa1a8' : '#92a180'); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#79846e'; ctx.font = `11px ${getComputedStyle(document.body).fontFamily}`; ctx.textAlign = 'center'; ctx.fillText(lane ? 'J / →' : 'F / ←', xs[lane], Math.min(height - 8, hitY + radius + 25));
    }
    const notes = round ? round.notes : [{ lane: 0, time: 0.7, end: 0.7, state: 'pending' }, { lane: 1, time: 1.5, end: 2.2, hold: true, state: 'pending' }];
    const songTime = round?.time || 0;
    for (const note of notes) {
      if (note.state === 'hit' || note.state === 'miss') continue;
      let y = hitY - (note.time - songTime) * speed;
      const tailY = hitY - (note.end - songTime) * speed;
      if (tailY > height + 30 || y < -30) continue;
      const x = xs[note.lane], stroke = note.lane ? '#718d96' : '#708960', fill = note.lane ? '#d0e1e5' : '#d5e2c9';
      if (note.state === 'holding') y = hitY;
      if (note.hold) {
        ctx.fillStyle = note.state === 'holding' ? (note.lane ? '#b9d2d9' : '#bcd2aa') : fill;
        ctx.fillRect(x - radius * 0.57, tailY, radius * 1.14, Math.max(0, y - tailY));
        line(x - radius * 0.57, tailY, x - radius * 0.57, y, stroke);
        line(x + radius * 0.57, tailY, x + radius * 0.57, y, stroke);
        line(x - radius * 0.57, tailY, x + radius * 0.57, tailY, stroke, 2);
        ctx.globalAlpha = 0.35;
        for (let yy = Math.max(-10, tailY + 7); yy < y - 5; yy += 9) line(x - radius * 0.4, yy, x + radius * 0.4, yy - 5, stroke);
        ctx.globalAlpha = 1;
      }
      ellipse(x, y, radius, radius * 0.8, fill, stroke);
      line(x + radius * 0.82, y - 2, x + radius * 0.82, y - radius * 1.65, stroke, 1.6);
      if (!note.hold) { ctx.beginPath(); ctx.moveTo(x + radius * 0.82, y - radius * 1.65); ctx.quadraticCurveTo(x + radius * 1.8, y - radius * 1.3, x + radius * 1.3, y - radius * 0.75); ctx.stroke(); }
      if (note.state === 'holding') { ctx.beginPath(); ctx.arc(x, y, radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, (songTime - note.time) / (note.end - note.time))); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    }
    rings = rings.filter(ring => time - ring.at < 0.4);
    for (const ring of rings) {
      const age = (time - ring.at) / 0.4; ctx.globalAlpha = (1 - age) * 0.7;
      ctx.beginPath(); ctx.arc(xs[ring.lane], hitY, radius + (reduced.matches ? 7 : 22 * age), 0, Math.PI * 2); ctx.strokeStyle = ring.lane ? '#789aa3' : '#7c9869'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    particles = particles.filter(p => time - p.at < 0.55);
    for (const p of particles) {
      const age = (time - p.at) / 0.55; ctx.globalAlpha = 1 - age;
      const x = xs[p.lane] + Math.cos(p.angle) * p.speed * age, y = hitY + Math.sin(p.angle) * p.speed * age;
      line(x, y, x + Math.cos(p.angle) * 4, y + Math.sin(p.angle) * 4, p.lane ? '#849fa7' : '#8b9e75', 1.7);
    }
    ctx.globalAlpha = 1;
  }
  pads.forEach((pad, lane) => {
    pad.addEventListener('pointerdown', event => { if (event.button !== 0) return; event.preventDefault(); pad.setPointerCapture(event.pointerId); press(lane, 'p' + event.pointerId); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => pad.addEventListener(name, event => release(lane, 'p' + event.pointerId)));
    pad.addEventListener('contextmenu', event => event.preventDefault());
    pad.addEventListener('click', event => { if (event.detail === 0) { press(lane, 'accessible'); release(lane, 'accessible'); } });
  });
  const keyLane = { KeyA: 0, KeyF: 0, ArrowLeft: 0, KeyJ: 1, KeyL: 1, ArrowRight: 1 };
  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || $('help-dialog').open) return;
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); if (mode === 'paused') resume(); else pause(); return; }
    let lane = keyLane[event.code];
    if ((event.code === 'Space' || event.code === 'Enter') && pads.includes(event.target)) lane = pads.indexOf(event.target);
    if (lane !== undefined && ['playing', 'countdown'].includes(mode)) { event.preventDefault(); press(lane, event.code); }
  });
  document.addEventListener('keyup', event => { for (let lane = 0; lane < 2; lane++) release(lane, event.code); });
  $('pause').addEventListener('click', pause);
  $('sound').addEventListener('click', async () => { sound = !sound; await audio.ready(); audio.mute(); save(); renderSound(); });
  $('help').addEventListener('click', () => { pause(); $('help-dialog').showModal(); });
  $('close-help').addEventListener('click', () => $('help-dialog').close()); $('got-it').addEventListener('click', () => $('help-dialog').close());
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause); window.addEventListener('pagehide', pause);
  window.addEventListener('boopland:languagechange', () => { renderTracks(); renderSound(); renderOverlay(); updateHud(); renderFeedback(); draw(); });
  new ResizeObserver(resize).observe($('stage'));
  renderSound(); reset(); resize();
})();
