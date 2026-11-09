(() => {
  'use strict';
  const E = window.Tractor, I = window.BooplandI18n, $ = id => document.getElementById(id), t = (key, values) => I.t('tractor.' + key, values);
  const symbols = { s: '♠', h: '♥', c: '♣', d: '♦', j: '✦' }, suitNames = { s: 'spades', h: 'hearts', c: 'clubs', d: 'diamonds' };
  const storageKey = 'boopland-tractor-v1';
  let state = null, selected = new Set(), timer = null, paused = false, restored = false, message = null, saved = true, dialogKind = null;
  const rankName = r => ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: 'A+' }[r] || String(r));
  const name = player => t(['you', 'left', 'partner', 'right'][player]);
  const team = n => t(n === 0 ? 'ourTeam' : 'theirTeam');
  const trumpText = () => state?.trump ? symbols[state.trump] : t('noTrump');
  const contractText = () => t(state.trump ? 'contract' : 'contractNoTrump', { level: rankName(state.level), suit: trumpText() });
  const ctx = () => state || { level: 2, trump: null };
  const ownTurn = () => state && state.turn === 0 && ['play', 'bury'].includes(state.phase) && !restored && !paused;
  try { const raw = JSON.parse(localStorage.getItem(storageKey)); if (E.validSave(raw)) { state = raw; restored = true; } } catch { /* A fresh table remains playable without storage. */ }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); saved = true; } catch { saved = false; } }
  function cancelTimer() { if (timer !== null) clearTimeout(timer); timer = null; }
  function act(fn) {
    const error = fn();
    if (error) { message = { key: error, error: true }; renderStatus(); return; }
    selected.clear(); message = null; save(); render(); schedule();
  }
  function schedule() {
    cancelTimer();
    if (!state || restored || paused || document.hidden || $('dialog').open || state.phase === 'result') return;
    if (state.phase !== 'collect' && state.turn === 0) return;
    timer = setTimeout(() => {
      timer = null;
      if (paused || restored || document.hidden || $('dialog').open) return;
      if (state.phase === 'collect') act(() => E.collect(state));
      else {
        const v = E.view(state, state.turn);
        if (state.phase === 'bid') act(() => E.bid(state, state.turn, E.aiBid(v)));
        else if (state.phase === 'bury') act(() => E.bury(state, state.turn, E.aiBury(v)));
        else if (state.phase === 'play') act(() => E.play(state, state.turn, E.aiPlay(v)));
      }
    }, state.phase === 'collect' ? 900 : state.phase === 'bury' ? 950 : 450);
  }
  function avatar(player) {
    const fills = ['#e3dfc9', '#e8d9ce', '#dce6d4', '#dce2e5'];
    const hair = player === 1 ? 'M10 19Q8 5 23 7Q35 8 34 20M12 12l-3 8m24-7 3 9' : player === 2 ? 'M10 19Q5 14 13 10Q20 3 27 10Q38 8 34 22M18 8l-2-4m6 4 3-5' : 'M9 19Q9 7 23 8Q35 9 35 21M12 13l7-4m0 0 10 6';
    return `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M4 23Q2 3 24 3Q42 4 41 24Q41 42 21 41Q3 41 4 23Z" fill="${fills[player]}" stroke="#9aa18e" stroke-width=".8"/><path d="M10 40q1-11 12-11t13 11" fill="#f6f3e6" stroke="#74806a" stroke-width="1"/><path d="M11 20q0-11 11-11t11 11q-1 14-11 14T11 20" fill="#f6ecdc" stroke="#74806a" stroke-width="1"/><path d="${hair}M17 21v1m10-1v1m-8 5q3 2 6 0" fill="none" stroke="#65705c" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  }
  function cardLabel(c) {
    if (c.s === 'j') return t(c.r === 15 ? 'smallJoker' : 'bigJoker');
    return t('cardLabel', { suit: t(suitNames[c.s]), rank: rankName(c.r), trump: E.suit(c, ctx()) === 't' && state?.phase !== 'bid' ? ' · ' + t('trump') : '' });
  }
  function card(c, interactive = false) {
    const el = document.createElement(interactive ? 'button' : 'span');
    const isTrump = state?.phase !== 'bid' && E.suit(c, ctx()) === 't';
    el.className = 'card' + (c.s === 'h' || c.s === 'd' || c.r === 16 ? ' red' : '') + (isTrump ? ' trump' : '') + (c.s === 'j' ? ' joker' : '');
    el.setAttribute('aria-label', cardLabel(c));
    el.innerHTML = `<span class="corner" aria-hidden="true"><span>${c.s === 'j' ? (c.r === 16 ? '★' : '☆') : rankName(c.r)}</span><span>${symbols[c.s]}</span></span><span class="pip" aria-hidden="true">${symbols[c.s]}</span>${isTrump ? '<span class="trump-mark" aria-hidden="true">◆</span>' : ''}${E.points([c]) ? '<i class="point-dot" aria-hidden="true"></i>' : ''}`;
    if (interactive) {
      el.dataset.card = c.id;
      el.setAttribute('aria-pressed', String(selected.has(c.id)));
      el.classList.toggle('selected', selected.has(c.id));
      el.disabled = !ownTurn();
      if (state?.phase === 'play' && state.trick.length) {
        const leadSuit = E.suit(state.trick[0].cards[0], state), same = state.hands[0].filter(h => E.suit(h, state) === leadSuit);
        el.classList.toggle('unavailable', same.length >= state.trick[0].cards.length && E.suit(c, state) !== leadSuit);
      }
      el.addEventListener('click', () => {
        if (!ownTurn()) return;
        selected.has(c.id) ? selected.delete(c.id) : selected.add(c.id);
        message = null;
        updateSelection(); renderStatus();
      });
    }
    return el;
  }
  function updateSelection() {
    $('hand').querySelectorAll('[data-card]').forEach(el => { const on = selected.has(el.dataset.card); el.classList.toggle('selected', on); el.setAttribute('aria-pressed', String(on)); });
    $('selection').textContent = t('selected', { n: selected.size }) + (state?.phase === 'bury' && state.dealer === 0 ? ' / 8' : '');
    $('clear').disabled = !selected.size;
    renderPrimary();
  }
  function renderHand() {
    const container = $('hand'); container.replaceChildren();
    const cards = state ? E.sort(state.hands[0], state) : [{ id: 'demo-0', s: 'c', r: 9 }, { id: 'demo-1', s: 'c', r: 9 }, { id: 'demo-2', s: 'c', r: 10 }, { id: 'demo-3', s: 'c', r: 10 }];
    const narrow = window.innerWidth <= 650 && window.innerHeight > 480, perRow = narrow ? Math.ceil(cards.length / (cards.length > 16 ? 2 : 1)) : cards.length;
    if (!cards.length) { updateSelection(); return; }
    for (let offset = 0; offset < cards.length; offset += perRow) {
      const row = document.createElement('div'); row.className = 'hand-row';
      const slice = cards.slice(offset, offset + perRow);
      row.style.gridTemplateColumns = (slice.length > 1 ? `repeat(${slice.length - 1}, minmax(0, 1fr)) ` : '') + 'var(--card-w)';
      row.style.maxWidth = `calc(${slice.length} * var(--card-w))`;
      slice.forEach(c => row.append(card(c, !!state))); container.append(row);
    }
    updateSelection();
  }
  function renderSeats() {
    for (let p = 1; p < 4; p++) {
      const el = $('seat-' + p), active = state && state.turn === p && !['result', 'collect'].includes(state.phase);
      el.classList.toggle('active', !!active);
      el.innerHTML = `<div class="avatar">${avatar(p)}</div><div class="seat-info"><strong></strong><small></small></div>`;
      el.querySelector('strong').textContent = name(p);
      el.querySelector('small').textContent = t('cards', { n: state ? state.hands[p].length : 25 });
      if (state && state.phase !== 'bid') {
        const role = document.createElement('span'); role.className = 'role';
        role.textContent = t(p === (state.result?.previousDealer ?? state.dealer) ? 'dealer' : p % 2 === (state.result?.previousDealer ?? state.dealer) % 2 ? 'defend' : 'attack');
        el.querySelector('small').append(role);
      }
    }
    const dealer = state?.result?.previousDealer ?? state?.dealer;
    $('you').textContent = name(0) + (state ? ' · ' + t('cards', { n: state.hands[0].length }) : '') + (state && state.phase !== 'bid' ? ' · ' + t(dealer === 0 ? 'dealer' : dealer % 2 === 0 ? 'defend' : 'attack') : '');
  }
  function renderTable() {
    $('plays').replaceChildren();
    const trick = state?.trick || [], won = state?.phase === 'collect' ? E.winner(trick, state) : null;
    trick.forEach(p => {
      const el = document.createElement('div'); el.className = 'play play-' + ['bottom', 'left', 'top', 'right'][p.player] + (p.player === won ? ' winner' : '');
      const row = document.createElement('div'); row.className = 'play-cards';
      p.cards.forEach(c => row.append(card(c))); el.append(row);
      const label = document.createElement('span'); label.className = 'play-label'; label.textContent = name(p.player); el.append(label); $('plays').append(el);
    });
    const note = $('center-note'); note.replaceChildren(); note.hidden = !!trick.length;
    if (!trick.length) {
      const art = document.createElement('span'); art.className = 'doodle'; art.textContent = state?.phase === 'bid' ? '♧' : state?.phase === 'bury' ? '▱' : state?.phase === 'result' ? '✧' : '♧';
      const title = document.createElement('h2'), detail = document.createElement('p'), small = document.createElement('small');
      title.textContent = !state ? t('welcome') : state.phase === 'bid' ? t('bid') : state.phase === 'bury' ? t('bury') : state.phase === 'result' ? t('result') : trumpText();
      detail.textContent = !state ? t('intro') : state.phase === 'bid' ? (state.bid ? bidStatus() : t('declaring', { level: rankName(state.level) })) : state.phase === 'bury' ? t('cards', { n: 8 }) : state.phase === 'result' ? resultTitle() : contractText();
      small.textContent = !state ? t('welcomeDetail') : state.phase === 'play' ? name(state.turn) : '';
      note.append(art, title, detail, small);
    }
    $('bottom-note').textContent = t('bottom');
  }
  function renderPrimary() {
    let key = 'start', disabled = false;
    if (state) {
      if (restored) key = 'resume';
      else if (state.phase === 'result') key = 'result';
      else if (state.phase === 'bid') { key = 'bid'; disabled = state.turn !== 0; }
      else if (state.phase === 'bury') { key = 'bury'; disabled = state.turn !== 0 || selected.size !== 8; }
      else { key = 'play'; disabled = state.turn !== 0 || state.phase !== 'play' || selected.size === 0; }
    }
    $('primary').textContent = t(key); $('primary').disabled = disabled || paused;
    $('hint').disabled = !ownTurn(); $('last').disabled = !state?.lastTrick; $('pause').disabled = !state || restored;
  }
  function renderStatus() {
    let value;
    if (message) value = t(message.key, message.values);
    else if (restored) value = t('resumed');
    else if (!state) value = t('ready');
    else if (paused) value = t('pausedText');
    else if (state.phase === 'result') value = resultTitle();
    else if (state.phase === 'collect') value = t('trickWon', { name: name(state.turn), n: E.points(state.trick.flatMap(p => p.cards)) });
    else if (state.turn !== 0) value = t(state.phase === 'bury' ? 'aiBury' : 'aiTurn', { name: name(state.turn) });
    else if (state.phase === 'bid') value = t('yourBid');
    else if (state.phase === 'bury') value = t('yourBury');
    else if (!state.trick.length) value = t('yourLead');
    else { const lead = state.trick[0].cards, s = E.suit(lead[0], state); value = t('yourFollow', { n: lead.length, suit: s === 't' ? t('trump') : symbols[s] }); }
    $('status').textContent = value; $('status').parentElement.classList.toggle('error', !!message?.error);
  }
  function render() {
    $('our-level').textContent = rankName(state?.levels[0] || 2); $('their-level').textContent = rankName(state?.levels[1] || 2);
    $('round').textContent = t('round', { n: state?.round || 1 });
    $('contract').textContent = !state || state.phase === 'bid' ? t('declaring', { level: rankName(state?.level || 2) }) : contractText();
    $('score-label').textContent = t('attack') + (state && state.phase !== 'bid' ? ' · ' + team(1 - (state.result?.previousDealer ?? state.dealer) % 2) : '');
    $('score').textContent = state?.score || 0; $('score-fill').style.width = Math.min(100, (state?.score || 0) / 80 * 100) + '%';
    $('save-note').textContent = state ? t(saved ? 'saved' : 'saveFailed') : '';
    $('pause').title = t('pause'); $('help').title = t('help');
    renderSeats(); renderTable(); renderHand(); renderStatus();
  }
  function paragraph(text, cls) { const p = document.createElement('p'); p.textContent = text; if (cls) p.className = cls; return p; }
  function button(label, fn, primary = false) { const b = document.createElement('button'); b.textContent = label; if (primary) b.className = 'primary'; b.onclick = fn; return b; }
  function openDialog(kind) {
    cancelTimer(); dialogKind = kind; renderDialog(); if (!$('dialog').open) $('dialog').showModal();
  }
  function closeDialog() { $('dialog').close(); }
  function bidLabel(b) { return b.strength > 2 ? t(b.strength === 3 ? 'smallJoker' : 'bigJoker') + ' × 2' : t('bidChoice', { suit: symbols[b.suit], n: b.strength }); }
  function bidStatus() { return state.bid ? t('currentBid', { name: name(state.bid.player), bid: bidLabel(state.bid) }) : t('noBid'); }
  function resultTitle() { const r = state.result; return r.champion !== null ? t('champion', { team: team(r.champion) }) : t(r.held ? 'held' : 'switched', { team: team(r.team) }); }
  function miniHand(cards) { const row = document.createElement('div'); row.className = 'mini-hand'; cards.forEach(c => row.append(card(c))); return row; }
  function renderDialog() {
    const body = $('dialog-body'), actions = $('dialog-actions'); body.replaceChildren(); actions.replaceChildren();
    $('dialog-title').textContent = t(dialogKind === 'restart' ? 'restart' : dialogKind === 'pause' ? 'pause' : dialogKind);
    if (dialogKind === 'help') {
      body.append(paragraph(t('rulesTeam'), 'rule-lead'));
      for (const [heading, copy] of [['bid', 'bidDescription'], ['trump', 'rulesTrump'], ['play', 'rulesPlay'], ['scores', 'rulesScore'], ['bottom', 'rulesBottom']]) { const h = document.createElement('h3'); h.textContent = t(heading); body.append(h, paragraph(t(copy))); }
      body.append(paragraph(t('rulesVariant')), paragraph(t('keyboard')));
      actions.append(button(t('close'), closeDialog, true));
    } else if (dialogKind === 'pause') {
      body.append(paragraph(t('pausedText'))); actions.append(button(t('resume'), closeDialog, true));
    } else if (dialogKind === 'restart') {
      body.append(paragraph(t('restartText'))); actions.append(button(t('cancel'), closeDialog), button(t('start'), () => { closeDialog(); start(); }, true));
    } else if (dialogKind === 'bid') {
      body.append(paragraph(t('bidDescription')), paragraph(bidStatus(), 'auction-log'));
      const grid = document.createElement('div'); grid.className = 'bid-grid';
      for (const b of E.bids(E.view(state, 0))) grid.append(button(bidLabel(b), () => { closeDialog(); act(() => E.bid(state, 0, b)); }));
      body.append(grid); actions.append(button(t('pass'), () => { closeDialog(); act(() => E.bid(state, 0, null)); }, true));
    } else if (dialogKind === 'last') {
      if (!state?.lastTrick) body.append(paragraph(t('noLast')));
      else {
        const last = state.lastTrick;
        body.append(paragraph(t('trickWon', { name: name(last.winner), n: last.points }), 'rule-lead'));
        for (const p of last.plays) { const row = document.createElement('div'); row.className = 'last-row'; const label = document.createElement('strong'); label.textContent = name(p.player) + (p.player === last.winner ? ' ✓' : ''); row.append(label, miniHand(p.cards)); body.append(row); }
      }
      actions.append(button(t('close'), closeDialog, true));
    } else if (dialogKind === 'result') {
      const r = state.result; $('dialog-title').textContent = resultTitle();
      const score = document.createElement('div'); score.className = 'result-score'; score.textContent = r.score; body.append(score);
      for (const [label, n] of [[t('basePoints'), r.base], [t('bottomBonus', { points: r.bottomPoints, multiplier: r.bottomMultiplier }), r.bonus]]) { const row = document.createElement('div'); row.className = 'result-detail'; const a = document.createElement('span'), b = document.createElement('strong'); a.textContent = label; b.textContent = n; row.append(a, b); body.append(row); }
      body.append(paragraph(t('promoted', { team: team(r.team), n: r.gain, level: rankName(state.levels[r.team]) })), miniHand(E.sort(state.bottom, state)));
      if (r.champion === null) body.append(paragraph(t('nextDealer', { name: name(state.dealer) })));
      actions.append(button(t(r.champion === null ? 'next' : 'restart'), () => { closeDialog(); if (r.champion !== null) start(); else { state = E.deal(state); selected.clear(); message = null; save(); render(); schedule(); } }, true));
    }
  }
  function start() { cancelTimer(); state = E.create(); selected.clear(); paused = false; restored = false; message = null; save(); render(); schedule(); }
  function primary() {
    if (!state) { start(); return; }
    if (restored) { restored = false; render(); schedule(); return; }
    if (state.phase === 'result') { openDialog('result'); return; }
    if (state.turn !== 0 || paused) return;
    if (state.phase === 'bid') openDialog('bid');
    else if (state.phase === 'bury') act(() => E.bury(state, 0, [...selected]));
    else if (state.phase === 'play') act(() => E.play(state, 0, [...selected]));
  }
  function hint() {
    if (!ownTurn()) return;
    const v = E.view(state, 0); selected = new Set(state.phase === 'bury' ? E.aiBury(v) : E.aiPlay(v)); message = { key: 'hintReady' }; updateSelection(); renderStatus();
  }
  $('primary').onclick = primary; $('hint').onclick = hint;
  $('clear').onclick = () => { selected.clear(); message = null; updateSelection(); renderStatus(); };
  $('help').onclick = () => openDialog('help'); $('restart').onclick = () => state ? openDialog('restart') : start();
  $('last').onclick = () => openDialog('last'); $('pause').onclick = () => { paused = true; render(); openDialog('pause'); };
  $('close').onclick = closeDialog;
  $('dialog').addEventListener('close', () => { if (dialogKind === 'pause') paused = false; dialogKind = null; render(); schedule(); });
  document.addEventListener('keydown', e => {
    if ($('dialog').open || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,select,textarea')) return;
    if (e.key.toLowerCase() === 'h') { e.preventDefault(); hint(); }
    else if (e.key === 'Enter' && !e.target.closest('button,a') && !$('primary').disabled) { e.preventDefault(); primary(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelTimer(); else schedule(); });
  window.addEventListener('boopland:languagechange', () => { render(); if ($('dialog').open) renderDialog(); });
  new ResizeObserver(() => renderHand()).observe($('hand'));
  window.addEventListener('resize', renderHand);
  render(); schedule();
})();
