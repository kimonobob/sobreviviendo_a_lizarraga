import { useMemo, useState } from "react";
import { balanceSegments, yearIndex } from "../../lib/finance";
import { soles, pct } from "../../lib/format";
import { BALANCE_BLOCKS, balanceBlock } from "../../lib/palette";
import { ringSegment, toArcs, polar } from "../../lib/donut";

const VB = 400;
const CX = 200;
const CY = 200;
const R_IN = 94;
const R_OUT = 150;
const GROW = 11;

export function SituacionFinancieraRadial({ data, year }) {
  const i = yearIndex(data, year);
  const segs = useMemo(() => balanceSegments(data, i), [data, i]);
  const arcs = useMemo(() => toArcs(segs.map((s) => s.value), 1.6, 0), [segs]);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);

  const activeIdx = hover ?? pinned;
  const active = activeIdx != null ? segs[activeIdx] : null;
  const totalActivo = data.esf.totales.activo[i];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      {/* Donut */}
      <div className="relative mx-auto min-h-0 w-full max-w-[420px] flex-1">
        <svg viewBox={`0 0 ${VB} ${VB}`} className="h-full w-full" role="img" aria-label={`Situación financiera ${year}`}>
          <defs>
            {BALANCE_BLOCKS.map((b) => (
              <linearGradient key={b.id} id={`grad-${b.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={b.g[0]} />
                <stop offset="100%" stopColor={b.g[1]} />
              </linearGradient>
            ))}
          </defs>

          {/* segmentos */}
          {segs.map((s, idx) => {
            const a = arcs[idx];
            const on = activeIdx === idx;
            const grow = on ? GROW : 0;
            const [dx, dy] = on ? polar(0, 0, 6, a.mid) : [0, 0];
            const blk = balanceBlock(s.id);
            return (
              <path
                key={s.id}
                d={ringSegment(CX + dx, CY + dy, R_IN, R_OUT + grow, a.a0, a.a1)}
                fill={`url(#grad-${s.id})`}
                stroke="var(--surface-1)"
                strokeWidth={2}
                style={{
                  cursor: "pointer",
                  transition: "d 180ms ease, filter 180ms ease",
                  filter: on ? `drop-shadow(0 3px 8px ${blk.g[0]}66)` : "none",
                  opacity: activeIdx == null || on ? 1 : 0.72,
                }}
                onMouseEnter={() => setHover(idx)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setPinned((p) => (p === idx ? null : idx))}
              />
            );
          })}

          {/* % por segmento (fuera del anillo) */}
          {segs.map((s, idx) => {
            const a = arcs[idx];
            const [lx, ly] = polar(CX, CY, R_OUT + 15, a.mid);
            return (
              <text
                key={`p-${s.id}`}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="tnum"
                style={{ fontSize: 11, fontWeight: 600, fill: "var(--text-secondary)", pointerEvents: "none" }}
              >
                {pct(s.pctLado, 0)}
              </text>
            );
          })}

          {/* círculo central */}
          <circle cx={CX} cy={CY} r={R_IN - 6} fill="var(--surface-1)" stroke="var(--border-hair)" />
          {active ? (
            <>
              <text x={CX} y={CY - 26} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: balanceBlock(active.id).g[0] }}>
                {active.label.length > 16 ? balanceBlock(active.id).label.replace(" No ", " No ") : active.label}
              </text>
              <text x={CX} y={CY + 2} textAnchor="middle" className="tnum" style={{ fontSize: 20, fontWeight: 700, fill: "var(--text-primary)" }}>
                {soles(active.value)}
              </text>
              <text x={CX} y={CY + 24} textAnchor="middle" className="tnum" style={{ fontSize: 12, fill: "var(--text-secondary)" }}>
                {pct(active.pctLado)} de {active.lado === "activo" ? "activos" : "financiam."}
              </text>
              <text x={CX} y={CY + 42} textAnchor="middle" style={{ fontSize: 10, fill: "var(--text-muted)" }}>
                {pinned === activeIdx ? "fijado · clic para soltar" : "clic para fijar"}
              </text>
            </>
          ) : (
            <>
              <text x={CX} y={CY - 20} textAnchor="middle" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
                Situación Financiera
              </text>
              <text x={CX} y={CY + 4} textAnchor="middle" className="tnum" style={{ fontSize: 30, fontWeight: 700, fill: "var(--brand)" }}>
                {year}
              </text>
              <text x={CX} y={CY + 28} textAnchor="middle" className="tnum" style={{ fontSize: 12, fill: "var(--text-secondary)" }}>
                Activo {soles(totalActivo)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* leyenda / detalle */}
      <ul className="flex shrink-0 flex-col justify-center gap-1.5 sm:w-[46%]">
        {segs.map((s, idx) => {
          const blk = balanceBlock(s.id);
          const on = activeIdx === idx;
          return (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setHover(idx)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setPinned((p) => (p === idx ? null : idx))}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors ${
                  on ? "bg-plane" : "hover:bg-plane/60"
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: `linear-gradient(135deg, ${blk.g[0]}, ${blk.g[1]})` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{s.label}</span>
                </span>
                <span className="tnum shrink-0 text-right text-xs text-ink-secondary">
                  {soles(s.value)}
                  <span className="ml-1.5 text-ink-muted">{pct(s.pctLado, 0)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
