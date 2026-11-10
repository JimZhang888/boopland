(() => {
  'use strict';
  const E = DetectiveEngine, I = BooplandI18n, definitions = DetectiveCases.definitions;
  const $ = id => document.getElementById(id);
  const t = (key, values) => I.t('detective.' + key, values);
  const story = (key, index = current) => I.t('detectiveCase.' + index + '.' + key);
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storageKey = 'boopland-one-page-detective-v1';
  let stored = null, storageOK = true;
  try { stored = JSON.parse(localStorage.getItem(storageKey)); } catch { storageOK = false; }
  let current = Number.isInteger(stored?.current) && stored.current >= 0 && stored.current < 3 ? stored.current : 0;
  const states = definitions.map((d,i) => E.restore(stored?.cases?.[i], d));
  let message = null, dialogType = null, solveFeedback = '', returnFocus = null;
  const state = () => states[current];
  const definition = () => definitions[current];
  const pairText = s => s.witness === null ? t('pairEmpty') : s.evidence === null ? t('pairWitness',{name:story('n'+s.witness)}) : t('pairReady',{name:story('n'+s.witness),clue:story('e'+s.evidence)});
  const witnessOrder = [[0,1,2],[2,0,1],[1,2,0]];
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({version:1,current,cases:states})); storageOK = true; }
    catch { storageOK = false; }
  }
  function status(key, values = {}, error = false) { message = {key,values,error}; renderStatus(); }
  function renderStatus() {
    const s = state();
    const key = s.solved ? 'solved' : E.ready(s) ? 'ready' : s.links.length === 2 ? 'needEvidence' : s.found.length || s.links.length ? 'linksCount' : 'startStatus';
    $('status').textContent = message ? t(message.key,message.values) : t(key,{n:s.links.length});
    $('status').classList.toggle('error',Boolean(message?.error));
  }
  function resizeScene() {
    const box = $('scene-space');
    const style = getComputedStyle(box);
    const available = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    $('scene').style.width = Math.max(0,Math.min(box.clientWidth,available * 760 / 480)) + 'px';
  }
  function buildScene() {
    $('scene').innerHTML = DetectiveArt.scene(definition().art) + definition().points.map(([x,y],id) => `<button class="hotspot" data-clue="${id}" style="left:${x}%;top:${y}%"><span>${id+1}</span></button>`).join('');
    resizeScene();
  }
  function renderNotes() {
    const s = state(), content = $('notes-content');
    document.querySelectorAll('[data-tab]').forEach(button => {
      const selected = button.dataset.tab === s.tab;
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    content.setAttribute('aria-labelledby','tab-'+s.tab);
    if (s.tab === 'witnesses') {
      content.innerHTML = `<p class="panel-tip">${esc(t('selectWitness'))}</p>` + witnessOrder[current].map(id => {
        const linked = definition().pairs.some((p,i) => p.w === id && s.links.includes(i));
        return `<button class="witness ${s.witness === id ? 'selected' : ''} ${linked ? 'linked' : ''}" data-witness="${id}" aria-pressed="${s.witness === id}"><span class="witness-head">${DetectiveArt.portrait(id)}<span><span class="witness-name">${esc(story('n'+id))}</span><span class="witness-role">${esc(story('r'+id))}</span></span></span><span class="quote">“${esc(story('w'+id))}”</span></button>`;
      }).join('');
    } else if (s.tab === 'evidence') {
      content.innerHTML = `<p class="panel-tip">${esc(t('selectEvidence'))}</p><div class="evidence-grid">` + Array.from({length:6},(_,id) => `<button class="evidence-item ${s.evidence === id ? 'selected' : ''}" data-evidence="${id}" aria-pressed="${s.evidence === id}" ${s.found.includes(id) ? '' : 'disabled'}><b>${id+1}</b><span>${esc(s.found.includes(id) ? story('e'+id) : t('unknown'))}</span></button>`).join('') + '</div>' + (s.evidence === null ? `<p class="empty">${esc(t(s.found.length ? 'selectEvidence' : 'noEvidence'))}</p>` : `<article class="evidence-detail"><span class="evidence-tag">${esc(t('evidenceTag',{n:s.evidence+1}))}</span><h3>${esc(story('e'+s.evidence))}</h3><p>${esc(story('d'+s.evidence))}</p></article>`);
    } else {
      content.innerHTML = `<p class="panel-tip">${esc(t('linksCount',{n:s.links.length}))}</p>` + (s.links.length ? s.links.map(id => {
        const p = definition().pairs[id];
        return `<article class="deduction"><h3>✓ ${esc(story('n'+p.w))} ↔ ${esc(story('e'+p.e))}</h3><p>${esc(story('x'+id))}</p></article>`;
      }).join('') : `<p class="empty">${esc(t('noLinks'))}</p>`);
    }
  }
  function render() {
    const s = state();
    $('case-number').textContent = String(current+1).padStart(2,'0');
    $('case-title').textContent = story('title');
    $('case-brief').textContent = story('brief');
    $('scene-location').textContent = story('location');
    $('clue-count').textContent = t('clues',{n:s.found.length});
    document.querySelectorAll('[data-clue]').forEach(button => {
      const id = Number(button.dataset.clue), found = s.found.includes(id);
      button.classList.toggle('found',found);
      button.classList.toggle('selected',s.evidence === id);
      button.setAttribute('aria-label',`${id+1}. ${found ? story('e'+id) : t('unknown')}`);
      button.setAttribute('aria-pressed',String(s.evidence === id));
    });
    renderNotes();
    $('pair-label').textContent = pairText(s);
    $('challenge').disabled = s.witness === null || s.evidence === null;
    $('reconstruct').disabled = !E.ready(s);
    $('reconstruct').firstElementChild.setAttribute('data-i18n','detective.'+(s.solved ? 'review' : 'reconstruct'));
    $('reconstruct').firstElementChild.textContent = t(s.solved ? 'review' : 'reconstruct');
    renderStatus();
  }
  function commit() { save(); render(); }
  function openDialog(type) {
    if (!$('dialog').open) returnFocus = document.activeElement;
    dialogType = type;
    solveFeedback = '';
    renderDialog();
    if (!$('dialog').open) $('dialog').showModal();
    $('dialog-close').focus();
  }
  function closeDialog() { $('dialog').close(); }
  function renderDialog() {
    const s = state(), body = $('dialog-content');
    const headings = {help:'help',archive:'archive',restart:'restartTitle',solve:'solveTitle',result:'solved',hint:'hint'};
    $('dialog-title').textContent = t(headings[dialogType]);
    if (dialogType === 'help') {
      body.innerHTML = [1,2,3,4].map(i => `<div class="help-step"><b>0${i}</b><p>${esc(t('help'+i))}</p></div>`).join('') + `<p class="mini-progress">${esc(t(storageOK ? 'saved' : 'storageOff'))}</p>`;
    } else if (dialogType === 'archive') {
      body.innerHTML = definitions.map((_,id) => `<button class="archive-card" data-open-case="${id}"><b>0${id+1}</b><span>${esc(story('title',id))}</span><small>${esc(t(states[id].solved ? 'done' : 'unsolved'))} ${states[id].solved ? '✓' : '→'}</small></button>`).join('') + `<p class="mini-progress">${esc(t('caseProgress',{n:states.filter(x=>x.solved).length}))}</p>`;
    } else if (dialogType === 'restart') {
      body.innerHTML = `<p class="dialog-copy">${esc(t('restartText'))}</p><div class="dialog-actions"><button data-action="close">${esc(t('cancel'))}</button><button class="primary" data-action="reset">${esc(t('confirmRestart'))}</button></div>`;
    } else if (dialogType === 'hint') {
      const missing = Array.from({length:6},(_,i)=>i).find(i=>!s.found.includes(i));
      const pair = definition().pairs.find((_,i)=>!s.links.includes(i));
      const hint = missing !== undefined ? t('hintFind',{clue:story('e'+missing)}) : pair ? t('hintPair',{name:story('n'+pair.w),clue:story('e'+pair.e)}) : t('hintOrder',{event:story('s'+definition().order[0])});
      body.innerHTML = `<p class="dialog-copy">${esc(hint)}</p><div class="dialog-actions"><button class="primary" data-action="close">${esc(t('close'))}</button></div>`;
    } else if (dialogType === 'solve') {
      body.innerHTML = `<p class="solve-label">${esc(t('chooseActor'))}</p><div class="suspects">${witnessOrder[current].map(id=>`<button data-actor="${id}" aria-pressed="${s.actor === id}">${esc(story('n'+id))}</button>`).join('')}</div><p class="solve-label">${esc(t('orderEvents'))}</p><div class="timeline">${s.order.map((event,index)=>`<div class="timeline-card"><b>${index+1}</b><p>${esc(story('s'+event))}</p><div class="timeline-controls"><button data-move="${index}" data-direction="-1" ${index===0?'disabled':''} aria-label="${esc(t('moveUp'))}: ${esc(story('s'+event))}">↑</button><button data-move="${index}" data-direction="1" ${index===2?'disabled':''} aria-label="${esc(t('moveDown'))}: ${esc(story('s'+event))}">↓</button></div></div>`).join('')}</div><p class="solve-feedback" role="status">${solveFeedback ? esc(t(solveFeedback)) : ''}</p><div class="dialog-actions"><button data-action="reset-order">${esc(t('resetOrder'))}</button><button class="primary" data-action="submit">${esc(t('submit'))} →</button></div>`;
    } else if (dialogType === 'result') {
      body.innerHTML = `<div class="result-mark" aria-hidden="true">✓</div><p class="result-label">${esc(t('outcome'))}</p><p class="dialog-copy">${esc(story('ending'))}</p><div class="timeline">${definition().order.map((id,i)=>`<div class="timeline-card"><b>${i+1}</b><p>${esc(story('s'+id))}</p></div>`).join('')}</div><p class="mini-progress">${esc(t('caseProgress',{n:states.filter(x=>x.solved).length}))}</p><div class="dialog-actions"><button data-action="replay">${esc(t('replay'))}</button><button class="primary" data-action="next">${esc(t(current<2 ? 'nextCase' : 'allCases'))} →</button></div>`;
    }
  }
  function switchCase(id) {
    if (!Number.isInteger(id) || id < 0 || id >= definitions.length) return;
    closeDialog(); current = id; message = null;
    buildScene(); commit(); $('notes-content').scrollTop = 0; $('tab-'+state().tab).focus();
  }
  $('scene').addEventListener('click',event => {
    const button = event.target.closest('[data-clue]');
    if (!button) return;
    E.collect(state(),Number(button.dataset.clue));
    message = null; commit();
    $('notes-content').scrollTop = $('notes-content').scrollHeight;
  });
  document.querySelector('.tabs').addEventListener('click',event => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    state().tab = button.dataset.tab; commit(); $('notes-content').scrollTop = 0;
  });
  document.querySelector('.tabs').addEventListener('keydown',event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const names = ['witnesses','evidence','links'];
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (names.indexOf(state().tab)+(event.key==='ArrowRight'?1:2))%3;
    state().tab = names[next]; commit(); $('tab-'+state().tab).focus();
  });
  $('notes-content').addEventListener('click',event => {
    const witness = event.target.closest('[data-witness]'), evidence = event.target.closest('[data-evidence]');
    if (witness) {
      state().witness = Number(witness.dataset.witness);
      state().tab = 'evidence';
      message = null; commit(); $('tab-evidence').focus(); $('notes-content').scrollTop = 0;
    } else if (evidence && !evidence.disabled) {
      E.collect(state(),Number(evidence.dataset.evidence)); message = null; commit();
      $('notes-content').querySelector(`[data-evidence="${state().evidence}"]`).focus();
    }
  });
  $('challenge').addEventListener('click',() => {
    const result = E.challenge(state(),definition());
    status(result,{n:state().links.length},result !== 'linkFound');
    if (result === 'linkFound' && state().links.length === 2) message = null;
    commit();
    if (result === 'linkFound') { $('tab-links').focus(); $('notes-content').scrollTop = 0; }
  });
  $('reconstruct').addEventListener('click',()=> { if (E.ready(state())) openDialog(state().solved ? 'result' : 'solve'); });
  $('archive').addEventListener('click',()=>openDialog('archive'));
  $('help').addEventListener('click',()=>openDialog('help'));
  $('restart').addEventListener('click',()=>openDialog('restart'));
  $('hint').addEventListener('click',()=> { state().hints++; save(); openDialog('hint'); });
  $('dialog-close').addEventListener('click',closeDialog);
  $('dialog').addEventListener('close',()=> { dialogType = null; returnFocus?.isConnected && returnFocus.focus(); });
  $('dialog-content').addEventListener('click',event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const s = state();
    if (button.dataset.openCase !== undefined) return switchCase(Number(button.dataset.openCase));
    if (button.dataset.actor !== undefined) {
      s.actor = Number(button.dataset.actor); solveFeedback = ''; save(); renderDialog();
      $('dialog-content').querySelector(`[data-actor="${s.actor}"]`).focus();
    } else if (button.dataset.move !== undefined) {
      const index = Number(button.dataset.move), direction = Number(button.dataset.direction);
      if (E.move(s,index,direction)) {
        solveFeedback = ''; save(); renderDialog();
        const destination = index+direction;
        const preferred = $('dialog-content').querySelector(`[data-move="${destination}"][data-direction="${direction}"]:not(:disabled)`);
        (preferred || $('dialog-content').querySelector(`[data-move="${destination}"]:not(:disabled)`)).focus();
      }
    } else if (button.dataset.action === 'close') closeDialog();
    else if (button.dataset.action === 'reset') { states[current] = E.fresh(); message = null; closeDialog(); commit(); $('notes-content').scrollTop = 0; }
    else if (button.dataset.action === 'reset-order') { s.order=[2,0,1]; solveFeedback=''; save(); renderDialog(); $('dialog-content').querySelector('[data-action="reset-order"]').focus(); }
    else if (button.dataset.action === 'submit') {
      solveFeedback = E.solve(s,definition()); save();
      if (solveFeedback === 'solved') { message = null; render(); openDialog('result'); }
      else { renderDialog(); $('dialog-content').querySelector('[data-action="submit"]').focus(); }
    } else if (button.dataset.action === 'replay') openDialog('restart');
    else if (button.dataset.action === 'next') { if (current<2) switchCase(current+1); else openDialog('archive'); }
  });
  window.addEventListener('boopland:languagechange',()=> { render(); if (dialogType) renderDialog(); resizeScene(); });
  window.addEventListener('pagehide',save);
  new ResizeObserver(resizeScene).observe($('scene-space'));
  buildScene(); render(); save();
})();
