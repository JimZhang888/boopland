(() => {
'use strict';
const { PERFECT_RX, PERFECT_RY, clamp, chargePower, landingPoint, classifyLanding, landingPowerRange } = window.CloudLeapPhysics;
const I18n = window.BooplandI18n;
const t = (key, values) => I18n.t('cloudLeap.' + key, values);

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const jumpButton = $('jump'), overlay = $('overlay');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let width = 1100, height = 534, scale = 1, now = 0, lastFrame = 0, anchorX = .43;
let state = 'ready', chargeStart = 0, power = 0, score = 0, combo = 0, steps = 0, best = 0;
let platforms = [], current = 0, player = {x:0,y:0}, camera = {x:0,y:0}, flight = null;
let particles = [], rings = [], toastUntil = 0, landBounce = 0, sound = false, audioContext;
let activeInput = null, modalMode = '', previousFocus = null;
let frozenAt = null, timeOffset = 0, toastKey = '', toastValues = {};
const gameTime = () => (frozenAt === null ? performance.now() : frozenAt) - timeOffset;
function freeze() { if (frozenAt === null) frozenAt = performance.now(); }
function thaw() { if (frozenAt !== null) { timeOffset += performance.now() - frozenAt; frozenAt = null; } }
let randomState = 123456;
try { const stored = Number(localStorage.getItem('boopland-cloud-leap-best')); best = Number.isFinite(stored) && stored > 0 ? stored : 0; sound = localStorage.getItem('boopland-cloud-leap-sound') === 'on'; } catch {}
$('best').textContent = best;
const rand = () => { randomState = (randomState * 1664525 + 1013904223) >>> 0; return randomState / 4294967296; };
const ellipse = (x,y,rx,ry,color) => {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
const path = (points,fill,stroke,lineWidth=1) => {ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}};
const line = (points,color,lineWidth=1) => {ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
const screen = (x,y) => ({x:width*anchorX+(x-camera.x)*scale,y:height*.65+(y-camera.y)*scale});

function makePlatform(x,y,i) {return {x,y,rx:i===0?83:70-rand()*8,ry:i===0?35:30-rand()*2,seed:rand()*100,kind:i%5};}
function appendPlatform() {
  const last = platforms.at(-1), i = last.index+1;
  const direction = i===1 ? 1 : (i%4===2 || i%4===3 ? -1 : 1);
  const distance = i===1 ? 209 : 172+rand()*83+Math.min(steps,35)*.7;
  const p = makePlatform(last.x+direction*distance,last.y-(84+rand()*34),i);p.index=i;platforms.push(p);
}
function reset() {
  thaw();
  randomState = 64217;state='ready';current=0;score=0;combo=0;steps=0;power=0;activeInput=null;flight=null;
  platforms=[{...makePlatform(0,0,0),index:0}];for(let i=0;i<4;i++)appendPlatform();
  player={x:0,y:0};camera={x:0,y:0};anchorX=width<600?.38:.43;particles=[];rings=[];landBounce=0;
  $('score').textContent='0';$('chapter').textContent=t('chapter0');$('first-hint').style.opacity='1';
  overlay.hidden=true;modalMode='';setPower(0);jumpButton.disabled=false;updateChargeUI(false);updateZone();toastUntil=0;$('toast').classList.remove('show');
}
function resize() {
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;scale=Math.min(width/(width<600?620:770), height/490,1.22);
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
}
new ResizeObserver(resize).observe(canvas);
function setPower(value) {power=value;$('power-fill').style.width=`${value*100}%`;$('power-fill').style.background=value>.86?'#ccab79':'#9dba7b';document.querySelector('.power-track').setAttribute('aria-valuenow',String(Math.round(value*100)));}
// Keep DOM updates small; the meter is also exposed to assistive technology.
function updateChargeUI(charging){jumpButton.classList.toggle('charging',charging);$('jump-label').textContent=t(charging?'charging':'ready');}
function updateZone(){const range=landingPowerRange(player,platforms[current+1]);$('power-zone').style.left=`${range.min*100}%`;$('power-zone').style.width=`${(range.max-range.min)*100}%`;}
function tone(freq,duration=.15,type='sine',volume=.035,delay=0) {
  if(!sound)return;
  try {audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();
    const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+duration+.03);
  } catch {}
}
function begin(input) {
  if(state!=='ready'||!overlay.hidden)return;
  activeInput=input;state='charging';chargeStart=gameTime();setPower(0);updateChargeUI(true);$('first-hint').style.opacity='0';tone(260,.1,'sine',.018);
}
function release(input) {
  if(state!=='charging'||activeInput!==input)return;
  const p=chargePower(gameTime()-chargeStart);setPower(p);activeInput=null;state='jumping';updateChargeUI(false);jumpButton.disabled=true;
  flight={start:{...player},end:landingPoint(player,platforms[current+1],p),startTime:gameTime(),duration:660+p*190,height:100+p*90};
  tone(390,.18,'sine',.035);tone(620,.2,'sine',.022,.07);
}
function cancelCharge(){if(state==='charging'){state='ready';setPower(0);updateChargeUI(false);}activeInput=null;}
function toast(key,values={}){toastKey=key;toastValues=values;$('toast').textContent=t(key,values);$('toast').classList.add('show');toastUntil=gameTime()+1500;}
function burst(x,y,perfect) {
  rings.push({x,y,start:now,perfect});
  for(let i=0;i<(perfect?22:9);i++)particles.push({x,y,z:10,vx:(rand()-.5)*95,vy:(rand()-.5)*48,vz:50+rand()*90,life:1.2+rand()*.5,color:perfect?'#e6c785':['#f5eed4','#9eb982','#e2ce96'][i%3],size:2+rand()*3});
}
function land() {
  const target=platforms[current+1];const result=classifyLanding(player,target);
  if(result!=='miss') {
    current++;steps++;combo=result==='perfect'?combo+1:0;
    const points=result==='perfect'?2+Math.min(combo-1,3):1;score+=points;
    $('score').textContent=score;
    if(score>best){best=score;$('best').textContent=best;try{localStorage.setItem('boopland-cloud-leap-best',String(best));}catch{}}
    if(result==='perfect'){toast(combo>1?'combo':'perfect',{combo,points});tone(660,.3);tone(880,.35,'sine',.03,.1);tone(1100,.4,'sine',.02,.2);}else{toast('land'+steps%4);tone(520,.25);tone(690,.3,'sine',.02,.08);}
    burst(player.x,player.y,result==='perfect');landBounce=1;appendPlatform();
    if(current>3){platforms.shift();current--;}
    const chapter=Math.floor(steps/10)%4;$('chapter').textContent=t('chapter'+chapter);
    state='settling';flight=null;setPower(0);updateZone();
  } else if(classifyLanding(player,platforms[current])!=='miss') {
    state='settling';flight=null;setPower(0);landBounce=.6;combo=0;toast('tryMore');updateZone();
  } else {state='falling';flight={...flight,fallStart:now};tone(240,.35,'sine',.025);}
}
function showModal(mode) {
  cancelCharge();if(overlay.hidden)previousFocus=document.activeElement;modalMode=mode;freeze();overlay.hidden=false;renderModal();
  $('modal-action').focus({preventScroll:true});
}
function renderModal() {
  const content=$('modal-content');content.replaceChildren();
  const add=(tag,text,className='',parent=content)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;parent.append(el);return el;};
  if(modalMode==='help'){
    $('modal-eyebrow').textContent=t('helpEyebrow');$('modal-title').textContent=t('helpTitle');
    const list=add('div','','help-steps');for(let i=1;i<=3;i++){const p=add('p','','',list);add('b',t('help'+i+'Title'),'',p);p.append(document.createElement('br'));p.append(document.createTextNode(t('help'+i)));}
    $('modal-action').textContent=t('helpAction');$('modal-foot').textContent=t('keys');
  }else if(modalMode==='paused'){
    $('modal-eyebrow').textContent=t('pauseEyebrow');$('modal-title').textContent=t('pauseTitle');add('p',t('pauseBody'));$('modal-action').textContent=t('resume');$('modal-foot').textContent=t('keys');
  }else{
    $('modal-eyebrow').textContent=t(score>=best&&score>0?'recordEyebrow':'restEyebrow');$('modal-title').textContent=t('overTitle');
    add('div',String(score),'result-number');add('div',t('result',{steps}),'result-label');add('p',t('bestResult',{best}));add('p',t('overBody'));
    $('modal-action').textContent=t('again');$('modal-foot').textContent=t('overFoot');
  }
}
function closeModal(){overlay.hidden=true;modalMode='';thaw();if(state==='over')reset();(previousFocus instanceof HTMLElement&&!previousFocus.disabled?previousFocus:canvas).focus({preventScroll:true});}
for(const target of [canvas,jumpButton]) {
  target.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();if(state==='ready'&&overlay.hidden){target.setPointerCapture(event.pointerId);begin(event.pointerId);}});
  target.addEventListener('pointerup',event=>{event.preventDefault();release(event.pointerId);});
  target.addEventListener('pointercancel',cancelCharge);target.addEventListener('lostpointercapture',()=>{if(state==='charging')cancelCharge();});
  target.addEventListener('contextmenu',event=>event.preventDefault());
}
document.addEventListener('keydown',event=>{
  if(event.code==='Tab'&&!overlay.hidden){event.preventDefault();$('modal-action').focus();return;}
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat){if(!overlay.hidden)closeModal();else showModal('paused');}return;}
  if(event.code==='KeyR'&&!event.ctrlKey&&!event.metaKey){reset();return;}
  if(event.code==='Space'&&overlay.hidden&&(document.activeElement===document.body||document.activeElement===canvas||document.activeElement===jumpButton)){event.preventDefault();if(!event.repeat)begin('keyboard');}
});
document.addEventListener('keyup',event=>{if(event.code==='Space'){if(activeInput==='keyboard')event.preventDefault();release('keyboard');}});
function backgroundPause(){cancelCharge();if(overlay.hidden&&state!=='over')showModal('paused');if(audioContext)audioContext.suspend().catch(()=>{});}
window.addEventListener('blur',backgroundPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)backgroundPause();});
$('restart').addEventListener('click',reset);$('help').addEventListener('click',()=>showModal('help'));$('pause').addEventListener('click',()=>overlay.hidden?showModal('paused'):closeModal());$('modal-action').addEventListener('click',closeModal);
function updateSound(){ $('sound').classList.toggle('sound-off',!sound);$('sound').setAttribute('aria-label',t(sound?'soundOff':'soundOn'));$('sound').title=t(sound?'soundOff':'soundOn');$('sound').setAttribute('aria-pressed',String(sound)); }
$('sound').addEventListener('click',()=>{sound=!sound;updateSound();try{localStorage.setItem('boopland-cloud-leap-sound',sound?'on':'off');}catch{}if(sound)tone(660,.2);});updateSound();
window.addEventListener('boopland:languagechange',()=>{updateChargeUI(state==='charging');updateSound();$('chapter').textContent=t('chapter'+Math.floor(steps/10)%4);if(toastKey)$('toast').textContent=t(toastKey,toastValues);if(!overlay.hidden)renderModal();});

