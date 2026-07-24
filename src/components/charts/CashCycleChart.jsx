import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cashCycle, workingCapital } from "../../lib/finance";
import { dias, soles, axisMillones } from "../../lib/format";
import { ink, flow } from "../../lib/palette";
import { StaticLegend } from "../ui/Legend";
import { SegToggle } from "../ui/Toggle";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

const C = {
  dio: "var(--series-4)",
  dso: "var(--series-2)",
  dpo: "var(--series-7)",
  cce: "var(--series-1)",
};

export function CashCycleChart({ data, markYear, chart }) {
  const [mode, setMode] = useState("ciclo"); // ciclo | ktn
  const cc = cashCycle(data);
  const wc = workingCapital(data);

  const TipCiclo = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const r = cc[data.meta.years.indexOf(label)];
    return (
      <TooltipBox title={label}>
        <TooltipRow color={C.dio} label="Días de inventario" value={dias(r.dio)} />
        <TooltipRow color={C.dso} label="Días de cobro" value={dias(r.dso)} />
        <TooltipRow color={C.dpo} label="Días de pago" value={dias(r.dpoRaw)} />
        <TooltipRow color={C.cce} label="Ciclo de efectivo" value={dias(r.cce)} strong />
      </TooltipBox>
    );
  };

  const TipKtn = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const r = wc[data.meta.years.indexOf(label)];
    return (
      <TooltipBox title={label}>
        <TooltipRow label="Activo corriente" value={soles(r.ac)} />
        <TooltipRow label="Pasivo corriente" value={soles(r.pc)} />
        <TooltipRow
          color={r.capitalTrabajo >= 0 ? flow.up : flow.down}
          label="Capital de trabajo"
          value={soles(r.capitalTrabajo)}
          strong
        />
      </TooltipBox>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {mode === "ciclo" ? (
          <StaticLegend
            items={[
              { id: "dio", label: "Días inventario", color: C.dio },
              { id: "dso", label: "Días cobro", color: C.dso },
              { id: "dpo", label: "Días pago (↓)", color: C.dpo },
              { id: "cce", label: "Ciclo de efectivo", color: C.cce },
            ]}
          />
        ) : (
          <span className="text-xs text-ink-secondary">Capital de trabajo neto = Activo corriente − Pasivo corriente</span>
        )}
        <SegToggle
          value={mode}
          onChange={setMode}
          options={[
            { value: "ciclo", label: "Ciclo (días)" },
            { value: "ktn", label: "Capital trabajo" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1">
        <ChartBox w={chart?.w} h={chart?.h}>
          {mode === "ciclo" ? (
            <ComposedChart data={cc} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barCategoryGap="18%">
              <CartesianGrid stroke={ink.grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: ink.muted, fontSize: 12 }} tickLine={false} axisLine={{ stroke: ink.baseline }} minTickGap={8} />
              <YAxis tick={{ fill: ink.muted, fontSize: 12 }} tickLine={false} axisLine={false} width={40}
                label={{ value: "días", angle: -90, position: "insideLeft", style: { fill: ink.muted, fontSize: 11, textAnchor: "middle" } }} />
              <ReferenceLine y={0} stroke={ink.baseline} />
              {markYear && <ReferenceLine x={markYear} stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />}
              <Tooltip content={<TipCiclo />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.3 }} />
              <Bar dataKey="dio" stackId="c" fill={C.dio} isAnimationActive={false} />
              <Bar dataKey="dso" stackId="c" fill={C.dso} isAnimationActive={false} />
              <Bar dataKey="dpo" stackId="c" fill={C.dpo} isAnimationActive={false} />
              <Line type="monotone" dataKey="cce" stroke={C.cce} strokeWidth={2.75} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
            </ComposedChart>
          ) : (
            <ComposedChart data={wc} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barCategoryGap="18%">
              <CartesianGrid stroke={ink.grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fill: ink.muted, fontSize: 12 }} tickLine={false} axisLine={{ stroke: ink.baseline }} minTickGap={8} />
              <YAxis tickFormatter={axisMillones} tick={{ fill: ink.muted, fontSize: 12 }} tickLine={false} axisLine={false} width={52}
                label={{ value: "S/ millones", angle: -90, position: "insideLeft", style: { fill: ink.muted, fontSize: 11, textAnchor: "middle" } }} />
              <ReferenceLine y={0} stroke={ink.baseline} />
              {markYear && <ReferenceLine x={markYear} stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />}
              <Tooltip content={<TipKtn />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.3 }} />
              <Bar dataKey="capitalTrabajo" isAnimationActive={false} radius={2}>
                {wc.map((r) => (
                  <Cell key={r.year} fill={r.capitalTrabajo >= 0 ? flow.up : flow.down} />
                ))}
              </Bar>
            </ComposedChart>
          )}
        </ChartBox>
      </div>
    </div>
  );
}
