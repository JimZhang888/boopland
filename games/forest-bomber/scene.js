(function () {
  'use strict';
  const E = window.ForestBomber, CELL = 56, W = E.WIDTH * CELL, H = E.HEIGHT * CELL;
  const ink = '#66735b';
  function path(c, points, fill, stroke = ink, width = 1.3) {
    c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    if (fill) { c.closePath(); c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function ellipse(c, x, y, rx, ry, fill, stroke) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.2; c.stroke(); }
  }
  function tree(c, x, y, scale, variant) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    path(c, [[-3, 5], [-3, 22], [3, 22], [3, 5]], '#ada181', '#829170', 1);
    const color = variant ? '#b7c6a1' : '#c3d0af';
    path(c, [[0, -24], [-13, -5], [-7, -6], [-20, 13], [-7, 11], [0, 15], [20, 12], [8, -6], [14, -5]], color, '#869876');
    path(c, [[-1,-15],[0,8]], null, '#91a17e', .8);
    path(c, [[-9,3],[-5,0],[-6,6]], null, '#9cac8b', .7);
    path(c, [[-13,15],[10,17]], null, '#dce5ca', .9); c.restore();
  }
  function rock(c, x, y, n) {
    c.save(); c.translate(x, y);
    ellipse(c, 1, 17, 22, 7, '#889b7124');
    path(c, [[-22,7],[-17,-14],[-4,-21],[15,-17],[23,-3],[20,16],[5,21],[-17,18]], n > .5 ? '#bdc7b0' : '#c7cebb', '#8d9b7d');
    path(c, [[-17,-11],[-3,-17],[13,-14]], null, '#e7ebdd', 1.5);
    path(c, [[13,-13],[10,-6],[17,2]], null, '#a3af95', .8);
    path(c, [[-16,13],[-6,16],[0,12],[10,16]], null, '#91a67e', 2.6);
    path(c, [[-10,10],[-7,5],[-4,10],[1,7]], null, '#a6b794', 1);
    c.restore();
  }
  function crate(c, x, y, n) {
    c.save(); c.translate(x, y); c.rotate((n-.5)*.025);
    ellipse(c, 1, 21, 23, 5, '#6e69451a');
    path(c, [[-23,-20],[20,-22],[23,21],[-22,22]], '#d9bf8d', '#9b8863');
    path(c, [[-18,-16],[16,-17],[18,16],[-17,17]], '#e3cda2', '#baa276', 1);
    path(c, [[-7,-17],[-6,16],[4,16],[3,-17]], null, '#c5ac7d', 1);
    path(c, [[-21,-17],[-17,-21],[21,17],[17,21]], '#d4b681', '#ab9369', 1);
    path(c, [[16,-21],[21,-16],[-16,22],[-21,17]], '#d9bd89', '#ab9369', 1);
    for(const [dx,dy] of [[-17,-16],[16,-16],[-16,17],[17,17]]) ellipse(c,dx,dy,1.2,1.2,'#927d58');
    path(c, [[-15,-10],[-14,-5]], null, '#f5e5c4', 1.4); c.restore();
  }
  function item(c, type, x, y, t) {
    c.save(); c.translate(x, y + Math.sin(t*2.5)*1.2);
    const colors = { capacity: ['#e4ebd5','#748467'], range: ['#f1e4b7','#aa8c45'], speed: ['#deebe7','#759493'], shield: ['#e9e1ec','#9c86a7'] };
    const [fill,line] = colors[type];
    ellipse(c,0,17,15,4,'#63725517');
    path(c,[[-17,-14],[14,-17],[18,15],[-14,18]],fill,line,1.4);
    if(type==='capacity') { ellipse(c,-2,2,8,9,'#74826a'); path(c,[[0,-7],[2,-11],[5,-12]],null,line,1.6); path(c,[[7,-3],[14,-3],[10.5,-7],[10.5,1]],null,line,1.5); }
    if(type==='range') path(c,[[0,-12],[3,-3],[12,0],[4,4],[0,13],[-4,4],[-12,0],[-3,-3]],'#d3b264',line);
    if(type==='speed') { path(c,[[-8,-9],[0,-9],[0,3],[8,6],[7,12],[-8,12]],'#9eb9b4',line); path(c,[[-13,-1],[-10,-1],[-13,4],[-11,4]],null,line,1.5); }
    if(type==='shield') { path(c,[[0,-12],[10,-8],[9,4],[0,13],[-9,4],[-10,-8]],'#c7b7d0',line); path(c,[[0,-7],[0,7],[-4,1],[0,4],[5,-2]],null,'#f9f4fa',1.4); }
    c.restore();
  }
  function animal(c, a, t, reduced) {
    const p=E.position(a), x=(p.x+.5)*CELL, y=(p.y+.5)*CELL;
    const bounce = !reduced && a.moveLeft > 0 ? Math.sin((1-a.moveLeft/a.moveDuration)*Math.PI)*3 : 0;
    c.save(); c.translate(x,y);
    ellipse(c,0,19,17,5,'#5b6d4930');
    c.translate(0,-bounce);
    if(a.invincibleUntil>t && Math.floor(t*12)%2) c.globalAlpha=.48;
    const fill=['#d7a678','#9fb9bb','#d9b4a7','#b8c59b'][a.id], line=['#927752','#6e898d','#a4897c','#7c906d'][a.id];
    // A soft paper body, tiny feet and a scarf keep every rival distinct.
    ellipse(c,-6,17,5,3,line); ellipse(c,7,17,5,3,line);
    path(c,[[-12,2],[-14,14],[-3,19],[12,14],[11,1]],fill,line,1.2);
    if(a.id===0) {
      path(c,[[9,7],[21,-1],[24,11],[16,17],[8,13]],fill,line);
      path(c,[[21,-1],[24,11],[19,8]],'#fff4db',null);
      path(c,[[-19,-9],[-21,-28],[-5,-18],[6,-18],[21,-28],[18,-8],[13,5],[0,12],[-13,5]],fill,line,1.3);
      path(c,[[-17,-12],[-18,-22],[-10,-17]],'#b88867',null);
      path(c,[[10,-17],[18,-22],[17,-12]],'#b88867',null);
      path(c,[[-18,-7],[-3,-2],[0,3],[4,-2],[18,-8],[12,5],[0,11],[-12,5]],'#fff2d6',null);
    } else {
      if(a.id===2) { ellipse(c,-9,-24,6,15,fill,line); ellipse(c,9,-24,6,15,fill,line); path(c,[[-9,-33],[-9,-18]],null,'#b99591',2); path(c,[[9,-33],[9,-18]],null,'#b99591',2); }
      else { ellipse(c,-14,-20,7,7,fill,line); ellipse(c,14,-20,7,7,fill,line); ellipse(c,-14,-20,3,3,'#f0efda'); ellipse(c,14,-20,3,3,'#f0efda'); }
      ellipse(c,0,-6,20,18,fill,line);
      if(a.id===1) { ellipse(c,-9,-7,8,5,'#728e91'); ellipse(c,9,-7,8,5,'#728e91'); }
      ellipse(c,0,2,11,8,'#f3efd9');
    }
    let dx= a.facing===1?1.6:a.facing===3?-1.6:0, dy=a.facing===0?-1.5:0;
    ellipse(c,-8+dx,-8+dy,1.8,2.1,'#3f4d41'); ellipse(c,8+dx,-8+dy,1.8,2.1,'#3f4d41');
    path(c,[[-2,0],[2,0],[0,3]],'#535c49',null);
    path(c,[[-11,10],[0,14],[12,9],[11,16],[1,20],[-12,15]],a.id===0?'#7f9c72':'#f3ecd4',line,1);
    path(c,[[7,16],[13,17],[10,25],[5,20]],a.id===0?'#7f9c72':'#e4dabb',line,1);
    if(a.shield){c.globalAlpha=.7;c.strokeStyle='#9a82b0';c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();c.ellipse(0,-3,27,33,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}
    if(a.id===0){path(c,[[-4,-37],[0,-32],[4,-37]],'#6a8557','#506b45',1);}
    c.restore();
  }
  class Scene {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.base=document.createElement('canvas');this.base.width=W;this.base.height=H;this.cached='';this.particles=[];this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
    resize(w,h){const ratio=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(w*ratio);this.canvas.height=Math.round(h*ratio);}
    terrain(s){
      const signature=`${s.seed}:${s.stage}:${s.boxes}`;if(signature===this.cached)return;this.cached=signature;
      const c=this.base.getContext('2d');c.lineJoin='round';c.lineCap='round';c.fillStyle='#e7ecd9';c.fillRect(0,0,W,H);
      for(let y=0;y<E.HEIGHT;y++)for(let x=0;x<E.WIDTH;x++){
        const n=((x*97+y*31+s.seed)%97)/97,cx=(x+.5)*CELL,cy=(y+.5)*CELL;
        c.fillStyle=(x+y)%2?'#e8ecd8':'#e3e9d1';c.fillRect(x*CELL,y*CELL,CELL,CELL);
        c.strokeStyle='#c7d1b563';c.lineWidth=.7;c.strokeRect(x*CELL+.5,y*CELL+.5,CELL-1,CELL-1);
        if(s.tiles[y][x]===E.FLOOR){
          const gx=x*CELL+11+n*28,gy=y*CELL+13+n*25;
          path(c,[[gx-4,gy-3],[gx,gy+3],[gx+1,gy-6]],null,'#aabd955a',1);
          if((x*3+y)%11===0){ellipse(c,cx+15,cy-12,2,2,'#ded7b1');ellipse(c,cx+16,cy-15,1.5,1.5,'#faf4d5');}
        }
        if(s.tiles[y][x]===E.WALL){if(!x||!y||x===E.WIDTH-1||y===E.HEIGHT-1)tree(c,cx,cy,0.85+n*.15,n>.5);else rock(c,cx,cy,n);}
        if(s.tiles[y][x]===E.CRATE)crate(c,cx,cy,n);
      }
      // Fine fixed grain gives the shapes a pencil-on-paper surface without flicker.
      c.fillStyle='#4856370b';for(let i=0;i<5000;i++){const x=(i*137.23)%W,y=(i*79.71)%H;c.fillRect(x,y,.7,.7);}
    }
    effect(event){if(this.reduced)return;const colors=event.type==='crate'?['#b79b6c','#dec799','#a8b68f']:['#c5a35b','#eed7a1','#a8b98d'];
      const count=event.type==='explode'?10:event.type==='crate'?6:0;
      for(let i=0;i<count;i++)this.particles.push({x:(event.x+.5)*CELL,y:(event.y+.5)*CELL,vx:Math.cos(i*2.4)*70,vy:Math.sin(i*2.4)*70-20,life:.5,max:.5,color:colors[i%colors.length]});}
    draw(s,dt){
      this.terrain(s);const c=this.ctx;c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.clearRect(0,0,W,H);c.lineJoin='round';c.lineCap='round';c.drawImage(this.base,0,0);
      for(const b of s.bombs)if(b.explodeAt-s.time<.75){c.fillStyle='#d3aa6630';for(const p of E.blastCells(s,b))if(s.tiles[p.y][p.x]!==E.CRATE)c.fillRect(p.x*CELL+3,p.y*CELL+3,CELL-6,CELL-6);}
      for(const i of s.items)if(i.readyAt<=s.time)item(c,i.type,(i.x+.5)*CELL,(i.y+.5)*CELL,this.reduced?0:s.time);
      for(const b of s.bombs){c.save();c.translate((b.x+.5)*CELL,(b.y+.5)*CELL);const left=b.explodeAt-s.time,pulse=this.reduced?1:1+Math.sin(s.time*(left<.8?22:8))*.035;c.scale(pulse,pulse);
        ellipse(c,0,16,19,5,'#6370502b');ellipse(c,0,2,17,18,b.ownerId===0?'#60765a':'#77766b','#465b45');
        path(c,[[-8,-6],[-5,-9]],null,'#cbd8b4',2.2);path(c,[[3,-15],[6,-23],[12,-26]],null,'#a48954',2);
        path(c,[[12,-30],[12,-24],[16,-27],[9,-26]],null,'#be9552',1.3);
        c.strokeStyle=left<.75?'#bf8656':'#b5c199';c.lineWidth=2;c.beginPath();c.arc(0,2,21,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,left)/E.FUSE);c.stroke();
        c.fillStyle='#f4f0d8';c.font='13px Georgia';c.textAlign='center';c.fillText(String(Math.max(1,Math.ceil(left))),0,7);c.restore();}
      for(const f of s.flames){const life=Math.min(1,(f.until-s.time)/.2);c.save();c.globalAlpha=life;c.translate((f.x+.5)*CELL,(f.y+.5)*CELL);
        path(c,[[-24,-16],[-14,-23],[-4,-18],[5,-25],[15,-18],[25,-12],[19,-3],[25,8],[16,21],[5,18],[-4,25],[-17,18],[-24,6],[-19,-4]],'#e7c17e','#c79859',1);
        path(c,[[-17,-7],[-8,-12],[-2,-8],[4,-18],[10,-7],[17,-1],[10,5],[12,14],[2,11],[-5,16],[-10,5],[-16,3]],'#fae9b5',null);c.restore();}
      for(const a of [...s.actors].sort((a,b)=>E.position(a).y-E.position(b).y))if(a.alive)animal(c,a,s.time,this.reduced);
      this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;c.globalAlpha=Math.max(0,p.life/p.max);c.fillStyle=p.color;c.fillRect(p.x,p.y,4,2);}c.globalAlpha=1;
    }
  }
  window.ForestScene={Scene};
})();
