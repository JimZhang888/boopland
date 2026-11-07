/* Deterministic, DOM-free adventure rules. Plain script for file:// play. */
(function (root) {
  'use strict';
  const rooms = ['yard', 'workshop', 'tower', 'greenhouse', 'bridge', 'station'];
  const milestones = ['gate', 'power', 'won', 'watered', 'bridgeOpen', 'finished'];
  const objects = { yard: ['cord', 'magnet', 'drain', 'mural', 'gate'], workshop: ['oil', 'generator', 'pipes', 'drawer', 'stairs'], tower: ['beacon', 'chart', 'town'], greenhouse: ['arm', 'grip', 'pump', 'planter', 'gardenExit'], bridge: ['cabinet', 'balance', 'bridgeLever', 'toolbox', 'bridgeExit'], station: ['timetable', 'clockDrive', 'signal', 'mailcar'] };
  const waterTarget = [2, 4, 3], signalCode = [0, 2, 1, 0, 3];
  const canVisit = (s,room) => rooms.includes(room) && (rooms.indexOf(room) === 0 || !!s.flags[milestones[rooms.indexOf(room)-1]]);
  const balanceValue = weights => ({left:weights[0]*3+weights[1],right:weights[2]+weights[3]*2});
  const initialPipes = [5, 3, 12, 12, 6, 10, 9, 5, 5];
  const fresh = () => ({ version: 1, room: 'yard', items: [], selected: null, tall: false, flags: {}, dials: [0, 0, 0], pipes: [...initialPipes], mirrors: [1, 1, 0], water: [0,3,6], weights: [4,3,2,1], weightChoice: null, signals: [], hints: {}, history: [] });
  const rotate = mask => ((mask << 1) & 15) | (mask >> 3);
  function connected(pipes) {
    if (!(pipes[0] & 8) || !(pipes[8] & 2)) return false;
    const queue = [0], seen = new Set(queue);
    const directions = [[1, -3, 4], [2, 1, 8], [4, 3, 1], [8, -1, 2]];
    for (let q = 0; q < queue.length; q++) {
      const cell = queue[q];
      for (const [bit, delta, opposite] of directions) {
        if (!(pipes[cell] & bit)) continue;
        if (cell === 0 && bit === 8 || cell === 8 && bit === 2) continue;
        const next = cell + delta;
        if (next < 0 || next > 8 || bit === 2 && cell % 3 === 2 || bit === 8 && cell % 3 === 0 || !(pipes[next] & opposite)) return false;
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    return seen.has(8);
  }
  // Light starts eastward. 0 = /, 1 = \\. Every mirror must send it onward.
  function lightPath(mirrors) {
    const points = [[40, 220], [160, 220]], target = [160, 100, 360, 100, 360, 282];
    if (mirrors[0] !== 0) return { points: [...points, [160, 310]], solved: false };
    points.push(target.slice(0, 2));
    if (mirrors[1] !== 0) return { points: [...points, [45, 100]], solved: false };
    points.push(target.slice(2, 4));
    if (mirrors[2] !== 1) return { points: [...points, [360, 24]], solved: false };
    points.push(target.slice(4, 6));
    return { points, solved: true };
  }
  function stage(s) {
    const f = s.flags;
    if (!f.cord || !f.magnet) return 'find';
    if (!f.hook) return 'combine';
    if (!f.gear) return 'fish';
    if (!f.fitted) return 'fit';
    if (!f.gate) return 'lock';
    if (!f.oil) return s.room === 'yard' ? 'enter' : 'reach';
    if (!f.oiled) return 'grease';
    if (!f.power) return 'pipe';
    if (!f.lens) return 'collect';
    if (s.room !== 'tower' && !f.won) return 'climb';
    if (!f.lensFitted) return 'lens';
    if (!f.won) return 'reflect';
    if (!f.pumpFitted) return 'garden';
    if (!f.watered) return 'water';
    if (!f.bridgeKey) return 'key';
    if (!f.balanced) return 'balance';
    if (!f.bridgeOpen) return 'lower';
    if (!f.springFitted) return 'spring';
    if (!f.routeReady) return 'signal';
    return f.finished ? 'done' : 'depart';
  }
  function progress(s) { return milestones.filter(flag=>s.flags[flag]).length; }
  function apply(s, action, record = true) {
    let changed = false, message = '', modal = '', sound = 'tap';
    const set = key => { if (!s.flags[key]) { s.flags[key] = true; changed = true; } };
    const take = id => { s.items.push(id); set(id); changed = true; sound = 'pick'; };
    const consume = id => { s.items = s.items.filter(item => item !== id); s.selected = null; changed = true; };
    const needs = id => s.selected === id && s.items.includes(id);
    const result = () => {
      if (record && changed) s.history.push({ ...action });
      return { changed, message, modal, sound };
    };
    if (!action || typeof action.type !== 'string') return result();
    if (action.type === 'select' && s.items.includes(action.id)) {
      const id = action.id;
      const pair = [s.selected,id].sort().join(','), recipe = {'cord,magnet':['cord','magnet','hook','madeHook'],'arm,grip':['arm','grip','crank','madeCrank']}[pair];
      if (s.selected && s.selected !== id && recipe) {
        consume(recipe[0]); consume(recipe[1]); take(recipe[2]); s.selected = recipe[2]; message = recipe[3];
      } else { s.selected = s.selected === id ? null : id; changed = true; message = s.selected ? 'selectedItem' : 'deselected'; }
    } else if (action.type === 'clear') {
      changed = s.selected !== null; s.selected = null; message = 'deselected';
    } else if (action.type === 'posture' && !s.flags.finished) {
      s.tall = !s.tall; changed = true; message = s.tall ? 'stretched' : 'shortened';
    } else if (action.type === 'go' && rooms.includes(action.room)) {
      if (action.room === 'workshop' && !s.flags.gate) message = 'lockedGate';
      else if (action.room === 'tower' && !s.flags.power) message = 'noPower';
      else if (!canVisit(s,action.room)) message = 'pathClosed';
      else if (action.room !== s.room) { s.room = action.room; s.tall = false; s.selected = null; s.weightChoice = null; changed = true; message = s.flags.finished ? 'journeyDone' : 'arrive_' + s.room; }
    } else if (action.type === 'hint') {
      const key = stage(s); s.hints[key] = Math.min(2, (s.hints[key] || 0) + 1); changed = true; modal = 'hint';
    } else if (action.type === 'dial' && s.room === 'yard' && s.flags.fitted && !s.flags.gate && Number.isInteger(action.index) && action.index >= 0 && action.index < 3) {
      s.dials[action.index] = (s.dials[action.index] + 1) % 5; changed = true;
      if (s.dials.join('') === '241') { set('gate'); message = 'gateOpened'; sound = 'success'; modal = 'solved'; }
    } else if (action.type === 'pipe' && s.room === 'workshop' && s.flags.oiled && !s.flags.power && Number.isInteger(action.index) && action.index >= 0 && action.index < 9) {
      s.pipes[action.index] = rotate(s.pipes[action.index]); changed = true;
      if (connected(s.pipes)) { set('power'); message = 'powerOn'; sound = 'success'; modal = 'solved'; }
    } else if (action.type === 'mirror' && s.room === 'tower' && s.flags.lensFitted && !s.flags.won && Number.isInteger(action.index) && action.index >= 0 && action.index < 3) {
      s.mirrors[action.index] = 1 - s.mirrors[action.index]; changed = true;
      if (lightPath(s.mirrors).solved) { set('won'); message = 'lightContinues'; sound = 'success'; modal = 'lightDone'; }
    } else if (action.type === 'transfer' && s.room === 'greenhouse' && s.flags.pumpFitted && !s.flags.watered && Number.isInteger(action.index) && action.index >= 0 && action.index < 3) {
      const from=action.index,to=(from+1)%3;
      if (!s.water[from] || s.water[to] === 6) message = 'flowBlocked';
      else {
        s.water[from]--; s.water[to]++; changed=true; message='waterPrompt';
        if (s.water.every((value,index)=>value===waterTarget[index])) { set('watered'); message='gardenAwake'; sound='success'; modal='waterDone'; }
      }
    } else if (action.type === 'weight' && s.room === 'bridge' && s.flags.cabinetOpen && !s.flags.balanced && Number.isInteger(action.index) && action.index >= 0 && action.index < 4) {
      if (s.weightChoice === null) s.weightChoice=action.index;
      else {
        const first=s.weightChoice; [s.weights[first],s.weights[action.index]]=[s.weights[action.index],s.weights[first]]; s.weightChoice=null;
        const torque=balanceValue(s.weights);
        if (torque.left===torque.right) { set('balanced'); message='bridgeBalanced'; sound='success'; modal='balanceDone'; }
      }
      changed=true;
    } else if (action.type === 'stamp' && s.room === 'station' && s.flags.springFitted && !s.flags.routeReady && Number.isInteger(action.index) && action.index >= 0 && action.index < 4) {
      s.signals.push(action.index); changed=true; message='signalPrompt';
      if (s.signals.length===signalCode.length) {
        if (s.signals.every((value,index)=>value===signalCode[index])) { set('routeReady'); message='routeSet'; sound='success'; modal='routeDone'; }
        else { s.signals=[]; message='signalWrong'; }
      }
    } else if (action.type === 'resetPuzzle') {
      if (action.id==='water' && s.room==='greenhouse' && s.flags.pumpFitted && !s.flags.watered) { s.water=[0,3,6]; changed=true; message='waterPrompt'; }
      if (action.id==='balance' && s.room==='bridge' && s.flags.cabinetOpen && !s.flags.balanced) { s.weights=[4,3,2,1]; s.weightChoice=null; changed=true; message='balancePrompt'; }
      if (action.id==='signal' && s.room==='station' && s.flags.springFitted && !s.flags.routeReady) { s.signals=[]; changed=true; message='signalPrompt'; }
    } else if (action.type === 'interact' && objects[s.room].includes(action.id)) {
      switch (action.id) {
        case 'cord': case 'magnet': case 'arm': case 'grip':
          if (!s.flags[action.id]) { take(action.id); message = 'found_' + action.id; }
          else message = 'nothingElse';
          break;
        case 'mural': set('clue'); modal = 'clue'; message = 'clueFound'; break;
        case 'drain':
          if (s.flags.gear) message = 'emptyDrain';
          else if (needs('hook')) { consume('hook'); take('gear'); message = 'fishedGear'; modal = 'gearFound'; }
          else {
            modal = 'drain';
            message = s.items.includes('hook') ? 'lineReady'
              : s.items.includes('magnet') && s.items.includes('cord') ? 'tieLine'
              : s.items.includes('magnet') ? 'magnetTooShort'
              : s.items.includes('cord') ? 'cordNeedsMagnet' : 'deepDrain';
          }
          break;
        case 'gate':
          if (s.flags.gate) return apply(s, { type: 'go', room: 'workshop' }, record);
          if (!s.flags.fitted) {
            if (needs('gear')) { consume('gear'); set('fitted'); modal = 'lock'; message = 'gearFitted'; }
            else { modal = 'gate'; message = s.items.includes('gear') ? 'gearReady' : s.selected ? 'wrongItem' : 'missingGear'; }
          } else { modal = 'lock'; message = 'lockPrompt'; }
          break;
        case 'oil':
          if (s.flags.oil) message = 'nothingElse';
          else if (!s.tall) message = 'tooHigh';
          else { take('oil'); message = 'found_oil'; }
          break;
        case 'generator':
          if (s.flags.oiled) message = s.flags.power ? 'running' : 'needsPipes';
          else if (needs('oil')) { consume('oil'); set('oiled'); message = 'oiled'; sound = 'success'; }
          else message = s.selected ? 'wrongItem' : 'rusty';
          break;
        case 'pipes':
          if (s.flags.power) message = 'running';
          else if (!s.flags.oiled) message = 'rusty';
          else { modal = 'pipes'; message = 'pipePrompt'; }
          break;
        case 'drawer':
          if (!s.flags.power) message = 'drawerLocked';
          else if (s.flags.lens) message = 'nothingElse';
          else { take('lens'); message = 'found_lens'; }
          break;
        case 'stairs': return apply(s, { type: 'go', room: 'tower' }, record);
        case 'beacon':
          if (s.flags.won) { modal = 'lightDone'; message = 'lightContinues'; }
          else if (s.flags.lensFitted) { modal = 'mirrors'; message = 'mirrorPrompt'; }
          else if (needs('lens')) { consume('lens'); set('lensFitted'); modal = 'mirrors'; message = 'lensFitted'; }
          else message = s.selected ? 'wrongItem' : 'missingLens';
          break;
        case 'chart': set('chart'); modal = 'chart'; message = 'chartFound'; break;
        case 'town': message = s.flags.won ? 'townAwake' : 'townAsleep'; break;
        case 'pump':
          if (s.flags.watered) { message='gardenAwake'; modal='waterDone'; }
          else if (s.flags.pumpFitted) { modal='water'; message='waterPrompt'; }
          else if (needs('crank')) { consume('crank'); set('pumpFitted'); modal='water'; message='waterPrompt'; }
          else { modal='pump'; message='pumpMissing'; }
          break;
        case 'planter':
          if (!s.flags.watered) message='planterDry';
          else if (s.flags.bridgeKey) message='nothingElse';
          else { take('bridgeKey'); message='found_bridgeKey'; }
          break;
        case 'gardenExit': return apply(s,{type:'go',room:'bridge'},record);
        case 'cabinet':
          if (s.flags.cabinetOpen) { modal=s.flags.balanced?'balanceDone':'balance'; message='balancePrompt'; }
          else if (needs('bridgeKey')) { consume('bridgeKey'); set('cabinetOpen'); modal='balance'; message='balancePrompt'; }
          else { modal='cabinet'; message='cabinetLocked'; }
          break;
        case 'balance':
          if (!s.flags.cabinetOpen) { modal='cabinet'; message='cabinetLocked'; }
          else { modal=s.flags.balanced?'balanceDone':'balance'; message=s.flags.balanced?'bridgeBalanced':'balancePrompt'; }
          break;
        case 'bridgeLever':
          if (s.flags.bridgeOpen) message='bridgeLowered';
          else if (!s.flags.balanced) message='bridgeUnbalanced';
          else { set('bridgeOpen'); message='bridgeLowered'; sound='success'; modal='bridgeDone'; }
          break;
        case 'toolbox':
          if (!s.flags.bridgeOpen) message='toolboxFar';
          else if (s.flags.mainspring) message='nothingElse';
          else { take('mainspring'); message='found_mainspring'; }
          break;
        case 'bridgeExit': return apply(s,{type:'go',room:'station'},record);
        case 'timetable': set('timetable'); message='timetableCopy'; modal='timetable'; break;
        case 'clockDrive':
          if (s.flags.springFitted) { message=s.flags.routeReady?'routeSet':'signalPrompt'; modal=s.flags.routeReady?'routeDone':'signal'; }
          else if (needs('mainspring')) { consume('mainspring'); set('springFitted'); message='signalPrompt'; modal='signal'; }
          else { message='springMissing'; modal='clockDrive'; }
          break;
        case 'signal':
          if (!s.flags.springFitted) { message='springMissing'; modal='clockDrive'; }
          else { message=s.flags.routeReady?'routeSet':'signalPrompt'; modal=s.flags.routeReady?'routeDone':'signal'; }
          break;
        case 'mailcar':
          if (s.flags.finished) modal='win';
          else if (!s.flags.routeReady) message='trainWaits';
          else { set('finished'); message='journeyDone'; sound='win'; modal='win'; }
          break;
      }
    }
    return result();
  }
  function serialize(s) { return JSON.stringify({ version: 1, actions: s.history }); }
  function restore(text) {
    const s = fresh();
    try {
      const data = JSON.parse(text);
      if (data?.version !== 1 || !Array.isArray(data.actions) || data.actions.length > 12000) return s;
      for (const action of data.actions) {
        // Replaying through the rules prevents impossible inventory or locked-room saves.
        if (action && ['select', 'clear', 'posture', 'go', 'hint', 'dial', 'pipe', 'mirror', 'interact', 'transfer', 'weight', 'stamp', 'resetPuzzle'].includes(action.type)) {
          const clean = { type: action.type };
          if (typeof action.id === 'string') clean.id = action.id;
          if (typeof action.room === 'string') clean.room = action.room;
          if (Number.isInteger(action.index)) clean.index = action.index;
          apply(s, clean);
        }
      }
    } catch { return fresh(); }
    if (s.selected) apply(s, { type: 'clear' });
    return s;
  }
  const api = { rooms, milestones, canVisit, waterTarget, signalCode, balanceValue, fresh, apply, stage, progress, rotate, connected, lightPath, serialize, restore };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClockworkTown = api;
})(typeof window !== 'undefined' ? window : globalThis);
