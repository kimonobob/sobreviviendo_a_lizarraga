import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ratioItem, waterfall, earningsComposition,
  financingStructure, dupontSeries,
} from "../../lib/finance";
import { soles, pct, veces, dias, nf0 } from "../../lib/format";
import { Sparkline } from "../ui/Sparkline";

// Paneles de un solo año — la fotografía de un ejercicio, sin serie de fondo.
//
// Viven aquí y no dentro de la vista anual porque los usan las dos pantallas:
// la vista anual los apila en su rejilla, y la vista serie los saca cuando en
// una ventana ampliada eliges un año concreto y el gráfico de serie deja de
// tener sentido.

// Badge de variación. La FLECHA sigue la dirección real del valor; el COLOR
// sigue el sentimiento (verde = mejora). `invert` = "menos es mejor" (p. ej. días).
export function DeltaBadge({ value, label, invert }) {
  if (value == null) return <span className="tnum text-[11px] text-ink-muted">—</span>;
  const up = value >= 0;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span
      className="tnum flex items-center gap-0.5 text-xs font-medium"
      style={{ color: good ? "var(--flow-up)" : "var(--flow-down)" }}
    >
      {up ? "▲" : "▼"} {label ?? pct(Math.abs(value), 0)}
    </span>
  );
}

// ── ESTADO DE RESULTADOS — barras horizontales legibles + YoY ────────────────
export function AnnualIncomeStatement({ data, year, i }) {
  const steps = waterfall(data, i);
  const prevMap = i > 0 ? Object.fromEntries(waterfall(data, i - 1).map((s) => [s.id, s.value])) : {};
  const ingresos = steps.find((s) => s.id === "ingresos")?.value || 1;
  const rows = steps.map((s) => {
    const prev = prevMap[s.id];
    const change = prev != null && prev !== 0 ? (s.value - prev) / Math.abs(prev) : null;
    return { ...s, prev, change, pctVentas: s.value / ingresos };
  });
  const maxVal = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  const [hover, setHover] = useState(null);
  const hovRow = hover != null ? rows.find((r) => r.id === hover) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-1.5">
      {/* tooltip flotante */}
      {hovRow && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 rounded-md border border-hair bg-surface px-2.5 py-1.5 text-[10px] shadow-md">
          <div className="mb-0.5 text-[11px] font-semibold text-ink">{hovRow.label}</div>
          <div className="flex justify-between gap-3"><span className="text-ink-muted">Monto {year}</span><span className="tnum font-medium text-ink">{soles(hovRow.value, { sign: hovRow.kind !== "anchor" })}</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-muted">% de ventas</span><span className="tnum text-ink">{pct(hovRow.pctVentas)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-muted">{year - 1}</span><span className="tnum text-ink">{hovRow.prev != null ? soles(hovRow.prev, { sign: hovRow.kind !== "anchor" }) : "—"}</span></div>
        </div>
      )}
      {rows.map((r) => {
        const on = hover === r.id;
        return (
          <div
            key={r.id}
            className="flex cursor-default items-center gap-2 rounded transition-colors"
            style={{ background: on ? "var(--plane)" : "transparent" }}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
          >
            <span className={`w-24 shrink-0 truncate text-right text-[11px] ${on ? "font-medium text-ink" : "text-ink-secondary"}`}>{r.label}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-plane">
              <div
                className="absolute inset-y-0 left-0 rounded transition-all"
                style={{
                  width: `${(Math.abs(r.value) / maxVal) * 100}%`,
                  background: r.kind === "anchor" ? "var(--flow-total)" : r.value >= 0 ? "var(--flow-up)" : "var(--flow-down)",
                  opacity: hover == null || on ? 1 : 0.55,
                }}
              />
            </div>
            <span className="tnum w-[92px] shrink-0 text-right text-[11px] font-medium text-ink">
              {soles(r.value, { sign: r.kind !== "anchor" })}
            </span>
            <span className="w-12 shrink-0 text-right">
              <DeltaBadge value={r.change} />
            </span>
          </div>
        );
      })}
      <div className="mt-0.5 flex items-center gap-2 text-[9px] text-ink-muted">
        <span className="w-24 shrink-0" />
        <span className="flex-1">Monto {year} · hover para % de ventas</span>
        <span className="w-[92px] shrink-0 text-right">S/ millones</span>
        <span className="w-12 shrink-0 text-right">Δ% vs {year - 1}</span>
      </div>
    </div>
  );
}


