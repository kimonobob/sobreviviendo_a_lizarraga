import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { earningsComposition } from "../../lib/finance";
import { soles, axisMillones } from "../../lib/format";
import { ink } from "../../lib/palette";
import { ResponsiveLegend } from "../ui/Legend";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

// Utilidad neta = operativo + financiero + participación subsidiarias + impuesto + discontinuadas.
// En base separada, "participación subsidiarias" muestra cuánto del resultado es del holding.
const PARTS = [
  { id: "operativo", label: "Resultado operativo", color: "var(--series-3)" },
  { id: "subsidiarias", label: "Part. en subsidiarias", color: "var(--series-6)" },
  { id: "financiero", label: "Resultado financiero", color: "var(--series-2)" },
  { id: "impuesto", label: "Impuesto", color: "var(--series-4)" },
  { id: "discontinuadas", label: "Oper. discontinuadas", color: "var(--series-7)" },
];

export function EarningsCompositionBars({ data, markYear, title, subtitle, chart }) {
  const rows = earningsComposition(data);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const r = rows[data.meta.years.indexOf(label)];
    return (
      <TooltipBox title={label}>
        {PARTS.map((p) => (
          <TooltipRow key={p.id} color={p.color} label={p.label} value={soles(r[p.id], { sign: true })} />
        ))}
        <TooltipRow label="Utilidad neta" value={soles(r.neta)} strong />
      </TooltipBox>
    );
  };

  const legendItems = [...PARTS, { id: "neta", label: "Utilidad neta", color: "var(--text-primary)" }];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-baseline gap-2 min-w-0">
          {title && (
            <h2 className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink shrink-0">{title}</h2>
          )}
          {subtitle && (
            <p className="truncate text-[9px] leading-snug text-ink-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-2">
        <div className="min-h-0 flex-1">
          <ChartBox w={chart?.w} h={chart?.h}>
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barCategoryGap="18%">
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="year" tick={{ fill: ink.muted, fontSize: 9 }} tickLine={false} axisLine={{ stroke: ink.baseline }} minTickGap={8} />
            <YAxis
              tickFormatter={axisMillones}
              tick={{ fill: ink.muted, fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={40}
              label={{ value: "S/ millones", angle: -90, position: "insideLeft", style: { fill: ink.muted, fontSize: 8, textAnchor: "middle" } }}
            />
            <ReferenceLine y={0} stroke={ink.baseline} />
            {markYear && <ReferenceLine x={markYear} stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />}
            <Tooltip content={<Tip />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.3 }} />
            {PARTS.map((p) => (
              <Bar key={p.id} dataKey={p.id} stackId="e" fill={p.color} isAnimationActive={false} />
            ))}
            <Line
              type="monotone"
              dataKey="neta"
              stroke="var(--text-primary)"
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: "var(--text-primary)", strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartBox>
        </div>
        <ResponsiveLegend items={legendItems} />
      </div>
    </div>
  );
}
