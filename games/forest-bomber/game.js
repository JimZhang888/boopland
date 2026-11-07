(() => {
  'use strict';
  const E=window.ForestBomber, I=window.BooplandI18n, $=id=>document.getElementById(id), t=(key,values)=>I.t(`forest.${key}`,values);
  const canvas=$('forest-canvas'), scene=new window.ForestScene.Scene(canvas);
  let state=E.create(), last=0, best=0, sound=false, audio=null, bombPending=false, bombUntil=0, toastUntil=0, toastKey='', toastValues={}, lastMode='', frame=0, rafId=0;
  const keys=new Map(), pointers=new Map();
  try{best=Math.max(0,Number(localStorage.getItem('boopland-forest-bomber-best'))||0);}catch{}
  function saveBest(){if(state.score>best){best=state.score;try{localStorage.setItem('boopland-forest-bomber-best',String(best));}catch{}}}
  function clearInput(){keys.clear();pointers.clear();bombPending=false;document.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed'));}
  function direction(){const values=[...keys.values(),...pointers.values()];return values.length?values[values.length-1]:undefined;}
  function steer(dir){if(state.mode==='running')E.move(state,state.actors[0],dir);}
  function plant(){if(state.mode!=='running')return;if(E.placeBomb(state)){bombPending=false;}else if(state.actors[0].moveLeft>0){bombPending=true;bombUntil=state.time+.6;}else{showToast('bombBusy');}}
  function tone(kind){
    if(!sound||document.hidden)return;
    try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});
      const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;
      const cfg={plant:[340,180,.08],explode:[120,38,.2],pickup:[590,960,.14],hit:[210,90,.15],won:[480,900,.25],chain:[680,1100,.15]}[kind];
      if(!cfg)return;o.type=kind==='explode'?'triangle':'sine';o.frequency.setValueAtTime(cfg[0],now);o.frequency.exponentialRampToValueAtTime(cfg[1],now+cfg[2]);g.gain.setValueAtTime(.045,now);g.gain.exponentialRampToValueAtTime(.001,now+cfg[2]);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+cfg[2]+.02);
    }catch{sound=false;refreshSound();}
  }
  function refreshSound(){$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));$('sound-mark').setAttribute('d',sound?'M16 8q6 4 0 8m3-11q8 7 0 14':'m16 9 5 6m0-6-5 6');}
  function showToast(key,values={}){toastKey=key;toastValues=values;toastUntil=state.time+2.1;$('toast').textContent=t(key,values);$('toast').hidden=false;}
  function resize(){const r=$('arena-space').getBoundingClientRect(), border=window.innerHeight<=480&&window.innerWidth>=480?8:12;const scale=Math.max(.01,Math.min((r.width-border)/(E.WIDTH*56),(r.height-border)/(E.HEIGHT*56)));const w=E.WIDTH*56*scale,h=E.HEIGHT*56*scale;$('board').style.width=`${w+border}px`;$('board').style.height=`${h+border}px`;scene.resize(w,h);scene.draw(state,0);}
  function refreshHUD(){
    const p=state.actors[0],active=state.bombs.filter(b=>b.ownerId===0).length,remaining=Math.ceil(state.remaining);
    $('round').textContent=`${String(state.stage).padStart(2,'0')} / 05`;$('round-large').textContent=String(state.stage).padStart(2,'0');
    $('grove-name').textContent=t(`grove${state.stage}`);$('score').textContent=String(state.score).padStart(5,'0');$('best').textContent=String(best);
    $('hearts').textContent=Array.from({length:3},(_,i)=>i<p.hp?'♥':'♡').join(' ');$('hearts').setAttribute('aria-label',t('hpStatus',{value:Math.max(0,p.hp)}));
    $('rivals').textContent=String(state.actors.slice(1).filter(a=>a.alive).length);$('timer').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
    document.querySelector('.timer-stat').classList.toggle('urgent',remaining<=30);$('bomb-stat').textContent=`${p.capacity-active} / ${p.capacity}`;$('range-stat').textContent=String(p.range);$('speed-stat').textContent=String(Math.round((p.speed-5.5)/.65)+1);
    $('shield-stat').hidden=!p.shield;$('shield-stat').setAttribute('aria-label',t('shieldActive'));$('shield-stat').title=t('shieldActive');
    $('status').textContent=t(state.mode==='running'?'active':state.mode==='ready'?'waiting':state.mode==='paused'?'pause':state.mode==='lost'?'lostTitle':'wonTitle');
    $('bomb').disabled=state.mode!=='running';$('pause').disabled=!['running','paused'].includes(state.mode);$('pause').setAttribute('aria-label',t(state.mode==='paused'?'resume':'pause'));$('pause-mark').textContent=state.mode==='paused'?'▷':'Ⅱ';
    for(const el of document.querySelectorAll('[data-rival]')){const alive=state.actors[Number(el.dataset.rival)].alive;el.classList.toggle('out',!alive);el.querySelector('.rival-state').textContent=alive?'●':'×';el.setAttribute('aria-label',`${t(`rival${el.dataset.rival}`)} · ${t(alive?'alive':'out')}`);}
  }
  function refreshOverlay(focus=false){
    const mode=state.mode,overlay=$('overlay');overlay.dataset.mode=mode;overlay.hidden=mode==='running';
    if(mode==='running')return;
    let title='readyTitle',text='readyText',action='start',kicker='readyKicker';
    if(mode==='paused'){title='pausedTitle';text='pausedText';action='resume';kicker='pausedKicker';}
    if(mode==='won'){title='wonTitle';text='wonText';action='next';kicker='wonKicker';}
    if(mode==='lost'){title='lostTitle';text=state.remaining<=0?'timeoutText':'lostText';action='retry';kicker='lostKicker';}
    if(mode==='complete'){title='completeTitle';text='completeText';action='retry';kicker='wonKicker';}
    $('overlay-title').textContent=t(title);$('overlay-text').textContent=t(text);$('overlay-kicker').textContent=t(kicker);$('primary-text').textContent=t(action);
    $('restart').hidden=mode!=='paused';$('intro-controls').hidden=mode!=='ready';document.querySelector('.intro-illustration').hidden=mode!=='ready';
    $('result-stats').hidden=!['won','lost','complete'].includes(mode);$('result-stats').textContent=t('results',{score:state.score,best});
    if(focus)$('primary').focus({preventScroll:true});
  }
  function sync(focus=false){saveBest();refreshHUD();refreshOverlay(focus);refreshSound();document.title=`${t('title')} · Boopland`;}
  function setPaused(){if(state.mode!=='running')return;E.pause(state);clearInput();if(audio?.state==='running')audio.suspend().catch(()=>{});sync(true);}
  function resume(){if(state.mode!=='paused')return;clearInput();E.start(state);last=0;if(sound&&audio)audio.resume().catch(()=>{});sync();canvas.focus({preventScroll:true});}
  function newRun(){clearInput();state=E.create();scene.particles=[];$('toast').hidden=true;toastKey='';E.start(state);last=0;lastMode='running';sync();canvas.focus({preventScroll:true});resize();}
  $('primary').addEventListener('click',()=>{
    if(state.mode==='paused'){resume();return;}
    if(state.mode==='won'){const next=E.next(state);if(next){state=next;clearInput();scene.particles=[];$('toast').hidden=true;E.start(state);last=0;sync();resize();canvas.focus({preventScroll:true});}return;}
    if(state.mode==='ready'){clearInput();E.start(state);last=0;sync();canvas.focus({preventScroll:true});}else newRun();
  });
  $('restart').addEventListener('click',newRun);
  $('pause').addEventListener('click',()=>state.mode==='running'?setPaused():resume());
  $('sound').addEventListener('click',()=>{sound=!sound;refreshSound();if(sound)tone('pickup');else if(audio)audio.suspend().catch(()=>{});});
  const help=$('help-dialog');let helpReturn=null;
  $('help').addEventListener('click',()=>{helpReturn=document.activeElement;setPaused();clearInput();help.showModal();});
  $('close-help').addEventListener('click',()=>help.close());
  help.addEventListener('click',e=>{if(e.target===help){const r=help.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)help.close();}});
  help.addEventListener('close',()=>{clearInput();helpReturn?.focus({preventScroll:true});});
  const mappings={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
  window.addEventListener('keydown',e=>{
    if(help.open||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();if(!e.repeat){if(state.mode==='running')setPaused();else if(state.mode==='paused')resume();}return;}
    if(state.mode!=='running')return;
    if(Object.hasOwn(mappings,e.code)){e.preventDefault();if(!keys.has(e.code)){keys.set(e.code,mappings[e.code]);steer(mappings[e.code]);}}
    if(e.code==='Space'||e.code==='KeyJ'){if(e.code==='Space'&&e.target.closest?.('button,a'))return;e.preventDefault();if(!e.repeat)plant();}
  });
  window.addEventListener('keyup',e=>{keys.delete(e.code);});
  for(const button of document.querySelectorAll('[data-dir]')){
    button.addEventListener('pointerdown',e=>{if(state.mode!=='running')return;e.preventDefault();button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,Number(button.dataset.dir));button.classList.add('pressed');steer(Number(button.dataset.dir));});
    const release=e=>{pointers.delete(e.pointerId);if(![...pointers.values()].includes(Number(button.dataset.dir)))button.classList.remove('pressed');};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
    button.addEventListener('click',e=>{if(e.detail===0)steer(Number(button.dataset.dir));});
  }
  $('bomb').addEventListener('pointerdown',e=>{if(state.mode!=='running')return;e.preventDefault();$('bomb').setPointerCapture(e.pointerId);$('bomb').classList.add('pressed');plant();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])$('bomb').addEventListener(name,()=>$('bomb').classList.remove('pressed'));
  $('bomb').addEventListener('click',e=>{if(e.detail===0)plant();});
  window.addEventListener('blur',()=>{clearInput();setPaused();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();setPaused();if(audio)audio.suspend().catch(()=>{});cancelAnimationFrame(rafId);rafId=0;}else if(!rafId)rafId=requestAnimationFrame(animate);last=0;});
  window.addEventListener('pagehide',()=>{clearInput();setPaused();if(audio)audio.suspend().catch(()=>{});cancelAnimationFrame(rafId);rafId=0;});
  window.addEventListener('pageshow',()=>{clearInput();last=0;sync();if(!document.hidden&&!rafId)rafId=requestAnimationFrame(animate);});
  window.addEventListener('boopland:languagechange',()=>{sync();if(toastKey&&!$('toast').hidden)$('toast').textContent=t(toastKey,toastValues);resize();});
  const observer=new ResizeObserver(resize);observer.observe($('arena-space'));window.addEventListener('resize',resize);
  function animate(now){
    const dt=last?Math.max(0,Math.min(.05,(now-last)/1000)):0;last=now;
    if(state.mode==='running'){
      if(bombPending&&state.time>bombUntil)bombPending=false;
      const input={direction:direction(),bomb:bombPending};E.step(state,dt,input);if(input.bombConsumed)bombPending=false;
      const events=E.drainEvents(state);let exploded=false;
      for(const event of events){scene.effect(event);
        if(event.type==='explode'){if(!exploded)tone('explode');exploded=true;}
        if(event.type==='plant'&&event.ownerId===0)tone('plant');
        if(event.type==='pickup'){tone('pickup');showToast(`pickup${event.item[0].toUpperCase()+event.item.slice(1)}`);}
        if(event.type==='chain'){tone('chain');showToast('chain',{count:event.count});}
        if(event.type==='shield'&&event.ownerId===0)showToast('shieldHit');
        if(event.type==='hit'&&event.ownerId===0){tone('hit');showToast('hurt');}
        if(event.type==='out'&&event.ownerId!==0)showToast('rivalOut',{name:t(`rival${event.ownerId}`)});
        if(event.type==='won')tone('won');
      }
      if(state.mode!=='running'){clearInput();$('toast').hidden=true;sync(true);}
      if(state.time>toastUntil)$('toast').hidden=true;
      if(frame%5===0){saveBest();refreshHUD();}
    }
    if(state.mode!==lastMode){lastMode=state.mode;sync();}
    if(!document.hidden)scene.draw(state,state.mode==='running'?dt:0);
    frame++;rafId=document.hidden?0:requestAnimationFrame(animate);
  }
  sync();resize();rafId=requestAnimationFrame(animate);
})();
