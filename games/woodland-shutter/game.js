(() => {
  'use strict';
  const F = WoodlandField, Art = WoodlandArt, $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('woodland-shutter.' + key, values);
  const ns = 'http://www.w3.org/2000/svg';
  const two = n => String(n).padStart(2,'0');
  const stage = $('stage'), dialog = $('dialog'), body = $('dialog-body');
  const albumKey = 'boopland.woodland-shutter.journal.v1';
  const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const save = (k,v) => { try { localStorage.setItem(k,v); } catch { /* still playable in memory */ } };
  let best = Array(6).fill(0);
  try {
    const saved = JSON.parse(read(albumKey));
    if (Array.isArray(saved)) best = best.map((_,i) =>
      Number.isInteger(saved[i]) && saved[i]>=40 && saved[i]<=100 ? saved[i] : 0);
  } catch { /* An old or interrupted save starts a new journal. */ }
  let state = F.outing(), view, background, nextPlate = 0;
  let sound = read(albumKey+'.audio') === 'on', audio = null;
  let latest = null, noteTimer = 0, visibleNote = '', phaseKey = '', locked = false;
  let previousTime = null, raf = 0, lastDraw = -1, dialogView = null, pointer = null;
  const held = new Set(), plates = new Map();

  function unlockSound() {
    if (!sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!audio && Audio) audio = new Audio();
      if (audio?.state === 'suspended') audio.resume().catch(()=>{});
    } catch { /* All game cues are visible in the scene. */ }
  }
  function tone(type) {
    if (!sound || !audio || audio.state !== 'running' || document.hidden) return;
    const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
    const shutter = type === 'shot', duration = shutter ? .065 : .16;
    osc.type = shutter ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(shutter ? 240 : type==='focus' ? 590 : 1070,now);
    osc.frequency.exponentialRampToValueAtTime(shutter ? 52 : type==='focus' ? 700 : 1460,now+duration);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(shutter ? .09 : .045,now+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain); gain.connect(audio.destination);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
    osc.start(now); osc.stop(now+duration);
  }
  function artSvg(inner, box, cls='') {
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',box); svg.setAttribute('aria-hidden','true');
    if (cls) svg.setAttribute('class',cls);
    svg.innerHTML=inner;
    return svg;
  }
  function textNode(tag,content,cls) {
    const el=document.createElement(tag); if(cls) el.className=cls; el.textContent=content; return el;
  }
  function button(label, action, className='') {
    const btn=textNode('button',label,className); btn.type='button'; btn.onclick=action; return btn;
  }
  function speciesName(index){ return t(index===null?'empty':'bird'+index); }
  function printLabel(shot){return t('photo',{name:speciesName(shot.index),n:shot.total});}
  function birdDrawing(p,focus) {
    if (!p) return '';
    const blur=(1-focus)*.85;
    return '<g style="filter:blur('+blur.toFixed(2)+'px)">'+Art.liveBird(p)+'</g>';
  }
  function collectUnusedPlates() {
    const active = new Set([background,...state.shots.map(s=>s.plate)]);
    for (const [key,node] of plates) if (!active.has(key)) {node.remove();plates.delete(key);}
  }
  function resize() {
    const w=stage.clientWidth, h=stage.clientHeight;
    if(w<1||h<1) return;
    view=F.world(w,h);
    const vb='0 0 '+view.w+' '+view.h;
    if ($('land').getAttribute('viewBox')===vb) return;
    $('land').setAttribute('viewBox',vb);
    const plate=document.createElementNS(ns,'g');
    background='woodland-plate-'+(++nextPlate); plate.id=background;
    plate.innerHTML=Art.scene(view.w,view.h);
    $('landscapes').append(plate); plates.set(background,plate); collectUnusedPlates();
    $('land-use').setAttribute('href','#'+background);
    refreshScene(true);
  }
  function makePrint(shot,cls='') {
    const cam=shot.camera, vb=[cam.x-cam.w/2,cam.y-cam.h/2,cam.w,cam.h].join(' ');
    return artSvg('<use href="#'+shot.plate+'"/>'+shot.subject+shot.leafArt+shot.signArt,vb,cls);
  }
  function card(index) {
    const b=button('',()=>openPanel('species',index),'card'+(best[index]?' caught':''));
    b.append(textNode('span',two(index+1),'number'));
    b.append(artSvg(Art.bird(index),'-59 -34 112 65'), textNode('strong',speciesName(index)),
      textNode('span',best[index]?'✓':'','seal'));
    const status=best[index]?t('best',{n:best[index]}):t('unknown');
    b.setAttribute('aria-label',speciesName(index)+' · '+status);
    return b;
  }
  function guide(container) {
    container.replaceChildren(...F.birds.map((_,i)=>card(i)));
  }
  function journal() {
    $('count').textContent=best.filter(Boolean).length+' / 6';
    guide($('guide'));
  }
  function roll() {
    $('film').textContent=two(state.film);
    const strip=$('strip'); strip.replaceChildren();
    for(let i=0;i<6;i++){
      const shot=state.shots[i];
      if(!shot) strip.append(textNode('span',two(i+1),'slot'));
      else {
        const b=button('',()=>openPanel('print',i),'slot'); b.append(makePrint(shot));
        b.setAttribute('aria-label',t('frame',{n:i+1})+' · '+printLabel(shot)); strip.append(b);
      }
    }
    $('print-note').textContent=latest?printLabel(latest):t('rule');
    $('focus').disabled=!state.film;
    const shotLabel=$('shoot').querySelector('span');
    shotLabel.dataset.i18n='woodland-shutter.'+(state.film?'shutter':'review');
    shotLabel.textContent=t(state.film?'shutter':'review');
  }
  function audioButton(){
    const b=$('sound'), label=t(sound?'mute':'unmute');
    b.setAttribute('aria-label',label); b.title=label;b.setAttribute('aria-pressed',String(sound));
    $('speaker').setAttribute('href',sound?'#ic-sound':'#ic-muted');
    $('book-button').title=t('guide');
  }
  function caption() {
    const index=F.current(state), bird=F.pose(index,state.time,view);
    const phase = bird ? (bird.moment?'moment':'perched') : state.time<F.cueEnd ? F.birds[index].cue : 'departed';
    if(phaseKey!==index+'-'+phase) {
      if(phase==='moment' || (!bird && state.time<F.cueEnd)) tone('sign');
      phaseKey=index+'-'+phase;
    }
    const text = latest && noteTimer>0 ? printLabel(latest) :
      t(phase,{name:speciesName(index),action:t('act'+index)});
    if (visibleNote!==text) { $('cue').textContent=text; visibleNote=text; }
  }
  function focusIndicator() {
    const isLocked=state.focus>=.995;
    if(!locked && isLocked) tone('focus');
    locked=isLocked;
    $('focus-light').classList.toggle('on',locked); $('finder').classList.toggle('locked',locked);
    $('meter').style.transform='scaleX('+state.focus.toFixed(3)+')';
    const label=t(locked?'locked':state.focusing?'focusing':'focus');
    if($('focus-label').textContent!==label) $('focus-label').textContent=label;
    $('focus').setAttribute('aria-pressed',String(state.focusing));
  }
  let leafStamp='';
  function drawFinder(){
    const cam=F.viewfinder(state,view); $('finder').setAttribute('transform','translate('+cam.x+' '+cam.y+')');
  }
  function refreshScene(force=false) {
    if(!view) return;
    const index=F.current(state), stamp=background+'-'+index;
    if(leafStamp!==stamp) { $('leaves').innerHTML=Art.foreground(index,view); leafStamp=stamp; }
    const step=Math.floor(state.time*16);
    if(force || step!==lastDraw) {
      $('creature').innerHTML=birdDrawing(F.pose(index,state.time,view),state.focus);
      $('signal').innerHTML=state.time<F.cueEnd ? Art.sign(index,view,state.time):'';
      lastDraw=step;
    }
    drawFinder(); focusIndicator(); caption();
  }
  function resetInputs(){ held.clear();pointer=null;previousTime=null; }
  function stopLoop(){cancelAnimationFrame(raf);raf=0;resetInputs();}
  function startLoop(){if(!raf && !dialogView && !document.hidden && state.film) raf=requestAnimationFrame(loop);}
  function loop(now){
    raf=0;
    if(document.hidden||dialogView||!state.film) {previousTime=null;return;}
    const dt=previousTime===null ? 0 : Math.min((now-previousTime)/1000,.08);
    previousTime=now;
    const dx=Number(held.has('ArrowRight'))-Number(held.has('ArrowLeft'));
    const dy=Number(held.has('ArrowDown'))-Number(held.has('ArrowUp'));
    if(dx||dy){
      const cam=F.viewfinder(state,view), dist=dt*225/Math.hypot(dx,dy);
      F.aimAt(state,cam.x+dx*dist,cam.y+dy*dist,view);
    }
    F.tick(state,dt,view); noteTimer-=dt; refreshScene();startLoop();
  }
  function focus(){
    if(dialogView||!state.film) return;
    unlockSound();state.focusing=true;noteTimer=0;focusIndicator();caption();
  }
  function shoot(){
    if(dialogView||!view) return;
    if(!state.film){openPanel('results');return;}
    unlockSound();
    const i=F.current(state), cam=F.viewfinder(state,view), b=F.pose(i,state.time,view);
    const shot=F.shoot(state,view);
    shot.plate=background; shot.camera=cam;shot.subject=birdDrawing(b,state.focus);
    shot.leafArt=$('leaves').innerHTML;
    shot.signArt=state.time<F.cueEnd ? Art.sign(i,view,state.time):'';
    latest=shot;noteTimer=1.9;
    if(shot.index!==null && shot.total>=40 && shot.total>best[shot.index]){
      best[shot.index]=shot.total;save(albumKey,JSON.stringify(best));journal();
    }
    tone('shot');
    const flash=$('flash');flash.classList.remove('fired');void flash.offsetWidth;flash.classList.add('fired');
    roll();refreshScene(true);
    if(!state.film) openPanel('results');
  }
  function newOuting(){
    state=F.outing();latest=null;noteTimer=0;phaseKey='';lastDraw=-1;locked=false;
    collectUnusedPlates();roll();refreshScene(true);closePanel();
  }
  function panelContents(){
    if(!dialogView)return;
    const {mode,index}=dialogView;
    body.replaceChildren(); const title=$('dialog-title');
    if(mode==='help'){
      title.textContent=t('help');
      const list=document.createElement('ol');list.className='help-list';
      for(let i=0;i<4;i++) list.append(textNode('li',t('helpStep'+i)));
      body.append(list,button(t('okay'),closePanel,'primary'));
    } else if(mode==='guide'){
      title.textContent=t('guide')+' · '+best.filter(Boolean).length+'/6';
      const cards=document.createElement('div');cards.className='guide-grid dialog-guide';
      guide(cards);body.append(cards,textNode('p',t('rule'),'plate-desc'));
      if(state.shots.length) body.append(button(t('review'),()=>openPanel('results'),'primary'));
    } else if(mode==='species'){
      title.textContent=speciesName(index);
      body.append(artSvg(Art.bird(index),'-59 -34 112 65','detail-art'),
        textNode('p',t('act'+index)+' · '+(best[index]?t('best',{n:best[index]}):t('unknown')),'plate-desc'),
        button(t('guide'),()=>openPanel('guide'),'primary'));
    } else if(mode==='print'){
      const shot=state.shots[index];title.textContent=t('frame',{n:two(index+1)});
      body.append(makePrint(shot,'large-print'),textNode('h3',printLabel(shot),'plate-desc'));
      const scores=document.createElement('dl');scores.className='scores';
      for(const [key,max] of [['position',40],['clarity',40],['action',20]]){
        const line=document.createElement('div');
        line.append(textNode('dt',t(key)),textNode('dd',shot[key]+' / '+max));scores.append(line);
      }
      body.append(scores,button(t('review'),()=>openPanel('results'),'primary'));
    } else {
      title.textContent=t('roll');
      const total=document.createElement('div');total.className='total-line';
      total.append(textNode('span',t('total')),textNode('b',String(state.shots.reduce((s,p)=>s+p.total,0))));
      const grid=document.createElement('div');grid.className='print-grid';
      state.shots.forEach((shot,i)=>{
        const b=button('',()=>openPanel('print',i),'print');
        b.append(makePrint(shot),textNode('span',two(i+1)+' · '+printLabel(shot)));grid.append(b);
      });
      body.append(total,grid,button(t(state.film?'resume':'retry'),state.film?closePanel:newOuting,'primary'));
    }
  }
  function openPanel(mode,index=null){
    stopLoop();dialogView={mode,index};panelContents();
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;$('dismiss').focus({preventScroll:true});
  }
  function closePanel(){if(dialog.open) dialog.close();}
  dialog.addEventListener('close',()=>{dialogView=null;resetInputs();startLoop();});
  let pressedBackdrop=false;
  function onBackdrop(e){
    const r=dialog.getBoundingClientRect();
    return e.target===dialog && (e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);
  }
  dialog.addEventListener('pointerdown',e=>{pressedBackdrop=onBackdrop(e);});
  dialog.addEventListener('click',e=>{
    if(pressedBackdrop && onBackdrop(e))closePanel();
    pressedBackdrop=false;
  });
  function aim(e){
    if(!view||dialogView||!state.film)return;
    const box=$('land').getBoundingClientRect();
    F.aimAt(state,(e.clientX-box.left)*view.w/box.width,(e.clientY-box.top)*view.h/box.height,view);
    drawFinder();
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.button!==0||pointer!==null)return;
    unlockSound();pointer=e.pointerId;stage.setPointerCapture(e.pointerId);aim(e);
  });
  stage.addEventListener('pointermove',e=>{if(pointer===e.pointerId) aim(e);});
  stage.addEventListener('lostpointercapture',e=>{if(pointer===e.pointerId)pointer=null;});
  let shutterKeyHeld=false;
  document.addEventListener('keydown',e=>{
    if(e.code==='Space' && shutterKeyHeld){e.preventDefault();return;}
    if(dialogView || e.altKey || e.ctrlKey || e.metaKey)return;
    if(e.code.startsWith('Arrow')){e.preventDefault();held.add(e.code);}
    else if(e.code==='KeyF'){e.preventDefault();if(!e.repeat)focus();}
    else if(e.code==='Space'){
      if(document.activeElement?.closest('button,a') && document.activeElement!==$('shoot') && document.activeElement!==$('focus'))return;
      e.preventDefault();if(!e.repeat){shutterKeyHeld=true;shoot();}
    }
  });
  document.addEventListener('keyup',e=>{
    held.delete(e.code);
    if(e.code==='Space' && shutterKeyHeld){e.preventDefault();shutterKeyHeld=false;}
  });
  window.addEventListener('blur',()=>{shutterKeyHeld=false;resetInputs();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stopLoop();if(audio?.state==='running')audio.suspend().catch(()=>{});}
    else {unlockSound();startLoop();}
  });
  window.addEventListener('pagehide',stopLoop);window.addEventListener('pageshow',startLoop);
  // Expose on the press edge, including a second finger while the first holds the frame.
  function cameraControl(element, action) {
    element.addEventListener('pointerdown',event=>{
      if(event.button!==0 || element.disabled)return;
      event.preventDefault();element.focus({preventScroll:true});action();
    });
    // Keyboard and assistive activation dispatch a click without a pointer press.
    element.addEventListener('click',event=>{if(event.detail===0)action();});
  }
  cameraControl($('shoot'),shoot);cameraControl($('focus'),focus);
  $('help').onclick=()=>openPanel('help');$('book-button').onclick=()=>openPanel('guide');
  $('dismiss').onclick=closePanel;
  $('sound').onclick=()=>{sound=!sound;save(albumKey+'.audio',sound?'on':'off');unlockSound();audioButton();};
  function translate(){audioButton();journal();roll();refreshScene(true);panelContents();}
  window.addEventListener('boopland:languagechange',translate);
  resize();new ResizeObserver(resize).observe(stage);translate();startLoop();
})();

