/**
 * Banda de años para el pie de una ventana ampliada.
 *
 * Sirve para lo que uno quiere hacer con un gráfico abierto en grande: pasar
 * de un año a otro sin cerrarlo. El gráfico de detrás se redibuja solo, porque
 * el año vive en el estado de la aplicación, no en el modal.
 *
 * `onGoAnnual` añade la salida al otro lado del dashboard: la fotografía de
 * ese año concreto en vez de la serie completa.
 */
export function YearPager({ years, year, onYearChange, onGoAnnual, note, onReset }) {
  const i = years.indexOf(year);
  const step = (d) => {
    const y = years[i + d];
    if (y != null) onYearChange(y);
  };

  const navBtn =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded border border-hair bg-surface text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-hair disabled:hover:text-ink-muted";

  return (
    <div className="flex flex-col gap-1.5">
      {(note || onReset) && (
        <div className="flex items-center justify-between gap-3">
          {note && <p className="text-[9px] leading-tight text-ink-muted">{note}</p>}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="ml-auto shrink-0 rounded border border-hair bg-surface px-2 py-0.5 text-[9px] font-medium text-ink-secondary transition-colors hover:border-brand hover:text-brand"
              title="Volver al gráfico de toda la serie"
            >
              ↺ Ver toda la serie
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button
          type="button"
          className={navBtn}
          onClick={() => step(-1)}
          disabled={i <= 0}
          title="Año anterior"
          aria-label="Año anterior"
        >
          ‹
        </button>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
          {years.map((y) => {
            const active = y === year;
            return (
              <button
                key={y}
                type="button"
                onClick={() => onYearChange(y)}
                aria-current={active}
                className={`tnum rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "border border-hair bg-surface text-ink-secondary hover:border-brand hover:text-brand"
                }`}
                title={`Ver ${y}`}
              >
                {y}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={navBtn}
          onClick={() => step(1)}
          disabled={i < 0 || i >= years.length - 1}
          title="Año siguiente"
          aria-label="Año siguiente"
        >
          ›
        </button>
      </div>

      {onGoAnnual && (
        <button
          type="button"
          onClick={() => onGoAnnual(year)}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-brand bg-brand px-3 text-[11px] font-medium text-white transition-opacity hover:opacity-90"
          title={`Cambiar el dashboard a la vista anual de ${year}`}
        >
          <span aria-hidden>▦</span> Ver {year} en vista anual
        </button>
      )}
      </div>
    </div>
  );
}
