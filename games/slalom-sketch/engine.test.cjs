'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {courses,STEP,PENALTY,createRun,checkGates,step,edges}=require('./engine');

for (const c of courses) {
  test(c.id+' can finish cleanly with player inputs and replays deterministically',()=>{
    function ski(){
      const s=createRun(c);
      for(let i=0;i<60/STEP&&!s.finished;i++){
        const g=c.gates[s.next];
        const error=g ? g.x-s.x-Math.sin(s.angle)*c.speed*.23 : 0;
        step(s,Math.abs(error)>2?Math.sign(error):0);
      }
      return s;
    }
    const a=ski(), b=ski();
    assert.ok(a.finished);assert.equal(a.y,c.finish);
    assert.equal(a.passed,c.gates.length);assert.equal(a.penalty,0);
    assert.deepEqual(a,b);
    const finalTime=a.elapsed;step(a,1);assert.equal(a.elapsed,finalTime);
    assert.ok(a.trail.length>200);
  });
}
test('reverse, repeated, out-of-order and on-line starts do not consume gates',()=>{
  const s=createRun(courses[0]), [a,b]=s.course.gates;
  const forward=g=>checkGates(s,{x:g.x,y:g.y-1},{x:g.x,y:g.y+1});
  const reverse=g=>checkGates(s,{x:g.x,y:g.y+1},{x:g.x,y:g.y-1});
  reverse(a);forward(b);
  checkGates(s,{x:a.x,y:a.y},{x:a.x,y:a.y+1});
  assert.equal(s.next,0);
  forward(a);reverse(a);forward(a);
  assert.equal(s.passed,1);assert.equal(s.next,1);
  checkGates(s,{x:b.x+b.width,y:b.y-1},{x:b.x+b.width,y:b.y+1});
  reverse(b);forward(b);
  assert.equal(s.passed,1);assert.equal(s.next,2);assert.equal(s.penalty,PENALTY);
});
test('gate uses the interpolated crossing point, including the pole boundary',()=>{
  const s=createRun(courses[0]),g=s.course.gates[0],edge=g.x+g.width/2;
  checkGates(s,{x:edge-12,y:g.y-3},{x:edge+12,y:g.y+3});
  assert.deepEqual(s.results,[true]);
  const outside=createRun(s.course);
  checkGates(outside,{x:edge-10,y:g.y-3},{x:edge+12,y:g.y+3});
  assert.deepEqual(outside.results,[false]);
});
test('a segment spanning multiple gates resolves each once and charges each miss once',()=>{
  const s=createRun(courses[1]),end=s.course.finish;
  checkGates(s,{x:1000,y:0},{x:1000,y:end});
  checkGates(s,{x:1000,y:0},{x:1000,y:end});
  assert.equal(s.next,s.course.gates.length);assert.equal(s.passed,0);
  assert.equal(s.penalty,PENALTY*s.next);
});
test('snowdrift slows a run temporarily, then full downhill speed returns',()=>{
  const s=createRun(courses[0]),d=s.course.drifts[0];
  s.x=d.x;s.y=d.y-1;step(s,0);
  assert.equal(s.hit.size,1);assert.ok(s.slow>1);
  const impactY=s.y;step(s,0);
  assert.ok(s.y-impactY<s.course.speed*STEP*.6);
  for(let i=0;i<1.5/STEP;i++)step(s,0);
  assert.equal(s.slow,0);assert.equal(s.hit.size,1);
  const y=s.y;step(s,0);assert.ok(Math.abs(s.y-y-s.course.speed*STEP)<1e-8);
});
test('steering eases into both edges and returns toward straight when released',()=>{
  const s=createRun(courses[2]);step(s,1);assert.ok(s.angle>0&&s.angle<.1);
  for(let i=0;i<60;i++)step(s,1);const right=s.angle;assert.ok(right>.9);
  for(let i=0;i<30;i++)step(s,0);assert.ok(s.angle>0&&s.angle<right/2);
  for(let i=0;i<90;i++)step(s,-1);assert.ok(s.angle<-.9);
});
test('the last course narrows and every gate remains inside its piste',()=>{
  const c=courses[2];
  const width=y=>{const [l,r]=edges(c,y);return r-l;};
  assert.ok(width(c.finish)<width(0)*.6);
  for(const track of courses)for(const g of track.gates){
    const [l,r]=edges(track,g.y);
    assert.ok(g.x-g.width/2>l&&g.x+g.width/2<r);
  }
});
