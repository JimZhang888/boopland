(() => {
  'use strict';
const DIRECTIONS = [
  { id:'up', label:'向上', short:'上', symbol:'↑', opposite:'down', key:'W / ↑' },
  { id:'left', label:'向左', short:'左', symbol:'←', opposite:'right', key:'A / ←' },
  { id:'down', label:'向下', short:'下', symbol:'↓', opposite:'up', key:'S / ↓' },
  { id:'right', label:'向右', short:'右', symbol:'→', opposite:'left', key:'D / →' }
];
const COLORS = [
  { id:'red', label:'红色', short:'红色', color:'#e45b56', opposite:'blue', key:'1' },
  { id:'blue', label:'蓝色', short:'蓝色', color:'#477ada', opposite:'red', key:'2' },
  { id:'yellow', label:'黄色', short:'黄色', color:'#edbc3d', opposite:'green', key:'3' },
  { id:'green', label:'绿色', short:'绿色', color:'#258862', opposite:'yellow', key:'4' }
];
const MODES = {direction:'方向反转', color:'颜色对调', mixed:'混合风暴'};
function newGame(mode='direction') {
  return {mode,score:0,lives:3,streak:0,maxStreak:0,correct:0,attempts:0,reactionTotal:0,remaining:60000,questionRemaining:0,questionLimit:0,current:null,level:1};
}
function nextQuestion(game, random=Math.random) {
  const type=game.mode==='mixed'?(random()<.5?'direction':'color'):game.mode;
  const items=type==='direction'?DIRECTIONS:COLORS;
  const choices=items.filter(item=>item.id!==game.current?.id);
  const chosen=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
  game.level=Math.floor(game.correct/5)+1;
  game.questionLimit=Math.max(1300,(game.mode==='mixed'?4200:4000)-(game.level-1)*250);
  game.questionRemaining=game.questionLimit;
  game.current={...chosen,type};
  return game.current;
}
function answer(game, id) {
  if(!game.current||game.lives<=0||game.remaining<=0) return null;
  game.attempts++;
  const correct=id===game.current.opposite;
  let points=0;
  if(correct){
    game.correct++;game.streak++;game.maxStreak=Math.max(game.maxStreak,game.streak);
    const multiplier=Math.min(4,1+Math.floor(game.streak/5));
    points=(100+Math.round(Math.max(0,game.questionRemaining)/game.questionLimit*50))*multiplier;
    game.score+=points;game.reactionTotal+=game.questionLimit-game.questionRemaining;
  } else {game.lives--;game.streak=0;}
  return {correct,points,expected:game.current.opposite,ended:game.lives<=0};
}
function advanceClock(game, dt, questionActive=true) {
  const elapsed=Math.max(0,dt);
  game.remaining=Math.max(0,game.remaining-elapsed);
  if(questionActive)game.questionRemaining=Math.max(0,game.questionRemaining-elapsed);
  return game.remaining===0?'time':questionActive&&game.questionRemaining===0?'question':null;
}

const api = { DIRECTIONS, COLORS, MODES, newGame, nextQuestion, answer, advanceClock };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else window.ReverseCommand = api;
})();
