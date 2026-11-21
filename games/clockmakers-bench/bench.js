(() => {
  'use strict';
  const {orders, initial, inspect} = window.ClockBench;
  const art = window.ClockArt;
  const t = (key, values) => BooplandI18n.t('clockmakers-bench.' + key, values);
  const $ = id => document.getElementById(id);
  const two = n => String(n).padStart(2,'0');
  const same = (a,b) => a.length === b.length && a.every((n,p)=>n === b[p]);
  const storageKey = 'boopland-clockmakers-repairs-v1';
  const jobs = orders.map(order => ({parts:initial(order), done:false}));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    orders.forEach((order,i)=>{
      const fit = saved?.[i];
      if (!Array.isArray(fit) || fit.length !== order.nodes.length) return;
      const valid = order.nodes.every((n,j)=> Array.isArray(fit[j]) && (n.fixed
        ? same(n.initial,fit[j]) : !fit[j].length || n.choices.some(p=>same(p,fit[j]))));
      if (valid && inspect(order,fit).result === 'ok') jobs[i] = {parts:fit,done:true,solution:fit};
    });
  } catch { /* Storage is optional for local files. */ }

  let index=0, selected=1, turns=0, mode='ready', frame=0, previous=null, dialogMode='';
  let analysis, moving=[], handElement=null, layout;
  const job = () => jobs[index], order = () => orders[index];
  const activeNode = () => order().nodes[selected];
  const meshes = () => inspect(order(), job().parts);
  const partName = p => !p.length ? t('empty') : p.length === 1 ? t('teeth',{n:p[0]}) :
    p[0] ? t('pair',{a:p[0],b:p[1]}) : t('upperTeeth',{n:p[1]});
  const partLabel = p => p.length === 1 ? String(p[0]) : p[0] ? p.join(' / ') : '↑ '+p[1];
  function displayTurns(n) {
    return n === 1 ? t('oneTurn') : t('turns',{n});
  }
  const direction = n => t(n > 0 ? 'cw' : 'ccw');
  const arrow = n => n > 0 ? '↻' : '↺';
  const currentRatio = f => f.d === 1 ? Math.abs(f.n) : Math.abs(f.n)+'/'+f.d;
  function setGoal(element, n) {
    element.replaceChildren();
    const sign = document.createElement('span');
    sign.className = 'turn-icon'; sign.textContent=arrow(n); sign.setAttribute('aria-hidden','true');
    element.append(sign,displayTurns(Math.abs(n)));
    element.title = direction(n);
    element.setAttribute('aria-label', direction(n)+' · '+displayTurns(Math.abs(n)));
  }
  function fitLayout() {
    const nodes=order().nodes;
    const dimensions=nodes.map((n,i)=>{
      const radii=n.fixed ? n.initial : n.choices.flat();
      return Math.max(...radii)/2 + 1;
    });
    const minX=Math.min(...nodes.map((n,i)=>n.x-dimensions[i])), maxX=Math.max(...nodes.map((n,i)=>n.x+dimensions[i]));
    const minY=Math.min(...nodes.map((n,i)=>n.y-dimensions[i])), maxY=Math.max(...nodes.map((n,i)=>n.y+dimensions[i]));
    const unit=Math.min(219/(maxX-minX),145/(maxY-minY),5);
    return {unit, points:nodes.map(n=>({x:255+(n.x-(minX+maxX)/2)*unit, y:210+(n.y-(minY+maxY)/2)*unit}))};
  }

  function drawBench() {
    const nodes=order().nodes, fitted=job().parts;
    const {points,unit}=layout;
    let drawing=art.defs + art.toolsDrawing() + art.caseDrawing();
    for (let i=0;i<nodes.length;i++) {
      const {x,y}=points[i];
      drawing+=`<g transform="translate(${x} ${y})">`+
        art.circle(10,'#b8ad8f','#817b67',1)+art.circle(7,'#dbd0b3','#79755e',1)+
        art.path('M-16 0h6m20 0h6M0-16v6m0 20v6','none','#8e896e',.85)+'</g>';
    }
    for (let p=0;p<2;p++) {
      for (let i=0;i<nodes.length;i++) {
        const z=fitted[i][p]; if (!z) continue;
        const {x,y}=points[i];
        const kind=p?'high':i===0?'drive':'low';
        drawing+=`<g transform="translate(${x} ${y})"><g data-wheel="${i}">`
          + art.wheel(z,unit,kind) + '</g></g>';
      }
    }
    // The pointer and its gear share angular displacement but have independent zero marks.
    const handIndex=nodes.length-1, end=points[handIndex];
    const pointerSize=Math.min(1.05,Math.max(.65,unit/4));
    drawing+=`<g transform="translate(${end.x} ${end.y}) scale(${pointerSize})">`
      +art.path('M-5-45h10M0-48v5','none','#8a6750',1.2)
      +'<g id="needle">'+art.path('M0-43L3.4-10Q6-5 3 1L2 9Q3 14 0 16Q-3 14-2 9L-3 1Q-6-5-3.4-10Z','#a26450','#684b3b',1.3)
      +art.path('M0-36v23','none','#e7c7a6',.9)+'</g></g>';
    for (let i=0;i<nodes.length;i++) {
      const n=nodes[i], {x,y}=points[i], isSelected=i===selected;
      const radius=Math.max(12, Math.max(0,...fitted[i])*unit/2+unit+3.5);
      const label=n.id+' · '+partName(fitted[i]);
      let arcs='';
      if (isSelected) {
        for(let q=0;q<4;q++) {
          const a=q*Math.PI/2+.15,b=a+.44;
          arcs+='M'+(Math.cos(a)*radius)+' '+(Math.sin(a)*radius)+'A'+radius+' '+radius+' 0 0 1 '+(Math.cos(b)*radius)+' '+(Math.sin(b)*radius);
        }
      }
      const attrs=n.fixed?'':` class="axis" role="button" data-axis="${i}" tabindex="0" aria-pressed="${isSelected}"`;
      drawing+=`<g transform="translate(${x} ${y})"${attrs} aria-label="${label}"><title>${label}</title>`;
      if(arcs) drawing+=art.path(arcs,'none','#865b3e',1.95);
      if(!n.fixed) drawing+=`<circle class="target" r="${Math.max(16,radius-2)}" fill="transparent" stroke="none"/>`;
      drawing+=art.circle(n.fixed?6:9,isSelected?'#52624a':n.fixed?'#daccab':'#ede6cf','#5f604e',1.1);
      drawing+=n.fixed?art.screw(0,0,3.7):`<text text-anchor="middle" y="3.9" fill="${isSelected?'#fff9e5':'#545548'}" font-family="Georgia,serif" font-size="11.8" font-weight="bold" pointer-events="none">${n.id}</text>`;
      drawing+='</g>';
    }
    // External witness labels identify both fixed wheels without covering the train.
    for (const i of [0,handIndex]) {
      const {x,y}=points[i], isDrive=i===0, sign=isDrive?-1:1;
      const r=Math.max(8,Math.max(0,...fitted[i])*unit/2);
      const endX=isDrive?96:414, startX=x+sign*(r*.62), startY=y-r*.77;
      const elbowX=endX-sign*19, endY=startY-18;
      drawing+=art.path(`M${startX} ${startY}L${elbowX} ${endY}H${endX}`,'none','#797d67',.9)+art.circle(1.7,'#6b745b','none',0,startX,startY);
      const number=fitted[i].filter(Boolean).join('/')||'–';
      drawing+=`<g transform="translate(${endX} ${endY})" pointer-events="none"><rect x="-20" y="-9" width="40" height="16" rx="2" fill="#f3efdc" stroke="#9a9d82" stroke-width=".75"/><text y="3" text-anchor="middle" fill="#475141" font-family="Georgia,serif" font-size="11.5">${nodes[i].id} · ${number}</text></g>`;
    }
    $('drawing').innerHTML=drawing;
    moving=[...$('drawing').querySelectorAll('[data-wheel]')];
    handElement=$('needle');
    renderMotion();
  }

  function renderMotion() {
    const degrees=turns*360;
    for (const gear of moving) {
      const i=Number(gear.dataset.wheel), rate=analysis.rates[i];
      const angle=analysis.phase[i]*180/Math.PI + (rate ? degrees*rate.n/rate.d : 0);
      gear.setAttribute('transform','rotate('+angle+')');
    }
    const hand=analysis.rates.at(-1);
    if (handElement) handElement.setAttribute('transform','rotate('+(hand ? degrees*hand.n/hand.d : 0)+')');
    $('meter').firstElementChild.style.width=(100*turns/order().inputTurns)+'%';
  }
  function renderParts() {
    const focused=document.activeElement;
    const nodes=order().nodes;
    $('figure').textContent=t('shaft',{id:activeNode().id})+' · '+partName(job().parts[selected]);
    $('shafts').innerHTML='';
    nodes.forEach((n,i)=>{
      if(n.fixed)return;
      const b=document.createElement('button');
      b.textContent=n.id; b.dataset.shaft=i;
      b.title=t('select',{id:n.id})+' · '+partName(job().parts[i]);
      b.setAttribute('aria-label',b.title);
      b.setAttribute('aria-pressed',String(i===selected));
      $('shafts').append(b);
    });
    $('parts').innerHTML='';
    for (const [i,part] of activeNode().choices.entries()) {
      const b=document.createElement('button');
      b.innerHTML=art.mini(part,Math.max(...activeNode().choices.flat()));
      const label=document.createElement('span');
      label.textContent=part.length===1?t('teeth',{n:part[0]}):partLabel(part);
      b.append(label); b.title=t('fit',{part:partName(part)});
      b.setAttribute('aria-label',b.title);
      b.setAttribute('aria-pressed',String(same(job().parts[selected],part)));
      b.dataset.part=i; $('parts').append(b);
    }
    $('remove').disabled=!job().parts[selected].length;
    if(focused?.dataset.part!==undefined) $('parts').children[Number(focused.dataset.part)]?.focus({preventScroll:true});
    if(focused?.dataset.shaft!==undefined) $('shafts').querySelector('[data-shaft="'+focused.dataset.shaft+'"]')?.focus({preventScroll:true});
  }
  function renderStatus() {
    const tested=mode==='finished', verdict=analysis.result;
    const success=tested && verdict==='ok', warn=tested && !success;
    $('readout').className=success?'good':warn?'warn':'';
    let caption=t(mode==='running'?'testing':mode==='paused'?'paused':'ready'), detail='';
    if(tested) {
      caption=t(success?'fixed':verdict,analysis.clash?{
        a:order().nodes[analysis.clash[0]].id, b:order().nodes[analysis.clash[1]].id
      }:undefined);
      const f=analysis.measured;
      if(f && verdict!=='jam') detail=t('reading',{dir:arrow(f.n),n:displayTurns(currentRatio(f))});
    }
    $('status').textContent=caption; $('detail').textContent=detail;
    $('run').querySelector('span').textContent=t(mode==='running'?'pause':mode==='paused'?'resume':tested?'again':'test');
    $('run').querySelector('use').setAttribute('href',mode==='running'?'#i-pause':'#i-play');
    $('next').hidden=!success; $('run').classList.toggle('secondary',success);
    $('next').querySelector('span').textContent=t(index===5?'view':'next');
    const count=jobs.filter(j=>j.done).length;
    $('completed').textContent=t('count',{n:count});
    $('completed').dataset.short=count+'/6';
    $('orders').title=t('choose')+' · '+t('count',{n:count});
    $('orders').setAttribute('aria-label',$('orders').title);
  }
  function render() {
    $('serial').textContent='№ '+two(index+1)+' / 06';
    $('orderName').textContent=t('name'+(index+1)); $('brief').textContent=t('note'+(index+1));
    setGoal($('driveGoal'),order().inputTurns); setGoal($('handGoal'),order().handTurns);
    $('driveDir').textContent=direction(order().inputTurns); $('handDir').textContent=direction(order().handTurns);
    renderParts(); drawBench(); renderStatus();
    if ($('sheet').open) fillDialog();
  }
  function stopFrame() {
    cancelAnimationFrame(frame); frame=0; previous=null;
  }
  function loadOrder(i) {
    stopFrame(); index=i; selected=order().nodes.findIndex(n=>!n.fixed);
    analysis=meshes(); layout=fitLayout();
    mode=job().done && analysis.result==='ok'?'finished':'ready';
    turns=mode==='finished'?order().inputTurns:0;
    render();
  }
  function selectShaft(i,returnFocus=false) {
    if(!order().nodes[i] || order().nodes[i].fixed)return;
    selected=i; renderParts(); drawBench();
    if(returnFocus) $('drawing').querySelector('[data-axis="'+i+'"]')?.focus({preventScroll:true});
  }
  function install(part) {
    stopFrame(); mode='ready'; turns=0;
    job().parts[selected]=part.slice(); analysis=meshes();
    renderParts(); drawBench(); renderStatus();
  }
  function finish() {
    stopFrame(); mode='finished';
    if(analysis.result==='ok') {
      job().done=true; job().solution=job().parts.map(p=>p.slice());
      try { localStorage.setItem(storageKey,JSON.stringify(jobs.map(j=>j.solution||null))); } catch {}
    }
    renderStatus();
  }
  function tick(time) {
    if(mode!=='running')return;
    if(previous!==null) turns=Math.min(order().inputTurns,turns+Math.min(120,time-previous)/1350);
    previous=time; renderMotion();
    if(turns>=order().inputTurns)finish();
    else frame=requestAnimationFrame(tick);
  }
  function pause() {
    if(mode!=='running')return;
    stopFrame(); mode='paused'; renderStatus();
  }
  function toggleRun() {
    if(mode==='running')return pause();
    if(mode!=='paused')turns=0;
    if(analysis.result==='jam'){renderMotion();finish();return;}
    mode='running'; previous=null; renderMotion(); renderStatus(); frame=requestAnimationFrame(tick);
  }

  function fillDialog() {
    const help=dialogMode==='help';
    $('dialogTitle').textContent=t(help?'help':'choose');
    const body=$('dialogBody'); body.replaceChildren();
    if(help) {
      for(const key of ['note'+(index+1),'guide','meshRule','rateRule','testRule']){
        const p=document.createElement('p');p.textContent=t(key);body.append(p);
      }
    } else {
      orders.forEach((unused,i)=>{
        const b=document.createElement('button');b.className='order-link';b.dataset.order=i;
        b.setAttribute('aria-current',String(i===index));
        const num=document.createElement('small'); num.textContent=two(i+1);
        const mark=document.createElement('i'); mark.textContent=jobs[i].done?'✓':i===index?'◌':'';
        b.append(num, t('name'+(i+1)), mark);
        b.setAttribute('aria-label',t('order',{n:i+1})+' · '+t('name'+(i+1))+(jobs[i].done?' · '+t('done'):''));
        body.append(b);
      });
    }
  }
  function openDialog(which) {
    pause(); dialogMode=which;fillDialog();$('sheet').showModal();
  }
  $('drawing').addEventListener('click',e=>{const g=e.target.closest('[data-axis]');if(g)selectShaft(+g.dataset.axis);});
  $('drawing').addEventListener('keydown',e=>{
    const g=e.target.closest('[data-axis]');
    if(g && (e.key==='Enter'||e.key===' ')){e.preventDefault();selectShaft(+g.dataset.axis,true);}
  });
  $('parts').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)install(activeNode().choices[+b.dataset.part]);});
  $('shafts').addEventListener('click',e=>{const b=e.target.closest('[data-shaft]');if(b)selectShaft(+b.dataset.shaft);});
  $('remove').addEventListener('click',()=>install([])); $('run').addEventListener('click',toggleRun);
  $('next').addEventListener('click',()=>{if(index===5)openDialog('orders');else loadOrder(index+1);});
  $('orders').addEventListener('click',()=>openDialog('orders')); $('help').addEventListener('click',()=>openDialog('help'));
  $('close').addEventListener('click',()=>$('sheet').close());
  $('dialogBody').addEventListener('click',e=>{const b=e.target.closest('[data-order]');if(b){$('sheet').close();loadOrder(+b.dataset.order);}});
  $('sheet').addEventListener('click',e=>{
    if(e.target!==$('sheet'))return;
    const r=$('sheet').getBoundingClientRect();
    if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) $('sheet').close();
  });
  window.addEventListener('boopland:languagechange',render);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',pause);
  function resizeDrawing() {
    const {width,height}=$('drawing').getBoundingClientRect();
    $('drawing').setAttribute('viewBox',width/height<.99?'61 -18 388 422':'0 -18 510 422');
  }
  new ResizeObserver(resizeDrawing).observe($('drawing'));
  resizeDrawing();
  loadOrder(0);
})();
