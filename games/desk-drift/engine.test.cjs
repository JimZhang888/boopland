const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');

function drive({ dt = 1 / 120, digital = false, delay = 0 } = {}) {
  const run = E.makeRun();
  for (let i = 0; i < 90 / dt && !run.finished; i++) {
    const target = E.at(run.progress + 40);
    const error = E.angleDiff(Math.atan2(target.y - run.car.y, target.x - run.car.x), run.car.angle);
    E.step(run, { steer: run.time < delay ? 0 : digital ? Math.abs(error) > .06 ? Math.sign(error) : 0 : E.clamp(error * 2, -1, 1), drift: Math.abs(error) > .65 }, dt);
  }
  return run;
}

test('a complete driven lap takes about 20–30 seconds with all ordered sectors', () => {
  const run = drive();
  assert.ok(run.finished); assert.ok(run.time >= 20 && run.time <= 30);
  assert.equal(run.hits, 0); assert.equal(run.splits.length, 3);
  assert.ok(run.splits[0] > 5 && run.splits[1] > run.splits[0]);
  assert.equal(run.splits[2], run.time); assert.equal(run.progress, E.length);
  assert.ok(E.validRecord(E.recordOf(run)));
});

test('digital steering works at 60, 120 and 144 Hz without material timing drift', () => {
  const times = [60, 120, 144].map(hz => {
    const r = drive({ dt: 1 / hz, digital: true });
    assert.ok(r.finished); assert.equal(r.hits, 0); assert.ok(E.validRecord(E.recordOf(r))); return r.time;
  });
  assert.ok(Math.max(...times) - Math.min(...times) < .08);
});

test('drifting trades speed and lateral grip for a tighter turn', () => {
  const grip = E.makeRun(), drift = E.makeRun();
  for (let i = 0; i < 30; i++) {
    E.step(grip, { steer: -.55, drift: false }, 1 / 120);
    E.step(drift, { steer: -.55, drift: true }, 1 / 120);
  }
  const lateral = car => Math.abs(-car.vx * Math.sin(car.angle) + car.vy * Math.cos(car.angle));
  assert.ok(drift.car.angle < grip.car.angle);
  assert.ok(lateral(drift.car) > lateral(grip.car));
  assert.ok(Math.hypot(drift.car.vx, drift.car.vy) < Math.hypot(grip.car.vx, grip.car.vy));
  assert.ok(drift.drift > 0); assert.equal(grip.drift, 0);
});

test('hitting the border slows the car, provides impact feedback and limits repeated bump counts', () => {
  const run = E.makeRun(), p = E.at(80), nx = -Math.sin(p.angle), ny = Math.cos(p.angle);
  Object.assign(run.car, { x: p.x + nx * 38, y: p.y + ny * 38, angle: p.angle + Math.PI / 2, vx: nx * 98, vy: ny * 98 });
  run.lastS = p.s; run.progress = p.s;
  E.step(run, { steer: 0 }, 1 / 120);
  assert.equal(run.hits, 1); assert.ok(run.impact); assert.ok(Math.hypot(run.car.vx, run.car.vy) < 90);
  for (let i = 0; i < 40; i++) E.step(run, { steer: 0 }, 1 / 120);
  assert.equal(run.hits, 1); assert.ok(E.nearest(run.car.x, run.car.y).distance < E.ROAD / 2 - E.RADIUS + .3);
});

test('eraser, ruler and pencil cup use their actual rotated or round boundaries', () => {
  for (const object of E.obstacles) {
    const angle = object.angle || 0, edge = (object.r || object.w / 2) + E.RADIUS;
    const at = d => ({ x: object.x + Math.cos(angle) * d, y: object.y + Math.sin(angle) * d });
    assert.ok(E.contact(at(edge - .1), object), object.kind);
    assert.equal(E.contact(at(edge + .1), object), null, object.kind);
    const inside = E.contact({ x: object.x, y: object.y }, object);
    assert.ok(Number.isFinite(inside.nx) && Number.isFinite(inside.depth));
  }
});

