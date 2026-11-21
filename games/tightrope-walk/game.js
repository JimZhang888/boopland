(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('tightrope.' + key, values);
  const view = RopeArt.mount(byId('world'));
  const scene = byId('scene'), sheet = byId('sheet'), pause = byId('pause');
  const panel = byId('panel'), panelLayer = byId('panel-layer'), action = byId('panel-action');
  const held = new Map();
  let state = RopeWalk.start(0), mode = 'ready', helpReturn = 'ready', scores = [];
  let last = null, bank = 0, frame = 0, fallStart = 0;
  let impulse = { left: 0, right: 0 };
  let decimals, integers;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function formatters() {
    decimals = new Intl.NumberFormat(BooplandI18n.language, {maximumFractionDigits:1,minimumFractionDigits:1});
    integers = new Intl.NumberFormat(BooplandI18n.language, {maximumFractionDigits:0});
  }
  function put(id, text) {
    const node = byId(id);
    if (node.textContent !== text) node.textContent = text;
  }
  function distance(value) { return integers.format(Math.floor(value)) + ' m'; }
  function has(side) { return [...held.values()].includes(side) || state.time < impulse[side]; }
  function resetInput() {
    held.clear();
    impulse = {left:0, right:0};
    byId('left').classList.remove('pressed'); byId('right').classList.remove('pressed');
  }
  function push(token, side) {
    if (mode !== 'walking') return;
    held.set(token,side);
    // A fast tap that begins and ends between two frames still moves the walker.
    impulse[side] = Math.max(impulse[side], state.time + .11);
    byId(side).classList.add('pressed');
  }
  function currentStatus() {
    if (mode === 'ready' || (mode === 'help' && helpReturn === 'ready')) return t('ready');
    if (mode === 'fell') return t('lost');
    if (mode === 'crossed') return t('arrived');
    if (mode !== 'walking') return t('stopped');
    if (Math.abs(state.angle) >= RopeWalk.warning) return t('danger',{dir:t(state.angle>0?'dirLeft':'dirRight')});
    if (state.distance < 4) return t('safe');
    return t(Math.abs(state.angle)>12?'leaning':'steady');
  }
  function readings(fall=0) {
    const wind = RopeWalk.weather(state);
    view.draw(state, wind, mode, fall);
    const phase = wind.phase === 'safe' ? 'sheltered' : wind.phase;
    const windText = t(phase,{arrow:wind.direction>0?'→':'←'});
    put('wind-text',windText);
    byId('weather').dataset.phase = phase;
    put('distance',distance(state.distance));
    put('timer',decimals.format(state.time)+' s');
    put('angle',String(Math.round(state.angle))+'°');
    put('status',currentStatus());
    byId('balance').style.setProperty('--tilt',Math.max(0,Math.min(100,50+50*state.angle/RopeWalk.limit))+'%');
    byId('journey').style.setProperty('--progress',100*state.distance/state.route.length+'%');
    const danger=mode==='walking' && Math.abs(state.angle)>=RopeWalk.warning;
    byId('balance').classList.toggle('danger',danger);
    byId('status').classList.toggle('danger',danger||mode==='fell');
    for (const side of ['left','right']) byId(side).classList.toggle('pressed',mode==='walking' && has(side));
  }
  function resultCells(result) {
    const root=byId('results');
    root.replaceChildren();
    for (const [key, value] of [['stability',integers.format(result.stability)+'%'],['time',decimals.format(result.time)+' s'],['score',integers.format(result.points)]]) {
      const item=document.createElement('div'), label=document.createElement('span'), number=document.createElement('b');
      label.textContent=t(key); number.textContent=value; item.append(label,number); root.append(item);
    }
  }
  function render(focus=false) {
    sheet.dataset.mode=mode;
    put('place',t('stage'+state.stage));
    put('stage-no','0'+(state.stage+1)+' / 03');
    [...byId('itinerary').children].forEach((node,i)=>{
      node.classList.toggle('current',i===state.stage);
      node.classList.toggle('done',i<state.stage || (mode==='crossed' && i===state.stage));
      if(i===state.stage) node.setAttribute('aria-current','step'); else node.removeAttribute('aria-current');
    });
    pause.disabled=!['walking','paused'].includes(mode);
    const pauseLabel=t(mode==='paused'?'resume':'pause');
    pause.dataset.i18nLabel=pause.dataset.i18nTitle='tightrope.'+(mode==='paused'?'resume':'pause');
    pause.setAttribute('aria-label',pauseLabel); pause.title=pauseLabel;
    byId('pause-icon').setAttribute('href',mode==='paused'?'#i-play':'#i-pause');
    byId('help').disabled=mode==='help';
    byId('left').disabled=byId('right').disabled=mode!=='walking';
    byId('start').hidden=mode!=='ready'; byId('balance').hidden=mode==='ready';
    const open=!['ready','walking'].includes(mode);
    panelLayer.hidden=!open;
    byId('results').hidden=mode!=='crossed';
    const place=t('stage'+state.stage);
    const final=state.stage===RopeWalk.routes.length-1;
    if (open) {
      let title, copy, button;
      if(mode==='help') {title=t('help'); copy=t('rules'); button=t('close');}
      if(mode==='paused') {title=t('paused'); copy=t('pauseCopy'); button=t('resume');}
      if(mode==='fell') {title=t('fell'); copy=t('fallCopy',{distance:distance(state.distance)}); button=t('retry');}
      if(mode==='crossed') {
        title=t(final?'finish':'crossed');
        copy=final?t('total',{score:integers.format(scores.reduce((sum,r)=>sum+r.points,0))}):
          t('crossedCopy',{place,length:distance(RopeWalk.routes[state.stage+1].length)});
        button=t(final?'replay':'next'); resultCells(scores[state.stage]);
      }
      put('panel-title',title); put('panel-copy',copy); put('panel-action',button);
      byId('panel-copy').tabIndex=mode==='help'?0:-1;
      if(focus) {panel.scrollTop=0; panel.focus({preventScroll:true});}
    }
    byId('timerBox').title=t('time'); byId('distanceBox').title=t('distance');
    readings(mode==='fell'?1:0);
  }
  function updateMode(next, focus=true) {
    cancelAnimationFrame(frame); frame=0; last=null; bank=0; resetInput(); mode=next;
    render(focus);
    if (mode==='walking') frame=requestAnimationFrame(tick);
    if (mode==='fell' && !reducedMotion.matches) {
      fallStart=performance.now();
      readings(0); frame=requestAnimationFrame(fallFrame);
    }
  }
  function fallFrame(now) {
    frame=0;
    if(mode!=='fell'||document.hidden) return;
    const p=Math.min(1,(now-fallStart)/320);
    readings(p*p);
    if (p<1) frame=requestAnimationFrame(fallFrame);
  }
  function tick(now) {
    frame=0;
    if (mode!=='walking') return;
    if(document.hidden) {updateMode('paused');return;}
    if (last!==null) bank+=Math.min(.1,Math.max(0,(now-last)/1000));
    last=now;
    while(bank>=RopeWalk.dt) {
      RopeWalk.step(state,Number(has('right'))-Number(has('left')));
      bank-=RopeWalk.dt;
      if(state.status==='fell') {updateMode('fell');return;}
      if(state.status==='crossed') {scores[state.stage]=RopeWalk.reward(state);updateMode('crossed');return;}
    }
    readings();
    frame=requestAnimationFrame(tick);
  }
  function begin(stage) {
    state=RopeWalk.start(stage);
    updateMode('walking',false);
    if (document.activeElement===action || panel.contains(document.activeElement)) document.activeElement.blur();
  }
  function togglePause() {
    if(mode==='walking') updateMode('paused');
    else if(mode==='paused' && !document.hidden) updateMode('walking');
  }
  function closeHelp() {
    updateMode(helpReturn);
    (helpReturn==='ready'?byId('help'):action).focus({preventScroll:true});
  }
  action.addEventListener('click',()=>{
    if(mode==='help') return closeHelp();
    if(mode==='paused') return togglePause();
    if(mode==='fell') return begin(state.stage);
    if(mode==='crossed') {
      if(state.stage===RopeWalk.routes.length-1) {scores=[];begin(0);} else begin(state.stage+1);
    }
  });
  byId('start').addEventListener('click',()=>begin(0));
  pause.addEventListener('click',togglePause);
  byId('help').addEventListener('click',()=>{
    helpReturn=mode==='walking'?'paused':mode;
    updateMode('help');
  });
  for(const side of ['left','right']) {
    const button=byId(side);
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      push('p'+event.pointerId,side);
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']) {
      button.addEventListener(name,event=>held.delete('p'+event.pointerId));
    }
    button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('click',e=>{
      if(e.detail===0 && mode==='walking') impulse[side]=state.time+.18;
    });
  }
  const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
  window.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey) return;
    if(keys[event.code] && mode==='walking') {
      event.preventDefault();
      if(!event.repeat) push(event.code,keys[event.code]);
    } else if((event.code==='KeyP'||event.code==='Escape') && !event.repeat) {
      if(mode==='help') {event.preventDefault();closeHelp();}
      else if(mode==='walking'||mode==='paused') {event.preventDefault();togglePause();}
    }
  });
  window.addEventListener('keyup',event=>held.delete(event.code));
  function leave() {
    if(mode==='walking') updateMode('paused',false);
    else {resetInput();if(mode==='fell') {cancelAnimationFrame(frame);readings(1);}}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden) leave();});
  document.addEventListener('freeze',leave);
  window.addEventListener('blur',leave); window.addEventListener('pagehide',leave);
  window.addEventListener('boopland:languagechange',()=>{formatters();render();});
  function resize() {
    view.resize(scene.clientWidth,scene.clientHeight);
    readings(mode==='fell'?1:0);
  }
  formatters(); resize(); render();
  new ResizeObserver(resize).observe(scene);
})();
