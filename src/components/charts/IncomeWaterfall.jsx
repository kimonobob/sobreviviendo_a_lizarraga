import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, LabelList } from "recharts";
import { waterfall, yearIndex } from "../../lib/finance";
import { solesMiles } from "../../lib/format";
import { ink, flow } from "../../lib/palette";
import { ResponsiveLegend } from "../ui/Legend";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

const kindColor = (k) => (k === "anchor" ? flow.total : k === "up" ? flow.up : flow.down);

export function IncomeWaterfall({ data, year, title, subtitle, chart }) {
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
      <TooltipBox title={s.full ?? s.label}>
        <TooltipRow
          color={kindColor(s.kind)}
          label={s.kind === "anchor" ? "Monto" : s.value >= 0 ? "Suma" : "Resta"}
          value={solesMiles(s.value, { sign: s.kind !== "anchor" })}
          strong
        />
        {s.kind !== "anchor" && <TooltipRow label="Acumulado" value={solesMiles(s.cumul)} />}
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
        {solesMiles(s.value, { sign: s.kind !== "anchor" })}
      </text>
    );
  };

  const legendItems = [
    { id: "a", label: "Subtotal", color: flow.total },
    { id: "u", label: "Suma", color: flow.up },
    { id: "d", label: "Resta", color: flow.down },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-baseline gap-2 min-w-0">
          {title && (
            <h2 className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink shrink-0">{title}</h2>
          )}
          {subtitle && (
            <p className="truncate text-[9px] leading-snug text-ink-secondary">{subtitle}</p>
          )}
        </div>
        {/* Las cifras van sin redondear, en miles, como en el EEFF auditado:
            la unidad tiene que estar a la vista o el importe no se puede cotejar. */}
        <span className="shrink-0 text-[9px] tracking-wide text-ink-muted">S/ en miles</span>
      </div>
      <div className="flex min-h-0 flex-1 gap-2">
        <div className="min-h-0 flex-1">
          <ChartBox w={chart?.w} h={chart?.h}>
          <BarChart
            layout="vertical"
            data={steps}
            margin={{ top: 2, right: 74, bottom: 2, left: 2 }}
            barCategoryGap="16%"
          >
            {/* Sin eje numérico ni rejilla: cada tramo ya lleva su cifra exacta
                al lado, y una regla en millones junto a importes en miles solo
                sembraba dudas sobre la unidad. */}
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={126}
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
        <ResponsiveLegend items={legendItems} />
      </div>
    </div>
  );
}
