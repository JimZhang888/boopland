(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DiceJianghu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LANES = ['attack', 'guard', 'heal'];
  const FOES = [23, 30, 37, 44, 52, 66];
  const PHASES = ['ready', 'plan', 'reward', 'won', 'lost'];
  function create(seed = Date.now()) {
    return { version: 1, rng: (seed >>> 0) || 1, stage: 0, round: 1, turns: 0,
      hp: 38, maxHp: 38, enemyHp: FOES[0], phase: 'ready', dice: [], rerolls: 1,
      upgrades: { blade: 0, guard: 0, heart: 0 }, cleared: 0, combos: 0, last: null };
  }
  function random(s) { let n = s.rng; n ^= n << 13; n ^= n >>> 17; n ^= n << 5; s.rng = n >>> 0; return s.rng / 4294967296; }
  function roll(s) {
    if (s.phase !== 'ready') return false;
    s.dice = Array.from({ length: 4 }, () => ({ value: 1 + Math.floor(random(s) * 6), lane: null }));
    s.rerolls = 1; s.phase = 'plan'; return true;
  }
  function assign(s, index, lane) {
    if (s.phase !== 'plan' || !Number.isInteger(index) || !s.dice[index] || !(lane === null || LANES.includes(lane))) return false;
    s.dice[index].lane = lane; return true;
  }
  function reroll(s, index) {
    if (s.phase !== 'plan' || !s.rerolls || !Number.isInteger(index) || !s.dice[index] || s.dice[index].lane !== null) return false;
    s.dice[index].value = 1 + Math.floor(random(s) * 6); s.rerolls--; return true;
  }
  function intent(s) {
    const power = 6 + s.stage * 2 + Math.floor((s.round - 1) / 4) * 2;
    const pattern = (s.round - 1 + s.stage) % 3;
    if (pattern === 1) return { key: 'intentGuard', attack: Math.max(3, power - 3), guard: 4 + s.stage, heal: 0 };
    if (pattern === 2) return { key: 'intentHeavy', attack: power + 4, guard: 0, heal: 0 };
    return { key: 'intentStrike', attack: power, guard: 0, heal: 0 };
  }
  function preview(s) {
    const values = Object.fromEntries(LANES.map(lane => [lane, s.dice.filter(d => d.lane === lane).map(d => d.value)]));
    const sum = a => a.reduce((x, y) => x + y, 0);
    let attack = sum(values.attack) + (values.attack.length ? s.upgrades.blade * 2 : 0);
    let guard = sum(values.guard) + (values.guard.length ? s.upgrades.guard * 2 : 0);
    let heal = sum(values.heal) + (values.heal.length ? s.upgrades.heart : 0);
    const combos = [];
    if (values.attack.filter(v => v <= 2).length >= 2) { attack += 7; combos.push('inch'); }
    const redirect = values.guard.includes(1) && values.guard.includes(2);
    if (redirect) { guard += 6; combos.push('redirect'); }
    if (values.heal.some((v, i, a) => v <= 3 && a.indexOf(v) !== i)) { heal += 5; combos.push('return'); }
    const assigned = s.dice.filter(d => d.lane !== null).map(d => d.value);
    if ([1, 2, 3].every(v => assigned.includes(v))) { attack += 3; guard += 3; heal += 2; combos.push('harmony'); }
    const foe = intent(s), damage = Math.max(0, attack - foe.guard);
    const counter = damage >= s.enemyHp ? 0 : Math.max(0, foe.attack - guard);
    const riposte = redirect && damage < s.enemyHp && counter === 0 ? 4 : 0;
    const healing = Math.min(s.maxHp - s.hp, heal);
    return { attack, guard, heal, damage, counter, riposte, healing, combos,
      nextHp: Math.max(0, s.hp + healing - counter), enemyHp: Math.max(0, s.enemyHp - damage - riposte) };
  }
  function resolve(s) {
    if (s.phase !== 'plan' || s.dice.length !== 4 || s.dice.some(d => !d.lane)) return false;
    const p = preview(s);
    s.hp = p.nextHp; s.enemyHp = p.enemyHp; s.turns++; s.combos += p.combos.length;
    s.last = { damage: p.damage, counter: p.counter, healing: p.healing, riposte: p.riposte, combos: p.combos };
    s.dice = [];
    if (s.hp === 0) s.phase = 'lost';
    else if (s.enemyHp === 0) { s.cleared++; s.phase = s.stage === FOES.length - 1 ? 'won' : 'reward'; }
    else { s.round++; s.phase = 'ready'; }
    return true;
  }
  function upgrade(s, kind) {
    if (s.phase !== 'reward' || !Object.hasOwn(s.upgrades, kind)) return false;
    s.upgrades[kind]++;
    if (kind === 'heart') s.maxHp += 6;
    s.hp = Math.min(s.maxHp, s.hp + (kind === 'heart' ? 14 : 9));
    s.stage++; s.round = 1; s.enemyHp = FOES[s.stage]; s.phase = 'ready'; s.last = null; s.dice = []; s.rerolls = 1;
    return true;
  }
  function score(s) { return Math.max(0, s.cleared * 120 + s.combos * 8 + s.hp * 3 - s.turns * 2 + (s.phase === 'won' ? 300 : 0)); }
  function restore(raw) {
    try {
      const s = JSON.parse(raw), int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
      if (!s || s.version !== 1 || !int(s.rng, 1, 4294967295) || !int(s.stage, 0, 5) || !PHASES.includes(s.phase)) return null;
      if (!s.upgrades || !['blade', 'guard', 'heart'].every(k => int(s.upgrades[k], 0, 5))) return null;
      if (Object.values(s.upgrades).length !== 3 || Object.values(s.upgrades).reduce((a, b) => a + b, 0) !== s.stage) return null;
      if (s.maxHp !== 38 + s.upgrades.heart * 6 || !int(s.hp, 0, s.maxHp) || !int(s.enemyHp, 0, FOES[s.stage])) return null;
      if (!int(s.round, 1, 1000000) || !int(s.turns, 0, 6000000) || !int(s.combos, 0, s.turns * 4) || !int(s.rerolls, 0, 1)) return null;
      const finished = s.phase === 'reward' || s.phase === 'won';
      if (s.cleared !== s.stage + (finished ? 1 : 0) || (s.phase === 'lost') !== (s.hp === 0) || finished !== (s.enemyHp === 0)) return null;
      if ((s.phase === 'won' && s.stage !== 5) || (s.phase === 'reward' && s.stage === 5)) return null;
      if (!Array.isArray(s.dice) || s.dice.length !== (s.phase === 'plan' ? 4 : 0)) return null;
      if (!s.dice.every(d => d && int(d.value, 1, 6) && (d.lane === null || LANES.includes(d.lane)))) return null;
      if (s.last !== null && (!s.last || !['damage', 'counter', 'healing', 'riposte'].every(k => int(s.last[k], 0, 6000000)) || !Array.isArray(s.last.combos) || s.last.combos.length > 4 || !s.last.combos.every(k => ['inch', 'redirect', 'return', 'harmony'].includes(k)))) return null;
      return s;
    } catch { return null; }
  }
  return { create, roll, assign, reroll, intent, preview, resolve, upgrade, score, restore, LANES, FOES };
});
