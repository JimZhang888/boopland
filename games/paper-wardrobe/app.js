(() => {
  'use strict';
  const E=window.PaperWardrobe,A=window.WardrobeArt,I=window.BooplandI18n;
  const $=id=>document.getElementById(id),t=(key,values)=>I.t('wardrobe.'+key,values),name=id=>t('item_'+id),taskName=id=>t('task_'+id);
  const storageKey='boopland-paper-wardrobe-v1';
  let storageOK=true,restored=false;
  let state;
  try {const raw=localStorage.getItem(storageKey);state=E.sanitize(raw?JSON.parse(raw):null);restored=!!raw;}catch{state=E.freshState();storageOK=false;}
  let category='top',history=[],inspirationIndex=0,lastSelected=null,statusKey=storageOK?'autoSaved':'storageError',statusValues={};
  let modal=null,exportURL=null,exportPending=false,exportToken=0;
  const currentTask=()=>E.tasks.find(task=>task.id===state.task);
  function status(key,values={}){statusKey=key;statusValues=values;$('status').textContent=t(key,values);}
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));storageOK=true;}catch{storageOK=false;status('storageError');}return storageOK;}
  function remember(){history.push({...state.outfit});if(history.length>25)history.shift();}
  function changeOutfit(next,message,values={}){remember();state.outfit=next;if(message)status(message,values);persist();render();}
  function dateText(date){return new Intl.DateTimeFormat(I.language,{year:'numeric',month:'short',day:'numeric'}).format(new Date(date));}
  function renderCategories(){
    $('categories').innerHTML=E.categories.map(id=>`<button data-category="${id}" aria-pressed="${id===category}" aria-label="${A.escape(t(id))}">${A.icon(id)}<span>${A.escape(t(id))}</span></button>`).join('');
  }
  function renderItems(focusId=null){
    const scroll=$('closet-scroll').scrollTop;
    $('items').innerHTML=E.items.filter(item=>item.category===category).map(item=>{
      const reward=E.tasks.find(task=>task.reward===item.id),locked=!!reward&&!state.unlocked.includes(item.id),selected=state.outfit[item.slot]===item.id;
      const tags=item.tags.filter(Boolean).map(tag=>t(tag)).join(' · ');
      return `<button class="item-card${locked?' locked':''}" data-item="${item.id}" aria-pressed="${selected}" aria-label="${A.escape(name(item.id)+(locked?' · '+t('locked',{task:taskName(reward.id)}):tags?' · '+tags:''))}">${A.thumbnail(item)}<span class="item-name">${A.escape(name(item.id))}</span><span class="item-tags">${A.escape(tags||t(item.category))}</span>${locked?'<span class="lock-mark" aria-hidden="true">◇</span>':''}</button>`;
    }).join('');
    $('closet-scroll').scrollTop=scroll;
    if(focusId)$('items').querySelector(`[data-item="${focusId}"]`)?.focus({preventScroll:true});
  }
  function render(){
    $('stage').innerHTML=A.render(state.outfit);
    $('outfit-caption').textContent=name(state.outfit.background);
    $('studio-label').textContent=state.mode==='free'?t('daily'):taskName(state.task);
    document.querySelector('.edition').textContent='✦ '+String(E.tasks.filter(task=>state.scores[task.id]>=75).length).padStart(2,'0')+' / 12';
    $('brief-eyebrow').textContent=t(state.mode);
    $('brief-title').textContent=state.mode==='free'?t('freeTitle'):taskName(state.task);
    $('brief-description').textContent=state.mode==='free'?t('freeDesc'):t('task_'+state.task+'Desc');
    $('choose').hidden=state.mode==='free';$('choose').textContent=t(state.mode==='order'?'chooseOrder':'choose');
    $('unlocked-count').textContent=t('owned',{owned:E.unlocked(state).length,total:E.items.length});
    $('submit-label').textContent=t(state.mode==='free'?'save':state.mode==='order'?'deliver':'submit');
    $('album-count').textContent=state.album.length;
    $('undo').disabled=!history.length;
    document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.mode===state.mode));
    $('skin-picker').innerHTML=A.skinColors.map((color,i)=>`<button style="--skin:${color}" data-skin="${i}" aria-label="${A.escape(t('skinTone',{number:i+1}))}" aria-pressed="${state.outfit.skin===i}"></button>`).join('');
    $('selection-note').textContent=lastSelected?name(lastSelected):t('selectTip');
    renderItems();
    $('status').textContent=t(storageOK?statusKey:'storageError',statusValues);
  }
  function switchMode(mode){
    if(mode===state.mode)return;
    state.mode=mode;
    if(mode!=='free'){
      const task=E.tasks.find(task=>task.type===mode&&task.id===state.task)||E.tasks.find(task=>task.type===mode);
      state.task=task.id;remember();state.outfit.background=task.background;
    }
    persist();render();
    if(mode!=='free')showTasks();
  }
  function selectTask(id){
    const task=E.tasks.find(task=>task.id===id);if(!task)return;
    state.task=id;state.mode=task.type;remember();state.outfit.background=task.background;persist();closeModal();render();status('taskHint');
  }
  function openModal(title,content,type){
    modal=type;$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;
    if(!$('dialog').open)$('dialog').showModal();
    $('dialog').scrollTop=0;
    I.apply($('dialog'));
  }
  function closeModal(){$('dialog').close();modal=null;}
  function showTasks(){
    const list=E.tasks.filter(task=>task.type===state.mode);
    openModal(t(state.mode==='order'?'chooseOrder':'chooseTitle'),`<p>${A.escape(t('taskHint'))}</p><div class="task-list">${list.map(task=>`<button class="task-card" data-task="${task.id}">${A.thumbnail(E.byId[task.background])}<div><h3>${A.escape(taskName(task.id))}</h3><small>${A.escape(t('task_'+task.id+'Desc'))}</small><small>${A.escape(t('reward',{name:name(task.reward)}))}</small></div><span class="task-score">${state.scores[task.id]>=75?'✓':state.scores[task.id]??'↗'}</span></button>`).join('')}</div>`,'tasks');
  }
  function saveOutfit(){
    if(state.album.length>=24){status('albumFull');return;}
    state.album.unshift({id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),date:new Date().toISOString(),outfit:{...state.outfit},task:state.mode==='free'?null:state.task});
    status('saved');persist();render();
  }
  function showAlbum(){
    const body=state.album.length?`<div class="album-grid">${state.album.map(look=>`<article class="album-card">${A.render(look.outfit)}<span>${A.escape(dateText(look.date))} · ${A.escape(look.task?taskName(look.task):name(look.outfit.background))}</span><button data-restore="${A.escape(look.id)}">${A.escape(t('wearAgain'))}</button></article>`).join('')}</div>`:`<div class="empty-album"><span aria-hidden="true">▧</span><p>${A.escape(t('albumEmpty'))}</p></div>`;
    openModal(t('album')+' · '+state.album.length+'/24',body,'album');
  }
  function showHelp(){openModal(t('help'),`<ol class="help-list">${[1,2,3,4,5].map(n=>`<li>${A.escape(t('help'+n))}</li>`).join('')}</ol>`,'help');}
  function showLocked(id){const task=E.tasks.find(task=>task.reward===id);openModal(name(id),`<div class="reward-box">${A.thumbnail(E.byId[id])}<p>${A.escape(t('locked',{task:taskName(task.id)}))}</p></div><p>${A.escape(t('task_'+task.id+'Desc'))}</p><p>${A.escape(t('taskHint'))}</p><div class="dialog-buttons"><button class="primary" data-task="${task.id}">${A.escape(t(task.type==='order'?'order':'challenge'))} ↗</button></div>`,{type:'locked',id});}
  function showResult(result,task){
    const rows=result.rows.map(row=>{
      const values={...row.values};if(values.color)values.color=t(values.color);if(values.style)values.style=t(values.style);
      return `<div class="score-row"><div><span>${A.escape(t(row.key))}</span><span>${row.points} / ${row.max}</span></div><small>${A.escape(t(row.message,values))}</small></div>`;
    }).join('');
    const reward=result.pass?`<div class="reward-box">${A.thumbnail(E.byId[task.reward])}<div><b>${A.escape(t('reward',{name:name(task.reward)}))}</b><p>${A.escape(t(result.newReward?'unlocked':'alreadyReward'))}</p></div></div>`:`<p>${A.escape(t('taskHint'))}</p>`;
    openModal(t('result'),`<div class="score-header"><strong>${result.score}<small style="font-size:17px"> / 100</small></strong><span>${A.escape(t(result.pass?'passed':'retry'))}</span><p>${A.escape(taskName(task.id))} · ${A.escape(t('best',{score:state.scores[task.id]}))}</p></div>${rows}${reward}<div class="dialog-buttons"><button data-dialog-save>${A.escape(t('save'))}</button><button class="primary" ${result.pass?'data-next':'data-close'}>${A.escape(t(result.pass?'next':'keepStyling'))}</button></div>`,{type:'result',result,task});
  }
  async function exportPostcard(){
    if(exportPending)return;
    exportPending=true;$('export').disabled=true;const token=++exportToken;
    status('exporting');
    const date=new Date(),outfit={...state.outfit};
    const svg=A.render(outfit,{postcard:true,title:t('name'),caption:state.mode==='free'?name(outfit.background):taskName(state.task),date:dateText(date)});
    let sourceURL;
    try{
      sourceURL=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
      const img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=sourceURL;});
      const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=1440;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,1040,1440);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG unavailable')),'image/png'));
      if(token!==exportToken)return;
      if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(blob);
      const fileDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
      const content=`<img class="export-preview" src="${exportURL}" alt="${A.escape(t('preview'))}"><p>${A.escape(t('exportTip'))}</p><a class="primary export-link" href="${exportURL}" download="paper-wardrobe-${fileDate}.png">↓ ${A.escape(t('download'))}</a>`;
      openModal(t('exportTitle'),content,{type:'export',content});status('autoSaved');
    }catch{status('exportError');}
    finally{if(sourceURL)URL.revokeObjectURL(sourceURL);exportPending=false;$('export').disabled=false;}
  }
  $('categories').addEventListener('click',event=>{
    const button=event.target.closest('[data-category]');if(!button)return;
    category=button.dataset.category;renderCategories();renderItems();$('closet-scroll').scrollTop=0;
    $('categories').querySelector(`[data-category="${category}"]`).focus({preventScroll:true});
  });
  $('items').addEventListener('click',event=>{
    const button=event.target.closest('[data-item]');if(!button)return;
    const id=button.dataset.item,next=E.equip(state.outfit,id,state);
    if(!next){showLocked(id);return;}
    lastSelected=id;changeOutfit(next,next[E.byId[id].slot]===id?'selected':'removed',{name:name(id)});renderItems(id);
  });
  $('skin-picker').addEventListener('click',event=>{
    const button=event.target.closest('[data-skin]');if(!button)return;
    const skin=Number(button.dataset.skin);if(skin!==state.outfit.skin)changeOutfit({...state.outfit,skin});
    $('skin-picker').querySelector(`[data-skin="${skin}"]`).focus({preventScroll:true});
  });
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>switchMode(button.dataset.mode)));
  $('inspire').addEventListener('click',()=>{const next=E.inspiration(inspirationIndex++,state.outfit.skin);if(state.mode!=='free')next.background=currentTask().background;changeOutfit(next,'autoSaved');});
  $('undo').addEventListener('click',()=>{if(!history.length)return;state.outfit=history.pop();status('undone');persist();render();});
  $('reset').addEventListener('click',()=>{const next={...E.defaultOutfit,skin:state.outfit.skin};if(state.mode!=='free')next.background=currentTask().background;changeOutfit(next,'resetDone');});
  $('submit').addEventListener('click',()=>{if(state.mode==='free')saveOutfit();else{const task=currentTask(),result=E.complete(state,task);persist();render();showResult(result,task);}});
  $('choose').addEventListener('click',showTasks);$('album').addEventListener('click',showAlbum);$('help').addEventListener('click',showHelp);$('export').addEventListener('click',exportPostcard);
  $('close-dialog').addEventListener('click',closeModal);
  $('dialog').addEventListener('close',()=>{modal=null;});
  $('dialog').addEventListener('click',event=>{if(event.target===$('dialog')){const rect=$('dialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
  $('dialog-content').addEventListener('click',event=>{
    const task=event.target.closest('[data-task]');if(task){selectTask(task.dataset.task);return;}
    const restore=event.target.closest('[data-restore]');if(restore){const look=state.album.find(x=>x.id===restore.dataset.restore);if(look){changeOutfit({...look.outfit},'restored');closeModal();}return;}
    if(event.target.closest('[data-close]'))closeModal();
    if(event.target.closest('[data-dialog-save]')){saveOutfit();closeModal();}
    if(event.target.closest('[data-next]')){const list=E.tasks.filter(x=>x.type===state.mode),i=list.findIndex(x=>x.id===state.task);selectTask(list[(i+1)%list.length].id);}
  });
  window.addEventListener('boopland:languagechange',()=>{
    if(lastSelected&&['selected','removed'].includes(statusKey))statusValues={name:name(lastSelected)};
    renderCategories();render();
    if(modal==='help')showHelp();else if(modal==='album')showAlbum();else if(modal==='tasks')showTasks();else if(modal?.type==='locked')showLocked(modal.id);else if(modal?.type==='result')showResult(modal.result,modal.task);else if(modal?.type==='export'){closeModal();exportPostcard();}
  });
  renderCategories();render();
  if(restored&&storageOK)status('restored');
})();
