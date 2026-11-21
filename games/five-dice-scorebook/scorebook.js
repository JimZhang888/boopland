/* A round owns its dice. Only writing a previously empty line advances the book. */
(() => {
  'use strict';
  const lines = Object.freeze(['fours', 'fives', 'sixes', 'short', 'long', 'house', 'five', 'chance']);
  const freshHand = () => ({ dice: [], held: Array(5).fill(false), rolls: 0 });

  function points(dice) {
    const counts = Array(7).fill(0);
    dice.forEach(face => counts[face]++);
    let run = 0;
    let longest = 0;
    for (let face = 1; face <= 6; face++) {
      run = counts[face] ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    return {
      fours: counts[4] * 4, fives: counts[5] * 5, sixes: counts[6] * 6,
      short: longest >= 4 ? 30 : 0, long: longest === 5 ? 40 : 0,
      house: counts.includes(3) && counts.includes(2) ? 25 : 0,
      five: counts.includes(5) ? 50 : 0, chance: dice.reduce((sum, face) => sum + face, 0)
    };
  }

  class Book {
    constructor(draw = () => 1 + Math.floor(Math.random() * 6)) {
      this.draw = draw;
      this.entries = new Map();
      Object.assign(this, freshHand());
    }
    get done() { return this.entries.size === lines.length; }
    get total() { return [...this.entries.values()].reduce((sum, n) => sum + n, 0); }
    get canRoll() { return !this.done && this.rolls < 3 && !this.held.every(Boolean); }
    roll() {
      if (!this.canRoll) return false;
      this.dice = this.held.map((keep, i) => keep ? this.dice[i] : this.draw());
      this.rolls++;
      return true;
    }
    toggle(i) {
      if (this.done || this.rolls < 1 || this.rolls >= 3 || !Number.isInteger(i) || i < 0 || i >= 5) return false;
      this.held[i] = !this.held[i];
      return true;
    }
    write(line, zero = false) {
      if (!this.rolls || this.done || !lines.includes(line) || this.entries.has(line)) return false;
      this.entries.set(line, zero ? 0 : points(this.dice)[line]);
      Object.assign(this, freshHand());
      return true;
    }
  }
  globalThis.FiveDiceScorebook = Object.freeze({ lines, points, Book });
})();
