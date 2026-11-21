(() => {
  'use strict';
  const F = Florist;
  const $ = id => document.getElementById(id);
  const t = (key, data) => BooplandI18n.t('weather-florist.' + key, data);
  const money = value => '¥' + value;
  const shapes = {
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    cloud:'<path d="M5 18a4 4 0 0 1 0-8 6 6 0 0 1 11.7-2.5A5.4 5.4 0 1 1 18 18Z"/>',
    rain:'<path d="M5 14a3.8 3.8 0 0 1 0-7 5 5 0 0 1 9.6-1.5A4.6 4.6 0 1 1 17 14ZM7 17l-2 4m8-4-2 4m8-4-2 4"/>',
    cash:'<path d="M3 7V5l13-2v4m-13 0h17v14H3Zm18 4h-7v6h7Z"/><circle cx="16.8" cy="14" r=".7"/>',
    booked:'<path d="M5 3h14v18l-3-2-3 2-3-2-5 2Zm3 5h8m-8 4h6"/>',
    walk:'<path d="m4 9 2-6h12l2 6M4 9q0 4 4 2 2 3 4 0 2 3 4 0 4 2 4-2ZM6 13v8h12v-8m-8 8v-6h4v6"/>',
    stock:'<path d="m3 7 9-4 9 4-9 4Zm0 0v10l9 4 9-4V7m-9 4v10"/>',
    wilt:'<path d="M4 21q11-2 12-13m-2 4q-8 0-8-7 7 0 8 7Zm1-2q0-7 6-7 1 6-6 7Z"/>',
    pencil:'<path d="M4 20l2-6L16 4l4 4L10 18Zm10-14 4 4M5 18l2 1"/>',
    receipt:'<path d="M5 2h14v20l-3-2-3 2-3-2-5 2Zm3 5h8m-8 4h8m-8 4h5"/>'
  };
  function node(tag, className, content) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (content !== undefined) e.textContent = content;
    return e;
  }
  function icon(key) {
    const e = node('span','icon');
    e.setAttribute('aria-hidden','true');
    e.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">' + shapes[key] + '</svg>';
    return e;
  }
  function botanical(i) {
    const e = node('span','botanical');
    e.style.backgroundPosition = (i * 25) + '% center';
    e.setAttribute('aria-hidden','true');
    return e;
  }
  function button(label, action, key, cls) {
    const b = node('button', cls, label);
    b.type = 'button';
    b.dataset.key = key;
    b.addEventListener('click', action);
    return b;
  }
  const stockButton = () => {
    const b = button(t('stock'), () => showDialog('stock'), 'stock', 'plain');
    b.prepend(icon('stock'));
    return b;
  };
  let state = F.start(), cart = F.empty(), ticket = null, dialogMode = '', noticeTimer;
  const today = () => F.week[state.day];
  const paid = () => state.orders.filter(o => o.paid).length;
  const sumBy = key => F.sum(state.ledger.map(d => d[key]));
  const bouquetStems = recipe => F.bouquets[recipe].stems;
  function notify(text) {
    clearTimeout(noticeTimer);
    $('notice').hidden = !text;
    $('notice').textContent = text;
    if (text) noticeTimer = setTimeout(() => notify(''), 2300);
  }
  function names(counts, emptyText = '—') {
    return counts.map((n, i) => n ? t(F.flowers[i]) + ' ×' + n : '').filter(Boolean).join(' · ') || emptyText;
  }
  function dateName() {
    return new Intl.DateTimeFormat(BooplandI18n.language, {weekday:'long', timeZone:'UTC'})
      .format(new Date(Date.UTC(2024, 0, 1 + state.day)));
  }
  function drawHeader() {
    $('day').replaceChildren(node('strong', '', dateName()), node('span', '', t('day', {n:state.day+1}) + ' / 7'));
    $('marks').replaceChildren(...F.week.map((_, i) => node('i', i <= state.day ? 'filled' : '')));
    $('sky').replaceChildren(icon(today().sky), node('span','',t(today().sky)));
    if (today().festival) $('sky').append(node('span','fair',t('festival')));
    $('rain').hidden = today().sky !== 'rain';
    $('cash').textContent = money(state.cash);
    $('paperTitle').textContent = t(state.phase);
    $('paper').dataset.phase = state.phase;
  }
  function forecastCard(source) {
    const d = today(), buying = state.phase === 'buy', booked = source === 'booked';
    const recipe = booked ? d.booked[0] : d.walk;
    const activeOrders = state.orders.filter(o => o.source === source && !o.paid);
    const countText = buying ? t('due',{n:booked ? d.booked[1] : d.range.join('–')}) : t('remaining',{n:activeOrders.length});
    const chosen = state.orders.some(o => o.id === ticket && o.source === source);
    const card = buying ? node('article', 'ticket') : button('', () => {
      ticket = activeOrders[0].id; render();
    }, source, 'ticket');
    card.classList.add(booked ? 'reserved' : 'visitors');
    if (!buying) {
      card.disabled = !activeOrders.length;
      card.setAttribute('aria-pressed',String(chosen));
    }
    const head = node('div','tickethead');
    head.append(icon(source), node('span','',t(buying && !booked ? 'forecast' : source)));
    const middle = node('div','ticketmid');
    middle.append(node('strong','',t(recipe)),node('span','count',countText));
    card.append(head,middle,node('div','ingredients',names(bouquetStems(recipe))),node('small','ticketprice',money(F.bouquets[recipe].price)));
    return card;
  }
  function smallCard(label, value, detail, img) {
    const e = node('article','ticket summarycard');
    const h = node('div','tickethead');
    h.append(icon(img),node('span','',t(label)));
    e.append(h,node('strong','',value),node('div','ingredients',detail));
    return e;
  }
  function drawLeft() {
    if (['buy','sell'].includes(state.phase)) {
      $('tickets').replaceChildren(forecastCard('booked'), forecastCard('walk'));
      return;
    }
    const last = state.ledger[state.day];
    const wilt = state.phase === 'week' ? F.flowers.map((_,i)=>F.sum(state.ledger.map(r=>r.wilt[i]))) : last.wilt;
    $('tickets').replaceChildren(
      smallCard('carry',t('stems',{n:F.sum(last.carry)}),names(last.carry),'stock'),
      smallCard('wilt',t('stems',{n:F.sum(wilt)}),names(wilt),'wilt')
    );
  }
  function change(i, delta) {
    const next = cart.slice(); next[i] += delta;
    const q = F.quote(state, next);
    if (q.error) { if (q.error !== 'invalid') notify(t(q.error)); return; }
    cart = next; notify(''); render();
  }
  function billLine(key, value) {
    const e = node('div','actionTotal');
    e.append(node('span','',t(key)), node('strong','',value));
    return e;
  }
  function mainButton(key, action) {
    const b = button(t(key), action, key, 'primary');
    b.append(node('span','arrow','→'));
    return b;
  }
  function openShop() {
    if (F.open(state,cart)) return;
    ticket = state.orders[0]?.id;
    cart = F.empty();
    notify(''); render();
  }
  function drawBuy() {
    const stock = F.countStock(state);
    const header = node('div','workhead');
    header.append(node('span','',t('pick')),stockButton());
    $('work').append(header);
    const list = node('div','flowers');
    F.flowers.forEach((kind, i) => {
      const row = node('div','flowerrow' + (cart[i] ? ' picked' : ''));
      const words = node('div','flowername');
      words.append(node('strong','',t(kind)),node('small','',t('life',{n:F.life[i]}) + ' · ' + t('onHand',{n:stock[i]})));
      const dial = node('div','dial');
      const minus = button('−',()=>change(i,-1),'minus'+i,'step');
      minus.disabled = cart[i] === 0;
      const plus = button('+',()=>change(i,1),'plus'+i,'step');
      for (const [b,key] of [[minus,'remove'],[plus,'add']]) b.setAttribute('aria-label',t(key,{flower:t(kind)}));
      dial.append(minus,node('b','',cart[i]),plus);
      row.append(botanical(i),words,node('span','price',money(today().prices[i])),dial); list.append(row);
    });
    $('work').append(list);
    $('actions').append(billLine('spent',money(F.quote(state,cart).cost)),mainButton('open',openShop));
  }
  function posy(recipe) {
    const e = node('div','posy');
    const kinds = bouquetStems(recipe).flatMap((n,i)=>Array(n).fill(i));
    for (const i of kinds) e.append(botanical(i));
    e.append(node('i','wrapper'),node('i','twine'));
    e.setAttribute('aria-hidden','true');
    return e;
  }
  function drawSell() {
    const o = state.orders.find(o => o.id === ticket);
    const header = node('div','workhead');
    header.append(node('span','',t('delivered') + '  ' + paid() + ' / ' + state.orders.length),stockButton());
    $('work').append(header);
    const receipt = node('div','receipt');
    const lead = node('div','receiptlead'), title = node('div');
    title.append(node('small','',t(o.source) + '   № ' + o.id),node('h3','',t(o.recipe)),node('strong','',money(F.bouquets[o.recipe].price)));
    lead.append(posy(o.recipe),title);
    receipt.append(lead,node('div','ruledlabel',t('perBunch')));
    const have = F.countStock(state);
    bouquetStems(o.recipe).forEach((n,i) => {
      if (!n) return;
      const row = node('div','needrow' + (!o.paid && n > have[i] ? ' lacking' : ''));
      row.append(node('strong','',t(F.flowers[i])),node('span','',t('need',{n})),node('small','',t('onHand',{n:have[i]})));
      receipt.append(row);
    });
    const feedback = o.paid ? t(paid() === state.orders.length ? 'fullfilled' : 'received') : !F.canMake(state,o.recipe) ? t('shortStock') : '';
    receipt.append(node('div','feedback',feedback));
    $('work').append(receipt);
    const close = () => { if (F.close(state)) { notify(''); render(); } };
    if (o.paid && paid() === state.orders.length) {
      $('actions').append(billLine('sales',money(state.sales)),mainButton('endDay',close));
    } else {
      $('actions').append(button(t('endDay'),close,'endDay','secondary'));
      if (!o.paid) {
        const b = mainButton('serve', () => {
          const err = F.serve(state,o.id);
          if (err) { if (err === 'shortStock') notify(t(err)); return; }
          notify(t('received') + '  +' + money(F.bouquets[o.recipe].price)); render();
        });
        b.disabled = !F.canMake(state,o.recipe);
        $('actions').append(b);
      } else $('actions').append(mainButton('nextOrder',()=>{
        ticket = state.orders.find(order=>!order.paid).id; notify(''); render();
      }));
    }
  }
  function ledgerRow(key, value, cls = '') {
    const row = node('div','ledgerrow ' + cls);
    row.append(node('span','',t(key)),node('strong','',value));
    return row;
  }
  function drawLedger() {
    const weekly = state.phase === 'week', last = state.ledger[state.day];
    const book = node('div','ledger');
    book.append(ledgerRow('opening',money(weekly ? F.capital : last.opening)),
      ledgerRow('spent','−' + money(weekly ? sumBy('spent') : last.spent)),
      ledgerRow('sales','+' + money(weekly ? sumBy('sales') : last.sales)),
      ledgerRow('closing',money(state.cash),'subtotal'),
      ledgerRow('delivered',weekly ? sumBy('served') + ' / ' + sumBy('requested') : last.served + ' / ' + last.requested),
      ledgerRow('lossCost',money(weekly ? sumBy('lostCost') : last.lostCost)));
    if (weekly) {
      const trend = node('div','trend');
      trend.append(node('small','',t('trend')));
      const chart = node('div','chart');
      const top = Math.max(1, ...state.ledger.map(r=>r.closing));
      state.ledger.forEach(r => {
        const col = node('div','bar',r.closing);
        col.style.setProperty('--height',Math.max(2, r.closing / top * 100) + '%');
        chart.append(col);
      });
      trend.append(chart); book.append(trend);
    }
    $('work').append(book);
    if (weekly) {
      const gain = state.cash - F.capital;
      $('actions').append(billLine('profit',(gain > 0 ? '+' : gain < 0 ? '−' : '') + money(Math.abs(gain))),
        mainButton('again',()=>{ state = F.start(); cart = F.empty(); ticket = null; render(); }));
    } else {
      $('actions').append(stockButton(),mainButton(state.day === 6 ? 'finish' : 'nextDay',()=>{ if (F.next(state)) render(); }));
    }
  }
  function drawDialog() {
    $('dialogTitle').textContent = t(dialogMode);
    $('dialogBody').replaceChildren();
    if (dialogMode === 'guide') {
      for (const [label, key] of [['week','guide1'],['buy','guide2'],['sell','guide3']]) {
        $('dialogBody').append(node('h3','',t(label)),node('p','',t(key)));
      }
    } else {
      const counts = F.countStock(state);
      F.flowers.forEach((kind,i)=>{
        const due = F.sum(state.stock.filter(l=>l.kind === i && l.expires === state.day).map(l=>l.qty));
        const row = node('div','stockrow');
        const text = node('div');
        text.append(node('strong','',t(kind)),node('small','',t('wiltTonight',{n:due})));
        row.append(botanical(i),text,node('b','',t('stems',{n:counts[i]}))); $('dialogBody').append(row);
      });
    }
  }
  function showDialog(mode) {
    dialogMode = mode; drawDialog(); $('dialog').showModal();
  }
  function render() {
    const focusedKey = document.activeElement?.dataset.key;
    drawHeader(); drawLeft();
    $('work').replaceChildren(); $('actions').replaceChildren();
    if (state.phase === 'buy') drawBuy();
    else if (state.phase === 'sell') drawSell();
    else drawLedger();
    if ($('dialog').open) drawDialog();
    else if (focusedKey) document.querySelector('button[data-key="' + focusedKey + '"]:not(:disabled)')?.focus({preventScroll:true});
  }
  $('walletIcon').append(icon('cash'));
  $('help').addEventListener('click',()=>showDialog('guide'));
  $('dismiss').addEventListener('click',()=>$('dialog').close());
  $('dialog').addEventListener('click',e=>{ if (e.target === $('dialog')) {
    const r = $('dialog').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('dialog').close();
  } });
  window.addEventListener('boopland:languagechange',()=>{ notify(''); render(); });
  render();
})();
