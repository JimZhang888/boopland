(() => {
  'use strict';
  const { Game, SIZE, TILE, POWERS } = SteelTide;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('steel.' + key, values);
  const game = new Game();
  const canvas = $('battlefield'), ctx = canvas.getContext('2d');
  const keys = new Map(), pointers = new Map();
  const symbols = { star: '☆', shield: '◇', freeze: '❄', fortify: '▥', bomb: '✹', life: '+' };
  let autoFire = false, soundEnabled = false, audio = null, best = 0;
  let lastTime = 0, animation = 0, previousStatus = '', toastTime = 0, toastKey = '', helpWasPlaying = false;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { best = Math.max(0, Number(localStorage.getItem('boopland-steel-tide-best')) || 0); } catch { /* Scores are optional. */ }
  for (let i = 0; i < 20; i++) { const mark = document.createElement('span'); mark.className = 'enemy-mark'; $('enemy-grid').append(mark); }

  function setText(id, value) { if ($(id).textContent !== String(value)) $(id).textContent = value; }
  function sound(kind) {
    if (!soundEnabled || !audio || audio.state !== 'running') return;
    const tones = { fire: [190, 65, .065, .018], blast: [94, 32, .2, .045], hit: [150, 35, .3, .06],
      armor: [330, 180, .07, .018], power: [440, 880, .22, .04], start: [260, 520, .18, .03],
      clear: [520, 1040, .4, .045], over: [200, 55, .65, .045], drop: [600, 720, .1, .025] };
    const [from, to, duration, volume] = tones[kind] || tones.fire;
    const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
    oscillator.type = kind === 'fire' || kind === 'blast' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function wakeAudio() {
    if (!soundEnabled) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume().catch(() => {});
    } catch { soundEnabled = false; refreshSound(); }
  }
  function refreshSound() {
    $('sound').setAttribute('aria-pressed', String(soundEnabled));
    $('sound').setAttribute('aria-label', t(soundEnabled ? 'soundOff' : 'soundOn'));
    $('sound-wave').setAttribute('d', soundEnabled ? 'M15 8q4 4 0 8m3-11q7 7 0 14' : 'm16 9 5 6m0-6-5 6');
  }
  function releaseInputs() {
    keys.clear(); pointers.clear();
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  }
  function input() {
    let dir = null;
    for (const direction of keys.values()) if (typeof direction === 'number') dir = direction;
    for (const pointer of pointers.values()) if (pointer.dir !== undefined) dir = pointer.dir;
    return { dir, fire: autoFire || keys.has('Space') || keys.has('KeyJ') || [...pointers.values()].some(p => p.fire) };
  }
  function action() {
    wakeAudio(); releaseInputs();
    if (game.status === 'paused') game.resume();
    else if (game.status === 'clear') game.nextStage();
    else game.start();
    previousStatus = ''; toastTime = 0; $('toast').hidden = true;
    refresh(); render(); canvas.focus({ preventScroll: true });
  }
  function togglePause() {
    if ($('help-dialog').open) return;
    if (game.status === 'playing') { game.pause(); audio?.suspend().catch(() => {}); }
    else if (game.status === 'paused') { wakeAudio(); game.resume(); }
    else return;
    releaseInputs(); refresh(); render();
    if (game.status === 'playing') canvas.focus({ preventScroll: true });
  }
  function refresh() {
    if (game.score > best) {
      best = game.score;
      try { localStorage.setItem('boopland-steel-tide-best', String(best)); } catch { /* Play continues without storage. */ }
    }
    setText('score', String(game.score).padStart(5, '0')); setText('best', String(best).padStart(5, '0'));
    setText('lives', String(game.lives).padStart(2, '0'));
    const power = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][game.level];
    const powerText = `${power} ${'●'.repeat(game.level)}${'○'.repeat(3 - game.level)}`;
    if ($('level').textContent !== powerText) {
      $('level').replaceChildren(document.createTextNode(power + ' '));
      const small = document.createElement('small'); small.textContent = '●'.repeat(game.level) + '○'.repeat(3 - game.level); $('level').append(small);
    }
    setText('stage', String(game.stage).padStart(2, '0'));
    setText('map-name', t('map' + ((game.stage - 1) % 5 + 1)));
    setText('stage-label', t('stageLabel', { n: String(game.stage).padStart(2, '0') }));
    setText('progress', `${String(game.kills).padStart(2, '0')} / ${game.target}`);
    setText('remaining', game.target - game.kills);
    setText('base-state', t(game.base.alive ? 'baseSafe' : 'baseLost'));
    document.querySelector('.status-dot').classList.toggle('lost', !game.base.alive);
    [...$('enemy-grid').children].forEach((el, i) => el.classList.toggle('dead', i < game.kills));
    const phase = { playing: 'battle', ready: 'standby', paused: 'paused', clear: 'clearTitle', over: 'overTitle' }[game.status];
    setText('phase', t(phase));
    $('pause').disabled = !['playing', 'paused'].includes(game.status);
    $('pause').setAttribute('aria-label', t(game.status === 'paused' ? 'resume' : 'pause'));
    setText('pause-symbol', game.status === 'paused' ? '▷' : 'Ⅱ');
    if (previousStatus !== game.status) {
      const shown = game.status !== 'playing';
      $('overlay').hidden = !shown;
      $('restart').hidden = game.status !== 'paused';
      document.querySelector('.hero-tank').toggleAttribute('hidden',game.status !== 'ready');
      $('briefing-controls').hidden = game.status !== 'ready';
      const titles = { ready: 'readyTitle', paused: 'pausedTitle', clear: 'clearTitle', over: 'overTitle' };
      const copy = { ready: 'readyText', paused: 'pausedText', clear: 'clearText', over: game.reason === 'base' ? 'overBase' : 'overLives' };
      const button = { ready: 'start', paused: 'resume', clear: 'nextStage', over: 'restart' };
      if (shown) {
        setText('overlay-title', t(titles[game.status])); setText('overlay-text', t(copy[game.status]));
        setText('primary-text', t(button[game.status]));
        setText('overlay-kicker', game.status === 'ready' ? 'BOOPLAND FIELD NOTES' : t('stageLabel', { n: String(game.stage).padStart(2, '0') }));
        setText('briefing-foot', game.status === 'ready' ? t('touchHint') : t('result', { score: game.score, kills: game.totalKills, stage: game.stage }));
        releaseInputs();
        if (!$('help-dialog').open && document.hasFocus()) $('primary').focus({ preventScroll: true });
      }
      previousStatus = game.status;
    }
  }
  function line(points, color = '#738066', width = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  function polygon(points, fill, stroke = '#738066', width = 1) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
  }
  function star(x, y, radius, fill, outline) {
    const points = Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? radius * .43 : radius; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
    polygon(points, fill, outline, 1);
  }
  function tank(tank, showcase = false) {
    const { x, y, dir, player, kind } = tank;
    if (tank.born > 0 && !showcase) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(game.time * 2);
      star(0, 0, 22 * (1 - tank.born / 1.2), '#f5f0d5', '#a9aa83'); ctx.restore(); return;
    }
    ctx.save(); ctx.translate(x, y);
    if (tank.shield > 0) {
      ctx.beginPath(); ctx.strokeStyle = '#8fa886'; ctx.lineWidth = 1.7; ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = reduceMotion ? 0 : -game.time * 18; ctx.arc(0, 0, 27, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.rotate(dir * Math.PI / 2);
    const outline = player ? '#4f6549' : kind === 2 ? '#626f70' : '#886353';
    const fill = player ? '#b5c59d' : kind === 2 ? '#b1bdbc' : kind === 1 ? '#d3bb87' : '#cba794';
    const dark = player ? '#80966d' : kind === 2 ? '#839493' : '#ab8772';
    ctx.fillStyle = '#47513c14'; ctx.fillRect(-17, -14, 36, 36);
    polygon([[-17,-17],[-9,-18],[-9,18],[-17,17]], dark, outline, 1.3);
    polygon([[9,-18],[17,-17],[17,18],[9,17]], dark, outline, 1.3);
    const tread = tank.moving ? Math.floor(tank.tread / 3) % 5 : 0;
    for (let ty = -14; ty < 17; ty += 5) { line([[-16,ty + tread],[-10,ty + tread]], outline, .8); line([[10,ty + tread],[16,ty + tread]], outline, .8); }
    polygon([[-9,-15],[10,-14],[10,15],[-10,14]], fill, outline, 1.5);
    line([[-7,-12],[7,-11]], '#f7f4db', 1.4);
    if (kind === 2 && !player) { line([[-7,12],[7,12]], outline, 2); line([[-6,-10],[7,-10]], outline, 2); }
    polygon([[-8,-5],[6,-7],[9,6],[-6,8]], tank.flash > 0 ? '#f6ead0' : dark, outline, 1.2);
    polygon([[-2,-3],[-2,-24],[3,-24],[3,-3]], fill, outline, 1.2);
    line([[-5,10],[4,10]], outline, .8);
    if (player) star(0, 4, 4, '#f8f4d9', '#f8f4d9');
    if (tank.carrier) { ctx.rotate(-dir * Math.PI / 2); polygon([[20,-23],[25,-18],[20,-13],[15,-18]], '#f6eed3', '#9f855b', 1.5); }
    if (!player && kind === 2) for (let i = 0; i < tank.hp; i++) { ctx.fillStyle = outline; ctx.fillRect(-5 + i * 4, 11, 2, 2); }
    ctx.restore();
  }
  function terrain() {
    ctx.fillStyle = '#edf0e2'; ctx.fillRect(0, 0, SIZE, SIZE);
    // Fine grid and stable graphite flecks; no animated texture shimmer.
    ctx.strokeStyle = '#a8b29322'; ctx.lineWidth = .6;
    for (let p = 0; p <= SIZE; p += 24) { ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, SIZE); ctx.moveTo(0, p); ctx.lineTo(SIZE, p); ctx.stroke(); }
    ctx.fillStyle = '#7482641a';
    for (let i = 0; i < 350; i++) { const x = (i * 179 + 13) % SIZE, y = (i * 83 + 17) % SIZE; ctx.fillRect(x, y, 1.1, .8); }
    for (const x of [24, 312, 600]) {
      line([[x - 9,8],[x,14],[x + 9,8]], '#96a28b88', 1); line([[x - 9,15],[x,21],[x + 9,15]], '#96a28b55', 1);
    }
    for (let gy = 0; gy < 26; gy++) for (let gx = 0; gx < 26; gx++) {
      const tile = game.grid[gy][gx]; if (!tile) continue;
      const x = gx * TILE, y = gy * TILE, wobble = (gx * 7 + gy * 3) % 3 / 3;
      if (tile === 1) {
        ctx.fillStyle = (gx + gy) % 3 ? '#d6bda1' : '#d1b69b'; ctx.fillRect(x + .6, y + .6, 22.8, 22.8);
        line([[x + 1,y + 1 + wobble],[x + 23,y + 1],[x + 23,y + 23],[x + 1,y + 23],[x + 1,y + 1]], '#a78c717a', .9);
        line([[x,y + 12],[x + 24,y + 11.5]], '#9e836f9c', 1);
        line([[x + 8,y + 1],[x + 8,y + 12]], '#9e836f9c', 1); line([[x + 17,y + 12],[x + 17,y + 23]], '#9e836f9c', 1);
        line([[x + 2,y + 3],[x + 6,y + 2]], '#f9efd57a'); line([[x + 11,y + 15],[x + 15,y + 14]], '#a58b6b55');
      } else if (tile === 2) {
        ctx.fillStyle = '#b9c4bb'; ctx.fillRect(x + 1,y + 1,22,22); ctx.strokeStyle = '#87988c'; ctx.lineWidth = 1; ctx.strokeRect(x + 1.5,y + 1.5,21,21);
        line([[x + 4,y + 19],[x + 19,y + 4]], '#899b8866'); line([[x + 9,y + 20],[x + 20,y + 9]], '#899b8855');
        ctx.fillStyle = '#6f8176'; ctx.fillRect(x + 4,y + 4,2,2); ctx.fillRect(x + 18,y + 18,2,2);
      } else {
        ctx.fillStyle = '#bed5d8'; ctx.fillRect(x,y,24,24);
        for (let sy = 5; sy < 24; sy += 8) { ctx.beginPath(); ctx.strokeStyle = '#89aeb370'; ctx.lineWidth = 1; ctx.moveTo(x, y + sy); ctx.quadraticCurveTo(x + 6,y + sy - 3,x + 12,y + sy); ctx.quadraticCurveTo(x + 18,y + sy + 3,x + 24,y + sy); ctx.stroke(); }
      }
    }
  }
  function forest() {
    for (const patch of game.forest) {
      ctx.fillStyle = '#9eaf7b45'; ctx.fillRect(patch.x,patch.y,48,48);
      for (let j = 0; j < 4; j++) {
        const x = patch.x + 12 + j % 2 * 24, y = patch.y + 8 + Math.floor(j / 2) * 24;
        polygon([[x,y - 5],[x - 10,y + 12],[x - 5,y + 12],[x - 11,y + 20],[x + 11,y + 20],[x + 5,y + 12],[x + 10,y + 12]], '#aebf9299', '#7e936370', .8);
        line([[x,y],[x,y + 23]], '#738a5b70', 1);
      }
    }
  }
  function home() {
    const { x, y, alive } = game.base;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#e7e8d7'; ctx.fillRect(-21,-21,42,42);
    if (alive) {
      polygon([[-15,-3],[0,-16],[15,-3],[12,-3],[12,16],[-12,16],[-12,-3]], '#ddd9b9', '#7b8667', 1.4);
      line([[-15,-1],[0,-14],[15,-1]], '#a4ad8b88', .7);
      polygon([[-4,16],[-4,5],[4,5],[4,16]], '#9aa783', '#798a68');
      line([[0,-16],[0,-27]], '#758162', 1.2); polygon([[1,-27],[14,-24],[1,-20]], '#b8c49c', '#758162', 1);
    } else {
      polygon([[-15,12],[-11,1],[-3,7],[4,-3],[15,10],[13,17],[-15,17]], '#beb5a1', '#978a73');
      line([[-9,-11],[9,7]], '#aa7865', 2); line([[9,-11],[-9,7]], '#aa7865', 2);
    }
    ctx.restore();
  }
  function render() {
    if (!canvas.width) return;
    ctx.setTransform(canvas.width / SIZE, 0, 0, canvas.height / SIZE, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; terrain(); home();
    for (const pickup of game.pickups) {
      if (pickup.life < 3 && Math.floor(game.time * 4) % 2 && !reduceMotion) continue;
      ctx.save(); ctx.translate(pickup.x,pickup.y); ctx.rotate(-.06);
      ctx.fillStyle = '#fff6d9'; ctx.fillRect(-17,-17,34,34); ctx.strokeStyle = '#a08d64'; ctx.lineWidth = 1.5; ctx.strokeRect(-17,-17,34,34);
      ctx.fillStyle = '#7b7953'; ctx.font = '26px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(symbols[pickup.type],0,1); ctx.restore();
    }
    for (const enemy of game.enemies) tank(enemy);
    if (game.player) tank(game.player);
    if (game.status === 'ready') {
      tank({ x: 24,y: 90,dir: 2,player: false,kind: 0,carrier: false }, true);
      tank({ x: 600,y: 145,dir: 2,player: false,kind: 2,carrier: true,hp: 3 }, true);
    }
    for (const bullet of game.bullets) {
      const [dx,dy] = SteelTide.DIRS[bullet.dir];
      line([[bullet.x - dx * 8,bullet.y - dy * 8],[bullet.x,bullet.y]], bullet.player ? '#8c9c6280' : '#b1846180', 3);
      ctx.fillStyle = bullet.player ? '#607447' : '#9f664b'; ctx.fillRect(bullet.x - 2.4,bullet.y - 2.4,4.8,4.8);
    }
    forest();
    for (const p of game.particles) {
      ctx.globalAlpha = Math.min(1,p.life * 3);
      ctx.fillStyle = { brick: '#b89973', steel: '#899c8a', enemy: '#b38763', player: '#93a472' }[p.color];
      ctx.fillRect(p.x - p.size / 2,p.y - p.size / 2,p.size,p.size);
    }
    ctx.globalAlpha = 1;
    if (game.freeze > 0) {
      ctx.strokeStyle = '#9cbec6'; ctx.lineWidth = 4; ctx.setLineDash([10,8]); ctx.strokeRect(3,3,SIZE - 6,SIZE - 6); ctx.setLineDash([]);
    }
  }
  function resize() {
    const space = $('arena-space').getBoundingClientRect(), size = Math.max(80,Math.floor(Math.min(space.width - 14,space.height - 14)));
    $('board').style.width = size + 'px'; $('board').style.height = size + 'px';
    const letterbox = Math.max(0,(space.height - size) / 2 - 7);
    for (const [selector,sign] of [['.map-topline',1],['.map-bottomline',-1]]) {
      const line = document.querySelector(selector); line.style.width = size + 'px'; line.style.marginInline = 'auto'; line.style.transform = `translateY(${letterbox * sign}px)`;
    }
    const pixels = Math.round(size * Math.min(window.devicePixelRatio || 1,2));
    if (canvas.width !== pixels || canvas.height !== pixels) { canvas.width = pixels; canvas.height = pixels; }
    render();
  }
  function processEvents() {
    for (const event of game.drainEvents()) {
      sound(event.type);
      if (event.type === 'power' || event.type === 'hit' && game.lives > 0) {
        toastKey = event.type === 'power' ? event.power : 'respawn'; toastTime = 2.8;
        setText('toast', (symbols[event.power] || '◇') + '  ' + t(toastKey)); $('toast').hidden = false;
      }
    }
  }
  function frame(time) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000,.05) : 0; lastTime = time;
    if (game.status === 'playing') {
      // Small fixed substeps keep tank collisions stable on slow screens.
      let remaining = dt; const controls = input();
      while (remaining > 0) { const step = Math.min(remaining,1 / 120); game.update(step,controls); remaining -= step; }
      if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) $('toast').hidden = true; }
      processEvents(); refresh(); render();
    }
    animation = requestAnimationFrame(frame);
  }
  function languageChanged() {
    document.title = t('title') + ' · Boopland'; previousStatus = ''; refresh(); refreshSound();
    $('supply-list').replaceChildren(...POWERS.map(power => {
      const row = document.createElement('div'), icon = document.createElement('i'), text = document.createElement('span');
      icon.textContent = symbols[power]; icon.setAttribute('aria-hidden','true'); text.textContent = t(power === 'star' ? 'starHelp' : power); row.append(icon,text); return row;
    }));
    if (toastTime > 0) setText('toast',(symbols[toastKey] || '◇') + '  ' + t(toastKey));
    requestAnimationFrame(resize);
  }
  $('primary').addEventListener('click',action);
  $('restart').addEventListener('click',() => { game.reset(); action(); });
  $('pause').addEventListener('click',togglePause);
  $('auto-fire').addEventListener('click',() => { autoFire = !autoFire; $('auto-fire').setAttribute('aria-pressed',String(autoFire)); wakeAudio(); });
  $('sound').addEventListener('click',() => { soundEnabled = !soundEnabled; if (soundEnabled) { wakeAudio(); sound('power'); } else audio?.suspend().catch(() => {}); refreshSound(); });
  $('help').addEventListener('click',() => {
    helpWasPlaying = game.status === 'playing'; if (helpWasPlaying) game.pause(); releaseInputs();
    $('help-dialog').showModal(); refresh(); render(); audio?.suspend().catch(() => {}); $('close-help').focus();
  });
  $('close-help').addEventListener('click',() => $('help-dialog').close());
  $('help-dialog').addEventListener('close',() => {
    if (helpWasPlaying && game.status === 'paused' && !document.hidden) { wakeAudio(); game.resume(); }
    helpWasPlaying = false; refresh(); render(); if (game.status === 'playing') canvas.focus({preventScroll:true}); else $('primary').focus({preventScroll:true});
  });
  const directionKeys = { ArrowUp:0, KeyW:0, ArrowRight:1, KeyD:1, ArrowDown:2, KeyS:2, ArrowLeft:3, KeyA:3 };
  window.addEventListener('keydown',event => {
    if ($('help-dialog').open || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Tab' && !$('overlay').hidden) {
      const focusables = [...$('briefing').querySelectorAll('button:not([hidden])')];
      if (event.shiftKey && document.activeElement === focusables[0]) { event.preventDefault(); focusables.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === focusables.at(-1)) { event.preventDefault(); focusables[0].focus(); }
      return;
    }
    if (event.code === 'KeyP' || event.code === 'Escape') { event.preventDefault(); if (!event.repeat) togglePause(); return; }
    if (game.status !== 'playing') return;
    if (Object.hasOwn(directionKeys,event.code) || ['Space','KeyJ'].includes(event.code)) {
      if (event.code === 'Space' && document.activeElement?.tagName === 'BUTTON') return;
      event.preventDefault(); wakeAudio();
      if (!keys.has(event.code)) keys.set(event.code,Object.hasOwn(directionKeys,event.code) ? directionKeys[event.code] : 'fire');
    }
  });
  window.addEventListener('keyup',event => keys.delete(event.code));
  for (const button of document.querySelectorAll('[data-dir],#fire-button')) {
    button.addEventListener('pointerdown',event => {
      if (event.button !== 0 || game.status !== 'playing') return;
      event.preventDefault(); wakeAudio(); button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId,button.dataset.dir !== undefined ? {dir:Number(button.dataset.dir),button} : {fire:true,button}); button.classList.add('active');
      // A quick tap must still register even if no animation frame occurs before release.
      if (game.player) {
        if (button.dataset.dir !== undefined) game.move(game.player,Number(button.dataset.dir),2);
        else game.fire(game.player);
      }
    });
    const release = event => { pointers.delete(event.pointerId); if (![...pointers.values()].some(p => p.button === button)) button.classList.remove('active'); };
    button.addEventListener('pointerup',release); button.addEventListener('pointercancel',release); button.addEventListener('lostpointercapture',release);
    button.addEventListener('click',event => {
      // Keyboard and assistive activations do not produce pointerdown events.
      if (event.detail !== 0 || game.status !== 'playing' || !game.player) return;
      wakeAudio();
      if (button.dataset.dir !== undefined) game.move(game.player,Number(button.dataset.dir),8);
      else game.fire(game.player);
    });
    button.addEventListener('contextmenu',event => event.preventDefault());
  }
  function suspend() { releaseInputs(); if (game.status === 'playing') { game.pause(); refresh(); render(); } audio?.suspend().catch(() => {}); }
  window.addEventListener('blur',suspend);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) { suspend(); cancelAnimationFrame(animation); animation = 0; }
    else { lastTime = 0; if (!animation) animation = requestAnimationFrame(frame); }
  });
  window.addEventListener('pagehide',() => { suspend(); cancelAnimationFrame(animation); animation = 0; });
  window.addEventListener('pageshow',() => { lastTime = 0; if (!animation && !document.hidden) animation = requestAnimationFrame(frame); });
  window.addEventListener('boopland:languagechange',languageChanged);
  new ResizeObserver(resize).observe($('arena-space'));
  window.addEventListener('resize',resize);
  languageChanged(); resize(); animation = requestAnimationFrame(frame);
})();
