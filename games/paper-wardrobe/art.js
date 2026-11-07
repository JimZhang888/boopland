/* All illustrations are original, layered SVG drawings in one shared coordinate system. */
(() => {
  'use strict';
  const E=window.PaperWardrobe, ink='#666354';
  const path=(d,fill='none',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const line=(d,extra='')=>path(d,'none',extra);
  const ellipse=(cx,cy,rx,ry,fill,extra='')=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const group=(s,extra='')=>`<g ${extra}>${s}</g>`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  let serial=0;
  function defs(p){return `<defs><pattern id="${p}knit" width="12" height="12" patternUnits="userSpaceOnUse"><path d="m3 1 3 4-3 4m6-8-3 4 3 4" fill="none" stroke="#8c8974" stroke-width=".65" opacity=".3"/></pattern><pattern id="${p}check" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M0 5h23M5 0v23" stroke="#f9f3e2" stroke-width="6" opacity=".48"/><path d="M0 17h23M17 0v23" stroke="#736b5e" stroke-width="1" opacity=".3"/></pattern><pattern id="${p}stripe" width="10" height="13" patternUnits="userSpaceOnUse"><path d="M0 6h10" stroke="#f6f2e4" stroke-width="5" opacity=".65"/></pattern><pattern id="${p}flowers" width="34" height="32" patternUnits="userSpaceOnUse"><path d="m13 18 2 8m-2-4 5-2" stroke="#91a083" stroke-width="1"/><g fill="#b58c81" stroke="none"><ellipse cx="13" cy="12" rx="3" ry="5"/><ellipse cx="13" cy="12" rx="5" ry="3"/></g><circle cx="13" cy="12" r="1.6" fill="#f3dec0" stroke="none"/></pattern><pattern id="${p}grain" width="19" height="17" patternUnits="userSpaceOnUse"><path d="m1 4 2 .2m11 6 1-1M6 16l2-.3" stroke="#747969" opacity=".13" stroke-width=".7"/></pattern></defs>`;}
  const star=(x,y,r=6,c='#c7b987')=>path(`M${x} ${y-r}l${r*.28} ${r*.68} ${r*.72} ${r*.32}-${r*.72} ${r*.28}-${r*.28} ${r*.72}-${r*.28}-${r*.72}-${r*.72}-${r*.28} ${r*.72}-${r*.32}Z`,c);
  function flower(x,y,r=6){return group(Array.from({length:5},(_,i)=>ellipse(x,y-r*.6,r*.38,r*.7,'#f4edd7',`transform="rotate(${i*72} ${x} ${y})"`)).join('')+ellipse(x,y,r*.3,r*.3,'#baa477'));}
  function plant(x,y,scale=1){return group(path('M-19 0h38l-5 33h-27Z','#c9b6a0')+line('M-11 6h22m-19 21h17M0 0v-65m0 40-19-15m19-3 19-16')+path('M0-40Q-29-62-22-38Q-12-26 0-28M0-51Q28-76 24-49Q14-35 0-36M0-65Q-14-90-5-88Q12-85 0-65','#a7b692'),`transform="translate(${x} ${y}) scale(${scale})"`);}
  function scene(id,p,mini=false){
    let s='';
    const colors={bookshop:'#e8ecdf',meadow:'#e9ecd9',concert:'#dde1e8',gallery:'#efe9dc',seaside:'#e3ede7',night:'#dbe1e7'};
    s+=rect(0,0,520,640,colors[id]||colors.bookshop,'stroke="none"');
    if(id==='bookshop'){
      s+=path('M20 532V60h180v472','#e4dfcf','stroke="#bac1ac"');
      s+=rect(37,82,145,245,'#c9d5ce','stroke="#96a995" stroke-width="2" rx="65"');
      s+=line('M109 83v244M38 197h143M37 330h148','stroke="#a1aa95" stroke-width="4"');
      s+=path('M40 318v-46l18-9 16 12 24-28 22 25 18-20 39 20v46Z','#bac7b7','stroke="none"');
      s+=group(Array.from({length:20},(_,i)=>line(`M${42+i%5*29} ${112+Math.floor(i/5)*45}l-7 16`,'stroke="#f8faf2" stroke-width="1.4"')).join(''),'opacity=".8"');
      s+=rect(37,352,145,130,'#c4b69c','stroke="#9c9c85"');
      s+=line('M40 408h139M41 466h139','stroke="#9d927b" stroke-width="4"');
      for(let i=0;i<12;i++){const x=45+(i%6)*22,y=i<6?362:421;s+=rect(x,y,14,42,['#98aaa0','#b7aa92','#c0a497','#dbcfb3'][i%4],`rx="1" transform="rotate(${i%3-1} ${x} ${y+42})"`)+line(`M${x+4} ${y+6}v28`,'stroke="#ece7d6"');}
      s+=line('M405 40v32m-20 0h40l8 35h-56Z','stroke="#8c9881"')+path('M384 75h42l7 29h-56Z','#eee4bd','stroke="#a5a58a"');
      s+=plant(448,487,.95)+path('M0 535Q250 527 520 536v104H0','#d9ddc8','stroke="#bec7b1"');
      s+=line('M0 562h520M0 615h520m-402-80-18 105m168-108 15 108','stroke="#c6cdb9"');
      s+=ellipse(115,550,60,6,'#bdc6b4','opacity=".3" stroke="none"');
    }else if(id==='meadow'){
      s+=ellipse(413,98,44,44,'#ede5be','stroke="none"')+path('M0 317Q75 259 166 321T360 300T520 306V640H0','#d3ddbd','stroke="none"');
      s+=path('M0 398q120-50 248 3t272-17v256H0','#c2cead','stroke="none"');
      s+=path('M42 0q20 85 10 181t-25 210l35 5q35-131 24-212T84 0','#c0b498','stroke="#a9a58b"');
      s+=line('M65 176 124 105M65 244 15 196','stroke="#a9a58b" stroke-width="12"');
      for(let i=0;i<7;i++)s+=ellipse(15+i*19,33+(i%3)*38,45,36,['#bfcca7','#d0d8b6','#adbf98'][i%3],'stroke="none" opacity=".9"');
      s+=path('M322 547 463 531l38 77-172 12Z','#e2c5b3','stroke="#b7ac91"')+path('M322 547 463 531l38 77-172 12Z',`url(#${p}check)`,'stroke="none"');
      s+=path('M386 551q-3-29 18-29t20 24m-44 0 51-4-3 26-43 5Z','#c4aa80');
      for(let i=0;i<18;i++)s+=group(line(`M${25+i*29} ${510+i%4*27}l2-14`)+flower(27+i*29,495+i%4*27,4),'opacity=".65"');
    }else if(id==='concert'){
      s+=path('M0 0h105q-26 100-19 207T37 425H0M520 0h-105q26 100 19 207t49 218h37','#b4b1bb','stroke="#9898a2"');
      s+=line('M24 0q33 130 4 360M56 0q22 145-5 284M496 0q-33 130-4 360M464 0q-22 145 5 284','stroke="#9394a0"');
      s+=path('M139 0h242v425H139Z','#e9e7df','stroke="none"')+line('M174 0v422M346 0v422','stroke="#c8c7bd"');
      s+=line('M260 0v55m-50 0h100m-80-4v30m30-30v44m30-44v30','stroke="#ac9c78" stroke-width="3"');
      for(const x of [230,260,290])s+=ellipse(x,x===260?95:82,7,11,'#eadfc1','stroke="#b8aa8c"');
      s+=path('M0 515h520v125H0','#c3b7a6','stroke="#b6ab98"')+line('M0 545h520M0 587h520M60 515 32 640M450 515l29 125','stroke="#b3aa99"');
      s+=path('M367 391q47-12 105-60v112H367Z','#687275')+path('M367 442h112v15H365Z','#e3dfcf')+line('M374 458v63m93-63v63','stroke="#687275" stroke-width="6"');
      for(let i=0;i<10;i++)s+=line(`M${374+i*10} 443v12`,'stroke="#687275"');
      s+=line('M402 335v-71m0 10q25-10 23 6','stroke="#79868a" stroke-width="2"')+ellipse(397,335,8,5,'#79868a');
    }else if(id==='gallery'){
      s+=rect(30,75,129,176,'#c8b799','stroke="#ae9e83"')+rect(39,84,111,158,'#e6dfcf')+path('M48 219q1-80 41-57t49-55v123H48','#b3bea0')+ellipse(115,118,17,17,'#cfb394');
      s+=rect(379,115,110,144,'#c1ad94')+rect(388,124,92,126,'#eee7d8')+path('M407 221q-13-59 26-64t29 39q-25-13-55 25','#b2bfc0')+ellipse(436,173,13,27,'#c6a89b');
      s+=line('M29 279h63m287 7h54','stroke="#b6b29c"')+plant(81,483,1.2)+rect(0,535,520,105,'#ddd5bf','stroke="#c6c0ac"')+line('M0 566h520M0 615h520','stroke="#c8c3b2"');
      s+=path('M386 484h99v19h-99ZM397 503v45m77-45v45','#bca98c');
    }else if(id==='seaside'){
      s+=ellipse(408,90,43,43,'#eee4bb','stroke="none"')+path('M0 275q134-15 266 0t254-6v228H0','#bbd2cb','stroke="none"')+path('M0 400q150 11 270-5t250 0v132H0','#d1dfd0','stroke="none"')+path('M0 486q178-10 295 9t225-14v159H0','#e3d8bc','stroke="none"');
      s+=line('M20 342q45-9 95 0m260-21q38-10 100 0M39 431q60-7 111 0m236 12q51-10 115 0','stroke="#eef0df" stroke-width="3"');
      s+=path('M70 263h60l-13 17H84Z','#9cae9c')+path('M98 195v63H57Z','#f4efdc')+path('M103 214v44h37Z','#d7b8a7');
      s+=line('M61 550q-6-66 13-106m-5 56-23-33m22 23 26-24','stroke="#9fac8d" stroke-width="2"')+ellipse(415,577,8,4,'#cbbca3')+path('M440 545q-18-24-31 2Z','#f0e8d3');
    }else{
      s+=path('M0 421q98-76 205-20t315-17v256H0','#b8c5bc','stroke="none"')+path('M0 498q128-57 259-4t261-5v152H0','#a7b8aa','stroke="none"');
      s+=path('M410 65q-39 11-29 47t42 26q-50 20-58-25t45-48','#f4e8be','stroke="#ccc4a4"');
      for(let i=0;i<16;i++)s+=star(30+(i*83)%460,40+(i*47)%290,i%3+2,'#f2ebcf');
      s+=path('M381 496 444 409l55 88Z','#d7c9ae')+path('M444 409v87h-42Z','#b8aa93')+line('M449 468h16m-62 31-13 14m98-13 12 13');
      s+=plant(62,550,.65);
    }
    s+=rect(0,0,520,640,`url(#${p}grain)`,'stroke="none"');
    return group(s,'stroke="#a0a58d" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"');
  }
  const skinColors=['#f3d4b5','#dba57e','#af7554'];
  const artPalette={honeyBob:'#74503c',inkBraid:'#3d3c35',chestnutWaves:'#664738',cloudBun:'#4d4035',shortAsh:'#62665b',rosePony:'#946957',ribbonBraid:'#574233',oatKnit:'#e8d4ac',sageCardigan:'#91aa8d',sailorShirt:'#f1ead6',roseBlouse:'#d8a59a',blueStripe:'#8faebc',linenShirt:'#e9ddbe',cocoaVest:'#ad8061',lilacKnit:'#b8a8c3',fernBlouse:'#799577',sagePleats:'#a2b295',denimCulottes:'#819fac',cocoaTrousers:'#a78c72',creamShorts:'#dfcba3',roseSkirt:'#c99d95',inkSkirt:'#667685',checkSkirt:'#b69a7b',gardenSkirt:'#cbd5b5',pinafore:'#97ab8d',teaDress:'#d7b3a1',blueDress:'#9ab6c2',nightDress:'#596879',linenDress:'#e9ddbb',starDress:'#9b9cbb',petalDress:'#cfaaaf',sandCoat:'#cfb78f',forestJacket:'#94a582',woolCoat:'#b18e75',blueBolero:'#91aab3',rainCape:'#bac59c',lilacCoat:'#b0a0b8',rainBoots:'#a48779',canvasShoes:'#ede2c9',maryJanes:'#785747',ankleBoots:'#61584e',sandals:'#bfa17c',balletShoes:'#c49c96',forestBoots:'#7d977b'};
  Object.assign(artPalette,{beret:'#a18467',strawHat:'#d5bd8c',roseBow:'#ca9a98',leafClip:'#8fa176',starClip:'#c3aa6c',softScarf:'#bea08b',pearlCollar:'#f4e6bf',ribbonScarf:'#a2b38b',bookBag:'#af8b65',canvasTote:'#e7dcc0',bluePurse:'#88a8b3',leafSatchel:'#829b78',smallBook:'#9a8b70'});
  const colorOf=item=>artPalette[item.id]||item.fill;
  function mix(hex,amount,target='#fff7df'){
    const channels=value=>value.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16));
    const a=channels(hex),b=channels(target);
    return '#'+a.map((n,i)=>Math.round(n+(b[i]-n)*amount).toString(16).padStart(2,'0')).join('');
  }
  const shade=c=>mix(c,.19,'#655e50');
  const light=c=>mix(c,.25);
  const fold=(d,c,opacity=.65)=>line(d,`stroke="${shade(c)}" stroke-width=".8" opacity="${opacity}"`);
  function cloth(d,c,p,id,decoration=''){
    const key=p+id+'-fabric';
    return `<defs><clipPath id="${key}">${path(d,'#fff')}</clipPath></defs>`+path(d,c)+group(decoration,`clip-path="url(#${key})"`);
  }
  const shadow=(d,c,opacity=1)=>path(d,shade(c),`stroke="none" opacity="${opacity}"`);
  const glow=(d,c,opacity=1)=>path(d,light(c),`stroke="none" opacity="${opacity}"`);
  function button(x,y,c='#9b8766',r=2){return ellipse(x+.5,y+.7,r+.3,r+.3,'#5b5545','stroke="none" opacity=".16"')+ellipse(x,y,r,r,c,'stroke-width=".55"')+line(`M${x-.7} ${y}h1.4`,'stroke="#fff5db" stroke-width=".5"');}
  function hands(skin=0){
    const c=skinColors[skin];
    const contour='M170 333 169 351Q168 356 171 360L174 362Q177 364 178 360L180 354 184 359Q187 362 188 358L183 347 187 337';
    const left=path(contour+'Z',c,'stroke="none"')+line(contour)+fold('M173 350l-1 7m5-6-1 8m6-13 1 7',c,.75);
    return group(left+group(left,'transform="translate(508 0) scale(-1 1)"'),`stroke="#946e55" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"`);
  }
  function body(skin=0,p='body-'){
    const c=skinColors[skin],s=shade(c);let out='';
    out+=path('M225 306Q215 349 217 398L222 479 219 548 211 576Q208 584 218 586L229 581 236 565 243 465 253 358 264 465 271 565 280 582Q298 589 299 580L290 550 291 474 291 395Q292 345 281 306Z',c);
    out+=shadow('M250 328 253 358 243 465 236 565 230 577 230 550 233 468 238 365ZM289 396 291 474 290 550 299 580 288 578 283 546 285 466 281 398Z',c,.6);
    out+=fold('M223 440q8 5 15 0m35-1q8 4 14-1',c,.45);
    out+=path('M241 175 240 193Q237 199 226 201L209 205Q198 207 193 225L181 291 171 337 184 344 204 286 219 239 225 306Q253 319 283 306L288 239 304 286 324 344 337 337 326 290 313 225Q308 208 299 205L280 200Q267 198 265 190L267 175Z',c);
    out+=shadow('M241 176 267 175 265 190Q253 202 240 190ZM197 233 187 295 177 338 184 342 204 286 216 247ZM288 239 294 279 312 324 324 344 329 340 315 307Z',c,.64);
    out+=line('M236 202q7 5 14 4m9 0q8-1 12-5',`stroke="${s}" stroke-width=".75"`);
    // Soft, original animation-style face: warm eyes, a small nose and an open expression.
    const face='M210 127C207 100 226 79 251 79C278 78 297 98 297 125L294 148C291 164 273 184 254 187C237 185 218 170 213 153Z';
    out+=ellipse(212,141,5.8,10,c)+ellipse(295,140,5.4,10,c);
    out+=line('M211 138q5-4 4 5m79-6q-4-3-4 5',`stroke="${s}" stroke-width=".8"`);
    out+=cloth(face,c,p,'face',shadow('M209 117Q229 98 262 98L291 115 297 139 295 113Q289 84 252 80L221 91ZM214 148Q227 173 254 179Q276 179 291 157C284 173 268 185 254 187Q226 182 214 157Z',c,.45));
    out+=`<defs><radialGradient id="${p}blush"><stop stop-color="#d17b68" stop-opacity=".30"/><stop offset="1" stop-color="#d17b68" stop-opacity="0"/></radialGradient></defs>`;
    out+=ellipse(225,154,12,6,`url(#${p}blush)`,'stroke="none"')+ellipse(282,154,11,6,`url(#${p}blush)`,'stroke="none"');
    out+=line('M222 129q8-5 16-1M268 128q8-3 15 1','stroke="#725440" stroke-width="1.35"');
    const eye=(x,flipped=false)=>{
      const shape='M-9 0C-6-5 2-7 9-1Q3 8-7 4Z',key=p+'eye-'+x;
      return group(`<defs><clipPath id="${key}">${path(shape,'#fff')}</clipPath></defs>`+
        path(shape,'#fff9e9','stroke="#745842" stroke-width=".65"')+
        group(ellipse(1,.5,4.1,5.4,'#6c6046','stroke="none"')+ellipse(1,0,2.4,4,'#3f382f','stroke="none"')+
          ellipse(-.2,-2,1.3,1.5,'#fff9e5','stroke="none"')+ellipse(2.5,3,.6,.7,'#d2bb7e','stroke="none"'),`clip-path="url(#${key})"`)+
        line('M-10 0C-6-5 2-7 9-1m-17 .2-3-1.8','stroke="#4d4033" stroke-width="1.3"')+
        line('M-5 5q6 2 10-1','stroke="#9e7b5e" stroke-width=".55"'),`transform="translate(${x} 141)${flipped?' scale(-1 1)':''}"`);
    };
    out+=eye(232)+eye(276,true);
    out+=line('M254 145q-1 6-4 10l3 1','stroke="#aa795b" stroke-width=".85"')+ellipse(253,158,2.8,.8,mix(c,.15),'stroke="none"');
    out+=line('M247 169q7 4 14-1','stroke="#985f4f" stroke-width="1.05"')+line('M251 174q4 1 7-.4','stroke="#dba88b" stroke-width=".8"');
    out+=path('M227 203Q254 216 280 202L283 305Q255 317 225 305Z','#f2e7d1')+fold('M232 209 230 304m44-96 5 96','#f2e7d1');
    out+=path('M226 304q28 9 56 0l-2 31-26-7-26 7Z','#eee1c6');
    return group(out,'stroke="#946e55" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"');
  }
  function hair(item,part){
    const c=colorOf(item),k=item.kind,hi=mix(c,.27,'#c6aa7b'),dark=mix(c,.19,'#292c25');let s='';
    if(part==='back'){
      if(k==='bob'){
        s+=path('M208 100C190 119 196 156 198 174Q197 184 190 190L202 190 198 196Q211 202 227 194L233 156 276 154 280 194Q296 200 310 188L303 187Q313 150 303 112Z',c);
        s+=shadow('M202 137Q198 170 204 184L214 189 208 154ZM293 133Q308 169 297 188L284 190 284 163Z',c);
        s+=line('M204 145q-4 25 4 39m93-40q4 25-5 42',`stroke="${hi}" stroke-width=".7" opacity=".7"`);
      }else if(['waves','braid','ribbonBraid','pony'].includes(k)){
        s+=path('M208 99Q189 120 199 157Q203 176 196 190Q185 208 194 222L189 235Q208 250 226 238L237 161 273 156 280 238Q302 248 317 232L310 228Q319 210 306 192Q296 175 303 151Q316 115 289 92Z',c);
        s+=path('M200 154q9 30-1 46t4 31l10-2q-13-19-3-42t-2-51ZM296 153q-6 28 4 48t-2 30l-11 1q13-22 1-44t0-45Z',dark,'stroke="none"');
        s+=line('M204 151q11 29-3 52t6 29m90-80q-9 29 3 50t-3 30',`stroke="${hi}" stroke-width=".9" opacity=".65"`);
      }
      if(k==='pony'){
        s+=path('M291 102Q318 82 335 107C351 130 322 151 326 171Q329 188 344 196Q312 201 306 177Q302 163 315 141Q325 121 291 117Z',c);
        s+=path('M328 104q19 20 0 43t8 45q-23-9-18-27t13-34q5-14-3-27',hi,'stroke="none" opacity=".42"');
        s+=line('M322 113q11 15-2 33t-2 30',`stroke="${dark}" stroke-width=".8"`);
      }
      if(k==='bun'){
        s+=path('M225 82C210 66 217 45 236 44Q253 35 269 48Q290 62 277 82Z',c);
        s+=path('M224 66q-2-17 19-17 21-3 30 16l-7-6q-18-12-35 1Z',hi,'stroke="none" opacity=".55"');
        s+=line('M231 49q-14 15 1 26m7-27q-9 13 4 25m12-26q14 12 11 25m-35 1q18 6 36-2',`stroke="${dark}" stroke-width=".9"`);
      }
    }else{
      let cap;
      if(k==='pixie')cap='M210 151Q202 146 200 137L194 140Q198 130 195 118L191 121Q189 101 209 91L205 85Q232 65 256 73Q284 68 301 90L311 88 305 102Q317 123 301 144L297 153 291 131Q283 124 278 110Q273 122 263 125L265 112Q250 126 241 124L243 113Q231 127 215 131Z';
      else if(k==='waves')cap='M209 151C195 136 194 109 205 91Q225 67 253 72Q284 66 301 91Q318 119 299 153L291 134Q277 121 260 96Q254 116 234 123L239 114Q226 128 214 132Z';
      else if(k==='bun')cap='M210 151Q197 137 198 112C196 89 218 73 242 72Q281 65 298 91Q314 113 300 147L294 156 288 127Q270 113 250 98Q241 121 217 129Z';
      else cap='M208 151Q195 137 197 111C198 88 218 70 243 73Q279 65 300 89Q316 110 304 139L297 154 290 130Q282 121 278 106Q273 119 260 124L264 111Q249 125 237 123L242 111Q230 126 215 131Z';
      s+=path(cap,c);
      s+=path('M210 111Q211 86 239 81Q269 72 291 94Q270 82 252 87Q225 86 210 111Z',hi,'stroke="none" opacity=".5"');
      s+=line('M209 114q7-28 30-31m8-2q28-5 46 20M220 118q12-7 17-17m12-9q1 11 12 21m16-18q2 15 14 25',`stroke="${hi}" stroke-width=".75" opacity=".62"`);
      s+=line('M203 124q-3 12 5 24m89-24q7 13 1 26M251 75q10-9 21-5',`stroke="${dark}" stroke-width="1.05"`);
      if(k==='bob')s+=path('M209 128Q203 153 210 174L214 169 216 184Q220 169 217 153L215 128M291 130q9 21 2 39l-4-6 1 21q-8-18-5-31Z',c)+line('M211 139q-3 16 3 29m76-28q5 15 0 28',`stroke="${hi}" stroke-width=".7"`);
      if(k==='waves'){
        s+=path('M209 128Q201 148 209 169Q217 185 210 201Q203 215 211 229L205 235Q225 240 229 223Q232 209 222 192Q214 179 219 160L218 127ZM294 129Q302 147 292 170Q283 187 291 203Q302 223 294 233L302 230Q282 245 277 225Q274 210 284 190Q291 176 286 160L287 126Z',c);
        s+=path('M214 151q-5 15 2 30t2 31l-3 15q10-9 5-24t-8-26Z',hi,'stroke="none" opacity=".5"')+line('M212 157q-4 11 4 25t2 32m73-57q3 13-4 25t-2 32',`stroke="${hi}" stroke-width=".7"`);
      }
      if(['braid','ribbonBraid'].includes(k)){
        s+=path('M290 146q13 11 6 28l-6 7-13-8q10-10 6-23Z',c);
        for(let i=0;i<6;i++){
          const y=174+i*11,w=9-i*.65;
          s+=path(`M286 ${y-5}q${-w-6} 4-${w-1} 13l${w+3} 5q${w+8}-4 ${w}-12Z`,c);
          s+=line(`M${280-i*.3} ${y+1}q5 4 12 6`, `stroke="${hi}" stroke-width="1" opacity=".6"`);
        }
        s+=path('M283 241q-3 12 6 20l7-16Z',c)+path('M289 240q-24-14-21 0 7 8 20 3 20 10 24-7-9-9-23 4Z',k==='ribbonBraid'?'#c99b9c':'#a4b89c')+line('M286 244l-6 17m13-17 7 15','stroke="#8e9b7f"');
      }
      if(k==='pony')s+=path('M294 111q-2-11 10-11l5 12-10 9Z','#b69580')+line('M304 113q14 1 17 13','stroke="#b69580" stroke-width="2"');
      if(k==='bun')s+=line('M214 134q-4 20 4 33m76-34q5 19-3 29',`stroke="${c}" stroke-width="1.25"`);
    }
    return group(s,'stroke="#534336" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"');
  }
  const topShape='M227 198Q215 202 205 203Q194 207 190 226L186 265 177 307Q174 317 181 320L194 323Q201 323 203 314L216 265 220 304Q220 315 229 317Q257 324 282 316L288 264 303 312Q305 320 313 320L327 316Q334 314 330 303L318 252 315 226Q314 209 302 205L278 198Q252 212 227 198Z';
  const shortTop='M228 198 208 203Q198 206 194 216L184 240Q183 247 190 251L206 257Q213 257 216 247L220 238 223 307Q222 315 232 318Q257 323 282 316L287 238 293 248Q297 256 304 253L322 247Q328 243 324 236L313 213Q310 206 300 203L278 198Q254 212 228 198Z';
  const neckline=()=>line('M228 199q26 20 50-1','stroke="#8b7a60" stroke-width=".85"');
  function sleeveShading(c,short=false){
    return shadow(short?'M195 216q-6 21 3 34l-10-2-4-8ZM314 215l10 24q0 8-14 11l-8-3q16-8 12-32':'M198 214Q189 256 188 279l-8 32 14 4 8-13-8 20-16-5 9-65ZM312 224q8 27 18 78l-10 13-8 2 6-13-11-39-6-41Z',c,.7)+glow(short?'M201 212q8-7 13-5l-14 27-8 7Z':'M205 210q-8 16-9 36l-2 33 5-19 9-41Z',c,.5);
  }
  function skirtFolds(c,y=500,pleated=false){
    let s='';
    for(let i=0;i<7;i++){
      const waist=227+i*8.5,hem=194+i*19;
      s+=shadow(`M${waist} 319Q${waist-3} 375 ${hem} ${y-2}l${i%2?6:9} 2Q${waist+5} 377 ${waist+3} 319Z`,c,i%2?.28:.48);
      if(pleated)s+=fold(`M${waist} 323Q${waist-4} 394 ${hem} ${y-5}`,c,.75);
    }
    s+=glow(`M247 331Q241 399 237 ${y-4}l16 2Q250 408 254 335Z`,c,.25);
    return s;
  }
  function garment(item,p,skin=0,sockColor=null){
    const c=colorOf(item),k=item.kind,foot=sockColor||skinColors[skin];let s='';
    if(item.slot==='top'){
      const short=['blouse','embroidered','sailor','shirt'].includes(k),shape=short?shortTop:topShape,base=k==='vest'?'#eee0bf':c;
      let detailing=sleeveShading(base,short)+shadow('M219 279Q235 304 282 298l1 20q-35 8-60-1Z',base,.45)+glow('M225 220q13 7 26 6l-5 65-18-4Z',base,.3);
      if(['cable','stripe'].includes(k))detailing+=path(shape,`url(#${p}${k==='cable'?'knit':'stripe'})`,'stroke="none" opacity=".7"');
      s+=cloth(shape,base,p,item.id,detailing)+neckline();
      s+=fold(short?'M197 214q-5 16-3 27m10-24-3 25m109-25 7 22M223 276l5 17m48-9-1 15':'M194 275l10-5m-13 15 12-7M311 274l10 6m-13 0 14 9M225 279l7 20m45-21-3 22',base);
      s+=path(short?'M187 242l24 8-3 7-21-9ZM297 249l24-9 3 7-22 8Z':'M177 307l24 7-4 10-21-7ZM306 313l24-7 3 10-24 7Z',mix(base,.1),'stroke-width=".8"');
      if(k==='cable'){
        s+=path('M227 198q26 16 52-1l-2 10q-23 16-48 1Z',mix(c,.09,'#a48b62'))+path('M221 306q31 10 63-1l-2 12q-31 9-60 0Z',mix(c,.08,'#a48b62'));
        for(let x=225;x<282;x+=4)s+=line(`M${x} 310v7`, `stroke="${shade(c)}" stroke-width=".6"`);
        for(const x of [234,269])for(let y=218;y<300;y+=16)s+=line(`M${x} ${y}q-7 5 0 10t0 10m4-20q-7 5 0 10t0 10`,`stroke="${shade(c)}" stroke-width="1.1" opacity=".65"`);
        s+=fold('M251 221q-2 42 1 76',c,.35);
      }
      if(k==='cardigan'){
        s+=path('M228 199 254 231l24-33-10 36 3 80h-36l4-79Z','#ece2c8')+path('M227 198q8 20 23 33l-2 83-24-1-4-70M278 198q-8 20-23 33l1 83 26-1 6-70',c);
        s+=fold('M226 204q9 23 22 32m29-33q-8 22-22 33M249 237v76',c)+path('M226 278q8 2 18 0l-1 17q-9 4-17-1ZM265 277q10 3 18 0l-1 17q-9 5-17 0Z',light(c),'stroke-width=".7"');
        for(const y of [243,262,282,302])s+=button(253,y,'#e1cba0',1.8);
        s+=line('M232 222q20 8 39 0','stroke="#cbbd9d" stroke-width=".7"');
      }
      if(k==='sailor')s+=path('M227 198 254 222l24-24 12 12-35 34-40-32Z','#7d9ba6')+line('M221 210 254 237l31-27','stroke="#f3ecd9" stroke-width="1.8"')+path('M252 235q-14-10-14 0 3 9 14 3 15 8 16-2 1-10-13-1l6 23-8-4-9 6Z','#a9b49a');
      if(['blouse','embroidered','shirt'].includes(k)){
        s+=path('M228 197q9 5 25 18-6 14-16 13l-14-20ZM278 197q-11 7-25 18 6 14 17 13l13-20Z','#f4e8ce')+fold('M254 221v92',c);
        for(const y of [239,258,278,299])s+=button(258,y,'#e9d6ad',1.6);
        if(k==='blouse')s+=path('M254 218q-23-13-20 1 5 9 18 4l-7 23 8-6 7 4-3-22q19 8 20-6-8-9-23 2Z','#b9857c')+line('M240 216l11 5m9-1 12-4','stroke="#e0b5a8" stroke-width=".8"');
        if(k==='embroidered')for(const [x,y] of [[230,248],[276,245],[232,289],[275,287]])s+=line(`M${x} ${y+9}l2-11m-2 7-5-4m6 1 5-5`,'stroke="#d2d9b7" stroke-width=".8"')+flower(x+1,y-3,3.4);
        if(k==='shirt')s+=path('M264 245q8 2 16 0v18q-8 8-16 0Z',light(c),'stroke-width=".8"')+fold('M267 249h10',c);
      }
      if(k==='vest'){
        const vest='M227 199 253 231 278 198 287 236 282 316Q253 324 224 315L220 238Z';
        s+=cloth(vest,c,p,'vest',shadow('M220 239l13 5-3 56q23 13 53 3l-1 13q-27 9-58-1Z',c,.6))+line('M229 207 253 240l24-33M253 241v70',`stroke="${light(c)}" stroke-width="2"`);
        s+=path('M228 272h17v17q-8 3-17-1ZM265 272h16v17q-8 3-16-1Z',c,'stroke-width=".8"');
        for(let y=250;y<309;y+=18)s+=button(256,y,'#7e644a',1.8);
      }
    }else if(item.slot==='bottom'){
      if(['trousers','culottes','shorts'].includes(k)){
        const y=k==='shorts'?383:k==='culottes'?491:550,w=k==='culottes'?4:0;
        const shape=`M225 306Q254 314 282 306Q289 327 288 358L${291+w} ${y-7}Q276 ${y+3} 260 ${y-2}L254 354 246 ${y-2}Q230 ${y+4} ${213-w} ${y-5}L217 353Q218 325 225 306Z`;
        s+=cloth(shape,c,p,item.id,shadow(`M253 331 254 354 246 ${y-2}l-9 1 7-${y-364}ZM279 324 286 353l${5+w} ${y-360}-10 5-9-${y-362}Z`,c,.72)+glow(`M226 335q9 9 13 2l-8 ${y-345}-12 0Z`,c,.36));
        s+=path('M225 306q29 8 57 0l3 13q-31 8-62-1Z',mix(c,.08,'#8b7a59'))+button(256,314,'#746448',1.8);
        s+=fold(`M254 324v29M228 328q-1 14-9 19m62-19q0 15 7 21M219 ${y-12}q11 4 23 0m22 0q11 4 22-1`,c);
        if(k==='trousers')s+=fold('M236 355q-5 80-7 174m43-173q8 87 7 175',c,.55);
        if(k==='shorts')s+=path('M215 370q15 7 31 2l-1 10q-17 5-32-2ZM259 373q15 3 31-3l1 10q-16 7-31 2Z',light(c),'stroke-width=".7"');
      }else{
        const y=k==='scallop'?482:501;
        const shape=k==='scallop'?'M224 307q30 8 60 0Q288 368 318 476q-4 13-16 6-8 13-19 3-11 14-22 1-11 13-23 0-11 11-21-2-13 10-22-3Q214 382 224 307Z':`M224 307q30 8 60 0Q290 384 322 ${y-8}q-13 12-30 8-18 8-37 3-19 6-35-1-18 5-30-8Q214 385 224 307Z`;
        let detail=skirtFolds(c,y,k==='pleats'||k==='check');
        if(['check','floralSkirt'].includes(k))detail+=path(shape,`url(#${p}${k==='check'?'check':'flowers'})`,'stroke="none" opacity=".72"');
        s+=cloth(shape,c,p,item.id,detail)+path('M224 306q30 8 60 0l1 14q-33 8-62-1Z',mix(c,.08,'#69775b'))+fold('M226 316q27 6 57 0',c,.7);
        s+=line(`M195 ${y-9}q27 9 57 8t64-10`,`stroke="${light(c)}" stroke-width="1.8"`);
        if(k==='midi')s+=fold('M254 325q-4 91 2 169m-27-131-10 49m63-57 14 52',c,.55);
        if(k==='scallop')for(let i=0;i<6;i++)s+=flower(209+i*18,467+Math.sin(i)*3,2.6);
      }
    }else if(item.slot==='dress'){
      const evening=['velvet','stars'].includes(k),hem=evening?549:k==='petal'?485:509;
      const shape=`M228 198 208 204Q199 207 194 218L185 239q-3 8 4 12l17 7q9-1 12-17l5-7 4 71Q222 382 187 ${hem-10}q15 13 34 9 15 8 34 4 22 6 39-3 18 3 30-10Q289 382 281 306l6-72 6 11q3 12 12 10l17-8q7-3 3-10l-12-22q-4-9-13-12l-22-5q-25 17-50 0Z`;
      let detail=sleeveShading(c,true)+skirtFolds(c,hem,false)+shadow('M222 241q10 30 6 61l10 4q-5-34-2-55Z',c,.55);
      if(['tea','petal'].includes(k))detail+=path(shape,`url(#${p}flowers)`,'stroke="none" opacity=".7"');
      s+=cloth(shape,c,p,item.id,detail)+neckline();
      s+=fold('M199 215q-5 17-2 30m110-29 9 24M230 267l4 26m40-27-2 25',c,.55);
      if(k==='pinafore'){
        s+=path('M228 198 208 204q-10 3-14 14l-9 21q-3 8 4 12l17 7q9-1 12-17l8-9 5 34h47l5-35 10 14q3 12 12 10l17-8q7-3 3-10l-12-22q-4-9-13-12l-22-5q-25 17-50 0Z','#eee0be');
        s+=path('M225 203h10l2 55q17 7 32 0l3-55h10l-2 105q-28 8-51-1Z',c)+path('M240 271q14 4 27 0v18q-14 11-27 0Z',light(c),'stroke-width=".8"')+button(232,249,'#c4aa76')+button(275,249,'#c4aa76');
        s+=fold('M240 263q15 3 25 0m-28 39 33 1',c);
      }
      if(k==='shirtDress'){
        s+=path('M228 197q15 10 26 21l-14 13-16-24M278 197q-13 10-24 21l15 13 14-24Z',light(c))+fold('M255 225v276',c,.75);
        for(const y of [242,265,288,340,374,411,448,483])s+=button(259,y,'#d4c9aa',1.7);
        s+=path('M268 245h12v18q-5 4-12 0Z',c,'stroke-width=".7"');
      }
      if(evening){
        s+=path('M228 198q26 24 50 0l5 13q-30 24-58-1Z',mix(c,.16,'#404d66'))+line('M228 204q27 22 50-1','stroke="#c8c4aa" stroke-width="1.3"');
        s+=glow(`M251 326q-11 75-13 ${hem-333}l22 1q-4-101 0-${hem-330}Z`,c,.12);
      }
      s+=path('M227 303q26 7 54 0l2 10q-29 8-57 0Z',evening?'#beb69b':mix(c,.14,'#8c785b'));
      s+=path('M256 309q-21-14-23-2 5 10 21 5-4 11-9 22l11-5 8 5-6-21q22 7 22-7-8-8-24 3Z',evening?'#c8bea2':mix(c,.12,'#8e7b61'))+line('M238 308l14 3m9 0 13-5','stroke="#e8d5ad" stroke-width=".65"');
      if(k==='stars')for(let i=0;i<14;i++)s+=star(210+i%4*27,360+Math.floor(i/4)*48,2.7,'#e2d8b3');
      if(k==='linenDress')s+=path('M211 372q12 2 24 0l-3 28q-13 7-24-2ZM276 372q10 2 23 0l4 26q-13 10-24 2Z',light(c),'stroke-width=".8"')+fold('M215 378h15m51 0h14',c);
      if(['tea','petal','linenDress'].includes(k)){
        s+=line(`M193 ${hem-13}q57 16 125-2`,`stroke="${light(c)}" stroke-width="2.5"`);
        if(k==='petal')for(let i=0;i<20;i++)s+=ellipse(195+i*6.2,hem-9+Math.sin(i/19*Math.PI)*9,1.5,1.1,'#eee4d1','stroke="none"');
      }
    }else if(item.slot==='coat'){
      const long=['trench','wool'].includes(k),y=long?448:k==='cape'?353:321;
      if(k==='cape'){
        const shape='M225 197q28 18 57 0Q306 215 317 244L342 337q-21 17-58 18l-30-118-29 118q-31 1-59-17l27-98q11-29 32-43Z';
        s+=cloth(shape,c,p,item.id,shadow('M207 220q-6 46-28 116l16 6 35-110ZM294 220l34 115-14 12-25-94Z',c,.65)+glow('M230 224 214 337l10 2 28-102Z',c,.25));
        s+=path('M225 198q-17 1-17 14l22 24 24-16 25 16 22-24q-1-13-20-16l-27 24Z',light(c))+fold('M194 294l-13 38m135-37 12 36M254 230v116',c);
        for(const y of [248,274,300])s+=button(257,y,'#b7ac78');
        s+=line('M174 338q25 12 49 10m62 0q26-1 48-12',`stroke="${light(c)}" stroke-width="1.2"`);
      }else{
        const shape=`M226 195 205 202q-17 5-19 25l-15 84q-4 12 3 16l20 4 23-76-8 ${y-259}q16 13 39 5l4-${y-232}ZM279 195l23 8q15 5 17 24l17 84q3 12-4 16l-22 4-23-76 12 ${y-258}q-14 11-39 4l-5-${y-232}Z`;
        s+=cloth(shape,c,p,item.id,sleeveShading(c,false)+shadow(`M221 253 222 ${y-10}l25 7-2-17-14-5-2-${y-266}ZM282 253l7 ${y-267}-12 7 3 12 18-5Z`,c,.55));
        s+=path('M226 195q8 21 26 38l-22 31-7-24-12-10ZM279 195q-8 22-24 38l23 31 7-24 12-10Z',k==='wool'?mix(c,.3):light(c));
        s+=fold(`M222 239 216 ${y-17}m68-${y-256} 10 ${y-256}M194 274l9-6m-12 14 10-6m109-1 12 7`,c);
        s+=path(`M216 ${y-54}q11 4 23 1l-2 25q-12 4-23-1ZM272 ${y-53}q11 3 22-2l3 26q-12 6-23 1Z`,mix(c,.05),'stroke-width=".8"');
        if(k==='trench'){
          s+=path('M211 307q16 6 37 6l1 11q-22 1-39-6M260 313q17-2 31-7l2 12q-16 6-33 6Z','#b59a72');
          s+=rect(237,313,9,10,'none','rx="1" stroke="#e2cda2" stroke-width="1.7"');
          for(const y of [271,293,348,377])s+=button(239,y,'#8f7957',2.2);
          s+=path('M202 205l18-6 3 6-21 6M285 200l17 5-2 6-18-7',light(c),'stroke-width=".7"');
        }else for(const y of [275,300])s+=button(240,y,k==='wool'?'#866950':'#c5b48d',2.3);
        if(k==='bolero')s+=path('M211 313q18-5 33 0l-4 10q-16 2-28-2M265 313q18-5 31-1l1 9-28 4Z',light(c),'stroke-width=".75"');
        if(k==='jacket')s+=path('M210 237h28v17l-14 6-14-6ZM271 237h25v17l-12 6-12-6Z',light(c),'stroke-width=".8"')+button(224,249,'#7a8062',1.5)+button(284,249,'#7a8062',1.5);
      }
    }else if(item.slot==='socks'){
      const y=k==='tights'?333:513,shape=`M218 ${y}l25 2-8 ${574-y}q-6 6-17-1ZM265 ${y}l25-2-1 ${574-y}q-9 6-17-1Z`;
      s+=cloth(shape,c,p,item.id,shadow(`M235 ${y}h8l-8 ${574-y}-8 2ZM283 ${y}h7v${574-y}l-8 1Z`,c,.4));
      if(k!=='tights'){
        s+=path('M218 512q12 5 25 0l-1 8q-13 4-24 0ZM265 513q13 4 25-1v8q-12 5-24 0Z',light(c),'stroke-width=".7"');
        for(let i=0;i<4;i++)s+=fold(`M${221+i*5} 525l-2 37m${49-i*5} -37 2 37`,c,.4);
      }
      if(k==='laceSocks')for(let i=0;i<5;i++)s+=ellipse(220+i*5,513,2.8,2.8,'#f7ecdb','stroke-width=".5"')+ellipse(267+i*5,513,2.8,2.8,'#f7ecdb','stroke-width=".5"');
    }else if(item.slot==='shoes'){
      const boot=k==='boots',ankle=k==='ankle',y=boot?505:ankle?545:565;
      const shape=`M212 ${y}q16 5 32 0L243 565q0 12 5 20l-2 13q-19 4-39 1-12-2-4-12L207 579Q210 574 209 566Z`;
      let shoe=cloth(shape,c,p,item.id,shadow(`M236 ${y+4}l7-1v62q0 12 5 20l-2 13-10 1q6-11 0-24Z`,c,.7)+glow(`M217 ${y+10}h5l-1 ${Math.max(1,563-y-10)}-4 4Z`,c,.4));
      shoe+=path('M203 592q20 5 44 1l-1 6q-20 4-39 0-6-1-4-7Z',mix(c,.22,'#665a49'),'stroke-width=".8"');
      if(boot||ankle)shoe+=path(`M212 ${y}q16 5 32 0v7q-16 5-32 0Z`,light(c),'stroke-width=".7"')+fold(`M237 ${y+13}v${Math.max(0,558-y-13)}M217 579q12-3 21 3`,c,.85)+path(`M237 ${y+19}h7v11h-7Z`,shade(c),'stroke-width=".6"')+rect(238,y+21,5,6,'none','stroke="#cabb91" stroke-width=".8"');
      if(k==='mary')shoe+=path('M218 565q10 12 21 0l-1 10q-8 7-19 0Z',foot,'stroke-width=".7"')+line('M220 577l17-3',`stroke="${shade(c)}" stroke-width="3.7"`)+rect(233,574,5,4,'#c8b17a','rx="1" stroke-width=".5"')+fold('M210 587q11-6 25 0',c);
      if(k==='sneakers'){
        shoe+=path('M204 585q13-9 22-3l2 10q-17 1-25-3Z','#f3e9d4','stroke-width=".65"');
        for(let y=571;y<583;y+=4)shoe+=line(`M221 ${y}l13 2m-11-1 9-4`,'stroke="#fbf4e3" stroke-width="1.2"');
        shoe+=fold('M238 570l3 17',c,.7);
      }
      if(k==='ballet')shoe+=path('M218 565q10 16 21 0l-1 13q-10 7-19 0Z',foot,'stroke-width=".6"')+path('M226 582q-16-11-12 0 9 5 12 0 12-13 12-3-6 8-12 3',mix(c,.14,'#986d66'),'stroke-width=".75"');
      if(k==='sandals')shoe+=path('M218 565q13 3 20 0l-5 15-18 7 5-13Z',foot,'stroke-width=".7"')+line('M216 584l18 5M220 569l16 8',`stroke="${shade(c)}" stroke-width="5"`)+line('M216 583l18 5M220 568l16 8',`stroke="${light(c)}" stroke-width="2"`);
      // A mirrored pair uses a separate clipping id to keep every SVG id unique.
      s+=shoe+group(shoe.replaceAll(p+item.id+'-fabric',p+item.id+'-right-fabric'),'transform="translate(508 0) scale(-1 1)"');
    }
    return group(s,'stroke="#776e56" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"');
  }

  function accessory(item,part='front'){
    if(!item)return '';const c=colorOf(item),k=item.kind;let s='';
    if(k==='umbrella'){
      if(part==='back')s+=path('M348 57q-89 0-134 99 26-16 47 4 24-22 48-5 25-19 50-3 23-19 48-4 22-22 48-9-29-85-107-82Z',c,'fill-opacity=".56" stroke="#889d93" stroke-width="1.4"')+line('M348 57q-74 26-87 103m87-103q-37 36-39 98m39-98q14 37 11 95m-11-95q49 30 59 91M347 47l2 10','stroke="#8a9c91" stroke-width="1.2"')+line('M345 62 324 339','stroke="#828b7d" stroke-width="3"')+line('M335 69 281 139m64-67 19 66','stroke="#fffdf2" opacity=".6" stroke-width="4"');
      else s+=line('M324 334l-1 18q0 20 14 11 5-3 3-9','stroke="#897a61" stroke-width="5"');
    }else if(part==='back')return '';
    if(k==='beret')s+=path('M202 103q-19-25 28-41 38-12 63 14l3 28q-48 8-94-1Z',c)+shadow('M205 95q43-18 86-5l5 14q-49 9-94-1Z',c,.65)+glow('M209 82q28-20 52-15l13 5q-38-3-65 10Z',c,.4)+path('M211 102q37-9 80-2l-1 8q-43-5-78 1Z',shade(c))+line('M252 63l3-9m-42 34q30-17 61-12','stroke="#806e5d"');
    if(k==='straw')s+=ellipse(253,103,70,13,c)+path('M215 100 222 69q31-16 59 1l8 30Z',c)+path('M216 92q35 9 71 0l2 8q-36 10-74 0Z','#a1ad8c')+line('M225 77q26 9 53 0m-57 8q30 7 60 0','stroke="#b5a081"');
    if(k==='bow')s+=path('M283 95q-34-33-36-8 6 21 33 13 30 13 35-12-2-25-32 7Z',c)+ellipse(281,98,5,8,c)+line('M275 99l-12 26 14-5 4 7 4-23');
    if(k==='leafClip')s+=path('M285 115q-4-25 13-24 9 15-13 24 26-20 29-4-8 17-29 4Z',c)+line('M284 115l23-10');
    if(k==='starClip')s+=star(288,111,10,c)+line('M282 119l-9 7','stroke="#aa9b79" stroke-width="3"');
    if(k==='scarf')s+=path('M229 188q24 16 50-1l6 21q-29 18-61-1Z',c)+path('M257 208 282 207l3 71-25 5Z',c)+line('M231 198q24 13 49 0m-17 75h19m-19 3v11m6-12v11m5-12v11m6-12v10','stroke="#8f7d6c"');
    if(k==='ribbon')s+=path('M228 193q25 15 52 0l-4 11q-24 12-45-1Z',c)+path('M258 205q-31-9-20 10l17-6-10 31 12-5 7 5-4-30q26 20 23 1l-25-6Z',c);
    if(k==='pearl')for(let i=0;i<12;i++)s+=ellipse(230+i*4.4,201+Math.sin(i/11*Math.PI)*11,2.6,2.6,c);
    if(['satchel','tote','purse'].includes(k)){
      const bagx=k==='tote'?302:303;
      s+=line(`M216 210q60 45 ${bagx+18-216} 124`,'stroke="#7c7663" stroke-width="7"')+line(`M216 210q60 45 ${bagx+18-216} 124`,`stroke="${c}" stroke-width="5"`);
      s+=path(k==='tote'?'M298 330q25 4 53-1l-4 68q-26 11-48 1Z':'M295 329q26-7 54 0l3 46q1 9-9 12-24 7-42-3-4-3-4-8Z',c)+shadow(k==='tote'?'M343 334l7-4-3 67q-24 11-48 1l-1-8q24 12 44 0Z':'M344 330l5-1 3 46q1 9-9 12-24 7-42-3l-3-8q25 12 46 1Z',c,.75)+path('M305 328q-4-28 16-28t19 28','none','stroke-width="3"');
      if(k==='satchel')s+=path('M295 329q26-7 54 0l-2 24q-23 17-51 0Z',c)+rect(319,345,9,14,'#d7c79f','rx="2"')+line('M302 375q21 6 43 0','stroke="#7e7964"');
      if(k==='tote')s+=path('M310 351q15-20 27 0l-5 22-18-2Z','#b1bba0')+line('M323 356v13m0-6-7-4m7 0 6-5');
      if(k==='purse')s+=path('M296 330q28-7 53 0l-24 27Z',c)+ellipse(325,356,3,3,'#d6c7a5');
    }
    if(k==='book')s+=group(path('M315 317h36v55h-36Z',c)+path('M316 320h30v48h-30Z','#e8dfc8')+path('M313 315h33v52h-33Z',c)+line('M318 326h22m-22 6h22m-22 20h16','stroke="#ded7bb"'), 'transform="rotate(-12 324 345)"');
    if(k==='bouquet'){
      s+=path('M306 322 341 319l-7 43h-13Z','#d5c5aa')+line('M329 346l-15-56m15 56 7-63m-7 63 20-49','stroke="#829574" stroke-width="2"');
      for(const [x,y] of [[313,291],[336,283],[349,298],[330,306],[314,310]])s+=flower(x,y,9);
      s+=path('M321 346q10-7 16 0m-9 0-10 21m13-22 10 18','none','stroke="#ae8d83" stroke-width="2"');
    }
    if(k==='straw'){
      for(const y of [76,81,86])s+=line(`M221 ${y}q29 8 61 0`,`stroke="${shade(c)}" stroke-width=".5" opacity=".65"`);
      s+=line('M187 104q68 21 131-1',`stroke="${shade(c)}" stroke-width=".65"`)+path('M287 97q24-14 22 0-9 10-22 2l7 22-8-5-5 4 1-21Z','#a3b08d','stroke-width=".8"');
    }
    if(k==='bow')s+=glow('M253 85q10-4 23 9l-17-1Z',c,.65)+fold('M255 94l18 4m16 0 16-7',c)+shadow('M279 99l3 24-6-3-2 2 1-20Z',c,.55);
    if(k==='leafClip')s+=line('M290 99l-2 11m17-2-14 5',`stroke="${light(c)}" stroke-width=".75"`);
    if(k==='scarf'){
      s+=shadow('M275 213l7-5 3 70-9 3Z',c,.7)+glow('M234 192q21 12 42 0l2 6q-22 13-42 1Z',c,.5);
      for(const x of [263,267,271])s+=line(`M${x} 220v49`,`stroke="${light(c)}" stroke-width=".55"`);
      s+=fold('M232 202q19 13 46 0',c,.5);
    }
    if(k==='ribbon')s+=fold('M233 198q18 10 40 0m-34 12 13-4m10 5 14 5m-19-1-6 17',c);
    if(k==='pearl')for(let i=0;i<12;i++)s+=ellipse(229.5+i*4.4,200.2+Math.sin(i/11*Math.PI)*11,.8,.8,'#fffae9','stroke="none"');
    if(['satchel','tote','purse'].includes(k)){
      s+=line(k==='tote'?'M303 339v51q19 8 38 0l4-49':'M301 337l2 38q20 8 42 0l-2-36',`stroke="${light(c)}" stroke-width=".8" stroke-dasharray="1.4 2.2"`);
      if(k==='satchel')s+=line('M301 332q22-6 43 0l-1 19q-20 14-40 0Z',`stroke="${light(c)}" stroke-width=".65" stroke-dasharray="1.5 2"`)+rect(320,348,7,8,'none','stroke="#90784f" stroke-width=".7" rx="1"');
      if(k==='tote')s+=fold('M304 336l2 18m37-18-4 17',c,.6);
    }
    if(k==='book')s+=group(line('M348 324v39m-2-34 2 2m-2 8 2 1M318 320h24','stroke="#ece1c2" stroke-width=".7"')+path('M333 315h5v13l-3-2-2 3Z','#bd8c7e','stroke-width=".5"'),'transform="rotate(-12 324 345)"');
    return group(s,`stroke="${ink}" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"`);
  }
  function sticker(id){let s='';
    if(id==='pressedFlowers')s+=group(line('M46 589q17-26 14-68m-10 56-13-21m18 9 21-12','stroke="#8a9b77" stroke-width="2"')+flower(60,520,12)+flower(38,549,8)+flower(77,549,9)+path('M30 575l53 10-4 13-52-11Z','#e6ceafd0','stroke="none"'),'transform="rotate(-9 60 560)"');
    if(id==='postage')s+=group(rect(416,515,73,89,'#f5f0dd','stroke="#a3b9a8" stroke-dasharray="3 4" stroke-width="4"')+rect(425,524,55,59,'#c6d5bd')+path('M430 575 443 552l13 15 11-19 8 27Z','#92a388')+ellipse(442,538,7,7,'#eee5c4')+line('M430 593h43','stroke="#a2aa91"'),'transform="rotate(9 450 560)"');
    if(id==='littleCat')s+=group(path('M419 583q-25-28-9-55l11 8 13-10q23 21 10 47 29-1 24 16h-49Z','#c4af91')+line('M418 550l2 1m13-2 2 1m-10 9 3 2 3-3m-9 11 10 0m31 16q24-21 13-36','stroke="#7e7562"')+ellipse(425,582,14,9,'#e6d4b8'),'stroke="#8e836b"');
    if(id==='sparkles')s+=star(62,455,13)+star(445,225,14)+star(425,577,10)+star(94,204,7)+line('M61 437v-8m-20 26h-7m411-251v-8','stroke="#baa976"');
    return group(s,'stroke="#999a7e" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"');
  }
  function doll(outfit,p){const get=slot=>E.byId[outfit[slot]],h=get('hair');let s='';
    s+=ellipse(257,601,79,10,'#74806c','opacity=".13" stroke="none"');
    if(get('prop'))s+=accessory(get('prop'),'back');
    s+=hair(h,'back')+body(outfit.skin,p);
    for(const slot of ['socks','shoes','top','bottom','dress','coat'])if(get(slot))s+=garment(get(slot),p,outfit.skin,slot==='shoes'?get('socks')?.fill:null);
    if(get('neck'))s+=accessory(get('neck'));
    if(get('bag'))s+=accessory(get('bag'));
    s+=hair(h,'front');
    for(const slot of ['hat','prop'])if(get(slot))s+=accessory(get(slot));
    // Hands sit above sleeves, bag straps, and held objects.
    s+=hands(outfit.skin);
    return group(s);
  }
  function render(outfit,options={}){const p='pw'+(++serial)+'-';const text=options.caption||'';
    const content=scene(outfit.background,p)+doll(outfit,p)+sticker(outfit.sticker);
    if(options.postcard){
      return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="1440" viewBox="0 0 520 720">${defs(p)}${rect(0,0,520,720,'#f7f3e6','stroke="none"')}${group(content,'transform="translate(16 16) scale(.938)"')}${rect(16,16,488,601,'none','stroke="#bdc5b1"')}${path('M198 4h125l-5 23-116-4Z','#d5dcc1','opacity=".8" stroke="none"')}<g fill="#59684e" font-family="Georgia, Microsoft YaHei, sans-serif" text-anchor="middle"><text x="260" y="649" font-size="22">${esc(options.title||'')}</text><text x="260" y="676" font-size="11">${esc(text)}</text><text x="260" y="702" font-size="10" letter-spacing="2">${esc(options.date||'')}  ·  BOOPLAND</text></g>${star(42,653,8)}${star(476,653,8)}${rect(0,0,520,720,`url(#${p}grain)`,'stroke="none"')}</svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 640" aria-hidden="true">${defs(p)}${content}</svg>`;
  }
  const boxes={hair:'180 40 165 230',top:'163 185 180 150',bottom:'180 290 150 276',dress:'178 183 158 380',coat:'155 150 195 315',shoes:'199 493 125 115',socks:'203 330 98 255',hat:'177 44 150 100',neck:'213 176 90 118',bag:'284 291 78 115',prop:'300 282 68 100',background:'0 0 520 640',sticker:'12 492 100 120'};
  function thumbnail(item){const p='pwt'+(++serial)+'-';let content='',box=boxes[item.slot];
    if(item.slot==='hair')content=hair(item,'back')+hair(item,'front');
    else if(item.slot==='background')content=scene(item.id,p,true);
    else if(item.slot==='sticker'){content=sticker(item.id);box=item.id==='pressedFlowers'?boxes.sticker:'390 500 115 115';if(item.id==='sparkles'){content=star(50,44,18)+star(23,78,8)+star(82,20,7);box='0 0 100 100';}}
    else if(item.slot==='prop'&&item.kind==='umbrella'){content=accessory(item,'back')+accessory(item);box='195 38 275 340';}
    else if(['hat','neck','bag','prop'].includes(item.slot))content=accessory(item);
    else content=garment(item,p);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="thumb" viewBox="${box}" aria-hidden="true">${defs(p)}${content}</svg>`;
  }
  const iconPaths={hair:'M6 24Q1 5 16 4t10 20l-5 1-1-11q-7 0-11-5l-3 16Zm4-8q1 10 6 10t6-10',top:'m10 7-6 2-3 11 7 2 2-7v13h12V15l2 7 7-2-3-11-6-2q-6 5-12 0Z',bottom:'M9 5h14l6 23H3Zm0 4h14M12 12 9 25m7-13v14m4-14 3 13',dress:'m11 4-5 2 1 7 4-1-1 5-7 12h26l-7-12-1-5 4 1 1-7-5-2q-5 4-10 0Z',coat:'m11 4-6 3-4 16 6 2 3-13-2 16h7V12Zm10 0 6 3 4 16-6 2-3-13 2 16h-7V12Z',feet:'M9 4h11v15l8 5v4H5V17h4Zm0 4h11M5 25h22',accessory:'M7 12q0-10 9-10t9 10M4 12h24v16H4Zm0 0 12 9 12-9m-14 9h4',scene:'M3 5h26v23H3Zm1 18 8-10 7 8 4-5 6 8M22 9h.1'};
  function icon(category){return `<svg viewBox="0 0 32 32" aria-hidden="true">${path(iconPaths[category]||iconPaths.scene)}</svg>`;}
  window.WardrobeArt={render,thumbnail,icon,skinColors,escape:esc};
})();
