(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OfficeSlacker = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const SHIFT = 60000, TARGET = 800;
  class Game {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() {
      this.state = 'ready'; this.paused = false; this.held = false;
      this.elapsed = 0; this.score = 0; this.strikes = 0; this.suspicion = 0;
      this.slackTime = 0; this.chain = 0; this.dodges = 0; this.caughtFor = 0;
      this.phase = 'safe'; this.phaseTime = 0; this.duration = 4500;
      this.route = []; this.bag = []; this.visitCaught = false;
    }
    sample() { const n = this.random(); return Number.isFinite(n) ? Math.max(0, Math.min(.999999, n)) : .5; }
    start() { this.reset(); this.state = 'playing'; }
    hold(value) {
      this.held = !!value && this.state === 'playing' && !this.paused && this.caughtFor <= 0;
      if (!this.held) this.chain = 0;
    }
    pause(value = true) { if (this.state === 'playing') { this.paused = value; this.hold(false); } }
    get multiplier() { return Math.min(3, 1 + Math.floor(this.chain / 1500) * .5); }
    get watching() { return this.phase === 'watch'; }
    get slacking() { return this.held && this.caughtFor <= 0 && !this.paused && this.state === 'playing'; }
    get remaining() { return Math.max(0, SHIFT - this.elapsed); }
    nextVisit() {
      if (!this.bag.length) {
        this.bag = ['inspect', 'coffee', 'double'];
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(this.sample() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      const kind = this.bag.pop(), fast = this.elapsed / SHIFT;
      const watch = () => ['watch', 1700 + this.sample() * 700];
      this.route = [['approach', 1300 - fast * 300]];
      if (kind === 'coffee') this.route.push(['fake', 1600]);
      else this.route.push(watch());
      this.route.push(['leave', 700]);
      if (kind === 'double') this.route.push(['turn', 1000 - fast * 200], watch(), ['leave', 700]);
      this.route.push(['safe', 3400 + this.sample() * 1500 - fast * 600]);
      this.visitCaught = false;
    }
    advance(events) {
      if (this.phase === 'safe') this.nextVisit();
      const previous = this.phase;
      [this.phase, this.duration] = this.route.shift();
      this.phaseTime = 0;
      if (previous === 'watch' && !this.visitCaught) { this.dodges++; events.push('dodge'); }
      events.push(this.phase);
    }
    finish(reason, events) { this.state = reason; this.held = false; this.chain = 0; events.push(reason); }
    tick(delta) {
      const events = [];
      if (this.state !== 'playing' || this.paused || !Number.isFinite(delta) || delta <= 0) return events;
      // Never skip a visible warning after a stalled or hidden browser frame.
      const dt = Math.min(delta, 80, this.remaining);
      this.elapsed += dt; this.phaseTime += dt;
      this.caughtFor = Math.max(0, this.caughtFor - dt);
      if (this.slacking) {
        this.chain += dt; this.slackTime += dt;
        this.score += dt / 1000 * 20 * this.multiplier;
      }
      if (this.watching && this.slacking) this.suspicion = Math.min(100, this.suspicion + dt * .09);
      else this.suspicion = Math.max(0, this.suspicion - dt * .045);
      if (this.suspicion >= 100) {
        this.strikes++; this.score = Math.max(0, this.score - 100);
        this.suspicion = 0; this.caughtFor = 1400; this.visitCaught = true;
        this.hold(false); events.push('caught');
        if (this.strikes >= 3) { this.finish('fired', events); return events; }
      }
      if (this.elapsed >= SHIFT) { this.finish('finished', events); return events; }
      if (this.phaseTime >= this.duration) this.advance(events);
      return events;
    }
  }
  function cleanBest(value) { return Number.isFinite(value) && value >= 0 ? Math.min(999999, Math.floor(value)) : 0; }
  return Object.freeze({ Game, SHIFT, TARGET, cleanBest });
});
