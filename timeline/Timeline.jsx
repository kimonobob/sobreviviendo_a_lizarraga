import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { soles } from "../src/lib/format";
import { LogoImg } from "./LogoImg";
import { Presentation } from "./Presentation";
import {
  CATEGORIES,
  ERAS,
  EVENTS,
  FIN_BY_YEAR,
  categoryById,
  categoryColor,
  eraOf,
} from "./timelineData";
import "./time.css";

const FIRST_YEAR = EVENTS[0].year;
const LAST_YEAR = EVENTS[EVENTS.length - 1].year;

/** Cifras del EEFF separado del año, si existen (solo 2010–2025). */
function FinStrip({ year }) {
  const fin = FIN_BY_YEAR[year];
  if (!fin) return null;
  return (
    <div className="tl-fin">
      <div className="tl-fin-item">
        <span className="tl-fin-k">Ingresos</span>
        <span className="tl-fin-v">{soles(fin.ingresos)}</span>
      </div>
      <div className="tl-fin-item">
        <span className="tl-fin-k">U. operativa</span>
        <span className="tl-fin-v">{soles(fin.operativa)}</span>
      </div>
      <div className="tl-fin-item">
        <span className="tl-fin-k">U. neta</span>
        <span className="tl-fin-v" data-neg={fin.neta < 0}>
          {soles(fin.neta)}
        </span>
      </div>
    </div>
  );
}

/** Medidas de la tarjeta ampliada, para poder encajarla en pantalla. */
const PREVIEW_W = 420;
const PREVIEW_H = 600;

/**
 * Tarjeta ampliada que aparece al pasar el cursor por un año.
 * Va montada en el <body> porque el carril recorta verticalmente y
 * el contenedor del rail tiene un transform de animación.
 */
