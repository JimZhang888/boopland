/* Exact rational arithmetic: fractional solutions must never depend on rounding. */
(() => {
  'use strict';
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  function fraction(n, d = 1) {
    if (d === 0) return null;
    const divisor = gcd(n, d) || 1;
    return { n: n / divisor * Math.sign(d), d: Math.abs(d) / divisor };
  }
  function calculate(a, b, operator) {
    switch (operator) {
      case '+': return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
      case '-': return fraction(a.n * b.d - b.n * a.d, a.d * b.d);
      case '*': return fraction(a.n * b.n, a.d * b.d);
      case '/': return b.n === 0 ? null : fraction(a.n * b.d, a.d * b.n);
      default: return null;
    }
  }
  const format = value => value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
  const isTwentyFour = value => value.n === 24 * value.d;
  const symbol = operator => ({ '+': '+', '-': '−', '*': '×', '/': '÷' })[operator];
  const operand = value => value.n < 0 || value.d !== 1 ? `(${format(value)})` : format(value);
  const stepText = (a, b, operator, result) => `${operand(a)} ${symbol(operator)} ${operand(b)} = ${format(result)}`;
  const makeCards = numbers => numbers.map((number, index) => ({ id: index + 1, value: fraction(number), expression: String(number) }));

  function combine(cards, firstId, secondId, operator) {
    if (firstId === secondId) return null;
    const first = cards.find(card => card.id === firstId);
    const second = cards.find(card => card.id === secondId);
    if (!first || !second) return null;
    const value = calculate(first.value, second.value, operator);
    if (!value) return null;
    const result = {
      id: Math.max(...cards.map(card => card.id)) + 1,
      value,
      expression: `(${first.expression} ${symbol(operator)} ${second.expression})`
    };
    return {
      cards: [...cards.filter(card => card.id !== firstId && card.id !== secondId), result],
      result,
      step: { firstId, secondId, operator, text: stepText(first.value, second.value, operator, value) }
    };
  }

  function solve(cards) {
    const deadEnds = new Set();
    function search(current) {
      if (current.length === 1) return isTwentyFour(current[0].value) ? [] : null;
      const key = current.map(card => format(card.value)).sort().join('|');
      if (deadEnds.has(key)) return null;
      for (let i = 0; i < current.length; i++) {
        for (let j = i + 1; j < current.length; j++) {
          const a = current[i].id;
          const b = current[j].id;
          for (const [first, second, operator] of [[a, b, '+'], [a, b, '*'], [a, b, '-'], [b, a, '-'], [a, b, '/'], [b, a, '/']]) {
            const next = combine(current, first, second, operator);
            if (!next) continue;
            const tail = search(next.cards);
            if (tail !== null) return [next.step, ...tail];
          }
        }
      }
      deadEnds.add(key);
      return null;
    }
    return search(cards);
  }

  function newPuzzle(previous = [], random = Math.random) {
    const signature = numbers => [...numbers].sort((a, b) => a - b).join(',');
    const old = signature(previous);
    // Bound generation time even if an injected random source repeats an unsolvable hand.
    for (let attempt = 0; attempt < 100; attempt++) {
      const numbers = Array.from({ length: 4 }, () => 1 + Math.floor(random() * 13));
      if (signature(numbers) !== old && solve(makeCards(numbers))) return numbers;
    }
    return signature([2, 3, 4, 6]) === old ? [3, 3, 8, 8] : [2, 3, 4, 6];
  }
  const api = Object.freeze({ fraction, calculate, format, isTwentyFour, symbol, operand, makeCards, combine, solve, newPuzzle });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.TwentyFour = api;
})();
