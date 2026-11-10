/* Paper Metro: deterministic simulation, independent of the DOM. */
(function (root) {
  'use strict';
  const COLORS = ['#b76b59', '#5d8a7d', '#6c87a4', '#b6974e', '#9980a1'];
  const TYPES = ['circle', 'triangle', 'square', 'diamond', 'star'];
  const PLAN = [
    [.18,.29,0], [.43,.46,1], [.76,.25,0], [.79,.73,2], [.25,.77,1],
    [.23,.52,0], [.57,.18,3], [.62,.66,0], [.45,.83,2], [.83,.48,1],
    [.38,.18,0], [.62,.42,4], [.12,.12,2], [.12,.90,0], [.87,.91,3],
    [.48,.64,1], [.88,.10,0], [.10,.65,2]
  ];
  class Metro {
    constructor({seed = Date.now(), calm = false} = {}) {
      this.seed = seed >>> 0; this.calm = calm; this.time = 0; this.week = 1;
      this.score = 0; this.totalSpawned = 0; this.nextPassenger = 0;
      this.fleet = 3; this.capacity = 6; this.unlocked = 3;
      this.stations = []; this.lines = COLORS.map((color, id) => ({id, color, route: [], trains: []}));
      this.arrivalTimer = 3; this.stationTimer = 22; this.supply = false;
      this.gameOver = false; this.failedStation = null; this.revision = 0;
      this.distances = new Map(); this.events = [];
      for (let i = 0; i < 5; i++) this.addStation();
    }
    random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
    invalidate() { this.revision++; this.distances.clear(); }
    addStation() {
      if (this.stations.length >= PLAN.length) return false;
      const id = this.stations.length, [x,y,type] = PLAN[id];
      this.stations.push({id, x: x + (this.random()-.5)*.018, y: y + (this.random()-.5)*.018,
        type: TYPES[type], queue: [], pressure: 0, born: this.time});
      this.invalidate();
      if (id >= 5) this.events.push({type:'station', id});
      return true;
    }
    get freeTrains() { return this.fleet - this.lines.reduce((n,l) => n+l.trains.length, 0); }
    edgeTime(a,b) {
      const s=this.stations[a], t=this.stations[b];
      return Math.hypot((s.x-t.x)*950,(s.y-t.y)*650)/115 + .65;
    }
    distanceTo(type) {
      if (this.distances.has(type)) return this.distances.get(type);
      const d=this.stations.map(s => s.type === type ? 0 : Infinity), done=new Set();
      const edges=this.stations.map(() => []);
      for (const l of this.lines) if (l.trains.length) {
        for (let i=1;i<l.route.length;i++) {
          const a=l.route[i-1], b=l.route[i], w=this.edgeTime(a,b);
          edges[a].push([b,w]); edges[b].push([a,w]);
        }
      }
      for (let i=0;i<d.length;i++) {
        let at=-1;
        for (let j=0;j<d.length;j++) if (!done.has(j) && (at<0 || d[j]<d[at])) at=j;
        if (at<0 || !Number.isFinite(d[at])) break;
        done.add(at);
        for (const [to,w] of edges[at]) d[to]=Math.min(d[to],d[at]+w);
      }
      this.distances.set(type,d); return d;
    }
    toward(type, from, to) {
      const d=this.distanceTo(type);
      return Number.isFinite(d[from]) && d[to]+this.edgeTime(from,to) <= d[from]+.001;
    }
    evacuate(line, train) {
      const at=this.stations[line.route[train.index]];
      if (at) at.queue.push(...train.load);
      train.load=[];
    }
    setRoute(id, route) {
      const line=this.lines[id];
      if (!line || id>=this.unlocked || !Array.isArray(route) || route.length<2 ||
          new Set(route).size!==route.length || route.some(s => !Number.isInteger(s) || !this.stations[s])) return false;
      let count=line.trains.length;
      line.trains.forEach(t => this.evacuate(line,t));
      line.trains=[]; line.route=[...route];
      if (!count && this.freeTrains>0) count=1;
      for (let i=0;i<count;i++) this.placeTrain(line,i,count);
      this.invalidate(); return true;
    }
    clearRoute(id) {
      const line=this.lines[id];
      if (!line) return;
      line.trains.forEach(t=>this.evacuate(line,t));
      line.trains=[]; line.route=[]; this.invalidate();
    }
    placeTrain(line, slot=0, total=1) {
      const index=Math.floor(slot*(line.route.length-1)/Math.max(1,total));
      line.trains.push({index,dir:index===line.route.length-1?-1:1,progress:0,dwell:.4,load:[]});
    }
    assignTrain(id, delta) {
      const line=this.lines[id];
      if (!line || id>=this.unlocked) return false;
      if (delta>0) {
        if (line.route.length<2 || this.freeTrains<=0 || line.trains.length>=5) return false;
        this.placeTrain(line,line.trains.length,line.trains.length+1);
      } else {
        if (!line.trains.length) return false;
        this.evacuate(line,line.trains.pop());
      }
      this.invalidate(); return true;
    }
    spawnPassenger(stationId, type) {
      const s=this.stations[stationId];
      const types=[...new Set(this.stations.map(n=>n.type))].filter(t=>t!==s.type);
      type=type || types[Math.floor(this.random()*types.length)];
      if (!types.includes(type)) return false;
      s.queue.push({id:this.nextPassenger++,type}); this.totalSpawned++; return true;
    }
    service(line, train) {
      const from=line.route[train.index], station=this.stations[from];
      if (train.index===line.route.length-1) train.dir=-1;
      if (train.index===0) train.dir=1;
      const to=line.route[train.index+train.dir];
      const stay=[];
      for (const p of train.load) {
        if (p.type===station.type) this.score++;
        else if (this.toward(p.type,from,to)) stay.push(p);
        else station.queue.push(p);
      }
      train.load=stay;
      station.queue=station.queue.filter(p=>{
        if (train.load.length<this.capacity && this.toward(p.type,from,to)) {train.load.push(p); return false;}
        return true;
      });
    }
    chooseSupply(choice) {
      if (!this.supply || !['train','line','carriage'].includes(choice) || (choice==='line' && this.unlocked>=5)) return false;
      this.fleet++;
      if (choice==='train') this.fleet++;
      if (choice==='line') this.unlocked++;
      if (choice==='carriage') this.capacity+=2;
      this.supply=false; return true;
    }
    tick(dt) {
      if (this.gameOver || this.supply || !Number.isFinite(dt) || dt<=0) return;
      // Small steps preserve stop service and pressure thresholds even during fast-forward.
      let remaining=Math.min(dt,2);
      while (remaining>0 && !this.gameOver && !this.supply) {
        const step=Math.min(.05,remaining); remaining-=step; this.step(step);
      }
    }
    step(dt) {
      this.time+=dt;
      if (this.time>=this.week*60) {this.week++; this.supply=true; this.events.push({type:'supply'}); return;}
      this.stationTimer-=dt;
      if (this.stationTimer<=0) {this.addStation(); this.stationTimer=23;}
      this.arrivalTimer-=dt;
      if (this.arrivalTimer<=0) {
        const s=this.stations[Math.floor(this.random()*this.stations.length)];
        // Calm mode caps queues without removing any already-created passengers.
        if (!this.calm || s.queue.length<24) this.spawnPassenger(s.id);
        this.arrivalTimer=Math.max(.35, 2.5/(1+this.time/110))*(.75+this.random()*.5);
      }
      for (const line of this.lines) for (const train of line.trains) {
        if (train.dwell>0) {
          train.dwell-=dt;
          if (train.dwell<=0) this.service(line,train);
        } else {
          const from=line.route[train.index], to=line.route[train.index+train.dir];
          train.progress+=dt/(this.edgeTime(from,to)-.65);
          if (train.progress>=1) {train.index+=train.dir; train.progress=0; train.dwell=.65;}
        }
      }
      for (const s of this.stations) {
        s.pressure=Math.max(0,Math.min(18,s.pressure+(s.queue.length>=9?dt:-dt*2)));
        if (!this.calm && s.pressure>=18) {this.gameOver=true; this.failedStation=s.id; break;}
      }
    }
  }
  Metro.COLORS=COLORS; Metro.TYPES=TYPES;
  if (typeof module!=='undefined' && module.exports) module.exports=Metro;
  else root.PaperMetro=Metro;
})(typeof window!=='undefined'?window:globalThis);
