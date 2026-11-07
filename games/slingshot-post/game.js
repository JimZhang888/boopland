(() => {
  'use strict';
  const E=SlingshotPost, I=BooplandI18n, $=id=>document.getElementById(id), t=(key,values)=>I.t('slingPost.'+key,values);
  const storageKey='boopland-slingshot-post-v1';
  let stored=null, persistent=true;
  try { stored=JSON.parse(localStorage.getItem(storageKey)||'null'); } catch { persistent=false; }
  let save=E.cleanSave(stored), game=new E.Game(save.current);
  const canvas=$('game'), scene=new SlingshotScene(canvas,$('stage'));
  let aim={angle:game.level.aim[0],power:game.level.aim[1]}, drag=null, hint='ready', hintValues={}, paused=false;
  let raf=0,lastTime=0,overlayKey='',sound=false,audio=null,dialogKind='help';

  function persist() {
    save.current=game.index;
    try { localStorage.setItem(storageKey,JSON.stringify(save)); persistent=true; } catch { persistent=false; }
    $('save-note').textContent=t(persistent?'saved':'unsaved');
    $('save-note').dataset.i18n=persistent?'saved':'unsaved';
  }
  function beep(kind) {
    if(!sound||!audio||audio.state!=='running'||document.hidden) return;
    const sequence=kind==='win'?[523,659,784]:kind==='switch'?[659,880]:kind==='bounce'?[440]:kind==='miss'?[196]:[330];
    sequence.forEach((frequency,i)=>{
      const now=audio.currentTime+i*.12,osc=audio.createOscillator(),gain=audio.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(frequency*(kind==='launch'?1.8:1),now+.1);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.06,now+.015);gain.gain.exponentialRampToValueAtTime(.001,now+.19);
      osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.2);
    });
  }
  function setHint(key,values={}) {hint=key;hintValues=values;$('play-hint').textContent=t(key,values);}
  function syncAim() {
    $('angle').value=Math.round(aim.angle);$('power').value=Math.round(aim.power);
    $('angle-value').textContent=Math.round(aim.angle)+'°';$('power-value').textContent=Math.round(aim.power)+'%';
  }
  function showOverlay() {
    const key=paused?'pause':game.state==='won'?'won':game.state==='lost'?'lost':'';
    $('overlay').hidden=!key;$('overlay').classList.toggle('paused',key==='pause');
    if(!key){overlayKey='';return;}
    const total=save.best.reduce((a,b)=>a+b,0),final=game.index===E.LEVELS.length-1;
    $('result-kicker').textContent=t('stamp');
    $('result-stamp').textContent=key==='pause'?'Ⅱ':key==='won'?'✓':'↻';
    $('result-title').textContent=t(key==='pause'?'pauseTitle':key==='lost'?'lostTitle':final?'finishTitle':game.shots===1?'perfect':'delivered');
    $('result-note').textContent=t(key==='pause'?'pauseNote':key==='lost'?'lostNote':final?'finishNote':'result',{shots:game.shots,stars:final?total:game.stars});
    $('result-stars').textContent=key==='won'?'★'.repeat(game.stars)+'☆'.repeat(3-game.stars):'';
    $('result-main').textContent=t(key==='pause'?'resume':key==='lost'?'retry':final?'replayRoute':'next');
    $('result-retry').hidden=key!=='won';
    if(overlayKey!==key){overlayKey=key;$('result-main').focus({preventScroll:true});}
  }
  function updateUI() {
    $('level-heading').textContent=String(game.index+1).padStart(2,'0')+' · '+t('level'+(game.index+1));
    $('postal-number').textContent=String(game.index+1).padStart(2,'0')+' / 08';
    $('mission-text').textContent=t('mission'+(game.index+1));
    $('attempts').textContent=t('count',{count:Math.max(0,3-game.shots)});
    $('level-best').textContent='★'.repeat(save.best[game.index])+'☆'.repeat(3-save.best[game.index]);
    $('total-stars').textContent=save.best.reduce((a,b)=>a+b,0)+' / 24';
    $('wind-label').textContent=t(game.level.wind>0?'tailwind':game.level.wind<0?'headwind':'calm',{value:Math.abs(game.level.wind)/10});
    $('wind-arrow').textContent=game.level.wind>0?'→':game.level.wind<0?'←':'⌁';
    $('play-hint').textContent=t(hint,hintValues);
    $('stage').dataset.state=paused?'paused':game.state;
    $('stage-note').hidden=game.index!==0||game.shots>0||!!drag||paused;
    const disabled=game.state!=='ready'||paused||$('dialog').open;
    for(const id of ['launch','angle','power'])$(id).disabled=disabled;
    $('pause').disabled=game.state==='won'||game.state==='lost';
    $('pause').textContent=paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',t(paused?'resume':'pause'));
    $('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));
    $('sound').setAttribute('aria-pressed',String(sound));$('mute-mark').hidden=sound;
    $('save-note').textContent=t(persistent?'saved':'unsaved');
    syncAim();showOverlay();
  }
  function processEvents() {
    const events=game.drainEvents();if(!events.length)return;
    for(const event of events){
      if(event==='launch')setHint('flying');
      if(event==='switch'){setHint('switched');scene.burst(game.level.switch.x,game.level.switch.y,'switch');}
      if(event==='bounce'){setHint('bounced');if(game.ball)scene.burst(game.ball.x,game.ball.y,'bounce');}
      if(event==='locked')setHint('locked');
      if(event==='miss')setHint('missed');
      if(event==='win'){
        save.best[game.index]=Math.max(save.best[game.index],game.stars);
        save=E.cleanSave(save);persist();setHint('delivered');
        const target=E.targetAt(game.level,game.time);scene.burst(target.x,target.y,'win');
      }
      beep(event);
    }
    updateUI();
  }
  function frame(now) {
    raf=0;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
    if(!paused&&!$('dialog').open&&!document.hidden){game.advance(dt);processEvents();scene.draw(game,aim,!!drag,dt);}
    if(!paused&&!$('dialog').open&&!document.hidden&&(game.state==='ready'||game.state==='flying'||scene.particles.length))raf=requestAnimationFrame(frame);
  }
  function startLoop() {if(!raf&&!document.hidden&&!paused&&!$('dialog').open){lastTime=performance.now();raf=requestAnimationFrame(frame);}}
  function stopLoop() {cancelAnimationFrame(raf);raf=0;scene.draw(game,aim,!!drag,0);}
  function cancelDrag(message=true) {
    if(!drag)return;const old=drag;drag=null;aim=old.initial;canvas.classList.remove('dragging');
    if(canvas.hasPointerCapture(old.id))canvas.releasePointerCapture(old.id);
    if(message)setHint('cancelAim');syncAim();updateUI();scene.draw(game,aim,false,0);
  }
  function loadLevel(index) {
    if(index<0||index>=save.unlocked)return;
    cancelDrag(false);paused=false;game.reset(index);aim={angle:game.level.aim[0],power:game.level.aim[1]};scene.particles=[];
    setHint('ready');overlayKey='';persist();updateUI();startLoop();canvas.focus({preventScroll:true});
  }
  function launch() {
    if($('dialog').open||paused)return;
    if(game.launch(aim.angle,aim.power)){processEvents();startLoop();canvas.focus({preventScroll:true});}
  }
  function togglePause(force) {
    if(game.state==='won'||game.state==='lost')return;
    cancelDrag(false);paused=typeof force==='boolean'?force:!paused;game.paused=paused||$('dialog').open;
    updateUI();if(paused){stopLoop();audio?.suspend().catch(()=>{});}else{if(sound)audio?.resume().catch(()=>{});startLoop();canvas.focus({preventScroll:true});}
  }
  function renderRoute() {
    $('route-grid').replaceChildren();
    E.LEVELS.forEach((level,index)=>{
      const button=document.createElement('button');button.type='button';button.className='route-stop'+(index===game.index?' current':'');
      button.disabled=index>=save.unlocked;
      button.setAttribute('aria-label',t('stopLabel',{number:index+1,name:t('level'+(index+1)),stars:save.best[index]})+(button.disabled?' · '+t('lockedStop'):''));
      if(index===game.index)button.setAttribute('aria-current','step');
      const number=document.createElement('b'),name=document.createElement('span'),stars=document.createElement('small');
      number.textContent=String(index+1).padStart(2,'0');name.textContent=t('level'+(index+1));stars.textContent=button.disabled?t('lockedStop'):'★'.repeat(save.best[index])+'☆'.repeat(3-save.best[index]);
      button.append(number,name,stars);button.addEventListener('click',()=>{$('dialog').close();loadLevel(index);});$('route-grid').append(button);
    });
  }
  function openDialog(kind) {
    cancelDrag(false);dialogKind=kind;game.paused=true;
    $('dialog-title').textContent=t(kind==='route'?'route':'help');$('help-content').hidden=kind!=='help';$('route-content').hidden=kind!=='route';
    if(kind==='route')renderRoute();$('dialog').showModal();updateUI();stopLoop();audio?.suspend().catch(()=>{});
  }
  $('dialog').addEventListener('close',()=>{game.paused=paused;updateUI();if(!paused){if(sound)audio?.resume().catch(()=>{});startLoop();}});
  $('dialog').addEventListener('click',event=>{if(event.target!==$('dialog'))return;const r=$('dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('dialog').close();});
  $('close-dialog').addEventListener('click',()=>$('dialog').close());
  $('help').addEventListener('click',()=>openDialog('help'));$('route').addEventListener('click',()=>openDialog('route'));
  $('launch').addEventListener('click',launch);$('pause').addEventListener('click',()=>togglePause());
  $('restart').addEventListener('click',()=>loadLevel(game.index));$('result-retry').addEventListener('click',()=>loadLevel(game.index));
  $('result-main').addEventListener('click',()=>{
    if(paused)togglePause(false);
    else if(game.state==='lost')loadLevel(game.index);
    else if(game.index===E.LEVELS.length-1)openDialog('route');
    else loadLevel(game.index+1);
  });
  $('sound').addEventListener('click',()=>{
    if(!sound){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio??=new Audio();audio.resume().then(()=>beep('switch')).catch(()=>{});}catch{return;}}
    sound=!sound;if(!sound)audio?.suspend().catch(()=>{});updateUI();
  });
  for(const id of ['angle','power'])$(id).addEventListener('input',()=>{aim[id]=Number($(id).value);syncAim();setHint('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});startLoop();});
  function updateDrag(event) {
    const p=scene.point(event),dx=E.ORIGIN.x-p.x,dy=p.y-E.ORIGIN.y,length=Math.hypot(dx,dy);
    drag.valid=dx>5&&length>Math.max(8,7/scene.scale);
    aim={angle:Math.max(5,Math.min(80,Math.atan2(dy,Math.max(0,dx))*180/Math.PI)),power:Math.max(8,Math.min(100,length/.92))};
    syncAim();setHint('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});
  }
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||drag||game.state!=='ready'||paused||$('dialog').open)return;
    const p=scene.point(event);if(Math.hypot(p.x-E.ORIGIN.x,p.y-E.ORIGIN.y)>Math.max(42,25/scene.scale))return;
    event.preventDefault();canvas.focus({preventScroll:true});drag={id:event.pointerId,valid:false,initial:{...aim}};
    canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging');$('stage-note').hidden=true;
  });
  canvas.addEventListener('pointermove',event=>{if(drag?.id!==event.pointerId)return;event.preventDefault();updateDrag(event);});
  canvas.addEventListener('pointerup',event=>{
    if(drag?.id!==event.pointerId)return;event.preventDefault();const shouldLaunch=drag.valid,old=drag;
    drag=null;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(shouldLaunch)launch();else{aim=old.initial;setHint('cancelAim');updateUI();}
  });
  canvas.addEventListener('pointercancel',()=>cancelDrag());canvas.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
  window.addEventListener('keydown',event=>{
    if($('dialog').open||event.ctrlKey||event.metaKey||event.altKey)return;
    const tag=event.target.tagName;
    if(['INPUT','TEXTAREA','SELECT'].includes(tag)||event.target.isContentEditable)return;
    if(event.key==='Escape'&&drag){event.preventDefault();cancelDrag();return;}
    if(event.key.toLowerCase()==='p'||event.key==='Escape'){event.preventDefault();if(!event.repeat)togglePause();return;}
    if(event.key.toLowerCase()==='r'){event.preventDefault();if(!event.repeat)loadLevel(game.index);return;}
    if(paused||game.state!=='ready'||drag)return;
    if(event.code==='Space'&&tag!=='BUTTON'&&tag!=='A'){event.preventDefault();if(!event.repeat)launch();}
    if(event.key.startsWith('Arrow')){
      event.preventDefault();if(event.key==='ArrowLeft')aim.angle=Math.min(80,aim.angle+1);if(event.key==='ArrowRight')aim.angle=Math.max(5,aim.angle-1);
      if(event.key==='ArrowUp')aim.power=Math.min(100,aim.power+1);if(event.key==='ArrowDown')aim.power=Math.max(8,aim.power-1);
      syncAim();setHint('aiming',{angle:Math.round(aim.angle),power:Math.round(aim.power)});startLoop();
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){togglePause(true);stopLoop();audio?.suspend().catch(()=>{});}else startLoop();});
  window.addEventListener('blur',()=>{if(!$('dialog').open)togglePause(true);});
  window.addEventListener('pagehide',()=>{stopLoop();audio?.suspend().catch(()=>{});});
  window.addEventListener('pageshow',()=>startLoop());
  window.addEventListener('boopland:languagechange',()=>{updateUI();if($('dialog').open){$('dialog-title').textContent=t(dialogKind==='route'?'route':'help');if(dialogKind==='route')renderRoute();}scene.draw(game,aim,!!drag,0);});
  updateUI();persist();scene.draw(game,aim,false,0);startLoop();
})();
