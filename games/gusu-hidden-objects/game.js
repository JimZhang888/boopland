(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const drawing=GusuDrawing;
  const t=(key,values)=>BooplandI18n.t('gusu.'+key,values);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ids=['cat','fan','pin','cup','spool','swallow','lotus','letter'];
  const spot=(action,x,y,rx=21,ry=20)=>({action,x,y,rx,ry});
  const routes={
    cat:[spot('bell',756,303,23,27),spot('curtain',817,440,19,18),spot('cat',818,448,17,14)],
    fan:[spot('umbrella',331,314,37,29),spot('fan',335,339)],
    pin:[spot('fronds',319,545,25,31),spot('pin',320,552)],
    cup:[spot('tray',1022,255),spot('cup',1017,261)],
    spool:[spot('cloth',1282,294,25,26),spot('spool',1281,308)],
    swallow:[spot('window',1613,239,26,23),spot('swallow',1610,238)],
    lotus:[spot('pads',888,478,21,17),spot('lotus',890,478)],
    letter:[spot('basket',1828,drawing.letterY-4,25,21),spot('letter',1827,drawing.letterY)]
  };
  let state, selected, sheetType='', toastMessage='', toastValues={}, toastTimer, sailTimer, sailLock=false;
  const viewport=$('viewport'), map=$('map'), dialog=$('sheet'), range=$('position');
  const camera={x:662,y:377,zoom:1,scale:1,w:900,h:650};
  let gesture=null, touches=new Set(), blocked=false;
  let lastVessel='';
  map.innerHTML=drawing.defs()+drawing.world();
  function currentSpot(id){
    return routes[id].find(step=>!state[step.action]) || routes[id][routes[id].length-1];
  }
  function paint(){
    const layers=drawing.dynamic(state);
    if(layers.vessel!==lastVessel){
      $('boat-layer').innerHTML=layers.vessel;lastVessel=layers.vessel;
    }
    $('object-layer').innerHTML=layers.art;
  }
  function frame(){
    const width=viewport.clientWidth, height=viewport.clientHeight;
    if(!width||!height)return;
    const base=Math.max(.70,height/640,width/1450);
    camera.scale=Math.max(width/drawing.W,height/drawing.H,base*camera.zoom);
    camera.w=width/camera.scale;camera.h=height/camera.scale;
    camera.x=clamp(camera.x,camera.w/2,drawing.W-camera.w/2);
    camera.y=clamp(camera.y,camera.h/2,drawing.H-camera.h/2);
    map.setAttribute('viewBox',[camera.x-camera.w/2,camera.y-camera.h/2,camera.w,camera.h].join(' '));
    const run=drawing.W-camera.w;
    range.value=run>1?Math.round(1000*(camera.x-camera.w/2)/run):500;
    range.disabled=run<1;
    $('west').disabled=camera.x<=camera.w/2+.5;
    $('east').disabled=camera.x>=drawing.W-camera.w/2-.5;
    $('in').disabled=camera.zoom>=2.19;$('out').disabled=camera.zoom<=.72;
  }
  function pan(dx,dy=0){camera.x+=dx;camera.y+=dy;frame()}
  function zoom(factor){camera.zoom=clamp(camera.zoom*factor,.72,2.2);frame()}
  function notice(key,values={}){
    clearTimeout(toastTimer);toastMessage=key;toastValues=values;
    $('toast').textContent=t(key,values.name?{name:t(values.name+'.name')}:values);
    $('toast').hidden=false;
    toastTimer=setTimeout(()=>{$('toast').hidden=true;toastMessage=''},2600);
  }
  function entry(id){
    const b=document.createElement('button');
    b.type='button';b.className='entry'+(id===selected?' selected':'')+(state.found.has(id)?' collected':'');
    b.dataset.clue=id;b.setAttribute('aria-pressed',String(id===selected));
    const icon=drawing.icon(id);
    b.innerHTML=icon+'<span></span><span class="box" aria-hidden="true"></span>';
    b.children[1].textContent=t(id+'.name');
    if(state.found.has(id)){
      b.lastElementChild.textContent='✓';
      b.setAttribute('aria-label',t('collected',{name:t(id+'.name')}));
    }
    b.onclick=()=>{
      const onPage=b.parentNode===$('list');
      selected=id;
      if(sheetType==='list')closeSheet();
      refresh();
      if(onPage)$('list').querySelector('[data-clue="'+id+'"]').focus({preventScroll:true});
    };
    return b;
  }
  function refresh(){
    $('list').replaceChildren(...ids.map(entry));
    const count=state.found.size,complete=count===ids.length;
    $('total').textContent=count+' / 8';
    $('marks').innerHTML=ids.map(id=>'<i class="'+(state.found.has(id)?'on':'')+'"></i>').join('');
    $('number').textContent=t('clue',{n:String(ids.indexOf(selected)+1).padStart(2,'0')});
    $('current-name').textContent=t(selected+'.name');
    $('verse').textContent=t(selected+'.verse');
    $('hint-label').textContent=t(complete?'again':'hint');
    $('hint').disabled=!complete&&state.found.has(selected);
    if(toastMessage)$('toast').textContent=t(toastMessage,toastValues.name?{name:t(toastValues.name+'.name')}:toastValues);
    if(dialog.open)renderSheet();
  }
  function activate(id,step){
    if(state.found.has(id)||currentSpot(id).action!==step.action||dialog.open)return;
    if(sailLock&&id==='cat')return;
    if(step.action===id){
      state.found.add(id);
      paint();notice('collected',{name:id});
      if(state.found.has(selected))selected=ids.find(key=>!state.found.has(key))||id;
      refresh();
      if(state.found.size===8)openSheet('won');
      return;
    }
    state[step.action]=true;
    if(step.action==='bell'){
      sailLock=!matchMedia('(prefers-reduced-motion: reduce)').matches;
      state.sailing=sailLock;
      clearTimeout(sailTimer);
      sailTimer=setTimeout(()=>{state.sailing=false;sailLock=false},680);
    }
    paint();notice('opened');
  }
  function hit(x,y){
    let best=null,distance=Infinity;
    for(const id of ids){
      if(state.found.has(id))continue;
      const step=currentSpot(id),rx=Math.max(step.rx,20/camera.scale),ry=Math.max(step.ry,20/camera.scale);
      const d=((x-step.x)/rx)**2+((y-step.y)/ry)**2;
      if(d<=1&&d<distance){best={id,step};distance=d}
    }
    return best;
  }
  function point(clientX,clientY){const r=viewport.getBoundingClientRect();return {x:camera.x-camera.w/2+(clientX-r.left)/camera.scale,y:camera.y-camera.h/2+(clientY-r.top)/camera.scale}}
  function cancelGesture(){gesture=null;viewport.classList.remove('drag')}
  // All taps on the painting are handled on pointerup. Suppress the browser's
  // tap/scroll synthesis here so a finished pan cannot consume the next button tap.
  viewport.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0||dialog.open)return;
    e.preventDefault();touches.add(e.pointerId);viewport.setPointerCapture(e.pointerId);
    if(touches.size>1){blocked=true;cancelGesture();return}
    if(blocked)return;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,drag:false};
    viewport.focus({preventScroll:true});
  });
  function moveGesture(e){
    if(!gesture||gesture.id!==e.pointerId)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(Math.hypot(dx,dy)>7)gesture.drag=true;
    if(gesture.drag){viewport.classList.add('drag');camera.x=gesture.cx-dx/camera.scale;camera.y=gesture.cy-dy/camera.scale;frame()}
  }
  viewport.addEventListener('pointermove',e=>{
    if(gesture){moveGesture(e);return}
    if(e.pointerType==='mouse'){
      const p=point(e.clientX,e.clientY);viewport.style.cursor=hit(p.x,p.y)?'pointer':'grab';
    }
  });
  function finish(e,cancelled){
    touches.delete(e.pointerId);
    if(!cancelled&&!blocked&&gesture?.id===e.pointerId){
      moveGesture(e);
      const p=point(e.clientX,e.clientY);
      if(!gesture.drag){const target=hit(p.x,p.y);if(target)activate(target.id,target.step)}
    }
    if(gesture?.id===e.pointerId)cancelGesture();
    if(!touches.size)blocked=false;
  }
  viewport.addEventListener('pointerup',e=>finish(e,false));
  viewport.addEventListener('pointercancel',e=>finish(e,true));
  viewport.addEventListener('lostpointercapture',e=>{if(touches.has(e.pointerId))finish(e,true)});
  window.addEventListener('blur',()=>{cancelGesture();touches.clear();blocked=false});
  viewport.addEventListener('keydown',e=>{
    const keys={ArrowLeft:[-.18*camera.w,0],ArrowRight:[.18*camera.w,0],ArrowUp:[0,-.18*camera.h],ArrowDown:[0,.18*camera.h]};
    if(keys[e.key]){e.preventDefault();pan(...keys[e.key])}
    if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.25)}
    if(e.key==='-'){e.preventDefault();zoom(.8)}
  });
  $('west').onclick=()=>pan(-camera.w*.55);$('east').onclick=()=>pan(camera.w*.55);
  range.oninput=()=>{camera.x=camera.w/2+Number(range.value)/1000*(drawing.W-camera.w);frame()};
  $('in').onclick=()=>zoom(1.25);$('out').onclick=()=>zoom(.8);
  function textElement(tag,text,className=''){const el=document.createElement(tag);el.textContent=text;el.className=className;return el}
  function closeSheet(){dialog.close();sheetType=''}
  function sheetButton(label,fn){
    const button=textElement('button',t(label),'primary');button.onclick=fn;
    $('sheet-actions').append(button);
  }
  function detail(step){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.classList.add('detail-map');svg.setAttribute('aria-hidden','true');
    svg.setAttribute('viewBox',[step.x-110,step.y-61,220,122].join(' '));
    svg.setAttribute('preserveAspectRatio','xMidYMid slice');
    svg.innerHTML='<use href="#scroll"/><g fill="none" stroke-linecap="round"><ellipse cx="'+step.x+'" cy="'+step.y+'" rx="'+(step.rx+5)+'" ry="'+(step.ry+4)+'" stroke="#fff6da" stroke-width="4.5"/><ellipse cx="'+step.x+'" cy="'+step.y+'" rx="'+(step.rx+5)+'" ry="'+(step.ry+4)+'" stroke="#aa5343" stroke-width="2" stroke-dasharray="6 3"/></g>';
    return svg;
  }
  function renderSheet(){
    const body=$('sheet-body'),actions=$('sheet-actions');
    body.replaceChildren();actions.replaceChildren();
    const back=document.createElement('a');back.href=BooplandI18n.withLanguage('../../games.html');back.textContent=BooplandI18n.t('common.back');actions.append(back);
    let heading='';
    if(sheetType==='list'){
      heading=t('journal');body.replaceChildren(...ids.map(entry));
    }else if(sheetType==='help'){
      heading=t('help');body.append(textElement('p',t('how')),textElement('p',t('how2')));sheetButton('return',closeSheet);
    }else if(sheetType==='won'||sheetType==='restart'){
      const won=sheetType==='won';
      heading=t(won?'done':'againTitle');body.append(textElement('p',t(won?'ending':'againBody')));
      sheetButton(won?'view':'again',won?closeSheet:()=>{closeSheet();reset()});
    }else{
      const fine=sheetType==='fine',step=currentSpot(selected);
      heading=t(selected+'.name');
      body.append(textElement('div',t(fine?'second':'first'),'sheet-kicker'));
      if(fine){
        const key=step.action===selected?'take':step.action==='curtain'?'curtain':selected+'.precise';
        body.append(detail(step),textElement('p',t(key,{name:t(selected+'.name')})));
        sheetButton('locate',()=>{closeSheet();camera.x=step.x;camera.y=step.y;frame()});
      }else{
        body.append(textElement('p',t(selected+'.nudge')));
        sheetButton('detail',()=>{sheetType='fine';renderSheet();$('dismiss').focus({preventScroll:true})});
      }
    }
    $('sheet-title').textContent=heading;
  }
  function openSheet(type){
    cancelGesture();sheetType=type;renderSheet();dialog.showModal();
    $('dismiss').focus({preventScroll:true});
  }
  dialog.addEventListener('close',()=>{if(!dialog.open)sheetType=''});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet()}});
  $('help').onclick=()=>openSheet('help');$('browse').onclick=()=>openSheet('list');
  $('hint').onclick=()=>openSheet(state.found.size===8?'restart':'nudge');$('dismiss').onclick=closeSheet;
  function reset(){
    state={found:new Set()};selected=ids[0];sailLock=false;
    clearTimeout(toastTimer);clearTimeout(sailTimer);toastMessage='';$('toast').hidden=true;
    camera.x=662;camera.y=377;camera.zoom=1;
    paint();refresh();frame();
  }
  new ResizeObserver(frame).observe(viewport);
  window.addEventListener('boopland:languagechange',refresh);
  reset();
})();

