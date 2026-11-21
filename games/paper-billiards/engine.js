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
  function segment(x1,y1,x2,y2) {
    const length=Math.hypot(x2-x1,y2-y1);
    SEGMENTS.push({x1,y1,x2,y2,length,ux:(x2-x1)/length,uy:(y2-y1)/length});
  }
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
      // A tight rack transmits the break through neighbors already in contact.
      balls.push(ball(order[i++],695+col*R*Math.sqrt(3),310+(row-col/2)*2*R));
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
  // Entry time into a circle, given its relative center and the incoming velocity.
  // A geometric tangent has no approaching normal velocity and transfers no impulse.
  function circleEntry(dx,dy,vx,vy,radius) {
    const approach=dx*vx+dy*vy;
    if(approach<=radius*1e-9) return Infinity;
    const speed2=vx*vx+vy*vy, cross=dx*vy-dy*vx;
    const chord2=radius*radius-cross*cross/speed2;
    if(chord2<=radius*radius*1e-12) return Infinity;
    return Math.max(0,(approach-Math.sqrt(speed2*chord2))/speed2);
  }

  function cushionEntry(b,seg) {
    const x=b.x-seg.x1,y=b.y-seg.y1;
    const distance=-seg.uy*x+seg.ux*y;
    const closing=(distance>=0?1:-1)*(seg.uy*b.vx-seg.ux*b.vy);
    let time=Infinity;
    if(closing>1e-9) {
      const faceTime=Math.max(0,(Math.abs(distance)-R)/closing);
      const along=(x+b.vx*faceTime)*seg.ux+(y+b.vy*faceTime)*seg.uy;
      if(along>=0&&along<=seg.length) time=faceTime;
    }
    const along=x*seg.ux+y*seg.uy, alongSpeed=b.vx*seg.ux+b.vy*seg.uy;
    const startTime=circleEntry(-x,-y,b.vx,b.vy,R);
    if(startTime<time&&along+alongSpeed*startTime<=0) time=startTime;
    const endTime=circleEntry(seg.x2-b.x,seg.y2-b.y,b.vx,b.vy,R);
    if(endTime<time&&along+alongSpeed*endTime>=seg.length) time=endTime;
    return time;
  }

  function nextContact(balls,limit) {
    let first=null;
    const earlier=t=>t<=limit&&(!first||t<first.time);
    for(let i=0;i<balls.length;i++) {
      const a=balls[i];
      if(!a.active) continue;
      for(let j=i+1;j<balls.length;j++) {
        const b=balls[j];
        if(!b.active) continue;
        const dx=b.x-a.x,dy=b.y-a.y,vx=a.vx-b.vx,vy=a.vy-b.vy;
        if(Math.abs(dx)>2*R+Math.abs(vx)*limit||Math.abs(dy)>2*R+Math.abs(vy)*limit) continue;
        const time=circleEntry(dx,dy,vx,vy,2*R);
        if(first?.b&&time<=limit&&Math.abs(time-first.time)<1e-11) {
          (first.simultaneous??=[]).push({a,b});
        } else if(earlier(time)) first={time,a,b};
      }
      if(!a.vx&&!a.vy) continue;
      const reachX=Math.abs(a.vx)*limit+23,reachY=Math.abs(a.vy)*limit+23;
      if(a.x-reachX>FIELD.left&&a.x+reachX<FIELD.right&&a.y-reachY>FIELD.top&&a.y+reachY<FIELD.bottom) continue;
      for(let pocket=0;pocket<POCKETS.length;pocket++) {
        const p=POCKETS[pocket],dx=p.x-a.x,dy=p.y-a.y;
        const time=dx*dx+dy*dy<23*23?0:circleEntry(dx,dy,a.vx,a.vy,23);
        if(earlier(time)) first={time,a,pocket};
      }
      for(const seg of SEGMENTS) {
        const time=cushionEntry(a,seg);
        if(earlier(time)) first={time,a,seg};
      }
    }
    return first;
  }

  function ballContact(s,{a,b}) {
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),nx=dx/d,ny=dy/d;
    const overlap=Math.max(0,2*R-d)/2;
    a.x-=nx*overlap; a.y-=ny*overlap; b.x+=nx*overlap; b.y+=ny*overlap;
    const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(s.shot.first===null&&(a.n===0||b.n===0)) s.shot.first=a.n||b.n;
    if(rel>30) s.events.push({type:'collision',strength:Math.min(1,rel/1000)});
    return {a,b,nx,ny,rebound:.97*rel,normal:0,tangent:0};
  }
  function applyImpulse(contact) {
    const {a,b,nx,ny}=contact,tx=-ny,ty=nx;
    const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    const normal=Math.max(0,contact.normal+(rel+contact.rebound)/2);
    const slip=(a.vx-b.vx)*tx+(a.vy-b.vy)*ty+R*(a.wz+b.wz);
    const friction=.055*normal;
    const tangent=clamp(contact.tangent+slip/(2+2*INVERSE_INERTIA),-friction,friction);
    const impulse=normal-contact.normal,tangentImpulse=tangent-contact.tangent;
    const jx=impulse*nx+tangentImpulse*tx,jy=impulse*ny+tangentImpulse*ty;
    a.vx-=jx; a.vy-=jy; b.vx+=jx; b.vy+=jy;
    a.wz-=INVERSE_INERTIA*tangentImpulse/R; b.wz-=INVERSE_INERTIA*tangentImpulse/R;
    contact.normal=normal; contact.tangent=tangent;
  }
  function collideBalls(s,hit) {
    const first=ballContact(s,hit);
    if(!hit.simultaneous) {applyImpulse(first);return;}
    // Both sides of a symmetric rack can touch at once. Share the impulse across
    // those contacts with restitution fixed from each incoming velocity.
    const contacts=[first,...hit.simultaneous.map(pair=>ballContact(s,pair))];
    for(let pass=0;pass<16;pass++) for(const contact of contacts) applyImpulse(contact);
  }

  function bounce(s,b,seg) {
    const x=b.x-seg.x1,y=b.y-seg.y1,along=clamp(x*seg.ux+y*seg.uy,0,seg.length);
    const dx=x-along*seg.ux,dy=y-along*seg.uy,d=Math.hypot(dx,dy);
    const nx=dx/d,ny=dy/d,v=b.vx*nx+b.vy*ny,tx=-ny,ty=nx;
    const overlap=Math.max(0,R-d);
    b.x+=nx*overlap; b.y+=ny*overlap;
    const normalImpulse=-1.82*v,slip=b.vx*tx+b.vy*ty-R*b.wz;
    const friction=.20*normalImpulse;
    const tangentImpulse=clamp(-slip/(1+INVERSE_INERTIA),-friction,friction);
    b.vx+=normalImpulse*nx+tangentImpulse*tx; b.vy+=normalImpulse*ny+tangentImpulse*ty;
    b.wz-=INVERSE_INERTIA*tangentImpulse/R;
    if(s.shot.first!==null) s.shot.rail=true;
    if(-v>35) s.events.push({type:'rail',strength:Math.min(1,-v/900)});
  }

  function tick(s,dt=STEP) {
    if(s.phase!=='moving') return;
    s.time+=dt; s.shot.elapsed+=dt;
    let remaining=dt;
    while(remaining>0) {
      const hit=nextContact(s.balls,remaining);
      const travel=hit?hit.time:remaining;
      if(travel>0) for(const b of s.balls) {
        if(!b.active) continue;
        b.x+=b.vx*travel; b.y+=b.vy*travel;
        turnBall(b,travel);
      }
      remaining-=travel;
      if(!hit) break;
      if(hit.b) collideBalls(s,hit);
      else if(hit.seg) bounce(s,hit.a,hit.seg);
      else sink(s,hit.a,hit.pocket);
    }
    for(const b of s.balls) {
      if(!b.active) continue;
      clothStep(b,dt);
      // The only openings in the cushion lead into pockets; catch deep exits.
      if(b.x<46||b.x>994||b.y<51||b.y>569) {
        let nearest=0;
        POCKETS.forEach((p,i)=>{if(Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(b.x-POCKETS[nearest].x,b.y-POCKETS[nearest].y)) nearest=i;});
        sink(s,b,nearest);
      }
    }
    if(!s.balls.some(b=>b.active&&(b.vx||b.vy||b.wx||b.wy||b.wz))) finishShot(s);
  }
  function aim(s,angle) {
    const cue=s.balls[0],dx=Math.cos(angle),dy=Math.sin(angle);
    let distance=1500,hit=null;
    for(const b of s.balls) {
      if(!b.n||!b.active) continue;
      const d=circleEntry(b.x-cue.x,b.y-cue.y,dx,dy,2*R);
      if(d<distance) {distance=d;hit=b;}
    }
    const ray={x:cue.x,y:cue.y,vx:dx,vy:dy};
    for(const seg of SEGMENTS) {
      const d=cushionEntry(ray,seg);
      if(d<distance) {distance=d;hit=null;}
    }
    for(const p of POCKETS) {
      const d=circleEntry(p.x-cue.x,p.y-cue.y,dx,dy,23);
      if(d<distance) {distance=d;hit=null;}
    }
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
