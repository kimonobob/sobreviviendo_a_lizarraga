import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { erVals, ratioItem, yearIndex } from "../lib/finance";
import { soles, pct, veces } from "../lib/format";
import { Card } from "../components/ui/Card";
import { ZoomModal } from "../components/ui/ZoomModal";
import { YearPager } from "../components/ui/YearPager";
import { ZoomInfo, hasZoomInfo } from "../components/ZoomInfo";
import {
  AnnualIncomeStatement,
  KeyRatios,
  AnnualEquityStructure,
} from "../components/annual/AnnualPanels";
import { IncomeStatementLine } from "../components/charts/IncomeStatementLine";
import { TreemapESF } from "../components/charts/TreemapESF";
import { BalanceBarsAllYears } from "../components/charts/BalanceBarsAllYears";
import { OperationsMap } from "../components/charts/OperationsMap";
import { EquityStructureBars } from "../components/charts/EquityStructureBars";
import { RatioPanel } from "../components/charts/RatioPanel";
import { IncomeWaterfall } from "../components/charts/IncomeWaterfall";
import { CashCycleChart } from "../components/charts/CashCycleChart";
import { EarningsCompositionBars } from "../components/charts/EarningsCompositionBars";
import { NetIncomeBridge } from "../components/charts/NetIncomeBridge";
import { MilestoneSlide } from "../components/MilestoneSlide";
import { EVENTS as TIMELINE_EVENTS } from "../../timeline/timelineData";

// La presentación arrastra sus propias láminas y estilos: solo se carga cuando
// alguien la abre, no en el arranque del dashboard.
const Presentation = lazy(() =>
  import("../../timeline/Presentation").then((m) => ({ default: m.Presentation }))
);


function yoy(arr, i) {
  if (i <= 0 || arr[i - 1] == null || arr[i] == null || arr[i - 1] === 0) return null;
  return (arr[i] - arr[i - 1]) / Math.abs(arr[i - 1]);
}

function kpis(data, year) {
  const i = yearIndex(data, year);
  const ing = erVals(data, "ingresos");
  const net = erVals(data, "utilidad_neta");
  return [
    { label: "Ventas netas", value: soles(ing[i]), accent: true, delta: yoy(ing, i) },
    { label: "Utilidad neta", value: soles(net[i]), delta: yoy(net, i) },
    { label: "Margen operativo", value: pct(ratioItem(data, "margen_operativo").values[i]) },
    { label: "ROE", value: pct(ratioItem(data, "roe").values[i]) },
    { label: "Liquidez corriente", value: veces(ratioItem(data, "liquidez_corriente").values[i]) },
    { label: "Deuda fin. / Patrim.", value: veces(ratioItem(data, "deuda_patrimonio").values[i]) },
  ];
}

