import { useState } from "react";

// Sparkline SVG interactivo: dibuja la tendencia de una serie, resalta el punto
// del año actual y muestra un tooltip (año + valor) al pasar el mouse.
// Todo con variables CSS para respetar el tema.
const W = 100;
const H = 34;
const PAD = 3;

export function Sparkline({ values, years, currentIndex, color = "var(--brand)", format = (v) => v }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const pts = values
    .map((v, idx) => ({ v, idx, year: years[idx] }))
    .filter((p) => p.v != null);
  if (pts.length < 2) return <div className="h-[34px]" />;

  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const n = values.length;

  const x = (idx) => PAD + (idx / (n - 1)) * (W - 2 * PAD);
  const y = (v) => H - PAD - ((v - min) / span) * (H - 2 * PAD);

  const line = pts.map((p, k) => `${k === 0 ? "M" : "L"} ${x(p.idx).toFixed(2)} ${y(p.v).toFixed(2)}`).join(" ");
  const area = `${line} L ${x(pts[pts.length - 1].idx).toFixed(2)} ${H - PAD} L ${x(pts[0].idx).toFixed(2)} ${H - PAD} Z`;

  const cur = pts.find((p) => p.idx === currentIndex) ?? pts[pts.length - 1];
  const active = hoverIdx != null ? pts.find((p) => p.idx === hoverIdx) : null;
  const shown = active ?? cur;

  const gid = `spark-${Math.round(x(cur.idx))}-${color.replace(/[^a-z0-9]/gi, "")}`;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - r.left) / r.width;
    const rawIdx = Math.round(frac * (n - 1));
    // acercar al punto no-nulo más próximo
    const near = pts.reduce((a, b) => (Math.abs(b.idx - rawIdx) < Math.abs(a.idx - rawIdx) ? b : a));
    setHoverIdx(near.idx);
  };

  return (
    <div className="relative w-full" onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[34px] w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {/* punto del año actual */}
        <circle cx={x(cur.idx)} cy={y(cur.v)} r="2.2" fill={color} stroke="var(--surface-1)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {/* marcador de hover */}
        {active && (
          <>
            <line x1={x(active.idx)} y1={PAD} x2={x(active.idx)} y2={H - PAD} stroke="var(--baseline)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
            <circle cx={x(active.idx)} cy={y(active.v)} r="2.4" fill="var(--surface-1)" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {/* tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border border-hair bg-surface px-1.5 py-0.5 text-[9px] shadow-sm"
          style={{ left: `${(active.idx / (n - 1)) * 100}%` }}
        >
          <span className="tnum text-ink-muted">{shown.year}</span>{" "}
          <span className="tnum font-semibold text-ink">{format(shown.v)}</span>
        </div>
      )}
    </div>
  );
}
