// Original character art for the Covert Crew, drawn as layered SVG so
// limbs, tails and faces can be animated independently.
(function () {
  'use strict';
  const CC = (globalThis.CovertCrew = globalThis.CovertCrew || {});
  const INK = '#2a2230';
  const f = (n) => +Number(n).toFixed(2);

  function heart(x, y, s, fill) {
    return `<path d="M${f(x)} ${f(y + s * 0.75)} C${f(x - s * 1.5)} ${f(y - s * 0.1)} ${f(x - s * 0.6)} ${f(y - s * 1.1)} ${f(x)} ${f(y - s * 0.35)} C${f(x + s * 0.6)} ${f(y - s * 1.1)} ${f(x + s * 1.5)} ${f(y - s * 0.1)} ${f(x)} ${f(y + s * 0.75)}Z" fill="${fill}"/>`;
  }

  function star(x, y, r, fill) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr);
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="0.4"/>`;
  }

  // Every eye / mouth variant is drawn once; CSS shows the active one.
  function face(o) {
    const { ex, ey, sp, er, my, mw } = o;
    const mx = o.mx == null ? ex : o.mx;
    const L = ex - sp;
    const R = ex + sp;
    const both = (fn) => fn(L, -1) + fn(R, 1);
    const st = (w) =>
      `fill="none" stroke="${INK}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"`;
    const openEye = (x) =>
      `<ellipse cx="${f(x)}" cy="${f(ey)}" rx="${f(er)}" ry="${f(er * 1.3)}" fill="${INK}"/>` +
      `<circle cx="${f(x + er * 0.35)}" cy="${f(ey - er * 0.5)}" r="${f(er * 0.4)}" fill="#fff"/>`;
    const brow = (x, side, innerUp) => {
      const outerX = x + side * er * 1.4;
      const innerX = x - side * er * 1.2;
      const outerY = innerUp ? ey - er * 2.1 : ey - er * 2.7;
      const innerY = innerUp ? ey - er * 2.7 : ey - er * 1.8;
      return `<path d="M${f(outerX)} ${f(outerY)} L${f(innerX)} ${f(innerY)}"/>`;
    };

    let s = '<g class="face">';
    s += `<g class="ev ev-open">${both(openEye)}</g>`;
    s += `<g class="ev ev-happy" ${st(er * 0.8)}>${both((x) => `<path d="M${f(x - er * 1.2)} ${f(ey + er * 0.5)} Q${f(x)} ${f(ey - er * 1.5)} ${f(x + er * 1.2)} ${f(ey + er * 0.5)}"/>`)}</g>`;
    s += `<g class="ev ev-closed" ${st(er * 0.75)}>${both((x) => `<path d="M${f(x - er * 1.2)} ${f(ey)} Q${f(x)} ${f(ey + er)} ${f(x + er * 1.2)} ${f(ey)}"/>`)}</g>`;
    s += `<g class="ev ev-wide">${both((x) => `<circle cx="${f(x)}" cy="${f(ey)}" r="${f(er * 1.55)}" fill="#fff" stroke="${INK}" stroke-width="${f(er * 0.45)}"/><circle cx="${f(x)}" cy="${f(ey)}" r="${f(er * 0.6)}" fill="${INK}"/>`)}</g>`;
    s += `<g class="ev ev-x" ${st(er * 0.7)}>${both((x) => `<path d="M${f(x - er)} ${f(ey - er)} L${f(x + er)} ${f(ey + er)} M${f(x + er)} ${f(ey - er)} L${f(x - er)} ${f(ey + er)}"/>`)}</g>`;
    s += `<g class="ev ev-heart">${both((x) => heart(x, ey, er * 1.25, '#e8475f'))}</g>`;
    s += `<g class="ev ev-star">${both((x) => star(x, ey, er * 1.7, '#ffd23f'))}</g>`;
    s += `<g class="ev ev-sad">${both(openEye)}<g ${st(er * 0.6)}>${both((x, sd) => brow(x, sd, true))}</g></g>`;
    s += `<g class="ev ev-angry">${both(openEye)}<g ${st(er * 0.6)}>${both((x, sd) => brow(x, sd, false))}</g></g>`;

    s += `<g class="mv mv-smile" ${st(er * 0.65)}><path d="M${f(mx - mw)} ${f(my)} Q${f(mx)} ${f(my + mw * 0.9)} ${f(mx + mw)} ${f(my)}"/></g>`;
    s += `<g class="mv mv-grin"><path d="M${f(mx - mw)} ${f(my - mw * 0.15)} Q${f(mx)} ${f(my + mw * 1.6)} ${f(mx + mw)} ${f(my - mw * 0.15)}Z" fill="${INK}"/><ellipse cx="${f(mx)}" cy="${f(my + mw * 0.6)}" rx="${f(mw * 0.42)}" ry="${f(mw * 0.22)}" fill="#e46a73"/></g>`;
    s += `<g class="mv mv-o"><ellipse cx="${f(mx)}" cy="${f(my + mw * 0.3)}" rx="${f(mw * 0.42)}" ry="${f(mw * 0.55)}" fill="${INK}"/></g>`;
    s += `<g class="mv mv-flat" ${st(er * 0.6)}><path d="M${f(mx - mw * 0.7)} ${f(my + mw * 0.3)} L${f(mx + mw * 0.7)} ${f(my + mw * 0.3)}"/></g>`;
    s += `<g class="mv mv-frown" ${st(er * 0.6)}><path d="M${f(mx - mw * 0.9)} ${f(my + mw * 0.6)} Q${f(mx)} ${f(my - mw * 0.3)} ${f(mx + mw * 0.9)} ${f(my + mw * 0.6)}"/></g>`;
    s += `<g class="mv mv-wavy" ${st(er * 0.55)}><path d="M${f(mx - mw)} ${f(my + mw * 0.3)} q${f(mw / 4)} ${f(-mw / 3)} ${f(mw / 2)} 0 t${f(mw / 2)} 0 t${f(mw / 2)} 0 t${f(mw / 2)} 0"/></g>`;
    s += `<g class="mv mv-smirk" ${st(er * 0.6)}><path d="M${f(mx - mw * 0.8)} ${f(my + mw * 0.35)} Q${f(mx + mw * 0.2)} ${f(my + mw * 0.7)} ${f(mx + mw)} ${f(my - mw * 0.2)}"/></g>`;

    s += `<g class="blush" fill="#ff7f9a" opacity=".55"><ellipse cx="${f(L - er * 1.1)}" cy="${f(ey + er * 2.4)}" rx="${f(er * 1.3)}" ry="${f(er * 0.7)}"/><ellipse cx="${f(R + er * 1.1)}" cy="${f(ey + er * 2.4)}" rx="${f(er * 1.3)}" ry="${f(er * 0.7)}"/></g>`;
    s += `<g class="sweat"><path d="M${f(R + er * 3)} ${f(ey - er * 2.8)} q${f(er)} ${f(er * 1.6)} 0 ${f(er * 2.2)} q${f(-er)} ${f(-er * 0.6)} 0 ${f(-er * 2.2)}Z" fill="#7cc6f2" stroke="#3d8fc4" stroke-width="0.4"/></g>`;
    s += '</g>';
    return s;
  }

  const open = (w, h) => `<svg class="art" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;

  // ---------------------------------------------------------------------------
  // Agent Victor: a noir secret agent in a fedora, trench coat and orange scarf.
  function dad() {
    const SK = '#f2cba9', COAT = '#46677a', COATD = '#2f4756', PANTS = '#2b2d3a', GOLD = '#c9a46a';
    return `${open(60, 110)}
<g class="legs">
 <g class="leg leg-l"><rect x="22" y="78" width="7" height="27" rx="2" fill="${PANTS}"/><ellipse cx="24.5" cy="106" rx="5.5" ry="3.2" fill="#1d1b20"/></g>
 <g class="leg leg-r"><rect x="31" y="78" width="7" height="27" rx="2" fill="${PANTS}"/><ellipse cx="35.5" cy="106" rx="5.5" ry="3.2" fill="#1d1b20"/></g>
</g>
<g class="upper">
 <g class="arm arm-l"><rect x="10" y="39" width="8" height="30" rx="4" fill="${COAT}"/><rect x="10" y="64" width="8" height="4" fill="${COATD}"/><circle cx="14" cy="71" r="3.6" fill="${SK}"/></g>
 <g class="arm arm-r"><rect x="42" y="39" width="8" height="30" rx="4" fill="${COAT}"/><rect x="42" y="64" width="8" height="4" fill="${COATD}"/><circle cx="46" cy="71" r="3.6" fill="${SK}"/></g>
 <path d="M17 37 Q30 32 43 37 L47 84 Q30 88 13 84 Z" fill="${COAT}"/>
 <path d="M30 40 L30 85" stroke="${COATD}" stroke-width="1.2"/>
 <path d="M22 37 L30 50 L38 37" fill="none" stroke="${COATD}" stroke-width="1.4"/>
 <rect x="14.6" y="60" width="30.8" height="4.2" fill="${COATD}"/>
 <rect x="27.5" y="59.5" width="5" height="5.2" rx="1" fill="none" stroke="${GOLD}" stroke-width="1"/>
 <g fill="${GOLD}"><circle cx="26" cy="70" r="1"/><circle cx="34" cy="70" r="1"/><circle cx="26" cy="77" r="1"/><circle cx="34" cy="77" r="1"/></g>
 <rect x="26.5" y="31" width="7" height="6" fill="${SK}"/>
 <path d="M20 34 Q30 40 40 34 L40.5 38.5 Q30 45 19.5 38.5 Z" fill="#e8833a"/>
 <path d="M33 40 L37 55 L33.5 54.5 L30.5 41 Z" fill="#cf6d27"/>
 <circle cx="17.8" cy="23" r="2.6" fill="${SK}"/><circle cx="42.2" cy="23" r="2.6" fill="${SK}"/>
 <circle cx="30" cy="22" r="12.5" fill="${SK}"/>
 <path d="M17.6 19 Q18 12 30 11.5 Q42 12 42.4 19 L41 22 Q40 16 30 15.5 Q20 16 19 22 Z" fill="#3b2a20"/>
 ${face({ ex: 30, ey: 23, sp: 5, er: 1.7, my: 28.6, mw: 3.2 })}
 <g class="shades"><rect x="21.2" y="20.3" width="7.6" height="5" rx="2" fill="#141414"/><rect x="31.2" y="20.3" width="7.6" height="5" rx="2" fill="#141414"/><path d="M28.8 22 H31.2" stroke="#141414" stroke-width="1.2"/><path d="M22.5 21.4 L24.5 21.4" stroke="#fff" stroke-width=".7" opacity=".6"/></g>
 <g class="hat"><ellipse cx="30" cy="12.5" rx="18.5" ry="3.6" fill="#6e5b48"/><path d="M20 12.5 Q19.5 1.5 30 2 Q40.5 1.5 40 12.5 Z" fill="#7d6852"/><rect x="20" y="8.3" width="20" height="3.2" fill="#2d2622"/><path d="M26 3 Q30 6 34 3" fill="none" stroke="#5f4d3c" stroke-width="1"/></g>
 <g class="prop prop-paper"><rect x="11" y="45" width="38" height="27" rx="1.5" fill="#f4f0e4" stroke="#b8af9b" stroke-width=".8"/><rect x="14" y="48" width="14" height="2.5" fill="#6d6457"/><path d="M14 54 H46 M14 57 H46 M14 60 H40 M31 48 H46 M31 51 H46" stroke="#b8af9b" stroke-width="1"/><rect x="14" y="63" width="10" height="6" fill="#d8d0bd"/></g>
</g></svg>`;
  }

  // Goldie: a cheerful inventor with a purple bob, goggles and a tool belt.
  function mom() {
    const SK = '#e9b591', SUIT = '#4f8a5b', SUITD = '#3d6f48', HAIR = '#7b4fa0', HAIRL = '#9466bb';
    return `${open(56, 100)}
<g class="legs">
 <g class="leg leg-l"><rect x="20" y="72" width="7" height="18" rx="2" fill="${SUITD}"/><rect x="18.5" y="87" width="9.5" height="10.5" rx="2.5" fill="#7a4b2a"/></g>
 <g class="leg leg-r"><rect x="29" y="72" width="7" height="18" rx="2" fill="${SUITD}"/><rect x="28" y="87" width="9.5" height="10.5" rx="2.5" fill="#7a4b2a"/></g>
</g>
<g class="upper">
 <g class="arm arm-l"><rect x="9.5" y="37" width="7" height="25" rx="3.5" fill="${SUIT}"/><rect x="9" y="52" width="8" height="4" rx="1.5" fill="#62a06f"/><circle cx="13" cy="64" r="3.3" fill="${SK}"/></g>
 <g class="arm arm-r"><rect x="39.5" y="37" width="7" height="25" rx="3.5" fill="${SUIT}"/><rect x="39" y="52" width="8" height="4" rx="1.5" fill="#62a06f"/><circle cx="43" cy="64" r="3.3" fill="${SK}"/>
  <g class="prop prop-wrench" transform="rotate(-25 43 64)"><rect x="41.8" y="50" width="2.6" height="14" rx="1.2" fill="#a7b0ba"/><path d="M39.6 47 a3.6 3.6 0 1 0 7 0 l-1.8 1.6 l-1.7 -1.6 l-1.7 1.6 Z" fill="#a7b0ba"/></g>
 </g>
 <path d="M16 35 Q28 30 40 35 L42.5 76 Q28 79 13.5 76 Z" fill="${SUIT}"/>
 <path d="M28 37 V60" stroke="${SUITD}" stroke-width="1.2"/>
 <rect x="31" y="42" width="6" height="6" rx="1" fill="${SUITD}"/>
 <rect x="14.2" y="59" width="27.8" height="4.2" fill="#8a5a32"/>
 <rect x="17" y="62" width="5" height="6" rx="1" fill="#a06a3c"/><rect x="34" y="62" width="5" height="6" rx="1" fill="#a06a3c"/>
 <rect x="25" y="30" width="6" height="6" fill="${SK}"/>
 <path d="M14.5 22 Q14.5 7 28 7 Q41.5 7 41.5 22 L42.5 33 Q37 35.5 35 30 L21 30 Q19 35.5 13.5 33 Z" fill="${HAIR}"/>
 <circle cx="28" cy="21" r="12" fill="${SK}"/>
 <path d="M16 19 Q17 7.5 28 7.5 Q39 7.5 40 19 Q35 13 30 15 Q25 11.5 16 19 Z" fill="${HAIRL}"/>
 <path d="M16.2 13 Q28 9 39.8 13" stroke="#3a3a3a" stroke-width="2.2" fill="none"/>
 <circle cx="23.5" cy="11.8" r="3.4" fill="#f2b84b" stroke="#3a3a3a" stroke-width="1.3"/><circle cx="32.5" cy="11.8" r="3.4" fill="#f2b84b" stroke="#3a3a3a" stroke-width="1.3"/>
 <circle cx="22.4" cy="10.8" r="1" fill="#fff" opacity=".8"/><circle cx="31.4" cy="10.8" r="1" fill="#fff" opacity=".8"/>
 ${face({ ex: 28, ey: 22.5, sp: 4.6, er: 1.6, my: 28, mw: 3 })}
 <circle cx="16.2" cy="26" r="1.1" fill="#ffd23f"/><circle cx="39.8" cy="26" r="1.1" fill="#ffd23f"/>
</g></svg>`;
  }

  // Pip: a curious kid with curly hair, round glasses and a yellow raincoat.
  function kid() {
    const SK = '#f6d3b6', COAT = '#f2c230', COATD = '#d9a817', HAIR = '#6b4423';
    return `${open(44, 66)}
<g class="legs">
 <g class="leg leg-l"><rect x="15" y="52" width="5.5" height="6" fill="#5a4b8a"/><rect x="13.8" y="55" width="8" height="10" rx="2.2" fill="#d6453d"/></g>
 <g class="leg leg-r"><rect x="23.5" y="52" width="5.5" height="6" fill="#5a4b8a"/><rect x="22.2" y="55" width="8" height="10" rx="2.2" fill="#d6453d"/></g>
</g>
<g class="upper">
 <g class="arm arm-l"><rect x="7.5" y="35" width="6" height="14" rx="3" fill="${COAT}"/><circle cx="10.5" cy="50" r="2.7" fill="${SK}"/></g>
 <g class="arm arm-r"><rect x="30.5" y="35" width="6" height="14" rx="3" fill="${COAT}"/><circle cx="33.5" cy="50" r="2.7" fill="${SK}"/></g>
 <path d="M12.5 33 Q22 29 31.5 33 L35 55 Q22 57.5 9 55 Z" fill="${COAT}"/>
 <path d="M22 34 V55" stroke="${COATD}" stroke-width="1"/>
 <g fill="#7a4e12"><rect x="18" y="38" width="3" height="1.4" rx=".7"/><rect x="23" y="38" width="3" height="1.4" rx=".7"/><rect x="18" y="44" width="3" height="1.4" rx=".7"/><rect x="23" y="44" width="3" height="1.4" rx=".7"/><rect x="18" y="50" width="3" height="1.4" rx=".7"/><rect x="23" y="50" width="3" height="1.4" rx=".7"/></g>
 <circle cx="22" cy="20" r="13.5" fill="${SK}"/>
 <g fill="${HAIR}"><path d="M8.6 19 Q9 5 22 5.5 Q35 5 35.4 19 Q31 12 22 12.5 Q13 12 8.6 19Z"/><circle cx="10.5" cy="13" r="4.2"/><circle cx="15" cy="8.2" r="4.5"/><circle cx="21.5" cy="6.2" r="4.6"/><circle cx="28" cy="7.5" r="4.4"/><circle cx="33" cy="12" r="4.2"/><circle cx="35" cy="17" r="3"/><circle cx="9" cy="17.5" r="3"/></g>
 ${face({ ex: 22, ey: 22, sp: 5, er: 1.5, my: 28, mw: 2.6 })}
 <g fill="#d99a7a"><circle cx="13.6" cy="26.6" r=".55"/><circle cx="15" cy="27.6" r=".55"/><circle cx="30.4" cy="26.6" r=".55"/><circle cx="29" cy="27.6" r=".55"/></g>
 <g class="glasses" fill="rgba(255,255,255,.18)" stroke="#3b3355" stroke-width="1.2"><circle cx="17" cy="22" r="4.1"/><circle cx="27" cy="22" r="4.1"/><path d="M21.1 21.5 Q22 20.6 22.9 21.5" fill="none"/></g>
</g></svg>`;
  }

  // Biscuit: a long, loyal dachshund in a red bandana.
  function dog() {
    const BODY = '#b5713a', DARK = '#8a4f24', LIGHT = '#d9a06a';
    const leg = (x, cls, fill) =>
      `<g class="leg ${cls}"><rect x="${x}" y="29" width="6" height="14" rx="3" fill="${fill}"/><ellipse cx="${x + 3.5}" cy="43" rx="4" ry="2.2" fill="${fill}"/></g>`;
    return `${open(84, 46)}
 <g class="tail"><path d="M15 24 Q6 20 5 11" fill="none" stroke="${BODY}" stroke-width="4" stroke-linecap="round"/></g>
 ${leg(17, 'leg-l', DARK)}${leg(51, 'leg-r', DARK)}
 <ellipse cx="40" cy="26" rx="27" ry="10.5" fill="${BODY}"/>
 <ellipse cx="42" cy="31" rx="18" ry="4.5" fill="${LIGHT}"/>
 ${leg(26, 'leg-r', BODY)}${leg(59, 'leg-l', BODY)}
 <g class="head">
  <circle cx="66" cy="17" r="11" fill="${BODY}"/>
  <ellipse cx="76" cy="21" rx="8" ry="5.2" fill="${LIGHT}"/>
  <ellipse cx="82.4" cy="18.8" rx="2.7" ry="2.2" fill="${INK}"/>
  ${face({ ex: 68, ey: 14, sp: 3.6, er: 1.35, mx: 77.5, my: 23.5, mw: 2.4 })}
  <g class="ear"><ellipse cx="58.5" cy="19" rx="4.6" ry="8.5" fill="${DARK}" transform="rotate(12 58.5 19)"/></g>
  <g class="prop prop-bone"><rect x="70" y="24" width="11" height="2.8" rx="1.4" fill="#fff8e7" stroke="#c9b48a" stroke-width=".5"/><circle cx="70" cy="24.2" r="1.8" fill="#fff8e7" stroke="#c9b48a" stroke-width=".5"/><circle cx="70" cy="26.6" r="1.8" fill="#fff8e7" stroke="#c9b48a" stroke-width=".5"/><circle cx="81" cy="24.2" r="1.8" fill="#fff8e7" stroke="#c9b48a" stroke-width=".5"/><circle cx="81" cy="26.6" r="1.8" fill="#fff8e7" stroke="#c9b48a" stroke-width=".5"/></g>
 </g>
 <path d="M56 22 L67 25 L60 34 Z" fill="#d6453d"/><circle cx="57.5" cy="23.5" r="1.6" fill="#b8352e"/>
</svg>`;
  }

  // vbw/vbh: SVG viewBox size. height: on-screen height in px at 100%.
  // legs: SVG height of the legs group (used for the sitting pose).
  CC.art = {
    dad: { name: 'Agent Victor', role: 'Secret agent', vbw: 60, vbh: 110, height: 100, legs: 31, svg: dad },
    mom: { name: 'Goldie', role: 'Inventor', vbw: 56, vbh: 100, height: 90, legs: 26, svg: mom },
    kid: { name: 'Pip', role: 'Junior spy', vbw: 44, vbh: 66, height: 60, legs: 13, svg: kid },
    dog: { name: 'Biscuit', role: 'Good boy', vbw: 84, vbh: 46, height: 40, legs: 16, svg: dog },
  };
})();
