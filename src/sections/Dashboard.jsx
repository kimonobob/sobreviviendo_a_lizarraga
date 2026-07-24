import { erVals, ratioItem, yearIndex } from "../lib/finance";
import { soles, pct, veces } from "../lib/format";
import { Card } from "../components/ui/Card";
import { IncomeStatementLine } from "../components/charts/IncomeStatementLine";
import { SituacionFinancieraRadial } from "../components/charts/SituacionFinancieraRadial";
import { BalanceRadialPrint } from "../components/charts/BalanceRadialPrint";
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

function KpiStrip({ data, year, print = false }) {
  const items = kpis(data, year);
  return (
    <div className={`grid shrink-0 grid-cols-3 gap-2 sm:grid-cols-6 ${print ? "" : "screen-only"}`}>
      {items.map((k) => (
        <div key={k.label} className="flex flex-col justify-center rounded-md border border-hair bg-surface px-3 py-1.5">
          <span className="truncate text-[10px] uppercase tracking-wide text-ink-muted">{k.label}</span>
          <span className="flex items-baseline gap-1.5">
            <span className={`tnum text-lg font-semibold leading-tight ${k.accent ? "text-brand" : "text-ink"}`}>
              {k.value}
            </span>
            {k.delta != null && (
              <span
                className="tnum text-[10px] font-medium"
                style={{ color: k.delta >= 0 ? "var(--flow-up)" : "var(--flow-down)" }}
              >
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

// ---- Reporte de impresión (siempre montado, fuera de pantalla) --------------
function PrintReport({ data, year, ratios }) {
  const selNames = ratios.selected.map((id) => {
    for (const g of data.ratios.grupos) {
      const it = g.items.find((x) => x.id === id);
      if (it) return it.label.replace(/\s*\(.*?\)\s*/g, "");
    }
    return id;
  });
  return (
    <div className="print-report print-only text-black">
      <div className="mb-3 flex items-end justify-between border-b border-neutral-300 pb-2">
        <div>
          <h1 className="text-lg font-bold">Alicorp S.A.A. — Análisis Financiero</h1>
          <p className="text-xs text-neutral-600">
            {data.meta.base} · {data.meta.unidad} · {data.meta.fuente}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand">{year}</div>
          <div className="text-[11px] text-neutral-600">Año de análisis</div>
        </div>
      </div>
      <p className="mb-3 text-xs text-neutral-700">
        <strong>Ratios seleccionados:</strong> {selNames.join(" · ")} — vista{" "}
        {ratios.mode === "index" ? "Base 100" : "Valor"}.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 break-avoid rounded border border-neutral-300 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-700">Estado de Resultados 2010–2025</div>
          <IncomeStatementLine data={data} markYear={year} chart={{ w: 1000, h: 178 }} />
        </div>
        <div className="break-avoid rounded border border-neutral-300 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-700">Cascada del Resultado · {year}</div>
          <IncomeWaterfall data={data} year={year} chart={{ w: 492, h: 168 }} />
        </div>
        <div className="break-avoid rounded border border-neutral-300 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-700">Composición de la Utilidad Neta</div>
          <EarningsCompositionBars data={data} markYear={year} chart={{ w: 492, h: 168 }} />
        </div>
        <div className="break-avoid rounded border border-neutral-300 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-700">Ciclo de Conversión de Efectivo</div>
          <CashCycleChart data={data} markYear={year} chart={{ w: 492, h: 158 }} />
        </div>
        <div className="break-avoid rounded border border-neutral-300 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-700">Estructura Patrimonial</div>
          <EquityStructureBars data={data} markYear={year} chart={{ w: 492, h: 158 }} />
        </div>
        <div className="col-span-2 break-avoid rounded border border-neutral-300 p-2">
          <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-700">Panel de Ratios</div>
          <RatioPanel data={data} markYear={year} selected={ratios.selected} mode={ratios.mode} chartOnly chart={{ w: 1000, h: 188 }} />
        </div>
      </div>

      {/* Página 2: balance de todos los años */}
      <div className="print-page-break pt-4">
        <BalanceRadialPrint data={data} />
      </div>

      <p className="mt-4 text-[10px] text-neutral-500">
        Base separada — el Activo y la Utilidad neta están dominados por inversiones en subsidiarias (método de
        participación). La reducción de capital 2024–2025 eleva artificialmente el ROE y el apalancamiento.
      </p>
    </div>
  );
}

export function Dashboard({ data, year, ratios }) {
  return (
    <>
      {/* ---- Pantalla: dashboard a viewport completo ---- */}
      <div className="screen-only flex flex-col gap-2 lg:min-h-0 lg:flex-1">
        <KpiStrip data={data} year={year} />
        <div className="dash-grid grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-4">
          <Card title="Estado de Resultados" subtitle="Ventas · costos · gastos · utilidad neta · 2010–2025" compact className="min-h-[260px] lg:col-span-2 lg:min-h-0">
            <IncomeStatementLine data={data} markYear={year} />
          </Card>
          <Card title="Estado de Situación Financiera" subtitle="Clic en un bloque para fijarlo" compact className="min-h-[300px] lg:col-span-2 lg:min-h-0">
            <SituacionFinancieraRadial data={data} year={year} />
          </Card>

          <Card title="Cascada del Resultado" subtitle={`Ingresos → utilidad neta · ${year}`} compact className="min-h-[260px] lg:min-h-0">
            <IncomeWaterfall data={data} year={year} />
          </Card>
          <Card title="Composición Utilidad Neta" subtitle="Operación vs. subsidiarias" compact className="min-h-[260px] lg:min-h-0">
            <EarningsCompositionBars data={data} markYear={year} />
          </Card>
          <Card title="Ciclo de Efectivo" subtitle="DIO/DSO/DPO + ciclo neto" compact className="min-h-[260px] lg:min-h-0">
            <CashCycleChart data={data} markYear={year} />
          </Card>
          <Card title="Estructura Patrimonial" subtitle="Pasivo + patrimonio · montos ↔ %" compact className="min-h-[260px] lg:min-h-0">
            <EquityStructureBars data={data} markYear={year} />
          </Card>

          <Card title="Panel de Ratios" subtitle="Elige los ratios a comparar en un mismo gráfico" compact className="min-h-[320px] lg:col-span-4 lg:min-h-0">
            <RatioPanel
              data={data}
              markYear={year}
              selected={ratios.selected}
              mode={ratios.mode}
              onSelected={ratios.setSelected}
              onMode={ratios.setMode}
            />
          </Card>
        </div>
      </div>

      {/* ---- Impresión ---- */}
      <PrintReport data={data} year={year} ratios={ratios} />
    </>
  );
}
