/* Classic script so the same rules work offline and in the regression tests. */
const PaperReversi = (() => {
  'use strict';
  const BLACK = 1, WHITE = -1, EMPTY = 0;
  const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
  const corners = [
    { square: 0, sides: [1, 8], diagonal: 9 },
    { square: 7, sides: [6, 15], diagonal: 14 },
    { square: 56, sides: [48, 57], diagonal: 49 },
    { square: 63, sides: [55, 62], diagonal: 54 }
  ];

  function captures(board, side, square) {
    if (board[square] !== EMPTY || !Number.isInteger(square)) return [];
    const flipped = [];
    const row = Math.floor(square / 8), col = square % 8;
    for (const [dy, dx] of directions) {
      let y = row + dy, x = col + dx;
      const start = flipped.length;
      while (y >= 0 && y < 8 && x >= 0 && x < 8 && board[y * 8 + x] === -side) {
        flipped.push(y * 8 + x);
        y += dy;
        x += dx;
      }
      if (y < 0 || y >= 8 || x < 0 || x >= 8 || board[y * 8 + x] !== side) {
        flipped.length = start;
      }
    }
    return flipped;
  }

  function legalMoves(board, side) {
    const moves = [];
    for (let square = 0; square < 64; square++) {
      if (board[square] !== EMPTY) continue;
      const flips = captures(board, side, square);
      if (flips.length) moves.push({ square, flips });
    }
    return moves;
  }

  function resolveTurn(board, next) {
    const moves = legalMoves(board, next);
    if (moves.length) return { board, turn: next, moves, passed: EMPTY };
    const other = legalMoves(board, -next);
    if (other.length) return { board, turn: -next, moves: other, passed: next };
    return { board, turn: EMPTY, moves: [], passed: EMPTY };
  }

  function opening() {
    const board = new Int8Array(64);
    board[27] = board[36] = WHITE;
    board[28] = board[35] = BLACK;
    return resolveTurn(board, BLACK);
  }

  function place(board, side, move) {
    const next = board.slice();
    next[move.square] = side;
    for (const square of move.flips) next[square] = side;
    return next;
  }

  function play(state, square) {
    const move = state.moves.find(candidate => candidate.square === square);
    return move ? resolveTurn(place(state.board, state.turn, move), -state.turn) : state;
  }

  function count(board) {
    let black = 0, white = 0;
    for (const disc of board) {
      if (disc === BLACK) black++;
      if (disc === WHITE) white++;
    }
    return { black, white };
  }

  // Evaluate from the perspective of the player choosing the computer move.
  function evaluate(state, perspective) {
    const board = state.board;
    const { black, white } = count(board);
    const margin = (black - white) * perspective;
    if (!state.turn) return Math.sign(margin) * 10000 + margin;

    const otherMoves = state.passed ? 0 : legalMoves(board, -state.turn).length;
    const mobility = (state.moves.length - otherMoves) * state.turn * perspective;
    let value = 8 * mobility + (black + white > 50 ? 4 : 0.5) * margin;
    for (const { square, sides, diagonal } of corners) {
      value += 155 * board[square] * perspective;
      if (board[square] === EMPTY) {
        value -= (32 * board[diagonal] + 16 * (board[sides[0]] + board[sides[1]])) * perspective;
      }
    }
    return value;
  }

  function search(state, perspective, depth, alpha, beta) {
    if (!state.turn || depth === 0) return evaluate(state, perspective);
    const maximize = state.turn === perspective;
    let best = maximize ? -Infinity : Infinity;
    for (const move of state.moves) {
      const next = resolveTurn(place(state.board, state.turn, move), -state.turn);
      const value = search(next, perspective, depth - 1, alpha, beta);
      best = maximize ? Math.max(best, value) : Math.min(best, value);
      if (maximize) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  function chooseMove(state, level, random = Math.random) {
    if (!state.moves.length) return null;
    if (level === 'easy') return state.moves[Math.floor(random() * state.moves.length)].square;
    let best = -Infinity;
    const choices = [];
    // Examine the reply, including consecutive turns after a pass. Search a
    // little further near the end, when the branching factor is smaller.
    const depth = state.board.filter(disc => disc === EMPTY).length <= 8 ? 3 : 1;
    for (const move of state.moves) {
      const next = resolveTurn(place(state.board, state.turn, move), -state.turn);
      const value = search(next, state.turn, depth, -Infinity, Infinity);
      if (value > best) {
        best = value;
        choices.length = 0;
      }
      if (value === best) choices.push(move.square);
    }
    return choices[Math.floor(random() * choices.length)];
  }

  return { BLACK, WHITE, EMPTY, captures, legalMoves, resolveTurn, opening, play, count, chooseMove };
})();
if (typeof module === 'object' && module.exports) module.exports = PaperReversi;
