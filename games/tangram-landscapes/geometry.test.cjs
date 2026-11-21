'use strict';
// Run with node geometry.test.cjs from any directory.
const assert = require('node:assert/strict');
const G = require('./geometry.js');
const scenes = require('./landscapes.js');
const near = (a,b) => Math.abs(a-b) < 1e-7;

function matchingPose(tile, id, allowFlip = true) {
  const [x,y] = G.center(tile);
  for (const flip of id === 4 && allowFlip ? [false,true] : [false]) {
    for (let turn = 0; turn < 8; turn++) {
      const pose = {id,x,y,turn,flip};
      if (G.polygon(pose).every(([a,b]) => tile.some(([u,v]) => near(a,u) && near(b,v)))) return pose;
    }
  }
}
for (const scene of scenes) {
  const poses = scene.tiles.map((tile,id) => matchingPose(tile,id));
  assert(poses.every(Boolean), scene.key+' must use the seven standard tans');
  const tiles = poses.map(G.polygon);
  const score = G.measure(scene.tiles,tiles);
  assert(near(score.coverage,1) && near(score.overlap,0) && score.won, scene.key);
  [tiles[0],tiles[1]] = [tiles[1],tiles[0]];
  [tiles[5],tiles[6]] = [tiles[6],tiles[5]];
  assert(G.measure(scene.tiles,tiles).won, scene.key+' accepts identical tans exchanged');
  tiles[0] = tiles[1];
  assert(!G.measure(scene.tiles,tiles).won, scene.key+' rejects stacked tans');
}

const pavilion = scenes.find(scene => scene.key === 'pavilion').tiles;
const alternate = pavilion.slice();
// The right-hand pillar admits either diagonal between the two small tans.
alternate[5] = [[1.85,0],[2.85,0],[2.85,1]];
alternate[6] = [[1.85,0],[2.85,1],[1.85,1]];
assert(matchingPose(alternate[5],5) && matchingPose(alternate[6],6));
assert(G.measure(pavilion,alternate).won);

const rabbit = scenes.find(scene => scene.key === 'rabbit').tiles;
const perimeter = segments => segments.reduce((n,[[x,y],[u,v]]) => n+Math.hypot(x-u,y-v),0);
// The ear and tail touch the rest only at a point. The half-unit tail uses
// one small triangle. The unit-area ear then requires one whole parallelogram.
for (const id of [4,5]) {
  const others = rabbit.filter((_,i) => i !== id);
  assert(near(perimeter(G.outline(rabbit)),perimeter(G.outline(others))+perimeter(G.edges(rabbit[id]))));
  assert(rabbit[id].some(([x,y]) => others.flatMap(G.edges).some(([[a,b],[c,d]]) =>
    near(Math.hypot(x-a,y-b)+Math.hypot(x-c,y-d),Math.hypot(c-a,d-b)))));
}
assert(!matchingPose(rabbit[4],4,false));
const ear = matchingPose(rabbit[4],4);
assert(ear.flip);
const wrongFace = rabbit.slice();
wrongFace[4] = G.polygon({...ear,flip:false});
assert(!G.measure(rabbit,wrongFace).won);

const mountain = scenes[0].tiles;
const stacked = Array.from({length:7},() => mountain[0]);
const pile = G.measure(mountain,stacked);
assert(near(pile.coverage,.25) && near(pile.overlap,.75));
const offset = (poly,dx,dy) => poly.map(([x,y]) => [x+dx,y+dy]);
assert(G.measure(mountain,mountain.map(tile => offset(tile,.001,0))).won);
const away = mountain.slice();
away[6] = offset(away[6],10,10);
assert(!G.measure(mountain,away).won);
const correction = G.alignment(offset(mountain[0],.03,-.02),G.outline(mountain),.1);
assert(near(correction.x,-.03) && near(correction.y,.02));
console.log('All eight scenes, alternate tiling, mirror requirement, snapping and area checks passed.');
