(() => {
  'use strict';
  const {Game,W,H,FLOOR,DANGER}=MarbleRush, $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d'), t=(key,values)=>BooplandI18n.t('marbleRush.'+key,values);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), palette=['#d4dfc5','#e7cbb9','#d2dfe0','#e9debc'], outlines=['#879878','#b2866e','#819b9b','#b49c67'];
  let best=0,sound=true;try{best=Number(localStorage.getItem('boopland-marble-rush-best'))||0;sound=localStorage.getItem('boopland-marble-rush-sound')!=='off';}catch{}
  let audio=null,lastNote=0,particles=[],rings=[],labels=[],shake=0,toastTime=0,toastKey='',toastValues={},comboTime=0,lastEnergy=45,modal='intro',pointer=null,scale=1,dpr=1,previousTime=0,uiTime=0,keyAxis=0,oldState='',lastFocus=null;
  function unlock(){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
  function note(kind,pitch=0){
    if(!sound||!audio||audio.state!=='running')return;const now=audio.currentTime;
    if(kind==='hit'&&now-lastNote<.035)return;if(kind==='hit')lastNote=now;
    const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);
    const tones=[392,440,523.25,587.33,659.25,784,880,1046.5];let freq=tones[pitch%tones.length],duration=.1,volume=.035;
    if(kind==='bomb'){freq=130;duration=.24;volume=.1;osc.type='triangle';osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(35,now+duration);}else{osc.type='sine';if(kind==='pickup'){freq=1046;duration=.22;}if(kind==='launch')freq=294;if(kind==='power'){freq=196;duration=.4;osc.type='triangle';}osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(freq*(kind==='pickup'?1.5:.92),now+duration);}
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.start(now);osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function toast(key,values={},duration=2){toastKey=key;toastValues=values;$('toast').textContent=t(key,values);$('toast').hidden=false;toastTime=duration;}
  function burst(x,y,color,n=13){if(reduced.matches)n=Math.min(n,4);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=45+Math.random()*200;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:.35+Math.random()*.35,max:.7,size:2+Math.random()*5,color,rot:Math.random()*6});}if(particles.length>420)particles.splice(0,particles.length-420);}
  function event(kind,data){
    if(kind==='hit')note('hit',Math.floor(game.combo/2)+Math.floor(game.time*3)%3);
    if(kind==='break'){
      const {tile,combo,points}=data;burst(tile.x+29,tile.y+29,palette[tile.color],tile.type==='bomb'?22:12);labels.push({x:tile.x+29,y:tile.y+25,text:'+'+points,life:.75,color:outlines[tile.color]});
      if(combo>=3){$('combo').firstElementChild.textContent=combo;comboTime=1.4;$('combo').classList.add('show');$('combo').classList.remove('pop');void $('combo').offsetWidth;$('combo').classList.add('pop');}
      shake=Math.min(4,shake+1.2);
    }
    if(kind==='bomb'){burst(data.x,data.y,'#c18b6b',18);rings.push({x:data.x,y:data.y,r:12,life:.4,color:'#b17a5a'});shake=7;note('bomb');}
    if(kind==='pickup'){labels.push({x:data.x,y:data.y,text:'+5',life:1,color:'#5b7352'});burst(data.x,data.y,'#a8bf8c',10);note('pickup');}
    if(kind==='fire'){note(data.fury?'power':'launch');if(data.fury)toast('power');}
    if(kind==='wave')toast('next',{wave:game.wave},1.5);
    if(kind==='clear'){toast('clear');note('pickup');}
    if(kind==='over'){modal='over';saveBest();}
    if(kind==='state'){if(game.state==='paused'&&modal!=='help')modal='paused';if(game.state==='aim'||game.state==='volley')modal=null;sync();}
  }
  const game=new Game(event);
  function saveBest(){if(game.score>best){best=game.score;try{localStorage.setItem('boopland-marble-rush-best',String(best));}catch{}}}
  function sync(){
    $('score').textContent=String(game.score).padStart(5,'0');$('best').textContent=String(Math.max(best,game.score)).padStart(5,'0');$('wave').textContent=String(game.wave).padStart(2,'0');$('balls').textContent=game.count;
    $('energy-fill').style.width=game.energy+'%';$('energy-number').textContent=game.energy+'%';$('energy-track').setAttribute('aria-valuenow',game.energy);$('energy-track').parentElement.classList.toggle('full',game.energy===100);
    if(lastEnergy<100&&game.energy===100)toast('full',{},2.5);lastEnergy=game.energy;
    $('fury').disabled=game.state!=='aim'||game.energy<100;$('fury').setAttribute('aria-pressed',String(game.armed));$('fury').title=t('furyTip');
    $('recall').hidden=game.state!=='volley';$('recall').disabled=game.shotTime<2;
    $('speed').textContent=game.speed+'×';$('speed').setAttribute('aria-pressed',String(game.speed===2));
    $('pause').disabled=['intro','over'].includes(game.state);$('pause').textContent=game.state==='paused'?'▷':'Ⅱ';$('pause').setAttribute('aria-label',t(game.state==='paused'?'resume':'pause'));
    $('sound').textContent=sound?'♪':'♩';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',t(sound?'mute':'unmute'));
    $('status').textContent=t(game.armed?'armed':game.state==='volley'?'returning':game.state==='settle'?'settle':game.state==='paused'?'paused':'ready',{n:game.balls.length+game.queued});
    $('stage').classList.toggle('fury',game.fury||game.armed);
    const show=['intro','paused','over'].includes(game.state);$('overlay').hidden=!show;
    if(show){
      const intro=game.state==='intro',help=modal==='help',over=game.state==='over';
      $('overlay-title').textContent=t(help?'helpTitle':over?'over':intro?'name':'paused');$('overlay-kicker').textContent=t(over?'overKicker':'kicker');
      $('overlay-description').textContent=t(over?'overText':intro||help?'intro':'pauseText');
      $('instructions').hidden=!(intro||help);$('start').textContent=t(over?'restart':intro?'start':'resume');$('restart').hidden=intro||over||help;
      $('result').hidden=!over;$('result').replaceChildren();
      if(over){const block=document.createElement('div'),score=document.createElement('strong');score.textContent=game.score;block.append(score,document.createTextNode(t('result',{wave:game.wave-1,combo:game.bestCombo})));$('result').append(block);}
    }
    if(oldState!==game.state){if(show){lastFocus=document.activeElement;$('start').focus({preventScroll:true});}else if(['paused','intro','over'].includes(oldState)){canvas.focus({preventScroll:true});}oldState=game.state;}
  }
  function startAction(){unlock();if(game.state==='intro'){modal=null;game.start();}else if(game.state==='paused'){modal=null;game.pause();}else if(game.state==='over')restart();sync();}
  function restart(){saveBest();game.reset();particles=[];rings=[];labels=[];comboTime=0;toastTime=0;$('toast').hidden=true;lastEnergy=45;modal=null;game.start();sync();}
  $('start').addEventListener('click',startAction);$('restart').addEventListener('click',restart);
  $('pause').addEventListener('click',()=>{unlock();modal=null;keyAxis=0;game.pause();});
  $('help').addEventListener('click',()=>{if(game.state==='intro'||game.state==='over')return;if(game.state!=='paused'){modal='help';game.pause();}modal='help';sync();});
  $('sound').addEventListener('click',()=>{sound=!sound;try{localStorage.setItem('boopland-marble-rush-sound',sound?'on':'off');}catch{}if(sound){unlock();note('pickup');}else audio?.suspend().catch(()=>{});sync();});
  $('speed').addEventListener('click',()=>{game.speed=game.speed===1?2:1;sync();});
  $('recall').addEventListener('click',()=>{game.recall();sync();});
  $('fury').addEventListener('click',()=>{unlock();if(game.toggleFury()){if(game.armed)toast('armed');else{$('toast').hidden=true;toastTime=0;}sync();}});
  function position(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
  canvas.addEventListener('pointerdown',e=>{if(game.state!=='aim'||e.button>0||pointer!==null)return;unlock();canvas.focus({preventScroll:true});pointer=e.pointerId;canvas.setPointerCapture(pointer);const p=position(e);game.aim(p.x,p.y);});
  canvas.addEventListener('pointermove',e=>{if(game.state!=='aim'||(pointer!==null&&pointer!==e.pointerId))return;if(e.pointerType==='mouse'||pointer!==null){const p=position(e);game.aim(p.x,p.y);}});
  canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(game.state==='aim'){const p=position(e);game.aim(p.x,p.y);game.fire();sync();}});
  canvas.addEventListener('pointercancel',()=>{pointer=null;});canvas.addEventListener('lostpointercapture',()=>{pointer=null;});
  window.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;
    if(e.code==='Space'&&e.target.closest('button,a'))return;
    if(['ArrowLeft','ArrowRight','Space','KeyP','Escape','KeyF'].includes(e.code))e.preventDefault();
    if(e.code==='ArrowLeft')keyAxis=-1;if(e.code==='ArrowRight')keyAxis=1;
    if(e.repeat)return;
    if(e.code==='Space'){unlock();if(['intro','over','paused'].includes(game.state))startAction();else game.fire();}
    if(e.code==='KeyP'||e.code==='Escape'){unlock();modal=null;game.pause();}
    if(e.code==='KeyF'){$('fury').click();}sync();
  });
  window.addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='ArrowRight')keyAxis=0;});
  function autoPause(){keyAxis=0;pointer=null;if(['volley','aim','settle'].includes(game.state)){modal=null;game.pause();}audio?.suspend().catch(()=>{});previousTime=0;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();else previousTime=0;});window.addEventListener('blur',autoPause);window.addEventListener('pagehide',()=>{autoPause();saveBest();});
  window.addEventListener('boopland:languagechange',()=>{sync();if(toastTime>0)$('toast').textContent=t(toastKey,toastValues);});
  function resize(){const r=$('stage').getBoundingClientRect();scale=Math.max(.1,Math.min(r.width/W,r.height/H));dpr=Math.min(devicePixelRatio||1,2);canvas.style.width=W*scale+'px';canvas.style.height=H*scale+'px';canvas.width=Math.round(W*scale*dpr);canvas.height=Math.round(H*scale*dpr);}
  new ResizeObserver(resize).observe($('stage'));resize();
  function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function circle(x,y,r,fill,stroke,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function text(value,x,y,size=12,color='#737c6d',weight=400){ctx.font=`${weight} ${size}px "Segoe UI","Microsoft YaHei",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);}
  function tilePath(x,y,w,h,j=0){ctx.beginPath();ctx.moveTo(x+5,y+j);ctx.lineTo(x+w-5,y+.8);ctx.quadraticCurveTo(x+w,y,x+w+.6,y+5);ctx.lineTo(x+w-.5,y+h-5);ctx.quadraticCurveTo(x+w,y+h,x+w-5,y+h);ctx.lineTo(x+5,y+h-.4);ctx.quadraticCurveTo(x,y+h,x,y+h-5);ctx.lineTo(x+.6,y+5);ctx.quadraticCurveTo(x,y,x+5,y+j);ctx.closePath();}
  function drawTile(tile){
    let {x,y,w,h}=tile;const hit=tile.hit>0?tile.hit/.1:0;ctx.save();if(hit&&!reduced.matches){ctx.translate(x+w/2,y+h/2);ctx.scale(1+hit*.035,1-hit*.03);ctx.translate(-x-w/2,-y-h/2);}
    tilePath(x+1.5,y+2.5,w,h);ctx.fillStyle='#5663430d';ctx.fill();tilePath(x,y,w,h);ctx.fillStyle=tile.type==='bomb'?'#e7c6b3':palette[tile.color];ctx.fill();ctx.strokeStyle=tile.type==='bomb'?'#ac795e':outlines[tile.color];ctx.lineWidth=1.3;ctx.stroke();
    ctx.globalAlpha=.27;tilePath(x+2.2,y+1.8,w-4,h-4,.5);ctx.lineWidth=.7;ctx.stroke();
    ctx.save();ctx.clip();for(let j=0;j<4;j++)line(x+5+j*7,y+h-5,x+14+j*7,y+h-12,ctx.strokeStyle,.7);ctx.restore();ctx.globalAlpha=1;
    if(hit){tilePath(x,y,w,h);ctx.fillStyle=`rgba(255,254,247,${hit*.5})`;ctx.fill();}
    if(tile.type==='bomb'){ctx.save();ctx.translate(x+w/2,y+22);ctx.rotate(tile.id*.17);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);line(0,-6,0,-15,'#955c43',2.8);}circle(0,0,5,'#955c43');ctx.restore();text(tile.hp,x+w/2,y+46,13,'#895339',600);}
    else{text(tile.hp,x+w/2,y+h/2,23,'#4f5c49',600);if(tile.hp<tile.max*.5){line(x+w-8,y+1,x+w-15,y+11,'#7c866f88');line(x+w-15,y+11,x+w-11,y+16,'#7c866f88');}}
    ctx.restore();
  }
  function render(dt){
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);ctx.save();
    if(shake>0&&!reduced.matches)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake=Math.max(0,shake-dt*30);
    ctx.strokeStyle='#a7b39728';ctx.lineWidth=.7;for(let y=45;y<620;y+=34)line(20,y,W-20,y,'#a7b39722');
    line(14,42,14,DANGER,'#a7b39788');line(W-14,42,W-14,DANGER,'#a7b39788');
    ctx.setLineDash([4,7]);line(20,DANGER,W-20,DANGER,'#b88d795a');ctx.setLineDash([]);text(t('danger'),W/2,DANGER+13,10,'#b18b74');
    for(const tile of game.tiles)if(tile.hp>0)drawTile(tile);
    for(const p of game.pickups){circle(p.x,p.y,17,'#eff3e5','#8da279',1.2);circle(p.x+.5,p.y-.7,14,null,'#8da27955',.7);text('+5',p.x,p.y,14,'#60794f',600);}
    if(game.state==='aim'){
      const path=game.trajectory();ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);for(const p of path.slice(1))ctx.lineTo(p.x,p.y);ctx.strokeStyle=game.armed?'#b7804eaa':'#758c6199';ctx.lineWidth=1.7;ctx.setLineDash([3,8]);ctx.stroke();ctx.setLineDash([]);const end=path.at(-1);circle(end.x,end.y,8,null,game.armed?'#b7804e':'#758c61');
    }
    for(const b of game.balls){
      b.trail??=[];if(game.state==='volley')b.trail.push({x:b.x,y:b.y});if(b.trail.length>4)b.trail.shift();
      if(!reduced.matches){ctx.beginPath();b.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=game.fury?'#c78e6255':'#8b9e6a40';ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();}
      circle(b.x+1,b.y+1,5.5,'#4b60481c');circle(b.x,b.y,b.r,game.fury?'#d5a36f':'#a5bc8a',game.fury?'#a47041':'#566e44',1.1);circle(b.x-1.6,b.y-1.8,1.6,'#fffef7');
    }
    for(const ring of rings){ctx.globalAlpha=Math.max(0,ring.life/.4);circle(ring.x,ring.y,ring.r,null,ring.color,2);ctx.globalAlpha=1;}
    for(const p of particles){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.65);ctx.strokeStyle='#67705255';ctx.lineWidth=.7;ctx.strokeRect(-p.size/2,-p.size/2,p.size,p.size*.65);ctx.restore();}
    for(const l of labels){ctx.globalAlpha=Math.min(1,l.life*2);text(l.text,l.x,l.y,15,l.color,600);ctx.globalAlpha=1;}
    const x=game.state==='volley'?(game.nextOrigin??game.origin):game.origin;
    circle(x,FLOOR,15,'#f3f0e3','#b8c3a9');circle(x,FLOOR,7,game.armed?'#d5a36f':'#a5bc8a','#5b7352',1.5);circle(x-2,FLOOR-2,2,'#fffef7');
    text('×'+(game.state==='volley'?game.returned:game.count),clamp(x,44,W-44),FLOOR+28,13,'#69795c',600);
    if(game.state==='aim')text(t('aim'),W/2,20,11,'#859078');
    ctx.restore();
  }
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function frame(now){
    const dt=previousTime?Math.min((now-previousTime)/1000,.05):0;previousTime=now;
    if(!document.hidden){
      if(game.state!=='paused'){
        if(keyAxis)game.turn(keyAxis*dt*1.3);game.update(dt);
        for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;p.rot+=dt*3;}particles=particles.filter(p=>p.life>0);
        for(const r of rings){r.life-=dt;r.r+=dt*310;}rings=rings.filter(r=>r.life>0);
        for(const l of labels){l.life-=dt;l.y-=dt*34;}labels=labels.filter(l=>l.life>0);
        if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}
        if(comboTime>0){comboTime-=dt;if(comboTime<=0)$('combo').classList.remove('show');}
      }
      uiTime+=dt;if(uiTime>.08){uiTime=0;sync();}render(dt);
    }
    requestAnimationFrame(frame);
  }
  sync();requestAnimationFrame(frame);
})();
