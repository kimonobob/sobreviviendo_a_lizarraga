import { useState } from "react";
import { yearIndex, block } from "../../lib/finance";
import { soles } from "../../lib/format";

// Simplified but recognizable SVG paths for South American countries.
// viewBox 0 0 200 250

const COUNTRIES = [
  {
    id: "hn", flag: "🇭🇳", name: "Centroamérica", labelX: 18, labelY: 8,
    path: "M10 8 L28 13 L35 22 L25 28 L12 18Z",
    fill: "var(--series-7)", fillOpacity: 0.35,
    negocio: "Consumo masivo (exportaciones y distribución)",
    marcas: "Portafolio de exportación",
    nota: "Presencia comercial y exportaciones a Centroamérica.",
  },
  {
    id: "co", flag: "🇨🇴", name: "Colombia", labelX: 55, labelY: 30,
    path: "M35 22 L58 18 L78 32 L72 52 L48 58 L32 48Z",
    fill: "var(--series-2)", fillOpacity: 0.35,
    negocio: "Consumo masivo", marcas: "Portafolio regional",
    nota: "Presencia comercial en el norte de la región.",
  },
  {
    id: "ec", flag: "🇪🇨", name: "Ecuador", labelX: 22, labelY: 53,
    path: "M32 48 L48 58 L38 68 L22 58Z",
    fill: "var(--series-5)", fillOpacity: 0.35,
    negocio: "Consumo masivo y cuidado del hogar", marcas: "Portafolio regional",
    nota: "Operación de consumo masivo en la región andina.",
  },
  {
    id: "pe", flag: "🇵🇪", name: "Perú", sede: true, labelX: 40, labelY: 78,
    path: "M22 58 L38 68 L48 58 L72 52 L92 78 L78 112 L52 108 L38 84Z",
    fill: "var(--brand)", fillOpacity: 0.5,
    negocio: "Sede / matriz · Consumo masivo, B2B, Acuicultura y Molienda",
    marcas: "Primor, Bolívar, Don Vittorio, Sapolio, Blanca Flor",
    nota: "Mercado principal y centro de las operaciones del grupo.",
  },
  {
    id: "bo", flag: "🇧🇴", name: "Bolivia", labelX: 98, labelY: 96,
    path: "M92 78 L112 102 L102 122 L78 112Z",
    fill: "var(--series-4)", fillOpacity: 0.35,
    negocio: "Consumo masivo (aceites, jabones)", marcas: "Fino",
    nota: "Ingreso vía adquisición de Industrias de Aceite (marca Fino), líder local.",
  },
  {
    id: "br", flag: "🇧🇷", name: "Brasil", labelX: 135, labelY: 82,
    path: "M78 32 L102 38 L122 42 L132 32 L182 62 L162 108 L142 138 L118 132 L112 102 L92 78 L72 52Z",
    fill: "var(--series-3)", fillOpacity: 0.25,
    negocio: "Acuicultura y consumo", marcas: "Portafolio de acuicultura",
    nota: "Expansión en acuicultura vía adquisiciones.",
  },
  {
    id: "cl", flag: "🇨🇱", name: "Chile", labelX: 54, labelY: 172,
    path: "M52 108 L78 112 L62 168 L72 238 L52 238 L42 168Z",
    fill: "var(--series-6)", fillOpacity: 0.35,
    negocio: "Acuicultura (nutrición para salmón)", marcas: "Salmofood",
    nota: "Negocio de acuicultura orientado a exportación.",
  },
  {
    id: "ar", flag: "🇦🇷", name: "Argentina", labelX: 98, labelY: 178,
    path: "M78 112 L102 122 L118 132 L112 152 L132 158 L102 208 L72 238 L62 168Z",
    fill: "var(--series-2)", fillOpacity: 0.3,
    negocio: "Consumo masivo (pastas, salsas, galletas)", marcas: "Sao, Okebon, Zorro",
    nota: "Plataforma de consumo masivo en el Cono Sur.",
  },
];

// Context countries (non-interactive, shown for geographic reference)
const CONTEXT = [
  { id: "ve", path: "M58 18 L98 22 L102 38 L78 32Z" },
  { id: "gy", path: "M98 22 L132 32 L122 42 L102 38Z" },
  { id: "py", path: "M112 102 L118 132 L102 122Z" },
  { id: "uy", path: "M118 132 L142 138 L132 158 L112 152Z" },
];

