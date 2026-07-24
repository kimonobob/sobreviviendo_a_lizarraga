import { useMemo, useState } from "react";
import { yearIndex, block } from "../../lib/finance";
import { soles, pct } from "../../lib/format";

// Treemap del Estado de Situación Financiera con SOLO 3 datos:
// Total Activo, Total Pasivo, Total Patrimonio.
// Como Activo = Pasivo + Patrimonio, el Activo ocupa la mitad izquierda y el
// financiamiento (Pasivo + Patrimonio) la derecha. Hover agranda; clic fija el
// detalle (composición por bloque).

const TILE = {
  activo: { label: "Total Activo", g: ["#7c3aed", "#a855f7"] },
  pasivo: { label: "Total Pasivo", g: ["#f97316", "#fdba74"] },
  patrimonio: { label: "Total Patrimonio", g: ["#ec4899", "#f9a8d4"] },
};

function detailOf(data, id, i) {
  if (id === "activo") {
    return [block(data, "activo_corriente"), block(data, "activo_no_corriente")].map((b) => ({
      label: b.label,
      value: b.total[i],
    }));
  }
  if (id === "pasivo") {
    return [block(data, "pasivo_corriente"), block(data, "pasivo_no_corriente")].map((b) => ({
      label: b.label,
      value: b.total[i],
    }));
  }
  // patrimonio: principales cuentas (por magnitud absoluta)
  return block(data, "patrimonio")
    .cuentas.map((c) => ({ label: c.label, value: c.values[i] }))
    .filter((c) => c.value != null)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4);
}

function Tile({ t, activo, hovered, selected, onHover, onSelect, style }) {
  const on = hovered === t.id || selected === t.id;
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(t.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(selected === t.id ? null : t.id)}
      className="group absolute overflow-hidden rounded-lg text-left text-white transition-all duration-200"
      style={{
        ...style,
        background: `linear-gradient(135deg, ${t.g[0]}, ${t.g[1]})`,
        transform: on ? "scale(1.025)" : "scale(1)",
        zIndex: on ? 5 : 1,
        boxShadow: on ? `0 8px 24px ${t.g[0]}66` : "none",
        outline: selected === t.id ? "2px solid rgba(255,255,255,.9)" : "none",
        outlineOffset: -3,
      }}
    >
      <div className="flex h-full flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-90">{t.label}</span>
          <span className="tnum text-[11px] opacity-80">{pct(t.value / activo, 0)}</span>
        </div>
        <div>
          <div className="tnum text-lg font-bold leading-none drop-shadow-sm">{soles(t.value)}</div>
          <div className="mt-0.5 text-[10px] opacity-80">
            {selected === t.id ? "fijado · clic para soltar" : "clic para ver composición"}
          </div>
        </div>
      </div>
    </button>
  );
}

export function TreemapESF({ data, year }) {
  const i = yearIndex(data, year);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const activo = data.esf.totales.activo[i];
  const pasivo = data.esf.totales.pasivo[i];
  const patrimonio = data.esf.totales.patrimonio[i];
  const financ = pasivo + patrimonio || 1;

  const tiles = {
    activo: { id: "activo", value: activo, ...TILE.activo },
    pasivo: { id: "pasivo", value: pasivo, ...TILE.pasivo },
    patrimonio: { id: "patrimonio", value: patrimonio, ...TILE.patrimonio },
  };

  const active = hovered ?? selected;
  const detail = useMemo(() => (selected ? detailOf(data, selected, i) : null), [data, selected, i]);

  const GAP = 6;
  const pasivoH = (pasivo / financ) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="relative min-h-0 flex-1">
        <Tile
          t={tiles.activo}
          activo={activo}
          hovered={hovered}
          selected={selected}
          onHover={setHovered}
          onSelect={setSelected}
          style={{ left: 0, top: 0, bottom: 0, width: `calc(50% - ${GAP / 2}px)` }}
        />
        <Tile
          t={tiles.pasivo}
          activo={activo}
          hovered={hovered}
          selected={selected}
          onHover={setHovered}
          onSelect={setSelected}
          style={{ right: 0, top: 0, width: `calc(50% - ${GAP / 2}px)`, height: `calc(${pasivoH}% - ${GAP / 2}px)` }}
        />
        <Tile
          t={tiles.patrimonio}
          activo={activo}
          hovered={hovered}
          selected={selected}
          onHover={setHovered}
          onSelect={setSelected}
          style={{ right: 0, bottom: 0, width: `calc(50% - ${GAP / 2}px)`, height: `calc(${100 - pasivoH}% - ${GAP / 2}px)` }}
        />
      </div>

      {/* detalle / leyenda */}
      <div className="flex min-h-[42px] shrink-0 items-center gap-3 rounded-md border border-hair bg-plane px-3 py-1.5">
        {detail ? (
          <>
            <span className="text-[11px] font-semibold text-ink">{tiles[selected].label}:</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
              {detail.map((d) => (
                <span key={d.label} className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                  <span className="truncate">{d.label}</span>
                  <span className="tnum font-medium text-ink">{soles(d.value)}</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <span className="text-[11px] text-ink-muted">
            Activo <span className="tnum text-ink-secondary">{soles(activo)}</span> = Pasivo{" "}
            <span className="tnum text-ink-secondary">{soles(pasivo)}</span> + Patrimonio{" "}
            <span className="tnum text-ink-secondary">{soles(patrimonio)}</span> · pasa el mouse o haz clic en un bloque
          </span>
        )}
      </div>
    </div>
  );
}
