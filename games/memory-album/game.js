(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const art = window.AlbumArt;
  const t = (key, values) => BooplandI18n.t('memoryAlbum.' + key, values);
  const board = $('board');
  const area = $('play-area');
  const pockets = $('pockets');
  const modes = [...$('modes').querySelectorAll('button')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const records = new Map();
  const flights = new Map();
  let game;
  let pending = null;

  function bestFor(count) {
    let best = records.get(count) || Infinity;
    try {
      const saved = Number(localStorage.getItem('boopland-memory-album-best-' + count));
      if (Number.isSafeInteger(saved) && saved >= count * 2) best = Math.min(best, saved);
    } catch { /* Keep session records if storage is unavailable. */ }
    return best;
  }

  function saveBest() {
    const best = Math.min(game.flips, bestFor(game.count));
    records.set(game.count, best);
    try { localStorage.setItem('boopland-memory-album-best-' + game.count, String(best)); }
    catch { /* The in-memory record still works. */ }
  }

  function shuffleDeck(count) {
    const ids = art.ids.slice(0, count);
    const deck = [...ids, ...ids];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function later(ms, callback) {
    const owner = game;
    pending = setTimeout(() => {
      if (owner !== game) return;
      pending = null;
      callback();
    }, ms);
  }

  function part(tag, className) {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }

  function imageFor(id) {
    const frame = part('span', 'image');
    frame.style.setProperty('--tone', art.color(id));
    frame.append(art.picture(id));
    return frame;
  }

  function makeCard(id, index) {
    const card = part('button', 'photo');
    card.type = 'button';
    card.dataset.index = index;
    const turn = part('span', 'turn');
    const back = part('span', 'back');
    const print = part('span', 'print');
    print.append(art.picture('back'));
    back.append(print);
    const front = part('span', 'front');
    front.append(imageFor(id));
    turn.append(back, front);
    card.append(turn);
    return card;
  }

  function fitBoard() {
    const total = board.childElementCount;
    if (!total) return;
    const { width, height } = area.getBoundingClientRect();
    if (!width || !height) return;
    const usualGap = Math.max(3, Math.min(13, Math.floor(Math.min(width, height) / 33)));
    let best;
    // Use whole rows and choose the layout with the largest legible prints.
    for (let cols = 2; cols <= Math.min(8, total); cols++) {
      if (total % cols) continue;
      const rows = total / cols;
      const gap = Math.max(3, Math.min(usualGap,
        (width - cols * 44) / (cols - 1),
        rows > 1 ? (height - rows * 44) / (rows - 1) : usualGap));
      const cellW = (width - (cols - 1) * gap) / cols;
      const cellH = (height - (rows - 1) * gap) / rows;
      const w = Math.min(cellW, cellH * 1.13);
      const h = Math.min(cellH, cellW / .77);
      const score = w * h / (1 + .26 * Math.abs(w / h - .87));
      const touchSize = Math.min(w, h) >= 44;
      if (!best || (touchSize && !best.touchSize) || (touchSize === best.touchSize && score > best.score)) {
        best = { cols, rows, w, h, gap, score, touchSize };
      }
    }
    if (!best) return;
    board.style.setProperty('--gap', best.gap + 'px');
    board.style.setProperty('--columns', best.cols);
    board.style.setProperty('--rows', best.rows);
    board.style.setProperty('--board-w', Math.floor(best.cols * best.w + (best.cols - 1) * best.gap) + 'px');
    board.style.setProperty('--board-h', Math.floor(best.rows * best.h + (best.rows - 1) * best.gap) + 'px');
  }

  function refresh() {
    const complete = game.phase === 'complete';
    $('board-title').textContent = t(complete ? 'gallery' : 'board');
    $('progress').textContent = game.collected.length + ' / ' + game.count;
    $('flips').textContent = game.flips;
    const best = bestFor(game.count);
    $('best').textContent = Number.isFinite(best) ? best : '—';
    $('message').textContent = t(game.message, { item: game.last ? t(game.last) : '', n: game.flips });
    modes.forEach(button => {
      const n = Number(button.dataset.count);
      button.textContent = t('pairs', { n });
      button.setAttribute('aria-pressed', String(n === game.count));
    });
    if (complete) {
      [...board.children].forEach((figure, i) => {
        figure.querySelector('figcaption').textContent = t(game.collected[i]);
      });
    } else {
      [...board.children].forEach((button, i) => {
        const seen = game.faceUp.includes(i);
        const stored = game.collected.includes(game.deck[i]);
        button.setAttribute('aria-label', t(stored ? 'empty' : seen ? 'open' : 'card', { n: i + 1, item: t(game.deck[i]) }));
        button.setAttribute('aria-disabled', String(stored || seen || game.phase !== 'play'));
      });
    }
  }

  function newRound(count) {
    clearTimeout(pending);
    pending = null;
    for (const [animation, node] of flights) {
      animation.cancel();
      node.remove();
    }
    flights.clear();
    game = { count, deck: shuffleDeck(count), collected: [], faceUp: [], flips: 0, phase: 'play', message: 'ready', last: null };
    pockets.style.setProperty('--count', count);
    pockets.replaceChildren(...Array.from({ length: count }, () => part('span', 'pocket')));
    board.replaceChildren(...game.deck.map(makeCard));
    refresh();
    fitBoard();
  }

  function flyToPocket(id, source, target) {
    if (reducedMotion.matches || !Element.prototype.animate) return;
    const end = target.getBoundingClientRect();
    const node = part('div', 'flying-photo');
    node.setAttribute('aria-hidden', 'true');
    node.style.cssText = 'left:' + source.left + 'px;top:' + source.top + 'px;width:' + source.width + 'px;height:' + source.height + 'px;';
    node.style.setProperty('--tone', art.color(id));
    node.append(art.picture(id));
    document.body.append(node);
    const animation = node.animate([
      { transform: 'translate(0,0) rotate(-2deg)' },
      { transform: 'translate(' + (end.left - source.left) + 'px,' + (end.top - source.top) + 'px) scale(' + end.width / source.width + ',' + end.height / source.height + ')' }
    ], { duration: 360, easing: 'cubic-bezier(.3,.05,.25,1)' });
    flights.set(animation, node);
    animation.onfinish = () => { node.remove(); flights.delete(animation); };
  }

  function showAlbum() {
    game.phase = 'complete';
    game.message = 'win';
    saveBest();
    board.replaceChildren(...game.collected.map(id => {
      const print = part('figure', 'album-print');
      print.append(imageFor(id), document.createElement('figcaption'));
      return print;
    }));
  }

  function mountPair() {
    const [a, b] = game.faceUp;
    const id = game.deck[a];
    const buttons = [board.children[a], board.children[b]];
    const source = buttons[1].getBoundingClientRect();
    const returnFocus = buttons.includes(document.activeElement);
    const target = pockets.children[game.collected.length];
    game.collected.push(id);
    game.last = id;
    game.faceUp = [];
    buttons.forEach(button => {
      button.className = 'photo mounted';
      button.disabled = true;
    });
    target.classList.add('filled');
    target.style.setProperty('--tone', art.color(id));
    target.append(art.picture(id));
    if (game.collected.length === game.count) showAlbum();
    else game.phase = 'play';
    refresh();
    fitBoard();
    flyToPocket(id, source, target);
    if (returnFocus) (board.querySelector('button:enabled') || $('new')).focus({ preventScroll: true });
  }

  function turnBack() {
    game.phase = 'closing';
    game.faceUp.forEach(i => board.children[i].classList.remove('up', 'miss'));
    later(reducedMotion.matches ? 0 : 250, () => {
      game.faceUp = [];
      game.phase = 'play';
      game.message = 'ready';
      refresh();
    });
  }

  function flip(i) {
    if (game.phase !== 'play' || game.faceUp.includes(i) || game.collected.includes(game.deck[i])) return;
    game.faceUp.push(i);
    game.flips++;
    board.children[i].classList.add('up');
    game.message = 'one';
    if (game.faceUp.length === 2) {
      game.phase = 'showing';
      const match = game.deck[game.faceUp[0]] === game.deck[i];
      game.message = match ? 'match' : 'miss';
      if (match) game.last = game.deck[i];
      game.faceUp.forEach(index => board.children[index].classList.add(match ? 'match' : 'miss'));
      later(match ? 540 : 900, match ? mountPair : turnBack);
    }
    refresh();
  }

  board.addEventListener('click', event => {
    const card = event.target.closest('button.photo');
    if (card && board.contains(card)) flip(Number(card.dataset.index));
  });
  board.addEventListener('keydown', event => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -Number(board.style.getPropertyValue('--columns')), ArrowDown: Number(board.style.getPropertyValue('--columns')) };
    if (!Object.hasOwn(steps, event.key) || !event.target.matches('button.photo')) return;
    event.preventDefault();
    let i = Number(event.target.dataset.index);
    for (i += steps[event.key]; i >= 0 && i < board.children.length; i += steps[event.key]) {
      if (!board.children[i].disabled) { board.children[i].focus(); break; }
    }
  });
  modes.forEach(button => button.addEventListener('click', () => {
    const count = Number(button.dataset.count);
    if (game.count !== count) newRound(count);
  }));
  $('new').addEventListener('click', () => newRound(game.count));
  $('help').addEventListener('click', () => $('rules').showModal());
  window.addEventListener('boopland:languagechange', () => { refresh(); fitBoard(); });
  new ResizeObserver(fitBoard).observe(area);
  newRound(6);
})();
