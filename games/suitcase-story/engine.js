(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function normalize(cells) {
    const left = Math.min(...cells.map(p => p[0])), top = Math.min(...cells.map(p => p[1]));
    return cells.map(([x, y]) => [x - left, y - top]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  }
  function rotate(cells, turns = 1) {
    let result = normalize(cells);
    for (let i = 0; i < ((turns % 4) + 4) % 4; i++) result = normalize(result.map(([x, y]) => [-y, x]));
    return result;
  }
  function size(cells) { return { w: Math.max(...cells.map(p => p[0])) + 1, h: Math.max(...cells.map(p => p[1])) + 1 }; }
  function fromMap(rows, theme, kinds) {
    const letters = [...new Set(rows.join(''))].sort();
    const pieces = letters.map((id, index) => {
      const positions = [];
      rows.forEach((row, y) => [...row].forEach((letter, x) => { if (letter === id) positions.push([x, y]); }));
      const cells = normalize(positions), turns = (index * 3 + theme + 1) % 4;
      return { id, kind: kinds[index], cells: rotate(cells, turns), color: index % 8,
        home: { x: Math.min(...positions.map(p => p[0])), y: Math.min(...positions.map(p => p[1])), rotation: (4 - turns) % 4 } };
    });
    return { width: rows[0].length, height: rows.length, theme, pieces };
  }
  const levels = [
    fromMap(['AABBCC', 'AABBCC', 'DDDEEF', 'GGGEEF', 'HHHHFF'], 0,
      ['camera', 'shirt', 'pouch', 'sandals', 'journal', 'shell', 'glasses', 'towel']),
    fromMap(['AABBCC', 'AABDCC', 'EABDFF', 'EDDDFF', 'EEGGHH', 'IIGGHH'], 1,
      ['jacket', 'boots', 'camera', 'scarf', 'bottle', 'journal', 'pouch', 'hat', 'leaf']),
    fromMap(['AABBCCC', 'AADBBCE', 'FADGGEE', 'FDDGHEE', 'FIIHHJJ', 'IIKHHJJ'], 2,
      ['shirt', 'camera', 'scarf', 'boots', 'jacket', 'bottle', 'souvenir', 'pouch', 'hat', 'journal', 'passport']),
    fromMap(['AAABBC', 'DAEBBC', 'DDEECC', 'DFEEGG', 'HFFIGG', 'HHIIJJ'], 3,
      ['scarf', 'camera', 'boots', 'bottle', 'jacket', 'gloves', 'pouch', 'hat', 'souvenir', 'passport']),
    fromMap(['AAABCCC', 'DAEBBFC', 'DDEBFFF', 'GDEEHII', 'GGJEHHI', 'GGJJHHI'], 4,
      ['scarf', 'camera', 'sandals', 'bottle', 'shirt', 'souvenir', 'hat', 'towel', 'pouch', 'journal']),
    fromMap(['AABCCDD', 'AABBCCD', 'EAFFGDD', 'EEFGGHH', 'IEFFGHH', 'IIJJKKL', 'IIJKKLL'], 5,
      ['shirt', 'souvenir', 'camera', 'jacket', 'boots', 'towel', 'hat', 'journal', 'pouch', 'bottle', 'scarf', 'passport'])
  ];
  function cellsFor(level, id, placement) {
    const piece = level.pieces.find(p => p.id === id);
    return rotate(piece.cells, placement.rotation).map(([x, y]) => [x + placement.x, y + placement.y]);
  }
  function canPlace(level, placements, id, candidate) {
    if (!level.pieces.some(p => p.id === id) || !candidate || !['x', 'y', 'rotation'].every(k => Number.isInteger(candidate[k]))) return false;
    const occupied = new Set();
    Object.entries(placements).forEach(([key, placement]) => {
      if (key !== id) cellsFor(level, key, placement).forEach(([x, y]) => occupied.add(x + ',' + y));
    });
    return cellsFor(level, id, candidate).every(([x, y]) => x >= 0 && y >= 0 && x < level.width && y < level.height && !occupied.has(x + ',' + y));
  }
  function validate(level, placements) {
    if (!placements || typeof placements !== 'object' || Array.isArray(placements)) return false;
    const known = new Set(level.pieces.map(p => p.id));
    if (Object.entries(placements).some(([id, p]) => !known.has(id) || !p || !['x', 'y', 'rotation'].every(k => Number.isInteger(p[k])))) return false;
    return Object.entries(placements).every(([id, placement]) => canPlace(level, placements, id, placement));
  }
  function complete(level, placements) { return validate(level, placements) && Object.keys(placements).length === level.pieces.length; }
  class Game {
    constructor(level, placements = {}) {
      this.level = level; this.placements = validate(level, placements) ? clone(placements) : {}; this.history = [];
    }
    remember() { this.history.push(clone(this.placements)); if (this.history.length > 100) this.history.shift(); }
    place(id, placement) {
      if (!canPlace(this.level, this.placements, id, placement)) return false;
      if (JSON.stringify(this.placements[id]) === JSON.stringify(placement)) return true;
      this.remember(); this.placements[id] = clone(placement); return true;
    }
    remove(id) { if (!this.placements[id]) return false; this.remember(); delete this.placements[id]; return true; }
    undo() { if (!this.history.length) return false; this.placements = this.history.pop(); return true; }
    reset() { if (!Object.keys(this.placements).length) return false; this.remember(); this.placements = {}; return true; }
  }
  // Exact-cover search respects the player's arrangement and returns one useful next move.
  // BigInt keeps all 49 cells distinct; a node budget bounds difficult dead-end searches.
  function solve(level, placements = {}, budget = 30000) {
    if (!validate(level, placements)) return null;
    let occupied = 0n, nodes = 0;
    const bit = (x, y) => 1n << BigInt(y * level.width + x);
    Object.entries(placements).forEach(([id, p]) => cellsFor(level, id, p).forEach(([x, y]) => { occupied |= bit(x, y); }));
    const remaining = level.pieces.filter(p => !placements[p.id]);
    const options = remaining.map(piece => {
      const list = [], seen = new Set();
      for (let rotation = 0; rotation < 4; rotation++) {
        const cells = rotate(piece.cells, rotation), signature = JSON.stringify(cells);
        if (seen.has(signature)) continue; seen.add(signature);
        const bounds = size(cells);
        for (let y = 0; y <= level.height - bounds.h; y++) for (let x = 0; x <= level.width - bounds.w; x++) {
          const mask = cells.reduce((m, [dx, dy]) => m | bit(x + dx, y + dy), 0n);
          if (!(mask & occupied)) list.push({ id: piece.id, x, y, rotation, mask });
        }
      }
      return list;
    });
    const full = (1n << BigInt(level.width * level.height)) - 1n;
    function search(mask, indices) {
      if (++nodes > budget) return null;
      if (!indices.length) return mask === full ? [] : null;
      let choices = null;
      for (let cell = 0; cell < level.width * level.height; cell++) {
        const b = 1n << BigInt(cell); if (mask & b) continue;
        const matches = [];
        for (const index of indices) for (const option of options[index]) {
          if ((option.mask & b) && !(option.mask & mask)) matches.push({ index, option });
        }
        if (!matches.length) return null;
        if (!choices || matches.length < choices.length) choices = matches;
        if (choices.length === 1) break;
      }
      for (const { index, option } of choices || []) {
        const rest = search(mask | option.mask, indices.filter(i => i !== index));
        if (rest) return [{ id: option.id, x: option.x, y: option.y, rotation: option.rotation }, ...rest];
        if (nodes > budget) break;
      }
      return null;
    }
    return search(occupied, remaining.map((_, i) => i));
  }
  const api = { levels, normalize, rotate, size, cellsFor, canPlace, validate, complete, Game, solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SuitcaseEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
