(function (root) {
  'use strict';
  const R = 58, Y = .79;
  const vertices = Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * R, Math.sin(i * Math.PI / 3) * R * Y]);
  const point = p => p.map(n => n.toFixed(2)).join(',');
  const hex = vertices.map(point).join(' ');
  const colors = { m: '#dce5bd', f: '#b5c798', v: '#e4d6b6', w: '#9ac6cd' };
  const position = (q, r) => [R * 1.5 * q, Math.sqrt(3) * R * Y * (r + q / 2)];
  function tree(x, y, s = 1, shade = 0) {
    const leaf = ['#78966a', '#91a77a', '#618773'][shade % 3];
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="3" rx="9" ry="3" fill="#587052" opacity=".12"/><path d="M0 3V-16" stroke="#72775c" stroke-width="2"/><path d="M-10-8-6-16-8-16-2-26 0-31 4-23 8-16 6-16 11-7 4-5-3-6Z" fill="${leaf}" stroke="#59765d" stroke-width=".8"/><path d="M0-26 0-8M-5-15 0-12 5-15" fill="none" stroke="#d2ddad" stroke-width=".7" opacity=".5"/></g>`;
  }
  function house(x, y, s = 1, shade = 0) {
    const roof = shade % 2 ? '#a87867' : '#bd8b74';
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="4" rx="14" ry="4" fill="#8a8265" opacity=".14"/><path d="m-11-10 14-4 9 6v13L-2 9-11 3Z" fill="#f5edd3" stroke="#8f8872" stroke-width=".8"/><path d="m-2-4 14-4v13L-2 9Z" fill="#e6dbbc"/><path d="m-14-11 8-12 14 1 7 13-17 5Z" fill="${roof}" stroke="#856b5c" stroke-width="1"/><path d="M-6-22-2-5M-10-13 8-17M-8-9 10-13" fill="none" stroke="#ead3b5" stroke-width=".6" opacity=".7"/><path d="M1 7V0l4-1v7" fill="#7c826e"/><path d="m-8-5 3 2v4l-3-2Z" fill="#9dbcc0"/><path d="M6-20v-7l3 1v9" fill="#ded2b2" stroke="#8f8872" stroke-width=".7"/></g>`;
  }
  function art(tile) {
    let out = `<polygon points="${hex}" transform="translate(0 7)" fill="#c2c6a8" stroke="#989e85" stroke-width="1"/><polygon points="${hex}" fill="${colors.m}"/>`;
    tile.edges.forEach((edge, i) => {
      if (edge === 'm' || edge === 'w') return;
      out += `<path d="M0 0 ${point(vertices[i])} ${point(vertices[(i + 1) % 6])}Z" fill="${colors[edge]}"/>`;
    });
    out += `<polygon points="${hex}" fill="url(#terrain-grain)" opacity=".32"/><polygon points="${hex}" fill="none" stroke="#939e7e" stroke-width="1.1"/>`;
    const seed = tile.variant || 0;
    for (let j = 0; j < 7; j++) {
      const x = ((seed * (j + 3) * 13) % 70) - 35, y = ((seed * (j + 8) * 7) % 44) - 22;
      out += `<path d="m${x} ${y} 2-3 1 3m2-1 2-2" fill="none" stroke="#9ba977" stroke-width=".7" opacity=".55"/>`;
    }
    if (tile.edges.includes('w')) {
      const paths = tile.edges.map((e, i) => {
        if (e !== 'w') return '';
        const a = vertices[i], b = vertices[(i + 1) % 6], x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
        return `M${x} ${y}Q${x * .35} ${y * .45 + 5} 0 0`;
      }).join(' ');
      out += `<path d="${paths}" fill="none" stroke="#e7dfbf" stroke-width="21"/><path d="${paths}" fill="none" stroke="#94bec5" stroke-width="16"/><path d="${paths}" fill="none" stroke="#c7e0de" stroke-width="1.4" stroke-dasharray="9 12"/><path d="M-8 2h9m-2 5h7" stroke="#e5eeDF" stroke-width="1.2"/>`;
      out += tree(-29, 8, .65, 1) + `<path d="m17-10 5-1-1 4-5 1Z" fill="#9aab8b"/>`;
    } else {
      const items = [];
      tile.edges.forEach((edge, i) => {
        const angle = (i + .5) * Math.PI / 3, x = Math.cos(angle) * 29, y = Math.sin(angle) * 25;
        if (edge === 'f') items.push({ y, svg: tree(x.toFixed(1), y.toFixed(1), .8 + (i % 2) * .12, i + seed) });
        if (edge === 'v' && i % 2 === 0) items.push({ y, svg: house(x.toFixed(1), y.toFixed(1), .72, i + seed) });
      });
      if (tile.type === 'forest') items.push({ y: 1, svg: tree(-1, 1, 1.15, seed) });
      if (tile.type === 'village') items.push({ y: 3, svg: house(0, 3, 1.05, seed) });
      if (tile.type === 'meadow') {
        out += `<path d="M-23-5q16-11 31 1l12 16-28 7-15-10Z" fill="#e6d69e" stroke="#bdb589" stroke-width=".7"/><path d="m-18-4 21 16m-14-21 21 17M-1-8l17 15" stroke="#c0ad78" stroke-width="1.2"/>`;
        items.push({ y: 12, svg: tree(-28, 12, .72, 1) });
        out += `<g fill="#f9f5df" stroke="#9caa86" stroke-width=".6"><ellipse cx="22" cy="-9" rx="4" ry="2.7"/><ellipse cx="30" cy="-3" rx="3.6" ry="2.4"/></g>`;
      }
      items.sort((a, b) => a.y - b.y).forEach(item => { out += item.svg; });
    }
    return out;
  }
  const defs = `<pattern id="terrain-grain" width="8" height="9" patternUnits="userSpaceOnUse"><path d="m1 3 2-1m3 5 1-1" stroke="#718161" stroke-width=".45" opacity=".4"/></pattern>`;
  function preview(tile) { return `<svg viewBox="-66 -61 132 119" aria-hidden="true"><defs>${defs}</defs>${art(tile)}</svg>`; }
  const api = { R, Y, vertices, hex, colors, position, art, defs, preview, tree, house };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HexArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
