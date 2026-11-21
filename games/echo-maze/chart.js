/* All chart marks are drawn in logical pixels. The cached engraving stays still. */
class CaveChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.paper = document.createElement('canvas');
  }

  size(game) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const key = [w, h, dpr, game.level].join('/');
    if (!w || !h || this.key === key) return;
    this.key = key;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.paper.width = this.canvas.width; this.paper.height = this.canvas.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = game.rows[0].length, rows = game.rows.length;
    const marginX = Math.max(13, Math.min(45, w * .058));
    const marginY = Math.max(13, Math.min(35, h * .09));
    this.cell = Math.min((w - 2 * marginX) / cols, (h - 2 * marginY) / rows);
    this.x = (w - cols * this.cell) / 2;
    this.y = (h - rows * this.cell) / 2;
    const p = this.paper.getContext('2d');
    p.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.engrave(p, cols, rows);
  }

  engrave(p, cols, rows) {
    const { w, h, cell, x, y } = this;
    let seed = 567833;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    p.fillStyle = '#25302d'; p.fillRect(0, 0, w, h);
    // Folded strata and pencil hatching at the four cut edges of the cave.
    for (let corner = 0; corner < 4; corner++) {
      p.save();
      p.translate(corner % 2 ? w : 0, corner > 1 ? h : 0);
      p.scale(corner % 2 ? -1 : 1, corner > 1 ? -1 : 1);
      const wide = w * (.20 + random() * .12), high = h * (.16 + random() * .13);
      const ridge = [[-.08,1.15],[.05,.78],[.17,.73],[.23,.48],[.34,.55],[.44,.30],[.58,.35],[.65,.17],[.82,.21],[.86,.07],[1.12,-.03]];
      for (let band = 4; band >= 0; band--) {
        const scale = .54 + band * .19, offset = band * 1.1;
        p.beginPath(); p.moveTo(-8,-8);
        for (const [a,b] of ridge) p.lineTo(a * wide * scale + (random()-.5)*5, b * high * scale + offset);
        p.lineTo(wide * 1.4,-8); p.closePath();
        p.fillStyle = ['#444c41','#39453d','#344037','#303c35','#2c3831'][band]; p.fill();
        p.strokeStyle = ['#70735f','#596451','#505b4e','#465449','#3b493f'][band]; p.lineWidth = .85; p.stroke();
      }
      p.strokeStyle = '#71736177'; p.lineWidth = .8;
      for (let i = 0; i < 95; i++) {
        const a = random(), b = random() * (1-a)**1.7;
        const xx = a * wide*.9, yy = b * high*.85, len = 2 + random()*10;
        p.beginPath(); p.moveTo(xx,yy); p.lineTo(xx+len,yy-len*(.6+random()*.3)); p.stroke();
      }
      p.restore();
    }
    // Pencil-drawn limestone teeth grow from the unprinted top and bottom margins.
    for (let bank=0; bank<4; bank++) {
      p.save();
      const right=bank%2, bottom=bank>1;
      p.translate(right ? w : 0, bottom ? h : 0);
      p.scale(right ? -1 : 1, bottom ? -1 : 1);
      let xx=w*(.035+random()*.08);
      const count=4+Math.floor(random()*5);
      for(let n=0;n<count;n++) {
        const base=Math.max(6,Math.min(w*.036,9+random()*13));
        const tip=base*(.36+random()*.22);
        const long=Math.max(5,Math.min(y*.77,42))*(.34+random()*.66);
        p.beginPath();p.moveTo(xx,-1);p.lineTo(xx+base*.18,long*.38);
        p.lineTo(xx+tip,long);p.lineTo(xx+base*.67,long*.48);p.lineTo(xx+base,-1);p.closePath();
        p.fillStyle=n%2 ? '#505b4e' : '#414e43';p.fill();p.strokeStyle='#7e836c';p.lineWidth=.8;p.stroke();
        p.strokeStyle='#a8a58b88';p.lineWidth=.7;p.beginPath();p.moveTo(xx+base*.31,0);
        p.lineTo(xx+tip*.9,long*.64);p.moveTo(xx+base*.62,0);p.lineTo(xx+base*.55,long*.25);p.stroke();
        xx+=base*(.7+random()*.5);
      }
      p.restore();
    }
    for (let i = 0; i < w*h/85; i++) {
      const xx = random()*w, yy = random()*h;
      p.fillStyle = i%5 ? '#dcd3b311' : '#121c1c44';
      p.fillRect(xx, yy, random()*1.6+.35, .7);
    }
    // A printed survey grid indicates scale without giving away walls.
    p.fillStyle = '#1c2726aa'; p.fillRect(x, y, cols*cell, rows*cell);
    p.lineWidth = .9; p.strokeStyle = '#82917b75'; p.setLineDash([1.2,3]);
    p.beginPath();
    for (let c = 0; c <= cols; c++) { p.moveTo(x+c*cell,y); p.lineTo(x+c*cell,y+rows*cell); }
    for (let r = 0; r <= rows; r++) { p.moveTo(x,y+r*cell); p.lineTo(x+cols*cell,y+r*cell); }
    p.stroke(); p.setLineDash([]);
    p.fillStyle = '#778475'; p.font = Math.max(8,Math.min(11,cell*.25))+'px monospace';
    p.textAlign = 'center'; p.textBaseline = 'bottom';
    for (let c = 0; c < cols; c += cell < 17 ? 3 : 2) p.fillText(String(c+1).padStart(2, '0'), x+(c+.5)*cell,y-3);
    p.textAlign = 'right'; p.textBaseline = 'middle';
    for (let r = 0; r < rows; r += cell < 17 ? 3 : 2) p.fillText(String.fromCharCode(65+r),x-4,y+(r+.5)*cell);
    p.strokeStyle = '#a9a88d'; p.lineWidth = 1;
    for (const [xx,dirX] of [[x,1],[x+cell*cols,-1]]) {
      for (const [yy,dirY] of [[y,1],[y+cell*rows,-1]]) {
        p.beginPath(); p.moveTo(xx+dirX*7,yy); p.lineTo(xx,yy); p.lineTo(xx,yy+dirY*7); p.stroke();
      }
    }
  }

  tile(c, r, wall, local, strength) {
    const g = this.ctx, k = this.cell;
    g.save(); g.translate(this.x+c*k,this.y+r*k); g.scale(k,k);
    g.globalAlpha = strength;
    if (wall) {
      const v = ((c*19+r*13)%7)*.009;
      g.fillStyle = local ? '#9b9178' : '#abac91';
      g.strokeStyle = local ? '#c3b399' : '#d1cfaa'; g.lineWidth = .017;
      g.beginPath(); g.moveTo(.035,.06+v); g.lineTo(.78,.035); g.lineTo(.96,.12);
      g.lineTo(.95,.82+v); g.lineTo(.86,.95); g.lineTo(.08,.94); g.lineTo(.03,.80); g.closePath(); g.fill(); g.stroke();
      g.save(); g.clip(); g.strokeStyle='#535d50'; g.lineWidth=.022;
      for (let i=-2;i<8;i++) {
        const a = i*.18+v, b=.18+((i+9+c+r)%4)*.09;
        g.beginPath(); g.moveTo(a,1); g.lineTo(a+b,.99-b*1.3); g.stroke();
      }
      g.strokeStyle='#ece0bf'; g.lineWidth=.014;
      g.beginPath(); g.moveTo(.11,.26); g.lineTo(.16,.17); g.lineTo(.56,.12+v); g.stroke();
      g.strokeStyle='#606957'; g.lineWidth=.016;
      g.beginPath(); g.moveTo(.64+v,.04); g.lineTo(.59+v,.2); g.lineTo(.65+v,.29); g.stroke();
      g.restore();
    } else {
      g.fillStyle = local ? '#43534a' : '#516357';
      g.fillRect(.018,.018,.964,.964);
      g.fillStyle = '#b7b698';
      for (let i=0;i<3;i++) {
        const xx=((c*17+r*31+i*37)%77+9)/100, yy=((c*23+r*13+i*21)%81+9)/100;
        g.fillRect(xx,yy,.023,.016);
      }
    }
    g.restore();
  }

  gate(x, y) {
    const g=this.ctx, k=this.cell;
    g.save(); g.translate(this.x+(x+.5)*k,this.y+(y+.5)*k); g.scale(k,k);
    g.lineCap='round'; g.lineJoin='round'; g.fillStyle='#e3c38c'; g.strokeStyle='#f0d4a4'; g.lineWidth=.03;
    g.beginPath(); g.moveTo(-.27,.31); g.lineTo(-.27,-.07); g.bezierCurveTo(-.27,-.43,.27,-.43,.27,-.07);
    g.lineTo(.27,.31);g.closePath();g.fill();g.stroke();
    g.fillStyle='#344138'; g.beginPath();g.moveTo(-.13,.3);g.lineTo(-.13,-.07);g.bezierCurveTo(-.13,-.27,.13,-.27,.13,-.07);g.lineTo(.13,.3);g.fill();
    g.strokeStyle='#d2b57e';g.beginPath();g.moveTo(-.35,.35);g.lineTo(.35,.35);
    g.moveTo(-.37,-.31);g.lineTo(-.43,-.36);g.moveTo(.35,-.32);g.lineTo(.41,-.38);g.moveTo(0,-.42);g.lineTo(0,-.49);g.stroke();g.restore();
  }

  bat(x,y) {
    const g=this.ctx,k=this.cell;
    g.save();g.translate(this.x+(x+.5)*k,this.y+(y+.5)*k);g.scale(k,k);
    g.beginPath();g.arc(0,0,.43,0,Math.PI*2);g.fillStyle='#2c3932';g.fill();g.strokeStyle='#d8bd88';g.lineWidth=.028;g.stroke();
    g.fillStyle='#f1dec0';g.beginPath();g.moveTo(-.40,-.12);
    g.quadraticCurveTo(-.20,-.28,-.055,-.06);g.lineTo(-.04,-.18);g.lineTo(.015,-.13);g.lineTo(.07,-.19);g.lineTo(.08,-.06);
    g.quadraticCurveTo(.25,-.30,.41,-.16);g.quadraticCurveTo(.29,-.12,.29,.025);g.quadraticCurveTo(.17,-.01,.13,.11);
    g.quadraticCurveTo(.05,.09,0,.24);g.quadraticCurveTo(-.055,.10,-.135,.12);g.quadraticCurveTo(-.18,0,-.27,.04);g.quadraticCurveTo(-.27,-.09,-.40,-.12);g.fill();g.restore();
  }

  draw(game, age, still, bump) {
    this.size(game);
    if (!this.cell) return;
    const g=this.ctx,k=this.cell;
    g.drawImage(this.paper,0,0,this.w,this.h);
    const pulse=game.pulse;
    const reach=still ? EchoMaze.radius : Math.min(1,Math.max(0,age)/620)*EchoMaze.radius;
    const fade=still ? 1 : Math.min(1,(EchoMaze.duration-age)/430);
    for (let r=0;r<game.rows.length;r++) {
      for(let c=0;c<game.rows[r].length;c++) {
        const local=Math.max(Math.abs(c-game.player.x),Math.abs(r-game.player.y))<=1;
        const distance=pulse ? Math.hypot(c-pulse.x,r-pulse.y) : Infinity;
        if(local || (pulse && distance<=reach)) this.tile(c,r,game.rows[r][c]==='#',local,local ? 1 : fade);
        const dx=c-game.player.x, dy=r-game.player.y;
        if(local && Math.abs(dx)+Math.abs(dy)===1 && game.rows[r][c]==='.') {
          const xx=this.x+(c+.5)*k, yy=this.y+(r+.5)*k;
          g.strokeStyle='#b5c0a9'; g.lineWidth=Math.max(1.1,k*.026);
          g.beginPath();g.moveTo(xx-k*(dx*.055+dy*.09),yy-k*(dy*.055-dx*.09));
          g.lineTo(xx+k*dx*.055,yy+k*dy*.055);
          g.lineTo(xx-k*(dx*.055-dy*.09),yy-k*(dy*.055+dx*.09));g.stroke();
        }
        if (game.visited.has(r*game.rows[0].length+c)) {
          g.fillStyle='#abac8f'; g.beginPath();g.arc(this.x+(c+.5)*k,this.y+(r+.50)*k,Math.max(1.5,k*.053),0,Math.PI*2);g.fill();
        }
      }
    }
    if(pulse && !still && age<950) {
      g.save(); g.beginPath();g.rect(this.x,this.y,game.rows[0].length*k,game.rows.length*k);g.clip();
      const px=this.x+(pulse.x+.5)*k,py=this.y+(pulse.y+.5)*k;
      for(let i=0;i<3;i++) {
        const frac=(age-i*95)/700;
        if(frac<=0 || frac>=1.05) continue;
        g.strokeStyle='rgba(233,213,165,'+Math.max(0,.8-frac*.68)+')';g.lineWidth=i===0?1.8:1;
        g.beginPath();g.arc(px,py,frac*EchoMaze.radius*k,0,Math.PI*2);g.stroke();
      }
      g.restore();
    }
    if(bump) {
      const xx=this.x+(bump.x+.5)*k,yy=this.y+(bump.y+.5)*k;
      g.strokeStyle='#452f26';g.lineWidth=Math.max(2,k*.055);g.beginPath();
      g.moveTo(xx-k*.12,yy-k*.12);g.lineTo(xx+k*.12,yy+k*.12);
      g.moveTo(xx+k*.12,yy-k*.12);g.lineTo(xx-k*.12,yy+k*.12);g.stroke();
    }
    this.gate(game.exit.x,game.exit.y);this.bat(game.player.x,game.player.y);
  }
}
