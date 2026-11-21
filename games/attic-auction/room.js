'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const t = (key, vars) => BooplandI18n.t('attic-auction.' + key, vars);
  const names = ['you', 'lin', 'yu'];
  const labels = ['maker', 'wear', 'repair'];
  const pinPositions = [
    [[36,39],[45,65],[65,65]], [[61,78],[44,43],[56,62]], [[77,66],[32,51],[42,62]],
    [[39,39],[71,73],[52,50]], [[61,69],[41,59],[66,50]], [[42,32],[71,66],[30,43]]
  ];
  const svgNS = 'http://www.w3.org/2000/svg';
  let session = Auction.fresh();
  let tab = 'notes';
  let modal = null;
  let timer = null;
  const signed = n => n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0';
  const lot = () => Auction.lots[session.index];
  const art = item => 'art/' + item.id + '.svg';

  function node(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function icon(id) {
    const el = document.createElementNS(svgNS, 'svg');
    el.setAttribute('class','icon');
    el.setAttribute('aria-hidden','true');
    const use = document.createElementNS(svgNS, 'use');
    use.setAttribute('href', '#' + id);
    el.append(use);
    return el;
  }
  function button(text, action, cls, graphic) {
    const b = node('button', cls);
    b.type = 'button';
    b.dataset.action = action;
    if (graphic) b.append(icon(graphic));
    b.append(node('span','',text));
    return b;
  }
  function row(label, value, cls = 'sum-row', numberClass = '') {
    const r = node('div',cls);
    r.append(node('span','',label),node('strong',numberClass,value));
    return r;
  }
  function announce(text) { $('announcement').textContent = text; }
  function tabs() {
    const bar = node('div','tabs');
    for (const [key, graphic] of [['notes','eye'],['archive','bookIcon']]) {
      const b = button(t(key),key,tab === key ? 'active' : '',graphic);
      b.setAttribute('aria-pressed',String(tab === key));
      bar.append(b);
    }
    return bar;
  }
  function notes(item) {
    const list = node('ol','notes');
    labels.forEach((label,i) => {
      const li = node('li','note');
      const no = node('span','no',String(i + 1));
      no.setAttribute('aria-hidden','true');
      const body = node('div');
      body.append(node('b','',t(label)),node('p','',t(item.id + '_' + i)));
      li.append(no,body); list.append(li);
    });
    return list;
  }
  function archive(item) {
    const box = node('div');
    box.append(row(t('standard'), item.base, 'sale-row'),row(t('matching'), item.base + item.changes[0], 'sale-row'),node('p','archive-note',t('archiveHint')));
    return box;
  }
  function buyerText(sale) {
    return sale.buyer === null ? t('unsold') : t('soldTo',{ name:t(names[sale.buyer]), n:sale.price });
  }
  function infoLinks(extras) {
    const links = node('div','link-row');
    for (const [key, action, graphic] of extras) links.append(button(t(key),action,'link',graphic));
    return links;
  }
  function moneyQuote(label, amount) {
    const q = node('div','quote');
    q.append(node('span','',label), node('strong','',amount));
    return q;
  }
  function bidPanel() {
    const box = node('div');
    const leader = session.leader === null ? t('noBid') : t('lead',{name:t(names[session.leader])});
    box.append(moneyQuote(leader, session.leader === null ? '—' : session.price));
    let status;
    if (!session.active[0]) status = t('watching');
    else if (session.turn !== 0) status = t('turn',{name:t(names[session.turn])});
    else if (Auction.nextPrice(session) > session.funds[0]) status = t('shortage',{n:Auction.nextPrice(session) - session.funds[0]});
    else status = t('myTurn');
    box.append(node('p','turn',status));
    for (const actor of [1,2]) {
      const r = node('div','bidder'), who = node('span');
      who.append(node('b','',t(names[actor])),node('small','',t('prefers',{type:t(actor === 1 ? 'optics' : 'ceramics')})));
      r.append(who,node('strong','',session.funds[actor])); box.append(r);
    }
    box.append(infoLinks([['backNotes','inspect-more','eye'],['history','history','listIcon']]));
    return box;
  }
  function revealPanel() {
    const item = lot(), result = session.sales[session.index];
    const box = node('div','reveal-lines');
    box.append(node('p','outcome',buyerText(result)),moneyQuote(t('assessed'),result.value),row(t('base'),item.base));
    for (const [i,change] of item.changes.entries()) {
      box.append(row(t(labels[i]),signed(change),'sum-row',change < 0 ? 'negative' : 'positive'));
    }
    box.append(infoLinks([['backNotes','inspect-more','eye'],['history','history','listIcon']]));
    return box;
  }
  function summaryPanel() {
    const {count,value,spent,profit} = Auction.ledger(session);
    const box = node('div'), total = node('div','profit-box');
    total.append(node('span','',t('profit')),node('strong',profit < 0 ? 'negative' : 'positive',signed(profit)));
    box.append(total,row(t('value'),value),row(t('spent'),spent),node('p','archive-note',t('wonCount',{n:count})));
    return box;
  }
  function photo(item, name = '') {
    const img = node('img');
    img.src = art(item);
    img.alt = name;
    img.draggable = false;
    return img;
  }
  function drawPlate() {
    const item = lot(), summary = session.phase === 'summary';
    $('plate').style.setProperty('--tint',summary ? '#d8dfcf' : item.tint);
    $('plate-label').textContent = t(summary ? 'catalogue' : 'lot');
    $('lot-number').textContent = String(session.index + 1).padStart(2,'0');
    $('specimen').src = art(item); $('specimen').alt = t(item.id);
    $('specimen').hidden = summary;
    $('print').querySelector('.shadow').hidden = summary;
    $('print').querySelector('.ledger-art')?.remove();
    if (summary) {
      const gallery = node('div','ledger-art');
      session.sales.forEach(sale => {
        const img = photo(Auction.lots[sale.index], t(Auction.lots[sale.index].id) + ' · ' + buyerText(sale));
        if (sale.buyer !== 0) img.className = 'not-owned';
        gallery.append(img);
      });
      $('print').append(gallery);
    }
    const pins = [];
    if (session.phase === 'inspect') pinPositions[session.index].forEach(([x,y],i) => {
      const b = button(String(i + 1),'pin-' + i,'pin');
      b.setAttribute('aria-label',t(labels[i]) + ' · ' + t(item.id+'_'+i));
      b.style.left = x + '%'; b.style.top = y + '%'; pins.push(b);
    });
    $('pins').replaceChildren(...pins);
    const isSold = session.phase === 'reveal' && session.leader !== null;
    $('ticket').hidden = summary || (session.phase === 'reveal' && !isSold);
    $('ticket-label').textContent = t(isSold ? 'sale' : 'opening');
    $('ticket-value').textContent = isSold ? session.price : item.opening;
    $('sequence').setAttribute('aria-label',t('catalogue'));
    $('sequence').replaceChildren(...Auction.lots.map((entry,i) => {
      const tile = node('span','tile' + (i < session.sales.length ? ' sold' : '') + (i === session.index && !summary ? ' current' : ''));
      const label = (i+1) + ' · ' + t(entry.id);
      tile.append(photo(entry,label)); tile.title = label;
      if (i === session.index && !summary) tile.setAttribute('aria-current','step');
      return tile;
    }));
  }
  function render() {
    // Reapply focus when a bid or a language switch replaces its control.
    const focus = document.activeElement?.dataset.action;
    const scroll = $('detail').scrollTop;
    const stage = session.phase;
    document.querySelector('.shell').dataset.stage = stage;
    drawPlate();
    $('phase').textContent = t(stage);
    $('type').textContent = stage === 'summary' ? '06 / 06' : t(lot().type);
    $('lot-title').textContent = t(stage === 'summary' ? 'ledger' : lot().id);
    $('plate-title').textContent = $('lot-title').textContent;
    const content = $('detail'), actions = $('actions');
    actions.replaceChildren();
    $('balance').textContent = session.funds[0];
    if (stage === 'inspect') {
      content.replaceChildren(tabs(),tab === 'notes' ? notes(lot()) : archive(lot()));
      if (tab === 'notes') {
        const slip = button(t('standard'),'archive','ref-slip','bookIcon');
        slip.append(node('strong','',lot().base),icon('right'));
        content.append(slip);
      }
      actions.append(button(t('start'),'start','primary','gavel'));
    } else if (stage === 'bid') {
      content.replaceChildren(bidPanel());
      if (session.active[0]) {
        const pass = button(t('pass'),'pass','secondary');
        const raise = button(t('raise',{n:Auction.nextPrice(session)}),'raise','primary','gavel');
        pass.disabled = session.turn !== 0;
        raise.disabled = pass.disabled || session.funds[0] < Auction.nextPrice(session);
        actions.append(pass,raise);
      } else actions.append(button(t('skip'),'skip','primary','right'));
    } else if (stage === 'reveal') {
      content.replaceChildren(revealPanel());
      actions.append(button(t(session.index === 5 ? 'finish' : 'next'),'next','primary','right'));
    } else {
      content.replaceChildren(summaryPanel());
      actions.append(button(t('again'),'again','primary','gavel'));
    }
    $('detail').scrollTop = scroll;
    if (focus && !modal) document.querySelector('[data-action="'+focus+'"]:enabled')?.focus({preventScroll:true});
  }
  function ledger() {
    const box = node('div');
    for (const [i,item] of Auction.lots.entries()) {
      const sale = session.sales[i], name = node('div'), line = node('div','log-row');
      const label = sale ? buyerText(sale) : t(i === session.index ? 'current' : 'waiting');
      name.append(node('b','',t(item.id)),node('small','',label));
      line.append(name,node('strong','',sale?.buyer === 0 ? signed(sale.value - sale.price) : '—'));
      box.append(line);
    }
    box.append(row(t('profit'),signed(Auction.ledger(session).profit)));
    return box;
  }
  function drawDialog() {
    if (!modal) return;
    const body = $('dialog-body');
    body.replaceChildren();
    if (modal === 'help') {
      $('dialog-title').textContent = t('help');
      ['guide1','guide2','guide3','guide4'].forEach(k => body.append(node('p','',t(k))));
    } else if (modal === 'ledger') {
      $('dialog-title').textContent = t('ledger'); body.append(ledger());
    } else if (modal === 'history') {
      $('dialog-title').textContent = t('history');
      if (!session.events.length) body.append(node('p','',t('noHistory')));
      for (const event of session.events) body.append(row(t(names[event.actor]),event.price === null ? t('pass') : event.price,'history-row'));
    } else if (modal === 'inspect-more') {
      $('dialog-title').textContent = t(lot().id);
      body.append(notes(lot()),node('h3','',t('archive')),archive(lot()));
    } else {
      const i = Number(modal.slice(4));
      $('dialog-title').textContent = t(labels[i]);
      const frame = node('div','detail-photo');
      frame.style.backgroundColor = lot().tint;
      const img = photo(lot());
      const [x,y] = pinPositions[session.index][i];
      img.style.setProperty('--x',-x + '%'); img.style.setProperty('--y',-y + '%');
      if (lot().id === 'book' && i === 0) {
        img.src = 'art/book-signature.svg';
        img.className = 'flyleaf';
      }
      frame.append(img);
      body.append(frame,node('p','',t(lot().id + '_' + i)));
    }
  }
  function openDialog(key) {
    clearTimeout(timer);
    modal = key;
    drawDialog();
    $('dialog').showModal();
    $('dialog').scrollTop = 0;
  }
  function closeDialog() {
    modal = null;
    $('dialog').close();
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (modal || document.hidden || session.phase !== 'bid' || session.turn === 0) return;
    timer = setTimeout(() => {
      if (document.hidden || modal) return;
      Auction.computer(session);
      afterAction();
    }, 530);
  }
  function afterAction() {
    render();
    if (session.phase === 'reveal') announce(buyerText(session.sales[session.index]) + ' · ' + t('assessed') + ' ' + Auction.valueOf(lot()));
    else if (session.phase === 'bid') {
      const last = session.events.at(-1);
      if (last) announce(t(names[last.actor]) + ' · ' + (last.price ?? t('pass')));
    }
    schedule();
  }
  $('help').onclick = () => openDialog('help');
  $('ledger').onclick = () => openDialog('ledger');
  $('close').onclick = closeDialog;
  $('dialog').addEventListener('click',event => {
    if (event.target !== $('dialog')) return;
    const r = $('dialog').getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog();
  });
  $('dialog').addEventListener('cancel',event => { event.preventDefault(); closeDialog(); });
  document.querySelector('.shell').addEventListener('click',event => {
    const b = event.target.closest('button[data-action]');
    if (!b || b.disabled || modal) return;
    const action = b.dataset.action;
    if (['notes','archive'].includes(action)) {
      tab = action; render(); return;
    }
    if (action.startsWith('pin-') || ['inspect-more','history'].includes(action)) {
      openDialog(action); return;
    }
    if (action === 'start') Auction.start(session);
    if (action === 'pass' || action === 'raise') Auction.act(session,0,action);
    if (action === 'skip' && !session.active[0]) {
      while (Auction.computer(session)) { /* Finish the same sequence of legal turns. */ }
    }
    if (action === 'next') { Auction.next(session); tab = 'notes'; }
    if (action === 'again' && session.phase === 'summary') { session = Auction.fresh(); tab = 'notes'; }
    $('detail').scrollTop = 0;
    afterAction();
  });
  window.addEventListener('boopland:languagechange',() => { render(); drawDialog(); });
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('pagehide',() => clearTimeout(timer));
  window.addEventListener('pageshow',schedule);
  render();
})();
