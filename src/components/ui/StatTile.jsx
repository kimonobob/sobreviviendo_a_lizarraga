// KPI compacto — número protagonista, delta con estado (nunca color solo).
export function StatTile({ label, value, delta, deltaLabel, hint, accent = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-hair bg-surface px-4 py-3">
      <span className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</span>
      <span
        className={`tnum text-2xl font-semibold leading-none ${
          accent ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </span>
      {(delta != null || hint) && (
        <span className="flex items-center gap-1 text-xs">
          {delta != null && (
            <span
              className="tnum font-medium"
              style={{ color: delta >= 0 ? "var(--flow-up)" : "var(--flow-down)" }}
            >
              {delta >= 0 ? "▲" : "▼"} {deltaLabel}
            </span>
          )}
          {hint && <span className="text-ink-muted">{hint}</span>}
        </span>
      )}
    </div>
  );
}
