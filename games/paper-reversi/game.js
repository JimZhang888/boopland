(() => {
  'use strict';
  const { BLACK, WHITE, opening, play, count, chooseMove } = PaperReversi;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('paper-reversi.' + key, values);
  const coord = n => 'ABCDEFGH'[n % 8] + (Math.floor(n / 8) + 1);
  const board = $('board');
  const guide = $('guide');
  let state = opening();
  let latest = null;
  let timer = null;
  let cursor = state.moves[0].square;

  const cells = Array.from({ length: 64 }, (_, square) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'square';
    cell.dataset.square = square;
    const disc = document.createElement('span');
    disc.className = 'stone';
    disc.setAttribute('aria-hidden', 'true');
    cell.appendChild(disc);
    board.appendChild(cell);
    return cell;
  });

  function render(move) {
    const { black, white } = count(state.board);
    const blackTurn = state.turn === BLACK;
    const legal = new Set(blackTurn ? state.moves.map(m => m.square) : []);
    $('black-score').textContent = black;
    $('white-score').textContent = white;
    const headline = blackTurn ? 'yourTurn' : state.turn === WHITE ? 'thinking'
      : black === white ? 'draw' : black > white ? 'win' : 'lose';
    const detail = !state.turn ? 'result' : state.passed === BLACK ? 'passBlack'
      : state.passed === WHITE ? 'passWhite' : blackTurn ? 'options' : 'computerHelp';
    $('status').textContent = t(headline);
    $('detail').textContent = t(detail, { n: legal.size, black, white });
    $('turn-mark').className = !state.turn ? 'end' : blackTurn ? '' : 'white';
    $('last').textContent = latest === null ? '' : t('lastMove', { pos: coord(latest) });

    // Keep a single Tab stop. An arrow-key user can still inspect every square.
    if (!board.contains(document.activeElement) && blackTurn && !legal.has(cursor)) {
      cursor = state.moves[0].square;
    }
    cells.forEach((cell, square) => {
      const side = state.board[square];
      const available = legal.has(square);
      cell.tabIndex = square === cursor ? 0 : -1;
      cell.dataset.legal = String(available);
      cell.setAttribute('aria-disabled', String(!available));
      const label = side === BLACK ? 'black' : side === WHITE ? 'white' : available ? 'legal' : 'empty';
      cell.setAttribute('aria-label', coord(square) + ' · ' + t(label));
      cell.classList.toggle('latest', square === latest);
      const disc = cell.firstElementChild;
      const color = side === BLACK ? ' dark' : side === WHITE ? ' light' : '';
      disc.className = 'stone' + color;
      if (move && (square === move.square || move.flips.includes(square))) {
        // Consecutive turns can flip the same disc, so restart its animation.
        void disc.offsetWidth;
        disc.classList.add(square === move.square ? 'placed' : 'turned');
      }
    });
  }

  function cancelComputer() {
    clearTimeout(timer);
    timer = null;
  }

  function scheduleComputer() {
    cancelComputer();
    if (state.turn !== WHITE || guide.open || document.hidden) return;
    const pending = state;
    timer = setTimeout(() => {
      timer = null;
      if (state !== pending || guide.open || document.hidden) return;
      const level = document.querySelector('input[name="level"]:checked').value;
      commit(chooseMove(state, level));
    }, 680);
  }

  function commit(square) {
    const move = state.moves.find(m => m.square === square);
    if (!move) return;
    state = play(state, square);
    latest = square;
    render(move);
    scheduleComputer();
  }

  board.addEventListener('click', event => {
    const cell = event.target.closest('.square');
    if (cell && state.turn === BLACK && !guide.open) commit(Number(cell.dataset.square));
  });
  board.addEventListener('focusin', event => {
    const cell = event.target.closest('.square');
    if (!cell) return;
    cells[cursor].tabIndex = -1;
    cursor = Number(cell.dataset.square);
    cell.tabIndex = 0;
  });
  board.addEventListener('keydown', event => {
    const row = Math.floor(cursor / 8), col = cursor % 8;
    let next;
    switch (event.key) {
      case 'ArrowLeft': next = row * 8 + Math.max(0, col - 1); break;
      case 'ArrowRight': next = row * 8 + Math.min(7, col + 1); break;
      case 'ArrowUp': next = Math.max(0, row - 1) * 8 + col; break;
      case 'ArrowDown': next = Math.min(7, row + 1) * 8 + col; break;
      case 'Home': next = row * 8; break;
      case 'End': next = row * 8 + 7; break;
      case 'Enter': case ' ':
        event.preventDefault();
        if (!event.repeat && state.turn === BLACK && !guide.open) commit(cursor);
        return;
      default: return;
    }
    event.preventDefault();
    cells[next].focus();
  });

  $('restart').addEventListener('click', () => {
    cancelComputer();
    state = opening();
    cursor = state.moves[0].square;
    latest = null;
    render();
  });
  $('help').addEventListener('click', () => {
    cancelComputer();
    guide.showModal();
  });
  guide.addEventListener('close', scheduleComputer);
  document.addEventListener('visibilitychange', scheduleComputer);
  window.addEventListener('pagehide', cancelComputer);
  window.addEventListener('pageshow', scheduleComputer);
  window.addEventListener('boopland:languagechange', () => render());
  render();
})();
