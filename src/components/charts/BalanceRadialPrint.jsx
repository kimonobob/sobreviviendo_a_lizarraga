import { balanceSegments } from "../../lib/finance";
import { soles, pct } from "../../lib/format";
import { BALANCE_BLOCKS } from "../../lib/palette";
import { ringSegment, toArcs } from "../../lib/donut";

// Mini radial (sin interacción) para un año.
function MiniDonut({ data, i, year }) {
  const segs = balanceSegments(data, i);
  const arcs = toArcs(segs.map((s) => s.value), 2, 0);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="w-full" style={{ maxWidth: 130 }}>
        {segs.map((s, idx) => (
          <path
            key={s.id}
            d={ringSegment(60, 60, 26, 52, arcs[idx].a0, arcs[idx].a1)}
            fill={`url(#pgrad-${s.id})`}
            stroke="#fff"
            strokeWidth={1}
          />
        ))}
        <text x="60" y="58" textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: "#111" }}>
          {year}
        </text>
        <text x="60" y="72" textAnchor="middle" style={{ fontSize: 9, fill: "#555" }}>
          {soles(data.esf.totales.activo[i])}
        </text>
      </svg>
    </div>
  );
}

export function BalanceRadialPrint({ data }) {
  return (
    <div>
      {/* defs compartidos */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          {BALANCE_BLOCKS.map((b) => (
            <linearGradient key={b.id} id={`pgrad-${b.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={b.g[0]} />
              <stop offset="100%" stopColor={b.g[1]} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      <h2 className="mb-1 text-base font-semibold text-black">
        Estado de Situación Financiera — composición por año (2010–2025)
      </h2>
      <p className="mb-3 text-xs text-neutral-600">
        Anillo = 5 bloques del balance · % de cada bloque sobre su lado (activos / financiamiento).
      </p>

      <div className="grid grid-cols-4 gap-x-4 gap-y-1 md:grid-cols-8">
        {data.meta.years.map((year, i) => (
          <MiniDonut key={year} data={data} i={i} year={year} />
        ))}
      </div>

      {/* leyenda */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {BALANCE_BLOCKS.map((b) => (
          <span key={b.id} className="flex items-center gap-1.5 text-xs text-neutral-700">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: `linear-gradient(135deg, ${b.g[0]}, ${b.g[1]})` }}
            />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
