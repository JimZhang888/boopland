(() => {
  'use strict';

  const sheets = {
    intro: [
      '1030040220400301',
      '4300200404030201',
      '1403020020340010'
    ],
    easy: [
      '006240000002810936050000400603000805210580040090004210000432781004170009701000324',
      '493001000108700300605904000081502470004019600006300198310628004500090206860000000',
      '904007002080059700700280954800000049003000807040068503001802435035000008200034690'
    ],
    medium: [
      '000040092910030860004921000000500009840000000506800210400007638060019020005000900',
      '005036802000900060010287009000000620104000708206800405060000130500410000301000900',
      '090000602500002980004003075600009030003706020042001000400290307829000500000060200'
    ],
    hard: [
      '000007003950000000041000800004090038190860020000002000000700149400030080007900006',
      '030094801000007040590000000028403000403000007010700500042005000000300600900001400',
      '005061000000520600018009000003047106006000000400600080501000004000400020730100800'
    ]
  };

  const puzzles = Object.entries(sheets).flatMap(([group, entries]) =>
    entries.map((clues, index) => ({
      id: group + '-' + (index + 1), group, number: index + 1,
      size: Math.sqrt(clues.length), givens: Array.from(clues, Number)
    }))
  );

  function buildUnits(n) {
    const side = Math.sqrt(n);
    return Array.from({ length: n * 3 }, (_, u) => Array.from({ length: n }, (_, k) => {
      if (u < n) return u * n + k;
      if (u < 2 * n) return k * n + u - n;
      const box = u - 2 * n;
      return (Math.floor(box / side) * side + Math.floor(k / side)) * n
        + (box % side) * side + k % side;
    }));
  }

  const units = { 4: buildUnits(4), 9: buildUnits(9) };

  function newGame(puzzle) {
    return {
      puzzle, values: puzzle.givens.slice(), notes: Array(puzzle.givens.length).fill(0),
      history: [], peers: puzzle.givens.map((_, i) =>
        new Set(units[puzzle.size].filter(unit => unit.includes(i)).flat().filter(j => j !== i)))
    };
  }

  function inspect(game) {
    const conflicts = new Set();
    for (const unit of units[game.puzzle.size]) {
      const seen = new Map();
      for (const i of unit) {
        const digit = game.values[i];
        if (digit === 0) continue;
        if (seen.has(digit)) {
          conflicts.add(seen.get(digit));
          conflicts.add(i);
        } else seen.set(digit, i);
      }
    }
    const empty = game.values.filter(v => !v).length;
    return { conflicts, empty, solved: empty === 0 && conflicts.size === 0 };
  }

  function edit(game, index, digit, asNote = false) {
    const { puzzle, values, notes } = game;
    if (!Number.isInteger(index) || index < 0 || index >= values.length || puzzle.givens[index]) return false;
    if (!Number.isInteger(digit) || digit < 0 || digit > puzzle.size) return false;
    if (digit && asNote && values[index]) return false;
    const changes = [];
    function write(i, value, mask) {
      if (values[i] === value && notes[i] === mask) return;
      changes.push([i, values[i], notes[i]]);
      values[i] = value;
      notes[i] = mask;
    }
    const bit = 1 << digit;
    if (asNote && digit) {
      write(index, 0, notes[index] ^ bit);
    } else {
      write(index, digit, 0);
      if (digit) for (const peer of game.peers[index]) {
        if (notes[peer] & bit) write(peer, 0, notes[peer] & ~bit);
      }
    }
    if (!changes.length) return false;
    game.history.push(changes);
    return true;
  }

  function undo(game) {
    const changes = game.history.pop();
    if (!changes) return null;
    for (const [i, value, mask] of changes) {
      game.values[i] = value;
      game.notes[i] = mask;
    }
    return changes[0][0];
  }

  const api = { puzzles, units, newGame, inspect, edit, undo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.PencilSudoku = api;
})();
