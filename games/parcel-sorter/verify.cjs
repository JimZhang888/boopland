const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: { BooplandI18n: { register: (scope, messages) => { context.messages = messages; } } } };
vm.createContext(context);
for (const name of ['game.js','translations.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),context);
const { SortingGame } = context.window.ParcelGame;
const game = new SortingGame(() => 0);game.start();game.pause();game.tick(5);assert.equal(game.remaining,90);assert.equal(game.sort(0),false);game.resume();
for(let i=0;i<10;i++){if(!game.parcels.length)game.spawn();game.sort(0);}
assert.equal(game.score,170);assert.equal(game.multiplier,3);assert.equal(game.sort(0,999),false);
game.spawn();game.sort(1);assert.equal(game.lives,4);assert.equal(game.combo,0);
game.spawn(1.119);game.tick(.1);assert.equal(game.lives,3);
for(let i=0;i<3;i++){game.spawn();game.sort(2);}assert.equal(game.status,'ended');assert.equal(game.lives,0);
game.reset('rush');game.start();game.parcels=[];game.remaining=.01;game.tick(.02);assert.equal(game.status,'ended');assert.equal(game.remaining,0);
game.reset('easy');game.start();for(let i=0;i<901;i++){game.tick(.1);for(const p of [...game.parcels])game.sort(p.destination,p.id);}assert.equal(game.status,'ended');assert.equal(game.lives,5);assert.ok(game.delivered>30);
const languages=['zh-CN','en','ja','ko','fr','de','es','pt-BR'];
const keys=Object.keys(context.messages.en).sort();
for(const language of languages){assert.deepEqual(Object.keys(context.messages[language]).sort(),keys);for(const key of keys)assert.ok(context.messages[language][key],language+':'+key);}
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
for(const match of html.matchAll(/data-i18n(?:-label)?="parcelSorter\.([^\"]+)"/g))assert.ok(keys.includes(match[1]),match[1]);
assert.ok(!/type="module"|https?:\/\//.test(html));
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../gamelist.js'),'utf8'),context);
const entries=context.window.GAME_LIST.filter(g=>g.path==='./games/parcel-sorter/index.html');assert.equal(entries.length,1);
for(const lang of languages.slice(1))assert.ok(entries[0].locales[lang]?.title);
console.log('PASS: game rules, full shift, eight complete dictionaries, local assets, classic scripts and lobby registration.');
