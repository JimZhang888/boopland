(function () {
  'use strict';
  window.CatSokobanArt = `
    <defs>
      <pattern id="floor" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M1 63.4L63.6 63.4 63.4 1" fill="none" stroke="#d7d8c8" stroke-width=".75"/>
        <path d="M8 11l4-1m37 43 3 1M15 48l2-.5" stroke="#b8b7a3" opacity=".26" stroke-width=".8"/>
      </pattern>
      <symbol id="wall-art" viewBox="0 0 64 64">
        <path d="M4 8L58 6 60 56 6 59Z" fill="#dce2d0" stroke="#8c9a7b" stroke-width="1.25"/>
        <path d="M7 57L58 55 56 10M8 12L54 10" fill="none" stroke="#a2ad92" stroke-width=".7"/>
        <path d="M7 32L58 30M32 8L32 31M22 32L23 57" fill="none" stroke="#9faa90" stroke-width=".9"/>
        <path d="M11 16l7-1m-7 4 10-1m24 21 9-1m-9 4 9-1m-25 7 6-1" stroke="#b4bea6" stroke-width=".9"/>
      </symbol>
      <symbol id="paw-art" viewBox="0 0 64 64">
        <path d="M20 43c-3-5 3-7 5-12 3-6 10-6 14 0 2 5 9 7 5 12-4 6-9 1-12 2-4-1-9 4-12-2Z" fill="currentColor"/>
        <ellipse cx="19" cy="27" rx="4" ry="6" transform="rotate(-28 19 27)" fill="currentColor"/>
        <ellipse cx="27" cy="20" rx="4" ry="6" transform="rotate(-12 27 20)" fill="currentColor"/>
        <ellipse cx="37" cy="20" rx="4" ry="6" transform="rotate(12 37 20)" fill="currentColor"/>
        <ellipse cx="46" cy="27" rx="4" ry="6" transform="rotate(28 46 27)" fill="currentColor"/>
      </symbol>
      <symbol id="goal-art" viewBox="0 0 64 64">
        <path d="M32 6C46 6 59 17 58 33S46 59 30 57 5 47 6 31 17 6 32 6Z" fill="#e5e9d7" stroke="#879b72" stroke-width="1.3" stroke-dasharray="3 4"/>
        <use href="#paw-art" x="6" y="6" width="52" height="52" color="#98aa82"/>
      </symbol>
      <symbol id="crate-art" viewBox="0 0 64 64">
        <ellipse cx="33" cy="58" rx="25" ry="4" fill="#625b3c" opacity=".1"/>
        <path d="M8 10L56 9 58 55 7 56Z" fill="var(--crate-fill, #ddbd8f)" stroke="#897356" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M8 10L15 5 50 5 56 9M9 13L54 12 55 52 11 53" fill="none" stroke="#a88d68" stroke-width=".8"/>
        <path d="M27 10L36 10 37 27 32 24 27 27Z" fill="#f2dfb9" stroke="#aa9472" stroke-width=".7"/>
        <path d="M13 46l7-1m-7 4 10-1M46 18l5 1m-5 3 5 .5" fill="none" stroke="#a78b64" stroke-width=".75"/>
        <use href="#paw-art" x="19" y="24" width="28" height="28" color="#9c7e5a" opacity=".7"/>
      </symbol>
      <symbol id="cat-art" viewBox="0 0 64 64">
        <ellipse cx="32" cy="57" rx="22" ry="4.5" fill="#68634b" opacity=".13"/>
        <path d="M45 47C60 51 61 37 53 35" fill="none" stroke="#907b61" stroke-width="8" stroke-linecap="round"/>
        <path d="M45 47C60 51 61 37 53 35" fill="none" stroke="#d8b786" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M19 35Q11 52 21 56L44 56Q52 51 44 35" fill="#e7c79b" stroke="#88755d" stroke-width="1.3"/>
        <path d="M24 42Q20 48 23 55M39 42Q43 49 40 55" fill="none" stroke="#b0926e" stroke-width="1"/>
        <path d="M12 23L13 6 26 15Q32 12 38 15L51 7 51 26Q56 42 33 44 10 44 12 23Z" fill="#f0d7ad" stroke="#88755d" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M16 12L17 24 23 18M47 13L40 19 47 23" fill="#d8a597" stroke="#b18e76" stroke-width=".7"/>
        <path d="M28 15L29 21M33 14L33 20M38 16L37 21" stroke="#c5a177" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="23" cy="29" rx="2" ry="2.7" fill="#4e5144"/><ellipse cx="41" cy="29" rx="2" ry="2.7" fill="#4e5144"/>
        <path d="M29 33L35 33 32 36Z" fill="#bc8c80"/>
        <path d="M32 36q-2 4-5 1m5-1q2 4 5 1" fill="none" stroke="#90765f" stroke-width=".9" stroke-linecap="round"/>
        <path d="M17 33L7 31M17 36L6 37M47 33L57 31M47 36L58 37" stroke="#a58e73" stroke-width=".8" stroke-linecap="round"/>
        <ellipse cx="19" cy="35" rx="4" ry="2" fill="#dca79a" opacity=".5"/><ellipse cx="45" cy="35" rx="4" ry="2" fill="#dca79a" opacity=".5"/>
      </symbol>
    </defs>`;
})();
