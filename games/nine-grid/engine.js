(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NineGrid = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FLOORS = 5;
  function random(seed) {
    let n = seed >>> 0;
    return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function adjacent(a, b) { return Math.abs(a % 3 - b % 3) + Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) === 1; }
  function note(s, key, values = {}) { s.message = { key, values }; s.log.unshift(s.message); s.log.length = Math.min(s.log.length, 30); }
  function monster(floor, kind) {
    const hp = kind === 3 ? 26 : 8 + kind * 3 + (floor - 1) * 2;
    return { kind, hp, maxHp: hp, atk: kind === 3 ? 7 : 3 + kind + Math.floor((floor - 1) / 2), round: 0 };
  }
  function makeFloor(s) {
    const types = ['supply', 'monster', 'chest', 'monster', 'supply', 'monster', 'chest'];
    if (s.floor > 1) for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(s.rng() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
    let cursor = 0, kind = 0;
    s.tiles = Array.from({ length: 9 }, (_, i) => {
      const type = i === 7 ? 'camp' : i === 1 ? 'exit' : types[cursor++];
      const tile = { type, cleared: type === 'camp', visited: type === 'camp' };
      if (type === 'monster') tile.enemy = monster(s.floor, [2, 0, 1][kind++]);
      return tile;
    });
    s.pos = 7; s.previous = 7; s.rune = false; s.enemy = null; s.phase = 'explore';
  }
  function create(seed = Date.now()) {
    const s = { rng: random(seed), seed, floor: 1, hp: 32, maxHp: 32, food: 12, maxFood: 16, atk: 5, armor: 0, potions: 2, gold: 0, moves: 0, kills: 0, explored: 0, floorsCleared: 0, log: [], message: null };
    makeFloor(s); s.phase = 'ready'; note(s, 'welcome'); return s;
  }
  function start(s) { if (s.phase !== 'ready') return false; s.phase = 'explore'; note(s, 'started'); return true; }
  function damage(s, value) { s.hp = Math.max(0, s.hp - value); if (!s.hp) { s.phase = 'lost'; note(s, 'lostMessage'); } }
  function travelCost(s) { s.moves++; if (s.food > 0) s.food--; else damage(s, 3); }
  function intent(s) { return s.enemy ? s.enemy.atk * (s.enemy.round % 3 === 2 ? 2 : 1) : 0; }
  function estimate(s, guarded = false) { return Math.max(1, intent(s) - s.armor - (guarded ? 3 : 0)); }
  function move(s, index) {
    if (s.phase !== 'explore' || !Number.isInteger(index) || index < 0 || index > 8 || !adjacent(s.pos, index)) return false;
    const tile = s.tiles[index];
    if (tile.type === 'exit' && !s.rune) { note(s, 'locked'); return false; }
    const previous = s.pos;
    travelCost(s);
    if (s.phase === 'lost') return true;
    s.previous = previous; s.pos = index;
    if (!tile.visited) { tile.visited = true; s.explored++; }
    if (tile.cleared) { note(s, 'walk'); return true; }
    if (tile.type === 'monster') { s.enemy = tile.enemy; s.phase = 'combat'; note(s, 'encounter', { kind: s.enemy.kind }); }
    if (tile.type === 'chest') { s.phase = 'treasure'; note(s, 'chestMessage'); }
    if (tile.type === 'supply') {
      const hp = Math.min(9, s.maxHp - s.hp), food = Math.min(5, s.maxFood - s.food);
      s.hp += hp; s.food += food; tile.cleared = true; note(s, 'supplyMessage', { hp, food });
    }
    if (tile.type === 'exit') {
      if (s.floor === FLOORS) { tile.enemy ||= monster(s.floor, 3); s.enemy = tile.enemy; s.phase = 'combat'; note(s, 'guardianMessage'); }
      else { s.phase = 'stairs'; note(s, 'stairsMessage'); }
    }
    return true;
  }
  function fight(s, guarded = false) {
    if (s.phase !== 'combat') return false;
    const dealt = Math.min(s.enemy.hp, guarded ? Math.max(1, Math.floor(s.atk / 2)) : s.atk);
    s.enemy.hp -= dealt;
    if (!s.enemy.hp) {
      const boss = s.enemy.kind === 3, gold = boss ? 35 : 8 + s.enemy.kind * 4;
      s.gold += gold; s.kills++; s.rune = true; s.tiles[s.pos].cleared = true; s.enemy = null;
      s.phase = boss ? 'won' : 'explore';
      if (boss) s.floorsCleared = FLOORS;
      note(s, boss ? 'wonMessage' : 'defeated', { gold }); return true;
    }
    const received = estimate(s, guarded);
    s.enemy.round++; damage(s, received);
    if (s.phase !== 'lost') note(s, guarded ? 'guardMessage' : 'attackMessage', { dealt, received });
    return true;
  }
  function retreat(s) {
    if (s.phase !== 'combat') return false;
    const hit = Math.max(1, s.enemy.atk - s.armor);
    damage(s, hit); if (s.phase === 'lost') return true;
    travelCost(s); if (s.phase === 'lost') return true;
    s.pos = s.previous; s.enemy = null; s.phase = 'explore'; note(s, 'retreatMessage', { hit }); return true;
  }
  function loot(s, choice) {
    if (s.phase !== 'treasure' || !['blade', 'shield', 'flask'].includes(choice)) return false;
    if (choice === 'blade') s.atk++;
    if (choice === 'shield') s.armor++;
    if (choice === 'flask') { s.potions += 2; s.gold += 15; }
    s.tiles[s.pos].cleared = true; s.phase = 'explore'; note(s, 'lootMessage', { choice }); return true;
  }
  function potion(s) {
    if (!['explore', 'combat', 'treasure', 'stairs'].includes(s.phase) || !s.potions || s.hp === s.maxHp) return false;
    const hp = Math.min(14, s.maxHp - s.hp); s.hp += hp; s.potions--; note(s, 'potionMessage', { hp }); return true;
  }
  function descend(s) {
    if (s.phase !== 'stairs') return false;
    s.floorsCleared++; s.floor++; s.hp = Math.min(s.maxHp, s.hp + 4); s.food = Math.min(s.maxFood, s.food + 4); makeFloor(s); note(s, 'nextMessage', { floor: s.floor }); return true;
  }
  function stay(s) { if (s.phase !== 'stairs') return false; s.phase = 'explore'; note(s, 'walk'); return true; }
  function score(s) { return s.gold + s.kills * 15 + s.explored * 5 + s.floorsCleared * 60 + (s.phase === 'won' ? s.hp * 2 : 0); }
  return { create, start, adjacent, move, fight, retreat, loot, potion, descend, stay, intent, estimate, score, FLOORS };
});
