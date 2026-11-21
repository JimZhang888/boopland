/* Small linocut-style illustrations shared by the town map and the stamp book. */
window.PostArt = (() => {
  const clay='#b97660', leaf='#98aa84', teal='#749890', gold='#c9aa71', paper='#faf4df', timber='#b19b7f', blue='#91a8ad';
  const path=(d,fill='none',extra='') => '<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
  const circ=(x,y,r,fill) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"/>';
  const lines=(...ds) => ds.map(d=>path(d)).join('');
  const icons={
    post: path('M7 31 24 14 48 15 57 31Z',clay)+path('M11 31 51 30 51 54 11 54Z',paper)+path('M30 54V37h11v17',teal)+path('M16 36h9v9h-9Z',blue)+path('M29 13V6l16 1-4 4 4 3-16-1',clay)+lines('M5 55l51 1','M15 26l7-8m0 9 8-9m0 9 7-9m1 9 6-8'),
    roof:path('m4 36 17-19 23-7 16 24-19 5-16-3-11 7Z',clay)+path('M12 40 24 28l16 12 14-5-1 16-26 6-15-6Z',paper)+path('m23 17 1 11 17 12 3-30Z','#d5b994')+lines('m6 36 18-8','m29 52-1-9 7-1 1 10','m45 44 5-1','m17 47 4 1','m42 31 3-10'),
    paw:path('M13 45c1-6 9-9 13-17 4-6 12-6 16 1 3 6 12 10 13 16 2 9-7 12-16 8-6-2-9-2-14 0-8 3-14-1-12-8Z',clay)+
      '<g fill="'+clay+'"><ellipse cx="11" cy="27" rx="5" ry="8" transform="rotate(-24 11 27)"/><ellipse cx="24" cy="16" rx="5.5" ry="9" transform="rotate(-10 24 16)"/><ellipse cx="39" cy="15" rx="5.5" ry="9" transform="rotate(13 39 15)"/><ellipse cx="53" cy="27" rx="5" ry="8" transform="rotate(23 53 27)"/></g>'+lines('m19 44 4-4','m22 47 4-4'),
    cross:path('M30 12h4l.5 43h-5Z',timber)+path('m13 17 30-1 8 5-8 5-30 1Z',paper)+path('m20 31 24-1v9l-24 1-7-5Z',teal)+lines('m20 21 16-1','m23 35 12-1','m23 56 17-1'),
    tree:path('M28 53l1-19h6l2 19Z',timber)+path('M12 37c-9-9-1-15 3-17-1-9 7-16 15-13 7-5 18-1 19 8 10 0 15 15 4 21-9 5-12-1-19 2-8 4-13-1-22-1Z',leaf)+lines('m17 31 5 2m3-16 3-3m14 7 4-3','m31 43 1-15m0 9 8-7','m22 55 22-1'),
    fountain:path('M7 48q24-8 50 0l-4 6q-23 6-43-1Z',teal)+path('M29 46l1-14h5l2 14',paper)+path('M15 29q17 4 34-1-3 12-17 12-14-1-17-11Z',blue)+lines('M33 28V12m-1 6c-9-15-17-5-15 4m17-4c9-16 17-8 15 1','m14 49 12 2m11 0 10-1')+circ(33,9,2,teal),
    bell:path('m14 49 4-23 25-1 5 25Z',paper)+path('m12 25 20-17 20 16Z',teal)+path('M25 36c0-9 11-9 12 0l3 6H22Z',gold)+circ(31,44,2,timber)+lines('m9 52 45-1','m31 4 1 6','m17 46 3-14m23 0 2 13'),
    flower:path('M14 38 48 37 44 54 20 55Z',clay)+lines('m22 48-1-6m8 8-1-8','M31 38V19m0 13Q19 32 17 23q11 0 14 9m0-6q6-10 14-10-3 8-14 10')+
      [ [30,10],[37,13],[36,20],[28,22],[23,16] ].map(([x,y])=>circ(x,y,5,'#d2b28e')).join('')+circ(30,16,4,gold),
    mill:path('M20 52 24 25l14-5 8 33Z',paper)+path('m20 26 10-13 13 12Z',clay)+path('M34 26 16 9l-5 7 20 12-15 17 6 5 14-20 17 15 4-6-19-13 13-17-6-4Z',gold)+circ(35,27,3,timber)+lines('m30 52 1-8 6-1 2 9','m11 54 39 1'),
    pier:path('M6 42q15 5 34-2l12-4q-3 15-21 17-16 2-25-11Z',teal)+path('M28 39 28 9 10 35Z',paper)+path('M31 13 43 33 31 34Z',clay)+lines('M28 8v33','m8 47 18-1','M16 56q6-3 12-1m3 0q4-3 8-2'),
    well:path('M16 37q16-6 32 0l-2 15q-11 7-28 0Z','#c6bb9d')+path('M14 34V22h4v13m27 0V21h4v15',timber)+path('m8 23 15-13 19-1 14 13Z',clay)+lines('m19 39 24-1','m20 45 25-1m-17-6v6m10 1v8','M30 24v9'),
    bakery:path('M8 42q-3-10 10-20 18-14 31-8 13 6 4 21-8 12-26 15-14 3-19-8Z',gold)+lines('m18 24 6 11m4-17 6 12m3-14 6 10','m12 43q9 7 24-1','m17 39 2 1m22-8 3 1'),
    book:path('M5 15q16-4 27 5 11-9 26-6l1 36q-15-2-27 5Q19 48 5 51Z',teal)+path('M8 12q15-3 24 6 13-8 23-6v33q-14 0-23 7-10-8-24-7Z',paper)+lines('m32 19 .2 32','M13 21q7 0 13 4m-13 4 13 4m-13 4 9 2','M37 25l12-4m-12 11 12-4','M40 16v10l3-4 3 1V14'),
    lantern:path('m21 23 4 21 13 1 7-22Z','#dfc78d')+path('m17 22 15-9 17 9Z',teal)+path('m22 44 20 0-4 5-13 0Z',teal)+lines('m32 15V8q1-4 5-4','M28 25l1 15m10-15-4 16','M32 49v8m-8 1 16-1'),
    hall:path('M10 30 10 53l43-1V29Z',paper)+path('M6 29 32 14l25 14Z',teal)+path('M32 14V5l13 1-3 3 3 4-13-2',clay)+lines('m16 32 1 16m8-16v16m11-17v16m9-16v16','M13 50l38-1m-41 5 46-1')+circ(32,23,2.5,gold),
    courier:path('m23 37 11 1-1 10-13 9-6-3 12-10Z','#69756b')+path('m30 37 9 1 1 10 11 7-4 4-15-9Z','#63746c')+
      path('m14 53 7 3-6 4-10-1q0-4 9-6Zm29 2 6-3 8 5-1 4-11-2Z','#665e4f')+
      path('M24 26q4-5 11-5l5 5 2 15-21 1Z',teal)+path('M27 12q2-7 10-6 8 0 8 9l3 4-4 1q0 8-9 8-10-2-8-16Z','#dfc0a0')+
      path('M24 13q-1-10 12-11 8-1 11 8l5 3-11 1-4-2-12 4Z',teal)+path('M26 14q8-5 18-4l7 3-13 2Z','#556b5c')+
      path('m36 25 7 8 9-6 3 4-11 10-12-9',teal)+path('m44 26 13-5 3 8-13 5Z',paper)+lines('m45 26 8 2 4-6','M26 25l11 15')+
      path('m14 30 14 2-1 12-15-2Z',clay)+path('m14 31 13 1-2 5-12-2Z','#c1876b')+circ(41,16,1,'#535849')
  };
  const icon = (name,x=0,y=0,size=64) => '<svg x="'+x+'" y="'+y+'" width="'+size+'" height="'+size+'" viewBox="0 0 64 64" aria-hidden="true" overflow="visible"><g fill="none" stroke="#4c5548" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</g></svg>';
  const stamp = (name,number,shade='#dce4ce') => '<svg viewBox="0 0 92 104" aria-hidden="true" class="stamp-art"><path d="M4 4H88V100H4Z" fill="'+shade+'" stroke="#837e69" stroke-width="3" stroke-dasharray="2 4"/><path d="M10 10h72v84H10Z" fill="none" stroke="#797966"/><path d="M14 75q21-9 61-3m-61 5q36-5 62-2" fill="none" stroke="#787b67" opacity=".42"/>'+icon(name,15,13,62)+'<text x="15" y="88" font-family="Georgia,serif" font-size="12" fill="#4b574a">99</text><text x="77" y="88" text-anchor="end" font-family="Georgia,serif" font-size="12" fill="#4b574a">'+number+'</text></svg>';
  return {icon,stamp,path,circ};
})();
