const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('./engine.js');
const run = (game, angle, power) => {
  assert.equal(game.launch(angle, power), true);
  for (let i = 0; i < 1300 && game.state === 'flying'; i++) game.step(E.STEP);
  return game;
};

test('all eight routes have attainable deliveries, including every required mechanism', () => {
  for (let index = 0; index < 8; index++) {
    let won;
    for (let angle = 5; angle <= 80 && !won; angle++) for (let power = 35; power <= 100 && !won; power++) {
      const g = run(new E.Game(index), angle, power);
      if (g.state === 'won') won = g;
    }
    assert.ok(won, `stop ${index + 1} must be solvable`);
    assert.equal(won.stars, 3);
    if (won.level.switch) assert.equal(won.switched, true);
    if (won.level.bounce) assert.ok(won.bounces >= 1);
  }
});
test('moving gates and mailboxes stay solvable at four different starting phases', () => {
  for (const index of [5, 6]) for (const phase of [0, .9, 1.8, 2.7]) {
    let won = false;
    for (let angle = 8; angle < 75 && !won; angle += 2) for (let power = 40; power <= 100 && !won; power++) {
      const g = new E.Game(index); g.time = phase;
      won = run(g, angle, power).state === 'won';
    }
    assert.ok(won, `stop ${index + 1}, phase ${phase}`);
  }
});
test('double launch, invalid input and paused launch do not consume parcels', () => {
  const g = new E.Game();
  assert.equal(g.launch(NaN, 70), false); assert.equal(g.launch(45, Infinity), false); assert.equal(g.launch(45, 0), false);
  g.paused = true; assert.equal(g.launch(42, 78), false); assert.equal(g.shots, 0);
  g.paused = false; assert.equal(g.launch(42, 78), true); assert.equal(g.launch(42, 78), false); assert.equal(g.shots, 1);
});
test('three misses end the stop and a restart restores it', () => {
  const g = new E.Game(7);
  for (let i = 0; i < 3; i++) { run(g, 80, 8); assert.equal(g.shots, i + 1); }
  assert.equal(g.state, 'lost'); assert.equal(g.launch(42, 78), false);
  g.reset(); assert.equal(g.shots, 0); assert.equal(g.state, 'ready'); assert.equal(g.index, 7); assert.equal(g.time, 0);
});
test('delivery stamps depend on attempts, including second and third throw', () => {
  for (let misses = 0; misses < 3; misses++) {
    const g = new E.Game(); for (let i = 0; i < misses; i++) run(g, 80, 8);
    run(g, 42, 78); assert.equal(g.state, 'won'); assert.equal(g.stars, 3 - misses);
    const time = g.time; g.advance(1); assert.equal(g.time, time);
  }
});
test('pause freezes the parcel and mechanics; fixed steps are independent of frame rate', () => {
  const a = new E.Game(5), b = new E.Game(5); a.launch(45,76); b.launch(45,76);
  for (let i = 0; i < 30; i++) a.advance(1/60);
  for (let i = 0; i < 60; i++) b.advance(1/120);
  assert.ok(Math.abs(a.ball.x - b.ball.x) < .001); assert.ok(Math.abs(a.ball.y - b.ball.y) < .001);
  a.paused = true; const before = JSON.stringify(a); a.advance(5); assert.equal(JSON.stringify(a), before);
  a.paused = false; a.advance(10); assert.ok(a.time <= b.time + .101, 'long stalls must be bounded');
});
test('wind changes horizontal speed in the stated direction', () => {
  const tail = new E.Game(2), head = new E.Game(3); tail.launch(45,70); head.launch(45,70);
  for(let i=0;i<30;i++){ tail.step(E.STEP); head.step(E.STEP); }
  assert.ok(tail.ball.vx > head.ball.vx); assert.ok(tail.ball.x > head.ball.x);
});
test('switches open gates and reset after a miss; unmet goals reject delivery', () => {
  const g = new E.Game(4); g.launch(30,78);
  for(let i=0;i<600 && !g.switched && g.state==='flying';i++)g.step(E.STEP);
  assert.equal(g.switched, true); assert.ok(g.drainEvents().includes('switch'));
  g.miss(); assert.equal(g.switched, false); assert.equal(g.eligible(), false);
  const bounce = new E.Game(1); bounce.launch(45,78); bounce.ball.x=bounce.level.target.x; bounce.ball.y=bounce.level.target.y;
  bounce.step(E.STEP); assert.notEqual(bounce.state,'won'); assert.ok(bounce.drainEvents().includes('locked'));
});
test('springboard changes descending velocity upward; thin gates block fast parcels', () => {
  const g=new E.Game(1);g.launch(16,70);
  for(let i=0;i<600 && !g.bounces && g.state==='flying';i++)g.step(E.STEP);
  assert.ok(g.bounces>0);assert.ok(g.ball.vy<0);
  const gate=new E.Game(4);gate.launch(5,100);gate.ball.x=650;gate.ball.y=400;gate.ball.vx=760;gate.ball.vy=0;
  for(let i=0;i<8;i++)gate.step(E.STEP);
  assert.ok(gate.ball.vx<0);assert.equal(gate.switched,false);
});
test('aim preview is deterministic and cannot consume or change the live run', () => {
  const g=new E.Game(7),before=JSON.stringify(g);
  const a=E.preview(7,35,70,0),b=E.preview(7,35,70,0);
  assert.deepEqual(a,b);assert.ok(a.length>5);assert.equal(JSON.stringify(g),before);
});
test('save validation keeps real best scores without trusting unlock counters', () => {
  assert.deepEqual(E.cleanSave(null),{best:[0,0,0,0,0,0,0,0],unlocked:1,current:0});
  const save=E.cleanSave({best:[3,2,0,99,-1,'3',null,2.1],unlocked:999,current:99});
  assert.equal(save.unlocked,3);assert.equal(save.current,2);assert.deepEqual(save.best,[3,2,0,3,0,0,0,0]);
});
test('all eight languages have every UI key and matching placeholders', () => {
  let messages;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(_,value)=>messages=value}});
  assert.equal(Object.keys(messages).length,8);
  const keys=Object.keys(messages.en).sort();
  for(const [language,dict] of Object.entries(messages)){
    assert.deepEqual(Object.keys(dict).sort(),keys,language);
    for(const key of keys){assert.ok(dict[key].trim(),language+':'+key);assert.deepEqual(dict[key].match(/\{\w+\}/g)||[],messages.en[key].match(/\{\w+\}/g)||[],language+':'+key);}
  }
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g))if(!match[1].startsWith('common.'))assert.ok(keys.includes(match[1]),match[1]);
});
test('lobby registration is unique, fully localized, and uses existing local assets', () => {
  const root=path.resolve(__dirname,'../..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(e=>e.path==='./games/slingshot-post/index.html');assert.equal(entries.length,1);
  assert.equal(Object.keys(entries[0].locales).length,7);
  assert.ok(fs.existsSync(path.join(root,entries[0].cover)));
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
  assert.ok(!/type="module"|https?:\/\//.test(html));
});
