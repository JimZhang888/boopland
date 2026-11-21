const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('./engine.js');
function sparse(mode='solo',numbers=[0,1]) {const s=E.create(mode);for(const b of s.balls)b.active=numbers.includes(b.n);return s;}
function b(s,n){return s.balls.find(b=>b.n===n);}
function settle(s,max=30) {for(let i=0;i<max/E.STEP&&s.phase==='moving';i++)E.tick(s);assert.notEqual(s.phase,'moving','balls must settle');return s;}
function resolved(s,{first=1,pots=[],scratch=false,rail=true}={}) {
  E.shoot(s,0,.5);s.shot.first=first;s.shot.pots=pots;s.shot.scratch=scratch;s.shot.rail=rail;
  for(const n of pots){b(s,n).active=false;s.potted.push(n);}if(scratch)b(s,0).active=false;
  E.finishShot(s);return s;
}
test('rack has 16 non-overlapping balls and the 8 centered',()=>{
  const s=E.create();assert.equal(s.balls.length,16);assert.equal(new Set(s.balls.map(b=>b.n)).size,16);assert.equal(b(s,8).y,310);
  for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)assert.ok(Math.hypot(s.balls[i].x-s.balls[j].x,s.balls[i].y-s.balls[j].y)>=24);
});
test('head-on collision transfers velocity and records first contact',()=>{
  const s=sparse();Object.assign(b(s,0),{x:300,y:300});Object.assign(b(s,1),{x:380,y:300});E.shoot(s,0,.3);
  for(let i=0;i<40&&s.shot.first===null;i++)E.tick(s);
  assert.equal(s.shot.first,1);assert.ok(b(s,1).vx>300);assert.ok(Math.abs(b(s,0).vx)<30);
});
test('thin cuts use the tangent-circle normal regardless of which part of a tick contains contact',()=>{
  for(const offset of [18,23,23.5,23.9,23.99,-23.99]) {
    // At these cut angles the ball-to-ball friction impulse is at its 0.055 limit.
    const expected=Math.asin(offset/(2*E.R))-Math.sign(offset)*Math.atan(.055);
    for(let phase=0;phase<=60;phase++) {
      const s=sparse(),target=b(s,1);
      Object.assign(b(s,0),{x:300,y:300});
      Object.assign(target,{x:380+phase/10,y:300+offset});
      const path=E.aim(s,0);
      assert.equal(path.hit,target);
      assert.ok(Math.abs(Math.hypot(target.x-path.x,target.y-path.y)-2*E.R)<1e-9);
      E.shoot(s,0,1);
      for(let i=0;i<30&&s.shot.first===null;i++) E.tick(s);
      assert.equal(s.shot.first,1);
      assert.ok(Math.abs(Math.atan2(target.vy,target.vx)-expected)<1e-8);
    }
  }
});
test('the guide and the actual shot distinguish a tangent, a near miss and a fine cut',()=>{
  for(const gap of [0,.001,-.001]) {
    const s=sparse(),target=b(s,1),tip={side:0,high:0};
    Object.assign(target,{x:380,y:310+2*E.R+gap});
    const path=E.aim(s,0),guides=E.contactGuide(s,0,1,tip,path);
    assert.equal(path.hit===target,gap<0);
    E.shoot(s,0,1);
    for(let i=0;i<30&&s.shot.first===null;i++) E.tick(s);
    assert.equal(s.shot.first,gap<0?1:null);
    if(gap>=0) {assert.deepEqual(guides,[]);assert.equal(target.vx,0);continue;}
    for(let i=1;i<60;i++) E.tick(s);
    const end=guides[1].at(-1);
    assert.ok(Math.hypot(end.x-target.x,end.y-target.y)<.11);
  }
});
test('a fast ball strikes the nearer target before a second impact in the same tick',()=>{
  const s=sparse('solo',[0,1,2]);
  Object.assign(b(s,0),{x:300,y:300});
  Object.assign(b(s,2),{x:325,y:300});
  Object.assign(b(s,1),{x:350,y:300});
  E.shoot(s,0,1);E.tick(s);
  assert.equal(s.shot.first,2);
  assert.ok(b(s,1).vx>1300);
});
test('two moving object balls still collide when the contact is entirely between samples',()=>{
  const s=sparse('solo',[0,1,2]),a=b(s,1),target=b(s,2);
  E.shoot(s,Math.PI,.05);
  Object.assign(a,{x:500,y:280,vx:900});
  Object.assign(target,{x:503,y:303.99,vx:-900});
  E.tick(s);
  assert.ok(a.vy<0&&target.vy>0);
  assert.equal(s.shot.first,null);
});
test('a symmetric double hit splits the impulse evenly',()=>{
  const s=sparse('solo',[0,1,2]),top=b(s,1),bottom=b(s,2);
  Object.assign(top,{x:370,y:298});Object.assign(bottom,{x:370,y:322});
  E.shoot(s,0,1);
  for(let i=0;i<25&&s.shot.first===null;i++) E.tick(s);
  assert.ok(top.vx>0&&top.vy<0);
  assert.ok(Math.abs(top.vx-bottom.vx)+Math.abs(top.vy+bottom.vy)<1e-6);
});
test('close straight shots follow or draw after contact in any aiming direction',()=>{
  for(const angle of [0, Math.PI/2, Math.PI, -Math.PI/2]) {
    const dx=Math.cos(angle),dy=Math.sin(angle);
    const travels=[-1,0,1].map(high=>{
      const s=sparse(),cue=b(s,0);
      Object.assign(cue,{x:500,y:310});
      Object.assign(b(s,1),{x:cue.x+80*dx,y:cue.y+80*dy});
      E.shoot(s,angle,.55,{side:0,high});
      for(let i=0;i<60&&s.shot.first===null;i++) E.tick(s);
      assert.equal(s.shot.first,1);
      const x=cue.x,y=cue.y;
      for(let i=0;i<60;i++) E.tick(s);
      return (cue.x-x)*dx+(cue.y-y)*dy;
    });
    assert.ok(travels[0]<-12 && travels[1]>=0 && travels[2]>travels[1]+12,travels);
  }
});
test('left and right tips give mirrored cushion rebounds and transfer opposite throw to the target',()=>{
  for(const side of [-1,0,1]) {
    const bank=sparse(),cue=b(bank,0);
    Object.assign(cue,{x:300,y:160});
    E.shoot(bank,-Math.PI/2,.55,{side,high:0});
    for(let i=0;i<64&&cue.vy<0;i++) {
      assert.ok(Math.abs(cue.x-300)<1e-8,'side spin alone must travel straight on open cloth');
      E.tick(bank);
    }
    assert.ok(cue.vy>0);
    if(side) assert.ok(cue.vx*side>30);else assert.ok(Math.abs(cue.vx)<1e-8);
    const shot=sparse();
    Object.assign(b(shot,1),{x:352,y:310});
    E.shoot(shot,0,.55,{side,high:0});
    for(let i=0;i<60&&shot.shot.first===null;i++) E.tick(shot);
    assert.equal(shot.shot.first,1);
    if(side) assert.ok(b(shot,1).vy*side < -5);else assert.equal(b(shot,1).vy,0);
  }
});
test('cloth converts sliding into rolling, with rotation tied to distance and spin decaying to rest',()=>{
  const s=sparse(),cue=b(s,0);
  Object.assign(cue,{x:180,y:200});
  E.shoot(s,0,.4,{side:.5,high:0});
  const initialSide=Math.abs(cue.wz);
  for(let i=0;i<85;i++) E.tick(s);
  assert.ok(Math.abs(cue.vx-E.R*cue.wy)<1e-7);
  assert.ok(Math.abs(cue.wz)<initialSide);
  assert.ok(Math.abs(Math.hypot(...cue.orientation)-1)<1e-9);
  assert.notDeepEqual(cue.orientation,[1,0,0,0]);
  settle(s);
  for(const axis of ['vx','vy','wx','wy','wz']) assert.equal(Math.abs(cue[axis]),0);

  const pure=sparse(),roller=b(pure,0);
  E.shoot(pure,0,.25);
  roller.wy=roller.vx/E.R;
  const startX=roller.x;
  for(let i=0;i<10;i++) E.tick(pure);
  const radians=(roller.x-startX)/E.R;
  assert.ok(Math.abs(roller.orientation[0]-Math.cos(radians/2))<1e-9);
  assert.ok(Math.abs(roller.orientation[2]-Math.sin(radians/2))<1e-9);
});
test('a diagonal tip respects the circular limit and the center remains the default',()=>{
  const diagonal=sparse(),edge=sparse(),center=sparse(),legacy=sparse();
  const tip=E.limitTip(4,-3);
  assert.deepEqual(tip,{side:.8,high:-.6});
  E.shoot(diagonal,0,.75,{side:4,high:-3});E.shoot(edge,0,.75,tip);
  assert.deepEqual(b(diagonal,0),b(edge,0));
  assert.ok(b(diagonal,0).wz<0&&b(diagonal,0).wy<0);
  assert.equal(E.shoot(center,0,.75,{side:NaN,high:0}),false);
  E.shoot(center,0,.75,{side:0,high:0});E.shoot(legacy,0,.75);
  assert.deepEqual(center,legacy);
});
test('a ball spinning at rest keeps turning until it stops, with no sideways drift',()=>{
  const s=sparse(),cue=b(s,0);
  E.shoot(s,0,.3);Object.assign(cue,{vx:0,vy:0,wx:0,wy:0,wz:18});
  E.tick(s);assert.equal(s.phase,'moving');assert.ok(cue.orientation[3]>0);
  settle(s);assert.equal(cue.x,280);assert.equal(cue.y,310);assert.equal(cue.wz,0);
});
test('cushion reflects a fast shot without tunneling',()=>{
  const s=sparse('solo',[0,1]);Object.assign(b(s,0),{x:300,y:130});Object.assign(b(s,1),{x:800,y:400});E.shoot(s,-Math.PI/2,1);
  for(let i=0;i<12;i++)E.tick(s);assert.ok(b(s,0).active);assert.ok(b(s,0).vy>0);assert.ok(b(s,0).y>=102);
});
test('all six pockets accept actual rolling object balls',()=>{
  E.POCKETS.forEach(p=>{const s=sparse();const dx=520-p.x,dy=310-p.y,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;
    Object.assign(b(s,1),{x:p.x+ux*80,y:p.y+uy*80});Object.assign(b(s,0),{x:p.x+ux*150,y:p.y+uy*150});
    E.shoot(s,Math.atan2(-uy,-ux),.25);settle(s);assert.ok(s.potted.includes(1),JSON.stringify(p));assert.equal(s.phase,'over');});
});
test('scratch leads to ball in hand and rejects obstructed placements',()=>{
  const s=sparse();Object.assign(b(s,0),{x:520,y:150});E.shoot(s,-Math.PI/2,.25);settle(s);
  assert.equal(s.phase,'placing');assert.equal(s.fouls,1);assert.equal(E.placeCue(s,520,78),false);assert.equal(E.placeCue(s,b(s,1).x,b(s,1).y),false);
  assert.equal(E.placeCue(s,280,310),true);assert.equal(s.phase,'aim');assert.ok(b(s,0).active);
});
test('opening shot breaks the rack and remains finite',()=>{
  const s=E.create();E.shoot(s,0,1);settle(s);assert.ok(s.balls.filter(x=>x.n&&Math.hypot(x.x-740,x.y-310)>100).length>=5);
  for(const ball of s.balls){assert.ok(Number.isFinite(ball.x+ball.y+ball.vx+ball.vy));if(ball.active){assert.ok(ball.x>46&&ball.x<994);assert.ok(ball.y>51&&ball.y<569);}}
});
test('prediction identifies first target and leaves game unchanged',()=>{
  const s=E.create(),before=JSON.stringify(s),a=E.aim(s,0);assert.equal(a.hit.n,1);assert.equal(a.x,671);assert.equal(JSON.stringify(s),before);
});
test('contact guides follow the shot physics, including draw and insufficient power',()=>{
  for(const high of [-1,1]) {
    const s=sparse();Object.assign(b(s,1),{x:360,y:310});
    const before=JSON.stringify(s),tip={side:0,high},path=E.aim(s,0);
    const [cueLine,targetLine]=E.contactGuide(s,0,.55,tip,path);
    assert.equal(JSON.stringify(s),before);
    assert.ok((cueLine.at(-1).x-path.x)*high>12);
    assert.ok(targetLine.at(-1).x>b(s,1).x);
    E.shoot(s,0,.55,tip);
    while(s.shot.first===null) E.tick(s);
    for(let i=1;i<60;i++) E.tick(s);
    assert.ok(Math.abs(b(s,0).x-cueLine.at(-1).x)<1e-7);
  }
  const far=sparse();Object.assign(b(far,1),{x:910,y:310});
  assert.deepEqual(E.contactGuide(far,0,.05,{side:0,high:-1},E.aim(far,0)),[]);
});
test('first legal pot assigns groups and retains the turn',()=>{
  const s=E.create('versus');resolved(s,{pots:[10],first:10});assert.deepEqual(s.groups,['stripes','solids']);assert.equal(s.player,0);assert.equal(s.reason,'again');
});
test('a legal miss passes the turn; opponent ball does not retain turn',()=>{
  const s=E.create('versus');s.groups=['solids','stripes'];resolved(s,{first:1});assert.equal(s.player,1);assert.equal(s.phase,'aim');
  resolved(s,{first:9,pots:[2]});assert.equal(s.player,0);
});
test('all versus fouls award opponent a free cue ball',()=>{
  for(const [reason,shot] of [['scratch',{scratch:true}],['noHit',{first:null}],['wrongHit',{first:10}],['noRail',{rail:false}]]) {
    const s=E.create('versus');s.groups=['solids','stripes'];resolved(s,shot);assert.equal(s.reason,reason);assert.equal(s.phase,'placing');assert.equal(s.player,1);assert.equal(s.fouls,1);assert.equal(b(s,0).active,false);
  }
});
test('a foul on an open table does not assign groups',()=>{
  const s=E.create('versus');resolved(s,{pots:[2],scratch:true});assert.deepEqual(s.groups,[null,null]);assert.equal(b(s,2).active,false);
});
test('early 8 including the break loses; legal last 8 wins',()=>{
  const early=E.create('versus');resolved(early,{first:8,pots:[8]});assert.equal(early.winner,1);assert.equal(early.reason,'earlyEight');
  const legal=sparse('versus',[0,8,9]);legal.groups=['solids','stripes'];resolved(legal,{first:8,pots:[8]});assert.equal(legal.phase,'over');assert.equal(legal.winner,0);assert.equal(legal.reason,'eightWin');
});
test('scratch with 8 loses and last group ball plus 8 in same shot loses',()=>{
  const s=sparse('versus',[0,8,9]);s.groups=['solids','stripes'];resolved(s,{first:8,pots:[8],scratch:true});assert.equal(s.winner,1);
  const other=sparse('versus',[0,1,8,9]);other.groups=['solids','stripes'];resolved(other,{first:1,pots:[1,8]});assert.equal(other.winner,1);
});
test('solo allows the 8 early and completes only with an empty table',()=>{
  const s=sparse('solo',[0,1,8]);resolved(s,{first:8,pots:[8]});assert.equal(s.phase,'aim');resolved(s,{first:1,pots:[1]});assert.equal(s.phase,'over');assert.equal(s.reason,'cleared');
});
test('invalid or repeated inputs cannot consume a shot',()=>{
  const s=E.create();assert.equal(E.shoot(s,NaN,.5),false);assert.equal(E.shoot(s,0,Infinity),false);assert.equal(E.shoot(s,0,-1),false);assert.equal(E.shoot(s,0,.5),true);assert.equal(E.shoot(s,1,.5),false);assert.equal(s.shots,1);
});
test('many high speed angles settle without escaping or overlapping',()=>{
  for(let i=0;i<24;i++) {const s=E.create();E.shoot(s,i*Math.PI/12,1);settle(s);for(const a of s.balls.filter(x=>x.active)){assert.ok(a.x>=46&&a.x<=994&&a.y>=51&&a.y<=569);for(const c of s.balls.filter(x=>x.active&&x.n>a.n))assert.ok(Math.hypot(a.x-c.x,a.y-c.y)>23.9);}}
});
test('all eight translations cover the same keys and placeholders',()=>{
  let dict;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(_scope,d)=>dict=d}});
  assert.equal(Object.keys(dict).length,8);const keys=Object.keys(dict.en).sort();
  for(const [lang,messages] of Object.entries(dict)){assert.deepEqual(Object.keys(messages).sort(),keys,lang);for(const key of keys){assert.ok(messages[key].length>0);assert.deepEqual([...messages[key].matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),[...dict.en[key].matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),lang+':'+key);}}
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const [,key] of html.matchAll(/data-i18n(?:-label|-title)?="billiards\.([^\"]+)"/g))assert.ok(dict.en[key],key);
});
test('single lobby registration and all local entry resources exist',()=>{
  const root=path.resolve(__dirname,'../..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(x=>x.path==='./games/paper-billiards/index.html');assert.equal(entries.length,1);assert.equal(Object.keys(entries[0].locales).length,7);
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const [,url]of html.matchAll(/(?:src|href)="([^\"]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,url)),url);
  assert.ok(!/<script[^>]+type="module"/.test(html));assert.equal((html.match(/analytics\.js/g)||[]).length,1);
});
