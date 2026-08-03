import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { yearIndex, erVals, ratioItem, cashCycle } from "../lib/finance";
import { soles, pct, veces, dias, nf0 } from "../lib/format";
import { Card } from "../components/ui/Card";
import { ZoomModal } from "../components/ui/ZoomModal";
import { TreemapESF } from "../components/charts/TreemapESF";
import { OperationsMap } from "../components/charts/OperationsMap";
import {
  DeltaBadge,
  AnnualIncomeStatement,
  KeyRatios,
  AnnualEarningsComposition,
  AnnualEquityStructure,
  DuPontMini,
} from "../components/annual/AnnualPanels";
import {
  EVENTS as TIMELINE_EVENTS,
  categoryById,
  categoryColor,
  eraOf,
} from "../../timeline/timelineData";

// La presentación arrastra sus propios estilos y láminas: solo se carga
// cuando alguien pulsa el botón, no en el arranque del dashboard.
const Presentation = lazy(() =>
  import("../../timeline/Presentation").then((m) => ({ default: m.Presentation }))
);

// ── helpers ──────────────────────────────────────────────────────────────────
function yoy(arr, i) {
  if (i <= 0 || arr[i - 1] == null || arr[i] == null || arr[i - 1] === 0) return null;
  return (arr[i] - arr[i - 1]) / Math.abs(arr[i - 1]);
}


// Eventos estructurales del año (factuales, según las notas de los EEFF).
const EVENTS = {
  2012: "Las inversiones en subsidiarias pasan a método de participación (cambia la comparabilidad del patrimonio).",
  2014: "Utilidad mínima del periodo por el resultado de derivados de materias primas.",
  2018: "Adquisiciones clave: Industrias de Aceite (marca Fino, Bolivia) e Intradevco (Sapolio).",
  2019: "NIIF 16 eleva los pasivos por arrendamiento; consolidación de Intradevco.",
  2021: "Única pérdida neta del periodo; se venden Alicorp Argentina y Pastificio Santa Amália (Brasil).",
  2024: "Reducción de capital y venta del negocio de Molienda (Bolivia/Uruguay).",
  2025: "Continúa la reducción de capital: menor patrimonio eleva el ROE y el apalancamiento.",
};

// ── NARRATIVA + HERO ─────────────────────────────────────────────────────────
function useNarrative(data, i, year) {
  return useMemo(() => {
    const ing = erVals(data, "ingresos");
    const unet = erVals(data, "utilidad_neta");
    const ingY = yoy(ing, i);
    const unetY = yoy(unet, i);
    const margenN = ratioItem(data, "margen_neto")?.values[i];
    const roe = ratioItem(data, "roe")?.values[i];
    const deudaPat = ratioItem(data, "deuda_patrimonio")?.values[i];
    const liq = ratioItem(data, "liquidez_corriente")?.values[i];
    const cce = cashCycle(data)[i]?.cce;

    const b = [];
    // Ventas
    if (i === 0) {
      b.push({ tone: "neutral", text: `Ventas de ${soles(ing[i])} (primer año de la serie).` });
    } else {
      b.push({
        tone: ingY >= 0 ? "good" : "bad",
        text: `Ventas de ${soles(ing[i])}, ${ingY >= 0 ? "+" : ""}${pct(ingY, 1)} frente a ${year - 1}.`,
      });
    }
    // Resultado
    if (unet[i] != null && unet[i] < 0) {
      b.push({ tone: "bad", text: `Pérdida neta de ${soles(unet[i])} — resultado atípico del periodo.` });
    } else {
      b.push({
        tone: unetY == null ? "neutral" : unetY >= 0 ? "good" : "bad",
        text: `Utilidad neta de ${soles(unet[i])}${unetY != null ? ` (${unetY >= 0 ? "+" : ""}${pct(unetY, 0)} vs ${year - 1})` : ""}.`,
      });
    }
    // Rentabilidad
    b.push({ tone: "neutral", text: `Rentabilidad: ROE ${pct(roe)} y margen neto ${pct(margenN)}.` });
    // Estructura / liquidez
    b.push({
      tone: deudaPat != null && deudaPat > 1.5 ? "bad" : "neutral",
      text: `Estructura: apalancamiento (deuda fin./patrimonio) ${veces(deudaPat)}, liquidez corriente ${veces(liq)}, ciclo de efectivo ${dias(cce)}.`,
    });
    // Evento estructural
    if (EVENTS[year]) b.push({ tone: "event", text: EVENTS[year] });
    return b;
  }, [data, i, year]);
}

function toneColor(t) {
  return t === "good" ? "var(--flow-up)" : t === "bad" ? "var(--flow-down)" : t === "event" ? "var(--brand)" : "var(--baseline)";
}

