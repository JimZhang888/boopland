/* Original pen drawings, using a 100-unit tile for specimens and map landmarks. */
const ShoreArt = (() => {
  const path = (d, fill = 'none', extra = '') => '<path d="' + d + '" fill="' + fill + '" ' + extra + '/>';
  const oval = (cx,cy,rx,ry,fill,extra='') => '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" '+extra+'/>';
  const lines = (d) => path(d, 'none', 'stroke-width="1"');
  const ink = '#465951', paper = '#faf4e5', tan = '#d4bb8d', green = '#9aa98c', sea = '#97bcb9', coral = '#c88768';
  const icons = {};
  icons.shell = path('M47 85 Q34 81 31 73 C21 65 7 56 8 47 Q7 39 14 38 Q9 30 18 26 Q18 18 27 19 Q30 11 39 15 Q44 7 53 13 Q60 8 66 16 Q76 13 79 22 Q88 23 86 32 Q96 37 90 45 Q97 51 88 58 C77 67 64 77 56 83 L60 89 L42 90 Z', '#dbc4a2') +
    path('M47 83 Q26 47 15 39 M48 81 Q31 39 20 28 M50 79 Q35 35 29 21 M50 79 Q44 28 40 16 M53 80 Q51 31 52 14 M54 80 Q60 29 64 18 M55 80 Q67 39 77 24 M56 82 Q75 47 85 34 M57 83 Q78 56 89 46') +
    lines('M18 48 Q26 41 29 40 M25 32 l6 -3 M39 21 l4 -1 M58 28 l4 1 M67 35 l7 3 M74 47 l7 4 M36 74 q14 5 27 -2 M40 78 q11 5 20 -2');
  icons.razor = '<g transform="rotate(29 50 50)">'+path('M37 12 Q47 8 59 13 L62 78 Q60 90 49 91 Q38 91 36 79 Z',tan)+path('M45 14 Q51 10 57 14 L59 78 Q55 88 48 86 Z','#e9d6ae')+
    lines('M41 18 L40 77 Q41 84 46 86 M50 16 l2 66 M54 18 l2 54 M38 28 l8 -3 M38 38 l8 -3 M38 48 l8 -4 M38 60 l8 -3 M38 71 l8 -3 M43 79 l11 -3')+'</g>';
  icons.cockle = icons.shell;
  icons.crab = path('M28 55 Q17 52 12 40 Q5 38 6 27 Q10 19 11 22 L13 30 L19 27 L21 19 Q29 28 23 37 L19 40 L31 45 M70 53 Q80 49 84 38 Q80 32 82 25 L88 18 L87 28 L92 31 L96 23 Q100 32 95 41 L90 43 Q85 57 74 59',coral)+
    path('M28 56 L17 58 L9 52 M30 64 L18 69 L9 66 M33 68 L23 78 L14 81 M71 55 L81 57 L94 50 M70 61 L83 67 L93 62 M67 66 L79 77 L91 77','none','stroke-width="3.5"')+
    path('M24 54 L27 48 L30 49 L31 44 Q48 35 66 43 L68 47 L72 47 L76 54 Q71 69 60 72 Q41 78 28 62 Z',coral)+
    path('M36 43 L35 37 M61 42 L63 36','none','stroke-width="3"')+oval(35,36,2.2,2.2,ink)+oval(64,35,2.2,2.2,ink)+
    lines('M33 50 q8 -7 15 -5 m6 0 q6 -2 11 4 M35 58 q6 4 13 4 m7 0 q6 -1 11 -5 M38 66 q12 5 23 0 M18 45 l-4 -3 M83 49 l3 -4');
  icons.shrimp = path('M23 33 Q48 16 70 32 Q86 45 80 62 Q74 81 50 79 L40 86 L37 76 L28 73 L44 69 Q61 70 65 57 Q67 48 51 47 L36 52 L29 45 L15 45 L29 40 Z','#d3a389')+
    lines('M29 34 Q11 10 3 20 M33 32 Q23 5 12 10 M24 37 L9 33 M47 28 q2 11 -4 19 M55 27 q6 12 -1 20 M66 30 q4 13 -3 19 M74 36 q3 11 -7 18 M80 47 q-3 9 -12 11 M78 63 q-4 4 -12 0 M70 73 l-9 -6 M40 50 l-13 9 M44 50 L33 65 M48 50 L41 64 M51 51 l-4 12')+
    oval(33,37,2,2,ink);
  icons.hermit= path('M23 60 Q8 43 22 25 Q36 9 57 16 Q81 24 76 48 L70 64 L43 76 Z','#c7ab88')+
    path('M58 56 Q72 46 67 34 Q60 19 43 21 Q27 23 24 38 Q23 52 37 56 Q49 58 53 48 Q57 39 46 34 Q36 32 34 40 Q33 45 39 46')+
    lines('M21 29 l5 3 M18 38 l6 2 M18 47 l7 -2 M23 56 l7 -4 M30 63 l5 -6 M39 68 l3 -7 M48 68 l0 -7 M54 66 l-1 -6')+
    path('M53 69 Q60 54 72 58 L79 65 L86 60 L89 51 Q99 64 90 71 Q84 76 75 71 L63 77 L49 76 Z',coral)+
    path('M61 75 l-6 10 l-10 1 M68 73 l0 11 l-7 3 M76 70 l7 9 l8 0 M76 61 l3 -9 M80 61 l4 -8')+oval(79,51,1.5,2,ink)+oval(85,52,1.5,2,ink);
  icons.cuttle = '<g transform="rotate(28 50 50)">'+path('M49 9 Q74 22 76 48 Q77 64 66 65 Q55 71 38 63 Q25 61 25 48 Q25 25 49 9 Z','#9cafa8')+
    path('M49 10 Q68 23 66 49 Q65 62 55 65 L42 61 Q28 37 49 10 Z','#bacac1')+
    path('M39 60 Q49 56 63 63 Q68 70 62 77 Q57 82 44 77 Q35 71 39 60 Z','#c7d3c7')+
    path('M41 72 Q36 86 26 83 M45 76 Q42 90 33 91 M50 77 Q49 90 44 93 M54 77 Q52 89 58 92 M58 76 Q60 87 68 88 M62 74 Q70 83 77 79')+
    lines('M43 22 q9 4 17 0 M39 30 q15 5 23 0 M38 39 q14 5 24 0 M39 47 q11 4 19 0 M28 46 l3 8 M70 44 l1 8')+oval(44,67,2,2,ink)+oval(58,69,2,2,ink)+'</g>';
  icons.spade = '<g transform="rotate(36 50 50)">'+path('M41 8 Q50 4 59 8 L57 23 L53 28 L53 66 L47 66 L47 28 L42 23 Z','#ba956e')+path('M46 11 L54 11 L53 19 L47 19 Z',paper)+
    path('M37 58 Q49 62 62 58 L63 72 Q62 84 51 94 Q37 87 36 73 Z','#a9b6aa')+lines('M50 64 L51 86 M40 73 q1 8 6 13 M57 68 l1 8 M49 31 l0 23')+'</g>';
  icons.tongs='<g transform="rotate(34 50 50)">'+path('M47 8 Q51 4 55 9 L67 75 Q70 86 60 93 Q63 83 60 77 L51 30 L44 77 Q43 84 46 91 Q36 85 37 75 Z','#b7bbb0')+
    path('M47 13 Q51 6 54 13 L57 36 L52 39 L51 30 L49 38 L44 36 Z','#b59470')+lines('M48 18 l-2 13 M61 63 l3 14 M42 65 l-2 12')+'</g>';
  icons.net='<g transform="rotate(37 50 50)">'+path('M47 53 L53 53 L54 92 Q50 96 46 92 Z','#c39d74')+path('M28 30 Q28 7 49 7 Q69 7 71 28 Q74 46 51 63 Q34 55 28 30 Z','#bbcfc4')+
    oval(49,28,21,19,'none')+lines('M29 30 l25 28 M31 21 l30 31 M37 14 l28 30 M45 11 l23 23 M30 35 l18 -23 M34 44 l23 -30 M39 49 l25 -30 M45 55 l23 -28 M51 68 l-1 21')+'</g>';
  icons.bucket=path('M24 37 C24 -2 73 -1 77 37','none','stroke-width="3"')+path('M17 37 Q46 24 83 37 L74 78 Q53 89 29 78 Z','#a8c2ba')+oval(50,37,33,8,'#d6e0d1')+oval(50,37,28,4,'#899e97')+
    path('M27 47 Q28 59 33 71 M32 78 Q53 84 72 77 M38 43 l3 24 M67 43 l-4 29')+oval(24,40,2,2,ink)+oval(77,40,2,2,ink);
  icons.wave=path('M8 39 C23 42 32 31 45 19 C56 9 68 12 73 18 Q57 20 58 32 Q60 45 88 40 M9 57 Q23 65 40 55 Q53 47 64 54 Q78 62 91 54 M15 71 Q28 77 42 69 Q53 63 64 68 Q77 75 86 69','none','stroke-width="5"');
  icons.book=path('M8 23 Q27 15 49 26 Q69 14 92 19 L89 77 Q66 72 48 84 Q28 75 10 79 Z M49 26 L48 81 M17 34 Q29 30 40 35 M17 44 Q29 40 40 45 M59 36 Q70 30 82 29 M60 45 Q71 39 80 38','none','stroke-width="4"');
  icons.flag=path('M25 86 L33 11 M33 15 Q48 6 59 17 Q68 23 82 15 L77 43 Q65 50 53 42 Q41 34 29 44','none','stroke-width="5"');
  icons.pin=path('M50 90 C39 74 16 50 19 32 Q23 8 50 10 Q77 10 80 34 Q82 52 50 90 Z','none','stroke-width="5"')+oval(50,37,10,10,'none','stroke-width="4"');
  icons.foot=path('M20 63 Q17 53 26 39 Q38 20 47 31 Q54 42 39 61 L34 70 Z M15 68 l15 6 q-3 13 -12 10 q-7 -3 -3 -16 Z M60 43 Q56 32 61 20 Q70 3 79 14 Q85 26 77 42 L70 51 Z M56 49 l14 9 q-2 12 -10 9 q-10 -3 -4 -18 Z',ink);
  icons.compass=path('M50 8 L65 58 L50 50 L34 57 Z',ink)+path('M50 92 L34 57 L50 50 L65 58 Z',paper)+oval(50,50,38,38,'none','stroke-width="1"')+path('M10 50 L22 50 M78 50 h12 M50 7 v6 M50 86 v8');
  icons.arrow=path('M22 50 h56 M52 24 L78 50 L51 77','none','stroke-width="6"');
  icons.back=path('M78 50 H22 M46 25 L21 50 L47 75','none','stroke-width="6"');
  icons.razorSign=oval(40,53,12,7,'#8b7c61')+oval(62,47,11,7,'#786f58')+path('M23 56 q9 17 32 8 M48 40 q16 -13 29 1 M22 68 l7 -1 M65 62 l9 -3')+lines('M28 47 l5 -2 M38 66 l7 1 M73 48 l4 3');
  icons.cockleSign=path('M20 63 Q46 38 76 54 L84 61 Q53 75 20 63 Z','#c8b08a')+path('M29 58 q18 -16 37 -12 M38 48 q9 -8 23 -6 M34 61 q18 -9 32 -8')+lines('M20 69 l8 1 M67 64 l9 -2 M51 47 l7 -2');
  icons.crabSign=oval(65,42,14,8,'#897c64')+path('M47 36 q18 -15 33 3 M24 70 l8 1 m-5 -6 l7 0 M36 61 l8 0 m-4 -7 l6 1 M48 52 l7 -1 m-4 -5 l5 0','none','stroke-width="3"');
  icons.shrimpSign=oval(50,63,29,6,'none')+oval(56,51,7,6,'#c2dcd6')+oval(40,42,5,5,'#e4ebe0')+oval(59,30,4,4,'#e4ebe0')+lines('M19 71 q15 5 35 4 M57 73 l14 -2 M35 53 q-5 1 -7 3');
  icons.hermitSign=path('M16 69 Q33 73 40 59 T63 51 Q74 53 76 43 M15 64 Q30 68 35 56 T60 45')+path('M54 43 Q48 32 58 26 Q68 18 77 28 Q89 40 76 49 L66 51 Z',tan)+lines('M60 40 q-7 -7 1 -11 q8 -3 10 4 q2 6 -4 7 M25 72 l4 0 M40 64 l2 -1');
  icons.cuttleSign=path('M14 58 Q31 60 48 42 Q63 61 85 61 M21 49 Q35 49 49 34 Q63 48 78 51 M32 65 Q41 63 47 57 M59 62 l11 4')+oval(49,33,3,2,ink);
  icons.used=path('M24 51 l18 17 l36 -40','none','stroke-width="6"');
  function group(body, width=1.8) {return '<g fill="none" stroke="'+ink+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round">'+body+'</g>';}
  function svg(name) { return '<svg viewBox="0 0 100 100" focusable="false" aria-hidden="true">'+group(icons[name]||'')+'</svg>'; }
  return { icons, svg, group, path, oval, ink, paper, tan, green, sea, coral };
})();