export function OperationsMap({ data, year }) {
  const i = yearIndex(data, year);
  const [hover, setHover] = useState(null);
  const [sel, setSel] = useState("pe");

  const anc = block(data, "activo_no_corriente");
  const inv = anc?.cuentas.find((c) => c.id.startsWith("inversiones_en_subsidiarias"));
  const invVal = inv ? inv.values[i] : null;

  const detail = COUNTRIES.find((c) => c.id === sel);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row">
      {/* Map */}
      <div
        className="map-dot-grid relative min-h-[160px] flex-1 overflow-hidden rounded-lg border border-hair"
        style={{ background: "var(--plane)" }}
        onClick={() => setSel(null)}
      >
        <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
          {/* Context countries (faint) */}
          {CONTEXT.map((c) => (
            <path
              key={c.id}
              d={c.path}
              fill="var(--gridline)"
              fillOpacity={0.4}
              stroke="var(--baseline)"
              strokeWidth={0.3}
              strokeLinejoin="round"
            />
          ))}

          {/* Interactive countries */}
          {COUNTRIES.map((c) => {
            const on = hover === c.id || sel === c.id;
            return (
              <path
                key={c.id}
                d={c.path}
                className="country-path"
                fill={c.fill}
                fillOpacity={on ? (c.fillOpacity + 0.3) : c.fillOpacity}
                stroke={c.sede ? "var(--brand)" : "var(--baseline)"}
                strokeWidth={c.sede ? 1.2 : 0.5}
                strokeLinejoin="round"
                style={on ? { filter: `drop-shadow(0 0 4px ${c.fill})`, transform: "scale(1.015)", transformOrigin: "center", transformBox: "fill-box" } : undefined}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => { e.stopPropagation(); setSel(c.id); }}
              />
            );
          })}

          {/* Labels with connecting dots + lines */}
          {COUNTRIES.map((c) => {
            const on = hover === c.id || sel === c.id;
            return (
              <g key={`lbl-${c.id}`} className="country-label">
                <circle cx={c.labelX} cy={c.labelY} r={1.2} fill={on ? "var(--brand)" : "var(--text-secondary)"} />
                <line x1={c.labelX + 1.5} y1={c.labelY} x2={c.labelX + 6} y2={c.labelY - 4} stroke={on ? "var(--brand)" : "var(--baseline)"} strokeWidth={0.4} strokeOpacity={0.6} />
                <text
                  x={c.labelX + 7}
                  y={c.labelY - 4}
                  fill={on ? "var(--brand)" : "var(--text-primary)"}
                  fontSize={5}
                  fontWeight={on ? 700 : 500}
                  dominantBaseline="middle"
                >
                  {c.flag} {c.name}
                </text>
              </g>
            );
          })}

          {/* Sede glow for Peru */}
          <path
            d={COUNTRIES.find((c) => c.id === "pe").path}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeOpacity={0.4}
            style={{ filter: "drop-shadow(0 0 3px var(--brand))" }}
            className="pointer-events-none"
          />
        </svg>

        <span className="absolute bottom-1 left-2 text-[9px] text-ink-muted">Presencia operativa · clic para detalles</span>
      </div>

      {/* Detail panel */}
      <div className="flex shrink-0 flex-col gap-1.5 sm:w-[46%]">
        <div className="rounded-md border border-hair bg-surface px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-ink-muted">Inversión en subsidiarias y asociadas · {year}</div>
          <div className="tnum text-lg font-bold text-brand">{soles(invVal)}</div>
          <div className="text-[10px] text-ink-muted">Método de participación (agregado del grupo)</div>
        </div>
        {detail ? (
          <div className="min-h-0 flex-1 rounded-md border border-hair bg-plane px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{detail.flag}</span>
              <span className="text-sm font-semibold text-ink">{detail.name}</span>
              {detail.sede && <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-semibold text-white">SEDE</span>}
            </div>
            <dl className="mt-1.5 space-y-1 text-[11px]">
              <div>
                <dt className="text-ink-muted">Negocio</dt>
                <dd className="text-ink-secondary">{detail.negocio}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Marcas clave</dt>
                <dd className="text-ink-secondary">{detail.marcas}</dd>
              </div>
              <div>
                <dd className="text-ink-secondary italic border-l-2 pl-2" style={{ borderColor: "var(--brand)" }}>{detail.nota}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center rounded-md border border-dashed border-hair px-3 py-2 text-[11px] text-ink-muted">
            Haz clic en un país para ver sus operaciones. La info por país es presencia operativa pública; no forma parte de los EEFF separados.
          </div>
        )}
      </div>
    </div>
  );
}
