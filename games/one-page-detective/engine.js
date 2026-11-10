/* Small deterministic model, usable in a browser or in Node verification. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DetectiveEngine = api;
})(typeof window === 'object' ? window : globalThis, () => {
  const integer = (v, max) => Number.isInteger(v) && v >= 0 && v < max;
  const unique = (list, max) => Array.isArray(list) ? [...new Set(list.filter(v => integer(v, max)))] : [];
  const fresh = () => ({found:[],links:[],witness:null,evidence:null,tab:'witnesses',actor:null,order:[2,0,1],solved:false,hints:0});
  const ready = s => s.found.length === 6 && s.links.length === 2;
  function restore(raw, definition) {
    const s = fresh();
    if (!raw || typeof raw !== 'object') return s;
    s.found = unique(raw.found, 6);
    s.links = unique(raw.links, definition.pairs.length).filter(i => s.found.includes(definition.pairs[i].e));
    s.witness = integer(raw.witness, 3) ? raw.witness : null;
    s.evidence = s.found.includes(raw.evidence) ? raw.evidence : null;
    s.tab = ['witnesses','evidence','links'].includes(raw.tab) ? raw.tab : 'witnesses';
    s.actor = integer(raw.actor, 3) ? raw.actor : null;
    if (unique(raw.order, 3).length === 3 && raw.order.length === 3) s.order = raw.order.slice();
    s.hints = Number.isSafeInteger(raw.hints) && raw.hints >= 0 ? raw.hints : 0;
    s.solved = raw.solved === true && ready(s) && s.actor === definition.actor && s.order.every((id,i) => id === definition.order[i]);
    return s;
  }
  function collect(s, id) {
    if (!integer(id,6)) return false;
    if (!s.found.includes(id)) s.found.push(id);
    s.evidence = id;
    s.tab = 'evidence';
    return true;
  }
  function challenge(s, definition) {
    if (!integer(s.witness,3) || !s.found.includes(s.evidence)) return 'incomplete';
    const match = definition.pairs.findIndex(p => p.w === s.witness && p.e === s.evidence);
    if (match < 0) return 'wrongPair';
    if (s.links.includes(match)) return 'alreadyLinked';
    s.links.push(match);
    s.witness = null;
    s.evidence = null;
    s.tab = 'links';
    return 'linkFound';
  }
  function move(s, index, direction) {
    if (!integer(index,3) || ![-1,1].includes(direction) || !integer(index + direction,3)) return false;
    [s.order[index], s.order[index + direction]] = [s.order[index + direction], s.order[index]];
    s.solved = false;
    return true;
  }
  function solve(s, definition) {
    if (!ready(s) || !integer(s.actor,3)) return 'incomplete';
    if (s.actor !== definition.actor) return 'wrongActor';
    if (!s.order.every((id,i) => id === definition.order[i])) return 'wrongOrder';
    s.solved = true;
    return 'solved';
  }
  return Object.freeze({fresh,restore,ready,collect,challenge,move,solve});
});
