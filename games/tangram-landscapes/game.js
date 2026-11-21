(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const G = Tangram, I = BooplandI18n, t = (key, params) => I.t('tangram.'+key,params);
  const svgNS='http://www.w3.org/2000/svg';
  const board=$('board'), layer=$('pieces'), dialog=$('dialog');
  const atlas=$('atlas'), atlasButton=$('atlas-button');
  const kind=['large','large','medium','square','para','small','small'];
  const colors=['#8ca899','#c69779','#b0b787','#d7bc86','#83a5af','#b8a7b4','#a9b9a5'];
  const inks=['#526f61','#86694f','#747c54','#8c7852','#587682','#816d7c','#6e826b'];
  // Small woodcut-like marks are fixed to the paper as it turns.
  const engravings=[
    'M-.30 .13 -.07-.14 .06 .02 .14-.07 .31 .13m-.47 .04 .33 .002m-.22 .055 .12 .003',
    'M-.28 .08q.09-.09.18-.02t.19-.01.2-.03m-.49 .11q.08-.06.18-.02t.22-.01',
    'M-.2 .12Q-.05-.05 .12-.15m-.19 .19q-.13-.09-.11-.18.12.025.12.14m.045-.04q.11.02.19-.08-.13-.02-.18.065',
    'M-.18 .08a.18 .18 0 0 1 .36 0m-.43 .03h.49m-.38 .06h.27m-.19 .05h.13',
    'M-.27 .13q.13-.13.2-.08t.15-.02.21-.12m-.47 .08q.12-.14.22-.09t.22-.09',
    'M-.15 .01q.10-.05.16.06.07-.13.18-.12',
    'M-.14 .09q.03-.15.21-.22-.01.19-.21.22zm.025-.014.15-.14'
  ];
  const initialTurns=[0,4,0,0,0,2,4];
  const templates=[
    [[0,1],[3,2],[4,5,6]], [[0,3,1],[5,2,4,6]],
    [[0,3,2,1],[5,4,6]], [[0,1,3,2,4,5,6]], [[0,1],[2,4],[5,3,6]]
  ];
  const spacing=.36;
  function trayPlan(rows) {
    let height=0,width=0; const slots=[];
    for(const row of rows) {
      const boxes=row.map(id=>G.bounds(G.polygon({id,x:0,y:0,turn:initialTurns[id]})));
      const h=Math.max(...boxes.map(b=>b.h));
      const w=boxes.reduce((sum,b)=>sum+b.w,0)+(row.length-1)*spacing;
      let x=-w/2;
      row.forEach((id,i)=>{
        const b=boxes[i]; slots[id]=[x-b.l,height+(h-b.h)/2-b.t]; x+=b.w+spacing;
      });
      width=Math.max(width,w); height+=h+spacing;
    }
    height-=spacing; slots.forEach(p=>p[1]-=height/2);
    return {slots,width,height};
  }
  const plans=templates.map(trayPlan);
  const path=poly=>'M'+poly.map(p=>p.join(' ')).join('L')+'Z';
  const ptkey=p=>p.map(v=>Math.round(v*1e6)).join('/');
  function borderPath(segments) {
    const edges=segments.slice(), paths=[];
    while(edges.length){
      const [first,second]=edges.pop(), loop=[first,second];
      let end=ptkey(second);
      while(end!==ptkey(first)){
        const i=edges.findIndex(([a,b])=>ptkey(a)===end || ptkey(b)===end);
        if(i<0) break;
        const [a,b]=edges.splice(i,1)[0], next=ptkey(a)===end?b:a;
        loop.push(next); end=ptkey(next);
      }
      paths.push(path(loop));
    }
    return paths.join('');
  }
  const scenes=Landscapes.map(s=>{
    const bounds=G.bounds(s.tiles.flat()), outline=G.outline(s.tiles);
    return {...s,bounds,outline,path:borderPath(outline)};
  });
  let done;
  try { const value=JSON.parse(localStorage.getItem('tangram-landscapes:atlas')||'[]');
    done=new Set(Array.isArray(value)?value.filter(x=>scenes.some(s=>s.key===x)):[]);
  } catch { done=new Set(); }
  const drafts=new Map();
  let current=0, scene=scenes[0], pieces=[], selected=-1, layout=null;
  let gesture=null, score={coverage:0,overlap:0}, dialogType='', celebrating=false, frame=0;
  const groups=[], cards=[];
  const pad=n=>String(n).padStart(2,'0');
  const icon=id=>'<svg class="ico" aria-hidden="true"><use href="#i-'+id+'"/></svg>';
  function mini(s,full=false){
    const {l,t:top,w,h}=s.bounds;
    const color=['#769587','#8e9c8c','#82947b','#a6967c','#8eaaa6','#a29b7d','#ad9a82','#879e9b'][scenes.indexOf(s)];
    const scale=Math.min(73/w,35/h),x=50-(l+w/2)*scale,y=29-(top+h/2)*scale;
    const art=full ? s.tiles.map((p,i)=>'<path d="'+path(p)+'" fill="'+colors[i]+'" stroke="'+inks[i]+'" stroke-width=".025"/>').join('') :
      '<path d="'+s.path+'" fill="'+color+'" stroke="#5f7467" stroke-width="1" vector-effect="non-scaling-stroke" fill-rule="evenodd"/>';
    return '<svg class="'+(full?'win-art':'mini')+'" viewBox="0 0 100 55" aria-hidden="true"><circle cx="75" cy="13" r="5.5" fill="#c99b77" opacity=".57"/><path d="M7 44q12-2 24-.5m28 2q17-2 34-1m-21 5h10" fill="none" stroke="#9cae9a" stroke-width=".8"/><g transform="translate('+x+' '+y+') scale('+scale+')">'+art+'</g></svg>';
  }
  scenes.forEach((s,i)=>{
    const button=document.createElement('button');button.className='card';
    button.innerHTML='<small>'+pad(i+1)+'</small>'+mini(s)+'<span></span><svg class="ico tick" aria-hidden="true"><use href="#i-check"/></svg>';
    button.addEventListener('click',()=>{closeAtlas();if(current!==i)start(i)});
    $('cards').append(button);cards.push(button);
  });
  function refreshCards(){
    cards.forEach((button,i)=>{
      const s=scenes[i],complete=done.has(s.key),name=t(s.key);
      button.querySelector('span').textContent=name;
      button.querySelector('.tick').style.display=complete?'':'none';
      button.setAttribute('aria-current',String(current===i));
      button.setAttribute('aria-label',t('scene',{n:i+1,name})+(complete?' · '+t('done'):''));
    });
    $('count').textContent=done.size+' / 8';
    $('count').setAttribute('aria-label',t('total',{n:done.size}));
  }
  function freshPieces(){
    return initialTurns.map((turn,id)=>({id,turn,flip:false,space:'home',x:0,y:0}));
  }
  for(let id=0;id<7;id++){
    const g=document.createElementNS(svgNS,'g'), d=path(G.blocks[id]);
    g.classList.add('tan');g.dataset.id=id;g.setAttribute('tabindex','0');g.setAttribute('role','button');
    const edge=' stroke-linejoin="round" vector-effect="non-scaling-stroke"';
    g.innerHTML='<path d="'+d+'" fill="'+colors[id]+'" stroke="'+inks[id]+'" stroke-width="1.5" filter="url(#shadow)"'+edge+'/>'+
      '<path d="'+d+'" fill="url(#tangrain)" pointer-events="none"/>'+
      '<path transform="scale(.929)" d="'+d+'" fill="none" stroke="#fffae3" opacity=".55" stroke-width=".8"'+edge+'/>'+
      '<path d="'+engravings[id]+'" fill="none" stroke="'+inks[id]+'" stroke-width=".018" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>'+
      '<path class="selection" d="'+d+'" fill="none" stroke="#344f45" stroke-width="2.8" visibility="hidden"'+edge+'/>';
    g.addEventListener('focus',()=>select(id));groups[id]=g;layer.append(g);
  }
  function fit(){
    const w=board.clientWidth,h=board.clientHeight;
    if(!w||!h)return;
    if(gesture)cancelGesture();
    const side=w/h>=1.13;
    const a=side?{x:0,y:0,w:w*.565,h}:{x:0,y:0,w,h:h*.55};
    const b=side?{x:a.w,y:0,w:w-a.w,h}:{x:0,y:a.h,w,h:h-a.h};
    const head=h<230?23:33, gap=Math.min(19,Math.max(8,w*.023));
    const bb=scene.bounds;
    const targetMax=Math.min((a.w-2*gap)/(bb.w+.34),(a.h-head-2*gap)/(bb.h+.33));
    let best=null,unit=0;
    for(const plan of plans){
      const u=Math.min(targetMax,(b.w-2*gap)/(plan.width+.15),(b.h-head-2*gap)/(plan.height+.15));
      if(u>unit){unit=u;best=plan}
    }
    unit=Math.max(1,unit);
    const tx=a.x+a.w*.5-(bb.l+bb.w/2)*unit, ty=a.y+head+(a.h-head)*.48-(bb.t+bb.h/2)*unit;
    const bx=b.x+b.w/2, by=b.y+head+(b.h-head)*.49;
    layout={w,h,side,a,b,head,gap,tx,ty,bx,by,unit,plan:best||plans[0]};
    board.setAttribute('viewBox','0 0 '+w+' '+h);
    drawPaper();drawTarget();
    for (const p of pieces){if(p.space!=='home')limit(p);drawPiece(p)}
    updateScore(false);
  }
  function pos(p){
    const {tx,ty,bx,by,unit,plan}=layout;
    if(p.space==='home')return [bx+plan.slots[p.id][0]*unit,by+plan.slots[p.id][1]*unit];
    const [ox,oy]=p.space==='tray'?[bx,by]:[tx,ty];
    return [ox+p.x*unit,oy+p.y*unit];
  }
  function setPos(p,x,y){
    const {side,b,tx,ty,bx,by,unit}=layout, tray=side?x>=b.x:y>=b.y;
    p.space=tray?'tray':'target';p.x=(x-(tray?bx:tx))/unit;p.y=(y-(tray?by:ty))/unit;
  }
  function limit(p) {
    const {w,h,unit}=layout,[cx,cy]=pos(p),bb=G.bounds(G.polygon({...p,x:0,y:0}));
    const clamp=(v,lo,hi)=>Math.min(Math.max(v,lo),hi);
    const x=clamp(cx,2-bb.l*unit,w-2-bb.r*unit),y=clamp(cy,2-bb.t*unit,h-2-bb.b*unit);
    if(x!==cx||y!==cy)setPos(p,x,y);
  }
  function drawPaper(){
    const {a,b,side,w,h,head}=layout;
    const guideCount=Math.max(0,2-current),my=head<30?15:22;
    const label=(x,y,str)=>'<path d="m'+(x+1)+' '+(y-5)+' 3.5-3.5 3.5 3.5-3.5 3.5z" fill="#8e9b85"/><text class="zone-label" x="'+(x+14)+'" y="'+y+'">'+str+'</text>';
    const paper=$('paper'),rim=7,L=8;
    const corners=[[rim,rim,1,1],[a.w-rim,rim,-1,1],[rim,a.h-rim,1,-1],[a.w-rim,a.h-rim,-1,-1]]
      .map(([x,y,sx,sy])=>'M'+(x+sx*L)+' '+y+'H'+x+'v'+(sy*L)).join('');
    let drawer='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="#ede9db"/>'+
      '<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="url(#dot)" opacity=".8"/>';
    const border=side?'M'+b.x+' 0v'+h:'M0 '+b.y+'h'+w;
    const sun='<g transform="translate('+a.w*.79+' '+a.h*.21+') scale('+Math.min(a.w,a.h)*.053+')"><circle r="1" fill="#ca9677" opacity=".64"/><path d="M-.94 .39q.57-.025 1.85 0m-.78 .13h.74" fill="none" stroke="#f3f0e4" stroke-width=".067"/></g>';
    paper.innerHTML='<image href="riverscape.svg" x="0" y="0" width="'+a.w+'" height="'+a.h+'" preserveAspectRatio="none" opacity=".77"/>'+sun+drawer+
      '<rect width="'+w+'" height="'+h+'" fill="url(#fibers)"/><path d="'+corners+'" stroke="#a7ad98" fill="none"/>'+
      '<path d="'+border+'" stroke="#b3baa6"/><path transform="translate('+(side?'3 0':'0 3')+')" d="'+border+'" stroke="#bac0ab" stroke-dasharray="2 4"/>'+
      label(14,my,t('silhouette'))+label(b.x+13,b.y+my,t('tans'))+
      (guideCount?'<text class="zone-note" x="'+(a.w-12)+'" y="'+my+'" text-anchor="end">'+t('guides',{n:guideCount})+'</text>':'');
  }
  function drawTarget(){
    const {tx,ty,unit}=layout, node=$('target');
    node.setAttribute('transform','translate('+tx+' '+ty+') scale('+unit+')');
    node.innerHTML='<path d="'+scene.path+'" fill="#b2beaa" fill-rule="evenodd" stroke="#627a68" stroke-width="1.65" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>'+
      '<path d="'+scene.path+'" fill="url(#tangrain)" opacity=".85" fill-rule="evenodd"/>'+
      scene.tiles.slice(0,Math.max(0,2-current)).map(p=>'<path d="'+path(p)+'" transform="translate('+G.center(p).map(x=>x*.014).join(' ')+') scale(.986)" fill="none" stroke="#f2f1df" stroke-width="1.55" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/>').join('');
  }
  function drawPiece(p){
    const [x,y]=pos(p),u=layout.unit;
    groups[p.id].setAttribute('transform','translate('+x+' '+y+') scale('+u+') rotate('+(p.turn*45)+') scale('+(p.flip?-1:1)+' 1)');
  }
  function boardPoly(p){
    const [x,y]=pos(p);return G.polygon({...p,x:(x-layout.tx)/layout.unit,y:(y-layout.ty)/layout.unit});
  }
  function updateStatus(){
    const has=selected>=0, p=pieces[selected],over=score.overlap>.008;
    $('left').disabled=$('right').disabled=!has;$('flip').disabled=!has||p.id!==4;
    $('flip').setAttribute('aria-pressed',String(!!pieces[4]?.flip));
    $('status').classList.toggle('warn',over);
    const label=$('status').querySelector('span');
    const message=over?t('overlap',{n:Math.max(1,Math.round(score.overlap*100))}):has?t('selected',{piece:t(kind[selected])}):t('drag');
    if(label.textContent!==message)label.textContent=message;
  }
  function select(id){
    selected=id;
    groups.forEach((g,i)=>{
      g.querySelector('.selection').setAttribute('visibility',i===id?'visible':'hidden');
      g.setAttribute('aria-pressed',String(i===id));
    });
    updateStatus();
  }
  function updateScore(commit){
    if(!layout)return;
    score=G.measure(scene.tiles,pieces.map(boardPoly));
    const value=score.won?100:Math.min(99,Math.round(score.coverage*100));
    $('percent').textContent=value+'%';document.querySelector('.track i').style.width=value+'%';
    updateStatus();
    if(commit && score.won && !celebrating){
      celebrating=true;done.add(scene.key);drafts.delete(current);
      try{localStorage.setItem('tangram-landscapes:atlas',JSON.stringify([...done]))}catch{}
      refreshCards();openDialog('win');
    }
  }
  function scheduleScore(){
    if(!frame)frame=requestAnimationFrame(()=>{frame=0;updateScore(false)});
  }
  function snap(p){
    const segments=scene.outline.concat(pieces.filter(q=>q!==p).flatMap(q=>G.edges(boardPoly(q))));
    const shift=G.alignment(boardPoly(p),segments,Math.min(.12,7/layout.unit));
    const [x,y]=pos(p);setPos(p,x+shift.x*layout.unit,y+shift.y*layout.unit);limit(p);
  }
  function rotateOrFlip(command){
    if(selected<0 || dialog.open || atlas.classList.contains('open'))return;
    const p=pieces[selected];
    if(command==='flip' && p.id!==4)return;
    if(command==='flip')p.flip=!p.flip;
    else p.turn=(p.turn+(command==='left'?7:1))%8;
    // Rotation stays at the current centre, including a piece still in its tray.
    limit(p);drawPiece(p);updateScore(true);
  }
  function point(event){
    const r=board.getBoundingClientRect();return [(event.clientX-r.left)*layout.w/r.width,(event.clientY-r.top)*layout.h/r.height];
  }
  function cancelGesture(){
    if(!gesture)return;
    const id=gesture.pointer; gesture=null;
    if(board.hasPointerCapture(id))board.releasePointerCapture(id);
  }
  board.addEventListener('pointerdown',event=>{
    if(gesture || !layout || event.button!==0)return;
    const g=event.target.closest('.tan');if(!g)return;
    const id=Number(g.dataset.id),p=pieces[id],[x,y]=point(event),[cx,cy]=pos(p);
    select(id);layer.append(g);g.focus({preventScroll:true});
    gesture={pointer:event.pointerId,id,x,y,cx,cy,moved:0,original:{...p}};
    board.setPointerCapture(event.pointerId);event.preventDefault();
  });
  function movePointer(event){
    if(!gesture || event.pointerId!==gesture.pointer)return;
    const [x,y]=point(event),dx=x-gesture.x,dy=y-gesture.y,p=pieces[gesture.id];
    gesture.moved=Math.max(gesture.moved,Math.hypot(dx,dy));
    if(gesture.moved<1)return;
    setPos(p,gesture.cx+dx,gesture.cy+dy);limit(p);drawPiece(p);scheduleScore();
  }
  board.addEventListener('pointermove',movePointer);
  board.addEventListener('pointerup',event=>{
    if(!gesture || event.pointerId!==gesture.pointer)return;
    movePointer(event);
    const p=pieces[gesture.id];
    if(gesture.moved>=6){snap(p);drawPiece(p)}
    cancelGesture();updateScore(true);
  });
  function rollback(event){
    if(gesture && event.pointerId===gesture.pointer){
      const p=pieces[gesture.id];Object.assign(p,gesture.original);cancelGesture();drawPiece(p);updateScore(false);
    }
  }
  board.addEventListener('pointercancel',rollback);board.addEventListener('lostpointercapture',rollback);
  for(const cmd of ['left','right','flip'])$(cmd).addEventListener('click',()=>rotateOrFlip(cmd));
  // After a drag, some touch browsers swallow the next synthesized click.
  // Dispatch an ordinary button activation on a single, stationary touch.
  for(const button of document.querySelectorAll('.commands button, #atlas-button')){
    let origin=null;
    button.addEventListener('touchstart',event=>{
      origin=event.touches.length===1?event.changedTouches[0]:null;
    },{passive:true});
    button.addEventListener('touchcancel',()=>{origin=null});
    button.addEventListener('touchend',event=>{
      const end=event.changedTouches[0],start=origin;origin=null;
      if(!start || event.touches.length || start.identifier!==end.identifier || button.disabled)return;
      if(Math.hypot(end.clientX-start.clientX,end.clientY-start.clientY)>8)return;
      if(!button.contains(document.elementFromPoint(end.clientX,end.clientY)))return;
      event.preventDefault();button.click();
    },{passive:false});
  }
  const nudges={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && atlas.classList.contains('open')){closeAtlas();return}
    if(selected<0 || dialog.open || atlas.classList.contains('open') || gesture || e.altKey || e.ctrlKey || e.metaKey)return;
    const key=e.key.toLowerCase(),p=pieces[selected];
    if(nudges[e.key]){
      e.preventDefault();const [x,y]=pos(p),[dx,dy]=nudges[e.key],step=e.shiftKey?5:1;
      setPos(p,x+dx*step,y+dy*step);limit(p);drawPiece(p);updateScore(true);
    } else if(['q','e','f'].includes(key)){
      e.preventDefault();rotateOrFlip({q:'left',e:'right',f:'flip'}[key]);
    }
  });
  function dialogButton(key,fn,primary=false){
    const btn=document.createElement('button');btn.textContent=t(key);
    if(primary)btn.className='primary';btn.onclick=fn;$('dialog-actions').append(btn);
  }
  function renderDialog(){
    const content=$('dialog-content'), actions=$('dialog-actions');
    actions.replaceChildren();const name=t(scene.key);
    if(dialogType==='help'){
      content.innerHTML='<h2 id="dialog-title">'+t('help')+'</h2>'+['rule1','rule2','rule3','rule4'].map(k=>'<p>'+t(k)+'</p>').join('');
      dialogButton('close',()=>dialog.close(),true);
    }else if(dialogType==='reset'){
      content.innerHTML='<h2 id="dialog-title">'+t('resetQ')+'</h2><p>'+t('resetText')+'</p>';
      dialogButton('keep',()=>dialog.close());dialogButton('reset',()=>{dialog.close();start(current,true)},true);
    }else{
      content.innerHTML='<h2 id="dialog-title">'+t(done.size===8?'all':'win')+'</h2>'+mini(scene,true)+'<p>'+t('scene',{n:current+1,name})+'</p><p class="sub">'+t('total',{n:done.size})+'</p>';
      dialogButton('replay',()=>{dialog.close();start(current,true)});
      if(done.size<8){
        dialogButton('next',()=>{dialog.close();let i=(current+1)%8;while(done.has(scenes[i].key))i=(i+1)%8;start(i)},true);
      }else dialogButton('atlasShort',()=>{dialog.close();showAtlas()},true);
    }
    dialog.setAttribute('aria-labelledby','dialog-title');
  }
  function openDialog(type){
    cancelGesture();dialogType=type;renderDialog();if(!dialog.open)dialog.showModal();
  }
  $('help').onclick=()=>openDialog('help');$('reset').onclick=()=>openDialog('reset');
  dialog.querySelector('.dialog-x').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{dialogType=''});
  const compact=matchMedia('(max-width:920px),(max-height:525px)');
  function showAtlas(){
    if(compact.matches){
      atlas.classList.add('open');document.querySelector('.mast').inert=true;
      document.querySelector('.workbook').inert=true;atlas.setAttribute('role','dialog');atlas.setAttribute('aria-modal','true');
    }
    cards[current].focus({preventScroll:true});
  }
  function closeAtlas(){
    if(!atlas.classList.contains('open'))return;
    atlas.classList.remove('open');atlas.removeAttribute('role');atlas.removeAttribute('aria-modal');
    document.querySelector('.mast').inert=false;document.querySelector('.workbook').inert=false;
    if(compact.matches)atlasButton.focus({preventScroll:true});
  }
  atlasButton.onclick=showAtlas;$('atlas-close').onclick=closeAtlas;
  compact.addEventListener('change',()=>{if(!compact.matches)closeAtlas()});
  function language(){
    $('name').textContent=t(scene.key);
    atlas.setAttribute('aria-label',t('atlas'));
    groups.forEach((g,id)=>g.setAttribute('aria-label',t('tan',{n:id+1,piece:t(kind[id])})));
    refreshCards();updateStatus();if(layout)drawPaper();if(dialog.open)renderDialog();
  }
  function start(index,replay=false){
    cancelGesture();
    if(pieces.length && !celebrating && index!==current)drafts.set(current,pieces.map(p=>({...p})));
    if(replay)drafts.delete(index);
    current=index;scene=scenes[index];celebrating=false;selected=-1;score={coverage:0,overlap:0};
    pieces=drafts.get(index)?.map(p=>({...p}))||freshPieces();
    groups.forEach(g=>layer.append(g));$('folio').innerHTML=pad(index+1)+' <i>/</i> 08';
    select(-1);fit();language();
  }
  window.addEventListener('boopland:languagechange',language);
  new ResizeObserver(fit).observe(board);start(0);
})();
