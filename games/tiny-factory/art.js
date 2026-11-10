(function () {
  'use strict';
  const E = TinyFactory;
  const colors = { plain: '#d9d5bc', red: '#dba798', blue: '#9ab8c6', yellow: '#ddc377', green: '#a3ba8e' };
  const ink = '#64705a';
  function icon(type) {
    const paths = {
      belt: '<rect x="3" y="6" width="26" height="20" rx="7"/><path d="m10 11 5 5-5 5m8-10 5 5-5 5M7 3h18M7 29h18"/>',
      cutter: '<circle cx="9" cy="8" r="4"/><circle cx="9" cy="24" r="4"/><path d="m12 11 14 14M12 21 26 6M17 16h1"/>',
      painter: '<path d="m12 4 10 4-4 11-10-4zM12 18l-3 9M6 27h7M23 21c0-3 3-6 3-6s3 3 3 6a3 3 0 0 1-6 0Z"/>',
      rotator: '<path d="M26 15A10 10 0 1 0 23 24M26 5v10H16"/><path d="m12 13 7 1-1 7-7-1Z"/>',
      erase: '<path d="m5 19 11-14q1-1 3 0l9 7q1 1 0 3L17 28H9l-4-4q-2-2 0-5ZM10 13l13 10M16 28h13"/>',
      source: '<path d="M5 10 16 5l11 5v15l-11 4-11-4ZM5 10l11 5 11-5M16 15v14M10 8l11 5"/>',
      hub: '<path d="M5 8h22v20H5zM11 16l4 4 7-8M9 4h14"/>'
    };
    return '<svg viewBox="0 0 32 32" aria-hidden="true">' + paths[type] + '</svg>';
  }
  function shapeSVG(item) {
    const fill = colors[item.color] || colors.plain;
    let parts = '';
    for (let i = 0; i < 4; i++) if (item.mask & (1 << i)) {
      const p = item.shape === 'circle' ? 'M32 32V10A22 22 0 0 1 54 32Z' : 'M32 32V11H53V32Z';
      parts += '<path d="' + p + '" transform="rotate(' + (i * 90) + ' 32 32)"/>';
    }
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="' + fill + '" stroke="#71745e" stroke-width="1.1" stroke-linejoin="round">' + parts + '</g>' + (item.mask & 1 ? '<path d="m36 17 3-2m-3 7 7-4m-7 9 11-6" fill="none" stroke="#fffef7" opacity=".35" stroke-width="1"/>' : '') + '</svg>';
  }
  function drawShape(ctx, item, x, y, r) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle=colors[item.color];ctx.strokeStyle='#676c56';ctx.lineWidth=Math.max(.7,r*.06);
    for(let i=0;i<4;i++) if(item.mask&(1<<i)) {
      ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);
      if(item.shape==='circle'){ctx.lineTo(0,-r);ctx.arc(0,0,r,-Math.PI/2,0);}
      else{ctx.lineTo(0,-r*.9);ctx.lineTo(r*.9,-r*.9);ctx.lineTo(r*.9,0);}
      ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
  function line(ctx, points, color=ink, width=1) {
    ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function arrow(ctx,x,y,dir,size=5,color=ink){ctx.save();ctx.translate(x,y);ctx.rotate(dir*Math.PI/2);line(ctx,[[-size,-size],[size,0],[-size,size]],color,1.2);ctx.restore();}
  class Renderer {
    constructor(canvas,space){this.canvas=canvas;this.space=space;this.ctx=canvas.getContext('2d');this.resize();}
    resize(){
      const rect=this.space.getBoundingClientRect(),padding=innerWidth<=760?8:24;
      const w=Math.max(80,rect.width-padding),h=Math.max(80,rect.height-padding);
      this.vertical=h>w*1.18;this.cols=this.vertical?E.H:E.W;this.rows=this.vertical?E.W:E.H;
      this.cell=Math.min(w/this.cols,h/this.rows,95);this.width=this.cell*this.cols;this.height=this.cell*this.rows;
      const dpr=Math.min(devicePixelRatio||1,2);
      this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);
      this.canvas.style.width=this.width+'px';this.canvas.style.height=this.height+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    point(x,y){return this.vertical?[(E.H-1-y+.5)*this.cell,(x+.5)*this.cell]:[(x+.5)*this.cell,(y+.5)*this.cell];}
    direction(dir){return(dir+(this.vertical?1:0))%4;}
    cellAt(clientX,clientY){const r=this.canvas.getBoundingClientRect(),c=Math.floor((clientX-r.left)/r.width*this.cols),row=Math.floor((clientY-r.top)/r.height*this.rows);if(c<0||c>=this.cols||row<0||row>=this.rows)return null;return this.vertical?{x:row,y:E.H-1-c}:{x:c,y:row};}
    draw(state,options){
      const ctx=this.ctx,c=this.cell;
      ctx.clearRect(0,0,this.width,this.height);ctx.lineCap='round';ctx.lineJoin='round';
      ctx.fillStyle='#f2f2e8';ctx.fillRect(0,0,this.width,this.height);
      for(let x=0;x<=this.cols;x++)line(ctx,[[x*c,0],[x*c,this.height]],'#dfe1d2',.6);
      for(let y=0;y<=this.rows;y++)line(ctx,[[0,y*c],[this.width,y*c]],'#dfe1d2',.6);
      for(let x=0;x<this.cols;x++)for(let y=0;y<this.rows;y++){
        ctx.fillStyle='#c3c9b6';ctx.beginPath();ctx.arc(x*c+c*.5,y*c+c*.5,.7,0,Math.PI*2);ctx.fill();
      }
      if(options.hint){
        const plan=E.blueprint(state.level);
        ctx.save();ctx.setLineDash([3,5]);ctx.beginPath();
        const start=this.point(0,E.ORDERS[state.level].shape==='circle'?1:5);ctx.moveTo(...start);
        for(const p of plan)ctx.lineTo(...this.point(p.x,p.y));ctx.lineTo(...this.point(10,3));
        ctx.strokeStyle='#a7b493';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
        for(const p of plan)if(!state.board[E.at(p.x,p.y)]){
          ctx.globalAlpha=.36;this.tile(p,p.x,p.y,0,true);
        }ctx.restore();
      }
      state.board.forEach((tile,i)=>{if(tile)this.tile(tile,i%E.W,Math.floor(i/E.W),options.running?state.clock:0,false);});
      state.slots.forEach((slot,i)=>{
        if(!slot)return;const tile=state.board[i],[x,y]=this.point(i%E.W,Math.floor(i/E.W));
        const from=E.DIRS[this.direction(slot.from)],to=E.DIRS[this.direction(tile.dir)];
        const p=slot.progress;let ox=0,oy=0;
        if(p<.5){ox=from[0]*(.5-p)*c*.74;oy=from[1]*(.5-p)*c*.74;}
        else{ox=to[0]*(p-.5)*c*.74;oy=to[1]*(p-.5)*c*.74;}
        if(tile.type==='source'){ox=to[0]*p*c*.3;oy=to[1]*p*c*.3;}
        ctx.save();ctx.shadowColor='#424c4022';ctx.shadowBlur=2;ctx.shadowOffsetY=2;drawShape(ctx,slot.item,x+ox,y+oy,c*.18);ctx.restore();
      });
      for(const effect of options.effects){const [x,y]=this.point(10,3);ctx.save();ctx.globalAlpha=Math.max(0,effect.life);ctx.strokeStyle=effect.good?'#8fa57e':'#c49783';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,c*(.3+(1-effect.life)*.45),0,Math.PI*2);ctx.stroke();ctx.restore();}
      if(options.hover){
        const {x,y}=options.hover,[px,py]=this.point(x,y);ctx.save();ctx.fillStyle='#94a78022';ctx.fillRect(px-c/2+1,py-c/2+1,c-2,c-2);ctx.setLineDash([4,3]);ctx.strokeStyle=options.tool==='erase'?'#b18a78':'#7e916c';ctx.lineWidth=1.5;ctx.strokeRect(px-c/2+2,py-c/2+2,c-4,c-4);ctx.setLineDash([]);
        if(!E.fixed(E.at(x,y))){ctx.globalAlpha=.5;this.tile({type:options.tool,dir:options.dir,color:options.color},x,y,0,true);}ctx.restore();
      }
    }
    tile(tile,gx,gy,time,ghost){
      const ctx=this.ctx,c=this.cell,[x,y]=this.point(gx,gy),r=c*.405,dir=this.direction(tile.dir||0);
      ctx.save();ctx.translate(x,y);
      if(tile.type==='erase'){line(ctx,[[-r*.5,-r*.5],[r*.5,r*.5]],'#ad806c',2);line(ctx,[[r*.5,-r*.5],[-r*.5,r*.5]],'#ad806c',2);ctx.restore();return;}
      const fills={belt:'#e6e7d9',cutter:'#e3dfce',painter:'#e8d9ce',rotator:'#dce4d7',source:'#dce5d1',hub:'#d6e1cc'};
      ctx.fillStyle=fills[tile.type];ctx.strokeStyle=tile.type==='belt'?'#a4ac96':'#879276';ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(-r,-r,r*2,r*2,[5,3,6,3]);if(!ghost){ctx.save();ctx.shadowColor='#65764a16';ctx.shadowOffsetY=2;ctx.fill();ctx.restore();}else ctx.fill();ctx.stroke();
      line(ctx,[[-r+3,-r+2],[r-4,-r+1]],'#fffdf5',.8);
      if(tile.type==='belt'){
        ctx.save();ctx.rotate(dir*Math.PI/2);line(ctx,[[-r+4,-r*.72],[r-4,-r*.72]],'#9fa88d',1);line(ctx,[[-r+4,r*.72],[r-4,r*.72]],'#9fa88d',1);
        ctx.beginPath();ctx.rect(-r+3,-r*.6,r*2-6,r*1.2);ctx.clip();const shift=(time*14)%(c*.28);
        for(let n=-2;n<3;n++)arrow(ctx,n*c*.28+shift,0,0,c*.075,'#a2ac93');ctx.restore();
      }else if(tile.type==='source'){
        drawShape(ctx,{shape:tile.shape,color:'plain',mask:15},0,-c*.04,c*.20);
        line(ctx,[[-r*.65,r*.64],[r*.3,r*.64]],'#93a17d');arrow(ctx,Math.cos(dir*Math.PI/2)*r*.85,Math.sin(dir*Math.PI/2)*r*.85,dir,c*.06);
      }else if(tile.type==='hub'){
        ctx.strokeStyle='#71875f';ctx.strokeRect(-r*.57,-r*.56,r*1.14,r*1.12);
        line(ctx,[[-r*.34,-r*.02],[-r*.08,r*.24],[r*.43,-r*.32]],'#617c50',2);line(ctx,[[-r*.3,-r*.76],[r*.3,-r*.76]],'#7d9369',2);
      }else{
        if(tile.type==='cutter'){
          ctx.save();ctx.rotate(-.2+Math.sin(time*7)*.05);const k=c*.12;
          ctx.strokeStyle='#827f6b';ctx.beginPath();ctx.arc(-k,-k*.8,k*.42,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(-k,k*.8,k*.42,0,Math.PI*2);ctx.stroke();
          line(ctx,[[-k*.6,-k*.5],[k*1.55,k*1.3]],'#827f6b',1.5);line(ctx,[[-k*.6,k*.5],[k*1.55,-k*1.3]],'#827f6b',1.5);ctx.restore();
        }else if(tile.type==='painter'){
          ctx.save();ctx.rotate(.3);ctx.fillStyle=colors[tile.color]||colors.red;ctx.strokeStyle='#897765';ctx.fillRect(-c*.14,-c*.19,c*.28,c*.24);ctx.strokeRect(-c*.14,-c*.19,c*.28,c*.24);line(ctx,[[0,c*.05],[0,c*.22]],'#897765',2.5);ctx.restore();
        }else{ctx.beginPath();ctx.arc(0,0,c*.18,-Math.PI*.8,Math.PI*.8);ctx.strokeStyle='#7a906a';ctx.lineWidth=1.5;ctx.stroke();arrow(ctx,-c*.13,c*.1,2,c*.055,'#7a906a');}
        const [dx,dy]=E.DIRS[dir];arrow(ctx,dx*r*.81,dy*r*.81,dir,c*.065,'#6c795d');
      }
      if(!ghost&&tile.type!=='belt'){for(const [sx,sy]of[[-1,-1],[1,1]]){ctx.beginPath();ctx.arc(sx*(r-4),sy*(r-4),.8,0,Math.PI*2);ctx.fillStyle='#a3aa95';ctx.fill();}}
      ctx.restore();
    }
  }
  window.FactoryArt={colors,icon,shapeSVG,Renderer};
})();
