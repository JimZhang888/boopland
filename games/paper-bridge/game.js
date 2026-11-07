(function () {
  'use strict';
  const E = window.PaperBridge, I = window.BooplandI18n, $ = id => document.getElementById(id);
  const t = (key, values) => I.t(`paperBridge.${key}`, values);
  const canvas = $('game'), scene = window.PaperBridgeScene.create(canvas, t), dialog = $('dialog');
  const storageKey = 'boopland-paper-bridge-v1';
  let saveData = { level: 0, designs: {}, stars: {}, best: {}, hint: true }, storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') {
      saveData.level = Number.isInteger(saved.level) && E.LEVELS[saved.level] ? saved.level : 0;
      saveData.hint = typeof saved.hint === 'boolean' ? saved.hint : true;
      E.LEVELS.forEach((level, i) => {
        saveData.designs[i] = E.sanitizeDesign(level, saved.designs?.[i]);
        saveData.stars[i] = Number.isInteger(saved.stars?.[i]) ? Math.max(0, Math.min(3, saved.stars[i])) : 0;
        if (Number.isFinite(saved.best?.[i]) && saved.best[i] >= 0) saveData.best[i] = saved.best[i];
      });
    }
  } catch { storageAvailable = false; }
  const clone = value => JSON.parse(JSON.stringify(value));
  const histories = E.LEVELS.map(() => []);
  let levelIndex = saveData.level, level = E.LEVELS[levelIndex], design = clone(saveData.designs[levelIndex] || []);
  let tool = 'road', selected = null, cursor = null, hoverEdge = -1, hint = saveData.hint;
  let simulation = null, speed = 1, press = null, toastTimer = null, toastMessage = null, dialogMode = null;
  let lastTime = 0, animation = 0, resultShown = false, uiTime = 0, keyboard = false;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches;
  motionQuery.addEventListener?.('change', e => { reduced = e.matches; });

  function persist() {
    saveData.level = levelIndex; saveData.designs[levelIndex] = clone(design); saveData.hint = hint;
    try { localStorage.setItem(storageKey, JSON.stringify(saveData)); }
    catch { storageAvailable = false; }
  }
  function remember() {
    histories[levelIndex].push(clone(design));
    if (histories[levelIndex].length > 80) histories[levelIndex].shift();
  }
  function toast(key, values) {
    clearTimeout(toastTimer); toastMessage = { key, values };
    $('toast').textContent = t(key, values); $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; toastMessage = null; }, 2600);
  }
  function setInstruction() {
    $('instruction').textContent = t(simulation ? 'testHint' : tool === 'erase' ? 'eraseHint' : selected ? 'drawEnd' : 'drawStart');
  }
  function sync() {
    const used = E.usage(design), testing = !!simulation;
    document.title = t('pageTitle');
    $('level-number').textContent = String(levelIndex + 1).padStart(2, '0');
    $('chapter').textContent = t('chapter', { n: levelIndex + 1 });
    $('level-name').textContent = t(`level${levelIndex}`);
    $('load-label').textContent = t('load', { value: level.mass });
    $('mode').textContent = t(testing ? simulation.status === 'running' ? 'testing' : 'finished' : 'building');
    $('spent').textContent = used.spent.toLocaleString(I.language);
    $('budget-total').textContent = ` / ${level.budget.toLocaleString(I.language)}`;
    $('budget-fill').style.width = `${used.spent / level.budget * 100}%`;
    $('budget-fill').style.background = used.spent > level.budget * .85 ? '#b39b67' : '#8c9b76';
    $('budget-note').textContent = t('budgetNote', { value: (level.budget - used.spent).toLocaleString(I.language) });
    document.querySelectorAll('[data-tool]').forEach(button => {
      const material = button.dataset.tool, remaining = level.limits[material] - used.counts[material];
      button.classList.toggle('selected', tool === material); button.setAttribute('aria-pressed', String(tool === material));
      button.disabled = testing; button.setAttribute('aria-label', t('remaining', { material: t(material), count: remaining }));
      $(`stock-${material}`).textContent = remaining;
      button.classList.toggle('empty', remaining === 0);
    });
    $('material-info').textContent = t(tool === 'erase' ? 'eraseHint' : `${tool}Info`);
    $('level-tip').textContent = t(`tip${levelIndex}`);
    $('undo').disabled = testing || !histories[levelIndex].length;
    $('clear').disabled = testing || !design.length;
    $('erase').disabled = testing;
    $('erase').setAttribute('aria-pressed', String(tool === 'erase'));
    $('hint').disabled = testing; $('hint').setAttribute('aria-pressed', String(hint));
    $('test').querySelector('span').textContent = t(testing ? 'edit' : 'test');
    $('test').querySelector('use').setAttribute('href', testing ? '#i-pencil' : '#i-play');
    $('running-controls').hidden = !testing || simulation.status !== 'running';
    $('test-hud').hidden = !testing;
    $('scene-note').hidden = testing || design.length > 3;
    $('paused-banner').hidden = !testing || !simulation.paused || simulation.status !== 'running';
    $('pause').setAttribute('aria-label', t(testing && simulation.paused ? 'resume' : 'pause'));
    $('pause').querySelector('use').setAttribute('href', testing && simulation.paused ? '#i-play' : '#i-pause');
    $('speed').textContent = `${speed}×`; $('speed').setAttribute('aria-pressed', String(speed > 1));
    setInstruction(); updateTestHud();
  }
  function updateTestHud() {
    if (!simulation) return;
    $('test-caption').textContent = t(simulation.paused ? 'paused' : simulation.status === 'running' ? 'crossing' : 'finished');
    $('car-progress').style.width = `${simulation.car.progress * 100}%`;
    $('stress-value').textContent = t('stress', { value: Math.round(simulation.maxStress * 100) });
    $('stress-value').style.color = simulation.maxStress > .85 ? '#a36751' : '';
  }
  function chooseTool(next) {
    if (simulation) return;
    if (next === 'rope' && level.limits.rope === 0) { toast('unavailable'); return; }
    tool = next; selected = null; hoverEdge = -1; sync();
  }
  function allowedPoint(p) { return p.x >= level.left && p.x <= level.right && p.y >= 80 && p.y <= 440 && !((p.x === level.left || p.x === level.right) && p.y > 320); }
  function pointAt(event) {
    const world = scene.toWorld(event.clientX, event.clientY);
    const point = E.snap(world);
    const candidates = E.anchors(level).concat(design.flatMap(e => [e.a, e.b]));
    let nearest = null, best = Math.min(20, 10 / scene.scale);
    for (const candidate of candidates) {
      const distance = E.distance(world, candidate);
      if (distance < best) { best = distance; nearest = candidate; }
    }
    return nearest ? { x: nearest.x, y: nearest.y } : point;
  }
  function distanceToEdge(p, e) {
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
    const u = Math.max(0, Math.min(1, ((p.x - e.a.x) * dx + (p.y - e.a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - e.a.x - u * dx, p.y - e.a.y - u * dy);
  }
  function edgeAt(world) {
    let nearest = -1, best = Math.min(24, Math.max(10, 9 / scene.scale));
    design.forEach((e, i) => { const distance = distanceToEdge(world, e); if (distance < best) { best = distance; nearest = i; } });
    return nearest;
  }
  function removeAt(world) {
    const index = edgeAt(world);
    if (index < 0) return;
    remember(); const refund = E.cost(design[index]); design.splice(index, 1);
    hoverEdge = -1; persist(); sync(); toast('memberRemoved', { cost: refund });
  }
  function join(a, b) {
    if (E.distance(a, b) < 1) { selected = null; setInstruction(); return; }
    const edge = { type: tool, a: { ...a }, b: { ...b } };
    const error = E.validate(level, design, edge);
    if (error) { toast(error === 'budget' ? 'overBudget' : ['invalid', 'short'].includes(error) ? 'bounds' : error); return; }
    remember(); design.push(edge); selected = null; persist(); sync();
    $('instruction').textContent = t('memberAdded', { material: t(tool), cost: E.cost(edge) });
  }
  function selectPoint(p) {
    if (tool === 'erase') { removeAt(p); return; }
    if (!allowedPoint(p)) { toast('bounds'); return; }
    if (selected) join(selected, p);
    else { selected = p; setInstruction(); }
  }
  function undo() {
    if (simulation || !histories[levelIndex].length) return;
    design = histories[levelIndex].pop(); selected = null; persist(); sync();
  }
  function startTest() {
    if (simulation) { returnToBuild(); return; }
    if (!E.connected(level, design)) { toast('checkRoad'); return; }
    selected = null; cursor = null; hoverEdge = -1; press = null; speed = 1; resultShown = false;
    persist(); simulation = E.createSimulation(level, design); lastTime = 0; sync();
  }
  function returnToBuild() {
    simulation = null; resultShown = false; selected = null; cursor = null; speed = 1;
    closeDialog(); sync();
  }
  function pause(force) {
    if (!simulation || simulation.status !== 'running') return;
    simulation.paused = force === undefined ? !simulation.paused : force;
    lastTime = 0; sync();
  }
  function loadLevel(index) {
    persist(); levelIndex = index; level = E.LEVELS[index]; design = clone(saveData.designs[index] || []);
    simulation = null; resultShown = false; selected = null; cursor = null; hoverEdge = -1; tool = 'road'; press = null;
    closeDialog(); $('toast').hidden = true; toastMessage = null; persist(); sync();
  }
  function create(tag, className, content) {
    const element = document.createElement(tag); if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }
  function action(label, callback, primary = false) {
    const button = create('button', primary ? 'primary' : 'secondary', label); button.type = 'button'; button.addEventListener('click', callback); return button;
  }
  function title(content, className) { const h = create('h2', className, content); h.id = 'dialog-title'; return h; }
  function openDialog(mode) {
    dialogMode = mode;
    if (simulation?.status === 'running') pause(true);
    renderDialog(); if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { if (dialog.open) dialog.close(); dialogMode = null; }
  function renderDialog() {
    const content = $('dialog-content'); content.replaceChildren();
    if (dialogMode === 'help') {
      content.append(title(t('helpTitle')));
      const steps = create('div', 'help-steps');
      ['Build','Support','Test'].forEach((name,i) => {
        const row = create('div','help-step'), copy = create('p');
        copy.append(create('b','',t(`help${name}`)),document.createTextNode(t(`help${name}Text`)));
        row.append(create('span','',`0${i+1}`),copy);steps.append(row);
      });
      content.append(steps,create('p','help-foot',t('helpKeys')),create('p','star-rules',t('starRules')));
      const actions=create('div','dialog-actions');actions.append(action(t('gotIt'),closeDialog,true));content.append(actions);
    } else if (dialogMode === 'levels') {
      content.append(title(t('levels')),create('p','',t('totalStars',{value:Object.values(saveData.stars).reduce((a,b)=>a+b,0)})));
      const grid=create('div','level-grid');
      E.LEVELS.forEach((_,i)=>{
        const button=create('button',`level-card${i===levelIndex?' current':''}`);
        button.append(create('span','',String(i+1).padStart(2,'0')),create('strong','',t(`level${i}`)),create('small','','★'.repeat(saveData.stars[i]||0)+'☆'.repeat(3-(saveData.stars[i]||0))));
        button.addEventListener('click',()=>loadLevel(i));grid.append(button);
      });
      content.append(grid,create('p','help-foot',t(storageAvailable?'saveNote':'noStorage')));
    } else if (dialogMode === 'clear') {
      content.append(title(t('clearTitle')),create('p','',t('clearText')));
      const actions=create('div','dialog-actions');
      actions.append(action(t('cancel'),closeDialog),action(t('clear'),()=>{remember();design=[];selected=null;persist();closeDialog();sync();},true));content.append(actions);
    } else if (dialogMode === 'result' && simulation) {
      const won=simulation.status==='won', stars=E.stars(level,design,simulation);
      content.append(create('div',`result-art${won?'':' result-fail'}`,won?'★'.repeat(stars)+'☆'.repeat(3-stars):'⌁'),title(t(won?'won':'lost'),'result-title'));
      content.append(create('p','result-message',t(won?levelIndex===E.LEVELS.length-1?'allDone':'wonText':simulation.reason)));
      const stats=create('div','result-stat');
      for(const [label,value] of [['spent',E.usage(design).spent],['breakCount',simulation.broken]]) {
        const stat=create('span');stat.append(document.createTextNode(`${t(label)}  `),create('b','',String(value)));stats.append(stat);
      }
      content.append(stats,create('p','star-rules',t('starRules')));
      const actions=create('div','dialog-actions');
      actions.append(action(t(won?'improve':'edit'),returnToBuild,!won));
      if(won) actions.append(action(t(levelIndex<E.LEVELS.length-1?'next':'levels'),()=>levelIndex<E.LEVELS.length-1?loadLevel(levelIndex+1):openDialog('levels'),true));
      content.append(actions);
    }
  }
  function complete() {
    if(resultShown||!simulation)return;resultShown=true;
    if(simulation.status==='won') {
      saveData.stars[levelIndex]=Math.max(saveData.stars[levelIndex]||0,E.stars(level,design,simulation));
      saveData.best[levelIndex]=Math.min(saveData.best[levelIndex]??Infinity,E.usage(design).spent);persist();
    }
    sync();openDialog('result');
  }
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||simulation||press)return;
    event.preventDefault();canvas.focus({preventScroll:true});keyboard=false;
    cursor=pointAt(event);press={id:event.pointerId,p:{...cursor},x:event.clientX,y:event.clientY,dragged:false,hadSelection:!!selected};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(simulation)return;
    cursor=pointAt(event);keyboard=false;
    if(tool==='erase')hoverEdge=edgeAt(scene.toWorld(event.clientX,event.clientY));
    if(press&&press.id===event.pointerId&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>7){
      press.dragged=true;
      if(!press.hadSelection&&tool!=='erase'&&allowedPoint(press.p))selected=press.p;
    }
  });
  canvas.addEventListener('pointerup',event=>{
    if(!press||press.id!==event.pointerId)return;
    const gesture=press;press=null;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(simulation)return;
    cursor=pointAt(event);
    if(tool==='erase')removeAt(scene.toWorld(event.clientX,event.clientY));
    else if(gesture.dragged&&!gesture.hadSelection){if(allowedPoint(gesture.p))join(gesture.p,cursor);else toast('bounds');}
    else selectPoint(cursor);
  });
  function cancelPointer(){if(press){press=null;selected=null;setInstruction();}}
  canvas.addEventListener('pointercancel',cancelPointer);
  canvas.addEventListener('lostpointercapture',cancelPointer);
  canvas.addEventListener('pointerleave',()=>{if(!press){cursor=null;hoverEdge=-1;}});
  canvas.addEventListener('contextmenu',event=>{event.preventDefault();selected=null;press=null;setInstruction();});
  document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>chooseTool(button.dataset.tool)));
  $('erase').addEventListener('click',()=>chooseTool(tool==='erase'?'road':'erase'));
  $('undo').addEventListener('click',undo);
  $('clear').addEventListener('click',()=>{if(design.length&&!simulation)openDialog('clear');});
  $('hint').addEventListener('click',()=>{hint=!hint;persist();sync();});
  $('test').addEventListener('click',startTest);
  $('pause').addEventListener('click',()=>pause());$('resume').addEventListener('click',()=>pause(false));
  $('speed').addEventListener('click',()=>{speed=speed===1?2:1;sync();});
  $('levels').addEventListener('click',()=>openDialog('levels'));
  $('help').addEventListener('click',()=>openDialog('help'));
  $('close-dialog').addEventListener('click',closeDialog);
  dialog.addEventListener('close',()=>{dialogMode=null;});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
  window.addEventListener('keydown',event=>{
    if(dialog.open||event.altKey||event.repeat)return;
    const interactive=event.target.closest('button,a,input,select,textarea');
    if(event.key==='Escape') {event.preventDefault();if(selected){selected=null;press=null;setInstruction();}else if(simulation)pause();return;}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();return;}
    if(event.ctrlKey||event.metaKey)return;
    if(event.code==='Space'&&!interactive){event.preventDefault();if(simulation?.status==='running')pause();else if(simulation)returnToBuild();else startTest();return;}
    if(simulation)return;
    const key=event.key.toLowerCase();
    if(['1','2','3'].includes(key)){event.preventDefault();chooseTool(['road','wood','rope'][Number(key)-1]);return;}
    if(key==='x'){event.preventDefault();chooseTool(tool==='erase'?'road':'erase');return;}
    if(!interactive&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Backspace','Delete'].includes(event.key)){
      event.preventDefault();keyboard=true;if(!cursor)cursor={x:level.left,y:E.DECK};
      if(event.key==='Enter')selectPoint(cursor);
      else if(event.key==='Backspace'||event.key==='Delete')removeAt(cursor);
      else {
        cursor={x:Math.max(level.left,Math.min(level.right,cursor.x+(event.key==='ArrowLeft'?-40:event.key==='ArrowRight'?40:0))),y:Math.max(80,Math.min(440,cursor.y+(event.key==='ArrowUp'?-40:event.key==='ArrowDown'?40:0)))};
        $('instruction').textContent=t('cursor',{x:(cursor.x-level.left)/40,y:(E.DECK-cursor.y)/40})+' · '+t(selected?'drawEnd':'drawStart');
      }
    }
  });
  window.addEventListener('blur',()=>{cancelPointer();pause(true);});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelPointer();pause(true);cancelAnimationFrame(animation);animation=0;persist();}
    else {lastTime=0;if(!animation)animation=requestAnimationFrame(frame);}
  });
  window.addEventListener('pagehide',()=>{persist();cancelAnimationFrame(animation);animation=0;});
  window.addEventListener('pageshow',()=>{lastTime=0;if(!animation&&!document.hidden)animation=requestAnimationFrame(frame);});
  window.addEventListener('boopland:languagechange',()=>{sync();if(dialogMode)renderDialog();if(toastMessage)$('toast').textContent=t(toastMessage.key,toastMessage.values);});
  function frame(now){
    const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
    if(simulation?.status==='running'&&!simulation.paused){
      E.advance(simulation,dt*speed);uiTime+=dt;
      if(uiTime>.08){updateTestHud();uiTime=0;}
      if(simulation.status!=='running')complete();
    }
    scene.draw({level,design,simulation,selected,cursor,hint,tool,hoverEdge,time:now/1000,reduced,keyboard});
    animation=document.hidden?0:requestAnimationFrame(frame);
  }
  sync();animation=requestAnimationFrame(frame);
})();
