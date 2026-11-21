(() => {
  'use strict';
  const {edges} = window.Slalom;
  const ink = '#455c59', pine = '#607e70', warm = '#b76849', blue = '#4c797e';
  const TAU = Math.PI * 2;
  const noise = n => {const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v);};
  function path(ctx, points, color, fill, width = 1, closed = false) {
    ctx.beginPath();points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    if (closed) ctx.closePath();
    if (fill) {ctx.fillStyle = fill;ctx.fill();}
    if (color) {ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
  }
  function oval(ctx,x,y,rx,ry,color,angle=0) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,TAU);ctx.fillStyle=color;ctx.fill();
  }
  function fir(ctx,x,y,k,variant) {
    ctx.save();ctx.translate(x,y);ctx.scale(k,k);
    oval(ctx,-5,3.8,12,3.4,'#79958a50',-.18);
    path(ctx,[[-1,3],[.4,-23]],'#596458',null,2.1);
    const skew=(variant-.5)*3;
    const outline=[[skew,-36],[-5,-25],[-2.8,-25.7],[-8,-16],[-5.3,-17.3],[-11,-5],[-7.2,-7],[-12.6,-.2],[-5,1],[0,-1.3],[4,1],[11.9,-1.4],[7,-8],[9,-7],[4.8,-17],[6.7,-16.3],[2,-25],[3.5,-24.5]];
    path(ctx,outline,'#526e63',variant>.48?'#698775':'#819989',.78,true);
    path(ctx,[[skew,-36],[-4.6,-25.4],[-1.6,-27],[-3.8,-21.4],[1.2,-26.1],[3,-24.7]],null,'#e5eadd',1,true);
    path(ctx,[[-3.3,-22],[-8,-16],[-5.2,-17.6],[-3.2,-16.5],[1,-21.6]],null,'#d5dfd1',1,true);
    path(ctx,[[-5.6,-12.9],[-10.8,-5],[-7.1,-6.4],[-4.5,-6.2],[1.1,-13.3]],null,'#d7dfd1',1,true);
    path(ctx,[[1,-19],[3.7,-14.6],[1.4,-16.1],[4.2,-9.6]],'#506f60',null,.7);
    path(ctx,[[-6,-3.8],[-2.5,-5.2],[.5,-8.9]],'#526f60',null,.65);
    ctx.restore();
  }
  function rocks(ctx,x,y,k) {
    ctx.save();ctx.translate(x,y);ctx.scale(k,k);
    oval(ctx,-1,2,12,3.6,'#a8b9ad');
    path(ctx,[[-11,1],[-8,-4],[-2,-8],[6,-7],[11,-1],[7,2],[0,3]],'#788d82','#c3cec2',.7,true);
    path(ctx,[[-8,-4],[-2,-8],[6,-7],[7,-5],[1,-3],[-2,-4],[-7,-2]],null,'#f4f4e8',1,true);
    path(ctx,[[0,1],[3,-2],[7,-3]],'#8a9b8f',null,.75);ctx.restore();
  }
  function drift(ctx, d) {
    ctx.save();ctx.translate(d.x,d.y);ctx.scale(d.radius/16,d.radius/16);
    oval(ctx,-1,3,17,7,'#b9cbc5',-.1);
    ctx.beginPath();ctx.moveTo(-17,3);ctx.bezierCurveTo(-15,-2,-11,-5,-7,-5);ctx.bezierCurveTo(0,-12,11,-9,16,-1);ctx.quadraticCurveTo(17,4,11,5);ctx.quadraticCurveTo(3,11,-7,7);ctx.closePath();ctx.fillStyle='#f8f9ef';ctx.fill();ctx.strokeStyle='#899f97';ctx.lineWidth=.85;ctx.stroke();
    path(ctx,[[-9,6],[-3,5],[2,2],[7,2]],'#a0b3a9',null,.8);
    path(ctx,[[7,5],[10,3]],'#9caea4',null,.7);ctx.restore();
  }
  function hut(ctx,x,y) {
    ctx.save();ctx.translate(x,y);ctx.rotate(-.12);
    oval(ctx,-6,4,24,5,'#81988e65');
    path(ctx,[[-15,-12],[1,-17],[16,-8],[16,3],[1,9],[-15,2]],ink,'#b39073',.85,true);
    path(ctx,[[0,-12],[16,-8],[16,3],[1,9]],ink,'#a2775d',.7,true);
    path(ctx,[[2,7],[2,-2],[7,-3],[7,5]],ink,'#586c67',.7,true);
    path(ctx,[[-13,-6],[-6,-4],[-6,0],[-13,-2]],ink,'#d7ddd0',.65,true);
    path(ctx,[[-19,-10],[-11,-25],[4,-30],[20,-11],[1,-5]],ink,'#eaf0e6',1,true);
    path(ctx,[[-11,-25],[1,-5],[-19,-10]],ink,'#d4dfd3',.85,true);
    path(ctx,[[-6,-22],[6,-10],[16,-12]],'#92a79b',null,.7);
    path(ctx,[[3,-26],[3,-33],[7,-34],[8,-28]],ink,'#899488',.7,true);ctx.restore();
  }
  function terrain(ctx,c,top,bottom,half) {
    const polygon = (pts,fill) => path(ctx,pts,null,fill,1,true);
    ctx.fillStyle='#eef2e9';ctx.fillRect(-half,top,half*2,bottom-top);
    for(const side of [-1,1]) {
      // Each contour follows the piste, with more relief farther into the forest.
      for(let band=0;band<7;band++) {
        const pts=[];
        for(let y=Math.floor((top-15)/8)*8;y<=bottom+16;y+=8) {
          const edge=edges(c,y)[side<0?0:1];
          const undulation=Math.sin(y/38+side*.8+band*.27)*(3+band*1.8)+Math.sin(y/17+band)*1.3;
          pts.push([edge+side*(band*11+undulation),y]);
        }
        if(band===0||band===2||band===5) polygon([...pts,[side*(half+130),pts.at(-1)[1]],[side*(half+130),pts[0][1]]],['#dae5db','','#d0dfd4','','','#bdcfc2'][band]);
        path(ctx,pts,band===0?'#98aea2':'#a5b9ac',null,band===0?1.05:.56);
      }
    }
    // Flecks are seeded by world position, so every retry and camera movement agrees.
    for(let row=Math.floor(top/18)-1;row<=Math.ceil(bottom/18);row++) {
      for(let col=-Math.ceil(half/32);col<=Math.ceil(half/32);col++) {
        const seed=row*311+col*7, x=col*32+noise(seed)*29, y=row*18+noise(seed+1)*17;
        const a=noise(seed+2);
        path(ctx,[[x,y],[x+2+a*5,y-.35-a*.6]],a<.45?'#b4c5ba70':'#ffffffa0',null,.6);
        if(a>.88) path(ctx,[[x+2,y+2],[x+5,y+1.6]],'#b8c8be8a',null,.55);
      }
    }
    const objects=[];
    for(let row=Math.floor((top-12)/30);row<=Math.ceil((bottom+61)/30);row++) {
      for(const side of [-1,1]) for(let col=0;col<=Math.ceil(half/34);col++){
        const seed=row*219+col*11+side*717+(c.id==='pines'?191:c.id==='pass'?53:0);
        const y=row*30+noise(seed+1)*25, edge=edges(c,y)[side<0?0:1];
        const x=edge+side*(12+col*29+noise(seed+2)*20);
        if(Math.abs(x)>half+20)continue;
        const a=noise(seed+3);
        if(a<.31&&col===0||a<.15) continue;
        if (side<0 && y>-77 && y<-8 && Math.abs(x+155)<30) continue;
        objects.push({x,y,k:.65+noise(seed+4)*.68,a,rock:a>.91});
      }
    }
    objects.sort((a,b)=>a.y-b.y);
    for(const o of objects) o.rock?rocks(ctx,o.x,o.y,o.k):fir(ctx,o.x,o.y,o.k,o.a);
    if(top<0&&bottom>-86)hut(ctx,-145,-25);
    for(const d of c.drifts) if(d.y>top-28&&d.y<bottom+28)drift(ctx,d);
  }
  function flag(ctx,x,y,dir,color) {
    oval(ctx,x-3,y+1,4.8,1.3,'#90a79b80',-.25);
    path(ctx,[[x,y],[x+dir*.8,y-17]],ink,null,1.45);
    const a=x+dir*.8;
    path(ctx,[[a,y-17],[a+dir*8.9,y-16.6],[a+dir*12,y-13.2],[a+dir*9,y-10],[a+dir*.3,y-10.6]],color,color,.7,true);
    path(ctx,[[a+dir*2,y-15.3],[a+dir*8,y-15]],'#fff6e1',null,.65);
  }
  function gate(ctx,g,i,status,next) {
    const left=g.x-g.width/2, right=g.x+g.width/2;
    const color=i%2===0?warm:blue;
    ctx.save();ctx.setLineDash([2.4,3.1]);path(ctx,[[left,g.y],[right,g.y]],next?'#8a9d91':'#bbc8be',null,.8);ctx.restore();
    flag(ctx,left,g.y,-1,color);flag(ctx,right,g.y,1,color);
    ctx.font='bold 8px Consolas, monospace';ctx.textAlign='center';ctx.fillStyle=ink;
    ctx.fillText(String(i+1).padStart(2,'0'),left-8,g.y+9);
    if(next||status!==undefined){
      const x=g.x,y=g.y-2;
      if(next){path(ctx,[[x-3,y-6],[x,y-3],[x+3,y-6]],color,null,1.3);path(ctx,[[x-3,y-10],[x,y-7],[x+3,y-10]],color,null,1);}
      else if(status)path(ctx,[[x-3,y-2],[x-1,y],[x+4,y-5]],pine,null,1.5);
      else{path(ctx,[[x-3,y-4],[x+3,y+2]],warm,null,1.4);path(ctx,[[x+3,y-4],[x-3,y+2]],warm,null,1.4);}
    }
  }
  function stripe(ctx,c,y,finish) {
    const [l,r]=edges(c,y), x1=l+12,x2=r-12;
    path(ctx,[[x1,y],[x2,y]],'#90a499',null,.7);
    for(let x=x1;x<x2;x+=10) {
      ctx.fillStyle=finish?'#526e65':'#95aa9e';
      ctx.fillRect(x,y,Math.min(5,x2-x),2.8);
      if(x+5<x2)ctx.fillRect(x+5,y+2.8,Math.min(5,x2-x-5),2.8);
    }
    flag(ctx,x1,y,-1,finish?ink:pine);flag(ctx,x2,y,1,finish?ink:pine);
  }
  function skier(ctx,s) {
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-s.angle);
    oval(ctx,-3,1.5,9.5,7.5,'#7e998c55',-.1);
    for(const side of [-1,1]){
      const x=side*3.8;
      path(ctx,[[x,-11],[x+.2,7.2],[x+side*.7,11.5]],'#405855',null,2.75);
      path(ctx,[[x,-10],[x,8],[x+side*.7,11.2]],'#e6c6a4',null,1.15);
      path(ctx,[[side*6.5,-.6],[side*10.3,-11]],'#5a6e67',null,.85);
      oval(ctx,side*10.3,-10.4,1.25,.65,'#607369');
    }
    path(ctx,[[-3.4,-3.5],[-4.1,1.2],[-3.7,4.5]],ink,null,2.8);
    path(ctx,[[3.4,-3.2],[4.1,1.4],[3.8,4.5]],ink,null,2.8);
    path(ctx,[[-4.5,-5.3],[-6.6,-2],[-7,1]],ink,null,3.2);
    path(ctx,[[3.8,-5.4],[6.8,-3.3],[7.9,-.9]],ink,null,3.2);
    path(ctx,[[-4.8,-5.5],[-6.5,-2.3]],'#be7556',null,2.7);
    path(ctx,[[3.9,-5.5],[6.9,-3]],'#be7556',null,2.7);
    oval(ctx,0,-3.8,4.5,5.6,ink);oval(ctx,.1,-3.9,4.1,5,'#b96549');
    path(ctx,[[-2.6,-5.5],[-1.6,-1.4]],'#e0a77d',null,1.15);
    oval(ctx,.3,-.1,3.6,3.6,ink);oval(ctx,.5,-.6,3,2.8,'#f0d9ac');
    path(ctx,[[-2.1,.6],[.6,1.3],[3.2,.5]],'#4c6767',null,1.05);
    ctx.restore();
  }
  function tracks(ctx,s) {
    for(const side of [-1,1]){
      ctx.beginPath();ctx.moveTo(-78,-136);ctx.bezierCurveTo(-94,-92,side*3.6,-62,side*3.6,0);
      for(const p of s.trail)ctx.lineTo(p.x+side*3.6*Math.cos(p.angle),p.y-side*3.6*Math.sin(p.angle));
      ctx.lineTo(s.x+side*3.6*Math.cos(s.angle),s.y-side*3.6*Math.sin(s.angle));
      ctx.strokeStyle='#879f979c';ctx.lineWidth=1.15;ctx.stroke();
    }
  }
  function createScene(canvas) {
    const ctx=canvas.getContext('2d',{alpha:false});
    let width=1,height=1,scale=1,ratio=1,tiles=new Map(),courseId='';
    function resize() {
      const r=canvas.getBoundingClientRect();
      width=r.width;height=r.height;ratio=Math.min(2,window.devicePixelRatio||1);
      canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
      scale=Math.min(width/352,Math.max(.68,height/346));tiles.clear();
    }
    function draw(s,mode) {
      if(!width||!height||scale<=0)return;
      const c=s.course, anchor=height*.27, top=s.y-anchor/scale, bottom=top+height/scale;
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineCap='round';ctx.lineJoin='round';
      if(c.id!==courseId){tiles.clear();courseId=c.id;}
      const tileSize=160, pixels=scale*ratio;
      for(let i=Math.floor(top/tileSize);i<=Math.floor(bottom/tileSize);i++) {
        let tile=tiles.get(i);
        if(!tile) {
          tile=document.createElement('canvas');tile.width=canvas.width;tile.height=Math.ceil(tileSize*pixels)+2;
          const tc=tile.getContext('2d');tc.setTransform(pixels,0,0,pixels,tile.width/2,-i*tileSize*pixels+1);tc.lineJoin='round';tc.lineCap='round';
          terrain(tc,c,i*tileSize-1/pixels,(i+1)*tileSize+2/pixels,width/(2*scale)+1);
          tiles.set(i,tile);
        }
        const y=Math.round((i*tileSize-top)*pixels), end=Math.round(((i+1)*tileSize-top)*pixels);
        ctx.drawImage(tile,0,1,tile.width,tileSize*pixels,0,y/ratio,width,(end-y)/ratio);
      }
      ctx.save();ctx.translate(width/2,anchor);ctx.scale(scale,scale);ctx.translate(0,-s.y);
      if(top < -9)stripe(ctx,c,-10,false);
      if(bottom>c.finish-20)stripe(ctx,c,c.finish,true);
      if(mode==='ready'){
        ctx.save();ctx.beginPath();ctx.moveTo(0,3);let previous={x:0,y:3};
        for(const g of c.gates){if(previous.y>bottom)break;const gap=(g.y-previous.y)*.48;ctx.bezierCurveTo(previous.x,previous.y+gap,g.x,g.y-gap,g.x,g.y);previous=g;}
        ctx.setLineDash([2.1,5]);ctx.lineWidth=1.25;ctx.strokeStyle='#a2b4a6';ctx.stroke();ctx.restore();
      }
      tracks(ctx,s);
      c.gates.forEach((g,i)=>{if(g.y>=top-12&&g.y<bottom+20)gate(ctx,g,i,s.results[i],i===s.next);});
      skier(ctx,s);ctx.restore();
      // A small elevation strip gives a finish reference even on the shortest viewports.
      const xx=width-12, y1=height*.16, span=height*.68, yy=y1+span*s.y/c.finish;
      path(ctx,[[xx,y1],[xx,y1+span]],'#fafaf0d9',null,4);
      path(ctx,[[xx,y1],[xx,y1+span]],'#58716a',null,.8);
      for(const g of c.gates){const y=y1+g.y/c.finish*span;path(ctx,[[xx-2.3,y],[xx+2.3,y]],'#6d8176',null,.85);}
      path(ctx,[[xx-3,y1+span],[xx+3,y1+span]],ink,null,1.25);
      oval(ctx,xx,yy,4,4,'#fbf8e8');oval(ctx,xx,yy,2.7,2.7,warm);
    }
    return {resize,draw};
  }
  window.createSlalomScene=createScene;
})();
