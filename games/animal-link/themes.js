/* Add a theme or icon here; the rules never depend on a specific picture. */
(function (root) {
  'use strict';
  const A = root.LinkAnimalArt;
  const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><g stroke="#665e52" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  const smile = '<path d="M41 60v3m18-3v3m-14 7q5 5 10 0" fill="none"/><path d="m29 68 5 1m32-1 5-1" stroke="#cc9385" stroke-width="3" opacity=".65"/>';
  root.LinkThemes = [
    {
      id: 'animals', label: 'animals',
      icons: ['fox', 'cat', 'rabbit', 'frog', 'chick', 'bear'].map((id, i) => ({ id, label: id, wash: A.washes[i], svg: A.svg(i) })).concat([
        { id: 'panda', label: 'panda', wash: '#e7e9e2', svg: wrap('<circle cx="25" cy="27" r="13" fill="#777d76"/><circle cx="75" cy="27" r="13" fill="#777d76"/><path d="M17 49Q19 25 50 26q32-1 34 26 3 31-34 33-35-1-33-36Z" fill="#f5f2e6"/><ellipse cx="34" cy="52" rx="11" ry="14" fill="#777d76" transform="rotate(24 34 52)"/><ellipse cx="66" cy="52" rx="11" ry="14" fill="#777d76" transform="rotate(-24 66 52)"/><path d="M35 51v4m30-4v4" stroke="#fffef7" stroke-width="3"/><path d="m46 65 8 0-4 5Z" fill="#777d76"/><path d="M50 70v4m-6-1q6 6 12 0" fill="none"/>') },
        { id: 'owl', label: 'owl', wash: '#eee3d1', svg: wrap('<path d="m19 41-2-22 23 12q11-4 21 0l22-12-3 24q13 36-30 42Q9 81 19 41Z" fill="#c0a17d"/><path d="M22 47q12-19 28-1 17-19 29 1 3 24-29 33-31-9-28-33Z" fill="#f5e5c6"/><path d="M33 49v8m34-8v8" stroke-width="3"/><path d="m43 62 7-7 7 7-7 8Z" fill="#d7aa61"/><path d="m35 72 3 3m9-1 3 4m10-7 3 3" fill="none"/>') }
      ])
    },
    {
      id: 'fruit', label: 'fruit',
      icons: [
        { id: 'apple', label: 'apple', wash: '#f4dfd8', body: '<path d="M50 33q-26-16-33 12-6 28 20 39 11 4 14-1 9 6 21-2 23-17 13-38-9-22-35-10Z" fill="#d98f7e"/><path d="M50 33q-3-14 5-22" fill="none"/><path d="M53 25q3-18 22-14-3 18-22 14Z" fill="#9dab79"/>' },
        { id: 'pear', label: 'pear', wash: '#e8edd6', body: '<path d="M38 34q2-15 13-14t13 17q0 8 10 20 23 30-24 31Q8 85 26 58q11-16 12-24Z" fill="#b8c77e"/><path d="M51 21q-2-10 5-16" fill="none"/><path d="M54 18q14-14 24-4-10 13-24 4Z" fill="#8fa67a"/>' },
        { id: 'orange', label: 'orange', wash: '#f6e7ce', body: '<path d="M16 56q0-31 34-32 34 0 35 32 0 32-35 32-34 0-34-32Z" fill="#e4b06e"/><path d="M48 24q-7-12 1-17m1 15q9-19 29-9-9 17-29 9Z" fill="#a0b488"/><path d="m27 43 2-3m43 3 2 2m-47 30 2 2" fill="none" opacity=".4"/>' },
        { id: 'strawberry', label: 'strawberry', wash: '#f5dfe3', body: '<path d="M20 38q29-13 60 0 13 19-29 51Q7 60 20 38Z" fill="#da94a0"/><path d="m50 32-18-17 4 18-19-3 14 15 19-9 19 10 14-17-20 3 3-18Z" fill="#a2b687"/><path d="m29 50 1 3m43-3-1 3m-36 21 2 3m26-3-2 3M50 80v3" fill="none" stroke="#fff3dc" stroke-width="2.5"/>' },
        { id: 'grapes', label: 'grapes', wash: '#e9e0f1', body: '<path d="M50 28q-4-14 6-22m-6 19q15-21 33-9-8 20-33 9Z" fill="#9cab7e"/><g fill="#b29ac9"><circle cx="36" cy="37" r="14"/><circle cx="63" cy="37" r="14"/><circle cx="26" cy="58" r="14"/><circle cx="74" cy="58" r="14"/><circle cx="39" cy="76" r="14"/><circle cx="61" cy="76" r="14"/><circle cx="50" cy="56" r="16"/></g>' },
        { id: 'lemon', label: 'lemon', wash: '#f5edcd', body: '<path d="M14 55q-7-7 4-12 4-25 32-23 26-1 32 23 13 8 3 14-5 28-35 28-31 0-36-30Z" fill="#e8cf78"/><path d="M48 21q8-18 28-11-7 17-28 11Z" fill="#a6b789"/><path d="M24 46q5-14 16-14" fill="none" stroke="#f8e6ab" stroke-width="4"/>' },
        { id: 'peach', label: 'peach', wash: '#f3e0d8', body: '<path d="M50 34q-26-22-35 7-7 28 35 47 43-18 36-46-8-28-36-8Z" fill="#e2a999"/><path d="M51 37q-8 19 0 46" fill="none" stroke="#c1877a"/><path d="M50 31Q27 8 20 20q4 18 30 11m0 0Q63 5 83 17 76 36 50 31Z" fill="#b4c091"/>' },
        { id: 'cherries', label: 'cherries', wash: '#eedce0', body: '<path d="M27 54Q52 34 54 10q-3 22 20 42" fill="none" stroke="#8b9c6d" stroke-width="3"/><path d="M53 19q11-18 30-6-12 16-30 6Z" fill="#acb98b"/><circle cx="29" cy="64" r="21" fill="#be8791"/><circle cx="72" cy="64" r="21" fill="#cc9198"/><path d="M21 59v4m14-4v4m29-4v4m14-4v4M24 72q5 5 10 0m33 0q5 5 10 0" fill="none"/>' }
      ].map(({ body, ...icon }) => ({ ...icon, svg: wrap(body + (icon.id === 'cherries' ? '' : smile)) }))
    }
  ];
})(typeof globalThis === 'undefined' ? this : globalThis);
