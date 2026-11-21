'use strict';
const assert = require('node:assert/strict');
const { build, inspect, FENCE, CROSS, EMPTY } = require('./puzzle.js');

// Enumerate binary assignments. Stop after the second solution to catch ambiguity.
function solve(board, limit = 2) {
  const clues = board.cells.filter(c => c.clue !== null).map(c => ({ ids: c.edges, allowed: [c.clue] }));
  const constraints = [...clues, ...board.vertices.map(ids => ({ ids, allowed: [0, 2] }))];
  const solutions = [];
  function search(marks) {
    let changed;
    do {
      changed = false;
      for (const { ids, allowed } of constraints) {
        let used = 0, unknown = 0;
        for (const id of ids) {
          if (marks[id] === 1) used++;
          if (marks[id] === -1) unknown++;
        }
        const possible = allowed.filter(n => used <= n && n <= used + unknown);
        if (!possible.length) return;
        if (!unknown || possible.length !== 1) continue;
        const needed = possible[0] - used;
        if (needed !== 0 && needed !== unknown) continue;
        for (const id of ids) if (marks[id] === -1) marks[id] = needed ? 1 : 0;
        changed = true;
      }
    } while (changed);
    const next = marks.indexOf(-1);
    if (next !== -1) {
      for (const value of [0, 1]) {
        const branch = marks.slice();
        branch[next] = value;
        search(branch);
        if (solutions.length >= limit) break;
      }
      return;
    }
    // With the vertex constraints already satisfied, walk one cycle back to its start.
    const first = marks.indexOf(1);
    if (first === -1) return;
    let current = first, vertex = board.edges[first].to, length = 0;
    do {
      const following = board.vertices[vertex].find(i => i !== current && marks[i] === 1);
      const edge = board.edges[following];
      vertex = edge.from === vertex ? edge.to : edge.from;
      current = following;
      length++;
    } while (current !== first);
    if (length === marks.reduce((total, v) => total + v, 0)) solutions.push(Array.from(marks));
  }
  search(new Int8Array(board.edges.length).fill(-1));
  return solutions;
}
module.exports = { solve };

if (require.main === module) {
  const maps = require('./maps.js');
  let prevArea = 0;
  for (const [i, def] of maps.entries()) {
    assert.ok(def.clues.every(row => row.length === def.clues[0].length && /^[0-3.]+$/.test(row)));
    const board = build(def.clues);
    assert.ok(board.cells.length > prevArea);
    prevArea = board.cells.length;
    const solutions = solve(board);
    assert.equal(solutions.length, 1, 'Map '+(i+1)+' must have exactly one loop solution');
    const final = solutions[0], draft = board.edges.map(() => EMPTY);
    const used = final.flatMap((value, id) => value === FENCE ? [id] : []);
    used.forEach((id,k) => {
      draft[id] = FENCE;
      assert.equal(inspect(board,draft).solved, k === used.length-1);
    });
    assert.ok(inspect(board, final.map(v => v === EMPTY ? CROSS : v)).solved);
    console.log('Map '+(i+1)+' ('+board.width+'x'+board.height+'): unique solution, '+used.length+' fences, replay passed.');
  }
  const plain = build(['...','...','...']);
  const blank = plain.edges.map(() => EMPTY);
  function drawCells(ids) {
    const marks = blank.slice();
    ids.forEach(i => plain.cells[i].edges.forEach(e => { marks[e] = FENCE; }));
    return marks;
  }
  assert.equal(inspect(build(['0..','...','...']),blank).solved,false);
  assert.equal(inspect(plain,blank.map(() => CROSS)).solved,false);
  const ring=drawCells([0]);
  assert.ok(inspect(plain,ring).solved);
  const wrong=inspect(build(['0..','...','...']),ring);
  assert.equal(wrong.solved,false);
  assert.ok(wrong.badCells.has(0) && wrong.issues.has('tooMany') && wrong.issues.has('early'));
  const separated=inspect(build(['.1.','1.1','.1.']),drawCells([0,8]));
  assert.equal(separated.matched,separated.clues);
  assert.ok(!separated.solved && separated.issues.has('separate') && separated.badEdges.size===8);
  const branching=inspect(plain,drawCells([0,4]));
  assert.ok(!branching.solved && branching.issues.has('branch'));
  const open=ring.slice();
  open[plain.cells[0].edges[0]]=EMPTY;
  assert.equal(inspect(plain,open).solved,false);
  const blocked=inspect(plain,open.map(v=>v===EMPTY?CROSS:v));
  assert.ok(blocked.issues.has('deadEnd') && blocked.badVertices.size===2);
  const crowded=inspect(build(['3..','...','...']),blank.map(()=>CROSS));
  assert.ok(crowded.badCells.has(0) && crowded.issues.has('tooFew'));
  console.log('Passed: empty, crosses only, wrong clue, isolated cycles, branching, open paths, and blocked clues/posts.');
}

