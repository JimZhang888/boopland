(() => {
  'use strict';
  const E = window.CornerCoffee, art = window.CoffeeArt, $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('coffee.' + key, values);
  const money = n => '¥' + (n / 10).toFixed(n % 10 ? 1 : 0);
  const write = (el, value) => { const text = String(value); if (el.textContent !== text) el.textContent = text; };
  const storageKey = 'boopland-corner-coffee-v1';
  let game = new E.Game(), storageOK = true, savedAt = 0, message = { key: 'welcome', values: {} };
  let artSignature = '', overlaySignature = '', recipeSignature = '', renderedLanguage = '', lastFrame = 0, lastRender = 0;
  try { game = E.Game.restore(JSON.parse(localStorage.getItem(storageKey))); } catch { storageOK = false; }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(game.snapshot())); storageOK = true; } catch { storageOK = false; } }
  function notify(key, values = {}, warning = false) { message = { key, values, warning }; }
  const orderViews = Array.from({ length: 3 }, (_, index) => {
    const button = document.createElement('button'); button.className = 'order';
    button.innerHTML = '<span class="order-avatar"></span><strong class="order-title"></strong><span class="order-clock"></span><small class="order-label"></small><span class="patience" aria-hidden="true"><i></i></span>';
    button.addEventListener('click', () => perform(() => game.accept(game.shift?.orders[index]?.id)));
    $('orders').append(button);
    return { button, avatar: button.querySelector('.order-avatar'), title: button.querySelector('.order-title'), clock: button.querySelector('.order-clock'), label: button.querySelector('.order-label'), fill: button.querySelector('.patience i'), id: null };
  });
  const ingredientViews = Object.keys(E.ITEMS).map((item, index) => {
    const button = document.createElement('button'); button.className = 'ingredient' + (item === 'espresso' ? ' extract-button' : ''); button.id = 'add-' + item;
    button.innerHTML = '<kbd aria-hidden="true">' + (index + 1) + '</kbd>' + art.icon(item) + '<span class="ingredient-copy"><span></span><small></small></span>';
    button.addEventListener('click', () => perform(() => item === 'espresso' && game.shift?.cup?.extracting ? game.stopExtraction() : game.add(item)));
    $('ingredients').append(button); return { item, button, label: button.querySelector('.ingredient-copy>span'), stock: button.querySelector('small') };
  });
  function perform(action) {
    if (!game.active || $('help-dialog').open || $('confirm-dialog').open) return;
    const result = action();
    if (result.event !== 'inactive') notify('msg_' + result.event, result, !result.ok || ['weak', 'bitter'].includes(result.event));
    save(); render();
  }
  function renderOrders() {
    const s = game.shift;
    orderViews.forEach((view, index) => {
      const order = s?.orders[index];
      view.button.disabled = !game.active || !order || !!s?.cup?.extracting;
      view.button.className = 'order' + (!order ? ' empty-order' : order.id === s.selected ? ' selected' : '') + (order && order.patience / order.total < .25 ? ' urgent' : '');
      for (const el of [view.avatar, view.clock, view.label, view.fill.parentElement]) el.hidden = !order;
      if (!order) { write(view.title, t(s && s.arrived >= s.target ? 'noMore' : 'waiting')); view.button.removeAttribute('aria-pressed'); view.button.removeAttribute('aria-label'); return; }
      if (view.id !== order.id) { view.avatar.innerHTML = art.guest(order.id - 1); view.id = order.id; }
      const seconds = Math.ceil(order.patience / 1000), name = t(E.RECIPES[order.recipe].id);
      write(view.title, name); write(view.clock, seconds + 's');
      write(view.label, t(order.id === s.selected ? 'acceptedOrder' : 'acceptOrder', { n: order.id }));
      view.fill.style.transform = 'scaleX(' + (order.patience / order.total) + ')';
      view.button.setAttribute('aria-pressed', String(order.id === s.selected));
      view.button.setAttribute('aria-label', t('orderLabel', { n: order.id, drink: name, seconds }));
    });
  }
  function renderOverlay(changedLanguage) {
    const state = game.paused ? 'paused' : game.state;
    $('overlay').hidden = state === 'playing'; $('play-area').inert = state !== 'playing';
    const signature = state + ':' + JSON.stringify(game.profile);
    if (signature === overlaySignature && !changedLanguage) return;
    const stateChanged = signature.split(':')[0] !== overlaySignature.split(':')[0]; overlaySignature = signature;
    if (state === 'playing') return;
    const ready = state === 'ready', closed = state === 'closed';
    $('intro-cover').hidden = !ready; $('intro-guide').hidden = !ready; $('results').hidden = !closed; $('upgrade-panel').hidden = !closed;
    $('close-day').hidden = state !== 'paused'; $('new-shop').hidden = ready && game.profile.day === 1 && game.profile.cash === E.CONFIG.startingCash;
    write($('ticket-day'), t('day', { n: game.profile.day }));
    write($('overlay-eyebrow'), t(closed ? 'closedKicker' : 'introKicker'));
    write($('overlay-title'), t(closed ? 'closedTitle' : ready ? 'name' : 'pausedTitle'));
    write($('overlay-description'), t(closed ? 'closedDescription' : ready ? 'introDescription' : 'pausedDescription', { n: game.shift?.served || 0, missed: game.shift?.missed || 0 }));
    write($('start'), t(closed ? 'nextDay' : ready ? 'startDay' : 'resume', { n: closed ? game.profile.day + 1 : game.profile.day }));
    if (closed) {
      const s = game.shift;
      const stats = [['sales', money(s.revenue)], ['tips', money(s.tips)], ['cost', money(s.cost + s.delivery)], ['profit', money(s.revenue + s.tips - s.cost - s.delivery)], ['mistakes', s.mistakes], ['waste', s.waste]];
      $('results').replaceChildren(...stats.map(([key, value]) => { const div = document.createElement('div'), strong = document.createElement('strong'), label = document.createElement('span'); div.className = key; strong.textContent = value; label.textContent = t(key); div.append(strong, label); return div; }));
      write($('upgrade-wallet'), money(game.profile.cash));
      $('upgrades').replaceChildren(...Object.entries(E.UPGRADES).map(([key, price]) => {
        const button = document.createElement('button'), name = document.createElement('strong'), description = document.createElement('small'), cost = document.createElement('span');
        button.className = 'upgrade'; button.id = 'upgrade-' + key; name.textContent = t(key); description.textContent = t(key + 'Description'); cost.textContent = game.profile.upgrades[key] ? t('owned') : money(price);
        button.disabled = game.profile.upgrades[key] || game.profile.cash < price;
        button.append(name, description, cost); button.addEventListener('click', () => { if (game.buy(key)) { save(); render(); } }); return button;
      }));
    }
    if (stateChanged) $('start').focus({ preventScroll: true });
  }
  function render() {
    const languageChanged = renderedLanguage !== BooplandI18n.language; renderedLanguage = BooplandI18n.language;
    const s = game.shift, cup = s?.cup, selected = game.selected;
    write($('day'), t('day', { n: game.profile.day })); write($('day-progress'), t('progress', { n: s?.served || 0, total: s?.target || game.target }));
    write($('revenue'), money((s?.revenue || 0) + (s?.tips || 0))); write($('cost'), money((s?.cost || 0) + (s?.delivery || 0))); write($('wallet'), money(game.profile.cash));
    write($('queue-note'), t('queue', { n: s?.orders.length || 0, total: (s?.target || game.target) - (s?.arrived || 0) }));
    $('pause').disabled = game.state !== 'playing'; $('pause').setAttribute('aria-label', t(game.paused ? 'resume' : 'pause')); $('pause').textContent = game.paused ? '▷' : 'Ⅱ';
    renderOrders();
    const compact = window.matchMedia('(max-width:650px) and (min-height:501px)').matches;
    const signature = JSON.stringify([cup?.parts, cup?.extracting, compact]);
    if (signature !== artSignature) { $('counter-art').innerHTML = art.counter(cup, compact); artSignature = signature; }
    const cupStage = !cup ? 'empty' : cup.rejected ? 'rejected' : cup.parts.includes('lid') ? 'ready' : cup.extracting ? 'extracting' : 'making';
    write($('cup-state'), t(compact ? 'cup_' + cupStage : cupStage + 'Cup'));
    write($('cup-parts'), cup ? cup.parts.map(item => t(item)).join(' · ') : t('cupHint'));
    const [low, high] = game.zone;
    $('safe-zone').style.left = low + '%'; $('safe-zone').style.width = high - low + '%'; $('needle').style.left = (cup?.extraction || 0) + '%';
    $('meter').setAttribute('aria-valuenow', Math.round(cup?.extraction || 0));
    write($('extraction-label'), t('extraction')); write($('extraction-value'), Math.round(cup?.extraction || 0) + '%');
    write($('extraction-tip'), cup?.quality ? t('quality_' + cup.quality) : t('extractionHint', { low, high }));
    const recipe = selected ? E.RECIPES[selected.recipe] : null;
    const rs = (recipe?.id || '') + ':' + (cup?.parts.join(',') || '');
    if (recipeSignature !== rs || languageChanged) {
      recipeSignature = rs; write($('recipe-name'), recipe ? t(recipe.id) : t('chooseOrder')); write($('recipe-price'), recipe ? money(recipe.price) : '');
      $('recipe-steps').replaceChildren(...(recipe?.parts || []).map(item => { const span = document.createElement('span'); span.textContent = (cup?.parts.includes(item) ? '✓ ' : '') + t(item); span.className = cup?.parts.includes(item) ? 'done' : ''; return span; }));
    }
    for (const view of ingredientViews) {
      const running = view.item === 'espresso' && cup?.extracting;
      view.button.disabled = !game.active || (!running && (!selected || (view.item === 'cup' ? !!cup : !cup || cup.extracting || cup.parts.includes('lid') || cup.parts.includes(view.item)) || !s.stock[view.item]));
      view.button.classList.toggle('running', !!running); view.button.classList.toggle('taken', !!cup?.parts.includes(view.item));
      write(view.label, t(running ? 'stopExtraction' : view.item === 'espresso' ? 'startExtraction' : 'action_' + view.item));
      write(view.stock, running ? t('stopHint') : t('stock', { n: s?.stock[view.item] || 0 }));
    }
    $('serve').disabled = !game.active || !selected || !cup?.parts.includes('lid') || cup.rejected;
    $('discard').disabled = !game.active || !cup; $('restock').disabled = !game.active || Object.values(s?.stock || {}).every(n => n >= 4);
    const values = { ...message.values }; if (values.item) values.item = t(values.item); if (values.earned !== undefined) values.earned = money(values.earned); if (values.tip !== undefined) values.tip = money(values.tip);
    write($('message'), t(message.key, values)); $('message').className = message.warning ? 'warning' : '';
    write($('save-status'), t(storageOK ? 'saved' : 'memoryOnly')); write($('overlay-save'), t(storageOK ? 'saved' : 'memoryOnly'));
    renderOverlay(languageChanged);
  }
  function pause(value = true) { game.pause(value); lastFrame = 0; save(); render(); }
  $('start').addEventListener('click', () => { if (game.state === 'closed') game.nextDay(); else if (game.state === 'ready') game.start(); else game.pause(false); notify('welcome'); lastFrame = 0; save(); render(); });
  $('pause').addEventListener('click', () => pause(!game.paused));
  $('discard').addEventListener('click', () => perform(() => game.discard())); $('serve').addEventListener('click', () => perform(() => game.serve())); $('restock').addEventListener('click', () => perform(() => game.restock()));
  $('help').addEventListener('click', () => { pause(); $('help-dialog').showModal(); });
  for (const id of ['help-close', 'help-done']) $(id).addEventListener('click', () => $('help-dialog').close());
  let pending = null;
  function confirm(kind, action) { pending = action; write($('confirm-title'), t(kind)); write($('confirm-description'), t(kind + 'Confirm')); $('confirm-dialog').showModal(); }
  $('new-shop').addEventListener('click', () => confirm('newShop', () => { game = new E.Game(); notify('welcome'); }));
  $('close-day').addEventListener('click', () => confirm('closeDay', () => { game.close(); }));
  $('confirm-cancel').addEventListener('click', () => $('confirm-dialog').close());
  $('confirm-ok').addEventListener('click', () => { pending?.(); pending = null; $('confirm-dialog').close(); save(); render(); });
  $('confirm-dialog').addEventListener('close', () => { pending = null; });
  window.addEventListener('keydown', event => {
    if ($('help-dialog').open || $('confirm-dialog').open || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === 'p' || key === 'escape') { event.preventDefault(); pause(!game.paused); return; }
    if (!game.active) return;
    if (/^[1-7]$/.test(key)) { event.preventDefault(); ingredientViews[Number(key) - 1].button.click(); }
    else if (key === 'x') { event.preventDefault(); $('discard').click(); }
    else if (key === 'enter' && event.target === document.body) { event.preventDefault(); $('serve').click(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', () => pause()); window.addEventListener('pagehide', () => pause());
  window.addEventListener('boopland:languagechange', render);
  function frame(now) {
    if (lastFrame && game.active) {
      const events = game.tick(Math.min(250, now - lastFrame));
      // Arrival messages never replace a useful recipe/error message.
      for (const event of events) if (event.event !== 'arrived') notify('msg_' + event.event, event, !event.ok || event.event === 'bitter');
      if (game.state === 'closed' || now - savedAt > 1500) { save(); savedAt = now; }
    }
    lastFrame = now;
    if (now - lastRender > 60) { render(); lastRender = now; }
    requestAnimationFrame(frame);
  }
  render(); requestAnimationFrame(frame);
})();
