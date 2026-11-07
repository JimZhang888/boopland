(() => {
  'use strict';
  const E=PaperGolf,ink='#65735a',green='#647f55';
  class Scene {
    constructor(canvas,stage){
      this.canvas=canvas;this.stage=stage;this.ctx=canvas.getContext('2d');this.scale=1;this.ox=0;this.oy=0;this.particles=[];
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.resize();
    }
    resize(){const r=this.stage.getBoundingClientRect();this.width=r.width;this.height=r.height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(r.width*dpr));this.canvas.height=Math.max(1,Math.round(r.height*dpr));this.dpr=dpr;this.scale=Math.min(r.width/E.WIDTH,r.height/E.HEIGHT);this.ox=(r.width-E.WIDTH*this.scale)/2;this.oy=(r.height-E.HEIGHT*this.scale)*.5;}
    point(e){const r=this.canvas.getBoundingClientRect();return {x:(e.clientX-r.left-this.ox)/this.scale,y:(e.clientY-r.top-this.oy)/this.scale};}
    path(points,fill,stroke=ink,width=1.4,close=false){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    ellipse(x,y,rx,ry,fill,stroke=ink,width=1.3){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
    cloud(x,y,s){const c=this.ctx;c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-45,10);c.bezierCurveTo(-58,-5,-42,-19,-24,-13);c.bezierCurveTo(-24,-37,10,-42,22,-19);c.bezierCurveTo(42,-27,63,-7,49,9);c.bezierCurveTo(22,13,-17,8,-45,10);c.fillStyle='#fffef6';c.fill();c.lineWidth=1.3;c.strokeStyle='#bac4b0';c.stroke();this.path([[-38,17],[-4,19],[21,17]],null,'#d2d8c7',.8);c.restore();}
    flower(x,y,s=1){const c=this.ctx;c.save();c.translate(x,y);c.scale(s,s);this.path([[0,0],[1,-21]],null,'#7b8f6c',1.3);this.path([[0,-8],[-7,-15]],null,'#8c9b7a',1);for(let i=0;i<5;i++){const a=i*2*Math.PI/5;this.ellipse(Math.cos(a)*4,-23+Math.sin(a)*4,3.8,3.2,'#fffdf0','#c9cdb6',.6);}this.ellipse(0,-23,2.5,2.5,'#d5bb76',null);c.restore();}
    burst(x,y,type){if(this.reduced)return;const count=type==='win'?35:9;for(let i=0;i<count;i++){const a=i*2.4;this.particles.push({x,y,vx:Math.cos(a)*(40+i*3),vy:-70-Math.abs(Math.sin(a))*130,life:type==='win'?1.6:.55,max:type==='win'?1.6:.55,color:['#a9ba8d','#ddc587','#c99780','#99b8b4'][i%4],size:3+i%4});}}
    draw(game,aim,drag,dt=0){
      // Keep both the full course and a high lob in view without clipping the ball.
      const top=Math.min(0,game.ball.y-38);
      this.scale=Math.min(this.width/E.WIDTH,this.height/(E.HEIGHT-top));
      this.ox=(this.width-E.WIDTH*this.scale)/2;
      this.oy=(this.height-(E.HEIGHT-top)*this.scale)*.5-top*this.scale;
      const c=this.ctx,l=game.level,s=this.scale;if(!s)return;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.save();c.translate(this.ox,this.oy);c.scale(s,s);c.lineCap='round';c.lineJoin='round';
      const bottom=(this.height-this.oy)/s+1,left=-this.ox/s-1,right=(this.width-this.ox)/s+1;
      // Quiet layers of paper hills, with a second pencil contour.
      c.save();c.globalAlpha=.8;this.ellipse(758,99,35,35,'#ede0b4',null);this.ellipse(757,99,29,29,null,'#dac88f',.8);
      for(let i=0;i<9;i++){const a=i*Math.PI*2/9;this.path([[758+Math.cos(a)*43,99+Math.sin(a)*43],[758+Math.cos(a)*48,99+Math.sin(a)*48]],null,'#d9cb9e',1);}
      c.restore();this.cloud(210,130,.8);this.cloud(547,87,.58);this.cloud(897,159,.68);
      c.beginPath();c.moveTo(left,355);c.lineTo(-20,355);c.bezierCurveTo(100,306,173,306,267,337);c.bezierCurveTo(395,248,509,254,617,316);c.bezierCurveTo(759,267,861,265,1020,325);c.lineTo(right,325);c.lineTo(right,bottom);c.lineTo(left,bottom);c.closePath();c.fillStyle='#edf0e3';c.fill();c.strokeStyle='#d9e0cd';c.lineWidth=1.2;c.stroke();
      c.beginPath();c.moveTo(left,393);c.lineTo(-20,393);c.bezierCurveTo(160,341,241,360,366,392);c.bezierCurveTo(540,327,643,352,766,386);c.bezierCurveTo(861,344,930,347,1020,364);c.lineTo(right,364);c.lineTo(right,bottom);c.lineTo(left,bottom);c.closePath();c.fillStyle='#e3e9d7';c.fill();c.strokeStyle='#cbd5bc';c.stroke();
      const surface=[[left,l.terrain[0][1]],...l.terrain,[right,l.terrain[l.terrain.length-1][1]]];
      const points=[...surface,[right,bottom],[left,bottom]];this.path(points,'#dce5cb',null,1,true);
      c.save();c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();
      c.globalAlpha=.2;for(let y=300;y<bottom+40;y+=18)for(let x=left;x<right;x+=24){const n=Math.sin(x*2.1+y*.73);this.path([[x+n*6,y],[x+7+n*6,y-3]],null,'#a1b18b',.7);}
      c.globalAlpha=.27;this.path(surface.map(([x,y])=>[x,y+15]),null,'#afbd98',7);c.restore();
      this.path(surface,null,'#6b7c5c',2.1);this.path(surface.map(([x,y],i)=>[x+.5,y+2+Math.sin(i)*1.6]),null,'#97a586',.8);
      // Sand is drawn along the same collision surface as the grass.
      for(const [a,b] of l.sand){const path=[];for(let x=a;x<=b;x+=5)path.push([x,E.groundAt(l,x).y]);path.push([b,E.groundAt(l,b).y+15],[a,E.groundAt(l,a).y+15]);this.path(path,'#e9d6aa',null,1,true);this.path([[a,E.groundAt(l,a).y],[b,E.groundAt(l,b).y]],null,'#b99c6e',2.5);for(let x=a+5;x<b;x+=12){const y=E.groundAt(l,x).y;this.path([[x,y+5],[x+2,y+5]],null,'#b59f76',1);this.path([[x+5,y+10],[x+7,y+10]],null,'#c2ad80',1);}}
      for(const [a,b] of l.pads){const y=E.groundAt(l,(a+b)/2).y;this.path([[a,y],[b,y]],null,'#956f50',5);this.path([[a+2,y-3],[b-2,y-3]],null,'#ddb378',5);for(let x=a+6;x<b;x+=15)this.path([[x,y+7],[x+5,y+13],[x+10,y+7]],null,'#a68a62',1.4);this.path([[(a+b)/2-10,y-13],[(a+b)/2,y-23],[(a+b)/2+10,y-13]],null,'#b18c5c',1.6);}
      for(const m of l.movers||[]){c.save();c.setLineDash([3,6]);this.path([[m.x+m.w/2,m.y-m.amplitude],[m.x+m.w/2,m.y+m.amplitude+m.h]],null,'#b5bca6',1);c.restore();this.obstacle(E.moverAt(m,game.time),'#c3d0c6','#748f83');const y=E.moverAt(m,game.time).y;this.path([[m.x+4,y+22],[m.x+m.w/2,y+15],[m.x+m.w-4,y+22]],null,'#667f73',1.3);}
      if(l.gate){if(!game.switched)this.obstacle(l.gate,'#d7bba2','#a58165');else{c.save();c.globalAlpha=.35;c.setLineDash([4,6]);this.path([[l.gate.x,l.gate.y],[l.gate.x,l.gate.y+l.gate.h]],null,'#829676',2);c.restore();}}
      if(l.switch){const b=l.switch;this.ellipse(b.x,b.y+6,b.r,b.r*.62,game.switched?'#a7bb8f':'#ecd7ad',game.switched?'#6d875b':'#ab8d5c',2);this.ellipse(b.x,b.y+3,b.r-6,(b.r-6)*.6,null,game.switched?'#758d62':'#b09665',1);if(game.switched)this.path([[b.x-7,b.y+3],[b.x-1,b.y+8],[b.x+8,b.y-2]],null,'#58754c',2);else this.path([[b.x,b.y-3],[b.x,b.y+8]],null,'#a78955',2);}
      // Tiny plants are kept away from the tee, cup and mechanisms.
      for(const x of [35,250,805,952]){if(l.sand.some(([a,b])=>x>=a-10&&x<=b+10)||Math.abs(x-l.hole)<40)continue;const y=E.groundAt(l,x).y;this.flower(x,y, .72+Math.sin(x)*.15);}
      const ty=E.groundAt(l,l.tee).y;this.path([[l.tee-17,ty+6],[l.tee+17,ty+6]],null,'#9cac88',1);this.path([[l.tee-12,ty+11],[l.tee+10,ty+11]],null,'#adb999',.7);
      const hy=E.groundAt(l,l.hole).y;this.ellipse(l.hole,hy+2,20,5,'#59684c','#526245',1.4);this.ellipse(l.hole,hy+1,15,2.4,'#3d4b36',null);this.path([[l.hole+5,hy-2],[l.hole+6,hy-109]],null,'#67795a',2.1);
      const wave=this.reduced?0:Math.sin(game.time*2)*2;this.path([[l.hole+7,hy-107],[l.hole+62,hy-96+wave],[l.hole+8,hy-78]],'#cc9e82','#a97e65',1.5,true);this.path([[l.hole+12,hy-102],[l.hole+49,hy-95+wave]],null,'#e5bea2',.8);
      c.font='17px Georgia';c.textAlign='center';c.fillStyle='#fff5df';c.fillText(String(game.index+1),l.hole+27,hy-88);
      if(l.switch&&!game.switched){this.ellipse(l.hole-25,hy-24,8,8,'#f5ebd5','#ad9366',1);this.path([[l.hole-27,hy-25],[l.hole-23,hy-25]],null,'#ad9366',2);}
      if(game.previousTrail.length){c.save();c.globalAlpha=.25;c.setLineDash([2,7]);this.path(game.previousTrail.map(p=>[p.x,p.y]),null,'#839477',1.4);c.restore();}
      if(game.state==='moving'){c.save();c.globalAlpha=.38;this.path(game.trail.map(p=>[p.x,p.y]),null,'#9bac8a',1.4);c.restore();}
      if(game.state==='ready'&&!game.paused){const preview=game.preview(aim.angle,aim.power);preview.forEach((p,i)=>{c.globalAlpha=(1-i/preview.length)*.65;this.ellipse(p.x,p.y,2.6,2.6,green,null);});c.globalAlpha=1;}
      const b=game.ball;if(game.state!=='won'){
        const ground=E.groundAt(l,b.x).y;const shadow=Math.max(.15,1-(ground-b.y)/300);c.save();c.globalAlpha=shadow*.3;this.ellipse(b.x,ground+2,13,3,'#657453',null);c.restore();
        const r=Math.max(E.RADIUS,4.5/s);if(game.state==='ready'){c.save();c.globalAlpha=.4;c.setLineDash([3,5]);this.ellipse(b.x,b.y,r+9,r+9,null,green,1);c.restore();}
        this.ellipse(b.x+1,b.y+1,r,r,'#fdfdf6','#526449',1.7);this.ellipse(b.x-2,b.y-2,r-3,r-3,null,'#d3dbc5',.7);
        for(let i=0;i<3;i++){const a=b.rotation+i*2;this.ellipse(b.x+Math.cos(a)*r*.43,b.y+Math.sin(a)*r*.43,1,1,'#b6c0a5',null);}
        if(drag){const a=aim.angle*Math.PI/180,dist=20+aim.power*.55;this.path([[b.x,b.y],[b.x-Math.cos(a)*dist,b.y+Math.sin(a)*dist]],null,'#be9f6e',2);this.ellipse(b.x-Math.cos(a)*dist,b.y+Math.sin(a)*dist,4,4,'#d4ba8a','#ab9065',1);}
      }
      for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=220*dt;c.save();c.globalAlpha=Math.max(0,p.life/p.max);c.translate(p.x,p.y);c.rotate(p.life*3);c.fillStyle=p.color;c.fillRect(-p.size/2,-p.size/2,p.size,p.size*.65);c.restore();}this.particles=this.particles.filter(p=>p.life>0);
      c.restore();
    }
    obstacle(r,fill,stroke){const c=this.ctx;this.path([[r.x,r.y],[r.x+r.w,r.y+1],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h-1]],fill,stroke,1.6,true);c.save();c.beginPath();c.rect(r.x+2,r.y+2,r.w-4,r.h-4);c.clip();for(let y=r.y-20;y<r.y+r.h;y+=13)this.path([[r.x,y+15],[r.x+r.w,y]],null,stroke,.7);c.restore();}
  }
  window.PaperGolfScene=Scene;
})();
