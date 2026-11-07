// Exercise the actual input handlers and animation loop without production debug hooks.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('./engine.js');

function app() {
  let game, time = 0, nextId = 0, catalogue;
  const frames = new Map(), elements = new Map(), windowEvents = {}, documentEvents = {};
  const drawing = new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => (target[key] = value, true) });
  function element(id = '') {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set(), captures = new Set();
    const el = {
      id, tagName: 'DIV', textContent: '', children: [], dataset: {}, attributes: {}, listeners: {},
      hidden: false, open: false, width: 624, height: 624,
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name),
        toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); }
      },
      style: { setProperty(name, value) { this[name] = value; } },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      toggleAttribute(name, value) { this[name] = value; },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      focus() { document.activeElement = this; },
      showModal() { this.open = true; },
      close() { this.open = false; this.listeners.close?.(); },
      getContext() { return drawing; },
      getBoundingClientRect() { return id === 'joystick' ? { left: 0, top: 0, width: 132, height: 132 } : { width: 624, height: 624 }; },
      setPointerCapture(pointerId) { captures.add(pointerId); },
      hasPointerCapture(pointerId) { return captures.has(pointerId); },
      releasePointerCapture(pointerId) { captures.delete(pointerId); this.listeners.lostpointercapture?.({pointerId}); }
    };
    if (id) elements.set(id, el);
    return el;
  }
  const document = {
    hidden: false, activeElement: null, hasFocus: () => true,
    getElementById: element, querySelector: element,
    querySelectorAll: () => [...elements.values()].filter(el => el.classList.contains('active')),
    createElement: tag => Object.assign(element(), {tagName: tag.toUpperCase()}),
    createTextNode: textContent => ({textContent}),
    addEventListener(type, fn) { documentEvents[type] = fn; }
  };
  const env = {
    document, console, Math, devicePixelRatio: 1,
    SteelTide: {...engine, Game: class extends engine.Game { constructor() { super(() => .4); game = this; } }},
    addEventListener(type, fn) { windowEvents[type] = fn; },
    matchMedia: () => ({matches: false}), ResizeObserver: class { observe() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    requestAnimationFrame(fn) { frames.set(++nextId, fn); return nextId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    BooplandI18n: {
      register(scope, data) { catalogue = data; },
      t(key, values = {}) { return catalogue['zh-CN'][key.split('.')[1]].replace(/\{(\w+)\}/g, (_, name) => values[name]); }
    }
  };
  env.window = env; vm.createContext(env);
  for (const file of ['locales.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), env);
  const api = {
    game, element, document,
    click(id) { element(id).listeners.click({detail: 0}); },
    key(type, code, extra = {}) { windowEvents[type]({code, preventDefault() {}, ...extra}); },
    pointer(type, id, pointerId, x = 66, y = 66) {
      element(id).listeners[type]({pointerId, button: 0, clientX: x, clientY: y, preventDefault() {}});
    },
    event(type) { (windowEvents[type] || documentEvents[type])(); },
    step(count = 30) {
      for (let n = 0; n < count; n++) {
        time += 1000 / 60;
        const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(time));
      }
    }
  };
  api.click('primary'); game.spawnTimer = 1000; game.grid.forEach(row => row.fill(0));
  game.player.x = 240; game.player.y = 240;
  return api;
}

test('keyboard mappings and taps between animation frames retain half-cell movement', () => {
  for (const [code, dx, dy] of [['ArrowUp',0,-1],['KeyW',0,-1],['ArrowRight',1,0],['KeyD',1,0],
    ['ArrowDown',0,1],['KeyS',0,1],['ArrowLeft',-1,0],['KeyA',-1,0]]) {
    const a = app(); a.key('keydown',code); a.key('keyup',code); a.step();
    assert.equal(a.game.player.x,240 + dx * 24,code); assert.equal(a.game.player.y,240 + dy * 24,code);
  }
  for (const code of ['Space','KeyJ']) {
    const a = app(); a.key('keydown',code); a.step(2); a.key('keyup',code); assert.equal(a.game.bullets.length,1,code);
  }
  for (const code of ['KeyP','Escape']) {
    const a = app(); a.key('keydown',code); assert.equal(a.game.status,'paused');
    a.key('keydown',code,{repeat:true}); assert.equal(a.game.status,'paused');
    a.key('keydown',code); assert.equal(a.game.status,'playing');
  }
});

test('joystick taps move one half-cell in each direction and release centers the handle', () => {
  for (const [x,y,dx,dy] of [[66,10,0,-1],[120,66,1,0],[66,120,0,1],[10,66,-1,0]]) {
    const a = app(); a.pointer('pointerdown','joystick',1,x,y); a.pointer('pointerup','joystick',1,x,y); a.step();
    assert.equal(a.game.player.x,240 + dx * 24); assert.equal(a.game.player.y,240 + dy * 24);
    assert.equal(a.element('joystick').style['--stick-x'],'0px');
    assert.equal(a.element('joystick').style['--stick-y'],'0px');
    assert.equal(a.element('joystick').classList.contains('active'),false);
    assert.equal(a.element('joystick').hasPointerCapture(1),false);
  }
});

test('joystick dead zone, diagonal hysteresis, dragging turns and pointer ownership', () => {
  const a = app(); a.pointer('pointerdown','joystick',1); a.step(5);
  a.pointer('pointermove','joystick',1,70,68); a.step(5); assert.equal(a.game.player.x,240); assert.equal(a.game.player.y,240);
  a.pointer('pointermove','joystick',1,120,66); a.step(3);
  a.pointer('pointerdown','joystick',2,10,66); a.pointer('pointermove','joystick',2,10,66);
  a.pointer('pointerup','joystick',2); assert.equal(a.element('joystick').dataset.direction,'1');
  a.pointer('pointermove','joystick',1,105,24); assert.equal(a.element('joystick').dataset.direction,'1');
  a.pointer('pointermove','joystick',1,66,10); assert.equal(a.element('joystick').dataset.direction,'0');
  a.pointer('pointerup','joystick',1); a.step();
  assert.equal(a.game.player.x,264); assert.equal(a.game.player.y,216);
});

test('joystick movement and fire work with separate fingers and release independently', () => {
  const a = app(); a.pointer('pointerdown','joystick',1,120,66);
  a.pointer('pointerdown','fire-button',2); a.step(2);
  assert.ok(a.game.player.x > 240); assert.equal(a.game.bullets.length,1);
  a.pointer('pointerup','joystick',1); a.step(); assert.equal(a.game.player.x,264);
  assert.equal(a.element('fire-button').classList.contains('active'),true);
  a.game.bullets = []; a.game.player.cooldown = 0; a.step(1); assert.equal(a.game.bullets.length,1);
  a.pointer('pointerup','fire-button',2); a.game.bullets = []; a.game.player.cooldown = 0;
  a.step(2); assert.equal(a.game.bullets.length,0);
});

test('returning to the dead zone or cancelling capture ends movement at the current half-cell', () => {
  for (const release of ['center','pointercancel','lostpointercapture']) {
    const a = app(); a.pointer('pointerdown','joystick',1,120,66); a.step(3);
    if (release === 'center') a.pointer('pointermove','joystick',1);
    else a.pointer(release,'joystick',1);
    a.step(); assert.equal(a.game.player.x,264); assert.equal(a.game.player.moveTarget,null);
    a.step(); assert.equal(a.game.player.x,264);
  }
});

test('pause and window blur reset joystick and fire without stuck movement on resume', () => {
  for (const pause of ['button','blur','visibility']) {
    const a = app(); a.pointer('pointerdown','joystick',1,120,66); a.pointer('pointerdown','fire-button',2); a.step(3);
    if (pause === 'button') a.click('pause');
    else if (pause === 'blur') a.event('blur');
    else { a.document.hidden = true; a.event('visibilitychange'); }
    const x = a.game.player.x; a.step(); assert.equal(a.game.player.x,x); assert.equal(a.game.status,'paused');
    assert.equal(a.element('joystick').style['--stick-x'],'0px');
    if (pause === 'visibility') { a.document.hidden = false; a.event('visibilitychange'); }
    a.game.bullets = []; a.game.player.cooldown = 0; a.click('primary'); a.step();
    assert.equal(a.game.player.x,264); assert.equal(a.game.player.moveTarget,null); assert.equal(a.game.bullets.length,0);
    a.pointer('pointermove','joystick',1,10,66); a.step(); assert.equal(a.game.player.x,264);
  }
});
