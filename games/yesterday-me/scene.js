(() => {
  'use strict';
  const { W, H } = YesterdayEngine;
  const C = { ink: '#69745f', soft: '#aab39a', sage: '#d5dfc8', green: '#6c865d', blue: '#7295a3', rose: '#b08c96', paper: '#fffdf4' };
  class Scene {
    constructor(canvas, translate) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.t = translate; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; this.resize(); }
    resize() { const r = this.canvas.getBoundingClientRect(); this.width = r.width; this.height = r.height; const dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = Math.round(r.width * dpr); this.canvas.height = Math.round(r.height * dpr); this.dpr = dpr; }
    line(points, color = C.ink, width = 1.3, dash = []) { const c = this.ctx; c.beginPath(); c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke(); c.setLineDash([]); }
    shape(points, fill, stroke = C.ink, width = 1.2) { const c = this.ctx; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
    ellipse(x, y, rx, ry, fill, stroke) { const c = this.ctx; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.2; c.stroke(); } }
    text(text, x, y, size = 12, color = C.ink, align = 'center') { const c = this.ctx; c.fillStyle = color; c.font = `${size}px "Segoe UI","Microsoft YaHei",sans-serif`; c.textAlign = align; c.fillText(text, x, y); }
    cloud(x, y, scale) { const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale); c.beginPath(); c.moveTo(-52, 13); c.bezierCurveTo(-71, 9, -65, -8, -42, -5); c.bezierCurveTo(-36, -35, 4, -36, 13, -12); c.bezierCurveTo(37, -25, 62, -6, 47, 11); c.bezierCurveTo(14, 19, -23, 13, -52, 13); c.fillStyle = '#fdfbf2'; c.fill(); c.strokeStyle = '#c5ccb5'; c.lineWidth = 1.2; c.stroke(); this.line([[-43,18],[-20,20],[12,19]], '#d9dec9', 1); c.restore(); }
    grass(x, y, size = 1) { this.line([[x-5*size,y],[x-9*size,y-12*size],[x-2*size,y-7*size],[x,y],[x+4*size,y-16*size],[x+5*size,y],[x+11*size,y-9*size]], '#94a17e', 1.1); }
    landscape(game, time) {
      const c = this.ctx;
      this.ellipse(761, 105, 41, 39, '#eae2b94d'); this.ellipse(762, 104, 31, 30, '#eee6be55', '#c8c5a1');
      for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; this.line([[762+Math.cos(a)*46,104+Math.sin(a)*46],[762+Math.cos(a)*52,104+Math.sin(a)*52]], '#d6d1b2', 1); }
      const drift = this.reduced ? 0 : Math.sin(time / 11000) * 5;
      this.cloud(196 + drift, 116, .82); this.cloud(526 - drift, 72, .55); this.cloud(850 + drift, 185, .47);
      c.beginPath(); c.moveTo(0, 360); c.bezierCurveTo(90, 327, 156, 258, 241, 291); c.bezierCurveTo(330, 322, 399, 264, 486, 302); c.bezierCurveTo(598, 354, 666, 275, 750, 303); c.bezierCurveTo(835, 329, 907, 293, 960, 312); c.lineTo(960, 540); c.lineTo(0, 540); c.fillStyle = '#e5e9d84f'; c.fill();
      c.beginPath(); c.moveTo(0, 393); c.bezierCurveTo(154, 326, 242, 384, 360, 349); c.bezierCurveTo(531, 299, 565, 386, 740, 357); c.bezierCurveTo(840, 341, 904, 365, 960, 348); c.strokeStyle = '#cbd4bb70'; c.lineWidth = 1; c.stroke();
      // A small pencil wind mark and a paper bird, fixed when reduced motion is requested.
      this.line([[339,155],[363,151],[377,154]], '#c3ccb5', 1); this.line([[348,161],[371,158]], '#d3d9c9', 1);
      this.line([[608,143],[617,139],[625,144],[633,140],[642,145]], '#b6c0a8', 1.2);
      for (const r of game.level.terrain) {
        this.shape([[r.x,r.y+2],[r.x+24,r.y],[r.x+r.w*.46,r.y+1],[r.x+r.w,r.y],[r.x+r.w,H],[r.x,H]], '#e9e5d3', '#bcc1a9', 1.2);
        this.shape([[r.x,r.y+1],[r.x+r.w,r.y],[r.x+r.w,r.y+12],[r.x+r.w*.63,r.y+15],[r.x+r.w*.22,r.y+12],[r.x,r.y+15]], '#d9e0c6', null);
        this.line([[r.x,r.y+1],[r.x+r.w*.37,r.y-1],[r.x+r.w*.71,r.y+1],[r.x+r.w,r.y]], '#7c8c67', 2);
        for (let x = r.x + 12; x < r.x + r.w - 6; x += 23) { const yy = r.y + 25 + Math.sin(x * .19) * 5; this.line([[x,yy+6],[x+7,yy]], '#cbc7b14f', 1); }
        for (let x = r.x + 36; x < r.x + r.w - 10; x += 109) this.grass(x, r.y - 1, .65 + (Math.sin(x) + 1) * .17);
      }
      for (const p of game.plates) {
        const gates = game.gates.filter(g => g.requires.includes(p.id));
        for (const g of gates) this.line([[p.x+p.w/2,p.y+20],[p.x+p.w/2,p.y+36],[g.x+g.w/2,p.y+36],[g.x+g.w/2,g.y+g.h]], p.active ? '#96aa7b' : '#c8ceba', 1.4, [3,5]);
      }
      // The little departure flag makes every rewind's common origin legible.
      const [sx,sy] = game.level.spawn;
      this.line([[sx-22,sy+41],[sx-22,sy+8]], '#a6b297', 1.2);
      this.shape([[sx-22,sy+8],[sx-5,sy+11],[sx-22,sy+20]], '#e4e8d8', '#a6b297', 1);
    }
    drawGate(g) {
      const color = g.open ? '#9aaf7c' : '#a4aa91';
      this.shape([[g.x-7,g.y+g.h],[g.x-8,g.y+7],[g.x-3,g.y],[g.x+g.w+7,g.y+1],[g.x+g.w+9,g.y+g.h]], null, '#a9b494', 1.5);
      const length = g.open ? 18 : g.h;
      this.shape([[g.x,g.y+6],[g.x+g.w,g.y+5],[g.x+g.w-1,g.y+length],[g.x+1,g.y+length+1]], g.open ? '#dce6cb88' : '#dce1cb', color, 1.2);
      for (let y = g.y+16; y < g.y+length; y += 21) this.line([[g.x+3,y+5],[g.x+g.w-3,y-4]], '#abb797', 1);
      this.ellipse(g.x+g.w/2, g.y-13, 14, 14, '#fffdf4', color);
      if (g.open) this.line([[g.x+5,g.y-13],[g.x+10,g.y-8],[g.x+18,g.y-18]], '#7c9666', 1.7);
      else this.text(g.requires.join('·'), g.x+g.w/2, g.y-9, 10, '#859171');
    }
    drawBridge(b, game) {
      this.line([[b.x+15, b.top-58],[b.x+15,b.y]], '#bbc4af', 1.5, [4,3]);
      this.line([[b.x+b.w-15,b.top-58],[b.x+b.w-15,b.y]], '#bbc4af', 1.5, [4,3]);
      this.line([[b.x+2,b.top-58],[b.x+b.w-2,b.top-58]], '#a9b49b', 1.5);
      this.ellipse(b.x+15,b.top-58,5,5,'#f1efdf','#a9b49b'); this.ellipse(b.x+b.w-15,b.top-58,5,5,'#f1efdf','#a9b49b');
      if (b.y < b.catchY-5) this.line([[b.x+b.w/2,b.y+34],[b.x+b.w/2,b.y+57],[b.x+b.w/2-6,b.y+51],[b.x+b.w/2,b.y+57],[b.x+b.w/2+6,b.y+51]], '#afbaa0', 1.3);
      this.shape([[b.x,b.y+2],[b.x+b.w,b.y],[b.x+b.w-2,b.y+b.h],[b.x+1,b.y+b.h+1]], '#e0cfaa', '#8f9578', 1.6);
      for (let x = b.x+26; x < b.x+b.w; x += 27) this.line([[x,b.y+3],[x-1,b.y+b.h-2]], '#b2a789', 1);
      this.line([[b.x+5,b.y+5],[b.x+b.w-4,b.y+4]], '#f7edcf', 1.5);
      for (const id of b.requires) { const p = game.plates.find(p => p.id === id); if (p.active) this.line([[p.x+32,p.y-49],[p.x+32,b.y+b.h]], '#99a783', 2); }
    }
    drawPlate(p, game) {
      const support = game.bridges.some(b => b.requires.includes(p.id));
      const color = p.active ? '#758e5e' : '#a7af96';
      this.ellipse(p.x+p.w/2,p.y+6,p.w*.65,5,'#b8c5a023');
      this.shape([[p.x,p.y-3],[p.x+7,p.y-(p.active?5:10)],[p.x+p.w-6,p.y-(p.active?5:10)],[p.x+p.w,p.y-3],[p.x+p.w,p.y+2],[p.x,p.y+2]], p.active?'#b7ca97':'#e5e7d6',color,1.4);
      this.line([[p.x+8,p.y-2],[p.x+p.w-8,p.y-2]],p.active?'#edf3df':'#cbd3bd',1);
      this.text(p.id+(p.boxOnly?' ◇':''),p.x+p.w/2,p.y+28,13,p.active?'#698455':'#8e987f');
      if (support) {
        this.line([[p.x+19,p.y-55],[p.x+19,p.y-64],[p.x+45,p.y-64],[p.x+45,p.y-55]], '#a6b597',1.4,[3,3]);
        this.text(this.t('bridge'), p.x+p.w/2,p.y+45,10,'#99a18d');
      }
    }
    drawBox(b) {
      if (b.y > H+30) return;
      const {x,y,w,h} = b;
      this.shape([[x+1,y+1],[x+w-1,y],[x+w,y+h-1],[x,y+h]], '#e2cfaa', '#9b8c6a', 1.5);
      this.shape([[x+5,y+5],[x+w-5,y+5],[x+w-5,y+h-5],[x+5,y+h-5]], '#e9dabb', '#b4a381', .9);
      this.line([[x+6,y+6],[x+w-6,y+h-6]], '#b09c75', 1.2); this.line([[x+w-6,y+6],[x+6,y+h-6]], '#b09c75', 1.2);
      this.line([[x+3,y+2],[x+w-3,y+2]], '#f5e9ca', 1.2);
    }
    drawActor(a, isPlayer, frame, color, label) {
      if (!a.alive) return;
      const c = this.ctx, x = a.x + a.w/2, y = a.y;
      const walk = a.grounded && a.vx ? Math.sin(frame*.4)*4 : 0;
      this.ellipse(x,y+a.h+2,17,3,isPlayer?'#8e9a7c26':'#8e9a7c16');
      c.save(); c.globalAlpha = isPlayer ? 1 : .78;
      if (!isPlayer) c.setLineDash([3,2]);
      this.shape([[x-10,y+21],[x+10,y+21],[x+13,y+35],[x-12,y+35]], isPlayer?'#a9bd90':color+'42', color,1.6);
      c.setLineDash([]);
      this.ellipse(x,y+11,11.5,12,isPlayer?'#fff9e7':'#faf9ed',color);
      this.line([[x-8,y+2],[x-3,y-1],[x+5,y+1]],color,1.2);
      this.ellipse(x+a.face*4,y+11,1.25,1.6,'#627054');
      this.line([[x-5,y+35],[x-6+walk,y+41],[x-9+walk,y+41]],color,1.7);
      this.line([[x+5,y+35],[x+6-walk,y+41],[x+9-walk,y+41]],color,1.7);
      if (a.carrying !== null || a.holding) {
        this.line([[x-10,y+25],[x-16,y+15],[x-14,y-4]],color,1.7); this.line([[x+10,y+25],[x+16,y+15],[x+14,y-4]],color,1.7);
      } else {
        this.line([[x-10,y+25],[x-14-walk*.3,y+31]],color,1.7); this.line([[x+10,y+25],[x+14+walk*.3,y+30]],color,1.7);
      }
      this.shape([[x-10,y+21],[x+9,y+20],[x+8,y+24],[x-9,y+25]],isPlayer?'#b59d78':color,null);
      this.shape([[x-7,y+23],[x-18,y+24+walk*.2],[x-14,y+29],[x-5,y+25]],isPlayer?'#c8b18b':color+'99',null);
      c.restore();
      this.text(label,x,y-(a.carrying!==null?44:14),11,color);
      if (isPlayer) this.line([[x-3,y-8],[x,y-5],[x+3,y-8]],'#71845e',1.3);
    }
    goal(g, won) {
      const c = this.ctx;
      this.ellipse(g.x+g.w/2,g.y+g.h+2,37,5,'#bbc9a82b');
      c.beginPath(); c.moveTo(g.x,g.y+g.h); c.lineTo(g.x,g.y+22); c.bezierCurveTo(g.x,g.y-9,g.x+g.w,g.y-9,g.x+g.w,g.y+22); c.lineTo(g.x+g.w,g.y+g.h); c.closePath(); c.fillStyle = won?'#d7e5bf':'#e1e9d3'; c.fill(); c.strokeStyle = '#8fa47c'; c.lineWidth = 1.6; c.stroke();
      c.beginPath(); c.moveTo(g.x+7,g.y+g.h-1); c.lineTo(g.x+7,g.y+23); c.bezierCurveTo(g.x+7,g.y+3,g.x+g.w-7,g.y+3,g.x+g.w-7,g.y+23); c.strokeStyle = '#b5c4a2'; c.lineWidth = 1; c.stroke();
      this.line([[g.x+12,g.y+38],[g.x+30,g.y+38],[g.x+24,g.y+32],[g.x+30,g.y+38],[g.x+24,g.y+44]],'#829a6c',1.4);
      this.text(this.t('exit'),g.x+g.w/2,g.y-14,12,'#8a9a78');
      this.grass(g.x-12,g.y+g.h,.8); this.grass(g.x+g.w+15,g.y+g.h,.65);
    }
    draw(game, time = 0) {
      const c = this.ctx; if (!this.width || !this.height) return;
      c.setTransform(this.dpr,0,0,this.dpr,0,0); c.clearRect(0,0,this.width,this.height);
      const scale = Math.min(this.width / W, this.height / H);
      c.translate((this.width-W*scale)/2,(this.height-H*scale)/2); c.scale(scale,scale); c.lineCap='round'; c.lineJoin='round';
      this.landscape(game,time); this.goal(game.level.goal,game.phase==='won');
      game.gates.forEach(g=>this.drawGate(g)); game.bridges.forEach(b=>this.drawBridge(b,game)); game.plates.forEach(p=>this.drawPlate(p,game));
      game.actors.forEach((a,i)=>this.drawActor(a,a===game.player,game.frame,a===game.player?C.green:i===0?C.blue:C.rose,a===game.player?this.t('now'):this.t('ghost',{n:i+1})));
      game.boxes.forEach(b=>this.drawBox(b));
      if (game.phase==='won') { for(let i=0;i<16;i++){const x=game.player.x+Math.cos(i*2.4)* (28+i*3);const y=game.player.y-20-Math.sin(i*1.7)*30;this.shape([[x,y-3],[x+2,y],[x,y+3],[x-2,y]],['#c1cda8','#e0cd9a','#b5c9c9'][i%3],null);} }
    }
  }
  window.YesterdayScene = Scene;
})();
