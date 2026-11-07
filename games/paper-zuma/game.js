(() => {
  'use strict';
  const E = window.PaperZuma, I = window.BooplandI18n;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t('paperZuma.' + key, values);
  const canvas = $('board'), ctx = canvas.getContext('2d'), space = $('board-space'), wrap = $('board-wrap');
  const game = new E.Game(), keys = new Set(), effects = [];
  const colors = [
    { fill:'#d49b87', edge:'#805f53', mark:'◇' }, { fill:'#adc09a', edge:'#5c7452', mark:'○' },
    { fill:'#99b5c3', edge:'#4d7186', mark:'△' }, { fill:'#d7bf7f', edge:'#87713e', mark:'+' },
    { fill:'#b9a3c2', edge:'#785f84', mark:'□' }
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let angle = -Math.PI / 2, lastTime = 0, raf = 0, activePointer = null;
  let best = 0, soundEnabled = false, audio = null, lastPhase = '', cachedHud = '', lastAmmo = '';
  let background, pixelScale = 1, recoil = 0;
  try {
    const stored = Number(localStorage.getItem('boopland-paper-zuma-best'));
    best = Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
    soundEnabled = localStorage.getItem('boopland-paper-zuma-sound') === 'on';
  } catch { /* The entire game remains playable without browser storage. */ }
  function save() {
    try {
      localStorage.setItem('boopland-paper-zuma-best', String(best));
      localStorage.setItem('boopland-paper-zuma-sound', soundEnabled ? 'on' : 'off');
    } catch { /* Private browsing and file URLs may restrict storage. */ }
  }
  function unlockAudio() {
    if (!soundEnabled) return;
    try {
      if (!audio) { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) audio = new Audio(); }
      if (audio?.state === 'suspended') audio.resume().catch(() => {});
    } catch { /* Audio is optional. */ }
  }
  function tone(frequency, duration, volume = 0.035, delay = 0) {
    if (!soundEnabled || !audio || audio.state !== 'running') return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(start); oscillator.stop(start + duration + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  const setText = (id, text) => { const node = $(id); if (node.textContent !== String(text)) node.textContent = text; };
  const announce = text => setText('announcement', text);
  function updateSound() {
    $('sound').setAttribute('aria-pressed', String(soundEnabled));
    $('sound').setAttribute('aria-label', t(soundEnabled ? 'soundOff' : 'soundOn'));
    $('sound-mark').setAttribute('d', soundEnabled ? 'M17 8q5 4 0 8m3-11q8 7 0 14' : 'm17 9 5 6m0-6-5 6');
  }
  function pencilPath(c, points, width, stroke) {
    c.beginPath();
    points.forEach((point, i) => i ? c.lineTo(point.x, point.y) : c.moveTo(point.x, point.y));
    c.lineWidth = width; c.strokeStyle = stroke; c.stroke();
  }
  function leaf(c, x, y, rotation, scale = 1, opacity = 1) {
    c.save(); c.translate(x, y); c.rotate(rotation); c.scale(scale, scale); c.globalAlpha = opacity;
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-24, -14, -26, -35, -4, -52);
    c.bezierCurveTo(18, -34, 19, -11, 0, 0);
    c.fillStyle = '#dce4cb'; c.fill(); c.strokeStyle = '#96a487'; c.lineWidth = 1.3; c.stroke();
    c.beginPath(); c.moveTo(0, 5); c.lineTo(-3, -43);
    c.moveTo(-1, -13); c.lineTo(-13, -23); c.moveTo(-2, -22); c.lineTo(7, -32); c.stroke(); c.restore();
  }
  function cacheBackground() {
    background = document.createElement('canvas');
    background.width = Math.ceil(E.WIDTH * pixelScale); background.height = Math.ceil(E.HEIGHT * pixelScale);
    const c = background.getContext('2d'); c.scale(pixelScale, pixelScale);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = '#fffef7'; c.fillRect(0, 0, E.WIDTH, E.HEIGHT);
    // A fixed grain and pencil hatching, so the paper never flickers.
    for (let i = 0; i < 1400; i++) {
      const x = (i * 317.71) % E.WIDTH, y = (i * 173.93) % E.HEIGHT;
      c.fillStyle = i % 3 ? '#7d816606' : '#7d816610'; c.fillRect(x, y, 1.1, 0.7);
    }
    const path = game.path.samples;
    pencilPath(c, path, 53, '#9caa8e25');
    pencilPath(c, path, 49, '#c8d2b785');
    pencilPath(c, path, 42, '#e6e9d8');
    c.setLineDash([2, 11]); pencilPath(c, path, 1.5, '#a6b09490'); c.setLineDash([]);
    const edge = side => path.filter((_, i) => i % 3 === 0).map(p => {
      const v = game.path.at(p.s); return { x:p.x - v.ty * 25 * side, y:p.y + v.tx * 25 * side };
    });
    pencilPath(c, edge(1), 0.85, '#98a28770'); pencilPath(c, edge(-1), 0.85, '#98a28770');
    for (let s = 48; s < game.path.length - 50; s += 75) {
      const p = game.path.at(s); c.beginPath();
      c.moveTo(p.x - p.ty * 20 - p.tx * 3, p.y + p.tx * 20 - p.ty * 3);
      c.lineTo(p.x - p.ty * 26 + p.tx * 3, p.y + p.tx * 26 + p.ty * 3);
      c.strokeStyle = '#97a08365'; c.lineWidth = 0.9; c.stroke();
    }
    leaf(c, 310, 151, -0.85, 0.8, 0.55); leaf(c, 348, 157, 0.6, 0.65, 0.5);
    leaf(c, 667, 405, 0.4, 0.8, 0.5); leaf(c, 130, 360, -0.5, 0.6, 0.55);
    leaf(c, 438, 675, 1, 0.9, 0.5); leaf(c, 414, 675, -0.5, 0.6, 0.5);
    const start = game.path.at(0), end = game.path.at(game.path.length);
    c.save(); c.translate(start.x, start.y); c.rotate(Math.atan2(start.ty, start.tx));
    c.beginPath(); c.ellipse(0, 0, 10, 27, 0, 0, Math.PI * 2); c.fillStyle = '#becbad'; c.fill();
    c.strokeStyle = '#829673'; c.lineWidth = 1.5; c.stroke(); c.restore();
    c.save(); c.translate(end.x, end.y);
    c.fillStyle = '#d2c4a6'; c.strokeStyle = '#8d8069'; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(0, 2, 32, 29, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-1 + i, 2, 28-i*3, 25-i*3, -0.28, 0, Math.PI*2); c.strokeStyle='#8d806970'; c.lineWidth=.8; c.stroke(); }
    c.beginPath(); c.ellipse(1, 1, 17, 16, -0.3, 0, Math.PI * 2); c.fillStyle = '#706957'; c.fill();
    c.restore(); leaf(c, end.x + 20, end.y - 17, 0.8, 0.5);
    c.fillStyle = '#7d856e'; c.textAlign = 'center'; c.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
    c.fillText(t('entry'), start.x, start.y + (start.y > E.HEIGHT / 2 ? 43 : -36));
    c.fillText(t('exit'), end.x, end.y + 49);
    c.save(); c.translate(game.origin.x, game.origin.y);
    c.beginPath(); c.ellipse(0, 8, 70, 58, -0.1, 0, Math.PI * 2); c.fillStyle = '#e5ead760'; c.fill();
    c.strokeStyle = '#b5c2a270'; c.lineWidth = 1.1; c.setLineDash([5, 7]); c.stroke(); c.restore();
  }
  function marble(c, x, y, color, radius = E.RADIUS, alpha = 1) {
    const paint = colors[color];
    c.save(); c.globalAlpha = alpha; c.translate(x, y); c.scale(radius / 18, radius / 18);
    c.beginPath(); c.ellipse(1, 2, 18, 18, 0, 0, Math.PI * 2); c.fillStyle = '#52624412'; c.fill();
    c.beginPath(); c.ellipse(0, 0, 17.6, 18, -0.2, 0, Math.PI * 2); c.fillStyle = paint.fill; c.fill();
    c.strokeStyle = paint.edge; c.lineWidth = 1.4; c.stroke();
    c.beginPath(); c.arc(-0.5, -0.7, 15.1, -2.7, -1.0); c.strokeStyle = '#fffef790'; c.lineWidth = 2.2; c.stroke();
    c.save(); c.beginPath(); c.arc(0, 0, 16, 0, Math.PI*2); c.clip();
    c.strokeStyle = paint.edge + '30'; c.lineWidth = .7;
    for (let j = -10; j < 20; j += 5) { c.beginPath(); c.moveTo(-20, j); c.lineTo(3, j + 15); c.stroke(); } c.restore();
    c.strokeStyle = paint.edge; c.lineWidth = 1.5; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
    if (color === 0) { c.moveTo(0,-8); c.lineTo(6,0); c.lineTo(0,8); c.lineTo(-6,0); c.closePath(); }
    else if (color === 1) c.arc(0, 0, 6.2, 0, Math.PI * 2);
    else if (color === 2) { c.moveTo(0,-7); c.lineTo(7,6); c.lineTo(-7,6); c.closePath(); }
    else if (color === 3) { c.moveTo(-6,0); c.lineTo(6,0); c.moveTo(0,-6); c.lineTo(0,6); }
    else c.rect(-5.5, -5.5, 11, 11);
    c.stroke(); c.restore();
  }
  function drawFrog() {
    const { x, y } = game.origin;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
    ctx.translate(0, recoil * 3); ctx.strokeStyle = '#66755c'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.fillStyle = '#bfcea9'; ctx.beginPath();
    ctx.ellipse(-28, 22, 14, 9, -.5, 0, Math.PI*2); ctx.ellipse(28, 22, 14, 9, .5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 5, 29, 35, 0, 0, Math.PI * 2); ctx.fillStyle='#cbd9b7';ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,13,19,21,0,0,Math.PI*2);ctx.fillStyle='#e2e9ce';ctx.fill();
    ctx.beginPath();ctx.roundRect(-12,-43,24,25,7);ctx.fillStyle='#a9bc91';ctx.fill();ctx.stroke();
    for(const side of [-1,1]) {
      ctx.beginPath();ctx.arc(side*21,-17,12,0,Math.PI*2);ctx.fillStyle='#dce6c8';ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.arc(side*21,-20,3.2,0,Math.PI*2);ctx.fillStyle='#424c40';ctx.fill();
      ctx.beginPath();ctx.moveTo(side*24,2);ctx.lineTo(side*19,5);ctx.strokeStyle='#93a77f';ctx.stroke();ctx.strokeStyle='#66755c';
    }
    ctx.beginPath();ctx.moveTo(-10,-6);ctx.quadraticCurveTo(0,0,10,-6);ctx.stroke();
    marble(ctx,0,-43,game.current,15.5);
    marble(ctx,0,18,game.next,8.5);
    ctx.restore();
  }
  function drawGuide() {
    const dx = Math.cos(angle), dy = Math.sin(angle), x = game.origin.x + dx*48, y = game.origin.y + dy*48;
    const hit = game.trace(x, y, dx * 1100, dy * 1100);
    const length = hit ? hit.t * 1100 : 1000;
    ctx.save();ctx.strokeStyle=colors[game.current].edge+'85';ctx.lineWidth=1.4;ctx.setLineDash([3,10]);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx*length,y+dy*length);ctx.stroke();ctx.setLineDash([]);
    if(hit){ctx.beginPath();ctx.arc(hit.point.x,hit.point.y,23,0,Math.PI*2);ctx.lineWidth=1.6;ctx.strokeStyle=colors[game.current].edge+'b0';ctx.stroke();
      marble(ctx,x+dx*length,y+dy*length,game.current,17,.25);}
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(canvas.width / E.WIDTH, 0, 0, canvas.height / E.HEIGHT, 0, 0);
    ctx.clearRect(0,0,E.WIDTH,E.HEIGHT);
    ctx.drawImage(background,0,0,E.WIDTH,E.HEIGHT);
    if (game.phase === 'playing') drawGuide();
    if (game.chain[0]?.s > game.path.length - 260) {
      const end = game.path.at(game.path.length);
      ctx.save();ctx.beginPath();ctx.arc(end.x,end.y,39,0,Math.PI*2);ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.strokeStyle='#ad7561';ctx.stroke();ctx.restore();
    }
    for (const ball of game.chain) {
      if (ball.s < 0 || ball.s > game.path.length) continue;
      const p = game.path.at(ball.s), q = reduced.matches ? 0 : (ball.settle || 0)/.12;
      marble(ctx,q ? p.x+(ball.fromX-p.x)*q : p.x,q ? p.y+(ball.fromY-p.y)*q : p.y,ball.color);
    }
    for (const shot of game.shots) marble(ctx,shot.x,shot.y,shot.color);
    drawFrog();
    if(game.slowTime>0){ctx.save();ctx.beginPath();ctx.arc(game.origin.x,game.origin.y,77,-Math.PI/2,-Math.PI/2+Math.PI*2*game.slowTime/7);ctx.strokeStyle='#86a57b';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    for(const effect of effects){
      ctx.save();ctx.globalAlpha=Math.min(1,effect.life*2);
      if(effect.kind==='text'){ctx.font='20px "Segoe UI", "Microsoft YaHei", sans-serif';ctx.textAlign='center';ctx.fillStyle=effect.color;ctx.fillText(effect.key?t(effect.key,effect.values):effect.text,effect.x,effect.y);}
      else {ctx.translate(effect.x,effect.y);ctx.rotate(effect.spin*effect.life);ctx.fillStyle=effect.color;ctx.fillRect(-2.5,-2.5,5,5);}
      ctx.restore();
    }
  }
  function resize() {
    const rect = space.getBoundingClientRect();
    const width = Math.max(1,rect.width), height = Math.max(1,rect.height-14);
    const scale = Math.min(width/E.WIDTH,height/E.HEIGHT);
    wrap.style.width=E.WIDTH*scale+'px';wrap.style.height=E.HEIGHT*scale+'px';
    const dpr=Math.min(2.5,window.devicePixelRatio||1);
    canvas.width=Math.max(1,Math.round(E.WIDTH*scale*dpr));canvas.height=Math.max(1,Math.round(E.HEIGHT*scale*dpr));
    pixelScale=Math.max(1,Math.min(2,scale*dpr));cacheBackground();requestFrame();
  }
  function updateOverlay(force = false) {
    if(lastPhase===game.phase&&!force)return;
    lastPhase=game.phase;const phase=game.phase;
    $('overlay').hidden=phase==='playing';$('retry').hidden=phase!=='paused';
    $('result').hidden=!['cleared','won','lost'].includes(phase);
    $('start-hint').hidden=phase!=='ready';
    const copy={ready:['ready','intro','start'],paused:['paused','pausedInfo','resume'],lost:['lost','lostInfo','retry'],cleared:['cleared','clearInfo','nextLevel'],won:['won','wonInfo','playAgain']}[phase];
    if(copy){setText('overlay-title',t(copy[0]));setText('overlay-description',t(copy[1]));setText('start',t(copy[2]));setText('result',t('result',{score:game.score,combo:game.maxCombo}));}
    $('pause').disabled=!['playing','paused'].includes(phase);
    $('pause').setAttribute('aria-label',t(phase==='paused'?'resume':'pause'));
    $('pause-mark').setAttribute('d',phase==='paused'?'M8 5v14l11-7Z':'M8 5v14M16 5v14');
    $('swap').disabled=phase!=='playing';
    if(copy&&phase!=='ready')announce(t(copy[0]));
    if(copy&&phase!=='ready'&&!$('help-dialog').open)$('start').focus({preventScroll:true});
  }
  function syncUI(force = false) {
    if(game.score>best){best=game.score;save();}
    const danger=game.chain[0]?.s>game.path.length-260;
    const state=[game.score,best,game.level,game.chain.length,game.charge,Math.ceil(game.slowTime),game.phase,danger,I.language].join('|');
    if(force||state!==cachedHud){
      cachedHud=state;setText('score',String(game.score).padStart(4,'0'));setText('best',String(best).padStart(4,'0'));
      setText('level-tag',String(game.level+1).padStart(2,'0')+' / 06');$('level-tag').setAttribute('aria-label',t('level',{level:game.level+1}));
      setText('chapter-name',t('garden'+(game.level+1)));setText('remaining',t('remaining',{count:game.chain.length}));
      $('progress').style.width=Math.max(0,1-game.chain.length/game.config.count)*100+'%';
      $('charge').style.width=game.charge/12*100+'%';
      setText('slow-caption',t(game.slowTime>0?'slowActive':game.charge>=12?'slowReady':'charge',{count:game.charge,seconds:Math.ceil(game.slowTime)}));
      $('slow').disabled=game.phase!=='playing'||game.charge<12||game.slowTime>0;$('slow').classList.toggle('ready',!$('slow').disabled);
      setText('status',t(danger?'danger':'tip'));$('status').parentElement.classList.toggle('danger',danger);
    }
    const ammo=[game.current,game.next,I.language].join('|');
    if(force||ammo!==lastAmmo){lastAmmo=ammo;for(const [id,color]of[['current-ball',game.current],['next-ball',game.next]]){
      const node=$(id);node.style.setProperty('--ball',colors[color].fill);node.style.setProperty('--edge',colors[color].edge);node.textContent=colors[color].mark;}
      $('swap').setAttribute('aria-label',t('ammo',{current:t('color'+game.current),next:t('color'+game.next)}));}
    updateOverlay(force);
  }
  function handleEvents() {
    for(const event of game.drainEvents()){
      if(event.type==='shot'){recoil=1;tone(460,.065,.022);}
      if(event.type==='swap')tone(330,.07,.02);
      if(event.type==='insert')tone(200,.06,.018);
      if(event.type==='slow'){tone(520,.2);tone(780,.25,.025,.12);}
      if(event.type==='match'){
        const p=event.balls[Math.floor(event.balls.length/2)];
        effects.push({kind:'text',x:p.x,y:p.y-28,life:1.3,text:'+'+event.points,color:'#5b7352'});
        if(event.combo>1){effects.push({kind:'text',x:game.origin.x,y:game.origin.y+93,life:1.6,key:'combo',values:{combo:event.combo},color:'#9b7556'});announce(t('combo',{combo:event.combo}));}
        if(!reduced.matches)for(const ball of event.balls)for(let j=0;j<5;j++){
          const a=Math.random()*Math.PI*2,v=25+Math.random()*55;
          effects.push({kind:'particle',x:ball.x,y:ball.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,spin:Math.random()*8,life:.5+Math.random()*.35,color:colors[ball.color].fill});
        }
        tone(520+event.combo*90,.13);tone(780+event.combo*60,.18,.025,.06);
      }
      if(event.type==='clear'){tone(523,.2);tone(659,.2,.035,.12);tone(784,.3,.035,.24);}
      if(event.type==='lost'){tone(220,.2);tone(160,.3,.025,.15);}
    }
    if(effects.length>220)effects.splice(0,effects.length-220);
  }
  function frame(now) {
    raf=0;const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
    if(game.phase==='playing'){
      if(keys.has('ArrowLeft')||keys.has('KeyA'))angle-=2.5*dt;
      if(keys.has('ArrowRight')||keys.has('KeyD'))angle+=2.5*dt;
      game.update(dt);
    }
    handleEvents();recoil=Math.max(0,recoil-dt*8);
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){effects.splice(i,1);continue;}
      if(e.kind==='text')e.y-=dt*(reduced.matches?0:20);else{e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=dt*50;}}
    syncUI();draw();
    if(game.phase==='playing'||effects.length)requestFrame();else lastTime=0;
  }
  function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
  function pause() {
    keys.clear();activePointer=null;game.pause();lastTime=0;syncUI();requestFrame();
    if(audio?.state==='running')audio.suspend().catch(()=>{});
  }
  function begin() {
    unlockAudio();effects.length=0;
    if(game.phase==='ready')game.start();
    else if(game.phase==='paused')game.resume();
    else if(game.phase==='cleared')game.advance();
    else if(game.phase==='lost')game.retry();
    else if(game.phase==='won'){game.prepare(0,0);game.start();}
    keys.clear();lastTime=0;cacheBackground();syncUI(true);canvas.focus({preventScroll:true});requestFrame();
  }
  function point(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)*E.WIDTH/r.width,y:(event.clientY-r.top)*E.HEIGHT/r.height};}
  function aim(event){const p=point(event);if(Math.hypot(p.x-game.origin.x,p.y-game.origin.y)>12)angle=Math.atan2(p.y-game.origin.y,p.x-game.origin.x);requestFrame();}
  canvas.addEventListener('pointerdown',event=>{
    if(game.phase!=='playing'||activePointer!==null)return;
    if(event.button!==0&&event.button!==2)return;
    event.preventDefault();canvas.focus({preventScroll:true});unlockAudio();
    if(event.button===2){game.swap();requestFrame();return;}
    aim(event);
    if(event.pointerType==='mouse'){game.fire(angle);requestFrame();}
    else{activePointer=event.pointerId;canvas.setPointerCapture(event.pointerId);}
  });
  canvas.addEventListener('pointermove',event=>{if(game.phase==='playing'&&(event.pointerType==='mouse'||activePointer===event.pointerId))aim(event);});
  canvas.addEventListener('pointerup',event=>{
    if(activePointer!==event.pointerId)return;activePointer=null;
    if(game.phase==='playing'){aim(event);game.fire(angle);requestFrame();}
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  });
  const cancelPointer=()=>{activePointer=null;};
  canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('lostpointercapture',cancelPointer);
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
  document.addEventListener('keydown',event=>{
    if($('help-dialog').open||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target.closest('button,a,input,select,textarea')&&['Space','Enter'].includes(event.code))return;
    if(!['ArrowLeft','ArrowRight','KeyA','KeyD','Enter','Space','KeyF','KeyP','Escape'].includes(event.code))return;
    event.preventDefault();unlockAudio();
    if(['KeyP','Escape'].includes(event.code)){
      if(event.repeat)return;if(game.phase==='playing')pause();else if(game.phase==='paused')begin();return;
    }
    if(game.phase!=='playing'){if(event.code==='Enter'&&!event.repeat)begin();return;}
    if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code))keys.add(event.code);
    else if(event.code==='Enter')game.fire(angle);
    else if(!event.repeat&&event.code==='Space')game.swap();
    else if(!event.repeat&&event.code==='KeyF')game.slow();
    requestFrame();
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  $('start').addEventListener('click',begin);
  $('retry').addEventListener('click',()=>{unlockAudio();game.retry();effects.length=0;cacheBackground();lastTime=0;syncUI(true);canvas.focus({preventScroll:true});requestFrame();});
  $('pause').addEventListener('click',()=>game.phase==='playing'?pause():begin());
  $('swap').addEventListener('click',()=>{unlockAudio();game.swap();canvas.focus({preventScroll:true});requestFrame();});
  $('slow').addEventListener('click',()=>{unlockAudio();game.slow();canvas.focus({preventScroll:true});requestFrame();});
  $('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;updateSound();save();if(soundEnabled){unlockAudio();tone(580,.1);}else if(audio?.state==='running')audio.suspend().catch(()=>{});});
  $('help').addEventListener('click',()=>{if(game.phase==='playing')pause();$('help-dialog').showModal();});
  $('close-help').addEventListener('click',()=>$('help-dialog').close());$('help-done').addEventListener('click',()=>$('help-dialog').close());
  $('help-dialog').addEventListener('close',()=>{$('help').focus({preventScroll:true});requestFrame();});
  window.addEventListener('blur',()=>{if(game.phase==='playing')pause();else keys.clear();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){pause();if(raf)cancelAnimationFrame(raf);raf=0;}else{lastTime=0;requestFrame();}
  });
  window.addEventListener('pagehide',()=>{pause();if(raf)cancelAnimationFrame(raf);raf=0;});
  window.addEventListener('pageshow',()=>{lastTime=0;syncUI(true);updateSound();requestFrame();});
  window.addEventListener('boopland:languagechange',()=>{cacheBackground();syncUI(true);updateSound();requestFrame();});
  new ResizeObserver(resize).observe(space);window.addEventListener('resize',resize);
  reduced.addEventListener('change',()=>requestFrame());
  resize();syncUI(true);updateSound();requestFrame();
})();
