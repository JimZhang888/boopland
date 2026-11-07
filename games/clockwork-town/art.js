/* Original pencil-and-wash scenery. No image requests or external assets. */
(function (root) {
  'use strict';
  const ink = '#69705c';
  const gear = (x, y, r, fill = '#c7b58d', spinning = false) => `<g transform="translate(${x} ${y})"><g ${spinning ? 'class="gear-spin"' : ''}><path d="${Array.from({length:48},(_,i)=>{const a=i*Math.PI/24,rr=r*(i%4<2?1:.82);return `${i?'L':'M'}${(Math.cos(a)*rr).toFixed(2)} ${(Math.sin(a)*rr).toFixed(2)}`;}).join('')}Z" fill="${fill}" stroke="${ink}" stroke-width="1.6"/><circle r="${r*.56}" fill="#eee8d5" stroke="${ink}" stroke-width="1.4"/><circle r="${r*.18}" fill="#9caa8b" stroke="${ink}" stroke-width="1.3"/><path d="M${-r*.48} 0H${r*.48}M0 ${-r*.48}V${r*.48}" stroke="${ink}" stroke-width="1.3"/></g></g>`;
  const rivets = (x,y,w,h) => `<g fill="#9da48e" stroke="none">${[[x+8,y+8],[x+w-8,y+8],[x+8,y+h-8],[x+w-8,y+h-8]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2"/>`).join('')}</g>`;
  const leaf = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#879773" stroke-width="1.6" fill="#c7d1ad"><path d="M0 0q-9-39 8-75" fill="none"/><path d="M2-31q-26-2-24-22Q0-56 2-31M5-48q24 0 25-23Q7-72 5-48"/><path d="m-15-47 17 16M24-65 5-48" fill="none"/></g>`;
  const cloud = (x,y,s=1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 21q-4-18 15-17 7-25 27-11 17-16 30 8 21-3 25 20Z" fill="#f8f6eb" stroke="#c6ccba" stroke-width="1.2"/>`;
  const defs = `<defs>
    <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><path d="M0 0v8" stroke="#7f856c" stroke-width=".6" opacity=".18"/></pattern>
    <pattern id="bricks" width="100" height="52" patternUnits="userSpaceOnUse"><path d="M0 0h100M0 26h100M24 0v26M74 26v26" fill="none" stroke="#a5aa91" stroke-width=".8" opacity=".25"/></pattern>
    <pattern id="paperDots" width="38" height="37" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r=".7" fill="#7a8062" opacity=".13"/><path d="m21 23 2 1M31 5h2" stroke="#989c81" stroke-width=".7" opacity=".15"/></pattern>
    <linearGradient id="wash" x2="0" y2="1"><stop stop-color="#e8eddf"/><stop offset="1" stop-color="#faf6e8"/></linearGradient>
    <radialGradient id="lampGlow"><stop stop-color="#eee0a5" stop-opacity=".65"/><stop offset="1" stop-color="#eee0a5" stop-opacity="0"/></radialGradient>
    <filter id="pencilShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="1" dy="3" stdDeviation="2" flood-color="#657155" flood-opacity=".12"/></filter>
  </defs>`;
  function skyline(lit=false) {
    return `<g stroke="#abb39a" stroke-width="1.3" fill="#dce2cf" opacity=".72"><path d="M36 334V218l24-24 25 25v89h18V156l37-25 38 24v150h18V195h43v106h20V97h16V63h18v34h16v214h30V179l28-18 29 18v136h35V233l35-24 36 24v84h32V132l29-22 29 22v185h22V203h50v107h31V175l35-27 36 27v139h36V223h57v93h25V135l35-25 35 25v194h34v-88l25-19 29 19v93Z"/><path d="M95 158h92M251 103h63M815 138h75" fill="none"/><g fill="${lit?'#e5cb83':'#c5cfb7'}" stroke="none">${[115,145,211,272,351,430,524,603,682,753,842,869,937].map((x,i)=>`<path d="M${x} ${i%3*29+202}h9v16h-9zM${x} ${i%3*29+238}h9v16h-9z"/>`).join('')}</g></g>`;
  }
  function robot(x=410, tall=false) {
    const lift=tall?42:0;
    return `<g class="scene-robot" style="transform:translate(${x}px, 478px)">
      <ellipse cx="0" cy="17" rx="52" ry="9" fill="#b7bfa5" opacity=".23"/>
      <g stroke="#65715c" stroke-width="2" fill="#b9c4aa"><path d="M-25-38v43m50-43v43" stroke-width="9"/><path d="M-25-38v43m50-43v43" stroke="#eef1df" stroke-width="3"/><path d="M-36 3h18l6 10h-33q-2-8 9-10M18 3h18q11 2 9 10H12Z" fill="#8e9d7e"/></g>
      ${tall?'<path d="M-25-35v-44m50 44v-44" fill="none" stroke="#7c8a6d" stroke-width="7"/><path d="M-25-42v-29m50 29v-29" stroke="#e3e6d4" stroke-width="2"/>':''}
      <g class="robot-upper" style="transform:translateY(-${lift}px)"><g class="robot-body" stroke="#65715c" stroke-width="1.8">
        <path d="M-38-86q-20 15-17 40m93-40q17 13 18 34" fill="none" stroke-width="6"/><path d="M-56-47l-7 8 7 5 6-9M56-54l6 8-6 6-6-9" fill="#d8ddc3"/>
        <path d="M-35-103q34-9 69 0l5 61q-37 14-79-2Z" fill="#c6d1b3" filter="url(#pencilShadow)"/><path d="M-32-97q30-8 59-1l4 46q-34 10-63-1Z" fill="url(#hatch)" stroke="none"/>
        <rect x="-26" y="-89" width="51" height="27" rx="12" fill="#edf0df"/><g fill="#53634e" stroke="none"><circle cx="-13" cy="-76" r="4"/><circle cx="12" cy="-76" r="4"/></g><path d="M-7-55q7 5 14 0" fill="none"/>
        <path d="M-10-108h18l-3-10h-12z" fill="#aebc99"/><path d="M-1-118v-16" fill="none"/><circle cx="-1" cy="-138" r="4" fill="#d3b57c"/>
        <path d="M-39-48q38 12 77-1l-2 9q-38 10-74-1Z" fill="#a5b6bd"/><path d="M25-41l7 23 13-4-9-23" fill="#a5b6bd"/>
        <circle cx="-30" cy="-99" r="1.5"/><circle cx="29" cy="-99" r="1.5"/>
      </g></g>
    </g>`;
  }
  const iconParts = {
    cord:'<path d="M22 13v38m20-38v38" stroke="#9b8b6b" stroke-width="7"/><path d="M19 14h26M19 49h26" stroke="#747c64" stroke-width="4"/><path d="M22 21h20M22 27h20M22 33h20M22 39h20M22 45h20M42 36q19 1 11 18" fill="none" stroke="#b7a47d" stroke-width="3"/>',
    magnet:'<path d="M17 12v24a15 15 0 0 0 30 0V12H36v24a4 4 0 0 1-8 0V12Z" fill="#bf8d78" stroke="#776d59"/><path d="M17 12h11v11H17zM36 12h11v11H36z" fill="#d9ddcb" stroke="#777b66"/>',
    hook:'<path d="M12 13q30-16 29 6T28 38" fill="none" stroke="#a28e68" stroke-width="2"/><path d="M23 33v13a10 10 0 0 0 20 0V33h-7v13a3 3 0 0 1-6 0V33Z" fill="#bd907c" stroke="#746e59"/><path d="M23 33h7v7h-7zM36 33h7v7h-7z" fill="#d4dcca"/>',
    gear:gear(32,32,23),
    oil:'<path d="m17 29 23-4 7 25-32 3Z" fill="#b2c2aa" stroke="#697760"/><path d="M21 28v-7l12-2v7M43 32l15-13-8 21" fill="#d7ddc6" stroke="#697760"/><path d="M15 34Q3 23 9 46l7-3" fill="none" stroke="#697760"/><path d="m23 36 13-2M25 42l11-2" stroke="#eef0dd" stroke-width="2"/>',
    lens:'<circle cx="32" cy="32" r="23" fill="#d8e4df" stroke="#8d957a" stroke-width="3"/><circle cx="32" cy="32" r="18" fill="#e9f0e7" stroke="#a9bcb1"/><path d="m20 31 12-12M24 40l18-18" stroke="#fffef3" stroke-width="4"/>'
  };
  Object.assign(iconParts, {
    arm:'<path d="M15 46V29h28V14" fill="none" stroke="#7d9384" stroke-width="9"/><path d="M15 46V29h28V14" fill="none" stroke="#cddbd0" stroke-width="4"/><circle cx="15" cy="47" r="7" fill="#a4b49b" stroke="#74826c"/>',
    grip:'<rect x="22" y="10" width="20" height="43" rx="8" fill="#cbb28c" stroke="#887d61"/><path d="M28 17v28m8-28v28" stroke="#e9d7b5"/>',
    crank:'<path d="M13 48V30h29V15" fill="none" stroke="#819586" stroke-width="8"/><rect x="35" y="7" width="14" height="23" rx="5" fill="#cbb28c" stroke="#887d61"/><circle cx="13" cy="48" r="7" fill="#b5c5a5" stroke="#78886d"/>',
    bridgeKey:'<circle cx="21" cy="20" r="12" fill="#e8d7a7" stroke="#94805a" stroke-width="3"/><circle cx="21" cy="20" r="5" stroke="#b09c70"/><path d="m30 29 23 23m-8-8-6 6m0-12-6 6" stroke="#b09a68" stroke-width="6"/>',
    mainspring:'<path d="M53 31c0-29-45-30-45 0s41 30 41 2-34-25-34-1 27 23 27 1-20-16-20-1 13 14 13 0" stroke="#9b8c6a" stroke-width="3" fill="none"/><path d="M53 31v20h-9" fill="none" stroke="#9b8c6a" stroke-width="3"/>'
  });
  function icon(id) { return `<svg viewBox="0 0 64 64" fill="none" stroke-width="1.5" aria-hidden="true">${iconParts[id]||''}</svg>`; }
  function placed(id,x,y,size=64) { return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 64 64" stroke-width="1.5">${iconParts[id]}</svg>`; }
  function yard(s) {
    const f=s.flags;
    return `${cloud(100,88,.8)}${cloud(760,83,1.1)}${skyline()}
      <path d="M54 488Q514 455 945 486l-30 78q-422 39-856-3Z" fill="#e2e5d3"/><path d="M59 492q410-32 879-4M86 549q420 25 807-7" fill="none" stroke="#b8bfa5" stroke-width="1.2"/>
      <path d="M80 237 79 458l236 4 6-277-143-8-2 61Z" fill="#e4e2cc" stroke="#9caa8b" stroke-width="1.8"/><path d="M80 237 79 458l236 4 6-277-143-8-2 61Z" fill="url(#bricks)"/><path d="m169 179 4 62H83M311 190l-4 266" fill="none" stroke="#b4b99f"/>
      <path d="M333 205q240-55 377-24v295H329Z" fill="#e8e6d2" stroke="#a4ac91" stroke-width="1.6"/><path d="M333 205q240-55 377-24v295H329Z" fill="url(#bricks)"/>
      <path d="M691 478V222q0-89 92-90 108-4 110 90v260" fill="#d1d9c1" stroke="#829475" stroke-width="2"/>
      <path d="M717 479V227q0-68 67-70 81-4 81 70v254Z" fill="${f.gate?'#a6b596':'#e4e6d4'}" stroke="#7d8e70" stroke-width="2"/>
      ${f.gate?'<path d="M744 478V247q5-57 42-61 54 3 55 61v232" fill="#71896d" opacity=".55"/><path d="m761 477 24-157 23 157" fill="#e3dfbb" opacity=".65"/><path d="M870 226 930 207v271l-60 3Z" fill="#c9d0ba" stroke="#829274"/><path d="M882 233v230M899 226v241M917 221v247" stroke="#a2ae91"/>':'<path d="M744 185v295M773 163v317M803 161v319M834 181v299" stroke="#b1bca2" stroke-width="2"/><path d="M720 272h142M718 431h145" stroke="#98a98a" stroke-width="8"/>'}
      <path d="M740 112h92l8 30-108 2Z" fill="#f2edd7" stroke="#9ca685"/><text x="786" y="134" fill="#7d896b" font-family="Georgia,serif" font-size="18" text-anchor="middle">01</text>
      ${!f.gate?`<rect x="758" y="307" width="71" height="95" rx="6" fill="#b1bea0" stroke="#748766" stroke-width="2"/>${rivets(758,307,71,95)}${f.fitted?gear(793,336,21,'#c4ac77'):'<circle cx="793" cy="337" r="21" fill="#899d79" stroke="#6e815f"/><path d="M785 337h16M793 329v16" stroke="#d4ddc6" stroke-width="3"/>'}<path d="M773 375h40" stroke="#e9e8d1" stroke-width="13"/>${[0,1,2].map((n)=>`<text x="${778+n*14}" y="379" text-anchor="middle" font-size="11" fill="#687653" font-family="Georgia,serif">${s.dials[n]}</text>`).join('')}`:''}
      <g transform="rotate(-4 449 273)"><path d="M392 229h123l-2 88-122-4Z" fill="#efe9d1" stroke="#b8b599"/><path d="m405 246 12-8m75 64 10-7" stroke="#c5bea1"/><text x="452" y="283" text-anchor="middle" fill="#8d8d6c" font-size="29" font-family="Georgia,serif">Ⅱ · Ⅳ · Ⅰ</text><path d="M415 296h74" stroke="#aaa586" stroke-width=".8"/></g>
      <g stroke="#879276" stroke-width="1.8"><path d="M98 399h156l6 65-169 1Z" fill="#c3ceb2"/><path d="m102 412 139 1m-128 15h115m-122 15 131 1" fill="none"/><path d="M110 401v58M239 402v58" stroke="#9eac8f"/><path d="M112 344h123l6 58-139-2Z" fill="#d7d9be"/><path d="M121 351h104v42H114Z" fill="url(#hatch)"/></g>
      ${gear(140,350,37,'#c7cbb0')}${gear(222,358,25,'#d7c59d')}
      <path d="M116 279 115 316l90-2 2-43Z" fill="#aebfa4" stroke="#819274" stroke-width="1.7"/><path d="M109 273q54-12 105-4" fill="none" stroke="#819274" stroke-width="6"/>
      ${!f.magnet?placed('magnet',137,248,58):''}${!f.cord?placed('cord',183,403,68):''}
      <ellipse cx="555" cy="511" rx="83" ry="22" fill="#c4c9b1" stroke="#8c987b" stroke-width="1.5"/><ellipse cx="555" cy="508" rx="67" ry="14" fill="#85967b"/>
      ${!f.gear?gear(557,510,13,'#cbbb8c'):''}<path d="M494 503l122 6m-120 3 109 5" stroke="#d1d5bd" stroke-width="4"/>
      <path d="M650 162v152q0 22-23 22h-22v67" fill="none" stroke="#8e9c7f" stroke-width="12"/><path d="M650 162v152q0 22-23 22h-22v67" fill="none" stroke="#d0d9bd" stroke-width="7"/>
      ${leaf(667,468,.75)}${leaf(93,479,.5)}<path d="M651 449h31l-5 30h-22Z" fill="#c7b28f" stroke="#8a8c70"/>
      <g transform="translate(563 163)"><g class="bird" fill="#b4bfaa" stroke="#7e8e74" stroke-width="1.3"><path d="M-17 1q-15-26 10-22 15-18 23-4 4 11-13 21Z"/><path d="m15-22 12 4-13 3M-8 1v8m10-9v8"/><circle cx="9" cy="-22" r="1.4" fill="#56694f"/></g></g>
      <path d="M96 568q340 13 806-4" stroke="#d4d8c4" fill="none"/><path d="m359 521 15-4m31 31 24 2m273-33 18 2m73 30 23-4" stroke="#afb99d" fill="none"/>`;
  }
  function workshop(s) {
    const f=s.flags;
    return `<path d="M83 129q417-64 833-7v365H79Z" fill="#e8e7d7" stroke="#b4bca5" stroke-width="1.6"/><path d="M83 129q417-64 833-7v365H79Z" fill="url(#bricks)"/><path d="m74 488 853-5 31 76q-441 36-912-4Z" fill="#dfe4d1"/>
      <path d="M87 122q399-69 830-6" fill="none" stroke="#a2b395" stroke-width="13"/><path d="M103 122v365M898 121v364" stroke="#b4c1a4" stroke-width="13"/><path d="M500 91v44" stroke="#88997a" stroke-width="3"/><path d="m475 151 13-18h24l14 18Z" fill="#bdc7a9" stroke="#7b8f6d" stroke-width="1.8"/><ellipse cx="500" cy="152" rx="24" ry="4" fill="${f.power?'#eddaa0':'#e0ddbf'}"/>
      ${f.power?'<ellipse class="beacon-light" cx="500" cy="177" rx="57" ry="50" fill="url(#lampGlow)"/>':''}
      <path d="M132 200h205l-3 12H136Z" fill="#b3bda1" stroke="#829471" stroke-width="1.8"/><path d="m150 212 16 35 19-35m104 0 16 31 17-31" fill="none" stroke="#9aa98a" stroke-width="4"/>
      <path d="M159 162h26v36h-26z" fill="#d4c4a3" stroke="#8e9378"/><path d="M164 158h15v5h-15z" fill="#aab798"/><path d="M197 176q15-8 29 0v22h-29Z" fill="#cad2b9" stroke="#929e82"/>
      ${!f.oil?placed('oil',251,140,66):''}
      <path d="M128 423h206v61H128Z" fill="#b7c5a6" stroke="#7f9271" stroke-width="2"/><path d="M148 424V300q0-63 68-63t68 63v123Z" fill="#c4d0b5" stroke="#7a906c" stroke-width="2"/><path d="M154 319h122M156 405h120" stroke="#9daf8b" stroke-width="6"/><path d="M159 323h110v78H159Z" fill="url(#hatch)"/>
      <circle cx="214" cy="280" r="22" fill="#f1edda" stroke="#819173" stroke-width="2"/><path d="m201 285 13-5 9-12" fill="none" stroke="#ac9472" stroke-width="2"/><path d="M202 264l-3 5m29 1-4-4" stroke="#b7b394"/>
      ${gear(217,363,43,f.oiled?'#c8b88d':'#bb9d7f',!!f.power)}<path d="M132 447h190" stroke="#a2b491" stroke-width="7"/>
      <path d="M285 307h62v-92h51" fill="none" stroke="#8fa17e" stroke-width="16"/><path d="M285 307h62v-92h51" fill="none" stroke="#c4d1b2" stroke-width="9"/>
      <path d="M392 184h208v210H392Z" fill="#cbd3bb" stroke="#829677" stroke-width="2"/>${rivets(392,184,208,210)}
      <g transform="translate(410 204)" stroke="#809675" stroke-width="9" fill="none"><path d="M0 20h49v52h56v51h64M20 72v51h35v46M109 20h60v51"/><path d="M0 20h49v52h56v51h64M20 72v51h35v46M109 20h60v51" stroke="${f.power?'#a3bf94':'#e2e5ce'}" stroke-width="5"/></g>
      <path d="M601 337h40v-173h97" fill="none" stroke="#92a482" stroke-width="12"/><path d="M601 337h40v-173h97" fill="none" stroke="#cbd6b9" stroke-width="6"/>
      <path d="M665 379h119v107H665Z" fill="#b9c7aa" stroke="#829574" stroke-width="1.8"/><path d="m660 375 129-2v14l-130 2Z" fill="#d6dcca" stroke="#8da080"/>
      <path d="M675 ${f.power?414:399}h99v47h-99Z" fill="#d8dccc" stroke="#8a9b7e" stroke-width="1.7"/><path d="M714 417h19" stroke="#7b8e6c" stroke-width="4"/>
      ${f.power&&!f.lens?placed('lens',697,411,54):''}
      <path d="M814 480V255q0-42 47-42t45 42v225Z" fill="${f.power?'#b6c6a6':'#c6cdb9'}" stroke="#8e9f7c" stroke-width="2"/><path d="M831 467h58v-24h-48v-24h48v-24h-38v-24h38v-24h-29v-24h29v-24" fill="none" stroke="#ecebd6" stroke-width="9"/><circle cx="861" cy="194" r="11" fill="${f.power?'#b9ce94':'#d6b99d'}" stroke="#92a17d"/>
      <path d="M701 203h74v93h-74Z" fill="#eee9d5" stroke="#bab99d"/><path d="m714 226 18 0 0 17 25 0m-24 0v32" fill="none" stroke="#a0a98e" stroke-width="2"/><circle cx="713" cy="225" r="4" fill="#b4c2a1"/><circle cx="757" cy="243" r="4" fill="#d0bd8b"/>
      ${leaf(790,486,.56)}<path d="M777 468h26l-5 21h-17Z" fill="#c6b492" stroke="#8f927a"/>
      ${f.power?'<g class="steam" stroke="#aab89b" stroke-width="2" fill="none"><path d="M179 233q-12-16 0-30t0-30M208 225q-12-16 0-30t0-30M231 237q-12-16 0-30t0-30"/></g>':''}
      <path d="M89 514q438 27 830-7M143 542l165-1m247 10 164-2" fill="none" stroke="#b8c3a8" stroke-width="1.1"/>`;
  }
  function tower(s) {
    const f=s.flags;
    return `<path d="M44 154q451-129 910 1v375H44Z" fill="url(#wash)"/>${cloud(173,107,.9)}${cloud(718,155,.75)}<g transform="translate(0 154) scale(1 .72)">${skyline(!!f.won)}</g>
      ${f.won?'<path class="beacon-light" d="M666 186 34 93v180ZM670 186l284-73v163Z" fill="#e2ce8d" opacity=".22"/>':''}
      <path d="M53 445q439-45 896-1l17 105q-449 46-926-1Z" fill="#dbe2cc" stroke="#b2bfa2" stroke-width="1.5"/><path d="M85 424v82M218 411v85M804 410v82M929 427v76" stroke="#839b75" stroke-width="7"/><path d="M68 422q127-19 260-16M780 405q78 4 166 19" stroke="#9daf8d" stroke-width="6" fill="none"/>
      <path d="M607 484V198h115v286Z" fill="#d1d8bd" stroke="#8e9d7a" stroke-width="1.7"/><path d="M621 209h87v269h-87Z" fill="url(#bricks)"/><path d="m587 201 29-32h100l27 32Z" fill="#a8b998" stroke="#7f9671" stroke-width="1.8"/>
      <path d="M619 169V100q41-21 91 0v69Z" fill="${f.won?'#e6d59a':'#dce5d0'}" stroke="#8b9c78" stroke-width="1.8"/><path d="M611 98 643 69h41l34 29Z" fill="#bac6a7" stroke="#829571" stroke-width="1.8"/><path d="M662 70V45m-16 5 16-7 27 8-27 3" fill="#d3c08f" stroke="#8e9979" stroke-width="1.5"/><path d="M636 102v67M693 102v67M621 132h87" stroke="#afbd9a" stroke-width="4"/>
      ${f.won?'<circle class="beacon-light" cx="663" cy="134" r="95" fill="url(#lampGlow)"/>':''}
      <path d="M625 297h77v122h-77Z" fill="#b7c8a3" stroke="#7e946c" stroke-width="2"/><circle cx="665" cy="339" r="28" fill="${f.lensFitted?'#e3eaca':'#849877'}" stroke="#7b8e69" stroke-width="3"/>
      ${f.lensFitted?'<path d="m649 339 17-18m-12 34 26-28" stroke="#fff9d8" stroke-width="4"/>':'<path d="M649 338h31m-16-15v30" stroke="#b8c9a4" stroke-width="2"/>'}
      <path d="M644 392h43" stroke="#dfddbe" stroke-width="13"/><path d="M650 387v10m15-10v10m15-10v10" stroke="#849371" stroke-width="2"/>
      ${gear(576,432,38,'#bcc9a7',!!f.won)}${gear(529,454,25,'#d1c197',!!f.won)}
      <path d="M170 273h139v89H170Z" fill="#f0ebd5" stroke="#9eaa8c" stroke-width="1.6" transform="rotate(-5 238 319)"/><path d="M183 285h109v60H183Z" fill="none" stroke="#c5c4a7" stroke-width=".8" transform="rotate(-5 238 319)"/>
      <path d="M188 330h44v-32h44v44" fill="none" stroke="#c4ab76" stroke-width="2"/><path d="m223 340 18-18m-18-15 18-18m26 1 17 18" stroke="#8fa18c" stroke-width="3"/><circle cx="277" cy="346" r="4" fill="#c3caa9"/>
      <path d="M154 482 150 386l38-9 36 30v75" fill="#bac9aa" stroke="#809571" stroke-width="1.5"/><path d="M140 386q19-31 45-29 34-1 49 32l-49 23Z" fill="#d6ddc4" stroke="#8fa17d" stroke-width="1.5"/><circle cx="182" cy="389" r="12" fill="#a5b497" stroke="#829773"/>
      ${leaf(860,492,1)}${leaf(841,489,.6)}<path d="M827 464h49l-8 38h-32Z" fill="#c4b692" stroke="#939577" stroke-width="1.5"/>
      <path d="M103 533q363 18 788-4" fill="none" stroke="#b8c4a6" stroke-width="1.3"/>
      <g transform="translate(774 404)"><g class="bird" fill="#a7b698" stroke="#7a916d" stroke-width="1.5"><path d="M-18 0q-13-26 10-22 18-18 26-2 1 17-18 22Z"/><path d="m17-23 13 5-14 3M-8-1v9m11-9v9"/><circle cx="10" cy="-23" r="1.5" fill="#55664e"/></g></g>`;
  }
  function greenhouse(s) {
    const f=s.flags;
    return `${cloud(72,83,.8)}${cloud(777,72,.75)}<path d="M63 480q454-33 875 0l-15 80q-457 28-867-1Z" fill="#e0e6d3"/>
      <path d="M111 477V246q0-139 382-149 383 9 383 149v232Z" fill="#e7eddf" stroke="#94a68a" stroke-width="2"/>
      <path d="M111 247h765M111 359h765M286 123v354M492 98v379M698 124v353" stroke="#b3c1a4" stroke-width="5" fill="none"/><path d="M137 238q66-90 129-97m42 94 67-110m179 110 56-110m111 118 40-75" stroke="#fffdf2" stroke-width="5" opacity=".75" fill="none"/>
      <path d="M97 250h25v238m741-240h25v239" stroke="#8fa38b" stroke-width="7" fill="none"/><path d="M100 476h793" stroke="#9eac8f" stroke-width="6"/>
      <path d="M124 360h198v17H124zM140 377v102m163-102v102" fill="#c0c9ac" stroke="#8d9e7e" stroke-width="3"/>
      ${!f.arm?placed('arm',143,293,64):''}${!f.grip?placed('grip',264,189,64):''}<path d="M267 180h50" stroke="#91a482" stroke-width="4"/>
      <path d="M388 468V325h167v143Z" fill="#b8c9b4" stroke="#819b81" stroke-width="2"/>${rivets(388,325,167,143)}<circle cx="436" cy="403" r="27" fill="#e0e7d6" stroke="#7e947b" stroke-width="2"/>
      ${f.pumpFitted?placed('crank',401,368,70):'<circle cx="436" cy="403" r="9" fill="#94a889"/>'}
      ${s.water.map((v,i)=>`<rect x="${390+i*57}" y="234" width="44" height="78" rx="9" fill="#f3f4e8" stroke="#90a48d" stroke-width="2"/><rect x="${394+i*57}" y="${307-v*10}" width="36" height="${v*10}" rx="4" fill="#a9c9c4"/><path d="M${399+i*57} ${307-[2,4,3][i]*10}h28" stroke="#aa946c" stroke-width="2" stroke-dasharray="4 3"/>`).join('')}
      <path d="M555 432h96v-30h151" fill="none" stroke="#99ad90" stroke-width="9"/>${f.watered?'<path d="M555 432h96v-30h151" fill="none" stroke="#b8d4cc" stroke-width="4"/>':''}
      <path d="M635 440h183l-13 40H647Z" fill="#c6b28d" stroke="#958a6e" stroke-width="2"/>${[659,715,778].map((x,i)=>f.watered?leaf(x,441,[1.15,.88,1.32][i]):`<path d="M${x} 439q-12-25-25-20m25 20q12-29 24-23" stroke="#a7a584" stroke-width="2" fill="none"/>`).join('')}
      ${f.watered&&!f.bridgeKey?placed('bridgeKey',699,414,46):''}<path d="M849 476V278q30-29 58 0v198" fill="${f.watered?'#c8d7b7':'#d6deca'}" stroke="#8d9f7d" stroke-width="2"/><path d="M860 374h33m-10-10 10 10-10 10" stroke="#829572" stroke-width="3" fill="none"/>
      <path d="M130 518q350 22 735 0" stroke="#b6c4a6" fill="none"/><g fill="#c7d8ce" stroke="#9fb7ab">${[192,349,602,744].map((x,i)=>`<path d="M${x} ${125+i%2*26}q-9 13 0 16 9-3 0-16Z"/>`).join('')}</g>`;
  }
  function bridge(s) {
    const f=s.flags;
    return `${cloud(111,106,1)}${cloud(706,94,.9)}<g transform="translate(0 75) scale(1 .8)">${skyline(true)}</g>
      <path d="M46 465q429-27 913 0v93H46Z" fill="#c9dcd5"/><path d="M62 510q160-20 284 0t276 0 303-1M90 541q174-17 351 0t468-3" stroke="#eef2e5" stroke-width="4" fill="none"/>
      <path d="M51 452h481v39H51ZM793 452h155v39H793Z" fill="#d6dbc3" stroke="#98a789" stroke-width="2"/>
      <path d="M533 478v-261m266 261V217M513 216h307" stroke="#849b84" stroke-width="10" fill="none"/><path d="M539 224h253" stroke="#c8d4b9" stroke-width="3"/>
      ${f.bridgeOpen?'<path d="M532 464h265v22H532Z" fill="#c5b48f" stroke="#8e866d" stroke-width="2"/><path d="M553 465v21m37-21v21m37-21v21m37-21v21m37-21v21m37-21v21m37-21v21" stroke="#a49579"/><path d="M543 223v223m246-223v223" stroke="#a9b7a0" stroke-width="2"/>':'<path d="m536 480 120-198 18 10-118 193Z" fill="#c5b48f" stroke="#8e866d" stroke-width="2"/><path d="M659 280 793 223" stroke="#889d88" stroke-width="3"/>'}
      <path d="M112 269h116v180H112Z" fill="#c4cdb6" stroke="#879a7a" stroke-width="2"/>${rivets(112,269,116,180)}<path d="M123 281h94v155h-94Z" fill="#e3e6d5" stroke="#a5b294"/><circle cx="202" cy="360" r="7" fill="#b5a171"/>
      ${f.cabinetOpen?gear(170,337,26,'#cbbb8c'):placed('bridgeKey',143,309,55)}<path d="M332 411h128M396 412V237" stroke="#8c9c7d" stroke-width="8"/>
      <g transform="rotate(${Math.max(-10,Math.min(10,(s.weights[2]+s.weights[3]*2-s.weights[0]*3-s.weights[1])*.9))} 396 242)"><path d="M278 242h207" stroke="#9cae8e" stroke-width="7"/>${s.weights.map((v,i)=>`<path d="M${[291,361,431,466][i]} 242v53" stroke="#8d9e80" stroke-width="2"/><rect x="${[277,347,417,452][i]}" y="295" width="28" height="${v*10+15}" rx="6" fill="#c7b58c" stroke="#8b866a"/><text x="${[291,361,431,466][i]}" y="316" text-anchor="middle" fill="#686d57" font-size="14">${v}</text>`).join('')}</g>
      <path d="M490 458h61v18h-61Z" fill="#b9c5a6" stroke="#839778"/><path d="M519 456l${f.bridgeOpen?'18 -25':'-14 -53'}" stroke="#8b9e7b" stroke-width="7"/><circle cx="${f.bridgeOpen?537:505}" cy="${f.bridgeOpen?431:403}" r="10" fill="#cbb38c" stroke="#8d8769"/>
      <path d="M814 415h66v38h-66Z" fill="#c6b28e" stroke="#8a8c71"/><path d="M836 415v-9h23v9M816 431h62" fill="none" stroke="#899377" stroke-width="3"/>${f.bridgeOpen&&!f.mainspring?placed('mainspring',832,413,32):''}
      <path d="M901 446V302m-30 0h62l-8 31h-54Z" fill="#dfe4cf" stroke="#8f9f7d" stroke-width="3"/><path d="M885 315h30m-9-6 9 6-9 6" fill="none" stroke="#869776" stroke-width="2"/>
      <path d="M277 189h47v37h-47Z" fill="#d8c695" stroke="#9e936e"/><path d="M283 188q17-36 35 0M276 227h49" fill="none" stroke="#8d9879" stroke-width="3"/>${leaf(86,466,.8)}${leaf(938,472,.7)}`;
  }
  function station(s) {
    const f=s.flags;
    return `${cloud(98,106,.9)}${cloud(782,123,.7)}<g opacity=".5" transform="translate(0 30)">${skyline(true)}</g>
      <path d="M56 468h900v89H56Z" fill="#e2dfca"/><path d="M62 506h885M65 539h880" stroke="#91a18a" stroke-width="4"/>${Array.from({length:22},(_,i)=>`<path d="M${83+i*39} 502l-8 41" stroke="#c3b38f" stroke-width="7"/>`).join('')}
      <path d="M78 249 130 164h451l54 86Z" fill="#c1cdb3" stroke="#8b9c7b" stroke-width="2"/><path d="M99 248h516M116 254v219m485-219v219" stroke="#91a283" stroke-width="9"/><path d="m147 177-31 58m100-58-15 58m91-58v58m89-58 13 58m81-58 29 58" stroke="#dbe2cd" stroke-width="3"/>
      <path d="M139 266h102v117H139Z" fill="#f1eddb" stroke="#aaa88b" stroke-width="2"/><path d="M151 293h79m-79 25h79m-79 25h79" stroke="#c0b99a" stroke-width="2"/><circle cx="177" cy="281" r="4" fill="#98ae89"/><path d="m199 276 5 10 5-10" stroke="#ad9d6b" fill="none"/>
      <path d="M271 305h118v166H271Z" fill="#b8c6b1" stroke="#869a7d" stroke-width="2"/><circle cx="329" cy="352" r="32" fill="#eae9d4" stroke="#8e9c7d" stroke-width="3"/>${f.springFitted?placed('mainspring',302,325,54):'<circle cx="329" cy="352" r="13" fill="#a1b296"/>'}<path d="M289 415h82" stroke="#8b9d7f" stroke-width="3"/>${gear(329,434,20,'#d2bd91',!!f.springFitted)}
      <path d="M433 278h112v136H433Z" fill="#d5ddc6" stroke="#91a383" stroke-width="2"/>${rivets(433,278,112,136)}${[0,1,2].map((v)=>`<circle cx="488" cy="${302+v*32}" r="10" fill="${f.routeReady&&v===2?'#98b77e':'#c7c9ad'}" stroke="#91a17f"/>`).join('')}<path d="M488 415v56" stroke="#91a383" stroke-width="8"/>
      <g transform="translate(${f.finished?35:0} 0)"><path d="M642 340q13-30 52-30h121q38 0 47 30v117H642Z" fill="#b8c9b8" stroke="#809987" stroke-width="2"/><path d="M629 342q126-14 245 0l-9-18q-113-17-227 0Z" fill="#9faf98" stroke="#7e947e" stroke-width="2"/>
      <path d="M661 355h69v51h-69zM746 355h93v51h-93Z" fill="#e5ecdb" stroke="#91a98d" stroke-width="2"/><path d="M642 423h220" stroke="#e0dbc0" stroke-width="7"/><rect x="722" y="416" width="44" height="29" rx="2" fill="#ece5c8" stroke="#9f9978"/><path d="m722 416 22 16 22-16" stroke="#9f9978" fill="none"/><circle cx="679" cy="459" r="20" fill="#9cae97" stroke="#7d927b" stroke-width="3"/><circle cx="821" cy="459" r="20" fill="#9cae97" stroke="#7d927b" stroke-width="3"/><path d="M677 451v16m-8-8h16m134-8v16m-8-8h16" stroke="#dce1ca" stroke-width="2"/></g>
      <circle cx="357" cy="215" r="29" fill="#f4edda" stroke="#94a184" stroke-width="3"/><path d="M357 195v21l14 8" stroke="#839677" stroke-width="3" fill="none"/>${leaf(76,480,.6)}${f.finished?'<path d="M729 171q43-27 89 0m-53 12 18-5 17 8" fill="none" stroke="#a5b5a0" stroke-width="2"/>':''}`;
  }
  const symbols = [
    '<path d="M15 47q-9-28 34-33 0 37-34 33ZM15 47l25-24"/>',
    '<path d="M16 42h32l-5-8V24a11 11 0 0 0-22 0v10ZM26 49q6 8 12 0M32 9v4"/>',
    '<path d="m32 9 7 15 17 2-12 12 3 17-15-8-15 8 3-17L8 26l17-2Z"/>',
    '<path d="M42 11a23 23 0 1 0 12 33A24 24 0 0 1 42 11Z"/>'
  ];
  const symbol = index => `<svg viewBox="0 0 64 64" aria-hidden="true" fill="#d6dec5" stroke="#7d9370" stroke-width="2.2">${symbols[index]||''}</svg>`;
  const spots = {
    yard:[['cord',217,437,88,85],['magnet',165,281,80,80],['drain',554,510,205,90],['mural',452,272,125,90],['gate',793,310,190,340]],
    workshop:[['oil',283,174,80,82],['generator',214,360,140,170],['pipes',496,289,170,176],['drawer',724,432,112,95],['stairs',861,332,105,190]],
    tower:[['beacon',664,341,126,156],['chart',239,317,140,108],['town',420,291,175,110]],
    greenhouse:[['arm',175,326,85,75],['grip',295,222,75,80],['pump',475,350,186,242],['planter',726,423,174,116],['gardenExit',878,361,78,237]],
    bridge:[['cabinet',170,355,117,185],['balance',396,279,208,171],['bridgeLever',521,439,76,85],['toolbox',847,432,83,75],['bridgeExit',904,338,76,120]],
    station:[['timetable',190,323,103,118],['clockDrive',329,388,124,172],['signal',488,347,115,143],['mailcar',752,395,252,173]]
  };
  function scene(s, x) { return defs+`<rect width="1000" height="620" fill="#fffdf5"/><g stroke-linecap="round" stroke-linejoin="round">${({yard,workshop,tower,greenhouse,bridge,station})[s.room](s)}${robot(x??(s.room==='yard'?395:s.room==='workshop'?551:430),s.tall)}<rect x="40" y="55" width="920" height="515" fill="url(#paperDots)" pointer-events="none"/></g>`; }
  function sketch() { return `<svg viewBox="0 0 220 170" fill="none" stroke="${ink}"><path d="M24 147q84 11 172-4" stroke="#bdc5ad"/>${gear(91,98,39,'#d9d2ad')}${gear(145,69,26,'#cad4b9')}<path d="m41 41 5-12m10 17 8-3m92 74 12 5" stroke="#acb69b"/>${leaf(177,146,.6)}</svg>`; }
  function drainSketch() {
    return `<svg class="drain-sketch" viewBox="0 0 440 230" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round"><path d="M67 62v115q150 66 306-1V62" fill="#e0e6d4" stroke="#9ba98a" stroke-width="2"/><path d="M91 83v79q136 49 258 0V83" fill="#c4d0b6" stroke="#a2b294"/><path d="M95 183q131 39 248-1" fill="none" stroke="#98b3a5" stroke-width="3"/><ellipse cx="220" cy="61" rx="153" ry="31" fill="#d2d9c1" stroke="#8c9c7a" stroke-width="2"/><ellipse cx="220" cy="61" rx="130" ry="20" fill="#9ead8d"/><path d="M104 53h231M91 65h259M117 77h209" stroke="#dce3cd" stroke-width="8"/>${gear(228,155,38,'#cfb77f')}<path d="M219 148h18M228 139v32" stroke="#687b66" stroke-width="3"/><path d="M275 128l10-8M281 143l13 1M174 157l-12 3" stroke="#a3b48f" stroke-width="2"/></g></svg>`;
  }
  const api={scene,spots,icon,sketch,gear,robot,drainSketch,symbol};
  if(typeof module==='object'&&module.exports) module.exports=api; else root.ClockworkArt=api;
})(typeof window!=='undefined'?window:globalThis);