test('driving backwards across the finish cannot award a lap or a sector', () => {
  const run = E.makeRun(); run.car.angle += Math.PI; run.car.vx *= -1; run.car.vy *= -1;
  for (let i = 0; i < 100; i++) E.step(run, { steer: 0 }, 1 / 120);
  assert.ok(run.progress < 0); assert.equal(run.finished, false); assert.deepEqual(run.splits, []);
});

test('finished and expired runs cannot continue accumulating time or samples', () => {
  const run = drive(), snapshot = JSON.stringify(run);
  E.step(run, { steer: 1, drift: true }, 1 / 120); assert.equal(JSON.stringify(run), snapshot);
  const expired = E.makeRun(); expired.time = 180 - 1 / 120;
  E.step(expired, {}, 1 / 120); assert.ok(expired.expired);
  const time = expired.time; E.step(expired, {}, 1 / 120); assert.equal(expired.time, time);
});

test('ghost playback and progress deltas reproduce a full driven lap without affecting physics', () => {
  const record = E.recordOf(drive());
  assert.deepEqual(E.ghostAt(record, 0), { x: record.samples[0][1], y: record.samples[0][2], angle: record.samples[0][3] });
  for (const sample of record.samples.filter((_, i) => i % 37 === 0)) {
    const pose = E.ghostAt(record, sample[0]);
    assert.ok(Math.abs(pose.x - sample[1]) < 1e-7);
    assert.ok(Math.abs(E.timeAtProgress(record, sample[4]) - sample[0]) < .001);
  }
  assert.equal(E.ghostAt(record, record.time + .01), null);
  assert.ok(Math.abs(E.timeAtProgress(record, E.length) - record.time) < .001);
  assert.equal(E.timeAtProgress(null, 10), null);
  const wrap = { time: 1, samples: [[0, 0, 0, Math.PI - .1, 0], [1, 10, 10, -Math.PI + .1, 10]] };
  assert.ok(Math.abs(E.ghostAt(wrap, .5).angle - Math.PI) < .001);
});

test('corrupted, incompatible or nonfinite stored ghosts are rejected', () => {
  const good = E.recordOf(drive());
  for (const bad of [null, {}, { ...good, track: 'old-track' }, { ...good, time: Infinity }, { ...good, splits: [10, 5, good.time] }, { ...good, hits: -1 }, { ...good, drift: '4' }, { ...good, samples: [[0, 1, 1, 0, 0]] }]) assert.equal(E.validRecord(bad), false);
  const bad = JSON.parse(JSON.stringify(good)); bad.samples[2][0] = bad.samples[1][0]; assert.equal(E.validRecord(bad), false);
  assert.equal(E.validRecord(JSON.parse(JSON.stringify(good))), true);
});

test('all eight language dictionaries cover static and dynamic copy and match placeholders', () => {
  let dictionaries;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'translations.js'), 'utf8'), { window: { BooplandI18n: { register(scope, value) { assert.equal(scope, 'deskDrift'); dictionaries = value; } } } });
  assert.equal(Object.keys(dictionaries).length, 8);
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary), Object.keys(dictionaries.en), language);
    for (const [key, value] of Object.entries(dictionary)) { assert.ok(value.trim()); assert.deepEqual(placeholders(value), placeholders(dictionaries.en[key]), `${language}.${key}`); }
  }
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), script = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
  for (const key of [...html.matchAll(/data-i18n(?:-label)?="deskDrift\.([^"]+)"/g), ...script.matchAll(/\bt\('([^']+)'(?=[,)])/g)].map(m => m[1])) assert.ok(dictionaries.en[key], key);
});

test('the lobby entry is unique and every file URL resolves without modules or network dependencies', () => {
  const root = path.resolve(__dirname, '../..'), sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'gamelist.js'), 'utf8'), sandbox);
  const records = sandbox.window.GAME_LIST.filter(item => item.path === './games/desk-drift/index.html');
  assert.equal(records.length, 1); assert.equal(Object.keys(records[0].locales).length, 7); assert.ok(fs.existsSync(path.resolve(root, records[0].cover)));
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.ok(html.includes('href="../../games.html"')); assert.ok(!/type="module"|https?:\/\//.test(html));
  for (const [, resource] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname, resource)), resource);
});
