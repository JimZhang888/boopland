/* Nantong long cards, casual double-general rules. No DOM or hidden-information AI. */
(function (root) {
  'use strict';
  const type = uid => Math.floor(uid / 4);
  const old = t => t === 17 || t >= 27;
  const family = t => old(t) ? 9 : t % 9;
  const counts = hand => { const c = Array(30).fill(0); hand.forEach(u => c[type(u)]++); return c; };
  const groups = p => p.melds.reduce((n, m) => n + m.groups, 0);
  const sort = hand => hand.sort((a, b) => a - b);
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function partitions(hand, open = 0) {
    const need = 7 - open, c = counts(hand), out = [];
    if (need < 0 || hand.length !== need * 3 + 2) return out;
    function walk(pair, sets) {
      let t = c.findIndex(n => n > 0);
      if (t < 0) { if (sets.length === need) out.push({ pair, sets: sets.slice() }); return; }
      if (sets.length >= need) return;
      if (c[t] >= 3) { c[t] -= 3; sets.push({ card: t, kind: 'triplet' }); walk(pair, sets); sets.pop(); c[t] += 3; }
      if (t < 27 && t % 9 < 7 && c[t + 1] && c[t + 2]) {
        c[t]--; c[t + 1]--; c[t + 2]--; sets.push({ card: t, kind: 'sequence' });
        walk(pair, sets); sets.pop(); c[t]++; c[t + 1]++; c[t + 2]++;
      }
    }
    for (let t = 0; t < 30; t++) if (c[t] >= 2) { c[t] -= 2; walk(t, []); c[t] += 2; }
    return out;
  }
  function waits(hand, open = 0) {
    const c = counts(hand), result = [];
    for (let t = 0; t < 30; t++) if (c[t] < 4 && partitions(hand.concat(t * 4), open).length) result.push(t);
    return result;
  }
  // Suit-local shape search is cached; combine three suits and honors for a seven-set hand.
  const shapeCache = new Map();
  function shapes(c, suited) {
    const key = (suited ? 's' : 'h') + c.join('');
    if (shapeCache.has(key)) return shapeCache.get(key);
    const at = c.findIndex(n => n > 0);
    if (at < 0) return [[0, 0, 0]];
    const found = new Map();
    function branch(indices, dm, dt, dp) {
      indices.forEach(i => c[i]--);
      for (const [m, t, p] of shapes(c, suited)) if (p + dp <= 1 && m + dm <= 7) {
        const value = [m + dm, Math.min(7, t + dt), p + dp]; found.set(value.join(','), value);
      }
      indices.forEach(i => c[i]++);
    }
    branch([at], 0, 0, 0);
    if (c[at] >= 3) branch([at, at, at], 1, 0, 0);
    if (c[at] >= 2) { branch([at, at], 0, 1, 0); branch([at, at], 0, 0, 1); }
    if (suited) {
      if (at < 7 && c[at + 1] && c[at + 2]) branch([at, at + 1, at + 2], 1, 0, 0);
      if (at < 8 && c[at + 1]) branch([at, at + 1], 0, 1, 0);
      if (at < 7 && c[at + 2]) branch([at, at + 2], 0, 1, 0);
    }
    // For a fixed number of sets and eyes, only the greatest number of partial sets matters.
    const best = new Map();
    for (const v of found.values()) { const k = v[0] + ':' + v[2]; if (!best.has(k) || best.get(k)[1] < v[1]) best.set(k, v); }
    const result = [...best.values()];
    if (shapeCache.size > 60000) shapeCache.clear();
    shapeCache.set(key, result); return result;
  }
  function distance(hand, open = 0) {
    const c = counts(hand), need = 7 - open;
    let combined = [[0, 0, 0]];
    for (const [start, end] of [[0, 9], [9, 18], [18, 27], [27, 30]]) {
      const next = new Map();
      for (const a of combined) for (const b of shapes(c.slice(start, end), start < 27)) {
        const m = a[0] + b[0], t = a[1] + b[1], p = a[2] + b[2];
        if (m > need || p > 1) continue;
        const k = m + ':' + p;
        if (!next.has(k) || next.get(k)[1] < t) next.set(k, [m, t, p]);
      }
      combined = [...next.values()];
    }
    return Math.min(...combined.map(([m, t, p]) => 2 * need - 2 * m - Math.min(t, need - m) - p));
  }
  function baseValue(card, kind, indicators) {
    const b = { peng: 2, triplet: 4, minggang: 8, jiagang: 8, angang: 12, dragon: 16 }[kind];
    const gen = indicators.map(type), matches = gen.filter(t => family(t) === family(card)).length;
    let value = b * (old(card) ? 2 : 1) * Math.pow(2, matches);
    if (gen.includes(card) && kind === 'peng') value *= 2;
    if (gen.includes(card) && kind === 'triplet') value *= 3;
    return value;
  }
  function baseScore(p, indicators) {
    const entries = [], c = counts(p.hand);
    for (const m of p.melds) entries.push({ key: m.kind, card: m.card, value: baseValue(m.card, m.kind, indicators) });
    c.forEach((n, t) => { if (n >= 3) { const kind = n === 4 ? 'angang' : 'triplet'; entries.push({ key: kind, card: t, value: baseValue(t, kind, indicators) }); } });
    if ([27, 28, 29].every(t => entries.some(e => e.card === t))) {
      entries.push({ key: 'threeHonors', value: entries.filter(e => e.card >= 27).reduce((n, e) => n + e.value, 0) });
    }
    return { entries, total: entries.reduce((n, e) => n + e.value, 0) };
  }
  function winningScore(p, indicators, info = {}) {
    const variants = partitions(p.hand, groups(p));
    let best = null;
    const base = baseScore(p, indicators);
    for (const shape of variants) {
      const qing = !p.melds.some(m => m.groups) && shape.sets.every(x => x.kind === 'sequence');
      const piao = shape.sets.every(x => x.kind === 'triplet' || x.card === 18);
      const kind = qing ? 'qing' : piao ? 'piao' : 'ta';
      const entries = base.entries.map(e => ({ ...e }));
      entries.push({ key: kind, value: qing ? 100 : piao ? 50 : 20 });
      const cash = shape.sets.filter(x => x.kind === 'sequence' && x.card === 18).length;
      if (cash) entries.push({ key: 'cash', count: cash, value: [0, 20, 50, 100, 200][cash] });
      if (info.self) entries.push({ key: 'self', value: 10 });
      if (info.kong) entries.push({ key: 'kongWin', value: 10 });
      if (info.card != null) {
        const t = info.card;
        if (shape.pair === t) entries.push({ key: 'pairWait', value: 10 });
        else if (shape.sets.some(x => x.kind === 'sequence' && t === x.card + 1)) entries.push({ key: 'closedWait', value: 10 });
        else if (shape.sets.some(x => x.kind === 'sequence' && ((x.card % 9 === 0 && t === x.card + 2) || (x.card % 9 === 6 && t === x.card)))) entries.push({ key: 'edgeWait', value: 10 });
      }
      const multipliers = [];
      if (kind === 'piao') multipliers.push('piaoDouble');
      if (kind === 'piao' && !p.melds.some(m => m.kind === 'peng' || m.kind === 'minggang' || m.kind === 'jiagang')) multipliers.push('concealedPiao');
      if (info.heaven) multipliers.push('heaven');
      if (info.earth) multipliers.push('earth');
      if (info.last && info.self) multipliers.push('last');
      const raw = entries.reduce((sum, e) => sum + e.value, 0) * Math.pow(2, multipliers.length);
      const total = Math.ceil(raw / 10) * 10;
      if (!best || best.total < total) best = { kind, shape, entries, multipliers, raw, total };
    }
    return best;
  }
  function create(seed = Date.now(), dealer = 0, scores = [0, 0, 0], round = 1) {
    const random = rng(seed), deck = Array.from({ length: 120 }, (_, i) => i);
    for (let i = 119; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const players = scores.map(score => ({ hand: [], melds: [], score, draws: 0, initial: [] }));
    for (let n = 0; n < 22; n++) for (let i = 0; i < 3; i++) players[(dealer + i) % 3].hand.push(deck.pop());
    const first = deck.pop(); players[dealer].hand.push(first);
    const indicators = [deck.pop(), deck.pop()];
    for (const p of players) {
      sort(p.hand); const c = counts(p.hand);
      c.forEach((n, t) => { if (n >= 2 && n + indicators.filter(u => type(u) === t).length === 4) p.initial.push(t); });
    }
    return { version: 1, seed, round, dealer, players, deck, indicators, phase: 'initial', current: dealer, initialIndex: 0,
      discards: [], lastDraw: first, replacement: false, afterKong: false, reaction: null, result: null,
      event: { key: 'dealt', player: dealer }, serial: 0 };
  }
  function initialOptions(s, index) {
    const p = s.players[index], c = counts(p.hand);
    return p.initial.filter(t => c[t] >= 2 && c[t] + s.indicators.filter(u => type(u) === t).length === 4);
  }
  function actions(s) {
    const p = s.players[s.current];
    if (s.phase === 'over') return [];
    if (s.phase === 'initial') return initialOptions(s, s.current).map(card => ({ kind: 'dragon', card })).concat({ kind: 'pass' });
    if (s.phase === 'draw') return [{ kind: 'draw' }];
    if (s.phase === 'reaction') {
      const task = s.reaction.tasks[s.reaction.at];
      if (task.kind === 'hu') return [{ kind: 'hu' }, { kind: 'pass' }];
      const c = counts(p.hand), t = type(s.reaction.tile), options = [];
      if (c[t] >= 3 && s.deck.length) options.push({ kind: 'minggang', card: t });
      if (c[t] >= 2) options.push({ kind: 'peng', card: t });
      return options.concat({ kind: 'pass' });
    }
    const options = p.hand.map(uid => ({ kind: 'discard', uid }));
    if (winningScore(p, s.indicators, { self: true })) options.unshift({ kind: 'hu' });
    if (s.deck.length) {
      counts(p.hand).forEach((n, card) => { if (n === 4) options.push({ kind: 'angang', card }); });
      p.melds.forEach(m => { if (m.kind === 'peng' && p.hand.some(u => type(u) === m.card)) options.push({ kind: 'jiagang', card: m.card }); });
    }
    return options;
  }
  function take(p, t, n) {
    const removed = [];
    for (let i = p.hand.length - 1; i >= 0 && removed.length < n; i--) if (type(p.hand[i]) === t) removed.push(p.hand.splice(i, 1)[0]);
    if (removed.length !== n) throw new Error('Invalid card removal');
    return removed;
  }
  function event(s, key, player, card) { s.event = { key, player, card }; s.serial++; }
  function finish(s, winner = null, info = {}) {
    s.phase = 'over'; s.reaction = null;
    if (winner === null) { s.result = { winner: null, scores: s.players.map(() => ({ total: 0, entries: [], multipliers: [] })), deltas: [0, 0, 0] }; event(s, 'drawnGame', s.current); return; }
    const totals = s.players.map((p, i) => i === winner ? winningScore(p, s.indicators, info) : (() => {
      const base = baseScore(p, s.indicators); return { ...base, total: Math.ceil(base.total / 10) * 10, multipliers: [] };
    })());
    if (!totals[winner]) throw new Error('Invalid winning hand');
    const sum = totals.reduce((n, x) => n + x.total, 0), deltas = totals.map(x => x.total * 3 - sum);
    s.players.forEach((p, i) => p.score += deltas[i]);
    s.result = { winner, scores: totals, deltas, info }; event(s, 'won', winner, info.card);
  }
  function makeReaction(s, tile, from, origin) {
    const tasks = [];
    for (let d = 1; d <= 2; d++) {
      const i = (from + d) % 3, p = s.players[i];
      if (partitions(p.hand.concat(tile), groups(p)).length) tasks.push({ player: i, kind: 'hu' });
    }
    if (origin === 'discard') for (let d = 1; d <= 2; d++) {
      const i = (from + d) % 3;
      if (counts(s.players[i].hand)[type(tile)] >= 2) tasks.push({ player: i, kind: 'meld' });
    }
    s.reaction = { tile, from, origin, tasks, at: -1 }; advanceReaction(s);
  }
  function advanceReaction(s) {
    const r = s.reaction;
    r.at++;
    if (r.at < r.tasks.length) { s.phase = 'reaction'; s.current = r.tasks[r.at].player; return; }
    if (r.origin === 'rob') {
      const p = s.players[r.from], m = p.melds.find(m => m.kind === 'peng' && m.card === type(r.tile));
      m.tiles.push(...take(p, m.card, 1)); m.kind = 'jiagang';
      s.current = r.from; s.replacement = true; event(s, 'jiagang', r.from, m.card);
    } else { s.current = (r.from + 1) % 3; s.replacement = false; }
    s.phase = 'draw'; s.reaction = null;
    if (!s.deck.length) finish(s);
  }
  function act(s, action) {
    if (!actions(s).some(a => a.kind === action.kind && (a.card === undefined || a.card === action.card) && (a.uid === undefined || a.uid === action.uid))) return false;
    const i = s.current, p = s.players[i];
    if (s.phase === 'initial') {
      if (action.kind === 'dragon') {
        const t = action.card, n = counts(p.hand)[t], tiles = take(p, t, n);
        p.melds.push({ kind: 'dragon', card: t, tiles, groups: n === 2 ? 0 : 1, from: i });
        p.initial = p.initial.filter(x => x !== t);
        const replacements = n === 2 ? 2 : n === 4 ? 1 : 0;
        if (i === s.dealer && tiles.includes(s.lastDraw)) s.lastDraw = null;
        for (let j = 0; j < replacements; j++) {
          if (!s.deck.length) { finish(s); return true; }
          const drawn = s.deck.pop(); p.hand.push(drawn); if (i === s.dealer) s.lastDraw = drawn;
        }
        sort(p.hand); event(s, 'dragon', i, t);
      } else {
        s.initialIndex++;
        if (s.initialIndex === 3) { s.phase = 'discard'; s.current = s.dealer; }
        else s.current = (s.dealer + s.initialIndex) % 3;
      }
      return true;
    }
    if (action.kind === 'draw') {
      if (!s.deck.length) { finish(s); return true; }
      s.lastDraw = s.deck.pop(); p.hand.push(s.lastDraw); sort(p.hand); p.draws++;
      s.afterKong = s.replacement; s.replacement = false; s.phase = 'discard'; event(s, 'drew', i); return true;
    }
    if (s.phase === 'reaction') {
      const r = s.reaction, t = type(r.tile);
      if (action.kind === 'pass') { advanceReaction(s); return true; }
      if (action.kind === 'hu') {
        if (r.origin === 'discard') s.discards[s.discards.length - 1].claimed = true;
        else take(s.players[r.from], t, 1);
        p.hand.push(r.tile); sort(p.hand);
        finish(s, i, { self: false, card: t, from: r.from, rob: r.origin === 'rob', earth: r.origin === 'discard' && s.discards.length === 1 && r.from === s.dealer }); return true;
      }
      const n = action.kind === 'peng' ? 2 : 3, tiles = take(p, t, n).concat(r.tile);
      s.discards[s.discards.length - 1].claimed = true;
      p.melds.push({ kind: action.kind, card: t, tiles, groups: 1, from: r.from });
      s.reaction = null; s.lastDraw = null; s.afterKong = false;
      s.phase = action.kind === 'peng' ? 'discard' : 'draw'; s.replacement = action.kind !== 'peng';
      event(s, action.kind, i, t); return true;
    }
    if (action.kind === 'hu') {
      finish(s, i, { self: true, card: s.lastDraw == null ? null : type(s.lastDraw), kong: s.afterKong,
        heaven: s.discards.length === 0 && i === s.dealer, last: s.deck.length === 0 }); return true;
    }
    if (action.kind === 'angang') {
      p.melds.push({ kind: 'angang', card: action.card, tiles: take(p, action.card, 4), groups: 1, from: i });
      s.phase = 'draw'; s.replacement = true; event(s, 'angang', i, action.card); return true;
    }
    if (action.kind === 'jiagang') {
      event(s, 'addingKong', i, action.card); makeReaction(s, p.hand.find(u => type(u) === action.card), i, 'rob'); return true;
    }
    if (action.kind === 'discard') {
      p.hand.splice(p.hand.indexOf(action.uid), 1);
      s.discards.push({ uid: action.uid, player: i, claimed: false }); s.lastDraw = null; s.afterKong = false;
      event(s, 'discarded', i, type(action.uid)); makeReaction(s, action.uid, i, 'discard'); return true;
    }
    return false;
  }
  // The strategy receives this public view, never the full game state.
  function view(s, index) {
    const p = s.players[index], known = counts(p.hand);
    s.indicators.forEach(u => known[type(u)]++);
    s.discards.filter(d => !d.claimed).forEach(d => known[type(d.uid)]++);
    s.players.forEach(x => x.melds.forEach(m => m.tiles.forEach(u => known[type(u)]++)));
    return { hand: p.hand.slice(), melds: p.melds.map(m => ({ ...m, tiles: m.tiles.slice() })), open: groups(p), known,
      indicators: s.indicators.slice(), options: s.current === index ? actions(s) : [], phase: s.phase,
      offered: s.reaction ? type(s.reaction.tile) : null };
  }
  function bestDiscard(v) {
    const candidates = [], seen = new Set(); let nearest = Infinity;
    for (const uid of v.hand) {
      const t = type(uid); if (seen.has(t)) continue; seen.add(t);
      const hand = v.hand.slice(); hand.splice(hand.indexOf(uid), 1);
      const d = distance(hand, v.open); nearest = Math.min(nearest, d); candidates.push({ uid, card: t, hand, distance: d });
    }
    let best = null;
    for (const c of candidates.filter(c => c.distance === nearest)) {
      let live = 0;
      for (let t = 0; t < 30; t++) if (v.known[t] < 4 && distance(c.hand.concat(t * 4), v.open) < c.distance) live += 4 - v.known[t];
      const keepValue = old(c.card) || v.indicators.some(u => family(type(u)) === family(c.card)) ? 0.15 : 0;
      const score = live - keepValue;
      if (!best || score > best.score) best = { ...c, live, score };
    }
    return best;
  }
  function decide(v) {
    const o = v.options, win = o.find(a => a.kind === 'hu'); if (win) return win;
    if (v.phase === 'initial') return o.find(a => a.kind === 'dragon') || { kind: 'pass' };
    if (v.phase === 'draw') return { kind: 'draw' };
    if (v.phase === 'reaction') {
      if (o[0]?.kind === 'hu') return o[0];
      const before = distance(v.hand, v.open), t = v.offered;
      for (const kind of ['minggang', 'peng']) {
        const option = o.find(a => a.kind === kind); if (!option) continue;
        const hand = v.hand.slice(), n = kind === 'peng' ? 2 : 3;
        for (let j = 0; j < n; j++) hand.splice(hand.findIndex(u => type(u) === t), 1);
        let after;
        if (kind === 'peng') after = Math.min(...hand.map((u, j) => distance(hand.filter((_, k) => k !== j), v.open + 1)));
        else after = distance(hand, v.open + 1);
        if (after < before || (kind === 'minggang' && after === before)) return option;
      }
      return { kind: 'pass' };
    }
    const add = o.find(a => a.kind === 'jiagang'); if (add) return add;
    for (const option of o.filter(a => a.kind === 'angang')) {
      const hand = v.hand.filter(u => type(u) !== option.card);
      if (distance(hand, v.open + 1) <= distance(v.hand, v.open)) return option;
    }
    const best = bestDiscard(v); return { kind: 'discard', uid: best.uid };
  }
  const api = { type, old, family, counts, groups, rng, partitions, waits, distance, baseValue, baseScore, winningScore, create, actions, act, view, bestDiscard, decide };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NantongEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
