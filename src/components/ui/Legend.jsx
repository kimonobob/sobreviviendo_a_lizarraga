// Leyenda interactiva: enciende/apaga series (para el ER lineal y el panel de ratios).
export function ToggleLegend({ items, active, onToggle }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => {
        const on = active.includes(it.id);
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onToggle(it.id)}
            className={`group flex items-center gap-1.5 text-[9px] transition-opacity ${
              on ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
            aria-pressed={on}
          >
            <span
              className="inline-block h-2 w-2 rounded-sm ring-1 ring-inset ring-black/10"
              style={{ background: it.color }}
            />
            <span className={on ? "text-ink" : "text-ink-secondary line-through"}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Leyenda estática (identidad sin color-solo)
export function StaticLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.id} className="flex items-center gap-1.5 text-[9px] text-ink-secondary">
          <span
            className="inline-block h-2 w-2 rounded-sm ring-1 ring-inset ring-black/10"
            style={{ background: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// Leyenda responsive: horizontal en móvil, vertical en desktop (para lado derecho).
export function ResponsiveLegend({ items, active, onToggle, interactive = false }) {
  const renderItem = (it) => {
    if (interactive) {
      const on = active.includes(it.id);
      return (
        <button
          key={it.id}
          type="button"
          onClick={() => onToggle(it.id)}
          className={`group flex items-center gap-1.5 text-[9px] transition-opacity ${
            on ? "opacity-100" : "opacity-40 hover:opacity-70"
          }`}
          aria-pressed={on}
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-sm ring-1 ring-inset ring-black/10"
            style={{ background: it.color }}
          />
          <span className={on ? "text-ink" : "text-ink-secondary line-through"}>
            {it.label}
          </span>
        </button>
      );
    }
    return (
      <span key={it.id} className="flex items-center gap-1.5 text-[9px] text-ink-secondary">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-sm ring-1 ring-inset ring-black/10"
          style={{ background: it.color }}
        />
        {it.label}
      </span>
    );
  };

  return (
    <>
      {/* Móvil: horizontal */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 lg:hidden">
        {items.map(renderItem)}
      </div>
      {/* Desktop: vertical, centrado al lado derecho del gráfico */}
      <div className="hidden flex-col items-start justify-center gap-2 lg:flex shrink-0">
        {items.map((it) =>
          interactive ? (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(it.id)}
              className={`group flex items-center gap-1.5 text-[9px] transition-opacity whitespace-nowrap ${
                active.includes(it.id) ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
              aria-pressed={active.includes(it.id)}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-sm ring-1 ring-inset ring-black/10"
                style={{ background: it.color }}
              />
              <span className={active.includes(it.id) ? "text-ink" : "text-ink-secondary line-through"}>
                {it.label}
              </span>
            </button>
          ) : (
            <span key={it.id} className="flex items-center gap-1.5 text-[9px] text-ink-secondary whitespace-nowrap">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-sm ring-1 ring-inset ring-black/10"
                style={{ background: it.color }}
              />
              {it.label}
            </span>
          )
        )}
      </div>
    </>
  );
}
