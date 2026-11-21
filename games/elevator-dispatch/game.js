(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('elevator-dispatch.' + key, values);
  const svgNS = 'http://www.w3.org/2000/svg';
  const colors = ['#b98f76','#839b91','#c4ad7d','#a499a0','#98a480'];
  const people = new Map();
  const reports = [];
  let shift = new ElevatorDispatch.Shift(0);
  let modal = '';
  let returnFocus = null;
  let requestId = 0;
  let lastFrame = null;
  let lastPaint = -Infinity;
  let routeSignature = null;
  let flash = null;
  let drawingWidth = 1;

  function element(tag, attrs = {}) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function html(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    if (className) node.className = className;
    return node;
  }
  function write(node, value) {
    const text = String(value);
    if (node.textContent !== text) node.textContent = text;
  }
  function personFigure(person) {
    const group = element('g');
    const title = element('title');
    const body = element('use', {href:person.id % 2 ? '#person-case' : '#person-coat', color:colors[person.id % colors.length]});
    const tag = element('rect', {x:-18,y:-72,width:36,height:23,rx:4,fill:'#fcf6df',stroke:'#737c68','stroke-width':1.4});
    const label = element('text', {x:0,y:-55,'font-family':'Arial,sans-serif','font-size':19,'font-weight':700,'text-anchor':'middle',fill:'#364b3c'});
    label.textContent = (person.to > person.from ? '↑' : '↓') + person.to;
    const base = element('rect', {x:-15,y:2,width:30,height:4,rx:1,fill:'#c8c9b6'});
    const bar = element('rect', {x:-15,y:2,height:4,rx:1});
    const warning = element('text', {x:19,y:-53,'font-size':19,'font-weight':700,fill:'#8d4e36'});
    warning.textContent = '!';
    group.append(title, body, tag, label, base, bar, warning);
    $('people').append(group);
    return {group, title, bar, warning};
  }

  function drawFloor() {
    const visible = new Set();
    const descriptions = [];
    for (let floor = 1; floor <= 5; floor++) {
      const line = shift.waiting[floor];
      const spacing = Math.min(53, 350 * drawingWidth / Math.max(1,line.length - 1));
      line.forEach((person, i) => {
        visible.add(person.id);
        if (!people.has(person.id)) people.set(person.id, personFigure(person));
        const figure = people.get(person.id);
        const ratio = Math.max(0,(person.deadline - shift.now) / person.patience);
        const x = 242 * drawingWidth + i * spacing;
        figure.group.setAttribute('transform','translate(' + x + ' ' + (146 + (5-floor)*80) + ') scale(' + Math.min(1,spacing/38) + ')');
        figure.bar.setAttribute('width', 30 * ratio);
        figure.bar.setAttribute('fill', ratio < .25 ? '#a36246' : '#526f58');
        figure.warning.setAttribute('visibility',ratio < .25 ? 'visible' : 'hidden');
        const info = t('passenger',{n:floor,to:person.to,sec:Math.ceil(person.deadline-shift.now)});
        write(figure.title, info);
        descriptions.push(info);
      });
    }
    for (const [id,figure] of people) {
      if (!visible.has(id)) { figure.group.remove(); people.delete(id); }
    }
    write($('scene-desc'),[t('scene',{f:shift.floor,n:visible.size}),...descriptions].join(' · '));
  }

  function drawSeats() {
    const seats = $('seats');
    for (let i = 0; i < 4; i++) {
      const seat = seats.children[i];
      const person = shift.riders[i];
      seat.classList.toggle('full',!!person);
      write(seat.lastChild,person ? person.to : '–');
      seat.setAttribute('aria-label',person ? t('rider',{n:person.to}) : t('vacant'));
      seat.title = seat.getAttribute('aria-label');
    }
  }
  function drawRoute() {
    const signature = BooplandI18n.language + '/' + shift.pending.join('/');
    if (signature === routeSignature) return;
    routeSignature = signature;
    const buttons = shift.pending.map((floor,index) => {
      const button = html('button',undefined,'ticket');
      const chip = html('span',floor);
      chip.append(html('small','×'));
      button.append(chip);
      const label = t('remove',{i:index+1,n:floor});
      button.setAttribute('aria-label',label);
      button.title = label;
      button.addEventListener('click',() => { shift.cancel(index); refresh(); });
      return button;
    });
    $('route').replaceChildren(...(buttons.length ? buttons : [html('span',t('empty'),'route-empty')]));
  }
  function updateLift() {
    $('lift').setAttribute('y', 80 + (5 - shift.position) * 80);
  }
  function fitDrawing() {
    const box = document.querySelector('.blueprint').getBoundingClientRect();
    drawingWidth = Math.max(.63, Math.min(1, box.width * 500 / (Math.max(1,box.height) * 660)));
    $('scene').setAttribute('viewBox','0 0 ' + (660 * drawingWidth) + ' 500');
    $('elevation').setAttribute('transform','scale(' + drawingWidth + ' 1)');
    $('lift').setAttribute('x',108 * drawingWidth);
    $('lift').setAttribute('width',92 * drawingWidth);
    drawFloor();
  }
  function refresh() {
    const i = shift.index;
    write($('shift-name'),t('shift'+(i+1)));
    write($('shift-detail'),t('detail'+(i+1)));
    write($('shift-number'),'0'+(i+1)+' / 03');
    const seconds = Math.ceil(Math.max(0,shift.plan.close-shift.now));
    const time = [Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
    write($('clock'),time);
    $('clock').setAttribute('aria-label',shift.closed ? t('lastRun') : time);
    write($('capacity'),shift.riders.length + ' / 4');
    write($('waiting'),t('waiting',{n:shift.waitingCount}));
    for (const field of ['delivered','left','score']) write($(field),shift[field]);
    const target = shift.trip?.to ?? shift.pending[0];
    write($('next'),target ?? '—');
    write($('action-icon'),shift.started ? 'Ⅱ' : '▸');
    write($('action-label'),t(shift.started ? 'pause' : 'start'));
    const notice = shift.notice;
    let message = t(notice.key,notice.values);
    if (shift.started && notice.key === 'ready' && target) message = t('send',{n:target});
    if (shift.closed) message = t('closing');
    if (flash && flash.until > shift.now) message = t(flash.key);
    write($('message'),message);
    for (const key of $('keys').children) key.setAttribute('aria-label',t('send',{n:key.value}));
    drawFloor();
    drawSeats();
    drawRoute();
    updateLift();
  }

  function stopClock() {
    cancelAnimationFrame(requestId);
    requestId = 0;
    lastFrame = null;
    lastPaint = -Infinity;
  }
  function tick(now) {
    requestId = 0;
    if (modal || !shift.started || shift.done || document.hidden) return;
    if (lastFrame !== null) shift.advance(Math.max(0,(now - lastFrame) / 1000));
    lastFrame = now;
    updateLift();
    if (shift.done || now - lastPaint >= 120) {
      refresh();
      lastPaint = now;
    }
    if (shift.done) {
      reports[shift.index] = shift.report();
      showModal('report');
    } else requestId = requestAnimationFrame(tick);
  }
  function runClock() {
    if (shift.started && !shift.done && !modal && !document.hidden && !requestId) requestId = requestAnimationFrame(tick);
  }
  function dispatch(floor) {
    if (modal || shift.done) return;
    if (!shift.request(floor)) flash = {key:shift.pending.length >= 5 ? 'full' : 'duplicate', until:shift.now+2};
    else flash = null;
    refresh();
    runClock();
  }

  function metrics(data) {
    const list = html('dl',undefined,'report');
    for (const key of ['delivered','left','score','best']) {
      const row = html('div');
      row.append(html('dt',t(key)),html('dd',data[key]));
      list.append(row);
    }
    return list;
  }
  function drawModal() {
    const content = $('dialog-content');
    content.replaceChildren();
    write($('dialog-kicker'),t('shift')+' '+String(shift.index+1).padStart(2,'0')+' / 03');
    if (modal === 'report') {
      const final = shift.index === 2;
      write($('dialog-title'),t(final ? 'final' : 'report'));
      const total = reports.reduce((sum,r)=>({
        delivered:sum.delivered+r.delivered, left:sum.left+r.left,
        score:sum.score+r.score, best:Math.max(sum.best,r.best)
      }),{delivered:0,left:0,score:0,best:0});
      content.append(metrics(final ? total : shift.report()));
      if (final) {
        const table = html('table',undefined,'breakdown');
        const headings = html('tr');
        for (const key of ['shift','delivered','left']) headings.append(html('th',t(key)));
        const head = table.createTHead();
        head.append(headings);
        const body = table.createTBody();
        reports.forEach((r,index) => {
          const row = body.insertRow();
          row.append(html('th',t('shift'+(index+1))),html('td',r.delivered),html('td',r.left));
        });
        content.append(table);
      }
      write($('dialog-action'),t(final ? 'again' : 'nextShift'));
    } else if (modal === 'help') {
      write($('dialog-title'),t('help'));
      content.append(html('p',t('detail'+(shift.index+1))));
      const list = html('ul');
      for (const key of ['rule1','rule2','rule3','rule4']) list.append(html('li',t(key)));
      content.append(list);
      write($('dialog-action'),t('ok'));
    } else {
      write($('dialog-title'),t('paused'));
      content.append(html('p',t('shift'+(shift.index+1))+' · '+t('floor',{f:shift.floor})));
      write($('dialog-action'),t('resume'));
    }
  }
  function showModal(type) {
    returnFocus = document.activeElement;
    modal = type;
    stopClock();
    drawModal();
    $('overlay').hidden = false;
    document.querySelector('.mast').inert = true;
    document.querySelector('.workbench').inert = true;
    $('dialog-action').focus({preventScroll:true});
  }
  function closeModal() {
    if (modal === 'report') {
      const i = shift.index;
      if (i === 2) reports.length = 0;
      shift = new ElevatorDispatch.Shift((i+1)%3);
      flash = null;
      returnFocus = $('action');
    }
    modal = '';
    $('overlay').hidden = true;
    document.querySelector('.mast').inert = false;
    document.querySelector('.workbench').inert = false;
    refresh();
    (returnFocus?.isConnected && returnFocus !== document.body ? returnFocus : $('action')).focus({preventScroll:true});
    runClock();
  }
  function act() {
    if (modal) return;
    if (shift.started) showModal('pause');
    else dispatch(1);
  }
  for (let i = 1; i <= 5; i++) {
    const button = html('button',i,'floor-key');
    button.value = i;
    button.addEventListener('click',() => dispatch(i));
    $('keys').append(button);
  }
  for (let i = 0; i < 4; i++) {
    const seat = html('div',undefined,'seat');
    seat.setAttribute('role','img');
    const icon = element('svg',{viewBox:'0 0 20 20','aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-width':1.4});
    icon.append(element('circle',{cx:10,cy:5,r:3}),element('path',{d:'M3 17v-2q0-5 7-5t7 5v2z'}));
    seat.append(icon,html('b','–'));
    $('seats').append(seat);
  }
  $('action').addEventListener('click',act);
  $('help').addEventListener('click',() => showModal('help'));
  $('dialog-action').addEventListener('click',closeModal);
  document.addEventListener('keydown',event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (modal) {
      if (event.key === 'Tab') {
        const first = $('dialog-action'), last = document.querySelector('.dialog-back');
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if ((event.key === 'Escape' && modal !== 'report') || (event.code === 'Space' && modal === 'pause')) {
        event.preventDefault();
        closeModal();
      }
      return;
    }
    if (/^[1-5]$/.test(event.key)) { event.preventDefault(); dispatch(Number(event.key)); }
    else if (event.key === 'Backspace') { event.preventDefault(); shift.cancel(shift.pending.length-1); refresh(); }
    else if (event.code === 'Space') { event.preventDefault(); act(); }
  });
  function background() {
    if (shift.started && !shift.done && !modal) showModal('pause');
  }
  document.addEventListener('visibilitychange',() => { if (document.hidden) background(); });
  window.addEventListener('pagehide',background);
  window.addEventListener('boopland:languagechange',() => {
    refresh();
    if (modal) drawModal();
  });
  new ResizeObserver(fitDrawing).observe(document.querySelector('.blueprint'));
  fitDrawing();
  refresh();
})();
