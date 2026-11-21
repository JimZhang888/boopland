const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const puzzles = require('./puzzles.js');

for (const puzzle of puzzles) {
  test(puzzle.id + ' has exactly one solution matching its clues, and hints can finish it', () => {
    const { rows, cols } = E.clues(puzzle), size = puzzle.size;
    const rowOptions = rows.map(clue => E.options(size, clue));
    const colOptions = cols.map(clue => E.options(size, clue));
    const solutions = [];
    function visit(row, remaining, chosen) {
      if (row === size) { solutions.push(chosen.flat()); return; }
      for (const option of rowOptions[row]) {
        const candidates = remaining.map((list, col) => list.filter(line => line[row] === option[col]));
        if (candidates.every(list => list.length)) visit(row + 1, candidates, [...chosen, option]);
        if (solutions.length > 1) return;
      }
    }
    visit(0, colOptions, []);
    assert.deepEqual(solutions, [puzzle.solution]);
    const marks = Array(size * size).fill(0);
    for (let step = 0; step < marks.length && !E.solved(marks, puzzle); step++) {
      const hint = E.hint(marks, puzzle);
      assert.ok(hint && !hint.correction);
      assert.equal(marks[hint.index], 0);
      marks[hint.index] = hint.value;
    }
    assert.ok(E.solved(marks, puzzle));
  });
}
