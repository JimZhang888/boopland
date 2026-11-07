(function () {
  'use strict';
  const E = window.PaperBridge;
  const INK = '#59614e', GREEN = '#6c805d';
  function create(canvas, translate) {
    const ctx = canvas.getContext('2d');
    let view = { scale: 1, x: 0, y: 0, width: 960, height: 560, dpr: 1 };
    const line = (points, color = INK, width = 1.3, dash = []) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]);
    };
    function polygon(points, fill, stroke = INK, width = 1.2) {
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    }
    function circle(x, y, r, fill, stroke = INK, width = 1.2) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    }
    function text(value, x, y, size = 13, color = INK, align = 'center', hand = false) {
      ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.font = `${hand ? 'italic ' : ''}${size}px ${hand ? '"KaiTi", Georgia, serif' : '"Segoe UI", "Microsoft YaHei", sans-serif'}`;
      ctx.fillText(value, x, y);
    }
    function tree(x, y, size = 1) {
      ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
      line([[0,0],[-1,-54]],'#8a977b',1.2);
      polygon([[-18,-15],[-6,-31],[-13,-29],[-2,-48],[0,-64],[13,-39],[8,-39],[20,-18]],'#dce3cd','#9ca88d',1);
      line([[-12,-23],[-1,-27],[13,-21]],'#a6b095',.8); line([[0,-53],[2,-14]],'#97a387',.8);
      ctx.restore();
    }
    function terrain(level, time, reduced) {
      const l = level.left, r = level.right;
      // Quiet pencil scenery; the grid remains unobstructed where construction happens.
      ctx.globalAlpha = .52;
      polygon([[-100,320],[30,260],[110,285],[180,247],[275,282],[365,308],[480,270],[585,300],[705,257],[780,273],[885,236],[1060,300],[1060,410],[-100,410]],'#e5e9d9',null);
      line([[-80,315],[32,263],[110,288],[180,250],[277,285]],'#ccd4bc',1);
      line([[683,279],[780,276],[884,239],[1000,288]],'#c8d0b8',1);
      ctx.globalAlpha = 1;
      polygon([[l-20,450],[l+62,437],[l+137,449],[l+240,438],[r-35,445],[r+55,454],[r+45,560],[l-40,560]],'#e6eeeb',null);
      const drift = reduced ? 0 : Math.sin(time * .5) * 8;
      for (let row = 0; row < 4; row++) {
        const y = 472 + row * 22;
        for (let x = l + 20 + row % 2 * 35; x < r - 25; x += 90) {
          ctx.beginPath(); ctx.moveTo(x + drift, y); ctx.quadraticCurveTo(x + 17 + drift, y - 4, x + 36 + drift, y - 1); ctx.strokeStyle = '#bdcfca'; ctx.lineWidth = .9; ctx.stroke();
        }
      }
      polygon([[-100,320],[l-13,319],[l+3,324],[l-5,350],[l+10,378],[l-1,411],[l+14,440],[l+4,467],[l-26,490],[-100,530]],'#e9e5d5','#b4b39d',1.3);
      polygon([[r+2,321],[1060,320],[1060,530],[r+30,494],[r-7,467],[r+2,441],[r-9,411],[r+4,377],[r-5,347]],'#e9e5d5','#b4b39d',1.3);
      polygon([[-100,316],[l-15,315],[l+2,320],[l-8,329],[-100,327]],'#dce5ce','#a2b18e',.8);
      polygon([[r-1,319],[r+13,315],[1060,316],[1060,328],[r+7,328]],'#dce5ce','#a2b18e',.8);
      for (let i=0; i<16; i++) {
        const y = 347 + i * 8, offset = i % 3 * 5;
        line([[l-35-offset,y],[l-18-offset,y-11]],'#c6c3ac',.8);
        line([[r+21+offset,y],[r+39+offset,y-10]],'#c6c3ac',.8);
      }
      line([[-60,319],[l-4,321]],'#6e775f',1.5); line([[r+5,321],[1010,319]],'#6e775f',1.5);
      line([[l-120,333],[l-47,333]],'#c1c7af',.8); line([[r+45,334],[r+114,334]],'#c1c7af',.8);
      tree(l-143,315,.85); tree(l-173,317,.55); tree(r+155,315,.9); tree(r+187,316,.6);
      for (const [x,y] of level.anchors.filter(a=>a[1]<E.DECK)) {
        polygon([[x-9,DECK],[x-5,y-9],[x+5,y-9],[x+10,DECK]],'#e8e5d5','#a5a894',1.2);
        line([[x-5,DECK-10],[x+4,y+16]],'#b5b39e',.8); line([[x-4,y+52],[x+6,y+96],[x-5,y+136]],'#b2b29d',1);
        line([[x-14,DECK],[x+15,DECK]],INK,1.5);
      }
      if(level.anchors.some(a=>a[1]>DECK)) {
        polygon([[421,405],[438,398],[519,399],[535,406],[547,467],[525,484],[423,481],[410,465]],'#e4e2d0','#aeb49d',1.2);
        polygon([[420,406],[437,396],[522,398],[535,406]],'#d9e1c9','#a7b297',1);
        for(let i=0;i<7;i++) line([[427+i*14,437],[437+i*14,422]],'#c0c3ad',.8);
      }
      // Span ruler, kept well below the lowest buildable row.
      line([[l,521],[r,521]],'#9da998',.8,[4,5]); line([[l,515],[l,527]],'#9da998',.8); line([[r,515],[r,527]],'#9da998',.8);
      ctx.fillStyle='#e6eeeb'; ctx.fillRect((l+r)/2-31,511,62,20); text(`${(r-l)/40} m`,(l+r)/2,521,12,'#7a8c7d','center',true);
      flag(r+67,DECK,translate('finishFlag'),true); flag(l-97,DECK,translate('startFlag'),false);
    }
    const DECK = E.DECK;
    function flag(x,y,label,end) {
      line([[x,y-2],[x-1,y-76]],'#7e886e',1.5);
      polygon([[x,y-76],[x+28,y-70],[x+25,y-50],[x,y-55]],end?'#bccca4':'#e4d3aa','#8d9c7b',1);
      line([[x+3,y-73],[x+25,y-68]],'#fffdf188',.8);
      if(end) { line([[x+8,y-65],[x+13,y-60],[x+22,y-68]],'#648058',1.7); }
      text(label,x+3,y-88,11,'#7f8b72','center',true);
    }
    function member(a,b,type,options={}) {
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
      const normal={x:-dy/length,y:dx/length};
      let color=type==='rope'?'#7f9697':type==='road'?'#9e8562':'#b29369';
      if(options.stress!==undefined) color=options.stress>.83?'#b56b55':options.stress>.56?'#b6a161':'#82956d';
      if(options.ghost) {
        ctx.globalAlpha=options.active?.55:.16;
        line([[a.x,a.y],[b.x,b.y]],options.active?color:'#7b896a',options.active?2:1.5,[5,6]);
        circle(a.x,a.y,3,'#fffdf4',color,1);circle(b.x,b.y,3,'#fffdf4',color,1);
        ctx.globalAlpha=1;return;
      }
      if(options.broken) {
        const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        ctx.globalAlpha=.65;
        line([[a.x,a.y],[m.x-dx*.1+normal.x*6,m.y-dy*.1+normal.y*6]],'#b4816b',type==='road'?6:3);
        line([[m.x+dx*.1-normal.x*4,m.y+dy*.1-normal.y*4],[b.x,b.y]],'#b4816b',type==='road'?6:3);
        ctx.globalAlpha=1;return;
      }
      if(type==='rope') {
        const slack=options.rest?Math.max(0,options.rest-length):0;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+Math.min(35,Math.sqrt(slack)*3)+2,b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=2.1;ctx.stroke();
        line([[a.x+normal.x*2,a.y+normal.y*2],[b.x+normal.x*2,b.y+normal.y*2]],'#fffdf366',.6,[2,8]);
      } else {
        const w=type==='road'?8:5;
        line([[a.x,a.y],[b.x,b.y]],'#776f5d',w+1.6);
        line([[a.x,a.y],[b.x,b.y]],color,w);
        line([[a.x+normal.x*1.5,a.y+normal.y*1.5],[b.x+normal.x*1.5,b.y+normal.y*1.5]],'#fff9e68c',.8);
        if(type==='road') for(let t=.2;t<.95;t+=.2) {
          const x=a.x+dx*t,y=a.y+dy*t;
          line([[x-normal.x*2.7,y-normal.y*2.7],[x+normal.x*3,y+normal.y*3]],'#7d715c',.7);
        }
      }
      if(options.hover) line([[a.x,a.y],[b.x,b.y]],'#b76e56',2,[4,5]);
    }
    function car(x,y,angle,heavy,time) {
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.fillStyle='#6b775916';ctx.beginPath();ctx.ellipse(1,15,34,4,0,0,Math.PI*2);ctx.fill();
      const fill=heavy?'#c1cba9':'#b6c8ac';
      polygon([[-33,4],[-34,-11],[-27,-12],[-22,-27],[7,-28],[18,-13],[29,-10],[32,3]],fill,INK,1.4);
      polygon([[-21,-24],[-25,-13],[-7,-13],[-6,-24]],'#edf1e3','#7e8e70',1);
      polygon([[-2,-24],[-3,-13],[14,-13],[5,-24]],'#edf1e3','#7e8e70',1);
      line([[-5,-10],[-5,3]],'#8b9c7d',.9);line([[-1,-8],[4,-8]],INK,.9);
      polygon([[-26,-8],[-12,-8],[-12,0],[-26,0]],'#f0eedc','#88977b',.7);
      line([[-26,-8],[-19,-3],[-12,-8]],'#8b9377',.7);
      if(heavy) {polygon([[-24,-29],[-24,-40],[-4,-40],[-4,-29]],'#d9c69f','#9c8d70',1);line([[-14,-40],[-14,-29]],'#ad9a76',1);}
      circle(-20,5,8,'#5e6557','#535b4a',1);circle(20,5,8,'#5e6557','#535b4a',1);
      circle(-20,5,3.5,'#dddcc8',null);circle(20,5,3.5,'#dddcc8',null);
      for(const wx of [-20,20]) line([[wx+Math.cos(time*7)*2,5+Math.sin(time*7)*2],[wx-Math.cos(time*7)*2,5-Math.sin(time*7)*2]],'#839076',1);
      line([[28,-7],[32,-6]],'#f7efc6',3);line([[-31,-6],[-33,-6]],'#b58364',2);
      line([[-28,8],[-24,10]],'#6e755e',.7);ctx.restore();
    }
    function draw(model) {
      const bounds=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
      const width=Math.max(1,bounds.width),height=Math.max(1,bounds.height);
      if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
      const {level,design,simulation,selected,cursor,hint,tool}=model;
      const narrow=width<600;
      const frame=narrow?{left:level.left-145,top:60,width:level.right-level.left+290,height:480}:{left:0,top:0,width:E.WIDTH,height:E.HEIGHT};
      const scale=Math.min(width/frame.width,height/frame.height);
      view={width,height,scale,x:(width-frame.width*scale)/2-frame.left*scale,y:(height-frame.height*scale)/2-frame.top*scale,dpr};
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(view.x,view.y);ctx.scale(scale,scale);ctx.lineCap='round';ctx.lineJoin='round';
      terrain(level,model.time,model.reduced);
      if(!simulation) {
        for(let x=level.left;x<=level.right;x+=40)for(let y=80;y<=440;y+=40){if((x===level.left||x===level.right)&&y>320)continue;circle(x,y,1.25,'#a9b29a88',null);}
        if(hint)for(const e of E.example(level)) {
          if(design.some(d=>(E.distance(d.a,e.a)<1&&E.distance(d.b,e.b)<1)||(E.distance(d.b,e.a)<1&&E.distance(d.a,e.b)<1)))continue;
          member(e.a,e.b,e.type,{ghost:true,active:e.type===tool});
        }
        design.forEach((e,i)=>member(e.a,e.b,e.type,{hover:i===model.hoverEdge&&tool==='erase'}));
        const unique=new Map();design.forEach(e=>[e.a,e.b].forEach(p=>unique.set(`${p.x},${p.y}`,p)));
        unique.forEach(p=>circle(p.x,p.y,4,'#fffaf0','#737d62',1.3));
      } else {
        simulation.edges.forEach(e=>member(simulation.nodes[e.a],simulation.nodes[e.b],e.type,{stress:e.stress,broken:e.broken,rest:e.length}));
        simulation.nodes.forEach(p=>circle(p.x,p.y,3.4,'#fffaf0','#7c876f',1));
      }
      for(const a of E.anchors(level)) {
        circle(a.x,a.y,9,'#faf8eb','#708160',1.5);circle(a.x,a.y,4,'#849773',null);
        line([[a.x-2,a.y-13],[a.x+3,a.y-12]],'#8b9b78',.8);
      }
      if(!simulation&&!design.length) {
        line([[level.left-11,333],[level.left-29,361],[level.left-86,361]],'#a1aa93',.9);
        text(translate('anchor'),level.left-82,375,10,'#8d977f');
      }
      if(simulation)car(simulation.car.x,simulation.car.y,simulation.car.angle,level.mass>=5,simulation.time);
      else car(level.left-90,E.DECK-13,0,level.mass>=5,0);
      if(!simulation&&cursor) {
        if(selected&&tool!=='erase'&&E.distance(selected,cursor)>1) {
          const e={a:selected,b:cursor,type:tool};const error=E.validate(level,design,e);
          line([[selected.x,selected.y],[cursor.x,cursor.y]],error?'#b77660':'#71835c',2.5,[5,4]);
          const mx=(selected.x+cursor.x)/2,my=(selected.y+cursor.y)/2-18;
          ctx.fillStyle='#fffdf5ed';ctx.fillRect(mx-65,my-12,130,24);
          text(translate('previewCost',{length:(E.distance(selected,cursor)/40).toFixed(1),cost:E.cost(e)}),mx,my,12,error?'#a76450':GREEN);
        }
        circle(cursor.x,cursor.y,tool==='erase'?12:8,tool==='erase'?'#d4a68c33':'#adc49333',tool==='erase'?'#b37c63':'#809768',1.2);
        line([[cursor.x-4,cursor.y],[cursor.x+4,cursor.y]],tool==='erase'?'#b37c63':GREEN,1);
        if(tool!=='erase')line([[cursor.x,cursor.y-4],[cursor.x,cursor.y+4]],GREEN,1);
      }
      if(selected&&!simulation)circle(selected.x,selected.y,10,'#a4b98b33','#668351',1.7);
      ctx.restore();
    }
    return { draw, toWorld(clientX,clientY){const r=canvas.getBoundingClientRect();return{x:(clientX-r.left-view.x)/view.scale,y:(clientY-r.top-view.y)/view.scale};}, get scale(){return view.scale;} };
  }
  window.PaperBridgeScene={create};
})();
