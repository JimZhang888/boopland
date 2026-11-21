/* Each pair of roof ends can meet when the intervening strip is tucked away. */
const FoldCatPuzzle = (() => {
  'use strict';
  const designs = [
    { size: [5, 3], folds: ['x2'], route: '11 31 41' },
    { size: [5, 3], folds: ['x2'], route: '02 12 32 31 21' },
    { size: [5, 4], folds: ['x1', 'y2'], route: '00 20 21 22 32 42 41 31 33 43' },
    { size: [5, 4], folds: ['x1', 'x3'], route: '02 22 21 41 40 30 31' },
    { size: [5, 5], folds: ['x2', 'y2'], route: '03 13 33 31 21 22 12 11 01 00' },
    { size: [6, 5], folds: ['x2', 'y2', 'x3'], route: '00 10 40 41 51 53 43 33 23 22 32' }
  ];
  const directions = {
    N: { dx: 0, dy: -1, back: 'S' }, E: { dx: 1, dy: 0, back: 'W' },
    S: { dx: 0, dy: 1, back: 'N' }, W: { dx: -1, dy: 0, back: 'E' }
  };

  function makePage({ size, folds, route }) {
    const nodes = route.split(' ');
    const paths = new Map(nodes.map(node => [node, new Set()]));
    for (let i = 1; i < nodes.length; i++) {
      const from = nodes[i - 1], to = nodes[i];
      const dx = Math.sign(to[0] - from[0]), dy = Math.sign(to[1] - from[1]);
      const direction = Object.keys(directions).find(key => directions[key].dx === dx && directions[key].dy === dy);
      paths.get(from).add(direction);
      paths.get(to).add(directions[direction].back);
    }
    return {
      width: size[0], height: size[1], start: nodes[0], goal: nodes[nodes.length - 1], paths,
      folds: folds.map(token => ({ axis: token[0], at: Number(token[1]) }))
    };
  }

  function onStrip(fold, pos) {
    return Number(pos[fold.axis === 'x' ? 0 : 1]) === fold.at;
  }

  function nextStep(page, pos, heading, mask) {
    if (pos === page.goal) return null;
    for (const dir of page.paths.get(pos)) {
      const { dx, dy, back } = directions[dir];
      if (heading === back) continue;
      let x = Number(pos[0]), y = Number(pos[1]);
      while (true) {
        x += dx;
        y += dy;
        if (x < 0 || x >= page.width || y < 0 || y >= page.height) break;
        const to = String(x) + y;
        if (page.folds.some((f, i) => (mask & (1 << i)) && onStrip(f, to))) continue;
        if (page.paths.get(to)?.has(back)) return { pos: to, heading: dir };
        break;
      }
    }
    return null;
  }

  // A search edge includes the fold and the entire walk to the next gap.
  function hint(page, pos, heading, mask) {
    const queue = [{ pos, heading, mask, first: null }];
    const seen = new Set();
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      const key = [node.pos, node.heading, node.mask].join('/');
      if (seen.has(key)) continue;
      seen.add(key);
      if (node.pos === page.goal) return node.first;
      const withoutCrossing = [];
      page.folds.forEach((fold, id) => {
        if (onStrip(fold, node.pos)) return;
        const nextMask = node.mask ^ (1 << id);
        let end = node, step;
        while ((step = nextStep(page, end.pos, end.heading, nextMask))) end = step;
        const candidates = end.pos === node.pos ? withoutCrossing : queue;
        candidates.push({ pos: end.pos, heading: end.heading, mask: nextMask, first: node.first ?? id });
      });
      queue.push(...withoutCrossing);
    }
    return null;
  }
  return { pages: designs.map(makePage), onStrip, nextStep, hint };
})();
