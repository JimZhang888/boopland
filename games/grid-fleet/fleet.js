/* The navigator receives a public log of its own attempts. Ship positions live
   with the referee and are never passed to the targeting function. */
const GridFleet = (() => {
  'use strict';

  const size = 8;
  const lengths = Object.freeze([4, 3, 2]);
  const allCells = Array.from({ length: size * size }, (_, i) => i);

  function footprint(index, bow, vertical) {
    if (!Number.isInteger(bow) || bow < 0 || bow >= size * size || !lengths[index]) return [];
    const start = vertical ? Math.floor(bow / size) : bow % size;
    if (start + lengths[index] > size) return [];
    return Array.from({ length: lengths[index] }, (_, i) => bow + i * (vertical ? size : 1));
  }

  function placement(fleet, index, bow, vertical) {
    const cells = footprint(index, bow, vertical);
    if (!cells.length) return 'edge';
    const blocked = fleet.some((ship, i) => i !== index && ship &&
      footprint(i, ship.bow, ship.vertical).some(cell => cells.includes(cell)));
    return blocked ? 'overlap' : 'ok';
  }

  function pick(options, random) {
    return options[Math.floor(random() * options.length)];
  }

  function randomFleet(random = Math.random) {
    const fleet = [];
    lengths.forEach((length, index) => {
      const candidates = [];
      for (const bow of allCells) {
        for (const vertical of [false, true]) {
          if (placement(fleet, index, bow, vertical) === 'ok') candidates.push({ bow, vertical });
        }
      }
      fleet.push(pick(candidates, random));
    });
    return fleet;
  }

  function neighbors(cell) {
    const adjacent = [];
    if (cell % size > 0) adjacent.push(cell - 1);
    if (cell % size < size - 1) adjacent.push(cell + 1);
    if (cell >= size) adjacent.push(cell - size);
    if (cell < size * (size - 1)) adjacent.push(cell + size);
    return adjacent;
  }

  function chooseShot(history, random = Math.random) {
    const marked = new Set(history.map(report => report.cell));
    const sunk = new Set(history.flatMap(report => report.sunkCells || []));
    const hits = new Set(history.filter(report => report.kind === 'hit' && !sunk.has(report.cell)).map(report => report.cell));
    const scores = new Map();
    for (const hit of hits) {
      for (const next of neighbors(hit)) {
        if (marked.has(next)) continue;
        const opposite = hit - (next - hit);
        const aligned = neighbors(hit).includes(opposite) && hits.has(opposite);
        scores.set(next, (scores.get(next) || 0) + (aligned ? 3 : 1));
      }
    }
    if (scores.size) {
      const best = Math.max(...scores.values());
      return pick([...scores.keys()].filter(cell => scores.get(cell) === best), random);
    }
    return pick(allCells.filter(cell => !marked.has(cell)), random);
  }

  function createMatch(home, away) {
    if (![home, away].every(fleet => fleet.length === lengths.length &&
      lengths.every((_, i) => fleet[i] && placement(fleet, i, fleet[i].bow, fleet[i].vertical) === 'ok'))) {
      throw new Error('Invalid fleet placement');
    }
    const charts = [away, home].map(fleet => fleet.map((ship, i) => footprint(i, ship.bow, ship.vertical)));
    const logs = [[], []];
    let turn = 0;
    let winner = null;

    function shoot(side, cell) {
      if (winner !== null || turn !== side || !allCells.includes(cell)) return null;
      const log = logs[side];
      if (log.some(report => report.cell === cell)) return null;
      const ship = charts[side].find(cells => cells.includes(cell));
      const report = { cell, kind: ship ? 'hit' : 'miss' };
      if (ship && ship.every(c => c === cell || log.some(prior => prior.cell === c))) {
        report.kind = 'sunk';
        // A sinking announces the outline to both players under identical rules.
        report.sunkCells = Object.freeze([...ship]);
      }
      log.push(Object.freeze(report));
      if (log.filter(item => item.kind === 'sunk').length === lengths.length) winner = side;
      else turn = 1 - side;
      return report;
    }

    return Object.freeze({
      get winner() { return winner; },
      get turn() { return turn; },
      history(side) { return logs[side].slice(); },
      fire(cell) { return shoot(0, cell); },
      reply(random = Math.random) {
        if (winner !== null || turn !== 1) return null;
        return shoot(1, chooseShot(logs[1].slice(), random));
      }
    });
  }

  return Object.freeze({ size, lengths, footprint, placement, randomFleet, chooseShot, createMatch });
})();
