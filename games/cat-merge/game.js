(() => {
  'use strict';
  const E = window.CatMerge, A = window.CatMergeArt;
  const $ = id => document.getElementById(id), canvas = $('game'), ctx = canvas.getContext('2d');
  const t = (key, values) => BooplandI18n.t('catMerge.' + key, values);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const game = E.createGame(), keys = new Set(), growth = [];
  let best = readBest(), startBest = best, sound = read('boopland-cat-merge-sound') === 'on';
  let audio = null, aim = E.WIDTH / 2, pointer = null, raf = 0, last = 0, clock = 0;
  let particles = [], rings = [], labels = [], feedback = null, feedbackTime = 0;
  let uiSignature = '', scale = 1, pixelRatio = 1;

  function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function write(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Play works without storage. */ } }
  function readBest() { const n = Number(read('boopland-cat-merge-best')); return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  function setText(id, value) { const text = String(value); if ($(id).textContent !== text) $(id).textContent = text; }

  function unlockAudio() {
    if (!sound) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
    } catch { audio = null; }
  }
  function tone(type, level = 0) {
    if (!sound || !audio || audio.state !== 'running') return;
    const notes = type === 'merge' ? [1, 1.25, 1.5] : type === 'over' ? [1, .8, .65] : [1];
    const base = type === 'drop' ? 220 : type === 'over' ? 300 : 330 * 2 ** (Math.min(level, 8) / 12);
    notes.forEach((ratio, index) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + index * .055;
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(base * ratio, at);
      oscillator.frequency.exponentialRampToValueAtTime(base * ratio * .85, at + .17);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.035, at + .012);
      gain.gain.exponentialRampToValueAtTime(.001, at + .2);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + .22);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }

  function icon(target, level, size = 29) {
    const context = target.getContext('2d');
    target.width = size * 2; target.height = size * 2;
    context.setTransform(2, 0, 0, 2, 0, 0);
    A.cat(context, size / 2, size / 2, size * .39, level);
  }
  for (let level = 0; level < E.RADII.length; level++) {
    const item = document.createElement('canvas');
    item.setAttribute('role', 'img'); icon(item, level);
    $('growth-cats').appendChild(item); growth.push(item);
  }
  const recipe = $('recipe').getContext('2d');
  recipe.scale(2, 2);
  A.cat(recipe, 28, 49, 20, 0, -.12); A.cat(recipe, 91, 49, 20, 0, .12); A.cat(recipe, 183, 48, 32, 1);
  recipe.fillStyle = '#8b927a'; recipe.font = '18px Georgia'; recipe.textAlign = 'center';
  recipe.fillText('+', 60, 55); recipe.fillText('→', 132, 55);

  function updateUI(force = false) {
    const mode = game.mode, cooling = game.cooldown > 0;
    const warning = game.danger > .08 ? Math.max(1, Math.ceil(E.DANGER_TIME - game.danger)) : 0;
    const signature = [mode, game.score, best, game.highest, game.current, game.next, cooling, warning, sound, BooplandI18n.language].join('|');
    if (!force && signature === uiSignature) return;
    uiSignature = signature;
    setText('score', game.score); setText('best', best);
    $('highest').firstChild.nodeValue = String(game.highest + 1).padStart(2, '0');
    icon($('next-cat'), game.next, 44);
    growth.forEach((item, level) => {
      item.classList.toggle('unlocked', level <= game.highest);
      item.classList.toggle('current', level === game.highest);
      const label = t('levelLabel', { level: level + 1 });
      item.setAttribute('aria-label', label); item.title = label;
    });
    $('overlay').hidden = mode === 'playing';
    $('pause').disabled = !['playing', 'paused'].includes(mode);
    $('pause').setAttribute('aria-label', t(mode === 'paused' ? 'resume' : 'pause'));
    $('pause-mark').setAttribute('d', mode === 'paused' ? 'm8 5 11 7-11 7Z' : 'M8 5v14M16 5v14');
    $('sound').setAttribute('aria-label', t(sound ? 'soundOff' : 'soundOn'));
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound-wave').setAttribute('d', sound ? 'M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm16 9 6 6m0-6-6 6');
    setText('drop-label', t({ ready: 'start', playing: 'drop', paused: 'resume', over: 'again' }[mode]));
    $('drop').disabled = mode === 'playing' && cooling;
    const hint = mode === 'playing' ? warning ? 'danger' : cooling ? 'cooldown' : 'playingHint' : { ready: 'readyHint', paused: 'pausedHint', over: 'overHint' }[mode];
    setText('status', t(hint, { seconds: warning }));
    $('stage').classList.toggle('is-danger', warning > 0);
    setText('overlay-title', t({ ready: 'name', paused: 'paused', over: 'over', playing: 'name' }[mode]));
    setText('overlay-copy', t(mode === 'ready' ? 'intro' : mode === 'paused' ? 'pauseCopy' : game.score > startBest ? 'newBest' : 'overCopy'));
    setText('overlay-action-label', t(mode === 'paused' ? 'resume' : mode === 'over' ? 'again' : 'start'));
    $('overlay-kicker').hidden = mode !== 'ready';
    $('restart').hidden = mode !== 'paused';
    $('result').hidden = mode !== 'over';
    if (mode === 'over') {
      setText('result-score', game.score);
      setText('result-note', t('resultNote', { merges: game.merges, combo: game.bestCombo }));
    }
    refreshFeedback();
  }

  function refreshFeedback() {
    if (game.danger > .08 && game.mode === 'playing') {
      $('feedback').hidden = false; $('feedback').classList.add('danger');
      setText('feedback', t('danger', { seconds: Math.max(1, Math.ceil(E.DANGER_TIME - game.danger)) }));
    } else {
      $('feedback').classList.remove('danger');
      $('feedback').hidden = !feedback || game.mode !== 'playing';
      if (feedback) setText('feedback', t(feedback.key, feedback.values));
    }
  }
  function flash(key, values = {}) { feedback = { key, values }; feedbackTime = 1.5; refreshFeedback(); }

  function start() {
    unlockAudio(); best = Math.max(best, readBest()); startBest = best; E.start(game);
    aim = E.WIDTH / 2; pointer = null; keys.clear(); particles = []; rings = []; labels = [];
    feedback = null; feedbackTime = 0; updateUI(true); canvas.focus({ preventScroll: true }); wake();
  }
  function pause() {
    keys.clear(); pointer = null;
    if (!E.pause(game)) return;
    audio?.suspend().catch(() => {}); updateUI(true); render();
  }
  function resume() {
    if ($('help-dialog').open || !E.resume(game)) return;
    unlockAudio(); updateUI(true); canvas.focus({ preventScroll: true }); wake();
  }
  function place() {
    if ($('help-dialog').open) return;
    unlockAudio(); E.drop(game, aim); aim = E.aimX(game, aim); handleEvents(); updateUI(); wake();
  }
  function act() {
    if ($('help-dialog').open) return;
    if (game.mode === 'ready' || game.mode === 'over') start();
    else if (game.mode === 'paused') resume();
    else place();
  }

  function handleEvents() {
    for (const event of E.drainEvents(game)) {
      if (event.type === 'drop') tone('drop');
      if (event.type === 'blocked') flash('blocked');
      if (event.type === 'merge') {
        tone('merge', event.level);
        if (event.royal) flash('royal', { points: event.points });
        else if (event.combo > 1) flash('combo', { count: event.combo, multiplier: Math.min(event.combo, 5) });
        labels.push({ x: event.x, y: event.y, text: '+' + event.points, age: 0 });
        if (!reduced) {
          rings.push({ x: event.x, y: event.y, radius: E.RADII[event.level], age: 0 });
          for (let i = 0; i < 10; i++) {
            const angle = Math.PI * 2 * i / 10, speed = 70 + Math.random() * 65;
            particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, age: 0, color: A.colors[event.level] });
          }
        }
        if (game.score > best) { best = game.score; write('boopland-cat-merge-best', best); }
      }
      if (event.type === 'over') {
        keys.clear(); pointer = null; tone('over'); updateUI(true); $('overlay-action').focus({ preventScroll: true });
      }
    }
    particles = particles.slice(-150); labels = labels.slice(-12); rings = rings.slice(-12);
  }

  function resize() {
    const rect = $('stage').getBoundingClientRect();
    scale = Math.max(.01, Math.min(rect.width / E.WIDTH, rect.height / E.HEIGHT));
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    const width = E.WIDTH * scale, height = E.HEIGHT * scale;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
    render();
  }

  function pencil(points, color = '#9ca48b', width = 1, dash = []) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); ctx.setLineDash([]);
  }
  function backdrop() {
    ctx.fillStyle = '#f0e7d333'; ctx.fillRect(21, E.DANGER + 9, 398, E.FLOOR - E.DANGER - 9);
    ctx.fillStyle = '#e6d9bf8c';
    ctx.beginPath(); ctx.moveTo(20, 529); ctx.lineTo(419, 529); ctx.lineTo(425, 557); ctx.lineTo(14, 557); ctx.closePath(); ctx.fill();
    pencil([[19,122],[18,382],[20,549],[150,552],[419,550],[422,323],[420,121]], '#a69d86', 2);
    pencil([[24,133],[25,539],[158,542],[413,540],[415,135]], '#b7ad9580', .9);
    for (let x = 29; x < 420; x += 14) pencil([[x,550],[x+4,558]], '#b5a88d80', .8);
    pencil([[190,559],[190,570],[249,568],[248,557]], '#b3a68c80', .8);
    const danger = game.danger > .08;
    pencil([[17,E.DANGER],[424,E.DANGER]], danger ? '#b67456' : '#b8b7a3', danger ? 2 : 1, [5,7]);
    // Marks at either side make the danger line legible without relying on color.
    for (const x of [12,428]) {
      ctx.fillStyle = danger ? '#ad7155' : '#b6b5a1'; ctx.beginPath(); ctx.arc(x,E.DANGER,2.5,0,Math.PI*2); ctx.fill();
    }
    if (danger) {
      pencil([[22,E.DANGER-7],[22+(396*game.danger/E.DANGER_TIME),E.DANGER-7]], '#bd8968', 3);
    }
    ctx.globalAlpha = .18; ctx.fillStyle = '#8e997b';
    ctx.beginPath(); ctx.ellipse(220,492,13,11,0,0,Math.PI*2); ctx.fill();
    for (const [x,y] of [[204,477],[214,470],[226,470],[236,477]]) { ctx.beginPath(); ctx.ellipse(x,y,4,6,0,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  function drawAim() {
    const radius = E.RADII[game.current], x = E.aimX(game, aim);
    let landing = E.FLOOR - radius;
    for (const cat of game.cats) {
      const dx = cat.x - x, distance = radius + cat.r;
      if (Math.abs(dx) < distance) landing = Math.min(landing, cat.y - Math.sqrt(distance * distance - dx * dx));
    }
    landing = Math.max(E.SPAWN_Y, landing);
    ctx.globalAlpha = game.cooldown > 0 ? .28 : .65;
    pencil([[x,E.SPAWN_Y+radius+5],[x,landing]], '#a8b197', 1, [3,7]);
    ctx.globalAlpha = .22; ctx.strokeStyle = '#81916f'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x,landing+radius-2,radius*.75,3,0,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
    const bob = game.mode === 'ready' && !reduced ? Math.sin(clock * 2) * 2 : 0;
    A.cat(ctx,x,E.SPAWN_Y+bob,radius,game.current,0,game.cooldown>0?.4:1);
    pencil([[x-7,9],[x,15],[x+7,9]], '#8a987a', 1.2);
  }

  function render() {
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(canvas.width / E.WIDTH,0,0,canvas.height / E.HEIGHT,0,0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    backdrop();
    if (game.mode === 'ready') {
      [[4,219,499,.1],[2,91,516,-.12],[1,350,524,.15],[0,145,526,0],[3,302,471,-.2],[0,191,436,-.2],[1,118,464,.25]].forEach(([level,x,y,angle])=>A.cat(ctx,x,y,E.RADII[level],level,angle));
    } else {
      for (const cat of game.cats) {
        const pop = reduced || cat.age > .3 ? 1 : 1 + Math.sin(cat.age / .3 * Math.PI) * .065;
        A.cat(ctx,cat.x,cat.y,cat.r,cat.level,cat.angle,1,pop);
      }
    }
    if (game.mode === 'playing' || game.mode === 'ready') drawAim();
    for (const ring of rings) {
      ctx.globalAlpha = Math.max(0,1-ring.age/.5)*.5; ctx.strokeStyle = '#b2c19b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ring.x,ring.y,ring.radius*(.6+ring.age*1.8),0,Math.PI*2); ctx.stroke();
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0,1-p.age/.7); ctx.fillStyle = p.color; ctx.strokeStyle = '#818b73'; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.ellipse(p.x,p.y,2.5,4,p.age*4,0,Math.PI*2); ctx.fill(); ctx.stroke();
    }
    for (const label of labels) {
      ctx.globalAlpha = Math.max(0,1-label.age/1.1); ctx.font = '600 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#fffef7'; ctx.fillStyle = '#5b7352';
      const y = label.y - 18 - (reduced ? 0 : label.age*33);
      ctx.strokeText(label.text,label.x,y); ctx.fillText(label.text,label.x,y);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, Math.max(0,(now-last)/1000)); last = now;
    if (game.mode === 'playing' || game.mode === 'ready') {
      clock += dt;
      if (game.mode === 'playing') {
        aim = E.aimX(game, aim + ((keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)) * dt * 270);
        E.advance(game,dt); handleEvents();
        for (const p of particles) { p.age += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += dt*150; }
        particles = particles.filter(p=>p.age<.7);
        rings.forEach(r=>r.age+=dt); rings = rings.filter(r=>r.age<.5);
        labels.forEach(l=>l.age+=dt); labels = labels.filter(l=>l.age<1.1);
        if (feedbackTime > 0) { feedbackTime-=dt; if(feedbackTime<=0){feedback=null;refreshFeedback();} }
      }
      updateUI();
    }
    render();
    if (!document.hidden && (game.mode === 'playing' || (game.mode === 'ready' && !reduced))) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    aim = E.aimX(game,(event.clientX-rect.left) / Math.max(1,rect.width) * E.WIDTH);
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || game.mode !== 'playing') return;
    event.preventDefault(); pointer = event.pointerId; point(event);
    canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll:true });
  });
  canvas.addEventListener('pointermove', event => {
    if (game.mode === 'playing' && event.isPrimary && (event.pointerType === 'mouse' || pointer === event.pointerId)) point(event);
  });
  canvas.addEventListener('pointerup', event => {
    if (pointer !== event.pointerId) return;
    point(event); pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    place();
  });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  canvas.addEventListener('lostpointercapture', () => { pointer = null; });
  $('drop').addEventListener('click',act); $('overlay-action').addEventListener('click',act); $('restart').addEventListener('click',start);
  $('pause').addEventListener('click',()=>game.mode==='paused'?resume():pause());
  $('sound').addEventListener('click',()=>{
    sound=!sound; write('boopland-cat-merge-sound',sound?'on':'off');
    if(sound){unlockAudio();tone('merge',1);}else audio?.suspend().catch(()=>{});
    updateUI(true);
  });
  $('help').addEventListener('click',()=>{pause();$('help-dialog').showModal();});
  $('help-dialog').addEventListener('close',()=>$('help').focus({preventScroll:true}));
  document.addEventListener('keydown',event=>{
    if($('help-dialog').open||event.ctrlKey||event.altKey||event.metaKey||event.target.closest('input,select,textarea'))return;
    if(event.code==='ArrowLeft'||event.code==='ArrowRight'){
      if(game.mode==='playing'&&!event.target.closest('button,a')){event.preventDefault();keys.add(event.code);}return;
    }
    if(event.repeat)return;
    if(event.code==='Space'||event.code==='Enter'){
      if(event.target.closest('button,a'))return;event.preventDefault();act();
    }else if(event.code==='KeyP'||event.code==='Escape'){
      event.preventDefault();game.mode==='paused'?resume():pause();
    }
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){pause();audio?.suspend().catch(()=>{});cancelAnimationFrame(raf);raf=0;}
    else wake();
  });
  window.addEventListener('pagehide',()=>{pause();cancelAnimationFrame(raf);raf=0;audio?.suspend().catch(()=>{});});
  window.addEventListener('pageshow',wake);
  window.addEventListener('storage',event=>{if(event.key==='boopland-cat-merge-best'||event.key===null){best=Math.max(best,readBest());updateUI(true);}});
  window.addEventListener('boopland:languagechange',()=>{updateUI(true);render();});
  new ResizeObserver(resize).observe($('stage'));
  updateUI(true);resize();wake();
})();
