const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('./engine.js');
function place(game,offset=0){E.spawn(game);game.active[game.active.axis]=game.active.origin+offset;return E.drop(game);}
test('alternating axes, one score per placement and input lock between blocks',()=>{
  const game=E.createGame();assert.equal(E.spawn(game).axis,'x');assert.equal(E.spawn(game),null);
  game.active.x=game.active.origin;assert.equal(E.drop(game).type,'perfect');assert.equal(game.score,1);
  assert.equal(E.drop(game),null);assert.equal(E.spawn(game).axis,'z');assert.equal(game.blocks[1].y,24);
});
test('positive and negative overhangs are cut exactly on both axes',()=>{
  for(const axis of ['x','z'])for(const offset of [-37,37]){
    const game=E.createGame();if(axis==='z')place(game);
    E.spawn(game);const old={...game.active},dim=axis==='x'?'w':'d';
    game.active[axis]=game.active.origin+offset;const result=E.drop(game);
    assert.equal(result.type,'cut');assert.equal(result.block[dim],123);assert.equal(result.cut[dim],37);
    assert.equal(result.block[axis],old.origin+Math.max(0,offset));
    assert.equal(result.cut[axis],offset<0?old.origin+offset:old.origin+160);
    assert.equal(result.block[dim]+result.cut[dim],160);
  }
});
test('a complete miss and exactly touching edges end the round without scoring',()=>{
  for(const offset of [-205,-160,160,205]){const game=E.createGame();assert.equal(place(game,offset).type,'miss');assert.equal(game.score,0);assert.equal(game.over,true);assert.equal(E.spawn(game),null);assert.equal(E.drop(game),null);}
});
test('perfect tolerance shrinks on a very narrow block',()=>{
  const game=E.createGame();place(game,157);place(game);E.spawn(game);game.active.x=game.active.origin+.7;
  assert.equal(E.drop(game).type,'cut');assert.ok(Math.abs(game.blocks.at(-1).w-2.3)<1e-9);
});
test('three consecutive perfect placements restore width, respect the cap and reset on cuts',()=>{
  const game=E.createGame();place(game,30);place(game,20);assert.equal(game.blocks.at(-1).w,130);
  place(game);place(game);const bonus=place(game);assert.equal(bonus.bonus,true);assert.equal(bonus.block.w,140);assert.equal(bonus.block.d,150);
  place(game,10);assert.equal(game.streak,0);assert.equal(game.bestStreak,3);
  for(let i=0;i<15;i++)place(game);assert.equal(game.blocks.at(-1).w,160);assert.equal(game.blocks.at(-1).d,160);
});
test('movement is independent of frame rate and never overshoots its track',()=>{
  const a=E.createGame(),b=E.createGame();E.spawn(a);E.spawn(b);
  for(let i=0;i<120;i++)E.advance(a,1/60);for(let i=0;i<60;i++)E.advance(b,1/30);
  assert.ok(Math.abs(a.active.x-b.active.x)<1e-8);
  for(const dt of [0,NaN,-1,5,10000]){E.advance(a,dt);assert.ok(Math.abs(a.active.x-a.active.origin)<=E.RANGE);}
});
test('a tall tower remains finite and increments once per layer',()=>{
  const game=E.createGame();for(let i=0;i<500;i++)place(game);
  assert.equal(game.score,500);assert.equal(game.blocks.length,501);assert.equal(game.blocks.at(-1).y,12000);
  for(const block of game.blocks)for(const key of ['x','z','w','d','y'])assert.ok(Number.isFinite(block[key]));
});
test('eight complete translations, placeholders, HTML bindings, local resources and one lobby card',()=>{
  let catalogue;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register(scope,messages){assert.equal(scope,'paperStack');catalogue=messages;}}});
  assert.equal(Object.keys(catalogue).length,8);const keys=Object.keys(catalogue.en).sort();
  for(const messages of Object.values(catalogue)){
    assert.deepEqual(Object.keys(messages).sort(),keys);
    for(const key of keys){assert.ok(messages[key].trim());assert.deepEqual(messages[key].match(/\{\w+\}/g)?.sort(),catalogue.en[key].match(/\{\w+\}/g)?.sort());}
  }
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-label)?="paperStack\.([^"]+)"/g))assert.ok(catalogue.en[match[1]],match[1]);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);
  const cards=context.window.GAME_LIST.filter(card=>card.path==='./games/paper-stack/index.html');assert.equal(cards.length,1);assert.equal(Object.keys(cards[0].locales).length,7);
  assert.ok(fs.existsSync(path.resolve(__dirname,'../..',cards[0].cover)));
});
