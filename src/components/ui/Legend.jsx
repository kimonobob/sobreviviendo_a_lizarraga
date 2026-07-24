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
            className={`group flex items-center gap-1.5 text-xs transition-opacity ${
              on ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
            aria-pressed={on}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-black/10"
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
        <span key={it.id} className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-black/10"
            style={{ background: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
