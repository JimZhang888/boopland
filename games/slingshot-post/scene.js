(() => {
  'use strict';
  const E = SlingshotPost;
  const ink = '#6e7763', green = '#708763', light = '#dce5d0', paper = '#fffdf5';
  class Scene {
    constructor(canvas, stage) {
      this.canvas = canvas; this.stage = stage; this.ctx = canvas.getContext('2d'); this.particles = [];
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(stage); this.resize();
    }
    resize() {
      const box = this.stage.getBoundingClientRect(), scale = Math.max(.01, Math.min(box.width / E.WIDTH, box.height / E.HEIGHT));
      this.scale = scale; this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.style.width = E.WIDTH * scale + 'px'; this.canvas.style.height = E.HEIGHT * scale + 'px';
      this.canvas.width = Math.round(E.WIDTH * scale * this.dpr); this.canvas.height = Math.round(E.HEIGHT * scale * this.dpr);
      if (this.last) this.draw(...this.last, 0);
    }
    point(event) {
      const box = this.canvas.getBoundingClientRect();
      return { x: (event.clientX - box.left) * E.WIDTH / box.width, y: (event.clientY - box.top) * E.HEIGHT / box.height };
    }
    path(points, color = ink, width = 1.5, fill = null, close = false) {
      const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      if (close) c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); }
      if (color) { c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
    }
    circle(x, y, r, fill, stroke = ink, width = 1.5) {
      const c = this.ctx; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
      if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    }
    round(x, y, w, h, r, fill, stroke = ink, width = 1.5) {
      const c = this.ctx; c.beginPath(); c.roundRect(x, y, w, h, r);
      if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    }
    cloud(x, y, scale) {
      const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale); c.beginPath();
      c.moveTo(-50, 11); c.bezierCurveTo(-76, 7, -56, -17, -40, -10); c.bezierCurveTo(-40, -41, 8, -42, 16, -14);
      c.bezierCurveTo(37, -29, 62, -2, 50, 9); c.bezierCurveTo(20, 15, -20, 14, -50, 11);
      c.fillStyle = '#f0f0e6'; c.fill(); c.strokeStyle = '#ced3c2'; c.lineWidth = 1.15; c.stroke(); c.restore();
    }
    grass(x, y, scale = 1) {
      const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale);
      this.path([[-8,0],[-11,-10],[-4,-5],[0,-17],[3,-5],[11,-11],[8,0]], '#a0ad8c', 1.3); c.restore();
    }
    tree(x, y, s = 1) {
      const c = this.ctx; c.save(); c.translate(x, y); c.scale(s, s);
      c.beginPath(); c.moveTo(-23,-30); c.bezierCurveTo(-63,-66,-22,-138,6,-124); c.bezierCurveTo(33,-129,60,-66,30,-37); c.quadraticCurveTo(6,-22,-23,-30);
      c.fillStyle = '#d8dfc9'; c.fill(); c.strokeStyle = '#a7b592'; c.lineWidth = 1.25; c.stroke();
      this.path([[0,0],[2,-98]], '#9aa284', 2); this.path([[1,-52],[-19,-73]], '#9aa284'); this.path([[2,-68],[21,-92]], '#9aa284'); c.restore();
    }
    scenery(game) {
      const c = this.ctx; c.fillStyle = paper; c.fillRect(0,0,E.WIDTH,E.HEIGHT);
      const t = this.reduced ? 0 : game.time;
      this.circle(776, 92, 31, '#ece6c8', null); this.circle(778,91,35,null,'#ddd7b9',.7);
      for (let i = 0; i < 10; i++) { const a=i*Math.PI/5; this.path([[776+Math.cos(a)*44,92+Math.sin(a)*44],[776+Math.cos(a)*50,92+Math.sin(a)*50]],'#d9d0a9',1); }
      this.cloud(195 + Math.sin(t*.16)*8,119,.84); this.cloud(533+Math.sin(t*.12+1)*9,85,.62); this.cloud(903,170,.45);
      c.beginPath(); c.moveTo(0,440); c.bezierCurveTo(106,335,144,392,245,355); c.bezierCurveTo(350,284,357,305,460,369); c.bezierCurveTo(600,302,649,217,751,302); c.bezierCurveTo(846,320,913,374,1000,359); c.lineTo(1000,505); c.lineTo(0,505); c.closePath(); c.fillStyle='#eff0e3'; c.fill();
      c.beginPath(); c.moveTo(0,444); c.bezierCurveTo(191,378,273,407,431,433); c.bezierCurveTo(624,482,733,360,1000,412); c.lineTo(1000,510); c.lineTo(0,510); c.fillStyle='#e5ebd9'; c.fill();
      c.beginPath(); c.moveTo(590,401); c.bezierCurveTo(642,359,684,368,718,344); c.strokeStyle='#cbd6bc'; c.lineWidth=1.2; c.stroke();
      this.tree(72,473,.62); this.tree(948,478,.85); this.tree(715,390,.4);
      // A faraway house is kept faint so it cannot be mistaken for a solid obstacle.
      c.save(); c.globalAlpha=.55; this.path([[664,370],[664,335],[685,318],[709,337],[708,370]],'#b4b9a4',1,'#e8e7d9',true); this.path([[657,339],[685,315],[714,340]],'#a9af99',1.5); this.round(681,349,12,21,1,'#cdd5c1',null); c.restore();
      c.beginPath(); c.moveTo(0,503); c.bezierCurveTo(290,496,428,509,652,501); c.bezierCurveTo(770,496,890,509,1000,502); c.lineTo(1000,560); c.lineTo(0,560); c.fillStyle='#eff0df'; c.fill(); c.strokeStyle='#adb99b'; c.lineWidth=1.5; c.stroke();
      this.path([[0,507],[130,505],[252,509],[380,508]],'#c6cfb6',.65);
      for (const [x,y,s] of [[35,525,.7],[237,511,.6],[315,533,.6],[710,523,.75],[906,525,.65],[975,511,.5]]) this.grass(x,y,s);
      for(let i=0;i<20;i++) { const x=(i*137+63)%1000,y=519+(i*17)%30; this.path([[x,y],[x+4,y-1]],'#ccd2be',.8); }
      this.path([[116,530],[190,533],[214,528],[297,531]],'#d0c6ac',1.5);
      if(game.level.wind) {
        const dir=Math.sign(game.level.wind); c.strokeStyle='#bdc9b3'; c.lineWidth=1.2;
        for(let i=0;i<5;i++) { const x=180+((i*163+t*dir*25+850)%680),y=179+(i*61)%130;
          c.beginPath(); c.moveTo(x,y); c.bezierCurveTo(x+12,y-6,x+35,y+5,x+48,y); c.stroke();
          this.path([[x+(dir>0?44:4),y-3],[x+(dir>0?49:0),y],[x+(dir>0?44:4),y+3]],'#bdc9b3',1);
        }
      }
      // Little envelope sign by the launch pad.
      this.path([[52,482],[52,439]],'#9da48c',2); this.round(27,422,50,29,3,'#f5efda','#adb39a',1.2);
      this.path([[35,430],[52,440],[69,430]],'#9ba68b',1); this.path([[35,443],[45,435]],'#b8bea7',.8);
    }
    parcel(x, y, rotation = 0, size = 27) {
      const c=this.ctx; c.save(); c.translate(x,y); c.rotate(rotation); const s=size/2;
      this.round(-s,-s,size,size,2,'#d9bd91','#8c795c',1.6);
      this.path([[-s+3,-s+3],[s-2,-s+2],[s-3,s-3]],'#b79a70',.6);
      c.fillStyle='#f3e6c4'; c.fillRect(-3,-s,6,size); this.path([[-3,-s],[-3,s]],'#bbab85',.6);
      this.round(3,-5,8,8,1,'#faf5e8',null); this.path([[5,-2],[9,-2]],'#b1aa94',.7); c.restore();
    }
    sling(aim, dragging, phase) {
      const c=this.ctx, o=E.ORIGIN;
      c.save(); c.beginPath(); c.ellipse(o.x,501,47,8,0,0,Math.PI*2); c.fillStyle='#d6dcc6'; c.fill();
      this.path([[o.x,495],[o.x+1,430],[o.x-24,394]],'#81775b',15); this.path([[o.x+1,432],[o.x+28,388]],'#81775b',13);
      this.path([[o.x-2,493],[o.x-2,430],[o.x-26,394]],'#b7a37c',10); this.path([[o.x+2,431],[o.x+28,388]],'#c0ab83',8);
      this.path([[o.x-4,482],[o.x-3,439]],'#8f8266',.8); this.path([[o.x+10,419],[o.x+21,401]],'#8f8266',.7);
      for(let i=0;i<4;i++){this.path([[o.x-30,396+i*3],[o.x-19,392+i*3]],'#a09373',1);this.path([[o.x+21,390+i*3],[o.x+32,392+i*3]],'#96876a',1);}
      const rad=aim.angle*Math.PI/180, stretch=dragging?aim.power*.92:0;
      const p={x:o.x-Math.cos(rad)*stretch,y:o.y+Math.sin(rad)*stretch};
      this.path([[o.x-23,397],[p.x,p.y]],'#8d7965',4);
      if(phase==='ready') this.parcel(p.x,p.y,-.12,29);
      this.path([[p.x,p.y+3],[o.x+28,390]],'#a48b70',3);
      this.path([[p.x-8,p.y+8],[p.x+9,p.y+8]],'#7f7159',4); c.restore();
    }
    obstacle(r, shutter = false) {
      const c=this.ctx;
      this.round(r.x,r.y,r.w,r.h,3,shutter?'#d4b8a1':'#d7d5bf',shutter?'#a08067':'#969c84',1.7);
      if(shutter){
        for(let y=r.y+12;y<r.y+r.h;y+=20)this.path([[r.x+4,y],[r.x+r.w-4,y-7]],'#b49278',1.2);
        this.circle(r.x+r.w/2,r.y+r.h/2,4,'#f2e9d4','#a08067',1);
      }else{
        for(let y=r.y+18;y<r.y+r.h;y+=23){this.path([[r.x+2,y],[r.x+r.w-2,y-1]],'#b4b89e',1); const x=r.x+(Math.round(y)%2?r.w*.35:r.w*.65);this.path([[x,y],[x+1,Math.min(y+23,r.y+r.h)]],'#b4b89e',.8);}
        this.path([[r.x-3,r.y+1],[r.x+r.w+3,r.y]],'#8f9b7d',3);
      }
    }
    board(pad) {
      const c=this.ctx; c.save(); c.translate(pad.x1,pad.y1); const angle=Math.atan2(pad.y2-pad.y1,pad.x2-pad.x1),w=Math.hypot(pad.x2-pad.x1,pad.y2-pad.y1); c.rotate(angle);
      for(const x of [23,w-23])this.path([[x,4],[x-9,11],[x+8,17],[x-8,23],[x+7,29],[x,36]],'#9ca58b',1.5);
      this.round(-3,-3,w+6,9,3,'#91a880','#6b825c',1.5); this.path([[3,0],[w-6,-1]],'#c2d2ac',1.2);
      this.path([[w/2-12,-15],[w/2,-25],[w/2+12,-15]],'#94a382',1.6); this.path([[w/2,-25],[w/2,-10]],'#94a382',1.6); c.restore();
    }
    mailbox(game) {
      const c=this.ctx,t=E.targetAt(game.level,game.time),l=game.level,eligible=game.eligible();
      this.path([[t.x+9,E.GROUND],[t.x+9,t.y+30]],'#92967b',9); this.path([[t.x+7,E.GROUND-2],[t.x+7,t.y+37]],'#b4b79c',4);
      if(l.target.amplitude){c.save();c.setLineDash([3,6]);this.path([[t.x+59,l.target.y-l.target.amplitude],[t.x+59,l.target.y+l.target.amplitude]],'#b7c0a4',1);c.restore();this.path([[t.x+55,l.target.y-l.target.amplitude+5],[t.x+59,l.target.y-l.target.amplitude],[t.x+63,l.target.y-l.target.amplitude+5]],'#a3b293',1);}
      this.round(t.x-48,t.y-45,96,82,[20,23,6,5],'#8fa17b','#667a58',2);
      this.round(t.x-41,t.y-27,82,59,[9,11,3,4],eligible?'#465e45':'#7a8067','#5c7051',1.4);
      c.save();c.globalAlpha=.3;this.path([[t.x-34,t.y+24],[t.x-34,t.y-15],[t.x+31,t.y-15]],'#d1dbbc',1);c.restore();
      this.path([[t.x-47,t.y+37],[t.x+47,t.y+37]],'#a8b897',3);
      this.round(t.x-20,t.y-41,40,11,1,'#e9eddb',null);this.path([[t.x-12,t.y-36],[t.x+12,t.y-36]],'#839475',.8);
      this.path([[t.x+47,t.y-15],[t.x+47,t.y-65]],'#8d8063',2); this.path([[t.x+47,t.y-65],[t.x+71,t.y-63],[t.x+69,t.y-48],[t.x+47,t.y-49]],'#ae7e65',1,'#c69e86',true);
      if(!eligible){this.circle(t.x,t.y,13,'#d8d9b8','#b7bea1',1); this.path([[t.x-5,t.y-2],[t.x-5,t.y-7],[t.x+5,t.y-7],[t.x+5,t.y-2]],'#858d70',2);this.round(t.x-7,t.y-2,14,10,2,'#9aa384',null);}
      else if(game.state!=='won'){this.path([[t.x-13,t.y+3],[t.x-2,t.y+3],[t.x-2,t.y-7],[t.x+11,t.y],[t.x-2,t.y+8]],'#c4d4b5',2);}
      let ix=t.x-18;
      if(l.bounce){this.circle(ix,t.y-61,10,game.bounces?'#94aa7c':'#f2efdc','#9ba88c',1); this.path([[ix-4,t.y-59],[ix,t.y-64],[ix+4,t.y-59]],game.bounces?'#fffdf0':'#9ba88c',1.5);ix+=26;}
      if(l.switch){this.circle(ix,t.y-61,10,game.switched?'#94aa7c':'#f2efdc','#9ba88c',1);this.circle(ix,t.y-61,3,game.switched?'#fffdf0':'#c0a26a',null);}
      if(game.state==='won')this.parcel(t.x,t.y,.1,23);
    }
    mechanism(game) {
      const c=this.ctx,l=game.level;
      if(l.switch){
        const s=l.switch;
        c.save();c.setLineDash([3,7]);this.path([[s.x,s.y+30],[s.x,E.GROUND-8],[l.gate.x+12,E.GROUND-8]],game.switched?'#a6b78c':'#c7c5ac',1.3);c.restore();
        this.circle(s.x,s.y,s.r+6,'#eee8d2','#b1aa87',1.3); this.circle(s.x,s.y,s.r,game.switched?'#99ae83':'#d8bd7e',game.switched?'#789061':'#a9905b',1.5);
        if(game.switched)this.path([[s.x-9,s.y],[s.x-2,s.y+7],[s.x+11,s.y-8]],'#fbfaf0',2.5);
        else{this.circle(s.x,s.y,8,'#f5e8bd','#b29b65',1);this.path([[s.x-4,s.y],[s.x+4,s.y]],'#a88b50',1);}
        c.save();c.setLineDash([4,6]);this.path([[l.gate.x+l.gate.w/2,105],[l.gate.x+l.gate.w/2,500]],'#b7bea9',1);c.restore();
        if(!game.switched)this.obstacle(l.gate,true);else{this.round(l.gate.x,102,l.gate.w,25,3,'#cbd6b8','#96a584');this.path([[l.gate.x+5,115],[l.gate.x+10,120],[l.gate.x+18,110]],'#788d61',1.5);}
      }
      if(l.shutter){const r=E.shutterAt(l,game.time);c.save();c.setLineDash([4,7]);this.path([[r.x+r.w/2,165],[r.x+r.w/2,550]],'#c6bfa8',1);c.restore();this.obstacle(r,true);this.circle(r.x+r.w/2,157,7,'#eee8d2','#b7ad93');}
    }
    burst(x,y,type) {
      const count=this.reduced?5:type==='win'?36:10;
      for(let i=0;i<count;i++){const a=i*2.39996,s=30+(i*37)%120;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-65,life:1.2+(i%4)*.1,max:1.6,color:['#9caa80','#d5b97c','#ba927e','#b1beb2'][i%4],spin:i});}
    }
    draw(game, aim, dragging, delta = 0) {
      this.last=[game,aim,dragging];const c=this.ctx;
      c.setTransform(this.canvas.width/E.WIDTH,0,0,this.canvas.height/E.HEIGHT,0,0);c.lineCap='round';c.lineJoin='round';
      this.scenery(game);
      if(game.trail.length>1){c.save();c.globalAlpha=.7;this.path(game.trail.map(p=>[p.x,p.y]),'#c6baa0',1.4);c.restore();}
      for(const r of game.level.obstacles)this.obstacle(r);
      for(const p of game.level.pads)this.board(p);
      this.mechanism(game);this.mailbox(game);
      if(game.state==='ready' && !game.paused){
        const cacheKey=[game.index,aim.angle,aim.power,Math.floor(game.time*8)].join(':');
        if(this.previewKey!==cacheKey){this.previewKey=cacheKey;this.preview=E.preview(game.index,aim.angle,aim.power,game.time);}
        c.save();for(let i=0;i<this.preview.length;i++){const p=this.preview[i];c.globalAlpha=.6*(1-i/this.preview.length)+.1;this.circle(p.x,p.y,Math.max(1.5,3.4-i*.07),'#7c8b6b',null);}c.restore();
      }
      this.sling(aim,dragging,game.state);
      if(game.ball && game.state==='flying')this.parcel(game.ball.x,game.ball.y,game.ball.rotation,26);
      for(const p of this.particles){p.life-=delta;p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=120*delta;c.save();c.globalAlpha=Math.max(0,p.life/p.max);c.translate(p.x,p.y);c.rotate(p.spin+p.life*2);c.fillStyle=p.color;c.fillRect(-3,-2,6,4);c.restore();}
      this.particles=this.particles.filter(p=>p.life>0);
    }
  }
  window.SlingshotScene=Scene;
})();
