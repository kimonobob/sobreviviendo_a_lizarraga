// Tarjeta de gráfico — reporte de analista: hairline, sin sombras marcadas.
export function Card({ title, subtitle, right, onZoom, children, className = "", compact = false }) {
  const hpad = compact ? "px-3.5 py-2" : "px-5 py-3.5";
  const bpad = compact ? "p-3" : "p-5";
  return (
    <section
      className={`group relative flex min-h-0 flex-col rounded-lg border border-hair bg-surface ${className}`}
    >
      {(title || right) && (
        <header className={`flex shrink-0 items-start justify-between gap-3 border-b border-hair ${hpad}`}>
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="truncate text-[12px] font-semibold uppercase tracking-wide text-ink">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[11px] leading-snug text-ink-secondary line-clamp-2">{subtitle}</p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      <div className={`flex min-h-0 flex-1 flex-col ${bpad}`}>{children}</div>
      {onZoom && (
        <button
          onClick={onZoom}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-hair bg-surface/70 text-ink-muted opacity-40 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-surface hover:text-ink hover:opacity-100"
          title="Ampliar gráfico"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      )}
    </section>
  );
}
