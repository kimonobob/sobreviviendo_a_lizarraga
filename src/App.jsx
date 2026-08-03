import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useFinancials } from "./data/useFinancials";
import { Dashboard } from "./sections/Dashboard";
import { AnnualDashboard } from "./sections/AnnualDashboard";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { YearTimeline } from "./components/ui/YearTimeline";

const TimelineView = lazy(() =>
  import("./sections/TimelineView").then((m) => ({ default: m.TimelineView }))
);

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

  const toggleTimeline = useCallback(() => {
    setView((v) => (v === "timeline" ? "serie" : "timeline"));
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
  const isTimeline = view === "timeline";
  const isAnual = isTimeline ? false : view === "anual";
  const ratios = {
    selected: ratSelected,
    mode: ratMode,
    setSelected: setRatSelected,
    setMode: setRatMode,
  };

  return (
    <div className="flex h-full flex-col">
      <header className="screen-only z-20 flex shrink-0 flex-wrap items-center gap-3 border-b border-hair bg-surface px-4 py-2">
        <div className="flex shrink-0 items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL || "/"}logo-alicorp.png`}
            alt="Alicorp"
            className="h-9 w-auto shrink-0"
          />
          <div>
            <h1 className="text-sm font-semibold leading-tight text-ink">
              Alicorp S.A.A.
            </h1>
            <p className="text-[11px] leading-tight text-ink-secondary">
              EEFF separados · {years[0]}–{years[years.length - 1]}
            </p>
          </div>
        </div>
        {!isTimeline && (
          <YearTimeline data={data} year={selYear} onYearChange={setYear} />
        )}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTimeline}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
              isTimeline
                ? "border-brand bg-brand text-white"
                : "border-hair bg-surface text-ink-secondary hover:border-brand hover:text-brand"
            }`}
            title={isTimeline ? "Volver al dashboard" : "Ver línea de tiempo de Alicorp"}
          >
            {/* Eje con tramos de ancho creciente: adelanta el gesto de la
                pantalla, donde el grosor de la línea son los ingresos. */}
            <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <rect x="0.9" y="1" width="1.6" height="12" rx="0.8" opacity=".45" />
              <rect x="4" y="2.2" width="5" height="1.7" rx="0.85" opacity=".55" />
              <rect x="4" y="6.15" width="7.5" height="1.7" rx="0.85" opacity=".8" />
              <rect x="4" y="10.1" width="9.6" height="1.7" rx="0.85" />
            </svg>
            {isTimeline ? "Dashboard" : "Línea de Tiempo"}
          </button>
          {!isTimeline && (
            <>
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
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-8 items-center gap-1.5 rounded-md border border-hair bg-surface px-3 text-xs font-medium text-ink-secondary hover:border-brand hover:text-brand"
                title="Imprimir el reporte (respeta el año y los ratios seleccionados)"
              >
                <span aria-hidden>⎙</span> Imprimir
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-3">
        {isTimeline ? (
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <p className="text-ink-muted">Cargando línea de tiempo…</p>
              </div>
            }
          >
            <TimelineView />
          </Suspense>
        ) : isAnual ? (
          <AnnualDashboard data={data} year={selYear} ratios={ratios} />
        ) : (
          <Dashboard
            data={data}
            year={selYear}
            ratios={ratios}
            onGoAnnual={(y) => {
              setYear(y);
              setView("anual");
            }}
          />
        )}
      </main>
    </div>
  );
}
