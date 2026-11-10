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
  const ball = (n,x,y) => ({n,x,y,vx:0,vy:0,active:true,roll:0});
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
  function shoot(s,angle,power) {
    if(s.phase!=='aim'||!Number.isFinite(angle)||!Number.isFinite(power)||power<=0) return false;
    const cue=s.balls[0];
    if(!cue.active) return false;
    s.shots++; s.phase='moving'; s.reason='rolling'; s.lastPots=[];
    s.shot={first:null,rail:false,pots:[],scratch:false,elapsed:0,allowed:s.balls.filter(b=>b.active&&legalTarget(s,b.n)).map(b=>b.n)};
    const speed=140+clamp(power,0,1)*1310;
    cue.vx=Math.cos(angle)*speed; cue.vy=Math.sin(angle)*speed;
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
    Object.assign(s.balls[0],{x,y,active:true,vx:0,vy:0}); s.phase='aim'; s.reason='placed'; return true;
  }
  function freeSpot(s,preferred={x:280,y:310}) {
    if(canPlace(s,preferred.x,preferred.y)) return preferred;
    for(let y=114;y<=506;y+=26) for(let x=104;x<=936;x+=26) if(canPlace(s,x,y)) return {x,y};
    return null;
  }
  function finishShot(s) {
    const shot=s.shot; if(!shot) return;
    s.lastPots=[...shot.pots];
    for(const b of s.balls) { b.vx=0;b.vy=0; }
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
    b.active=false;b.vx=0;b.vy=0;
    if(b.n) { s.potted.push(b.n);s.shot.pots.push(b.n); } else s.shot.scratch=true;
    s.events.push({type:'pocket',n:b.n,x:b.x,y:b.y,pocket:p});
  }
  function tick(s,dt=STEP) {
    if(s.phase!=='moving') return;
    s.time+=dt; s.shot.elapsed+=dt;
    for(const b of s.balls) {
      if(!b.active) continue;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      const speed=Math.hypot(b.vx,b.vy); b.roll+=speed*dt/R;
      const k=speed>0?Math.max(0,1-(48+speed*.22)*dt/speed):0;
      b.vx*=k;b.vy*=k;
      const pocket=POCKETS.findIndex(p=>Math.hypot(b.x-p.x,b.y-p.y)<23);
      if(pocket>=0) {sink(s,b,pocket);continue;}
      for(const seg of SEGMENTS) {
        const sx=seg.x2-seg.x1,sy=seg.y2-seg.y1;
        const t=clamp(((b.x-seg.x1)*sx+(b.y-seg.y1)*sy)/(sx*sx+sy*sy),0,1);
        const dx=b.x-seg.x1-t*sx,dy=b.y-seg.y1-t*sy,d=Math.hypot(dx,dy);
        if(d<R&&d>1e-6) {
          const nx=dx/d,ny=dy/d,v=b.vx*nx+b.vy*ny;
          b.x+=nx*(R-d);b.y+=ny*(R-d);
          if(v<0) {b.vx-=1.82*v*nx;b.vy-=1.82*v*ny;
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
          const impulse=rel*.985;
          a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;
          if(a.n===0&&s.shot.first===null) s.shot.first=b.n;
          if(rel>30) s.events.push({type:'collision',strength:Math.min(1,rel/1000)});
        }
      }
    }
    if(!s.balls.some(b=>b.active&&Math.hypot(b.vx,b.vy)>1.5)) finishShot(s);
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
  return {W,H,R,STEP,FIELD,POCKETS,SEGMENTS,clamp,group,create,shoot,tick,finishShot,canPlace,placeCue,freeSpot,legalTarget,remaining,aim};
});
