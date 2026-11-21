const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('./field.js');

const view = { w: 800, h: 480 };
const centered = b => ({ x: b.x, y: b.y, ...F.frame });
function exposure(time, focus=1) {
  const b=F.pose(0,time,view);
  return F.score(b,centered(b),focus,F.leaves(0,view));
}

test('an empty scene, an out-of-frame bird and a fully covered bird all score zero',()=>{
  const b=F.pose(0,4.8,view);
  assert.equal(F.pose(0,1.5,view),null);
  assert.equal(F.score(null,centered(b),1,[]).total,0);
  assert.equal(F.score(b,{...centered(b),x:567},1,[]).total,0);
  assert.equal(F.score(b,centered(b),1,[{...b,rx:80,ry:80,angle:0}]).total,0);
});
test('the actual foreground leaves cover half the arriving robin, scoring 40 of 80',()=>{
  const half=exposure(2.6);
  assert.ok(half.visible>.49 && half.visible<.52);
  assert.deepEqual([half.position,half.clarity,half.action,half.total],[20,20,0,40]);
  assert.equal(exposure(3.6).total,80);
});
test('centering, focus and characteristic motion are independent and bounded',()=>{
  const b=F.pose(0,4.8,view);
  assert.equal(exposure(4.8).total,100);
  assert.equal(exposure(4.8,0).total,60);
  const side=F.score(b,{...centered(b),x:b.x+32},1,[]);
  assert.ok(side.position<40);
  assert.deepEqual([side.clarity,side.action],[40,20]);
});
test('rapid shutter presses each add one exposure until the roll is exhausted',()=>{
  const s=F.outing();for(let i=1;i<=6;i++){
    assert.ok(F.shoot(s,view));assert.equal(s.shots.length,i);assert.equal(s.film,6-i);
  }
  assert.equal(F.shoot(s,view),null);assert.equal(s.shots.length,6);
  assert.equal(F.outing().film,6);
});
test('every bird can be seen, focused and photographed in action on a single roll',()=>{
  const s=F.outing(()=>.4), seen=new Set();
  for (let n=0;n<6;n++){
    const i=F.current(s);seen.add(i);
    assert.equal(F.pose(i,0,view),null);
    s.time=4;s.focusing=true;
    for(let t=0;t<65;t++){
      const b=F.pose(i,s.time,view);F.aimAt(s,b.x,b.y,view);F.tick(s,.016,view);
    }
    const b=F.pose(i,s.time,view);F.aimAt(s,b.x,b.y,view);
    assert.equal(F.shoot(s,view).total,100);
    F.tick(s,F.visitEnd-s.time+.01,view);
    if(n<5)assert.equal(s.focus,0);
  }
  assert.equal(seen.size,6);assert.equal(s.film,0);
});
test('leaving the subject loses focus, the next bird requires a new focus request',()=>{
  const s=F.outing();s.time=4.8;s.focusing=true;
  for(let i=0;i<60;i++)F.tick(s,.016,view);
  assert.equal(s.focus,1);F.aimAt(s,730,410,view);
  for(let i=0;i<60;i++)F.tick(s,.016,view);
  assert.equal(s.focus,0);F.tick(s,F.visitEnd-s.time+.1,view);assert.equal(s.focusing,false);
});
test('viewfinder stays inside both landscape and portrait scenes',()=>{
  const s=F.outing();
  for(const v of [F.world(286,416),F.world(800,228)]){
    F.aimAt(s,-100,2000,v); const c=F.viewfinder(s,v);
    assert.ok(Math.abs(c.x-c.w/2)<1e-6);assert.ok(Math.abs(c.y-(v.h-c.h/2))<1e-6);
  }
});

