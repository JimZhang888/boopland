/* The stage is printed in layers so the cut-paper joints can move independently. */
const PaperTheatre = (() => {
  const ink = '#473e35', red = '#ae6255', cream = '#f7ecd1', gold = '#cda458', blue = '#667f80';
  const defs = `<defs>
    <pattern id="fibers" width="31" height="27" patternUnits="userSpaceOnUse">
      <path d="m2 7 2-.4m8 11 1.4.3m11-14 2 .4m-5 18 2 .2m-16 1 .8-.2" stroke="#756751" stroke-width=".65" opacity=".26"/>
    </pattern>
    <pattern id="shade" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(27)">
      <path d="M0 0v6" stroke="#4b4036" stroke-width="1" opacity=".24"/>
    </pattern>
    <pattern id="cloth" width="5" height="11" patternUnits="userSpaceOnUse">
      <path d="m1 1 .2 5m2 3 .4 1" stroke="#ead9b7" stroke-width=".75" opacity=".36"/>
    </pattern>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <path id="spark" d="M0-11 2-2 9 0 2 2 0 11-2 2-9 0-2-2Z"/>
    <g id="bell" stroke="${ink}" stroke-width="1.5" fill="${gold}">
      <path d="M0-4c-5 0-8 5-6 9 2 5 8 5 11 1C8 2 5-3 0-4Z"/>
      <path d="M-4 2q4 3 9-1M1 5l1 3" fill="none"/><circle cx="-2" cy="0" r="1.5" fill="#ede0b6" stroke="none"/>
    </g>
    <g id="doll" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
      <!-- A split harlequin jacket, paper folds and brass brads. -->
      <path d="M-24 10Q-53 10-61 36l12 12 9 52q40 11 81-1l7-52 12-15Q49 12 25 10Z" fill="${blue}"/>
      <path d="M0 13q-3 43 1 88l39-2 9-53 10-15Q44 13 26 10Z" fill="#e7c99a"/>
      <path d="m8 27 10-13 10 16-10 15Zm18 33 12-17 9 13-10 21Zm-22 4 12-18 10 16-12 21Zm19 32 12-18 7 12-2 9Z" fill="${red}" stroke="none"/>
      <path d="m-43 39 4 46m4-52 3 62m-10-7 6-4m-1 8 6-4M3 31q-3 37 1 65" fill="none" stroke-width=".9"/>
      <path d="M-42 94q41 8 84 0l-2 11q-40 7-81 0Z" fill="#465654"/><path d="M-39 102q36 6 77 0" stroke="#d7be83" fill="none" stroke-width="1"/>
      <g fill="${gold}"><circle cx="-6" cy="46" r="3"/><circle cx="-6" cy="65" r="3"/><circle cx="-6" cy="83" r="3"/></g>
      <path d="m-12-8 2 24 23 2-1-31Z" fill="#d8ac81"/>
      <!-- Pleated ruff cut from a folded strip. -->
      <path d="M-30-2q27 18 56-2l22 17-13 3-3 7-12-2-7 8-11-5-10 5-9-8-11 2-3-8-13-2Z" fill="#e5d1aa"/>
      <path d="M-30-7q31 16 59-2l18 17-12 4-2 6-13-2-7 7-11-6-10 6-9-8-12 1-3-8-12-1Z" fill="${cream}"/>
      <path d="m-26-4-7 12m12-9-3 13m12-10 2 13m9-12 2 11m9-12 4 14m4-18 7 12m0-15 8 10" stroke-width="1" fill="none"/>
      <!-- Carved face, printed cheeks and individual pencil marks. -->
      <path d="M-32-64q-11 0-9 13 1 11 11 11m60-25q12-3 12 8 0 10-10 12" fill="#d5ad87"/>
      <path d="M-31-75q28-21 62-4c9 16 7 47-1 60Q20-3 3 1q-18-2-29-17-9-14-9-33Z" fill="#edcfaa"/>
      <path d="M-32-53q-2 36 22 47-15-2-22-20l-4-21Z" fill="url(#shade)" stroke="none"/>
      <path d="M-34-56q-4-14 2-25 16-16 45-10l22 8q4 11 1 25l-6-10-5 1-3-7q-13 6-24 1-6 9-18 8l-6 9-3-9Z" fill="#514638"/>
      <path d="M-21-48q5-6 12-3m19-1q7-5 15-1" fill="none" stroke-width="2.4"/>
      <g fill="${ink}" stroke="none"><ellipse cx="-14" cy="-42" rx="2.3" ry="3.5"/><ellipse cx="17" cy="-44" rx="2.3" ry="3.5"/></g>
      <g fill="#c37b67" stroke="none"><ellipse cx="-23" cy="-31" rx="6.8" ry="4" transform="rotate(14 -23 -31)"/><ellipse cx="27" cy="-34" rx="5.7" ry="3.6" transform="rotate(-20 27 -34)"/></g>
      <path d="m3-45-4 14q2 3 7 0m-15 10q10 8 20-4m-6 9 5-2m-31-18-2 3m6-2-2 3m41-7-2 3" fill="none" stroke-width="1.3"/>
      <!-- Floppy two-point cap with contrasting panels and etching. -->
      <path d="M-33-70q-5-15-14-11-9 6-14 1-1-15 13-26 21-18 50-5 22-12 42-2 15 7 18 25-14-6-21 3l-9 15Z" fill="${red}"/>
      <path d="M-8-81q0-19 10-30 30-16 50 4 7 8 10 19-17-7-24 5l-10 12Z" fill="${blue}"/>
      <path d="M-59-82q7-16 21-18m-18 13 12-8m8 20q4-19 19-27m16 20q5-16 17-24m17 3q12 1 18 9m-7-8 6 5" stroke-width="1.1" fill="none"/>
      <path d="M-36-74q35-19 72-8l-2 10q-39-10-67 10Z" fill="${gold}"/>
      <path d="M-30-70q26-13 60-8" stroke-width="1" fill="none" stroke-dasharray="2 4"/>
      <use href="#bell" transform="translate(-62 -77)"/><use href="#bell" transform="translate(64 -85)"/>
    </g>
    <g id="hand" stroke="${ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m-12 23-1-11q-8-4-14-13l-9-10q-2-4 1-5 3-2 8 4l11 9-8-15q-2-5 1-6 3-1 6 4l9 12-5-15q-1-5 2-5 3 0 5 4L2-7l-1-12q0-4 3-4t4 5l3 13 1 2 5-7q4-5 7-2 2 2-2 8l-7 13-7 7 1 8Z" fill="#edcfab"/>
      <path d="M-10 9q7-4 16-3m-17-8 9 7m-1-7 4 5m0-4 4 4m-13 13 9-2m-28-22 5 5" fill="none" stroke-width="1"/>
      <path d="M-17 20 10 17l4 12-29 6Z" fill="${cream}"/>
      <path d="m-10 22 1 9m5-10 2 8m5-10 2 8" fill="none" stroke-width="1"/>
    </g>
    <clipPath id="ballClip"><circle r="16"/></clipPath>
    <g id="orb0"><circle r="16" fill="${red}"/>
      <g fill="${cream}" clip-path="url(#ballClip)" transform="rotate(25)">
        <path d="M-17-10q18 8 34-2v5Q0 4-17-5Zm0 12Q1 11 17 0v5Q1 17-17 8Z"/>
      </g><circle r="16" fill="none" stroke="${ink}" stroke-width="1.5"/>
      <path d="M-12-5q2-6 7-8m12 25 3-3" fill="none" stroke="${ink}" stroke-width=".9"/></g>
    <g id="orb1"><circle r="16" fill="${blue}"/><g fill="${cream}" clip-path="url(#ballClip)">
      <path d="m-20-1 7-9 7 9-7 8Zm14 0 7-9 7 9-7 8Zm14 0 7-9 7 9-7 8ZM-6-18l7-9 7 9-7 8Zm0 34 7-9 7 9-7 8Z"/>
      </g><circle r="16" fill="none" stroke="${ink}" stroke-width="1.5"/></g>
    <g id="orb2"><circle r="16" fill="${gold}" stroke="${ink}" stroke-width="1.5"/>
      <path d="m0-12 3 8 9 1-7 6 2 8-7-4-8 4 2-9-6-5 9-1Z" fill="${cream}" stroke="${ink}" stroke-width="1"/>
      <path d="m-12-9 3-3m19 22-4 3" fill="none" stroke="${ink}" stroke-width=".8"/></g>
    <g id="drape" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round">
      <path d="M-1-2 151-2q-13 43-40 64-32 28-74 57-4 13 3 31 9 24 12 75-12 1-17-13-4 14-13 11-9-3-13-17l-10 7Z" fill="${red}"/>
      <path d="M-1-2 151-2q-13 43-40 64-32 28-74 57-4 13 3 31 9 24 12 75-12 1-17-13-4 14-13 11-9-3-13-17l-10 7Z" fill="url(#cloth)" stroke="none"/>
      <path d="M5-3q3 64 24 118M28-2q6 52 5 103M50 0q1 53-16 112M97-3q-9 40-55 100m67-79Q89 59 46 92M141 3q-36 63-85 92m-24 32q-13 31-9 83m11-77q-1 38 10 74m-24-72q-9 21-11 51" fill="none" stroke="#713f39"/>
      <path d="M67-3q-2 51-26 97Q63 52 77-3Zm-43 141q-5 37-1 74l5 2q-4-34-1-71Z" fill="url(#shade)" stroke="none"/>
      <path d="M-1 122q17-2 34-11l4 7Q18 130-1 131Z" fill="${gold}"/>
      <path d="M34 117q17 4 16 20m-1-6 0 9" fill="none" stroke="#856b38" stroke-width="2"/>
      <path d="m48 139-4 12q5 4 11-1l-5-12Z" fill="${gold}"/>
    </g>
  </defs>`;
  const use = (id, transform='') => `<use href="#${id}" transform="${transform}"/>`;
  const f = n => Number(n.toFixed(2));

  function layout(w,h) {
    const x = w * (w/h < 1.15 ? .19 : .235);
    const s = Math.min(h / 445, w / 445);
    return { w, h, x, span:w-2*x, cx:w/2, base:.952*h, s, radius:Math.max(7, Math.min(w*.032, h*.043)), handScale:Math.min(h/335,w/410) };
  }

  function backdrop(L) {
    const {w,h,cx} = L;
    let rays='', stars='', boards='', drapery='';
    for(let i=-9;i<10;i+=2) {
      rays += `M${cx} ${h*.98}l${i*w*.13} ${-h}h${w*.1}Z `;
    }
    const starMap=[[.11,.40,6],[.18,.56,9],[.30,.23,6],[.39,.33,4],[.56,.19,4],[.63,.42,6],[.77,.32,7],[.84,.54,5],[.91,.43,6],[.13,.75,4],[.81,.22,3]];
    for (const [px,py,r] of starMap) stars+=use('spark',`translate(${px*w} ${py*h}) scale(${r*L.s/11})`);
    const curtainX=Math.min(w*.27,h*.54)/150, curtainY=h*.68/225;
    const bays=w/h<1.2 ? 3 : 5, bw=w/bays;
    for (let i=0;i<bays;i++) {
      const x=i*bw, depth=(i%2?.063:.079)*h;
      drapery+=`<path d="M${x-1} -2h${bw+2}v6Q${x+bw*.5} ${depth*2} ${x-1} 5Z" fill="${red}" stroke="${ink}" stroke-width="1.5"/>
        <path d="M${x+4} 5Q${x+bw*.49} ${depth*1.63} ${x+bw-4} 5M${x+bw*.14} 3q${bw*.38} ${depth} ${bw*.69} 1" fill="none" stroke="#e0b38b" stroke-width="1.2"/>
        ${use('bell',`translate(${x+bw} 5) scale(${L.s*.54})`)}`;
    }
    const foot=h*.937;
    for(let i=-1;i<16;i++) {
      const x=i*w/14;
      boards+=`<path d="M${x} ${foot}l${(x-cx)*.12} ${h-foot}" fill="none" stroke="#95866d" stroke-width="1"/>`;
    }
    return `<rect width="${w}" height="${h}" fill="#f4e9cc"/><path d="${rays}" fill="#eadbb4" opacity=".33"/>
      <rect width="${w}" height="${h}" fill="url(#fibers)"/>
      <g fill="#ad905e" opacity=".8">${stars}</g>
      <path d="M0 ${foot}Q${cx} ${foot-1.5} ${w} ${foot}V${h}H0Z" fill="#d8c5a3" stroke="#655849"/>
      ${boards}<path d="M0 ${h*.977}Q${cx} ${h*.97} ${w} ${h*.978}" fill="none" stroke="#ab977e"/>
      ${use('drape',`scale(${curtainX} ${curtainY})`)}${use('drape',`translate(${w} 0) scale(${-curtainX} ${curtainY})`)}${drapery}`;
  }

  function arm(L,side) {
    const sign=side?1:-1, {w,h,cx,s,base}=L;
    const palm=side?w-L.x:L.x, sx=cx+sign*47*s, sy=base-83*s;
    const ex=palm-sign*Math.min(w*.055,h*.16), ey=base-h*.016;
    const wx=palm-sign*3*L.handScale, wy=h*.814+20*L.handScale;
    const width=Math.min(s*15,w*.022);
    const segment=(ax,ay,bx,by,size,color)=>{
      const len=Math.hypot(bx-ax,by-ay), angle=Math.atan2(by-ay,bx-ax)*180/Math.PI;
      return `<g transform="translate(${ax} ${ay}) rotate(${angle})"><path d="M0 ${-size}Q${len*.5} ${-size*.88} ${len} ${-size*.65}q${size*.6} ${size*.62} 0 ${size*1.3}L0 ${size}Q${-size} 0 0 ${-size}Z" fill="${color}" stroke="${ink}" stroke-width="1.5"/>
      <path d="m${len*.19} ${-size*.7} ${-size*.26} ${size*1.43}m${size*.6} ${-size*1.46} ${-size*.26} ${size*1.43}M${len*.44} ${size*.55}l${len*.36} ${-size*.13}" fill="none" stroke="#554a3d" stroke-width="1"/></g>`;
    };
    return segment(sx,sy,ex,ey,width,side?'#d7ac83':blue)+segment(ex,ey,wx,wy,width*.86,side?red:'#aab7ab')+
      `<circle cx="${ex}" cy="${ey}" r="${width*.48}" fill="${gold}" stroke="${ink}"/><circle cx="${ex}" cy="${ey}" r="${width*.15}" fill="${ink}"/>`;
  }

  function print(L) {
    const {w,h,s,cx,base}=L;
    const thread=(x,y)=>`<path d="M${x-2*s} 0Q${x+1.5*s} ${y*.61} ${x} ${y}" stroke="#7a7260" stroke-width=".9" opacity=".53" fill="none"/>`;
    const hands=[0,1].map(side=>{
      const x=side?w-L.x:L.x;
      return `<g transform="translate(${x} ${h*.813}) scale(${side?-L.handScale:L.handScale} ${L.handScale})"><g id="palm${side}">${use('hand')}</g></g>`;
    }).join('');
    const rings=[0,1].map(side=>{
      const rx=Math.max(L.radius*1.6,Math.min(w*.075,h*.095)), ry=h*(JugglingAct.bottomY-JugglingAct.rimY)/2;
      return `<g id="zone${side}" transform="translate(${side?w-L.x:L.x} ${(JugglingAct.rimY+JugglingAct.bottomY)*h/2})" fill="#fbf3df" fill-opacity=".32" stroke="${side?'#966154':'#506e70'}">
       <ellipse rx="${rx}" ry="${ry}" stroke-width="1.4" stroke-dasharray="5 4"/><path d="m${-rx-6} 0h5m${2*rx+2} 0h5" stroke-width="1.5"/></g>`;
    }).join('');
    return `${defs}<g stroke-linejoin="round" stroke-linecap="round">${backdrop(L)}
      ${thread(L.x-8*s,h*.855)}${thread(w-L.x+8*s,h*.855)}${thread(cx,base-215*s)}
      ${arm(L,0)}${arm(L,1)}
      ${use('doll',`translate(${cx} ${base-107*s}) scale(${s})`)}
      ${hands}${rings}<g id="trails" fill="none"></g><g id="props"></g>
      <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".055" style="mix-blend-mode:multiply" pointer-events="none"/>
    </g>`;
  }
  function trail(L,ball,t0,t1) {
    const p=t=>{const point=JugglingAct.at(ball,t);return [L.x+point.x*L.span,point.y*L.h];};
    const a=p(t0),b=p(t1),mid=p((t0+t1)/2);
    return `M${f(a[0])} ${f(a[1])}Q${f(2*mid[0]-(a[0]+b[0])/2)} ${f(2*mid[1]-(a[1]+b[1])/2)} ${f(b[0])} ${f(b[1])}`;
  }
  const palette=['#a15d52','#56797c','#a37e37'];
  function preview(L) {
    const ball={id:0,from:0,startY:.704};
    const ts=[.16,.5,.84], ids=[0,2,1];
    const line=`<path d="${trail(L,ball,.04,.96)}" fill="none" stroke="#8a7c62" stroke-width="1.35" stroke-dasharray="5 7"/>`;
    return line+ts.map((t,i)=>{
      const p=JugglingAct.at(ball,t), x=L.x+p.x*L.span, y=L.h*p.y;
      return `<g transform="translate(${x} ${y}) rotate(${(i-1)*17}) scale(${L.radius/11.4})">
        <path d="m-19 5-5 3m7 .8-3 2" fill="none" stroke="#8f8266" stroke-width=".9"/>${use('orb'+ids[i])}</g>`;
    }).join('');
  }
  return { layout, print, preview, trail, palette };
})();
