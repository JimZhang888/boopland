(function (root) {
  'use strict';
  const palette = ['#b7c8bc','#d8b7a5','#c6c8a7','#bbc9d4','#dbcda9','#cdb9c8','#b8c9a6','#ddc1ad'];
  const icons = {
    camera: '<path fill="#697c75" d="M8 19h9l4-7h20l4 7h10v30H8Z"/><path fill="#a8bab0" d="M9 25h45v17H9Z"/><circle cx="32" cy="33" r="13" fill="#e3e5d4"/><circle cx="32" cy="33" r="8" fill="#748d8b"/><circle cx="34" cy="30" r="3" fill="#b8cbc3" stroke="none"/><path d="M12 14h8v5h-8Zm34 10h5m-27-9h15M9 46h12"/>',
    shirt: '<path fill="#f1e7cd" d="m21 10-15 9 7 13 8-5v29h24V27l8 5 7-13-16-9c-3 9-19 9-23 0Z"/><path d="M23 11q9 15 19 0M25 48h16M21 28v13m24-13v13M8 20l6 10m38 0 6-10"/><path stroke="#bba687" opacity=".6" d="M27 28v15m5-15v15m5-15v15"/>',
    jacket: '<path fill="#c1cbb5" d="m22 10-12 7-6 29 10 3 7-21v29h25V28l6 21 9-3-6-29-13-7-10 6Z"/><path d="m22 10 10 14 10-14M32 24v33M23 39h7v9h-7m12-9h7v9h-7M10 40l7 2m33 0 8-2"/><path fill="#eee6cc" d="m22 10 1-5h18l1 5-10 6Z"/>',
    pouch: '<path fill="#dacba5" d="M14 16q18-6 36 0l5 36q-21 8-42 0Z"/><path d="M14 22q18-6 37 0M17 17l31-1m-5 2v8l5 2 2-4-3-5M22 35q10-4 20 0v11H22Z"/><path opacity=".5" d="m17 29 2 19m30-19 2 19"/>',
    sandals: '<g transform="rotate(-12 20 30)"><path fill="#e7d4af" d="M9 12q16-13 21 3l-2 33Q18 65 8 48Z"/><path d="m10 23 10 9 8-9m-8 9v10" stroke="#a58265" stroke-width="4"/></g><g transform="rotate(12 45 35)"><path fill="#e7d4af" d="M38 16q16-13 21 3l-2 33Q47 69 37 52Z"/><path d="m39 27 10 9 8-9m-8 9v10" stroke="#a58265" stroke-width="4"/></g>',
    boots: '<path fill="#acb39a" d="m15 9 19 1-2 27 15 9v10H9V43l5-10Z"/><path fill="#d4c5a7" d="m35 15 16 1-1 22 10 8v9H48V45l-15-8Z"/><path d="M10 50h35M19 16l10 1m-10 6 9 1m-10 6 9 1m12-10 8 1m-8 5 8 1"/>',
    journal: '<path fill="#f3ebd5" d="m15 8 36 5-3 45-36-5Z"/><path fill="#b3c2c7" d="m12 7 35 5-3 43-36-5Z"/><path d="m17 8-4 43m11-28 15 2m-16 4 15 2m-10-8-2 9M42 15l-2 32"/><path fill="#cfaa95" d="m32 10 7 1-2 14-3-3-4 2Z"/>',
    shell: '<path fill="#e4c8b2" d="M31 53 8 27q-1-8 7-9 1-10 11-7 7-9 14-2 11-2 13 8 11 3 6 14L37 53Z"/><path d="M31 49 16 21m17 27-8-34m10 34 3-35m-1 35 14-28M28 53l-2 6h16l-3-6"/>',
    glasses: '<path fill="#859b98" d="M8 24h20l-2 17q-16 10-19-6Zm28 0h20l1 11q-3 16-19 6Z"/><path d="M28 29q4-5 8 0M7 28 3 19m54 9 4-9"/><path stroke="#c7d5ca" d="m11 29 8-1m21 1 8-1"/>',
    towel: '<path fill="#e7d9b7" d="m9 12 43-3 4 44-43 4Z"/><path fill="#c7d1c4" stroke="none" d="m10 20 43-3 1 8-43 3Zm2 19 43-3 1 8-43 3Z"/><path d="m10 12 4 43M16 56v5m5-6v5m5-6v5m5-6v5m5-6v5m5-6v5m5-6v5m5-6v5"/>',
    scarf: '<path fill="#d5bca8" d="M10 11h23v21l20-9 6 16-30 16-17-9Z"/><path d="M17 12v30l13 7 24-13M24 12v24m-11 9 7 2m15-4 2 6m6-11 3 6m5-10 3 6M11 13l20-1M12 47l-2 7m8-5-1 7m8-5v7"/>',
    bottle: '<path fill="#bbc9c4" d="M24 11h17v9l6 8v25q-15 8-30 0V28l7-8Z"/><path fill="#e8dabb" d="M24 7h17v10H24Z"/><path d="M18 33h28v13H18m8-9h12m-8-4v13M22 51h7m15-24 2 3"/>',
    hat: '<path fill="#e6d6b2" d="M9 35q-12 22 25 24 40-4 23-25ZM17 34q3-27 16-26 18-2 20 27c-14 11-25 11-36-1Z"/><path d="M18 27q17 9 33 0m-32 5q17 9 33-1M9 42q23 19 47 0M29 13l-4 10m9-10-2 12"/>',
    leaf: '<path fill="#bccca6" d="M50 9Q14 2 12 34q8 30 32 2Z"/><path d="M11 56 39 19m-21 28-1-17m8 7 16-4m-8-6-1-10"/>',
    souvenir: '<path fill="#d7c0ad" d="M24 52h18v7H24Z"/><path fill="#e7d7b8" d="m32 6 9 16 17 4-12 13 1 18-15-8-15 8 1-18L5 26l18-4Z"/><path d="m32 17 4 10 11 3-8 8 1 10-8-5-9 5 1-11-7-7 11-3Z"/>',
    passport: '<path fill="#8b9f94" d="m13 7 37 3-1 48-38-3Z"/><circle cx="30" cy="29" r="12" fill="#d8d7b8"/><path d="M18 29h24m-12-12q-12 12 0 24 12-12 0-24M20 48l20 2m-24-40-1 43"/>',
    gloves: '<path fill="#d1bcbd" d="M10 32V14q5-6 7 0v11-17q5-5 7 0v18-15q5-4 6 1v19l5-7q8-2 6 5l-9 19H12Z"/><path fill="#e7d4cb" d="M11 46h21v11H11Z"/><path fill="#d1bcbd" d="M39 38V21q5-5 7 0v7-17q5-4 6 0v22l4-7q7-2 6 5l-8 20H39Z"/><path d="M40 49h14v10H40Z"/>'
  };
  function outline(cells) {
    const occupied = new Set(cells.map(p => p.join(','))), edges = new Map();
    for (const [x,y] of cells) {
      if (!occupied.has([x,y-1].join(','))) edges.set(x+','+y,[x+1,y]);
      if (!occupied.has([x+1,y].join(','))) edges.set((x+1)+','+y,[x+1,y+1]);
      if (!occupied.has([x,y+1].join(','))) edges.set((x+1)+','+(y+1),[x,y+1]);
      if (!occupied.has([x-1,y].join(','))) edges.set(x+','+(y+1),[x,y]);
    }
    const start = edges.keys().next().value; let key = start, path = 'M' + start;
    for (let i=0; i < edges.size; i++) { const next=edges.get(key); if(!next) break; path+='L'+next.join(','); key=next.join(','); if(key===start) break; }
    return path+'Z';
  }
  function iconBox(cells) {
    const occupied = new Set(cells.map(p=>p.join(','))), bounds = root.SuitcaseEngine.size(cells);
    let best = null;
    for (const [x,y] of cells) for(let w=1;w<=bounds.w-x;w++) for(let h=1;h<=bounds.h-y;h++) {
      let valid=true; for(let dx=0;dx<w;dx++) for(let dy=0;dy<h;dy++) if(!occupied.has((x+dx)+','+(y+dy))) valid=false;
      const score=Math.min(w,h)*10+w*h-Math.abs(x+w/2-bounds.w/2)*.2-Math.abs(y+h/2-bounds.h/2)*.2;
      if(valid&&(!best||score>best.score)) best={x,y,w,h,score};
    }
    return best;
  }
  function piece(piece, rotation=0, thumbnail=false) {
    const cells=root.SuitcaseEngine.rotate(piece.cells,rotation), bounds=root.SuitcaseEngine.size(cells), box=iconBox(cells);
    const iconSize=Math.min(box.w,box.h)*48, ix=(box.x+box.w/2)*64-iconSize/2, iy=(box.y+box.h/2)*64-iconSize/2;
    const seams=cells.map(([x,y])=>`<path d="M${x*64+9} ${y*64+6}h15m-18 5v12" opacity=".18"/>`).join('');
    return `<svg aria-hidden="true" viewBox="-3 -3 ${bounds.w*64+6} ${bounds.h*64+6}" xmlns="http://www.w3.org/2000/svg"><path class="piece-outline" d="${outline(cells)}" transform="scale(64)" fill="${palette[piece.color]}" stroke="#727d6c" stroke-width=".025" stroke-linejoin="round"/><g fill="none" stroke="#6f7869" stroke-width="1.1">${seams}</g><svg x="${ix}" y="${iy}" width="${iconSize}" height="${iconSize}" viewBox="0 0 64 64" fill="none" stroke="#596658" stroke-width="1.7">${icons[piece.kind]||icons.souvenir}</svg>${thumbnail?'':`<path d="M9 5h17" stroke="#fffef7" opacity=".45" stroke-width="2"/>`}</svg>`;
  }
  const scenes = [
    '<path fill="#e9debc" d="M0 57q44-22 140 3v30H0Z"/><path fill="#a9c5c2" d="M0 41q55 12 140 0v19Q63 45 0 70Z"/><circle cx="104" cy="22" r="10" fill="#dfc68c"/><path d="M70 54v-29l-20 24h39ZM70 25l17 19H70M13 35h18m-8 40h17"/>',
    '<path fill="#c9d3bb" d="m0 68 43-50 43 55 31-34 23 30v21H0Z"/><path fill="#99b09d" d="m20 66 14-29 13 29Zm59 3 15-38 15 38Z"/><path d="M34 66v14m60-11v13M55 78l12-17 13 17Zm12-17v17"/>',
    '<path fill="#d6cfb9" d="M0 70h140v20H0Z"/><path d="m68 10-18 63m18-63 20 63M57 50h24M53 63h32M59 40h17M65 21h7M61 73q8-20 17 0M13 65V43h22v22m65 0V35h23v30M7 73h126"/><path fill="#bdc9bb" d="M14 52h7v8h-7m13-8h6v8h-6m78-8h6v9h-6m10-9h6v9h-6"/>',
    '<path fill="#b7c8ca" d="M0 76 41 14l32 40 24-34 43 57Z"/><path fill="#f8f7ec" d="m25 38 16-24 18 23-12-5-7 7-6-8ZM82 42l15-22 14 19-9-4-4 9-7-8Z"/><path d="M6 78h129m-28-14 6-14 6 14m-6 0v13"/>',
    '<circle cx="107" cy="23" r="12" fill="#dfc48f"/><path fill="#d9c5a6" d="M0 66q30-40 67-16t73 11v29H0Z"/><path fill="#e8d7b8" d="M0 81q62-42 140-1v10H0Z"/><path d="m28 62 18-31 18 31Zm18-31v31m39 6 9-13 13 14"/>',
    '<path fill="#c7cfb6" d="M0 73q65-28 140-5v22H0Z"/><path fill="#c49e8b" d="M48 35h47v7H48Zm5 18h37v6H53Z"/><path d="M58 37v42m27-42v42M45 34q27 7 53 0M16 58l10-20m-5 10 13-1m-12-4-7-6"/><circle cx="24" cy="32" r="13" fill="#e2c5be"/><path d="M6 78h131"/>'
  ];
  root.SuitcaseArt={piece,scene:index=>`<g stroke="#6e7e70" stroke-width="1.4" fill="none">${scenes[index]}</g>`,palette};
})(window);
