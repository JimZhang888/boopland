const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const E = require('./engine.js');
function setup(values, lanes, hp=20) {
  const s=E.create(123); E.roll(s); s.hp=hp;
  s.dice=values.map((value,i)=>({value,lane:lanes[i]})); return s;
}
test('seeded rolls, assignment, returns and one unassigned reroll per turn',()=>{
  const a=E.create(78), b=E.create(78); assert.equal(E.resolve(a),false);
  assert.equal(E.roll(a),true); E.roll(b); assert.deepEqual(a,b); assert.equal(E.roll(a),false);
  E.assign(a,0,'guard'); assert.equal(E.reroll(a,0),false); E.assign(a,0,null);
  assert.equal(E.reroll(a,0),true); assert.equal(E.reroll(a,1),false);
  assert.equal(E.assign(a,4,'heal'),false); assert.equal(E.assign(a,1,'nope'),false);
  assert.equal(E.resolve(a),false); assert.equal(a.turns,0);
});
test('small attack dice trigger once; matching small healing dice cap at max health',()=>{
  const a=setup([1,2,1,2],['attack','attack','attack','attack']);
  assert.equal(E.preview(a).attack,13); assert.deepEqual(E.preview(a).combos,['inch']);
  const b=setup([2,2,5,6],['heal','heal','guard','attack'],36);
  assert.equal(E.preview(b).heal,9); assert.equal(E.preview(b).healing,2);
  E.resolve(b); assert.equal(b.hp,37); // 6 incoming - 5 block, after healing to 38.
  const c=setup([4,4,5,6],['heal','heal','guard','attack']); assert.ok(!E.preview(c).combos.includes('return'));
});
test('1 + 2 guard redirects only on a full block; enemy guard reduces player damage',()=>{
  const a=setup([1,2,5,6],['guard','guard','attack','attack']);
  assert.equal(E.preview(a).guard,9); assert.equal(E.preview(a).riposte,4);
  E.resolve(a); assert.equal(a.hp,20); assert.equal(a.enemyHp,8);
  const b=setup([1,2,5,6],['guard','guard','attack','attack']); b.round=3;
  assert.equal(E.preview(b).counter,1); assert.equal(E.preview(b).riposte,0);
  const c=setup([6,4,5,6],['attack','heal','guard','heal']); c.round=2;
  assert.equal(E.preview(c).damage,2);
});
test('three harmonies works across lanes and combines with individual skills',()=>{
  const s=setup([1,2,3,3],['guard','guard','heal','heal']); const p=E.preview(s);
  assert.deepEqual(p.combos,['redirect','return','harmony']);
  assert.equal(p.attack,3); assert.equal(p.guard,12); assert.equal(p.heal,13);
  E.resolve(s); assert.equal(s.combos,3); assert.equal(s.hp,33);
});
test('preview matches combat; healing precedes damage; lethal strike prevents counterattack',()=>{
  const a=setup([6,6,6,6],['attack','attack','attack','attack'],1); const p=E.preview(a);
  assert.equal(p.counter,0); E.resolve(a); assert.equal(a.hp,1); assert.equal(a.phase,'reward');
  assert.equal(E.resolve(a),false); assert.equal(a.cleared,1);
  const b=setup([1,1,6,6],['attack','attack','heal','heal'],1); b.round=3;
  const q=E.preview(b); E.resolve(b); assert.equal(b.hp,q.nextHp); assert.equal(b.hp,3);
  const c=setup([1,1,1,1],['attack','attack','attack','attack'],1); E.resolve(c);
  assert.equal(c.phase,'lost'); assert.equal(c.hp,0); assert.equal(E.roll(c),false); assert.equal(E.upgrade(c,'heart'),false);
});
test('shields expire, enemy pressure increases, upgrades heal and cannot be claimed twice',()=>{
  const s=setup([6,6,6,6],['attack','attack','attack','attack'],10); E.resolve(s);
  assert.equal(E.upgrade(s,'heart'),true); assert.equal(s.maxHp,44); assert.equal(s.hp,24); assert.equal(s.upgrades.heart,1);
  assert.equal(E.upgrade(s,'blade'),false); assert.equal(s.stage,1);
  E.roll(s); for(let i=0;i<4;i++) E.assign(s,i,'guard'); E.resolve(s);
  assert.equal(E.preview(s).guard,0);
  s.round=1; const first=E.intent(s).attack; s.round=13; assert.equal(E.intent(s).attack,first+6);
});
test('six victories yield one final result; restart is a fresh state',()=>{
  const s=E.create(12);
  for(let stage=0;stage<6;stage++) {
    E.roll(s); s.enemyHp=1;
    for(let i=0;i<4;i++) E.assign(s,i,'attack');
    E.resolve(s); assert.equal(s.cleared,stage+1);
    if(stage<5) { assert.equal(s.phase,'reward'); assert.equal(E.upgrade(s,'blade'),true); }
  }
  assert.equal(s.phase,'won'); assert.equal(E.upgrade(s,'blade'),false); assert.equal(E.resolve(s),false);
  assert.ok(E.score(s)>1000); assert.equal(E.create(12).stage,0);
});
test('save validation handles bad data and preserves RNG, placement and reward phases',()=>{
  const s=E.create(6); E.roll(s); E.assign(s,1,'guard'); E.reroll(s,0);
  const restored=E.restore(JSON.stringify(s)); assert.deepEqual(restored,s);
  for(let i=0;i<4;i++) { E.assign(s,i,'attack'); E.assign(restored,i,'attack'); }
  E.resolve(s); E.resolve(restored); assert.deepEqual(s,restored); assert.deepEqual(E.restore(JSON.stringify(s)),s);
  const bad=['oops','null','{}', JSON.stringify({...s,hp:-1}),JSON.stringify({...s,stage:7}),JSON.stringify({...s,dice:[{value:9,lane:null}]}),JSON.stringify({...s,upgrades:{blade:99,guard:0,heart:0}}),JSON.stringify({...s,phase:'won'})];
  for(const raw of bad) assert.equal(E.restore(raw),null);
});
test('all 1296 rolls and 81 allocations resolve exactly as previewed without invalid HP',()=>{
  for(let n=0;n<1296;n++) {
    let r=n; const values=Array.from({length:4},()=>{const v=r%6+1;r=Math.floor(r/6);return v;});
    for(let a=0;a<81;a++) {
      let v=a; const lanes=Array.from({length:4},()=>{const l=E.LANES[v%3];v=Math.floor(v/3);return l;});
      const s=setup(values,lanes,1+n%38); s.round=1+n%8; const p=E.preview(s);
      E.resolve(s); assert.equal(s.hp,p.nextHp); assert.equal(s.enemyHp,p.enemyHp);
      assert.ok(s.hp>=0&&s.hp<=s.maxHp); assert.ok(s.enemyHp>=0); assert.deepEqual(E.restore(JSON.stringify(s)),s);
    }
  }
});
test('all languages cover every static/dynamic key and interpolation; lobby links stay local',()=>{
  let dict; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'translations.js'),'utf8'),{BooplandI18n:{register:(_,d)=>dict=d}});
  assert.equal(Object.keys(dict).length,8); const keys=Object.keys(dict.en).sort();
  for(const [lang,d] of Object.entries(dict)) {
    assert.deepEqual(Object.keys(d).sort(),keys);
    for(const key of keys) { assert.ok(typeof d[key]==='string'&&d[key].length,lang+'.'+key); assert.deepEqual((d[key].match(/\{\w+\}/g)||[]).sort(),(dict.en[key].match(/\{\w+\}/g)||[]).sort()); }
  }
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const m of html.matchAll(/data-i18n(?:-label)?="jianghu\.([^"]+)"/g)) assert.ok(dict.en[m[1]],m[1]);
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname,m[1])),m[1]);
  const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
  for(const m of js.matchAll(/\bt\('([a-zA-Z]+)'[,)]/g)) assert.ok(dict.en[m[1]],m[1]);
  const context={window:{}}; vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);
  const entries=context.window.GAME_LIST.filter(g=>g.path.includes('dice-jianghu'));
  assert.equal(entries.length,1); assert.equal(Object.keys(entries[0].locales).length,7);
});
