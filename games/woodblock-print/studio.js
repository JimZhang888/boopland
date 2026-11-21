(() => {
  'use strict';
  const {works, inks, layer, proof} = WoodArt;
  const t = (key, values) => BooplandI18n.t('woodblock.' + key, values);
  const $ = id => document.getElementById(id);
  const surface = $('surface');
  const dialog = $('dialog');
  const limit = (v, min, max) => Math.min(max, Math.max(min, v));
  const shelfLetter = n => String.fromCharCode(65 + n);
  const frames = '<path d="M13 43V15h23M204 15h23v28M13 239v26h23m168 0h23v-26" fill="none" stroke="#88856f" stroke-opacity=".4" stroke-width=".65"/>';
  const pins = [[21,24],[218,255]];
  const fixed = pins.map(([x,y])=>'<g transform="translate('+x+' '+y+')" stroke="#666c5e" fill="none"><circle r="6" stroke-width=".8"/><path d="M-10 0H10M0 -10V10" stroke-width=".85"/></g>').join('');
  const moving = pins.map(([x,y])=>'<g transform="translate('+x+' '+y+')" stroke="#98513d" fill="none"><path d="M-4 0H4M0 -4V4" stroke-width="1.9"/><path d="M0 -5l5 5-5 5-5-5z" stroke-width=".8"/></g>').join('');
  const fresh = index => {
    const w = works[index];
    return {selected:w.rack[0], layers:[], drafts:w.start.map(([x,y,angle],id)=>({
      id, x, y, angle, ink:index===0 ? w.ink[id] : 'soot'
    }))};
  };
  const folios = works.map((_,i)=>fresh(i));
  let index = 0;
  let work, state, dragging = null, openView = null;
  let best = [];
  try {
    const stored = JSON.parse(localStorage.getItem('woodblock-print-best'));
    if (Array.isArray(stored)) best = stored.map(n=>Number.isInteger(n) && n>=0 && n<=100 ? n : null);
  } catch { /* The album still works within this visit. */ }
  const current = () => state.drafts[state.selected];
  const finished = () => state.layers.length === work.blocks.length;
  const isUsed = id => state.layers.some(p=>p.id === id);
  const galleryButton = $('collection');
  const sampleSheet = document.querySelector('.sample .sheet');
  const zoom = document.createElement('button');
  zoom.className = 'zoom';
  zoom.setAttribute('data-i18n-label','woodblock.zoom');
  zoom.setAttribute('data-i18n-title','woodblock.zoom');
  zoom.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="5.7"/><path d="m14.5 14.5 5 5M7.5 10h5M10 7.5v5"/></svg>';
  sampleSheet.append(zoom);

  // Inked blocks are drawn in press order with ordinary opaque paint.
  function stampMarkup(p) { return layer(work,p.id,p.ink,p.x,p.y,p.angle); }
  function assess() {
    const printed = state.layers;
    const n = printed.length;
    const partial = (distance, tolerance, span) => 1 - limit((distance - tolerance) / span, 0, 1);
    const mean = fn => printed.reduce((total,p)=>total + fn(p),0) / n;
    let inversions = 0;
    printed.forEach((p,i)=>{ for (let j=0;j<i;j++) if (printed[j].id>p.id) inversions++; });
    return {
      pos: Math.round(40 * mean(p=>partial(Math.hypot(p.x,p.y), 3, 24))),
      ang: Math.round(20 * mean(p=>partial(Math.abs(p.angle), 1, 13))),
      seq: Math.round(25 * (1 - inversions / (n*(n-1)/2))),
      pigment: Math.round(15 * mean(p=>Number(p.ink===work.ink[p.id])))
    };
  }
  function renderOverlay() {
    const p = current(), g = $('live');
    if (!g || !p) return;
    g.setAttribute('transform','translate('+p.x+' '+p.y+') rotate('+p.angle+' 120 140)');
    $('angle').textContent = (p.angle>0 ? '+' : '') + p.angle + '°';
  }
  function renderPaper() {
    $('reference').innerHTML = frames + proof(work);
    surface.innerHTML = frames + state.layers.map(stampMarkup).join('') + (finished() ? '' : fixed +
      '<g id="live"><g opacity=".57">'+layer(work,state.selected,current().ink)+'</g>'+moving+'</g>');
    renderOverlay();
  }
  function renderRack() {
    const tray = $('blocks');
    tray.replaceChildren();
    work.rack.forEach((id,slot)=>{
      const button = document.createElement('button');
      button.className='plate'; button.dataset.block=id;
      button.disabled=isUsed(id);
      const letter=shelfLetter(slot);
      button.setAttribute('aria-label', t('blockLabel',{letter}));
      button.setAttribute('title', t('blockLabel',{letter}));
      button.setAttribute('aria-pressed', String(id===state.selected && !finished()));
      button.innerHTML='<svg viewBox="0 0 240 280" aria-hidden="true" color="#66553f"><g>'+work.blocks[id]+'</g></svg><em>'+letter+'</em>';
      tray.append(button);
      const svg=button.firstChild, b=svg.firstChild.getBBox();
      if (b.width && b.height) svg.setAttribute('viewBox',[b.x-6,b.y-5,b.width+12,b.height+10].join(' '));
    });
    $('inks').replaceChildren();
    for (const [name,hex] of Object.entries(inks)) {
      const button=document.createElement('button');
      button.className='swatch'; button.dataset.ink=name;
      const active=!finished() && current().ink===name;
      button.style.setProperty('--pigment',hex);
      button.setAttribute('aria-label',t(name)); button.title=t(name);
      button.setAttribute('aria-pressed',String(active));
      button.innerHTML='<span aria-hidden="true">'+(active ? '✓' : '')+'</span>';
      $('inks').append(button);
    }
    if (!finished()) {
      $('ink-name').textContent=t(current().ink);
      $('block-code').textContent=shelfLetter(work.rack.indexOf(state.selected));
    }
  }
  function renderResult() {
    const metrics=assess(), total=Object.values(metrics).reduce((a,b)=>a+b,0);
    $('score').textContent=total + '/100';
    $('scores').replaceChildren();
    for (const [k,max] of Object.entries({pos:40,ang:20,seq:25,pigment:15})) {
      const row=document.createElement('div'), label=document.createElement('span'), value=document.createElement('b');
      label.textContent=t(k); value.textContent=metrics[k]+'/'+max;
      row.append(label,value); $('scores').append(row);
    }
    $('next').textContent=t(index===works.length-1?'gallery':'next');
    if (best[index]==null || best[index]<total) {
      best[index]=total;
      try {localStorage.setItem('woodblock-print-best',JSON.stringify(best));} catch {}
    }
  }
  function render() {
    work=works[index]; state=folios[index];
    const complete=finished(), n=work.blocks.length;
    $('work-name').textContent=t(work.name);
    $('folio').textContent=String(index+1).padStart(2,'0')+' / 04';
    $('progress').innerHTML=Array.from({length:n},(_,i)=>'<i aria-hidden="true" class="'+(i<state.layers.length?'on':'')+'"></i>').join('')+'<b>'+state.layers.length+' / '+n+'</b>';
    $('tip').textContent=t(complete?'done':'tip'+index);
    $('settings').hidden=complete; $('result').hidden=!complete;
    $('undo').disabled=!state.layers.length;
    if (!complete) renderRack();
    else renderResult();
    renderPaper();
  }
  function endDrag() {
    if (!dragging) return;
    const id=dragging.id; dragging=null;
    if(surface.hasPointerCapture(id))surface.releasePointerCapture(id);
    surface.classList.remove('dragging');
  }
  function printBlock() {
    if (finished()) return;
    endDrag();
    state.layers.push({...current()});
    if (!finished()) state.selected=work.rack.find(id=>!isUsed(id));
    render();
    const edition=document.querySelector('.edition');
    edition.classList.remove('fresh'); void edition.offsetWidth; edition.classList.add('fresh');
    if(finished()) $('next').focus({preventScroll:true});
  }
  function undo() {
    const p=state.layers.pop();
    if (!p) return;
    endDrag(); state.drafts[p.id]={...p}; state.selected=p.id;
    render(); $('print').focus({preventScroll:true});
  }
  function move(dx,dy,da) {
    if (finished()) return;
    const p=current(); p.x=limit(p.x+dx,-32,32); p.y=limit(p.y+dy,-32,32); p.angle=limit(p.angle+da,-18,18);
    renderOverlay();
  }
  function localPoint(e) {
    const pt=surface.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
    return pt.matrixTransform(surface.getScreenCTM().inverse());
  }
  surface.addEventListener('pointerdown',e=>{
    if (finished() || dragging || e.button!==0) return;
    const pt=localPoint(e);
    surface.focus({preventScroll:true});
    dragging={id:e.pointerId, x:pt.x-current().x, y:pt.y-current().y};
    surface.setPointerCapture(e.pointerId); surface.classList.add('dragging');
  });
  surface.addEventListener('pointermove',e=>{
    if (e.pointerId!==dragging?.id) return;
    const pt=localPoint(e);
    current().x=limit(Math.round(pt.x-dragging.x),-32,32);
    current().y=limit(Math.round(pt.y-dragging.y),-32,32);
    renderOverlay();
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(event,e=>{if(e.pointerId===dragging?.id)endDrag();});
  window.addEventListener('blur',endDrag);
  $('settings').addEventListener('click',e=>{
    const btn=e.target.closest('button');
    if (!btn || btn.disabled || finished()) return;
    if (btn.hasAttribute('data-block')) {
      endDrag(); state.selected=Number(btn.dataset.block); render();
      $('blocks').querySelector('[aria-pressed="true"]').focus({preventScroll:true});
    } else if (btn.dataset.ink) {
      current().ink=btn.dataset.ink; render();
      $('inks').querySelector('[aria-pressed="true"]').focus({preventScroll:true});
    } else if (btn.dataset.dx) move(Number(btn.dataset.dx),Number(btn.dataset.dy),0);
    else if (btn.dataset.turn) move(0,0,Number(btn.dataset.turn));
    else if(btn.id==='undo') undo();
    else if(btn.id==='print' && e.detail<2) printBlock();
  });
  window.addEventListener('keydown',e=>{
    if(dialog.open || e.ctrlKey || e.metaKey || e.altKey) return;
    const key=e.key.toLowerCase();
    const moves={arrowleft:[-1,0,0],arrowup:[0,-1,0],arrowdown:[0,1,0],arrowright:[1,0,0],q:[0,0,-1],e:[0,0,1]};
    if(moves[key] && !finished()) {e.preventDefault(); surface.focus({preventScroll:true}); move(...moves[key]);}
    else if(key==='z') {e.preventDefault(); if(!e.repeat)undo();}
    else if(key===' ' && !e.target.closest('a,button') && !finished()) {e.preventDefault(); if(!e.repeat)printBlock();}
  });
  function dialogContents() {
    const content=$('dialog-content'); content.replaceChildren();
    $('dialog-title').textContent=t(openView==='help'?'guide':openView==='zoom'?work.name:'gallery');
    if(openView==='help') {
      const list=document.createElement('ol'); list.className='guide-list';
      for(const key of ['guide1','guide2','guide3']) {
        const li=document.createElement('li'); li.textContent=t(key); list.append(li);
      }
      const foot=document.createElement('p'); foot.className='guide-foot'; foot.textContent=t('keys');
      content.append(list,foot);
    } else if(openView==='zoom') {
      content.innerHTML='<div class="large-proof"><svg viewBox="0 0 240 280" role="img"></svg></div>';
      const svg=content.querySelector('svg'); svg.setAttribute('aria-label',t('proof')); svg.innerHTML=frames+proof(work);
    } else {
      const grid=document.createElement('div'); grid.className='gallery-grid';
      works.forEach((w,i)=>{
        const b=document.createElement('button'); b.dataset.work=i; b.setAttribute('aria-current',String(i===index));
        b.innerHTML='<svg aria-hidden="true" viewBox="0 0 240 280">'+proof(w)+'</svg><strong></strong><small></small>';
        b.querySelector('strong').textContent=t(w.name);
        b.querySelector('small').textContent=best[i]==null?t('noBest'):t('best',{n:best[i]});
        grid.append(b);
      });
      content.append(grid);
    }
  }
  function show(view) {
    endDrag();openView=view;dialogContents();
    dialog.setAttribute('aria-labelledby','dialog-title');
    if(!dialog.open)dialog.showModal();
    $('close').focus({preventScroll:true});
  }
  dialog.addEventListener('close',()=>{if(!dialog.open)openView=null;});
  dialog.addEventListener('click',e=>{
    const b=e.target.closest('[data-work]');
    if(b){index=Number(b.dataset.work); dialog.close(); render();}
    else if(e.target===$('close') || (e.target===dialog && !e.target.closest('.dialog-head') &&
      (e.clientX<dialog.getBoundingClientRect().left || e.clientX>dialog.getBoundingClientRect().right ||
       e.clientY<dialog.getBoundingClientRect().top || e.clientY>dialog.getBoundingClientRect().bottom)))dialog.close();
  });
  galleryButton.onclick=()=>show('gallery'); $('help').onclick=()=>show('help'); zoom.onclick=()=>show('zoom');
  $('revise').onclick=undo;
  $('retry').onclick=()=>{folios[index]=fresh(index); render(); surface.focus({preventScroll:true});};
  $('next').onclick=()=>{if(index===works.length-1)show('gallery');else{index++;render();surface.focus({preventScroll:true});}};
  window.addEventListener('boopland:languagechange',()=>{render();if(dialog.open)dialogContents();});
  BooplandI18n.apply(); render();
})();
