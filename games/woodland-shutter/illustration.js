/* Original pen-and-wash drawings. The field guide, live birds and contact prints use the same plates. */
(function (root) {
  'use strict';
  const F = typeof module === 'object' && module.exports ? require('./field.js') : root.WoodlandField;
  const ink = '#454c41';
  const f = n => Number(n.toFixed(2));
  const path = (d, fill='none', stroke='none', width=1) => '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round"/>';
  const ellipse = (x,y,rx,ry,fill,stroke='none',w=1) => '<ellipse cx="'+f(x)+'" cy="'+f(y)+'" rx="'+f(rx)+'" ry="'+f(ry)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+w+'"/>';
  const group = (s,tf) => '<g transform="'+tf+'">'+s+'</g>';
  const trans = (x,y) => 'translate('+f(x)+' '+f(y)+')';
  const place = (s,x,y,k=1,rot=0) => group(s,trans(x,y)+' rotate('+f(rot)+') scale('+f(k)+')');
  function rng(seed) { return () => ((seed = (Math.imul(seed,1664525) + 1013904223)>>>0) / 4294967296); }
  // Plumage, head, breast, wing, rump, and bill for each species.
  const plumage = [
    ['#a48e6f','#a18c70','#bf7655','#8b795f','#e1d3b2',10],
    ['#699695','#628e90','#b87d55','#507d83','#d3ac80',21],
    ['#536059','#606962','#e0d7bb','#4a544f','#c47b66',15],
    ['#929c94','#566158','#e7e1cd','#687970','#e1dcca',10],
    ['#82979b','#81979b','#cfaa82','#6b8283','#d4ba92',13],
    ['#8b9c78','#7d999f','#d3bd7b','#708b90','#d8ce9b',7]
  ];
  function bird(index, p={}) {
    const [back,head,chest,wing,rump,bill] = plumage[index], open = p.beak||0;
    const long = [0, -5, 2, 16, -5, -3][index], lean = [0,2,3,0,1,-2][index];
    let art = path('M-6 7 Q-6 14 -9 17 l-6 1 m6 -1 5 1 M3 8 Q3 14 1 17 l-5 2 m5 -2 5 1','none',ink,1.25);
    art += group(path('M-9 0 Q-'+(25+long)+' 3 -'+(37+long)+' 13 l2 2 6 -1 -2 2 Q-16 12 -5 8Z',wing,ink,1.15) +
      path('M-13 5 L-'+(32+long)+' 13','none','#c7c5ac',.85),'rotate('+f((p.tail||0)*50)+' -10 4)');
    art += path('M-22 4 Q-17 -9 -4 -12 Q4 -14 11 -12 Q21 -7 20 2 C17 13 5 18 -6 14 Q-16 13 -22 4Z',back,ink,1.15);
    art += path('M-20 4 Q-13 6 -7 3 Q3 0 10 -5 L19 -3 Q21 7 10 12 Q-8 20 -20 4Z',rump);
    art += path('M1 -8 C3 -19 9 -23 18 -21 Q27 -20 27 -11 Q26 -4 21 -1 Q20 7 10 11 Q3 7 1 -1Z',head,ink,1.05);
    art += path('M8 -12 Q15 -17 22 -13 L26 -10 Q26 -7 21 -3 Q21 5 13 8 Q5 5 4 -1Z',chest);
    if (index===1) art += path('M2 -15 Q11 -26 22 -21 L25 -18 Q14 -21 3 -12Z','#58888c') + path('M8 -6 q4 2 8 0 l-3 5 -6 1Z','#efe2c6');
    if (index===2) art += path('M5 -15 q3 -7 10 -7 l-1 5 -6 3Z','#b56b5b') + path('M13 -14 q9 -4 12 0 l-2 3 -8 1Z','#f1ebd6') + path('M-7 11 q7 -6 14 1 l-8 3Z','#b66b57');
    if (index===3) art += path('M7 -15 q6 0 13 -3 l5 3 -6 6 -9 1Z','#eae5d3') + path('M12 -5 q5 1 10 -1 l-4 8 -6 1 -4 -6Z','#465149');
    if (index===4) art += path('M2 -12 Q13 -16 27 -13 l-2 3 Q12 -11 2 -8Z','#414d49');
    if (index===5) art += path('M5 -17 Q12 -27 22 -20 l2 2 Q14 -20 7 -15Z','#728c96') + path('M5 -12 q7 -7 19 -4 l2 5 -7 6 -10 -1Z','#eee9d7') + path('M4 -12 q11 -1 21 -3 l1 2 -12 4 -6 2Z','#475b58');
    const wingDrawing = path('M5 -5 C-1 -12 -13 -8 -19 0 L-'+(27+lean)+' 8 Q-16 9 -8 5 Q-2 7 5 -5Z',wing,ink,1.05)
      + path('M0 -5 Q-8 -4 -16 3 M1 -2 Q-5 2 -11 4 M-8 -3 l-11 8 M-12 -1 l-10 7','none','#c7c7af',.85);
    art += group(wingDrawing,'rotate('+f((p.wing||0)*63)+' 0 -5)');
    if(index===2) art += path('M-5 -5 l3 0 m-10 3 3 -1 m-8 4 3 -1 m3 1 3 -1','none','#e9e5d2',2.2);
    if(index===5 || index===3) art += path('M-11 -5 l7 2 -9 1Z','#e1ddc6');
    art += path('M25 -14 l'+bill+' '+f(1-open*2)+' -'+(bill-1)+' 3Z','#655e50',ink,.8);
    if(open>.03) art += path('M25 -11 l9 '+f(1+open*2)+' -9 0Z','#8a715c',ink,.7);
    art += ellipse(20,-15,2.25,2.25,'#2d372f','#e4d9c1',.65) + ellipse(20.55,-15.7,.63,.63,'#f9f3df');
    art += path('M4 8 l1 1 m1 -3 2 1 m-10 5 2 1 m6 -2 1 1 m11 -16 2 0 m-8 -13 2 -1','none','#716e5e',.7);
    return art;
  }
  function liveBird(p) {
    if (!p) return '';
    return group(bird(p.index,p),trans(p.x,p.y)+' scale('+p.face+' 1) rotate('+f(p.angle*180/Math.PI)+')');
  }
  function pine(x,y,h,width,color,r) {
    let d='M0 '+f(-h);
    const tiers=10, edges=[];
    for(let i=1;i<=tiers;i++) {
      const t=i/tiers, upper=-h*(1-t), size=width*(t*.89+.05);
      edges.push([size*(.75+r()*.28),upper,size,upper-h*.055, size*.41,upper-h*.018]);
    }
    for(const [tip,y1,outer,y2,inner,y3] of edges) d+=' L'+f(tip*.62)+' '+f(y2)+' l'+f(outer*.37)+' '+f(h*.076)+' L'+f(inner)+' '+f(y3);
    d+=' L0 2';
    for(const [tip,y1,outer,y2,inner,y3] of [...edges].reverse()) d+=' L'+f(-inner)+' '+f(y3)+' L'+f(-outer)+' '+f(y2+h*.084)+' L'+f(-tip*.5)+' '+f(y2);
    return group(path(d+'Z',color)+path('M0 0 l.4 '+f(h*.06),'none',color,Math.max(1,width*.1)),trans(x,y));
  }
  function sprig(x,y,size,angle,col) {
    let s = path('M0 2 Q1 -11 2 -29','none',col,1.1);
    for(let j=0;j<5;j++) {
      const h=-j*4.9, l=8.3-j*.75;
      s+=path('M1 '+f(h)+' q-'+f(l)+' -1 -'+f(l+1)+' -8 q7 1 '+f(l+1)+' 8Z',col)
        +path('M1 '+f(h-2)+' q2 -7 '+f(l+2)+' -10 q0 6 -'+f(l+2)+' 10Z',col);
    }
    return place(s,x,y,size,angle);
  }
  function scene(w,h) {
    const r=rng(6249), pt=(x,y)=>f(w*x)+' '+f(h*y), poly=(d,col)=>path(d,col);
    let s=poly('M0 0H'+f(w)+'V'+f(h)+'H0Z','#e9e6d4');
    s+=ellipse(w*.60,h*.202,h*.073,h*.073,'#f5e8bb');
    s+=poly('M0 '+pt(0,.36).split(' ')[1]+' Q'+pt(.12,.24)+' '+pt(.23,.36)+' T'+pt(.48,.33)+' Q'+pt(.64,.18)+' '+pt(.83,.35)+' L'+pt(1,.22)+' V'+f(h)+' H0Z','#c4cdc0');
    s+=poly('M0 '+f(h*.48)+' Q'+pt(.19,.33)+' '+pt(.32,.44)+' T'+pt(.65,.39)+' Q'+pt(.80,.30)+' '+pt(1,.42)+' V'+f(h)+' H0Z','#b4c2b5');
    for(let layer=0;layer<2;layer++){
      const count= Math.ceil(w/(layer?19:12));
      for(let i=-1;i<=count;i++) {
        const x=(i+r()*.7)*w/count, y=h*(.45+layer*.065)+Math.sin(x/w*8+layer)*h*.043+r()*8;
        const ht=(13+r()*27)*(layer?1.16:1);
        s+=pine(x,y,ht,ht*(.16+r()*.08),layer?'#93a99b':'#adbdaf',r);
      }
    }
    s+=poly('M0 '+f(h*.51)+' Q'+pt(.24,.49)+' '+pt(.40,.55)+' Q'+pt(.57,.61)+' '+pt(.71,.54)+' Q'+pt(.9,.48)+' '+pt(1,.51)+' L'+pt(1,1)+' H0Z','#a7baa6');
    // The river curves around two gravel bars. Broken horizontal strokes follow the water.
    s+=poly('M'+pt(.45,.546)+' Q'+pt(.80,.555)+' '+pt(.61,.609)+' T'+pt(.61,.675)+' Q'+pt(.84,.742)+' '+pt(.57,.82)+' L'+pt(.40,1)+' L'+pt(1,1)+' L'+pt(1,.69)+' Q'+pt(.89,.625)+' '+pt(.714,.624)+' Q'+pt(.61,.608)+' '+pt(.72,.58)+' Q'+pt(.77,.55)+' '+pt(.49,.545)+'Z','#c6d4c8');
    s+=poly('M0 '+f(h*.56)+' Q'+pt(.14,.53)+' '+pt(.30,.64)+' Q'+pt(.42,.68)+' '+pt(.54,.70)+' Q'+pt(.48,.75)+' '+pt(.32,.73)+' Q'+pt(.44,.77)+' '+pt(.60,.775)+' Q'+pt(.60,.815)+' '+pt(.39,.83)+' L'+pt(.18,1)+' H0Z','#c4c7a7');
    s+=poly('M0 '+f(h*.75)+' Q'+pt(.12,.65)+' '+pt(.29,.72)+' Q'+pt(.40,.79)+' '+pt(.54,.79)+' Q'+pt(.61,.81)+' '+pt(.61,.84)+' Q'+pt(.46,.87)+' '+pt(.42,1)+' H0Z','#a3ae8f');
    s+=poly('M'+pt(.70,1)+' Q'+pt(.75,.86)+' '+pt(.85,.81)+' Q'+pt(.96,.76)+' '+pt(1,.742)+' L'+pt(1,1)+'Z','#99a88d');
    for(let i=0;i<75;i++) {
      const x=.67+r()*.32, y=.68+r()*(.18-(x-.67)*.35);
      s+=path('M'+pt(x,y)+' q7 -1 '+f(5+r()*17)+' 0','none',i%3?'#dfe4d4':'#aebfb1',.6+r()*.65);
    }
    // Near firs and birches frame the viewing slit.
    for(const [x,y,ht,wd,col] of [[.046,.60,.56,.07,'#7d9585'],[.104,.59,.35,.048,'#859c8a'],[.94,.59,.46,.055,'#819887'],[.992,.56,.60,.07,'#6d8978']])
      s+=pine(w*x,h*y,h*ht,w*wd,col,r);
    function birch(x,delta,wide,light) {
      const at=t=>x*w+delta*w*t;
      let a=path('M'+f(at(0)-wide)+' -3 Q'+f(at(.5)-wide*.65)+' '+f(h*.45)+' '+f(at(1)-wide*1.1)+' '+f(h)+' L'+f(at(1)+wide*.86)+' '+f(h)+' Q'+f(at(.5)+wide*.55)+' '+f(h*.58)+' '+f(at(0)+wide*.6)+' -3Z',light,'#697462',1.5);
      for(let j=0;j<38;j++){
        const t=r(),side=j%3===0?1:-1,px=at(t)+side*wide*.76;
        a+=path('M'+f(px)+' '+f(h*t)+' q'+f(-side*wide*.41)+' -1 '+f(-side*wide*(.3+r()*1.05))+' '+f(r()*2-2),'none',j%4?'#7c8270':'#5b6658',.65+r()*1.65);
      }
      return a;
    }
    // Birch leaves on arching twigs make a dark lip above the pale opening.
    function leafTwig(x,y,k,angle,col) {
      let a=path('M0 0 Q20 -5 42 -21','none','#67745f',1.45);
      for(let j=0;j<7;j++){
        const tx=5+j*4.9, ty=-j*1.8-j*j*.18, side=j%2?1:-1;
        a+=group(path('M0 0 Q2 -6 11 -7 L9 -3 10 -3 Q5 1 0 0Z',col,'#65745f',.55)
          +path('M0 0 8 -5','none','#7a846c',.44),trans(tx,ty)+' rotate('+(side>0?-39:61)+')');
      }
      return place(a,x,y,k,angle);
    }
    s+=bough('M'+pt(.163,.128)+' Q'+pt(.21,.08)+' '+pt(.254,.073)+' T'+pt(.37,-.014),3.4);
    s+=bough('M'+pt(.845,.163)+' Q'+pt(.78,.09)+' '+pt(.71,.058)+' T'+pt(.65,-.016),3.8);
    for(const [x,y,k,rot] of [[.215,.091,.72,-25],[.244,.078,.88,15],[.28,.06,.79,-30],[.30,.046,1,4],[.33,.020,.85,38],[.845,.163,.83,-60],[.806,.119,.97,175],[.775,.092,.85,154],[.734,.065,1.02,162],[.698,.043,.8,184],[.665,.001,.87,130]])
      s+=leafTwig(x*w,y*h,k,rot,'#91a183');
    const perch=(i)=>F.anchor(i,{w,h});
    const b0=perch(0), b1=perch(1), b5=perch(5);
    s+=birch(.171,-.043,11,'#dad8c1')+birch(.84,.045,13,'#d6d2b9');
    function bough(d,weight) {return path(d,'none','#626c58',weight)+path(d,'none','#9c9a7e',weight*.51);}
    s+=bough('M'+pt(.14,.694)+' Q'+pt(.21,.565)+' '+f(b0.x+3)+' '+f(b0.y+15)+' q19 -4 32 -13',5.2);
    s+=bough('M'+pt(.25,.60)+' q2 -11 -7 -20 m6 13 6 -11',1.6);
    s+=bough('M'+pt(.864,.634)+' Q'+pt(.78,.555)+' '+f(b1.x-6)+' '+f(b1.y+15)+' l-20 -5',4);
    s+=bough('M'+pt(.16,.162)+' Q'+pt(.28,.229)+' '+pt(.39,.284)+' T'+f(b5.x+2)+' '+f(b5.y+13)+' q12 -3 20 -8',3.3);
    s+=bough('M'+pt(.34,.26)+' l13 -9 8 -15 m-7 15 13 -4',1.5);
    // A washed stone gives the wagtail a visible perch at the river's edge.
    s+=path('M'+pt(.48,.825)+' Q'+pt(.49,.80)+' '+pt(.515,.81)+' Q'+pt(.54,.789)+' '+pt(.57,.81)+' L'+pt(.61,.837)+' Q'+pt(.55,.852)+' '+pt(.48,.825)+'Z','#b4b3a0','#858d78',1);
    for(let i=0;i<95;i++) {
      const x=r(), y=.86+r()*.15;
      if(x>.41 && x<.78)continue;
      s+=path('M'+pt(x,y)+' q-2 -7 -5 -9 m5 9 q1 -8 4 -12','none',i%3?'#87997d':'#a8b196',.85);
    }
    for(const [x,y,k,angle] of [[.23,.57,.46,-50],[.30,.53,.45,-34],[.75,.53,.53,19],[.34,.268,.53,-38],[.49,.355,.42,28],[.88,.28,.75,35]])
      s+=sprig(x*w,y*h,k,angle,'#85947a');
    // Shoreline hatching and the dry gravel along the inlet.
    s+=path('M'+pt(.315,.734)+' Q'+pt(.429,.788)+' '+pt(.53,.782)+' M'+pt(.61,.842)+' Q'+pt(.53,.854)+' '+pt(.497,.883)+' M'+pt(.83,.816)+' Q'+pt(.939,.779)+' '+pt(.99,.752),'none','#879782',1.05);
    for(let j=0;j<30;j++){
      const x=.07+r()*.39, y=.648+Math.pow(x-.19,2)*.66+r()*.061;
      s+=path('M'+pt(x,y)+' q2 -1 '+f(2+r()*5)+' -.8','none',j%3?'#a2aa8e':'#929c82',.8);
    }
    for(const [x,y,sz] of [[.483,.813,4],[.59,.855,4],[.607,.85,2.2],[.575,.865,2],[.787,.821,4],[.804,.818,2.5],[.687,.639,2.4]]){
      s+=place(path('M-3 0 Q-2 -3 1 -2 l3 2 q-3 1-7 0Z','#c1c1ae','#8e9a86',.55),w*x,h*y,sz*.46);
    }
    for(const [x,y,k,rot] of [[.225,.589,.57,-65],[.272,.556,.63,-19],[.327,.56,.58,-18],[.733,.525,.64,155],[.804,.584,.74,-163],[.383,.28,.57,39],[.437,.322,.57,3],[.496,.365,.51,6]])
      s+=leafTwig(x*w,y*h,k,rot,'#8b9d7e');
    // Inked foliage at the edge of the hide.
    for(const [x,y,k,ang] of [[.005,1.02,2.9,23],[.044,1.015,2.2,-9],[.075,1.038,2.55,32],[.131,1.015,1.3,26],[.935,1.034,1.95,-28],[.983,1.03,2.85,-23],[1.01,.932,1.55,-53]])
      s+=sprig(x*w,y*h,k,ang,'#637f6c');
    s+=path('M'+pt(0,.08)+' Q'+pt(.063,.035)+' '+pt(.094,0)+' M'+pt(.927,0)+' Q'+pt(.956,.058)+' '+pt(1,.06),'none','#687b67',3);
    return s;
  }
  function foreground(index,view) {
    const cluster=F.leaves(index,view), d=F.birds[index].face, a=F.anchor(index,view);
    let s=path('M'+f(a.x-85*d)+' '+f(a.y+11)+' q'+f(20*d)+' -13 '+f(46*d)+' -13','none','#67735f',1.6);
    for(const l of cluster) {
      const detail=ellipse(0,0,l.rx,l.ry,'#8e9e7f','#687861',.85)
        +path('M'+f(-l.rx*.94)+' 2 Q0 -2 '+f(l.rx*.94)+' 0 M-6 1 l-1 -4 m6 3.5 3 -5 m0 5 5 3 m-15 -2 -1 2','none','#6d8066',.72);
      s+=place(detail,l.x,l.y,1,l.angle*180/Math.PI);
    }
    return s;
  }
  function sign(index,view,time) {
    const a=F.anchor(index,view), t=time*3.5, cue=F.birds[index].cue;
    let s='';
    if(cue==='rustle') {
      s=sprig(-9,9,.74,Math.sin(t*2)*12+25,'#6b8160')+path('M-22 -12 q-4 4 -3 9 m-2 -12 q-5 7 -4 13 M10 -14 q4 3 5 8','none','#716647',1.9);
    } else if(cue==='leaves') {
      for(let i=0;i<3;i++) s+=place(path('M-5 0 Q-1 -7 6 -4 Q5 2 -5 0Z','#bd9269','#876f52',.85),Math.sin(t+i*2)*8+i*6,((time*17+i*10)%33)-23,1,Math.sin(t+i)*24);
    } else {
      for(let i=0;i<3;i++) s+=place(path('M0 4 v-7 m0 4 -4 -3 m4 3 4 -3','none',i>time*1.9?'#8f967c':'#535f4d',1.7),i*9-16,6-i*3,1,26);
    }
    return group(s,trans(a.x,a.y));
  }
  const api={bird,liveBird,scene,foreground,sign};
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.WoodlandArt=api;
})(globalThis);

