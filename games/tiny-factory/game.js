(function () {
  'use strict';
  const E=TinyFactory,A=FactoryArt,$=id=>document.getElementById(id),t=(key,values)=>BooplandI18n.t('factory.'+key,values);
  const saveKey='boopland-tiny-factory-v1',tools=['belt','cutter','painter','rotator','erase'];
  let state=E.create(),storageOkay=true;
  try{state=E.restore(localStorage.getItem(saveKey))||state;}catch{storageOkay=false;}
  let running=false,speed=1,tool='belt',dir=0,color='red',hint=state.level===0,hover=null,cursor={x:1,y:1},drag=null,undo=[],effects=[],dialogMode='',messageKey=state.level===0?'firstHint':'ready',messageValues={};
  const renderer=new A.Renderer($('board'),$('board-space'));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function save(){try{localStorage.setItem(saveKey,E.serialize(state));storageOkay=true;}catch{storageOkay=false;}$('save-label').textContent=t(storageOkay?'saved':'saveFailed');}
  function say(key,values={}){messageKey=key;messageValues=values;$('message').textContent=t(key,values);}
  function partName(item){return t(item.mask===15?'full':item.mask===3||item.mask===6||item.mask===9||item.mask===12?'half':'quarter');}
  function itemName(item){return t('piece',{color:t(item.color),part:partName(item),shape:t(item.shape)});}
  function recipe(item){
    const result=[];if(item.color!=='plain')result.push(t('colorStep',{color:t(item.color)}));
    if(item.mask!==15)result.push(t('cutStep',{n:item.mask===3?1:2}));
    if(item.mask===2||item.mask===4)result.push(t('turnStep',{n:item.mask===2?1:2}));
    return result.length?result.join(' → '):t('source')+' → '+t('belt')+' → '+t('hub');
  }
  function makeTools(){
    $('build-tools').replaceChildren();
    tools.forEach((type,i)=>{const b=document.createElement('button');b.type='button';b.className='build-tool';b.dataset.tool=type;b.innerHTML=A.icon(type)+'<kbd>'+(i+1)+'</kbd><span></span>';b.querySelector('span').textContent=t(type);b.setAttribute('aria-label',t(type));b.title=t(type);b.onclick=()=>choose(type);$('build-tools').append(b);});
    $('palette').replaceChildren();
    for(const value of E.COLORS.slice(1)){const b=document.createElement('button');b.type='button';b.className='swatch';b.dataset.color=value;b.style.background=A.colors[value];b.setAttribute('aria-label',t(value));b.title=t(value);b.onclick=()=>{color=value;if(E.unlocked('painter',state.level))choose('painter');else refreshTools();};$('palette').append(b);}
    refreshTools();
  }
  function refreshTools(){
    document.querySelectorAll('[data-tool]').forEach(b=>{const value=b.dataset.tool,locked=value!=='erase'&&!E.unlocked(value,state.level);b.disabled=locked;b.setAttribute('aria-pressed',String(value===tool));b.title=locked?t('locked',{n:value==='painter'?2:value==='cutter'?3:7}):t(value);});
    document.querySelectorAll('[data-color]').forEach(b=>{const chosen=b.dataset.color===color;b.setAttribute('aria-pressed',String(chosen));b.textContent=chosen?'✓':'';b.disabled=!E.unlocked('painter',state.level);});
    $('rotate').disabled=tool==='erase';$('direction-arrow').textContent=['→','↓','←','↑'][renderer.direction(dir)];$('undo').disabled=!undo.length;
  }
  function refresh(){
    const order=E.ORDERS[state.level];
    document.body.classList.toggle('is-running',running);
    $('running-label').textContent=t(running?'running':state.clock?'paused':'build');
    $('play-label').textContent=t(running?'pause':'play');$('play').firstElementChild.textContent=running?'Ⅱ':'▶';$('play').setAttribute('aria-label',t(running?'pause':'play'));$('play').setAttribute('aria-pressed',String(running));
    $('speed').textContent=speed+'×';$('speed').setAttribute('aria-label',t('speed')+': '+speed+'×');
    $('order-number').textContent=String(state.level+1).padStart(2,'0')+' / 08';$('order-title').textContent=t('orderName'+(state.level+1));
    $('target-name').textContent=itemName(order);$('target-art').innerHTML=A.shapeSVG(order);
    $('progress-label').textContent=state.delivered+' / '+order.count;$('progress-fill').style.width=(state.delivered/order.count*100)+'%';
    $('progress-fill').parentElement.setAttribute('role','progressbar');$('progress-fill').parentElement.setAttribute('aria-label',t('delivered'));$('progress-fill').parentElement.setAttribute('aria-valuenow',state.delivered);$('progress-fill').parentElement.setAttribute('aria-valuemin',0);$('progress-fill').parentElement.setAttribute('aria-valuemax',order.count);
    $('recipe-text').textContent=recipe(order);
    const sequence=['source',...E.blueprint(state.level).filter(p=>p.type!=='belt').map(p=>p.type),'hub'];
    $('recipe-icons').innerHTML=sequence.map(A.icon).join('<span>→</span>');
    $('reject-label').textContent=t('rejects',{n:state.rejected});$('save-label').textContent=t(storageOkay?'saved':'saveFailed');
    $('machine-count').textContent=t('machines',{n:state.board.filter(tile=>tile&&E.TYPES.includes(tile.type)).length});
    $('hint').setAttribute('aria-pressed',String(hint));say(messageKey,messageValues);refreshTools();
  }
  function choose(value){if(value!=='erase'&&!E.unlocked(value,state.level))return;tool=value;say(value==='erase'?'eraseText':'selectText',{tool:t(value)});refreshTools();}
  function rotate(){if(tool==='erase')return;dir=(dir+1)%4;refreshTools();say('rotated',{arrow:['→','↓','←','↑'][renderer.direction(dir)]});}
  function checkpoint(){undo.push(E.clone(state.board));if(undo.length>35)undo.shift();}
  function undoBuild(){if(!undo.length)return;state.board=undo.pop();state.slots.fill(null);save();refresh();}
  function build(p,chosenDir=dir,chosenTool=tool){return E.place(state,p.x,p.y,chosenTool,chosenDir,color);}
  function begin(event){
    if(event.button!==0&&event.button!==2)return;if($('dialog').open)return;
    const p=renderer.cellAt(event.clientX,event.clientY);if(!p)return;
    event.preventDefault();$('board').focus({preventScroll:true});$('board').setPointerCapture(event.pointerId);
    checkpoint();const selected=event.button===2?'erase':tool;
    drag={last:p,tool:selected,changed:false,pointer:event.pointerId};hover=p;cursor=p;drag.changed=build(p,dir,selected);refresh();
  }
  function move(event){
    const p=renderer.cellAt(event.clientX,event.clientY);hover=p;if(p)cursor=p;if(!drag||!p||event.pointerId!==drag.pointer)return;
    let previous=drag.last;
    // Fill skipped cells so fast mouse and touch strokes never leave gaps.
    const path=[];let x=previous.x,y=previous.y;
    while(x!==p.x||y!==p.y){if(Math.abs(p.x-x)>=Math.abs(p.y-y)&&x!==p.x)x+=Math.sign(p.x-x);else y+=Math.sign(p.y-y);path.push({x,y});}
    for(const next of path){
      const direction=E.DIRS.findIndex(([dx,dy])=>previous.x+dx===next.x&&previous.y+dy===next.y);
      if(drag.tool==='belt'){
        const tile=state.board[E.at(previous.x,previous.y)];
        if(!tile||tile.type==='belt')drag.changed=build(previous,direction,'belt')||drag.changed;
        // Passing over an existing processor preserves it and its direction.
        const target=state.board[E.at(next.x,next.y)];
        if(!target||target.type==='belt')drag.changed=build(next,direction,'belt')||drag.changed;
        dir=direction;
      }else drag.changed=build(next,dir,drag.tool)||drag.changed;
      previous=next;
    }
    drag.last=p;refreshTools();
  }
  function end(event){if(!drag||event&&event.pointerId!==drag.pointer)return;if(!drag.changed)undo.pop();drag=null;save();refresh();}
  $('board').addEventListener('pointerdown',begin);$('board').addEventListener('pointermove',move);$('board').addEventListener('pointerup',end);$('board').addEventListener('pointercancel',end);$('board').addEventListener('lostpointercapture',end);$('board').addEventListener('pointerleave',()=>{if(!drag)hover=null;});$('board').addEventListener('contextmenu',e=>e.preventDefault());
  function toggle(){if(state.completed){openDialog('complete');return;}running=!running;refresh();}
  $('play').onclick=toggle;$('rotate').onclick=rotate;$('speed').onclick=()=>{speed=speed===1?2:speed===2?3:1;refresh();};$('undo').onclick=undoBuild;
  $('hint').onclick=()=>{hint=!hint;say(hint?'blueprint':'ready');refresh();};$('help').onclick=()=>openDialog('help');$('restart').onclick=()=>openDialog('restart');$('orders').onclick=()=>openDialog('orders');
  function action(label,fn,primary=false){const button=document.createElement('button');button.textContent=t(label);if(primary)button.className='primary';button.onclick=fn;$('dialog-actions').append(button);}
  function closeDialog(){if($('dialog').open)$('dialog').close();dialogMode='';$('play').focus({preventScroll:true});}
  function restart(){state=E.create();undo=[];effects=[];tool='belt';dir=0;color='red';hint=true;speed=1;running=false;hover=null;cursor={x:1,y:1};say('firstHint');save();closeDialog();makeTools();refresh();}
  function openDialog(mode){
    running=false;end();dialogMode=mode;refresh();$('dialog-body').replaceChildren();$('dialog-actions').replaceChildren();
    if(mode==='help'){$('dialog-title').textContent=t('help');$('dialog-body').textContent=t('helpText');action('close',closeDialog,true);}
    if(mode==='restart'){$('dialog-title').textContent=t('restart');$('dialog-body').textContent=t('resetText');action('cancel',closeDialog);action('restart',restart,true);}
    if(mode==='complete'){
      const final=state.level===7;$('dialog-title').textContent=t(final?'allDone':'done');
      const art=document.createElement('div');art.className='completion-art';art.innerHTML=A.shapeSVG(E.ORDERS[state.level]);$('dialog-body').append(art);
      const copy=document.createElement('p');copy.textContent=final?t('finished',{n:state.total}):t('goal',{n:E.ORDERS[state.level].count});$('dialog-body').append(copy);
      action(final?'again':'continue',()=>{if(final){openDialog('restart');return;}E.nextOrder(state);undo=[];tool='belt';hint=false;save();closeDialog();say('ready');makeTools();refresh();},true);action('close',closeDialog);
    }
    if(mode==='orders'){
      $('dialog-title').textContent=t('orders');const list=document.createElement('ol');list.className='order-list';
      E.ORDERS.forEach((o,i)=>{const row=document.createElement('li');row.innerHTML=A.shapeSVG(o);const name=document.createElement('span');name.textContent=(i+1)+'. '+t('orderName'+(i+1));row.append(name);const mark=document.createElement('strong');mark.textContent=i<state.level||i===state.level&&state.completed?'✓':o.count;row.append(mark);list.append(row);});$('dialog-body').append(list);action('close',closeDialog,true);
    }
    if(!$('dialog').open)$('dialog').showModal();
  }
  $('close-dialog').onclick=closeDialog;$('dialog').addEventListener('close',()=>{dialogMode='';});$('dialog').addEventListener('click',e=>{if(e.target===$('dialog')){const r=$('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  window.addEventListener('keydown',event=>{
    if($('dialog').open||event.altKey)return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();end();undoBuild();return;}
    if(event.ctrlKey||event.metaKey)return;
    if(event.code==='Space'){event.preventDefault();toggle();}
    if(event.key.toLowerCase()==='r'){event.preventDefault();rotate();}
    if(/^[1-5]$/.test(event.key))choose(tools[+event.key-1]);
    if(event.target!==$('board'))return;
    const directions={ArrowRight:0,ArrowDown:1,ArrowLeft:2,ArrowUp:3};
    if(event.key in directions){event.preventDefault();const physical=directions[event.key],logical=(physical+(renderer.vertical?3:0))%4,[dx,dy]=E.DIRS[logical];cursor={x:Math.max(0,Math.min(E.W-1,cursor.x+dx)),y:Math.max(0,Math.min(E.H-1,cursor.y+dy))};hover=cursor;const tile=state.board[E.at(cursor.x,cursor.y)];say('cell',{x:cursor.x+1,y:cursor.y+1,name:t(tile?.type||'empty')});}
    if(event.key==='Enter'||event.key==='Delete'||event.key==='Backspace'){event.preventDefault();hover=cursor;checkpoint();if(!build(cursor,dir,event.key==='Enter'?tool:'erase'))undo.pop();const tile=state.board[E.at(cursor.x,cursor.y)];say('cell',{x:cursor.x+1,y:cursor.y+1,name:t(tile?.type||'empty')});save();refresh();}
  });
  window.addEventListener('boopland:languagechange',()=>{makeTools();refresh();if(dialogMode)openDialog(dialogMode);});
  new ResizeObserver(()=>{renderer.resize();refreshTools();}).observe($('board-space'));
  let previous=performance.now(),frameId;
  function frame(now){
    const elapsed=Math.min((now-previous)/1000,.1);previous=now;
    if(running&&!document.hidden){
      for(let n=0;n<speed;n++)for(const event of E.step(state,elapsed)){
        if(event.type==='delivery'||event.type==='reject'){effects.push({life:1,good:event.type==='delivery'});if(event.type==='reject')say('misfit');refresh();save();}
        if(event.type==='complete'){save();openDialog('complete');}
      }
    }
    effects=effects.filter(effect=>(effect.life-=elapsed*1.8)>0);
    renderer.draw(state,{running:running&&!reduced,hint,hover,tool,dir,color,effects:reduced?[]:effects});
    frameId=requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;end();save();refresh();cancelAnimationFrame(frameId);}else{previous=performance.now();frameId=requestAnimationFrame(frame);}});
  window.addEventListener('pagehide',()=>{running=false;save();cancelAnimationFrame(frameId);});
  window.addEventListener('pageshow',event=>{if(event.persisted){previous=performance.now();cancelAnimationFrame(frameId);frameId=requestAnimationFrame(frame);}});
  makeTools();refresh();frameId=requestAnimationFrame(frame);if(state.completed)openDialog('complete');
})();
