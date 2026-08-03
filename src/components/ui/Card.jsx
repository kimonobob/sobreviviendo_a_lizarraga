// Elementos que se manejan solos: un clic ahí es para ellos, no para ampliar
// la tarjeta. `data-no-zoom` marca las zonas que no son botones pero sí
// interactivas — el mapa, por ejemplo, donde los países son <path> de SVG.
const INTERACTIVE = 'button, a, input, select, textarea, label, [role="button"], [data-no-zoom]';

// Tarjeta de gráfico — reporte de analista: hairline, sin sombras marcadas.
export function Card({ title, subtitle, right, onZoom, children, className = "", compact = false }) {
  const hpad = compact ? "px-3.5 py-2" : "px-5 py-3.5";
  const bpad = compact ? "p-3" : "p-5";

  // La tarjeta entera amplía. Se descartan los clics que van a un control
  // propio del gráfico y los que solo terminan de seleccionar texto.
  const handleClick = (e) => {
    if (!onZoom) return;
    if (e.target.closest?.(INTERACTIVE)) return;
    if (window.getSelection?.()?.toString()) return;
    onZoom();
  };

  return (
    <section
      onClick={handleClick}
      className={`group relative flex min-h-0 flex-col rounded-lg border border-hair bg-surface ${
        onZoom
          ? "cursor-zoom-in transition-colors hover:border-brand/40 [&_a]:cursor-pointer [&_button]:cursor-pointer"
          : ""
      } ${className}`}
    >
      {(title || right) && (
        <header
          // La pista va aquí y no en toda la tarjeta: un `title` sobre el
          // gráfico saldría cada vez que el ratón se posa a leer un dato.
          title={onZoom ? "Clic para ampliar" : undefined}
          className={`flex shrink-0 items-start justify-between gap-3 border-b border-hair ${hpad}`}
        >
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
    </section>
  );
}
