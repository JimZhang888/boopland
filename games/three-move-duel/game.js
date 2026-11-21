(() => {
  'use strict';
  const E = window.BridgeDuel, A = window.DuelArt;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('bridgeDuel.'+key, values);
  const icon = (name, css='ico') => '<svg class="'+css+'" aria-hidden="true"><use href="#i-'+name+'"/></svg>';
  const newNode = (tag, cls, value) => {
    const el=document.createElement(tag);
    if (cls) el.className=cls;
    if (value !== undefined) el.textContent=value;
    return el;
  };
  const romans=['I','II','III'];
  const tells={advance:'tellAdvance',retreat:'tellRetreat',thrust:'tellThrust',guard:'tellGuard'};
  const dialog=$('sheet');
  let style='pine', board, locked, queue, log, phase, outcome;
  let rehearsal=null, previewBeat=0, timer=null, dialogKind=null;

  function reset(chosen=style) {
    clearTimeout(timer);
    style=chosen;
    board=E.initial();
    $('world').innerHTML=A.landscape()+A.actor('hero-actor','hero',board.player,false)+
      A.actor('rival-actor',style,board.rival,true)+
      '<rect x="-700" y="-600" width="2500" height="1600" fill="url(#paper-grain)" opacity=".28" pointer-events="none"/>';
    beginRound([]);
    sizeScene();
  }
  function beginRound(previous) {
    locked=E.planRival(style,board,previous);
    queue=[]; log=[]; phase='plan'; outcome=null; rehearsal=null; previewBeat=0;
    render();
  }
  function add(move) {
    if (phase!=='plan' || queue.length>=3 || dialog.open) return;
    queue.push(move);
    render();
  }
  function undo() {
    if (phase!=='plan' || !queue.length || dialog.open) return;
    queue.pop();
    render();
  }
  function stopPreview() {
    clearTimeout(timer);
    phase='plan'; rehearsal=null; previewBeat=0;
    render();
  }
  function preview() {
    if (dialog.open) return;
    if (phase==='preview') return stopPreview();
    if (phase!=='plan' || !queue.length) return;
    phase='preview'; rehearsal={...board}; previewBeat=0;
    tick();
  }
  function primary() {
    if (dialog.open) return;
    if (phase==='end') return reset();
    if (phase==='review') {
      board={...board,round:board.round+1};
      beginRound(log.map(beat=>beat.playerMove));
    } else if (phase==='plan' && queue.length===3) {
      phase='play';
      tick();
    }
  }
  function schedule() {
    clearTimeout(timer);
    if (!document.hidden && !dialog.open && ['play','preview'].includes(phase)) {
      timer=setTimeout(tick, phase==='preview'?850:1100);
    }
  }
  function animate(id,move,struck=false) {
    const impact=$(id).querySelector('.impact');
    impact.classList.remove('lit');
    const pose=$(id).querySelector('.pose');
    pose.setAttribute('class','pose');
    // Restart the gesture even when two consecutive beats use the same move.
    pose.getBoundingClientRect();
    pose.classList.add('act-'+move);
    if (struck) impact.classList.add('lit');
  }
  function tick() {
    if (dialog.open || document.hidden) return;
    if (phase==='preview') {
      if (previewBeat===queue.length) return stopPreview();
      const move=queue[previewBeat++];
      const step=E.resolveBeat(rehearsal,move,'guard').board;
      rehearsal={...rehearsal,player:step.player};
      render(); animate('hero-actor',move);
    } else if (phase==='play') {
      if (outcome || log.length===3) {
        phase=outcome?'end':'review';
        render();
        return;
      }
      const result=E.resolveBeat(board,queue[log.length],locked[log.length]);
      const heroStruck=result.board.playerHP<board.playerHP;
      const rivalStruck=result.board.rivalHP<board.rivalHP;
      log.push(result); board=result.board;
      outcome=E.verdict(board,log.length);
      render();
      animate('hero-actor',result.playerMove,heroStruck);
      animate('rival-actor',result.rivalMove,rivalStruck);
    }
    schedule();
  }

  function sizeScene() {
    const {width,height}=$('picture').getBoundingClientRect();
    if (!height || !width) return;
    const ratio=width/height;
    // Always retain all five playable stones, even on a tall narrow display.
    const worldWidth=Math.max(650,Math.min(1130,ratio*385));
    const worldHeight=worldWidth/ratio;
    const top=254-worldHeight*(ratio<1.6?.69:.72);
    $('world').setAttribute('viewBox',[(1000-worldWidth)/2,top,worldWidth,worldHeight].join(' '));
    const rise=Math.min(1.75,Math.max(1,worldHeight/430));
    $('ridges').setAttribute('transform','translate(0 '+(209*(1-rise))+') scale(1 '+rise+')');
    $('sky-details').setAttribute('transform','translate(0 '+(-153*(rise-1))+')');
  }
  function drawHP(id,name,hp) {
    const bar=$(id);
    bar.setAttribute('aria-label',t('hp',{name,hp}));
    Array.from(bar.children).forEach((el,i)=>el.classList.toggle('empty',i>=hp));
  }
  function drawBoard() {
    const shown=rehearsal || board;
    for (const [id,cell,hp] of [['hero-actor',shown.player,board.playerHP],['rival-actor',shown.rival,board.rivalHP]]) {
      const actor=$(id);
      actor.style.transform='translate('+A.centers[cell]+'px,'+(A.deck[cell]-10)+'px)';
      actor.classList.toggle('is-down',hp===0);
    }
    $('world').querySelectorAll('.cell-mark').forEach((mark,i)=>{
      mark.classList.toggle('player',i===shown.player);
      mark.classList.toggle('rival',i===shown.rival);
    });
    $('world').setAttribute('aria-label',t('boardLabel',{name:t('hero'),p:shown.player+1,foe:t(style),e:shown.rival+1}));
    drawHP('player-hp',t('hero'),board.playerHP);
    drawHP('rival-hp',t(style),board.rivalHP);
    for (const side of ['player','rival']) {
      $(side+'-initiative').hidden=Boolean(outcome || rehearsal) || board.initiative!==side;
    }
    $('rival-name').textContent=t(style);
    $('round').textContent=t('round',{n:board.round,max:E.MAX_ROUNDS});
  }
  function drawSlots() {
    const nodes=romans.map((numeral,i)=>{
      const active=(phase==='preview' && i===previewBeat-1) || (phase==='play' && i===log.length-1);
      const move=queue[i];
      const el=newNode('div','slot'+(move?' filled':'')+(active?' active':''));
      const label=move?t('slotQueued',{n:i+1,move:t(move)}):t('slotEmpty',{n:i+1});
      el.setAttribute('role','img'); el.setAttribute('aria-label',label);
      el.append(newNode('small',null,numeral));
      if (move) {
        el.insertAdjacentHTML('beforeend',icon(move,'slot-icon'));
        el.append(newNode('span','slot-label',t(move)));
      } else el.append(newNode('span','empty-mark','·'));
      return el;
    });
    $('slots').replaceChildren(...nodes);
  }
  function drawRecord() {
    const rows=romans.map((numeral,i)=>{
      const beat=log[i];
      const row=newNode('div','record'+(i===log.length-1?' active':''));
      row.append(newNode('b',null,numeral));
      for (const side of ['player','rival']) {
        const cls=side==='player'?'own-result':'foe-result';
        const value=beat?t(beat[side+'Move'])+' · '+t(beat[side+'Result']):t(outcome?'skipped':'pending');
        row.append(newNode('span',cls,value));
      }
      return row;
    });
    $('records').replaceChildren(...rows);
  }
  function drawTell() {
    let title,copy,symbol;
    if (phase==='plan') {
      title=t('opening'); copy=t(tells[locked[0]]); symbol=locked[0];
    } else if (phase==='preview') {
      title=t('rehearsing'); copy=t('rehearsalHint',{n:previewBeat}); symbol='eye';
    } else if (phase==='play') {
      const beat=log.at(-1);
      title=t('beat',{n:log.length});
      copy=t('you')+' · '+t(beat.playerResult)+' / '+t('rival')+' · '+t(beat.rivalResult);
      symbol='swords';
    } else if (phase==='end') {
      title=t(outcome); copy=t(Math.min(board.playerHP,board.rivalHP)===0?'ko':'limit'); symbol='swords';
    } else {
      title=t('review'); copy=t('reviewHint'); symbol='book';
    }
    $('tell-icon').setAttribute('href','#i-'+symbol);
    $('tell-label').textContent=title;
    $('tell-text').textContent=copy;
  }
  function render() {
    const planning=phase==='plan', editing=planning||phase==='preview';
    drawBoard(); drawSlots(); drawTell();
    $('moves').hidden=!editing; $('records').hidden=editing;
    $('actions-title').textContent=t(editing?'techniques':'beatLog');
    $('action-hint').textContent=t(editing?'addHint':'outcomeColumns');
    $('moves').querySelectorAll('button').forEach(btn=>{
      btn.disabled=!planning || queue.length===3;
      btn.querySelector('.move-label').textContent=t(btn.dataset.move);
    });
    if (!editing) drawRecord();
    $('undo').disabled=!planning || !queue.length;
    $('preview').disabled=!editing || !queue.length;
    $('preview-label').textContent=t(phase==='preview'?'stopPreview':'preview');
    $('primary').disabled=!(planning && queue.length===3 || phase==='review' || phase==='end');
    $('primary-label').textContent=t(phase==='review'?'next':phase==='end'?'rematch':phase==='play'?'wait':'confirm')+
      (planning && queue.length<3?' · '+queue.length+'/3':'');
    $('rivals').disabled=phase==='play' || phase==='preview';
  }

  function fillDialog() {
    const container=$('sheet-body');
    container.replaceChildren();
    $('sheet-title').textContent=t(dialogKind==='rules'?'rules':'choose');
    if (dialogKind==='rules') {
      for (const key of ['how','combat','finish','ai','keys'])
        container.append(newNode('h3',null,t(key+'Title')),newNode('p',null,t(key+'Text')));
    } else {
      container.append(newNode('p',null,t('chooseHint')));
      E.RIVALS.forEach((name,i)=>{
        const btn=newNode('button','sheet-choice');
        btn.dataset.rival=name;
        btn.innerHTML=icon(['advance','guard','retreat'][i]);
        const body=newNode('span');
        body.append(newNode('strong',null,t(name)),newNode('span',null,t(name+'Bio')));
        btn.append(body);
        btn.onclick=()=>{ dialog.close(); reset(name); };
        container.append(btn);
      });
    }
  }
  function openSheet(kind) {
    clearTimeout(timer);
    dialogKind=kind; fillDialog(); dialog.showModal(); $('close').focus();
  }
  for (const id of ['player-hp','rival-hp']) for (let i=0;i<3;i++) $(id).append(newNode('i'));
  E.MOVES.forEach((move,i)=>{
    const btn=newNode('button','move-card');
    btn.dataset.move=move;
    btn.innerHTML='<kbd aria-hidden="true">'+(i+1)+'</kbd>'+icon(move,'move-icon');
    btn.append(newNode('span','move-label'));
    btn.onclick=()=>add(move);
    $('moves').append(btn);
  });
  $('primary').onclick=primary; $('preview').onclick=preview; $('undo').onclick=undo;
  $('help').onclick=()=>openSheet('rules'); $('rivals').onclick=()=>openSheet('rivals');
  $('close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{ dialogKind=null; schedule(); });
  dialog.addEventListener('click',event=>{
    if (event.target!==dialog) return;
    const b=dialog.getBoundingClientRect();
    if (event.clientX<b.left || event.clientX>b.right || event.clientY<b.top || event.clientY>b.bottom) dialog.close();
  });
  document.addEventListener('keydown',event=>{
    if (dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key>='1' && event.key<='4' && event.key.length===1) {
      event.preventDefault(); add(E.MOVES[Number(event.key)-1]);
      if (phase==='plan' && queue.length===3) $('primary').focus({preventScroll:true});
    } else if (event.key==='Backspace') {
      event.preventDefault(); undo();
    } else if (event.key.toLowerCase()==='p') {
      event.preventDefault(); preview();
    } else if (event.key==='Enter') {
      if (event.target.closest('a,button') && event.target!==$('primary')) return;
      event.preventDefault(); primary();
    }
  });
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  window.addEventListener('boopland:languagechange',()=>{render();if(dialog.open) fillDialog();});
  new ResizeObserver(sizeScene).observe($('picture'));
  reset();
})();

