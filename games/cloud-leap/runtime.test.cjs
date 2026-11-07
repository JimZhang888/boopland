// Exercise real event handlers, animation and Canvas transforms without production test hooks.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const physics = require('./physics.js');

function app(width = 1100, height = 534, dpr = 1) {
  let now = 0, nextFrame, transform = [1, 1, 0, 0], shape;
  const stack = [], shapes = [], elements = new Map(), events = {};
  const context = new Proxy({
    save(){stack.push([...transform]);}, restore(){transform = stack.pop();},
    setTransform(a,b,c,d,e,f){transform = [a,d,e,f];},
    translate(x,y){transform[2] += x*transform[0]; transform[3] += y*transform[1];},
    scale(x,y){transform[0] *= x; transform[1] *= y;},
    clearRect(){shapes.length=0;}, beginPath(){shape=null;},
    ellipse(x,y,rx,ry){shape={x:x*transform[0]+transform[2], y:y*transform[1]+transform[3], rx:Math.abs(rx*transform[0]), ry:Math.abs(ry*transform[1])};},
    fill(){if(shape)shapes.push({...shape,color:this.fillStyle});},
    stroke(){if(shape)shapes.push({...shape,color:this.strokeStyle,stroke:true});},
    createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};}
  }, {get:(obj,key)=>obj[key]??(()=>{})});
  class Element {
    constructor(){this.style={};this.listeners={};this.attributes={};this.hidden=false;this.disabled=false;this.classList={add(){},remove(){},toggle(){}};}
    addEventListener(name,fn){this.listeners[name]=fn;}
    setAttribute(key,value){this.attributes[key]=value;}
    getBoundingClientRect(){return {width,height};}
    getContext(){return context;}
    focus(){document.activeElement=this;}
    setPointerCapture(){}
    replaceChildren(){} append(){}
  }
  const element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const document={hidden:false,body:element('body'),activeElement:null,getElementById:element,querySelector:element,
    createElement:()=>new Element(),createTextNode:value=>value,addEventListener(name,fn){events[name]=fn;}};
  document.activeElement=document.body;
  const env={document,devicePixelRatio:dpr,performance:{now:()=>now},matchMedia:()=>({matches:true}),HTMLElement:Element,
    ResizeObserver:class{observe(){}},requestAnimationFrame(fn){nextFrame=fn;},
    localStorage:{getItem(){return null;},setItem(){}},addEventListener(name,fn){events[name]=fn;},
    BooplandI18n:{t:key=>key},CloudLeapPhysics:physics};
  env.window=env;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'game.js'),'utf8'),env);
  function advance(ms,frameMs=1000/60){const end=now+ms;while(now<end){now=Math.min(end,now+frameMs);nextFrame(now);}}
  function pointer(type){element('jump').listeners[type]({button:0,pointerId:1,preventDefault(){}});}
  const range=()=>{const style=element('power-zone').style,min=parseFloat(style.left)/100;return {min,max:min+parseFloat(style.width)/100};};
  return {element,events,shapes,advance,pointer,range,
    elapse(ms){now+=ms;},
    key(type){events[type]({code:'Space',preventDefault(){}});},
    click(id){element(id).listeners.click();},
    jump(power,frameMs,releaseDelay=0){pointer('pointerdown');advance(power*1200,frameMs);now+=releaseDelay;pointer('pointerup');advance(2600,frameMs);}};
}

test('real loop lands at both indicated edges repeatedly, including direction changes and low frame rates',()=>{
  for(const frameMs of [1000/60,1000/20]) for(const releasePhase of [0,.85]){
    const a=app();
    for(let i=0;i<12;i++){
      const {min,max}=a.range();a.jump(i%2?max-1e-6:min+1e-6,frameMs,frameMs*releasePhase);
      assert.equal(a.element('score').textContent,i+1);
      assert.equal(a.element('overlay').hidden,true);
      assert.equal(a.element('jump').disabled,false);
    }
  }
});
test('visible misses stay misses when released between frames',()=>{
  for(const side of ['min','max']){
    const a=app(),range=a.range();
    a.pointer('pointerdown');a.advance((range[side]+(side==='min'?-.001:.001))*1200);
    assert.ok(a.shapes.some(s=>s.stroke&&s.color==='#a76c54'),'outside rim is marked as a miss');
    a.elapse(49);a.pointer('pointerup');a.advance(2600);
    assert.equal(a.element('score').textContent,'0');
    assert.equal(a.element('overlay').hidden,false,'miss must not snap onto the island');
  }
});
test('releasing between frames keeps the last visible landing point and charge',()=>{
  for(const delay of [8,16,49,120]) for(const input of ['pointer','keyboard']){
    const a=app();
    const {max}=a.range();
    if(input==='pointer')a.pointer('pointerdown');else a.key('keydown');
    a.advance((max-.0001)*1200,50);
    const displayed=a.element('power-fill').style.width;
    const guide=a.shapes.find(s=>s.stroke&&s.color==='#526d47');
    assert.ok(guide,'last visible guide is on the island');
    a.elapse(delay);
    if(input==='pointer')a.pointer('pointerup');else a.key('keyup');
    assert.equal(a.element('power-fill').style.width,displayed,'release must not add unseen charge');
    a.advance(100);
    const destination=a.shapes.find(s=>s.stroke&&s.color==='#526d47');
    assert.ok(destination,'the committed destination stays visible in flight');
    assert.ok(Math.hypot(destination.x-guide.x,destination.y-guide.y)<1e-8,'destination must not move after release');
    a.advance(2500);
    assert.equal(a.element('score').textContent,1,'a visibly safe edge must land safely');
    assert.equal(a.element('overlay').hidden,true);
  }
});
test('full charge keeps the soles anchored on the same island at all tested scales and pixel ratios',()=>{
  for(const [width,height,dpr] of [[1100,534,1],[294,390,2],[540,190,2]]){
    const a=app(width,height,dpr);a.advance(16);
    const shoes=()=>a.shapes.filter(s=>['#985e4f','#aa6754'].includes(s.color));
    const before=shoes();assert.equal(before.length,2);
    a.pointer('pointerdown');a.advance(1200);
    const after=shoes();
    for(let i=0;i<2;i++)assert.ok(Math.abs((before[i].y+before[i].ry)-(after[i].y+after[i].ry))<.2,'sole shifted below island');
    assert.ok(a.shapes.some(s=>s.stroke&&s.color==='#a76c54'),'predicted miss is marked');
  }
});
test('keyboard centre hits, pause, return to same island, overshoot and restart work',()=>{
  const a=app();a.jump(0);assert.equal(a.element('score').textContent,'0');
  const {min,max}=a.range();a.key('keydown');a.advance((min+max)*600);a.key('keyup');
  a.advance(100);a.click('pause');a.advance(3000);assert.equal(a.element('score').textContent,'0');
  a.click('modal-action');a.advance(2600);assert.equal(a.element('score').textContent,2);
  a.jump(1);assert.equal(a.element('overlay').hidden,false);
  a.click('modal-action');assert.equal(a.element('overlay').hidden,true);assert.equal(a.element('score').textContent,'0');
});
