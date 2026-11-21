/* All positions and completed moves are public. A draft never enters this engine. */
(function (root) {
  'use strict';
  const MOVES = Object.freeze(['advance', 'retreat', 'thrust', 'guard']);
  const RIVALS = Object.freeze(['pine', 'rain', 'swallow']);
  const MAX_ROUNDS = 6;
  const initial = () => ({ player: 1, rival: 3, playerHP: 3, rivalHP: 3, initiative: null, round: 1 });
  const step = move => move === 'advance' ? 1 : move === 'retreat' ? -1 : 0;
  const onBridge = value => Math.max(0, Math.min(4, value));

  function resolveBeat(board, playerMove, rivalMove) {
    let player = onBridge(board.player + step(playerMove));
    let rival = onBridge(board.rival - step(rivalMove));
    const clash = player >= rival;
    if (clash) {
      player = board.player;
      rival = board.rival;
    }
    const inReach = rival - player === 1;
    function result(side, move, other, shifted) {
      if (move === 'thrust') {
        if (!inReach) return 'miss';
        if (other === 'guard') return 'parried';
        if (board.initiative === side) return 'riposte';
        if (board.initiative && other === 'thrust') return 'interrupted';
        return 'hit';
      }
      if (move === 'guard') return inReach && other === 'thrust' ? 'block' : 'ready';
      if (clash) return 'clash';
      return shifted ? 'step' : 'edge';
    }
    const playerResult = result('player', playerMove, rivalMove, player !== board.player);
    const rivalResult = result('rival', rivalMove, playerMove, rival !== board.rival);
    const initiative = playerResult === 'block' ? 'player' : rivalResult === 'block' ? 'rival' : null;
    return {
      board: { ...board, player, rival, initiative,
        playerHP: board.playerHP - Number(rivalResult === 'hit' || rivalResult === 'riposte'),
        rivalHP: board.rivalHP - Number(playerResult === 'hit' || playerResult === 'riposte') },
      playerMove, rivalMove, playerResult, rivalResult
    };
  }

  function verdict(board, completedBeats) {
    if (board.playerHP > 0 && board.rivalHP > 0 &&
        (board.round < MAX_ROUNDS || completedBeats < 3)) return null;
    return board.playerHP === board.rivalHP ? 'draw' : board.playerHP > board.rivalHP ? 'win' : 'loss';
  }

  /* Rehearse against a forecast from the last visible exchange. Resolve each
     imagined beat on a copy, then seal the complete script before input. */
  function planRival(style, board, previousPlayer = []) {
    let forecast = board;
    const script = [];
    for (let beat = 0; beat < 3; beat++) {
      const expected = previousPlayer[beat] || 'thrust';
      const distance = forecast.rival - forecast.player;
      let move;
      if (distance === 1 && expected === 'thrust') {
        move = forecast.initiative === 'rival' ? 'thrust' : 'guard';
      } else if (style === 'pine') {
        move = distance > 1 ? 'advance' : 'thrust';
        if (distance === 2 && expected === 'advance' && beat > 0) move = 'thrust';
      } else if (style === 'rain') {
        if (beat === 0 && distance <= 2) move = 'guard';
        else if (distance <= 1 || (distance === 2 && expected === 'advance')) move = 'thrust';
        else move = 'advance';
      } else {
        if (beat === 0 && distance <= 2 && forecast.rival < 4) move = 'retreat';
        else if (distance === 1 || (distance === 2 && expected === 'advance')) move = 'thrust';
        else move = 'advance';
      }
      script.push(move);
      forecast = resolveBeat(forecast, expected, move).board;
    }
    return Object.freeze(script);
  }

  const api = Object.freeze({ MOVES, RIVALS, MAX_ROUNDS, initial, resolveBeat, verdict, planRival });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BridgeDuel = api;
})(globalThis);

