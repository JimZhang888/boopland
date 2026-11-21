'use strict';

(() => {
  const table=new PaperPinball(), f=PinballField;
  const $=id=>document.getElementById(id);
  const tr=(key,values)=>BooplandI18n.t('paper-pinball.'+key,values);
  const svg=$('mechanics'), hw=$('hardware');
  const svgNS='http://www.w3.org/2000/svg';
  const coords=p=>p.map(pair=>pair.join(',')).join(' ');
  const lamps=f.lamps.map(({x,y,letter},i)=>`
    <g transform="translate(${x} ${y})" class="lamp" id="lamp-${i}">
      <path d="M-15 4q0-19 15-20 15 0 15 18v9q-15 7-30 0Z" fill="#899986" stroke="#50685b" stroke-width="1.4"/>
      <path class="lens" d="M-12 4q0-17 12-17T12 3v6q-12 4-24 0Z" fill="#e0e5ce" stroke="#747f6e" stroke-width=".9"/>
      <path d="m-8-5 2-3m11 16 3-.8" stroke="#faf7df" stroke-width="1.4"/>
      <text x="0" y="5.5" text-anchor="middle" fill="#46584d" font-family="Georgia,serif" font-size="17.5" font-weight="bold" font-style="italic">${letter}</text>
      <path class="lamp-rays" d="m-9-18-1-3m10 3v-5m9 5 1-3" fill="none" stroke="#a47b3e" stroke-width="1.7" opacity="0"/>
    </g>`).join('');
  const bells=f.bells.map(({x,y,r,color},i)=>`
    <g transform="translate(${x} ${y})" id="bell-${i}">
      <g class="ring"><path d="m-31 -7-4-2m6-3-3-3m61 1 4-3m-3 9 4-1" fill="none" stroke="#9b895f" stroke-width="1.3"/></g>
      <circle cy="2" r="${r+2}" fill="#b1b099" stroke="#53615b" stroke-width="1.6"/>
      <circle r="${r}" fill="${color}" stroke="#475751" stroke-width="1.8"/>
      <path d="M${-r+.8} 3Q-20 29 6 ${r-2}Q21 17 ${r-.8} 3Q17 13 0 14T${-r+.8} 3Z" fill="url(#bell-shade)" stroke="#758071" stroke-width=".8"/>
      <path d="M-17-7q3-9 15-11m8 1 4 2M-16 6q2 3 5 4" fill="none" stroke="#fff5d8" stroke-width="1.65"/>
      <path d="M-7-5Q0-11 7-5q1 4-7 6-8-2-7-6Z" fill="#f4e2b4" stroke="#566258" stroke-width="1.15"/>
      <path d="m-2-6 3-.6" stroke="#a49068" stroke-width="1"/>
      <text x="0" y="9.5" text-anchor="middle" fill="#49594f" font-size="7.5" font-family="Georgia,serif" font-weight="bold">100</text>
    </g>`).join('');
  const rails=f.tracks.slice(0,2).map(p=>`
    <polyline points="${coords(p)}" stroke="#485858" stroke-width="6"/>
    <polyline points="${coords(p)}" stroke="#b7c2ab" stroke-width="3.15"/>
    <polyline points="${coords(p)}" stroke="#f5eed7" stroke-width=".75" transform="translate(-.5 -.65)"/>`).join('');
  const sling=f.tracks.slice(2).map((p,i)=>`
    <polygon points="${coords(p)}" stroke="#4b5956" stroke-width="5" fill="#82968b"/>
    <polygon points="${coords(p)}" stroke="#d0d9bb" stroke-width="2.2" fill="url(#bell-shade)"/>
    <g transform="${i?'translate(401 0) scale(-1 1)':''}"><path d="M71 347l47 54-34-18Z" fill="#c9d2b7" stroke="#687a6b" stroke-width="1"/>
      <path d="m78 359 26 31m-18-13 8 6" stroke="#f4ebcc" stroke-width="1.35"/>
      <circle cx="66" cy="336" r="2.2" fill="#e5d3a6" stroke="#526557"/>
    </g>`).join('');
  const bats=[0,1].map(i=>`
    <g transform="translate(${f.pivots[i]} ${f.pivotY})"><g id="bat-${i}">
      <path d="M0-7.4 60-6.7q8 .1 8.1 6.7 0 6.2-7.6 6.8L0 7.4q-8 0-8-7.4T0-7.4Z" fill="${i?'#c29c85':'#8ca398'}" stroke="#414f4e" stroke-width="2.2"/>
      <path d="M11-3.4 58-3q4 0 5 2.3M13 3.2l38-.2" fill="none" stroke="#f5e9c9" stroke-width="1.3"/>
      <circle r="4.7" fill="#ead8ae" stroke="#4e5b54" stroke-width="1"/><path d="m-1.6 1.1 3-2.2" stroke="#656954" stroke-width="1"/>
    </g></g>`).join('');
  hw.innerHTML=`<defs>
    <pattern id="bell-shade" width="4.5" height="5" patternUnits="userSpaceOnUse"><path d="m-1 4 5-5m-1 7 4-4" stroke="#485950" opacity=".44" stroke-width=".95"/></pattern>
  </defs>${rails}${sling}
    <path id="gate" d="m377 141 39-11" stroke="#7f8b79" stroke-width="2.2" stroke-dasharray="4 3"/>
    ${f.rails.slice(-5).map(([x,y,,end])=>`<path d="M${x} ${y}V${end}" stroke="#526352" stroke-width="5"/><path d="M${x-.5} ${y}v7" stroke="#e5dab7" stroke-width="1.5"/>`).join('')}
    ${lamps}${bells}${bats}
    <g stroke="#59665d"><rect x="383" y="495" width="28" height="12" rx="3" fill="#83978c" stroke-width="1.7"/><path d="m386 503 21-.5" stroke="#dce2c4"/>
      <path id="coil" stroke-width="2" fill="none"/><g id="spring-top"><rect x="384" y="453" width="26" height="7" rx="2.5" fill="#d6b383" stroke-width="1.7"/><path d="M387 455h19" stroke="#f5e7c4"/></g></g>
    <g id="marble"><ellipse cx="1.2" cy="2.1" rx="6.6" ry="6.3" fill="#4e574d" opacity=".25"/>
      <circle r="6.6" fill="#647e82" stroke="#35474a" stroke-width="1.55"/>
      <path d="M-4.4-.2q.4-3.7 4.3-4.1" fill="none" stroke="#fffae3" stroke-width="1.6"/><path d="M.8 4.4q2.5-.6 3.1-2.8" fill="none" stroke="#bccdbe" stroke-width="1.1"/></g>`;
  const batEls=[$('bat-0'),$('bat-1')], bellsEls=f.bells.map((_,i)=>$('bell-'+i));
  const lampEls=f.lamps.map((_,i)=>$('lamp-'+i)), letters=[...$('letters').children];
  $('balls').innerHTML=Array.from({length:3},()=>'<svg aria-hidden="true"><use href="#sball"/></svg>').join('');
  const ballIcons=[...$('balls').children], controls=[$('left'),$('right'),$('spring')];
  const held=controls.map(()=>new Set());
  let dialog='',last=0,bank=0,animation=0,visibleLights=-1,seenScore=-1,seenStatus='',shownPhase='';
  let audioContext=null,muted=false,lastTone=-1;
  const mute=$('sound');

  function wakeSound() {
    if (muted) return;
    try {
      const Context=window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext ||= new Context();
      if (audioContext.state==='suspended') audioContext.resume().catch(()=>{});
    } catch { /* Sound is optional on devices without Web Audio. */ }
  }

  function chime(index) {
    if (muted || audioContext?.state!=='running') return;
    const tone=audioContext.createOscillator(), gain=audioContext.createGain(), t=audioContext.currentTime;
    tone.type='sine';
    tone.frequency.value=[587.33,739.99,880][index];
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.exponentialRampToValueAtTime(.105,t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.31);
    tone.connect(gain); gain.connect(audioContext.destination);
    tone.start(t); tone.stop(t+.32);
    tone.onended=()=>{tone.disconnect();gain.disconnect()};
  }

  function setText(el,value) { if (el.textContent!==value) el.textContent=value; }
  function attr(el,key,value) { if (el.getAttribute(key)!==String(value)) el.setAttribute(key,value); }

  function release(action,token,cancel=false) {
    const group=held[action];
    if (!group.delete(token) || group.size) return;
    controls[action].classList.remove('active');
    if (action<2) {
      table.held[action]=false;
      attr(controls[action],'aria-pressed',false);
    } else table.releaseSpring(cancel);
  }

  function press(action,token) {
    if (dialog || table.phase==='over' || (action===2 && table.phase!=='ready')) return;
    const group=held[action];
    if (group.has(token)) return;
    group.add(token);
    if (group.size>1) return;
    wakeSound();
    controls[action].classList.add('active');
    if (action<2) {
      table.held[action]=true;
      attr(controls[action],'aria-pressed',true);
    } else table.pressSpring();
  }

  function releaseAll() {
    held.forEach((group,i)=>{for(const token of [...group]) release(i,token,true)});
  }

  function pointerControls(el,actionAt) {
    const owners=new Map();
    el.addEventListener('pointerdown',e=>{
      if (e.button!==0 || dialog || table.phase==='over') return;
      const i=actionAt(e);
      if (i<0 || (i===2 && table.phase!=='ready')) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      owners.set(e.pointerId,i);
      press(i,'p'+e.pointerId);
    });
    function end(e,cancel) {
      const i=owners.get(e.pointerId);
      if (i===undefined) return;
      owners.delete(e.pointerId);
      release(i,'p'+e.pointerId,cancel);
    }
    el.addEventListener('pointerup',e=>end(e,false));
    el.addEventListener('pointercancel',e=>end(e,true));
    el.addEventListener('lostpointercapture',e=>end(e,true));
    el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  controls.forEach((el,i)=>pointerControls(el,()=>i));
  pointerControls(svg,e=>{
    const rect=svg.getBoundingClientRect(), x=(e.clientX-rect.left)*440/rect.width, y=(e.clientY-rect.top)*540/rect.height;
    if (x>372 && y>344) return 2;
    return y>405 ? (x<200 ? 0 : 1) : -1;
  });

  const keys={ArrowLeft:0,ArrowRight:1,Space:2};
  function keyAction(e) {
    if (e.code==='Space' || e.code==='Enter') {
      const focused=controls.indexOf(e.target);
      if (e.code==='Enter') return focused;
      if (e.target.closest?.('a,button') && focused<0) return -1;
    }
    return keys[e.code] ?? -1;
  }
  document.addEventListener('keydown',e=>{
    if (e.key==='Escape' && dialog==='help') {e.preventDefault();showDialog(table.phase==='over'?'over':'');return}
    if (dialog || e.ctrlKey || e.altKey || e.metaKey) return;
    const i=keyAction(e);
    if (i<0) return;
    e.preventDefault();
    if (!e.repeat) press(i,'k'+e.code);
  });
  document.addEventListener('keyup',e=>{
    const token='k'+e.code;
    for(let i=0;i<held.length;i++) if (held[i].has(token)) {e.preventDefault();release(i,token)}
  });

  function refreshDialog() {
    if (!dialog) return;
    const help=dialog==='help';
    $('overlay').classList.toggle('over-note',!help);
    setText($('note-title'),tr(help?'help':'over'));
    setText($('note-text'),tr(help?'rules':'final'));
    $('final-score').hidden=help;
    setText($('final-score'),String(table.score));
    setText($('note-action'),tr(help?'resume':'again'));
  }

  function showDialog(name) {
    releaseAll();
    dialog=name;
    bank=0;last=0;
    $('overlay').hidden=!dialog;
    attr($('help'),'aria-expanded',name==='help');
    refreshDialog();
    if (dialog) (name==='over'?$('note-action'):$('overlay').querySelector('.note')).focus({preventScroll:true});
    else $('help').blur();
    render();
  }

  $('help').addEventListener('click',()=>showDialog(dialog==='help'?(table.phase==='over'?'over':''):'help'));
  $('note-action').addEventListener('click',()=>{
    if (dialog==='over') {
      table.reset();
      lastTone=-1;
      showDialog('');
    } else showDialog(table.phase==='over'?'over':'');
  });

  function updateSoundButton() {
    attr(mute,'aria-label',tr(muted?'soundOn':'soundOff'));
    attr(mute,'title',tr(muted?'soundOn':'soundOff'));
    attr(mute,'aria-pressed',!muted);
    mute.classList.toggle('muted',muted);
  }
  mute.addEventListener('click',()=>{
    muted=!muted;
    if (muted) audioContext?.suspend().catch(()=>{});
    else wakeSound();
    updateSoundButton();
  });

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const effects=new Map();
  function renderEffects() {
    for (const [event,el] of effects) if (!table.effects.includes(event)) {el.remove();effects.delete(event)}
    for (const event of table.effects) {
      if (event.kind==='bell' && event.time>lastTone) {chime(event.index);lastTone=event.time}
      if (reduced.matches) continue;
      let label=effects.get(event);
      if (!label) {
        label=document.createElementNS(svgNS,'text');
        label.setAttribute('x',event.x);label.setAttribute('text-anchor','middle');
        label.setAttribute('class','gain');label.textContent='+'+event.gain;
        $('effects').appendChild(label);effects.set(event,label);
      }
      const age=(table.time-event.time)/.64;
      attr(label,'y',(event.y-17-age*18).toFixed(1));
      attr(label,'opacity',Math.min(1,(1-age)*3).toFixed(2));
    }
  }
  function render(force=false) {
    const b=table.ball, ready=table.phase==='ready', over=table.phase==='over';
    attr($('marble'),'transform',`translate(${b.x.toFixed(2)} ${b.y.toFixed(2)})`);
    attr($('marble'),'visibility',over?'hidden':'visible');
    for(let i=0;i<2;i++) attr(batEls[i],'transform','rotate('+(table.angles[i]*180/Math.PI).toFixed(2)+')');
    const compression=ready ? 22*table.charge : 0;
    attr($('spring-top'),'transform','translate(0 '+compression.toFixed(1)+')');
    const top=459+compression, turns=11, spacing=(495-top)/turns;
    let coil='M397 '+top.toFixed(1);
    for(let j=0;j<turns;j++) coil+=' L'+(j%2?389:405)+' '+(top+(j+.5)*spacing).toFixed(1);
    attr($('coil'),'d',coil+' L397 495');
    attr($('gate'),'opacity',table.inChute?'.38':'1');
    if (visibleLights!==table.lights || force) {
      lampEls.forEach((el,i)=>{
        const on=!!(table.lights&(1<<i));
        attr(el.querySelector('.lens'),'fill',on?'#eac174':'#e0e5ce');
        attr(el.querySelector('.lamp-rays'),'opacity',on?'1':'0');
        letters[i].classList.toggle('on',on);
      });
      visibleLights=table.lights;
    }
    bellsEls.forEach((el,i)=>{
      const age=table.time-table.lastBell[i],pulse=age<.18 && !reduced.matches?Math.sin(Math.PI*age/.18):0,bell=f.bells[i];
      attr(el,'transform',`translate(${bell.x} ${bell.y}) scale(${(1+.09*pulse).toFixed(3)})`);
      attr(el.querySelector('.ring'),'opacity',age<.25?1:.32);
    });
    renderEffects();
    if (seenScore!==table.score || force) {setText($('score'),String(table.score).padStart(6,'0'));seenScore=table.score}
    setText($('ball-count'),table.number+' / 3');
    ballIcons.forEach((el,i)=>el.classList.toggle('spent',over || i<table.number-1));
    const double=table.doubleTime>0;
    document.querySelector('.ticket').classList.toggle('double',double);
    const state=over?'over':double?'double':!ready?'playing':table.charging?'charging':table.number>1?'next':'ready';
    const values={n:table.number,power:Math.round(table.charge*100),s:Math.ceil(table.doubleTime),lit:letters.filter(e=>e.classList.contains('on')).length};
    const status=tr(state,values);
    if (status!==seenStatus || force) {setText($('status'),status);seenStatus=status}
    controls.forEach((el,i)=>{const disabled=!!dialog || over || (i===2&&!ready);if(el.disabled!==disabled)el.disabled=disabled});
    document.querySelector('.fill').style.transform='scaleX('+table.charge.toFixed(3)+')';
    if (over && shownPhase!=='over' && !dialog) {shownPhase='over';showDialog('over')}
    shownPhase=table.phase;
  }

  function frame(now) {
    if (!dialog && !document.hidden) {
      if (last) bank+=Math.min((now-last)/1000,.08);
      while (bank>=f.fixedStep) {table.step();bank-=f.fixedStep}
      render();
    }
    last=now;
    animation=requestAnimationFrame(frame);
  }
  window.addEventListener('blur',releaseAll);
  document.addEventListener('visibilitychange',()=>{
    releaseAll();last=0;bank=0;
    cancelAnimationFrame(animation);
    if (document.hidden) audioContext?.suspend().catch(()=>{});
    else animation=requestAnimationFrame(frame);
  });
  window.addEventListener('boopland:languagechange',()=>{refreshDialog();updateSoundButton();render(true)});
  updateSoundButton();
  render(true);
  animation=requestAnimationFrame(frame);
})();

