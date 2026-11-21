(() => {
  'use strict';
  const {levels,inspect,dirs}=PostRoutes;
  const $=id=>document.getElementById(id);
  const t=(key,values)=>BooplandI18n.t('post99.'+key,values);
  const colors=['#e4d4bd','#d9dfbf','#cfdfd9','#dedbc8','#e5d6ad','#d3e0cd'];
  const storeKey='boopland-post99-v1';
  let done=0, index=0, stamps=[], selected=0, trial=null, shown=0, running=false, delivered=false;
  let timer=0, xy, dialogKind='', previousFocus;
  function restore() {
    try {
      const data=JSON.parse(localStorage.getItem(storeKey));
      if(!data || !Number.isInteger(data.done)) return;
      done=Math.max(0,Math.min(6,data.done));
      index=Number.isInteger(data.index)?Math.max(0,Math.min(5,done,data.index)):Math.min(5,done);
      const level=levels[index];
      if(Array.isArray(data.stamps) && data.stamps.length<=level.steps && data.stamps.every(s=>Object.hasOwn(dirs,s)||Object.values(level.nodes).includes(s))) stamps=data.stamps.slice();
      delivered=Boolean(data.delivered && index<done && inspect(level,stamps).ok);
      if(delivered){trial=inspect(level,stamps);shown=stamps.length;}
      selected=stamps.length;
    } catch { /* File URLs can have isolated or disabled storage. */ }
  }
  function save() {
    try {localStorage.setItem(storeKey,JSON.stringify({done,index,stamps,delivered}));} catch { /* Play continues in this tab. */ }
  }
  const arrow=dir=>'<svg class="arrow" viewBox="0 0 28 28" aria-hidden="true" fill="none"><g transform="rotate('+({N:0,E:90,S:180,W:270}[dir])+' 14 14)"><path d="m6 13 8-8 8 8M14 6l-.3 17"/></g></svg>';
  const stampIcon=key=>Object.hasOwn(dirs,key)?arrow(key):PostArt.icon(key);
  const number=n=>String(n).padStart(2,'0');
  function button(label, action) {
    const el=document.createElement('button');el.type='button';el.setAttribute('aria-label',label);el.title=label;
    el.addEventListener('click',action);return el;
  }
  function renderLetter() {
    $('folio').textContent=t('letter',{n:index+1});
    $('code').textContent='99 / '+number(index+1);
    $('recipient-name').textContent=t('name'+index);
    $('portrait').innerHTML=PostArt.stamp(levels[index].nodes[levels[index].stop],number(index+1),colors[index]);
    const clues=[];
    for(let i=0;i<(index===5?3:2);i++){
      const li=document.createElement('li');li.textContent=t('clue'+index+i);clues.push(li);
    }
    $('clues').replaceChildren(...clues);
    $('closure-key').hidden=!levels[index].closed;
    redrawMap();
  }
  function redrawMap() {
    xy=PostMap.build($('town'),levels[index],index,t);
    renderTrace();
  }
  function renderTrace() {
    let trail=[levels[index].start],bad=null;
    if(trial){
      trail=trial.trail.slice(0,shown+1);
      if(!running && !delivered)bad=trial.attempted;
    }
    PostMap.trace($('town'),xy,trail,bad);
  }
  function renderTools() {
    $('tools').replaceChildren(...Object.keys(dirs).map(dir=>{
      const b=button(t(dir),()=>put(dir));
      b.className='dir';b.dataset.dir=dir;b.innerHTML=arrow(dir);
      return b;
    }));
  }
  function renderState() {
    const l=levels[index];
    $('album-count').textContent=done+'/6';
    $('n-stamps').textContent=stamps.length+' / '+l.steps;
    $('erase').disabled=running || delivered || !stamps.length;
    const bad=trial && !running && !trial.ok && trial.reason!=='incomplete'?trial.index:-1;
    const nodes=[];
    for(let i=0;i<l.steps;i++){
      const token=stamps[i];
      const b=button(t('stampSlot',{n:i+1,name:token?t(token):t('empty')}),()=>choose(i));
      b.className=['slot',token?'filled':'empty',!running&&!delivered&&i===selected?'selected':'',i===bad?'bad':'',running&&i===shown-1?'active':''].join(' ');
      b.setAttribute('aria-pressed',String(i===selected && !delivered && !running));
      b.dataset.num=String(i+1);b.disabled=running||delivered||i>stamps.length;
      if(token)b.innerHTML='<span class="stamp-icon">'+stampIcon(token)+'</span><span class="corner">'+(i+1)+'</span>';
      nodes.push(b);
    }
    $('slots').replaceChildren(...nodes);
    const canStamp=!running&&!delivered&&(stamps.length<l.steps||selected<l.steps);
    $('tools').querySelectorAll('button').forEach(b=>{b.disabled=!canStamp;});
    $('send').disabled=running || !stamps.length;
    $('send').querySelector('span').textContent=t(delivered?(index===5?'album':'next'):'send');
    const status=$('status');
    status.className='status'+(bad>=0?' error':delivered?' success':'');
    let message=t('hint');
    if(running)message=t('running',{n:Math.min(shown+1,stamps.length)});
    else if(delivered)message=t('finished');
    else if(trial)message=bad>=0?t('error',{n:bad+1,reason:t(trial.reason)}):t('incomplete',{n:l.steps-stamps.length});
    status.textContent=message;
  }
  function clearTrial() {
    trial=null;shown=0;renderTrace();
  }
  function choose(i) {
    if(running||delivered||i>stamps.length)return;
    selected=i;renderState();
    $('slots').children[i]?.focus({preventScroll:true});
  }
  function put(token) {
    if(running||delivered||selected>=levels[index].steps)return;
    clearTrial();
    stamps[selected]=token;
    selected=stamps.length;
    save();renderState();
  }
  function erase() {
    if(running||delivered||!stamps.length)return;
    clearTrial();
    stamps.splice(Math.min(selected,stamps.length-1),1);
    selected=stamps.length;save();renderState();
  }
  function finishTrial() {
    running=false;
    if(trial.ok){
      delivered=true;done=Math.max(done,index+1);selected=stamps.length;
    } else selected=Math.min(trial.index,stamps.length);
    save();renderTrace();renderState();
    if(delivered && index===5)openDialog('album');
  }
  function schedule() {
    clearTimeout(timer);
    if(!running || document.hidden || dialogKind)return;
    const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?150:480;
    timer=setTimeout(()=>{
      if(shown<trial.trail.length-1){
        shown++;renderTrace();renderState();schedule();
      } else finishTrial();
    },delay);
  }
  function play() {
    if(running)return;
    if(delivered){if(index===5)openDialog('album');else startLetter(index+1);return;}
    if(!stamps.length)return;
    trial=inspect(levels[index],stamps);shown=0;running=true;renderTrace();renderState();schedule();
  }
  function startLetter(n) {
    clearTimeout(timer);
    index=n;stamps=[];selected=0;trial=null;shown=0;running=false;delivered=false;
    save();renderLetter();renderState();
  }
  function legendBody(body) {
    const grid=document.createElement('div');grid.className='legend-grid';
    Object.values(levels[index].nodes).forEach(kind=>{
      const b=button(t('mark',{name:t(kind)}),()=>{closeDialog();put(kind);});
      b.className='legend-item';b.innerHTML=PostArt.icon(kind);
      const label=document.createElement('span');label.textContent=t(kind);b.append(label);
      b.disabled=running||delivered||selected>=levels[index].steps;grid.append(b);
    });
    body.append(grid);
  }
  function albumBody(body) {
    const note=document.createElement('p');note.textContent=done===6?t('albumDone'):t('collected',{n:done});
    const grid=document.createElement('div');grid.className='album-grid'+(done===6?' book-open':'');
    levels.forEach((l,i)=>{
      const earned=i<done,unlocked=i<=done;
      const b=button((unlocked?t('reopen'):t('locked'))+' · '+t('name'+i),()=>{closeDialog();startLetter(i);});
      b.className='album-item';b.style.setProperty('--n',i);
      b.innerHTML=PostArt.stamp(earned?l.nodes[l.stop]:'post',number(i+1),earned?colors[i]:'#e7e4d5');
      if(!earned)b.querySelector('svg').style.filter='grayscale(1)';
      const caption=document.createElement('span');caption.textContent=earned||unlocked?t('name'+i):t('locked');
      b.append(caption);b.disabled=!unlocked;grid.append(b);
    });
    body.append(note,grid);
  }
  function drawDialog() {
    $('dialog-title').textContent=t(dialogKind==='key'?'legend':dialogKind==='album'&&done===6?'full':dialogKind);
    const body=$('dialog-body');body.replaceChildren();
    if(dialogKind==='key')legendBody(body);
    else if(dialogKind==='album')albumBody(body);
    else {
      const guide=document.createElement('ol');guide.className='guide';
      ['help1','help2','help3'].forEach(key=>{const item=document.createElement('li');item.textContent=t(key);guide.append(item);});body.append(guide);
    }
  }
  function openDialog(kind) {
    if(!dialogKind)previousFocus=document.activeElement;
    dialogKind=kind;clearTimeout(timer);drawDialog();
    if(!$('dialog').open)$('dialog').showModal();
    $('close').focus({preventScroll:true});
  }
  function resumeDesk(){
    if($('dialog').open || !dialogKind)return;
    dialogKind='';
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    schedule();
  }
  function closeDialog(){
    if($('dialog').open)$('dialog').close();
    resumeDesk();
  }
  function renderAll() {
    renderLetter();renderTools();renderState();if(dialogKind)drawDialog();
  }
  for(const key of ['key','help','album'])$(key).addEventListener('click',()=>openDialog(key));
  $('dialog').addEventListener('close',resumeDesk);
  $('dialog').addEventListener('click',e=>{if(e.target===$('dialog'))closeDialog();});
  $('close').addEventListener('click',closeDialog);$('erase').addEventListener('click',erase);$('send').addEventListener('click',play);
  $('town').addEventListener('click',e=>{const node=e.target.closest('[data-land]');if(node)put(node.dataset.land);});
  $('town').addEventListener('keydown',e=>{
    const node=e.target.closest('[data-land]');
    if(node&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(!e.repeat)put(node.dataset.land);}
  });
  document.addEventListener('keydown',e=>{
    if(dialogKind && e.key==='Escape'){e.preventDefault();closeDialog();return;}
    if(dialogKind||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;
    const dir={ArrowUp:'N',ArrowRight:'E',ArrowDown:'S',ArrowLeft:'W'}[e.key];
    if(dir){e.preventDefault();if(!e.repeat)put(dir);}
    else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();if(!e.repeat)erase();}
    else if(e.key==='Enter'&&!e.target.closest('button,a,[data-land]')){e.preventDefault();if(!e.repeat)play();}
  });
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  window.addEventListener('pageshow',schedule);
  window.addEventListener('boopland:languagechange',renderAll);
  restore();renderAll();
  new ResizeObserver(redrawMap).observe($('town').parentElement);
})();
