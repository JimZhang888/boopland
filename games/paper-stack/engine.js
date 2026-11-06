(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PaperStack=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SIZE=160, STEP=24, RANGE=205, PERFECT=5;
  function createGame(){return {blocks:[{x:-80,z:-80,w:SIZE,d:SIZE,y:0}],active:null,score:0,streak:0,perfects:0,bestStreak:0,over:false,phase:0};}
  function spawn(game){
    if(game.over||game.active)return null;
    const top=game.blocks[game.blocks.length-1],axis=game.score%2?'z':'x';
    const side=Math.floor(game.score/2)%2?1:-1;
    game.phase=side<0?0:RANGE*2;
    game.active={x:top.x,z:top.z,w:top.w,d:top.d,y:(game.score+1)*STEP,axis,origin:top[axis]};
    game.active[axis]=top[axis]+side*RANGE;
    return game.active;
  }
  function advance(game,dt){
    if(!game.active||game.over||!Number.isFinite(dt)||dt<=0)return;
    const speed=Math.min(265,105+game.score*4.1);
    game.phase=(game.phase+speed*dt)%(RANGE*4);
    const offset=game.phase<=RANGE*2?-RANGE+game.phase:RANGE*3-game.phase;
    game.active[game.active.axis]=game.active.origin+offset;
  }
  function drop(game){
    if(!game.active||game.over)return null;
    const active={...game.active},top=game.blocks[game.blocks.length-1];
    const axis=active.axis,dimension=axis==='x'?'w':'d',delta=active[axis]-top[axis];
    game.active=null;
    const overlap=Math.min(active[axis]+active[dimension],top[axis]+top[dimension])-Math.max(active[axis],top[axis]);
    if(overlap<=0.001){game.over=true;game.streak=0;return {type:'miss',cut:active,axis,direction:Math.sign(delta)||1};}
    let cut=null,bonus=false;
    // The tolerance shrinks with a thin remaining block, so a near miss never restores a sliver for free.
    const perfect=Math.abs(delta)<=Math.min(PERFECT,top[dimension]*.12);
    if(perfect){
      active[axis]=top[axis];game.streak++;game.perfects++;game.bestStreak=Math.max(game.bestStreak,game.streak);
      if(game.streak%3===0){
        bonus=true;
        for(const [a,d] of [['x','w'],['z','d']]){
          const size=Math.min(SIZE,active[d]+10);active[a]-=(size-active[d])/2;active[d]=size;
        }
      }
    }else{
      game.streak=0;
      const start=Math.max(active[axis],top[axis]);
      cut={...active};cut[dimension]=active[dimension]-overlap;
      cut[axis]=delta<0?active[axis]:start+overlap;
      active[axis]=start;active[dimension]=overlap;
    }
    delete active.axis;delete active.origin;
    game.blocks.push(active);game.score++;
    return {type:perfect?'perfect':'cut',block:active,cut,axis,direction:Math.sign(delta)||1,bonus,streak:game.streak};
  }
  return {SIZE,STEP,RANGE,PERFECT,createGame,spawn,advance,drop};
});
