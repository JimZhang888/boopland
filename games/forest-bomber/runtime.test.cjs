const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const E=require('./engine.js');

// Exercise the actual input handlers and frame loop with a deterministic clock.
function harness(blockStorage=false){
  const callbacks=new Map(),storage=new Map();let serial=0,clock=0,model,dictionaries;const noop=()=>{};
  const eventTarget=()=>({listeners:{},addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);},emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event);}});
  function element(id){
    const classes=new Set();return Object.assign(eventTarget(),{id,textContent:'',hidden:false,disabled:false,open:false,attributes:{},dataset:{},style:{},
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);}},
      getBoundingClientRect:()=>({x:0,y:0,left:0,top:0,right:700,bottom:600,width:700,height:600}),
      setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},setPointerCapture(id){this.capture=id;},
      focus(){document.activeElement=this;},closest:()=>null,showModal(){this.open=true;},close(){this.open=false;this.emit('close');},querySelector(){return this.state;}
    });
  }
  const ids=[...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  const nodes=Object.fromEntries(ids.map(id=>[id,element(id)]));
  const directions=[0,1,2,3].map(dir=>Object.assign(element(`dir${dir}`),{dataset:{dir:String(dir)}}));
  const rivals=[1,2,3].map(id=>Object.assign(element(`rival${id}`),{dataset:{rival:String(id)},state:element(`rivalstate${id}`)}));
  const extras={'.timer-stat':element('timer-stat'),'.intro-illustration':element('illustration')};
  const document=Object.assign(eventTarget(),{hidden:false,activeElement:null,getElementById:id=>nodes[id],querySelector:s=>extras[s],querySelectorAll(s){if(s==='[data-dir]')return directions;if(s==='[data-rival]')return rivals;if(s==='.pressed')return [...directions,nodes.bomb].filter(el=>el.classList.contains('pressed'));return [];}});
  const I={language:'en',register(scope,value){dictionaries=value;},t(key,values={}){const message=dictionaries[this.language][key.split('.')[1]];if(!message)throw new Error('Missing translation: '+key);return message.replace(/\{(\w+)\}/g,(m,k)=>values[k]??m);}};
  const engine={...E,create(opts){model=E.create({...opts,seed:9});return model;},next(s){model=E.next(s);return model;}};
  const window=Object.assign(eventTarget(),{ForestBomber:engine,BooplandI18n:I,ForestScene:{Scene:class{constructor(){this.particles=[];}resize(){}draw(){}effect(){}}},innerWidth:1280,innerHeight:720});
  const context=vm.createContext({window,document,console,Math,ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}},requestAnimationFrame:fn=>{callbacks.set(++serial,fn);return serial;},cancelAnimationFrame:id=>callbacks.delete(id),localStorage:{getItem:k=>{if(blockStorage)throw Error('denied');return storage.get(k)||null;},setItem:(k,v)=>{if(blockStorage)throw Error('denied');storage.set(k,v);}}});
  vm.runInContext(fs.readFileSync(__dirname+'/translations.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
  function pump(frames=1){for(let i=0;i<frames;i++){clock+=1000/60;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(clock));}}
  function key(type,code,extra={}){window.emit(type,{code,target:nodes['forest-canvas'],preventDefault:noop,...extra});}
  function pointer(el,type,id=1){el.emit(type,{pointerId:id,preventDefault:noop});}
  return {get model(){return model;},nodes,directions,document,window,I,pump,key,pointer,callbacks,storage};
}

