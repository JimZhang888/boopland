(() => {
  'use strict';
  const E=PaperGolf,I=BooplandI18n,$=id=>document.getElementById(id),t=(key,values)=>I.t('paperGolf.'+key,values);
  const storageKey='boopland-paper-golf-v1';let raw=null,persistent=true;
  try{raw=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{persistent=false;}
  let save=E.cleanSave(raw),game=new E.Game(save.current),aim={angle:game.level.aim[0],power:game.level.aim[1]};
  const canvas=$('game'),scene=new PaperGolfScene(canvas,$('stage'));
  let drag=null,paused=false,hint='ready',hintValues={},raf=0,lastTime=0,sound=false,audio=null,dialogKind='help',overlayMode='',newBest=false;
  try{sound=localStorage.getItem(storageKey+'-sound')==='true';}catch{/* Session controls remain available. */}
  function persist(){save.current=game.index;try{localStorage.setItem(storageKey,JSON.stringify(save));persistent=true;}catch{persistent=false;}}
  function soundReady(){if(!sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio??=new Audio();audio.resume().catch(()=>{});}catch{/* Audio is optional. */}}
  function beep(kind){
    if(!sound||!audio||audio.state!=='running'||document.hidden)return;
    const notes=kind==='win'?[523,659,784,1047]:kind==='spring'?[392,784]:kind==='switch'?[587,880]:kind==='strike'?[440]:['land','bump','sand'].includes(kind)?[180]:[];
    notes.forEach((frequency,i)=>{const now=audio.currentTime+i*.1,o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.045,now+.01);gain.gain.exponentialRampToValueAtTime(.001,now+.16);o.connect(gain);gain.connect(audio.destination);o.start(now);o.stop(now+.18);});
  }
  function setHint(key,values={}){hint=key;hintValues=values;$('status').textContent=t(key,values);}
  function syncAim(){$('angle').value=Math.round(aim.angle);$('power').value=Math.round(aim.power);$('angle-value').textContent=Math.round(aim.angle)+'°';$('power-value').textContent=Math.round(aim.power)+'%';$('power-badge').textContent=t('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});}
  function summary(){return {holes:save.best.filter(Boolean).length,total:save.best.reduce((a,b)=>a+(b||0),0)};}
  function updateOverlay(){
    const mode=paused?'paused':game.state==='won'?'won':'';const fresh=overlayMode!==mode;overlayMode=mode;$('overlay').hidden=!mode;if(!mode)return;
    const finished=game.index===E.LEVELS.length-1;
    $('result-symbol').textContent=mode==='paused'?'Ⅱ':'⚑';$('result-kicker').textContent=t(mode==='paused'?'littleBreak':'holeComplete',{number:game.index+1});
    $('result-title').textContent=t(mode==='paused'?'paused':finished?'finished':game.shots===1?'holeInOne':game.shots<game.level.par?'underPar':game.shots===game.level.par?'onPar':'niceShot');
    $('result-description').textContent=t(mode==='paused'?'pauseNote':finished?'finalResult':'result',{shots:game.shots,par:game.level.par,total:summary().total});
    $('result-stars').textContent=mode==='won'?'★'.repeat(game.stars())+'☆'.repeat(3-game.stars()):'';
    $('result-record').textContent=mode==='won'?t(newBest?'newBest':'bestRecord',{value:save.best[game.index]}):'';
    $('result-main').textContent=t(mode==='paused'?'resume':finished?'scorecard':'next');$('result-retry').hidden=mode!=='won';
    if(fresh)$('result-main').focus({preventScroll:true});
  }
  function updateUI(){
    $('hole-number').textContent=String(game.index+1).padStart(2,'0');$('hole-name').textContent=t('level'+(game.index+1));$('chapter').textContent=t('chapter'+(Math.floor(game.index/3)+1));$('scene-note').textContent=t('scene'+(Math.floor(game.index/3)+1));
    $('strokes').textContent=game.shots;$('par').textContent=game.level.par;$('best').textContent=save.best[game.index]??'—';$('page-number').textContent=String(game.index+1).padStart(2,'0')+' / 09';
    $('scorecard').setAttribute('aria-label',t('holeLabel',{number:game.index+1,name:t('level'+(game.index+1))})+' · '+t('scorecard'));
    $('status').textContent=t(hint,hintValues);$('drag-hint').hidden=game.shots>0||!!drag||paused||game.state!=='ready';$('power-badge').hidden=!drag;
    const disabled=game.state!=='ready'||paused||$('dialog').open;for(const id of ['strike','angle','power'])$(id).disabled=disabled;
    $('pause').disabled=game.state==='won';$('pause').textContent=paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',t(paused?'resume':'pause'));$('pause').title=t(paused?'resume':'pause');
    $('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));$('sound').title=t(sound?'soundOff':'soundOn');$('sound').setAttribute('aria-pressed',String(sound));$('sound-mark').setAttribute('d',sound?'M15 8q5 4 0 8m3-11q8 7 0 14':'m15 9 6 6m0-6-6 6');
    $('hole-progress').replaceChildren(...E.LEVELS.map((_,i)=>{const dot=document.createElement('i');dot.className=(save.best[i]?'done ':'')+(i===game.index?'current':'');return dot;}));
    syncAim();updateOverlay();
  }
  function processEvents(){
    const events=game.drainEvents();if(!events.length)return;
    for(const event of events){
      if(event==='strike')setHint('rolling');if(event==='rest')setHint('ready');if(event==='restSand')setHint('inSand');
      if(event==='switch'){setHint('switched');scene.burst(game.level.switch.x,game.level.switch.y,'switch');}
      if(event==='spring'){setHint('spring');scene.burst(game.ball.x,game.ball.y,'spring');}
      if(event==='locked')setHint('lockedCup');if(event==='penalty')setHint('penalty');
      if(event==='win'){newBest=save.best[game.index]===null||game.shots<save.best[game.index];save.best[game.index]=Math.min(save.best[game.index]??Infinity,game.shots);save=E.cleanSave(save);persist();setHint('holed');scene.burst(game.ball.x,game.ball.y-30,'win');}
      beep(event);
    }updateUI();
  }
  function draw(dt=0){scene.draw(game,aim,!!drag,dt);}
  function frame(now){raf=0;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(!paused&&!$('dialog').open&&!document.hidden){game.advance(dt);processEvents();draw(dt);}if(!paused&&!$('dialog').open&&!document.hidden&&(game.state!=='won'||scene.particles.length))raf=requestAnimationFrame(frame);}
  function startLoop(){if(!raf&&!paused&&!document.hidden&&!$('dialog').open){lastTime=performance.now();raf=requestAnimationFrame(frame);}}
  function stopLoop(){cancelAnimationFrame(raf);raf=0;draw();}
  function cancelDrag(message=true){if(!drag)return;const old=drag;drag=null;aim=old.initial;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(old.id))canvas.releasePointerCapture(old.id);if(message)setHint('cancelled');updateUI();draw();}
  function loadLevel(index){if(index<0||index>=save.unlocked)return;cancelDrag(false);paused=false;game.reset(index);aim={angle:game.level.aim[0],power:game.level.aim[1]};scene.particles=[];newBest=false;overlayMode='';setHint('tip'+(index+1));persist();updateUI();draw();startLoop();canvas.focus({preventScroll:true});}
  function strike(){if(paused||$('dialog').open)return;soundReady();if(game.strike(aim.angle,aim.power)){processEvents();startLoop();canvas.focus({preventScroll:true});}}
  function togglePause(force){if(game.state==='won')return;cancelDrag(false);paused=typeof force==='boolean'?force:!paused;game.paused=paused||$('dialog').open;updateUI();if(paused){stopLoop();audio?.suspend().catch(()=>{});}else{soundReady();startLoop();canvas.focus({preventScroll:true});}}
  function renderScorecard(){
    $('score-summary').textContent=t('summary',summary());$('save-note').textContent=t(persistent?'saved':'unsaved');$('score-grid').replaceChildren();
    E.LEVELS.forEach((level,index)=>{const button=document.createElement('button');button.type='button';button.className='score-hole'+(index===game.index?' current':'');button.disabled=index>=save.unlocked;if(index===game.index)button.setAttribute('aria-current','step');const num=document.createElement('b'),name=document.createElement('span'),record=document.createElement('small');num.textContent=String(index+1).padStart(2,'0');name.textContent=t('level'+(index+1));record.textContent=button.disabled?t('lockedHole'):save.best[index]?t('record',{value:save.best[index],par:level.par}):t('parValue',{par:level.par});button.append(num,name,record);button.addEventListener('click',()=>{$('dialog').close();loadLevel(index);});$('score-grid').append(button);});
  }
  function openDialog(kind){cancelDrag(false);dialogKind=kind;game.paused=true;$('dialog-title').textContent=t(kind==='help'?'help':'scorecard');$('help-content').hidden=kind!=='help';$('score-content').hidden=kind!=='score';if(kind==='score')renderScorecard();$('dialog').showModal();updateUI();stopLoop();audio?.suspend().catch(()=>{});}
  $('close-dialog').addEventListener('click',()=>$('dialog').close());$('dialog').addEventListener('close',()=>{game.paused=paused;updateUI();draw();if(!paused){soundReady();startLoop();}});
  $('dialog').addEventListener('click',e=>{if(e.target!==$('dialog'))return;const r=$('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('dialog').close();});
  $('help').addEventListener('click',()=>openDialog('help'));$('scorecard').addEventListener('click',()=>openDialog('score'));$('strike').addEventListener('click',strike);$('pause').addEventListener('click',()=>togglePause());$('restart').addEventListener('click',()=>loadLevel(game.index));$('result-retry').addEventListener('click',()=>loadLevel(game.index));
  $('result-main').addEventListener('click',()=>{if(paused)togglePause(false);else if(game.index===E.LEVELS.length-1)openDialog('score');else loadLevel(game.index+1);});
  $('sound').addEventListener('click',()=>{sound=!sound;if(sound){soundReady();if(audio)audio.resume().then(()=>beep('switch')).catch(()=>{});}else audio?.suspend().catch(()=>{});try{localStorage.setItem(storageKey+'-sound',String(sound));}catch{}updateUI();});
  for(const id of ['angle','power'])$(id).addEventListener('input',()=>{aim[id]=Number($(id).value);setHint('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});syncAim();draw();});
  function updateDrag(e){const dx=drag.x-e.clientX,dy=e.clientY-drag.y,length=Math.hypot(dx,dy),range=Math.min(155,Math.max(85,scene.width*.4));drag.valid=length>=7;aim.angle=E.clamp(Math.atan2(Math.max(0,dy),dx)*180/Math.PI,0,180);aim.power=E.clamp(length/range*100,3,100);syncAim();setHint('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});draw();}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag||paused||$('dialog').open||game.state!=='ready')return;e.preventDefault();canvas.focus({preventScroll:true});soundReady();drag={id:e.pointerId,x:e.clientX,y:e.clientY,valid:false,initial:{...aim}};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');updateUI();});
  canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){e.preventDefault();updateDrag(e);}});
  canvas.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;updateDrag(e);const valid=drag.valid;if(!valid){cancelDrag();return;}const id=drag.id;drag=null;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);strike();updateUI();});
  canvas.addEventListener('pointercancel',()=>cancelDrag());canvas.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
  window.addEventListener('keydown',e=>{
    if($('dialog').open)return;
    if(e.key==='Escape'&&drag){e.preventDefault();cancelDrag();return;}
    const target=e.target,interactive=target instanceof Element&&target.matches('button,a,input,select,textarea');
    if(e.code==='KeyP'||e.key==='Escape'){e.preventDefault();if(!e.repeat)togglePause();return;}
    if(interactive)return;
    if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)loadLevel(game.index);return;}
    if(e.code==='Space'){e.preventDefault();if(!e.repeat&&!drag)strike();return;}
    if(game.state!=='ready'||paused||drag)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')aim.angle=E.clamp(aim.angle+2,0,180);if(e.key==='ArrowRight')aim.angle=E.clamp(aim.angle-2,0,180);if(e.key==='ArrowUp')aim.power=E.clamp(aim.power+2,3,100);if(e.key==='ArrowDown')aim.power=E.clamp(aim.power-2,3,100);syncAim();setHint('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});draw();}
  });
  function backgroundPause(){cancelDrag(false);if(game.state!=='won')togglePause(true);else stopLoop();audio?.suspend().catch(()=>{});}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)backgroundPause();else draw();});window.addEventListener('blur',backgroundPause);window.addEventListener('pagehide',()=>{persist();stopLoop();audio?.suspend().catch(()=>{});});
  window.addEventListener('boopland:languagechange',()=>{updateUI();if($('dialog').open){$('dialog-title').textContent=t(dialogKind==='help'?'help':'scorecard');if(dialogKind==='score')renderScorecard();}draw();});
  new ResizeObserver(()=>{cancelDrag(false);scene.resize();draw();}).observe($('stage'));
  setHint('tip'+(game.index+1));updateUI();draw();startLoop();
})();
