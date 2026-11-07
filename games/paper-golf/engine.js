(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaperGolf = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 1000, HEIGHT = 520, RADIUS = 9, GRAVITY = 530, SPEED = 740, STEP = 1 / 120;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const LEVELS = [
    { par: 3, tee: 100, hole: 865, terrain: [[0,396],[230,396],[390,354],[520,354],[680,396],[1000,396]], sand: [], pads: [], aim: [35,58] },
    { par: 3, tee: 100, hole: 875, terrain: [[0,340],[220,340],[360,410],[590,410],[730,354],[1000,354]], sand: [[365,585]], pads: [], aim: [42,63] },
    { par: 3, tee: 95, hole: 875, terrain: [[0,420],[250,420],[440,315],[650,315],[790,345],[1000,345]], sand: [], pads: [], aim: [48,67] },
    { par: 3, tee: 100, hole: 865, terrain: [[0,394],[290,394],[400,430],[550,430],[730,290],[1000,290]], sand: [], pads: [[405,535]], aim: [20,44] },
    { par: 4, tee: 90, hole: 875, terrain: [[0,400],[1000,400]], sand: [[670,755]], pads: [], movers: [{x:490,y:245,w:20,h:140,amplitude:112,period:4.5,phase:0}], aim: [40,62] },
    { par: 4, tee: 95, hole: 875, terrain: [[0,396],[490,396],[650,356],[1000,356]], sand: [], pads: [], switch: {x:370,y:384,r:22}, gate: {x:620,y:155,w:22,h:209}, aim: [12,36] },
    { par: 4, tee: 90, hole: 890, terrain: [[0,365],[200,365],[315,420],[480,420],[610,300],[720,300],[825,370],[1000,370]], sand: [[320,475],[830,855]], pads: [], aim: [48,68] },
    { par: 4, tee: 100, hole: 880, terrain: [[0,405],[600,405],[780,320],[1000,320]], sand: [[290,385]], pads: [[470,575]], movers: [{x:690,y:205,w:18,h:125,amplitude:92,period:3.8,phase:1}], aim: [30,52] },
    { par: 5, tee: 90, hole: 900, terrain: [[0,400],[350,400],[500,440],[620,440],[790,330],[1000,330]], sand: [[390,490]], pads: [[520,610]], switch: {x:290,y:388,r:23}, gate: {x:765,y:100,w:22,h:247}, movers: [{x:665,y:210,w:18,h:115,amplitude:70,period:4.2,phase:.5}], aim: [10,31] }
  ];
  function groundAt(level, x) {
    const points = level.terrain;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i+1];
      if (x <= b[0] || i === points.length-2) {
        const slope = (b[1]-a[1])/(b[0]-a[0]);
        return {y:a[1]+clamp((x-a[0])/(b[0]-a[0]),0,1)*(b[1]-a[1]),slope};
      }
    }
  }
  const onSand = (level, x) => level.sand.some(([a,b])=>x>=a&&x<=b);
  function moverAt(m, time) {return {...m, y:m.y+Math.sin(time*2*Math.PI/m.period+(m.phase||0))*m.amplitude};}
  function circleRect(ball, rect) {
    const x=clamp(ball.x,rect.x,rect.x+rect.w),y=clamp(ball.y,rect.y,rect.y+rect.h);
    const dx=ball.x-x,dy=ball.y-y,d=Math.hypot(dx,dy);
    if(d>=RADIUS)return null;
    if(d>1e-6)return {nx:dx/d,ny:dy/d,depth:RADIUS-d};
    return [{nx:-1,ny:0,depth:ball.x-rect.x+RADIUS},{nx:1,ny:0,depth:rect.x+rect.w-ball.x+RADIUS},{nx:0,ny:-1,depth:ball.y-rect.y+RADIUS},{nx:0,ny:1,depth:rect.y+rect.h-ball.y+RADIUS}].sort((a,b)=>a.depth-b.depth)[0];
  }
  function reflect(ball, hit, elasticity) {
    ball.x+=hit.nx*(hit.depth+.02);ball.y+=hit.ny*(hit.depth+.02);
    const v=ball.vx*hit.nx+ball.vy*hit.ny;
    if(v>=0)return false;
    ball.vx-=(1+elasticity)*v*hit.nx;ball.vy-=(1+elasticity)*v*hit.ny;return true;
  }
  class Game {
    constructor(index=0){this.reset(index);}
    reset(index=this.index){
      this.index=clamp(Math.floor(Number(index)||0),0,LEVELS.length-1);this.level=LEVELS[this.index];
      const g=groundAt(this.level,this.level.tee);
      this.ball={x:this.level.tee,y:g.y-RADIUS,vx:0,vy:0,rotation:0};
      this.state='ready';this.shots=0;this.time=0;this.accumulator=0;this.paused=false;
      this.switched=false;this.events=[];this.trail=[];this.previousTrail=[];this.restTime=0;this.flightTime=0;this.padCooldown=0;this.trailTick=0;this.bumpCooldown=0;this.lockedCooldown=0;
      this.lastLie={...this.ball};
    }
    strike(angle,power){
      if(this.paused||this.state!=='ready'||!Number.isFinite(angle)||!Number.isFinite(power)||power<3)return false;
      const rad=clamp(angle,0,180)*Math.PI/180;
      const speed=SPEED*clamp(power,3,100)/100*(onSand(this.level,this.ball.x)?.74:1);
      this.lastLie={...this.ball};this.ball.vx=Math.cos(rad)*speed;this.ball.vy=-Math.sin(rad)*speed;
      this.shots++;this.state='moving';this.restTime=0;this.flightTime=0;this.previousTrail=this.trail.slice();this.trail=[{x:this.ball.x,y:this.ball.y}];this.trailTick=0;this.events.push('strike');return true;
    }
    advance(delta){
      if(this.paused||this.state==='won'||!Number.isFinite(delta)||delta<=0)return;
      this.accumulator+=Math.min(delta,.1);
      while(this.accumulator+1e-10>=STEP){this.accumulator-=STEP;this.step();if(this.state==='won'){this.accumulator=0;break;}}
    }
    step(){
      this.time+=STEP;this.padCooldown=Math.max(0,this.padCooldown-STEP);this.bumpCooldown=Math.max(0,this.bumpCooldown-STEP);this.lockedCooldown=Math.max(0,this.lockedCooldown-STEP);
      const b=this.ball,l=this.level;
      // A moving obstacle can reach a resting ball; it must wake the simulation.
      if(this.state==='ready'){
        for(const m of l.movers||[])if(circleRect(b,moverAt(m,this.time))){this.state='moving';this.restTime=0;break;}
        if(this.state==='ready')return;
      }
      this.flightTime+=STEP;
      b.vy+=GRAVITY*STEP;b.x+=b.vx*STEP;b.y+=b.vy*STEP;b.rotation+=b.vx*STEP/RADIUS;
      if(b.x<RADIUS){b.x=RADIUS;b.vx=Math.abs(b.vx)*.55;}
      if(b.x>WIDTH-RADIUS){b.x=WIDTH-RADIUS;b.vx=-Math.abs(b.vx)*.55;}
      if(l.switch&&!this.switched&&Math.hypot(b.x-l.switch.x,b.y-l.switch.y)<RADIUS+l.switch.r){this.switched=true;this.events.push('switch');}
      const obstacles=(l.movers||[]).map(m=>moverAt(m,this.time));
      if(l.gate&&!this.switched)obstacles.push(l.gate);
      for(const rect of obstacles){
        const hit=circleRect(b,rect);if(!hit)continue;
        if(reflect(b,hit,.6)&&!this.bumpCooldown){this.events.push('bump');this.bumpCooldown=.18;}
        // Carry a ball off a moving edge instead of trapping it in the rectangle.
        if(rect.period){const vy=Math.cos(this.time*2*Math.PI/rect.period+(rect.phase||0))*rect.amplitude*2*Math.PI/rect.period;if(hit.ny*vy>0)b.vy+=vy*.3;}
      }
      const g=groundAt(l,b.x),norm=Math.hypot(1,g.slope),nx=g.slope/norm,ny=-1/norm;
      const distance=(g.y-b.y)/norm;
      let grounded=false;
      if(distance<RADIUS+.08){
        grounded=true;const sand=onSand(l,b.x),impact=-(b.vx*nx+b.vy*ny);
        const pad=l.pads.some(([a,z])=>b.x>=a&&b.x<=z);
        reflect(b,{nx,ny,depth:Math.max(0,RADIUS-distance)},impact>65?(sand?.12:.37):0);
        if(pad&&!this.padCooldown&&impact>20){b.vy=-550;b.vx=(Math.sign(b.vx)||1)*Math.max(240,Math.abs(b.vx));this.padCooldown=.5;grounded=false;this.events.push('spring');}
        else{
          const tx=1/norm,ty=g.slope/norm,vt=b.vx*tx+b.vy*ty;
          const friction=(sand?470:76)*STEP;
          const nv=Math.sign(vt)*Math.max(0,Math.abs(vt)-friction);
          b.vx+=(nv-vt)*tx;b.vy+=(nv-vt)*ty;
          if(impact>100&&!this.bumpCooldown){this.events.push(sand?'sand':'land');this.bumpCooldown=.2;}
        }
      }
      const cupY=groundAt(l,l.hole).y;
      const nearCup=Math.abs(b.x-l.hole)<19&&b.y>cupY-RADIUS-9&&b.y<cupY+12;
      if(nearCup&&Math.hypot(b.vx,b.vy)<215&&this.shots>0){
        if(!l.switch||this.switched){b.x=l.hole;b.y=cupY+2;b.vx=0;b.vy=0;this.state='won';this.events.push('win');return;}
        if(!this.lockedCooldown){this.events.push('locked');this.lockedCooldown=2;}
      }
      if(grounded&&Math.hypot(b.vx,b.vy)<14)this.restTime+=STEP;else this.restTime=0;
      if(this.restTime>.28){b.vx=0;b.vy=0;this.state='ready';this.events.push(onSand(l,b.x)?'restSand':'rest');}
      if(!Number.isFinite(b.x+b.y+b.vx+b.vy)||b.y>HEIGHT+240){this.ball={...this.lastLie,vx:0,vy:0};this.shots++;this.state='ready';this.events.push('penalty');}
      if(++this.trailTick%5===0){this.trail.push({x:b.x,y:b.y});if(this.trail.length>260)this.trail.shift();}
    }
    drainEvents(){return this.events.splice(0);}
    stars(){return this.state==='won'?this.shots<=this.level.par?3:this.shots===this.level.par+1?2:1:0;}
    preview(angle,power){
      if(this.state!=='ready')return [];
      const copy=new Game(this.index);copy.ball={...this.ball};copy.time=this.time;copy.switched=this.switched;copy.strike(angle,power);
      const points=[];for(let i=0;i<100;i++){copy.step();if(i%6===0)points.push({x:copy.ball.x,y:copy.ball.y});if(copy.state!=='moving')break;}return points;
    }
  }
  function cleanSave(raw){
    const source=raw&&typeof raw==='object'?raw:{};
    const best=LEVELS.map((_,i)=>Number.isInteger(source.best?.[i])&&source.best[i]>0&&source.best[i]<10000?source.best[i]:null);
    let unlocked=1;while(unlocked<LEVELS.length&&best[unlocked-1]!==null)unlocked++;
    // Corrupt or edited saves cannot unlock holes with gaps in the scorecard.
    for(let i=unlocked;i<best.length;i++)best[i]=null;
    const current=clamp(Number.isInteger(source.current)?source.current:0,0,unlocked-1);
    return {best,current,unlocked};
  }
  return {WIDTH,HEIGHT,RADIUS,GRAVITY,SPEED,STEP,LEVELS,Game,groundAt,onSand,moverAt,circleRect,cleanSave,clamp};
});
