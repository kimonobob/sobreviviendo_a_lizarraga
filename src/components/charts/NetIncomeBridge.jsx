import { useState } from "react";
import {
  ComposedChart,
  PieChart,
  Pie,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { netIncomeBridge, netIncomeSeries, yearIndex } from "../../lib/finance";
import { solesMiles, pct, axisMillones } from "../../lib/format";
import { ink } from "../../lib/palette";
import { SegToggle } from "../ui/Toggle";
import { ResponsiveLegend } from "../ui/Legend";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

/**
 * Composición de la utilidad neta: de ventas netas a utilidad neta en cuatro
 * subtotales.
 *
 * Manda el modo anual — es un puente, y un puente se lee de un año. El modo
 * serie es la vista de apoyo: los tres bloques que llevan de la utilidad
 * operativa a la neta, apilados año a año, que es lo que permite ver cuánto
 * del resultado deja de venir de la operación.
 */

// Los tramos que mueven la cifra, en el orden en que se comen las ventas.
// Las anclas del puente (bruta, operativa) no entran: son subtotales, no
// partes, y meterlas en la dona sería contar dos veces lo mismo.
const FLOWS = [
  { id: "costo_ventas", label: "Costo de ventas", color: "var(--series-4)" },
  { id: "gastos_op", label: "Gastos, resultados y otros", color: "var(--series-7)" },
  { id: "fsi", label: "Financ., subsid. e imp.", color: "var(--series-2)" },
  { id: "discontinuadas", label: "Operaciones discontinuadas", color: "var(--series-6)" },
];
const NETA_COLOR = "var(--series-3)";

/**
 * Reparte el año en porciones de dona.
 *
 * La dona se arma sobre el TOTAL APLICADO, no sobre las ventas, y el motivo es
 * que en 6 de los 16 años un tramo suma en vez de restar: las discontinuadas
 * en 2010–2013 y 2025, y las subsidiarias en 2022. Repartiendo sobre ventas,
 * esos años pasarían del 100% y los porcentajes dejarían de significar nada.
 *
 * En los otros 10 años el total aplicado es exactamente las ventas netas, así
 * que el porcentaje se lee tal cual: cuánto de cada sol vendido se va en cada
 * concepto. Los tramos que suman salen fuera del anillo, listados aparte.
 */
function donutParts(data, i) {
  const by = Object.fromEntries(netIncomeBridge(data, i).map((s) => [s.id, s.value]));
  const aplica = [];
  const aporta = [];
  for (const f of FLOWS) {
    const raw = by[f.id] ?? 0;
    if (raw < 0) aplica.push({ ...f, raw, value: -raw });
    else if (raw > 0) aporta.push({ ...f, raw, value: raw });
  }
  const neta = by.utilidad_neta ?? 0;
  const ring = [...aplica];
  if (neta > 0) {
    ring.push({ id: "utilidad_neta", label: "Utilidad neta", color: NETA_COLOR, raw: neta, value: neta });
  }
  const total = ring.reduce((a, s) => a + s.value, 0);
  return { ring, aporta, neta, total, ventas: by.ingresos ?? 0 };
}

function DonutAnual({ data, year }) {
  const i = yearIndex(data, year);
  const { ring, aporta, neta, total, ventas } = donutParts(data, i);
  const [hover, setHover] = useState(null);
  const hov = hover != null ? ring[hover] : null;
  // Cuando nada suma, el total aplicado ES las ventas: el % se lee directo.
  const sobreVentas = Math.abs(total - ventas) < 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative h-[190px] w-full shrink-0 sm:h-full sm:min-h-[170px] sm:w-[46%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ring}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="54%"
              outerRadius="82%"
              paddingAngle={2}
              cornerRadius={3}
              isAnimationActive={false}
              onMouseEnter={(_, idx) => setHover(idx)}
              onMouseLeave={() => setHover(null)}
            >
              {ring.map((s, idx) => (
                <Cell
                  key={s.id}
                  fill={s.color}
                  fillOpacity={hover == null || hover === idx ? 1 : 0.35}
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          {hov ? (
            <>
              <span className="text-[9px] uppercase leading-tight tracking-wide" style={{ color: hov.color }}>
                {hov.label}
              </span>
              <span className="tnum text-base font-bold text-ink">{solesMiles(hov.raw, { sign: true })}</span>
              <span className="tnum text-[10px] text-ink-muted">{pct(hov.value / total)}</span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase tracking-wide text-ink-muted">Utilidad neta</span>
              <span
                className="tnum text-lg font-bold"
                style={{ color: neta >= 0 ? "var(--text-primary)" : "var(--flow-down)" }}
              >
                {solesMiles(neta)}
              </span>
              <span className="tnum text-[10px] text-ink-muted">{pct(neta / (ventas || 1))} de las ventas</span>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 overflow-y-auto">
        {ring.map((s, idx) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded px-1 py-0.5 text-[11px] transition-colors"
            style={{ background: hover === idx ? "var(--plane)" : "transparent" }}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 truncate text-ink-secondary">{s.label}</span>
            <span className="tnum ml-auto shrink-0 font-medium text-ink">{solesMiles(s.raw, { sign: true })}</span>
            <span className="tnum w-11 shrink-0 text-right text-ink-muted">{pct(s.value / total)}</span>
          </div>
        ))}

        {/* Lo que suma en vez de restar no cabe en el anillo, pero tiene que
            estar a la vista o el año no cuadra. */}
        {aporta.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-1 py-0.5 text-[11px]">
            <span className="inline-block h-2 w-2 shrink-0 rounded-sm ring-1 ring-inset" style={{ borderColor: s.color, background: "transparent", boxShadow: `inset 0 0 0 1.5px ${s.color}` }} />
            <span className="min-w-0 truncate text-ink-secondary">{s.label}</span>
            <span className="tnum ml-auto shrink-0 font-medium" style={{ color: "var(--flow-up)" }}>
              {solesMiles(s.raw, { sign: true })}
            </span>
            <span className="w-11 shrink-0 text-right text-[9px] text-ink-muted">suma</span>
          </div>
        ))}

        {/* Una pérdida tampoco es una porción: no queda nada que repartir.
            El centro de la dona ya la canta, pero en la lista haría falta. */}
        {neta <= 0 && (
          <div className="flex items-center gap-2 px-1 py-0.5 text-[11px]">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ boxShadow: `inset 0 0 0 1.5px ${NETA_COLOR}` }}
            />
            <span className="min-w-0 truncate text-ink-secondary">Pérdida neta</span>
            <span className="tnum ml-auto shrink-0 font-medium" style={{ color: "var(--flow-down)" }}>
              {solesMiles(neta)}
            </span>
            <span className="w-11 shrink-0 text-right text-[9px] text-ink-muted">sin resto</span>
          </div>
        )}

        <p className="mt-1 border-t border-hair pt-1 text-[9px] leading-snug text-ink-muted">
          {sobreVentas
            ? `% de las ventas netas (${solesMiles(ventas)}) · S/ en miles`
            : `% del total aplicado (${solesMiles(total)}), mayor que las ventas porque hay tramos que suman · S/ en miles`}
        </p>
      </div>
    </div>
  );
}

