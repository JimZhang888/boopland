/* Each character is one square on the cave survey. */
const EchoMaze = (() => {
  'use strict';
  const maps = [
    [
      '#########',
      '#...#..E#',
      '###.#.###',
      '#S......#',
      '#########'
    ], [
      '###########',
      '#E........#',
      '#.#####.#.#',
      '#.#...#.#.#',
      '#.#.#.#.###',
      '#...#.#..S#',
      '###########'
    ], [
      '#############',
      '#..........E#',
      '#.#.#.#####.#',
      '#.#.#...#...#',
      '###.#.###.###',
      '#...#.#...#.#',
      '#.###.#.###.#',
      '#S#.........#',
      '#############'
    ], [
      '###############',
      '#S#...........#',
      '#.#.#####.#.###',
      '#...#...#.#...#',
      '#####.#.#.###.#',
      '#.#...#.#.#...#',
      '#.#.###.#.#.#.#',
      '#...........#E#',
      '###############'
    ], [
      '###############',
      '#...#.....#..S#',
      '#.#.#####.#.###',
      '#.#.......#...#',
      '#.###.#.#.#.#.#',
      '#.#...#.#.#...#',
      '#.#.###.#####.#',
      '#.#.....#...#.#',
      '#.###.###.#.#.#',
      '#E........#...#',
      '###############'
    ], [
      '###################',
      '#.............#..E#',
      '#.#.#####.#.#.###.#',
      '#.#.....#...#.#...#',
      '#.#.###.###.#.#.###',
      '#...#...#.....#...#',
      '#####.###.#######.#',
      '#...#.#.....#.....#',
      '#.#.#.#####.###.#.#',
      '#.#.#.....#...#...#',
      '#.#.#####.###.###.#',
      '#S#...............#',
      '###################'
    ]
  ];
  const directions = { up: [0,-1], right: [1,0], down: [0,1], left: [-1,0] };
  const duration = 2400;
  const radius = 5.25;

  function locate(rows, symbol) {
    const y = rows.findIndex(row => row.includes(symbol));
    return { x: rows[y].indexOf(symbol), y };
  }

  function start(level) {
    const rows = maps[level];
    const player = locate(rows, 'S');
    return { level, rows, player, exit: locate(rows, 'E'), steps: 0, charges: 3,
      visited: new Set([player.y * rows[0].length + player.x]), pulse: null, won: false };
  }

  function move(game, direction) {
    if (game.won || !Object.hasOwn(directions, direction)) return 'idle';
    const [dx, dy] = directions[direction];
    const x = game.player.x + dx, y = game.player.y + dy;
    const tile = game.rows[y]?.[x];
    if (!tile || tile === '#') return 'wall';
    game.player = { x, y };
    game.visited.add(y * game.rows[0].length + x);
    game.steps++;
    game.won = tile === 'E';
    return game.won ? 'won' : 'moved';
  }

  function emit(game, time) {
    if (game.won || (game.pulse && time - game.pulse.time < duration) || !game.charges) return false;
    game.pulse = { ...game.player, time };
    game.charges--;
    return true;
  }

  return { maps, directions, start, move, emit, duration, radius };
})();
