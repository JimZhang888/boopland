// Drive the actual UI script with a deterministic animation clock. No game-state test hooks.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const E=require('./engine.js');
function app(storageBlocked=false){
  let now=0,nextId=0;const frames=new Map(),storage=new Map(),events={},elements=new Map();
  const context2d=new Proxy({}, {get(target,key){return target[key]??(()=>{});},set(target,key,value){target[key]=value;return true;}});
  function element(id){
    if(!elements.has(id))elements.set(id,{id,textContent:'',hidden:false,disabled:false,open:false,listeners:{},attributes:{},
      addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(name,value){this.attributes[name]=value;},
      getBoundingClientRect(){return {width:800,height:550};},getContext(){return context2d;},focus(){},closest(){return null;},showModal(){this.open=true;}});
    return elements.get(id);
  }
  const document={hidden:false,getElementById:element,addEventListener(type,fn){events[type]=fn;}};
  let catalogue;
  const env={document,PaperStack:E,console,Math,devicePixelRatio:1,performance:{now:()=>now},matchMedia:()=>({matches:false}),
    ResizeObserver:class{observe(){}},requestAnimationFrame(fn){frames.set(++nextId,fn);return nextId;},cancelAnimationFrame(id){frames.delete(id);},
    localStorage:{getItem(key){if(storageBlocked)throw Error('blocked');return storage.get(key)??null;},setItem(key,value){if(storageBlocked)throw Error('blocked');storage.set(key,value);}},
    addEventListener(type,fn){events[type]=fn;},BooplandI18n:{register(scope,messages){catalogue=messages;},t(key,values={}){return catalogue['zh-CN'][key.split('.')[1]].replace(/\{(\w+)\}/g,(_,name)=>values[name]);}}
  };
  env.window=env;vm.createContext(env);
  for(const file of ['translations.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),env);
  return {element,storage,events,document,click(id){element(id).listeners.click();},
    key(code,repeat=false){events.keydown({code,repeat,target:element('game'),preventDefault(){}});},
    step(count){for(let i=0;i<count;i++){now+=1000/60;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}}};
}
test('real UI loop: perfect placement, repeat guard, pause, backgrounding, failure and restart',()=>{
  const a=app();a.click('action');a.step(117);a.key('Space',true);assert.equal(a.element('height').textContent,'00');
  a.key('Space');assert.equal(a.element('height').textContent,'01');assert.equal(a.element('feedback').textContent,'完美叠放！');
  assert.equal(a.storage.get('boopland-stack-best'),'1');
  a.click('pause');assert.equal(a.element('action-label').textContent,'继续叠高');a.step(120);a.key('Space');
  assert.equal(a.element('height').textContent,'01'); // Resume consumes the input without dropping.
  a.step(16);a.document.hidden=true;a.events.visibilitychange();assert.equal(a.element('action-label').textContent,'继续叠高');
  a.document.hidden=false;a.events.visibilitychange();a.events['boopland:languagechange']();assert.equal(a.element('height').textContent,'01');
  a.click('action');a.key('Space');a.step(50);assert.equal(a.element('overlay').hidden,false);assert.equal(a.element('result-height').textContent,1);
  assert.equal(a.element('action-label').textContent,'再叠一次');a.click('action');assert.equal(a.element('height').textContent,'00');assert.equal(a.element('best').textContent,'01');
});
test('play and scoring still work when browser storage is unavailable',()=>{
  const a=app(true);a.click('action');a.step(117);a.key('Space');assert.equal(a.element('height').textContent,'01');assert.equal(a.element('best').textContent,'01');
});
