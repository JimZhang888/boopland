(() => {
  'use strict';
  const E = window.ClockworkTown, A = window.ClockworkArt, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('clockwork.' + key, values);
  const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const storageKey = 'boopland-clockwork-town-v1', rooms = ['yard', 'workshop', 'tower'];
  // Trim only decorative sky/outer paper; every interactive object stays visible.
  const sceneBounds = {yard:[60,100,880,480],workshop:[65,80,870,490],tower:[40,35,920,545]};
  const dialog = $('dialog'), content = $('dialog-content');
  let state = E.fresh(), statusKey = 'arrive_yard', modal = '', returnFocus = null;
  let soundEnabled = false, audio = null, saved = true, robotX = 395;
  try { state = E.restore(localStorage.getItem(storageKey)); } catch { saved = false; }
  statusKey = state.flags.won ? 'townAwake' : 'arrive_' + state.room;
  robotX = {yard:395,workshop:551,tower:430}[state.room];

  function save() {
    try { localStorage.setItem(storageKey, E.serialize(state)); saved = true; }
    catch { saved = false; }
    $('save-status').removeAttribute('data-i18n');
    $('save-status').textContent = t(saved ? 'saved' : 'saveFailed');
  }
  function playSound(kind) {
    if (!soundEnabled || document.hidden) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio ||= new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const notes = kind === 'win' ? [392,494,587,784] : kind === 'success' ? [330,440,554] : kind === 'pick' ? [440,660] : [260];
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + index * .11;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.035, start + .012); gain.gain.exponentialRampToValueAtTime(.0001, start + .32);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + .34);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* Audio is optional, including browsers with autoplay restrictions. */ }
  }
  function milestones() {
    return ['stepGate','stepPower','stepLight'].map((key, index) => `<li class="${index < E.progress(state) ? 'done' : ''}"><span class="mark" aria-hidden="true">${index < E.progress(state) ? '✓' : String(index+1).padStart(2,'0')}</span><span>${esc(t(key))}</span></li>`).join('');
  }
  function objective() {
    const stage = E.stage(state);
    return t(stage === 'fit' ? 'h_fit2' : stage === 'lock' ? 'lockPrompt' : ['goalGate','goalPower','goalLight','goalDone'][E.progress(state)]);
  }
  function sizeScene() {
    const bounds = $('stage').getBoundingClientRect(), frame = $('scene-frame');
    const [, , sceneWidth, sceneHeight] = sceneBounds[state.room];
    const width = Math.max(0, Math.min(bounds.width, bounds.height * sceneWidth / sceneHeight));
    frame.style.width = width + 'px'; frame.style.height = width * sceneHeight / sceneWidth + 'px';
  }
  function walkingX(x) {
    const [left,,width] = sceneBounds[state.room];
    return Math.max(left + 65, Math.min(left + width - 65, x));
  }
  function renderScene(oldX) {
    const [originX,originY,sceneWidth,sceneHeight] = sceneBounds[state.room];
    $('scene').setAttribute('viewBox',sceneBounds[state.room].join(' '));
    $('scene-frame').style.aspectRatio = `${sceneWidth} / ${sceneHeight}`;
    $('scene').innerHTML = A.scene(state, robotX);
    if (Number.isFinite(oldX) && oldX !== robotX && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const robot = $('scene').querySelector('.scene-robot');
      robot.animate([{transform:`translate(${oldX}px, 478px)`},{transform:`translate(${robotX}px, 478px)`}],{duration:550,easing:'ease-in-out'});
    }
    $('hotspots').replaceChildren();
    A.spots[state.room].forEach(([id,x,y,w,h]) => {
      if (['cord','magnet','oil'].includes(id) && state.flags[id]) return;
      const button = document.createElement('button');
      button.className = 'hotspot'; button.type = 'button'; button.dataset.object = id;
      button.setAttribute('aria-label', t(id)); button.setAttribute('title', t(id));
      button.style.cssText = `left:${(x-originX)/sceneWidth*100}%;top:${(y-originY)/sceneHeight*100}%;--w:${w/sceneWidth*100}%;--h:${h/sceneHeight*100}%`;
      $('hotspots').append(button);
    });
    $('scene-frame').classList.toggle('using-item', !!state.selected);
    $('object-label').classList.remove('visible');
    sizeScene();
  }
  function renderInventory() {
    const active = document.activeElement?.dataset.item;
    $('inventory').replaceChildren();
    for (let index = 0; index < 6; index++) {
      const item = state.items[index], slot = document.createElement(item ? 'button' : 'div');
      slot.className = 'item-slot' + (item ? ' occupied' : '') + (state.selected === item ? ' selected' : '');
      if (item) {
        slot.type = 'button'; slot.dataset.item = item;
        slot.setAttribute('aria-pressed', String(state.selected === item)); slot.setAttribute('aria-label', t(item));
        slot.innerHTML = `<span class="slot-number" aria-hidden="true">${state.selected===item?esc(t('itemSelected')):index + 1}</span>${A.icon(item)}<span>${esc(t(item))}</span>`;
      } else { slot.innerHTML = `<span class="slot-number" aria-hidden="true">${index + 1}</span>`; slot.setAttribute('aria-label', t('emptySlot', {index:index+1})); }
      $('inventory').append(slot);
    }
    if (active) $('inventory').querySelector(`[data-item="${active}"]`)?.focus({preventScroll:true});
    $('inventory-instruction').textContent = state.selected ? t('selectedTip', {item:t(state.selected)}) : t('inventoryTip');
    document.querySelector('.inventory-bar').dataset.selected = String(!!state.selected);
  }
  function render(oldX) {
    const index = rooms.indexOf(state.room);
    $('chapter').textContent = t('chapter',{number:String(index+1).padStart(2,'0')});
    $('room-title').textContent = t(state.room);
    $('room-number').textContent = `${String(index+1).padStart(2,'0')} — 03`;
    $('objective').textContent = objective();
    $('milestones').innerHTML = milestones();
    $('clue-note').hidden = !state.flags.clue;
    $('status').textContent = t(statusKey,{item:state.selected?t(state.selected):''});
    $('previous-room').disabled = index === 0;
    $('previous-room').style.visibility = index === 0 ? 'hidden' : '';
    $('previous-label').textContent = index ? t(rooms[index-1]) : '';
    $('next-room').disabled = index === 2;
    $('next-room').style.visibility = index === 2 ? 'hidden' : '';
    $('next-label').textContent = index < 2 ? t(rooms[index+1]) : '';
    $('posture').setAttribute('aria-pressed',String(state.tall));
    $('posture').disabled = !!state.flags.won;
    $('posture-label').textContent = t(state.tall?'shrink':'stretch');
    $('sound').setAttribute('aria-label',t(soundEnabled?'soundOn':'soundOff'));
    $('sound').setAttribute('title',t(soundEnabled?'soundOn':'soundOff'));
    $('sound').setAttribute('aria-pressed',String(soundEnabled));
    $('sound').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z${soundEnabled?'M16 8q5 4 0 8M19 5q8 7 0 14':'M16 9l5 6m0-6-5 6'}"/></svg>`;
    $('save-status').textContent = t(saved?'saved':'saveFailed');
    renderScene(oldX); renderInventory();
  }
  const paragraph = key => `<p class="dialog-copy">${esc(t(key))}</p>`;
  const actionButton = (id,key,primary=true) => `<button type="button" data-dialog-action="${id}" class="${primary?'primary':'secondary'}">${esc(t(key))}</button>`;
  const continueButton = () => `<div class="dialog-actions">${actionButton('close','continue')}</div>`;
  function pipeSvg(mask) {
    const ends = [[1,50,0],[2,100,50],[4,50,100],[8,0,50]], d = ends.filter(([bit])=>mask&bit).map(([,x,y])=>`M50 50L${x} ${y}`).join(' ');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" fill="none" stroke="#7e9270" stroke-width="23" stroke-linecap="butt"/><path d="${d}" fill="none" stroke="#c7d6b7" stroke-width="15" stroke-linecap="butt"/><circle cx="50" cy="50" r="5" fill="#a3b690" stroke="#7e9270" stroke-width="1"/></svg>`;
  }
  function mirrorSvg(chart=false) {
    const mirrorValues = chart ? [0,0,1] : state.mirrors;
    const path = E.lightPath(mirrorValues).points.map((p,index)=>`${index?'L':'M'}${p.join(' ')}`).join(' ');
    return `<svg viewBox="0 0 440 330" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round"><path d="M8 220h30m-9-7 9 7-9 7" fill="none" stroke="#8c9d74" stroke-width="3"/><rect x="26" y="204" width="22" height="32" rx="4" fill="#a9b99a" stroke="#829571"/><path d="${path}" stroke="#b79d62" stroke-width="7" fill="none" opacity=".18"/><path d="${path}" stroke="#c5a663" stroke-width="3" fill="none"/>${[[160,220],[160,100],[360,100]].map(([x,y],index)=>`<circle cx="${x}" cy="${y}" r="29" fill="#e0e8d7" stroke="#b2c2a5" stroke-dasharray="2 4"/><path d="${mirrorValues[index]===0?`M${x-16} ${y+16}l32-32`:`M${x-16} ${y-16}l32 32`}" stroke="#e8f1ea" stroke-width="10"/><path d="${mirrorValues[index]===0?`M${x-16} ${y+16}l32-32`:`M${x-16} ${y-16}l32 32`}" stroke="#8baba0" stroke-width="4"/>`).join('')}<circle cx="360" cy="282" r="27" fill="${E.lightPath(mirrorValues).solved?'#e5d49c':'#dae4d2'}" stroke="#95aa84" stroke-width="3"/><circle cx="360" cy="282" r="20" fill="none" stroke="#f7f4dc" stroke-width="2"/><path d="M333 315h54" stroke="#afbb9d" stroke-width="5"/></g></svg>`;
  }
  function renderDialog() {
    const focus = document.activeElement?.dataset;
    const focusKey = focus?.puzzle ? [focus.puzzle,focus.index] : null;
    const focusAction = focus?.dialogAction;
    const titleKeys = {help:'help',reset:'resetTitle',clue:'mural',chart:'chart',gate:'gate',lock:'lockTitle',pipes:'pipes',mirrors:'beacon',hint:'hint',win:'winTitle',notebook:'notebook',gateDone:'stepGate',powerDone:'stepPower',drain:'drain',gearFound:'gearFound'};
    $('dialog-title').textContent = t(titleKeys[modal] || 'notebook');
    $('dialog-kicker').textContent = t('name');
    dialog.dataset.mode = modal;
    let html = '';
    if (modal === 'help') html = `<ol class="help-steps">${[1,2,3,4].map(n=>`<li>${esc(t('help'+n))}</li>`).join('')}</ol>`+continueButton();
    if (modal === 'reset') html = paragraph('resetCopy')+`<div class="dialog-actions">${actionButton('close','cancel',false)}${actionButton('reset','restart')}</div>`;
    if (modal === 'clue') html = paragraph('clueCopy')+'<div class="clue-art" aria-label="Ⅱ · Ⅳ · Ⅰ"><span>Ⅱ</span><span>Ⅳ</span><span>Ⅰ</span></div>'+continueButton();
    if (modal === 'chart') html = paragraph('chartFound')+`<div class="mirror-board">${mirrorSvg(true)}</div>`+continueButton();
    if (modal === 'drain') {
      const hasLine=state.items.includes('hook'), hasMagnet=state.items.includes('magnet'), hasCord=state.items.includes('cord');
      const detail=hasLine?'lineReady':hasMagnet&&hasCord?'tieLine':hasMagnet?'magnetTooShort':hasCord?'cordNeedsMagnet':'deepDrain';
      html=A.drainSketch()+paragraph(detail);
      if(hasLine) html+=`<div class="drain-tool">${A.icon('hook')}<span>${esc(t('hook'))}</span><span class="tool-ready" aria-hidden="true">✓</span></div><div class="dialog-actions">${actionButton('fish','fishGear')}${actionButton('close','close',false)}</div>`;
      else if(hasMagnet&&hasCord) html+=`<div class="combine-recipe"><span>${A.icon('magnet')}${esc(t('magnet'))}</span><b aria-hidden="true">+</b><span>${A.icon('cord')}${esc(t('cord'))}</span></div><div class="dialog-actions">${actionButton('tieLine','makeLine')}${actionButton('close','close',false)}</div>`;
      else html+=`<div class="dialog-actions">${actionButton('close','keepLooking')}${actionButton('hint','hint',false)}</div>`;
    }
    if (modal === 'gearFound') html=`<div class="pickup-art">${A.icon('gear')}<span class="pickup-check" aria-hidden="true">✓</span></div>`+paragraph('gearInPocket')+`<div class="dialog-actions">${actionButton('fitGear','goToGate')}${actionButton('close','close',false)}</div>`;
    if (modal === 'gate') {
      const hasGear = state.items.includes('gear');
      html = `<div class="hint-illustration">${A.icon('gear')}</div>`+paragraph(hasGear?'gearReady':'gateNeedsGear')+`<div class="dialog-actions">${hasGear?actionButton('fitGear','fitGear'):actionButton('close','keepLooking')}${hasGear?actionButton('close','close',false):actionButton('hint','hint',false)}</div>`;
    }
    if (modal === 'lock') html = paragraph('lockPrompt')+`<div class="lock-dials">${state.dials.map((value,index)=>`<button type="button" class="dial" data-puzzle="dial" data-index="${index}" aria-label="${esc(t('dialLabel',{index:index+1,value}))}">${value}</button>`).join('')}</div><p class="puzzle-tip">${esc(t('dialTip'))}</p>${state.flags.clue?`<div class="clue-art"><span>Ⅱ</span><span>Ⅳ</span><span>Ⅰ</span></div>`:''}`;
    if (modal === 'pipes') html = paragraph('pipePrompt')+`<div class="pipe-board"><span class="pipe-end source" aria-hidden="true">→</span>${state.pipes.map((mask,index)=>`<button class="pipe" type="button" data-puzzle="pipe" data-index="${index}" aria-label="${esc(t('pipeLabel',{index:index+1,ports:[[1,'north'],[2,'east'],[4,'south'],[8,'west']].filter(([bit])=>mask&bit).map(([,key])=>t(key)).join(' / ')}))}">${pipeSvg(mask)}</button>`).join('')}<span class="pipe-end sink" aria-hidden="true">→</span></div><p class="puzzle-tip">${esc(t('pipeTip'))}</p>`;
    if (modal === 'mirrors') html = paragraph('mirrorPrompt')+`<div class="mirror-board">${mirrorSvg()}${[[160,220],[160,100],[360,100]].map(([x,y],index)=>`<button type="button" class="mirror-control" style="left:${x/4.4}%;top:${y/3.3}%" data-puzzle="mirror" data-index="${index}" aria-label="${esc(t('mirrorLabel',{index:'ABC'[index],angle:state.mirrors[index]?'＼':'／'}))}"><span aria-hidden="true">${'ABC'[index]}</span></button>`).join('')}</div><p class="puzzle-tip">${esc(t('mirrorTip'))}</p>`;
    if (modal === 'hint') {
      const stage = E.stage(state), level = state.hints[stage] || 1;
      html = `<div class="hint-illustration">${A.icon({find:'magnet',combine:'hook',fish:'hook',fit:'gear',lock:'gear',enter:'gear',reach:'oil',grease:'oil',pipe:'gear',collect:'lens',climb:'lens',lens:'lens',reflect:'lens',done:'gear'}[stage])}</div><p class="hint-stage">${esc(t('hintLevel',{level}))}</p><p class="dialog-copy">${esc(t('h_'+stage+level))}</p><div class="dialog-actions">${actionButton('close','continue',level>=2)}${level<2?actionButton('hint','moreHint'):''}</div>`;
    }
    if (modal === 'notebook') html = `<div class="notebook-modal"><p class="note-title">${esc(t('noteTitle'))}</p><div class="objective"><span class="small-label">${esc(t('currentGoal'))}</span><p>${esc(objective())}</p></div><ol class="milestones">${milestones()}</ol>${state.flags.clue?'<div class="clue-art"><span>Ⅱ</span><span>Ⅳ</span><span>Ⅰ</span></div>':''}<div class="dialog-actions">${actionButton('hint','hint')}</div></div>`;
    if (modal === 'gateDone' || modal === 'powerDone') html = `<div class="hint-illustration">${A.icon('gear')}</div>`+paragraph(modal==='gateDone'?'gateOpened':'powerOn')+continueButton();
    if (modal === 'win') html = `<svg class="win-art" viewBox="0 0 1000 620" aria-hidden="true">${A.scene({...state,room:'tower'},430).replaceAll('id="','id="win-').replaceAll('url(#','url(#win-')}</svg>`+paragraph('winCopy')+`<div class="dialog-actions">${actionButton('close','continue',false)}${actionButton('reset','replay')}</div>`;
    content.innerHTML = html;
    if (focusKey) {
      const nextFocus = content.querySelector(`[data-puzzle="${focusKey[0]}"][data-index="${focusKey[1]}"]`) || content.querySelector('button') || $('close-dialog');
      nextFocus.focus({preventScroll:true});
    } else if (focusAction && dialog.open) {
      (content.querySelector(`[data-dialog-action="${focusAction}"]`) || content.querySelector('button') || $('close-dialog')).focus({preventScroll:true});
    }
    I.apply(dialog);
  }
  function openDialog(mode) {
    if (!dialog.open) returnFocus = document.activeElement;
    modal = mode; renderDialog();
    if (!dialog.open) dialog.showModal();
  }
  function perform(action) {
    const priorRoom = state.room, oldX = robotX;
    const result = E.apply(state,action);
    if (result.message) statusKey = result.message;
    if (state.room !== priorRoom) robotX = {yard:395,workshop:551,tower:430}[state.room];
    else if (action.type === 'interact') {
      const spot = A.spots[state.room].find(([id])=>id===action.id);
      const [left,,width] = sceneBounds[state.room];
      if (spot) robotX = walkingX(spot[1] + (spot[1] < left + width / 2 ? 100 : -100));
    }
    if (result.changed) save();
    render(priorRoom===state.room?oldX:undefined);
    if (result.modal && action.type === 'interact') {
      $('hotspots').querySelector(`[data-object="${action.id}"]`)?.focus({preventScroll:true});
    }
    playSound(result.sound);
    if (result.modal === 'solved') openDialog(state.flags.power?'powerDone':'gateDone');
    else if (result.modal) openDialog(result.modal);
    else if (dialog.open) renderDialog();
    return result;
  }
  function reset() {
    state=E.fresh(); statusKey='arrive_yard'; robotX=395;
    dialog.close(); save(); render(); $('hotspots').querySelector('button')?.focus({preventScroll:true});
  }
  $('hotspots').addEventListener('click',event=>{
    const button=event.target.closest('[data-object]');
    if (!button) {
      const frame = $('scene-frame').getBoundingClientRect();
      if (!frame.width || !event.detail) return;
      const [left,,width] = sceneBounds[state.room], oldX = robotX;
      robotX = walkingX(left + (event.clientX - frame.left) / frame.width * width);
      renderScene(oldX);
      return;
    }
    const id=button.dataset.object; perform({type:'interact',id});
    if (!dialog.open) {
      const next=$('hotspots').querySelector(`[data-object="${id}"]`);
      if(next) next.focus({preventScroll:true});
      else $('inventory').querySelector(`[data-item="${id}"]`)?.focus({preventScroll:true});
    }
  });
  for (const eventName of ['pointerover','focusin']) $('hotspots').addEventListener(eventName,event=>{
    const button=event.target.closest('[data-object]');
    if(button){$('object-label').textContent=t(button.dataset.object);$('object-label').classList.add('visible');}
  });
  for (const eventName of ['pointerleave','focusout']) $('hotspots').addEventListener(eventName,()=>{$('object-label').classList.remove('visible');});
  $('inventory').addEventListener('click',event=>{
    const button=event.target.closest('[data-item]');
    if(button){perform({type:'select',id:button.dataset.item});if(state.selected)$('inventory').querySelector(`[data-item="${state.selected}"]`)?.focus({preventScroll:true});}
  });
  $('previous-room').addEventListener('click',()=>perform({type:'go',room:rooms[rooms.indexOf(state.room)-1]}));
  $('next-room').addEventListener('click',()=>perform({type:'go',room:rooms[rooms.indexOf(state.room)+1]}));
  $('posture').addEventListener('click',()=>perform({type:'posture'}));
  $('help').addEventListener('click',()=>openDialog('help'));
  $('restart').addEventListener('click',()=>openDialog('reset'));
  $('notebook').addEventListener('click',()=>openDialog('notebook'));
  $('clue-note').addEventListener('click',()=>openDialog('clue'));
  for(const id of ['hint','mobile-hint']) $(id).addEventListener('click',()=>perform({type:'hint'}));
  $('close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{modal='';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;});
  content.addEventListener('click',event=>{
    const puzzle=event.target.closest('[data-puzzle]');
    if(puzzle){perform({type:puzzle.dataset.puzzle,index:Number(puzzle.dataset.index)});return;}
    const button=event.target.closest('[data-dialog-action]');
    if(!button)return;
    if(button.dataset.dialogAction==='close')dialog.close();
    if(button.dataset.dialogAction==='hint')perform({type:'hint'});
    if(button.dataset.dialogAction==='reset')reset();
    if(button.dataset.dialogAction==='tieLine'&&state.room==='yard'&&state.items.includes('magnet')&&state.items.includes('cord')){
      perform({type:'clear'});
      perform({type:'select',id:'magnet'});
      perform({type:'select',id:'cord'});
    }
    if(button.dataset.dialogAction==='fish'&&state.room==='yard'&&state.items.includes('hook')){
      if(state.selected!=='hook')perform({type:'select',id:'hook'});
      perform({type:'interact',id:'drain'});
    }
    if(button.dataset.dialogAction==='fitGear'&&state.room==='yard'&&state.items.includes('gear')){
      if(state.selected!=='gear')perform({type:'select',id:'gear'});
      perform({type:'interact',id:'gate'});
    }
  });
  $('sound').addEventListener('click',()=>{
    soundEnabled=!soundEnabled;
    if(soundEnabled)playSound('pick');else if(audio)audio.suspend().catch(()=>{});
    render();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!dialog.open&&state.selected){event.preventDefault();perform({type:'clear'});}
  });
  document.addEventListener('visibilitychange',()=>{
    document.documentElement.classList.toggle('is-hidden',document.hidden);
    if(document.hidden&&audio)audio.suspend().catch(()=>{});
  });
  window.addEventListener('pagehide',()=>{if(audio)audio.suspend().catch(()=>{});});
  window.addEventListener('boopland:languagechange',()=>{render();if(dialog.open)renderDialog();});
  if(typeof ResizeObserver==='function')new ResizeObserver(sizeScene).observe($('stage'));
  else window.addEventListener('resize',sizeScene);
  $('notebook-sketch').innerHTML=A.sketch();
  I.apply(); render();
})();
