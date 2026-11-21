'use strict';

const PinballField = (() => {
  // One set of coordinates drives both the rails in the illustration and their collisions.
  const outer = [[129,461],[58,423],[38,407],[28,388],[25,362],[25,114],[29,85],[40,62],[59,42],[84,29],[116,22],[155,20],[294,20],[331,23],[358,30],[379,42],[397,60],[409,82],[415,106],[416,130],[416,504]];
  const divider = [[272,461],[343,423],[363,407],[373,388],[377,366],[377,141]];
  const sling = [[64,330],[72,335],[126,403],[129,410],[120,409],[82,388],[73,375],[62,339],[64,330]];
  const mirror = points => points.map(([x,y]) => [401-x,y]);
  const lamps = [116,168,220,272].map((x,i) => ({x, y:103, letter:'LUNA'[i]}));
  const bells = [{x:127,y:173,r:23,color:'#b8c7b6'}, {x:269,y:173,r:23,color:'#d6aca0'}, {x:198,y:241,r:25,color:'#e4c184'}];
  const tracks = [outer, divider, sling, mirror(sling)];
  const rails = tracks.flatMap(points => points.slice(1).map(([x,y],i) => [points[i][0],points[i][1],x,y,2.8]));
  for (const x of [90,142,194,246,298]) rails.push([x,98,x,109,2.6]);
  return {outer, divider, sling, tracks, rails, bells, lamps, pivots:[129,272], pivotY:461, length:61, batRadius:7.4, radius:6.6, maxSpeed:1250, fixedStep:1/240};
})();

class PaperPinball {
  constructor() { this.reset(); }

  reset() {
    this.score = 0;
    this.number = 1;
    this.hits = 0;
    this.time = 0;
    this.held = [false,false];
    this.angles = [0.43,Math.PI-0.43];
    this.effects = [];
    this.serve();
  }

  serve() {
    this.phase = 'ready';
    this.ball = {x:397, y:446, vx:0, vy:0};
    this.charge = 0;
    this.charging = false;
    this.inChute = true;
    this.lights = 0;
    this.doubleTime = 0;
    this.lastBell = [-2,-2,-2];
    this.lastLane = [-2,-2];
    this.onLamp = 0;
    this.effects.length = 0;
  }

  pressSpring() {
    if (this.phase === 'ready' && !this.charging) this.charging = true;
  }

  releaseSpring(cancel = false) {
    if (!this.charging) return;
    this.charging = false;
    if (!cancel && this.phase === 'ready') {
      this.phase = 'playing';
      this.ball.vy = -(825 + 320*this.charge);
    }
    this.charge = 0;
  }

  scoreAt(points, x, y, kind, index) {
    const gain = points * (this.doubleTime > 0 ? 2 : 1);
    this.score += gain;
    this.effects.push({kind, index, x, y, gain, time:this.time});
  }

  drain() {
    if (this.number < 3) {
      this.number++;
      this.serve();
    } else {
      this.phase = 'over';
      this.doubleTime = 0;
      this.held.fill(false);
    }
  }

  moveBats(dt) {
    for (let i=0;i<2;i++) {
      const leftAngle = this.held[i] ? -0.55 : 0.43;
      const target = i === 0 ? leftAngle : Math.PI-leftAngle;
      const delta = Math.min(Math.abs(target-this.angles[i]), (this.held[i] ? 14 : 7.2)*dt);
      this.angles[i] += Math.sign(target-this.angles[i])*delta;
    }
  }

