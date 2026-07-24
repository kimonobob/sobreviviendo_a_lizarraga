// Selector de año — controla el Marimekko, la cascada del ER y el resaltado.
export function YearSelector({ years, value, onChange, label = "Año" }) {
  const idx = years.indexOf(value);
  const go = (d) => {
    const n = idx + d;
    if (n >= 0 && n < years.length) onChange(years[n]);
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="flex items-center rounded-md border border-hair bg-plane">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={idx <= 0}
          aria-label="Año anterior"
          className="px-2 py-1 text-ink-secondary enabled:hover:text-brand disabled:opacity-30"
        >
          ‹
        </button>
        <span className="tnum min-w-[3.5ch] px-1 text-center text-sm font-semibold text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={idx >= years.length - 1}
          aria-label="Año siguiente"
          className="px-2 py-1 text-ink-secondary enabled:hover:text-brand disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// Riel de años (chips) para vistas donde conviene ver toda la serie.
export function YearRail({ years, value, onChange }) {
  return (
    <div className="scroll-x -mx-1 flex gap-1 px-1">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => onChange(y)}
          className={`tnum shrink-0 rounded px-2 py-1 text-xs transition-colors ${
            y === value
              ? "bg-brand text-white"
              : "text-ink-secondary hover:bg-plane"
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}
