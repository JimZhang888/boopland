/* Original cut-leather patterns. Paths use local coordinates around each brass pin.
   The same filled paths and moving joints are used for projection, picking and scoring. */
const ShadowPatterns = (() => {
  'use strict';
  const ink = '#4f5045', teal = '#526c61', rust = '#985f50', gold = '#b18b55', plum = '#796266';
  const cut = (x, y, r) => `M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
  const pattern = (d, color, etch = '', holes = '') => ({
    shape: new Path2D(d + holes), color, etch: new Path2D(etch)
  });
  const bead = (cx,cy,n,r) => Array.from({length:n}, (_,i) =>
    cut(cx+Math.cos(i*2*Math.PI/n)*r, cy+Math.sin(i*2*Math.PI/n)*r,1.3)).join('');
  const swallow = pattern(
    'M-48 17Q-29 7-14 1Q-2-12 18-14Q25-15 27-22Q34-31 44-25Q49-22 49-17L63-14 50-10Q43-7 36 1Q22 18-2 17L-15 14Q-33 28-65 36L-38 17-71 22Z',
    rust,'M-59 31Q-26 14-13 8M-52 18l28-8M-6 11q20 3 34-14m-27 9q17-1 25-13m6-10q7 5 14-1M30-21q6-5 12-2',
    cut(41,-20,2.6)+'M2 8q12 0 20-9Q13 11 2 8Z');
  const wing = pattern(
    'M-10 2Q-21-12-40-22Q-63-35-75-67Q-55-49-32-45Q-51-59-55-78Q-42-61-20-53Q-36-69-35-82Q-25-67-5-57Q12-43 16-23Q21-2 9 6Q0 13-10 2Z',
    teal,'M-61-53Q-26-33 2-7M-43-61q33 21 47 47M-28-63Q1-43 8-25M-8-6q4-9 15-8',
    'M-52-50q26 12 42 31-21-16-42-31ZM-35-53q24 13 34 31-12-14-34-31ZM-19-52q17 12 21 28-9-16-21-28Z'+cut(4,-2,2));
  const butterflyHalf='M-3-5Q-20-42-49-39Q-60-36-50-22Q-51-14-43-12Q-46-4-36 1L-22 6Q-42 9-36 23Q-34 31-23 29Q-25 38-32 42Q-16 43-12 29Q-4 25-2 10Z';
  const butterflyHoles='M-9-8Q-21-30-42-32Q-32-22-9-8ZM-12-4Q-30-20-44-21Q-38-10-12-4ZM-12 13Q-30 11-31 21Q-20 25-12 13Z'+cut(-44,-28,1.6)+cut(-29,1,1.8);
  const butterfly = pattern(butterflyHalf, rust,'M-7-7q-18-19-36-21m32 27-22-6m23 19q-9 11-19 12',butterflyHoles);
  const mirrored = (part) => {const matrix = new DOMMatrix().scale(-1,1); const shape=new Path2D(), etch=new Path2D();shape.addPath(part.shape,matrix);etch.addPath(part.etch,matrix);return {...part, shape, etch};};
  const thorax=pattern('M-2-14q-8-12-15-14l1-2q10 4 16 14 7-10 15-13l1 2q-10 4-13 14 4 4 1 10 3 16-3 25-5-12-4-26-3-6 1-10Z',ink);
  const leaf=pattern('M-58-4Q-50-17-40-15Q-30-27-14-23Q1-32 12-23Q28-28 37-17Q52-18 63-4Q57 4 36 6Q27 17 2 13L-7 8Q-20 18-34 12Q-53 13-61 3Z',teal,
    'M-54 0Q-24-4-6 3m-36-14q19 4 36 14m-21-19L-6 3m13-22L-4 2m30-17L-2 4m42-12L0 5m45-4L8 7','M-1 7q15-3 30-4L8 9Z');
  const frog=pattern('M-34 8Q-36-3-28-10Q-19-21-2-17Q2-23 10-23Q13-33 22-30Q31-29 30-21Q42-18 40-11Q39-5 24-3Q19 1 18 6L29 13 39 11 34 15 40 17 27 18 10 12Q-8 18-19 15L-27 19-40 18-32 13-44 13Z',
    '#65775b','M-31 9q-3-16 14-17 11 1 11 8-1 7-18 10m39-22q11 6 21-1',cut(21,-24,2.6)+bead(-14,-4,6,5));
  const lotus=pattern('M-3 10Q-19 10-31-7Q-18-9-9-2Q-19-17-16-28Q-5-24 1-13Q-1-27 8-36Q16-25 11-12Q21-23 30-19Q29-5 15 4Q24-1 33 1Q26 12 6 14Q5 41-1 58L-4 56Q1 31 0 14Q-11 21-19 13Z',rust,
    'M0 8q-7-16-13-24M4 7q6-18 5-29m-2 32 16-22m-33 21L-21-4','M-7 3q-6-5-13-7 6 6 13 7ZM9 6q9-9 15-13-7 10-15 13Z');
  const crane=pattern('M-62 6Q-45 0-35-13Q-22-28 2-20Q20-8 29-17Q35-24 23-44Q11-63 24-76Q32-87 48-79L76-71 47-71Q34-76 30-66Q27-60 36-47Q51-23 43-6Q39 7 17 15L7 18-3 50 9 60 24 62 9 63 1 61-10 53-6 32-20 55-18 70-6 73-20 73-24 70-25 54-8 18Q-21 23-38 19L-57 27-46 14-66 18Z',ink,
    'M-48 15q17-7 29-18m-20 18q19-2 27-10M24-67q-5 10 5 23m10-33 9 1',cut(42,-76,2)+'M-33 10q11-11 22-11-7 8-22 11Z');
  const flight=pattern('M-3 4Q-26 3-44-12Q-62-25-78-54Q-59-39-42-35Q-58-52-63-71Q-39-48-24-44Q-36-59-38-73Q-15-54 0-45Q20-33 23-15Q23-3 13 4Q5 8-3 4Z',teal,
    'M-57-41q32 19 54 27M-44-52q25 22 47 32m-31-34q19 15 31 28',
    'M-50-36q26 12 37 26-21-17-37-26ZM-36-41q25 14 32 26-18-17-32-26ZM-21-46q20 13 23 25-11-15-23-25Z'+bead(6,-10,7,5));
  const basePin=pattern('M-10 1Q-13-8-4-12Q5-12 13-3L8 7Q-4 11-10 1Z',gold);
  const reed=pattern('M-2 57Q-4 22-17-17Q-24-21-24-30L-28-45Q-30-55-24-54Q-18-53-14-33Q-11-24-15-18Q-2 17 1 42Q4 8 15-26Q12-31 15-40L21-55Q27-60 27-52L23-36Q21-26 17-25Q6 18 6 50Q17 15 35-1Q21 22 8 58ZM-1 55Q-18 23-32 15Q-11 20 1 48Z',gold,'M-24-48l7 25m40-28-6 19');
  const fox=pattern('M-39 8Q-35-8-16-13Q-3-16 11-25L17-35 15-56 29-46 44-55 42-34Q44-25 57-21L68-18 56-12 40-10Q36 9 21 23L18 46 29 49 30 52 10 52 9 26-6 28-17 46-7 49-8 53-27 53-30 46-21 27Q-39 24-39 8Z',rust,
    'M-26 13q6-17 22-18m18 22q9-9 13-19m-3-40 3 8m6-2 5-9m-15 32q9 6 17 1M17 44l-6 1m-32 0 6 1',
    'M20-49l6 6-5 2ZM36-44l4-6-1 8Z'+cut(40,-26,2.6)+bead(9,-4,8,7));
  const tail=pattern('M2 7Q-15 18-33 9Q-58-3-66-28Q-73-52-56-72Q-61-54-46-47L-47-61Q-40-47-23-40Q-1-31-1-12Q-1-2 6 1Z',rust,
    'M-52-41q3 17 26 28m-32-20q7 19 24 25m-26-16q8 14 17 18','M-54-55q-1 13 8 21l-10-4 5 10q-14-11-3-27Z'+bead(-24,-20,6,4.6));
  const moon=pattern('M17-35Q-13-25-13-1Q-14 22 11 34Q-18 36-31 16Q-44-6-29-24Q-12-44 17-35Z',gold,'M-28-18q-15 23 6 41',cut(-26,-8,2)+cut(-28,0,1.4)+cut(-27,7,1));
  const scholar=pattern('M-17-48Q-19-52-12-57L-15-66-7-70 1-66 10-63 7-56Q16-51 14-44L19-40 14-38 14-33Q11-26 3-27L2-21Q13-18 18-3L14 19 23 45Q13 52-11 48L-16 54-28 53-27 50-21 46Q-31 45-34 42Q-27 24-23 3Q-24-12-16-20L-8-25-9-31Q-18-35-17-48Z',teal,
    'M-16-52 9-54m-29 88 30 6m-23-5q3-19 9-29m-3 31L7 12m-20-29 11 9 8-9',cut(8,-45,1.6)+bead(-11,16,7,5));
  const lady=pattern('M9-53Q17-64 23-56Q28-48 21-44Q21-33 11-28L11-22Q24-18 26-6L26 15 38 45Q26 53 4 51L-6 54-17 53-18 50-10 47Q-23 46-28 42Q-15 18-13-1Q-15-16-5-22L1-26 0-31Q-9-30-12-37L-17-40-12-44Q-11-57 0-56Q4-60 9-53Z',plum,
    'M-9-46q8-1 11-8m2 35 6 6 9-6m-31 56q15 7 39 1m-25-2 4-22m6 23 2-16',cut(-8,-43,1.6)+bead(10,17,7,5));
  const sleeve=pattern('M-6-4Q-3-11 4-8L19-2 30-10 33-17 37-17 36-12 41-12 42-8 34-4 19 10Q12 13 2 8L-7 4Z',gold,'M7 5l12 2 9-9m-11-2 5 9',cut(11,2,1.7));
  const foldedSleeve=pattern('M12-15Q18-10 12-2L1 8Q-3 10-12 4L-25-11-30-13-32-17-28-18-30-22-27-23-22-17-18-15-3-7 4-13Q7-17 12-15Z',plum,
    'M-22-12l4-3m-6 2 4-3M-15-7l13 10 11-8M-3-4l4 4',cut(6,-8,1.4));
  const parasol=pattern('M-1 8V-44L-41-43Q-49-48-66-44Q-53-63-31-70Q-17-77-2-78L0-85 3-85 5-78Q34-74 58-57L73-43Q55-47 47-42Q32-47 23-42Q13-46 3-42L3 8Z',rust,
    'M1-76q-32 14-43 32m44-32q-10 13-11 32m13-32q12 12 21 31m-19-31q29 16 42 32M-58-48q57-15 119 0',
    'M-46-52q13-12 28-16-12 7-21 15ZM35-62q12 4 20 13l-6-1Z'+bead(2,-58,7,5));
  const parts={
    swallow:{fixed:[swallow]}, wing:{fixed:[wing]}, butterfly:{fixed:[butterfly,mirrored(butterfly),thorax]},
    leaf:{fixed:[leaf]}, frog:{fixed:[frog]}, lotus:{fixed:[lotus]}, crane:{fixed:[crane]},
    flight:{fixed:[basePin], joint:[0,0], moving:[flight]}, reed:{fixed:[reed]},
    fox:{fixed:[fox]}, tail:{fixed:[basePin], joint:[0,0], moving:[tail]}, moon:{fixed:[moon]},
    scholar:{fixed:[scholar], joint:[0,-12], moving:[sleeve]}, lady:{fixed:[lady,foldedSleeve]},
    parasol:{fixed:[basePin], joint:[0,0], moving:[parasol]}
  };
  // Poses are [pin X, pin Y, distance to lamp in %, hinge angle in degrees].
  const piece=(kind,start,goal)=>({kind,start,goal});
  const scenes=[
    {pieces:[piece('swallow',[135,100,75,0],[320,155,75,0]),piece('wing',[214,241,75,0],[320,155,75,0])]},
    {depth:true,pieces:[piece('butterfly',[96,160,108,0],[242,105,75,0]),piece('butterfly',[380,190,83,0],[325,170,115,0])]},
    {depth:true,pieces:[piece('leaf',[149,112,117,0],[281,182,73,0]),piece('lotus',[350,144,110,0],[322,129,100,0]),piece('frog',[129,207,85,0],[262,158,94,0])]},
    {depth:true,hinge:true,pieces:[piece('reed',[107,159,105,0],[372,172,95,0]),piece('crane',[264,146,85,0],[274,142,85,0]),piece('flight',[190,225,101,26],[279,139,90,-30])]},
    {depth:true,hinge:true,pieces:[piece('moon',[388,110,103,0],[298,82,88,0]),piece('tail',[120,153,106,-24],[236,172,78,33]),piece('fox',[358,200,106,0],[273,167,91,0])]},
    {depth:true,hinge:true,pieces:[piece('lady',[131,176,119,0],[321,175,89,0]),piece('scholar',[360,177,102,-34],[251,177,85,7]),piece('parasol',[183,154,108,-31],[292,155,75,9])]}
  ];
  return {parts,scenes,width:500,height:276};
})();
