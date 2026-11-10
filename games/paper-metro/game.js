(() => {
  'use strict';
  const $=id=>document.getElementById(id), I=window.BooplandI18n;
  const t=(key,values)=>I.t('metro.'+key,values);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const letters='ABCDE', svg=$('map'), stage=$('map-stage');
  let game=new PaperMetro(), selected=0, draft=null, started=false, paused=false, speed=1;
  let width=800,height=500,radius=14, mapVersion='', stationVersion='', dialogType='';
  let pointer=null, pointerAt=null, lastFrame=0, uiTime=0, message={key:'ready',until:Infinity};
  let positionKey='', positions=[], compactMap=false;
  let best=0, savedBest=0;
  const nodeMap=new Map();
  function bestKey(){return 'boopland-paper-metro-best-v1'+(game.calm?'-calm':'');}
  function readBest(){try{const n=Number(localStorage.getItem(bestKey()));best=Number.isFinite(n)&&n>0?Math.floor(n):0;}catch{best=0;}savedBest=best;}
  function saveBest(){if(game.score>best)best=game.score;if(best!==savedBest){try{localStorage.setItem(bestKey(),String(best));}catch{/* Scores still work for this session. */}savedBest=best;}}
  function say(key,values={},seconds=6){message={key,values,until:performance.now()+seconds*1000};refreshUI();}
  function setText(id,value){const el=$(id);if(el.textContent!==String(value))el.textContent=value;}
  function point(id){
    const key=width+':'+height+':'+game.stations.length;
    if(positionKey!==key){
      positionKey=key;compactMap=(width<520||height<270)&&game.stations.length>9;
      radius=compactMap?9:width>650?14:11;
      stage.classList.toggle('compact-map',compactMap);
      positions=game.stations.map(s=>({x:24+s.x*(width-48),y:16+s.y*(height-40)}));
      if(compactMap){
        // Keep late-game touch targets apart on short maps, anchored near their geography.
        positions=game.stations.map(s=>({x:24+(s.x-.08)/.82*(width-48),y:24+(s.y-.08)/.84*(height-52)}));
        const anchors=positions.map(p=>({...p})),gap=height<200?38:43;
        for(let pass=0;pass<90;pass++){
          for(let a=0;a<positions.length;a++)for(let b=a+1;b<positions.length;b++){
            const p=positions[a],q=positions[b],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||.01;
            if(d<gap){const push=(gap-d)*.52;p.x-=dx/d*push;p.y-=dy/d*push;q.x+=dx/d*push;q.y+=dy/d*push;}
          }
          positions.forEach((p,i)=>{p.x=Math.max(23,Math.min(width-23,p.x+(anchors[i].x-p.x)*.008));p.y=Math.max(23,Math.min(height-26,p.y+(anchors[i].y-p.y)*.008));});
        }
      }
    }
    return positions[id];
  }
  function shape(type,x,y,r,fill='#fffef7',stroke='#4e5849',sw=2){
    const attr=`fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
    if(type==='circle')return `<circle cx="${x}" cy="${y}" r="${r}" ${attr}/>`;
    if(type==='square')return `<rect x="${x-r*.86}" y="${y-r*.86}" width="${r*1.72}" height="${r*1.72}" rx="1" ${attr}/>`;
    if(type==='triangle')return `<path d="M${x},${y-r*1.12}L${x+r},${y+r*.78}L${x-r},${y+r*.78}Z" ${attr}/>`;
    if(type==='diamond')return `<path d="M${x},${y-r*1.18}L${x+r},${y}L${x},${y+r*1.18}L${x-r},${y}Z" ${attr}/>`;
    const pts=Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.48:r*1.12;return `${x+Math.cos(a)*rr},${y+Math.sin(a)*rr}`;});
    return `<polygon points="${pts.join(' ')}" ${attr}/>`;
  }
  function segment(a,b){const p=point(a),q=point(b),dx=q.x-p.x,dy=q.y-p.y,d=Math.min(Math.abs(dx),Math.abs(dy));return[p,{x:p.x+Math.sign(dx)*d,y:p.y+Math.sign(dy)*d},q];}
  function routePath(route){return route.slice(1).map((id,i)=>segment(route[i],id).map((p,j)=>(j===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')).join(' ');}
  function atSegment(a,b,progress){const pts=segment(a,b),first=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y),second=Math.hypot(pts[2].x-pts[1].x,pts[2].y-pts[1].y),distance=(first+second)*progress;
    const [p,q,f]=distance<=first&&first>.01?[pts[0],pts[1],distance/first]:[pts[1],pts[2],second>.01?(distance-first)/second:0];
    return{x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f,angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI};}
  function resize(){const rect=stage.getBoundingClientRect();width=Math.max(80,rect.width);height=Math.max(80,rect.height);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);mapVersion='';stationVersion='';
    const river=`M${width*.53},-20 C${width*.61},${height*.2} ${width*.39},${height*.32} ${width*.51},${height*.51} S${width*.69},${height*.77} ${width*.61},${height+20}`;
    $('terrain').innerHTML=`<path d="M${width*.02},${height*.33}Q${width*.04},${height*.18} ${width*.2},${height*.14}T${width*.31},${height*.32}Q${width*.25},${height*.45} ${width*.12},${height*.43}Z" fill="#dce5d8" opacity=".38"/><path d="M${width*.67},${height*.74}q${width*.1},${-height*.16} ${width*.26},${-height*.04}l${-width*.02},${height*.23}q${-width*.18},${height*.04} ${-width*.24},${-height*.1}" fill="#e6e8d5" opacity=".55"/><path d="${river}" fill="none" stroke="#dae5e1" stroke-width="${Math.max(18,width*.035)}"/><path d="${river}" fill="none" stroke="#bdcfc7" stroke-width=".8" stroke-dasharray="8 10" opacity=".8"/><path d="M${width*.08},${height*.4}l7 -13 8 13m-7 -4v13M${width*.87},${height*.78}l7 -13 8 13m-7 -4v13" fill="none" stroke="#acb99c" stroke-width="1.1"/>`;
    renderMap();}
  function renderMap(){
    const version=game.revision+':'+selected+':'+JSON.stringify(draft)+':'+width+':'+height;
    if(mapVersion!==version){
      mapVersion=version;
      $('tracks').innerHTML=game.lines.filter(l=>l.route.length>1).map(l=>{const d=routePath(l.route);return `<g opacity="${draft && l.id===selected ? .25 : 1}"><path d="${d}" fill="none" stroke="#fffef7" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${l.color}" stroke-width="${l.id===selected?5.5:4.5}" stroke-linecap="round" stroke-linejoin="round" ${l.trains.length?'':'stroke-dasharray="7 6"'}/><path d="${d}" transform="translate(.8 1.2)" fill="none" stroke="${l.color}" opacity=".2" stroke-width="1"/></g>`;}).join('');
      $('draft-track').innerHTML=draft?.length>1?`<path d="${routePath(draft)}" fill="none" stroke="${game.lines[selected].color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 5"/>`:'';
    }
    if(pointerAt&&draft?.length){const last=point(draft[draft.length-1]);$('draft-track').innerHTML=(draft.length>1?`<path d="${routePath(draft)}" fill="none" stroke="${game.lines[selected].color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 5"/>`:'')+`<path d="M${last.x},${last.y}L${pointerAt.x},${pointerAt.y}" fill="none" stroke="${game.lines[selected].color}" stroke-width="2" stroke-dasharray="4 6" opacity=".6"/>`;}
    renderStations();
    $('trains').innerHTML=game.lines.map(l=>l.trains.map(train=>{
      const from=l.route[train.index];const nextIndex=train.index===l.route.length-1?train.index-1:train.index===0?1:train.index+train.dir;
      const p=atSegment(from,l.route[nextIndex],train.dwell>0?0:train.progress);
      const length=width>650?25:21;
      return `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})"><rect x="${-length/2}" y="-6.5" width="${length}" height="13" rx="3.5" fill="${l.color}" stroke="#fffef7" stroke-width="1.8"/><path d="M${length/2-5},-3v6" stroke="#fffef7" stroke-width="1.5"/>${Array.from({length:Math.min(train.load.length,6)},(_,i)=>`<circle cx="${-length/2+4+(i%3)*4}" cy="${i<3?-2.2:2.2}" r="1.15" fill="#fffef7"/>`).join('')}</g>`;
    }).join('')).join('');
  }
  function renderStations(force=false){
    const ver=game.stations.map(s=>s.queue.map(p=>p.type[0]).join('')+':'+Math.floor(s.pressure*5)).join('|')+':'+selected+':'+JSON.stringify(draft)+':'+width+':'+height+':'+I.language;
    if(ver===stationVersion&&!force)return;stationVersion=ver;
    for(const station of game.stations){
      let node=nodeMap.get(station.id);
      if(!node){node=document.createElementNS('http://www.w3.org/2000/svg','g');node.dataset.station=station.id;node.setAttribute('role','button');node.setAttribute('tabindex','0');$('stations').append(node);nodeMap.set(station.id,node);}
      const p=point(station.id), inDraft=draft?.includes(station.id), count=station.queue.length;
      node.setAttribute('transform',`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      node.setAttribute('aria-label',t('stationLabel',{n:station.id+1,shape:t('shape'+station.type[0].toUpperCase()+station.type.slice(1)),count}));
      const ring=radius+(compactMap?5:7), circumference=2*Math.PI*ring;
      const visibleQueue=compactMap?[...new Set(station.queue.map(p=>p.type))].map(type=>({type})):station.queue.slice(0,10);
      const queue=visibleQueue.map((pass,i)=>shape(pass.type,compactMap?(i-(visibleQueue.length-1)/2)*6:(i%5-2)*7.5,compactMap?radius+9:radius+11+Math.floor(i/5)*8,compactMap?2.3:2.6,'#697362','none',0)).join('');
      const total=compactMap&&count?`<text x="${radius+7}" y="3" fill="${count>=9?'#a05445':'#697362'}" font-size="9">${count}</text>`:count>10?`<text x="0" y="${radius+38}" text-anchor="middle" fill="#a05445" font-size="9">+${count-10}</text>`:'';
      node.innerHTML=`<circle r="24" fill="transparent"/>${station.pressure>0?`<circle r="${ring}" fill="none" stroke="#dec9b7" stroke-width="${compactMap?2:3}"/><circle r="${ring}" fill="none" stroke="#b76b59" stroke-width="${compactMap?2.5:3.5}" stroke-dasharray="${circumference*station.pressure/18} ${circumference}" transform="rotate(-90)"/>${compactMap?'':`<text x="${ring+4}" y="-9" font-size="10" fill="#a05445">!</text>`}`:''}${inDraft?`<circle r="${radius+5}" fill="${game.lines[selected].color}" opacity=".15"/>`:''}<g class="station-shape">${shape(station.type,0,0,radius,'#fffef7',inDraft?game.lines[selected].color:'#515b4e',2)}</g><text x="${-radius-9}" y="${-radius-4}" fill="#919984" font-size="8" font-family="sans-serif">${station.id+1}</text>${queue}${total}`;
    }
  }
  function refreshUI(){
    saveBest(); const line=game.lines[selected];
    setText('score',game.score);setText('waiting',game.stations.reduce((n,s)=>n+s.queue.length,0));setText('best',best);
    setText('week',t('week',{n:game.week}));$('week-progress').style.width=((game.time%60)/60*100)+'%';
    setText('line-count',game.unlocked+' / 5');setText('selected-line',t('line',{name:letters[selected]}));
    setText('route-count',t('stops',{n:draft?draft.length:line.route.length}));setText('train-count',line.trains.length);
    setText('fleet-note',t('fleet',{n:game.freeTrains}));setText('capacity',t('capacity',{n:game.capacity}));setText('mode-label',game.calm?t('calm'):'');
    $('remove-train').disabled=!started||!!draft||!line.trains.length||game.gameOver;
    $('add-train').disabled=!started||!!draft||line.route.length<2||game.freeTrains<=0||line.trains.length>=5||game.gameOver;
    $('redraw').disabled=!started||!!draft||game.gameOver;$('clear').disabled=!started||!!draft||!line.route.length||game.gameOver;
    $('draft-controls').hidden=!draft;$('apply').disabled=!draft||draft.length<2;$('undo').disabled=!draft?.length;
    $('pause').textContent=paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',t(paused?'resume':'pause'));$('pause').setAttribute('aria-pressed',String(paused));$('pause').disabled=!started||game.gameOver;
    $('speed').textContent=speed+'×';$('speed').disabled=!started||game.gameOver;
    $('pause-badge').hidden=!started||(!draft&&!paused)||game.gameOver;setText('pause-badge',t(draft?'editing':'paused'));
    document.querySelector('.dispatch').style.setProperty('--route',line.color);
    for(const l of game.lines){const b=$('line-'+l.id);b.classList.toggle('selected',l.id===selected);b.classList.toggle('locked',l.id>=game.unlocked);b.disabled=l.id>=game.unlocked||!started||game.gameOver;b.setAttribute('aria-pressed',String(l.id===selected));b.setAttribute('aria-label',l.id>=game.unlocked?t('locked'):t('lineLabel',{name:letters[l.id],stops:l.route.length,trains:l.trains.length}));b.querySelector('.line-info').textContent=l.id>=game.unlocked?'⌁':l.trains.length+' ▰';}
    if(draft)setText('status',t(draft.length?'draft':'planHelp',{n:draft.length}));
    else{const danger=game.stations.filter(s=>s.pressure>3).sort((a,b)=>b.pressure-a.pressure)[0];
      if(paused&&compactMap)setText('status',t('paused'));
      else if(danger&&!game.calm)setText('status',t('danger',{n:danger.id+1,seconds:Math.ceil(18-danger.pressure)}));
      else if(message.until>performance.now())setText('status',t(message.key,message.values));
      else setText('status',t(line.route.length?'extend':'ready'));
    }
  }
  function buildLines(){
    $('line-list').innerHTML=game.lines.map(l=>`<button id="line-${l.id}" class="line-button" style="--route:${l.color}" data-line="${l.id}"><span class="line-badge">${letters[l.id]}</span><span class="line-mini"></span><span class="line-info"></span></button>`).join('');
    $('line-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectLine(Number(b.dataset.line))));
  }
  function selectLine(id){if(!started||id>=game.unlocked||game.gameOver)return;if(draft){say('editFirst');return;}selected=id;mapVersion='';refreshUI();renderMap();}
  function visitStation(id){
    if(!started||dialogType||game.gameOver)return false;
    const route=game.lines[selected].route;
    if(!draft){
      if(!route.length)draft=[id];
      else if(id===route[route.length-1])draft=[...route];
      else if(id===route[0])draft=[...route].reverse();
      else{say('extend');return false;}
    }else if(!draft.length)draft=[id];
    else if(id===draft[draft.length-1])return false;
    else if(id===draft[draft.length-2])draft.pop();
    else if(!draft.includes(id))draft.push(id);
    else return false;
    mapVersion='';refreshUI();renderMap();return true;
  }
  function applyDraft(){if(!draft||draft.length<2)return;if(game.setRoute(selected,draft)){draft=null;pointerAt=null;mapVersion='';say(game.lines[selected].trains.length?'extend':'noTrain');renderMap();}}
  function cancelDraft(){draft=null;pointer=null;pointerAt=null;mapVersion='';refreshUI();renderMap();}
  function coordinates(e){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};}
  function hit(p){let nearest=null,dist=26;for(const s of game.stations){const q=point(s.id),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<dist){nearest=s.id;dist=d;}}return nearest;}
  function segmentHit(a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;return game.stations.map(s=>{const p=point(s.id),u=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;return{id:s.id,u,d:Math.hypot(p.x-a.x-u*dx,p.y-a.y-u*dy)};}).filter(s=>s.d<radius+6).sort((a,b)=>a.u-b.u);}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0||pointer||dialogType||!started||game.gameOver)return;const p=coordinates(e),id=hit(p);if(id===null)return;
    e.preventDefault();const before=draft?[...draft]:null;
    if(!visitStation(id))return;
    pointer={id:e.pointerId,start:p,last:p,dragged:false,before};svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=coordinates(e);
    if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>8)pointer.dragged=true;
    if(pointer.dragged){for(const s of segmentHit(pointer.last,p))if(s.id!==draft?.[draft.length-1]&&Math.hypot(point(s.id).x-pointer.last.x,point(s.id).y-pointer.last.y)>radius+3)visitStation(s.id);const id=hit(p);if(id!==null&&id!==draft?.[draft.length-1])visitStation(id);pointerAt=p;renderMap();}
    pointer.last=p;
  });
  svg.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const didDrag=pointer.dragged;pointer=null;pointerAt=null;mapVersion='';if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(didDrag&&draft?.length>=2)applyDraft();else renderMap();});
  function abortPointer(){if(!pointer)return;draft=pointer.before;pointer=null;pointerAt=null;mapVersion='';refreshUI();renderMap();}
  svg.addEventListener('pointercancel',abortPointer);svg.addEventListener('lostpointercapture',abortPointer);
  $('stations').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.station!==undefined){e.preventDefault();e.stopPropagation();visitStation(Number(e.target.dataset.station));}});
  $('redraw').onclick=()=>{draft=[];refreshUI();renderMap();};$('apply').onclick=applyDraft;$('cancel-draw').onclick=cancelDraft;
  $('undo').onclick=()=>{if(draft){draft.pop();refreshUI();renderMap();}};
  $('clear').onclick=()=>{game.clearRoute(selected);say('cleared');renderMap();};
  $('add-train').onclick=()=>{game.assignTrain(selected,1);refreshUI();renderMap();};$('remove-train').onclick=()=>{game.assignTrain(selected,-1);refreshUI();renderMap();};
  function togglePause(){if(!started||game.gameOver)return;paused=!paused;refreshUI();}
  $('pause').onclick=togglePause;$('speed').onclick=()=>{speed=speed===1?2:1;refreshUI();};
  $('help').onclick=()=>openDialog('help');$('restart').onclick=()=>openDialog(started?'restart':'intro');
  document.addEventListener('keydown',e=>{
    if(dialogType)return;
    if(e.key==='Escape'&&draft){e.preventDefault();cancelDraft();return;}
    if(e.key==='Backspace'&&draft){e.preventDefault();$('undo').click();return;}
    if(e.target.closest('button,a,[role="button"]'))return;
    if(e.key===' '){e.preventDefault();togglePause();}
    else if(/^[1-5]$/.test(e.key))selectLine(Number(e.key)-1);
    else if(e.key==='Enter'&&draft)applyDraft();
  });
  const introArt=`<svg class="intro-art" viewBox="0 0 330 100" aria-hidden="true"><path d="M20 68H103L159 22H302" fill="none" stroke="#b76b59" stroke-width="5"/><path d="M81 13V45L134 83H280" fill="none" stroke="#5d8a7d" stroke-width="5"/><path d="M21 71H104L160 25H303M84 13V45L137 86H280" fill="none" stroke="#73856b" stroke-width=".6" opacity=".5"/><circle cx="30" cy="68" r="10" fill="#fffef7" stroke="#515b4e" stroke-width="2"/><path d="m104 48 11 19H93Z" fill="#fffef7" stroke="#515b4e" stroke-width="2"/><circle cx="81" cy="16" r="9" fill="#fffef7" stroke="#515b4e" stroke-width="2"/><rect x="227" y="13" width="18" height="18" fill="#fffef7" stroke="#515b4e" stroke-width="2"/><circle cx="275" cy="83" r="10" fill="#fffef7" stroke="#515b4e" stroke-width="2"/><rect x="178" y="16" width="26" height="12" rx="3" fill="#b76b59" stroke="#fffef7" stroke-width="2"/><path d="M184 19v6m5-6v6" stroke="#fffef7" stroke-width="1.5"/></svg>`;
  function action(text,fn,primary=false,detail=''){const b=document.createElement('button');b.className=detail?'supply-choice':primary?'primary':'';if(detail)b.innerHTML=`<strong>${esc(text)}</strong><small>${esc(detail)}</small>`;else b.textContent=text;b.onclick=fn;$('dialog-actions').append(b);}
  function closeDialog(){dialogType='';$('dialog').close();lastFrame=performance.now();refreshUI();}
  function openDialog(type){
    dialogType=type;$('dialog').dataset.kind=type;$('dialog-actions').replaceChildren();setText('dialog-kicker',t('introKicker'));
    const paragraph=key=>`<p>${esc(t(key))}</p>`;
    if(type==='intro'){
      setText('dialog-title',t('introTitle'));$('dialog-body').innerHTML=introArt+paragraph('introText')+`<div class="instructions">${[1,2,3].map(n=>`<p><b>0${n}</b>${esc(t('step'+n))}</p>`).join('')}</div>`;
      action(t('start'),()=>start(false),true);action(t('calmStart'),()=>start(true));
    }else if(type==='help'){
      setText('dialog-title',t('helpTitle'));$('dialog-body').innerHTML=`<div class="instructions">${[1,2,3,4,5].map(n=>`<p><b>${n}.</b>${esc(t('help'+n))}</p>`).join('')}</div>`;
      action(t('close'),()=>{if(started)closeDialog();else openDialog('intro');},true);
    }else if(type==='restart'){
      setText('dialog-title',t('restartTitle'));$('dialog-body').innerHTML=paragraph('restartText');action(t('cancel'),closeDialog);action(t('confirmRestart'),()=>start(game.calm),true);
    }else if(type==='supply'){
      setText('dialog-title',t('supplyTitle'));$('dialog-body').innerHTML=paragraph('supplyText');
      for(const choice of ['train','line','carriage'])if(choice!=='line'||game.unlocked<5)action(t(choice+'Gift'),()=>{game.chooseSupply(choice);closeDialog();say('ready');},false,t(choice+'GiftText'));
    }else if(type==='over'){
      saveBest();setText('dialog-title',t('overTitle'));$('dialog-body').innerHTML=`<div class="result-score">${game.score}</div><p>${esc(t('overText',{n:game.failedStation+1}))}</p><p>${esc(t('result',{week:game.week,best}))}</p>`;action(t('again'),()=>start(game.calm),true);action(t('calmStart'),()=>start(true));
    }
    if(!$('dialog').open)$('dialog').showModal();
  }
  $('dialog').addEventListener('cancel',e=>{e.preventDefault();if(dialogType==='help'&&started||dialogType==='restart')closeDialog();});
  function start(calm){saveBest();game=new PaperMetro({calm});readBest();started=true;paused=false;speed=1;selected=0;draft=null;pointer=null;pointerAt=null;positionKey='';mapVersion='';stationVersion='';nodeMap.clear();$('stations').replaceChildren();closeDialog();say('ready',{},12);renderMap();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!game.gameOver){abortPointer();paused=true;refreshUI();}lastFrame=performance.now();});
  window.addEventListener('pagehide',saveBest);
  window.addEventListener('boopland:languagechange',()=>{I.apply();refreshUI();stationVersion='';renderMap();if(dialogType)openDialog(dialogType);});
  function frame(now){
    const dt=Math.min(.1,(now-(lastFrame||now))/1000);lastFrame=now;
    if(!document.hidden){
      const running=started&&!paused&&!draft&&!dialogType;
      if(running){game.tick(dt*speed);for(const event of game.events.splice(0)){if(event.type==='station')say('newStation',{n:event.id+1},10);}if(game.gameOver)openDialog('over');else if(game.supply)openDialog('supply');}
      if(now-uiTime>150){refreshUI();uiTime=now;}
      // Redraw motion only while running; edit actions render their own changes.
      if(running||mapVersion===''||stationVersion==='')renderMap();
    }
    requestAnimationFrame(frame);
  }
  readBest();buildLines();new ResizeObserver(resize).observe(stage);resize();refreshUI();openDialog('intro');requestAnimationFrame(frame);
})();