function AnnualHero({ data, year, i }) {
  const bullets = useNarrative(data, i, year);
  const uop = erVals(data, "utilidad_operativa");
  const margenN = ratioItem(data, "margen_neto");
  const cce = cashCycle(data)[i]?.cce;
  const ccePrev = i > 0 ? cashCycle(data)[i - 1]?.cce : null;

  // Stats complementarias (no repiten las del header)
  const stats = [
    { label: "Utilidad operativa", value: soles(uop[i]), delta: yoy(uop, i) },
    {
      label: "Margen neto",
      value: pct(margenN?.values[i]),
      delta: margenN && i > 0 && margenN.values[i - 1] != null ? margenN.values[i] - margenN.values[i - 1] : null,
      ppLabel: true,
    },
    {
      label: "Ciclo de efectivo",
      value: dias(cce),
      delta: ccePrev != null && cce != null ? cce - ccePrev : null,
      diasLabel: true,
      invert: true, // menos días es mejor
    },
  ];

  return (
    <section className="screen-only flex flex-col gap-3 rounded-lg border border-hair bg-surface p-4 lg:flex-row lg:items-stretch lg:gap-5">
      {/* Año protagonista */}
      <div className="flex shrink-0 flex-col justify-center lg:w-40">
        <span className="tnum text-5xl font-extrabold leading-none tracking-tight text-brand">{year}</span>
        <span className="mt-1 text-xs text-ink-secondary">Fotografía anual · qué pasó</span>
      </div>

      {/* Relato */}
      <ul className="flex flex-1 flex-col justify-center gap-1.5 border-t border-hair pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        {bullets.map((bl, k) => (
          <li key={k} className="flex items-start gap-2 text-[12px] leading-snug">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneColor(bl.tone) }} />
            <span className={bl.tone === "event" ? "text-ink-secondary italic" : "text-ink-secondary"}>{bl.text}</span>
          </li>
        ))}
      </ul>

      {/* Stats complementarias */}
      <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-[360px]">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col justify-center gap-0.5 rounded-md border border-hair bg-plane px-3 py-2">
            <span className="text-[9px] uppercase tracking-wide text-ink-muted">{s.label}</span>
            <span className="tnum text-base font-bold leading-tight text-ink">{s.value}</span>
            <DeltaBadge
              value={s.delta}
              invert={s.invert}
              label={
                s.delta == null
                  ? undefined
                  : s.ppLabel
                  ? `${Math.abs(s.delta * 100).toFixed(1)}pp`
                  : s.diasLabel
                  ? `${nf0.format(Math.abs(s.delta))} d`
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── HITO DEL AÑO — abre la presentación de la línea de tiempo en ese año ─────
// Sustituye al cuadro de ciclo de efectivo (que sigue vivo como stat del hero).
// La presentación se abre acotada al periodo del dashboard: la línea de tiempo
// arranca en 1956, pero aquí solo interesa el tramo con EEFF separados.
function AnnualMilestone({ year, fromYear, toYear, onPresent }) {
  const ev = useMemo(() => TIMELINE_EVENTS.find((e) => e.year === year), [year]);
  const era = eraOf(year);
  const accent = ev ? categoryColor(ev.category) : "var(--brand)";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {ev ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
              style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
            >
              {categoryById(ev.category).label}
            </span>
            <span className="text-[11px] leading-none">{ev.flags.join(" ")}</span>
            <span className="ml-auto text-[9px] uppercase tracking-wide text-ink-muted">
              {era.from}–{era.to}
            </span>
          </div>

          <h3 className="text-[13px] font-semibold leading-snug text-ink">{ev.title}</h3>
          <p className="line-clamp-3 text-[11px] leading-snug text-ink-secondary">{ev.text}</p>

          {ev.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ev.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded border border-hair bg-plane px-1.5 py-0.5 text-[9px] text-ink-secondary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-[11px] leading-snug text-ink-secondary">
          {year} no tiene un hito propio en la línea de tiempo. La presentación arranca en el hito
          más cercano dentro de {fromYear}–{toYear}.
        </p>
      )}

      <button
        type="button"
        onClick={onPresent}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: accent }}
        title={`Abrir la presentación a pantalla completa en la lámina de ${year}`}
      >
        <span aria-hidden>▶</span> Presentar {year}
      </button>
      <p className="text-center text-[9px] leading-tight text-ink-muted">
        Recorrido {fromYear}–{toYear} · <span className="font-medium">←</span>{" "}
        <span className="font-medium">→</span> para navegar ·{" "}
        <span className="font-medium">Esc</span> para salir
      </p>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export function AnnualDashboard({ data, year }) {
  const i = yearIndex(data, year);
  const firstYear = data.meta.years[0];
  const lastYear = data.meta.years[data.meta.years.length - 1];
  const [zoomed, setZoomed] = useState(null);
  const [presenting, setPresenting] = useState(false);

  // Si el año no tuviera hito propio, la presentación entra por el más cercano
  // del tramo en vez de saltar al principio.
  const startYear = useMemo(() => {
    const inRange = TIMELINE_EVENTS.filter((e) => e.year >= firstYear && e.year <= lastYear);
    if (inRange.length === 0) return year;
    return inRange.reduce((best, e) =>
      Math.abs(e.year - year) < Math.abs(best.year - year) ? e : best
    ).year;
  }, [year, firstYear, lastYear]);
  const zoom = useCallback((id, title, subtitle) => setZoomed({ id, title, subtitle }), []);
  const closeZoom = useCallback(() => setZoomed(null), []);

  return (
    <div className="animate-fade-in flex flex-col gap-3">
      <AnnualHero data={data} year={year} i={i} />

      <div className="screen-only grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Card compact title="Estado de Resultados" subtitle={`Ventas → utilidad neta · ${year} vs ${year - 1}`}
          className="h-[380px] md:col-span-2" onZoom={() => zoom("er", "Estado de Resultados", `${year} vs ${year - 1}`)}>
          <AnnualIncomeStatement data={data} year={year} i={i} />
        </Card>
        <Card compact title="Composición de la Utilidad Neta" subtitle={`Desglose por componente · ${year}`}
          className="h-[380px] md:col-span-2" onZoom={() => zoom("earnings", "Composición Utilidad Neta", `${year}`)}>
          <AnnualEarningsComposition data={data} i={i} />
        </Card>

        <Card compact title="Estado de Situación Financiera" subtitle={`Activo = Pasivo + Patrimonio · ${year}`}
          className="h-[320px]" onZoom={() => zoom("treemap", "Estado de Situación Financiera", `${year}`)}>
          <TreemapESF data={data} year={year} />
        </Card>
        <Card compact title="Estructura Patrimonial" subtitle={`Pasivo + Patrimonio · ${year}`}
          className="h-[320px]" onZoom={() => zoom("equity", "Estructura Patrimonial", `${year}`)}>
          <AnnualEquityStructure data={data} i={i} />
        </Card>
        {/* Aquí "ampliar" es abrir la presentación a pantalla completa. */}
        <Card compact title="Hito del Año" subtitle={`Qué pasó en ${year} · presentación a pantalla completa`}
          className="h-[320px]" onZoom={() => setPresenting(true)}>
          <AnnualMilestone
            year={year}
            fromYear={firstYear}
            toYear={lastYear}
            onPresent={() => setPresenting(true)}
          />
        </Card>
        <Card compact title="Descomposición DuPont" subtitle={`Desglose del ROE · ${year}`}
          className="h-[320px]" onZoom={() => zoom("dupont", "DuPont", `${year}`)}>
          <DuPontMini data={data} year={year} i={i} />
        </Card>

        <Card compact title="Operaciones por País" subtitle={`Presencia de Alicorp · ${year}`}
          className="h-[380px] md:col-span-2" onZoom={() => zoom("ops", "Operaciones por País", `${year}`)}>
          <OperationsMap data={data} year={year} />
        </Card>
        <Card compact title="Ratios Clave" subtitle={`Los más importantes · ${year} (Δ vs ${year - 1}) · pasa el mouse por la tendencia`}
          className="h-[380px] md:col-span-2" onZoom={() => zoom("ratios", "Ratios Clave", `${year} · tendencia 2010–${year}`)}>
          <KeyRatios data={data} year={year} i={i} />
        </Card>
      </div>

      <ZoomModal open={!!zoomed} onClose={closeZoom} title={zoomed?.title} subtitle={zoomed?.subtitle}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto">
          {zoomed?.id === "er" && <AnnualIncomeStatement data={data} year={year} i={i} />}
          {zoomed?.id === "ratios" && <KeyRatios data={data} year={year} i={i} />}
          {zoomed?.id === "earnings" && <AnnualEarningsComposition data={data} i={i} />}
          {zoomed?.id === "dupont" && <DuPontMini data={data} year={year} i={i} />}
          {zoomed?.id === "equity" && <AnnualEquityStructure data={data} i={i} />}
          {zoomed?.id === "treemap" && <TreemapESF data={data} year={year} />}
          {zoomed?.id === "ops" && <OperationsMap data={data} year={year} />}
        </div>
      </ZoomModal>

      {presenting && (
        <Suspense fallback={null}>
          <Presentation
            startYear={startYear}
            fromYear={firstYear}
            toYear={lastYear}
            onClose={() => setPresenting(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
