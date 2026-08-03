import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { yearIndex, block } from "../../lib/finance";
import { soles } from "../../lib/format";
import { useOperations } from "../../data/useOperations";

// Mapa geográfico REAL de las Américas (Natural Earth, servido localmente).
// Todos los datos por país salen de public/data/alicorp_operaciones_pais.json.
// Coloreo por estado ligado al año seleccionado; hover/clic → panel de detalle.

const COL = {
  context: "var(--map-bg)",
  contextStroke: "var(--border-hair)",
  inactive: "var(--baseline)",
  actual: "var(--series-3)",
  sede: "var(--brand)",
  export: "var(--series-4)",
};

// ¿La operación está activa en ese año?
const isActive = (p, year) => p.desde <= year && (p.salida == null || year <= p.salida);

// Año de exportaciones más cercano disponible al seleccionado.
function nearestExportYear(exp, year) {
  const ys = Object.keys(exp).map(Number);
  if (!ys.length) return null;
  return ys.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a));
}

export function OperationsMap({ data, year }) {
  const { ops, geo, error } = useOperations();
  const [hover, setHover] = useState(null); // iso3
  const [sel, setSel] = useState("PER");
  const [mode, setMode] = useState("ops"); // ops | export

  // Tarjeta de inversión (viene del data financiero — se mantiene intacta)
  const fi = yearIndex(data, year);
  const anc = block(data, "activo_no_corriente");
  const invItem = anc?.cuentas.find((c) => c.id.startsWith("inversiones_en_subsidiarias"));
  const invVal = invItem ? invItem.values[fi] : null;

  const byIso = useMemo(() => {
    const m = {};
    ops?.paises.forEach((p) => (m[p.iso3] = p));
    return m;
  }, [ops]);

  const geoIsos = useMemo(() => new Set(geo?.features.map((f) => f.properties.ISO_A3) ?? []), [geo]);
  const offMap = useMemo(() => (ops?.paises ?? []).filter((p) => !geoIsos.has(p.iso3)), [ops, geoIsos]);

  // Destinos de exportación del año más cercano, casados con países del JSON.
  const expInfo = useMemo(() => {
    if (!ops) return { year: null, isos: new Set(), fuera: [] };
    const ey = nearestExportYear(ops.exportaciones_por_anio, year);
    const dest = ey != null ? ops.exportaciones_por_anio[String(ey)] : [];
    const isos = new Set();
    const fuera = [];
    dest.forEach((name) => {
      const match = ops.paises.find(
        (p) => p.pais.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.pais.split(" ")[0].toLowerCase())
      );
      if (match && geoIsos.has(match.iso3)) isos.add(match.iso3);
      else fuera.push(name);
    });
    return { year: ey, isos, fuera };
  }, [ops, year, geoIsos]);

  const detailIso = hover ?? sel;
  const detail = byIso[detailIso];

  function fillFor(iso) {
    const p = byIso[iso];
    if (mode === "export") {
      if (expInfo.isos.has(iso)) return { fill: COL.export, op: 0.9 };
      if (p && isActive(p, year)) return { fill: COL.actual, op: 0.35 };
      return { fill: COL.context, op: 1 };
    }
    if (!p) return { fill: COL.context, op: 1 };
    if (p.id === "pe" && isActive(p, year)) return { fill: COL.sede, op: 0.9 };
    if (isActive(p, year)) return { fill: COL.actual, op: 0.85 };
    return { fill: COL.inactive, op: 0.55 }; // desinvertido / sin presencia ese año
  }

  // Orden de dibujo: contexto → inactivos → activos → sede → resaltado (encima)
  function zorder(iso) {
    const p = byIso[iso];
    if (iso === detailIso) return 5;
    if (!p) return 0;
    if (p.id === "pe") return 4;
    if (isActive(p, year)) return 3;
    return 1;
  }

  const legend =
    mode === "export"
      ? [
          { c: COL.export, label: `Destino de exportación · ${expInfo.year ?? "—"}` },
          { c: COL.actual, label: "Operación (contexto)" },
        ]
      : [
          { c: COL.sede, label: "Perú · sede" },
          { c: COL.actual, label: "Operación actual" },
          { c: COL.inactive, label: "Desinvertido / sin presencia" },
        ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row">
      {/* Mapa */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-[9px] text-ink-secondary">
                <span className="inline-block h-2 w-2 rounded-sm ring-1 ring-inset ring-black/10" style={{ background: l.c }} />
                {l.label}
              </span>
            ))}
          </div>
          <div className="inline-flex shrink-0 rounded-md border border-hair bg-plane p-0.5">
            {[
              { v: "ops", t: "Operaciones" },
              { v: "export", t: "Exportaciones" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setMode(o.v)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  mode === o.v ? "bg-surface text-brand shadow-[0_0_0_1px_var(--border-hair)]" : "text-ink-secondary hover:text-ink"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>
        </div>

        <div
          // Los países se seleccionan con un clic: el mapa se queda ese clic
          // para él en vez de dejar que la tarjeta lo tome para ampliar.
          data-no-zoom
          className="relative min-h-[180px] flex-1 overflow-hidden rounded-lg border border-hair"
          style={{ background: "var(--map-water)" }}
        >
          {geo && ops ? (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [-72, -12], scale: 300 }}
              width={720}
              height={560}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={geo}>
                {({ geographies }) =>
                  [...geographies]
                    .sort((a, b) => zorder(a.properties.ISO_A3) - zorder(b.properties.ISO_A3))
                    .map((g) => {
                      const iso = g.properties.ISO_A3;
                      const p = byIso[iso];
                      const { fill, op } = fillFor(iso);
                      const on = iso === detailIso && !!p;
                      return (
                        <Geography
                          key={g.rsmKey}
                          geography={g}
                          className={p ? "country-path" : undefined}
                          onMouseEnter={() => p && setHover(iso)}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => p && setSel(iso)}
                          style={{
                            default: {
                              fill,
                              fillOpacity: op,
                              stroke: on ? "var(--brand)" : p ? "var(--surface-1)" : COL.contextStroke,
                              strokeWidth: on ? 1.1 : p ? 0.6 : 0.4,
                              outline: "none",
                              cursor: p ? "pointer" : "default",
                              transform: on ? "scale(1.03)" : "none",
                              transformOrigin: "center",
                              transformBox: "fill-box",
                              transition: "transform .2s ease, fill .2s ease, fill-opacity .2s ease",
                              filter: on ? "brightness(1.12) drop-shadow(0 0 6px var(--map-glow))" : "none",
                            },
                            hover: { fill, fillOpacity: Math.min(1, op + 0.1), outline: "none" },
                            pressed: { fill, outline: "none" },
                          }}
                        />
                      );
                    })
                }
              </Geographies>
            </ComposableMap>
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-ink-muted">
              {error ? `No se pudo cargar el mapa (${error})` : "Cargando mapa…"}
            </div>
          )}
          <span className="pointer-events-none absolute bottom-1 left-2 text-[9px] text-ink-muted">
            Américas · {year} · hover/clic para detalles
          </span>
        </div>

        {/* Chips fuera de encuadre (p. ej. España) */}
        {offMap.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wide text-ink-muted">Fuera del mapa:</span>
            {offMap.map((p) => {
              const on = detailIso === p.iso3;
              return (
                <button
                  key={p.iso3}
                  type="button"
                  onMouseEnter={() => setHover(p.iso3)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSel(p.iso3)}
                  className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] transition-colors ${
                    on ? "border-brand text-brand" : "border-hair text-ink-secondary hover:border-ink-muted"
                  }`}
                >
                  <span>{p.emoji}</span>
                  {p.pais}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel de detalle */}
      <div className="flex shrink-0 flex-col gap-1.5 sm:w-[46%]">
        <div className="rounded-md border border-hair bg-surface px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-ink-muted">Inversión en subsidiarias y asociadas · {year}</div>
          <div className="tnum text-lg font-bold text-brand">{soles(invVal)}</div>
          <div className="text-[10px] text-ink-muted">Método de participación (agregado del grupo)</div>
        </div>

        {detail ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-hair bg-plane px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg">{detail.emoji}</span>
              <span className="text-sm font-semibold text-ink">{detail.pais}</span>
              {detail.id === "pe" && <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-semibold text-white">SEDE</span>}
              {detail.estado === "desinvertido" ? (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white" style={{ background: "var(--baseline)" }}>
                  DESINVERTIDO{detail.salida ? ` · ${detail.salida}` : ""}
                </span>
              ) : (
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
                  style={{ background: isActive(detail, year) ? COL.actual : "var(--baseline)" }}
                >
                  {isActive(detail, year) ? "ACTUAL" : "SIN PRESENCIA " + year}
                </span>
              )}
            </div>
            <dl className="mt-1.5 space-y-1 text-[11px]">
              <div>
                <dt className="text-ink-muted">Rol</dt>
                <dd className="text-ink-secondary">{detail.rol} · desde {detail.desde}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Líneas de negocio</dt>
                <dd className="text-ink-secondary">{detail.lineas_negocio}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Entidades</dt>
                <dd className="text-ink-secondary">{detail.entidades}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Marcas</dt>
                <dd className="text-ink-secondary">{detail.marcas}</dd>
              </div>
              <div>
                <dd className="text-[9px] leading-snug text-ink-muted">{detail.fuente}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center rounded-md border border-dashed border-hair px-3 py-2 text-[11px] text-ink-muted">
            Haz clic en un país para ver sus operaciones.
          </div>
        )}

        <p className="text-[9px] leading-snug text-ink-muted">
          EEFF separados: no reportan cifras por país (el detalle del grupo está en el consolidado). Las marcas son de dominio público y no constan en los EEFF.
        </p>
      </div>
    </div>
  );
}
