/* A voyage is dealt up front so that tomorrow's forecast and a replay agree. */
(() => {
  'use strict';
  const DAYS = 7;
  const TARGET = 24;
  const TUTORIAL = 93;
  const jobs = ['water', 'food', 'wood', 'build'];
  const costs = {
    clear: { water: 2, food: 2 },
    hot:   { water: 3, food: 1 },
    rain:  { water: 1, food: 2 },
    wind:  { water: 2, food: 3 }
  };

  function deal(seed) {
    let n = seed >>> 0;
    function roll(limit) {
      n = (Math.imul(1664525, n) + 1013904223) >>> 0;
      return Math.floor(n / 4294967296 * limit);
    }
    const skies = Object.keys(costs);
    return Array.from({ length: DAYS }, (_, day) => {
      const weather = day === 0 ? 'clear' : skies[roll(skies.length)];
      const dice = [1 + roll(3), 2 + roll(4), 4 + roll(3)];
      for (let i = dice.length - 1; i > 0; i--) {
        const j = roll(i + 1);
        [dice[i], dice[j]] = [dice[j], dice[i]];
      }
      return { weather, dice };
    });
  }

  function newVoyage(seed = TUTORIAL) {
    return {
      seed: seed >>> 0, chart: deal(seed), day: 1,
      stock: { water: 5, food: 5, wood: 2, raft: 0 },
      tasks: [null, null, null], result: null, survived: 0
    };
  }

  function assign(state, index, job) {
    if (state.result || !Number.isInteger(index) || index < 0 || index > 2 || !jobs.includes(job)) return false;
    state.tasks[index] = job;
    return true;
  }

  function forecast(state) {
    const { dice, weather } = state.chart[state.day - 1];
    const gains = { water: 0, food: 0, wood: 0, build: 0 };
    state.tasks.forEach((job, i) => { if (job) gains[job] += dice[i]; });
    const timber = state.stock.wood + gains.wood;
    const repair = Math.min(gains.build, timber, TARGET - state.stock.raft);
    return {
      water: Math.max(0, state.stock.water + gains.water - costs[weather].water),
      food: Math.max(0, state.stock.food + gains.food - costs[weather].food),
      wood: timber - repair, raft: state.stock.raft + repair
    };
  }

  function endDay(state) {
    if (state.result || state.tasks.some(job => !job)) return false;
    state.stock = forecast(state);
    const { water, food, raft } = state.stock;
    if (!water || !food) state.result = 'depleted';
    else {
      state.survived = state.day;
      if (raft === TARGET) state.result = 'escaped';
      else if (state.day === DAYS) state.result = 'stranded';
    }
    if (!state.result) state.day++;
    state.tasks = [null, null, null];
    return true;
  }

  // Each row corresponds to the three dice from left to right on chart 93.
  const tutorialRoute = [
    ['water', 'wood', 'build'], ['wood', 'food', 'build'], ['water', 'food', 'wood'],
    ['wood', 'water', 'build'], ['food', 'build', 'wood'], ['build', 'water', 'wood'],
    ['water', 'build', 'food']
  ];
  const api = { DAYS, TARGET, TUTORIAL, jobs, costs, tutorialRoute, newVoyage, assign, forecast, endDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.Island = api;
})();
