'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('./engine.js');
const root=path.resolve(__dirname,'../..');
for(const [index,level] of E.levels.entries()) {
  assert.equal(level.pieces.reduce((sum,p)=>sum+p.cells.length,0),level.width*level.height);
  const home=Object.fromEntries(level.pieces.map(p=>[p.id,p.home]));
  assert(E.complete(level,home),'Canonical solution: '+index);
  for(const piece of level.pieces) {
    assert.deepEqual(E.rotate(piece.cells,4),piece.cells);
    const reachable=new Set([piece.cells[0].join(',')]);let previous=0;
    while(previous!==reachable.size){previous=reachable.size;for(const [x,y] of piece.cells)if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(p=>reachable.has(p.join(','))))reachable.add([x,y].join(','));}
    assert.equal(reachable.size,piece.cells.length,'Disconnected object');
  }
  const started=Date.now(),solution=E.solve(level,{},2500);
  assert(solution?.length===level.pieces.length,'Solver: '+index);
  const game=new E.Game(level);
  for(const p of solution)assert(game.place(p.id,{x:p.x,y:p.y,rotation:p.rotation}));
  assert(E.complete(level,game.placements));
  assert(game.undo());assert(!E.complete(level,game.placements));
  assert(E.solve(level,game.placements,2500)?.length===1);
  const before=JSON.stringify(game.placements),first=level.pieces[0];
  assert(!game.place(first.id,{x:-1,y:0,rotation:0}));assert.equal(JSON.stringify(game.placements),before);
  assert(!game.place(first.id,{x:level.width,y:0,rotation:0}));
  assert(game.reset());assert.equal(Object.keys(game.placements).length,0);assert(game.undo());assert.equal(JSON.stringify(game.placements),before);
  assert(!E.validate(level,{A:{x:0,y:0,rotation:0},bad:{x:0,y:0,rotation:0}}));
  assert(!E.validate(level,{A:{x:0,y:0,rotation:'0'}}));
  assert(!E.validate(level,{A:{x:0,y:0,rotation:0},B:{x:0,y:0,rotation:0}}));
  console.log(`Level ${index+1}: ${level.width}x${level.height}, ${level.pieces.length} connected pieces; exact cover + history passed (${Date.now()-started} ms)`);
}
let dictionaries;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(_scope,value)=>{dictionaries=value;}}});
assert.equal(Object.keys(dictionaries).length,8);
const keys=Object.keys(dictionaries.en).sort();
for(const [lang,dict] of Object.entries(dictionaries)) {
  assert.deepEqual(Object.keys(dict).sort(),keys,lang+' key coverage');
  for(const key of keys){assert.equal(typeof dict[key],'string');assert(dict[key].length);assert.deepEqual((dict[key].match(/\{\w+\}/g)||[]).sort(),(dictionaries.en[key].match(/\{\w+\}/g)||[]).sort(),lang+': '+key);}
}
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert(fs.existsSync(path.resolve(__dirname,match[1])),'Missing '+match[1]);
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),context);
const matches=context.window.GAME_LIST.filter(g=>g.path==='./games/suitcase-story/index.html');assert.equal(matches.length,1);assert.equal(Object.keys(matches[0].locales).length,7);
assert(fs.existsSync(path.resolve(root,matches[0].cover)));
console.log('Eight complete dictionaries, local resources, lobby registration: passed.');