  static closest(x,y,ax,ay,bx,by) {
    const dx=bx-ax, dy=by-ay;
    const t = Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy || 1)));
    return {x:ax+t*dx, y:ay+t*dy};
  }

  bounce(nx,ny,surfaceX,surfaceY,restitution) {
    const b=this.ball;
    const approach=(b.vx-surfaceX)*nx+(b.vy-surfaceY)*ny;
    if (approach >= 0) return;
    b.vx -= (1+restitution)*approach*nx;
    b.vy -= (1+restitution)*approach*ny;
    this.limitSpeed();
  }

  limitSpeed() {
    const b=this.ball, speed=Math.hypot(b.vx,b.vy);
    if (speed > PinballField.maxSpeed) {
      b.vx *= PinballField.maxSpeed/speed;
      b.vy *= PinballField.maxSpeed/speed;
    }
  }

  // Sweep the ball against a rotating capsule, including the rounded tip.
  // Ball speed plus maximum tip speed bounds the rate at which the gap can close.
  batContact(i, startAngle, endAngle, dt) {
    const f=PinballField, b=this.ball, ax=f.pivots[i], ay=f.pivotY;
    const range=f.length+f.batRadius+f.radius+f.maxSpeed*dt+1;
    if (Math.abs(b.x-ax)>range || Math.abs(b.y-ay)>range) return null;
    const omega=(endAngle-startAngle)/dt;
    const bound=Math.hypot(b.vx,b.vy)+Math.abs(omega)*f.length;
    let t=0;
    for (let j=0;j<22;j++) {
      const angle=startAngle+omega*t, x=b.x+b.vx*t, y=b.y+b.vy*t;
      const near=PaperPinball.closest(x,y,ax,ay,ax+f.length*Math.cos(angle),ay+f.length*Math.sin(angle));
      const dx=x-near.x, dy=y-near.y, dist=Math.hypot(dx,dy);
      const gap=dist-f.batRadius-f.radius;
      if (gap <= 0.025) {
        const nx=dist ? dx/dist : 0, ny=dist ? dy/dist : -1;
        return {t, nx, ny, push:Math.max(0,0.04-gap), sx:-omega*(near.y-ay), sy:omega*(near.x-ax)};
      }
      if (!bound) break;
      t += gap/bound;
      if (t>dt) break;
    }
    return null;
  }

  railContact([ax,ay,bx,by,r]) {
    const b=this.ball, limit=PinballField.radius+r;
    if (b.x<Math.min(ax,bx)-limit || b.x>Math.max(ax,bx)+limit || b.y<Math.min(ay,by)-limit || b.y>Math.max(ay,by)+limit) return;
    const p=PaperPinball.closest(b.x,b.y,ax,ay,bx,by);
    const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);
    if (d>=limit || d===0) return;
    const nx=dx/d, ny=dy/d;
    b.x+=nx*(limit-d+0.015); b.y+=ny*(limit-d+0.015);
    this.bounce(nx,ny,0,0,0.68);
  }

  contacts(previousY) {
    const b=this.ball, f=PinballField;
    for (const rail of f.rails) this.railContact(rail);
    // A wire gate closes only after the ball passes out of the spring lane.
    if (this.inChute && b.y<128) this.inChute=false;
    if (!this.inChute) this.railContact([377,141,416,130,2.1]);
    f.bells.forEach((bell,i) => {
      const dx=b.x-bell.x, dy=b.y-bell.y, d=Math.hypot(dx,dy), limit=bell.r+f.radius;
      if (d>=limit) return;
      const nx=d ? dx/d : 0, ny=d ? dy/d : -1;
      b.x=bell.x+nx*(limit+0.04); b.y=bell.y+ny*(limit+0.04);
      this.bounce(nx,ny,0,0,0.8);
      if (this.time-this.lastBell[i] > 0.10) {
        const kick=Math.max(0,460-(b.vx*nx+b.vy*ny));
        b.vx+=nx*kick; b.vy+=ny*kick;
        this.lastBell[i]=this.time;
        this.hits++;
        this.scoreAt(100,bell.x,bell.y,'bell',i);
      }
    });
    let inside=0;
    f.lamps.forEach(({x,y},i) => {
      if (Math.hypot(b.x-x,b.y-y)>18) return;
      const bit=1<<i;
      inside|=bit;
      if (this.onLamp&bit || this.lights&bit || this.doubleTime>0) return;
      this.lights|=bit;
      this.scoreAt(50,x,y,'lamp',i);
      if (this.lights===15) this.doubleTime=15;
    });
    this.onLamp=inside;
    if (previousY<391 && b.y>=391) {
      const lane=b.x<72 ? 0 : b.x>329 && b.x<377 ? 1 : -1;
      if (lane>=0 && this.time-this.lastLane[lane]>0.5) {
        this.lastLane[lane]=this.time;
        this.scoreAt(25,b.x,b.y,'lane',lane);
      }
    }
  }

  step(dt=PinballField.fixedStep) {
    if (this.phase==='over') return;
    this.time+=dt;
    const oldAngles=[...this.angles];
    this.moveBats(dt);
    while (this.effects.length && this.time-this.effects[0].time>0.64) this.effects.shift();
    const b=this.ball;
    if (this.phase==='ready') {
      if (this.charging) this.charge=Math.min(1,this.charge+dt/0.9);
      b.y=446+22*this.charge;
      return;
    }
    if (this.doubleTime>0) {
      this.doubleTime=Math.max(0,this.doubleTime-dt);
      if (this.doubleTime===0) this.lights=0;
    }
    const previousY=b.y;
    b.vy+=630*dt;
    this.limitSpeed();
    let first=null;
    for (let i=0;i<2;i++) {
      const hit=this.batContact(i,oldAngles[i],this.angles[i],dt);
      if (hit && (!first || hit.t<first.t)) first=hit;
    }
    if (first) {
      b.x+=b.vx*first.t+first.nx*first.push;
      b.y+=b.vy*first.t+first.ny*first.push;
      this.bounce(first.nx,first.ny,first.sx,first.sy,0.76);
    }
    const remaining=dt-(first?.t || 0);
    b.x+=b.vx*remaining; b.y+=b.vy*remaining;
    this.contacts(previousY);
    if (b.y>531) this.drain();
  }
}

