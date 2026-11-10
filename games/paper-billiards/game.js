(() => {
  'use strict';
  const E=PaperBilliards,$=id=>document.getElementById(id),t=(key,values)=>BooplandI18n.t('billiards.'+key,values);
  const scene=new BilliardsScene.Scene($('game')),saveKey='boopland-paper-billiards-v1';
  let state=E.create(),angle=0,power=.7,paused=false,dirty=true,drag=null,placement=null,effects=[];
  let lastTime=0,accumulator=0,frameId=0,best=null,newRecord=false,saveFailed=false,handledResult=false,pendingMode=null;
  let sound=false,audio=null,lastSound=0;
  try { const saved=JSON.parse(localStorage.getItem(saveKey)||'{}');if(Number.isInteger(saved.best)&&saved.best>0&&saved.best<100000)best=saved.best;sound=saved.sound===true; } catch { /* Playing never depends on storage. */ }
  function save() {try{localStorage.setItem(saveKey,JSON.stringify({best,sound}));return true;}catch{return false;}}
  function wakeAudio() {
    if(!sound) return;
    try {if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{sound=false;}
  }
  function tone(type,strength=.5) {
    if(!sound||!audio||audio.state!=='running')return;
    const now=audio.currentTime;if(type==='collision'&&now-lastSound<.035)return;lastSound=now;
    const osc=audio.createOscillator(),gain=audio.createGain(),dur=type==='pocket'?.16:.065;
    osc.type='sine';osc.frequency.setValueAtTime(type==='pocket'?170:type==='rail'?120:type==='strike'?750:1100,now);
    osc.frequency.exponentialRampToValueAtTime(type==='pocket'?55:200,now+dur);
    gain.gain.setValueAtTime(.025+Math.min(1,strength)*.085,now);gain.gain.exponentialRampToValueAtTime(.001,now+dur);
    osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+dur+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function groupName() {const g=state.groups[state.player];return t(g&&E.remaining(state,g)===0?'eightTarget':g||'open');}
  function setText(id,text) {if($(id).textContent!==String(text))$(id).textContent=text;}
  function setStatus(text) {setText('status',text);}
  function sync() {
    setText('pots',state.potted.length);setText('shots',state.shots);setText('best',best??'—');
    setText('mode-caption',state.mode==='solo'?t('soloCaption'):t('versusCaption',{player:state.player+1,group:groupName()}));
    const reason=state.reason==='aim'?'aimState':state.reason;
    const values={count:state.lastPots.length,player:state.player+1,group:groupName()};
    if(state.phase!=='over')setStatus(t(paused?'paused':reason,values));
    else setStatus(t(state.mode==='solo'?'cleared':'win',{player:state.winner+1}));
    $('power').value=Math.round(power*100);setText('power-value',Math.round(power*100)+'%');
    setText('angle-value',((Math.round(angle*180/Math.PI)%360+360)%360)+'°');
    $('power').setAttribute('aria-valuetext',Math.round(power*100)+'%');
    const enabled=!paused&&!$('dialog').open&&state.phase==='aim';
    $('power').disabled=!enabled;$('aim-left').disabled=!enabled;$('aim-right').disabled=!enabled;
    $('strike').disabled=paused||$('dialog').open||!['aim','placing'].includes(state.phase);
    $('strike-label').removeAttribute('data-i18n');setText('strike-label',t(state.phase==='placing'?'place':'strike'));
    $('pause').disabled=state.phase==='over';$('pause').textContent=paused?'▶':'Ⅱ';
    $('pause').setAttribute('aria-label',t(paused?'resume':'pause'));$('pause').title=t(paused?'resume':'pause');
    $('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',t(sound?'soundOn':'soundOff'));$('sound').title=t(sound?'soundOn':'soundOff');
    $('sound-mark').setAttribute('d',sound?'M16 8q5 4 0 8m3-12q8 8 0 16':'m16 9 5 6m0-6-5 6');
    document.querySelector('.back').title=BooplandI18n.t('common.back');
    const tray=$('ball-tray');if(!tray.children.length) for(let n=1;n<=15;n++){const el=document.createElement('span');el.className='mini-ball'+(n>8?' stripe':'');el.style.setProperty('--ball',BilliardsScene.COLORS[n]);el.dataset.number=n;const label=document.createElement('span');label.textContent=n;el.append(label);tray.append(el);}
    for(const el of tray.children) {const n=Number(el.dataset.number);el.classList.toggle('out',state.potted.includes(n));el.style.outline=state.mode==='versus'&&state.groups[state.player]&&E.group(n)===state.groups[state.player]&&!state.potted.includes(n)?'1px solid #a48a52':'none';el.style.outlineOffset='2px';}
    if(state.phase==='over'&&!handledResult) {
      handledResult=true;newRecord=state.mode==='solo'&&(best===null||state.shots<best);
      if(newRecord) {best=state.shots;saveFailed=!save();setText('best',best);}
    }
    const overlay=paused||state.phase==='over';$('overlay').hidden=!overlay;
    if(overlay) {
      setText('result-kicker',t(paused?'name':saveFailed?'storageUnavailable':newRecord?'newRecord':'session'));
      setText('result-title',t(paused?'paused':state.mode==='solo'?'cleared':'win',{player:state.winner+1}));
      setText('result-description',t(paused?'pauseDesc':state.mode==='solo'?'clearedDesc':state.reason==='eightWin'?'winDesc':'lossDesc',{shots:state.shots,fouls:state.fouls}));
      setText('result-action',t(paused?'resume':'newGame'));
    }
    dirty=true;
  }
  function start(mode=state.mode) {
    cancelDrag();state=E.create(mode);$('mode').value=mode;angle=0;power=.7;paused=false;placement=null;effects=[];accumulator=0;lastTime=0;handledResult=false;newRecord=false;saveFailed=false;sync();
  }
  function strike() {
    if(paused||$('dialog').open)return;
    wakeAudio();
    if(state.phase==='placing') {const p=placement||state.balls[0];if(!E.placeCue(state,p.x,p.y)){setStatus(t('invalidPlace'));return;}placement=null;sync();return;}
    if(E.shoot(state,angle,power)){accumulator=0;sync();}
  }
  function pause(value=!paused) {
    if(state.phase==='over')return;
    cancelDrag();paused=value;accumulator=0;lastTime=0;
    if(paused&&audio?.state==='running')audio.suspend().catch(()=>{});
    else if(!paused)wakeAudio();sync();
  }
  function cancelDrag() {
    if(drag){angle=drag.oldAngle;power=drag.oldPower;const id=drag.id;drag=null;if($('game').hasPointerCapture(id))$('game').releasePointerCapture(id);dirty=true;}
  }
  function canInput(){return !paused&&!$('dialog').open&&['aim','placing'].includes(state.phase);}
  $('game').addEventListener('pointerdown',event=>{
    if(!canInput()||event.button!==0||drag)return;
    const p=scene.point(event.clientX,event.clientY);wakeAudio();$('game').focus({preventScroll:true});
    if(state.phase==='placing') {
      placement=p;if(E.placeCue(state,p.x,p.y)){placement=null;sync();}else{dirty=true;setStatus(t('invalidPlace'));}return;
    }
    if(p.x<48||p.x>992||p.y<55||p.y>565)return;
    const cue=state.balls[0],near=Math.hypot(p.x-cue.x,p.y-cue.y)<Math.max(25,23/scene.scale);
    drag={id:event.pointerId,start:p,near,moved:false,oldAngle:angle,oldPower:power};$('game').setPointerCapture(event.pointerId);
    if(!near)angle=Math.atan2(p.y-cue.y,p.x-cue.x);sync();
  });
  $('game').addEventListener('pointermove',event=>{
    if(!canInput())return;
    const p=scene.point(event.clientX,event.clientY);
    if(state.phase==='placing'){placement=p;dirty=true;return;}
    if(drag&&drag.id===event.pointerId) {
      const cue=state.balls[0];
      if(drag.near){const dx=drag.start.x-p.x,dy=drag.start.y-p.y,d=Math.hypot(dx,dy);if(d*scene.scale>7){drag.moved=true;angle=Math.atan2(dy,dx);power=E.clamp(d/175,.05,1);}}
      else angle=Math.atan2(p.y-cue.y,p.x-cue.x);
      sync();
    }
  });
  $('game').addEventListener('pointerup',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const fire=drag.near&&drag.moved;drag=null;if($('game').hasPointerCapture(event.pointerId))$('game').releasePointerCapture(event.pointerId);
    if(fire)strike();else sync();
  });
  $('game').addEventListener('pointercancel',()=>{cancelDrag();sync();});
  $('game').addEventListener('lostpointercapture',()=>{if(drag){cancelDrag();sync();}});
  $('power').addEventListener('input',()=>{power=Number($('power').value)/100;sync();});
  $('aim-left').addEventListener('click',()=>{angle-=Math.PI/180;sync();});
  $('aim-right').addEventListener('click',()=>{angle+=Math.PI/180;sync();});
  $('strike').addEventListener('click',strike);$('pause').addEventListener('click',()=>pause());
  $('sound').addEventListener('click',()=>{sound=!sound;if(sound){wakeAudio();tone('strike',.35);}else audio?.suspend().catch(()=>{});save();sync();});
  $('result-action').addEventListener('click',()=>{if(paused)pause(false);else start();});
  function openDialog(kind,mode=null) {
    cancelDrag();pendingMode=mode;setText('dialog-title',t(kind==='help'?'help':mode!==state.mode?'modeTitle':'restartTitle'));
    $('help-content').hidden=kind!=='help';$('confirm-content').hidden=kind==='help';$('dialog').showModal();accumulator=0;sync();
  }
  $('help').addEventListener('click',()=>openDialog('help'));
  $('restart').addEventListener('click',()=>{if(!state.shots)start();else openDialog('confirm',state.mode);});
  $('mode').addEventListener('change',()=>{const next=$('mode').value;$('mode').value=state.mode;if(!state.shots)start(next);else openDialog('confirm',next);});
  $('close-dialog').addEventListener('click',()=>$('dialog').close());$('cancel').addEventListener('click',()=>$('dialog').close());
  $('confirm').addEventListener('click',()=>{const mode=pendingMode||state.mode;$('dialog').close();start(mode);});
  // Native close events may arrive after a new dialog has already opened.
  // Keep its requested mode until the next openDialog call replaces it.
  $('dialog').addEventListener('close',()=>{if($('dialog').open)return;accumulator=0;lastTime=0;sync();});
  window.addEventListener('keydown',event=>{
    if($('dialog').open)return;
    const key=event.key.toLowerCase();
    if(key==='escape'&&drag){event.preventDefault();cancelDrag();sync();return;}
    if(key==='p'||key==='escape'){event.preventDefault();pause();return;}
    if(/^(INPUT|SELECT|BUTTON|A)$/.test(document.activeElement?.tagName))return;
    if(!canInput())return;
    if(key===' '){event.preventDefault();strike();}
    else if(state.phase==='aim'&&['arrowleft','arrowright','arrowup','arrowdown'].includes(key)) {
      event.preventDefault();const step=(event.shiftKey ? .2 : 1)*Math.PI/180;
      if(key==='arrowleft')angle-=step;if(key==='arrowright')angle+=step;
      if(key==='arrowup')power=E.clamp(power+.05,.05,1);if(key==='arrowdown')power=E.clamp(power-.05,.05,1);sync();
    }
  });
  window.addEventListener('blur',()=>{if(state.shots||drag)pause(true);});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){pause(true);if(frameId)cancelAnimationFrame(frameId);frameId=0;}
    else {lastTime=0;dirty=true;if(!frameId)frameId=requestAnimationFrame(frame);}
  });
  window.addEventListener('boopland:languagechange',()=>{sync();if($('dialog').open)setText('dialog-title',t(!$('help-content').hidden?'help':pendingMode!==state.mode?'modeTitle':'restartTitle'));});
  new ResizeObserver(()=>{cancelDrag();scene.resize();sync();}).observe($('stage'));
  function frame(now) {
    frameId=0;const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;
    if(!paused&&!$('dialog').open) {
      if(state.phase==='moving') {
        accumulator+=dt;
        while(accumulator>=E.STEP&&state.phase==='moving'){E.tick(state);accumulator-=E.STEP;}
        dirty=true;
      }else accumulator=0;
      if(effects.length){for(const p of effects)p.age+=dt;effects=effects.filter(p=>p.age<.32);dirty=true;}
    }
    if(state.events.length){
      for(const event of state.events){if(event.type==='pocket'){effects.push({...event,age:0});tone('pocket',.5);}else if(event.type==='settled')sync();else tone(event.type,event.strength);}
      state.events.length=0;setText('pots',state.potted.length);
    }
    if(dirty){scene.draw(state,angle,power,{paused:paused||$('dialog').open,dragging:drag?.moved,placement,effects});dirty=false;}
    if(!document.hidden)frameId=requestAnimationFrame(frame);
  }
  scene.resize();sync();frameId=requestAnimationFrame(frame);
})();
