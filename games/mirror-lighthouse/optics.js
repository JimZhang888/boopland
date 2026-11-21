/* Rows run north to south. / and \ are mirrors; s and z are splitters in those two positions. */
const MirrorOptics = (() => {
  'use strict';
  const layouts = [
    [
      '......',
      '...T..',
      '......',
      '......',
      '>..\\..',
      '......'
    ],
    [
      '......',
      '......',
      '.\\../.',
      '......',
      '..T.\\.',
      '.^....'
    ],
    [
      '..#...',
      '>./.#.',
      '....\\T',
      '......',
      '#./.\\.',
      '....#.'
    ],
    [
      '..T...',
      '.....T',
      '......',
      '>.z..\\',
      '..#...',
      '.....#'
    ],
    [
      'T/....',
      '...\\./',
      '..#...',
      './.s#.',
      '.....T',
      '...^..'
    ],
    [
      '.\\./..',
      './..\\.',
      '...T..',
      '>z../.',
      '.....#',
      './.T#.'
    ]
  ];
  const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const empty = '.';
  function chart(rows) {
    const size = rows[0].length;
    const optics = [];
    const targets = [];
    let source;
    let start = 0;
    const cells = rows.flatMap((row, y) => Array.from(row, (kind, x) => {
      const id = y * size + x;
      const cell = { id, x, y, kind };
      if ('/\\sz'.includes(kind)) {
        cell.index = optics.length;
        cell.split = kind === 's' || kind === 'z';
        if (kind === '\\' || kind === 'z') start |= 1 << cell.index;
        optics.push(cell);
      } else if ('^>v<'.includes(kind)) {
        source = cell;
        cell.direction = '^>v<'.indexOf(kind);
      } else if (kind === 'T') targets.push(cell);
      return cell;
    }));
    return { width: size, height: rows.length, source, cells, targets, optics, start };
  }

  function trace(map, mask) {
    const { width, height, source } = map;
    const queue = [[source, source.direction]];
    const seen = new Set();
    const lit = new Set();
    const active = new Set();
    const segments = [];
    let repeats = 0;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const [from, direction] = queue[cursor];
      const [dx, dy] = directions[direction];
      const x = from.x + dx;
      const y = from.y + dy;
      const outside = x < 0 || x >= width || y < 0 || y >= height;
      const reach = outside ? 0.49 : 1;
      segments.push([from.x, from.y, from.x + dx * reach, from.y + dy * reach]);
      if (outside) continue;
      const cell = map.cells[y * width + x];
      const state = cell.id * 4 + direction;
      if (seen.has(state)) {
        repeats++;
        continue;
      }
      seen.add(state);
      if (cell.kind === 'T') {
        lit.add(cell.id);
      } else if (cell.index !== undefined) {
        active.add(cell.index);
        const backslash = (mask & (1 << cell.index)) !== 0;
        // For N,E,S,W numbered 0..3, slash swaps N/E and S/W; backslash swaps N/W and E/S.
        queue.push([cell, direction ^ (backslash ? 3 : 1)]);
        if (cell.split) queue.push([cell, direction]);
      } else if (cell.kind === empty) {
        queue.push([cell, direction]);
      }
    }
    return { lit, active, segments, repeats, states: seen.size, complete: lit.size === map.targets.length };
  }

  const solutions = new WeakMap();
  function winningMasks(map) {
    if (!solutions.has(map)) {
      const winners = [];
      for (let mask = 0; mask < (1 << map.optics.length); mask++) {
        if (trace(map, mask).complete) winners.push(mask);
      }
      solutions.set(map, winners);
    }
    return solutions.get(map);
  }

  function hint(map, mask) {
    const route = trace(map, mask);
    if (route.complete) return null;
    let nearest;
    let distance = Infinity;
    for (const win of winningMasks(map)) {
      const changed = map.optics.filter(cell => ((win ^ mask) & (1 << cell.index)) !== 0);
      if (changed.length < distance) {
        nearest = changed.find(cell => route.active.has(cell.index)) || changed[0];
        distance = changed.length;
      }
    }
    return nearest;
  }

  return { maps: layouts.map(chart), trace, hint };
})();
