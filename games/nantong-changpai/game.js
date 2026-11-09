(function () {
  'use strict';
  const E = window.NantongEngine, A = window.NantongArt, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('nantong.' + key, values);
  const esc = value => String(value).replace(/[&<>"']/g, x => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[x]));
  const storageKey = 'boopland-nantong-v1';
  let state, started = false, selected = null, suggestion = false, timer = null, sound = true, audio = null, modalKind = 'intro';
  const name = i => t(['you','bot1','bot2'][i]);
  const plus = n => n > 0 ? '+' + n : String(n);
  const label = (card, short = false) => card < 27 ? t((short ? ['shortWan','shortTiao','shortBing'] : ['wan','tiao','bing'])[Math.floor(card / 9)], { n:card % 9 + 1 }) : t((short ? ['shortHong','shortQian','shortBai'] : ['honghua','qianzi','baihua'])[card - 27]);
  function valid(s) {
    try {
      if (s.version !== 1 || !['initial','draw','discard','reaction','over'].includes(s.phase) || ![0,1,2].includes(s.current) || ![0,1,2].includes(s.dealer) || !Number.isInteger(s.round) || s.round < 1 || s.players.length !== 3 || s.indicators.length !== 2) return false;
      if (!s.players.every(p => Number.isFinite(p.score) && Array.isArray(p.initial) && p.hand.length <= 30 && p.melds.length <= 10)) return false;
      const all = [...s.deck,...s.indicators,...s.players.flatMap(p => [...p.hand,...p.melds.flatMap(m => m.tiles)]),...s.discards.filter(d => !d.claimed).map(d => d.uid)];
      if (all.length !== 120 || new Set(all).size !== 120 || !all.every(u => Number.isInteger(u) && u >= 0 && u < 120)) return false;
      E.actions(s); return true;
    } catch { return false; }
  }
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (saved && valid(saved.state)) { state = saved.state; sound = saved.sound !== false; } } catch { /* Storage is optional, including file://. */ }
  const resumed = !!state;
  if (!state) state = E.create();
  function save() { try { localStorage.setItem(storageKey, JSON.stringify({ state, sound })); } catch { /* No storage: the current game still works. */ } }
  function cancelTimer() { clearTimeout(timer); timer = null; }
  function unlockAudio() {
    if (!sound) return;
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume().catch(() => {}); } catch { /* Audio is optional. */ }
  }
  function clickSound(kind) {
    if (!sound || !audio || audio.state !== 'running' || document.hidden) return;
    const duration = kind === 'hu' ? .28 : .075;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = kind === 'hu' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(kind === 'hu' ? 660 : kind === 'discard' ? 190 : 330, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'hu' ? 990 : 100, audio.currentTime + duration);
    gain.gain.setValueAtTime(.0001, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.035, audio.currentTime + .006); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration + .01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function meldMarkup(m) {
    return '<span class="meld" title="' + esc(t(m.kind) + ' · ' + label(m.card)) + '">' + A.card(m.card) + '<span>' + esc(label(m.card,true)) + ' ×' + m.tiles.length + '</span><small>' + esc(t(m.kind)) + '</small></span>';
  }
  function cardButton(uid, options) {
    const card = E.type(uid), isSelected = selected === uid;
    return '<button type="button" class="card' + (isSelected ? ' selected' : '') + (E.old(card) || card === 7 || card === 8 ? ' special' : '') + (state.lastDraw === uid ? ' new-card' : '') + (options.some(a => a.card === card && ['dragon','angang','jiagang'].includes(a.kind)) ? ' eligible' : '') + '" data-uid="' + uid + '" aria-label="' + esc(label(card)) + '" aria-pressed="' + isSelected + '">' + A.card(card) + '<span class="card-tag" aria-hidden="true">' + esc(label(card,true)) + '</span></button>';
  }
  function render() {
    const p = state.players[0], options = E.actions(state);
    if (!p.hand.includes(selected)) selected = null;
    $('round').textContent = t('round',{ n:state.round }); $('deck').textContent = t('remaining',{n:state.deck.length});
    $('generals').innerHTML = state.indicators.map(uid => '<span title="' + esc(label(E.type(uid))) + '" aria-label="' + esc(label(E.type(uid))) + '">' + A.card(E.type(uid)) + '</span>').join('');
    $('stock-art').innerHTML = A.back();
    [1,2].forEach(i => {
      const q = state.players[i];
      $('opponent-' + i).innerHTML = '<div class="opponent-head"><div class="avatar" aria-hidden="true">' + A.avatar(i-1) + '</div><div><div class="opponent-name">' + (state.current === i && state.phase !== 'over' ? '<span class="active-dot"></span>' : '') + esc(name(i)) + (state.dealer === i ? '<span class="dealer">' + esc(t('dealer')) + '</span>' : '') + '</div><div class="player-meta">' + esc(t('handCount',{n:q.hand.length}) + ' · ' + plus(q.score)) + '</div></div><div class="backs" aria-hidden="true">' + A.back().repeat(5) + '</div></div><div class="meld-strip">' + q.melds.map(meldMarkup).join('') + '</div>';
    });
    const last = state.reaction ? { uid:state.reaction.tile, player:state.reaction.from } : state.discards[state.discards.length - 1];
    $('last-card').innerHTML = last ? A.card(E.type(last.uid)) : '<div class="table-seal" aria-hidden="true">南通<br>长牌</div>';
    $('last-label').textContent = last ? name(last.player) + ' · ' + label(E.type(last.uid),true) : t('version').split(' · ')[0];
    const e = state.event;
    $('event').textContent = e.key === 'drawnGame' ? t(e.key) : name(e.player) + ' · ' + t(e.key) + (e.card == null ? '' : ' ' + label(e.card,true));
    $('recent').innerHTML = state.discards.filter(d => !d.claimed).slice(-12).map(d => A.card(E.type(d.uid))).join('');
    $('you').innerHTML = esc(name(0)) + (state.dealer === 0 ? '<span class="dealer">' + esc(t('dealer')) + '</span>' : '');
    const active = state.current === 0;
    const statusKey = state.phase === 'over' ? 'roundOver' : !active ? 'thinking' : state.phase === 'initial' ? 'initial' : state.phase === 'reaction' ? 'react' : state.phase === 'draw' ? 'draw' : 'yourTurn';
    $('status').textContent = t(statusKey,{player:name(state.current)});
    $('score').textContent = t('cumulative',{n:plus(p.score)});
    $('own-melds').innerHTML = p.melds.map(meldMarkup).join('');
    $('hand').innerHTML = p.hand.map(uid => cardButton(uid, active ? options : [])).join('');
    $('selection').textContent = selected == null ? t('choose') : t(suggestion ? 'suggested' : 'selected',{card:label(E.type(selected))});
    const readyHand = p.hand.length % 3 === 1 ? p.hand : selected == null ? null : p.hand.filter(uid => uid !== selected);
    const waitCards = readyHand ? E.waits(readyHand,E.groups(p)).filter(card => E.view(state,0).known[card] < 4) : [];
    $('waits').textContent = waitCards.length ? t('waiting',{cards:waitCards.map(card => label(card,true)).join(' · ')}) : '';
    $('waits').title = $('waits').textContent;
    $('sound').textContent = sound ? '♪' : '♩';
    $('sound').setAttribute('aria-label',t(sound ? 'soundOn' : 'soundOff')); $('sound').title = t(sound ? 'soundOn' : 'soundOff'); $('sound').setAttribute('aria-pressed',String(sound));
    renderActions(options); I.apply(); document.title = t('title');
  }
  function button(key, callback, style = '', disabled = false) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'action-button ' + style; b.textContent = t(key); b.disabled = disabled; b.addEventListener('click',callback); return b;
  }
  function renderActions(options) {
    const el = $('actions'); el.replaceChildren();
    if (state.phase === 'over') { el.append(button('next',nextRound,'primary'),button('details',showResult,'small')); return; }
    if (state.current !== 0) { const span = document.createElement('span'); span.className = 'thinking'; span.textContent = t('thinking',{player:name(state.current)}); el.append(span); return; }
    if (state.phase === 'initial') {
      if (options.some(a => a.kind === 'dragon')) el.append(button('dragon',() => chooseAction('dragon'),'primary'));
      el.append(button('pass',() => execute({kind:'pass'}))); return;
    }
    if (options.some(a => a.kind === 'hu')) el.append(button('hu',() => execute({kind:'hu'}),'win'));
    if (state.phase === 'reaction') {
      ['peng','minggang'].forEach(kind => { const a = options.find(a => a.kind === kind); if (a) el.append(button(kind,() => execute(a),'primary')); });
      el.append(button('pass',() => execute({kind:'pass'}))); return;
    }
    if (state.phase === 'draw') { el.append(button('draw',() => execute({kind:'draw'}),'primary')); return; }
    el.append(button('discard',() => execute({kind:'discard',uid:selected}),'primary',selected == null));
    if (options.some(a => a.kind === 'angang' || a.kind === 'jiagang')) el.append(button('kong',() => chooseAction('kong')));
    if (!options.some(a => a.kind === 'hu')) el.append(button('hint',hint,'hint'));
  }
  function execute(action) {
    cancelTimer(); unlockAudio();
    if (!E.act(state,action)) { pump(); return; }
    selected = null; suggestion = false; clickSound(action.kind); save(); render();
    if (state.phase === 'over') showResult(); else pump();
  }
  function pump() {
    cancelTimer();
    if (!started || $('modal').open || document.hidden || state.phase === 'over') return;
    if (state.current === 0) {
      if (state.phase === 'initial' && !E.actions(state).some(a => a.kind === 'dragon')) timer = setTimeout(() => execute({kind:'pass'}),180);
      else if (state.phase === 'draw') timer = setTimeout(() => execute({kind:'draw'}),350);
      return;
    }
    timer = setTimeout(() => { const action = E.decide(E.view(state,state.current)); execute(action); }, state.phase === 'initial' ? 280 : state.phase === 'draw' ? 400 : 700);
  }
  function hint() {
    if (state.current !== 0 || state.phase !== 'discard') return;
    const best = E.bestDiscard(E.view(state,0));
    if (best) { selected = best.uid; suggestion = true; render(); }
  }
  function show(kind, html) {
    cancelTimer(); modalKind = kind; $('modal-content').innerHTML = html;
    if (!$('modal').open) $('modal').showModal();
    $('modal-close').hidden = kind === 'intro';
    I.apply($('modal')); $('modal-content').scrollTop = 0;
  }
  function close() { $('modal').close(); modalKind = ''; pump(); }
  function bindButtons(entries) { const row = document.createElement('div'); row.className = 'dialog-buttons'; entries.forEach(([key,fn,style]) => row.append(button(key,fn,style))); $('modal-content').append(row); }
  function intro() {
    show('intro','<div class="intro-topline">BOOPLAND · ' + esc(t('version')) + '</div><h2>' + esc(t('title')) + '</h2><img class="intro-cover" src="./cover.svg" alt=""><p>' + esc(t('intro')) + '</p>');
    bindButtons([[resumed ? 'resume' : 'start',() => { started = true; unlockAudio(); close(); if (state.phase === 'over') showResult(); },'primary'],['rules',showRules,'']]);
  }
  function showRules() {
    show('rules','<h2>' + esc(t('rules')) + '</h2><p>' + esc(t('version')) + '</p><ol class="rules-list">' + [1,2,3,4,5,6,7].map(n => '<li>' + esc(t('rule'+n)) + '</li>').join('') + '</ol><p class="rule-note">' + esc(t('faceNote')) + '</p>');
    bindButtons([['history',showHistory,''],[started ? 'cancel' : 'start',() => { started = true; unlockAudio(); close(); },'primary']]);
  }
  function showHistory() {
    show('history','<h2>' + esc(t('history')) + '</h2>' + (state.discards.length ? '<div class="history-grid">' + state.discards.map(d => '<div class="history-card' + (d.claimed ? ' claimed' : '') + '" title="' + esc(label(E.type(d.uid))) + '">' + A.card(E.type(d.uid)) + esc(name(d.player)) + (d.claimed ? '<br>' + esc(t('claimed')) : '') + '</div>').join('') + '</div>' : '<p>' + esc(t('noDiscards')) + '</p>'));
  }
  function chooseAction(kind) {
    const options = E.actions(state).filter(a => kind === 'dragon' ? a.kind === 'dragon' : a.kind === 'angang' || a.kind === 'jiagang');
    const selectedOption = selected == null ? null : options.find(a => a.card === E.type(selected));
    if (selectedOption || options.length === 1) { execute(selectedOption || options[0]); return; }
    show('choose','<h2>' + esc(t(kind === 'dragon' ? 'pickDragon' : 'pickKong')) + '</h2><div class="choice-grid" id="choices"></div>');
    for (const a of options) {
      const b = document.createElement('button'); b.className = 'choice'; b.innerHTML = A.card(a.card) + esc(label(a.card)) + '<br>' + esc(t(a.kind));
      b.addEventListener('click',() => { $('modal').close(); execute(a); }); $('choices').append(b);
    }
  }
  function showResult() {
    const r = state.result; if (!r) return;
    const heading = r.winner === null ? t('drawnGame') : r.winner === 0 ? t('victory') : t('opponentWin',{player:name(r.winner)});
    let html = '<h2>' + esc(heading) + '</h2><p>' + esc(r.winner === null ? t('drawText') : t('scoreExplain')) + '</p><div class="scoreboard">';
    r.scores.forEach((s,i) => { html += '<div class="score-box' + (r.winner === i ? ' winner' : '') + '"><strong>' + esc(name(i)) + '</strong><div class="delta">' + plus(r.deltas[i]) + '</div><small>' + esc(t('huValue',{n:s.total})) + '</small></div>'; });
    html += '</div>';
    if (r.winner !== null) {
      const p = state.players[r.winner];
      html += '<div class="meld-strip">' + p.melds.map(meldMarkup).join('') + '</div><div class="result-hand">' + p.hand.map(uid => '<span title="' + esc(label(E.type(uid))) + '">' + A.card(E.type(uid)) + '</span>').join('') + '</div>';
      r.scores.forEach((s,i) => {
        html += '<details class="breakdown"' + (i === r.winner ? ' open' : '') + '><summary>' + esc(name(i)) + ' · ' + esc(t('huValue',{n:s.total})) + '</summary>';
        for (const entry of s.entries) html += '<div class="score-line"><span>' + esc(t(entry.key,{n:entry.count}) + (entry.card == null ? '' : ' · ' + label(entry.card))) + '</span><span>+' + entry.value + '</span></div>';
        for (const mult of s.multipliers) html += '<div class="score-line"><span>' + esc(t(mult)) + '</span><span>×2</span></div>';
        html += '<div class="score-line total"><span>' + esc(t('total')) + '</span><span>' + s.total + '</span></div></details>';
      });
    }
    show('result',html); bindButtons([['next',nextRound,'primary'],['cancel',close,'']]);
  }
  function nextRound() {
    state = E.create(Date.now(),(state.dealer+1)%3,state.players.map(p => p.score),state.round+1); selected = null; suggestion = false;
    started = true; save(); render(); close();
  }
  $('hand').addEventListener('click',event => {
    const card = event.target.closest('[data-uid]'); if (!card) return;
    selected = Number(card.dataset.uid); suggestion = false; unlockAudio(); render();
    $('hand').querySelector('[data-uid="' + selected + '"]')?.focus({preventScroll:true});
  });
  $('rules').addEventListener('click',showRules); $('river').addEventListener('click',showHistory);
  $('sound').addEventListener('click',() => { sound = !sound; unlockAudio(); save(); render(); });
  $('restart').addEventListener('click',() => {
    show('restart','<h2>' + esc(t('restart')) + '</h2><p>' + esc(t('restartText')) + '</p>');
    bindButtons([['restart',() => { state = E.create(Date.now(),state.dealer,state.players.map(p => p.score),state.round); selected = null; suggestion = false; started = true; save(); render(); close(); },'primary'],['cancel',close,'']]);
  });
  $('modal-close').addEventListener('click',() => { if (!started) { intro(); return; } close(); });
  $('modal').addEventListener('cancel',event => { if (!started) { event.preventDefault(); intro(); } });
  $('modal').addEventListener('close',pump);
  document.addEventListener('visibilitychange',() => { if (document.hidden) { cancelTimer(); if (audio?.state === 'running') audio.suspend(); } else { if (sound && audio?.state === 'suspended') audio.resume().catch(() => {}); pump(); } });
  window.addEventListener('pagehide',() => { cancelTimer(); save(); if (audio) audio.suspend(); });
  window.addEventListener('boopland:languagechange',() => { render(); if ($('modal').open) { if (modalKind === 'rules') showRules(); else if (modalKind === 'result') showResult(); else if (modalKind === 'history') showHistory(); else if (modalKind === 'intro') intro(); else close(); } });
  render(); intro();
})();
