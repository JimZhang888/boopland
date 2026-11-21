/* A stamp crosses exactly one street. A landmark stamp names its far end. */
window.PostRoutes = (() => {
  'use strict';
  const letters = [
    {
      nodes: {I:'post', J:'roof', F:'cross', G:'paw'}, streets:'IJ JF FG',
      stop:'G', via:['J'], steps:3
    }, {
      nodes: {E:'post', A:'tree', F:'fountain', B:'bell', C:'cross', G:'flower'},
      streets:'EA AB EF FB BC CG FG', stop:'G', via:['F','B'], last:'S', steps:4
    }, {
      nodes: {G:'post', F:'tree', B:'cross', C:'mill', E:'pier', J:'well', K:'roof'},
      streets:'EF FB BC CG FG FJ JK KG', closed:['FG'], stop:'E', via:['C'], steps:4, river:true
    }, {
      nodes: {I:'post', J:'bakery', F:'tree', G:'bell', K:'well', H:'cross', C:'fountain', D:'book', E:'roof'},
      streets:'IJ IE EF JF JK KG FG GC CD GH HD', stop:'D', via:['J','G'], steps:5
    }, {
      nodes: {I:'post', E:'tree', F:'fountain', B:'bell', C:'well', G:'pier', H:'lantern', J:'roof', K:'flower'},
      streets:'IE IJ EF JF FB BC CG FG GH JK KG', closed:['FG'], stop:'H', via:['F','C'], steps:6, river:true
    }, {
      nodes: {I:'post', E:'paw', F:'bakery', B:'bell', C:'mill', G:'pier', H:'lantern', D:'hall', J:'well', K:'flower', A:'roof'},
      streets:'IE IJ EA AB EF FB BC CG GH HD CD FG JF JK KG', closed:['FG','JK'], stop:'D', via:['E','C','H'], last:'N', steps:7, river:true
    }
  ];
  const dirs = {N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
  function grid(id) {
    const n = id.charCodeAt(0) - 65;
    return [n % 4, Math.floor(n / 4)];
  }
  function direction(a,b) {
    const [x,y] = grid(a), [nx,ny] = grid(b);
    return nx > x ? 'E' : nx < x ? 'W' : ny > y ? 'S' : 'N';
  }
  function prepare(letter) {
    const roads = letter.streets.split(' ').map(pair => ({
      from:pair[0], to:pair[1], closed:(letter.closed || []).includes(pair)
    }));
    const around = Object.fromEntries(Object.keys(letter.nodes).map(id => [id,[]]));
    for (const {from,to,closed} of roads) {
      around[from].push({to, dir:direction(from,to), closed});
      around[to].push({to:from, dir:direction(to,from), closed});
    }
    const start = Object.keys(letter.nodes).find(id => letter.nodes[id] === 'post');
    return {...letter, roads, around, start};
  }
  function resolve(level, at, token) {
    return level.around[at].find(edge => token === edge.dir || token === level.nodes[edge.to]);
  }
  function advance(level, progress, node) {
    if (level.via[progress] === node) return progress + 1;
    return progress;
  }
  // Accept every route meeting the letter, including equivalent landmark stamps.
  // A trial identifies the earliest prefix from which no legal ending exists.
  function canFinish(level, at, progress, left, cache) {
    const key = [at,progress,left].join('/');
    if (!left) return at === level.stop && progress === level.via.length;
    if (cache.has(key)) return cache.get(key);
    const possible = level.around[at].some(edge =>
      !edge.closed && (left !== 1 || !level.last || edge.dir === level.last) &&
      canFinish(level, edge.to, advance(level,progress,edge.to), left-1, cache));
    cache.set(key,possible);
    return possible;
  }
  function inspect(level, stamps) {
    let at = level.start, progress = 0;
    const trail = [at], cache = new Map();
    for (let i=0; i<stamps.length; i++) {
      const edge = resolve(level,at,stamps[i]);
      const fail = (reason, attempted) => ({ok:false,index:i,reason,trail,attempted});
      if (!edge) return fail(Object.hasOwn(dirs,stamps[i]) ? 'noRoad' : 'notNear');
      if (edge.closed) return fail('bridgeShut',edge.to);
      const left = level.steps-i-1;
      if (left < 0) return fail('noTime',edge.to);
      const next = advance(level,progress,edge.to);
      if ((!left && level.last && edge.dir !== level.last) ||
          !canFinish(level,edge.to,next,left,cache)) return fail('noTime',edge.to);
      at = edge.to;
      progress = next;
      trail.push(at);
    }
    return {ok:stamps.length === level.steps, reason:stamps.length < level.steps ? 'incomplete' : '', index:stamps.length,trail};
  }
  return {levels:letters.map(prepare),grid,dirs,inspect};
})();
