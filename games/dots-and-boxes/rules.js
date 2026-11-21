(() => {
  'use strict';

  function newBoard(size) {
    const edges = [];
    const boxes = Array.from({ length: size * size }, () => ({ owner: null, sides: 0 }));
    function addEdge(x, y, vertical) {
      const cells = [];
      if (vertical && x > 0) cells.push(y * size + x - 1);
      if (!vertical && y > 0) cells.push((y - 1) * size + x);
      if (x < size && y < size) cells.push(y * size + x);
      edges.push({ id: edges.length, x, y, vertical, cells, owner: null });
    }
    for (let y = 0; y <= size; y++) {
      for (let x = 0; x < size; x++) addEdge(x, y, false);
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x <= size; x++) addEdge(x, y, true);
    }
    return { size, edges, boxes, score: [0, 0], turn: 0, moves: 0, last: null };
  }

  function legal(board, id) {
    return Number.isInteger(id) && board.edges[id]?.owner === null;
  }

  function draw(board, id) {
    if (!legal(board, id)) return null;
    const edge = board.edges[id];
    const player = board.turn;
    const closed = [];
    edge.owner = player;
    for (const i of edge.cells) {
      const box = board.boxes[i];
      box.sides++;
      if (box.sides === 4) {
        box.owner = player;
        closed.push(i);
      }
    }
    board.score[player] += closed.length;
    board.moves++;
    const done = board.moves === board.edges.length;
    if (!closed.length && !done) board.turn = 1 - player;
    board.last = { id, player, closed, done };
    return board.last;
  }

  function chooseEdge(board, advanced, random = Math.random) {
    let best = -Infinity;
    let choices = [];
    for (const edge of board.edges) {
      if (!legal(board, edge.id)) continue;
      const sides = edge.cells.map(i => board.boxes[i].sides);
      const captures = sides.filter(n => n === 3).length;
      const gifts = sides.filter(n => n === 2).length;
      const priority = captures ? 3 * captures : advanced ? -gifts : 0;
      if (priority > best) {
        best = priority;
        choices = [];
      }
      if (priority === best) choices.push(edge.id);
    }
    return choices.length ? choices[Math.floor(random() * choices.length)] : null;
  }

  function outcome(board) {
    if (board.moves !== board.edges.length) return null;
    const [you, cpu] = board.score;
    return you === cpu ? 'tie' : you > cpu ? 'win' : 'loss';
  }

  const api = { newBoard, legal, draw, chooseEdge, outcome };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.DotsAndBoxes = api;
})();
