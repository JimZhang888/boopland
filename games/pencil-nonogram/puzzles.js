/* Original, hand-drawn pixel patterns. Dots are blank; every other character is ink. */
(function (root) {
  'use strict';
  const puzzles = [
    { id: 'little-cat', name: 'cat', chapter: 0, color: '#9a957c', rows: ['#...#', '##.##', '#####', '#.#.#', '.###.'] },
    { id: 'little-heart', name: 'heart', chapter: 0, color: '#bd8d83', rows: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
    { id: 'little-sprout', name: 'sprout', chapter: 0, color: '#81966d', rows: ['...##', '##.##', '####.', '..#..', '..#..'] },
    { id: 'little-house', name: 'house', chapter: 0, color: '#a68c75', rows: ['..#..', '.###.', '#####', '.###.', '.#.#.'] },
    { id: 'morning-coffee', name: 'coffee', chapter: 1, color: '#aa8972', rows: ['..#.#...', '..#.#...', '........', '.#######', '.#####.#', '.#######', '..###...', '#######.'] },
    { id: 'windowsill-plant', name: 'plant', chapter: 1, color: '#81956d', rows: ['....###.', '.##.###.', '.#####..', '..###...', '....#...', '.######.', '..####..', '..####..'] },
    { id: 'forest-mushroom', name: 'mushroom', chapter: 1, color: '#b08a7c', rows: ['..####..', '.######.', '########', '########', '...##...', '..####..', '..####..', '.######.'] },
    { id: 'garden-butterfly', name: 'butterfly', chapter: 1, color: '#a494b0', rows: ['##....##', '##.##.##', '########', '.######.', '..####..', '.######.', '###..###', '.#....#.'] },
    { id: 'sunday-sailboat', name: 'boat', chapter: 2, color: '#809da2', rows: ['.....#....', '....##....', '...###.#..', '..####.##.', '.#####.###', '.....#....', '##########', '.########.', '..######..', '..........'] },
    { id: 'moonlit-rabbit', name: 'rabbit', chapter: 2, color: '#b29b8a', rows: ['..##..##..', '..##..##..', '..##..##..', '..######..', '.########.', '.##.##.##.', '.########.', '..######..', '...####...', '..######..'] },
    { id: 'quiet-tree', name: 'tree', chapter: 2, color: '#809574', rows: ['....##....', '...####...', '..######..', '.########.', '..######..', '.########.', '##########', '....##....', '....##....', '..######..'] },
    { id: 'sleepy-cat', name: 'sleepy', chapter: 2, color: '#a09478', rows: ['.#....#...', '.##..##...', '.######...', '.#.##.#...', '.######...', '..####....', '..#####...', '.#######.#', '.#########', '..#######.'] }
  ].map(p => Object.freeze({ ...p, size: p.rows.length, solution: Object.freeze(p.rows.flatMap(row => [...row].map(c => c === '.' ? 0 : 1))) }));
  root.PencilPuzzles = Object.freeze(puzzles);
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PencilPuzzles;
})(typeof window === 'undefined' ? globalThis : window);
