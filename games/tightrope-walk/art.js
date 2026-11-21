/* Original pen-and-wash scenery. Coordinates are in a 410-unit-high picture plane. */
const RopeArt = (() => {
  'use strict';
  const ink = '#424c49';
  const num = n => +n.toFixed(2);
  const path = (d, fill = 'none', stroke = ink, width = 1.2, more = '') =>
    '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '" ' + more + '/>';
  const line = (d, color, width, more) => path(d, 'none', color, width, more);
  const group = (transform, body, id='') => '<g'+(id?' id="'+id+'"':'')+' transform="' + transform + '">' + body + '</g>';
  const move = (x, y, body, scale = 1) => group('translate(' + num(x) + ' ' + num(y) + ') scale(' + scale + ')', body);
  const use = (id, x, y, s) => '<use href="#' + id + '" xlink:href="#' + id + '" transform="translate(' + num(x) + ' ' + num(y) + ') scale(' + s + ')"/>';
  const round = (x,y,r,fill,stroke='none') => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '"/>';
  function windows(x,y,n,rows,dx,dy,light=false) {
    let out='';
    for(let j=0;j<rows;j++) for(let i=0;i<n;i++) {
      const a=x+i*dx, b=y+j*dy;
      out+=move(a,b,path('M0 8 .4 1Q3 -2 5 1L5 8Z',light?'#b6bcb1':'#748480','none')+
        line('M2.5 1v7M0 4.3h5',light?'#e8e7d5':'#e7d9ba',.82));
    }
    return out;
  }
  function townHouse(i) {
    const colors=['#b7c2b5','#cbbea8','#dfd3b8','#b2c1bb'];
    const roofs=['#829793','#a8907a','#899a95','#b09a84'];
    const roof=['M-4 2 17 -22 24 -20 53 2Z','M-4 3 7 -14 39 -15 52 2Z',
      'M-3 2 3 -14 11 -20 39 -21 48 -12 52 1Z','M-3 2 9 -8 22 -27 47 -6 52 1Z'][i];
    const details=[
      line('M5 21h21m-20 -3 20 -.7m-19 -3v6m5 -6v6m5 -6v6m6 -6v6','#758982',.85),
      line('M4 7v10m8 -10v10m4 -10v10m7 -10v10','#7c8d81',1.4),
      path('M10 -5v-8l5 -4 5 4v8Z','#c9c9b6','#82877a',.8)+windows(13,-13,1,1,0,0,true),
      round(21,-10,2.7,'#a7b5a7','#7e8d83')+line('M-2 5h37m-34 29h35','#919a89',1.3)
    ];
    return path('M0 0 47 -2 48 81 -1 83Z',colors[i], '#7b8680',.95)+
      path('M36 0 47 -2 48 81 36 82Z','#9fa99e','none')+
      path('M30 -13v-9l5 -.7v13',colors[i],'#74827d',.9)+
      path(roof,roofs[i],'#6e7d77',1.1)+path(roof,'url(#hatch)','none')+
      line('M-2 4 46 2m-45 27 34 -.6m-33 26 32 -1','#8e9686',.8)+
      windows(5,9,i===0?2:3,4,i===0?17:11,14)+details[i];
  }
  function clockTower() {
    const side='#859c97', paper='#d1cbb4', dark='#556f70';
    return path('M-12 5 -12 -54 9 -55 15 -51 16 5Z',paper,'#748780')+
      path('M9 -55 15 -51 16 5 9 5Z',side,'#738681',.8)+
      path('M-15 -54 -15 -60 12 -61 15 -57 15 -53Z','#aabbb1','#758782')+
      path('M-11 -61v-18l9 -7 11 7v18Z',paper,'#738681')+
      line('M-7 -63v-12q2 -7 4 -1v13m6 -1v-11q2 -6 4 0v12',dark,2)+
      path('M-14 -78Q-6 -87 -2 -101Q1 -89 13 -78Z',dark,'#607675')+
      line('M-2 -100v-9m-3 4h6','#607675',1.2)+
      round(-1,-43,6.2,'#eee7ce','#748881')+line('M-1 -48v5l4 2','#6a7d78',1.2)+
      windows(-6,-25,2,2,8,15);
  }
  function dome() {
    return path('M-28 9v-30h51V9Z','#d4cbb3','#85958a')+
      path('M-30 -23q1 -23 25 -34l2 -8 3 8q20 10 24 34Z','#8fa59e','#748b84')+
      line('M-5 -54q-13 17 -13 31m16 -33q11 17 12 31m-13 -43v-9','#718780',1.1)+
      path('M-30 -24h55v4h-55Z','#b7b8a6','#7f9087')+windows(-22,-14,5,2,9,13);
  }
  const bird = path('M-19 -4q12 -1 18 5 6 -7 18 -9Q6 -2 1 5L-3 4Q-9 -2 -19 -4Z','#647875','none');
  const cloud = line('M-48 4q13 -4 23 -2 3 -11 14 -10 7 -10 15 -5 9 -1 14 10 13 -3 20 5l21 1M-39 7l31 .5m27 0 29 -1','#98aba2',1.05);
  function definitions() {
    return '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="m-1 7 8 -8m-2 8 2 -2" stroke="#425958" stroke-width=".75" opacity=".27"/></pattern>'+
      '<pattern id="brick" width="32" height="16" patternUnits="userSpaceOnUse"><path d="M2 1h15m8 8h7m-32 0h9m7 -8v4m-8 4v4" fill="none" stroke="#6f7970" stroke-width=".8" opacity=".43"/></pattern>'+
      '<pattern id="grain" width="153" height="137" patternUnits="userSpaceOnUse"><filter id="fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".76" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="153" height="137" filter="url(#fiber)" opacity=".42"/></pattern>'+
      [0,1,2,3].map(i=>'<g id="house'+i+'">'+townHouse(i)+'</g>').join('')+
      '<g id="clock">'+clockTower()+'</g><g id="dome">'+dome()+'</g><g id="bird">'+bird+'</g><g id="cloud">'+cloud+'</g></defs>';
  }
  function ridge(w,y,seed,fill,amplitude) {
    let d='M-90 430V'+y;
    for(let x=-90;x<=w+100;x+=12) {
      const h=Math.sin(x*.012+seed)*.48+Math.sin(x*.024+seed*3)*.24+Math.cos(x*.078+seed)*.16;
      d+='L'+x+' '+num(y+h*amplitude);
    }
    return path(d+'V430Z',fill,'none');
  }
  function city(w,stage) {
    let distant='', mid='', near='';
    const sky=['#e6ebde','#e8e5d7','#e1e8e2'][stage];
    const sun=['#dcb781','#d8ad89','#d8bd8a'][stage];
    const sunX=w*(stage===1?.32:.68), sunY=stage===2?83:99;
    for (let i=-2;i<w/27+5;i++) {
      const x=i*27, y=237+Math.sin(i*.83+stage)*13;
      distant+=path('M'+x+' 295v-'+num(295-y)+'l8 -7 10 2 7 5v44Z','#c2cec0','none');
    }
    for(let i=-3;i<w/36+8;i++) {
      const x=i*36, y=265+Math.sin(i*.84+stage)*14+Math.cos(i*.41)*11;
      mid+=use('house'+((i+12+stage)%4),x,y,.86);
    }
    for(let i=-3;i<w/59+8;i++) {
      const x=i*59, y=345+Math.sin(i*1.83)*25;
      near+=use('house'+((i+12+stage)%4),x,y,[1.31,1.44,1.22,1.4][(i+12)%4]);
    }
    const landmarks=use(stage===1?'dome':'clock',w*.205,263,1.22)+use(stage===1?'clock':'dome',w*.706,263,.98);
    const river=path('M0 303Q'+num(w*.45)+' 271 '+num(w*.64)+' 289T'+num(w+150)+' 282V369H0Z','#b6cac3','none');
    const sail=path('M-8 0 7 -.5l-3 3H-4Z','#788f83','none')+
      path('M0 -1v-16l-7 16Z','#f4ecd5','#94a397',.65)+path('M2 -2v-11l5 11Z','#d6b394','none');
    const bridge=path('M-61 3Q-3 -9 61 -2v10l-9 1q-12 -16 -19 1l-9 1q-14 -19 -24 1l-10 1q-12 -17 -23 2l-9 1q-9 -15 -17 1Z','#b1ad96','#8a9b8b',.85)+
      line('M-61 1Q-2 -12 61 -4','#8c9d8f',1.4);
    let water='';
    for(let i=0;i<w/32+4;i++) {
      water+=line('M'+i*32+' '+num(307+Math.sin(i*2.9)*10)+'l18 -.5m-13 5h8','#dce0cc',1.2);
    }
    return '<rect width="100%" height="410" fill="'+sky+'"/>'+
      round(num(sunX),sunY,39,sun)+
      move(sunX,sunY,line('M-29 -27Q-8 -46 15 -37m5 2q13 7 17 17M32 22q-9 15 -24 18','#b99e78',.7)+
        line('M20 29l9 -10m-5 11 8 -10m-4 8 5 -6','#ba9c74',.7))+
      use('cloud',w*.18,75,.87)+use('cloud',w*.57,120,.61)+use('cloud',w*.88,60,.95)+
      use('bird',w*.57,67,.46)+use('bird',w*.60,59,.32)+use('bird',w*.54,76,.23)+
      ridge(w+120,206,2+stage,'#c4d6ca',55)+ridge(w+120,218,4+stage,'#b6cabc',36)+distant+
      '<g id="farTown">'+landmarks+mid+river+water+move(w*.52,309,sail,.74)+move(w*.57,295,sail,.44)+
      move(w*.80,289,bridge,Math.min(1,w/630))+'</g><g id="nearTown">'+near+'</g>';
  }
  function ledge(left) {
    const flip=left?-1:1;
    const chimney=path('M175 5v-32l17 1v30Z','#b5a68c','#758074')+
      path('M172 -27v-5l23 1v5Z','#c9b298','#748071')+
      path('M177 -27h14v31h-14Z','url(#brick)','none');
    const rail=line('M30 5v-13q0-3 2 -3t2 3v12m-2 -13 105 -.7m-98 10 -1 -11m15 11v-11m15 11v-11m15 11v-11m15 11v-11m15 11v-11m15 11v-12','#67796b',1.35);
    return group('scale('+flip+' 1)', 
      path('M-4 12 15 12 33 8 192 7 221 21 2200 21V570H-4Z','#c5bfaa','#727a70',1.5)+
      path('M-4 19 16 22 16 491 -4 491Z','#9ca699','#747f74',1)+
      path('M16 21h2184v450H16Z','url(#brick)','none')+
      path('M-7 10 13 13 36 5 2200 5v8L33 14 15 21 -8 16Z','#d9cdb2','#778175',1.4)+
      path('M43 4 47 -9 63 -16 101 -16 115 4Z','#8c9b90','#66776c',1.4)+
      path('M43 4 47 -9 63 -16 101 -16 115 4Z','url(#hatch)','none')+
      chimney+rail+(left?'':path('M77 -17v-15l8 -1v17','#b2a78f','#717b70',1.4))+
      [31,67,103,139,175,211,247,283,319,355,391,427,463,499,535,571,607].map(x=>
        move(x,44,path('M0 29V7Q6 -5 14 6v23Z','#7e8d85','#6f7a70',1.25)+line('M7 2v27M1 13h12','#cfc4a6',1.6)+line('M-3 31h20','#727c70',1.5))).join('')+
      line('M19 90 1150 90m-1130 4 1130 1','#89917e',1)+
      path('M-2 10V-3l4 -.6L3 11Z','#55675e',ink,1)+round(0,0,2.5,'#cec7aa',ink));
  }
  function flag(direction, phase, time) {
    const slack=direction===0, dir=direction||1;
    const spread=slack?18:32, drop=slack?8:1;
    const flutter = phase==='gust'?Math.sin(time*12)*3:0;
    return line('M.5 0 0 -53','#596c63',2.4)+round(0,-54,2.4,'#7b7a62')+
      group('translate(0 -51) scale('+dir+' 1)',
        path('M0 0 Q8 -2 15 2 T'+spread+' '+(drop+flutter)+' l-7 5 6 4Q12 '+(drop+8)+' 0 10Z',
          '#b7745b','#785e4f',1.1)+line('M3 2Q11 0 17 3','#e7b798',1.1));
  }
  function legPaths(a) {
    return ['M-6 -35Q-2 -37 3 -33L'+num(-4-a)+' -16 '+num(-3-a)+' -2l-4 .5 -3 -15Z',
      'M1 -35 8 -33 7 -19 '+num(4+a)+' -3l-5 1 1 -18Z',
      'M'+num(-8-a)+' -4l5 -1 5 3q2 1 0 2l-11 -.5Z',
      'M'+num(-1+a)+' -3l6 -1 5 3q1 1 -2 1l-10 1Z'];
  }
  function person(angle) {
    const legColors=['#64716b','#53615e','#534f48','#4c4c46'];
    const parts='<g id="legs">'+legPaths(1.5).map((d,i)=>path(d,legColors[i],ink,i<2?1.4:1)).join('')+'</g>'+
      group('rotate('+num(angle*.21)+' 0 -33)',
        path('M-3 -65q-5 8 -10 16l-7 13 12 -2 5 -5 3 8 13 -.8 -6 -29Z','#778f83',ink,1.45)+
        path('M0 -61Q4 -51 -1 -37l-7 1 4 -7Z','#586e65','none')+
        line('M-2 -62q-2 13 -10 22m7 -16 -9 15m10 -8 -4 7','#a4b2a0',1.1)+
        path('M-3 -68l3 -7 8 2 -3 9Z','#c8a684',ink,1.1)+
        path('M-5 -79q4 -8 12 -2l1 6 2 3 -3 1q-1 6 -6 4l-4 -5Z','#d7b898',ink,1.15)+
        line('M5 -76l1.2 .2','#6d5848',.9)+
        path('M-7 -79q3 -10 12 -7 4 1 5 6l-5 -1q-2 1 -4 5l-2 -2 -1 4 -5 -2Z','#554f48',ink,1.2)+
        path('M-7 -77q-6 0 -6 5 2 4 6 1l2 -5Z','#554f48',ink,1)+
        path('M-5 -66q4 3 11 -.5l-1 4 -7 1 -8 6 -13 1 5 -3 -4 -1 10 -1Z','#b77a62','#876251',1)+
        line('M-1 -64l-9 6','#d6a186',.9)+
        path('M3 -61q3 -2 7 3l7 4 5 -7 3 2 -5 12q-2 2 -7 -1l-10 -5Z','#899d8e',ink,1.3)+
        group('rotate('+num(-15+angle*.22)+' 21 -58)',
          line('M21 -55v-60','#6c6553',2)+
          path('M-25 -91Q-12 -106 20 -113Q48 -110 67 -92Q56 -94 51 -89Q40 -94 33 -89 22 -93 14 -89 3 -94 -6 -89 -15 -94 -25 -91Z','#c4866e','#6e5b4f',1.35)+
          path('M20 -112Q4 -108 -6 -90q10 -4 20 1 0 -13 6 -23Z','#dbac91','none')+
          path('M20 -112q20 7 31 22 -10 -4 -18 1 -4 -16 -13 -23Z','#d9a187','none')+
          line('M-25 -91q22 -16 45 -21Q3 -106 -6 -90m26 -22q-6 11 -6 23m6 -23q9 9 13 23m-13 -23q20 7 31 22m-31 -22 1 -4','#886d58',.95)+
          line('M-24 -90q8 -4 18 1 9 -5 20 0 8 -5 19 0 8 -5 18 0 7 -6 16 -3','#735b50',1.1)+
          line('M-17 -94q5 -2 10 -.5m4 -1q7 -2 13 -.5m7 -.5q6 -2 12 -.8m7 -.3q7 -1 11 -.2m8 -.4 6 .3','#edc9a8',1.15)+
          path('M18 -59q2 -4 5 -3l1 3 -4 4Z','#d6b18f',ink,.95),'parasol'),'coat');
    return group('rotate('+num(angle)+')',parts,'body-pose');
  }
  function layout(w, s) {
    const p=s.distance/s.route.length;
    const span=Math.max(w*.57,315)*(1+s.stage*.20);
    const feet=w*(.34+.31*p);
    const start=feet-p*span, end=start+span;
    const leftY=223, rightY=178;
    const y=leftY+(rightY-leftY)*p+4*30*p*(1-p);
    return {feet,start,end,leftY,rightY,y,p};
  }
  function wireCurve(g) {
    return 'M'+num(g.start)+' '+g.leftY+'Q'+num((g.start+g.end)/2)+' '+num((g.leftY+g.rightY)/2+60)+' '+num(g.end)+' '+g.rightY;
  }
  function pole(w) {
    const x=w*.79;
    return move(x,246,path('M-10 36V1H9v34Z','#c4c5b0','#879789')+
      path('M-13 3 0 -11 13 3Z','#889f93','#798c7f')+windows(-5,6,2,1,6,0,true));
  }
  function print(w,s,weather,cover=false) {
    const g=layout(w,s);
    const wind=weather.direction;
    const cable=wireCurve(g);
    return definitions()+city(w,s.stage)+pole(w)+
      '<g id="windFlag" transform="translate('+num(w*.79)+' 236)">'+flag(wind,weather.phase,s.time)+'</g>'+
      '<g id="startLedge" transform="translate('+num(g.start)+' '+g.leftY+')">'+ledge(true)+'</g>'+
      '<g id="endLedge" transform="translate('+num(g.end)+' '+g.rightY+')">'+ledge(false)+
      '<g id="roofFlag" transform="translate(25 6)">'+flag(wind,weather.phase,s.time)+'</g></g>'+
      '<g id="rope">'+line(cable,'#384843',2.15)+line(cable,'#b7b3a0',.7,'transform="translate(0 2)" stroke-dasharray="2 3"')+'</g>'+
      '<g id="walker" transform="'+place(w,s)+'">'+person(cover?-8:s.angle)+
      '<g id="wobble" visibility="hidden">'+line('M-12 -7q-6 -4 -6 -10m2 14q-8 -3 -9 -11m37 7q6 -4 6 -10m-2 14q8 -3 9 -11','#9d583e',1.8)+'</g></g>'+
      '<rect width="100%" height="410" fill="url(#grain)" opacity=".26" pointer-events="none"/>';
  }
  // The complete static print can also be used for the lobby illustration.
  function place(w,s) {
    const g=layout(w,s);
    return 'translate('+num(g.feet)+' '+num(g.y)+') scale('+num(Math.max(.72,Math.min(1.24,w/660)))+')';
  }
  function mount(el) {
    let width=0, stage=-1, nodes, lastPose='', lastWind='', builtFor=0;
    function draw(s,weather,mode,fall=0) {
      if (!width) return;
      const g=layout(width,s);
      if (stage!==s.stage||builtFor!==width) {
        el.innerHTML=print(width,s,weather);
        nodes=Object.fromEntries(['windFlag','roofFlag','startLedge','endLedge','rope','walker','wobble','body-pose','legs','coat','parasol','farTown','nearTown'].map(id=>[id,el.querySelector('#'+id)]));
        stage=s.stage; builtFor=width; lastPose=''; lastWind='';
      }
      nodes.startLedge.setAttribute('transform','translate('+num(g.start)+' '+g.leftY+')');
      nodes.endLedge.setAttribute('transform','translate('+num(g.end)+' '+g.rightY+')');
      nodes.farTown.setAttribute('transform','translate('+num(-g.p*18)+' 0)');
      nodes.nearTown.setAttribute('transform','translate('+num(-g.p*52)+' 0)');
      const d=wireCurve(g);
      for (const wirePath of nodes.rope.children) wirePath.setAttribute('d',d);
      nodes.walker.setAttribute('transform',place(width,s));
      nodes.wobble.setAttribute('visibility',mode==='walking' && Math.abs(s.angle)>=RopeWalk.warning?'visible':'hidden');
      const a=mode==='fell'?Math.sign(s.angle)*(46+fall*18):s.angle;
      const stride=s.distance*2.8;
      const pose=[Math.round(a*2),Math.round(Math.sin(stride)*16),Math.round(fall*12)].join('/');
      if (pose!==lastPose) {
        const direction=Math.sign(s.angle);
        nodes['body-pose'].setAttribute('transform','translate('+num(direction*fall*18)+' '+num(fall*65)+') rotate('+num(a)+')');
        nodes.coat.setAttribute('transform','rotate('+num(a*.21)+' 0 -33)');
        nodes.parasol.setAttribute('transform','rotate('+num(-15+a*.22)+' 21 -58)');
        legPaths(s.distance>0?Math.sin(stride)*4.4:1.5).forEach((d,i)=>nodes.legs.children[i].setAttribute('d',d));
        lastPose=pose;
      }
      const windKey=weather.phase+'/'+weather.direction+'/'+(weather.phase==='gust'?Math.floor(s.time*9):0);
      if(windKey!==lastWind) {
        const cloth=flag(weather.direction,weather.phase,s.time);
        nodes.windFlag.innerHTML=cloth; nodes.roofFlag.innerHTML=cloth; lastWind=windKey;
      }
    }
    return { resize(w,h) {width=Math.max(165,Math.round(410*w/Math.max(1,h)));el.setAttribute('viewBox','0 0 '+width+' 410');}, draw };
  }
  return {print,place,mount};
})();
