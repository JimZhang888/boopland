const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('./engine.js');

function harness(blockStorage = false) {
  const callbacks = new Map(); let serial = 0, clock = 0, model;
  const noop = () => {}, paint = new Proxy({}, { get: (obj, key) => obj[key] || noop, set: (obj, key, value) => { obj[key] = value; return true; } });
  const eventTarget = () => ({
    listeners: {}, addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    emit(type, event = {}) { for (const fn of this.listeners[type] || []) fn(event); }
  });
  function element(id) {
    return Object.assign(eventTarget(), {
      id, textContent:'', hidden:false, disabled:false, open:false, attributes:{},
      width:820, height:720, rect:{left:0,top:0,width:820,height:720},
      style:{ setProperty:noop }, classList:{toggle:noop}, parentElement:{classList:{toggle:noop}},
      setAttribute(key,value){this.attributes[key]=value;}, getAttribute(key){return this.attributes[key];},
      getContext:()=>paint, getBoundingClientRect(){return this.rect;},
      focus(){document.activeElement=this;}, closest:()=>null,
      setPointerCapture(id){this.capture=id;}, hasPointerCapture(id){return this.capture===id;}, releasePointerCapture(){this.capture=null;},
      showModal(){this.open=true;}, close(){this.open=false;this.emit('close');}
    });
  }
  const ids = [...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  const nodes = Object.fromEntries(ids.map(id=>[id,element(id)]));
  const document = Object.assign(eventTarget(),{hidden:false,activeElement:null,getElementById:id=>nodes[id],createElement:()=>element('new')});
  let dictionaries;
  const I = {language:'zh-CN',register:(scope,value)=>{dictionaries=value;}, t(key,values={}){
    const message=dictionaries[this.language][key.split('.')[1]];return message.replace(/\{(\w+)\}/g,(m,k)=>values[k]??m);
  }};
  const window = Object.assign(eventTarget(),{BooplandI18n:I,PaperZuma:{...E,Game:class extends E.Game{constructor(){super(()=>.32);model=this;}}},devicePixelRatio:2,matchMedia:()=>({matches:false,addEventListener:noop})});
  const storage = new Map();
  const context=vm.createContext({window,document,console,Math,localStorage:{
    getItem:key=>{if(blockStorage)throw new Error('Storage denied');return storage.get(key)||null;},
    setItem:(key,value)=>{if(blockStorage)throw new Error('Storage denied');storage.set(key,value);}
  },ResizeObserver:class{constructor(callback){this.callback=callback;}observe(){this.callback();}},
  requestAnimationFrame:fn=>{callbacks.set(++serial,fn);return serial;},cancelAnimationFrame:id=>callbacks.delete(id)});
  vm.runInContext(fs.readFileSync(__dirname+'/translations.js','utf8'),context);
  vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
  function pump(frames=1){for(let i=0;i<frames;i++){clock+=1000/60;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(clock));}}
  function key(code,extra={}){document.emit('keydown',{code,target:nodes.board,preventDefault:noop,...extra});}
  const pointer=(type,extra={})=>nodes.board.emit(type,{pointerId:1,pointerType:'touch',button:0,clientX:410,clientY:100,preventDefault:noop,...extra});
  return {model,nodes,window,document,I,pump,key,pointer,callbacks,storage};
}
test('touch aims using CSS-to-canvas coordinates and fires only on release',()=>{
  const h=harness();h.nodes.start.emit('click');h.nodes.board.rect.width=410;h.nodes.board.rect.height=360;
  h.pointer('pointerdown',{clientX:205,clientY:30});assert.equal(h.model.shotsFired,0);
  h.pointer('pointermove',{clientX:205,clientY:20});h.pointer('pointerup',{clientX:205,clientY:20});
  assert.equal(h.model.shotsFired,1);assert.ok(Math.abs(h.model.shots[0].vx)<.01);assert.ok(h.model.shots[0].vy<0);
  h.pointer('pointerup');assert.equal(h.model.shotsFired,1);
});
test('cancelled touches, a second pointer and a release after pause never shoot',()=>{
  const h=harness();h.nodes.start.emit('click');h.pointer('pointerdown');h.pointer('pointerdown',{pointerId:2});
  h.pointer('pointerup',{pointerId:2});assert.equal(h.model.shotsFired,0);
  h.pointer('pointercancel');h.pointer('pointerup');assert.equal(h.model.shotsFired,0);
  h.pointer('pointerdown');h.window.emit('blur');h.pointer('pointerup');assert.equal(h.model.shotsFired,0);assert.equal(h.model.phase,'paused');
});
test('keyboard, swap, help, resume and retry controls drive the real game',()=>{
  const h=harness();h.nodes.start.emit('click');h.model.current=0;h.model.next=1;h.key('Space');
  assert.equal(h.model.current,1);h.key('Enter');assert.equal(h.model.shotsFired,1);h.pump(20);
  h.nodes.help.emit('click');assert.equal(h.model.phase,'paused');assert.equal(h.nodes['help-dialog'].open,true);
  h.key('Enter');assert.equal(h.model.phase,'paused');h.nodes['close-help'].emit('click');h.key('KeyP');
  assert.equal(h.model.phase,'playing');h.key('KeyP');h.nodes.retry.emit('click');assert.equal(h.model.score,0);assert.equal(h.model.shotsFired,0);
});
test('language updates keep game progress and page restore refreshes dynamic controls',()=>{
  const h=harness();h.nodes.start.emit('click');h.model.score=120;h.pump(15);
  const chain=JSON.stringify(h.model.chain),elapsed=h.model.elapsed;
  h.I.language='de';h.window.emit('boopland:languagechange');
  assert.equal(h.model.score,120);assert.equal(JSON.stringify(h.model.chain),chain);assert.equal(h.model.elapsed,elapsed);
  h.key('KeyP');h.nodes.start.textContent='Losspielen';h.window.emit('pageshow');
  assert.equal(h.nodes.start.textContent,'Weiterspielen →');assert.equal(h.model.phase,'paused');
});
test('hidden pages stop animation and do not advance time; denied storage stays playable',()=>{
  const h=harness(true);h.nodes.start.emit('click');h.pump(30);h.document.hidden=true;h.document.emit('visibilitychange');
  const elapsed=h.model.elapsed;assert.equal(h.callbacks.size,0);h.pump(600);assert.equal(h.model.elapsed,elapsed);
  h.document.hidden=false;h.document.emit('visibilitychange');h.pump();assert.equal(h.model.phase,'paused');
  h.nodes.start.emit('click');h.pump(2);assert.ok(h.model.elapsed-elapsed<.04);
  h.model.score=1000;assert.doesNotThrow(()=>h.pump());assert.equal(h.nodes.best.textContent,'1000');
});