test('start, keyboard movement, release and bomb repeat suppression run through actual handlers',()=>{
  const h=harness();assert.equal(h.model.mode,'ready');h.nodes.primary.emit('click');assert.equal(h.model.mode,'running');
  h.key('keydown','ArrowRight');h.key('keyup','ArrowRight');h.pump(20);assert.equal(h.model.actors[0].x,2);assert.equal(h.model.actors[0].moveLeft,0);
  h.key('keydown','Space');assert.equal(h.model.bombs.length,1);h.model.actors[0].capacity=3;h.key('keydown','Space',{repeat:true});assert.equal(h.model.bombs.length,1);
});
test('a quick touch walks one tile, holding repeats, and cancelled touches stop at a tile',()=>{
  const h=harness();h.nodes.primary.emit('click');h.pointer(h.directions[1],'pointerdown',11);h.pointer(h.directions[1],'pointerup',11);h.pump(20);assert.equal(h.model.actors[0].x,2);
  h.pointer(h.directions[3],'pointerdown',11);h.pump(20);h.pointer(h.directions[3],'pointercancel',11);h.pump(20);assert.equal(h.model.actors[0].x,1);assert.equal(h.directions[3].classList.contains('pressed'),false);
});
test('two pointers can move and queue a bomb without releasing each other',()=>{
  const h=harness();h.nodes.primary.emit('click');h.pointer(h.directions[1],'pointerdown',11);h.pointer(h.nodes.bomb,'pointerdown',22);h.pointer(h.nodes.bomb,'pointerup',22);h.pump(30);
  assert.equal(h.model.bombs.length,1);assert.equal(h.model.bombs[0].x,2);assert.equal(h.model.actors[0].x,3);h.pointer(h.directions[1],'lostpointercapture',11);h.pump(20);assert.equal(h.model.actors[0].x,3);
});
test('pause, help, resume and restart clear held inputs and preserve or reset the right state',()=>{
  const h=harness();h.nodes.primary.emit('click');h.pointer(h.directions[1],'pointerdown');h.pump(2);h.nodes.help.emit('click');assert.equal(h.model.mode,'paused');assert.equal(h.nodes['help-dialog'].open,true);
  const time=h.model.time;h.key('keydown','KeyP');h.pump(40);assert.equal(h.model.time,time);h.nodes['close-help'].emit('click');h.nodes.primary.emit('click');h.pump(25);assert.equal(h.model.actors[0].x,2);
  h.key('keydown','KeyP');h.model.score=40;h.nodes.restart.emit('click');assert.equal(h.model.mode,'running');assert.equal(h.model.score,0);assert.equal(h.model.actors[0].x,1);
});
test('window blur and hidden tabs pause immediately and stop background frames',()=>{
  const h=harness();h.nodes.primary.emit('click');h.key('keydown','ArrowRight');h.pump(2);h.window.emit('blur');assert.equal(h.model.mode,'paused');h.nodes.primary.emit('click');h.pump(20);assert.equal(h.model.actors[0].x,2);
  h.document.hidden=true;h.document.emit('visibilitychange');const time=h.model.time;assert.equal(h.callbacks.size,0);h.pump(600);assert.equal(h.model.time,time);
  h.document.hidden=false;h.document.emit('visibilitychange');assert.equal(h.callbacks.size,1);h.nodes.primary.emit('click');h.pump(2);assert.ok(h.model.time-time<.04);
});
test('all terminal screens, the next grove and replay are wired to the actual state',()=>{
  const h=harness();h.nodes.primary.emit('click');h.model.actors.slice(1).forEach(a=>a.alive=false);h.pump(2);assert.equal(h.model.mode,'won');assert.equal(h.nodes.overlay.hidden,false);assert.equal(h.nodes['primary-text'].textContent,'Next grove');
  h.nodes.primary.emit('click');assert.equal(h.model.stage,2);assert.equal(h.model.mode,'running');h.model.remaining=.001;h.pump(2);assert.equal(h.model.mode,'lost');assert.equal(h.nodes['primary-text'].textContent,'Play again');
  h.nodes.primary.emit('click');assert.equal(h.model.stage,1);h.model.stage=5;h.model.actors.slice(1).forEach(a=>a.alive=false);h.pump(2);assert.equal(h.model.mode,'complete');assert.equal(h.nodes['overlay-title'].textContent,'A true forest explorer!');
});
test('language changes and restored pages refresh dynamic text without resetting progress',()=>{
  const h=harness();h.nodes.primary.emit('click');h.pump(15);h.model.score=777;const time=h.model.time;h.I.language='de';h.window.emit('boopland:languagechange');assert.equal(h.model.time,time);assert.equal(h.model.score,777);assert.equal(h.document.title,'Waldbomber · Boopland');
  h.window.emit('pagehide');assert.equal(h.callbacks.size,0);h.nodes['primary-text'].textContent='stale';h.window.emit('pageshow');assert.equal(h.nodes['primary-text'].textContent,'Weiter erkunden');assert.equal(h.model.mode,'paused');assert.equal(h.callbacks.size,1);
});
test('best score saves, and blocked storage does not prevent starting or finishing',()=>{
  const h=harness();h.nodes.primary.emit('click');h.model.score=350;h.pump(6);assert.equal(h.storage.get('boopland-forest-bomber-best'),'350');
  const denied=harness(true);denied.nodes.primary.emit('click');denied.model.score=900;assert.doesNotThrow(()=>denied.pump(10));assert.equal(denied.nodes.best.textContent,'900');
});
