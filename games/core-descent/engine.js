/* Fixed logical world; no DOM or external dependencies. */
(() => {
  'use strict';
  const W = 480, H = 640, GAP = 82, START = 220;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  class Descent {
    constructor(random = Math.random) { this.random = random; this.reset(); this.mode = 'ready'; }
    reset() {
      this.mode = 'playing'; this.time = 0; this.camera = 0; this.floor = 0; this.hp = 6; this.crystals = 0; this.events = []; this.reason = ''; this.nextRow = 1; this.lastX = 240;
      this.player = { x:240, y:START - 15, vy:0, vx:0, half:12, height:30, invincible:0, standing:0, facing:1 };
      this.platforms = [{ id:0, row:0, x:177, y:START, w:126, type:'normal', visited:true, timer:null }];
      this.generate();
    }
    generate() {
      while (START + this.nextRow * GAP < this.camera + H + 240 && this.nextRow <= 100) {
        const row = this.nextRow++, y = START + row * GAP;
        const dir = this.lastX > 330 ? -1 : this.lastX < 150 ? 1 : this.random() < .5 ? -1 : 1;
        const cx = clamp(this.lastX + dir * (72 + this.random() * 54), 90, W - 90);
        const roll = this.random();
        const type = row < 5 || row === 100 ? 'normal' : roll < .20 ? 'crumble' : roll < .32 ? 'spring' : roll < .49 ? 'belt' : 'normal';
        const w = row === 100 ? 210 : 124 - Math.min(row,80) * .18 + this.random() * 20;
        const x = clamp(cx-w/2,30,W-w-30);
        this.platforms.push({ id:row*2, row, x, y, w, type, dir:this.random()<.5?-1:1, visited:false, timer:null, gem:row%5===0 });
        if (row > 6 && row < 100 && this.random() < .43) {
          const sx = cx < W/2 ? W-115 : 30;
          if (sx+80 < x-18 || sx > x+w+18) this.platforms.push({id:row*2+1,row,x:sx,y:y+8,w:80,type:'spike',visited:false,timer:null});
        }
        this.lastX = cx;
      }
    }
    hurt(reason) {
      const p = this.player;
      if (p.invincible > 0 || this.mode !== 'playing') return;
      this.hp = Math.max(0,this.hp-2); p.invincible = 1.15;
      this.events.push({type:'hurt',x:p.x,y:p.y});
      if (!this.hp) this.finish('over',reason);
    }
    finish(mode,reason='') { if(this.mode!=='playing')return; this.mode=mode;this.reason=reason;this.events.push({type:mode}); }
    land(platform) {
      const p=this.player; p.y=platform.y-p.height/2;p.vy=0;p.standing=platform.id;
      if(platform.type==='spike')this.hurt('spikes');
      if(!platform.visited){
        platform.visited=true;
        if(platform.type==='normal' && this.hp<6){this.hp++;this.events.push({type:'heal',x:p.x,y:p.y});}
        this.events.push({type:'land',x:p.x,y:platform.y});
      }
      if(platform.type==='crumble' && platform.timer===null)platform.timer=.55;
      if(platform.type==='spring'){p.vy=-335;p.standing=null;this.events.push({type:'spring',x:p.x,y:platform.y});}
      if(platform.gem){platform.gem=false;this.crystals++;this.events.push({type:'gem',x:p.x,y:p.y});}
      if(platform.row===100)this.finish('won');
    }
    update(dt,direction=0) {
      if(this.mode!=='playing')return;
      let remaining=clamp(dt,0,.1);
      while(remaining>0 && this.mode==='playing'){const step=Math.min(remaining,1/120);this.step(step,clamp(direction,-1,1));remaining-=step;}
    }
    step(dt,direction) {
      const p=this.player;this.time+=dt;p.invincible=Math.max(0,p.invincible-dt);
      // Follow a descending explorer, but never as fast as a free fall: missing
      // every platform must still allow the player to fall off the screen.
      this.camera+=(35+Math.min(this.floor,100)*.43+clamp((p.y-this.camera-H*.58)*4,0,155))*dt;
      for(const platform of this.platforms){if(platform.timer!==null){platform.timer-=dt;if(platform.timer<=0&&!platform.broken){platform.broken=true;this.events.push({type:'break',x:platform.x+platform.w/2,y:platform.y});}}}
      let ground=this.platforms.find(platform=>platform.id===p.standing&&!platform.broken);
      p.vx=direction*235;if(direction)p.facing=direction;
      p.x=clamp(p.x+(p.vx+(ground?.type==='belt'?ground.dir*92:0))*dt,27,W-27);
      if(ground && (p.x+p.half<ground.x || p.x-p.half>ground.x+ground.w))ground=null;
      if(!ground)p.standing=null;
      if(ground){p.y=ground.y-p.height/2;if(ground.type==='spike')this.hurt('spikes');}
      else {
        const oldFeet=p.y+p.height/2;p.vy=Math.min(490,p.vy+1050*dt);p.y+=p.vy*dt;
        if(p.vy>=0){
          const hit=this.platforms.filter(platform=>!platform.broken && oldFeet<=platform.y+.05 && p.y+p.height/2>=platform.y && p.x+p.half>platform.x && p.x-p.half<platform.x+platform.w).sort((a,b)=>a.y-b.y)[0];
          if(hit)this.land(hit);
        }
      }
      const nextFloor=clamp(Math.floor((p.y+p.height/2-START)/GAP),0,100);
      if(nextFloor>this.floor){const old=this.floor;this.floor=nextFloor;if(Math.floor(old/20)<Math.floor(this.floor/20)&&this.floor<100)this.events.push({type:'milestone',floor:this.floor});}
      if(p.y-p.height/2<this.camera+25){this.hurt('ceiling');p.y=this.camera+25+p.height/2;p.vy=135;p.standing=null;}
      if(p.y-p.height/2>this.camera+H)this.finish('over','fall');
      this.platforms=this.platforms.filter(platform=>platform.y>this.camera-100);
      this.generate();
    }
  }
  const api={Descent,W,H,GAP,START};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else window.CoreDescent=api;
})();
