(() => {
  'use strict';
  const { SortingGame, DESTINATIONS } = window.ParcelGame;
  const i18n = window.BooplandI18n, t = (key, values) => i18n.t('parcelSorter.' + key, values);
  const $ = selector => document.querySelector(selector), game = new SortingGame();
  const ui = { scene:$('#scene'), parcels:$('#parcels'), overlay:$('#stageOverlay'), card:$('#welcomeCard'), score:$('#score'), time:$('#time'), combo:$('#combo'), multiplier:$('#multiplier'), lives:$('#lives'), pause:$('#pauseButton'), feedback:$('#feedback') };
  const nodes = new Map(), bins = [...document.querySelectorAll('.destination')];
  let width = ui.scene.clientWidth, previousTime = performance.now(), drag = null, sound = false, audio, feedbackTimer, saved = {}, record = false, endReason = '';
  try { saved = JSON.parse(localStorage.getItem('boopland-parcel-sorter-best') || '{}'); if (!saved || typeof saved !== 'object') saved = {}; } catch { saved = {}; }
  const best = () => Number.isFinite(saved[game.mode]) ? Math.max(0,saved[game.mode]) : 0;
  const station = id => t('station' + id);
  function nodeFor(p, demo = false) {
    const el = document.createElement('button'); el.className = 'parcel ' + DESTINATIONS[p.destination].color + (demo ? ' demo' : ''); el.dataset.id = p.id;
    el.innerHTML = '<span class="shipping-label"><b></b><span class="barcode"></span></span><span class="parcel-id">PC-' + String(p.id).padStart(4,'0') + '</span><span class="selected-marker"></span>';
    if (demo) { el.tabIndex = -1; el.setAttribute('aria-hidden','true'); }
    else {
      el.addEventListener('click',()=>{game.select(p.id);render();});
      el.addEventListener('pointerdown',e=>{
        if (game.status !== 'running' || e.button !== 0) return;
        clearDrag(); game.select(p.id); drag = {id:p.id,startX:e.clientX,startY:e.clientY,moved:false,ghost:null};render();
      });
    }
    localizeParcel(el,p);return el;
  }
  function localizeParcel(el,p) {
    el.querySelector('.shipping-label b').textContent = station(p.destination);
    el.querySelector('.selected-marker').textContent = '▼';
    el.setAttribute('aria-label',t('parcelLabel',{id:p.id,name:station(p.destination)}));
  }
  function demo() {
    ui.parcels.replaceChildren();nodes.clear();
    [{id:1,destination:0,x:.12},{id:2,destination:2,x:.82}].forEach(p=>{const el=nodeFor(p,true);el.style.left=(p.x*width-38)+'px';ui.parcels.append(el);});
  }
  function render() {
    ui.score.textContent=String(game.score).padStart(3,'0');const seconds=Math.ceil(game.remaining);
    ui.time.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');ui.time.classList.toggle('time-low',seconds<=15);
    ui.combo.textContent=game.combo;ui.multiplier.textContent='×'+game.multiplier;
    if(ui.lives.dataset.count!==String(game.lives)){ui.lives.innerHTML=Array.from({length:5},(_,i)=>'<svg class="'+(i>=game.lives?'empty':'')+'" aria-hidden="true"><use href="#i-heart"/></svg>').join('');ui.lives.dataset.count=game.lives;}
    ui.lives.setAttribute('aria-label',t('livesLabel',{n:game.lives}));
    $('#statusLabel').textContent=t(game.status);$('#deliveredLabel').textContent=t('delivered',{n:game.delivered});$('#bestLabel').textContent=t('best',{n:best()});
    ui.pause.textContent=t(game.status==='paused'?'resume':'pause');ui.pause.disabled=!['running','paused'].includes(game.status);
    document.body.classList.toggle('running',game.status==='running');
    const p=game.parcels.find(item=>item.id===game.selected);$('#selectionHint').textContent=game.status==='running'&&p?t('selected',{name:station(p.destination)}):'1 · 2 · 3';
    if(game.status==='ready')return;
    for(const [id,el] of nodes)if(!game.parcels.some(p=>p.id===id)){el.remove();nodes.delete(id);}
    for(const p of game.parcels){let el=nodes.get(p.id);if(!el){el=nodeFor(p);nodes.set(p.id,el);ui.parcels.append(el);}el.style.left=(p.x*width-el.offsetWidth/2)+'px';el.classList.toggle('selected',p.id===game.selected);el.setAttribute('aria-pressed',String(p.id===game.selected));el.disabled=game.status!=='running';el.tabIndex=p.x>=0&&p.x<=1?0:-1;el.style.visibility=drag?.id===p.id&&drag.moved?'hidden':'';}
  }
  const addText=(tag,text,className)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
  function button(text,handler,className='primary-button'){const el=addText('button',text,className);el.addEventListener('click',handler);return el;}
  function overlay() {
    ui.overlay.hidden=game.status==='running';if(ui.overlay.hidden)return;
    ui.card.replaceChildren();ui.card.className='welcome-card'+(game.status==='ended'?' result':'');
    const heading=addText('h2',t(game.status==='ready'?'welcome':game.status==='paused'?'paused':endReason==='time'?'finished':'exhausted'));heading.id='overlayTitle';ui.card.append(heading);
    if(game.status==='ready'){
      ui.card.append(addText('p',t('intro')));const choices=document.createElement('div');choices.className='mode-options';choices.setAttribute('role','group');choices.setAttribute('aria-label',t('change'));
      for(const mode of ['easy','rush']){const el=button('',()=>{game.reset(mode);demo();overlay();render();},'mode'+(game.mode===mode?' active':''));el.setAttribute('aria-pressed',String(game.mode===mode));el.append(addText('b',t(mode)),addText('small',t('seconds',{n:mode==='easy'?90:60})));choices.append(el);}
      ui.card.append(choices,button(t('start'),start),addText('div',t('best',{n:best()}),'mode-best'));
    }else if(game.status==='paused')ui.card.append(addText('p',t('pausedText')),button(t('resume'),togglePause));
    else{
      if(record)ui.card.append(addText('p',t('newBest')));
      ui.card.append(addText('div',String(game.score),'result-score'),addText('div',t('summary',{n:game.delivered,combo:game.maxCombo}),'result-metrics'),button(t('replay'),start),button(t('change'),()=>{game.reset(game.mode);demo();overlay();render();},'secondary-button'));
    }
  }
  function start(){clearDrag();record=false;game.start();nodes.clear();ui.parcels.replaceChildren();clearTimeout(feedbackTimer);ui.feedback.classList.remove('show');ui.feedback.textContent='';previousTime=performance.now();overlay();render();tone('start');ui.pause.focus({preventScroll:true});}
  function togglePause(){if(game.status==='running'){clearDrag();game.pause();}else if(game.status==='paused'){game.resume();previousTime=performance.now();}else return;overlay();render();(game.status==='paused'?ui.card.querySelector('button'):ui.pause).focus({preventScroll:true});}
  function flash(text,bad=false){clearTimeout(feedbackTimer);ui.feedback.textContent=text;ui.feedback.className='feedback show'+(bad?' bad':'');feedbackTimer=setTimeout(()=>ui.feedback.classList.remove('show'),1600);}
  function sort(destination,id){if(game.sort(destination,id)){events();render();}}
  function events(){for(const event of game.takeEvents()){
    if(event.type==='correct'){tone('correct');flash(event.combo%5===0?t('streak',{n:event.combo,m:game.multiplier}):t('correct',{n:event.points}));animateBin(event.destination,true);}
    else if(event.type==='wrong'||event.type==='missed'){tone('wrong');flash(t(event.type==='wrong'?'wrong':'missed',{name:station(event.parcel.destination)}),true);animateBin(event.destination,false);if(drag?.id===event.parcel.id)clearDrag();}
    else if(event.type==='finished'){clearDrag();endReason=event.reason;record=game.score>best();saved[game.mode]=Math.max(best(),game.score);try{localStorage.setItem('boopland-parcel-sorter-best',JSON.stringify(saved));}catch{}overlay();ui.card.querySelector('button').focus({preventScroll:true});tone('end');}
  }}
  function animateBin(index,good){const bin=bins[index];if(!bin)return;bin.classList.remove('flash-good','flash-bad');void bin.offsetWidth;bin.classList.add(good?'flash-good':'flash-bad');}
  function tone(type){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});const notes={correct:[660,880],wrong:[230,170],start:[440,550,660],end:[660,550,440]}[type];notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime+i*.085;o.frequency.value=f;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.06,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+.14);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+.15);});}catch{sound=false;updateSound();}}
  function updateSound(){$('#soundButton').setAttribute('aria-pressed',String(sound));$('#soundButton').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));}
  function clearDrag(){if(drag){drag.ghost?.remove();const el=nodes.get(drag.id);if(el)el.style.visibility='';drag=null;}bins.forEach(bin=>bin.classList.remove('drag-over'));}
  document.addEventListener('pointermove',event=>{
    if(!drag||game.status!=='running')return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>7){const el=nodes.get(drag.id);if(!el){clearDrag();return;}drag.moved=true;drag.ghost=el.cloneNode(true);drag.ghost.classList.add('dragging');drag.ghost.removeAttribute('data-id');drag.ghost.setAttribute('aria-hidden','true');drag.ghost.tabIndex=-1;drag.ghost.style.width=el.offsetWidth+'px';drag.ghost.style.height=el.offsetHeight+'px';document.body.append(drag.ghost);el.style.visibility='hidden';}
    if(drag.moved){event.preventDefault();drag.ghost.style.left=(event.clientX-drag.ghost.offsetWidth/2)+'px';drag.ghost.style.top=(event.clientY-drag.ghost.offsetHeight/2)+'px';const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.destination');bins.forEach(bin=>bin.classList.toggle('drag-over',bin===target));}
  },{passive:false});
  document.addEventListener('pointerup',event=>{if(!drag)return;const{id,moved}=drag;const target=moved&&document.elementFromPoint(event.clientX,event.clientY)?.closest('.destination');clearDrag();if(target)sort(Number(target.dataset.destination),id);else render();});
  document.addEventListener('pointercancel',()=>{clearDrag();render();});
  bins.forEach(bin=>bin.addEventListener('click',()=>sort(Number(bin.dataset.destination))));ui.pause.addEventListener('click',togglePause);
  $('#soundButton').addEventListener('click',()=>{sound=!sound;updateSound();tone('correct');});
  $('#helpButton').addEventListener('click',()=>{if(game.status==='running')togglePause();$('#helpDialog').showModal();});
  $('#closeHelp').addEventListener('click',()=>$('#helpDialog').close());$('#helpDone').addEventListener('click',()=>$('#helpDialog').close());
  document.addEventListener('keydown',event=>{if($('#helpDialog').open||event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;if(['1','2','3'].includes(event.key)&&game.status==='running'){event.preventDefault();sort(Number(event.key)-1);}if(event.code==='Space'&&['running','paused'].includes(game.status)){event.preventDefault();togglePause();}if(event.code==='Escape'&&game.status==='running'){event.preventDefault();togglePause();}});
  function onLeave(){if(game.status==='running')togglePause();if(audio?.state==='running')audio.suspend().catch(()=>{});}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)onLeave();});window.addEventListener('blur',onLeave);window.addEventListener('pagehide',onLeave);
  window.addEventListener('boopland:languagechange',()=>{i18n.apply();updateSound();clearTimeout(feedbackTimer);ui.feedback.classList.remove('show');for(const p of game.parcels){const el=nodes.get(p.id);if(el)localizeParcel(el,p);}if(game.status==='ready')demo();overlay();render();});
  new ResizeObserver(()=>{width=ui.scene.clientWidth;if(game.status==='ready')demo();else render();}).observe(ui.scene);
  function frame(now){const delta=Math.max(0,(now-previousTime)/1000);previousTime=now;if(game.status==='running'){game.tick(delta);events();render();}requestAnimationFrame(frame);}
  demo();overlay();render();updateSound();requestAnimationFrame(frame);
})();
