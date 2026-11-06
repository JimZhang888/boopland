const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Game, MAPS, SIZE } = require('./engine.js');
function fresh() { const g = new Game(() => .4); g.start(); g.spawnTimer = 1000; return g; }
function empty(g) { g.grid.forEach(row => row.fill(0)); g.enemies = []; g.bullets = []; }
function step(g, seconds, input = {}) { for (let n = 0; n < Math.ceil(seconds * 120); n++) g.update(1 / 120,input); }
function bullet(x,y,dir,player = true,power = 1) { return {x,y,dir,player,power,owner:999,speed:340,dead:false}; }

test('all five maps have open spawn points, a protected base and a movable player', () => {
  assert.equal(MAPS.length,5);
  for (let stage = 1; stage <= 10; stage++) {
    const g = fresh(); g.stage = stage; g.loadStage();
    assert.equal(g.grid.length,26); assert.ok(g.grid.every(row => row.length === 26));
    for (const x of [24,312,600]) assert.equal(g.blocked(x,24,null),false);
    assert.equal(g.blocked(g.player.x,g.player.y,g.player),false);
    assert.equal(g.move(g.player,0,4),true);
    assert.ok(g.grid[23][12]); assert.ok(g.grid[25][10]); assert.ok(g.grid[25][14]);
    assert.equal(g.grid[25][12],0);
  }
});
test('walls, steel, water, the base, other tanks and outer bounds block movement', () => {
  const g = fresh(); empty(g); g.player.x = 100; g.player.y = 100;
  for (const material of [1,2,3]) { g.grid[4][5] = material; assert.equal(g.move(g.player,1,8),false); g.grid[4][5] = 0; }
  g.player.x = 17; assert.equal(g.move(g.player,3,1),false);
  g.player.x = SIZE - 17; assert.equal(g.move(g.player,1,1),false);
  g.player.x = 312; g.player.y = 560; assert.equal(g.move(g.player,2,8),false);
  g.player.x = 100; g.player.y = 100; g.enemies.push(g.makeTank(140,100,0,false)); assert.equal(g.move(g.player,1,8),false);
});
test('turn assistance aligns near a lane and never snaps through an obstacle', () => {
  const g = fresh(); empty(g); g.player.x = 123; g.player.y = 120; g.player.dir = 1;
  assert.equal(g.move(g.player,0,2),true); assert.equal(g.player.x,120);
  g.player.x = 140; g.player.y = 120; g.player.dir = 1; g.move(g.player,0,2); assert.equal(g.player.x,140);
});
test('fire cooldown and per-tank projectile limits respond to upgrades', () => {
  const g = fresh(); empty(g);
  assert.equal(g.fire(g.player),true); assert.equal(g.fire(g.player),false);
  g.player.cooldown = 0; assert.equal(g.fire(g.player),false);
  g.level = 2; assert.equal(g.fire(g.player),true); assert.equal(g.bullets.length,2);
  assert.equal(g.bullets[1].speed,430); g.player.cooldown = 0; assert.equal(g.fire(g.player),false);
});
test('shells break only the impacted row of bricks, leaving a usable two-cell breach', () => {
  const g = fresh(); empty(g);
  g.grid[3][4] = g.grid[3][5] = g.grid[4][4] = g.grid[4][5] = 1;
  const b = bullet(120,65,2); g.bullets = [b]; g.stepBullet(b,.05);
  assert.equal(b.dead,true); assert.equal(g.grid[3][4],0); assert.equal(g.grid[3][5],0);
  assert.equal(g.grid[4][4],1); assert.equal(g.grid[4][5],1);
});
test('steel blocks normal shells; level-three shells destroy steel; water passes shells', () => {
  const g = fresh(); empty(g); g.grid[3][4] = 2;
  let b = bullet(108,65,2); g.stepBullet(b,.05); assert.equal(b.dead,true); assert.equal(g.grid[3][4],2);
  b = bullet(108,65,2,true,2); g.stepBullet(b,.05); assert.equal(g.grid[3][4],0);
  g.grid[3][4] = 3; b = bullet(108,65,2); g.stepBullet(b,.05); assert.equal(b.dead,false); assert.equal(g.grid[3][4],3);
});
test('opposing shells cancel and cannot subsequently hit a tank', () => {
  const g = fresh(); empty(g); const a = bullet(100,100,1), b = bullet(112,100,3,false); g.bullets = [a,b];
  g.stepBullet(a,.05); assert.equal(a.dead,true); assert.equal(b.dead,true);
});
test('max-power shells open a tank-wide gap through steel at a lane boundary', () => {
  const g = fresh(); empty(g); g.grid[3][4] = g.grid[3][5] = 2;
  g.stepBullet(bullet(120,65,2,true,2),.05);
  assert.equal(g.grid[3][4],0); assert.equal(g.grid[3][5],0);
  g.player.x = 120; g.player.y = 70; assert.equal(g.move(g.player,2,10),true);
});
test('heavy tanks require three hits and score once on destruction', () => {
  const g = fresh(); empty(g); const enemy = g.makeTank(100,100,0,false,2); enemy.born = 0; g.enemies.push(enemy);
  for (let i = 0; i < 3; i++) { const b = bullet(100,130,0); g.stepBullet(b,.05); assert.equal(b.dead,true); }
  assert.equal(g.enemies.length,0); assert.equal(g.kills,1); assert.equal(g.score,300);
  g.destroyEnemy(enemy); assert.equal(g.score,300);
});
test('spawn shields protect; life loss resets upgrades and safely respawns', () => {
  const g = fresh(); empty(g); g.level = 3;
  g.hitPlayer(); assert.equal(g.lives,3);
  g.player.shield = 0; g.hitPlayer(); assert.equal(g.lives,2); assert.equal(g.level,0); assert.equal(g.player,null);
  step(g,1.2); assert.ok(g.player); assert.ok(g.player.shield > 2.8);
  for (let i = 0; i < 2; i++) { g.player.shield = 0; g.hitPlayer(); if (i === 0) step(g,1.2); }
  assert.equal(g.status,'over'); assert.equal(g.reason,'lives'); assert.equal(g.lives,0);
});
test('respawn waits when every entrance is occupied', () => {
  const g = fresh(); empty(g); g.player = null; g.respawnTimer = 0;
  for (const x of [216,408,120,504,24,600]) { const tank = g.makeTank(x,600,0,false); tank.born = 20; g.enemies.push(tank); }
  step(g,.1); assert.equal(g.player,null);
  g.enemies.shift(); step(g,.1); assert.equal(g.player.x,216);
});
test('enemy shells destroy home while friendly shells leave it safe', () => {
  const g = fresh(); empty(g);
  g.stepBullet(bullet(312,570,2,true),.05); assert.equal(g.base.alive,true);
  g.stepBullet(bullet(312,570,2,false),.05); assert.equal(g.base.alive,false); assert.equal(g.status,'over'); assert.equal(g.reason,'base');
});
test('all supplies apply and timed protection expires in game time', () => {
  const g = fresh(); empty(g);
  for (let i = 0; i < 4; i++) g.power('star'); assert.equal(g.level,3);
  g.power('life'); assert.equal(g.lives,4); g.power('shield'); assert.equal(g.player.shield,12);
  g.power('freeze'); assert.equal(g.freeze,9); g.power('fortify'); assert.equal(g.grid[23][12],2);
  const enemy = g.makeTank(24,24,2,false); enemy.born = 0; g.enemies.push(enemy); step(g,1); assert.equal(enemy.y,24);
  g.bullets.push(bullet(24,80,2,false)); g.power('bomb'); assert.equal(g.enemies.length,0); assert.equal(g.bullets.length,0); assert.equal(g.kills,1);
  step(g,16); assert.equal(g.freeze,0); assert.equal(g.grid[23][12],1); assert.equal(g.player.shield,0);
});
test('carriers drop collectable supplies and pickups expire', () => {
  const g = fresh(); empty(g); const enemy = g.makeTank(100,100,0,false); enemy.carrier = true; g.enemies.push(enemy); g.destroyEnemy(enemy);
  assert.equal(g.pickups.length,1); g.player.x = 100; g.player.y = 100; step(g,.02); assert.equal(g.pickups.length,0); assert.equal(g.score,600);
  g.dropPower(500,500); step(g,14.1); assert.equal(g.pickups.length,0);
});
test('pause freezes simulation and long frame deltas are bounded', () => {
  const g = fresh(); g.pause(); const before = JSON.stringify(g); g.update(200,{dir:0,fire:true}); assert.equal(JSON.stringify(g),before);
  g.resume(); const y = g.player.y; g.update(200,{dir:0}); assert.ok(y - g.player.y <= 6.61); assert.equal(g.status,'playing');
});
test('enemy waves enforce active cap, total cap and blocked-spawn checks', () => {
  const g = fresh(); empty(g);
  for (let i = 0; i < 10; i++) { g.spawnEnemy(); for (const e of g.enemies) e.y = 120 + e.id * 40; }
  assert.equal(g.enemies.length,4); assert.equal(g.spawned,4);
  g.spawned = 20; g.enemies = []; assert.equal(g.spawnEnemy(),false);
  g.spawned = 0; for (const x of [1,13,25]) g.grid[1][x] = 2; assert.equal(g.spawnEnemy(),false);
});
test('clearing a stage awards a single bonus and retains campaign progress', () => {
  const g = fresh(); g.spawned = 20; g.kills = 20; g.totalKills = 20; g.score = 4000; g.level = 2; g.lives = 4;
  step(g,1); assert.equal(g.status,'clear'); assert.equal(g.score,5000);
  step(g,5); assert.equal(g.score,5000); g.nextStage(); assert.equal(g.stage,2); assert.equal(g.status,'playing'); assert.equal(g.score,5000); assert.equal(g.level,2); assert.equal(g.lives,4); assert.equal(g.kills,0);
  g.start(); assert.equal(g.stage,1); assert.equal(g.lives,3); assert.equal(g.score,0); assert.equal(g.level,0);
});
test('base loss takes precedence over clearing the wave in the same frame', () => {
  const g = fresh(); empty(g); g.spawned = 20; g.clearTimer = .69; g.bullets.push(bullet(312,575,2,false));
  step(g,.1); assert.equal(g.status,'over'); assert.equal(g.reason,'base'); assert.equal(g.score,0);
});
test('eight complete dictionaries translate every static binding and preserve placeholders', () => {
  let dictionaries; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'locales.js'),'utf8'),{ BooplandI18n: { register(scope,data) { assert.equal(scope,'steel'); dictionaries = data; } } });
  assert.equal(Object.keys(dictionaries).length,8); const base = dictionaries.en;
  for (const [language,messages] of Object.entries(dictionaries)) for (const [key,value] of Object.entries(base)) {
    assert.equal(typeof messages[key],'string',`${language}.${key}`); assert.ok(messages[key].length);
    assert.deepEqual((messages[key].match(/\{\w+\}/g)||[]).sort(),(value.match(/\{\w+\}/g)||[]).sort());
  }
  const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for (const match of html.matchAll(/data-i18n(?:-[\w-]+)?="steel\.([^"]+)"/g)) assert.ok(base[match[1]],match[1]);
});
test('lobby has one localized record and every local script and style is present', () => {
  const root = path.join(__dirname,'../..'), context = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),context);
  const records = context.window.GAME_LIST.filter(item => item.path === './games/steel-tide/index.html');
  assert.equal(records.length,1); assert.equal(Object.keys(records[0].locales).length,7);
  assert.ok(fs.existsSync(path.join(root,records[0].cover)));
  const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for (const [,relative] of html.matchAll(/(?:src|href)="(\.[^"]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname,relative)),relative);
  assert.equal((html.match(/\.\.\/\.\.\/analytics\.js/g)||[]).length,1);
});
