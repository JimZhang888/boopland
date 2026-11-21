/* Scene coordinates, bird behaviour and exposure calculations. Units are shared with the drawing. */
(function (root) {
  'use strict';
  const birds = [
    { id: 'robin', cue: 'rustle', x: .32, y: .53, face: 1 },
    { id: 'kingfisher', cue: 'leaves', x: .70, y: .49, face: -1 },
    { id: 'woodpecker', cue: 'rustle', x: .17, y: .40, face: -1 },
    { id: 'wagtail', cue: 'tracks', x: .55, y: .79, face: 1 },
    { id: 'nuthatch', cue: 'leaves', x: .85, y: .42, face: 1 },
    { id: 'bluetit', cue: 'rustle', x: .52, y: .36, face: 1 }
  ];
  const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
  const cueEnd = 2.1, visitEnd = 11.6;
  const frame = { w: 154, h: 108 };
  function world(width, height) {
    const scale = Math.min(width / 450, height / 264, Math.sqrt(width * height) / 620);
    return { w: width / scale, h: height / scale, scale };
  }
  function anchor(index, view) {
    const b = birds[index];
    return { x: b.x * view.w, y: b.y * view.h };
  }
  function leaves(index, view) {
    const a = anchor(index, view), d = birds[index].face;
    return [[-59, -7, 19, 11, -.36], [-47, -1, 15, 10, .27], [-66, 5, 16, 9, .14]].map(([x,y,rx,ry,angle]) =>
      ({ x: a.x + x * d, y: a.y + y, rx, ry, angle: angle * d }));
  }
  function pose(index, time, view) {
    if (time < cueEnd || time >= 11.1) return null;
    const a = anchor(index, view), d = birds[index].face;
    const arrival = clamp((time - cueEnd) / 1.45), departure = clamp((time - 9.7) / 1.4);
    const beat = (time - 4.15) % 3.75;
    const moment = time >= 4.15 && beat >= 0 && beat < 1.75 && time < 9.7;
    const wave = moment ? Math.sin(Math.PI * beat / 1.75) : 0;
    let x = a.x + d * (-58 * (1 - arrival) + 63 * departure);
    let y = a.y - 1.5 * Math.sin(time * 2) - departure * 42;
    let angle = 0, wing = 0, tail = 0, beak = 0;
    switch (birds[index].id) {
      case 'robin': angle = -.12 * wave; beak = wave; break;
      case 'kingfisher': x += d * 18 * wave; y += 48 * wave; angle = .92 * wave; wing = wave; break;
      case 'woodpecker': angle = -.97 + .24 * wave * Math.sin(beat * 22); x += d * wave * (3 + 3 * Math.cos(beat * 22)); break;
      case 'wagtail': x += 12 * Math.sin(time * 1.1); tail = .60 * wave * Math.sin(beat * 12); break;
      case 'nuthatch': y += wave * 20; angle = .98 + .37 * wave; break;
      case 'bluetit': angle = -.15 - 2.53 * wave; y += 17 * wave; break;
    }
    return { index, x, y, angle, face: d, wing: Math.max(wing, departure), tail, beak, moment };
  }
  function aimAt(state, x, y, view) {
    state.aim.x = clamp(x, frame.w / 2, view.w - frame.w / 2) / view.w;
    state.aim.y = clamp(y, frame.h / 2, view.h - frame.h / 2) / view.h;
  }
  function viewfinder(state, view) {
    return { x: clamp(state.aim.x * view.w, frame.w/2, view.w - frame.w/2),
      y: clamp(state.aim.y * view.h, frame.h/2, view.h - frame.h/2), ...frame };
  }
  function insideLeaf(x, y, leaf) {
    const dx = x - leaf.x, dy = y - leaf.y, c = Math.cos(leaf.angle), s = Math.sin(leaf.angle);
    return ((dx*c + dy*s) / leaf.rx) ** 2 + ((dy*c - dx*s) / leaf.ry) ** 2 <= 1;
  }
  // Sample the torso in bird-local space, then rotate it exactly as in the illustration.
  const body = [];
  for (let y = -12; y <= 12; y += 3) {
    for (let x = -18; x <= 18; x += 3) if ((x/19)**2 + (y/13)**2 <= 1) body.push([x,y]);
  }
  function coverage(bird, camera, foliage) {
    if (!bird) return 0;
    const c = Math.cos(bird.angle), s = Math.sin(bird.angle);
    let seen = 0;
    for (const [dx,dy] of body) {
      const x = bird.x + bird.face * (dx*c - dy*s), y = bird.y + dx*s + dy*c;
      if (Math.abs(x-camera.x) <= camera.w/2 && Math.abs(y-camera.y) <= camera.h/2 &&
          !foliage.some(leaf => insideLeaf(x,y,leaf))) seen++;
    }
    return seen / body.length;
  }
  function score(bird, camera, focus, foliage) {
    const visible = coverage(bird,camera,foliage);
    if (!visible) return { index: null, position: 0, clarity: 0, action: 0, total: 0, visible: 0 };
    const distance = Math.hypot((bird.x-camera.x)/(camera.w/2), (bird.y-camera.y)/(camera.h/2));
    const position = Math.round(40 * clamp(1 - distance * .78) * visible);
    const clarity = Math.round(40 * clamp(focus) * visible);
    const action = Math.round((bird.moment ? 20 : 0) * visible);
    return { index: bird.index, position, clarity, action, total: position + clarity + action, visible };
  }
  function shuffled(pool, random) {
    for (let i=pool.length-1; i>0; i--) {
      const j = Math.floor(random()*(i+1));
      [pool[i],pool[j]] = [pool[j],pool[i]];
    }
    return pool;
  }
  function outing(random = Math.random) {
    return { film: 6, shots: [], aim: {x:.32, y:.53}, time: 0, order: [0,...shuffled([1,2,3,4,5], random)],
      visit: 0, focus: 0, focusing: false, random };
  }
  function current(state) { return state.order[state.visit]; }
  function tick(state, dt, view) {
    if (!state.film) return;
    state.time += dt;
    if (state.time >= visitEnd) {
      state.time %= visitEnd;
      const last = current(state);
      state.visit = (state.visit+1) % 6;
      if (!state.visit) {
        shuffled(state.order, state.random);
        if (state.order[0] === last) [state.order[0],state.order[1]] = [state.order[1],state.order[0]];
      }
      state.focus = 0; state.focusing = false;
    }
    const b = pose(current(state),state.time,view), cam = viewfinder(state,view);
    const tracking = b && Math.abs(b.x-cam.x) < cam.w*.42 && Math.abs(b.y-cam.y) < cam.h*.42;
    if (state.focusing && tracking) state.focus = clamp(state.focus + dt / .8);
    else state.focus = clamp(state.focus - dt * 2.8);
  }
  function shoot(state, view) {
    if (!state.film) return null;
    const i = current(state);
    const result = score(pose(i,state.time,view), viewfinder(state,view), state.focus, leaves(i,view));
    state.film--;
    state.shots.push(result);
    return result;
  }
  const api = { birds, frame, world, anchor, leaves, pose, aimAt, viewfinder, coverage, score, outing, current, tick, shoot, cueEnd, visitEnd };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WoodlandField = api;
})(globalThis);

