(() => {
  'use strict';
  const game = window.Island;
  const i18n = window.BooplandI18n;
  const t = (key, values) => i18n.t('seven-day-island.' + key, values);
  const $ = id => document.getElementById(id);
  const diceButtons = [...document.querySelectorAll('[data-die]')];
  const jobButtons = [...document.querySelectorAll('[data-job]')];
  const instruction = document.querySelector('#planner > p');
  instruction.removeAttribute('data-i18n');
  const recordKey = 'boopland-seven-day-island-last-v1';
  const dots = [[], [4], [0,8], [0,4,8], [0,2,6,8], [0,2,4,6,8], [0,2,3,5,6,8]];
  const skyIcon = sky => sky === 'clear' ? 'sun' : sky;
  let state = game.newVoyage(), mode = 'tutorial', selected = 0, history = [], panel = 'notes';
  let lastResult = null;
  try {
    const saved = JSON.parse(localStorage.getItem(recordKey));
    if (saved && ['escaped','depleted','stranded'].includes(saved.result) &&
        Number.isInteger(saved.n) && saved.n >= 0 && saved.n <= game.DAYS) lastResult = saved;
  } catch { /* Play locally when storage is unavailable. */ }

  function el(name, value) {
    const node = document.createElement(name);
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function icon(key) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ico');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#i-' + key);
    svg.append(use);
    return svg;
  }

  function rationPair(key, cost, sign) {
    const node = el('span');
    node.className = 'cost-pair';
    node.setAttribute('aria-label', t('r' + key) + ' ' + cost);
    node.title = t('r' + key) + ' ' + cost;
    node.append(icon(key), sign + cost);
    return node;
  }

  function renderCoast() {
    const {day, chart, stock, result} = state;
    const today = chart[day - 1].weather;
    const tomorrow = chart[day]?.weather;
    $('day').textContent = t('day', {n:day});
    $('today').replaceChildren(icon(skyIcon(today)), t(today));
    $('cost').replaceChildren(...['water','food'].map(k => rationPair(k, game.costs[today][k], '−')));
    if (tomorrow) {
      const label = el('span');
      label.className = 'cost-pair';
      label.append(icon(skyIcon(tomorrow)), t(tomorrow));
      const cost = el('small');
      cost.className = 'cost-pair';
      cost.append(...['water','food'].map(k => rationPair(k, game.costs[tomorrow][k], '')));
      $('forecast').replaceChildren(label, cost);
    } else $('forecast').replaceChildren(icon('night'), t('lastTide'));

    const next = result ? stock : game.forecast(state);
    game.jobs.forEach(k => {
      const field = k === 'build' ? 'raft' : k;
      const now = stock[field], later = next[field], number = $('s-' + k);
      number.replaceChildren(String(now));
      if (later !== now) {
        const projection = el('em', '→' + later);
        if (!later && (k === 'water' || k === 'food')) projection.className = 'danger';
        number.append(projection);
      }
      if (field === 'raft') number.append(el('i', '/' + game.TARGET));
      number.setAttribute('aria-label', t('withStock', {item:t('r' + k), now, next:later}));
    });

    document.querySelectorAll('.raft-log').forEach((log, i) =>
      log.classList.toggle('built', stock.raft > i * game.TARGET / 6));
    document.querySelector('.chart').classList.toggle('sailing', result === 'escaped');
    document.querySelector('.chart').dataset.weather = today;
    [...$('timeline').children].forEach((li, i) => {
      li.classList.toggle('past', i + 1 < day);
      if (i + 1 === day) li.setAttribute('aria-current','step');
      else li.removeAttribute('aria-current');
      li.setAttribute('aria-label', t('day', {n:i+1}));
    });
  }

  function renderPlanner() {
    const {dice} = state.chart[state.day - 1];
    const count = state.tasks.filter(Boolean).length;
    const future = game.forecast(state);
    const repairPips = state.tasks.reduce((sum, k, i) => sum + (k === 'build' ? dice[i] : 0), 0);
    let cue = 'choose';
    if (count === 3) {
      cue = 'ready';
      if (!future.water || !future.food) cue = 'risk';
      else if (future.raft < game.TARGET && repairPips > future.raft - state.stock.raft) cue = 'shortWood';
    }
    instruction.textContent = t(cue);
    instruction.classList.toggle('warning', cue === 'risk' || cue === 'shortWood');
    $('counter').textContent = count + ' / 3';
    diceButtons.forEach((button,i) => {
      const job = state.tasks[i], value = dice[i], label = t(job ? 'a' + job : 'free');
      button.setAttribute('aria-pressed', String(i === selected));
      button.setAttribute('aria-label', t('dieLabel', {i:i+1,p:value,job:label}));
      button.querySelector('.die-job').textContent = label;
      const face = button.querySelector('.face');
      if (face.dataset.value === String(value)) return;
      face.dataset.value = value;
      face.replaceChildren(...dots[value].map(index => {
        const pip = el('i');
        pip.style.gridArea = (Math.floor(index/3)+1) + ' / ' + (index%3+1);
        return pip;
      }));
    });
    jobButtons.forEach(button => {
      const job = button.dataset.job;
      const gain = (job === 'build' ? '≤' : '+') + dice[selected];
      button.querySelector('.gain').textContent = gain;
      button.setAttribute('aria-pressed', String(job === state.tasks[selected]));
    });
    $('commit').disabled = count !== 3;
    $('clear').disabled = !history.length;
  }

  function renderEnd() {
    const {result, day, stock, survived} = state;
    $('outcome').textContent = t(result);
    let detail;
    if (result === 'escaped') detail = t('winLine', {day});
    else if (result === 'stranded') detail = t('timeoutLine', {left:game.TARGET-stock.raft});
    else {
      const items = ['water','food'].filter(k => !stock[k]).map(k => t('r'+k));
      detail = t('failLine', {day, n:survived, item:items.join(' / ')});
    }
    $('outcome-detail').textContent = detail;
    $('outcome-stock').textContent = t('rbuild') + ' ' + stock.raft + ' / ' + game.TARGET;
  }

  function renderDialog() {
    $('notes').hidden = panel !== 'notes';
    $('modes').hidden = panel !== 'modes';
    $('dialog-title').textContent = t(panel === 'notes' ? 'journal' : 'voyages');
    const chart = game.newVoyage(game.TUTORIAL).chart;
    $('route').replaceChildren(...game.tutorialRoute.map((row,d) => el('li',
      row.map((job,i) => chart[d].dice[i] + ' ' + t('a'+job)).join(' · '))));
    $('last').textContent = lastResult ? t('previous', {...lastResult, result:t(lastResult.result)}) : '';
  }

  function render() {
    document.title = t('title');
    $('mode-name').textContent = t(mode);
    $('planner').hidden = Boolean(state.result);
    $('end').hidden = !state.result;
    renderCoast();
    if (state.result) renderEnd(); else renderPlanner();
    if ($('dialog').open) renderDialog();
  }

  function showPanel(which) {
    panel = which;
    renderDialog();
    $('dialog').showModal();
    $('close').focus();
  }

  function start(nextMode, seed) {
    mode = nextMode;
    if (seed === undefined) {
      if (mode === 'tutorial') seed = game.TUTORIAL;
      else {
        const value = new Uint32Array(1);
        do {
          if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(value);
          else value[0] = Math.floor(Math.random() * 4294967296);
        } while (value[0] === state.seed || value[0] === game.TUTORIAL);
        seed = value[0];
      }
    }
    state = game.newVoyage(seed);
    selected = 0;
    history = [];
    if ($('dialog').open) $('dialog').close();
    render();
    $('live').textContent = t(mode) + ' · ' + t('day',{n:1});
    diceButtons[0].focus({preventScroll:true});
  }

  diceButtons.forEach((btn,i) => btn.addEventListener('click', () => {
    selected = i;
    renderPlanner();
  }));
  jobButtons.forEach(btn => btn.addEventListener('click', () => {
    const job = btn.dataset.job, i = selected;
    if (state.result || state.tasks[i] === job) return;
    const previous = state.tasks[i];
    if (!game.assign(state, i, job)) return;
    history.push({i, previous});
    const next = state.tasks.findIndex(k => k === null);
    if (next >= 0) selected = next;
    render();
    $('live').textContent = t('assigned', {die:state.chart[state.day-1].dice[i], job:t('a'+job)}) + ' · ' + $('counter').textContent;
  }));
  $('clear').onclick = () => {
    const undo = history.pop();
    if (!undo || state.result) return;
    selected = undo.i;
    state.tasks[selected] = undo.previous;
    render();
    $('live').textContent = t('undo') + ' · ' + $('counter').textContent;
  };
  $('commit').onclick = () => {
    if (!game.endDay(state)) return;
    selected = 0;
    history = [];
    if (state.result) {
      lastResult = {result:state.result,n:state.survived};
      try { localStorage.setItem(recordKey,JSON.stringify(lastResult)); } catch { /* In-memory record is still shown. */ }
    }
    render();
    $('live').textContent = state.result ? $('outcome-detail').textContent : t('day',{n:state.day});
    (state.result ? $('replay') : diceButtons[0]).focus({preventScroll:true});
  };
  $('journal').onclick = () => showPanel('notes');
  $('voyages').onclick = () => showPanel('modes');
  $('close').onclick = () => $('dialog').close();
  $('dialog').addEventListener('click', event => {
    const bounds = $('dialog').getBoundingClientRect();
    if (event.target === $('dialog') && (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom)) $('dialog').close();
  });
  $('start-tutorial').onclick = () => start('tutorial');
  $('start-random').onclick = $('new-random').onclick = () => start('random');
  $('replay').onclick = () => start(mode, state.seed);
  for (let day = 1; day <= game.DAYS; day++) {
    const li = el('li');
    li.append(el('span', day));
    $('timeline').append(li);
  }
  window.addEventListener('boopland:languagechange', render);
  render();
})();
