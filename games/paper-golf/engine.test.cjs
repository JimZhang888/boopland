const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('./engine.js');
const shots=[[0,47],[0,65],[0,65],[0,29],[35,71],[0,56],[0,77],[0,74],[45,89]];
function settle(game,limit=30){for(let i=0;i<limit*120&&game.state==='moving';i++)game.advance(E.STEP);return game;}
function at(game,x){game.ball.x=x;game.ball.y=E.groundAt(game.level,x).y-E.RADIUS;game.ball.vx=game.ball.vy=0;game.state='ready';}
test('all nine holes are playable to completion through real strokes',()=>{
  shots.forEach(([a,p],i)=>{const g=new E.Game(i);assert.equal(g.strike(a,p),true);settle(g);assert.equal(g.state,'won',`Hole ${i+1}`);assert.equal(g.shots,1);assert.equal(g.stars(),3);if(g.level.switch)assert.equal(g.switched,true);});
});
test('sub-par, par, bogey and completion scores remain consistent',()=>{
  for(const [offset,stars] of [[-1,3],[0,3],[1,2],[4,1]]){const g=new E.Game();g.shots=g.level.par+offset-1;g.strike(...shots[0]);settle(g);assert.equal(g.stars(),stars);}
});
test('each hole accepts consecutive shots from the actual resting lie',()=>{
  for(let index=0;index<9;index++){const g=new E.Game(index);g.strike(40,8);settle(g);assert.equal(g.state,'ready');const x=g.ball.x,y=g.ball.y;assert.ok(x>g.level.tee);g.strike(48,20);assert.equal(g.ball.x,x);assert.equal(g.ball.y,y);assert.equal(g.shots,2);settle(g);assert.notEqual(g.state,'moving');}
});
test('sand reduces outgoing speed and strongly brakes a rolling ball',()=>{
  const sand=new E.Game(1),grass=new E.Game(1);at(sand,430);at(grass,120);sand.strike(30,40);grass.strike(30,40);assert.ok(Math.hypot(sand.ball.vx,sand.ball.vy)<Math.hypot(grass.ball.vx,grass.ball.vy)*.8);
  at(sand,430);at(grass,100);for(const g of [sand,grass]){g.state='moving';g.ball.vx=95;g.shots=1;}for(let i=0;i<30;i++){sand.step();grass.step();}assert.ok(Math.abs(sand.ball.vx)<Math.abs(grass.ball.vx)*.2);
});
test('the ball accelerates down a slope and settles on level ground',()=>{
  const g=new E.Game(0);at(g,560);g.state='moving';g.shots=1;for(let i=0;i<60;i++)g.step();assert.ok(g.ball.x>565);assert.ok(g.ball.vx>20);settle(g);assert.equal(g.state,'ready');assert.ok(g.ball.x>680);
});
test('spring pads give an upward impulse with a cooldown',()=>{
  const g=new E.Game(3);at(g,460);g.ball.y-=10;g.ball.vy=150;g.state='moving';g.shots=1;for(let i=0;i<15;i++)g.step();assert.ok(g.ball.vy<-400);assert.ok(g.drainEvents().includes('spring'));assert.ok(g.padCooldown>0);
});
test('a locked cup cannot complete before the button is touched',()=>{
  const g=new E.Game(5);at(g,g.level.hole);g.state='moving';g.shots=1;g.step();assert.notEqual(g.state,'won');assert.ok(g.drainEvents().includes('locked'));g.switched=true;g.step();assert.equal(g.state,'won');
});
test('switch activation persists across strokes and resets on replay',()=>{
  const g=new E.Game(5);at(g,370);g.strike(30,5);settle(g);assert.equal(g.switched,true);g.strike(40,8);assert.equal(g.switched,true);g.reset();assert.equal(g.switched,false);assert.equal(g.shots,0);
});
test('high-speed shots collide with thin gates without passing through',()=>{
  const g=new E.Game(5);g.ball={x:600,y:240,vx:740,vy:0,rotation:0};g.state='moving';g.shots=1;for(let i=0;i<8;i++)g.step();assert.ok(g.ball.x<620);assert.ok(g.ball.vx<0);assert.ok(g.drainEvents().includes('bump'));
});
test('moving panels change position and collide at their current position',()=>{
  const g=new E.Game(4),m=g.level.movers[0];assert.notEqual(E.moverAt(m,0).y,E.moverAt(m,1).y);g.time=1;const r=E.moverAt(m,g.time);g.ball={x:r.x-15,y:r.y+55,vx:600,vy:0,rotation:0};g.state='moving';g.shots=1;for(let i=0;i<5;i++)g.step();assert.ok(g.ball.vx<0);
});
test('a moving panel wakes a resting ball',()=>{
  const g=new E.Game(4);const r=E.moverAt(g.level.movers[0],0);g.ball.x=r.x-4;g.ball.y=r.y+50;g.step();assert.equal(g.state,'moving');assert.ok(g.ball.x<r.x-4);
});
test('different frame rates produce identical fixed-step outcomes',()=>{
  const a=new E.Game(4),b=new E.Game(4);a.strike(42,57);b.strike(42,57);for(let i=0;i<90;i++)a.advance(1/30);for(let i=0;i<432;i++)b.advance(1/144);assert.equal(a.state,b.state);assert.ok(Math.abs(a.ball.x-b.ball.x)<1e-8);assert.ok(Math.abs(a.ball.y-b.ball.y)<1e-8);assert.ok(Math.abs(a.time-b.time)<1e-8);
});
test('pause freezes the ball, moving mechanisms, accumulator and shots',()=>{
  const g=new E.Game(4);g.strike(40,60);g.advance(.1);g.paused=true;const before=JSON.stringify(g);for(let i=0;i<30;i++)g.advance(.1);assert.equal(JSON.stringify(g),before);assert.equal(g.strike(30,50),false);g.paused=false;g.advance(.1);assert.notEqual(JSON.stringify(g),before);
});
test('trajectory preview does not change gameplay or pending events',()=>{
  const g=new E.Game(8);const before=JSON.stringify(g);assert.ok(g.preview(35,60).length>3);assert.equal(JSON.stringify(g),before);
});
test('click-sized, repeated and invalid strokes are rejected',()=>{
  const g=new E.Game();for(const [a,p] of [[NaN,50],[45,NaN],[45,0],[Infinity,50]])assert.equal(g.strike(a,p),false);assert.equal(g.shots,0);g.strike(45,50);assert.equal(g.strike(45,50),false);assert.equal(g.shots,1);for(const dt of [0,-1,NaN,Infinity])g.advance(dt);assert.ok(Number.isFinite(g.ball.x));
});
test('holes remain solvable at several initial mechanism phases',()=>{
  for(const index of [4,7,8])for(const time of [0,1,2.3,4.6]){let solved=false;outer:for(let angle=0;angle<=80;angle+=5)for(let power=20;power<=100;power+=3){const g=new E.Game(index);g.time=time;g.strike(angle,power);settle(g,20);if(g.state==='won'){solved=true;break outer;}}assert.ok(solved,`Hole ${index+1} at ${time}s`);}
});
test('extreme and reverse shots stay finite and eventually stop',()=>{
  for(let index=0;index<9;index++)for(const angle of [0,30,90,135,180])for(const power of [3,40,100]){const g=new E.Game(index);g.strike(angle,power);settle(g,40);assert.notEqual(g.state,'moving',`Hole ${index+1}, ${angle}°, ${power}% never rested`);assert.ok(Number.isFinite(g.ball.x+g.ball.y));assert.ok(g.ball.x>=0&&g.ball.x<=E.WIDTH);}
});
test('corrupt saves cannot fabricate unlocks or invalid records',()=>{
  for(const raw of [null,false,123,'bad',{}, {best:[-1,NaN,Infinity,0,'1'],current:80}])assert.deepEqual(E.cleanSave(raw),{best:Array(9).fill(null),current:0,unlocked:1});const good=E.cleanSave({best:[4,3,2],current:6});assert.equal(good.unlocked,4);assert.equal(good.current,3);assert.equal(E.cleanSave({best:[null,1],current:1}).unlocked,1);
});
test('all eight languages have matching text keys and placeholders',()=>{
  let messages;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(scope,m)=>{assert.equal(scope,'paperGolf');messages=m;}}});assert.equal(Object.keys(messages).length,8);const keys=Object.keys(messages.en).sort();for(const [lang,dictionary]of Object.entries(messages)){assert.deepEqual(Object.keys(dictionary).sort(),keys,lang);for(const key of keys){assert.equal(typeof dictionary[key],'string');assert.ok(dictionary[key].trim());assert.deepEqual((dictionary[key].match(/\{\w+\}/g)||[]).sort(),(messages.en[key].match(/\{\w+\}/g)||[]).sort(),lang+':'+key);}}
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const match of html.matchAll(/data-i18n(?:-label|-title)?="paperGolf\.([^"]+)"/g))assert.ok(messages.en[match[1]],match[1]);
});
test('lobby registration is unique and all entry resources are local and present',()=>{
  const root=path.resolve(__dirname,'../..'),window={};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),{window});const entries=window.GAME_LIST.filter(x=>x.path==='./games/paper-golf/index.html');assert.equal(entries.length,1);assert.equal(Object.keys(entries[0].locales).length,7);assert.ok(fs.existsSync(path.join(root,entries[0].cover)));const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){assert.ok(!/^https?:|^\//.test(match[1]));assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);}assert.equal((html.match(/src="\.\.\/\.\.\/analytics\.js"/g)||[]).length,1);
});
