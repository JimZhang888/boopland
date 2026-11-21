'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'engine.js'),'utf8');
const {Game,field}=vm.runInNewContext(source+';({Game:PaperPinball,field:PinballField})');
const dt=field.fixedStep;
function tick(game,frames) {for(let n=0;n<frames;n++) game.step(dt)}
function launch(game) {game.pressSpring();game.releaseSpring()}

test('holding or repeating a press cannot fire or create a second ball',()=>{
  const g=new Game(), b=g.ball;
  for(let n=0;n<720;n++) {g.pressSpring();g.step()}
  assert.equal(g.phase,'ready');assert.equal(g.charge,1);
  g.releaseSpring();const vy=b.vy;
  for(let n=0;n<9;n++) {g.pressSpring();g.releaseSpring()}
  assert.equal(g.ball,b);assert.equal(b.vy,vy);assert.equal(g.number,1);
});

test('fast shots rebound on both sides, including the moving face and rounded tip',()=>{
  for(const side of [0,1]) for(const pose of ['rest','raised','rising']) {
    for(const along of [15,32,46,field.length]) for(const incidence of [-.35,0,.35]) {
      const g=new Game();
      const direction=side===0?1:-1;
      g.held[side]=pose==='raised';tick(g,30);
      const angle=g.angles[side],tx=Math.cos(angle),ty=Math.sin(angle);
      let nx=direction*ty,ny=-direction*tx;
      if(along===field.length) {
        nx+=.38*tx;ny+=.38*ty;const len=Math.hypot(nx,ny);nx/=len;ny/=len;
      }
      const support=field.batRadius+field.radius;
      const cx=field.pivots[side]+tx*along,cy=field.pivotY+ty*along;
      launch(g);
      g.ball.x=cx+nx*(support+8);g.ball.y=cy+ny*(support+8);
      const scale=field.maxSpeed/Math.hypot(1,incidence);
      g.ball.vx=(-nx-ny*incidence)*scale;g.ball.vy=(-ny+nx*incidence)*scale;
      g.held[side]=pose!=='rest';
      let returned=false;
      for(let n=0;n<9;n++) {
        g.step();
        const b=g.ball;
        assert.ok((b.x-cx)*nx+(b.y-cy)*ny>0,`crossed through side ${side} in ${pose}`);
        if (b.vx*nx+b.vy*ny>70) returned=true;
      }
      assert.ok(returned,`no rebound: ${side}, ${pose}, ${along}, ${incidence}`);
    }
  }
});

test('three bells, both inlanes and four rollovers award their printed values',()=>{
  const g=new Game();launch(g);
  for(const bell of field.bells){Object.assign(g.ball,{x:bell.x,y:bell.y-bell.r-field.radius+1,vx:0,vy:60});g.step()}
  assert.equal(g.hits,3);assert.equal(g.score,300);
  for(const x of [56,347]) {Object.assign(g.ball,{x,y:390,vx:0,vy:320});g.step()}
  assert.equal(g.score,350);
  for(const light of field.lamps){Object.assign(g.ball,{x:light.x,y:light.y,vx:0,vy:0});tick(g,2)}
  assert.equal(g.score,550);assert.equal(g.lights,15);assert.ok(g.doubleTime>14.9);
  const bell=field.bells[0];tick(g,30);
  Object.assign(g.ball,{x:bell.x,y:bell.y-bell.r-field.radius+1,vx:0,vy:60});g.step();
  assert.equal(g.score,750);
  // Keep the ball out of scoring areas to measure all fifteen seconds of play time.
  for(let n=0;n<3601;n++) {Object.assign(g.ball,{x:202,y:326,vx:0,vy:0});g.step()}
  assert.equal(g.doubleTime,0);assert.equal(g.lights,0);
  Object.assign(g.ball,{x:bell.x,y:bell.y-bell.r-field.radius+1,vx:0,vy:60});g.step();
  assert.equal(g.score,850);
});

test('three unassisted launches drain naturally, retain the score and permit a fresh game',()=>{
  const g=new Game();
  let previous=0;
  for(let n=1;n<=3;n++){
    assert.equal(g.number,n);assert.equal(g.phase,'ready');launch(g);
    for(let i=0;i<30/dt && g.phase==='playing';i++)g.step();
    assert.ok(g.score>previous);previous=g.score;
    assert.equal(g.phase,n===3?'over':'ready');
  }
  const final=g.score;tick(g,480);assert.equal(g.score,final);
  g.reset();assert.equal(g.phase,'ready');assert.equal(g.score,0);assert.equal(g.number,1);
  assert.equal(g.doubleTime,0);assert.equal(g.lights,0);
});

