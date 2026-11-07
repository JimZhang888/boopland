(() => {
  'use strict';
  const paths = [
    '<path fill="#fff8df" d="M8 22C1 12 14 3 21 8c12-7 23 2 18 11 7 12-4 21-14 16C12 43 3 32 8 22Z"/><path fill="#e0ba6b" d="M29 16c10 8-1 20-10 13-9-7 1-19 10-13Z"/>',
    '<path fill="#dbb777" d="m8 12 29-6 4 26-28 8Z"/><path d="m15 14 19-4m-18 12 19-4m-17 12 19-4m-13-14 4 23m6-25 3 21" opacity=".45"/>',
    '<path fill="#a9bd8b" d="M23 40C8 37 4 30 8 24 0 14 11 5 18 10 22 0 34 4 34 12c12-2 15 10 7 16 0 9-9 13-18 12Z"/><path d="m24 39 1-25m-1 16-10-9m11 5 9-9"/>',
    '<path fill="#c99180" d="M10 35C1 27 24 5 33 6s14 8 6 17S18 43 10 35Z"/><path d="m13 24 6 6m1-14 6 6m1-14 6 6"/>',
    '<path fill="#a8b895" d="m8 36 5 3L38 8l-6-3Z"/><path fill="#d4ddbc" d="m18 37 5 3L40 20l-6-4Z"/><path d="m14 28 5 3m7-17 5 3m-6 15 5 3"/>'
  ];
  const ingredient = index => `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#6c6755" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${paths[index]}</svg>`;
  function guest(index) {
    const colors = ['#a6b6a3', '#c9a494', '#a4b4c1', '#c4b383', '#b8a6bc', '#a6bcb5'];
    const hair = [
      '<path fill="#727363" d="M19 33c-6-28 38-35 43-7l-6 3-4-12c-8 12-15 5-22 13l-1 6Z"/>',
      '<path fill="#8b7662" d="M16 42c-7-40 45-48 49-8l-3 20-8-7 1-23c-9 4-13-3-19-6l-10 17 1 14Z"/>',
      '<path fill="#a2b2b6" d="M17 25C18 6 52 2 61 22l-2 8-43 2Z"/><path d="m17 26 44-3"/>',
      '<path fill="#aca99b" d="M17 31C8 14 23 9 30 14c3-14 22-13 23-1 15-2 18 16 7 21l-6-13-13 2-14-2-3 14Z"/>',
      '<path fill="#847468" d="M18 33C6 2 58-10 64 28l-10 3-5-14c-8 9-16 6-23 11l-3 9Z"/><path fill="#847468" d="M55 20c18-13 28 10 12 15Z"/>',
      '<path fill="#baad8c" d="m17 25 7-15 28-3 9 18Z"/><path fill="#baad8c" d="M11 27c12-8 43-9 55-1l-4 6-48 1Z"/>'
    ];
    return `<svg viewBox="0 0 80 80" aria-hidden="true" fill="none" stroke="#626758" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path fill="${colors[index]}" d="M10 79c1-23 16-25 29-25s31 1 32 25"/><path fill="#ead9bb" d="M20 29C18 10 57 9 60 31l-2 12c-3 20-34 19-37 0Z"/>${hair[index]}<path d="M29 36v3m20-4v3m-14 9c3 3 6 3 10-1"/><path stroke="#c49481" stroke-width="3" opacity=".5" d="m24 43 5 1m22-1 5-1"/><path d="m31 59 9 9 9-10m-8 10v11"/>${index === 3 ? '<path d="M24 33h13v10H24Zm20 0h13v10H44Zm-7 4h7"/>' : ''}</svg>`;
  }
  function pan() {
    return `<svg class="pan-art" viewBox="0 0 360 280" aria-hidden="true" fill="none" stroke="#676b5d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="180" cy="242" rx="125" ry="12" fill="#b9b7a0" opacity=".15" stroke="none"/>
      <path fill="#d4d4bf" d="m58 184 14 51c54 16 157 16 213-1l18-49Z"/><path d="m72 233 3 8m205-7-3 9"/>
      <path class="flame" stroke="#bc9167" stroke-width="3" d="m133 224 3-9m16 12 2-9m17 11 1-9m18 9v-9m18 8-1-9m18 6-2-8"/>
      <path fill="#e9e7d9" d="m299 160 33 10 6 25-34-7m-245-27-32 10-5 25 33-9"/>
      <ellipse cx="180" cy="154" rx="133" ry="79" fill="#9fa897"/><ellipse cx="180" cy="150" rx="131" ry="76" fill="#c2c8b6"/>
      <ellipse cx="180" cy="150" rx="121" ry="68" stroke="#787e6b" opacity=".45"/>
      <path opacity=".22" d="m82 135 36-26m-42 39 60-44m118 49 32-24m-55 40 60-43m-48 56 46-34m-196 5 32-23"/>
      <g class="batter">
        <path class="pancake-base" fill="#ecd3a0" d="M72 143c3-34 54-56 110-53 60-3 108 24 108 58 3 34-48 62-108 61-62 1-111-25-110-66Z"/>
        <path opacity=".35" d="M80 139c11-29 54-44 103-43 51-1 95 18 99 48M86 170c17 24 61 34 96 32"/>
        <g class="brown-spots" fill="#bc955c" stroke="none" opacity=".45"><ellipse cx="115" cy="132" rx="6" ry="3"/><ellipse cx="155" cy="112" rx="4" ry="2"/><ellipse cx="224" cy="126" rx="7" ry="4"/><ellipse cx="238" cy="171" rx="4" ry="3"/><ellipse cx="137" cy="179" rx="7" ry="3"/><ellipse cx="179" cy="165" rx="5" ry="3"/><ellipse cx="198" cy="193" rx="5" ry="2"/></g>
        <path class="spread-swirl" d="M180 150c27 19 65-3 47-22-24-27-98-16-105 13-10 41 109 57 141 15" stroke="#c1a672" opacity=".65"/>
        <g class="topping topping-0" transform="translate(118 111) scale(1.65 .97)">${paths[0]}</g>
        <g class="topping topping-2" transform="translate(170 129) scale(1.3 .9)">${paths[2]}</g>
        <g class="topping topping-1" transform="translate(157 128) rotate(-8) scale(1.3 .9)">${paths[1]}</g>
        <g class="topping topping-3" transform="translate(130 140) rotate(-10) scale(1.5 .8)">${paths[3]}</g>
        <g class="topping topping-4" stroke="#6f8657" stroke-width="3.5"><path d="m120 145 4 3m39-19 4-3m53 28 4 3m-45 23 3-3m-36-13 4 2m76-31 4-3m-29 56 5-1"/></g>
      </g>
      <g class="wrapped-art"><path fill="#d6b784" d="m118 116 112 11 16 53-124 1-13-47Z"/><path fill="#dce4c2" d="m121 119 6-13 15 7 13-10 10 12 16-7 9 14 16-5 12 11Z"/><path fill="#f2dfb7" d="m113 126 118 8 7 49-117-1Z"/><path fill="#f9f5e6" d="m146 128 51 4 5 52-53-1Z"/><path d="m159 146 29 2m-28 6 26 2m-23 10 20 1" opacity=".5"/><path d="m118 136 19 4m-14 12 14 3m73-5 19 2m-17 10 17 1" stroke="#ba9b68"/></g>
      <g class="empty-art" stroke="#7a836c" opacity=".7"><path d="M170 139h20m-10-10v20"/><ellipse cx="180" cy="139" rx="29" ry="19" stroke-dasharray="3 5"/></g>
      <g class="steam" opacity=".6" stroke="#9ca28f"><path d="M142 83c-16-21 15-28 2-47m35 39c-13-21 16-25 4-47m35 57c-13-18 14-24 3-42"/></g>
      <g class="burn-marks" stroke="#58584b" stroke-width="3"><path d="m148 131 12 10m0-12-11 13m44-7 12 10m0-12-11 13m-34 23c8-10 18-9 28-2"/></g>
    </svg>`;
  }
  window.PancakeArt = { ingredient, guest, pan };
})();
