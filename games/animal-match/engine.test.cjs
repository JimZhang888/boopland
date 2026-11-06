const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
function rng(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }

test('300 generated boards have no initial matches and at least one legal move', () => {
  for (let seed = 0; seed < 300; seed++) {
    const board = E.create(rng(seed));
    assert.equal(board.length, 64); assert(board.every(v => v >= 0 && v < 6));
    assert.equal(E.matches(board).length, 0); assert(E.moves(board).length > 0);
  }
});
test('generation terminates even with constant random input', () => {
  for (const value of [0, .5, .999]) { const board = E.create(() => value); assert.equal(E.matches(board).length, 0); assert(E.moves(board).length); }
});
test('matches include long lines and deduplicate an intersection', () => {
  const board = Array(64).fill(null);
  [24, 25, 26, 27, 28, 10, 18, 34, 42].forEach(i => { board[i] = { type: 3 }; });
  assert.deepEqual(E.matches(board).sort((a,b) => a-b), [10,18,24,25,26,27,28,34,42]);
});
test('swaps respect row edges, adjacency, empty cells and matching', () => {
  const board = E.create(rng(42)), before = board.slice(), [a,b] = E.moves(board)[0];
  assert(E.validSwap(board,a,b)); assert(E.matches(E.swapped(board,a,b)).length >= 3);
  assert.deepEqual(board,before); assert(!E.adjacent(7,8)); assert(!E.adjacent(-1,0));
  assert(!E.validSwap(board,0,63)); assert(!E.validSwap(Array(64).fill(null),0,1));
  board[0]=board[1]; assert(!E.validSwap(board,0,1));
});
test('gravity keeps surviving tile identities and order, and refills every hole', () => {
  const board=Array.from({length:64},(_,id)=>({id,type:id%6}));
  const first=board[0], middle=board[32], last=board[56]; [8,16,24,40,48].forEach(i=>board[i]=null);
  let id=100; const {board:next,entering}=E.collapse(board,()=>({id:id++,type:0}));
  assert.equal(next[40],first);assert.equal(next[48],middle);assert.equal(next[56],last);
  assert.equal(entering.length,5);assert(entering.every(x=>x.fromRow<0));assert(next.every(Boolean));
  assert.equal(new Set(next.map(x=>x.id)).size,64);
});
test('shuffle preserves tiles while returning a stable and playable board', () => {
  for(let seed=1;seed<=50;seed++) {
    const board=E.create(rng(seed)).map((type,id)=>({type,id}));
    const shuffled=E.shuffle(board,rng(seed+800));assert(shuffled);
    assert.deepEqual(shuffled.map(t=>t.id).sort((a,b)=>a-b),board.map(t=>t.id));
    assert.equal(E.matches(shuffled).length,0);assert(E.moves(shuffled).length);
  }
  assert.equal(E.shuffle(Array(64).fill(0),rng(1)),null);
});
test('scoring caps chain multipliers and star thresholds are exact', () => {
  assert.equal(E.points(3,1),180);assert.equal(E.points(6,2),720);assert.equal(E.points(3,99),900);
  assert.equal(E.stars(3599,3600),0);assert.equal(E.stars(3600,3600),1);
  assert.equal(E.stars(5040,3600),2);assert.equal(E.stars(6480,3600),3);assert.equal(E.target(2),4200);
});
test('100 full simulated rounds resolve cascades and stay playable', () => {
  for(let seed=1;seed<=100;seed++) {
    const random=rng(seed);let board=E.create(random);
    for(let turn=0;turn<26;turn++) {
      const options=E.moves(board);assert(options.length);
      const [a,b]=options[Math.floor(random()*options.length)];board=E.swapped(board,a,b);
      let found,chain=0;
      while((found=E.matches(board)).length) {
        assert(++chain<100);found.forEach(i=>board[i]=null);
        board=E.collapse(board,()=>Math.floor(random()*6)).board;
      }
      if(!E.moves(board).length) board=E.shuffle(board,random)||E.create(random);
      assert.equal(board.length,64);assert(board.every(v=>v>=0&&v<6));
    }
  }
});
