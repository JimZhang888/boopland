/* Each spot is an individual burrow, even when its species matches another. */
const Tidepool = (() => {
  'use strict';
  const limit = 18, capacity = 4;
  const species = {
    razor: 'spade', cockle: 'spade', crab: 'tongs', shrimp: 'net',
    hermit: 'tongs', cuttle: 'net'
  };
  const flats = [
    { name: 'egret', depth: 'near', walk: 2, spots: [
      ['razor', 34, 48], ['crab', 61, 26], ['cockle', 64, 65],
      ['razor', 29, 77], ['crab', 82, 45]
    ] },
    { name: 'reeds', depth: 'middle', walk: 4, spots: [
      ['shrimp', 30, 46], ['crab', 55, 27], ['cockle', 60, 75],
      ['shrimp', 83, 56], ['razor', 27, 79]
    ] },
    { name: 'reef', depth: 'far', walk: 6, spots: [
      ['hermit', 27, 49], ['cuttle', 53, 29], ['shrimp', 59, 74],
      ['hermit', 82, 50], ['cuttle', 24, 80]
    ] }
  ];
  const newTrip = (practice = false) => ({
    practice, zone: 0, left: limit, bucket: [], holes: flats.map(() => []),
    selected: null, result: null, tutorialStep: 0
  });
  function end(trip, safe) {
    if (trip.result) return trip.result;
    const recorded = safe && !trip.practice;
    trip.result = {
      type: trip.practice ? 'practised' : safe ? 'landed' : 'rescued',
      kept: recorded ? trip.bucket.slice() : [],
      lost: recorded ? [] : trip.bucket.slice()
    };
    return trip.result;
  }
  function spend(trip, cost) {
    if (!trip.practice) trip.left = Math.max(0, trip.left - cost);
    if (trip.left === 0) end(trip, false);
  }
  function move(trip, zone) {
    if (trip.result || !flats[zone] || zone === trip.zone) return false;
    if (trip.practice) return false;
    const distance = Math.abs(trip.zone - zone);
    trip.zone = zone;
    trip.selected = null;
    spend(trip, 2 * distance);
    return true;
  }
  function inspect(trip, index) {
    if (trip.result || !flats[trip.zone].spots[index]) return 'choose';
    if (trip.practice && index !== 0) return 'teachSpot';
    if (trip.holes[trip.zone].includes(index)) return 'empty';
    trip.selected = index;
    if (trip.practice) trip.tutorialStep = 1;
    return 'sign';
  }
  function gather(trip, tool) {
    if (trip.result) return 'finished';
    if (trip.bucket.length >= capacity) return 'full';
    if (trip.selected === null) return 'choose';
    const index = trip.selected;
    if (trip.holes[trip.zone].includes(index)) return 'empty';
    const [id] = flats[trip.zone].spots[index];
    if (species[id] !== tool) {
      spend(trip, 1);
      return 'wrong';
    }
    trip.holes[trip.zone].push(index);
    trip.bucket.push(id);
    trip.selected = null;
    if (trip.practice) trip.tutorialStep = 2;
    spend(trip, 2);
    return 'caught';
  }
  function back(trip) {
    if (trip.result) return trip.result;
    const cost = flats[trip.zone].walk;
    const safe = trip.practice || trip.left >= cost;
    if (!trip.practice) trip.left = Math.max(0, trip.left - cost);
    return end(trip, safe);
  }
  return { limit, capacity, species, flats, newTrip, inspect, move, gather, back };
})();
