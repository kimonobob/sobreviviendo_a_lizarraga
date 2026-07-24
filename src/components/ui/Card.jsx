// Tarjeta de gráfico — reporte de analista: hairline, sin sombras marcadas.
export function Card({ title, subtitle, right, children, className = "", compact = false }) {
  const hpad = compact ? "px-3.5 py-2" : "px-5 py-3.5";
  const bpad = compact ? "p-3" : "p-5";
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-hair bg-surface ${className}`}
    >
      {(title || right) && (
        <header className={`flex shrink-0 items-start justify-between gap-3 border-b border-hair ${hpad}`}>
          <div className="min-w-0">
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
    </section>
  );
}
