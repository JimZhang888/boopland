const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, LEVELS, makePath, SPACING, segmentCircle } = require('./engine.js');
function seeded(seed = 42) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
function advance(game, seconds) { for (let i = 0; i < Math.ceil(seconds * 120); i++) game.update(1 / 120); }
function fixture(colors, head = 900, level = 0) {
  const game = new Game(seeded()); game.prepare(level, 0); game.start();
  game.chain = colors.map((color, i) => ({ id: i + 1000, color, s: head - i * SPACING }));
  return game;
}
function insertAt(game, index, color, before = true) {
  const p = game.path.at(game.chain[index].s), sign = before ? 1 : -1;
  game.insert(index, color, p.x + p.tx * 30 * sign, p.y + p.ty * 30 * sign);
}
test('all six gardens have bounded continuous paths and a finite incoming chain', () => {
  for (let level = 0; level < LEVELS.length; level++) {
    const game = new Game(seeded(level)); game.prepare(level);
    assert.equal(game.chain.length, LEVELS[level].count);
    assert.ok(game.chain.some(b => b.s < 0));
    assert.ok(game.path.length > 2500);
    for (const p of game.path.samples) {
      assert.ok(p.x >= 25 && p.x <= 795 && p.y >= 25 && p.y <= 695);
      assert.ok(Number.isFinite(game.path.at(p.s).tx));
    }
    const first = game.path.at(0), mirror = makePath((level + 1) % 3).at(0);
    assert.ok(first.x !== mirror.x || first.y !== mirror.y);
  }
});
test('insertion on either side joins three; a different color splits a run', () => {
  for (const before of [false, true]) {
    const game = fixture([1, 0, 0, 2]);
    insertAt(game, before ? 1 : 2, 0, before);
    assert.deepEqual(game.chain.map(b => b.color), [1, 2]);
    assert.equal(game.score, 30);
  }
  const game = fixture([0, 0]); insertAt(game, 0, 2, false);
  assert.deepEqual(game.chain.map(b => b.color), [0, 2, 0]);
  assert.equal(game.score, 0);
  for (let i = 1; i < game.chain.length; i++) assert.ok(game.chain[i - 1].s - game.chain[i].s >= SPACING - 0.001);
});
test('gap closes visibly and a newly connected match earns a ×2 chain', () => {
  const game = fixture([0, 0, 1, 1, 1, 0]);
  assert.ok(game.match(3, 1));
  assert.equal(game.chain.length, 3);
  assert.ok(game.chain[1].s - game.chain[2].s > SPACING);
  advance(game, 1);
  assert.equal(game.phase, 'cleared');
  assert.equal(game.chain.length, 0);
  assert.equal(game.maxCombo, 2);
  assert.equal(game.score, 30 + 60 + 100);
});
test('unrelated colors never disappear when a gap closes', () => {
  const game = fixture([0, 0, 1, 1, 1, 2, 2]);
  game.match(3, 1); advance(game, 1.5);
  assert.deepEqual(game.chain.map(b => b.color), [0, 0, 2, 2]);
  assert.equal(game.score, 30);
  assert.equal(game.phase, 'playing');
});
test('separated same colors cannot match across an open gap', () => {
  const game = fixture([0, 0, 0]);game.chain[2].s -= 100;
  assert.equal(game.match(0, 1), false);
  assert.equal(game.chain.length, 3);
});
test('real fired projectiles collide and produce the expected elimination', () => {
  const game = fixture([0, 0], 236);
  game.path = { length:1000, at:s=>({x:s,y:100,tx:1,ty:0}) };
  game.origin = {x:200,y:300};game.current=0;
  assert.ok(game.fire(-Math.PI/2));assert.equal(game.fire(-Math.PI/2),false);
  advance(game,.5);
  assert.equal(game.phase,'cleared');assert.equal(game.score,130);
  assert.equal(game.shots.length,0);
  assert.ok(segmentCircle(0,0,1000,0,500,0,20) < .5);
});
test('pausing freezes shots, chain, cooldown and skill timers', () => {
  const game = new Game(seeded());game.start();game.charge=12;game.slow();game.fire(0);game.pause();
  const before=JSON.stringify([game.chain,game.shots,game.cooldown,game.slowTime,game.elapsed]);
  advance(game,10);
  assert.equal(JSON.stringify([game.chain,game.shots,game.cooldown,game.slowTime,game.elapsed]),before);
  assert.equal(game.fire(0),false);assert.equal(game.swap(),false);
  game.resume();advance(game,.1);assert.ok(game.elapsed>0);
});
test('slow requires a full charge, lasts seven seconds and cannot stack', () => {
  const game = new Game(seeded());game.start();assert.equal(game.slow(),false);
  game.charge=12;const start=game.chain[0].s;assert.ok(game.slow());
  assert.equal(game.charge,0);advance(game,1);
  assert.ok(Math.abs(game.chain[0].s-start-game.config.speed*.3)<.1);
  game.charge=12;assert.equal(game.slow(),false);advance(game,6.1);assert.equal(game.slowTime,0);
  assert.ok(game.slow());
});
test('ammo uses remaining colors; swapping does not consume a marble', () => {
  const game = fixture([2, 2, 2]);game.current=0;game.next=1;game.refreshAmmo();
  assert.equal(game.current,2);assert.equal(game.next,2);
  const length=game.chain.length;game.current=1;game.next=3;game.swap();
  assert.equal(game.current,3);assert.equal(game.next,1);assert.equal(game.chain.length,length);
});
test('hidden incoming marbles prevent a premature win and continue entering', () => {
  const game = fixture([0,0,0,2,2],90);
  game.match(1,1);assert.equal(game.phase,'playing');assert.equal(game.chain.length,2);
  assert.ok(game.chain[0].s<0);advance(game,.5);assert.ok(game.chain[0].s>=0);
});
test('failure and retry preserve earlier points; only a clear advances', () => {
  const game = new Game(seeded());game.prepare(2,450);game.start();game.score=520;
  const shift=game.path.length-.05-game.chain[0].s;for(const ball of game.chain)ball.s+=shift;
  advance(game,.1);assert.equal(game.phase,'lost');
  assert.equal(game.advance(),false);game.retry();assert.equal(game.level,2);assert.equal(game.score,450);
  assert.equal(game.phase,'playing');assert.equal(game.chain.length,LEVELS[2].count);
  game.chain=[0,1,2].map((_,i)=>({id:i,color:0,s:300-i*SPACING}));game.match(1,1);
  assert.equal(game.phase,'cleared');const score=game.score;assert.ok(game.advance());
  assert.equal(game.level,3);assert.equal(game.entryScore,score);assert.equal(game.score,score);
});
test('last garden ends in a win and does not create an undefined level', () => {
  const game = fixture([0,0,0],300,5);game.match(1,1);
  assert.equal(game.phase,'won');assert.equal(game.score,630);assert.equal(game.advance(),false);
});
test('sustained shots across every garden keep ordered finite chains and bounded projectiles', () => {
  for(let level=0;level<6;level++){
    const random=seeded(800+level),game=new Game(random);game.prepare(level);game.start();
    for(let frame=0;frame<120*100&&game.phase==='playing';frame++){
      if(frame%33===0){const visible=game.chain.filter(b=>b.s>=0);if(visible.length){const p=game.path.at(visible[Math.floor(random()*visible.length)].s);game.fire(Math.atan2(p.y-game.origin.y,p.x-game.origin.x));}}
      if(game.charge>=12)game.slow();game.update(1/120);game.drainEvents();
      for(let i=0;i<game.chain.length;i++){assert.ok(Number.isFinite(game.chain[i].s));if(i)assert.ok(game.chain[i-1].s-game.chain[i].s>=SPACING-.001);}
      assert.ok(game.shots.length<8);
    }
    assert.ok(['playing','cleared','lost','won'].includes(game.phase));
  }
});