const SERIE_PARTS = [
  { id: "operativa", label: "Utilidad operativa", color: "var(--series-3)" },
  { id: "fsi", label: "Financ., subsid. e imp.", color: "var(--series-2)" },
  { id: "discontinuadas", label: "Discontinuadas", color: "var(--series-7)" },
];

function BridgeSerie({ data, markYear, chart }) {
  const rows = netIncomeSeries(data);

  const Tip = ({ active, label }) => {
    if (!active) return null;
    const r = rows[data.meta.years.indexOf(label)];
    if (!r) return null;
    return (
      <TooltipBox title={label}>
        {SERIE_PARTS.map((p) => (
          <TooltipRow
            key={p.id}
            color={p.color}
            label={p.label}
            value={solesMiles(r[p.id], { sign: true })}
          />
        ))}
        <TooltipRow label="Utilidad neta" value={solesMiles(r.neta)} strong />
      </TooltipBox>
    );
  };

  const legendItems = [
    ...SERIE_PARTS,
    { id: "neta", label: "Utilidad neta", color: "var(--text-primary)" },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <div className="min-h-0 flex-1">
        <ChartBox w={chart?.w} h={chart?.h}>
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barCategoryGap="18%">
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: ink.muted, fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: ink.baseline }}
              minTickGap={8}
            />
            <YAxis
              tickFormatter={axisMillones}
              tick={{ fill: ink.muted, fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={40}
              label={{
                value: "S/ millones",
                angle: -90,
                position: "insideLeft",
                style: { fill: ink.muted, fontSize: 8, textAnchor: "middle" },
              }}
            />
            <ReferenceLine y={0} stroke={ink.baseline} />
            {markYear && (
              <ReferenceLine x={markYear} stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />
            )}
            <Tooltip content={<Tip />} cursor={{ fill: "var(--gridline)", fillOpacity: 0.3 }} />
            {SERIE_PARTS.map((p) => (
              <Bar key={p.id} dataKey={p.id} stackId="n" fill={p.color} isAnimationActive={false} />
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
  );
}

export function NetIncomeBridge({
  data,
  year,
  title,
  subtitle,
  chart,
  mode = "anual",
  onMode,
}) {
  const serie = mode === "serie";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          {title && (
            <h2 className="shrink-0 truncate text-[10px] font-semibold uppercase tracking-wide text-ink">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="truncate text-[9px] leading-snug text-ink-secondary">{subtitle}</p>
          )}
        </div>
        {/* La unidad no se repite aquí: la dona ya la declara bajo su leyenda. */}
        {onMode && (
          <SegToggle
            value={mode}
            onChange={onMode}
            options={[
              { value: "anual", label: `Año ${year}` },
              { value: "serie", label: "Serie" },
            ]}
            size="xs"
          />
        )}
      </div>

      {serie ? (
        <BridgeSerie data={data} markYear={year} chart={chart} />
      ) : (
        <DonutAnual data={data} year={year} />
      )}
    </div>
  );
}
