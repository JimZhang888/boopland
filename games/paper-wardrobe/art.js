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
  const skinColors=['#efd0b5','#d9aa87','#ad795b'];
  function body(skin=0){const c=skinColors[skin];return group(
    path('M225 309q-7 47-9 86l5 150-8 31q2 10 15 7l9-16 8-116 10-88 7 89 10 115 9 17q16 3 16-6l-8-34 3-149q-1-51-15-86Z',c)+
    path('M227 197q-24 3-35 27l-12 71-10 60q-4 9 0 14 4 5 7 0l4-14 5 8q5 4 6-3l-3-16 18-48 20-53 3 77q25 14 52 0l-1-77 22 55 17 45-1 16q2 8 6 2l3-9 5 15q5 5 8-1 1-6-3-15l-10-59-15-69q-7-24-31-28l-4-34h-40Z',c)+
    path('M237 165v28q17 17 35-1v-30','#c29273','opacity=".3" stroke="none"')+
    path('M209 128q0-57 44-57t43 57l-7 32q-14 30-37 30t-36-30Z',c)+
    ellipse(212,140,6,11,c)+ellipse(293,140,6,11,c)+
    path('M218 139q4 44 34 47 29-4 37-41','none','stroke="#c19679" stroke-width=".75"')+
    line('M228 133q6-4 12-1m27 0q6-3 12 1','stroke="#6b5347" stroke-width="1.6"')+
    ellipse(235,143,2.5,3.3,'#554a41','stroke="none"')+ellipse(273,143,2.5,3.3,'#554a41','stroke="none"')+
    line('M250 147l-2 11 4 1m-5 11q7 5 14-1','stroke="#a97660" stroke-width="1"')+
    ellipse(228,157,8,4,'#d68e7c','opacity=".35" stroke="none"')+ellipse(279,157,8,4,'#d68e7c','opacity=".35" stroke="none"')+
    path('M226 202q29 14 54 0l3 104q-27 12-53-1Z','#f1e5cf')+line('M233 204l-5 102m45-102 7 102','stroke="#cebea4"')+
    path('M227 308h54l-1 29-22-7-28 7Z','#f1e5cf'),`stroke="${ink}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"`);}
  function hair(item,part){const c=item.fill,k=item.kind;let s='';
    if(part==='back'){
      if(['waves','pony','braid','ribbonBraid'].includes(k))s+=path('M207 104q-12 47-4 93l-8 45q16 19 34 2l7-89h36l4 89q26 15 39-5l-13-55q10-85-25-110-40-24-70 30Z',c);
      else if(k==='bob')s+=path('M205 109q-8 35 0 80 14 13 30 3l2-37h34l2 37q19 9 30-5 9-43-3-78Z',c);
      if(k==='pony')s+=path('M286 111q43-30 48 6 3 24-12 55t1 78q-40-6-26-52t-11-87Z',c);
      if(k==='bun')s+=path('M224 83q-21-31 9-36t36 10q29 18 7 32Z',c)+line('M232 55q-12 17 14 27m14-25q18 13 3 27','stroke="#a08a72"');
      if(['waves','braid','ribbonBraid'].includes(k))s+=line('M211 136q-10 38 4 65t-9 33m88-100q10 38-2 65t9 33','stroke="#a68b71" stroke-width="1.2"');
    }else{
      s+=path(k==='pixie'?'M207 144q-18-57 33-70 47-8 64 44l-11 30-8-32q-26 12-44-8-4 19-24 23l-1 17Z':'M208 148q-14-70 35-76 52-8 62 45l-12 42-7-41q-22-2-48-21-5 24-22 33l-1 26Z',c);
      s+=line('M219 105q15-24 40-22m-28 16q17 20 49 23M222 119l-6 19m73-38 9 23','stroke="#c0a087" stroke-width="1" opacity=".6"');
      if(k==='waves')s+=path('M211 140q-8 36 7 58t-4 48q27 1 23-24t-12-50l-5-44M291 140q11 34-5 61t6 43q-28 4-22-24t12-49l4-42',c)+line('M220 176q-8 24 6 42m60-39q5 20-4 39','stroke="#c0a087"');
      if(['braid','ribbonBraid'].includes(k)){
        for(let i=0;i<6;i++)s+=ellipse(286+(i%2?2:-2),169+i*13,8-i*.5,10,c,`transform="rotate(${i%2?25:-25} 286 ${169+i*13})"`);
        s+=path('M280 248l12 0-6 14Z',c)+path('M286 244q-25-14-13-20l14 15q24-20 23-3l-20 6Z',k==='ribbonBraid'?'#c2a0a5':'#b1bc9c');
      }
      if(k==='pony')s+=path('M295 111q16-9 14 4l-12 6Z','#d0b8a8');
    }
    return group(s,`stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`);
  }
  const topShape='M226 198 204 202q-12 4-15 22l-14 93 22 5 21-77 6 72q30 10 60 0l5-72 22 77 22-5-16-93q-3-16-16-22l-22-5q-25 17-53 1Z';
  const shortTop='M226 198 204 202l-18 44 24 11 11-18 3 78q30 10 60 0l5-78 12 18 25-11-20-44-27-5q-25 17-53 1Z';
  const neckline=()=>line('M226 199q27 23 53-1','stroke="#857d67" stroke-width="1.2"');
  function garment(item,p,skin=0,sockColor=null){const c=item.fill,k=item.kind,foot=sockColor||skinColors[skin];let s='';
    if(item.slot==='top'){
      const short=['blouse','embroidered','sailor','shirt'].includes(k),shape=short?shortTop:topShape;
      s+=path(shape,k==='vest'?'#e8dfcc':c);
      if(['cable','stripe'].includes(k))s+=path(shape,`url(#${p}${k==='cable'?'knit':'stripe'})`,'stroke="none"');
      s+=neckline()+line('M225 309q28 7 58 0','stroke="#8e8b77"');
      s+=line(short?'M189 241l20 8m94 0 18-8':'M185 300l16 5m105-1 18-4','stroke="#8e8b77"');
      if(k==='cable')s+=line('M230 211v92m12-91q-8 8 0 16t0 16t0 16t0 16t0 16m24-80q-8 8 0 16t0 16t0 16t0 16t0 16m12-81v92','stroke="#a89e85" stroke-width="1.4"')+path('M224 198q29 18 58-1l-4 12q-24 16-49 0Z','#d3c8ae');
      if(k==='cardigan')s+=path('M226 198 250 240l5 76h-31l-5-72-4 43-24-8 13-77ZM279 198 257 240l-2 76h28l6-72 8 44 25-9-16-77Z',c)+line('M253 239v69M228 279h16v14h-16m39-14h14v14h-14')+[249,267,286,303].map(y=>ellipse(255,y,2,2,'#7e846b')).join('');
      if(k==='sailor')s+=path('M226 197 254 224l25-27 13 12-37 34-40-33Z','#889da7')+line('M221 209 254 235l32-27','stroke="#ede9d8" stroke-width="2"')+path('M251 235l-7 28 12-5 9 5-7-28Z','#aebaa5');
      if(['blouse','embroidered','shirt'].includes(k)){
        s+=path('M228 197 253 215l-15 15-14-23M278 197 253 215l15 15 15-23Z','#f1e7d4')+line('M254 217v94');
        for(let y=237;y<310;y+=19)s+=ellipse(258,y,1.6,1.6,'#a2957a');
        if(k==='blouse')s+=path('M254 219q-20-13-19-1l19 6q23-15 22-1l-22 3m-2-1-6 21m10-21 9 21','#c29f97');
        if(k==='embroidered')for(let i=0;i<4;i++)s+=flower(232+(i%2)*41,253+Math.floor(i/2)*30,4);
        if(k==='shirt')s+=path('M264 242h15v20q-7 6-15 0Z','none');
      }
      if(k==='vest')s+=path('M226 200 252 234l27-35 10 39-6 78q-30 8-59 0l-4-79Z',c)+line('M228 207 252 241l27-33M232 269h16v16h-16m33-16h15v16h-15M253 241v68')+path('M222 204 205 203l-10 34 24 9M281 202l25 2 12 33-30 9','#ece3cf');
    }else if(item.slot==='bottom'){
      if(['trousers','culottes','shorts'].includes(k)){
        const y=k==='shorts'?380:k==='culottes'?490:549;
        s+=path(`M225 306q27 9 58 0l9 ${y-313}-32 5-6-${y-351}-9 ${y-351}-32-5Z`,c)+path('M225 305q28 8 58 0l1 14q-29 8-60 0Z',c)+line(`M254 320v30M229 326q-3 17-10 20m59-20q4 16 9 20M222 ${y-8}l22 3m19 0 23-3`);
        if(k==='trousers')s+=line('M237 352l-4 176m36-176 9 176','stroke="#93816f"');
        s+=ellipse(256,313,2,2,'#746958');
      }else{
        const shape=k==='scallop'?'M225 307q30 8 58 0l35 171q-9 13-19 4-9 13-19 3-10 13-20 1-11 13-22 0-10 10-21-2-10 11-23-1Z':'M224 307q29 8 60 0l35 190q-66 17-128-1Z';
        s+=path(shape,c);
        if(k==='check'||k==='floralSkirt')s+=path(shape,`url(#${p}${k==='check'?'check':'flowers'})`,'stroke="none"');
        s+=path('M224 306q30 9 60 0l1 14q-33 9-62-1Z',c);
        if(['pleats','check'].includes(k)){for(let i=0;i<7;i++)s+=line(`M${227+i*9} 323 ${199+i*19} 491`,'stroke="#7e8c73" opacity=".55"');}
        else s+=line('M230 329q-15 73-19 146m67-146 22 148M249 334l-4 154','stroke="#8f8a78" opacity=".5"');
        s+=line('M198 489q60 13 113 0','stroke="#f1eddb" opacity=".8" stroke-width="2"');
      }
    }else if(item.slot==='dress'){
      const isNight=['velvet','stars'].includes(k),hem=isNight?548:k==='petal'?480:505;
      const shape=`M228 198 209 204l-23 44 24 12 13-25 4 75-36 ${hem-310}q63 20 131 0l-40-${hem-310} 5-75 13 25 25-12-21-44-28-7q-25 16-48 1Z`;
      s+=path(shape,c)+neckline();
      if(['tea','petal'].includes(k))s+=path(shape,`url(#${p}flowers)`,'stroke="none"');
      if(k==='pinafore')s+=path('M228 198 207 204l-20 43 23 12 17-29 4 36h47l6-36 16 29 24-13-21-42-25-7q-25 17-50 1Z','#e9dfc7')+path('M225 204h11l2 63h31l3-63h10l-1 108h-53Z',c)+path('M239 268h29v22q-13 12-29 0Z','none')+ellipse(231,250,2,2,'#737961')+ellipse(276,250,2,2,'#737961');
      if(k==='shirtDress')s+=path('M228 197 254 218l-14 13-16-26M276 197 254 218l15 13 12-26Z','#d6ddd8')+line('M255 220v279')+[241,264,287,334,369,404,439,473].map(y=>ellipse(258,y,1.8,1.8,'#777d71')).join('');
      if(isNight)s+=path('M228 198q25 23 48 0l10 38-4 71h-54l-6-71Z',c)+line('M229 213q22 18 47 0','stroke="#d2c6b3"');
      s+=path('M227 303q26 6 56 0l2 10q-30 8-59 0Z',isNight?'#b8b0a3':'#b7a58c')+path('M255 310q-21-15-22-1l21 5q26-17 23-2l-20 4m-4 0-10 26m15-26 10 22','none','stroke="#7f7a69"');
      s+=line(`M232 325 214 ${hem-13}m60-${hem-338} 27 ${hem-338}M254 343v${hem-353}`,'stroke="#6b6e69" opacity=".35"');
      if(k==='stars')for(let i=0;i<11;i++)s+=star(215+i%4*24,368+Math.floor(i/4)*52,3,'#e6dbbc');
      if(k==='linenDress')s+=path('M211 370h22v29q-11 8-22 0M278 370h23v29q-10 8-23 0','none')+line('M199 495q60 13 116 0','stroke="#f6efe0" stroke-width="3"');
    }else if(item.slot==='coat'){
      const long=['trench','wool'].includes(k),y=long?448:k==='cape'?355:320;
      if(k==='cape')s+=path('M225 195q27 20 57 0l38 45 27 105-63 14-30-123-30 123-60-14 29-107Z',c)+path('M225 196q-17 1-17 15l22 24 25-15 23 15 23-24q-1-14-20-16l-26 24Z',c)+line('M240 211 255 226l17-15M255 228v124')+[248,274,299].map(y=>ellipse(257,y,2,2,'#7e8c75')).join('');
      else{
        s+=path(`M226 195 203 201q-14 5-17 24l-16 99 26 6 24-83-13 ${y-247}q24 9 42 3l2-${y-234}ZM278 195l25 6q15 5 18 24l17 99-28 6-24-83 15 ${y-247}q-20 10-42 3l-4-${y-234}Z`,c);
        s+=path('M226 195 251 234l-22 31-5-27-12-7ZM278 195 255 234l22 31 7-27 12-7Z',k==='wool'?'#d2c0b0':c);
        s+=line(`M215 ${y-51}l22 3-2 22-24-3m62-19 22-3 4 22-25 3M176 311l23 6m108 0 25-6`,'stroke="#858873"');
        if(k==='trench')s+=path('M209 309 247 313l1 10-40-5M260 313l32-4 2 9-33 5','#b09b7e')+[273,299,350,380].map(y=>ellipse(239,y,2.7,2.7,'#8f826a')).join('');
        else s+=[276,303].map(y=>ellipse(240,y,2.4,2.4,'#8a8472')).join('');
        if(k==='bolero')s+=path('M213 313q18-6 31-1l-5 12-27-3M266 313q17-6 29-1l1 9-26 3','#b8c7cc');
        if(k==='jacket')s+=path('M211 239h25v22h-25M273 239h22v22h-22','none');
      }
    }else if(item.slot==='socks'){
      const y=k==='tights'?333:513;
      s+=path(`M218 ${y}l25 2-8 ${574-y}q-6 6-17-1ZM265 ${y}l25-2-1 ${574-y}q-9 6-17-1Z`,c);
      if(k!=='tights')s+=line('M218 520l24 2m25 0 23-2M224 526v39m9-38-5 38m47-38 4 38m5-38v38','stroke="#b9b5a3"');
      if(k==='laceSocks')for(let i=0;i<4;i++)s+=ellipse(221+i*6,513,3,3,'#f8f1df')+ellipse(269+i*6,513,3,3,'#f8f1df');
    }else if(item.slot==='shoes'){
      const boot=k==='boots',ankle=k==='ankle',y=boot?505:ankle?545:565;
      let shoe=path(`M212 ${y}q16 5 32 0L244 568q0 11 4 18l-2 14h-39q-10-2-4-12l10-8q2-2 1-12Z`,c)+line('M204 595h41','stroke="#655f51" stroke-width="2.5"');
      if(boot||ankle)shoe+=line(`M218 ${y+7}l20 1M236 ${y+13}v${Math.max(0,558-y-13)}`)+line('M220 574q7-1 14 4');
      if(k==='mary')shoe+=path('M218 565q10 12 21 0l-1 10q-8 7-19 0Z',foot)+line('M220 577l17-3','stroke="#65554b" stroke-width="4"')+ellipse(235,576,1.5,1.5,'#d1b786');
      if(k==='sneakers')shoe+=line('M220 578l15 1m-18 4 16 1m-18 4h15','stroke="#f4edde" stroke-width="2"');
      if(k==='ballet')shoe+=path('M218 565q10 16 21 0l-1 13q-10 7-19 0Z',foot)+path('M226 582q-16-11-12 0 9 5 12 0 12-13 12-3-6 8-12 3',c);
      if(k==='sandals')shoe+=path('M218 565q13 3 20 0l-5 15-18 7 5-13Z',foot)+line('M216 584l18 5M220 569l16 8','stroke="#a78e6e" stroke-width="5"');
      s+=shoe+group(shoe,'transform="translate(508 0) scale(-1 1)"');
    }
    return group(s,`stroke="${ink}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"`);
  }
  function accessory(item,part='front'){
    if(!item)return '';const c=item.fill,k=item.kind;let s='';
    if(k==='umbrella'){
      if(part==='back')s+=path('M348 57q-89 0-134 99 26-16 47 4 24-22 48-5 25-19 50-3 23-19 48-4 22-22 48-9-29-85-107-82Z',c,'fill-opacity=".56" stroke="#889d93" stroke-width="1.4"')+line('M348 57q-74 26-87 103m87-103q-37 36-39 98m39-98q14 37 11 95m-11-95q49 30 59 91M347 47l2 10','stroke="#8a9c91" stroke-width="1.2"')+line('M345 62 324 339','stroke="#828b7d" stroke-width="3"')+line('M335 69 281 139m64-67 19 66','stroke="#fffdf2" opacity=".6" stroke-width="4"');
      else s+=line('M324 334l-1 18q0 20 14 11 5-3 3-9','stroke="#897a61" stroke-width="5"');
    }else if(part==='back')return '';
    if(k==='beret')s+=path('M202 103q-17-28 29-41 37-13 62 14l3 28q-47 5-94-1Z',c)+path('M211 102q37-9 80-2l-1 8q-43-5-78 1Z','#8d7865')+line('M252 63l3-9m-42 34q30-17 61-12','stroke="#806e5d"');
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
      s+=path(k==='tote'?'M298 330h53l-4 70q-27 8-49-1Z':'M295 329q26-7 54 0l3 52q-25 13-54 1Z',c)+path('M305 328q-4-28 16-28t19 28','none','stroke-width="3"');
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
    return group(s,`stroke="${ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"`);
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
    s+=hair(h,'back')+body(outfit.skin);
    for(const slot of ['socks','shoes','top','bottom','dress','coat'])if(get(slot))s+=garment(get(slot),p,outfit.skin,slot==='shoes'?get('socks')?.fill:null);
    if(get('neck'))s+=accessory(get('neck'));
    s+=hair(h,'front');
    for(const slot of ['hat','bag','prop'])if(get(slot))s+=accessory(get(slot));
    // Hands sit above sleeves, bag straps, and held objects.
    s+=group(path('M172 340q-6 12-2 21 4 6 7-2l4-8 5 7q5 2 5-3l-4-15M321 339q-4 9 0 16 4 7 7-2l5 9q5 5 7-2l-5-22',skinColors[outfit.skin]),`stroke="${ink}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"`);
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
