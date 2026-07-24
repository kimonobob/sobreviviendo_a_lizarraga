import { useMemo, useState } from "react";
import { yearIndex } from "../../lib/finance";
import { soles, pct } from "../../lib/format";
import { TooltipBox, TooltipRow } from "../ui/ChartTooltip";

// Marimekko del Estado de Situación Financiera.
// Ancho de columna ∝ peso del bloque sobre el total (Activo = Pasivo+Patrimonio,
// así que la mitad izquierda son activos y la derecha el financiamiento).
// Alto de cada segmento ∝ participación de la cuenta dentro del bloque.

const VB_W = 1000;
const VB_H = 460;
const PAD = { top: 44, right: 8, bottom: 26, left: 8 };
const COL_GAP = 4;
const SIDE_GAP = 30;
const SEG_GAP = 2;

const BLOCK_COLOR = {
  activo_corriente: "var(--series-2)",
  activo_no_corriente: "var(--series-5)",
  pasivo_corriente: "var(--series-4)",
  pasivo_no_corriente: "var(--series-7)",
  patrimonio: "var(--series-1)",
};

// Etiquetas cortas para columnas angostas (evita truncar a algo ambiguo)
const SHORT_LABEL = {
  activo_corriente: "Activo Corr.",
  activo_no_corriente: "Activo No Corr.",
  pasivo_corriente: "Pasivo Corr.",
  pasivo_no_corriente: "Pasivo No Corr.",
  patrimonio: "Patrimonio",
};

function buildLayout(bloques, i) {
  const plotX = PAD.left;
  const plotY = PAD.top;
  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;

  const totals = bloques.map((b) => Math.max(0, b.total?.[i] ?? 0));
  const grand = totals.reduce((a, b) => a + b, 0) || 1;

  // 1 gap ancho entre lados (tras activo_no_corriente) + gaps angostos
  const gapsW = SIDE_GAP + COL_GAP * (bloques.length - 2);
  const availW = plotW - gapsW;

  let x = plotX;
  return bloques.map((b, bi) => {
    const w = (totals[bi] / grand) * availW;
    const colX = x;
    x += w + (bloques[bi]?.id === "activo_no_corriente" ? SIDE_GAP : COL_GAP);

    // Segmentos por cuenta (normalizados por suma de |valor| para llenar la columna)
    const cuentas = b.cuentas
      .map((c) => ({ id: c.id, label: c.label, value: c.value ?? c.values[i] }))
      .filter((c) => c.value != null && c.value !== 0);
    const absSum = cuentas.reduce((a, c) => a + Math.abs(c.value), 0) || 1;

    let yCursor = plotY + plotH; // apila desde la base
    const segs = cuentas.map((c, ci) => {
      const frac = Math.abs(c.value) / absSum;
      const h = frac * plotH;
      const segH = Math.max(0, h - (ci < cuentas.length - 1 ? SEG_GAP : 0));
      const segY = yCursor - h;
      yCursor -= h;
      return {
        key: `${b.id}:${c.id}`,
        label: c.label,
        value: c.value,
        pctBlock: c.value / (b.total?.[i] || 1),
        x: colX,
        y: segY,
        w,
        h: Math.max(segH, 0),
        color: BLOCK_COLOR[b.id],
        opacity: 0.92 - (ci % 5) * 0.13,
      };
    });

    return {
      id: b.id,
      label: b.label,
      lado: b.lado,
      total: b.total?.[i] ?? 0,
      weight: totals[bi] / grand,
      x: colX,
      w,
      segs,
    };
  });
}

export function MarimekkoESF({ data, year }) {
  const i = yearIndex(data, year);
  const cols = useMemo(() => buildLayout(data.esf.bloques, i), [data, i]);
  const [hover, setHover] = useState(null);

  const totalActivo = data.esf.totales.activo[i];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="scroll-x">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          style={{ minWidth: 560 }}
          role="img"
          aria-label={`Composición del balance ${year}`}
          onMouseLeave={() => setHover(null)}
        >
          {/* separador sutil entre lado activo y financiamiento */}
          {cols.map((c) =>
            c.id === "activo_no_corriente" ? (
              <line
                key="mid"
                x1={c.x + c.w + SIDE_GAP / 2}
                x2={c.x + c.w + SIDE_GAP / 2}
                y1={PAD.top - 8}
                y2={VB_H - PAD.bottom + 4}
                stroke="var(--gridline)"
                strokeDasharray="2 4"
              />
            ) : null
          )}

          {/* encabezados de bloque: nombre + peso% */}
          {cols.map((c) => (
            <g key={`h-${c.id}`} className="mk-label">
              <text
                x={c.x + c.w / 2}
                y={PAD.top - 24}
                textAnchor="middle"
                style={{ fontSize: 13, fontWeight: 600, fill: "var(--text-primary)" }}
              >
                {c.w > 150 ? c.label : SHORT_LABEL[c.id]}
              </text>
              <text
                x={c.x + c.w / 2}
                y={PAD.top - 9}
                textAnchor="middle"
                className="tnum"
                style={{ fontSize: 12, fill: "var(--text-muted)" }}
              >
                {pct(c.weight)}
              </text>
            </g>
          ))}

          {/* segmentos */}
          {cols.flatMap((c) =>
            c.segs.map((s) => {
              const isHover = hover?.key === s.key;
              return (
                <rect
                  key={s.key}
                  className="mk-rect"
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  rx={2}
                  fill={s.color}
                  fillOpacity={isHover ? 1 : s.opacity}
                  stroke="var(--surface-1)"
                  strokeWidth={isHover ? 1.5 : 0.75}
                  onMouseEnter={() => setHover({ ...s, blockLabel: c.label })}
                  onMouseMove={() => setHover((h) => (h?.key === s.key ? h : { ...s, blockLabel: c.label }))}
                  style={{ cursor: "pointer" }}
                />
              );
            })
          )}

          {/* etiqueta directa del segmento mayor de cada columna, si cabe */}
          {cols.map((c) => {
            const big = c.segs.reduce(
              (m, s) => (s.h > (m?.h ?? 0) ? s : m),
              null
            );
            if (!big || big.h < 26 || big.w < 70) return null;
            return (
              <text
                key={`lbl-${c.id}`}
                className="mk-label"
                x={big.x + big.w / 2}
                y={big.y + big.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
                style={{ fontSize: 11, fill: "#fff", fontWeight: 500 }}
              >
                {pct(big.pctBlock, 0)}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="mt-1 text-center text-xs text-ink-muted">
        Total activo {year}: <span className="tnum text-ink-secondary">{soles(totalActivo)}</span>{" "}
        · izquierda = activos · derecha = pasivos + patrimonio
      </p>

      {hover && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
          <TooltipBox title={hover.blockLabel}>
            <TooltipRow color={hover.color} label={hover.label} value={soles(hover.value)} strong />
            <TooltipRow label="% del bloque" value={pct(hover.pctBlock)} />
          </TooltipBox>
        </div>
      )}
    </div>
  );
}
