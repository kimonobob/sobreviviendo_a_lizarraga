import { useState, useEffect, useCallback } from "react";
import { useFinancials } from "./data/useFinancials";
import { Dashboard, KpiStrip } from "./sections/Dashboard";
import { AnnualDashboard } from "./sections/AnnualDashboard";
import { YearSelector } from "./components/ui/YearSelector";
import { ThemeToggle } from "./components/ui/ThemeToggle";

function initialFromURL(param, fallback) {
  try {
    const v = new URLSearchParams(location.search).get(param);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function initialYear() {
  const raw = initialFromURL("year", null);
  if (raw == null) return null;
  const q = Number(raw);
  return Number.isFinite(q) && q >= 2010 && q <= 2025 ? q : null;
}

function syncURL(key, value) {
  const url = new URL(location.href);
  if (value == null || value === "" || value === "serie") {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }
  history.replaceState(null, "", url);
}

export default function App() {
  const { data, error } = useFinancials();
  const [year, setYear] = useState(initialYear);
  const [view, setView] = useState(() => initialFromURL("view", "serie"));
  const [ratSelected, setRatSelected] = useState(["roa", "roe"]);
  const [ratMode, setRatMode] = useState("valor");

  useEffect(() => { syncURL("year", year); }, [year]);
  useEffect(() => { syncURL("view", view); }, [view]);

  const toggleView = useCallback(() => {
    setView((v) => (v === "serie" ? "anual" : "serie"));
  }, []);

  if (error) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <p className="text-brand">No se pudieron cargar los datos.</p>
          <p className="mt-1 text-sm text-ink-secondary">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid h-full place-items-center">
        <p className="text-ink-muted">Cargando estados financieros…</p>
      </div>
    );
  }

  const years = data.meta.years;
  const selYear = year ?? years[years.length - 1];
  const isAnual = view === "anual";
  const ratios = {
    selected: ratSelected,
    mode: ratMode,
    setSelected: setRatSelected,
    setMode: setRatMode,
  };

  return (
    <div className="flex h-full flex-col">
      <header className="screen-only z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-hair bg-surface px-4 py-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
            A
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-ink">
              Alicorp S.A.A. — Análisis Financiero
            </h1>
            <p className="text-[11px] leading-tight text-ink-secondary">
              EEFF separados · {years[0]}–{years[years.length - 1]} · {data.meta.unidad}
            </p>
          </div>
        </div>
        <KpiStrip data={data} year={selYear} />
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleView}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
              isAnual
                ? "border-brand bg-brand text-white"
                : "border-hair bg-surface text-ink-secondary hover:border-brand hover:text-brand"
            }`}
            title={isAnual ? "Volver a vista de serie (2010–2025)" : "Cambiar a vista anual (fotografía de un año)"}
          >
            <span aria-hidden>{isAnual ? "📈" : "▦"}</span>
            {isAnual ? "Ver serie" : "Vista anual"}
          </button>
          <YearSelector years={years} value={selYear} onChange={setYear} />
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-8 items-center gap-1.5 rounded-md border border-hair bg-surface px-3 text-xs font-medium text-ink-secondary hover:border-brand hover:text-brand"
            title="Imprimir el reporte (respeta el año y los ratios seleccionados)"
          >
            <span aria-hidden>⎙</span> Imprimir
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main
        className={
          isAnual
            ? "min-h-0 flex-1 overflow-y-auto p-3"
            : "min-h-0 flex-1 overflow-y-auto p-3 lg:flex lg:flex-col lg:overflow-hidden"
        }
      >
        {isAnual ? (
          <AnnualDashboard data={data} year={selYear} ratios={ratios} />
        ) : (
          <Dashboard data={data} year={selYear} ratios={ratios} />
        )}
      </main>
    </div>
  );
}
