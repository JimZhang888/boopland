(() => {
  'use strict';
  const E=window.PaperStack,$=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
  const t=(key,values)=>BooplandI18n.t('paperStack.'+key,values);
  const palette=[['#d6dfc3','#b6c6a2','#c3d0b1'],['#dce5d6','#b5c9b1','#c9d7c0'],['#d5e3df','#a8c4bd','#bdd2cc'],['#d8e3e8','#b1c8d0','#c2d6db'],['#e5dce1','#c9b8c0','#d7c9d0'],['#ecdccf','#d3b9a3','#e0cbb8'],['#e8e1bd','#d0c594','#dfd5a8']];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let game=E.createGame(),mode='ready',best=readBest(),startBest=best,sound=read('boopland-stack-sound')==='on';
  let audio=null,particles=[],debris=[],landing=null,settle=0,camera=0,feedback=null,feedbackTime=0;
  let width=1,height=1,scale=1,last=0,raf=0,clock=0,finishDelay=0;
  const demo=Array.from({length:8},(_,i)=>({x:-80+i*2,z:-80+i*1.5,w:160-i*4,d:160-i*3,y:i*E.STEP}));
  function read(key){try{return localStorage.getItem(key);}catch{return null;}}
  function write(key,value){try{localStorage.setItem(key,String(value));}catch{/* Play remains available without storage. */}}
  function readBest(){const n=Number(read('boopland-stack-best'));return Number.isSafeInteger(n)&&n>=0?n:0;}
  function unlockAudio(){
    if(!sound)return;
    try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{audio=null;}
  }
  function tone(perfect=false,miss=false){
    if(!sound||!audio||audio.state!=='running')return;
    const at=audio.currentTime,notes=miss?[220,165]:perfect?[440,554.37,659.25]:[329.63];
    notes.forEach((frequency,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain(),when=at+i*.065;oscillator.type='sine';oscillator.frequency.value=frequency*(perfect?Math.pow(2,Math.min(game.streak-1,7)/12):1);gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(.045,when+.012);gain.gain.exponentialRampToValueAtTime(.001,when+.22);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(when);oscillator.stop(when+.25);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};});
  }
  function updateUI(){
    $('height').textContent=String(game.score).padStart(2,'0');$('best').textContent=String(best).padStart(2,'0');
    $('stage-note').hidden=mode!=='ready';$('overlay').hidden=mode!=='paused'&&mode!=='over';
    $('action-label').textContent=t({ready:'start',playing:'drop',paused:'resume',over:'again',ending:'again'}[mode]);
    $('action-symbol').textContent=mode==='playing'?'↓':'↗';$('action').disabled=mode==='ending';
    $('hint').textContent=t({ready:'readyHint',playing:'playingHint',paused:'resumeHint',over:'endHint',ending:'endHint'}[mode]);
    $('pause').disabled=!['playing','paused'].includes(mode);$('pause').setAttribute('aria-label',t(mode==='paused'?'resume':'pause'));
    $('pause-symbol').setAttribute('d',mode==='paused'?'m8 5 11 7-11 7Z':'M8 5v14M16 5v14');
    $('restart').hidden=mode!=='paused';
    $('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));
    $('sound-wave').setAttribute('d',sound?'M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14':'m17 9 5 6m0-6-5 6');
    $('result').hidden=mode!=='over';$('result-height').textContent=game.score;
    if(mode==='paused'){$('overlay-title').textContent=t('paused');$('overlay-copy').textContent=t('pauseCopy');$('result-note').textContent='';}
    if(mode==='over'){$('overlay-title').textContent=t('over');$('overlay-copy').textContent=t(game.score>startBest?'newBest':'overCopy');$('result-note').textContent=t('resultNote',{count:game.perfects,streak:game.bestStreak});}
    if(feedback)$('feedback').textContent=t(feedback.key,feedback.values);
  }
  function start(){
    unlockAudio();best=Math.max(best,readBest());startBest=best;game=E.createGame();E.spawn(game);mode='playing';
    debris=[];particles=[];landing=null;settle=0;camera=0;feedback=null;feedbackTime=0;finishDelay=0;$('feedback').hidden=true;
    updateUI();canvas.focus({preventScroll:true});
  }
  function pause(){
    if(mode!=='playing')return;mode='paused';audio?.suspend().catch(()=>{});updateUI();
  }
  function resume(){if(mode!=='paused'||$('help-dialog').open)return;unlockAudio();mode='playing';last=performance.now();updateUI();canvas.focus({preventScroll:true});}
  function flash(key,values){feedback={key,values};feedbackTime=1.25;$('feedback').textContent=t(key,values);$('feedback').hidden=false;}
  function place(){
    if(mode!=='playing'||settle>0)return;
    unlockAudio();const result=E.drop(game);if(!result)return;
    if(result.cut)debris.push({...result.cut,age:0,vx:result.axis==='x'?result.direction*60:0,vz:result.axis==='z'?result.direction*60:0,vy:35,index:game.score+(result.type==='miss'?1:0)});
    if(result.type==='miss'){mode='ending';finishDelay=.65;feedback=null;feedbackTime=0;$('feedback').hidden=true;tone(false,true);updateUI();return;}
    settle=.2;landing={block:result.block,left:.2};
    if(result.type==='perfect'){
      flash(result.bonus?'bonus':result.streak>1?'combo':'perfect',{count:result.streak});tone(true);
      if(!reduced)for(let i=0;i<14;i++)particles.push({x:result.block.x+result.block.w/2,z:result.block.z+result.block.d/2,y:result.block.y+12,age:0,vx:(Math.random()-.5)*210,vz:(Math.random()-.5)*210,vy:90+Math.random()*90,color:palette[game.score%7][1]});
    }else tone();
    if(game.score>best){best=game.score;write('boopland-stack-best',best);}
    updateUI();
  }
  function act(){if($('help-dialog').open)return;if(mode==='ready'||mode==='over')start();else if(mode==='paused')resume();else place();}
  function resize(){
    const rect=$('stage').getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    scale=Math.min(width/550,height/440,1.4);ctx.setTransform(ratio,0,0,ratio,0,0);render();
  }
  function project(x,z,y){return {x:width/2+(x-z)*.86*scale,y:height*.79+(x+z)*.36*scale-(y-camera)*scale};}
  function polygon(points,fill,stroke='#6f7d65',opacity=1){
    ctx.globalAlpha=opacity;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=.85;ctx.lineJoin='round';ctx.stroke();ctx.globalAlpha=1;
  }
  function line(points,color='#a4ac98',dash=[]){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=.8;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
  function block(b,index,opacity=1){
    const p=palette[index%palette.length],a=project(b.x,b.z,b.y),c=project(b.x+b.w,b.z+b.d,b.y),r=project(b.x+b.w,b.z,b.y),l=project(b.x,b.z+b.d,b.y);
    if(Math.max(a.y,c.y)<-80||Math.min(a.y,c.y)>height+100)return;
    const down=v=>({x:v.x,y:v.y+E.STEP*scale});
    polygon([l,c,down(c),down(l)],p[2],'#77806c',opacity);polygon([r,c,down(c),down(r)],p[1],'#77806c',opacity);polygon([a,r,c,l],p[0],'#738069',opacity);
    ctx.save();ctx.globalAlpha=.2*opacity;
    line([{x:a.x+2,y:a.y+3},{x:r.x-3,y:r.y+3},{x:c.x-2,y:c.y-2},{x:l.x+3,y:l.y-2}], '#536047');
    // Fixed, slightly irregular pencil marks; the texture never jitters between frames.
    for(let j=1;j<5;j++){const f=j/6;const v={x:r.x+(c.x-r.x)*f,y:r.y+(c.y-r.y)*f};line([{x:v.x,y:v.y+4*scale},{x:v.x-4*scale,y:v.y+16*scale}], '#637154');}
    if(b.w>50&&b.d>50){const x=b.x+b.w*.2,z=b.z+b.d*.25;line([project(x,z,b.y+.5),project(x+b.w*.33,z+1,b.y+.5)],'#97a28a');}
    ctx.restore();ctx.globalAlpha=1;
  }
  function cloud(x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.strokeStyle='#b6beac';ctx.fillStyle='#f7f8ee90';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-35,10);ctx.bezierCurveTo(-53,8,-48,-14,-31,-13);ctx.bezierCurveTo(-28,-39,8,-39,13,-15);ctx.bezierCurveTo(34,-24,47,3,27,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-33,14);ctx.quadraticCurveTo(0,17,28,13);ctx.stroke();ctx.restore();}
  function backdrop(){
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle='#e9ecdf';ctx.lineWidth=.65;
    for(let y=25;y<height;y+=34){ctx.beginPath();ctx.moveTo(18,y);ctx.lineTo(width-18,y);ctx.stroke();}
    const drift=reduced?0:Math.sin(clock*.18)*5;
    cloud(width*.19+drift,height*.33,Math.min(.8,scale));cloud(width*.82-drift,height*.17,Math.min(.65,scale));
    const ruler=width-22;ctx.strokeStyle='#c7ceba';ctx.beginPath();ctx.moveTo(ruler,height*.24);ctx.lineTo(ruler,height*.77);
    for(let i=0;i<13;i++){const y=height*.24+i*height*.53/12;ctx.moveTo(ruler,y);ctx.lineTo(ruler-(i%3===0?9:4),y);}ctx.stroke();
    // A soft paper island gives the little tower a place to stand.
    const p=project(0,0,-E.STEP-3);if(p.y<height+70){ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.fillStyle='#e8ecdf';ctx.beginPath();ctx.ellipse(0,12,155,24,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c7cfb8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-150,14);ctx.quadraticCurveTo(-110,31,-58,33);ctx.moveTo(80,31);ctx.quadraticCurveTo(137,24,155,10);ctx.stroke();ctx.restore();}
  }
  function render(){
    backdrop();
    const ready=mode==='ready',blocks=ready?demo:game.blocks;
    blocks.forEach((b,i)=>{const lift=landing&&landing.block===b?16*Math.pow(landing.left/.2,2):0;block(lift?{...b,y:b.y+lift}:b,i);});
    for(const b of debris)block(b,b.index,Math.max(0,1-b.age/1.1));
    if(ready){const top=demo[demo.length-1],offset=reduced?38:Math.sin(clock*.7)*55;block({...top,x:top.x+offset,y:top.y+E.STEP+28},8);}
    else if(game.active){
      const a=game.active,top=game.blocks[game.blocks.length-1];
      const from={...a,[a.axis]:a.origin-E.RANGE},to={...a,[a.axis]:a.origin+E.RANGE};
      line([project(from.x+a.w/2,from.z+a.d/2,a.y),project(to.x+a.w/2,to.z+a.d/2,a.y)],'#b7c3a890',[3,6]);
      // A quiet outline makes the target readable even for a very thin top.
      const y=top.y+E.STEP;
      const corners=[[top.x,top.z],[top.x+top.w,top.z],[top.x+top.w,top.z+top.d],[top.x,top.z+top.d],[top.x,top.z]];
      line(corners.map(([x,z])=>project(x,z,y)),'#809371',[3,4]);block({...a,y:a.y+16},game.score+1);
    }
    for(const p of particles){const at=project(p.x,p.z,p.y);ctx.globalAlpha=Math.max(0,1-p.age/.8);ctx.strokeStyle=p.color;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(at.x-3,at.y);ctx.lineTo(at.x+3,at.y);ctx.moveTo(at.x,at.y-3);ctx.lineTo(at.x,at.y+3);ctx.stroke();}ctx.globalAlpha=1;
  }
  function frame(now){
    raf=0;const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;
    if(mode==='playing'||mode==='ready'||mode==='ending'){
      clock+=dt;
      if(mode==='playing'){
        if(settle>0){settle=Math.max(0,settle-dt);if(landing)landing.left=settle;if(settle===0){landing=null;E.spawn(game);}}
        else E.advance(game,dt);
      }
      const top=mode==='ready'?demo[demo.length-1].y:game.score*E.STEP;
      const target=Math.max(0,top-175);camera+=(target-camera)*Math.min(1,dt*6);
      debris.forEach(b=>{b.age+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.vy-=600*dt;b.y+=b.vy*dt;});debris=debris.filter(b=>b.age<1.1);
      particles.forEach(p=>{p.age+=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.vy-=200*dt;p.y+=p.vy*dt;});particles=particles.filter(p=>p.age<.8);
      if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0){feedback=null;$('feedback').hidden=true;}}
      if(mode==='ending'){finishDelay-=dt;if(finishDelay<=0){mode='over';updateUI();$('action').focus({preventScroll:true});}}
    }
    render();if(!document.hidden)raf=requestAnimationFrame(frame);
  }
  $('action').addEventListener('click',act);$('restart').addEventListener('click',start);
  canvas.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();canvas.focus({preventScroll:true});act();});
  $('pause').addEventListener('click',()=>mode==='paused'?resume():pause());
  $('sound').addEventListener('click',()=>{sound=!sound;write('boopland-stack-sound',sound?'on':'off');if(sound){unlockAudio();tone();}else audio?.suspend().catch(()=>{});updateUI();});
  $('help').addEventListener('click',()=>{pause();$('help-dialog').showModal();});
  $('help-dialog').addEventListener('close',()=>$('help').focus({preventScroll:true}));
  document.addEventListener('keydown',event=>{
    if($('help-dialog').open||event.ctrlKey||event.altKey||event.metaKey||event.repeat)return;
    if(event.code==='Space'||event.code==='Enter'){
      if(event.target.closest('button,a,input,select,textarea'))return;event.preventDefault();act();
    }else if(event.code==='KeyP'||event.code==='Escape'){event.preventDefault();if(mode==='paused')resume();else pause();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){pause();audio?.suspend().catch(()=>{});cancelAnimationFrame(raf);raf=0;}
    else {last=performance.now();if(!raf)raf=requestAnimationFrame(frame);}
  });
  window.addEventListener('pagehide',()=>{pause();cancelAnimationFrame(raf);raf=0;audio?.suspend().catch(()=>{});});
  window.addEventListener('pageshow',()=>{last=performance.now();if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);});
  window.addEventListener('storage',event=>{if(event.key==='boopland-stack-best'){best=Math.max(best,readBest());updateUI();}});
  window.addEventListener('boopland:languagechange',updateUI);
  new ResizeObserver(resize).observe($('stage'));updateUI();resize();last=performance.now();raf=requestAnimationFrame(frame);
})();