function Preview({ ev, x, y }) {
  const cat = categoryById(ev.category);
  return createPortal(
    <div
      className="tl-preview"
      style={{ left: `${x}px`, top: `${y}px`, "--tl-cat": categoryColor(ev.category) }}
      aria-hidden
    >
      {ev.images?.length > 0 && (
        <div className="tl-pv-logos" data-count={Math.min(ev.images.length, 4)}>
          {ev.images.slice(0, 4).map((img) => (
            <span key={img.src} className="tl-pv-logo">
              <LogoImg src={img.src} label={img.label} />
            </span>
          ))}
        </div>
      )}

      <div className="tl-pv-head">
        <span className="tl-pv-year">{ev.year}</span>
        <span className="tl-pv-cat">{cat.label}</span>
        <span className="tl-pv-flags">{ev.flags.join(" ")}</span>
      </div>

      <h3 className="tl-pv-title">{ev.title}</h3>
      <p className="tl-pv-text">{ev.text}</p>

      {ev.tags?.length > 0 && (
        <div className="tl-pv-tags">
          {ev.tags.map((t) => (
            <span key={t} className="tl-pv-tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <FinStrip year={ev.year} />
      {ev.note && <p className="tl-pv-note">{ev.note}</p>}
    </div>,
    document.body
  );
}

export function Timeline() {
  const itemRefs = useRef(new Map());
  const hoverTimer = useRef(null);

  const [hidden, setHidden] = useState([]);
  const [selYear, setSelYear] = useState(FIRST_YEAR);
  const [presenting, setPresenting] = useState(false);
  const [preview, setPreview] = useState(null);

  const visible = useMemo(
    () => EVENTS.filter((e) => !hidden.includes(e.category)),
    [hidden]
  );

  const counts = useMemo(() => {
    const m = {};
    for (const e of EVENTS) m[e.category] = (m[e.category] ?? 0) + 1;
    return m;
  }, []);

  const selIndex = visible.findIndex((e) => e.year === selYear);
  const activeEra = eraOf(selYear);

  const focus = useCallback((year, { scroll = true } = {}) => {
    setSelYear(year);
    if (!scroll) return;
    const el = itemRefs.current.get(year);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const step = useCallback(
    (delta) => {
      if (visible.length === 0) return;
      const from = selIndex === -1 ? 0 : selIndex + delta;
      const next = Math.min(visible.length - 1, Math.max(0, from));
      focus(visible[next].year);
    },
    [focus, selIndex, visible]
  );

  // Si un filtro esconde el hito seleccionado, salta al más cercano visible.
  useEffect(() => {
    if (visible.length === 0) return;
    if (visible.some((e) => e.year === selYear)) return;
    const nearest = visible.reduce((best, e) =>
      Math.abs(e.year - selYear) < Math.abs(best.year - selYear) ? e : best
    );
    setSelYear(nearest.year);
  }, [visible, selYear]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (visible[0]) focus(visible[0].year);
    } else if (e.key === "End") {
      e.preventDefault();
      if (visible.length) focus(visible[visible.length - 1].year);
    }
  };

  /* ── Vista ampliada al pasar el cursor ────────────────────────────── */

  const closePreview = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setPreview(null);
  }, []);

  /** Ancla la tarjeta ampliada sobre el año, sin que se salga de la pantalla. */
  const openPreview = useCallback((ev, el) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const r = el.getBoundingClientRect();
      const halfW = PREVIEW_W / 2 + 12;
      const halfH = PREVIEW_H / 2 + 12;
      setPreview({
        ev,
        x: Math.min(Math.max(r.left + r.width / 2, halfW), window.innerWidth - halfW),
        y: Math.min(Math.max(r.top + r.height / 2, halfH), window.innerHeight - halfH),
      });
    }, 120); // pequeña espera: evita parpadeos al barrer el carril
  }, []);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // El scroll lo hace la página, así que la posición anclada se invalida ahí.
  useEffect(() => {
    window.addEventListener("scroll", closePreview, true);
    return () => window.removeEventListener("scroll", closePreview, true);
  }, [closePreview]);

  // Si el carril se mueve o se abre la presentación, la posición ya no vale.
  useEffect(() => {
    if (presenting) closePreview();
  }, [presenting, closePreview]);

  const toggleCat = (id) =>
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  const goToEra = (era) => {
    const target = visible.find((e) => e.year >= era.from && e.year <= era.to);
    if (target) focus(target.year);
  };

  return (
    <div className="tl-screen">
      <div className="tl-head">
        <div>
          <h2 className="tl-title">Evolución de Alicorp S.A.A.</h2>
          <p className="tl-sub">
            {EVENTS.length} hitos corporativos · {FIRST_YEAR}–{LAST_YEAR} · de Anderson Clayton
            a la Alicorp de hoy. Las cifras son del EEFF <strong>separado</strong> (S/ millones).
          </p>
        </div>
        <div className="tl-actions">
          <button
            type="button"
            className="tl-present"
            onClick={() => setPresenting(true)}
            title="Recorrer la línea de tiempo año por año, a pantalla completa"
          >
            ▶ Presentación
          </button>
          <div className="tl-filters">
            {CATEGORIES.map((c) => {
              const on = !hidden.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="tl-chip"
                  aria-pressed={on}
                  onClick={() => toggleCat(c.id)}
                  style={{ "--tl-chip": `var(${c.varName})` }}
                  title={`${on ? "Ocultar" : "Mostrar"} hitos de ${c.label.toLowerCase()}`}
                >
                  <span className="tl-chip-dot" />
                  {c.label}
                  <span className="tl-chip-count">{counts[c.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tl-eras">
        {ERAS.map((era) => (
          <button
            key={era.id}
            type="button"
            className="tl-era"
            data-active={era.id === activeEra.id}
            onClick={() => goToEra(era)}
            title={era.note}
          >
            <span className="tl-era-range">
              {era.from}–{era.to}
            </span>
            <span className="tl-era-label">{era.label}</span>
          </button>
        ))}
      </div>

      <div className="tl-viewport">
        <button
          type="button"
          className="tl-nav tl-nav-prev"
          onClick={() => step(-1)}
          disabled={selIndex <= 0}
          aria-label="Hito anterior"
          title="Hito anterior"
        >
          ↑
        </button>
        <button
          type="button"
          className="tl-nav tl-nav-next"
          onClick={() => step(1)}
          disabled={selIndex >= visible.length - 1}
          aria-label="Hito siguiente"
          title="Hito siguiente"
        >
          ↓
        </button>

        <div
          className="tl-rail"
          tabIndex={0}
          role="group"
          aria-label="Línea de tiempo de hitos de Alicorp"
          onKeyDown={onKeyDown}
          onMouseLeave={closePreview}
        >
          {visible.length === 0 ? (
            <p className="tl-empty">
              Ningún hito coincide con los filtros. Vuelve a activar alguna categoría.
            </p>
          ) : (
            <div className="tl-track" role="list">
              {visible.map((ev, i) => {
                const cat = categoryById(ev.category);
                const selected = ev.year === selYear;
                return (
                  <div
                    key={ev.year}
                    role="listitem"
                    ref={(el) => {
                      if (el) itemRefs.current.set(ev.year, el);
                      else itemRefs.current.delete(ev.year);
                    }}
                    className="tl-item"
                    data-side={i % 2 === 0 ? "up" : "down"}
                    data-selected={selected}
                    data-preview={preview?.ev.year === ev.year}
                    style={{ "--tl-cat": categoryColor(ev.category), "--i": i }}
                  >
                    <div className="tl-cell">
                      <article
                        className="tl-card"
                        onClick={() => focus(ev.year, { scroll: false })}
                        onMouseEnter={(e) => openPreview(ev, e.currentTarget)}
                        onMouseLeave={closePreview}
                      >
                        <div className="tl-card-top">
                          <span className="tl-cat">{cat.label}</span>
                          <span className="tl-flags">{ev.flags.join(" ")}</span>
                        </div>
                        <h3 className="tl-card-title">{ev.title}</h3>
                        {ev.images?.length > 0 && (
                          <div className="tl-thumbs">
                            {ev.images.slice(0, 3).map((img) => (
                              <span key={img.src} className="tl-thumb">
                                <LogoImg src={img.src} label={img.label} />
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="tl-card-text">{ev.text}</p>
                        {ev.tags?.length > 0 && (
                          <div className="tl-tags">
                            {ev.tags.map((t) => (
                              <span key={t} className="tl-tag">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <FinStrip year={ev.year} />
                        {selected && ev.note && <p className="tl-note">{ev.note}</p>}
                      </article>
                    </div>

                    <div className="tl-axis">
                      <button
                        type="button"
                        className="tl-node"
                        onClick={() => focus(ev.year)}
                        onMouseEnter={(e) => openPreview(ev, e.currentTarget)}
                        onMouseLeave={closePreview}
                        aria-current={selected}
                        title={ev.title}
                      >
                        {ev.year}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="tl-hint">
        <span>
          Desplázate para recorrer la línea · <span className="tl-kbd">↑</span>{" "}
          <span className="tl-kbd">↓</span> salta de hito ·{" "}
          <span className="tl-kbd">Inicio</span> / <span className="tl-kbd">Fin</span> extremos ·
          pasa el cursor por un año para verlo en grande · <strong>Presentación</strong> para
          recorrerlo a pantalla completa
        </span>
        <span>
          Mostrando {visible.length} de {EVENTS.length} hitos · era actual: {activeEra.label}
        </span>
      </div>

      {preview && !presenting && (
        <Preview ev={preview.ev} x={preview.x} y={preview.y} />
      )}

      {presenting && (
        <Presentation
          startIndex={Math.max(0, EVENTS.findIndex((e) => e.year === selYear))}
          onClose={() => setPresenting(false)}
          onExitAt={(year) => focus(year)}
        />
      )}
    </div>
  );
}
