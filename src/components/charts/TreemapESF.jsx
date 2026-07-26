import { useMemo, useRef, useState } from "react";
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
      className="group absolute overflow-hidden rounded-[3px] text-left text-white transition-all duration-200"
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
  const detail = useMemo(() => (active ? detailOf(data, active, i) : null), [data, active, i]);

  const wrapRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const onMove = (e) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  };

  const GAP = 6;
  const pasivoH = (pasivo / financ) * 100;

  const flipX = pos.x > pos.w * 0.5;
  const flipY = pos.y > pos.h * 0.55;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={wrapRef} className="relative min-h-0 flex-1" onMouseMove={onMove}>
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

        {/* Tooltip flotante: composición del bloque, sigue al cursor (hover) y queda fijo al hacer clic */}
        {detail && (
          <div
            className="pointer-events-none absolute z-10 w-[220px] rounded-[4px] border border-hair bg-surface px-3 py-2 shadow-lg"
            style={{
              left: pos.x + (flipX ? -12 : 12),
              top: pos.y + (flipY ? -12 : 12),
              transform: `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`,
            }}
          >
            <div className="mb-1.5 flex items-baseline justify-between border-b border-hair pb-1">
              <span className="text-[11px] font-semibold text-ink">{tiles[active].label}</span>
              <span className="tnum text-[10px] text-ink-muted">{pct(tiles[active].value / activo, 0)}</span>
            </div>
            <div className="tnum mb-1.5 text-sm font-semibold text-ink">{soles(tiles[active].value)}</div>
            <div className="space-y-0.5">
              {detail.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 flex-1 truncate text-ink-secondary" title={d.label}>{d.label}</span>
                  <span className="tnum shrink-0 whitespace-nowrap font-medium text-ink">{soles(d.value)}</span>
                </div>
              ))}
            </div>
            {selected === active && (
              <div className="mt-1.5 border-t border-hair pt-1 text-[9.5px] text-ink-muted">fijado · clic para soltar</div>
            )}
          </div>
        )}

        {/* Pista sutil cuando no hay bloque activo */}
        {!active && (
          <span className="pointer-events-none absolute bottom-1.5 left-2 text-[9px] text-ink-muted">
            Activo = Pasivo + Patrimonio · pasa el mouse o haz clic
          </span>
        )}
      </div>
    </div>
  );
}
