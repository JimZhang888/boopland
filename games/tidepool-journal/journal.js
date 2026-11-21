(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const tr = (key, values) => BooplandI18n.t('tidepool.' + key, values);
  const {flats, species, capacity, limit} = Tidepool;
  const svg = ShoreArt.svg;
  const storage = 'boopland-tidepool-journal-v1';
  let trip = Tidepool.newTrip(), suspended = null, notice = {key:'observe'};
  let modal = '', drawnZone = -1;
  function readBook() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storage)) || {}; } catch {}
    return Object.fromEntries(Object.keys(species).map(id =>
      [id, Number.isSafeInteger(saved[id]) && saved[id] > 0 ? saved[id] : 0]));
  }
  let book = readBook();
  const countKinds = () => Object.values(book).filter(n => n > 0).length;
  function save(result) {
    const latest = readBook();
    for (const id of Object.keys(species)) book[id] = Math.max(latest[id], book[id]);
    for (const id of result.kept) book[id]++;
    try { localStorage.setItem(storage, JSON.stringify(book)); } catch {}
  }
  function element(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function sketch() {
    const {group,icons,path} = ShoreArt;
    const put=(id,x,y,size,tilt=0)=>'<g transform="translate('+x+' '+y+') rotate('+tilt+') scale('+size+')">'+group(icons[id])+'</g>';
    return '<svg viewBox="0 0 265 135" aria-hidden="true">'+
      '<g stroke="#c3c4af" stroke-width=".9" fill="none"><path d="M18 109 q39 -2 65 -1 m58 5 q30 -2 71 -3 M34 117 l26 -2 m6 0 l18 -1 m67 3 l34 0 M63 106 l-12 1 m126 1 l30 -2 M98 120 l56 -3"/><ellipse cx="126" cy="106" rx="66" ry="5" fill="#d3d1bc" stroke="none"/></g>'+
      '<g transform="translate(7 16)">'+put('net',99,-10,.96,-13)+put('spade',74,-10,.89,-25)+
      '<g transform="translate(54 9) rotate(-6 55 52) scale(1.14 .98)">'+group(icons.bucket)+'</g></g>'+
      put('shell',151,83,.39,15)+put('razor',51,88,.38,52)+
      group(path('M169 107 Q182 102 194 106 Q211 110 219 102 Q225 96 218 94 Q211 94 209 100 Q208 106 216 105 Q223 104 221 99 M176 108 l7 -2 m5 2 l5 1','none','stroke-width="1.2"'))+'</svg>';
  }
  document.querySelectorAll('[data-art]').forEach(el => {el.innerHTML = svg(el.dataset.art);});
  $('bucket-art').innerHTML = sketch();
  const spotButtons = [];
  for (let i=0;i<flats[0].spots.length;i++) {
    const button = element('button','spot');
    button.type = 'button';
    button.addEventListener('click', () => {
      const outcome = Tidepool.inspect(trip,i);
      if (outcome === 'empty') trip.selected = null;
      notice = {key:outcome==='sign' && trip.bucket.length>=capacity?'full':outcome};
      paint();
    });
    spotButtons.push(button);
    $('spots').append(button);
  }
  const flatButtons = flats.map((flat,index) => {
    const button = element('button','flat');
    button.append(element('span','flat-num',String(index+1).padStart(2,'0')),element('span'));
    button.addEventListener('click', () => {
      if (!Tidepool.move(trip,index)) return;
      notice={key:'arrived'};
      update();
    });
    $('flats').append(button);
    return button;
  });
  const toolButtons = ['spade','net','tongs'].map(tool => {
    const button=element('button','tool');
    button.innerHTML=svg(tool);
    button.append(element('span'));
    button.addEventListener('click', () => {
      const outcome=Tidepool.gather(trip,tool);
      notice={key:outcome, id:trip.bucket.at(-1)};
      update();
    });
    $('tools').append(button);
    return button;
  });
  function redrawSea() {
    const rect=$('map').getBoundingClientRect();
    if (rect.width && rect.height) $('seascape').innerHTML=ShoreMap.scene(trip.zone,Math.round(rect.width),Math.round(rect.height));
    drawnZone=trip.zone;
  }
  function note() {
    const zone=flats[trip.zone], key=notice.key;
    const chosen=zone.spots[trip.selected]?.[0];
    if (key==='wrong') return ['wrong',trip.practice?'teachDigHelp':'wrongHelp',chosen+'Sign'];
    if (trip.practice) {
      return [['teachSpot','teachSpotHelp','razorSign'],['teachDig','teachDigHelp','spade'],['teachHome','teachHomeHelp','bucket']][trip.tutorialStep];
    }
    if (key==='empty') return ['empty','emptyHelp','used'];
    if (key==='caught' && trip.bucket.length===capacity) return ['caught','fullHelp',notice.id];
    if (key==='full' || trip.bucket.length===capacity) return ['full','fullHelp','bucket'];
    if (key==='sign' && chosen) return [chosen+'Sign','signHelp',chosen+'Sign'];
    if (trip.left<=zone.walk+1) return ['hurry','hurryHelp','flag'];
    if (key==='caught') return ['caught','catchHelp',notice.id];
    if (key==='arrived') return ['arrived','placeHelp','pin'];
    return ['observe',key==='choose'?'chooseHelp':'observeHelp','shell'];
  }
  function paint() {
    const zone=flats[trip.zone], covered=trip.holes[trip.zone];
    const level=trip.practice?'practice':trip.left<=6?'high':trip.left<=12?'rising':'low';
    $('tide-name').textContent=tr(level);
    $('tide-fill').style.width=(trip.practice?0:((limit-trip.left+1)/(limit+1))*100)+'%';
    $('remaining').textContent=trip.practice?tr('unlimited'):tr('remaining',{n:trip.left});
    document.querySelector('.meters').classList.toggle('danger',!trip.practice && trip.left<=zone.walk+2);
    $('walk-time').textContent=tr('time',{n:zone.walk});
    $('return').title=tr('home',{n:zone.walk});
    $('teach-name').textContent=tr(trip.practice?'leave':'learn');
    $('teach').setAttribute('aria-label',$('teach-name').textContent);
    $('teach').title=$('teach-name').textContent;
    $('teach').setAttribute('aria-pressed',String(trip.practice));
    $('book-count').textContent=countKinds()+'/6';
    $('journal').setAttribute('aria-label',tr('journal')+' · '+tr('guideCount',{n:countKinds()}));
    $('journal').title=$('journal').getAttribute('aria-label');
    $('site').textContent=tr(zone.name);
    $('depth').textContent=tr(zone.depth);
    $('map-number').textContent=tr('chart',{n:String(trip.zone+1).padStart(2,'0')});
    if (drawnZone!==trip.zone) redrawSea();
    zone.spots.forEach(([id,x,y],index) => {
      const button=spotButtons[index], used=covered.includes(index);
      button.style.left=x+'%'; button.style.top=y+'%';
      button.disabled=trip.practice && index!==0;
      button.classList.toggle('used',used);
      button.classList.toggle('guided',trip.practice && index===0 && !used);
      button.setAttribute('aria-pressed',String(trip.selected===index));
      const label=tr('spot',{n:index+1,sign:tr(used?'empty':id+'Sign')});
      button.title=label;button.setAttribute('aria-label',label);
      const art=used?'used':id+'Sign';
      if (button.dataset.artId!==art) {
        button.innerHTML=svg(art);
        button.append(element('span','tag',index+1));
        button.dataset.artId=art;
      }
    });
    flatButtons.forEach((b,i)=>{
      b.lastChild.textContent=tr(flats[i].name);
      b.disabled=trip.practice && i!==trip.zone;
      b.setAttribute('aria-pressed',String(i===trip.zone));
      b.title=tr(flats[i].name)+' · '+tr('cross',{n:Math.abs(i-trip.zone)*2});
      b.setAttribute('aria-label',b.title);
    });
    toolButtons.forEach((b,i)=>{b.lastChild.textContent=tr(['spade','net','tongs'][i]);});
    $('bucket-count').textContent=trip.bucket.length+' / '+capacity;
    $('bucket-slots').replaceChildren(...Array.from({length:capacity},(_,i)=>{
      const id=trip.bucket[i], slot=element('div',id?'slot filled':'slot');
      if (id) {
        slot.innerHTML=svg(id);slot.title=tr(id);slot.setAttribute('role','img');slot.setAttribute('aria-label',tr(id));
      } else slot.setAttribute('aria-hidden','true');
      return slot;
    }));
    const [heading,detail,art]=note();
    const values={n:zone.walk, name:tr(notice.key==='caught'?notice.id:zone.name)};
    $('note-title').textContent=tr(heading,values);
    $('note-detail').textContent=tr(detail,values);
    $('note-icon').innerHTML=svg(art);
    if (modal) drawSheet();
  }
  function specimen(id) {
    const card=element('article','specimen'+(book[id]?' collected':''));
    card.innerHTML=svg(id);
    card.append(element('b','',tr(id)),element('small','',tr(id+'Sign')+' · '+tr(species[id])),
      element('small','',book[id]?tr('recorded',{n:book[id]}):tr('unrecorded')));
    return card;
  }
  function catchList(ids) {
    const counts = new Map();
    ids.forEach(id => counts.set(id, (counts.get(id)||0)+1));
    return [...counts].map(([id,n])=>tr(id)+' ×'+n).join(' · ') || tr('none');
  }
  function drawSheet() {
    const body=$('sheet-body');
    body.replaceChildren();
    if (modal==='guide') {
      $('sheet-heading').textContent=tr('journal')+' · '+countKinds()+'/6';
      body.append(element('p','sheet-copy',tr('guideHelp')));
      const list=element('div','guide-list');
      list.append(...Object.keys(species).map(specimen));body.append(list);
      body.append(element('p','result-line',tr('openSea')),element('p','result-line',tr('rules')));
      $('sheet-action').textContent=tr('backToMap');
    } else {
      const result=trip.result, type=result.type;
      $('sheet-heading').textContent=tr(type);
      const art=element('div','result-art');art.innerHTML=svg(type==='rescued'?'wave':'bucket');body.append(art);
      body.append(element('p','sheet-copy',tr(type+'Copy',{n:trip.bucket.length})));
      body.append(element('p','result-line',tr('kept')+' · '+catchList(result.kept)));
      if (type!=='landed') body.append(element('p','result-line',tr('released')+' · '+catchList(result.lost)));
      body.append(element('p','result-line',countKinds()===6?tr('allFound'):tr('guideCount',{n:countKinds()})));
      $('sheet-action').textContent=tr(trip.practice?'resume':'again');
    }
  }
  function show(kind) {
    modal=kind;drawSheet();
    if (!$('sheet').open) $('sheet').showModal();
    $('sheet-body').scrollTop=0;
  }
  function update() {
    if (trip.result && !modal) {
      if (trip.result.kept.length) save(trip.result);
      paint();show('result');
    } else paint();
  }
  function finishSheet() {
    const kind=modal;
    modal='';$('sheet').close();
    if (kind==='result') {
      if (suspended) {trip=suspended.trip;notice=suspended.notice;suspended=null;}
      else {trip=Tidepool.newTrip();notice={key:'observe'};}
    }
    paint();
  }
  $('close').addEventListener('click',finishSheet);
  $('sheet-action').addEventListener('click',finishSheet);
  $('sheet').addEventListener('cancel',e=>{e.preventDefault();finishSheet();});
  $('journal').addEventListener('click',()=>show('guide'));
  $('teach').addEventListener('click',()=>{
    if (suspended) {trip=suspended.trip;notice=suspended.notice;suspended=null;}
    else {suspended={trip,notice};trip=Tidepool.newTrip(true);notice={key:'teachSpot'};}
    paint();
  });
  $('return').addEventListener('click',()=>{
    if (trip.practice && trip.tutorialStep<2) {notice={key:'teachSpot'};paint();return;}
    if (trip.result) return;
    Tidepool.back(trip);update();
  });
  window.addEventListener('boopland:languagechange',paint);
  window.addEventListener('storage',e=>{if(e.key===storage){book=readBook();paint();}});
  new ResizeObserver(redrawSea).observe($('map'));
  paint();
})();
