/* Pure rules; a classic browser script with a Node export for verification. */
(() => {
  'use strict';
  const LEVELS = Object.freeze({
    easy: Object.freeze({ size: 8, mines: 10 }),
    normal: Object.freeze({ size: 10, mines: 18 }),
    hard: Object.freeze({ size: 12, mines: 28 })
  });

  class Game {
    constructor(level = 'easy', random = Math.random) {
      this.random = random;
      this.reset(level);
    }
    reset(level = this.level) {
      this.level = Object.hasOwn(LEVELS, level) ? level : 'easy';
      Object.assign(this, LEVELS[this.level]);
      this.cells = Array.from({ length: this.size ** 2 }, () => ({ mine: false, adjacent: 0, open: false, flag: false }));
      this.status = 'ready';
      this.opened = 0;
      this.flags = 0;
      this.exploded = -1;
    }
    neighbors(index) {
      const row = Math.floor(index / this.size), col = index % this.size, result = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const y = row + dy, x = col + dx;
        if ((dx || dy) && x >= 0 && x < this.size && y >= 0 && y < this.size) result.push(y * this.size + x);
      }
      return result;
    }
    valid(index) { return Number.isInteger(index) && index >= 0 && index < this.cells.length; }
    get finished() { return this.status === 'won' || this.status === 'lost'; }
    get totalSafe() { return this.cells.length - this.mines; }
    plant(first) {
      // The first tile and its complete neighborhood are always safe.
      const protectedCells = new Set([first, ...this.neighbors(first)]);
      const candidates = this.cells.map((_, i) => i).filter(i => !protectedCells.has(i));
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      candidates.slice(0, this.mines).forEach(i => { this.cells[i].mine = true; });
      this.cells.forEach((cell, i) => { cell.adjacent = this.neighbors(i).filter(j => this.cells[j].mine).length; });
      this.status = 'playing';
    }
    toggleFlag(index) {
      if (!this.valid(index) || this.finished) return false;
      const cell = this.cells[index];
      if (cell.open || (!cell.flag && this.flags >= this.mines)) return false;
      cell.flag = !cell.flag;
      this.flags += cell.flag ? 1 : -1;
      return true;
    }
    reveal(index) {
      if (!this.valid(index) || this.finished) return false;
      const cell = this.cells[index];
      if (cell.open || cell.flag) return false;
      if (this.status === 'ready') this.plant(index);
      this.uncover([index]);
      return true;
    }
    chord(index) {
      if (!this.valid(index) || this.status !== 'playing') return false;
      const cell = this.cells[index], around = this.neighbors(index);
      if (!cell.open || !cell.adjacent || around.filter(i => this.cells[i].flag).length !== cell.adjacent) return false;
      const closed = around.filter(i => !this.cells[i].open && !this.cells[i].flag);
      if (!closed.length) return false;
      this.uncover(closed);
      return true;
    }
    uncover(indices) {
      const queue = [...indices];
      while (queue.length && this.status === 'playing') {
        const index = queue.pop(), cell = this.cells[index];
        if (cell.open || cell.flag) continue;
        cell.open = true;
        if (cell.mine) {
          this.exploded = index;
          this.status = 'lost';
          return;
        }
        this.opened++;
        if (!cell.adjacent) queue.push(...this.neighbors(index).filter(i => !this.cells[i].open && !this.cells[i].flag));
      }
      if (this.opened === this.totalSafe) {
        this.status = 'won';
        this.cells.forEach(cell => { if (cell.mine) cell.flag = true; });
        this.flags = this.mines;
      }
    }
  }
  const api = Object.freeze({ Game, LEVELS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.PencilMines = api;
})();
