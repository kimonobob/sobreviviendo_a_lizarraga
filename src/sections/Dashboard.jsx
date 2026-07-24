import { useState, useCallback } from "react";
import { erVals, ratioItem, yearIndex } from "../lib/finance";
import { soles, pct, veces } from "../lib/format";
import { Card } from "../components/ui/Card";
import { ZoomModal } from "../components/ui/ZoomModal";
import { IncomeStatementLine } from "../components/charts/IncomeStatementLine";
import { TreemapESF } from "../components/charts/TreemapESF";
import { BalanceBarsAllYears } from "../components/charts/BalanceBarsAllYears";
import { OperationsMap } from "../components/charts/OperationsMap";
import { EquityStructureBars } from "../components/charts/EquityStructureBars";
import { RatioPanel } from "../components/charts/RatioPanel";
import { IncomeWaterfall } from "../components/charts/IncomeWaterfall";
import { CashCycleChart } from "../components/charts/CashCycleChart";
import { EarningsCompositionBars } from "../components/charts/EarningsCompositionBars";


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

export function Dashboard({ data, year, ratios }) {
  const [zoomed, setZoomed] = useState(null);
  const zoom = useCallback((id, title, subtitle) => setZoomed({ id, title, subtitle }), []);
  const closeZoom = useCallback(() => setZoomed(null), []);

  return (
    <>
      {/* ---- Pantalla ---- */}
      <div className="screen-only flex flex-col gap-2 lg:min-h-0 lg:flex-1">
        {/* Layout principal: 3 columnas — 40 % | 30 % | 30 % */}
        <div className="dash-layout flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">

          {/* ── Sección izquierda (40 %) ── */}
          <div className="dash-col flex min-h-0 flex-1 flex-col gap-2 lg:w-[40%] lg:max-w-[40%] lg:shrink-0">
            <Card compact className="min-h-[160px] flex-1"
              onZoom={() => zoom("income", "Estado de Resultados", "Ventas · costos · gastos · utilidad neta · 2010–2025")}>
              <IncomeStatementLine data={data} markYear={year} title="Estado de Resultados" subtitle="Ventas · costos · gastos · utilidad neta · 2010–2025" />
            </Card>
            <Card compact className="min-h-[160px] flex-1"
              onZoom={() => zoom("ratios", "Panel de Ratios", "Elige los ratios a comparar")}>
              <RatioPanel data={data} markYear={year} title="Panel de Ratios" subtitle="Elige los ratios a comparar" selected={ratios.selected} mode={ratios.mode} onSelected={ratios.setSelected} onMode={ratios.setMode} />
            </Card>
            <Card compact className="min-h-[160px] flex-1"
              onZoom={() => zoom("waterfall", "Cascada del Resultado", `Ingresos → utilidad neta · ${year}`)}>
              <IncomeWaterfall data={data} year={year} title="Cascada del Resultado" subtitle={`Ingresos → utilidad neta · ${year}`} />
            </Card>
          </div>

          {/* ── Sección central (30 %) ── */}
          <div className="dash-col flex min-h-0 flex-1 flex-col gap-2 lg:w-[30%] lg:max-w-[30%] lg:shrink-0">
            <Card compact className="min-h-[160px] flex-[2]"
              onZoom={() => zoom("earnings", "Composición Utilidad Neta", "Operación vs. subsidiarias")}>
              <EarningsCompositionBars data={data} markYear={year} title="Composición Utilidad Neta" subtitle="Operación vs. subsidiarias" />
            </Card>
            <Card compact className="min-h-[160px] flex-[2]"
              onZoom={() => zoom("cycle", "Ciclo de Efectivo", "DIO/DSO/DPO + ciclo neto")}>
              <CashCycleChart data={data} markYear={year} title="Ciclo de Efectivo" subtitle="DIO/DSO/DPO + ciclo neto" />
            </Card>
            <Card compact className="min-h-[160px] flex-[1.5]"
              onZoom={() => zoom("equity", "Estructura Patrimonial", "Pasivo + patrimonio · montos ↔ %")}>
              <EquityStructureBars data={data} markYear={year} title="Estructura Patrimonial" subtitle="Pasivo + patrimonio · montos ↔ %" />
            </Card>
          </div>

          {/* ── Sección derecha (30 %) ── */}
          <div className="dash-col flex min-h-0 flex-1 flex-col gap-2 lg:w-[30%] lg:max-w-[30%] lg:shrink-0">
            <Card title="Estado de Situación Financiera" subtitle={`Activo = Pasivo + Patrimonio · ${year}`} compact className="min-h-[200px] lg:flex-1"
              onZoom={() => zoom("treemap", "Estado de Situación Financiera", `Activo = Pasivo + Patrimonio · ${year}`)}>
              <TreemapESF data={data} year={year} />
            </Card>
            <Card title="Operaciones por País" subtitle="Presencia de Alicorp · clic para detalles" compact className="min-h-[200px] lg:flex-1"
              onZoom={() => zoom("ops", "Operaciones por País", "Presencia de Alicorp · clic para detalles")}>
              <OperationsMap data={data} year={year} />
            </Card>
          </div>
        </div>
      </div>

      {/* ---- Modal de zoom ---- */}
      <ZoomModal open={!!zoomed} onClose={closeZoom} title={zoomed?.title} subtitle={zoomed?.subtitle}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          {zoomed?.id === "income" && <IncomeStatementLine data={data} markYear={year} title="Estado de Resultados" subtitle="Ventas · costos · gastos · utilidad neta · 2010–2025" />}
          {zoomed?.id === "ratios" && <RatioPanel data={data} markYear={year} title="Panel de Ratios" subtitle="Elige los ratios a comparar" selected={ratios.selected} mode={ratios.mode} onSelected={ratios.setSelected} onMode={ratios.setMode} />}
          {zoomed?.id === "waterfall" && <IncomeWaterfall data={data} year={year} title="Cascada del Resultado" subtitle={`Ingresos → utilidad neta · ${year}`} />}
          {zoomed?.id === "earnings" && <EarningsCompositionBars data={data} markYear={year} title="Composición Utilidad Neta" subtitle="Operación vs. subsidiarias" />}
          {zoomed?.id === "cycle" && <CashCycleChart data={data} markYear={year} title="Ciclo de Efectivo" subtitle="DIO/DSO/DPO + ciclo neto" />}
          {zoomed?.id === "equity" && <EquityStructureBars data={data} markYear={year} title="Estructura Patrimonial" subtitle="Pasivo + patrimonio · montos ↔ %" />}
          {zoomed?.id === "treemap" && <TreemapESF data={data} year={year} />}
          {zoomed?.id === "ops" && <OperationsMap data={data} year={year} />}
        </div>
      </ZoomModal>

      {/* ---- Impresión (1 hoja) ---- */}
      <PrintReport data={data} year={year} ratios={ratios} />
    </>
  );
}
