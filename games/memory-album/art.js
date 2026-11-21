(() => {
  'use strict';
  // The fronts share a print size, but each souvenir has its own silhouette.
  const drawings = {
    sandals: ['#dfcaa4', `<g transform="rotate(29 50 50)"><path fill="#c6aa77" d="M29 17c10-4 18 3 18 13l-2 39c0 12-3 18-11 17-8-1-11-7-10-17l-2-32q-1-14 7-20zm30 0c8-3 16 4 16 14l2 38q1 15-7 17c-9 3-16-5-16-16l-2-34q-1-15 7-19z"/><g fill="none" stroke-width="1.2"><path d="m25 32 19-6m-18 13 19-7m-19 14 19-6m-19 13 18-6m-18 13 18-6m-17 13 15-5m-15 11 15-4m-13 9 11-2m15-44 17-6m-17 13 18-7m-18 14 18-6m-18 13 18-6m-17 13 18-6m-17 13 17-5m-16 12 17-5m-15 11 15-4m-13 9 11-2"/></g><path fill="none" stroke="#6e654b" stroke-width="4.8" d="m25 53 9-19 9 16m12 3 8-19 12 16"/><path fill="none" stroke="#e8d3a3" stroke-width="1.4" d="m25 53 9-19 9 16m12 3 8-19 12 16"/></g>`],
    teapot: ['#c9d2bf', `<path d="M66 35q23-16 24 4 1 18-18 23l-1-7q12-5 12-14 0-9-14 0z" fill="#aeb9a1"/><path d="M33 40q17-12 34-3 19 13 11 31-6 14-25 15-17 0-25-11l-9-11-11-22 9-2q4 14 16 14z" fill="#9eaf98"/><path d="M33 39q15-15 32-5l4 4q-18 8-36 1z" fill="#c2c8ae"/><path d="M43 28q1-6 7-5 6 0 5 7l-6 3z" fill="#718975"/><path d="M8 39q3-4 10-2l1 3zM40 81l1 4 19 1 4-4" fill="#899c83"/><g fill="none" stroke-width="1.4"><path d="M38 47q-7 13 1 22m5 4q10 6 20-1m-17-4q3-12 18-18m-9 8q1-8 6-9 1 6-6 9m1 1q7-4 10-1-5 4-10 1"/></g>`],
    ferry: ['#c8d5cf', `<path d="M6 62q29 8 56 3 23-4 32-11-7 16-23 22-29 10-52 1z" fill="#a59878"/><path d="M13 64q43 5 74-7M22 74q29 6 56-7" fill="none"/><path d="M31 61q-2-25 11-29l19-3q15 0 18 25-22 10-48 7z" fill="#a5ae99"/><path d="M31 61q0-25 12-29 11 4 12 25-12 5-24 4z" fill="#64746a"/><path d="M48 31q11 1 13 24m-5-26q10 2 12 23m-5-22q7 2 10 20" fill="none" stroke-width="1.4"/><path d="m18 62 4-17 5 1 3 16" fill="#9b8970"/><circle cx="24" cy="40" r="4" fill="#ceb79a"/><path d="m17 40 7-7 8 6z" fill="#b6aa84"/><path d="m14 78 21-35m-26 38 5-4m10 8 20 .5m21-5 17-5" fill="none" stroke-width="1.5"/>`],
    fan: ['#d8c4ac', `<path d="M9 41q16-29 45-27 23 0 39 24L56 73q-4 4-10 1z" fill="#dac6a2"/><path d="m10 40 42 42 7-7-3-2 36-35" fill="#b99972"/><g fill="none" stroke-width="1.5"><path d="m20 27 33 48m-18-57 18 57m-2-60 2 60m14-57-14 57m27-50L53 75M24 38q13-10 26-6 17-11 29-1" /></g><path d="M20 39q9-14 18-13l11 9 13-12 15 10-15-3-14 11-12-8z" fill="#8d9d8a" stroke="none"/><circle cx="56" cy="23" r="4" fill="#b17b61" stroke="none"/><path d="M55 80q10 3 9 8l7 3m-6-3 2 5" fill="none"/>`],
    lantern: ['#dfc6b9', `<path d="M37 26q0-17 12-17 13 0 13 16" fill="none"/><path d="M34 27q-13 10-13 27 1 16 17 22l23-1q15-8 16-25 0-16-14-24z" fill="#c99279"/><path d="m33 23 31-1 1 7-31 1zM36 73l27-1-1 6-24 1z" fill="#aa976e"/><g fill="none" stroke-width="1.4"><path d="M40 31q-15 24 1 41m6-41q-5 15-1 40m8-40q6 23 1 40m5-41q14 19 0 41M24 45q23 5 50-2M23 56q29 5 52-2m-26 24v9m0-4-5 9m6-9 3 10m-4-10v11"/></g>`],
    camera: ['#c2ccc6', `<path d="m12 34 17-2 4-10 26-1 8 9 18-1 2 43-73 5z" fill="#919d95"/><path d="m13 34 17-2 5-9 23-1 8 9 19-1 .5 11-72 5z" fill="#d0c9ad"/><path d="m19 30 1-5 10-.4v5z" fill="#8c8b75"/><circle cx="50" cy="54" r="19" fill="#c3c1a9"/><circle cx="50" cy="54" r="14" fill="#607268"/><circle cx="50" cy="54" r="9" fill="#8eaaa0"/><path d="M45 54q0-6 6-6m-32 7 10-.7m-10 5 9-.5m40-22 9-.7m-38-8 10-.4" fill="none" stroke-width="1.5"/>`],
    parasol: ['#ddc6b5', `<g transform="rotate(19 50 50)"><path d="M50 13v71q0 9-8 8-6-2-5-8" fill="none" stroke-width="3.5"/><path d="M6 48q11-24 44-31 31 6 45 31-13-5-22 4-11-7-23 1-14-7-23 0-10-8-21-5z" fill="#c99e87"/><path d="M50 18Q31 27 27 52m23-34v34m1-34q18 13 22 33M15 40q36-11 70 0m-57-7 5 2m31-7 5 4" fill="none" stroke-width="1.4"/></g>`],
    fish: ['#bdd2d0', `<path d="M18 54q11-20 33-23 16-3 24 5l15-14-2 22 5 17-17-9q-4 21-31 23-19 0-30-9l-6-6z" fill="#95b3ab"/><path d="m35 35 6-12 16 5 5 3m-20 43 12 9 8-14" fill="#799b93"/><path d="M32 44q13 11 2 24m14-27q7 4 0 9m8-9q7 4 0 8m8-9q7 4 0 8m-12 6q7 3 1 9m9-11q7 4 0 9m17-15 8-7m-7 11 9 4m-76 8 9 1" fill="none" stroke-width="1.5"/><circle cx="26" cy="52" r="3" fill="#43594f"/>`],
    key: ['#d7ceb1', `<g transform="rotate(38 50 50)"><path fill="#bcaa79" fill-rule="evenodd" d="M44 40c-12 0-19-10-16-19 3-8 10-9 15-7 4-8 17-7 21 0 9 1 13 9 9 17-3 7-11 11-17 9l-1 43-19 1 1-9 9-1v-7l-8 .5v-7l8-.5z M39 28q5 4 10-1 5 6 12 1 5-6-2-10-5-1-9 4-6-5-11-2-4 4 0 8z"/><path d="m43 43 15 .1m-14 4h14m-6 4-1 26" fill="none" stroke-width="1.4"/></g>`],
    swallow: ['#c4cfd4', `<path d="M9 21q23 7 39 24l9-1q9-13 17-8l5 4 11 1-11 5q-3 11-22 19L36 81l6-17-23 9 18-16Q21 51 9 21z" fill="#788c91"/><path d="M41 49Q27 31 15 24q17 8 31 24m10 4q12 0 18-10-1 11-16 17l-18 11z" fill="#d9d7bd"/><path d="M44 46q-9-19-9-34 17 16 25 32" fill="#899da0"/><circle cx="72" cy="40" r="1.7" fill="#454f4b"/><path d="m18 84 13-4m-21-1 17-6" fill="none" stroke-width="1.3"/>`],
    gourd: ['#dbcca9', `<path d="M51 20q-5-11 2-14l4 3q-7 4-3 10" fill="#88916e"/><path d="M53 18c-14-2-24 11-18 22 4 7 2 10-3 14-19 13-11 35 10 38 26 5 45-13 34-32-5-9-14-12-13-17 14-15 5-24-10-25z" fill="#c5ae71"/><path d="M40 46q10 5 23 0m-23 5q12 5 23 0m-24-24q-5 5-3 11m-4 27q-6 10-1 16m26-33q20-8 18 4-3 8-13 1m-4-4q15 11 21 21l5 1" fill="none" stroke-width="1.7"/>`],
    lute: ['#dbc7b1', `<g transform="rotate(24 50 50)"><path d="M46 36 46 15l9-8 5 3-6 8v21q1 12 11 22 16 20-1 29-12 7-26-2-11-7-4-20 11-16 12-32z" fill="#c6a378"/><path d="m47 37 8-.2M46 42h10m-11 5h12m-14 6h16m-15-32h-5m16-4h6m-15 9h-6m14-5h6M44 77l14 .1" fill="none" stroke-width="2.8"/><path d="m49 20-2 57m5-59 2 58m-17-7q-4 8 0 12" fill="none" stroke-width="1.1"/></g>`]
  };

  const back = `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 50C13 29 27 12 49 12c21-1 37 14 37 36 2 23-15 39-35 40-21 0-37-15-37-38Z" stroke-width="1.2"/>
    <path d="M18 50c-1-20 13-34 32-34s32 13 32 32c2 21-12 35-31 36-18 0-33-14-33-34Z" stroke-width="1.8"/>
    <circle cx="60" cy="34" r="5" fill="currentColor" stroke="none"/>
    <path d="m20 57 14-15 4 3 12-14 20 22 5-5 6 5m-54-2 7-8 2 6m7-9 7-9-3 12 6-4 9 9m2-4 5 8m-47 7q15-5 28-3t29-3m-56 9 12-2m32-1 11-3m-48 9 9-2m22 4 13-3m-44 7 14-2m6 4 14-3" stroke-width="1.5"/>
    <path d="M34 64q14 3 29-3l-5 6q-10 3-19 1zm12-4 6-13 1 13z" fill="currentColor" stroke-width=".9"/>
    <path d="M9 48h6m70 0h6M49 8v5m1 75v5m-27-70 3 4m47 45 3 4m-52-2 3-4m46-45 3-3" stroke-width="1.3"/>
  </g>`;
  const ns = 'http://www.w3.org/2000/svg';
  const sheet = document.createElementNS(ns, 'svg');
  sheet.setAttribute('aria-hidden', 'true');
  sheet.setAttribute('class', 'symbol-sheet');
  sheet.innerHTML = '<defs><symbol id="album-back" viewBox="0 0 100 100">' + back + '</symbol>' +
    Object.entries(drawings).map(([id, [, paths]]) => '<symbol id="album-' + id +
      '" viewBox="0 0 100 100"><g stroke="#525a4d" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' +
      paths + '</g></symbol>').join('') + '</defs>';
  document.body.prepend(sheet);
  window.AlbumArt = {
    ids: Object.keys(drawings),
    color: id => drawings[id][0],
    picture(id) {
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', '#album-' + id);
      svg.append(use);
      return svg;
    }
  };
})();
