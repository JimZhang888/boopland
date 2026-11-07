(function (root) {
  'use strict';
  // # wall, space floor, @ cat, $ crate, . goal, * crate on goal.
  // All layouts are original. The engine test solves every map independently.
  const levels = [
    { id: 'first-paw', rows: ['#######', '##   ##', '#     #', '# @$ .#', '#     #', '##   ##', '#######'] },
    { id: 'little-turn', rows: ['#######', '#     #', '#  .  #', '#  $  #', '# @   #', '#     #', '#######'] },
    { id: 'side-by-side', rows: ['########', '#      #', '# .  . #', '# $  $ #', '#   @  #', '#      #', '########'] },
    { id: 'around-the-corner', rows: ['########', '#      #', '# .#   #', '#  $   #', '#  # $ #', '# @  . #', '#      #', '########'] },
    { id: 'sunny-window', rows: ['########', '#      #', '# . .  #', '#  #   #', '# $$   #', '#  @   #', '#      #', '########'] },
    { id: 'narrow-hall', rows: ['########', '#   .  #', '#   #  #', '# $ $  #', '# .#   #', '#  @   #', '#      #', '########'] },
    { id: 'three-parcels', rows: ['########', '#      #', '# . . .#', '# $ $  #', '#   #$ #', '# @    #', '#      #', '########'] },
    { id: 'hide-and-seek', rows: ['#########', '#       #', '# . # . #', '# $ $   #', '#   #   #', '#  $ .  #', '# @     #', '#########'] },
    { id: 'cozy-attic', rows: ['#########', '#       #', '# . . . #', '#  # #  #', '#  $$$  #', '#   @   #', '#       #', '#########'] },
    { id: 'swap-places', rows: ['#########', '#       #', '# . # . #', '#  $ $  #', '##  @  ##', '#  $ $  #', '# . # . #', '#       #', '#########'] },
    { id: 'box-garden', rows: ['#########', '#       #', '# . . . #', '#   #   #', '# $$ $  #', '# .#$   #', '#   @   #', '#       #', '#########'] },
    { id: 'home-sweet-home', rows: ['#########', '#       #', '# .   . #', '#  $#$  #', '#   @   #', '#  $#$  #', '# .   . #', '#       #', '#########'] }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = levels;
  else root.CatSokobanLevels = levels;
})(typeof globalThis !== 'undefined' ? globalThis : this);
