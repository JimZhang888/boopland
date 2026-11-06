const assert=require('node:assert/strict');
const {test}=require('node:test');
const {Game,FLOOR,DANGER}=require('./engine.js');
function random(seed=7){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function advance(game,seconds){for(let i=0;i<seconds*180;i++)game.update(1/180);}
const tile=(id,x,y,hp=3,type='normal')=>({id,x,y,w:58,h:58,hp,max:hp,type,color:0,hit:0});
test('a full volley collides, scores, returns, and advances exactly one wave',()=>{
  const g=new Game(()=>{},random());g.start();g.aim(270,90);assert.equal(g.fire(),true);assert.equal(g.fire(),false);
  advance(g,24);assert.equal(g.state,'aim');assert.equal(g.wave,2);assert.ok(g.score>0);assert.equal(g.balls.length,0);assert.equal(g.queued,0);assert.ok(g.count>=32);assert.ok(g.origin>=22&&g.origin<=518);
});
test('adjacent bombs chain once, award energy, and collect nearby +5',()=>{
  const events=[];const g=new Game((type)=>events.push(type),random());g.tiles=[tile(1,100,100,1,'bomb'),tile(2,168,100,2,'bomb'),tile(3,236,100,4)];g.pickups=[{x:210,y:190,id:20}];g.damage(g.tiles[0],1);
  assert.ok(g.tiles.every(t=>t.hp===0));assert.equal(events.filter(t=>t==='bomb').length,2);assert.equal(g.combo,3);assert.equal(g.count,35);assert.equal(g.energy,62);
});
test('pause freezes all physics and can resume a volley',()=>{
  const g=new Game(()=>{},random());g.start();g.fire();advance(g,.2);g.pause();const snapshot=JSON.stringify(g);advance(g,10);assert.equal(JSON.stringify(g),snapshot);g.pause();advance(g,.2);assert.equal(g.state,'volley');assert.ok(g.shotTime>.3);
});
test('a brick face reflects a marble without tunnelling at double speed',()=>{
  const g=new Game(()=>{},random());g.tiles=[tile(123,240,200,50)];g.pickups=[];g.state='volley';g.speed=2;g.queued=0;g.balls=[{x:269,y:280,px:269,py:280,vx:0,vy:-670,r:5.1,age:0,hits:new Map()}];g.update(.04);assert.ok(g.balls[0].vy>0);assert.equal(g.tiles[0].hp,49);assert.ok(g.balls[0].y>263);
});
test('piercing consumes the charge and passes through multiple rows',()=>{
  const g=new Game(()=>{},random());g.tiles=[tile(1,240,200,40),tile(2,240,300,40)];g.pickups=[];g.start();g.energy=99;assert.equal(g.toggleFury(),false);g.energy=100;assert.equal(g.toggleFury(),true);g.aim(270,80);g.count=1;g.fire();assert.equal(g.energy,0);advance(g,.7);assert.ok(g.tiles.every(t=>t.hp<40));assert.ok(g.balls[0].vy<0);assert.equal(g.armed,false);
});
test('recall is gated and brings the volley to the next round',()=>{
  const g=new Game(()=>{},random());g.start();g.fire();assert.equal(g.recall(),false);advance(g,2.1);assert.equal(g.recall(),true);assert.equal(g.state,'settle');advance(g,1);assert.equal(g.state,'aim');assert.equal(g.balls.length,0);
});
test('danger-line loss and restart restore a clean game',()=>{
  const g=new Game(()=>{},random());g.state='settle';g.tiles=[tile(1,100,DANGER-70)];g.nextWave();assert.equal(g.state,'over');g.reset();assert.equal(g.state,'intro');assert.equal(g.count,30);assert.equal(g.score,0);assert.equal(g.combo,0);assert.equal(g.wave,1);assert.equal(g.balls.length,0);
});
test('extreme aim angles terminate and never produce invalid coordinates',()=>{
  for(const angle of [-Math.PI+.14,-.14,-Math.PI/2]){const g=new Game(()=>{},random(18));g.start();g.angle=angle;g.fire();advance(g,24);assert.ok(['aim','over'].includes(g.state));assert.ok(Number.isFinite(g.origin));assert.ok(g.tiles.every(t=>Number.isFinite(t.hp)));}
});
test('endless waves remain bounded and all generated rows have bombs',()=>{
  const g=new Game(()=>{},random(125));g.start();for(let i=0;i<150;i++){g.tiles=[];g.pickups=[];g.nextWave();assert.ok(g.tiles.some(t=>t.type==='bomb'));assert.ok(g.count<=120);assert.ok(g.tiles.every(t=>t.x>=0&&t.x+t.w<=540));}assert.equal(g.count,120);
});
