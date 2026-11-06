/* Pure game rules. A classic script also usable by the Node test runner. */
(() => {
  'use strict';
  const DIRECTIONS = Object.freeze({ up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } });
  const SPEEDS = Object.freeze({ slow: 200, normal: 140, fast: 95 });
  class PaperSnake {
    constructor(random = Math.random, size = 20) {
      this.random = random;
      this.size = Math.max(4, Math.floor(size));
      this.speed = 'normal';
      this.reset();
    }
    reset() {
      const center = Math.floor(this.size / 2);
      this.snake = [{ x: center, y: center }, { x: center - 1, y: center }, { x: center - 2, y: center }];
      this.direction = 'right';
      this.queue = [];
      this.score = 0;
      this.elapsed = 0;
      this.status = 'ready';
      this.reason = null;
      this.food = this.placeFood();
    }
    start(speed = this.speed) {
      this.speed = Object.hasOwn(SPEEDS, speed) ? speed : 'normal';
      this.reset();
      this.status = 'playing';
    }
    placeFood() {
      const occupied = new Set(this.snake.map(p => p.y * this.size + p.x));
      const free = [];
      for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
        if (!occupied.has(y * this.size + x)) free.push({ x, y });
      }
      if (!free.length) return null;
      return free[Math.min(free.length - 1, Math.max(0, Math.floor(this.random() * free.length)))];
    }
    turn(next) {
      if (this.status !== 'playing' || !Object.hasOwn(DIRECTIONS, next) || this.queue.length >= 2) return false;
      const previous = this.queue.at(-1) || this.direction;
      const a = DIRECTIONS[previous], b = DIRECTIONS[next];
      if (previous === next || (a.x + b.x === 0 && a.y + b.y === 0)) return false;
      this.queue.push(next);
      return true;
    }
    pause() {
      if (this.status !== 'playing') return;
      this.status = 'paused';
      this.queue = [];
      this.elapsed = 0;
    }
    resume() {
      if (this.status === 'paused') { this.status = 'playing'; this.elapsed = 0; }
    }
    step() {
      if (this.status !== 'playing') return null;
      this.direction = this.queue.shift() || this.direction;
      const vector = DIRECTIONS[this.direction], head = this.snake[0];
      const next = { x: head.x + vector.x, y: head.y + vector.y };
      const eats = this.food && next.x === this.food.x && next.y === this.food.y;
      // The tail leaves its cell in this same step unless an apple is eaten.
      const body = eats ? this.snake : this.snake.slice(0, -1);
      const wall = next.x < 0 || next.y < 0 || next.x >= this.size || next.y >= this.size;
      if (wall || body.some(p => p.x === next.x && p.y === next.y)) {
        this.status = 'over';
        this.reason = wall ? 'wall' : 'self';
        return 'over';
      }
      this.snake.unshift(next);
      if (!eats) { this.snake.pop(); return 'move'; }
      this.score += 10;
      this.food = this.placeFood();
      if (!this.food) { this.status = 'won'; return 'won'; }
      return 'eat';
    }
    advance(delta) {
      if (this.status !== 'playing' || !Number.isFinite(delta) || delta <= 0) return [];
      // Discard long stalls instead of racing through several unseen moves.
      this.elapsed += Math.min(delta, SPEEDS[this.speed]);
      if (this.elapsed < SPEEDS[this.speed]) return [];
      this.elapsed -= SPEEDS[this.speed];
      return [this.step()];
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { PaperSnake, DIRECTIONS, SPEEDS };
  else window.PaperSnake = PaperSnake;
})();
