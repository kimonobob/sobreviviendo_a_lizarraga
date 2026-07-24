import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { financingStructure } from "../../lib/finance";
import { axisMillones, soles, pct } from "../../lib/format";
import { ink } from "../../lib/palette";
import { ResponsiveLegend } from "../ui/Legend";
import { SegToggle } from "../ui/Toggle";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

const PASIVO = "var(--series-2)";
const PATRIM = "var(--series-1)";

export function EquityStructureBars({ data, markYear, title, subtitle, chart }) {
  const [mode, setMode] = useState("abs"); // abs | pct
  const base = financingStructure(data);
  const rows = base.map((r) => ({
    year: r.year,
    pasivo: mode === "abs" ? r.pasivo : r.pasivoPct * 100,
    patrimonio: mode === "abs" ? r.patrimonio : r.patrimonioPct * 100,
    _raw: r,
  }));

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload._raw;
    return (
      <TooltipBox title={label}>
        <TooltipRow color={PATRIM} label="Patrimonio" value={`${soles(r.patrimonio)} · ${pct(r.patrimonioPct)}`} />
        <TooltipRow color={PASIVO} label="Pasivo" value={`${soles(r.pasivo)} · ${pct(r.pasivoPct)}`} />
        <TooltipRow label="Total" value={soles(r.total)} strong />
      </TooltipBox>
    );
  };

  const legendItems = [
    { id: "patrimonio", label: "Patrimonio", color: PATRIM },
    { id: "pasivo", label: "Pasivo", color: PASIVO },
  ];

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
        <SegToggle
          value={mode}
          onChange={setMode}
          options={[
            { value: "abs", label: "Montos" },
            { value: "pct", label: "%" },
          ]}
          size="xs"
        />
      </div>
      <div className="flex min-h-0 flex-1 gap-2">
        <div className="min-h-0 flex-1">
          <ChartBox w={chart?.w} h={chart?.h}>
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barCategoryGap="18%">
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: ink.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: ink.baseline }}
              minTickGap={8}
            />
            <YAxis
              tickFormatter={mode === "abs" ? axisMillones : (v) => `${v}%`}
              tick={{ fill: ink.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={mode === "pct" ? [0, 100] : undefined}
              label={{
                value: mode === "abs" ? "S/ millones" : "% del financiamiento",
                angle: -90,
                position: "insideLeft",
                style: { fill: ink.muted, fontSize: 11, textAnchor: "middle" },
              }}
            />
            <Tooltip content={<Tip />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.35 }} />
            <Bar dataKey="patrimonio" stackId="f" fill={PATRIM} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.year} fillOpacity={markYear && r.year !== markYear ? 0.55 : 1} />
              ))}
            </Bar>
            <Bar dataKey="pasivo" stackId="f" fill={PASIVO} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.year} fillOpacity={markYear && r.year !== markYear ? 0.55 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ChartBox>
        </div>
        <ResponsiveLegend items={legendItems} />
      </div>
    </div>
  );
}
