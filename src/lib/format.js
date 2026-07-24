// Formato estilo reporte de analista. Los montos vienen en MILES de soles (S/ 000).

const nf0 = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const nf2 = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Miles de soles → S/ millones, con signo. Ej: 3221838 → "S/ 3,222 M" */
export function soles(milesValue, { millones = true, sign = false } = {}) {
  if (milesValue == null || Number.isNaN(milesValue)) return "—";
  const s = sign && milesValue > 0 ? "+" : "";
  if (millones) {
    const m = milesValue / 1000;
    if (Math.abs(m) >= 1000) return `${s}S/ ${nf0.format(m)} M`;
    return `${s}S/ ${nf1.format(m)} M`;
  }
  return `${s}S/ ${nf0.format(milesValue)}`;
}

/** Monto corto para ejes: millones sin prefijo. Ej: 3221838 → "3,222" */
export function axisMillones(milesValue) {
  if (milesValue == null) return "";
  return nf0.format(milesValue / 1000);
}

/** Porcentaje desde decimal (0.282 → "28.2%") o desde puntos ya en % */
export function pct(decimal, digits = 1) {
  if (decimal == null || Number.isNaN(decimal)) return "—";
  const n = decimal * 100;
  return `${digits === 0 ? nf0.format(n) : nf1.format(n)}%`;
}

/** Veces (1.676 → "1.68x") */
export function veces(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${digits === 2 ? nf2.format(v) : nf1.format(v)}x`;
}

/** Días (77.7 → "78 días") */
export function dias(v) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${nf0.format(v)} d`;
}

/** Formatea un valor de ratio según su tipo (pct | x | dias) */
export function ratioValue(v, formato) {
  if (v == null) return "—";
  if (formato === "pct") return pct(v);
  if (formato === "dias") return dias(v);
  return veces(v);
}

/** Formato de eje para ratios según tipo */
export function ratioAxis(v, formato) {
  if (v == null) return "";
  if (formato === "pct") return `${nf0.format(v * 100)}%`;
  if (formato === "dias") return nf0.format(v);
  return `${nf1.format(v)}x`;
}

export { nf0, nf1, nf2 };
