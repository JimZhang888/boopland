(() => {
  'use strict';
  const inn = HillsideInn;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('hillside-inn.' + key, values);
  const icon = key => '<svg class="ico" aria-hidden="true"><use href="#i-' + key + '"/></svg>';
  const themes = [
    ['camera','#b28566','#ecdeca'], ['journal','#8a9d87','#e1e7d9'],
    ['pack','#a79577','#ece5d2'], ['flask','#8b9b9b','#dfe7e1'], ['hat','#ba9972','#eee1ca']
  ];
  const labels = Object.fromEntries(inn.arrivals.flatMap((day, d) => day.map((g, i) => [g.id, themes[(i + d) % themes.length]])));
  let state = inn.create();
  let selected = null;
  let message = null;
  let sheet = null;
  let reportDay = 0;
  let drag = null;
  let suppressClick = false;
  const guestName = id => t(id);
  const duration = n => t(n === 1 ? 'oneNight' : 'nights', { n });
  const roomName = i => t('room', { n: inn.roomNumber(i) });
  const totals = key => state.book.reduce((sum, line) => sum + line[key], 0);
  const isDesk = () => state.phase === 'desk';
  const wishText = (g, wish) => wish === 'pair' ? t('pair', { name: guestName(g.friend) }) : t(wish);
  function describe(g) {
    return [guestName(g.id), duration(g.nights), ...g.wishes.map(w => wishText(g, w)), t('rate', { n:g.rate })].join(' · ');
  }
  function button(className, html, action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.innerHTML = html;
    if (action) b.addEventListener('click', action);
    return b;
  }
  function renderRooms() {
    const nodes = inn.rooms.map((n, i) => {
      const stay = state.beds[i];
      const fixed = stay && stay.since < state.day;
      const feature = inn.east(i) ? 'sun' : 'quiet';
      const occupant = stay ? guestName(stay.id) : t('empty');
      const b = button('room' + (stay ? ' assigned' : '') + (inn.east(i) ? ' east' : '') +
        (selected && stay?.id === selected ? ' selected' : ''),
        '<span class="roomTop"><b class="roomNum">' + n + '</b>' + icon(feature) + '</span>' +
        '<span class="roomBottom"><span class="roomGuest">' + (fixed ? icon('lock') : '') + occupant + '</span></span>');
      b.id = 'room-' + n;
      b.dataset.room = i;
      if (stay && !fixed) b.dataset.drag = stay.id;
      b.disabled = !isDesk();
      const description = [roomName(i), t(feature), occupant];
      if (stay) description.push(duration(inn.remaining(state, stay)));
      if (fixed) description.push(t('locked'));
      b.setAttribute('aria-label', description.join(' · '));
      b.title = description.join(' · ');
      return b;
    });
    $('rooms').replaceChildren(...nodes);
  }
  function renderCards() {
    const bookings = inn.arrivals[state.day];
    $('cards').style.setProperty('--count', bookings.length);
    $('cards').replaceChildren(...bookings.map(g => {
      const index = inn.locate(state, g.id);
      const [tag, edge, tint] = labels[g.id];
      const wishes = g.wishes.map(wish => '<span class="' + wish + '" title="' + wishText(g, wish) + '">' +
        icon(wish) + (wish === 'pair' ? guestName(g.friend) : '<span class="compactWish">' + t(wish) + '</span>') + '</span>').join('');
      const room = index < 0 ? '' : '<span class="miniRoom">' + icon('check') + inn.roomNumber(index) + '</span>';
      const html = '<span class="memento"><svg aria-hidden="true"><use href="#tag-' + tag + '"/></svg></span>' +
        '<span class="cardCopy"><span class="cardTop"><strong class="name">' + guestName(g.id) + '</strong>' + room +
        '<span class="rate">' + icon('coin') + g.rate + '</span></span><span class="cardBits"><span>' +
        icon('moon') + '<span>' + duration(g.nights) + '</span></span>' + wishes + '</span></span>';
      const b = button('card' + (index < 0 ? '' : ' booked') + (selected === g.id ? ' selected' : ''), html);
      b.id = 'card-' + g.id;
      b.dataset.card = b.dataset.drag = g.id;
      b.disabled = !isDesk();
      b.setAttribute('aria-pressed', String(selected === g.id));
      b.setAttribute('aria-label', describe(g) + (index < 0 ? '' : ' · ' + roomName(index)));
      b.title = describe(g);
      b.style.setProperty('--tag', edge);
      b.style.setProperty('--tint', tint);
      return b;
    }));
  }
  function helpText() {
    if (!isDesk()) return t(state.phase === 'receipt' ? 'reviewMsg' : 'doneMsg');
    if (!message) return selected ? t('pick', { name:guestName(selected) }) : t('select');
    const { key, id, n } = message;
    return t(key, { name:id ? guestName(id) : '', n });
  }
  function render() {
    const focused = document.activeElement?.id;
    $('day').textContent = t('day', { n:state.day + 1 });
    document.querySelectorAll('.daydots i').forEach((dot, i) => dot.classList.toggle('on', i <= state.day));
    $('cash').textContent = totals('fee');
    $('stars').textContent = totals('praise');
    $('occupancy').textContent = t('occupied', { n:state.beds.filter(Boolean).length });
    $('waiting').textContent = isDesk() ? t('waiting', { n:inn.pending(state).length }) : '';
    renderRooms();
    renderCards();
    $('guidance').textContent = helpText();
    $('unassign').hidden = !(isDesk() && selected && inn.locate(state, selected) >= 0);
    $('unassign').setAttribute('aria-label', t('remove'));
    $('confirm').firstElementChild.textContent = isDesk() ? t('confirm') :
      state.phase === 'done' ? t('final') : t('receipt', { n:state.day + 1 });
    if (sheet) renderSheet();
    else if (focused && document.activeElement === document.body) $(focused)?.focus({ preventScroll:true });
  }
  function choose(id) {
    selected = selected === id ? null : id;
    message = null;
    render();
  }
  function assign(id, index) {
    const stay = state.beds[index];
    if (inn.place(state, id, index)) {
      selected = null;
      message = { key:'placed', id, n:inn.roomNumber(index) };
    } else if (stay) {
      message = { key:'lockedMsg', id:stay.id, n:inn.remaining(state, stay) };
    }
    render();
  }
  function takeBack(id) {
    if (!inn.remove(state, id)) return;
    selected = null;
    message = { key:'movedOut', id };
    render();
  }
  function tapRoom(i) {
    const stay = state.beds[i];
    if (selected) return assign(selected, i);
    if (stay && stay.since === state.day) return choose(stay.id);
    message = stay ? { key:'lockedMsg', id:stay.id, n:inn.remaining(state, stay) } : null;
    render();
  }
  document.querySelector('.desk').addEventListener('click', e => {
    if (!isDesk() || (suppressClick && e.detail !== 0)) return;
    const card = e.target.closest('[data-card]');
    if (card) return choose(card.dataset.card);
    const room = e.target.closest('[data-room]');
    if (room) tapRoom(Number(room.dataset.room));
  });
  $('unassign').addEventListener('click', () => takeBack(selected));

  function stopDrag() {
    if (drag?.node.hasPointerCapture(drag.pointer)) drag.node.releasePointerCapture(drag.pointer);
    drag = null;
    $('ghost').hidden = true;
    document.querySelector('.room.target')?.classList.remove('target');
  }
  document.querySelector('.desk').addEventListener('pointerdown', e => {
    const node = e.target.closest('[data-room],[data-card]');
    if (!isDesk() || !node || e.button !== 0 || !e.isPrimary || drag) return;
    suppressClick = false;
    drag = { pointer:e.pointerId, id:node.dataset.drag, x:e.clientX, y:e.clientY, active:false, node };
    node.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove', e => {
    if (!drag || drag.pointer !== e.pointerId) return;
    if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.active = true;
    if (!drag.id) return;
    const ghost = $('ghost');
    ghost.hidden = false;
    ghost.textContent = guestName(drag.id);
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-room]');
    document.querySelector('.room.target')?.classList.remove('target');
    under?.classList.add('target');
  });
  document.addEventListener('pointerup', e => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const { id, active, node } = drag;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    stopDrag();
    suppressClick = true;
    if (!active) {
      if (!node.contains(under)) return;
      if (node.dataset.card) choose(node.dataset.card);
      else tapRoom(Number(node.dataset.room));
      return;
    }
    if (!id) return;
    const room = under?.closest('[data-room]');
    if (room) assign(id, Number(room.dataset.room));
    else if (under?.closest('.orders')) takeBack(id);
  });
  document.addEventListener('pointercancel', stopDrag);
  window.addEventListener('blur', stopDrag);

  function openSheet(kind, day = state.day) {
    stopDrag();
    sheet = kind;
    reportDay = day;
    renderSheet();
    if (!$('sheet').open) $('sheet').showModal();
    $('sheetBody').scrollTop = 0;
    $('dismiss').focus({ preventScroll:true });
  }
  function closeSheet() {
    sheet = null;
    if ($('sheet').open) $('sheet').close();
  }
  function fresh() {
    closeSheet();
    state = inn.create();
    selected = message = null;
    render();
  }
  function settle() {
    if (!inn.settle(state)) return;
    selected = message = null;
    sheet = null;
    render();
    openSheet('receipt');
  }
  function advance() {
    if (!inn.advance(state)) return;
    closeSheet();
    selected = message = null;
    render();
    if (state.phase === 'done') openSheet('final');
    else $('card-' + inn.arrivals[state.day][0].id)?.focus({ preventScroll:true });
  }
  const action = (key, fn, primary = true) => button(primary ? 'primary' : 'secondary', t(key), fn);
  const summary = (fee, praise) => '<div class="sheetTotals"><span>' + icon('coin') + ' ' + t('nightFees',{n:fee}) +
    '</span><span>' + icon('praise') + ' ' + t('nightPraise',{n:praise}) + '</span></div>';
  function receipt(day) {
    const night = state.book[day];
    return summary(night.fee, night.praise) + night.entries.map(entry => {
      const details = entry.details.map(d => '<div class="detail' + (d.ok ? '' : ' miss') + '">' +
        icon(d.ok ? 'check' : 'close') + t(d.reason, { name:d.friend ? guestName(d.friend) : '' }) +
        (d.ok ? ' +10' : '') + '</div>').join('');
      return '<div class="guestRow"><div class="rowHead"><b>' + guestName(entry.id) + '</b><span>' + t('room',{n:entry.room}) +
        '</span><span class="price">' + icon('coin') + entry.fee + ' ' + icon('praise') + entry.praise + '</span></div>' +
        '<div class="detail">' + icon('coin') + t('rate',{n:inn.guests[entry.id].rate}) + '</div>' + details + '</div>';
    }).join('') + night.declined.map(d => '<div class="guestRow"><b>' + guestName(d.id) + '</b><div class="detail miss">' +
      icon('close') + t(d.reason) + '</div></div>').join('');
  }
  function renderSheet() {
    const body = $('sheetBody'), actions = $('actions');
    const title = $('sheetTitle');
    actions.replaceChildren();
    if (sheet === 'help') {
      title.textContent = t('help');
      body.innerHTML = [['key','helpMove'],['quiet','helpRooms'],['coin','helpPay']].map(([i, k]) =>
        '<p class="guideLine">' + icon(i) + '<span>' + t(k) + '</span></p>').join('');
      actions.append(action('ok', closeSheet));
    } else if (sheet === 'restart') {
      title.textContent = t('restart');
      body.textContent = t('discard');
      actions.append(action('close', closeSheet, false), action('restart', fresh));
    } else if (sheet === 'decline') {
      title.textContent = t('declineTitle');
      body.innerHTML = '<p>' + t('willLeave') + '</p><p><b>' + inn.pending(state).map(g => guestName(g.id)).join(' · ') + '</b></p>';
      actions.append(action('cancel', closeSheet, false), action('settleAnyway', settle));
    } else if (sheet === 'receipt') {
      title.textContent = t('receipt', { n:reportDay + 1 });
      body.innerHTML = receipt(reportDay);
      if (state.phase === 'done') actions.append(action('final', () => openSheet('final')));
      else actions.append(action(state.day === 2 ? 'final' : 'next', advance));
    } else if (sheet === 'final') {
      title.textContent = t('final');
      body.innerHTML = summary(totals('fee'), totals('praise')) + '<p class="historyHint">' + t('history') + '</p>';
      state.book.forEach((night, i) => {
        body.append(button('historyBtn', '<strong>' + t('receipt',{n:i+1}) + '</strong>' + icon('coin') + night.fee +
          ' ' + icon('praise') + night.praise + icon('forward'), () => openSheet('receipt', i)));
      });
      actions.append(action('replay', fresh));
    }
  }
  $('help').addEventListener('click', () => openSheet('help'));
  $('restart').addEventListener('click', () => openSheet('restart'));
  $('dismiss').addEventListener('click', closeSheet);
  $('sheet').addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
  $('sheet').addEventListener('click', e => {
    if (e.target !== $('sheet')) return;
    const r = $('sheet').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeSheet();
  });
  $('confirm').addEventListener('click', () => {
    if (state.phase === 'receipt' || state.phase === 'done') return openSheet(state.phase === 'done' ? 'final' : 'receipt');
    if (inn.pending(state).length) openSheet('decline');
    else settle();
  });
  window.addEventListener('boopland:languagechange', () => { stopDrag(); render(); });
  render();
})();
