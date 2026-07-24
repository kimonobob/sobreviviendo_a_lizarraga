// Geometría de anillos (donut) dibujados a mano en SVG.

export function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180; // 0° arriba, horario
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// Path de un segmento de anillo entre a0 y a1 (grados), radios interno/externo.
export function ringSegment(cx, cy, rInner, rOuter, a0, a1) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0o, y0o] = polar(cx, cy, rOuter, a0);
  const [x1o, y1o] = polar(cx, cy, rOuter, a1);
  const [x1i, y1i] = polar(cx, cy, rInner, a1);
  const [x0i, y0i] = polar(cx, cy, rInner, a0);
  return [
    `M ${x0o} ${y0o}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i}`,
    "Z",
  ].join(" ");
}

// Convierte una lista de valores en tramos angulares (con separación opcional).
export function toArcs(values, gapDeg = 1.5, startDeg = 0) {
  const total = values.reduce((a, v) => a + v, 0) || 1;
  let cursor = startDeg;
  return values.map((v) => {
    const sweep = (v / total) * (360 - gapDeg * values.length);
    const a0 = cursor + gapDeg / 2;
    const a1 = a0 + sweep;
    cursor = a1 + gapDeg / 2;
    return { a0, a1, mid: (a0 + a1) / 2 };
  });
}
