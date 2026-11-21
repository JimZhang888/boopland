/* Original relief-print motifs. An open cut in a block lets earlier ink show through. */
const WoodArt = (() => {
  const inks = { jade: '#728b74', clay: '#bf7060', soot: '#344b49', ochre: '#c5a066' };
  const path = d => '<path fill-rule="evenodd" d="' + d + '"/>';
  const line = (d, w = 1) => '<path fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" d="'+d+'"/>';
  const at = (x, y, scale, angle, content) => '<g transform="translate('+x+' '+y+') rotate('+angle+') scale('+scale+')">'+content+'</g>';
  const leaf = path('M0 0Q-16 -25 -5 -51Q1 -62 5 -69Q20 -38 0 0Z M1 -7Q4 -36 4 -59Q1 -43 1 -7Z');
  const sprig = line('M0 0Q9 -27 4 -60', 2) + at(5,-15,.45,-48,leaf)+at(7,-27,.52,45,leaf)+at(6,-42,.42,-45,leaf)+at(5,-54,.32,25,leaf);
  const lotusPad = path('M0 2Q-18 13 -48 8Q-68 6 -70 -3Q-74 -10 -62 -16Q-68 -22 -49 -26Q-48 -35 -29 -34Q-15 -41 -3 -35Q15 -42 25 -34Q41 -35 46 -28Q61 -27 59 -19Q73 -12 60 -5Q49 0 29 -1L1 -7L26 1Q15 6 0 2Z M-2 -7Q-24 -23 -48 -24Q-25 -19 -2 -7Z M-4 -6Q-29 -13 -60 -12Q-35 -10 -4 -6Z M-5 -5L-48 1Q-28 -3 -5 -5Z M0 -8L-10 -30Q-10 -22 0 -8Z M2 -8Q17 -24 25 -30Q12 -21 2 -8Z M6 -8L50 -18Q32 -17 6 -8Z');
  const flower = path('M0 3Q-25 5 -42 -16Q-35 -17 -26 -14Q-40 -29 -34 -44Q-24 -41 -15 -32Q-20 -51 -12 -63Q-2 -55 1 -46Q5 -62 13 -70Q26 -46 21 -35Q28 -47 39 -48Q43 -32 26 -20Q38 -24 47 -22Q31 3 0 3Z M1 -1Q-14 -13 -30 -36Q-22 -17 1 -1Z M4 -5Q-8 -26 -10 -51Q-11 -29 4 -5Z M7 -6Q15 -33 14 -56Q11 -33 7 -6Z M10 -4Q29 -24 35 -39Q21 -18 10 -4Z M-4 0Q-23 -8 -32 -12Q-22 -5 -4 0Z');
  const bud = path('M0 4Q-17 -4 -13 -18Q-11 -27 -4 -32Q-2 -39 0 -45Q4 -36 6 -33Q21 -14 13 -3Q8 3 0 4Z M0 -2Q5 -19 1 -35Q2 -16 0 -2Z');
  const dragonfly = line('M-10 2Q4 -2 19 -3M0 0Q-24 -11 -25 -5Q-22 0 0 0ZM0 0Q-21 5 -18 10Q-9 11 2 1ZM2 0Q14 -18 16 -13Q15 -8 2 0ZM3 0Q20 0 18 4Q10 5 3 0Z',1.4);
  const fruit = path('M-5 -16Q-17 -19 -21 -6Q-27 13 -12 19Q-4 23 1 21Q12 25 22 14Q31 -2 19 -12Q15 -18 5 -16Z M-17 -4Q-20 5 -15 12Q-17 3 -14 -5Z');
  const bird = path('M-42 8L-13 -1Q-4 -14 6 -13Q10 -28 22 -26Q33 -25 34 -16L43 -12L32 -10Q31 3 18 9Q7 15 -8 8L-36 21L-26 10Z M23 -21A1.9 1.9 0 1 0 23.1 -21Z M-11 4Q2 -9 14 -9Q4 -6 -11 4Z M-5 6Q8 -4 17 -5Q7 -2 -5 6Z M0 8L17 0L7 6Z') + line('M12 10L10 18L6 20M20 8L19 16L14 18',1.4);
  const roof = path('M-49 3Q-37 6 -29 -3L-5 -21L20 -8Q38 4 49 2L45 7Q28 11 12 4L-5 -4Q-23 8 -48 9Z M-37 5Q-20 2 -6 -12L-7 -9Q-17 2 -37 5Z M-4 -14L32 4L21 0Z');
  function lines(rows, w = 1) { return rows.map(d=>line(d,w)).join(''); }
  const willow = line('M0 0Q7 19 2 39Q0 49 4 58',1.35) +
    Array.from({length:7},(_,i)=>{
      const x=2+Math.sin(i*.65)*2, y=4+i*6;
      return at(x,y,.16+i*.009,i%2?153:207,leaf);
    }).join('');
  const ripples = lines(['M23 182q13 -2 24 -1m4 0 9 -1','M55 211q14 -3 32 -1m5 0 5 -1','M170 178q16 -1 33 -4','M164 204l15 -2m6 -1 13 -3','M96 228q16 1 26 0'],1);
  const roofTiles = lines(['M-33 3l10 -6m-6 7 11 -8m-6 7 10 -8m-5 7 10 -8m5 -5 16 8m-8 -7 14 7m-7 -2 10 4'],.85);
  const water = lines(['M21 215q19 -3 39 0m7 0 9 -1','M38 224q26 -3 47 0','M152 204q18 -3 39 -1','M167 214q20 -2 38 1','M97 241q18 -2 39 0','M120 246q15 -1 21 0'],1.6);
  const seal = at(199,234,1,0,path('M0 0L14 -.3L14.4 18L.3 18.3Z M2 2L2 16L12 16L12 2Z')+line('M4 4v4h2V4m2 0v5h3M4 10h6v4H8v-2H6v2H4z',1));
  const lotus = [
    line('M102 252Q89 194 73 161M124 255Q119 218 164 180M99 254Q113 229 59 208M143 246q1 -14 9 -20',2.5)+at(164,183,.83,-11,lotusPad)+at(73,164,.81,12,lotusPad)+at(59,209,.54,8,lotusPad)+at(151,228,.49,-15,lotusPad)+water,
    at(122,125,.83,-13,flower)+at(177,149,.49,11,bud)+seal,
    lines(['M121 124Q115 174 112 208Q112 230 106 252','M176 149Q169 183 154 213Q145 232 141 248','M115 125q7 6 16 -3m-13 4 3 4 8 -5','M173 150q4 5 10 -2','M30 231q21 -1 38 1m81 -5q17 -2 30 0'],1.9)+at(67,80,.75,-12,dragonfly)+at(118,110,.65,-13,lines(['M-24 -13l8 9m-5 -14 9 12','M18 -23q-2 8 -7 12','M-33 -19l5 4'],1.2))
  ];
  const twig = path('M9 207Q48 197 78 171Q110 146 143 116Q166 91 194 75Q172 84 158 96L177 56L172 61Q160 89 146 103Q135 117 120 124Q130 100 128 84Q126 107 110 132Q88 151 70 160Q77 147 76 135L73 139Q69 157 56 166Q33 183 10 191Z M17 197Q56 181 79 160Q61 180 17 198Z M35 193Q58 182 72 170Q56 184 35 194Z M97 147L123 124Q113 137 97 148Z');
  const persimmon = [
    twig+line('M110 134q35 8 83 -17m-45 15q11 -9 18 -25M92 152q22 13 43 13m28 -65q25 -6 39 -20',2.6)+at(140,105,.83,-9,bird)+at(68,158,.69,12,'<g transform="scale(-1 1)">'+bird+'</g>'),
    at(180,73,.39,55,leaf)+at(169,90,.64,81,leaf)+at(150,132,.62,80,leaf)+at(117,132,.57,-42,leaf)+at(52,175,.48,-31,leaf)+at(94,153,.64,153,leaf)+at(182,65,.44,20,leaf)+at(132,148,.32,138,leaf),
    at(140,162,1.05,14,fruit)+at(184,125,.79,-12,fruit)+at(98,178,.71,8,fruit)+line('M140 148q-4 -8 -1 -16m46 -18q-1 -6 3 -10m-90 63 2 -8',1.7)+seal
  ];
  // Ink solids share real areas, so changing the order breaks banks, hulls and window bars.
  const river = [
    path('M18 157L18 124Q42 118 69 94Q85 78 98 86Q120 99 137 106Q157 108 173 96Q203 73 224 85L224 161Z')+path('M17 198Q65 183 106 193Q172 198 223 172L223 208Q164 225 113 216Q65 202 17 214Z'),
    path('M136 91a24 24 0 1 1 40 5q-12 9 -28 11q-8 -6 -12 -16Z M140 76q6 -14 17 -15q-11 3 -17 16Z')+path('M88 155V121L115 103L144 121V155Z M159 152V126L177 117L196 129V152Z')+ripples,
    at(116,118,.69,0,roof)+at(178,127,.49,0,roof)+path('M17 159Q58 148 103 151Q155 159 224 143L224 149Q169 166 103 158Q63 154 17 166Z')+path('M29 64Q39 70 44 82Q47 108 39 132Q49 113 49 89Q62 110 62 122Q64 93 52 80Q72 83 83 109Q80 83 61 77Q78 74 92 87Q87 73 59 69Q39 66 28 56Z')+line('M53 75q20 31 18 70M41 75q-14 25 -15 53M78 82q17 12 22 39',1.7)+lines(['M90 132v19m8 -18v18m25 -26v17m8 -17v16m42 -9v13','M29 222q23 -3 46 -2m75 5q27 -3 54 -9'],2),
    path('M74 187Q110 198 164 181Q156 198 135 202Q96 206 74 187Z M90 193Q119 198 148 189Q127 200 90 193Z M90 187Q94 159 110 159Q130 157 139 187Q121 192 90 187Z M95 185Q99 168 106 166Q100 175 98 185Z M109 163Q121 163 128 182Q120 166 109 164Z M113 162Q128 162 134 183Q129 171 113 162Z')+line('M147 187l23 -29m-21 19 6 -5 5 2',1.7)+at(152,175,.23,0,path('M0 0q-10 3 -14 41h25q-6 -12 -3 -21L22 16l-1 -4L5 14Q5 4 0 0Z M-12 -4L-1 -15L11 -5Z')+'<circle cy="-2" r="5"/>')+seal
  ];
  river[2] += at(38,72,.79,9,willow)+at(49,76,.82,-6,willow)+at(63,80,.91,-8,willow)+at(77,87,.64,-12,willow)+at(116,118,.69,0,roofTiles)+at(178,127,.49,0,roofTiles);
  const windowScene = [
    path('M21 156Q55 128 88 130Q117 128 143 105Q180 83 220 103L220 201H21Z')+at(75,109,.52,4,sprig)+at(180,119,.45,14,sprig),
    '<circle cx="151" cy="86" r="28"/>'+path('M39 197v-32l47 -32 46 27v36Z M141 200v-35l35 -28 28 23v41Z')+at(52,207,.65,-36,leaf)+at(70,212,.59,14,leaf),
    at(84,158,1.0,0,roof)+at(176,160,.7,0,roof)+lines(['M63 172v22m7 -23v22m24 -31v17m7 -17v18m62 -11v21m7 -22v22','M53 117l-5 13m31 -45 -5 14m31 -4 -4 11m11 -36 -4 10m64 33 -4 12m18 -31 -5 16','M40 203q60 -8 111 1t50 0'],2.2)+at(40,208,.58,-32,sprig),
    path('M16 32H224V229H16Z M24 40V220H216V40Z')+path('M24 65H216V71H24Z M46 40H52V221H46Z M185 40H191V220H185Z M24 193H216V199H24Z')+line('M25 43l19 20m14 -22 22 24m81 -25 -23 24m75 -21 -19 19M27 216l17 -16m13 16 16 -16m95 17 -16 -17m61 16 -18 -16',3.5)+seal
  ];
  windowScene[2] += at(84,158,1,0,roofTiles)+at(176,160,.7,0,roofTiles)+lines(['M55 178h20v13H55zM65 178v13m-10 -7h20','M158 168h12v13h-12zm6 0v13','M101 196v-12h12v12','M87 84l-3 8m23 -19 -2 6m16 13 -3 8m35 12 -2 6m-88 11 -3 8m133 -46 -3 9','M30 202q30 -3 44 -1m40 6 29 -1'],1.25);
  windowScene[3] += lines(['M20 37h199v188H20z','M26 53h11v9H26zm180 0h8v9h-8zM28 203h10v9H28zm176 0h8v10h-8z'],1.2);
  const works = [
    {name:'lotus', blocks:lotus, ink:['jade','clay','soot'], rack:[0,1,2], start:[[12,-8,0],[-8,8,0],[10,6,0]]},
    {name:'fruit', blocks:persimmon, ink:['soot','jade','clay'], rack:[2,0,1], start:[[-9,6,-3],[7,10,3],[10,-7,-4]]},
    {name:'ferry', blocks:river, ink:['jade','ochre','soot','clay'], rack:[1,3,0,2], start:[[10,-8,3],[-8,-10,-5],[12,7,4],[-10,8,3]]},
    {name:'window', blocks:windowScene, ink:['jade','clay','soot','ochre'], rack:[2,0,3,1], start:[[-12,10,-6],[9,-9,4],[11,7,5],[-8,-7,-4]]}
  ];
  function layer(work, id, ink, x=0, y=0, angle=0) {
    return '<g color="'+inks[ink]+'" fill="'+inks[ink]+'" transform="translate('+x+' '+y+') rotate('+angle+' 120 140)">'+work.blocks[id]+'</g>';
  }
  const proof = work => work.blocks.map((_, i)=>layer(work,i,work.ink[i])).join('');
  return {inks, works, layer, proof};
})();
