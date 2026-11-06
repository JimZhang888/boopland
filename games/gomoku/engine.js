(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Gomoku = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZE = 15;
  const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const WIN = 10000000;
  const inside = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
  const at = (r, c) => r * SIZE + c;

  function winningLine(board, index) {
    const player = board[index];
    if (!player) return [];
    const row = Math.floor(index / SIZE), col = index % SIZE;
    for (const [dr, dc] of DIRECTIONS) {
      const line = [index];
      for (const sign of [-1, 1]) {
        for (let step = 1; ; step++) {
          const r = row + dr * step * sign, c = col + dc * step * sign;
          if (!inside(r, c) || board[at(r, c)] !== player) break;
          if (sign < 0) line.unshift(at(r, c)); else line.push(at(r, c));
        }
      }
      if (line.length >= 5) return line;
    }
    return [];
  }

  function createGame() {
    return { board: new Int8Array(SIZE * SIZE), moves: [], turn: 1, winner: 0, line: [], over: false };
  }

  function play(game, index) {
    if (game.over || !Number.isInteger(index) || index < 0 || index >= SIZE * SIZE || game.board[index]) return false;
    const player = game.turn;
    game.board[index] = player;
    game.moves.push({ index, player });
    game.line = winningLine(game.board, index);
    game.winner = game.line.length ? player : 0;
    game.over = !!game.winner || game.moves.length === SIZE * SIZE;
    game.turn = 3 - player;
    return true;
  }

  // Return to the human's previous decision, including an unfinished AI reply.
  function undoTurn(game, human) {
    if (!game.moves.some(move => move.player === human)) return false;
    let move;
    do {
      move = game.moves.pop();
      game.board[move.index] = 0;
    } while (move.player !== human && game.moves.length);
    game.turn = human;
    game.winner = 0;
    game.line = [];
    game.over = false;
    return true;
  }

  function candidates(board) {
    const nearby = new Set();
    let occupied = false;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) continue;
      occupied = true;
      const r = Math.floor(i / SIZE), c = i % SIZE;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        if (inside(r + dr, c + dc) && !board[at(r + dr, c + dc)]) nearby.add(at(r + dr, c + dc));
      }
    }
    return occupied ? [...nearby] : [at(7, 7)];
  }

  // Evaluate lines through a hypothetical stone. Five-cell windows also detect
  // broken threes/fours; endpoints outside the board count as blocked.
  function pointScore(board, index, player) {
    const row = Math.floor(index / SIZE), col = index % SIZE;
    let total = 0, fours = 0, threes = 0;
    for (const [dr, dc] of DIRECTIONS) {
      let line = '';
      for (let k = -5; k <= 5; k++) {
        const r = row + dr * k, c = col + dc * k;
        line += k === 0 ? 'X' : !inside(r, c) ? '#' : board[at(r, c)] === player ? 'X' : board[at(r, c)] ? '#' : '.';
      }
      if (line.includes('XXXXX')) return WIN;
      let score = 0;
      if (line.includes('.XXXX.')) { score = 150000; fours++; }
      else {
        for (let start = 1; start <= 5; start++) {
          const window = line.slice(start, start + 5);
          if (window.includes('#')) continue;
          const stones = window.split('X').length - 1;
          if (stones === 4) score = Math.max(score, 18000);
          else if (stones === 3) score = Math.max(score, 550);
          else if (stones === 2) score = Math.max(score, 60);
        }
        if (score === 18000) fours++;
        if (['.XXX.', '.XX.X.', '.X.XX.'].some(pattern => line.includes(pattern))) {
          score = Math.max(score, 3500);
          threes++;
        }
        if (line.includes('.XX.')) score = Math.max(score, 200);
      }
      total += score;
    }
    if (fours >= 2) total += 400000;
    else if (fours && threes) total += 80000;
    else if (threes >= 2) total += 30000;
    return total;
  }

  function rankedMoves(board, player) {
    return candidates(board).map(index => {
      const attack = pointScore(board, index, player);
      const defend = pointScore(board, index, 3 - player);
      const center = 14 - Math.abs(Math.floor(index / SIZE) - 7) - Math.abs(index % SIZE - 7);
      return { index, attack, defend, score: Math.max(attack, defend * 1.08) + Math.min(attack, defend) * .35 + center };
    }).sort((a, b) => b.score - a.score || a.index - b.index);
  }

  const now = () => typeof performance === 'object' ? performance.now() : Date.now();
  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 0));

  async function chooseMove(input, player, difficulty = 'normal', options = {}) {
    const board = Int8Array.from(input);
    if (board.length !== SIZE * SIZE || ![1, 2].includes(player)) return null;
    const signal = options.signal;
    if (signal?.aborted) return null;
    const moves = rankedMoves(board, player);
    if (!moves.length) return null;
    const wins = moves.filter(move => move.attack >= WIN);
    if (wins.length) return wins[0].index;
    const blocks = moves.filter(move => move.defend >= WIN);
    const rng = options.random || Math.random;
    if (difficulty === 'easy') {
      // A casual opponent: mostly reasonable moves, with occasional missed blocks.
      if (blocks.length && rng() < .72) return blocks[0].index;
      const pool = moves.slice(0, 7);
      return pool[Math.min(pool.length - 1, Math.floor(rng() ** 1.5 * pool.length))].index;
    }
    if (blocks.length) return blocks[0].index;
    if (difficulty !== 'hard' || moves.length === 1) return moves[0].index;

    const deadline = now() + (options.budgetMs ?? 850);
    const STOP = Symbol('search stopped');
    let lastYield = now();
    async function checkpoint() {
      if (signal?.aborted || now() > deadline) throw STOP;
      if (now() - lastYield > 12) {
        await yieldUI();
        lastYield = now();
        if (signal?.aborted || now() > deadline) throw STOP;
      }
    }
    async function search(side, depth, alpha, beta, ply) {
      await checkpoint();
      const ranked = rankedMoves(board, side);
      if (!ranked.length) return 0;
      if (ranked.some(move => move.attack >= WIN)) return WIN - ply;
      const forced = ranked.filter(move => move.defend >= WIN);
      if (forced.length > 1) return -WIN + ply + 1;
      if (depth <= 0 && !forced.length) {
        // Compare both players' best threats, including combinations.
        const attacks = ranked.map(move => move.attack).sort((a, b) => b - a);
        const defenses = ranked.map(move => move.defend).sort((a, b) => b - a);
        return attacks[0] + (attacks[1] || 0) * .18 - defenses[0] * 1.12 - (defenses[1] || 0) * .18;
      }
      // Limit forced-line extension as well as the ordinary search tree.
      if (ply >= 8) return -ranked[0].defend;
      const choices = forced.length ? forced : ranked.slice(0, depth >= 2 ? 9 : 7);
      let best = -Infinity;
      for (const move of choices) {
        board[move.index] = side;
        let score;
        try { score = -await search(3 - side, depth - 1, -beta, -alpha, ply + 1); }
        finally { board[move.index] = 0; }
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break;
      }
      return best;
    }

    let bestIndex = moves[0].index;
    let ordered = moves.slice(0, 12);
    // Only commit a fully searched iteration, so a time limit cannot favor a
    // root move simply because later alternatives have not been examined.
    for (let depth = 2; depth <= 4; depth++) {
      const scored = [];
      try {
        for (const move of ordered) {
          await checkpoint();
          board[move.index] = player;
          let score;
          try { score = -await search(3 - player, depth - 1, -Infinity, Infinity, 1); }
          finally { board[move.index] = 0; }
          scored.push({ ...move, searchScore: score });
        }
      } catch (error) { if (error !== STOP) throw error; break; }
      scored.sort((a, b) => b.searchScore - a.searchScore || b.score - a.score);
      bestIndex = scored[0].index;
      ordered = scored;
      if (scored[0].searchScore >= WIN - 10) break;
    }
    return signal?.aborted ? null : bestIndex;
  }

  return Object.freeze({ SIZE, createGame, play, undoTurn, winningLine, chooseMove });
});
