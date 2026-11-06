(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MarbleRush=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const W=540,H=660,FLOOR=612,DANGER=564,SIZE=58,GAP=68,LEFT=36;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class Game {
    constructor(onEvent=()=>{},random=Math.random){this.onEvent=onEvent;this.random=random;this.reset();}
    emit(type,data={}){this.onEvent(type,data);}
    reset(){
      this.state='intro';this.previous='aim';this.wave=1;this.score=0;this.energy=45;this.count=30;this.combo=0;this.bestCombo=0;this.armed=false;this.fury=false;this.angle=-Math.PI/2+.18;this.origin=270;this.nextOrigin=null;this.balls=[];this.tiles=[];this.pickups=[];this.id=0;this.time=0;this.shotTime=0;this.queued=0;this.returned=0;this.fireClock=0;this.settleClock=0;this.speed=1;
      for(let row=0;row<3;row++)this.addRow(row,true);
    }
    start(){if(this.state==='intro'){this.state='aim';this.emit('state');}}
    addRow(row=0,initial=false){
      const empty=Math.floor(this.random()*7),bombCol=initial?(row===2?3:row===1?4:1):Math.floor(this.random()*7);
      for(let c=0;c<7;c++){
        if(c===empty){this.pickups.push({id:++this.id,x:LEFT+c*GAP+SIZE/2,y:70+row*GAP+SIZE/2});continue;}
        if(!initial&&this.random()<.13)continue;
        const bomb=c===bombCol, hp=initial?5+row*2+Math.floor(this.random()*5):Math.round(7+this.wave*2.1+this.random()*this.wave*1.3);
        this.tiles.push({id:++this.id,x:LEFT+c*GAP,y:70+row*GAP,w:SIZE,h:SIZE,hp:bomb?Math.max(3,Math.ceil(hp*.55)):hp,max:hp,type:bomb?'bomb':'normal',color:(c+row+this.wave)%4,hit:0});
      }
      // A row always offers a reachable explosion, even if its chosen cell was the gap.
      const rowTiles=this.tiles.filter(t=>t.y===70+row*GAP&&t.hp>0);
      if(!rowTiles.some(t=>t.type==='bomb')&&rowTiles.length){const t=rowTiles[Math.floor(rowTiles.length/2)];t.type='bomb';t.hp=Math.ceil(t.hp*.55);}
    }
    aim(x,y){if(this.state==='aim')this.angle=clamp(Math.atan2(Math.min(-25,y-FLOOR),x-this.origin),-Math.PI+.14,-.14);}
    turn(delta){if(this.state==='aim')this.angle=clamp(this.angle+delta,-Math.PI+.14,-.14);}
    toggleFury(){if(this.state!=='aim'||this.energy<100)return false;this.armed=!this.armed;this.emit('change');return true;}
    fire(){
      if(this.state!=='aim')return false;
      this.state='volley';this.fury=this.armed&&this.energy>=100;this.armed=false;if(this.fury)this.energy=0;
      this.combo=0;this.shotTime=0;this.queued=this.count;this.returned=0;this.nextOrigin=null;this.fireClock=0;this.emit('fire',{fury:this.fury});this.emit('state');return true;
    }
    pause(){if(this.state==='paused'){this.state=this.previous;}else if(['aim','volley','settle'].includes(this.state)){this.previous=this.state;this.state='paused';}else return;this.emit('state');}
    recall(){if(this.state!=='volley'||this.shotTime<2)return false;this.queued=0;this.balls=[];this.finishShot();return true;}
    finishShot(){if(this.state!=='volley')return;this.origin=clamp(this.nextOrigin??this.origin,22,W-22);this.fury=false;this.state='settle';this.settleClock=.55;this.emit('state');}
    nextWave(){
      this.tiles=this.tiles.filter(t=>t.hp>0);this.wave++;this.count=Math.min(120,this.count+2);
      for(const t of this.tiles)t.y+=GAP;
      this.pickups=this.pickups.filter(p=>p.y+GAP<DANGER);for(const p of this.pickups)p.y+=GAP;
      if(this.tiles.some(t=>t.y+t.h>=DANGER)){this.state='over';this.emit('over');this.emit('state');return;}
      this.addRow();this.state='aim';this.emit('wave');this.emit('state');
    }
    damage(tile,amount,chain=false){
      if(tile.hp<=0)return;tile.hp=Math.max(0,tile.hp-amount);tile.hit=.1;
      this.score+=amount*2;this.emit('hit',{x:tile.x+29,y:tile.y+29,color:tile.color});
      if(tile.hp>0)return;
      this.combo++;this.bestCombo=Math.max(this.combo,this.bestCombo);const points=40+Math.min(this.combo,30)*10;this.score+=points;this.energy=Math.min(100,this.energy+4);
      this.emit('break',{tile:{...tile},points,combo:this.combo});
      if(tile.type==='bomb'){
        this.emit('bomb',{x:tile.x+29,y:tile.y+29});
        for(const neighbor of this.tiles)if(neighbor.hp>0&&Math.hypot(neighbor.x-tile.x,neighbor.y-tile.y)<112)this.damage(neighbor,12+this.wave*2,true);
        for(let i=this.pickups.length-1;i>=0;i--)if(Math.hypot(this.pickups[i].x-tile.x-29,this.pickups[i].y-tile.y-29)<112)this.collect(i);
      }
    }
    collect(index){const p=this.pickups[index];if(!p)return;this.count=Math.min(120,this.count+5);this.energy=Math.min(100,this.energy+5);this.pickups.splice(index,1);this.emit('pickup',{x:p.x,y:p.y});}
    update(dt){
      if(!['aim','volley','settle'].includes(this.state))return;
      dt=clamp(dt,0,.05)*this.speed;
      if(this.state==='settle'){this.settleClock-=dt;if(this.settleClock<=0)this.nextWave();return;}
      if(this.state==='aim')return;
      const steps=Math.max(1,Math.ceil(dt/(1/180)));for(let s=0;s<steps;s++){if(this.state!=='volley')break;this.step(dt/steps);}
    }
    step(dt){
      this.time+=dt;this.shotTime+=dt;this.fireClock-=dt;
      while(this.queued>0&&this.fireClock<=0){this.balls.push({x:this.origin,y:FLOOR-1,px:this.origin,py:FLOOR-1,vx:Math.cos(this.angle)*670,vy:Math.sin(this.angle)*670,r:5.1,age:0,hits:new Map()});this.queued--;this.fireClock+=.026;}
      for(const t of this.tiles)t.hit=Math.max(0,t.hit-dt);
      for(let i=this.balls.length-1;i>=0;i--){
        const b=this.balls[i];b.px=b.x;b.py=b.y;b.age+=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
        if(b.x<20){b.x=20;b.vx=Math.abs(b.vx);this.emit('wall',{x:b.x,y:b.y});}
        if(b.x>W-20){b.x=W-20;b.vx=-Math.abs(b.vx);this.emit('wall',{x:b.x,y:b.y});}
        if(b.y<42){b.y=42;b.vy=Math.abs(b.vy);}
        for(let p=this.pickups.length-1;p>=0;p--)if(Math.hypot(b.x-this.pickups[p].x,b.y-this.pickups[p].y)<19)this.collect(p);
        for(const t of this.tiles){
          if(t.hp<=0||(b.hits.has(t.id)&&this.time-b.hits.get(t.id)<.10))continue;
          let dx=b.x-clamp(b.x,t.x,t.x+t.w),dy=b.y-clamp(b.y,t.y,t.y+t.h),dist=Math.hypot(dx,dy);if(dist>=b.r)continue;
          b.hits.set(t.id,this.time);
          if(!this.fury){
            if(dist===0){const edges=[{d:Math.abs(b.x-t.x),x:-1,y:0},{d:Math.abs(t.x+t.w-b.x),x:1,y:0},{d:Math.abs(b.y-t.y),x:0,y:-1},{d:Math.abs(t.y+t.h-b.y),x:0,y:1}].sort((a,z)=>a.d-z.d);dx=edges[0].x;dy=edges[0].y;b.x+=dx*(edges[0].d+b.r+.1);b.y+=dy*(edges[0].d+b.r+.1);}else{dx/=dist;dy/=dist;b.x+=dx*(b.r-dist+.1);b.y+=dy*(b.r-dist+.1);}
            const dot=b.vx*dx+b.vy*dy;if(dot<0){b.vx-=2*dot*dx;b.vy-=2*dot*dy;}
            if(Math.abs(b.vy)<105){const sign=b.vy<0?-1:1;b.vy=sign*105;b.vx=Math.sign(b.vx)*Math.sqrt(670**2-105**2);}
          }
          this.damage(t,this.fury?3:1);if(!this.fury)break;
        }
        // Bound every volley, including pathological near-horizontal ricochets.
        if(b.age>13){b.vy=Math.max(260,b.vy);b.vx*=.99;}
        if((b.y>=FLOOR&&b.vy>0)||b.age>20){if(this.nextOrigin===null)this.nextOrigin=clamp(b.x,22,W-22);this.returned++;this.balls.splice(i,1);}
      }
      if(this.queued===0&&this.balls.length===0)this.finishShot();
      else if(!this.tiles.some(t=>t.hp>0)){this.score+=500;this.emit('clear');this.queued=0;this.balls=[];this.finishShot();}
    }
    trajectory(){
      let x=this.origin,y=FLOOR,vx=Math.cos(this.angle),vy=Math.sin(this.angle),points=[{x,y}];
      for(let segment=0;segment<3;segment++){
        for(let i=0;i<260;i++){x+=vx*3;y+=vy*3;if(this.tiles.some(t=>t.hp>0&&x>t.x-5&&x<t.x+t.w+5&&y>t.y-5&&y<t.y+t.h+5)){points.push({x,y});return points;}if(y<42){points.push({x,y:42});return points;}if(x<20||x>W-20){x=clamp(x,20,W-20);points.push({x,y});vx=-vx;break;}}
      }return points;
    }
  }
  return {Game,W,H,FLOOR,DANGER};
});
