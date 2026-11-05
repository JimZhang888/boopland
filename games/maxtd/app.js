(function () {
  'use strict';
  const { Game, TYPES, RULES, COLS, ROWS, ENTRY, EXIT } = window.PaperTD;
  const Art = window.PaperArt;
  const i18n = window.BooplandI18n;
  const tr = (key, params) => i18n.t('maxtd.' + key, params);
  const locale = {
    get language() { return i18n.language; },
    direction: 'ltr',
    date: value => new Date(value).toLocaleDateString(i18n.language, { month: '2-digit', day: '2-digit' })
  };
  const unit = type => ({ ...TYPES[type], ...Object.fromEntries(['name', 'role', 'description'].map(key => [key, tr('unit.' + type + '.' + key)])) });
  const $ = id => document.getElementById(id);
  const canvas = $('battlefield'), ctx = canvas.getContext('2d');
  const W = 1040, H = 676, CELL = W / COLS;
  const attackTypes = ['rifle', 'sniper', 'rocket', 'disruptor'];
  const supportTypes = ['damage', 'speed', 'slow'];
  const shortcuts = ['wall', ...attackTypes, ...supportTypes];
  const STORAGE_KEY = 'boopland-maxtd-records-v1';
  let storageAvailable = true, records = [], best = 0;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    records = Array.isArray(stored.records) ? stored.records.filter(r => Number.isFinite(r.wave) && r.wave >= 0 && Number.isFinite(r.kills)).slice(0, 8) : [];
    best = Number.isFinite(stored.best) ? Math.max(0, stored.best) : 0;
  } catch { storageAvailable = false; }
  let game = new Game(), selectedType = null, selectedId = null, hover = null, hoverCheck = null, keyboardCell = null;
  let paused = false, speed = 1, showPath = true, pointerDown = false, lastDragCell = '', runRecorded = false;
  let lastFrame = performance.now(), lastUI = 0, lastHover = 0, uiSignature = '', noteSignature = '';
  let toastTimer, bannerTimer, soundEnabled = false, audioContext = null, lastShotSound = 0;
  let toastState = null, detailType = null, gameOverWasBest = false;
  let runId = makeRunId();
  const dialogs = [...document.querySelectorAll('dialog')];
  const pad = n => String(n).padStart(2, '0');
  const percent = n => `${Math.round(n * 100)}%`;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function makeRunId() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9); }

  document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', Art.icon(el.dataset.icon)));
  $('sound-btn').innerHTML = Art.icon('muted');
  function renderUnitCards() {
    const aria = t => escapeHTML(tr('unitAria', { unit: t.name, cost: t.cost, role: t.role }));
    $('attack-units').innerHTML = attackTypes.map(type => {
      const t = unit(type);
      return `<button class="unit-card" data-type="${type}" aria-label="${aria(t)}" aria-pressed="false"><span class="unit-shortcut">0${shortcuts.indexOf(type) + 1}</span>${Art.portrait(type)}<span class="unit-card-bottom"><span class="unit-name">${escapeHTML(t.name)}</span><span class="unit-cost">${t.cost} <span class="coin-mini">◉</span></span></span><span class="unit-role">${escapeHTML(t.role)}</span></button>`;
    }).join('');
    $('support-units').innerHTML = supportTypes.map(type => {
      const t = unit(type);
      return `<button class="support-card" data-type="${type}" aria-label="${aria(t)}" aria-pressed="false"><span class="unit-shortcut">0${shortcuts.indexOf(type) + 1}</span>${Art.portrait(type)}<span class="support-copy"><span class="unit-name">${escapeHTML(t.name)}</span><span class="unit-role">${escapeHTML(t.role)}</span></span><span class="unit-cost">${t.cost} <span class="coin-mini">◉</span></span></button>`;
    }).join('');
    $('wall-card').setAttribute('aria-label', tr('unitAria', { unit: unit('wall').name, cost: TYPES.wall.cost, role: unit('wall').role }));
  }
  document.querySelector('.wall-art').innerHTML = Art.portrait('wall');
  window.addEventListener('boopland:languagechange', applyLanguage);
  function applyLanguage() {
    document.documentElement.lang = locale.language;
    document.documentElement.dir = locale.direction;
    document.title = tr('pageTitle');
    document.querySelector('meta[name="description"]').content = tr('metaDescription');
    i18n.apply();
    renderUnitCards(); updateSoundButton(); renderRecords();
    if (detailType) renderUnitDetails(detailType);
    $('wave-banner-text').textContent = tr('waveNumber', { wave: pad(game.wave) });
    $('final-message').textContent = game.status === 'over' ? tr(gameOverWasBest ? 'newBest' : 'defeated', { wave: game.wave }) : tr('finalDefault');
    if (toastState) $('toast').textContent = tr(toastState.key, toastState.params);
    noteSignature = ''; uiSignature = '';
    updateUI(true); makeBackground();
  }

  function saveRecords() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ best, records })); } catch { storageAvailable = false; }
  }
  function recordRun(final = false) {
    if (!game.wave || (runRecorded && final)) return;
    best = Math.max(best, game.cleared);
    const existing = records.findIndex(r => r.id === runId);
    const entry = { id: runId, wave: game.cleared, kills: game.kills, reached: game.wave, date: new Date().toISOString(), final };
    if (existing >= 0) records[existing] = entry; else records.push(entry);
    records.sort((a, b) => b.wave - a.wave || b.kills - a.kills); records = records.slice(0, 8);
    if (final) runRecorded = true;
    saveRecords();
  }
  function toast(key, params = {}, error = false) {
    toastState = { key, params };
    const t = $('toast'); clearTimeout(toastTimer); t.textContent = tr(key, params); t.className = `toast show${error ? ' error' : ''}`;
    toastTimer = setTimeout(() => { t.classList.remove('show'); toastState = null; }, 2800);
  }
  function showFailure(result) { toast('error.' + (result.code || 'unknown'), result.params || {}, true); }
  function sound(kind) {
    if (!soundEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      if (kind === 'shot' && now - lastShotSound < .12) return;
      if (kind === 'shot') lastShotSound = now;
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      const presets = { build: [380, 620, .08, .035, 'sine'], sell: [430, 250, .08, .03, 'sine'], upgrade: [500, 1000, .15, .035, 'sine'], shot: [200, 95, .035, .012, 'triangle'], blast: [85, 30, .13, .035, 'triangle'], pulse: [430, 200, .13, .02, 'sine'], wave: [300, 510, .2, .045, 'triangle'], clear: [660, 1040, .3, .04, 'sine'], leak: [160, 75, .23, .04, 'triangle'], over: [230, 50, .7, .04, 'triangle'] };
      const [from, to, duration, volume, shape] = presets[kind] || presets.build;
      osc.type = shape; osc.frequency.setValueAtTime(from, now); osc.frequency.exponentialRampToValueAtTime(to, now + duration);
      gain.gain.setValueAtTime(.001, now); gain.gain.linearRampToValueAtTime(volume, now + .008); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now + duration + .01);
    } catch { soundEnabled = false; updateSoundButton(); }
  }
  function updateSoundButton() {
    $('sound-btn').innerHTML = Art.icon(soundEnabled ? 'sound' : 'muted');
    $('sound-btn').setAttribute('aria-label', tr(soundEnabled ? 'soundOff' : 'soundOn'));
    $('sound-btn').title = tr(soundEnabled ? 'soundOff' : 'soundOn');
  }
  $('sound-btn').addEventListener('click', () => { soundEnabled = !soundEnabled; updateSoundButton(); if (soundEnabled) sound('build'); });

  function openDialog(id) { $(id).showModal(); pointerDown = false; updateUI(true); }
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => btn.closest('dialog').close()));
  for (const dialog of dialogs) {
    dialog.addEventListener('click', e => { if (e.target === dialog && dialog.id !== 'gameover-dialog') { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => { lastFrame = performance.now(); updateUI(true); });
  }
  $('help-btn').addEventListener('click', () => openDialog('help-dialog'));
  $('records-btn').addEventListener('click', () => { renderRecords(); openDialog('records-dialog'); });
  $('new-game-btn').addEventListener('click', () => { $('records-dialog').close(); openDialog('restart-dialog'); });
  $('confirm-restart').addEventListener('click', restart);
  $('play-again-btn').addEventListener('click', restart);
  $('inspect-btn').addEventListener('click', () => $('gameover-dialog').close());
  function renderRecords() {
    $('record-best').textContent = pad(best);
    $('records-list').innerHTML = records.length ? records.map((r, i) => {
      let date = ''; try { date = locale.date(r.date); } catch {}
      return `<div class="record-row"><span class="record-rank">${pad(i + 1)}</span><span>${tr('recordKills', { count: r.kills })} <small>· ${escapeHTML(date)}${r.id === runId && !r.final ? ' · ' + tr('recordCurrent') : ''}</small></span><strong>${tr('recordWaves', { wave: r.wave })}</strong></div>`;
    }).join('') : `<p class="empty-records">${tr('noRecords')}</p>`;
    document.querySelector('.record-local').textContent = tr(storageAvailable ? 'recordsLocal' : 'recordsTemporary');
  }
  function restart() {
    recordRun(true); dialogs.forEach(d => d.close());
    game = new Game(); runId = makeRunId(); runRecorded = false;
    selectedType = null; selectedId = null; hoverCheck = null; paused = false; pointerDown = false; lastDragCell = '';
    clearTimeout(bannerTimer); $('wave-banner').hidden = true; noteSignature = ''; uiSignature = '';
    updateUI(true); toast('newRun');
  }
  function selectType(type) {
    if (game.status === 'over') { toast('gameFinished', {}, true); return; }
    selectedType = selectedType === type ? null : type; selectedId = null; noteSignature = ''; hoverCheck = null;
    updateUI(true);
  }
  document.querySelector('.roster').addEventListener('click', e => {
    const button = e.target.closest('[data-type]');
    if (button) selectType(button.dataset.type);
  });
  function clearSelection() { selectedType = null; selectedId = null; keyboardCell = null; hoverCheck = null; noteSignature = ''; updateUI(true); }
  function runWaveControl() {
    if (game.status === 'over') { restart(); return; }
    if (game.status === 'prep') {
      paused = false; game.startWave();
    } else paused = !paused;
    lastFrame = performance.now(); updateUI(true);
  }
  $('wave-btn').addEventListener('click', runWaveControl);
  $('resume-btn').addEventListener('click', () => { paused = false; lastFrame = performance.now(); updateUI(true); });
  document.querySelectorAll('.speed').forEach(btn => btn.addEventListener('click', () => {
    speed = Number(btn.dataset.speed);
    document.querySelectorAll('.speed').forEach(b => { b.classList.toggle('active', Number(b.dataset.speed) === speed); b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed)); });
  }));
  function togglePath() { showPath = !showPath; $('path-btn').classList.toggle('active', showPath); $('path-btn').setAttribute('aria-pressed', String(showPath)); }
  $('path-btn').addEventListener('click', togglePath);
  function upgradeSelected() {
    if (selectedId === null) return;
    const result = game.upgrade(selectedId);
    if (!result.ok) showFailure(result); else { toast('upgraded'); noteSignature = ''; }
    updateUI(true);
  }
  function sellSelected() {
    if (selectedId === null) return;
    const result = game.sell(selectedId);
    if (!result.ok) showFailure(result); else { toast('sold', { cost: result.refund }); selectedId = null; noteSignature = ''; }
    updateUI(true);
  }
  function describeStats(type, b) {
    const t = TYPES[type], s = game.stats(b || { type, level: 1 });
    if (type === 'wall') return tr('wallStats');
    if (t.support) {
      const cap = type === 'slow' ? tr('slowCap', { cap: percent(RULES.slowCap) }) : tr('globalCap', { cap: percent(type === 'damage' ? RULES.damageBonusCap : RULES.attackSpeedBonusCap) });
      return tr('supportStats', { stat: tr(t.support === 'damage' ? 'damage' : t.support === 'speed' ? 'attackSpeed' : 'slowEffect'), effect: percent(s.effect), cap });
    }
    return tr('attackStats', { damage: Math.round(s.damage * 10) / 10, range: s.range.toFixed(1), interval: s.interval.toFixed(2) }) + (type === 'disruptor' ? ' · ' + tr('slowStat', { slow: percent(s.slow) }) : '');
  }
  function updateNote() {
    const b = game.buildings.find(b => b.id === selectedId), type = b?.type || selectedType;
    const signature = [type, b?.id, b?.level, game.buffs.damage, game.buffs.speed, game.buffs.slow, game.status].join('|');
    if (noteSignature === signature) {
      const upgradeButton = $('note-upgrade');
      if (upgradeButton && b) upgradeButton.disabled = game.money < game.upgradeCost(b) || game.status === 'over';
      return;
    }
    noteSignature = signature;
    const note = $('field-note');
    note.hidden = false;
    if (!type) {
      note.className = 'field-note';
      const hint = document.createElement('p');
      hint.className = 'selection-hint';
      hint.textContent = tr('deployHint');
      note.replaceChildren(hint);
      return;
    }
    const t = unit(type);
    note.className = 'field-note has-unit';
    const canUpgrade = b && b.type !== 'wall' && b.level < 3, cost = b ? game.upgradeCost(b) : 0;
    const actions = b ? `${canUpgrade ? `<button class="upgrade-button" id="note-upgrade" ${game.money < cost || game.status === 'over' ? 'disabled' : ''}>${Art.icon('upgrade')}${tr('upgradeCost', { cost })}</button>` : ''}<button class="sell-button" id="note-sell" ${game.status === 'over' ? 'disabled' : ''}>${Art.icon('sell')}${tr('sellRefund', { cost: game.sellValue(b) })}</button>` : `<button id="note-info">${Art.icon('info')}${tr('details')}</button><button id="note-cancel">${tr('cancel')}</button>`;
    const subtitle = b ? (type === 'wall' ? tr('basic') : tr('level', { level: b.level }) + (b.level === 3 ? ' · ' + tr('maxLevel') : '')) : tr('deployCost', { cost: t.cost });
    note.innerHTML = `<span class="note-art">${Art.portrait(type)}</span><p><strong>${escapeHTML(t.name)} <small>${subtitle}</small></strong><span>${describeStats(type, b)}</span></p><div class="note-actions">${actions}</div>`;
    $('note-upgrade')?.addEventListener('click', upgradeSelected);
    $('note-sell')?.addEventListener('click', sellSelected);
    $('note-cancel')?.addEventListener('click', clearSelection);
    $('note-info')?.addEventListener('click', () => showUnitDetails(type));
  }
  function renderUnitDetails(type) {
    const t = unit(type), s = game.stats({ type, level: 1 });
    const stats = t.damage ? `<span>${tr('statDamage')}<strong>${t.damage}</strong></span><span>${tr('statInterval')}<strong>${tr('seconds', { value: t.interval })}</strong></span><span>${tr('statRange')}<strong>${tr('cells', { value: t.range })}</strong></span><span>${tr(t.radius ? 'statRadius' : 'statAttack')}<strong>${t.radius ? tr('cells', { value: t.radius }) : tr(type === 'sniper' ? 'pierce' : 'single')}</strong></span>` : `<span>${tr('statCost')}<strong>${t.cost} ◉</strong></span><span>${tr(t.support ? 'statGlobalBonus' : 'statRefund')}<strong>${t.support ? '+' + percent(s.effect) : '100%'}</strong></span>`;
    $('detail-content').innerHTML = `<span class="tiny-label">${tr('dossier', { number: pad(shortcuts.indexOf(type) + 1) })}</span><div class="unit-portrait">${Art.portrait(type)}</div><h2>${escapeHTML(t.name)}</h2><p class="detail-role">${escapeHTML(t.role)}</p><p class="detail-description">${escapeHTML(t.description)}</p><div class="detail-stats">${stats}</div><button id="detail-deploy" class="primary-button full-width">${escapeHTML(tr('deploy', { unit: t.name, cost: t.cost }))} ${Art.icon('arrow')}</button>`;
    $('detail-deploy').addEventListener('click', () => { selectedType = type; selectedId = null; $('detail-dialog').close(); updateUI(true); });
  }
  function showUnitDetails(type) {
    detailType = type;
    renderUnitDetails(type);
    openDialog('detail-dialog');
  }
  function updateUI(force = false) {
    const signature = [game.money, game.wave, game.cleared, game.lives, game.status, game.enemies.length, game.queue.length, paused, selectedType, selectedId, game.revision, best].join('|');
    if (!force && signature === uiSignature) return; uiSignature = signature;
    $('money-value').textContent = game.money; $('wave-value').textContent = pad(game.wave); $('lives-value').textContent = game.lives; $('best-value').textContent = pad(best);
    const status = $('status-pill');
    status.textContent = tr(game.status === 'over' ? 'ended' : game.status === 'prep' ? 'prep' : paused ? 'paused' : 'fighting');
    status.className = 'status-pill' + (game.status === 'wave' ? ' fighting' : game.status === 'over' ? ' ended' : '');
    $('pause-overlay').hidden = !paused || game.status !== 'wave';
    const waveBtn = $('wave-btn'), waveLabel = $('wave-button-label');
    waveLabel.textContent = tr(game.status === 'over' ? 'playAgain' : game.status === 'prep' ? 'startWave' : paused ? 'resume' : 'pauseBattle', { wave: game.wave + 1 });
    waveBtn.querySelector('span:first-child').innerHTML = Art.icon(game.status === 'wave' && !paused ? 'pause' : game.status === 'over' ? 'restart' : 'play');
    waveBtn.classList.toggle('paused', game.status === 'wave' && !paused);
    const info = game.waveInfo(game.status === 'wave' ? game.wave : game.wave + 1);
    $('wave-preview-label').textContent = tr(game.status === 'over' ? 'report' : game.status === 'wave' ? 'waveInProgress' : 'nextWave', { wave: pad(game.wave) });
    $('wave-preview').innerHTML = game.status === 'over' ? tr('reportSummary', { wave: game.cleared, kills: game.kills }) : game.status === 'wave' ? `<span class="enemy-marker"></span> ${tr('onField', { count: game.enemies.length })} <span class="preview-divider">/</span> ${tr('toSpawn', { count: game.queue.length })}` : `<span class="enemy-marker"></span> ${tr('smallCount', { count: info.small })}${info.big ? ' + ' + tr('bigCount', { count: info.big }) : ''} <span class="preview-divider">/</span> <bdi>HP ×${info.multiplier.toFixed(2)}</bdi>`;
    document.querySelector('.wave-progress').classList.toggle('visible', game.status === 'wave');
    $('wave-progress-fill').style.width = `${game.totalInWave ? (game.totalInWave - game.queue.length - game.enemies.length) / game.totalInWave * 100 : 0}%`;
    const b = game.buildings.find(b => b.id === selectedId);
    $('board-instruction').innerHTML = Art.icon('info') + escapeHTML(selectedType ? tr('buildingHint', { unit: unit(selectedType).name, action: tr(selectedType === 'wall' ? 'dragWalls' : 'clickPlace') }) : b ? tr('selectedHint', { unit: unit(b.type).name }) : tr('deployHint'));
    $('roster-hint').textContent = selectedType ? tr('rosterSelected', { unit: unit(selectedType).name }) : tr('rosterHint');
    document.querySelectorAll('[data-type]').forEach(button => {
      const active = button.dataset.type === selectedType;
      button.classList.toggle('selected', active); button.classList.toggle('unaffordable', game.money < TYPES[button.dataset.type].cost);
      button.setAttribute('aria-pressed', String(active));
    });
    for (const buff of ['damage', 'speed', 'slow']) {
      const el = $('buff-' + buff);
      el.querySelector('b').textContent = buff === 'slow' ? percent(game.stats({ type: 'disruptor', level: 1 }).slow) : '+' + percent(game.buffs[buff]);
      el.classList.toggle('active', game.buffs[buff] > 0);
    }
    updateNote();
  }

  function pointerCell(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS);
    return x >= 0 && x < COLS && y >= 0 && y < ROWS ? { x, y } : null;
  }
  function actOnCell(cell, dragging = false) {
    if (!cell || paused || dialogs.some(d => d.open)) return;
    if (game.status === 'over') { toast('gameFinished'); return; }
    const b = game.buildingAt(cell.x, cell.y);
    if (b) { if (!dragging) { selectedId = b.id; selectedType = null; noteSignature = ''; updateUI(true); } return; }
    if (selectedType) {
      const result = game.place(selectedType, cell.x, cell.y);
      if (!result.ok) { if (!dragging || result.code !== 'funds') showFailure(result); }
      else hoverCheck = null;
      updateUI(true);
    } else { selectedId = null; noteSignature = ''; updateUI(true); }
  }
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); canvas.focus({ preventScroll: true }); keyboardCell = null;
    hover = pointerCell(e); pointerDown = true; lastDragCell = hover ? `${hover.x},${hover.y}` : '';
    canvas.setPointerCapture(e.pointerId); actOnCell(hover);
  });
  canvas.addEventListener('pointermove', e => {
    hover = pointerCell(e); hoverCheck = null;
    if (pointerDown && selectedType === 'wall' && hover) { const k = `${hover.x},${hover.y}`; if (k !== lastDragCell) { lastDragCell = k; actOnCell(hover, true); } }
  });
  canvas.addEventListener('pointerup', e => { pointerDown = false; if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); if (e.pointerType === 'touch') { hover = null; hoverCheck = null; } });
  canvas.addEventListener('pointercancel', () => { pointerDown = false; hover = null; });
  canvas.addEventListener('pointerleave', () => { if (!pointerDown) { hover = null; hoverCheck = null; } });
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); clearSelection(); });
  document.addEventListener('keydown', e => {
    if (dialogs.some(d => d.open) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space' && !e.target.closest('button, a')) { e.preventDefault(); runWaveControl(); }
    else if (/^[1-8]$/.test(e.key)) { e.preventDefault(); selectType(shortcuts[Number(e.key) - 1]); }
    else if (e.key === 'Escape') clearSelection();
    else if (e.key.toLowerCase() === 'q') togglePath();
    else if (e.key.toLowerCase() === 'u') upgradeSelected();
    else if (e.key === 'Delete') sellSelected();
    else if (e.key.startsWith('Arrow') && document.activeElement === canvas) {
      e.preventDefault(); keyboardCell ||= { x: 4, y: 6 };
      if (e.key === 'ArrowLeft') keyboardCell.x = Math.max(0, keyboardCell.x - 1);
      if (e.key === 'ArrowRight') keyboardCell.x = Math.min(COLS - 1, keyboardCell.x + 1);
      if (e.key === 'ArrowUp') keyboardCell.y = Math.max(0, keyboardCell.y - 1);
      if (e.key === 'ArrowDown') keyboardCell.y = Math.min(ROWS - 1, keyboardCell.y + 1);
      hover = { ...keyboardCell }; hoverCheck = null;
    } else if (e.key === 'Enter' && document.activeElement === canvas) { e.preventDefault(); keyboardCell ||= { x: 4, y: 6 }; actOnCell(keyboardCell); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.status === 'wave') { paused = true; updateUI(true); } lastFrame = performance.now(); });
  window.addEventListener('pagehide', () => recordRun(false));

  const background = document.createElement('canvas'); background.width = W; background.height = H;
  const bg = background.getContext('2d');
  function random(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function makeBackground() {
    bg.fillStyle = '#eeecdc'; bg.fillRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const seed = y * COLS + x;
      bg.fillStyle = ['#edeada', '#efeede', '#e8e9d6', '#f0eedf', '#e9ead8'][Math.floor(random(seed) * 5)];
      bg.globalAlpha = .65; bg.fillRect(x * CELL, y * CELL, CELL, CELL);
      if (random(seed + 19) > .52) {
        bg.strokeStyle = '#bec7a3'; bg.lineWidth = 1.1; bg.globalAlpha = .38;
        const px = (x + .2 + random(seed + 7) * .55) * CELL, py = (y + .25 + random(seed + 8) * .5) * CELL;
        bg.beginPath(); bg.moveTo(px - 4, py); bg.lineTo(px - 6, py - 5); bg.moveTo(px - 3, py + 1); bg.lineTo(px - 1, py - 6); bg.moveTo(px + 1, py + 1); bg.lineTo(px + 4, py - 3); bg.stroke();
      }
    }
    bg.globalAlpha = 1; bg.strokeStyle = '#b7c29f70'; bg.lineWidth = .9;
    for (let x = 0; x <= COLS; x++) { bg.beginPath(); bg.moveTo(x * CELL, 0); bg.lineTo(x * CELL + .5, H * .47); bg.lineTo(x * CELL, H); bg.stroke(); }
    for (let y = 0; y <= ROWS; y++) { bg.beginPath(); bg.moveTo(0, y * CELL); bg.lineTo(W * .6, y * CELL + .4); bg.lineTo(W, y * CELL); bg.stroke(); }
    for (let i = 0; i < 2300; i++) { bg.fillStyle = `rgba(96,106,68,${random(i + 470) * .05})`; bg.fillRect(random(i + 71) * W, random(i + 85) * H, 1, 1); }
    // Faint pencil landmarks are traversable ground, not obstacles.
    bg.save(); bg.globalAlpha = .32; bg.strokeStyle = '#9eaa86'; bg.lineWidth = 1.2;
    for (const [x, y] of [[2.4, 2.3], [16.5, 2.2], [3.6, 9.8], [16.3, 10.9], [9.3, 1.3]]) {
      bg.beginPath(); bg.ellipse(x * CELL, y * CELL, 13, 5, -.2, 0, Math.PI * 2); bg.stroke();
      bg.beginPath(); bg.moveTo((x - .18) * CELL, y * CELL); bg.lineTo(x * CELL, (y - .17) * CELL); bg.lineTo((x + .2) * CELL, y * CELL); bg.stroke();
    }
    bg.translate(CELL * 1.45, CELL * 11.4); bg.strokeStyle = '#7b8967';
    bg.beginPath(); bg.moveTo(0, -18); bg.lineTo(5, 5); bg.lineTo(0, 1); bg.lineTo(-5, 5); bg.closePath(); bg.stroke(); bg.moveTo(0, -13); bg.lineTo(0, 18); bg.moveTo(-14, 0); bg.lineTo(14, 0); bg.stroke();
    bg.font = '11px Georgia'; bg.fillStyle = '#7b8967'; bg.textAlign = 'center'; bg.fillText('N', 0, -24); bg.restore();
    bg.save(); bg.fillStyle = '#a0ac8b'; bg.globalAlpha = .43; bg.font = 'italic 11px "Segoe UI", sans-serif'; bg.translate(CELL * 14.5, CELL * 12.45); bg.rotate(-.03); bg.direction = locale.direction; bg.textAlign = 'left'; bg.fillText(tr('mapMotto'), 0, 0, CELL * 4.8); bg.restore();
  }
  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(r.width * ratio)), height = Math.max(1, Math.round(r.height * ratio));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width; canvas.height = height;
    draw(performance.now());
  }
  new ResizeObserver(resizeCanvas).observe(canvas);
  // Fit the whole 20 × 13 map into the remaining space in either orientation.
  const stage = document.querySelector('.board-stage');
  function fitBoard() {
    const scale = Math.min(stage.clientWidth / W, stage.clientHeight / H);
    $('canvas-wrap').style.width = Math.max(1, Math.floor(W * scale)) + 'px';
    $('canvas-wrap').style.height = Math.max(1, Math.floor(H * scale)) + 'px';
    resizeCanvas();
  }
  new ResizeObserver(fitBoard).observe(stage);
  window.addEventListener('resize', fitBoard);
  function drawPath(points, preview = false) {
    if (points.length < 2) return;
    ctx.save(); ctx.beginPath(); points.forEach((p, i) => { const x = (p.x + .5) * CELL, y = (p.y + .5) * CELL; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineWidth = preview ? 13 : 20; ctx.strokeStyle = preview ? '#98ab7830' : '#c8bf9740'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = preview ? 1.8 : 1.7; ctx.strokeStyle = preview ? '#718c55b0' : '#b39e75aa'; ctx.setLineDash([5, 7]); ctx.lineDashOffset = -game.time * 6; ctx.stroke();
    ctx.setLineDash([]);
    if (!preview) for (let i = 3; i < points.length - 1; i += 5) {
      const p = points[i], next = points[i + 1]; ctx.save(); ctx.translate((p.x + .5) * CELL, (p.y + .5) * CELL); ctx.rotate(Math.atan2(next.y - p.y, next.x - p.x));
      ctx.strokeStyle = '#b29a69'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(2, 0); ctx.lineTo(-3, 4); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  function drawEndpoints() {
    ctx.save(); ctx.translate(CELL * .5, CELL * 6.5);
    ctx.fillStyle = '#dec7a078'; ctx.fillRect(-CELL / 2, -CELL / 2, CELL, CELL); ctx.strokeStyle = '#b28459'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-19, -20); ctx.lineTo(-14, -23); ctx.lineTo(-11, 20); ctx.lineTo(-18, 21); ctx.closePath(); ctx.fillStyle = '#cbb390'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(14, -8); ctx.lineTo(14, -15); ctx.lineTo(25, -2); ctx.lineTo(14, 11); ctx.lineTo(14, 4); ctx.lineTo(-9, 4); ctx.closePath(); ctx.fillStyle = '#b9895f'; ctx.fill();
    ctx.font = 'bold 7px "Segoe UI"'; ctx.fillStyle = '#98734e'; ctx.textAlign = 'center'; ctx.direction = locale.direction; ctx.fillText(tr('entryMap'), 2, 22, CELL * .85); ctx.restore();
    ctx.save(); ctx.translate(CELL * 19.5, CELL * 6.5);
    ctx.fillStyle = '#c5d2ac80'; ctx.fillRect(-CELL / 2, -CELL / 2, CELL, CELL); ctx.strokeStyle = '#576d48'; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#92a37b'; ctx.beginPath(); ctx.moveTo(-20, 14); ctx.lineTo(-21, -6); ctx.lineTo(-12, -16); ctx.lineTo(15, -15); ctx.lineTo(23, -6); ctx.lineTo(21, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-23, -5); ctx.lineTo(23, -5); ctx.stroke(); ctx.fillStyle = '#43573b'; ctx.fillRect(-5, 0, 12, 16); ctx.fillRect(-16, 0, 6, 5); ctx.fillRect(12, 0, 6, 5);
    ctx.beginPath(); ctx.moveTo(5, -16); ctx.lineTo(5, -43); ctx.stroke(); ctx.fillStyle = '#829460'; ctx.beginPath(); ctx.moveTo(6, -42); ctx.lineTo(22, -38); ctx.lineTo(6, -32); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 7px "Segoe UI"'; ctx.textAlign = 'center'; ctx.fillStyle = '#63784f'; ctx.direction = locale.direction; ctx.fillText(tr('homeMap'), 1, 25, CELL * .85); ctx.restore();
  }
  function rangeCircle(x, y, range, color, dashed = true) {
    if (!range) return;
    ctx.save(); ctx.beginPath(); ctx.arc((x + .5) * CELL, (y + .5) * CELL, range * CELL, 0, Math.PI * 2);
    ctx.fillStyle = color + '0c'; ctx.fill(); ctx.strokeStyle = color + '80'; ctx.lineWidth = 1.5; if (dashed) ctx.setLineDash([4, 5]); ctx.stroke(); ctx.restore();
  }
  function drawEffects() {
    for (const f of game.effects) {
      const p = 1 - f.life / f.maxLife; ctx.save(); ctx.globalAlpha = Math.min(1, (1 - p) * 1.5);
      if (f.type === 'bullet' || f.type === 'beam') {
        ctx.strokeStyle = f.type === 'beam' ? '#6d969a' : '#e5b850'; ctx.lineWidth = f.type === 'beam' ? 2.2 : 2; ctx.beginPath(); ctx.moveTo(f.x * CELL, f.y * CELL); ctx.lineTo(f.tx * CELL, f.ty * CELL); ctx.stroke();
        ctx.fillStyle = '#edc665'; ctx.beginPath(); ctx.arc(f.tx * CELL, f.ty * CELL, 3 * (1 - p), 0, Math.PI * 2); ctx.fill();
      } else if (f.type === 'blast' || f.type === 'pulse') {
        ctx.translate(f.x * CELL, f.y * CELL); const r = f.radius * CELL * Math.min(1, .3 + p * 1.7);
        ctx.fillStyle = f.type === 'pulse' ? '#a797c128' : '#d2a36538'; ctx.strokeStyle = f.type === 'pulse' ? '#a08cb0' : '#bb8c54'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (f.type === 'pulse') { ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(0, 0, r * .6, 0, Math.PI * 2); ctx.stroke(); }
        else for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .7, Math.sin(a) * r * .7); ctx.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05); ctx.stroke(); }
      } else if (f.type === 'pop') {
        ctx.translate(f.x * CELL, f.y * CELL); ctx.strokeStyle = '#a9956b'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * p * 20, Math.sin(a) * p * 20); ctx.lineTo(Math.cos(a) * (p * 20 + 4), Math.sin(a) * (p * 20 + 4)); ctx.stroke(); }
        ctx.font = 'bold 11px "Segoe UI"'; ctx.fillStyle = '#889361'; ctx.textAlign = 'center'; ctx.fillText('+' + f.reward, 0, -12 - p * 18);
      }
      ctx.restore();
    }
    for (const s of game.shots) {
      const p = s.time / s.duration, x = s.x + (s.tx - s.x) * p, y = s.y + (s.ty - s.y) * p;
      ctx.save(); ctx.translate(x * CELL, y * CELL - Math.sin(p * Math.PI) * 30); ctx.rotate(Math.atan2(s.ty - s.y, s.tx - s.x)); ctx.fillStyle = s.isSlow ? '#a79abc' : '#8c9471'; ctx.strokeStyle = '#546348'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, s.isSlow ? 5 : 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (!s.isSlow) { ctx.fillStyle = '#dbb56b'; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(-16, 0); ctx.lineTo(-8, 3); ctx.fill(); } ctx.restore();
    }
  }
  function draw(now) {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); ctx.clearRect(0, 0, W, H); ctx.drawImage(background, 0, 0);
    if (showPath) drawPath(game.path());
    const selected = game.buildings.find(b => b.id === selectedId);
    if (selected && TYPES[selected.type].damage) rangeCircle(selected.x, selected.y, game.stats(selected).range, TYPES[selected.type].color);
    if (hover && selectedType && game.status !== 'over' && !paused) {
      if (!hoverCheck || now - lastHover > 140) { hoverCheck = game.placement(selectedType, hover.x, hover.y); lastHover = now; }
      if (hoverCheck.ok && showPath) drawPath(game.path(ENTRY.x, ENTRY.y, hoverCheck.field), true);
      const t = TYPES[selectedType]; if (t.range) rangeCircle(hover.x, hover.y, t.range, hoverCheck.ok ? t.color : '#b76f50');
      ctx.fillStyle = hoverCheck.ok ? '#91aa683d' : '#c4836650'; ctx.fillRect(hover.x * CELL + 1, hover.y * CELL + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = hoverCheck.ok ? '#789357' : '#b37755'; ctx.lineWidth = 2; ctx.strokeRect(hover.x * CELL + 2, hover.y * CELL + 2, CELL - 4, CELL - 4);
    } else if (hover && !paused) { ctx.fillStyle = '#82996b13'; ctx.fillRect(hover.x * CELL, hover.y * CELL, CELL, CELL); }
    drawEndpoints();
    if (selected) {
      ctx.strokeStyle = '#728b58'; ctx.lineWidth = 2; const x = selected.x * CELL + 2, y = selected.y * CELL + 2, s = CELL - 4;
      for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]]) { ctx.beginPath(); ctx.moveTo(px + dx * 10, py); ctx.lineTo(px, py); ctx.lineTo(px, py + dy * 10); ctx.stroke(); }
    }
    const entities = [...game.buildings.map(b => ({ y: b.y + .5, b })), ...game.enemies.map(e => ({ y: e.y, e }))].sort((a, b) => a.y - b.y);
    for (const entity of entities) { if (entity.b) Art.tower(ctx, entity.b, CELL); else Art.enemy(ctx, entity.e, CELL, game.time); }
    if (hover && selectedType && hoverCheck?.ok && !paused) Art.tower(ctx, { ...hover, type: selectedType, level: 1, flash: 0 }, CELL, true);
    drawEffects();
    if (keyboardCell && document.activeElement === canvas) { ctx.strokeStyle = '#aa8254'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(keyboardCell.x * CELL + 3, keyboardCell.y * CELL + 3, CELL - 6, CELL - 6); ctx.setLineDash([]); }
  }
  function processEvents() {
    for (const event of game.drainEvents()) {
      sound(event.type);
      if (event.type === 'wave') {
        $('wave-banner-text').textContent = tr('waveNumber', { wave: pad(event.wave) });
        $('wave-banner').hidden = false;
        clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { $('wave-banner').hidden = true; }, 1600);
      }
      if (event.type === 'clear') {
        if (game.cleared > best) best = game.cleared;
        recordRun(false);
        toast('waveCleared', { wave: event.wave, bonus: event.bonus });
      }
      if (event.type === 'over') {
        const newBest = game.cleared >= best && game.cleared > 0; recordRun(true); paused = false;
        $('final-wave').textContent = game.cleared; $('final-kills').textContent = game.kills; $('final-best').textContent = best;
        gameOverWasBest = newBest;
        $('final-message').textContent = tr(newBest ? 'newBest' : 'defeated', { wave: game.wave });
        $('final-message').classList.toggle('new-best', newBest); $('wave-banner').hidden = true; openDialog('gameover-dialog');
      }
    }
  }
  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, .12); lastFrame = now;
    if (!paused && !dialogs.some(d => d.open) && game.status === 'wave' && !document.hidden) {
      let remaining = dt * speed;
      while (remaining > 0.00001 && game.status === 'wave') { const step = Math.min(1 / 60, remaining); game.update(step); remaining -= step; }
    }
    processEvents();
    if (now - lastUI > 80) { updateUI(); lastUI = now; }
    if (!document.hidden) draw(now);
    requestAnimationFrame(frame);
  }
  applyLanguage(); fitBoard(); requestAnimationFrame(frame);
})();
