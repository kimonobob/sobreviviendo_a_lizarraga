// Conmutador segmentado (ej: Montos ↔ %, o Nominal ↔ Composición).
export function SegToggle({ options, value, onChange, size = "sm" }) {
  const pad = size === "xs" ? "px-2 py-0.5 text-[9px]" : size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <div className="inline-flex rounded-md border border-hair bg-plane p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded ${pad} font-medium transition-colors ${
            value === o.value
              ? "bg-surface text-brand shadow-[0_0_0_1px_var(--border-hair)]"
              : "text-ink-secondary hover:text-ink"
          }`}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
