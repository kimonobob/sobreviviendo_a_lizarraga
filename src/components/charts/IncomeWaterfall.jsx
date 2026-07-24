import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { waterfall, yearIndex } from "../../lib/finance";
import { soles, axisMillones } from "../../lib/format";
import { ink, flow } from "../../lib/palette";
import { StaticLegend } from "../ui/Legend";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

const kindColor = (k) => (k === "anchor" ? flow.total : k === "up" ? flow.up : flow.down);

export function IncomeWaterfall({ data, year, chart }) {
  const i = yearIndex(data, year);
  const steps = waterfall(data, i).map((s) => ({
    ...s,
    _base: s.base,
    _span: s.span,
  }));

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const s = payload[0].payload;
    return (
      <TooltipBox title={s.label}>
        <TooltipRow
          color={kindColor(s.kind)}
          label={s.kind === "anchor" ? "Monto" : s.value >= 0 ? "Suma" : "Resta"}
          value={soles(s.value, { sign: s.kind !== "anchor" })}
          strong
        />
        {s.kind !== "anchor" && <TooltipRow label="Acumulado" value={soles(s.cumul)} />}
      </TooltipBox>
    );
  };

  const spanLabel = (props) => {
    const { x, y, width, height, index } = props;
    const s = steps[index];
    if (!s) return null;
    const cx = x + width + 6;
    const cy = y + height / 2;
    return (
      <text
        x={cx}
        y={cy}
        dominantBaseline="middle"
        className="tnum"
        style={{ fontSize: 11, fill: ink.secondary }}
      >
        {soles(s.value, { sign: s.kind !== "anchor" })}
      </text>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <StaticLegend
        items={[
          { id: "a", label: "Subtotal", color: flow.total },
          { id: "u", label: "Suma", color: flow.up },
          { id: "d", label: "Resta", color: flow.down },
        ]}
      />
      <div className="min-h-0 flex-1">
        <ChartBox w={chart?.w} h={chart?.h}>
          <BarChart
            layout="vertical"
            data={steps}
            margin={{ top: 2, right: 58, bottom: 2, left: 2 }}
            barCategoryGap="18%"
          >
            <CartesianGrid stroke={ink.grid} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={axisMillones}
              tick={{ fill: ink.muted, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: ink.baseline }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={102}
              tick={{ fill: ink.secondary, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip content={<Tip />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.3 }} />
            <Bar dataKey="_base" stackId="w" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="_span" stackId="w" isAnimationActive={false} radius={2}>
              {steps.map((s) => (
                <Cell key={s.id} fill={kindColor(s.kind)} />
              ))}
              <LabelList content={spanLabel} />
            </Bar>
          </BarChart>
        </ChartBox>
      </div>
    </div>
  );
}
