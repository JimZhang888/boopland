(() => {
  'use strict';
  const E = NineGrid, I = BooplandI18n, $ = id => document.getElementById(id);
  const SAVE = 'boopland-ninefold-quest-v1', BEST = 'boopland-ninefold-quest-best';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Play remains available without storage. */ } };
  const seed = () => { try { return crypto.getRandomValues(new Uint32Array(1))[0]; } catch { return Date.now() >>> 0; } };
  let state = E.restore(read(SAVE)) || E.create(seed());
  let best = Math.max(0, Math.min(100000, Number(read(BEST)) || 0)), modalKind = null;
  const t = (key, values) => I.t('nine.' + key, values);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const art = (name, className = 'event-art') => `<svg class="${className}" viewBox="0 0 80 80" aria-hidden="true"><use href="#art-${name}"/></svg>`;
  const tr = (key, values) => escape(t(key, values));
  const hero = (icon, title, eyebrow = t('notes')) => `<div class="event-hero">${art(icon)}<div><div class="event-eyebrow">${escape(eyebrow)}</div><h2 class="event-title">${escape(title)}</h2></div></div>`;
  const choice = (action, label, detail = '', primary = false, enabled = true) => `<button class="choice${primary ? ' primary' : ''}" data-action="${action}" ${enabled ? '' : 'disabled'}><span>${escape(label)}</span>${detail ? `<small>${escape(detail)}</small>` : ''}</button>`;
  function panel() {
    if (state.status === 'won' || state.status === 'lost') {
      return hero(state.status === 'won' ? 'flag' : 'camp', t(state.status)) + `<p class="event-desc">${tr(state.status + 'Desc')}</p><div class="result-score">${E.score(state)}<small>${tr('score')}</small></div><div class="result-details"><span>${tr('resultFloors', { n: state.cleared })}</span><span>${tr('resultTiles', { n: state.explored })}</span></div><div class="actions">${choice('new', t('restart'), '', true)}</div>`;
    }
    if (state.status === 'upgrade') return hero('flag', t('upgrade')) + `<p class="event-desc">${tr('upgradeDesc')}</p><div class="actions">${['blade', 'shield', 'vitality'].map((a, i) => choice(a, t(a), t(a + 'Bonus'), i === 0)).join('')}</div>`;
    const tile = state.pending === null ? null : state.tiles[state.pending];
    if (!tile) return hero('forest', t('idleTitle'), t('floor', { n: state.floor })) + `<p class="event-desc">${tr(E.resolved(state) >= 4 ? 'guardianReady' : 'idleDesc')}</p><div class="idle-hint">${tr(state.weather + 'Desc')}</div>`;
    let title = t(tile.type), desc = '', extra = '', details = {};
    if (tile.type === 'enemy' || tile.type === 'boss') {
      const normal = E.combat(state, tile), power = E.combat(state, tile, true);
      desc = t('fightDesc');
      extra = `<div class="combat-preview"><span>${tr('foeStats', normal)}</span><span>+${normal.gold} ${tr('gold')}</span></div>`;
      if (normal.damage >= state.hp) extra += `<p class="event-desc danger">${tr('lethal')}</p>`;
      details = { fight: t('damage', { n: normal.damage }), power: state.focus ? t('damage', { n: power.damage }) : t('spent') };
    }
    if (tile.type === 'camp') { desc = t('restDesc'); details.rest = t('heal7'); }
    if (tile.type === 'spring') { desc = t('springDesc'); details = { drink: t('heal16'), bottle: t('plusPotion') }; }
    if (tile.type === 'trap') { desc = t('trapDesc', { n: Math.max(1, 5 + (state.weather === 'thorns' ? 2 : 0) - state.armor) }); details = { risk: t('gold15'), careful: t('gold4') }; }
    if (tile.type === 'event') { title = t('event' + tile.variant); desc = t('eventDesc' + tile.variant); details.accept = t(tile.variant === 1 ? 'price8' : 'offer' + tile.variant); }
    if (tile.type === 'merchant') { desc = t('merchantDesc'); details = { buyPotion: t('price7'), buyBlade: t('price10') }; }
    return hero(tile.type, title) + `<p class="event-desc">${escape(desc)}</p>${extra}<div class="actions">${E.choices(state).map((a, i) => choice(a, t(a), details[a], i === 0, E.can(state, a))).join('')}</div>`;
  }
  function render() {
    const focused = document.activeElement;
    const focusTile = focused?.dataset.tile, focusAction = focused?.dataset.action;
    document.title = t('title') + ' · Boopland';
    $('health-value').textContent = `${state.hp} / ${state.maxHp}`;
    $('health-fill').style.width = `${state.hp / state.maxHp * 100}%`;
    $('health-fill').style.background = state.hp / state.maxHp < .3 ? '#b87c68' : '#92a27d';
    $('attack-value').textContent = state.attack; $('armor-value').textContent = state.armor; $('gold-value').textContent = state.gold;
    $('floor-number').textContent = String(state.floor).padStart(2, '0'); $('biome').textContent = t('biome' + state.floor);
    $('weather').textContent = t(state.weather); $('weather').title = t(state.weather + 'Desc');
    $('floor-label').textContent = t('floor', { n: state.floor }); $('exploration').textContent = t('exploration', { n: E.resolved(state) });
    $('journey').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < state.cleared ? 'passed' : i === state.floor - 1 ? 'current' : ''}"></i>`).join('');
    $('board').innerHTML = state.tiles.map((tile, i) => {
      const name = tile.open ? tile.type === 'event' ? t('event' + tile.variant) : t(tile.type) : t('fog');
      const locked = tile.type === 'boss' && E.resolved(state) < 4;
      return `<button class="tile ${tile.open ? 'open ' + tile.type : ''} ${tile.done ? 'done' : ''} ${state.pending === i ? 'selected' : ''}" data-tile="${i}" ${tile.done || state.status !== 'playing' ? 'disabled' : ''} aria-label="${tr('tileLabel', { n: i + 1, name, state: tile.done ? t('cleared') : locked ? t('lockedBadge') : t('fog') })}" aria-pressed="${state.pending === i}"><span class="tile-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${art(tile.open ? tile.type : 'fog', 'tile-art')}<span class="tile-label">${escape(name)}</span>${tile.type === 'boss' && !tile.done ? `<span class="tile-badge">${tr(locked ? 'lockedBadge' : 'readyBadge')}</span>` : ''}</button>`;
    }).join('');
    $('event-panel').innerHTML = panel();
    document.querySelector('.field-notes').classList.toggle('combat', state.pending !== null && ['enemy','boss'].includes(state.tiles[state.pending].type));
    document.querySelector('.field-notes').classList.toggle('event-active', state.pending !== null || state.status !== 'playing');
    $('recent-note').textContent = t(state.message.key, state.message.values);
    $('potion-label').textContent = t('potion', { n: state.potions }); $('potion').title = t('potionHint'); $('potion').setAttribute('aria-label', t('potion', { n: state.potions }) + ' · ' + t('potionHint'));
    $('potion').disabled = state.status !== 'playing' || state.potions === 0 || state.hp === state.maxHp;
    if (['won', 'lost'].includes(state.status)) { best = Math.max(best, E.score(state)); write(BEST, String(best)); }
    $('best').textContent = t('best', { n: best });
    write(SAVE, JSON.stringify(state));
    if (focusTile !== undefined) document.querySelector(`[data-tile="${focusTile}"]:not(:disabled)`)?.focus({ preventScroll: true });
    else if (focusAction) document.querySelector(`[data-action="${focusAction}"]:not(:disabled)`)?.focus({ preventScroll: true });
    if (modalKind) renderModal();
  }
  function renderModal() {
    $('modal-content').innerHTML = modalKind === 'help' ? `<h2>${tr('help')}</h2>${[1, 2, 3].map(i => `<div class="help-step"><strong>0${i}</strong><p>${tr('rule' + i)}</p></div>`).join('')}<p>${tr('keyboard')}</p>${choice('close', t('continue'), '', true)}` : `<h2>${tr('restartTitle')}</h2><p>${tr('restartDesc')}</p>${choice('new', t('restart'), '', true)}${choice('close', t('cancel'))}`;
  }
  function showModal(kind) { modalKind = kind; renderModal(); $('modal').showModal(); }
  function newGame() { state = E.create(seed()); $('modal').close(); modalKind = null; render(); }
  $('board').addEventListener('click', e => { const b = e.target.closest('[data-tile]'); if (!b) return; E.select(state, Number(b.dataset.tile)); render(); });
  function action(e) {
    const b = e.target.closest('[data-action]'); if (!b || b.disabled) return;
    if (b.dataset.action === 'new') { newGame(); return; }
    if (b.dataset.action === 'close') { $('modal').close(); return; }
    E.act(state, b.dataset.action); render();
  }
  $('event-panel').addEventListener('click', action); $('modal-content').addEventListener('click', action);
  $('modal').addEventListener('close', () => { modalKind = null; });
  $('help').addEventListener('click', () => showModal('help'));
  $('restart').addEventListener('click', () => ['won', 'lost'].includes(state.status) ? newGame() : showModal('restart'));
  $('potion').addEventListener('click', () => { E.potion(state); render(); });
  document.addEventListener('keydown', e => {
    if ($('modal').open || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); E.select(state, Number(e.key) - 1); render(); }
    if (e.key.toLowerCase() === 'h') { e.preventDefault(); E.potion(state); render(); }
    if (e.key === 'Escape') { state.pending = null; render(); }
  });
  function sizeBoard() { const rect = document.querySelector('.board-space').getBoundingClientRect(); $('board').style.setProperty('--board-size', Math.floor(Math.min(rect.width, rect.height)) + 'px'); }
  new ResizeObserver(sizeBoard).observe(document.querySelector('.board-space'));
  window.addEventListener('boopland:languagechange', render);
  render(); sizeBoard();
})();
