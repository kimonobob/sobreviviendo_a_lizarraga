import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { erVals } from "../../lib/finance";
import { axisMillones, soles } from "../../lib/format";
import { ink } from "../../lib/palette";
import { ToggleLegend } from "../ui/Legend";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

// Ventas netas · Costos · Gastos · Utilidad neta. Costos y gastos se muestran
// en magnitud (positivos); la utilidad neta conserva su signo (2021 negativo).
const SERIES = [
  { id: "ventas", label: "Ventas netas", color: "var(--series-1)" },
  { id: "costos", label: "Costos", color: "var(--series-2)" },
  { id: "gastos", label: "Gastos", color: "var(--series-4)" },
  { id: "neta", label: "Utilidad neta", color: "var(--series-6)" },
];

function buildRows(data) {
  const ing = erVals(data, "ingresos");
  const cv = erVals(data, "costo_ventas");
  const gv = erVals(data, "gastos_venta");
  const ga = erVals(data, "gastos_admin");
  const un = erVals(data, "utilidad_neta");
  return data.meta.years.map((year, i) => ({
    year,
    ventas: ing[i],
    costos: cv[i] == null ? null : Math.abs(cv[i]),
    gastos: (gv[i] ?? 0) + (ga[i] ?? 0) ? Math.abs((gv[i] ?? 0) + (ga[i] ?? 0)) : null,
    neta: un[i],
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox title={label}>
      {SERIES.map((s) => {
        const p = payload.find((x) => x.dataKey === s.id);
        if (!p) return null;
        return <TooltipRow key={s.id} color={s.color} label={s.label} value={soles(p.value)} />;
      })}
    </TooltipBox>
  );
}

export function IncomeStatementLine({ data, markYear, chart }) {
  const rows = buildRows(data);
  const [active, setActive] = useState(SERIES.map((s) => s.id));
  const toggle = (id) =>
    setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <ToggleLegend items={SERIES} active={active} onToggle={toggle} />
      <div className="min-h-0 flex-1">
        <ChartBox w={chart?.w} h={chart?.h}>
          <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 2, left: 4 }}>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: ink.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: ink.baseline }}
              minTickGap={10}
            />
            <YAxis
              tickFormatter={axisMillones}
              tick={{ fill: ink.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={46}
              label={{
                value: "S/ millones",
                angle: -90,
                position: "insideLeft",
                style: { fill: ink.muted, fontSize: 10, textAnchor: "middle" },
              }}
            />
            <ReferenceLine y={0} stroke={ink.baseline} />
            {markYear && (
              <ReferenceLine x={markYear} stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: ink.baseline }} />
            {SERIES.map((s) =>
              active.includes(s.id) ? (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={s.id === "ventas" ? 2.5 : 2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                  connectNulls
                />
              ) : null
            )}
          </LineChart>
        </ChartBox>
      </div>
    </div>
  );
}
