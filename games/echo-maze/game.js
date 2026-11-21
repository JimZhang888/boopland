(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('echo-maze.' + key, values);
  const chart = new CaveChart(byId('map'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sheet = byId('sheet');
  const cards = [...document.querySelectorAll('.tickets i')];
  const progress = byId('progress');
  progress.max = EchoMaze.maps.length;
  const checkpointKey = 'boopland-echo-maze-next-level';
  const keyDirections = { ArrowUp:'up', ArrowRight:'right', ArrowDown:'down', ArrowLeft:'left' };
  const compassPoints = ['n','ne','e','se','s','sw','w','nw'];
  const cardinal = { up:'n', right:'e', down:'s', left:'w' };
  let game = EchoMaze.start(readCheckpoint()), message = 'ready', muted = false;
  let audioContext, voices = [], bump = null, pauseTime = null, view = '', lastKey = -Infinity;
  let frame = 0, timer = 0;
  byId('map').tabIndex = 0;

  function readCheckpoint() {
    try {
      const level = Number(localStorage.getItem(checkpointKey));
      if (Number.isInteger(level) && level >= 0 && level < EchoMaze.maps.length) return level;
    } catch { /* Storage is optional for local-file play. */ }
    return 0;
  }

  function nextLevel() {
    return (game.level + 1) % EchoMaze.maps.length;
  }

  function saveCheckpoint() {
    const next = nextLevel();
    try {
      if (next === 0 || next > readCheckpoint()) localStorage.setItem(checkpointKey, String(next));
    } catch { /* Continue the expedition when storage is unavailable. */ }
  }

  function roomName() {
    const cavesPerRegion = 6;
    const region = Math.floor(game.level / cavesPerRegion) + 1;
    if (region === 1) return t('room' + (game.level + 1));
    return t('region' + region, {n: game.level % cavesPerRegion + 1});
  }

  // Draw a small printed waveform on each unused echo ticket.
  for (const card of cards) {
    card.innerHTML = '<svg viewBox="0 0 80 24" fill="none" aria-hidden="true"><path class="wave" d="M2 12h12l3-2 3 4 4-8 4 12 4-15 4 19 4-14 4 8 3-6 4 3 4-2 4 1h19" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path class="flat" d="M3 12h73" stroke="currentColor" stroke-dasharray="3 3"/></svg>';
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  for (let i=0;i<60;i++) {
    const tick = document.createElementNS(svgNS,'path');
    tick.setAttribute('d','M50 10v'+(i%5 ? 2.4 : 5.4));
    tick.setAttribute('transform','rotate('+i*6+' 50 50)');
    tick.setAttribute('stroke',i%5 ? '#a8a390' : '#666957');
    byId('ticks').append(tick);
  }

  function orientation() {
    const dx = game.exit.x-game.player.x, dy = game.exit.y-game.player.y;
    const angle = Math.atan2(dx,-dy)*180/Math.PI;
    return { angle, key:game.won ? 'here' : compassPoints[(Math.round(angle/45)+8)%8] };
  }

  function sync() {
    const heading = orientation();
    const room = roomName();
    byId('room').textContent = room;
    byId('folio').textContent = String(game.level+1).padStart(2,'0')+' / '+EchoMaze.maps.length;
    progress.value = game.level + 1;
    byId('direction').textContent = t(heading.key);
    byId('needle').setAttribute('transform','rotate('+heading.angle+' 50 50)');
    byId('count').textContent = game.charges+' / 3';
    cards.forEach((card,i)=>card.classList.toggle('spent',i>=game.charges));
    byId('steps').textContent = t(game.steps===1 ? 'oneStep' : 'steps',{n:game.steps});
    byId('ping').setAttribute('aria-disabled',String(!game.charges || !!game.pulse || game.won));
    const soundLabel = t(muted?'unmute':'mute');
    byId('audio').setAttribute('aria-label',soundLabel);
    byId('audio').title = soundLabel;
    byId('audio').querySelector('use').setAttribute('href',muted?'#mute':'#sound');
    const open = Object.entries(EchoMaze.directions)
      .filter(([, [dx,dy]])=>{const tile=game.rows[game.player.y+dy]?.[game.player.x+dx];return tile && tile!=='#';})
      .map(([dir])=>t(cardinal[dir])).join(' · ');
    byId('map').setAttribute('aria-label',t('mapLabel',{room, dir:t(heading.key), open}));
    const notice = byId('notice'), note = t(message);
    if (note!==notice.textContent) notice.textContent = note;
    notice.classList.toggle('alert',message==='wallHit');
    if (view) updateSheet();
  }

  function stopDrawing() {
    cancelAnimationFrame(frame); clearTimeout(timer);
    frame=timer=0;
  }

  function paint() {
    stopDrawing();
    const now = pauseTime ?? performance.now();
    let age = game.pulse ? Math.max(0,now-game.pulse.time) : 0;
    if (game.pulse && age>=EchoMaze.duration) {
      game.pulse=null; age=0;
      if(message==='listening') message=game.charges ? 'ready' : 'empty';
      sync();
    }
    if(bump && now>=bump.until) bump=null;
    const still = muted || reduced.matches;
    chart.draw(game, age, still, bump);
    if (pauseTime!==null) return;
    if (game.pulse && !still) {
      frame=requestAnimationFrame(paint);
    } else if(game.pulse || bump) {
      const left = Math.min(game.pulse ? EchoMaze.duration-age : Infinity, bump ? bump.until-now : Infinity);
      timer=setTimeout(paint,Math.ceil(left)+1);
    }
  }

  function silence() {
    for(const osc of voices) { try { osc.stop(); } catch {} }
    voices=[];
  }

  function playEcho() {
    if(muted || document.hidden) return;
    try {
      const Context=window.AudioContext || window.webkitAudioContext;
      if(!Context) return;
      audioContext ??= new Context();
      if(audioContext.state==='suspended') audioContext.resume().catch(()=>{});
      silence();
      [0,.15,.32].forEach((delay,i)=>{
        const osc=audioContext.createOscillator(), gain=audioContext.createGain();
        const start=audioContext.currentTime+delay, end=start+.16;
        osc.type='sine'; osc.frequency.setValueAtTime(940,start); osc.frequency.exponentialRampToValueAtTime(580,end);
        gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(.10/(i+1),start+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,end);
        osc.connect(gain);gain.connect(audioContext.destination);
        osc.onended=()=>{osc.disconnect();gain.disconnect();voices=voices.filter(v=>v!==osc);};
        voices.push(osc);osc.start(start);osc.stop(end+.01);
      });
    } catch { /* The chart carries the complete echo when audio is unavailable. */ }
  }

  function pauseIfNeeded() {
    const shouldPause = document.hidden || sheet.open;
    const now = performance.now();
    if(shouldPause && pauseTime===null) { pauseTime=now; stopDrawing(); silence(); }
    if(!shouldPause && pauseTime!==null) {
      const elapsed=now-pauseTime;
      if(game.pulse) game.pulse.time+=elapsed;
      if(bump) bump.until+=elapsed;
      pauseTime=null; paint();
    }
  }

  function updateSheet() {
    const help=view==='help', last=game.level===EchoMaze.maps.length-1;
    sheet.querySelector('use').setAttribute('href',help?'#echo':'#door');
    byId('sheet-title').textContent=t(help?'help':last?'finished':'cleared');
    byId('sheet-body').textContent=help ? t('instructions') : t('summary',{room:roomName(),steps:game.steps,used:3-game.charges});
    byId('proceed').textContent=t(help?'ok':last?'newTrip':'next');
  }

  function openSheet(kind) {
    view=kind;updateSheet();sheet.showModal();pauseIfNeeded();byId('proceed').focus();
  }

  function restart(level, notice) {
    game=EchoMaze.start(level);bump=null;lastKey=-Infinity;message=notice;
    silence();sync();paint();
  }

  function move(dir) {
    if(sheet.open || document.hidden) return;
    const result=EchoMaze.move(game,dir);
    if(result==='idle') return;
    bump=null;
    if(result==='wall') {
      const [dx,dy]=EchoMaze.directions[dir];
      bump={x:game.player.x+dx,y:game.player.y+dy,until:performance.now()+440};
      message='wallHit';
    } else {
      message=game.pulse ? 'listening' : game.charges ? 'ready' : 'empty';
    }
    if(result==='won') {
      game.pulse=null;
      saveCheckpoint();
    }
    sync();paint();
    if(result==='won') openSheet('win');
  }

  function ping() {
    if(sheet.open || document.hidden || game.won) return;
    if(EchoMaze.emit(game,performance.now())) { message='listening'; playEcho(); }
    else if(!game.charges && !game.pulse) message='empty';
    sync();paint();
  }
  function refocus(event) { if(event.detail>0) byId('map').focus({preventScroll:true}); }
  for(const button of document.querySelectorAll('[data-dir]')) {
    button.addEventListener('click',event=>{move(button.dataset.dir);if(!sheet.open) refocus(event);});
  }
  byId('ping').addEventListener('click',event=>{ping();refocus(event);});
  byId('audio').addEventListener('click',event=>{muted=!muted;if(muted)silence();sync();paint();refocus(event);});
  byId('restart').addEventListener('click',event=>{restart(game.level,'again');refocus(event);});
  byId('help-button').addEventListener('click',()=>openSheet('help'));
  byId('proceed').addEventListener('click',()=>{
    const advance=view==='win';
    sheet.close();view='';pauseIfNeeded();
    if(advance) restart(nextLevel(),'ready');
    byId('map').focus({preventScroll:true});
  });
  sheet.addEventListener('cancel',event=>{if(view==='win') event.preventDefault();});
  sheet.addEventListener('close',()=>{if(!sheet.open) { view='';pauseIfNeeded(); }});
  document.addEventListener('keydown',event=>{
    if(sheet.open || document.hidden || event.altKey || event.metaKey || event.ctrlKey) return;
    if(Object.hasOwn(keyDirections,event.key)) {
      event.preventDefault();
      if(event.repeat && performance.now()-lastKey<95) return;
      lastKey=performance.now(); move(keyDirections[event.key]);
    } else if(event.code==='Space' && (!event.target.closest('a,button') || event.target.id==='ping')) {
      event.preventDefault();if(!event.repeat) ping();
    } else if(event.key.toLowerCase()==='r' && !event.repeat) {
      event.preventDefault();restart(game.level,'again');
    }
  });
  document.addEventListener('visibilitychange',pauseIfNeeded);
  window.addEventListener('pagehide',()=>{silence();stopDrawing();});
  window.addEventListener('pageshow',()=>{pauseIfNeeded();paint();});
  window.addEventListener('boopland:languagechange',sync);
  reduced.addEventListener('change',paint);
  new ResizeObserver(paint).observe(byId('map'));
  sync();paint();
})();
