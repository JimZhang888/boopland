/* The scroll is drawn in three print-like layers: river paper, architecture, and movable objects. */
const GusuDrawing = (() => {
  const W=2040, H=790, ink='#50584f', wood='#94755b', tile='#64706b';
  const num=n=>+n.toFixed(1);
  const pts=a=>a.map(p=>p.map(num).join(',')).join(' ');
  const poly=(a,fill,stroke=ink,sw=1.3)=>`<polygon points="${pts(a)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const path=(d,fill='none',stroke=ink,w=1.3,extra='')=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  const line=(x,y,X,Y,col=ink,w=1)=>path('M'+num(x)+' '+num(y)+'L'+num(X)+' '+num(Y),'none',col,w);
  const ellipse=(x,y,rx,ry,fill,stroke='none',w=1)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
  const group=(x,y,svg,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${svg}</g>`;
  function random(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
  const times=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
  const river=[[0,295],[205,347],[405,395],[608,371],[820,303],[979,292],[1150,331],[1350,365],[1540,335],[1740,277],[1920,253],[2040,275]];
  function bank(x,south=false){
    const i=river.findIndex((p,j)=>j && p[0]>=x), a=river[Math.max(0,(i<0?river.length-1:i)-1)], b=river[i<0?river.length-1:i];
    const t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
    return a[1]+(b[1]-a[1])*t+(south?204+18*Math.sin(x/210):0);
  }
  const ridge=(offset,south=false)=>Array.from({length:54},(_,i)=>{let x=i*W/53;return [x,bank(x,south)+offset]});
  const shape=(a,b,fill,stroke='none')=>poly([...a,...[...b].reverse()],fill,stroke);
  const glyphs={
    cat:path('M-15 8Q-21 5-19-2Q-18-5-16-3Q-17 5-11 4Q-12-1-6-5L-6-12-1-9Q3-11 6-9L11-12 11-4Q15 0 10 4Q8 6 5 7L8 10H-11Z','#c79563')+path('M-7-4Q-4-5-2-2M-3-8l2 2m3-3 1 2m4-1-1 2M-11 7l2-4m9 5 3-4','none','#72583e',1)+ellipse(1,-3,.8,.8,ink)+ellipse(7,-3,.8,.8,ink)+path('m3 0 2 0-1 1Z','#73594c')+path('m9 0 6-1m-18 1-6-1','none','#5f6054',.8),
    fan:path('M-16-2Q-12-13 0-14Q12-13 16-4L1 10Z','#d9bc8c')+times(6,i=>line(1,10,-13+i*5.1,-3-8*Math.sin(i*Math.PI/5),'#84745f',.9))+path('M-11-4q5-6 10-3l3-4 7 4','none','#b27761',1.4)+ellipse(1,9,1.7,1.7,ink),
    pin:path('m-14 10 20-20 2 2-19 20Z','#b29b65')+path('M5-6Q0-17 8-14Q14-20 15-12Q20-9 12-6Q13-1 8-3Z','#82a493')+ellipse(9,-9,2.3,2.3,'#e2ce95')+path('M12-5q-1 8 3 7m-2-9q2 4 4 4','none','#86765c',1),
    cup:ellipse(0,8,15,3,'#c5cebc',ink)+path('M-11-6L-9 4Q0 12 9 4L12-6Z','#eeebd7')+ellipse(.5,-6,11.5,3,'#a78865',ink)+path('m-8 0 3-2 4 4 4-3 4 2m-14 3q6 5 13 1','none','#648388',1.8),
    spool:path('M-8-8L6-11 10 9-4 12Z','#ae6654')+path('m-11-8 18-5 2 4-18 5Zm5 19 18-5 2 3-17 5Z','#ad926e')+times(4,i=>line(-7+i*.65,-3+i*3,7+i*.55,-7+i*3,'#df9e7d',1))+path('M7 7q8 7 13 1','none','#a4574a',1.3),
    swallow:path('m-17-9 12 4 7 7 14-10-7 12-7 3-7-2-7 5 3-8Z','#d6ced2')+path('m-16-8 15 12 15-11M-3 4l-6 5','none','#7d7381',1),
    lotus:path('M-15 3Q-5 1 1 8Q10-2 16 1Q12 11 1 12Q-10 11-15 3Z','#9da786')+path('M-11-4Q-4-5 0 5Q-4-4 1-13Q7-7 6 1Q9-7 14-7Q15 4 4 7Q-7 8-11-4Z','#cb967f')+ellipse(1,-1,3,3,'#e8cd8e'),
    letter:path('M-15 1Q-6-9 4-7L10-3 16-6 13 1 16 7 8 3Q-5 12-15 1Z','#d9b777')+path('m-6-5 5 6 6-5m-10 7 3-1m2 0 3-1','none','#9f805b',.9)+ellipse(-8,-1,1.4,1.4,ink)
  };
  const use=(id,x=0,y=0,s=1)=>group(x,y,`<use href="#art-${id}"/>`,s);
  function defs(){
    return '<defs>'+Object.entries(glyphs).map(([id,art])=>`<g id="art-${id}">${art}</g>`).join('')+
      '<pattern id="fiber" width="89" height="69" patternUnits="userSpaceOnUse">'+times(95,i=>{const r=random(374+i*571);const x=r()*89,y=r()*69;return line(x,y,x+r()*2.4,y-.55,'#676854',.55)})+'</pattern>'+
      '<pattern id="plaster" width="24" height="21" patternUnits="userSpaceOnUse"><path d="m2 8 4 1m12 7h3m-10-14 3 1" stroke="#bcbba8" stroke-width=".9" fill="none"/></pattern></defs>';
  }
  function house(x,y,w,d,h,opts={}){
    const {roof=tile,wall='#eeeada',side='#d6d4bf',high=29,style=0,scale=1,reverse=false}=opts;
    // Front eave follows the street, the second ground axis runs away from the viewer.
    const p=(u,v,z=0)=>[u+v*.72,u*.27-v*.58-z];
    const f=(a,c,st=ink,sw=1.35)=>poly(a.map(q=>p(...q)),c,st,sw);
    const l=(a,b,c=ink,sw=1)=>line(...p(...a),...p(...b),c,sw);
    let s=f([[-3,0],[w+5,0],[w+d*.26+9,d*.78],[-3,d*.8]],'#aaae972e','none');
    s+=f([[0,0],[w,0],[w,0,h],[0,0,h]],wall)+f([[w,0],[w,d],[w,d,h],[w,d/2,h+high],[w,0,h]],side);
    s+=f([[w,0],[w,d],[w,d,h],[w,0,h]],'url(#plaster)','none');
    s+=f([[0,0,h-2],[w,0,h-2],[w,0,h-8],[0,0,h-6]],'#c8c8b5','none');
    s+=f([[0,0,1],[w,0,1],[w,0,7],[0,0,7]],'#b0b3a0','none')+l([0,0,7],[w,0,7],'#a7a893',.8);
    const count=Math.max(2,Math.floor(w/37));
    for(let i=0;i<count;i++){
      const u=(i+.5)*w/count,ww=Math.min(24,w/count-8),door=(i===0 && style%2===0),bottom=door?2:14,top=door?h-9:h-13;
      s+=f([[u-ww/2,0,bottom],[u+ww/2,0,bottom],[u+ww/2,0,top],[u-ww/2,0,top]],door?'#827562':'#79857c');
      for(let j=1;j<=3;j++)s+=l([u-ww/2+ww*j/4,0,bottom+1],[u-ww/2+ww*j/4,0,top-2],'#d1c4a8',1);
      if(!door) for(let j=1;j<3;j++)s+=l([u-ww/2,0,bottom+(top-bottom)*j/3],[u+ww/2,0,bottom+(top-bottom)*j/3],'#d6c6a6',1);
      s+=l([u-ww/2-2,0,bottom],[u+ww/2+2,0,bottom],'#645e50',2);
    }
    if(style===2){s+=f([[0,-3,h*.47],[w,-3,h*.47],[w,-12,h*.42],[0,-12,h*.42]],'#727b6e');}
    const start=-7,end=w+8,far=d+7,near=-9,mid=d/2;
    s+=f([[start,mid,h+high],[end,mid,h+high],[end,far,h+3],[start,far,h+3]],'#92998b');
    s+=f([[start,near,h-1],[end,near,h-1],[end,mid,h+high],[start,mid,h+high]],roof);
    s+=f([[start+4,near,h],[start+w*.29,near,h],[start+w*.49,mid,h+high],[start+w*.18,mid,h+high]],'#b4b79b35','none');
    const seed=random(Math.round(x+y+5500));
    for(let u=start+3;u<end;u+=5.5+seed()*2){
      const ridgePoint=p(u,mid,h+high-.8),eave=p(u,near,h);
      s+=path(`M${pts([ridgePoint])}Q${num((ridgePoint[0]+eave[0])/2)} ${num((ridgePoint[1]+eave[1])/2+3)} ${pts([eave])}`,'none',seed()>.28?'#b4b8a5':'#424f4a',.75+seed()*.45);
    }
    for(let j=1;j<4;j++){let v=near+(mid-near)*j/4,z=h-1+(high+1)*j/4;s+=l([start,v,z],[end,v,z],'#525d55',.65)}
    s+=l([start-2,mid,h+high+1],[end+2,mid,h+high+1],'#4b5650',3.2)+l([start,near,h-2],[end+1,near,h-2],'#424f49',2.8);
    s+=l([start-4,mid,h+high+4],[start+3,mid,h+high],'#4c5750',2)+l([end-2,mid,h+high],[end+5,mid,h+high+4],'#4c5750',2);
    if(style===1||style===3){
      const u=w+1;
      const ends=[[u,0,h-1],[u,0,h+7],[u,d*.2,h+10],[u,d*.2,h+20],[u,d*.4,h+22],[u,d*.4,h+high+7],[u,d*.65,h+high+7],[u,d*.65,h+19],[u,d*.83,h+18],[u,d*.83,h+9],[u,d,h+7],[u,d,h-2]];
      s+=f(ends,wall);for(let k=1;k<ends.length-1;k+=2)s+=l(ends[k],ends[k+1],'#52605a',2.4);
      s+=f([[u,d*.36,h*.35],[u,d*.63,h*.35],[u,d*.63,h*.63],[u,d*.36,h*.63]],'#879184');
    }
    return group(x,y,(reverse?'<g transform="scale(-1 1)">':'')+s+(reverse?'</g>':''),scale);
  }
  function stoneWall(x,y,w){
    let s=poly([[0,0],[w,w*.15],[w,w*.15-24],[0,-22]],'#e1dfcc')+poly([[-4,-22],[w+2,w*.15-25],[w+8,w*.15-29],[1,-27]],'#717b70');
    s+=times(Math.floor(w/24),i=>line(i*23, i*23*.15-23,i*23+4,i*23*.15-27,'#aeb6a4',1));return group(x,y,s);
  }
  function tree(x,y,sc=1,type=0){
    const r=random(Math.floor(13893+x*2+y));
    let s=ellipse(6,3,32,8,'#7f92752e')+path('M-6 3Q-1-22-7-51L-15-70-5-62 2-46 12-68 16-69 6-43Q4-15 7 1Z','#877e62')+path('m0 1 1-38-8-20','none','#b2a78a',1.5);
    const colors=type?['#8a9272','#9da383','#a8ad8b','#b3b694']:['#839481','#94a58e','#9dac92','#afbb9e'];
    for(let i=0;i<20;i++){const a=r()*Math.PI*2, d=Math.sqrt(r());const cx=Math.cos(a)*32*d,cy=-72+Math.sin(a)*22*d,rx=11+r()*13,ry=8+r()*9;
      s+=path(`M${cx-rx} ${cy+1}q-3 ${-ry*.8} ${rx*.65} ${-ry}q${rx*.6} ${-ry*.65} ${rx} 1q${rx*.8} 2 ${rx*.35} ${ry}q${-rx*.45} ${ry*.65} ${-rx} ${ry*.4}q${-rx*.8} 4 ${-rx} ${-ry*.4}Z`,colors[i%4],'#788870',.65)}
    return group(x,y,s,sc);
  }
  function willow(x,y,sc=1){
    let s=ellipse(4,1,34,7,'#89937b33')+path('M-12 2Q-2-26-7-48Q-12-76-37-91L-33-96Q-13-85-2-72L-8-101-2-104 7-76Q20-107 45-107L47-103Q23-97 12-67Q3-34 9 3Z','#918770')+path('M-6 0Q2-34-5-57m7 11q1-28 21-46','none','#625f4f',1.6);
    const r=random(901);for(let i=0;i<13;i++){const a=i/12*Math.PI,xx=-55+i*9,yy=-86-22*Math.sin(a);s+=ellipse(xx,yy,16,10,i%3?'#a3ad87':'#aeb695','#8e9c79',.65)}
    for(let i=0;i<58;i++){let xx=-62+i*2.2,yy=-84-28*Math.sin(i/58*Math.PI)+r()*7,len=15+r()*34;
      s+=path(`M${xx} ${yy}q-8 9 -3 ${len*.55}q2 9 -4 ${len*.45}`,'none',i%4===0?'#798e6b':'#9ba981',1.3);
      for(let j=0;j<3;j++){let a=xx-4+r()*5,b=yy+len*(.18+j*.21);s+=path(`M${a} ${b}q-7 1-5 8q6-4 5-8Z`,i%3?'#91a178':'#aab58a','none')}
    }return group(x,y,s,sc);
  }
  function lantern(x,y,s=1){
    return group(x,y,line(0,-17,0,-7)+ellipse(0,0,7,9,'#c48772')+path('M-4-9h8M-4 8h8m-4 0v7m-2-4v4m4-4v4','none','#806b55',1.3)+path('M0-7q-3 7 0 14','none','#dfac8e',1),s);
  }
  function steps(x,y,w=62){
    let s='';for(let i=0;i<5;i++){const dx=-4*i,dy=i*4;s+=poly([[dx,dy],[dx+w,dy+8],[dx+w-5,dy+13],[dx-5,dy+5]],i%2?'#bcbdab':'#d0cfbc');}return group(x,y,s);
  }
  function boat(x,y,sc=1,open=false,found=false,hasCat=false){
    let s=ellipse(-2,9,76,10,'#668b7c55')+path('M-85-6Q-70-2-54-5L54-15Q75-15 86-27Q83-8 63 0Q12 17-51 14Q-78 11-85-6Z','#796f5b')+
    path('M-85-6Q-47-13 57-21L86-27Q72-9 46-6L-49 6Q-72 5-85-6Z','#c0aa84')+path('M-72 2Q-35 10 63-9m-130 17q43 6 112-8','none','#544f43',1.3);
    s+=path('M-45 1Q-45-32-22-37L28-42Q44-42 53-19L50-11Z','#66736a')+
    times(8,i=>path(`M${-41+i*10} ${-1-i*1.2}q-1-19 15-35`,'none',i%2?'#a5aa93':'#576259',1.3))+
    path('M15-8Q15-30 29-39Q44-44 53-16L52-11Z','#525951');
    s+=open?path('M19-25Q21-40 32-40Q47-39 49-29Q34-31 19-25Z','#b39471'):path('M17-8Q17-29 29-39Q45-41 51-15L49-12Z','#ac8e70')+path('M24-12q0-13 7-22m1 20 4-18m6 16-1-15','none','#d1b492',1.4);
    if(open&&hasCat)s+=use('cat',found?64:34,found?-20:-15,found?.80:.74);
    if(found)s+=path('M75 6q12 4 22 0m-13 8q11 2 18-2','none','#f2ebd6',2);
    s+=line(-62,0,-98,21,'#716752',2.4)+path('m-98 19-13 6q-3 5 3 4l13-8Z','#998b6d');
    return group(x,y,s,sc);
  }
  function bridge(){
    const point=(t,side,z=0)=>[409+328*t+side*59,584-265*t+side*21-z];
    const along=(side,start,end,height,steps=30)=>Array.from({length:steps+1},(_,i)=>{const t=start+(end-start)*i/steps;return point(t,side,height(t))});
    const crown=t=>68*Math.sin(t*Math.PI);
    const arch=t=>t<=.24||t>=.76?0:61*Math.sqrt(Math.max(0,1-((t-.5)/.26)**2));
    const top=t=>crown(t)+26;
    let s='';
    s+=poly([...along(.1,0,1,()=>-4),...along(1.1,1,0,()=>-4)],'#879e8d55','none');
    // The underside is visible through the opening, especially at its eastern lip.
    s+=poly([...along(1,.24,.76,arch),...along(.50,.76,.24,arch)],'#889381');
    s+=poly([...along(1,0,1,top),...along(1,1,0,arch)],'#c6c5b0');
    const a=along(1,.24,.76,arch),b=along(1,.24,.76,t=>arch(t)+11);
    s+=poly([...a,...b.reverse()],'#d9d4bd');
    for(let i=0;i<17;i++){let t=.24+.52*(1-Math.cos(i/16*Math.PI))/2;s+=line(...point(t,1,arch(t)),...point(t,1,arch(t)+11),'#8b907f',1.1)}
    for(let i=0;i<48;i++){
      let t=(i+.25)/48;let z=arch(t)+15+(i%3)*7;if(z<top(t)-4)s+=line(...point(t,1,z),...point(Math.min(1,t+.035),1,z+1),'#9da18e',.9);
    }
    // Stepped stone deck between two low parapets.
    const deck=t=>crown(t)+24;
    s+=poly([...along(0,0,1,deck),...along(1,1,0,deck)],'#dad6c1');
    for(let i=0;i<32;i++){let t=i/31;s+=line(...point(t,0,deck(t)),...point(t,1,deck(t)),'#9da18e',1)}
    // The steps carry both ends of the raised stonework down onto the quays.
    for(const end of [0,1]){
      const direction=end===0?-1:1;
      for(let i=0;i<6;i++){
        const t=end+direction*i*.014,next=t+direction*.014,z=24-i*4;
        s+=poly([point(t,0,z),point(t,1,z),point(next,1,z),point(next,0,z)],'#d9d5c0');
        s+=poly([point(next,0,z),point(next,1,z),point(next,1,z-4),point(next,0,z-4)],'#bdbfac');
      }
    }
    for(const d of [0,1]){
      s+=poly([...along(d,0,1,t=>deck(t)+9),...along(d,1,0,deck)],'#d5d1ba');
      for(let i=0;i<9;i++){let t=i/8,[x,y]=point(t,d,deck(t)+9);
        s+=poly([[x-2,y+2],[x+3,y+3],[x+4,y-11],[x-2,y-12]],'#e1dcc7')+ellipse(x+.8,y-13,4,2.9,'#babda8',ink,1);}
      const rail=along(d,0,1,t=>deck(t)+17);
      s+='<polyline points="'+pts(rail)+'" fill="none" stroke="#707b6b" stroke-width="3"/><polyline points="'+pts(rail)+'" fill="none" stroke="#dcd8c1" stroke-width="1.4"/>';
    }
    return s;
  }
  function landAndWater(){
    let s='<rect width="2040" height="790" fill="#d9ddc8"/>';const r=random(4375);
    s+=times(180,i=>{const x=r()*W,y=r()*H;return path(`M${x} ${y}q13-8 32-6l22 8-20 6Z`,i%2?'#d2d7be':'#e1dfc9','none')});
    s+=shape(ridge(-71),ridge(0),'#e1dcca')+shape(ridge(0),ridge(0,true),'#abc7b8')+shape(ridge(0,true),ridge(67,true),'#e1ddc9');
    // Broad ink washes, broken into short marks where the tiled roofs meet their reflections.
    for(let j=0;j<35;j++){
      const x=j*64-27,y=bank(x)+13,l=32+r()*60;
      s+=path('M'+x+' '+y+'q19 4 '+l+' 0l-4 4 8 1-13 3 10 1-21 2-3 4-12-1 4-3-17-1 6-3-16-1Z','#829c8b3d','none');
    }
    for(let i=0;i<650;i++){
      let x=r()*W,y=bank(x)+3+r()*(bank(x,true)-bank(x)-8);
      const len=3+r()*33; s+=path(`M${num(x)} ${num(y)}q${num(len*.3)} 1 ${num(len*.6)} 0t${num(len*.5)} -.6`,'none',['#bed0ba','#9eb8a9','#cedac6','#89aa9c'][i%4],.6+r()*1.2);
    }
    for(const isSouth of [false,true]){
      const edge=ridge(0,isSouth);s+=shape(edge,ridge(isSouth?6:11,isSouth),isSouth?'#a6ad97':'#98a590',ink);
      s+=shape(ridge(-4,isSouth),edge,'#d5d3bd',ink);
      for(let x=0;x<W;x+=14+r()*11)s+=line(x,bank(x,isSouth)+1,x-2,bank(x,isSouth)+(isSouth?6:10),'#707f70',.8);
      for(let j=0;j<190;j++){const x=r()*W,y=bank(x,isSouth)+(isSouth?1:-1)*(10+r()*45);s+=line(x,y,x+4+r()*11,y+1.1,'#b2b49f',.8)}
    }
    for(let i=0;i<23;i++){let x=i*96-64;s+=tree(x,45+Math.sin(i*1.8)*24,1.15,i%3===0?1:0)}
    return s;
  }
  function northTown(){
    let s='';const r=random(842);
    for(let i=0;i<17;i++){
      const x=i*137-155,y=bank(x)-175-r()*35;
      const turned=i%4===2;
      s+=house(x+(turned?116:0),y,78+r()*47,54+r()*29,32+r()*19,{reverse:turned,style:i%4,roof:['#8d988a','#7b8981','#828b81'][i%3],high:25});
      if(i%2===0)s+=tree(x+93,y+38,.85,1);
    }
    for(let i=0;i<17;i++){
      const x=i*143-118,y=bank(x)-76-r()*24;
      s+=house(x,y,78+r()*38,54+r()*19,39+r()*20,{style:(i+1)%4,roof:['#596961','#747e72','#596b66','#7d8273'][i%4],high:24+r()*18});
      if(i%4===2)s+=stoneWall(x+96,y+25,45);
      if(i%3===1)s+=lantern(x+12,y-23,.79);
    }
    s+=house(423,283,91,62,74,{style:2,roof:'#515f5b',high:36})+lantern(449,249,.9)+lantern(504,263,.85);
    s+=house(934,216,96,57,49,{style:2,roof:'#5b6966'})+house(1491,239,90,68,62,{style:1});
    s+=steps(120,bank(120)-4,65)+steps(1035,bank(1035)-6,68)+steps(1774,bank(1774)-2,64);
    s+=stoneWall(40,251,77)+tree(219,bank(219)-41,.92,1)+tree(849,bank(849)-44,.85)+tree(1385,bank(1385)-55,.95,1);
    return s;
  }
  function foreground(){
    let s=steps(1195,bank(1195,true)+13,59);
    for(let i=0;i<14;i++){
      const x=-145+i*164, y=bank(x,true)+156+(i%3)*23;
      if(i%4===1)s+=tree(x+8,y-66,.88,1);
      if(i%5!==3)s+=house(x,y,94+i%3*13,62+i%4*3,40+i%3*7,{style:(i+2)%4,roof:['#69776d','#768276','#64716c'][i%3],high:28});
      else s+=stoneWall(x,y-42,100)+tree(x+80,y-52,1.04);
    }
    s+=willow(42,bank(42,true)+44,1.07)+willow(1124,bank(1124,true)+40,1.08)+willow(1694,bank(1694,true)+43,.98);
    return s;
  }
  function parasol(open){
    let s=poly([[-24,14],[19,21],[31,15],[-11,8]],'#987c60')+line(-19,15,-19,24)+line(18,20,18,27)+line(0,20,0,-20,wood,3);
    s+=group(open?-22:0,open?-12:0,open?'<g transform="rotate(-30)">'+canopy()+'</g>':canopy());
    function canopy(){return path('M-36 0Q-22-18-1-27Q18-22 36 2L27 8 15 6 5 11-5 7-18 8-24 3Z','#c49379')+times(6,i=>line(-1,-26,-33+i*13,1+7*Math.sin(i/5*Math.PI),'#986f59',1))+ellipse(-1,-27,2,2,ink)}
    return group(331,326,s);
  }
  function bell(rung){
    return group(754,304,path('M-17 19v-45l28-6 1 5-24 5v40Z','#89785d')+
    path('m-17-24 4 1 1 35m0-30 13-9','none','#b8a887',1.4)+group(0,0,rung?'<g transform="rotate(-13 3 -23)">'+bellArt()+'</g>':bellArt()));
    function bellArt(){return path('m3-23 0 9', 'none',ink,1.6)+path('M-7 2Q-2-2-3-8Q-2-15 3-16Q10-16 11-7Q11-1 16 1L15 4-7 5Z','#bdab77')+ellipse(4,4,11,2,'#938762',ink,1)+path('M4 5v8l-2 4m2-5 3 4','none','#ae6450',2)}
  }
  function tea(open){
    let s=poly([[-35,2],[13,13],[36,0],[-14,-11]],'#b49a76')+poly([[-35,2],[13,13],[13,24],[-35,13]],'#998263')+poly([[13,13],[36,0],[35,12],[13,24]],'#847659')+line(-28,14,-28,27,ink,3)+line(10,23,10,31,ink,3);
    s+=group(open?24:0,open?-7:0,path('M-16 2Q-16-13-2-17Q12-19 17-2Q7 7-16 2Z','#b59c6e')+path('M-13-4q14 4 28-1m-25-5q10 2 21-1m-16-2-3 13m9-14 3 13','none','#8d7f5b',1)+ellipse(-1,-17,3,2,'#887d5f'));
    return group(1022,262,s);
  }
  function cloth(open){
    let s=line(-52,18,-52,-34,wood,3)+line(51,23,51,-28,wood,3)+path('M-52-32Q4-18 51-28','none',ink,1.2);
    const start=open?17:-17;
    s+=path(`M${start}-26q15 3 30 1l-3 37q-15 3-30-2Z`,'#8297a0')+path(`M${start+3} 5q10 3 21 0m-18-27-3 24m14-24-3 21`,'none','#b8c6bb',1.5);
    s+=path('M-44-30l20 3-4 27-18-4Z','#c5ad91')+line(-12,14,19,20,wood,3);return group(1282,300,s);
  }
  function windowArt(open){
    let s=path('M-31 17v-47l59 9v49Z','#e6e2d0')+path('m-20 10 1-30 34 6v31Z','#596a60');
    if(!open)s+=path('M-21 12v-34l39 7v34Z','#99866c')+times(5,i=>line(-18+i*8,-18+i*1.35,-18+i*8,11+i*1.35,'#d4c6a9',1.7))+path('m-20-9 37 6m-37 2 37 6','none','#cfbd9d',1.5);
    else s+=path('m-20-21-14-10-1 31 14 12Zm38 6 13-8v29l-13 13Z','#ae997a');
    s+=path('m-34-30 5-6 62 10-5 7Z','#758175');return group(1613,241,s);
  }
  function lotuses(open,found){
    let s='';const pad=(x,y,rx)=>group(x,y,path(`M0 0l${rx} -2a${rx} ${rx*.48} 0 1 1 -2 -2Z`,'#8fa389','#748d78',1)+line(-1,0,-rx*.7,2,'#b6c1a0'));
    [[-33,-2,13],[-14,14,14],[25,11,12],[35,-10,11],[-8,-13,10]].forEach(([x,y,k])=>s+=pad(x,y,k));
    s+=pad(open?-24:0,open?-7:1,16);if(found)s+=use('lotus',-20,12,.62)+use('lotus',31,-11,.54);
    return group(888,478,s);
  }
  function basket(open){
    let s=path('M-26 0Q-7-7 19-5L15 13Q-3 25-20 14Z','#b19a70')+times(6,i=>line(-21+i*7,0,-17+i*6,14,'#85795c',1))+path('M-22 7q19 7 39-3m-36 9q14 6 33-3','none','#d6c094',1);
    s+=group(open?24:-2,open?-12:-2,ellipse(0,0,22,7,'#bba47a',ink,1.5)+times(5,i=>line(-14+i*6,-5,-11+i*6,5,'#908364',1)));
    return group(1830,bank(1830,true)+14,s);
  }
  function reeds(x,y,sc=1){return group(x,y,path('M-10 1q-2-14-8-23Q-8-17-5-3q-1-21 4-30L1-5q4-16 11-21L5-1q8-9 17-11L9 2Z','#93a483','#819077',.8),sc)}
  function birds(x,y,n=3){return times(n,i=>group(x+i*18,y+(i%2)*-9,path('M-6-2Q-2-3 1 2Q4-4 9-4','none','#586961',1.6),.8+i*.12))}
  function dynamic(s){
    const has=id=>s.found.has(id);
    let vessel=boat(s.bell?784:607,s.bell?463:477,1,s.curtain,has('cat'),true);
    if(s.bell)vessel='<g class="boat'+(s.sailing?' sailed':'')+'">'+vessel+'</g>';
    let art=parasol(s.umbrella)+tea(s.tray)+cloth(s.cloth)+windowArt(s.window)+lotuses(s.pads,has('lotus'))+basket(s.basket)+bell(s.bell);
    if(s.umbrella&&!has('fan'))art+=use('fan',335,339,.82);
    if(s.tray&&!has('cup'))art+=use('cup',1017,261,.76);
    if(s.cloth&&!has('spool'))art+=use('spool',1281,308,.78);
    if(s.window&&!has('swallow'))art+=use('swallow',1610,238,.82);
    if(s.pads&&!has('lotus'))art+=use('lotus',890,478,.82);
    if(s.basket&&!has('letter'))art+=use('letter',1827,bank(1830,true)+18,.85);
    if(has('fan'))art+=person(350,355,.76,'#929d82')+group(344,335,'<g transform="rotate(-24)">'+use('fan',0,0,.64)+'</g>');
    if(has('cup'))art+=group(1016,259,path('M-7-3q-6-7 0-14t-1-13m6 24q6-7 3-13','none','#f7f4e6',2.4))+use('cup',1001,257,.56)+use('cup',1009,260,.53);
    if(has('spool'))art+=path('M1245 277q19 25 57 8t30 8','none','#a66a59',2.8)+times(4,i=>group(1254+i*15,283+Math.sin(i)*6,path('m0 0 8 1-4 8Z',i%2?'#ba816a':'#dbb989',ink,.8)));
    if(has('swallow'))art+=use('swallow',1658,196,.98)+birds(1680,187,2);
    if(has('letter'))art+=group(1801,bank(1830,true)-13,use('letter',0,0,.8)+path('M-25 5q8 4 16 2m-27 4q9 4 21 1','none','#e8ebd7',1.7));
    art+=willow(320,609,1.07);
    if(!s.fronds)art+=group(319,553,path('M-14-36q-1 16 7 28q5 8-2 22q14-13 9-27q8 10 5 20q14-17-1-38Z','#a4ae87','#859777',1)+path('M-11-32q6 12 6 25m8-18q9 12 6 24','none','#809470',1));
    if(s.fronds&&!has('pin'))art+=use('pin',320,552,.82);
    if(has('pin'))art+=birds(327,507,3)+ellipse(320,548,3,2,'#dad2a7');
    return {vessel,art};
  }
  function details(){
    let s=boat(83,410,.64)+boat(1408,417,.65,true)+boat(1941,320,.55);
    for(const [x,y,k] of [[210,532,1],[429,585,.8],[858,494,.65],[1340,560,.8],[1740,472,.7]])s+=reeds(x,y,k);
    for(const [x,y] of [[252,358],[371,374],[924,287],[998,285],[1340,353],[1800,256],[600,580],[1220,562]])s+=group(x,y,ellipse(3,1,8,2,'#6b7e613e')+path('m-2 0-1-13 5 1L3 0Z','#907d60')+ellipse(0,-13,3,1.7,'#b8ac89',ink,.8));
    return s;
  }
  function person(x,y,sc,coat,hat=false){
    let s=ellipse(2,0,8,2.4,'#757f6733')+path('m-5-8-1 7-3 1 6 1 3-10m3 0 1 7-1 2 6 1-2-3-1-8','#706f60')+
      path('M-4-27q4-4 8-1l6 10-3 4-3-6 3 13q-6 3-14-1l3-12-5 7-3-2Z',coat)+
      path('m-3-26 5 5 2-6m-6 9-1 9','none','#5f6657',.85)+ellipse(0,-32,4,5,'#c5a888',ink,.8)+
      (hat?path('m-10-33 9-8 11 7q-8 5-20 1Z','#c9af7b'):path('M-5-32q-2-9 6-7 5 1 4 7l-4-4Z','#62665b'));
    return group(x,y,s,sc);
  }
  function planter(x,y,sc=1){
    return group(x,y,path('m-8-8 15 1-3 12-9-1Z','#b58c71')+ellipse(0,-8,9,2.6,'#8b7a5c',ink,.85)+reeds(0,-8,.52));
  }
  function shopfront(x,y,sc=1){
    // A deep timber gallery with a tiled awning and hanging shop board.
    let s=poly([[-12,-1],[67,17],[84,10],[7,-8]],'#c3bca4')+poly([[-12,-1],[67,17],[67,20],[-13,3]],'#a9aa94');
    for(const u of [0,30,62]){
      const v=u*.24;
      s+=path('M'+(u-1)+' '+(v+1)+'v-38l3 .5v38Z','#92775c')+
        path('M'+u+' '+(v-25)+'q5-1 9-9h-9Z','#aa9070');
    }
    s+=poly([[-10,-39],[65,-21],[84,-32],[8,-50]],'#707e70')+poly([[-10,-39],[65,-21],[65,-17],[-10,-35]],'#6a6d5a');
    for(let i=0;i<13;i++)s+=line(-8+i*5.7,-39+i*1.35,8+i*5.7,-49+i*1.35,'#a3ad95',1);
    s+=lantern(3,-26,.68)+lantern(59,-13,.72)+path('m39-24 13 3-1 28-13-3Z','#b7966c')+
       path('m42-15 7 2m-5-4v9m-4 3 8 2m-4-4v9m-4-5 3 2m5-2-3 2','none','#6f6050',1.2);
    return group(x,y,s,sc);
  }
  function dock(x,y,sc=1){
    let s=poly([[-24,-1],[19,4],[7,21],[-35,16]],'#b4a485')+poly([[-35,16],[7,21],[7,25],[-35,20]],'#8e856a');
    for(let i=0;i<7;i++)s+=line(-23+i*6,-1+i*.75,-34+i*6,16+i*.75,'#7f7f67',.9);
    for(const [xx,yy] of [[-34,16],[8,21],[19,3]])s+=path('m'+xx+' '+yy+'v-8l3 .4v17l-3-1Z','#978366');
    return group(x,y,s,sc);
  }
  function everyday(){
    let s=shopfront(443,292,1.02)+shopfront(952,227,.92)+shopfront(1424,258,.88);
    s+=dock(408,bank(408),1.04)+dock(1251,bank(1251),1)+dock(707,bank(707),.86);
    s+=person(405,338,.83,'#a77865')+person(674,328,.77,'#8f9a9a',true)+person(1002,242,.74,'#998577')+person(1353,317,.78,'#849591');
    s+=person(581,580,.85,'#889a91',true)+person(151,289,.67,'#a17c6a');
    for(const [x,y] of [[417,288],[524,301],[920,239],[1066,260],[1456,279],[635,574],[87,248]])s+=planter(x,y,.85);
    // Moored dinghy and its rope, a market banner, and a pair of ducks.
    s+=path('M389 410q-10 13-23 14','none','#8a8067',1)+group(353,428,boat(0,0,.35));
    s+=group(541,296,path('M-2 12v-66l2 0v66Z','#947b5f')+line(-1,-54,18,-50,ink,2)+
      path('m3-53 15 4q-1 15 1 32l-8-5-8 1Z','#be8c76')+path('m6-42 8 2m-7 2 6 2m-4-9v13','none','#dcc5a1',1));
    for(const [x,y,k] of [[661,493,.8],[674,501,.6],[140,467,.65]])s+=group(x,y,
      path('M-11 3q6-7 14-4-1-7 3-8 5-1 5 3l4 2-5 1Q9 5-2 6Z','#dedcc6','#777d66',1)+path('M-17 6q5 2 9 1','none','#e9ead1',1.4),k);
    return s;
  }
  function world(){
    return '<g id="scroll" stroke-linecap="round" stroke-linejoin="round">'+landAndWater()+northTown()+details()+everyday()+'<g id="boat-layer"></g>'+bridge()+foreground()+'<g id="object-layer"></g><rect width="2040" height="790" fill="url(#fiber)" opacity=".36" pointer-events="none"/></g>';
  }
  const icon=id=>`<svg class="mini" viewBox="-23 -18 46 36" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><use href="#art-${id}"/></svg>`;
  return {W,H,defs,world,dynamic,icon,letterY:bank(1830,true)+18};
})();

