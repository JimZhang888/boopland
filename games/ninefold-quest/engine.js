(function (root) {
  'use strict';
  const VERSION = 1;
  const weather = ['calm', 'thorns', 'mist', 'wind', 'night'];
  function random(s) { s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0; return s.seed / 4294967296; }
  function integer(s, min, max) { return min + Math.floor(random(s) * (max - min + 1)); }
  function note(s, key, values = {}) { s.message = { key, values }; }
  function heal(s, n) { const amount = Math.min(n, s.maxHp - s.hp); s.hp += amount; return amount; }
  function resolved(s) { return s.tiles.filter(t => t.done && !['camp', 'boss'].includes(t.type)).length; }
  function score(s) { return s.cleared * 100 + s.explored * 10 + s.gold + (s.status === 'won' ? s.hp * 5 + 200 : 0); }
  function map(s) {
    const types = ['enemy', 'enemy', 'chest', 'spring', 'trap', 'event', 'merchant'];
    for (let i = types.length - 1; i > 0; i--) { const j = integer(s, 0, i); [types[i], types[j]] = [types[j], types[i]]; }
    s.weather = weather[s.floor - 1]; s.focus = 1; s.pending = null;
    s.tiles = Array.from({ length: 9 }, (_, i) => {
      const type = i === 4 ? 'camp' : i === 1 ? 'boss' : types.pop();
      return { type, open: type === 'camp' || type === 'boss', done: false, variant: integer(s, 0, 3), reward: integer(s, 8, 14) + (s.weather === 'wind' ? 4 : 0) };
    });
  }
  function create(seed = Date.now()) {
    const s = { version: VERSION, seed: seed >>> 0, floor: 1, cleared: 0, hp: 30, maxHp: 30, attack: 4, armor: 1, gold: 0, potions: 1, focus: 1, explored: 0, turns: 0, status: 'playing', pending: null, message: null };
    map(s); note(s, 'welcome'); return s;
  }
  function enemy(s, tile) {
    const boss = tile.type === 'boss';
    return { hp: (boss ? 13 + s.floor * 5 : 4 + s.floor * 3 + tile.variant) + (s.weather === 'mist' ? 3 : 0), attack: 2 + s.floor + (boss ? 1 : 0) + (s.weather === 'night' ? 1 : 0), gold: boss ? 12 + s.floor * 3 : 5 + s.floor * 2 };
  }
  function combat(s, tile, power = false) {
    const e = enemy(s, tile), attack = s.attack + (power ? 3 : 0);
    return { ...e, rounds: Math.ceil(e.hp / attack), damage: Math.max(0, Math.ceil(e.hp / attack) - 1) * Math.max(1, e.attack - s.armor) };
  }
  function finishTile(s, tile) { tile.done = true; s.pending = null; s.turns++; if (tile.type !== 'camp') s.explored++; }
  function check(s) { if (s.hp <= 0) { s.hp = 0; s.status = 'lost'; s.pending = null; note(s, 'lost'); } return s; }
  function select(s, index) {
    if (s.status !== 'playing' || !Number.isInteger(index) || !s.tiles[index] || s.tiles[index].done) return false;
    const tile = s.tiles[index];
    if (tile.type === 'boss' && resolved(s) < 4) { note(s, 'locked', { n: 4 - resolved(s) }); return false; }
    tile.open = true; s.pending = index;
    if (tile.type === 'chest') { s.gold += tile.reward; finishTile(s, tile); note(s, 'foundGold', { n: tile.reward }); }
    return true;
  }
  function choices(s) {
    if (s.status === 'upgrade') return ['blade', 'shield', 'vitality'];
    const tile = s.tiles[s.pending]; if (!tile || s.pending === null || s.status !== 'playing') return [];
    return { enemy: ['fight', 'power', 'back'], boss: ['fight', 'power', 'back'], camp: ['rest', 'back'], spring: ['drink', 'bottle'], trap: ['risk', 'careful'], event: ['accept', 'leave'], merchant: ['buyPotion', 'buyBlade', 'leave'] }[tile.type] || [];
  }
  function cost(s, action) { if (action === 'buyPotion') return 7; if (action === 'buyBlade') return 10; if (action === 'accept' && s.tiles[s.pending]?.variant === 1) return 8; return 0; }
  function can(s, action) { return choices(s).includes(action) && s.gold >= cost(s, action) && !(action === 'power' && !s.focus) && !(action === 'rest' && s.hp === s.maxHp); }
  function act(s, action) {
    if (!can(s, action)) return false;
    if (s.status === 'upgrade') {
      if (action === 'blade') s.attack += 2;
      if (action === 'shield') s.armor += 1;
      if (action === 'vitality') s.maxHp += 6;
      const n = heal(s, action === 'vitality' ? 14 : 6);
      s.floor++; s.status = 'playing'; map(s); note(s, 'newFloor', { n }); return true;
    }
    if (action === 'back') { s.pending = null; return true; }
    const tile = s.tiles[s.pending];
    if (action === 'fight' || action === 'power') {
      const hit = combat(s, tile, action === 'power'); if (action === 'power') s.focus--;
      s.hp -= hit.damage; finishTile(s, tile);
      if (s.hp > 0) {
        s.gold += hit.gold; note(s, 'battleWon', { n: hit.damage, g: hit.gold });
        if (tile.type === 'boss') { s.cleared++; s.pending = null; s.status = s.floor === 5 ? 'won' : 'upgrade'; }
      }
    } else {
      const price = cost(s, action); s.gold -= price;
      if (action === 'rest' || action === 'drink') note(s, 'healed', { n: heal(s, action === 'rest' ? 7 : 16) });
      if (action === 'bottle' || action === 'buyPotion') { s.potions++; note(s, 'gotPotion'); }
      if (action === 'buyBlade') { s.attack++; note(s, 'attackUp'); }
      if (action === 'risk') { const n = Math.max(1, 5 + (s.weather === 'thorns' ? 2 : 0) - s.armor); s.hp -= n; s.gold += 15; note(s, 'riskResult', { n }); }
      if (action === 'careful') { s.gold += 4; note(s, 'foundGold', { n: 4 }); }
      if (action === 'accept') {
        if (tile.variant === 0) { s.hp -= 4; s.attack++; note(s, 'shrineResult'); }
        if (tile.variant === 1) { s.armor++; note(s, 'armorUp'); }
        if (tile.variant === 2) { if (random(s) < .6) note(s, 'healed', { n: heal(s, 10) }); else { s.hp -= 4; note(s, 'badMushroom'); } }
        if (tile.variant === 3) { s.gold += 8; note(s, 'foundGold', { n: 8 }); }
      }
      if (action === 'leave') note(s, 'leftEvent');
      finishTile(s, tile);
    }
    check(s); return true;
  }
  function potion(s) {
    if (s.status !== 'playing' || s.hp >= s.maxHp || s.potions < 1) return false;
    s.potions--; note(s, 'healed', { n: heal(s, 12) }); return true;
  }
  function restore(raw) {
    try {
      const s = JSON.parse(raw);
      if (!s || s.version !== VERSION || !['playing', 'upgrade', 'won', 'lost'].includes(s.status)) return null;
      const limits = { seed: [0, 4294967295], floor: [1, 5], cleared: [0, 5], hp: [0, 200], maxHp: [1, 200], attack: [1, 100], armor: [0, 100], gold: [0, 10000], potions: [0, 100], focus: [0, 1], explored: [0, 40], turns: [0, 45] };
      for (const [key, [min, max]] of Object.entries(limits)) if (!Number.isInteger(s[key]) || s[key] < min || s[key] > max) return null;
      if (s.hp > s.maxHp || s.weather !== weather[s.floor - 1] || (s.status === 'playing' && !s.hp)) return null;
      if (!Array.isArray(s.tiles) || s.tiles.length !== 9 || s.tiles[4].type !== 'camp' || s.tiles[1].type !== 'boss') return null;
      for (const t of s.tiles) if (!['camp', 'boss', 'enemy', 'chest', 'spring', 'trap', 'event', 'merchant'].includes(t.type) || typeof t.open !== 'boolean' || typeof t.done !== 'boolean' || !Number.isInteger(t.variant) || t.variant < 0 || t.variant > 3 || !Number.isInteger(t.reward) || t.reward < 8 || t.reward > 18) return null;
      if (s.pending !== null && (!Number.isInteger(s.pending) || s.pending < 0 || s.pending > 8 || !s.tiles[s.pending].open || s.tiles[s.pending].done)) return null;
      if (!s.message || typeof s.message.key !== 'string' || !s.message.values || typeof s.message.values !== 'object') return null;
      return s;
    } catch { return null; }
  }
  const api = { create, select, act, potion, choices, can, combat, enemy, resolved, score, restore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NineGrid = api;
})(typeof window !== 'undefined' ? window : globalThis);
