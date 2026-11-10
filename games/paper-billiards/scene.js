(() => {
  'use strict';
  const E=PaperBilliards;
  const COLORS=['#f7f5df','#e9b531','#2f65aa','#c54236','#714b87','#de7c35','#347b5b','#983d3b','#202c2a','#e9b531','#2f65aa','#c54236','#714b87','#de7c35','#347b5b','#983d3b'];
  const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);};
  const rounded=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
  class Scene {
    constructor(canvas) {
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.w=0;this.h=0;this.scale=1;this.rotated=false;
      this.table=document.createElement('canvas');this.table.width=E.W*2;this.table.height=E.H*2;
      const c=this.table.getContext('2d');c.scale(2,2);this.paintTable(c);
    }
    resize() {
      const box=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
      this.w=box.width;this.h=box.height;this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);
      this.dpr=dpr;this.rotated=this.h>this.w*1.05;
      this.scale=Math.min(this.w/(this.rotated?E.H:E.W),this.h/(this.rotated?E.W:E.H));
    }
    point(clientX,clientY) {
      const r=this.canvas.getBoundingClientRect(),x=(clientX-r.left-this.w/2)/this.scale,y=(clientY-r.top-this.h/2)/this.scale;
      return this.rotated?{x:y+E.W/2,y:-x+E.H/2}:{x:x+E.W/2,y:y+E.H/2};
    }
    paintTable(c) {
      c.save();c.shadowColor='#2c38264d';c.shadowBlur=24;c.shadowOffsetY=14;
      rounded(c,28,38,984,544,36);c.fillStyle='#3b3027';c.fill();c.restore();
      const wood=c.createLinearGradient(0,38,0,582);wood.addColorStop(0,'#98764e');wood.addColorStop(.025,'#b59262');wood.addColorStop(.08,'#674b32');wood.addColorStop(.47,'#856142');wood.addColorStop(.88,'#64462e');wood.addColorStop(1,'#3b2a20');
      rounded(c,28,38,984,544,36);c.fillStyle=wood;c.fill();c.save();c.clip();
      for(let i=0;i<160;i++) {
        const y=40+i*3.4;c.beginPath();c.moveTo(20,y);c.bezierCurveTo(240,y+Math.sin(i)*5,660,y-6,1030,y+Math.sin(i*2)*4);
        c.strokeStyle=i%3?'#e8ba7930':'#201a1426';c.lineWidth=i%5===0?1.3:.5;c.stroke();
      }
      c.restore();rounded(c,34,44,972,532,30);c.strokeStyle='#c4a26d80';c.lineWidth=1.5;c.stroke();
      rounded(c,45,55,950,508,27);c.strokeStyle='#251f1b99';c.lineWidth=3;c.stroke();
      rounded(c,57,66,926,488,20);c.fillStyle='#122f26';c.fill();
      const felt=c.createRadialGradient(480,270,60,520,310,540);felt.addColorStop(0,'#287c61');felt.addColorStop(.55,'#236d53');felt.addColorStop(1,'#174e3c');
      rounded(c,66,76,908,468,12);c.fillStyle=felt;c.fill();
      const noise=document.createElement('canvas');noise.width=128;noise.height=128;const nc=noise.getContext('2d');
      const pixels=nc.createImageData(128,128);let seed=3157;
      for(let i=0;i<pixels.data.length;i+=4) {seed=(seed*1664525+1013904223)>>>0;const n=seed%255;pixels.data[i]=n;pixels.data[i+1]=n;pixels.data[i+2]=n;pixels.data[i+3]=15;}
      nc.putImageData(pixels,0,0);c.save();rounded(c,66,76,908,468,12);c.clip();c.fillStyle=c.createPattern(noise,'repeat');c.fillRect(66,76,908,468);c.restore();
      c.strokeStyle='#d4e0be25';c.lineWidth=.8;c.beginPath();c.moveTo(280,102);c.lineTo(280,518);c.stroke();
      circle(c,280,310,2);c.fillStyle='#e1e9cd7a';c.fill();circle(c,695,310,2);c.fill();
      c.save();c.textAlign='center';c.fillStyle='#e4e7c615';c.font='17px Georgia';c.fillText('B O O P L A N D',520,292);c.font='8px Georgia';c.fillText('B I L L I A R D S   C L U B',520,310);c.restore();
      // Cushion faces have beveled ends; the collision segments use this same inner edge.
      const cushion=(points,vertical=false)=>{
        c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
        c.save();c.shadowColor='#092a2580';c.shadowBlur=7;c.shadowOffsetY=3;c.fillStyle='#164f3c';c.fill();c.restore();
        const g=vertical?c.createLinearGradient(points[0][0]-10,0,points[0][0]+12,0):c.createLinearGradient(0,points[0][1]-12,0,points[0][1]+12);
        g.addColorStop(0,'#3d8768');g.addColorStop(.5,'#2f7356');g.addColorStop(1,'#164734');c.fillStyle=g;c.fill();c.lineWidth=1;c.strokeStyle='#719e7660';c.stroke();
      };
      for(const y of [90,530]) {const o=y===90?-1:1;cushion([[116,y],[492,y],[503,y+17*o],[96,y+20*o]]);cushion([[548,y],[924,y],[944,y+20*o],[537,y+17*o]]);}
      for(const x of [80,960]) {const o=x===80?-1:1;cushion([[x,126],[x,494],[x+20*o,514],[x+20*o,106]],true);}
      // Leather liners sit below the rail, with a deep black throat and a quiet rim highlight.
      for(let i=0;i<E.POCKETS.length;i++) {
        const p=E.POCKETS[i];circle(c,p.x,p.y,26);c.fillStyle='#3c3022';c.fill();c.strokeStyle='#c19c606e';c.lineWidth=2;c.stroke();
        const hole=c.createRadialGradient(p.x-3,p.y-5,2,p.x,p.y,23);hole.addColorStop(0,'#060f0c');hole.addColorStop(.75,'#0b1812');hole.addColorStop(1,'#25372a');
        circle(c,p.x,p.y,22.5);c.fillStyle=hole;c.fill();c.beginPath();c.arc(p.x,p.y+2,19,.15,Math.PI-.15);c.strokeStyle='#88806424';c.lineWidth=2;c.stroke();
      }
      const diamond=(x,y)=>{c.beginPath();c.moveTo(x,y-3);c.lineTo(x+2.5,y);c.lineTo(x,y+3);c.lineTo(x-2.5,y);c.closePath();c.fillStyle='#c8b995';c.fill();};
      for(const x of [190,300,410,630,740,850]) {diamond(x,57);diamond(x,563);}
      for(const y of [200,310,420]) {diamond(48,y);diamond(992,y);}
      rounded(c,466,558,108,13,2);c.fillStyle='#b39a66';c.fill();c.font='7px Georgia';c.fillStyle='#4b4231';c.textAlign='center';c.fillText('P A P E R  B I L L I A R D S',520,567);
      for(const [x,y] of [[48,59],[992,59],[48,560],[992,560]]) {circle(c,x,y,2);c.fillStyle='#b7a47b';c.fill();c.strokeStyle='#534a38';c.lineWidth=.8;c.beginPath();c.moveTo(x-1,y);c.lineTo(x+1,y);c.stroke();}
    }
    drawBall(c,b,alpha=1,scale=1) {
      const r=E.R*scale;c.save();c.globalAlpha=alpha;
      c.save();c.translate(b.x+2.7,b.y+4);c.scale(1,.8);const shadow=c.createRadialGradient(0,0,2,0,0,r+5);shadow.addColorStop(0,'#00170db0');shadow.addColorStop(1,'#00170d00');circle(c,0,0,r+5);c.fillStyle=shadow;c.fill();c.restore();
      circle(c,b.x,b.y,r);c.fillStyle=COLORS[b.n];c.fill();c.save();c.clip();
      if(b.n>8) {c.translate(b.x,b.y);c.rotate(Math.sin(b.roll*.35)*.8);c.fillStyle='#f2f1e6';c.fillRect(-r,-r,r*2,r*.44);c.fillRect(-r,r*.56,r*2,r*.44);c.rotate(-Math.sin(b.roll*.35)*.8);c.translate(-b.x,-b.y);}
      if(b.n) {circle(c,b.x,b.y,r*.46);c.fillStyle='#f8f6e8';c.fill();c.save();c.translate(b.x,b.y);if(this.rotated)c.rotate(-Math.PI/2);c.fillStyle='#27342e';c.font=`bold ${r*.67}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(b.n,0,.8);c.restore();}
      const shade=c.createRadialGradient(b.x-r*.32,b.y-r*.38,r*.08,b.x+r*.05,b.y+r*.08,r*1.15);shade.addColorStop(0,'#ffffff65');shade.addColorStop(.42,'#ffffff06');shade.addColorStop(.75,'#0000000b');shade.addColorStop(1,'#061a13ae');circle(c,b.x,b.y,r);c.fillStyle=shade;c.fill();
      c.beginPath();c.ellipse(b.x-r*.3,b.y-r*.42,r*.29,r*.15,-.5,0,Math.PI*2);c.fillStyle='#fffff8bd';c.fill();c.restore();c.restore();
    }
    draw(s,angle,power,options={}) {
      const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);c.save();c.translate(this.w/2,this.h/2);c.scale(this.scale,this.scale);if(this.rotated)c.rotate(Math.PI/2);c.translate(-E.W/2,-E.H/2);
      c.drawImage(this.table,0,0,E.W,E.H);
      const cue=s.balls[0];
      if(s.phase==='aim'&&!options.paused) {
        const path=E.aim(s,angle),dx=Math.cos(angle),dy=Math.sin(angle);
        c.save();c.beginPath();c.rect(80,90,880,440);c.clip();
        c.setLineDash([5,7]);c.lineWidth=1.2;c.strokeStyle='#f5f4d998';c.beginPath();c.moveTo(cue.x+dx*16,cue.y+dy*16);c.lineTo(path.x,path.y);c.stroke();c.setLineDash([]);
        circle(c,path.x,path.y,E.R);c.strokeStyle='#f5f4d995';c.lineWidth=1;c.stroke();
        if(path.hit) {const tx=(path.hit.x-path.x)/(E.R*2),ty=(path.hit.y-path.y)/(E.R*2);c.strokeStyle=E.legalTarget(s,path.hit.n)?'#f4ecbda8':'#ecad8fc9';c.lineWidth=1.5;c.beginPath();c.moveTo(path.hit.x+tx*16,path.hit.y+ty*16);c.lineTo(path.hit.x+tx*95,path.hit.y+ty*95);c.stroke();const dot=dx*tx+dy*ty;const vx=dx-dot*tx,vy=dy-dot*ty;c.strokeStyle='#f5f4d94d';c.beginPath();c.moveTo(path.x,path.y);c.lineTo(path.x+vx*75,path.y+vy*75);c.stroke();}
        c.restore();
        // A tapered maple shaft with ferrule, blue chalk and a dark wrapped grip.
        c.save();c.translate(cue.x,cue.y);c.rotate(angle);const back=22+(options.dragging?power*75:power*15);
        const g=c.createLinearGradient(0,-5,0,5);g.addColorStop(0,'#795b33');g.addColorStop(.3,'#e3c794');g.addColorStop(.6,'#f0d7a8');g.addColorStop(1,'#9b7848');
        c.shadowColor='#041e1750';c.shadowBlur=3;c.shadowOffsetY=4;c.beginPath();c.moveTo(-back,-2.5);c.lineTo(-back-205,-5);c.lineTo(-back-205,5);c.lineTo(-back,2.5);c.closePath();c.fillStyle=g;c.fill();
        c.fillStyle='#eee5ca';c.fillRect(-back-8,-2.6,7,5.2);c.fillStyle='#70989e';c.fillRect(-back-2,-2.7,2.5,5.4);
        c.fillStyle='#46392e';c.fillRect(-back-205,-4.8,55,9.6);c.strokeStyle='#b1976b';c.lineWidth=1;c.strokeRect(-back-150,-4.4,3,8.8);c.restore();
      }
      for(const b of s.balls) if(b.active) this.drawBall(c,b);
      for(const p of options.effects||[]) {const t=p.age/.32;if(t<1){const dest=E.POCKETS[p.pocket];this.drawBall(c,{n:p.n,x:p.x+(dest.x-p.x)*t,y:p.y+(dest.y-p.y)*t,roll:0},1-t,1-t*.6);}}
      if(s.phase==='placing') {const p=options.placement||cue,valid=E.canPlace(s,p.x,p.y);this.drawBall(c,{...cue,x:p.x,y:p.y},.6);circle(c,p.x,p.y,18);c.setLineDash([3,4]);c.strokeStyle=valid?'#fff9c5':'#ed8a72';c.lineWidth=1.5;c.stroke();c.setLineDash([]);}
      c.restore();
    }
  }
  window.BilliardsScene={Scene,COLORS};
})();
