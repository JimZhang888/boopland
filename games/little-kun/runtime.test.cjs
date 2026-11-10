// Integration tests run the shipped controller with a small DOM/event adapter.
// No browser package or runtime dependency is needed by the game.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const Engine = require('./engine.js');
const messages = require('./translations.js');

function boot(saved = null, blocked = false) {
  let engine, scene, clock = 0, serial = 0;
  const callbacks = new Map(), nodes = new Map(), storage = new Map(saved ? [['boopland-little-kun-v1', saved]] : []);
  class Element {
    constructor(id = '') { this.id = id; this.style = {}; this.children = []; this.hidden = false; this.disabled = false; this.attrs = {}; this.handlers = {}; this.parts = {}; this.tagName = 'BUTTON'; this.classList = { toggle() {} }; }
    addEventListener(type, fn) { (this.handlers[type] ||= []).push(fn); }
    fire(type, props = {}) { const e = { target: this, preventDefault() {}, ...props }; for (const fn of this.handlers[type] || []) fn(e); }
    append(child) { this.children.push(child); }
    setAttribute(key, value) { this.attrs[key] = value; }
    querySelector(selector) { return this.parts[selector] ||= new Element(selector); }
    focus() { document.activeElement = this; }
    setPointerCapture() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 700 }; }
    showModal() { this.open = true; }
    close() { this.open = false; this.fire('close'); }
  }
  const document = new Element(); document.body = new Element(); document.hidden = false;
  document.getElementById = id => { if (!nodes.has(id)) nodes.set(id, new Element(id)); return nodes.get(id); };
  document.createElement = () => new Element();
  document.getElementById('sea').tagName = 'CANVAS';
  const window = new Element();
  window.LittleKun = class extends Engine { constructor() { super(() => .33); engine = this; } };
  window.KunScene = class { constructor() { scene = this; this.particles = []; this.rings = []; this.draws = 0; } resize() {} draw() { this.draws++; } effect() {} updateCamera() {} worldAt(x, y) { return { x: engine.player.x + x - 450, y: engine.player.y + y - 350 }; } };
  window.BooplandI18n = { language: 'en', t(key, values = {}) { return messages[this.language][key.split('.')[1]].replace(/\{(\w+)\}/g, (s,k) => values[k] ?? s); } };
  const context = { window, document, matchMedia: () => ({ matches: false }), localStorage: { getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key) || null; }, setItem(key, val) { if (blocked) throw Error('blocked'); storage.set(key, val); } },
    requestAnimationFrame(fn) { callbacks.set(++serial, fn); return serial; }, cancelAnimationFrame(id) { callbacks.delete(id); }, ResizeObserver: class { observe() {} }, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'), context);
  const $ = id => document.getElementById(id);
  function frames(n) { for (let i = 0; i < n; i++) { clock += 1000 / 60; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(clock)); } }
  return { $, window, document, engine, scene, storage, frames, callbacks };
}

