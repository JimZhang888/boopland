/* Pure wardrobe rules and original catalogue. No network or build step. */
(() => {
  'use strict';
  const items = [];
  function add(id, category, slot, kind, fill, color, tags, warmth = 0, extra = {}) {
    items.push({ id, category, slot, kind, fill, color, tags: tags.split(' '), warmth, ...extra });
  }
  add('honeyBob','hair','hair','bob','#82604d','brown','gentle retro');
  add('inkBraid','hair','hair','braid','#49423c','black','natural cozy');
  add('chestnutWaves','hair','hair','waves','#765344','brown','romantic elegant');
  add('cloudBun','hair','hair','bun','#54463e','brown','minimal elegant');
  add('shortAsh','hair','hair','pixie','#777266','brown','fresh artistic');
  add('rosePony','hair','hair','pony','#9a766b','rose','fresh romantic');
  add('ribbonBraid','hair','hair','ribbonBraid','#675142','brown','romantic retro');
  add('oatKnit','top','top','cable','#e8dcc0','cream','cozy gentle',3);
  add('sageCardigan','top','top','cardigan','#a7b69a','green','retro natural',2);
  add('sailorShirt','top','top','sailor','#e9e9df','blue','fresh minimal',1);
  add('roseBlouse','top','top','blouse','#d8b6ac','rose','romantic elegant',1);
  add('blueStripe','top','top','stripe','#a6bac0','blue','minimal fresh',1);
  add('linenShirt','top','top','shirt','#e5dfc9','cream','natural artistic',1);
  add('cocoaVest','top','top','vest','#ac8871','brown','retro cozy',2);
  add('lilacKnit','top','top','cable','#bbb0c5','purple','gentle romantic',3);
  add('fernBlouse','top','top','embroidered','#7e987e','green','natural elegant',1);
  add('sagePleats','bottom','bottom','pleats','#acb79b','green','gentle natural',1,{mobility:1});
  add('denimCulottes','bottom','bottom','culottes','#8da5ae','blue','fresh minimal',1,{mobility:2});
  add('cocoaTrousers','bottom','bottom','trousers','#ad9480','brown','retro minimal',2,{mobility:2});
  add('creamShorts','bottom','bottom','shorts','#dfd6bd','cream','natural fresh',0,{mobility:2});
  add('roseSkirt','bottom','bottom','scallop','#cba59d','rose','romantic gentle',1,{mobility:1});
  add('inkSkirt','bottom','bottom','midi','#656c73','blue','elegant minimal',1,{mobility:1});
  add('checkSkirt','bottom','bottom','check','#b6a28b','brown','retro cozy',2,{mobility:1});
  add('gardenSkirt','bottom','bottom','floralSkirt','#d5dac3','green','natural romantic',1,{mobility:1});
  add('pinafore','dress','dress','pinafore','#a7b39c','green','natural retro',2,{mobility:1});
  add('teaDress','dress','dress','tea','#d8b9aa','rose','romantic elegant',1,{mobility:1});
  add('blueDress','dress','dress','shirtDress','#a4b7c0','blue','minimal fresh',1,{mobility:2});
  add('nightDress','dress','dress','velvet','#606575','blue','elegant romantic',2,{mobility:0});
  add('linenDress','dress','dress','linenDress','#e7dfc7','cream','natural gentle',1,{mobility:1});
  add('starDress','dress','dress','stars','#a5a4bf','purple','elegant artistic',2,{mobility:0});
  add('petalDress','dress','dress','petal','#c2a4a6','rose','romantic gentle',1,{mobility:1});
  add('sandCoat','coat','coat','trench','#cfbea0','cream','retro minimal',2,{rain:1});
  add('forestJacket','coat','coat','jacket','#9caa8b','green','natural fresh',2,{rain:1});
  add('woolCoat','coat','coat','wool','#ae9185','brown','cozy elegant',4);
  add('blueBolero','coat','coat','bolero','#8b9faa','blue','elegant gentle',2);
  add('rainCape','coat','coat','cape','#c7ccaa','green','natural gentle',2,{rain:1});
  add('lilacCoat','coat','coat','wool','#b8a8bc','purple','elegant romantic',4);
  add('rainBoots','feet','shoes','boots','#a89591','brown','retro gentle',0,{rain:1,comfort:2,formal:1});
  add('canvasShoes','feet','shoes','sneakers','#e5dfcb','cream','fresh minimal',0,{comfort:2});
  add('maryJanes','feet','shoes','mary','#796358','brown','retro romantic',0,{comfort:2,formal:1});
  add('ankleBoots','feet','shoes','ankle','#6c6460','brown','elegant minimal',0,{rain:1,comfort:2,formal:1});
  add('sandals','feet','shoes','sandals','#c4ac8a','cream','natural fresh',0,{comfort:2});
  add('balletShoes','feet','shoes','ballet','#c9aaa6','rose','romantic elegant',0,{comfort:1,formal:1});
  add('forestBoots','feet','shoes','boots','#7f967e','green','natural retro',0,{rain:1,comfort:2,formal:1});
  add('creamSocks','feet','socks','socks','#ede4ce','cream','cozy gentle',1);
  add('laceSocks','feet','socks','laceSocks','#f0e6da','cream','romantic retro',1);
  add('darkTights','feet','socks','tights','#77727a','blue','elegant cozy',2);
  add('beret','accessory','hat','beret','#a08773','brown','retro artistic');
  add('strawHat','accessory','hat','straw','#dac8a4','cream','natural fresh');
  add('roseBow','accessory','hat','bow','#c5a09c','rose','romantic gentle');
  add('leafClip','accessory','hat','leafClip','#8ca286','green','natural minimal');
  add('starClip','accessory','hat','starClip','#c5b77f','cream','elegant artistic');
  add('softScarf','accessory','neck','scarf','#b99f90','brown','cozy retro',1);
  add('pearlCollar','accessory','neck','pearl','#efe8d7','cream','elegant romantic');
  add('ribbonScarf','accessory','neck','ribbon','#a1ad97','green','retro gentle');
  add('bookBag','accessory','bag','satchel','#b09377','brown','retro gentle');
  add('canvasTote','accessory','bag','tote','#e6dfc6','cream','natural minimal');
  add('bluePurse','accessory','bag','purse','#92a9b3','blue','elegant romantic');
  add('leafSatchel','accessory','bag','satchel','#8ca184','green','retro natural');
  add('clearUmbrella','accessory','prop','umbrella','#d6e3df','cream','gentle fresh',0,{rain:1});
  add('smallBook','accessory','prop','book','#a29682','brown','artistic cozy');
  add('daisies','accessory','prop','bouquet','#e9e0ba','cream','natural romantic');
  add('moonUmbrella','accessory','prop','umbrella','#aebbc9','blue','elegant artistic',0,{rain:1});
  for (const [id,fill] of [['bookshop','#e4e9dc'],['meadow','#e4e8d1'],['concert','#d8dce6'],['gallery','#eee5d9'],['seaside','#e1ebe5'],['night','#d6dce2']]) add(id,'scene','background','background',fill,'','');
  for (const [id,fill] of [['pressedFlowers','#b8c6a2'],['postage','#a1b6b2'],['littleCat','#bfaa8e'],['sparkles','#c9b989']]) add(id,'scene','sticker',id,fill,'','');
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const tasks = [
    {id:'rain',type:'challenge',background:'bookshop',weather:'rain',style:['gentle','retro'],activity:'walk',reward:'rainCape'},
    {id:'picnic',type:'challenge',background:'meadow',weather:'mild',style:['natural','cozy'],activity:'picnic',reward:'gardenSkirt'},
    {id:'concert',type:'challenge',background:'concert',weather:'cold',style:['elegant'],activity:'formal',reward:'starDress'},
    {id:'gallery',type:'challenge',background:'gallery',weather:'mild',style:['artistic','minimal'],activity:'walk',reward:'fernBlouse'},
    {id:'seaside',type:'challenge',background:'seaside',weather:'sun',style:['fresh','natural'],activity:'walk',reward:'petalDress'},
    {id:'stars',type:'challenge',background:'night',weather:'cold',style:['cozy','gentle'],activity:'walk',reward:'moonUmbrella'},
    {id:'cyclist',type:'order',background:'meadow',color:'green',style:['retro'],activity:'cycle',reward:'leafSatchel'},
    {id:'curator',type:'order',background:'gallery',color:'blue',style:['minimal'],activity:'walk',reward:'starClip'},
    {id:'florist',type:'order',background:'bookshop',color:'rose',style:['romantic'],activity:'walk',reward:'ribbonBraid'},
    {id:'reader',type:'order',background:'bookshop',color:'cream',style:['cozy'],activity:'walk',reward:'ribbonScarf'},
    {id:'collector',type:'order',background:'gallery',color:'brown',style:['retro'],activity:'picnic',reward:'forestBoots'},
    {id:'violinist',type:'order',background:'concert',color:'purple',style:['elegant'],activity:'formal',reward:'lilacCoat'}
  ];
  const rewards = new Set(tasks.map(task => task.reward));
  const categories = ['hair','top','bottom','dress','coat','feet','accessory','scene'];
  const slots = ['hair','top','bottom','dress','coat','shoes','socks','hat','neck','bag','prop','background','sticker'];
  const defaultOutfit = {hair:'honeyBob',top:'oatKnit',bottom:'sagePleats',dress:null,coat:null,shoes:'rainBoots',socks:'creamSocks',hat:null,neck:null,bag:'bookBag',prop:'clearUmbrella',background:'bookshop',sticker:'pressedFlowers',skin:0};
  const unlocked = state => items.filter(item => !rewards.has(item.id) || state.unlocked.includes(item.id));
  function freshState(){return {version:1,outfit:{...defaultOutfit},unlocked:[],scores:{},album:[],mode:'free',task:'rain'};}
  function cleanOutfit(raw, state) {
    const result = {...defaultOutfit};
    if (!raw || typeof raw !== 'object') return result;
    const available = new Set(unlocked(state).map(item=>item.id));
    for(const slot of slots){
      if(raw[slot] === null && !['hair','shoes','background'].includes(slot)) result[slot] = null;
      else if(available.has(raw[slot]) && byId[raw[slot]]?.slot === slot) result[slot] = raw[slot];
    }
    if(result.dress){result.top=null;result.bottom=null;}
    else {if(!result.top) result.top=defaultOutfit.top;if(!result.bottom)result.bottom=defaultOutfit.bottom;}
    result.skin=[0,1,2].includes(raw.skin)?raw.skin:0;
    return result;
  }
  function sanitize(raw) {
    const state = freshState();
    if(!raw || typeof raw !== 'object' || raw.version !== 1)return state;
    state.unlocked = Array.isArray(raw.unlocked)?[...new Set(raw.unlocked.filter(id=>rewards.has(id)))]:[];
    for(const task of tasks){const score=raw.scores?.[task.id];if(Number.isFinite(score))state.scores[task.id]=Math.max(0,Math.min(100,Math.round(score)));}
    state.outfit=cleanOutfit(raw.outfit,state);
    state.mode=['free','challenge','order'].includes(raw.mode)?raw.mode:'free';
    state.task=tasks.some(t=>t.id===raw.task)?raw.task:'rain';
    if(state.mode!=='free'&&!tasks.some(t=>t.id===state.task&&t.type===state.mode))state.task=tasks.find(t=>t.type===state.mode).id;
    if(Array.isArray(raw.album)) state.album=raw.album.slice(0,24).filter(x=>x&&typeof x==='object'&&typeof x.date==='string'&&!Number.isNaN(Date.parse(x.date))).map((x,i)=>({id:typeof x.id==='string'?x.id:'restored-'+i,date:x.date,outfit:cleanOutfit(x.outfit,state),task:tasks.some(t=>t.id===x.task)?x.task:null}));
    return state;
  }
  function equip(outfit,id,state) {
    const item = byId[id];
    if(!item || (rewards.has(id)&&!state.unlocked.includes(id)))return null;
    const next={...outfit};
    if(next[item.slot]===id && !['hair','top','bottom','shoes','background'].includes(item.slot)){
      next[item.slot]=null;
      if(item.slot==='dress'){next.top=defaultOutfit.top;next.bottom=defaultOutfit.bottom;}
    }else{
      next[item.slot]=id;
      if(item.slot==='dress'){next.top=null;next.bottom=null;}
      if(item.slot==='top'||item.slot==='bottom'){
        next.dress=null;
        if(!next.top)next.top=defaultOutfit.top;
        if(!next.bottom)next.bottom=defaultOutfit.bottom;
      }
    }
    return next;
  }
  function evaluate(outfit,task) {
    const worn = slots.filter(s=>!['hair','background','sticker'].includes(s)).map(s=>byId[outfit[s]]).filter(Boolean);
    const major = ['top','bottom','dress','coat'].map(s=>byId[outfit[s]]).filter(Boolean);
    const shoe=byId[outfit.shoes], lower=byId[outfit.dress||outfit.bottom];
    const warmth=worn.reduce((sum,item)=>sum+item.warmth,0);
    const styleCount=worn.filter(item=>item.tags.some(tag=>task.style.includes(tag))).length;
    const rows=[];
    if(task.color){
      const matches=major.some(item=>item.color===task.color);
      const accent=worn.some(item=>item.color===task.color);
      rows.push({key:'color',points:matches?40:accent?20:0,max:40,message:matches?'colorGood':'colorNeed',values:{color:task.color}});
    }else{
      let points=0;
      if(task.weather==='rain')points=(shoe?.rain?20:0)+(byId[outfit.prop]?.rain||byId[outfit.coat]?.rain?20:0);
      if(task.weather==='cold')points=warmth>=6?40:warmth>=4?25:10;
      if(task.weather==='mild')points=warmth>=2&&warmth<=6?40:25;
      if(task.weather==='sun')points=warmth<=3?40:warmth<=5?25:10;
      rows.push({key:'weather',points,max:40,message:task.weather+(points===40?'Good':'Need'),values:{warmth}});
    }
    const stylePoints=styleCount>=2?30:styleCount===1?20:0;
    rows.push({key:'style',points:stylePoints,max:30,message:stylePoints===30?'styleGood':'styleNeed',values:{style:task.style[0]}});
    let activityPoints=0;
    if(task.activity==='walk')activityPoints=shoe?.comfort>=2?30:15;
    if(task.activity==='picnic')activityPoints=(shoe?.comfort>=2?15:0)+(lower?.mobility>=1?15:0);
    // A cycling outfit must actually leave both hands free and allow pedaling.
    // Otherwise color and decorative accessories alone could clear the request.
    if(task.activity==='cycle')activityPoints=shoe?.comfort>=2&&lower?.mobility>=2&&!outfit.prop?30:0;
    if(task.activity==='formal')activityPoints=(shoe?.formal?15:0)+(major.some(item=>item.tags.includes('elegant'))?15:0);
    rows.push({key:'activity',points:activityPoints,max:30,message:task.activity+(activityPoints===30?'Good':'Need'),values:{}});
    const score=rows.reduce((s,r)=>s+r.points,0);
    return {score,pass:score>=75,rows};
  }
  function complete(state,task) {
    const result=evaluate(state.outfit,task);
    state.scores[task.id]=Math.max(state.scores[task.id]||0,result.score);
    result.newReward=result.pass&&!state.unlocked.includes(task.reward)?task.reward:null;
    if(result.newReward)state.unlocked.push(result.newReward);
    return result;
  }
  const inspirations = [
    {top:'sageCardigan',bottom:'cocoaTrousers',shoes:'maryJanes',hair:'inkBraid',hat:'beret',bag:'canvasTote',background:'meadow'},
    {dress:'teaDress',shoes:'balletShoes',hair:'chestnutWaves',hat:'roseBow',neck:'pearlCollar',background:'gallery',prop:'daisies'},
    {top:'sailorShirt',bottom:'denimCulottes',shoes:'canvasShoes',hair:'shortAsh',background:'seaside',bag:'canvasTote'},
    {dress:'nightDress',shoes:'ankleBoots',socks:'darkTights',coat:'woolCoat',hair:'cloudBun',neck:'pearlCollar',background:'concert'},
    {top:'oatKnit',bottom:'checkSkirt',shoes:'maryJanes',hair:'rosePony',neck:'softScarf',background:'bookshop',prop:'smallBook'},
    {dress:'linenDress',shoes:'sandals',hair:'chestnutWaves',hat:'strawHat',background:'meadow',prop:'daisies'}
  ];
  function inspiration(index,skin=0){const look={...defaultOutfit,coat:null,socks:null,hat:null,neck:null,bag:null,prop:null,...inspirations[index%inspirations.length],skin};if(look.dress){look.top=null;look.bottom=null;}return look;}
  window.PaperWardrobe = {items,byId,tasks,categories,slots,defaultOutfit,freshState,sanitize,cleanOutfit,equip,evaluate,complete,unlocked,inspiration};
})();
