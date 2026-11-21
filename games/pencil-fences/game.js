'use strict';
(() => {
  const { build, inspect, EMPTY, FENCE, CROSS } = PencilFences;
  const $ = id => document.getElementById(id);
  const board = $('board'), dialog = $('dialog');
  const t = (key, values) => BooplandI18n.t('pencil-fences.' + key, values);
  const pad = n => String(n).padStart(2, '0');
  const storageKey = 'boopland:pencil-fences:v1';
  const ns = 'http://www.w3.org/2000/svg';
  const step = 76;
  const maps = FenceMaps.map(def => {
    const grid = build(def.clues);
    return { grid, theme: def.theme, marks: Array(grid.edges.length).fill(EMPTY), history: [] };
  });
  let current = 0, tool = FENCE, cursor = 0, panel = '';
  let edgeNodes = [], cellNodes = [], postNodes = [];
  function record(map, id, value) {
    map.history.push({ id, before: map.marks[id], value });
    map.marks[id] = value;
  }
  function clearMap(map) {
    if (!map.marks.some(mark => mark !== EMPTY)) return;
    map.history.push({ reset: map.marks.slice() });
    map.marks.fill(EMPTY);
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.moves)) return;
      for (const [i, map] of maps.entries()) {
        if (!Array.isArray(saved.moves[i])) continue;
        for (const pair of saved.moves[i]) {
          if (pair === 'clear') {
            clearMap(map);
            continue;
          }
          if (!Array.isArray(pair)) continue;
          const [id, value] = pair;
          if (Number.isInteger(id) && id >= 0 && id < map.marks.length && [EMPTY,FENCE,CROSS].includes(value) && map.marks[id] !== value) record(map, id, value);
        }
      }
      if (Number.isInteger(saved.current) && maps[saved.current]) current = saved.current;
    } catch { /* A private or full storage area still allows play. */ }
  }
  function save() {
    const moves = maps.map(map => map.history.map(move => move.reset ? 'clear' : [move.id, move.value]));
    try { localStorage.setItem(storageKey, JSON.stringify({ current, moves })); } catch { /* Session state remains in memory. */ }
  }
  function svg(tag, attrs, parent) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent.append(node);
    return node;
  }
  function xy(edge) {
    return [edge.col + (edge.horizontal ? .5 : 0), edge.row + (edge.horizontal ? 0 : .5)];
  }
  const palettes = [
    ['#e9e6c8','#e7e9d3','#f1e4c6','#dfe7cf'],
    ['#e3e9d8','#eadfbf','#e0e8d7','#eae7cd'],
    ['#e8e4c7','#e7dfc5','#e0e7cd','#eee2cd'],
    ['#eee1ba','#e5e4c8','#efdfb9','#e6e6cc'],
    ['#dce5d0','#e7e7cb','#dbe6d7','#e1e4c3'],
    ['#dfe5c9','#e8e0c3','#e1e7d2','#ece3c6']
  ];
  function buildMap() {
    const { grid, theme } = maps[current];
    const width = grid.width * step, height = grid.height * step;
    board.replaceChildren();
    board.setAttribute('viewBox', [-29,-29,width+58,height+58].join(' '));
    const land = svg('g', { 'aria-hidden': true }, board);
    // A fine paper lip frames the grid without looking like an extra playable edge.
    svg('rect', { x:-5, y:-5, width:width+10, height:height+10, fill:'#f8f5e5', stroke:'#c6c8af', 'stroke-width':1.1 }, land);
    cellNodes = grid.cells.map(({row, col, clue}, i) => {
      const x = col * step, y = row * step, cx = x + step/2, cy = y + step/2;
      const shade = (row*7 + col*3 + Math.floor((row+col)/2) + current) % 4;
      svg('rect', { x,y,width:step,height:step,fill:palettes[current][shade] },land);
      svg('rect', { x,y,width:step,height:step,fill: (i+current)%3 ? 'url(#stubble)' : 'url(#furrow)' },land);
      if (clue === null) {
        // Small crop sketches are confined to unnumbered plots.
        svg('use', { href:'#crop-'+theme, x:cx-21, y:cy-18, width:42, height:36, opacity:.73, transform:'rotate('+ ((row+col)%2 ? -7 : 4) +' '+cx+' '+cy+')' },land);
        return null;
      }
      const circle = svg('ellipse', { cx,cy:cy+1,rx:21,ry:23,fill:'none',stroke:'#a05f48','stroke-width':1.8,'stroke-dasharray':'6 2',visibility:'hidden' },land);
      const number = svg('text', { x:cx,y:cy,class:'plot-num' },land);
      number.textContent = clue;
      return { circle, number };
    });
    for (let col=0; col<grid.width; col++) {
      svg('text',{ x:(col+.5)*step, y:-15, class:'plot-letter' }, land).textContent = String.fromCharCode(65+col);
    }
    for (let row=0; row<grid.height; row++) {
      svg('text',{ x:-15, y:(row+.5)*step, class:'plot-letter' }, land).textContent = row+1;
    }
    const gaps = svg('g', { 'aria-hidden':true, fill:'none', stroke:'#949a7e', 'stroke-width':1.45, 'stroke-dasharray':'3 4.8','stroke-linecap':'round' }, board);
    const edges = svg('g', {}, board);
    edgeNodes = grid.edges.map((edge, id) => {
      const { horizontal, col, row } = edge, x=col*step, y=row*step;
      const transform='translate('+x+' '+y+')'+(horizontal ? '' : ' rotate(90)');
      svg('path',{ d:'M0 0H76',transform },gaps);
      const group=svg('g',{ class:'edge-button', role:'button', tabindex:id===cursor?0:-1, 'data-edge':id, transform },edges);
      svg('path',{ d:'M4 0h68',class:'edge-focus' },group);
      const ink=svg('g',{ fill:'none', 'stroke-linecap':'round', 'pointer-events':'none' },group);
      const line=svg('path',{ d:'M.6 .4Q23 -.6 39 .2T75.5 -.1','stroke-width':4.6 },ink);
      svg('path',{ d:'M4 -.8q13 -.9 24 -.2m8 .4 20-.5m6 .2h10',stroke:'#c6d2b1','stroke-width':.65, opacity:.59 },ink);
      const cross=svg('path',{ d:'m33 -6 10.3 11.4m-.6-12.1L32.6 5.8', fill:'none', stroke:'#9b6550','stroke-width':2.8,'stroke-linecap':'round' },group);
      svg('path',{ d:'M1 0 26 -25H50L75 0 50 25H26Z',class:'hit' },group);
      const nearby = grid.cells.filter(cell => cell.edges.includes(id) && cell.clue !== null).map(cell=>cell.clue).join(', ') || '–';
      return { group, ink, line, cross, nearby };
    });
    const pins = svg('g',{ 'aria-hidden':true,'pointer-events':'none' },board);
    postNodes = grid.vertices.map((_,v) => {
      const x = v % (grid.width+1)*step, y = Math.floor(v/(grid.width+1))*step;
      const ring=svg('circle',{cx:x,cy:y,r:7.2,fill:'#f8e6cf',stroke:'#a05a45','stroke-width':1.7},pins);
      svg('path',{ d:'M-2.7-1.8q1.7-2.7 4.4-.9 2.4 2 .8 4.3-2.6 2.2-4.7-.1Z',transform:'translate('+x+' '+y+')',fill:'#53654e',stroke:'#4b5545','stroke-width':.65 },pins);
      return ring;
    });
    draw();
  }
  function draw() {
    const map = maps[current], {grid,marks} = map;
    const result = inspect(grid, marks);
    $('sheet-no').textContent = t('sheet',{ n:pad(current+1),w:grid.width,h:grid.height });
    $('map-name').textContent = t('map'+(current+1));
    $('fraction').textContent = result.matched+' / '+result.clues;
    $('meter-fill').style.width = (100*result.matched/result.clues)+'%';
    cellNodes.forEach((node,id) => {
      if (!node) return;
      const cell=grid.cells[id], bad=result.badCells.has(id);
      const matched=cell.edges.filter(e=>marks[e]===FENCE).length===cell.clue;
      node.number.setAttribute('class','plot-num'+(bad?' problem':matched?' matched':''));
      node.circle.setAttribute('visibility',bad?'visible':'hidden');
    });
    edgeNodes.forEach(({group,ink,line,cross,nearby},id) => {
      const edge=grid.edges[id], mark=marks[id], bad=result.badEdges.has(id);
      ink.setAttribute('visibility',mark===FENCE?'visible':'hidden');
      line.setAttribute('stroke',bad?'#a06048':'#465f48');
      line.setAttribute('stroke-dasharray',bad?'10 2':'none');
      cross.setAttribute('visibility',mark===CROSS?'visible':'hidden');
      group.setAttribute('aria-label',t('edge',{dir:t(edge.horizontal?'horizontal':'vertical'),r:edge.row+1,c:edge.col+1,state:t(['blank','fence','cross'][mark]),clues:nearby}));
    });
    postNodes.forEach((node,id)=>node.setAttribute('visibility',result.badVertices.has(id)?'visible':'hidden'));
    const issues = result.issues;
    const issue = ['branch','separate','tooMany','tooFew','deadEnd','early'].find(key=>issues.has(key));
    const allDone = result.solved && maps.every(m=>m===map || inspect(m.grid,m.marks).solved);
    const status = result.solved ? (allDone?'all':'win') : issue || (marks.some(mark => mark !== EMPTY) ? 'playing' : 'start');
    const statusBar=$('status-text').parentElement;
    statusBar.classList.toggle('warn',!!issue);
    statusBar.classList.toggle('success',result.solved);
    if ($('status-text').textContent !== t(status)) $('status-text').textContent=t(status);
    $('status-icon').setAttribute('href',result.solved?'#i-check':issue?'#i-note':'#i-fence');
    $('next').hidden=!result.solved;
    $('next').firstElementChild.textContent=t(current===maps.length-1?'maps':'next');
    $('undo').disabled=!map.history.length;
    document.querySelectorAll('[data-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(Number(btn.dataset.tool)===tool)));
  }
  function write(id, selected) {
    const map=maps[current], old=map.marks[id], value=old===selected?EMPTY:selected;
    if (old===value) return;
    record(map,id,value);
    save();
    draw();
  }
  function undo() {
    const map=maps[current], last=map.history.pop();
    if (!last) return;
    if (last.reset) map.marks = last.reset;
    else map.marks[last.id] = last.before;
    save();
    draw();
  }
  function setCursor(id, focus=false) {
    edgeNodes[cursor].group.tabIndex=-1;
    cursor=id;
    edgeNodes[cursor].group.tabIndex=0;
    if (focus) edgeNodes[cursor].group.focus({preventScroll:true});
  }
  function switchMap(id) {
    current=id; cursor=0;
    save();
    buildMap();
  }
  function moveCursor(key) {
    const edges=maps[current].grid.edges;
    const [x,y]=xy(edges[cursor]);
    const dy=key==='ArrowDown'?.5:key==='ArrowUp'?-.5:0, dx=key==='ArrowRight'?1:-1;
    let best=cursor, distance=Infinity;
    edges.forEach((edge,i)=>{
      const [cx,cy]=xy(edge);
      if (cy!==y+dy || (!dy && (cx-x)*dx<=0)) return;
      if (Math.abs(cx-x)<distance) { distance=Math.abs(cx-x); best=i; }
    });
    setCursor(best,true);
  }

  function renderPanel() {
    $('dialog-title').textContent=t(panel==='maps'?'maps':'help');
    $('map-list').hidden=panel!=='maps';
    $('reset').hidden = panel !== 'maps' || !maps[current].marks.some(mark => mark !== EMPTY);
    $('guide').hidden=panel!=='help';
    if (panel!=='maps') return;
    const list=$('map-list');
    list.replaceChildren();
    maps.forEach((map,i)=>{
      const button=document.createElement('button');
      button.className='map-choice'+(i===current?' current':'');
      button.dataset.map=i;
      if(i===current) button.setAttribute('aria-current','true');
      const num=document.createElement('b'), label=document.createElement('strong'), size=document.createElement('small');
      num.textContent=pad(i+1);
      label.textContent=t('map'+(i+1));
      size.textContent=map.grid.width+' × '+map.grid.height;
      button.append(num,label,size);
      if(inspect(map.grid,map.marks).solved) {
        const check=svg('svg',{class:'icon',role:'img','aria-label':t('win')},button);
        svg('use',{href:'#i-check'},check);
      }
      list.append(button);
    });
  }
  function openPanel(which) {
    panel=which; renderPanel(); dialog.showModal();
    (which==='maps'?$('map-list').querySelector('.current'):$('close')).focus();
  }
  $('help').addEventListener('click',()=>openPanel('help'));
  $('maps').addEventListener('click',()=>openPanel('maps'));
  $('close').addEventListener('click',()=>dialog.close());
  $('reset').addEventListener('click',()=>{
    clearMap(maps[current]);
    dialog.close();
    save();
    draw();
  });
  dialog.addEventListener('close',()=>{panel='';});
  dialog.addEventListener('click',event=>{ if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();} });
  $('map-list').addEventListener('click',event=>{
    const choice=event.target.closest('[data-map]');
    if(choice){dialog.close();switchMap(Number(choice.dataset.map));}
  });
  $('next').addEventListener('click',()=>{
    if(current===maps.length-1)openPanel('maps');
    else {switchMap(current+1);$('maps').focus();}
  });
  $('undo').addEventListener('click',undo);
  function selectTool(value) { tool=value; draw(); }
  document.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>selectTool(Number(btn.dataset.tool))));
  board.addEventListener('focusin',e=>{ const node=e.target.closest('[data-edge]'); if(node)setCursor(Number(node.dataset.edge)); });
  board.addEventListener('click',e=>{
    const node=e.target.closest('[data-edge]');
    if(node){setCursor(Number(node.dataset.edge));write(cursor,tool);}
  });
  board.addEventListener('contextmenu',e=>{
    const node=e.target.closest('[data-edge]');
    if(node){e.preventDefault();setCursor(Number(node.dataset.edge));write(cursor,CROSS);}
  });
  document.addEventListener('keydown',e=>{
    if(dialog.open || e.altKey) return;
    const key=e.key.toLowerCase();
    if(key==='z' && !e.shiftKey){ e.preventDefault(); if(!e.repeat)undo(); return; }
    if(e.ctrlKey || e.metaKey) return;
    if(['1','2','3'].includes(key)){selectTool([FENCE,CROSS,EMPTY][Number(key)-1]);return;}
    if(!e.target.closest('[data-edge]')) return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();moveCursor(e.key);}
    else if(key===' '||key==='enter'){e.preventDefault();if(!e.repeat)write(cursor,tool);}
  });
  window.addEventListener('boopland:languagechange',()=>{draw();if(dialog.open)renderPanel();});
  restore();
  buildMap();
})();

