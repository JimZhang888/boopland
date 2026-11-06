const test = require('node:test');
const assert = require('node:assert/strict');
const {Descent,H} = require('./engine.js');
function fixture(type='normal') {
  const g=new Descent(()=>.5);g.reset();g.platforms=[{id:2,row:1,x:170,y:302,w:140,type,visited:false,timer:null,dir:1}];
  Object.assign(g.player,{x:230,y:282,vy:150,standing:null});g.hp=4;return g;
}
test('landing catches a fast fall and only restores energy once',()=>{
  const g=fixture();g.player.vy=480;g.update(.08);assert.equal(g.player.standing,2);assert.equal(g.hp,5);assert.equal(g.player.y,287);
  g.player.standing=null;g.player.y=280;g.player.vy=100;g.update(.08);assert.equal(g.hp,5);
});
test('spikes hurt on landing with an invulnerability window',()=>{
  const g=fixture('spike');g.update(.08);assert.equal(g.hp,2);g.update(.1);assert.equal(g.hp,2);
  for(let i=0;i<13;i++)g.update(.1);assert.equal(g.mode,'over');assert.equal(g.reason,'spikes');
});
test('crumbling platforms disappear and release their passenger',()=>{
  const g=fixture('crumble');g.update(.08);assert.equal(g.player.standing,2);
  for(let i=0;i<6;i++)g.update(.1);assert.equal(g.platforms[0].broken,true);assert.equal(g.player.standing,null);assert.ok(g.player.vy>0);
});
test('spring launches upward; conveyor transports a stationary player',()=>{
  const spring=fixture('spring');spring.update(.08);assert.ok(spring.player.vy<0);assert.equal(spring.player.standing,null);
  const belt=fixture('belt');belt.update(.08);const before=belt.player.x;belt.update(.1);assert.ok(belt.player.x>before+8);
});
test('a missed platform can cause a fall despite camera following',()=>{
  const g=new Descent(()=>.5);g.reset();g.generate=()=>{};g.platforms=[];g.player.standing=null;
  for(let i=0;i<100&&g.mode==='playing';i++)g.update(.1);
  assert.equal(g.mode,'over');assert.equal(g.reason,'fall');assert.ok(g.player.y>g.camera+H);
});
test('ceiling damages and releases the player, rather than trapping them',()=>{
  const g=fixture();g.camera=300;g.update(.02);assert.equal(g.hp,2);assert.equal(g.player.standing,null);assert.ok(g.player.vy>0);
});
test('paused model remains unchanged and restarting clears a finished run',()=>{
  const g=fixture();g.mode='paused';const before=JSON.stringify(g);g.update(.1,1);assert.equal(JSON.stringify(g),before);
  g.reset();assert.equal(g.hp,6);assert.equal(g.floor,0);assert.equal(g.camera,0);assert.equal(g.player.standing,0);
});
test('landing on floor 100 wins and does not mutate after completion',()=>{
  const g=fixture();g.platforms[0].row=100;g.update(.08);assert.equal(g.mode,'won');const before=g.time;g.update(.1);assert.equal(g.time,before);
});
test('generated routes remain bounded and always provide a non-spike route',()=>{
  for(let seed=1;seed<=30;seed++){
    let s=seed;const random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
    const g=new Descent(random);g.camera=9000;g.generate();
    for(let row=1;row<=100;row++){const route=g.platforms.filter(p=>p.row===row&&p.type!=='spike');assert.equal(route.length,1);assert.ok(route[0].x>=30);assert.ok(route[0].x+route[0].w<=450.001);}
  }
});
