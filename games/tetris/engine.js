/* Standalone game rules; no DOM, network, or build step. */
(() => {
  'use strict';
  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
  };
  class TetrisGame {
    constructor(random = Math.random) {
      this.random = random;
      this.reset();
    }
    reset() {
      this.board = Array.from({ length: 20 }, () => Array(10).fill(null));
      this.queue = [];
      this.active = null;
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.status = 'ready';
      this.clearCount = 0;
      this.lastClear = 0;
      this.gravityTime = 0;
      this.lockTime = 0;
      this.lockResets = 0;
      this.fillQueue();
    }
    fillQueue() {
      while (this.queue.length < 7) {
        const bag = Object.keys(SHAPES);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        this.queue.push(...bag);
      }
    }
    start() {
      this.reset();
      this.status = 'playing';
      this.spawn();
    }
    spawn() {
      const type = this.queue.shift();
      this.fillQueue();
      const matrix = SHAPES[type].map(row => [...row]);
      this.active = { type, matrix, x: Math.floor((10 - matrix.length) / 2), y: -1 };
      this.gravityTime = this.lockTime = this.lockResets = 0;
      if (this.collides(this.active)) this.status = 'over';
    }
    cells(piece = this.active) {
      if (!piece) return [];
      return piece.matrix.flatMap((row, y) => row.flatMap((value, x) => value ? [{ x: piece.x + x, y: piece.y + y }] : []));
    }
    collides(piece) {
      return this.cells(piece).some(({ x, y }) => x < 0 || x >= 10 || y >= 20 || (y >= 0 && this.board[y][x]));
    }
    grounded() { return this.collides({ ...this.active, y: this.active.y + 1 }); }
    adjust(candidate) {
      if (this.status !== 'playing' || this.collides(candidate)) return false;
      const wasGrounded = this.grounded();
      this.active = candidate;
      if (wasGrounded && this.lockResets < 15) {
        this.lockTime = 0;
        this.lockResets++;
      }
      return true;
    }
    move(direction) {
      return this.active && this.adjust({ ...this.active, x: this.active.x + direction });
    }
    rotate(direction = 1) {
      if (this.status !== 'playing' || this.active.type === 'O') return false;
      const old = this.active.matrix;
      const matrix = old.map((row, y) => row.map((_, x) => direction > 0 ? old[old.length - 1 - x][y] : old[x][old.length - 1 - y]));
      // Gentle wall/floor kicks let pieces turn beside a wall or on the stack.
      for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]]) {
        if (this.adjust({ ...this.active, matrix, x: this.active.x + dx, y: this.active.y + dy })) return true;
      }
      return false;
    }
    stepDown() {
      const candidate = { ...this.active, y: this.active.y + 1 };
      if (this.collides(candidate)) return false;
      this.active = candidate;
      this.lockTime = 0;
      return true;
    }
    softDrop() {
      if (this.status !== 'playing') return false;
      if (!this.stepDown()) return false;
      this.score++;
      this.gravityTime = 0;
      return true;
    }
    ghost() {
      if (!this.active) return null;
      const piece = { ...this.active };
      while (!this.collides({ ...piece, y: piece.y + 1 })) piece.y++;
      return piece;
    }
    hardDrop() {
      if (this.status !== 'playing') return;
      const landing = this.ghost();
      this.score += (landing.y - this.active.y) * 2;
      this.active = landing;
      this.lock();
    }
    lock() {
      if (this.cells().some(cell => cell.y < 0)) {
        this.status = 'over';
        return;
      }
      for (const { x, y } of this.cells()) this.board[y][x] = this.active.type;
      const remaining = this.board.filter(row => row.some(cell => !cell));
      this.lastClear = 20 - remaining.length;
      if (this.lastClear) {
        this.score += [0, 100, 300, 500, 800][this.lastClear] * this.level;
        this.lines += this.lastClear;
        this.level = 1 + Math.floor(this.lines / 10);
        this.clearCount++;
      }
      this.board = [...Array.from({ length: this.lastClear }, () => Array(10).fill(null)), ...remaining];
      this.spawn();
    }
    get interval() { return Math.max(80, 850 * Math.pow(.8, this.level - 1)); }
    tick(dt) {
      if (this.status !== 'playing') return;
      // Small simulation steps give a newly grounded piece its full lock delay.
      let remaining = dt;
      while (remaining > 0 && this.status === 'playing') {
        const step = Math.min(remaining, 16);
        remaining -= step;
        this.gravityTime += step;
        while (this.gravityTime >= this.interval) {
          this.gravityTime -= this.interval;
          if (!this.stepDown()) break;
        }
        if (this.grounded()) {
          this.lockTime += step;
          if (this.lockTime >= 500) this.lock();
        }
      }
    }
    pause() { if (this.status === 'playing') this.status = 'paused'; }
    resume() { if (this.status === 'paused') this.status = 'playing'; }
  }
  window.TetrisGame = TetrisGame;
  window.TETRIS_SHAPES = SHAPES;
})();
