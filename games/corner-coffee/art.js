(function () {
  'use strict';
  const wrap = (body, box = '0 0 48 42') => '<svg viewBox="' + box + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  const icons = {
    cup: '<path fill="#f8f5e9" d="m13 8 23 1-3 27-17-1Z"/><path d="m11 8 27 1m-24 13 20 1"/>',
    ice: '<path fill="#dce6e4" d="m8 12 13-4 4 14-14 4Zm18 10 12-1 2 13-14 2Z"/><path d="m12 14 6-2m11 14 6-1"/>',
    espresso: '<path fill="#d5ddc9" d="M8 6h31v27H8Z"/><path d="M12 11h22v10H12Zm10 12v5m-8 7h20"/><path fill="#735841" d="M19 27h10l-2 8h-6Z"/><circle cx="29" cy="16" r="2"/>',
    water: '<path fill="#dce5e0" d="M15 13h19l4 22H12ZM16 13l3-7h10l3 7M12 19 5 15l7 14m23-10c12-4 12 11 3 10"/>',
    milk: '<path fill="#f6f3e4" d="m13 13 6-7h15v29H13Zm0 0h21M19 6l5 7v22"/><path fill="#b9c9ac" d="M14 20h9v10h-9m11-10h9v10h-9"/>',
    syrup: '<path fill="#dbc195" d="M17 15h14l3 6v15H14V21Zm3 0V8h8v7M21 8V4h14v4"/><path d="M17 25h14v6H17"/>',
    lid: '<path fill="#b5b9a4" d="m10 16 3-6h23l3 6 3 4v4H7v-4Zm0 0h29M18 13h11"/>'
  };
  function guest(index) {
    const colors = ['#c6d0b7', '#ddc8b5', '#bdccd0', '#d7c4c2', '#d8d4ac', '#b9c6ad'];
    return wrap('<path fill="' + colors[index % 6] + '" d="M6 47c0-19 36-19 36 0"/><path fill="#efe0c8" d="M13 14c0-17 25-16 25 1l-2 15c-3 10-19 10-22-1Z"/><path fill="#776957" d="M12 19C6-1 40-3 39 19l-8-9c-4 8-11 7-19 9Z"/><path d="M19 23h1m10 0h1m-9 7q4 3 7 0"/>', '0 0 48 48');
  }
  function counter(cup, compact) {
    const has = key => cup?.parts.includes(key), fill = has('milk') ? '#c8a781' : has('espresso') ? '#826246' : '#c6d8d4';
    const fluid = cup ? Math.min(113, (has('espresso') ? 27 : 0) + (has('water') || has('milk') ? 65 : 0) + (has('ice') ? 15 : 0) + (has('syrup') ? 6 : 0)) : 0;
    const machine = '<path fill="#d7ddcb" d="m30 49 136-2 2 147-138-2Z"/><path fill="#f7f4e8" d="m43 62 110 1-1 43-109-1Z"/><circle cx="130" cy="83" r="11" fill="#b7c3a7"/><path d="m130 76 2 8 6 3M52 80h45m-44 9h32M52 115h84m-45 0v17m-17 0h36M43 175h110m-103 7h95"/><path d="m34 53 128-2m-129 8v125" opacity=".25"/>';
    let drink = '<path d="M215 196h109m-88 7h68" stroke-dasharray="3 5"/><path d="m248 148 14-5 14 5m-14-5v26" opacity=".4"/>';
    if (cup) {
      drink = '<defs><clipPath id="cup-clip"><path d="m219 55 105 1-10 141-84-1Z"/></clipPath></defs><path fill="#fffdf3" d="m219 55 105 1-10 141-84-1Z"/>';
      if (fluid) drink += '<g clip-path="url(#cup-clip)"><path fill="' + fill + '" stroke="none" d="M215 ' + (195-fluid) + 'q54-6 112 0v150H215Z"/>' + (has('syrup') ? '<path stroke="#ad793f" stroke-width="6" opacity=".6" d="m235 73 5 112m55-118-5 118"/>' : '') + '</g>';
      if (has('ice')) drink += '<g fill="#e6eeec" fill-opacity=".75" stroke="#8da6a0"><path d="m238 76 23-4 5 23-24 5Zm37 18 22-3 3 23-22 2Zm-35 19 22-1 3 21-24 2Z"/></g>';
      drink += '<path fill="#dce3ca" d="m224 126 96 1-3 39-90-1Z"/><path d="M260 139c19-13 31 13 9 20-18 1-20-13-9-20Zm-1 16 15-12" fill="#98aa80"/>';
      if (has('lid')) drink += '<path fill="#b6bba6" d="m214 55 4-11 110 1 4 12v7l-118-1Z"/><path d="m218 55 110 1m-50-6h24"/>';
      if (has('water') && !has('ice') && !has('lid')) drink += '<path d="m246 43c-13-17 12-19 0-34m30 34c-12-17 12-20 0-34" opacity=".45"/>';
      if (cup.extracting) drink += '<path d="m91 135 2 29m5-29v28" stroke="#805b3a" stroke-width="3"/>';
    }
    const plant = '<path d="m377 162-2-54m0 29-18-18m18 5 17-18"/><path fill="#b2c1a0" d="M375 122c-18-2-24-13-21-21 13 0 21 8 21 21Zm0-10c-1-19 6-31 15-31 6 13-2 26-15 31Zm2 28c17-1 24-11 23-19-15-1-23 9-23 19Z"/><path fill="#ded1b7" d="m353 155 48 1-6 41-36-1Z"/><path d="m361 163 31 1m-29 6 27 1" opacity=".35"/>';
    return wrap('<path fill="#e7d7b9" stroke="#b1a386" d="M13 194h414v18H13Z"/><path d="m21 204 397 2" opacity=".25"/>' + machine + drink + plant, compact ? '195 0 150 225' : '0 0 440 225');
  }
  window.CoffeeArt = { icon: key => wrap(icons[key]), guest, counter };
})();
