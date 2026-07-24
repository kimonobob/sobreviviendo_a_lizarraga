import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export function ZoomModal({ open, onClose, title, subtitle, children }) {
  const esc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open, esc]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex h-[70vh] w-full max-w-[70vw] flex-col rounded-xl border border-hair bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-hair px-5 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-[13px] font-semibold uppercase tracking-wide text-ink">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[11px] leading-snug text-ink-secondary line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hair bg-surface text-ink-muted transition hover:bg-plane hover:text-ink"
            title="Cerrar (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
