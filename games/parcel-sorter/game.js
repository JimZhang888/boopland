(() => {
const DESTINATIONS = [
  { name: '青禾站', color: 'green', icon: 'leaf' },
  { name: '晴空站', color: 'blue', icon: 'cloud' },
  { name: '日落站', color: 'coral', icon: 'sun' }
];
const MODES = { easy: { duration: 90, interval: 2.65, speed: .068 }, rush: { duration: 60, interval: 1.9, speed: .105 } };
class SortingGame {
  constructor(random = Math.random) { this.random = random; this.reset('easy'); }
  reset(mode) {
    this.mode = mode; this.config = MODES[mode]; this.status = 'ready'; this.remaining = this.config.duration;
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.lives = 5; this.delivered = 0; this.errors = 0;
    this.parcels = []; this.selected = null; this.nextId = 1; this.spawnClock = 0; this.events = [];
  }
  get multiplier() { return Math.min(3, 1 + Math.floor(this.combo / 5)); }
  start() { this.reset(this.mode); this.status = 'running'; this.spawn(.15); }
  spawn(x = -.1) { const p = { id: this.nextId++, destination: Math.min(2, Math.floor(this.random() * 3)), x }; this.parcels.push(p); if (!this.selected) this.selected = p.id; return p; }
  select(id) { if (this.status === 'running' && this.parcels.some(p => p.id === id)) this.selected = id; }
  pause() { if (this.status === 'running') this.status = 'paused'; }
  resume() { if (this.status === 'paused') this.status = 'running'; }
  chooseNext() { this.selected = this.parcels.reduce((a, p) => !a || p.x > a.x ? p : a, null)?.id ?? null; }
  sort(destination, id = this.selected) {
    if (this.status !== 'running' || ![0, 1, 2].includes(destination)) return false;
    const p = this.parcels.find(p => p.id === id); if (!p) return false;
    this.parcels = this.parcels.filter(p => p.id !== id);
    if (p.destination === destination) {
      this.combo++; this.maxCombo = Math.max(this.combo, this.maxCombo); this.delivered++;
      const points = 10 * this.multiplier; this.score += points;
      this.events.push({ type: 'correct', parcel: p, destination, points, combo: this.combo });
    } else this.mistake('wrong', p, destination);
    if (this.selected === id) this.chooseNext();
    return true;
  }
  mistake(type, parcel, destination) {
    this.combo = 0; this.lives--; this.errors++; this.events.push({ type, parcel, destination });
    if (this.lives <= 0) this.finish('lives');
  }
  tick(dt) {
    if (this.status !== 'running' || !Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, this.remaining); this.remaining = Math.max(0, this.remaining - step);
    const progress = 1 - this.remaining / this.config.duration;
    this.spawnClock += step;
    for (const p of [...this.parcels]) {
      p.x += step * this.config.speed * (1 + progress * .4);
      if (p.x > 1.12) {
        this.parcels = this.parcels.filter(item => item.id !== p.id); this.mistake('missed', p);
        if (this.selected === p.id) this.chooseNext();
        if (this.status !== 'running') return;
      }
    }
    const interval = this.config.interval / (1 + progress * .4);
    while (this.spawnClock >= interval && this.remaining > 0) { this.spawnClock -= interval; this.spawn(); }
    if (this.remaining <= 0) this.finish('time');
  }
  finish(reason) { if (this.status === 'ended') return; this.status = 'ended'; this.events.push({ type: 'finished', reason }); }
  takeEvents() { return this.events.splice(0); }
}

window.ParcelGame = { SortingGame, DESTINATIONS, MODES };
})();
