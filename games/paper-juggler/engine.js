/* Each ball has its own flight, catch window and replacement timer. */
class JugglingAct {
  static rimY = .675;
  static bottomY = .775;
  static peaks = [.47, .37, .415];

  constructor() {
    this.score = 0;
    this.streak = 0;
    this.longest = 0;
    this.catches = 0;
    this.drops = 0;
    this.ended = false;
    this.balls = [this.newBall(0, 1)];
  }

  get tempo() {
    if (this.catches < 4) return 1.55;
    if (this.catches < 12) return 1.40;
    return Math.max(1.02, 1.32 - .018 * Math.floor((this.catches - 12) / 3));
  }

  newBall(id, from, delay = 0) {
    return { id, from, startY: .75, age: -delay, duration: this.tempo,
      window: id === 0 && this.catches < 4 ? .43 : .32, phase: 'flight', fall: 0 };
  }

  static inZone(ball) {
    return ball.phase === 'flight' && ball.age >= ball.duration &&
      ball.age < ball.duration + ball.window;
  }

  static at(ball, t) {
    const end = JugglingAct.rimY;
    return {
      x: ball.from + (1 - 2 * ball.from) * t,
      y: ball.startY + (end - ball.startY) * t - 4 * JugglingAct.peaks[ball.id] * t * (1 - t)
    };
  }

  static position(ball) {
    const target = 1 - ball.from;
    if (ball.phase === 'dropped') {
      return { x: target + (target ? 1 : -1) * .06 * ball.fall, y: JugglingAct.bottomY + .55 * ball.fall + .9 * ball.fall ** 2 };
    }
    if (ball.age < ball.duration) return JugglingAct.at(ball, Math.max(0, ball.age / ball.duration));
    const fraction = Math.min(1, (ball.age - ball.duration) / ball.window);
    return { x: target, y: JugglingAct.rimY + (JugglingAct.bottomY - JugglingAct.rimY) * fraction };
  }

  catch(side) {
    if (this.ended) return null;
    // If two balls reach one hand together, a tap saves the one due to fall first.
    let next = null;
    for (const ball of this.balls) {
      if (ball.from === side || !JugglingAct.inZone(ball)) continue;
      if (!next || ball.duration + ball.window - ball.age < next.duration + next.window - next.age) next = ball;
    }
    if (!next) return null;
    const startY = JugglingAct.position(next).y;
    this.catches++;
    this.streak++;
    this.score += this.streak;
    this.longest = Math.max(this.longest, this.streak);
    Object.assign(next, this.newBall(next.id, side), { startY });
    if (this.catches === 4) this.balls.push(this.newBall(1, 1 - side));
    if (this.catches === 12) this.balls.push(this.newBall(2, 1 - side, .53));
    return next.id;
  }

  advance(dt) {
    if (this.ended) return;
    for (const ball of this.balls) {
      if (ball.phase === 'flight') {
        ball.age += dt;
        const overdue = ball.age - (ball.duration + ball.window);
        if (overdue < 0) continue;
        this.streak = 0;
        this.drops++;
        ball.phase = 'dropped';
        ball.fall = overdue;
        if (this.drops === 3) {
          this.ended = true;
          break;
        }
      } else {
        ball.fall += dt;
      }
      if (ball.fall >= .76) {
        const elapsed = ball.fall - .76;
        Object.assign(ball, this.newBall(ball.id, 1 - ball.from), { age: elapsed });
      }
    }
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = JugglingAct;
