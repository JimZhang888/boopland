const ShoreMap = (() => {
  'use strict';
  const {path:p, oval:o, group, icons} = ShoreArt;
  const hatch = (d) => p(d,'none','stroke-width="1"');
  const rock = p('M4 69 L14 43 L30 32 L46 38 L54 61 L63 73 Q38 85 4 74 Z','#a6aaa0')+
    p('M14 44 l17 -7 l11 11 l-8 9 l-24 9 Z','#c0c2b6')+
    p('M34 58 l9 -9 l8 13 l6 11 l-24 3 Z','#8d968c')+
    p('M48 80 l10 -17 l19 -9 l16 13 l4 15 q-21 8 -49 3 Z','#a6ada1')+
    hatch('M5 78 q21 8 39 4 M17 53 l10 -6 M19 56 l9 -6 M36 68 l7 -10 M40 70 l5 -9 M64 68 l11 -6 M69 71 l11 -6 M79 73 l9 -4');
  const grass= p('M41 85 Q34 58 9 42 Q31 49 44 71 Q36 39 20 20 Q39 33 47 60 Q39 24 49 6 Q48 30 52 54 Q60 23 75 18 Q63 37 58 64 Q76 40 94 38 Q73 53 60 72 Q82 61 94 64 Q75 71 61 83 Z','#98a98d')+
    hatch('M17 86 q28 -7 63 1 M33 91 l18 -3 M45 77 l-11 -25 M54 73 l8 -32');
  const tower=p('M26 85 L35 36 L57 36 L70 87 Q51 94 26 85 Z','#eee9d5')+
    p('M32 52 L61 54 L65 67 L30 65 Z','#b87961')+
    p('M27 85 L69 87 L71 92 L24 91 Z','#b0b3a3')+
    p('M32 35 L32 23 L59 23 L60 36 Z','#cbd8cd')+
    p('M29 22 L45 10 L63 23 Z','#a96f55')+
    p('M31 37 L60 37 L62 41 L29 40 Z','#899991')+
    p('M44 11 L46 4 M40 25 L40 34 M48 25 L48 34 M54 26 L54 34 M28 32 L63 32 M28 30 L28 38 M63 30 L63 38')+
    p('M45 87 L47 74 Q51 70 55 76 L57 88 Z','#637972')+
    p('M44 46 L51 46 L51 50 L43 49 Z','#617771')+hatch('M34 72 l6 -2 M56 58 l5 1 M34 82 l6 -2 M37 59 l7 -1 M55 80 l4 1');
  const hut=p('M8 54 L35 35 L67 46 L93 62 L88 68 L63 57 L38 48 L15 64 Z','#b99977')+
    p('M16 62 L37 48 L62 58 L62 84 L18 80 Z','#e1d3b0')+
    p('M62 58 L87 67 L85 82 L62 84 Z','#c0b595')+
    p('M29 80 L29 63 L39 59 L40 82 Z','#829288')+p('M48 63 l8 3 l-1 8 l-7 -2 Z','#788c83')+
    hatch('M16 55 l22 -17 M22 56 l19 -15 M28 57 l17 -14 M49 50 l8 -3 M63 54 l6 -3 M69 56 l7 -2 M65 68 l17 3 M65 74 l16 3');
  const boat=p('M8 60 Q46 63 88 49 Q84 65 68 74 Q45 83 19 75 Z','#a98569')+
    p('M8 59 Q38 48 87 48 Q58 63 16 65 Z','#cbb99c')+
    p('M22 59 Q46 51 74 51 M33 54 l6 6 M57 51 l5 4 M44 53 L45 14','none','stroke-width="2"')+
    p('M42 17 L39 48 L15 54 Q30 40 42 17 Z','#ede8d5')+p('M46 24 L65 47 L46 46 Z','#c4a080')+
    hatch('M43 12 l13 3 l-13 3 M18 70 q27 8 54 -4 M12 80 q14 5 29 3 M53 81 q21 -1 31 -9');
  const bird=p('M15 60 Q32 61 43 46 Q51 37 57 42 Q63 46 58 55 Q52 64 39 68 Q27 74 15 60 Z','#e2e1d1')+
    p('M48 46 Q56 39 52 30 Q49 15 61 12 Q69 12 71 18 L87 20 L69 23 Q61 20 61 28 Q68 46 59 55 Z','#eeeadc')+
    p('M34 67 L34 85 L27 89 M42 66 L43 80 L50 86 M14 60 L8 57 L18 66 M87 20 L72 19 M22 61 Q38 57 46 47')+o(66,17,1.2,1.2,'#45534c');
  const gull = p('M8 51 Q18 44 34 54 Q47 37 64 38 Q45 44 36 59 Q24 52 8 51 Z','#6c7e75');
  const plants=p('M45 87 Q51 68 44 48 Q33 35 35 18 M44 52 Q57 35 57 17 M45 65 Q27 55 23 35 M48 71 Q63 57 68 32 M47 54 Q69 44 72 19','none','stroke-width="4.2"')+p('M34 37 Q22 32 22 21 Q33 23 34 37 M53 30 Q53 18 65 10 Q64 23 53 30 M29 48 Q14 45 12 34 Q24 37 29 48 M62 47 Q61 35 69 28 Q72 39 62 47 M46 60 Q44 45 39 42 Q38 53 46 60','#98a58d');
  const shapes={rock,grass,tower,hut,boat,bird,gull,plants};
  const seaEdges=[
    'M206 -9 C265 49 382 32 427 68 S585 57 632 109 S751 141 720 207 S757 278 789 314 S754 408 844 471 L865 507 L872 -18 Z',
    'M129 -9 C199 74 256 48 337 65 S448 127 526 103 S648 76 677 125 S761 162 712 206 S721 273 783 274 S792 368 846 384 L875 407 L877 -19 Z',
    'M219 -16 C274 76 356 42 412 67 S542 69 600 100 S664 145 738 130 S796 167 750 219 S754 280 790 302 S748 399 847 447 L870 494 L870 -17 Z'
  ];
  function rng(seed) { let s=seed; return () => ((s = (s*1664525+1013904223)>>>0)/4294967296); }
  const wash=(d,fill)=>p(d,fill,'stroke="none"');
  const tidepool='M-55 4 Q-50 -10 -25 -14 Q-7 -21 12 -14 Q23 -10 42 -11 Q64 -9 59 1 Q52 11 30 12 Q3 18 -16 13 Q-40 17 -55 4 Z';
  function scene(zone,w=840,h=480) {
    const rand=rng(145+zone*91), sx=w/840,sy=h/480;
    const scale=Math.min(sx,sy)*1.04;
    const unit=(type,x,y,size,angle=0,mirror=false) => '<g transform="translate('+x*sx+' '+y*sy+') rotate('+angle+') scale('+(mirror?-1:1)*size*scale/100+' '+size*scale/100+') translate(-50 -50)">'+group(shapes[type]||icons[type],1.5)+'</g>';
    const coast=seaEdges[zone];
    let base = '<defs><pattern id="sandGrain" width="33" height="27" patternUnits="userSpaceOnUse">'+
      '<g fill="#756954" opacity=".30"><circle cx="4" cy="6" r=".8"/><circle cx="23" cy="19" r=".65"/><circle cx="11" cy="24" r=".5"/></g></pattern>'+
      '<pattern id="seaStrokes" width="71" height="42" patternUnits="userSpaceOnUse"><path d="M4 12 q8 2 15 -1 m5 -1 l5 -1 M39 33 q8 2 17 -1" fill="none" stroke="#628b86" stroke-opacity=".42" stroke-width="1"/></pattern></defs>'+
      '<g transform="scale('+sx+' '+sy+')"><rect width="840" height="480" fill="'+['#eaddba','#e3d9ba','#dbd6b9'][zone]+'"/>';
    // Shallow water, strandline and parallel chart contours.
    base+=wash('M-20 290 Q93 256 175 289 T356 296 T541 341 Q637 352 723 301 Q623 407 492 387 T248 348 T-20 357Z','#e4d5b2')+
      wash('M-10 425 Q89 361 164 390 T374 423 T572 435 Q409 466 270 443 T0 479Z','#d8caa9');
    base+=p(coast,'#bcd8cf','stroke="#d4c6a5" stroke-width="31"')+
      p(coast,'#accbc4','stroke="#f3ebd3" stroke-width="18"')+p(coast,'url(#seaStrokes)','stroke="#83a89c" stroke-width="1.5"')+
      p(coast,'none','transform="translate(14 -13)" stroke="#e6efdd" stroke-width="3" opacity=".75"')+
      p(coast,'none','transform="translate(30 -25)" stroke="#87aaa3" stroke-width="1"')+
      p(coast,'none','transform="translate(44 -39)" stroke="#d3e5d8" stroke-width="2"');
    for(let i=0;i<135;i++){
      const x=~~(rand()*855), y=~~(rand()*460)+14;
      if(x>690&&y<260 || y<65&&x>200)continue;
      const len=3+~~(rand()*21);
      base+=p('M'+x+' '+y+' q'+len*.4+' 2 '+len+' -1','none','stroke="#988e6c" stroke-width=".9" opacity=".43"');
      if(i%6===0) base+=p('M'+(x+3)+' '+(y+4)+' l'+len*.5+' -1','none','stroke="#a79a78" opacity=".5"');
    }
    base+='<rect width="840" height="480" fill="url(#sandGrain)"/>';
    const pools=[
      [[190,300,.8],[611,207,.83],[510,391,.52],[380,113,.4]],
      [[257,225,1.35],[680,269,1.05],[360,370,.8],[566,151,.45]],
      [[448,139,1.2],[483,350,1.23],[202,381,1.08],[720,310,.52]]
    ][zone];
    for(const [x,y,k] of pools) base+='<g transform="translate('+x+' '+y+') rotate(-10) scale('+k+')">'+
      p(tidepool,'#b9d0bc','stroke="#acac8a" stroke-width="3"')+p(tidepool,'#a9c5b8','transform="scale(.86 .71)" stroke="none"')+
      p('M-35 6 q12 3 21 1 m21 -13 q14 -1 27 2 m-8 10 l12 -2','none','stroke="#eaf0d8" stroke-width="2"')+'</g>';
    base+=wash('M0 -5 L169 -5 Q185 11 169 24 Q186 36 151 43 Q155 54 125 61 Q100 66 91 86 Q75 100 48 94 Q27 104 30 119 Q11 126 -6 132Z','#a6b29a')+
      p('M0 132 Q27 128 32 112 Q38 96 62 102 Q82 94 92 86 Q108 64 134 66 Q163 61 165 48 M0 139 Q24 134 34 121 M114 72 q30 -4 43 -15','none','stroke="#7f8b78" stroke-width="1.8"');
    base+='</g>';
    const clusters=[[12,98,73],[58,81,77],[112,64,82],[153,43,55],[182,32,39],[820,425,116],[750,451,71],[797,442,94],[775,392,46],[832,367,45]];
    for(const [x,y,k] of clusters) base+=unit('rock',x,y,k,0,x%2===0);
    if(zone===0) base+=unit('tower',89,51,102,-3)+unit('hut',31,57,56,-4);
    if(zone===1) base+=unit('hut',81,36,105,-2)+unit('grass',126,46,57);
    if(zone===2) base+=unit('rock',89,30,143)+unit('plants',73,26,54)+unit('rock',152,53,76);
    if(zone===1) {
      for(const [x,y,k] of [[43,219,98],[63,203,66],[27,186,80],[118,383,56],[146,389,40],[670,163,40],[655,162,28]]) base+=unit('grass',x,y,k);
    }
    if(zone===2) {
      for(const [x,y,k] of [[94,195,100],[131,195,70],[169,183,31],[542,200,44],[571,202,30],[381,395,58],[420,402,41],[510,116,27]]) base+=unit('rock',x,y,k);
      base+=unit('plants',113,180,41)+unit('plants',397,386,33);
    }
    base+=unit('boat',732,73,zone===1?79:94,zone===2?-9:-5)+unit('gull',572,30,49,-6)+unit('gull',608,19,36,9);
    base+=unit('bird',95,294,zone===2?48:76,-3)+unit('bird',128,313,43,7,true);
    for(let i=0;i<13;i++) base+=unit(zone===2?'plants':'grass',rand()*125-12,465-rand()*65,30+rand()*54,rand()*22-11);
    for(const [x,y,k] of [[19,323,39],[132,433,22],[382,407,18],[591,103,24],[580,354,16],[354,149,21],[776,331,24]]) base+=unit('rock',x,y,k);
    for(const [x,y,k,a] of [[188,161,19,-18],[442,291,14,24],[633,372,24,32],[318,443,20,20]]) base+=unit('shell',x,y,k,a);
    for(const [x,y,k] of [[583,121,29],[738,431,38],[22,99,24],[189,69,27]]) base+=unit('grass',x,y,k);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 '+w+' '+h+'" aria-hidden="true">'+base+'</svg>';
  }
  return {scene};
})();
