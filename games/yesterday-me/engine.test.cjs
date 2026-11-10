'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, INPUT: I, LEVELS, LIMIT } = require('./engine.js');
const tick = (g, n = 1, input = 0) => { for (let i = 0; i < n; i++) g.step(input); };
function walk(g, x, max = 400) {
  for (let i = 0; i < max && Math.abs(g.player.x - x) > 2 && g.phase !== 'won'; i++) g.step(g.player.x < x ? I.RIGHT : I.LEFT);
  assert.ok(g.phase === 'won' || Math.abs(g.player.x - x) <= 2, `walk target ${x}, actual ${g.player.x}, y ${g.player.y}, phase ${g.phase}`);
  tick(g, 2);
}
function echo(g, x) { walk(g, x); tick(g, 16); assert.equal(g.rewind(), 'saved'); }
function crossBridge(g) {
  g.step(I.WAIT);
  for(let i=0;i<500&&g.bridges[0].y<409;i++)g.step(0);
  assert.ok(g.bridges[0].supported, 'bridge needs recorded support');
  walk(g, 300);
  g.step(I.RIGHT|I.JUMP);tick(g, 44, I.RIGHT);
  assert.equal(g.player.grounded,true,'first jump lands on the caught bridge');
  walk(g, 534);
  g.step(I.RIGHT|I.JUMP);tick(g, 43, I.RIGHT);
  assert.equal(g.player.y,298,'second jump reaches the higher right bank');
}
const solutions = [
  g=>{echo(g,238);walk(g,880);},
  g=>{echo(g,238);echo(g,470);walk(g,880);},
  g=>{echo(g,228);walk(g,375);g.step(I.ACT);assert.equal(g.player.carrying,0);walk(g,570);g.step(I.ACT);tick(g,3);assert.equal(g.plates[1].active,true);walk(g,478);tick(g,5);assert.equal(g.rewind(),'saved');walk(g,880);},
  g=>{echo(g,445);crossBridge(g);walk(g,880);},
  g=>{echo(g,380);echo(g,510);crossBridge(g);walk(g,880);},
  g=>{echo(g,238);echo(g,445);walk(g,117);g.step(I.ACT);assert.equal(g.player.carrying,0);crossBridge(g);walk(g,693);g.step(I.ACT);tick(g,4);assert.equal(g.plates[2].active,true);walk(g,900);}
];
solutions.forEach((solve,i)=>test(`level ${i+1}: complete using actual recorded movement, actions and physics`,()=>{const g=new Game(i);solve(g);assert.equal(g.phase,'won');assert.equal(g.memories.length,LEVELS[i].ideal);assert.ok(g.frame<LIMIT);}));
test('an echo replays movement and jumping at exactly the original frames, then remains in place',()=>{
  const g=new Game(0), positions=[];
  for(let i=0;i<90;i++){g.step(i<45?I.RIGHT|(i===10?I.JUMP:0):0);positions.push([g.player.x,g.player.y]);}
  g.rewind();
  positions.forEach(p=>{g.step(I.WAIT);assert.deepEqual([g.actors[0].x,g.actors[0].y],p);});
  tick(g,200);assert.equal(g.actors[0].x,positions.at(-1)[0]);assert.equal(g.actors[0].y,388);
});
test('switches require simultaneous pressure; closed doors block travel',()=>{
  const g=new Game(1);tick(g,300,I.RIGHT);assert.equal(g.player.x,702);assert.equal(g.phase,'running');assert.equal(g.gates[0].open,false);
  g.clear();echo(g,238);tick(g,300,I.RIGHT);assert.equal(g.player.x,702);assert.equal(g.gates[0].open,false);
});
test('a box-only plate cannot be opened by a person, including an echo',()=>{
  const g=new Game(2);echo(g,228);walk(g,608);assert.equal(g.plates[1].active,false);g.rewind();tick(g,250,I.WAIT);assert.equal(g.plates[1].active,false);
});
test('carrying a box against a closed gate cannot bypass its switches',()=>{
  const g=new Game(5);walk(g,117);g.step(I.ACT);tick(g,150,I.RIGHT);assert.equal(g.player.x,278);assert.equal(g.gates[0].open,false);assert.equal(g.plates[0].active,false);
});
test('box pickup and drop are replayed, with exclusive ownership and resets',()=>{
  const g=new Game(2);echo(g,228);walk(g,375);g.step(I.ACT);walk(g,570);g.step(I.ACT);tick(g,4);g.rewind();tick(g,300,I.WAIT);
  assert.equal(g.boxes[0].owner,null);assert.equal(g.plates[1].active,true);assert.equal(g.actors[1].carrying,null);
  g.retry();assert.equal(g.boxes[0].x,398);assert.equal(g.boxes[0].owner,null);assert.equal(g.memories.length,2);
});
test('unsupported bridges stay out of reach; both support marks are needed',()=>{
  const g=new Game(4);echo(g,380);tick(g,300,I.WAIT);assert.equal(g.bridges[0].supported,false);assert.equal(g.bridges[0].y,g.bridges[0].top);
  g.clear();tick(g,300,I.RIGHT);assert.equal(g.player.x,572);assert.equal(g.phase,'running');
});
test('ready does not consume time, recordings are bounded and timeout can be saved',()=>{
  const g=new Game();tick(g,200);assert.equal(g.frame,0);assert.equal(g.rewind(),'short');tick(g,LIMIT+100,I.WAIT);assert.equal(g.phase,'timeout');assert.equal(g.track.length,LIMIT);assert.equal(g.rewind(),'saved');assert.equal(g.phase,'ready');
});
test('retry keeps echoes, undo removes only the latest, and clear resets all',()=>{
  const g=new Game(1);echo(g,238);echo(g,470);tick(g,40,I.RIGHT);assert.equal(g.rewind(),'full');const old=g.memories[0].slice();g.retry();assert.equal(g.memories.length,2);assert.equal(g.frame,0);assert.equal(g.undo(),true);assert.deepEqual(g.memories,[old]);g.clear();assert.equal(g.memories.length,0);assert.equal(g.player.x,90);
});
test('won and timeout states stop simulation',()=>{
  const g=new Game();solutions[0](g);const f=g.frame;tick(g,300,I.RIGHT);assert.equal(g.frame,f);
});
test('all eight languages cover the same keys and valid placeholders',()=>{
  let messages;global.BooplandI18n={register:(scope,m)=>{assert.equal(scope,'yesterday');messages=m;}};
  require('./translations.js');delete global.BooplandI18n;
  assert.equal(Object.keys(messages).length,8);
  for(const [lang,dict] of Object.entries(messages)){assert.deepEqual(Object.keys(dict).sort(),Object.keys(messages.en).sort());for(const [key,value] of Object.entries(dict)){assert.equal(typeof value,'string');assert.ok(value.trim(),`${lang}.${key}`);assert.deepEqual([...value.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),[...messages.en[key].matchAll(/\{\w+\}/g)].map(x=>x[0]).sort());}}
});
test('lobby entry and local resources exist, with no build or network requirement',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const root=path.resolve(__dirname,'../..');
  const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),ctx);
  const entries=ctx.window.GAME_LIST.filter(e=>e.path==='./games/yesterday-me/index.html');assert.equal(entries.length,1);assert.equal(Object.keys(entries[0].locales).length,7);assert.ok(fs.existsSync(path.join(root,entries[0].cover)));
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);}assert.ok(!html.includes('type="module"'));
});
