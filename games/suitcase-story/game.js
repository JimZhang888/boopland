(() => {
  'use strict';
  const E=window.SuitcaseEngine, Art=window.SuitcaseArt, I=window.BooplandI18n;
  const $=id=>document.getElementById(id), t=(key,values)=>I.t('suitcase.'+key,values);
  const storageKey='boopland-suitcase-story-v1';
  let saved={version:1,level:0,drafts:{},completed:[],sound:false};
  try {
    const value=JSON.parse(localStorage.getItem(storageKey));
    if(value&&value.version===1) {
      saved.level=Number.isInteger(value.level)&&value.level>=0&&value.level<E.levels.length?value.level:0;
      saved.completed=Array.isArray(value.completed)?[...new Set(value.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<E.levels.length))]:[];
      saved.sound=value.sound===true;
      E.levels.forEach((level,i)=>{if(value.drafts&&E.validate(level,value.drafts[i]))saved.drafts[i]=value.drafts[i];});
    }
  } catch { /* Private browsing and unavailable storage still allow a full game. */ }
  let index=saved.level, game=new E.Game(E.levels[index],saved.drafts[index]);
  let selected=null, rotation=0, preview=null, hintTarget=null, pointer=null, cell=40, closing=false;
  let statusKey='idle',statusValues={},dialogMode='',audio=null,hintBusy=false,revision=0,closeTimer=null;
  const themeColors=['#b2c4b5','#bdc7a4','#c6bdc9','#b8c9d0','#d3c2a4','#cbbdaf'];
  const item=id=>game.level.pieces.find(p=>p.id===id);
  const itemName=id=>t('item_'+item(id).kind);
  const save=()=>{saved.level=index;saved.drafts[index]=game.placements;try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}};
  function setStatus(key,values={}) {
    statusKey=key;statusValues=values;
    $('status').textContent=t(key,values.itemId?{...values,item:itemName(values.itemId)}:values);
    $('status').classList.toggle('error',key==='invalid');
  }
  function sound(kind='place') {
    if(!saved.sound||document.hidden)return;
    try {
      if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')audio.resume().catch(()=>{});
      const notes=kind==='win'?[440,554.37,659.25,880]:kind==='error'?[170]:kind==='rotate'?[390]:[530,720];
      notes.forEach((frequency,n)=>{
        const oscillator=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+n*.085;
        oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,at);
        gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.055,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+.2);
        oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.21);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
    }catch{ /* Audio is decorative. */ }
  }
  function cancelPointer() {
    if(pointer&&document.querySelector('.game-shell').hasPointerCapture?.(pointer.id))document.querySelector('.game-shell').releasePointerCapture(pointer.id);
    pointer=null;$('drag-ghost').hidden=true;
  }
  function cancelSelection() {cancelPointer();selected=null;preview=null;hintTarget=null;render();setStatus(E.complete(game.level,game.placements)?'ready':'idle');}
  function choose(id) {
    if(closing||!item(id))return;
    selected=id;rotation=game.placements[id]?.rotation||0;preview=null;hintTarget=null;
    render();setStatus('selected',{itemId:id});
  }
  function change() {
    revision++;hintTarget=null;save();render();
  }
  function place(candidate) {
    if(!selected||closing)return false;
    const id=selected;
    if(!game.place(id,{x:candidate.x,y:candidate.y,rotation})) {setStatus('invalid');sound('error');return false;}
    selected=null;preview=null;change();
    const placed=$('board').querySelector(`[data-item="${id}"]`);placed?.classList.add('popped');
    setStatus(E.complete(game.level,game.placements)?'ready':'placed',{itemId:id});sound();return true;
  }
  function rotate() {
    if(!selected||closing)return;
    rotation=(rotation+1)%4;hintTarget=null;
    if(!preview)preview=game.placements[selected]?{...game.placements[selected]}:{x:0,y:0};
    render();setStatus('rotated');sound('rotate');
    if(pointer?.dragging)updatePointer(pointer.x,pointer.y);
  }
  function remove() {
    if(!selected||closing)return;
    const id=selected;if(!game.remove(id))return;
    selected=null;preview=null;change();setStatus('removed',{itemId:id});sound('rotate');
  }
  function undo() {
    if(closing||!game.undo())return;
    cancelPointer();selected=null;preview=null;change();setStatus('undone');
  }
  function reset() {
    if(closing)return;cancelPointer();selected=null;preview=null;
    game.reset();change();setStatus('cleared');
  }
  function loadLevel(next) {
    save();cancelPointer();index=next;game=new E.Game(E.levels[index],saved.drafts[index]);selected=null;preview=null;hintTarget=null;
    closing=false;revision++;$('suitcase').classList.remove('closing');$('dialog').close();dialogMode='';save();render();fit();setStatus(E.complete(game.level,game.placements)?'ready':'idle');
  }
  function render() {
    const level=game.level,count=Object.keys(game.placements).length,total=level.pieces.length;
    const area=level.pieces.filter(p=>game.placements[p.id]).reduce((sum,p)=>sum+p.cells.length,0);
    const percent=Math.round(area/(level.width*level.height)*100);
    document.documentElement.style.setProperty('--case',themeColors[index]);
    $('trip-number').textContent=String(index+1).padStart(2,'0');$('trip-title').textContent=t('theme_'+index);$('trip-story').textContent=t('story_'+index);
    $('stamp-count').textContent=saved.completed.length+' / '+E.levels.length;
    $('board-size').textContent=t('dimension',{w:level.width,h:level.height});$('packed-count').textContent=t('packed',{n:count,total});
    $('packed-percent').textContent=percent+'%';$('progress').style.width=percent+'%';$('remaining').textContent=t('remaining',{n:total-count});
    $('board').dataset.level=String(index+1);$('board').dataset.packed=String(count);
    $('board').style.setProperty('--cols',level.width);$('board').style.setProperty('--rows',level.height);
    $('board').innerHTML=Object.entries(game.placements).map(([id,p])=>{
      const piece=item(id),bounds=E.size(E.rotate(piece.cells,p.rotation));
      return `<button class="piece${selected===id?' selected':''}" data-item="${id}" aria-label="${itemName(id)}" style="left:${p.x*cell}px;top:${p.y*cell}px;width:${bounds.w*cell}px;height:${bounds.h*cell}px">${Art.piece(piece,p.rotation)}</button>`;
    }).join('');
    $('inventory').innerHTML=level.pieces.map(piece=>{
      const active=selected===piece.id,packed=!!game.placements[piece.id];
      return `<button class="item-card${packed?' packed':''}${active?' active':''}" data-item="${piece.id}" aria-pressed="${active}" aria-label="${itemName(piece.id)}${packed?' · '+t('complete'):''}"><span class="item-art">${Art.piece(piece,active?rotation:0,true)}</span><span class="item-name">${itemName(piece.id)}</span></button>`;
    }).join('');
    $('selection-name').textContent=selected?itemName(selected):t('select');$('selection-size').textContent=selected?t('cells',{n:item(selected).cells.length}):'';
    document.querySelector('.inventory-paper').dataset.selected=String(!!selected);
    $('rotate').disabled=!selected||closing;$('remove').disabled=!selected||!game.placements[selected]||closing;
    $('mobile-rotate').disabled=$('rotate').disabled;$('mobile-remove').disabled=$('remove').disabled;
    $('undo').disabled=!game.history.length||closing;$('reset').disabled=!count||closing;
    $('hint').disabled=count===total||closing||hintBusy;$('close-case').disabled=count!==total||closing;
    $('sound').setAttribute('aria-pressed',String(saved.sound));$('sound').setAttribute('aria-label',t(saved.sound?'soundOff':'soundOn'));
    $('sound').removeAttribute('data-i18n-label');
    $('landscape').innerHTML=Art.scene(index);$('postcard-label').textContent=['SEA & SLOW','IN THE WOODS','BONJOUR','SNOW DAYS','GOLDEN HOUR','SPRING LETTER'][index];
    drawPreview();
  }
  function fit() {
    const space=$('case-space'),styles=getComputedStyle(space),shell=getComputedStyle(document.querySelector('.case-shell'));
    const width=space.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight)-parseFloat(shell.paddingLeft)-parseFloat(shell.paddingRight)-6;
    const height=space.clientHeight-parseFloat(styles.paddingTop)-parseFloat(styles.paddingBottom)-parseFloat(shell.paddingTop)-parseFloat(shell.paddingBottom)-6;
    const next=Math.max(10,Math.floor(Math.min(width/game.level.width,height/game.level.height,76)));
    $('suitcase').style.setProperty('--cell',next+'px');
    if(next!==cell){cell=next;render();}
  }
  function drawPreview() {
    $('board').querySelectorAll('.preview-cell').forEach(node=>node.remove());
    if(!selected||!preview)return;
    const candidate={x:preview.x,y:preview.y,rotation},valid=E.canPlace(game.level,game.placements,selected,candidate);
    const cells=E.cellsFor(game.level,selected,candidate).filter(([x,y])=>x>=0&&y>=0&&x<game.level.width&&y<game.level.height);
    cells.forEach(([x,y],i)=>{
      const node=document.createElement('span');node.className='preview-cell'+(valid?'':' invalid')+(hintTarget?' hint-cell':'');node.setAttribute('aria-hidden','true');
      Object.assign(node.style,{left:x*cell+'px',top:y*cell+'px',width:cell+'px',height:cell+'px'});
      if(!i)node.textContent=valid?'✓':'×';$('board').append(node);
    });
  }
  function gridPoint(x,y) {const rect=$('board').getBoundingClientRect();return {x:Math.floor((x-rect.left-1)/cell),y:Math.floor((y-rect.top-1)/cell)};}
  function inBoard(x,y) {const r=$('board').getBoundingClientRect();return x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom;}
  function updatePointer(x,y) {
    if(!pointer||!selected)return;
    pointer.x=x;pointer.y=y;
    const bounds=E.size(E.rotate(item(selected).cells,rotation));
    const anchor={x:Math.min(pointer.anchor.x,bounds.w-1),y:Math.min(pointer.anchor.y,bounds.h-1)};
    const ghost=$('drag-ghost');ghost.hidden=false;ghost.innerHTML=Art.piece(item(selected),rotation);
    Object.assign(ghost.style,{width:bounds.w*cell+'px',height:bounds.h*cell+'px',transform:`translate(${x-(anchor.x+.5)*cell}px,${y-(anchor.y+.5)*cell}px)`});
    if(inBoard(x,y)) {const point=gridPoint(x,y);preview={x:point.x-anchor.x,y:point.y-anchor.y};}
    else preview=null;drawPreview();
  }
  function boardTap(x,y) {
    if(!selected)return;const point=gridPoint(x,y);
    if(hintTarget&&E.cellsFor(game.level,selected,hintTarget).some(p=>p[0]===point.x&&p[1]===point.y))place(hintTarget);
    else place(point);
  }
  document.querySelector('.packing-desk').addEventListener('pointerdown',event=>{
    if(event.button!==0||closing||$('dialog').open||pointer)return;
    const card=event.target.closest('[data-item]'),onBoard=event.target.closest('#board');
    if(!card&&!onBoard)return;
    const id=card?.dataset.item,inventory=!!event.target.closest('#inventory');
    let mode='tap',anchor={x:0,y:0};
    if(card&&(inventory||!selected||selected===id)) {
      const alreadySelected=selected===id;
      if(selected!==id)choose(id);
      mode=inventory?'inventory':alreadySelected?'selected-pickup':'pickup';
      const cells=E.rotate(item(id).cells,rotation),bounds=E.size(cells);
      if(inventory) anchor={x:Math.floor(bounds.w/2),y:Math.floor(bounds.h/2)};
      else {const p=gridPoint(event.clientX,event.clientY),placed=game.placements[id];anchor={x:p.x-placed.x,y:p.y-placed.y};}
    }
    pointer={id:event.pointerId,mode,anchor,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,dragging:false};
    document.querySelector('.game-shell').setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  document.addEventListener('pointermove',event=>{
    if(pointer&&event.pointerId===pointer.id) {
      if(!pointer.dragging&&pointer.mode!=='tap'&&Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>5){pointer.dragging=true;hintTarget=null;}
      if(pointer.dragging){event.preventDefault();updatePointer(event.clientX,event.clientY);}return;
    }
    if(selected&&!hintTarget&&inBoard(event.clientX,event.clientY)) {preview=gridPoint(event.clientX,event.clientY);drawPreview();}
  },{passive:false});
  document.addEventListener('pointerup',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const previous=pointer;
    if(previous.dragging) {
      updatePointer(event.clientX,event.clientY);
      if(preview)place(preview);
      else if(previous.mode.endsWith('pickup')) {
        const r=$('inventory').getBoundingClientRect();
        if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)remove();
        else setStatus('invalid');
      }
    } else if((previous.mode==='tap'||previous.mode==='selected-pickup')&&inBoard(event.clientX,event.clientY))boardTap(event.clientX,event.clientY);
    cancelPointer();drawPreview();
  });
  document.addEventListener('pointercancel',()=>{cancelPointer();preview=null;drawPreview();});
  document.querySelector('.packing-desk').addEventListener('click',event=>{
    // Keyboard and assistive-tech button activation have no pointer sequence.
    if(event.detail===0) {const card=event.target.closest('[data-item]');if(card){choose(card.dataset.item);$('board').focus({preventScroll:true});}}
  });
  $('board').addEventListener('pointerleave',()=>{if(!pointer&&!hintTarget){preview=null;drawPreview();}});
  $('rotate').addEventListener('click',rotate);$('remove').addEventListener('click',remove);$('undo').addEventListener('click',undo);$('reset').addEventListener('click',reset);
  $('mobile-rotate').addEventListener('click',rotate);$('mobile-remove').addEventListener('click',remove);
  $('sound').addEventListener('click',()=>{saved.sound=!saved.sound;save();render();if(saved.sound)sound();else audio?.suspend().catch(()=>{});});
  document.addEventListener('keydown',event=>{
    if($('dialog').open||closing||event.target.matches('input,textarea,select'))return;
    const focusedItem=event.target.closest('[data-item]');
    if(focusedItem&&(event.key==='Enter'||event.key===' ')){event.preventDefault();choose(focusedItem.dataset.item);$('board').focus({preventScroll:true});return;}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();return;}
    if(event.key==='Escape'){cancelSelection();return;}
    if(!selected)return;
    if(event.key.toLowerCase()==='r'){event.preventDefault();rotate();}
    if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();remove();}
    if(event.key==='Enter'&&event.target===$('board')){event.preventDefault();place(preview||{x:0,y:0});}
    const vector={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(vector){event.preventDefault();hintTarget=null;preview=preview||game.placements[selected]||{x:0,y:0};preview={x:Math.max(0,Math.min(game.level.width-1,preview.x+vector[0])),y:Math.max(0,Math.min(game.level.height-1,preview.y+vector[1]))};drawPreview();$('board').focus({preventScroll:true});}
  });
  $('hint').addEventListener('click',()=>{
    if(hintBusy||closing)return;cancelPointer();hintBusy=true;const before=revision;setStatus('thinking');render();
    setTimeout(()=>{
      if(before!==revision){hintBusy=false;render();return;}
      const solution=E.solve(game.level,game.placements,2500);hintBusy=false;
      if(solution?.length){const suggestion=solution[0];choose(suggestion.id);rotation=suggestion.rotation;preview={x:suggestion.x,y:suggestion.y};hintTarget=suggestion;render();setStatus('hintReady');}
      else {
        const mismatched=game.level.pieces.find(p=>game.placements[p.id]&&JSON.stringify(E.cellsFor(game.level,p.id,game.placements[p.id]))!==JSON.stringify(E.cellsFor(game.level,p.id,p.home)));
        if(mismatched){choose(mismatched.id);setStatus('hintMove',{itemId:mismatched.id});}
        else {const p=game.level.pieces.find(p=>!game.placements[p.id]);if(p){choose(p.id);rotation=p.home.rotation;preview={x:p.home.x,y:p.home.y};hintTarget={...p.home,id:p.id};render();setStatus('hintReady');}}
      }
    },30);
  });
  function showDialog(mode) {
    cancelPointer();dialogMode=mode;renderDialog();if(!$('dialog').open)$('dialog').showModal();
  }
  function renderDialog() {
    const content=$('dialog-content');content.replaceChildren();
    if(dialogMode==='help') {
      $('dialog-title').textContent=t('help');const list=document.createElement('ol');list.className='help-list';
      for(let i=1;i<=4;i++){const li=document.createElement('li');li.textContent=t('help'+i);list.append(li);}content.append(list);
      const button=document.createElement('button');button.className='primary-button';button.textContent=t('gotIt');button.onclick=()=>closeDialog();content.append(button);
    } else if(dialogMode==='trips') {
      $('dialog-title').textContent=t('trips');const intro=document.createElement('p');intro.className='inventory-tip';intro.textContent=t('tripIntro');content.append(intro);
      const list=document.createElement('div');list.className='trip-list';
      E.levels.forEach((level,i)=>{const button=document.createElement('button');button.className='trip-card'+(i===index?' current':'');button.dataset.level=i;
        button.innerHTML=`<small>${String(i+1).padStart(2,'0')} / 06</small><strong>${t('theme_'+i)}</strong><small>${t(i===index?'current':saved.completed.includes(i)?'visited':'visit')}</small><span class="trip-stamp" aria-hidden="true">${saved.completed.includes(i)?'✓':''}</span>`;
        button.onclick=()=>loadLevel(i);list.append(button);});content.append(list);
    } else if(dialogMode==='win') {
      const all=saved.completed.length===E.levels.length;
      $('dialog-title').textContent=t('complete');
      const wrap=document.createElement('div');wrap.className='win-card';
      wrap.innerHTML=`<div class="win-stamp" aria-hidden="true">✓</div><h3>${t(all?'allTitle':'winTitle')}</h3><p>${t(all?'allText':'winText',{trip:t('theme_'+index)})}</p><div class="win-progress" aria-label="${t('stamp',{n:saved.completed.length})}">${E.levels.map((_,i)=>`<span class="${saved.completed.includes(i)?'done':''}" aria-hidden="true">${saved.completed.includes(i)?'✿':'○'}</span>`).join('')}</div>`;
      const next=document.createElement('button');next.className='primary-button';next.id='next-trip';next.textContent=t(all?'viewTrips':'next')+' →';
      next.onclick=()=>{if(all)showDialog('trips');else {let nextIndex=(index+1)%E.levels.length;for(let n=0;n<E.levels.length&&saved.completed.includes(nextIndex);n++)nextIndex=(nextIndex+1)%E.levels.length;loadLevel(nextIndex);}};
      const replay=document.createElement('button');replay.textContent=t('replay');replay.style.marginTop='12px';replay.onclick=()=>{closeDialog();reset();};wrap.append(next,replay);content.append(wrap);
    }
  }
  function closeDialog(){ $('dialog').close();dialogMode='';}
  $('help').addEventListener('click',()=>showDialog('help'));$('trips').addEventListener('click',()=>showDialog('trips'));
  $('quick-trips').addEventListener('click',()=>showDialog('trips'));
  $('close-dialog').addEventListener('click',closeDialog);$('dialog').addEventListener('cancel',()=>{dialogMode='';});
  $('close-case').addEventListener('click',()=>{
    if(closing||!E.complete(game.level,game.placements))return;
    cancelPointer();selected=null;preview=null;closing=true;render();$('suitcase').classList.add('closing');sound('win');
    if(!saved.completed.includes(index))saved.completed.push(index);save();
    clearTimeout(closeTimer);closeTimer=setTimeout(()=>{closing=false;$('suitcase').classList.remove('closing');render();showDialog('win');},450);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelPointer();audio?.suspend().catch(()=>{});}});
  window.addEventListener('blur',()=>cancelPointer());
  window.addEventListener('boopland:languagechange',()=>{render();setStatus(statusKey,statusValues);if($('dialog').open)renderDialog();fit();});
  let resizeFrame=0;new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(fit);}).observe($('case-space'));
  render();fit();setStatus(E.complete(game.level,game.placements)?'ready':'idle');
})();
