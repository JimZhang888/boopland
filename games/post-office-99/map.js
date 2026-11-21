window.PostMap = (() => {
  const {icon,path,circ} = PostArt;
  function positions(level,w,h) {
    const coords = Object.keys(level.nodes).map(id => [id,...PostRoutes.grid(id)]);
    const xs = coords.map(p=>p[1]), ys = coords.map(p=>p[2]);
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const margin=Math.max(43,w*.11);
    const top=Math.max(69,h*(maxY-minY>1?.22:.33));
    const bottom=h*(maxY-minY>1?.85:.80);
    return Object.fromEntries(coords.map(([id,x,y])=>[id,[
      margin+(x-minX)*(w-2*margin)/(maxX-minX), top+(y-minY)*(bottom-top)/(maxY-minY)
    ]]));
  }
  function curve(p,q) {
    const [x,y]=p,[u,v]=q;
    // Travelling back along a street must trace the same bend.
    const bendX=Math.abs(v-y)*.062, bendY=-Math.abs(u-x)*.062;
    return 'M'+x+' '+y+' Q'+((x+u)/2+bendX)+' '+((y+v)/2+bendY)+' '+u+' '+v;
  }
  function land(level, xy, index, w, h) {
    let seed=99+index*27;
    function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
    const fields = [
      ['M0 30Q95-5 165 12t113 28l-53 44-123-5L0 102Z','#dce1c9'],
      ['M395 5q82 9 122-1l123 6v91l-56-18-67 7-64-24Z','#d8dfc6'],
      ['M0 201q51-38 111-19l92 33-12 52-88 24-103-13Z','#e2e3c9'],
      ['M284 115q67-23 138 17l51 38-18 41-95-5-75-24Z','#dfe4d1'],
      ['M413 247q67-26 139-6l88-10v105l-83 19-142-38Z','#dbe1c9'],
      ['M0 323q90-32 181-7l107 44H0Z','#d5ddc4']
    ];
    const fit='<g transform="scale('+w/640+' '+h/360+')">';
    let art=fit+fields.map(([d,c])=>path(d,c)).join('')+'</g>';
    art+='<g fill="none" stroke="#9eae92" stroke-width=".9" opacity=".52">';
    for(let i=0;i<105;i++){
      const x=Math.round(rnd()*w),y=Math.round(rnd()*h);
      art+=path('M'+x+' '+y+'l-2-3m3 4 2-5m2 4 2-2');
    }
    art+='</g>';
    const riverX=level.river?(xy.F[0]+xy.G[0])/2:null;
    if(riverX!==null){
      const d='M'+(riverX+4)+' -15 Q'+(riverX-12)+' '+h*.20+' '+riverX+' '+h*.37+' T'+(riverX+1)+' '+h*.67+' T'+(riverX-4)+' '+(h+18);
      art+=path(d,'none','stroke="#a4b7a6" stroke-width="52"')+path(d,'none','stroke="#bbd0c8" stroke-width="47"');
      art+='<g stroke="#8aa69e" fill="none" opacity=".75">';
      for(let n=0;n<17;n++){
        const x=riverX+(rnd()-.5)*15,y=(n+.5)*h/17;
        art+=path('M'+x+' '+y+'q5-4 9-1t6 0');
      }
      art+='</g>';
    } else {
      art+=fit+path('M494 306q19-13 38-11c11 1 19-8 34-4q20 3 6 13c-13 7-20 5-31 11q-30 14-48 4-8-5 1-13Z','#c4d5c9','stroke="#aabfac"')+path('M508 309q7-3 15-3m8 7 14-5m11-9 9-1','none','stroke="#91a99d"')+'</g>';
    }
    const lots=[];
    function vacant(x,y) {
      if((x>w-69 && y<73) || (x<86 && y>h-34) || (riverX!==null && Math.abs(x-riverX)<45) ||
         (riverX===null && x>w*.74 && y>h*.77 && y<h*.93))return false;
      if(lots.some(([a,b])=>Math.hypot(x-a,y-b)<41))return false;
      if(Object.values(xy).some(([a,b])=>Math.abs(x-a)<55 && y>b-88 && y<b+32))return false;
      return !level.roads.some(({from,to})=>{
        const [a,b]=xy[from],[c,d]=xy[to];
        const ratio=Math.max(0,Math.min(1,((x-a)*(c-a)+(y-b)*(d-b))/((c-a)**2+(d-b)**2)));
        return Math.hypot(x-a-ratio*(c-a),y-b-ratio*(d-b))<34;
      });
    }
    for(let n=0;n<175 && lots.length<24;n++){
      const x=23+Math.round(rnd()*(w-46)),y=23+Math.round(rnd()*(h-46));
      if(!vacant(x,y))continue;
      lots.push([x,y]);
      const trees='<path d="M-12 6q-6-5-1-11-1-7 5-9 5 0 6 7 5 7 0 12Z" fill="#b5c29e"/><path d="M1 8q-6-5-1-12 0-7 6-7 5 1 5 7 5 7-1 11Z" fill="#a6b99b"/><path d="m-8-4 .2 16m14-14v15m-18 1 8-1m6 0 8-1" fill="none"/>';
      const cottage='<path d="M-13-1-4-10 9-8 17 0 5 4Z" fill="#c9b59c"/><path d="m-13-1 18 5 12-4-2 11-12 2-16-5Z" fill="#e2daca"/><path d="m4 4-6-9m8 9-.5 7m-14-8 3 1m2 2 2 1m11-1 3-1" fill="none"/>';
      const field='<path d="m-20 3 20-11 20 7-20 13Z" fill="#d8d7b7"/><path d="m-15 4 18-11m-12 14L9-5M-3 9 15-2" fill="none"/>';
      const pines='<path d="M-10 9-14 9-8-2h-3l7-13 6 13h-3l7 11H-2v5h-4V9Z" fill="#9eae8d"/><path d="M7 10 3 10 8 1H5l6-10 6 11h-3l5 8h-6v4H9v-4Z" fill="#b2bf9e"/><path d="m-8 1 3-2m13 5 2-1m-23 12 13-1" fill="none"/>';
      const fence='<path d="m-14 1 25-8v4l-25 9Zm2-5 2-1v13l-2 1Zm11-3 2-1V5l-2 1Zm11-3 2-1v12l-2 1Z" fill="#d8c8a4"/>';
      const shape=[trees,pines,cottage,field,fence][Math.floor(rnd()*5)];
      art+='<g transform="translate('+x+' '+y+') scale('+(0.78+rnd()*.3)+')" stroke="#88947e" stroke-width="1.15" stroke-linejoin="round" stroke-linecap="round">'+shape+'</g>';
    }
    return art;
  }
  function roadArt(level,xy){
    let art='';
    for(const edge of level.roads){
      const p=xy[edge.from],q=xy[edge.to],d=curve(p,q);
      art+=path(d,'none','stroke="#aaa994" stroke-width="14"')+path(d,'none','stroke="#faf2d9" stroke-width="11"')+path(d,'none','stroke="#c6bea7" stroke-dasharray="2 7" stroke-width="1.5"');
      const [a]=PostRoutes.grid(edge.from),[b]=PostRoutes.grid(edge.to);
      if(level.river && Math.min(a,b)===1 && Math.max(a,b)===2){
        const x=(p[0]+q[0])/2,y=(p[1]+q[1])/2-(q[0]-p[0])*.031;
        art+='<g transform="translate('+x+' '+y+')" stroke="#706d58" fill="#d9c7a4"><path d="M-29-8 29-9 29 9-29 8Z"/><path d="m-24-8 1 16m9-17v17m11-17v17m10-17v17m10-17v17m7-17v16" stroke-width="1"/><path d="M-30-10q25-5 59 0m-59 20q26-4 59 0" fill="none" stroke-width="2.5"/></g>';
        if(edge.closed)art+='<g transform="translate('+x+' '+y+')" stroke-linecap="round"><circle r="13" fill="#fbf3df" stroke="#a56353" stroke-width="2"/><path d="m-6-6 12 12m-12 0L6-6" stroke="#a45e50" stroke-width="3"/></g>';
      }
    }
    return art;
  }
  function build(svg,level,index,t) {
    const frame=svg.parentElement.getBoundingClientRect();
    const w=Math.min(725,Math.max(396,Math.round(frame.width*.9)));
    const h=Math.max(270,Math.min(640,Math.round(w*frame.height/Math.max(1,frame.width))));
    svg.setAttribute('viewBox','0 0 '+w+' '+h);
    const xy=positions(level,w,h);
    const compass='<g transform="translate('+(w-26)+' 31) scale(.8)" stroke="#707962" stroke-linejoin="round"><circle r="18" fill="none" opacity=".5"/><path d="m0-24 5 23-5-3-5 3Z" fill="#60765d"/><path d="m0 16 5-17-5 3-5-3Z" fill="#f5f0de"/><path d="M-14 0h9m10 0h9" fill="none"/></g>';
    svg.innerHTML='<defs><pattern id="mapgrain" width="6" height="6" patternUnits="userSpaceOnUse"><path d="m1 2 1-.4m2 3 1-.5" stroke="#695e42" stroke-width=".55" opacity=".17"/></pattern></defs><rect width="100%" height="100%" fill="#eeeeda"/>'+land(level,xy,index,w,h)+roadArt(level,xy)+'<g class="trail" fill="none" stroke-linecap="round"></g>'+compass+
    '<g transform="translate(14 '+(h-13)+')" stroke="#738169"><path d="M0-3v5h43v-5m-21 0v5" fill="none"/></g><rect width="100%" height="100%" fill="url(#mapgrain)" pointer-events="none"/>';
    for(const [id,kind] of Object.entries(level.nodes)){
      const [x,y]=xy[id];
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('transform','translate('+x+' '+y+')');
      g.setAttribute('class','pin'+(id===level.stop?' destination':''));
      g.setAttribute('role','button');g.setAttribute('tabindex','0');g.dataset.land=kind;
      g.setAttribute('aria-label',t('mark',{name:t(kind)}));
      const pin=kind==='cross'?43:60;
      g.innerHTML='<title></title><rect x="-35" y="-63" width="70" height="77" rx="9" fill="transparent"/>'+
        (id===level.stop?'<ellipse cx="0" cy="-20" rx="38" ry="37" fill="#f4e7c9" stroke="#aa6e5a" stroke-dasharray="3 4" stroke-width="1.8"/>':'')+
        '<ellipse cy="-1" rx="22" ry="5" fill="#8e9a7e" opacity=".2"/>'+icon(kind,-pin/2,-pin+1,pin)+circ(0,3,4.5,'#f8f2dc').replace('/>',' stroke="#616b58" stroke-width="2"/>');
      if(id===level.start)g.innerHTML+=circ(0,3,2,'#51705f');
      if(index===0 && kind==='roof'){
        g.innerHTML+='<g transform="translate(-30 -10) rotate(-24)" fill="#9c7462" opacity=".85"><path d="M0 0q3-6 6 0t-6 0Zm-7 7q2-5 5 0t-5 0Z"/><circle cx="-1" cy="-4" r="1"/><circle cx="2" cy="-6" r="1"/><circle cx="5" cy="-5" r="1"/><circle cx="-8" cy="4" r="1"/><circle cx="-5" cy="2" r="1"/><circle cx="-2" cy="3" r="1"/></g>';
      }
      g.firstChild.textContent=t(kind);
      svg.appendChild(g);
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.setAttribute('class','place-name');
      label.setAttribute('text-anchor','middle');
      label.setAttribute('y','25');
      label.textContent=t(kind);
      g.append(label);
      const limit=Math.min(130,w*.205);
      if(label.getComputedTextLength()>limit){
        label.setAttribute('textLength',String(limit));
        label.setAttribute('lengthAdjust','spacingAndGlyphs');
      }
    }
    const carrier=document.createElementNS('http://www.w3.org/2000/svg','g');
    carrier.setAttribute('class','carrier');
    carrier.setAttribute('pointer-events','none');
    carrier.innerHTML='<ellipse cx="12" cy="7" rx="13" ry="3.5" fill="#5e6958" opacity=".22"/>'+icon('courier',-5,-27,36);
    svg.appendChild(carrier);
    return xy;
  }
  function trace(svg,xy,trail,bad) {
    const lines=trail.slice(1).map((node,i)=>path(curve(xy[trail[i]],xy[node]),'none','stroke="#56776a" stroke-width="4" stroke-dasharray="5 5"'));
    if(bad && xy[bad])lines.push(path(curve(xy[trail[trail.length-1]],xy[bad]),'none','stroke="#a25b4d" stroke-width="4" stroke-dasharray="2 7"'));
    svg.querySelector('.trail').innerHTML=lines.join('');
    const [x,y]=xy[trail[trail.length-1]];
    svg.querySelector('.carrier').style.transform='translate('+x+'px,'+(y+4)+'px)';
  }
  return {build,trace};
})();
