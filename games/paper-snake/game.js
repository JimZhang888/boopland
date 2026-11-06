(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const i18n = window.BooplandI18n;
  const t = (key, values) => i18n.t('paperSnake.' + key, values);
  const game = new window.PaperSnake();
  const canvas = $('board'), context = canvas.getContext('2d');
  const overlay = $('overlay'), startButton = $('start'), dialog = $('help-dialog');
  const speedButtons = [...document.querySelectorAll('[data-speed]')];
  const bestKey = 'boopland-paper-snake-best-v1';
  let best = {}, selectedSpeed = 'normal', sound = false, audioContext;
  let frame = 0, previousTime = 0, size = 0, background, bestAtStart = 0, burst = null, pointer = null;
  try {
    const saved = JSON.parse(localStorage.getItem(bestKey));
    for (const mode of ['slow', 'normal', 'fast']) {
      best[mode] = Number.isInteger(saved?.[mode]) && saved[mode] >= 0 && saved[mode] <= 3970 ? saved[mode] : 0;
    }
  } catch { /* A private or file:// session can still play with in-memory records. */ }
  if (!context) {
    $('overlay-title').textContent = t('unavailable');
    startButton.disabled = true;
    $('restart').disabled = true;
    return;
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const announce = message => { $('announcement').textContent = message; };
  function saveBest() {
    if (game.score <= (best[game.speed] || 0)) return;
    best[game.speed] = game.score;
    try { localStorage.setItem(bestKey, JSON.stringify(best)); } catch { /* Best remains for this visit. */ }
  }
  function unlockAudio() {
    if (!sound) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch { /* Sound is optional. */ }
  }
  function tone(kind) {
    if (!sound || !audioContext || audioContext.state !== 'running') return;
    const now = audioContext.currentTime;
    const notes = kind === 'eat' ? [620, 830] : kind === 'over' ? [240, 170] : [480];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * .08);
      gain.gain.setValueAtTime(0, now + index * .08);
      gain.gain.linearRampToValueAtTime(.045, now + index * .08 + .012);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .08 + .15);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now + index * .08); oscillator.stop(now + index * .08 + .16);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  function updateUI() {
    document.title = t('pageTitle');
    $('score').textContent = String(game.score).padStart(2, '0');
    $('best').textContent = String(best[selectedSpeed] || 0).padStart(2, '0');
    $('mode-tag').textContent = t(selectedSpeed);
    const active = game.status === 'playing' || game.status === 'paused';
    speedButtons.forEach(button => {
      button.disabled = active;
      button.setAttribute('aria-pressed', String(button.dataset.speed === selectedSpeed));
    });
    $('speed-hint').textContent = t(active ? 'speedLocked' : 'speedHint');
    $('pause').disabled = !active;
    $('pause').setAttribute('aria-label', t(game.status === 'paused' ? 'resume' : 'pause'));
    $('pause-mark').setAttribute('d', game.status === 'paused' ? 'm8 4 12 8-12 8Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound-mark').setAttribute('d', sound ? 'M17 8q5 4 0 8m3-11q7 7 0 14' : 'm17 9 5 6m0-6-5 6');
    $('status-note').textContent = t(game.status === 'playing' ? 'playing' : 'tip');
    overlay.hidden = game.status === 'playing';
    $('result').hidden = !['over', 'won'].includes(game.status);
    $('start-hint').hidden = game.status !== 'ready';
    if (overlay.hidden) return;
    let title = 'ready', description = 'intro', action = 'start';
    if (game.status === 'paused') { title = 'paused'; description = 'pausedDesc'; action = 'resume'; }
    if (game.status === 'over') { title = 'over'; description = game.reason; action = 'again'; }
    if (game.status === 'won') { title = 'won'; description = 'wonDesc'; action = 'again'; }
    $('overlay-title').textContent = t(title);
    $('overlay-description').textContent = t(description);
    $('overlay-kicker').textContent = t(game.score > bestAtStart && ['over', 'won'].includes(game.status) ? 'newBest' : 'kicker');
    $('result').textContent = t('result', { score: game.score, apples: game.score / 10 });
    startButton.textContent = t(action);
  }
  // Seeded variations keep graphite strokes stable, rather than flickering each frame.
  function noise(seed) { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function makeBackground() {
    background = document.createElement('canvas');
    background.width = canvas.width; background.height = canvas.height;
    const c = background.getContext('2d'), ratio = canvas.width / size, cell = size / game.size;
    c.scale(ratio, ratio);
    c.fillStyle = '#f8f6eb'; c.fillRect(0, 0, size, size);
    c.strokeStyle = '#a6b4a32b'; c.lineWidth = .65;
    for (let i = 1; i < game.size; i++) {
      c.beginPath(); c.moveTo(i * cell, 0); c.lineTo(i * cell, size); c.stroke();
      c.beginPath(); c.moveTo(0, i * cell); c.lineTo(size, i * cell); c.stroke();
    }
    for (let i = 0; i < 1700; i++) {
      c.fillStyle = i % 3 ? '#766a4509' : '#ffffff90';
      c.fillRect(noise(i) * size, noise(i + 1800) * size, .7, .7);
    }
    c.strokeStyle = '#7f8c6e33'; c.lineWidth = .7;
    for (const [x,y] of [[.6,.6],[19.4,.6],[.6,19.4],[19.4,19.4]]) {
      c.beginPath(); c.moveTo((x - .18) * cell,y * cell); c.lineTo((x + .18) * cell,y * cell);
      c.moveTo(x * cell,(y - .18) * cell); c.lineTo(x * cell,(y + .18) * cell); c.stroke();
    }
  }
  function resize() {
    const available = document.querySelector('.board-space');
    const styles = getComputedStyle(available);
    size = Math.max(1, Math.floor(Math.min(available.clientWidth, available.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom))));
    $('board-wrap').style.width = size + 'px';
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * ratio);
    makeBackground(); draw();
  }
  function apple(position, cell) {
    if (!position) return;
    const c = context;
    c.save(); c.translate((position.x + .5) * cell, (position.y + .5) * cell); c.scale(cell / 30, cell / 30);
    const shape = () => {
      c.beginPath(); c.moveTo(0,-7); c.bezierCurveTo(-13,-17,-17,-1,-9,10);
      c.bezierCurveTo(-4,17,0,10,3,12); c.bezierCurveTo(12,15,19,-8,9,-10); c.quadraticCurveTo(4,-12,0,-7); c.closePath();
    };
    shape(); c.fillStyle='#c7836e88'; c.fill(); c.strokeStyle='#8f6250'; c.lineWidth=1.35; c.stroke();
    c.save(); shape(); c.clip(); c.lineWidth=.6; c.strokeStyle='#9b5e4b85';
    for(let i=-20;i<20;i+=3){c.beginPath();c.moveTo(i,-13);c.lineTo(i-13,15);c.stroke();} c.restore();
    c.beginPath(); c.moveTo(0,-7); c.quadraticCurveTo(-2,-15,3,-18); c.strokeStyle='#706b4e'; c.lineWidth=1.5; c.stroke();
    c.beginPath(); c.moveTo(2,-12); c.quadraticCurveTo(11,-11,12,-18); c.quadraticCurveTo(5,-19,2,-12); c.fillStyle='#9aa276'; c.fill(); c.lineWidth=.75; c.stroke();
    c.beginPath(); c.moveTo(-8,-4); c.lineTo(-10,2); c.strokeStyle='#fcf4dfb0'; c.lineWidth=2; c.stroke(); c.restore();
  }
  function snake(points, direction, cell) {
    const c = context, radius = cell * .37;
    const line = (offsetX = 0, offsetY = 0) => {
      c.beginPath(); points.forEach((p, i) => {
        const x = (p.x + .5) * cell + offsetX, y = (p.y + .5) * cell + offsetY;
        if (i) c.lineTo(x,y); else c.moveTo(x,y);
      });
    };
    c.lineCap='round'; c.lineJoin='round';
    line(); c.strokeStyle='#59604ee0'; c.lineWidth=radius*2+1.7; c.stroke();
    line(); c.strokeStyle='#b6bf9e'; c.lineWidth=radius*2-.7; c.stroke();
    line(cell * .045, -cell * .045); c.strokeStyle='#e0e4c18a'; c.lineWidth=radius*1.5; c.stroke();
    for (let index = 0; index < points.length; index++) {
      const p = points[index], x=(p.x+.5)*cell, y=(p.y+.5)*cell;
      c.save(); c.beginPath(); c.arc(x,y,radius-.8,0,Math.PI*2); c.clip();
      c.strokeStyle='#6571506b'; c.lineWidth=.7;
      for (let i=-4; i<=4; i++) {
        const shift=i*cell*.15+noise(index)*1.3;
        c.beginPath(); c.moveTo(x+shift-cell*.3,y-cell*.44); c.lineTo(x+shift+cell*.2,y+cell*.44); c.stroke();
      }
      c.restore();
    }
    const head=points[0], x=(head.x+.5)*cell, y=(head.y+.5)*cell;
    c.save(); c.translate(x,y); c.rotate({right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[direction]);
    c.fillStyle='#bdc7a3';c.strokeStyle='#5c634f';c.lineWidth=1.1;
    c.beginPath();c.ellipse(0,0,cell*.44,cell*.41,-.08,0,Math.PI*2);c.fill();c.stroke();
    c.strokeStyle='#5e664a70'; c.lineWidth=.6;
    for(let i=0;i<4;i++){c.beginPath();c.moveTo(-cell*.26+i*cell*.1,-cell*.24);c.lineTo(-cell*.32+i*cell*.1,cell*.22);c.stroke();}
    for (const side of [-1,1]) {
      c.beginPath(); c.arc(cell*.15,side*cell*.21,cell*.105,0,Math.PI*2);c.fillStyle='#fbf8e9';c.fill();
      c.beginPath(); c.arc(cell*.19,side*cell*.21,cell*.052,0,Math.PI*2);c.fillStyle='#414736';c.fill();
    }
    c.strokeStyle='#b46f61';c.lineWidth=1;c.beginPath();c.moveTo(cell*.43,0);c.lineTo(cell*.64,0);c.lineTo(cell*.72,-cell*.08);c.moveTo(cell*.64,0);c.lineTo(cell*.72,cell*.07);c.stroke();c.restore();
  }
  const demoSnake = [{x:16,y:15},{x:15,y:15},{x:14,y:15},{x:13,y:15},{x:12,y:15},{x:12,y:16},{x:12,y:17},{x:11,y:17},{x:10,y:17},{x:9,y:17},{x:8,y:17},{x:7,y:17},{x:6,y:17},{x:5,y:17},{x:4,y:17},{x:3,y:17},{x:3,y:16},{x:3,y:15},{x:3,y:14},{x:3,y:13}];
  function draw(now = performance.now()) {
    if (!size || !background) return;
    const c=context, cell=size/game.size;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(background,0,0);
    const ratio=canvas.width/size;c.setTransform(ratio,0,0,ratio,0,0);
    snake(game.status === 'ready' ? demoSnake : game.snake,game.status === 'ready' ? 'right' : game.direction,cell);
    apple(game.status === 'ready' ? {x:16,y:3} : game.food,cell);
    if (burst && !reducedMotion.matches) {
      const progress=Math.min(1,(now-burst.time)/380);
      c.strokeStyle=`rgba(156,112,79,${1-progress})`;c.lineWidth=1;
      for(let i=0;i<8;i++) {const angle=i*Math.PI/4, distance=cell*(.4+progress*.7);c.beginPath();c.moveTo(burst.x*cell+Math.cos(angle)*distance,burst.y*cell+Math.sin(angle)*distance);c.lineTo(burst.x*cell+Math.cos(angle)*(distance+cell*.16),burst.y*cell+Math.sin(angle)*(distance+cell*.16));c.stroke();}
      if(progress===1)burst=null;
    }
  }
  function stopLoop() { cancelAnimationFrame(frame); frame=0; previousTime=0; }
  function tick(now) {
    frame=0;
    if(game.status!=='playing')return;
    const events=game.advance(previousTime ? now-previousTime : 0);previousTime=now;
    for(const event of events) {
      if(event==='eat'||event==='won') {
        burst={x:game.snake[0].x+.5,y:game.snake[0].y+.5,time:now};tone('eat');saveBest();
        announce(t('scoreAnnounce',{score:game.score,apples:game.score/10}));
      }
      if(event==='over'||event==='won') {tone(event==='over'?'over':'eat');saveBest();announce(t(event==='won'?'won':'over')+' '+t('result',{score:game.score,apples:game.score/10}));}
      if(event!=='move')updateUI();
    }
    draw(now);
    if(game.status==='playing') frame=requestAnimationFrame(tick);
    else { previousTime=0; if(document.activeElement===canvas)startButton.focus({preventScroll:true}); }
  }
  function begin() {
    unlockAudio();stopLoop();burst=null;announce('');
    if(game.status==='paused')game.resume();
    else {bestAtStart=best[selectedSpeed]||0;game.start(selectedSpeed);tone('start');}
    updateUI();draw();canvas.focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function pause() {
    if(game.status!=='playing')return;
    game.pause();stopLoop();burst=null;updateUI();draw();announce(t('paused'));
  }
  function togglePause() {if(game.status==='playing')pause();else if(game.status==='paused')begin();}
  startButton.addEventListener('click',begin);
  $('pause').addEventListener('click',togglePause);
  $('restart').addEventListener('click',()=>{stopLoop();game.reset();burst=null;announce('');updateUI();draw();startButton.focus({preventScroll:true});});
  $('sound').addEventListener('click',()=>{sound=!sound;unlockAudio();updateUI();if(sound)tone('start');});
  speedButtons.forEach(button=>button.addEventListener('click',()=>{
    if(['playing','paused'].includes(game.status))return;
    selectedSpeed=button.dataset.speed;updateUI();
  }));
  const keyDirections={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  document.addEventListener('keydown',event=>{
    if(dialog.open||event.ctrlKey||event.metaKey||event.altKey)return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(keyDirections[key]) {event.preventDefault();game.turn(keyDirections[key]);}
    else if(key===' '||key==='p'||key==='Escape') {
      // A focused button keeps its native Space activation instead of triggering twice.
      if(key===' '&&event.target.closest('button,a'))return;
      event.preventDefault();if(!event.repeat)togglePause();
    }
  });
  document.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>{
    game.turn(button.dataset.direction);if(game.status==='playing')canvas.focus({preventScroll:true});
  }));
  canvas.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||game.status!=='playing')return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<Math.max(12,size/25))return;
    game.turn(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
    pointer.x=event.clientX;pointer.y=event.clientY;
  });
  const releasePointer=()=>{pointer=null;};
  canvas.addEventListener('pointerup',releasePointer);canvas.addEventListener('pointercancel',releasePointer);canvas.addEventListener('lostpointercapture',releasePointer);
  $('help').addEventListener('click',()=>{pause();dialog.showModal();});
  $('close-help').addEventListener('click',()=>dialog.close());$('help-done').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audioContext?.suspend().catch(()=>{});}});
  window.addEventListener('blur',pause);window.addEventListener('pagehide',()=>{pause();audioContext?.suspend().catch(()=>{});});
  window.addEventListener('boopland:languagechange',()=>{updateUI();resize();});
  window.addEventListener('resize',resize);
  new ResizeObserver(resize).observe(document.querySelector('.board-space'));
  updateUI();resize();
})();
