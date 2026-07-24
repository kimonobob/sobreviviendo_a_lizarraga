// Contenedor de tooltip consistente para todos los gráficos Recharts.
export function TooltipBox({ title, children }) {
  return (
    <div className="rounded-md border border-hair bg-surface px-3 py-2 shadow-sm">
      {title != null && (
        <div className="tnum mb-1 text-xs font-semibold text-ink">{title}</div>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function TooltipRow({ color, label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="flex items-center gap-1.5 text-ink-secondary">
        {color && (
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: color }}
          />
        )}
        {label}
      </span>
      <span className={`tnum ${strong ? "font-semibold text-ink" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}
