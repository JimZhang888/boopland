(function (root) {
  'use strict';
  const TRACKS = [
    { id: 'afternoon', bpm: 84, root: 261.63, color: '#9aaf91' },
    { id: 'rain', bpm: 104, root: 293.66, color: '#8ca5af' },
    { id: 'moon', bpm: 120, root: 220, color: '#b69c8b' }
  ];
  const WINDOW = 0.16;
  const PERFECT = 0.07;
  function chart(track) {
    const beat = 60 / track.bpm;
    const notes = [];
    const add = (b, lane, length = 0) => notes.push({ id: notes.length, time: b * beat, end: (b + length) * beat, lane, hold: length > 0, state: 'pending' });
    for (let b = 0; b < 22; b += 2) add(b, b < 8 ? 0 : b < 16 ? 1 : (b / 2) % 2);
    for (let b = 24; b < 46; b += 4) { add(b, (b / 4) % 2, 2); add(b + 3, 1 - (b / 4) % 2); }
    for (let b = 48; b < 70; b += 1) { if (b % 8 !== 7) add(b, b % 2); }
    for (let b = 72; b < 94; b += 4) {
      if (b % 8 === 0) { add(b, 0, 2); add(b + 3, 1); }
      else { add(b, 0); add(b + 1, 1); add(b + 2, 0); add(b + 2.5, 1); add(b + 3, 0); }
    }
    return { notes, beat, duration: 96 * beat };
  }
  class Round {
    constructor(track) {
      Object.assign(this, chart(track));
      this.time = -4 * this.beat;
      this.score = 0; this.combo = 0; this.maxCombo = 0;
      this.perfect = 0; this.good = 0; this.misses = 0; this.strays = 0;
      this.held = [false, false]; this.events = [];
    }
    emit(type, note, extra = {}) { this.events.push({ type, lane: note?.lane, ...extra }); }
    miss(note, reason = 'miss') {
      note.state = 'miss'; this.misses++; this.combo = 0; this.emit(reason, note);
    }
    finish(note) {
      note.state = 'hit'; this.combo++; this.maxCombo = Math.max(this.combo, this.maxCombo);
      this[note.grade]++;
      this.score += (note.grade === 'perfect' ? 100 : 65) * Math.min(4, 1 + Math.floor((this.combo - 1) / 10)) + (note.hold ? 50 : 0);
      this.emit(note.grade, note, { combo: this.combo, hold: note.hold });
    }
    update(time) {
      this.time = time;
      for (const note of this.notes) {
        if (note.state === 'pending' && time - note.time > WINDOW) this.miss(note);
        if (note.state === 'holding') {
          if (!this.held[note.lane] && time > (note.graceUntil ?? -Infinity)) this.miss(note, 'early');
          else if (time >= note.end) this.finish(note);
        }
      }
    }
    press(lane, time) {
      this.update(time);
      if (this.held[lane]) return;
      this.held[lane] = true;
      if (this.notes.some(n => n.lane === lane && n.state === 'holding')) return;
      const note = this.notes.filter(n => n.state === 'pending' && n.lane === lane && Math.abs(n.time - time) <= WINDOW)
        .sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0];
      if (!note) {
        if (time >= -WINDOW && time < this.duration) { this.combo = 0; this.strays++; this.emit('stray', { lane }); }
        return;
      }
      note.grade = Math.abs(note.time - time) <= PERFECT ? 'perfect' : 'good';
      if (note.hold) { note.state = 'holding'; this.emit('hold', note); }
      else this.finish(note);
    }
    release(lane, time) {
      this.update(time);
      this.held[lane] = false;
      const note = this.notes.find(n => n.lane === lane && n.state === 'holding');
      if (!note) return;
      if (time >= note.end - 0.12) this.finish(note);
      else this.miss(note, 'early');
    }
    prepareResume() {
      this.held = [false, false];
      for (const note of this.notes) if (note.state === 'holding') note.graceUntil = this.time + 0.8;
    }
    get accuracy() { return Math.round(100 * (this.perfect + this.good * 0.65) / Math.max(1, this.notes.length + this.strays)); }
    get fullCombo() { return this.misses === 0 && this.strays === 0 && this.perfect + this.good === this.notes.length; }
    drain() { return this.events.splice(0); }
  }
  const api = { TRACKS, WINDOW, PERFECT, chart, Round };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PaperBeat = api;
})(typeof window === 'undefined' ? globalThis : window);
