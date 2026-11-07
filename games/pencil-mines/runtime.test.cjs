/* Controller tests use a small DOM/clock double; no browser or package installation. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Game, LEVELS } = require('./engine.js');

function harness(blockStorage = false) {
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }
    emit(type, data = {}) {
      const event = { target: this, preventDefault() {}, ...data };
      for (const listener of this.listeners.get(type) || []) listener(event);
    }
  }
  let doc;
  class Element extends Target {
    constructor(id = '') {
      super();
      this.id = id; this.children = []; this.dataset = {}; this.attributes = {};
      this.className = ''; this.textContent = ''; this.innerHTML = '';
      this.hidden = false; this.open = false; this.clientWidth = 400; this.clientHeight = 400;
      this.style = { setProperty() {} };
      this.classList = { toggle: (name, active) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        if (active) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
      } };
    }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key]; }
    append(element) { this.children.push(element); }
    replaceChildren() { this.children = []; }
    closest(selector) { return selector === '.cell' && this.className.split(' ').includes('cell') ? this : null; }
    focus() { doc.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; this.emit('close'); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, new Element(id)]));
  const levels = Object.keys(LEVELS).map(level => { const e = new Element(); e.dataset.level = level; return e; });
  doc = new Target(); doc.hidden = false;
  doc.getElementById = id => { assert.ok(nodes[id], id); return nodes[id]; };
  doc.createElement = () => new Element();
  doc.querySelectorAll = selector => selector === 'dialog' ? ['help-dialog', 'restart-dialog', 'result-dialog'].map(id => nodes[id]) : selector === '[data-level]' ? levels : [];
  const win = new Target(), stored = new Map(), timers = new Map();
  let now = 0, nextTimer = 1, language = 'zh-CN', dictionaries;
  const schedule = (callback, delay, repeat = false) => { const id = nextTimer++; timers.set(id, { callback, at: now + delay, delay, repeat }); return id; };
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const due = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, timer] = due;
      now = timer.at;
      if (timer.repeat) timer.at += timer.delay; else timers.delete(id);
      timer.callback();
    }
    now = end;
  }
  let seed = 14;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const context = vm.createContext({
    document: doc, window: win, PencilMines: { Game: class extends Game { constructor() { super('easy', random); } } },
    performance: { now: () => now },
    setTimeout: (fn, ms) => schedule(fn, ms), clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => schedule(fn, ms, true), clearInterval: id => timers.delete(id),
    requestAnimationFrame: fn => fn(), ResizeObserver: class { observe() {} },
    getComputedStyle: () => ({ paddingLeft: '0', paddingRight: '0', paddingTop: '0', paddingBottom: '0' }),
    localStorage: {
      getItem(key) { if (blockStorage) throw new Error('Storage blocked'); return stored.get(key) ?? null; },
      setItem(key, value) { if (blockStorage) throw new Error('Storage blocked'); stored.set(key, String(value)); }
    },
    BooplandI18n: {
      register(scope, data) { dictionaries = data; },
      t(key, values = {}) { return dictionaries[language][key.split('.').at(-1)].replace(/\{(\w+)\}/g, (_, field) => String(values[field])); }
    }
  });
  for (const file of ['translations.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context);
  const cell = index => nodes.board.children[index];
  const click = (index, detail = 1) => nodes.board.emit('click', { target: cell(index), detail });
  const pointer = (index, extra = {}) => nodes.board.emit('pointerdown', { target: cell(index), pointerType: 'touch', button: 0, isPrimary: true, pointerId: 1, clientX: 50, clientY: 50, ...extra });
  return { nodes, doc, win, levels, stored, advance, cell, click, pointer, language(next) { language = next; win.emit('boopland:languagechange'); } };
}

test('clock starts only on first reveal; manual pause, dialogs, and hidden tabs exclude elapsed time', () => {
  const h = harness();
  h.advance(5000);
  assert.equal(h.nodes.time.textContent, '00:00');
  h.click(27); h.advance(2250);
  assert.equal(h.nodes.time.textContent, '00:02');
  h.nodes.pause.emit('click'); h.advance(8000);
  assert.equal(h.nodes.time.textContent, '00:02');
  const progress = h.nodes.progress.textContent;
  h.click(0);
  assert.equal(h.nodes.progress.textContent, progress);
  h.nodes.resume.emit('click'); h.advance(1000);
  assert.equal(h.nodes.time.textContent, '00:03');
  h.nodes.help.emit('click'); h.advance(10000);
  assert.equal(h.nodes.time.textContent, '00:03');
  h.nodes['help-done'].emit('click'); h.advance(1000);
  assert.equal(h.nodes.time.textContent, '00:04');
  h.doc.hidden = true; h.doc.emit('visibilitychange'); h.advance(12000);
  h.doc.hidden = false; h.doc.emit('visibilitychange'); h.advance(1000);
  assert.equal(h.nodes.time.textContent, '00:04');
  assert.equal(h.nodes['pause-cover'].hidden, false);
  h.nodes.resume.emit('click'); h.advance(1000);
  assert.equal(h.nodes.time.textContent, '00:05');
});

test('touch long press flags once, suppresses contextmenu and synthetic click, and does not start the clock', () => {
  const h = harness();
  h.pointer(0); h.advance(421);
  assert.match(h.cell(0).className, /is-flagged/);
  h.nodes.board.emit('contextmenu', { target: h.cell(0) });
  h.win.emit('pointerup', { pointerId: 1 });
  h.click(0);
  assert.match(h.cell(0).className, /is-flagged/);
  assert.equal(h.nodes.flags.textContent, '09');
  assert.equal(h.nodes.progress.textContent, '0 / 54');
  h.advance(2000);
  assert.equal(h.nodes.time.textContent, '00:00');
  h.nodes['flag-mode'].emit('click'); h.click(0);
  assert.doesNotMatch(h.cell(0).className, /is-flagged/);
  assert.equal(h.nodes.flags.textContent, '10');
});

test('moving or cancelling a touch prevents long-press flags and stale actions after a restart', () => {
  const h = harness();
  h.pointer(0); h.advance(100);
  h.win.emit('pointermove', { pointerId: 1, clientX: 90, clientY: 50 });
  h.advance(500); h.win.emit('pointerup', { pointerId: 1 }); h.click(0);
  assert.equal(h.nodes.progress.textContent, '0 / 54');
  assert.equal(h.nodes.flags.textContent, '10');
  h.pointer(1); h.win.emit('pointercancel', { pointerId: 1 }); h.advance(500);
  assert.equal(h.nodes.flags.textContent, '10');
  h.pointer(2); h.nodes.restart.emit('click'); h.advance(500);
  assert.equal(h.nodes.flags.textContent, '10');
  assert.equal(h.nodes.progress.textContent, '0 / 54');
});

test('changing difficulty requires confirmation during play; cancellation and language updates preserve progress', () => {
  const h = harness(true);
  h.click(27); h.advance(1000);
  const progress = h.nodes.progress.textContent;
  h.levels[2].emit('click');
  assert.equal(h.nodes['restart-dialog'].open, true);
  assert.equal(h.nodes.board.children.length, 64);
  h.nodes['cancel-restart'].emit('click');
  assert.equal(h.nodes.progress.textContent, progress);
  h.language('en');
  assert.equal(h.nodes.progress.textContent, progress);
  assert.match(h.cell(27).getAttribute('aria-label'), /Row 4, column 4/);
  h.levels[2].emit('click'); h.nodes['confirm-restart'].emit('click');
  assert.equal(h.nodes.board.children.length, 144);
  assert.equal(h.nodes.progress.textContent, '0 / 116');
  assert.equal(h.nodes.flags.textContent, '28');
  assert.equal(h.nodes.time.textContent, '00:00');
  assert.equal(h.nodes['restart-dialog'].open, false);
});
