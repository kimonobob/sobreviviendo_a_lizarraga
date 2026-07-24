import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { dupontSeries } from "../../lib/finance";
import { pct, veces } from "../../lib/format";
import { ink } from "../../lib/palette";
import { ChartBox } from "../ui/ChartBox";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";

const FACTORS = [
  { key: "margen", label: "Margen Neto", color: "var(--series-2)", fmt: (v) => pct(v), yAxis: "pct" },
  { key: "rotacion", label: "Rotación", color: "var(--series-3)", fmt: (v) => veces(v), yAxis: "veces" },
  { key: "multiplicador", label: "Multiplicador", color: "var(--series-4)", fmt: (v) => veces(v), yAxis: "veces" },
  { key: "roe", label: "ROE", color: "var(--series-1)", fmt: (v) => pct(v), yAxis: "pct" },
];

function DuPontTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const find = (key) => payload.find((p) => p.dataKey === key)?.value;
  return (
    <TooltipBox title={label}>
      {FACTORS.map((f) => (
        <TooltipRow key={f.key} label={f.label} value={f.fmt(find(f.key))} color={f.color} />
      ))}
    </TooltipBox>
  );
}

export function DuPontChart({ data, markYear, chart }) {
  const series = useMemo(() => dupontSeries(data), [data]);
  const cur = useMemo(
    () => series.find((d) => d.year === markYear) || series[series.length - 1] || {},
    [series, markYear]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Decomposition strip */}
      <div className="flex shrink-0 items-center justify-between gap-1 rounded-md border border-hair bg-plane px-2 py-1.5 text-center">
        <div className="flex flex-col items-center flex-1 min-w-0">
          <span className="text-[9px] text-ink-muted leading-tight">Margen</span>
          <span className="tnum text-sm font-bold" style={{ color: "var(--series-2)" }}>
            {cur.margen != null ? pct(cur.margen) : "—"}
          </span>
        </div>
        <span className="text-ink-muted text-xs font-bold">×</span>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <span className="text-[9px] text-ink-muted leading-tight">Rotación</span>
          <span className="tnum text-sm font-bold" style={{ color: "var(--series-3)" }}>
            {cur.rotacion != null ? veces(cur.rotacion) : "—"}
          </span>
        </div>
        <span className="text-ink-muted text-xs font-bold">×</span>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <span className="text-[9px] text-ink-muted leading-tight">Multipl.</span>
          <span className="tnum text-sm font-bold" style={{ color: "var(--series-4)" }}>
            {cur.multiplicador != null ? veces(cur.multiplicador) : "—"}
          </span>
        </div>
        <span className="text-ink-muted text-xs font-bold">=</span>
        <div className="flex flex-col items-center flex-1 min-w-0 rounded bg-surface px-1.5 py-0.5 shadow-sm" style={{ borderBottom: "2px solid var(--series-1)" }}>
          <span className="text-[9px] text-ink-muted font-semibold leading-tight">ROE</span>
          <span className="tnum text-sm font-black" style={{ color: "var(--series-1)" }}>
            {cur.roe != null ? pct(cur.roe) : "—"}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1">
        <ChartBox w={chart?.w} h={chart?.h}>
          <ComposedChart data={series} margin={{ top: 6, right: 6, bottom: 2, left: 4 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: ink.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: ink.baseline }}
              minTickGap={10}
            />
            <YAxis
              yAxisId="pct"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: ink.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <YAxis
              yAxisId="veces"
              orientation="right"
              tickFormatter={(v) => `${v.toFixed(1)}x`}
              tick={{ fill: ink.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            {markYear && (
              <ReferenceLine x={markYear} yAxisId="pct" stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />
            )}
            <Tooltip content={<DuPontTip />} cursor={{ stroke: ink.baseline }} />
            <Line yAxisId="pct" type="monotone" dataKey="margen" stroke="var(--series-2)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} connectNulls />
            <Line yAxisId="veces" type="monotone" dataKey="rotacion" stroke="var(--series-3)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} connectNulls />
            <Line yAxisId="veces" type="monotone" dataKey="multiplicador" stroke="var(--series-4)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} connectNulls />
            <Line yAxisId="pct" type="monotone" dataKey="roe" stroke="var(--series-1)" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={false} connectNulls />
          </ComposedChart>
        </ChartBox>
      </div>
    </div>
  );
}
