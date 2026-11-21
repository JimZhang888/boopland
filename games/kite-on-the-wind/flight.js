/* Fixed-step flight dynamics. All positions and wind samples use simulation time. */
const KiteFlight = (() => {
  'use strict';
  const courses = [
    { name: 'calm', height: 34, radius: 8, duration: 10, launch: 22 },
    { name: 'gust', height: 61, radius: 8, duration: 13, launch: 37 },
    { name: 'turn', height: 43, radius: 7, duration: 12, launch: 60 }
  ];
  const stepSize = 1 / 60;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function wind(section, t) {
    if (section === 0) return .43 + .055 * Math.sin(t * .9);
    if (section === 1) return .38 + .58 * ((1 - Math.cos(t * 1.08)) / 2) ** 2;
    return .76 * Math.cos(t * .62);
  }
  function launch(practice = null) {
    const section = practice ?? 0;
    const altitude = courses[section].launch;
    return { section, practice, altitude, peak: altitude, speed: 0, tension: .50,
      strain: 0, elapsed: 0, legTime: 0, passed: 0, notice: '', noticeTime: 0, outcome: null };
  }
  function advance(s, pull) {
    if (s.outcome) return;
    const dt = stepSize;
    const airflow = wind(s.section, s.legTime);
    const strength = Math.abs(airflow);
    // A reversing wind carries the kite toward the reel and unloads the line.
    const returnWind = Math.min(0, airflow);
    s.elapsed += dt;
    s.legTime += dt;
    s.noticeTime = Math.max(0, s.noticeTime - dt);
    const restingTension = .50 + (strength - .45) * .27 + returnWind * .10;
    s.tension = clamp(s.tension + ((restingTension - s.tension) * .34 + pull * .202) * dt, .025, 1);
    const stalled = s.tension < .24;
    const lift = stalled ? -12 - (.24 - s.tension) * 18 :
      (s.tension - .50) * 24 + (strength - .43) * 9 + returnWind * 2.6;
    s.speed += (lift - s.speed) * (1 - Math.exp(-dt * 1.65));
    s.altitude = clamp(s.altitude + s.speed * dt, 0, 95);
    s.peak = Math.max(s.peak, s.altitude);
    s.strain = clamp(s.strain + dt * (s.tension > .85 ? 1 : -2.5), 0, 3);
    if (s.altitude <= 0 || s.strain >= 3) {
      s.outcome = s.altitude <= 0 ? 'ground' : 'snap';
      return;
    }
    const gate = courses[s.section];
    if (s.legTime + 1e-8 < gate.duration) return;
    if (Math.abs(s.altitude - gate.height) <= gate.radius) {
      s.passed++;
      if (s.practice !== null || s.section === courses.length - 1) {
        s.outcome = 'finish';
        return;
      }
      s.section++;
      s.notice = 'cleared';
    } else {
      s.notice = 'missed';
    }
    s.legTime = 0;
    s.noticeTime = 2.4;
  }
  return Object.freeze({ courses, wind, launch, advance, stepSize });
})();