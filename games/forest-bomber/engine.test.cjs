const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('./engine.js');
function fresh(){const s=E.create({seed:123});E.start(s);return s;}
function open(s){for(let y=1;y<E.HEIGHT-1;y++)for(let x=1;x<E.WIDTH-1;x++)s.tiles[y][x]=E.FLOOR;s.hidden={};return s;}
function tick(s,seconds,input={noAI:true}){for(let i=0;i<Math.ceil(seconds*100);i++)E.step(s,.01,input);}
function put(s,x,y,time=.1,owner=0,range=2){s.bombs.push({id:s.nextId++,x,y,explodeAt:s.time+time,ownerId:owner,range});}
function relocate(a,x,y){Object.assign(a,{x,y,fromX:x,fromY:y,moveLeft:0});}

test('all five groves have solid borders, safe starts and an escape from a starting bomb',()=>{
  for(let stage=1;stage<=5;stage++)for(let seed=0;seed<50;seed++){
    const s=E.create({stage,seed});assert.equal(s.tiles.length,11);assert.ok(s.tiles.every(r=>r.length===13));
    for(let x=0;x<13;x++){assert.equal(s.tiles[0][x],1);assert.equal(s.tiles[10][x],1);}
    for(let y=0;y<11;y++){assert.equal(s.tiles[y][0],1);assert.equal(s.tiles[y][12],1);}
    for(const a of s.actors){assert.equal(s.tiles[a.y][a.x],0);const bomb={id:-1,x:a.x,y:a.y,range:2,explodeAt:2.4};assert.ok(E.escapePath(s,a,E.hazards(s,bomb),bomb));}
  }
});
test('same seed recreates the map and drops; different seeds vary it',()=>{
  assert.deepEqual(E.create({seed:42}).tiles,E.create({seed:42}).tiles);
  assert.deepEqual(E.create({seed:42}).hidden,E.create({seed:42}).hidden);
  assert.notDeepEqual(E.create({seed:42}).tiles,E.create({seed:43}).tiles);
});
test('one tap walks exactly one tile with smooth interpolation',()=>{
  const s=fresh(),p=s.actors[0];assert.equal(E.move(s,p,1),true);assert.deepEqual(E.position(p),{x:1,y:1});
  tick(s,.07);assert.ok(E.position(p).x>1&&E.position(p).x<2);tick(s,.3);assert.deepEqual(E.position(p),{x:2,y:1});
});
test('walls, crates and planted bombs block movement, but a planter can leave its tile',()=>{
  const s=fresh(),p=s.actors[0];assert.equal(E.move(s,p,0),false);assert.ok(E.placeBomb(s));assert.ok(E.move(s,p,1));tick(s,.3);
  assert.equal(E.move(s,p,3),false);assert.equal(E.move(s,p,2),false);relocate(p,3,1);assert.equal(E.move(s,p,1),false);
});
test('bomb capacity, duplicate placement and moving placement are enforced',()=>{
  const s=fresh(),p=s.actors[0];assert.equal(E.placeBomb(s),true);assert.equal(E.placeBomb(s),false);E.move(s,p,1);assert.equal(E.placeBomb(s),false);tick(s,.3);assert.equal(E.placeBomb(s),false);p.capacity=2;assert.equal(E.placeBomb(s),true);
});
test('queued bomb input is consumed once at the next tile, before continuing to move',()=>{
  const s=fresh();E.move(s,s.actors[0],1);const input={direction:1,bomb:true,noAI:true};tick(s,.5,input);assert.equal(s.bombs.length,1);assert.equal(s.bombs[0].x,2);assert.equal(input.bombConsumed,true);
});
test('bomb fuse is 2.4 seconds and capacity is freed on explosion',()=>{
  const s=fresh();E.placeBomb(s);tick(s,2.3);assert.equal(s.bombs.length,1);tick(s,.15);assert.equal(s.bombs.length,0);assert.ok(s.flames.length);
});
test('blast stops at stone and at its first crate, leaving the crate behind it intact',()=>{
  const s=open(fresh());s.tiles[3][4]=1;s.tiles[3][2]=2;s.tiles[3][1]=2;put(s,3,3,.1,0,5);tick(s,.12);
  assert.equal(s.tiles[3][2],0);assert.equal(s.tiles[3][1],2);assert.equal(s.tiles[3][4],1);assert.ok(!s.flames.some(f=>f.x===5&&f.y===3));assert.equal(s.score,15);
});
test('chains ignite immediately and propagate through several bombs',()=>{
  const s=open(fresh());put(s,3,3,.1,0,3);put(s,5,3,2,1,3);put(s,5,5,2.3,2,2);tick(s,.12);
  assert.equal(s.bombs.length,0);assert.equal(s.maxChain,3);assert.ok(s.flames.some(f=>f.x===5&&f.y===7));assert.equal(s.score,100);assert.equal(E.drainEvents(s).filter(e=>e.type==='explode').length,3);
});
test('simultaneous chains cannot see through a crate destroyed in the same batch',()=>{
  const s=open(fresh());s.tiles[3][4]=2;put(s,3,3,.1,0,4);put(s,4,2,.1,0,4);tick(s,.12);assert.equal(s.tiles[3][4],0);assert.ok(!s.flames.some(f=>f.x===5&&f.y===3));
});
test('unrelated simultaneous bombs and opponent-only chains do not award a player chain bonus',()=>{
  const s=open(fresh());put(s,3,3,.1,0,1);put(s,9,7,.1,1,1);tick(s,.12);assert.equal(s.maxChain,1);assert.equal(s.score,0);assert.ok(!E.drainEvents(s).some(e=>e.type==='chain'));
  const g=open(fresh());put(g,3,3,.1,1,3);put(g,5,3,2,2,2);tick(g,.12);assert.equal(g.maxChain,2);assert.equal(g.score,0);
});
test('hazard forecast accounts for early chain ignition',()=>{
  const s=open(fresh());put(s,3,3,.5,0,3);put(s,5,3,2.4,1,3);const hazard=E.hazards(s);assert.equal(Math.min(...hazard.get(E.key(7,3)).map(h=>h[0])),.5);
});
test('drops appear after the flame, and a later explosion destroys an exposed item',()=>{
  const s=open(fresh());s.tiles[3][4]=2;s.hidden[E.key(4,3)]='range';put(s,3,3,.1);tick(s,.12);
  assert.equal(s.items.length,1);assert.ok(s.items[0].readyAt>s.time);tick(s,.7);assert.ok(s.items[0].readyAt<s.time);put(s,4,3,.1);tick(s,.12);assert.equal(s.items.length,0);
});
test('all four pickups apply to players and respect upgrade caps',()=>{
  const s=fresh(),p=s.actors[0];for(const type of ['capacity','range','speed','shield']){s.items=[{x:1,y:1,type,readyAt:0}];tick(s,.01);}
  assert.equal(p.capacity,2);assert.equal(p.range,3);assert.equal(p.speed,6.15);assert.equal(p.shield,true);assert.equal(s.score,160);
  for(let n=0;n<12;n++)for(const type of ['capacity','range','speed']){s.items=[{x:1,y:1,type,readyAt:0}];tick(s,.01);}
  assert.equal(p.capacity,5);assert.equal(p.range,6);assert.equal(p.speed,8);
});
test('opponents also collect supplies without awarding player pickup points',()=>{
  const s=fresh(),a=s.actors[1];s.items=[{x:a.x,y:a.y,type:'capacity',readyAt:0}];tick(s,.01);assert.equal(a.capacity,2);assert.equal(s.score,0);
});
test('a shield absorbs one hit; invincibility prevents repeated damage from lingering flames',()=>{
  const s=fresh(),p=s.actors[0];p.shield=true;put(s,1,1,.1);tick(s,.15);assert.equal(p.hp,3);assert.equal(p.shield,false);tick(s,.8);assert.equal(p.hp,3);
  tick(s,1);put(s,1,1,.1);tick(s,.8);assert.equal(p.hp,2);
});
test('player damage, enemy elimination and defeat use actual interpolated positions',()=>{
  const s=open(fresh()),p=s.actors[0];p.hp=1;put(s,1,1,.1);tick(s,.12);assert.equal(s.mode,'lost');assert.equal(p.alive,false);
  const g=open(fresh());put(g,11,1,.1);tick(g,.12);assert.equal(g.actors[1].alive,false);assert.equal(g.score,250);
});
test('loss takes priority if the player and last opponent are hit together',()=>{
  const s=open(fresh());s.actors[0].hp=1;s.actors[2].alive=false;s.actors[3].alive=false;relocate(s.actors[1],2,1);put(s,1,1,.1);tick(s,.12);assert.equal(s.mode,'lost');
});
test('pause freezes bombs, movement and round timer; resume has no time jump',()=>{
  const s=fresh();E.placeBomb(s);E.move(s,s.actors[0],1);tick(s,.05);E.pause(s);const before=JSON.stringify({...s,rng:undefined});tick(s,5);assert.equal(JSON.stringify({...s,rng:undefined}),before);E.start(s);tick(s,.01);assert.ok(s.time<.07);
});
test('time expiry, victory, progression and final completion are distinct',()=>{
  const s=fresh();s.remaining=.01;tick(s,.02);assert.equal(s.mode,'lost');
  const g=fresh();g.actors[0].hp=1;g.actors[0].capacity=3;g.actors[0].range=4;g.actors.slice(1).forEach(a=>a.alive=false);tick(g,.01);assert.equal(g.mode,'won');assert.ok(g.score>=500);
  const next=E.next(g);assert.equal(next.stage,2);assert.equal(next.mode,'ready');assert.equal(next.actors[0].hp,2);assert.equal(next.actors[0].capacity,3);assert.equal(next.actors[0].range,4);assert.equal(next.score,g.score);assert.equal(next.remaining,150);
  const final=E.create({stage:5,seed:1});E.start(final);final.actors.slice(1).forEach(a=>a.alive=false);tick(final,.01);assert.equal(final.mode,'complete');assert.equal(E.next(final),null);
});
test('a fresh restart clears bombs, upgrades, score and progression',()=>{
  const s=E.create({seed:1});assert.equal(s.mode,'ready');assert.equal(s.stage,1);assert.equal(s.score,0);assert.equal(s.bombs.length,0);assert.equal(s.actors[0].hp,3);assert.equal(s.actors[0].capacity,1);
});
test('AI will not plant in a trapped dead end',()=>{
  const s=fresh(),a=s.actors[1];for(const other of s.actors.slice(2))other.alive=false;a.plantAt=0;for(const d of E.DIRS){const x=a.x+d.x,y=a.y+d.y;if(s.tiles[y]?.[x]===0)s.tiles[y][x]=2;}
  tick(s,1,{noAI:false});assert.equal(s.bombs.filter(b=>b.ownerId===1).length,0);
});
test('AI opens crates and survives its first planned retreats across seeded maps',()=>{
  for(let seed=1;seed<=12;seed++){const s=E.create({seed});E.start(s);s.actors[0].invincibleUntil=100;tick(s,8,{noAI:false});assert.ok(s.boxes>0);assert.ok(s.actors.slice(1).filter(a=>a.alive).length>=2);}
});
test('all eight dictionaries cover every key and all static bindings',()=>{
  let messages;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{window:{BooplandI18n:{register:(scope,m)=>{assert.equal(scope,'forest');messages=m;}}}});
  const langs=['zh-CN','en','ja','ko','fr','de','es','pt-BR'];assert.deepEqual(Object.keys(messages).sort(),langs.sort());const keys=Object.keys(messages.en).sort();
  for(const lang of langs){assert.deepEqual(Object.keys(messages[lang]).sort(),keys);for(const key of keys)assert.ok(messages[lang][key].length,`${lang}.${key}`);}
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const match of html.matchAll(/data-i18n(?:-label|-content)?="forest\.([^"]+)"/g))assert.ok(messages.en[match[1]],match[1]);
});
test('entry has valid local resources, shared i18n, analytics and a unique translated lobby card',()=>{
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="(\.[^"]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
  assert.equal((html.match(/src="\.\.\/\.\.\/analytics.js"/g)||[]).length,1);assert.ok(html.indexOf('../../i18n.js')<html.indexOf('./game.js'));
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);const cards=context.window.GAME_LIST.filter(g=>g.path==='./games/forest-bomber/index.html');assert.equal(cards.length,1);assert.equal(Object.keys(cards[0].locales).length,7);assert.ok(fs.existsSync(path.resolve(__dirname,'../../',cards[0].cover)));
});