// ── RATIOS CLAVE — solo los más importantes, con sparkline interactivo ───────
const KEY_RATIOS = [
  // Mismos colores que en el panel de ratios: rojo el ROA, azul el ROE.
  { id: "roe", label: "ROE", higherBetter: true, color: "var(--series-2)" },
  { id: "roa", label: "ROA", higherBetter: true, color: "var(--series-1)" },
  { id: "margen_neto", label: "Margen neto", higherBetter: true, color: "var(--series-3)" },
  { id: "margen_operativo", label: "Margen operativo", higherBetter: true, color: "var(--series-5)" },
  { id: "liquidez_corriente", label: "Liquidez corriente", higherBetter: true, color: "var(--series-2)" },
  { id: "deuda_patrimonio", label: "Deuda fin. / Patrim.", higherBetter: false, color: "var(--series-7)" },
  { id: "dp_rotacion", label: "Rotación de activos", higherBetter: true, color: "var(--series-4)" },
  { id: "cobertura_intereses", label: "Cobertura intereses", higherBetter: true, color: "var(--series-2)" },
];

function fmtByFormato(formato) {
  return (v) => (v == null ? "—" : formato === "pct" ? pct(v) : formato === "dias" ? dias(v) : veces(v));
}

export function KeyRatios({ data, year, i }) {
  const years = data.meta.years;
  const cards = KEY_RATIOS.map((kr) => {
    const it = ratioItem(data, kr.id);
    if (!it) return null;
    const val = it.values[i];
    const prev = i > 0 ? it.values[i - 1] : null;
    const raw = prev != null && val != null ? val - prev : null;
    const fmt = fmtByFormato(it.formato);
    const deltaLabel =
      raw == null
        ? undefined
        : it.formato === "pct"
        ? `${Math.abs(raw * 100).toFixed(1)}pp`
        : it.formato === "dias"
        ? `${nf0.format(Math.abs(raw))} d`
        : prev !== 0
        ? pct(Math.abs(raw / Math.abs(prev)), 0)
        : undefined;
    return { ...kr, it, val, raw, fmt, deltaLabel };
  }).filter(Boolean);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.id} className="group flex flex-col justify-between gap-1 rounded-lg border border-hair bg-surface px-3 py-2 transition-colors hover:border-brand/40">
          <div className="flex items-start justify-between gap-1">
            <span className="truncate text-[10px] uppercase tracking-wide text-ink-muted">{c.label}</span>
            <DeltaBadge value={c.raw} invert={!c.higherBetter} label={c.deltaLabel} />
          </div>
          <span className="tnum text-xl font-bold leading-none text-ink">{c.fmt(c.val)}</span>
          <Sparkline values={c.it.values} years={years} currentIndex={i} color={c.color} format={c.fmt} />
        </div>
      ))}
    </div>
  );
}


// ── COMPOSICIÓN UTILIDAD NETA — donut ────────────────────────────────────────
const EC_PARTS = [
  { id: "operativo", label: "Resultado operativo", color: "var(--series-3)" },
  { id: "subsidiarias", label: "Part. en subsidiarias", color: "var(--series-6)" },
  { id: "financiero", label: "Resultado financiero", color: "var(--series-2)" },
  { id: "impuesto", label: "Impuesto", color: "var(--series-4)" },
  { id: "discontinuadas", label: "Oper. discontinuadas", color: "var(--series-7)" },
];

export function AnnualEarningsComposition({ data, i }) {
  const row = earningsComposition(data)[i];
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!row) return null;
  const pieData = EC_PARTS.map((p) => ({ name: p.label, value: Math.abs(row[p.id]), raw: row[p.id], color: p.color })).filter((d) => d.value > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      {/* Dona con total al centro (altura fija: el ResponsiveContainer necesita un padre medible) */}
      <div className="relative h-[210px] w-full shrink-0 sm:h-full sm:min-h-[180px] sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius="52%" outerRadius="80%" paddingAngle={2} cornerRadius={3}
              onMouseEnter={(_, idx) => setHoverIdx(idx)} onMouseLeave={() => setHoverIdx(null)}
              isAnimationActive={false}
            >
              {pieData.map((d, idx) => (
                <Cell key={d.name} fill={d.color} fillOpacity={hoverIdx == null || hoverIdx === idx ? 1 : 0.35} stroke="var(--surface-1)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {hoverIdx != null && pieData[hoverIdx] ? (
            <>
              <span className="text-[9px] uppercase leading-tight tracking-wide" style={{ color: pieData[hoverIdx].color }}>
                {pieData[hoverIdx].name}
              </span>
              <span className="tnum text-base font-bold text-ink">{soles(pieData[hoverIdx].raw, { sign: true })}</span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase tracking-wide text-ink-muted">Utilidad neta</span>
              <span className="tnum text-lg font-bold text-ink">{soles(row.neta)}</span>
            </>
          )}
        </div>
      </div>
      {/* Leyenda con montos */}
      <div className="flex flex-1 flex-col justify-center gap-1">
        {EC_PARTS.map((p, idx) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded px-1 py-0.5 text-[11px] transition-colors"
            style={{ background: hoverIdx === idx ? "var(--plane)" : "transparent" }}
            onMouseEnter={() => setHoverIdx(pieData.findIndex((d) => d.name === p.label))}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="text-ink-secondary">{p.label}</span>
            <span className="tnum ml-auto font-medium text-ink">{soles(row[p.id], { sign: true })}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2 border-t border-hair pt-1.5 text-[11px]">
          <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: "var(--text-primary)" }} />
          <span className="font-semibold text-ink">Utilidad neta</span>
          <span className="tnum ml-auto font-bold text-ink">{soles(row.neta)}</span>
        </div>
      </div>
    </div>
  );
}


