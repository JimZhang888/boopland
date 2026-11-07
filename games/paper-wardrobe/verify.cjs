const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c={window:{BooplandI18n:{register:(_,messages)=>c.messages=messages}}};vm.createContext(c);
for(const file of ['engine.js','art.js','translations.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),c);
const E=c.window.PaperWardrobe,A=c.window.WardrobeArt,state=E.freshState();
assert.equal(E.items.length,73);assert.equal(E.unlocked(state).length,61);assert.equal(E.tasks.length,12);
assert.equal(new Set(E.items.map(x=>x.id)).size,E.items.length);
for(const item of E.items){assert.ok(E.categories.includes(item.category));assert.ok(E.slots.includes(item.slot));assert.ok(A.thumbnail(item).startsWith('<svg'));}
assert.equal(E.equip(state.outfit,'starDress',state),null,'Locked rewards cannot be worn');
let outfit=E.equip(state.outfit,'teaDress',state);assert.equal(outfit.top,null);assert.equal(outfit.bottom,null);
outfit=E.equip(outfit,'teaDress',state);assert.equal(outfit.dress,null);assert.ok(outfit.top&&outfit.bottom);
outfit=E.equip(state.outfit,'teaDress',state);outfit=E.equip(outfit,'blueStripe',state);assert.equal(outfit.dress,null);assert.equal(outfit.top,'blueStripe');assert.ok(outfit.bottom);
outfit=E.equip(state.outfit,'beret',state);outfit=E.equip(outfit,'pearlCollar',state);assert.equal(outfit.hat,'beret');assert.equal(outfit.neck,'pearlCollar');assert.equal(outfit.bag,'bookBag');
const looks={
  rain:{},picnic:{prop:null},concert:{dress:'nightDress',top:null,bottom:null,coat:'woolCoat',socks:'darkTights',shoes:'ankleBoots',prop:null},
  gallery:{top:'linenShirt',bottom:'denimCulottes',shoes:'canvasShoes',hat:'beret',prop:null},
  seaside:{dress:'linenDress',top:null,bottom:null,coat:null,socks:null,shoes:'sandals',prop:null},
  stars:{coat:'woolCoat',socks:'darkTights',prop:null},
  cyclist:{top:'sageCardigan',bottom:'cocoaTrousers',shoes:'maryJanes',prop:null},
  curator:{top:'blueStripe',bottom:'denimCulottes',shoes:'canvasShoes',prop:null},
  florist:{dress:'teaDress',top:null,bottom:null,shoes:'maryJanes',hat:'roseBow',prop:null},
  reader:{top:'oatKnit',bottom:'checkSkirt',shoes:'maryJanes',prop:null},
  collector:{top:'cocoaVest',bottom:'cocoaTrousers',shoes:'maryJanes',prop:null},
  violinist:{top:'lilacKnit',bottom:'inkSkirt',shoes:'balletShoes',neck:'pearlCollar',prop:null}
};
for(const task of E.tasks){
  const s=E.freshState();s.outfit={...s.outfit,...looks[task.id]};
  for(const id of Object.values(s.outfit).filter(x=>typeof x==='string'))assert.ok(E.unlocked(s).some(x=>x.id===id),'All tasks solvable with initial wardrobe: '+id);
  const result=E.complete(s,task);assert.equal(result.score,100,task.id+' has a complete starter solution');assert.equal(result.newReward,task.reward);assert.equal(s.unlocked.length,1);
  assert.equal(E.complete(s,task).newReward,null);assert.equal(s.unlocked.length,1);assert.equal(s.scores[task.id],100);
  s.outfit={...E.defaultOutfit,top:'sailorShirt',bottom:'creamShorts',socks:null,coat:null,shoes:'sandals',prop:null,bag:null,neck:null};
  E.complete(s,task);assert.equal(s.scores[task.id],100,'Best score never decreases');
}
const rain=E.tasks[0],bad={...E.defaultOutfit,top:'blueStripe',bottom:'creamShorts',socks:null,shoes:'balletShoes',prop:null,bag:null};
assert.ok(!E.evaluate(bad,rain).pass);assert.equal(E.evaluate(bad,rain).rows[0].message,'rainNeed');
const goodCycle={...E.defaultOutfit,...looks.cyclist},cycle=E.tasks.find(t=>t.id==='cyclist');
assert.equal(E.evaluate({...goodCycle,prop:'clearUmbrella'},cycle).rows[2].points,0);
assert.equal(E.evaluate({...goodCycle,prop:'clearUmbrella'},cycle).pass,false,'Color and style cannot excuse occupied hands on a bicycle');
assert.equal(E.evaluate({...goodCycle,bottom:'sagePleats'},cycle).pass,false,'Cycling requires practical bottoms');
assert.equal(E.evaluate({...goodCycle,hair:'shortAsh',skin:2,background:'night',sticker:'littleCat'},cycle).score,E.evaluate(goodCycle,cycle).score,'Cosmetic choices do not affect score');
// Many legitimate combinations pass; the system is not a single-answer puzzle.
let passes=0;
for(const top of E.items.filter(x=>x.slot==='top'&&!E.tasks.some(t=>t.reward===x.id)))for(const bottom of E.items.filter(x=>x.slot==='bottom'&&!E.tasks.some(t=>t.reward===x.id)))for(const shoes of E.items.filter(x=>x.slot==='shoes'&&!E.tasks.some(t=>t.reward===x.id))){
  const look={...E.defaultOutfit,top:top.id,bottom:bottom.id,shoes:shoes.id};
  for(const task of E.tasks){const r=E.evaluate(look,task);assert.ok(r.score>=0&&r.score<=100);assert.equal(r.pass,r.score>=75);}
  if(E.evaluate(look,rain).pass)passes++;
}
assert.ok(passes>30);
const saved=E.freshState();saved.unlocked=['starDress'];saved.scores={concert:100};saved.outfit=E.equip(saved.outfit,'starDress',saved);saved.album=[{id:'one',date:new Date().toISOString(),outfit:saved.outfit,task:'concert'}];
const restored=E.sanitize(JSON.parse(JSON.stringify(saved)));assert.equal(restored.outfit.dress,'starDress');assert.equal(restored.album[0].outfit.dress,'starDress');assert.equal(restored.scores.concert,100);
const corrupted=E.sanitize({version:1,outfit:{hair:'missing',dress:'starDress',skin:99},unlocked:['bad'],scores:{rain:Infinity},album:[null,{date:'bad'}],mode:'oops'});
assert.equal(corrupted.outfit.hair,'honeyBob');assert.equal(corrupted.outfit.dress,null);assert.equal(corrupted.album.length,0);assert.equal(corrupted.mode,'free');
const keys=Object.keys(c.messages.en).sort();
for(const lang of ['zh-CN','en','ja','ko','fr','de','es','pt-BR']){
  assert.deepEqual(Object.keys(c.messages[lang]).sort(),keys);
  for(const key of keys){assert.equal(typeof c.messages[lang][key],'string',lang+':'+key);assert.ok(c.messages[lang][key].trim());assert.deepEqual([...c.messages[lang][key].matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort(),[...c.messages.en[key].matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort());}
  for(const item of E.items)assert.ok(c.messages[lang]['item_'+item.id]);
  for(const task of E.tasks)assert.ok(c.messages[lang]['task_'+task.id]&&c.messages[lang]['task_'+task.id+'Desc']);
}
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert.ok(fs.existsSync(path.resolve(__dirname,m[1])),m[1]);
for(const m of html.matchAll(/data-i18n(?:-label)?="wardrobe\.([^"#]+)"/g))assert.ok(keys.includes(m[1]),m[1]);
assert.equal((html.match(/src="\.\.\/\.\.\/analytics.js"/g)||[]).length,1);
assert.ok(!/type="module"|https?:\/\//.test(html));
for(const task of E.tasks){const report=E.evaluate(E.defaultOutfit,task);for(const row of report.rows)assert.ok(c.messages.en[row.message]);}
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),c);
const records=c.window.GAME_LIST.filter(x=>x.path==='./games/paper-wardrobe/index.html');assert.equal(records.length,1);assert.equal(records[0].category,'休闲');
for(const lang of ['en','ja','ko','fr','de','es','pt-BR'])assert.ok(records[0].locales[lang].title&&records[0].locales[lang].description);
console.log(`PASS: ${E.items.length} items (${E.unlocked(state).length} starters), all 12 tasks score 100 with starter pieces, ${passes} rainy-day solutions, mutually exclusive garments, rewards, score bounds, save sanitation, ${keys.length} translated keys × 8 languages, relative resources, analytics and lobby registration.`);
