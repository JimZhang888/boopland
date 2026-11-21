/* The six rooms are indexed as they appear on the façade, top floor first. */
const HillsideInn = (() => {
  'use strict';
  const rooms = [201, 202, 203, 101, 102, 103];
  function guest(id, nights, rate, wishes, friend = null) {
    return { id, nights, rate, wishes, friend };
  }
  const arrivals = [
    [guest('sora', 2, 40, ['sun']), guest('iris', 2, 30, ['quiet']),
     guest('reed', 1, 30, ['pair'], 'robin'), guest('robin', 1, 30, ['pair'], 'reed')],
    [guest('tao', 2, 50, ['sun']), guest('yuki', 1, 40, ['sun']), guest('lina', 1, 30, ['sun']),
     guest('noa', 2, 30, ['quiet', 'pair'], 'mio'), guest('mio', 2, 30, ['pair'], 'noa')],
    [guest('zhi', 1, 50, ['sun']), guest('lan', 1, 40, ['sun']), guest('yun', 1, 30, ['sun']),
     guest('jo', 1, 40, ['quiet', 'pair'], 'kit'), guest('kit', 1, 30, ['quiet', 'pair'], 'jo')]
  ];
  const guests = Object.fromEntries(arrivals.flat().map(g => [g.id, g]));
  const roomNumber = i => rooms[i];
  const east = i => i % 3 === 2;
  function adjacent(a, b) {
    return rooms[a] !== undefined && rooms[b] !== undefined &&
      Math.floor(a / 3) === Math.floor(b / 3) && Math.abs(a - b) === 1;
  }
  function create() {
    return { day: 0, phase: 'desk', beds: Array(6).fill(null), book: [] };
  }
  function locate(s, id) { return s.beds.findIndex(stay => stay?.id === id); }
  function current(s, id) { return arrivals[s.day].some(g => g.id === id); }
  function place(s, id, index) {
    if (s.phase !== 'desk' || !current(s, id) || !Number.isInteger(index) || rooms[index] === undefined) return false;
    const other = s.beds[index];
    if (other && other.since !== s.day) return false;
    const from = locate(s, id);
    if (from === index) return true;
    if (from !== -1) s.beds[from] = other;
    s.beds[index] = { id, since: s.day };
    return true;
  }
  function remove(s, id) {
    const index = locate(s, id);
    if (index < 0 || s.phase !== 'desk' || s.beds[index].since !== s.day) return false;
    s.beds[index] = null;
    return true;
  }
  function remaining(s, stay) { return stay.since + guests[stay.id].nights - s.day; }
  function pending(s) { return arrivals[s.day].filter(g => locate(s, g.id) < 0); }
  function assessment(s, index) {
    const g = guests[s.beds[index].id];
    return g.wishes.map(wish => {
      if (wish === 'sun') return { wish, ok: east(index), reason: east(index) ? 'eastWindow' : 'noEast' };
      if (wish === 'quiet') return { wish, ok: !east(index), reason: east(index) ? 'nearStairs' : 'farStairs' };
      const partner = locate(s, g.friend);
      const ok = adjacent(index, partner);
      const reason = ok ? 'nextDoor' : partner < 0 ? 'absent' :
        Math.floor(index / 3) !== Math.floor(partner / 3) ? 'otherFloor' : 'gap';
      return { wish, ok, reason, friend: g.friend };
    });
  }
  function settle(s) {
    if (s.phase !== 'desk') return false;
    const entries = s.beds.flatMap((stay, i) => {
      if (!stay) return [];
      const details = assessment(s, i);
      return [{ id: stay.id, room: rooms[i], details,
        fee: guests[stay.id].rate + details.filter(d => d.ok).length * 10,
        praise: Number(details.every(d => d.ok)) }];
    });
    const declined = pending(s).map(g => ({ id: g.id, reason: entries.length === rooms.length ? 'full' : 'unplaced' }));
    s.book.push({ entries, declined, fee: entries.reduce((v, e) => v + e.fee, 0),
      praise: entries.reduce((v, e) => v + e.praise, 0) });
    s.phase = 'receipt';
    return true;
  }
  function advance(s) {
    if (s.phase !== 'receipt') return false;
    if (s.day === arrivals.length - 1) { s.phase = 'done'; return true; }
    s.day++;
    s.beds = s.beds.map(stay => stay && remaining(s, stay) > 0 ? stay : null);
    s.phase = 'desk';
    return true;
  }
  return { rooms, arrivals, guests, roomNumber, east, adjacent, create, locate, place, remove, remaining,
    pending, assessment, settle, advance };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HillsideInn;
