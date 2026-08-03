import {
  yearIndex,
  erVals,
  erLine,
  ratioItem,
  waterfall,
  netIncomeBridge,
  financingStructure,
  balanceSegments,
} from "../lib/finance";
import { soles, solesMiles, pct, veces, dias, nf0 } from "../lib/format";

/**
 * Panel de cifras que acompaña al gráfico dentro de una ventana ampliada.
 *
 * El gráfico da la forma; esto da el número exacto del año proyectado. Cada
 * ventana trae las cifras que le corresponden — la cascada, sus tramos; la
 * estructura patrimonial, sus dos lados — y todas comparan contra el año
 * anterior, que es la lectura que uno busca al abrir un gráfico en grande.
 */

function delta(curr, prev) {
  if (curr == null || prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

function Delta({ value, invert, label }) {
  if (value == null) return null;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span
      className="tnum text-[10px] font-medium"
      style={{ color: good ? "var(--flow-up)" : "var(--flow-down)" }}
    >
      {value >= 0 ? "▲" : "▼"} {label ?? pct(Math.abs(value), 0)}
    </span>
  );
}

function Row({ label, value, delta: d, invert, deltaLabel, color, accent }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 border-b border-hair py-1.5 last:border-b-0 ${
        accent ? "font-semibold" : ""
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {color && (
          <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />
        )}
        <span className={`text-[11px] leading-snug ${accent ? "text-ink" : "text-ink-secondary"}`}>
          {label}
        </span>
      </span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className={`tnum text-[12px] ${accent ? "font-bold text-ink" : "font-medium text-ink"}`}>
          {value}
        </span>
        <Delta value={d} invert={invert} label={deltaLabel} />
      </span>
    </div>
  );
}

// ── constructores por ventana ────────────────────────────────────────────────

const ER_ROWS = [
  "ingresos",
  "costo_ventas",
  "utilidad_bruta",
  "gastos_venta",
  "gastos_admin",
  "utilidad_operativa",
  "part_subsidiarias",
  "utilidad_neta",
];
const ER_ACCENT = new Set(["ingresos", "utilidad_bruta", "utilidad_operativa", "utilidad_neta"]);

function incomeRows(data, i) {
  return ER_ROWS.map((id) => {
    const line = erLine(data, id);
    if (!line) return null;
    const v = line.values[i];
    const prev = i > 0 ? line.values[i - 1] : null;
    return {
      key: id,
      label: line.label,
      value: soles(v, { sign: !ER_ACCENT.has(id) }),
      delta: delta(v, prev),
      accent: ER_ACCENT.has(id),
    };
  }).filter(Boolean);
}

function waterfallRows(data, i) {
  const steps = waterfall(data, i);
  const prev = i > 0 ? Object.fromEntries(waterfall(data, i - 1).map((s) => [s.id, s.value])) : {};
  const ingresos = steps.find((s) => s.id === "ingresos")?.value || 1;
  // Sin redondear: aquí es donde se cotejan los importes contra el EEFF.
  return steps.map((s) => ({
    key: s.id,
    // El nombre del estado auditado: este panel existe para cotejar importes.
    label: s.full ?? s.label,
    value: solesMiles(s.value, { sign: s.kind !== "anchor" }),
    delta: delta(s.value, prev[s.id]),
    accent: s.kind === "anchor",
    sub: pct(s.value / ingresos),
  }));
}

// Los mismos tramos que dibuja el gráfico, con el nombre del estado auditado.
function earningsRows(data, i) {
  const steps = netIncomeBridge(data, i);
  const prev =
    i > 0 ? Object.fromEntries(netIncomeBridge(data, i - 1).map((s) => [s.id, s.value])) : {};
  const ingresos = steps.find((s) => s.id === "ingresos")?.value || 1;
  return steps.map((s) => ({
    key: s.id,
    label: s.full ?? s.label,
    value: solesMiles(s.value, { sign: s.kind !== "anchor" }),
    delta: delta(s.value, prev[s.id]),
    accent: s.kind === "anchor",
    sub: pct(s.value / ingresos),
  }));
}

function equityRows(data, i) {
  const fs = financingStructure(data);
  const row = fs[i];
  const prev = i > 0 ? fs[i - 1] : null;
  if (!row) return [];
  return [
    {
      key: "patrimonio",
      label: "Patrimonio",
      color: "var(--series-1)",
      value: soles(row.patrimonio),
      delta: delta(row.patrimonio, prev?.patrimonio),
      sub: pct(row.patrimonioPct),
    },
    {
      key: "pasivo",
      label: "Pasivo",
      color: "var(--series-2)",
      value: soles(row.pasivo),
      delta: delta(row.pasivo, prev?.pasivo),
      sub: pct(row.pasivoPct),
      invert: true,
    },
    {
      key: "total",
      label: "Total financiamiento",
      value: soles(row.total),
      delta: delta(row.total, prev?.total),
      accent: true,
    },
  ];
}

function treemapRows(data, i) {
  const segs = balanceSegments(data, i);
  const prevSegs = i > 0 ? balanceSegments(data, i - 1) : [];
  const prevBy = Object.fromEntries(prevSegs.map((s) => [s.id, s.value]));
  const rows = segs.map((s) => ({
    key: s.id,
    label: s.label,
    value: soles(s.value),
    delta: delta(s.value, prevBy[s.id]),
    sub: `${pct(s.pctLado)} del ${s.lado === "activo" ? "activo" : "financiamiento"}`,
  }));
  const activo = data.esf.totales.activo[i];
  const activoPrev = i > 0 ? data.esf.totales.activo[i - 1] : null;
  rows.push({
    key: "total_activo",
    label: "Total activo",
    value: soles(activo),
    delta: delta(activo, activoPrev),
    accent: true,
  });
  return rows;
}

function ratioRows(data, i, selected) {
  const ids = selected?.length ? selected : ["roe", "roa", "margen_neto", "liquidez_corriente"];
  return ids
    .map((id) => {
      const it = ratioItem(data, id);
      if (!it) return null;
      const v = it.values[i];
      const prev = i > 0 ? it.values[i - 1] : null;
      const raw = v != null && prev != null ? v - prev : null;
      const fmt = it.formato === "pct" ? pct : it.formato === "dias" ? dias : veces;
      return {
        key: id,
        label: it.label,
        value: fmt(v),
        // En puntos porcentuales y días la resta directa dice más que un
        // porcentaje de un porcentaje.
        delta: raw,
        deltaLabel:
          raw == null
            ? undefined
            : it.formato === "pct"
            ? `${Math.abs(raw * 100).toFixed(1)}pp`
            : it.formato === "dias"
            ? `${nf0.format(Math.abs(raw))} d`
            : prev !== 0
            ? pct(Math.abs(raw / Math.abs(prev)), 0)
            : undefined,
        invert: it.formato === "dias" || id === "deuda_patrimonio" || id === "pasivo_patrimonio",
      };
    })
    .filter(Boolean);
}

const BUILDERS = {
  income: (data, i) => ({ caption: "Estado de resultados del año", rows: incomeRows(data, i) }),
  waterfall: (data, i) => ({
    caption: "Tramos de la cascada · % de ventas",
    rows: waterfallRows(data, i),
    unit: "S/ en miles, sin redondear",
  }),
  earnings: (data, i) => ({
    caption: "De ventas netas a utilidad neta · % de ventas",
    rows: earningsRows(data, i),
    unit: "S/ en miles, sin redondear",
  }),
  equity: (data, i) => ({ caption: "Cómo se financia el activo", rows: equityRows(data, i) }),
  treemap: (data, i) => ({ caption: "Bloques del balance", rows: treemapRows(data, i) }),
  ratios: (data, i, ratios) => ({
    caption: "Ratios seleccionados",
    rows: ratioRows(data, i, ratios?.selected),
  }),
};

export function hasZoomInfo(id) {
  return Boolean(BUILDERS[id]);
}

export function ZoomInfo({ id, data, year, ratios }) {
  const build = BUILDERS[id];
  if (!build) return null;
  const i = yearIndex(data, year);
  if (i < 0) return null;
  const { caption, rows, unit = "S/ millones" } = build(data, i, ratios);
  const ing = erVals(data, "ingresos")[i];

  return (
    <div className="flex min-h-0 flex-col">
      <div className="shrink-0 border-b border-hair pb-2">
        <div className="flex items-baseline gap-2">
          <span className="tnum text-2xl font-extrabold leading-none text-brand">{year}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-muted">
            Ventas {soles(ing)}
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-ink-secondary">{caption}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {rows.map((r) => (
          <div key={r.key}>
            <Row {...r} />
            {r.sub && <p className="-mt-1 pb-1 text-[9px] text-ink-muted">{r.sub}</p>}
          </div>
        ))}
      </div>

      <p className="shrink-0 border-t border-hair pt-2 text-[9px] leading-snug text-ink-muted">
        {unit} · EEFF separado · variación frente a {year - 1}
      </p>
    </div>
  );
}
