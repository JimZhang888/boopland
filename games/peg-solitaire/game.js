(() => {
  'use strict';
  const { boards, legal, jump, remaining, search, coordinate } = PegPuzzles;
  const $ = id => document.getElementById(id);
  const t = (key, values) => BooplandI18n.t('peg.' + key, values);
  const pad = n => String(n).padStart(2, '0');
  const spacing = 44;
  const position = cell => [cell.col * spacing, cell.row * spacing];
  let index = 0, board, state, history, selected, hint, focusId, feedback, landed;
  let finder = null, pending = 0;
  let solved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem('boopland-peg-solved'));
    if (Array.isArray(stored)) solved = new Set(stored.filter(x => Number.isInteger(x) && boards[x]));
  } catch { /* Private browsing still supports the full game. */ }

  function say(key, values = {}) { feedback = { key, values }; }
  function stopSearch() {
    clearTimeout(pending);
    finder = null;
  }

  function outline(widths) {
    const rows = widths.map((w, r) => ({ w, r })).filter(row => row.w);
    const right = [], left = [];
    for (const { w, r } of rows) {
      const x = 3 * spacing, y = r * spacing;
      for (const [points, sign] of [[right, 1], [left, -1]]) {
        const edge = x + sign * w * spacing / 2;
        points.push([edge, y - spacing / 2], [edge, y + spacing / 2]);
      }
    }
    const full = right.concat(left.reverse());
    const corners = full.filter((p,i) => !(p[0] === full[(i+1)%full.length][0] && p[1] === full[(i+1)%full.length][1]));
    const points = corners.filter((p,i) => {
      const a = corners[(i + corners.length-1) % corners.length], b = corners[(i+1) % corners.length];
      return (a[0]-p[0]) * (b[1]-p[1]) !== (b[0]-p[0]) * (a[1]-p[1]);
    });
    const near = (p,q) => [p[0]+Math.sign(q[0]-p[0])*6,p[1]+Math.sign(q[1]-p[1])*6];
    return points.map((p,i) => {
      const a=near(p,points[(i+points.length-1)%points.length]), b=near(p,points[(i+1)%points.length]);
      return (i ? 'L' : 'M') + a + 'Q' + p + ' ' + b;
    }).join('')+'Z';
  }

  function drawBoard() {
    const first = board.cells[0].row, last = 6 - first;
    const low = first*spacing-47, size = (last-first)*spacing+87;
    $('board').setAttribute('viewBox', [low,low,size,size].join(' '));
    const path = outline(board.widths);
    let axes = '';
    for (let i=first;i<=last;i++) {
      axes += '<text x="'+(i*spacing)+'" y="'+(low+15)+'">'+String.fromCharCode(65+i)+'</text>';
      axes += '<text x="'+(low+12)+'" y="'+(i*spacing+4)+'">'+(i+1)+'</text>';
    }
    $('geometry').innerHTML =
      '<g class="axes" aria-hidden="true" text-anchor="middle" fill="#59604e" font-family="Georgia,serif" font-size="11" font-style="italic">'+axes+'</g>'+
      '<path d="'+path+'" transform="translate(1.6 4.1)" fill="#d0c7a8" stroke="#a99e7d" stroke-width="1.3"/>'+
      '<path d="'+path+'" transform="translate(1 3.8)" fill="url(#hatch)"/>'+
      '<path d="'+path+'" fill="#e5dbbd" stroke="#736f54" stroke-width="1.65"/>'+
      '<path d="'+path+'" fill="url(#fibres)"/>'+
      '<path d="'+path+'" transform="translate(132 132) scale(.976) translate(-132 -132)" fill="none" stroke="#ada482" stroke-width=".85"/>';
    $('holes').innerHTML = board.cells.map(cell => {
      const [x,y]=position(cell);
      const angle = (cell.row * 17 + cell.col * 13) % 43 - 21;
      return '<g class="hole" role="button" tabindex="-1" data-cell="'+cell.name+'" transform="translate('+x+' '+y+')">'+
        '<rect x="-22" y="-22" width="44" height="44" fill="transparent"/><use href="#well"/>'+
        '<g class="piece"><use href="#pea" transform="rotate('+angle+')"/></g>'+
        '<circle class="selection-ring" r="18.2"/><circle class="target-ring" r="14"/>'+
        '<rect class="focus-ring" x="-20.5" y="-20.5" width="41" height="41" rx="7"/></g>';
    }).join('');
  }

  const levels = $('levels');
  boards.forEach((item,i) => {
    const button=document.createElement('button');
    button.type='button';
    button.className='level';
    button.dataset.level=String(i);
    const dots=item.cells.map(cell => '<circle cx="'+cell.col*4+'" cy="'+cell.row*4+
      '" r="'+(item.initial & cell.bit ? 1.75 : 1.2)+'" fill="'+(item.initial & cell.bit ? '#647c57' : '#c0c5b2')+'"/>').join('');
    button.innerHTML='<svg class="mini" viewBox="-3 -3 30 30" aria-hidden="true">'+dots+'</svg>'+
      '<span class="level-num">'+pad(i+1)+'</span><span class="level-name"></span>'+
      '<svg class="icon check" aria-hidden="true"><use href="#i-tick"/></svg><span class="level-cost"></span>';
    button.addEventListener('click', () => { if (i !== index) begin(i); });
    levels.append(button);
  });

  function drawArrow() {
    const layer=$('instruction');
    if (!hint) { layer.replaceChildren(); return; }
    const [x,y]=position(hint.from), [tx,ty]=position(hint.to);
    const dx=(tx-x)/(spacing*2), dy=(ty-y)/(spacing*2);
    const side=dy ? 1 : -1;
    const ox=-dy*side, oy=dx*side;
    const start=[x+dx*14+ox*12,y+dy*14+oy*12];
    const end=[tx-dx*12+ox*10,ty-dy*12+oy*10];
    const control=[(x+tx)/2+ox*33,(y+ty)/2+oy*33];
    layer.innerHTML='<path d="M'+start+'Q'+control+' '+end+'" fill="none" stroke="#7c5039" stroke-width="2.3" stroke-linecap="round" stroke-dasharray="4 4" marker-end="url(#tip)"/>';
  }

  function render() {
    const moves=board.jumps.filter(m => legal(state,m));
    const count=remaining(state), won=count===1, stuck=!moves.length && !won;
    const destinations=new Set(moves.filter(m => m.from.name===selected).map(m => m.to.name));
    $('count').textContent=pad(count);
    $('steps').textContent=pad(history.length);
    $('levelName').textContent=t('l'+index);
    $('index').textContent=pad(index+1)+' / 05';
    for (const el of $('holes').children) {
      const name=el.dataset.cell, occupied=Boolean(state & board.byName.get(name).bit), target=destinations.has(name);
      el.classList.toggle('selected', selected===name);
      el.classList.toggle('target', target);
      el.classList.toggle('landed', name===landed);
      el.querySelector('.piece').style.display=occupied ? '' : 'none';
      el.setAttribute('tabindex', name===focusId ? '0' : '-1');
      el.setAttribute('aria-pressed', selected===name ? 'true' : 'false');
      el.setAttribute('aria-label', t(target ? 'target' : occupied ? 'seed' : 'empty',{at:name}));
    }
    drawArrow();
    for (const el of levels.children) {
      const i=Number(el.dataset.level), name=t('l'+i), length=t('length',{n:boards[i].route.length});
      el.setAttribute('aria-pressed', i===index ? 'true':'false');
      el.classList.toggle('done',solved.has(i));
      el.querySelector('.level-name').textContent=name;
      el.querySelector('.level-cost').textContent=length;
      el.title=name+' · '+length+(solved.has(i) ? ' · '+t('done') : '');
      el.setAttribute('aria-label',el.title);
    }
    $('undo').disabled=history.length===0;
    $('hint').disabled=(!won && stuck) || Boolean(finder);
    $('actionLabel').textContent=t(won ? (index===boards.length-1 ? 'l0' : 'next') : 'hint');
    $('actionIcon').setAttribute('href',won ? '#i-next' : '#i-hint');
    $('stateIcon').setAttribute('href', won ? '#i-tick' : '#i-note');
    $('board').closest('.plate').dataset.state=won?'won':stuck?'stuck':'playing';
    $('message').textContent=won ? t('won',{n:history.length}) : stuck ? t('stuck',{n:count}) : t(feedback.key,feedback.values);
  }

  function begin(i) {
    stopSearch();
    index=i; board=boards[i]; state=board.initial; history=[];
    hint=null; selected=null; landed=null;
    focusId=board.route[0].from.name;
    say('ready'); drawBoard(); render();
  }

  function play(name) {
    if (remaining(state)===1 || !board.jumps.some(m=>legal(state,m))) return;
    stopSearch();
    focusId=name; landed=null;
    const dest=board.byName.get(name);
    if (state & dest.bit) {
      const old=board.byName.get(selected);
      const attempting=old && ((old.row===dest.row && Math.abs(old.col-dest.col)===2) || (old.col===dest.col && Math.abs(old.row-dest.row)===2));
      if (hint?.from.name!==name) hint=null;
      selected=name;
      const mobile=board.jumps.some(m=>m.from===dest && legal(state,m));
      if (hint) say('suggested',{a:hint.from.name,m:hint.over.name,b:hint.to.name});
      else say(attempting?'occupied':mobile?'selected':'still',{at:name});
    } else if (selected) {
      const next=jump(board,state,selected,name);
      if (next===state) say('invalid');
      else {
        history.push(state);
        state=next; landed=name;
        say('moved',{a:selected,b:name});
        selected=null; hint=null;
        if (remaining(state)===1) {
          solved.add(index);
          try { localStorage.setItem('boopland-peg-solved',JSON.stringify([...solved])); } catch { /* optional */ }
        }
      }
    } else say('ready');
    render();
  }

  function showHint(move) {
    finder=null;
    if (move) {
      hint=move; selected=move.from.name; focusId=selected;
      say('suggested',{a:selected,m:move.over.name,b:move.to.name});
    } else {
      let n=1;
      while (n<history.length && !board.known.has(history[history.length-n])) n++;
      say('backtrack',{n});
    }
    render();
  }

  function findHint() {
    if (remaining(state)===1) { begin((index+1) % boards.length); return; }
    hint=null; selected=null; landed=null;
    if (board.known.has(state)) { showHint(board.known.get(state)); return; }
    finder=search(board,state);
    say('searching'); render();
    function slice() {
      const until=performance.now()+9;
      do {
        const result=finder.next();
        if (result.done) { showHint(result.value); return; }
      } while (performance.now()<until);
      pending=setTimeout(slice,0);
    }
    pending=setTimeout(slice,0);
  }

  $('holes').addEventListener('click', event => {
    const hole=event.target.closest('[data-cell]');
    if (hole) play(hole.dataset.cell);
  });
  $('holes').addEventListener('keydown', event => {
    const hole=event.target.closest('[data-cell]');
    if (!hole) return;
    if (event.key==='Enter' || event.key===' ') {
      event.preventDefault();
      if (!event.repeat) play(hole.dataset.cell);
      return;
    }
    const offsets={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
    const delta=offsets[event.key];
    if (!delta) return;
    event.preventDefault();
    const cell=board.byName.get(hole.dataset.cell);
    const next=coordinate(cell.row+delta[0],cell.col+delta[1]);
    if (board.byName.has(next)) {
      focusId=next;
      hole.setAttribute('tabindex','-1');
      const target=$('holes').querySelector('[data-cell="'+next+'"]');
      target.setAttribute('tabindex','0'); target.focus();
    }
  });
  $('hint').addEventListener('click',findHint);
  $('undo').addEventListener('click',() => {
    if (!history.length) return;
    stopSearch();
    state=history.pop(); hint=null; selected=null; landed=null;
    say('restored'); render();
  });
  $('restart').addEventListener('click',() => begin(index));
  $('help').addEventListener('click',() => $('rules').showModal());
  window.addEventListener('boopland:languagechange',render);
  begin(0);
})();
