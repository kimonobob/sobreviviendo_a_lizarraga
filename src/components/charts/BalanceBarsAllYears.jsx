import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { axisMillones, soles, pct } from "../../lib/format";
import { ink } from "../../lib/palette";
import { StaticLegend } from "../ui/Legend";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

// Estado de Situación Financiera por año: barras apiladas Pasivo + Patrimonio
// (la altura total = Total Activo). Los 3 datos en una sola vista temporal.
const PASIVO = "#f97316";
const PATRIM = "#ec4899";

export function BalanceBarsAllYears({ data, chart }) {
  const rows = data.meta.years.map((year, i) => {
    const pasivo = data.esf.totales.pasivo[i];
    const patrimonio = data.esf.totales.patrimonio[i];
    return { year, pasivo, patrimonio, activo: data.esf.totales.activo[i] };
  });

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload;
    return (
      <TooltipBox title={label}>
        <TooltipRow color={PATRIM} label="Patrimonio" value={`${soles(r.patrimonio)} · ${pct(r.patrimonio / r.activo)}`} />
        <TooltipRow color={PASIVO} label="Pasivo" value={`${soles(r.pasivo)} · ${pct(r.pasivo / r.activo)}`} />
        <TooltipRow label="Total Activo" value={soles(r.activo)} strong />
      </TooltipBox>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <StaticLegend
        items={[
          { id: "activo", label: "Total Activo (altura)", color: "#7c3aed" },
          { id: "patrimonio", label: "Patrimonio", color: PATRIM },
          { id: "pasivo", label: "Pasivo", color: PASIVO },
        ]}
      />
      <div className="min-h-0 flex-1">
        <ChartBox w={chart?.w} h={chart?.h}>
          <BarChart data={rows} margin={{ top: 6, right: 10, bottom: 2, left: 4 }} barCategoryGap="16%">
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis dataKey="year" tick={{ fill: ink.muted, fontSize: 10 }} tickLine={false} axisLine={{ stroke: ink.baseline }} minTickGap={4} />
            <YAxis tickFormatter={axisMillones} tick={{ fill: ink.muted, fontSize: 10 }} tickLine={false} axisLine={false} width={44}
              label={{ value: "S/ millones", angle: -90, position: "insideLeft", style: { fill: ink.muted, fontSize: 10, textAnchor: "middle" } }} />
            <Tooltip content={<Tip />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.3 }} />
            <Bar dataKey="patrimonio" stackId="b" fill={PATRIM} isAnimationActive={false} />
            <Bar dataKey="pasivo" stackId="b" fill={PASIVO} isAnimationActive={false} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartBox>
      </div>
    </div>
  );
}
