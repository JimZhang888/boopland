(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const t = (key,values) => BooplandI18n.t('kiteWind.'+key,values);
  const route = [...$('route').children];
  const controls = [$('reel'),$('feed')];
  const heldKeys = new Set();
  const contacts = new Map();
  let state = KiteFlight.launch(), mode = 'ready', previous = 'ready', poster = true;
  let raf = 0, lastTime = 0, bucket = 0, nextPanel = 0;
  const visible = (el, on) => { el.hidden = !on; };
  function say(el, value) { if (el.textContent !== value) el.textContent=value; }
  function held(value){
    return heldKeys.has(value===1?'ArrowUp':'ArrowDown') || [...contacts.values()].includes(value);
  }
  function showPress() {
    controls.forEach((el,i)=>el.classList.toggle('active', held(i===0?1:-1)));
  }
  function release(){
    contacts.clear();heldKeys.clear();showPress();
  }
  function updatePanel(){
    const s=state;
    route.forEach((item,i)=>{
      const cleared=s.practice===null?i<s.passed:i===s.section&&s.passed===1;
      item.classList.toggle('current',i===s.section);
      item.classList.toggle('done',cleared);
      if(i===s.section)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
      say(item.querySelector('.token'),cleared?'✓':String(i+1));
    });
    say($('altitude'),String(Math.round(s.altitude)));
    const future=KiteFlight.wind(s.section,s.legTime+1.6);
    const direction=Math.abs(future)<.12?'·':(future>=0?'→':'←').repeat(Math.ceil(Math.abs(future)*3));
    say($('weather'),t('ahead',{arrows:direction}));
    const stall=s.tension<.24, strain=s.tension>.85;
    say($('condition'),t(stall?'loose':strain?'tight':'stable'));
    $('needle').style.left=(s.tension*100)+'%';
    let key='';
    if(stall)key='stall';else if(strain)key='strain';else if(s.noticeTime>0)key=s.notice;
    const el=$('status');visible(el,mode==='playing'&&!!key);
    if(key) {
      el.dataset.kind=key;
      say(el,t(key,{n:Math.max(1,Math.ceil(3-s.strain))}));
    }
  }
  function addButton(container, key, action, cls='secondary') {
    const b=document.createElement('button');b.type='button';b.className=cls;
    b.textContent=t(key);b.addEventListener('click',action);container.append(b);return b;
  }
  function paragraph(parent,key) {
    const p=document.createElement('p');p.textContent=t(key);parent.append(p);
  }
  function sheet(nowFocus=false) {
    const body=$('sheetBody'), actions=$('sheetActions');
    body.replaceChildren();actions.replaceChildren();
    const titleKey={guide:'guide',choose:'practice',paused:'pause',end:state.outcome}[mode];
    if(!titleKey)return;
    say($('sheetTitle'),t(titleKey));
    visible($('close'),mode!=='end');
    if(mode==='guide'){
      for(const key of ['help1','help2','help3'])paragraph(body,key);
      addButton(actions,previous==='playing'?'resume':'close',back,'primary');
    } else if(mode==='choose'){
      KiteFlight.courses.forEach((leg,i)=>{
        const b=addButton(body,leg.name,()=>start(i),'pick');
        const small=document.createElement('small');small.textContent=leg.height+' m';b.append(small);
      });
    } else if(mode==='paused'){
      addButton(actions,'resume',()=>change('playing'),'primary');
      addButton(actions,'restart',()=>start(state.practice));
      addButton(actions,'home',home);
    } else {
      const end=state.outcome;
      paragraph(body,end==='finish'?(state.practice===null?'complete':'practiced'):end+'Tip');
      const report=document.createElement('div');report.className='report';
      for(const [key,value] of [['gates',state.passed+' / '+(state.practice===null?3:1)],['peak',Math.round(state.peak)+' m']]){
        const column=document.createElement('div'),number=document.createElement('b');column.append(t(key));number.textContent=value;column.append(number);report.append(column);
      }
      body.append(report);
      addButton(actions,'restart',()=>start(state.practice),'primary');
      addButton(actions,'practice',()=>open('choose'));
      if(state.practice!==null)addButton(actions,'home',home);
    }
    if(nowFocus){
      $('dialog').scrollTop=0;
      (actions.querySelector('button')||body.querySelector('button')||$('close')).focus({preventScroll:true});
    }
  }
  function sync(focus){
    const playing=mode==='playing', ready=mode==='ready', overlay=!playing&&!ready;
    visible($('launch'),ready);visible($('veil'),overlay);visible($('instruments'),!poster);
    visible($('pause'),playing);controls.forEach(el=>el.disabled=!playing);
    $('guide').disabled=overlay;
    updatePanel();KiteSky.draw(state,poster);
    if(overlay)sheet(focus);
    else if(focus)(ready?$('start'):$('reel')).focus({preventScroll:true});
  }
  function change(next){
    if(raf)cancelAnimationFrame(raf);
    raf=0;lastTime=0;bucket=0;nextPanel=0;
    release();mode=next;sync(true);
    if(next==='playing')raf=requestAnimationFrame(frame);
  }
  function frame(time){
    if(mode!=='playing')return;
    if(lastTime)bucket+=Math.min((time-lastTime)/1000,.1);
    lastTime=time;
    const action=Number(held(1))-Number(held(-1));
    while(bucket>=KiteFlight.stepSize&&!state.outcome){
      KiteFlight.advance(state,action);bucket-=KiteFlight.stepSize;
    }
    if(state.outcome){change('end');return;}
    if(time>=nextPanel){updatePanel();nextPanel=time+80;}
    KiteSky.draw(state,false);
    raf=requestAnimationFrame(frame);
  }
  function start(practice){state=KiteFlight.launch(practice);poster=false;change('playing');}
  function home(){state=KiteFlight.launch();poster=true;change('ready');}
  function open(next){previous=mode;change(next);}
  function back(){
    if(mode==='paused')change('playing');
    else if(mode==='choose'||mode==='guide')change(previous);
  }
  $('start').onclick=()=>start(null);$('pause').onclick=()=>change('paused');
  $('guide').onclick=()=>open('guide');$('choose').onclick=()=>open('choose');$('close').onclick=back;
  controls.forEach((el,i)=>{
    el.addEventListener('pointerdown',e=>{
      if(mode!=='playing'||e.button!==0)return;
      e.preventDefault();el.setPointerCapture(e.pointerId);contacts.set(e.pointerId,i===0?1:-1);showPress();
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{
      contacts.delete(e.pointerId);showPress();
    });
    el.addEventListener('contextmenu',e=>e.preventDefault());
  });
  window.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='Escape'){
      if(e.repeat)return;
      if(mode==='playing')change('paused');else back();
    } else if(mode==='playing'&&['ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();heldKeys.add(e.key);showPress();
    }
  });
  window.addEventListener('keyup',e=>{heldKeys.delete(e.key);showPress();});
  function suspend(){
    if(mode==='playing')change('paused');
    if(mode==='guide'&&previous==='playing'){previous='paused';sheet();}
    release();
  }
  window.addEventListener('blur',suspend);
  window.addEventListener('pagehide',suspend);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
  window.addEventListener('boopland:languagechange',()=>sync(false));
  sync(false);
})();