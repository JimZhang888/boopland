(() => {
  'use strict';
  const $=id=>document.getElementById(id), t=(key,values)=>BooplandI18n.t(`fishing.${key}`,values);
  const game=new OneCast.Game(), scene=new FishingArt.Scene($('lake-art'));
  const SAVE_KEY='boopland-one-cast-v1';
  let save, canSave=true, sound=false, audio=null, newFish=false, dialogKind='', beforeDialog=false, raf=0, lastTime=0, lastPaint=-Infinity, progress=-1;
  try { save=OneCast.cleanSave(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch { save=OneCast.cleanSave(null); }
  const number=n=>new Intl.NumberFormat(BooplandI18n.language,{maximumFractionDigits:2}).format(n);
  function persist() { try { localStorage.setItem(SAVE_KEY,JSON.stringify(save)); } catch { canSave=false; } }
  function play(kind) {
    if(!sound || document.hidden || game.paused) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if(audio.state==='suspended') audio.resume().catch(()=>{});
      const notes=kind==='bite'?[660,880]:kind==='catch'?[523,659,784]:kind==='miss'?[260,210]:[390];
      notes.forEach((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),when=audio.currentTime+i*.09;osc.type='sine';osc.frequency.setValueAtTime(freq,when);gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(.045,when+.015);gain.gain.exponentialRampToValueAtTime(.001,when+.2);osc.connect(gain);gain.connect(audio.destination);osc.start(when);osc.stop(when+.22);});
    } catch { sound=false; syncSound(); }
  }
  function syncSound(){ $('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));$('sound-wave').setAttribute('d',sound?'M16 8q6 4 0 8m3-11q9 7 0 14':'m16 9 5 6m0-6-5 6'); }
  function syncCollection() {
    $('discovered').textContent=`${Object.keys(save.fish).length} / ${OneCast.FISH.length}`;
    $('fish-grid').innerHTML=OneCast.FISH.map(f=>`<div class="fish-slot ${save.fish[f.id]?'found':''}" role="img" aria-label="${t(save.fish[f.id]?f.id:'unknown')}">${FishingArt.fishSVG(f,!save.fish[f.id])}${save.fish[f.id]?'':'<span class="unknown" aria-hidden="true">?</span>'}</div>`).join('');
  }
  function update() {
    let title,note,label,mark='↗';
    const state=game.state,r=game.result;
    if(state==='idle'){title=t('idleTitle');note=t('idleNote');label=t('cast');}
    else if(state==='casting'){title=t('castingTitle');note=t('castingNote');label=t('casting');mark='⌁';}
    else if(state==='waiting'){title=t('waitingTitle');note=t('waitingNote');label=t('waiting');mark='…';}
    else if(state==='bite'){title=t('biteTitle');note=t('biteNote');label=t('reel');mark='!';}
    else if(r?.type==='catch'){title=(r.perfect?t('perfect')+' ':'')+t('catchTitle',{fish:t(r.fish)});note=t('catchNote',{weight:number(r.weight),points:number(r.points),combo:number(r.multiplier)});label=t('again');mark='✓';}
    else {title=t(r?.reason==='early'?'earlyTitle':'lateTitle');note=t(r?.reason==='early'?'earlyNote':'lateNote');label=t('again');mark='↝';}
    $('status-title').textContent=title;$('status-note').textContent=note;$('status-mark').textContent=mark;$('action-label').textContent=label;
    $('new-stamp').hidden=!newFish || r?.type!=='catch';
    $('score').textContent=number(game.score);$('caught').textContent=number(game.caught);$('streak').textContent=number(game.streak);$('best').textContent=number(save.best);
    $('action').disabled=state==='casting'||game.paused;
    $('action').classList.toggle('biting',state==='bite');$('bite-callout').hidden=state!=='bite'||game.paused;
    $('pause-overlay').hidden=!game.paused;$('pause').setAttribute('aria-pressed',String(game.paused));$('pause').setAttribute('aria-label',t(game.paused?'resume':'pause'));
    $('pause-shape').setAttribute('d',game.paused?'m8 4 12 8-12 8Z':'M8 5v14M16 5v14');
    $('step-cast').classList.toggle('active',state==='idle'||state==='casting'||state==='result');$('step-wait').classList.toggle('active',state==='waiting');$('step-reel').classList.toggle('active',state==='bite');
    syncSound();syncCollection();updateProgress();
  }
  function updateProgress(){const value=Math.round(game.remaining*100);$('timing-fill').style.width=value+'%';if(value!==progress){$('timing-track').setAttribute('aria-valuenow',String(value));progress=value;}}
  function event(result) {
    if(!result)return;
    if(result==='cast')newFish=false;
    if(result==='catch') {
      const r=game.result,entry=save.fish[r.fish];newFish=!entry;
      save.fish[r.fish]={count:Math.min(999999,(entry?.count||0)+1),weight:Math.max(entry?.weight||0,r.weight)};
      save.best=Math.max(save.best,game.score);persist();
    }
    if(['cast','bite','catch','miss'].includes(result))play(result);
    update();
  }
  function action(){if(dialogKind)return;event(game.press());}
  function setPaused(value){game.paused=value;lastTime=0;if(value){if(raf)cancelAnimationFrame(raf);raf=0;if(audio?.state==='running')audio.suspend().catch(()=>{});}else{if(sound&&audio?.state==='suspended')audio.resume().catch(()=>{});startLoop();}update();scene.draw(game);}
  function renderDialog(){
    if(dialogKind==='help'){$('dialog-title').textContent=t('helpTitle');const ol=document.createElement('ol');for(let i=1;i<=5;i++){const li=document.createElement('li');li.textContent=t('rule'+i);ol.append(li);}$('dialog-body').replaceChildren(ol);}
    else if(dialogKind==='journal'){$('dialog-title').textContent=t('collection');$('dialog-body').innerHTML=`<p>${t(Object.keys(save.fish).length===8?'journalComplete':'journalIntro')}</p><div class="journal-grid">${OneCast.FISH.map(f=>{const item=save.fish[f.id];return `<article class="journal-entry ${item?'':'locked'}">${FishingArt.fishSVG(f,!item)}<span class="rarity">${t(f.rarity)}</span><h3>${t(item?f.id:'unknown')}</h3><p>${item?t('fishRecord',{count:number(item.count),weight:number(item.weight)}):t('unknownNote')}</p></article>`;}).join('')}</div><p class="saved-note">${t(canSave?'saved':'memoryOnly')}</p>`;}
    else if(dialogKind==='restart'){$('dialog-title').textContent=t('newTitle');const p=document.createElement('p');p.textContent=t('newNote');$('dialog-body').replaceChildren(p);}
    $('restart-actions').hidden=dialogKind!=='restart';
    $('journal-new-trip').hidden=dialogKind!=='journal';
  }
  function openDialog(kind){if(dialogKind)return;beforeDialog=game.paused;dialogKind=kind;setPaused(true);renderDialog();$('dialog').showModal();}
  function closeDialog(){ $('dialog').close(); }
  $('dialog').addEventListener('close',()=>{dialogKind='';setPaused(beforeDialog||document.hidden);});
  $('dialog').addEventListener('click',e=>{if(e.target===$('dialog')){const r=$('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  $('action').addEventListener('click',action);
  $('pause').addEventListener('click',()=>setPaused(!game.paused));$('resume').addEventListener('click',()=>setPaused(false));
  $('help').addEventListener('click',()=>openDialog('help'));$('journal').addEventListener('click',()=>openDialog('journal'));$('close-dialog').addEventListener('click',closeDialog);$('cancel-new').addEventListener('click',closeDialog);
  $('new-trip').addEventListener('click',()=>openDialog('restart'));
  $('journal-new-trip').addEventListener('click',()=>{dialogKind='restart';renderDialog();$('cancel-new').focus();});
  $('confirm-new').addEventListener('click',()=>{game.reset();newFish=false;beforeDialog=false;closeDialog();update();});
  $('sound').addEventListener('click',()=>{sound=!sound;if(sound)play('cast');else if(audio)audio.suspend().catch(()=>{});syncSound();});
  document.addEventListener('keydown',e=>{
    if(dialogKind||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(e.code==='Space') {
      // Preserve native keyboard activation for secondary buttons and links.
      if(e.target.closest('button,a') && e.target!==$('action'))return;
      e.preventDefault();if(!e.repeat){if(game.paused)setPaused(false);else action();}
    } else if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat){e.preventDefault();setPaused(!game.paused);}
  });
  window.addEventListener('boopland:languagechange',()=>{update();if(dialogKind)renderDialog();});
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;setPaused(true);};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else startLoop();});
  window.addEventListener('blur',()=>setPaused(true));
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',()=>{if(!document.hidden)startLoop();});
  function frame(now){raf=0;const dt=lastTime?now-lastTime:0;lastTime=now;event(game.tick(dt));if(now-lastPaint>=1000/30){scene.draw(game);updateProgress();lastPaint=now;}if(!document.hidden&&!game.paused)raf=requestAnimationFrame(frame);}
  function startLoop(){if(!raf&&!document.hidden&&!game.paused){lastTime=0;raf=requestAnimationFrame(frame);}}
  new ResizeObserver(()=>{scene.resize();scene.draw(game);}).observe($('scene'));
  update();scene.draw(game);startLoop();
})();
