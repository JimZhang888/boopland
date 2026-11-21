// Compare the two unions of opaque pixels. Layer order and puppet identity play no part.
function compareShadowMasks(target, targetArea, actual) {
  let cast=0, hit=0;
  for(let i=3;i<actual.length;i+=4) {
    if(actual[i]<128) continue;
    cast++;
    if(target[i]>=128) hit++;
  }
  const coverage=hit/targetArea;
  const spill=cast ? (cast-hit)/cast : 0;
  return {coverage,spill,matched:coverage>=.86 && spill<=.14};
}

(() => {
  'use strict';
  const { parts, scenes, width: W, height: H } = ShadowPatterns;
  const $ = id => document.getElementById(id);
  const screen = $('screen'), context = screen.getContext('2d');
  const words = (key, values) => BooplandI18n.t('shadowTheatre.' + key, values);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rad = degrees => degrees * Math.PI / 180;
  const makeCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
  const scratch = makeCanvas(240, 240).getContext('2d', {willReadFrequently:true});
  const boundsCache = new Map();
  const sampleScale = .75;
  const mask = makeCanvas(Math.ceil(W*sampleScale), Math.ceil(H*sampleScale)).getContext('2d', {willReadFrequently:true});
  let sceneIndex = 0, actors = [], selected = 0, solved = false, held = null;
  let targetPixels, targetCount, stencil, targetBox, matched = false;
  let frame = 0, checkDirty = true, mapping = {x:0,y:0,k:1};
  const isLast = () => sceneIndex === scenes.length-1;
  function pose(kind, values) {
    const [x,y,distance,angle] = values;
    return {kind,x,y,distance,angle};
  }
  function atJoint(ctx, actor) {
    const joint = parts[actor.kind].joint;
    ctx.translate(joint[0],joint[1]);
    ctx.rotate(rad(actor.angle));
  }
  function drawCut(ctx, cut, painted) {
    ctx.fillStyle = painted ? cut.color : '#333c32';
    ctx.fill(cut.shape, 'evenodd');
    if (!painted) return;
    ctx.save();
    ctx.clip(cut.shape,'evenodd');
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.lineWidth=1.5; ctx.strokeStyle='#433d35'; ctx.stroke(cut.shape);
    ctx.strokeStyle='#e2c89a'; ctx.lineWidth=1.05; ctx.stroke(cut.etch);
    ctx.restore();
  }
  function drawLocal(ctx, actor, painted) {
    const puppet=parts[actor.kind];
    for(const cut of puppet.fixed) drawCut(ctx,cut,painted);
    if(!puppet.moving) return;
    ctx.save();
    atJoint(ctx,actor);
    for(const cut of puppet.moving) drawCut(ctx,cut,painted);
    if(painted) {
      ctx.fillStyle='#d3b47a';ctx.strokeStyle='#65513d';ctx.lineWidth=.9;
      ctx.beginPath();ctx.arc(0,0,3.6,0,2*Math.PI);ctx.fill();ctx.stroke();
      ctx.fillStyle='#6f5941';ctx.fillRect(-1.25,-.5,2.5,1);
    }
    ctx.restore();
  }
  function drawActor(ctx, actor, painted) {
    ctx.save(); ctx.translate(actor.x,actor.y);
    const scale=100/actor.distance;ctx.scale(scale,scale);
    drawLocal(ctx,actor,painted);ctx.restore();
  }
  function bounds(actor) {
    const key=actor.kind+'/'+actor.angle;
    if(boundsCache.has(key)) return boundsCache.get(key);
    scratch.clearRect(0,0,240,240);scratch.save();scratch.translate(120,120);
    drawLocal(scratch,actor,false);scratch.restore();
    const data=scratch.getImageData(0,0,240,240).data;
    let left=239,right=0,top=239,bottom=0;
    for(let y=0;y<240;y++) for(let x=0;x<240;x++) {
      if(data[(y*240+x)*4+3]<40) continue;
      left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);
    }
    const box={l:left-120,r:right-120,t:top-120,b:bottom-120};
    boundsCache.set(key,box);return box;
  }
  function worldBox(actor) {
    const b=bounds(actor), s=100/actor.distance;
    return {l:actor.x+b.l*s,r:actor.x+b.r*s,t:actor.y+b.t*s,b:actor.y+b.b*s};
  }
  function confine(actor) {
    const b=bounds(actor),s=100/actor.distance;
    actor.x=clamp(actor.x,3-b.l*s,W-3-b.r*s);
    actor.y=clamp(actor.y,3-b.t*s,H-3-b.b*s);
  }
  function pixels(list) {
    mask.setTransform(1,0,0,1,0,0);
    mask.clearRect(0,0,mask.canvas.width,mask.canvas.height);
    mask.setTransform(sampleScale,0,0,sampleScale,0,0);
    list.forEach(actor=>drawActor(mask,actor,false));
    return mask.getImageData(0,0,mask.canvas.width,mask.canvas.height).data;
  }
  function measure() {
    const actual=pixels(actors);
    const score=compareShadowMasks(targetPixels,targetCount,actual);
    const {coverage,spill}=score;
    matched=score.matched;
    $('coverage').textContent=Math.floor(100*coverage)+'%';
    $('spill').textContent=Math.ceil(100*spill)+'%';
    $('coverage-bar').style.width=100*coverage+'%';$('spill-bar').style.width=100*spill+'%';
    checkDirty=false;
  }
  function buildTarget(goals) {
    targetPixels=pixels(goals);targetCount=0;
    for(let i=3;i<targetPixels.length;i+=4) if(targetPixels[i]>=128) targetCount++;
    const boxes=goals.map(worldBox);
    targetBox={l:Math.min(...boxes.map(b=>b.l)),r:Math.max(...boxes.map(b=>b.r)),t:Math.min(...boxes.map(b=>b.t)),b:Math.max(...boxes.map(b=>b.b))};
    const tex=makeCanvas(W*2,H*2), t=tex.getContext('2d');
    t.scale(2,2);goals.forEach(a=>drawActor(t,a,false));
    t.globalCompositeOperation='source-in';t.fillStyle='#d5cbaa';t.fillRect(0,0,W,H);
    t.globalCompositeOperation='source-atop';
    t.beginPath();for(let x=-H;x<W;x+=5){t.moveTo(x,0);t.lineTo(x+H,H);}
    t.strokeStyle='#98977b';t.lineWidth=.95;t.stroke();
    const outlined=makeCanvas(W*2,H*2),o=outlined.getContext('2d');
    o.scale(2,2);
    for(const [x,y] of [[-1,0],[1,0],[0,-1],[0,1]]) o.drawImage(tex,x,y,W,H);
    o.globalCompositeOperation='source-in';o.fillStyle='#797d65';o.fillRect(0,0,W,H);
    o.globalCompositeOperation='source-over';o.drawImage(tex,0,0,W,H);
    stencil=outlined;
  }
  function fitCanvas(canvas) {
    const box=canvas.getBoundingClientRect();
    const dpr=Math.min(2.5,window.devicePixelRatio||1);
    const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    return {w:box.width,h:box.height,dpr};
  }
  function preview(canvas, list, box, pad) {
    const {w,h,dpr}=fitCanvas(canvas);if(!w||!h)return;
    const k=Math.min((w-pad*2)/(box.r-box.l),(h-pad*2)/(box.b-box.t));
    if(k<=0)return;
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.translate((w-k*(box.r+box.l))/2,(h-k*(box.b+box.t))/2);
    ctx.scale(k,k);list.forEach(a=>drawActor(ctx,a,true));
  }
  function illustrations() {
    const goals=scenes[sceneIndex].pieces.map(p=>pose(p.kind,p.goal));
    preview($('reference'),goals,targetBox,9);
    Array.from($('cast').children).forEach((btn,i)=>{
      const a=pose(actors[i].kind,[0,0,100,0]);
      preview(btn.firstChild,[a],worldBox(a),2.5);
    });
  }
  const gripOffset={flight:[-43,-42],tail:[-45,-34],scholar:[34,-9],parasol:[2,-60]};
  function grip(actor) {
    const joint=parts[actor.kind].joint;
    if(!joint || !scenes[sceneIndex].hinge)return null;
    const s=100/actor.distance,c=Math.cos(rad(actor.angle)),n=Math.sin(rad(actor.angle));
    const [dx,dy]=gripOffset[actor.kind],px=actor.x+joint[0]*s,py=actor.y+joint[1]*s;
    return {px,py,x:px+s*(dx*c-dy*n),y:py+s*(dx*n+dy*c)};
  }
  function drawHandle(ctx,actor,k) {
    const g=grip(actor);
    if(!g)return;
    ctx.save();ctx.lineWidth=1.2/k;ctx.strokeStyle='#f1dba0';ctx.setLineDash([3/k,4/k]);
    ctx.beginPath();ctx.moveTo(g.px,g.py);ctx.lineTo(g.x,g.y);ctx.stroke();
    ctx.setLineDash([]);ctx.translate(g.x,g.y);ctx.scale(1/k,1/k);
    ctx.lineWidth=1.25;ctx.fillStyle='#f7ebc9';ctx.strokeStyle='#6c6652';
    ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,4,-1.7,2.4);ctx.moveTo(-4,1);ctx.lineTo(-3,3.6);ctx.lineTo(-.7,2.2);ctx.stroke();
    ctx.restore();
  }
  function draw() {
    frame=0;
    const {w,h,dpr}=fitCanvas(screen);if(!w||!h)return;
    const k=Math.min(w/W,h/H),x=(w-W*k)/2,y=(h-H*k)/2;
    mapping={x,y,k};
    context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,w,h);
    context.translate(x,y);context.scale(k,k);
    if(!solved) context.drawImage(stencil,0,0,W,H);
    if(!solved) actors.forEach((a,i)=>{
      const endX=a.x+(i%2===0?-35:35);
      context.beginPath();context.moveTo(a.x,a.y);context.lineTo(endX,H+y/k+2);
      context.strokeStyle=i===selected?'#76655593':'#8b776553';context.lineWidth=1.1/k;context.stroke();
    });
    actors.forEach(a=>drawActor(context,a,true));
    if(!solved) {
      const a=actors[selected];
      context.beginPath();context.arc(a.x,a.y,3.5/k,0,Math.PI*2);
      context.fillStyle='#d5b479';context.strokeStyle='#584e3e';context.lineWidth=1/k;context.fill();context.stroke();
      drawHandle(context,a,k);
    }
    if(checkDirty) measure();
  }
  function redraw() {if(!frame)frame=requestAnimationFrame(draw);}
  function change() {checkDirty=true;redraw();}
  function check() {
    if(solved)return;
    if(checkDirty)measure();
    if(matched) {
      solved=true;$('success').hidden=false;
      updateControls();redraw();$('next').focus({preventScroll:true});
    }
  }
  function updateControls() {
    const a=actors[selected],scene=scenes[sceneIndex];
    $('distance-row').hidden=!scene.depth;
    $('angle-row').hidden=!scene.hinge||!parts[a.kind].moving;
    $('adjust').hidden=!scene.depth || solved;
    $('distance').value=a.distance;$('distance-value').textContent=a.distance+'%';
    $('angle').value=a.angle;$('angle-value').textContent=a.angle+'°';
    Array.from($('cast').children).forEach((btn,i)=>{
      btn.setAttribute('aria-pressed',String(i===selected));btn.disabled=solved;
    });
    $('steps').replaceChildren(...scenes.map((_,i)=>{
      const dot=document.createElement('i');dot.className=i<sceneIndex||i===sceneIndex&&solved?'done':i===sceneIndex?'current':'';return dot;
    }));
  }
  function localize() {
    $('act').textContent=words('act',{n:String(sceneIndex+1).padStart(2,'0')})+' / 06';
    $('scene').textContent=words('scene'+(sceneIndex+1));$('cue').textContent=words('hint'+(sceneIndex+1));
    $('result').textContent=words(isLast()?'finale':'matched');
    $('next-label').textContent=words(isLast()?'again':'next');
    Array.from($('cast').children).forEach((btn,i)=>{
      const kind=actors[i].kind;
      const duplicates=actors.filter(a=>a.kind===kind).length>1;
      const label=words(kind)+(duplicates?' '+(i+1):'');
      btn.lastChild.textContent=label;btn.setAttribute('aria-label',label);
    });
    updateControls();illustrations();redraw();
  }
  function select(i) {selected=i;updateControls();redraw();}
  function dropPointer() {
    if(!held)return;
    const id=held.id;held=null;screen.classList.remove('held');
    if(screen.hasPointerCapture(id))screen.releasePointerCapture(id);
  }
  function openScene(i) {
    dropPointer();sceneIndex=i;selected=0;solved=false;checkDirty=true;
    const scene=scenes[i];
    actors=scene.pieces.map(p=>pose(p.kind,p.start));actors.forEach(confine);
    buildTarget(scene.pieces.map(p=>pose(p.kind,p.goal)));
    $('success').hidden=true;
    $('cast').replaceChildren(...actors.map((a,j)=>{
      const b=document.createElement('button');b.type='button';b.className='cast-piece';
      const icon=document.createElement('canvas');icon.setAttribute('aria-hidden','true');
      b.append(icon,document.createElement('span'));b.addEventListener('click',()=>select(j));return b;
    }));
    localize();measure();redraw();
  }
  function worldPoint(e) {
    const box=screen.getBoundingClientRect(),m=mapping;
    return {x:(e.clientX-box.left-m.x)/m.k,y:(e.clientY-box.top-m.y)/m.k};
  }
  function hit(actor,p) {
    const scale=actor.distance/100;
    const x=(p.x-actor.x)*scale,y=(p.y-actor.y)*scale,part=parts[actor.kind];
    const on=(cuts,x,y)=>cuts.some(c=>scratch.isPointInPath(c.shape,x,y,'evenodd'));
    if(on(part.fixed,x,y))return true;
    if(!part.moving)return false;
    const dx=x-part.joint[0],dy=y-part.joint[1],ang=rad(-actor.angle);
    return on(part.moving,dx*Math.cos(ang)-dy*Math.sin(ang),dx*Math.sin(ang)+dy*Math.cos(ang));
  }
  function pick(p,e) {
    const order=[selected,...actors.map((_,i)=>i).reverse().filter(i=>i!==selected)];
    for(const delta of [0,(e.pointerType==='touch'?7:3)/mapping.k]) {
      for(const id of order) {
        const offsets=delta ? [[delta,0],[-delta,0],[0,delta],[0,-delta]] : [[0,0]];
        if(offsets.some(([x,y])=>hit(actors[id],{x:p.x+x,y:p.y+y})))return id;
      }
    }
    return selected;
  }
  screen.addEventListener('pointerdown', e=>{
    if(solved||held||e.button!==0||!$('help-panel').hidden)return;
    const p=worldPoint(e),g=grip(actors[selected]);
    const rotate=g && Math.hypot(g.x-p.x,g.y-p.y)*mapping.k<=(e.pointerType==='touch'?13:9);
    if(!rotate)select(pick(p,e));
    const a=actors[selected];
    held={id:e.pointerId,p,x:a.x,y:a.y,rotate,angle:a.angle,
      initial:rotate?Math.atan2(p.y-g.py,p.x-g.px):0};
    screen.setPointerCapture(e.pointerId);screen.classList.add('held');
    screen.focus({preventScroll:true});e.preventDefault();
  });
  function movePointer(e) {
    if(!held||e.pointerId!==held.id)return;
    const p=worldPoint(e),a=actors[selected];
    if(held.rotate) {
      const g=grip(a),diff=Math.atan2(p.y-g.py,p.x-g.px)-held.initial;
      const degrees=Math.atan2(Math.sin(diff),Math.cos(diff))*180/Math.PI;
      a.angle=clamp(Math.round(held.angle+degrees),-65,65);
      $('angle').value=a.angle;$('angle-value').textContent=a.angle+'°';
    } else {a.x=held.x+p.x-held.p.x;a.y=held.y+p.y-held.p.y;}
    confine(a);change();
  }
  screen.addEventListener('pointermove',movePointer);
  screen.addEventListener('pointerup',e=>{if(held?.id===e.pointerId){movePointer(e);dropPointer();check();}});
  for(const type of ['pointercancel','lostpointercapture'])screen.addEventListener(type,e=>{if(held?.id===e.pointerId)dropPointer();});
  screen.addEventListener('keydown',e=>{
    const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!dirs[e.key]||solved||held)return;e.preventDefault();
    const [dx,dy]=dirs[e.key],a=actors[selected],step=e.shiftKey?1:5;
    a.x+=dx*step;a.y+=dy*step;confine(a);change();
  });
  screen.addEventListener('keyup',e=>{if(e.key.startsWith('Arrow'))check();});
  for(const field of ['distance','angle']) {
    $(field).addEventListener('input',()=>{
      if(solved)return;
      const a=actors[selected];a[field]=Number($(field).value);confine(a);
      $(field+'-value').textContent=a[field]+(field==='distance'?'%':'°');change();
    });
    $(field).addEventListener('change',check);
  }
  function help(open) {
    dropPointer();$('help-panel').hidden=!open;$('help').setAttribute('aria-expanded',String(open));
    document.querySelector('.workspace').inert=open;
    (open?$('close-help'):$('help')).focus({preventScroll:true});
  }
  $('help').addEventListener('click',()=>help($('help-panel').hidden));
  $('close-help').addEventListener('click',()=>help(false));
  $('help-panel').addEventListener('click',e=>{if(e.target===$('help-panel'))help(false);});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('help-panel').hidden)help(false);});
  window.addEventListener('blur',dropPointer);
  window.addEventListener('boopland:languagechange',localize);
  $('reset').addEventListener('click',()=>openScene(sceneIndex));
  $('next').addEventListener('click',()=>{if(solved){openScene(isLast()?0:sceneIndex+1);screen.focus({preventScroll:true});}});
  openScene(0);
  const observer=new ResizeObserver(()=>{dropPointer();illustrations();redraw();});
  observer.observe(screen);observer.observe($('reference'));observer.observe($('cast'));
})();
