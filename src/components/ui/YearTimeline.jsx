import { useState, useEffect, useLayoutEffect, useRef } from "react";

/** Lámina resumen de la evolución de Alicorp (public/timeline/). */
const RESUMEN = `${import.meta.env.BASE_URL || "/"}timeline/resumen-evolucion-alicorp.png`;

/* ─── Header strip: year rail, full width ────────────────────────────────── */
export function YearTimeline({ data, year, onYearChange }) {
  const [expanded, setExpanded] = useState(false);
  const years = data.meta.years;

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          {years.map((y, i) => {
            const active = y === year;
            const isFirst = i === 0;
            const isLast = i === years.length - 1;
            const isFive = y % 5 === 0;
            const showLabel = active || isFirst || isLast || isFive;

            return (
              <button
                key={y}
                type="button"
                onClick={() => onYearChange(y)}
                className="group relative flex flex-1 flex-col items-center"
                title={String(y)}
              >
                {i > 0 && (
                  <div
                    className={`absolute top-[6px] h-[2px] ${y <= year ? "bg-brand" : "bg-hair"}`}
                    style={{ left: 0, right: 0 }}
                  />
                )}
                <div
                  className={`relative z-10 rounded-full transition-all ${
                    active
                      ? "h-3.5 w-3.5 border-2 border-brand bg-brand shadow-[0_0_6px_var(--brand)]"
                      : "h-2 w-2 border border-hair bg-surface group-hover:border-brand group-hover:bg-brand/30"
                  }`}
                />
                {showLabel && (
                  <span className={`mt-0.5 select-none text-[9px] leading-none ${active ? "font-bold text-brand" : "text-ink-muted"}`}>
                    {y}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hair bg-surface text-ink-muted transition-colors hover:border-brand hover:text-brand"
          title="Ver la lámina resumen de la evolución de Alicorp"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      <TimelineModal open={expanded} onClose={() => setExpanded(false)} />
    </>
  );
}

/* ─── Modal: lámina resumen a pantalla grande, con lupa y arrastre ───────── */
function TimelineModal({ open, onClose }) {
  const [zoom, setZoom] = useState(false);
  const scrollRef = useRef(null);
  const drag = useRef(null);
  const focal = useRef(null); // punto donde se hizo clic, para centrar al ampliar
  const suppressClick = useRef(false); // un arrastre no debe alternar el zoom

  // Esc cierra; al cerrar se vuelve al encuadre completo.
  useEffect(() => {
    if (!open) {
      setZoom(false);
      return;
    }
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "0") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Tras ampliar, centra la vista en el punto donde el usuario hizo clic.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!zoom) {
      el.scrollTo(0, 0);
      return;
    }
    const f = focal.current ?? { rx: 0.5, ry: 0.5 };
    el.scrollLeft = f.rx * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = f.ry * el.scrollHeight - el.clientHeight / 2;
  }, [zoom]);

  const onImageClick = (e) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (zoom) {
      setZoom(false);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    focal.current = {
      rx: (e.clientX - r.left) / r.width,
      ry: (e.clientY - r.top) / r.height,
    };
    setZoom(true);
  };

  const onMouseDown = (e) => {
    if (!zoom) return;
    const el = scrollRef.current;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop, moved: false };
  };

  const onMouseMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    const el = scrollRef.current;
    el.scrollLeft = d.left - dx;
    el.scrollTop = d.top - dy;
  };

  const endDrag = () => {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="relative mx-3 flex h-[94vh] w-full max-w-[96vw] flex-col rounded-xl border border-hair bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-hair px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink">
              Evolución de Alicorp S.A.A. — Resumen
            </h2>
            <p className="mt-0.5 text-[11px] text-ink-secondary">
              1956–2025 · orígenes, expansión regional, adquisiciones y reenfoque de portafolio
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                focal.current = null;
                setZoom((v) => !v);
              }}
              className="flex h-7 items-center gap-1.5 rounded-md border border-hair bg-surface px-2.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand hover:text-brand"
              title={zoom ? "Ajustar a la pantalla" : "Ver al 100% (clic en la imagen para acercar donde quieras)"}
            >
              {zoom ? "⤢ Ajustar" : "⤡ 100%"}
            </button>
            <a
              href={RESUMEN}
              target="_blank"
              rel="noreferrer"
              className="flex h-7 items-center gap-1.5 rounded-md border border-hair bg-surface px-2.5 text-[11px] font-medium text-ink-secondary transition hover:border-brand hover:text-brand"
              title="Abrir la lámina en una pestaña nueva"
            >
              ↗ Abrir
            </a>
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
          </div>
        </header>

        <div
          ref={scrollRef}
          className={`min-h-0 flex-1 bg-plane ${zoom ? "overflow-auto" : "grid place-items-center overflow-hidden p-3"}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          {open && (
            <img
              src={RESUMEN}
              alt="Lámina resumen de la evolución de Alicorp S.A.A. entre 1956 y 2025"
              onClick={onImageClick}
              draggable={false}
              className={
                zoom
                  ? "max-w-none select-none cursor-grab active:cursor-grabbing"
                  : "max-h-full max-w-full select-none object-contain cursor-zoom-in"
              }
            />
          )}
        </div>

        <footer className="shrink-0 border-t border-hair px-5 py-2 text-[10px] text-ink-muted">
          Clic en la lámina para acercar al 100% en ese punto · arrastra para moverte ·{" "}
          <kbd className="rounded border border-hair px-1">0</kbd> vuelve al encuadre completo ·{" "}
          <kbd className="rounded border border-hair px-1">Esc</kbd> cierra
        </footer>
      </div>
    </div>
  );
}
