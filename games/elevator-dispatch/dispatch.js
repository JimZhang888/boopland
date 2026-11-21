/* The simulation advances from event to event, with seconds measured in active play. */
(() => {
  'use strict';
  const capacity = 4;
  const shifts = [
    { close: 60, patience: 26, waves: [
      [0,1,3,4,5], [0,2,4], [6,1,2,5], [13,1,4,3], [21,1,5,2],
      [26,5,1,1], [31,4,1,2], [36,3,1], [39,2,1,1]
    ] },
    { close: 64, patience: 23, waves: [
      [0,1,4,5], [0,5,2,1], [4,3,1], [8,2,5,4], [12,4,2],
      [16,1,3,5], [20,5,1,4], [24,3,2,4], [30,4,1,3], [35,2,5], [41,5,2,1]
    ] },
    { close: 70, patience: 23, waves: [
      [0,1,3,4], [0,4,5], [5,2,1], [10,5,3,2], [15,3,1,5,2,4,1,5],
      [20,1,4,3], [24,4,1,5,2,3,1], [29,5,1,3], [33,2,4,5], [39,1,3,4], [44,3,2,1]
    ] }
  ];

  class Shift {
    constructor(index) {
      this.index = index;
      this.plan = shifts[index];
      this.now = 0;
      this.wave = 0;
      this.serial = 0;
      this.floor = 1;
      this.waiting = Array.from({length: 6}, () => []);
      this.riders = [];
      this.pending = [];
      this.trip = null;
      this.doorUntil = 0;
      this.started = false;
      this.closed = false;
      this.done = false;
      this.score = 0;
      this.delivered = 0;
      this.left = 0;
      this.streak = 0;
      this.best = 0;
      this.notice = {key:'ready', values:{}};
      this.receive();
    }

    receive() {
      while (this.wave < this.plan.waves.length && this.plan.waves[this.wave][0] <= this.now) {
        const [born, from, ...destinations] = this.plan.waves[this.wave++];
        for (const to of destinations) {
          const id = this.serial++;
          const patience = this.plan.patience + (id % 4) * 1.5;
          this.waiting[from].push({id, from, to, born, patience, deadline:born + patience});
        }
      }
    }

    get waitingCount() { return this.waiting.reduce((sum, line) => sum + line.length, 0); }
    get position() {
      if (!this.trip) return this.floor;
      const {from, to, start, end} = this.trip;
      const t = Math.max(0, Math.min(1, (this.now - start) / (end - start)));
      return from + (to - from) * t * t * (3 - 2 * t);
    }

    request(floor) {
      if (this.done || !Number.isInteger(floor) || floor < 1 || floor > 5) return false;
      if (this.pending.length >= 5) return false;
      if ((this.pending.at(-1) ?? this.trip?.to) === floor) return false;
      this.started = true;
      this.pending.push(floor);
      this.depart();
      return true;
    }

    cancel(index) {
      if (!Number.isInteger(index) || index < 0 || index >= this.pending.length) return false;
      this.pending.splice(index, 1);
      return true;
    }

    depart() {
      if (this.trip || this.doorUntil > this.now || !this.pending.length) return;
      const to = this.pending.shift();
      this.trip = {from:this.floor, to, start:this.now, end:this.now + 0.38 + Math.abs(to - this.floor) * 1.05};
    }

    stop() {
      this.floor = this.trip.to;
      this.trip = null;
      const exiting = this.riders.filter(person => person.to === this.floor);
      this.riders = this.riders.filter(person => person.to !== this.floor);
      let praised = false;
      for (const person of exiting) {
        const quick = this.now - person.born <= person.patience * 0.75;
        this.streak = quick ? this.streak + 1 : 0;
        this.best = Math.max(this.best, this.streak);
        this.score += 10 + Math.min(5, this.streak) * 2;
        this.delivered++;
        praised = quick;
      }
      const entering = this.waiting[this.floor].splice(0, capacity - this.riders.length);
      this.riders.push(...entering);
      this.notice = praised
        ? {key:'praise', values:{n:this.streak}}
        : {key:'exchange', values:{f:this.floor, out:exiting.length, in:entering.length}};
      this.doorUntil = this.now + 0.95;
    }

    expire() {
      let lost = 0;
      for (let floor = 1; floor <= 5; floor++) {
        const queue = this.waiting[floor];
        this.waiting[floor] = queue.filter(person => !this.closed && person.deadline > this.now);
        lost += queue.length - this.waiting[floor].length;
      }
      if (lost) {
        this.left += lost;
        this.score -= 5 * lost;
        this.streak = 0;
        this.notice = {key:'walked', values:{n:lost}};
      }
    }

    advance(seconds) {
      if (!this.started || this.done || !(seconds > 0) || !Number.isFinite(seconds)) return;
      const until = this.now + seconds;
      while (this.now < until && !this.done) {
        let next = Math.min(until, this.trip?.end ?? Infinity, this.plan.waves[this.wave]?.[0] ?? Infinity);
        if (!this.closed) next = Math.min(next, this.plan.close);
        if (this.doorUntil > this.now) next = Math.min(next, this.doorUntil);
        for (const line of this.waiting) for (const person of line) next = Math.min(next, person.deadline);
        this.now = next;
        this.receive();
        // A car opening at the exact deadline can still pick the passenger up.
        if (this.trip && this.trip.end <= next + 1e-9) this.stop();
        this.closed = next >= this.plan.close;
        this.expire();
        if (this.wave === this.plan.waves.length && !this.riders.length && !this.waitingCount) {
          this.done = true;
          this.pending.length = 0;
          this.trip = null;
        } else {
          this.depart();
        }
      }
    }

    report() {
      return {delivered:this.delivered, left:this.left, score:this.score, best:this.best};
    }
  }
  window.ElevatorDispatch = {Shift};
})();
