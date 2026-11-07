(function (root) {
  'use strict';
  const DIRECTIONS = Object.freeze({ up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] });
  const LETTERS = Object.freeze({ up: 'U', right: 'R', down: 'D', left: 'L' });

  function parse(rows) {
    if (!Array.isArray(rows) || rows.length < 3) throw new Error('A board needs at least three rows.');
    const width = Math.max(...rows.map(row => row.length));
    const height = rows.length;
    const floors = new Set(), goals = new Set(), boxes = [];
    let player = -1;
    rows.forEach((row, y) => {
      for (let x = 0; x < width; x++) {
        const tile = row[x] || '#', position = y * width + x;
        if (!'# .$@*+'.includes(tile)) throw new Error('Unknown tile: ' + tile);
        if (tile === '#') continue;
        floors.add(position);
        if ('.*+'.includes(tile)) goals.add(position);
        if (tile === '$' || tile === '*') boxes.push(position);
        if (tile === '@' || tile === '+') {
          if (player !== -1) throw new Error('Only one cat is allowed.');
          player = position;
        }
      }
    });
    if (player < 0 || !boxes.length || goals.size !== boxes.length) throw new Error('Cat, boxes and matching goals are required.');
    const level = { width, height, floors, goals, boxes, player };
    // Reverse-pull reachability identifies tiles from which no goal can be reached.
    const safe = new Set(goals), queue = [...goals];
    for (let i = 0; i < queue.length; i++) {
      for (const direction of Object.keys(DIRECTIONS)) {
        const previous = neighbor(level, queue[i], direction);
        const support = neighbor(level, previous, direction);
        if (floors.has(previous) && floors.has(support) && !safe.has(previous)) {
          safe.add(previous); queue.push(previous);
        }
      }
    }
    level.safe = safe;
    return level;
  }

  function neighbor(level, position, direction) {
    const vector = DIRECTIONS[direction];
    if (!vector || position < 0) return -1;
    const x = position % level.width + vector[0], y = Math.floor(position / level.width) + vector[1];
    return x >= 0 && x < level.width && y >= 0 && y < level.height ? y * level.width + x : -1;
  }

  function create(level) {
    return { level, player: level.player, boxes: [...level.boxes], moves: 0, pushes: 0, history: [], won: false };
  }

  function move(state, direction) {
    if (state.won || !DIRECTIONS[direction]) return { moved: false };
    const target = neighbor(state.level, state.player, direction);
    if (!state.level.floors.has(target)) return { moved: false };
    const box = state.boxes.indexOf(target);
    const destination = neighbor(state.level, target, direction);
    if (box >= 0 && (!state.level.floors.has(destination) || state.boxes.includes(destination))) return { moved: false };
    state.history.push({ player: state.player, box, from: target, direction, pushes: state.pushes });
    state.player = target;
    state.moves++;
    if (box >= 0) { state.boxes[box] = destination; state.pushes++; }
    state.won = state.boxes.every(position => state.level.goals.has(position));
    return { moved: true, pushed: box >= 0, box, won: state.won };
  }

  function undo(state) {
    const previous = state.history.pop();
    if (!previous) return false;
    state.player = previous.player;
    if (previous.box >= 0) state.boxes[previous.box] = previous.from;
    state.moves--;
    state.pushes = previous.pushes;
    state.won = false;
    return true;
  }

  function deadlocked(state) {
    if (state.won) return false;
    if (state.boxes.some(position => !state.level.safe.has(position))) return true;
    const boxes = new Set(state.boxes);
    // A full 2 × 2 of walls/crates cannot move if it contains an off-goal crate.
    for (const position of state.boxes) {
      const x = position % state.level.width, y = Math.floor(position / state.level.width);
      for (const dx of [-1, 0]) for (const dy of [-1, 0]) {
        const square = [];
        for (const sx of [0, 1]) for (const sy of [0, 1]) {
          const px = x + dx + sx, py = y + dy + sy;
          square.push(px < 0 || py < 0 || px >= state.level.width || py >= state.level.height ? -1 : py * state.level.width + px);
        }
        if (square.every(p => !state.level.floors.has(p) || boxes.has(p)) && square.some(p => boxes.has(p) && !state.level.goals.has(p))) return true;
      }
    }
    return false;
  }

  function replay(level, text) {
    const state = create(level);
    if (typeof text !== 'string' || text.length > 20000 || /[^URDL]/.test(text)) return state;
    const names = { U: 'up', R: 'right', D: 'down', L: 'left' };
    for (const letter of text) if (!move(state, names[letter]).moved) return create(level);
    return state;
  }

  const api = Object.freeze({ DIRECTIONS, LETTERS, parse, neighbor, create, move, undo, deadlocked, replay,
    serialize: state => state.history.map(step => LETTERS[step.direction]).join(''),
    placed: state => state.boxes.filter(position => state.level.goals.has(position)).length
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatSokoban = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
