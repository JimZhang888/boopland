/* Original vector drawings. The same tooth geometry is used on the bench and in the tray. */
(() => {
  'use strict';
  const tau = Math.PI * 2;
  const ink = '#494b3e';
  const colors = {
    drive: ['#b39361', '#e2cc98', '#715e41'],
    low: ['#a9b6a1', '#d5deca', '#667664'],
    high: ['#a2b8b3', '#d8e3d8', '#516d68'],
    hand: ['#c9ac79', '#e9d6aa', '#806b47']
  };
  const fmt = n => +n.toFixed(3);
  function circle(r, fill, stroke = ink, w = 1, x = 0, y = 0) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
  }
  function path(d, fill = 'none', stroke = ink, w = 1, extra = '') {
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  }
  const polar = (r, a) => fmt(Math.cos(a) * r) + ' ' + fmt(Math.sin(a) * r);
  function ticks(start, end, count, heavyEvery, color, width) {
    let d = '';
    for (let i = 0; i < count; i++) {
      const a = tau * i / count - Math.PI / 2;
      d += 'M' + polar(i % heavyEvery === 0 ? start - 3 : start, a) + 'L' + polar(end, a);
    }
    return path(d, 'none', color, width);
  }

  // Rounded trapezoidal teeth straddle the pitch circle by one module.
  function wheel(teeth, unit, kind) {
    const [body, light, shade] = colors[kind];
    const r = teeth * unit / 2, root = r - unit * 1.07, tip = r + unit * .82;
    const pitch = tau / teeth;
    let outline = '';
    for (let t = 0; t < teeth; t++) {
      for (const [shift, rad] of [[-.5, root], [-.33,root], [-.17,tip],[.16,tip],[.32,root]]) {
        outline += (outline ? 'L' : 'M') + polar(rad, (t + shift) * pitch);
      }
    }
    const rim = r - unit * 1.8, hub = Math.max(3, r * .21);
    let holes = '';
    const spokes = teeth >= 24 ? 6 : 4;
    for (let i = 0; i < spokes; i++) {
      const a = tau * i / spokes, b = tau * (i + 1) / spokes;
      const outer = rim * .84, inner = hub * 1.4;
      holes += 'M' + polar(inner,a+.23) + 'L' + polar(outer,a+.13)
        + 'A' + outer + ' ' + outer + ' 0 0 1 ' + polar(outer,b-.16)
        + 'L' + polar(inner,b-.22) + 'A' + inner + ' ' + inner + ' 0 0 0 ' + polar(inner,a+.23) + 'Z';
    }
    return path(outline + 'Z' + holes, body, ink, Math.max(.6,unit*.28),'fill-rule="evenodd" stroke-linejoin="round"')
      + circle(rim, 'none', light, Math.max(.7, unit*.36))
      + circle(rim - unit*.67, 'none', shade,.65)
      + circle(hub*1.18, 'none',shade,.8)
      + circle(1.25,light,shade,.55,fmt(rim*.96),0);
  }

  function screw(x,y,r=3.3,angle=-32) {
    return `<g transform="translate(${x} ${y}) rotate(${angle})">` + circle(r,'#b9b5a0','#555547',.9)
      + path('M'+(-r*.72)+' 0h'+(r*1.44),'none','#5d5a4d',1.15) + '</g>';
  }
  const defs = `<defs>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0v5" stroke="#6b6956" stroke-width=".75" opacity=".55"/></pattern>
    <pattern id="micro" width="4.2" height="4.2" patternUnits="userSpaceOnUse"><path d="m0 3 1-1m2-1 .6-.4" stroke="#6c6957" stroke-width=".45" opacity=".44"/></pattern>
    <pattern id="knurl" width="3.5" height="4" patternUnits="userSpaceOnUse"><path d="M.7 0v4" stroke="#6a604d" stroke-width="1.3"/></pattern>
    </defs>`;

  function caseDrawing() {
    const romans = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    const numerals = romans.map((v,i) => {
      return `<text x="0" y="-140" transform="rotate(${i*30})" text-anchor="middle" font-family="Georgia,serif" font-size="8.7" fill="#696452">${v}</text>`;
    }).join('');
    const crescent = 'M-102 61 Q-90 77 -65 76 Q-32 74 -23 86 Q-9 99 11 89 Q32 78 52 82 Q81 86 101 62 A120 120 0 0 1 -102 61Z';
    const scroll = 'M-78 87q18-6 24 1q8 10 18 6q8-4 2-8q-4-2-5 2m-25 1q12 9 23 9M78 87q-18-6-24 1q-8 10-18 6q-8-4-2-8q4-2 5 2m25 1q-12 9-23 9';
    let bezel = '';
    for (let i=0;i<150;i++) {
      const a=i*tau/150;
      bezel += 'M'+polar(157,a)+'L'+polar(160,a+.006);
    }
    return `<g transform="translate(255 216)" stroke-linecap="round" stroke-linejoin="round">`
      + `<ellipse cx="3" cy="5" rx="164" ry="164" fill="#4f5146" opacity=".10"/>`
      + path('M-8-159v-18h16v18','#a79878',ink,1.6)
      + path('M-19-182c-17-7-15-30-3-38c12-9 35-7 44 4c13 16 4 30-9 35l-2-5c14-7 17-19 7-29c-8-7-25-9-35-2c-12 9-10 24 1 30Z','#c7ba96',ink,1.4)
      + path('M-16-187q-12-9-6-21m17-13q18-3 25 9','none','#80785f',.8)
      + path('M-12-168q-4-5-3-13q1-6 15-8q14 1 15 8q1 8-3 13Z','#b6a17a',ink,1.4)
      + path('M-12-168q-4-5-3-13q1-6 15-8q14 1 15 8q1 8-3 13Z','url(#knurl)','none')
      + path('M-11-168h22m-23 3h24','none',ink,1.5)
      + circle(164,'#cfbf9a',ink,1.9) + circle(161.8,'none','#756b54',.8) + path(bezel,'none','#756f5c',.9)
      + circle(155.6,'#e2d9bc',ink,1.4) + circle(153.3,'#f2ecd9','#847f6b',.85)
      + ticks(149.2,152,120,5,'#706c5d',.76) + numerals
      + circle(137.2,'#bab495','#777561',.8) + circle(134.6,'#d7d0b4',ink,1.25)
      + circle(131.9,'url(#micro)','#ad9f7e',.85)
      + path('M-122-35q13-58 62-79q26-11 47-8m72 13q45 25 58 54m-222 12q8-37 22-51','none','#a99f82',.9)
      + path('M-119-43q18-41 38-54l10 8q3 3 15-4l19-16q8-6 24-6q30-2 54 10l26 10q10 5 17 16l20 28q3-38-43-66q-58-37-123-11q-51 20-62 75Z','#c4bda0','#807d66',.85)
      + path('M-116-55q19-48 55-62m116 2q28 12 48 40','none','#e5ddc6',1.2)
      + path(crescent,'#b9b699','#78755c',1) + path(crescent,'url(#hatch)','none')
      + path(scroll,'none','#77755f',1) + path('M-82 93q30 28 69 30m26 0q45-4 67-29','none','#827b63',.8)
      + circle(7,'#d4c9ac','#7e7a66',.9,0,106) + circle(4.6,'none','#8f876e',.7,0,106)
      + screw(-77,-91) + screw(79,-88,3.5,22) + screw(-87,78,3.2,25) + screw(88,79) + screw(0,-118,3,20)
      + '</g>';
  }

  // Fine outlines of a setting tool and a pair of tweezers beside the movement.
  function toolsDrawing() {
    return `<g fill="none" stroke="#8a8b77" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" opacity=".78">
      <g transform="translate(433 235) rotate(19)">
        <path d="M-3-81q-5-7-9 0l2 48 4 70 4 35 2 4-1-46-1-66-1-45Zm-4 1 5 49 7 68 4 33 3 5-3-43-5-67-4-46q-1-4-5 1Z" fill="#d3d4c1"/>
        <path d="m-9-77 4 51m3-56 4 50m-12-42 5-3m-4 7 5-3m0-3 4-2m-3 6 4-3"/>
      </g>
      <g transform="translate(61 317) rotate(-28)">
        <path d="M-3-27v-22l3-7 2 7v22Z" fill="#bfc4af"/><path d="M-4-27h8v9h-8Z" fill="#b9b8a3"/>
        <path d="M-5-19q5-3 10 0l1 39-2 12h-8l-3-12Z" fill="#c7bd9e"/><path d="m-3-14 1 32m4-34v35m-8 2h11m-9 5h8"/>
      </g></g>`;
  }
  function mini(part,largest) {
    const unit = 39 / largest;
    return `<svg aria-hidden="true" viewBox="-23 -23 46 46">` + part.map((n,p)=>n ? wheel(n,unit,p?'high':'low') : '').join('')
      + screw(0,0,2.7) + '</svg>';
  }
  window.ClockArt = {circle,path,wheel,screw,defs,caseDrawing,toolsDrawing,mini};
})();
