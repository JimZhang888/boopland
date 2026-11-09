/* Nantong long-card woodcut motifs, redrawn as local vectors.
   Reference: Shen Xiantao / Yu Xinyan, Jiangsu Local Chronicles 2011 (3),
   figures 4–9 and the illustrated identification guide; see README.md.
   The playable myriad inner panel uses enlarged dots at the user's request.
   No raster tracing or font-based card labels.
   IDs: 0–8 myriad, 9–17 strings, 18–26 coins, 27–29 flower cards. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NantongArt = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var PAPER = '#fffbee', INK = '#25332b', RED = '#ad3437';
  var cache = [];
  function path(d, extra) { return '<path d="' + d + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function circle(x, y, r, extra) { return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'"'+(extra?' '+extra:'')+'/>'; }
  function rect(x,y,w,h,extra) { return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"'+(extra?' '+extra:'')+'/>'; }
  function lines(d, color, width) { return '<g fill="none" stroke="'+(color || INK)+'" stroke-width="'+(width || .95)+'" stroke-linejoin="round" stroke-linecap="round">'+path(d)+'</g>'; }
  function group(body, transform, color, width) { return '<g transform="'+transform+'" fill="none" stroke="'+(color || INK)+'" stroke-width="'+(width || 1)+'" stroke-linejoin="round" stroke-linecap="round">'+body+'</g>'; }

  // These are the rank symbols, not Arabic/Chinese numerals. The same silhouettes
  // occur at both ends of the inner panel, with the lower one rotated 180°.
  // Myriad leaves the cuts blank; strings split them with a stroke; coins add dots.
  var HEADS = [
    'M0 0H48V28Z',
    'M46 14A12 12 0 1 1 22 14A12 12 0 1 1 46 14Z',
    'M17 1H47L32 27H2Z',
    'M4 28V20C4 -6 44 -6 44 20V28Z',
    'M23 14A11 11 0 1 1 1 14A11 11 0 1 1 23 14M47 14A11 11 0 1 1 25 14A11 11 0 1 1 47 14Z',
    'M5 1H43L36 27H12Z',
    'M11 1H27L19 27H3ZM30 1H47L39 27H22Z',
    'M4 0H44V7C44 34 4 34 4 7Z',
    'M31 0C12 0 8 13 9 28H44V11C44 4 39 0 31 0Z'
  ];
  var SPLITS = ['M35 2L26 12','M34 2V26','M8 22L41 5','M24 1V28','M12 3V25M36 3V25','M24 1V27','M6 23L24 5M25 23L43 5','M24 0V26','M26 1V27'];
  var DOTS = [[[35,8]],[[34,14]],[[25,14]],[[24,19]],[[12,14],[36,14]],[[24,14]],[[16,14],[35,14]],[[24,10]],[[28,15]]];
  function head(rank, suit) {
    var out = rect(0,0,48,28,'fill="'+INK+'"')+path(HEADS[rank-1],'fill="'+PAPER+'"');
    if (suit === 1) out += lines(SPLITS[rank-1], INK, 1.35);
    if (suit === 2) DOTS[rank-1].forEach(function(p) { out += circle(p[0],p[1],4,'fill="'+INK+'"'); });
    return out;
  }
  function frame(content) {
    return rect(10,124,40,124,'fill="'+PAPER+'"')+rect(12,126,36,120,'fill="none" stroke="'+INK+'" stroke-width="1"')+content;
  }
  function face(x,y,variant) {
    var side = variant === 'side', old = variant === 'old', female = variant === 'woman';
    var d = side ? 'M-5 -5Q2 -9 6 -3L6 0L9 3L6 5Q7 11 1 12L-4 7Z M3 0L5 1M4 7H6M-4 -2Q-8 -2 -6 3L-3 5' :
      'M-7 -5Q0 -10 7 -5L7 3Q6 10 0 12Q-6 9 -7 3Z M-5 0L-2 0M2 0L5 0M0 1L-1 5L2 5M-2 8H2M-8 0Q-11 -2 -9 4L-6 5M8 0Q11 -2 9 4L6 5';
    if (old) d += ' M-6 7L-7 13L-3 20L0 16L3 20L7 13L6 7M-3 9L-2 15M3 9L2 15';
    if (female) d += ' M-7 -4Q-9 -12 0 -12Q9 -12 7 -4M-7 -7Q0 -3 7 -7M-9 4L-9 12M9 4L9 12';
    return group(path(d), 'translate('+x+' '+y+')');
  }
  function pleats(x,y,count,step,length) {
    var d = '';
    for(var i=0;i<count;i++) d+='M'+(x+i*step)+' '+y+'v'+length;
    return path(d);
  }
  function lotus(x,y,size) {
    return group(path('M0 10Q-18 -3 -14 -16Q-4 -15 0 -6Q4 -16 14 -16Q18 -3 0 10Z M0 9Q-10 -8 0 -24Q10 -8 0 9M-14 -15L-22 -18Q-24 4 0 16Q24 4 22 -18L14 -15M-20 7L20 7M-18 13L18 13M-14 18L14 18'), 'translate('+x+' '+y+') scale('+size+')', RED,1.35);
  }

  // The upper vignettes retain the folk-character silhouettes: headdresses,
  // robes and identifying props. Individual poses are drawn rather than a rank
  // stamped onto one generic face. Lines are deliberately coarse enough for play.
  function figure(id) {
    var d = '', extras = '', color = INK;
    if (id === 0) { // Feathered female general.
      extras=face(29,21,'woman');
      d='M20 17L18 10L23 7L27 9L30 5L34 9L39 7L38 18M20 10Q9 -1 10 31M39 10Q52 -2 49 33M15 9Q11 19 12 38M45 9Q50 20 47 39M22 33L15 39L12 58L20 62L18 79L25 82L29 73L34 82L42 79L38 59L46 54L42 37L36 32M23 33L29 39L35 33M18 42L29 49L42 41M20 51L39 51M20 55L39 55M24 40L24 45M34 40L34 45M24 59L23 76M29 59V70M34 59L36 77M15 61L12 80M44 56L47 81M16 84H24M34 84H43M11 48L42 47M14 45L16 53M38 44L40 51';
    } else if (id === 1) { // Basket / lantern bearer.
      extras=face(35,21,'side');
      d='M28 16L29 9L37 7L39 3L42 6L40 15M28 18L27 26M28 34L23 45L25 56L23 79L42 79L38 54L43 40L39 33M27 35L37 45L39 36M28 48L38 52M26 55L39 58M27 60V77M31 60V77M35 60V77M39 63V77M24 80L22 84H30M36 80L38 84H45M29 39L18 37L16 41L27 44M16 17V45M11 16H22V34H10Z M12 20H21M12 25H21M12 30H21M14 17V34M18 17V34M13 9L16 7L19 10L18 16H14Z M14 35L12 43M18 35L21 43';
    } else if (id === 2 || id === 14) { // Scholar / bamboo-tube elder.
      extras=face(29,21,id===14?'old':'side');
      d='M22 17L21 9L27 6H37L37 16M24 9L24 15M33 8L34 16M22 32L15 37L18 52L22 55L20 78H41L37 53L42 44L36 32M24 33L32 45L36 34M19 37L24 51L37 56M16 43L39 51M19 49L37 59M24 56L24 76M28 58V77M32 60V77M36 62V77M21 80L20 84H28M34 80L38 84H45M10 29L17 33L18 37L10 34Z M39 39L47 30L49 32L42 43M45 28L48 26L52 29L49 33';
    } else if (id === 3) { // Bearded pilgrim with prayer beads.
      extras=face(29,23,'old');
      d='M21 15Q18 3 28 5Q41 2 39 17M21 12L37 12M27 7V12M33 7V12M20 36L13 44L17 59L21 61L20 81H41L38 60L44 54L39 36M22 40Q30 55 38 40M17 46L19 55L24 54M39 45L39 54L34 55M24 58H36M25 62V79M30 61V80M35 62V79M19 83H27M35 83H44M47 9V81M44 9Q49 3 51 9L48 14';
      for(var b=0;b<7;b++) extras+=circle(20+b*3,41+Math.sin(b/6*Math.PI)*9,1.3,'fill="'+INK+'"');
    } else if (id === 4 || id === 6 || id === 10 || id === 15) { // Lotus maiden / flute / sword / white-snake maiden.
      extras=face(29,22,id===10?'side':'woman');
      d='M22 14Q21 4 27 6L30 3L36 7L37 16M23 33L17 40L19 54L23 56L21 79L40 80L37 55L43 44L36 34M25 35L32 43L35 35M18 40L31 51L42 45M20 46L31 56L39 51M25 56L25 77M30 57V78M35 58V78M23 80L19 84L28 84M34 81L37 85H44M19 62L15 73L19 79M40 56L43 70L40 77';
      if(id===4) d+=' M42 45L48 18M46 18Q39 15 42 11L48 13L51 8L54 13L49 18M47 27L51 24M45 34L41 28';
      if(id===6) d+=' M17 31L42 54M14 27L19 29L20 34M12 32L18 26M38 50L41 48';
      if(id===10) d+=' M13 69L43 22L46 18L47 25L16 74M14 69L20 72M37 30L45 35';
      if(id===15) d+=' M18 15Q8 21 12 47Q15 64 10 75M40 14Q52 30 46 54Q43 65 50 77M14 22L10 32M46 24L50 33';
    } else if (id === 5) { // Robed bearer of a branch.
      extras=face(29,21,'side');
      d='M20 16L23 8L34 5L38 12L36 18M24 11L34 9M23 32L14 39L18 57L23 59L21 80L41 81L37 56L43 48L37 33M24 34L35 46L36 35M18 41L30 52L43 46M20 48L31 58L38 53M26 59V79M31 60V79M36 60V80M22 82H29M35 82L44 85M43 48L47 14M47 14Q39 9 43 3Q50 2 50 11L47 14M46 26L41 23M45 35L51 30';
    } else if (id === 7 || id === 17 || id === 27) { // Red-print monk / lotus crown.
      color=RED;
      if(id===7) {
        extras=face(29,22,'old').replaceAll(INK,RED);
        d='M21 16Q17 5 26 5Q38 3 39 17M21 12Q29 7 38 13M20 36L13 43L17 62L15 79L23 84L39 82L44 65L40 37M21 37L35 54L38 38M14 46L28 59L42 52M18 55L29 65L41 59M21 66L23 80M28 64L29 81M35 64L35 80M18 69L13 73M40 68L45 75M25 33L20 39M34 33L39 39';
      } else {
        extras=lotus(30,28,1);
        d='M17 46Q7 59 15 81L29 87L45 81Q51 59 42 46M19 50Q14 64 22 78M41 50Q46 64 38 78M24 44V82M36 44V82M17 61Q30 51 44 62M17 72Q30 64 44 73M22 84L30 79L39 85';
        extras+=group(path(id===17?'M19 39Q30 34 41 39L36 43L21 44L21 49H37L37 56L24 58L25 64L39 64M29 46V62M20 68Q31 61 42 68':'M20 40H40M24 45H36M19 51H41M25 39V56M34 39V57M22 57L39 57L36 65H25L22 57M28 65L23 72M33 66L39 72'),'',INK,2.7);
      }
    } else if (id === 8) { // Prosperity figure, red overprint.
      color=RED; extras=lotus(30,27,1);
      d='M16 45L13 58L17 83L30 88L44 82L47 56L42 45M20 47L30 57L40 47M18 59L30 67L43 59M20 69L28 80L30 68L36 80L42 70M24 51V57M36 51V57M23 83L19 87M38 83L43 87';
      extras+=group(path('M19 40H41M23 45H37M20 51H40M24 39V58M35 39V59M21 57H39M26 59V66L33 64V57M19 66L24 64M38 63L42 69'),'',INK,2.5);
    } else if (id === 9) { // Sparrow, distinctive feathered silhouette.
      d='M18 52Q14 40 26 34Q28 19 39 21Q48 23 44 32L51 35L43 38Q40 51 29 57L17 59L9 70L12 57Z M17 42Q28 33 36 41Q34 50 21 53M20 42L30 39M20 46L31 42M22 50L34 44M29 58L27 71M34 55L38 68M22 73L30 71L33 73M34 71L39 68L45 69M15 56L10 66M18 59L13 70M16 34Q10 41 12 51M29 24L32 17L36 21M36 20L41 15L42 23';
      extras=circle(39,28,1.4,'fill="'+INK+'"');
    } else if (id === 11 || id === 12 || id === 13) { // Court cap, flute, bare-bellied fan bearer.
      extras=face(30,22,id===13?'old':'side');
      d='M22 17L22 8L27 6H38L38 17M23 9L19 10V18M38 10L43 11V18M23 33L15 39L19 56L22 59L20 79H42L38 57L43 45L37 33M25 35L32 45L37 35M18 42L31 51L42 47M20 48L30 57L38 54M25 58V77M30 59V78M35 59V78M22 81L19 85H28M35 81L39 85H46';
      if(id===11) d+=' M19 41L17 30L22 31L25 43M16 29H23M19 29V20';
      if(id===12) d+=' M11 38L47 28M12 41L48 31M39 31V34M34 32V35M29 34V37';
      if(id===13) d+=' M24 48Q20 57 31 59Q40 57 37 49M28 54H30M43 43L46 28M41 29Q34 18 44 16Q55 15 52 27L46 31Z M43 18L46 29M48 18L47 29';
    } else if (id === 16) { // Red official above the bridge's crossed cords.
      color=RED; extras=face(29,22,'old').replaceAll(INK,RED);
      d='M21 16Q20 6 28 6Q39 6 38 17M25 7L27 3L33 5M22 36L15 42L18 57L21 60L21 79H42L38 58L44 44L37 36M24 40L30 47L35 40M23 48L35 48M26 52V56M33 52V56M24 59L24 77M29 59V78M34 60V78M39 61V79M22 81H29M36 82L44 85M15 47L14 25M14 25Q8 18 11 12L17 13L19 23M10 13L8 31M13 13L12 32M16 14L17 30';
    } else if (id === 18) { // Longevity elder, large forehead and staff.
      extras=face(30,24,'old');
      d='M22 17Q17 3 28 3Q41 2 39 18M21 38L14 43L14 61L21 64L20 80H41L38 61L45 53L39 38M23 41L31 50L36 42M15 48L30 58L42 53M19 57L31 66L39 61M25 66V78M31 67V79M37 65V79M20 83H28M36 83H45M10 19V84M10 20Q6 12 12 11L15 15M13 54Q20 48 24 54L22 61L15 61Z';
    } else if (id === 19) { // Crutch and gourd, uneven stance.
      extras=face(30,23,'old');
      d='M23 15L20 10L26 5L33 7L38 13M23 12L34 10M22 37L15 44L21 60L22 67L16 79L22 83L31 71L35 82L43 82L39 59L42 43L37 36M25 39L32 48L37 40M17 47L28 57L39 52M22 59L38 59M18 80L14 84H23M36 83L45 86M12 36L12 85M8 36H17M40 47Q50 42 49 50Q47 54 50 58Q51 68 44 69Q38 66 41 59Q45 54 40 53Z';
    } else if (id === 20) { // Pig pilgrim carrying a rake.
      extras=face(31,24,'side');
      d='M24 18L22 10L32 7L39 10L39 17M37 22L44 22L44 28H38M24 21L19 18L18 26L25 28M23 36L16 42L17 61L23 65L22 79L28 81L31 65L35 81L43 80L38 61L44 45L38 35M25 38L35 47L38 38M18 48L32 55L43 47M22 57L37 57M23 82L18 86H27M35 83L44 85M12 49L46 8M42 6L50 13M44 3L41 6M47 5L44 9M50 8L47 12M52 10L50 14';
    } else if (id === 21) { // Tang monk, crown and embroidered robe.
      extras=face(29,24,'side');
      d='M21 18L19 7L25 11L29 3L34 11L41 7L38 19M22 14H38M22 36L15 44L18 59L20 78L31 84L43 78L38 59L44 46L36 35M24 37L35 48L37 37M19 45L37 59M18 53L41 68M20 63L39 78M26 42L21 72M32 48L28 79M38 56L35 81M19 42L42 75M18 50L36 81M17 81L27 85M36 83L45 83M10 10V85M7 11Q3 5 10 3Q17 5 13 11M7 14H13';
    } else if (id === 22) { // Monkey with raised staff.
      extras=face(31,23,'side');
      d='M23 17Q22 8 31 10Q41 10 39 20M24 14H39M22 20L19 19L18 25L24 29M24 36L17 40L12 30L8 33L13 48L23 49L23 58L19 66L14 77L20 81L28 69L34 66L37 77L44 77L42 62L35 56L38 45L45 37L42 33L33 39M23 51H36M22 55H37M18 78L13 83L22 83M37 79L46 80M9 11L48 63M7 10L11 7M45 63L49 61M21 59L16 60L12 56M32 47L35 42';
    } else if (id === 23) { // Turtle spirit with patterned shell.
      extras=face(31,23,'side');
      d='M24 18L23 10L31 9L35 13L40 12L39 20M23 36L17 42L15 59L22 67L24 77L30 79L31 66L36 78L43 77L39 64L43 49L37 36M20 40Q12 53 22 63Q31 70 38 59L37 42Z M21 41L26 46L22 52L17 48M26 46L32 42L36 48L31 53L26 46M22 52L26 59L31 53L36 59M23 63L26 59M23 80L19 84H29M35 80L44 83M12 10L47 43M10 9L13 7M42 35L45 31';
    } else if (id === 24) { // Clam spirit, a pleated shell.
      extras=face(30,21,'side');
      d='M24 16L23 9L33 7L39 11L38 17M23 32Q9 45 17 65L26 70L21 79L27 82L32 72L38 82L44 79L38 65Q49 42 36 32Z M24 34Q17 46 23 64M28 33Q22 47 28 67M32 34Q27 48 33 66M36 35Q33 50 38 63M39 39Q39 49 41 58M15 46L10 43L8 48L16 53M21 81L17 85H28M38 83L46 85M10 29L21 18';
    } else if (id === 25) { // Liu Hai, raised coin string.
      extras=face(29,26,'side');
      d='M22 21Q18 12 27 12Q39 12 38 22M22 17L17 10L22 5L27 8M23 38L17 47L20 58L18 68L24 70L28 59L33 69L40 65L36 54L43 43L39 39L32 45M22 52L35 55M24 58L22 66M30 58L35 65M20 71L18 79L24 80L28 72M34 70L38 79L44 78L40 68M17 81L25 82M38 81L46 79M18 43L12 34L14 16L18 17L17 33L24 38M38 40L47 25L46 12L42 12L42 25L34 34M15 16Q27 0 44 12';
      for(var k=0;k<5;k++) extras+=circle(20+k*5,9-Math.sin(k/4*Math.PI)*3,2,'fill="'+PAPER+'" stroke="'+INK+'" stroke-width=".8"');
    } else if (id === 26) { // Qilin and child.
      extras=face(30,18,'side');
      d='M24 12L23 6L31 4L36 9M23 29L22 40L31 47L39 40L35 29M25 30L33 38L35 31M24 40L20 48M35 40L39 47M18 50L14 42L9 45L10 54L17 58L16 72L21 79L25 72L35 73L39 81L44 78L42 64L47 55L42 48L35 50L29 47L23 51Z M12 43L10 37L16 40L20 35L20 46M13 50L18 50M18 58Q31 66 41 55M17 65L24 65M29 66L36 66M25 52L27 56L24 60M33 52L36 56L32 60M18 80L24 82M39 83L46 82M45 56Q54 58 49 71L46 73M47 59L50 63';
    } else if (id === 28) { // Geometrical red seal at the head of the thousand card.
      color=RED;
      d='M11 4V26H24V5M15 5V19H20V5M32 5V24M38 4V25M45 4V39M49 4V43M11 32H37V39H16V48H39V56H15V64H39V74H20V83H44M18 31V40M25 43V53M31 58V69M11 69V83H16M42 47V81M47 50V84';
      extras=lines('M13 28L40 28M20 37L35 37M24 47L37 47M19 60L36 60M26 69L36 69M28 25V76',INK,2.2);
    } else { // White flower, red warrior over a double-portrait inner panel.
      color=RED; extras=face(30,22,'old').replaceAll(INK,RED);
      d='M21 17Q15 7 26 4L37 8L40 18M22 10L37 14M22 35L15 42L18 58L17 79L29 85L42 80L39 59L45 47L37 35M25 39L35 50L37 40M18 46L29 56L42 49M21 56L30 64L39 58M24 65V80M30 64V83M36 65V80M17 82L25 86M36 84L45 85M12 6V84M9 7L12 3L16 7M15 44L11 40';
    }
    return '<g color="'+color+'">'+extras+lines(d,color,1.12)+'</g>';
  }

  // Water Margin inner portraits, in the photographed Nantong order. The dot
  // panel belongs to the old woodcut, unlike the removed text badges.
  function warrior(rank, transform) {
    var caps = [
      'M18 13Q18 3 30 3Q42 3 42 13M19 11H41M24 6L30 4L36 7M23 14L24 19M37 14L36 19',
      'M19 15L20 8Q30 -2 40 8L41 15M23 13L24 9Q30 4 36 9L37 13M22 17H38',
      'M19 14L17 6L24 8L29 3L35 8L42 6L40 16M21 11L38 11M25 8L25 12M34 8V12',
      'M21 16Q15 10 24 5Q36 -3 40 10L39 18M21 13L27 8L37 9M27 11L38 13',
      'M18 14L19 7L25 4L30 7L36 4L42 8L41 15M20 10L39 10M23 14L37 14',
      'M18 15L19 8L25 11L29 3L34 10L41 7L42 15M20 14H40M25 7L26 12M34 7L33 12',
      'M17 16L16 5L22 13L23 2L28 12L31 1L34 12L39 3L38 14L45 8L43 19M18 18Q30 8 42 19M21 21Q30 13 39 21',
      'M20 14Q19 4 28 5Q39 3 40 13M21 10L28 8L39 9M21 14L25 14M35 14L39 13',
      'M19 15L19 7L25 5L29 9L35 4L40 8L41 15M21 11H39M26 8V13M34 8V13'
    ];
    var faces = [
      'M21 17L21 28Q30 38 39 28L39 17M24 23L27 22M33 22L36 23M29 23V28H32M24 30L30 28L36 30M27 31L30 35L33 31',
      'M22 18L21 28L25 35L30 39L36 34L39 28L38 18M24 25H27M33 25H36M29 25L28 29L31 30M26 32L30 30L34 32M25 35L27 33M35 35L33 33',
      'M21 17L20 26L23 32L30 37L36 33L40 25L39 17M22 22L28 24M32 24L38 22M24 26H27M33 26H36M29 26L28 30L32 30M24 33L30 31L36 33M26 34L28 38L31 35L34 38',
      'M23 15L21 24L24 31L30 36L36 32L37 28L42 26L37 22L37 17M28 22L33 22M34 24L35 28M31 31L36 30M23 21L25 28M23 18L20 20',
      'M21 17L20 26L24 32L30 38L37 32L40 25L39 17M23 22L27 24M33 24L37 22M24 26H27M33 26H36M29 27L28 31L32 31M24 34L30 31L36 34M25 36L29 40L31 36L35 39',
      'M22 17L20 25L24 33L30 39L37 33L40 25L38 17M23 23L27 24M33 24L37 23M24 26H27M33 26H36M29 27L28 31H32M24 33L30 31L36 33M26 35L30 41L35 35',
      'M18 24L20 34L26 39L30 43L35 39L41 34L42 24M20 26L28 30L22 32L20 26M40 26L32 30L38 32L40 26M29 30L27 37L31 35L33 38M23 39L28 38M33 38L38 39',
      'M22 16L21 25L25 32L30 36L36 32L39 24L38 15M24 22L28 23M32 23L37 21M25 25H27M33 25H35M29 26L28 30H32M26 32L30 33L34 31',
      'M21 17L21 28L25 35L30 40L36 35L40 27L39 17M24 23L28 25M33 25L37 23M24 27H27M33 27H36M29 28V32H32M25 34L30 32L36 34M24 37L25 45L30 51L36 45L37 37M28 39V46M32 40V47'
    ];
    var robes = [
      'M21 35L15 41L16 90H44L45 41L38 35M23 38L30 45L37 38M17 48L43 48M17 53L43 53M22 58L38 58M21 62V86M27 60V87M33 61V87M39 62V87',
      'M22 37L16 44V91H44V44L37 37M19 41L30 51L41 41M20 46L30 55L40 46M19 54V85M25 56V88M32 56V87M38 54V88M17 89H43',
      'M23 37L16 43V92H44V44L37 37M20 41L30 50L41 40M19 48L29 55L41 48M17 61Q27 57 23 68Q18 76 18 86M43 61Q33 57 37 68Q42 76 42 86M26 56L26 77L31 91M34 56L33 75L26 89M17 79L42 87',
      'M23 34L16 42V92H44V42L36 34M21 38L33 52L39 39M17 44L42 59M17 53L43 69M18 66L42 79M18 79L37 91M23 52L20 90M30 58L27 91M38 64L35 91',
      'M23 39L16 45V92H44V45L37 39M19 44L30 54L41 44M18 50L42 66M18 58L42 74M18 68L41 85M19 80L34 91M27 53V78L30 84L34 77V55M28 58H33M28 63H33M28 68H33M28 73H33',
      'M23 39L16 44V92H44V45L37 39M20 43L30 52L40 43M19 48L30 57L41 48M18 55H41M21 59V91M25 59V91M30 59V91M35 59V91M39 60V91M17 73L42 62M18 78L42 68M18 83L42 73',
      'M21 39L16 47V92H44V47L39 39M18 44L30 55L42 44M17 51L30 62L43 51M17 57L30 69L43 57M17 64L27 73L17 82M43 64L34 73L43 82M18 87L25 79L30 83L35 79L43 87M28 68V92M32 69V92',
      'M23 34L16 42V92H44V43L37 34M21 39L32 51L39 39M17 48L41 61M18 57L42 70M18 69L41 82M18 81L33 91M26 47L19 89M33 55L26 91M40 61L34 91',
      'M23 45L16 50V92H44V50L37 45M18 49L30 61L42 49M18 57L29 67L42 57M18 65H42M21 69V91M27 70V92M33 70V92M39 69V91M18 81H43'
    ];
    var out=path(caps[rank-1])+path(faces[rank-1])+path(robes[rank-1]);
    if(rank===2) for(var j=0;j<4;j++) out+=circle(21,61+j*7,1.8)+circle(38,61+j*7,1.8);
    if(rank===3||rank===6) {
      var beard=''; for(var b=0;b<8;b++) beard+='M'+(20+b*3)+' '+(33+Math.sin(b/7*Math.PI)*7)+'l1 5'; out+=path(beard);
    }
    return group(out,transform || 'translate(0 145) scale(1 .99)',INK,1);
  }
  function flowerDotPanel(rank) {
    var out=rect(14,128,32,12,'fill="'+INK+'"');
    var rows=rank>3?2:1, cols=Math.ceil(rank/rows);
    for(var i=0;i<rank;i++) out+=circle(30+(i%cols-(cols-1)/2)*6,rows===1?134:131.5+Math.floor(i/cols)*5,1.75,'fill="'+PAPER+'"');
    return out;
  }
  function redCartouche() {
    return group(path('M15 131Q30 122 45 131V239Q30 250 15 240Z M19 133Q30 128 41 134V237Q30 243 19 237Z M15 137Q30 147 45 137M15 160Q30 149 45 161M15 168Q30 178 45 168M15 194Q30 183 45 195M15 204Q30 214 45 204M15 231Q30 220 45 232M10 145Q6 159 14 173M46 145Q54 160 46 175M11 181Q5 199 14 214M46 182Q55 200 46 215M23 137L30 151L37 137M22 169L30 184L38 169M22 205L30 220L38 205'),'',RED,1.7);
  }
  function redSeal() {
    return group(path('M9 104V117H19V107H25V125M39 106V119H49V108M11 125V242H19V254H10V264H22V251M49 125V243H41V256H50V267H37V251M7 141H53M7 147H53M7 172H53M7 179H53M7 204H53M7 211H53M7 236H53M22 126V137H38V126M24 151V166H36V151M24 183V198H36V183M24 215V231H36V215'),'',RED,1.55);
  }
  // Keep the ninth-card red fret on the border, clear of countable symbols.
  function redBorder() {
    return group(path('M9 104V117H19V107H25V122M39 106V119H49V108M8 126V245H18V254H10V267H23V254M52 126V245H42V256H50V269H37V254M8 144H11M49 144H52M8 180H11M49 180H52M8 216H11M49 216H52'),'',RED,1.55);
  }
  var MYRIAD_DOTS = [null, null,
    [[30,158],[30,214]],
    [[30,150],[30,186],[30,222]],
    [[22,156],[38,156],[22,216],[38,216]],
    [[22,150],[38,150],[30,186],[22,222],[38,222]],
    [[22,150],[38,150],[22,186],[38,186],[22,222],[38,222]],
    [[22,150],[38,150],[20,186],[30,186],[40,186],[22,222],[38,222]],
    [[22,143],[38,143],[22,171],[38,171],[22,201],[38,201],[22,229],[38,229]],
    [[20,150],[30,150],[40,150],[20,186],[30,186],[40,186],[20,222],[30,222],[40,222]]
  ];
  function myriad(rank) {
    // One myriad is a traditional red overprint exception, not a one-dot card.
    if(rank===1) return '<g data-body="myriad" data-special="red-myriad">'+frame(warrior(1))+redCartouche()+'</g>';
    // The figure remains above the head. This separate frame is for the dots.
    var out=rect(10,124,40,124,'fill="'+PAPER+'"')+rect(12,126,36,120,'fill="'+INK+'"');
    MYRIAD_DOTS[rank].forEach(function(p) {
      out+=circle(p[0],p[1],rank>=7?3.8:4.5,'data-pip="dot" fill="'+PAPER+'"');
    });
    return '<g data-body="myriad">'+out+(rank===9?redBorder():'')+'</g>';
  }

  // A single old-style ribbon for the exceptional one-string red overprint.
  function bundle(x,y,h,type) {
    var half=h/2, d=type==='pointed' ? 'M0 0L7 8L7 '+(half-6)+'L2 '+half+'L7 '+(half+6)+'L7 '+(h-8)+'L0 '+h+'L-7 '+(h-8)+'L-7 '+(half+6)+'L-2 '+half+'L-7 '+(half-6)+'L-7 8Z' :
      'M0 0C-10 4 -11 '+(half-6)+' -3 '+half+'C-11 '+(half+6)+' -10 '+(h-4)+' 0 '+h+'C10 '+(h-4)+' 11 '+(half+6)+' 3 '+half+'C11 '+(half-6)+' 10 4 0 0Z';
    var out=path(d,'fill="'+INK+'" stroke="'+INK+'"');
    out+=path('M0 4V'+(h-4),'stroke="'+PAPER+'" stroke-width="1"');
    for(var y1=9;y1<h-6;y1+=4) {
      if(Math.abs(y1-half)<6) continue;
      out+=path('M-6 '+y1+'H-1M1 '+y1+'H6','stroke="'+PAPER+'" stroke-width="1.5"');
    }
    return '<g transform="translate('+x+' '+y+')">'+out+'</g>';
  }
  function bow(y) { return lines('M30 '+y+'L19 '+(y-5)+'V'+(y+5)+'L30 '+y+'L41 '+(y-5)+'V'+(y+5)+'Z M24 '+(y-2)+'V'+(y+2)+'M36 '+(y-2)+'V'+(y+2),INK,1.3); }
  // One element is one visibly separate cord, not one pair of lobes. Explicit
  // layouts preserve the photographed 3=1+2, 4=2+2, 5=1+2+2, 6=2+2+2,
  // 7=1+2+2+2, 8=four diagonal pairs, 9=3+3+3 arrangements.
  var CORD_UNITS = [null, null,
    [[30,164,32,-52],[30,219,32,52]],
    [[30,164,30,0],[24,216,34,0],[36,216,34,0]],
    [[24,169,29,0],[36,169,29,0],[24,218,29,0],[36,218,29,0]],
    [[30,157,18,0],[24,186,24,0],[36,186,24,0],[24,224,24,0],[36,224,24,0]],
    [[24,157,24,0],[36,157,24,0],[24,190,24,0],[36,190,24,0],[24,224,24,0],[36,224,24,0]],
    [[30,151,16,0],[24,175,19,0],[36,175,19,0],[24,201,19,0],[36,201,19,0],[24,228,19,0],[36,228,19,0]],
    [[24,145,22,45],[36,145,22,45],[24,174,22,-45],[36,174,22,-45],[24,203,22,45],[36,203,22,45],[24,232,22,-45],[36,232,22,-45]],
    [[20,157,23,0],[30,157,23,0],[40,157,23,0],[20,190,23,0],[30,190,23,0],[40,190,23,0],[20,224,23,0],[30,224,23,0],[40,224,23,0]]
  ];
  function cordUnit(p) {
    var h=p[2]/2, bars='';
    for(var y=-h+5;y<h-3;y+=3.5) bars+='M-2.8 '+y+'H2.8';
    return '<g data-pip="cord" transform="translate('+p[0]+' '+p[1]+') rotate('+p[3]+')">'+
      path('M0 '+(-h)+'L4 '+(-h+4)+'V'+(h-4)+'L0 '+h+'L-4 '+(h-4)+'V'+(-h+4)+'Z','fill="'+INK+'"')+
      lines(bars,PAPER,1.35)+'</g>';
  }
  function cords(rank) {
    if(rank===1) return '<g data-body="cords" data-special="red-string">'+frame(bundle(30,132,107,'pointed'))+redCartouche()+'</g>';
    var ornament='';
    if(rank===2) {
      ornament=lines('M17 133H43V140H38V136H32V141H26V136H21V141H17Z M16 149Q29 152 28 170L24 183L20 182L23 172M43 205Q30 205 30 220L36 238L40 236L36 225M17 190V201H29V207H22V212H29M34 181H44V187H35V191H44');
    }
    if(rank===3) ornament=bow(135)+lines('M29 141Q16 148 20 178M31 141Q44 148 40 178M30 180L24 196M30 180L36 196M24 235H36');
    if(rank===4) ornament=group(circle(30,139,8)+circle(30,139,5)+path('M30 130V147M20 152Q16 169 23 186L30 193L23 200Q17 222 23 238H37Q43 222 37 200L30 193L37 186Q44 169 40 152'),'',INK,1);
    if(rank===5) ornament=bow(134)+lines('M27 140Q18 145 22 153M33 140Q42 145 38 153M30 168L24 174M30 168L36 174M24 200L30 205L36 200M30 205L24 212M30 205L36 212M24 238H36');
    if(rank===6) ornament=lines('M18 131H42V141H33V135H23V141H28V135M30 141V145M24 171L30 174L36 171M30 174L24 178M30 174L36 178M24 204L30 208L36 204M30 208L24 212M30 208L36 212M24 238H36');
    if(rank===7) ornament=bow(134)+lines('M30 160L24 165M30 160L36 165M24 185L30 188L36 185M30 188L24 191M30 188L36 191M24 211L30 214L36 211M30 214L24 218M30 214L36 218M24 239H36');
    if(rank===8) ornament=lines('M15 157L44 188L16 216L43 243M45 157L16 188L44 216M16 130L44 158M44 130L16 158',INK,1);
    if(rank===9) ornament=bow(134)+lines('M20 171L30 176L40 171M20 204L30 210L40 204M20 238H40');
    return '<g data-body="cords">'+frame(ornament+CORD_UNITS[rank].map(cordUnit).join(''))+(rank===9?redBorder():'')+'</g>';
  }

  function coin(x,y,r) {
    return '<g data-pip="coin" data-shape="round">'+group(circle(0,0,r)+circle(0,0,r-2.5)+path('M-2 -2H2V2H-2Z M-2 -7V-4M2 4V7M-7 2H-4M4 -2H7'), 'translate('+x+' '+y+')',INK,.9)+'</g>';
  }
  function halfCoin(x,y,side) {
    // The straight edge stays inside the inner frame; no reused SVG clip IDs.
    return '<g data-pip="coin" data-shape="half">'+group(path('M0 -14C15 -12 15 12 0 14Z M0 -11C11 -9 11 9 0 11M0 -7C7 -6 7 6 0 7M0 -2H3V2H0'), 'translate('+x+' '+y+') scale('+side+' 1)',INK,1)+'</g>';
  }
  function drum(y, redMotif) {
    return '<g '+(redMotif?'data-red-motif="coin"':'data-pip="coin" data-shape="ancient"')+'>'+group(path('M16 -17Q30 -25 44 -17L39 -10Q35 0 40 11L44 17Q30 25 16 17L21 10Q25 0 20 -10Z M16 -17Q30 -8 44 -17M16 17Q30 8 44 17M22 -15Q30 -20 38 -15Q30 -11 22 -15M22 15Q30 20 38 15Q30 11 22 15M27 -7H33V7H27Z M29 -5H31V5H29Z M18 -10Q24 0 18 10M42 -10Q36 0 42 10'), 'translate(0 '+y+')',INK,1.05)+'</g>';
  }
  function coins(rank) {
    var body='';
    if(rank===1) body=drum(155)+warrior(4,'translate(8 184) scale(.74 .63)');
    if(rank===2) body=drum(157)+drum(216);
    if(rank===3) [146,186,226].forEach(function(y){body+=coin(30,y,10.5);});
    if(rank===4) body=coin(30,145,10)+halfCoin(14,185,1)+halfCoin(46,185,-1)+coin(30,226,10);
    if(rank===5) body=halfCoin(14,146,1)+halfCoin(46,146,-1)+coin(30,186,10)+halfCoin(14,226,1)+halfCoin(46,226,-1);
    if(rank===6) [146,186,226].forEach(function(y){body+=halfCoin(14,y,1)+halfCoin(46,y,-1);});
    if(rank===7) {
      [142,185,229].forEach(function(y){body+=coin(30,y,8.5);});
      [163,207].forEach(function(y){body+=halfCoin(14,y,1)+halfCoin(46,y,-1);});
    }
    if(rank===8) [142,171,200,230].forEach(function(y){body+=halfCoin(14,y,1)+halfCoin(46,y,-1);});
    if(rank===9) body=drum(148,true)+drum(185,true)+drum(222,true);
    return '<g data-body="coins"'+(rank===9?' data-special="red-coins"':'')+'>'+frame(body)+(rank===9?redCartouche():'')+'</g>';
  }
  function honor(id) {
    if(id===29) {
      return rect(6,94,48,182,'fill="'+INK+'"')+
        path('M7 95Q12 101 16 96Q21 104 27 98Q34 105 39 98Q45 104 53 96L49 118H11Z M10 257Q17 250 23 257Q29 250 36 257Q43 250 50 256L53 270Q45 267 40 274Q33 268 27 274Q21 268 7 272Z','fill="'+PAPER+'"')+
        frame(lines('M16 132H44M19 136H41M23 139H37')+warrior(2,'translate(7 143) scale(.77 .47)')+warrior(7,'translate(7 193) scale(.77 .51)'));
    }
    return rect(6,94,48,182,'fill="'+INK+'"')+
      path(id===27?'M10 96Q15 87 21 97L21 111H11ZM27 95Q33 87 38 97L38 111H28ZM43 98Q51 91 53 103V113H43Z M8 251H26V271H8ZM34 251H52V271H34Z':'M8 95H21V115H8ZM28 96Q40 87 52 99V115H28Z M9 254H20V274H9ZM25 254H36V274H25ZM41 254H52V274H41Z','fill="'+PAPER+'"')+
      frame(flowerDotPanel(9)+warrior(id===27?9:5)) + redSeal();
  }
  function card(id) {
    id=Number(id);
    if(!Number.isInteger(id)||id<0||id>29) return back();
    if(cache[id]) return cache[id];
    var rank=id%9+1,suit=Math.floor(id/9);
    var out=rect(.7,.7,58.6,278.6,'rx="2.6" fill="'+PAPER+'" stroke="#bab9a6" stroke-width="1.1"');
    out+=lines('M3 4V276M57 5V275','#e4decd',.6)+figure(id);
    if(id>=27) out+=honor(id);
    else out+=rect(6,94,48,182,'fill="'+INK+'"')+
      '<g transform="translate(6 94)">'+head(rank,suit)+'</g>'+
      '<g transform="translate(54 276) rotate(180)">'+head(rank,suit)+'</g>'+
      (suit===0?myriad(rank):suit===1?cords(rank):coins(rank));
    cache[id]='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 280" aria-hidden="true" focusable="false">'+out+'</svg>';
    return cache[id];
  }
  function back() {
    var d='';
    for(var y=9;y<275;y+=6) d+='M6 '+y+'L54 '+(y-5);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 280" aria-hidden="true" focusable="false">'+
      rect(1,1,58,278,'rx="2.6" fill="'+PAPER+'" stroke="#bab9a6"')+rect(5,5,50,270,'rx="1" fill="#718168"')+lines(d,'#c4ceb5',.65)+
      rect(9,10,42,260,'fill="none" stroke="#dce2c9" stroke-width=".8"')+
      path('M30 104L47 140L30 176L13 140Z','fill="#eceddb" stroke="#53684b"')+
      group(path('M30 122L38 130L30 138L22 130Z M30 142L38 150L30 158L22 150Z M18 140H42M30 116V164'),'', '#62765a',1.1)+'</svg>';
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
