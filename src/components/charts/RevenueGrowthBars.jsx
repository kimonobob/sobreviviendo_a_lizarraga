import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { revenueYoY } from "../../lib/finance";
import { soles, pct, axisMillones } from "../../lib/format";
import { ink } from "../../lib/palette";
import { ChartBox } from "../ui/ChartBox";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";

function RevTip({ active, payload, label, markYear }) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === "ingresos");
  const growth = payload.find((p) => p.dataKey === "yoy");
  return (
    <TooltipBox title={label}>
      {rev && (
        <TooltipRow
          label="Ingresos"
          value={soles(rev.value)}
          color={label === markYear ? "var(--brand)" : "var(--seq-mid)"}
        />
      )}
      {growth && growth.value != null && (
        <TooltipRow
          label="Crecimiento YoY"
          value={pct(growth.value)}
          color="var(--series-3)"
        />
      )}
    </TooltipBox>
  );
}

export function RevenueGrowthBars({ data, markYear, chart }) {
  const series = useMemo(() => revenueYoY(data), [data]);

  return (
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
            yAxisId="ingresos"
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
          <YAxis
            yAxisId="yoy"
            orientation="right"
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: ink.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <ReferenceLine y={0} yAxisId="yoy" stroke={ink.baseline} />
          <Tooltip
            content={<RevTip markYear={markYear} />}
            cursor={{ stroke: ink.baseline }}
          />
          <Bar
            yAxisId="ingresos"
            dataKey="ingresos"
            name="Ingresos"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          >
            {series.map((entry) => (
              <Cell
                key={entry.year}
                fill={entry.year === markYear ? "var(--brand)" : "var(--seq-mid)"}
                fillOpacity={entry.year === markYear ? 1 : 0.6}
              />
            ))}
          </Bar>
          <Line
            yAxisId="yoy"
            type="monotone"
            dataKey="yoy"
            name="Crecimiento YoY"
            stroke="var(--series-3)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ChartBox>
    </div>
  );
}
