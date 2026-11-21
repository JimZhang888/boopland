(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stage = $('stage'), pads = [$('left'), $('right')];
  const t = (key,values) => BooplandI18n.t('paperJuggler.' + key, values);
  const svgNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attributes, parent) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,value);
    parent.appendChild(node);
    return node;
  }
  let act = new JugglingAct(), mode = 'ready', previousMode = 'ready';
  let layout, sprites = [], zones = [], palms = [], gains = [];
  let tick = null, last = null, toast = '', toastLeft = 0, record = 0;
  let strikes = [0,0], points = [0,0], readySides = [false,false];
  const keys = new Set(), pointers = new Map();
  const storageKey = 'boopland.paper-juggler.best.v1';
  try { record = Math.max(0,Number(localStorage.getItem(storageKey)) || 0); } catch { /* Storage is optional. */ }

  function drawSet() {
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;
    layout = PaperTheatre.layout(box.width,box.height);
    stage.setAttribute('viewBox', '0 0 ' + layout.w + ' ' + layout.h);
    stage.innerHTML = PaperTheatre.print(layout);
    if (mode === 'ready' || (mode === 'help' && previousMode === 'ready')) {
      $('props').innerHTML = PaperTheatre.preview(layout);
      return;
    }
    sprites = [0,1,2].map(id => ({
      path: svg('path', {fill:'none', stroke:PaperTheatre.palette[id], 'stroke-dasharray':id===1?'2 4':'5 5', 'stroke-width':1.6}, $('trails')),
      orb: svg('use', {href:'#orb'+id}, $('props'))
    }));
    zones = [0,1].map(side=>$('zone'+side));
    palms = [0,1].map(side=>$('palm'+side));
    gains = [0,1].map(side=>svg('text',{x:side?layout.w-layout.x:layout.x,fill:'#554a33','text-anchor':'middle',
      'font-family':'Georgia,serif','font-weight':'bold','font-size':Math.max(14,layout.radius*1.15),
      'paint-order':'stroke',stroke:'#f7ecd1','stroke-width':3},$('props')));
    renderBalls();
  }

  function renderBalls() {
    if (!layout || !sprites.length) return;
    const L = layout;
    readySides = [false,false];
    sprites.forEach(({orb,path},i)=>{
      const ball = act.balls[i];
      const visible = ball && ball.age >= 0 && (ball.phase === 'flight' || ball.fall < .39);
      orb.style.display = visible ? '' : 'none';
      path.style.display = visible && ball.phase === 'flight' ? '' : 'none';
      if (!visible) return;
      const p = JugglingAct.position(ball), prog = Math.min(1,ball.age/ball.duration);
      const x = L.x+L.span*p.x, y = L.h*p.y;
      const twist = (ball.from ? -1 : 1) * (prog*110+ball.fall*170);
      orb.setAttribute('transform',`translate(${x} ${y}) rotate(${twist}) scale(${L.radius/16})`);
      // A short curve behind the ball and a faint forward segment both follow its actual throw.
      if (ball.phase === 'flight') {
        const from = Math.max(0,prog-.26), to = Math.min(1,prog+.10);
        path.setAttribute('d',PaperTheatre.trail(L,ball,from,to));
      }
      if (JugglingAct.inZone(ball)) readySides[1-ball.from] = true;
    });
    for (let side=0;side<2;side++) {
      const on = readySides[side];
      const ellipse = zones[side].firstElementChild;
      ellipse.setAttribute('stroke-dasharray',on?'none':'5 4');
      ellipse.setAttribute('stroke-width',on?'2.6':'1.4');
      ellipse.setAttribute('fill',on?'#f1cb74':'#fbf3df');
      ellipse.setAttribute('fill-opacity',on?'.76':'.32');
      pads[side].classList.toggle('ready',on);
      const lift = Math.min(1,strikes[side]*5);
      palms[side].setAttribute('transform',`translate(0 ${-lift*4}) rotate(${lift*9} 0 18)`);
      gains[side].style.display = points[side] && strikes[side]>0 ? '' : 'none';
      if (points[side] && strikes[side]>0) {
        gains[side].setAttribute('y', L.h*.64 - (1-strikes[side]/.42)*L.radius);
        gains[side].textContent = '+' + points[side];
      }
    }
  }

  function ui() {
    const level = act.balls.length;
    $('act-number').textContent = ['Ⅰ','Ⅱ','Ⅲ'][level-1];
    $('act-name').textContent = t('act'+level);
    $('score').textContent = String(act.score).padStart(4,'0');
    $('streak').textContent = '×'+act.streak;
    const lives = $('lives');
    lives.setAttribute('aria-label',t('remaining',{n:3-act.drops}));
    [...lives.children].forEach((node,i)=>node.classList.toggle('spent',i>=3-act.drops));
    $('intro').hidden = mode !== 'ready' && !(mode==='help' && previousMode==='ready');
    $('pads').hidden = !$('intro').hidden;
    $('start').disabled = mode !== 'ready';
    $('pause').disabled = mode !== 'playing';
    $('help').disabled = mode === 'help';
    for (const pad of pads) pad.disabled = mode !== 'playing';
    $('frame').classList.toggle('live', mode === 'playing');
    $('best').textContent = record;
    $('notice').hidden = mode !== 'playing' || !toast || toastLeft <= 0;
    if (!$('notice').hidden) $('notice').textContent = t(toast);
    const panel = ['ended','paused','help'].includes(mode);
    $('overlay').hidden = !panel;
    if (!panel) return;
    $('panel-title').textContent = t(mode==='help'?'help':mode);
    $('panel-body').textContent = mode==='ended' ? t('result',{score:act.score,streak:act.longest,best:record}) : t(mode==='help'?'tips':'pauseBody');
    $('primary').textContent = t(mode==='ended'?'retry':mode==='paused'?'resume':'close');
    $('secondary').hidden = mode !== 'paused';
  }

  function heldStyles() {
    const held = new Set(pointers.values());
    for(const code of keys) {
      if (code==='ArrowLeft') held.add(0);
      if (code==='ArrowRight') held.add(1);
    }
    pads.forEach((pad,i)=>pad.classList.toggle('pressed',held.has(i)));
  }
  function clearInput() { keys.clear(); pointers.clear(); heldStyles(); }
  function stopClock() {
    if(tick !== null) cancelAnimationFrame(tick);
    tick = null; last = null;
    clearInput();
  }
  function announce(key,secs) { toast=key; toastLeft=secs; }
  function frame(time) {
    tick = null;
    if (mode !== 'playing') return;
    const dt = last === null ? 0 : Math.min(.06, Math.max(0,(time-last)/1000));
    last = time;
    const before = act.drops;
    act.advance(dt);
    strikes = strikes.map(v=>Math.max(0,v-dt));
    if (before !== act.drops) {
      announce('miss',.95);
      points = [0,0];
      ui();
    } else if (toastLeft > 0 && (toastLeft -= dt) <= 0) {
      $('notice').hidden = true;
    }
    renderBalls();
    if (act.ended) {
      mode='ended';
      if (act.score > record) {
        record=act.score;
        try { localStorage.setItem(storageKey,String(record)); } catch { /* Keep the in-memory record. */ }
      }
      stopClock(); ui(); $('primary').focus({preventScroll:true});
      return;
    }
    tick = requestAnimationFrame(frame);
  }
  function start() {
    stopClock();
    act = new JugglingAct(); mode = 'playing';
    strikes = [0,0]; points = [0,0];
    announce('first',1.50);
    ui(); drawSet(); tick = requestAnimationFrame(frame);
  }
  function resume() {
    mode = 'playing'; last = null; ui();
    tick = requestAnimationFrame(frame);
  }
  function pause() {
    if(mode !== 'playing') return;
    stopClock(); mode='paused'; ui(); $('primary').focus({preventScroll:true});
  }
  function openHelp() {
    previousMode = mode;
    stopClock(); mode = 'help'; ui(); $('primary').focus({preventScroll:true});
  }
  function closeHelp() {
    const restore = previousMode;
    if(restore==='playing') resume();
    else { mode=restore; ui(); }
    (restore==='ended'||restore==='paused'?$('primary'):$('help')).focus({preventScroll:true});
  }
  function press(side) {
    if (mode !== 'playing') return;
    const level = act.balls.length, caught = act.catch(side);
    points[side] = caught === null ? 0 : act.streak;
    strikes[side] = caught === null ? .14 : .42;
    if (act.balls.length !== level) announce('act'+act.balls.length,1.10);
    if (caught !== null) ui();
    renderBalls();
  }

  $('start').addEventListener('click',start);
  $('secondary').addEventListener('click',start);
  $('primary').addEventListener('click',()=>{
    if(mode==='paused') resume();
    else if(mode==='help') closeHelp();
    else if(mode==='ended') start();
  });
  $('help').addEventListener('click',openHelp);
  $('pause').addEventListener('click',pause);
  document.addEventListener('keydown',event=>{
    const code = event.key;
    if(code==='Escape') {
      if(event.repeat) return;
      if(mode==='playing') pause();
      else if(mode==='paused') resume();
      else if(mode==='help') closeHelp();
      return;
    }
    if(mode !== 'playing') return;
    const side = code==='ArrowLeft' ? 0 : code==='ArrowRight' ? 1 :
      (code==='Enter'||code===' ') && pads.includes(event.target) ? Number(event.target.dataset.side) : null;
    if(side === null) return;
    event.preventDefault();
    if(event.repeat || keys.has(code)) return;
    keys.add(code); press(side); heldStyles();
  });
  document.addEventListener('keyup',event=>{
    keys.delete(event.key); heldStyles();
  });

  function pointerDown(event,side) {
    if(mode!=='playing' || event.button!==0 || pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId,side);
    event.currentTarget.setPointerCapture(event.pointerId);
    press(side); heldStyles();
  }
  pads.forEach((pad,side)=>{
    pad.addEventListener('pointerdown',event=>pointerDown(event,side));
    pad.addEventListener('click',event=>{ if(event.detail===0) press(side); });
  });
  stage.addEventListener('pointerdown',event=>{
    const r=stage.getBoundingClientRect();
    pointerDown(event, Number(event.clientX>=r.left+r.width/2));
  });
  const release = event=>{ if(pointers.delete(event.pointerId)) heldStyles(); };
  for (const type of ['pointerup','pointercancel','lostpointercapture']) document.addEventListener(type,release,true);
  function away() {
    if(mode==='help' && previousMode==='playing') previousMode='paused';
    pause(); clearInput();
  }
  window.addEventListener('blur',away);
  window.addEventListener('pagehide',away);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) away(); });
  window.addEventListener('boopland:languagechange',ui);
  new ResizeObserver(drawSet).observe(stage);
  ui(); drawSet();
})();