export function KpiStrip({ data, year, print = false }) {
  const items = kpis(data, year);
  return (
    <div className={`grid shrink-0 gap-2 ${print ? "grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 screen-only"}`}>
      {items.map((k) => (
        <div key={k.label} className={`flex flex-col justify-center rounded-md border border-hair bg-surface px-3 ${print ? "py-1" : "py-1.5"}`}>
          <span className="truncate text-[10px] uppercase tracking-wide text-ink-muted">{k.label}</span>
          <span className="flex items-baseline gap-1.5">
            <span className={`tnum text-lg font-semibold leading-tight ${k.accent ? "text-brand" : "text-ink"}`}>{k.value}</span>
            {k.delta != null && (
              <span className="tnum text-[10px] font-medium" style={{ color: k.delta >= 0 ? "var(--flow-up)" : "var(--flow-down)" }}>
                {k.delta >= 0 ? "▲" : "▼"}
                {pct(Math.abs(k.delta), 0)}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- Reporte de impresión: UNA sola hoja (landscape) -----------------------
function PrintReport({ data, year, ratios }) {
  const selNames = ratios.selected.map((id) => {
    for (const g of data.ratios.grupos) {
      const it = g.items.find((x) => x.id === id);
      if (it) return it.label.replace(/\s*\(.*?\)\s*/g, "");
    }
    return id;
  });
  const box = "break-avoid rounded border border-neutral-300 p-1.5";
  const cap = "mb-0.5 text-[10px] font-semibold uppercase text-neutral-700";
  const cw = 316;
  const ch = 150;
  return (
    <div className="print-report print-only text-black">
      <div className="mb-2 flex items-end justify-between border-b border-neutral-300 pb-1.5">
        <div>
          <h1 className="text-base font-bold">Alicorp S.A.A. — Análisis Financiero</h1>
          <p className="text-[10px] text-neutral-600">{data.meta.base} · {data.meta.unidad} · {data.meta.fuente}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-brand">{year}</div>
          <div className="text-[10px] text-neutral-600">Año de análisis</div>
        </div>
      </div>
      <p className="mb-2 text-[10px] text-neutral-700">
        <strong>Ratios seleccionados:</strong> {selNames.join(" · ")} — vista {ratios.mode === "index" ? "Base 100" : "Valor"}.
      </p>

      <KpiStrip data={data} year={year} print />

      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className={box}>
          <div className={cap}>Estado de Resultados 2010–2025</div>
          <IncomeStatementLine data={data} markYear={year} chart={{ w: cw, h: ch }} />
        </div>
        <div className={box}>
          <div className={cap}>Situación Financiera — por año</div>
          <BalanceBarsAllYears data={data} chart={{ w: cw, h: ch }} />
        </div>
        <div className={box}>
          <div className={cap}>Panel de Ratios · {year}</div>
          <RatioPanel data={data} markYear={year} selected={ratios.selected} mode={ratios.mode} chartOnly chart={{ w: cw, h: ch }} />
        </div>
        <div className={box}>
          <div className={cap}>Cascada del Resultado · {year}</div>
          <IncomeWaterfall data={data} year={year} chart={{ w: cw, h: ch }} />
        </div>
        <div className={box}>
          <div className={cap}>Ciclo de Conversión de Efectivo</div>
          <CashCycleChart data={data} markYear={year} chart={{ w: cw, h: ch }} />
        </div>
        <div className={box}>
          <div className={cap}>Composición de la Utilidad Neta</div>
          <EarningsCompositionBars data={data} markYear={year} chart={{ w: cw, h: ch }} />
        </div>
      </div>

      <p className="mt-1.5 text-[9px] text-neutral-500">
        Base separada — el Activo y la Utilidad neta están dominados por inversiones en subsidiarias (método de participación).
        La reducción de capital 2024–2025 eleva artificialmente el ROE y el apalancamiento.
      </p>
    </div>
  );
}

// Título y bajada de cada ventana ampliada. Se resuelven en cada render y no
// al abrir el modal: dentro se cambia de año y de modo, y la cabecera tiene
// que seguir al gráfico en vez de quedarse con el estado de entrada.
// `anual` = el usuario eligió un año y la serie dio paso a ese ejercicio solo.
const ZOOM_META = {
  income: (y, anual) => [
    "Estado de Resultados",
    anual ? `Solo ${y} · cada línea contra ${y - 1}` : "Ventas · costos · gastos · utilidad neta · 2010–2025",
  ],
  ratios: (y, anual) => [
    "Panel de Ratios",
    anual ? `Ratios clave de ${y} · la tendencia va bajo cada cifra` : "Elige los ratios a comparar",
  ],
  waterfall: (y) => ["Cascada del Resultado", `Ingresos → utilidad neta · ${y}`],
  earnings: (y) => ["Composición Utilidad Neta", `De ventas netas a utilidad neta · ${y}`],
  equity: (y, anual) => [
    "Estructura Patrimonial",
    anual ? `Pasivo + patrimonio · ${y}` : "Pasivo + patrimonio · montos ↔ %",
  ],
  treemap: (y) => ["Estado de Situación Financiera", `Activo = Pasivo + Patrimonio · ${y}`],
  ops: () => ["Operaciones por País", "Presencia de Alicorp · clic para detalles"],
};

// Ventanas cuyo gráfico es una serie 2010–2025 y tienen un equivalente de un
// solo año. Las demás ya son de un año: elegir otro simplemente las redibuja.
// La composición de la utilidad neta queda fuera porque lleva su propio mando
// anual/serie dentro del gráfico.
const HAS_ANNUAL = new Set(["income", "ratios", "equity"]);

export function Dashboard({ data, year, ratios, onGoAnnual }) {
  const [zoomed, setZoomed] = useState(null);

  // El año de la ventana ampliada es suyo: mover la banda de años de abajo
  // cambia lo que se proyecta y nada más. El dashboard de detrás se queda en
  // el año que tenía — para llevárselo está el botón de vista anual.
  const [zoomYear, setZoomYear] = useState(null);
  const shownYear = zoomYear ?? year;

  // La composición de la utilidad neta lleva su propio modo dentro del zoom.
  const [netMode, setNetMode] = useState("anual");

  const zoom = useCallback(
    (id) => {
      setZoomYear(null); // cada ventana entra por el año del dashboard
      setNetMode("anual"); // y la composición, por su vista anual
      setZoomed(id);
    },
    []
  );
  const closeZoom = useCallback(() => {
    setZoomed(null);
    setZoomYear(null);
  }, []);
  // Al abrir se ve la serie completa. En cuanto se elige un año, la ventana
  // pasa a la fotografía de ese ejercicio.
  const anual = zoomYear != null;
  const [zoomTitle, zoomSubtitle] = zoomed ? ZOOM_META[zoomed](shownYear, anual) : [];
  const zi = yearIndex(data, shownYear);

  // La presentación se abre acotada al periodo del dashboard: la línea de
  // tiempo arranca en 1956, pero aquí solo interesa el tramo con EEFF separados.
  const [presenting, setPresenting] = useState(false);
  const firstYear = data.meta.years[0];
  const lastYear = data.meta.years[data.meta.years.length - 1];

  // Si el año marcado no tuviera hito propio, se entra por el más cercano
  // del tramo en vez de saltar al principio.
  const startYear = useMemo(() => {
    const inRange = TIMELINE_EVENTS.filter((e) => e.year >= firstYear && e.year <= lastYear);
    if (inRange.length === 0) return year;
    return inRange.reduce((best, e) =>
      Math.abs(e.year - year) < Math.abs(best.year - year) ? e : best
    ).year;
  }, [year, firstYear, lastYear]);

  return (
    <>
      {/* ---- Pantalla ---- */}
      <div className="screen-only flex flex-col gap-2 lg:min-h-0 lg:flex-1">
        {/* Layout principal: 3 columnas — 40 % | 30 % | 30 % */}
        <div className="dash-layout flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">

          {/* ── Sección izquierda (40 %) ── */}
          <div className="dash-col flex min-h-0 flex-1 flex-col gap-2 lg:w-[40%] lg:max-w-[40%] lg:shrink-0">
            <Card compact className="min-h-[160px] flex-1"
              onZoom={() => zoom("income")}>
              <IncomeStatementLine data={data} markYear={year} title="Estado de Resultados" subtitle="Ventas · costos · gastos · utilidad neta · 2010–2025" />
            </Card>
            <Card compact className="min-h-[160px] flex-1"
              onZoom={() => zoom("ratios")}>
              <RatioPanel data={data} markYear={year} title="Panel de Ratios" subtitle="Elige los ratios a comparar" selected={ratios.selected} mode={ratios.mode} onSelected={ratios.setSelected} onMode={ratios.setMode} />
            </Card>
            <Card compact className="min-h-[160px] flex-1"
              onZoom={() => zoom("waterfall")}>
              <IncomeWaterfall data={data} year={year} title="Cascada del Resultado" subtitle={`Ingresos → utilidad neta · ${year}`} />
            </Card>
          </div>

          {/* ── Sección central (30 %) ── */}
          <div className="dash-col flex min-h-0 flex-1 flex-col gap-2 lg:w-[30%] lg:max-w-[30%] lg:shrink-0">
            <Card compact className="min-h-[160px] flex-[2]"
              onZoom={() => zoom("earnings")}>
              <NetIncomeBridge data={data} year={year} title="Composición Utilidad Neta" subtitle={`De ventas a utilidad neta · ${year}`} />
            </Card>
            <Card compact className="min-h-[160px] flex-[1.5]"
              onZoom={() => zoom("equity")}>
              <EquityStructureBars data={data} markYear={year} title="Estructura Patrimonial" subtitle="Pasivo + patrimonio · montos ↔ %" />
            </Card>
            {/* Aquí "ampliar" es abrir la presentación a pantalla completa. */}
            <Card compact className="min-h-[160px] flex-[2]" onZoom={() => setPresenting(true)}>
              <MilestoneSlide
                year={year}
                title="Hito del Año"
                subtitle={`Línea de tiempo · ${year}`}
                onPresent={() => setPresenting(true)}
              />
            </Card>
          </div>

          {/* ── Sección derecha (30 %) ── */}
          <div className="dash-col flex min-h-0 flex-1 flex-col gap-2 lg:w-[30%] lg:max-w-[30%] lg:shrink-0">
            <Card title="Estado de Situación Financiera" subtitle={`Activo = Pasivo + Patrimonio · ${year}`} compact className="min-h-[200px] lg:flex-1"
              onZoom={() => zoom("treemap")}>
              <TreemapESF data={data} year={year} />
            </Card>
            <Card title="Operaciones por País" subtitle="Presencia de Alicorp · clic para detalles" compact className="min-h-[200px] lg:flex-1"
              onZoom={() => zoom("ops")}>
              <OperationsMap data={data} year={year} />
            </Card>
          </div>
        </div>
      </div>

      {/* ---- Modal de zoom ---- */}
      <ZoomModal
        open={!!zoomed}
        onClose={closeZoom}
        title={zoomTitle}
        subtitle={zoomSubtitle}
        footer={
          <YearPager
            years={data.meta.years}
            year={shownYear}
            onYearChange={setZoomYear}
            note={
              HAS_ANNUAL.has(zoomed)
                ? anual
                  ? `Mostrando solo ${shownYear}. La serie completa sigue a un clic.`
                  : "Serie 2010–2025 · elige un año para ver solo ese ejercicio"
                : `Mostrando ${shownYear} · elige otro año para cambiar el ejercicio`
            }
            onReset={HAS_ANNUAL.has(zoomed) && anual ? () => setZoomYear(null) : undefined}
            onGoAnnual={
              onGoAnnual &&
              ((y) => {
                closeZoom();
                onGoAnnual(y);
              })
            }
          />
        }
      >
        {/* El gráfico a la izquierda; a la derecha, las cifras del año que se
            está proyectando. El mapa se queda con el ancho entero: ya trae su
            propia lista de países al costado. */}
        <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
            {zoomed === "income" &&
              (anual ? (
                <AnnualIncomeStatement data={data} year={shownYear} i={zi} />
              ) : (
                <IncomeStatementLine data={data} markYear={shownYear} title="Estado de Resultados" subtitle="Ventas · costos · gastos · utilidad neta · 2010–2025" />
              ))}
            {zoomed === "ratios" &&
              (anual ? (
                <KeyRatios data={data} year={shownYear} i={zi} />
              ) : (
                <RatioPanel data={data} markYear={shownYear} title="Panel de Ratios" subtitle="Elige los ratios a comparar" selected={ratios.selected} mode={ratios.mode} onSelected={ratios.setSelected} onMode={ratios.setMode} />
              ))}
            {zoomed === "waterfall" && <IncomeWaterfall data={data} year={shownYear} title="Cascada del Resultado" subtitle={`Ingresos → utilidad neta · ${shownYear}`} />}
            {/* Este cuadro trae su propio mando anual/serie: entra en anual,
                que es como se lee un puente, y la serie queda a un clic. */}
            {zoomed === "earnings" && (
              <NetIncomeBridge
                data={data}
                year={shownYear}
                mode={netMode}
                onMode={setNetMode}
                subtitle={netMode === "serie" ? "Operativa → neta, año a año" : "De ventas a utilidad neta"}
              />
            )}
            {zoomed === "equity" &&
              (anual ? (
                <AnnualEquityStructure data={data} i={zi} />
              ) : (
                <EquityStructureBars data={data} markYear={shownYear} title="Estructura Patrimonial" subtitle="Pasivo + patrimonio · montos ↔ %" />
              ))}
            {zoomed === "treemap" && <TreemapESF data={data} year={shownYear} />}
            {zoomed === "ops" && <OperationsMap data={data} year={shownYear} />}
          </div>

          {hasZoomInfo(zoomed) && (
            <aside className="hidden w-[300px] shrink-0 flex-col border-l border-hair pl-4 lg:flex">
              <ZoomInfo id={zoomed} data={data} year={shownYear} ratios={ratios} />
            </aside>
          )}
        </div>
      </ZoomModal>

      {/* ---- Presentación a pantalla completa ---- */}
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

      {/* ---- Impresión (1 hoja) ---- */}
      <PrintReport data={data} year={year} ratios={ratios} />
    </>
  );
}
