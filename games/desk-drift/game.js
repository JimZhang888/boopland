(() => {
  'use strict';
  const E = window.DeskDrift, I = window.BooplandI18n, $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`deskDrift.${key}`, values);
  const canvas = $('game'), ctx = canvas.getContext('2d'), stage = $('stage'), dialog = $('dialog');
  const STORAGE_KEY = 'boopland-desk-drift-best-v1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = { ink:'#535f4d', paper:'#f8f6ed', green:'#758d67', blue:'#789eab', rose:'#c09183', ochre:'#bda66a' };
  let best = null, raceGhost = null, run = E.makeRun(), state = 'ready', mode = 'intro', helpOrigin = 'ready', previousBest = null, saved = true;
  let lastFrame = 0, accumulator = 0, uiClock = 0, raf = 0, view = { w:1, h:1, scale:1, rotate:false }, shake = 0, toastLeft = 0;
  let marks = [], particles = [], markClock = 0, history = [], audio = null, soundEnabled = false;
  const keys = new Set(), pointers = new Map();
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (E.validRecord(value)) best = value; } catch { /* Storage may be blocked, empty or corrupted. */ }
  const number = n => n.toFixed(2);
  const time = n => n < 60 ? n.toFixed(2).padStart(5, '0') : `${Math.floor(n / 60)}:${(n % 60).toFixed(2).padStart(5, '0')}`;
  const delta = n => `${n < -.005 ? '−' : '+'}${Math.abs(n).toFixed(2)}`;
  const sectorTime = (record, i) => record.splits[i] - (record.splits[i - 1] || 0);
  function text(id, value) { const el = $(id); if (el.textContent !== value) el.textContent = value; }
  function deltaText(el, value) { el.textContent = value === null ? '—' : delta(value); el.classList.toggle('ahead', value !== null && value < -.005); el.classList.toggle('behind', value !== null && value > .005); }
  function el(tag, className, content) { const node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node; }
  function control(name) { return [...pointers.values()].includes(name) || (name === 'left' ? keys.has('ArrowLeft') || keys.has('KeyA') : name === 'right' ? keys.has('ArrowRight') || keys.has('KeyD') : keys.has('Space')); }
  function input() { return { steer:Number(control('right')) - Number(control('left')), drift:control('drift') }; }
  function clearInput() { keys.clear(); pointers.clear(); updateButtons(); }
  function updateButtons() { document.querySelectorAll('[data-control]').forEach(button => button.classList.toggle('active', control(button.dataset.control))); }
  function initAudio() {
    if (!soundEnabled) return;
    try {
      if (!audio) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        const context = new Context(), engine = context.createOscillator(), gain = context.createGain();
        engine.type = 'triangle'; gain.gain.value = 0; engine.connect(gain).connect(context.destination); engine.start();
        audio = { context, engine, gain };
      }
      audio.context.resume().catch(() => {});
    } catch { /* Sound is optional. */ }
  }
  function tone(frequency, duration = .12, volume = .04) {
    if (!audio || !soundEnabled || audio.context.state !== 'running') return;
    const o = audio.context.createOscillator(), g = audio.context.createGain(), now = audio.context.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(frequency, now); o.frequency.exponentialRampToValueAtTime(frequency * .65, now + duration);
    g.gain.setValueAtTime(volume, now); g.gain.exponentialRampToValueAtTime(.001, now + duration); o.connect(g).connect(audio.context.destination); o.start(); o.stop(now + duration);
  }
  function updateAudio() {
    if (!audio) return;
    const now = audio.context.currentTime, active = soundEnabled && state === 'racing' && !document.hidden;
    audio.gain.gain.setTargetAtTime(active ? .014 : 0, now, .06);
    audio.engine.frequency.setTargetAtTime(55 + Math.hypot(run.car.vx, run.car.vy) * .75, now, .08);
  }
  function toast(message, duration = 2) { text('toast', message); $('toast').hidden = false; toastLeft = duration; }
  function start() {
    initAudio(); clearInput(); if (dialog.open) dialog.close();
    run = E.makeRun(); raceGhost = best; state = 'racing'; mode = null; accumulator = 0; lastFrame = 0;
    marks = []; particles = []; shake = 0; markClock = 0; toastLeft = 0; $('toast').hidden = true;
    updateUI(); document.activeElement?.blur();
  }
  function resume() {
    if (dialog.open) dialog.close(); state = 'racing'; mode = null; lastFrame = 0; accumulator = 0; clearInput(); initAudio(); document.activeElement?.blur(); updateUI();
  }
  function pause() { if (state === 'racing') { state = 'paused'; clearInput(); showDialog('paused'); updateAudio(); } else if (state === 'paused') resume(); }
  function help() { if (mode === 'help') return; helpOrigin = state; if (state === 'racing') state = 'paused'; clearInput(); showDialog('help'); updateAudio(); }
  function primaryAction() {
    if (mode === 'paused') resume();
    else if (mode === 'help') {
      if (helpOrigin === 'racing') resume();
      else if (helpOrigin === 'paused') showDialog('paused');
      else if (helpOrigin === 'finished') showDialog('result');
      else if (helpOrigin === 'expired') showDialog('expired');
      else start();
    } else start();
  }
  function showDialog(nextMode) {
    mode = nextMode; renderDialog(); if (!dialog.open) dialog.showModal(); $('primary').focus({ preventScroll:true });
  }
  function renderDialog() {
    const content = $('dialog-content'); content.replaceChildren();
    text('dialog-kicker', mode === 'result' ? t('recordLabel') : 'BOOPLAND MOTOR CLUB');
    text('primary', mode === 'paused' || mode === 'help' && ['racing','paused'].includes(helpOrigin) ? t('resume') : mode === 'intro' || mode === 'help' && helpOrigin === 'ready' ? t('start') : t('retry'));
    if (mode === 'intro' || mode === 'help') {
      text('dialog-title', mode === 'intro' ? t('startTitle') : t('help'));
      text('dialog-description', t(mode === 'intro' ? 'startDesc' : 'helpDesc'));
      const car = document.createElementNS('http://www.w3.org/2000/svg','svg'); car.setAttribute('viewBox','0 0 120 66'); car.classList.add('mini-car'); car.setAttribute('aria-hidden','true');
      car.innerHTML = '<g transform="translate(60 32) rotate(-12)" stroke="#536149" stroke-width="1.7" stroke-linejoin="round"><path d="M-32-14h64v30h-64z" fill="#8da37c"/><path d="M-7-12h17l4 9v9H-7z" fill="#e0e7d9"/><path d="M-27-19h14v5h-14zm39 0h14v5H12zM-27 16h14v5h-14zm39 0h14v5H12z" fill="#68705e"/><path d="M27-11v8m0 8v8" stroke="#fff9da" stroke-width="4"/><path d="M-47-7h-12m10 15h-17" fill="none" opacity=".4"/></g>';
      content.append(car);
      const hints = el('div','help-keys');
      for (const [key, label] of [['← → / A D','steerHelp'],['SPACE','driftHelp']]) { const block = el('div'); block.append(el('b','',key),el('span','',t(label))); hints.append(block); }
      content.append(hints, el('p','result-detail',t(mode === 'intro' ? 'auto' : 'ghostHint')));
    } else if (mode === 'paused' || mode === 'expired') {
      text('dialog-title', t(mode === 'paused' ? 'pause' : 'timeoutTitle')); text('dialog-description', t(mode === 'paused' ? 'pausedDesc' : 'timeoutDesc'));
      content.append(el('div','result-time',time(run.time)));
    } else if (mode === 'result') {
      const improved = !previousBest || run.time < previousBest.time;
      text('dialog-title',t(improved ? 'newBest' : 'lapDone')); text('dialog-description','');
      content.append(el('div','result-time',time(run.time)));
      content.append(el('p',`result-delta ${improved ? 'ahead' : 'behind'}`, previousBest ? t(improved ? 'improved' : 'slower',{value:number(Math.abs(run.time - previousBest.time))}) : t('firstLap')));
      const rows = el('div','result-sectors');
      for (let i = 0; i < 3; i++) {
        const row = el('div'), diff = previousBest ? sectorTime(run,i) - sectorTime(previousBest,i) : null, diffNode = el('b');
        deltaText(diffNode,diff); row.append(el('span','',`0${i + 1}  ${t(`sector${i + 1}`)}`),el('b','',number(sectorTime(run,i))),diffNode); rows.append(row);
      }
      content.append(rows, el('p','result-detail',`${t('hitsDetail',{count:run.hits})}  ·  ${t('driftDetail',{value:run.drift.toFixed(1)})}`));
      let feedback = t('ghostReady');
      if (previousBest) {
        const diffs = run.splits.map((_,i) => sectorTime(run,i) - sectorTime(previousBest,i));
        const index = improved ? diffs.indexOf(Math.min(...diffs)) : diffs.indexOf(Math.max(...diffs));
        feedback = t(diffs[index] <= 0 ? 'sectorGain' : 'sectorLoss',{sector:t(`sector${index + 1}`),value:number(Math.abs(diffs[index]))});
        if (run.hits < previousBest.hits) feedback += ` ${t('cleaner',{count:previousBest.hits - run.hits})}`;
      }
      content.append(el('div','feedback',feedback));
      if (!saved) content.append(el('p','result-detail',t('storageFail')));
    }
  }
  function finish() {
    state = 'finished'; previousBest = raceGhost; history.unshift(run.time); history = history.slice(0,5); saved = true;
    if (!best || run.time < best.time) {
      best = E.recordOf(run);
      try { localStorage.setItem(STORAGE_KEY,JSON.stringify(best)); } catch { saved = false; }
      tone(880,.28,.045);
    } else tone(520,.2,.025);
    clearInput(); updateUI(); showDialog('result'); updateAudio();
  }
  function updateUI() {
    text('timer',time(run.time)); text('best',best ? time(best.time) : '— —'); text('hits',String(run.hits));
    const ghostTime = E.timeAtProgress(raceGhost,run.progress);
    deltaText($('delta'),ghostTime === null ? null : run.time - ghostTime);
    const speed = Math.hypot(run.car.vx,run.car.vy); text('speed',String(Math.round(state === 'ready' ? 0 : speed))); $('speed-bar').style.width = `${state === 'ready' ? 0 : speed / 118 * 36}px`;
    const wrongWay = Math.cos(E.angleDiff(run.car.angle,E.nearest(run.car.x,run.car.y).angle)) < -.2;
    text('status',t(state === 'ready' ? 'ready' : state === 'paused' ? 'pause' : state === 'finished' ? 'lapDone' : wrongWay ? 'wrongWay' : control('drift') ? 'drifting' : 'racing'));
    $('pause').disabled = !['racing','paused'].includes(state); $('pause').textContent = state === 'paused' ? '▷' : 'Ⅱ'; $('pause').setAttribute('aria-label',t(state === 'paused' ? 'resume' : 'pause'));
    $('sound').setAttribute('aria-label',t(soundEnabled ? 'soundOff' : 'soundOn'));
    text('ghost-note',t(best ? 'ghostReady' : 'ghostEmpty'));
    for (let i = 0; i < 3; i++) {
      text(`sector-time-${i}`,run.splits[i] ? `${number(sectorTime(run,i))} s` : '— —');
      deltaText($(`sector-delta-${i}`),run.splits[i] && raceGhost ? sectorTime(run,i) - sectorTime(raceGhost,i) : null);
    }
    const signature = `${I.language}:${history.join(',')}`;
    if ($('history').dataset.signature !== signature) {
      $('history').dataset.signature = signature; $('history').replaceChildren(...(history.length ? history.map(value => el('span','',time(value))) : [el('span','empty',t('noHistory'))]));
    }
  }
  // All visual assets are local vector/canvas drawings, including the pencil strokes.
  const background = document.createElement('canvas'); background.width = E.WIDTH * 2; background.height = E.HEIGHT * 2;
  const b = background.getContext('2d'); b.scale(2,2);
  function path(c, list, close = false) { c.beginPath(); list.forEach((p,i) => i ? c.lineTo(p.x,p.y) : c.moveTo(p.x,p.y)); if (close) c.closePath(); }
  function round(c,x,y,w,h,r = 5) { c.beginPath(); c.roundRect(x,y,w,h,r); }
  function line(c,x1,y1,x2,y2,color,width=1) { c.beginPath(); c.strokeStyle=color; c.lineWidth=width; c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }
  function drawObject(c,o) {
    c.save(); c.translate(o.x,o.y); c.rotate(o.angle || 0); c.lineWidth = 1.4; c.strokeStyle = '#7a806b';
    if (o.kind === 'eraser') {
      round(c,-o.w/2+4,-o.h/2+6,o.w,o.h,8); c.fillStyle='#49563b16'; c.fill();
      round(c,-o.w/2,-o.h/2,o.w,o.h,8); c.fillStyle='#d7aaa0'; c.fill(); c.stroke();
      c.fillStyle='#f0e9d7'; c.fillRect(-o.w/2,-24,o.w,61); line(c,-36,-24,36,-24,'#9a9a82'); line(c,-36,37,36,37,'#9a9a82');
      c.fillStyle='#818771'; c.font='10px Georgia'; c.textAlign='center'; c.fillText('SOFT',0,1); c.font='bold 20px Georgia'; c.fillText('2B',0,24);
      for (let i=0;i<5;i++) line(c,-24+i*11,-48,-29+i*11,-39,'#a2746e50',.8);
      line(c,-32,-50,-33,48,'#fffaf080');
    } else if (o.kind === 'ruler') {
      c.fillStyle='#49563b13'; c.fillRect(-o.w/2+4,-o.h/2+5,o.w,o.h);
      round(c,-o.w/2,-o.h/2,o.w,o.h,3); c.fillStyle='#e4d5a4'; c.fill(); c.stroke();
      for (let x=-116,i=0;x<120;x+=8,i++) line(c,x,-15,x,i%5===0 ? -2 : -8,'#8d845f',.8);
      c.font='9px Georgia'; c.fillStyle='#8a8060'; c.textAlign='center'; for(let i=0;i<6;i++) c.fillText(String(i),-116+i*40,10);
      line(c,-122,13,122,13,'#faf5da');
    } else {
      c.fillStyle='#49563b13'; c.beginPath(); c.ellipse(6,8,46,43,0,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(0,0,o.r,0,Math.PI*2); c.fillStyle='#c1cdba'; c.fill(); c.stroke();
      c.beginPath(); c.arc(-1,-2,o.r-6,0,Math.PI*2); c.fillStyle='#e3e7d6'; c.fill(); c.strokeStyle='#8d9b80'; c.stroke();
      const pencils=[[-17,-11,-.7,'#bfab72'],[8,-8,.2,'#8da8b0'],[19,12,.7,'#b78b7a'],[-9,17,-1.7,'#9aaa7d']];
      for (const [x,y,a,color] of pencils) { c.save(); c.translate(x,y); c.rotate(a); round(c,-4,-28,8,55,1); c.fillStyle=color; c.fill(); c.strokeStyle='#707b65'; c.stroke(); c.beginPath(); c.moveTo(-4,-28); c.lineTo(0,-39); c.lineTo(4,-28); c.fillStyle='#ebddbb'; c.fill(); c.stroke(); line(c,0,-37,0,-33,'#525b4b',2); line(c,-1,-25,-1,22,'#ffffff60'); c.restore(); }
    }
    c.restore();
  }
  function drawBackground() {
    b.fillStyle=colors.paper; b.fillRect(0,0,E.WIDTH,E.HEIGHT);
    for(let x=0;x<E.WIDTH;x+=32) line(b,x,0,x,E.HEIGHT,'#819a9c10');
    for(let y=0;y<E.HEIGHT;y+=32) line(b,0,y,E.WIDTH,y,'#819a9c10');
    // Sparse fixed grain and faint doubled outlines keep the sheet quiet and hand drawn.
    for(let i=0;i<2400;i++){const x=(i*137.27)%E.WIDTH,y=(i*81.71)%E.HEIGHT;b.fillStyle=i%2?'#827f6810':'#ffffff60';b.fillRect(x,y,.8,.8);}
    b.lineCap='round'; b.lineJoin='round';
    path(b,E.points,true); b.strokeStyle='#65705518'; b.lineWidth=E.ROAD+9; b.stroke();
    path(b,E.points,true); b.strokeStyle='#9aa28d'; b.lineWidth=E.ROAD+3; b.stroke();
    path(b,E.points,true); b.strokeStyle='#e6e7da'; b.lineWidth=E.ROAD; b.stroke();
    path(b,E.points,true); b.strokeStyle='#faf9ef'; b.lineWidth=E.ROAD-9; b.stroke();
    path(b,E.points,true); b.strokeStyle='#e6e8dc'; b.lineWidth=E.ROAD-16; b.stroke();
    // Pencil center line, broken gently enough to preserve clear racing space.
    path(b,E.points,true); b.setLineDash([8,13]); b.lineWidth=1; b.strokeStyle='#a5ae9660'; b.stroke(); b.setLineDash([]);
    for(let s=100;s<E.length;s+=142){const p=E.at(s);b.save();b.translate(p.x,p.y);b.rotate(p.angle);b.strokeStyle='#8a967780';b.lineWidth=1.6;b.beginPath();b.moveTo(-5,-5);b.lineTo(2,0);b.lineTo(-5,5);b.stroke();b.restore();}
    for(let s=0;s<E.length;s+=12){
      const p=E.at(s), q=E.at(s+3), turn=E.angleDiff(q.angle,p.angle); if(Math.abs(turn)<.014)continue;
      const side=turn>0?1:-1; const nx=-Math.sin(p.angle)*side,ny=Math.cos(p.angle)*side;
      line(b,p.x+nx*42,p.y+ny*42,p.x+nx*47,p.y+ny*47,Math.floor(s/12)%2 ? '#b7bfaa' : '#f8f7ee',4);
    }
    const start=E.at(0);b.save();b.translate(start.x,start.y);b.rotate(start.angle);
    for(let x=0;x<2;x++)for(let y=0;y<10;y++){b.fillStyle=(x+y)%2?'#65725a':'#fffdf0';b.fillRect(x*7-7,y*9-45,7,9);}
    b.restore();
    for(let i=1;i<=3;i++){const p=E.at((i-1)*E.length/3+65), side=-1, nx=-Math.sin(p.angle)*side,ny=Math.cos(p.angle)*side;b.save();b.translate(p.x+nx*78,p.y+ny*78);b.rotate(p.angle);b.fillStyle=['#bfa86e','#809daa','#b18d7f'][i-1];b.font='italic 20px Georgia';b.textAlign='center';b.fillText(`0${i}`,0,5);b.restore();}
    for(let i=1;i<3;i++){const p=E.at(i*E.length/3),nx=-Math.sin(p.angle),ny=Math.cos(p.angle);b.setLineDash([4,6]);line(b,p.x-nx*44,p.y-ny*44,p.x+nx*44,p.y+ny*44,i===1?'#8fa9b3':'#b79a8b',1.5);b.setLineDash([]);}
    E.obstacles.forEach(o=>drawObject(b,o));
    // A paper-clipped note in the infield and a pencil outside the racing line.
    b.save();b.translate(464,349);b.rotate(-.07);b.fillStyle='#d5ceac26';b.fillRect(-94,-53,192,111);b.fillStyle='#f2edcf';b.fillRect(-98,-57,192,111);b.strokeStyle='#c6c6a5';b.lineWidth=.8;b.strokeRect(-98,-57,192,111);
    b.fillStyle='#5f7256';b.font='italic 28px Georgia';b.textAlign='center';b.fillText('one more lap.',0,-5);b.font='10px Georgia';b.fillStyle='#90957c';b.fillText('a little faster, a little happier.',0,19);line(b,-57,31,56,33,'#a6af8d');
    b.strokeStyle='#939d87';b.lineWidth=2;b.beginPath();b.moveTo(58,-68);b.lineTo(58,-34);b.quadraticCurveTo(58,-24,67,-27);b.quadraticCurveTo(72,-28,72,-35);b.lineTo(72,-69);b.quadraticCurveTo(64,-82,53,-69);b.lineTo(53,-37);b.stroke();b.restore();
    b.save();b.translate(474,70);b.rotate(.06);b.fillStyle='#b6bb9a';b.fillRect(-100,-5,196,10);b.strokeStyle='#7e896b';b.strokeRect(-100,-5,196,10);b.fillStyle='#e4d7b8';b.beginPath();b.moveTo(96,-5);b.lineTo(116,0);b.lineTo(96,5);b.closePath();b.fill();line(b,109,0,115,0,'#535f4b',2);line(b,-98,-2,94,-2,'#f7f5db80');b.restore();
    b.save();b.translate(845,601);b.rotate(-.1);b.strokeStyle='#b1b69f';b.lineWidth=1.2;b.beginPath();b.ellipse(0,0,16,8,-.4,0,Math.PI*2);b.ellipse(-5,4,16,8,-.4,0,Math.PI*2);b.stroke();b.restore();
  }
  drawBackground();
  function drawCar(c,car,ghost=false) {
    c.save();c.translate(car.x,car.y);c.rotate(car.angle);c.lineJoin='round';
    if(ghost){c.globalAlpha=.52;c.setLineDash([3,2]);}
    else{round(c,-16+2,-9+3,32,18,6);c.fillStyle='#414e3b28';c.fill();}
    c.fillStyle=ghost?'#7eacba':'#5e6855';
    for(const x of [-12,9])for(const y of [-12,8]){c.save();c.translate(x,y+2);if(x>0&&!ghost)c.rotate(car.steer*.35);round(c,-4,-2,8,4,1);c.fill();c.restore();}
    round(c,-17,-9,34,18,5);c.fillStyle=ghost?'#b2d3d8':'#8da678';c.fill();c.strokeStyle=ghost?'#487e94':'#4f6245';c.lineWidth=1.4;c.stroke();
    round(c,-3,-7,11,14,2);c.fillStyle=ghost?'#d5e9e8':'#e6eddc';c.fill();c.stroke();
    line(c,-12,-6,-12,6,ghost?'#5d91a5':'#c2d1ad',2);line(c,14,-6,14,-2,'#fffde3',2.5);line(c,14,2,14,6,'#fffde3',2.5);
    if(!ghost){line(c,-16,-5,-16,-2,'#b88373',2);line(c,-16,2,-16,5,'#b88373',2);}
    c.restore();
  }
  function resize() {
    const rect=stage.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    view.w=Math.max(1,rect.width);view.h=Math.max(1,rect.height);view.rotate=view.h/view.w>1.05;
    // Keep the complete track in view; discard only unused outer desk margins.
    view.scale=Math.min(view.w/(view.rotate?610:840),view.h/(view.rotate?840:610));
    canvas.width=Math.round(view.w*dpr);canvas.height=Math.round(view.h*dpr); view.dpr=dpr; draw();
  }
  function draw() {
    const {w,h,dpr,scale,rotate}=view;ctx.setTransform(dpr||1,0,0,dpr||1,0,0);ctx.clearRect(0,0,w,h);
    ctx.save();ctx.translate(w/2,h/2);if(shake&&!reducedMotion.matches)ctx.translate(Math.sin(run.time*121)*shake,Math.cos(run.time*89)*shake*.6);
    if(rotate)ctx.rotate(Math.PI/2);ctx.scale(scale,scale);ctx.translate(-E.WIDTH/2,-E.HEIGHT/2);
    ctx.drawImage(background,0,0,E.WIDTH,E.HEIGHT);
    ctx.lineCap='round';
    for(const mark of marks){ctx.globalAlpha=Math.min(.28,mark.life*.05);line(ctx,mark.x1,mark.y1,mark.x2,mark.y2,'#616b57',1.7);}ctx.globalAlpha=1;
    if(raceGhost){const ghost=E.ghostAt(raceGhost,run.time);if(ghost)drawCar(ctx,ghost,true);}
    drawCar(ctx,run.car);
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life*2);line(ctx,p.x,p.y,p.x-p.vx*.04,p.y-p.vy*.04,p.color,1.7);}ctx.globalAlpha=1;
    ctx.restore();
  }
  function effects(dt,oldCar) {
    shake=Math.max(0,shake-dt*20);toastLeft=Math.max(0,toastLeft-dt);if(!toastLeft)$('toast').hidden=true;
    for(const m of marks)m.life-=dt;marks=marks.filter(m=>m.life>0);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    markClock+=dt;
    if(markClock>1/30){markClock=0;if(control('drift')&&Math.abs(run.car.steer)>.18&&Math.hypot(run.car.vx,run.car.vy)>55){
      const car=run.car,fx=Math.cos(car.angle),fy=Math.sin(car.angle);
      for(const side of [-1,1])marks.push({x1:oldCar.x-fx*11-fy*side*9,y1:oldCar.y-fy*11+fx*side*9,x2:car.x-fx*11-fy*side*9,y2:car.y-fy*11+fx*side*9,life:8});
      if(marks.length>500)marks.splice(0,marks.length-500);
    }}
    if(run.impact){shake=3*run.impact.power;tone(120,.11,.06);toast(t('collision'),1.1);
      for(let i=0;i<9;i++){const a=i*Math.PI*2/9;particles.push({x:run.impact.x,y:run.impact.y,vx:Math.cos(a)*(23+i*5),vy:Math.sin(a)*(23+i*5),life:.45,color:i%2?'#b39465':'#9eab8c'});}
    }
  }
  function frame(timestamp) {
    raf=0;if(document.hidden)return;
    const elapsed=lastFrame ? Math.min((timestamp-lastFrame)/1000,.1) : 0;lastFrame=timestamp;
    if(state==='racing'){
      accumulator+=elapsed;
      while(accumulator>=1/120&&state==='racing'){
        const oldCar={x:run.car.x,y:run.car.y},previousSplits=run.splits.length;
        E.step(run,input(),1/120);effects(1/120,oldCar);accumulator-=1/120;
        if(run.finished)finish();
        else if(run.expired){state='expired';clearInput();showDialog('expired');}
        else if(run.splits.length>previousSplits){const i=run.splits.length-1;const diff=raceGhost?` (${delta(sectorTime(run,i)-sectorTime(raceGhost,i))})`:'';toast(t('sectorToast',{sector:t(`sector${i+1}`),value:number(sectorTime(run,i))})+diff,2.5);tone(660,.09,.025);}
      }
    }else accumulator=0;
    uiClock+=elapsed;if(uiClock>.07){updateUI();uiClock=0;}updateAudio();draw();raf=requestAnimationFrame(frame);
  }
  const drivingKeys=['ArrowLeft','ArrowRight','KeyA','KeyD','Space'];
  window.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input,textarea,select'))return;
    if(event.code==='KeyR'&&!event.repeat){event.preventDefault();start();return;}
    if((event.code==='KeyP'||event.code==='Escape')&&!event.repeat){if(mode==='help')primaryAction();else if(['racing','paused'].includes(state))pause();event.preventDefault();return;}
    if(drivingKeys.includes(event.code)&&state==='racing'){event.preventDefault();keys.add(event.code);updateButtons();}
  });
  window.addEventListener('keyup',event=>{keys.delete(event.code);updateButtons();});
  document.querySelectorAll('[data-control]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{if(state!=='racing')return;event.preventDefault();button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,button.dataset.control);initAudio();updateButtons();});
    const release=event=>{pointers.delete(event.pointerId);updateButtons();};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);button.addEventListener('contextmenu',event=>event.preventDefault());
  });
  $('restart').addEventListener('click',start);$('pause').addEventListener('click',pause);$('help').addEventListener('click',help);$('primary').addEventListener('click',primaryAction);
  $('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('sound').setAttribute('aria-pressed',String(soundEnabled));initAudio();updateUI();updateAudio();if(soundEnabled)tone(550,.1,.03);});
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(mode==='paused'||mode==='help')primaryAction();});
  window.addEventListener('blur',()=>{clearInput();if(state==='racing')pause();});
  document.addEventListener('visibilitychange',()=>{
    clearInput();lastFrame=0;accumulator=0;
    if(document.hidden){if(state==='racing')pause();if(raf)cancelAnimationFrame(raf);raf=0;audio?.context.suspend().catch(()=>{});}
    else if(!raf)raf=requestAnimationFrame(frame);
  });
  window.addEventListener('boopland:languagechange',()=>{updateUI();if(mode)renderDialog();$('toast').hidden=true;toastLeft=0;});
  new ResizeObserver(resize).observe(stage);
  updateUI();resize();showDialog('intro');raf=requestAnimationFrame(frame);
})();
