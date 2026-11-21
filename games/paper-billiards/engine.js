(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaperBilliards = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const W = 1040, H = 620, R = 12, STEP = 1 / 240;
  const FIELD = { left: 80, right: 960, top: 90, bottom: 530 };
  const POCKETS = [{x:80,y:90},{x:520,y:78},{x:960,y:90},{x:80,y:530},{x:520,y:542},{x:960,y:530}];
  const SEGMENTS = [];
  function segment(x1,y1,x2,y2) { SEGMENTS.push({x1,y1,x2,y2}); }
  for (const y of [90,530]) {
    const out = y === 90 ? -1 : 1;
    segment(116,y,492,y); segment(548,y,924,y);
    segment(116,y,96,y+20*out); segment(492,y,503,y+17*out);
    segment(548,y,537,y+17*out); segment(924,y,944,y+20*out);
  }
  for (const x of [80,960]) {
    const out = x === 80 ? -1 : 1;
    segment(x,126,x,494); segment(x,126,x+20*out,106); segment(x,494,x+20*out,514);
  }
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const group = n => n === 0 || n === 8 ? null : n < 8 ? 'solids' : 'stripes';
  // Velocities use table coordinates; +z points out of the cloth. Angular rates are radians/s.
  const INVERSE_INERTIA = 2.5; // m R² / I for a solid sphere
  const SLIDE_FRICTION = 640, MAX_TIP_OFFSET = .64;
  const ball = (n,x,y) => ({n,x,y,vx:0,vy:0,wx:0,wy:0,wz:0,orientation:[1,0,0,0],active:true});

  function limitTip(side=0, high=0) {
    const length=Math.max(1, Math.hypot(side,high));
    return {side:side/length, high:high/length};
  }
  function stopBall(b) { b.vx=b.vy=b.wx=b.wy=b.wz=0; }

  function turnBall(b,dt) {
    const rate=Math.hypot(b.wx,b.wy,b.wz);
    if(!rate) return;
    const half=rate*dt/2, factor=Math.sin(half)/rate;
    const w=Math.cos(half), x=b.wx*factor, y=b.wy*factor, z=b.wz*factor;
    const q=b.orientation, [a,i,j,k]=q;
    // Left multiply: the spin axis is in table space, even after a rebound.
    q[0]=w*a-x*i-y*j-z*k;
    q[1]=w*i+x*a+y*k-z*j;
    q[2]=w*j+y*a+z*i-x*k;
    q[3]=w*k+z*a+x*j-y*i;
  }

  function clothStep(b,dt) {
    // Contact velocity at the bottom of the ball. Friction changes both translation and spin.
    const slipX=b.vx-R*b.wy, slipY=b.vy+R*b.wx, slip=Math.hypot(slipX,slipY);
    let rollingTime=dt;
    if(slip>1e-7) {
      const slideTime=Math.min(dt,slip/((1+INVERSE_INERTIA)*SLIDE_FRICTION));
      const factor=-SLIDE_FRICTION*slideTime/slip;
      const jx=slipX*factor, jy=slipY*factor;
      b.vx+=jx; b.vy+=jy;
      b.wx+=INVERSE_INERTIA*jy/R; b.wy-=INVERSE_INERTIA*jx/R;
      rollingTime-=slideTime;
    }
    if(rollingTime>0) {
      const speed=Math.hypot(b.vx,b.vy);
      const fraction=speed?Math.max(0,1-(48+.22*speed)*rollingTime/speed):0;
      b.vx*=fraction; b.vy*=fraction;
      b.wx=-b.vy/R; b.wy=b.vx/R;
    }
    const sidespin=Math.abs(b.wz);
    b.wz=Math.sign(b.wz)*Math.max(0,sidespin-(9+.55*sidespin)*dt);
  }
  function create(mode = 'solo') {
    const balls = [ball(0,280,310)];
    const order = [1,9,2,10,8,3,4,11,5,12,13,6,14,7,15];
    let i = 0;
    for(let col=0;col<5;col++) for(let row=0;row<=col;row++) {
      balls.push(ball(order[i++],695+col*(R*2+.25)*Math.sqrt(3)/2,310+(row-col/2)*(R*2+.25)));
    }
    return { mode:mode==='versus'?'versus':'solo',balls,phase:'aim',shots:0,fouls:0,player:0,
      groups:[null,null],potted:[],events:[],shot:null,winner:null,reason:'ready',lastPots:[],time:0 };
  }
  function remaining(s,g) { return s.balls.filter(b=>b.active&&group(b.n)===g).length; }
  function legalTarget(s,n) {
    if(!n) return false;
    if(s.mode==='solo') return true;
    const g=s.groups[s.player];
    return !g ? n!==8 : remaining(s,g)===0 ? n===8 : group(n)===g;
  }
  function shoot(s,angle,power,tip={side:0,high:0}) {
    if(s.phase!=='aim'||!Number.isFinite(angle)||!Number.isFinite(power)||power<=0) return false;
    if(!tip||!Number.isFinite(tip.side)||!Number.isFinite(tip.high)) return false;
    const cue=s.balls[0];
    if(!cue.active) return false;
    s.shots++; s.phase='moving'; s.reason='rolling'; s.lastPots=[];
    s.shot={first:null,rail:false,pots:[],scratch:false,elapsed:0,allowed:s.balls.filter(b=>b.active&&legalTarget(s,b.n)).map(b=>b.n)};
    const contact=limitTip(tip.side,tip.high);
    const side=contact.side*MAX_TIP_OFFSET, high=contact.high*MAX_TIP_OFFSET;
    const speed=(140+clamp(power,0,1)*1310)/Math.sqrt(1+INVERSE_INERTIA*(side*side+high*high));
    cue.vx=Math.cos(angle)*speed; cue.vy=Math.sin(angle)*speed;
    cue.wx=-cue.vy*high*INVERSE_INERTIA/R;
    cue.wy= cue.vx*high*INVERSE_INERTIA/R;
    cue.wz=-speed*side*INVERSE_INERTIA/R;
    s.events.push({type:'strike',strength:power});
    return true;
  }
  function canPlace(s,x,y) {
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<94||x>946||y<104||y>516) return false;
    if(POCKETS.some(p=>Math.hypot(x-p.x,y-p.y)<32)) return false;
    return !s.balls.some(b=>b.n&&b.active&&Math.hypot(x-b.x,y-b.y)<R*2+.5);
  }
  function placeCue(s,x,y) {
    if(s.phase!=='placing'||!canPlace(s,x,y)) return false;
    stopBall(s.balls[0]);
    Object.assign(s.balls[0],{x,y,active:true}); s.phase='aim'; s.reason='placed'; return true;
  }
  function freeSpot(s,preferred={x:280,y:310}) {
    if(canPlace(s,preferred.x,preferred.y)) return preferred;
    for(let y=114;y<=506;y+=26) for(let x=104;x<=936;x+=26) if(canPlace(s,x,y)) return {x,y};
    return null;
  }
  function finishShot(s) {
    const shot=s.shot; if(!shot) return;
    s.lastPots=[...shot.pots];
    for(const b of s.balls) stopBall(b);
    if(s.mode==='solo') {
      if(shot.scratch) { s.fouls++; s.phase='placing'; s.reason='scratch'; }
      else { s.phase='aim';s.reason=shot.pots.length?'potted':'aim'; }
      if(s.balls.every(b=>b.n===0||!b.active)) { s.phase='over';s.winner=0;s.reason='cleared'; }
    } else {
      const foul=shot.scratch?'scratch':shot.first===null?'noHit':!shot.allowed.includes(shot.first)?'wrongHit':!shot.rail&&!shot.pots.length?'noRail':null;
      if(shot.pots.includes(8)) {
        s.winner=!foul&&shot.allowed.includes(8)?s.player:1-s.player;
        s.phase='over';s.reason=s.winner===s.player?'eightWin':'earlyEight';
      } else {
        if(!foul&&!s.groups[s.player]&&shot.pots.length) {
          s.groups[s.player]=group(shot.pots[0]);s.groups[1-s.player]=s.groups[s.player]==='solids'?'stripes':'solids';
        }
        const keep=!foul&&shot.pots.some(n=>group(n)===s.groups[s.player]);
        if(!keep) s.player=1-s.player;
        s.phase=foul?'placing':'aim';s.reason=foul||(keep?'again':'turn');
        if(foul) s.fouls++;
      }
    }
    if(s.phase==='placing') {
      s.balls[0].active=false;
      const spot=freeSpot(s); if(spot) Object.assign(s.balls[0],spot);
    }
    s.shot=null; s.events.push({type:'settled'});
  }
  function sink(s,b,p) {
    b.active=false;stopBall(b);
    if(b.n) { s.potted.push(b.n);s.shot.pots.push(b.n); } else s.shot.scratch=true;
    s.events.push({type:'pocket',n:b.n,x:b.x,y:b.y,pocket:p,orientation:b.orientation.slice()});
  }
  function tick(s,dt=STEP) {
    if(s.phase!=='moving') return;
    s.time+=dt; s.shot.elapsed+=dt;
    for(const b of s.balls) {
      if(!b.active) continue;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      turnBall(b,dt);
      clothStep(b,dt);
      const pocket=POCKETS.findIndex(p=>Math.hypot(b.x-p.x,b.y-p.y)<23);
      if(pocket>=0) {sink(s,b,pocket);continue;}
      for(const seg of SEGMENTS) {
        const sx=seg.x2-seg.x1,sy=seg.y2-seg.y1;
        const t=clamp(((b.x-seg.x1)*sx+(b.y-seg.y1)*sy)/(sx*sx+sy*sy),0,1);
        const dx=b.x-seg.x1-t*sx,dy=b.y-seg.y1-t*sy,d=Math.hypot(dx,dy);
        if(d<R&&d>1e-6) {
          const nx=dx/d,ny=dy/d,v=b.vx*nx+b.vy*ny;
          b.x+=nx*(R-d);b.y+=ny*(R-d);
          if(v<0) {
            const normalImpulse=-1.82*v;
            const tx=-ny,ty=nx;
            const slip=b.vx*tx+b.vy*ty-R*b.wz;
            const friction=.20*normalImpulse;
            const tangentImpulse=clamp(-slip/(1+INVERSE_INERTIA),-friction,friction);
            b.vx+=normalImpulse*nx+tangentImpulse*tx;
            b.vy+=normalImpulse*ny+tangentImpulse*ty;
            b.wz-=INVERSE_INERTIA*tangentImpulse/R;
            if(s.shot.first!==null) s.shot.rail=true;
            if(-v>35) s.events.push({type:'rail',strength:Math.min(1,-v/900)});
          }
        }
      }
      // The only openings in the cushion lead into pockets; catch deep exits.
      if(b.x<46||b.x>994||b.y<51||b.y>569) {
        let nearest=0;
        POCKETS.forEach((p,i)=>{if(Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(b.x-POCKETS[nearest].x,b.y-POCKETS[nearest].y)) nearest=i;});
        sink(s,b,nearest);
      }
    }
    for(let pass=0;pass<2;pass++) for(let i=0;i<s.balls.length;i++) {
      const a=s.balls[i];if(!a.active) continue;
      for(let j=i+1;j<s.balls.length;j++) {
        const b=s.balls[j];if(!b.active) continue;
        let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
        if(d>=R*2) continue;
        if(d<1e-6) {dx=1;dy=0;d=1;}
        const nx=dx/d,ny=dy/d,over=(R*2-d+.001)/2;
        a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;
        const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
        if(rel>0) {
          const impulse=rel*.985, tx=-ny, ty=nx;
          const slip=(a.vx-b.vx)*tx+(a.vy-b.vy)*ty+R*(a.wz+b.wz);
          const friction=.055*impulse;
          const tangentImpulse=clamp(slip/(2+2*INVERSE_INERTIA),-friction,friction);
          const jx=impulse*nx+tangentImpulse*tx,jy=impulse*ny+tangentImpulse*ty;
          a.vx-=jx;a.vy-=jy;b.vx+=jx;b.vy+=jy;
          a.wz-=INVERSE_INERTIA*tangentImpulse/R;
          b.wz-=INVERSE_INERTIA*tangentImpulse/R;
          if(a.n===0&&s.shot.first===null) s.shot.first=b.n;
          if(rel>30) s.events.push({type:'collision',strength:Math.min(1,rel/1000)});
        }
      }
    }
    if(!s.balls.some(b=>b.active&&(b.vx||b.vy||b.wx||b.wy||b.wz))) finishShot(s);
  }
  function aim(s,angle) {
    const cue=s.balls[0],dx=Math.cos(angle),dy=Math.sin(angle);
    let distance=1500,hit=null;
    for(const b of s.balls) {
      if(!b.n||!b.active) continue;
      const x=b.x-cue.x,y=b.y-cue.y,projection=x*dx+y*dy;
      const side=x*x+y*y-projection*projection;
      if(projection>0&&side<(2*R)**2) {
        const d=projection-Math.sqrt((2*R)**2-side);
        if(d>=0&&d<distance) {distance=d;hit=b;}
      }
    }
    const edges=[dx>0?(948-cue.x)/dx:dx<0?(92-cue.x)/dx:Infinity,dy>0?(518-cue.y)/dy:dy<0?(102-cue.y)/dy:Infinity];
    const wall=Math.min(...edges.filter(n=>n>=0));
    if(wall<distance) {distance=wall;hit=null;}
    return {x:cue.x+dx*distance,y:cue.y+dy*distance,hit,distance};
  }

  function contactGuide(s,angle,power,tip,path) {
    if(!path.hit) return [];
    const balls=s.balls.map(b=>({...b,orientation:b.orientation.slice()}));
    const preview={...s,balls,potted:s.potted.slice(),groups:s.groups.slice(),events:[]};
    if(!shoot(preview,angle,power,tip)) return [];
    const cue=balls[0],target=balls.find(b=>b.n===path.hit.n);
    // Only the cue moves before first contact. Keep that part of long or soft shots cheap.
    const dx=Math.cos(angle),dy=Math.sin(angle);
    let distance=path.distance;
    while(distance>0) {
      const travel=(cue.vx*dx+cue.vy*dy)*STEP;
      if(travel<=0) return [];
      if(travel>=distance) break;
      cue.x+=cue.vx*STEP;cue.y+=cue.vy*STEP;
      clothStep(cue,STEP);distance-=travel;
    }
    const paths=[[{x:path.x,y:path.y}],[{x:target.x,y:target.y}]];
    const lengths=[0,0];
    for(let i=0;i<60&&preview.phase==='moving';i++) {
      tick(preview);
      if(i===1&&preview.shot?.first!==target.n) return [];
      if(i%4!==3) continue;
      for(const [index,b] of [cue,target].entries()) {
        if(!b.active||lengths[index]>=80) continue;
        const points=paths[index],last=points[points.length-1];
        const step=Math.hypot(b.x-last.x,b.y-last.y);
        if(step<.1) continue;
        const fraction=Math.min(1,(80-lengths[index])/step);
        points.push({x:last.x+(b.x-last.x)*fraction,y:last.y+(b.y-last.y)*fraction});
        lengths[index]+=step;
      }
    }
    return paths;
  }
  return {W,H,R,STEP,FIELD,POCKETS,SEGMENTS,MAX_TIP_OFFSET,clamp,limitTip,group,create,shoot,tick,finishShot,canPlace,placeCue,freeSpot,legalTarget,remaining,aim,contactGuide};
});
