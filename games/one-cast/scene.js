/* Original pencil illustration, drawn locally; no external assets. */
(() => {
  'use strict';
  const ink='#64705b';
  function fishSVG(fish, locked=false) {
    const i=OneCast.FISH.indexOf(fish), color=locked?'#d0d6c7':fish.color;
    const body=i===5?'M20 22Q33 0 48 21Q35 44 20 22Z':'M16 22Q33 5 51 20Q36 39 16 22Z';
    const stripe=i===2?'<path d="m29 14 2 15m6-17 2 16m5-13 1 9" stroke="#788a68"/>':i===4?'<path d="M24 17q7-7 10 0t8 9q-8 8-14-1Z" fill="#bc8b73" stroke="none"/>':i===7?'<path d="m34 14 2 5 6 1-4 3 1 6-5-3-5 2 1-5-4-4 6 0Z" fill="#f6edc9" stroke="#9a9674" stroke-width=".7"/>':'';
    return `<svg viewBox="0 0 64 44" aria-hidden="true"><path d="m19 22-12-10 1 19Z" fill="${color}" stroke="${ink}" stroke-width="1.1"/><path d="${body}" fill="${color}" stroke="${ink}" stroke-width="1.2"/><path d="m29 12 6-7 6 8M30 31l5 5 5-7" fill="${color}" stroke="${ink}" stroke-width="1"/>${stripe}<path d="M42 16q-5 7-1 13m-15-5 8-5-3 7" fill="none" stroke="${ink}" stroke-width=".8"/><circle cx="46" cy="20" r="1.5" fill="${ink}"/><path d="M17 24q12 13 29 3" fill="none" stroke="${ink}" stroke-width=".4" opacity=".6"/></svg>`;
  }
  class Scene {
    constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.motion=matchMedia('(prefers-reduced-motion: reduce)'); this.resize(); }
    resize() { const r=this.canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2); this.width=r.width;this.height=r.height;this.dpr=dpr;this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr); }
    path(d,fill,stroke=ink,width=1.5) { const c=this.ctx,p=new Path2D(d); c.lineWidth=width;c.strokeStyle=stroke;if(fill){c.fillStyle=fill;c.fill(p);}if(stroke)c.stroke(p); }
    ellipse(x,y,rx,ry,fill,stroke=ink,width=1.2){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}}
    fish(x,y,s,fish,flip=false) { const c=this.ctx;c.save();c.translate(x,y);c.scale(flip?-s:s,s);this.path('M-20 0-38-13-34 14Z',fish.color);this.path('M-26 0Q-5-25 26-2Q10 25-26 0Z',fish.color);this.path('M-10-13 0-24 7-14M-7 16 2 24 9 12',fish.color);this.path('M13-10Q7 0 13 12M-12 4-1-3-5 8',null,ink,1);this.ellipse(18,-3,1.8,1.8,ink,null);if(fish.id==='perch')this.path('M-12-10-9 12M-3-14 0 15M5-12 7 12',null,'#718267',2);if(fish.id==='koi')this.path('M-15-8Q-2-17 1-2T11 10Q-4 17-15-8Z','#bb8a71',null);if(fish.id==='starfish')this.path('m-2-9 2 6 6 1-5 4 2 6-5-3-5 2 1-6-4-4 6-1Z','#f7efcb','#9a977b',.7);c.restore(); }
    draw(game) {
      const c=this.ctx,w=this.width,h=this.height;if(!w||!h)return;
      const t=this.motion.matches?0:game.clock/1000;
      c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);c.fillStyle='#f9f8ef';c.fillRect(0,0,w,h);
      // Keep the complete illustration visible in tall and short viewports.
      const scale=Math.min(w/950,h/560);c.translate((w-950*scale)/2,(h-560*scale)/2);c.scale(scale,scale);c.lineCap='round';c.lineJoin='round';
      this.ellipse(730,112,37,35,'#efe7cd',null);
      this.path('M40 267Q105 229 150 240T256 220Q324 191 406 234T546 226Q633 193 735 222T910 241L910 337H40Z','#e6e9dc',null);
      this.path('M40 266Q109 231 154 241M195 237Q270 201 324 214M580 221Q657 196 715 218',null,'#c2cab8',1);
      this.path('M36 298Q128 274 204 287T360 277Q462 259 536 285T704 271Q815 252 916 288L916 351H36Z','#d8e1d1',null);
      this.path('M41 299Q114 280 199 291M397 283Q463 267 523 284M707 275Q804 258 899 285',null,'#b7c5ad',1.1);
      this.path('M61 335Q176 292 367 306T658 300Q829 300 902 347Q962 416 857 474Q724 522 486 509Q276 525 113 465Q30 435 61 335Z','#e0ebe5','#b5c9ba',1);
      this.path('M67 344Q195 303 368 316T671 311Q811 305 894 348M117 472Q304 536 508 517',null,'#c1d3c7',.7);
      // Faint pencil strokes across the lake, never in front of the controls.
      c.save();c.globalAlpha=.55;
      for(let i=0;i<20;i++){const x=135+(i*137)%670,y=335+(i*43)%153,dx=Math.sin(t*.45+i)*4;this.path(`M${x+dx} ${y}q${12+(i%4)*6} ${i%2?2:-2} ${32+(i%5)*9} 0`,null,'#a9c1b0',.7);}
      c.restore();
      // Far shore pines and a little cloud.
      for(const [x,y,s] of [[110,262,.8],[139,266,.6],[813,267,.72],[843,271,.48]]){c.save();c.translate(x,y);c.scale(s,s);this.path('M0 21V-57',null,'#a1b293',1.3);this.path('M0-53-17-26-6-29-24-5-8-10-26 13H26L8-10 23-5 6-29 17-26Z','#c5d2ba','#8c9e7e',1);this.path('M-13-20 0-14 12-20M-18 1 0 9 18 1',null,'#a7b79a',.7);c.restore();}
      this.path('M301 143q-9-10-19-2-4-23-28-17-12-13-25-2-13-5-22 7-19-5-24 11 49 6 118 3',null,'#ccd1c1',1.2);
      const birdX=Math.sin(t*.09)*14;this.path(`M${473+birdX} 145q-8-9-16-4m16 4q6-10 15-6M${520+birdX} 168q-6-7-12-3m12 3q6-8 12-5`,null,'#9ca98f',1.5);
      // Distant lily pads and reed pencil hatching.
      [[776,399,20],[818,418,14],[712,460,17]].forEach(([x,y,r])=>{this.ellipse(x,y,r,r*.27,'#c2d3b8','#93ac88',.8);this.path(`M${x} ${y}l${r} -3`,null,'#e0ebe5',2);});
      this.path('M795 420q3-15 11-10-5 15-11 10','#dfc3b7','#ad998b',.8);
      c.save();c.globalAlpha=.12;this.fish(695+Math.sin(t*.35)*17,431,1.05,OneCast.FISH[2],true);this.fish(470+Math.sin(t*.2)*25,468,.7,OneCast.FISH[0]);c.restore();
      // Foreground island and the tilted, plank-built pier.
      this.path('M39 371Q75 333 143 352Q203 358 239 401L213 439Q129 468 47 421Z','#e0e4ce','#b7c5a4',1);
      this.path('M135 416 396 378 401 402 140 447Z','#c4b899','#8e896d',1.3);
      this.path('M139 403 389 363 406 387 146 433Z','#e2d5b8','#8b8b6f',1.7);
      this.path('M139 406 388 367M148 429 403 385M168 400 178 426M204 394 218 420M245 387 259 412M288 380 302 405M330 374 345 397M368 367 384 389',null,'#9b967b',1);
      this.path('M192 428v38l9 3 2-43M364 397v40l9-3 2-38','#c3b795','#8c8c71',1.4);
      this.path('M160 414 184 410M226 403 242 401M269 397 293 392M310 386 328 383M345 382l19-4',null,'#b2a88c',1);
      // Bucket, with a small curved handle.
      this.path('M199 376q0-28 21-24t20 20',null,'#8f9c83',1.5);
      this.path('M196 373 203 401q18 10 34-3l6-29Z','#b4c3af','#788b71',1.7);this.ellipse(219,372,24,7,'#dbe0cd','#788b71',1.3);this.path('M205 382 208 395M211 384l1 11M216 384v10',null,'#90a288',1);
      // Cat: curved tail, soft body, little paws and a linen scarf.
      this.path('M286 372q-55 18-61-12-4-22 11-19 10 2 7 12-4 14 30 6','#e4d6b5','#7c806a',2);
      this.path('M275 302Q254 330 264 370q11 18 48 6 29-16 3-70Z','#e9ddbd','#79816b',2);
      this.path('M266 348q13 12 8 26m34-20q-3 18 9 18M279 374q22 4 33-2',null,'#a69f82',1.4);
      this.path('M277 287 266 255 288 266Q305 257 325 269l18-13-3 39q-4 25-36 26-31-1-34-26Z','#efe3c6','#79816b',2);
      this.path('m274 263 4 14 10-6m39 1 10-9-2 16',null,'#beab8f',1.3);
      this.path('M284 292q4-4 8 0M315 292q4-4 8 0M300 298l4 2 4-3m-4 3v4m0-1q-7 6-11 1m11-1q6 5 10 0M275 298l-13-2m14 7-12 3M330 298l13-3m-12 8 12 3',null,'#71795f',1.3);
      this.ellipse(283,301,5,2.5,'#d9b6a0',null);this.ellipse(324,301,5,2.5,'#d9b6a0',null);
      this.path('M276 313q25 12 49-1l-4 14q-24 11-42-2Z','#9cac8c','#78896d',1.2);this.path('M280 322 271 347l15-5 6-17','#9cac8c','#78896d',1);
      // Straw hat, with deliberately doubled pencil outlines.
      this.path('M267 268q7-30 30-33 25-1 37 32Z','#ddc99d','#8c896b',1.6);this.ellipse(300,271,57,8,'#e9d7ad','#8c896b',1.7);this.path('M271 259q28 10 59-1l3 8q-31 10-64 1Z','#a5b394','#7d8b70',1);this.path('M279 246 285 255m2-13 6 14m7-16 2 17m9-15 1 14m8-8 2 7M251 271q43 10 97 0',null,'#a99b75',.7);
      // A paw holding the rod.
      const active=['casting','waiting','bite'].includes(game.state), cast=game.state==='casting'?Math.min(1,game.elapsed/650):1;
      const tipX=active?485:462,tipY=active?211:185;
      this.path(`M313 345Q395 228 ${tipX} ${tipY}M315 348Q396 235 ${tipX} ${tipY}`,null,'#7b8063',2);
      this.path('M304 333q7-9 17 1l7 9q-6 9-16 2Z','#ede1bf','#79816b',1.7);
      const bx=active?tipX+(608-tipX)*cast:496, by=active?tipY+(378-tipY)*cast-Math.sin(cast*Math.PI)*90:270;
      const bob=game.state==='bite'?Math.sin(t*21)*5:Math.sin(t*2)*2;
      this.path(`M${tipX} ${tipY}Q${tipX+28} ${tipY+80} ${bx} ${by+bob}`,null,'#8c9881',1);
      if(game.state==='waiting'||game.state==='bite') {
        const r=game.state==='bite'?27:18;
        this.ellipse(bx,by+12,r+Math.sin(t*2)*4,6,null,'#9fbba8',1);
        this.ellipse(bx,by+13,r+14+Math.sin(t*2)*4,10,null,'#c3d4c7',.9);
      }
      this.path(`M${bx} ${by-10+bob}v8`,null,'#8b8a6d',1.3);
      this.ellipse(bx,by+bob,4,8,'#bd8c71','#7e8268',1);this.path(`M${bx-3.7} ${by+bob+1}h7.4`,null,'#f7f1dc',2.5);
      if(game.state==='bite'){for(let i=0;i<4;i++){const sx=bx-27+i*17;this.path(`M${sx} ${by-14}l${i<2?-4:4} -7`,null,'#8fae98',1.5);}}
      // Caught fish springs out of the water then rests above the pier.
      if(game.result?.type==='catch') {
        const fish=OneCast.FISH.find(f=>f.id===game.result.fish),p=this.motion.matches?1:Math.min(1,game.elapsed/700),fx=608-190*p,fy=378-75*p-Math.sin(p*Math.PI)*120;
        this.fish(fx,fy,1.1,fish,true);
        if(game.elapsed<2000){this.path(`M${fx-45} ${fy-25}l-5-7m50-14 2-8m24 39 9-1`,null,'#b3a371',1.5);}
      }
      [[95,394],[116,407],[849,463],[871,451]].forEach(([x,y],i)=>{const sway=this.motion.matches?0:Math.sin(t*.7+i)*2;this.path(`M${x} ${y}q${-4+sway} -24 -12 -36m12 36q${6+sway} -31 11 -44m-10 42q-1 -16 -1 -49`,null,'#94a47e',1.7);this.path(`M${x-1} ${y-47}q-3-13 0-13t1 13`,null,'#ad9c77',3.2);});
    }
  }
  window.FishingArt={Scene,fishSVG};
})();
