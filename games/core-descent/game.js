(() => {
  'use strict';
  const {Descent,W,H}=CoreDescent;
  const game=new Descent();
  const $=id=>document.getElementById(id), t=(key,values)=>BooplandI18n.t('core.'+key,values);
  const canvas=$('game'),ctx=canvas.getContext('2d'),stage=$('stage'),overlay=$('overlay');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pressed=new Set(),pointers=new Map();
  let raf=0,last=0,particles=[],toastUntil=0,toastFloor=0,shake=0,helpPaused=false,audioContext=null,sound=false,best=0,hudKey='',viewMode='',canvasScale=1;
  try{best=Math.min(100,Math.max(0,Number(localStorage.getItem('boopland-core-best'))||0));sound=localStorage.getItem('boopland-core-sound')==='true';}catch{}
  const ink='#575449',lightInk='#a39b85',rust='#a26b51',paper='#f5f0e2';
  const noise=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  // Stable double pencil strokes: no frame-to-frame jitter.
  function line(points,color=ink,width=1.4,seed=1,close=false,fill=null){
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    ctx.globalAlpha*=.25;ctx.beginPath();points.forEach(([x,y],i)=>{const dx=(noise(seed+i*5)-.5)*2,dy=(noise(seed+i*9+4)-.5)*2;i?ctx.lineTo(x+dx,y+dy):ctx.moveTo(x+dx,y+dy);});if(close)ctx.closePath();ctx.lineWidth=.6;ctx.stroke();ctx.globalAlpha/=.25;
  }
  function ellipse(x,y,rx,ry,color=ink,fill=null,width=1.4){ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.04,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function hatch(x,y,w,h,color=lightInk,step=8){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();for(let i=-h;i<w;i+=step)line([[x+i,y+h],[x+i+h,y]],color,.65,i);ctx.restore();}
  function gem(x,y,size=10){line([[x,y-size],[x+size*.7,y-2],[x,y+size],[x-size*.7,y-2]],'#738977',1,3,true,'#a9b8a45c');line([[x,y-size],[x+2,y],[x,y+size]],'#738977',.7);}
  function backdrop(){
    const zone=Math.min(4,Math.floor(game.floor/20));
    ctx.fillStyle=['#f5f0e2','#f2edde','#eeedde','#f2e7d7','#f0e0ce'][zone];ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#bcb79e26';ctx.lineWidth=.6;
    const offset=game.camera*.28%26;
    for(let y=-offset;y<H;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    for(let x=0;x<W;x+=26){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    // Fine graphite speckle and slightly irregular strata stay attached to the earth.
    for(let i=0;i<330;i++){const x=noise(i+17)*W,y=(noise(i+700)*H-game.camera*.2%H+H)%H;ctx.fillStyle=i%3?'#82786215':'#fcfaf08c';ctx.fillRect(x,y,1+(i%2),1);}
    const base=Math.floor(game.camera/90);
    for(let row=base-1;row<=base+9;row++){
      const y=row*90-game.camera;
      const a=15+noise(row+2)*13,b=14+noise(row+20)*15;
      line([[0,y],[a,y+5],[a+5,y+27],[a-5,y+61],[a+3,y+90],[0,y+92]],'#96907d',1,row,true,'#dad3bf77');
      hatch(0,y,Math.max(a-5,4),90,'#a79e8650',7);
      line([[W,y],[W-b,y-5],[W-b-4,y+29],[W-b+4,y+67],[W-b-2,y+90],[W,y+92]],'#96907d',1,row+30,true,'#dad3bf77');
      hatch(W-b+5,y,b,90,'#a79e8650',7);
      if(row%3===0){ctx.save();ctx.translate(row%2?W-56:49,y+40);ctx.rotate(row*.7);if(zone===2)gem(0,0,13);else if(zone===1){for(let i=1;i<5;i++)ellipse(0,0,i*3,i*2,'#aba18b',null,.7);line([[-15,0],[15,0]],'#aba18b',.7);}else{line([[-7,-8],[5,-6],[11,3],[1,9],[-8,4]],'#b1a78e',.75,row,true);line([[-7,-8],[0,0],[11,3]],'#b1a78e',.6);}ctx.restore();}
      if(row>2&&row%2===0){ctx.fillStyle='#aaa18b';ctx.font='10px Georgia';ctx.textAlign='right';ctx.fillText(String(Math.max(0,Math.floor((row*90-220)/82))).padStart(3,'0'),W-33,y+15);}
    }
    // Surface and lower-depth pencil annotations.
    if(game.camera<170){const y=90-game.camera;line([[166,y],[173,y+8],[164,y+22],[176,y+36],[172,y+50]],'#b2a58a',1);line([[165,y+43],[172,y+51],[180,y+43]],'#b2a58a',1);ctx.fillStyle='#9d927b';ctx.font='italic 12px Georgia';ctx.textAlign='left';ctx.fillText('100 ↓',191,y+27);}
    ctx.fillStyle='#d0c7b4';ctx.fillRect(0,0,W,8);
    for(let x=18;x<W-15;x+=22)line([[x,7],[x+10,25+(x%3)*2],[x+20,7]],'#8c7b65',1.1,x,true,'#c7b9a1');
    hatch(0,0,W,7,'#988a7180',6);
  }
  function drawPlatform(platform){
    if(platform.broken)return;
    const x=platform.x,y=platform.y-game.camera,w=platform.w;
    if(y<-25||y>H+35)return;
    ctx.save();
    if(platform.timer!==null){ctx.globalAlpha=Math.max(.15,platform.timer/.55);if(!reduced)ctx.translate(Math.sin(game.time*65)*1.4,0);}
    if(platform.type==='spike'){
      line([[x,y+3],[x+w,y+3],[x+w,y+12],[x,y+13]],rust,1.3,platform.id,true,'#dac2aa');
      for(let i=3;i<w-12;i+=15)line([[x+i,y+3],[x+i+7,y-11],[x+i+14,y+3]],rust,1.2,i,true,'#d7b79b');
      hatch(x+1,y+4,w-2,8,'#a77d6066',7);
    }else if(platform.type==='spring'){
      line([[x,y],[x+w,y],[x+w-2,y+5],[x+2,y+5]],'#7d8466',1.5,platform.id,true,'#c9cfac');
      for(const sx of [x+18,x+w-35])line([[sx,y+6],[sx+17,y+9],[sx,y+14],[sx+17,y+17],[sx+7,y+21]],ink,1.1);
      line([[x+9,y+22],[x+w-9,y+22]],ink,1.2);
    }else{
      const fill=platform.type==='crumble'?'#e1d4bb':platform.type==='belt'?'#c9c9b3':platform.row===100?'#d8ad7f':'#d5cdb9';
      line([[x,y+1],[x+w*.34,y-1],[x+w,y],[x+w-2,y+12],[x+3,y+14]],ink,1.4,platform.id,true,fill);
      hatch(x+4,y+4,w-8,8,'#8e816360',8);
      if(platform.type==='crumble'){
        line([[x+w*.4,y],[x+w*.35,y+6],[x+w*.49,y+8],[x+w*.43,y+14]],'#897a5d',1.2);
        line([[x+w*.73,y],[x+w*.67,y+8]],'#897a5d',.8);
      }
      if(platform.type==='belt'){ctx.save();ctx.beginPath();ctx.rect(x+4,y,w-8,13);ctx.clip();const shift=(game.time*25*platform.dir)%20;for(let i=-20;i<w+20;i+=20){const bx=x+i+shift;line([[bx-platform.dir*3,y+3],[bx+platform.dir*2,y+6],[bx-platform.dir*3,y+9]],'#646d51',1.2);}ctx.restore();ellipse(x+6,y+7,3,3,ink,'#e5dfcb',1);ellipse(x+w-7,y+7,3,3,ink,'#e5dfcb',1);}
    }
    if(platform.gem)gem(x+w/2,y-24+Math.sin(game.time*2+platform.id)*2,9);
    if(platform.row===100){ctx.fillStyle=rust;ctx.font='italic 17px Georgia';ctx.textAlign='center';ctx.fillText('100',x+w/2,y+42);}
    ctx.restore();
  }
  function explorer(){
    const p=game.player,x=p.x,y=p.y-game.camera;
    if(p.invincible>0&&Math.floor(p.invincible*12)%2===0)return;
    ctx.save();ctx.translate(x,y);ctx.scale(p.facing,1);
    const walking=p.standing!==null&&Math.abs(p.vx)>0;
    const leg=walking?Math.sin(game.time*18)*5:0;
    // Shadow, backpack, boots, coat, face, helmet and little graphite hatch marks.
    if(p.standing!==null){ctx.globalAlpha=.12;ellipse(1,15,16,2,ink,ink,0);ctx.globalAlpha=1;}
    line([[-11,-10],[-17,-8],[-17,5],[-11,7]],ink,1.3,3,true,'#9b9b7e');
    line([[-8,-7],[7,-7],[9,8],[4,11],[-8,9]],ink,1.4,5,true,'#b8bda0');
    hatch(-6,-5,10,12,'#77806780',5);
    line([[-5,9],[-7+leg,14],[-1+leg,15]],ink,2,1);
    line([[5,9],[7-leg,14],[12-leg,14]],ink,2,2);
    line([[6,-3],[13,3+(p.standing===null?-7:leg*.3)]],ink,1.8);
    ellipse(0,-16,10,10,ink,'#f1e6cc');
    line([[5,-18],[5,-16]],ink,1.8);line([[5,-11],[8,-12]],ink,.8);
    ctx.beginPath();ctx.moveTo(-12,-21);ctx.bezierCurveTo(-13,-38,12,-38,13,-21);ctx.closePath();ctx.fillStyle='#c6976c';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1.4;ctx.stroke();
    line([[-15,-21],[16,-22]],ink,1.7);hatch(-9,-30,10,7,'#8b705550',4);
    ellipse(8,-26,4,4,ink,'#f9efc7',1);line([[-13,-1],[-16,1]],'#6d725b',1);
    if(!reduced && p.standing===null&&p.vy>150){line([[-9,-45],[-9,-39]],'#9e947955',.8);line([[9,-49],[9,-43]],'#9e947955',.8);}
    ctx.restore();
  }
  function render(){
    ctx.setTransform(canvasScale,0,0,canvasScale,0,0);ctx.clearRect(0,0,W,H);ctx.save();
    if(shake>0&&!reduced)ctx.translate(Math.sin(game.time*73)*shake,Math.cos(game.time*61)*shake*.5);
    backdrop();game.platforms.forEach(drawPlatform);explorer();
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);if(p.type==='gem')gem(p.x,p.y-game.camera,3);else line([[p.x,p.y-game.camera],[p.x+3,p.y-game.camera-2]],p.color,1.5);}
    ctx.globalAlpha=1;ctx.restore();
  }
  function fit(){
    const bounds=stage.getBoundingClientRect(),scale=Math.min(bounds.width/W,bounds.height/H),dpr=Math.min(devicePixelRatio||1,2);
    canvas.style.width=W*scale+'px';canvas.style.height=H*scale+'px';
    canvas.width=Math.max(1,Math.round(W*scale*dpr));canvas.height=Math.max(1,Math.round(H*scale*dpr));canvasScale=canvas.width/W;render();
  }
  function audioReady(){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});}catch{sound=false;syncSound();}}
  function tone(type){
    if(!sound||!audioContext||audioContext.state!=='running')return;
    const notes={land:[170,.035],hurt:[90,.16],spring:[430,.13],gem:[820,.12],break:[125,.06],won:[620,.32],over:[120,.26],start:[370,.12]};if(!notes[type])return;
    try{const [f,duration]=notes[type],o=audioContext.createOscillator(),g=audioContext.createGain(),now=audioContext.currentTime;o.type=type==='hurt'?'triangle':'sine';o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(type==='spring'||type==='gem'?f*1.7:f*.55,now+duration);g.gain.setValueAtTime(.055,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(now+duration+.01);}catch{}
  }
  function syncSound(){$('sound').classList.toggle('sound-off',!sound);$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));}
  function syncHud(force=false){
    const key=[game.floor,game.hp,best,BooplandI18n.language].join('/');if(key===hudKey&&!force)return;hudKey=key;
    $('floor').textContent=String(game.floor).padStart(3,'0');$('best').textContent=String(best).padStart(3,'0');
    $('hearts').innerHTML=Array.from({length:6},(_,i)=>`<svg viewBox="0 0 20 20" class="${i<game.hp?'':'empty'}" aria-hidden="true"><path d="M10 17 3 10C-2 3 7-1 10 5c3-6 12-2 7 5Z"/></svg>`).join('');
    $('hearts').setAttribute('aria-label',t('healthLabel',{hp:game.hp}));$('route-marker').style.top=game.floor+'%';$('zone').textContent=t('zone'+Math.min(4,Math.floor(game.floor/20)));
  }
  function showState(force=false){
    if(viewMode===game.mode&&!force)return;viewMode=game.mode;
    const ready=game.mode==='ready',paused=game.mode==='paused',playing=game.mode==='playing',won=game.mode==='won';
    overlay.hidden=playing;overlay.classList.toggle('compact',!ready);$('pause').disabled=!playing&&!paused;$('pause').setAttribute('aria-label',t(paused?'resume':'pause'));
    $('pause').innerHTML=paused?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
    $('overlay-title').textContent=t(ready?'name':paused?'paused':won?'won':'over');
    $('overlay-description').textContent=game.mode==='over'&&game.reason?t(game.reason):t(ready?'intro':paused?'pausedText':won?'wonText':'overText');
    $('start').textContent=t(ready?'start':paused?'resume':'restart');$('restart').hidden=!paused;
    $('results').hidden=ready||paused||playing;$('results').textContent=t('result',{floor:game.floor,gems:game.crystals,time:Math.floor(game.time)});
    if(!playing&&!ready&&!$('help-dialog').open)$('start').focus({preventScroll:true});
    syncHud();
  }
  function clearInput(){pressed.clear();pointers.clear();$('left').classList.remove('held');$('right').classList.remove('held');}
  function start(){if($('help-dialog').open)return;audioReady();clearInput();if(game.mode==='paused'){game.mode='playing';}else{saveBest();game.reset();particles=[];shake=0;toastUntil=0;$('toast').hidden=true;tone('start');}last=0;showState();canvas.focus({preventScroll:true});run();}
  function pause(){if(game.mode!=='playing')return;game.mode='paused';clearInput();showState();if(audioContext)audioContext.suspend().catch(()=>{});}
  function togglePause(){if(game.mode==='playing')pause();else if(game.mode==='paused')start();}
  function consumeEvents(){
    for(const event of game.events){tone(event.type);
      if(['land','break','hurt','gem'].includes(event.type)&&!reduced){const color=event.type==='hurt'?rust:event.type==='gem'?'#819377':'#a39880';for(let i=0;i<(event.type==='land'?5:14);i++)particles.push({x:event.x,y:event.y,vx:(Math.random()-.5)*105,vy:-25-Math.random()*90,life:.4+Math.random()*.3,max:.7,color,type:event.type});}
      if(event.type==='hurt')shake=3;
      if(event.type==='milestone'){toastFloor=event.floor;$('toast').textContent=t('milestone',{floor:toastFloor});$('toast').hidden=false;toastUntil=game.time+2.5;}
      if(event.type==='over'||event.type==='won')saveBest();
    }game.events.length=0;
  }
  function saveBest(){if(game.floor>best){best=game.floor;try{localStorage.setItem('boopland-core-best',String(best));}catch{}}}
  function tick(timestamp){
    raf=0;if(document.hidden)return;const dt=last?Math.min((timestamp-last)/1000,.05):0;last=timestamp;
    if(game.mode==='playing'){
      const left=pressed.has('ArrowLeft')||pressed.has('KeyA')||[...pointers.values()].includes(-1),right=pressed.has('ArrowRight')||pressed.has('KeyD')||[...pointers.values()].includes(1);
      game.update(dt,(right?1:0)-(left?1:0));consumeEvents();
      for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;}particles=particles.filter(p=>p.life>0);shake=Math.max(0,shake-dt*12);
      if(game.time>toastUntil)$('toast').hidden=true;syncHud();showState();
    }
    render();if(game.mode==='playing')run();
  }
  function run(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  $('start').addEventListener('click',start);$('restart').addEventListener('click',()=>{game.mode='ready';start();});$('pause').addEventListener('click',togglePause);
  $('sound').addEventListener('click',()=>{sound=!sound;try{localStorage.setItem('boopland-core-sound',String(sound));}catch{}if(sound){audioReady();tone('start');}else if(audioContext)audioContext.suspend().catch(()=>{});syncSound();});
  for(const [id,direction] of [['left',-1],['right',1]]){
    const button=$(id);button.addEventListener('pointerdown',event=>{if(game.mode!=='playing')return;event.preventDefault();button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,direction);button.classList.add('held');});
    const release=event=>{pointers.delete(event.pointerId);button.classList.toggle('held',[...pointers.values()].includes(direction));};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  // Dragging anywhere on the paper is an optional touch alternative.
  const steer=event=>{const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*W,dx=x-game.player.x;pointers.set(event.pointerId,Math.abs(dx)<10?0:Math.sign(dx));};
  canvas.addEventListener('pointerdown',event=>{if(game.mode!=='playing')return;canvas.setPointerCapture(event.pointerId);steer(event);});canvas.addEventListener('pointermove',event=>{if(canvas.hasPointerCapture(event.pointerId))steer(event);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>pointers.delete(event.pointerId));
  window.addEventListener('keydown',event=>{
    if($('help-dialog').open)return;
    const isButton=event.target.closest?.('button,a,input,select,textarea');
    if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)&&game.mode==='playing'){if(isButton&&event.code.startsWith('Key'))return;event.preventDefault();pressed.add(event.code);}
    if(['Space','KeyP','Escape'].includes(event.code)&&!event.repeat&&!isButton){if(game.mode==='playing'||game.mode==='paused'){event.preventDefault();togglePause();}else if(event.code==='Space'){event.preventDefault();start();}}
  });
  window.addEventListener('keyup',event=>pressed.delete(event.code));
  window.addEventListener('blur',()=>{clearInput();pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();saveBest();if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else{last=0;render();}});
  window.addEventListener('pagehide',()=>{pause();saveBest();if(raf)cancelAnimationFrame(raf);raf=0;});
  $('help-legend').append(document.querySelector('.legend').cloneNode(true));
  $('help').addEventListener('click',()=>{helpPaused=game.mode==='playing';if(helpPaused)pause();$('help-dialog').showModal();});
  $('help-dialog').addEventListener('close',()=>{if(helpPaused){helpPaused=false;start();}else $('help').focus({preventScroll:true});});
  window.addEventListener('boopland:languagechange',()=>{syncHud(true);syncSound();showState(true);if(!$('toast').hidden)$('toast').textContent=t('milestone',{floor:toastFloor});if(game.mode!=='playing')render();});
  new ResizeObserver(fit).observe(stage);syncSound();syncHud(true);showState();fit();
})();