// ── ESTRUCTURA PATRIMONIAL — donut ───────────────────────────────────────────
export function AnnualEquityStructure({ data, i }) {
  const fs = financingStructure(data);
  const row = fs[i];
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!row) return null;
  const prev = i > 0 ? fs[i - 1] : null;
  const pieData = [
    { name: "Patrimonio", value: Math.abs(row.patrimonio), color: "var(--series-1)", pct: row.patrimonioPct, dp: prev ? row.patrimonioPct - prev.patrimonioPct : null },
    { name: "Pasivo", value: Math.abs(row.pasivo), color: "var(--series-2)", pct: row.pasivoPct, dp: prev ? row.pasivoPct - prev.pasivoPct : null },
  ];
  const hov = hoverIdx != null ? pieData[hoverIdx] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative h-[170px] w-full shrink-0 sm:h-full sm:min-h-[150px] sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="80%" paddingAngle={2} cornerRadius={3} isAnimationActive={false}
                onMouseEnter={(_, idx) => setHoverIdx(idx)} onMouseLeave={() => setHoverIdx(null)}
              >
                {pieData.map((d, idx) => (
                  <Cell key={d.name} fill={d.color} fillOpacity={hoverIdx == null || hoverIdx === idx ? 1 : 0.4} stroke="var(--surface-1)" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {hov ? (
              <>
                <span className="text-[9px] uppercase tracking-wide" style={{ color: hov.color }}>{hov.name}</span>
                <span className="tnum text-base font-bold text-ink">{soles(hov.value)}</span>
                <span className="tnum text-[10px] text-ink-muted">{pct(hov.pct)}</span>
              </>
            ) : (
              <>
                <span className="text-[9px] uppercase tracking-wide text-ink-muted">Financiamiento</span>
                <span className="tnum text-base font-bold text-ink">{soles(row.total)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2.5">
          {pieData.map((d, idx) => (
            <div
              key={d.name}
              className="flex flex-col gap-0.5 rounded px-1.5 py-0.5 transition-colors"
              style={{ background: hoverIdx === idx ? "var(--plane)" : "transparent" }}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: d.color }} />
                <span className="text-ink-secondary">{d.name}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="tnum text-lg font-bold text-ink">{soles(d.value)}</span>
                <span className="tnum text-xs text-ink-muted">{pct(d.pct)}</span>
              </div>
              {d.dp != null && <DeltaBadge value={d.dp} invert={d.name === "Pasivo"} label={`${Math.abs(d.dp * 100).toFixed(1)}pp`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── DU PONT — desglose con delta correcto ────────────────────────────────────
export function DuPontMini({ data, year, i }) {
  const dp = dupontSeries(data);
  const row = dp[i];
  if (!row) return null;
  const prev = i > 0 ? dp[i - 1] : null;
  const items = [
    { label: "Margen neto", raw: row.margen, prev: prev?.margen, fmt: pct, pp: true },
    { label: "Rotación activos", raw: row.rotacion, prev: prev?.rotacion, fmt: veces },
    { label: "Multiplicador apal.", raw: row.multiplicador, prev: prev?.multiplicador, fmt: veces },
    { label: "= ROE", raw: row.roe, prev: prev?.roe, fmt: pct, pp: true, accent: true },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5">
      <p className="text-[10px] text-ink-muted">ROE = Margen × Rotación × Multiplicador</p>
      {items.map((it) => {
        const d = it.raw != null && it.prev != null ? it.raw - it.prev : null;
        return (
          <div key={it.label} className={`flex items-center justify-between rounded-md border px-3 py-1.5 ${it.accent ? "border-brand/40 bg-plane" : "border-hair bg-surface"}`}>
            <span className={`text-[11px] ${it.accent ? "font-semibold text-ink" : "text-ink-secondary"}`}>{it.label}</span>
            <div className="flex items-center gap-2">
              <span className={`tnum text-sm font-semibold ${it.accent ? "text-brand" : "text-ink"}`}>{it.raw != null ? it.fmt(it.raw) : "—"}</span>
              <DeltaBadge
                value={d}
                label={d == null ? undefined : it.pp ? `${Math.abs(d * 100).toFixed(1)}pp` : it.prev !== 0 ? pct(Math.abs(d / Math.abs(it.prev)), 0) : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

