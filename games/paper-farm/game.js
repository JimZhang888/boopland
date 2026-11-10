(() => {
  'use strict';
  const E = PaperFarm, A = FarmArt, I = BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('farm.' + key, values);
  const KEY = 'boopland-paper-farm-v1';
  let state, storageOK = true, recovered = false;
  try { const raw = localStorage.getItem(KEY); state = E.restore(raw); recovered = !!raw && !state; } catch { storageOK = false; }
  state ||= E.create();
  let tab = 'crops', seed = 'wheat', paused = false, message = recovered ? 'recovered' : 'welcome', messageValues = {}, lastTime = performance.now(), saveElapsed = 0, modal = null;
  const money = value => value.toLocaleString(I.language);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentMessage = () => t(message, { ...messageValues, ...(messageValues.cropId ? { crop:t(messageValues.cropId) } : {}) });
  function say(key, values = {}) { message = key; messageValues = values; $('message').textContent = currentMessage(); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; }
    $('save-label').textContent = t(storageOK ? 'saved' : 'noSave');
  }
  function html(el, value) {
    if (el._lastHTML === value) return;
    const focused = el.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
    const scroll = el.scrollTop;
    el.innerHTML = value; el._lastHTML = value; el.scrollTop = scroll;
    if (focused) Array.from(el.querySelectorAll('[data-focus]')).find(n => n.dataset.focus === focused)?.focus({ preventScroll: true });
  }
  const label = (key, values) => esc(t(key, values));
  const remaining = n => t('seconds', { n: Math.ceil(n) });
  const ingredients = input => Object.entries(input).map(([k,n]) => `${t(k)} ×${n}`).join(' + ');
  function refreshPlots() {
    html($('plots'), state.plots.map((p, i) => {
      let cls = 'locked', art = '<span class="plot-plus" aria-hidden="true">+</span>', text = t('landPrice', { n: E.landCost(state) }), hint = t('newLand', { n: i + 1 });
      if (p.open) {
        cls = 'empty'; art = '<span class="plot-empty" aria-hidden="true">· · ·</span>'; text = t('sow'); hint = t('emptyPlot', { n: i + 1, crop: t(seed) });
        if (p.crop) {
          cls = p.left <= 0 ? 'ready' : p.watered ? 'watered' : 'growing';
          art = `<span class="plot-art">${A.crop(p.crop, p.left <= 0)}</span>`;
          text = p.left <= 0 ? t('harvest') : `${p.watered ? '◦ ' : '♧ '}${remaining(p.left)}`;
          hint = t('cropPlot', { n: i + 1, crop: t(p.crop), state: p.left <= 0 ? t('harvest') : p.watered ? remaining(p.left) : t('water') + ' · ' + remaining(p.left) });
        }
      }
      return `<button class="plot ${cls}" data-plot="${i}" data-focus="plot-${i}" aria-label="${esc(hint)}" title="${esc(hint)}">${art}<span class="plot-label"><span>${esc(text)}</span></span></button>`;
    }).join(''));
    $('harvest-all').disabled = !state.plots.some(p => p.crop && p.left <= 0) || paused;
  }
  function cropPanel() {
    return `<h2>${label('cropsTitle')}</h2><p class="panel-intro">${label('cropsIntro')}</p><div class="item-list crop-list">${Object.entries(E.CROPS).map(([id,d]) => {
      const locked = E.level(state) < d.level;
      return `<button class="item-card ${seed === id ? 'selected' : ''} ${locked ? 'locked' : ''}" data-seed="${id}" data-focus="seed-${id}" aria-pressed="${seed === id}" ${locked ? 'disabled' : ''}><span class="art">${A.icon(id)}</span><span class="item-info"><span class="item-title">${label(id)}</span><span class="item-meta">${label('cropInfo', { s: d.seconds, n: d.yield })}</span></span><span class="item-action">${locked ? label('unlock', { level: d.level }) : d.cost ? `${d.cost} ◎` : label('free')}<small>${label(seed === id ? 'selected' : 'select')}</small></span></button>`;
    }).join('')}</div><p class="seed-note">${label('seedNote')}</p>`;
  }
  function unitsPanel(kind) {
    const defs = kind === 'animals' ? E.ANIMALS : E.MACHINES, units = kind === 'animals' ? state.animals : state.machines;
    return `<h2>${label(kind + 'Title')}</h2><p class="panel-intro">${label(kind + 'Intro')}</p><div class="item-list unit-list">${Object.entries(defs).map(([id,d]) => {
      const u = units[id], locked = E.level(state) < d.level;
      const action = !u.owned ? 'buy' : !u.active ? 'produce' : 'collect';
      const disabled = locked || (!u.owned ? state.coins < d.cost : u.active ? u.left > 0 : !E.canPay(state, d.input));
      const caption = locked ? t('unlock', { level:d.level }) : !u.owned ? `${d.cost} ◎` : !u.active ? t(kind === 'animals' ? 'feed' : 'produce') : u.left > 0 ? remaining(u.left) : t('collect');
      return `<div class="item-card ${locked ? 'locked' : ''}"><span class="art">${A.icon(id)}</span><span class="item-info"><span class="item-title">${label(id)}</span><span class="item-meta">${esc(ingredients(d.input))}<br>→ ${label(d.output)} ×${d.count} · ${d.seconds}s</span>${u.active ? `<span class="mini-progress"><i style="width:${100 - u.left / d.seconds * 100}%"></i></span>` : ''}</span><span class="item-action"><button data-action="${action}" data-id="${id}" data-focus="unit-${id}" aria-label="${esc(t(id) + ' · ' + caption)}" ${disabled ? 'disabled' : ''}>${esc(caption)}</button></span></div>`;
    }).join('')}</div>`;
  }
  function marketPanel() {
    return `<h2>${label('marketTitle')}</h2><p class="panel-intro">${label('marketIntro')}</p><div class="market-list">${Object.entries(E.PRICES).map(([id,price]) => `<div class="market-item">${A.icon(id)}<strong>${label(id)} ×${state.inventory[id]}</strong><button data-action="sell" data-id="${id}" data-focus="sell-${id}" ${state.inventory[id] === 0 ? 'disabled' : ''}>${label('sell', { n: price })}</button></div>`).join('')}</div>`;
  }
  function refresh() {
    $('coins').textContent = money(state.coins);
    $('level-label').textContent = t('levelLabel', { level: E.level(state), name: t('stage' + E.level(state)) });
    $('level-note').textContent = E.level(state) < 5 ? t('levelNote', { n: 2 - state.delivered % 2 }) : t('grown');
    $('message').textContent = currentMessage();
    $('hint').textContent = t(paused ? 'paused' : 'fieldHint');
    $('save-label').textContent = t(storageOK ? 'saved' : 'noSave');
    $('pause').textContent = paused ? '▷' : 'Ⅱ';
    $('pause').setAttribute('aria-label', t(paused ? 'resume' : 'pause'));
    $('pause').setAttribute('aria-pressed', String(paused));
    $('pause-curtain').hidden = !paused;
    document.body.classList.toggle('is-paused', paused || document.hidden || $('dialog').open);
    refreshPlots();
    document.querySelectorAll('#tabs [data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    html($('panel'), tab === 'crops' ? cropPanel() : tab === 'market' ? marketPanel() : unitsPanel(tab));
    const order = E.order(state);
    $('order-count').textContent = `${String(state.delivered + 1).padStart(2, '0')} / ${state.delivered < 8 ? '08' : '∞'}`;
    html($('order-needs'), Object.entries(order.needs).map(([id,n]) => `<span class="need ${state.inventory[id] < n ? 'missing' : ''}" title="${label(id)}" aria-label="${label(id)} ${state.inventory[id]}/${n}">${A.icon(id)}<span>${state.inventory[id]}/${n}</span></span>`).join(''));
    $('deliver').textContent = t('deliver', { n: order.coins });
    $('deliver').disabled = !E.canPay(state, order.needs) || paused;
    $('animal-dot').hidden = !Object.values(state.animals).some(u => u.active && u.left <= 0);
    $('machine-dot').hidden = !Object.values(state.machines).some(u => u.active && u.left <= 0);
  }
  function perform(action, id, extra) {
    if (paused) { say('paused'); return; }
    const before = E.level(state), result = E.act(state, action, id, extra);
    if (result !== 'invalid') say(result);
    if (E.level(state) > before) say('levelUp', { level:E.level(state) });
    save(); refresh();
    if (result === 'prosperous') openDialog('success');
  }
  function chooseTab(next) {
    if (!['crops','animals','workshop','market'].includes(next)) return;
    tab = next; $('panel').scrollTop = 0; refresh();
  }
  function togglePause() { paused = !paused; lastTime = performance.now(); refresh(); }
  function openDialog(kind, id) {
    modal = { kind, id };
    const body = $('dialog-body'), actions = $('dialog-actions');
    actions.replaceChildren(); body.replaceChildren();
    const p = key => { const node = document.createElement('p'); node.textContent = t(key); body.append(node); };
    const button = (key, fn, primary = false) => { const b = document.createElement('button'); b.className = primary ? 'primary' : 'secondary'; b.textContent = t(key); b.onclick = fn; actions.append(b); };
    if (kind === 'help') {
      $('dialog-title').textContent = t('helpTitle');
      ['help1','help2','help3','help4','help5'].forEach(p);
      button('gotIt', closeDialog, true); button('restart', () => openDialog('reset'));
    } else if (kind === 'reset') {
      $('dialog-title').textContent = t('resetTitle'); p('resetBody');
      button('cancel', closeDialog); button('restart', () => { state = E.create(); seed = 'wheat'; tab = 'crops'; paused = false; say('welcome'); save(); closeDialog(); }, true);
    } else if (kind === 'land') {
      $('dialog-title').textContent = t('landTitle');
      const node = document.createElement('p'); node.textContent = t('landBody', { n:E.landCost(state) }); body.append(node);
      button('cancel', closeDialog); button('expand', () => { closeDialog(); perform('land', id); }, true);
      actions.lastChild.disabled = state.coins < E.landCost(state);
      if (state.coins < E.landCost(state)) p('money');
    } else {
      $('dialog-title').textContent = t('successTitle'); p('successBody'); button('continue', closeDialog, true);
    }
    if (!$('dialog').open) $('dialog').showModal();
    document.body.classList.add('is-paused');
  }
  function closeDialog() { $('dialog').close(); modal = null; lastTime = performance.now(); refresh(); }
  $('dialog').addEventListener('close', () => { modal = null; lastTime = performance.now(); refresh(); });
  $('close-dialog').onclick = closeDialog;
  $('help').onclick = () => openDialog('help');
  $('pause').onclick = togglePause; $('resume').onclick = togglePause;
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => chooseTab(b.dataset.tab));
  $('plots').addEventListener('click', e => {
    const button = e.target.closest('[data-plot]'); if (!button || paused) return;
    const id = Number(button.dataset.plot), p = state.plots[id];
    if (!p.open) openDialog('land', id);
    else if (!p.crop) perform('plant', id, seed);
    else if (p.left <= 0) perform('harvest', id);
    else if (!p.watered) perform('water', id);
    else say('growing', { cropId:p.crop, n:Math.ceil(p.left) });
  });
  $('panel').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.seed) { seed = b.dataset.seed; say('seedSelected', { cropId:seed }); refresh(); }
    else if (b.dataset.action) perform(b.dataset.action, b.dataset.id);
  });
  $('harvest-all').onclick = () => {
    if (paused) return;
    let n = 0; state.plots.forEach((p,i) => { if (p.crop && p.left <= 0) { E.act(state,'harvest',i); n++; } });
    if (n) { say('harvestBatch', { n }); save(); refresh(); }
  };
  $('deliver').onclick = () => perform('deliver');
  window.addEventListener('keydown', e => {
    if ($('dialog').open || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
    if (/^[1-4]$/.test(e.key)) chooseTab(['crops','animals','workshop','market'][Number(e.key)-1]);
    if (e.key.toLowerCase() === 'p') togglePause();
  });
  window.addEventListener('boopland:languagechange', () => { refresh(); if (modal) openDialog(modal.kind, modal.id); });
  document.addEventListener('visibilitychange', () => { lastTime = performance.now(); save(); refresh(); });
  window.addEventListener('pagehide', save);
  $('title-icon').innerHTML = A.icon('sprout');
  $('landscape').innerHTML = A.landscape;
  $('coop-art').innerHTML = A.coop; $('workshop-art').innerHTML = A.workshop;
  document.querySelectorAll('[data-icon]').forEach(n => { n.innerHTML = A.icon(n.dataset.icon); });
  I.apply(); save(); refresh();
  setInterval(() => {
    const now = performance.now(), delta = Math.min(.5, (now-lastTime)/1000); lastTime = now;
    if (paused || document.hidden || $('dialog').open) return;
    E.tick(state, delta); saveElapsed += delta;
    if (saveElapsed >= 5) { saveElapsed = 0; save(); }
    refresh();
  }, 250);
})();
