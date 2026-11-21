(() => {
  'use strict';
  const {courses,createRun,step,STEP}=window.Slalom;
  const $=id=>document.getElementById(id);
  const t=(key,params)=>BooplandI18n.t('slalom.'+key,params);
  const canvas=$('scene'), scene=createSlalomScene(canvas);
  const mobile=$('mobile-route'), routes=$('routes');
  const keys=new Set(), fingers=new Map(), edgeButtons=[...document.querySelectorAll('.edge')];
  let run=createRun(courses[0]), mode='ready', frame=0, last=null, carry=0, newBest=false;
  const memory=new Map();
  const storageKey=c=>'boopland-slalom-sketch-v1-'+c.id;
  function getBest(c) {
    let saved;
    try {saved=Number(localStorage.getItem(storageKey(c)));}catch{}
    const best=Math.min(memory.get(c.id)??Infinity,saved>0&&Number.isFinite(saved)?saved:Infinity);
    if(Number.isFinite(best)){memory.set(c.id,best);return best;}
    return null;
  }
  function record() {
    const result=Math.round((run.elapsed+run.penalty)*100), previous=getBest(run.course);
    newBest=previous===null||result<previous;
    if(!newBest)return;
    memory.set(run.course.id,result);
    try{localStorage.setItem(storageKey(run.course),String(result));}catch{}
  }
  function format(cs) {
    const two=n=>String(n).padStart(2,'0');
    return two(Math.floor(cs/6000))+':'+two(Math.floor(cs/100)%60)+'.'+two(cs%100);
  }
  function label(el,value){if(el.textContent!==value)el.textContent=value;}
  const icons=['one','two','three'];
  const routeButtons=courses.map((c,i)=>{
    const btn=document.createElement('button');
    btn.className='route';btn.innerHTML='<svg aria-hidden="true" viewBox="0 0 51 46"><use href="#route-'+icons[i]+'"/></svg><span><strong></strong><small></small></span><i aria-hidden="true" class="indicator"></i>';
    routes.append(btn);btn.addEventListener('click',()=>select(c));
    const opt=new Option('',c.id);mobile.add(opt);return btn;
  });
  function syncLanguage(){
    courses.forEach((c,i)=>{
      label(routeButtons[i].querySelector('strong'),t(c.id));
      label(routeButtons[i].querySelector('small'),t(c.id+'Note'));
      mobile.options[i].text=t(c.id);
    });
    label($('lesson'),t('lesson'));
    sync();
  }
  function hud(){
    label($('time'),format(Math.round(run.elapsed*100)));
    label($('gates'),run.passed+' / '+run.course.gates.length);
    label($('penalty'),t('seconds',{n:run.penalty}));
    const msg=mode==='running'&&run.feedback&&run.feedback.until>run.elapsed?run.feedback.kind:'';
    label($('feedback'),msg?t(msg):'');$('feedback').dataset.kind=msg;
  }
  function sync(){
    hud();const locked=mode==='running'||mode==='paused';
    routeButtons.forEach((btn,i)=>{btn.disabled=locked;btn.setAttribute('aria-pressed',String(courses[i]===run.course));});
    mobile.value=run.course.id;mobile.disabled=locked;
    const best=getBest(run.course);label($('best'),best===null?'—':format(best));
    $('pause').disabled=mode!=='running';
    edgeButtons.forEach(btn=>{btn.disabled=mode!=='running';});
    label($('go').querySelector('span'),t(mode==='ready'?'start':'retry'));
    const overlay=mode==='paused'||mode==='finish';
    $('overlay').hidden=!overlay;
    if(overlay) {
      const done=mode==='finish';
      label($('state-title'),t(done?(newBest?'record':'finish'):'paused'));
      label($('course-state'),t(run.course.id));
      $('total').hidden=$('breakdown').hidden=!done;
      if(done){
        label($('total'),format(Math.round((run.elapsed+run.penalty)*100)));
        label($('breakdown'),t('sum',{time:format(Math.round(run.elapsed*100)),penalty:format(run.penalty*100)}));
      }
      label($('resume'),t(done?'retry':'resume'));label($('secondary'),t('choose'));
    }
    scene.draw(run,mode);
  }
  function select(c) {
    if(mode==='paused'||mode==='running'||!c)return;
    reset(c);sync();
  }
  function dirs(){
    const values=[...fingers.values()];
    return [keys.has('ArrowLeft')||keys.has('KeyA')||values.includes(-1),
      keys.has('ArrowRight')||keys.has('KeyD')||values.includes(1)];
  }
  function inputStyle(){const active=dirs();edgeButtons.forEach((b,i)=>b.classList.toggle('held',active[i]));}
  function clearInputs(){keys.clear();fingers.clear();inputStyle();}
  function stopClock(){
    cancelAnimationFrame(frame);frame=0;last=null;clearInputs();
  }
  function reset(c){stopClock();carry=0;mode='ready';newBest=false;run=createRun(c);}
  function start(){reset(run.course);play();}
  function play(){
    mode='running';last=null;clearInputs();sync();
    canvas.focus({preventScroll:true});frame=requestAnimationFrame(tick);
  }
  function pause(){
    if(mode!=='running')return;
    stopClock();mode='paused';sync();$('resume').focus({preventScroll:true});
  }
  function tick(now) {
    if(mode!=='running')return;
    if(last!==null){
      const delta=(now-last)/1000;
      // If the browser suspended frames without reporting visibility, wait for a fresh start.
      if(delta>.40){pause();return;}
      carry+=Math.max(0,delta);
      const [left,right]=dirs(),steer=Number(right)-Number(left);
      while(carry>=STEP&&!run.finished){step(run,steer);carry-=STEP;}
    }
    last=now;
    if(run.finished){
      stopClock();record();mode='finish';sync();$('resume').focus({preventScroll:true});return;
    }
    hud();scene.draw(run,mode);frame=requestAnimationFrame(tick);
  }
  mobile.addEventListener('change',()=>select(courses.find(c=>c.id===mobile.value)));
  $('go').addEventListener('click',start);$('pause').addEventListener('click',pause);
  $('resume').addEventListener('click',()=>mode==='paused'?play():start());
  $('secondary').addEventListener('click',()=>{reset(run.course);sync();(mobile.offsetWidth?mobile:routeButtons[courses.indexOf(run.course)]).focus();});
  canvas.tabIndex=-1;
  function bindSteering(el,direction) {
    el.addEventListener('pointerdown',e=>{
      if(mode!=='running'||e.button!==0)return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);fingers.set(e.pointerId,direction(e));inputStyle();
    });
    if(el===canvas)el.addEventListener('pointermove',e=>{
      if(fingers.has(e.pointerId)){fingers.set(e.pointerId,direction(e));inputStyle();}
    });
    const release=e=>{fingers.delete(e.pointerId);inputStyle();};
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,release);
    el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  bindSteering(canvas,e=>e.clientX<canvas.getBoundingClientRect().left+canvas.clientWidth/2?-1:1);
  edgeButtons.forEach(b=>bindSteering(b,()=>Number(b.dataset.dir)));
  // Keyboard activation also works when an edge button has focus.
  const steerKeys=['ArrowLeft','ArrowRight','KeyA','KeyD'];
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if((e.code==='Escape'||e.code==='KeyP')&&(mode==='running'||mode==='paused')){
      e.preventDefault();if(!e.repeat){if(mode==='running')pause();else play();}return;
    }
    if(mode!=='running')return;
    if(steerKeys.includes(e.code)){e.preventDefault();keys.add(e.code);inputStyle();}
    else if((e.code==='Space'||e.code==='Enter')&&edgeButtons.includes(e.target)){
      e.preventDefault();fingers.set('keyboard',Number(e.target.dataset.dir));inputStyle();
    }
  });
  window.addEventListener('keyup',e=>{
    keys.delete(e.code);if(e.code==='Space'||e.code==='Enter')fingers.delete('keyboard');inputStyle();
  });
  window.addEventListener('blur',pause);window.addEventListener('pagehide',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('orientationchange',pause);
  screen.orientation?.addEventListener?.('change',pause);
  const orientation=matchMedia('(orientation: portrait)');
  if(orientation.addEventListener)orientation.addEventListener('change',pause);
  else orientation.addListener(pause);
  function resize(){scene.resize();scene.draw(run,mode);}
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize',resize);
  window.addEventListener('storage',e=>{if(e.key===storageKey(run.course))sync();});
  window.addEventListener('boopland:languagechange',syncLanguage);
  resize();syncLanguage();
})();
