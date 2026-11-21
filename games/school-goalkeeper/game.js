(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('school-goalkeeper.' + key, values);
  const arrows = ['↖','↑','↗','↙','↓','↘'];
  const letters = ['q','w','e','a','s','d'];
  const marks = {save:'✓',tip:'≈',miss:'×'};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FLIGHT = 500;
  const OPEN = -260, CLOSE = 145, GRAZE = 130;
  let kicks, records, state, elapsed, dive, outcome, lastFrame, frame, vertical;
  let lastCopy = '';
  const zones = [];
  const shot = () => kicks[Math.min(records.length, kicks.length - 1)];
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const smooth = n => n * n * (3 - 2 * n);
  const position = zone => ({x: [143, 320, 496][zone % 3], y: zone < 3 ? 99 : 210});

  function makeKicks() {
    const order = [];
    while (order.length < 10) {
      const bag = [0,1,2,3,4,5];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag[0] === order[order.length - 1]) [bag[0],bag[1]] = [bag[1],bag[0]];
      order.push(...bag);
    }
    return order.slice(0,10).map((zone, i) => ({
      zone,
      strike: i === 0 ? 2750 : [2110,2390,2670][Math.floor(Math.random() * 3)]
    }));
  }

  function verdict(kick, chosen) {
    if (!chosen) return {type:'miss',reason:'stood'};
    if (chosen.zone !== kick.zone) return {type:'miss',reason:'wrong'};
    const offset = chosen.time - kick.strike;
    if (offset >= OPEN && offset <= CLOSE) return {type:'save'};
    const reason = offset < OPEN ? 'early' : 'late';
    const close = offset >= OPEN - GRAZE && offset <= CLOSE + GRAZE;
    return {type:close ? 'tip' : 'miss',reason};
  }

  function newMatch() {
    stopFrame();
    kicks = makeKicks();
    records = [];
    state = 'ready';
    elapsed = 0;
    dive = outcome = vertical = null;
    paint();
  }

  function startShot() {
    if (state === 'live') return;
    if (records.length === 10) newMatch();
    state = 'live';
    elapsed = 0;
    dive = outcome = vertical = null;
    paint();
    resume();
  }

  function choose(zone) {
    if (state !== 'live' || dive || $('dialog').open || document.hidden) return;
    dive = {zone,time:elapsed};
    vertical = null;
    paint();
  }

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = lastFrame = null;
    vertical = null;
  }
  function resume() {
    if (state !== 'live' || frame != null || document.hidden || $('dialog').open) return;
    lastFrame = null;
    frame = requestAnimationFrame(tick);
  }
  function tick(stamp) {
    frame = null;
    if (document.hidden || $('dialog').open || state !== 'live') return;
    if (lastFrame !== null) elapsed += Math.min(100, Math.max(0, stamp - lastFrame));
    lastFrame = stamp;
    const kick = shot();
    if (elapsed >= kick.strike + FLIGHT) {
      elapsed = kick.strike + FLIGHT;
      outcome = {...verdict(kick,dive), kick};
      records.push(outcome);
      state = 'review';
      vertical = null;
      paint();
      return;
    }
    paint();
    frame = requestAnimationFrame(tick);
  }

  function drawShooter(kick) {
    const runEnd = kick.strike - 850;
    const run = clamp(elapsed / runEnd);
    const plant = clamp((elapsed - runEnd) / 220);
    const swing = clamp((elapsed - kick.strike + 110) / 230);
    const stride = reducedMotion.matches ? 0 : Math.sin(run * Math.PI * 6) * (1 - plant);
    const side = kick.zone % 3 - 1;
    const high = kick.zone < 3;
    const x = 245 + 62 * smooth(run);
    const y = 331 - 25 * run - 2 * Math.abs(stride);
    $('shooter').setAttribute('transform','translate(' + x + ' ' + y + ')');
    $('chest').setAttribute('transform','rotate(' + (side * plant * 10 - stride * 4) + ' 0 4)');
    const toeX = -7 + side * plant * 11;
    $('plant-leg').setAttribute('d','M-8 6 -8 15 ' + (-7 - 7*stride) + ' 21');
    $('boot').setAttribute('d','M' + (-7 - 7*stride) + ' 21l' + (toeX + 7 + (side === 0 ? 0 : side*3)) + ' ' + (side === 0 ? -5 : 1));
    const ankleX = 12 + stride * 10 + plant * (1 - swing) * (side * 8 + 9) - 6 * swing;
    const ankleY = 19 - plant * (high ? 29 : 10) * (1 - swing) - swing * 20;
    $('swing-leg').setAttribute('d','M7 6 14 14 ' + ankleX + ' ' + ankleY);
  }

  function drawPitch(kick) {
    const target = position(kick.zone);
    const flying = clamp((elapsed - kick.strike) / FLIGHT);
    const flight = smooth(flying);
    let ballX = 320 + (target.x - 320) * flight;
    let ballY = 326 + (target.y - 326) * flight - Math.sin(Math.PI * flying) * (kick.zone < 3 ? 32 : 14);
    const result = outcome || verdict(kick, dive);
    if (result.type === 'tip') {
      const deflection = smooth(clamp((flying - .80) / .20));
      ballX += (kick.zone % 3 === 2 ? -22 : 22) * deflection;
      ballY -= 7 * deflection;
    }
    const spin = reducedMotion.matches ? 0 : flying * 300;
    $('ball').setAttribute('transform','translate(' + ballX + ' ' + ballY + ') scale(' + (1 - flight * .24) + ') rotate(' + spin + ')');
    drawShooter(kick);
    let keeperX = 320, keeperY = 199, angle = 0;
    if (dive) {
      const dest = position(dive.zone);
      const age = elapsed - dive.time;
      const reach = smooth(clamp(age / 300));
      const drop = result.type === 'miss' ? smooth(clamp((age - 570) / 300)) : 0;
      const direction = dive.zone % 3 - 1;
      const lean = direction * (dive.zone < 3 ? 49 : 69);
      const radians = lean * Math.PI / 180;
      // Anchor the outstretched glove, in the keeper drawing's coordinates, to the ball.
      const handX = (direction || 1) * 30, handY = -27;
      const gloveX = Math.cos(radians) * handX - Math.sin(radians) * handY;
      const gloveY = Math.sin(radians) * handX + Math.cos(radians) * handY;
      angle = lean * reach;
      keeperX += (dest.x - gloveX - 320) * reach;
      keeperY += (dest.y - gloveY - 199) * reach;
      keeperY += (218 - keeperY) * drop;
    }
    $('keeper').setAttribute('transform','translate(' + keeperX + ' ' + keeperY + ') rotate(' + angle + ')');
    $('keeper-shadow').style.visibility = dive ? 'hidden' : 'visible';
  }

  function copy(kick) {
    if (state === 'ready') return ['ready','intro','◎','start'];
    if (state === 'review') {
      const target = t('z' + kick.zone);
      const details = [outcome.reason && t(outcome.reason),target].filter(Boolean).join(' · ');
      if (records.length === 10) {
        const saves = records.filter(item => item.type === 'save').length;
        return [t('done',{s:saves}),t(outcome.type) + ' · ' + details,marks[outcome.type],'again',true];
      }
      return [t(outcome.type),details,marks[outcome.type],'next',true];
    }
    if (dive) return [t('diving'),t('z' + dive.zone),arrows[dive.zone],'pick',true];
    if (elapsed < kick.strike - 850) return ['run','watch','…','pick'];
    return [t(elapsed < kick.strike ? 'aim' : 'flight'),t('z' + kick.zone),arrows[kick.zone],'pick',true];
  }

  function paint() {
    const kick = outcome ? outcome.kick : shot();
    drawPitch(kick);
    const end = kick.strike + FLIGHT;
    $('needle').style.left = (elapsed / end * 100) + '%';
    $('window').style.left = ((kick.strike + OPEN) / end * 100) + '%';
    $('window').style.width = ((CLOSE - OPEN) / end * 100) + '%';
    const words = copy(kick);
    const fingerprint = JSON.stringify([words,BooplandI18n.language,state,records.length,dive?.zone]);
    if (fingerprint === lastCopy) return;
    lastCopy = fingerprint;
    $('phase').textContent = words[4] ? words[0] : t(words[0]);
    $('message').textContent = words[4] ? words[1] : t(words[1]);
    $('arrow').textContent = words[2];
    $('action').textContent = t(words[3]);
    $('action').disabled = state === 'live';
    $('action').hidden = state === 'live';
    $('play-hint').hidden = state !== 'live';
    $('play-hint').style.visibility = dive ? 'hidden' : 'visible';
    const number = Math.min(10,records.length + (state === 'review' ? 0 : 1));
    $('counter').textContent = number + ' / 10';
    zones.forEach((zone,i) => {
      zone.setAttribute('aria-label', t('z'+i) + ' (' + letters[i].toUpperCase() + ')');
      zone.setAttribute('aria-disabled',String(state !== 'live' || !!dive));
      zone.setAttribute('tabindex',state === 'live' && !dive ? '0' : '-1');
      zone.classList.toggle('selected',dive?.zone === i);
      zone.classList.toggle('target-result',!!outcome && i === kick.zone);
      zone.classList.toggle('good-result',outcome?.type === 'save' && i === kick.zone);
    });
    $('history').replaceChildren(...Array.from({length:10},(_,i) => {
      const span = document.createElement('span');
      const result = records[i]?.type;
      const label = String(i + 1) + (result ? ' · ' + t(result) : '');
      span.className = 'shot ' + (result || (i + 1 === number ? 'playing' : ''));
      span.textContent = result ? marks[result] : i + 1;
      span.setAttribute('aria-label',label);
      span.title = label;
      return span;
    }));
  }

  for (let i = 0; i < 6; i++) {
    const zone = document.createElementNS('http://www.w3.org/2000/svg','rect');
    for (const [name,value] of Object.entries({x:66 + (i%3)*169,y:i<3 ? 63 : 147,width:169,height:85,class:'zone',role:'button'}))
      zone.setAttribute(name,value);
    zone.addEventListener('click',() => choose(i));
    zone.addEventListener('keydown',event => {
      if (['Enter',' '].includes(event.key)) { event.preventDefault(); choose(i); }
    });
    $('targets').append(zone);
    zones.push(zone);
  }
  document.addEventListener('keydown',event => {
    if (state !== 'live' || $('dialog').open || event.altKey || event.metaKey || event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (letters.includes(key) || key.startsWith('arrow')) {
      event.preventDefault();
      if (dive || event.repeat) return;
      if (letters.includes(key)) choose(letters.indexOf(key));
      else if (key === 'arrowup' || key === 'arrowdown') vertical = key;
      else if (key === 'arrowleft' || key === 'arrowright') choose((vertical === 'arrowup' ? 0 : 3) + (key === 'arrowright' ? 2 : 0));
    }
  });
  document.addEventListener('keyup',event => {
    if (vertical && event.key.toLowerCase() === vertical) {
      const zone = vertical === 'arrowup' ? 1 : 4;
      vertical = null;
      choose(zone);
    }
  });
  $('action').addEventListener('click', startShot);
  $('help').addEventListener('click', () => { stopFrame(); $('dialog').showModal(); });
  $('dialog').addEventListener('close',resume);
  document.addEventListener('visibilitychange',() => document.hidden ? stopFrame() : resume());
  window.addEventListener('pagehide',stopFrame);
  window.addEventListener('pageshow',resume);
  window.addEventListener('blur',() => { vertical = null; });
  window.addEventListener('boopland:languagechange',paint);
  newMatch();
})();
