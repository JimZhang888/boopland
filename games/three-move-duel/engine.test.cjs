'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const board = (player,rival,extra={}) => ({ ...E.initial(),player,rival,...extra });

test('five spaces × both moves: positions stay ordered, results are symmetric, input is immutable',()=>{
  for(let p=0;p<4;p++) for(let r=p+1;r<5;r++)
    for(const a of E.MOVES) for(const b of E.MOVES) {
      const before=Object.freeze(board(p,r));
      const x=E.resolveBeat(before,a,b), y=E.resolveBeat(board(4-r,4-p),b,a);
      assert.ok(x.board.player>=0 && x.board.player<x.board.rival && x.board.rival<=4);
      assert.deepEqual([x.board.player,x.board.rival],[4-y.board.rival,4-y.board.player]);
      assert.deepEqual([x.playerResult,x.rivalResult],[y.rivalResult,y.playerResult]);
      const adjacent=x.board.rival-x.board.player===1;
      assert.equal(x.board.playerHP,3-Number(adjacent && b==='thrust' && a!=='guard'));
      assert.equal(x.board.rivalHP,3-Number(adjacent && a==='thrust' && b!=='guard'));
    }
});
test('same destination, crossing, occupied square, following and edges',()=>{
  for(const [p,r,a,b,after] of [
    [1,3,'advance','advance',[1,3]], [1,2,'advance','advance',[1,2]],
    [1,2,'advance','guard',[1,2]], [1,2,'advance','retreat',[2,3]],
    [0,4,'retreat','retreat',[0,4]]]) {
    const result=E.resolveBeat(board(p,r),a,b);
    assert.deepEqual([result.board.player,result.board.rival],after);
  }
});
test('distance is checked after movement, guards and retreats work, a trapped retreat takes damage',()=>{
  assert.equal(E.resolveBeat(board(1,3),'thrust','advance').playerResult,'hit');
  assert.equal(E.resolveBeat(board(1,3),'thrust','guard').playerResult,'miss');
  assert.equal(E.resolveBeat(board(1,2),'thrust','retreat').playerResult,'miss');
  assert.equal(E.resolveBeat(board(1,2),'thrust','guard').rivalResult,'block');
  assert.equal(E.resolveBeat(board(1,2),'thrust','guard').playerResult,'parried');
  assert.equal(E.resolveBeat(board(3,4),'thrust','retreat').playerResult,'hit');
});
test('double hits, instant KO, double KO and sixth-round decisions',()=>{
  const result=E.resolveBeat(board(1,2,{playerHP:1,rivalHP:1}),'thrust','thrust');
  assert.deepEqual([result.playerResult,result.rivalResult],['hit','hit']);
  assert.deepEqual([result.board.playerHP,result.board.rivalHP],[0,0]);
  assert.equal(E.verdict(result.board,1),'draw');
  assert.equal(E.verdict(board(1,2,{rivalHP:0}),1),'win');
  assert.equal(E.verdict(board(1,2,{playerHP:0}),2),'loss');
  for(const [p,r,w] of [[1,1,'draw'],[3,2,'win'],[1,3,'loss']]){
    const final=board(1,2,{round:6,playerHP:p,rivalHP:r});
    assert.equal(E.verdict(final,2),null);
    assert.equal(E.verdict(final,3),w);
  }
});
const scripts=E.MOVES.flatMap(a=>E.MOVES.flatMap(b=>E.MOVES.map(c=>[a,b,c])));
test('all 64 player drafts face the same precommitted script for each style and public snapshot',()=>{
  for(const rival of E.RIVALS){
    let variesWithHistory=false;
    for(let p=0;p<4;p++) for(let r=p+1;r<5;r++) {
      const state=Object.freeze(board(p,r)), baseline=E.planRival(rival,state,[]);
      for(const last of scripts) {
        const sealed=E.planRival(rival,state,last);
        assert.equal(sealed.length,3);
        assert.ok(Object.isFrozen(sealed));
        assert.ok(sealed.every(x=>E.MOVES.includes(x)));
        if(String(baseline)!==String(sealed)) variesWithHistory=true;
        // Resolve every possible draft with the same pre-round history.
        for(const draft of scripts){
          let cur=state;
          for(let i=0;i<3;i++){
            const beat=E.resolveBeat(cur,draft[i],sealed[i]);
            assert.equal(beat.rivalMove,sealed[i]);
            cur=beat.board;
            if(E.verdict(cur,i+1)) break;
          }
        }
        assert.deepEqual(E.planRival(rival,state,last),sealed);
      }
    }
    assert.ok(variesWithHistory);
  }
  assert.deepEqual(E.RIVALS.map(x=>E.planRival(x,E.initial())[0]),['advance','guard','retreat']);
});
test('each rival can be beaten using a repeatable sequence from the starting board',()=>{
  const replays = {
    pine: ['111','123','333'],
    rain: ['112','123','123','133'],
    swallow: ['111','212','323','133']
  };
  for (const [style, rounds] of Object.entries(replays)) {
    let state=E.initial(), previous=[], outcome=null;
    for (const digits of rounds) {
      const opponent=E.planRival(style,state,previous);
      const moves=[...digits].map(d=>E.MOVES[Number(d)-1]);
      for (let i=0;i<3;i++) {
        state=E.resolveBeat(state,moves[i],opponent[i]).board;
        outcome=E.verdict(state,i+1);
        if (outcome) break;
      }
      if (outcome) break;
      state={...state,round:state.round+1};
      previous=moves;
    }
    assert.equal(outcome,'win',style);
  }
});
test('integration record and all eight dictionaries match, including substitution fields',()=>{
  const manifest=require('./lobby-entry.json');
  const root=path.join(__dirname,'../..');
  let messages;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),
    { window:{BooplandI18n:{register(scope,m){assert.equal(scope,'bridgeDuel');messages=m;}}} });
  assert.equal(manifest.order,69); assert.equal(manifest.category,'策略');
  for(const loc of [manifest.path,manifest.cover]) assert.ok(fs.existsSync(path.join(root,loc)));
  const locales=['zh-CN','en','ja','ko','fr','de','es','pt-BR'];
  for(const lang of locales) {
    assert.equal(manifest.locales[lang].title,messages[lang].title);
    assert.ok(manifest.locales[lang].description);
    for(const [key,english] of Object.entries(messages.en)){
      assert.ok(messages[lang][key],lang+' '+key);
      assert.deepEqual((messages[lang][key].match(/\{\w+\}/g)||[]).sort(),(english.match(/\{\w+\}/g)||[]).sort());
    }
  }
});

