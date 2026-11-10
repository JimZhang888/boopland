(() => {
  'use strict';
  const $ = id => document.getElementById(id), t = (key, values) => BooplandI18n.t('yesterday.' + key, values);
  const { Game, LEVELS, INPUT, FPS, LIMIT } = YesterdayEngine;
  const storageKey = 'boopland-yesterday-me-v1';
  let progress = { level: 0, completed: [] }, storageOK = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') {
      progress.level = Number.isInteger(saved.level) && saved.level >= 0 && saved.level < LEVELS.length ? saved.level : 0;
      progress.completed = Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(n => Number.isInteger(n) && n >= 0 && n < LEVELS.length))] : [];
    }
  } catch { /* Invalid or unavailable storage never prevents play. */ }
  let game = new Game(progress.level), paused = false, modal = '', showHint = false, lastPhase = '', toastKey = '', toastUntil = 0;
  let lastTime = 0, accumulator = 0, frameId = 0, lastClock = '', memorySignature = '', pendingInput = 0;
  const keyboard = new Set(), pointers = new Map();
  const scene = new YesterdayScene($('game'), t);
  function saveProgress() { try { localStorage.setItem(storageKey, JSON.stringify(progress)); storageOK = true; } catch { storageOK = false; } }
  function flash(key) { toastKey = key; toastUntil = performance.now() + 3200; $('toast').textContent = t(key); $('toast').hidden = false; }
  function clearInput() { keyboard.clear(); pointers.clear(); pendingInput = 0; document.querySelectorAll('.touch-key').forEach(b=>b.classList.remove('pressed')); }
  function keyInput() {
    let bits = pendingInput; pendingInput = 0;
    for (const code of keyboard) bits |= ({ArrowLeft:1,KeyA:1,ArrowRight:2,KeyD:2,Space:4,KeyW:4,ArrowUp:4,KeyE:8,Enter:16})[code] || 0;
    for (const key of pointers.values()) bits |= ({left:1,right:2,jump:4,act:8})[key] || 0;
    return bits;
  }
  function sync(force = false) {
    $('level-name').textContent = t('level'+game.levelIndex);
    $('page-number').textContent = String(game.levelIndex+1).padStart(2,'0');
    $('chapter-progress').textContent = `${game.levelIndex+1} / ${LEVELS.length}`;
    $('instruction').textContent = t((showHint?'hint':'task')+game.levelIndex);
    $('hint').setAttribute('aria-pressed',String(showHint));
    $('phase-label').textContent = t(game.phase==='ready'?'ready':game.memories.length?'replaying':'recording');
    $('undo').disabled = !game.memories.length;
    $('rewind').disabled = game.memories.length >= 2 || game.track.length < 12 || game.phase === 'won';
    $('carry').disabled = !game.boxes.length;
    const signature = game.memories.map(m=>m.length).join(',') + ':' + BooplandI18n.language;
    if (force || signature!==memorySignature) {
      memorySignature=signature;
      $('memories').replaceChildren();
      for(let i=0;i<2;i++) {
        const memory=game.memories[i], card=document.createElement('div');
        card.className='memory'+(memory?' filled':'')+(i===1?' second':'');
        const head=document.createElement('div'); head.className='memory-head';
        const dot=document.createElement('i');dot.className='ghost-dot';head.append(dot,document.createTextNode(t('ghost',{n:i+1})));card.append(head);
        const note=document.createElement('small');note.id='memory-note-'+i;note.textContent=memory?(memory.length/FPS).toFixed(1)+' s':t('empty');card.append(note);
        if(memory) {const track=document.createElement('div');track.className='mini-track';const fill=document.createElement('i');fill.id='memory-fill-'+i;track.append(fill);card.append(track);}
        $('memories').append(card);
      }
    }
    if (toastKey) $('toast').textContent=t(toastKey);
  }
  function updateMeters() {
    const clock=(game.frame/FPS).toFixed(1).padStart(4,'0');
    if(lastClock!==clock){$('clock').textContent=clock;$('live-fill').style.width=`${game.frame/LIMIT*100}%`;lastClock=clock;}
    game.memories.forEach((m,i)=>{const fill=$('memory-fill-'+i);if(fill)fill.style.width=`${Math.min(1,game.frame/m.length)*100}%`;const note=$('memory-note-'+i);if(note){const label=game.frame===0?t('waiting'):game.frame>=m.length?t('finished'):(m.length/FPS).toFixed(1)+' s';if(note.textContent!==label)note.textContent=label;}});
  }
  function newLevel(index) { closeDialog(); game=new Game(index);progress.level=index;saveProgress();showHint=false;resetUI(); }
  function resetUI(){clearInput();paused=false;accumulator=0;lastPhase='';lastClock='';toastKey='';$('toast').hidden=true;sync(true);updateMeters();scene.draw(game);}
  function rewind(){if(modal && !['timeout','fell'].includes(modal))return;const result=game.rewind();if(result==='saved'){closeDialog();resetUI();}flash(result);sync();}
  function retry(){closeDialog();game.retry();resetUI();}
  function undo(){if(game.undo()){closeDialog();resetUI();flash('undone');}}
  function heading(key){const h=document.createElement('h2');h.id='dialog-title';h.className='dialog-title';h.textContent=t(key);$('dialog-content').append(h);}
  function paragraph(key,className='dialog-subtitle',values){const p=document.createElement('p');p.className=className;p.textContent=t(key,values);$('dialog-content').append(p);return p;}
  function actions(items){const row=document.createElement('div');row.className='dialog-buttons';for(const [key,action,primary] of items){const b=document.createElement('button');b.textContent=t(key);if(primary)b.className='primary';b.addEventListener('click',action);row.append(b);}$('dialog-content').append(row);}
  function closeDialog(){if($('dialog').open)$('dialog').close();modal='';paused=false;clearInput();accumulator=0;lastTime=0;}
  function showDialog(type){
    clearInput();paused=true;modal=type;$('dialog-content').replaceChildren();
    if(type==='help'){
      heading('helpTitle');
      for(let i=1;i<=4;i++){const row=document.createElement('div');row.className='help-step';const n=document.createElement('b');n.textContent=String(i).padStart(2,'0');const copy=document.createElement('div');const title=document.createElement('h3');title.textContent=t('help'+i+'Title').replace(/^\d+ /,'');const p=document.createElement('p');p.textContent=t('help'+i);copy.append(title,p);row.append(n,copy);$('dialog-content').append(row);}
      actions([['start',closeDialog,true]]);
    } else if(type==='pause') {heading('pauseTitle');paragraph('pauseBody');actions([['resume',closeDialog,true],['retry',retry]]);}
    else if(type==='levels'){
      heading('levelsTitle');const grid=document.createElement('div');grid.className='level-grid';
      LEVELS.forEach((_,i)=>{const b=document.createElement('button');b.className='level-choice'+(i===game.levelIndex?' current':'');if(i===game.levelIndex)b.setAttribute('aria-current','true');const n=document.createElement('small');n.textContent=String(i+1).padStart(2,'0')+(progress.completed.includes(i)?' · '+t('cleared'):'');const title=document.createElement('strong');title.textContent=t('level'+i);b.append(n,title);b.addEventListener('click',()=>newLevel(i));grid.append(b);});$('dialog-content').append(grid);
    } else if(type==='reset') {heading('resetTitle');paragraph('resetBody');actions([['reset',()=>{closeDialog();game.clear();resetUI();flash('resetDone');},true],['cancel',closeDialog]]);}
    else if(type==='won') {
      const all=progress.completed.length===LEVELS.length;
      heading(all?'allDone':'complete');
      const art=document.createElementNS('http://www.w3.org/2000/svg','svg');art.setAttribute('viewBox','0 0 190 90');art.classList.add('success-drawing');art.setAttribute('aria-hidden','true');
      art.innerHTML='<path d="M10 76h170M45 44 34 67h23ZM95 38 82 66h26ZM145 44 134 67h23Z" fill="#e4ead8"/><circle cx="45" cy="34" r="12" fill="#edf2eb" stroke="#7295a3"/><circle cx="95" cy="26" r="13" fill="#fff9e7"/><circle cx="145" cy="34" r="12" fill="#f1e8e8" stroke="#b08c96"/><path d="m40 67-3 8m13-8 3 8m36-9-3 10m16-10 3 10m35-9-3 8m13-8 3 8M56 50l25-1m28 0 25 1M75 12l-4-6m42 6 5-6M90 5V1"/>';
      $('dialog-content').append(art);paragraph('result','score-note',{n:game.memories.length,time:(game.frame/FPS).toFixed(1)});
      if(all)paragraph('allBody');if(!storageOK)paragraph('storageNote');
      const next=game.levelIndex+1<LEVELS.length?game.levelIndex+1:LEVELS.findIndex((_,i)=>!progress.completed.includes(i));
      actions(next>=0?[['next',()=>newLevel(next),true],['again',()=>newLevel(game.levelIndex)],['levelsTitle',()=>showDialog('levels')]]:[['levelsTitle',()=>showDialog('levels'),true],['again',()=>newLevel(game.levelIndex)]]);
    } else if(type==='timeout'||type==='fell') {heading(type+'Title');paragraph(type+'Body');const options=[['retry',retry,true]];if(game.memories.length<2&&game.track.length>=12)options.push(['rewind',rewind]);if(game.memories.length)options.push(['undo',undo]);actions(options);}
    if(!$('dialog').open)$('dialog').showModal();
  }
  function finish(){
    if(game.phase==='won') {if(!progress.completed.includes(game.levelIndex))progress.completed.push(game.levelIndex);progress.level=game.levelIndex;saveProgress();showDialog('won');}
    else if(game.phase==='timeout'||game.phase==='fell')showDialog(game.phase);
  }
  function frame(time){
    frameId=0;if(document.hidden)return;
    const delta=lastTime?Math.min((time-lastTime)/1000,.1):0;lastTime=time;
    if(!paused){accumulator+=delta;while(accumulator>=1/FPS){game.step(keyInput());accumulator-=1/FPS;if(['won','timeout','fell'].includes(game.phase))break;}}
    if(game.phase!==lastPhase){lastPhase=game.phase;sync();if(!paused)finish();}
    // Only the record button and meters need per-frame updates.
    const disabled=game.memories.length>=2||game.track.length<12||game.phase==='won';if($('rewind').disabled!==disabled)$('rewind').disabled=disabled;
    updateMeters();scene.draw(game,time);
    if(toastKey&&time>toastUntil){toastKey='';$('toast').hidden=true;}
    frameId=requestAnimationFrame(frame);
  }
  document.querySelectorAll('[data-input]').forEach(button=>{
    const bit=({left:1,right:2,jump:4,act:8})[button.dataset.input];
    button.addEventListener('pointerdown',e=>{if(button.disabled||paused)return;e.preventDefault();button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,button.dataset.input);pendingInput|=bit;button.classList.add('pressed');});
    button.addEventListener('click',e=>{if(e.detail===0&&!paused)pendingInput|=bit;});
    const release=e=>{pointers.delete(e.pointerId);if(![...pointers.values()].includes(button.dataset.input))button.classList.remove('pressed');};
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>button.addEventListener(event,release));
    button.addEventListener('contextmenu',e=>e.preventDefault());
  });
  const movement=['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyW','ArrowUp','KeyE','Enter'];
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(modal){if(e.code==='Escape'){e.preventDefault();closeDialog();}return;}
    // Preserve normal Enter/Space activation while a UI button or link has focus.
    if(['Space','Enter'].includes(e.code)&&e.target.closest?.('button,a'))return;
    if(movement.includes(e.code)){e.preventDefault();keyboard.add(e.code);if(!e.repeat)pendingInput|=({ArrowLeft:1,KeyA:1,ArrowRight:2,KeyD:2,Space:4,KeyW:4,ArrowUp:4,KeyE:8,Enter:16})[e.code];return;}
    if(e.repeat)return;
    if(e.code==='KeyR'){e.preventDefault();rewind();}
    else if(e.code==='KeyT'){e.preventDefault();retry();}
    else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();showDialog('pause');}
    else if(e.code==='Backspace'){e.preventDefault();undo();}
  });
  window.addEventListener('keyup',e=>keyboard.delete(e.code));
  $('game').addEventListener('pointerdown',()=>{$('game').focus({preventScroll:true});});
  $('rewind').addEventListener('click',rewind);$('retry').addEventListener('click',retry);$('undo').addEventListener('click',undo);
  $('reset').addEventListener('click',()=>showDialog('reset'));$('levels').addEventListener('click',()=>showDialog('levels'));
  $('help').addEventListener('click',()=>showDialog('help'));$('pause').addEventListener('click',()=>showDialog('pause'));
  $('close-dialog').addEventListener('click',closeDialog);$('dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
  $('hint').addEventListener('click',()=>{showHint=!showHint;sync();});
  window.addEventListener('blur',()=>{clearInput();if(game.phase==='running'&&!modal)showDialog('pause');});
  document.addEventListener('visibilitychange',()=>{clearInput();lastTime=0;accumulator=0;if(document.hidden){cancelAnimationFrame(frameId);frameId=0;if(game.phase==='running'&&!modal)showDialog('pause');}else if(!frameId)frameId=requestAnimationFrame(frame);});
  window.addEventListener('boopland:languagechange',()=>{sync(true);if(modal)showDialog(modal);scene.draw(game);});
  new ResizeObserver(()=>{scene.resize();scene.draw(game);}).observe($('scene'));
  sync(true);updateMeters();frameId=requestAnimationFrame(frame);
})();
