(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OneCast = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const FISH = Object.freeze([
    { id:'minnow', color:'#a8b6a1', rarity:'common', chance:25, points:30, min:0.08, max:0.3 },
    { id:'carp', color:'#c7ae82', rarity:'common', chance:23, points:40, min:0.3, max:1.5 },
    { id:'perch', color:'#a8b591', rarity:'common', chance:18, points:50, min:0.2, max:1.2 },
    { id:'trout', color:'#b2c3c1', rarity:'uncommon', chance:13, points:80, min:0.5, max:2.5 },
    { id:'koi', color:'#d3a28a', rarity:'uncommon', chance:10, points:100, min:0.6, max:3 },
    { id:'moonfish', color:'#b1b8cb', rarity:'rare', chance:6, points:150, min:0.8, max:2.8 },
    { id:'goldfish', color:'#d5bd76', rarity:'rare', chance:4, points:200, min:0.2, max:0.9 },
    { id:'starfish', color:'#b8b29b', rarity:'legendary', chance:1, points:400, min:1.5, max:5 }
  ].map(Object.freeze));
  const BITE_WINDOW = 1900;
  const PERFECT_WINDOW = 480;
  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() { this.state='idle'; this.elapsed=0; this.clock=0; this.score=0; this.caught=0; this.streak=0; this.result=null; this.paused=false; this.castCount=0; }
    sample() { const n=this.random(); return Number.isFinite(n) ? Math.max(0,Math.min(0.999999999,n)) : 0.5; }
    cast() {
      this.state='casting'; this.elapsed=0; this.result=null; this.castCount++;
      this.wait=1800+this.sample()*2600;
      return 'cast';
    }
    press() {
      if(this.paused) return null;
      if(this.state==='idle' || this.state==='result') return this.cast();
      if(this.state==='casting') return null;
      if(this.state==='waiting') return this.miss('early');
      if(this.state==='bite') return this.catchFish();
      return null;
    }
    miss(reason) { this.state='result'; this.elapsed=0; this.streak=0; this.result={type:'miss',reason}; return 'miss'; }
    catchFish() {
      const perfect=this.elapsed<=PERFECT_WINDOW;
      const weights=FISH.map(f=>f.chance*(perfect && ['rare','legendary'].includes(f.rarity)?2:1));
      let roll=this.sample()*weights.reduce((a,b)=>a+b,0), index=0;
      while(index<weights.length-1 && roll>=weights[index]) roll-=weights[index++];
      const fish=FISH[index], weight=Math.round((fish.min+this.sample()*(fish.max-fish.min))*100)/100;
      this.streak++; this.caught++;
      const multiplier=Math.min(3,1+Math.floor((this.streak-1)/3)*0.5);
      const points=Math.round(fish.points*multiplier*(perfect?1.5:1));
      this.score+=points;
      this.result={type:'catch',fish:fish.id,weight,points,perfect,multiplier};
      this.state='result'; this.elapsed=0;
      return 'catch';
    }
    tick(delta) {
      if(this.paused || !Number.isFinite(delta) || delta<=0) return null;
      // A stalled frame must not consume the reaction window before it is visible.
      const dt=Math.min(delta,100); this.clock+=dt; this.elapsed+=dt;
      if(this.state==='casting' && this.elapsed>=650) { this.state='waiting'; this.elapsed=0; return 'wait'; }
      if(this.state==='waiting' && this.elapsed>=this.wait) { this.state='bite'; this.elapsed=0; return 'bite'; }
      if(this.state==='bite' && this.elapsed>=BITE_WINDOW) return this.miss('late');
      return null;
    }
    get remaining() { return this.state==='bite' ? Math.max(0,1-this.elapsed/BITE_WINDOW) : 0; }
  }
  function cleanSave(value) {
    const out={best:0,fish:{}};
    if(!value || typeof value!=='object') return out;
    const valid=n=>Number.isFinite(n)&&n>=0;
    if(valid(value.best)) out.best=Math.min(999999999,Math.floor(value.best));
    FISH.forEach(f=>{ const item=value.fish?.[f.id]; if(item && valid(item.count) && item.count>=1 && valid(item.weight)) out.fish[f.id]={count:Math.min(999999,Math.floor(item.count)),weight:Math.min(f.max,Math.max(f.min,item.weight))}; });
    return out;
  }
  return Object.freeze({Game,FISH,BITE_WINDOW,PERFECT_WINDOW,cleanSave});
});
