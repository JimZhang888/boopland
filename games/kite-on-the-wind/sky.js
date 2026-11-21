const KiteSky = (() => {
  'use strict';
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  const kite = new Image();
  const quiet = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0;
  let last;
  const ink = '#50655c';
  function path(d, color, stroke, weight = 1) {
    const shape = new Path2D(d);
    if (color) { ctx.fillStyle = color; ctx.fill(shape); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = weight; ctx.stroke(shape); }
  }
  function ellipse(x, y, rx, ry, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function size() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = bounds.width; height = bounds.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    if (width && height) ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    if (last) draw(...last);
  }
  new ResizeObserver(size).observe(canvas);
  kite.onload = () => { if (last) draw(...last); };
  kite.src = 'kite.svg';
  function cloud(x,y,k) {
    ctx.save(); ctx.translate(x,y); ctx.scale(k,k);
    path('M-69 10q6-5 22-5 5-13 18-11 10-17 27-12 10-14 26-5 10 4 12 15 14-4 22 7 18 0 25 7-33 2-63 1-24 4-51 3Z','#f5f4e8','#b9c8be',.9);
    path('M-55 13q26 1 48-1m24-3 46-2m-61-18q10-13 21-7m-37 9q4-6 12-6',null,'#c6d0c4',.8);
    ctx.restore();
  }
  function sky(t) {
    const w=width,h=height,scale=Math.min(w/1000,h/510,1.35);
    const sunX=w*.84,sunY=h*.21,r=Math.max(15,Math.min(39,h*.08));
    ellipse(sunX,sunY,r,r,'#e4c799','#d1b583');
    ctx.save();ctx.translate(sunX,sunY);ctx.rotate(-.18);
    path('M'+(-r-9)+' '+(r*.83)+'q'+r+' -1 '+(r*1.9)+' 0m-13 4h22',null,'#d3c6a9');ctx.restore();
    const drift=quiet.matches?0:Math.sin(t*.09)*5;
    cloud(w*.15+drift,h*.15,Math.max(.38,scale*.88));
    cloud(w*.50-drift*.6,h*.22,Math.max(.38,scale*.77));
    cloud(w*.87+drift,h*.35,Math.max(.4,scale*1.12));
    cloud(w*.31+drift*.6,h*.56,Math.max(.33,scale*.57));
    // Pairs of fine streamlines keep the wind legible against the open sky.
    ctx.save();ctx.translate(w*.55,h*.12);ctx.scale(scale,scale);
    path('M-58 0q27-7 49-4t44-5m-58 13q28 1 43-3',null,'#aabfb4',1);
    ctx.restore();
    ctx.save();ctx.translate(w*.76,h*.53);ctx.scale(scale*.9,scale*.9);
    path('M-58 0q18 5 40 0t41-3m-25 7q20-4 36-5',null,'#afc1b4',1);
    ctx.restore();
  }
  function tree(x,y,k,forecast,t) {
    ctx.save();ctx.translate(x,y);ctx.scale(k,k);
    const sway=forecast*11 + (quiet.matches?0:Math.sin(t*1.8)*Math.abs(forecast)*1.3);
    path('M-8 3Q-3-24-5-49l3-38 3 1q-5 45 5 84Z','#8b927e','#657767',1.2);
    path('M-2-9q2-42 23-67m-23 54q1-32-22-48m21-11 7-18',null,'#6c7b69',2);
    const clusters=[[-23,-57, .74],[-41,-55,.57],[25,-71,.83],[4,-84,.93],[-4,-99,.74]];
    for (let i=0;i<clusters.length;i++) {
      const [bx,by,s]=clusters[i];
      ctx.save();ctx.translate(bx+sway*s,by);ctx.scale(s,s);
      path('M-28 1q-2-5 4-10-2-8 7-10 3-8 12-6 7-8 14-2 8-3 14 4 9 1 8 9 7 5 1 12-8 4-15 2-9 6-16 1-10 4-18 0Z',i%2?'#9eb39b':'#aabea7','#7f9986',1.1);
      for(let j=0;j<7;j++) {
        const nx=-22+j*7,ny=-12+Math.sin(j*3.6+i)*6;
        path('M'+nx+' '+ny+'q3-4 6-3',null,'#869e88',1);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function windsock(x,y,k,f,t) {
    ctx.save();ctx.translate(x,y);ctx.scale(k,k);
    path('M-1 1 1-57m1 56 1-58',null,'#798879',1.4);
    const end=5+Math.abs(f)*34, drop=17*(1-Math.abs(f));
    ctx.translate(2,-54);ctx.scale(f<0?-1:1,1);
    const tip=drop+(quiet.matches?0:Math.sin(t*3)*1.5);
    path(`M1-4Q${end*.45} -2 ${end} ${tip}l0 4Q${end*.4} 4 1 5Z`,'#c5886d','#7f8070',.9);
    path(`M${end*.35} 0l-1 5m${end*.29} -3v4`,null,'#e5d3ad',2.6);ctx.restore();
  }
  function tail(x,y,length,forecast,t) {
    const sway=Math.max(-1,Math.min(1,forecast*1.4));
    const at = n => [x + length*(sway*.74*n+Math.sin(n*6-t*2.2)*n*.14),y + length*n*(1-.27*Math.abs(forecast))];
    ctx.beginPath();ctx.moveTo(x,y);
    for(let j=1;j<=24;j++)ctx.lineTo(...at(j/24));
    ctx.strokeStyle='#6c7166';ctx.lineWidth=1.2;ctx.stroke();
    for(let j=1;j<=4;j++){
      const n=j/4.5,[bx,by]=at(n),[nx,ny]=at(n+.02),s=Math.min(8,length*.075)*(1-n*.35);
      ctx.save();ctx.translate(bx,by);ctx.rotate(Math.atan2(ny-by,nx-bx)-Math.PI/2+.2);
      path(`M0 0l${-s} ${-s*.62}l0 ${s}Z M0 0l${s} ${-s*.43}l-1 ${s*1.12}Z`,j%2?'#c78e78':'#d5bc86','#6b7365',.8);
      ctx.restore();
    }
  }
  function gate(x,y,space,t,alt) {
    const flag=Math.max(12,Math.min(26,width*.036));
    ctx.save();ctx.translate(x,y);ctx.setLineDash([3,5]);
    path(`M0 ${-space}v${space*2}`,null,'#707c6c',1.2);
    ctx.setLineDash([]);
    for(const d of [-1,1]){
      ctx.save();ctx.translate(0,d*space);
      path(`M0 0 1 ${d*17}`,null,'#5d6d5c',2);
      const wave=Math.sin(3*t+d)*2;
      path(`M1 ${d*3}q${flag*.45} ${-d*3+wave} ${flag} ${d*1+wave}l-5 ${d*4} 4 ${d*4}q${-flag*.5} ${-d*3} ${-flag+1} ${d*1}Z`,'#c78c73','#8e7562',1);
      path(`M-5 0h6`,null,'#687564',1.5);ctx.restore();
    }
    ctx.font='600 13px Georgia,serif';ctx.textAlign='center';ctx.fillStyle='#495c4e';
    ctx.fillText(alt+' m',0,-space-21);ctx.restore();
  }
  function draw(s, poster) {
    last=[s,poster];
    if(!width||!height)return;
    const w=width,h=height,t=s.elapsed, artTime=quiet.matches?0:t;
    ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';sky(artTime);
    const airflow=KiteFlight.wind(s.section,s.legTime);
    const forecast=KiteFlight.wind(s.section,s.legTime+1.6);
    const k=Math.min(w/850,h/470,1.4);
    tree(w*.055,h*.985,Math.max(.48,k)*1.12,forecast,artTime);
    windsock(w*.86,h*.899,Math.max(.65,k),forecast,artTime);
    const narrow=w<=640&&h/w>.77;
    const baseY=h*.923, range=h*.79;
    const toY=alt=>baseY-range*alt/95;
    const birdSize=poster?Math.min(w*(narrow ? .61 : .30),h*.52,360):Math.max(32,Math.min(w*(narrow ? .183 : .14),h*.26,138));
    const x=w*(poster?(narrow ? .57 : .687):.30+.057*airflow);
    const y=poster?h*(narrow ? .28 : .36):toY(s.altitude);
    const anchorX=w*(poster ? .27 : .13),anchorY=h*.958;
    if(!poster){
      const course=KiteFlight.courses[s.section];
      const gx=x+(w*.91-x)*(1-s.legTime/course.duration),gy=toY(course.height);
      gate(gx,gy,range*course.radius/95,artTime,course.height);
      ctx.save();ctx.setLineDash([3,5]);const labelSide=x+birdSize*.47;
      path(`M${labelSide} ${y}h${Math.min(27,w*.05)}`,null,'#82998b');ctx.restore();
    }
    const stalled=!poster&&s.tension<.24, tight=!poster&&s.tension>.85;
    const sag=poster?h*.22:h*(.018+(1-s.tension)**1.6*.29);
    const bx=x-.03*birdSize,by=y+.05*birdSize;
    ctx.save();
    if(s.outcome==='snap') {
      path(`M${anchorX} ${anchorY}q${(bx-anchorX)*.4} ${(by-anchorY)*.3} ${(bx-anchorX)*.6} ${(by-anchorY)*.51}m9 -12 7 -9`,null,'#92664f',1.4);
    } else {
      path(`M${anchorX} ${anchorY}Q${(anchorX+bx)/2} ${(anchorY+by)/2+sag} ${bx} ${by}`,null,tight?'#a86952':'#667467',tight?2:1.15);
      if(tight){
        ctx.translate((bx+anchorX)/2,(by+anchorY)/2+sag*.53);ctx.rotate(-.8);
        path('M-9-6q9-3 17-1m-13 11q10 3 16-1',null,'#a96c51',1.8);
      }
    }
    ctx.restore();
    ctx.save();ctx.translate(anchorX,anchorY);ctx.scale(Math.max(.56,k),Math.max(.56,k));ctx.rotate(-.38);
    path('M-11-4h19v9h-19Z','#d4bd91','#626e5f');path('M-11-7v15m19-16v15m-17-7h15m-15 3h15',null,'#726f5a',2);ctx.restore();
    const angle=poster?-.24:stalled?1.16:-.19-airflow*.19+s.speed*.008;
    // Rotate the attachment with the wing, but let the ribbon bend downwind in world space.
    const pinX=-birdSize*.184, pinY=birdSize*.30;
    tail(x+pinX*Math.cos(angle)-pinY*Math.sin(angle),
      y+pinX*Math.sin(angle)+pinY*Math.cos(angle),birdSize*(poster ? .58 : .64),forecast,artTime);
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    if(kite.complete&&kite.naturalWidth)ctx.drawImage(kite,-birdSize/2,-birdSize*.325,birdSize,birdSize*.65);
    ctx.restore();
    if(stalled){
      ctx.save();ctx.translate(x+birdSize*.4,y+4);
      path('M-4 0l4 6 4-6m-8 7 4 6 4-6',null,'#567784',2);ctx.restore();
    }
  }
  size();
  return {draw};
})();