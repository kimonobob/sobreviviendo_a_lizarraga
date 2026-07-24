import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ratioValue } from "../../lib/format";
import { ink, SERIES_VARS } from "../../lib/palette";
import { SegToggle } from "../ui/Toggle";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";
import { ChartBox } from "../ui/ChartBox";

// Aplana todos los ratios y asigna un color ESTABLE por id (identidad, no rango).
function useFlatRatios(data) {
  return useMemo(() => {
    const flat = [];
    data.ratios.grupos.forEach((g) => {
      g.items.forEach((it) => {
        if (it.id === "roe_dupont") return; // duplica ROE; se ve en el gráfico DuPont
        flat.push({ ...it, group: g.label });
      });
    });
    const color = {};
    flat.forEach((r, i) => {
      color[r.id] = `var(${SERIES_VARS[i % SERIES_VARS.length]})`;
    });
    return { flat, color };
  }, [data]);
}

const DEFAULT = ["roa", "roe"];

// `selected`/`mode` pueden venir controlados (para compartir estado con la
// versión de impresión); si no, la tarjeta maneja su propio estado.
export function RatioPanel({ data, markYear, selected: selProp, onSelected, mode: modeProp, onMode, chartOnly = false, chart }) {
  const { flat, color } = useFlatRatios(data);
  const byId = useMemo(() => Object.fromEntries(flat.map((r) => [r.id, r])), [flat]);
  const [selInner, setSelInner] = useState(DEFAULT);
  const [modeInner, setModeInner] = useState("valor"); // valor | index
  const selected = selProp ?? selInner;
  const mode = modeProp ?? modeInner;
  const setSelected = (updater) => {
    const next = typeof updater === "function" ? updater(selected) : updater;
    (onSelected ?? setSelInner)(next);
  };
  const setMode = onMode ?? setModeInner;

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const rows = useMemo(() => {
    const firsts = {};
    selected.forEach((id) => {
      firsts[id] = byId[id].values.find((v) => v != null);
    });
    return data.meta.years.map((year, i) => {
      const row = { year };
      selected.forEach((id) => {
        const v = byId[id].values[i];
        row[id] = v == null ? null : mode === "index" ? (v / firsts[id]) * 100 : v;
      });
      return row;
    });
  }, [data, selected, mode, byId]);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipBox title={label}>
        {selected.map((id) => {
          const p = payload.find((x) => x.dataKey === id);
          if (!p || p.value == null) return null;
          const raw = byId[id].values[data.meta.years.indexOf(label)];
          return (
            <TooltipRow
              key={id}
              color={color[id]}
              label={byId[id].label}
              value={
                mode === "index"
                  ? `${p.value.toFixed(0)} · ${ratioValue(raw, byId[id].formato)}`
                  : ratioValue(raw, byId[id].formato)
              }
            />
          );
        })}
      </TooltipBox>
    );
  };

  const singleFormato =
    selected.length > 0 && selected.every((id) => byId[id].formato === byId[selected[0]].formato)
      ? byId[selected[0]].formato
      : null;

  const yFmt = (v) => {
    if (mode === "index") return v.toFixed(0);
    if (singleFormato === "pct") return `${(v * 100).toFixed(0)}%`;
    if (singleFormato === "dias") return v.toFixed(0);
    if (singleFormato === "x") return `${v.toFixed(1)}x`;
    return v.toFixed(1);
  };

  const chartBlock = (
    <div className="min-h-0 flex-1">
      <ChartBox w={chart?.w} h={chart?.h}>
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={ink.grid} vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: ink.muted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: ink.baseline }}
            minTickGap={12}
          />
          <YAxis
            tickFormatter={yFmt}
            tick={{ fill: ink.muted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          {mode === "index" && <ReferenceLine y={100} stroke={ink.baseline} strokeDasharray="3 3" />}
          {markYear && (
            <ReferenceLine x={markYear} stroke={ink.baseline} strokeDasharray="3 3" strokeOpacity={0.7} />
          )}
          <Tooltip content={<Tip />} cursor={{ stroke: ink.baseline }} />
          {selected.map((id) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              name={byId[id].label}
              stroke={color[id]}
              strokeWidth={id === "roe" || id === "roa" ? 2.5 : 2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartBox>
    </div>
  );

  // Versión para impresión: solo leyenda de lo seleccionado + gráfico.
  if (chartOnly) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[11px] uppercase tracking-wide text-ink-muted">
            {mode === "index" ? "Base 100" : "Valor"}:
          </span>
          {selected.map((id) => (
            <span key={id} className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color[id] }} />
              {byId[id].label.replace(/\s*\(.*?\)\s*/g, "")}
            </span>
          ))}
        </div>
        {chartBlock}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* selector de ratios agrupado */}
      <div className="flex shrink-0 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-ink-muted">
            Elige los ratios a comparar · {selected.length} activos
          </span>
          <SegToggle
            value={mode}
            onChange={setMode}
            options={[
              { value: "valor", label: "Valor" },
              { value: "index", label: "Base 100" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          {data.ratios.grupos.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-1">
              <span className="w-full text-[9px] uppercase tracking-wide text-ink-muted sm:w-20 sm:shrink-0">
                {g.label}
              </span>
              {g.items.filter((it) => it.id !== "roe_dupont").map((it) => {
                const on = selected.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                      on
                        ? "border-transparent text-ink"
                        : "border-hair text-ink-secondary hover:border-ink-muted"
                    }`}
                    style={on ? { background: "var(--plane)" } : undefined}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: on ? color[it.id] : "var(--baseline)" }}
                    />
                    {it.label.replace(/\s*\(.*?\)\s*/g, "")}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* gráfico */}
      {chartBlock}
      {mode === "valor" && !singleFormato && (
        <p className="text-xs text-ink-muted">
          Seleccionaste ratios de distinta unidad (x, %, días). Para comparar tendencias usa{" "}
          <span className="text-ink-secondary">Base 100</span>.
        </p>
      )}
    </div>
  );
}
