const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PaperSnake, SPEEDS } = require('./engine.js');

test('eating grows by one, scores ten, and never places food on the snake', () => {
  const game = new PaperSnake(() => .5);
  game.start(); game.food = { x: 11, y: 10 };
  assert.equal(game.step(), 'eat');
  assert.equal(game.score, 10); assert.equal(game.snake.length, 4);
  assert.ok(!game.snake.some(p => p.x === game.food.x && p.y === game.food.y));
});
test('queued turns prevent reversal, including two keys between ticks', () => {
  const game = new PaperSnake(); game.start();
  assert.equal(game.turn('left'), false);
  assert.equal(game.turn('up'), true);
  assert.equal(game.turn('down'), false);
  assert.equal(game.turn('left'), true);
  assert.equal(game.turn('down'), false); // Queue limit: two deliberate turns.
  game.step(); assert.deepEqual(game.snake[0], { x: 10, y: 9 });
  game.step(); assert.deepEqual(game.snake[0], { x: 9, y: 9 });
});
test('wall and self collisions end the round without adding invalid cells', () => {
  const game = new PaperSnake(); game.start(); game.snake = [{x:19,y:10},{x:18,y:10},{x:17,y:10}];
  const before = JSON.stringify(game.snake);
  assert.equal(game.step(), 'over'); assert.equal(game.reason, 'wall');
  assert.equal(JSON.stringify(game.snake), before);
  game.start();game.snake=[{x:2,y:2},{x:2,y:1},{x:3,y:1},{x:3,y:2},{x:4,y:2}];
  game.food={x:0,y:0};assert.equal(game.step(),'over');assert.equal(game.reason,'self');
});
test('moving into the departing tail is legal', () => {
  const game = new PaperSnake();game.start();
  game.snake=[{x:2,y:2},{x:2,y:1},{x:3,y:1},{x:3,y:2}];game.food={x:0,y:0};
  assert.equal(game.step(),'move');assert.equal(game.status,'playing');
  assert.deepEqual(game.snake[0],{x:3,y:2});
});
test('last free cell yields a win without an endless food search', () => {
  const game = new PaperSnake(() => 0,4);game.start();
  game.snake=[{x:2,y:0},{x:1,y:0},{x:0,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:3,y:2},{x:2,y:2},{x:1,y:2},{x:0,y:2},{x:0,y:3},{x:1,y:3},{x:2,y:3},{x:3,y:3}];
  game.food={x:3,y:0};assert.equal(game.step(),'won');
  assert.equal(game.snake.length,16);assert.equal(game.food,null);assert.equal(game.status,'won');
});
test('pause freezes state and resume discards accumulated time and turns', () => {
  const game = new PaperSnake();game.start();game.advance(120);game.turn('up');game.pause();
  const before=JSON.stringify(game.snake);
  assert.deepEqual(game.advance(100000),[]);assert.equal(game.step(),null);assert.equal(game.turn('down'),false);
  assert.equal(JSON.stringify(game.snake),before);game.resume();
  assert.deepEqual(game.advance(100),[]);assert.equal(game.queue.length,0);
  game.advance(40);assert.deepEqual(game.snake[0],{x:11,y:10});
});
test('each pace is fixed and a stalled frame moves at most one cell', () => {
  for(const [speed,period] of Object.entries(SPEEDS)) {
    const game=new PaperSnake();game.start(speed);assert.deepEqual(game.advance(period-1),[]);
    assert.equal(game.advance(1).length,1);const x=game.snake[0].x;
    assert.equal(game.advance(5000).length,1);assert.equal(game.snake[0].x,x+1);
  }
});
test('restart clears score, queued input and terminal states', () => {
  const game=new PaperSnake();game.start('fast');game.food={x:11,y:10};game.step();game.turn('down');game.reset();
  assert.equal(game.status,'ready');assert.equal(game.score,0);assert.equal(game.snake.length,3);assert.deepEqual(game.queue,[]);
  game.start('invalid');assert.equal(game.speed,'normal');assert.equal(game.status,'playing');
});