function cloud(x,y,size,opacity=1) {
  ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle='#f9faee';ctx.beginPath();ctx.moveTo(x-size,y+size*.12);ctx.bezierCurveTo(x-size*1.2,y-size*.1,x-size*.5,y-size*.35,x-size*.4,y-size*.24);ctx.bezierCurveTo(x-size*.2,y-size*.75,x+size*.3,y-size*.6,x+size*.48,y-size*.25);ctx.bezierCurveTo(x+size*.9,y-size*.35,x+size*1.2,y+size*.1,x+size,y+size*.2);ctx.bezierCurveTo(x+size*.5,y+size*.45,x-size*.4,y+size*.35,x-size,y+size*.12);ctx.fill();ctx.restore();
}
function mountains(base,color,offset,amplitude) {
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-50,height+10);ctx.lineTo(-50,base);
  for(let i=-1;i<9;i++){const x=i*width/6-offset;ctx.bezierCurveTo(x+width*.05,base-amplitude*.15,x+width*.095,base-amplitude*(.45+(i%3+3)%3*.2),x+width/6,base-(i%2?10:30));}
  ctx.lineTo(width+100,height+20);ctx.closePath();ctx.fill();
}
function background(t) {
  const sky=ctx.createLinearGradient(0,0,width*.45,height);sky.addColorStop(0,'#e6e9d9');sky.addColorStop(.5,'#f2ead7');sky.addColorStop(1,'#dce8da');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  const sunX=width*.76,sunY=height*.26;const glow=ctx.createRadialGradient(sunX,sunY,10,sunX,sunY,150);glow.addColorStop(0,'#fff7db99');glow.addColorStop(1,'#fff7db00');ctx.fillStyle=glow;ctx.fillRect(sunX-150,sunY-150,300,300);ellipse(sunX,sunY,34,34,'#fcf0d3');ellipse(sunX-4,sunY-4,30,30,'#fff5df60');
  mountains(height*.49,'#d0ddd0',0,70);mountains(height*.61,'#bbd0c2',width*.08,90);mountains(height*.77,'#a9c5b6',-width*.09,95);
  ctx.save();ctx.globalAlpha=.3;distantTemple(width*.85,height*.49,Math.min(width/1000,1));ctx.restore();
  for(let i=0;i<7;i++){const speed=reducedMotion?0:t*.002*(i%2?1:-1);let cx=((i*.19*width+speed)%(width+260)+width+260)%(width+260)-80;cloud(cx,height*(.42+(i%3)*.21),80+(i%3)*42,.35+(i%2)*.18);}
  const mist=ctx.createLinearGradient(0,height*.5,0,height);mist.addColorStop(0,'#eff2e000');mist.addColorStop(.8,'#e5efdfbb');mist.addColorStop(1,'#eef3e4');ctx.fillStyle=mist;ctx.fillRect(0,height*.4,width,height*.6);
  for(let i=0;i<11;i++){const x=(i*127.3+(!reducedMotion?Math.sin(t*.00012+i)*30:0))%(width+40);const y=height*.34+(Math.sin(i*7.1)*.5+.5)*height*.5+(!reducedMotion?Math.sin(t*.0007+i)*5:0);ellipse(x,y,1.6,1.6,'#ffffe8a0');}
  // A few birds over the mountains.
  for(let i=0;i<3;i++){const x=width*.58+i*15,y=height*.21+i%2*7;ctx.beginPath();ctx.moveTo(x-4,y+1);ctx.quadraticCurveTo(x-2,y-2,x,y);ctx.quadraticCurveTo(x+2,y-2,x+5,y+1);ctx.strokeStyle='#9da88b';ctx.lineWidth=.9;ctx.stroke();}
}
function distantTemple(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);path([[-23,2],[23,2],[23,-40],[-23,-40]],'#7d9d8a');path([[-38,-39],[0,-57],[38,-39],[30,-34],[-30,-34]],'#6b8e7e');path([[-29,-61],[0,-75],[29,-61],[23,-56],[-23,-56]],'#789585');path([[-14,-59],[14,-59],[14,-72],[-14,-72]],'#9daf90');line([[0,-76],[0,-86]],'#819681',2);path([[-48,8],[48,8],[23,24],[-18,31]],'#98b09c');ctx.restore();}
function flower(x,y,r=4,color='#f6e2c5') {for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.45,r*.52,r*.38,color);}ellipse(x,y,r*.23,r*.18,'#c1a66b');}
function grass(x,y,s=1){line([[x-4*s,y-1],[x-3*s,y-6*s],[x,y],[x+2*s,y-8*s],[x+3*s,y],[x+7*s,y-4*s]],'#829a61',1.3);}
function tree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line([[0,0],[-2,-26],[0,-60]],'#8a8871',5);line([[-1,-27],[-16,-42],[-22,-58]],'#8a8871',3);line([[-1,-39],[17,-55]],'#8a8871',3);const blobs=[[-21,-63,21],[-5,-76,25],[18,-65,23],[-23,-48,18],[1,-53,24],[28,-49,15]];for(let i=0;i<blobs.length;i++){const [a,b,r]=blobs[i];ellipse(a,b,r,r*.7,['#dfbfae','#e7c9b8','#efddca'][i%3]);}for(let i=0;i<16;i++){const a=Math.sin(i*34)*30,b=-45-Math.abs(Math.cos(i*11))*38;ellipse(a,b,2.8,1.8,'#f7e7d0');}ctx.restore();}
function lantern(x,y){line([[x,y],[x,y-34]],'#8c8e6d',3);ellipse(x,y-36,10,12,'#e9c58c');line([[x-6,y-46],[x+6,y-46]],'#9e9068',2);line([[x,y-47],[x,y-56],[x-18,y-56],[x-18,y]],'#7e8a69',2);line([[x,y-27],[x,y-19]],'#bca274',1.5);ellipse(x-2,y-38,4,8,'#f8dfa5');}
function island(p,isTarget) {
  const point=screen(p.x,p.y);ctx.save();ctx.translate(point.x,point.y);ctx.scale(scale,scale);
  const r=p.rx,ry=p.ry,depth=53+Math.sin(p.seed)*12;
  ellipse(6,depth+45,r*.9,ry*.42,'#6f967414');
  path([[-r,0],[-r*.87,depth*.53],[-r*.47,depth*.82],[-r*.1,depth+16],[r*.18,depth-1],[r*.57,depth*.74],[r*.87,depth*.36],[r,0]],'#c1bc9c');
  path([[-r,0],[-r*.87,depth*.53],[-r*.47,depth*.82],[-r*.25,depth*.42],[-r*.12,3]],'#d9d4b8');
  path([[-r*.12,3],[-r*.25,depth*.42],[-r*.1,depth+16],[r*.18,depth-1],[r*.45,depth*.1]],'#b3b497');
  path([[r*.45,0],[r*.18,depth-1],[r*.57,depth*.74],[r*.87,depth*.36],[r,0]],'#a0a78d');
  line([[-r*.7,depth*.27],[-r*.5,depth*.34],[-r*.44,depth*.6]],'#b5b496',1);line([[r*.65,depth*.29],[r*.49,depth*.34]],'#949e81',1);
  ellipse(0,4,r,ry,'#83976b');ellipse(0,0,r,ry,'#b7c590');ellipse(-2,-3,r-4,ry-4,'#c8d3a1');
  ctx.beginPath();ctx.ellipse(0,-1,r-2,ry-2,0,.1,Math.PI-.1);ctx.strokeStyle='#9bae79';ctx.lineWidth=4;ctx.stroke();
  // Ragged moss edges and fine grass keep the little islands handmade.
  for(let i=0;i<13;i++){let a=i/12*Math.PI,x=Math.cos(a)*(r-3),y=Math.sin(a)*(ry-1);ellipse(x,y+2,3+(i%3),3+(i%4),'#9cb37c');}
  for(let i=0;i<8;i++){const a=p.seed+i*14.2,x=Math.sin(a)*(r-13),y=Math.cos(a*1.3)*(ry-9);if(Math.abs(x)>24)grass(x,y,.65);}
  if(isTarget){ellipse(0,0,PERFECT_RX,PERFECT_RY,'#faf3cd70');ctx.beginPath();ctx.ellipse(0,0,PERFECT_RX,PERFECT_RY,0,0,Math.PI*2);ctx.strokeStyle='#d3c487';ctx.lineWidth=1;ctx.stroke();flower(0,0,9,'#fff4d5');
    const light=ctx.createLinearGradient(0,-80,0,0);light.addColorStop(0,'#fff5c400');light.addColorStop(1,'#fff8d554');ctx.fillStyle=light;ctx.fillRect(-15,-80,30,80);
  } else flower(0,0,5,'#e7dfb9');
  if(p.kind===0){tree(-r*.55,-ry*.34,.68);flower(r*.57,7,3);flower(r*.65,0,3);}
  if(p.kind===1){lantern(r*.61,-ry*.22);flower(-r*.65,2,4);flower(-r*.5,8,3,'#e9caba');}
  if(p.kind===2){ellipse(-r*.58,-8,13,7,'#9ca68c');ellipse(-r*.62,-12,9,6,'#c3c7ab');grass(r*.58,4,1.1);flower(r*.48,-5,3);}
  if(p.kind===3){tree(r*.58,-ry*.24,.54);flower(-r*.5,8,4);}
  if(p.kind===4){path([[-r*.62,-3],[-r*.42,-3],[-r*.42,-18],[-r*.62,-18]],'#c5bf9d');path([[-r*.66,-18],[-r*.52,-26],[-r*.38,-18]],'#7b9075');ellipse(-r*.52,-10,3,4,'#ece3b7');grass(r*.6,6,1.1);}
  // A trailing vine.
  const vineX=-r*.7;ctx.beginPath();ctx.moveTo(vineX,14);ctx.bezierCurveTo(vineX-5,31,vineX+5,35,vineX-3,49);ctx.strokeStyle='#8b9e72';ctx.lineWidth=1.4;ctx.stroke();for(let i=0;i<4;i++)ellipse(vineX+(i%2?3:-3),23+i*6,4,2,'#91a475');
  ctx.restore();
}
function girl(x,y,z,charge=0) {
  const p=screen(x,y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  const facing=flight ? (flight.end.x>=flight.start.x?1:-1) : (platforms[current+1].x>=player.x?1:-1);
  if(state!=='falling')ellipse(0,3,18*(1-z/400),6*(1-z/400),`rgba(65,83,59,${.2*(1-z/300)})`);
  ctx.translate(0,-z);if(state==='falling'){ctx.rotate(Math.min((now-flight.fallStart)/700,.75)*facing);ctx.globalAlpha=clamp(1-(now-flight.fallStart)/650,0,1);}
  ctx.scale(facing,1);const idle=reducedMotion?0:Math.sin(now*.003)*1.2;
  // Squash around the soles (y=0), never translate the feet below the surface.
  ctx.scale(1+charge*.05,1-charge*.2);
  const air=state==='jumping', flutter=air?Math.sin((now-flight.startTime)*.016)*5:Math.sin(now*.004)*2;
  // Ponytail, tied with a little coral ribbon.
  ctx.beginPath();ctx.moveTo(-10,-79);ctx.bezierCurveTo(-26,-81,-20-flutter,-55,-31-flutter,-55);ctx.bezierCurveTo(-9,-50,-7,-70,-8,-76);ctx.fillStyle='#494337';ctx.fill();
  path([[-15,-77],[-23,-83],[-23,-73]],'#bf7771');path([[-15,-77],[-12,-85],[-8,-79]],'#cf8980');ellipse(-15,-77,3,3,'#db9c8c');
  // Legs and soft red shoes.
  const progress=air?clamp((now-flight.startTime)/flight.duration,0,1):0;
  const kick=air?12*Math.sin(progress*Math.PI):0;
  line([[-8,-23],[-9-kick*.6,-12],[-10-kick, -5]],'#e3bc96',7);line([[7,-23],[9+kick*.4,-13],[11+kick,-5-kick*.3]],'#efd1a9',7);
  ellipse(-10-kick,-3,7,3.4,'#985e4f');ellipse(13+kick,-3-kick*.3,8,3.6,'#aa6754');line([[-16-kick,-1],[-5-kick,-1]],'#d5b092',1.2);line([[7+kick,-1-kick*.3],[19+kick,-1-kick*.3]],'#d5b092',1.2);
  path([[-15,-37],[14,-37],[13,-22],[1,-22],[-1,-28],[-3,-21],[-14,-22]],'#b87964');path([[-15,-37],[-3,-35],[-3,-22],[-14,-22]],'#a56b58');
  // Cream shirt with a sage band.
  path([[-12,-63],[10,-63],[17,-47],[14,-34],[-17,-34],[-18,-47]],'#f4edd8','#b8b89a',.8);
  path([[-18,-48],[16,-48],[16,-40],[-18,-40]],'#829678');path([[-14,-35],[13,-35],[14,-31],[-15,-31]],'#e7dfc5');
  // Sleeves and arms respond to the leap.
  const armY=air?-62:-41;
  line([[-13,-56],[-23,-49],[-25,armY]],'#ebc69f',6);line([[13,-56],[23,-48],[27,armY+1]],'#f0cfaa',6);
  line([[-12,-56],[-20,-50]],'#ede6cf',10);line([[12,-56],[20,-50]],'#f8f0dd',10);
  ellipse(-25,armY,3,4,'#e9c7a3');ellipse(27,armY+1,3,4,'#f2d1ab');
  // Round face, chestnut bangs, and a wind-touched cheek.
  ctx.translate(0,idle);ellipse(0,-76,17,20,'#4b4438');ellipse(3,-73,14,16,'#efd0a8');ellipse(15,-72,3,4,'#e8bf97');
  ctx.beginPath();ctx.moveTo(-15,-76);ctx.bezierCurveTo(-17,-98,12,-99,17,-81);ctx.lineTo(17,-71);ctx.lineTo(11,-79);ctx.lineTo(8,-86);ctx.lineTo(4,-78);ctx.lineTo(-1,-84);ctx.lineTo(-6,-76);ctx.lineTo(-10,-80);ctx.lineTo(-11,-65);ctx.closePath();ctx.fillStyle='#4a4337';ctx.fill();
  line([[-12,-87],[-7,-91],[2,-92]],'#655d49',1.5);ellipse(7,-73,1.3,2,'#4e4d3b');ellipse(-1,-73,1.2,1.8,'#4e4d3b');ellipse(11,-68,3,1.6,'#db9e8160');
  line([[5,-65],[8,-65.5]],'#b5886a',.8);ctx.restore();
}
function foreground(t){
  // Soft near-field leaves frame the world without covering the route.
  ctx.save();ctx.globalAlpha=.3;ctx.translate(width+7,height+15);const sway=reducedMotion?0:Math.sin(t*.0008)*2;
  line([[0,0],[-35+sway,-66],[-23,-110]],'#9cb393',2);
  for(let i=0;i<5;i++){ctx.save();ctx.translate(-i*6-10,-i*17-20);ctx.rotate(i%2?.5:-.8);ellipse(i%2?-10:10,0,17,5,'#9eb596');ctx.restore();}ctx.restore();
}
function update(dt) {
  if(state==='charging'){setPower(chargePower(now-chargeStart));document.querySelector('.power-track').setAttribute('aria-valuenow',String(Math.round(power*100)));}
  if(state==='jumping'){
    const t=clamp((now-flight.startTime)/flight.duration,0,1);player.x=flight.start.x+(flight.end.x-flight.start.x)*t;player.y=flight.start.y+(flight.end.y-flight.start.y)*t;if(t>=1)land();
  }
  if(state==='falling'&&now-flight.fallStart>630){state='over';showModal('over');}
  if(state==='settling'||state==='ready'||state==='charging'){
    const desired=platforms[current];const ease=1-Math.exp(-dt*5);camera.x+=(desired.x-camera.x)*ease;camera.y+=(desired.y-camera.y)*ease;
    const desiredAnchor=width<600?(platforms[current+1].x>desired.x?.38:.62):.43;anchorX+=(desiredAnchor-anchorX)*ease;
    if(state==='settling'&&Math.abs(camera.x-desired.x)<8&&Math.abs(camera.y-desired.y)<5){state='ready';jumpButton.disabled=false;}
  }
  landBounce=Math.max(0,landBounce-dt*3);
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=120*dt;}
  particles=particles.filter(p=>p.life>0);rings=rings.filter(p=>now-p.start<700);
  if(now>toastUntil)$('toast').classList.remove('show');
}
function draw(){
  ctx.clearRect(0,0,width,height);background(now);
  const target=platforms[current+1];
  // A faint path points to the next island, while its flower is the landing target.
  if(steps===0&&state!=='jumping'&&state!=='falling'){
    const a=screen(player.x,player.y),b=screen(target.x,target.y);ctx.save();ctx.setLineDash([2,7]);ctx.beginPath();ctx.moveTo(a.x+35*scale,a.y-8*scale);ctx.quadraticCurveTo((a.x+b.x)/2,a.y-70*scale,b.x-50*scale,b.y);ctx.strokeStyle='#8ca87a66';ctx.lineWidth=1;ctx.stroke();ctx.restore();
  }
  for(let i=platforms.length-1;i>=0;i--){const p=platforms[i],s=screen(p.x,p.y);if(s.y>-100&&s.y<height+180){ctx.save();if(i>current+1)ctx.globalAlpha=i===current+2?.53:.25;island(p,i===current+1);ctx.restore();}}
  if(state==='charging'){
    // Use the exact release calculation and world-to-screen transform for the guide.
    const point=landingPoint(player,target,power),p=screen(point.x,point.y);
    const targetResult=classifyLanding(point,target);
    const result=targetResult==='miss'?classifyLanding(point,platforms[current]):targetResult;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
    const color=result==='miss'?'#a76c54':'#526d47';
    ctx.beginPath();ctx.ellipse(0,0,9,4,0,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
    line([[-4,0],[4,0]],color,1);line([[0,-3],[0,3]],color,1);ctx.restore();
  }
  for(const ring of rings){const p=screen(ring.x,ring.y),progress=(now-ring.start)/700;ctx.save();ctx.globalAlpha=(1-progress)*.7;ctx.beginPath();ctx.ellipse(p.x,p.y,(24+progress*46)*scale,(9+progress*19)*scale,0,0,Math.PI*2);ctx.strokeStyle=ring.perfect?'#fff0ba':'#eef4cb';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
  let z=landBounce>0?Math.sin(landBounce*Math.PI)*5:0;
  if(state==='jumping'){const t=clamp((now-flight.startTime)/flight.duration,0,1);z=Math.sin(t*Math.PI)*flight.height;}
  if(state==='falling')z=-Math.pow((now-flight.fallStart)/630,2)*200;
  if(state!=='over')girl(player.x,player.y,z,state==='charging'?power:0);
  for(const part of particles){const p=screen(part.x,part.y-part.z);ctx.save();ctx.globalAlpha=Math.min(part.life,1);ctx.translate(p.x,p.y);ctx.rotate(part.life*4);ellipse(0,0,part.size*scale,part.size*.5*scale,part.color);ctx.restore();}
  foreground(now);
}
function frame(time){now=gameTime();const dt=Math.min((time-lastFrame)/1000,.05);lastFrame=time;if(overlay.hidden&&!document.hidden)update(dt);draw();requestAnimationFrame(frame);}
reset();resize();requestAnimationFrame(frame);
})();
