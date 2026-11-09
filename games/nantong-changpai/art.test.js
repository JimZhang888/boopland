'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Art = require('./art.js');
const count = (svg, kind) => (svg.match(new RegExp('data-pip="'+kind+'"', 'g')) || []).length;

test('五万的内框是五个清晰白点，三饼是三个完整圆钱', () => {
  const five = Art.card(4), three = Art.card(20);
  assert.equal(count(five, 'dot'), 5);
  assert.equal((three.match(/data-shape="round"/g) || []).length, 3);
  assert.equal(count(three, 'coin'), 3);
  assert.equal((three.match(/data-shape="half"/g) || []).length, 0);
  const inner = five.slice(five.indexOf('<g data-body="myriad">'));
  assert.doesNotMatch(inner, /<path\b/); // Dots, not a portrait in this frame.
});

test('二至九万的实际圆点数匹配牌值，圆点不重叠且完整落在内框', () => {
  for (let rank = 2; rank <= 9; rank++) {
    const svg = Art.card(rank - 1);
    const dots = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" data-pip="dot"/g)].map(m => m.slice(1).map(Number));
    assert.equal(dots.length, rank, rank+'万');
    for (const [x,y,r] of dots) {
      assert.ok(r >= 3.8, 'Dots must remain larger than the former tiny label dots');
      assert.ok(x-r > 12 && x+r < 48 && y-r > 126 && y+r < 246);
    }
    dots.forEach(([x,y,r], i) => dots.slice(i+1).forEach(([a,b,s]) => {
      assert.ok(Math.hypot(a-x,b-y) >= r+s+1, 'Dots must be separately countable');
    }));
  }
});

test('二至九条各有对应数量的独立束索，每条完整落在内框', () => {
  for (let rank = 2; rank <= 9; rank++) {
    const svg = Art.card(8 + rank);
    const cords = [...svg.matchAll(/<g data-pip="cord" transform="translate\(([\d.]+) ([\d.]+)\) rotate\(([-\d.]+)\)"><path d="M0 (-[\d.]+)L4 /g)];
    assert.equal(cords.length, rank, rank+'条');
    assert.equal(new Set(cords.map(m => m[1]+','+m[2])).size, rank);
    for (const m of cords) {
      const x=+m[1], y=+m[2], angle=+m[3]*Math.PI/180, h=-m[4];
      const dx=Math.abs(4*Math.cos(angle))+Math.abs(h*Math.sin(angle));
      const dy=Math.abs(4*Math.sin(angle))+Math.abs(h*Math.cos(angle));
      assert.ok(x-dx >= 12 && x+dx <= 48 && y-dy >= 126 && y+dy <= 246, rank+'条 has a clipped cord');
    }
  }
});

test('条牌按牌样的束索排列区分，不把双束或多束当成一条', () => {
  const expectedRows = {3:[1,2],4:[2,2],5:[1,2,2],6:[2,2,2],7:[1,2,2,2],8:[2,2,2,2],9:[3,3,3]};
  for (const [rank, expected] of Object.entries(expectedRows)) {
    const rows = new Map();
    for (const m of Art.card(8 + Number(rank)).matchAll(/data-pip="cord" transform="translate\([\d.]+ ([\d.]+)\)/g)) rows.set(+m[1], (rows.get(+m[1]) || 0)+1);
    assert.deepEqual([...rows.values()], expected, rank+'条');
  }
});

test('一至八饼的古钱、整圆与半圆数量正确，一饼不再画两个古钱', () => {
  const expected = [null,[1,0,0],[2,0,0],[0,3,0],[0,2,2],[0,1,4],[0,0,6],[0,3,4],[0,0,8]];
  for (let rank=1; rank<=8; rank++) {
    const svg=Art.card(17+rank);
    const shapes=['ancient','round','half'].map(shape => (svg.match(new RegExp('data-shape="'+shape+'"','g')) || []).length);
    assert.equal(count(svg,'coin'), rank, rank+'饼');
    assert.deepEqual(shapes, expected[rank], rank+'饼');
  }
});

test('一万、一条、九饼及花牌明确保留特殊纹样，不伪造普通点数', () => {
  assert.match(Art.card(0), /data-special="red-myriad"/);
  assert.match(Art.card(9), /data-special="red-string"/);
  assert.match(Art.card(26), /data-special="red-coins"/);
  assert.equal((Art.card(26).match(/data-red-motif="coin"/g) || []).length,3);
  for (const id of [0,9,26,27,28,29]) assert.doesNotMatch(Art.card(id), /data-pip=/);
});

test('整副三十种牌均不同，牌面没有文字、数字标签或外部图片', () => {
  const faces=Array.from({length:30},(_,i)=>Art.card(i));
  assert.equal(new Set(faces).size,30);
  for (const face of faces) {
    assert.doesNotMatch(face, /<text\b|<image\b|NaN|undefined/);
    assert.match(face, /viewBox="0 0 60 280"/);
  }
});
