(() => {
  'use strict';
  const { rink, clamp, launchPoint, createStone, step, measure } = window.DeskCurling;
  const byId = id => document.getElementById(id);
  const t = (name, values) => BooplandI18n.t('deskCurling.' + name, values);
  const svgNS = 'http://www.w3.org/2000/svg';
  const court = byId('rink'), world = byId('world'), layer = byId('stones');
  const angle = byId('angle'), power = byId('power'), flick = byId('flick');
  const dialog = byId('dialog'), status = byId('status');
  const teams = [byId('sun-team'), byId('moon-team')];
  const teamName = team => t(team === 0 ? 'sun' : 'moon');
  let stones = [], turn = 0, phase = 'ready', lastOut = false;
  let round = 0, points = [0, 0], origin = launchPoint([]);
  let measurement = measure([]);
  let raf = 0, lastTime = 0, accumulator = 0, gesture = null, dialogMode = '';
  const activeTeam = () => (round + turn) % 2;
  const stoneNodes = new Map();
  const stepDuration = 1 / 120;

  function shape(name, attrs) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  const rim = Array.from({ length: 64 }, (_, i) => {
    const theta = i * Math.PI / 32;
    const r = i % 4 === 0 || i % 4 === 3 ? 19 : 17.1;
    return (i ? 'L' : 'M') + (Math.cos(theta) * r).toFixed(2) + ',' + (Math.sin(theta) * r).toFixed(2);
  }).join(' ') + 'Z';

  function capNode(team) {
    const sun = team === 0, node = shape('g', {});
    node.append(
      shape('ellipse', { cx:1, cy:2.9, rx:19, ry:17.8, fill:'#544b3940' }),
      shape('path', { d:rim, fill:sun ? '#cb8765' : '#80a8a4', stroke:sun ? '#82513d' : '#456967', 'stroke-width':1.6 }),
      shape('circle', { r:13.5, fill:sun ? '#a7593d' : '#4f7f7e', stroke:'#f5e9cf', 'stroke-width':1.2 }),
      shape('use', { href:sun ? '#sunmark' : '#moonmark', color:'#fff0cd' })
    );
    layer.append(node);
    return node;
  }

  let preview = null;
  function drawCaps() {
    for (const stone of stones) {
      if (stone.removed) {
        stoneNodes.get(stone)?.remove();
        stoneNodes.delete(stone);
        continue;
      }
      let node = stoneNodes.get(stone);
      if (!node) {
        node = capNode(stone.team);
        stoneNodes.set(stone, node);
      }
      node.setAttribute('transform', 'translate(' + stone.x + ' ' + stone.y + ') rotate(' + stone.spin + ')');
    }
    if (preview) preview.remove();
    preview = null;
    if (phase === 'ready') {
      preview = capNode(activeTeam());
      preview.setAttribute('transform', 'translate(' + origin.x + ' ' + origin.y + ')');
    }
  }

  function drawMeasurement() {
    const marks = byId('measurement');
    marks.replaceChildren();
    if (phase === 'moving') return;
    for (const stone of measurement.leaders) {
      marks.append(shape('circle', {cx:stone.x, cy:stone.y, r:25}));
      if (phase === 'ended') {
        marks.append(shape('line', {x1:rink.targetX, y1:rink.centerY, x2:stone.x, y2:stone.y}));
      }
    }
  }
  function drawGuide() {
    const degrees = Number(angle.value), strength = Number(power.value);
    byId('angle-value').textContent = (degrees > 0 ? '+' : '') + degrees + '°';
    byId('power-value').textContent = strength + '%';
    byId('guide').style.display = phase === 'ready' ? '' : 'none';
    byId('launch-mark').setAttribute('transform', 'translate(' + origin.x + ' ' + origin.y + ')');
    byId('guide').setAttribute('transform', 'translate(' + origin.x + ' ' + origin.y + ') rotate(' + degrees + ')');
    const length = 34 + strength * 1.12;
    byId('guide-line').setAttribute('d', 'M28 0H' + (length - 3));
    byId('arrow').setAttribute('d', 'M' + (length - 6) + ' -5L' + length + ' 0l-6 5');
  }

  function renderStatus() {
    for (const [team, el] of teams.entries()) {
      const thrown = stones.filter(stone => stone.team === team).length;
      el.querySelector('.pips').textContent = Array(3 - thrown).fill('●').concat(Array(thrown).fill('○')).join(' ');
      el.querySelector('.points').textContent = points[team];
      el.classList.toggle('active', phase === 'ended' ? measurement.winner === team : activeTeam() === team);
    }
    const ended = phase === 'ended';
    byId('sliders').hidden = ended;
    byId('summary').hidden = !ended;
    angle.disabled = power.disabled = phase !== 'ready';
    flick.disabled = phase === 'moving';
    flick.textContent = t(ended ? 'again' : 'flick');
    const team = teamName(activeTeam());
    if (ended) {
      const winner = measurement.winner;
      status.textContent = winner === null ? t('draw') : t('won', {team:teamName(winner)});
      byId('summary').textContent = t('tally', {a:points[0], b:points[1]});
    } else if (phase === 'moving') {
      status.textContent = t('moving', {team});
    } else {
      const note = document.createElement('small');
      note.textContent = t(lastOut ? 'missed' : 'hint');
      const title = t(turn === 5 ? 'lastTurn' : 'turn', { team, n: Math.floor(turn / 2) + 1 });
      status.replaceChildren(document.createTextNode(title), note);
    }
    drawGuide();
    if (dialog.open) fillDialog();
  }

  function startRound() {
    cancelAnimationFrame(raf);
    raf = lastTime = accumulator = 0;
    clearGesture();
    phase = 'ready';
    turn = 0;
    stones = [];
    origin = launchPoint(stones);
    measurement = measure(stones);
    lastOut = false;
    stoneNodes.clear();
    layer.replaceChildren();
    angle.value = '0';
    power.value = '74';
    drawCaps();
    drawMeasurement();
    renderStatus();
  }

  function finishShot() {
    lastOut = stones[stones.length - 1].removed;
    turn++;
    phase = turn === 6 ? 'ended' : 'ready';
    measurement = measure(stones);
    if (phase === 'ended' && measurement.winner !== null) points[measurement.winner]++;
    if (phase === 'ready') origin = launchPoint(stones);
    angle.value = '0';
    power.value = '74';
    drawCaps();
    drawMeasurement();
    renderStatus();
  }

  function animate(time) {
    raf = 0;
    if (document.hidden || dialog.open || phase !== 'moving') return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.06) : 0;
    lastTime = time;
    accumulator += delta;
    while (accumulator >= stepDuration) {
      accumulator -= stepDuration;
      if (!step(stones, stepDuration)) {
        finishShot();
        return;
      }
    }
    drawCaps();
    raf = requestAnimationFrame(animate);
  }
  function resumeMotion() {
    if (phase === 'moving' && !dialog.open && !document.hidden && !raf) {
      lastTime = 0;
      raf = requestAnimationFrame(animate);
    }
  }
  function launch() {
    if (dialog.open || phase === 'moving') return;
    if (phase === 'ended') {
      round++;
      startRound();
      return;
    }
    clearGesture();
    stones.push(createStone(activeTeam(), Number(angle.value), Number(power.value), origin));
    phase = 'moving';
    accumulator = 0;
    drawCaps();
    drawMeasurement();
    renderStatus();
    resumeMotion();
  }

  function boardPoint(event) {
    const matrix = world.getScreenCTM();
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  function clearGesture() {
    if (!gesture) return;
    const id = gesture.id;
    gesture = null;
    court.classList.remove('swiping');
    if (court.hasPointerCapture(id)) court.releasePointerCapture(id);
  }

  function updateAim(event) {
    const point = boardPoint(event);
    const dx = point.x - gesture.from.x, dy = point.y - gesture.from.y;
    gesture.armed = false;
    if (dx <= 0) return;
    if (gesture.flick) {
      const travel = Math.hypot(dx, dy) * gesture.scale;
      if (dx * gesture.scale < 10) return;
      const fullStroke = clamp(180 * gesture.scale, 68, 160);
      power.value = String(clamp(Math.round(100 * travel / fullStroke), 20, 100));
      gesture.armed = true;
    }
    angle.value = String(clamp(Math.round(Math.atan2(dy, dx) * 180 / Math.PI), -35, 35));
    drawGuide();
  }
  court.addEventListener('pointerdown', event => {
    if (phase !== 'ready' || dialog.open || event.button !== 0 || gesture) return;
    const start = boardPoint(event);
    const matrix = world.getScreenCTM();
    const scale = Math.hypot(matrix.a, matrix.b);
    const direct = Math.hypot(start.x - origin.x, start.y - origin.y) <= Math.max(27, 24 / scale);
    if (!direct && (start.x < rink.left || start.x > rink.right || start.y < rink.top || start.y > rink.bottom)) return;
    gesture = {id:event.pointerId, from:direct ? start : origin, flick:direct, scale, armed:false};
    court.setPointerCapture(event.pointerId);
    court.classList.toggle('swiping', direct);
    if (!direct) updateAim(event);
  });
  court.addEventListener('pointermove', event => {
    if (gesture?.id === event.pointerId) updateAim(event);
  });
  court.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    updateAim(event);
    const shoot = gesture.flick && gesture.armed;
    clearGesture();
    if (shoot) launch();
  });
  for (const name of ['pointercancel', 'lostpointercapture']) court.addEventListener(name, event => {
    if (gesture?.id === event.pointerId) clearGesture();
  });
  angle.addEventListener('input', drawGuide);
  power.addEventListener('input', drawGuide);
  flick.addEventListener('click', launch);

  function fillDialog() {
    const rules = dialogMode === 'help';
    byId('dialog-title').textContent = t(rules ? 'rules' : 'restart');
    byId('dialog-text').textContent = t(rules ? 'instructions' : 'resetQuestion');
    byId('cancel').textContent = t('cancel');
    byId('cancel').hidden = rules;
    byId('confirm').textContent = t(rules ? 'ok' : 'restart');
  }
  function showDialog(mode) {
    clearGesture();
    dialogMode = mode;
    fillDialog();
    dialog.showModal();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  byId('help').addEventListener('click', () => showDialog('help'));
  byId('reset').addEventListener('click', () => showDialog('reset'));
  byId('cancel').addEventListener('click', () => dialog.close());
  byId('confirm').addEventListener('click', () => {
    dialog.close();
    if (dialogMode === 'reset') {
      round = 0;
      points = [0, 0];
      startRound();
    }
  });
  dialog.addEventListener('close', resumeMotion);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearGesture();
      cancelAnimationFrame(raf);
      raf = lastTime = 0;
    } else resumeMotion();
  });
  window.addEventListener('boopland:languagechange', renderStatus);
  new ResizeObserver(entries => {
    clearGesture();
    const { width, height } = entries[0].contentRect;
    const portrait = height > width;
    court.setAttribute('viewBox', portrait ? '0 0 404 860' : '0 0 860 404');
    world.setAttribute('transform', portrait ? 'translate(0 860) rotate(-90)' : '');
  }).observe(byId('tabletop'));
  // Shared localization reapplies static bindings on pageshow. The launch button
  // changes meaning at the end of a match, so its label belongs to game state.
  flick.removeAttribute('data-i18n');
  startRound();
})();
