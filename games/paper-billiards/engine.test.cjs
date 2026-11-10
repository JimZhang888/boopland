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
  for(let i=0;i<40;i++)E.tick(s);assert.equal(s.shot.first,1);assert.ok(b(s,1).vx>300);assert.ok(Math.abs(b(s,0).vx)<30);
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