test('start focuses the canvas; keyboard, dash, pause and resume operate together', () => {
  const b = boot(); b.$('start').fire('click'); b.engine.fish = []; b.engine.populate = () => {};
  assert.equal(b.document.activeElement, b.$('sea')); assert.equal(b.engine.status, 'playing');
  b.window.fire('keydown', { code: 'KeyD', target: b.$('sea') }); b.frames(20); assert.ok(b.engine.player.vx > 195);
  b.window.fire('keydown', { code: 'Space', target: b.$('sea') }); assert.equal(b.engine.dash, .3);
  b.window.fire('keyup', { code: 'KeyD' }); b.window.fire('keydown', { code: 'KeyP' }); assert.equal(b.engine.status, 'paused'); assert.equal(b.callbacks.size, 0);
  const x = b.engine.player.x; b.frames(120); assert.equal(b.engine.player.x, x);
  b.$('start').fire('click'); b.frames(60); assert.equal(b.engine.status, 'playing'); assert.ok(b.engine.player.vx < 1);
});
test('touch joystick ignores other fingers, handles cancellation and can dash simultaneously', () => {
  const b = boot(); b.$('start').fire('click'); b.engine.fish = []; b.engine.populate = () => {};
  const c = b.$('sea'); c.fire('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
  c.fire('pointermove', { pointerId: 1, pointerType: 'touch', clientX: 160, clientY: 100 });
  c.fire('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 50, clientY: 50 });
  b.frames(20); assert.ok(b.engine.player.vx > 195); assert.equal(b.$('joystick').hidden, false);
  b.$('ability').fire('click'); assert.equal(b.engine.dash, .3);
  c.fire('pointercancel', { pointerId: 1 }); assert.equal(b.$('joystick').hidden, true); b.frames(60); assert.ok(b.engine.player.vx < 1);
});
test('help freezes the game, focus loss clears input, and language changes preserve progress', () => {
  const b = boot(); b.$('start').fire('click'); b.engine.xp = 10; b.$('help').fire('click'); assert.equal(b.engine.status, 'paused'); assert.equal(b.$('help-dialog').open, true);
  b.frames(60); assert.equal(b.engine.time, 0); b.$('help-done').fire('click'); assert.equal(b.engine.status, 'playing');
  b.window.BooplandI18n.language = 'zh-CN'; b.window.fire('boopland:languagechange'); assert.equal(b.engine.xp, 10); assert.equal(b.$('form-name').textContent, '豆丁鱼');
  b.window.fire('keydown', { code: 'KeyD' }); b.window.fire('blur'); assert.equal(b.engine.status, 'paused'); b.$('start').fire('click'); b.frames(15); assert.equal(b.engine.player.vx, 0);
});
test('win UI, Kun ability, loss, restart and best-record persistence', () => {
  const b = boot(); b.$('start').fire('click');
  while (!b.engine.won) b.engine.eat({ radius: 20, x: b.engine.player.x, y: b.engine.player.y });
  b.frames(1); assert.equal(b.engine.status, 'won'); assert.equal(b.$('start').textContent, 'Roam as Kun →'); assert.equal(b.$('result').hidden, false);
  assert.ok(JSON.parse(b.storage.get('boopland-little-kun-v1')).best > 0);
  b.$('start').fire('click'); b.frames(15); b.$('ability').fire('click'); assert.equal(b.engine.surge, 1); assert.equal(b.$('ability-name').textContent, 'Ocean breath');
  b.window.fire('keydown', { code: 'KeyP' }); b.$('restart').fire('click'); assert.equal(b.engine.won, false); assert.equal(b.engine.score, 0);
  b.engine.health = 0; b.engine.status = 'over'; b.engine.events.push({ type: 'over' }); b.frames(1); assert.equal(b.$('start').textContent, 'Swim again →'); b.$('start').fire('click'); assert.equal(b.engine.health, 4);
  const reload = boot(b.storage.get('boopland-little-kun-v1')); assert.ok(Number(reload.$('best').textContent.replaceAll(',', '')) > 0);
});
test('blocked storage and damaged saves still allow play', () => {
  for (const b of [boot('{broken'), boot(null, true)]) { b.$('start').fire('click'); b.frames(2); assert.equal(b.engine.status, 'playing'); }
});
test('renderer accepts every evolution, resize and full effect lifetimes', () => {
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get(target, prop) { if (prop === 'createLinearGradient') return () => gradient; if (prop === 'createPattern') return () => ({}); if (prop === 'arc') return (x,y,r) => assert.ok(Number.isFinite(r) && r >= 0); return target[prop] || (() => {}); }, set(target, prop, value) { target[prop] = value; return true; } });
  const canvas = { width: 0, height: 0, getContext: () => ctx, getBoundingClientRect: () => ({width:900,height:600}) };
  const window = { devicePixelRatio: 2, LittleKun: Engine };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'scene.js'), 'utf8'), { window, document: { createElement: () => canvas }, matchMedia: () => ({matches:false}), Math });
  const game = new Engine(() => .4), scene = new window.KunScene(canvas, game); scene.resize();
  for (let stage = 0; stage < 6; stage++) { game.stage = stage; game.won = stage === 5; game.player.radius = Engine.STAGES[stage].radius; scene.draw(1 / 60); }
  for (const type of ['eat','evolve','surge','hit','pearl']) scene.effect({type,x:2400,y:1800}, '+20');
  for (let i = 0; i < 100; i++) scene.draw(1 / 60);
  assert.equal(scene.rings.length, 0); assert.equal(scene.particles.length, 0);
});
