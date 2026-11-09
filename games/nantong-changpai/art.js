/* Original vector artwork for Boopland. Traditional motifs are redrawn,
   not extracted from the commercial reference images. No remote assets. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NantongArt = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var PAPER = '#fffdf3', INK = '#414a3e', RED = '#a45143';
  var numbers = ['一','二','三','四','五','六','七','八','九'];
  var suits = ['万','条','饼'];
  var honors = ['红花','千字','白花'];
  var cache = [];

  function path(d, extra) { return '<path d="' + d + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function circle(x, y, r, extra) { return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'"'+(extra?' '+extra:'')+'/>'; }
  function flower(x, y, size, solid) {
    var p = '';
    for (var i = 0; i < 6; i++) p += '<ellipse cx="0" cy="-7" rx="3.6" ry="6.5" transform="rotate('+(i*60)+')"/>';
    return '<g transform="translate('+x+' '+y+') scale('+size+')" fill="'+(solid?'currentColor':PAPER)+'" stroke="currentColor" stroke-width="1.1">'+p+circle(0,0,3.3,'fill="'+PAPER+'"')+'</g>';
  }
  function bird() {
    return '<g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">'+
      path('M19 52 Q18 38 29 35 Q28 27 35 26 Q42 26 42 34 L47 36 L41 38 Q40 48 31 53 L21 55 L14 63 L17 51 Z')+
      path('M21 44 Q25 38 34 41 Q32 49 24 50 M23 44 L29 43 M24 47 L30 45 M28 54 L26 62 M32 53 L34 60 M23 63 L29 62 M31 62 L37 60 M20 36 Q15 40 17 48')+
      circle(37,31,1.2,'fill="currentColor" stroke="none"')+'</g>';
  }
  function sage(rank, suit) {
    if (suit === 1 && rank === 1) return bird();
    if (suit === 1 && rank === 9) {
      return '<g fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">'+
        circle(30,35,10,'opacity=".5"')+circle(30,35,5)+path('M26 28 Q30 20 34 28 M23 45 Q30 41 37 45 L40 58 Q30 65 20 58 Z M30 43 L30 55 M24 51 Q29 59 36 51 M16 63 Q20 55 29 62 Q30 53 32 62 Q41 55 45 63 Q32 70 16 63 Z')+'</g>';
    }
    var hat = rank % 4;
    var hats = [
      'M23 31 L22 26 L28 23 L31 26 L37 23 L37 31 M24 27 L35 27',
      'M23 30 Q20 24 26 22 L30 24 L33 20 Q40 23 37 31 M25 27 L35 27',
      'M22 30 L18 27 L23 25 L23 22 L36 22 L36 25 L42 27 L37 30 M26 25 L34 25',
      'M22 30 Q22 21 30 22 Q39 21 38 31 M26 23 Q26 17 31 17 Q36 18 33 23'
    ];
    var robes = [
      'M25 40 Q18 40 16 48 L21 50 L17 65 Q28 69 41 64 L37 50 L42 46 Q39 41 34 40 M25 41 L31 47 L35 41 M28 47 L25 62 M32 48 L35 62 M22 53 L20 62 M35 48 L39 61',
      'M25 40 L19 42 L15 53 L22 55 L19 66 L40 66 L36 54 L44 49 L38 42 L34 40 M25 41 L32 50 L35 42 M23 46 L23 58 M31 50 L27 63 M33 53 L35 63',
      'M25 40 Q18 40 17 46 L22 49 L19 65 Q30 70 42 64 L36 50 L41 46 L35 40 M25 41 L30 47 L34 41 M27 48 L24 62 M31 48 L36 64 M21 59 L27 57'
    ];
    var props = [
      path('M41 39 L43 65 M40 39 Q43 32 45 38 M21 47 L42 45'),
      path('M40 39 L40 61 M36 42 Q43 39 46 44 L42 51 Z M21 47 L37 47'),
      path('M19 48 L42 42 M40 39 L44 45 M23 51 L34 46'),
      path('M18 49 L39 49 M38 44 L44 44 L42 55 L38 55 Z'),
      path('M18 44 Q11 42 13 37 Q15 33 20 36 L24 46 M19 45 L38 49'),
      path('M39 42 L40 59 M36 44 L45 44 L44 52 L37 52 Z'),
      path('M18 52 L42 37 L44 34 L45 38 L21 56 M18 54 L23 58'),
      path('M16 49 Q17 43 22 46 Q29 49 34 45 Q39 41 43 47 M17 52 Q23 48 29 52 Q37 54 43 49'),
      flower(42,44,.34,false)
    ];
    return '<g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">'+
      path(hats[hat]) + path('M24 30 L24 35 Q25 41 30 41 Q36 40 36 34 L36 30 M27 33 L28 33 M32 33 L33 33 M29 35 L30 37 L32 36 M27 39 Q30 42 33 39')+
      path(robes[(rank+suit)%3]) + props[(rank+suit*3-1)%9] +
      path('M23 67 L20 70 L28 70 M34 67 L33 70 L40 70','opacity=".85"')+'</g>';
  }
  function positions(rank) {
    var maps = [[], [[30,132]], [[30,119],[30,146]], [[30,113],[30,132],[30,151]],
      [[22,119],[38,119],[22,146],[38,146]],
      [[22,113],[38,113],[30,132],[22,151],[38,151]],
      [[22,113],[38,113],[22,132],[38,132],[22,151],[38,151]],
      [[22,111],[38,111],[22,126],[38,126],[30,139],[22,153],[38,153]],
      [[22,110],[38,110],[22,124],[38,124],[22,139],[38,139],[22,153],[38,153]],
      [[19,113],[30,113],[41,113],[19,132],[30,132],[41,132],[19,151],[30,151],[41,151]]];
    return maps[rank];
  }
  function pips(rank, suit) {
    var parts = '';
    positions(rank).forEach(function (pos) {
      var x = pos[0], y = pos[1];
      if (suit === 0) parts += '<g fill="'+PAPER+'" stroke="none">'+circle(x,y,rank===1?7:rank===9?3.4:4.4)+'</g>';
      else if (suit === 1) parts += '<g transform="translate('+x+' '+y+')" fill="none" stroke="'+PAPER+'" stroke-width="1.25">'+
        path('M0 -5.5 L3 -2 L0 6 L-3 2 Z M0 -5 L0 5 M-3 -2 L3 -2')+'</g>';
      else parts += '<g fill="none" stroke="'+PAPER+'" stroke-width="1.1">'+circle(x,y,rank===9?4.1:5.8)+
        '<rect x="'+(x-1.7)+'" y="'+(y-1.7)+'" width="3.4" height="3.4"/>'+ '</g>';
    });
    return parts;
  }
  function card(id) {
    id = Number(id);
    if (!Number.isInteger(id) || id < 0 || id > 29) return back();
    if (cache[id]) return cache[id];
    var honor = id >= 27, suit = Math.floor(id/9), rank = id%9+1;
    var ink = honor || rank >= 8 ? RED : INK;
    var face = '<rect x="1" y="1" width="58" height="178" rx="4" fill="'+PAPER+'" stroke="#b7b7a4" stroke-width="1"/>'+
      '<path d="M5 8 L4 173 L55 174 M7 5 L54 5" fill="none" stroke="#dedaca" stroke-width=".6"/>'+
      '<path d="M7 23 L9 23 M52 39 L54 39 M7 74 L9 74 M51 87 L54 87 M7 166 L10 166" stroke="#d4cdb7" stroke-width=".7"/>';
    if (honor) {
      var h = id-27;
      face += '<g fill="none" stroke="'+ink+'" stroke-width="1.2" stroke-linecap="round">'+
        path('M14 11 Q30 5 46 11 M13 73 Q29 78 47 73 M13 105 L13 163 M47 105 L47 163')+'</g>';
      face += '<g color="'+ink+'">'+flower(30,39,h===1?1.1:1.5,h===0)+'</g>';
      face += '<text x="30" y="91" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="20" font-weight="bold" fill="'+ink+'">'+honors[h]+'</text>';
      face += '<rect x="17" y="106" width="26" height="58" rx="12" fill="'+ink+'"/>';
      if (h===1) face += '<text x="30" y="145" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="28" fill="'+PAPER+'">千</text>';
      else face += '<g color="'+PAPER+'">'+flower(30,135,.77,h===0)+'</g>';
      face += '<path d="M19 116 L22 111 M38 111 L41 116 M19 155 L22 160 M38 160 L41 155" stroke="'+PAPER+'" stroke-width=".7" fill="none"/>';
    } else {
      face += '<g fill="'+ink+'" font-family="Georgia,serif" font-size="17" font-weight="bold">'+
        '<text x="9" y="21">'+rank+'</text></g><text x="49" y="20" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="13" fill="'+ink+'">'+suits[suit]+'</text>';
      face += '<g color="'+ink+'">'+sage(rank,suit)+'</g>';
      face += '<text x="30" y="89" text-anchor="middle" font-family="KaiTi,STKaiti,serif" font-size="17" font-weight="bold" fill="'+ink+'">'+numbers[rank-1]+suits[suit]+'</text>';
      face += '<rect x="12" y="97" width="36" height="65" rx="1.6" fill="'+ink+'"/>';
      face += '<path d="M14 99 L46 99 M14 160 L46 160" stroke="'+PAPER+'" stroke-width=".6" opacity=".75"/>' + pips(rank,suit);
      face += '<g fill="none" stroke="'+ink+'" stroke-width="1.2">'+path('M13 168 L47 168')+'</g>';
      if (suit===1) face += '<path d="M30 165 L30 171" stroke="'+ink+'" stroke-width="2"/>';
      if (suit===2) face += circle(30,168,3.3,'fill="'+ink+'" stroke="'+PAPER+'" stroke-width="1.6"');
    }
    cache[id] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 180" aria-hidden="true" focusable="false">'+face+'</svg>';
    return cache[id];
  }
  function back() {
    var lines = '';
    for(var y=12;y<171;y+=8) lines += path('M8 '+y+' L52 '+(y-5));
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 180" aria-hidden="true" focusable="false">'+
      '<rect x="1" y="1" width="58" height="178" rx="4" fill="'+PAPER+'" stroke="#b7b7a4"/>'+
      '<rect x="6" y="7" width="48" height="166" rx="2" fill="#72816a"/>'+
      '<g stroke="#e6e8d7" stroke-width=".8" opacity=".32">'+lines+'</g>'+
      '<path d="M10 13 L49 12 L50 168 L11 169 Z" fill="none" stroke="#e6e8d7" stroke-width=".75"/>'+
      '<path d="M30 66 L45 90 L30 114 L15 90 Z" fill="#eff0df" stroke="#5a6b50"/>'+
      '<g color="#64765a">'+flower(30,90,.78,false)+'</g></svg>';
  }
  function avatar(index) {
    var one = index % 2 === 0;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'+
      '<path d="M5 31 Q4 6 31 5 Q59 5 59 32 Q58 59 32 59 Q7 59 5 31 Z" fill="'+(one?'#e3e8d8':'#e9dfd0')+'" stroke="#bec4b0"/>'+
      '<g stroke="#535b49" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+
      '<path d="M16 53 Q16 41 26 39 L38 39 Q49 43 49 53" fill="'+(one?'#aab89d':'#baa58c')+'"/>'+
      '<path d="M23 24 Q21 16 31 16 Q43 16 42 28 L40 36 Q34 43 27 37 Q22 33 23 24 Z" fill="#fff7e4"/>'+
      (one?'<path d="M21 25 Q17 12 31 11 Q45 11 44 26 L40 24 L39 20 Q31 24 24 21 Z" fill="#69715d"/><path d="M20 22 L15 24 M44 22 L49 23" fill="none"/>':'<path d="M21 26 Q17 15 30 13 Q46 14 44 27 L40 24 Q37 17 31 19 Q27 25 21 26 Z" fill="#786e5b"/><path d="M19 19 Q13 15 18 12 Q23 10 24 15" fill="#786e5b"/>')+
      '<path d="M27 28 L28 28 M35 28 L36 28 M30 33 Q33 35 35 32 M29 39 L33 44 L37 39 M33 44 L33 54" fill="none"/>'+
      '<path d="M10 49 L14 51 M50 14 L54 16" fill="none" opacity=".35"/></g></svg>';
  }
  return {card:card, back:back, avatar:avatar};
});
