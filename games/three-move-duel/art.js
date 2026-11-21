(function (root) {
  'use strict';
  const ink = '#454c43';
  const centers = [284, 392, 500, 608, 716];
  const deck = [260, 254, 252, 254, 260];
  const path = (d, fill, extra = '') => '<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
  const hand = 'stroke="'+ink+'" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"';
  const line = (d, color = ink, w = 1.4) => path(d, 'none', 'stroke="'+color+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"');

  function random(seed) {
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function mountain(points, color, pencil, seed, depth) {
    const rand = random(seed);
    let hatch = '';
    for (let i = 1; i < points.length - 1; i++) {
      const [x, y] = points[i], [next, ny] = points[i + 1];
      for (let j = 0; j < 6; j++) {
        const t = rand(), xx = x + (next-x)*t, yy = y + (ny-y)*t;
        const len = (9+rand()*26)*depth, lean = (i%3 === 0 ? 0.5 : -0.58)*len;
        hatch += line('M'+xx.toFixed(1)+' '+(yy+2).toFixed(1)+'q'+(lean*.36).toFixed(1)+' '+(len*.58).toFixed(1)+' '+lean.toFixed(1)+' '+len.toFixed(1),pencil,0.75);
      }
    }
    // Small shelves and softened crests break up each pencil contour.
    let edge='M'+points[0].join(' ');
    for(let i=1;i<points.length;i++) {
      const [x,y]=points[i-1], [xx,yy]=points[i], dx=xx-x, dy=yy-y;
      edge+=' q'+(dx*.12).toFixed(1)+' '+(dy*.04).toFixed(1)+' '+(dx*.27).toFixed(1)+' '+(dy*.31).toFixed(1)+
        'l'+(dx*.16).toFixed(1)+' '+(dy*.21+2).toFixed(1)+' '+(dx*.12).toFixed(1)+' '+(dy*.03-2).toFixed(1)+
        'Q'+(xx-dx*.12).toFixed(1)+' '+(yy-dy*.03).toFixed(1)+' '+xx+' '+yy;
    }
    return path(edge+' V268 H'+points[0][0]+'Z',color)+line(edge,pencil,1.2)+'<g opacity=".49">'+hatch+'</g>';
  }

  function pineCrown(x,y,scale,seed) {
    const rand=random(seed);
    let needles='';
    for(let i=0;i<8;i++){
      const xx=-26+i*7, yy= -8*Math.sin(i*Math.PI/7);
      for(let j=0;j<10;j++) {
        const angle= -Math.PI*.94+j*.29, len=7+rand()*8;
        needles+='M'+xx+' '+yy.toFixed(1)+'l'+(Math.cos(angle)*len).toFixed(1)+' '+(Math.sin(angle)*len).toFixed(1);
      }
    }
    return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+path('M-41 1Q-38-7-29-7Q-29-14-15-13Q-3-23 7-16Q22-18 23-10Q42-10 39 0Q22 3 12 0Q-11 7-20 2Z','#a3af94')+line(needles,'#526654',.88)+'</g>';
  }
  function pine(x,y,s,flip=1) {
    return '<g transform="translate('+x+' '+y+') scale('+s*flip+' '+s+')">'+
      path('M-13 6Q-3-5-2-26Q0-45 8-62Q9-78 5-105L10-113Q12-94 14-82Q21-90 31-94L43-111L47-112L36-92L18-78L12-60Q5-40 7-30L17-47L32-54L46-68L50-67L37-49L21-41L10-22L7-5L18 2L2 0Z','#7e806b',hand)+
      line('M0-25Q0-45 8-57M8-61L-9-69L-25-91M-7-68L-31-72L-47-85M11-88L-4-101L-18-108M31-94L57-94L70-103M29-53L60-55L72-66','#586450',3)+
      line('M-4-6Q2-31 4-43M9-73L11-88','#c4c1a7',1.6)+
      [[-28,-90,.7],[-53,-84,.65],[-22,-109,.74],[7,-115,.76],[47,-112,.67],[72,-103,.69],[76,-67,.76],[50,-70,.67]].map((a,i)=>pineCrown(...a,i+21)).join('')+'</g>';
  }
  function pavilion() {
    return '<g transform="translate(197 189) scale(.73)">'+
      path('M-29 2v-28l6-5v33m36 0v-33l6 4V3','#68776c')+
      path('M-68-31q26 1 46-19L-4-65l4-11 4 13q18 21 40 29l24 2-14 6h-104Z','#68786e','stroke="#57675f" stroke-width="1.6"')+
      line('M-59-30q36-1 58-30q18 24 54 30M-43-32l25-15m-14 15 20-16m2 15 8-19m11 17-4-13m19 16-12-14','#bec4af',1.3)+
      path('M-39 4h75l9 5h-92Z','#7d8979')+line('M-32-7h62m-53-5v15m12-15v15m12-15v15m12-15v15','#899381',2)+'</g>';
  }

  function bridge() {
    let stones='', cracks='';
    const walls = 'M151 287Q210 243 499 244Q787 242 849 288L854 333Q805 305 762 307Q711 311 697 352L660 353Q633 291 575 296Q526 295 513 354H485Q469 294 421 296Q364 292 338 354L300 353Q282 310 234 307Q182 305 148 332Z';
    for(let i=0;i<5;i++){
      const x=centers[i], y=deck[i];
      stones+=path('M'+(x-54)+' '+(y+1)+'l9-10 95 1 5 9-6 13-98-1Z',i%2?'#d7d1b9':'#ded9c3',hand)+
        line('M'+(x-51)+' '+(y+2)+'q49 2 101-1','#8c8c78',1.3)+
        '<g class="cell-mark" data-cell="'+i+'" transform="translate('+x+' '+(y+8)+')"><rect x="-17" y="-8" width="34" height="16" rx="6" fill="#ebe6d4"/><text y="4.3" text-anchor="middle" fill="#5c6053" font-family="Georgia,serif" font-size="13">'+['I','II','III','IV','V'][i]+'</text></g>';
    }
    const rand=random(33);
    for(let i=0;i<75;i++) {
      const x=151+rand()*700, y=263+rand()*80;
      cracks+=line('M'+x.toFixed(1)+' '+y.toFixed(1)+'l'+(3+rand()*8).toFixed(1)+' -3','#8d9380',.8);
    }
    return '<defs><clipPath id="wall-clip">'+path(walls,'white')+'</clipPath></defs>'+
      path(walls,'#b0b4a0',hand)+'<g clip-path="url(#wall-clip)">'+
      line('M140 281Q504 252 854 282M144 300Q502 271 850 301M279 290l-3-16m63-3-3 16m49-20-3 15m52 0-1-16m65 14 1-14m75 19-2-19m71 22-4-20m62 26-4-19m50 4 8 20m45-10 4 11','#89907e')+
      path('M134 331Q226 258 293 325L310 344Q330 282 404 279Q472 274 501 327Q528 272 600 280Q652 283 686 336Q745 264 856 307V364H138Z','#8e9a88')+
      cracks+'</g>'+stones+
      line('M144 287l39-17 40-5m551 2 31 4 40 17','#717b69',2);
  }

  function landscape(){
    const far=[[-190,182],[-60,130],[0,151],[64,120],[104,129],[146,100],[174,111],[245,62],[267,74],[297,54],[340,92],[389,112],[453,78],[475,90],[531,47],[554,62],[603,94],[680,73],[715,107],[774,78],[842,108],[930,51],[966,75],[1053,38],[1112,86],[1230,58]];
    const mid=[[-180,163],[-42,125],[24,158],[80,148],[127,168],[181,128],[210,151],[258,114],[273,117],[303,93],[326,99],[358,134],[418,154],[453,144],[495,174],[563,143],[596,159],[644,119],[668,137],[722,86],[750,113],[786,104],[833,146],[897,113],[942,132],[1011,83],[1070,115],[1180,132]];
    let water='', reeds='';
    const rand=random(48);
    for(let i=0;i<105;i++){
      const x=-60+rand()*1150, y=226+rand()*182, len=4+rand()*55;
      water+=line('M'+x.toFixed(1)+' '+y.toFixed(1)+'q'+(len*.4).toFixed(1)+' -1 '+len.toFixed(1)+' 0',i%4?'#b9c3b3':'#a5b2a2',.6+rand()*.75);
    }
    for(let i=0;i<42;i++){
      const x=35+rand()*123, y=258+rand()*25;
      reeds+=line('M'+x.toFixed(1)+' '+y.toFixed(1)+'q-1 -7 -'+(1+rand()*6).toFixed(1)+' -'+(7+rand()*10).toFixed(1),'#87957c',1);
    }
    return '<defs><linearGradient id="water" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#dde3d5"/><stop offset="1" stop-color="#f0edde"/></linearGradient><pattern id="paper-grain" width="137" height="131" patternUnits="userSpaceOnUse"><filter id="fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" stitchTiles="stitch"/></filter><rect width="137" height="131" filter="url(#fiber)" opacity=".23"/></pattern></defs>'+
      '<rect x="-1500" y="-1200" width="4000" height="2600" fill="#f3efdf"/>'+
      '<g id="sky-details"><circle cx="562" cy="72" r="33" fill="#c7836d" opacity=".92"/>'+
      line('M207 49q28 3 46-2t51-1q12 2 24 0m-91 9q21 0 31-2m431 9q28 2 44-1t38-1','#d4cfb9',1.3)+'</g>'+
      '<g id="ridges">'+mountain(far,'#d3d8c9','#b6c1b0',7,.75)+mountain(mid,'#b5c3b0','#91a48f',3,1.2)+'</g>'+
      path('M-200 181Q46 176 112 185T292 187Q376 184 439 169Q492 161 554 184Q602 200 723 172T909 160T1230 173V282H-200Z','#d9dfd0')+
      path('M-50 192q116-3 196 9t178-4q51-12 130-12t150 15q62 10 147-4t339-13v78H-50Z','#cbd5c4')+
      path('M-400 220q269-21 442-6t433-1t446 2t491-2v455H-400Z','url(#water)')+water+
      path('M-150 198q102-35 211-17q73 17 121 4l37-8 74 20-65 12-87 1-78 11-213-2Z','#9eaf99')+pavilion()+
      pine(146,184,.26,-1)+pine(240,182,.24)+
      path('M-140 207q165-30 251 9l51 18 57 6 21 18-36 13-49 7-51 14-244 5Z','#849782')+
      path('M-130 253q130-36 206-17l40 10 53-3 52 19-26 7-14 16-65 13-56 20-190 2Z','#c0c3a9','stroke="#909984" stroke-width="1.5"')+
      line('M24 272l75-6 54-16m-42 40 17-8 25-4 19-15m-131 35 33-13 16 1','#929981')+reeds+
      path('M765 256l26-18 45-5 41-19 32-41 63 9 58-24 122 22v128l-151 13-96-27-62 9Z','#99a58e')+
      path('M756 272l41-18 43 4 31-13 60-4 25-19 50 12 40-14 102 25v77l-173 5-56-15-81-1-55-13Z','#b0b69d','stroke="#899781" stroke-width="1.5"')+
      line('M797 258l39 7 62-15 35 4 41-20m-107 58 18-19 38-3m31 11 41-25 37-5','#8e9a84')+
      pine(877,235,1.17,-1)+pine(935,219,.64,1)+pine(1002,212,.46,1)+
      line('M276 354q21 2 67 0m-24 4 35-1m113-2q28 1 55-1m-35 5 21-1m136-3q29 2 62 0m-42 5 32-2','#9caa99',1.7)+
      bridge()+
      line('M389 73q8-2 13 4q2-7 10-9m-41 19q5-2 8 2q1-5 7-7m33-9q5-2 8 2q2-5 7-7','#727f71',1.7)+
      line('M58 328q39-4 66 0m-22 4 38-1m503 15q35-2 51 0m-29 4 45-1m142-18q19-2 39 1','#9ba99a',1.5);
  }

  /* Each figure is drawn facing right, with its origin at the feet. */
  function fighter(style) {
    const hero=style==='hero', colors={hero:['#5e7774','#94a7a0','#384e50'],pine:['#a26f58','#c7a085','#644b40'],rain:['#7a7c90','#adacbb','#50515e'],swallow:['#85845d','#b7b08d','#535640']};
    const [robe, light, dark]=colors[style];
    const hat=style==='pine' || style==='swallow';
    const blade = '<g class="sword">'+path('M22-49L70-72L75-74L70-68L24-46Z','#e2e3d8',hand)+line('M28-49l39-18','#929b91',.9)+
      line('M19-53l6 11',dark,3.4)+line('M10-43l12-7',dark,4)+line('M10-43q-6 10-13 10m12-9q-2 8-7 13',robe,1.9)+'</g>';
    const head = path('M-12-96q8-10 18-2l5 8-1 5 4 4-4 2-1 5-7 2-9-6-4-8Z','#debea0',hand)+
      line('M5-87l5 .8m-6 10 4-.6',dark,1.4)+
      (hat ? path('M-31-88q11-6 24-18l6-5 4 1 24 17-2 3q-23-1-55 4Z',style==='pine'?'#a49876':'#aba98b',hand)+line('M-24-89l23-17-9 13m10-14 12 13m-26 3 13-14m18 13 6 .4','#6d6b56',1)+line('M-15-87q4 26 20 15','#6d6654',1.2)
      : path('M-13-85q-8-13 3-19 11-6 21 3l1 8-12 1-4 8-3 2-1-7-3 4Z','#404b45',hand)+path('M-13-99q-10-3-6-9 5-6 11-2 5 3 4 9Z','#414b45',hand)+line('M-21-106l20 3','#ba9a79',2.5))+
      path('M-13-92q-6 13-16 15l-7 6q17-3 22-11l-6 17q9-7 12-21Z',dark,hand);
    // The settled silhouette follows the bridge deck, with a bent knee and the blade at rest.
    const fallen = '<g class="fallen" opacity="0">'+
      path('M-4-12L17-24Q20-26 23-22L34-6l8 2 1 4-13-1-13-13L5-3Z',dark,hand)+
      path('M0-8l20 1 14 3 10-1 3 5-17 1-16-4-16 4Z',dark,hand)+
      '<g transform="translate(-40 -14) scale(.86 .72) rotate(-64) translate(0 87)">'+head+'</g>'+
      path('M-34-8q3-12 15-13l27 7 10 3-4 4 7 4-17 1-8 3-8-2-21 2q-7-1-10-9Z',robe,hand)+
      path('M-30-15q9-7 15-2l15 8 5 3-9 1-15-3-11 1Z',light,hand)+
      path('M-6-17l5 1-5 15-5-1Z',dark,hand)+line('M0-11l11 6m-38 3 10-3','#515d50',1)+
      path('M-9-2L39 0l7 2-54-1Z','#e2e3d8',hand)+line('M-12-5l-1 7m-10-4 11 1',dark,2.6)+
      path('M-31-12q5-5 11 1l4 5 7 2-1 4-14-2-8-5Z',light,hand)+
      path('M-10-4l6 1 2 3-8-1Z','#d9b89a',hand)+'</g>';
    return '<ellipse class="ground-shadow" cy="1" rx="28" ry="3.7" fill="#6f7869" opacity=".25"/>'+
      '<g class="upright"><g class="pose">'+
      path('M-8-34l11 3-14 24-13 5-2-4 11-10Z',dark,hand)+path('M2-35l10-1 14 27 8 5-2 4-16-3-6-12-15-11Z',dark,hand)+
      path('M-28-4l12-4 4 4-2 4-17 1Z','#41483f',hand)+path('M18-5l11 1 8 2-1 3-20-2Z','#41483f',hand)+
      path('M-12-63q-12 6-18 21l-14 7q8 4 18 0l18-11 6-14Z',light,hand)+
      path('M-3-70q-11 1-14 13l-4 15q-7 12-17 18l12 2-6 8q13-2 22-8l8 6 13-6 8 4-7-30-3-21Z',robe,hand)+
      path('M1-67l7-1 7 24 9 18-11-4-4 5-9-17 6-13Z',light,hand)+
      line('M-5-61l-7 16-17 20m26-14-14 19m-11-8 12-10m22 1 7 10','#414c44',1.2)+
      path('M-16-45q12 3 27-2l1 6-28 3Z',dark,hand)+
      path('M-13-42q-12 0-21 8l-14-1 12 5q12-5 23-8',light,hand)+
      path('M-7-78l12-1 1 12-8 7-8-8Z','#d1b59a',hand)+
      head+
      path('M-9-69l6-3 9 5-6 7Z',light,hand)+
      path('M-10-64q6-7 14 3l6 9 9-4 5 8-15 10q-8-2-14-11l-5-8Z',light,hand)+
      blade+path('M16-51l4-4 6 1 2 3-4 3-6 1Z','#d9b89a',hand)+
      line('M-8-60l10 15m3 1 5 3m-23-8 5-10','#515d50',1)+'</g></g>'+fallen+
      '<g class="landing-dust" opacity="0">'+line('M-53 0l-7-3m11-1-3-4m88 7 6-3','#877c67',1.4)+'</g>';
  }

  function actor(id, style, cell, mirrored) {
    const flash='<g class="impact" aria-hidden="true">'+
      line('M21-60l9-9m-6 17 13-1m-15 7 9 6','#9e5946',3.2)+
      line('M18-56l5-3m-2 9 5 1','#f8e7c8',2)+'</g>';
    return '<g id="'+id+'" transform="translate('+centers[cell]+' '+(deck[cell]-10)+')"><g transform="scale('+(mirrored?-1:1)+' 1)">'+fighter(style)+flash+'</g></g>';
  }
  const api={ landscape, fighter, actor, centers, deck };
  if(typeof module==='object' && module.exports) module.exports=api; else root.DuelArt=api;
})(globalThis);

