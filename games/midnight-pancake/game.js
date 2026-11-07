(() => {
  'use strict';
  const E = window.MidnightPancake, art = window.PancakeArt;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('pancake.' + key, values);
  const game = new E.Game();
  const shell = $('shell'), overlay = $('overlay'), help = $('help-dialog');
  const storageKey = 'boopland-midnight-pancake-best-v1';
  let best = 0, storageOK = true, newBest = false;
  let frame = 0, lastTime = 0, sound = false, audio = null;
  let message = { key: 'pourTip', values: {}, kind: '', until: Infinity };
  let overlayState = '', renderedLanguage = '', orderSignatures = ['', '', ''];
  const write = (node, value) => { const next = String(value); if (node.textContent !== next) node.textContent = next; };
  try { best = E.cleanBest(JSON.parse(localStorage.getItem(storageKey))); } catch { storageOK = false; }

  $('intro-art').innerHTML = art.pan();
  const pans = Array.from({ length: 2 }, (_, index) => {
    const button = document.createElement('button');
    button.className = 'pan'; button.dataset.stage = 'empty';
    button.innerHTML = '<span class="pan-number"><b>' + (index + 1).toString().padStart(2, '0') + '</b><span class="pan-name"></span><i class="selected-dot"></i></span>' + art.pan() + '<span class="pan-status"></span><span class="heat-track" aria-hidden="true"><i class="heat-safe"></i><i class="heat-fill"></i><i class="heat-pin"></i></span>';
    button.addEventListener('click', () => selectPan(index));
    $('pans').append(button);
    return { button, name: button.querySelector('.pan-name'), status: button.querySelector('.pan-status'), fill: button.querySelector('.heat-fill'), pin: button.querySelector('.heat-pin'), toppings: [...button.querySelectorAll('.topping')] };
  });
  const orders = Array.from({ length: 3 }, (_, index) => {
    const button = document.createElement('button'); button.className = 'order waiting';
    button.addEventListener('click', () => perform(() => game.serve(index)));
    $('orders').append(button); return { button };
  });
  const ingredients = E.INGREDIENTS.map((name, index) => {
    const button = document.createElement('button'); button.className = 'ingredient';
    button.innerHTML = '<kbd aria-hidden="true">' + 'QWERT'[index] + '</kbd>' + art.ingredient(index) + '<span class="ingredient-name"></span><span class="check" aria-hidden="true">✓</span>';
    button.addEventListener('click', () => perform(() => game.ingredient(index)));
    $('ingredients').append(button); return { button, label: button.querySelector('.ingredient-name'), name };
  });

  function beep(event) {
    if (!sound || document.hidden || game.paused || help.open) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const notes = { pour: [240, 300], flip: [410], perfectFlip: [440, 660], ingredient: [520], wrap: [330, 440], serve: [520, 660, 780], burn: [150, 110], wrongOrder: [220, 180], leave: [200], ready: [580], finish: [440, 550, 660], start: [330, 440, 550], toggle: [500] }[event];
      if (!notes) return;
      notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + i * .075;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.045, at + .012); gain.gain.exponentialRampToValueAtTime(.001, at + .14);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + .16);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { sound = false; }
  }
  function stopSound() { if (audio?.state === 'running') audio.suspend().catch(() => {}); }
  function notify(key, values = {}, kind = '', duration = 4200) {
    message = { key, values, kind, until: game.elapsed + duration };
    $('message').className = kind;
    // Restart the small feedback motion without replacing the live region.
    $('message').classList.remove('pop');
    if (typeof $('message').animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $('message').animate([{ opacity: .4, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220 });
    }
  }
  function selectPan(index) { if (game.select(index)) render(); }
  function perform(command) {
    if (!game.active || help.open) return;
    const result = command();
    const key = {
      pour: 'msgPour', perfectFlip: 'msgPerfectFlip', flip: 'msgFlip', wrap: 'msgWrap', serve: 'msgServe',
      wrongOrder: 'msgWrongOrder', needEgg: 'msgNeedEgg', discard: 'msgDiscard', tooEarly: 'msgTooEarly',
      wrapFirst: 'msgWrapFirst', chooseGuest: 'wrappedTip', flipFirst: 'frontTip'
    }[result.event];
    if (key) notify(key, result, result.ok ? 'positive' : 'warning');
    if (result.ok || result.event === 'wrongOrder') beep(result.event);
    render();
  }
  function status(pan) {
    if (pan.stage === 'front') return pan.heat >= E.FRONT_BURN - 1800 ? 'danger' : pan.heat >= E.FRONT_READY ? 'frontReady' : 'frontCooking';
    if (pan.stage === 'back') return pan.heat >= E.BACK_BURN - 3000 ? 'danger' : pan.heat >= E.BACK_READY ? 'backReady' : 'backCooking';
    return pan.stage;
  }
  function tip() { return { empty: 'pourTip', front: 'frontTip', back: 'backTip', wrapped: 'wrappedTip', burnt: 'burntTip' }[game.pan.stage]; }
  function renderOrders(languageChanged) {
    orders.forEach((view, slot) => {
      const order = game.orders[slot];
      const signature = order ? order.id + ':' + order.mask : 'empty';
      if (signature !== orderSignatures[slot] || languageChanged) {
        orderSignatures[slot] = signature;
        if (!order) {
          view.button.innerHTML = '<span class="waiting-note"><svg viewBox="0 0 60 40" aria-hidden="true"><path d="M9 32h43M17 32V21h27v11M21 21V10h18v11M24 10V6h12v4m-9 27h8"/><path d="m7 11 3-3m40 4 3 3"/></svg><span></span></span>';
          write(view.button.querySelector('.waiting-note span'), t('arriving'));
          view.button.setAttribute('aria-label', t('arriving'));
        } else {
          view.button.innerHTML = '<span class="guest-row"><span class="guest-avatar">' + art.guest(order.face) + '</span><span class="guest-info"><b></b><small></small></span><span class="wait-time"></span></span><span class="recipe"></span><span class="patience" aria-hidden="true"><i></i></span>';
          view.guest = view.button.querySelector('.guest-info b'); view.ticket = view.button.querySelector('.guest-info small');
          view.wait = view.button.querySelector('.wait-time'); view.patience = view.button.querySelector('.patience i');
          const recipe = view.button.querySelector('.recipe');
          E.INGREDIENTS.forEach((name, index) => {
            if (!(order.mask & (1 << index))) return;
            const item = document.createElement('span'); item.className = 'recipe-item';
            item.innerHTML = art.ingredient(index) + '<span></span>'; write(item.lastElementChild, t(name));
            item.title = t(name); recipe.append(item);
          });
          write(view.guest, t('guest' + order.face));
        }
      }
      view.button.disabled = !game.active || !order;
      view.button.classList.toggle('waiting', !order);
      const matches = Boolean(order && game.pan.stage === 'wrapped' && order.mask === game.pan.ingredients);
      view.button.classList.toggle('can-serve', matches && game.active);
      view.button.classList.toggle('urgent', Boolean(order && order.patience / order.total < .25));
      if (!order) return;
      const seconds = Math.max(0, Math.ceil(order.patience / 1000));
      write(view.ticket, matches ? t('serveHere') : t('order', { n: order.id.toString().padStart(2, '0') }));
      write(view.wait, seconds + 's');
      view.patience.style.transform = 'scaleX(' + Math.max(0, order.patience / order.total) + ')';
      const label = t('orderLabel', { guest: t('guest' + order.face), items: E.INGREDIENTS.filter((_, i) => order.mask & (1 << i)).map(name => t(name)).join(' · '), seconds });
      if (view.button.getAttribute('aria-label') !== label) view.button.setAttribute('aria-label', label);
    });
  }
  function renderOverlay(languageChanged) {
    const state = game.paused ? 'paused' : game.state;
    overlay.hidden = state === 'playing';
    $('play-area').inert = state !== 'playing';
    if (state === 'playing' || (state === overlayState && !languageChanged)) return;
    overlayState = state;
    const ready = state === 'ready', paused = state === 'paused';
    $('quick-guide').hidden = !ready; $('result-stats').hidden = state !== 'finished'; $('restart').hidden = !paused;
    write($('overlay-kicker'), t(ready || paused ? 'introKicker' : 'endKicker'));
    write($('overlay-title'), t(ready ? 'name' : paused ? 'pausedTitle' : 'endTitle'));
    write($('overlay-description'), t(ready ? 'introDescription' : paused ? 'pausedDescription' : 'endDescription', { count: game.served }));
    write($('start'), t(ready ? 'start' : paused ? 'resume' : 'again'));
    write($('overlay-foot'), t(ready ? 'roundNote' : newBest && storageOK ? 'newBest' : storageOK ? 'saved' : 'memoryOnly'));
    if (state === 'finished') {
      const results = [['earnings', '¥' + game.coins], ['served', game.served], ['bestCombo', '×' + game.bestCombo], ['perfects', game.perfects], ['missed', game.missed], ['waste', game.waste]];
      $('result-stats').replaceChildren(...results.map(([key, value]) => {
        const item = document.createElement('div'), number = document.createElement('strong'), label = document.createElement('span');
        number.textContent = value; label.textContent = t(key); item.append(number, label); return item;
      }));
    }
  }
  function render() {
    const language = BooplandI18n.language, languageChanged = language !== renderedLanguage;
    renderedLanguage = language;
    const state = game.paused ? 'paused' : game.state;
    shell.dataset.state = state;
    write($('coins'), game.coins); write($('served'), game.served); write($('combo'), '×' + game.combo);
    write($('phase'), t('phase' + game.phase)); write($('best'), t('best', { value: best }));
    const seconds = Math.ceil(game.remaining / 1000);
    write($('timer'), Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'));
    document.querySelector('.timer-stat').classList.toggle('urgent', seconds <= 15);
    $('combo-fill').style.width = (game.combo ? Math.max(0, 1 - (game.elapsed - game.lastServe) / E.COMBO_WINDOW) * 100 : 0) + '%';
    pans.forEach((view, index) => {
      const pan = game.pans[index], statusKey = status(pan), isReady = ['frontReady', 'backReady', 'danger'].includes(statusKey);
      view.button.dataset.stage = pan.stage; view.button.dataset.ready = String(isReady);
      view.button.dataset.danger = String(statusKey === 'danger');
      view.button.classList.toggle('selected', index === game.selected);
      view.button.setAttribute('aria-pressed', String(index === game.selected));
      view.button.disabled = !game.active;
      write(view.name, t('panNumber', { n: index + 1 })); write(view.status, t(statusKey));
      view.button.setAttribute('aria-label', t('panLabel', { n: index + 1, status: t(statusKey) }));
      const percent = pan.stage === 'burnt' ? 100 : Math.min(100, pan.heat / (pan.stage === 'front' ? E.FRONT_BURN : E.BACK_BURN) * 100);
      view.fill.style.width = percent + '%'; view.pin.style.left = 'calc(' + percent + '% - 1px)';
      view.toppings.forEach(node => {
        const ingredientIndex = Number([...node.classList].find(c => /^topping-\d$/.test(c)).slice(-1));
        node.classList.toggle('is-added', Boolean(pan.ingredients & (1 << ingredientIndex)));
      });
    });
    renderOrders(languageChanged);
    ingredients.forEach((view, index) => {
      write(view.label, t(view.name)); view.button.disabled = !game.active || game.pan.stage !== 'back';
      const added = Boolean(game.pan.ingredients & (1 << index));
      view.button.classList.toggle('added', added); view.button.setAttribute('aria-pressed', String(added));
      view.button.setAttribute('aria-label', t(view.name));
    });
    const pan = game.pan;
    const actionKey = { empty: 'pour', front: 'flip', back: 'wrap', wrapped: 'chooseGuest', burnt: 'clear' }[pan.stage];
    write($('action-label'), t(actionKey));
    $('action').disabled = !game.active || pan.stage === 'wrapped' || (pan.stage === 'front' && pan.heat < E.FRONT_READY) || (pan.stage === 'back' && pan.heat < E.BACK_READY);
    $('discard').disabled = !game.active || pan.stage === 'empty';
    write($('prep-tip'), t(tip())); write($('selected-pan'), t('panNumber', { n: game.selected + 1 }));
    if (game.elapsed >= message.until) message = { key: tip(), values: {}, kind: '', until: game.elapsed + 2500 };
    write($('message'), t(message.key, message.values)); $('message').className = message.kind;
    $('pause').disabled = game.state !== 'playing'; $('pause').setAttribute('aria-label', t(game.paused ? 'resume' : 'pause'));
    $('pause-mark').setAttribute('d', game.paused ? 'm8 5 11 7-11 7Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound-mark').setAttribute('d', sound ? 'M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm17 9 5 6m0-6-5 6');
    renderOverlay(languageChanged);
  }
  function saveResult() {
    newBest = game.coins > best;
    if (newBest) {
      best = game.coins;
      try { localStorage.setItem(storageKey, JSON.stringify(best)); } catch { storageOK = false; }
    }
  }
  function tick(now) {
    frame = 0;
    if (!game.active || document.hidden || help.open) return;
    const events = game.tick(lastTime ? Math.min(100, Math.max(0, now - lastTime)) : 0); lastTime = now;
    for (const event of events) {
      if (event.event === 'burn') notify('msgBurn', { n: event.pan + 1 }, 'warning');
      if (event.event === 'leave') notify('msgLeave', {}, 'warning');
      if (event.event === 'rush') notify('msgRush', {}, 'positive', 5000);
      if (event.event === 'finish') saveResult();
      beep(event.event);
    }
    render();
    if (game.active) frame = requestAnimationFrame(tick);
    else { lastTime = 0; $('start').focus({ preventScroll: true }); }
  }
  function stopLoop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function run() { if (!frame && game.active && !document.hidden && !help.open) { lastTime = 0; frame = requestAnimationFrame(tick); } }
  function start() {
    stopLoop(); game.start(); newBest = false; overlayState = '';
    notify('pourTip', {}, '', 6000); beep('start'); render(); run(); $('action').focus({ preventScroll: true });
  }
  function pause(value, focus = true) {
    if (game.state !== 'playing') return;
    game.pause(value); stopLoop(); if (value) stopSound();
    overlayState = ''; render();
    if (value && focus && !help.open) $('start').focus({ preventScroll: true });
    if (!value) { run(); $('action').focus({ preventScroll: true }); }
  }
  $('action').addEventListener('click', () => perform(() => game.action()));
  $('discard').addEventListener('click', () => perform(() => game.discard()));
  $('start').addEventListener('click', () => game.paused ? pause(false) : start());
  $('restart').addEventListener('click', start);
  $('pause').addEventListener('click', () => pause(!game.paused));
  $('sound').addEventListener('click', () => { sound = !sound; if (sound) beep('toggle'); else stopSound(); render(); });
  $('help').addEventListener('click', () => { pause(true, false); stopSound(); help.showModal(); });
  $('close-help').addEventListener('click', () => help.close());
  $('help-done').addEventListener('click', () => help.close());
  help.addEventListener('close', () => { render(); if (game.paused) $('start').focus({ preventScroll: true }); });
  document.addEventListener('keydown', event => {
    if (help.open || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select')) return;
    if (event.code === 'KeyP' || event.code === 'Escape') { if (game.state === 'playing') { event.preventDefault(); pause(!game.paused); } return; }
    if (!game.active) return;
    if (event.code === 'Space') {
      if (event.target.closest('button,a') && !event.target.closest('#play-area')) return;
      event.preventDefault(); perform(() => game.action());
    }
    if (event.code === 'Digit1' || event.code === 'Digit2') { event.preventDefault(); selectPan(Number(event.code.slice(-1)) - 1); }
    const ingredient = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'].indexOf(event.code);
    if (ingredient >= 0) { event.preventDefault(); perform(() => game.ingredient(ingredient)); }
    const customer = ['Digit7', 'Digit8', 'Digit9'].indexOf(event.code);
    if (customer >= 0) { event.preventDefault(); perform(() => game.serve(customer)); }
    if (event.code === 'KeyX') { event.preventDefault(); perform(() => game.discard()); }
  });
  window.addEventListener('blur', () => { if (game.active) pause(true, false); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(true, false); stopLoop(); stopSound(); } });
  window.addEventListener('pagehide', () => { pause(true, false); stopLoop(); stopSound(); });
  window.addEventListener('pageshow', () => { render(); run(); });
  window.addEventListener('boopland:languagechange', () => { document.title = t('pageTitle'); render(); });
  document.title = t('pageTitle'); render();
})();
