(() => {
  'use strict';
  const E = window.DiceJianghu, I = window.BooplandI18n;
  const $ = id => document.getElementById(id), t = (key, values) => I.t('jianghu.' + key, values);
  const escape = str => String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const SAVE = 'boopland-dice-jianghu-v1', BEST = 'boopland-dice-jianghu-best';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Play remains available without storage. */ } };
  const seed = () => window.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
  let state = E.restore(read(SAVE)) || E.create(seed()), selected = null, modalKind = null, focusBefore = null;
  let best = Math.max(0, Number(read(BEST)) || 0), effectTimer = null;
  const dots = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
  function die(d, i, placed = false) {
    return `<button class="die${!placed && selected === i ? ' selected' : ''}" data-die="${i}" data-value="${d.value}" aria-label="${escape(t(placed ? 'returnDie' : 'dieLabel', { n:i+1, value:d.value }))}"${placed ? '' : ` aria-pressed="${selected === i}"`}>${dots[d.value].map(n => `<i class="pip" style="grid-area:${Math.ceil(n/3)}/${(n-1)%3+1}" aria-hidden="true"></i>`).join('')}</button>`;
  }
  const icon = lane => ({attack:'⚔',guard:'◇',heal:'✚'})[lane];
  function render() {
    const focus = document.activeElement;
    const focusDie = focus?.dataset.die, focusLane = focus?.dataset.lane;
    if (selected !== null && (!state.dice[selected] || state.dice[selected].lane !== null)) selected = null;
    const p = E.preview(state), plan = state.phase === 'plan', ready = state.phase === 'ready';
    const left = state.dice.filter(d => d.lane === null).length;
    document.title = t('title') + ' · Boopland';
    $('chapter').textContent = t('chapter', {n:state.stage+1}); $('round').textContent = t('round', {n:state.round});
    $('journey').innerHTML = E.FOES.map((_,i) => `<i class="${i < state.cleared ? 'passed' : i === state.stage ? 'current' : ''}"></i>`).join('');
    $('hero-hp').textContent = `${state.hp} / ${state.maxHp}`; $('foe-hp').textContent = `${state.enemyHp} / ${E.FOES[state.stage]}`;
    $('hero-fill').style.width = `${state.hp / state.maxHp * 100}%`; $('foe-fill').style.width = `${state.enemyHp / E.FOES[state.stage] * 100}%`;
    $('foe-name').textContent = t('foe'+state.stage); $('place').textContent = t('place'+state.stage);
    $('intent').textContent = t(E.intent(state).key, E.intent(state));
    $('dice-hint').textContent = t(!plan ? 'pickDie' : left === 0 ? 'allAssigned' : selected === null ? 'pickDie' : 'pickLane');
    $('dice-pool').innerHTML = plan ? state.dice.map((d,i) => d.lane === null ? die(d,i) : `<span class="die empty" aria-hidden="true">${icon(d.lane)}</span>`).join('') : Array.from({length:4},(_,i) => `<span class="die empty" role="img" aria-label="${escape(t('emptyDie',{n:i+1}))}">·</span>`).join('');
    $('roll').textContent = t(ready ? 'roll' : state.rerolls ? 'reroll' : 'rerollUsed');
    $('roll').disabled = !ready && !(plan && state.rerolls && selected !== null);
    $('upgrade-badge').textContent = t('equipped', state.upgrades);
    $('lanes').innerHTML = E.LANES.map((lane,index) => {
      const combo = ['inch','redirect','return'][index], active = p.combos.includes(combo);
      const short = ['2 × (1–2) → +7','1 + 2 → +6 / ↶4','n+n (n≤3) → +5'][index];
      return `<article class="lane ${lane}${selected !== null && plan ? ' ready' : ''}${active ? ' active' : ''}"><button class="lane-target" data-lane="${lane}" aria-label="${escape(t(lane))}" ${!plan || selected === null ? 'disabled' : ''}><span class="lane-icon" aria-hidden="true">${icon(lane)}</span><span><strong>${escape(t(lane))}</strong><small>${escape(t(lane+'Rule'))}</small></span><b class="lane-total">${p[lane]}</b></button><div class="lane-dice">${state.dice.map((d,i) => d.lane === lane ? die(d,i,true) : '').join('') || '<span class="lane-empty" aria-hidden="true">+</span>'}</div><div class="combo-hint" title="${escape(t(combo+'Hint'))}"><span class="combo-full">${active ? '✓ ' : ''}${escape(t(combo+'Hint'))}</span><span class="combo-short">${active ? '✓ ' : ''}${escape(t(combo))} · ${short}</span></div></article>`;
    }).join('');
    $('harmony').innerHTML = `<span class="combo-full">${p.combos.includes('harmony') ? '✧ ' : '◇ '}${escape(t('harmonyHint'))}</span><span class="combo-short">${escape(t('harmony'))} · 1·2·3 → ⚔+3 ◇+3 ✚+2</span>`;
    $('harmony').title = t('harmonyHint');
    $('harmony').classList.toggle('active', p.combos.includes('harmony'));
    $('forecast').innerHTML = [['damage',plan ? Math.min(state.enemyHp,p.damage+p.riposte) : '—'],['incoming',plan ? p.counter : '—'],['healing',plan ? p.healing : '—']].map(([key,value]) => `<span class="${key==='incoming' && plan && p.nextHp===0 ? 'danger' : ''}">${escape(t(key))} <b>${value}</b>${key==='incoming' && plan && p.nextHp===0 ? `<small>${escape(t('lethal'))}</small>` : ''}</span>`).join('');
    $('commit').textContent = t(plan && left ? 'allocate' : 'commit', {n:left}); $('commit').disabled = !plan || left !== 0;
    $('battle-note').textContent = state.last ? t('lastNote',state.last) : t(plan ? 'planNote' : 'readyNote');
    if (['won','lost'].includes(state.phase)) { best = Math.max(best,E.score(state)); write(BEST,String(best)); }
    $('best').textContent = t('best',{n:best}); write(SAVE,JSON.stringify(state));
    if (focusDie !== undefined) document.querySelector(`[data-die="${focusDie}"]`)?.focus({preventScroll:true});
    else if (focusLane) document.querySelector(`[data-lane="${focusLane}"]:not(:disabled)`)?.focus({preventScroll:true});
    if (modalKind) renderModal();
    else if (['reward','won','lost'].includes(state.phase)) showModal(state.phase);
  }
  const button = (action,label,primary=false) => `<button data-action="${action}" class="${primary?'primary':''}">${escape(t(label))}</button>`;
  function renderModal() {
    let content = '';
    if (modalKind === 'help') content = `<h2>${escape(t('help'))}</h2>${[1,2,3,4].map(i=>`<p class="rule">${escape(t('help'+i))}</p>`).join('')}<p>${escape(t('keyboard'))}</p>${button('close','continue',true)}`;
    else if (modalKind === 'restart') content = `<h2>${escape(t('restartTitle'))}</h2><p>${escape(t('restartDesc'))}</p><div class="dialog-actions">${button('new','restart',true)}${button('close','cancel')}</div>`;
    else if (modalKind === 'reward') content = `<div class="result-seal" aria-hidden="true">✧</div><h2>${escape(t('rewardTitle'))}</h2><p>${escape(t('rewardDesc'))}</p>${['blade','guard','heart'].map((kind,i)=>`<button class="reward" data-upgrade="${kind}"><span class="lane-icon" aria-hidden="true">${icon(E.LANES[i])}</span><span><strong>${escape(t(kind==='guard'?'guardUpgrade':kind))}</strong><small>${escape(t(kind==='heart'?'heartDesc':kind+'Desc'))}</small></span></button>`).join('')}`;
    else content = `<div class="result-seal" aria-hidden="true">${state.phase==='won'?'✧':'◇'}</div><h2>${escape(t(state.phase))}</h2><p>${escape(t(state.phase+'Desc'))}</p><strong>${escape(t('score',{n:E.score(state)}))}</strong><div class="result-stats">${escape(t('result',state))}</div>${button('new','newGame',true)}`;
    $('modal-content').innerHTML = content;
    $('close-modal').hidden = ['reward','won','lost'].includes(modalKind);
  }
  function showModal(kind) { focusBefore = document.activeElement; modalKind = kind; renderModal(); if (!$('modal').open) $('modal').showModal(); }
  function closeModal() { $('modal').close(); modalKind = null; focusBefore?.focus({preventScroll:true}); }
  function newGame() { closeModal(); state = E.create(seed()); selected = null; render(); $('roll').focus({preventScroll:true}); }
  function selectDie(index) {
    if (state.phase !== 'plan') return;
    if (state.dice[index]?.lane !== null) E.assign(state,index,null);
    selected = selected === index ? null : index; render();
  }
  function assign(lane) {
    if (selected === null || !E.assign(state,selected,lane)) return;
    selected = state.dice.findIndex(d => d.lane === null); if (selected < 0) selected = null;
    render();
    if (selected === null) $('commit').focus({preventScroll:true});
  }
  function roll() {
    if (state.phase === 'ready') { E.roll(state); selected = 0; }
    else if (!E.reroll(state,selected)) return;
    render(); const pool = $('dice-pool'); pool.classList.remove('rolling'); void pool.offsetWidth; pool.classList.add('rolling');
    document.querySelector(`[data-die="${selected}"]`)?.focus({preventScroll:true});
  }
  function commit() {
    if (!E.resolve(state)) return;
    selected = null; render();
    const panel = document.querySelector('.duel-paper'); panel.classList.remove('hit'); void panel.offsetWidth; panel.classList.add('hit');
    $('battle-flash').textContent = state.last.damage + state.last.riposte ? '−'+(state.last.damage+state.last.riposte) : '◇';
    clearTimeout(effectTimer); effectTimer = setTimeout(() => { panel.classList.remove('hit'); $('battle-flash').textContent = ''; },500);
    if (state.phase === 'ready') $('roll').focus({preventScroll:true});
  }
  document.querySelector('.play-layout').addEventListener('click',event => {
    const d = event.target.closest('[data-die]'), lane = event.target.closest('[data-lane]');
    if (d) selectDie(Number(d.dataset.die)); else if (lane && !lane.disabled) assign(lane.dataset.lane);
  });
  $('roll').addEventListener('click',roll); $('commit').addEventListener('click',commit);
  $('help').addEventListener('click',()=>showModal('help')); $('restart').addEventListener('click',()=>showModal('restart'));
  $('close-modal').addEventListener('click',closeModal);
  $('modal').addEventListener('cancel',event => { event.preventDefault(); if (!['reward','won','lost'].includes(modalKind)) closeModal(); });
  $('modal-content').addEventListener('click',event => {
    const action = event.target.closest('[data-action]')?.dataset.action, upgrade = event.target.closest('[data-upgrade]')?.dataset.upgrade;
    if (action==='new') newGame(); else if (action==='close') closeModal();
    else if (upgrade && E.upgrade(state,upgrade)) { closeModal(); render(); $('roll').focus({preventScroll:true}); }
  });
  document.addEventListener('keydown',event => {
    if ($('modal').open || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const key=event.key.toLowerCase();
    if (/^[1-4]$/.test(key)) { event.preventDefault(); selectDie(Number(key)-1); }
    else if ({a:'attack',d:'guard',h:'heal'}[key]) { event.preventDefault(); assign({a:'attack',d:'guard',h:'heal'}[key]); }
    else if (key==='r') { event.preventDefault(); roll(); }
    else if (key===' ' && !['BUTTON','A'].includes(event.target.tagName)) { event.preventDefault(); commit(); }
  });
  window.addEventListener('boopland:languagechange',render);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) { clearTimeout(effectTimer); $('battle-flash').textContent=''; document.querySelector('.duel-paper').classList.remove('hit'); $('dice-pool').classList.remove('rolling'); } });
  render();
})();
