/* Original pencil-and-colour animal portraits. No fonts or external assets. */
(function (root) {
  'use strict';
  const colors = ['#e9945e', '#75b7db', '#e89caf', '#98bd70', '#efd06a', '#b59bd3'];
  const washes = ['#fae5d4', '#deedf7', '#f8e3e9', '#e6efd9', '#fbf0c9', '#ede5f5'];
  const faces = [
    `<path fill="#e9945e" d="M20 49 16 17q1-5 6-1l22 15q8-2 15 0l22-17q5-3 4 3l-5 34q4 24-29 34Q17 78 20 49Z"/><path fill="#f7d5b7" d="m23 38-2-17 16 14m28 0 14-15-3 19"/><path fill="#fff5dc" d="M20 51q18-8 30 17 14-25 31-18 2 22-30 34Q23 77 20 51Z"/><path d="m29 55 5-2m32 0 5 2"/><path fill="#645344" d="M45 66q6-4 12 0-2 7-6 7t-6-7Z"/><path d="M51 73v4"/><path class="hatch" d="m25 42 7 3m-5 1 5 2m38-7-6 3"/>`,
    `<path fill="#75b7db" d="m19 43 1-24q1-5 5-2l18 13q8-2 16 0l17-14q5-3 5 3l1 25q9 9 6 24-5 18-38 18-31 0-37-18-3-14 6-25Z"/><path fill="#c2deeb" d="m26 34-1-11 12 10m29 0 10-10 1 12"/><path d="m39 34 3 10m9-12v10m10-8-3 10" stroke="#518aa9"/><path fill="#e7f2f3" stroke="none" d="M32 64q20-8 39 1-2 14-20 14T32 64"/><path d="m28 57 7-2m31 0 7 2"/><path fill="#596773" d="m46 64 9 0-4 5Z"/><path d="M51 69q-5 7-10 1m10-1q5 7 10 1M22 65l-9-2m11 8-10 1m65-7 9-2m-10 8 10 1"/>`,
    `<path fill="#e89caf" d="M27 41Q11 6 26 7q12-1 16 30l13-1Q60 4 73 8q14 5-3 34 14 8 14 23-1 22-33 23-33 0-35-22-1-15 11-25Z"/><path fill="#f7ced7" stroke="none" d="M32 36Q21 11 26 13q6-1 11 24m23 0q8-27 13-24 4 3-9 26"/><path fill="#fbe6e8" stroke="none" d="M32 70q20-9 39 0-1 12-19 12T32 70Z"/><path d="M35 59v4m31-4v4"/><path fill="#bb6b7e" d="m48 69 7 0-3 4Z"/><path d="M52 73q-4 5-7 1m7-1q4 5 7 1"/><path class="hatch" d="m22 69 5 2m-6 1 5 2m49-5-5 2"/>`,
    `<path fill="#98bd70" d="M18 42C7 24 18 16 28 19q11-1 14 12 9-3 17 0 4-15 17-13 16 4 9 24 8 10 5 23-5 20-40 20-35 0-40-20-3-13 8-23Z"/><ellipse fill="#f5f1d9" cx="28" cy="35" rx="10" ry="12"/><ellipse fill="#f5f1d9" cx="73" cy="35" rx="10" ry="12"/><path stroke-width="3.6" d="M29 34v4m43-4v4"/><path fill="#d8e8ad" stroke="none" d="M28 65q22-12 45 0-4 14-23 14T28 65Z"/><path d="M28 56q23 23 45-1"/><path d="m38 49 1 1m24-1-1 1"/><path fill="#d4a18a" stroke="none" d="M17 50q10-4 12 4-9 6-12-4m56 4q2-8 12-4-3 10-12 4"/>`,
    `<path fill="#efd06a" d="M16 57q-2-31 29-34-9-9-1-12 6 1 8 13 7-16 14-10 4 6-9 11 28 6 29 32 3 29-35 30Q13 86 16 57Z"/><path fill="#f9e59a" stroke="none" d="M26 45q7-14 19-14 4 3-2 6-13 2-17 8"/><path d="M35 54v5m32-5v5" stroke-width="3.2"/><path fill="#e39a50" d="m42 65 10-7 10 7-10 8Z"/><path d="M43 65h18" stroke="#b47d48"/><path fill="#e9b489" stroke="none" d="M24 64q6-5 12 1-6 6-12-1m44 1q6-6 12-1-6 7-12 1"/><path class="hatch" d="m28 77 5 1m-2 3 5 1m32-6-5 2"/>`,
    `<path fill="#b59bd3" d="M23 40Q7 34 14 20q10-13 24 5 14-4 26 0Q79 8 88 23q7 13-10 19 10 11 8 25-3 20-36 21-32-1-36-21-3-15 9-27Z"/><path fill="#dfcdea" stroke="none" d="M23 34q-7-6-2-10 5-4 11 4m40 0q6-7 10-2 3 5-5 9"/><ellipse fill="#f2e7ed" stroke="none" cx="51" cy="69" rx="19" ry="13"/><path d="M34 54v5m34-5v5"/><path fill="#725d82" d="M44 64q7-5 14 0-2 7-7 7t-7-7Z"/><path d="M51 71v4m-6 0q6 5 12 0"/><path class="hatch" d="m22 66 6 2m-6 2 5 2m46-4-5 2"/>`
  ];
  function svg(type, extra = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" ${extra}><g stroke="#665e52" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${faces[type]}</g><path d="M26 91q25 3 47-1" fill="none" stroke="#665e52" stroke-width=".75" opacity=".15"/></svg>`;
  }
  root.AnimalArt = Object.freeze({ colors, washes, svg });
})(typeof globalThis === 'undefined' ? this : globalThis);
